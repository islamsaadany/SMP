import React from "react";
import { AbsoluteFill } from "remotion";
import { ease, useRealClock, enter, typed, countTo } from "../anim";
import { C, FONT, MONO } from "../theme";
import { Chrome, FigureBox, Label, NoteBox, Quarters, Rail, Table, Chip } from "../ui";
import { FUNCTIONS, KEY_MEASURES, PILLARS, REPORT_KO, SEAT, TACTICS, UNIT, UNITS } from "../data";
import type { Marks } from "./S0Strategy";

const ASKED = 41;
const PILLAR_ASKED = [8, 10, 10, 9];

/* The reporting cycle: the tab lights, the owner fills the key objectives,
   then each pillar's key measures and tactics, the count climbs, Submit
   opens when everything is in. Moves on the voice's words where known. */
export const S5Reporting: React.FC<{ short?: boolean; marks?: Marks }> = ({ short, marks }) => {
  const { t: tr } = useRealClock();
  const k = short ? 0.72 : 1;
  const m = (w: string, fb: number) => (marks && marks[w] !== undefined ? marks[w] : fb);
  // the beats, in real seconds
  const litAt = m("orange", 2.0 * k);
  const entersAt = m("enters", 5.0 * k);
  const noteAt = m("note", 10.4 * k);
  const pillarAt = m("pillar", 14.0 * k);
  const kmAt = m("measures", pillarAt + 1.2);
  const tacAt = m("tactics", kmAt + 1.6);
  const countAt = m("count", tacAt + 3.0);
  const heldAt = m("held", countAt + 3.0);
  const completeAt = m("complete", heldAt + 5.0);
  const lit = ease(tr, litAt - 0.3, litAt + 0.4);
  const onTab = tr >= litAt + 0.5;
  const pageP = ease(tr, litAt + 0.6, litAt + 1.2);
  const koFillAt = [entersAt + 0.3, entersAt + 1.2, entersAt + 2.1, noteAt + 2.8];
  const koEntered = koFillAt.filter((x) => tr >= x).length;
  // the pillar pass: RT01's rows fill on screen, the other pillars off screen
  const kmFillAt = KEY_MEASURES.map((_, i) => kmAt + 0.1 + i * 0.3);
  const tacFillAt = TACTICS.map((_, i) => tacAt + 0.1 + i * 0.3);
  const rt01 = kmFillAt.filter((x) => tr >= x).length + tacFillAt.filter((x) => tr >= x).length;
  // 25 of the other pillars' 29 are in by the time Submit is said to be held; the last 4 land on "complete"
  const others = countTo(tr, 25, tacAt + 1.2, heldAt - 0.4) + countTo(tr, 4, completeAt - 0.8, completeAt);
  const entered = Math.min(ASKED, koEntered + rt01 + Math.min(29, others));
  const ready = entered >= ASKED;
  const pressed = tr >= completeAt + 0.9;
  const toastP = ease(tr, completeAt + 1.2, completeAt + 1.8);
  const submitP = ease(tr, completeAt + 0.1, completeAt + 0.5);
  const bar = entered / ASKED;
  // the page scrolls to the pillars as the voice reaches them
  const scroll = ease(tr, pillarAt - 0.2, pillarAt + 0.8) * 470;
  const pillarShare = (i: number) => (i === 0 ? rt01 : Math.round(Math.max(0, Math.min(PILLAR_ASKED[i], others - [0, 0, 10, 20][i]))));
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
          <div style={{ position: "absolute", left: 24, right: 24, top: 20, ...enter(pageP, 16), translate: `0px ${-scroll}px` }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 10 }}>
              <div style={{ fontSize: 22, fontWeight: 700 }}>Key Objectives</div>
              <Chip border={koEntered === 4 ? C.good : C.line} bg={koEntered === 4 ? C.goodBg : C.surface} color={koEntered === 4 ? C.goodTx : C.ink2} size={13}>{koEntered}/4</Chip>
            </div>
            <Table
              cols={[{ label: "#", width: 50, mono: true }, { label: "Key objectives", width: 400 }, { label: "Dir.", width: 90, align: "center", mono: true }, { label: "YTD target", width: 220, align: "center", mono: true }, { label: "Reported", width: 300, align: "center" }, { label: "Note" }]}
              rowH={58}
              rows={REPORT_KO.map((r, i) => {
                const filled = tr >= koFillAt[i];
                const val = filled ? typed(r.value, tr, koFillAt[i], koFillAt[i] + 0.5) : "";
                const note = i === 2 && tr >= noteAt ? typed(r.note, tr, noteAt, noteAt + 2.6) : "";
                return [i + 1, <span key="n">{r.name}</span>, r.dir, <span key="y">{r.ytd}{r.of ? <span style={{ display: "block", fontSize: 13, color: C.ink3 }}>{r.of}</span> : null}</span>, <FigureBox key="f" value={val} unit={r.unit || undefined} filled={filled} />, <NoteBox key="o" text={note} />];
              })}
            />
            <div style={{ fontSize: 22, fontWeight: 700, margin: "22px 0 10px" }}>Pillars — Key measures and Tactics</div>
            <div style={{ display: "flex", gap: 20, alignItems: "flex-start" }}>
              <Rail title="Pillars" items={PILLARS.map((p, i) => {
                const share = pillarShare(i);
                const done = share >= PILLAR_ASKED[i];
                return { id: p.id, name: p.name, right: <Chip size={12} border={done ? C.good : C.line} bg={done ? C.goodBg : C.surface} color={done ? C.goodTx : C.ink2}>{share}/{PILLAR_ASKED[i]}</Chip> };
              })} open={0} foot="Tally is entries given of asked" />
              <div style={{ flex: 1, background: C.surface, border: `1px solid ${C.line}`, borderRadius: 10, overflow: "hidden" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 14, padding: "12px 24px", borderBottom: `1px solid ${C.line}`, borderLeft: `4px solid ${C.gold}`, background: C.surface2 }}>
                  <span style={{ fontFamily: MONO, color: C.ink3, fontSize: 16 }}>{PILLARS[0].id}</span>
                  <span style={{ fontSize: 22, fontWeight: 700 }}>{PILLARS[0].name}</span>
                  <span style={{ marginLeft: "auto", fontSize: 14, color: C.ink3 }}>4 key measures · 4 tactics asked</span>
                  <Chip size={12} border={rt01 >= 8 ? C.good : C.line} bg={rt01 >= 8 ? C.goodBg : C.surface} color={rt01 >= 8 ? C.goodTx : C.ink2}>{rt01}/8</Chip>
                </div>
                <div style={{ padding: "12px 24px 4px" }}>
                  <Label style={{ marginBottom: 8 }}>Key measures</Label>
                  <Table cols={[{ label: "#", width: 50, mono: true }, { label: "Key measure" }, { label: "Dir.", width: 80, align: "center", mono: true }, { label: "YTD target", width: 170, align: "center", mono: true }, { label: "Reported", width: 230, align: "center" }, { label: "Note", width: 420 }]} rowH={54}
                    rows={KEY_MEASURES.map((km, i) => {
                      const filled = tr >= kmFillAt[i];
                      const [num, unit] = km.actual.split(" ");
                      return [i + 1, <b key="n">{km.name}</b>, km.dir, km.ytdTarget, <FigureBox key="f" value={filled ? typed(num, tr, kmFillAt[i], kmFillAt[i] + 0.3) : ""} unit={unit} filled={filled} width={100} />, <NoteBox key="o" text={i === 0 && tr >= kmFillAt[0] + 0.4 ? typed("Online store launched in May; share recovering since.", tr, kmFillAt[0] + 0.4, kmFillAt[0] + 1.6) : ""} />];
                    })} />
                </div>
                <div style={{ padding: "12px 24px 20px" }}>
                  <Label style={{ marginBottom: 8 }}>Tactics</Label>
                  <Table cols={[{ label: "#", width: 50, mono: true }, { label: "Tactic" }, { label: "Outcome", width: 280 }, { label: "Quarters", width: 150 }, { label: "YTD target", width: 170, align: "center", mono: true }, { label: "Reported", width: 230, align: "center" }, { label: "Note", width: 300 }]} rowH={54}
                    rows={TACTICS.map((x, i) => {
                      const filled = tr >= tacFillAt[i];
                      return [i + 1, <b key="n">{x.name}</b>, <b key="o">{x.outcome}</b>, <Quarters key="q" on={x.quarters} />, x.target.replace(" #", ""), <FigureBox key="f" value={filled ? typed(x.actual, tr, tacFillAt[i], tacFillAt[i] + 0.3) : ""} unit="#" filled={filled} width={100} />, <NoteBox key="e" text="" />];
                    })} />
                </div>
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
