import type { CartLine } from "./cart";
import { formatMoney, type Currency } from "./menu";
import { supabase } from "./supabase";
import { onlyDigits } from "./tenant";
import type { DeliveryZone } from "./zones";

export type Fulfillment = "pickup" | "delivery";

/** Pedido tal como lo devuelve place_order(): precios y nombres salen de la base de datos. */
export type PlacedOrder = {
  id: string | null;
  number: number | null;
  lines: {
    name: string;
    variant_label: string | null;
    unit_price: number;
    qty: number;
    note: string | null;
  }[];
  subtotal: number;
  delivery_fee: number;
  total: number;
  currency: Currency;
  fulfillment: Fulfillment;
  zone: { name: string; neighborhoods: string[] } | null;
};

export type OrderInput = {
  slug: string;
  lines: CartLine[];
  fulfillment: Fulfillment;
  zone: DeliveryZone | null;
  customerName: string;
  address: string;
  currency: Currency;
};

/** Errores que place_order() lanza a propósito, con el texto para el cliente. */
export const ORDER_ERRORS: Record<string, string> = {
  restaurant_unavailable: "Este restaurante no está recibiendo pedidos en este momento.",
  item_unavailable: "Algún plato de tu pedido ya no está disponible. Revísalo y vuelve a intentar.",
  variant_required: "Elige el tamaño de cada plato antes de enviar.",
  zone_unavailable: "La zona de entrega elegida ya no está disponible. Elige otra.",
  zone_required: "Elige tu zona de entrega.",
  invalid_lines: "Revisa las cantidades de tu pedido.",
  invalid_fulfillment: "Elige si vas a recoger o necesitas delivery.",
  rate_limited: "Hay muchos pedidos en este momento. Intenta de nuevo en un minuto.",
};

export class OrderRejected extends Error {}

/**
 * Registra el pedido en la base de datos. Si la base de datos responde con un
 * rechazo (plato agotado, zona inválida…), lanza OrderRejected con el texto para
 * el cliente. Si falla la conexión, devuelve el pedido armado localmente (sin
 * número) para que el negocio no pierda la venta: igual sale por WhatsApp.
 */
export async function placeOrder(input: OrderInput): Promise<PlacedOrder> {
  const { data, error } = await supabase.rpc("place_order", {
    p_slug: input.slug,
    p_lines: input.lines.map((l) => ({
      item_id: l.itemId,
      variant_id: l.variantId,
      qty: l.qty,
      note: l.note,
    })),
    p_fulfillment: input.fulfillment,
    p_zone_id: input.fulfillment === "delivery" ? (input.zone?.id ?? null) : null,
    p_customer_name: input.customerName || null,
    p_address: input.fulfillment === "delivery" ? input.address || null : null,
  });

  if (error) {
    if (error.code === "P0001") {
      throw new OrderRejected(ORDER_ERRORS[error.message] ?? "No pudimos registrar el pedido.");
    }
    return localOrder(input);
  }
  const o = data as PlacedOrder;
  return {
    ...o,
    subtotal: Number(o.subtotal),
    delivery_fee: Number(o.delivery_fee),
    total: Number(o.total),
    lines: o.lines.map((l) => ({ ...l, unit_price: Number(l.unit_price) })),
  };
}

function localOrder(input: OrderInput): PlacedOrder {
  const subtotal = input.lines.reduce((n, l) => n + l.qty * l.unitPrice, 0);
  const fee = input.fulfillment === "delivery" && input.zone ? input.zone.fee : 0;
  return {
    id: null,
    number: null,
    lines: input.lines.map((l) => ({
      name: l.name,
      variant_label: l.variantLabel,
      unit_price: l.unitPrice,
      qty: l.qty,
      note: l.note.trim() || null,
    })),
    subtotal,
    delivery_fee: fee,
    total: subtotal + fee,
    currency: input.currency,
    fulfillment: input.fulfillment,
    zone:
      input.fulfillment === "delivery" && input.zone
        ? { name: input.zone.name, neighborhoods: input.zone.neighborhoods }
        : null,
  };
}

/** Texto del pedido tal como le llega al negocio por WhatsApp. */
export function buildOrderMessage(
  restaurantName: string,
  order: PlacedOrder,
  customerName: string,
  address: string,
): string {
  const money = (n: number) => formatMoney(n, order.currency);
  const head = order.number
    ? `Hola ${restaurantName}, quiero hacer este pedido (#${order.number}):`
    : `Hola ${restaurantName}, quiero hacer este pedido:`;

  const rows = order.lines.map((l) => {
    const variant = l.variant_label ? ` (${l.variant_label})` : "";
    const line = `• ${l.qty}x ${l.name}${variant} — ${money(l.qty * l.unit_price)}`;
    return l.note ? `${line}\n   Nota: ${l.note}` : line;
  });

  const parts = [head, "", ...rows, ""];

  if (order.fulfillment === "pickup") {
    parts.push("Para recoger en el local");
  } else {
    parts.push(
      order.zone ? `Delivery — ${order.zone.name} (${money(order.delivery_fee)})` : "Delivery",
    );
    if (order.zone?.neighborhoods.length) {
      parts.push(`Barrio dentro de la zona: ${order.zone.neighborhoods.join(", ")}`);
    }
    if (address.trim()) parts.push(`Dirección: ${address.trim()}`);
  }
  parts.push("");

  if (order.delivery_fee > 0) {
    parts.push(`Subtotal: ${money(order.subtotal)}`);
    parts.push(`Delivery: ${money(order.delivery_fee)}`);
  }
  parts.push(`Total: ${money(order.total)}`);
  if (customerName.trim()) parts.push(`Nombre: ${customerName.trim()}`);
  return parts.join("\n");
}

/** Enlace de WhatsApp (abre la app en celular y WhatsApp Web en escritorio). */
export function whatsappUrl(phone: string, text: string): string {
  return `https://wa.me/${onlyDigits(phone)}?text=${encodeURIComponent(text)}`;
}
