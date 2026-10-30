import TL from "./timeline.json";

export type SceneId = "E1" | "E2" | "E3" | "E4" | "E5";
export type EditId = keyof typeof TL.edits;
export const FPS = TL.fps;

export const SCENES = TL.scenes as { id: SceneId; frames: number }[];

export const SCENE_FRAMES: Record<SceneId, number> = Object.fromEntries(
  SCENES.map((s) => [s.id, s.frames]),
) as Record<SceneId, number>;

/** Montajes: el completo (18 s) y el corto sin E4. */
export const EDITS = TL.edits as Record<EditId, SceneId[]>;

export const editStart = (edit: EditId): Record<SceneId, number> => {
  const out = {} as Record<SceneId, number>;
  let acc = 0;
  for (const id of EDITS[edit]) {
    out[id] = acc;
    acc += SCENE_FRAMES[id];
  }
  return out;
};

export const editFrames = (edit: EditId) => EDITS[edit].reduce((a, id) => a + SCENE_FRAMES[id], 0);

/** Momentos clave de cada escena (segundos locales). Los leen las escenas y los efectos. */
export const CUES = TL.cues as {
  E1: Record<"title1" | "strike" | "write" | "title2" | "stack1" | "stack2" | "stack3", number>;
  E2: Record<"title1" | "tapPrice" | "type" | "save" | "tapSwitch" | "title2", number>;
  E3: Record<"title1" | "aim" | "lock" | "open" | "tapPlus" | "title2", number>;
  E4: Record<"v1" | "v2" | "v3", number>;
  E5: Record<"logo" | "tagline" | "offer" | "url" | "wa", number>;
};

/** Tramos de la voz (un solo archivo de ElevenLabs) colocados en cada escena. */
export const VOICE = TL.voice as {
  id: string;
  src: string;
  from: number;
  to: number;
  scene: SceneId;
  at: number;
}[];

/** segundos de escena → frame */
export const f = (sec: number) => Math.round(sec * FPS);

/**
 * Subtítulos: ortografía de pantalla, timing de la voz, en segundos locales de cada escena.
 * Cada página ≤ 7 palabras; `accent` = palabras clave en naranja.
 */
export type Word = { w: string; t: number };
export type CaptionPage = { start: number; end: number; words: Word[]; accent: string[] };

const page = (end: number, accent: string[], ...pairs: [string, number][]): CaptionPage => ({
  start: pairs[0][1] - 0.06,
  end,
  words: pairs.map(([w, t]) => ({ w, t })),
  accent,
});

// Tiempos de la voz real (faster-whisper + silencios y valles de energía), ya desplazados
// al "at" de cada tramo. Voz: "Tu menú, ¿cuántas veces lo imprimiste este año? Cámbialo desde
// tu celular, en segundos y ya está en todas las mesas. Y tu cliente lo abre con un QR: sin
// esperar, sin apps. Con tu logo, tus colores y tu estilo. ¡Carta al Toque, 14 días gratis!"
export const CAPTIONS: Record<SceneId, CaptionPage[]> = {
  E1: [
    page(1.25, ["menú,"], ["Tu", 0.04], ["menú,", 0.21]),
    page(2.1, ["veces"], ["¿cuántas", 1.4], ["veces", 1.66], ["lo", 1.9]),
    page(3.4, ["imprimiste"], ["imprimiste", 2.16], ["este", 2.62], ["año?", 2.84]),
  ],
  E2: [
    page(1.45, ["celular,"], ["Cámbialo", 0.05], ["desde", 0.44], ["tu", 0.66], ["celular,", 0.88]),
    page(2.5, ["segundos"], ["en", 1.56], ["segundos", 1.71]),
    page(4.6, ["mesas."], ["y", 2.57], ["ya", 2.69], ["está", 2.93], ["en", 3.19], ["todas", 3.37], ["las", 3.65], ["mesas.", 3.99]),
  ],
  E3: [
    page(1.0, ["cliente"], ["Y", 0.08], ["tu", 0.15], ["cliente", 0.25], ["lo", 0.71], ["abre", 0.83]),
    page(2.2, ["QR:"], ["con", 1.05], ["un", 1.29], ["QR:", 1.43]),
    page(4.1, ["esperar,", "apps."], ["sin", 2.31], ["esperar,", 2.51], ["sin", 3.31], ["apps.", 3.55]),
  ],
  E4: [
    page(1.0, ["logo,"], ["Con", 0.07], ["tu", 0.19], ["logo,", 0.35]),
    page(1.9, ["colores"], ["tus", 1.02], ["colores", 1.11]),
    page(2.9, ["estilo."], ["y", 1.95], ["tu", 2.09], ["estilo.", 2.23]),
  ],
  E5: [
    page(1.3, ["Toque,"], ["¡Carta", 0.05], ["al", 0.35], ["Toque,", 0.59]),
    page(3.0, ["gratis!"], ["14", 1.4], ["días", 1.81], ["gratis!", 2.17]),
  ],
};
