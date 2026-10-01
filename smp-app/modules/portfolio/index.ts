/* ── PORTFOLIO SERVES ITSELF (spec 060, built 2026-09-30) ─────────────────
   Four addresses: the landing (`/<client>/portfolio`), one project's charter
   (`/<client>/portfolio/<id>`), the one script, and the api every write is
   POSTed to. Anything else inside the module comes back to the landing
   rather than being refused, which is what every unknown word inside a
   client already gets (lib/modules.ts).

   WHO SEES WHAT IS §6, ASKED HERE AND NOT ONLY IN A MENU (§42, §44): a seat
   on this client reaches every project; anybody else reaches the projects
   that NAME them, and the narrowing is in the query's WHERE rather than in a
   filter afterwards — a project kept off a list and still openable by its
   address is no rule at all (§355's own lesson). A project this viewer
   cannot see answers the same *not found* as one that does not exist, so the
   address cannot be used to discover what a client has.

   EVERY WRITE IS JUDGED AGAINST THE STORED ROW, never against what the page
   drew: the rules are lib/portfolio.ts's, the same ones the page asked before
   drawing the control (§61 — a control the server refuses is never drawn).

   AND SINCE §443 A PLAN IS WRITTEN HERE TOO (§15). THE PEN IS THE ADDRESS
   (`?edit=1`) and the gate is on the RENDER, so a page in edit mode is only
   ever drawn for somebody `mayBuildPlan` allows and every control inside it
   reaches nobody else's document (§61) — and every write below is judged
   again against the stored row, because a screen that only narrows a control
   has narrowed nothing (§42, both halves).

   EVERY WRITE ANSWERS WITH THE PLAN DRAWN AGAIN, by `planBody` — the same
   function that drew the page — which the browser swaps in (§53.5, the
   tracker's own answer at §356.12). So the numbering, which arrow a row may
   use and where an add row goes are worked out in one place, and the browser
   holds no copy of the tree to disagree with.

   WHAT IS NOT BUILT, said rather than left to be discovered (§54.5): a row's
   own WEIGHT has no box on any screen — the api takes one and the drawing
   never showed one, so drawing it would be a visual decision nobody signed
   off (rule 1c); inserting a row in the MIDDLE, which is §15.3's stated cost;
   and an ARCHIVE of a removed row, which is §15.9's third open question. */
import { clientHref } from "../../lib/modules.ts";
import { shellHeaders } from "../../lib/shell.ts";
import { withTenant } from "../../lib/tenant.ts";
import type { ServeArgs } from "../registry.ts";
import {
  inOffice, mayStartProject, mayEditCharter, mayComplete, mayReopen,
  mayBuildPlan, mayReport, mayMarkDone, removeRefused, cascade, renumber,
  isKind, KIND_WORD, rollUp, type Row, type Who, type Role, type Kind,
} from "../../lib/portfolio.ts";
import {
  listProjects, oneProject, addProject, setCharter, roleOn, planRows, oneActivity,
  signOff, reopen, CHARTER_FIELDS, registerFor,
  addRow, moveRow, removeRow, setRowField, moveDate,
  addSub, setSubField, removeSub, setProgress, markDone,
} from "../../lib/portfolio-io.ts";
import { readNames } from "../../lib/people.ts";
import { landingDocument, charterDocument, refusedDocument, seeProject, type Seen } from "./page.ts";
import { planDocument, planBody, type PlanArgs } from "./plan.ts";
import { progressDocument } from "./progress.ts";
import { analyticsDocument } from "./analytics.ts";
import { PLAN_JS } from "./plan-js.ts";
import { WRITE_JS } from "./write-js.ts";
import { PROGRESS_JS } from "./progress-js.ts";
import { APP_JS } from "./script.ts";
/* TODAY IS THE SPINE'S ANSWER (lib/day.ts) and not a second copy: two of the
   office's modules disagreeing about which day it is at 23:30 in Cairo is
   what a row reading *late* on one screen and not on another looks like. This
   file had its own `todayIn` for one commit, which is the fault that moved
   those helpers out of lib/tracker.ts. */
import { todayIn, shortDay } from "../../lib/day.ts";

const brk = () => process.env.SMP_BREAK || "";
const json = (status: number, body: unknown) =>
  new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json; charset=utf-8", "Cache-Control": "no-store" } });
const no = (status: number, why: string) => json(status, { ok: false, why });
const html = (body: string, status = 200) => new Response(body, { status, headers: shellHeaders() });

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/* THE WRITES THAT TAKE A PLAN, named once — so the block below reads the
   project, its membership and its rows ONCE for all of them rather than each
   act repeating four lines of it (§104.7: a list is what a thirteenth act
   cannot forget to join). */
const PLAN_ACTS = [
  "add", "move", "remove", "canremove", "field", "preview", "movedate",
  "subadd", "subfield", "subremove", "progress", "markdone",
];

export async function serve(a: ServeArgs): Promise<Response> {
  const first = a.rest[0] || "";

  const script = (body: string) =>
    new Response(body, { status: 200, headers: { "Content-Type": "application/javascript; charset=utf-8", "Cache-Control": "no-store" } });
  if (first === "app.js" && a.rest.length === 1) return script(APP_JS);
  /* The elbows' own script. The check's break serves the page WITHOUT it,
     which must leave the chart complete and the elbows absent — a page that
     needs its script to be correct is a page that is wrong without one. */
  if (first === "plan.js" && a.rest.length === 1) return script(PLAN_JS);
  /* The pen's own script (§15, §443) — served to anybody, because it does
     nothing without the api's own answers and every one of those is judged
     against the stored row (§42). */
  if (first === "write.js" && a.rest.length === 1) return script(WRITE_JS);
  if (first === "progress.js" && a.rest.length === 1) return script(PROGRESS_JS);

  /* THE SEAT IS THE DOOR'S ANSWER and the role is the project's. The break
     hands a seat to anybody with a membership, which must turn the check red
     (§94.5). Never set on a deployment. */
  const office = brk() === "no-seat-gate" ? a.seat != null : inOffice(a.seat);
  const who = (role: Role | null): Who => ({ seat: office ? (a.seat as Who["seat"]) : "none", role });

  if (first === "api" && a.rest.length === 1) {
    if (a.req.method !== "POST") return no(405, "POST only.");
    let body: unknown = null;
    try { body = await a.req.json(); } catch { body = null; }
    if (!body || typeof body !== "object") return no(400, "Nothing arrived.");
    try {
      return await withTenant(a.tenantId, (c) => act(c, body as Record<string, unknown>, a, office));
    } catch (e) {
      return no(400, e instanceof Error ? e.message : "That could not be done.");
    }
  }

  /* A project's own page. Anything that is not a uuid falls back to the
     landing rather than 404ing, for lib/modules.ts's own reason.

     A READ THAT FAILED IS NOT A PROJECT THAT IS NOT THERE (§35, §93): the
     two answer differently, because one sends somebody to look for a typo
     and the other sends them to whoever runs the platform (§123). */
  if (first && UUID.test(first)) {
    const second = a.rest[1] || "";
    /* A word under a project that is not one of its tabs comes back to the
       project, for the same reason an unknown word inside the module comes
       back to the landing — never a page that looks right (§96). */
    if (second && second !== "plan" && second !== "progress" && second !== "analytics")
      return Response.redirect(new URL(clientHref(a.slug, "portfolio", first), a.req.url), 302);
    try {
    return await withTenant(a.tenantId, async (c) => {
      const role = await roleOn(c, first, a.personKey);
      if (!office && !role)
        return html(await refusedDocument(a.slug, a.tenantId, a.tenantName, a.have,
          "That project does not name you."), 404);
      const project = await oneProject(c, first);
      if (!project)
        return html(await refusedDocument(a.slug, a.tenantId, a.tenantName, a.have,
          "That project is not here."), 404);

      if (second === "plan") {
        /* ONE READ, ROLLED UP ONCE, AND BOTH VIEWS READ IT (§5.2, §9.9): the
           tree and the chart are two readings of this array, so they cannot
           disagree about one project. */
        const rows = rollUp(await planRows(c, first));
        const u = new URL(a.req.url);
        const view = u.searchParams.get("view") === "time" ? "time" : "list";
        /* THE PEN RIDES ON THE ADDRESS AND THE GATE IS ON THE RENDER (§15.1,
           §173): asking for `?edit=1` without the right draws the read page,
           so the mode cannot be reached by typing it. */
        const build = mayBuildPlan(who(role));
        /* THE PEN IS AN ADDRESS AND THE GATE IS ON THE RENDER (§61, §42): with
           `build` out of this line the mode is reachable by TYPING it, so a
           Contributor is drawn every control the api then refuses. */
        const edit = u.searchParams.get("edit") === "1" && (build || brk() === "pen-for-all");
        const want = u.searchParams.get("act") || "";
        /* AN OPENED ROW IS READ THROUGH THE PROJECT (§6): an activity id is a
           uuid somebody can type, so a row from another project answers as
           nothing rather than being drawn under this project's name. */
        const act = want && UUID.test(want) ? await oneActivity(c, first, want) : null;
        const actRow = act ? rows.find((r: Row) => r.id === act.id) || null : null;
        const names = (await readNames(c)).short;
        /* The owner picker's list is read ONLY where the pen is open: a
           reader's page has no picker to fill, and a register read nobody
           prints is a query for nothing (§98's own arithmetic). */
        const people = edit ? await registerFor(c) : [];
        return html(await planDocument({
          slug: a.slug, tenantId: a.tenantId, tenantName: a.tenantName, have: a.have,
          project, rows, names, today: todayIn(), view, act, actRow, role, office,
          edit, build, seat: office ? (a.seat as Who["seat"]) : "none",
          personKey: a.personKey, people,
        }));
      }

      /* PROGRESS AND ANALYTICS READ THE SAME ROLLED-UP ARRAY THE PLAN DOES
         (§5.2, §9.8) — one read, one roll-up, and three screens that cannot
         disagree about one project. Neither is narrowed: what changes for a
         Contributor or a Viewer is which controls are drawn, and that is
         asked of the rules rather than decided here (§9.10, §301). */
      if (second === "progress" || second === "analytics") {
        const rows = rollUp(await planRows(c, first));
        const seat: Who["seat"] = office ? (a.seat as Who["seat"]) : "none";
        if (second === "analytics")
          return html(await analyticsDocument({
            slug: a.slug, tenantId: a.tenantId, tenantName: a.tenantName, have: a.have,
            project, rows, today: todayIn(), role, seat,
          }));
        const names = (await readNames(c)).short;
        return html(await progressDocument({
          slug: a.slug, tenantId: a.tenantId, tenantName: a.tenantName, have: a.have,
          project, rows, names, today: todayIn(), role, seat, personKey: a.personKey,
        }));
      }

      return html(await charterDocument({
        slug: a.slug, tenantId: a.tenantId, tenantName: a.tenantName, have: a.have,
        charter: project, role, office, mayEdit: mayEditCharter(who(role)),
      }));
    });
    } catch (e) {
      console.error("portfolio: reading " + a.slug + "'s project:", (e as Error).message);
      return html(await refusedDocument(a.slug, a.tenantId, a.tenantName, a.have,
        "That project could not be read just now. Nothing has been lost \u2014 try again in a moment."), 503);
    }
  }

  /* A WORD THIS MODULE DOES NOT DRAW COMES BACK TO ITS LANDING, which is
     what every unknown word inside a client already gets (lib/modules.ts
     whereOf) rather than a second refusal to word and keep in step. A uuid
     was handled above, so anything left here is not one. */
  if (a.rest.length)
    return Response.redirect(new URL(clientHref(a.slug, "portfolio", ""), a.req.url), 302);

  /* The landing. A LIST THAT COULD NOT BE READ IS NOT AN EMPTY ONE
     (§35, §93): an empty list says *no projects yet*, which is a statement
     about this client's data, and saying it when nothing was read is the
     false all-clear §231.4 records. */
  const today = todayIn();
  let seen: Seen[] | null = null;
  try {
    seen = await withTenant(a.tenantId, async (c) => {
      const projects = await listProjects(c, { office, personKey: a.personKey });
      const out: Seen[] = [];
      for (const p of projects) {
        const rows = await planRows(c, p.id);
        const role = office ? null : await roleOn(c, p.id, a.personKey);
        out.push(seeProject(p, rows, today, !office && role != null));
      }
      return out;
    });
  } catch (e) {
    console.error("portfolio: reading " + a.slug + "'s projects:", (e as Error).message);
  }
  return html(await landingDocument({
    slug: a.slug, tenantId: a.tenantId, tenantName: a.tenantName, have: a.have,
    seen, today, office, mayStart: mayStartProject(who(null)),
  }));
}

type Q = Parameters<typeof listProjects>[0];

async function act(c: Q, body: Record<string, unknown>, a: ServeArgs, office: boolean): Promise<Response> {
  const what = String(body.act || "");
  const by = a.personKey || "";

  if (what === "start") {
    if (!mayStartProject({ seat: office ? (a.seat as Who["seat"]) : "none", role: null }))
      return no(403, "Starting a project is the office's.");
    const p = await addProject(c, { name: String(body.name || ""), by });
    return json(200, { ok: true, id: p.id, href: clientHref(a.slug, "portfolio", p.id) });
  }

  if (what === "charter") {
    const id = String(body.id || "");
    if (!UUID.test(id)) return no(400, "Which project?");
    const role = await roleOn(c, id, a.personKey);
    /* Judged against the STORED membership, never against what drew the pen. */
    if (!office && !role) return no(404, "That project does not name you.");
    /* The check's break opens the charter to anybody the project names,
       which must turn checks/portfolio-module red (§94.5). Never set on a
       deployment. */
    if (brk() !== "charter-anyone" && !mayEditCharter({ seat: office ? (a.seat as Who["seat"]) : "none", role }))
      return no(403, "The charter is the office's and the project's Lead.");
    const field = String(body.field || "");
    if (!CHARTER_FIELDS[field]) return no(400, "No such field.");
    const out = await setCharter(c, id, field, String(body.value ?? ""));
    if (!out) return no(404, "That project is not here.");
    return json(200, { ok: true, value: (out as unknown as Record<string, unknown>)[field] ?? "" });
  }

  /* ══ the second step of finishing a piece of work (§3 №1, §9.10) ══════ */
  /* JUDGED AGAINST THE STORED ROW AND THE STORED MEMBERSHIP, never against
     what drew the control (§42) — and the activity is read THROUGH the
     project, so an id from another plan answers *not on this project*
     rather than being accepted under this project's rights (§6). */
  if (what === "signoff" || what === "reopen") {
    const id = String(body.id || "");
    const act = String(body.activity || "");
    if (!UUID.test(id) || !UUID.test(act)) return no(400, "Which activity?");
    const role = await roleOn(c, id, a.personKey);
    if (!office && !role) return no(404, "That project does not name you.");
    const w: Who = { seat: office ? (a.seat as Who["seat"]) : "none", role };
    /* THE BREAK OPENS BOTH TO ANYBODY THE PROJECT NAMES, which empties the
       two-step rule §6.5 is keeping — and must turn the check red (§94.5).
       Never set on a deployment. */
    const open = brk() === "anyone-signs";
    if (what === "reopen") {
      if (!open && !mayReopen(w))
        return no(403, "Reopening a sign-off is the office's and the project's Lead.");
      const out = await reopen(c, id, act, todayIn());
      return out.ok ? json(200, { ok: true }) : no(400, out.why);
    }
    if (!open && !mayComplete(w))
      return no(403, "Signing work off is the office's and the project's Lead.");
    const out = await signOff(c, id, act, { end: String(body.end || ""), by: by, today: todayIn() });
    return out.ok ? json(200, { ok: true }) : no(400, out.why);
  }


  /* ══ WRITING THE PLAN (§15, §443) ════════════════════════════════════ */
  /* EVERY ONE OF THESE IS JUDGED AGAINST THE STORED ROW AND THE STORED
     MEMBERSHIP, never against what drew the control (§42) — the page asked
     the same rules before drawing it (§61), and asking twice is what makes
     the api safe to reach without the page.

     AND EVERY ONE ANSWERS WITH THE PLAN DRAWN AGAIN, by `planBody`, so the
     numbering and the arrows cannot be worked out twice (§53.5). */
  if (PLAN_ACTS.includes(what)) {
    const id = String(body.id || body.project || "");
    if (!UUID.test(id)) return no(400, "Which project?");
    const role = await roleOn(c, id, a.personKey);
    if (!office && !role) return no(404, "That project does not name you.");
    const w: Who = { seat: office ? (a.seat as Who["seat"]) : "none", role };
    const project = await oneProject(c, id);
    if (!project) return no(404, "That project is not here.");
    const build = mayBuildPlan(w);

    /* READ BEFORE, so every rule that takes the plan takes the plan AS
       STORED — `removeRefused`, `mayMove` and `cascade` all answer about the
       rows this request found, not the rows the page was drawn from (§42). */
    let rows = rollUp(await planRows(c, id));
    const today = todayIn();
    const rowId = String(body.row || "");
    const actId = String(body.activity || "");
    const kindWord = String(body.kind || "");
    const kind: Kind | null = isKind(kindWord) ? kindWord : null;

    /* THE ACTIVITY'S OWN PERMISSION IS READ OFF THE ROW (§6.2, §15.7): the
       person a row is assigned to writes its breakdown and nothing else, and
       whether they are that person is a fact about the row rather than about
       the membership. */
    const actOf = async (x: string) => (UUID.test(x) ? await oneActivity(c, id, x) : null);
    const rowOf = (x: string) => rows.find((r) => r.id === x) || null;

    const done = async (): Promise<Response> => {
      rows = rollUp(await planRows(c, id));
      /* WHICH ACTIVITY IS STILL OPEN IS THE BROWSER'S TO SAY (§443.9), beside
         the view it already sends: this read was `body.act`, which is the
         NAME OF THE ACT (`add`, `subadd`, `field`) and never a uuid — so it
         was never empty, the `actId || rowId` behind it was unreachable, and
         `act` came back null on every single write. The panel therefore shut
         after every press, which from a screen is the platform forgetting:
         add one step and there was nowhere left to type the second, and a
         reload brought it back with the step in it (§96 — the write landed
         and only the screen was out of step).

         IT IS READ FROM THE SCREEN RATHER THAN FROM THE ACT because the act's
         own fields only coincide with the open panel: `activity` is it for a
         step, `row` is it for a field write, and for an arrow `row` is
         whatever was moved — so reading those would swap the panel under
         somebody's hand on one press of three (§53.5). An untrusted value
         costs nothing: `oneActivity` is scoped to this project and this
         tenant, so the worst a made-up id can do is open a panel the person
         could already open. */
      const want = brk() === "panel-from-act"
        ? String(body.act || actId || rowId || "")   /* the read that was wrong */
        : String(body.open || "");
      const act = want && UUID.test(want) ? await oneActivity(c, id, want) : null;
      const names = (await readNames(c)).short;
      const args: PlanArgs = {
        slug: a.slug, tenantId: a.tenantId, tenantName: a.tenantName, have: a.have,
        project, rows, names, today, view: String(body.view || "") === "time" ? "time" : "list",
        act, actRow: act ? rows.find((r: Row) => r.id === act.id) || null : null,
        /* THE PEN IS OPEN ONLY FOR SOMEBODY WHO MAY BUILD, and the invariant
           is kept HERE and at the page's own construction rather than asked
           again at seven places inside the body (§53.5): a Contributor
           answering a step gets their own breakdown back and no writing
           control, because `report` decides that half and `edit` this one. */
        role, office, edit: build, build, seat: w.seat, personKey: a.personKey,
        people: build ? await registerFor(c) : [],
      };
      return json(200, { ok: true, body: planBody(args) });
    };

    /* ── the tree: adding, moving, removing ─────────────────────────── */
    if (what === "add" || what === "move" || what === "remove" || what === "canremove") {
      if (!build) return no(403, "Building the plan is the office's and the project's Lead.");
      if (!kind) return no(400, "Which kind of row?");

      if (what === "add") {
        const out = await addRow(c, id, kind, String(body.parent || ""), String(body.name || ""));
        if (!out.ok) return no(400, out.why);
        return done();
      }
      if (!UUID.test(rowId)) return no(400, "Which row?");
      /* THE REFUSAL IS ASKED BEFORE THE PRESS AND AGAIN AT IT, and both are
         `removeRefused`'s words — so the dialog and the api cannot say two
         different things about one row (§53.5, §123). */
      if (what === "canremove") {
        const r = rowOf(rowId);
        if (!r) return no(404, "That row is not on this plan.");
        const nums = renumber(rows);
        const title = "Remove " + KIND_WORD[kind] + " " +
          nums[rows.indexOf(r)] + ", " + (r.name || "");
        const why = removeRefused(rows, rowId);
        return json(200, {
          ok: true, title, why: why || "",
          after: why
            ? "Move them to another " + KIND_WORD[kind] + " or remove them first."
            : kind === "activity"
            ? "Its breakdown goes with it. There is no archive and no undo."
            : "Nothing is in it. There is no archive and no undo.",
        });
      }
      if (what === "remove") {
        const out = await removeRow(c, id, kind, rowId, rows);
        if (!out.ok) return no(400, out.why);
        return done();
      }
      const dir = String(body.dir || "") === "down" ? 1 : -1;
      const out = await moveRow(c, id, kind, rowId, dir as -1 | 1, rows);
      if (!out.ok) return no(400, out.why);
      return done();
    }

    /* ── a row's own facts ──────────────────────────────────────────── */
    if (what === "field") {
      if (!build) return no(403, "Changing the plan is the office's and the project's Lead.");
      if (!kind) return no(400, "Which kind of row?");
      if (!UUID.test(rowId)) return no(400, "Which row?");
      const out = await setRowField(c, id, kind, rowId, String(body.field || ""), String(body.value ?? ""), rows);
      if (!out.ok) return no(400, out.why);
      return done();
    }

    /* ── moving a date, which shows you first (§3 №4, §15.5) ────────── */
    /* THE PREVIEW IS THE SERVER'S because `cascade` is a rule, so the dialog
       lists exactly what the write will do rather than a second guess at it
       (§53.5) — and the write takes the ids that were SHOWN, checked against
       this same preview, so nothing nobody saw can ride in (§42). */
    if (what === "preview" || what === "movedate") {
      if (!build) return no(403, "Changing the plan is the office's and the project's Lead.");
      if (!UUID.test(actId)) return no(400, "Which activity?");
      const end = String(body.end || "");
      const r = rowOf(actId);
      if (!r) return no(404, "That activity is not on this plan.");
      if (what === "preview") {
        const nums = renumber(rows);
        const shifts = cascade(rows, actId, end).map((sh) => {
          const x = rowOf(sh.id);
          return {
            id: sh.id, code: x ? nums[rows.indexOf(x)] : "", name: x ? (x.name || "") : "",
            from: sh.from ? shortDay(sh.from, today) : "—",
            to: sh.to ? shortDay(sh.to, today) : "—",
          };
        });
        const n = shifts.length;
        return json(200, {
          ok: true, shifts,
          title: (nums[rows.indexOf(r)] || "") + " " + (r.name || "") + " — moving its end date",
          lede: "Its end date moves from " + (r.end ? shortDay(r.end, today) : "nothing") +
            " to " + (end ? shortDay(end, today) : "nothing") + ". " +
            (n === 1 ? "One row depends on it" : n + " rows depend on it") +
            ", directly or through something that does. They arrive ticked; untick anything" +
            " that stays where it is.",
        });
      }
      const take = Array.isArray(body.take) ? (body.take as unknown[]).map(String) : [];
      const out = await moveDate(c, id, actId, end, take, rows);
      if (!out.ok) return no(400, out.why);
      return done();
    }

    /* ── the breakdown, and the activity's own figure ───────────────── */
    if (what === "subadd" || what === "subfield" || what === "subremove" || what === "progress") {
      if (!UUID.test(actId)) return no(400, "Which activity?");
      const det = await actOf(actId);
      if (!det) return no(404, "That activity is not on this project.");
      const r = rowOf(actId);
      const on = { assignee: r ? r.assignee : null, collaborators: det.collaborators };
      /* A STEP'S NAME AND ITS WEIGHT ARE THE PLAN'S; ITS STATUS IS THE
         REPORT'S (§15.7). Two gates on one act, decided by the field — and
         the drawing's first draft made all three boxes for whoever was
         reporting, which quietly let somebody re-weight their own work. */
      const field = String(body.field || "");
      const planSide = brk() === "report-writes-plan" ? false
        : what === "subadd" || what === "subremove" ||
          (what === "subfield" && field !== "status");
      if (planSide) {
        if (!build) return no(403, "The breakdown's steps and their weights are the plan's.");
      } else if (!mayReport(w, a.personKey, on)) {
        return no(403, "Reporting this activity is the Lead's and whoever it is assigned to.");
      }
      if (what === "subadd") {
        const out = await addSub(c, id, actId, String(body.name || ""), today);
        if (!out.ok) return no(400, out.why);
        return done();
      }
      if (what === "subremove") {
        const out = await removeSub(c, id, actId, String(body.sub || ""), today);
        if (!out.ok) return no(400, out.why);
        return done();
      }
      if (what === "progress") {
        const out = await setProgress(c, id, actId, String(body.value ?? ""), today);
        if (!out.ok) return no(400, out.why);
        return done();
      }
      if (field !== "name" && field !== "weight" && field !== "status")
        return no(400, "No such field.");
      const out = await setSubField(c, id, actId, String(body.sub || ""), field, String(body.value ?? ""), today);
      if (!out.ok) return no(400, out.why);
      return done();
    }

    /* ── marking it done — the FIRST of the two steps (§3 №1, §6.5) ─── */
    if (what === "markdone") {
      if (!UUID.test(actId)) return no(400, "Which activity?");
      const det = await actOf(actId);
      if (!det) return no(404, "That activity is not on this project.");
      const r = rowOf(actId);
      if (!mayMarkDone(w, a.personKey, { assignee: r ? r.assignee : null, collaborators: det.collaborators }))
        return no(403, "Marking this done is the Lead's and whoever it is assigned to.");
      const want = String(body.done ?? "1") === "1";
      const out = await markDone(c, id, actId, want, today);
      if (!out.ok) return no(400, out.why);
      return done();
    }
  }

  return no(400, "Nothing to do.");
}
