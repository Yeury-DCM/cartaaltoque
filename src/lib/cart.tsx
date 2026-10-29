import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { formatMoney, type Currency } from "./menu";

export type CartLine = {
  /** Identifica la línea: mismo plato + misma variante + misma nota se suman. */
  key: string;
  itemId: string;
  variantId: string | null;
  name: string;
  variantLabel: string | null;
  /** Precio de referencia para mostrar; el servidor recalcula el real al pedir. */
  unitPrice: number;
  qty: number;
  note: string;
};

export type NewLine = Omit<CartLine, "key" | "qty"> & { qty?: number };

type CartValue = {
  lines: CartLine[];
  count: number;
  total: number;
  currency: Currency;
  format: (n: number) => string;
  add: (line: NewLine) => void;
  setQty: (key: string, qty: number) => void;
  setNote: (key: string, note: string) => void;
  remove: (key: string) => void;
  clear: () => void;
  /** Cambia cada vez que se agrega algo; sirve para animar la barra del pedido. */
  addedTick: number;
};

export const MAX_QTY = 20;

const CartContext = createContext<CartValue | null>(null);

const lineKey = (l: Pick<CartLine, "itemId" | "variantId" | "note">) =>
  `${l.itemId}|${l.variantId ?? ""}|${l.note.trim().toLowerCase()}`;

function load(storageKey: string): CartLine[] {
  try {
    const raw = localStorage.getItem(storageKey);
    const data = raw ? JSON.parse(raw) : [];
    return Array.isArray(data) ? data.filter((l) => l && l.key && l.itemId && l.qty > 0) : [];
  } catch {
    return [];
  }
}

/** Carrito de un restaurante. Cada restaurante guarda el suyo por separado (storageKey). */
export function CartProvider({
  storageKey,
  currency,
  children,
}: {
  storageKey: string;
  currency: Currency;
  children: React.ReactNode;
}) {
  const [lines, setLines] = useState<CartLine[]>([]);
  const [ready, setReady] = useState(false);
  const [addedTick, setAddedTick] = useState(0);

  // El pedido se lee después de montar para que el HTML del servidor y el del navegador coincidan.
  useEffect(() => {
    setLines(load(storageKey));
    setReady(true);
  }, [storageKey]);

  useEffect(() => {
    if (!ready) return;
    try {
      localStorage.setItem(storageKey, JSON.stringify(lines));
    } catch {
      /* sin almacenamiento: el pedido vive solo en esta visita */
    }
  }, [lines, ready, storageKey]);

  const add = useCallback((line: NewLine) => {
    const qty = Math.max(1, line.qty ?? 1);
    const note = line.note.trim();
    const key = lineKey({ ...line, note });
    setLines((prev) => {
      const found = prev.find((l) => l.key === key);
      if (found) {
        return prev.map((l) => (l.key === key ? { ...l, qty: Math.min(MAX_QTY, l.qty + qty) } : l));
      }
      return [...prev, { ...line, note, key, qty: Math.min(MAX_QTY, qty) }];
    });
    setAddedTick((t) => t + 1);
  }, []);

  const setQty = useCallback((key: string, qty: number) => {
    setLines((prev) =>
      qty <= 0
        ? prev.filter((l) => l.key !== key)
        : prev.map((l) => (l.key === key ? { ...l, qty: Math.min(MAX_QTY, qty) } : l)),
    );
  }, []);

  const setNote = useCallback((key: string, note: string) => {
    setLines((prev) => prev.map((l) => (l.key === key ? { ...l, note } : l)));
  }, []);

  const remove = useCallback(
    (key: string) => setLines((prev) => prev.filter((l) => l.key !== key)),
    [],
  );
  const clear = useCallback(() => setLines([]), []);
  const format = useCallback((n: number) => formatMoney(n, currency), [currency]);

  const value = useMemo<CartValue>(
    () => ({
      lines,
      count: lines.reduce((n, l) => n + l.qty, 0),
      total: lines.reduce((n, l) => n + l.qty * l.unitPrice, 0),
      currency,
      format,
      add,
      setQty,
      setNote,
      remove,
      clear,
      addedTick,
    }),
    [lines, currency, format, add, setQty, setNote, remove, clear, addedTick],
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart(): CartValue {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart debe usarse dentro de <CartProvider>");
  return ctx;
}
