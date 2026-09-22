/* REVENUE DRIVERS — the arithmetic, before any screen (spec 062).

   Ported from Islam's own working tool, kept unchanged beside the spec at
   `specs/062-revenue-drivers/reference/revenue-driver-tree-tool-v12.html`.
   NOTHING HERE WAS RETYPED FROM A DESCRIPTION: `checks/drivers.mjs` runs that
   file's own functions in a sandbox beside this module and asserts the two
   agree on every figure, so a drift in the port turns the check red without
   anybody editing it (§94.8 — agreement, never a typed number).

   WHY THE ARITHMETIC COMES FIRST AND ALONE. Spec 060 built Portfolio's rules
   and tables with no screen, because the shape is provable without a browser
   and a screen committed to before the model is settled is a screen rebuilt.
   The same applies here and harder: every figure in §3.5's growth split is a
   claim about somebody's revenue plan, and the cheapest place to be wrong
   about one is in a function with a check behind it. Rule 1c is owed on every
   screen in spec 062 §6 and none of them is drawn.

   WHAT THIS MODULE MAY NOT DO, said here rather than left to be discovered
   (§54.5): it stores nothing, reads no tenant, opens no address and is
   imported by its own check and by nothing else. `drivers` is not a module
   key and this is not a module — spec 062 §2 decision 1 puts the tab inside
   Strategy, which is where spec 061 put the reports two days earlier. */

/* ══ THE SHAPE (spec 062 §3.1) ══════════════════════════════════════════
   tree → channel → sub-channel → period → driver, and each level exists for
   a reason the level above it could not carry:

     · a CHANNEL is a business unit (§4.1), so the tool's Master tab is what
       the group and a company already are and no roll-up is invented;
     · a SUB-CHANNEL is a route to market whose driver logic genuinely
       differs — an app has sessions and a call centre has agents, and no
       single set of drivers describes both;
     · a PERIOD is a slice of the year, and the slices inside one sub-channel
       always sum to twelve months (§3.4) — which is what stops a season being
       counted twice, once in its own table and once inside the base year;
     · a DRIVER is one multiplicand, plus the sentence saying why it moves.

   A FLAT CHANNEL HAS EXACTLY ONE SUB-CHANNEL and never draws the strip. It is
   not a fourth shape: it is the ordinary shape with one route, so nothing
   downstream branches on it and only a screen ever reads the flag. */
export type DriverKind = "vol" | "val";
export type DriverUnit = "n" | "%";
export type UpUnit = "%" | "#";
export type PeriodType = "base" | "season" | "increment";
export type ChannelMode = "rate" | "count";

/* A DRIVER, and the last field is not decoration (spec 062 §3.2). `note` is
   the rationale a reviewer reads when a row misses — the one thing a
   spreadsheet of this shape never keeps honestly — so it travels with the
   number rather than in a document beside it. */
export type Driver = {
  name: string;
  kind: DriverKind;
  /* `%` DIVIDES BY 100 BEFORE IT MULTIPLIES, which is how *Maturity factor
     70%* and *Commission retention 78%* work. A driver is a multiplicand
     whatever its unit; the unit decides only how the typed number is read. */
  unit: DriverUnit;
  base: number;
  up: number;
  /* AN UPLIFT IS A PER CENT OF THE BASELINE OR A PLUS-N ADDED TO IT, and both
     are real in his own tree: *Sessions per month +40%* against *Agents +2*
     and *Events per year +9*. A single per-cent field would force somebody to
     work out what two more agents is as a percentage of six, which is how a
     plan acquires arithmetic nobody can check. */
  upUnit: UpUnit;
  note: string;
};

/* A PERIOD. `seasonId` names a season defined once for the whole tree, so
   changing a date changes every base period that season is cut out of, at
   once (§3.4) — the alternative is the same window typed into six
   sub-channels, drifting the first time one is corrected (§53.5). */
export type Period = { name: string; type: PeriodType; seasonId?: string; drivers: Driver[] };
export type Sub = { name: string; periods: Period[] };
export type Channel = { name: string; mode: ChannelMode; flat: boolean; subs: Sub[] };
export type Season = { id: string; name: string; start: string; end: string };
export type Tree = { seasons: Season[]; channels: Channel[] };

/* WHAT A LEVEL IS WORTH. `months` is a fact about ONE period and is absent
   from every roll-up — his tool's own accumulator drops it, and that is
   right rather than an oversight: twelve months of Retail plus twelve of
   E-commerce is not twenty-four of anything. Carrying it upward would be a
   number that reads as meaningful and is not (§35). */
export type Figures = {
  b0: number; b1: number; growth: number;
  volEff: number; valEff: number; intEff: number; newEff: number;
};
export type PeriodFigures = Figures & { months: number };

const ZERO = (): Figures => ({ b0: 0, b1: 0, growth: 0, volEff: 0, valEff: 0, intEff: 0, newEff: 0 });

/* ══ MONTHS (spec 062 §3.4) ═════════════════════════════════════════════ */
/* ══ THE CHECK'S BREAKS (constitution XVI, lib/modules.ts's own shape) ═══
   Each one reproduces a way this arithmetic goes wrong that a screen would
   render perfectly, and each must turn `checks/drivers.mjs` red before its
   green run is believed (§94.5, §276). NEVER SET ON A DEPLOYMENT. */
const BRK = (): string => (typeof process !== "undefined" ? process.env.SMP_BREAK || "" : "");

/* The tool's own constant, and it is 365/12 rather than 30: a season is a
   window of real days, so a month is the average one and never a calendar
   one. Ramadan 2026 is 31 days, which is 1.02 months and not 1. */
export const MONTH_DAYS = 365 / 12;

/* A SEASON'S LENGTH, INCLUSIVE OF BOTH ENDS — 17 Feb to 19 Mar is 31 days,
   not 30. An unreadable or backwards window is NOUGHT rather than a negative
   or a throw: a season nobody has dated yet takes no days out of the base
   year, which is the reading that leaves the tree adding up (§93 — absent is
   never a number somebody could mistake for one). */
export function seasonMonths(s: Season | null | undefined): number {
  if (!s || !s.start || !s.end) return 0;
  const a = new Date(s.start).getTime(), b = new Date(s.end).getTime();
  if (!isFinite(a) || !isFinite(b) || b < a) return 0;
  return (Math.round((b - a) / 86400000) + 1) / MONTH_DAYS;
}

export function seasonById(tree: Tree, id: string | undefined): Season | null {
  return (tree.seasons || []).find((s) => s.id === id) || null;
}

/* HOW MANY MONTHS A PERIOD STANDS FOR, and the three answers are three
   different kinds of thing rather than three cases of one:

     · a COUNT channel is not a rate at all — *Events per year 45* is already
       the year, so multiplying it by twelve would say 540 events;
     · an INCREMENT carries its own *Months active* driver, because new stores
       opening through the year do not trade for the whole of it, and how long
       they trade is a plan decision rather than a consequence of the calendar;
     · a BASE period is twelve months LESS the seasons used in its own
       sub-channel — calculated and never typed, which is the one line that
       makes the periods inside a sub-channel sum to twelve by construction.
       Typing it would let somebody enter eleven and lose a month silently.

   `Math.max(0, …)` is a floor and not a tidy-up: seasons totalling more than
   a year is a mistake somebody can make, and a negative base period would
   subtract revenue rather than reading as the nonsense it is. */
export function monthsFor(tree: Tree, ch: Channel, sub: Sub, p: Period): number {
  /* A count channel read as a rate — *Events per year 45* becoming 540. */
  if (BRK() === "count-prorated" && ch.mode === "count") return 12;
  if (ch.mode === "count" || p.type === "increment") return 1;
  if (p.type === "season") return seasonMonths(seasonById(tree, p.seasonId));
  /* The seasons never cut out of the base year, so a season is counted
     twice and every sub-channel with one reads high. */
  if (BRK() === "no-season-cut") return 12;
  const used = (sub.periods || [])
    .filter((x) => x.type === "season")
    .reduce((n, x) => n + seasonMonths(seasonById(tree, x.seasonId)), 0);
  return Math.max(0, 12 - used);
}

/* ══ THE MULTIPLICATION (spec 062 §3.3) ═════════════════════════════════ */

/* What a driver reads at year one: plus-n adds, per cent scales. */
export function yearOne(d: Driver): number {
  return d.upUnit === "#" ? d.base + (d.up || 0) : d.base * (1 + (d.up || 0) / 100);
}

/* What it contributes to the multiplication, at baseline or at year one. */
export function effective(d: Driver, atYearOne: boolean): number {
  const v = atYearOne ? yearOne(d) : d.base;
  /* A per-cent driver multiplying raw: a 70% maturity factor reading 70. */
  if (BRK() === "pct-raw") return v;
  return d.unit === "%" ? v / 100 : v;
}

/* VOLUME AND VALUE ARE MULTIPLIED APART AND THEN TOGETHER, and keeping them
   apart is the whole of why §3.5's growth split is possible: with one product
   there is no way to say how much of the increase was selling more and how
   much was charging more. An empty side is 1 rather than 0 — a period with no
   value driver is a period whose value is unchanged, not one worth nothing. */
export function factors(p: Period, atYearOne: boolean): { vol: number; val: number; rev: number } {
  let vol = 1, val = 1;
  (p.drivers || []).forEach((d) => {
    const v = effective(d, atYearOne);
    if (d.kind === "vol") vol *= v; else val *= v;
  });
  return { vol, val, rev: vol * val };
}

/* ONE PERIOD'S FIGURES.

   AN INCREMENT HAS NO BASELINE, and that is the point of it: new stores did
   not trade last year, so every pound of it is new business. Giving it a
   baseline of its own plan would report it as flat growth and lose the one
   distinction a reviewer most needs (§3.5).

   THE SPLIT IS THE STANDARD DECOMPOSITION and the interaction term is not a
   rounding artefact — selling 10% more at 10% more each is 21% more revenue,
   and the extra 1% belongs to neither volume nor price. Dropping it would
   leave the four parts not adding up to the growth they explain. */
export function periodFigures(tree: Tree, ch: Channel, sub: Sub, p: Period): PeriodFigures {
  const months = monthsFor(tree, ch, sub, p);
  const y = factors(p, true);
  if (p.type === "increment" && BRK() !== "increment-baseline") {
    const rev = y.rev * months;
    return { b0: 0, b1: rev, growth: rev, volEff: 0, valEff: 0, intEff: 0, newEff: rev, months };
  }
  const b = factors(p, false);
  return {
    b0: b.rev * months,
    b1: y.rev * months,
    growth: (y.rev - b.rev) * months,
    volEff: (y.vol - b.vol) * b.val * months,
    valEff: (y.val - b.val) * b.vol * months,
    intEff: BRK() === "no-interaction" ? 0 : (y.vol - b.vol) * (y.val - b.val) * months,
    newEff: 0,
    months,
  };
}

/* ══ THE ROLL-UP (spec 062 §3.3) ════════════════════════════════════════
   Everything above a period ADDS. One function, so a channel's total and the
   tree's cannot be arrived at two ways (§53.5) — and `months` is deliberately
   not among the keys, per Figures above. */
function add<T>(list: T[], of: (x: T) => Figures): Figures {
  const t = ZERO();
  (list || []).forEach((x) => {
    const c = of(x);
    (Object.keys(t) as (keyof Figures)[]).forEach((k) => { t[k] += c[k]; });
  });
  return t;
}

export function subFigures(tree: Tree, ch: Channel, sub: Sub): Figures {
  return add(sub.periods, (p) => periodFigures(tree, ch, sub, p));
}
export function channelFigures(tree: Tree, ch: Channel): Figures {
  return add(ch.subs, (sub) => subFigures(tree, ch, sub));
}
export function treeFigures(tree: Tree): Figures {
  return add(tree.channels, (ch) => channelFigures(tree, ch));
}

/* ══ WHAT A UNIT'S REVENUE TARGET IS (spec 062 §4.2) ════════════════════
   Answer 3: *"tree is the main source."* A channel's Year 1 figure is the
   unit's revenue key objective, so nothing is typed and nothing can disagree.

   NULL WHERE THERE IS NO CHANNEL, never nought: a unit whose tree has not
   been built has no revenue target, which is a different fact from a target
   of zero and must not be scored as one (§35, §93). */
export function revenueTarget(tree: Tree, channelName: string): number | null {
  const ch = (tree.channels || []).find((c) => c.name === channelName);
  return ch ? channelFigures(tree, ch).b1 : null;
}

/* ══ WHERE THE GROWTH CAME FROM (spec 062 §3.5) ═════════════════════════
   The four shares, and the reading the tool says in words.

   NOTHING IS A SHARE OF NOUGHT. A plan that does not grow gets no percentages
   at all — dividing by a growth of zero is how a bridge comes to read 100%
   volume on a plan that went backwards (§93.5's family: an arithmetic answer
   that is true and says something false). */
export type Bridge = {
  volume: number; price: number; interaction: number; newBusiness: number;
  shares: { volume: number; price: number; interaction: number; newBusiness: number } | null;
  reading: string;
};
export function bridge(f: Figures): Bridge {
  const g = f.growth;
  const share = (x: number) => (g ? (x / g) * 100 : 0);
  const v = share(f.volEff), p = share(f.valEff), i = share(f.intEff), n = share(f.newEff);
  let reading: string;
  if (g <= 0) reading = "The plan does not grow on these assumptions. Check the uplifts before reading the bridge.";
  else if (n >= 50) reading = "Over half the growth comes from new business that does not exist yet. New stores, products and hubs carry execution and capital risk that growth on an existing base does not. Ask what the plan looks like if the openings slip a quarter.";
  else if (v >= 60) reading = "Growth is volume-led — most of the increase comes from selling more on the existing base. Test it against capacity, coverage, working capital and headcount.";
  else if (p >= 60) reading = "Growth is price-led — most of it comes from value per unit rather than quantity. Test it against pricing power, mix shift and elasticity.";
  else reading = "Growth is spread across volume, price and new business — generally the more resilient shape. Confirm each has a named owner.";
  return {
    volume: f.volEff, price: f.valEff, interaction: f.intEff, newBusiness: f.newEff,
    shares: g > 0 ? { volume: v, price: p, interaction: i, newBusiness: n } : null,
    reading,
  };
}
