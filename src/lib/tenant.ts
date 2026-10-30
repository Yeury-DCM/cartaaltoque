import type { FontStyle, MenuTheme } from "./brand-color";
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
  theme: MenuTheme;
  font_style: FontStyle;
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

export { brandStyle, DEFAULT_BRAND } from "./brand-color";

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
