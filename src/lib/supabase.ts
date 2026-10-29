import type { SyntheticEvent } from "react";
import { createClient } from "@supabase/supabase-js";

const url = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const key = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY as string | undefined;

if (!url || !key) {
  console.warn("Faltan VITE_SUPABASE_URL / VITE_SUPABASE_PUBLISHABLE_KEY en .env.local");
}

export const supabase = createClient(url ?? "http://localhost", key ?? "missing", {
  auth: {
    persistSession: typeof window !== "undefined",
    autoRefreshToken: typeof window !== "undefined",
  },
});

/**
 * Bucket público de imágenes. Cada restaurante solo escribe en su carpeta
 * (lo impone la base de datos):
 *   {restaurant_id}/items/{item_id}/{uuid}.webp
 *   {restaurant_id}/brand/{uuid}.webp
 */
export const MEDIA_BUCKET = "media";

/** Cada foto se guarda en dos tamaños: la original (lado largo 1200 px) y "-sm" (lado corto 480 px). */
export type PhotoSize = "sm" | "lg";

/** Las rutas llevan un UUID y nunca cambian, así que el navegador y la CDN pueden guardarlas 1 año. */
export const PHOTO_CACHE_SECONDS = "31536000";

export const smallPath = (path: string) => path.replace(/\.webp$/, "-sm.webp");

export function mediaUrl(path: string) {
  return supabase.storage.from(MEDIA_BUCKET).getPublicUrl(path).data.publicUrl;
}

export function photoUrl(path: string, size: PhotoSize = "lg") {
  return mediaUrl(size === "sm" ? smallPath(path) : path);
}

/** Si una foto no tiene versión pequeña, muestra la original. */
export function useOriginalOnError(e: SyntheticEvent<HTMLImageElement>) {
  const img = e.currentTarget;
  if (img.dataset.fallback || !img.src.includes("-sm.webp")) return;
  img.dataset.fallback = "1";
  img.src = img.src.replace("-sm.webp", ".webp");
}

/** Mensaje legible de un error de Supabase o de JavaScript. */
export function errorMessage(e: unknown): string {
  if (e instanceof Error) return e.message;
  return (e as { message?: string })?.message ?? String(e);
}
