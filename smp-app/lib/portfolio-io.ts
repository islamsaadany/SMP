/* ── PORTFOLIO: THE ROWS (spec 060 §5) ────────────────────────────────────
   The queries, kept OUT of `lib/portfolio.ts` on purpose: that file is the
   six rules and the roll-up, it touches no database, and `checks/portfolio.mjs`
   runs it with none — which is §8's own promise, *pure functions where they
   can be, provable without a browser*. A query in there would end that.

   EVERY READ AND WRITE IS INSIDE `withTenant` and names no tenant itself:
   the row default and the policy do it (`db/schema.sql`), so a query that
   forgot a `WHERE tenant_id` returns nothing rather than somebody else's
   client (§314). That is why none of these carries one.

   THE PLAN COMES BACK AS ONE FLAT ORDERED ARRAY, which is `lib/portfolio.ts`'s
   `Row[]` and the shape the signed-off drawings already read (§9.13a): a
   phase, then its work packages and activities, in order, with `lvl` saying
   which. Nothing here computes a figure — `rollUp` does, on that array, so
   the server and the drawings cannot arrive at two answers (§5.2). */
import type { PoolClient } from "pg";
import { shortNames } from "./people.ts";
import { placesFor } from "./place.ts";

/* The falsification switch, the same shape `lib/portfolio.ts` uses. NEVER set
   on a deployment; every value is listed in `check:portfolio:module:red`. */
const BRK = () => (typeof process !== "undefined" ? process.env.SMP_BREAK || "" : "");
import {
  type Row, type Lvl, type Role, type ActStatus, type Kind, isRole, isSubStatus,
  ROLE_DEFAULT, KIND_LVL, isRowField, removeRefused, mayMove,
  weightRefused, dateRefused, windowRefused, nameRefused, oneLine,
  cascade, daysBetween, progressFromSubs, manualProgressRefused,
  endDateRefused, stampDates,
} from "./portfolio.ts";

type Q = { query: PoolClient["query"] };

/* The check's break puts the phase row back where it sorted after its own
   direct activities — the fault found by the plan's numbering reading
   `0.1 0.2 1 1.1` — which must turn checks/portfolio-module red (§94.5).
   Never set on a deployment. */
const phaseSort = () => (process.env.SMP_BREAK === "bad-order" ? "0" : "-2");
const str = (v: unknown) => (v == null ? "" : String(v));
/* A calendar day out of a `date` column, never a timestamp: the rules compare
   days as strings, which is exact for this spelling (lib/tracker.ts's rule,
   the same one). */
const day = (v: unknown): string | null =>
  v == null ? null : v instanceof Date ? v.toISOString().slice(0, 10) : String(v).slice(0, 10);

/* ══ a project ═════════════════════════════════════════════════════════ */
export type Project = {
  id: string;
  name: string;
  brief: string;
  agreedStart: string | null;
  agreedEnd: string | null;
  cadence: string | null;
  cadenceDay: number | null;
};
export type Charter = Project & {
  sponsors: unknown[]; consultants: unknown[]; stakeholders: unknown[];
  painDrivers: string; gainDrivers: string;
  inScope: string; outScope: string;
  deliverables: string; successCriteria: string;
  resources: string; risks: string; budget: string;
};

const PROJ_COLS = `id, name, brief, agreed_start, agreed_end,
  checkpoint_cadence, checkpoint_day`;
const CHARTER_COLS = PROJ_COLS + `, sponsors, consultants, stakeholders,
  pain_drivers, gain_drivers, in_scope, out_scope, deliverables,
  success_criteria, resources, risks, budget`;

function shapeProject(r: Record<string, unknown>): Project {
  return {
    id: str(r.id), name: str(r.name), brief: str(r.brief),
    agreedStart: day(r.agreed_start), agreedEnd: day(r.agreed_end),
    cadence: r.checkpoint_cadence == null ? null : str(r.checkpoint_cadence),
    cadenceDay: r.checkpoint_day == null ? null : Number(r.checkpoint_day),
  };
}
function shapeCharter(r: Record<string, unknown>): Charter {
  const list = (v: unknown) => (Array.isArray(v) ? v : []);
  return {
    ...shapeProject(r),
    sponsors: list(r.sponsors), consultants: list(r.consultants), stakeholders: list(r.stakeholders),
    painDrivers: str(r.pain_drivers), gainDrivers: str(r.gain_drivers),
    inScope: str(r.in_scope), outScope: str(r.out_scope),
    deliverables: str(r.deliverables), successCriteria: str(r.success_criteria),
    resources: str(r.resources), risks: str(r.risks), budget: str(r.budget),
  };
}

/* WHICH PROJECTS A VIEWER SEES (§6): a seat sees every one, and anybody else
   sees the ones that NAME them — which is the whole of the rule, so the
   narrowing is in the WHERE rather than in a filter afterwards (§355's own
   lesson: a row kept off a list and still openable by its address is no rule
   at all). `personKey` null with no seat can reach nothing, and says so by
   returning none rather than by an error. */
export async function listProjects(c: Q, w: { office: boolean; personKey: string | null }): Promise<Project[]> {
  /* THE CHECK'S BREAK (constitution XVI): a build that stopped narrowing the
     list to the projects that name somebody must turn checks/portfolio-module
     red before its green run is believed (§94.5). Never set on a deployment. */
  const brk = BRK();
  if (w.office || brk === "see-everything") {
    const r = await c.query(`SELECT ${PROJ_COLS} FROM portfolio_projects ORDER BY name`);
    return r.rows.map(shapeProject);
  }
  if (!w.personKey) return [];
  const r = await c.query(
    `SELECT p.id, p.name, p.brief, p.agreed_start, p.agreed_end,
            p.checkpoint_cadence, p.checkpoint_day
       FROM portfolio_projects p
       JOIN portfolio_members m ON m.project_id = p.id
      WHERE m.person_key = $1
      ORDER BY p.name`, [w.personKey]);
  return r.rows.map(shapeProject);
}

export async function oneProject(c: Q, id: string): Promise<Charter | null> {
  const r = await c.query(`SELECT ${CHARTER_COLS} FROM portfolio_projects WHERE id = $1`, [id]);
  return r.rows[0] ? shapeCharter(r.rows[0] as Record<string, unknown>) : null;
}

export async function addProject(c: Q, a: { name: string; by: string }): Promise<Project> {
  const name = a.name.replace(/\s+/g, " ").trim().slice(0, 200);
  if (!name) throw new Error("a project needs a name");
  const r = await c.query(
    `INSERT INTO portfolio_projects (name, created_by) VALUES ($1, $2) RETURNING ${PROJ_COLS}`,
    [name, a.by]);
  return shapeProject(r.rows[0] as Record<string, unknown>);
}

/* THE CHARTER'S FIELDS, written one at a time from the page's own pen. The
   column list is NAMED here and a field outside it is refused rather than
   ignored, because a write that silently does nothing is the write-only
   column §294.2 records (§42 fails closed). */
export const CHARTER_FIELDS: Record<string, string> = {
  name: "name", brief: "brief",
  painDrivers: "pain_drivers", gainDrivers: "gain_drivers",
  inScope: "in_scope", outScope: "out_scope",
  deliverables: "deliverables", successCriteria: "success_criteria",
  resources: "resources", risks: "risks", budget: "budget",
  agreedStart: "agreed_start", agreedEnd: "agreed_end",
};
const DATE_FIELDS = new Set(["agreedStart", "agreedEnd"]);

export async function setCharter(c: Q, id: string, field: string, value: string): Promise<Charter | null> {
  const col = CHARTER_FIELDS[field];
  if (!col) throw new Error("no such field: " + field);
  let v: string | null = value;
  if (DATE_FIELDS.has(field)) v = /^\d{4}-\d{2}-\d{2}$/.test(value) ? value : null;
  else if (field === "name") {
    v = value.replace(/\s+/g, " ").trim().slice(0, 200);
    if (!v) throw new Error("a project needs a name");
  }
  await c.query(`UPDATE portfolio_projects SET ${col} = $2, updated_at = now() WHERE id = $1`, [id, v]);
  return oneProject(c, id);
}

/* ══ who somebody is on ONE project ════════════════════════════════════ */
export async function roleOn(c: Q, projectId: string, personKey: string | null): Promise<Role | null> {
  if (!personKey) return null;
  const r = await c.query(
    "SELECT role FROM portfolio_members WHERE project_id = $1 AND person_key = $2",
    [projectId, personKey]);
  if (!r.rows[0]) return null;
  const v = str(r.rows[0].role);
  return isRole(v) ? v : ROLE_DEFAULT;
}

/* ══ the plan, as one flat ordered array ═══════════════════════════════ */
/* ORDERED BY POSITION AT EVERY LEVEL, and an activity hung straight off a
   phase comes with that phase's own run rather than after its work packages
   — which is the tree the numbering already describes (§3 №5), and is why
   the sort key carries the work package's position with a NULL sorting
   FIRST. Nothing here is computed: `rollUp` is handed this and writes the
   parents' figures (§9.8). */
export async function planRows(c: Q, projectId: string): Promise<Row[]> {
  const r = await c.query(
    /* A PHASE'S OWN ROW SORTS BEFORE EVERYTHING UNDER IT, which is what
       `-2` is for: an activity hung straight off a phase carries `-1` so it
       comes before that phase's work packages (§3 №5's tree), and a phase
       row at `0` would have sorted AFTER its own direct activities — which
       is not merely the wrong order on the page. `rollUp` and `kidsOf` read
       this array BY POSITION, so a phase drawn after its children rolls up
       the wrong set and every figure on the landing is worked out from it
       (§5.2). Found by the plan's own check reading `0.1 0.2 1 1.1` where
       the numbering should read `1 1.1 1.2 2`. */
    `SELECT 0 AS lvl, ph.id, ph.name, ph.pos AS p1, ${phaseSort()} AS p2, 0 AS p3,
            ph.weight, NULL::date AS planned_start, NULL::date AS planned_end,
            NULL AS status, NULL AS assignee_key, NULL::smallint AS progress,
            false AS is_milestone,
            NULL::date AS actual_start, NULL::date AS actual_end,
            NULL::uuid AS depends_on, '' AS assignee_name,
            NULL::date AS signed_off_on, '' AS signed_off_who
       FROM portfolio_phases ph
      WHERE ph.project_id = $1
      UNION ALL
     SELECT 1, wp.id, wp.name, ph.pos, wp.pos, 0,
            wp.weight, NULL, NULL, NULL, NULL, NULL, false,
            NULL, NULL, NULL, '', NULL, ''
       FROM portfolio_work_packages wp
       JOIN portfolio_phases ph ON ph.id = wp.phase_id
      WHERE ph.project_id = $1
      UNION ALL
     SELECT 2, a.id, a.name,
            COALESCE(ph.pos, ph2.pos), COALESCE(wp.pos, -1), a.pos,
            a.weight, a.planned_start, a.planned_end, a.status, a.assignee_key, a.progress,
            a.is_milestone,
            a.actual_start, a.actual_end, a.depends_on, a.assignee_name,
            (a.signed_off_at AT TIME ZONE 'UTC')::date AS signed_off_on,
            a.signed_off_by AS signed_off_who
       FROM portfolio_activities a
       LEFT JOIN portfolio_work_packages wp ON wp.id = a.work_package_id
       LEFT JOIN portfolio_phases ph  ON ph.id  = wp.phase_id
       LEFT JOIN portfolio_phases ph2 ON ph2.id = a.phase_id
      WHERE COALESCE(ph.project_id, ph2.project_id) = $1
      ORDER BY p1, p2, lvl, p3`, [projectId]);
  return r.rows.map((x: Record<string, unknown>) => {
    const row: Row = { id: str(x.id), lvl: Number(x.lvl) as Lvl, name: str(x.name) };
    if (x.weight != null) row.weight = Number(x.weight);
    if (Number(x.lvl) === 2) {
      row.pct = Number(x.progress || 0);
      row.start = day(x.planned_start);
      row.end = day(x.planned_end);
      row.status = str(x.status) as Row["status"];
      row.assignee = x.assignee_key == null ? null : str(x.assignee_key);
      row.milestone = x.is_milestone === true;
      row.actualStart = day(x.actual_start);
      row.actualEnd = day(x.actual_end);
      row.dependsOn = x.depends_on == null ? null : str(x.depends_on);
      row.assigneeName = str(x.assignee_name);
      row.signedOffAt = day(x.signed_off_on);
      row.signedOffBy = str(x.signed_off_who);
    }
    return row;
  });
}

/* ══ ONE ACTIVITY, for the panel under the plan ════════════════════════ */
/* THE PANEL'S FACTS ARE NOT THE LIST'S, and that is why this is a second
   read rather than more columns on `planRows`: the description, what it
   produces, whether it is billable, its breakdown, who else is on it and
   who signed it off are asked for ONE row — the one somebody opened — and
   loading them for every row of a fifty-row plan would be a join per row
   for facts nothing on that screen prints (§98's own arithmetic).

   THE BREAKDOWN COMES WITH IT, because §3 №2 is that an activity's figure IS
   its breakdown by weight and a panel that showed one without the other
   would be a figure with nothing behind it (§9.8: *a breakdown that
   disagrees with the headline it sits under is worse than none*). */
export type Detail = {
  id: string;
  name: string;
  description: string;
  deliverables: string;
  billable: boolean;
  signedOffBy: string;
  signedOffAt: string | null;
  subs: { id: string; name: string; status: string; weight: number | null }[];
  collaborators: string[];
};

export async function oneActivity(c: Q, projectId: string, id: string): Promise<Detail | null> {
  /* THE PROJECT IS IN THE `WHERE`, never checked afterwards: an activity id
     is a uuid somebody can type, and the plan it belongs to is what decides
     who may read it (§6) — so a row from another project answers *not here*
     rather than being read and then hidden. The tenant is the policy's
     (§314); this is the project's own fence inside it. */
  const r = await c.query(
    `SELECT a.id, a.name, a.description, a.deliverables, a.is_billable,
            a.signed_off_by, a.signed_off_at
       FROM portfolio_activities a
       LEFT JOIN portfolio_work_packages wp ON wp.id = a.work_package_id
       LEFT JOIN portfolio_phases ph  ON ph.id  = wp.phase_id
       LEFT JOIN portfolio_phases ph2 ON ph2.id = a.phase_id
      WHERE a.id = $1` +
      /* The check's break drops the project's own fence, so an activity id
         from another project opens under this project's name — which must
         turn checks/portfolio-module red (§94.5). Never set on a
         deployment. */
      (process.env.SMP_BREAK === "act-anywhere" ? "" : " AND COALESCE(ph.project_id, ph2.project_id) = $2"),
    process.env.SMP_BREAK === "act-anywhere" ? [id] : [id, projectId]);
  const x = r.rows[0] as Record<string, unknown> | undefined;
  if (!x) return null;

  const subs = await c.query(
    "SELECT id, name, status, weight FROM portfolio_sub_activities WHERE activity_id = $1 ORDER BY pos, created_at",
    [id]);
  const co = await c.query(
    "SELECT person_key FROM portfolio_collaborators WHERE activity_id = $1 ORDER BY added_at", [id]);

  return {
    id: str(x.id), name: str(x.name),
    description: str(x.description), deliverables: str(x.deliverables),
    billable: x.is_billable === true,
    signedOffBy: str(x.signed_off_by),
    signedOffAt: x.signed_off_at == null ? null
      : (x.signed_off_at instanceof Date ? x.signed_off_at.toISOString().slice(0, 10) : String(x.signed_off_at).slice(0, 10)),
    subs: (subs.rows as Record<string, unknown>[]).map((v) => ({
      id: str(v.id), name: str(v.name), status: str(v.status),
      weight: v.weight == null ? null : Number(v.weight),
    })),
    collaborators: (co.rows as Record<string, unknown>[]).map((v) => str(v.person_key)),
  };
}

/* ══ SIGNING OFF, AND UNDOING IT (§3 №1, §9.10) ════════════════════════ */
/* THE ONLY PLACE THE REAL END DATE IS WRITTEN, and it is written by
   `stampDates` rather than beside it (§53.5's chokepoint, and the reason
   §7 gives for it: the reference has four copies of that arithmetic and
   the live ones disagree about whether a date snaps to Sunday).

   THE PROJECT IS IN THE `WHERE` on both of them, for `oneActivity`'s own
   reason: an activity id is a uuid somebody can type, and the plan it
   belongs to is what decides who may touch it (§6).

   AND WHAT IS REFUSED IS REFUSED BY NAME (§123): `endDateRefused` answers
   with the reason, which the screen shows BEFORE the press and the server
   says again after it — the same rule twice on purpose, because a screen
   that only narrows a picker has narrowed nothing (§42). */
type Act = { status: ActStatus; progress: number; actualStart: string | null; actualEnd: string | null; end: string | null };

async function actIn(c: Q, projectId: string, id: string): Promise<Act | null> {
  const r = await c.query(
    `SELECT a.status, a.progress, a.actual_start, a.actual_end, a.planned_end
       FROM portfolio_activities a
       LEFT JOIN portfolio_work_packages wp ON wp.id = a.work_package_id
       LEFT JOIN portfolio_phases ph  ON ph.id  = wp.phase_id
       LEFT JOIN portfolio_phases ph2 ON ph2.id = a.phase_id
      WHERE a.id = $1 AND COALESCE(ph.project_id, ph2.project_id) = $2`, [id, projectId]);
  const x = r.rows[0] as Record<string, unknown> | undefined;
  if (!x) return null;
  return {
    status: str(x.status) as ActStatus, progress: Number(x.progress || 0),
    actualStart: day(x.actual_start), actualEnd: day(x.actual_end), end: day(x.planned_end),
  };
}

export async function signOff(
  c: Q, projectId: string, id: string, a: { end: string; by: string; today: string },
): Promise<{ ok: true } | { ok: false; why: string }> {
  const before = await actIn(c, projectId, id);
  if (!before) return { ok: false, why: "That activity is not on this project." };
  /* ONLY WORK SOMEBODY HAS MARKED DONE IS WAITING TO BE ACCEPTED (§6.2's
     two steps): accepting something nobody has finished would make the
     second step the only step. */
  if (before.status !== "done")
    return { ok: false, why: "Only work somebody has marked done can be signed off." };
  const why = endDateRefused(a.end, { start: before.actualStart, today: a.today });
  if (why) return { ok: false, why };
  const d = stampDates({ ...before }, { status: "completed", progress: before.progress, actualEnd: a.end }, a.today);
  await c.query(
    `UPDATE portfolio_activities
        SET status = 'completed', actual_start = $3, actual_end = $4,
            signed_off_by = $5, signed_off_at = now(), updated_at = now()
      WHERE id = $1
        AND (phase_id IN (SELECT id FROM portfolio_phases WHERE project_id = $2)
         OR work_package_id IN (SELECT wp.id FROM portfolio_work_packages wp
              JOIN portfolio_phases ph ON ph.id = wp.phase_id WHERE ph.project_id = $2))`,
    [id, projectId, d.actualStart, d.actualEnd, a.by]);
  return { ok: true };
}

/* REOPENING CLEARS BOTH THE DATE AND WHO ACCEPTED IT, which is what makes
   §9.11's *on-time* reading honest — an activity with no real end date is
   not counted at all there rather than counted as a success (§7.6). The
   progress is left exactly as it was: reopening says *this is not accepted*
   and never *this work was not done*. */
export async function reopen(
  c: Q, projectId: string, id: string, today: string,
): Promise<{ ok: true } | { ok: false; why: string }> {
  const before = await actIn(c, projectId, id);
  if (!before) return { ok: false, why: "That activity is not on this project." };
  if (before.status !== "completed")
    return { ok: false, why: "That activity has not been signed off." };
  const d = stampDates({ ...before }, { status: "done", progress: before.progress }, today);
  await c.query(
    `UPDATE portfolio_activities
        SET status = 'done', actual_start = $3, actual_end = $4,
            signed_off_by = '', signed_off_at = NULL, updated_at = now()
      WHERE id = $1
        AND (phase_id IN (SELECT id FROM portfolio_phases WHERE project_id = $2)
         OR work_package_id IN (SELECT wp.id FROM portfolio_work_packages wp
              JOIN portfolio_phases ph ON ph.id = wp.phase_id WHERE ph.project_id = $2))`,
    [id, projectId, d.actualStart, d.actualEnd]);
  return { ok: true };
}

/* ══ WRITING THE PLAN (§15, spec 060) ══════════════════════════════════ */
/* THE PROJECT IS IN THE `WHERE` ON EVERY ONE OF THESE, for `oneActivity`'s
   own reason: an id is a uuid somebody can type, and the plan it belongs to
   is what decides who may touch it (§6). The tenant is the policy's (§314);
   this is the project's own fence inside it.

   NOTHING HERE DECIDES WHO MAY DO IT. The rules are `lib/portfolio.ts`'s and
   the module asks them before calling any of this, against the STORED row —
   so a control the server would refuse is never drawn, and a press the page
   never drew is still refused (§42, §61, both halves).

   A POSITION IS RENUMBERED, NEVER NUDGED. Every container is rewritten
   0..n-1 in its new order rather than two rows swapping their `pos`, because
   the default is 0 on every column and a swap between two rows that both
   hold it moves nothing — self-healing by construction, and it costs one
   small UPDATE per sibling on a list nobody scrolls (§118's own answer, which
   refuses a commit that is not a permutation for the same reason). */

/* WHICH TABLE A KIND IS, and the column that points at its container. One
   map, because the alternative is three nearly-identical functions and a
   fourth the day a level is added (§104.7). The names are checked against
   `KINDS` by the caller; nothing here takes a table name from a request. */
const TBL: Record<Kind, string> = {
  phase: "portfolio_phases",
  package: "portfolio_work_packages",
  activity: "portfolio_activities",
};

/* IS THIS ROW ON THIS PROJECT — asked before any write, and asked of the
   row's own kind, so an id of the wrong kind answers *not here* rather than
   being written through the wrong table. */
async function rowIn(c: Q, projectId: string, kind: Kind, id: string): Promise<boolean> {
  const sql = kind === "phase"
    ? "SELECT 1 FROM portfolio_phases WHERE id = $1 AND project_id = $2"
    : kind === "package"
    ? `SELECT 1 FROM portfolio_work_packages wp JOIN portfolio_phases ph ON ph.id = wp.phase_id
        WHERE wp.id = $1 AND ph.project_id = $2`
    : `SELECT 1 FROM portfolio_activities a
         LEFT JOIN portfolio_work_packages wp ON wp.id = a.work_package_id
         LEFT JOIN portfolio_phases ph  ON ph.id  = wp.phase_id
         LEFT JOIN portfolio_phases ph2 ON ph2.id = a.phase_id
        WHERE a.id = $1 AND COALESCE(ph.project_id, ph2.project_id) = $2`;
  const r = await c.query(sql, [id, projectId]);
  return r.rowCount === 1;
}

/* ══ adding a row ══════════════════════════════════════════════════════ */
/* APPENDED, NEVER INSERTED (§15.3): a row lands at the foot of its container
   and is moved up with the arrows. What that costs is stated rather than
   discovered — there is no *insert here* — and what it buys is that the add
   row at the foot of a container is the only place a kind is ever decided,
   so the question *which kind did you mean* cannot be asked ambiguously. */
export async function addRow(
  c: Q, projectId: string, kind: Kind, parent: string, name: string,
): Promise<{ ok: true; id: string } | { ok: false; why: string }> {
  const nm = oneLine(name);
  const why = nameRefused(nm);
  if (why) return { ok: false, why };
  /* THE NEW ROW GOES LAST IN ITS CONTAINER, which is §15.3's stated cost and
     not an implementation detail: the number a row reads is its POSITION
     (§5.2), so inserting one in the middle renames every row after it. */
  /* THE BREAK PREPENDS AND MUST STILL BE AN AGGREGATE: written as a bare `0`
     it left a SELECT with no rows to read on an empty container, so the
     INSERT returned nothing and the falsification broke the statement rather
     than reproducing the defect (§375: one proves the check runs, the other
     proves it is about something). */
  const pos = BRK() === "append-anywhere" ? "COALESCE(MIN(pos), 1) - 1" : "COALESCE(MAX(pos), -1) + 1";

  if (kind === "phase") {
    const r = await c.query(
      `INSERT INTO portfolio_phases (project_id, name, pos)
       SELECT $1, $2, ${pos} FROM portfolio_phases WHERE project_id = $1
       RETURNING id`, [projectId, nm]);
    return { ok: true, id: str(r.rows[0].id) };
  }
  if (kind === "package") {
    if (!await rowIn(c, projectId, "phase", parent))
      return { ok: false, why: "That phase is not on this project." };
    const r = await c.query(
      `INSERT INTO portfolio_work_packages (phase_id, name, pos)
       SELECT $1, $2, ${pos} FROM portfolio_work_packages WHERE phase_id = $1
       RETURNING id`, [parent, nm]);
    return { ok: true, id: str(r.rows[0].id) };
  }

  /* AN ACTIVITY HANGS OFF EXACTLY ONE OF TWO PARENTS and the schema says so
     (`portfolio_activity_parent`), so which column is written is decided by
     what the parent IS rather than by a word on the request — a request
     naming both would otherwise be refused by a constraint rather than by a
     sentence (§316.2). */
  const inPkg = await rowIn(c, projectId, "package", parent);
  const inPhase = inPkg ? false : await rowIn(c, projectId, "phase", parent);
  if (!inPkg && !inPhase) return { ok: false, why: "That is not a phase or a work package on this project." };
  const col = inPkg ? "work_package_id" : "phase_id";
  const r = await c.query(
    `INSERT INTO portfolio_activities (${col}, name, pos)
     SELECT $1, $2, ${pos} FROM portfolio_activities WHERE ${col} = $1
     RETURNING id`, [parent, nm]);
  return { ok: true, id: str(r.rows[0].id) };
}

/* ══ moving one ════════════════════════════════════════════════════════ */
/* THE ORDER COMES FROM `planRows` AND THE RULE FROM `mayMove`, so the page
   and the server read one answer about whether an arrow can do anything
   (§53.5, §61) — and the swap is done by RENUMBERING the container, for the
   reason at the top of this block. */
export async function moveRow(
  c: Q, projectId: string, kind: Kind, id: string, dir: -1 | 1, rows: readonly Row[],
): Promise<{ ok: true } | { ok: false; why: string }> {
  if (!await rowIn(c, projectId, kind, id)) return { ok: false, why: "That row is not on this project." };
  if (!mayMove(rows, id, dir)) return { ok: false, why: "There is nowhere for it to go." };

  /* The siblings, in the order the plan reads them — which is `planRows`'
     own order, so the renumber cannot disagree with the page it came from. */
  const lvl = KIND_LVL[kind];
  const i = rows.findIndex((r) => r.id === id);
  const sibs: string[] = [];
  /* Back to the container's edge, then forward: everything at this level
     with nothing shallower crossed is a sibling (§5.2's positional tree). */
  let from = i;
  for (let k = i - 1; k >= 0; k--) { if (rows[k].lvl < lvl) break; if (rows[k].lvl === lvl) from = k; }
  for (let k = from; k < rows.length; k++) {
    if (k > from && rows[k].lvl < lvl) break;
    if (rows[k].lvl === lvl) sibs.push(rows[k].id);
  }
  const at = sibs.indexOf(id);
  if (at < 0) return { ok: false, why: "That row is not where the plan says it is." };
  const to = at + dir;
  if (to < 0 || to >= sibs.length) return { ok: false, why: "There is nowhere for it to go." };
  sibs.splice(to, 0, sibs.splice(at, 1)[0]);

  const t = TBL[kind];
  /* THE WHOLE CONTAINER IS RENUMBERED 0..n-1, never nudged by one: positions
     arrive from a plan that has been added to and removed from, so they are
     not guaranteed contiguous and a swap of two numbers can leave a pair
     reading the same (§48 — the number IS the address somebody reads out). */
  if (BRK() === "no-renumber") {
    await c.query("UPDATE " + t + " SET pos = pos + ($2)::int WHERE id = $1", [id, dir]);
    return { ok: true };
  }
  for (let n = 0; n < sibs.length; n++)
    await c.query("UPDATE " + t + " SET pos = $2 WHERE id = $1", [sibs[n], n]);
  return { ok: true };
}

/* ══ removing one ══════════════════════════════════════════════════════ */
/* REFUSED WHERE IT HOLDS WORK, and the refusal is `removeRefused`'s words
   (§15.6) — the same function the page asked before drawing the press, so
   the sentence is one sentence (§53.5). An activity goes with its breakdown,
   because a sub-activity has no life outside the activity it weighs; the
   schema cascades it.

   AND THERE IS NO ARCHIVE, WHICH IS A STATED DECISION RATHER THAN AN
   OMISSION (§15.6, §15.9 №3): Strategy archives a plan before an upload
   replaces the whole of it, and here a row goes one at a time and
   deliberately — so the guard is the refusal and the confirmation. If that
   is the wrong call it is a table and a restore screen, and the question is
   open rather than answered by silence. */
export async function removeRow(
  c: Q, projectId: string, kind: Kind, id: string, rows: readonly Row[],
): Promise<{ ok: true } | { ok: false; why: string }> {
  if (!await rowIn(c, projectId, kind, id)) return { ok: false, why: "That row is not on this project." };
  const why = removeRefused(rows, id);
  if (why) return { ok: false, why };
  await c.query("DELETE FROM " + TBL[kind] + " WHERE id = $1", [id]);
  return { ok: true };
}

/* ══ a row's own facts ═════════════════════════════════════════════════ */
/* ONE WRITER FOR ALL THREE KINDS, with the field list `ROW_FIELDS`'s — so a
   field name nobody drew is refused by name rather than reaching a column
   (§42's fall-through, closed). The COLUMN each field writes is named here
   and never taken from the request.

   AN EMPTIED VALUE IS AN ABSENCE AND NOT A NOUGHT (§50.6): a cleared weight
   DELETES the number, because storing 0 would quietly re-weight every
   sibling — §243's rule, which is that a blank counts as the average of the
   weights that were set. The same for a date and for a dependency. */
const COL: Record<string, string> = {
  name: "name", weight: "weight", description: "description",
  deliverables: "deliverables", assignee: "assignee_key",
  dependsOn: "depends_on", milestone: "is_milestone", billable: "is_billable",
  start: "planned_start", end: "planned_end",
};

export async function setRowField(
  c: Q, projectId: string, kind: Kind, id: string, field: string, value: string,
  rows: readonly Row[],
): Promise<{ ok: true } | { ok: false; why: string }> {
  if (!isRowField(kind, field)) return { ok: false, why: "No such field." };
  if (!await rowIn(c, projectId, kind, id)) return { ok: false, why: "That row is not on this project." };
  const t = TBL[kind], col = COL[field];

  if (field === "name") {
    const nm = oneLine(value);
    const why = nameRefused(nm);
    if (why) return { ok: false, why };
    await c.query("UPDATE " + t + " SET name = $2 WHERE id = $1", [id, nm]);
    return { ok: true };
  }
  if (field === "weight") {
    const why = weightRefused(value);
    if (why) return { ok: false, why };
    /* AN EMPTIED BOX DELETES THE VALUE rather than storing nought (§50.6,
       §243): a blank counts as the average of the weights that WERE set, so
       a stored 0 would silently re-weight every sibling and read on the page
       as a deliberate *this counts for nothing*. */
    const w = value.trim() === "" ? (BRK() === "weight-nought" ? 0 : null) : Number(value);
    await c.query("UPDATE " + t + " SET weight = $2 WHERE id = $1", [id, w]);
    return { ok: true };
  }
  if (field === "description" || field === "deliverables") {
    await c.query("UPDATE portfolio_activities SET " + col + " = $2, updated_at = now() WHERE id = $1",
      [id, value]);
    return { ok: true };
  }
  if (field === "milestone" || field === "billable") {
    await c.query("UPDATE portfolio_activities SET " + col + " = $2, updated_at = now() WHERE id = $1",
      [id, value === "1" || value === "true"]);
    return { ok: true };
  }
  if (field === "assignee") {
    /* THE KEY IS STORED AND THE NAME IS NOT, because the register is what
       the plan reads a name from at draw time (§48, §130.9) — writing a
       name beside it here is how a rename stops reaching a plan. The stored
       name is cleared with it, or a row would draw the OLD person's name as
       its fallback the day the register stops holding the new one (§288.1). */
    await c.query(
      "UPDATE portfolio_activities SET assignee_key = $2, assignee_name = '', updated_at = now() WHERE id = $1",
      [id, value.trim() === "" ? null : value.trim()]);
    return { ok: true };
  }
  if (field === "dependsOn") {
    const dep = value.trim();
    if (!dep) {
      await c.query("UPDATE portfolio_activities SET depends_on = NULL, updated_at = now() WHERE id = $1", [id]);
      return { ok: true };
    }
    if (dep === id) return { ok: false, why: "An activity cannot wait for itself." };
    if (!await rowIn(c, projectId, "activity", dep))
      return { ok: false, why: "That activity is not on this project." };
    /* A CHAIN THAT LOOPS IS REFUSED BEFORE IT IS STORED, rather than left
       for `cascade` to stop walking (which it does, §9.5) — because a plan
       holding a loop is a plan whose preview silently covers less than it
       should. Walked on the rows this request already read. */
    const by = new Map(rows.map((r) => [r.id, r]));
    for (let at: string | null | undefined = dep, n = 0; at && n <= rows.length; n++) {
      if (at === id) return { ok: false, why: "That would make a circle: it already waits for this one." };
      at = by.get(at)?.dependsOn;
    }
    await c.query("UPDATE portfolio_activities SET depends_on = $2, updated_at = now() WHERE id = $1", [id, dep]);
    return { ok: true };
  }
  /* A planned date. The pair is checked TOGETHER against the row as stored,
     or a start moved past an end is refused by a constraint name (§316.2) —
     and the cascade is a separate act, because moving a date has to show
     you what it moves before it moves anything (§3 №4, §15.5). */
  const why = dateRefused(value);
  if (why) return { ok: false, why };
  const r = rows.find((x) => x.id === id);
  const start = field === "start" ? (value || null) : (r?.start || null);
  const end = field === "end" ? (value || null) : (r?.end || null);
  const bad = windowRefused(start, end);
  if (bad) return { ok: false, why: bad };
  await c.query("UPDATE portfolio_activities SET " + col + " = $2, updated_at = now() WHERE id = $1",
    [id, value || null]);
  return { ok: true };
}

/* ══ moving a date, and what it drags (§3 №4, §15.5) ═══════════════════ */
/* THE SHIFTS ARE THE ONES THE PERSON TICKED, and `cascade`'s preview is what
   they were offered — so this takes a list of ids rather than re-deriving
   it, because a second derivation here could silently cover more rows than
   the dialog showed (§42 with the sign reversed: the screen's promise is
   what must be kept). Every id is checked against the preview, so an id
   nobody was shown cannot ride in on the request.

   A SHIFTED ROW MOVES BOTH ITS DATES BY THE SAME NUMBER OF DAYS, which is
   what *shift* means: moving only the start would compress the work. The
   preview reports the START, because that is the fact somebody reads to
   recognise the row — `cascade` is untouched and is still the one answer to
   what moves (§53.5). */
export async function moveDate(
  c: Q, projectId: string, id: string, end: string, take: readonly string[], rows: readonly Row[],
): Promise<{ ok: true; moved: number } | { ok: false; why: string }> {
  const why = dateRefused(end);
  if (why) return { ok: false, why };
  if (!end) return { ok: false, why: "A window needs an end date." };
  if (!await rowIn(c, projectId, "activity", id)) return { ok: false, why: "That activity is not on this project." };
  const r = rows.find((x) => x.id === id);
  if (!r) return { ok: false, why: "That row is not on this plan." };
  const bad = windowRefused(r.start || null, end);
  if (bad) return { ok: false, why: bad };

  const preview = cascade(rows, id, end);
  const offered = new Map(preview.map((s) => [s.id, s]));
  if (BRK() !== "take-untrusted")
    for (const t of take) if (!offered.has(t)) return { ok: false, why: "That row was not on the list." };

  await c.query("UPDATE portfolio_activities SET planned_end = $2, updated_at = now() WHERE id = $1", [id, end]);
  let moved = 0;
  for (const t of take) {
    const s = offered.get(t)!;
    if (!s.from || !s.to) continue;
    const days = daysBetween(s.from, s.to);
    if (!days) continue;
    /* THE SHIFT IS CAST, OR POSTGRES CANNOT CHOOSE A `+` AT ALL: a bound
       parameter arrives untyped, and `date + unknown` is ambiguous between
       `date + integer` and `date + interval` — so this refused every real
       press with the database's own words where the preview beside it was
       perfectly green (§316.2, §96: the one statement that writes). */
    await c.query(
      `UPDATE portfolio_activities
          SET planned_start = planned_start + ($2)::int,
              planned_end   = planned_end   + ($2)::int,
              updated_at    = now()
        WHERE id = $1`, [t, days]);
    moved++;
  }
  return { ok: true, moved };
}

/* ══ the breakdown (§3 №3) ═════════════════════════════════════════════ */
/* THE FIGURE IS WRITTEN BY `progressFromSubs` AND BY NOTHING ELSE, through
   one function every path here ends in — which is the chokepoint §7 gives
   the reason for: the reference has four copies of this arithmetic and the
   live ones disagree. The real dates follow through `stampDates`, so adding
   a step and finishing it stamps the day the work began (§3 №2's own
   trigger: *one sub-activity started with none finished reads 10%*). */
async function refigure(c: Q, id: string, today: string): Promise<void> {
  const subs = await c.query("SELECT status, weight FROM portfolio_sub_activities WHERE activity_id = $1", [id]);
  const list = (subs.rows as Record<string, unknown>[]).map((v) => ({
    status: str(v.status) as "todo" | "in_progress" | "done",
    weight: v.weight == null ? null : Number(v.weight),
  }));
  const pct = progressFromSubs(list);
  const now = await c.query(
    "SELECT status, progress, actual_start, actual_end FROM portfolio_activities WHERE id = $1", [id]);
  const x = now.rows[0] as Record<string, unknown> | undefined;
  if (!x) return;
  const was = {
    status: str(x.status) as ActStatus, progress: Number(x.progress || 0),
    actualStart: day(x.actual_start), actualEnd: day(x.actual_end),
  };
  /* A COMPLETED ACTIVITY KEEPS ITS STATUS AND ITS ACCEPTED DATE: changing a
     step of something a Lead has already accepted moves the figure and does
     not un-accept it, which is `reopen`'s own act and nobody else's (§6.5).
     Anything else below 100 that was `done` is left `done` too — marking it
     done is a person's statement, not an arithmetic one. */
  const d = stampDates(was, { status: was.status, progress: pct }, today);
  await c.query(
    `UPDATE portfolio_activities SET progress = $2, actual_start = $3,
            actual_end = CASE WHEN status = 'completed' THEN actual_end ELSE $4 END,
            updated_at = now()
      WHERE id = $1`, [id, pct, d.actualStart, was.status === "completed" ? was.actualEnd : d.actualEnd]);
}

export async function addSub(
  c: Q, projectId: string, actId: string, name: string, today: string,
): Promise<{ ok: true; id: string } | { ok: false; why: string }> {
  const nm = oneLine(name);
  const why = nameRefused(nm);
  if (why) return { ok: false, why };
  if (!await rowIn(c, projectId, "activity", actId))
    return { ok: false, why: "That activity is not on this project." };
  const r = await c.query(
    `INSERT INTO portfolio_sub_activities (activity_id, name, pos)
     SELECT $1, $2, COALESCE(MAX(pos), -1) + 1 FROM portfolio_sub_activities WHERE activity_id = $1
     RETURNING id`, [actId, nm]);
  await refigure(c, actId, today);
  return { ok: true, id: str(r.rows[0].id) };
}

/* A STEP'S NAME AND WEIGHT ARE THE PLAN'S; ITS STATUS IS THE REPORT'S
   (§15.7). Two gates on one act, decided by the field — which is the module's
   to ask, because the gate is a rule and this is a query. */
export async function setSubField(
  c: Q, projectId: string, actId: string, id: string, field: "name" | "weight" | "status",
  value: string, today: string,
): Promise<{ ok: true } | { ok: false; why: string }> {
  if (!await rowIn(c, projectId, "activity", actId))
    return { ok: false, why: "That activity is not on this project." };
  const own = await c.query(
    "SELECT 1 FROM portfolio_sub_activities WHERE id = $1 AND activity_id = $2", [id, actId]);
  if (own.rowCount !== 1) return { ok: false, why: "That step is not on this activity." };

  if (field === "name") {
    const nm = oneLine(value);
    const why = nameRefused(nm);
    if (why) return { ok: false, why };
    await c.query("UPDATE portfolio_sub_activities SET name = $2 WHERE id = $1", [id, nm]);
    return { ok: true };
  }
  if (field === "weight") {
    const why = weightRefused(value);
    if (why) return { ok: false, why };
    await c.query("UPDATE portfolio_sub_activities SET weight = $2 WHERE id = $1",
      [id, value.trim() === "" ? null : Number(value)]);
    await refigure(c, actId, today);
    return { ok: true };
  }
  if (!isSubStatus(value)) return { ok: false, why: "No such status." };
  await c.query("UPDATE portfolio_sub_activities SET status = $2 WHERE id = $1", [id, value]);
  await refigure(c, actId, today);
  return { ok: true };
}

export async function removeSub(
  c: Q, projectId: string, actId: string, id: string, today: string,
): Promise<{ ok: true } | { ok: false; why: string }> {
  if (!await rowIn(c, projectId, "activity", actId))
    return { ok: false, why: "That activity is not on this project." };
  const r = await c.query(
    "DELETE FROM portfolio_sub_activities WHERE id = $1 AND activity_id = $2", [id, actId]);
  if (!r.rowCount) return { ok: false, why: "That step is not on this activity." };
  await refigure(c, actId, today);
  return { ok: true };
}

/* ══ the activity's own figure, where there is no breakdown ════════════ */
/* `manualProgressRefused` IS THE RULE AND IT IS ASKED HERE TOO (§42): the
   panel draws no box where a breakdown exists, and the api is reachable
   without the panel — which is the half §15.4 says out loud, that the
   refusal is unreachable from the screen and reachable from the api.

   §3 №3's own words are *typing over it is refused WHEN IT WOULD LIE*, so
   where there is nothing behind the figure the person doing the work types
   it, and the real start is stamped the first time it leaves nought. */
export async function setProgress(
  c: Q, projectId: string, id: string, value: string, today: string,
): Promise<{ ok: true } | { ok: false; why: string }> {
  if (!await rowIn(c, projectId, "activity", id))
    return { ok: false, why: "That activity is not on this project." };
  const n = Math.round(Number(value));
  if (!Number.isFinite(n) || n < 0 || n > 100) return { ok: false, why: "A figure is 0 to 100." };
  const subs = await c.query("SELECT status, weight FROM portfolio_sub_activities WHERE activity_id = $1", [id]);
  const why = manualProgressRefused((subs.rows as Record<string, unknown>[]).map((v) => ({
    status: str(v.status) as "todo" | "in_progress" | "done",
    weight: v.weight == null ? null : Number(v.weight),
  })));
  if (why) return { ok: false, why };
  const before = await actIn(c, projectId, id);
  if (!before) return { ok: false, why: "That activity is not on this project." };
  if (before.status === "completed")
    return { ok: false, why: "That has been signed off. Reopen it first." };
  const d = stampDates({ ...before }, { status: before.status, progress: n }, today);
  await c.query(
    "UPDATE portfolio_activities SET progress = $2, actual_start = $3, actual_end = $4, updated_at = now() WHERE id = $1",
    [id, n, d.actualStart, d.actualEnd]);
  return { ok: true };
}

/* ══ marking it done — the FIRST of the two steps (§3 №1, §6.5) ════════ */
/* WHOEVER IS DOING THE WORK MARKS IT DONE and a Lead accepts it; this is
   that first half, and `signOff` above is the second. The two are separate
   acts with separate gates on purpose, which is the governance rule §3 №1
   calls *not a status list*.

   AND IT TURNS BOTH WAYS, which the drawing does not show and §61 requires:
   a one-way door on a press anybody doing the work can reach is a trap, and
   the way back out of `completed` (`reopen`) is a Lead's. Un-marking leaves
   the figure exactly where it is — saying *this is not finished* is not
   saying *this work was not done* (`reopen`'s own words, one step up).

   THE FIGURE GOES TO 100 ONLY WHERE THERE IS NOTHING BEHIND IT. Where there
   is a breakdown the figure IS the breakdown (§3 №3), so marking done writes
   no figure at all — and an activity marked done whose breakdown is
   half-finished reads as exactly that, which is the honest answer and is
   stated rather than resolved by inventing an arithmetic nobody asked for. */
export async function markDone(
  c: Q, projectId: string, id: string, done: boolean, today: string,
): Promise<{ ok: true } | { ok: false; why: string }> {
  const before = await actIn(c, projectId, id);
  if (!before) return { ok: false, why: "That activity is not on this project." };
  if (before.status === "completed")
    return { ok: false, why: "That has been signed off. Reopening it is the Lead's." };
  if (done && before.status === "done") return { ok: true };
  if (!done && before.status !== "done") return { ok: true };
  /* AND IT TURNS BOTH WAYS. The drawing shows only the pressing; a mark that
     cannot be taken off is a one-way door, and the person who pressed it by
     mistake has to find a Lead to undo a thing that was never sent anywhere
     (§61, §301.6's own shape one module over). */
  if (!done && BRK() === "one-way-done")
    return { ok: false, why: "That is marked done." };

  const subs = await c.query("SELECT 1 FROM portfolio_sub_activities WHERE activity_id = $1 LIMIT 1", [id]);
  const hasSubs = (subs.rowCount || 0) > 0;
  const pct = done ? (hasSubs ? before.progress : 100) : before.progress;
  /* MARKING DONE IS THE FIRST OF TWO STEPS AND NEVER THE SECOND (§3 №1,
     §6.2): the real end date and the signature are written when a Lead
     ACCEPTS it, so collapsing the two here would let everybody close their
     own work and every on-time reading would be their own answer. */
  const status: ActStatus = done
    ? (BRK() === "mark-signs-off" ? "completed" : "done")
    : pct > 0 ? "in_progress" : "not_started";
  const d = stampDates({ ...before }, { status, progress: pct }, today);
  await c.query(
    "UPDATE portfolio_activities SET status = $2, progress = $3, actual_start = $4, actual_end = $5, updated_at = now() WHERE id = $1",
    [id, status, pct, d.actualStart, d.actualEnd]);
  return { ok: true };
}

/* ══ who may be named on a row ═════════════════════════════════════════ */
/* THE ACTIVE REGISTER, with the short name and where each person sits — the
   owner picker's list, and the hint beside a name is the NAVIGATION's own
   word for a place (`placeLabel`) rather than a second vocabulary (§130.9,
   §93.12). A name is never part of the stored answer: the picker posts the
   KEY, so renaming somebody renames them on every plan (§48, §130.9).

   RETIRED PEOPLE ARE NOT OFFERED, which is `lib/tracker.ts`'s own test one
   module over (§247): somebody who cannot sign in cannot report a row, so
   naming them would be pointing a plan at nobody. A row ALREADY assigned to
   somebody off the register keeps its place on the list, added by the panel —
   or opening the pen would read it as Nobody and the next save would clear
   it (§96.2). */
export async function registerFor(c: Q): Promise<{ key: string; name: string; place: string }[]> {
  const r = await c.query(
    `SELECT p.key, COALESCE(NULLIF(p.name, ''), p.key) AS name, p.unit_key, p.fn_key
       FROM people p
      WHERE COALESCE(p.extra->>'active', 'true') <> 'false'
      ORDER BY p.name, p.key`);
  const rows = r.rows as Record<string, unknown>[];
  const short = shortNames(rows.map((x) => ({ key: str(x.key), name: str(x.name) })));
  const places = await placesFor(c);
  const label = new Map(places.map((p) => [p.at, p.label]));
  return rows.map((x) => {
    const unit = str(x.unit_key), fn = str(x.fn_key);
    const at = unit || (fn ? "fn:" + fn : "");
    return { key: str(x.key), name: short.get(str(x.key)) || str(x.name), place: at ? (label.get(at) || "") : "" };
  });
}
