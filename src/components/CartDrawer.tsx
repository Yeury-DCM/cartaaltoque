import { useCallback, useEffect, useState } from "react";
import { Bike, Loader2, Minus, Plus, Store, Trash2, UtensilsCrossed, X } from "lucide-react";
import { MAX_QTY, useCart } from "@/lib/cart";
import {
  buildOrderMessage,
  OrderRejected,
  placeOrder,
  whatsappUrl,
  type Fulfillment,
} from "@/lib/order";
import type { DeliveryZone } from "@/lib/zones";
import { WhatsAppIcon } from "./icons/WhatsAppIcon";

// Datos del cliente: se recuerdan entre restaurantes (son del cliente, no del negocio).
const NAME_KEY = "cliente-nombre-v1";
const ADDRESS_KEY = "cliente-direccion-v1";

function readStorage(key: string): string {
  try {
    return localStorage.getItem(key) ?? "";
  } catch {
    return "";
  }
}
function writeStorage(key: string, value: string) {
  try {
    if (value) localStorage.setItem(key, value);
    else localStorage.removeItem(key);
  } catch {
    /* sin almacenamiento */
  }
}

/**
 * Hoja "Tu pedido": revisa platos, cantidades y notas, elige recoger o delivery
 * (con su zona y costo), registra el pedido y lo abre armado en WhatsApp.
 */
export function CartDrawer({
  slug,
  restaurantName,
  phone,
  zones,
  onClose,
}: {
  slug: string;
  restaurantName: string;
  phone: string;
  zones: DeliveryZone[];
  onClose: () => void;
}) {
  const cart = useCart();
  const [closing, setClosing] = useState(false);
  const [name, setName] = useState("");
  const [address, setAddress] = useState("");
  const [fulfillment, setFulfillment] = useState<Fulfillment | null>(null);
  const [zoneId, setZoneId] = useState<string | null>(null);
  const [confirmClear, setConfirmClear] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const close = useCallback(() => {
    setClosing(true);
    window.setTimeout(onClose, 220);
  }, [onClose]);

  useEffect(() => {
    setName(readStorage(NAME_KEY));
    setAddress(readStorage(ADDRESS_KEY));
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && close();
    document.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [close]);

  // Si el pedido se vacía, se cierra solo.
  useEffect(() => {
    if (cart.count === 0 && !closing && !sending) close();
  }, [cart.count, closing, sending, close]);

  const chooseFulfillment = (f: Fulfillment) => {
    setFulfillment(f);
    setError(null);
    if (f === "pickup") setZoneId(null);
  };

  const zone = zoneId ? (zones.find((z) => z.id === zoneId) ?? null) : null;
  const deliveryFee = fulfillment === "delivery" && zone ? zone.fee : 0;
  const grandTotal = cart.total + deliveryFee;
  const fulfillmentReady =
    fulfillment === "pickup" ||
    (fulfillment === "delivery" && (zones.length === 0 || zone !== null));
  const hasPhone = phone.replace(/\D/g, "").length > 0;
  const canSend = cart.lines.length > 0 && fulfillmentReady && hasPhone && !sending;

  const send = async () => {
    if (!canSend || !fulfillment) return;
    setSending(true);
    setError(null);
    // La pestaña se abre ya, dentro del toque del usuario, para que el navegador no la bloquee;
    // cuando el pedido queda registrado se le pone la dirección de WhatsApp.
    const win = window.open("", "_blank");
    try {
      const order = await placeOrder({
        slug,
        lines: cart.lines,
        fulfillment,
        zone,
        customerName: name,
        address,
        currency: cart.currency,
      });
      const url = whatsappUrl(phone, buildOrderMessage(restaurantName, order, name, address));
      if (win) {
        win.opener = null;
        win.location.href = url;
      } else {
        window.location.href = url;
      }
      // El pedido ya se fue por WhatsApp: se vacía para empezar uno nuevo.
      cart.clear();
    } catch (e) {
      win?.close();
      setError(
        e instanceof OrderRejected ? e.message : "No pudimos enviar el pedido. Intenta de nuevo.",
      );
    } finally {
      setSending(false);
    }
  };

  const pillClass = (active: boolean) =>
    `flex h-11 items-center justify-center gap-2 rounded-xl border text-sm font-bold uppercase tracking-wide transition-colors ${
      active
        ? "border-primary bg-primary text-primary-foreground"
        : "border-primary/25 bg-foreground/5 text-foreground/80 hover:border-primary/60"
    }`;

  return (
    <div
      className={`fixed inset-0 z-[80] flex items-end justify-center bg-black/75 backdrop-blur-md md:items-center ${
        closing ? "backdrop-out" : "backdrop-in"
      }`}
      onClick={close}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Tu pedido"
        onClick={(e) => e.stopPropagation()}
        className={`relative flex max-h-[94svh] w-full max-w-lg flex-col overflow-hidden rounded-t-3xl border border-primary/25 bg-background md:rounded-3xl ${
          closing ? "sheet-out" : "sheet-in"
        }`}
      >
        <header className="flex items-center justify-between border-b border-primary/15 px-5 py-4">
          <div>
            <p className="text-[10px] uppercase tracking-[0.3em] text-primary">
              {cart.count} {cart.count === 1 ? "plato" : "platos"}
            </p>
            <h2 className="font-display text-3xl uppercase leading-none">Tu pedido</h2>
          </div>
          <button
            onClick={close}
            aria-label="Cerrar"
            className="grid h-10 w-10 place-items-center rounded-full bg-foreground/10 transition hover:bg-primary hover:text-primary-foreground"
          >
            <X className="h-5 w-5" />
          </button>
        </header>

        <div className="min-h-0 flex-1 overflow-y-auto px-5 py-4">
          {cart.lines.length === 0 ? (
            <div className="py-12 text-center text-foreground/60">
              <UtensilsCrossed className="mx-auto mb-3 h-8 w-8 text-primary" />
              Aún no has agregado platos.
            </div>
          ) : (
            <ul className="space-y-3">
              {cart.lines.map((l) => (
                <li key={l.key} className="rounded-xl border border-primary/15 bg-foreground/5 p-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="font-display text-xl uppercase leading-tight">{l.name}</p>
                      {l.variantLabel && (
                        <p className="mt-0.5 text-[10px] font-bold uppercase tracking-[0.15em] text-foreground/55">
                          {l.variantLabel}
                        </p>
                      )}
                    </div>
                    <p className="shrink-0 font-display text-xl text-primary">
                      {cart.format(l.qty * l.unitPrice)}
                    </p>
                  </div>

                  <input
                    value={l.note}
                    onChange={(e) => cart.setNote(l.key, e.target.value)}
                    maxLength={120}
                    placeholder="Nota (sin cebolla, salsa aparte…)"
                    aria-label={`Nota para ${l.name}`}
                    className="mt-2 w-full rounded-lg border border-input bg-background/60 px-3 py-2 text-xs outline-none focus:border-primary"
                  />

                  <div className="mt-2 flex items-center justify-between">
                    <div className="flex items-center rounded-lg border border-primary/25">
                      <button
                        type="button"
                        aria-label={`Quitar uno de ${l.name}`}
                        onClick={() => cart.setQty(l.key, l.qty - 1)}
                        className="grid h-9 w-9 place-items-center text-foreground/80"
                      >
                        <Minus className="h-4 w-4" />
                      </button>
                      <span aria-live="polite" className="w-7 text-center text-sm font-bold">
                        {l.qty}
                      </span>
                      <button
                        type="button"
                        aria-label={`Agregar uno más de ${l.name}`}
                        onClick={() => cart.setQty(l.key, l.qty + 1)}
                        disabled={l.qty >= MAX_QTY}
                        className="grid h-9 w-9 place-items-center text-foreground/80 disabled:opacity-30"
                      >
                        <Plus className="h-4 w-4" />
                      </button>
                    </div>
                    <button
                      type="button"
                      onClick={() => cart.remove(l.key)}
                      aria-label={`Quitar ${l.name} del pedido`}
                      className="grid h-9 w-9 place-items-center rounded-lg text-foreground/45 transition hover:text-destructive"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )}

          {cart.lines.length > 0 && (
            <div className="mt-5 space-y-2">
              <p className="text-xs uppercase tracking-[0.2em] text-foreground/60">
                ¿Cómo lo quieres?
              </p>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => chooseFulfillment("pickup")}
                  className={pillClass(fulfillment === "pickup")}
                >
                  <Store className="h-4 w-4" />
                  Recoger
                </button>
                <button
                  type="button"
                  onClick={() => chooseFulfillment("delivery")}
                  className={pillClass(fulfillment === "delivery")}
                >
                  <Bike className="h-4 w-4" />
                  Delivery
                </button>
              </div>

              {fulfillment === "delivery" && (
                <div className="space-y-1.5 pt-1">
                  {zones.length === 0 ? (
                    <p className="rounded-lg border border-primary/20 bg-foreground/5 px-3 py-2 text-xs text-foreground/55">
                      Escribe tu dirección y te confirmamos el costo de entrega por el chat.
                    </p>
                  ) : (
                    zones.map((z) => (
                      <button
                        key={z.id}
                        type="button"
                        onClick={() => setZoneId(z.id)}
                        className={`w-full rounded-lg border px-3 py-2 text-left transition-colors ${
                          zoneId === z.id
                            ? "border-primary bg-primary/15"
                            : "border-primary/20 bg-foreground/5 hover:border-primary/50"
                        }`}
                      >
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-sm font-bold">{z.name}</span>
                          <span className="shrink-0 text-sm font-bold text-primary">
                            {cart.format(z.fee)}
                          </span>
                        </div>
                        {z.neighborhoods.length > 0 && (
                          <p className="mt-0.5 text-[11px] leading-snug text-foreground/55">
                            {z.neighborhoods.join(" · ")}
                          </p>
                        )}
                      </button>
                    ))
                  )}
                  <input
                    value={address}
                    onChange={(e) => {
                      setAddress(e.target.value);
                      writeStorage(ADDRESS_KEY, e.target.value);
                    }}
                    maxLength={200}
                    placeholder="Dirección y referencia (opcional)"
                    aria-label="Dirección de entrega"
                    className="w-full rounded-lg border border-input bg-foreground/5 px-3 py-2.5 text-sm outline-none focus:border-primary"
                  />
                </div>
              )}
            </div>
          )}
        </div>

        {cart.lines.length > 0 && (
          <footer className="shrink-0 space-y-3 border-t border-primary/15 bg-background px-5 py-4">
            <input
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                writeStorage(NAME_KEY, e.target.value);
              }}
              maxLength={60}
              placeholder="Tu nombre (opcional)"
              aria-label="Tu nombre"
              className="w-full rounded-lg border border-input bg-foreground/5 px-3 py-2.5 text-sm outline-none focus:border-primary"
            />

            <div className="space-y-1">
              {deliveryFee > 0 && (
                <div className="flex items-baseline justify-between text-sm text-foreground/60">
                  <span>Entrega ({zone?.name})</span>
                  <span>{cart.format(deliveryFee)}</span>
                </div>
              )}
              <div className="flex items-baseline justify-between">
                <span className="text-xs uppercase tracking-[0.2em] text-foreground/60">Total</span>
                <span className="font-display text-3xl text-primary">
                  {cart.format(grandTotal)}
                </span>
              </div>
            </div>

            {error && (
              <p role="alert" className="rounded-lg bg-destructive/20 px-3 py-2 text-sm">
                {error}
              </p>
            )}

            <button
              type="button"
              onClick={() => void send()}
              disabled={!canSend}
              className={`btn-primary w-full ${canSend ? "" : "pointer-events-none opacity-50"}`}
            >
              {sending ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                <WhatsAppIcon className="h-5 w-5" />
              )}
              Enviar pedido por WhatsApp
            </button>
            <p className="text-center text-[11px] leading-relaxed text-foreground/50">
              {!hasPhone
                ? "Este negocio aún no configuró su WhatsApp."
                : !fulfillmentReady
                  ? "Elige si vas a recoger o necesitas delivery para poder enviar el pedido."
                  : "Se abrirá WhatsApp con tu pedido ya escrito. El negocio lo confirma por el chat."}
            </p>

            <div className="flex justify-center">
              {confirmClear ? (
                <p className="flex items-center gap-3 text-xs text-foreground/70">
                  ¿Vaciar el pedido?
                  <button
                    type="button"
                    onClick={() => {
                      cart.clear();
                      setConfirmClear(false);
                    }}
                    className="font-bold uppercase tracking-[0.12em] text-destructive"
                  >
                    Sí, vaciar
                  </button>
                  <button
                    type="button"
                    onClick={() => setConfirmClear(false)}
                    className="font-bold uppercase tracking-[0.12em] text-foreground/60"
                  >
                    No
                  </button>
                </p>
              ) : (
                <button
                  type="button"
                  onClick={() => setConfirmClear(true)}
                  className="text-xs uppercase tracking-[0.15em] text-foreground/45 transition hover:text-foreground/80"
                >
                  Vaciar pedido
                </button>
              )}
            </div>
          </footer>
        )}
      </div>
    </div>
  );
}
