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
     SMP_BREAK=no-plan-yet     node checks/portfolio-module.mjs  # must go red  */
import pg from "pg";
import { usePools } from "../lib/db.ts";
import { SCHEMA } from "../db/schema-name.mjs";
import { serve } from "../modules/portfolio/index.ts";
import { offerable } from "../lib/modules.ts";

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
