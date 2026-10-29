import { ShoppingBag } from "lucide-react";
import { useCart } from "@/lib/cart";

/** Barra fija abajo con el resumen del pedido; aparece al agregar el primer plato. */
export function CartBar({ onOpen }: { onOpen: () => void }) {
  const { count, total, addedTick, format } = useCart();
  if (count === 0) return null;

  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-0 z-50 px-4 pb-4">
      {/* key: al agregar algo la barra se vuelve a montar y "salta" un poco */}
      <button
        key={addedTick}
        type="button"
        onClick={onOpen}
        aria-label={`Ver pedido: ${count} ${count === 1 ? "plato" : "platos"}, ${format(total)}`}
        className="bar-pop pointer-events-auto mx-auto flex w-full max-w-xl items-center gap-3 rounded-2xl bg-primary px-4 py-3 text-left text-primary-foreground transition-transform active:scale-[0.99]"
      >
        <span className="relative grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-black/15">
          <ShoppingBag className="h-5 w-5" />
          <span className="absolute -right-1.5 -top-1.5 grid h-5 min-w-5 place-items-center rounded-full bg-background px-1 text-[11px] font-bold text-primary">
            {count}
          </span>
        </span>
        <span className="flex-1 text-sm font-bold uppercase tracking-[0.12em]">Ver mi pedido</span>
        <span className="font-display text-2xl leading-none">{format(total)}</span>
      </button>
    </div>
  );
}
