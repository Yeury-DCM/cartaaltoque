import type { CSSProperties } from "react";

/**
 * Datos de la demo de la web (src/components/landing/demo-store.tsx de la app), sin el
 * reducer: en el video el estado sale del frame. Todo es ficticio.
 */

export type CategoryId = "entradas" | "fuertes" | "bebidas";
export type MenuTheme = "dark" | "light";
export type FontStyle = "classic" | "elegant" | "modern" | "bold";

export type DemoItem = {
  id: string;
  cat: CategoryId;
  name: string;
  desc: string;
  price: number;
  available: boolean;
  /** Foto principal del plato (public/dishes/, Pexels). */
  photo: string;
};

export const RESTAURANT = "La Terraza";
export const TAGLINE = "Parrilla criolla y platos para compartir";

export const CATEGORIES: { id: CategoryId; name: string }[] = [
  { id: "entradas", name: "Entradas" },
  { id: "fuertes", name: "Platos fuertes" },
  { id: "bebidas", name: "Bebidas" },
];

export const ITEMS: DemoItem[] = [
  { id: "tostones", cat: "entradas", name: "Tostones", desc: "Dorados y crujientes, con salsa rosada.", price: 250, available: true, photo: "dishes/tostones.jpg" },
  { id: "yuquitas", cat: "entradas", name: "Yuquitas de queso", desc: "Rellenas de queso, con dip de ajo.", price: 280, available: true, photo: "dishes/yuquitas.jpg" },
  { id: "costillas", cat: "fuertes", name: "Costillas BBQ", desc: "Media tabla glaseada en salsa BBQ.", price: 850, available: true, photo: "dishes/costillas.jpg" },
  { id: "pollo", cat: "fuertes", name: "Pollo a la parrilla", desc: "Pechuga marinada, arroz y ensalada.", price: 550, available: true, photo: "dishes/pollo.jpg" },
  { id: "hamburguesa", cat: "fuertes", name: "Hamburguesa de la casa", desc: "Res, cheddar, tocino y papas.", price: 450, available: true, photo: "dishes/hamburguesa.jpg" },
  { id: "limonada", cat: "bebidas", name: "Limonada frozen", desc: "Limón natural, bien fría.", price: 150, available: true, photo: "dishes/limonada.jpg" },
];

/** Los cambios que hace el dueño en E2 (y que el cliente ya ve en E3). */
export const NEW_PRICE = { id: "costillas", from: 850, to: 900 } as const;
export const SOLD_OUT = "pollo";

export const withChanges = (items: DemoItem[], price: boolean, soldOut: boolean): DemoItem[] =>
  items.map((i) => ({
    ...i,
    price: price && i.id === NEW_PRICE.id ? NEW_PRICE.to : i.price,
    available: soldOut && i.id === SOLD_OUT ? false : i.available,
  }));

export const money = (n: number) => `RD$ ${n.toLocaleString("es-DO", { maximumFractionDigits: 2 })}`;

export const catName = (id: string) => CATEGORIES.find((c) => c.id === id)?.name ?? "";

const HEX_RE = /^#[0-9a-f]{6}$/i;
export const DEFAULT_BRAND = "#FF7101";

/** ¿Texto oscuro o claro sobre este color? (lib/brand-color.ts de la app) */
function readableOn(hex: string): string {
  const [r, g, b] = [1, 3, 5].map((i) => {
    const c = parseInt(hex.slice(i, i + 2), 16) / 255;
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  });
  const lum = 0.2126 * r + 0.7152 * g + 0.0722 * b;
  return (lum + 0.05) / 0.05 >= 1.05 / (lum + 0.05) ? "oklch(0.13 0 0)" : "oklch(1 0 0)";
}

export function brandStyle(color: string | null | undefined): CSSProperties {
  const hex = color && HEX_RE.test(color) ? color : DEFAULT_BRAND;
  const fg = readableOn(hex);
  return {
    "--primary": hex,
    "--primary-foreground": fg,
    "--accent": hex,
    "--accent-foreground": fg,
    "--ring": `color-mix(in srgb, ${hex} 60%, transparent)`,
    "--border": `color-mix(in srgb, ${hex} 20%, transparent)`,
  } as CSSProperties;
}
