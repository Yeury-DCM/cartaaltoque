import { useState } from "react";
import { ArrowDown, ArrowUp, Eye, EyeOff, Plus, Trash2, X } from "lucide-react";
import { ErrorNote } from "@/components/Center";
import { useAdmin } from "@/lib/admin";
import { supabase } from "@/lib/supabase";
import type { Category } from "@/lib/menu";

type Result = PromiseLike<{ error: { message: string } | null }>;

export function CategoryManager({
  categories,
  itemCounts,
  onClose,
  onChanged,
}: {
  categories: Category[];
  itemCounts: Record<string, number>;
  onClose: () => void;
  onChanged: () => Promise<void>;
}) {
  const { restaurant } = useAdmin();
  const rid = restaurant.id;
  const [newName, setNewName] = useState("");
  const [error, setError] = useState<string | null>(null);

  async function run(p: Result) {
    setError(null);
    const { error } = await p;
    if (error) setError(error.message);
    else await onChanged();
  }

  const table = () => supabase.from("categories");

  const add = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim()) return;
    const order = (categories[categories.length - 1]?.sort_order ?? 0) + 1;
    void run(table().insert({ restaurant_id: rid, name: newName.trim(), sort_order: order })).then(
      () => setNewName(""),
    );
  };

  // Reasigna sort_order a todas para que mover siempre funcione aunque haya empates
  const move = (i: number, dir: -1 | 1) => {
    const next = [...categories];
    const j = i + dir;
    if (j < 0 || j >= next.length) return;
    [next[i], next[j]] = [next[j], next[i]];
    void run(
      table().upsert(
        next.map((c, idx) => ({ id: c.id, restaurant_id: rid, name: c.name, sort_order: idx + 1 })),
      ),
    );
  };

  return (
    <div
      className="fixed inset-0 z-[80] flex items-end justify-center bg-background/80 backdrop-blur-md md:items-center"
      onClick={onClose}
    >
      <div
        className="flex max-h-[90svh] w-full flex-col overflow-hidden rounded-t-2xl border border-primary/30 bg-background md:w-[min(520px,92vw)] md:rounded-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <header className="flex items-center justify-between border-b border-primary/15 px-5 py-4">
          <h2 className="font-display text-2xl uppercase">Categorías</h2>
          <button
            onClick={onClose}
            aria-label="Cerrar"
            className="grid h-9 w-9 place-items-center rounded-full bg-foreground/10 hover:bg-primary hover:text-primary-foreground"
          >
            <X className="h-5 w-5" />
          </button>
        </header>
        <div className="space-y-4 overflow-y-auto px-5 py-5">
          <form onSubmit={add} className="flex gap-2">
            <input
              value={newName}
              maxLength={60}
              onChange={(e) => setNewName(e.target.value)}
              placeholder="Nueva categoría"
              className="flex-1 rounded-lg border border-input bg-foreground/5 px-3 py-2.5 text-sm outline-none focus:border-primary"
            />
            <button className="btn-primary !px-4" aria-label="Agregar">
              <Plus className="h-4 w-4" />
            </button>
          </form>
          <ul className="space-y-2">
            {categories.map((c, i) => (
              <li
                key={c.id}
                className="flex items-center gap-1 rounded-xl border border-primary/15 bg-foreground/5 p-2"
              >
                <input
                  defaultValue={c.name}
                  maxLength={60}
                  onBlur={(e) => {
                    const v = e.target.value.trim();
                    if (v && v !== c.name)
                      void run(table().update({ name: v }).eq("id", c.id).eq("restaurant_id", rid));
                  }}
                  className={`min-w-0 flex-1 bg-transparent px-2 py-1.5 text-sm outline-none focus:text-primary ${c.is_visible ? "" : "opacity-50"}`}
                />
                <span className="px-1 text-xs text-foreground/50">{itemCounts[c.id] ?? 0}</span>
                <IconBtn label="Subir" disabled={i === 0} onClick={() => move(i, -1)}>
                  <ArrowUp className="h-4 w-4" />
                </IconBtn>
                <IconBtn
                  label="Bajar"
                  disabled={i === categories.length - 1}
                  onClick={() => move(i, 1)}
                >
                  <ArrowDown className="h-4 w-4" />
                </IconBtn>
                <IconBtn
                  label={c.is_visible ? "Ocultar" : "Mostrar"}
                  onClick={() =>
                    void run(
                      table()
                        .update({ is_visible: !c.is_visible })
                        .eq("id", c.id)
                        .eq("restaurant_id", rid),
                    )
                  }
                >
                  {c.is_visible ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
                </IconBtn>
                <IconBtn
                  label="Borrar"
                  disabled={(itemCounts[c.id] ?? 0) > 0}
                  onClick={() =>
                    confirm(`¿Borrar "${c.name}"?`) &&
                    void run(table().delete().eq("id", c.id).eq("restaurant_id", rid))
                  }
                >
                  <Trash2 className="h-4 w-4" />
                </IconBtn>
              </li>
            ))}
          </ul>
          <p className="text-xs text-foreground/50">
            Solo se pueden borrar categorías sin platos. Ocultar una categoría la quita del menú
            público.
          </p>
          {error && <ErrorNote>{error}</ErrorNote>}
        </div>
      </div>
    </div>
  );
}

function IconBtn({
  label,
  children,
  ...p
}: { label: string; children: React.ReactNode } & React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      {...p}
      aria-label={label}
      title={label}
      className="grid h-8 w-8 place-items-center rounded-md text-foreground/70 hover:text-primary disabled:opacity-25 disabled:hover:text-foreground/70"
    >
      {children}
    </button>
  );
}
