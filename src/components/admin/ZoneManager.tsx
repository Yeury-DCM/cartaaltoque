import { useEffect, useState } from "react";
import { ArrowDown, ArrowUp, Eye, EyeOff, Loader2, Plus, Trash2 } from "lucide-react";
import { ErrorNote } from "@/components/Center";
import { useAdmin } from "@/lib/admin";
import { formatMoney } from "@/lib/menu";
import { supabase } from "@/lib/supabase";

type Zone = {
  id: string;
  name: string;
  neighborhoods: string[];
  fee: number;
  sort_order: number;
  is_active: boolean;
};

type Result = PromiseLike<{ error: { message: string } | null }>;

const parseNeighborhoods = (text: string) =>
  text
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);

/**
 * Administra las zonas de entrega: nombre, barrios y costo de delivery.
 * Lo que aquí se marca "activo" es lo que ve el cliente al armar su pedido.
 */
export function ZoneManager() {
  const { restaurant } = useAdmin();
  const rid = restaurant.id;
  const [zones, setZones] = useState<Zone[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [newName, setNewName] = useState("");
  const [newFee, setNewFee] = useState("");
  const [newNeighborhoods, setNewNeighborhoods] = useState("");

  const load = async () => {
    const { data, error } = await supabase
      .from("delivery_zones")
      .select("*")
      .eq("restaurant_id", rid)
      .order("sort_order");
    if (error) {
      setError(error.message);
      return;
    }
    setZones((data ?? []).map((z) => ({ ...z, fee: Number(z.fee) }) as Zone));
  };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => void load(), [rid]);

  async function run(p: Result) {
    setError(null);
    const { error } = await p;
    if (error) setError(error.message);
    else await load();
  }

  const add = (e: React.FormEvent) => {
    e.preventDefault();
    const fee = Number(newFee);
    if (!newName.trim()) return setError("Ponle un nombre a la zona.");
    if (!Number.isFinite(fee) || fee < 0) return setError("El costo de entrega no es válido.");
    const order = (zones?.at(-1)?.sort_order ?? 0) + 1;
    void run(
      supabase.from("delivery_zones").insert({
        restaurant_id: rid,
        name: newName.trim(),
        fee,
        neighborhoods: parseNeighborhoods(newNeighborhoods),
        sort_order: order,
      }),
    ).then(() => {
      setNewName("");
      setNewFee("");
      setNewNeighborhoods("");
    });
  };

  // Reasigna sort_order a todas para que mover siempre funcione aunque haya empates
  const move = (i: number, dir: -1 | 1) => {
    if (!zones) return;
    const next = [...zones];
    const j = i + dir;
    if (j < 0 || j >= next.length) return;
    [next[i], next[j]] = [next[j], next[i]];
    void run(
      supabase.from("delivery_zones").upsert(
        next.map((z, idx) => ({
          id: z.id,
          restaurant_id: rid,
          name: z.name,
          neighborhoods: z.neighborhoods,
          fee: z.fee,
          sort_order: idx + 1,
        })),
      ),
    );
  };

  return (
    <div>
      <div>
        <div className="mx-auto max-w-2xl space-y-4">
          <h1 className="font-display text-4xl uppercase">Zonas de entrega</h1>
          <form
            onSubmit={add}
            className="space-y-2 rounded-xl border border-primary/15 bg-foreground/5 p-3"
          >
            <div className="flex gap-2">
              <input
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder="Nombre (Zona D)"
                className="min-w-0 flex-1 rounded-lg border border-input bg-background/60 px-3 py-2 text-sm outline-none focus:border-primary"
              />
              <input
                value={newFee}
                onChange={(e) => setNewFee(e.target.value)}
                inputMode="decimal"
                placeholder={restaurant.currency === "USD" ? "US$" : "RD$"}
                className="w-24 rounded-lg border border-input bg-background/60 px-3 py-2 text-sm outline-none focus:border-primary"
              />
            </div>
            <input
              value={newNeighborhoods}
              onChange={(e) => setNewNeighborhoods(e.target.value)}
              placeholder="Barrios separados por coma"
              className="w-full rounded-lg border border-input bg-background/60 px-3 py-2 text-sm outline-none focus:border-primary"
            />
            <button className="btn-primary w-full !py-2 !text-xs">
              <Plus className="h-4 w-4" /> Agregar zona
            </button>
          </form>

          {!zones ? (
            <div className="grid place-items-center py-8">
              <Loader2 className="h-5 w-5 animate-spin text-primary" />
            </div>
          ) : zones.length === 0 ? (
            <p className="py-6 text-center text-sm text-foreground/60">
              Aún no hay zonas de entrega.
            </p>
          ) : (
            <ul className="space-y-2">
              {zones.map((z, i) => (
                <li
                  key={z.id}
                  className={`rounded-xl border border-primary/15 bg-foreground/5 p-3 ${z.is_active ? "" : "opacity-50"}`}
                >
                  <div className="flex items-center gap-1">
                    <input
                      defaultValue={z.name}
                      onBlur={(e) => {
                        const v = e.target.value.trim();
                        if (v && v !== z.name)
                          void run(
                            supabase
                              .from("delivery_zones")
                              .update({ name: v })
                              .eq("id", z.id)
                              .eq("restaurant_id", rid),
                          );
                      }}
                      className="min-w-0 flex-1 bg-transparent px-1 py-1 text-sm font-bold outline-none focus:text-primary"
                    />
                    <input
                      defaultValue={z.fee}
                      inputMode="decimal"
                      onBlur={(e) => {
                        const v = Number(e.target.value);
                        if (Number.isFinite(v) && v >= 0 && v !== z.fee)
                          void run(
                            supabase
                              .from("delivery_zones")
                              .update({ fee: v })
                              .eq("id", z.id)
                              .eq("restaurant_id", rid),
                          );
                      }}
                      aria-label={`Costo de ${z.name}`}
                      className="w-16 shrink-0 rounded-lg border border-input bg-background/60 px-2 py-1 text-right text-sm outline-none focus:border-primary"
                    />
                    <IconBtn label="Subir" disabled={i === 0} onClick={() => move(i, -1)}>
                      <ArrowUp className="h-4 w-4" />
                    </IconBtn>
                    <IconBtn
                      label="Bajar"
                      disabled={i === zones.length - 1}
                      onClick={() => move(i, 1)}
                    >
                      <ArrowDown className="h-4 w-4" />
                    </IconBtn>
                    <IconBtn
                      label={z.is_active ? "Ocultar" : "Mostrar"}
                      onClick={() =>
                        void run(
                          supabase
                            .from("delivery_zones")
                            .update({ is_active: !z.is_active })
                            .eq("id", z.id)
                            .eq("restaurant_id", rid),
                        )
                      }
                    >
                      {z.is_active ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
                    </IconBtn>
                    <IconBtn
                      label="Borrar"
                      onClick={() =>
                        confirm(`¿Borrar "${z.name}"?`) &&
                        void run(
                          supabase
                            .from("delivery_zones")
                            .delete()
                            .eq("id", z.id)
                            .eq("restaurant_id", rid),
                        )
                      }
                    >
                      <Trash2 className="h-4 w-4" />
                    </IconBtn>
                  </div>
                  <input
                    defaultValue={z.neighborhoods.join(", ")}
                    onBlur={(e) => {
                      const next = parseNeighborhoods(e.target.value);
                      void run(
                        supabase
                          .from("delivery_zones")
                          .update({ neighborhoods: next })
                          .eq("id", z.id)
                          .eq("restaurant_id", rid),
                      );
                    }}
                    aria-label={`Barrios de ${z.name}`}
                    className="mt-2 w-full rounded-lg border border-input bg-background/60 px-2 py-1.5 text-xs outline-none focus:border-primary"
                  />
                </li>
              ))}
            </ul>
          )}

          <p className="text-xs text-foreground/50">
            Ocultar una zona la quita del selector de delivery en el menú. El costo se suma al
            pedido y se incluye en el mensaje de WhatsApp.
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
      className="grid h-8 w-8 shrink-0 place-items-center rounded-md text-foreground/70 hover:text-primary disabled:opacity-25 disabled:hover:text-foreground/70"
    >
      {children}
    </button>
  );
}
