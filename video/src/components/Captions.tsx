import React from "react";
import { interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { CAPTIONS, SceneId } from "../timeline";
import { alpha, BRAND, FONT, SAFE } from "../theme";

/**
 * Subtítulos palabra por palabra en una pastilla oscura y plana. Cada palabra se enciende
 * cuando se dice; las palabras clave (`accent`) quedan en naranja. `y` = borde inferior.
 */
export const Captions: React.FC<{ scene: SceneId; y?: number; size?: number }> = ({ scene, y = 1500, size = 56 }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const t = frame / fps;
  const p = CAPTIONS[scene].find((pg) => t >= pg.start && t < pg.end);
  if (!p) return null;
  const local = frame - Math.round(p.start * fps);
  const inS = spring({ frame: local, fps, config: { damping: 16, stiffness: 210, mass: 0.6 } });
  const out = interpolate(frame, [Math.round(p.end * fps) - 4, Math.round(p.end * fps)], [1, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  return (
    <div
      style={{
        position: "absolute",
        left: SAFE.left,
        width: SAFE.width,
        top: 0,
        height: y,
        display: "flex",
        alignItems: "flex-end",
        justifyContent: "center",
        pointerEvents: "none",
        zIndex: 80,
      }}
    >
      <div
        style={{
          opacity: inS * out,
          transform: `translateY(${(1 - inS) * 22}px) scale(${0.97 + 0.03 * inS})`,
          background: alpha(BRAND.carbon, 0.9),
          border: `1.5px solid ${alpha(BRAND.white, 0.08)}`,
          boxShadow: `0 14px 36px ${alpha("#000000", 0.3)}`,
          borderRadius: 26,
          padding: `${size * 0.3}px ${size * 0.48}px`,
          maxWidth: SAFE.width,
          textAlign: "center",
          fontFamily: FONT.body,
          fontWeight: 800,
          fontSize: size,
          lineHeight: 1.16,
          letterSpacing: "-0.012em",
          color: BRAND.white,
        }}
      >
        {p.words.map((w, i) => {
          const next = p.words[i + 1]?.t ?? p.end;
          const said = t >= w.t;
          const active = said && t < next;
          const key = p.accent.includes(w.w);
          const pop = spring({ frame: frame - Math.round(w.t * fps), fps, config: { damping: 12, stiffness: 260, mass: 0.5 } });
          return (
            <span
              key={i}
              style={{
                display: "inline-block",
                marginRight: i < p.words.length - 1 ? size * 0.24 : 0,
                opacity: said ? 1 : 0.32,
                color: said && key ? BRAND.orange : BRAND.white,
                transform: `translateY(${said ? (1 - pop) * 6 : 0}px) scale(${active ? 1 + 0.04 * pop : 1})`,
              }}
            >
              {w.w}
            </span>
          );
        })}
      </div>
    </div>
  );
};
