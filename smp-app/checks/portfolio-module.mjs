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
import { rollUp } from "../lib/portfolio.ts";
import { planRows, oneActivity } from "../lib/portfolio-io.ts";
import { todayIn } from "../lib/day.ts";

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
try {
  await owner("SET search_path TO " + SCHEMA);
  const TODAY = todayIn();
  const stamp = "pf" + Date.now().toString(36);
  const [{ id: A }] = await owner("INSERT INTO tenants (key, name) VALUES ($1,$2) RETURNING id", [stamp + "-a", "Raya Trade"]);
  const [{ id: B }] = await owner("INSERT INTO tenants (key, name) VALUES ($1,$2) RETURNING id", [stamp + "-b", "RHI"]);
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
  await act({ wp: W31, name: "Leadership communication guide", pos: 0, s: D(-5), e: D(15),
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
  check("a one-day commitment reads as one date, never '27 \u2013 27 Feb'",
    /class="win">27 Feb 2027</.test(marks), (marks.match(/class="win">[^<]*/g) || []).join(" | "));
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
  check("...its breakdown WITH the weights, beside the figure they add up to (§3 №2, §9.8)",
    /Draft the pillars/.test(panelHtml) && /40%/.test(panelHtml) && /20%/.test(panelHtml) &&
    /100% is these 3 by their weights/.test(panelHtml),
    (panelHtml.match(/class="w">[^<]*/g) || []).join(" | "));
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
  check("...that it is billable, which is a flag and nothing else (§9.9 decision 2)",
    /Billable/.test(panelHtml) && /class="mk">Yes</.test(panelHtml) &&
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
  check("...with the two that are not built carrying the word and NO link, rather than opening nothing (§61)",
    /class="soon"[^>]*>Progress</.test(plan.html) && /class="soon"[^>]*>Analytics</.test(plan.html) &&
    !/href="[^"]*\/progress"/.test(plan.html) && !/href="[^"]*\/analytics"/.test(plan.html));
  check("...and the two that ARE built are links — both ends, or a row of dead words passes half (§113.8)",
    /href="[^"]*\/plan"/.test(mineOpen.html) && /class="on"[^>]*>Plan</.test(plan.html));
  const strayTab = await get(A, [proj.id, "progress"], SEAT);
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

  /* ══ §7 · a read that failed is not an empty list ══════════════════ */
  section("§7 · unread is not empty (§35, §93, §231.4)");
  const unread = await get("not-a-tenant-id", [], SEAT);
  check("a list that could not be read says so, and does NOT say there are no projects",
    unread.status === 200 && /could not be read/.test(unread.html) && !/No projects yet/.test(unread.html));
  check("...and its counts read a dash rather than a nought",
    /class="v">\u2014</.test(unread.html), (unread.html.match(/class="v">[^<]*/g) || []).join(" | "));
} catch (e) {
  failed = true;
  console.log("\n  FAIL the check threw — " + (e && e.message ? e.message : String(e)));
} finally {
  await pool.end().catch(() => {});
  await appPool.end().catch(() => {});
}

console.log("\n" + ok + " passed, " + (bad.length + (failed ? 1 : 0)) + " failed");
if (bad.length) console.log("FAILED: " + bad.join("; "));
process.exit(bad.length || failed ? 1 : 0);
