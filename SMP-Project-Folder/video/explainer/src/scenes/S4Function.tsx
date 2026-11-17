import React from "react";
import { AbsoluteFill } from "remotion";
import { ease, useClock, enter } from "../anim";
import { C, FONT, MONO } from "../theme";
import { Card, Chrome, Label, Rail, Table, Chip } from "../ui";
import { CEO, FN, FUNCTIONS, UNITS } from "../data";

export const S4Function: React.FC = () => {
  const { t } = useClock();
  const sec = t < 5.8 ? "Overview" : "Projects";
  const koP = ease(t, 1.6, 2.3);
  const koShown = (t - 2.2) / 0.7;
  const projP = ease(t, 6.0, 6.7);
  const delShown = (t - 8.6) / 0.6;
  const milShown = (t - 11.6) / 0.6;
  const p = FN.project;
  return (
    <AbsoluteFill style={{ fontFamily: FONT }}>
      <Chrome place={FN.name} side="fns" units={UNITS} fns={FUNCTIONS} seat={CEO} tab="Strategy" reporting="open" tabs={["Strategy", "Performance", "Reporting"]} secs={["Overview", "Projects"]} sec={sec}>
        {sec === "Overview" ? (
          <div style={{ position: "absolute", inset: 24 }}>
            <Card style={{ width: 900, ...enter(koP, 16) }}>
              <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 10 }}>
                <div style={{ fontSize: 22, fontWeight: 700 }}>Key Objectives</div>
                <Chip border={C.gold} bg="transparent" color={C.ink2} size={13}>Horizon · 2028</Chip>
              </div>
              <Table cols={[{ label: "Objective" }, { label: "By 2028", width: 170, align: "right", mono: true }, { label: "This year", width: 170, align: "right", mono: true }]} rows={FN.objectives.map((o) => [o.name, <span key="h" style={{ color: C.gold }}>{o.horizon}</span>, <b key="t">{o.thisYear}</b>])} shown={koShown} rowH={50} />
            </Card>
          </div>
        ) : (
          <div style={{ position: "absolute", inset: 24, display: "flex", gap: 20, alignItems: "flex-start", ...enter(projP, 16) }}>
            <Rail title="Projects" items={[{ id: p.id, name: p.name }, { id: "MKT02", name: "Trade communication programme" }]} open={0} />
            <div style={{ flex: 1, background: C.surface, border: `1px solid ${C.line}`, borderRadius: 10, overflow: "hidden" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 14, padding: "14px 24px", borderBottom: `1px solid ${C.line}`, borderLeft: `4px solid ${C.gold}`, background: C.surface2 }}>
                <span style={{ fontFamily: MONO, color: C.ink3, fontSize: 16 }}>{p.id}</span>
                <span style={{ fontSize: 24, fontWeight: 700 }}>{p.name}</span>
              </div>
              <div style={{ margin: 20, display: "flex", border: `1px solid ${C.line}`, borderRadius: 8, overflow: "hidden", opacity: ease(t, 6.6, 7.2) }}>
                <div style={{ width: 300, borderRight: `1px solid ${C.line}` }}>
                  {[["Owner", p.owner], ["Start", p.start], ["End", p.end]].map(([l, v], i) => (
                    <div key={l} style={{ display: "flex", gap: 20, padding: "10px 16px", borderTop: i ? `1px solid ${C.lineSoft}` : undefined, fontSize: 17 }}><Label style={{ width: 70, paddingTop: 3 }}>{l}</Label><b>{v}</b></div>
                  ))}
                </div>
                <div style={{ flex: 1, padding: "10px 20px", fontSize: 17 }}>
                  <div style={{ display: "flex", gap: 20 }}><Label style={{ width: 100, paddingTop: 3 }}>Brief</Label><div>{p.brief}</div></div>
                  <div style={{ display: "flex", gap: 20, marginTop: 14 }}><Label style={{ width: 100, paddingTop: 3 }}>Stakeholders</Label><Chip size={13}>Marketing</Chip></div>
                </div>
              </div>
              <div style={{ padding: "0 20px 8px", opacity: ease(t, 8.4, 8.8) }}>
                <Label style={{ marginBottom: 8 }}>Deliverables and outcomes <span style={{ fontWeight: 400, textTransform: "none", letterSpacing: 0, marginLeft: 8 }}>— what the project hands over, and what it is meant to change</span></Label>
                <Table cols={[{ label: "#", width: 50, mono: true }, { label: "Deliverables & outcomes" }, { label: "Type", width: 180, align: "center" }, { label: "Direction", width: 140, align: "center", mono: true }, { label: "Target", width: 140, align: "right", mono: true }]} rows={p.deliverables.map((d, i) => [i + 1, d.name, <span key="t" style={{ color: C.ink2 }}>{d.type}</span>, d.dir, d.target])} shown={delShown} rowH={46} />
              </div>
              <div style={{ padding: "12px 20px 20px", opacity: ease(t, 11.4, 11.8) }}>
                <Label style={{ marginBottom: 8 }}>Milestones <span style={{ fontWeight: 400, textTransform: "none", letterSpacing: 0, marginLeft: 8 }}>— the timeline as planned</span></Label>
                <Table cols={[{ label: "#", width: 50, mono: true }, { label: "Milestone" }, { label: "Owner", width: 220 }, { label: "Collabs.", width: 110, align: "center" }, { label: "Due date", width: 200, align: "right" }]} rows={p.milestones.map((m, i) => [i + 1, m.name, m.owner, <span key="c" style={{ color: C.ink3 }}>—</span>, <span key="d" style={{ fontWeight: 600, opacity: ease(t, 13.0 + i * 0.3, 13.4 + i * 0.3) }}>{m.due}</span>])} shown={milShown} rowH={46} />
              </div>
            </div>
          </div>
        )}
      </Chrome>
    </AbsoluteFill>
  );
};
