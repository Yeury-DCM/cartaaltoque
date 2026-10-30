import { useState } from "react";

export type DayPoint = { day: string; label: string; views: number; orders: number };

const W = 640;
const H = 220;
const PAD = { top: 16, right: 12, bottom: 30, left: 34 };

/** Redondea el máximo hacia arriba a un número "bonito" para que las líneas guía sean limpias. */
function niceMax(n: number) {
  if (n <= 4) return 4;
  const step = 10 ** Math.floor(Math.log10(n));
  return Math.ceil(n / step) * step;
}

/** Visitas por día (barras) y pedidos enviados (puntos), de los últimos días. Sin librerías. */
export function ActivityChart({ data }: { data: DayPoint[] }) {
  const [hover, setHover] = useState<number | null>(null);
  const max = niceMax(Math.max(1, ...data.map((d) => Math.max(d.views, d.orders))));
  const innerW = W - PAD.left - PAD.right;
  const innerH = H - PAD.top - PAD.bottom;
  const slot = innerW / data.length;
  const barW = Math.min(34, slot * 0.55);
  const y = (v: number) => PAD.top + innerH - (v / max) * innerH;
  const cx = (i: number) => PAD.left + slot * i + slot / 2;
  const ticks = [0, 0.5, 1].map((f) => Math.round(max * f));
  const active = hover === null ? null : data[hover];

  return (
    <div>
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-4 text-[11px] text-foreground/60">
          <span className="flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-sm bg-primary/70" /> Visitas
          </span>
          <span className="flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-full border-2 border-foreground bg-background" />{" "}
            Pedidos enviados
          </span>
        </div>
        <p className="min-h-4 text-[12px] text-foreground/70" aria-live="polite">
          {active
            ? `${active.label}: ${active.views} visitas · ${active.orders} pedidos`
            : "Últimos 7 días"}
        </p>
      </div>
      <svg
        viewBox={`0 0 ${W} ${H}`}
        className="h-auto w-full"
        role="img"
        aria-label="Visitas y pedidos de los últimos 7 días"
        onMouseLeave={() => setHover(null)}
      >
        {ticks.map((t) => (
          <g key={t}>
            <line
              x1={PAD.left}
              x2={W - PAD.right}
              y1={y(t)}
              y2={y(t)}
              stroke="currentColor"
              strokeOpacity={t === 0 ? 0.25 : 0.1}
              strokeDasharray={t === 0 ? undefined : "3 5"}
            />
            <text
              x={PAD.left - 8}
              y={y(t) + 4}
              textAnchor="end"
              className="fill-foreground/45"
              fontSize="11"
            >
              {t}
            </text>
          </g>
        ))}
        {data.map((d, i) => (
          <g
            key={d.day}
            onMouseEnter={() => setHover(i)}
            onFocus={() => setHover(i)}
            onBlur={() => setHover(null)}
            tabIndex={0}
            aria-label={`${d.label}: ${d.views} visitas, ${d.orders} pedidos`}
          >
            <rect x={PAD.left + slot * i} y={PAD.top} width={slot} height={innerH} fill="transparent" />
            <rect
              x={cx(i) - barW / 2}
              y={y(d.views)}
              width={barW}
              height={Math.max(0, y(0) - y(d.views))}
              rx={4}
              className="fill-primary"
              fillOpacity={hover === i ? 1 : 0.7}
            />
            {d.orders > 0 && (
              <circle
                cx={cx(i)}
                cy={y(d.orders)}
                r={5}
                className="fill-background stroke-foreground"
                strokeWidth={2}
              />
            )}
            <text
              x={cx(i)}
              y={H - 10}
              textAnchor="middle"
              className={hover === i ? "fill-foreground" : "fill-foreground/50"}
              fontSize="11"
            >
              {d.label}
            </text>
          </g>
        ))}
      </svg>
    </div>
  );
}

export type TopItem = { id: string; name: string; opens: number };

/** Los platos que más se abren en el menú, con barra proporcional. */
export function TopItems({ items }: { items: TopItem[] }) {
  if (items.length === 0) {
    return (
      <p className="text-sm text-foreground/55">
        Aún no hay datos. Cuando tus clientes abran platos en el menú, aquí verás cuáles les llaman
        más la atención.
      </p>
    );
  }
  const max = Math.max(...items.map((i) => i.opens));
  return (
    <ol className="space-y-3">
      {items.map((it, i) => (
        <li key={it.id}>
          <div className="flex items-baseline justify-between gap-3 text-sm">
            <span className="min-w-0 truncate">
              <span className="mr-2 text-foreground/40">{i + 1}</span>
              {it.name}
            </span>
            <span className="shrink-0 font-bold text-primary">{it.opens}</span>
          </div>
          <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-foreground/10">
            <div
              className="h-full rounded-full bg-primary"
              style={{ width: `${Math.max(6, (it.opens / max) * 100)}%` }}
            />
          </div>
        </li>
      ))}
    </ol>
  );
}
