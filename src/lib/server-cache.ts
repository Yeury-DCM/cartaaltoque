/**
 * Memoria corta para las consultas que hace el servidor al renderizar (SSR).
 * Evita ir a Supabase en cada visita; un cambio hecho en el panel tarda como
 * máximo `ttlMs` en verse. En el navegador no guarda nada: el panel siempre lee fresco.
 */
const store = new Map<string, { at: number; value: Promise<unknown> }>();
const MAX_ENTRIES = 500;

export function serverCached<T>(key: string, ttlMs: number, load: () => Promise<T>): Promise<T> {
  if (typeof window !== "undefined") return load();

  const hit = store.get(key);
  if (hit && Date.now() - hit.at < ttlMs) return hit.value as Promise<T>;

  // Con muchos restaurantes, se descarta lo más viejo para no crecer sin límite.
  if (store.size >= MAX_ENTRIES) {
    const oldest = store.keys().next().value;
    if (oldest !== undefined) store.delete(oldest);
  }

  const value = load();
  store.delete(key);
  store.set(key, { at: Date.now(), value });
  // Si la consulta falla, no se queda guardado el error.
  value.catch(() => store.delete(key));
  return value;
}

export const SSR_CACHE_MS = 15_000;
