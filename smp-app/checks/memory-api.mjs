/* The consulting memory's endpoint, driven over HTTP against the built app
   (spec 045). Every action, and BOTH ENDS of every rule (§94.2) — who may
   read it, who may change somebody else's, what a half-valid debrief does,
   and what happens to a client that somebody has learned something from.

   THE ONE GATE THIS ENDPOINT HAS is that a client's own account never reaches
   it. Everything else is open by decision 1 (every consultant reads every
   insight), which is why the check asserts the openness as loudly as the
   refusal: a build that quietly gated it would be a memory only its authors
   could read.

     DATABASE_URL_UNPOOLED=postgres://…/smp_dev node checks/memory-api.mjs
     … --break=client-reads  (RED: a client's own staff read Forefront's memory)
     … --break=anyone-edits  (RED: anybody rewrites anybody's insight)
     … --break=partial-save  (RED: a debrief saves the good rows and drops the bad)

   Needs `next build` first. Re-runnable: the dev tenant is REMADE at the start. */
import { spawn } from "node:child_process";
import { join } from "node:path";
import pg from "pg";
import { SCHEMA } from "../db/schema-name.mjs";
import { devTenant, DEV_PASSWORD } from "../scripts/dev-tenant.mjs";
import { hashPassword } from "../lib/auth.ts";

const URL_ = process.env.DATABASE_URL_UNPOOLED || "postgres://postgres:postgres@localhost:5432/smp_dev";
const PORT = 3981, BASE = "http://localhost:" + PORT;
const brk = (process.argv.find((a) => a.startsWith("--break=")) || "").slice(8);
let oks = 0, fails = 0;
const ok = (l) => { oks++; console.log("ok    " + l); };
const fail = (l, m) => { fails++; console.log("FAIL  " + l + (m === undefined ? "" : " — " + String(m).slice(0, 220))); };
const check = (c, l, m) => (c ? ok(l) : fail(l, m));
async function section(name, fn) {
  console.log("── " + name);
  try { await fn(); } catch (e) { fail(name + " — the section died rather than reporting (§215)", e && e.stack ? e.stack.split("\n").slice(0, 2).join(" ") : e); }
}

const { tenantId } = await devTenant({ url: URL_, log: () => {} });
const owner = new pg.Pool({ connectionString: URL_, max: 3, options: "-c search_path=" + SCHEMA });
await owner.query("DELETE FROM login_attempts");
/* A SECOND CLIENT AND A SECOND CONSULTANT, because every assertion here is
   about one of them reaching the other's (§113.8: one of each proves nothing). */
await owner.query("DELETE FROM tenants WHERE key = 'mem-other'");
const other = (await owner.query(
  "INSERT INTO tenants (key, name, industry) VALUES ('mem-other','Other Client','Healthcare') RETURNING id")).rows[0];
const mint = async (email, name, isAdmin) => {
  await owner.query("DELETE FROM users WHERE email = $1", [email]);
  return (await owner.query(
    "INSERT INTO users (email, name, kind, is_admin, must_change, password_hash) VALUES ($1,$2,'office',$3,false,$4) RETURNING id",
    [email, name, isAdmin, hashPassword(DEV_PASSWORD)])).rows[0].id;
};
await mint("second@forefront.example", "Second Consultant", false);
await mint("boss@forefront.example", "Platform Admin", true);

/* A CHECK MUST NOT TALK TO A SERVER IT DID NOT START (§105.6, §54.5).
   `next start` on a taken port fails quietly, the wait below then succeeds
   against WHATEVER is listening, and the run measures bytes this working tree
   never wrote — which is exactly what happened while this file was written: a
   server from an earlier run held the port from before a script tag existed,
   so the page's JS was current and its DOCUMENT was four minutes old, and the
   check reported a product fault that was not there. Refused outright. */
async function portFree(port) {
  try { await fetch("http://localhost:" + port + "/", { signal: AbortSignal.timeout(800) }); return false; }
  catch { return true; }
}
/* AND IT LEAVES THE PORT AS IT FOUND IT, or the NEXT run is the one that
   measures the stale server: killed by group, then WAITED for. */
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
const mem = async (cookie, body) => {
  const r = await fetch(BASE + "/api/memory", { method: "POST", headers: { ...(cookie ? { cookie } : {}), "content-type": "application/json" }, body: JSON.stringify(body) });
  let j = null; try { j = await r.json(); } catch {}
  return { status: r.status, j };
};
const rows = async () => (await owner.query("SELECT count(*)::int n FROM memory_entries")).rows[0].n;

const me = await signIn("office@forefront.example");        /* the office, an admin on the dev tenant */
const second = await signIn("second@forefront.example");    /* another consultant, no admin flag */
const boss = await signIn("boss@forefront.example");        /* a platform admin */
const client = await signIn("mobhead@raya.example");        /* a CLIENT's own person */

let mineId = null;

await section("0 · the door, and the one gate this endpoint has", async () => {
  let r = await mem("", { action: "list" });
  check(r.status === 401 && r.j && r.j.auth === true, "no session: 401, and the page is told it is the session", r.status);
  r = await mem(client, { action: "list" });
  check(r.status === 403, "a CLIENT's own account is refused — the boundary the whole spec rests on", r.status + " " + JSON.stringify(r.j));
  const p = await fetch(BASE + "/api/platform", { method: "POST", headers: { cookie: client, "content-type": "application/json" }, body: JSON.stringify({ action: "cards" }) });
  const pj = await p.json().catch(() => ({}));
  check(r.j && pj && r.j.error === pj.error,
    "…in the SAME words /api/platform refuses them, so the two do not tell each other apart (§53.5)", JSON.stringify(r.j) + " vs " + JSON.stringify(pj));
  r = await mem(me, { action: "list" });
  check(r.status === 200, "CONTROL — a consultant with no admin flag is NOT gated: decision 1, asserted as loudly as the refusal", r.status);
});

await section("1 · writing one, and what a title is for", async () => {
  let r = await mem(me, { action: "save", client: "raya-trade", kind: "hiccup", title: "  ", happened: "x" });
  check(r.status === 400 && /title/i.test(r.j.error || ""), "a blank title is refused, and the refusal says what to do", r.status + " " + JSON.stringify(r.j));
  r = await mem(me, { action: "save", kind: "hiccup", title: "No client named" });
  check(r.status === 400 && /client/i.test(r.j.error || ""), "…and so is an insight that names no client (decision 2)", r.status + " " + JSON.stringify(r.j));
  r = await mem(me, { action: "save", client: "raya-trade", title: "A title is enough" });
  check(r.status === 200 && r.j.id, "A TITLE AND A CLIENT ARE ENOUGH TO SAVE — the rule the memory lives or dies by", JSON.stringify(r.j));
  mineId = r.j.id;
  r = await mem(me, { action: "save", client: "raya-trade", kind: "hiccup",
    title: "The weighting workshop ran twice", happened: "ran it without the CEO", did: "went back one by one",
    came_of_it: "the weights are right and the room is not", next_person: "have the owner in the room", occurred: "August 2026" });
  check(r.status === 200, "a full one saves", JSON.stringify(r.j));
  const one = await mem(second, { action: "one", id: r.j.id });
  check(one.status === 200 && one.j.entry.happened === "ran it without the CEO" && one.j.entry.occurred === "August 2026",
    "…and another consultant reads every word of it back", JSON.stringify(one.j).slice(0, 160));
  check(one.j.entry.author === "SMO" || !!one.j.entry.author,
    "…with the author NAMED on it, which is what a reader acts on (decision 3)", JSON.stringify(one.j.entry.author));
  check(!!one.j.entry.authorEmail, "…and an address, so 'go and ask them' is a thing you can do", JSON.stringify(one.j.entry.authorEmail));
  check(one.j.entry.clientName === "Raya Trade" && one.j.entry.industry !== undefined,
    "…and the client's own name and industry, JOINED rather than stored on the entry", JSON.stringify([one.j.entry.clientName, one.j.entry.industry]));
});

await section("2 · who may change one — both ends", async () => {
  let r = await mem(second, { action: "save", id: mineId, client: "raya-trade", title: "Rewritten by somebody else" });
  check(r.status === 403, "another consultant may NOT rewrite it", r.status + " " + JSON.stringify(r.j));
  r = await mem(second, { action: "drop", id: mineId });
  check(r.status === 403, "…nor remove it", r.status);
  /* EVERY PROBE DEGRADES (§215): under --break=anyone-edits the two presses
     above SUCCEED, so the entry may be gone by the time these read it — and a
     check that dies here reports four failures where the truth is more, which
     is the fault this file's own section helper exists to catch. */
  const seen = await mem(second, { action: "one", id: mineId });
  const seenMine = seen.j && seen.j.entry ? seen.j.entry.mine : "the entry was gone — the presses above went through";
  check(seenMine === false, "…and the page is TOLD so, by a flag the server computed (§53.5)", JSON.stringify(seenMine));
  const own = await mem(me, { action: "one", id: mineId });
  const ownMine = own.j && own.j.entry ? own.j.entry.mine : "the entry was gone";
  check(ownMine === true, "CONTROL — the author's own copy says mine, or `mine:false` everywhere would pass", JSON.stringify(ownMine));
  if (!(own.j && own.j.entry)) {
    /* put one back, so the sections after this measure what they are about */
    mineId = (await mem(me, { action: "save", client: "raya-trade", title: "A title is enough" })).j.id;
  }
  r = await mem(me, { action: "save", id: mineId, client: "raya-trade", title: "A title is enough, corrected" });
  check(r.status === 200, "the author may correct their own", r.status + " " + JSON.stringify(r.j));
  r = await mem(boss, { action: "save", id: mineId, client: "raya-trade", title: "A title is enough, corrected twice" });
  check(r.status === 200, "…and a platform admin may correct anybody's", r.status + " " + JSON.stringify(r.j));
});

await section("3 · a period debrief saves together or not at all", async () => {
  const before = await rows();
  const four = [1, 2, 3, 4].map((n) => ({ kind: "lesson", title: "Debrief item " + n, happened: "body " + n, occurred: "Aug–Sep 2026" }));
  let r = await mem(me, { action: "saveMany", client: "mem-other", entries: four });
  check(r.status === 200 && r.j.saved === 4, "four drafts land together", JSON.stringify(r.j));
  check((await rows()) === before + 4, "…and the count says four", (await rows()) - before);

  const mid = await rows();
  const bad = [{ title: "Good one" }, { title: "   " }, { title: "Another good one" }];
  r = await mem(me, { action: "saveMany", client: "mem-other", entries: bad });
  check(r.status === 400, "a draft with no title stops the save and NAMES which one", r.status + " " + JSON.stringify(r.j));
  check((await rows()) === mid, "…and NOUGHT is stored — all or none, because six half-saved is the outcome nobody can tell from a bug", (await rows()) - mid);

  r = await mem(me, { action: "saveMany", client: "mem-other", entries: [] });
  check(r.status === 400, "an empty paste is refused rather than saved as nothing", r.status);
});

await section("4 · finding one again", async () => {
  let r = await mem(second, { action: "list", client: "mem-other" });
  check(r.status === 200 && r.j.entries.length === 4 && r.j.entries.every((e) => e.client === "mem-other"),
    "the client filter returns that client's and only that client's", r.j.entries.length);
  r = await mem(second, { action: "list", kind: "hiccup" });
  check(r.j.entries.length === 1 && r.j.entries[0].kind === "hiccup", "the kind filter narrows to one kind", JSON.stringify(r.j.entries.map((e) => e.kind)));
  r = await mem(second, { action: "list", q: "weighting" });
  check(r.j.entries.length === 1 && /weighting/i.test(r.j.entries[0].title), "a word in the TITLE finds it", r.j.entries.length);
  r = await mem(second, { action: "list", q: "without the CEO" });
  check(r.j.entries.length === 1, "…and a phrase from INSIDE it does too, which is what people actually remember", r.j.entries.length);
  r = await mem(second, { action: "list" });
  const industries = r.j.industries || [];
  check(industries.includes("Healthcare"), "the industry list is built from what the memory HOLDS, not from every client", JSON.stringify(industries));
  check((r.j.clients || []).length === 2, "…and so is the client list", JSON.stringify((r.j.clients || []).map((c) => c.key)));
});

await section("5 · nobody is watched reading (decision 4)", async () => {
  const beforeRows = await rows();
  const beforeLog = (await owner.query("SELECT count(*)::int n FROM tenant_log")).rows[0].n;
  await mem(second, { action: "one", id: mineId });
  await mem(second, { action: "list" });
  const afterRows = await rows(), afterLog = (await owner.query("SELECT count(*)::int n FROM tenant_log")).rows[0].n;
  check(afterRows === beforeRows && afterLog === beforeLog, "reading an insight writes NO row anywhere — no count, no named log", beforeRows + "/" + beforeLog + " → " + afterRows + "/" + afterLog);
  /* THE CONTROL, in the same run: a build that stored nothing at all would
     satisfy an absence perfectly (§113.8). */
  const w = await mem(me, { action: "save", client: "raya-trade", title: "And a write still lands" });
  check(w.status === 200 && (await rows()) === beforeRows + 1, "CONTROL — a WRITE in the same run does land, so the absence above means something", (await rows()) - beforeRows);
  await mem(me, { action: "drop", id: w.j.id });
});

await section("6 · the memory outlives the engagement", async () => {
  let err = null;
  try { await owner.query("DELETE FROM tenants WHERE key = 'mem-other'"); }
  catch (e) { err = e; }
  check(err && err.code === "23503", "a client somebody has learned something from cannot be DELETED — the insights hold it (§62's shape)", err ? err.code : "deleted, and the insights went with it");
  const r = await owner.query("UPDATE tenants SET status = 'retired' WHERE key = 'mem-other' RETURNING status");
  check(r.rows[0] && r.rows[0].status === "retired", "CONTROL — retiring it, which is the ordinary path, is untouched by any of this", JSON.stringify(r.rows[0]));
});

await section("7 · removing one", async () => {
  const before = await rows();
  let r = await mem(me, { action: "drop", id: mineId });
  check(r.status === 200 && (await rows()) === before - 1, "the author removes their own", r.status);
  r = await mem(me, { action: "drop", id: mineId });
  check(r.status === 200 && r.j.gone === true, "…and removing one that has already gone is not an error", r.status + " " + JSON.stringify(r.j));
  r = await mem(me, { action: "one", id: mineId });
  check(r.status === 404, "…reading it afterwards says so plainly", r.status);
});

await owner.query("DELETE FROM memory_entries");
await owner.query("DELETE FROM tenants WHERE key = 'mem-other'");
await owner.end();
await stopServer(server);
console.log((fails ? "RED  " : "GREEN  ") + oks + " ok, " + fails + " failed");
process.exit(fails ? 1 : 0);
