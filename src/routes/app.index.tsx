import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Check, Circle, Copy, ExternalLink, Lock } from "lucide-react";
import { useAdmin } from "@/lib/admin";
import { menuPath, menuUrl } from "@/lib/brand";
import { hasFeature } from "@/lib/features";
import { formatMoney } from "@/lib/menu";
import { supabase } from "@/lib/supabase";

export const Route = createFileRoute("/app/")({ component: HomePage });

type Stats = {
  today: number;
  week: number;
  weekTotal: number;
  items: number;
  withPhoto: number;
  links: number;
};

function startOfToday() {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d.toISOString();
}

function HomePage() {
  const { restaurant: r } = useAdmin();
  const [stats, setStats] = useState<Stats | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const weekAgo = new Date(Date.now() - 7 * 86_400_000).toISOString();
    const rid = r.id;
    void Promise.all([
      supabase
        .from("orders")
        .select("id", { count: "exact", head: true })
        .eq("restaurant_id", rid)
        .gte("created_at", startOfToday()),
      supabase
        .from("orders")
        .select("total")
        .eq("restaurant_id", rid)
        .neq("status", "cancelled")
        .gte("created_at", weekAgo),
      supabase.from("items").select("id, item_photos(id)").eq("restaurant_id", rid),
      supabase
        .from("restaurant_links")
        .select("id", { count: "exact", head: true })
        .eq("restaurant_id", rid),
    ]).then(([today, week, items, links]) => {
      const list = (items.data ?? []) as { item_photos: unknown[] }[];
      setStats({
        today: today.count ?? 0,
        week: week.data?.length ?? 0,
        weekTotal: (week.data ?? []).reduce((n, o) => n + Number(o.total), 0),
        items: list.length,
        withPhoto: list.filter((i) => i.item_photos.length > 0).length,
        links: links.count ?? 0,
      });
    });
  }, [r.id]);

  const url = menuUrl(r.slug);
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1500);
    } catch {
      /* sin portapapeles */
    }
  };

  const steps = [
    { done: !!r.logo_path, label: "Sube tu logo y elige tu color", to: "/app/pagina" as const },
    { done: !!r.whatsapp, label: "Configura tu WhatsApp", to: "/app/pagina" as const },
    { done: (stats?.items ?? 0) >= 3, label: "Carga al menos 3 platos", to: "/app/menu" as const },
    {
      done: (stats?.withPhoto ?? 0) >= 3,
      label: "Ponle foto a tus platos",
      to: "/app/menu" as const,
    },
    {
      done: (stats?.links ?? 0) > 0,
      label: "Agrega tus redes y apps de delivery",
      to: "/app/pagina" as const,
    },
    { done: false, label: "Descarga tu QR y ponlo en las mesas", to: "/app/qr" as const },
  ];

  return (
    <div className="space-y-6">
      <section className="glass-card p-5">
        <p className="text-[10px] uppercase tracking-[0.3em] text-primary">Tu menú en línea</p>
        <div className="mt-2 flex flex-wrap items-center gap-2">
          <a
            href={menuPath(r.slug)}
            target="_blank"
            rel="noopener noreferrer"
            className="min-w-0 truncate font-bold hover:text-primary"
          >
            {url}
          </a>
          <button onClick={() => void copy()} className="btn-ghost !px-3 !py-1.5 !text-[11px]">
            {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
            {copied ? "Copiado" : "Copiar"}
          </button>
          <a
            href={menuPath(r.slug)}
            target="_blank"
            rel="noopener noreferrer"
            className="btn-ghost !px-3 !py-1.5 !text-[11px]"
          >
            <ExternalLink className="h-3.5 w-3.5" /> Abrir
          </a>
        </div>
      </section>

      <section className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <Stat label="Pedidos hoy" value={stats ? String(stats.today) : "—"} />
        <Stat label="Pedidos 7 días" value={stats ? String(stats.week) : "—"} />
        <Stat
          label="Vendido 7 días"
          value={stats ? formatMoney(stats.weekTotal, r.currency) : "—"}
          hint="Según pedidos registrados"
        />
        <Stat label="Platos" value={stats ? String(stats.items) : "—"} />
      </section>

      <section className="glass-card p-5">
        <h2 className="font-display text-3xl uppercase">Deja tu menú listo</h2>
        <ul className="mt-4 space-y-2">
          {steps.map((s) => (
            <li key={s.label}>
              <Link
                to={s.to}
                className="flex items-center gap-3 rounded-xl border border-primary/15 bg-foreground/5 px-3 py-3 transition hover:border-primary/50"
              >
                {s.done ? (
                  <Check className="h-5 w-5 shrink-0 text-primary" />
                ) : (
                  <Circle className="h-5 w-5 shrink-0 text-foreground/35" />
                )}
                <span className={s.done ? "text-foreground/50 line-through" : ""}>{s.label}</span>
              </Link>
            </li>
          ))}
        </ul>
      </section>

      <section className="grid gap-3 md:grid-cols-2">
        <ProCard
          title="Comanda digital"
          text="Los pedidos llegan a una pantalla en la cocina y se marcan al prepararlos."
          enabled={hasFeature(r.plan, "kitchen_display")}
        />
        <ProCard
          title="Facturación"
          text="Comprobantes desde tus pedidos, sin escribirlos dos veces."
          enabled={hasFeature(r.plan, "invoicing")}
        />
      </section>
    </div>
  );
}

function Stat({ label, value, hint }: { label: string; value: string; hint?: string }) {
  return (
    <div className="rounded-2xl border border-primary/15 bg-foreground/5 p-4" title={hint}>
      <p className="text-[10px] uppercase tracking-[0.2em] text-foreground/55">{label}</p>
      <p className="mt-1 font-display text-3xl text-primary">{value}</p>
    </div>
  );
}

function ProCard({ title, text, enabled }: { title: string; text: string; enabled: boolean }) {
  return (
    <div className="rounded-2xl border border-dashed border-primary/25 p-4">
      <p className="flex items-center gap-2 font-display text-2xl uppercase">
        {!enabled && <Lock className="h-4 w-4 text-foreground/40" />}
        {title}
        <span className="rounded-md bg-primary/15 px-2 py-0.5 font-body text-[10px] font-bold tracking-[0.15em] text-primary">
          PRO · PRÓXIMAMENTE
        </span>
      </p>
      <p className="mt-1 text-sm text-foreground/60">{text}</p>
    </div>
  );
}
