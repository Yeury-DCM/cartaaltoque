import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Check, Circle, Copy, ExternalLink } from "lucide-react";
import {
  ActivityChart,
  TopItems,
  type DayPoint,
  type TopItem,
} from "@/components/admin/ActivityChart";
import { useAdmin } from "@/lib/admin";
import { menuPath, menuUrl } from "@/lib/brand";
import { supabase } from "@/lib/supabase";

export const Route = createFileRoute("/app/")({ component: HomePage });

type Stats = {
  viewsToday: number;
  viewsWeek: number;
  today: number;
  week: number;
  items: number;
  withPhoto: number;
  links: number;
  series: DayPoint[];
  top: TopItem[];
};

function startOfToday() {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d.toISOString();
}

/** Fecha (AAAA-MM-DD) en Santo Domingo, igual que las visitas guardadas en la base de datos. */
function drDate(offsetDays = 0) {
  const d = new Date(Date.now() - offsetDays * 86_400_000);
  return new Intl.DateTimeFormat("en-CA", { timeZone: "America/Santo_Domingo" }).format(d);
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
        .select("id", { count: "exact", head: true })
        .eq("restaurant_id", rid)
        .gte("created_at", weekAgo),
      supabase.from("items").select("id, item_photos(id)").eq("restaurant_id", rid),
      supabase
        .from("restaurant_links")
        .select("id", { count: "exact", head: true })
        .eq("restaurant_id", rid),
      supabase
        .from("menu_views_daily")
        .select("day, views")
        .eq("restaurant_id", rid)
        .gte("day", drDate(6)),
      supabase
        .from("orders")
        .select("created_at")
        .eq("restaurant_id", rid)
        .gte("created_at", weekAgo)
        .limit(5000),
      supabase
        .from("item_opens_daily")
        .select("item_id, opens")
        .eq("restaurant_id", rid)
        .gte("day", drDate(29)),
      supabase.from("items").select("id, name").eq("restaurant_id", rid),
    ]).then(([today, week, items, links, views, orderRows, opensRows, names]) => {
      const list = (items.data ?? []) as { item_photos: unknown[] }[];
      const days = (views.data ?? []) as { day: string; views: number }[];
      const ordersByDay = new Map<string, number>();
      for (const o of (orderRows.data ?? []) as { created_at: string }[]) {
        const d = new Intl.DateTimeFormat("en-CA", { timeZone: "America/Santo_Domingo" }).format(
          new Date(o.created_at),
        );
        ordersByDay.set(d, (ordersByDay.get(d) ?? 0) + 1);
      }
      const series: DayPoint[] = [6, 5, 4, 3, 2, 1, 0].map((back) => {
        const day = drDate(back);
        const [yy, mm, dd] = day.split("-").map(Number);
        const weekday = new Intl.DateTimeFormat("es-DO", { weekday: "short", timeZone: "UTC" })
          .format(new Date(Date.UTC(yy, mm - 1, dd)))
          .replace(".", "");
        return {
          day,
          label: `${weekday} ${dd}`,
          views: days.find((v) => v.day === day)?.views ?? 0,
          orders: ordersByDay.get(day) ?? 0,
        };
      });
      const opens = new Map<string, number>();
      for (const o of (opensRows.data ?? []) as { item_id: string; opens: number }[]) {
        opens.set(o.item_id, (opens.get(o.item_id) ?? 0) + o.opens);
      }
      const nameOf = new Map(
        ((names.data ?? []) as { id: string; name: string }[]).map((n) => [n.id, n.name]),
      );
      const top = [...opens.entries()]
        .filter(([id]) => nameOf.has(id))
        .map(([id, n]) => ({ id, name: nameOf.get(id)!, opens: n }))
        .sort((a, b) => b.opens - a.opens)
        .slice(0, 5);
      setStats({
        series,
        top,
        viewsToday: days.find((d) => d.day === drDate())?.views ?? 0,
        viewsWeek: days.reduce((n, d) => n + d.views, 0),
        today: today.count ?? 0,
        week: week.count ?? 0,
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
    {
      done: !!r.whatsapp,
      label: "Agrega tu WhatsApp para recibir pedidos (opcional)",
      to: "/app/pagina" as const,
    },
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
        <Stat
          label="Visitas hoy"
          value={stats ? String(stats.viewsToday) : "—"}
          hint="Personas que abrieron tu menú hoy (una vez por visita)"
        />
        <Stat label="Visitas 7 días" value={stats ? String(stats.viewsWeek) : "—"} />
        <Stat
          label="Pedidos enviados hoy"
          value={stats ? String(stats.today) : "—"}
          hint="Pedidos que tus clientes te mandaron por WhatsApp desde el menú"
        />
        <Stat label="Pedidos enviados 7 días" value={stats ? String(stats.week) : "—"} />
      </section>

      <section className="grid gap-6 lg:grid-cols-[1.6fr_1fr]">
        <div className="glass-card p-5">
          <h2 className="font-display text-3xl uppercase">Actividad</h2>
          {stats ? (
            <div className="mt-3">
              <ActivityChart data={stats.series} />
            </div>
          ) : (
            <div className="mt-3 h-[220px] animate-pulse rounded-xl bg-foreground/5" />
          )}
        </div>
        <div className="glass-card p-5">
          <h2 className="font-display text-3xl uppercase">Platos más abiertos</h2>
          <p className="mb-4 text-[12px] text-foreground/50">Últimos 30 días</p>
          {stats ? (
            <TopItems items={stats.top} />
          ) : (
            <div className="h-32 animate-pulse rounded-xl bg-foreground/5" />
          )}
        </div>
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
