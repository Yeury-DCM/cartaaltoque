import { createContext, useContext, useMemo, useReducer, type ReactNode } from "react";

/**
 * Estado compartido de la demo de la landing: el celular del cliente y el panel del
 * dueño leen y escriben lo mismo, por eso lo que se toca en uno aparece en el otro.
 * Es solo una simulación local: no toca la base de datos.
 */

export type CategoryId = "pizzas" | "burgers" | "bebidas";

export type DemoItem = {
  id: string;
  cat: CategoryId;
  name: string;
  desc: string;
  price: number;
  available: boolean;
};

export const RESTAURANT = "Pizzería Don Juan";
export const DELIVERY_FEE = 100;

export const CATEGORIES: { id: CategoryId; name: string }[] = [
  { id: "pizzas", name: "Pizzas" },
  { id: "burgers", name: "Burgers" },
  { id: "bebidas", name: "Bebidas" },
];

/** Los mismos platos que el restaurante demo real (/r/demo). */
const ITEMS: DemoItem[] = [
  {
    id: "margarita",
    cat: "pizzas",
    name: "Margarita",
    desc: "Tomate, mozzarella y albahaca fresca.",
    price: 450,
    available: true,
  },
  {
    id: "pepperoni",
    cat: "pizzas",
    name: "Pepperoni",
    desc: "Mozzarella y pepperoni crujiente.",
    price: 550,
    available: true,
  },
  {
    id: "donjuan",
    cat: "pizzas",
    name: "Don Juan",
    desc: "Jamón, maíz y cebolla caramelizada.",
    price: 650,
    available: true,
  },
  {
    id: "clasica",
    cat: "burgers",
    name: "Clásica",
    desc: "Res, cheddar, lechuga y tomate.",
    price: 350,
    available: true,
  },
  {
    id: "doble",
    cat: "burgers",
    name: "Doble queso",
    desc: "Doble carne y doble cheddar.",
    price: 450,
    available: true,
  },
  {
    id: "limonada",
    cat: "bebidas",
    name: "Limonada frozen",
    desc: "Limón natural, bien fría.",
    price: 150,
    available: true,
  },
];

export const SWATCHES = ["#FF7101", "#E63946", "#2A9D8F", "#3A86FF", "#8338EC", "#06D6A0"];

export type Screen = "menu" | "cart" | "chat";
export type Fulfillment = "pickup" | "delivery";

type State = {
  items: DemoItem[];
  color: string;
  cart: Record<string, number>;
  screen: Screen;
  fulfillment: Fulfillment;
  ordersToday: number;
  visitsToday: number;
  visited: boolean;
  nextNumber: number;
  lastMessage: string | null;
  /** Última cosa que cambió, para resaltarla un instante en la otra pantalla. */
  flash: { key: string; at: number } | null;
};

type Action =
  | { type: "toggle"; id: string }
  | { type: "color"; color: string }
  | { type: "add"; id: string }
  | { type: "qty"; id: string; qty: number }
  | { type: "screen"; screen: Screen }
  | { type: "fulfillment"; value: Fulfillment }
  | { type: "send"; message: string };

const initial: State = {
  items: ITEMS,
  color: SWATCHES[0],
  cart: {},
  screen: "menu",
  fulfillment: "pickup",
  ordersToday: 4,
  visitsToday: 37,
  visited: false,
  nextNumber: 18,
  lastMessage: null,
  flash: null,
};

const flash = (key: string) => ({ key, at: Date.now() });

/** La primera vez que el visitante toca el menú del celular cuenta como una visita. */
const touch = (s: State): Partial<State> =>
  s.visited ? {} : { visited: true, visitsToday: s.visitsToday + 1 };

function reducer(s: State, a: Action): State {
  switch (a.type) {
    case "toggle":
      return {
        ...s,
        items: s.items.map((i) => (i.id === a.id ? { ...i, available: !i.available } : i)),
        // Si se agota algo que estaba en el carrito, sale del carrito.
        cart: Object.fromEntries(Object.entries(s.cart).filter(([id]) => id !== a.id)),
        flash: flash(`item:${a.id}`),
      };
    case "color":
      return { ...s, color: a.color, flash: flash("color") };
    case "add": {
      const item = s.items.find((i) => i.id === a.id);
      if (!item?.available) return s;
      return {
        ...s,
        ...touch(s),
        cart: { ...s.cart, [a.id]: Math.min(20, (s.cart[a.id] ?? 0) + 1) },
        flash: flash("cart"),
      };
    }
    case "qty": {
      const cart = { ...s.cart };
      if (a.qty <= 0) delete cart[a.id];
      else cart[a.id] = Math.min(20, a.qty);
      const empty = Object.keys(cart).length === 0;
      return { ...s, cart, screen: empty && s.screen === "cart" ? "menu" : s.screen };
    }
    case "screen":
      return { ...s, ...touch(s), screen: a.screen };
    case "fulfillment":
      return { ...s, fulfillment: a.value };
    case "send":
      return {
        ...s,
        cart: {},
        screen: "chat",
        lastMessage: a.message,
        ordersToday: s.ordersToday + 1,
        nextNumber: s.nextNumber + 1,
        flash: flash("orders"),
      };
  }
}

type DemoValue = { state: State; dispatch: (a: Action) => void };
const DemoContext = createContext<DemoValue | null>(null);

export function DemoProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, initial);
  const value = useMemo(() => ({ state, dispatch }), [state]);
  return <DemoContext.Provider value={value}>{children}</DemoContext.Provider>;
}

export function useDemo(): DemoValue {
  const ctx = useContext(DemoContext);
  if (!ctx) throw new Error("useDemo debe usarse dentro de <DemoProvider>");
  return ctx;
}

export const money = (n: number) =>
  `RD$ ${n.toLocaleString("es-DO", { maximumFractionDigits: 2 })}`;

/** ¿Este elemento cambió hace menos de un segundo? */
export const isFresh = (f: State["flash"], key: string) =>
  !!f && f.key === key && Date.now() - f.at < 1200;

export type CartLine = { item: DemoItem; qty: number };

export function cartLines(s: State): CartLine[] {
  return s.items.filter((i) => s.cart[i.id]).map((item) => ({ item, qty: s.cart[item.id] }));
}

/** El mismo formato del mensaje real que llega al WhatsApp del negocio. */
export function orderMessage(number: number, lines: CartLine[], fulfillment: Fulfillment): string {
  const subtotal = lines.reduce((n, l) => n + l.qty * l.item.price, 0);
  const fee = fulfillment === "delivery" ? DELIVERY_FEE : 0;
  const rows = lines.map((l) => `• ${l.qty}x ${l.item.name} — ${money(l.qty * l.item.price)}`);
  const parts = [`Hola ${RESTAURANT}, quiero hacer este pedido (#${number}):`, "", ...rows, ""];
  if (fulfillment === "pickup") parts.push("Para recoger en el local");
  else {
    parts.push(`Delivery — Zona 1 (${money(fee)})`);
    parts.push("Barrio dentro de la zona: Piantini, Naco, Evaristo Morales");
  }
  parts.push("");
  if (fee) {
    parts.push(`Subtotal: ${money(subtotal)}`);
    parts.push(`Delivery: ${money(fee)}`);
  }
  parts.push(`Total: ${money(subtotal + fee)}`);
  return parts.join("\n");
}
