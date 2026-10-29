import { createFileRoute } from "@tanstack/react-router";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Loader2, Plus, Search, Tags, UtensilsCrossed } from "lucide-react";
import { ErrorNote } from "@/components/Center";
import { CategoryManager } from "@/components/admin/CategoryManager";
import { ItemForm } from "@/components/admin/ItemForm";
import { useAdmin } from "@/lib/admin";
import {
  filterAndSort,
  formatMoney,
  loadAdminMenu,
  mainPhoto,
  type Item,
  type MenuData,
  type SortKey,
} from "@/lib/menu";
import {
  errorMessage,
  MEDIA_BUCKET,
  photoUrl,
  smallPath,
  supabase,
  useOriginalOnError,
} from "@/lib/supabase";

export const Route = createFileRoute("/app/menu")({ component: MenuAdmin });

function MenuAdmin() {
  const { restaurant: r } = useAdmin();
  const [data, setData] = useState<MenuData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState<SortKey>("default");
  const [cat, setCat] = useState<string>("all");
  const [status, setStatus] = useState<"all" | "on" | "off">("all");
  const [editing, setEditing] = useState<Item | "new" | null>(null);
  const [showCats, setShowCats] = useState(false);

  const reload = useCallback(async () => {
    try {
      setData(await loadAdminMenu(r.id));
    } catch (e) {
      setError(errorMessage(e));
    }
  }, [r.id]);
  useEffect(() => void reload(), [reload]);

  const catName = useMemo(
    () => Object.fromEntries((data?.categories ?? []).map((c) => [c.id, c.name])),
    [data],
  );
  const counts = useMemo(() => {
    const m: Record<string, number> = {};
    data?.items.forEach((i) => (m[i.category_id] = (m[i.category_id] ?? 0) + 1));
    return m;
  }, [data]);

  const list = useMemo(() => {
    let base = data?.items ?? [];
    if (cat !== "all") base = base.filter((i) => i.category_id === cat);
    if (status !== "all") base = base.filter((i) => i.is_available === (status === "on"));
    return filterAndSort(base, query, sort);
  }, [data, cat, status, query, sort]);

  const toggle = async (i: Item) => {
    // actualización optimista
    setData(
      (d) =>
        d && {
          ...d,
          items: d.items.map((x) => (x.id === i.id ? { ...x, is_available: !x.is_available } : x)),
        },
    );
    const { error } = await supabase
      .from("items")
      .update({ is_available: !i.is_available })
      .eq("id", i.id)
      .eq("restaurant_id", r.id);
    if (error) {
      setError(error.message);
      void reload();
    }
  };

  const remove = async (i: Item) => {
    if (!confirm(`¿Borrar "${i.name}" y sus fotos?`)) return;
    const paths = i.item_photos.flatMap((p) => [p.path, smallPath(p.path)]);
    if (paths.length) await supabase.storage.from(MEDIA_BUCKET).remove(paths);
    const { error } = await supabase
      .from("items")
      .delete()
      .eq("id", i.id)
      .eq("restaurant_id", r.id);
    if (error) setError(error.message);
    await reload();
  };

  const sel =
    "rounded-lg border border-input bg-foreground/5 px-3 py-2.5 text-sm outline-none focus:border-primary";

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap gap-2">
        <button
          className="btn-primary"
          onClick={() => setEditing("new")}
          disabled={!data?.categories.length}
        >
          <Plus className="h-4 w-4" /> Nuevo plato
        </button>
        <button className="btn-ghost" onClick={() => setShowCats(true)}>
          <Tags className="h-4 w-4" /> Categorías
        </button>
      </div>

      <div className="grid gap-2 sm:grid-cols-[1fr_auto_auto_auto]">
        <label className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-foreground/50" />
          <input
            type="search"
            placeholder="Buscar plato…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className={`${sel} w-full pl-9`}
          />
        </label>
        <select
          className={sel}
          value={cat}
          onChange={(e) => setCat(e.target.value)}
          aria-label="Categoría"
        >
          <option value="all" className="bg-background">
            Todas las categorías
          </option>
          {data?.categories.map((c) => (
            <option key={c.id} value={c.id} className="bg-background">
              {c.name}
            </option>
          ))}
        </select>
        <select
          className={sel}
          value={status}
          onChange={(e) => setStatus(e.target.value as typeof status)}
          aria-label="Estado"
        >
          <option value="all" className="bg-background">
            Todos
          </option>
          <option value="on" className="bg-background">
            Disponibles
          </option>
          <option value="off" className="bg-background">
            Agotados
          </option>
        </select>
        <select
          className={sel}
          value={sort}
          onChange={(e) => setSort(e.target.value as SortKey)}
          aria-label="Ordenar"
        >
          <option value="default" className="bg-background">
            Orden del menú
          </option>
          <option value="price-asc" className="bg-background">
            Precio ↑
          </option>
          <option value="price-desc" className="bg-background">
            Precio ↓
          </option>
          <option value="name" className="bg-background">
            Nombre A–Z
          </option>
        </select>
      </div>

      {error && <ErrorNote>{error}</ErrorNote>}

      {!data ? (
        <div className="grid place-items-center py-16">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
        </div>
      ) : list.length === 0 ? (
        <p className="py-16 text-center text-foreground/60">
          {data.categories.length === 0
            ? "Crea una categoría primero (botón «Categorías»)."
            : data.items.length === 0
              ? "Aún no hay platos. Crea el primero."
              : "Nada coincide con el filtro."}
        </p>
      ) : (
        <ul className="space-y-2">
          {list.map((i) => {
            const photo = mainPhoto(i);
            return (
              <li
                key={i.id}
                className="flex items-center gap-3 rounded-xl border border-primary/15 bg-foreground/5 p-2.5"
              >
                <button
                  onClick={() => setEditing(i)}
                  className="flex min-w-0 flex-1 items-center gap-3 text-left"
                >
                  <div className="h-14 w-14 shrink-0 overflow-hidden rounded-lg bg-foreground/10">
                    {photo ? (
                      <img
                        src={photoUrl(photo.path, "sm")}
                        onError={useOriginalOnError}
                        alt=""
                        loading="lazy"
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <div className="grid h-full place-items-center text-primary/50">
                        <UtensilsCrossed className="h-5 w-5" />
                      </div>
                    )}
                  </div>
                  <div className="min-w-0">
                    <p
                      className={`truncate font-bold ${i.is_available ? "" : "text-foreground/50 line-through"}`}
                    >
                      {i.name}
                    </p>
                    <p className="truncate text-xs text-foreground/55">{catName[i.category_id]}</p>
                  </div>
                </button>
                <span className="font-display text-xl text-primary">
                  {formatMoney(i.price, r.currency)}
                </span>
                <button
                  role="switch"
                  aria-checked={i.is_available}
                  aria-label={i.is_available ? "Marcar agotado" : "Marcar disponible"}
                  title={i.is_available ? "Disponible" : "Agotado"}
                  onClick={() => void toggle(i)}
                  className={`relative h-6 w-11 shrink-0 rounded-full transition-colors ${i.is_available ? "bg-primary" : "bg-foreground/25"}`}
                >
                  <span
                    className={`absolute top-0.5 h-5 w-5 rounded-full bg-white transition-all ${i.is_available ? "left-[22px]" : "left-0.5"}`}
                  />
                </button>
                <button
                  onClick={() => void remove(i)}
                  aria-label="Borrar plato"
                  className="px-1 text-xs uppercase tracking-wider text-foreground/40 hover:text-destructive"
                >
                  Borrar
                </button>
              </li>
            );
          })}
        </ul>
      )}

      {editing && data && (
        <ItemForm
          key={editing === "new" ? "new" : editing.id}
          item={editing === "new" ? null : editing}
          categories={data.categories}
          onClose={() => setEditing(null)}
          onChanged={reload}
        />
      )}
      {showCats && data && (
        <CategoryManager
          categories={data.categories}
          itemCounts={counts}
          onClose={() => setShowCats(false)}
          onChanged={reload}
        />
      )}
    </div>
  );
}
