import { brandStyle } from "@/lib/brand-color";
import { DemoPanel, DemoPanelCompact } from "./DemoPanel";
import { DemoPhone } from "./DemoPhone";
import { DemoProvider, useDemo } from "./demo-store";
import { Fit, Phone, useTilt } from "./devices";

/**
 * Carta al Toque en vivo: el panel del dueño (escritorio) y el menú del cliente (celular)
 * conectados. Lo que se toca en uno se ve al instante en el otro.
 */
export function LiveDemo() {
  return (
    <DemoProvider>
      <Stage />
    </DemoProvider>
  );
}

function Stage() {
  const { state } = useDemo();
  const tilt = useTilt({ rx: 7, ry: -9 }, 6);

  return (
    <div style={brandStyle(state.color)}>
      <p className="mx-auto mb-10 max-w-2xl text-center text-[15px] leading-relaxed text-foreground/65">
        Esto es Carta al Toque en vivo. Toca <b className="text-primary">+</b> en el celular y envía
        el pedido, o apaga un plato y cambia el color en el panel.
      </p>

      {/* Escritorio: ventana del panel con el celular al frente, con inclinación 3D. */}
      <div ref={tilt} className="dev-stage relative hidden pb-16 lg:block">
        <div
          className="dev-tilt relative"
          style={{
            transform:
              "rotateX(var(--rx, 7deg)) rotateY(var(--ry, -9deg)) translateY(var(--sy, 0px))",
          }}
        >
          <div className="win-frame" style={{ width: "76%" }}>
            <div className="flex h-9 items-center gap-2 border-b border-white/10 bg-[#161616] px-4">
              {["#FF5F57", "#FEBC2E", "#28C840"].map((c) => (
                <span key={c} className="h-3 w-3 rounded-full" style={{ background: c }} />
              ))}
              <span className="ml-4 rounded-md bg-white/5 px-3 py-0.5 text-[11px] text-white/45">
                cartaaltoque.com/app
              </span>
            </div>
            <Fit w={1100} h={690}>
              <DemoPanel />
            </Fit>
          </div>
          <div
            className="absolute"
            style={{ right: "-2%", top: "7%", transform: "scale(1.03)", transformOrigin: "center" }}
          >
            <Phone width={300}>
              <DemoPhone />
            </Phone>
          </div>
        </div>
      </div>

      {/* Celular: el menú arriba y el panel compacto abajo. */}
      <div className="flex flex-col items-center gap-8 lg:hidden">
        <Phone width={300}>
          <DemoPhone />
        </Phone>
        <DemoPanelCompact />
      </div>
    </div>
  );
}
