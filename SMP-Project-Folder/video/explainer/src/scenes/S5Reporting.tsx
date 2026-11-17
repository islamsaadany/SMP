import React from "react";
import { AbsoluteFill } from "remotion";
import { ease, useClock, enter, typed, countTo } from "../anim";
import { C, FONT, MONO } from "../theme";
import { Chrome, FigureBox, Label, NoteBox, Rail, Table, Chip } from "../ui";
import { FUNCTIONS, PILLARS, REPORT_KO, SEAT, UNIT, UNITS } from "../data";

const ASKED = 41;

export const S5Reporting: React.FC<{ short?: boolean }> = ({ short }) => {
  const { t } = useClock();
  const k = short ? 0.72 : 1;
  const lit = ease(t, 1.6 * k, 2.3 * k);
  const onTab = t >= 2.6 * k;
  const pageP = ease(t, 2.7 * k, 3.3 * k);
  // the four key-objective rows fill at these moments
  const fillAt = [5.4, 7.2, 9.0, 13.8].map((x) => x * k);
  const noteAt = 10.4 * k;
  // the rest of the plan (the pillars) is entered off screen between 14 and 21
  const baseline = 0;
  const koEntered = fillAt.filter((x) => t >= x).length;
  const restEntered = countTo(t, ASKED - 4, 14.8 * k, 21.0 * k);
  const entered = Math.min(ASKED, baseline + koEntered + restEntered);
  const ready = entered >= ASKED;
  const pressed = t >= 24.2 * k;
  const toastP = ease(t, 24.6 * k, 25.2 * k);
  const submitP = ease(t, 21.2 * k, 21.7 * k);
  const bar = entered / ASKED;
  return (
    <AbsoluteFill style={{ fontFamily: FONT }}>
      <Chrome place={UNIT} units={UNITS} fns={FUNCTIONS} seat={SEAT} tabs={["Strategy", "Performance", "Reporting"]} tab={onTab ? "Reporting" : "Strategy"} reporting="open" secs={onTab ? undefined : ["Foundation", "SWOT", "Drivers", "Plan"]} sec={onTab ? undefined : "Plan"}
        rightTab={onTab ? (
          <div style={{ display: "flex", alignItems: "center", gap: 14, background: C.surface, border: `1px solid ${C.line}`, borderRadius: 10, padding: "6px 14px" }}>
            <div style={{ fontSize: 18, fontVariantNumeric: "tabular-nums" }}><b>{entered}</b> <span style={{ color: C.ink3, fontSize: 14 }}>of {ASKED}</span></div>
            <div style={{ width: 120, height: 6, borderRadius: 3, background: C.surface2, overflow: "hidden" }}><div style={{ width: `${bar * 100}%`, height: "100%", background: ready ? C.good : C.attn }} /></div>
            <div style={{ position: "relative", padding: "8px 18px", borderRadius: 8, fontSize: 14, letterSpacing: "0.1em", fontWeight: 700, textTransform: "uppercase", background: ready ? (pressed ? C.ctaHover : C.cta) : C.surface2, color: ready ? "#fff" : C.ink3, scale: pressed ? "0.97" : String(1 + 0.04 * submitP) }}>
              Submit to the SMO
              {!ready ? <div style={{ position: "absolute", top: "calc(100% + 6px)", left: 0, fontSize: 12, letterSpacing: 0, textTransform: "none", fontWeight: 500, color: C.badTx, whiteSpace: "nowrap" }}>{ASKED - entered} figures still to enter</div> : null}
            </div>
            <div style={{ fontSize: 14, letterSpacing: "0.1em", fontWeight: 700, textTransform: "uppercase", color: C.cta }}>Save draft</div>
            <div style={{ fontSize: 14, color: C.ink2, textDecoration: "underline" }}>Close</div>
          </div>
        ) : undefined}>
        {!onTab ? (
          <div style={{ position: "absolute", inset: 24, display: "flex", gap: 20, opacity: 0.35 }}>
            <div style={{ width: 250, height: 420, background: C.surface, border: `1px solid ${C.line}`, borderRadius: 10 }} />
            <div style={{ flex: 1, height: 560, background: C.surface, border: `1px solid ${C.line}`, borderRadius: 10 }} />
          </div>
        ) : (
          <div style={{ position: "absolute", inset: "20px 24px", ...enter(pageP, 16) }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 10 }}>
              <div style={{ fontSize: 22, fontWeight: 700 }}>Key Objectives</div>
              <Chip border={koEntered === 4 ? C.good : C.line} bg={koEntered === 4 ? C.goodBg : C.surface} color={koEntered === 4 ? C.goodTx : C.ink2} size={13}>{koEntered}/4</Chip>
            </div>
            <Table
              cols={[{ label: "#", width: 50, mono: true }, { label: "Key objectives", width: 400 }, { label: "Dir.", width: 90, align: "center", mono: true }, { label: "YTD target", width: 220, align: "center", mono: true }, { label: "Reported", width: 300, align: "center" }, { label: "Note" }]}
              rowH={58}
              rows={REPORT_KO.map((r, i) => {
                const filled = t >= fillAt[i];
                const val = filled ? typed(r.value, t, fillAt[i], fillAt[i] + 0.5) : "";
                const note = i === 2 && t >= noteAt ? typed(r.note, t, noteAt, noteAt + 2.6 * k) : "";
                return [i + 1, <span key="n">{r.name}</span>, r.dir, <span key="y">{r.ytd}{r.of ? <span style={{ display: "block", fontSize: 13, color: C.ink3 }}>{r.of}</span> : null}</span>, <FigureBox key="f" value={val} unit={r.unit || undefined} filled={filled} />, <NoteBox key="o" text={note} />];
              })}
            />
            <div style={{ fontSize: 22, fontWeight: 700, margin: "22px 0 10px" }}>Pillars — Key measures and Tactics</div>
            <div style={{ display: "flex", gap: 20 }}>
              <Rail title="Pillars" items={PILLARS.map((p, i) => {
                const asked = [8, 10, 10, 9][i];
                const share = Math.round(Math.max(0, Math.min(asked, restEntered - [0, 8, 18, 28][i])));
                const done = share >= asked;
                return { id: p.id, name: p.name, right: <Chip size={12} border={done ? C.good : C.line} bg={done ? C.goodBg : C.surface} color={done ? C.goodTx : C.ink2}>{share}/{asked}</Chip> };
              })} open={0} foot="Tally is entries given of asked" />
              <div style={{ flex: 1, background: C.surface, border: `1px solid ${C.line}`, borderRadius: 10, padding: 20, color: C.ink3, fontSize: 16 }}>
                <Label>{PILLARS[0].id} · {PILLARS[0].name}</Label>
                <div style={{ marginTop: 10, fontFamily: MONO }}>4 key measures · 4 tactics asked</div>
                <div style={{ marginTop: 12, height: 120, borderRadius: 8, background: C.surface2 }} />
              </div>
            </div>
          </div>
        )}
        {/* a light coming on, over the tab */}
        <div style={{ position: "absolute", left: 204, top: -52, width: 150, height: 44, borderRadius: 10, boxShadow: `0 0 0 ${8 * (1 - lit)}px rgba(194,65,12,${0.4 * lit * (1 - lit) * 4})` }} />
        {/* the confirmation */}
        <div style={{ position: "absolute", left: "50%", top: 24, background: C.good, color: "#fff", borderRadius: 10, padding: "14px 24px", fontSize: 20, fontWeight: 600, boxShadow: "0 12px 30px rgba(15,23,42,.25)", opacity: toastP, translate: `-50% ${(toastP - 1) * 10}px` }}>✓ Submitted to the Strategy Management Office · {ASKED} of {ASKED} figures</div>
      </Chrome>
    </AbsoluteFill>
  );
};
