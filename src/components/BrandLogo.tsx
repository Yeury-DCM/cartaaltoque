import { APP_NAME } from "@/lib/brand";

/**
 * Logo oficial para fondos oscuros (el diseño de la app es oscuro). Transparente: toma el
 * fondo de donde se ponga. Para fondos claros existe /logo-claro.png.
 */
export function BrandLogo({ className = "h-10" }: { className?: string }) {
  return (
    <img
      src="/logo-oscuro.png"
      alt={APP_NAME}
      width={900}
      height={314}
      className={`w-auto select-none ${className}`}
      draggable={false}
    />
  );
}
