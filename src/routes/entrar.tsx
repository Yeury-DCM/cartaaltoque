import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Loader2, MailCheck } from "lucide-react";
import { Center, ErrorNote, fieldClass } from "@/components/Center";
import { GrainOverlay } from "@/components/GrainOverlay";
import { APP_NAME } from "@/lib/brand";
import { useSession } from "@/lib/session";
import { supabase } from "@/lib/supabase";

type Mode = "entrar" | "registro" | "olvide" | "nueva-clave";

/** Solo se aceptan destinos internos ("/app…", "/super…"): evita redirecciones abiertas. */
function safeNext(next: unknown): "/app" | "/super" {
  return typeof next === "string" && next.startsWith("/super") ? "/super" : "/app";
}

export const Route = createFileRoute("/entrar")({
  ssr: false,
  validateSearch: (s: Record<string, unknown>) => ({
    modo: (["registro", "olvide", "nueva-clave"].includes(String(s.modo))
      ? s.modo
      : "entrar") as Mode,
    next: safeNext(s.next),
  }),
  head: () => ({
    meta: [{ title: `Entrar — ${APP_NAME}` }, { name: "robots", content: "noindex" }],
  }),
  component: AuthPage,
});

const ERRORS: Record<string, string> = {
  "Invalid login credentials": "Correo o contraseña incorrectos.",
  "Email not confirmed": "Confirma tu correo antes de entrar (revisa tu bandeja).",
  "User already registered": "Ya existe una cuenta con ese correo. Entra con tu contraseña.",
  "Failed to fetch": "No pudimos conectar con el servidor. Revisa tu internet e intenta de nuevo.",
  "email rate limit exceeded":
    "Se enviaron demasiados correos seguidos. Espera un rato e intenta de nuevo.",
};
const friendly = (msg: string) => ERRORS[msg] ?? msg;

function AuthPage() {
  const { modo, next } = Route.useSearch();
  const navigate = useNavigate();
  const session = useSession();
  const [mode, setMode] = useState<Mode>(modo);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState<string | null>(null);

  // El enlace de "olvidé mi contraseña" vuelve aquí con una sesión de recuperación.
  useEffect(() => {
    const { data } = supabase.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY") setMode("nueva-clave");
    });
    return () => data.subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (session && mode !== "nueva-clave") void navigate({ to: next, replace: true });
  }, [session, mode, next, navigate]);

  const run = async (fn: () => Promise<void>) => {
    setBusy(true);
    setError(null);
    try {
      await fn();
    } catch (e) {
      setError(friendly((e as { message?: string })?.message ?? String(e)));
    } finally {
      setBusy(false);
    }
  };

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const origin = window.location.origin;
    void run(async () => {
      if (mode === "entrar") {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
      } else if (mode === "registro") {
        if (password.length < 8) throw new Error("La contraseña debe tener al menos 8 caracteres.");
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: { emailRedirectTo: `${origin}/app` },
        });
        if (error) throw error;
        if (!data.session) setSent("Te enviamos un correo para confirmar tu cuenta.");
      } else if (mode === "olvide") {
        const { error } = await supabase.auth.resetPasswordForEmail(email, {
          redirectTo: `${origin}/entrar?modo=nueva-clave`,
        });
        if (error) throw error;
        setSent("Si el correo existe, te llegará un enlace para crear una contraseña nueva.");
      } else {
        if (password.length < 8) throw new Error("La contraseña debe tener al menos 8 caracteres.");
        const { error } = await supabase.auth.updateUser({ password });
        if (error) throw error;
        await navigate({ to: "/app", replace: true });
      }
    });
  };

  const title = {
    entrar: "Entrar",
    registro: "Crear cuenta",
    olvide: "Recuperar acceso",
    "nueva-clave": "Nueva contraseña",
  }[mode];

  return (
    <div className="relative overflow-hidden">
      <GrainOverlay />
      <Center>
        <div className="relative w-full max-w-sm">
          <Link
            to="/"
            className="mb-6 block text-center font-display text-4xl uppercase tracking-wide"
          >
            {APP_NAME}
          </Link>
          {sent ? (
            <div className="glass-card space-y-3 p-6 text-center">
              <MailCheck className="mx-auto h-10 w-10 text-primary" />
              <p className="text-foreground/80">{sent}</p>
              <button
                className="btn-ghost w-full"
                onClick={() => {
                  setSent(null);
                  setMode("entrar");
                }}
              >
                Volver
              </button>
            </div>
          ) : (
            <form onSubmit={submit} className="glass-card space-y-4 p-6">
              <h1 className="text-center font-display text-3xl uppercase">{title}</h1>
              {mode === "registro" && (
                <p className="text-center text-sm text-foreground/60">
                  Crea tu cuenta y arma tu menú en minutos.
                </p>
              )}
              {mode !== "nueva-clave" && (
                <input
                  className={fieldClass}
                  type="email"
                  placeholder="Correo"
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              )}
              {mode !== "olvide" && (
                <input
                  className={fieldClass}
                  type="password"
                  placeholder={mode === "entrar" ? "Contraseña" : "Contraseña (mínimo 8)"}
                  autoComplete={mode === "entrar" ? "current-password" : "new-password"}
                  minLength={mode === "entrar" ? undefined : 8}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              )}
              {error && <ErrorNote>{error}</ErrorNote>}
              <button disabled={busy} className="btn-primary w-full">
                {busy && <Loader2 className="h-4 w-4 animate-spin" />} {title}
              </button>

              <div className="flex flex-col items-center gap-2 pt-1 text-xs uppercase tracking-[0.15em] text-foreground/55">
                {mode === "entrar" && (
                  <>
                    <button
                      type="button"
                      onClick={() => setMode("registro")}
                      className="hover:text-primary"
                    >
                      ¿No tienes cuenta? Créala
                    </button>
                    <button
                      type="button"
                      onClick={() => setMode("olvide")}
                      className="hover:text-primary"
                    >
                      Olvidé mi contraseña
                    </button>
                  </>
                )}
                {(mode === "registro" || mode === "olvide") && (
                  <button
                    type="button"
                    onClick={() => setMode("entrar")}
                    className="hover:text-primary"
                  >
                    Ya tengo cuenta
                  </button>
                )}
              </div>
            </form>
          )}
        </div>
      </Center>
    </div>
  );
}
