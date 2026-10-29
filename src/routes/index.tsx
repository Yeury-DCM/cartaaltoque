import { createFileRoute, Link } from "@tanstack/react-router";
import {
  ArrowDown,
  BarChart3,
  Bike,
  Palette,
  QrCode,
  ShoppingBag,
  Smartphone,
  Store,
  UtensilsCrossed,
} from "lucide-react";
import { BrandLogo } from "@/components/BrandLogo";
import { GrainOverlay } from "@/components/GrainOverlay";
import { Reveal } from "@/components/Reveal";
import { WhatsAppIcon } from "@/components/icons/WhatsAppIcon";
import { Compare } from "@/components/landing/Compare";
import { Faq } from "@/components/landing/Faq";
import { LiveDemo } from "@/components/landing/LiveDemo";
import { Statement } from "@/components/landing/Statement";
import { TryQr } from "@/components/landing/TryQr";
import { APP_NAME, TRIAL_DAYS } from "@/lib/brand";

export const Route = createFileRoute("/")({ component: Landing });

const signup = { modo: "registro", next: "/app" } as const;

const STEPS = [
  {
    Icon: UtensilsCrossed,
    title: "Arma tu menú",
    text: "Platos, fotos, tamaños y precios desde el celular. Con tu logo y tu color.",
  },
  {
    Icon: QrCode,
    title: "Pon tu QR",
    text: "Descarga tu código y un afiche listo para las mesas, la vitrina o el delivery.",
  },
  {
    Icon: WhatsAppIcon,
    title: "Recibe pedidos",
    text: "Tu cliente arma el carrito y te llega el pedido completo a tu WhatsApp.",
  },
];

const FEATURES = [
  {
    Icon: ShoppingBag,
    title: "Un carrito de verdad",
    text: "No es un PDF: tu cliente elige, suma y envía. Tú recibes el pedido con número, entrega y total.",
    wide: true,
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
    Icon: Store,
    title: "Tus plataformas",
    text: "Botones a PedidosYa, Uber Eats, Instagram y más, en un solo lugar.",
  },
  {
    Icon: BarChart3,
    title: "Visitas y pedidos",
    text: "Mira cuántas personas abren tu menú cada día y cuántas te piden por WhatsApp.",
  },
  {
    Icon: Smartphone,
    title: "Hecho para el celular",
    text: "Rápido y claro, pensado para el pulgar de tus clientes y para el tuyo.",
    wide: true,
  },
];

function Landing() {
  return (
    <div className="relative min-h-screen overflow-x-clip bg-background text-foreground">
      <Nav />

      {/* ─── Hero + demo en vivo ─── */}
      <section id="inicio" className="relative overflow-hidden pb-24 pt-36 md:pt-44">
        <div aria-hidden className="hero-glow absolute inset-0" />
        <div aria-hidden className="grid-lines absolute inset-0" />
        <GrainOverlay />
        <div className="relative mx-auto max-w-6xl px-5 text-center md:px-8">
          <h1 className="fade-up-in delay-150 mx-auto max-w-5xl font-display text-[clamp(64px,10.5vw,148px)] uppercase leading-[0.86]">
            Tu menú, <span className="text-primary">al toque.</span>
          </h1>
          <p className="fade-up-in delay-300 mx-auto mt-7 max-w-2xl text-lg leading-relaxed text-foreground/70 md:text-xl">
            Tus clientes escanean el QR, arman su pedido desde el celular y te llega completo por
            WhatsApp: platos, tamaños, entrega y total. Sin apps y sin comisiones por pedido.
          </p>
          <div className="fade-up-in delay-500 mt-10 flex flex-wrap justify-center gap-3">
            <Link to="/entrar" search={signup} className="btn-pill btn-pill-primary">
              Crear mi menú gratis
            </Link>
            <a href="#demo" className="btn-pill btn-pill-ghost">
              Pruébalo aquí <ArrowDown className="h-4 w-4" />
            </a>
          </div>
          <ul className="fade-up-in delay-500 mt-8 flex flex-wrap justify-center gap-x-7 gap-y-2 text-[14px] text-foreground/55">
            {[
              `${TRIAL_DAYS} días gratis`,
              "Sin tarjeta",
              "Sin comisión por pedido",
              "Listo en minutos",
            ].map((f) => (
              <li key={f} className="check-item">
                {f}
              </li>
            ))}
          </ul>
        </div>

        <div id="demo" className="relative mx-auto mt-20 max-w-6xl scroll-mt-28 px-5 md:px-8">
          <LiveDemo />
        </div>
      </section>

      {/* ─── El problema ─── */}
      <section className="relative border-t border-white/5 bg-[#0A0A0A] py-28 md:py-40">
        <div className="mx-auto max-w-6xl px-5 md:px-8">
          <Statement text="Tus clientes ya te piden por *WhatsApp. Lo cansado es todo lo demás: mandar el menú, responder precios, sumar totales y preguntar la dirección. Carta al Toque lo hace *por *ti." />
        </div>
      </section>

      {/* ─── Antes y después ─── */}
      <section id="comparacion" className="relative bg-[#F6F1EA] py-28 text-[#1A1712] md:py-36">
        <div className="mx-auto max-w-6xl px-5 md:px-8">
          <Reveal>
            <span className="text-[11px] font-bold uppercase tracking-[0.4em] text-[#C25500]">
              Antes y después
            </span>
            <h2 className="mt-4 max-w-[14ch] font-display text-[clamp(52px,7vw,104px)] uppercase leading-[0.9]">
              Doce mensajes contra uno.
            </h2>
          </Reveal>
          <Compare />
        </div>
      </section>

      {/* ─── Cómo funciona ─── */}
      <section id="como-funciona" className="relative py-28 md:py-36">
        <div className="mx-auto max-w-6xl px-5 md:px-8">
          <Reveal className="text-center">
            <span className="text-[11px] font-bold uppercase tracking-[0.4em] text-primary">
              Cómo funciona
            </span>
            <h2 className="mt-4 font-display text-[clamp(52px,7vw,104px)] uppercase leading-[0.9]">
              Tres pasos. <span className="text-primary">Hoy mismo.</span>
            </h2>
          </Reveal>
          <ol className="relative mt-16 grid gap-5 md:grid-cols-3">
            <span
              aria-hidden
              className="absolute left-[16%] right-[16%] top-[52px] hidden h-px bg-gradient-to-r from-transparent via-primary/50 to-transparent md:block"
            />
            {STEPS.map(({ Icon, title, text }, i) => (
              <Reveal
                as="li"
                key={title}
                delay={i * 120}
                className="premium-card relative p-7 text-center"
              >
                <span className="relative mx-auto grid h-[72px] w-[72px] place-items-center rounded-2xl bg-primary text-primary-foreground shadow-[0_18px_40px_-12px_var(--primary)]">
                  <Icon className="h-8 w-8" />
                </span>
                <span className="mt-6 block font-mono text-[12px] tracking-[0.3em] text-foreground/40">
                  PASO 0{i + 1}
                </span>
                <h3 className="mt-2 font-display text-[34px] uppercase leading-none">{title}</h3>
                <p className="mt-3 text-foreground/65">{text}</p>
              </Reveal>
            ))}
          </ol>
        </div>
      </section>

      {/* ─── Lo que incluye ─── */}
      <section className="relative border-t border-white/5 bg-[#0A0A0A] py-28 md:py-36">
        <div className="mx-auto max-w-6xl px-5 md:px-8">
          <Reveal>
            <span className="text-[11px] font-bold uppercase tracking-[0.4em] text-primary">
              Todo incluido
            </span>
            <h2 className="mt-4 max-w-[16ch] font-display text-[clamp(52px,7vw,104px)] uppercase leading-[0.9]">
              Lo que necesitas, <span className="text-primary">nada más.</span>
            </h2>
          </Reveal>
          <ul className="mt-14 grid gap-4 md:grid-cols-3">
            {FEATURES.map(({ Icon, title, text, wide }, i) => (
              <Reveal
                as="li"
                key={title}
                delay={(i % 3) * 90}
                className={`premium-card group p-7 ${wide ? "md:col-span-2" : ""}`}
              >
                <span className="grid h-12 w-12 place-items-center rounded-xl border border-primary/30 bg-primary/10 text-primary transition group-hover:bg-primary group-hover:text-primary-foreground">
                  <Icon className="h-6 w-6" />
                </span>
                <h3 className="mt-5 font-display text-[30px] uppercase leading-none">{title}</h3>
                <p className="mt-2 max-w-md text-foreground/65">{text}</p>
              </Reveal>
            ))}
          </ul>
        </div>
      </section>

      {/* ─── Pruébalo en tu celular ─── */}
      <section className="relative py-24 md:py-32">
        <div className="mx-auto max-w-6xl px-5 md:px-8">
          <Reveal>
            <TryQr />
          </Reveal>
        </div>
      </section>

      {/* ─── Precio ─── */}
      <section id="precio" className="relative py-24 md:py-32">
        <div className="mx-auto max-w-3xl px-5 md:px-8">
          <Reveal className="premium-card relative overflow-hidden p-10 text-center md:p-14">
            <div aria-hidden className="hero-glow absolute inset-0 opacity-70" />
            <div className="relative">
              <span className="text-[11px] font-bold uppercase tracking-[0.4em] text-primary">
                Plan Básico
              </span>
              <h2 className="mt-3 font-display text-[clamp(56px,7vw,96px)] uppercase leading-[0.9]">
                Empieza gratis
              </h2>
              <p className="mx-auto mt-4 max-w-md text-foreground/70">
                {TRIAL_DAYS} días con todo incluido: menú, QR con tu logo, pedidos por WhatsApp,
                zonas de delivery y estadísticas. Sin tarjeta.
              </p>
              <Link to="/entrar" search={signup} className="btn-pill btn-pill-primary mt-9">
                Crear mi menú
              </Link>
            </div>
          </Reveal>
        </div>
      </section>

      {/* ─── Preguntas ─── */}
      <section
        id="preguntas"
        className="relative border-t border-white/5 bg-[#0A0A0A] py-28 md:py-36"
      >
        <div className="mx-auto max-w-4xl px-5 md:px-8">
          <Reveal>
            <span className="text-[11px] font-bold uppercase tracking-[0.4em] text-primary">
              Preguntas
            </span>
            <h2 className="mt-4 font-display text-[clamp(52px,7vw,96px)] uppercase leading-[0.9]">
              Lo que nos preguntan.
            </h2>
          </Reveal>
          <Faq />
        </div>
      </section>

      {/* ─── Cierre ─── */}
      <section className="relative overflow-hidden py-32 text-center md:py-44">
        <div aria-hidden className="hero-glow absolute inset-0" />
        <GrainOverlay />
        <div className="relative mx-auto max-w-4xl px-5 md:px-8">
          <Reveal>
            <h2 className="font-display text-[clamp(60px,9vw,132px)] uppercase leading-[0.86]">
              Tu menú, listo <span className="text-primary">hoy.</span>
            </h2>
            <p className="mx-auto mt-6 max-w-xl text-lg text-foreground/70">
              Créalo en minutos, imprime tu QR y empieza a recibir pedidos por WhatsApp.
            </p>
            <Link to="/entrar" search={signup} className="btn-pill btn-pill-primary mt-10">
              Crear mi menú gratis
            </Link>
          </Reveal>
        </div>
      </section>

      <footer className="border-t border-white/5 py-10">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-5 px-5 md:flex-row md:px-8">
          <BrandLogo className="h-10" />
          <nav className="flex flex-wrap justify-center gap-6 text-sm text-foreground/55">
            <a href="#demo" className="hover:text-primary">
              Demo
            </a>
            <a href="#como-funciona" className="hover:text-primary">
              Cómo funciona
            </a>
            <a href="#preguntas" className="hover:text-primary">
              Preguntas
            </a>
            <Link
              to="/entrar"
              search={{ modo: "entrar", next: "/app" }}
              className="hover:text-primary"
            >
              Entrar
            </Link>
          </nav>
          <p className="text-xs uppercase tracking-[0.25em] text-foreground/35">
            © {new Date().getFullYear()} {APP_NAME}
          </p>
        </div>
      </footer>
    </div>
  );
}

/** Barra flotante de vidrio, como una cápsula. */
function Nav() {
  return (
    <header className="fixed inset-x-0 top-0 z-50 px-3 pt-3 md:px-6 md:pt-5">
      <div className="nav-glass backdrop-blur-2xl backdrop-saturate-150 mx-auto flex max-w-6xl items-center justify-between gap-3 rounded-2xl px-3 py-2 md:px-4">
        <a href="#inicio" aria-label={APP_NAME} className="shrink-0">
          <BrandLogo className="h-8 md:h-9" />
        </a>
        <nav className="hidden items-center gap-7 text-[13px] font-bold uppercase tracking-[0.14em] text-foreground/65 lg:flex">
          <a href="#demo" className="transition hover:text-foreground">
            Demo
          </a>
          <a href="#como-funciona" className="transition hover:text-foreground">
            Cómo funciona
          </a>
          <a href="#precio" className="transition hover:text-foreground">
            Precio
          </a>
          <a href="#preguntas" className="transition hover:text-foreground">
            Preguntas
          </a>
        </nav>
        <div className="flex items-center gap-2">
          <Link
            to="/entrar"
            search={{ modo: "entrar", next: "/app" }}
            className="hidden rounded-xl px-3 py-2 text-[12px] font-bold uppercase tracking-[0.14em] text-foreground/75 transition hover:text-foreground sm:block"
          >
            Entrar
          </Link>
          <Link
            to="/entrar"
            search={signup}
            className="btn-pill btn-pill-primary !px-4 !py-2.5 !text-[11px]"
          >
            Crear mi menú
          </Link>
        </div>
      </div>
    </header>
  );
}
