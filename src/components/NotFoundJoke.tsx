import { useEffect } from "react";
import { Link } from "@tanstack/react-router";
import { Store } from "lucide-react";
import { BrandLogo } from "./BrandLogo";
import { GrainOverlay } from "./GrainOverlay";

/** Rutas que suelen probar curiosos y bots; en vez de un 404 seco reciben la broma. */
const CURIOUS_NAMES = [
  // administración
  "admin",
  "administrator",
  "administrador",
  "admin-panel",
  "adminpanel",
  "adm",
  "superadmin",
  "super-admin",
  "super",
  "sysadmin",
  "root",
  "backoffice",
  "back-office",
  "backend",
  "owner",
  "staff",
  "manager",
  "manage",
  "management",
  "gestion",
  "gerencia",
  "control",
  "control-panel",
  "controlpanel",
  "panel",
  "dashboard",
  "portal",
  "console",
  "private",
  "secret",
  "hidden",
  // WordPress y paneles conocidos
  "wp-admin",
  "wp-login",
  "wp-content",
  "wp-includes",
  "wordpress",
  "cpanel",
  "whm",
  "plesk",
  "phpmyadmin",
  "pma",
  "mysql",
  "adminer",
  // archivos y herramientas que prueban los bots
  ".env",
  ".git",
  ".htaccess",
  "config",
  "settings",
  "debug",
  "test",
  "staging",
  "dev",
  "vendor",
  "api",
  "graphql",
  "swagger",
  "actuator",
  "server-status",
  "jenkins",
  "supabase",
  "xmlrpc",
];

const escapeRegExp = (text: string) => text.replace(/[.*+?^$|(){}[\]\\]/g, "\\$&");

// /nombre, /nombre/lo-que-sea y /nombre.ext, o cualquier archivo .php/.asp/.jsp/.cgi
const CURIOUS_PATHS = new RegExp(
  "^/(" + CURIOUS_NAMES.map(escapeRegExp).join("|") + ")(\\.\\w+)?(/|$)|\\.(php|asp|aspx|jsp|cgi)$",
  "i",
);

export const isCuriousPath = (pathname: string) => CURIOUS_PATHS.test(pathname);

/** Cada línea sale una detrás de otra; `punch` marca el remate en naranja. */
const LINES: { text: string; punch?: boolean }[] = [
  { text: "Esto es incómodo para los dos." },
  { text: "Ni tú deberías estar aquí, ni nosotros deberíamos decírtelo." },
  { text: "Aquí no hay nada que hackear. Hay menús.", punch: true },
  { text: "Lo más secreto que guardamos son los platos de nuestros clientes, y esos no se sueltan." },
  { text: "JAJAJA", punch: true },
];

const STEP_MS = 1500;

/** Página de broma para quien entra a /admin, /superadmin, /.env y similares. */
export function NotFoundJoke() {
  const ctaDelay = LINES.length * STEP_MS + 200;

  // Cuando una línea nueva sale y ya no cabe en la pantalla, la página baja sola hasta el final.
  // Si la persona mueve la página con la rueda, el dedo o el teclado, deja de bajar por ella.
  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    let manual = false;
    const stop = () => (manual = true);
    window.addEventListener("wheel", stop, { passive: true });
    window.addEventListener("touchmove", stop, { passive: true });
    window.addEventListener("keydown", stop);

    const toBottom = () => {
      const root = document.documentElement;
      if (!manual && root.scrollHeight > window.innerHeight) {
        window.scrollTo({ top: root.scrollHeight, behavior: "smooth" });
      }
    };
    // Un poco después de que cada línea (y el botón final) empieza a aparecer.
    const timers = [...LINES.map((_, i) => i * STEP_MS), ctaDelay].map((ms) =>
      window.setTimeout(toBottom, ms + 350),
    );

    return () => {
      timers.forEach(window.clearTimeout);
      window.removeEventListener("wheel", stop);
      window.removeEventListener("touchmove", stop);
      window.removeEventListener("keydown", stop);
    };
  }, [ctaDelay]);

  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden bg-background px-6 py-16 text-center text-foreground">
      <GrainOverlay />

      <BrandLogo className="relative z-10 mb-10 h-14" />

      <div className="relative z-10 max-w-2xl space-y-5">
        {LINES.map((l, i) => (
          <p
            key={l.text}
            className={`joke-line font-display uppercase leading-[0.95] ${
              l.punch
                ? "text-4xl text-primary md:text-6xl"
                : "text-3xl text-foreground/90 md:text-5xl"
            }`}
            style={{ animationDelay: `${i * STEP_MS}ms` }}
          >
            {l.text}
          </p>
        ))}

        <div className="joke-line pt-6" style={{ animationDelay: `${ctaDelay}ms` }}>
          <p className="text-base text-foreground/75 md:text-lg">
            Mejor crea tu propio menú. Es más seguro y mucho más provechoso.
          </p>
          <div className="mt-6 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Link
              to="/entrar"
              search={{ modo: "registro", next: "/app" }}
              className="btn-primary w-full sm:w-auto"
            >
              <Store className="h-4 w-4" />
              Crear mi menú gratis
            </Link>
            <Link to="/" className="btn-ghost w-full sm:w-auto">
              Volver al inicio
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
