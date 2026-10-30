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
// al "at" de cada tramo. Voz: "Tu menú… ¿cuántas veces lo imprimiste este año? Ahora lo cambias
// en segundos desde tu celular, y tu cliente lo abre con solo escanear un QR, sin esperar.
// Carta al Toque. Pruébalo catorce días gratis."
export const CAPTIONS: Record<SceneId, CaptionPage[]> = {
  E1: [
    page(1.2, ["menú…"], ["Tu", 0.06], ["menú…", 0.31]),
    page(2.22, ["veces"], ["¿cuántas", 1.52], ["veces", 1.89], ["lo", 2.1]),
    page(3.5, ["imprimiste"], ["imprimiste", 2.25], ["este", 2.84], ["año?", 3.08]),
  ],
  E2: [
    page(1.0, ["cambias"], ["Ahora", 0.17], ["lo", 0.47], ["cambias", 0.68]),
    page(1.95, ["segundos"], ["en", 1.03], ["segundos", 1.18]),
    page(3.4, ["celular,"], ["desde", 2.01], ["tu", 2.37], ["celular,", 2.52]),
  ],
  E3: [
    page(1.2, ["cliente"], ["y", 0.15], ["tu", 0.26], ["cliente", 0.39], ["lo", 0.82], ["abre", 1.02]),
    page(3.02, ["QR,"], ["con", 1.24], ["solo", 1.44], ["escanear", 1.69], ["un", 2.2], ["QR,", 2.32]),
    page(4.3, ["esperar."], ["sin", 3.12], ["esperar.", 3.36]),
  ],
  E4: [],
  E5: [
    page(1.1, ["Toque."], ["Carta", 0.05], ["al", 0.5], ["Toque.", 0.62]),
    page(2.99, ["gratis."], ["Pruébalo", 1.16], ["14", 1.57], ["días", 2.0], ["gratis.", 2.2]),
  ],
};
