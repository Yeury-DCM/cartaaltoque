import React from "react";
import { interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { BRAND, FONT, SAFE, SPRING } from "../theme";

/**
 * Texto en pantalla (Bebas, mayúsculas): cuenta lo mismo que la voz para verlo sin sonido.
 * Entra en `at`, sale en `until` (segundos locales). `top` = borde superior (≥ zona segura).
 */
export const Title: React.FC<{
  at: number;
  until?: number;
  top?: number;
  size?: number;
  color?: string;
  accent?: string;
  /** Partes del texto; las marcadas con `hl` van en el color de acento. */
  parts: { t: string; hl?: boolean }[];
  align?: "center" | "left";
}> = ({ at, until = 99, top = SAFE.top + 30, size = 120, color = BRAND.white, accent = BRAND.orange, parts, align = "center" }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const s = spring({ frame: frame - Math.round(at * fps), fps, config: SPRING.snappy });
  const out = interpolate(frame, [Math.round(until * fps) - 5, Math.round(until * fps)], [1, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  if (frame < Math.round(at * fps) || out <= 0) return null;
  return (
    <div
      style={{
        position: "absolute",
        left: SAFE.left,
        width: SAFE.width,
        top,
        textAlign: align,
        fontFamily: FONT.display,
        fontSize: size,
        lineHeight: 0.92,
        letterSpacing: "0.005em",
        textTransform: "uppercase",
        color,
        opacity: s * out,
        transform: `translateY(${(1 - s) * 40 + (1 - out) * -16}px)`,
        zIndex: 70,
      }}
    >
      {parts.map((p, i) => (
        <span key={i} style={{ color: p.hl ? accent : color }}>
          {p.t}
        </span>
      ))}
    </div>
  );
};
