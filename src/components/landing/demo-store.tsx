import type { FontStyle, MenuTheme } from "@/lib/brand-color";
import { createContext, useContext, useEffect, useMemo, useReducer, type ReactNode } from "react";

/**
 * Estado compartido de la demo de la landing: el celular del cliente y el panel del
 * dueño leen y escriben lo mismo, por eso lo que se toca en uno aparece en el otro.
 * Es solo una simulación local: no toca la base de datos.
 */

export type CategoryId = "entradas" | "fuertes" | "bebidas";

export type DemoItem = {
  id: string;
  cat: CategoryId;
  name: string;
  desc: string;
  price: number;
  available: boolean;
};

export type Zone = { id: string; name: string; hoods: string; fee: number; active: boolean };

export const RESTAURANT = "La Terraza";
const TAGLINE = "Parrilla criolla y platos para compartir";

export const CATEGORIES: { id: CategoryId; name: string }[] = [
  { id: "entradas", name: "Entradas" },
  { id: "fuertes", name: "Platos fuertes" },
  { id: "bebidas", name: "Bebidas" },
];

/** Los mismos platos que el restaurante demo real (/r/demo). */
const ITEMS: DemoItem[] = [
  {
    id: "tostones",
    cat: "entradas",
    name: "Tostones",
    desc: "Dorados y crujientes, con salsa rosada.",
    price: 250,
    available: true,
  },
  {
    id: "yuquitas",
    cat: "entradas",
    name: "Yuquitas de queso",
    desc: "Rellenas de queso, con dip de ajo.",
    price: 280,
    available: true,
  },
  {
    id: "costillas",
    cat: "fuertes",
    name: "Costillas BBQ",
    desc: "Media tabla glaseada en salsa BBQ.",
    price: 850,
    available: true,
  },
  {
    id: "pollo",
    cat: "fuertes",
    name: "Pollo a la parrilla",
    desc: "Pechuga marinada, arroz y ensalada.",
    price: 550,
    available: true,
  },
  {
    id: "hamburguesa",
    cat: "fuertes",
    name: "Hamburguesa de la casa",
    desc: "Res, cheddar, tocino y papas.",
    price: 450,
    available: true,
  },
  {
    id: "limonada",
    cat: "bebidas",
    name: "Limonada frozen",
    desc: "Limón natural, bien fría.",
    price: 150,
    available: true,
  },
];

const ZONES: Zone[] = [
  { id: "z1", name: "Zona 1", hoods: "Piantini · Naco · Evaristo Morales", fee: 100, active: true },
  {
    id: "z2",
    name: "Zona 2",
    hoods: "Bella Vista · Gazcue · Mirador Norte",
    fee: 150,
    active: true,
  },
];

export const SWATCHES = ["#FF7101", "#E63946", "#2A9D8F", "#3A86FF", "#8338EC", "#06D6A0"];

export type Screen = "menu" | "cart" | "chat";
export type Fulfillment = "pickup" | "delivery";
export type PanelTab = "inicio" | "menu" | "pagina" | "qr" | "zonas";

type State = {
  items: DemoItem[];
  zones: Zone[];
  color: string;
  theme: MenuTheme;
  font: FontStyle;
  name: string;
  tagline: string;
  /** Si el negocio tiene WhatsApp, el menú ofrece carrito; si no, es solo una carta. */
  whatsapp: boolean;
  tab: PanelTab;
  cart: Record<string, number>;
  screen: Screen;
  fulfillment: Fulfillment;
  ordersToday: number;
  visitsToday: number;
  visited: boolean;
  nextNumber: number;
  lastMessage: string | null;
  toast: { text: string; at: number } | null;
  /** Última cosa que cambió, para resaltarla un instante en la otra pantalla. */
  flash: { key: string; at: number } | null;
};

type Action =
  | { type: "toggle"; id: string }
  | { type: "color"; color: string }
  | { type: "theme"; theme: MenuTheme }
  | { type: "font"; font: FontStyle }
  | { type: "name"; value: string }
  | { type: "tagline"; value: string }
  | { type: "whatsapp"; value: boolean }
  | { type: "tab"; tab: PanelTab }
  | { type: "zoneActive"; id: string }
  | { type: "zoneFee"; id: string; fee: number }
  | { type: "add"; id: string }
  | { type: "qty"; id: string; qty: number }
  | { type: "screen"; screen: Screen }
  | { type: "fulfillment"; value: Fulfillment }
  | { type: "chat"; message: string }
  | { type: "toast"; text: string }
  | { type: "clearToast" }
  | { type: "send"; message: string };

const initial: State = {
  items: ITEMS,
  zones: ZONES,
  color: SWATCHES[0],
  theme: "dark",
  font: "classic",
  name: RESTAURANT,
  tagline: TAGLINE,
  whatsapp: true,
  tab: "menu",
  cart: {},
  screen: "menu",
  fulfillment: "pickup",
  ordersToday: 4,
  visitsToday: 37,
  visited: false,
  nextNumber: 18,
  lastMessage: null,
  toast: null,
  flash: null,
};

const flash = (key: string) => ({ key, at: Date.now() });

/** La primera vez que el visitante toca el menú del celular cuenta como una visita. */
const touch = (s: State): Partial<State> =>
  s.visited ? {} : { visited: true, visitsToday: s.visitsToday + 1 };

function reducer(s: State, a: Action): State {
  switch (a.type) {
    case "toggle":
      return {
        ...s,
        items: s.items.map((i) => (i.id === a.id ? { ...i, available: !i.available } : i)),
        // Si se agota algo que estaba en el carrito, sale del carrito.
        cart: Object.fromEntries(Object.entries(s.cart).filter(([id]) => id !== a.id)),
        flash: flash(`item:${a.id}`),
      };
    case "color":
      return { ...s, color: a.color, flash: flash("color") };
    case "theme":
      return { ...s, theme: a.theme, flash: flash("color") };
    case "font":
      return { ...s, font: a.font, flash: flash("color") };
    case "name":
      return { ...s, name: a.value.slice(0, 30) };
    case "tagline":
      return { ...s, tagline: a.value.slice(0, 70) };
    case "whatsapp":
      // Sin WhatsApp no hay a dónde mandar pedidos: se vacía el carrito y se vuelve al menú.
      return a.value
        ? { ...s, whatsapp: true, flash: flash("whatsapp") }
        : { ...s, whatsapp: false, cart: {}, screen: "menu", flash: flash("whatsapp") };
    case "tab":
      return { ...s, tab: a.tab };
    case "zoneActive":
      return {
        ...s,
        zones: s.zones.map((z) => (z.id === a.id ? { ...z, active: !z.active } : z)),
        flash: flash(`zone:${a.id}`),
      };
    case "zoneFee":
      return {
        ...s,
        zones: s.zones.map((z) => (z.id === a.id ? { ...z, fee: a.fee } : z)),
        flash: flash(`zone:${a.id}`),
      };
    case "add": {
      const item = s.items.find((i) => i.id === a.id);
      if (!item?.available || !s.whatsapp) return s;
      return {
        ...s,
        ...touch(s),
        cart: { ...s.cart, [a.id]: Math.min(20, (s.cart[a.id] ?? 0) + 1) },
        flash: flash("cart"),
      };
    }
    case "qty": {
      const cart = { ...s.cart };
      if (a.qty <= 0) delete cart[a.id];
      else cart[a.id] = Math.min(20, a.qty);
      const empty = Object.keys(cart).length === 0;
      return { ...s, cart, screen: empty && s.screen === "cart" ? "menu" : s.screen };
    }
    case "screen":
      return { ...s, ...touch(s), screen: a.screen };
    case "fulfillment":
      return { ...s, fulfillment: a.value };
    case "chat":
      return { ...s, ...touch(s), screen: "chat", lastMessage: a.message };
    case "toast":
      return { ...s, toast: { text: a.text, at: Date.now() } };
    case "clearToast":
      return { ...s, toast: null };
    case "send":
      return {
        ...s,
        cart: {},
        screen: "chat",
        lastMessage: a.message,
        ordersToday: s.ordersToday + 1,
        nextNumber: s.nextNumber + 1,
        flash: flash("orders"),
      };
  }
}

type DemoValue = { state: State; dispatch: (a: Action) => void };
const DemoContext = createContext<DemoValue | null>(null);

export function DemoProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, initial);

  // Los avisos del celular se apagan solos.
  useEffect(() => {
    if (!state.toast) return;
    const t = window.setTimeout(() => dispatch({ type: "clearToast" }), 2400);
    return () => window.clearTimeout(t);
  }, [state.toast]);

  const value = useMemo(() => ({ state, dispatch }), [state]);
  return <DemoContext.Provider value={value}>{children}</DemoContext.Provider>;
}

export function useDemo(): DemoValue {
  const ctx = useContext(DemoContext);
  if (!ctx) throw new Error("useDemo debe usarse dentro de <DemoProvider>");
  return ctx;
}

export const money = (n: number) =>
  `RD$ ${n.toLocaleString("es-DO", { maximumFractionDigits: 2 })}`;

/** ¿Este elemento cambió hace menos de un segundo? */
export const isFresh = (f: State["flash"], key: string) =>
  !!f && f.key === key && Date.now() - f.at < 1200;

/** Nombre a mostrar: si el campo queda vacío, no se deja un hueco. */
export const displayName = (s: State) => s.name.trim() || "Tu restaurante";

/** Iniciales para el avatar del chat ("Pizzería Don Juan" → "PD"). */
export const initials = (name: string) =>
  name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? "")
    .join("") || "TR";

/** La zona que se le ofrece al cliente: la primera que esté activa. */
export const activeZone = (s: State): Zone | null => s.zones.find((z) => z.active) ?? null;

export type CartLine = { item: DemoItem; qty: number };

export function cartLines(s: State): CartLine[] {
  return s.items.filter((i) => s.cart[i.id]).map((item) => ({ item, qty: s.cart[item.id] }));
}

/** El mismo formato del mensaje real que llega al WhatsApp del negocio. */
export function orderMessage(
  number: number,
  lines: CartLine[],
  fulfillment: Fulfillment,
  name: string,
  zone: Zone | null,
): string {
  const subtotal = lines.reduce((n, l) => n + l.qty * l.item.price, 0);
  const fee = fulfillment === "delivery" && zone ? zone.fee : 0;
  const rows = lines.map((l) => `• ${l.qty}x ${l.item.name} — ${money(l.qty * l.item.price)}`);
  const parts = [`Hola ${name}, quiero hacer este pedido (#${number}):`, "", ...rows, ""];
  if (fulfillment === "pickup") parts.push("Para recoger en el local");
  else if (zone) {
    parts.push(`Delivery — ${zone.name} (${money(zone.fee)})`);
    parts.push(`Barrio dentro de la zona: ${zone.hoods.replace(/ · /g, ", ")}`);
  } else parts.push("Delivery (el costo se confirma por el chat)");
  parts.push("");
  if (fee) {
    parts.push(`Subtotal: ${money(subtotal)}`);
    parts.push(`Delivery: ${money(fee)}`);
  }
  parts.push(`Total: ${money(subtotal + fee)}`);
  return parts.join("\n");
}
