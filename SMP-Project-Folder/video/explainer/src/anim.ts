import React from "react";
import { Easing, interpolate, useCurrentFrame, useVideoConfig } from "remotion";

export const OUT = Easing.bezier(0.16, 1, 0.3, 1);

/* Story time runs at the pace the scene was drawn for; the voice decides the
   real length, and the scene stretches to it (k = real / planned). */
export const SceneTime = React.createContext<{ k: number }>({ k: 1 });

export const useRealClock = () => {
  const frame = useCurrentFrame();
  const { fps, durationInFrames } = useVideoConfig();
  return { t: frame / fps, frame, fps, length: durationInFrames / fps };
};

/* Seconds in the current scene, in story time, and its length. */
export const useClock = () => {
  const { k } = React.useContext(SceneTime);
  const { t, frame, fps, length } = useRealClock();
  return { t: t / k, frame, fps, length: length / k };
};

/* 0 → 1 between two moments (seconds), eased, clamped. */
export const ease = (t: number, from: number, to: number, easing = OUT) =>
  interpolate(t, [from, to], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing });

/* 0 → 1 → 0: in at `from`, held, out at `to`. */
export const hold = (t: number, from: number, to: number, dur = 0.5) =>
  Math.min(ease(t, from, from + dur), 1 - ease(t, to - dur, to, Easing.linear));

/* A count that runs from 0 to `v` between two moments. */
export const countTo = (t: number, v: number, from: number, to: number) => Math.round(v * ease(t, from, to, Easing.out(Easing.cubic)));

/* A slide-and-fade entrance, as a style object. */
export const enter = (p: number, dy = 18) => ({ opacity: p, translate: `0px ${(1 - p) * dy}px` });

/* How many characters of a string have been typed by `t`, between two moments. */
export const typed = (s: string, t: number, from: number, to: number) => s.slice(0, Math.round(s.length * ease(t, from, to, Easing.linear)));
