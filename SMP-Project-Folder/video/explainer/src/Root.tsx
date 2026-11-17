import React from "react";
import { Composition, Folder } from "remotion";
import { FULL_SCENES, FullExplainer, ShortExplainer, totalFrames } from "./Explainer";
import { FULL, SHORT } from "./timings";
import { FULL_LINES } from "./script";
import { Captions } from "./captions";
import "./theme";

const FPS = 30;

export const RemotionRoot: React.FC = () => (
  <>
    <Composition id="Full" component={FullExplainer} width={1920} height={1080} fps={FPS} durationInFrames={totalFrames(FULL, FPS)} />
    <Composition id="Short" component={ShortExplainer} width={1920} height={1080} fps={FPS} durationInFrames={totalFrames(SHORT, FPS)} />
    <Folder name="Scenes">
      {FULL_SCENES.map((s, i) => (
        <Composition key={s.id} id={`scene-${i}-${s.id}`} component={() => <>{s.el}<Captions lines={FULL_LINES[i]} dark={s.dark} /></>} width={1920} height={1080} fps={FPS} durationInFrames={Math.round(FULL[i] * FPS)} />
      ))}
    </Folder>
  </>
);
