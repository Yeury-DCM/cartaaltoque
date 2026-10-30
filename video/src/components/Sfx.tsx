import React from "react";
import { Audio } from "@remotion/media";
import { staticFile, useVideoConfig } from "remotion";
import MAN from "../sfx-manifest.json";

export type SfxName = keyof typeof MAN;

/**
 * Efecto con el golpe (hit) alineado a `at` (segundos locales de la escena).
 * `db` es la ganancia relativa (0 = archivo normalizado a -3 dBFS).
 */
export const Sfx: React.FC<{ name: SfxName; at: number; db?: number; rate?: number; maxDur?: number }> = ({
  name,
  at,
  db = -10,
  rate = 1,
  maxDur,
}) => {
  const { fps } = useVideoConfig();
  const m = MAN[name];
  const startSec = at - m.hit / rate;
  const trim = startSec < 0 ? -startSec : 0;
  const dur = Math.min(maxDur ?? m.dur, m.dur / rate - trim);
  if (dur <= 0) return null;
  return (
    <Audio
      src={staticFile(m.file)}
      from={Math.max(0, Math.round(startSec * fps))}
      trimBefore={trim > 0 ? Math.round(trim * fps) : undefined}
      durationInFrames={Math.max(1, Math.round(dur * fps))}
      volume={10 ** (db / 20)}
      playbackRate={rate}
      premountFor={fps}
    />
  );
};
