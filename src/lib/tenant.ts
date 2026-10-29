import type { CSSProperties } from "react";
import type { Category, Currency, Item } from "./menu";
import { normalizeItem } from "./menu";
import { SSR_CACHE_MS, serverCached } from "./server-cache";
import { supabase } from "./supabase";
import type { DeliveryZone } from "./zones";

export type Plan = "basic" | "pro";
export type RestaurantStatus = "trial" | "active" | "suspended";

export const LINK_KINDS = [
  "pedidosya",
  "ubereats",
  "instagram",
  "facebook",
  "tiktok",
  "website",
  "maps",
] as const;
export type LinkKind = (typeof LINK_KINDS)[number];
export type RestaurantLink = { kind: LinkKind; url: string };

/** Lo que el público ve de un restaurante (sin plan, estado ni datos internos). */
export type PublicRestaurant = {
  id: string;
  slug: string;
  name: string;
  tagline: string | null;
  description: string | null;
  logo_path: string | null;
  cover_path: string | null;
  brand_color: string;
  whatsapp: string | null;
  address: string | null;
  hours: string | null;
  currency: Currency;
};

/** Fila completa de restaurants, como la ven sus miembros en el panel. */
export type Restaurant = PublicRestaurant & {
  is_published: boolean;
  status: RestaurantStatus;
  plan: Plan;
  trial_ends_at: string | null;
  created_at: string;
};

export type PublicMenu = {
  restaurant: PublicRestaurant;
  links: RestaurantLink[];
  categories: Category[];
  items: Item[];
  zones: DeliveryZone[];
};

/**
 * Resolución del tenant. Hoy sale de la ruta (/r/:slug); si mañana se usan
 * subdominios o dominios propios, solo cambia esta función.
 */
export function normalizeSlug(raw: string): string {
  return raw.trim().toLowerCase();
}

/** Convierte un nombre en un slug válido: "Café Doña Ana" → "cafe-dona-ana". */
export function slugify(name: string): string {
  return name
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 40)
    .replace(/-+$/g, "");
}

export const SLUG_RE = /^[a-z0-9][a-z0-9-]{1,38}[a-z0-9]$/;
export const isValidSlug = (s: string) => SLUG_RE.test(s) && !s.includes("--");

async function loadPublicMenu(slug: string): Promise<PublicMenu | null> {
  const { data, error } = await supabase.rpc("get_public_menu", { p_slug: slug });
  if (error) throw error;
  if (!data) return null;
  const menu = data as PublicMenu;
  return {
    ...menu,
    items: menu.items.map(normalizeItem),
    zones: menu.zones.map((z) => ({ ...z, fee: Number(z.fee) })),
  };
}

/** Menú público por slug; en el servidor se reutiliza hasta 1 minuto. */
export const fetchPublicMenu = (rawSlug: string) => {
  const slug = normalizeSlug(rawSlug);
  return serverCached(`menu:${slug}`, SSR_CACHE_MS, () => loadPublicMenu(slug));
};

const HEX_RE = /^#[0-9a-f]{6}$/i;
export const DEFAULT_BRAND = "#FF7101";

/** ¿Texto oscuro o claro sobre este color? Se elige el de mayor contraste (WCAG). */
function readableOn(hex: string): string {
  const [r, g, b] = [1, 3, 5].map((i) => {
    const c = parseInt(hex.slice(i, i + 2), 16) / 255;
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  });
  const lum = 0.2126 * r + 0.7152 * g + 0.0722 * b;
  // Contraste con negro: (lum + .05) / .05; con blanco: 1.05 / (lum + .05).
  return (lum + 0.05) / 0.05 >= 1.05 / (lum + 0.05) ? "oklch(0.13 0 0)" : "oklch(1 0 0)";
}

/**
 * Variables CSS con el color del restaurante. Todo el diseño (botones, bordes,
 * brillos) se deriva de --primary. El color se valida otra vez aquí aunque la
 * base de datos ya lo restringe: nunca se inyecta texto arbitrario en estilos.
 */
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

/** Días que le quedan a la prueba (0 si venció, null si no aplica). */
export function trialDaysLeft(r: Pick<Restaurant, "status" | "trial_ends_at">): number | null {
  if (r.status !== "trial" || !r.trial_ends_at) return null;
  const ms = new Date(r.trial_ends_at).getTime() - Date.now();
  return Math.max(0, Math.ceil(ms / 86_400_000));
}

/** Mismo criterio que private.is_live() en la base de datos. */
export function isLive(r: Pick<Restaurant, "status" | "trial_ends_at">): boolean {
  if (r.status === "active") return true;
  if (r.status !== "trial") return false;
  return !r.trial_ends_at || new Date(r.trial_ends_at).getTime() > Date.now();
}

/** Acepta "instagram.com/x" y lo deja como "https://instagram.com/x"; rechaza otros esquemas. */
export function normalizeHttpsUrl(raw: string): string | null {
  const v = raw.trim();
  if (!v) return null;
  const withScheme = /^[a-z][a-z0-9+.-]*:/i.test(v) ? v : `https://${v.replace(/^\/+/, "")}`;
  try {
    const u = new URL(withScheme);
    if (u.protocol !== "https:" || !u.hostname.includes(".")) return null;
    return u.toString();
  } catch {
    return null;
  }
}

export const onlyDigits = (s: string) => s.replace(/\D/g, "");
