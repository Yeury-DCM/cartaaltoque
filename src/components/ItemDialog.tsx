import { useCallback, useEffect, useRef, useState } from "react";
import { Check, Minus, Plus, UtensilsCrossed, X } from "lucide-react";
import { MAX_QTY, useCart } from "@/lib/cart";
import type { Item } from "@/lib/menu";
import { photoUrl } from "@/lib/supabase";

/** Fotos del plato con la principal primero. */
function orderedPhotos(item: Item) {
  return [...item.item_photos].sort(
    (a, b) => Number(b.is_primary) - Number(a.is_primary) || a.sort_order - b.sort_order,
  );
}

/**
 * Detalle del platillo: la foto ocupa el protagonismo (con carrusel si hay varias),
 * debajo va la información con menos peso y al pie, fija, la barra para agregar al pedido.
 * En celular sube como una hoja desde abajo.
 */
export function ItemDialog({
  item,
  onClose,
  canOrder = true,
}: {
  item: Item;
  onClose: () => void;
  /** Sin WhatsApp el negocio no recibe pedidos: se muestra solo la ficha del plato. */
  canOrder?: boolean;
}) {
  const photos = orderedPhotos(item);
  const cart = useCart();
  const [closing, setClosing] = useState(false);
  const [index, setIndex] = useState(0);
  const [variantId, setVariantId] = useState<string | null>(item.item_variants[0]?.id ?? null);
  const [qty, setQty] = useState(1);
  const [note, setNote] = useState("");
  const [noteOpen, setNoteOpen] = useState(false);
  const scroller = useRef<HTMLDivElement>(null);
  const closeBtn = useRef<HTMLButtonElement>(null);

  const variant = item.item_variants.find((v) => v.id === variantId) ?? null;
  const unitPrice = variant ? variant.price : item.price;

  const close = useCallback(() => {
    setClosing(true);
    window.setTimeout(onClose, 220);
  }, [onClose]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && close();
    document.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    closeBtn.current?.focus();
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [close]);

  const goTo = (i: number) => {
    const el = scroller.current;
    if (el) el.scrollTo({ left: i * el.clientWidth, behavior: "smooth" });
  };

  const addToOrder = () => {
    cart.add({
      itemId: item.id,
      variantId: variant?.id ?? null,
      name: item.name,
      variantLabel: variant?.label ?? null,
      unitPrice,
      qty,
      note,
    });
    close();
  };

  return (
    <div
      className={`fixed inset-0 z-[80] flex items-end justify-center bg-black/75 backdrop-blur-md md:items-center md:p-6 ${
        closing ? "backdrop-out" : "backdrop-in"
      }`}
      onClick={close}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label={item.name}
        onClick={(e) => e.stopPropagation()}
        className={`relative flex max-h-[94svh] w-full max-w-xl flex-col overflow-hidden rounded-t-3xl border border-primary/25 bg-background md:rounded-3xl ${
          closing ? "sheet-out" : "sheet-in"
        }`}
      >
        <button
          ref={closeBtn}
          onClick={close}
          aria-label="Cerrar"
          className="absolute right-3 top-3 z-10 grid h-10 w-10 place-items-center rounded-full bg-black/55 text-foreground backdrop-blur transition hover:bg-primary hover:text-primary-foreground"
        >
          <X className="h-5 w-5" />
        </button>

        <div className="min-h-0 flex-1 overflow-y-auto">
          {/* Foto protagonista */}
          <div className="relative bg-card">
            {photos.length > 0 ? (
              <div
                ref={scroller}
                onScroll={(e) => {
                  const el = e.currentTarget;
                  setIndex(Math.round(el.scrollLeft / el.clientWidth));
                }}
                className="flex snap-x snap-mandatory overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
              >
                {photos.map((p) => (
                  <img
                    key={p.id}
                    src={photoUrl(p.path)}
                    alt={item.name}
                    draggable={false}
                    className={`aspect-square w-full shrink-0 snap-center object-cover md:aspect-[4/3] ${
                      item.is_available ? "" : "grayscale"
                    }`}
                  />
                ))}
              </div>
            ) : (
              <div className="grid aspect-square w-full place-items-center text-primary/50 md:aspect-[4/3]">
                <UtensilsCrossed className="h-16 w-16" />
              </div>
            )}

            {photos.length > 1 && (
              <div className="absolute inset-x-0 bottom-3 flex justify-center gap-1.5">
                {photos.map((p, i) => (
                  <button
                    key={p.id}
                    onClick={() => goTo(i)}
                    aria-label={`Foto ${i + 1}`}
                    className={`h-1.5 rounded-full transition-all ${
                      i === index ? "w-5 bg-primary" : "w-1.5 bg-white/60"
                    }`}
                  />
                ))}
              </div>
            )}
          </div>

          {/* Información, con menos protagonismo */}
          <div className="px-5 pb-5 pt-4">
            <div className="flex items-start justify-between gap-3">
              <h2 className="font-display text-2xl uppercase leading-tight text-foreground/95">
                {item.name}
              </h2>
              {!item.is_available && (
                <span className="mt-1 shrink-0 rounded-md bg-destructive px-2 py-0.5 text-[10px] font-bold uppercase tracking-[0.2em]">
                  Agotado
                </span>
              )}
            </div>

            {item.description && (
              <p className="mt-2 text-sm leading-relaxed text-foreground/60">{item.description}</p>
            )}

            {/* Tamaño / presentación: se elige uno y el precio de abajo se ajusta */}
            {item.item_variants.length > 0 && (
              <div role="radiogroup" aria-label="Tamaño" className="mt-4 flex flex-wrap gap-2">
                {item.item_variants.map((v) => {
                  const on = v.id === variantId;
                  return (
                    <button
                      key={v.id}
                      type="button"
                      role="radio"
                      aria-checked={on}
                      onClick={() => setVariantId(v.id)}
                      className={`flex items-baseline gap-2 rounded-lg border px-3 py-2 transition-colors ${
                        on
                          ? "border-primary bg-primary/15 text-foreground"
                          : "border-primary/20 bg-foreground/5 text-foreground/70 hover:border-primary/60"
                      }`}
                    >
                      <span className="text-[10px] font-bold uppercase tracking-[0.15em]">
                        {v.label}
                      </span>
                      <span className="text-sm font-bold text-primary">{cart.format(v.price)}</span>
                    </button>
                  );
                })}
              </div>
            )}

            {canOrder && item.is_available && (
              <div className="mt-4">
                {noteOpen ? (
                  <input
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                    maxLength={120}
                    placeholder="Ej.: sin cebolla, salsa aparte"
                    aria-label="Nota para este plato"
                    className="w-full rounded-lg border border-input bg-foreground/5 px-3 py-2.5 text-sm outline-none focus:border-primary"
                  />
                ) : (
                  <button
                    type="button"
                    onClick={() => setNoteOpen(true)}
                    className="text-xs font-bold uppercase tracking-[0.15em] text-primary hover:underline"
                  >
                    + Agregar nota
                  </button>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Barra fija: cantidad + agregar */}
        <div
          className={`shrink-0 border-t border-primary/15 bg-background px-5 py-3 ${canOrder ? "" : "hidden"}`}
        >
          {item.is_available ? (
            <div className="flex items-center gap-3">
              <div className="flex items-center rounded-xl border border-primary/25 bg-foreground/5">
                <button
                  type="button"
                  aria-label="Menos"
                  onClick={() => setQty((q) => Math.max(1, q - 1))}
                  disabled={qty <= 1}
                  className="grid h-11 w-11 place-items-center text-foreground/80 disabled:opacity-30"
                >
                  <Minus className="h-4 w-4" />
                </button>
                <span aria-live="polite" className="w-7 text-center text-sm font-bold">
                  {qty}
                </span>
                <button
                  type="button"
                  aria-label="Más"
                  onClick={() => setQty((q) => Math.min(MAX_QTY, q + 1))}
                  disabled={qty >= MAX_QTY}
                  className="grid h-11 w-11 place-items-center text-foreground/80 disabled:opacity-30"
                >
                  <Plus className="h-4 w-4" />
                </button>
              </div>
              <button type="button" onClick={addToOrder} className="btn-primary h-11 flex-1 !px-3">
                <Check className="h-4 w-4" />
                Agregar · {cart.format(unitPrice * qty)}
              </button>
            </div>
          ) : (
            <p className="py-2 text-center text-sm text-foreground/60">
              Este plato no está disponible ahora mismo.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
