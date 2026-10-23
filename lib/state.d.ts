/* THE DATA THE PLATFORM HOLDS, DESCRIBED ONCE (§601).

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
