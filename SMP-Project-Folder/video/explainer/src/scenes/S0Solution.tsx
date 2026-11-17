import React from "react";
import { AbsoluteFill } from "remotion";
import { ease, useRealClock, enter } from "../anim";
import { C, FONT, MONO } from "../theme";
import { Mark } from "../ui";
import { ARTEFACTS, Marks } from "./S0Strategy";

const at = (marks: Marks | undefined, word: string, fallback: number) => (marks && marks[word] !== undefined ? marks[word] : fallback);

/* The scattered pieces pull into one mark: the platform. The three words
   land as the voice says them. */
export const S0Solution: React.FC<{ marks?: Marks }> = ({ marks }) => {
  const { t, length } = useRealClock();
  const named = at(marks, "strategy", 1.4); // "...the Strategy Management Platform..."
  const gather = ease(t, 0.2, named + 0.2);
  const draw = ease(t, named - 0.4, named + 0.7);
  const tile = ease(t, named + 0.2, named + 0.9);
  const title = ease(t, named + 0.4, named + 1.2);
  const words: [string, string][] = [["plans", "Plans"], ["reporting", "Reporting"], ["results", "Results"]];
  const howAt = marks && marks["how"] !== undefined ? marks["how"] - 0.6 : 99;
  const howP = ease(t, howAt, howAt + 0.6);
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
          {words.map(([w, label], i) => {
            // said one by one in the full cut; in the one-minute cut they follow the name quickly
            const from = at(marks, w, named + 1.6 + i * 0.5) - 0.1;
            const p = ease(t, from, from + 0.5);
            return (
              <React.Fragment key={w}>
                {i > 0 ? <span style={{ opacity: p * 0.5 }}>·</span> : null}
                <span style={{ ...enter(p, 10), color: i === 1 ? "#FDBA74" : i === 2 ? "#6EE7B7" : C.darkInk }}>{label}</span>
              </React.Fragment>
            );
          })}
        </div>
        <div style={{ marginTop: 40, fontSize: 24, color: C.darkQuiet, ...enter(howP, 8) }}>This is how it works.</div>
      </div>
    </AbsoluteFill>
  );
};
