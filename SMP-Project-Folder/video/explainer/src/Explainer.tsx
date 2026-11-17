import React from "react";
import { AbsoluteFill, staticFile, useVideoConfig } from "remotion";
import { TransitionSeries, linearTiming } from "@remotion/transitions";
import { fade } from "@remotion/transitions/fade";
import { Audio } from "@remotion/media";
import { Captions, Cue } from "./captions";
import { SceneTime } from "./anim";
import { FULL_CUES, SHORT_CUES, FULL_MARKS, SHORT_MARKS } from "./cues";
import { PLANNED_FULL, PLANNED_SHORT } from "./planned";
import { FULL, SHORT, FULL_AUDIO, SHORT_AUDIO, LEAD } from "./timings";
import { FULL_LINES, SHORT_LINES } from "./script";
import { S0Strategy } from "./scenes/S0Strategy";
import { S0Solution } from "./scenes/S0Solution";
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
  { id: "strategy", el: <S0Strategy marks={FULL_MARKS[0]} />, dark: true },
  { id: "solution", el: <S0Solution marks={FULL_MARKS[1]} />, dark: true },
  { id: "company", el: <S1Company /> },
  { id: "foundation", el: <S2Foundation /> },
  { id: "plan", el: <S3Plan marks={FULL_MARKS[4]} /> },
  { id: "function", el: <S4Function /> },
  { id: "reporting", el: <S5Reporting marks={FULL_MARKS[6]} /> },
  { id: "performance", el: <S6Performance /> },
  { id: "group", el: <S7Group marks={FULL_MARKS[8]} /> },
  { id: "deck", el: <S8Deck /> },
  { id: "close", el: <S9Close />, dark: true },
];

/* The short cut: foundation and plan share one scene, the function is left out. */
/* The crossfade between scenes, in frames. The timeline shortens by one
   per cut; each scene's narration sits inside its own sequence, so nothing
   drifts, and the tail silence of every scene covers the overlap. */
export const XFADE = 14;

const S23Short: React.FC = () => (
  <TransitionSeries>
    <TransitionSeries.Sequence durationInFrames={Math.round(SHORT[3] * 0.42 * 30) + XFADE} name="Foundation"><S2Foundation short /></TransitionSeries.Sequence>
    <TransitionSeries.Transition presentation={fade()} timing={linearTiming({ durationInFrames: XFADE })} />
    <TransitionSeries.Sequence durationInFrames={Math.round(SHORT[3] * 0.58 * 30)} name="Plan"><S3Plan short /></TransitionSeries.Sequence>
  </TransitionSeries>
);

export const SHORT_SCENES: SceneDef[] = [
  { id: "strategy", el: <S0Strategy marks={SHORT_MARKS[0]} />, dark: true },
  { id: "solution", el: <S0Solution marks={SHORT_MARKS[1]} />, dark: true },
  { id: "company", el: <S1Company short /> },
  { id: "foundation-plan", el: <S23Short /> },
  { id: "reporting", el: <S5Reporting short /> },
  { id: "performance", el: <S6Performance short /> },
  { id: "group", el: <S7Group short marks={SHORT_MARKS[7]} /> },
  { id: "deck", el: <S8Deck short /> },
  { id: "close", el: <S9Close />, dark: true },
];

export const totalFrames = (secs: number[], fps = 30) => secs.reduce((s, d) => s + Math.round(d * fps), 0) - XFADE * (secs.length - 1);

export const Explainer: React.FC<{ scenes: SceneDef[]; secs: number[]; planned: number[]; lines: string[][]; cues?: Cue[][]; audio: string | null }> = ({ scenes, secs, planned, lines, cues, audio }) => {
  const { fps } = useVideoConfig();
  return (
    <AbsoluteFill style={{ background: C.dark }}>
      <TransitionSeries>
        {scenes.flatMap((s, i) => {
          const seq = (
            <TransitionSeries.Sequence key={s.id} durationInFrames={Math.round(secs[i] * fps)} name={s.id}>
              <SceneTime.Provider value={{ k: secs[i] / planned[i] }}>{s.el}</SceneTime.Provider>
              {audio ? <Audio src={staticFile(`${audio}/${i}.mp3`)} from={Math.round(LEAD * fps)} /> : null}
              <Captions lines={lines[i]} cues={cues?.[i]} dark={s.dark} />
            </TransitionSeries.Sequence>
          );
          if (i === 0) return [seq];
          return [<TransitionSeries.Transition key={s.id + "-x"} presentation={fade()} timing={linearTiming({ durationInFrames: XFADE })} />, seq];
        })}
      </TransitionSeries>
    </AbsoluteFill>
  );
};

export const FullExplainer: React.FC = () => <Explainer scenes={FULL_SCENES} secs={FULL} planned={PLANNED_FULL} lines={FULL_LINES} cues={FULL_AUDIO ? FULL_CUES : undefined} audio={FULL_AUDIO} />;
export const ShortExplainer: React.FC = () => <Explainer scenes={SHORT_SCENES} secs={SHORT} planned={PLANNED_SHORT} lines={SHORT_LINES} cues={SHORT_AUDIO ? SHORT_CUES : undefined} audio={SHORT_AUDIO} />;
