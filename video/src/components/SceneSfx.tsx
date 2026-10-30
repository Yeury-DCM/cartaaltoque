import React from "react";
import { Sfx } from "./Sfx";
import { CUES, SceneId } from "../timeline";

const { E1, E2, E3, E4, E5 } = CUES;

/** Efectos de cada escena, cada uno pegado a su golpe visual (mismos cues que las escenas). */
const SFX: Record<SceneId, React.ReactNode> = {
  E1: (
    <>
      <Sfx name="pen_fast" at={E1.strike + 0.08} db={-7} />
      <Sfx name="pen_write" at={E1.write + 0.06} db={-8} maxDur={0.6} />
      {[E1.stack1, E1.stack2, E1.stack3].map((at, i) => (
        <React.Fragment key={i}>
          <Sfx name="paper_move" at={at - 0.06} db={-9 + i} maxDur={0.6} />
          <Sfx name="counter_tick" at={at} db={-6} />
        </React.Fragment>
      ))}
    </>
  ),
  E2: (
    <>
      <Sfx name="whoosh_short" at={0.12} db={-13} />
      <Sfx name="tap" at={E2.tapPrice} db={-7} />
      {[0, 1, 2].map((i) => (
        <Sfx key={i} name="click_ui" at={E2.type + i * 0.12} db={-13} />
      ))}
      <Sfx name="tap" at={E2.save} db={-9} />
      <Sfx name="pop_light" at={E2.save + 0.02} db={-8} />
      <Sfx name="click_check" at={E2.tapSwitch} db={-7} />
      <Sfx name="pop_light" at={E2.tapSwitch + 0.12} db={-9} />
      <Sfx name="confirm_tone" at={E2.title2} db={-15} />
    </>
  ),
  E3: (
    <>
      <Sfx name="whoosh_air_up" at={E3.aim + 0.35} db={-14} maxDur={1} />
      <Sfx name="correct_tone" at={E3.lock} db={-9} />
      <Sfx name="whoosh_short" at={E3.open + 0.05} db={-13} />
      <Sfx name="tap" at={E3.tapPlus} db={-7} />
      <Sfx name="pop_msg" at={E3.tapPlus + 0.08} db={-11} />
    </>
  ),
  E4: (
    <>
      <Sfx name="whoosh_short" at={0.1} db={-13} />
      {[E4.v1, E4.v2, E4.v3].map((at, i) => (
        <React.Fragment key={i}>
          <Sfx name="click_select" at={at + 0.04} db={-8} />
          {i > 0 ? <Sfx name="whoosh_short_lr" at={at + 0.1} db={-14} /> : null}
        </React.Fragment>
      ))}
    </>
  ),
  E5: (
    <>
      <Sfx name="impact_deep" at={E5.logo + 0.08} db={-9} />
      <Sfx name="pop_light" at={E5.url + 0.05} db={-13} />
    </>
  ),
};

export const SceneSfx: React.FC<{ scene: SceneId }> = ({ scene }) => <>{SFX[scene]}</>;
