/* THE DATA THE PLATFORM HOLDS, DESCRIBED ONCE (§602).

   Types only: this file is never sent to a browser and never run. The state
   graph is open by design — the server keeps a field it does not know in a
   row's `extra` (§52, §213), so a field can be added without a migration —
   and that is also how a misspelt one is kept, forever, without anybody
   being told. This file is the list of fields that exist. The strategy
   pages' check (smp-app/checks/pages-types.mjs) labels the pages' own data
   with these types in the copy it reads, so a field read or written that
   is not described here is a finding there.

   ADD A FIELD HERE IN THE SAME EDIT AS THE CODE THAT FIRST WRITES IT. The
   check will say so if you do not.

   §615 added the company's own object (GROUP) and its capabilities, the
   same way.

   Written by asking the checker, not by memory: each type started small,
   every field the pages read or write that it did not name came back as a
   finding, and each one was READ before it was added — so a misspelling
   could not be written in as a field. */

declare namespace SMP {
  /** A day as the platform stores it: "2026-10-23". */
  type Day = string;
  /** Who did something, and on which day: the office's own stamp. */
  interface Stamp { by: string | null; at: Day; }

  /* ── THE PLAN: a business unit, its Foundation and its pillars ────── */

  interface Unit {
    name: string;
    /** The short name the navigation shows. */
    navName?: string;
    codePrefix?: string;
    active?: boolean;
    /** False on the worked example's invented units (§13). */
    real?: boolean;
    /** The company (division) the unit belongs to. */
    company?: string;
    /** In memory only: the unit's own key, set as the page loads; never saved. */
    ukey?: string;
    /** In memory only: its share of the group score; never saved. */
    weight?: number;
    logo?: string;
    perf?: { objectives?: number; pillars?: number; exec?: number };
    /** How the unit plans: in pillars (the default), projects or objectives. */
    format?: string;
    /* The Foundation */
    clauses?: string[][];
    /** The unit's Purpose (§478), the company's own field name. */
    mission?: string;
    aspiration?: string;
    endInMind?: string;
    values?: { name: string; def: string }[];
    keyObjectives?: KeyObjective[];
    swot?: Swot;
    compete?: any;
    /** The unit's revenue drivers by sub-channel (spec 063). */
    drivers?: { subs: any[] };
    /* The plan, in whichever format the unit uses */
    items?: Pillar[];
    projects?: any[];
    actions?: any[];
    /** Never on a stored unit: only a capability's unit-like view has one. */
    capKey?: undefined;
  }
  interface Swot { s: string[]; w: string[]; o: string[]; t: string[]; }
  /** A figure the plan is measured by: a key objective or a pillar's measure. */
  interface Figure {
    id?: string;
    name: string;
    /** "≥", "≤" or "=": which way is good. */
    dir?: string;
    target?: string;
    target3y?: string;
    /** How the year's figures make one: "Sum", "Latest", "Average". */
    compile?: string;
    actual?: string;
    progress?: number;
    note?: string;
    /** A figure entered from a figure set rather than on the plan (spec 008). */
    src?: { set: string };
    hide?: boolean;
    /** The revenue driver the figure is built from (spec 063). */
    driver?: string;
  }
  interface KeyObjective extends Figure {}
  interface Measure extends Figure {
    horizon?: string;
  }
  interface Pillar {
    id?: string;
    code?: string;
    name: string;
    sub?: string;
    /** "Capability" or "Direction". */
    kind?: string;
    theme?: string;
    owner?: string;
    custodian?: string;
    /** The supporting function this pillar reads its score from: its carrier (§59). */
    by?: string;
    outcomes?: number | null;
    exec?: number;
    planned?: number;
    measures?: Measure[];
    tactics?: Tactic[];
    /** On the company's plan only: the unit and pillar a pillar was folded
        in from (§447.1), so a second fold does not copy it twice. */
    fromUnit?: string;
    fromId?: string;
  }
  interface Tactic {
    id?: string;
    name: string;
    owner?: string;
    collaborators?: string[];
    /** 1 where the tactic runs in that quarter. */
    q1?: number; q2?: number; q3?: number; q4?: number;
    status?: string;
    actual?: number;
    /** What the tactic should leave behind, its target and which way is good. */
    outcome?: string;
    outTarget?: string;
    outDir?: string;
    outCompile?: string;
    outActual?: any;
    note?: string;
  }

  /* ── THE COMPANY: its own plan, and every setting the client holds (§615) ── */

  /** The company itself: the top layer's Foundation and plan, and the
      client's settings. The server stores six fields in their own columns
      (org, horizon, asOfQuarter, aspiration, endInMind, mission), five as
      tables of their own (clauses, keyObjectives, themes, capabilities,
      weighting), and EVERYTHING ELSE in the org row's `extra`, so every
      setting the product has ever added lands here. */
  interface Group {
    /** The client's name. */
    org: string;
    horizon: string;
    /** The quarter the plan stood as of. No page reads it any more: the review
        point is the cycle's end (§239, §307). The server still keeps the column. */
    asOfQuarter?: number;
    aspiration: string;
    endInMind: string;
    /** The company's Purpose. */
    mission?: string;
    clauses: string[][];
    keyObjectives: GroupKeyObjective[];
    themes?: Theme[];
    capabilities?: Capability[];
    /** How much each unit counts in the company's score: the factors, and
        one row per unit holding a value per factor, keyed by the factor's key. */
    weighting?: { factors: WeightFactor[]; units: WeightRow[] };
    values?: { name: string; def: string }[];
    driversOn?: boolean;
    seasons?: { id: string; name: string; start: Day; end: Day }[];
    mainbus?: { name: string; at: any }[];
    /** The figure sets (spec 008). */
    sets?: { id: string; name: string; team: string; owner: string; pick: string }[];
    claims?: any[];
    portfolio?: { objectives?: number; exec?: number };
    themePillars?: { [themeAb: string]: any[][] };
    themeView?: any[];
    /** The company's own plan when it plans in pillars (§428.2). */
    items?: Pillar[];
    /** Its projects when it plans in projects. */
    topProjects?: any[];
    swot?: Swot;
    /** Client set-up › Structure. Read by the shared rules (lib/rules.js),
        which take it untyped: what each level carries, its titles, its
        exceptions and its plan details. */
    structure?: { [level: string]: any };
    /** Each company's (division's) own Foundation, by company key (§404). */
    coFound?: { [companyKey: string]: CompanyFoundation };
    /** The mark, a PNG data URL. */
    logo?: string;
    /** null anywhere means the shipped palette; an all-null one is dropped
        before a save compares (sync.js normalized()). */
    branding?: { palette: any; font: any; accent: any; bar: any };
    /** How the platform's email reads (§72): absent until something is set. */
    comms?: { headerName?: string; fromName?: string; replyTo?: string; eyebrow?: string; footer?: string };
    /** The office's chat settings (§98); an absent key is its default,
        decided by SMPRules.chatCfg / CHAT_DEFAULTS. */
    chat?: { on?: boolean; fast?: boolean; promise?: string; shots?: boolean; mail?: boolean;
             assistant?: boolean; ask?: boolean; notify?: boolean; popup?: any; rep?: any; away?: any };
    /** The knowledge base's pen (§140): shipped answers overridden, and
        questions added. `w` is the audience, absent for everyone. */
    kb?: { ov?: { [id: string]: { q: string; a: string; w?: string } };
           add?: { id: string; g: string; q: string; a: string; w?: string }[] };
    /** true, or absent: line owners are on. */
    lineOwners?: boolean;
    naming?: boolean;
    /** true, or absent: focus marks are off. */
    focusOff?: boolean;
    /** Hosts whose links play on a slide. Read by the deck; NOTHING WRITES
        IT YET — §261.1 left the storage page's control for later. */
    videoHosts?: string[];
    /** Never on the company itself; its unit-like view (topAsUnit) is "group". */
    ukey?: undefined;
  }
  /** A company's (division's) own Foundation (§404, §611). */
  interface CompanyFoundation {
    clauses: string[][];
    mission: string;
    aspiration: string;
    endInMind: string;
    keyObjectives: KeyObjective[];
    values: { name: string; def: string }[];
    /** Never on a company's Foundation: only a unit carries a key. */
    ukey?: undefined;
  }
  interface Theme { ab: string; name: string; note?: string; }
  interface WeightFactor { key: string; name: string; kind: string; basis?: string; weight: number; }
  /** A unit's row: its key, its name, why it weighs what it does, and a
      value for each factor's key (rev, prof, …), so those names are the
      client's own and cannot be listed here. */
  interface WeightRow { key: string; unit?: string; why?: string; [factorKey: string]: any; }
  /** A capability: the company's (§544.13). */
  interface Capability {
    id?: string;
    name: string;
    navName?: string;
    /** "What it is": its definition. */
    def?: string;
    /** Retired by §544.13: no function holds a capability. Kept as a column. */
    fn?: string | null;
    /** Its owner and custodian: person keys (§412). */
    head?: string | null;
    custodian?: string | null;
    active?: boolean;
    /** "projects" (the default) or "pillars" (§342). */
    format?: string;
    keyObjectives?: CapKeyObjective[];
    projects?: any[];
    /** Its plan when it plans in pillars: one row, shaped like a direction (§491). */
    items?: Pillar[];
    /** Written by a restore onto whatever it restores (§342); a capability
        never plans in actions, so on one this is a list nothing reads. */
    actions?: any[];
    /** In memory only: cleared before scoring (config-data.js). */
    perf?: any;
    exec?: any;
    /** Written by the Copilot's direction builder; read by nothing else. */
    capKind?: string;
    serves?: string[];
    /** Never on a capability: only a function's or a unit's own holder
        (holderOf…) carries these. */
    own?: undefined;
    unit?: undefined;
  }
  /** A capability's objective carries a weight among its siblings. */
  interface CapKeyObjective extends KeyObjective { weight?: number; }
  /** The company's objective may sit under a heading the Temple groups by (§611). */
  interface GroupKeyObjective extends KeyObjective { group?: string | null; }

  /* ── THE REVIEW: the reporting cycle as it stands ─────────────────── */

  interface Review {
    name: string;
    /** The cycle's span in the office's own words: "Jan 2026", "Jun 2026". */
    from: string;
    to: string;
    due: string;
    /** The quarter the cycle ends in. Written by nothing since §47.8 and kept
        as the last fallback for a cycle whose end cannot be read (§239.1). */
    endsQuarter?: number;
    state: "open" | "closed";
    /** The office's note, per unit, function or capability. */
    note: { [target: string]: string };
    /** Who has submitted this cycle (§234: one entry per target travels alone). */
    submitted: { [target: string]: boolean };
    cadence?: string;
    /** A target set aside for this cycle. */
    parked?: { [target: string]: boolean };
    /** A project or pillar marked done this cycle, keyed by its container id. */
    done?: { [containerId: string]: Stamp };
    /** A line locked for reporting, keyed by the line. */
    lines?: { [lineKey: string]: Stamp };
    /** The pictures a target adds to its slides. */
    slides?: { [target: string]: PictureSlide[] };
    /** The contingency copies each person has taken: when, by kind. */
    taken?: { [personKey: string]: { [kind: string]: string } };
    reviewDay?: string;
    reviewAt?: string;
    /** Hours before the due date at which reminders go. */
    remindAt?: number[];
  }

  interface PictureSlide {
    id: string;
    title: string;
    layout: number;
    /** Where the slide sits in the deck: the anchor it follows. */
    at: string;
    /** A slot can be empty (null) between two filled ones. */
    pics: (Picture | null)[];
    /** Absent for a slide of pictures; "video" for a clip (§50.6: never "pics"). */
    kind?: "video";
    vid?: Video;
  }
  interface Picture {
    /** The image itself. */
    src: string;
    cap: string;
    /** Zoom, and the point it is centred on, in per cent of the frame. */
    z: number;
    x: number;
    y: number;
  }
  /** A clip on a slide: uploaded (`path`) or linked (`url`). */
  interface Video {
    path?: string;
    url?: string;
    name?: string;
    secs?: number;
    bytes?: number;
    /** The first frame, as a JPEG data URL. */
    poster?: string;
    by?: string;
    at?: string;
    /** The day the stored clip was cleared away, the slide kept. */
    cleared?: string;
  }
}
