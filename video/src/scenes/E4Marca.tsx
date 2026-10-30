import React from "react";
import { AbsoluteFill, Easing, interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { Captions } from "../components/Captions";
import { CUES, f } from "../timeline";
import { BRAND, FONT, SAFE, SPRING } from "../theme";
import { ITEMS, withChanges, type FontStyle, type MenuTheme } from "../ui/data";
import { Phone } from "../ui/devices";
import { MenuScreen } from "../ui/MenuScreen";

const C = CUES.E4;
const PW = 400;
const ITEMS_NOW = withChanges(ITEMS, true, true);

/** Logos de ejemplo (ficticios), uno por variante. */
const LogoBadge: React.FC<{ color: string }> = ({ color }) => (
  <svg width={64} height={64} viewBox="0 0 64 64">
    <circle cx={32} cy={32} r={29} fill="none" stroke={color} strokeWidth={3} />
    <circle cx={32} cy={32} r={23} fill="none" stroke={color} strokeWidth={1} opacity={0.6} />
    <text x={32} y={41} textAnchor="middle" fontFamily="Bebas Neue" fontSize={26} fill="currentColor" letterSpacing={1}>
      LT
    </text>
  </svg>
);

const LogoSerif: React.FC<{ color: string }> = ({ color }) => (
  <svg width={150} height={64} viewBox="0 0 150 64">
    <line x1={6} y1={32} x2={44} y2={32} stroke={color} strokeWidth={1.2} />
    <line x1={106} y1={32} x2={144} y2={32} stroke={color} strokeWidth={1.2} />
    <text x={75} y={46} textAnchor="middle" fontFamily="Cormorant Garamond" fontStyle="italic" fontWeight={600} fontSize={46} fill={color}>
      T
    </text>
    <circle cx={75} cy={32} r={27} fill="none" stroke={color} strokeWidth={1.2} />
  </svg>
);

const LogoBlock: React.FC<{ color: string }> = ({ color }) => (
  <svg width={64} height={64} viewBox="0 0 64 64">
    <rect x={4} y={4} width={56} height={56} rx={14} fill={color} />
    <text x={32} y={43} textAnchor="middle" fontFamily="Archivo Black" fontSize={26} fill="#070707">
      LT
    </text>
  </svg>
);

type Variant = { at: number; theme: MenuTheme; font: FontStyle; color: string; logo: React.ReactNode; word: string };

const VARIANTS: Variant[] = [
  { at: C.v1, theme: "dark", font: "classic", color: BRAND.orange, logo: <LogoBadge color={BRAND.orange} />, word: "Tu logo." },
  { at: C.v2, theme: "light", font: "elegant", color: BRAND.green, logo: <LogoSerif color={BRAND.green} />, word: "Tus colores." },
  { at: C.v3, theme: "dark", font: "bold", color: BRAND.blue, logo: <LogoBlock color={BRAND.blue} />, word: "Tu estilo." },
];

const WIPE = 7; // frames

export const E4Marca: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const enter = spring({ frame, fps, config: SPRING.snappy });
  const cur = VARIANTS.reduce((a, v, i) => (frame >= f(v.at) ? i : a), 0);
  const bump = (i: number) => {
    const s = frame - f(VARIANTS[i].at);
    return i === 0 ? 0 : interpolate(s, [0, 3, 10], [0, 1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  };

  return (
    <AbsoluteFill style={{ background: BRAND.carbon }}>
      {/* Titular: una frase por variante, con el color de esa marca. */}
      <div
        style={{
          position: "absolute",
          left: SAFE.left,
          width: SAFE.width,
          top: SAFE.top + 30,
          textAlign: "center",
          fontFamily: FONT.display,
          fontSize: 92,
          lineHeight: 0.98,
          textTransform: "uppercase",
          color: BRAND.white,
        }}
      >
        {VARIANTS.map((v, i) => {
          const s = spring({ frame: frame - f(v.at), fps, config: SPRING.snappy });
          if (frame < f(v.at)) return null;
          return (
            <span
              key={i}
              style={{
                display: "block",
                opacity: s,
                transform: `translateY(${(1 - s) * 30}px)`,
                color: i === cur ? v.color : BRAND.white,
              }}
            >
              {v.word}
            </span>
          );
        })}
      </div>

      <div
        style={{
          position: "absolute",
          left: 540 - PW / 2,
          top: 575 + (1 - enter) * 900,
          transform: `scale(${1 - 0.02 * bump(cur)})`,
        }}
      >
        <Phone width={PW}>
          {VARIANTS.map((v, i) => {
            const since = frame - f(v.at);
            if (since < 0 || (i < VARIANTS.length - 1 && frame >= f(VARIANTS[i + 1].at) + WIPE)) return null;
            // La variante nueva entra con una cortina de izquierda a derecha.
            const w = i === 0 ? 1 : interpolate(since, [0, WIPE], [0, 1], { extrapolateRight: "clamp", easing: Easing.inOut(Easing.cubic) });
            return (
              <div key={i} style={{ position: "absolute", inset: 0, clipPath: `inset(0 ${100 - w * 100}% 0 0)` }}>
                <MenuScreen items={ITEMS_NOW} theme={v.theme} font={v.font} color={v.color} logo={v.logo} />
              </div>
            );
          })}
        </Phone>
      </div>
      <Captions scene="E4" />
    </AbsoluteFill>
  );
};
