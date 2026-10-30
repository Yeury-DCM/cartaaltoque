import { useEffect, useState } from "react";
import {
  Check,
  Circle,
  Download,
  ExternalLink,
  Home,
  MapPinned,
  Palette,
  QrCode,
  UtensilsCrossed,
} from "lucide-react";
import { menuPath, publicOrigin } from "@/lib/brand";
import { FONT_STYLES, THEMES } from "@/lib/brand-color";
import {
  CATEGORIES,
  displayName,
  isFresh,
  money,
  SWATCHES,
  useDemo,
  type PanelTab,
} from "./demo-store";

const TABS: { tab: PanelTab; label: string; Icon: typeof Home }[] = [
  { tab: "inicio", label: "Inicio", Icon: Home },
  { tab: "menu", label: "Menú", Icon: UtensilsCrossed },
  { tab: "pagina", label: "Mi página", Icon: Palette },
  { tab: "qr", label: "QR", Icon: QrCode },
  { tab: "zonas", label: "Zonas", Icon: MapPinned },
];

const catName = (id: string) => CATEGORIES.find((c) => c.id === id)?.name ?? "";

const card = "rounded-2xl border border-primary/15 bg-foreground/[0.03] p-4";
const input =
  "w-full rounded-lg border border-input bg-foreground/5 px-3 py-2.5 text-[14px] outline-none focus:border-primary";

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
          aria-pressed={state.color === c}
          className={`h-9 w-9 rounded-full border-2 transition ${state.color === c ? "scale-110 border-white" : "border-transparent"}`}
          style={{ background: c }}
        />
      ))}
    </div>
  );
}

function DishRow({ id }: { id: string }) {
  const { state, dispatch } = useDemo();
  const i = state.items.find((x) => x.id === id)!;
  return (
    <li className="flex items-center gap-3 rounded-xl border border-primary/10 bg-foreground/5 px-3 py-2">
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
  );
}

function InicioTab() {
  const { state, dispatch } = useDemo();
  const ordersFlash = isFresh(state.flash, "orders") ? state.flash!.at : 0;
  const steps: { label: string; done: boolean; tab: PanelTab }[] = [
    { label: "Sube tu logo y elige tu color", done: true, tab: "pagina" },
    { label: "Agrega tu WhatsApp para recibir pedidos", done: state.whatsapp, tab: "pagina" },
    { label: "Carga tus platos", done: true, tab: "menu" },
    {
      label: "Define tus zonas de delivery",
      done: state.zones.some((z) => z.active),
      tab: "zonas",
    },
    { label: "Descarga tu QR y ponlo en las mesas", done: false, tab: "qr" },
  ];
  return (
    <>
      <div className="grid grid-cols-4 gap-3">
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
      <div className="mt-4 grid min-h-0 flex-1 grid-cols-[1.3fr_1fr] gap-5">
        <section className={card}>
          <h4 className="font-display text-[24px] uppercase leading-none">Deja tu menú listo</h4>
          <ul className="mt-3 space-y-1.5">
            {steps.map((s) => (
              <li key={s.label}>
                <button
                  type="button"
                  onClick={() => dispatch({ type: "tab", tab: s.tab })}
                  className="flex w-full items-center gap-3 rounded-xl border border-primary/15 bg-foreground/5 px-3 py-2.5 text-left text-[13.5px] transition hover:border-primary/50"
                >
                  {s.done ? (
                    <Check className="h-4 w-4 shrink-0 text-primary" />
                  ) : (
                    <Circle className="h-4 w-4 shrink-0 text-foreground/35" />
                  )}
                  <span className={s.done ? "text-foreground/50 line-through" : ""}>{s.label}</span>
                </button>
              </li>
            ))}
          </ul>
        </section>
        <section className={card}>
          <h4 className="font-display text-[22px] uppercase leading-none">Tu menú en línea</h4>
          <p className="mt-2 break-all text-[13px] font-bold">
            cartaaltoque.com/r/la-terraza
          </p>
          <p className="mt-3 text-[12.5px] leading-snug text-foreground/60">
            Esta es la dirección que abre tu QR. Cada visita y cada pedido se cuenta aquí.
          </p>
        </section>
      </div>
    </>
  );
}

function MenuTab() {
  const { state } = useDemo();
  return (
    <section className={`${card} flex-1`}>
      <div className="mb-3 flex items-end justify-between">
        <h4 className="font-display text-[24px] uppercase leading-none">Tu menú</h4>
        <span className="text-[12px] text-foreground/55">
          Apaga un plato y mira cómo sale «Agotado» en el celular.
        </span>
      </div>
      <ul className="grid grid-cols-2 gap-2">
        {state.items.map((i) => (
          <DishRow key={i.id} id={i.id} />
        ))}
      </ul>
    </section>
  );
}

function PaginaTab() {
  const { state, dispatch } = useDemo();
  return (
    <div className="grid min-h-0 flex-1 grid-cols-[1.2fr_1fr] gap-5">
      <section className={card}>
        <h4 className="font-display text-[24px] uppercase leading-none">Tu página</h4>
        <p className="mb-3 mt-1 text-[12px] text-foreground/55">Escribe y mira el celular.</p>
        <label className="block text-[10px] uppercase tracking-[0.15em] text-foreground/60">
          Nombre del negocio
          <input
            className={`${input} mt-1.5`}
            value={state.name}
            maxLength={30}
            onChange={(e) => dispatch({ type: "name", value: e.target.value })}
          />
        </label>
        <label className="mt-3 block text-[10px] uppercase tracking-[0.15em] text-foreground/60">
          Frase corta
          <input
            className={`${input} mt-1.5`}
            value={state.tagline}
            maxLength={70}
            onChange={(e) => dispatch({ type: "tagline", value: e.target.value })}
          />
        </label>
        <p className="mb-2 mt-4 text-[10px] uppercase tracking-[0.15em] text-foreground/60">
          Color de tu marca
        </p>
        <Swatches />
        <p className="mb-2 mt-4 text-[10px] uppercase tracking-[0.15em] text-foreground/60">
          Tema y tipografía
        </p>
        <div className="flex flex-wrap gap-1.5">
          {THEMES.map((t) => (
            <button
              key={t.id}
              type="button"
              aria-pressed={state.theme === t.id}
              onClick={() => dispatch({ type: "theme", theme: t.id })}
              className={`rounded-lg border px-3 py-1.5 text-[12px] font-bold transition ${state.theme === t.id ? "border-primary bg-primary/15 text-foreground" : "border-white/10 text-foreground/60 hover:border-primary/50"}`}
            >
              {t.label}
            </button>
          ))}
          <span className="mx-1 w-px bg-white/10" />
          {FONT_STYLES.map((f) => (
            <button
              key={f.id}
              type="button"
              aria-pressed={state.font === f.id}
              onClick={() => dispatch({ type: "font", font: f.id })}
              className={`rounded-lg border px-3 py-1.5 text-[12px] font-bold transition ${state.font === f.id ? "border-primary bg-primary/15 text-foreground" : "border-white/10 text-foreground/60 hover:border-primary/50"}`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </section>
      <section className={card}>
        <h4 className="font-display text-[22px] uppercase leading-none">Pedidos por WhatsApp</h4>
        <div className="mt-3 flex items-center justify-between gap-4 rounded-xl border border-primary/10 bg-foreground/5 px-3 py-3">
          <span className="text-[13.5px] font-bold">Recibir pedidos</span>
          <Switch
            on={state.whatsapp}
            label={state.whatsapp ? "Apagar pedidos por WhatsApp" : "Encender pedidos por WhatsApp"}
            onClick={() => dispatch({ type: "whatsapp", value: !state.whatsapp })}
          />
        </div>
        <p className="mt-3 text-[12.5px] leading-snug text-foreground/60">
          {state.whatsapp
            ? "Tus clientes arman el pedido en el menú y te llega por WhatsApp."
            : "Sin WhatsApp, tu menú se muestra como una carta con precios, sin carrito."}
        </p>
      </section>
    </div>
  );
}

/** QR real del menú de ejemplo, con descarga. */
function QrTab() {
  const [src, setSrc] = useState<string | null>(null);
  useEffect(() => {
    let alive = true;
    void import("qrcode").then(({ default: QRCode }) =>
      QRCode.toDataURL(`${publicOrigin()}${menuPath("demo")}`, {
        errorCorrectionLevel: "M",
        margin: 1,
        width: 520,
        color: { dark: "#0D0D0D", light: "#FFFFFF" },
      }).then((url) => alive && setSrc(url)),
    );
    return () => {
      alive = false;
    };
  }, []);
  return (
    <section className={`${card} grid flex-1 grid-cols-[auto_1fr] items-center gap-8`}>
      <div className="h-[250px] w-[250px] rounded-2xl bg-white p-3">
        {src ? (
          <img src={src} alt="Código QR del menú de ejemplo" className="h-full w-full" />
        ) : (
          <div className="h-full w-full animate-pulse rounded-lg bg-neutral-200" />
        )}
      </div>
      <div>
        <h4 className="font-display text-[28px] uppercase leading-none">Tu código QR</h4>
        <p className="mt-2 max-w-md text-[13.5px] leading-relaxed text-foreground/65">
          Es un QR de verdad: apunta a un menú de ejemplo. En tu cuenta lo descargas con tu logo, en
          PNG o SVG, junto con un afiche listo para imprimir.
        </p>
        {src && (
          <a
            href={src}
            download="qr-menu-de-ejemplo.png"
            className="btn-primary mt-5 !px-5 !py-3 !text-[12px]"
          >
            <Download className="h-4 w-4" /> Descargar QR en PNG
          </a>
        )}
      </div>
    </section>
  );
}

function ZonasTab() {
  const { state, dispatch } = useDemo();
  return (
    <section className={`${card} flex-1`}>
      <h4 className="font-display text-[24px] uppercase leading-none">Zonas de delivery</h4>
      <p className="mb-3 mt-1 text-[12px] text-foreground/55">
        Cambia un costo o apaga una zona y mira el carrito del celular (elige Delivery).
      </p>
      <ul className="space-y-2">
        {state.zones.map((z) => (
          <li
            key={z.id}
            className={`flex items-center gap-4 rounded-xl border border-primary/10 bg-foreground/5 px-4 py-3 ${z.active ? "" : "opacity-55"}`}
          >
            <div className="min-w-0 flex-1">
              <p className="text-[15px] font-bold">{z.name}</p>
              <p className="truncate text-[12px] text-foreground/55">{z.hoods}</p>
            </div>
            <label className="flex items-center gap-2 text-[11px] uppercase tracking-[0.15em] text-foreground/55">
              RD$
              <input
                className={`${input} !w-24 text-right`}
                inputMode="numeric"
                aria-label={`Costo de ${z.name}`}
                value={z.fee}
                onChange={(e) =>
                  dispatch({
                    type: "zoneFee",
                    id: z.id,
                    fee: Math.min(9999, Number(e.target.value.replace(/\D/g, "")) || 0),
                  })
                }
              />
            </label>
            <Switch
              on={z.active}
              label={z.active ? `Apagar ${z.name}` : `Encender ${z.name}`}
              onClick={() => dispatch({ type: "zoneActive", id: z.id })}
            />
          </li>
        ))}
      </ul>
    </section>
  );
}

/** Panel del dueño en una ventana de escritorio (1100×690 lógicos): el mismo diseño que /app. */
export function DemoPanel() {
  const { state, dispatch } = useDemo();

  return (
    <div className="flex h-full flex-col bg-background text-foreground">
      <header className="shrink-0 border-b border-primary/15">
        <div className="flex items-center justify-between px-8 py-4">
          <span className="truncate font-display text-[28px] uppercase">{displayName(state)}</span>
          <button
            type="button"
            onClick={() => {
              dispatch({ type: "screen", screen: "menu" });
              dispatch({ type: "toast", text: "Así lo ve tu cliente al abrir tu enlace." });
            }}
            className="flex h-9 items-center gap-2 rounded-lg border border-primary/50 px-3 text-[11px] font-bold uppercase tracking-[0.12em] transition hover:bg-primary/10"
          >
            <ExternalLink className="h-3.5 w-3.5" /> Ver menú
          </button>
        </div>
        <nav aria-label="Secciones del panel" className="flex gap-1 px-6 pb-3">
          {TABS.map(({ tab, label, Icon }) => {
            const active = state.tab === tab;
            return (
              <button
                key={tab}
                type="button"
                aria-current={active ? "page" : undefined}
                onClick={() => dispatch({ type: "tab", tab })}
                className={`flex h-10 items-center gap-2 rounded-full px-4 text-[12.5px] font-bold uppercase tracking-[0.1em] transition-colors ${
                  active
                    ? "bg-primary text-primary-foreground"
                    : "text-foreground/60 hover:text-foreground"
                }`}
              >
                <Icon className="h-4 w-4" /> {label}
              </button>
            );
          })}
        </nav>
      </header>

      <div className="flex min-h-0 flex-1 flex-col px-8 py-5">
        {state.tab === "inicio" && <InicioTab />}
        {state.tab === "menu" && <MenuTab />}
        {state.tab === "pagina" && <PaginaTab />}
        {state.tab === "qr" && <QrTab />}
        {state.tab === "zonas" && <ZonasTab />}
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
        <span className="truncate pl-3 text-[10px] uppercase tracking-[0.2em] text-foreground/50">
          {displayName(state)}
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
      <div className="mt-3 flex items-center justify-between gap-4 rounded-xl border border-primary/10 bg-foreground/5 px-3 py-2">
        <span className="text-sm font-bold">Pedidos por WhatsApp</span>
        <Switch
          on={state.whatsapp}
          label={state.whatsapp ? "Apagar pedidos por WhatsApp" : "Encender pedidos por WhatsApp"}
          onClick={() => dispatch({ type: "whatsapp", value: !state.whatsapp })}
        />
      </div>
      <p className="mb-2 mt-4 px-1 text-[11px] uppercase tracking-[0.2em] text-foreground/55">
        Color de tu marca
      </p>
      <Swatches />
    </div>
  );
}
