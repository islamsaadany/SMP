/* The Track Record's endpoint, driven over HTTP against the built app (spec
   069, which reworks spec 067's case studies). Every rule BOTH WAYS (§94.2):
   who may add an assignment to the registry, who may write one up, who may
   read a draft, what a save may and may not carry, whose My tasks and Home a
   write-up lands on, and the boundary every Forefront-only surface keeps — a
   client's own staff.

     DATABASE_URL_UNPOOLED=postgres://…/smp_dev node --experimental-strip-types checks/case-api.mjs
     … --break=anyone-opens   (RED: a consultant adds an assignment)
     … --break=drafts-open    (RED: a draft is read by everybody)
     … --break=anyone-writes  (RED: anybody rewrites somebody's write-up)
     … --break=take-file      (RED: a save names a file the server never stored)
     … --break=client-reads   (RED: a client's own staff read the Track Record)
     … --break=cross-client   (RED: a learning tied to another client's assignment)
     … --break=done-empty     (RED: published with nothing to read first)
     … --break=home-all       (RED: everybody's write-ups on my Home)

   Needs `next build` first. Re-runnable: the dev tenant is remade at the start. */
import { spawn } from "node:child_process";
import { join } from "node:path";
import pg from "pg";
import { SCHEMA } from "../db/schema-name.mjs";
import { devTenant, DEV_PASSWORD } from "../scripts/dev-tenant.mjs";
import { hashPassword } from "../lib/auth.ts";

const URL_ = process.env.DATABASE_URL_UNPOOLED || "postgres://postgres:postgres@localhost:5432/smp_dev";
const PORT = 3984, BASE = "http://localhost:" + PORT;
const brk = (process.argv.find((a) => a.startsWith("--break=")) || "").slice(8);
let oks = 0, fails = 0;
const ok = (l) => { oks++; console.log("ok    " + l); };
const fail = (l, m) => { fails++; console.log("FAIL  " + l + (m === undefined ? "" : " — " + String(m).slice(0, 220))); };
const check = (c, l, m) => (c ? ok(l) : fail(l, m));
async function section(name, fn) {
  console.log("── " + name);
  try { await fn(); } catch (e) { fail(name + " — the section died rather than reporting (§215)", e && e.stack ? e.stack.split("\n").slice(0, 2).join(" ") : e); }
}

await devTenant({ url: URL_, log: () => {} });
const owner = new pg.Pool({ connectionString: URL_, max: 3, options: "-c search_path=" + SCHEMA });
await owner.query("DELETE FROM login_attempts");
/* A second client, so "the same client" means something (§113.8). */
await owner.query("DELETE FROM case_studies WHERE about_tenant_id IN (SELECT id FROM tenants WHERE key IN ('case-other','nile-logistics'))");
await owner.query("DELETE FROM memory_entries WHERE about_tenant_id IN (SELECT id FROM tenants WHERE key IN ('case-other','nile-logistics'))");
await owner.query("DELETE FROM tenants WHERE key IN ('case-other','nile-logistics')");
await owner.query("INSERT INTO tenants (key, name, industry) VALUES ('case-other','Other Client','Healthcare')");
const mint = async (email, name, isAdmin) => (await owner.query(
  "INSERT INTO users (email, name, kind, is_admin, must_change, password_hash) VALUES ($1,$2,'office',$3,false,$4) RETURNING id",
  [email, name, isAdmin, hashPassword(DEV_PASSWORD)])).rows[0].id;
const bossId = await mint("boss@forefront.example", "Platform Admin", true);
const writerId = await mint("writer@forefront.example", "Islam Writer", false);
const readerId = await mint("reader@forefront.example", "New Joiner", false);

async function portFree(port) {
  try { await fetch("http://localhost:" + port + "/", { signal: AbortSignal.timeout(800) }); return false; }
  catch { return true; }
}
async function stopServer(s) {
  try { process.kill(-s.pid); } catch {}
  try { s.kill("SIGKILL"); } catch {}
  for (let i = 0; i < 20; i++) { if (await portFree(PORT)) return; await new Promise((r) => setTimeout(r, 250)); }
  console.log("note  port " + PORT + " is still held after the run");
}
if (!(await portFree(PORT))) {
  console.log("FAIL  something is already listening on " + PORT + " — this check will not measure a server it did not start");
  process.exit(1);
}
const server = spawn("npx", ["next", "start", "-p", String(PORT)], {
  cwd: join(import.meta.dirname, ".."),
  env: { ...process.env, DATABASE_URL_UNPOOLED: URL_, SMP_BREAK: brk },
  stdio: ["ignore", "pipe", "pipe"], detached: true,
});
server.stdout.on("data", () => {}); server.stderr.on("data", () => {});
let up = false;
for (let i = 0; i < 60 && !up; i++) { await new Promise((r) => setTimeout(r, 500)); try { up = (await fetch(BASE + "/")).status === 200; } catch {} }
if (!up) { console.log("FAIL  the app did not start"); await stopServer(server); process.exit(1); }

async function signIn(email) {
  const r = await fetch(BASE + "/api/auth/sign-in", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ email, password: DEV_PASSWORD }) });
  return (r.headers.get("set-cookie") || "").split(";")[0];
}
const call = async (path, cookie, body) => {
  const r = await fetch(BASE + path, { method: "POST", headers: { ...(cookie ? { cookie } : {}), "content-type": "application/json" }, body: JSON.stringify(body) });
  let j = null; try { j = await r.json(); } catch {}
  return { status: r.status, j };
};
const cs = (cookie, body) => call("/api/cases", cookie, body);
const mem = (cookie, body) => call("/api/memory", cookie, body);

const boss = await signIn("boss@forefront.example");
const writer = await signIn("writer@forefront.example");
const reader = await signIn("reader@forefront.example");
const client = await signIn("mobhead@raya.example");

let caseId = null, pastId = null;
const month = (d) => d.toISOString().slice(0, 7);
const LAST_MONTH = month(new Date(Date.now() - 40 * 864e5)), NEXT_YEAR = month(new Date(Date.now() + 365 * 864e5));

await section("0 · the door, and the boundary", async () => {
  let r = await cs("", { action: "library" });
  check(r.status === 401 && r.j && r.j.auth === true, "no session: 401, and the page is told it is the session", r.status);
  r = await cs(client, { action: "library" });
  check(r.status === 403, "a CLIENT's own account is refused — the Track Record is Forefront's", r.status + " " + JSON.stringify(r.j));
  const m = await mem(client, { action: "list" });
  check(r.j && m.j && r.j.error === m.j.error, "…in the memory's own words, so the two surfaces cannot be told apart (§53.5)", JSON.stringify([r.j, m.j]));
  r = await cs(reader, { action: "library" });
  check(r.status === 200 && Array.isArray(r.j.cases), "CONTROL — a consultant with no admin flag reads the Track Record", r.status);
  check(r.j.canOpen === false, "…and is told they may not change the registry", JSON.stringify(r.j.canOpen));
  r = await cs(boss, { action: "library" });
  check(r.j.canOpen === true, "…while the super user is told they may", JSON.stringify(r.j.canOpen));
});

await section("1 · the registry is the super user's (Islam: \"registry is from the super user\")", async () => {
  let r = await cs(reader, { action: "assign", client: "raya-trade", name: "Not mine to add", kind: "planning", started: "2025-01", lead: writerId });
  check(r.status === 403, "a consultant cannot add an assignment, refused by the server and not only by a hidden button", r.status + " " + JSON.stringify(r.j));
  r = await cs(boss, { action: "assign", client: "raya-trade", name: "  ", kind: "planning", started: "2025-01", lead: writerId });
  check(r.status === 400 && /name/i.test(r.j.error || ""), "a blank name is refused in words", JSON.stringify(r.j));
  r = await cs(boss, { action: "assign", client: "raya-trade", name: "X", kind: "advisory", started: "2025-01", lead: writerId });
  check(r.status === 400 && /Planning or Retainer/.test(r.j.error || ""), "…and so is a type other than Planning or Retainer", JSON.stringify(r.j));
  r = await cs(boss, { action: "assign", client: "raya-trade", name: "X", kind: "planning", started: "2025-01" });
  check(r.status === 400 && /lead/i.test(r.j.error || ""), "…and an assignment with no lead", JSON.stringify(r.j));
  r = await cs(boss, { action: "assign", client: "raya-trade", name: "X", kind: "planning", started: "2025-06", ended: "2025-01", lead: writerId });
  check(r.status === 400 && /before/i.test(r.j.error || ""), "…and one that ends before it starts", JSON.stringify(r.j));
  r = await cs(boss, { action: "assign", client: "nobody-at-all", name: "Ghost", kind: "planning", started: "2025-01", lead: writerId });
  check(r.status === 400 && /client/i.test(r.j.error || ""), "…and a client that does not exist", JSON.stringify(r.j));
  /* THE PLANNED MAN-DAYS (§696): a whole number of days or nothing — a
     fraction, a negative and a word are refused in words */
  for (const bad of [-3, 12.5, "forty"]) {
    r = await cs(boss, { action: "assign", client: "raya-trade", name: "X", kind: "planning", started: "2025-01", lead: writerId, plannedDays: bad });
    check(r.status === 400 && /whole number of days/.test(r.j.error || ""), "planned man-days of " + JSON.stringify(bad) + " is refused in words", JSON.stringify(r.j));
  }
  r = await cs(boss, { action: "assign", client: "raya-trade", name: "Strategy build 2025", kind: "planning", started: "2025-01", ended: LAST_MONTH,
    lead: writerId, team: [readerId, "00000000-0000-0000-0000-000000000000"], plannedDays: "40" });
  check(r.status === 200 && r.j.id, "the super user adds one: name, type, months, planned man-days, lead and team", JSON.stringify(r.j));
  caseId = r.j.id;
  const row = (await owner.query("SELECT state, writer_id, lead_id, kind, our_team, planned_days FROM case_studies WHERE id = $1", [caseId])).rows[0];
  check(row && row.state === "running" && !row.writer_id && row.lead_id === writerId && row.kind === "planning", "…stored with its type and lead, nothing written yet", JSON.stringify(row));
  check(row && row.planned_days === 40, "…and the 40 planned man-days, as a number (§696)", JSON.stringify(row && row.planned_days));
  check(row && row.our_team.map((p) => p.id).join() === [writerId, readerId].join(), "…the lead on the team first, a made-up consultant dropped", JSON.stringify(row && row.our_team));
  r = await cs(reader, { action: "registry" });
  const mine = (r.j.assignments || []).find((a) => a.id === caseId);
  check(r.status === 200 && mine && mine.lead.name === "Islam Writer" && mine.team.length === 2 && mine.plannedDays === 40 && r.j.canOpen === false,
    "every consultant reads the registry for the Clients page, the lead, team and planned man-days named", JSON.stringify(mine).slice(0, 200));
  r = await cs(boss, { action: "assign", id: caseId, client: "raya-trade", name: "Strategy build 2025", kind: "planning", started: "2025-01", ended: LAST_MONTH, lead: writerId, team: [], plannedDays: "" });
  const t2 = (await owner.query("SELECT our_team, planned_days FROM case_studies WHERE id = $1", [caseId])).rows[0];
  check(r.status === 200 && t2.our_team.length === 1 && t2.planned_days === null, "the super user changes one in place — an emptied man-days box stores nothing, not 0", JSON.stringify(t2));
});

await section("2 · a past client, then its assignment", async () => {
  let r = await cs(writer, { action: "past", name: "Nile Logistics" });
  check(r.status === 403, "a consultant cannot add a past client", r.status);
  r = await cs(boss, { action: "past", name: "Nile Logistics", industry: "Transportation", size: "Mid-size" });
  check(r.status === 200 && r.j.key === "nile-logistics", "the super user adds a past client by name, industry and size", JSON.stringify(r.j));
  const t = (await owner.query("SELECT status, past, archived_at IS NOT NULL AS dated, modules FROM tenants WHERE key = 'nile-logistics'")).rows[0];
  check(t && t.status === "retired" && t.past === true && t.dated, "the past client is made RETIRED and marked past — its door closed from the start", JSON.stringify(t));
  check(t && Array.isArray(t.modules) && t.modules.length === 0, "…with no modules: there is nothing behind the door", JSON.stringify(t && t.modules));
  r = await cs(boss, { action: "past", name: "Nile Logistics" });
  check(r.status === 400 && /already/i.test(r.j.error || ""), "the same past client twice is refused by name, not made twice (§53.5)", JSON.stringify(r.j));
  r = await cs(boss, { action: "assign", client: "nile-logistics", name: "Operating model 2023", kind: "planning", started: "2023-03", ended: "2023-11", lead: writerId });
  check(r.status === 200, "…and its assignment is added like any other", JSON.stringify(r.j));
  pastId = r.j.id;
  const opts = await cs(writer, { action: "options" });
  const nile = (opts.j.clients || []).find((c) => c.key === "nile-logistics");
  check(nile && nile.past && nile.archived, "the pickers offer past and ended clients too", JSON.stringify(nile));
  check(!(opts.j.clients || []).some((c) => c.key === "demo"), "…and never the worked example", JSON.stringify((opts.j.clients || []).map((c) => c.key)));
});

await section("3 · writing one up: any consultant may start it, then it is theirs", async () => {
  const deliverables = [
    { name: "Depot diagnostic", what: "Visits and figures from all three depots", month: "Apr 2023" },
    { name: "Operating model design", what: "Central planning", month: "Jul 2023", file: { path: "cases/someone-else/secret.pdf", name: "secret.pdf", bytes: 9 } },
  ];
  let r = await cs(writer, { action: "save", id: pastId, name: "Renamed by a writer", started: "1999-01",
    inShort: "Nile Logistics asked us to redesign its depots.", clientWhy: "Two years of missed targets.",
    askedToDo: "Redesign how the depots are run.", cameOfIt: "",
    ourTeam: [{ id: writerId, role: "Lead" }, { id: "00000000-0000-0000-0000-000000000000", role: "Ghost" }],
    theirTeam: [{ name: "Hany M.", role: "COO" }, { name: "", role: "nobody" }],
    stages: [{ when: "Mar", what: "Diagnostic" }, { when: "Apr", what: "" }],
    deliverables, whoToAsk: [{ name: "Islam Writer", about: "the depot managers" }] });
  check(r.status === 200 && r.j.case, "a consultant starts the write-up (Islam: \"consultants can start\")", JSON.stringify(r.j).slice(0, 200));
  const c = r.j.case || {};
  check(c.state === "writing" && c.writer && c.writer.id === writerId, "…the first save makes them its writer", JSON.stringify([c.state, c.writer]));
  check(c.name === "Operating model 2023" && c.started === "2023-03", "…and the name and months stay the registry's, whatever the save carried", JSON.stringify([c.name, c.started]));
  check(c.ourTeam && c.ourTeam.length === 1 && c.ourTeam[0].role === "Lead", "the team is the registry's; only its roles are written here", JSON.stringify(c.ourTeam));
  check(c.theirTeam && c.theirTeam.length === 1 && c.stages && c.stages.length === 1, "an empty person or stage is dropped rather than drawn as a blank line", JSON.stringify([c.theirTeam, c.stages]));
  const stored = (await owner.query("SELECT deliverables FROM case_studies WHERE id = $1", [pastId])).rows[0].deliverables;
  check(stored.length === 2 && stored.every((d) => d.file === null), "A FILE IS NEVER TAKEN FROM THE BODY: a save naming somebody else's path stores no file (the path is the permission)", JSON.stringify(stored));
  check(stored.every((d) => /^[0-9a-f-]{36}$/.test(d.id)), "…and every deliverable gets an id from the server", JSON.stringify(stored.map((d) => d.id)));
  const again = await cs(writer, { action: "save", id: pastId, inShort: c.inShort,
    deliverables: [{ id: stored[0].id, name: "Depot diagnostic", what: "renamed what", month: "Apr 2023" }] });
  const stored2 = (await owner.query("SELECT deliverables FROM case_studies WHERE id = $1", [pastId])).rows[0].deliverables;
  check(again.status === 200 && stored2.length === 1 && stored2[0].id === stored[0].id, "a deliverable keeps its id across saves, so its file stays with it", JSON.stringify(stored2));
  r = await cs(reader, { action: "save", id: pastId, inShort: "Not my story" });
  check(r.status === 403, "once started, somebody else cannot rewrite it", r.status + " " + JSON.stringify(r.j));
  r = await cs(boss, { action: "save", id: pastId, inShort: c.inShort, deliverables: stored2 });
  check(r.status === 200, "CONTROL — a super user may correct it", r.status);
});

await section("4 · a draft is its writer's, its lead's and the super users'", async () => {
  let r = await cs(reader, { action: "case", id: pastId });
  check(r.status === 200 && r.j.case.hidden === true, "a consultant opening someone else's draft is told it is hidden…", JSON.stringify(r.j && r.j.case && r.j.case.hidden));
  check(r.j.case.inShort === "" && r.j.case.deliverables.length === 0, "…and gets NONE of its story, only its head and the registry's team", JSON.stringify([r.j.case.inShort, r.j.case.deliverables.length]));
  r = await cs(reader, { action: "library", q: "redesign its depots" });
  check(r.status === 200 && !r.j.cases.some((x) => x.id === pastId), "a draft's words cannot be found by searching for them", JSON.stringify(r.j.cases.map((x) => x.name)));
  r = await cs(writer, { action: "library", q: "redesign its depots" });
  check(r.j.cases.some((x) => x.id === pastId), "CONTROL — its writer finds it by those words", JSON.stringify(r.j.cases.map((x) => x.name)));
  r = await cs(reader, { action: "case", id: caseId });
  check(r.j.case.hidden === false, "an assignment nobody has started hides nothing: there is no draft", JSON.stringify(r.j.case.hidden));
});

await section("5 · publishing puts it in front of everyone", async () => {
  await owner.query("UPDATE case_studies SET in_short = '' WHERE id = $1", [pastId]);
  let r = await cs(writer, { action: "done", id: pastId });
  check(r.status === 400 && /in short/i.test(r.j.error || ""), "it cannot be published with nothing to read first", JSON.stringify(r.j));
  await owner.query("UPDATE case_studies SET in_short = 'Nile Logistics asked us to redesign its depots.' WHERE id = $1", [pastId]);
  r = await cs(reader, { action: "done", id: pastId });
  check(r.status === 403, "somebody who is not its writer or lead cannot publish it", r.status);
  r = await cs(writer, { action: "done", id: pastId });
  check(r.status === 200, "its writer publishes it", JSON.stringify(r.j));
  r = await cs(reader, { action: "case", id: pastId });
  check(r.j.case.state === "done" && r.j.case.hidden === false && r.j.case.inShort, "…and now every consultant reads the whole of it", JSON.stringify([r.j.case.state, r.j.case.hidden]));
  r = await cs(reader, { action: "library", q: "redesign its depots" });
  check(r.j.cases.some((x) => x.id === pastId), "…and finds it by its words", JSON.stringify(r.j.cases.map((x) => x.name)));
});

await section("6 · the write-up lands on the lead when the end month comes", async () => {
  const running = (await cs(boss, { action: "assign", client: "raya-trade", name: "Strategy follow-up", kind: "retainer", started: "2025-07", lead: writerId })).j.id;
  const later = (await cs(boss, { action: "assign", client: "raya-trade", name: "Ends next year", kind: "retainer", started: "2025-07", ended: NEXT_YEAR, lead: writerId })).j.id;
  let r = await cs(writer, { action: "home" });
  const ids = (r.j.writing || []).map((x) => x.id);
  check(ids.includes(caseId), "an ended assignment nobody has started is on its lead's Home", JSON.stringify((r.j.writing || []).map((x) => x.name)));
  check(!ids.includes(running) && !ids.includes(later), "…one still running, or ending later, is not", JSON.stringify((r.j.writing || []).map((x) => x.name)));
  check(!ids.includes(pastId), "…nor one already published", JSON.stringify(ids));
  check((r.j.fresh || []).some((x) => x.id === pastId) && !(r.j.fresh || []).some((x) => x.state !== "done"), "…and the published one is among the newly published, with no draft among them", JSON.stringify((r.j.fresh || []).map((x) => x.name)));
  r = await cs(reader, { action: "home" });
  check(r.status === 200 && !(r.j.writing || []).some((x) => x.id === caseId), "somebody who leads none of it has none on their Home", JSON.stringify(r.j.writing));
  const w = await call("/api/platform", writer, { action: "mywork" });
  const rows = (w.j && w.j.cases) || [];
  const row = rows.find((x) => x.id === caseId);
  check(row && row.type === "planning" && row.late === true, "…and it is on the lead's My tasks, late since its end month has passed", JSON.stringify(row || w.j).slice(0, 240));
  await owner.query("DELETE FROM case_studies WHERE id IN ($1, $2)", [running, later]);
});

await section("7 · learnings inside an assignment", async () => {
  let r = await mem(reader, { action: "save", caseId, title: "Interview the CFO first", kind: "practice", client: "case-other" });
  check(r.status === 200, "a learning added to an assignment saves", JSON.stringify(r.j));
  const e = (await owner.query("SELECT e.case_id, t.key FROM memory_entries e JOIN tenants t ON t.id = e.about_tenant_id WHERE e.id = $1", [r.j.id])).rows[0];
  check(e.case_id === caseId && e.key === "raya-trade", "…lands IN it, under the assignment's own client — never the client the body named", JSON.stringify(e));
  r = await mem(reader, { action: "saveMany", caseId, client: "case-other", entries: [{ kind: "hiccup", title: "Review slipped" }, { kind: "lesson", title: "Agree a second chair" }] });
  const two = (await owner.query("SELECT count(*)::int n FROM memory_entries e JOIN tenants t ON t.id = e.about_tenant_id WHERE e.case_id = $1 AND t.key = 'raya-trade' AND e.title IN ('Review slipped','Agree a second chair')", [caseId])).rows[0].n;
  check(r.status === 200 && two === 2, "the learnings prompt's paste saves all of them into the assignment, under its client", JSON.stringify([r.j, two]));
  r = await mem(reader, { action: "list", kind: "hiccup", type: "planning" });
  check(r.j.entries.some((x) => x.title === "Review slipped" && x.caseKind === "planning"), "the front's filters find it: every hiccup on a Planning assignment", JSON.stringify(r.j.entries.map((x) => x.title)));
  r = await mem(reader, { action: "list", kind: "hiccup", type: "retainer" });
  check(!r.j.entries.some((x) => x.title === "Review slipped"), "CONTROL — and not under Retainer", JSON.stringify(r.j.entries.map((x) => x.title)));
  r = await cs(reader, { action: "case", id: caseId });
  check(r.j.case.insightList.some((x) => x.title === "Interview the CFO first"), "…and they are listed inside the assignment", JSON.stringify(r.j.case.insightList.map((x) => x.title)));
  r = await mem(reader, { action: "save", client: "raya-trade", title: "Written before the Track Record" });
  const loose = r.j.id;
  r = await cs(reader, { action: "client", client: "raya-trade" });
  check(r.j.loose.some((x) => x.id === loose) && r.j.assignments.some((a) => a.id === caseId), "a client's page lists its assignments and the learnings tied to none yet", JSON.stringify(r.j.loose.map((x) => x.title)));
  r = await cs(writer, { action: "place", entry: loose, case: caseId });
  check(r.status === 403, "somebody else cannot tie my learning to an assignment", r.status);
  const other = (await cs(boss, { action: "assign", client: "case-other", name: "Other work", kind: "planning", started: "2025-01", lead: writerId })).j.id;
  r = await cs(reader, { action: "place", entry: loose, case: other });
  check(r.status === 400 && /different client/i.test(r.j.error || ""), "a learning cannot be tied to another client's assignment", JSON.stringify(r.j));
  r = await cs(reader, { action: "place", entry: loose, case: caseId });
  check(r.status === 200 && r.j.placed, "its author ties it to an assignment of the same client", JSON.stringify(r.j));
  r = await mem(reader, { action: "one", id: loose });
  check(r.j.entry.caseName === "Strategy build 2025", "…and the learning now names its assignment", JSON.stringify(r.j.entry.caseName));
  r = await cs(writer, { action: "insights", id: pastId, entries: [{ kind: "hiccup", title: "Drivers knew first", happened: "x" }, { title: "" }] });
  check(r.status === 400, "the write-up's learnings are all or none: one without a title stops the lot", JSON.stringify(r.j));
  const n0 = (await owner.query("SELECT count(*)::int n FROM memory_entries WHERE case_id = $1", [pastId])).rows[0].n;
  r = await cs(writer, { action: "insights", id: pastId, entries: [{ kind: "hiccup", title: "Drivers knew first" }, { kind: "lesson", title: "Five measures is the most" }] });
  const n1 = (await owner.query("SELECT count(*)::int n FROM memory_entries WHERE case_id = $1", [pastId])).rows[0].n;
  check(r.status === 200 && n0 === 0 && n1 === 2, "…and with titles both land, in the assignment", JSON.stringify([n0, n1, r.j]));
});

await section("8 · files: the store's absence answers in words", async () => {
  const d = (await owner.query("SELECT deliverables FROM case_studies WHERE id = $1", [pastId])).rows[0].deliverables[0];
  let r = await cs(reader, { action: "fileBegin", id: pastId, deliverable: d.id, name: "x.pdf", bytes: 10 });
  check(r.status === 403, "a consultant who is not the writer cannot attach a file", r.status);
  r = await cs(writer, { action: "fileBegin", id: pastId, deliverable: d.id, name: "x.pdf", bytes: 10 });
  check(r.status === 503 || r.status === 200, "its writer is let through to the store, which here is not set up", r.status + " " + JSON.stringify(r.j));
  if (r.status === 503) check(/no file store/i.test(r.j.error || ""), "…and is told so in words, not a dead button (§231.3)", JSON.stringify(r.j));
  r = await cs(reader, { action: "fileOpen", id: pastId, deliverable: d.id });
  check(r.status === 404, "a deliverable with no file answers that there is none", r.status);
});

await section("9 · deleting a client that has a Track Record is refused by name", async () => {
  const { deleteTenant } = await import("../lib/tenant-delete.ts");
  const t = (await owner.query("SELECT id FROM tenants WHERE key = 'nile-logistics'")).rows[0];
  let msg = "";
  try { await deleteTenant(owner, t.id); } catch (e) { msg = String(e.message); }
  check(/case stud|insight|track record|learning/i.test(msg), "the memory and the Track Record outlive the engagement, and the refusal says why", msg);
});

await section("10 · removing an assignment keeps its learnings", async () => {
  let r = await cs(writer, { action: "drop", id: caseId });
  check(r.status === 403, "a consultant cannot remove an assignment", r.status);
  const before = (await owner.query("SELECT count(*)::int n FROM memory_entries WHERE case_id = $1", [caseId])).rows[0].n;
  r = await cs(boss, { action: "drop", id: caseId });
  const loose = (await owner.query("SELECT count(*)::int n FROM memory_entries WHERE case_id IS NULL AND title IN ('Interview the CFO first','Written before the Track Record')")).rows[0].n;
  check(r.status === 200 && before === 4 && loose === 2, "the super user removes it, and its learnings go back under their client rather than with it", JSON.stringify([before, loose]));
});

/* AND IT LEAVES NO CLIENT BEHIND: a second client named "Other Client"
   sorts first in every client picker and moves the next check's defaults. */
await owner.query("DELETE FROM memory_entries WHERE about_tenant_id IN (SELECT id FROM tenants WHERE key IN ('case-other','nile-logistics'))");
await owner.query("DELETE FROM case_studies WHERE about_tenant_id IN (SELECT id FROM tenants WHERE key IN ('case-other','nile-logistics'))");
await owner.query("DELETE FROM tenants WHERE key IN ('case-other','nile-logistics')");
await stopServer(server);
await owner.end();
console.log((fails ? "RED  " : "GREEN  ") + oks + " ok, " + fails + " failed");
process.exit(fails ? 1 : 0);
