import { createFileRoute, Link } from "@tanstack/react-router";
import {
  BarChart3,
  Bike,
  Palette,
  QrCode,
  ScanLine,
  ShoppingBag,
  Smartphone,
  UtensilsCrossed,
} from "lucide-react";
import { GrainOverlay } from "@/components/GrainOverlay";
import { Reveal } from "@/components/Reveal";
import { WhatsAppIcon } from "@/components/icons/WhatsAppIcon";
import { APP_NAME, APP_TAGLINE, TRIAL_DAYS } from "@/lib/brand";

export const Route = createFileRoute("/")({ component: Landing });

const STEPS = [
  {
    Icon: UtensilsCrossed,
    title: "Arma tu menú",
    text: "Platos, fotos, tamaños y precios en minutos, desde el celular.",
  },
  {
    Icon: QrCode,
    title: "Imprime tu QR",
    text: "Con tu logo y un afiche listo para las mesas o la vitrina.",
  },
  {
    Icon: WhatsAppIcon,
    title: "Recibe pedidos",
    text: "Tu cliente arma el carrito y te llega el pedido completo por WhatsApp.",
  },
];

const FEATURES = [
  {
    Icon: ShoppingBag,
    title: "Carrito de verdad",
    text: "No es un PDF: el cliente elige, suma y envía. Tú recibes el pedido con total y número.",
  },
  {
    Icon: Bike,
    title: "Zonas de delivery",
    text: "Define barrios y costo de entrega; se suma solo al pedido.",
  },
  {
    Icon: Palette,
    title: "Con tu marca",
    text: "Tu logo, tu portada y tu color. Se ve como tu propia página.",
  },
  {
    Icon: Smartphone,
    title: "Hecho para el celular",
    text: "Rápido, claro y fácil de usar con el pulgar.",
  },
  {
    Icon: ScanLine,
    title: "Tus plataformas",
    text: "Botones a PedidosYa, Uber Eats, Instagram y más, todo en un lugar.",
  },
  {
    Icon: BarChart3,
    title: "Historial de pedidos",
    text: "Cada pedido queda registrado: cuántos, cuándo y cuánto vendiste.",
  },
];

function Landing() {
  return (
    <div className="relative min-h-screen overflow-x-clip bg-background text-foreground">
      <GrainOverlay />

      <header className="relative z-20 mx-auto flex max-w-6xl items-center justify-between px-5 py-5 md:px-8">
        <span className="whitespace-nowrap font-display text-2xl uppercase tracking-wide sm:text-3xl">
          {APP_NAME}
        </span>
        <nav className="flex items-center gap-2">
          <Link
            to="/entrar"
            search={{ modo: "entrar", next: "/app" }}
            className="btn-ghost !px-4 !py-2 !text-xs"
          >
            Entrar
          </Link>
          <Link
            to="/entrar"
            search={{ modo: "registro", next: "/app" }}
            className="btn-primary !hidden !px-4 !py-2 !text-xs min-[400px]:!inline-flex"
          >
            Crear mi menú
          </Link>
        </nav>
      </header>

      <section className="relative z-10 mx-auto grid max-w-6xl items-center gap-12 px-5 pb-20 pt-10 md:grid-cols-[1.15fr_1fr] md:px-8 md:pt-16">
        <div>
          <span className="fade-up-in inline-block text-[11px] uppercase tracking-[0.4em] text-primary">
            Menú digital · QR · WhatsApp
          </span>
          <h1 className="fade-up-in delay-150 mt-3 font-display text-6xl uppercase leading-[0.92] md:text-8xl">
            Tu menú en el celular de tus clientes.{" "}
            <span className="text-primary">Los pedidos, en tu WhatsApp.</span>
          </h1>
          <p className="fade-up-in delay-300 mt-6 max-w-xl text-lg text-foreground/70">
            {APP_TAGLINE}. Sin apps, sin comisiones por pedido y listo en minutos.
          </p>
          <div className="fade-up-in delay-500 mt-8 flex flex-wrap gap-3">
            <Link
              to="/entrar"
              search={{ modo: "registro", next: "/app" }}
              className="btn-primary glow-pulse"
            >
              Prueba gratis {TRIAL_DAYS} días
            </Link>
            <a href="#como-funciona" className="btn-ghost">
              Cómo funciona
            </a>
          </div>
        </div>

        <PhoneMock />
      </section>

      <div className="divider-grain mx-auto max-w-5xl" />

      <section id="como-funciona" className="relative z-10 mx-auto max-w-6xl px-5 py-20 md:px-8">
        <Reveal>
          <h2 className="text-center font-display text-5xl uppercase md:text-6xl">
            Así de <span className="text-primary">sencillo</span>
          </h2>
        </Reveal>
        <ol className="mt-12 grid gap-4 md:grid-cols-3">
          {STEPS.map(({ Icon, title, text }, i) => (
            <Reveal as="li" key={title} delay={i * 120} className="glass-card p-6">
              <span className="font-display text-5xl text-primary/40">0{i + 1}</span>
              <Icon className="mt-2 h-7 w-7 text-primary" />
              <h3 className="mt-3 font-display text-3xl uppercase">{title}</h3>
              <p className="mt-1 text-foreground/65">{text}</p>
            </Reveal>
          ))}
        </ol>
      </section>

      <section className="relative z-10 mx-auto max-w-6xl px-5 pb-20 md:px-8">
        <Reveal>
          <h2 className="text-center font-display text-5xl uppercase md:text-6xl">
            Todo lo que <span className="text-primary">necesitas</span>
          </h2>
        </Reveal>
        <ul className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map(({ Icon, title, text }, i) => (
            <Reveal as="li" key={title} delay={(i % 3) * 100} className="glass-card p-6">
              <Icon className="h-6 w-6 text-primary" />
              <h3 className="mt-3 font-display text-2xl uppercase">{title}</h3>
              <p className="mt-1 text-sm text-foreground/65">{text}</p>
            </Reveal>
          ))}
        </ul>
      </section>

      <section className="relative z-10 mx-auto max-w-3xl px-5 pb-24 text-center md:px-8">
        <Reveal className="glass-card p-8 md:p-12">
          <span className="text-[11px] uppercase tracking-[0.4em] text-primary">Plan Básico</span>
          <h2 className="mt-2 font-display text-5xl uppercase md:text-6xl">Empieza gratis</h2>
          <p className="mx-auto mt-3 max-w-md text-foreground/70">
            {TRIAL_DAYS} días con todo incluido: menú, QR, pedidos por WhatsApp, zonas de delivery e
            historial. Sin tarjeta.
          </p>
          <Link
            to="/entrar"
            search={{ modo: "registro", next: "/app" }}
            className="btn-primary mt-8"
          >
            Crear mi menú
          </Link>
          <p className="mt-6 text-xs uppercase tracking-[0.2em] text-foreground/45">
            Próximamente plan Pro: comanda digital y facturación
          </p>
        </Reveal>
      </section>

      <footer className="relative z-10 border-t border-primary/10 py-8 text-center text-xs uppercase tracking-[0.25em] text-foreground/40">
        © {new Date().getFullYear()} {APP_NAME}
      </footer>
    </div>
  );
}

/** Vista de ejemplo del menú en un teléfono (solo decorativa). */
function PhoneMock() {
  const dishes = [
    { name: "Pizza de la casa", price: "RD$ 650" },
    { name: "Hamburguesa doble", price: "RD$ 450" },
    { name: "Limonada frozen", price: "RD$ 150" },
  ];
  return (
    <div aria-hidden className="fade-up-in delay-300 relative mx-auto w-full max-w-[320px]">
      <div className="absolute -inset-10 rounded-full bg-primary/20 blur-3xl" />
      <div className="relative rounded-[2.5rem] border border-primary/30 bg-card p-3 shadow-[0_30px_80px_-20px_rgba(0,0,0,0.8)]">
        <div className="overflow-hidden rounded-[2rem] bg-background">
          <div className="px-5 pb-4 pt-8 text-center">
            <div className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-primary font-display text-3xl text-primary-foreground">
              P
            </div>
            <p className="mt-3 font-display text-3xl uppercase leading-none">Pizzería Don Juan</p>
            <p className="mt-1 text-[11px] text-foreground/55">Lun–Sáb · 12 pm – 11 pm</p>
          </div>
          <div className="flex gap-1.5 px-4 pb-3">
            {["Todo", "Pizzas", "Burgers"].map((c, i) => (
              <span
                key={c}
                className={`rounded-full border px-3 py-1 text-[10px] font-bold uppercase ${i === 0 ? "border-primary bg-primary text-primary-foreground" : "border-primary/30 text-foreground/75"}`}
              >
                {c}
              </span>
            ))}
          </div>
          <ul className="space-y-2 px-4 pb-4">
            {dishes.map((d) => (
              <li key={d.name} className="glass-card flex items-center gap-3 p-2">
                <span className="h-12 w-12 shrink-0 rounded-lg bg-gradient-to-br from-primary/50 to-primary/10" />
                <span className="min-w-0 flex-1">
                  <span className="block truncate font-display text-lg uppercase leading-tight">
                    {d.name}
                  </span>
                  <span className="font-display text-base text-primary">{d.price}</span>
                </span>
                <span className="grid h-7 w-7 place-items-center rounded-full bg-primary text-sm font-bold text-primary-foreground">
                  +
                </span>
              </li>
            ))}
          </ul>
          <div className="mx-4 mb-5 flex items-center gap-2 rounded-xl bg-primary px-3 py-2.5 text-primary-foreground">
            <ShoppingBag className="h-4 w-4" />
            <span className="flex-1 text-[11px] font-bold uppercase tracking-[0.1em]">
              Ver mi pedido
            </span>
            <span className="font-display text-lg">RD$ 1,100</span>
          </div>
        </div>
      </div>
    </div>
  );
}
