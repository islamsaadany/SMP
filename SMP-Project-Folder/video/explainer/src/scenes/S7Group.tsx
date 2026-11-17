import React from "react";
import { AbsoluteFill } from "remotion";
import { ease, useClock, useRealClock, enter } from "../anim";
import type { Marks } from "./S0Strategy";
import { bandOf, bandText, C, FONT, MONO } from "../theme";
import { Chrome, HeadlineCard, Label, Ring, Chip } from "../ui";
import { CEO, FUNCTIONS, GROUP_PERF, UNITS } from "../data";

const Where: React.FC<{ title: string; items: { name: string; value: number }[]; p: number; lit?: string }> = ({ title, items, p, lit }) => (
  <div style={{ marginTop: 18, ...enter(p, 10) }}>
    <Label style={{ marginBottom: 8 }}>{title}</Label>
    <div style={{ display: "flex", gap: 10 }}>
      {items.map((u) => (
        <div key={u.name} style={{ display: "flex", gap: 10, alignItems: "center", border: `1px solid ${u.name === lit ? C.amber : C.line}`, background: C.surface, borderRadius: 8, padding: "8px 16px", fontSize: 17 }}>
          {u.name} <b style={{ color: bandText(bandOf(u.value)), fontFamily: MONO }}>{u.value}%</b>
        </div>
      ))}
    </div>
  </div>
);

export const S7Group: React.FC<{ short?: boolean; marks?: Marks }> = ({ short, marks }) => {
  const { t } = useClock();
  const { t: tr } = useRealClock();
  const k = short ? 0.75 : 1;
  const fly = ease(t, 0.2, 1.6);
  /* the page turns on the voice's own words where they are known */
  const belowAt = marks?.below !== undefined ? marks.below - 0.3 : 6.6 * k;
  const cardsAt = marks?.click !== undefined ? marks.click - 0.2 : short ? 8.5 : 12.0;
  const view = tr < cardsAt ? "overall" : "cards";
  const cardP = (i: number) => ease(t, 1.6 + i * 0.3, 2.2 + i * 0.3);
  const countP = ease(t, 2.2 * k, 5.6 * k);
  const whereP = ease(tr, belowAt, belowAt + 0.7);
  const where2P = ease(tr, belowAt + 1.4, belowAt + 2.1);
  const ringP = ease(tr, cardsAt + 0.4, cardsAt + 2.6);
  return (
    <AbsoluteFill style={{ fontFamily: FONT }}>
      <Chrome place="Group" units={UNITS} fns={FUNCTIONS} seat={CEO} tabs={["Strategy", "Performance", "Temple"]} tab="Performance" rightTab={<Chip border={C.line} bg="transparent" color={C.ink} size={13}>Bands ▾</Chip>} secs={["Overall performance", "Business units", "Group Themes", "Capabilities"]} sec={view === "overall" ? "Overall performance" : "Business units"}>
        {view === "overall" ? (
          <div style={{ position: "absolute", inset: "20px 24px", opacity: ease(t, 1.2, 1.8) }}>
            <div style={{ fontSize: 24, fontWeight: 700, marginBottom: 14 }}>Overall performance</div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 20 }}>
              {GROUP_PERF.cards.slice(0, 3).map((c, i) => (
                <HeadlineCard key={c.title} title={c.title} value={c.value} band={bandOf(c.value)} delta={c.delta} sub={c.sub} p={cardP(i)} countP={countP} primary={i < 2} link="How this is calculated" />
              ))}
              <div />
              {GROUP_PERF.cards.slice(3).map((c, i) => (
                <HeadlineCard key={c.title} title={c.title} value={c.value} band={bandOf(c.value)} sub={c.sub} p={cardP(i + 3)} countP={countP} link="How this is calculated" />
              ))}
            </div>
            <Where title="Where to look next" items={GROUP_PERF.units} p={whereP} lit="Retail" />
            <Where title="Supporting functions — where to look next" items={GROUP_PERF.functions} p={where2P} />
          </div>
        ) : view === "cards" ? (
          <div style={{ position: "absolute", inset: "20px 24px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 16 }}><div style={{ fontSize: 24, fontWeight: 700 }}>Business units</div><Chip size={12} style={{ marginLeft: "auto" }} bg={C.navy} color="#fff">Cards</Chip><Chip size={12}>Table</Chip></div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: 20 }}>
              {[...GROUP_PERF.units].reverse().map((u) => (
                <div key={u.name} style={{ background: C.surface, border: `1px solid ${C.line}`, borderRadius: 12, overflow: "hidden" }}>
                  <div style={{ background: C.navy, color: "#fff", padding: "12px 16px", textAlign: "center" }}><div style={{ fontSize: 19, fontWeight: 700, textDecoration: "underline" }}>{u.name}</div><div style={{ fontSize: 12, opacity: 0.8 }}>4 pillars</div></div>
                  <div style={{ display: "flex", padding: 16, gap: 10 }}>
                    <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 8 }}><Label size={11}>Objectives</Label><Ring value={u.value} p={ringP} size={130} /></div>
                    <div style={{ width: 100, borderLeft: `1px solid ${C.lineSoft}`, paddingLeft: 12, fontSize: 13, color: C.ink2 }}>
                      <Label size={11}>Execution</Label>
                      <div style={{ fontSize: 24, fontWeight: 700, color: bandText(bandOf(u.exec)), marginTop: 4 }}>{Math.round(u.exec * ringP)}%</div>
                      <div style={{ fontSize: 11, letterSpacing: "0.1em", color: C.ink3 }}>OF PLAN</div>
                      {[["Delivered", `${u.exec}%`], ["Planned", "100%"], ["Variance", `−${100 - u.exec}`]].map(([l, v]) => (
                        <div key={l} style={{ display: "flex", justifyContent: "space-between", marginTop: 6 }}><span>{l}</span><b style={{ fontFamily: MONO, color: l === "Variance" ? C.badTx : C.ink }}>{v}</b></div>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : null}
        {/* the unit's figure flying up into the group */}
        <div style={{ position: "absolute", left: 760, top: 120 + (1 - fly) * 420, scale: String(1.3 - 0.5 * fly), opacity: fly < 1 ? 1 : 0, background: C.surface, border: `2px solid ${C.amber}`, borderRadius: 10, padding: "10px 20px", fontSize: 24, fontWeight: 700, boxShadow: "0 12px 30px rgba(15,23,42,.25)" }}>Retail <span style={{ color: C.attnTx, fontFamily: MONO }}>79%</span></div>
      </Chrome>
    </AbsoluteFill>
  );
};
