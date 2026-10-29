import { useState } from "react";
import { Loader2, Star, Trash2, Upload, X } from "lucide-react";
import { ErrorNote, fieldClass } from "@/components/Center";
import { useAdmin } from "@/lib/admin";
import {
  compressImage,
  makeThumbnail,
  ITEM_SELECT,
  normalizeItem,
  type Category,
  type Item,
  type ItemPhoto,
} from "@/lib/menu";
import {
  errorMessage,
  MEDIA_BUCKET,
  PHOTO_CACHE_SECONDS,
  photoUrl,
  smallPath,
  supabase,
  useOriginalOnError,
} from "@/lib/supabase";

type Props = {
  item: Item | null; // null = plato nuevo
  categories: Category[];
  onClose: () => void;
  onChanged: () => Promise<void>;
};

const MAX_PHOTOS = 6;

export function ItemForm({ item: initial, categories, onClose, onChanged }: Props) {
  const { restaurant } = useAdmin();
  const rid = restaurant.id;
  const [item, setItem] = useState<Item | null>(initial);
  const [name, setName] = useState(initial?.name ?? "");
  const [description, setDescription] = useState(initial?.description ?? "");
  const [price, setPrice] = useState(initial ? String(initial.price) : "");
  const [categoryId, setCategoryId] = useState(initial?.category_id ?? categories[0]?.id ?? "");
  const [available, setAvailable] = useState(initial?.is_available ?? true);
  const [variants, setVariants] = useState<{ label: string; price: string }[]>(
    (initial?.item_variants ?? []).map((v) => ({ label: v.label, price: String(v.price) })),
  );
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const photos: ItemPhoto[] = [...(item?.item_photos ?? [])].sort(
    (a, b) => a.sort_order - b.sort_order,
  );

  async function run(fn: () => Promise<void>) {
    setBusy(true);
    setError(null);
    try {
      await fn();
    } catch (e) {
      setError(errorMessage(e));
    } finally {
      setBusy(false);
    }
  }

  const syncVariants = async (itemId: string, rows: { label: string; price: number }[]) => {
    const del = await supabase
      .from("item_variants")
      .delete()
      .eq("item_id", itemId)
      .eq("restaurant_id", rid);
    if (del.error) throw del.error;
    if (!rows.length) return;
    const ins = await supabase.from("item_variants").insert(
      rows.map((v, i) => ({
        restaurant_id: rid,
        item_id: itemId,
        label: v.label,
        price: v.price,
        sort_order: i + 1,
      })),
    );
    if (ins.error) throw ins.error;
  };

  const save = (e: React.FormEvent) => {
    e.preventDefault();
    const rows = variants.map((v) => ({ label: v.label.trim(), price: Number(v.price) }));
    if (rows.some((v) => !v.label || !Number.isFinite(v.price) || v.price < 0))
      return setError("Cada variante necesita nombre y un precio válido.");
    const priceNum = rows.length ? Math.min(...rows.map((v) => v.price)) : Number(price);
    if (!name.trim()) return setError("El nombre es obligatorio.");
    if (!categoryId) return setError("Elige una categoría.");
    if (!Number.isFinite(priceNum) || priceNum < 0) return setError("Precio inválido.");
    void run(async () => {
      const payload = {
        name: name.trim(),
        description: description.trim() || null,
        price: priceNum,
        category_id: categoryId,
        is_available: available,
      };
      if (item) {
        const { error } = await supabase
          .from("items")
          .update(payload)
          .eq("id", item.id)
          .eq("restaurant_id", rid);
        if (error) throw error;
        await syncVariants(item.id, rows);
        await onChanged();
        onClose();
      } else {
        const { data, error } = await supabase
          .from("items")
          .insert({ ...payload, restaurant_id: rid })
          .select("id")
          .single();
        if (error) throw error;
        await syncVariants(data.id, rows);
        await reloadItem(data.id);
        await onChanged(); // queda abierto para agregar fotos
      }
    });
  };

  const reloadItem = async (id: string) => {
    const { data, error } = await supabase
      .from("items")
      .select(ITEM_SELECT)
      .eq("id", id)
      .eq("restaurant_id", rid)
      .single();
    if (error) throw error;
    setItem(normalizeItem(data as Item));
    await onChanged();
  };

  const upload = (files: FileList | null) => {
    if (!files?.length || !item) return;
    const list = Array.from(files).slice(0, Math.max(0, MAX_PHOTOS - photos.length));
    if (!list.length) return setError(`Máximo ${MAX_PHOTOS} fotos por plato.`);
    void run(async () => {
      let hasPrimary = photos.some((p) => p.is_primary);
      let order = photos.length;
      for (const file of list) {
        const [big, small] = await Promise.all([compressImage(file), makeThumbnail(file)]);
        const path = `${rid}/items/${item.id}/${crypto.randomUUID()}.webp`;
        const opts = { contentType: "image/webp", cacheControl: PHOTO_CACHE_SECONDS };
        for (const [p, blob] of [
          [path, big],
          [smallPath(path), small],
        ] as const) {
          const up = await supabase.storage.from(MEDIA_BUCKET).upload(p, blob, opts);
          if (up.error) throw up.error;
        }
        const ins = await supabase.from("item_photos").insert({
          restaurant_id: rid,
          item_id: item.id,
          path,
          is_primary: !hasPrimary,
          sort_order: order++,
        });
        if (ins.error) throw ins.error;
        hasPrimary = true;
      }
      await reloadItem(item.id);
    });
  };

  const makePrimary = (p: ItemPhoto) =>
    run(async () => {
      const { error } = await supabase.rpc("set_primary_photo", { p_photo_id: p.id });
      if (error) throw error;
      await reloadItem(p.item_id);
    });

  const removePhoto = (p: ItemPhoto) => {
    if (!confirm("¿Borrar esta foto?")) return;
    void run(async () => {
      await supabase.storage.from(MEDIA_BUCKET).remove([p.path, smallPath(p.path)]);
      const { error } = await supabase
        .from("item_photos")
        .delete()
        .eq("id", p.id)
        .eq("restaurant_id", rid);
      if (error) throw error;
      const rest = photos.filter((x) => x.id !== p.id);
      if (p.is_primary && rest.length)
        await supabase.rpc("set_primary_photo", { p_photo_id: rest[0].id });
      await reloadItem(p.item_id);
    });
  };

  return (
    <div
      className="fixed inset-0 z-[80] flex items-end justify-center bg-background/80 backdrop-blur-md md:items-center"
      onClick={onClose}
    >
      <div
        className="relative flex max-h-[95svh] w-full flex-col overflow-hidden rounded-t-2xl border border-primary/30 bg-background md:w-[min(640px,92vw)] md:rounded-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <header className="flex items-center justify-between border-b border-primary/15 px-5 py-4">
          <h2 className="font-display text-2xl uppercase">
            {item ? "Editar plato" : "Nuevo plato"}
          </h2>
          <button
            onClick={onClose}
            aria-label="Cerrar"
            className="grid h-9 w-9 place-items-center rounded-full bg-foreground/10 hover:bg-primary hover:text-primary-foreground"
          >
            <X className="h-5 w-5" />
          </button>
        </header>

        <div className="space-y-6 overflow-y-auto px-5 py-5">
          <form onSubmit={save} className="space-y-4">
            <label className="block space-y-1.5 text-xs uppercase tracking-[0.15em] text-foreground/70">
              Nombre
              <input
                className={fieldClass}
                value={name}
                maxLength={80}
                onChange={(e) => setName(e.target.value)}
              />
            </label>
            <label className="block space-y-1.5 text-xs uppercase tracking-[0.15em] text-foreground/70">
              Descripción
              <textarea
                className={fieldClass}
                rows={3}
                maxLength={500}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </label>
            <div className="grid grid-cols-2 gap-3">
              <label className="block space-y-1.5 text-xs uppercase tracking-[0.15em] text-foreground/70">
                Precio ({restaurant.currency === "USD" ? "US$" : "RD$"})
                <input
                  className={fieldClass}
                  inputMode="decimal"
                  value={
                    variants.length
                      ? String(Math.min(...variants.map((v) => Number(v.price) || 0)))
                      : price
                  }
                  disabled={variants.length > 0}
                  onChange={(e) => setPrice(e.target.value)}
                />
              </label>
              <label className="block space-y-1.5 text-xs uppercase tracking-[0.15em] text-foreground/70">
                Categoría
                <select
                  className={fieldClass}
                  value={categoryId}
                  onChange={(e) => setCategoryId(e.target.value)}
                >
                  {categories.map((c) => (
                    <option key={c.id} value={c.id} className="bg-background">
                      {c.name}
                    </option>
                  ))}
                </select>
              </label>
            </div>
            <div className="space-y-2">
              <p className="text-xs uppercase tracking-[0.15em] text-foreground/70">
                Tamaños / variantes (opcional)
              </p>
              {variants.map((v, idx) => (
                <div key={idx} className="flex gap-2">
                  <input
                    className={fieldClass}
                    placeholder="Personal, Grande, +Papas…"
                    maxLength={30}
                    value={v.label}
                    onChange={(e) =>
                      setVariants((a) =>
                        a.map((x, j) => (j === idx ? { ...x, label: e.target.value } : x)),
                      )
                    }
                  />
                  <input
                    className={`${fieldClass} max-w-28`}
                    inputMode="decimal"
                    placeholder="Precio"
                    value={v.price}
                    onChange={(e) =>
                      setVariants((a) =>
                        a.map((x, j) => (j === idx ? { ...x, price: e.target.value } : x)),
                      )
                    }
                  />
                  <button
                    type="button"
                    aria-label="Quitar variante"
                    onClick={() => setVariants((a) => a.filter((_, j) => j !== idx))}
                    className="grid w-9 shrink-0 place-items-center rounded-lg text-foreground/50 hover:text-destructive"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              ))}
              <button
                type="button"
                className="text-xs font-bold uppercase tracking-[0.15em] text-primary"
                onClick={() => setVariants((a) => [...a, { label: "", price: "" }])}
              >
                + Agregar variante
              </button>
              {variants.length > 0 && (
                <p className="text-xs text-foreground/50">
                  Con variantes, el precio del plato es el más bajo de ellas.
                </p>
              )}
            </div>
            <label className="flex items-center gap-3 text-sm">
              <input
                type="checkbox"
                checked={available}
                onChange={(e) => setAvailable(e.target.checked)}
                className="h-5 w-5 accent-primary"
              />
              Disponible ahora
            </label>
            <button disabled={busy} className="btn-primary w-full">
              {busy && <Loader2 className="h-4 w-4 animate-spin" />}
              {item ? "Guardar cambios" : "Crear plato"}
            </button>
          </form>

          <section>
            <h3 className="mb-3 text-xs uppercase tracking-[0.15em] text-primary">Fotos</h3>
            {!item ? (
              <p className="text-sm text-foreground/60">
                Crea el plato primero y luego podrás subir fotos.
              </p>
            ) : (
              <>
                <div className="grid grid-cols-3 gap-3">
                  {photos.map((p) => (
                    <div
                      key={p.id}
                      className={`relative aspect-square overflow-hidden rounded-xl border-2 ${p.is_primary ? "border-primary" : "border-transparent"}`}
                    >
                      <img
                        src={photoUrl(p.path, "sm")}
                        onError={useOriginalOnError}
                        alt=""
                        className="h-full w-full object-cover"
                      />
                      <div className="absolute inset-x-0 bottom-0 flex justify-between bg-background/80 p-1">
                        <button
                          type="button"
                          onClick={() => void makePrimary(p)}
                          aria-label="Hacer principal"
                          title="Hacer principal"
                          className={`grid h-7 w-7 place-items-center rounded ${p.is_primary ? "text-primary" : "text-foreground/60 hover:text-primary"}`}
                        >
                          <Star className="h-4 w-4" fill={p.is_primary ? "currentColor" : "none"} />
                        </button>
                        <button
                          type="button"
                          onClick={() => removePhoto(p)}
                          aria-label="Borrar foto"
                          className="grid h-7 w-7 place-items-center rounded text-foreground/60 hover:text-destructive"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                  {photos.length < MAX_PHOTOS && (
                    <label className="grid aspect-square cursor-pointer place-items-center rounded-xl border-2 border-dashed border-primary/40 text-primary/80 hover:border-primary">
                      <span className="flex flex-col items-center gap-1 text-xs uppercase tracking-[0.15em]">
                        <Upload className="h-5 w-5" /> Subir
                      </span>
                      <input
                        type="file"
                        accept="image/*"
                        multiple
                        className="hidden"
                        onChange={(e) => {
                          upload(e.target.files);
                          e.target.value = "";
                        }}
                      />
                    </label>
                  )}
                </div>
                <p className="mt-2 text-xs text-foreground/50">
                  La estrella marca la foto principal que se ve en el menú.
                </p>
              </>
            )}
          </section>

          {error && <ErrorNote>{error}</ErrorNote>}
        </div>
      </div>
    </div>
  );
}
