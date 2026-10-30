import { WhatsAppIcon } from "@/components/icons/WhatsAppIcon";
import { DemoPhone } from "./DemoPhone";
import { DemoProvider } from "./demo-store";
import { Phone } from "./devices";

/**
 * El producto en el hero: el menú del cliente (usable de verdad) y, flotando al lado,
 * el pedido tal como le llega al negocio por WhatsApp.
 */
export function HeroPhone() {
  return (
    <DemoProvider>
      <div className="relative mx-auto w-[286px] sm:w-[320px]">
        <Phone width={320} className="hero-phone">
          <DemoPhone />
        </Phone>

        <div className="fade-up-in delay-500 absolute -left-4 bottom-14 hidden w-[236px] rounded-2xl border border-white/10 bg-[#171717] p-3.5 shadow-[0_24px_60px_-20px_rgba(0,0,0,0.9)] sm:block md:-left-24">
          <div className="flex items-center gap-2 border-b border-white/10 pb-2.5">
            <span className="grid h-6 w-6 place-items-center rounded-full bg-whatsapp text-black">
              <WhatsAppIcon className="h-3.5 w-3.5" />
            </span>
            <span className="text-[12px] font-bold">Nuevo pedido · #18</span>
          </div>
          <ul className="space-y-1 py-2.5 text-[12px] text-foreground/75">
            <li className="flex justify-between">
              <span>2× Pepperoni</span>
              <span>RD$ 1,100</span>
            </li>
            <li className="flex justify-between">
              <span>1× Limonada frozen</span>
              <span>RD$ 150</span>
            </li>
            <li className="text-foreground/50">Delivery · Zona 1</li>
          </ul>
          <div className="flex justify-between border-t border-white/10 pt-2.5 text-[13px] font-bold">
            <span>Total</span>
            <span className="text-primary">RD$ 1,350</span>
          </div>
        </div>
      </div>
    </DemoProvider>
  );
}
