import React from "react";
import { AbsoluteFill, Img, spring, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import { Captions } from "../components/Captions";
import { CUES, f } from "../timeline";
import { alpha, BRAND, FONT, SPRING } from "../theme";
import { WhatsAppIcon } from "../ui/WhatsAppIcon";

const C = CUES.E5;

type Cfg = { damping: number; stiffness: number; mass: number };

const useIn = (at: number, cfg: Cfg = SPRING.snappy) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  return spring({ frame: frame - f(at), fps, config: cfg });
};

export const E5Cierre: React.FC = () => {
  const logo = useIn(C.logo, { damping: 11, stiffness: 200, mass: 0.7 });
  const tag = useIn(C.tagline);
  const offer = useIn(C.offer);
  const url = useIn(C.url, SPRING.pop);
  const wa = useIn(C.wa, SPRING.soft);
  const rise = (s: number, d = 30) => ({ opacity: s, transform: `translateY(${(1 - s) * d}px)` });

  return (
    <AbsoluteFill style={{ background: BRAND.carbon, alignItems: "center" }}>
      <Img
        src={staticFile("brand/logo-oscuro.png")}
        style={{ position: "absolute", top: 500, width: 640, opacity: Math.min(1, logo * 1.4), transform: `scale(${0.82 + 0.18 * logo})` }}
      />
      <div
        style={{
          position: "absolute",
          top: 790,
          fontFamily: FONT.display,
          fontSize: 136,
          lineHeight: 1,
          textTransform: "uppercase",
          color: BRAND.white,
          ...rise(tag),
        }}
      >
        Tu menú, <span style={{ color: BRAND.orange }}>al toque.</span>
      </div>
      <div style={{ position: "absolute", top: 950, fontFamily: FONT.body, fontWeight: 600, fontSize: 46, color: alpha(BRAND.white, 0.85), ...rise(offer, 20) }}>
        14 días gratis · Sin tarjeta
      </div>
      <div
        style={{
          position: "absolute",
          top: 1060,
          background: BRAND.orange,
          color: BRAND.onOrange,
          borderRadius: 999,
          padding: "22px 54px",
          fontFamily: FONT.body,
          fontWeight: 800,
          fontSize: 52,
          letterSpacing: "0.01em",
          opacity: url,
          transform: `scale(${0.9 + 0.1 * url})`,
        }}
      >
        cartaaltoque.com
      </div>
      <div
        style={{
          position: "absolute",
          top: 1240,
          display: "flex",
          alignItems: "center",
          gap: 12,
          border: `1.5px solid ${alpha(BRAND.white, 0.14)}`,
          borderRadius: 999,
          padding: "10px 22px",
          fontFamily: FONT.body,
          fontWeight: 500,
          fontSize: 28,
          color: alpha(BRAND.white, 0.6),
          ...rise(wa, 14),
        }}
      >
        <span style={{ color: BRAND.whatsapp, display: "flex" }}>
          <WhatsAppIcon className="h-7 w-7" />
        </span>
        + Pedidos por WhatsApp, si quieres
      </div>
      <Captions scene="E5" />
    </AbsoluteFill>
  );
};
