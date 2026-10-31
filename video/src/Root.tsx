import React from "react";
import { Composition, Still } from "remotion";
import { FEED, FLYERS } from "./flyers/Flyers";
import "./styles.css";
import { Ad, SceneStandalone } from "./Main";
import { FPS, SCENE_FRAMES, editFrames } from "./timeline";

const size = { fps: FPS, width: 1080, height: 1920 };

export const RemotionRoot: React.FC = () => (
  <>
    <Composition id="CartaAd" component={Ad} defaultProps={{ edit: "CartaAd" as const }} durationInFrames={editFrames("CartaAd")} {...size} />
    <Composition id="CartaAd15" component={Ad} defaultProps={{ edit: "CartaAd15" as const }} durationInFrames={editFrames("CartaAd15")} {...size} />
    <Composition id="E1-Gancho" component={SceneStandalone} defaultProps={{ scene: "E1" as const }} durationInFrames={SCENE_FRAMES.E1} {...size} />
    <Composition id="E2-Dueno" component={SceneStandalone} defaultProps={{ scene: "E2" as const }} durationInFrames={SCENE_FRAMES.E2} {...size} />
    <Composition id="E3-Cliente" component={SceneStandalone} defaultProps={{ scene: "E3" as const }} durationInFrames={SCENE_FRAMES.E3} {...size} />
    <Composition id="E4-Marca" component={SceneStandalone} defaultProps={{ scene: "E4" as const }} durationInFrames={SCENE_FRAMES.E4} {...size} />
    <Composition id="E5-Cierre" component={SceneStandalone} defaultProps={{ scene: "E5" as const }} durationInFrames={SCENE_FRAMES.E5} {...size} />
    {FLYERS.map((fl) => (
      <Still key={fl.id} id={fl.id} component={fl.component} {...FEED} />
    ))}
  </>
);
