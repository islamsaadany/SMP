import React from "react";
import { useRealClock } from "./anim";
import { FONT } from "./theme";

export type Cue = { text: string; start: number; end: number };

/* Captions for one scene. Either timed cues, or plain lines spread over the
   scene's speech by word count (the fallback until the voice is measured). */
export const Captions: React.FC<{ lines?: string[]; cues?: Cue[]; speech?: number; dark?: boolean }> = ({ lines, cues, speech, dark }) => {
  const { t, length } = useRealClock();
  let list: Cue[] = cues ?? [];
  if (!cues && lines) {
    const total = lines.reduce((s, l) => s + l.split(" ").length, 0);
    const span = speech ?? length - 1.0;
    let acc = 0;
    list = lines.map((l) => {
      const n = l.split(" ").length;
      const start = (acc / total) * span;
      acc += n;
      return { text: l, start, end: (acc / total) * span };
    });
  }
  const cue = list.find((c) => t >= c.start && t < c.end);
  if (!cue) return null;
  const fadeIn = Math.min(1, (t - cue.start) / 0.15);
  return (
    <div style={{ position: "absolute", left: 0, right: 0, bottom: 44, display: "flex", justifyContent: "center", pointerEvents: "none", fontFamily: FONT }}>
      <div style={{ maxWidth: 1400, padding: "10px 26px", borderRadius: 10, background: dark ? "rgba(255,255,255,.10)" : "rgba(15,23,42,.86)", color: "#fff", fontSize: 34, lineHeight: 1.3, textAlign: "center", opacity: fadeIn, fontWeight: 500, letterSpacing: "0.005em" }}>{cue.text}</div>
    </div>
  );
};
