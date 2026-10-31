import React, { type ReactNode } from "react";
import { AbsoluteFill, Img, staticFile } from "remotion";
import { ArrowRight } from "lucide-react";
import { alpha, BRAND, FONT, PAPER } from "../theme";
import { H as SHEET_H, PrintedMenu, W as SHEET_W } from "../scenes/E1Gancho";
import { LogoBadge, LogoBlock, LogoSerif } from "../scenes/E4Marca";
import { ITEMS, NEW_PRICE, SOLD_OUT, withChanges } from "../ui/data";
import { Phone } from "../ui/devices";
import { MenuScreen } from "../ui/MenuScreen";
import { PanelScreen } from "../ui/PanelScreen";
import { Poster, POSTER } from "../ui/Poster";

/** Piezas fijas para el feed de Instagram (1080×1350), con el mismo sistema visual del video. */
export const FEED = { width: 1080, height: 1350 } as const;
const PAD = 84;
const ITEMS_NOW = withChanges(ITEMS, true, true);

const Kicker: React.FC<{ children: ReactNode; color?: string }> = ({ children, color = BRAND.orange }) => (
  <div style={{ fontFamily: FONT.body, fontWeight: 700, fontSize: 26, letterSpacing: "0.22em", textTransform: "uppercase", color }}>
    {children}
  </div>
);

const Headline: React.FC<{ children: ReactNode; size?: number; color?: string }> = ({ children, size = 128, color = BRAND.white }) => (
  <div style={{ fontFamily: FONT.display, fontSize: size, lineHeight: 0.9, letterSpacing: "0.005em", textTransform: "uppercase", color }}>
    {children}
  </div>
);

const Hl: React.FC<{ children: ReactNode; color?: string }> = ({ children, color = BRAND.orange }) => <span style={{ color }}>{children}</span>;

const Sub: React.FC<{ children: ReactNode; color?: string }> = ({ children, color = alpha(BRAND.white, 0.72) }) => (
  <div style={{ fontFamily: FONT.body, fontWeight: 500, fontSize: 34, lineHeight: 1.35, color, maxWidth: 820 }}>{children}</div>
);

/** Indicador del carrusel ("2 / 5"). */
const Page: React.FC<{ n: number; total: number; light?: boolean }> = ({ n, total, light }) => (
  <div
    style={{
      position: "absolute",
      top: 64,
      right: PAD,
      fontFamily: FONT.body,
      fontWeight: 700,
      fontSize: 22,
      letterSpacing: "0.12em",
      color: light ? alpha(PAPER.ink, 0.55) : alpha(BRAND.white, 0.5),
      border: `1.5px solid ${light ? alpha(PAPER.ink, 0.18) : alpha(BRAND.white, 0.16)}`,
      borderRadius: 999,
      padding: "8px 18px",
    }}
  >
    {n} / {total}
  </div>
);

const Dark: React.FC<{ children: ReactNode }> = ({ children }) => (
  <AbsoluteFill style={{ background: BRAND.carbon, overflow: "hidden" }}>{children}</AbsoluteFill>
);

// ─────────────────────────────── Carrusel 1: antes / ahora ───────────────────────────────

const C1_TOTAL = 5;

export const C1S1: React.FC = () => (
  <AbsoluteFill style={{ background: PAPER.cream, overflow: "hidden" }}>
    <Page n={1} total={C1_TOTAL} light />
    <div style={{ position: "absolute", left: PAD, top: 150, right: PAD }}>
      <Headline size={142} color={PAPER.ink}>
        ¿Cuántas veces <Hl color={PAPER.marker}>imprimiste</Hl> tu menú este año?
      </Headline>
    </div>
    {/* pila de menús tachados */}
    <div style={{ position: "absolute", left: 540, top: 930, width: 0, height: 0, transform: "scale(0.66)" }}>
      {[5, 4, 3, 2, 1, 0].map((i) => (
        <div
          key={i}
          style={{
            position: "absolute",
            left: -SHEET_W / 2 + (i % 2 ? 18 : -14) * (i > 0 ? 1 : 0),
            top: -SHEET_H / 2 - i * 9,
            width: SHEET_W,
            height: SHEET_H,
            transform: `rotate(${[-2, 4, -5, 3, -3, 6][i]}deg)`,
            boxShadow: `0 ${12 + i * 2}px 34px ${alpha(PAPER.ink, 0.16)}`,
          }}
        >
          <PrintedMenu strike={1} write={1} seed={`f${i}`} />
        </div>
      ))}
    </div>
    <div
      style={{
        position: "absolute",
        left: 690,
        top: 560,
        fontFamily: FONT.display,
        fontSize: 230,
        lineHeight: 1,
        color: PAPER.marker,
        transform: "rotate(-8deg)",
      }}
    >
      ×12
    </div>
    <div
      style={{
        position: "absolute",
        right: PAD,
        bottom: 72,
        display: "flex",
        alignItems: "center",
        gap: 12,
        fontFamily: FONT.body,
        fontWeight: 700,
        fontSize: 28,
        letterSpacing: "0.12em",
        textTransform: "uppercase",
        color: PAPER.ink,
      }}
    >
      Desliza <ArrowRight style={{ width: 34, height: 34 }} />
    </div>
  </AbsoluteFill>
);

/** Teléfono grande que se sale por abajo del cuadro. */
const BigPhone: React.FC<{ children: ReactNode; top?: number; left?: number; width?: number; rotate?: number }> = ({
  children,
  top = 470,
  left,
  width = 560,
  rotate = 0,
}) => (
  <div style={{ position: "absolute", top, left: left ?? (1080 - width) / 2, transform: `rotate(${rotate}deg)`, transformOrigin: "50% 0" }}>
    <Phone width={width}>{children}</Phone>
  </div>
);

export const C1S2: React.FC = () => (
  <Dark>
    <Page n={2} total={C1_TOTAL} />
    <div style={{ position: "absolute", left: PAD, top: 120, right: PAD, display: "flex", flexDirection: "column", gap: 22 }}>
      <Kicker>Ahora</Kicker>
      <Headline size={124}>
        Cambias el <Hl>precio</Hl> desde tu celular…
      </Headline>
    </div>
    <BigPhone>
      <PanelScreen items={withChanges(ITEMS, false, false)} edit={{ id: NEW_PRICE.id, text: "900", caret: true }} />
    </BigPhone>
  </Dark>
);

export const C1S3: React.FC = () => (
  <Dark>
    <Page n={3} total={C1_TOTAL} />
    <div style={{ position: "absolute", left: PAD, top: 120, right: PAD, display: "flex", flexDirection: "column", gap: 24 }}>
      <Headline size={124}>
        …y ya está en <Hl>todas las mesas.</Hl>
      </Headline>
      <Sub>Sin reimprimir. Lo agotado sale marcado al instante.</Sub>
    </div>
    <BigPhone top={540}>
      <MenuScreen items={ITEMS_NOW} scroll={214} flash={{ [`item:${NEW_PRICE.id}`]: 7, [`item:${SOLD_OUT}`]: 9 }} />
    </BigPhone>
  </Dark>
);

export const C1S4: React.FC = () => (
  <Dark>
    <Page n={4} total={C1_TOTAL} />
    <div style={{ position: "absolute", left: PAD, top: 120, right: PAD, display: "flex", flexDirection: "column", gap: 24 }}>
      <Headline size={124}>
        Tu cliente <Hl>escanea</Hl> y lo ve todo.
      </Headline>
      <Sub>Fotos, precios y lo agotado en su celular. Sin apps, sin esperar al mesero.</Sub>
    </div>
    {/* afiche de la mesa */}
    <div
      style={{
        position: "absolute",
        left: 96,
        top: 640,
        width: POSTER.w * 0.3,
        height: POSTER.h * 0.3,
        transform: "rotate(-6deg)",
        boxShadow: "0 30px 70px rgba(0,0,0,0.55)",
      }}
    >
      <div style={{ transform: "scale(0.3)", transformOrigin: "0 0" }}>
        <Poster />
      </div>
    </div>
    <BigPhone top={560} left={470} width={520} rotate={4}>
      <MenuScreen items={ITEMS_NOW} scroll={214} open={{ id: NEW_PRICE.id, since: 40 }} />
    </BigPhone>
  </Dark>
);

export const C1S5: React.FC = () => (
  <Dark>
    <Page n={5} total={C1_TOTAL} />
    <AbsoluteFill style={{ alignItems: "center", justifyContent: "center", gap: 0, paddingBottom: 60 }}>
      <Img src={staticFile("brand/logo-oscuro.png")} style={{ width: 600, maxWidth: "none" }} />
      <div style={{ height: 64 }} />
      <Headline size={132}>
        Tu menú, <Hl>al toque.</Hl>
      </Headline>
      <div style={{ height: 28 }} />
      <Sub color={alpha(BRAND.white, 0.85)}>14 días gratis · Sin tarjeta</Sub>
      <div style={{ height: 56 }} />
      <div
        style={{
          background: BRAND.orange,
          color: BRAND.onOrange,
          borderRadius: 999,
          padding: "24px 58px",
          fontFamily: FONT.body,
          fontWeight: 800,
          fontSize: 50,
        }}
      >
        cartaaltoque.com
      </div>
      <div style={{ height: 36 }} />
      <div style={{ fontFamily: FONT.body, fontWeight: 500, fontSize: 30, color: alpha(BRAND.white, 0.6) }}>¿Dudas? Escríbenos por DM.</div>
    </AbsoluteFill>
  </Dark>
);

// ─────────────────────────────── Post 2: tu marca ───────────────────────────────

export const P2Marca: React.FC = () => (
  <Dark>
    <div style={{ position: "absolute", left: PAD, top: 110, right: PAD, display: "flex", flexDirection: "column", gap: 26 }}>
      <Headline size={120}>
        Tu <Hl color={BRAND.orange}>logo.</Hl> Tus <Hl color={BRAND.green}>colores.</Hl> Tu <Hl color={BRAND.blue}>estilo.</Hl>
      </Headline>
      <Sub>Tema claro u oscuro, cuatro estilos de letra y el color de tu marca. Tu menú se ve como tu restaurante.</Sub>
    </div>
    {/* abanico de tres variantes del mismo menú */}
    <div style={{ position: "absolute", left: 40, top: 640, transform: "rotate(-9deg)", transformOrigin: "50% 100%" }}>
      <Phone width={400}>
        <MenuScreen items={ITEMS_NOW} theme="light" font="elegant" color={BRAND.green} logo={<LogoSerif color={BRAND.green} />} />
      </Phone>
    </div>
    <div style={{ position: "absolute", left: 640, top: 640, transform: "rotate(9deg)", transformOrigin: "50% 100%" }}>
      <Phone width={400}>
        <MenuScreen items={ITEMS_NOW} theme="dark" font="bold" color={BRAND.blue} logo={<LogoBlock color={BRAND.blue} />} />
      </Phone>
    </div>
    <div style={{ position: "absolute", left: 320, top: 590 }}>
      <Phone width={440}>
        <MenuScreen items={ITEMS_NOW} theme="dark" font="classic" color={BRAND.orange} logo={<LogoBadge color={BRAND.orange} />} />
      </Phone>
    </div>
  </Dark>
);

// ─────────────────────────────── Post 3: tres pasos ───────────────────────────────

const STEPS = [
  { n: "01", t: "Sube tu menú", d: "Platos, fotos y precios, desde el celular." },
  { n: "02", t: "Pon el QR en tus mesas", d: "Te damos el afiche listo para imprimir." },
  { n: "03", t: "Cámbialo cuando quieras", d: "Precios y agotados, al instante." },
];

export const P3Pasos: React.FC = () => (
  <Dark>
    <div style={{ position: "absolute", left: PAD, top: 110, width: 560, display: "flex", flexDirection: "column", gap: 20 }}>
      <Kicker>Así de fácil</Kicker>
      <Headline size={116}>
        Tu menú digital en <Hl>3 pasos</Hl>
      </Headline>
    </div>
    <div style={{ position: "absolute", left: PAD, top: 560, width: 560, display: "flex", flexDirection: "column", gap: 46 }}>
      {STEPS.map((s) => (
        <div key={s.n} style={{ display: "flex", gap: 26, alignItems: "flex-start" }}>
          <div style={{ fontFamily: FONT.display, fontSize: 92, lineHeight: 0.85, color: BRAND.orange, width: 98, flexShrink: 0 }}>{s.n}</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 8, paddingTop: 2 }}>
            <div style={{ fontFamily: FONT.body, fontWeight: 800, fontSize: 36, color: BRAND.white, lineHeight: 1.1 }}>{s.t}</div>
            <div style={{ fontFamily: FONT.body, fontWeight: 500, fontSize: 28, color: alpha(BRAND.white, 0.62), lineHeight: 1.3 }}>{s.d}</div>
          </div>
        </div>
      ))}
    </div>
    <div style={{ position: "absolute", left: 690, top: 250 }}>
      <Phone width={480}>
        <MenuScreen items={ITEMS_NOW} />
      </Phone>
    </div>
    {/* pie: logo + oferta, en la columna izquierda para no chocar con el celular */}
    <div style={{ position: "absolute", left: PAD, bottom: 64, display: "flex", flexDirection: "column", gap: 18 }}>
      <div style={{ fontFamily: FONT.body, fontWeight: 600, fontSize: 28, color: alpha(BRAND.white, 0.7) }}>
        14 días gratis · <span style={{ color: BRAND.orange }}>cartaaltoque.com</span>
      </div>
      <Img src={staticFile("brand/logo-oscuro.png")} style={{ height: 56, width: "auto", maxWidth: "none", alignSelf: "flex-start" }} />
    </div>
  </Dark>
);

export const FLYERS: { id: string; component: React.FC }[] = [
  { id: "Feed-C1-1", component: C1S1 },
  { id: "Feed-C1-2", component: C1S2 },
  { id: "Feed-C1-3", component: C1S3 },
  { id: "Feed-C1-4", component: C1S4 },
  { id: "Feed-C1-5", component: C1S5 },
  { id: "Feed-P2-Marca", component: P2Marca },
  { id: "Feed-P3-Pasos", component: P3Pasos },
];
