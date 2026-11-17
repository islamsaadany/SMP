import React from "react";
import { AbsoluteFill } from "remotion";
import { ease, useClock, enter } from "../anim";
import { C, FONT } from "../theme";
import { Chrome, Label, NavRow } from "../ui";
import { FUNCTIONS, GROUP, SEAT, UNIT, UNITS } from "../data";

/* The navigation row, large and alone, then the real chrome around it. */
export const S1Company: React.FC<{ short?: boolean }> = ({ short }) => {
  const { t, length } = useClock();
  const k = short ? 0.7 : 1; // the short cut speaks faster
  const groupP = ease(t, 0.6 * k, 1.4 * k);
  const unitsShown = (t - 3.2 * k) / (0.45 * k);
  const flip = t >= 7.4 * k;
  const fnsShown = flip ? (t - 7.6 * k) / (0.4 * k) : 0;
  const rowP = ease(t, 0.4 * k, 1.2 * k);
  const settle = ease(t, (short ? 10.0 : 12.2) * k, (short ? 11.2 : 13.6) * k);
  const seatP = ease(t, (short ? 11.2 : 14.2) * k, (short ? 11.8 : 15.0) * k);
  const fadeIn = ease(t, 0, 0.4);
  return (
    <AbsoluteFill style={{ background: C.ground, fontFamily: FONT, opacity: fadeIn }}>
      {/* the isolated row */}
      <AbsoluteFill style={{ justifyContent: "center", alignItems: "center", opacity: 1 - settle }}>
        <div style={{ width: 1500, scale: String(1.1 - 0.1 * settle) }}>
          <div style={{ display: "flex", justifyContent: "center", marginBottom: 26, ...enter(groupP, 12) }}>
            <div style={{ background: C.navy, color: "#fff", borderRadius: 12, padding: "16px 36px", fontSize: 30, fontWeight: 700 }}>{GROUP}</div>
          </div>
          <div style={{ opacity: rowP, borderRadius: 12, overflow: "hidden", boxShadow: "0 12px 40px rgba(15,23,42,.18)" }}>
            <NavRow place={UNIT} side={flip ? "fns" : "units"} units={UNITS} fns={FUNCTIONS} shown={flip ? fnsShown : unitsShown} />
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", marginTop: 20, padding: "0 10px" }}>
            <Label size={15} style={{ opacity: ease(t, 3.6 * k, 4.2 * k) }}>Business units · each with a plan of its own</Label>
            <Label size={15} style={{ opacity: ease(t, 7.8 * k, 8.4 * k) }}>Supporting functions · Finance, HR, Marketing, IT</Label>
          </div>
        </div>
      </AbsoluteFill>
      {/* the chrome it becomes */}
      <AbsoluteFill style={{ opacity: settle }}>
        <Chrome place={UNIT} units={UNITS} fns={FUNCTIONS} seat={SEAT} tab="Strategy" secs={["Foundation", "SWOT", "Drivers", "Plan"]} sec="Foundation">
          <div style={{ position: "absolute", left: 24, top: 24, right: 24, display: "flex", gap: 20, opacity: 0.35 }}>
            <div style={{ flex: 1, height: 300, background: C.surface, border: `1px solid ${C.line}`, borderRadius: 12 }} />
            <div style={{ flex: 1, height: 300, background: C.surface, border: `1px solid ${C.line}`, borderRadius: 12 }} />
          </div>
          <div style={{ position: "absolute", left: "50%", top: 150, background: C.navy, color: "#fff", borderRadius: 12, padding: "18px 34px", fontSize: 28, fontWeight: 600, boxShadow: "0 12px 40px rgba(15,23,42,.25)", opacity: seatP, translate: `-50% ${(1 - seatP) * 14}px` }}>
            Signed in as <b>{SEAT.name}</b>, {SEAT.role} <span style={{ opacity: 0.7, marginLeft: 10 }}>→ lands on Retail</span>
          </div>
        </Chrome>
      </AbsoluteFill>
      <AbsoluteFill style={{ background: C.ground, opacity: ease(t, length - 0.3, length, (x) => x), pointerEvents: "none" }} />
    </AbsoluteFill>
  );
};
