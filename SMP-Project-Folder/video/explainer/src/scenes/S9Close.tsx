import React from "react";
import { AbsoluteFill } from "remotion";
import { ease, useRealClock, enter } from "../anim";
import { C, FONT } from "../theme";
import { Mark } from "../ui";
import type { Marks } from "./S0Strategy";

/* The close: the mark and the name stand first; Plan, Report and Result
   appear under them on the words themselves. */
export const S9Close: React.FC<{ marks?: Marks }> = ({ marks }) => {
  const { t, length } = useRealClock();
  const at = (w: string, fb: number) => (marks && marks[w] !== undefined ? marks[w] : fb);
  const inP = ease(t, 0.2, 1.0);
  const words: [string, string, string][] = [["plan", "Plan", C.darkInk], ["report", "Report", "#FDBA74"], ["result", "Result", "#6EE7B7"]];
  const wordAt = words.map(([w], i) => at(w, 1.8 + i * 0.8));
  const byAt = at("everyone", wordAt[2] + 1.3);
  const byP = ease(t, byAt - 0.2, byAt + 0.5);
  const fade = 1 - ease(t, length - 1.0, length - 0.1);
  return (
    <AbsoluteFill style={{ background: C.dark, fontFamily: FONT, color: C.darkInk, justifyContent: "center", alignItems: "center", opacity: fade }}>
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", translate: "0px -30px" }}>
        <div style={{ ...enter(inP, 16) }}><Mark size={160} /></div>
        <div style={{ marginTop: 36, fontSize: 54, fontWeight: 700, ...enter(ease(t, 0.5, 1.3), 12) }}>Strategy Management Platform</div>
        <div style={{ marginTop: 30, display: "flex", gap: 30, fontSize: 44, fontWeight: 700, height: 60, alignItems: "center" }}>
          {words.map(([w, label, color], i) => {
            const p = ease(t, wordAt[i] - 0.1, wordAt[i] + 0.45);
            return (
              <React.Fragment key={w}>
                {i > 0 ? <span style={{ color: C.darkQuiet, opacity: p * 0.5, fontWeight: 400 }}>·</span> : null}
                <span style={{ color, ...enter(p, 14), scale: String(0.9 + 0.1 * p) }}>{label}</span>
              </React.Fragment>
            );
          })}
        </div>
        <div style={{ marginTop: 28, fontSize: 26, color: C.darkQuiet, ...enter(byP, 8) }}>by Forefront Consulting</div>
      </div>
    </AbsoluteFill>
  );
};
