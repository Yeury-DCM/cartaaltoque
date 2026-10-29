const SUPABASE_URL = (import.meta.env.VITE_SUPABASE_URL as string | undefined) ?? "";
const SUPABASE_HOST = SUPABASE_URL ? new URL(SUPABASE_URL).host : "*.supabase.co";

/**
 * Política de contenido: de dónde puede cargar cosas la página.
 * Los scripts en línea siguen permitidos porque el SSR de TanStack los usa para hidratar.
 */
const CSP = [
  "default-src 'self'",
  "script-src 'self' 'unsafe-inline'",
  "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
  "font-src 'self' https://fonts.gstatic.com",
  `img-src 'self' data: blob: https://${SUPABASE_HOST}`,
  `connect-src 'self' https://${SUPABASE_HOST} wss://${SUPABASE_HOST}`,
  "frame-src 'none'",
  "frame-ancestors 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "object-src 'none'",
].join("; ");

/** Cabeceras para todas las páginas que entrega el servidor. */
export function securityHeaders(): Record<string, string> {
  const headers: Record<string, string> = {
    "X-Content-Type-Options": "nosniff",
    "X-Frame-Options": "DENY",
    "Referrer-Policy": "strict-origin-when-cross-origin",
    "Permissions-Policy": "camera=(), microphone=(), geolocation=(), payment=(), usb=()",
    "Strict-Transport-Security": "max-age=31536000; includeSubDomains",
  };
  // En desarrollo Vite inyecta su propio cliente de recarga; la CSP solo se aplica en producción.
  if (import.meta.env.PROD) headers["Content-Security-Policy"] = CSP;
  return headers;
}

/** Para el panel y el super admin: nunca en caché ni en buscadores. */
export const privatePageHeaders = () => ({
  "Cache-Control": "no-store",
  "X-Robots-Tag": "noindex, nofollow",
});
