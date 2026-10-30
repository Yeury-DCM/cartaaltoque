import React from "react";
import { AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { Captions } from "../components/Captions";
import { Title } from "../components/Title";
import { CUES, f } from "../timeline";
import { alpha, BRAND, FONT, SPRING } from "../theme";
import { ITEMS, NEW_PRICE, SOLD_OUT, withChanges } from "../ui/data";
import { Phone, Touch } from "../ui/devices";
import { MenuScreen } from "../ui/MenuScreen";
import { PanelScreen } from "../ui/PanelScreen";

const C = CUES.E2;
const PW = 400;
const TOP = 550;

// Coordenadas lógicas (390×844) del precio de Costillas y del interruptor de Pollo en el panel.
const PRICE_XY = { x: 262, y: 418 };
const SWITCH_XY = { x: 323, y: 488 };

// "En segundos": el destello dura 14 frames (la app usa 27) y el cambio viaja al menú en 3.
const FLASH = 14;
const TRAVEL = 3;
const K = (PW - 22) / 390;
// Fila del panel → tarjeta del menú (px de la escena), para el punto que viaja.
const ROUTES = {
  price: { from: { x: 80 + PW - 6, y: TOP + 11 + 418 * K }, to: { x: 600 + 6, y: TOP + 11 + (50 + 612 - 214 + 48) * K } },
  off: { from: { x: 80 + PW - 6, y: TOP + 11 + 488 * K }, to: { x: 600 + 6, y: TOP + 11 + (50 + 718 - 214 + 48) * K } },
};

/** Punto naranja que cruza de un teléfono al otro en `TRAVEL` frames, con una estela corta. */
const Sync: React.FC<{ since: number; route: (typeof ROUTES)["price"] }> = ({ since, route }) => {
  if (since < 0 || since > TRAVEL + 6) return null;
  const p = Math.min(1, since / TRAVEL);
  const tail = Math.max(0, Math.min(1, (since - 2) / TRAVEL));
  const o = interpolate(since, [TRAVEL, TRAVEL + 6], [1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const at = (q: number) => ({ x: route.from.x + (route.to.x - route.from.x) * q, y: route.from.y + (route.to.y - route.from.y) * q });
  const a = at(tail);
  const b = at(p);
  return (
    <svg width={1080} height={1920} style={{ position: "absolute", left: 0, top: 0, zIndex: 40, opacity: o }}>
      <line x1={a.x} y1={a.y} x2={b.x} y2={b.y} stroke={BRAND.orange} strokeWidth={5} strokeLinecap="round" />
      <circle cx={b.x} cy={b.y} r={9} fill={BRAND.orange} />
    </svg>
  );
};

const Label: React.FC<{ x: number; text: string; o: number }> = ({ x, text, o }) => (
  <div
    style={{
      position: "absolute",
      left: x,
      width: PW,
      top: TOP - 62,
      textAlign: "center",
      fontFamily: FONT.body,
      fontWeight: 700,
      fontSize: 26,
      letterSpacing: "0.16em",
      textTransform: "uppercase",
      color: alpha(BRAND.white, 0.6),
      opacity: o,
    }}
  >
    {text}
  </div>
);

export const E2Dueno: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const t = frame / fps;

  const inL = spring({ frame, fps, config: SPRING.snappy });
  const inR = spring({ frame: frame - 3, fps, config: SPRING.snappy });

  const saved = t >= C.save;
  const off = t >= C.tapSwitch + 0.1;
  const items = withChanges(ITEMS, saved, off);
  const itemsR = withChanges(ITEMS, frame >= f(C.save) + TRAVEL, frame >= f(C.tapSwitch + 0.1) + TRAVEL);

  // Edición del precio: tocar → "850" seleccionado → se escribe 900 → guardar.
  const typed = ["9", "90", "900"].filter((_, i) => t >= C.type + i * 0.07).pop();
  const editing = t >= C.tapPrice + 0.05 && !saved;
  const edit = editing ? { id: NEW_PRICE.id, text: typed ?? String(NEW_PRICE.from), caret: !!typed || Math.floor(frame / 8) % 2 === 0, selected: !typed } : undefined;
  const sw = interpolate(frame, [f(C.tapSwitch), f(C.tapSwitch) + 5], [1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });

  const since = (cue: number, delay = 0) => (frame >= f(cue) + delay ? frame - f(cue) - delay : undefined);
  const priceFlash = since(C.save);
  const offFlash = since(C.tapSwitch + 0.1);
  // El menú del cliente cambia cuando llega el punto (3 frames = 0,1 s).
  const priceFlashR = since(C.save, TRAVEL);
  const offFlashR = since(C.tapSwitch + 0.1, TRAVEL);

  // El cliente baja hasta los platos fuertes mientras entran los teléfonos.
  const scroll = interpolate(t, [0.25, 0.75], [0, 214], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: (x) => 1 - (1 - x) ** 3 });

  return (
    <AbsoluteFill style={{ background: BRAND.carbon }}>
      <Label x={80} text="Tu celular" o={inL} />
      <Label x={600} text="Tus mesas" o={inR} />
      <div style={{ position: "absolute", left: 80, top: TOP + (1 - inL) * 900 }}>
        <Phone width={PW}>
          <PanelScreen
            items={items}
            edit={edit}
            switches={{ [SOLD_OUT]: sw }}
            flash={{ [NEW_PRICE.id]: priceFlash, [SOLD_OUT]: offFlash }}
            flashLen={FLASH}
          />
          <Touch x={PRICE_XY.x} y={PRICE_XY.y} since={frame - f(C.tapPrice)} />
          <Touch x={PRICE_XY.x} y={PRICE_XY.y} since={frame - f(C.save)} size={56} />
          <Touch x={SWITCH_XY.x} y={SWITCH_XY.y} since={frame - f(C.tapSwitch)} />
        </Phone>
      </div>
      <div style={{ position: "absolute", left: 600, top: TOP + (1 - inR) * 900 }}>
        <Phone width={PW}>
          <MenuScreen
            items={itemsR}
            scroll={scroll}
            flash={{ [`item:${NEW_PRICE.id}`]: priceFlashR, [`item:${SOLD_OUT}`]: offFlashR }}
            flashLen={FLASH}
          />
        </Phone>
      </div>

      <Sync since={frame - f(C.save)} route={ROUTES.price} />
      <Sync since={frame - f(C.tapSwitch + 0.1)} route={ROUTES.off} />

      <Title at={C.title1} until={C.title2} size={128} parts={[{ t: "Cambia un " }, { t: "precio", hl: true }]} />
      <Title at={C.title2} size={96} parts={[{ t: "Listo. Ya está en " }, { t: "todas las mesas", hl: true }]} />
      <Captions scene="E2" />
    </AbsoluteFill>
  );
};
