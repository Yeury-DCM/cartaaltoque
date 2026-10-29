import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import QRCode from "qrcode";
import { Check, Copy, Download, FileImage, Loader2 } from "lucide-react";
import { ErrorNote } from "@/components/Center";
import { useAdmin } from "@/lib/admin";
import { APP_NAME, menuUrl } from "@/lib/brand";
import { errorMessage, mediaUrl } from "@/lib/supabase";
import type { Restaurant } from "@/lib/tenant";

export const Route = createFileRoute("/app/qr")({ component: QrPage });

type QrColor = "black" | "brand";

/** Carga una imagen de Storage permitiendo dibujarla en un canvas (CORS). */
function loadImage(src: string): Promise<HTMLImageElement | null> {
  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => resolve(img);
    img.onerror = () => resolve(null);
    img.src = src;
  });
}

function roundRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number,
) {
  ctx.beginPath();
  ctx.roundRect(x, y, w, h, r);
  ctx.fill();
}

/** Dibuja la imagen centrada dentro de un cuadro, sin deformarla. */
function drawContain(
  ctx: CanvasRenderingContext2D,
  img: HTMLImageElement,
  x: number,
  y: number,
  size: number,
) {
  const scale = Math.min(size / img.width, size / img.height);
  const w = img.width * scale;
  const h = img.height * scale;
  ctx.drawImage(img, x + (size - w) / 2, y + (size - h) / 2, w, h);
}

/** QR de alta corrección (H): aguanta el logo en el centro y que se ensucie impreso. */
async function renderQr(url: string, dark: string, logo: HTMLImageElement | null) {
  const canvas = document.createElement("canvas");
  await QRCode.toCanvas(canvas, url, {
    errorCorrectionLevel: "H",
    margin: 2,
    width: 1024,
    color: { dark, light: "#FFFFFF" },
  });
  if (logo) {
    const ctx = canvas.getContext("2d")!;
    const box = canvas.width * 0.24;
    const x = (canvas.width - box) / 2;
    ctx.fillStyle = "#FFFFFF";
    roundRect(ctx, x, x, box, box, box * 0.18);
    drawContain(ctx, logo, x + box * 0.1, x + box * 0.1, box * 0.8);
  }
  return canvas;
}

/** Afiche A5 vertical (1240×1748 px ≈ 150 ppp) para imprimir y poner en mesas o vitrina. */
async function renderPoster(r: Restaurant, qr: HTMLCanvasElement, logo: HTMLImageElement | null) {
  await Promise.all([
    document.fonts.load('140px "Bebas Neue"'),
    document.fonts.load('700 40px "DM Sans"'),
  ]).catch(() => undefined);

  const W = 1240;
  const H = 1748;
  const canvas = document.createElement("canvas");
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext("2d")!;
  ctx.fillStyle = "#FFFFFF";
  ctx.fillRect(0, 0, W, H);

  // Franja superior con el color del restaurante.
  ctx.fillStyle = r.brand_color;
  ctx.fillRect(0, 0, W, 90);

  // El logo va libre, con su forma (sin recuadro). Sin logo, el nombre sube.
  let y = 190;
  if (logo) {
    const box = { w: 420, h: 260 };
    const scale = Math.min(box.w / logo.width, box.h / logo.height);
    const w = logo.width * scale;
    const h = logo.height * scale;
    ctx.drawImage(logo, (W - w) / 2, y, w, h);
    y += h + 40;
  }

  ctx.textAlign = "center";
  ctx.textBaseline = "alphabetic";
  ctx.fillStyle = "#111111";
  let size = 132;
  ctx.font = `${size}px "Bebas Neue", sans-serif`;
  while (ctx.measureText(r.name.toUpperCase()).width > W - 160 && size > 60) {
    size -= 6;
    ctx.font = `${size}px "Bebas Neue", sans-serif`;
  }
  y += size * 0.85;
  ctx.fillText(r.name.toUpperCase(), W / 2, y);

  ctx.font = '700 44px "DM Sans", sans-serif';
  ctx.fillStyle = "#444444";
  y += 80;
  ctx.fillText("Escanea para ver el menú", W / 2, y);

  // El QR ocupa el espacio que queda, hasta 820 px.
  const qrY = y + 40;
  const qrSize = Math.min(820, H - qrY - 190);
  const qrX = (W - qrSize) / 2;
  ctx.drawImage(qr, qrX, qrY, qrSize, qrSize);

  ctx.font = '700 40px "DM Sans", sans-serif';
  ctx.fillStyle = r.brand_color;
  ctx.fillText("y haz tu pedido por WhatsApp", W / 2, qrY + qrSize + 70);

  ctx.font = '26px "DM Sans", sans-serif';
  ctx.fillStyle = "#999999";
  ctx.fillText(`Menú hecho con ${APP_NAME}`, W / 2, H - 40);
  return canvas;
}

function download(href: string, filename: string) {
  const a = document.createElement("a");
  a.href = href;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
}

function QrPage() {
  const { restaurant: r } = useAdmin();
  const url = menuUrl(r.slug);
  const [color, setColor] = useState<QrColor>("black");
  const [withLogo, setWithLogo] = useState(true);
  const [qrPng, setQrPng] = useState<string | null>(null);
  const [posterPng, setPosterPng] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    let alive = true;
    setPosterPng(null);
    (async () => {
      try {
        const logo = r.logo_path ? await loadImage(mediaUrl(r.logo_path)) : null;
        const dark = color === "brand" ? r.brand_color : "#111111";
        const qr = await renderQr(url, dark, withLogo ? logo : null);
        const poster = await renderPoster(r, qr, logo);
        if (!alive) return;
        setQrPng(qr.toDataURL("image/png"));
        setPosterPng(poster.toDataURL("image/png"));
      } catch (e) {
        if (alive) setError(errorMessage(e));
      }
    })();
    return () => {
      alive = false;
    };
  }, [r, url, color, withLogo]);

  const downloadSvg = async () => {
    const dark = color === "brand" ? r.brand_color : "#111111";
    const svg = await QRCode.toString(url, {
      type: "svg",
      errorCorrectionLevel: "H",
      margin: 2,
      color: { dark, light: "#FFFFFF" },
    });
    const blobUrl = URL.createObjectURL(new Blob([svg], { type: "image/svg+xml" }));
    download(blobUrl, `qr-${r.slug}.svg`);
    window.setTimeout(() => URL.revokeObjectURL(blobUrl), 2000);
  };

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1500);
    } catch {
      /* sin portapapeles */
    }
  };

  const toggle = (on: boolean) =>
    `h-9 rounded-full border px-4 text-xs font-bold uppercase tracking-[0.1em] transition-colors ${
      on
        ? "border-primary bg-primary text-primary-foreground"
        : "border-primary/30 bg-foreground/5 text-foreground/80 hover:border-primary"
    }`;

  return (
    <div className="space-y-6">
      <h1 className="font-display text-4xl uppercase">Código QR</h1>

      <div className="grid gap-6 md:grid-cols-[1fr_1.1fr]">
        <section className="glass-card space-y-5 p-5">
          <div className="mx-auto aspect-square w-full max-w-72 overflow-hidden rounded-2xl bg-white p-2">
            {qrPng ? (
              <img src={qrPng} alt={`Código QR de ${url}`} className="h-full w-full" />
            ) : (
              <div className="grid h-full place-items-center">
                <Loader2 className="h-6 w-6 animate-spin text-neutral-400" />
              </div>
            )}
          </div>

          <div className="flex items-center gap-2 rounded-lg border border-primary/20 bg-foreground/5 px-3 py-2 text-sm">
            <span className="min-w-0 flex-1 truncate">{url}</span>
            <button onClick={() => void copy()} aria-label="Copiar enlace" className="text-primary">
              {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
            </button>
          </div>

          <div className="space-y-2">
            <p className="text-xs uppercase tracking-[0.15em] text-foreground/60">Color del QR</p>
            <div className="flex gap-2">
              <button className={toggle(color === "black")} onClick={() => setColor("black")}>
                Negro
              </button>
              <button className={toggle(color === "brand")} onClick={() => setColor("brand")}>
                Mi color
              </button>
            </div>
            {color === "brand" && (
              <p className="text-[11px] text-foreground/50">
                Si tu color es muy claro, el QR puede costar leerlo. Pruébalo con tu celular antes
                de imprimir.
              </p>
            )}
          </div>
          {r.logo_path && (
            <label className="flex items-center gap-3 text-sm">
              <input
                type="checkbox"
                checked={withLogo}
                onChange={(e) => setWithLogo(e.target.checked)}
                className="h-5 w-5 accent-primary"
              />
              Logo en el centro del QR
            </label>
          )}

          <div className="grid gap-2 sm:grid-cols-2">
            <button
              className="btn-primary"
              disabled={!qrPng}
              onClick={() => qrPng && download(qrPng, `qr-${r.slug}.png`)}
            >
              <Download className="h-4 w-4" /> QR en PNG
            </button>
            <button className="btn-ghost" onClick={() => void downloadSvg()}>
              <Download className="h-4 w-4" /> QR en SVG
            </button>
          </div>
          <p className="text-[11px] text-foreground/50">
            El SVG (sin logo) es ideal para imprentas: se agranda sin perder calidad.
          </p>
        </section>

        <section className="glass-card space-y-4 p-5">
          <p className="text-xs uppercase tracking-[0.2em] text-primary">Afiche para imprimir</p>
          <div className="overflow-hidden rounded-xl border border-primary/15 bg-white">
            {posterPng ? (
              <img src={posterPng} alt="Afiche con el QR" className="w-full" />
            ) : (
              <div className="grid aspect-[1240/1748] place-items-center">
                <Loader2 className="h-6 w-6 animate-spin text-neutral-400" />
              </div>
            )}
          </div>
          <button
            className="btn-primary w-full"
            disabled={!posterPng}
            onClick={() => posterPng && download(posterPng, `afiche-${r.slug}.png`)}
          >
            <FileImage className="h-4 w-4" /> Descargar afiche (A5)
          </button>
        </section>
      </div>

      {error && <ErrorNote>{error}</ErrorNote>}
    </div>
  );
}
