/* Case studies' endpoint, driven over HTTP against the built app (spec 067).
   Every rule BOTH WAYS (§94.2): who may open a piece of work, who may write
   it, who may read a draft, what a save may and may not carry, and the
   boundary every Forefront-only surface keeps — a client's own staff.

     DATABASE_URL_UNPOOLED=postgres://…/smp_dev node --experimental-strip-types checks/case-api.mjs
     … --break=anyone-opens   (RED: a consultant opens a piece of work)
     … --break=drafts-open    (RED: a draft is read by everybody)
     … --break=anyone-writes  (RED: anybody rewrites a case study)
     … --break=take-file      (RED: a save names a file the server never stored)
     … --break=client-reads   (RED: a client's own staff read case studies)
     … --break=cross-client   (RED: an insight placed in another client's work)
     … --break=done-empty     (RED: marked done with nothing to read first)

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

await section("0 · the door, and the boundary", async () => {
  let r = await cs("", { action: "library" });
  check(r.status === 401 && r.j && r.j.auth === true, "no session: 401, and the page is told it is the session", r.status);
  r = await cs(client, { action: "library" });
  check(r.status === 403, "a CLIENT's own account is refused — case studies are Forefront's", r.status + " " + JSON.stringify(r.j));
  const m = await mem(client, { action: "list" });
  check(r.j && m.j && r.j.error === m.j.error, "…in the memory's own words, so the two surfaces cannot be told apart (§53.5)", JSON.stringify([r.j, m.j]));
  r = await cs(reader, { action: "library" });
  check(r.status === 200 && Array.isArray(r.j.cases), "CONTROL — a consultant with no admin flag reads the library (decision 2)", r.status);
  check(r.j.canOpen === false, "…and is told they may not open a piece of work", JSON.stringify(r.j.canOpen));
  r = await cs(boss, { action: "library" });
  check(r.j.canOpen === true, "…while an admin is told they may (decision 11)", JSON.stringify(r.j.canOpen));
});

await section("1 · opening a piece of work is an admin's (decision 11)", async () => {
  let r = await cs(reader, { action: "open", client: "raya-trade", name: "Not mine to open" });
  check(r.status === 403, "a consultant cannot open one, refused by the server and not only by a hidden button", r.status + " " + JSON.stringify(r.j));
  r = await cs(boss, { action: "open", client: "raya-trade", name: "  " });
  check(r.status === 400 && /name/i.test(r.j.error || ""), "a blank name is refused in words", JSON.stringify(r.j));
  r = await cs(boss, { action: "open", client: "nobody-at-all", name: "Ghost" });
  check(r.status === 400 && /client/i.test(r.j.error || ""), "…and so is a client that does not exist", JSON.stringify(r.j));
  r = await cs(boss, { action: "open", client: "raya-trade", name: "Strategy build 2025", started: "2025-01", team: [{ id: writerId, role: "Engagement lead" }] });
  check(r.status === 200 && r.j.id, "an admin opens one for a client, with a team", JSON.stringify(r.j));
  caseId = r.j.id;
  const row = (await owner.query("SELECT state, writer_id, our_team FROM case_studies WHERE id = $1", [caseId])).rows[0];
  check(row && row.state === "running" && !row.writer_id, "…and with no writer it is RUNNING: opened when the work starts (answer 1)", JSON.stringify(row));
  check(row && row.our_team.length === 1 && row.our_team[0].role === "Engagement lead", "…with its team stored", JSON.stringify(row && row.our_team));
});

await section("2 · a past client, made in the same press (decision 5)", async () => {
  let r = await cs(boss, { action: "open", past: { name: "Nile Logistics", industry: "Transportation", size: "Mid-size" },
    name: "Operating model 2023", started: "2023-03", ended: "2023-11", writer: writerId });
  check(r.status === 400 && /wanted/i.test(r.j.error || ""), "asking for a write-up with no date is refused — the date is what orders it on My work", JSON.stringify(r.j));
  const before = (await owner.query("SELECT count(*)::int n FROM tenants WHERE key = 'nile-logistics'")).rows[0].n;
  check(before === 0, "…and the refusal made NO past client: it is one transaction (§171)", before);
  r = await cs(boss, { action: "open", past: { name: "Nile Logistics", industry: "Transportation", size: "Mid-size" },
    name: "Operating model 2023", started: "2023-03", ended: "2023-11", writer: writerId, due: "2026-11-13" });
  check(r.status === 200 && r.j.id, "an admin opens a past piece of work for a client that was never on the platform", JSON.stringify(r.j));
  pastId = r.j.id;
  const t = (await owner.query("SELECT status, past, archived_at IS NOT NULL AS dated, modules FROM tenants WHERE key = 'nile-logistics'")).rows[0];
  check(t && t.status === "retired" && t.past === true && t.dated, "the past client is made RETIRED and marked past — its door closed from the start", JSON.stringify(t));
  check(t && Array.isArray(t.modules) && t.modules.length === 0, "…with no modules: there is nothing behind the door", JSON.stringify(t && t.modules));
  const row = (await owner.query("SELECT state, writer_id, due::text AS due FROM case_studies WHERE id = $1", [pastId])).rows[0];
  check(row.state === "writing" && row.writer_id === writerId && row.due === "2026-11-13", "…and with a writer the piece of work is WRITING, due on the day asked", JSON.stringify(row));
  r = await cs(boss, { action: "open", past: { name: "Nile Logistics" }, name: "Again" });
  check(r.status === 400 && /already/i.test(r.j.error || ""), "the same past client twice is refused by name, not made twice (§53.5)", JSON.stringify(r.j));
  const opts = await cs(writer, { action: "options" });
  const nile = (opts.j.clients || []).find((c) => c.key === "nile-logistics");
  check(nile && nile.past && nile.archived, "the opening form offers past and archived clients too", JSON.stringify(nile));
  check(!(opts.j.clients || []).some((c) => c.key === "demo"), "…and never the worked example", JSON.stringify((opts.j.clients || []).map((c) => c.key)));
});

await section("3 · writing it: the writer or an admin, nobody else (decision 10)", async () => {
  let r = await cs(writer, { action: "save", id: caseId, inShort: "x" });
  check(r.status === 403 && /nobody has been asked/i.test(r.j.error || ""), "a RUNNING piece of work cannot be written by a consultant — nobody has been asked yet", JSON.stringify(r.j));
  r = await cs(reader, { action: "save", id: pastId, inShort: "Not my story" });
  check(r.status === 403, "a consultant who is not the writer cannot change a write-up", r.status + " " + JSON.stringify(r.j));
  const deliverables = [
    { name: "Depot diagnostic", what: "Visits and figures from all three depots", month: "Apr 2023" },
    { name: "Operating model design", what: "Central planning", month: "Jul 2023", file: { path: "cases/someone-else/secret.pdf", name: "secret.pdf", bytes: 9 } },
  ];
  r = await cs(writer, { action: "save", id: pastId, name: "Operating model 2023",
    inShort: "Nile Logistics asked us to redesign its depots.", clientWhy: "Two years of missed targets.",
    askedToDo: "Redesign how the depots are run.", cameOfIt: "",
    ourTeam: [{ id: writerId, role: "Lead" }, { id: "00000000-0000-0000-0000-000000000000", role: "Ghost" }],
    theirTeam: [{ name: "Hany M.", role: "COO" }, { name: "", role: "nobody" }],
    stages: [{ when: "Mar", what: "Diagnostic" }, { when: "Apr", what: "" }],
    deliverables, whoToAsk: [{ name: "Islam Writer", about: "the depot managers" }] });
  check(r.status === 200 && r.j.case, "the writer saves the eight sections", JSON.stringify(r.j).slice(0, 200));
  const c = r.j.case || {};
  check(c.inShort === "Nile Logistics asked us to redesign its depots." && c.askedToDo, "…and reads them back", JSON.stringify([c.inShort, c.askedToDo]));
  check(c.ourTeam && c.ourTeam.length === 1 && c.ourTeam[0].name === "Islam Writer", "our team keeps only real consultants, and names them from the account", JSON.stringify(c.ourTeam));
  check(c.theirTeam && c.theirTeam.length === 1 && c.stages && c.stages.length === 1, "an empty person or stage is dropped rather than drawn as a blank line", JSON.stringify([c.theirTeam, c.stages]));
  const stored = (await owner.query("SELECT deliverables FROM case_studies WHERE id = $1", [pastId])).rows[0].deliverables;
  check(stored.length === 2 && stored.every((d) => d.file === null), "A FILE IS NEVER TAKEN FROM THE BODY: a save naming somebody else's path stores no file (the path is the permission)", JSON.stringify(stored));
  check(stored.every((d) => /^[0-9a-f-]{36}$/.test(d.id)), "…and every deliverable gets an id from the server", JSON.stringify(stored.map((d) => d.id)));
  const again = await cs(writer, { action: "save", id: pastId, name: "Operating model 2023", inShort: c.inShort,
    deliverables: [{ id: stored[0].id, name: "Depot diagnostic", what: "renamed what", month: "Apr 2023" }] });
  const stored2 = (await owner.query("SELECT deliverables FROM case_studies WHERE id = $1", [pastId])).rows[0].deliverables;
  check(again.status === 200 && stored2.length === 1 && stored2[0].id === stored[0].id, "a deliverable keeps its id across saves, so its file stays with it", JSON.stringify(stored2));
  r = await cs(boss, { action: "save", id: pastId, name: "Operating model 2023", inShort: c.inShort, deliverables: stored2 });
  check(r.status === 200, "CONTROL — an admin may correct it too", r.status);
});

await section("4 · a draft is the writer's and the admins' (decision 10)", async () => {
  let r = await cs(reader, { action: "case", id: pastId });
  check(r.status === 200 && r.j.case.hidden === true, "a consultant opening someone else's draft is told it is hidden…", JSON.stringify(r.j && r.j.case && r.j.case.hidden));
  check(r.j.case.inShort === "" && r.j.case.deliverables.length === 0 && r.j.case.ourTeam.length === 0, "…and gets NONE of its story, only its head", JSON.stringify([r.j.case.inShort, r.j.case.deliverables.length]));
  r = await cs(reader, { action: "library", q: "redesign its depots" });
  check(r.status === 200 && !r.j.cases.some((x) => x.id === pastId), "a draft's words cannot be found by searching for them", JSON.stringify(r.j.cases.map((x) => x.name)));
  r = await cs(writer, { action: "library", q: "redesign its depots" });
  check(r.j.cases.some((x) => x.id === pastId), "CONTROL — its writer finds it by those words", JSON.stringify(r.j.cases.map((x) => x.name)));
  r = await cs(writer, { action: "case", id: pastId });
  check(r.j.case.hidden === false && r.j.case.inShort, "CONTROL — the writer reads the whole draft", JSON.stringify(r.j.case.hidden));
});

await section("5 · marking it done puts it on the shelves", async () => {
  await owner.query("UPDATE case_studies SET in_short = '' WHERE id = $1", [pastId]);
  let r = await cs(writer, { action: "done", id: pastId });
  check(r.status === 400 && /in short/i.test(r.j.error || ""), "it cannot be marked done with nothing to read first", JSON.stringify(r.j));
  await owner.query("UPDATE case_studies SET in_short = 'Nile Logistics asked us to redesign its depots.' WHERE id = $1", [pastId]);
  r = await cs(reader, { action: "done", id: pastId });
  check(r.status === 403, "somebody who is not its writer cannot mark it done", r.status);
  r = await cs(writer, { action: "done", id: pastId });
  check(r.status === 200, "its writer marks it done", JSON.stringify(r.j));
  r = await cs(reader, { action: "case", id: pastId });
  check(r.j.case.state === "done" && r.j.case.hidden === false && r.j.case.inShort, "…and now every consultant reads the whole of it (decision 2)", JSON.stringify([r.j.case.state, r.j.case.hidden]));
  r = await cs(reader, { action: "library", q: "redesign its depots" });
  check(r.j.cases.some((x) => x.id === pastId), "…and finds it by its words", JSON.stringify(r.j.cases.map((x) => x.name)));
});

await section("6 · asking for a write-up when the work ends", async () => {
  let r = await cs(writer, { action: "ask", id: caseId, writer: writerId, due: "2026-12-01" });
  check(r.status === 403, "a consultant cannot ask for one", r.status);
  r = await cs(boss, { action: "ask", id: caseId, writer: readerId });
  check(r.status === 400 && /wanted/i.test(r.j.error || ""), "an ask with no date is refused", JSON.stringify(r.j));
  r = await cs(boss, { action: "ask", id: caseId, writer: writerId, due: "2026-12-01", ended: "2025-06" });
  check(r.status === 200, "an admin asks the writer, with a date", JSON.stringify(r.j));
  const row = (await owner.query("SELECT state, writer_id, ended FROM case_studies WHERE id = $1", [caseId])).rows[0];
  check(row.state === "writing" && row.writer_id === writerId && row.ended === "2025-06", "…and the piece of work is now WRITING, with its end month", JSON.stringify(row));
});

await section("7 · insights inside a piece of work (spec 067 §5)", async () => {
  let r = await mem(reader, { action: "save", caseId, title: "Interview the CFO first", kind: "practice", client: "case-other" });
  check(r.status === 200, "an insight added from inside a case study saves", JSON.stringify(r.j));
  const e = (await owner.query("SELECT e.case_id, t.key FROM memory_entries e JOIN tenants t ON t.id = e.about_tenant_id WHERE e.id = $1", [r.j.id])).rows[0];
  check(e.case_id === caseId && e.key === "raya-trade", "…lands IN it, under the case study's own client — never the client the body named", JSON.stringify(e));
  r = await cs(reader, { action: "case", id: caseId });
  check(r.j.case.insightList.some((x) => x.title === "Interview the CFO first"), "…and is listed inside the case study", JSON.stringify(r.j.case.insightList.map((x) => x.title)));
  r = await mem(reader, { action: "save", client: "raya-trade", title: "Written before case studies" });
  const loose = r.j.id;
  r = await mem(reader, { action: "list", case: "none" });
  check(r.j.entries.some((x) => x.id === loose) && !r.j.entries.some((x) => x.caseId), "an insight with no piece of work is listed as not yet placed", JSON.stringify(r.j.entries.map((x) => x.caseName)));
  r = await cs(writer, { action: "place", entry: loose, case: caseId });
  check(r.status === 403, "somebody else cannot place my insight", r.status);
  const other = (await cs(boss, { action: "open", client: "case-other", name: "Other work" })).j.id;
  r = await cs(reader, { action: "place", entry: loose, case: other });
  check(r.status === 400 && /different client/i.test(r.j.error || ""), "an insight cannot be placed in another client's work", JSON.stringify(r.j));
  r = await cs(reader, { action: "place", entry: loose, case: caseId });
  check(r.status === 200 && r.j.placed, "its author places it in a piece of work for the same client", JSON.stringify(r.j));
  r = await mem(reader, { action: "one", id: loose });
  check(r.j.entry.caseName === "Strategy build 2025", "…and the insight now names its case study", JSON.stringify(r.j.entry.caseName));
  r = await cs(writer, { action: "insights", id: pastId, entries: [{ kind: "hiccup", title: "Drivers knew first", happened: "x" }, { title: "" }] });
  check(r.status === 400, "the interview's insights are all or none: one without a title stops the lot", JSON.stringify(r.j));
  const n0 = (await owner.query("SELECT count(*)::int n FROM memory_entries WHERE case_id = $1", [pastId])).rows[0].n;
  r = await cs(writer, { action: "insights", id: pastId, entries: [{ kind: "hiccup", title: "Drivers knew first" }, { kind: "lesson", title: "Five measures is the most" }] });
  const n1 = (await owner.query("SELECT count(*)::int n FROM memory_entries WHERE case_id = $1", [pastId])).rows[0].n;
  check(r.status === 200 && n0 === 0 && n1 === 2, "…and with titles both land, in the piece of work", JSON.stringify([n0, n1, r.j]));
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

await section("9 · deleting a client that has case studies is refused by name", async () => {
  const { deleteTenant } = await import("../lib/tenant-delete.ts");
  const t = (await owner.query("SELECT id FROM tenants WHERE key = 'nile-logistics'")).rows[0];
  let msg = "";
  try { await deleteTenant(owner, t.id); } catch (e) { msg = String(e.message); }
  check(/case stud|insight/i.test(msg), "the memory and the case studies outlive the engagement, and the refusal says why", msg);
});

await section("10 · removing a piece of work keeps its insights", async () => {
  let r = await cs(writer, { action: "drop", id: caseId });
  check(r.status === 403, "a consultant cannot remove a piece of work", r.status);
  const before = (await owner.query("SELECT count(*)::int n FROM memory_entries WHERE case_id = $1", [caseId])).rows[0].n;
  r = await cs(boss, { action: "drop", id: caseId });
  const loose = (await owner.query("SELECT count(*)::int n FROM memory_entries WHERE case_id IS NULL AND title IN ('Interview the CFO first','Written before case studies')")).rows[0].n;
  check(r.status === 200 && before === 2 && loose === 2, "an admin removes it, and its insights go back under their client rather than with it", JSON.stringify([before, loose]));
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
