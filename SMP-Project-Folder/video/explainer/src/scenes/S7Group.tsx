import React from "react";
import { AbsoluteFill } from "remotion";
import { ease, useClock, enter } from "../anim";
import { bandOf, bandText, C, FONT, MONO } from "../theme";
import { Chrome, HeadlineCard, Label, Ring, Table, Chip } from "../ui";
import { CEO, FOCUS, FUNCTIONS, GROUP_PERF, UNITS } from "../data";

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

export const S7Group: React.FC<{ short?: boolean }> = ({ short }) => {
  const { t } = useClock();
  const k = short ? 0.75 : 1;
  const fly = ease(t, 0.2, 1.6);
  const view = short ? (t < 8.5 ? "overall" : "cards") : t < 12.0 ? "overall" : t < 17.0 ? "cards" : "focus";
  const cardP = (i: number) => ease(t, 1.6 + i * 0.3, 2.2 + i * 0.3);
  const countP = ease(t, 2.2 * k, 5.6 * k);
  const whereP = ease(t, 6.6 * k, 7.3 * k);
  const where2P = ease(t, 8.6 * k, 9.3 * k);
  const cardsAt = short ? 8.5 : 12.0;
  const ringP = ease(t, cardsAt + 0.4, cardsAt + 2.6);
  const focusAt = 17.0;
  const chipP = (i: number) => ease(t, focusAt + 0.6 + i * 0.3, focusAt + 1.0 + i * 0.3);
  return (
    <AbsoluteFill style={{ fontFamily: FONT }}>
      <Chrome place="Group" units={UNITS} fns={FUNCTIONS} seat={CEO} tabs={["Strategy", "Performance", "Focus", "Temple"]} tab={view === "focus" ? "Focus" : "Performance"} rightTab={<Chip border={C.line} bg="transparent" color={C.ink} size={13}>Bands ▾</Chip>} secs={view !== "focus" ? ["Overall performance", "Business units", "Group Themes", "Capabilities"] : undefined} sec={view === "overall" ? "Overall performance" : view === "cards" ? "Business units" : undefined}>
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
        ) : (
          <div style={{ position: "absolute", inset: "20px 24px", opacity: ease(t, focusAt, focusAt + 0.5) }}>
            <div style={{ background: C.surface, border: `1px solid ${C.line}`, borderRadius: 10, padding: "10px 18px", display: "flex", justifyContent: "space-between", fontSize: 14 }}>
              <Label>◆ Cycle 2026</Label><span style={{ color: C.ink3 }}>reward begins at 100% of target · open for marking</span>
            </div>
            <div style={{ background: C.surface, border: `1px solid ${C.line}`, borderRadius: 10, padding: "10px 18px", display: "flex", alignItems: "center", gap: 16, marginTop: 8 }}>
              <span style={{ fontSize: 30, fontWeight: 700, color: C.goodTx }}>4</span><span style={{ fontSize: 18, color: C.ink2 }}>of 6</span><Label>Earning</Label>
              <Chip bg={C.goodBg} color={C.goodTx} size={12}>4 earning</Chip><Chip bg={C.badBg} color={C.badTx} size={12}>2 short</Chip>
            </div>
            <div style={{ fontSize: 24, fontWeight: 700, margin: "18px 0 10px" }}>Focus measures</div>
            <Table cols={[{ label: "Where", width: 200 }, { label: "Focus measure" }, { label: "Source", width: 170, align: "center" }, { label: "Target", width: 150, align: "center", mono: true }, { label: "Actual", width: 150, align: "center", mono: true }, { label: "Progress", width: 150, align: "center" }, { label: "Standing", width: 180, align: "center" }]} rows={FOCUS.map((f, i) => [<b key="w">{f.where}</b>, f.name, <span key="s" style={{ fontSize: 13, color: C.ink3 }}>{f.source}</span>, f.target, f.actual, <b key="p">{f.progress}%</b>, <div key="c" style={{ opacity: chipP(i), scale: String(0.8 + 0.2 * chipP(i)) }}><Chip bg={f.earning ? C.goodBg : C.badBg} color={f.earning ? C.goodTx : C.badTx} border={f.earning ? C.good : C.bad} size={12}>{f.earning ? "EARNING" : "SHORT"}</Chip></div>])} rowH={50} />
          </div>
        )}
        {/* the unit's figure flying up into the group */}
        <div style={{ position: "absolute", left: 760, top: 120 + (1 - fly) * 420, scale: String(1.3 - 0.5 * fly), opacity: fly < 1 ? 1 : 0, background: C.surface, border: `2px solid ${C.amber}`, borderRadius: 10, padding: "10px 20px", fontSize: 24, fontWeight: 700, boxShadow: "0 12px 30px rgba(15,23,42,.25)" }}>Retail <span style={{ color: C.attnTx, fontFamily: MONO }}>79%</span></div>
      </Chrome>
    </AbsoluteFill>
  );
};
