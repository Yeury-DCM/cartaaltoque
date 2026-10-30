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

export type MenuTheme = "dark" | "light";
export type FontStyle = "classic" | "elegant" | "modern" | "bold";

export const THEMES: { id: MenuTheme; label: string }[] = [
  { id: "dark", label: "Oscuro" },
  { id: "light", label: "Claro" },
];

/** Estilos de letra del menú. "classic" es la que ya carga toda la app. */
export const FONT_STYLES: { id: FontStyle; label: string; hint: string }[] = [
  { id: "classic", label: "Clásica", hint: "Condensada y directa" },
  { id: "elegant", label: "Elegante", hint: "Serif fina, de carta fina" },
  { id: "modern", label: "Moderna", hint: "Ligera y espaciada" },
  { id: "bold", label: "Atrevida", hint: "Gruesa y con carácter" },
];

const FONT_HREF: Partial<Record<FontStyle, string>> = {
  elegant:
    "https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,500;0,600;0,700;1,500&display=swap",
  modern: "https://fonts.googleapis.com/css2?family=Jost:wght@300;400;500&display=swap",
  bold: "https://fonts.googleapis.com/css2?family=Archivo+Black&display=swap",
};

/** Hoja de estilos de Google Fonts del estilo elegido (la clásica no necesita ninguna extra). */
export const fontHref = (style: FontStyle | null | undefined) =>
  style ? FONT_HREF[style] : undefined;

/** Todas las hojas extra, para pantallas que muestran los cuatro estilos a la vez. */
export const ALL_FONT_HREFS = Object.values(FONT_HREF) as string[];

export const asTheme = (v: unknown): MenuTheme => (v === "light" ? "light" : "dark");
export const asFontStyle = (v: unknown): FontStyle =>
  v === "elegant" || v === "modern" || v === "bold" ? v : "classic";
