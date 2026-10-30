import React from "react";
import { ExternalLink, Home, Palette, QrCode, UtensilsCrossed } from "lucide-react";
import { StatusBar, flashShadow } from "./devices";
import { brandStyle, catName, money, RESTAURANT, type DemoItem } from "./data";

const TABS = [
  { label: "Inicio", Icon: Home },
  { label: "Menú", Icon: UtensilsCrossed, active: true },
  { label: "Mi página", Icon: Palette },
  { label: "QR", Icon: QrCode },
];

/** Interruptor de DemoPanel.tsx; `on` va de 0 a 1 para animar la perilla. */
const Switch: React.FC<{ on: number }> = ({ on }) => (
  <span
    className="relative h-6 w-11 shrink-0 rounded-full"
    style={{ background: `color-mix(in srgb, var(--primary) ${on * 100}%, color-mix(in srgb, var(--foreground) 25%, transparent))` }}
  >
    <span className="absolute top-0.5 h-5 w-5 rounded-full bg-white" style={{ left: 2 + 20 * on }} />
  </span>
);

export type PanelProps = {
  items: DemoItem[];
  /** Plato cuyo precio se está editando y el texto escrito (con cursor). */
  edit?: { id: string; text: string; caret: boolean; selected?: boolean };
  /** Estado del interruptor de cada plato (0 = agotado, 1 = disponible). */
  switches?: Record<string, number>;
  /** Frames desde el cambio de cada fila. */
  flash?: Record<string, number | undefined>;
  /** Duración del destello en frames. */
  flashLen?: number;
};

/**
 * Panel del dueño en el celular: la pestaña "Menú" de DemoPanel.tsx (cabecera, pestañas y
 * filas con precio + interruptor) en el ancho de un teléfono.
 */
export const PanelScreen: React.FC<PanelProps> = ({ items, edit, switches = {}, flash = {}, flashLen }) => (
  <div className="relative flex h-full w-full flex-col overflow-hidden bg-background text-foreground" style={brandStyle("#FF7101")}>
    <StatusBar />
    <header className="shrink-0 border-b border-primary/15">
      <div className="flex items-center justify-between px-5 pb-3 pt-2">
        <span className="truncate font-display text-[28px] uppercase leading-none">{RESTAURANT}</span>
        <span className="flex h-9 items-center gap-2 rounded-lg border border-primary/50 px-3 text-[11px] font-bold uppercase tracking-[0.12em]">
          <ExternalLink className="h-3.5 w-3.5" /> Ver menú
        </span>
      </div>
      <nav className="flex gap-1 overflow-hidden px-3 pb-3">
        {TABS.map(({ label, Icon, active }) => (
          <span
            key={label}
            className={`flex h-10 shrink-0 items-center gap-2 rounded-full px-4 text-[12.5px] font-bold uppercase tracking-[0.1em] ${
              active ? "bg-primary text-primary-foreground" : "text-foreground/60"
            }`}
          >
            <Icon className="h-4 w-4" /> {label}
          </span>
        ))}
      </nav>
    </header>

    <div className="flex min-h-0 flex-1 flex-col px-4 py-4">
      <section className="flex-1 rounded-2xl border border-primary/15 bg-foreground/[0.03] p-4">
        <h4 className="font-display text-[24px] uppercase leading-none">Tu menú</h4>
        <p className="mb-3 mt-1 text-[12px] text-foreground/55">Toca un precio para cambiarlo o apaga un plato.</p>
        <ul className="space-y-2">
          {items.map((i) => {
            const on = switches[i.id] ?? (i.available ? 1 : 0);
            const editing = edit?.id === i.id;
            return (
              <li
                key={i.id}
                className="flex h-[62px] items-center gap-3 rounded-xl border border-primary/10 bg-foreground/5 px-3"
                style={{ boxShadow: flashShadow(flash[i.id], flashLen) }}
              >
                <div className="min-w-0 flex-1">
                  <p className={`truncate text-[14px] font-bold ${on > 0.5 ? "" : "text-foreground/45 line-through"}`}>{i.name}</p>
                  <p className="text-[11px] text-foreground/50">{catName(i.cat)}</p>
                </div>
                {editing ? (
                  <span className="flex h-10 items-center rounded-lg border border-primary bg-foreground/5 px-2.5 font-display text-[19px] text-foreground">
                    <span className="mr-1 text-foreground/55">RD$</span>
                    <span className={edit.selected ? "rounded-[3px] bg-primary/35 px-[1px]" : ""}>{edit.text}</span>
                    <span className="ml-[1px] inline-block h-[20px] w-[2px] bg-primary" style={{ opacity: edit.caret ? 1 : 0 }} />
                  </span>
                ) : (
                  <span className="font-display text-[19px] text-primary">{money(i.price)}</span>
                )}
                <Switch on={on} />
              </li>
            );
          })}
        </ul>
      </section>
    </div>
  </div>
);
