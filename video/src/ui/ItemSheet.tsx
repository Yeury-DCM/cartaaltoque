import React from "react";
import { Check, Minus, Plus, X } from "lucide-react";
import { Easing, Img, interpolate, staticFile } from "remotion";
import { money, type DemoItem } from "./data";

const ease = Easing.bezier(0.16, 1, 0.3, 1);

/**
 * Detalle del plato (ItemDialog.tsx de la app) en celular: la hoja sube desde abajo con la
 * foto protagonista, la información y la barra fija para agregar. `since` = frames desde que
 * se tocó la tarjeta; backdrop-in (260 ms) y sheet-in (420 ms) calculados por frame.
 */
export const ItemSheet: React.FC<{ item: DemoItem; since: number; canOrder?: boolean }> = ({ item, since, canOrder = true }) => {
  const bd = interpolate(since, [0, 7.8], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: Easing.out(Easing.quad) });
  const s = ease(Math.min(1, Math.max(0, since / 12.6)));
  return (
    <div className="absolute inset-0 z-[80] flex items-end justify-center">
      <div className="absolute inset-0 bg-black/75 backdrop-blur-md" style={{ opacity: bd }} />
      <div
        role="dialog"
        className="relative flex max-h-[94%] w-full flex-col overflow-hidden rounded-t-3xl border border-primary/25 bg-background"
        style={{ opacity: s, transform: `translateY(${(1 - s) * 40}px) scale(${0.97 + 0.03 * s})` }}
      >
        <span className="absolute right-3 top-3 z-10 grid h-10 w-10 place-items-center rounded-full bg-black/55 text-white backdrop-blur">
          <X className="h-5 w-5" />
        </span>

        <div className="min-h-0 flex-1 overflow-hidden">
          <div className="relative bg-card">
            <Img
              src={staticFile(item.photo)}
              className={`aspect-square w-full shrink-0 object-cover ${item.available ? "" : "grayscale"}`}
            />
          </div>

          <div className="px-5 pb-5 pt-4">
            <div className="flex items-start justify-between gap-3">
              <h2 className="font-display text-2xl uppercase leading-tight text-foreground/95">{item.name}</h2>
              {!item.available && (
                <span className="mt-1 shrink-0 rounded-md bg-destructive px-2 py-0.5 text-[10px] font-bold uppercase tracking-[0.2em]">
                  Agotado
                </span>
              )}
            </div>
            <p className="mt-2 text-sm leading-relaxed text-foreground/60">{item.desc}</p>
            {canOrder && item.available && (
              <div className="mt-4">
                <span className="text-xs font-bold uppercase tracking-[0.15em] text-primary">+ Agregar nota</span>
              </div>
            )}
          </div>
        </div>

        <div className={`shrink-0 border-t border-primary/15 bg-background px-5 py-3 ${canOrder ? "" : "hidden"}`}>
          {item.available ? (
            <div className="flex items-center gap-3">
              <div className="flex items-center rounded-xl border border-primary/25 bg-foreground/5">
                <span className="grid h-11 w-11 place-items-center text-foreground/80 opacity-30">
                  <Minus className="h-4 w-4" />
                </span>
                <span className="w-7 text-center text-sm font-bold">1</span>
                <span className="grid h-11 w-11 place-items-center text-foreground/80">
                  <Plus className="h-4 w-4" />
                </span>
              </div>
              <span className="btn-primary h-11 flex-1 !px-3">
                <Check className="h-4 w-4" />
                Agregar · {money(item.price)}
              </span>
            </div>
          ) : (
            <p className="py-2 text-center text-sm text-foreground/60">Este plato no está disponible ahora mismo.</p>
          )}
        </div>
      </div>
    </div>
  );
};
