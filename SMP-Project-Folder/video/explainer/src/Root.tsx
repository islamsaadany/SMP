import React from "react";
import { Composition, Folder } from "remotion";
import { FULL_SCENES, FullExplainer, ShortExplainer, totalFrames } from "./Explainer";
import { FULL, SHORT } from "./timings";
import { FULL_LINES } from "./script";
import { Captions } from "./captions";
import "./theme";
import { S0Strategy } from "./scenes/S0Strategy";
import { FULL_MARKS } from "./cues";

const FPS = 30;

export const RemotionRoot: React.FC = () => (
  <>
    <Composition id="Full" component={FullExplainer} width={1920} height={1080} fps={FPS} durationInFrames={totalFrames(FULL, FPS)} />
    <Composition id="Short" component={ShortExplainer} width={1920} height={1080} fps={FPS} durationInFrames={totalFrames(SHORT, FPS)} />
    <Folder name="Intro-ending-options">
      {(["clear", "box", "band", "under"] as const).map((end) => (
        <Composition key={end} id={`intro-end-${end}`} component={() => <><S0Strategy marks={FULL_MARKS[0]} end={end} /><Captions cues={[{ text: "Keeping it alive is the hard part.", start: 0, end: 999 }]} dark /></>} width={1920} height={1080} fps={FPS} durationInFrames={Math.round(FULL[0] * FPS)} />
      ))}
    </Folder>
    <Folder name="Scenes">
      {FULL_SCENES.map((s, i) => (
        <Composition key={s.id} id={`scene-${i}-${s.id}`} component={() => <>{s.el}<Captions lines={FULL_LINES[i]} dark={s.dark} /></>} width={1920} height={1080} fps={FPS} durationInFrames={Math.round(FULL[i] * FPS)} />
      ))}
    </Folder>
  </>
);
