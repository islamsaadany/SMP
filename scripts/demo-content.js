/* THE DEMO'S OWN CONTENT, laid over the renamed example (spec 042 §6.3).
   Islam, 2026-09-29: *"fill in Meridian plans and reporting fully and ensure
   we have variety in the functions planning approaches so I can have a full
   product for showing a demo to my clients."*

   The example the demo is renamed from is a REAL CLIENT'S plan, and it is
   thin where that client's was thin: seven units with two pillars each, one
   unit that never reported, one function out of eight planning any way but
   projects, one closed period. A demo has to show the whole product, so what
   the example lacks is written HERE — never into `db/seed-state.json`, which
   would put invented material into a real client's record.

   ORDER IS THE CONTRACT. `demoGraph()` renames first and calls `enrich()`
   after, so everything below is written in the INVENTED world (Meridian, its
   units, its people) and the refusal still runs over the finished graph —
   including every string in this file. A real name typed here is refused
   exactly as one that survived the renaming would be.

   WHAT THIS ADDS, by the numbers agreed with Islam that day:
     2 · Finance and Treasury plan in objectives and actions; the Strategy
         Office plans in pillars; Marketing gets key objectives; Retail's
         Merchandising pillar is carried by Merchandising again (§253.2 cut
         it; spec 010's feature is otherwise invisible in the demo).
     3 · Nigeria plans in objectives and actions (§405), and a second
         capability, planned in pillars, is held by IT (spec 048).
     4 · a third pillar for the six two-pillar units still planning in
         pillars.
     5 · every figure reported, a note from every unit; two units left
         unsubmitted on purpose so the chase has something to show.
     6 · two earlier closed periods and one archived cycle.
     7 · monthly phasing, one pillar breakdown, objective weights for every
         unit, a `≤ Sum` measure, and Focus marks across more units.

   The module tables (tracker, notes) are not the graph and are written by
   the seeder that owns the tenant — `moduleContent()` below only says what
   goes in them. */

/* ── Small builders ──────────────────────────────────────────────
   PROGRESS IS STORED FOR THE OLD READERS ONLY. Every score the product draws
   is computed from `actual` against `target` (§239's `measureScore`), so this
   mirrors that arithmetic closely enough to keep the stored number honest and
   nothing reads it for a verdict. The review point is June: a `Sum` row owes
   half its year. */
const AS_OF = 6;

function num(v) {
  const n = parseFloat(String(v == null ? "" : v).replace(/[^0-9.]/g, ""));
  return isNaN(n) ? null : n;
}
function progressOf(m) {
  const t = num(m.target), a = num(m.actual);
  if (t == null || a == null) return null;
  const due = /^(sum|count)$/i.test(m.compile || "") ? t * AS_OF / 12 : t;
  if (!due) return null;
  const r = m.dir === "≤" ? (a === 0 ? 150 : due / a * 100) : a / due * 100;
  return Math.round(Math.min(150, r));
}

/* A measure or a key objective: [name, dir, target, compile, actual, note?] */
function M(id, name, dir, target, compile, actual, note) {
  const m = { name, dir, target, compile, actual };
  m.progress = progressOf(m);
  if (note) m.note = note;
  m.id = id;
  return m;
}
/* A tactic: quarters as a four-letter string, "0111" = Q2–Q4. */
function T(id, name, owner, q, status, actual, out, note) {
  const t = { name, owner, q1: +q[0], q2: +q[1], q3: +q[2], q4: +q[3], status };
  if (actual != null) t.actual = actual;
  if (out) Object.assign(t, { outcome: out[0], outTarget: out[1], outCompile: out[2] },
                        out[3] != null ? { outActual: out[3] } : {});
  if (note) t.note = note;
  t.id = id;
  return t;
}
/* An action (§342): a date where a tactic has quarters. A row whose month has
   not come carries no status, so it is not asked for yet (`fnObjReported`). */
function A(id, name, owner, due, status, pct, note) {
  const a = { id, name, owner, due };
  if (status) a.status = status;
  if (pct != null) a.pct = pct;
  if (note) a.note = note;
  return a;
}

/* ── 4 · the third pillar, for the six units that had two ─────────── */
const THIRD_PILLARS = {
  consumerelectronics: {
    code: "CE03", name: "After-Sales & Service Attach", sub: "Earning on the device after it is sold",
    kind: "Direction", theme: "DIV", owner: "Rana Sleiman",
    measures: [
      ["Extended warranty attach rate", "≥", "12%", "Latest", "8%", "Attach follows the dealer training that finishes in Q3."],
      ["Service revenue through dealers", "≥", "140M EGP", "Sum", "58M"],
    ],
    tactics: [
      ["Warranty bundles on the top twenty models", "Rana Sleiman", "1111", "WIP", 55,
        ["Models sold with a bundle", "20 #", "Latest", "12"]],
      ["Dealer service desk pilot", "Fadi Aoun", "0111", "WIP", 30,
        ["Dealers running a service desk", "40 #", "Latest", "11"], "Pilot running in Greater Cairo; the rollout follows its review in August."],
    ],
  },
  onlineshop: {
    code: "OS03", name: "Fulfilment Speed", sub: "Next day as the default, not the upgrade",
    kind: "Capability", theme: "VC", owner: "Hanan Trad",
    measures: [
      ["Orders delivered next day", "≥", "70%", "Latest", "58%"],
      ["Return processing time", "≤", "3 d", "Latest", "4 d", "Returns wait on the courier pick-up; the in-store drop-off opens in Q3."],
    ],
    tactics: [
      ["Dark store for Greater Cairo", "Nabil Chami", "1110", "WIP", 70,
        ["Orders served from the dark store", "35%", "Latest", "22%"]],
      ["Returns drop-off at Retail stores", "Hanan Trad", "0011", "Not started", null,
        ["Stores taking online returns", "12 #", "Latest"]],
    ],
  },
  corporate: {
    code: "CO03", name: "Managed Services", sub: "Contracts that renew rather than tenders that end",
    kind: "Direction", theme: "DIV", owner: "Maya Bitar",
    measures: [
      ["Managed-service contracts", "≥", "12", "Latest", "7"],
      ["Contract renewal rate", "≥", "85%", "Latest", "88%"],
    ],
    tactics: [
      ["Device-as-a-service offer for enterprises", "Fares Zeidan", "1111", "WIP", 60,
        ["Enterprises on the offer", "10 #", "Latest", "5"]],
      ["Service desk shared with IT Distribution", "Maya Bitar", "0110", "WIP", 45,
        ["Enterprise tickets handled by the shared desk", "60%", "Latest", "35%"],
        "The desk is staffed; the ticketing system goes live with the ERP consolidation."],
    ],
  },
  care: {
    code: "CA03", name: "Digital Service Channels", sub: "Booked, tracked and closed without a phone call",
    kind: "Capability", theme: "VC", owner: "Layal Nader",
    measures: [
      ["Repairs booked online", "≥", "40%", "Latest", "31%"],
      ["Contact-centre calls per repair", "≤", "1.5", "Latest", "2.1", "Calls fall once repair tracking is live for every centre."],
    ],
    tactics: [
      ["Online repair booking and tracking", "Ghassan Tabet", "1111", "WIP", 65,
        ["Centres live on tracking", "18 #", "Latest", "11"]],
      ["WhatsApp service line", "Layal Nader", "0111", "WIP", 40,
        ["Service requests opened on WhatsApp", "20%", "Latest", "9%"]],
    ],
  },
  it: {
    code: "IT03", name: "Cloud & Software Licensing", sub: "The fastest-growing line in the channel",
    kind: "Direction", theme: "DIV", owner: "Noura Ghanem",
    measures: [
      ["Cloud and licensing revenue", "≥", "260M EGP", "Sum", "118M"],
      ["Resellers selling cloud", "≥", "150", "Latest", "96"],
    ],
    tactics: [
      ["Cloud marketplace for resellers", "Ziad Maroun", "1111", "WIP", 55,
        ["Resellers active on the marketplace", "150 #", "Latest", "96"]],
      ["Vendor certification bootcamps", "Noura Ghanem", "1010", "WIP", 50,
        ["Reseller staff certified", "300 #", "Sum", "140"]],
    ],
  },
  logistics: {
    code: "LG03", name: "Loss & Damage Control", sub: "What leaves the hub arrives whole",
    kind: "Capability", theme: "OT", owner: "Zeina Abboud",
    /* THE DEMO'S ONE `≤ Sum` ROW (DECISIONS: none in the example): a year's
       write-offs kept under a ceiling, prorated like any Sum. */
    measures: [
      ["Damaged-in-transit write-offs", "≤", "12M EGP", "Sum", "5.1M"],
      ["Claims closed within 10 days", "≥", "90%", "Latest", "83%"],
    ],
    tactics: [
      ["Packaging standard for fragile lines", "Wadih Srour", "1100", "Done", 100,
        ["Lines on the new standard", "30 #", "Latest", "30"]],
      ["Claims desk with a ten-day promise", "Zeina Abboud", "0111", "WIP", 55,
        ["Claims logged through the desk", "100%", "Latest", "70%"]],
    ],
  },
};

function addThirdPillar(u, key) {
  const d = THIRD_PILLARS[key];
  if (!d || (u.items || []).some((p) => p.code === d.code)) return;
  const pid = key + "-P" + (u.items.length + 1);
  u.items.push({
    code: d.code, name: d.name, sub: d.sub, kind: d.kind, theme: d.theme, owner: d.owner,
    measures: d.measures.map((m, i) => M(pid + "-M" + (i + 1), m[0], m[1], m[2], m[3], m[4], m[5])),
    tactics: d.tactics.map((t, i) => T(pid + "-T" + (i + 1), t[0], t[1], t[2], t[3], t[4], t[5], t[6])),
    id: pid,
  });
}

/* ── 5 · figures that were never reported ──────────────────────── */
const FIGURES = {
  "consumerelectronics-P1-M2": ["61%", "Two principals still carry most of the range; the new lines land in Q3."],
  "consumerelectronics-P1-M3": ["310M"],
  "consumerelectronics-P2-M1": ["1,410"],
  "consumerelectronics-P2-M2": ["64%"],
  "consumerelectronics-P2-M3": ["9%", "Churn is in small dealers outside the incentive tiers."],
};

/* Every unit speaks for its half. Two are left without a submission —
   B2B Online and Nigeria — so "who has not reported" has a real answer. */
const NOTES = {
  b2becomm: "Platform volumes are up but merchant financing is slower to approve than planned. Reliability work is on schedule.",
  consumerelectronics: "Two new principal lines are close; dealer numbers are behind plan while the incentive tiers bed in.",
  onlineshop: "Revenue is on plan and the dark store is carrying a fifth of Cairo orders. Conversion is the gap.",
  corporate: "Public-sector wins are ahead of last year. Solution selling is slower to build than hiring allowed for.",
  it: "Cloud licensing is the fastest-growing line. Reseller portal adoption lags the channel's own growth.",
  logistics: "On-time delivery is above target. External client revenue is behind: two large prospects moved to Q3.",
  nigeria: "The Lagos hub opened in March and the first dealers are trading. Margin is below plan while volumes build.",
};
const SUBMITTED = ["mobile", "consumerelectronics",     /* added to the example's six */
  /* and the functions and capabilities, keyed as `holderTarget()` keys them.
     The Customer Care function and the new capability are left open, so the
     chase has a function and a capability in it as well as two units. */
  "fn:finance", "fn:treasury", "fn:hr", "fn:it", "fn:marketing", "fn:smo", "fn:merchandising", "cap:cap6"];

/* ── 7 · objective weights for every unit but Devices, which has its own ── */
const KO_WEIGHTS = {
  retailstores: [40, 30, 15, 15], b2becomm: [35, 25, 25, 15],
  consumerelectronics: [40, 20, 20, 20], onlineshop: [40, 25, 20, 15],
  corporate: [40, 25, 20, 15], care: [35, 30, 20, 15], it: [40, 20, 20, 20],
  logistics: [35, 25, 20, 20], nigeria: [40, 25, 20, 15],
};

/* The Focus board: rows the office is watching, spread across the group. */
const FOCUS = ["b2becomm-KO1", "b2becomm-P2-M1", "consumerelectronics-KO3", "consumerelectronics-P2-M3",
               "onlineshop-KO2", "onlineshop-P2-M1", "corporate-KO3", "it-KO2", "it-P1-M3",
               "logistics-P2-M1", "nigeria-KO3"];

/* ── 7 · a Ramadan-shaped monthly plan (§278) ──────────────────────
   Twelve months in the target's own scale, summing to the year. Ramadan runs
   mid-February to mid-March in 2026 (`group.seasons`), so those two months
   carry the peak. */
const MONTHLY = {
  "retailstores-P2-M1": [0.07, 0.13, 0.15, 0.08, 0.08, 0.08, 0.08, 0.08, 0.08, 0.09, 0.09, 0.09],   /* 1.1B */
  "retailstores-P1-M1": [0, 1, 1, 1, 2, 1, 1, 1, 2, 1, 2, 1],                                      /* 14 stores */
};

/* ── 7 · the pillar breakdown (spec 050): Retail's stores by region ──
   Rates and averages only, never a total: a breakdown cell is read against
   its own target with no proration (`bdCellScore` passes an empty compile). */
const BREAKDOWN = {
  pillar: "retailstores-P1",
  value: {
    name: "Regions",
    cols: [{ id: "c1", name: "Revenue per store (M EGP)", dir: "≥" },
           { id: "c2", name: "Prime-location share", dir: "≥" }],
    rows: [
      { id: "retailstores-P1-B1", name: "Greater Cairo", t_c1: "60", a_c1: "64", t_c2: "70%", a_c2: "58%" },
      { id: "retailstores-P1-B2", name: "Alexandria", t_c1: "52", a_c1: "55", t_c2: "60%", a_c2: "50%" },
      { id: "retailstores-P1-B3", name: "Delta", t_c1: "45", a_c1: "47", t_c2: "50%", a_c2: "38%" },
      { id: "retailstores-P1-B4", name: "Upper Egypt", t_c1: "40", a_c1: "36", t_c2: "45%", a_c2: "31%" },
    ],
  },
};

/* ── 2 · the functions, in all three ways a function can plan ─────── */
function objectivesFunctions(g) {
  const fin = g.functions.finance;
  fin.format = "objectives";
  fin.keyObjectives = [
    Object.assign(fin.keyObjectives[0], { weight: 35 }),
    Object.assign(fin.keyObjectives[1], { weight: 25 }),
    Object.assign(M("fin-KO3", "Forecast accuracy, quarterly", "≥", "90%", "Latest", "84%"), { weight: 20 }),
    Object.assign(M("fin-KO4", "Cost of borrowing", "≤", "18%", "Latest", "19.5%",
      "Two facilities reprice in Q3 once the consolidation closes."), { weight: 20 }),
  ];
  fin.actions = [
    A("fin-A1", "Month-end close calendar agreed with every unit", "Abd El Rahman Wazir", "Feb 2026", "done"),
    A("fin-A2", "Automate the average-debt utilisation report", "Abd El Rahman Wazir", "Apr 2026", "done"),
    A("fin-A3", "Collections playbook for accounts over 90 days", "Sana Debs", "May 2026", "wip", 70,
      "Distribution units are on it; B2C follows in July."),
    A("fin-A4", "Rolling quarterly forecast in place of the annual re-forecast", "Abd El Rahman Wazir", "Jun 2026", "wip", 60),
    A("fin-A5", "Consolidate three credit facilities into one", "Sana Debs", "Sep 2026"),
    A("fin-A6", "Working-capital targets set per unit for 2027", "Abd El Rahman Wazir", "Nov 2026"),
  ];

  const tre = g.functions.treasury;
  tre.format = "objectives";
  tre.keyObjectives = [
    Object.assign(tre.keyObjectives[0], { weight: 30 }),
    Object.assign(tre.keyObjectives[1], { weight: 30 }),
    Object.assign(M("tre-KO3", "Foreign-currency exposure hedged", "≥", "70%", "Latest", "55%",
      "Hedging follows the principal payment calendar, which is heavier in the second half."), { weight: 25 }),
    Object.assign(M("tre-KO4", "Idle cash above the operating floor", "≤", "150M EGP", "Latest", "120M"), { weight: 15 }),
  ];
  tre.actions = [
    A("tre-A1", "Daily cash position across every bank account", "Basil Fakhry", "Mar 2026", "done"),
    A("tre-A2", "FX hedging policy approved by the board", "Basil Fakhry", "Apr 2026", "done"),
    A("tre-A3", "Principal payment calendar shared with Treasury monthly", "Talal Nassif", "Jun 2026", "wip", 50,
      "Four of six principals are on the calendar."),
    A("tre-A4", "Cash pooling across the two companies", "Basil Fakhry", "Aug 2026"),
    A("tre-A5", "Short-term investment mandate for surplus cash", "Talal Nassif", "Oct 2026"),
  ];
}

/* Merchandising has always planned in pillars with no objectives above them,
   so its Performance page opened on a card reading "No data". */
function merchandisingObjectives(g) {
  const f = g.functions.merchandising;
  if ((f.keyObjectives || []).length) return;
  f.keyObjectives = [
    Object.assign(M("fn:merchandising-KO1", "Gross margin on the range", "≥", "24%", "Latest", "22.5%"), { weight: 60 }),
    Object.assign(M("fn:merchandising-KO2", "Stock cover", "≤", "60 d", "Latest", "68 d",
      "Cover falls as the slow-moving categories clear in Q3."), { weight: 40 }),
  ];
}

function marketingObjectives(g) {
  const mk = g.functions.marketing;
  if ((mk.keyObjectives || []).length) return;
  mk.keyObjectives = [
    Object.assign(M("mkt-KO1", "Unaided brand awareness", "≥", "45%", "Latest", "38%"), { weight: 50 }),
    Object.assign(M("mkt-KO2", "Marketing-sourced B2B leads", "≥", "1,200", "Sum", "540"), { weight: 30 }),
    Object.assign(M("mkt-KO3", "Share of voice in category media", "≥", "25%", "Latest", "21%"), { weight: 20 }),
  ];
}

/* The Strategy Office plans in pillars, so two functions show that form. It
   belongs to the group rather than to a unit, so it carries no `under`. */
function smoInPillars(g) {
  const s = g.functions.smo;
  s.format = "pillars";
  s.aspiration = "A group that plans once, reviews on evidence and adjusts in time.";
  s.items = [
    { code: "SMO01", name: "Planning Discipline", sub: "Every unit on one cycle and one platform",
      kind: "Capability", theme: "OT", owner: "Farida Anwar",
      measures: [
        M("fn:smo-P1-M1", "Units planning on the platform", "≥", "10", "Latest", "9"),
        M("fn:smo-P1-M2", "Plans signed off before the cycle opens", "≥", "100%", "Latest", "80%",
          "Nigeria and B2B Online signed off in February."),
      ],
      tactics: [
        T("fn:smo-P1-T1", "Planning calendar published for the year", "Farida Anwar", "1000", "Done", 100,
          ["Calendar published", "1 #", "Latest", "1"]),
        T("fn:smo-P1-T2", "Custodian training for every unit", "Mira Ashkar", "1100", "Done", 100,
          ["Custodians trained", "12 #", "Latest", "12"]),
        T("fn:smo-P1-T3", "2027 planning kit and templates", "Mira Ashkar", "0011", "Not started", null,
          ["Units issued the kit", "10 #", "Latest"]),
      ],
      id: "fn:smo-P1" },
    { code: "SMO02", name: "Review on Evidence", sub: "The review is the numbers, not the slides",
      kind: "Direction", theme: "VC", owner: "Farida Anwar",
      measures: [
        M("fn:smo-P2-M1", "Units reporting by the deadline", "≥", "90%", "Latest", "80%"),
        M("fn:smo-P2-M2", "Off-track rows with an agreed recovery", "≥", "85%", "Latest", "72%"),
      ],
      tactics: [
        T("fn:smo-P2-T1", "Half-year review packs from the platform", "Farida Anwar", "0110", "WIP", 70,
          ["Review packs drawn from the platform", "10 #", "Latest", "8"]),
        T("fn:smo-P2-T2", "Monthly focus-board session with the CEO", "Mira Ashkar", "1111", "WIP", 50,
          ["Sessions held", "12 #", "Sum", "6"]),
      ],
      id: "fn:smo-P2" },
  ];
}

/* ── 3 · a unit that plans in objectives and actions (§405) ────────── */
function nigeriaInObjectives(g) {
  const u = g.units.nigeria;
  u.format = "objectives";
  const fig = { "nigeria-KO1": ["0.38B", "Revenue is building from a March opening; the plan's second half carries most of it."],
                "nigeria-KO2": ["96"], "nigeria-KO3": ["2.6%"], "nigeria-KO4": ["84 d"] };
  u.keyObjectives.forEach((m) => {
    const f = fig[m.id];
    if (!f) return;
    m.actual = f[0];
    m.progress = progressOf(m);
    if (f[1]) m.note = f[1];
  });
  u.actions = [
    A("nigeria-A1", "Open the Lagos hub and warehouse", "Obinna Adeyemi", "Mar 2026", "done"),
    A("nigeria-A2", "Sign the first two local brand agreements", "Obinna Adeyemi", "Apr 2026", "done"),
    A("nigeria-A3", "Recruit the first hundred dealers", "Chioma Balogun", "Jun 2026", "wip", 90),
    A("nigeria-A4", "Local credit and collections policy", "Chioma Balogun", "May 2026", "wip", 60,
      "Waiting on the Group CFO's sign-off of the credit limits."),
    A("nigeria-A5", "Open Abuja and Port Harcourt", "Obinna Adeyemi", "Sep 2026"),
    A("nigeria-A6", "FX repatriation plan agreed with Treasury", "Chioma Balogun", "Oct 2026"),
  ];
}

/* ── 3 · a capability planned in pillars, held by IT ────────────────── */
function dataCapability(g) {
  const caps = g.group.capabilities || (g.group.capabilities = []);
  if (caps.some((c) => c.id === "cap9")) return;
  caps.push({
    id: "cap9", name: "Data-led Decisions", fn: "it", format: "pillars",
    def: "Decide from one trusted number, available to the people who need it on the day.",
    keyObjectives: [
      Object.assign(M("cap9-KO1", "Decisions taken on the shared dashboards", "≥", "70%", "Latest", "46%"), { weight: 60 }),
      Object.assign(M("cap9-KO2", "Reports retired in favour of the warehouse", "≥", "40", "Sum", "14"), { weight: 40 }),
    ],
    items: [
      { code: "DD01", name: "One Source of Truth", sub: "The warehouse every report reads",
        kind: "Capability", theme: "VC", owner: "Ziad Maroun",
        measures: [
          M("cap9-P1-M1", "Units loading daily to the warehouse", "≥", "10", "Latest", "7"),
          M("cap9-P1-M2", "Data quality checks passing", "≥", "95%", "Latest", "91%"),
        ],
        tactics: [
          T("cap9-P1-T1", "Warehouse live for the distribution units", "Ziad Maroun", "1100", "Done", 100,
            ["Distribution units live", "3 #", "Latest", "3"]),
          T("cap9-P1-T2", "B2C units onto the warehouse", "Noura Ghanem", "0111", "WIP", 45,
            ["B2C units loading daily", "4 #", "Latest", "1"]),
        ],
        id: "cap9-P1" },
      { code: "DD02", name: "Analytics in the Business", sub: "Analysts sitting with the units",
        kind: "Direction", theme: "OT", owner: "Noura Ghanem",
        measures: [
          M("cap9-P2-M1", "Units with an embedded analyst", "≥", "8", "Latest", "5"),
          M("cap9-P2-M2", "Managers active on dashboards monthly", "≥", "250", "Latest", "180"),
        ],
        tactics: [
          T("cap9-P2-T1", "Analyst hiring and placement", "Reem Daher", "1110", "WIP", 60,
            ["Analysts placed", "8 #", "Latest", "5"]),
          T("cap9-P2-T2", "Dashboard literacy sessions for managers", "Noura Ghanem", "0111", "WIP", 40,
            ["Managers trained", "300 #", "Sum", "110"]),
        ],
        id: "cap9-P2" },
    ],
  });
}

/* ── 6 · two earlier closed periods and one archived cycle ────────── */
const EARLIER = [
  { name: "H2 2024", group: 52, units: { mobile: 47, retailstores: 68, b2becomm: 49, consumerelectronics: 51,
    onlineshop: 55, corporate: 60, care: 54, it: 52, logistics: 58, nigeria: null } },
  { name: "H1 2025", group: 58, units: { mobile: 51, retailstores: 74, b2becomm: 55, consumerelectronics: 54,
    onlineshop: 61, corporate: 66, care: 60, it: 58, logistics: 63, nigeria: 38 } },
];

/* The figures H2 2025 closed on, in the shape `figuresSnapshot()` writes, so
   Archives lists it and Restore reads it. Each number is today's scaled back —
   a demo's history, said so here rather than passed off as anybody's. */
function scaled(v, f) {
  const s = String(v == null ? "" : v), n = num(s);
  if (n == null) return v;
  const dp = (s.match(/\.(\d+)/) || ["", ""])[1].length;
  const out = (n * f).toFixed(dp);
  return s.replace(/[0-9][0-9,]*(\.[0-9]+)?/, dp ? out : Number(out).toLocaleString("en-US"));
}
function archivedCycle(g) {
  const units = {}, f = 0.85;
  g.unitKeys.forEach((k) => {
    const u = g.units[k], m = {};
    const put = (x, o) => { if (x && x.id) m[x.id] = o; };
    (u.keyObjectives || []).forEach((x) => put(x, { actual: scaled(x.actual, f), progress: x.progress == null ? null : Math.round(x.progress * f) }));
    (u.items || []).forEach((p) => {
      (p.measures || []).forEach((x) => put(x, { actual: scaled(x.actual, f), progress: x.progress == null ? null : Math.round(x.progress * f) }));
      (p.tactics || []).forEach((x) => put(x, { actual: x.actual == null ? null : Math.round(x.actual * 0.6), status: x.status }));
    });
    units[k] = m;
  });
  const counts = { reported: 0, figures: 0, notes: 0, units: 10 };
  Object.values(units).forEach((m) => Object.values(m).forEach((o) => {
    counts.figures++;
    if (o.actual != null && o.actual !== "") counts.reported++;
  }));
  return {
    id: "arch1", kind: "figures", key: "", name: "H2 2025", at: "4 Jan 2026", by: "Farida Anwar",
    why: "cleared when a new cycle opened", counts,
    figures: { units, caps: {}, groupCaps: {}, groupKO: {}, note: {},
               submitted: Object.fromEntries(g.unitKeys.map((k) => [k, true])) },
  };
}

/* ── 5 · a note on every row in the bottom two bands ─────────────────
   The product refuses a submission with a red figure nobody explained
   (`needsNote`, §105), so a unit shown as submitted must carry one on each.
   Keyed by id and set wherever the id is found, because the rows live in
   units, functions, capabilities and a breakdown alike. */
const ROW_NOTES = {
  "retailstores-P1-B4": "Upper Egypt has two stores on secondary streets; both relocate when their leases end in 2027.",
  "consumerelectronics-P1-M3": "New categories launched in Q2, so revenue is weighted to the second half.",
  "consumerelectronics-P3-T1": "Bundles are live on twelve models; the remaining eight follow the principals' Q3 price lists.",
  "onlineshop-P3-T1": "The dark store opened in March and is still ramping; the Q3 target assumes full shifts.",
  "corporate-P3-M1": "Five contracts are in legal review and expected to sign in Q3.",
  "corporate-P3-T1": "Five enterprises are on the offer; three more are piloting it.",
  "care-P3-T1": "Eleven centres are live; the rest wait on the new booking system's second release.",
  "care-P3-T2": "The line opened in May and is being promoted at point of sale from July.",
  "it-P3-M2": "Resellers join the marketplace after certification, which runs in cohorts.",
  "it-P3-T1": "Onboarding follows the certification bootcamps; the next cohort starts in August.",
  "nigeria-KO2": "Dealer recruitment started in April, after the hub opened.",
  "nigeria-KO3": "Margin is diluted by launch pricing, which ends in Q3.",
  "cap6-P1-D2": "The board asked for a second option; the positioning workshop resumes in September.",
  "cap9-KO1": "Usage follows the B2C units joining the warehouse, planned for Q3.",
  "cap9-P1-T2": "One B2C unit is loading daily; the other three follow the ERP consolidation.",
  "cap9-P2-M1": "Three analyst roles are offered and start in Q3.",
  "cap9-P2-T1": "Three analyst roles are offered and start in Q3.",
};
function noteRows(g) {
  (function walk(n) {
    if (Array.isArray(n)) return n.forEach(walk);
    if (!n || typeof n !== "object") return;
    if (typeof n.id === "string" && ROW_NOTES[n.id] && !n.note) n.note = ROW_NOTES[n.id];
    Object.keys(n).forEach((k) => { if (n[k] && typeof n[k] === "object") walk(n[k]); });
  })([g.units, g.functions, g.group.capabilities]);
}

/* ── 12 · no brand that points at the real client ──────────────────
   Islam, 2026-09-29, of "Samsung market share": a client in the same market
   could work out whose plan this was from the brands Devices is measured by.
   So the three measures that named a principal are renamed by ID, and the
   words themselves are on the refusal's list in seed-demo-client.js, so a
   brand that comes back through the example is refused, not shipped. */
const BRAND_RENAMES = {
  "mobile-P3-M1": "Revenue outside the lead brand",
  "mobile-P3-M2": "Lead brand market share",
  "mobile-P3-M3": "Challenger brand market share",
};
function renameBrands(g) {
  (g.units.mobile.items || []).forEach((p) => (p.measures || []).forEach((m) => {
    if (BRAND_RENAMES[m.id]) m.name = BRAND_RENAMES[m.id];
  }));
}

/* ── the pass ───────────────────────────────────────────────────── */
function eachRow(g, fn) {
  const walkUnit = (u) => {
    (u.keyObjectives || []).forEach(fn);
    (u.items || []).forEach((p) => (p.measures || []).forEach(fn));
  };
  g.unitKeys.forEach((k) => walkUnit(g.units[k]));
}

function enrich(g) {
  /* 2 */
  objectivesFunctions(g);
  marketingObjectives(g);
  merchandisingObjectives(g);
  smoInPillars(g);
  const r04 = (g.units.retailstores.items || []).find((p) => p.code === "R04");
  if (r04) r04.by = "merchandising";

  /* 3 */
  nigeriaInObjectives(g);
  dataCapability(g);

  /* 4 */
  Object.keys(THIRD_PILLARS).forEach((k) => addThirdPillar(g.units[k], k));

  /* 5 */
  eachRow(g, (m) => {
    const f = FIGURES[m.id];
    if (!f) return;
    m.actual = f[0];
    m.progress = progressOf(m);
    if (f[1]) m.note = f[1];
  });
  g.review.note = Object.assign({}, g.review.note, NOTES);
  g.review.submitted = Object.assign({}, g.review.submitted);
  SUBMITTED.forEach((k) => { g.review.submitted[k] = true; });

  /* 6 */
  if (!g.history.some((h) => h.name === "H2 2024")) g.history = EARLIER.concat(g.history);
  g.archives = [archivedCycle(g)].concat(g.archives || []);

  /* 7 */
  /* A WEIGHT IS READ OFF THE OBJECTIVE ITSELF (`koWeights`, §243); the
     `koWeights` table is the legacy fallback the code carries for Devices
     alone, so writing there would weight nothing. */
  Object.keys(KO_WEIGHTS).forEach((k) => {
    (g.units[k].keyObjectives || []).forEach((m, i) => {
      if (KO_WEIGHTS[k][i] != null && m.weight == null) m.weight = KO_WEIGHTS[k][i];
    });
  });
  FOCUS.forEach((id) => { g.cycle.focus[id] = true; });
  eachRow(g, (m) => { if (MONTHLY[m.id]) m.monthly = MONTHLY[m.id].map(String); });
  const bp = g.units.retailstores.items.find((p) => p.id === BREAKDOWN.pillar);
  if (bp) bp.breakdown = BREAKDOWN.value;
  noteRows(g);
  renameBrands(g);
  return g;
}

/* ── 8 · the Tracker and Meeting Notes (spec 054, 055) ────────────
   Not the graph, so the seeder writes them. Owners are REGISTER KEYS (§48);
   the tracker's owner must hold an office seat on this client, which a fresh
   demo has nobody in — so the seeder passes the office keys it found and
   these fall back to the Strategy Office's head. Dates are relative to the
   day the demo is seeded, so "this week" is always this week. */
function moduleContent(officeKeys) {
  const owners = officeKeys && officeKeys.length ? officeKeys : ["smo"];
  const who = (i) => owners[i % owners.length];
  const day = (n) => { const d = new Date(); d.setUTCDate(d.getUTCDate() + n); return d.toISOString().slice(0, 10); };
  const tracker = [
    ["Collect the half-year notes from B2B Online and Nigeria", -9, "in_progress", "Both units have figures in; the notes are what is missing."],
    ["Recovery plan for Home Electronics' dealer churn", -4, "not_started", ""],
    ["Book the H1 review sessions with each company CEO", -12, "done", ""],
    ["Prepare the H1 review deck for the Group CEO", 3, "in_progress", ""],
    ["Agree Nigeria's credit limits with the Group CFO", 1, "not_started", "Blocks Nigeria's collections policy action."],
    ["Check Finance's forecast accuracy definition against Treasury's", 5, "not_started", ""],
    ["Walk Online Shop through the monthly phasing drawer", 8, "not_started", ""],
    ["Custodian refresher on outcome targets", 10, "not_started", ""],
    ["Confirm Merchandising carries Retail's merchandising pillar", -2, "done", ""],
    ["Close out the Q2 focus-board actions", -1, "in_progress", ""],
    ["Draft the 2027 planning calendar", 17, "not_started", ""],
    ["Review the Data-led Decisions capability with IT", 12, "not_started", ""],
    ["Chase Corporate's managed-service contract list", -6, "done", ""],
    ["Logistics: agree the write-off ceiling for H2", 6, "not_started", ""],
    ["Share the H2 2025 archive with the new custodians", null, "not_started", ""],
  ].map((r, i) => ({ title: r[0], due: r[1] == null ? null : day(r[1]), status: r[2], description: r[3], owner: who(i) }));

  const notes = [
    { title: "H1 review — Distribution company", metOn: day(-14),
      attendees: [{ key: "co_dist" }, { key: "mobhead" }, { key: "cehead" }, { key: "ithead" }, { key: "smo" }],
      raw: "Devices app rollout a quarter late. Home Electronics churn above plan. IT cloud line strong.",
      minutes: {
        summary: "The Distribution company's half: revenue on plan, dealer health the main risk.",
        discussed: ["Devices' app rollout slipping a quarter behind the principal's launch",
                    "Dealer churn in Home Electronics outside the incentive tiers",
                    "Cloud licensing as IT Distribution's fastest-growing line"],
        agreed: ["Devices recovers the app rollout in Q3", "Home Electronics extends the incentive tiers to small dealers"],
        actions: [{ what: "Recovery plan for dealer churn", who: "Fadi Aoun", when: "End of October" },
                  { what: "App rollout recovery dates", who: "Elias Barakat", when: "Next review" }],
        open: ["Whether the incentive tier change needs the Group CFO's approval"],
        next: "Q3 check-in, first week of November",
      } },
    { title: "H1 review — B2C company", metOn: day(-10),
      attendees: [{ key: "co_b2c" }, { key: "rethead" }, { key: "oshead" }, { key: "cahead" }, { key: "smo" }],
      raw: "Retail strong on revenue per store. Online conversion gap. Care first-time fix above target.",
      minutes: {
        summary: "A strong half for Retail and Customer Care; Online Shop's conversion is the gap.",
        discussed: ["Retail's revenue per store ahead of plan, one store behind on permits",
                    "Online Shop conversion at 1.8% against 2.4%",
                    "Customer Care's first-time fix rate above target for the first time"],
        agreed: ["Online Shop runs a checkout review before Q4", "Retail takes online returns from Q3"],
        actions: [{ what: "Checkout review and fixes", who: "Hanan Trad", when: "End of Q3" }],
        open: ["Headcount for Customer Care's next step"],
        next: "Q3 check-in, second week of November",
      } },
    { title: "Monthly focus board", metOn: day(-3),
      attendees: [{ key: "ceo" }, { key: "smo" }, { key: "cfo" }],
      raw: "Walked the focus board. Nigeria margin, logistics external revenue.",
      minutes: {
        summary: "Eleven rows on the board; three need a decision this month.",
        discussed: ["Nigeria's contribution margin at 2.6% against 4.2%",
                    "Logistics' external client revenue behind after two prospects moved"],
        agreed: ["Nigeria's credit limits to be settled this week"],
        actions: [{ what: "Settle Nigeria's credit limits", who: "Group CFO", when: "This week" }],
        open: [],
        next: "",
      } },
  ];
  return { tracker, notes, modules: ["strategy", "tracker", "notes"] };
}

module.exports = { enrich, moduleContent, THIRD_PILLARS };
