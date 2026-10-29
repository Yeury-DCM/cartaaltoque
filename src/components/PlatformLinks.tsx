import { Facebook, Globe, Instagram, MapPin, Music2 } from "lucide-react";
import type { LinkKind, RestaurantLink } from "@/lib/tenant";
import { WhatsAppIcon } from "./icons/WhatsAppIcon";

/** Apps de delivery: van con su logo original sobre una cápsula blanca. */
const APPS: Partial<Record<LinkKind, { name: string; logo: string; w: number; h: number }>> = {
  pedidosya: { name: "PedidosYa", logo: "/brands/pedidosya.svg", w: 153, h: 35 },
  ubereats: { name: "Uber Eats", logo: "/brands/ubereats.svg", w: 134, h: 24 },
};

/** Redes y otros enlaces: icono redondo. */
const SOCIAL: Partial<Record<LinkKind, { name: string; Icon: typeof Globe }>> = {
  instagram: { name: "Instagram", Icon: Instagram },
  facebook: { name: "Facebook", Icon: Facebook },
  tiktok: { name: "TikTok", Icon: Music2 },
  website: { name: "Sitio web", Icon: Globe },
  maps: { name: "Cómo llegar", Icon: MapPin },
};

export const LINK_LABEL: Record<LinkKind, string> = {
  pedidosya: "PedidosYa",
  ubereats: "Uber Eats",
  instagram: "Instagram",
  facebook: "Facebook",
  tiktok: "TikTok",
  website: "Sitio web",
  maps: "Google Maps",
};

/** Solo se pintan enlaces https (la base de datos ya lo exige; aquí se revisa otra vez). */
const safe = (l: RestaurantLink) => l.url.startsWith("https://");

/**
 * Fila de canales del restaurante: WhatsApp primero, luego las apps de delivery
 * y al final redes sociales.
 */
export function PlatformLinks({
  links,
  whatsappLink,
  className = "",
}: {
  links: RestaurantLink[];
  whatsappLink?: string;
  className?: string;
}) {
  const apps = links.filter((l) => APPS[l.kind] && safe(l));
  const social = links.filter((l) => SOCIAL[l.kind] && safe(l));
  if (!apps.length && !social.length && !whatsappLink) return null;

  return (
    <ul className={`flex flex-wrap items-center justify-center gap-3 ${className}`}>
      {whatsappLink && (
        <li>
          <a
            href={whatsappLink}
            target="_blank"
            rel="noopener noreferrer"
            className="flex h-11 items-center gap-2 rounded-xl bg-primary px-4 text-sm font-bold text-primary-foreground transition duration-300 hover:-translate-y-0.5 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
          >
            <WhatsAppIcon className="h-5 w-5" />
            WhatsApp
          </a>
        </li>
      )}
      {apps.map((l) => {
        const a = APPS[l.kind]!;
        return (
          <li key={l.kind}>
            <a
              href={l.url}
              target="_blank"
              rel="noopener noreferrer nofollow"
              aria-label={`Pedir en ${a.name}`}
              className="flex h-11 items-center rounded-xl bg-white px-4 transition duration-300 hover:-translate-y-0.5 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
            >
              <img
                src={a.logo}
                alt={a.name}
                width={a.w}
                height={a.h}
                loading="lazy"
                className="h-5 w-auto"
              />
            </a>
          </li>
        );
      })}
      {social.map((l) => {
        const { name, Icon } = SOCIAL[l.kind]!;
        return (
          <li key={l.kind}>
            <a
              href={l.url}
              target="_blank"
              rel="noopener noreferrer nofollow"
              aria-label={name}
              title={name}
              className="grid h-11 w-11 place-items-center rounded-xl border border-primary/30 bg-foreground/5 text-foreground/85 transition duration-300 hover:-translate-y-0.5 hover:border-primary hover:text-primary"
            >
              <Icon className="h-5 w-5" />
            </a>
          </li>
        );
      })}
    </ul>
  );
}
