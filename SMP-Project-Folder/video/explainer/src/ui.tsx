import React from "react";
import { AbsoluteFill } from "remotion";
import { Band, bandBg, bandColor, bandLabel, bandText, C, FONT, MONO } from "./theme";
import { GROUP } from "./data";

/* ── The mark ───────────────────────────────────────────── */
export const Mark: React.FC<{ size?: number; draw?: number; tile?: number }> = ({ size = 40, draw = 1, tile = 1 }) => {
  const len = 70; // path length of the star, roughly
  return (
    <div style={{ width: size, height: size, position: "relative", flex: "none" }}>
      <div style={{ position: "absolute", inset: 0, borderRadius: size * 0.28, background: C.amber, scale: String(tile), opacity: tile }} />
      <svg viewBox="0 0 24 24" style={{ position: "absolute", inset: size * 0.14, width: size * 0.72, height: size * 0.72 }} fill="none" stroke={C.navyDeep} strokeWidth={1.9} strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 2.8 13.9 10.1 21.2 12 13.9 13.9 12 21.2 10.1 13.9 2.8 12 10.1 10.1z" strokeDasharray={len} strokeDashoffset={len * (1 - draw)} />
        <circle cx="12" cy="12" r="1.3" opacity={draw > 0.95 ? 1 : 0} />
      </svg>
    </div>
  );
};

/* ── Labels and chips ───────────────────────────────────── */
export const Label: React.FC<{ children: React.ReactNode; color?: string; size?: number; style?: React.CSSProperties }> = ({ children, color = C.ink3, size = 13, style }) => (
  <div style={{ fontSize: size, letterSpacing: "0.12em", textTransform: "uppercase", fontWeight: 700, color, ...style }}>{children}</div>
);

export const Chip: React.FC<{ children: React.ReactNode; bg?: string; color?: string; border?: string; size?: number; style?: React.CSSProperties }> = ({ children, bg = C.surface2, color = C.ink2, border, size = 15, style }) => (
  <div style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "3px 12px", borderRadius: 999, background: bg, color, fontSize: size, fontWeight: 600, border: border ? `1px solid ${border}` : undefined, whiteSpace: "nowrap", ...style }}>{children}</div>
);

export const BandChip: React.FC<{ band: Band; size?: number; style?: React.CSSProperties }> = ({ band, size = 15, style }) => (
  <Chip bg={bandBg(band)} color={bandText(band)} size={size} style={style}>{bandLabel(band)}</Chip>
);

/* ── Cards ───────────────────────────────────────────────── */
export const Card: React.FC<{ children: React.ReactNode; style?: React.CSSProperties; pad?: number }> = ({ children, style, pad = 24 }) => (
  <div style={{ background: C.surface, border: `1px solid ${C.line}`, borderRadius: 12, padding: pad, boxShadow: "0 1px 3px rgb(15 23 42 / .06)", ...style }}>{children}</div>
);

export const HeadlineCard: React.FC<{ title: string; value: number; band: Band; delta?: number; sub?: string; subs?: [string, string][]; p?: number; countP?: number; link?: string; style?: React.CSSProperties; unit?: string; primary?: boolean }> = ({ title, value, band, delta, sub, subs, p = 1, countP = 1, link, style, unit = "%", primary }) => (
  <Card style={{ opacity: p, translate: `0px ${(1 - p) * 20}px`, border: primary ? `2px solid ${C.navy}` : undefined, ...style }}>
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
      <div style={{ fontSize: 19, fontWeight: 700, color: C.ink }}>{title}</div>
      <div style={{ opacity: countP >= 1 ? 1 : 0 }}><BandChip band={band} /></div>
    </div>
    <div style={{ display: "flex", alignItems: "baseline", gap: 10, marginTop: 10 }}>
      <div style={{ fontSize: 56, fontWeight: 700, color: bandText(band), lineHeight: 1, fontVariantNumeric: "tabular-nums" }}>
        {Math.round(value * countP)}<span style={{ fontSize: 22, marginLeft: 2 }}>{unit}</span>
      </div>
      {delta !== undefined && countP >= 1 ? <div style={{ fontSize: 16, color: C.goodTx, fontWeight: 600 }}>▲ {delta}</div> : null}
      {link ? <div style={{ marginLeft: "auto", fontSize: 15, color: C.ink2, textDecoration: "underline" }}>{link} →</div> : null}
    </div>
    {sub ? <div style={{ marginTop: 10, height: 6, borderRadius: 3, background: C.surface2, overflow: "hidden" }}><div style={{ width: `${Math.min(100, value) * countP}%`, height: "100%", background: bandColor(band) }} /></div> : null}
    {sub ? <div style={{ marginTop: 10, fontSize: 15, color: C.ink2 }}>{sub}</div> : null}
    {subs ? (
      <div style={{ display: "flex", gap: 40, marginTop: 18 }}>
        {subs.map(([l, v]) => (
          <div key={l}><Label size={11}>{l}</Label><div style={{ fontSize: 17, fontWeight: 600, marginTop: 2, fontFamily: MONO, color: C.ink }}>{v}</div></div>
        ))}
      </div>
    ) : null}
  </Card>
);

/* ── Table ───────────────────────────────────────────────── */
export type Col = { label: string; width?: number | string; align?: "left" | "right" | "center"; mono?: boolean };
export const Table: React.FC<{ cols: Col[]; rows: React.ReactNode[][]; shown?: number; size?: number; rowH?: number; style?: React.CSSProperties; lift?: number }> = ({ cols, rows, shown = rows.length, size = 18, rowH = 52, style, lift = -1 }) => (
  <div style={{ border: `1px solid ${C.line}`, borderRadius: 8, overflow: "hidden", fontSize: size, ...style }}>
    <div style={{ display: "flex", background: C.navy, color: C.navyInk }}>
      {cols.map((c, i) => (
        <div key={i} style={{ flex: c.width ? `0 0 ${typeof c.width === "number" ? c.width + "px" : c.width}` : 1, padding: "10px 14px", fontSize: 12, letterSpacing: "0.12em", textTransform: "uppercase", fontWeight: 700, textAlign: c.align ?? "left" }}>{c.label}</div>
      ))}
    </div>
    {rows.map((r, ri) => {
      const p = Math.max(0, Math.min(1, shown - ri));
      const lifted = lift === ri;
      return (
        <div key={ri} style={{ display: "flex", alignItems: "center", minHeight: rowH, background: lifted ? C.attnBg : ri % 2 ? "#F6F8FB" : C.surface, borderTop: `1px solid ${C.lineSoft}`, opacity: p, translate: `${(1 - p) * -12}px 0px`, outline: lifted ? `2px solid ${C.amber}` : undefined, outlineOffset: -2 }}>
          {r.map((cell, ci) => {
            const c = cols[ci];
            return <div key={ci} style={{ flex: c.width ? `0 0 ${typeof c.width === "number" ? c.width + "px" : c.width}` : 1, padding: "8px 14px", textAlign: c.align ?? "left", fontFamily: c.mono ? MONO : undefined, color: C.ink, minWidth: 0 }}>{cell}</div>;
          })}
        </div>
      );
    })}
  </div>
);

/* ── Quarter chips, a figure box, a note box ────────────── */
export const Quarters: React.FC<{ on: number[]; lit?: number }> = ({ on, lit = 4 }) => (
  <div style={{ display: "flex", gap: 4 }}>
    {[1, 2, 3, 4].map((q) => {
      const isOn = on.includes(q) && q <= lit;
      return <div key={q} style={{ width: 26, height: 26, borderRadius: 6, border: `1.5px solid ${isOn ? C.gold : C.line}`, background: isOn ? C.attnBg : C.surface, color: isOn ? C.ink : C.ink3, fontSize: 13, fontWeight: 700, display: "grid", placeItems: "center", fontFamily: MONO }}>{q}</div>;
    })}
  </div>
);

export const FigureBox: React.FC<{ value: string; unit?: string; filled: boolean; width?: number }> = ({ value, unit, filled, width = 120 }) => (
  <div style={{ display: "inline-flex", alignItems: "center", border: `1.5px solid ${filled ? C.good : C.line}`, background: filled ? C.goodBg : C.surface, borderRadius: 8, height: 40, overflow: "hidden" }}>
    <div style={{ width, padding: "0 12px", textAlign: "right", fontFamily: MONO, fontSize: 18, color: C.ink }}>{value}</div>
    {unit !== undefined ? <div style={{ padding: "0 10px", height: "100%", display: "grid", placeItems: "center", borderLeft: `1px solid ${filled ? C.good : C.line}`, fontSize: 13, color: C.ink3, fontFamily: MONO }}>{unit || " "}</div> : null}
  </div>
);

export const NoteBox: React.FC<{ text: string; width?: number | string }> = ({ text, width = "100%" }) => (
  <div style={{ width, border: `1.5px solid ${text ? C.line : C.lineSoft}`, borderRadius: 8, height: 40, padding: "0 12px", display: "flex", alignItems: "center", fontSize: 16, color: text ? C.ink : C.ink3, background: C.surface, fontStyle: text ? "normal" : "italic", overflow: "hidden", whiteSpace: "nowrap" }}>{text || "Note, if there is one"}</div>
);

/* ── Ring ───────────────────────────────────────────────── */
export const Ring: React.FC<{ value: number; p?: number; size?: number; band?: Band }> = ({ value, p = 1, size = 150, band }) => {
  const b = band ?? (value >= 90 ? "good" : value >= 70 ? "attn" : "bad");
  const r = size / 2 - 10;
  const circ = 2 * Math.PI * r;
  const v = Math.min(100, value) * p;
  return (
    <div style={{ position: "relative", width: size, height: size }}>
      <svg width={size} height={size} style={{ rotate: "-90deg" }}>
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={C.surface2} strokeWidth={12} />
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={bandColor(b)} strokeWidth={12} strokeDasharray={circ} strokeDashoffset={circ * (1 - v / 100)} strokeLinecap="butt" />
      </svg>
      <div style={{ position: "absolute", inset: 0, display: "grid", placeItems: "center", fontSize: size * 0.24, fontWeight: 700, color: C.ink, fontVariantNumeric: "tabular-nums" }}>{Math.round(value * p)}<span style={{ fontSize: size * 0.11 }}>%</span></div>
    </div>
  );
};

/* ── The platform's chrome ──────────────────────────────── */
export type ChromeProps = {
  children?: React.ReactNode;
  place: string;
  side?: "units" | "fns";
  units?: string[];
  fns?: string[];
  tabs?: string[];
  tab?: string;
  reporting?: "closed" | "open";
  secs?: string[];
  sec?: string;
  seat?: { name: string; role: string };
  rowOnly?: boolean;
  hideRow?: boolean;
  rightTab?: React.ReactNode;
  dim?: number;
  navP?: number;
};

export const TopBar: React.FC<{ seat?: { name: string; role: string } }> = ({ seat }) => (
  <div style={{ height: 60, background: C.surface, borderBottom: `1px solid ${C.line}`, display: "flex", alignItems: "center", padding: "0 24px", gap: 14 }}>
    <Mark size={34} />
    <div style={{ fontSize: 19, fontWeight: 700, color: C.ink }}>Strategy Management Platform</div>
    <div style={{ width: 1, height: 22, background: C.line }} />
    <div style={{ fontSize: 16, color: C.ink3 }}>{GROUP}</div>
    <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 10 }}>
      {seat ? (
        <>
          <Label size={11}>Viewing as</Label>
          <div style={{ border: `1px solid ${C.line}`, borderRadius: 8, padding: "4px 12px", fontSize: 15, fontWeight: 600, color: C.ink }}>{seat.name} ▾</div>
          <div style={{ fontSize: 14, color: C.ink3 }}>{seat.role}</div>
        </>
      ) : null}
      <div style={{ marginLeft: 14, border: `1.5px solid ${C.gold}`, borderRadius: 999, padding: "3px 12px", fontSize: 12, letterSpacing: "0.12em", fontWeight: 700, color: C.ink }}>▤ READ</div>
    </div>
  </div>
);

export const NavRow: React.FC<{ place: string; side?: "units" | "fns"; units?: string[]; fns?: string[]; scale?: number; shown?: number; switchP?: number; style?: React.CSSProperties; groupActive?: boolean }> = ({ place, side = "units", units = [], fns = [], shown = 99, style, groupActive }) => {
  const names = side === "units" ? units : fns;
  return (
    <div style={{ height: 66, background: C.navy, display: "flex", alignItems: "stretch", padding: "0 20px", gap: 10, color: C.navyInk, ...style }}>
      <div style={{ display: "flex", alignItems: "center", padding: "0 14px", fontSize: 18, fontWeight: 700, borderBottom: groupActive ? `3px solid ${C.amber}` : "3px solid transparent", borderTop: "3px solid transparent" }}>Group ▾</div>
      <div style={{ alignSelf: "center", width: 1, height: 28, background: "rgba(255,255,255,.2)" }} />
      <div style={{ alignSelf: "center", display: "flex", background: "rgba(255,255,255,.1)", borderRadius: 8, padding: 3 }}>
        <div style={{ padding: "5px 14px", borderRadius: 6, fontSize: 16, fontWeight: 700, background: side === "units" ? "rgba(255,255,255,.22)" : "transparent", color: side === "units" ? "#fff" : "rgba(255,255,255,.7)" }}>Units</div>
        <div style={{ padding: "5px 14px", borderRadius: 6, fontSize: 16, fontWeight: 700, background: side === "fns" ? "rgba(255,255,255,.22)" : "transparent", color: side === "fns" ? "#fff" : "rgba(255,255,255,.7)" }}>Functions</div>
      </div>
      <div style={{ width: 8 }} />
      {names.map((n, i) => {
        const p = Math.max(0, Math.min(1, shown - i));
        const active = n === place;
        return (
          <div key={n} style={{ display: "flex", alignItems: "center", padding: "0 12px", fontSize: 17, fontWeight: active ? 700 : 500, color: active ? "#fff" : "rgba(255,255,255,.82)", borderBottom: active ? `3px solid ${C.amber}` : "3px solid transparent", borderTop: "3px solid transparent", opacity: p, translate: `${(1 - p) * -14}px 0px` }}>{n}</div>
        );
      })}
    </div>
  );
};

export const TabRow: React.FC<{ tabs?: string[]; tab?: string; reporting?: "closed" | "open"; right?: React.ReactNode; dotP?: number }> = ({ tabs = ["Strategy", "Performance"], tab = "Strategy", reporting = "closed", right, dotP = 1 }) => (
  <div style={{ height: 58, background: C.ground, borderBottom: `1px solid ${C.line}`, display: "flex", alignItems: "stretch", padding: "0 24px", gap: 6 }}>
    {tabs.map((t) => {
      const active = t === tab;
      const isRep = t === "Reporting";
      if (isRep && reporting === "closed") return null;
      if (isRep) {
        return (
          <div key={t} style={{ alignSelf: "center", marginLeft: 8, display: "flex", alignItems: "center", gap: 8, padding: "6px 16px", borderRadius: 8, fontSize: 18, fontWeight: 600, background: active ? C.cta : `rgba(194,65,12,${0.15 * dotP})`, color: active ? "#fff" : C.cta, opacity: 0.25 + 0.75 * dotP }}>
            Reporting <span style={{ width: 9, height: 9, borderRadius: 99, background: active ? "#fff" : C.cta, opacity: dotP }} />
          </div>
        );
      }
      return (
        <div key={t} style={{ display: "flex", alignItems: "center", padding: "0 10px", fontSize: 18, fontWeight: active ? 700 : 500, color: active ? C.ink : C.ink2, borderBottom: active ? `3px solid ${C.amber}` : "3px solid transparent", borderTop: "3px solid transparent" }}>{t}</div>
      );
    })}
    {right ? <div style={{ marginLeft: "auto", alignSelf: "center", display: "flex", gap: 10 }}>{right}</div> : null}
  </div>
);

export const SecRow: React.FC<{ secs: string[]; sec: string }> = ({ secs, sec }) => (
  <div style={{ padding: "12px 24px", background: C.surface, borderBottom: `1px solid ${C.line}`, display: "flex" }}>
    <div style={{ display: "flex", gap: 2, border: `1px solid ${C.line}`, borderRadius: 8, padding: 3 }}>
      {secs.map((s) => (
        <div key={s} style={{ padding: "5px 16px", borderRadius: 6, fontSize: 15, fontWeight: 600, background: s === sec ? C.ink2 : "transparent", color: s === sec ? "#fff" : C.ink2 }}>{s}</div>
      ))}
    </div>
  </div>
);

export const Chrome: React.FC<ChromeProps> = ({ children, place, side = "units", units = [], fns = [], tabs, tab, reporting = "closed", secs, sec, seat, rightTab, dim = 0 }) => (
  <AbsoluteFill style={{ background: C.ground, fontFamily: FONT, color: C.ink }}>
    <TopBar seat={seat} />
    <NavRow place={place} side={side} units={units} fns={fns} />
    <TabRow tabs={tabs} tab={tab} reporting={reporting} right={rightTab} />
    {secs && sec ? <SecRow secs={secs} sec={sec} /> : null}
    <div style={{ position: "relative", flex: 1, overflow: "hidden" }}>{children}</div>
    {dim > 0 ? <div style={{ position: "absolute", inset: 0, background: `rgba(15,23,42,${0.55 * dim})` }} /> : null}
  </AbsoluteFill>
);

/* ── A pillar rail ──────────────────────────────────────── */
export const Rail: React.FC<{ title: string; items: { id: string; name: string; right?: React.ReactNode }[]; open?: number; shown?: number; width?: number; foot?: string }> = ({ title, items, open = 0, shown = 99, width = 250, foot }) => (
  <div style={{ width, flex: "none", background: C.surface, border: `1px solid ${C.line}`, borderRadius: 10, overflow: "hidden" }}>
    <div style={{ background: C.navy, color: C.navyInk, padding: "9px 14px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
      <Label size={12} color={C.navyInk}>{title} <span style={{ fontFamily: MONO, marginLeft: 6, fontWeight: 400 }}>{items.length}</span></Label>
      <span style={{ color: C.amber }}>≡</span>
    </div>
    <div style={{ padding: 10, display: "flex", flexDirection: "column", gap: 8 }}>
      {items.map((it, i) => {
        const p = Math.max(0, Math.min(1, shown - i));
        const isOpen = i === open;
        return (
          <div key={it.id} style={{ border: `1px solid ${isOpen ? C.line : C.lineSoft}`, borderLeft: isOpen ? `4px solid ${C.gold}` : `4px solid transparent`, background: isOpen ? C.surface2 : C.surface, borderRadius: 8, padding: "10px 12px", opacity: p, translate: `0px ${(1 - p) * 10}px`, display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8 }}>
            <div style={{ minWidth: 0 }}>
              <div style={{ fontFamily: MONO, fontSize: 12, color: C.ink3 }}>{it.id}</div>
              <div style={{ fontSize: 16, fontWeight: isOpen ? 700 : 500, color: C.ink, lineHeight: 1.2 }}>{it.name}</div>
            </div>
            {it.right}
          </div>
        );
      })}
      {foot ? <div style={{ fontSize: 13, color: C.ink3, padding: "6px 4px 0" }}>{foot}</div> : null}
    </div>
  </div>
);

/* ── A callout ring with a label ────────────────────────── */
export const Callout: React.FC<{ x: number; y: number; w: number; h: number; label?: string; p?: number; below?: boolean; right?: boolean }> = ({ x, y, w, h, label, p = 1, below, right }) => (
  <div style={{ position: "absolute", left: x - 6, top: y - 6, width: w + 12, height: h + 12, borderRadius: 10, border: `3px solid ${C.cta}`, opacity: p, scale: String(0.94 + 0.06 * p), pointerEvents: "none", boxShadow: "0 0 0 4px rgba(194,65,12,.15)", zIndex: 5 }}>
    {label ? <div style={{ position: "absolute", [right ? "right" : "left"]: 0, [below ? "top" : "bottom"]: "calc(100% + 8px)", background: C.cta, color: "#fff", fontSize: 16, fontWeight: 700, padding: "4px 12px", borderRadius: 6, whiteSpace: "nowrap" }}>{label}</div> : null}
  </div>
);
