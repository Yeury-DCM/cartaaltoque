import { useEffect, useState } from "react";
import { ArrowUpRight, ScanLine } from "lucide-react";
import { menuPath, publicOrigin } from "@/lib/brand";

/** QR real hacia el menú demo: el visitante lo escanea y lo prueba en su propio celular. */
export function TryQr() {
  const [src, setSrc] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;
    // Se carga aparte para no sumar peso al inicio de la página.
    void import("qrcode").then(({ default: QRCode }) =>
      QRCode.toDataURL(`${publicOrigin()}${menuPath("demo")}`, {
        errorCorrectionLevel: "M",
        margin: 1,
        width: 520,
        color: { dark: "#0D0D0D", light: "#FFFFFF" },
      }).then((url) => alive && setSrc(url)),
    );
    return () => {
      alive = false;
    };
  }, []);

  return (
    <div className="grid items-center gap-10 rounded-[32px] border border-primary/20 bg-foreground/[0.03] p-8 md:grid-cols-[1fr_auto] md:p-12">
      <div>
        <span className="inline-flex items-center gap-2 text-[11px] uppercase tracking-[0.4em] text-primary">
          <ScanLine className="h-4 w-4" /> Pruébalo en tu celular
        </span>
        <h2 className="mt-3 font-display text-[clamp(44px,5.4vw,76px)] uppercase leading-[0.92]">
          Escanéalo como lo haría <span className="text-primary">tu cliente</span>
        </h2>
        <p className="mt-4 max-w-lg text-foreground/65">
          Apunta la cámara al código: se abre un menú de ejemplo. Arma un pedido y mira cómo
          llegaría a WhatsApp. Así de simple es para tus clientes, sin descargar nada.
        </p>
        <a href={menuPath("demo")} target="_blank" rel="noopener" className="btn-ghost mt-8">
          Abrir el menú de ejemplo <ArrowUpRight className="h-4 w-4" />
        </a>
      </div>
      <div className="mx-auto w-full max-w-[260px] rounded-[28px] bg-white p-4 shadow-[0_30px_80px_-20px_rgba(255,113,1,0.45)]">
        {src ? (
          <img src={src} alt="Código QR del menú de ejemplo" className="w-full" />
        ) : (
          <div className="aspect-square w-full animate-pulse rounded-xl bg-neutral-200" />
        )}
        <p className="mt-2 text-center text-[11px] font-bold uppercase tracking-[0.2em] text-neutral-500">
          Menú de ejemplo
        </p>
      </div>
    </div>
  );
}
