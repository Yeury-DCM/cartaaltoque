import type { CSSProperties } from "react";

// Módulo sin dependencias (no carga Supabase): lo usan el menú, el panel y la landing.

const HEX_RE = /^#[0-9a-f]{6}$/i;
export const DEFAULT_BRAND = "#FF7101";

/** ¿Texto oscuro o claro sobre este color? Se elige el de mayor contraste (WCAG). */
function readableOn(hex: string): string {
  const [r, g, b] = [1, 3, 5].map((i) => {
    const c = parseInt(hex.slice(i, i + 2), 16) / 255;
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  });
  const lum = 0.2126 * r + 0.7152 * g + 0.0722 * b;
  // Contraste con negro: (lum + .05) / .05; con blanco: 1.05 / (lum + .05).
  return (lum + 0.05) / 0.05 >= 1.05 / (lum + 0.05) ? "oklch(0.13 0 0)" : "oklch(1 0 0)";
}

/**
 * Variables CSS con el color del restaurante. Todo el diseño (botones, bordes,
 * brillos) se deriva de --primary. El color se valida otra vez aquí aunque la
 * base de datos ya lo restringe: nunca se inyecta texto arbitrario en estilos.
 */
export function brandStyle(color: string | null | undefined): CSSProperties {
  const hex = color && HEX_RE.test(color) ? color : DEFAULT_BRAND;
  const fg = readableOn(hex);
  return {
    "--primary": hex,
    "--primary-foreground": fg,
    "--accent": hex,
    "--accent-foreground": fg,
    "--ring": `color-mix(in srgb, ${hex} 60%, transparent)`,
    "--border": `color-mix(in srgb, ${hex} 20%, transparent)`,
  } as CSSProperties;
}
