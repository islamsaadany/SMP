import React from "react";
import { AbsoluteFill } from "remotion";
import { ease, typed, useClock, enter } from "../anim";
import { C, FONT, MONO } from "../theme";
import { Card, Chrome, Label, Chip } from "../ui";
import { FOUNDATION, FUNCTIONS, SEAT, SWOT, UNIT, UNITS } from "../data";

const Who: React.FC<{ t: number; k: number }> = ({ t, k }) => (
  <Card style={{ flex: 1, ...enter(ease(t, 0.4 * k, 1.1 * k), 16) }}>
    <div style={{ fontSize: 22, fontWeight: 700, marginBottom: 12 }}>Who we are</div>
    {FOUNDATION.whoWeAre.map(([l, v], i) => {
      const from = (1.2 + i * 0.75) * k;
      return (
        <div key={l} style={{ display: "flex", gap: 24, padding: "11px 0", borderBottom: `1px solid ${C.lineSoft}`, fontSize: 19, opacity: ease(t, from, from + 0.3) }}>
          <div style={{ width: 150, fontWeight: 700, color: C.ink, flex: "none" }}>{l}</div>
          <div style={{ color: C.ink }}>{typed(v, t, from, from + 0.7 * k)}</div>
        </div>
      );
    })}
  </Card>
);

const Aspiration: React.FC<{ t: number; k: number }> = ({ t, k }) => (
  <Card style={{ flex: 1.3, ...enter(ease(t, 5.2 * k, 5.9 * k), 16) }}>
    <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 12 }}>
      <div style={{ fontSize: 22, fontWeight: 700 }}>Winning Aspiration</div>
      <Chip border={C.gold} bg="transparent" color={C.ink2} size={13}>Horizon · {FOUNDATION.horizon}</Chip>
    </div>
    <div style={{ fontSize: 19, lineHeight: 1.45, color: C.ink, minHeight: 56 }}>{typed(FOUNDATION.aspiration, t, 5.6 * k, 8.0 * k)}</div>
    <div style={{ borderTop: `1px solid ${C.lineSoft}`, marginTop: 14, paddingTop: 12, opacity: ease(t, 8.0 * k, 8.4 * k) }}>
      <Label>End in mind</Label>
      <div style={{ fontSize: 17, color: C.ink, marginTop: 4 }}>{FOUNDATION.endInMind}</div>
    </div>
    <div style={{ marginTop: 16, opacity: ease(t, 8.6 * k, 9.0 * k) }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <Label>Key objectives</Label>
        <Chip bg={C.navy} color="#fff" size={12}>This year</Chip>
      </div>
      <div style={{ display: "flex", padding: "8px 0 4px", fontSize: 12, letterSpacing: "0.12em", textTransform: "uppercase", color: C.ink3, fontWeight: 700 }}>
        <div style={{ flex: 1 }}>Objective</div><div style={{ width: 140, textAlign: "right" }}>By {FOUNDATION.horizon}</div><div style={{ width: 140, textAlign: "right" }}>This year</div>
      </div>
      {FOUNDATION.objectives.map((o, i) => {
        const from = (9.2 + i * 0.6) * k;
        const p = ease(t, from, from + 0.4);
        return (
          <div key={o.name} style={{ display: "flex", padding: "10px 0", borderTop: `1px solid ${C.lineSoft}`, fontSize: 18, ...enter(p, 8) }}>
            <div style={{ flex: 1 }}>{o.name}</div>
            <div style={{ width: 140, textAlign: "right", fontFamily: MONO, color: C.gold, opacity: ease(t, from + 0.5, from + 0.9) }}>{o.horizon}</div>
            <div style={{ width: 140, textAlign: "right", fontFamily: MONO, fontWeight: 600 }}>{o.thisYear}</div>
          </div>
        );
      })}
    </div>
  </Card>
);

const Swot: React.FC<{ t: number; from: number; k: number }> = ({ t, from, k }) => {
  const blocks: [string, string[], string][] = [
    ["Strengths", SWOT.strengths, C.good],
    ["Weaknesses", SWOT.weaknesses, C.bad],
    ["Opportunities", SWOT.opportunities, C.navy],
    ["Threats", SWOT.threats, C.cta],
  ];
  return (
    <div style={{ position: "absolute", inset: 24, display: "grid", gridTemplateColumns: "1fr 1fr", gridTemplateRows: "1fr 1fr", gap: 20 }}>
      {blocks.map(([title, items, color], b) => {
        const p = ease(t, from + b * 0.35 * k, from + 0.5 + b * 0.35 * k);
        return (
          <Card key={title} style={{ borderTop: `4px solid ${color}`, ...enter(p, 20) }}>
            <Label>{title}</Label>
            {items.map((it, i) => {
              const q = ease(t, from + 0.6 * k + b * 0.35 * k + i * 0.22 * k, from + 0.9 * k + b * 0.35 * k + i * 0.22 * k);
              return (
                <div key={it} style={{ display: "flex", gap: 18, padding: "10px 0", borderBottom: `1px solid ${C.lineSoft}`, fontSize: 19, opacity: q, translate: `${(1 - q) * -8}px 0px` }}>
                  <div style={{ fontFamily: MONO, color: C.ink3, fontSize: 14, width: 16 }}>{i + 1}</div>
                  <div>{it}</div>
                </div>
              );
            })}
          </Card>
        );
      })}
    </div>
  );
};

export const S2Foundation: React.FC<{ short?: boolean }> = ({ short }) => {
  const { t } = useClock();
  const k = short ? 0.55 : 1;
  const swotAt = short ? 99 : 14.4;
  const wipe = ease(t, swotAt, swotAt + 0.6);
  return (
    <AbsoluteFill style={{ fontFamily: FONT }}>
      <Chrome place={UNIT} units={UNITS} fns={FUNCTIONS} seat={SEAT} tab="Strategy" secs={["Foundation", "SWOT", "Drivers", "Plan"]} sec={wipe > 0.5 ? "SWOT" : "Foundation"}>
        <div style={{ position: "absolute", inset: 24, display: "flex", gap: 20, alignItems: "flex-start", opacity: 1 - wipe, translate: `${-wipe * 80}px 0px` }}>
          <Who t={t} k={k} />
          <Aspiration t={t} k={k} />
        </div>
        {wipe > 0 ? <div style={{ position: "absolute", inset: 0, opacity: wipe, translate: `${(1 - wipe) * 80}px 0px` }}><Swot t={t} from={swotAt + 0.3} k={k} /></div> : null}
      </Chrome>
    </AbsoluteFill>
  );
};
