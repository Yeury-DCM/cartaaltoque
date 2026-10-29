import { CheckCheck } from "lucide-react";
import { Reveal } from "@/components/Reveal";

/** Ejemplo de un pedido típico armado por chat, mensaje a mensaje. */
const BEFORE: { me: boolean; text: string }[] = [
  { me: false, text: "Buenas, ¿qué tienen hoy?" },
  { me: true, text: "📷 Foto del menú" },
  { me: false, text: "¿Cuánto es la pepperoni grande?" },
  { me: true, text: "RD$ 990" },
  { me: false, text: "¿Y la personal?" },
  { me: true, text: "550" },
  { me: false, text: "Ok, una grande y una limonada" },
  { me: true, text: "¿Para recoger o delivery?" },
  { me: false, text: "Delivery, a Naco. ¿Cuánto sería?" },
  { me: true, text: "1,140 + 100 del delivery" },
  { me: false, text: "Dale. ¿A nombre de quién lo pongo?" },
  { me: true, text: "…" },
];

const AFTER = `Hola Pizzería Don Juan, quiero hacer este pedido (#18):

• 1x Pepperoni (Grande) — RD$ 990
• 1x Limonada frozen — RD$ 150

Delivery — Zona 1 (RD$ 100)
Barrio dentro de la zona: Piantini, Naco

Total: RD$ 1,240
Nombre: Ana`;

/** "Antes y después": un pedido por chat contra un pedido armado desde el menú. */
export function Compare() {
  return (
    <div className="mt-14 grid gap-5 lg:grid-cols-[1fr_1.1fr]">
      <Reveal className="relative flex min-h-[540px] flex-col overflow-hidden rounded-[32px] bg-[#E9E1D3] p-8 text-[#3C3528] md:p-10">
        <span className="font-mono text-[12px] uppercase tracking-[0.18em] opacity-70">
          Hoy, por chat
        </span>
        <span className="mt-4 font-display text-[clamp(96px,11vw,150px)] leading-[0.85]">12</span>
        <span className="text-lg font-bold">mensajes para un solo pedido.</span>
        <p className="mt-1 max-w-sm text-[15px] opacity-75">
          Mandar el menú, responder precios, sumar a mano y preguntar la dirección.
        </p>
        <div className="relative mt-8 flex-1 overflow-hidden">
          <div className="space-y-1.5 [mask-image:linear-gradient(to_bottom,#000_55%,transparent)]">
            {BEFORE.map((m, i) => (
              <p
                key={i}
                className={`w-fit max-w-[80%] rounded-xl px-3 py-1.5 text-[13.5px] ${
                  m.me ? "ml-auto bg-[#D3EBC6] text-[#24331C]" : "bg-white text-[#3C3528]"
                }`}
              >
                {m.text}
              </p>
            ))}
          </div>
        </div>
      </Reveal>

      <Reveal
        delay={120}
        className="relative flex min-h-[540px] flex-col overflow-hidden rounded-[32px] p-8 text-white shadow-[0_40px_90px_-20px_rgba(255,113,1,0.45)] md:p-10"
      >
        <div
          aria-hidden
          className="absolute inset-0"
          style={{
            background:
              "radial-gradient(ellipse 90% 70% at 85% 0%, #FF7101 0%, #B24A00 38%, #1A0E05 100%)",
          }}
        />
        <div className="relative flex flex-1 flex-col">
          <span className="font-mono text-[12px] uppercase tracking-[0.18em] opacity-80">
            Con Carta al Toque
          </span>
          <span className="mt-4 font-display text-[clamp(96px,11vw,150px)] leading-[0.85]">1</span>
          <span className="text-lg font-bold">mensaje, completo y numerado.</span>
          <p className="mt-1 max-w-sm text-[15px] opacity-85">
            Tu cliente elige en el menú y te llega todo listo: platos, tamaños, entrega y total.
          </p>
          <div className="mt-8 flex flex-1 items-end">
            <div className="ml-auto w-full max-w-md rounded-2xl rounded-tr-none bg-[#005C4B] px-4 pb-2 pt-3 text-[13.5px] leading-[1.5] text-[#E9EDEF] shadow-2xl">
              <p className="whitespace-pre-wrap">{AFTER}</p>
              <p className="mt-1 flex items-center justify-end gap-1 text-[11px] text-[#8BC3B6]">
                9:41 <CheckCheck className="h-3.5 w-3.5 text-[#53BDEB]" />
              </p>
            </div>
          </div>
        </div>
      </Reveal>
    </div>
  );
}
