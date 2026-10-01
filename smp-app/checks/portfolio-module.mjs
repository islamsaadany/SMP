/* PORTFOLIO — the module serves itself (spec 060, first slice, 2026-09-30).

   `checks/portfolio.mjs` proves the RULES with no browser and no screen.
   This proves the SCREENS the rules are behind: that the landing shows a
   viewer the projects §6 says they may see and NOT the ones it does not,
   that a project's address is refused to somebody it does not name, that
   starting a project is the office's, and that a charter field typed on the
   page reaches the DATABASE (§96 — a pen wired to nothing renders perfectly).

   BOTH ENDS, EVERY TIME (§94.2): every refusal is asserted beside the same
   act ALLOWED to somebody the rule admits, or a build that refused everybody
   passes half of it (§113.8).

   WHAT IS DRIVEN AND WHAT IS READ (§100.3): every assertion here CALLS the
   module's own `serve()` with the arguments the route hands it, and reads
   the answer — the document's own bytes, or the row Postgres holds after.
   Nothing is read out of the page to prove a write; the database is.

     DATABASE_URL_UNPOOLED=postgres://owner@… node checks/portfolio-module.mjs
     SMP_BREAK=no-seat-gate    node checks/portfolio-module.mjs  # must go red
     SMP_BREAK=see-everything  node checks/portfolio-module.mjs  # must go red
     SMP_BREAK=charter-anyone  node checks/portfolio-module.mjs  # must go red
     SMP_BREAK=no-plan-yet     node checks/portfolio-module.mjs  # must go red
     SMP_BREAK=bad-order       node checks/portfolio-module.mjs  # must go red
     SMP_BREAK=stale-name      node checks/portfolio-module.mjs  # must go red
     SMP_BREAK=both-views      node checks/portfolio-module.mjs  # must go red
     SMP_BREAK=no-elbows       node checks/portfolio-module.mjs  # must go red
     SMP_BREAK=act-anywhere    node checks/portfolio-module.mjs  # must go red
     SMP_BREAK=anyone-signs    node checks/portfolio-module.mjs  # must go red
     SMP_BREAK=gold-on-done    node checks/portfolio-module.mjs  # must go red
     SMP_BREAK=done-is-hit     node checks/portfolio-module.mjs  # must go red
     SMP_BREAK=on-track        node checks/portfolio-module.mjs  # must go red
     SMP_BREAK=far-words       node checks/portfolio-module.mjs  # must go red

   TWO OF THOSE WENT GREEN WHEN THEY WERE FIRST WRITTEN, and both were this
   file rather than the product (§54.5): `stale-name` had no stored name to
   prefer because the fixture never set one, and `act-anywhere` was asserted
   against the PAGE, which has a second fence behind the query — so the
   assertion moved onto the read itself and the page's own refusal is kept
   as the control (§113.8).  */
import pg from "pg";
import { usePools } from "../lib/db.ts";
import { SCHEMA } from "../db/schema-name.mjs";
import { serve } from "../modules/portfolio/index.ts";
import { offerable } from "../lib/modules.ts";
import {
  rollUp, overall, behind, howFar, commitments, msState, hitOnTime,
  waitingSignOff, overdue, nobodyOn, signedOff, nextCheckpoint,
  progressFromSubs,
} from "../lib/portfolio.ts";
import { planRows, oneActivity } from "../lib/portfolio-io.ts";
import { todayIn, readableDay, shortDay } from "../lib/day.ts";

let ok = 0;
const bad = [];
const check = (what, good, detail) => {
  if (good) { ok++; console.log("  ok   " + what); }
  else { bad.push(what); console.log("  FAIL " + what + (detail ? "  — " + detail : "")); }
};
const section = (t) => console.log("\n" + t);

const URL_ = process.env.DATABASE_URL_UNPOOLED || process.env.DATABASE_URL || "";
if (!URL_) {
  console.log("No DATABASE_URL — every section needs one. A check that cannot run is not a check that passed (§54.5).");
  process.exit(1);
}
const pool = new pg.Pool({ connectionString: URL_, max: 4, options: "-c search_path=" + SCHEMA });
const appUrl = new URL(URL_);
appUrl.username = "smp_app";
appUrl.password = process.env.SMP_APP_PASSWORD || "smp_app";
const appPool = new pg.Pool({ connectionString: appUrl.toString(), max: 4, options: "-c search_path=" + SCHEMA });
usePools(pool, appPool);
const owner = async (sql, args) => (await pool.query(sql, args)).rows;

/* The arguments the route hands a module (modules/registry.ts), and nothing
   the route would not. */
const args = (tenantId, rest, who) => ({
  req: new Request("https://smp.example/raya-trade/portfolio" + rest.map((r) => "/" + r).join(""),
    who.body ? { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(who.body) } : undefined),
  slug: "raya-trade", module: "portfolio", tenantId, tenantName: "Raya Trade",
  have: offerable(), rest, personKey: who.personKey ?? null, seat: who.seat ?? null,
});
const get = async (tenantId, rest, who) => {
  const r = await serve(args(tenantId, rest, who));
  return { status: r.status, to: r.headers.get("location") || "", html: r.status === 200 ? await r.text() : "" };
};
const post = async (tenantId, who, body) => {
  const r = await serve(args(tenantId, ["api"], { ...who, body }));
  return { status: r.status, json: await r.json().catch(() => null) };
};

let failed = false;
/* THE TWO CLIENTS THIS MAKES ARE DROPPED IN THE `finally` (§442.15), declared
   out here so a throw still clears them. Written without it at §439, this had
   left **100 pairs** of tenants in the check database by the end of §442 —
   and litter is not tidiness, it is a moving subject: the console's Memory
   page defaults to the FIRST client BY NAME, and `RHI` sorts before
   `Raya Trade` in a case-sensitive sort, so `checks/memory-page.mjs` went 2
   red naming a client it never created. *A check that leaves its world
   changed is measured against its own leftovers the next time anything else
   runs.* `checks/portfolio.mjs`, `tracker.mjs` and `notes.mjs` already do
   this; `insights.mjs` did not and now does. */
let A_ = null, B_ = null;
try {
  await owner("SET search_path TO " + SCHEMA);
  const TODAY = todayIn();
  /* AND A RUN THAT NEVER REACHED ITS `finally` LEFT ITS WORLD BEHIND
     (§442.15, by a third road): the drops are in the `finally` and a run
     killed before the `try` — a syntax error while this file is being
     written — never runs them, so today's crashing runs left sixteen pairs
     and `checks/memory-page.mjs` went 2 red naming a client it never made,
     because the console's Memory page opens on the FIRST client BY NAME and
     `RHI` sorts before `Raya Trade`. Anything of this file's own older than
     an hour goes before we start; a concurrent run is untouched. */
  await owner("DELETE FROM tenants WHERE key LIKE 'pf%' AND created_at < now() - interval '1 hour'")
    .catch(() => {});
  const stamp = "pf" + Date.now().toString(36);
  const [{ id: A }] = await owner("INSERT INTO tenants (key, name) VALUES ($1,$2) RETURNING id", [stamp + "-a", "Raya Trade"]);
  const [{ id: B }] = await owner("INSERT INTO tenants (key, name) VALUES ($1,$2) RETURNING id", [stamp + "-b", "RHI"]);
  A_ = A; B_ = B;
  const person = async (t, key, name, seat, idx) => {
    const [u] = await owner(
      "INSERT INTO users (email, name, kind, is_admin, must_change, password_hash) VALUES ($1,$2,'client',false,false,'x') RETURNING id",
      [stamp + "-" + key + "@example.test", name]);
    await owner("INSERT INTO people (tenant_id, key, idx, name) VALUES ($1,$2,$3,$4)", [t, key, idx, name]);
    await owner("INSERT INTO tenant_users (tenant_id, user_id, person_key, seat) VALUES ($1,$2,$3,$4)", [t, u.id, key, seat]);
  };
  await person(A, "islam", "Islam Saadany", "super", 0);   /* a seat */
  await person(A, "omar", "Omar Tarek", "none", 1);        /* the client's own, named on ONE project */
  await person(A, "hend", "Hend Adel", "none", 2);         /* named on none */
  await person(B, "rhi", "RHI Person", "super", 0);

  const SEAT = { personKey: "islam", seat: "super" };
  const OMAR = { personKey: "omar", seat: "none" };
  const HEND = { personKey: "hend", seat: "none" };

  /* ══ §1 · starting a project is the office's ═══════════════════════ */
  section("§1 · starting a project");
  const bad1 = await post(A, OMAR, { act: "start", name: "Not his to start" });
  check("the client's own person is refused, in words", bad1.status === 403 && /office/i.test(bad1.json?.why || ""), JSON.stringify(bad1));
  check("...and nothing was written — a refusal that wrote a row is not a refusal",
    (await owner("SELECT count(*)::int n FROM portfolio_projects WHERE tenant_id = $1", [A]))[0].n === 0);
  const made = await post(A, SEAT, { act: "start", name: "  Culture   Transformation  " });
  check("a seat starts one — both ends (§94.2)", made.status === 200 && made.json?.ok === true, JSON.stringify(made.json));
  const proj = (await owner("SELECT id, name FROM portfolio_projects WHERE tenant_id = $1", [A]))[0];
  check("...and the row is in the DATABASE, not only in the answer", !!proj, JSON.stringify(proj));
  check("...with its name tidied to one line, the platform's own rule", proj.name === "Culture Transformation", proj.name);
  const empty = await post(A, SEAT, { act: "start", name: "   " });
  check("a project with no name is refused rather than made", empty.status === 400, JSON.stringify(empty.json));

  /* A second project, and one on ANOTHER client, so every list assertion
     below can fail in the direction that matters (§113.8). */
  const other = await post(A, SEAT, { act: "start", name: "Commercial Excellence" });
  await post(B, { personKey: "rhi", seat: "super" }, { act: "start", name: "RHI's own" });
  await owner("INSERT INTO portfolio_members (tenant_id, project_id, person_key, role) VALUES ($1,$2,$3,$4)",
    [A, proj.id, "omar", "lead"]);

  /* ══ §2 · who sees which project ═══════════════════════════════════ */
  section("§2 · the landing shows what §6 says and nothing else");
  const seatPage = await get(A, [], SEAT);
  check("a seat sees every project on this client", seatPage.status === 200 &&
    /Culture Transformation/.test(seatPage.html) && /Commercial Excellence/.test(seatPage.html));
  check("...and NOT another client's — the tenant is the boundary, not a filter",
    !/RHI's own/.test(seatPage.html));
  const omarPage = await get(A, [], OMAR);
  check("somebody named on one project sees that one", /Culture Transformation/.test(omarPage.html));
  check("...and NOT the one that does not name them — both ends (§113.8)",
    !/Commercial Excellence/.test(omarPage.html), omarPage.html.length + " bytes");
  const hendPage = await get(A, [], HEND);
  check("somebody named on none sees none, and is told so rather than shown a blank table (§45.2)",
    !/Culture Transformation/.test(hendPage.html) && /names you yet/.test(hendPage.html));
  check("...and is NOT offered Start a project, which the server would refuse (§61)",
    !/id="start"/.test(hendPage.html));
  check("a seat IS offered it — both ends", /id="start"/.test(seatPage.html));

  /* ══ §3 · a project with no plan says so ═══════════════════════════ */
  section("§3 · no plan yet is the landing's own signed-off state");
  check("a project with no plan reads 'No plan yet', never 0% — a plan nobody wrote and one nobody started are different facts (§35, §93)",
    /No plan yet/.test(seatPage.html) && !/>0%</.test(seatPage.html),
    (seatPage.html.match(/class="(?:noplan|pc)">[^<]*/g) || []).join(" | "));
  check("...and its 'waiting on somebody' is a dash rather than a nought (§35)",
    /class="n clear">\u2014</.test(seatPage.html), (seatPage.html.match(/class="n clear">[^<]*/g) || []).join(" | "));
  check("the strip counts the projects it drew", /class="v">2</.test(seatPage.html));

  /* ══ §4 · a project's address ══════════════════════════════════════ */
  section("§4 · the address, and what it may not be used to discover");
  const mineOpen = await get(A, [proj.id], OMAR);
  check("the Lead opens their own project's charter", mineOpen.status === 200 && /Culture Transformation/.test(mineOpen.html));
  const notMine = await get(A, [other.json.id], OMAR);
  check("a project that does not name them is refused at its own address, not only kept off the list",
    notMine.status === 404, String(notMine.status));
  const ghost = await get(A, ["11111111-1111-1111-1111-111111111111"], SEAT);
  check("...and one that does not exist answers the same 404, so the address cannot be used to discover what a client has",
    ghost.status === 404 && notMine.status === 404);
  const elsewhere = await get(B, [proj.id], { personKey: "rhi", seat: "super" });
  check("another client's seat cannot open this client's project by its id", elsewhere.status === 404);
  const stray = await get(A, ["nothing-here"], SEAT);
  check("a word the module does not draw comes back to its landing (lib/modules.ts's own rule)",
    stray.status === 302 && stray.to.endsWith("/raya-trade/portfolio"), stray.status + " " + stray.to);

  /* ══ §5 · the charter reaches the database ═════════════════════════ */
  section("§5 · a charter field typed on the page reaches the row");
  const wrote = await post(A, SEAT, { act: "charter", id: proj.id, field: "brief", value: "A strategic initiative." });
  check("the office writes a field", wrote.status === 200 && wrote.json?.ok === true, JSON.stringify(wrote.json));
  const back = (await owner("SELECT brief, name FROM portfolio_projects WHERE tenant_id=$1 AND id=$2", [A, proj.id]))[0];
  check("...and it is in the DATABASE — a pen wired to nothing renders perfectly (§96)",
    back.brief === "A strategic initiative.", back.brief);
  const lead = await post(A, OMAR, { act: "charter", id: proj.id, field: "risks", value: "Adoption." });
  check("the project's Lead writes one too — both ends (§5.1a)", lead.status === 200 && lead.json?.ok === true, JSON.stringify(lead.json));
  await owner("UPDATE portfolio_members SET role='viewer' WHERE tenant_id=$1 AND project_id=$2 AND person_key=$3", [A, proj.id, "omar"]);
  const viewer = await post(A, OMAR, { act: "charter", id: proj.id, field: "risks", value: "A Viewer wrote this." });
  check("a Viewer on the same project is refused", viewer.status === 403, JSON.stringify(viewer.json));
  const still = (await owner("SELECT risks FROM portfolio_projects WHERE tenant_id=$1 AND id=$2", [A, proj.id]))[0];
  check("...and the stored value did not move", still.risks === "Adoption.", still.risks);
  const outsider = await post(A, HEND, { act: "charter", id: proj.id, field: "risks", value: "Not on it at all." });
  check("somebody the project does not name is refused as not found, never as forbidden",
    outsider.status === 404, JSON.stringify(outsider.json));
  const nofield = await post(A, SEAT, { act: "charter", id: proj.id, field: "sneaky", value: "x" });
  check("a field outside the named list is refused rather than ignored (§42 fails closed)", nofield.status === 400);
  const baddate = await post(A, SEAT, { act: "charter", id: proj.id, field: "agreedStart", value: "next Tuesday" });
  const dateRow = (await owner("SELECT agreed_start FROM portfolio_projects WHERE tenant_id=$1 AND id=$2", [A, proj.id]))[0];
  check("a date the platform cannot read is stored as an absence, never guessed at (§184)",
    baddate.status === 200 && dateRow.agreed_start === null, JSON.stringify(dateRow));
  const goodDate = await post(A, SEAT, { act: "charter", id: proj.id, field: "agreedStart", value: "2026-01-05" });
  check("...and a real one is kept — both ends", goodDate.status === 200 &&
    (await owner("SELECT agreed_start FROM portfolio_projects WHERE tenant_id=$1 AND id=$2", [A, proj.id]))[0].agreed_start !== null);

  /* ══ §6 · the module's own chrome ══════════════════════════════════ */
  section("§6 · it draws its own document, in the client's colours");
  check("the document says which module it is, and is Portfolio's own title",
    /data-module='portfolio'/.test(seatPage.html) && /<title>Raya Trade &mdash; Portfolio<\/title>/.test(seatPage.html));
  check("nothing on the page is an inline script — the shell's policy admits none",
    !/<script(?![^>]*\ssrc=)/i.test(seatPage.html));
  check("the one script is served at the module's own address",
    /<script src="\/raya-trade\/portfolio\/app\.js"><\/script>/.test(seatPage.html));
  const js = await serve(args(A, ["app.js"], SEAT));
  check("...and that address answers with JavaScript",
    js.status === 200 && /javascript/.test(js.headers.get("content-type") || ""));

  /* ══ §8 · the plan, in two views (§9.9) ════════════════════════════ */
  /* THE FIXTURE'S DATES ARE RELATIVE TO TODAY AND NEVER TYPED, which is the
     one lesson `checks/tracker.mjs` is currently four failures short of:
     every date there was written against the day it was written, and every
     one of them has since gone stale (§214.3's family). A plan whose rows
     are placed either side of today stays true on any day it is run. */
  section("§8 · the plan, in two views");
  const D = (n) => new Date(Date.parse(TODAY + "T00:00:00Z") + n * 864e5).toISOString().slice(0, 10);
  const ph = async (name, pos, weight) => (await owner(
    "INSERT INTO portfolio_phases (tenant_id, project_id, name, pos, weight) VALUES ($1,$2,$3,$4,$5) RETURNING id",
    [A, proj.id, name, pos, weight]))[0].id;
  const wp = async (phase, name, pos) => (await owner(
    "INSERT INTO portfolio_work_packages (tenant_id, phase_id, name, pos) VALUES ($1,$2,$3,$4) RETURNING id",
    [A, phase, name, pos]))[0].id;
  const act = async (o) => (await owner(
    `INSERT INTO portfolio_activities
       (tenant_id, phase_id, work_package_id, name, description, deliverables, pos, weight,
        planned_start, planned_end, actual_start, actual_end, depends_on,
        assignee_key, assignee_name, status, progress, is_milestone, is_billable,
        signed_off_by, signed_off_at)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20,$21) RETURNING id`,
    [A, o.phase || null, o.wp || null, o.name, o.about || "", o.produces || "", o.pos, o.weight ?? null,
     o.s || null, o.e || null, o.rs || null, o.re || null, o.dep || null,
     o.who || null, o.whoName || "", o.status || "not_started", o.pct ?? 0,
     o.ms === true, o.bill === true, o.offBy || "", o.offAt || null]))[0].id;

  const P1 = await ph("Culture audit", 0, null);
  const P2 = await ph("Alignment workshops", 1, null);
  const P3 = await ph("Activation rollout", 2, null);
  /* Phase 1 · two activities hung STRAIGHT off it, which is what the 1.2.3 →
     1.2 collapse is about (§3 №5) — and both finished, so its figure is 100. */
  await act({ phase: P1, name: "Attribute survey", pos: 0, s: D(-90), e: D(-78),
              rs: D(-90), re: D(-78), who: "omar", status: "completed", pct: 100, offBy: "islam", offAt: D(-78) });
  await act({ phase: P1, name: "Leadership interviews", pos: 1, s: D(-75), e: D(-65),
              rs: D(-75), re: D(-65), who: "hend", status: "completed", pct: 100, ms: true, offBy: "islam", offAt: D(-65) });
  /* Phase 2 · one signed off, one marked done and WAITING, one blocked by it
     and past its own date — so the two counts at the top are both non-zero
     and *blocked* has something to derive from. */
  const A21 = await act({ phase: P2, name: "Executive alignment workshop", pos: 0, s: D(-60), e: D(-56),
              rs: D(-60), re: D(-51), who: "omar", status: "completed", pct: 100, ms: true, offBy: "islam", offAt: D(-51) });
  /* MARKED DONE AND AWAITING SIGN-OFF CARRIES NO REAL END DATE, and that is
     the schema refusing it rather than a choice made here: the real end is
     written AT sign-off (§9.10) and `portfolio_activity_signed` enforces it.
     Which means the plan cannot draw this row's overrun — recorded in §12 as
     a finding, because the signed-off drawing draws one for exactly this row
     and the day it was marked done has no column to be read from. */
  const A22 = await act({ phase: P2, name: "Behavioural blueprint", pos: 1, s: D(-50), e: D(-39),
              rs: D(-50), who: "omar", whoName: "Omar T.", status: "done", pct: 100, ms: true, dep: A21, bill: true,
              about: "The pillars, with observable indicators.", produces: "A documented set of behavioural pillars." });
  await act({ phase: P2, name: "Blueprint review", pos: 2, s: D(-34), e: D(-30),
              who: "omar", status: "not_started", pct: 0, ms: true, dep: A22 });
  /* Phase 3 · a work package, so an activity under one takes three parts. */
  const W31 = await wp(P3, "Activation toolkit", 0);
  /* DUE INSIDE THE WARNING WINDOW, so Analytics has a commitment in the
     `soon` state and all six of §9.12's states are drawn at once — the
     drawing's own *one in every state the tracker can draw* (§255), and
     without it two badges would ship unexercised. */
  await act({ wp: W31, name: "Leadership communication guide", pos: 0, s: D(-5), e: D(10),
              rs: D(-5), who: "hend", status: "in_progress", pct: 40, ms: true });
  await act({ wp: W31, name: "Employee engagement resources", pos: 1, s: D(18), e: D(36), status: "not_started", pct: 0 });
  const W32 = await wp(P3, "Leadership-led rollout", 1);
  await act({ wp: W32, name: "Unit-by-unit sessions", pos: 0, s: D(40), e: D(120), status: "not_started", pct: 0 });
  /* A one-day milestone in the future — a DATE and not a stretch of work, so
     the chart draws a diamond rather than a bar (§9.9). */
  await act({ wp: W32, name: "Embed in the performance cycle", pos: 1, s: D(150), e: D(150), status: "not_started", pct: 0, ms: true });

  const plan = await get(A, [proj.id, "plan"], SEAT);
  check("the plan opens for a seat", plan.status === 200 && /Activation rollout/.test(plan.html), String(plan.status));

  /* THE NUMBERS ARE `renumber`'s AND THE COLLAPSE IS VISIBLE: an activity
     hung straight off a phase is TWO parts, one under a work package is
     three — asserted as the sequence, because a build that numbered every
     activity three parts deep reads 1.0.1 (§3 №5). */
  const nums = (plan.html.match(/class="num">([^<]*)</g) || []).map((m) => m.slice(12, -1));
  check("every row is numbered by its position, and 1.2.3 collapses to 1.2 where there is no work package",
    nums.join(" ") === "1 1.1 1.2 2 2.1 2.2 2.3 3 3.1 3.1.1 3.1.2 3.2 3.2.1 3.2.2", nums.join(" "));

  /* A PARENT'S FIGURE IS DERIVED AND NEVER STORED (§9.8): asserted against
     `rollUp`'s own answer over the same rows rather than a typed number, so
     a change to the roll-up moves both at once and cannot move only one. */
  const rolled = await (async () => {
    const c = await pool.connect();
    try {
      await c.query("SELECT set_config('app.tenant_id', $1, true)", [A]);
      return rollUp(await planRows(c, proj.id));
    } finally { c.release(); }
  })();
  const figs = (plan.html.match(/class="fig">([^<]*)</g) || []).map((m) => m.slice(12, -1));
  const want = rolled.map((r) => (r.pct == null ? "\u2014" : r.pct + "%"));
  check("every figure on the page is the one rollUp works out — a page that typed them is what §9.8 records going wrong",
    figs.join(" ") === want.join(" "), figs.join(" ") + "   want: " + want.join(" "));
  check("...and the first phase, both of whose activities are complete, reads 100%",
    figs[0] === "100%", figs[0]);

  /* THE OWNER IS THE REGISTER'S ANSWER, READ AT DRAW TIME (§48, §130.9) —
     and 2.2 carries a DIFFERENT name stored beside its key (`Omar T.`), or
     the break that prefers the stored one has nothing to prefer and goes
     green over the very fault it exists to reproduce (§54.5, found by
     running it). */
  check("an activity's owner is drawn from the register, never from the name stored beside the key",
    /class="pwho">Omar</.test(plan.html) && !/Omar T\./.test(plan.html),
    (plan.html.match(/class="pwho">[^<]*/g) || []).join(" | "));
  await owner("UPDATE people SET name = $1 WHERE tenant_id = $2 AND key = $3", ["Zeinab Farouk", A, "omar"]);
  const renamed = await get(A, [proj.id, "plan"], SEAT);
  check("...so renaming them on the register renames them on the plan — a stored name beside the key would not move",
    /class="pwho">Zeinab</.test(renamed.html) && !/Omar/.test(renamed.html),
    (renamed.html.match(/class="pwho">[^<]*/g) || []).join(" | "));
  await owner("UPDATE people SET name = 'Omar Tarek' WHERE tenant_id = $1 AND key = 'omar'", [A]);

  const marks = plan.html;
  check("a row past its date is marked late, and one that is not is not — both ends (§94.2)",
    /class="win late"/.test(marks) && /class="win">/.test(marks));
  check("a commitment carries the milestone mark", /class="mk">Milestone</.test(marks));
  check("an activity whose dependency is not signed off reads Blocked — derived, never a stored column (§7.6)",
    /class="blk">Blocked</.test(marks), (marks.match(/class="blk">[^<]*/g) || []).join(" | "));
  /* ── FIVE THINGS FOUND BY LOOKING AT THE RENDERED PAGE, and none of them
     by a check (§311.1's own lesson) — so each has an assertion now. ── */
  check("the status column says what the status MEANS, not only what it is called — *Done* beside *Completed* asks the reader to have been told the difference (§6.2, §87)",
    /Waiting to sign off/i.test(marks) && !/>DONE</.test(marks),
    (marks.match(/class="st [a-z]*">[^<]*/g) || []).join(" | "));
  /* THE DATE IS DERIVED FROM `TODAY`, never typed (\u00a7442.11, \u00a7440):
     written as `27 Feb 2027` this read a day that was 150 ahead when it was
     written and is 149 ahead now, so the file went red on a correct build the
     day the clock passed it \u2014 the same fault `checks/tracker.mjs` carried
     for ten days, in a second file. What is asserted is the AGREEMENT with
     `shortDay`, which is the function the page itself draws through
     (\u00a794.8). */
  const oneDay = shortDay(D(150), TODAY);
  check("a one-day commitment reads as one date, never '27 \u2013 27 Feb'",
    marks.includes('class="win">' + oneDay + "<") && !marks.includes(oneDay + " \u2013 " + oneDay),
    oneDay + " \u2014 " + (marks.match(/class="win">[^<]*/g) || []).join(" | "));
  check("a span that crosses a year says BOTH years, or 'Sep \u2013 Feb 27' reads as though September were 2027 too",
    /Sep 26 \u2013 Feb 27/.test(marks), (marks.match(/class="win">[^<]*/g) || []).join(" | "));
  check("the two counts at the top are the rules' own", /waiting for sign-off/.test(marks) && /past their date|past its date/.test(marks));

  /* ══ the timeline ══ */
  const time = await serve({ ...args(A, [proj.id, "plan"], SEAT),
    req: new Request("https://smp.example/raya-trade/portfolio/" + proj.id + "/plan?view=time") });
  const timeHtml = await time.text();
  check("the Timeline is a chart with a month axis, not a second list (§9.9)",
    /class="months"/.test(timeHtml) && /class="track"/.test(timeHtml));
  check("...with a bar per activity and its progress filled in", /class="b"[^>]*><i style="width:40%"/.test(timeHtml),
    (timeHtml.match(/<i style="width:\d+%"/g) || []).join(" "));
  check("...a summary bar on every parent, spanning what is in it — three phases and two work packages",
    (timeHtml.match(/class="b sum"/g) || []).length === 5, String((timeHtml.match(/class="b sum"/g) || []).length));
  check("...a diamond where a commitment is a DATE rather than a stretch of work",
    /class="dia not"/.test(timeHtml));
  /* ONE OVERRUN, AND WHY IT IS ONE: 2.1 is signed off and ran five days past
     its plan, so it has a real end date to draw from; 2.2 ran over too and is
     awaiting sign-off, so it has none and NO overrun is drawn. Asserted as
     exactly one rather than "at least one", or the day that gap is closed
     this passes without anybody noticing (§113.8). */
  check("...a red overrun where a SIGNED-OFF activity ran past its plan, from the stamped date (§3 №3)",
    (timeHtml.match(/class="over"/g) || []).length === 1, String((timeHtml.match(/class="over"/g) || []).length));
  check("...and none on the row awaiting sign-off, which has no real end date to draw from (§12.x's finding)",
    !/class="over"/.test(timeHtml.slice(timeHtml.indexOf("Behavioural blueprint"),
      timeHtml.indexOf("Blueprint review"))));
  check("...and today's line", /class="now"/.test(timeHtml) && /class="nowlab"/.test(timeHtml));
  /* THE DOCUMENT'S OWN WORD, not the rendered one: the axis is uppercased by
     CSS, so asking for "JAN" here reports a correct build broken (§301.6). */
  check("the axis names the year where the scale crosses one, so Jan does not appear twice unlabelled",
    />Jan 27</.test(timeHtml) && />Jan</.test(timeHtml),
    (timeHtml.match(/class="months"[\s\S]{0,400}?<\/span>/) || [""])[0].replace(/<[^>]*>/g, " "));
  check("...and the scale ends on a whole month, so a commitment on its last day is not drawn half outside the track",
    !/class="dia[^"]*" style="left:100%/.test(timeHtml),
    (timeHtml.match(/class="dia[^"]*" style="left:[^"]*/g) || []).join(" | "));
  check("the switch is two links and the one you are on is marked, both ways",
    /class="btn on"[^>]*>List</.test(plan.html) && /class="btn on"[^>]*>Timeline</.test(timeHtml));
  check("...and exactly one view is shown at a time (§94.2)",
    /id="list"[^>]*>/.test(plan.html) && /id="time" hidden/.test(plan.html) &&
    /id="list" hidden/.test(timeHtml) && /id="time">/.test(timeHtml),
    [/id="time" hidden/.test(plan.html), /id="list" hidden/.test(timeHtml)].join(" "));
  check("the elbows' own script is served, because the connectors are measured and cannot be placed here (§122.5)",
    /plan\.js/.test(timeHtml), "no script tag");
  check("...and the chart is WHOLE without it — every bar, diamond and overrun is in the document the server sent",
    /class="b sum"/.test(timeHtml) && /class="dia/.test(timeHtml) && /class="over"/.test(timeHtml));
  const pjs = await serve(args(A, ["plan.js"], SEAT));
  check("...at the module's own address, answering with JavaScript",
    pjs.status === 200 && /javascript/.test(pjs.headers.get("content-type") || ""));

  /* ══ the panel ══ */
  await owner("INSERT INTO portfolio_sub_activities (tenant_id, activity_id, name, pos, weight, status) VALUES " +
    "($1,$2,'Draft the pillars',0,40,'done'),($1,$2,'Indicators for each',1,40,'done'),($1,$2,'Review with the SMO',2,20,'done')",
    [A, A22]);
  await owner("INSERT INTO portfolio_collaborators (tenant_id, activity_id, person_key) VALUES ($1,$2,'hend')", [A, A22]);
  const opened = await serve({ ...args(A, [proj.id, "plan"], SEAT),
    req: new Request("https://smp.example/raya-trade/portfolio/" + proj.id + "/plan?act=" + A22) });
  const panelHtml = await opened.text();
  check("an activity opens a panel rather than a page (§4)", /class="act"/.test(panelHtml) && /Behavioural blueprint/.test(panelHtml));
  check("...carrying what it produces and what it is about", /documented set of behavioural pillars/.test(panelHtml));
  /* REWRITTEN AT §443, NEVER LOOSENED (§214.3, §218): this held the read
     panel's own wording and its `.w` cell, and the writing half draws the same
     three facts in a cell a Lead can type into — so what is asserted is the
     three STEPS, their weights, and that the figure is said to come from them,
     in whatever shape the panel draws them for whoever is looking. */
  check("...its breakdown WITH the weights, beside the figure they add up to (§3 №2, §9.8)",
    /Draft the pillars/.test(panelHtml) && /40/.test(panelHtml) && /20/.test(panelHtml) &&
    /100%/.test(panelHtml) && /by their weights/.test(panelHtml) &&
    /Nobody types it/.test(panelHtml),
    (panelHtml.match(/class="(w|wt)">[^<]*/g) || []).join(" | "));
  check("...what it depends on and what it blocks, by number and name",
    /Depends on/.test(panelHtml) && /2\.1 Executive alignment workshop/.test(panelHtml) &&
    /Blocks/.test(panelHtml) && /2\.3 Blueprint review/.test(panelHtml));
  check("...who else is on it, read from the register", /With/.test(panelHtml) && /Hend/.test(panelHtml));
  /* THE PANEL MUST NOT CONTRADICT ITS OWN STATUS ONE LINE UP (§124): 2.2 is
     marked done and waiting, so *still running* would be false, and its real
     end date does not exist yet — the row says WHERE that date comes from
     rather than leaving the absence to be wondered at (§35). */
  check("...and the 'Actually' row does not claim work marked done is still running (\u00a7124)",
    /written at sign-off/.test(panelHtml) && !/still running/.test(panelHtml),
    (panelHtml.match(/Actually<\/em><div class="v">[^<]*(<[^>]*>[^<]*)*/) || [""])[0].replace(/<[^>]*>/g, ""));
  /* A FLAG AND NOTHING ELSE (§9.9 decision 2): asserted against the panel's
     own field LABELS rather than by searching the document for the word
     "rate" — which the module switcher's own *Strategy* contains, so the
     first version of this reported a correct build broken (§100.3). */
  const labels = (panelHtml.match(/<em>([^<]*)<\/em>/g) || []).map((m) => m.slice(4, -5));
  /* REWRITTEN AT §443, NEVER LOOSENED (§214.3, §218): the signed-off
     writing drawing puts *A milestone* and *Billable* together under ONE label,
     *Marks*, where the read panel had a `Billable` row of its own answering
     *Yes* — so the word that carried the claim moved. THE CLAIM HAS NOT: it
     is a flag, and no field on this panel asks for a rate, hours, an amount or
     an invoice, which is what decision 2 actually settled. */
  check("...that it is billable, which is a flag and nothing else (§9.9 decision 2)",
    /class="mk">Billable</.test(panelHtml) &&
    !labels.some((l) => /rate|hours|amount|invoice|cost/i.test(l)), labels.join(" | "));
  check("...and that files are NOT built, said rather than drawn as an empty row (§9.4, §54.5)",
    /Files/.test(panelHtml) && /Not built yet/.test(panelHtml));
  check("the row it opened is marked in the list", /class="r lvl2 pick"/.test(panelHtml));
  /* AN ACTIVITY IS READ THROUGH ITS PROJECT (§6): a uuid somebody can type
     must not open under a project it does not belong to. */
  const [{ id: strayAct }] = await owner(
    "INSERT INTO portfolio_phases (tenant_id, project_id, name, pos) VALUES ($1,$2,'Other phase',0) RETURNING id",
    [A, other.json.id]);
  const foreign = await act({ phase: strayAct, name: "Not this project's activity", pos: 0, s: D(0), e: D(3) });
  /* ASKED OF THE READ ITSELF, because the page has a SECOND fence behind it
     — the opened row must also be in this project's rows — and that made the
     first version of this assertion unfalsifiable: the break that drops the
     project from the query went green, which is indistinguishable from a
     guard that works (§54.5, found by running it rather than reading it). */
  const wrongRead = await (async () => {
    const c = await pool.connect();
    try {
      await c.query("SELECT set_config('app.tenant_id', $1, true)", [A]);
      return { mine: await oneActivity(c, proj.id, A22), theirs: await oneActivity(c, proj.id, foreign) };
    } finally { c.release(); }
  })();
  check("an activity is read THROUGH its project: one from another project is nothing here",
    wrongRead.theirs === null, JSON.stringify(wrongRead.theirs));
  check("...while this project's own reads — both ends, or a read that found nothing passes half (§113.8)",
    wrongRead.mine !== null && wrongRead.mine.name === "Behavioural blueprint", JSON.stringify(wrongRead.mine?.name));
  const wrongProj = await serve({ ...args(A, [proj.id, "plan"], SEAT),
    req: new Request("https://smp.example/raya-trade/portfolio/" + proj.id + "/plan?act=" + foreign) });
  const wrongHtml = await wrongProj.text();
  check("...and the page draws no panel for it either (the second fence, kept as the control)",
    !/Not this project's activity/.test(wrongHtml), "it opened");

  /* ══ the tabs ══ */
  check("the four tabs are the order §4 settled, on the plan and on the charter",
    /Charter/.test(plan.html) && /Plan/.test(plan.html) && /Progress/.test(plan.html) && /Analytics/.test(plan.html) &&
    /class="tabs"/.test(mineOpen.html));
  /* EVERY TAB IS EITHER A LINK OR A WORD, AND WHICH IT IS FOLLOWS FROM
     WHETHER IT IS BUILT — asserted as that rule rather than by naming the
     two that were unbuilt when this was written (§214.3, §218: §441 opened
     both, and a check holding the list would have gone red on a correct
     build). The word carries no href either way, or a row of dead words
     passes half (§113.8). */
  const BUILT_TABS = ["plan", "progress", "analytics"];
  const UNBUILT_TABS = [];
  /* THE ROW ITSELF, never the whole document: the plan page's own View /
     Timeline switch is two links whose address ends `/plan`, so asking the
     document whether it holds one would report a correct build broken
     (§100.3, caught on the first run of this very assertion). */
  const navOf = (h) => (h.match(/<nav class="tabs">[\s\S]*?<\/nav>/) || [""])[0];
  const navPlan = navOf(plan.html), navChart = navOf(mineOpen.html);
  check("...every built tab is a LINK on the charter, and the one you are on is marked instead",
    BUILT_TABS.every((t) => new RegExp('href="[^"]*/' + t + '"').test(navChart)) &&
    /class="on"[^>]*>Plan</.test(navPlan) &&
    !/href="[^"]*\/plan"/.test(navPlan), navPlan.slice(0, 120));
  check("...and a tab that is NOT built carries the word with no link (§61) — vacuous while all four are built, and kept as the control",
    UNBUILT_TABS.every((t) => /class="soon"[^>]*>/.test(navPlan) &&
      !new RegExp('href="[^"]*/' + t + '"').test(navPlan)));
  const strayTab = await get(A, [proj.id, "budget"], SEAT);
  check("a word under a project that is not one of its tabs comes back to the project, never a page that looks right (§96)",
    strayTab.status === 302 && strayTab.to.endsWith("/" + proj.id), strayTab.status + " " + strayTab.to);

  /* A project with NO plan says so, which is the landing's own signed-off
     state one screen in (§9.13) — both ends, beside the plan above. */
  /* A THIRD project, made HERE and left empty — because the second one has
     had a phase hung off it by the foreign-activity assertion above, and a
     probe that reads what it has just written is measuring itself (§100.3). */
  const third = await post(A, SEAT, { act: "start", name: "Nothing broken down yet" });
  const bare = await get(A, [third.json.id, "plan"], SEAT);
  check("a project with nothing broken down says so rather than drawing an empty table (§45.2)",
    /No plan yet/.test(bare.html) && !/class="head"/.test(bare.html),
    bare.html.length + " bytes");

  /* ══ §9 · Progress — the queue and what is owed (§9.10) ════════════ */
  section("§9 · Progress");
  const rolledNow = async () => {
    const c = await pool.connect();
    try {
      await c.query("SELECT set_config('app.tenant_id', $1, true)", [A]);
      return rollUp(await planRows(c, proj.id));
    } finally { c.release(); }
  };
  await owner("UPDATE portfolio_projects SET checkpoint_cadence='weekly', checkpoint_day=4 WHERE tenant_id=$1 AND id=$2",
    [A, proj.id]);
  const prog = await get(A, [proj.id, "progress"], SEAT);
  check("Progress opens for a seat, with all four sections (§9.10)",
    prog.status === 200 && /Waiting to be signed off/.test(prog.html) && /Past their date/.test(prog.html) &&
    /Nobody is on these/.test(prog.html) && /Signed off/.test(prog.html), String(prog.status));

  /* EVERY COUNT ON IT IS THE RULES' OWN ANSWER (§94.8), never a number typed
     into this file — so a change to what is owed moves the page and the
     check together and cannot move one. */
  const rows9 = await rolledNow();
  const counts = (prog.html.match(/class="v">([^<]*)</g) || []).map((m) => m.slice(10, -1));
  check("...and its three counts are waitingSignOff, overdue and nobodyOn — the rules', not this file's",
    counts.join(" ") === [waitingSignOff(rows9).length, overdue(rows9, TODAY).length, nobodyOn(rows9).length].join(" "),
    counts.join(" "));
  check("...with every one of them non-zero, or the three assertions above pass over nothing (§113.8)",
    counts.every((n) => Number(n) > 0), counts.join(" "));
  const qrows = (prog.html.match(/class="qrow/g) || []).length;
  check("...and the three plain lists draw a row each for overdue, nobody-on and signed off",
    qrows === overdue(rows9, TODAY).length + nobodyOn(rows9).length + signedOff(rows9).length, String(qrows));

  /* BLOCKED IS SAID ON THE ROW AND IS NOT A SECTION (§9.10, §108.1). */
  check("a late row that cannot start says what is in its way, on the row",
    /blocked by 2\.2 Behavioural blueprint/.test(prog.html),
    (prog.html.match(/blocked by[^<]*/g) || []).join(" | "));

  /* THE CHECKPOINT IS A DATE AND NOTHING ELSE, and a project with none draws
     no line rather than being nagged (§45.2 with the sign reversed) — both
     ends, or a build that never drew it passes half. */
  const nextChk = nextCheckpoint("weekly", 4, TODAY);
  check("the checkpoint line names the next date, worked out rather than stored",
    /class="chk"/.test(prog.html) && prog.html.includes(readableDay(String(nextChk))),
    String(nextChk));
  const noChk = await get(A, [other.json.id, "progress"], SEAT);
  check("...and a project with no cadence set draws no line at all — both ends (§94.2)",
    !/class="chk"/.test(noChk.html));

  /* NOTHING IS HIDDEN FROM ANYBODY; WHAT CHANGES IS WHAT CAN BE PRESSED
     (§9.10, §301). Omar is a VIEWER on this project by §5's last write. */
  const progOmar = await get(A, [proj.id, "progress"], OMAR);
  check("a Viewer reads the same four sections and the same counts",
    (progOmar.html.match(/class="v">([^<]*)</g) || []).map((m) => m.slice(10, -1)).join(" ") === counts.join(" "));
  check("...and is offered neither control — a control the server would refuse is never drawn (§61)",
    !/data-signoff/.test(progOmar.html) && !/data-reopen/.test(progOmar.html));
  check("...and is TOLD a Lead does it, rather than shown an empty space (§35)",
    /A Lead signs this off/.test(progOmar.html));
  check("a seat IS offered both — both ends, or a page with no controls passes half (§113.8)",
    /data-signoff/.test(prog.html) && /data-reopen/.test(prog.html));

  /* THE GOLD EDGE MEANS *THIS ONE IS YOURS TO DO* — on what is owed and
     never on what is finished (§41's budget). The break paints it on the
     signed-off list too. */
  const minePos = progOmar.html.indexOf('class="qrow mine"');
  const doneHead = progOmar.html.indexOf("Signed off");
  check("the gold edge is on a row that is theirs and owed",
    minePos > 0 && /2\.3/.test(progOmar.html.slice(minePos, minePos + 200)), String(minePos));
  check("...and never on a finished one — the break paints it there and must redden this (§94.5)",
    (progOmar.html.slice(doneHead).match(/class="qrow mine"/g) || []).length === 0);

  /* SIGNING OFF WRITES, and what proves it is the ROW rather than the page
     (§96 — a control wired to nothing renders perfectly). */
  const a22 = rows9.find((r) => r.name === "Behavioural blueprint");
  const badDate = await post(A, SEAT, { act: "signoff", id: proj.id, activity: a22.id, end: D(7) });
  check("a real end date in the future is refused, by name (§123)",
    badDate.status === 400 && /has not happened/.test(badDate.json?.why || ""), JSON.stringify(badDate.json));
  const early = await post(A, SEAT, { act: "signoff", id: proj.id, activity: a22.id, end: D(-80) });
  check("...and one before the work started is refused, by name",
    early.status === 400 && /before the work started/.test(early.json?.why || ""), JSON.stringify(early.json));
  const viewerSign = await post(A, OMAR, { act: "signoff", id: proj.id, activity: a22.id, end: D(-2) });
  check("a Viewer's press is refused even when the page drew no button (§42)",
    viewerSign.status === 403, JSON.stringify(viewerSign.json));
  const stillDone = (await owner("SELECT status, actual_end FROM portfolio_activities WHERE tenant_id=$1 AND id=$2", [A, a22.id]))[0];
  check("...and the row did not move — a refusal that wrote is not a refusal",
    stillDone.status === "done" && stillDone.actual_end === null, JSON.stringify(stillDone));
  const fromOther = await post(A, SEAT, { act: "signoff", id: other.json.id, activity: a22.id, end: D(-2) });
  check("an activity signed off THROUGH another project is refused — the project is in the WHERE (§6)",
    fromOther.status === 400 && /not on this project/.test(fromOther.json?.why || ""), JSON.stringify(fromOther.json));
  const signed = await post(A, SEAT, { act: "signoff", id: proj.id, activity: a22.id, end: D(-2) });
  check("a seat signs it off — both ends (§94.2)", signed.status === 200 && signed.json?.ok === true, JSON.stringify(signed.json));
  const after = (await owner(
    "SELECT status, actual_end, signed_off_by, signed_off_at FROM portfolio_activities WHERE tenant_id=$1 AND id=$2",
    [A, a22.id]))[0];
  /* A `date` COLUMN COMES BACK AS A Date OBJECT, NOT A STRING (§100.3): the
     first draft compared `String(row.actual_end).slice(0,10)`, which is
     `"Sat Sep 28"` and never a day — so it reported a correct write broken. */
  const day = (v) => (v instanceof Date ? v.toISOString().slice(0, 10) : String(v).slice(0, 10));
  check("...and the DATABASE holds the status, the real end date and who accepted it",
    after.status === "completed" && day(after.actual_end) === D(-2) &&
    after.signed_off_by === "islam" && after.signed_off_at !== null, JSON.stringify(after));
  const twice = await post(A, SEAT, { act: "signoff", id: proj.id, activity: a22.id, end: D(-2) });
  check("...and signing off something nobody has marked done is refused (§6.2's two steps)",
    twice.status === 400 && /marked done/.test(twice.json?.why || ""), JSON.stringify(twice.json));

  /* REOPENING IS GATED EXACTLY LIKE SIGNING OFF (§7.6) and CLEARS both the
     date and who accepted it, which is what makes the on-time reading
     honest (§9.11). */
  const viewerOpen = await post(A, OMAR, { act: "reopen", id: proj.id, activity: a22.id });
  check("a Viewer cannot undo a Lead's sign-off — theirs needs only the work-on gate (§7.6)",
    viewerOpen.status === 403, JSON.stringify(viewerOpen.json));
  const reopened = await post(A, SEAT, { act: "reopen", id: proj.id, activity: a22.id });
  check("a seat reopens it — both ends", reopened.status === 200 && reopened.json?.ok === true, JSON.stringify(reopened.json));
  const back9 = (await owner(
    "SELECT status, actual_start, actual_end, signed_off_by, signed_off_at, progress FROM portfolio_activities WHERE tenant_id=$1 AND id=$2",
    [A, a22.id]))[0];
  check("...and the real end date and who accepted it are CLEARED, while the progress stands",
    back9.status === "done" && back9.actual_end === null && back9.signed_off_at === null &&
    back9.signed_off_by === "" && back9.progress === 100 && back9.actual_start !== null, JSON.stringify(back9));

  const bareProg = await get(A, [third.json.id, "progress"], SEAT);
  check("a project with no plan says so on Progress too, rather than drawing four empty boxes (§45.2)",
    /No plan yet/.test(bareProg.html) && !/class="qrow/.test(bareProg.html));

  /* ══ §10 · Analytics — the reading, not the queue (§9.12) ═══════════ */
  section("§10 · Analytics");
  const an = await get(A, [proj.id, "analytics"], SEAT);
  const rows10 = await rolledNow();
  check("Analytics opens, with TWO sections and nothing else",
    an.status === 200 && /Where each part stands/.test(an.html) && /What we committed to/.test(an.html),
    String(an.status));
  check("...and none of what §9.11 binned, nor Progress's queue — what is absent IS the design (§9.12)",
    !/[Hh]ealth score/.test(an.html) && !/Cancelled/.test(an.html) && !/Waiting to be signed off/.test(an.html) &&
    !/Nobody is on these/.test(an.html) && !/data-signoff/.test(an.html));

  /* READ A VALUE OUT OF ITS CAPTURE GROUP, NEVER OUT OF A COUNTED OFFSET:
     all three of the first draft's `slice(n, -1)` were wrong by one, so three
     correct pages read as broken and the detail printed `>100%` and
     `eadership interviews` (§100.3). A group cannot be miscounted. */
  const grab = (re) => [...an.html.matchAll(re)].map((m) => m[1]);
  const pcts = grab(/class="ppc">([^<]*)</g);
  const parts10 = rows10.filter((r) => r.lvl < 2);
  check("every figure is rollUp's own answer over the same rows, never a typed one (§9.8)",
    pcts.join(" ") === parts10.map((r) => (r.pct ?? 0) + "%").join(" "),
    pcts.join(" ") + "  want " + parts10.map((r) => (r.pct ?? 0) + "%").join(" "));
  check("...and the headline is `overall`'s", an.html.includes(">" + overall(rows10) + "%<"), String(overall(rows10)));

  /* HOW FAR ALONG AND IS IT LATE ARE TWO QUESTIONS (§344, §9.12). */
  const words = grab(/class="pwd [^"]*">([^<]*)</g);
  check("the word beside each bar is howFar's, and the same five the landing reads (§53.5)",
    words.join(" ") === parts10.map((r) => howFar(r.pct ?? 0).word).join(" "), words.join(" "));
  check("...and it is never *On Track*, which is a claim about a schedule a figure cannot see (§344)",
    !/On Track/i.test(an.html));
  const behindNames = parts10.filter((r) => behind(r, TODAY)).map((r) => r.name);
  check("a part that is late wears Behind, and one that is not does not — both ends",
    behindNames.length > 0 && (an.html.match(/class="behind"/g) || []).length === behindNames.length,
    behindNames.join(", "));

  /* THE COMMITMENTS, IN DATE ORDER, REVERSING THE REFERENCE (§9.12). */
  const ms10 = commitments(rows10);
  const msNames = grab(/class="nm2"><b>([^<]*)</g);
  check("every commitment is drawn, in date order — theirs sorts by severity, which is triage (§9.12)",
    msNames.join(" | ") === ms10.map((r) => String(r.name)).join(" | "), msNames.join(" | "));
  const badges = grab(/class="bd ([a-z]+)"/g);
  check("...each wearing the state the rules give it, and all six drawn at once (§255)",
    badges.join(" ") === ms10.map((r) => msState(r, TODAY)).join(" ") && new Set(badges).size === 6,
    badges.join(" "));
  /* AND ONE ASSERTION COULD NOT FAIL AS FIRST WRITTEN (§113.8): it ended in
     `|| true`, so it was green on every build. What it is FOR is that a
     commitment somebody has marked done but nobody has accepted is counted
     in NEITHER headline — the reference counts it as delivered on time. */
  const waiting = ms10.filter((r) => msState(r, TODAY) === "wait");
  check("a commitment MARKED DONE is counted in neither column — theirs counts it as delivered on time (§9.12)",
    waiting.length > 0 && waiting.every((r) => !hitOnTime(r, TODAY) && msState(r, TODAY) !== "late"),
    waiting.map((r) => r.name).join(", "));
  const headline = (an.html.match(/class="v">(\d+) <small>of (\d+)/) || []);
  check("the headline counts only what was accepted ON OR BEFORE its date",
    headline[1] === String(ms10.filter((r) => hitOnTime(r, TODAY)).length) && headline[2] === String(ms10.length),
    headline.slice(1).join(" of "));
  check("...so a commitment accepted five days late is NOT in it, and says how late it was",
    /5 days late/i.test(an.html), (an.html.match(/class="bd late"[^>]*>[^<]*/g) || []).join(" | "));
  check("and the pair that reads like a contradiction is NAMED, on a hover rather than a grey paragraph (§9.12, rule 1b-ii)",
    /class="bd wait" title="[^"]*accepts it/.test(an.html));

  const bareAn = await get(A, [third.json.id, "analytics"], SEAT);
  check("a project with no plan says so on Analytics too (§45.2)",
    /No plan yet/.test(bareAn.html) && !/class="pr /.test(bareAn.html));

  /* ══ §7 · a read that failed is not an empty list ══════════════════ */
  section("§7 · unread is not empty (§35, §93, §231.4)");
  const unread = await get("not-a-tenant-id", [], SEAT);
  check("a list that could not be read says so, and does NOT say there are no projects",
    unread.status === 200 && /could not be read/.test(unread.html) && !/No projects yet/.test(unread.html));
  check("...and its counts read a dash rather than a nought",
    /class="v">\u2014</.test(unread.html), (unread.html.match(/class="v">[^<]*/g) || []).join(" | "));

  /* ══ §11 · WRITING THE PLAN (§15, §443) ════════════════════════════ */
  /* A PROJECT OF ITS OWN, so nothing here moves what §8–§10 measured
     (§94.2) — and three audiences on it, because §15.7 is about which half
     of one panel each of them sees and a file with only a Lead on it proves
     the easy half (§113.8). */
  section("§11 · writing the plan (§15)");
  await person(A, "nadia", "Nadia Fouad", "none", 3);
  const WP = await post(A, SEAT, { act: "start", name: "Operating model" });
  const wproj = WP.json.id;
  const mem = async (key, role) => owner(
    "INSERT INTO portfolio_members (tenant_id, project_id, person_key, role) VALUES ($1,$2,$3,$4)",
    [A, wproj, key, role]);
  await mem("omar", "lead");
  await mem("hend", "contributor");
  await mem("nadia", "viewer");
  const LEAD = OMAR, CONTRIB = HEND, VIEWER = { personKey: "nadia", seat: "none" };
  /* THE QUERY GOES ON THE URL AND NEVER INTO A PATH SEGMENT: `rest` is what
     the route matched, so `"plan?edit=1"` is a word this module does not draw
     and comes back 302 to the landing (§96 from the harness's side -- the
     redirect is the module behaving correctly, and every markup assertion
     under it would have been measuring an empty body). */
  const planOf = async (who, q) => {
    const r = await serve({ ...args(A, [wproj, "plan"], who),
      req: new Request("https://smp.example/raya-trade/portfolio/" + wproj + "/plan" + (q || "")) });
    return { status: r.status, html: r.status === 200 ? await r.text() : "" };
  };
  const rowsOf = () => owner(
    `SELECT 'phase' k, id, name, pos, NULL::uuid parent FROM portfolio_phases WHERE tenant_id=$1 AND project_id=$2
     UNION ALL SELECT 'package', wp.id, wp.name, wp.pos, wp.phase_id FROM portfolio_work_packages wp
       JOIN portfolio_phases ph ON ph.id=wp.phase_id WHERE wp.tenant_id=$1 AND ph.project_id=$2
     UNION ALL SELECT 'activity', a.id, a.name, a.pos, COALESCE(a.work_package_id, a.phase_id) FROM portfolio_activities a
       LEFT JOIN portfolio_work_packages w2 ON w2.id=a.work_package_id
       LEFT JOIN portfolio_phases p1 ON p1.id=w2.phase_id
       LEFT JOIN portfolio_phases p2 ON p2.id=a.phase_id
      WHERE a.tenant_id=$1 AND COALESCE(p1.project_id,p2.project_id)=$2
     ORDER BY 1, 4`, [A, wproj]);

  /* ── the pen is the address, and the gate is on the RENDER ─────────── */
  const readPage = await planOf(SEAT);
  check("with the pen shut nothing on the plan is a box — a reader's page carries no writing code at all",
    !/class="addr"/.test(readPage.html) && !/class="rowbu"/.test(readPage.html) &&
    !/write\.js/.test(readPage.html), (readPage.html.match(/class="(addr|rowbu)"/g) || []).join(" | "));
  const penPage = await planOf(SEAT, "?edit=1");
  /* THE EMPTY PLAN'S PEN PAGE CARRIES THE ADD ROW AND NOT A ROW STRIP, which
     is the product being right: there is nothing yet to move or remove. The
     strip is asserted where rows exist, by the arrows below (§94.5). */
  check("...and the pen opens it for a seat: the strip, the add row and the script",
    /id="pen"/.test(penPage.html) && /class="addr/.test(penPage.html) &&
    /write\.js/.test(penPage.html), String(penPage.status));
  const leadPen = await planOf(LEAD, "?edit=1");
  check("...and for the project's Lead — both ends (§6.2)",
    /class="addr/.test(leadPen.html) && /id="pen"/.test(leadPen.html));
  const conPen = await planOf(CONTRIB, "?edit=1");
  check("A CONTRIBUTOR ASKING FOR `?edit=1` GETS THE READ PAGE: the mode cannot be reached by typing it (§61)",
    conPen.status === 200 && !/class="addr/.test(conPen.html) && !/class="rowbu"/.test(conPen.html) &&
    !/id="pen"/.test(conPen.html), (conPen.html.match(/class="(addr|rowbu)"|id="pen"/g) || []).join(" | "));
  const viewPen = await planOf(VIEWER, "?edit=1");
  check("...and so does a Viewer, who is where everybody lands (§7.4B)",
    viewPen.status === 200 && !/class="addr/.test(viewPen.html) && !/id="pen"/.test(viewPen.html));
  /* REWRITTEN BEFORE IT WAS BELIEVED: this had asked the PEN page for *press
     Edit and name its first phase*, which is the sentence for somebody who may
     build and has the pen SHUT — with it open the add row is drawn instead, so
     the assertion was asking a correct build for a sentence it is right not to
     say (§100.3). Three audiences, three answers, which is what can fail. */
  check("AN EMPTY PLAN TELLS WHOEVER MAY WRITE ONE WHERE TO START, a reader nothing of the sort, and with the pen open it draws the add row instead of either (§45.2, §94.2)",
    /name its first phase/i.test(readPage.html) &&
    /Nothing has been broken down/.test(viewPen.html) && !/name its first phase/i.test(viewPen.html) &&
    !/No plan yet/.test(penPage.html) && new RegExp('data-add="' + wproj + '"').test(penPage.html),
    (readPage.html.match(/No plan yet[^<]*|Press Edit[^<]*/g) || []).join(" | ") + "  //  " +
    (viewPen.html.match(/Nothing has been broken down[^<]*/) || [""])[0]);

  /* ── adding: the kind is decided by WHERE (§15.3) ──────────────────── */
  /* EVERY ROW THE FIXTURE READS BACK DEGRADES (§215): a break that refuses an
     add, or renames a row, leaves one of these empty — and a throw here takes
     every assertion after it with it, which is a run that DIED rather than
     one that reported. The stand-in is a uuid nothing holds, so whatever asked
     for it fails on its own line. */
  const NONE = { id: "00000000-0000-4000-8000-000000000000", k: "", name: "", pos: -99, parent: null };
  /* ...AND SO DOES EVERY SINGLE-ROW READ: a break that deletes a row the
     fixture then asks about hands back no rows, and `rows[0].x` throws where
     an empty object FAILS on its own line and lets the rest report. */
  const one = async (sql, args) => (await owner(sql, args))[0] || {};
  const row = (R, name) => R.find((x) => x.name === name) || NONE;
  const add = (who, kind, parent, name) => post(A, who, { act: "add", id: wproj, kind, parent, name });
  const a1 = await add(SEAT, "phase", wproj, "Design");
  check("a phase is added by naming it, and the api answers with the plan DRAWN AGAIN (§356.12)",
    a1.status === 200 && typeof a1.json?.body === "string" && /Design/.test(a1.json.body), JSON.stringify(a1.json).slice(0, 120));
  let R = await rowsOf();
  const phDesign = row(R, "Design");
  check("...and it is in the DATABASE — a pen wired to nothing renders perfectly (§96)",
    !!phDesign && phDesign.k === "phase", JSON.stringify(R));
  await add(SEAT, "phase", wproj, "Build");
  await add(SEAT, "package", phDesign.id, "Discovery");
  R = await rowsOf();
  const pkg = row(R, "Discovery");
  check("a work package hangs off the phase it was typed under, never off the project",
    !!pkg && pkg.k === "package" && pkg.parent === phDesign.id, JSON.stringify(pkg));
  const phBuild = row(R, "Build");
  check("...and APPENDED, which is §15.3's stated cost — no inserting in the middle",
    phDesign.pos === 0 && phBuild.pos === 1, phDesign.pos + " / " + phBuild.pos);
  await add(SEAT, "activity", pkg.id, "Interviews");
  await add(SEAT, "activity", phBuild.id, "Pilot");
  R = await rowsOf();
  const actIn = row(R, "Interviews"), actOff = row(R, "Pilot");
  check("AN ACTIVITY HANGS OFF EXACTLY ONE OF TWO PARENTS and which column is written is decided by what the parent IS (§7.6)",
    actIn.parent === pkg.id && actOff.parent === phBuild.id, JSON.stringify([actIn, actOff]));
  const nameless = await add(SEAT, "phase", wproj, "   ");
  check("a row with no name is refused by a sentence, never by a constraint's name (§316.2)",
    nameless.status === 400 && /needs a name/i.test(nameless.json?.why || ""), JSON.stringify(nameless.json));
  const strayPhase = await add(SEAT, "package", proj.id, "Not its phase");
  check("...and a parent on another project is refused as not on this one (§6)",
    strayPhase.status === 400 && /not on this project/i.test(strayPhase.json?.why || ""), JSON.stringify(strayPhase.json));
  const conAdd = await add(CONTRIB, "phase", wproj, "A contributor's phase");
  check("building the plan is refused to a Contributor, in words — and the api is reached without the page (§42)",
    conAdd.status === 403 && /Lead/.test(conAdd.json?.why || ""), JSON.stringify(conAdd.json));
  check("...and nothing was written: a refusal that wrote a row is not a refusal",
    !(await rowsOf()).some((x) => x.name === "A contributor's phase"));

  /* ── the add rows say which kinds, where ──────────────────────────── */
  const pen2 = await planOf(SEAT, "?edit=1");
  const addrs = (pen2.html.match(/<div class="addr l\d" data-add="[^"]*" data-kind="[^"]*"/g) || [])
    .map((m) => m.replace(/.*l(\d)" data-add="([^"]*)" data-kind="([^"]*)".*/, "$1:$2:$3"));
  check("ONE ADD ROW AT THE FOOT OF EVERY CONTAINER, and one for the tree itself",
    addrs.some((x) => x.startsWith("0:" + wproj + ":phase")) &&
    addrs.some((x) => x === "2:" + pkg.id + ":activity") &&
    addrs.some((x) => x.startsWith("1:" + phDesign.id + ":")), addrs.join(" | "));
  check("A PHASE ALREADY HOLDING A WORK PACKAGE IS OFFERED ONLY ANOTHER ONE, or an activity beside it would number 1.1 twice (§3 №5)",
    addrs.includes("1:" + phDesign.id + ":package") &&
    !/data-add="" + phDesign.id + "" data-kind="activity"/.test(pen2.html) &&
    addrs.includes("1:" + phBuild.id + ":activity"), addrs.join(" | "));

  /* ── moving: the arrows and `mayMove` are ONE answer (§61) ─────────── */
  const rowStrip = (html, id) => {
    const m = html.match(new RegExp('data-row="' + id + '"[^>]*>(?:(?!class="r )[\\s\\S])*?</div>'));
    return m ? m[0] : "";
  };
  const designStrip = rowStrip(pen2.html, phDesign.id), buildStrip = rowStrip(pen2.html, phBuild.id);
  check("AN ARROW THAT CAN DO NOTHING IS NOT DRAWN — no move-up on the first row of its container, no move-down on the last (§94.15)",
    !/data-mv="up"/.test(designStrip) && /data-mv="down"/.test(designStrip) &&
    /data-mv="up"/.test(buildStrip) && !/data-mv="down"/.test(buildStrip),
    (designStrip.match(/data-mv="\w+"/g) || []).join(",") + "  //  " + (buildStrip.match(/data-mv="\w+"/g) || []).join(","));
  /* AND THE CONTAINER IS WHAT BOUNDS IT: `Pilot` is the only activity under
     `Build`, so it has NEITHER arrow — a walk that stepped past the phase
     above it would find `Workshops`' level and offer an up (§15.2: moving
     across a container is re-parenting, which nothing here offers). */
  const loneStrip = rowStrip(pen2.html, actOff.id);
  check("A ROW ALONE IN ITS CONTAINER HAS NEITHER ARROW, however many rows at its level the plan holds elsewhere",
    !/data-mv="up"/.test(loneStrip) && !/data-mv="down"/.test(loneStrip),
    (loneStrip.match(/data-mv="\w+"/g) || []).join(","));
  check("...and its space is kept, so the × does not move between rows (§302's family)",
    (designStrip.match(/width:22px/g) || []).length === 1 && /class="rm"/.test(designStrip),
    designStrip.slice(-200));
  const up = await post(A, SEAT, { act: "move", id: wproj, kind: "phase", row: phBuild.id, dir: "up" });
  check("a move reaches the DATABASE and the container is RENUMBERED, never nudged",
    up.status === 200 && (await rowsOf()).find((x) => x.name === "Build")?.pos === 0 &&
    (await rowsOf()).find((x) => x.name === "Design")?.pos === 1, JSON.stringify(await rowsOf()));
  const nowhere = await post(A, SEAT, { act: "move", id: wproj, kind: "phase", row: phBuild.id, dir: "up" });
  check("...and a move with nowhere to go is REFUSED, which is the same answer the page drew the arrow from (§53.5)",
    nowhere.status === 400 && /nowhere/i.test(nowhere.json?.why || ""), JSON.stringify(nowhere.json));
  await post(A, SEAT, { act: "move", id: wproj, kind: "phase", row: phBuild.id, dir: "down" });

  /* ── removing is refused where it holds work (§15.6) ───────────────── */
  const canRm = await post(A, SEAT, { act: "canremove", id: wproj, kind: "phase", row: phDesign.id });
  check("A PHASE THAT HOLDS WORK IS REFUSED AND THE REFUSAL NAMES WHAT IS IN THE WAY (§62, §123)",
    canRm.status === 200 && /cannot be removed while it holds work/.test(canRm.json?.why || "") &&
    /Discovery/.test(canRm.json.why), JSON.stringify(canRm.json));
  const rmFull = await post(A, SEAT, { act: "remove", id: wproj, kind: "phase", row: phDesign.id });
  check("...refused at the press too, in the SAME words — the page's sentence and the api's are one sentence (§53.5)",
    rmFull.status === 400 && /cannot be removed while it holds work/.test(rmFull.json?.why || ""), JSON.stringify(rmFull.json));
  check("...and it is still there", (await rowsOf()).some((x) => x.id === phDesign.id));
  await add(SEAT, "phase", wproj, "Sustain");
  const phSustain = (await rowsOf()).find((x) => x.name === "Sustain") || { id: "00000000-0000-4000-8000-000000000000" };
  const canRm2 = await post(A, SEAT, { act: "canremove", id: wproj, kind: "phase", row: phSustain.id });
  check("A PHASE HOLDING NOTHING IS NOT REFUSED — both ends, or a build that refused every removal passes half (§94.2)",
    canRm2.status === 200 && !canRm2.json.why && /no archive and no undo/.test(canRm2.json.after || ""),
    JSON.stringify(canRm2.json));
  const rmOk = await post(A, SEAT, { act: "remove", id: wproj, kind: "phase", row: phSustain.id });
  check("...and the removal reaches the database",
    rmOk.status === 200 && !(await rowsOf()).some((x) => x.id === phSustain.id), String(rmOk.status));
  const conRm = await post(A, CONTRIB, { act: "remove", id: wproj, kind: "activity", row: actOff.id });
  check("removing a row is refused to a Contributor, and the row stands",
    conRm.status === 403 && (await rowsOf()).some((x) => x.id === actOff.id), JSON.stringify(conRm.json));

  /* ── a row's own facts ───────────────────────────────────────────── */
  const field = (who, kind, row, f, value) => post(A, who, { act: "field", id: wproj, kind, row, field: f, value });
  await field(SEAT, "phase", phDesign.id, "name", "Design  and\n  discovery");
  check("A NAME IS ONE LINE, closed up rather than stored with its breaks (§260)",
    (await rowsOf()).find((x) => x.id === phDesign.id)?.name === "Design and discovery",
    String((await rowsOf()).find((x) => x.id === phDesign.id)?.name));
  await field(SEAT, "activity", actIn.id, "deliverables", "A findings pack.");
  await field(SEAT, "activity", actIn.id, "assignee", "hend");
  const back1 = await one(
    "SELECT name, deliverables, assignee_key, assignee_name FROM portfolio_activities WHERE tenant_id=$1 AND id=$2",
    [A, actIn.id]);
  check("a field typed on the panel reaches the ROW, and the owner is stored as a KEY (§48, §130.9)",
    back1.deliverables === "A findings pack." && back1.assignee_key === "hend", JSON.stringify(back1));
  check("...with the stored NAME cleared beside it, or a row would draw the old person's name as its fallback (§288.1)",
    back1.assignee_name === "", JSON.stringify(back1.assignee_name));
  await field(SEAT, "activity", actIn.id, "weight", "40");
  await field(SEAT, "activity", actIn.id, "weight", "");
  check("AN EMPTIED WEIGHT IS AN ABSENCE AND NOT A NOUGHT (§50.6, §243): storing 0 would quietly re-weight every sibling",
    (await one("SELECT weight FROM portfolio_activities WHERE tenant_id=$1 AND id=$2", [A, actIn.id])).weight === null,
    String((await one("SELECT weight FROM portfolio_activities WHERE tenant_id=$1 AND id=$2", [A, actIn.id])).weight));
  const badWeight = await field(SEAT, "activity", actIn.id, "weight", "140");
  check("...and a share over 100 is refused in words", badWeight.status === 400 && /share/.test(badWeight.json?.why || ""), JSON.stringify(badWeight.json));
  const noField = await field(SEAT, "activity", actIn.id, "status", "completed");
  check("STATUS IS NOT A FIELD and the api says so: it is worked out, never picked from a list (§15.4)",
    noField.status === 400 && /No such field/i.test(noField.json?.why || ""), JSON.stringify(noField.json));
  await field(SEAT, "activity", actOff.id, "dependsOn", actIn.id);
  const loop = await field(SEAT, "activity", actIn.id, "dependsOn", actOff.id);
  check("A CHAIN THAT LOOPS IS REFUSED BEFORE IT IS STORED, rather than left for `cascade` to stop walking (§9.5)",
    loop.status === 400 && /circle/i.test(loop.json?.why || ""), JSON.stringify(loop.json));
  const self = await field(SEAT, "activity", actIn.id, "dependsOn", actIn.id);
  check("...and an activity cannot wait for itself", self.status === 400, JSON.stringify(self.json));
  await field(SEAT, "activity", actIn.id, "start", "2027-03-01");
  await field(SEAT, "activity", actIn.id, "end", "2027-03-10");
  const backWin = () => one(
    "SELECT planned_start::text s, planned_end::text e FROM portfolio_activities WHERE tenant_id=$1 AND id=$2", [A, actIn.id]);
  check("the planned window reaches the row", (await backWin()).s === "2027-03-01" && (await backWin()).e === "2027-03-10", JSON.stringify(await backWin()));
  const backwards = await field(SEAT, "activity", actIn.id, "end", "2027-02-01");
  check("...and an end before its start is refused by a SENTENCE rather than by a constraint's name (§316.2)",
    backwards.status === 400 && /cannot fall before/.test(backwards.json?.why || ""), JSON.stringify(backwards.json));
  check("...and the stored window did not move", (await backWin()).e === "2027-03-10", JSON.stringify(await backWin()));
  const conField = await field(CONTRIB, "activity", actIn.id, "name", "A contributor renamed it");
  check("A CONTRIBUTOR WRITES NO FACT ON THE ROW (§15.7: *see the plan, write your own rows*)",
    conField.status === 403 &&
    (await one("SELECT name FROM portfolio_activities WHERE tenant_id=$1 AND id=$2", [A, actIn.id])).name === "Interviews",
    JSON.stringify(conField.json));

  /* ── moving a date shows you first (§3 №4, §15.5) ──────────────────── */
  await field(SEAT, "activity", actOff.id, "start", "2027-03-15");
  await field(SEAT, "activity", actOff.id, "end", "2027-03-25");
  const prev = await post(A, SEAT, { act: "preview", id: wproj, activity: actIn.id, end: "2027-03-17" });
  check("MOVING AN END DATE PREVIEWS WHAT IT DRAGS, and the preview is the SERVER's because `cascade` is a rule (§53.5)",
    prev.status === 200 && (prev.json?.shifts || []).length === 1 &&
    prev.json.shifts[0].id === actOff.id && /depend/.test(prev.json.lede || ""), JSON.stringify(prev.json));
  const strayShift = await post(A, SEAT,
    { act: "movedate", id: wproj, activity: actIn.id, end: "2027-03-17", take: [actIn.id] });
  check("...and a row NOBODY WAS SHOWN cannot ride in on the write (§42, the screen's promise is what must be kept)",
    strayShift.status === 400 && /not on the list/i.test(strayShift.json?.why || ""), JSON.stringify(strayShift.json));
  const moved = await post(A, SEAT,
    { act: "movedate", id: wproj, activity: actIn.id, end: "2027-03-17", take: [actOff.id] });
  const shifted = await one(
    "SELECT planned_start::text s, planned_end::text e FROM portfolio_activities WHERE tenant_id=$1 AND id=$2", [A, actOff.id]);
  check("A SHIFTED ROW MOVES BOTH ITS DATES BY THE SAME DAYS, or moving only the start would COMPRESS the work",
    moved.status === 200 && shifted.s === "2027-03-22" && shifted.e === "2027-04-01", JSON.stringify(shifted));
  await field(SEAT, "activity", actOff.id, "start", "2027-03-15");
  await field(SEAT, "activity", actOff.id, "end", "2027-03-25");
  const left = await post(A, SEAT,
    { act: "movedate", id: wproj, activity: actIn.id, end: "2027-03-20", take: [] });
  check("...and UNTICKING LEAVES IT WHERE IT IS — both answers are real, which is why it is a ticking list (§15.5)",
    left.status === 200 &&
    (await one("SELECT planned_start::text s FROM portfolio_activities WHERE tenant_id=$1 AND id=$2", [A, actOff.id])).s === "2027-03-15",
    JSON.stringify(await backWin()));

  /* ── the breakdown: the plan's steps, the report's statuses ───────── */
  const sub = (who, body) => post(A, who, { id: wproj, activity: actIn.id, ...body });
  const s1 = await sub(SEAT, { act: "subadd", name: "Book the interviews" });
  const s2 = await sub(SEAT, { act: "subadd", name: "Run them" });
  const subs = async () => owner(
    "SELECT id, name, status, weight FROM portfolio_sub_activities WHERE tenant_id=$1 AND activity_id=$2 ORDER BY pos", [A, actIn.id]);
  check("a step is added by naming it", s1.status === 200 && s2.status === 200 && (await subs()).length === 2, JSON.stringify(await subs()));
  /* AND THE STEPS DEGRADE TOO (§215): with a break that stops a step being
     added, `S[0].id` throws and takes the whole breakdown section with it. */
  const S0 = await subs();
  const S = [S0[0] || NONE, S0[1] || NONE];
  const rep = await sub(CONTRIB, { act: "subfield", sub: S[0].id, field: "status", value: "done" });
  check("THE PERSON THE ROW IS ASSIGNED TO REPORTS A STEP — which is read off the ROW, never off the membership (§6.2)",
    rep.status === 200 && (await subs())[0]?.status === "done", JSON.stringify(rep.json));
  const figure = async () => Number((await one(
    "SELECT progress FROM portfolio_activities WHERE tenant_id=$1 AND id=$2", [A, actIn.id])).progress);
  check("...and the FIGURE is re-derived by `progressFromSubs` and by nothing else (§3 №3, §53.5's chokepoint)",
    await figure() === progressFromSubs((await subs()).map((x) => ({ status: x.status, weight: x.weight }))),
    String(await figure()));
  const stamped = await one(
    "SELECT actual_start::text s FROM portfolio_activities WHERE tenant_id=$1 AND id=$2", [A, actIn.id]);
  check("...and the REAL START is stamped the first time the figure leaves nought (§3 №2)", stamped.s === TODAY, JSON.stringify(stamped));
  const conName = await sub(CONTRIB, { act: "subfield", sub: S[0].id, field: "weight", value: "70" });
  check("A STEP'S NAME AND ITS WEIGHT ARE THE PLAN'S, NOT THE REPORT'S (§15.7) — the drawing's first draft let somebody re-weight their own work",
    conName.status === 403 && (await subs())[0]?.weight === null, JSON.stringify(conName.json));
  const leadWt = await sub(SEAT, { act: "subfield", sub: S[0].id, field: "weight", value: "70" });
  check("...and a Lead writes it — both ends (§94.2)",
    leadWt.status === 200 && Number((await subs())[0]?.weight) === 70, JSON.stringify(await subs()));
  const strangerRep = await sub(VIEWER, { act: "subfield", sub: S[0].id, field: "status", value: "todo" });
  check("a Viewer reports nothing at all, and the step stands",
    strangerRep.status === 403 && (await subs())[0]?.status === "done", JSON.stringify(strangerRep.json));
  const typed = await sub(CONTRIB, { act: "progress", value: "90" });
  check("`manualProgressRefused` IS REACHABLE FROM THE API AND FROM NO CONTROL ON THE SCREEN, which is §15.4's own point",
    typed.status === 400 && /comes from its breakdown/.test(typed.json?.why || ""), JSON.stringify(typed.json));
  const openAct = await planOf(SEAT, "?edit=1&act=" + actIn.id);
  check("...and the panel draws no box for it, rather than one the server refuses (§61)",
    !/id="pct"/.test(openAct.html) && /by their weights/.test(openAct.html),
    (openAct.html.match(/id="pct"/g) || []).join(","));
  const freeAct = await planOf(SEAT, "?edit=1&act=" + actOff.id);
  check("...where a row has NO breakdown the box IS drawn, because §3 №3's words are *refused when it would lie* — both ends",
    /id="pct"/.test(freeAct.html), "");
  const typedOk = await post(A, SEAT, { act: "progress", id: wproj, activity: actOff.id, value: "35" });
  check("...and that figure reaches the row",
    typedOk.status === 200 &&
    Number((await one("SELECT progress FROM portfolio_activities WHERE tenant_id=$1 AND id=$2", [A, actOff.id])).progress) === 35,
    JSON.stringify(typedOk.json));
  const rmSub = await sub(SEAT, { act: "subremove", sub: S[1].id });
  check("a step is removed and the figure follows it",
    rmSub.status === 200 && (await subs()).length === 1 &&
    await figure() === progressFromSubs((await subs()).map((x) => ({ status: x.status, weight: x.weight }))),
    String(await figure()));

  /* ── marking it done — the FIRST of the two steps (§3 №1, §6.5) ───── */
  const doneBu = await planOf(CONTRIB, "?act=" + actIn.id);
  check("THE PERSON DOING THE WORK GETS THE BREAKDOWN AND *MARK IT DONE* AND NOTHING ELSE (§7.4A)",
    /id="mark"/.test(doneBu.html) && /data-sub=/.test(doneBu.html) &&
    !/data-field="name"/.test(doneBu.html) && !/data-field="assignee"/.test(doneBu.html),
    (doneBu.html.match(/data-field="[^"]*"/g) || []).join(" | "));
  const viewPanel = await planOf(VIEWER, "?act=" + actIn.id);
  check("...and a Viewer's panel carries no control at all — everybody lands at Viewer, which is the only default that fails closed (§7.4B)",
    !/id="mark"/.test(viewPanel.html) && !/data-sub=/.test(viewPanel.html) &&
    !/data-field=/.test(viewPanel.html) && /class="act"/.test(viewPanel.html),
    (viewPanel.html.match(/data-(sub|field)=|id="mark"/g) || []).join(" | "));
  const md = await post(A, CONTRIB, { act: "markdone", id: wproj, activity: actIn.id, done: "1" });
  const stat = (id) => one(
    "SELECT status, progress, actual_end::text e, signed_off_by b FROM portfolio_activities WHERE tenant_id=$1 AND id=$2", [A, id]);
  check("whoever is doing the work marks it done", md.status === 200 && (await stat(actIn.id)).status === "done", JSON.stringify(await stat(actIn.id)));
  check("...AND IT DOES NOT SIGN ITSELF OFF: the real end date is written at the SECOND step and by a Lead (§3 №1, §9.10)",
    (await stat(actIn.id)).e === null && (await stat(actIn.id)).b === "", JSON.stringify(await stat(actIn.id)));
  const undo = await post(A, CONTRIB, { act: "markdone", id: wproj, activity: actIn.id, done: "0" });
  check("AND IT TURNS BOTH WAYS, which the drawing does not show and §61 requires — a one-way door is a trap",
    undo.status === 200 && (await stat(actIn.id)).status !== "done", JSON.stringify(await stat(actIn.id)));
  check("...and un-marking leaves the FIGURE where it is: *this is not finished* is not *this work was not done*",
    (await stat(actIn.id)).progress === (await figure()), String(await figure()));
  await post(A, CONTRIB, { act: "markdone", id: wproj, activity: actIn.id, done: "1" });
  const strangerDone = await post(A, VIEWER, { act: "markdone", id: wproj, activity: actOff.id, done: "1" });
  check("somebody the row does not name marks nothing done",
    strangerDone.status === 403 && (await stat(actOff.id)).status !== "done", JSON.stringify(strangerDone.json));
  await post(A, SEAT, { act: "signoff", id: wproj, activity: actIn.id, end: TODAY });
  const afterOff = await post(A, CONTRIB, { act: "markdone", id: wproj, activity: actIn.id, done: "0" });
  check("...and once a Lead has ACCEPTED it, un-marking is refused and named: reopening is the Lead's (§6.5)",
    afterOff.status === 400 && /Lead/.test(afterOff.json?.why || ""), JSON.stringify(afterOff.json));

  /* ── and a phase is renamed where it has no panel (§356.11) ────────── */
  check("A PHASE AND A WORK PACKAGE CARRY NO PANEL, so the row itself is where its name is corrected — the tracker's own idiom, or a name set once could never be fixed (§61)",
    new RegExp('data-row="' + phDesign.id + '" data-kind="phase"').test(pen2.html) &&
    new RegExp('data-row="' + pkg.id + '" data-kind="package"').test(pen2.html),
    (pen2.html.match(/data-kind="(phase|package)"/g) || []).join(" | "));

  /* ══ §12 · THE PRESS ITSELF, IN A BROWSER (§443.8) ══════════════════ */
  /* EVERY ASSERTION ABOVE BUILDS ITS OWN REQUEST BODY, so not one of them
     ever drove the request the BROWSER makes — and the browser's was missing
     the project on all fifteen acts, so every press in edit mode came back
     *Which project?* while the api, the rules and 184 assertions were right
     (§96 at its clearest). The module is served over a real port — the same
     `serve()` the route calls, bridged from Node's request to a fetch
     Request — and Chromium presses the controls while the DATABASE is read
     back (§70: a control is pressed, never looked for). */
  section("§12 · pressed in a browser, with the rows read back from Postgres (§443.8)");
  const BP = await post(A, SEAT, { act: "start", name: "Press test" });
  const bproj = BP.json.id;
  const { createServer } = await import("node:http");
  const srv = createServer(async (rq, rs) => {
    try {
      const chunks = []; for await (const ch of rq) chunks.push(ch);
      const url = "http://smp.test" + rq.url;
      const rest = String(rq.url).split("?")[0].split("/").filter(Boolean).slice(2);
      const req = new Request(url, {
        method: rq.method,
        headers: { "Content-Type": rq.headers["content-type"] || "" },
        body: rq.method === "POST" ? Buffer.concat(chunks) : undefined });
      const res = await serve({ req, slug: "raya-trade", module: "portfolio", tenantId: A,
        tenantName: "Raya Trade", have: offerable(), rest,
        personKey: SEAT.personKey ?? null, seat: SEAT.seat ?? null });
      rs.writeHead(res.status, Object.fromEntries(res.headers));
      rs.end(Buffer.from(await res.arrayBuffer()));
    } catch (e) { rs.writeHead(500); rs.end(String(e)); }
  });
  await new Promise((r) => srv.listen(0, "127.0.0.1", r));
  const base = "http://127.0.0.1:" + srv.address().port + "/raya-trade/portfolio/" + bproj + "/plan";
  let browser = null;
  try {
    const { chromium } = await import("playwright-core");
    browser = await chromium.launch({ executablePath: process.env.SMP_CHROME || undefined, args: ["--no-sandbox"] });
  } catch (e) { check("a browser to press the controls in (set SMP_CHROME)", false, e.message.split("\n")[0]); }
  if (browser) {
    const pg = await browser.newPage({ viewport: { width: 1280, height: 900 } });
    const errs = [];
    pg.on("pageerror", (e) => errs.push(String(e)));
    pg.on("console", (m) => { if (m.type() === "error") errs.push(m.text()); });
    const settle = () => pg.waitForTimeout(400);
    const bRows = () => owner(
      `SELECT 'phase' k, id, name, pos FROM portfolio_phases WHERE tenant_id=$1 AND project_id=$2
       UNION ALL SELECT 'activity', a.id, a.name, a.pos FROM portfolio_activities a
         JOIN portfolio_phases p ON p.id=a.phase_id
        WHERE a.tenant_id=$1 AND p.project_id=$2 ORDER BY 1, 4`, [A, bproj]);

    await pg.goto(base + "?edit=1"); await settle();
    /* THE MARK IS PLANTED BEFORE THE FIRST PRESS, or *it stayed* proves
       nothing: every write answers with the body swapped in (§356.12), and a
       page that reloaded satisfies every other assertion here (§113.8). */
    await pg.evaluate("window.__stay = 1");
    check("the mark is really planted, or 'it stayed' proves nothing",
      await pg.evaluate("window.__stay === 1"));

    /* ── naming the first phase, which is the press Islam made ───────── */
    const addBox = await pg.$('.addr[data-kind="phase"] input');
    check("the add row is there to type in", !!addBox);
    if (addBox) {
      await addBox.fill("Phase 1");
      await addBox.press("Enter");
      await settle();
    }
    const R1 = await bRows();
    check("A PHASE NAMED AND ENTER PRESSED REACHES POSTGRES — the whole feature was dead here, because the script's request named no project and the api answered *Which project?* on all fifteen acts (§96, §104.7)",
      R1.length === 1 && R1[0].name === "Phase 1" && R1[0].k === "phase",
      JSON.stringify(R1) + "  //  said: " + String(await pg.textContent(".said").catch(() => "")).trim());
    check("...and nothing was said on the page, because nothing was refused (§32, §171)",
      !(await pg.textContent(".said").catch(() => "")).trim(),
      (await pg.textContent(".said").catch(() => "")).trim());
    check("...and the page did not reload: the answer is the body drawn again and swapped in (§356.12)",
      await pg.evaluate("window.__stay === 1"));

    /* ── and a second one, so the order can be read ──────────────────── */
    const addBox2 = await pg.$('.addr[data-kind="phase"] input');
    if (addBox2) { await addBox2.fill("Phase 2"); await addBox2.press("Enter"); await settle(); }
    const R2 = await bRows();
    check("a second phase is APPENDED, and both are on the page after the swap",
      R2.length === 2 && R2[0].name === "Phase 1" && R2[1].name === "Phase 2",
      JSON.stringify(R2));

    /* ── an activity under the phase, which is the other parent kind ───
       A PHASE OFFERS BOTH AND THE KEY IS PRESSED (§15.3): the row's own
       `data-kind` starts at the first of the two, so this is the one place a
       press DECIDES what the next Enter makes. */
    const phRow = await pg.$('.addr.l1');
    const akAct = await pg.$('.addr.l1 .ak[data-kind="activity"]');
    check("the phase now offers an activity under it as well as a work package",
      !!akAct && !!(await pg.$('.addr.l1 .ak[data-kind="package"]')),
      String(await pg.$$eval('.addr.l1 .ak', (xs) => xs.map((x) => x.getAttribute("data-kind")).join(",")).catch(() => "")));
    if (akAct) {
      await akAct.click();
      check("...and pressing it is what the next Enter reads, so one row cannot mean two things (§32)",
        (await phRow.getAttribute("data-kind")) === "activity", String(await phRow.getAttribute("data-kind")));
    }
    const actAdd = await pg.$('.addr.l1 input');
    if (actAdd) { await actAdd.fill("Interviews"); await actAdd.press("Enter"); await settle(); }
    const R3 = await bRows();
    check("...and it lands under the PHASE it was typed under, through the browser's own request",
      R3.some((x) => x.k === "activity" && x.name === "Interviews"), JSON.stringify(R3));

    /* ── moving one, which is a different act through the same post ──── */
    const dn = await pg.$('[data-mv="down"]');
    if (dn) { await dn.click(); await settle(); }
    const R4 = await bRows();
    check("AN ARROW PRESSED REORDERS THE STORED PLAN, so the one line that names the project serves every act and not only the add (§104.7)",
      R4.filter((x) => x.k === "phase")[0]?.name === "Phase 2", JSON.stringify(R4.filter((x) => x.k === "phase")));

    /* ── and a refusal is written into the page in the server's words ── */
    const rm = await pg.$$('[data-rm]');
    check("there is a remove to press", rm.length > 0);
    if (rm.length) {
      /* The phase holding the activity: its removal must be refused BY NAME,
         and the sentence must reach the page rather than the console. */
      const holder = R4.filter((x) => x.k === "phase").find((x) => x.name === "Phase 1");
      const btn = await pg.$('[data-row="' + holder.id + '"] [data-rm]');
      if (btn) { await btn.click(); await settle(); }
      /* SCOPED TO THE REMOVE DIALOG: there are two shells in the document and
         the first `.dlg` is the shift's, so an unscoped read returns *Leave
         everything* and reports a correct build broken (§100.3, §50.6). */
      const dlgText = (await pg.textContent("#ov-rm").catch(() => "")) || "";
      check("A REMOVAL THAT IS REFUSED SAYS SO IN THE SERVER'S OWN WORDS, on the page (§32, §123)",
        /holds work/.test(dlgText) && /Interviews/.test(dlgText), dlgText.replace(/\s+/g, " ").slice(0, 140));
      await pg.keyboard.press("Escape"); await settle();
    }
    check("and no page error anywhere in it (§96: a script that threw renders the page it was given)",
      errs.length === 0, errs.slice(0, 2).join(" | "));
    await browser.close();
  }
  await new Promise((r) => srv.close(r));

} catch (e) {
  failed = true;
  console.log("\n  FAIL the check threw — " + (e && e.message ? e.message : String(e)));
} finally {
  if (A_ || B_) await owner("DELETE FROM tenants WHERE id = ANY($1)", [[A_, B_].filter(Boolean)]).catch(() => {});
  await pool.end().catch(() => {});
  await appPool.end().catch(() => {});
}

console.log("\n" + ok + " passed, " + (bad.length + (failed ? 1 : 0)) + " failed");
if (bad.length) console.log("FAILED: " + bad.join("; "));
process.exit(bad.length || failed ? 1 : 0);
