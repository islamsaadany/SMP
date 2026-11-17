import React from "react";
import { AbsoluteFill } from "remotion";
import { ease, useClock, enter } from "../anim";
import { bandOf, bandText, C, FONT, MONO } from "../theme";
import { Label, Mark, Chip } from "../ui";
import { DECK_SLIDES, FOUNDATION, GROUP, TEMPLE } from "../data";

const Slide: React.FC<{ scale?: number; title?: boolean }> = ({ scale = 1, title }) => (
  <div style={{ width: 1600 * scale, height: 900 * scale, background: C.surface, borderRadius: 6 * scale, boxShadow: "0 8px 30px rgba(15,23,42,.12)", padding: 60 * scale, position: "relative", overflow: "hidden" }}>
    {title ? (
      <div style={{ paddingTop: 200 * scale }}>
        <div style={{ fontSize: 24 * scale, fontWeight: 700, color: C.navyDeep, letterSpacing: "0.2em" }}>{GROUP.toUpperCase()}</div>
        <div style={{ fontSize: 120 * scale, fontWeight: 700, lineHeight: 1.05, marginTop: 20 * scale }}>Retail</div>
        <div style={{ width: 120 * scale, height: 5 * scale, background: C.gold, margin: `${30 * scale}px 0` }} />
        <div style={{ fontSize: 34 * scale, color: C.ink2 }}>Strategy review · H1 2026</div>
      </div>
    ) : (
      <>
        <div style={{ fontSize: 44 * scale, fontWeight: 700 }}>Key Objectives — where we stand</div>
        <div style={{ marginTop: 30 * scale, borderRadius: 6 * scale, overflow: "hidden", border: `1px solid ${C.line}` }}>
          <div style={{ display: "flex", background: C.navy, color: "#fff", fontSize: 14 * scale, letterSpacing: "0.12em", textTransform: "uppercase", fontWeight: 700 }}>
            {["#", "Objective", "Annual target", "Actual", "Progress"].map((h, i) => <div key={h} style={{ flex: i === 1 ? 1 : `0 0 ${[60, 0, 220, 220, 160][i] * scale}px`, padding: `${14 * scale}px ${18 * scale}px`, textAlign: i > 1 ? "right" : "left" }}>{h}</div>)}
          </div>
          {FOUNDATION.objectives.map((o, i) => {
            const act = ["1.9B EGP", "17 %", "116", "47"][i];
            const prog = [90, 94, 97, 104][i];
            return (
              <div key={o.name} style={{ display: "flex", fontSize: 24 * scale, background: i % 2 ? "#F6F8FB" : C.surface, borderTop: `1px solid ${C.lineSoft}`, alignItems: "center" }}>
                <div style={{ flex: `0 0 ${60 * scale}px`, padding: `${18 * scale}px`, color: C.ink3 }}>{i + 1}</div>
                <div style={{ flex: 1, padding: `${18 * scale}px` }}>{o.name}</div>
                <div style={{ flex: `0 0 ${220 * scale}px`, padding: `${18 * scale}px`, textAlign: "right", fontFamily: MONO }}>{o.thisYear}</div>
                <div style={{ flex: `0 0 ${220 * scale}px`, padding: `${18 * scale}px`, textAlign: "right", fontFamily: MONO }}>{act}<div style={{ fontSize: 14 * scale, color: C.ink3 }}>due {["2.1B EGP", "18 %", "120", "45"][i]}</div></div>
                <div style={{ flex: `0 0 ${160 * scale}px`, padding: `${18 * scale}px`, textAlign: "right", fontWeight: 700, color: bandText(bandOf(prog)) }}>{prog}%</div>
              </div>
            );
          })}
        </div>
      </>
    )}
    <div style={{ position: "absolute", left: 60 * scale, bottom: 40 * scale, fontSize: 16 * scale, fontWeight: 700, color: C.navyDeep, letterSpacing: "0.2em" }}>{GROUP.toUpperCase()}</div>
  </div>
);

const Temple: React.FC<{ t: number; from: number }> = ({ t, from }) => {
  const roof = ease(t, from, from + 0.8);
  const obj = ease(t, from + 0.8, from + 1.4);
  const themes = ease(t, from + 1.4, from + 2.2);
  const base = ease(t, from + 2.2, from + 2.8);
  return (
    <AbsoluteFill style={{ background: C.ground, padding: "0 60px" }}>
      <div style={{ height: 70, background: C.surface, borderBottom: `1px solid ${C.line}`, margin: "0 -60px", display: "flex", alignItems: "center", padding: "0 24px", gap: 14 }}><Mark size={34} /><b style={{ fontSize: 19 }}>Strategy Management Platform</b><span style={{ color: C.ink3 }}>| {GROUP}</span><span style={{ marginLeft: "auto", display: "flex", gap: 24, fontSize: 18, color: C.ink2 }}><span>Strategy</span><span>Performance</span><span>Focus</span><b style={{ color: C.ink, borderBottom: `3px solid ${C.amber}` }}>Temple</b></span></div>
      <div style={{ marginTop: 30, opacity: roof, scale: String(0.98 + 0.02 * roof) }}>
        <svg width="1800" height="70" viewBox="0 0 1800 70" style={{ display: "block" }}><polygon points="0,70 900,0 1800,70" fill={C.navy} /></svg>
        <div style={{ background: C.navy, color: "#fff", padding: "22px 60px", fontSize: 24, textAlign: "center", lineHeight: 1.4 }}>{TEMPLE.vision}</div>
      </div>
      <div style={{ background: C.surface, border: `1px solid ${C.line}`, borderTop: 0, padding: "20px 40px", ...enter(obj, 10) }}>
        <Label>Key objectives by 2028</Label>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", marginTop: 12 }}>
          {TEMPLE.objectives.map(([l, v]) => <div key={l}><Label size={12}>{l}</Label><div style={{ fontSize: 30, fontFamily: MONO, marginTop: 4 }}>{v}</div></div>)}
        </div>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 3, marginTop: 14 }}>
        {TEMPLE.themes.map(([code, name, note], i) => (
          <div key={code} style={{ background: C.navy, color: "#fff", padding: "22px 0", textAlign: "center", opacity: ease(t, from + 1.4 + i * 0.25, from + 1.8 + i * 0.25), translate: `0px ${(1 - ease(t, from + 1.4 + i * 0.25, from + 1.8 + i * 0.25)) * 16}px` }}>
            <div style={{ fontSize: 12, letterSpacing: "0.2em", color: C.amber, fontWeight: 700 }}>{code}</div>
            <div style={{ fontSize: 26, fontWeight: 700, marginTop: 4 }}>{name}</div>
            <div style={{ fontSize: 14, opacity: 0.8, marginTop: 4 }}>{note}</div>
          </div>
        ))}
      </div>
      <div style={{ marginTop: 14, background: C.surface, border: `1px solid ${C.line}`, borderTop: `3px solid ${C.gold}`, padding: "16px 40px", ...enter(base, 10), opacity: base * themes }}>
        <Label>Capabilities — cross-cutting, no theme</Label>
        <div style={{ display: "flex", gap: 14, marginTop: 10 }}>{TEMPLE.capabilities.map((c) => <div key={c} style={{ background: C.surface2, borderRadius: 8, padding: "12px 20px", fontSize: 18, fontWeight: 700, width: 380 }}>{c}<div style={{ fontSize: 13, fontWeight: 400, color: C.ink3 }}>2 Projects</div></div>)}</div>
      </div>
    </AbsoluteFill>
  );
};

export const S8Deck: React.FC<{ short?: boolean }> = ({ short }) => {
  const { t } = useClock();
  const k = short ? 0.6 : 1;
  const dealt = (t - 0.4) / (0.32 * k);
  const count = Math.min(28, Math.max(1, Math.floor(dealt)));
  const presentAt = short ? 4.6 : 8.4;
  const present = ease(t, presentAt, presentAt + 0.6);
  const pdfP = short ? 0 : ease(t, 12.4, 12.9) * (1 - ease(t, 13.6, 14.0));
  const templeAt = short ? 99 : 14.2;
  const temple = ease(t, templeAt, templeAt + 0.5);
  return (
    <AbsoluteFill style={{ fontFamily: FONT, background: C.ground, opacity: ease(t, 0, 0.4) }}>
      {/* the slides editor */}
      <AbsoluteFill style={{ opacity: 1 - present }}>
        <div style={{ height: 70, background: C.surface, borderBottom: `1px solid ${C.line}`, display: "flex", alignItems: "center", padding: "0 24px", gap: 16 }}>
          <div><div style={{ fontSize: 20, fontWeight: 700 }}>Retail</div><div style={{ fontSize: 14, color: C.ink3 }}>H1 2026</div></div>
          <div style={{ marginLeft: "auto", display: "flex", gap: 10, alignItems: "center" }}>
            <Chip border={C.line} bg={C.surface} color={C.ink} size={15}>▤ Slides</Chip><Chip border={C.line} bg={C.surface} color={C.ink} size={15}>▦ Grid</Chip>
            <div style={{ background: C.ink, color: "#fff", borderRadius: 8, padding: "9px 22px", fontSize: 16, fontWeight: 700, scale: String(1 + 0.08 * ease(t, presentAt - 0.4, presentAt)) }}>⛶ Present</div>
            <div style={{ position: "relative", border: `1px solid ${C.line}`, borderRadius: 8, padding: "8px 16px", fontSize: 15 }}>Download the presentation
              <div style={{ position: "absolute", left: "50%", top: "calc(100% + 10px)", translate: `-50% ${pdfP * 20}px`, opacity: pdfP, background: C.cta, color: "#fff", borderRadius: 8, padding: "8px 14px", fontSize: 15, fontWeight: 700, whiteSpace: "nowrap" }}>⬇ Retail — H1 2026.pdf</div>
            </div>
            <span style={{ color: C.ink3 }}>Done</span>
          </div>
        </div>
        <div style={{ position: "absolute", left: 0, top: 70, bottom: 60, width: 240, borderRight: `1px solid ${C.line}`, background: C.surface, padding: 12, overflow: "hidden" }}>
          {DECK_SLIDES.map((s, i) => {
            const p = Math.max(0, Math.min(1, dealt - i));
            const dark = ["Foundation", "SWOT", "Strategic Pillars"].includes(s);
            return (
              <div key={s} style={{ display: "flex", gap: 8, marginBottom: 10, opacity: p, translate: `${(1 - p) * -30}px 0px` }}>
                <div style={{ fontFamily: MONO, fontSize: 12, color: C.ink3, width: 18 }}>{i + 1}</div>
                <div style={{ flex: 1, height: 72, borderRadius: 4, background: dark ? C.navy : C.surface, border: `1px solid ${i === 4 ? C.gold : C.line}`, padding: 8, fontSize: 9, fontWeight: 700, color: dark ? "#fff" : C.ink }}>{s}</div>
              </div>
            );
          })}
        </div>
        <div style={{ position: "absolute", left: 270, top: 100, width: 1600 * 0.98, scale: "0.98", transformOrigin: "top left" }}><Slide scale={0.98} /></div>
        <div style={{ position: "absolute", left: 0, right: 0, bottom: 0, height: 60, background: C.surface, borderTop: `1px solid ${C.line}`, display: "flex", alignItems: "center", padding: "0 24px", gap: 16 }}>
          <div style={{ fontFamily: MONO, fontSize: 16, fontVariantNumeric: "tabular-nums" }}>{Math.min(count, 5)} / {count}</div>
          <b style={{ fontSize: 15 }}>Key Objectives — where we stand</b>
          <span style={{ marginLeft: "auto", fontSize: 13, color: C.ink3 }}>↑ ↓ move · G grid · P present · H hide · Esc done · assembled from the live plan, never stored</span>
        </div>
      </AbsoluteFill>
      {/* presenting */}
      <AbsoluteFill style={{ background: "#000", opacity: present, justifyContent: "center", alignItems: "center" }}>
        <Slide scale={1.2} />
      </AbsoluteFill>
      {temple > 0 ? <AbsoluteFill style={{ opacity: temple }}><Temple t={t} from={templeAt + 0.3} /></AbsoluteFill> : null}
    </AbsoluteFill>
  );
};
