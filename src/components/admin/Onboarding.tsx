import { useEffect, useState } from "react";
import { Check, Loader2, LogOut, X } from "lucide-react";
import { BrandLogo } from "@/components/BrandLogo";
import { ErrorNote, fieldClass, labelClass } from "@/components/Center";
import { GrainOverlay } from "@/components/GrainOverlay";
import { TRIAL_DAYS, menuUrl } from "@/lib/brand";
import { errorMessage, supabase } from "@/lib/supabase";
import { isValidSlug, onlyDigits, slugify } from "@/lib/tenant";

const CREATE_ERRORS: Record<string, string> = {
  slug_taken: "Esa dirección ya está en uso. Prueba con otra.",
  limit_reached: "Tu cuenta ya tiene un restaurante.",
};

/**
 * Primera vez en el panel: nombre, dirección del menú y WhatsApp. Al crear, el
 * restaurante queda en prueba y con una primera categoría para empezar a cargar platos.
 */
export function Onboarding({ onCreated }: { onCreated: (id: string) => Promise<void> }) {
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [slugTouched, setSlugTouched] = useState(false);
  const [whatsapp, setWhatsapp] = useState("");
  const [available, setAvailable] = useState<boolean | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!slugTouched) setSlug(slugify(name));
  }, [name, slugTouched]);

  // Revisa la disponibilidad mientras escribe (con una pausa para no consultar en cada tecla).
  useEffect(() => {
    setAvailable(null);
    if (!isValidSlug(slug)) return;
    const t = window.setTimeout(async () => {
      const { data } = await supabase.rpc("slug_available", { p_slug: slug });
      setAvailable(data === true);
    }, 350);
    return () => window.clearTimeout(t);
  }, [slug]);

  const phone = onlyDigits(whatsapp);
  // Opcional: sin WhatsApp el menú se muestra sin carrito. Si lo escribe, tiene que ser válido.
  const phoneOk = phone.length === 0 || (phone.length >= 8 && phone.length <= 15);
  const canSubmit = name.trim().length >= 2 && isValidSlug(slug) && available !== false && phoneOk;

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit) return;
    setBusy(true);
    setError(null);
    try {
      const { data: id, error } = await supabase.rpc("create_restaurant", {
        p_name: name.trim(),
        p_slug: slug,
        p_whatsapp: phone || null,
      });
      if (error) throw new Error(CREATE_ERRORS[error.message] ?? error.message);
      await supabase
        .from("categories")
        .insert({ restaurant_id: id as string, name: "Platos", sort_order: 1 });
      await onCreated(id as string);
    } catch (e) {
      setError(errorMessage(e));
      setBusy(false);
    }
  };

  return (
    <div className="relative min-h-screen overflow-hidden bg-background px-5 py-10 text-foreground">
      <GrainOverlay />
      <div className="relative mx-auto max-w-md">
        <div className="mb-8 flex items-center justify-between">
          <BrandLogo className="h-12" />
          <button
            className="btn-ghost !px-3 !py-2 !text-xs"
            onClick={() => supabase.auth.signOut()}
            aria-label="Cerrar sesión"
          >
            <LogOut className="h-4 w-4" />
          </button>
        </div>
        <span className="text-[11px] uppercase tracking-[0.4em] text-primary">Paso 1 de 1</span>
        <h1 className="mt-1 font-display text-5xl uppercase leading-none">Crea tu menú</h1>
        <p className="mt-3 text-foreground/65">
          Empiezas con {TRIAL_DAYS} días de prueba. Luego podrás subir tu logo, elegir colores y
          cargar tus platos.
        </p>

        <form onSubmit={submit} className="glass-card mt-8 space-y-5 p-5">
          <label className={labelClass}>
            Nombre del negocio
            <input
              className={fieldClass}
              value={name}
              onChange={(e) => setName(e.target.value)}
              maxLength={80}
              placeholder="Pizzería Don Juan"
              autoFocus
              required
            />
          </label>

          <label className={labelClass}>
            Dirección de tu menú
            <div className="flex items-center rounded-lg border border-input bg-foreground/5 focus-within:border-primary">
              <span className="pl-3 text-sm normal-case tracking-normal text-foreground/45">
                /r/
              </span>
              <input
                className="w-full bg-transparent px-1 py-2.5 text-sm normal-case tracking-normal outline-none"
                value={slug}
                onChange={(e) => {
                  setSlugTouched(true);
                  setSlug(
                    e.target.value
                      .toLowerCase()
                      .replace(/[^a-z0-9-]/g, "")
                      .slice(0, 40),
                  );
                }}
                placeholder="pizzeria-don-juan"
                required
              />
              <span className="pr-3">
                {available === true && <Check className="h-4 w-4 text-[var(--whatsapp)]" />}
                {available === false && <X className="h-4 w-4 text-destructive" />}
              </span>
            </div>
            <span className="block text-[11px] normal-case tracking-normal text-foreground/50">
              {slug && !isValidSlug(slug)
                ? "Usa de 3 a 40 letras minúsculas, números o guiones."
                : available === false
                  ? "Esa dirección ya está en uso."
                  : slug
                    ? `Tu menú quedará en ${menuUrl(slug)}. Va impresa en tu QR: elígela bien.`
                    : "Es la dirección que abrirá tu código QR."}
            </span>
          </label>

          <label className={labelClass}>
            WhatsApp para recibir pedidos (opcional)
            <input
              className={fieldClass}
              value={whatsapp}
              onChange={(e) => setWhatsapp(e.target.value)}
              inputMode="tel"
              placeholder="1 809 555 0000"
            />
            <span className="block text-[11px] normal-case tracking-normal text-foreground/50">
              Con código de país (en RD empieza con 1). Aquí te llegan los pedidos. Si no trabajas
              con WhatsApp, déjalo vacío: tu menú se verá igual, solo que sin carrito.
            </span>
          </label>

          {error && <ErrorNote>{error}</ErrorNote>}
          <button disabled={!canSubmit || busy} className="btn-primary w-full disabled:opacity-50">
            {busy && <Loader2 className="h-4 w-4 animate-spin" />} Crear mi menú
          </button>
        </form>
      </div>
    </div>
  );
}
