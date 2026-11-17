import React from "react";
import { AbsoluteFill } from "remotion";
import { ease, useClock, enter } from "../anim";
import { C, FONT } from "../theme";
import { Mark } from "../ui";

export const S0Open: React.FC = () => {
  const { t, length } = useClock();
  const draw = ease(t, 0.3, 1.5);
  const tile = ease(t, 1.1, 1.8);
  const title = ease(t, 1.9, 2.7);
  const words = ["Plans", "Reporting", "Results"];
  const out = 1 - ease(t, length - 0.5, length);
  return (
    <AbsoluteFill style={{ background: C.dark, fontFamily: FONT, color: C.darkInk, justifyContent: "center", alignItems: "center", opacity: out }}>
      <Mark size={200} draw={draw} tile={tile} />
      <div style={{ marginTop: 44, fontSize: 64, fontWeight: 700, letterSpacing: "-0.01em", ...enter(title, 16) }}>Strategy Management Platform</div>
      <div style={{ marginTop: 22, display: "flex", gap: 28, fontSize: 32, fontWeight: 400, color: C.darkQuiet }}>
        {words.map((w, i) => {
          const p = ease(t, 4.4 + i * 0.9, 4.9 + i * 0.9);
          return (
            <React.Fragment key={w}>
              {i > 0 ? <span style={{ opacity: p * 0.5 }}>·</span> : null}
              <span style={{ ...enter(p, 10), color: i === 1 ? "#FDBA74" : i === 2 ? "#6EE7B7" : C.darkInk }}>{w}</span>
            </React.Fragment>
          );
        })}
      </div>
    </AbsoluteFill>
  );
};
