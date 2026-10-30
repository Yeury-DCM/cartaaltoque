import React from "react";
import { AbsoluteFill, Sequence, staticFile, useVideoConfig } from "remotion";
import { Audio } from "@remotion/media";
import { EDITS, EditId, SCENE_FRAMES, SceneId, VOICE, editStart, f } from "./timeline";
import { SceneSfx } from "./components/SceneSfx";
import { E1Gancho } from "./scenes/E1Gancho";
import { E2Dueno } from "./scenes/E2Dueno";
import { E3Cliente } from "./scenes/E3Cliente";
import { E4Marca } from "./scenes/E4Marca";
import { E5Cierre } from "./scenes/E5Cierre";

export const SCENE_COMPONENTS: Record<SceneId, React.FC> = {
  E1: E1Gancho,
  E2: E2Dueno,
  E3: E3Cliente,
  E4: E4Marca,
  E5: E5Cierre,
};

/** Voz de una escena (segundos locales de la escena). Vacío hasta tener el audio. */
export const SceneVoices: React.FC<{ scene: SceneId }> = ({ scene }) => {
  const { fps } = useVideoConfig();
  return (
    <>
      {VOICE.filter((v) => v.scene === scene).map((v) => (
        <Audio key={v.id} src={staticFile(`audio/voice/${v.id}.wav`)} from={f(v.at)} premountFor={fps} />
      ))}
    </>
  );
};

const Scene: React.FC<{ scene: SceneId }> = ({ scene }) => {
  const C = SCENE_COMPONENTS[scene];
  return (
    <>
      <C />
      <SceneSfx scene={scene} />
      <SceneVoices scene={scene} />
    </>
  );
};

/** Montaje completo: escenas en fila, con la música armada para ese montaje. */
export const Ad: React.FC<{ edit: EditId }> = ({ edit }) => {
  const { fps } = useVideoConfig();
  const start = editStart(edit);
  return (
    <AbsoluteFill style={{ background: "#000" }}>
      <Audio src={staticFile(`audio/music/${edit}.wav`)} />
      {EDITS[edit].map((id) => (
        <Sequence key={id} name={id} from={start[id]} durationInFrames={SCENE_FRAMES[id]} premountFor={fps}>
          <Scene scene={id} />
        </Sequence>
      ))}
    </AbsoluteFill>
  );
};

/** Escena suelta (para QA) con su tramo de la música del montaje completo. */
export const SceneStandalone: React.FC<{ scene: SceneId }> = ({ scene }) => (
  <AbsoluteFill style={{ background: "#000" }}>
    <Audio
      src={staticFile("audio/music/CartaAd.wav")}
      trimBefore={editStart("CartaAd")[scene]}
      durationInFrames={SCENE_FRAMES[scene]}
    />
    <Scene scene={scene} />
  </AbsoluteFill>
);
