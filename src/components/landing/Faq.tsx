import { Plus } from "lucide-react";
import { TRIAL_DAYS } from "@/lib/brand";

const QA = [
  {
    q: "¿Mis clientes tienen que descargar algo?",
    a: "No. Escanean el QR o abren tu enlace y el menú se ve en el navegador del celular. Tampoco tienen que crear cuenta.",
  },
  {
    q: "¿Cobran comisión por pedido?",
    a: "No. El pedido te llega directo a tu WhatsApp y lo cobras tú, como siempre. No cobramos por pedido.",
  },
  {
    q: "¿Cómo me llegan los pedidos?",
    a: "Por WhatsApp, ya armados: platos, tamaños, notas, recoger o delivery con su zona, y el total. Cada pedido llega con un número para que lo ubiques fácil.",
  },
  {
    q: "¿Y si mi negocio no usa WhatsApp?",
    a: "Puedes usar Carta al Toque solo como carta digital: tu menú con fotos y precios, tu QR y tus redes. Sin WhatsApp, el menú se muestra sin carrito. Cuando quieras recibir pedidos, agregas tu número y se activa.",
  },
  {
    q: "¿Puedo cambiar precios o marcar algo agotado?",
    a: "Sí, desde tu panel y en segundos. Tu menú se actualiza al momento, sin reimprimir nada: el QR sigue siendo el mismo.",
  },
  {
    q: "¿Funciona si ya vendo en PedidosYa o Uber Eats?",
    a: "Sí. Tu menú puede mostrar botones a tu perfil en esas apps y a tus redes, para que el cliente elija dónde pedir.",
  },
  {
    q: "¿Qué pasa cuando termina la prueba?",
    a: `Durante los ${TRIAL_DAYS} días tienes todo incluido. Si no activas tu plan, tu menú se pausa, pero tus platos, fotos y configuración se quedan guardados.`,
  },
  {
    q: "¿Necesito saber de tecnología?",
    a: "No. Si sabes usar WhatsApp, sabes usar Carta al Toque. Lo armas desde el celular en unos minutos.",
  },
];

export function Faq() {
  return (
    <div className="mt-12 divide-y divide-primary/15 border-y border-primary/15">
      {QA.map(({ q, a }) => (
        <details key={q} className="faq group">
          <summary className="flex cursor-pointer list-none items-center justify-between gap-6 py-6 text-left text-lg font-bold md:text-xl [&::-webkit-details-marker]:hidden">
            {q}
            <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full border border-primary/40 text-primary transition-transform duration-300 group-open:rotate-45">
              <Plus className="h-4 w-4" />
            </span>
          </summary>
          <p className="max-w-3xl pb-6 text-foreground/65">{a}</p>
        </details>
      ))}
    </div>
  );
}
