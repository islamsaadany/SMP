import React from "react";
import { AbsoluteFill, Series, staticFile, useVideoConfig } from "remotion";
import { Audio } from "@remotion/media";
import { Captions, Cue } from "./captions";
import { SceneTime } from "./anim";
import { FULL_CUES, SHORT_CUES } from "./cues";
import { PLANNED_FULL, PLANNED_SHORT } from "./planned";
import { FULL, SHORT, FULL_AUDIO, SHORT_AUDIO, LEAD } from "./timings";
import { FULL_LINES, SHORT_LINES } from "./script";
import { S0Open } from "./scenes/S0Open";
import { S1Company } from "./scenes/S1Company";
import { S2Foundation } from "./scenes/S2Foundation";
import { S3Plan } from "./scenes/S3Plan";
import { S4Function } from "./scenes/S4Function";
import { S5Reporting } from "./scenes/S5Reporting";
import { S6Performance } from "./scenes/S6Performance";
import { S7Group } from "./scenes/S7Group";
import { S8Deck } from "./scenes/S8Deck";
import { S9Close } from "./scenes/S9Close";
import { C } from "./theme";

export type SceneDef = { id: string; el: React.ReactNode; dark?: boolean };

export const FULL_SCENES: SceneDef[] = [
  { id: "open", el: <S0Open />, dark: true },
  { id: "company", el: <S1Company /> },
  { id: "foundation", el: <S2Foundation /> },
  { id: "plan", el: <S3Plan /> },
  { id: "function", el: <S4Function /> },
  { id: "reporting", el: <S5Reporting /> },
  { id: "performance", el: <S6Performance /> },
  { id: "group", el: <S7Group /> },
  { id: "deck", el: <S8Deck /> },
  { id: "close", el: <S9Close />, dark: true },
];

/* The short cut: foundation and plan share one scene, the function is left out. */
const S23Short: React.FC = () => (
  <Series>
    <Series.Sequence durationInFrames={Math.round(SHORT[2] * 0.42 * 30)} name="Foundation"><S2Foundation short /></Series.Sequence>
    <Series.Sequence durationInFrames={Math.round(SHORT[2] * 0.58 * 30)} name="Plan"><S3Plan short /></Series.Sequence>
  </Series>
);

export const SHORT_SCENES: SceneDef[] = [
  { id: "open", el: <S0Open />, dark: true },
  { id: "company", el: <S1Company short /> },
  { id: "foundation-plan", el: <S23Short /> },
  { id: "reporting", el: <S5Reporting short /> },
  { id: "performance", el: <S6Performance short /> },
  { id: "group", el: <S7Group short /> },
  { id: "deck", el: <S8Deck short /> },
  { id: "close", el: <S9Close />, dark: true },
];

export const totalFrames = (secs: number[], fps = 30) => secs.reduce((s, d) => s + Math.round(d * fps), 0);

export const Explainer: React.FC<{ scenes: SceneDef[]; secs: number[]; planned: number[]; lines: string[][]; cues?: Cue[][]; audio: string | null }> = ({ scenes, secs, planned, lines, cues, audio }) => {
  const { fps } = useVideoConfig();
  return (
    <AbsoluteFill style={{ background: C.dark }}>
      <Series>
        {scenes.map((s, i) => (
          <Series.Sequence key={s.id} durationInFrames={Math.round(secs[i] * fps)} name={s.id}>
            <SceneTime.Provider value={{ k: secs[i] / planned[i] }}>{s.el}</SceneTime.Provider>
            {audio ? <Audio src={staticFile(`${audio}/${i}.mp3`)} from={Math.round(LEAD * fps)} /> : null}
            <Captions lines={lines[i]} cues={cues?.[i]} dark={s.dark} />
          </Series.Sequence>
        ))}
      </Series>
    </AbsoluteFill>
  );
};

export const FullExplainer: React.FC = () => <Explainer scenes={FULL_SCENES} secs={FULL} planned={PLANNED_FULL} lines={FULL_LINES} cues={FULL_AUDIO ? FULL_CUES : undefined} audio={FULL_AUDIO} />;
export const ShortExplainer: React.FC = () => <Explainer scenes={SHORT_SCENES} secs={SHORT} planned={PLANNED_SHORT} lines={SHORT_LINES} cues={SHORT_AUDIO ? SHORT_CUES : undefined} audio={SHORT_AUDIO} />;
