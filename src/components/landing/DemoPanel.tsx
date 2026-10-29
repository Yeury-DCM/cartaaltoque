import { ExternalLink, Home, MapPinned, Palette, QrCode, UtensilsCrossed } from "lucide-react";
import { CATEGORIES, isFresh, money, RESTAURANT, SWATCHES, useDemo } from "./demo-store";

const TABS = [
  { label: "Inicio", Icon: Home },
  { label: "Menú", Icon: UtensilsCrossed, active: true },
  { label: "Mi página", Icon: Palette },
  { label: "QR", Icon: QrCode },
  { label: "Zonas", Icon: MapPinned },
];

const catName = (id: string) => CATEGORIES.find((c) => c.id === id)?.name ?? "";

function Switch({ on, onClick, label }: { on: boolean; onClick: () => void; label: string }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={on}
      aria-label={label}
      onClick={onClick}
      className={`relative h-6 w-11 shrink-0 rounded-full transition-colors ${on ? "bg-primary" : "bg-foreground/25"}`}
    >
      <span
        className={`absolute top-0.5 h-5 w-5 rounded-full bg-white transition-all ${on ? "left-[22px]" : "left-0.5"}`}
      />
    </button>
  );
}

function Stat({ label, value, flashAt }: { label: string; value: string; flashAt?: number }) {
  return (
    <div
      key={flashAt || "stat"}
      className={`rounded-2xl border border-primary/15 bg-foreground/5 p-4 ${flashAt ? "demo-flash" : ""}`}
    >
      <p className="text-[10px] uppercase tracking-[0.2em] text-foreground/55">{label}</p>
      <p className="mt-1 font-display text-[34px] leading-none text-primary">{value}</p>
    </div>
  );
}

function Swatches() {
  const { state, dispatch } = useDemo();
  return (
    <div className="flex flex-wrap gap-2.5">
      {SWATCHES.map((c) => (
        <button
          key={c}
          type="button"
          onClick={() => dispatch({ type: "color", color: c })}
          aria-label={`Color ${c}`}
          className={`h-9 w-9 rounded-full border-2 transition ${state.color === c ? "scale-110 border-white" : "border-transparent"}`}
          style={{ background: c }}
        />
      ))}
    </div>
  );
}

/** Panel del dueño en una ventana de escritorio (1100×690 lógicos): el mismo diseño que /app. */
export function DemoPanel() {
  const { state, dispatch } = useDemo();
  const ordersFlash = isFresh(state.flash, "orders") ? state.flash!.at : 0;

  return (
    <div className="flex h-full flex-col bg-background text-foreground">
      <header className="border-b border-primary/15">
        <div className="flex items-center justify-between px-8 py-4">
          <span className="font-display text-[28px] uppercase">{RESTAURANT}</span>
          <span className="flex h-9 items-center gap-2 rounded-lg border border-primary/50 px-3 text-[11px] font-bold uppercase tracking-[0.12em]">
            <ExternalLink className="h-3.5 w-3.5" /> Ver menú
          </span>
        </div>
        <nav className="flex gap-1 px-6 pb-3">
          {TABS.map(({ label, Icon, active }) => (
            <span
              key={label}
              className={`flex h-10 items-center gap-2 rounded-full px-4 text-[12.5px] font-bold uppercase tracking-[0.1em] ${
                active ? "bg-primary text-primary-foreground" : "text-foreground/60"
              }`}
            >
              <Icon className="h-4 w-4" /> {label}
            </span>
          ))}
        </nav>
      </header>

      <div className="grid grid-cols-4 gap-3 px-8 pt-6">
        <Stat label="Visitas hoy" value={String(state.visitsToday)} />
        <Stat label="Visitas 7 días" value={String(state.visitsToday + 212)} />
        <Stat
          label="Pedidos enviados hoy"
          value={String(state.ordersToday)}
          flashAt={ordersFlash}
        />
        <Stat
          label="Pedidos enviados 7 días"
          value={String(state.ordersToday + 31)}
          flashAt={ordersFlash}
        />
      </div>

      <div className="grid min-h-0 flex-1 grid-cols-[1.5fr_1fr] gap-5 px-8 py-5">
        <section className="min-h-0 rounded-2xl border border-primary/15 bg-foreground/[0.03] p-4">
          <div className="mb-3 flex items-center justify-between">
            <h4 className="font-display text-[24px] uppercase leading-none">Tu menú</h4>
            <span className="text-[11px] uppercase tracking-[0.15em] text-foreground/50">
              Disponible
            </span>
          </div>
          <ul className="space-y-1.5">
            {state.items.map((i) => (
              <li
                key={i.id}
                className="flex items-center gap-3 rounded-xl border border-primary/10 bg-foreground/5 px-3 py-2"
              >
                <div className="min-w-0 flex-1">
                  <p
                    className={`truncate text-[14px] font-bold ${i.available ? "" : "text-foreground/45 line-through"}`}
                  >
                    {i.name}
                  </p>
                  <p className="text-[11px] text-foreground/50">{catName(i.cat)}</p>
                </div>
                <span className="font-display text-[19px] text-primary">{money(i.price)}</span>
                <Switch
                  on={i.available}
                  label={i.available ? `Marcar ${i.name} agotado` : `Marcar ${i.name} disponible`}
                  onClick={() => dispatch({ type: "toggle", id: i.id })}
                />
              </li>
            ))}
          </ul>
        </section>

        <div className="space-y-4">
          <section className="rounded-2xl border border-primary/15 bg-foreground/[0.03] p-4">
            <h4 className="font-display text-[22px] uppercase leading-none">Color de tu marca</h4>
            <p className="mb-3 mt-1 text-[12px] text-foreground/55">Tu menú cambia al instante.</p>
            <Swatches />
          </section>
          <section className="rounded-2xl border border-primary/15 bg-foreground/[0.03] p-4">
            <h4 className="font-display text-[22px] uppercase leading-none">Tu menú en línea</h4>
            <p className="mt-2 text-[13px] font-bold">cartaaltoque.com/r/pizzeria-don-juan</p>
            <div className="mt-3 flex items-center gap-3 rounded-xl bg-foreground/5 p-3">
              <QrCode className="h-10 w-10 text-primary" />
              <p className="text-[12px] leading-snug text-foreground/60">
                Descarga tu QR y tu afiche listos para imprimir.
              </p>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}

/** Versión compacta del panel para celular: lo esencial para tocar. */
export function DemoPanelCompact() {
  const { state, dispatch } = useDemo();
  const ordersFlash = isFresh(state.flash, "orders") ? state.flash!.at : 0;
  return (
    <div className="w-full max-w-md rounded-[26px] border border-primary/20 bg-card/80 p-4 text-left shadow-[0_30px_80px_-20px_rgba(0,0,0,0.8)] backdrop-blur">
      <div className="flex items-center justify-between px-1 pb-3">
        <span className="font-display text-[22px] uppercase leading-none">Tu panel</span>
        <span className="text-[10px] uppercase tracking-[0.2em] text-foreground/50">
          {RESTAURANT}
        </span>
      </div>
      <div className="grid grid-cols-2 gap-2">
        <Stat label="Visitas hoy" value={String(state.visitsToday)} />
        <Stat label="Pedidos hoy" value={String(state.ordersToday)} flashAt={ordersFlash} />
      </div>
      <ul className="mt-3 space-y-1.5">
        {state.items.slice(0, 4).map((i) => (
          <li
            key={i.id}
            className="flex items-center gap-3 rounded-xl border border-primary/10 bg-foreground/5 px-3 py-2"
          >
            <span
              className={`min-w-0 flex-1 truncate text-sm font-bold ${i.available ? "" : "text-foreground/45 line-through"}`}
            >
              {i.name}
            </span>
            <Switch
              on={i.available}
              label={i.available ? `Marcar ${i.name} agotado` : `Marcar ${i.name} disponible`}
              onClick={() => dispatch({ type: "toggle", id: i.id })}
            />
          </li>
        ))}
      </ul>
      <p className="mb-2 mt-4 px-1 text-[11px] uppercase tracking-[0.2em] text-foreground/55">
        Color de tu marca
      </p>
      <Swatches />
    </div>
  );
}
