import { createFileRoute, Link, Navigate, Outlet } from "@tanstack/react-router";
import { useCallback, useEffect, useMemo, useState } from "react";
import type { Session } from "@supabase/supabase-js";
import {
  ExternalLink,
  Home,
  LogOut,
  MapPinned,
  Palette,
  QrCode,
  Shield,
  UtensilsCrossed,
} from "lucide-react";
import { Center, ErrorNote, FullSpinner } from "@/components/Center";
import { Onboarding } from "@/components/admin/Onboarding";
import {
  ACTIVE_RESTAURANT_KEY,
  AdminContext,
  loadMemberships,
  useAdmin,
  type Membership,
} from "@/lib/admin";
import { APP_NAME, SUPPORT_WHATSAPP, menuPath, menuUrl } from "@/lib/brand";
import { privatePageHeaders } from "@/lib/security-headers";
import { useSession } from "@/lib/session";
import { errorMessage, mediaUrl, supabase } from "@/lib/supabase";
import { brandStyle, isLive, trialDaysLeft } from "@/lib/tenant";

export const Route = createFileRoute("/app")({
  ssr: false,
  headers: privatePageHeaders,
  head: () => ({
    meta: [{ title: `Panel — ${APP_NAME}` }, { name: "robots", content: "noindex" }],
  }),
  component: AppLayout,
});

function AppLayout() {
  const session = useSession();
  if (session === undefined) return <FullSpinner />;
  if (!session) return <Navigate to="/entrar" search={{ modo: "entrar", next: "/app" }} replace />;
  return <Workspace session={session} />;
}

function readActive(): string | null {
  try {
    return localStorage.getItem(ACTIVE_RESTAURANT_KEY);
  } catch {
    return null;
  }
}

function Workspace({ session }: { session: Session }) {
  const [memberships, setMemberships] = useState<Membership[] | null>(null);
  const [isSuperAdmin, setIsSuperAdmin] = useState(false);
  const [activeId, setActiveId] = useState<string | null>(readActive);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const [list, admin] = await Promise.all([
        loadMemberships(session.user.id),
        supabase.rpc("is_platform_admin"),
      ]);
      setMemberships(list);
      setIsSuperAdmin(admin.data === true);
    } catch (e) {
      setError(errorMessage(e));
    }
  }, [session.user.id]);

  useEffect(() => void load(), [load]);

  const switchTo = useCallback((id: string) => {
    setActiveId(id);
    try {
      localStorage.setItem(ACTIVE_RESTAURANT_KEY, id);
    } catch {
      /* sin almacenamiento */
    }
  }, []);

  const current = memberships?.find((m) => m.restaurant.id === activeId) ?? memberships?.[0];

  const value = useMemo(
    () =>
      current && memberships
        ? {
            session,
            restaurant: current.restaurant,
            role: current.role,
            isOwner: current.role === "owner",
            isSuperAdmin,
            memberships,
            switchTo,
            refresh: load,
          }
        : null,
    [current, memberships, session, isSuperAdmin, switchTo, load],
  );

  if (error)
    return (
      <Center>
        <div className="max-w-sm space-y-4 text-center">
          <ErrorNote>{error}</ErrorNote>
          <button className="btn-ghost" onClick={() => supabase.auth.signOut()}>
            Cerrar sesión
          </button>
        </div>
      </Center>
    );
  if (!memberships) return <FullSpinner />;
  if (!value)
    return (
      <Onboarding
        onCreated={async (id) => {
          switchTo(id);
          await load();
        }}
      />
    );

  return (
    <AdminContext.Provider value={value}>
      <Shell />
    </AdminContext.Provider>
  );
}

const NAV = [
  { to: "/app", label: "Inicio", Icon: Home, exact: true },
  { to: "/app/menu", label: "Menú", Icon: UtensilsCrossed },
  { to: "/app/pagina", label: "Mi página", Icon: Palette },
  { to: "/app/qr", label: "QR", Icon: QrCode },
  { to: "/app/zonas", label: "Zonas", Icon: MapPinned },
] as const;

function Shell() {
  const { restaurant: r, memberships, switchTo, isSuperAdmin } = useAdmin();

  return (
    <div style={brandStyle(r.brand_color)} className="min-h-screen bg-background text-foreground">
      <header className="sticky top-0 z-30 border-b border-primary/15 bg-background/90 backdrop-blur-md">
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-3 px-5 py-3 md:px-8">
          <div className="flex min-w-0 items-center gap-3">
            {r.logo_path && (
              <img
                src={mediaUrl(r.logo_path)}
                alt=""
                className="h-10 w-auto max-w-[96px] shrink-0 object-contain"
              />
            )}
            {memberships.length > 1 ? (
              <select
                value={r.id}
                onChange={(e) => switchTo(e.target.value)}
                aria-label="Restaurante"
                className="min-w-0 truncate bg-transparent font-display text-2xl uppercase outline-none"
              >
                {memberships.map((m) => (
                  <option key={m.restaurant.id} value={m.restaurant.id} className="bg-background">
                    {m.restaurant.name}
                  </option>
                ))}
              </select>
            ) : (
              <span className="truncate font-display text-2xl uppercase">{r.name}</span>
            )}
          </div>
          <div className="flex shrink-0 items-center gap-2">
            <a
              href={menuPath(r.slug)}
              target="_blank"
              rel="noopener noreferrer"
              className="btn-ghost !px-3 !py-2 !text-xs"
            >
              <ExternalLink className="h-4 w-4" />
              <span className="hidden sm:inline">Ver menú</span>
            </a>
            {isSuperAdmin && (
              <Link to="/kac42ad620b9a47" className="btn-ghost !px-3 !py-2 !text-xs" aria-label="Super admin">
                <Shield className="h-4 w-4" />
              </Link>
            )}
            <button
              className="btn-ghost !px-3 !py-2 !text-xs"
              onClick={() => supabase.auth.signOut()}
              aria-label="Cerrar sesión"
            >
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        </div>
        <nav
          aria-label="Secciones"
          className="mx-auto flex max-w-5xl gap-1 overflow-x-auto px-3 pb-2 md:px-6 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        >
          {NAV.map(({ to, label, Icon, ...rest }) => (
            <Link
              key={to}
              to={to}
              activeOptions={{ exact: "exact" in rest }}
              className="flex h-10 shrink-0 items-center gap-2 rounded-full px-4 text-[13px] font-bold uppercase tracking-[0.1em] text-foreground/65 transition-colors hover:text-foreground"
              activeProps={{ className: "!bg-primary !text-primary-foreground" }}
            >
              <Icon className="h-4 w-4" />
              {label}
            </Link>
          ))}
        </nav>
      </header>

      <StatusBanner />

      <main className="mx-auto max-w-5xl px-5 py-6 md:px-8">
        <Outlet />
      </main>
    </div>
  );
}

/** Avisos del estado del restaurante: prueba, suspendido, oculto. */
function StatusBanner() {
  const { restaurant: r } = useAdmin();
  const days = trialDaysLeft(r);
  const live = isLive(r);
  const support = SUPPORT_WHATSAPP
    ? `https://wa.me/${SUPPORT_WHATSAPP}?text=${encodeURIComponent(`Hola, soy de ${r.name} (${menuUrl(r.slug)}). Quiero activar mi plan y coordinar el pago.`)}`
    : null;

  let tone = "border-primary/30 bg-primary/10";
  let text: string | null = null;
  if (!live) {
    tone = "border-destructive/50 bg-destructive/15";
    text =
      r.status === "suspended"
        ? "Tu menú está suspendido y no se ve en línea."
        : "Tu prueba terminó: tu menú no se ve en línea hasta que actives tu plan.";
  } else if (!r.is_published) {
    text = "Tu menú está oculto. Publícalo desde «Mi página» cuando esté listo.";
  } else if (days !== null) {
    text = `Prueba gratis: ${days === 1 ? "queda 1 día" : `quedan ${days} días`}`;
  }
  if (!text) return null;

  return (
    <div className={`border-b ${tone}`}>
      <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-2 px-5 py-2.5 text-sm md:px-8">
        <span>{text}</span>
        {support && (r.status === "trial" || !live) && (
          <a
            href={support}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs font-bold uppercase tracking-[0.15em] text-primary hover:underline"
          >
            Activar plan por WhatsApp
          </a>
        )}
      </div>
    </div>
  );
}
