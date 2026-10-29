import { supabase } from "./supabase";

export type Category = {
  id: string;
  name: string;
  sort_order: number;
  is_visible: boolean;
};

export type ItemPhoto = {
  id: string;
  item_id: string;
  path: string;
  is_primary: boolean;
  sort_order: number;
};

export type ItemVariant = {
  id: string;
  item_id: string;
  label: string;
  price: number;
  sort_order: number;
};

export type Item = {
  id: string;
  category_id: string;
  name: string;
  description: string | null;
  price: number;
  is_available: boolean;
  sort_order: number;
  item_photos: ItemPhoto[];
  item_variants: ItemVariant[];
};

export type MenuData = { categories: Category[]; items: Item[] };

export const ITEM_SELECT = "*, item_photos(*), item_variants(*)";

/** Normaliza una fila de Supabase (precios numéricos, variantes ordenadas). */
export function normalizeItem(i: Item): Item {
  return {
    ...i,
    price: Number(i.price),
    item_photos: i.item_photos ?? [],
    item_variants: [...(i.item_variants ?? [])]
      .map((v) => ({ ...v, price: Number(v.price) }))
      .sort((a, b) => a.sort_order - b.sort_order),
  };
}

/** Menú completo de un restaurante para el panel (incluye lo oculto y agotado). */
export async function loadAdminMenu(restaurantId: string): Promise<MenuData> {
  const [cats, items] = await Promise.all([
    supabase
      .from("categories")
      .select("*")
      .eq("restaurant_id", restaurantId)
      .order("sort_order")
      .order("name"),
    supabase
      .from("items")
      .select(ITEM_SELECT)
      .eq("restaurant_id", restaurantId)
      .order("sort_order")
      .order("name"),
  ]);
  if (cats.error) throw cats.error;
  if (items.error) throw items.error;
  return {
    categories: cats.data as Category[],
    items: (items.data as Item[]).map(normalizeItem),
  };
}

/** Foto principal si existe; si no, la primera por orden. */
export function mainPhoto(item: Item): ItemPhoto | undefined {
  return (
    item.item_photos.find((p) => p.is_primary) ??
    [...item.item_photos].sort((a, b) => a.sort_order - b.sort_order)[0]
  );
}

export type Currency = "DOP" | "USD";

const CURRENCY_PREFIX: Record<Currency, string> = { DOP: "RD$", USD: "US$" };

export const formatMoney = (n: number, currency: Currency = "DOP") =>
  `${CURRENCY_PREFIX[currency] ?? currency} ${n.toLocaleString("es-DO", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  })}`;

export type SortKey = "default" | "price-asc" | "price-desc" | "name";

export function filterAndSort(items: Item[], query: string, sort: SortKey): Item[] {
  const q = query.trim().toLowerCase();
  const out = q
    ? items.filter((i) => `${i.name} ${i.description ?? ""}`.toLowerCase().includes(q))
    : [...items];
  if (sort === "price-asc") out.sort((a, b) => a.price - b.price);
  else if (sort === "price-desc") out.sort((a, b) => b.price - a.price);
  else if (sort === "name") out.sort((a, b) => a.name.localeCompare(b.name, "es"));
  return out;
}

async function encodeWebp(
  file: Blob,
  scaleFor: (w: number, h: number) => number,
  quality: number,
): Promise<Blob> {
  const bmp = await createImageBitmap(file);
  const scale = Math.min(1, scaleFor(bmp.width, bmp.height));
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(bmp.width * scale);
  canvas.height = Math.round(bmp.height * scale);
  canvas.getContext("2d")!.drawImage(bmp, 0, 0, canvas.width, canvas.height);
  return new Promise((resolve, reject) =>
    canvas.toBlob(
      (b) => (b ? resolve(b) : reject(new Error("No se pudo comprimir"))),
      "image/webp",
      quality,
    ),
  );
}

/** Foto grande: lado largo 1200 px. Se usa en el detalle del plato y el visor. */
export const compressImage = (file: Blob) =>
  encodeWebp(file, (w, h) => 1200 / Math.max(w, h), 0.82);

/** Miniatura: lado corto 480 px (~30 KB). Se usa en tarjetas y en el panel. */
export const makeThumbnail = (file: Blob) => encodeWebp(file, (w, h) => 480 / Math.min(w, h), 0.72);

/** Logo: lado largo 512 px. */
export const compressLogo = (file: Blob) => encodeWebp(file, (w, h) => 512 / Math.max(w, h), 0.9);

/** Portada: lado largo 1600 px. */
export const compressCover = (file: Blob) => encodeWebp(file, (w, h) => 1600 / Math.max(w, h), 0.8);
