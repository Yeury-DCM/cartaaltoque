import { APP_NAME } from "@/lib/brand";

/**
 * Logo oficial para fondos oscuros (el diseño de la app es oscuro). Transparente: toma el
 * fondo de donde se ponga. Para fondos claros existe /logo-claro.png.
 */
export function BrandLogo({
  className = "h-10",
  variant = "oscuro",
}: {
  className?: string;
  /** "oscuro": letras blancas, para fondos oscuros. "claro": letras negras, para fondos claros. */
  variant?: "oscuro" | "claro";
}) {
  return (
    <img
      src={variant === "claro" ? "/logo-claro.png" : "/logo-oscuro.png"}
      alt={APP_NAME}
      width={900}
      height={314}
      className={`w-auto select-none ${className}`}
      draggable={false}
    />
  );
}
