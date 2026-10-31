import React from "react";
import { AbsoluteFill, Easing, interpolate, random, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { evolvePath } from "@remotion/paths";
import { Captions } from "../components/Captions";
import { Title } from "../components/Title";
import { CUES, f } from "../timeline";
import { alpha, FONT, PAPER, SPRING } from "../theme";
import { ITEMS, CATEGORIES, money } from "../ui/data";

const C = CUES.E1;
export const W = 640;
export const H = 880;

// Posiciones del menú impreso (px de la hoja).
const ROWS: { kind: "cat" | "item"; text: string; price?: number; id?: string; y: number }[] = (() => {
  const out: { kind: "cat" | "item"; text: string; price?: number; id?: string; y: number }[] = [];
  let y = 232;
  for (const c of CATEGORIES) {
    out.push({ kind: "cat", text: c.name, y });
    y += 50;
    for (const i of ITEMS.filter((x) => x.cat === c.id)) {
      out.push({ kind: "item", text: i.name, price: i.price, id: i.id, y });
      y += 48;
    }
    y += 18;
  }
  return out;
})();
const ROW_COSTILLAS = ROWS.find((r) => r.id === "costillas")!.y;

// Tachón del precio y "900" a mano (trazos de un solo golpe, en px de la hoja).
const STRIKE = `M 462 ${ROW_COSTILLAS + 20} C 500 ${ROW_COSTILLAS + 13}, 548 ${ROW_COSTILLAS + 22}, 600 ${ROW_COSTILLAS + 10}`;
const DIGITS = [
  "M 40 22 C 37 6, 10 6, 9 24 C 8 42, 34 44, 40 25 C 43 46, 41 64, 29 80",
  "M 30 9 C 10 8, 6 40, 10 60 C 14 82, 44 80, 47 55 C 51 30, 46 6, 27 11",
  "M 30 9 C 10 8, 6 40, 10 60 C 14 82, 44 80, 47 55 C 51 30, 46 6, 27 11",
];

/** Menú impreso, gastado: mancha de café, pliegue y esquina doblada. */
export const PrintedMenu: React.FC<{ strike: number; write: number; seed?: string }> = ({ strike, write, seed = "m" }) => {
  const sk = evolvePath(strike, STRIKE);
  return (
    <div
      style={{
        position: "absolute",
        width: W,
        height: H,
        background: PAPER.sheet,
        clipPath: "polygon(0 0, calc(100% - 64px) 0, 100% 64px, 100% 100%, 0 100%)",
        fontFamily: FONT.body,
        color: PAPER.ink,
      }}
    >
      {/* pliegue horizontal */}
      <div style={{ position: "absolute", left: 0, right: 0, top: H * 0.47, height: 2, background: alpha(PAPER.ink, 0.07) }} />
      <div style={{ position: "absolute", left: 0, right: 0, top: H * 0.47 + 2, height: 2, background: alpha("#FFFFFF", 0.7) }} />
      {/* mancha de café */}
      <div
        style={{
          position: "absolute",
          left: 420 + random(`${seed}cx`) * 40,
          top: 700 + random(`${seed}cy`) * 30,
          width: 150,
          height: 146,
          borderRadius: "50%",
          border: `7px solid ${alpha(PAPER.stain, 0.32)}`,
          background: alpha(PAPER.stain, 0.07),
        }}
      />
      <div style={{ position: "absolute", top: 56, width: "100%", textAlign: "center", fontFamily: FONT.display, fontSize: 84, letterSpacing: "0.05em", lineHeight: 1 }}>
        La Terraza
      </div>
      <div style={{ position: "absolute", top: 148, width: "100%", textAlign: "center", fontSize: 22, fontStyle: "italic", color: PAPER.ink2 }}>
        Parrilla criolla y platos para compartir
      </div>
      <div style={{ position: "absolute", left: 56, right: 56, top: 200, height: 6, borderTop: `2px solid ${PAPER.ink}`, borderBottom: `1px solid ${PAPER.ink}` }} />
      {ROWS.map((r, i) =>
        r.kind === "cat" ? (
          <div key={i} style={{ position: "absolute", left: 56, top: r.y, fontFamily: FONT.display, fontSize: 36, letterSpacing: "0.08em", color: PAPER.ink2 }}>
            {r.text}
          </div>
        ) : (
          <div key={i} style={{ position: "absolute", left: 56, right: 56, top: r.y, height: 40, display: "flex", alignItems: "baseline", fontSize: 26 }}>
            <span style={{ fontWeight: 600 }}>{r.text}</span>
            <span style={{ flex: 1, margin: "0 10px", borderBottom: `2px dotted ${alpha(PAPER.ink, 0.35)}`, transform: "translateY(-6px)" }} />
            <span style={{ fontWeight: 700 }}>{money(r.price!)}</span>
          </div>
        ),
      )}
      <div style={{ position: "absolute", left: 56, top: 808, fontSize: 18, fontStyle: "italic", color: PAPER.ink2 }}>Precios sujetos a cambio.</div>
      {/* esquina doblada */}
      <div
        style={{
          position: "absolute",
          right: 0,
          top: 0,
          width: 64,
          height: 64,
          background: PAPER.edge,
          clipPath: "polygon(0 0, 100% 100%, 0 100%)",
        }}
      />
      <svg width={W} height={H} style={{ position: "absolute", left: 0, top: 0, overflow: "visible" }}>
        <path
          d={STRIKE}
          fill="none"
          stroke={PAPER.marker}
          strokeWidth={8}
          strokeLinecap="round"
          strokeDasharray={sk.strokeDasharray}
          strokeDashoffset={sk.strokeDashoffset}
          opacity={strike > 0 ? 0.92 : 0}
        />
        <g transform={`translate(318 ${ROW_COSTILLAS - 30}) rotate(-6) scale(0.78)`}>
          {DIGITS.map((d, i) => {
            const p = Math.min(1, Math.max(0, write * 3 - i));
            const ev = evolvePath(p, d);
            return (
              <path
                key={i}
                d={d}
                transform={`translate(${i * 54} 0)`}
                fill="none"
                stroke={PAPER.marker}
                strokeWidth={9}
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeDasharray={ev.strokeDasharray}
                strokeDashoffset={ev.strokeDashoffset}
                opacity={p > 0 ? 0.95 : 0}
              />
            );
          })}
        </g>
      </svg>
    </div>
  );
};

// La pila: 12 menús en total (el principal + 11 que caen en tres tandas: ×3, ×7, ×12).
const COUNTS = [
  { at: C.stack1, n: 3 },
  { at: C.stack2, n: 7 },
  { at: C.stack3, n: 12 },
];
const dropAt = (i: number) => {
  // i = 1..11
  const g = i < 3 ? 0 : i < 7 ? 1 : 2;
  const first = g === 0 ? 1 : g === 1 ? 3 : 7;
  return COUNTS[g].at - 0.12 + (i - first) * 0.05;
};

export const E1Gancho: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const t = frame / fps;

  const strike = interpolate(t, [C.strike, C.strike + 0.28], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: Easing.inOut(Easing.quad) });
  const write = interpolate(t, [C.write, C.write + 0.42], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });

  // Cámara: empieza cerca del precio, se aleja para mostrar la pila.
  const pull = spring({ frame: frame - f(C.stack1 - 0.3), fps, config: SPRING.soft });
  const scale = interpolate(pull, [0, 1], [1.16, 0.68]) + interpolate(t, [0, C.stack1], [0, 0.03]);
  const cy = interpolate(pull, [0, 1], [1010, 1100]);
  const rot = interpolate(pull, [0, 1], [-3, -1.5]);

  const count = [...COUNTS].reverse().find((c) => t >= c.at);
  const cSince = count ? frame - f(count.at) : -1;
  const cPop = spring({ frame: cSince, fps, config: { damping: 10, stiffness: 260, mass: 0.6 } });

  return (
    <AbsoluteFill style={{ background: PAPER.cream, overflow: "hidden" }}>
      <div style={{ position: "absolute", left: 540, top: cy, width: 0, height: 0, transform: `scale(${scale})` }}>
        <div style={{ position: "absolute", left: -W / 2, top: -H / 2, width: W, height: H, transform: `rotate(${rot}deg)`, boxShadow: `0 30px 60px ${alpha(PAPER.ink, 0.18)}` }}>
          <PrintedMenu strike={strike} write={write} />
        </div>
        {new Array(11).fill(0).map((_, k) => {
          const i = k + 1;
          const s = spring({ frame: frame - f(dropAt(i)), fps, config: { damping: 18, stiffness: 240, mass: 0.7 } });
          if (frame < f(dropAt(i))) return null;
          const fx = (random(`px${i}`) - 0.5) * 70;
          const fr = (random(`pr${i}`) - 0.5) * 14;
          const y = interpolate(s, [0, 1], [-1500, -i * 7]);
          return (
            <div
              key={i}
              style={{
                position: "absolute",
                left: -W / 2 + fx,
                top: -H / 2 + y,
                width: W,
                height: H,
                transform: `rotate(${interpolate(s, [0, 1], [fr * 3, fr])}deg)`,
                boxShadow: `0 ${10 + i}px 30px ${alpha(PAPER.ink, 0.16)}`,
              }}
            >
              <PrintedMenu strike={1} write={1} seed={`s${i}`} />
            </div>
          );
        })}
      </div>

      {count ? (
        <div
          style={{
            position: "absolute",
            left: 650,
            top: 545,
            fontFamily: FONT.display,
            fontSize: 230,
            lineHeight: 1,
            color: PAPER.marker,
            transform: `rotate(-8deg) scale(${0.6 + 0.4 * cPop})`,
            transformOrigin: "30% 60%",
            zIndex: 60,
          }}
        >
          ×{count.n}
        </div>
      ) : null}

      <Title at={C.title1} until={C.title2} color={PAPER.ink} size={150} parts={[{ t: "Tu menú…" }]} />
      <Title
        at={C.title2}
        color={PAPER.ink}
        accent={PAPER.marker}
        size={118}
        parts={[{ t: "¿Cuántas veces lo " }, { t: "imprimiste", hl: true }, { t: "?" }]}
      />
      <Captions scene="E1" />
    </AbsoluteFill>
  );
};
