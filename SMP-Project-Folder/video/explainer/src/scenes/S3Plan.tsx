import React from "react";
import { AbsoluteFill } from "remotion";
import { ease, useClock, enter, hold } from "../anim";
import { C, FONT, MONO } from "../theme";
import { Callout, Chrome, Label, Quarters, Rail, Table, Chip } from "../ui";
import { FUNCTIONS, KEY_MEASURES, PILLARS, SEAT, TACTICS, UNIT, UNITS } from "../data";

export const PlanPage: React.FC<{ t: number; k: number; readAt?: number }> = ({ t, k, readAt = 99 }) => {
  const railShown = (t - 0.4 * k) / (0.35 * k);
  const headP = ease(t, 2.0 * k, 2.6 * k);
  const kmShown = (t - 2.8 * k) / (0.6 * k);
  const tacShown = (t - 8.6 * k) / (0.7 * k);
  const litQ = t < 12.6 * k ? 4 : Math.min(4, Math.floor((t - 12.6 * k) / (0.35 * k)) + 1);
  const dirP = hold(t, 5.2 * k, 7.0 * k);
  const tgtP = hold(t, 7.0 * k, 8.6 * k);
  const ownP = hold(t, 11.2 * k, 12.6 * k);
  const qP = hold(t, 12.6 * k, 14.6 * k);
  const readP = ease(t, readAt, readAt + 0.7);
  return (
    <>
      <div style={{ position: "absolute", inset: 24, display: "flex", gap: 20, alignItems: "flex-start" }}>
        <Rail title="Pillars" items={PILLARS.map((p) => ({ id: p.id, name: p.name }))} open={0} shown={railShown} />
        <div style={{ flex: 1, background: C.surface, border: `1px solid ${C.line}`, borderRadius: 10, overflow: "hidden", ...enter(headP, 12) }}>
          <div style={{ display: "flex", alignItems: "center", gap: 14, padding: "14px 24px", borderBottom: `1px solid ${C.line}`, borderLeft: `4px solid ${C.gold}`, background: C.surface2 }}>
            <span style={{ fontFamily: MONO, color: C.ink3, fontSize: 16 }}>{PILLARS[0].id}</span>
            <span style={{ fontSize: 24, fontWeight: 700 }}>{PILLARS[0].name}</span>
            <Chip size={13} style={{ marginLeft: "auto" }}>Capability</Chip>
          </div>
          <div style={{ padding: "16px 24px 8px" }}>
            <Label style={{ marginBottom: 10 }}>Key measures <span style={{ fontFamily: MONO, marginLeft: 6, fontWeight: 400 }}>4</span></Label>
            <Table cols={[{ label: "#", width: 50, mono: true }, { label: "Key measure" }, { label: "Dir.", width: 110, align: "center", mono: true }, { label: "Target", width: 190, align: "right", mono: true }, { label: "Compiled", width: 150, align: "center" }]} rows={KEY_MEASURES.map((m, i) => [i + 1, <b key="n">{m.name}</b>, <u key="d" style={{ textDecorationStyle: "dotted", color: C.ink2 }}>{m.dir}</u>, m.target, <span key="c" style={{ color: C.ink3 }}>{m.compile}</span>])} shown={kmShown} rowH={48} />
          </div>
          <div style={{ padding: "16px 24px 20px", opacity: ease(t, 8.4 * k, 8.8 * k) }}>
            <Label style={{ marginBottom: 10 }}>Tactics <span style={{ fontFamily: MONO, marginLeft: 6, fontWeight: 400 }}>4</span></Label>
            <Table cols={[{ label: "#", width: 50, mono: true }, { label: "Tactic" }, { label: "Outcome" }, { label: "Target", width: 140, align: "right", mono: true }, { label: "Owner", width: 190 }, { label: "Collabs.", width: 110, align: "center" }, { label: "Quarters", width: 150 }]} rows={TACTICS.map((x, i) => [i + 1, <b key="n">{x.name}</b>, <b key="o">{x.outcome}</b>, x.target, x.owner, <span key="c" style={{ color: C.ink3 }}>—</span>, <Quarters key="q" on={x.quarters} lit={i === 2 ? litQ : 4} />])} shown={tacShown} rowH={48} />
          </div>
        </div>
      </div>
      {/* callouts, measured against the layout above */}
      <Callout x={1468} y={197} w={110} h={48 * 4 + 8} label="Direction: more or less is better" p={dirP} below />
      <Callout x={1578} y={197} w={190} h={48 * 4 + 8} label="Target, with its unit" p={tgtP} below />
      <Callout x={1395} y={536} w={190} h={48 * 4 + 8} label="Who owns it" p={ownP} />
      <Callout x={1618} y={536} w={150} h={48 * 4 + 8} label="Which quarters it runs in" p={qP} />
      {/* the reading window */}
      <div style={{ position: "absolute", inset: 0, background: `rgba(15,23,42,${0.6 * readP})`, opacity: readP > 0 ? 1 : 0 }} />
      <div style={{ position: "absolute", left: 160, right: 160, top: 60, bottom: 60, borderRadius: 14, overflow: "hidden", boxShadow: "0 30px 80px rgba(0,0,0,.4)", background: C.ground, opacity: readP, translate: `0px ${(1 - readP) * 60}px` }}>
        <div style={{ height: 56, background: C.navyDeep, color: "#fff", display: "flex", alignItems: "center", padding: "0 24px", gap: 14 }}>
          <div style={{ width: 26, height: 26, borderRadius: 7, background: C.amber }} />
          <b style={{ fontSize: 18 }}>Meridian Group</b>
          <span style={{ marginLeft: "auto", fontFamily: MONO, fontSize: 14, opacity: 0.8 }}>H1 2026</span>
          <Chip bg="transparent" border="#fff" color="#fff" size={12}>EXIT</Chip>
        </div>
        <div style={{ height: 50, background: C.navy, display: "flex", alignItems: "stretch", padding: "0 20px", gap: 4, color: "#fff" }}>
          {["Foundation", "Analysis", "Directions", "Overall performance"].map((x, i) => (
            <div key={x} style={{ display: "flex", alignItems: "center", padding: "0 16px", fontSize: 16, fontWeight: 600, background: i === 2 ? C.ground : "transparent", color: i === 2 ? C.ink : "#fff" }}>{x}</div>
          ))}
        </div>
        <div style={{ height: 4, background: C.amber }} />
        <div style={{ padding: 24, display: "flex", gap: 20 }}>
          <Rail title="Directions" items={PILLARS.map((p) => ({ id: p.id, name: p.name }))} open={0} width={230} />
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 22, fontWeight: 700, marginBottom: 10 }}>{PILLARS[0].id} · {PILLARS[0].name}</div>
            <Table cols={[{ label: "Key measure" }, { label: "Dir.", width: 90, align: "center", mono: true }, { label: "Target", width: 170, align: "right", mono: true }]} rows={KEY_MEASURES.map((m) => [m.name, m.dir, m.target])} rowH={44} size={17} />
            <div style={{ marginTop: 16, display: "flex", alignItems: "center", gap: 12, color: C.ink2, fontSize: 17 }}>
              <Chip border={C.gold} bg="transparent" color={C.ink2} size={12}>▤ READ</Chip> The whole plan, to read. Nothing here can be changed.
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export const S3Plan: React.FC<{ short?: boolean }> = ({ short }) => {
  const { t } = useClock();
  const k = short ? 0.7 : 1;
  return (
    <AbsoluteFill style={{ fontFamily: FONT }}>
      <Chrome place={UNIT} units={UNITS} fns={FUNCTIONS} seat={SEAT} tab="Strategy" secs={["Foundation", "SWOT", "Drivers", "Plan"]} sec="Plan">
        <PlanPage t={t} k={k} readAt={short ? 99 : 17.6} />
      </Chrome>
    </AbsoluteFill>
  );
};
