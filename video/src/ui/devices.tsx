import React, { type CSSProperties, type ReactNode } from "react";
import { Easing, interpolate } from "remotion";

/** Teléfono con marco (devices.tsx de la app); la pantalla es DOM de 390×844 lógicos. */
export function Phone({ width, children, style }: { width: number; children: ReactNode; style?: CSSProperties }) {
  const inner = width - 22;
  const k = inner / 390;
  return (
    <div className="phone-frame" style={{ width, ...style }}>
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

export const phoneHeight = (width: number) => 22 + ((width - 22) / 390) * 844;

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
            <rect key={i} x={i * 4.6} y={9 - i * 3} width="3.2" height={3 + i * 3} rx="1" fill={color} />
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
 * El "demo-flash" de la app (anillo de --primary que se abre y se apaga en 900 ms),
 * calculado por frame. `since` = frames desde que cambió (negativo = todavía no).
 */
export const flashShadow = (since: number | undefined): string | undefined => {
  if (since === undefined || since < 0 || since > 27) return undefined;
  const p = Easing.out(Easing.quad)(since / 27);
  return `0 0 0 ${14 * p}px color-mix(in srgb, var(--primary) ${70 * (1 - p)}%, transparent)`;
};

/**
 * Toque de un dedo: un círculo blanco plano que baja, se comprime y se suelta.
 * `since` = frames desde el toque.
 */
export const Touch: React.FC<{ x: number; y: number; since: number; size?: number }> = ({ x, y, since, size = 64 }) => {
  if (since < -8 || since > 16) return null;
  const appear = interpolate(since, [-8, 0], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const press = interpolate(since, [-2, 0, 4], [1, 0.82, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const out = interpolate(since, [8, 16], [1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const ring = interpolate(since, [0, 12], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  return (
    <div style={{ position: "absolute", left: x, top: y, width: 0, height: 0, zIndex: 60, pointerEvents: "none" }}>
      {since >= 0 ? (
        <div
          style={{
            position: "absolute",
            left: -size * (0.5 + ring * 0.4),
            top: -size * (0.5 + ring * 0.4),
            width: size * (1 + ring * 0.8),
            height: size * (1 + ring * 0.8),
            borderRadius: "50%",
            border: `3px solid rgba(255,255,255,${0.7 * (1 - ring)})`,
          }}
        />
      ) : null}
      <div
        style={{
          position: "absolute",
          left: -size / 2,
          top: -size / 2,
          width: size,
          height: size,
          borderRadius: "50%",
          background: "rgba(255,255,255,0.55)",
          border: "2px solid rgba(255,255,255,0.9)",
          boxShadow: "0 6px 18px rgba(0,0,0,0.35)",
          opacity: appear * out,
          transform: `scale(${press * (0.8 + 0.2 * appear)})`,
        }}
      />
    </div>
  );
};
