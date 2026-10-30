import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import { ErrorNote, labelClass } from "@/components/Center";
import { PhoneField } from "@/components/PhoneField";
import { WhatsAppIcon } from "@/components/icons/WhatsAppIcon";
import { useAdmin } from "@/lib/admin";
import { SUPPORT_WHATSAPP, menuUrl } from "@/lib/brand";
import { errorMessage, supabase } from "@/lib/supabase";
import { isLive, trialDaysLeft } from "@/lib/tenant";

export const Route = createFileRoute("/app/configuracion")({ component: Settings });

/** Datos privados de la cuenta (lo que los clientes del menú nunca ven). */
function Settings() {
  const { restaurant: r, session } = useAdmin();
  const [phone, setPhone] = useState({ digits: "", complete: false });
  const [loaded, setLoaded] = useState(false);
  const [busy, setBusy] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    void supabase
      .from("restaurant_contacts")
      .select("phone")
      .eq("restaurant_id", r.id)
      .maybeSingle()
      .then(({ data }) => {
        if (data?.phone) setPhone({ digits: data.phone, complete: true });
        setLoaded(true);
      });
  }, [r.id]);

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!phone.digits || !phone.complete) {
      setError("Tu número es obligatorio y debe estar completo.");
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const { error } = await supabase.from("restaurant_contacts").upsert({
        restaurant_id: r.id,
        phone: phone.digits,
        updated_at: new Date().toISOString(),
      });
      if (error) throw error;
      setSaved(true);
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setBusy(false);
    }
  };

  const days = trialDaysLeft(r);
  const live = isLive(r);
  const status = !live
    ? r.status === "suspended"
      ? "Tu menú está suspendido."
      : "Tu prueba terminó: tu menú no se ve en línea hasta que actives tu plan."
    : days !== null
      ? `Prueba gratis: ${days === 1 ? "queda 1 día" : `quedan ${days} días`}.`
      : "Tu plan está activo.";
  const payLink = SUPPORT_WHATSAPP
    ? `https://wa.me/${SUPPORT_WHATSAPP}?text=${encodeURIComponent(`Hola, soy de ${r.name} (${menuUrl(r.slug)}). Quiero activar mi plan y coordinar el pago.`)}`
    : null;

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <h1 className="font-display text-4xl uppercase">Configuración</h1>
        <p className="mt-1 text-sm text-foreground/60">
          Datos privados de tu cuenta. Tus clientes no ven nada de esto.
        </p>
      </div>

      <form onSubmit={(e) => void save(e)} className="glass-card space-y-4 p-5">
        <h2 className="text-xs uppercase tracking-[0.2em] text-primary">Contacto con nosotros</h2>
        <div className={labelClass}>
          Tu número de WhatsApp
          {loaded ? (
            <PhoneField
              value={phone.digits}
              required
              onChange={(digits, complete) => {
                setPhone({ digits, complete });
                setSaved(false);
              }}
            />
          ) : (
            <div className="h-10 animate-pulse rounded-lg bg-foreground/5" />
          )}
          <span className="block text-[11px] normal-case tracking-normal text-foreground/50">
            Por aquí te ayudamos y coordinamos tu plan y tu pago.
          </span>
        </div>
        {error && <ErrorNote>{error}</ErrorNote>}
        <button disabled={busy || !loaded} className="btn-primary w-full disabled:opacity-50 sm:w-auto">
          {busy && <Loader2 className="h-4 w-4 animate-spin" />}
          {saved ? "Guardado" : "Guardar"}
        </button>
      </form>

      <section className="glass-card space-y-3 p-5">
        <h2 className="text-xs uppercase tracking-[0.2em] text-primary">Plan y pago</h2>
        <p className="text-sm">{status}</p>
        {payLink && (
          <a
            href={payLink}
            target="_blank"
            rel="noopener noreferrer"
            className="btn-ghost !text-xs"
          >
            <WhatsAppIcon className="h-4 w-4" /> Activar plan por WhatsApp
          </a>
        )}
      </section>

      <section className="glass-card space-y-1 p-5">
        <h2 className="text-xs uppercase tracking-[0.2em] text-primary">Cuenta</h2>
        <p className="text-sm text-foreground/70">Sesión iniciada como</p>
        <p className="font-bold">{session.user.email}</p>
      </section>
    </div>
  );
}
