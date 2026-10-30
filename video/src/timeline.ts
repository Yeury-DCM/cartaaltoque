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

// Tiempos provisionales (estimados) hasta tener la voz real.
export const CAPTIONS: Record<SceneId, CaptionPage[]> = {
  E1: [
    page(0.95, ["menú…"], ["Tu", 0.12], ["menú…", 0.32]),
    page(2.02, ["veces"], ["¿cuántas", 1.15], ["veces", 1.6], ["lo", 1.92]),
    page(3.4, ["imprimiste"], ["imprimiste", 2.05], ["este", 2.68], ["año?", 2.88]),
  ],
  E2: [
    page(1.08, ["cambias"], ["Ahora", 0.12], ["lo", 0.48], ["cambias", 0.62]),
    page(2.2, ["celular,"], ["desde", 1.12], ["tu", 1.4], ["celular,", 1.55]),
    page(4.3, ["solo."], ["y", 2.4], ["se", 2.52], ["actualiza", 2.7], ["solo.", 3.3]),
  ],
  E3: [
    page(1.35, ["cliente"], ["Y", 0.1], ["tu", 0.22], ["cliente", 0.36], ["lo", 0.82], ["abre", 0.95]),
    page(2.55, ["QR:"], ["escaneando", 1.4], ["un", 1.95], ["QR:", 2.08]),
    page(4.3, ["esperar."], ["sin", 2.72], ["mesero,", 2.95], ["sin", 3.45], ["esperar.", 3.65]),
  ],
  E4: [],
  E5: [
    page(1.35, ["Toque."], ["Carta", 0.2], ["al", 0.55], ["Toque.", 0.68]),
    page(2.9, ["gratis."], ["Pruébalo", 1.45], ["gratis.", 1.95]),
  ],
};
