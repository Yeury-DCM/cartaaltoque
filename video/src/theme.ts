import { loadFont as loadBebas } from "@remotion/google-fonts/BebasNeue";
import { loadFont as loadDMSans } from "@remotion/google-fonts/DMSans";
import { loadFont as loadCormorant } from "@remotion/google-fonts/CormorantGaramond";
import { loadFont as loadJost } from "@remotion/google-fonts/Jost";
import { loadFont as loadArchivoBlack } from "@remotion/google-fonts/ArchivoBlack";

/**
 * Tokens de marca extraídos de cartaaltoque.com (src/styles.css y lib/brand-color.ts de la app).
 * Todo color del video sale de aquí.
 */
export const BRAND = {
  carbon: "#121212", // fondo (oklch 0.18)
  card: "#1C1B1A", // superficie elevada
  white: "#FFFFFF",
  orange: "#FF7101", // acento / primario
  onOrange: "#070707", // texto sobre naranja (oklch 0.13)
  light: "#FBF9F5", // tema claro del menú (oklch 0.985)
  lightInk: "#26221F", // texto del tema claro (oklch 0.2)
  green: "#2A9D8F",
  blue: "#3A86FF",
  whatsapp: "#25D366",
} as const;

/** El "antes": papel cálido y tinta de marcador. */
export const PAPER = {
  cream: "#F6F1EA",
  sheet: "#FBF7F0",
  edge: "#E6DCCD",
  ink: "#2B2622",
  ink2: "#6E655B",
  stain: "#C9A77C",
  marker: "#C8361D",
} as const;

const hex = (h: string) => {
  const n = parseInt(h.slice(1), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
};

export const alpha = (c: string, a: number) => {
  const [r, g, b] = hex(c);
  return `rgba(${r},${g},${b},${a})`;
};

const bebas = loadBebas("normal", { weights: ["400"], subsets: ["latin", "latin-ext"] });
const dmSans = loadDMSans("normal", { weights: ["400", "500", "600", "700", "800"], subsets: ["latin", "latin-ext"] });
loadCormorant("normal", { weights: ["500", "600", "700"], subsets: ["latin", "latin-ext"] });
loadJost("normal", { weights: ["300", "400", "500"], subsets: ["latin", "latin-ext"] });
loadArchivoBlack("normal", { weights: ["400"], subsets: ["latin", "latin-ext"] });

export const FONT = {
  display: bebas.fontFamily, // titulares, mayúsculas
  body: dmSans.fontFamily, // cuerpo y subtítulos
  hand: dmSans.fontFamily,
};

/** Zonas seguras de Reels: 250 px arriba y 400 px abajo libres de texto importante. */
export const SAFE = { top: 250, bottom: 1520, left: 80, right: 1000, width: 920 } as const;

export const SPRING = {
  snappy: { damping: 15, stiffness: 190, mass: 0.6 },
  soft: { damping: 22, stiffness: 95, mass: 1 },
  pop: { damping: 12, stiffness: 220, mass: 0.55 },
} as const;
