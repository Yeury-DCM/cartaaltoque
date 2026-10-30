import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { ImagePlus, Loader2, Trash2 } from "lucide-react";
import { ErrorNote, fieldClass, labelClass } from "@/components/Center";
import { PhoneField } from "@/components/PhoneField";
import { LINK_LABEL } from "@/components/PlatformLinks";
import { useAdmin } from "@/lib/admin";
import { menuUrl } from "@/lib/brand";
import { compressCover, compressLogo, type Currency } from "@/lib/menu";
import {
  errorMessage,
  MEDIA_BUCKET,
  mediaUrl,
  PHOTO_CACHE_SECONDS,
  supabase,
} from "@/lib/supabase";
import {
  ALL_FONT_HREFS,
  asFontStyle,
  brandStyle,
  asTheme,
  FONT_STYLES,
  THEMES,
} from "@/lib/brand-color";
import {
  DEFAULT_BRAND,
  isValidSlug,
  LINK_KINDS,
  normalizeHttpsUrl,
  onlyDigits,
  type LinkKind,
} from "@/lib/tenant";

export const Route = createFileRoute("/app/pagina")({ component: PageSettings });

const PRESETS = [
  "#FF7101",
  "#F5A01E",
  "#E63946",
  "#2A9D8F",
  "#3A86FF",
  "#8338EC",
  "#FF6B9D",
  "#06D6A0",
  "#FFD166",
];

const PLACEHOLDER: Record<LinkKind, string> = {
  pedidosya: "pedidosya.com.do/restaurantes/…",
  ubereats: "ubereats.com/do/store/…",
  instagram: "instagram.com/tunegocio",
  facebook: "facebook.com/tunegocio",
  tiktok: "tiktok.com/@tunegocio",
  website: "tunegocio.com",
  maps: "maps.app.goo.gl/…",
};

function PageSettings() {
  const { restaurant: r, isOwner, refresh } = useAdmin();
  const [form, setForm] = useState({
    name: r.name,
    tagline: r.tagline ?? "",
    description: r.description ?? "",
    whatsapp: r.whatsapp ?? "",
    address: r.address ?? "",
    hours: r.hours ?? "",
    brand_color: r.brand_color,
    theme: asTheme(r.theme),
    font_style: asFontStyle(r.font_style),
    currency: r.currency,
    slug: r.slug,
    is_published: r.is_published,
  });
  const [links, setLinks] = useState<Record<LinkKind, string>>(
    () => Object.fromEntries(LINK_KINDS.map((k) => [k, ""])) as Record<LinkKind, string>,
  );
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    void supabase
      .from("restaurant_links")
      .select("kind, url")
      .eq("restaurant_id", r.id)
      .then(({ data }) => {
        if (!data) return;
        setLinks((prev) => {
          const next = { ...prev };
          for (const l of data as { kind: LinkKind; url: string }[]) next[l.kind] = l.url;
          return next;
        });
      });
  }, [r.id]);

  if (!isOwner)
    return (
      <p className="py-16 text-center text-foreground/60">
        Solo el dueño del restaurante puede cambiar la página.
      </p>
    );

  // El teléfono se valida según el país elegido en el selector.
  const [waOk, setWaOk] = useState(true);

  const set = <K extends keyof typeof form>(k: K, v: (typeof form)[K]) => {
    setSaved(false);
    setForm((f) => ({ ...f, [k]: v }));
  };

  const run = async (key: string, fn: () => Promise<void>) => {
    setBusy(key);
    setError(null);
    try {
      await fn();
    } catch (e) {
      setError(errorMessage(e));
    } finally {
      setBusy(null);
    }
  };

  const save = (e: React.FormEvent) => {
    e.preventDefault();
    const phone = onlyDigits(form.whatsapp);
    if (form.name.trim().length < 2) return setError("El nombre es muy corto.");
    if (phone && !waOk) return setError("El WhatsApp de pedidos parece incompleto. Revisa los dígitos.");
    if (!isValidSlug(form.slug))
      return setError("La dirección debe tener de 3 a 40 letras minúsculas, números o guiones.");
    if (
      form.slug !== r.slug &&
      !confirm("Cambiar la dirección rompe los QR que ya imprimiste. ¿Seguro?")
    )
      return;

    const cleanLinks: { kind: LinkKind; url: string }[] = [];
    for (const kind of LINK_KINDS) {
      if (!links[kind].trim()) continue;
      const url = normalizeHttpsUrl(links[kind]);
      if (!url) return setError(`El enlace de ${LINK_LABEL[kind]} no es válido (debe ser https).`);
      cleanLinks.push({ kind, url });
    }

    void run("save", async () => {
      const { error } = await supabase
        .from("restaurants")
        .update({
          name: form.name.trim(),
          tagline: form.tagline.trim() || null,
          description: form.description.trim() || null,
          whatsapp: phone || null,
          address: form.address.trim() || null,
          hours: form.hours.trim() || null,
          brand_color: form.brand_color,
          theme: form.theme,
          font_style: form.font_style,
          currency: form.currency,
          slug: form.slug,
          is_published: form.is_published,
        })
        .eq("id", r.id);
      if (error) {
        if (error.code === "23505") throw new Error("Esa dirección ya está en uso.");
        throw error;
      }

      // Enlaces: se borran los vacíos y se guardan (insertan o actualizan) los demás.
      const empty = LINK_KINDS.filter((k) => !cleanLinks.some((l) => l.kind === k));
      if (empty.length) {
        const del = await supabase
          .from("restaurant_links")
          .delete()
          .eq("restaurant_id", r.id)
          .in("kind", empty);
        if (del.error) throw del.error;
      }
      if (cleanLinks.length) {
        const up = await supabase.from("restaurant_links").upsert(
          cleanLinks.map((l, i) => ({ restaurant_id: r.id, ...l, sort_order: i })),
          { onConflict: "restaurant_id,kind" },
        );
        if (up.error) throw up.error;
      }
      setLinks((prev) => {
        const next = { ...prev };
        for (const l of cleanLinks) next[l.kind] = l.url;
        return next;
      });
      await refresh();
      setSaved(true);
    });
  };

  /** Sube logo o portada a la carpeta del restaurante y borra el archivo anterior. */
  const uploadImage = (kind: "logo" | "cover", file: File | undefined) => {
    if (!file) return;
    void run(kind, async () => {
      const blob = kind === "logo" ? await compressLogo(file) : await compressCover(file);
      const path = `${r.id}/brand/${kind}-${crypto.randomUUID()}.webp`;
      const up = await supabase.storage
        .from(MEDIA_BUCKET)
        .upload(path, blob, { contentType: "image/webp", cacheControl: PHOTO_CACHE_SECONDS });
      if (up.error) throw up.error;
      const column = kind === "logo" ? "logo_path" : "cover_path";
      const { error } = await supabase
        .from("restaurants")
        .update({ [column]: path })
        .eq("id", r.id);
      if (error) throw error;
      const old = r[column];
      if (old) await supabase.storage.from(MEDIA_BUCKET).remove([old]);
      await refresh();
    });
  };

  const removeImage = (kind: "logo" | "cover") => {
    const column = kind === "logo" ? "logo_path" : "cover_path";
    const old = r[column];
    if (!old) return;
    void run(kind, async () => {
      const { error } = await supabase
        .from("restaurants")
        .update({ [column]: null })
        .eq("id", r.id);
      if (error) throw error;
      await supabase.storage.from(MEDIA_BUCKET).remove([old]);
      await refresh();
    });
  };

  return (
    <form onSubmit={save} className="mx-auto max-w-2xl space-y-6">
      <h1 className="font-display text-4xl uppercase">Mi página</h1>

      <section className="glass-card space-y-4 p-5">
        <h2 className="text-xs uppercase tracking-[0.2em] text-primary">Imagen</h2>
        <div className="grid gap-4 sm:grid-cols-[auto_1fr]">
          <ImagePicker
            label="Logo"
            path={r.logo_path}
            busy={busy === "logo"}
            square
            onPick={(f) => uploadImage("logo", f)}
            onRemove={() => removeImage("logo")}
          />
          <ImagePicker
            label="Portada"
            path={r.cover_path}
            busy={busy === "cover"}
            onPick={(f) => uploadImage("cover", f)}
            onRemove={() => removeImage("cover")}
          />
        </div>
        <p className="text-[11px] text-foreground/50">
          Sube tu logo en PNG con fondo transparente: así se ve con su propia forma, sin recuadro.
        </p>
        <div className={labelClass}>
          Color principal
          <div className="flex flex-wrap items-center gap-2 pt-1">
            {PRESETS.map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => set("brand_color", c)}
                aria-label={`Color ${c}`}
                className={`h-9 w-9 rounded-full border-2 transition ${form.brand_color.toLowerCase() === c.toLowerCase() ? "scale-110 border-foreground" : "border-transparent"}`}
                style={{ background: c }}
              />
            ))}
            <input
              type="color"
              value={form.brand_color}
              onChange={(e) => set("brand_color", e.target.value.toUpperCase())}
              aria-label="Otro color"
              className="h-9 w-12 cursor-pointer rounded-lg border border-input bg-transparent"
            />
            <button
              type="button"
              onClick={() => set("brand_color", DEFAULT_BRAND)}
              className="text-[11px] normal-case tracking-normal text-foreground/50 hover:text-primary"
            >
              Restablecer
            </button>
          </div>
        </div>

        <div className={labelClass}>
          Tema
          <div className="flex gap-2 pt-1">
            {THEMES.map((t) => (
              <button
                key={t.id}
                type="button"
                onClick={() => set("theme", t.id)}
                aria-pressed={form.theme === t.id}
                className={`flex-1 rounded-xl border px-4 py-3 text-sm normal-case tracking-normal transition ${form.theme === t.id ? "border-primary bg-primary/10 text-foreground" : "border-input text-foreground/60 hover:border-primary/50"}`}
              >
                {t.label}
              </button>
            ))}
          </div>
        </div>

        <div className={labelClass}>
          Tipografía
          {ALL_FONT_HREFS.map((href) => (
            <link key={href} rel="stylesheet" href={href} />
          ))}
          <div className="grid gap-2 pt-1 sm:grid-cols-2">
            {FONT_STYLES.map((f) => (
              <button
                key={f.id}
                type="button"
                onClick={() => set("font_style", f.id)}
                aria-pressed={form.font_style === f.id}
                className={`rounded-xl border px-4 py-3 text-left normal-case tracking-normal transition ${form.font_style === f.id ? "border-primary bg-primary/10" : "border-input hover:border-primary/50"}`}
              >
                <span
                  data-font={f.id}
                  className="font-display block text-2xl leading-tight text-foreground"
                >
                  {form.name || "Tu restaurante"}
                </span>
                <span className="text-[11px] text-foreground/50">
                  {f.label} · {f.hint}
                </span>
              </button>
            ))}
          </div>
        </div>

        <div
          data-theme={form.theme}
          data-font={form.font_style}
          style={brandStyle(form.brand_color)}
          className="rounded-2xl border border-input bg-background p-5 normal-case tracking-normal text-foreground"
        >
          <p className="text-[10px] uppercase tracking-[0.25em] text-foreground/45">Vista previa</p>
          <p className="font-display mt-1 text-4xl leading-none">{form.name || "Tu restaurante"}</p>
          <p className="mt-1 text-sm text-foreground/65">{form.tagline || "Tu frase corta aquí"}</p>
          <div className="glass-card mt-4 flex items-center justify-between p-4">
            <div>
              <p className="font-display text-xl">Plato de ejemplo</p>
              <p className="text-xs text-foreground/60">Ingredientes y detalles del plato.</p>
            </div>
            <span className="rounded-full bg-primary px-4 py-1.5 text-sm font-bold text-primary-foreground">
              RD$ 450
            </span>
          </div>
        </div>
      </section>

      <section className="glass-card space-y-4 p-5">
        <h2 className="text-xs uppercase tracking-[0.2em] text-primary">Datos del negocio</h2>
        <label className={labelClass}>
          Nombre
          <input
            className={fieldClass}
            value={form.name}
            maxLength={80}
            onChange={(e) => set("name", e.target.value)}
          />
        </label>
        <label className={labelClass}>
          Frase corta (debajo del nombre)
          <input
            className={fieldClass}
            value={form.tagline}
            maxLength={140}
            placeholder="Sabor de casa, servido al momento"
            onChange={(e) => set("tagline", e.target.value)}
          />
        </label>
        <label className={labelClass}>
          Sobre nosotros (al final del menú)
          <textarea
            className={fieldClass}
            rows={3}
            value={form.description}
            maxLength={600}
            onChange={(e) => set("description", e.target.value)}
          />
        </label>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className={labelClass}>
            WhatsApp de pedidos (opcional)
            <PhoneField
              value={form.whatsapp}
              onChange={(digits, complete) => {
                setWaOk(complete);
                if (digits !== form.whatsapp) set("whatsapp", digits);
              }}
            />
            <span className="block text-[11px] normal-case tracking-normal text-foreground/50">
              {onlyDigits(form.whatsapp)
                ? "Tus clientes arman el pedido en el menú y te llega por aquí."
                : "Sin WhatsApp, tu menú se muestra sin carrito (solo carta con precios)."}
            </span>
          </div>
          <label className={labelClass}>
            Moneda
            <select
              className={fieldClass}
              value={form.currency}
              onChange={(e) => set("currency", e.target.value as Currency)}
            >
              <option value="DOP" className="bg-background">
                Pesos (RD$)
              </option>
              <option value="USD" className="bg-background">
                Dólares (US$)
              </option>
            </select>
          </label>
          <label className={labelClass}>
            Horario
            <input
              className={fieldClass}
              value={form.hours}
              maxLength={200}
              placeholder="Lun–Sáb 12 pm – 11 pm"
              onChange={(e) => set("hours", e.target.value)}
            />
          </label>
          <label className={labelClass}>
            Dirección
            <input
              className={fieldClass}
              value={form.address}
              maxLength={200}
              onChange={(e) => set("address", e.target.value)}
            />
          </label>
        </div>
      </section>

      <section className="glass-card space-y-4 p-5">
        <h2 className="text-xs uppercase tracking-[0.2em] text-primary">Redes y delivery</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          {LINK_KINDS.map((k) => (
            <label key={k} className={labelClass}>
              {LINK_LABEL[k]}
              <input
                className={fieldClass}
                value={links[k]}
                maxLength={500}
                placeholder={PLACEHOLDER[k]}
                onChange={(e) => {
                  setSaved(false);
                  setLinks((l) => ({ ...l, [k]: e.target.value }));
                }}
              />
            </label>
          ))}
        </div>
      </section>

      <section className="glass-card space-y-4 p-5">
        <h2 className="text-xs uppercase tracking-[0.2em] text-primary">Publicación</h2>
        <label className="flex items-center gap-3 text-sm">
          <input
            type="checkbox"
            checked={form.is_published}
            onChange={(e) => set("is_published", e.target.checked)}
            className="h-5 w-5 accent-primary"
          />
          Menú publicado (visible para tus clientes)
        </label>
        <label className={labelClass}>
          Dirección del menú
          <div className="flex items-center rounded-lg border border-input bg-foreground/5 focus-within:border-primary">
            <span className="pl-3 text-sm normal-case tracking-normal text-foreground/45">/r/</span>
            <input
              className="w-full bg-transparent px-1 py-2.5 text-sm normal-case tracking-normal outline-none"
              value={form.slug}
              onChange={(e) =>
                set(
                  "slug",
                  e.target.value
                    .toLowerCase()
                    .replace(/[^a-z0-9-]/g, "")
                    .slice(0, 40),
                )
              }
            />
          </div>
          <span className="block text-[11px] normal-case tracking-normal text-foreground/50">
            {menuUrl(form.slug)} · Si la cambias, los QR impresos dejan de funcionar.
          </span>
        </label>
      </section>

      {error && <ErrorNote>{error}</ErrorNote>}
      <div className="sticky bottom-4 z-20 flex items-center gap-3">
        <button disabled={busy === "save"} className="btn-primary flex-1 shadow-lg">
          {busy === "save" && <Loader2 className="h-4 w-4 animate-spin" />}
          {saved ? "Guardado" : "Guardar cambios"}
        </button>
      </div>
    </form>
  );
}

function ImagePicker({
  label,
  path,
  busy,
  square = false,
  onPick,
  onRemove,
}: {
  label: string;
  path: string | null;
  busy: boolean;
  square?: boolean;
  onPick: (f: File | undefined) => void;
  onRemove: () => void;
}) {
  return (
    <div className="space-y-1.5">
      <p className="text-xs uppercase tracking-[0.15em] text-foreground/70">{label}</p>
      <div className="flex items-end gap-2">
        <label
          className={`relative grid cursor-pointer place-items-center overflow-hidden rounded-xl border-2 border-dashed border-primary/40 text-primary/80 hover:border-primary ${square ? "h-28 w-28" : "h-28 w-full min-w-48"}`}
        >
          {path ? (
            <img
              src={mediaUrl(path)}
              alt=""
              className={`h-full w-full ${square ? "object-contain p-1" : "object-cover"}`}
            />
          ) : (
            <span className="flex flex-col items-center gap-1 text-xs uppercase tracking-[0.15em]">
              <ImagePlus className="h-5 w-5" /> Subir
            </span>
          )}
          {busy && (
            <span className="absolute inset-0 grid place-items-center bg-background/70">
              <Loader2 className="h-5 w-5 animate-spin" />
            </span>
          )}
          <input
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => {
              onPick(e.target.files?.[0]);
              e.target.value = "";
            }}
          />
        </label>
        {path && (
          <button
            type="button"
            onClick={onRemove}
            aria-label={`Quitar ${label.toLowerCase()}`}
            className="grid h-9 w-9 shrink-0 place-items-center rounded-lg text-foreground/50 hover:text-destructive"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        )}
      </div>
    </div>
  );
}
