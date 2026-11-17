import React from "react";
import { AbsoluteFill } from "remotion";
import { ease, useRealClock, enter } from "../anim";
import { C, FONT, MONO } from "../theme";

/* What a strategy meets after the workshop: the deck, the spreadsheet, the
   emails, the review that starts over. Each appears on the word the voice
   says it (the marks come from the voice's own word timings). */
export const ARTEFACTS: { key: string; title: string; sub: string; glyph: string; dx: number; dy: number; rot: number }[] = [
  { key: "deck", title: "Strategy 2026.pptx", sub: "48 slides · last opened in January", glyph: "▤", dx: -520, dy: -150, rot: -6 },
  { key: "spreadsheet", title: "Targets_v7_FINAL.xlsx", sub: "one tab per unit · three versions in circulation", glyph: "▦", dx: 540, dy: -120, rot: 5 },
  { key: "emails", title: "RE: RE: Q2 figures", sub: "14 replies · two attachments", glyph: "✉", dx: -470, dy: 190, rot: 4 },
  { key: "review", title: "Quarterly review", sub: "the deck is rebuilt from scratch", glyph: "◷", dx: 500, dy: 210, rot: -4 },
];

export type Marks = Record<string, number>;
const at = (marks: Marks | undefined, word: string, fallback: number) => (marks && marks[word] !== undefined ? marks[word] : fallback);

export const S0Strategy: React.FC<{ marks?: Marks }> = ({ marks }) => {
  const { t, length } = useRealClock();
  const word = ease(t, 0.3, 1.2);
  const stages: [string, string, number][] = [["workshop", "agreed in a workshop", 2.2], ["board", "presented to the board", 3.6], ["meets", "then it meets the year", 5.2]];
  const shown = stages.filter(([w]) => !marks || marks[w] !== undefined);
  const artAt = ARTEFACTS.map((a) => at(marks, a.key, 6.8 + ARTEFACTS.indexOf(a) * 1.2));
  const first = Math.min(...artAt), last = Math.max(...artAt);
  const spread = ease(t, first, last + 2.0, (x) => x);
  const dim = ease(t, first - 0.2, first + 1.2);
  const rightAt = at(marks, "right", last + 3.0);
  const hardAt = at(marks, "keeping", last + 4.5);
  const rightP = ease(t, rightAt - 0.2, rightAt + 0.5);
  const hardP = ease(t, hardAt - 0.1, hardAt + 0.6);
  const out = 1 - ease(t, length - 0.5, length);
  return (
    <AbsoluteFill style={{ background: C.dark, fontFamily: FONT, color: C.darkInk, justifyContent: "center", alignItems: "center", opacity: out }}>
      <div style={{ position: "absolute", top: 300, fontSize: 150, fontWeight: 700, letterSpacing: "-0.02em", lineHeight: 1, opacity: word * (1 - 0.65 * dim), scale: String(0.96 + 0.04 * word - 0.08 * dim) }}>Strategy</div>
      <div style={{ position: "absolute", top: 480, display: "flex", gap: 16, opacity: 1 - dim * 0.7 }}>
        {shown.map(([w, label, fb], i) => {
          const from = at(marks, w, fb) - 0.1;
          const p = ease(t, from, from + 0.5);
          return (
            <React.Fragment key={w}>
              {i > 0 ? <span style={{ color: C.darkQuiet, fontSize: 24, opacity: p, alignSelf: "center" }}>→</span> : null}
              <div style={{ border: `1px solid rgba(255,255,255,.25)`, borderRadius: 999, padding: "8px 22px", fontSize: 24, color: w === "meets" ? C.amber : C.darkInk, ...enter(p, 10) }}>{label}</div>
            </React.Fragment>
          );
        })}
      </div>
      {ARTEFACTS.map((a, i) => {
        const p = ease(t, artAt[i] - 0.1, artAt[i] + 0.5);
        return (
          <div key={a.title} style={{ position: "absolute", left: 960 - 190, top: 540 - 50, width: 380, background: C.dark2, border: `1px solid rgba(255,255,255,.14)`, borderRadius: 12, padding: "16px 20px", display: "flex", gap: 14, alignItems: "center", opacity: p * (1 - 0.35 * hardP), translate: `${a.dx * (0.55 + 0.45 * spread) * p}px ${a.dy * (0.55 + 0.45 * spread) * p}px`, rotate: `${a.rot * spread}deg`, scale: String(0.7 + 0.3 * p), boxShadow: "0 20px 50px rgba(0,0,0,.4)" }}>
            <div style={{ width: 44, height: 44, borderRadius: 10, background: "rgba(255,255,255,.08)", display: "grid", placeItems: "center", fontSize: 24, color: C.amber }}>{a.glyph}</div>
            <div><div style={{ fontSize: 20, fontWeight: 700, fontFamily: MONO }}>{a.title}</div><div style={{ fontSize: 15, color: C.darkQuiet, marginTop: 2 }}>{a.sub}</div></div>
          </div>
        );
      })}
      <div style={{ position: "absolute", top: 700, textAlign: "center" }}>
        <div style={{ fontSize: 40, fontWeight: 400, color: C.darkInk, ...enter(rightP, 12) }}>The strategy is right.</div>
        <div style={{ fontSize: 52, fontWeight: 700, color: C.amber, marginTop: 10, ...enter(hardP, 12) }}>Keeping it alive is the hard part.</div>
      </div>
    </AbsoluteFill>
  );
};
