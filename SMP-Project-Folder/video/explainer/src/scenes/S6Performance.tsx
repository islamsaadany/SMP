import React from "react";
import { AbsoluteFill } from "remotion";
import { ease, useClock, enter, hold } from "../anim";
import { bandColor, bandOf, bandText, C, FONT, MONO } from "../theme";
import { Chrome, HeadlineCard, Label, Rail, Table, Chip, BandChip } from "../ui";
import { FUNCTIONS, KEY_MEASURES, PERF, PILLARS, SEAT, UNIT, UNITS } from "../data";

export const S6Performance: React.FC<{ short?: boolean }> = ({ short }) => {
  const { t } = useClock();
  const k = short ? 0.7 : 1;
  const inP = ease(t, 0, 0.5);
  const cardP = (i: number) => ease(t, 0.3 + i * 0.25, 0.9 + i * 0.25);
  const countP = ease(t, 0.8 * k, 3.0 * k);
  const legendP = ease(t, 5.4 * k, 6.0 * k);
  const railP = ease(t, 3.4 * k, 4.0 * k);
  const liftP = short ? 0 : hold(t, 12.6, 17.6, 0.6);
  const railFill = ease(t, (short ? 10 : 17.8) * k, (short ? 11 : 18.6) * k);
  const kmShown = (t - 7.0 * k) / 0.4;
  const km = KEY_MEASURES[1];
  const due = 60000, actual = 52000, annual = 120000;
  return (
    <AbsoluteFill style={{ fontFamily: FONT, opacity: inP }}>
      <Chrome place={UNIT} units={UNITS} fns={FUNCTIONS} seat={SEAT} tabs={["Strategy", "Performance", "Reporting"]} tab="Performance" reporting="open" rightTab={<><Chip border={C.gold} bg="transparent" color={C.ink} size={13}>Presentation ▾</Chip><Chip border={C.line} bg="transparent" color={C.ink} size={13}>Bands ▾</Chip></>}>
        <div style={{ position: "absolute", inset: "20px 24px" }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 20 }}>
            <HeadlineCard title="Key Objectives performance" value={PERF.ko} band={bandOf(PERF.ko)} delta={PERF.koDelta} p={cardP(0)} countP={countP} link="See the Key Objectives" subs={[["Objectives", "4"], ["Highest", "96%"], ["Lowest", "71%"]]} />
            <HeadlineCard title="Pillars performance" value={PERF.pillars} band={bandOf(PERF.pillars)} p={cardP(1)} countP={countP} link="See the Pillars" subs={[["Pillars", "4"], ["Highest", "92%"], ["Lowest", "61%"]]} />
            <HeadlineCard title="Execution performance" value={PERF.execution} band={bandOf(PERF.execution)} p={cardP(2)} countP={countP} link="See the breakdown" subs={[["Delivered", "62%"], ["Planned", "100%"], ["Variance", "−38"]]} />
          </div>
          <div style={{ display: "flex", gap: 24, alignItems: "center", margin: "14px 0", background: C.surface, border: `1px solid ${C.line}`, borderRadius: 10, padding: "8px 18px", ...enter(legendP, -8) }}>
            <Label>Bands</Label>
            {(["good", "attn", "bad"] as const).map((b, i) => (
              <div key={b} style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 16 }}><span style={{ width: 12, height: 12, borderRadius: 3, background: bandColor(b) }} /><b>{["On track", "Needs attention", "Off track"][i]}</b><span style={{ color: C.ink3 }}>{["90% and above", "70 to 89%", "below 70%"][i]}</span></div>
            ))}
            <div style={{ marginLeft: "auto", color: C.ink3, fontSize: 15 }}>Derived from the figures. Never typed.</div>
          </div>
          <div style={{ display: "flex", gap: 20, alignItems: "flex-start", opacity: railP }}>
            <Rail title="Pillars" items={PILLARS.map((p) => ({ id: p.id, name: p.name, right: <b style={{ color: bandText(bandOf(p.score)), fontSize: 17, opacity: railFill }}>{p.score}%</b> }))} open={0} foot="79% across 4 · execution 62%" />
            <div style={{ flex: 1, background: C.surface, border: `1px solid ${C.line}`, borderRadius: 10, overflow: "hidden" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 14, padding: "12px 24px", borderBottom: `1px solid ${C.line}`, borderLeft: `4px solid ${C.gold}`, background: C.surface2 }}>
                <span style={{ fontFamily: MONO, color: C.ink3, fontSize: 16 }}>{PILLARS[0].id}</span>
                <span style={{ fontSize: 22, fontWeight: 700 }}>{PILLARS[0].name}</span>
                <b style={{ marginLeft: "auto", color: bandText("attn"), fontSize: 20 }}>74%</b>
              </div>
              <div style={{ padding: "12px 24px 20px" }}>
                <Label style={{ marginBottom: 8 }}>Key measures</Label>
                <Table cols={[{ label: "#", width: 50, mono: true }, { label: "Key measure" }, { label: "Dir.", width: 80, align: "center", mono: true }, { label: "Annual target", width: 170, align: "right", mono: true }, { label: "Compile", width: 120, align: "center" }, { label: "YTD actual", width: 190, align: "right", mono: true }, { label: "Progress", width: 130, align: "right" }]} rows={KEY_MEASURES.map((m, i) => [i + 1, <b key="n">{m.name}</b>, m.dir, m.target, <span key="c" style={{ color: C.ink3 }}>{m.compile}</span>, <span key="a">{m.actual}<span style={{ display: "block", fontSize: 13, color: C.ink3 }}>due {m.ytdTarget}</span></span>, <b key="p" style={{ color: bandText(bandOf(m.progress)), fontSize: 20 }}>{m.progress}%</b>])} shown={kmShown} rowH={54} lift={liftP > 0.5 ? 1 : -1} />
              </div>
            </div>
          </div>
        </div>
        {/* the lifted row: how one number is made */}
        <div style={{ position: "absolute", left: 300, right: 300, top: 300, background: C.surface, border: `2px solid ${C.amber}`, borderRadius: 14, padding: "28px 36px", boxShadow: "0 30px 80px rgba(15,23,42,.35)", opacity: liftP, scale: String(0.96 + 0.04 * liftP) }}>
          <div style={{ display: "flex", alignItems: "baseline", gap: 16 }}><div style={{ fontSize: 28, fontWeight: 700 }}>{km.name}</div><Chip size={13}>Compiled · Sum</Chip><BandChip band="attn" style={{ marginLeft: "auto" }} /></div>
          <div style={{ marginTop: 26, position: "relative", height: 34, borderRadius: 8, background: C.surface2, overflow: "hidden" }}>
            <div style={{ position: "absolute", left: 0, top: 0, bottom: 0, width: `${(due / annual) * 100}%`, background: C.attnBg, borderRight: `2px dashed ${C.attn}` }} />
            <div style={{ position: "absolute", left: 0, top: 0, bottom: 0, width: `${(actual / annual) * 100 * liftP}%`, background: C.attn, opacity: 0.85 }} />
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", marginTop: 12, fontSize: 17, fontFamily: MONO }}>
            <div><span style={{ color: C.attnTx, fontWeight: 700 }}>Actual 52,000</span></div>
            <div style={{ position: "absolute", left: "50%", translate: "-50% 0", color: C.ink2 }}>Due by now · half the year · <b>60,000</b></div>
            <div style={{ color: C.ink3 }}>Annual target 120,000</div>
          </div>
          <div style={{ marginTop: 22, display: "flex", alignItems: "baseline", gap: 14, fontSize: 22, color: C.ink2 }}>
            <span>52,000 of the 60,000 due so far</span><span>→</span><b style={{ fontSize: 40, color: C.attnTx }}>87%</b><span style={{ fontSize: 16, color: C.ink3 }}>The target is prorated to today; the figure is never divided by the year.</span>
          </div>
        </div>
      </Chrome>
    </AbsoluteFill>
  );
};
