/**
 * Datos de la marca del SaaS. El resto de la app toma el nombre de aquí.
 * Se escribe separado ("Carta al Toque") para que se lea bien en mayúsculas;
 * el dominio va junto.
 */
export const APP_NAME = "Carta al Toque";
export const APP_DOMAIN = "cartaaltoque.com";
export const APP_TAGLINE = "Tu menú digital con pedidos por WhatsApp";
export const TRIAL_DAYS = 14;
/** Correo público de contacto (privacidad y soporte). */
export const CONTACT_EMAIL = "hola@cartaaltoque.com";
/** Contacto para soporte y planes (WhatsApp del negocio del SaaS, solo dígitos). */
export const SUPPORT_WHATSAPP = (import.meta.env.VITE_SUPPORT_WHATSAPP as string | undefined) ?? "";

/**
 * Origen del sitio para enlaces y QR: el de la página que se está viendo, así que no
 * hace falta configurar el dominio ni volver a desplegar si cambia. Solo se usa en el
 * panel (que corre en el navegador), nunca en el servidor.
 */
export function publicOrigin(): string {
  return typeof window !== "undefined" ? window.location.origin : "";
}

export const menuPath = (slug: string) => `/r/${slug}`;
export const menuUrl = (slug: string) => `${publicOrigin()}${menuPath(slug)}`;
