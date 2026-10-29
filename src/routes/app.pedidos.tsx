import { createFileRoute } from "@tanstack/react-router";
import { useCallback, useEffect, useState } from "react";
import { Bike, ChevronDown, Loader2, RefreshCw, Store } from "lucide-react";
import { ErrorNote } from "@/components/Center";
import { useAdmin } from "@/lib/admin";
import { formatMoney, type Currency } from "@/lib/menu";
import { errorMessage, supabase } from "@/lib/supabase";

export const Route = createFileRoute("/app/pedidos")({ component: OrdersPage });

const STATUSES = ["new", "confirmed", "preparing", "ready", "delivered", "cancelled"] as const;
type Status = (typeof STATUSES)[number];

const STATUS_LABEL: Record<Status, string> = {
  new: "Nuevo",
  confirmed: "Confirmado",
  preparing: "Preparando",
  ready: "Listo",
  delivered: "Entregado",
  cancelled: "Cancelado",
};

type OrderItem = {
  id: string;
  name: string;
  variant_label: string | null;
  unit_price: number;
  qty: number;
  note: string | null;
};

type Order = {
  id: string;
  number: number;
  status: Status;
  fulfillment: "pickup" | "delivery";
  customer_name: string | null;
  customer_phone: string | null;
  address: string | null;
  zone_name: string | null;
  delivery_fee: number;
  subtotal: number;
  total: number;
  currency: Currency;
  created_at: string;
  order_items: OrderItem[];
};

const PAGE = 50;

function OrdersPage() {
  const { restaurant: r } = useAdmin();
  const [orders, setOrders] = useState<Order[] | null>(null);
  const [filter, setFilter] = useState<Status | "all" | "open">("open");
  const [open, setOpen] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    let q = supabase
      .from("orders")
      .select("*, order_items(*)")
      .eq("restaurant_id", r.id)
      .order("created_at", { ascending: false })
      .limit(PAGE);
    if (filter === "open") q = q.in("status", ["new", "confirmed", "preparing", "ready"]);
    else if (filter !== "all") q = q.eq("status", filter);
    const { data, error } = await q;
    if (error) setError(error.message);
    else setOrders(data as Order[]);
    setLoading(false);
  }, [r.id, filter]);

  useEffect(() => void load(), [load]);

  const setStatus = async (o: Order, status: Status) => {
    setOrders((list) => list?.map((x) => (x.id === o.id ? { ...x, status } : x)) ?? null);
    const { error } = await supabase
      .from("orders")
      .update({ status })
      .eq("id", o.id)
      .eq("restaurant_id", r.id);
    if (error) {
      setError(errorMessage(error));
      void load();
    }
  };

  const chip = (value: typeof filter, label: string) => (
    <button
      key={value}
      onClick={() => setFilter(value)}
      aria-pressed={filter === value}
      className={`h-9 shrink-0 rounded-full border px-4 text-xs font-bold uppercase tracking-[0.1em] transition-colors ${
        filter === value
          ? "border-primary bg-primary text-primary-foreground"
          : "border-primary/30 bg-foreground/5 text-foreground/80 hover:border-primary"
      }`}
    >
      {label}
    </button>
  );

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <h1 className="font-display text-4xl uppercase">Pedidos</h1>
        <button onClick={() => void load()} className="btn-ghost !px-3 !py-2 !text-xs">
          <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} /> Actualizar
        </button>
      </div>
      <div className="flex gap-2 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {chip("open", "Abiertos")}
        {chip("all", "Todos")}
        {STATUSES.map((s) => chip(s, STATUS_LABEL[s]))}
      </div>
      <p className="text-xs text-foreground/50">
        Aquí queda registro de cada pedido enviado desde tu menú. El cliente te lo manda por
        WhatsApp con su número (#) para que lo ubiques.
      </p>

      {error && <ErrorNote>{error}</ErrorNote>}

      {!orders ? (
        <div className="grid place-items-center py-16">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
        </div>
      ) : orders.length === 0 ? (
        <p className="py-16 text-center text-foreground/60">No hay pedidos en esta vista.</p>
      ) : (
        <ul className="space-y-2">
          {orders.map((o) => {
            const expanded = open === o.id;
            const money = (n: number) => formatMoney(Number(n), o.currency);
            return (
              <li
                key={o.id}
                className={`rounded-xl border bg-foreground/5 ${o.status === "new" ? "border-primary/60" : "border-primary/15"}`}
              >
                <div className="flex items-center gap-3 p-3">
                  <button
                    onClick={() => setOpen(expanded ? null : o.id)}
                    className="flex min-w-0 flex-1 items-center gap-3 text-left"
                    aria-expanded={expanded}
                  >
                    <span className="font-display text-3xl text-primary">#{o.number}</span>
                    <span className="min-w-0">
                      <span className="flex items-center gap-1.5 font-bold">
                        {o.fulfillment === "delivery" ? (
                          <Bike className="h-4 w-4 shrink-0" />
                        ) : (
                          <Store className="h-4 w-4 shrink-0" />
                        )}
                        <span className="truncate">{o.customer_name || "Sin nombre"}</span>
                      </span>
                      <span className="block truncate text-xs text-foreground/55">
                        {new Date(o.created_at).toLocaleString("es-DO", {
                          dateStyle: "short",
                          timeStyle: "short",
                        })}{" "}
                        · {money(o.total)}
                      </span>
                    </span>
                    <ChevronDown
                      className={`ml-auto h-4 w-4 shrink-0 transition-transform ${expanded ? "rotate-180" : ""}`}
                    />
                  </button>
                  <select
                    value={o.status}
                    onChange={(e) => void setStatus(o, e.target.value as Status)}
                    aria-label={`Estado del pedido ${o.number}`}
                    className="rounded-lg border border-input bg-background px-2 py-2 text-xs font-bold uppercase outline-none focus:border-primary"
                  >
                    {STATUSES.map((s) => (
                      <option key={s} value={s}>
                        {STATUS_LABEL[s]}
                      </option>
                    ))}
                  </select>
                </div>
                {expanded && (
                  <div className="space-y-2 border-t border-primary/15 px-4 py-3 text-sm">
                    <ul className="space-y-1">
                      {o.order_items.map((l) => (
                        <li key={l.id} className="flex justify-between gap-3">
                          <span>
                            {l.qty}x {l.name}
                            {l.variant_label && ` (${l.variant_label})`}
                            {l.note && (
                              <span className="block text-xs text-foreground/55">
                                Nota: {l.note}
                              </span>
                            )}
                          </span>
                          <span className="shrink-0">{money(l.qty * Number(l.unit_price))}</span>
                        </li>
                      ))}
                    </ul>
                    <div className="space-y-0.5 border-t border-primary/10 pt-2 text-foreground/70">
                      {o.fulfillment === "delivery" ? (
                        <p>
                          Delivery{o.zone_name ? ` — ${o.zone_name}` : ""}
                          {Number(o.delivery_fee) > 0 && ` (${money(o.delivery_fee)})`}
                        </p>
                      ) : (
                        <p>Para recoger</p>
                      )}
                      {o.address && <p>Dirección: {o.address}</p>}
                      {o.customer_phone && <p>Tel.: {o.customer_phone}</p>}
                      <p className="font-bold text-foreground">Total: {money(o.total)}</p>
                    </div>
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
