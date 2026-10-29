/**
 * Datos de la marca del SaaS. El resto de la app toma el nombre de aquí.
 * Se escribe separado ("Carta al Toque") para que se lea bien en mayúsculas;
 * el dominio va junto.
 */
export const APP_NAME = "Carta al Toque";
export const APP_DOMAIN = "cartaltoque.com";
export const APP_TAGLINE = "Tu menú digital con pedidos por WhatsApp";
export const TRIAL_DAYS = 14;
/** Contacto para soporte y planes (WhatsApp del negocio del SaaS, solo dígitos). */
export const SUPPORT_WHATSAPP = (import.meta.env.VITE_SUPPORT_WHATSAPP as string | undefined) ?? "";

/** Origen público para enlaces y QR (en desarrollo, el del navegador). */
export function publicOrigin(): string {
  const configured = import.meta.env.VITE_PUBLIC_SITE_URL as string | undefined;
  if (configured) return configured.replace(/\/+$/, "");
  return typeof window !== "undefined" ? window.location.origin : "";
}

export const menuPath = (slug: string) => `/r/${slug}`;
export const menuUrl = (slug: string) => `${publicOrigin()}${menuPath(slug)}`;
