import { createFileRoute, Link, Navigate } from "@tanstack/react-router";
import { useCallback, useEffect, useMemo, useState } from "react";
import { ArrowLeft, ExternalLink, Loader2, LogOut, RefreshCw, Search } from "lucide-react";
import { Center, ErrorNote, FullSpinner } from "@/components/Center";
import { APP_NAME, menuPath } from "@/lib/brand";
import { PLAN_LABEL } from "@/lib/features";
import { privatePageHeaders } from "@/lib/security-headers";
import { useSession } from "@/lib/session";
import { errorMessage, supabase } from "@/lib/supabase";
import type { Plan, RestaurantStatus } from "@/lib/tenant";

export const Route = createFileRoute("/super")({
  ssr: false,
  headers: privatePageHeaders,
  head: () => ({
    meta: [{ title: `Super admin — ${APP_NAME}` }, { name: "robots", content: "noindex" }],
  }),
  component: SuperPage,
});

type Row = {
  id: string;
  slug: string;
  name: string;
  status: RestaurantStatus;
  plan: Plan;
  trial_ends_at: string | null;
  is_published: boolean;
  is_live: boolean;
  created_at: string;
  owner_email: string | null;
  items_count: number;
  orders_7d: number;
  orders_total: number;
  views_7d: number;
};

type Stats = Record<
  | "restaurants"
  | "live"
  | "trial"
  | "active"
  | "suspended"
  | "new_7d"
  | "orders_7d"
  | "orders_total"
  | "views_7d",
  number
>;

type AuditRow = {
  at: string;
  actor_email: string | null;
  action: string;
  restaurant_name: string | null;
  details: Record<string, unknown>;
};

const STATUS_LABEL: Record<RestaurantStatus, string> = {
  trial: "Prueba",
  active: "Activo",
  suspended: "Suspendido",
};

/**
 * Panel de la plataforma. La página solo pinta: cada dato y cada acción pasa por
 * funciones admin_* que verifican el rol en la base de datos y quedan auditadas.
 */
function SuperPage() {
  const session = useSession();
  const [allowed, setAllowed] = useState<boolean | null>(null);

  useEffect(() => {
    if (!session) return;
    void supabase.rpc("is_platform_admin").then(({ data }) => setAllowed(data === true));
  }, [session]);

  if (session === undefined) return <FullSpinner />;
  if (!session)
    return <Navigate to="/entrar" search={{ modo: "entrar", next: "/super" }} replace />;
  if (allowed === null) return <FullSpinner />;
  if (!allowed)
    return (
      <Center>
        <div className="text-center">
          <p className="font-display text-4xl uppercase">Sin acceso</p>
          <Link to="/app" className="btn-ghost mt-6">
            Ir a mi panel
          </Link>
        </div>
      </Center>
    );
  return <Dashboard />;
}

function Dashboard() {
  const [rows, setRows] = useState<Row[] | null>(null);
  const [stats, setStats] = useState<Stats | null>(null);
  const [audit, setAudit] = useState<AuditRow[] | null>(null);
  const [tab, setTab] = useState<"restaurants" | "audit">("restaurants");
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<RestaurantStatus | "all">("all");
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setError(null);
    const [list, s, a] = await Promise.all([
      supabase.rpc("admin_list_restaurants"),
      supabase.rpc("admin_stats"),
      supabase.rpc("admin_audit_log", { p_limit: 100 }),
    ]);
    const failed = list.error ?? s.error ?? a.error;
    if (failed) return setError(failed.message);
    setRows(list.data as Row[]);
    setStats(s.data as Stats);
    setAudit(a.data as AuditRow[]);
  }, []);
  useEffect(() => void load(), [load]);

  const update = async (
    row: Row,
    patch: { p_status?: RestaurantStatus; p_plan?: Plan; p_trial_ends_at?: string },
    confirmText?: string,
  ) => {
    if (confirmText && !confirm(confirmText)) return;
    setBusy(row.id);
    try {
      const { error } = await supabase.rpc("admin_update_restaurant", { p_id: row.id, ...patch });
      if (error) throw error;
      await load();
    } catch (e) {
      setError(errorMessage(e));
    } finally {
      setBusy(null);
    }
  };

  const extendTrial = (row: Row) => {
    const base = Math.max(
      Date.now(),
      row.trial_ends_at ? new Date(row.trial_ends_at).getTime() : 0,
    );
    void update(row, {
      p_status: "trial",
      p_trial_ends_at: new Date(base + 14 * 86_400_000).toISOString(),
    });
  };

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    return (rows ?? []).filter(
      (r) =>
        (statusFilter === "all" || r.status === statusFilter) &&
        (!q || `${r.name} ${r.slug} ${r.owner_email ?? ""}`.toLowerCase().includes(q)),
    );
  }, [rows, query, statusFilter]);

  const sel =
    "rounded-lg border border-input bg-background px-2 py-1.5 text-xs font-bold uppercase outline-none focus:border-primary";

  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="sticky top-0 z-30 border-b border-primary/15 bg-background/90 backdrop-blur-md">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-3 md:px-8">
          <div className="flex items-center gap-3">
            <Link
              to="/app"
              aria-label="Volver al panel"
              className="text-foreground/60 hover:text-primary"
            >
              <ArrowLeft className="h-5 w-5" />
            </Link>
            <span className="font-display text-2xl uppercase">{APP_NAME} · Super admin</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => void load()}
              className="btn-ghost !px-3 !py-2 !text-xs"
              aria-label="Actualizar"
            >
              <RefreshCw className="h-4 w-4" />
            </button>
            <button
              className="btn-ghost !px-3 !py-2 !text-xs"
              onClick={() => supabase.auth.signOut()}
              aria-label="Cerrar sesión"
            >
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl space-y-6 px-5 py-6 md:px-8">
        {error && <ErrorNote>{error}</ErrorNote>}

        <section className="grid grid-cols-2 gap-3 md:grid-cols-3">
          <Stat label="Restaurantes" value={stats?.restaurants} />
          <Stat label="En línea" value={stats?.live} />
          <Stat label="Nuevos 7 días" value={stats?.new_7d} />
          <Stat label="Pedidos 7 días" value={stats?.orders_7d} />
          <Stat label="En prueba" value={stats?.trial} />
          <Stat label="Activos (pagan)" value={stats?.active} />
          <Stat label="Suspendidos" value={stats?.suspended} />
          <Stat label="Pedidos totales" value={stats?.orders_total} />
          <Stat label="Visitas 7 días" value={stats?.views_7d} />
        </section>

        <div className="flex gap-2">
          {(["restaurants", "audit"] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`h-10 rounded-full px-4 text-[13px] font-bold uppercase tracking-[0.1em] ${tab === t ? "bg-primary text-primary-foreground" : "text-foreground/65 hover:text-foreground"}`}
            >
              {t === "restaurants" ? "Restaurantes" : "Auditoría"}
            </button>
          ))}
        </div>

        {tab === "restaurants" ? (
          <section className="space-y-3">
            <div className="flex flex-wrap gap-2">
              <label className="relative min-w-60 flex-1">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-foreground/50" />
                <input
                  type="search"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Buscar por nombre, slug o correo…"
                  className="w-full rounded-lg border border-input bg-foreground/5 py-2.5 pl-9 pr-3 text-sm outline-none focus:border-primary"
                />
              </label>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as typeof statusFilter)}
                className="rounded-lg border border-input bg-foreground/5 px-3 text-sm outline-none focus:border-primary"
                aria-label="Estado"
              >
                <option value="all" className="bg-background">
                  Todos
                </option>
                {(Object.keys(STATUS_LABEL) as RestaurantStatus[]).map((s) => (
                  <option key={s} value={s} className="bg-background">
                    {STATUS_LABEL[s]}
                  </option>
                ))}
              </select>
            </div>

            {!rows ? (
              <div className="grid place-items-center py-16">
                <Loader2 className="h-6 w-6 animate-spin text-primary" />
              </div>
            ) : visible.length === 0 ? (
              <p className="py-16 text-center text-foreground/60">Sin resultados.</p>
            ) : (
              <ul className="space-y-2">
                {visible.map((r) => (
                  <li
                    key={r.id}
                    className="rounded-xl border border-primary/15 bg-foreground/5 p-3"
                  >
                    <div className="flex flex-wrap items-center gap-3">
                      <span
                        className={`h-2.5 w-2.5 shrink-0 rounded-full ${r.is_live && r.is_published ? "bg-[var(--whatsapp)]" : "bg-foreground/30"}`}
                        title={
                          r.is_live
                            ? r.is_published
                              ? "En línea"
                              : "Oculto por el dueño"
                            : "Fuera de línea"
                        }
                      />
                      <div className="min-w-0 flex-1">
                        <p className="truncate font-bold">{r.name}</p>
                        <p className="truncate text-xs text-foreground/55">
                          /r/{r.slug} · {r.owner_email ?? "sin dueño"} · desde{" "}
                          {new Date(r.created_at).toLocaleDateString("es-DO")}
                        </p>
                      </div>
                      <span className="text-xs text-foreground/60">
                        {r.items_count} platos · {r.views_7d} visitas 7d · {r.orders_7d} ped. 7d ·{" "}
                        {r.orders_total} total
                      </span>
                      {busy === r.id && <Loader2 className="h-4 w-4 animate-spin text-primary" />}
                    </div>
                    <div className="mt-3 flex flex-wrap items-center gap-2">
                      <select
                        className={sel}
                        value={r.status}
                        disabled={busy === r.id}
                        aria-label="Estado"
                        onChange={(e) => {
                          const s = e.target.value as RestaurantStatus;
                          void update(
                            r,
                            { p_status: s },
                            s === "suspended"
                              ? `¿Suspender "${r.name}"? Su menú dejará de verse.`
                              : undefined,
                          );
                        }}
                      >
                        {(Object.keys(STATUS_LABEL) as RestaurantStatus[]).map((s) => (
                          <option key={s} value={s}>
                            {STATUS_LABEL[s]}
                          </option>
                        ))}
                      </select>
                      <select
                        className={sel}
                        value={r.plan}
                        disabled={busy === r.id}
                        aria-label="Plan"
                        onChange={(e) => void update(r, { p_plan: e.target.value as Plan })}
                      >
                        {(Object.keys(PLAN_LABEL) as Plan[]).map((p) => (
                          <option key={p} value={p}>
                            {PLAN_LABEL[p]}
                          </option>
                        ))}
                      </select>
                      {r.status === "trial" && (
                        <span className="text-xs text-foreground/60">
                          Prueba hasta{" "}
                          {r.trial_ends_at
                            ? new Date(r.trial_ends_at).toLocaleDateString("es-DO")
                            : "—"}
                        </span>
                      )}
                      <button
                        className="btn-ghost !px-3 !py-1.5 !text-[11px]"
                        disabled={busy === r.id}
                        onClick={() => extendTrial(r)}
                      >
                        +14 días de prueba
                      </button>
                      <a
                        href={menuPath(r.slug)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="btn-ghost !px-3 !py-1.5 !text-[11px]"
                      >
                        <ExternalLink className="h-3.5 w-3.5" /> Ver menú
                      </a>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </section>
        ) : (
          <section>
            {!audit ? (
              <div className="grid place-items-center py-16">
                <Loader2 className="h-6 w-6 animate-spin text-primary" />
              </div>
            ) : audit.length === 0 ? (
              <p className="py-16 text-center text-foreground/60">Sin registros.</p>
            ) : (
              <ul className="space-y-1.5 text-sm">
                {audit.map((a, i) => (
                  <li
                    key={i}
                    className="rounded-lg border border-primary/10 bg-foreground/5 px-3 py-2"
                  >
                    <span className="text-foreground/55">
                      {new Date(a.at).toLocaleString("es-DO", {
                        dateStyle: "short",
                        timeStyle: "short",
                      })}
                    </span>{" "}
                    · <b>{a.action}</b> · {a.restaurant_name ?? "—"} · {a.actor_email ?? "sistema"}
                    <code className="mt-1 block truncate text-[11px] text-foreground/50">
                      {JSON.stringify(a.details)}
                    </code>
                  </li>
                ))}
              </ul>
            )}
          </section>
        )}
      </main>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: number | undefined }) {
  return (
    <div className="rounded-2xl border border-primary/15 bg-foreground/5 p-4">
      <p className="text-[10px] uppercase tracking-[0.2em] text-foreground/55">{label}</p>
      <p className="mt-1 font-display text-3xl text-primary">{value ?? "—"}</p>
    </div>
  );
}
