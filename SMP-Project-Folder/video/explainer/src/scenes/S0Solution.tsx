import React from "react";
import { AbsoluteFill } from "remotion";
import { ease, useClock, enter } from "../anim";
import { C, FONT, MONO } from "../theme";
import { Mark } from "../ui";
import { ARTEFACTS } from "./S0Strategy";

/* The scattered pieces pull into one mark: the platform. */
export const S0Solution: React.FC<{ short?: boolean }> = ({ short }) => {
  const { t, length } = useClock();
  const k = short ? 0.7 : 1;
  const gather = ease(t, 0.2, 1.6 * k);
  const draw = ease(t, 1.2 * k, 2.3 * k);
  const tile = ease(t, 1.9 * k, 2.6 * k);
  const title = ease(t, 2.8 * k, 3.6 * k);
  const words = ["Plans", "Reporting", "Results"];
  const howP = short ? 0 : ease(t, 9.4, 10.0);
  const out = 1 - ease(t, length - 0.5, length);
  return (
    <AbsoluteFill style={{ background: C.dark, fontFamily: FONT, color: C.darkInk, justifyContent: "center", alignItems: "center", opacity: out }}>
      {ARTEFACTS.map((a) => (
        <div key={a.title} style={{ position: "absolute", left: 960 - 190, top: 540 - 50, width: 380, background: C.dark2, border: `1px solid rgba(255,255,255,.14)`, borderRadius: 12, padding: "16px 20px", display: "flex", gap: 14, alignItems: "center", opacity: (1 - gather) * 0.65, translate: `${a.dx * (1 - gather)}px ${(a.dy - 90) * (1 - gather)}px`, rotate: `${a.rot * (1 - gather)}deg`, scale: String(1 - 0.6 * gather) }}>
          <div style={{ width: 44, height: 44, borderRadius: 10, background: "rgba(255,255,255,.08)", display: "grid", placeItems: "center", fontSize: 24, color: C.amber }}>{a.glyph}</div>
          <div><div style={{ fontSize: 20, fontWeight: 700, fontFamily: MONO }}>{a.title}</div><div style={{ fontSize: 15, color: C.darkQuiet }}>{a.sub}</div></div>
        </div>
      ))}
      <div style={{ translate: "0px -40px", display: "flex", flexDirection: "column", alignItems: "center" }}>
        <Mark size={200} draw={draw} tile={tile} />
        <div style={{ marginTop: 44, fontSize: 64, fontWeight: 700, letterSpacing: "-0.01em", ...enter(title, 16) }}>Strategy Management Platform</div>
        <div style={{ marginTop: 22, display: "flex", gap: 28, fontSize: 32, color: C.darkQuiet }}>
          {words.map((w, i) => {
            const p = ease(t, (5.0 + i * 0.8) * k, (5.5 + i * 0.8) * k);
            return (
              <React.Fragment key={w}>
                {i > 0 ? <span style={{ opacity: p * 0.5 }}>·</span> : null}
                <span style={{ ...enter(p, 10), color: i === 1 ? "#FDBA74" : i === 2 ? "#6EE7B7" : C.darkInk }}>{w}</span>
              </React.Fragment>
            );
          })}
        </div>
        <div style={{ marginTop: 40, fontSize: 24, color: C.darkQuiet, ...enter(howP, 8) }}>This is how it works.</div>
      </div>
    </AbsoluteFill>
  );
};
