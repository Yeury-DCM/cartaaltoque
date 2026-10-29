import { useCallback, useEffect, useRef, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import type { Category } from "@/lib/menu";

/**
 * Selector de categorías del menú. Pensado para el pulgar:
 * - chips grandes (44 px de alto) con desplazamiento que se acomoda solo,
 * - la categoría activa se centra automáticamente,
 * - degradados en los bordes y flechas (escritorio) que avisan que hay más a los lados.
 */
export function CategoryNav({
  categories,
  value,
  onChange,
}: {
  categories: Category[];
  value: string;
  onChange: (id: string) => void;
}) {
  const scroller = useRef<HTMLDivElement>(null);
  const [edges, setEdges] = useState({ left: false, right: false });

  const measure = useCallback(() => {
    const el = scroller.current;
    if (!el) return;
    setEdges({
      left: el.scrollLeft > 4,
      right: el.scrollLeft + el.clientWidth < el.scrollWidth - 4,
    });
  }, []);

  useEffect(() => {
    const el = scroller.current;
    if (!el) return;
    measure();
    el.addEventListener("scroll", measure, { passive: true });
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => {
      el.removeEventListener("scroll", measure);
      ro.disconnect();
    };
  }, [measure, categories.length]);

  // Centra la categoría activa dentro de la barra (sin mover la página).
  useEffect(() => {
    const el = scroller.current;
    const chip = el?.querySelector<HTMLElement>('[aria-pressed="true"]');
    if (!el || !chip) return;
    const left = chip.offsetLeft - (el.clientWidth - chip.offsetWidth) / 2;
    el.scrollTo({ left, behavior: "smooth" });
  }, [value]);

  const nudge = (dir: -1 | 1) =>
    scroller.current?.scrollBy({
      left: dir * scroller.current.clientWidth * 0.6,
      behavior: "smooth",
    });

  const chip = (id: string, label: string) => (
    <button
      key={id}
      type="button"
      aria-pressed={value === id}
      onClick={() => onChange(id)}
      className={`h-11 shrink-0 snap-center rounded-full border px-5 text-[13px] font-bold uppercase tracking-[0.12em] transition-colors active:scale-[0.97] ${
        value === id
          ? "border-primary bg-primary text-primary-foreground"
          : "border-primary/30 bg-foreground/5 text-foreground/85 hover:border-primary hover:text-foreground"
      }`}
    >
      {label}
    </button>
  );

  return (
    <div className="relative -mx-5 md:mx-0">
      <div
        ref={scroller}
        role="group"
        aria-label="Categorías"
        className="flex snap-x gap-2 overflow-x-auto px-5 py-1 md:px-0 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        {chip("all", "Todo")}
        {categories.map((c) => chip(c.id, c.name))}
      </div>

      <div
        aria-hidden
        className={`pointer-events-none absolute inset-y-0 left-0 w-10 bg-gradient-to-r from-background to-transparent transition-opacity ${edges.left ? "opacity-100" : "opacity-0"}`}
      />
      <div
        aria-hidden
        className={`pointer-events-none absolute inset-y-0 right-0 w-10 bg-gradient-to-l from-background to-transparent transition-opacity ${edges.right ? "opacity-100" : "opacity-0"}`}
      />

      {edges.left && (
        <button
          type="button"
          aria-label="Categorías anteriores"
          onClick={() => nudge(-1)}
          className="absolute left-0 top-1/2 hidden h-9 w-9 -translate-y-1/2 place-items-center rounded-full border border-primary/40 bg-background/90 text-primary shadow-lg backdrop-blur hover:bg-primary hover:text-primary-foreground md:grid"
        >
          <ChevronLeft className="h-5 w-5" />
        </button>
      )}
      {edges.right && (
        <button
          type="button"
          aria-label="Más categorías"
          onClick={() => nudge(1)}
          className="absolute right-0 top-1/2 hidden h-9 w-9 -translate-y-1/2 place-items-center rounded-full border border-primary/40 bg-background/90 text-primary shadow-lg backdrop-blur hover:bg-primary hover:text-primary-foreground md:grid"
        >
          <ChevronRight className="h-5 w-5" />
        </button>
      )}
    </div>
  );
}
