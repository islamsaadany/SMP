import React from "react";
import { AbsoluteFill } from "remotion";
import { ease, useClock, enter } from "../anim";
import { C, FONT } from "../theme";
import { Mark } from "../ui";

export const S9Close: React.FC = () => {
  const { t, length } = useClock();
  const words: [string, string][] = [["Plan", C.darkInk], ["Report", "#FDBA74"], ["Result", "#6EE7B7"]];
  const resolve = ease(t, 3.4, 4.2);
  const fade = 1 - ease(t, length - 1.0, length - 0.1);
  return (
    <AbsoluteFill style={{ background: C.dark, fontFamily: FONT, color: C.darkInk, justifyContent: "center", alignItems: "center", opacity: fade }}>
      <div style={{ display: "flex", gap: 36, fontSize: 72, fontWeight: 700, position: "absolute", opacity: 1 - resolve, scale: String(1 - 0.3 * resolve) }}>
        {words.map(([w, c], i) => {
          const p = ease(t, 0.6 + i * 0.8, 1.1 + i * 0.8);
          return <React.Fragment key={w}>{i > 0 ? <span style={{ opacity: p * 0.4 }}>·</span> : null}<span style={{ color: c, ...enter(p, 20) }}>{w}</span></React.Fragment>;
        })}
      </div>
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", opacity: resolve, scale: String(0.9 + 0.1 * resolve) }}>
        <Mark size={160} />
        <div style={{ marginTop: 36, fontSize: 54, fontWeight: 700 }}>Strategy Management Platform</div>
        <div style={{ marginTop: 14, fontSize: 26, color: C.darkQuiet, ...enter(ease(t, 4.6, 5.2), 8) }}>by Forefront Consulting</div>
      </div>
    </AbsoluteFill>
  );
};
