import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { Check, Clock, MapPin, Plus, Search, UtensilsCrossed } from "lucide-react";
import { GrainOverlay } from "@/components/GrainOverlay";
import { CartBar } from "@/components/CartBar";
import { CartDrawer } from "@/components/CartDrawer";
import { CategoryNav } from "@/components/CategoryNav";
import { ItemDialog } from "@/components/ItemDialog";
import { PlatformLinks } from "@/components/PlatformLinks";
import { Reveal } from "@/components/Reveal";
import { APP_NAME } from "@/lib/brand";
import { CartProvider, useCart } from "@/lib/cart";
import { filterAndSort, mainPhoto, type Item, type SortKey } from "@/lib/menu";
import { whatsappUrl } from "@/lib/order";
import { mediaUrl, photoUrl, supabase, useOriginalOnError } from "@/lib/supabase";
import { brandStyle, fetchPublicMenu, type PublicMenu } from "@/lib/tenant";

export const Route = createFileRoute("/r/$slug")({
  loader: async ({ params }) => {
    const menu = await fetchPublicMenu(params.slug);
    if (!menu) throw notFound();
    return menu;
  },
  component: MenuPage,
  notFoundComponent: Unavailable,
  errorComponent: () => (
    <div className="grid min-h-screen place-items-center bg-background px-6 text-center">
      <div>
        <p className="font-display text-4xl uppercase">No pudimos cargar el menú</p>
        <p className="mt-2 text-foreground/70">Intenta de nuevo en un momento.</p>
      </div>
    </div>
  ),
  head: ({ loaderData }) => {
    const r = loaderData?.restaurant;
    if (!r) return { meta: [{ title: `Menú — ${APP_NAME}` }] };
    const description = r.tagline || `Mira el menú de ${r.name} y pide por WhatsApp.`;
    const image = r.cover_path ?? r.logo_path;
    return {
      meta: [
        { title: `${r.name} — Menú` },
        { name: "description", content: description },
        { property: "og:title", content: `${r.name} — Menú` },
        { property: "og:description", content: description },
        ...(image ? [{ property: "og:image", content: mediaUrl(image) }] : []),
        { name: "theme-color", content: r.brand_color },
      ],
    };
  },
});

/** Slug inexistente, restaurante suspendido o despublicado: el mismo mensaje para todos. */
function Unavailable() {
  return (
    <div className="grid min-h-screen place-items-center bg-background px-6 text-center">
      <div>
        <UtensilsCrossed className="mx-auto mb-4 h-10 w-10 text-primary" />
        <p className="font-display text-5xl uppercase">Menú no disponible</p>
        <p className="mx-auto mt-2 max-w-sm text-foreground/65">
          Este menú no existe o no está disponible por ahora. Escríbele al negocio para pedir.
        </p>
        <Link to="/" className="btn-ghost mt-8">
          ¿Tienes un negocio? Crea tu menú
        </Link>
      </div>
    </div>
  );
}

function MenuPage() {
  const menu = Route.useLoaderData();
  return (
    <CartProvider storageKey={`pedido-${menu.restaurant.slug}`} currency={menu.restaurant.currency}>
      <div style={brandStyle(menu.restaurant.brand_color)}>
        <MenuContent menu={menu} />
      </div>
    </CartProvider>
  );
}

function MenuContent({ menu }: { menu: PublicMenu }) {
  const { restaurant: r, categories, items, zones, links } = menu;
  const cart = useCart();
  const [cartOpen, setCartOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState<SortKey>("default");
  const [cat, setCat] = useState<string | "all">("all");
  const [selected, setSelected] = useState<Item | null>(null);
  const listRef = useRef<HTMLElement>(null);
  const previousCategory = useRef(cat);

  // Cuenta la visita una vez por sesión del navegador (recargar o volver no suma otra).
  // Se hace en el navegador, no en el servidor: el menú del servidor sale de caché.
  useEffect(() => {
    const key = `visita-${r.slug}`;
    try {
      if (sessionStorage.getItem(key)) return;
      sessionStorage.setItem(key, "1");
    } catch {
      /* sin almacenamiento: igual se cuenta */
    }
    // supabase-js solo envía la petición al esperarla: sin .then() nunca sale.
    void supabase.rpc("track_menu_view", { p_slug: r.slug }).then(() => undefined);
  }, [r.slug]);

  // Espera a que React pinte la nueva lista: al acortarse, el navegador reajusta
  // el scroll y puede cancelar un desplazamiento iniciado antes del render.
  useLayoutEffect(() => {
    if (previousCategory.current === cat) return;
    previousCategory.current = cat;
    listRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, [cat]);

  // "+" de la tarjeta: sin tamaños que elegir se agrega directo; si hay varios, se abre el detalle.
  const quickAdd = (item: Item) => {
    if (item.item_variants.length > 1) {
      setSelected(item);
      return;
    }
    const v = item.item_variants[0];
    cart.add({
      itemId: item.id,
      variantId: v?.id ?? null,
      name: item.name,
      variantLabel: v?.label ?? null,
      unitPrice: v ? v.price : item.price,
      note: "",
    });
  };

  const visible = useMemo(() => {
    const base = cat === "all" ? items : items.filter((i) => i.category_id === cat);
    return filterAndSort(base, query, sort);
  }, [items, cat, query, sort]);

  const grouped = sort === "default" && cat === "all";
  const chatLink = r.whatsapp ? whatsappUrl(r.whatsapp, `Hola ${r.name}`) : undefined;
  const mapsLink = links.find((l) => l.kind === "maps")?.url;

  return (
    <div className="relative min-h-screen overflow-x-clip bg-background text-foreground">
      <GrainOverlay />

      <header className="relative z-10">
        {r.cover_path && (
          <div className="absolute inset-x-0 top-0 h-72 overflow-hidden md:h-96">
            <img
              src={mediaUrl(r.cover_path)}
              alt=""
              className="h-full w-full object-cover opacity-45"
            />
            <div className="absolute inset-0 bg-gradient-to-b from-background/30 via-background/70 to-background" />
          </div>
        )}
        <div className="relative mx-auto max-w-5xl px-5 pt-10 text-center md:px-8 md:pt-16">
          {/* El logo va con su forma propia (PNG/WebP transparente): sin recuadro ni fondo. */}
          {r.logo_path && (
            <img
              src={mediaUrl(r.logo_path)}
              alt={r.name}
              className="fade-up-in mx-auto mb-6 h-auto max-h-28 w-auto max-w-[220px] object-contain drop-shadow-[0_12px_28px_rgba(0,0,0,0.55)] md:max-h-36 md:max-w-[280px]"
            />
          )}
          <span className="fade-up-in delay-150 inline-block text-[11px] uppercase tracking-[0.4em] text-primary">
            Carta
          </span>
          <h1 className="fade-up-in delay-150 font-display text-6xl uppercase leading-none md:text-8xl">
            {r.name}
          </h1>
          {r.tagline && (
            <p className="fade-up-in delay-300 mx-auto mt-3 max-w-xl text-foreground/70">
              {r.tagline}
            </p>
          )}
          {(r.hours || r.address) && (
            <div className="fade-up-in delay-300 mt-4 flex flex-wrap justify-center gap-x-5 gap-y-2 text-xs uppercase tracking-[0.15em] text-foreground/60">
              {r.hours && (
                <span className="inline-flex items-center gap-1.5">
                  <Clock className="h-3.5 w-3.5 text-primary" /> {r.hours}
                </span>
              )}
              {r.address &&
                (mapsLink ? (
                  <a
                    href={mapsLink}
                    target="_blank"
                    rel="noopener noreferrer nofollow"
                    className="inline-flex items-center gap-1.5 hover:text-primary"
                  >
                    <MapPin className="h-3.5 w-3.5 text-primary" /> {r.address}
                  </a>
                ) : (
                  <span className="inline-flex items-center gap-1.5">
                    <MapPin className="h-3.5 w-3.5 text-primary" /> {r.address}
                  </span>
                ))}
            </div>
          )}
          <PlatformLinks
            className="fade-up-in delay-500 mt-6"
            links={links.filter((l) => l.kind !== "maps")}
            whatsappLink={chatLink}
          />
        </div>
      </header>

      {/* Controles pegajosos */}
      <div className="sticky top-0 z-30 mt-8 border-y border-primary/15 bg-background/90 backdrop-blur-md">
        <div className="mx-auto flex max-w-5xl flex-col gap-3 px-5 py-3 md:px-8">
          <div className="flex gap-2">
            <label className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-foreground/50" />
              <input
                type="search"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Buscar plato…"
                className="w-full rounded-lg border border-input bg-foreground/5 py-2.5 pl-9 pr-3 text-sm outline-none focus:border-primary"
              />
            </label>
            <select
              value={sort}
              onChange={(e) => setSort(e.target.value as SortKey)}
              aria-label="Ordenar"
              className="rounded-lg border border-input bg-foreground/5 px-3 text-sm outline-none focus:border-primary"
            >
              <option value="default" className="bg-background">
                Ordenar
              </option>
              <option value="price-asc" className="bg-background">
                Precio: menor a mayor
              </option>
              <option value="price-desc" className="bg-background">
                Precio: mayor a menor
              </option>
              <option value="name" className="bg-background">
                Nombre A–Z
              </option>
            </select>
          </div>
          <CategoryNav categories={categories} value={cat} onChange={setCat} />
        </div>
      </div>

      <main
        ref={listRef}
        id="lista"
        className={`relative z-10 mx-auto min-h-[calc(100svh-10rem)] max-w-5xl scroll-mt-40 px-5 pt-10 md:px-8 ${cart.count > 0 ? "pb-32" : "pb-10"}`}
      >
        {visible.length === 0 ? (
          <div className="py-20 text-center text-foreground/60">
            <UtensilsCrossed className="mx-auto mb-3 h-8 w-8 text-primary" />
            {items.length === 0
              ? "Pronto publicaremos el menú."
              : "No encontramos platos con ese filtro."}
          </div>
        ) : grouped ? (
          categories.map((c) => {
            const list = visible.filter((i) => i.category_id === c.id);
            if (!list.length) return null;
            return (
              <section key={c.id} className="mb-12">
                <Reveal>
                  <h2 className="mb-5 flex items-center gap-4 font-display text-4xl uppercase">
                    {c.name}
                    <span className="h-px flex-1 bg-gradient-to-r from-primary/50 to-transparent" />
                  </h2>
                </Reveal>
                <ItemGrid items={list} onSelect={setSelected} onQuickAdd={quickAdd} />
              </section>
            );
          })
        ) : (
          <ItemGrid items={visible} onSelect={setSelected} onQuickAdd={quickAdd} />
        )}

        <footer className="mt-16 border-t border-primary/10 pt-6 text-center">
          {r.description && (
            <p className="mx-auto mb-6 max-w-xl text-sm leading-relaxed text-foreground/60">
              {r.description}
            </p>
          )}
          <Link
            to="/"
            className="text-[11px] uppercase tracking-[0.25em] text-foreground/40 transition hover:text-primary"
          >
            Menú hecho con {APP_NAME}
          </Link>
        </footer>
      </main>

      {selected && <ItemDialog item={selected} onClose={() => setSelected(null)} />}

      <CartBar onOpen={() => setCartOpen(true)} />
      {cartOpen && (
        <CartDrawer
          slug={r.slug}
          restaurantName={r.name}
          phone={r.whatsapp ?? ""}
          zones={zones}
          onClose={() => setCartOpen(false)}
        />
      )}
    </div>
  );
}

function ItemGrid({
  items,
  onSelect,
  onQuickAdd,
}: {
  items: Item[];
  onSelect: (item: Item) => void;
  onQuickAdd: (item: Item) => void;
}) {
  return (
    <ul className="grid gap-4 md:grid-cols-2">
      {items.map((i, n) => (
        <Reveal as="li" key={i.id} delay={(n % 2) * 90}>
          <ItemCard item={i} onSelect={() => onSelect(i)} onQuickAdd={() => onQuickAdd(i)} />
        </Reveal>
      ))}
    </ul>
  );
}

function ItemCard({
  item,
  onSelect,
  onQuickAdd,
}: {
  item: Item;
  onSelect: () => void;
  onQuickAdd: () => void;
}) {
  const { format } = useCart();
  const photo = mainPhoto(item);
  const [added, setAdded] = useState(false);
  return (
    <div className="relative h-full">
      <button
        type="button"
        onClick={onSelect}
        aria-label={`Ver ${item.name}`}
        className={`glass-card flex h-full w-full cursor-pointer gap-4 overflow-hidden p-3 text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-primary ${item.is_available ? "" : "opacity-60"}`}
      >
        <div className="relative h-28 w-28 shrink-0 overflow-hidden rounded-xl bg-foreground/5 md:h-32 md:w-32">
          {photo ? (
            <img
              src={photoUrl(photo.path, "sm")}
              onError={useOriginalOnError}
              decoding="async"
              alt={item.name}
              loading="lazy"
              className={`h-full w-full object-cover ${item.is_available ? "" : "grayscale"}`}
            />
          ) : (
            <div className="grid h-full w-full place-items-center text-primary/60">
              <UtensilsCrossed className="h-8 w-8" />
            </div>
          )}
        </div>
        <div className="flex min-w-0 flex-1 flex-col py-1">
          <h3 className="font-display text-2xl uppercase leading-tight">{item.name}</h3>
          {item.description && (
            <p className="mt-1 line-clamp-3 text-sm text-foreground/65">{item.description}</p>
          )}
          {item.item_variants.length > 0 && (
            <ul className="mt-auto flex flex-wrap gap-x-4 gap-y-1 pr-12 pt-2">
              {item.item_variants.map((v) => (
                <li key={v.id} className="flex items-baseline gap-1.5">
                  <span className="text-[10px] font-bold uppercase tracking-[0.15em] text-foreground/60">
                    {v.label}
                  </span>
                  <span className="font-display text-xl text-primary">{format(v.price)}</span>
                </li>
              ))}
            </ul>
          )}
          <div className="mt-auto flex items-center justify-between pt-2">
            {item.item_variants.length === 0 && (
              <span className="font-display text-2xl text-primary">{format(item.price)}</span>
            )}
            {!item.is_available && (
              <span className="rounded-md bg-destructive px-2 py-0.5 text-[10px] font-bold uppercase tracking-[0.2em]">
                Agotado
              </span>
            )}
          </div>
        </div>
      </button>
      {item.is_available && (
        <button
          type="button"
          aria-label={`Agregar ${item.name} al pedido`}
          onClick={() => {
            onQuickAdd();
            if (item.item_variants.length <= 1) {
              setAdded(true);
              window.setTimeout(() => setAdded(false), 1200);
            }
          }}
          className={`absolute bottom-3 right-3 grid h-10 w-10 place-items-center rounded-full text-primary-foreground transition active:scale-90 ${added ? "bg-white" : "bg-primary hover:scale-105"}`}
        >
          {added ? <Check className="h-5 w-5 text-primary" /> : <Plus className="h-5 w-5" />}
        </button>
      )}
    </div>
  );
}
