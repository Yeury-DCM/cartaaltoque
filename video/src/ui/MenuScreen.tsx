import React, { type ReactNode } from "react";
import { Beef, Clock, CupSoda, Instagram, Plus, Salad, ShoppingBag } from "lucide-react";
import { Easing, interpolate } from "remotion";
import { WhatsAppIcon } from "./WhatsAppIcon";
import { StatusBar, flashShadow } from "./devices";
import {
  brandStyle,
  CATEGORIES,
  money,
  RESTAURANT,
  TAGLINE,
  type CategoryId,
  type DemoItem,
  type FontStyle,
  type MenuTheme,
} from "./data";

const ICON: Record<CategoryId, typeof Salad> = {
  entradas: Salad,
  fuertes: Beef,
  bebidas: CupSoda,
};

export type MenuProps = {
  items: DemoItem[];
  color?: string;
  theme?: MenuTheme;
  font?: FontStyle;
  name?: string;
  tagline?: string;
  whatsapp?: boolean;
  /** Logo del restaurante (en el menú real va sobre "Carta", sin recuadro). */
  logo?: ReactNode;
  cart?: Record<string, number>;
  /** Frames desde el último cambio de cada clave ("item:<id>", "cart"). */
  flash?: Record<string, number | undefined>;
  /** Desplazamiento de la lista (px lógicos). */
  scroll?: number;
  /** Botón + presionado: id del plato y frames desde el toque. */
  press?: { id: string; since: number };
};

/**
 * Menú del cliente (390×844 lógicos): MenuScreen de DemoPhone.tsx de la app, con el
 * estado tomado de props y las animaciones CSS (demo-flash, bar-pop) calculadas por frame.
 */
export const MenuScreen: React.FC<MenuProps> = ({
  items,
  color = "#FF7101",
  theme = "dark",
  font = "classic",
  name = RESTAURANT,
  tagline = TAGLINE,
  whatsapp = true,
  logo,
  cart = {},
  flash = {},
  scroll = 0,
  press,
}) => {
  const lines = items.filter((i) => cart[i.id]).map((item) => ({ item, qty: cart[item.id] }));
  const count = lines.reduce((n, l) => n + l.qty, 0);
  const total = lines.reduce((n, l) => n + l.qty * l.item.price, 0);
  const barSince = flash.cart;
  // bar-pop: 0% → opacidad 0, +24px, .97; 60% → -3px, 1.01; 100% → 0, 1 (420 ms)
  const bp = barSince === undefined ? 1 : Math.min(1, Math.max(0, barSince / 12.6));
  const e = Easing.bezier(0.16, 1, 0.3, 1)(bp);
  const barY = interpolate(e, [0, 0.6, 1], [24, -3, 0]);
  const barS = interpolate(e, [0, 0.6, 1], [0.97, 1.01, 1]);
  const barO = interpolate(e, [0, 0.6], [0, 1], { extrapolateRight: "clamp" });

  return (
    <div
      data-theme={theme}
      data-font={font}
      className="relative h-full w-full overflow-hidden bg-background text-foreground"
      style={brandStyle(color)}
    >
      <div className="flex h-full flex-col">
        <StatusBar color={theme === "light" ? "#26221F" : "#F5F5F5"} />
        <div className="min-h-0 flex-1 overflow-hidden">
          <div style={{ transform: `translateY(${-scroll}px)` }}>
            <div className="relative shrink-0 px-5 pb-4 pt-3 text-center">
              <div
                aria-hidden
                className="absolute inset-x-0 -top-14 h-48 opacity-70"
                style={{
                  background:
                    "radial-gradient(ellipse 70% 60% at 50% 0%, color-mix(in srgb, var(--primary) 35%, transparent), transparent 70%)",
                }}
              />
              {logo ? <div className="relative mx-auto mb-3 flex h-[64px] items-center justify-center">{logo}</div> : null}
              <p className="relative text-[10px] uppercase tracking-[0.4em] text-primary">Carta</p>
              <h3 className="relative break-words font-display text-[46px] uppercase leading-none">{name}</h3>
              {tagline.trim() && <p className="relative mt-1.5 text-[12.5px] text-foreground/65">{tagline}</p>}
              <p className="relative mt-2 inline-flex items-center gap-1.5 text-[10.5px] uppercase tracking-[0.15em] text-foreground/55">
                <Clock className="h-3 w-3 text-primary" /> Lun–Dom · 12 pm – 11 pm
              </p>
              <div className="relative mt-3 flex justify-center gap-2">
                {whatsapp && (
                  <span className="flex h-9 items-center gap-1.5 rounded-xl bg-primary px-3.5 text-[13px] font-bold text-primary-foreground">
                    <WhatsAppIcon className="h-4 w-4" /> WhatsApp
                  </span>
                )}
                <span className="grid h-9 w-9 place-items-center rounded-xl border border-primary/30 bg-foreground/5">
                  <Instagram className="h-4 w-4" />
                </span>
              </div>
            </div>

            <div className="flex shrink-0 gap-2 overflow-hidden border-y border-primary/15 bg-background/90 px-4 py-2.5">
              {[{ id: "all", name: "Todo" }, ...CATEGORIES].map((c) => (
                <span
                  key={c.id}
                  className={`flex h-9 shrink-0 items-center rounded-full border px-4 text-[11.5px] font-bold uppercase tracking-[0.12em] ${
                    c.id === "all"
                      ? "border-primary bg-primary text-primary-foreground"
                      : "border-primary/30 bg-foreground/5 text-foreground/85"
                  }`}
                >
                  {c.name}
                </span>
              ))}
            </div>

            <div className="px-4 pt-4 pb-8">
              {CATEGORIES.map((c) => (
                <section key={c.id} className="mb-6">
                  <h4 className="mb-3 flex items-center gap-3 font-display text-[26px] uppercase leading-none">
                    {c.name}
                    <span className="h-px flex-1 bg-gradient-to-r from-primary/50 to-transparent" />
                  </h4>
                  <ul className="space-y-2.5">
                    {items
                      .filter((i) => i.cat === c.id)
                      .map((i) => (
                        <ItemCard
                          key={i.id}
                          item={i}
                          flash={flash[`item:${i.id}`]}
                          canOrder={whatsapp}
                          press={press?.id === i.id ? press.since : undefined}
                        />
                      ))}
                  </ul>
                </section>
              ))}
            </div>
          </div>
        </div>
      </div>

      {whatsapp && count > 0 && (
        <div className="absolute inset-x-0 bottom-0 px-4 pb-5">
          <div
            className="flex w-full items-center gap-3 rounded-2xl bg-primary px-4 py-3 text-left text-primary-foreground shadow-[0_18px_40px_-12px_rgba(0,0,0,0.8)]"
            style={{ opacity: barO, transform: `translateY(${barY}px) scale(${barS})` }}
          >
            <span className="relative grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-black/15">
              <ShoppingBag className="h-5 w-5" />
              <span className="absolute -right-1.5 -top-1.5 grid h-5 min-w-5 place-items-center rounded-full bg-background px-1 text-[11px] font-bold text-primary">
                {count}
              </span>
            </span>
            <span className="flex-1 text-[13px] font-bold uppercase tracking-[0.12em]">Ver mi pedido</span>
            <span className="font-display text-[24px] leading-none">{money(total)}</span>
          </div>
        </div>
      )}
    </div>
  );
};

const ItemCard: React.FC<{ item: DemoItem; flash?: number; canOrder: boolean; press?: number }> = ({
  item,
  flash,
  canOrder,
  press,
}) => {
  const Icon = ICON[item.cat];
  const pressS = press === undefined ? 1 : interpolate(press, [-1, 1, 5], [1, 0.9, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  return (
    <li
      className={`glass-card relative flex gap-3 p-2.5 ${item.available ? "" : "opacity-55"}`}
      style={{ boxShadow: flashShadow(flash) }}
    >
      <div
        className="grid h-[76px] w-[76px] shrink-0 place-items-center rounded-xl"
        style={{ background: "linear-gradient(135deg, color-mix(in srgb, var(--primary) 42%, #1b1b1b), #141414 85%)" }}
      >
        <Icon className={`h-8 w-8 text-white/90 ${item.available ? "" : "grayscale"}`} />
      </div>
      <div className="flex min-w-0 flex-1 flex-col py-0.5 pr-10">
        <p className="font-display text-[21px] uppercase leading-tight">{item.name}</p>
        <p className="line-clamp-2 text-[12px] leading-snug text-foreground/60">{item.desc}</p>
        <div className="mt-auto flex items-center gap-2 pt-1">
          <span className="font-display text-[20px] leading-none text-primary">{money(item.price)}</span>
          {!item.available && (
            <span className="rounded-md bg-destructive px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-[0.2em]">
              Agotado
            </span>
          )}
        </div>
      </div>
      {canOrder && item.available && (
        <span
          className="absolute bottom-2.5 right-2.5 grid h-9 w-9 place-items-center rounded-full bg-primary text-primary-foreground"
          style={{ transform: `scale(${pressS})` }}
        >
          <Plus className="h-5 w-5" />
        </span>
      )}
    </li>
  );
};
