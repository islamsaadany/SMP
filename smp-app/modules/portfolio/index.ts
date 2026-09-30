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

   WHAT IS NOT BUILT YET, said rather than left to be discovered (§54.5): the
   plan, Progress and Analytics. A project opens on its charter, and a row on
   the landing reads *No plan yet* because there is no plan tree to read —
   which is the landing's own signed-off state for a project with none, not a
   placeholder (§9.13). */
import { clientHref } from "../../lib/modules.ts";
import { shellHeaders } from "../../lib/shell.ts";
import { withTenant } from "../../lib/tenant.ts";
import type { ServeArgs } from "../registry.ts";
import {
  inOffice, mayStartProject, mayEditCharter, rollUp, type Row, type Who, type Role,
} from "../../lib/portfolio.ts";
import {
  listProjects, oneProject, addProject, setCharter, roleOn, planRows, oneActivity, CHARTER_FIELDS,
} from "../../lib/portfolio-io.ts";
import { readNames } from "../../lib/people.ts";
import { landingDocument, charterDocument, refusedDocument, seeProject, type Seen } from "./page.ts";
import { planDocument } from "./plan.ts";
import { PLAN_JS } from "./plan-js.ts";
import { APP_JS } from "./script.ts";
/* TODAY IS THE SPINE'S ANSWER (lib/day.ts) and not a second copy: two of the
   office's modules disagreeing about which day it is at 23:30 in Cairo is
   what a row reading *late* on one screen and not on another looks like. This
   file had its own `todayIn` for one commit, which is the fault that moved
   those helpers out of lib/tracker.ts. */
import { todayIn } from "../../lib/day.ts";

const brk = () => process.env.SMP_BREAK || "";
const json = (status: number, body: unknown) =>
  new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json; charset=utf-8", "Cache-Control": "no-store" } });
const no = (status: number, why: string) => json(status, { ok: false, why });
const html = (body: string, status = 200) => new Response(body, { status, headers: shellHeaders() });

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function serve(a: ServeArgs): Promise<Response> {
  const first = a.rest[0] || "";

  const script = (body: string) =>
    new Response(body, { status: 200, headers: { "Content-Type": "application/javascript; charset=utf-8", "Cache-Control": "no-store" } });
  if (first === "app.js" && a.rest.length === 1) return script(APP_JS);
  /* The elbows' own script. The check's break serves the page WITHOUT it,
     which must leave the chart complete and the elbows absent — a page that
     needs its script to be correct is a page that is wrong without one. */
  if (first === "plan.js" && a.rest.length === 1) return script(PLAN_JS);

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
    if (second && second !== "plan")
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
        const want = u.searchParams.get("act") || "";
        /* AN OPENED ROW IS READ THROUGH THE PROJECT (§6): an activity id is a
           uuid somebody can type, so a row from another project answers as
           nothing rather than being drawn under this project's name. */
        const act = want && UUID.test(want) ? await oneActivity(c, first, want) : null;
        const actRow = act ? rows.find((r: Row) => r.id === act.id) || null : null;
        const names = (await readNames(c)).short;
        return html(await planDocument({
          slug: a.slug, tenantId: a.tenantId, tenantName: a.tenantName, have: a.have,
          project, rows, names, today: todayIn(), view, act, actRow, role, office,
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

  return no(400, "Nothing to do.");
}
