import { useState } from "react";
import {
  Bike,
  CheckCheck,
  ChevronLeft,
  Clock,
  CupSoda,
  Instagram,
  Minus,
  Pizza,
  Plus,
  Sandwich,
  ShoppingBag,
  Store,
} from "lucide-react";
import { WhatsAppIcon } from "@/components/icons/WhatsAppIcon";
import {
  activeZone,
  CATEGORIES,
  cartLines,
  displayName,
  initials,
  isFresh,
  money,
  orderMessage,
  useDemo,
  type CategoryId,
  type DemoItem,
} from "./demo-store";
import { StatusBar } from "./devices";

const ICON: Record<CategoryId, typeof Pizza> = {
  pizzas: Pizza,
  burgers: Sandwich,
  bebidas: CupSoda,
};

/** Pantalla del cliente (390×844 lógicos): el mismo diseño que el menú real. */
export function DemoPhone() {
  const { state } = useDemo();
  return (
    <div
      data-theme={state.theme}
      data-font={state.font}
      className="relative h-full w-full overflow-hidden bg-background text-foreground"
    >
      {state.screen === "menu" && <MenuScreen />}
      {state.screen === "cart" && <CartScreen />}
      {state.screen === "chat" && <ChatScreen />}
      {state.toast && (
        <div
          key={state.toast.at}
          role="status"
          className="sheet-in absolute inset-x-5 bottom-24 z-30 rounded-xl bg-white px-4 py-3 text-center text-[13px] font-medium leading-snug text-[#111] shadow-[0_20px_50px_-10px_rgba(0,0,0,0.7)]"
        >
          {state.toast.text}
        </div>
      )}
    </div>
  );
}

function MenuScreen() {
  const { state, dispatch } = useDemo();
  const [cat, setCat] = useState<CategoryId | "all">("all");
  const lines = cartLines(state);
  const count = lines.reduce((n, l) => n + l.qty, 0);
  const total = lines.reduce((n, l) => n + l.qty * l.item.price, 0);
  const cats = CATEGORIES.filter((c) => cat === "all" || c.id === cat);

  return (
    <div className="flex h-full flex-col">
      <StatusBar />
      <div className="relative shrink-0 px-5 pb-4 pt-3 text-center">
        <div
          aria-hidden
          className="absolute inset-x-0 -top-14 h-48 opacity-70"
          style={{
            background:
              "radial-gradient(ellipse 70% 60% at 50% 0%, color-mix(in srgb, var(--primary) 35%, transparent), transparent 70%)",
          }}
        />
        <p className="relative text-[10px] uppercase tracking-[0.4em] text-primary">Carta</p>
        <h3 className="relative break-words font-display text-[46px] uppercase leading-none">
          {displayName(state)}
        </h3>
        {state.tagline.trim() && (
          <p className="relative mt-1.5 text-[12.5px] text-foreground/65">{state.tagline}</p>
        )}
        <p className="relative mt-2 inline-flex items-center gap-1.5 text-[10.5px] uppercase tracking-[0.15em] text-foreground/55">
          <Clock className="h-3 w-3 text-primary" /> Lun–Dom · 12 pm – 11 pm
        </p>
        <div className="relative mt-3 flex justify-center gap-2">
          {state.whatsapp && (
            <button
              type="button"
              onClick={() =>
                dispatch({ type: "chat", message: `Hola ${displayName(state)}, ¿están abiertos?` })
              }
              className="flex h-9 items-center gap-1.5 rounded-xl bg-primary px-3.5 text-[13px] font-bold text-primary-foreground transition active:scale-95"
            >
              <WhatsAppIcon className="h-4 w-4" /> WhatsApp
            </button>
          )}
          <button
            type="button"
            aria-label="Instagram"
            onClick={() =>
              dispatch({ type: "toast", text: "En tu menú real, aquí se abre tu Instagram." })
            }
            className="grid h-9 w-9 place-items-center rounded-xl border border-primary/30 bg-foreground/5 transition active:scale-95"
          >
            <Instagram className="h-4 w-4" />
          </button>
        </div>
      </div>

      <div className="flex shrink-0 gap-2 overflow-x-auto border-y border-primary/15 bg-background/90 px-4 py-2.5 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {[{ id: "all" as const, name: "Todo" }, ...CATEGORIES].map((c) => (
          <button
            key={c.id}
            type="button"
            onClick={() => setCat(c.id)}
            className={`h-9 shrink-0 rounded-full border px-4 text-[11.5px] font-bold uppercase tracking-[0.12em] transition-colors ${
              cat === c.id
                ? "border-primary bg-primary text-primary-foreground"
                : "border-primary/30 bg-foreground/5 text-foreground/85"
            }`}
          >
            {c.name}
          </button>
        ))}
      </div>

      <div
        className={`min-h-0 flex-1 overflow-y-auto px-4 pt-4 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden ${count ? "pb-28" : "pb-8"}`}
      >
        {cats.map((c) => (
          <section key={c.id} className="mb-6">
            <h4 className="mb-3 flex items-center gap-3 font-display text-[26px] uppercase leading-none">
              {c.name}
              <span className="h-px flex-1 bg-gradient-to-r from-primary/50 to-transparent" />
            </h4>
            <ul className="space-y-2.5">
              {state.items
                .filter((i) => i.cat === c.id)
                .map((i) => (
                  <ItemCard
                    key={i.id}
                    item={i}
                    flashAt={isFresh(state.flash, `item:${i.id}`) ? state.flash!.at : 0}
                    canOrder={state.whatsapp}
                    onAdd={() => dispatch({ type: "add", id: i.id })}
                  />
                ))}
            </ul>
          </section>
        ))}
      </div>

      {state.whatsapp && count > 0 && (
        <div className="absolute inset-x-0 bottom-0 px-4 pb-5">
          <button
            key={isFresh(state.flash, "cart") ? state.flash!.at : "bar"}
            type="button"
            onClick={() => dispatch({ type: "screen", screen: "cart" })}
            className="bar-pop flex w-full items-center gap-3 rounded-2xl bg-primary px-4 py-3 text-left text-primary-foreground shadow-[0_18px_40px_-12px_rgba(0,0,0,0.8)]"
          >
            <span className="relative grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-black/15">
              <ShoppingBag className="h-5 w-5" />
              <span className="absolute -right-1.5 -top-1.5 grid h-5 min-w-5 place-items-center rounded-full bg-background px-1 text-[11px] font-bold text-primary">
                {count}
              </span>
            </span>
            <span className="flex-1 text-[13px] font-bold uppercase tracking-[0.12em]">
              Ver mi pedido
            </span>
            <span className="font-display text-[24px] leading-none">{money(total)}</span>
          </button>
        </div>
      )}
    </div>
  );
}

function ItemCard({
  item,
  flashAt,
  canOrder,
  onAdd,
}: {
  item: DemoItem;
  flashAt: number;
  canOrder: boolean;
  onAdd: () => void;
}) {
  const Icon = ICON[item.cat];
  return (
    <li
      key={flashAt || "card"}
      className={`glass-card relative flex gap-3 p-2.5 ${item.available ? "" : "opacity-55"} ${flashAt ? "demo-flash" : ""}`}
    >
      <div
        className="grid h-[76px] w-[76px] shrink-0 place-items-center rounded-xl"
        style={{
          background:
            "linear-gradient(135deg, color-mix(in srgb, var(--primary) 42%, #1b1b1b), #141414 85%)",
        }}
      >
        <Icon className={`h-8 w-8 text-white/90 ${item.available ? "" : "grayscale"}`} />
      </div>
      <div className="flex min-w-0 flex-1 flex-col py-0.5 pr-10">
        <p className="font-display text-[21px] uppercase leading-tight">{item.name}</p>
        <p className="line-clamp-2 text-[12px] leading-snug text-foreground/60">{item.desc}</p>
        <div className="mt-auto flex items-center gap-2 pt-1">
          <span className="font-display text-[20px] leading-none text-primary">
            {money(item.price)}
          </span>
          {!item.available && (
            <span className="rounded-md bg-destructive px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-[0.2em]">
              Agotado
            </span>
          )}
        </div>
      </div>
      {canOrder && item.available && (
        <button
          type="button"
          onClick={onAdd}
          aria-label={`Agregar ${item.name}`}
          className="absolute bottom-2.5 right-2.5 grid h-9 w-9 place-items-center rounded-full bg-primary text-primary-foreground transition active:scale-90"
        >
          <Plus className="h-5 w-5" />
        </button>
      )}
    </li>
  );
}

function CartScreen() {
  const { state, dispatch } = useDemo();
  const lines = cartLines(state);
  const subtotal = lines.reduce((n, l) => n + l.qty * l.item.price, 0);
  const zone = activeZone(state);
  const fee = state.fulfillment === "delivery" && zone ? zone.fee : 0;

  const pill = (on: boolean) =>
    `flex h-11 items-center justify-center gap-2 rounded-xl border text-[13px] font-bold uppercase tracking-wide transition-colors ${
      on
        ? "border-primary bg-primary text-primary-foreground"
        : "border-primary/25 bg-foreground/5 text-foreground/80"
    }`;

  const send = () =>
    dispatch({
      type: "send",
      message: orderMessage(state.nextNumber, lines, state.fulfillment, displayName(state), zone),
    });

  return (
    <div className="flex h-full flex-col">
      <StatusBar />
      <header className="flex shrink-0 items-center gap-3 border-b border-primary/15 px-4 pb-3 pt-2">
        <button
          type="button"
          onClick={() => dispatch({ type: "screen", screen: "menu" })}
          aria-label="Volver al menú"
          className="grid h-10 w-10 place-items-center rounded-full bg-foreground/10"
        >
          <ChevronLeft className="h-5 w-5" />
        </button>
        <div>
          <p className="text-[10px] uppercase tracking-[0.3em] text-primary">
            {lines.reduce((n, l) => n + l.qty, 0)} platos
          </p>
          <h3 className="font-display text-[30px] uppercase leading-none">Tu pedido</h3>
        </div>
      </header>

      <div className="min-h-0 flex-1 space-y-3 overflow-y-auto px-4 py-4 [scrollbar-width:none]">
        {lines.map(({ item, qty }) => (
          <div key={item.id} className="rounded-xl border border-primary/15 bg-foreground/5 p-3">
            <div className="flex items-start justify-between gap-3">
              <p className="font-display text-[20px] uppercase leading-tight">{item.name}</p>
              <p className="font-display text-[20px] text-primary">{money(qty * item.price)}</p>
            </div>
            <div className="mt-2 flex w-fit items-center rounded-lg border border-primary/25">
              <button
                type="button"
                aria-label="Quitar uno"
                onClick={() => dispatch({ type: "qty", id: item.id, qty: qty - 1 })}
                className="grid h-9 w-9 place-items-center"
              >
                <Minus className="h-4 w-4" />
              </button>
              <span className="w-7 text-center text-[14px] font-bold">{qty}</span>
              <button
                type="button"
                aria-label="Agregar uno"
                onClick={() => dispatch({ type: "qty", id: item.id, qty: qty + 1 })}
                className="grid h-9 w-9 place-items-center"
              >
                <Plus className="h-4 w-4" />
              </button>
            </div>
          </div>
        ))}

        <p className="pt-2 text-[11px] uppercase tracking-[0.2em] text-foreground/60">
          ¿Cómo lo quieres?
        </p>
        <div className="grid grid-cols-2 gap-2">
          <button
            type="button"
            className={pill(state.fulfillment === "pickup")}
            onClick={() => dispatch({ type: "fulfillment", value: "pickup" })}
          >
            <Store className="h-4 w-4" /> Recoger
          </button>
          <button
            type="button"
            className={pill(state.fulfillment === "delivery")}
            onClick={() => dispatch({ type: "fulfillment", value: "delivery" })}
          >
            <Bike className="h-4 w-4" /> Delivery
          </button>
        </div>
        {state.fulfillment === "delivery" &&
          (zone ? (
            <div className="rounded-lg border border-primary bg-primary/15 px-3 py-2">
              <div className="flex justify-between text-[13px] font-bold">
                <span>{zone.name}</span>
                <span className="text-primary">{money(zone.fee)}</span>
              </div>
              <p className="text-[11px] text-foreground/55">{zone.hoods}</p>
            </div>
          ) : (
            <p className="rounded-lg border border-primary/20 bg-foreground/5 px-3 py-2 text-[12px] text-foreground/60">
              Sin zonas activas: el costo de entrega se confirma por el chat.
            </p>
          ))}
      </div>

      <footer className="shrink-0 space-y-3 border-t border-primary/15 px-4 pb-6 pt-4">
        <div className="flex items-baseline justify-between">
          <span className="text-[11px] uppercase tracking-[0.2em] text-foreground/60">Total</span>
          <span className="font-display text-[32px] leading-none text-primary">
            {money(subtotal + fee)}
          </span>
        </div>
        <button type="button" onClick={send} className="btn-primary w-full !text-[13px]">
          <WhatsAppIcon className="h-5 w-5" /> Enviar pedido por WhatsApp
        </button>
      </footer>
    </div>
  );
}

/** Lo que pasa después: WhatsApp se abre con el pedido ya escrito y numerado. */
function ChatScreen() {
  const { state, dispatch } = useDemo();
  return (
    <div className="flex h-full flex-col bg-[#0B141A] text-[#E9EDEF]">
      <div className="bg-[#1F2C33]">
        <StatusBar color="#E9EDEF" />
        <div className="flex items-center gap-3 px-3 pb-3">
          <button
            type="button"
            aria-label="Volver al menú"
            onClick={() => dispatch({ type: "screen", screen: "menu" })}
            className="grid h-8 w-8 place-items-center rounded-full"
          >
            <ChevronLeft className="h-6 w-6 text-[#00A884]" />
          </button>
          <span className="grid h-10 w-10 place-items-center rounded-full bg-[#2A3942] font-display text-[20px]">
            {initials(displayName(state))}
          </span>
          <div className="min-w-0">
            <p className="truncate text-[16px] font-semibold">{displayName(state)}</p>
            <p className="text-[12px] text-[#8696A0]">en línea</p>
          </div>
        </div>
      </div>

      <div
        className="min-h-0 flex-1 overflow-y-auto px-3 py-4 [scrollbar-width:none]"
        style={{
          backgroundImage: "radial-gradient(rgba(255,255,255,0.035) 1px, transparent 1px)",
          backgroundSize: "18px 18px",
        }}
      >
        <p className="mx-auto mb-3 w-fit rounded-md bg-[#182229] px-2.5 py-1 text-[11px] text-[#8696A0]">
          HOY
        </p>
        {state.lastMessage && (
          <div className="sheet-in ml-auto w-[88%] rounded-lg rounded-tr-none bg-[#005C4B] px-3 pb-1.5 pt-2 text-[13.5px] leading-[1.45] shadow">
            <p className="whitespace-pre-wrap">{state.lastMessage}</p>
            <p className="mt-1 flex items-center justify-end gap-1 text-[10.5px] text-[#8BC3B6]">
              9:41 <CheckCheck className="h-3.5 w-3.5 text-[#53BDEB]" />
            </p>
          </div>
        )}
        <div className="fade-up-in delay-500 mx-auto mt-4 w-fit rounded-lg bg-[#182229] px-3 py-2 text-center text-[12px] text-[#8696A0]">
          El negocio recibe el pedido completo,
          <br /> con número, entrega y total.
        </div>
      </div>

      <div className="shrink-0 bg-[#0B141A] px-4 pb-6 pt-3">
        <button
          type="button"
          onClick={() => dispatch({ type: "screen", screen: "menu" })}
          className="w-full rounded-xl bg-[#00A884] py-3 text-[13px] font-bold uppercase tracking-[0.12em] text-[#0B141A]"
        >
          Hacer otro pedido
        </button>
      </div>
    </div>
  );
}
