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
import { type Row, type Lvl, type Role, isRole, ROLE_DEFAULT } from "./portfolio.ts";

type Q = { query: PoolClient["query"] };
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
    `SELECT 0 AS lvl, ph.id, ph.name, ph.pos AS p1, 0 AS p2, 0 AS p3,
            ph.weight, NULL::date AS planned_start, NULL::date AS planned_end,
            NULL AS status, NULL AS assignee_key, NULL::smallint AS progress,
            false AS is_milestone
       FROM portfolio_phases ph
      WHERE ph.project_id = $1
      UNION ALL
     SELECT 1, wp.id, wp.name, ph.pos, wp.pos, 0,
            wp.weight, NULL, NULL, NULL, NULL, NULL, false
       FROM portfolio_work_packages wp
       JOIN portfolio_phases ph ON ph.id = wp.phase_id
      WHERE ph.project_id = $1
      UNION ALL
     SELECT 2, a.id, a.name,
            COALESCE(ph.pos, ph2.pos), COALESCE(wp.pos, -1), a.pos,
            a.weight, a.planned_start, a.planned_end, a.status, a.assignee_key, a.progress,
            a.is_milestone
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
    }
    return row;
  });
}
