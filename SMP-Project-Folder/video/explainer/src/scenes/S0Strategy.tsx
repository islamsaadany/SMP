import React from "react";
import { AbsoluteFill } from "remotion";
import { ease, useClock, enter } from "../anim";
import { C, FONT, MONO } from "../theme";

/* What a strategy meets after the workshop: the deck, the spreadsheet, the
   emails, the review that starts over. Drawn as cards drifting apart. */
export const ARTEFACTS: { title: string; sub: string; glyph: string; dx: number; dy: number; rot: number }[] = [
  { title: "Strategy 2026.pptx", sub: "48 slides · last opened in January", glyph: "▤", dx: -520, dy: -150, rot: -6 },
  { title: "Targets_v7_FINAL.xlsx", sub: "one tab per unit · three versions in circulation", glyph: "▦", dx: 540, dy: -120, rot: 5 },
  { title: "RE: RE: Q2 figures", sub: "14 replies · two attachments", glyph: "✉", dx: -470, dy: 190, rot: 4 },
  { title: "Quarterly review", sub: "the deck is rebuilt from scratch", glyph: "◷", dx: 500, dy: 210, rot: -4 },
];

export const S0Strategy: React.FC<{ short?: boolean }> = ({ short }) => {
  const { t, length } = useClock();
  const k = short ? 0.6 : 1;
  const word = ease(t, 0.3, 1.2);
  const stages = ["agreed in a workshop", "presented to the board", "then it meets the year"];
  const stageAt = [2.2, 3.6, 5.2].map((x) => x * k);
  const scatterAt = [6.8, 8.0, 9.2, 10.4].map((x) => x * k);
  const spread = ease(t, 6.6 * k, 12.5 * k, (x) => x);
  const dim = ease(t, 6.6 * k, 8.0 * k);
  const rightP = ease(t, 13.4 * k, 14.2 * k);
  const hardP = ease(t, 15.4 * k, 16.2 * k);
  const out = 1 - ease(t, length - 0.5, length);
  return (
    <AbsoluteFill style={{ background: C.dark, fontFamily: FONT, color: C.darkInk, justifyContent: "center", alignItems: "center", opacity: out }}>
      <div style={{ position: "absolute", top: 300, fontSize: 150, fontWeight: 700, letterSpacing: "-0.02em", lineHeight: 1, opacity: word * (1 - 0.65 * dim), scale: String(0.96 + 0.04 * word - 0.08 * dim) }}>Strategy</div>
      <div style={{ position: "absolute", top: 480, display: "flex", gap: 16, opacity: 1 - dim * 0.7 }}>
        {stages.map((s, i) => {
          const p = ease(t, stageAt[i], stageAt[i] + 0.5);
          return (
            <React.Fragment key={s}>
              {i > 0 ? <span style={{ color: C.darkQuiet, fontSize: 24, opacity: p, alignSelf: "center" }}>→</span> : null}
              <div style={{ border: `1px solid rgba(255,255,255,.25)`, borderRadius: 999, padding: "8px 22px", fontSize: 24, color: i === 2 ? C.amber : C.darkInk, ...enter(p, 10) }}>{s}</div>
            </React.Fragment>
          );
        })}
      </div>
      {ARTEFACTS.map((a, i) => {
        const p = ease(t, scatterAt[i], scatterAt[i] + 0.6);
        const drift = spread;
        return (
          <div key={a.title} style={{ position: "absolute", left: 960 - 190, top: 540 - 50, width: 380, background: C.dark2, border: `1px solid rgba(255,255,255,.14)`, borderRadius: 12, padding: "16px 20px", display: "flex", gap: 14, alignItems: "center", opacity: p * (1 - 0.35 * hardP), translate: `${a.dx * (0.55 + 0.45 * drift) * p}px ${a.dy * (0.55 + 0.45 * drift) * p}px`, rotate: `${a.rot * drift}deg`, boxShadow: "0 20px 50px rgba(0,0,0,.4)" }}>
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
