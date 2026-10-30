import React from "react";
import { AbsoluteFill, Easing, Img, interpolate, spring, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import { Link2 } from "lucide-react";
import { Captions } from "../components/Captions";
import { Title } from "../components/Title";
import { CUES, f } from "../timeline";
import { alpha, BRAND, FONT, SPRING } from "../theme";
import { ITEMS, NEW_PRICE, withChanges } from "../ui/data";
import { Phone, StatusBar, Touch } from "../ui/devices";
import { MenuScreen } from "../ui/MenuScreen";
import { Poster, POSTER } from "../ui/Poster";

const C = CUES.E3;
const PW = 420;
const PTOP = 500;
const ITEMS_NOW = withChanges(ITEMS, true, true);
const PLUS_XY = { x: 346, y: 520 };

/** Foto del sitio (pareja escaneando el QR), recortada sobre la mesa y oscurecida. */
const Backdrop: React.FC<{ blur?: number; dim?: number; zoom?: number }> = ({ blur = 0, dim = 0.62, zoom = 1 }) => (
  <AbsoluteFill style={{ overflow: "hidden", background: BRAND.carbon }}>
    <Img
      src={staticFile("brand/hero.webp")}
      style={{
        position: "absolute",
        height: "100%",
        left: "50%",
        // la mesa y el porta-QR del hero quedan al centro del cuadro
        transform: `translateX(-56%) scale(${zoom})`,
        transformOrigin: "56% 70%",
        filter: blur ? `blur(${blur}px)` : undefined,
      }}
    />
    <AbsoluteFill style={{ background: alpha(BRAND.carbon, dim) }} />
  </AbsoluteFill>
);

/** Esquinas del visor de la cámara alrededor del QR (coordenadas lógicas del teléfono). */
const Brackets: React.FC<{ x: number; y: number; size: number; lock: number }> = ({ x, y, size, lock }) => {
  const pad = interpolate(lock, [0, 1], [26, 6]);
  const col = lock > 0.5 ? BRAND.orange : "#FFFFFF";
  const L = 34;
  const s = size + pad * 2;
  const corner = (r: number) => (
    <div
      key={r}
      style={{
        position: "absolute",
        left: r === 1 || r === 2 ? s - L : 0,
        top: r >= 2 ? s - L : 0,
        width: L,
        height: L,
        borderColor: col,
        borderStyle: "solid",
        borderWidth: 0,
        borderTopWidth: r < 2 ? 5 : 0,
        borderBottomWidth: r >= 2 ? 5 : 0,
        borderLeftWidth: r === 0 || r === 3 ? 5 : 0,
        borderRightWidth: r === 1 || r === 2 ? 5 : 0,
        borderTopLeftRadius: r === 0 ? 14 : 0,
        borderTopRightRadius: r === 1 ? 14 : 0,
        borderBottomRightRadius: r === 2 ? 14 : 0,
        borderBottomLeftRadius: r === 3 ? 14 : 0,
      }}
    />
  );
  return <div style={{ position: "absolute", left: x - pad, top: y - pad, width: s, height: s }}>{[0, 1, 2, 3].map(corner)}</div>;
};

const CameraScreen: React.FC<{ lock: number; banner: number; drift: number }> = ({ lock, banner, drift }) => {
  const k = 0.25; // afiche en la pantalla
  const pw = POSTER.w * k;
  const ph = POSTER.h * k;
  const left = (390 - pw) / 2 + drift * 10;
  const top = (844 - ph) / 2 - 20 + drift * 6;
  return (
    <div style={{ position: "relative", width: 390, height: 844, overflow: "hidden", background: "#000" }}>
      <div style={{ position: "absolute", inset: -40 }}>
        <Backdrop blur={6} dim={0.35} zoom={1.6} />
      </div>
      <div style={{ position: "absolute", left, top, width: pw, height: ph, boxShadow: "0 20px 40px rgba(0,0,0,0.5)" }}>
        <div style={{ transform: `scale(${k})`, transformOrigin: "0 0" }}>
          <Poster />
        </div>
      </div>
      <Brackets x={left + POSTER.qr.x * k} y={top + POSTER.qr.y * k} size={POSTER.qr.size * k} lock={lock} />
      <div style={{ position: "absolute", inset: 0 }}>
        <StatusBar />
      </div>
      <div
        style={{
          position: "absolute",
          left: 0,
          right: 0,
          bottom: 92,
          display: "flex",
          justifyContent: "center",
          opacity: banner,
          transform: `translateY(${(1 - banner) * 16}px)`,
        }}
      >
        <span
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            background: "#FFFFFF",
            color: "#111111",
            borderRadius: 999,
            padding: "10px 18px",
            fontFamily: FONT.body,
            fontWeight: 700,
            fontSize: 15,
          }}
        >
          <Link2 style={{ width: 16, height: 16 }} /> cartaaltoque.com
        </span>
      </div>
    </div>
  );
};

export const E3Cliente: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const t = frame / fps;

  const rise = spring({ frame: frame - f(C.aim), fps, config: SPRING.soft });
  const lock = spring({ frame: frame - f(C.lock), fps, config: { damping: 14, stiffness: 300, mass: 0.5 } });
  const banner = spring({ frame: frame - f(C.lock) - 3, fps, config: SPRING.snappy });
  const open = interpolate(frame, [f(C.open), f(C.open) + 8], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: Easing.out(Easing.cubic) });
  const scroll = interpolate(t, [C.open + 0.4, C.open + 1.0], [0, 214], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: Easing.inOut(Easing.cubic) });
  const added = t >= C.tapPlus;

  const py = interpolate(rise, [0, 1], [1920, PTOP]);
  const prot = interpolate(rise, [0, 1], [-9, 0]);
  const posterO = interpolate(rise, [0.2, 0.7], [1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });

  return (
    <AbsoluteFill style={{ background: BRAND.carbon }}>
      <Backdrop />
      {/* afiche sobre la mesa */}
      <div
        style={{
          position: "absolute",
          left: 540 - (POSTER.w * 0.34) / 2,
          top: 700,
          width: POSTER.w * 0.34,
          height: POSTER.h * 0.34,
          opacity: posterO,
          boxShadow: "0 30px 60px rgba(0,0,0,0.6)",
        }}
      >
        <div style={{ transform: "scale(0.34)", transformOrigin: "0 0" }}>
          <Poster />
        </div>
      </div>
      <div style={{ position: "absolute", left: 540 - PW / 2, top: py, transform: `rotate(${prot}deg)` }}>
        <Phone width={PW}>
          <CameraScreen lock={lock} banner={banner} drift={1 - rise} />
          {open > 0 ? (
            <div style={{ position: "absolute", inset: 0, opacity: open, transform: `scale(${0.92 + 0.08 * open})`, transformOrigin: "50% 80%" }}>
              <MenuScreen
                items={ITEMS_NOW}
                scroll={scroll}
                cart={added ? { [NEW_PRICE.id]: 1 } : {}}
                flash={{ cart: added ? frame - f(C.tapPlus) : undefined }}
                press={{ id: NEW_PRICE.id, since: frame - f(C.tapPlus) }}
              />
            </div>
          ) : null}
          <Touch x={PLUS_XY.x} y={PLUS_XY.y} since={frame - f(C.tapPlus)} />
        </Phone>
      </div>

      <Title at={C.title1} until={C.title2} size={150} parts={[{ t: "Escanea", hl: true }]} />
      <Title at={C.title2} size={112} parts={[{ t: "Sin mesero. " }, { t: "Sin esperar.", hl: true }]} />
      <Captions scene="E3" />
    </AbsoluteFill>
  );
};
