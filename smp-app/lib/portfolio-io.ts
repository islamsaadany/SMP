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
import {
  type Row, type Lvl, type Role, type ActStatus, isRole, ROLE_DEFAULT,
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
  const brk = typeof process !== "undefined" ? process.env.SMP_BREAK || "" : "";
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
