import { useEffect, useLayoutEffect, useRef, useState, type ReactNode } from "react";

const useIsoLayoutEffect = typeof window !== "undefined" ? useLayoutEffect : useEffect;

/**
 * Escala un contenido de tamaño lógico fijo al ancho disponible. Se dibuja con DOM real
 * (no imágenes), así el texto queda nítido a cualquier tamaño.
 */
export function Fit({
  w,
  h,
  max = 1,
  children,
}: {
  w: number;
  h: number;
  max?: number;
  children: ReactNode;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [k, setK] = useState(0.6);

  useIsoLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    const ro = new ResizeObserver(() => setK(Math.min(max, el.clientWidth / w)));
    ro.observe(el);
    return () => ro.disconnect();
  }, [w, max]);

  return (
    <div ref={ref} style={{ width: "100%", height: h * k, position: "relative" }}>
      <div
        style={{
          width: w,
          height: h,
          transform: `scale(${k})`,
          transformOrigin: "0 0",
          position: "absolute",
          left: 0,
          top: 0,
        }}
      >
        {children}
      </div>
    </div>
  );
}

/** Teléfono con marco; la pantalla es DOM real de 390×844 lógicos, escalada al ancho dado. */
export function Phone({
  width,
  children,
  className = "",
}: {
  width: number;
  children: ReactNode;
  className?: string;
}) {
  const inner = width - 22;
  const k = inner / 390;
  return (
    <div className={`phone-frame ${className}`} style={{ width }}>
      <div className="phone-screen" style={{ width: inner, height: 844 * k }}>
        <div
          style={{
            width: 390,
            height: 844,
            transform: `scale(${k})`,
            transformOrigin: "0 0",
            position: "absolute",
            left: 0,
            top: 0,
          }}
        >
          {children}
        </div>
        <div
          aria-hidden
          className="phone-island"
          style={{ top: 11 * k + 4, width: 118 * k, height: 34 * k, marginLeft: -59 * k }}
        />
      </div>
    </div>
  );
}

export function StatusBar({ color = "#F5F5F5" }: { color?: string }) {
  return (
    <div
      className="flex h-[50px] shrink-0 items-center justify-between px-[30px] pt-1 text-[16px] font-semibold"
      style={{ color }}
    >
      <span>9:41</span>
      <span className="flex items-center gap-1.5">
        <svg width="18" height="12" viewBox="0 0 18 12" aria-hidden>
          {[0, 1, 2, 3].map((i) => (
            <rect
              key={i}
              x={i * 4.6}
              y={9 - i * 3}
              width="3.2"
              height={3 + i * 3}
              rx="1"
              fill={color}
            />
          ))}
        </svg>
        <span
          className="inline-flex h-[12px] w-[25px] rounded-[4px] border-[1.5px] p-[1.5px]"
          style={{ borderColor: color }}
        >
          <span className="h-full w-[78%] rounded-[2px]" style={{ background: color }} />
        </span>
      </span>
    </div>
  );
}

/**
 * Inclinación 3D suave: sigue al cursor y responde al scroll. Escribe variables CSS
 * (--rx, --ry, --sy) con interpolación para que se sienta físico. Respeta "reducir movimiento".
 */
export function useTilt(base = { rx: 6, ry: -10 }, amount = 6) {
  const ref = useRef<HTMLDivElement>(null);
  const { rx, ry } = base;

  useEffect(() => {
    const el = ref.current;
    if (!el || window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) return;
    let tx = 0;
    let ty = 0;
    let cx = 0;
    let cy = 0;
    let sp = 0;
    let raf = 0;
    const onMove = (e: PointerEvent) => {
      if (e.pointerType !== "mouse") return;
      const r = el.getBoundingClientRect();
      tx = ((e.clientX - (r.left + r.width / 2)) / r.width) * 2;
      ty = ((e.clientY - (r.top + r.height / 2)) / r.height) * 2;
    };
    const loop = () => {
      cx += (tx - cx) * 0.06;
      cy += (ty - cy) * 0.06;
      const r = el.getBoundingClientRect();
      const vh = window.innerHeight;
      const p = Math.max(-1, Math.min(1, (r.top + r.height / 2 - vh / 2) / vh));
      sp += (p - sp) * 0.1;
      el.style.setProperty("--rx", `${rx + sp * 8 - cy * amount * 0.6}deg`);
      el.style.setProperty("--ry", `${ry + cx * amount}deg`);
      el.style.setProperty("--sy", `${sp * 40}px`);
      raf = requestAnimationFrame(loop);
    };
    window.addEventListener("pointermove", onMove, { passive: true });
    raf = requestAnimationFrame(loop);
    return () => {
      window.removeEventListener("pointermove", onMove);
      cancelAnimationFrame(raf);
    };
  }, [rx, ry, amount]);

  return ref;
}
