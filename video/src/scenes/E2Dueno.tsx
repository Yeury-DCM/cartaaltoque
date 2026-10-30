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

  // Edición del precio: tocar → "850" seleccionado → se escribe 900 → guardar.
  const typed = ["9", "90", "900"].filter((_, i) => t >= C.type + i * 0.12).pop();
  const editing = t >= C.tapPrice + 0.05 && !saved;
  const edit = editing ? { id: NEW_PRICE.id, text: typed ?? String(NEW_PRICE.from), caret: !!typed || Math.floor(frame / 8) % 2 === 0, selected: !typed } : undefined;
  const sw = interpolate(frame, [f(C.tapSwitch), f(C.tapSwitch) + 5], [1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });

  const since = (cue: number) => (t >= cue ? frame - f(cue) : undefined);
  const priceFlash = since(C.save);
  const offFlash = since(C.tapSwitch + 0.1);

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
          />
          <Touch x={PRICE_XY.x} y={PRICE_XY.y} since={frame - f(C.tapPrice)} />
          <Touch x={PRICE_XY.x} y={PRICE_XY.y} since={frame - f(C.save)} size={56} />
          <Touch x={SWITCH_XY.x} y={SWITCH_XY.y} since={frame - f(C.tapSwitch)} />
        </Phone>
      </div>
      <div style={{ position: "absolute", left: 600, top: TOP + (1 - inR) * 900 }}>
        <Phone width={PW}>
          <MenuScreen
            items={items}
            scroll={scroll}
            flash={{ [`item:${NEW_PRICE.id}`]: priceFlash, [`item:${SOLD_OUT}`]: offFlash }}
          />
        </Phone>
      </div>

      <Title at={C.title1} until={C.title2} size={128} parts={[{ t: "Cambia un " }, { t: "precio", hl: true }]} />
      <Title at={C.title2} size={96} parts={[{ t: "Listo. Ya está en " }, { t: "todas las mesas", hl: true }]} />
      <Captions scene="E2" />
    </AbsoluteFill>
  );
};
