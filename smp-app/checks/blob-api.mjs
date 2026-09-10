/* THE CLIP ENDPOINT ON THE NEW STACK (spec 043 Phase E).

   `api/blob.js` is the fifth endpoint and the last one ported. There is no
   blob store in this sandbox and there is not meant to be: what §261 decided
   is almost all about WHO, and only the last step is about bytes — so this
   file asserts every gate that can be reached without one, and asserts that
   the store's absence is answered in WORDS at every door rather than hung on
   or lied about (§231.4, §261.12).

   THE ORDER IS THE ASSERTION, not merely the answer. `list` and `drop` refuse
   the wrong PERSON before they ever consult the store — so a deployment with
   no store still tells a unit head that storage is the office's, and tells the
   office that there is no store. Reverse the two and both would read "no video
   store here", which is §124's overclaim with the sign flipped: a refusal that
   names the wrong cause sends somebody to the wrong page.

   AND §261.5's OWN FAULT IS ASSERTED AS A RULE. `grantIn` answers with a WORD
   and one of the words is "none", which is truthy — so `if (!grantIn(…))`
   never fired and anybody signed in could play any unit's clip. `mayWatch` is
   a pure predicate over the world, so it is asked here directly, both ends.

     DATABASE_URL_UNPOOLED=postgres://…/smp_dev node checks/blob-api.mjs
     … --break=store-first   (RED: the store is consulted before the person)
     … --break=watch-truthy  (RED: §261.5's fault put back — "none" watches)

   Needs `next build` first. Re-runnable: the dev tenant is REMADE at the start. */
import { spawn } from "node:child_process";
import { join } from "node:path";
import { createRequire } from "node:module";
import pg from "pg";
import { devTenant, DEV_PASSWORD } from "../scripts/dev-tenant.mjs";
import { hashPassword } from "../lib/auth.ts";
import { withTenant } from "../lib/tenant.ts";
import { readState } from "../lib/state-io.ts";
import { clipPath, targetOfPath, mayWatch, maySpeakFor } from "../lib/blob-api.ts";

const URL_ = process.env.DATABASE_URL_UNPOOLED || "postgres://postgres:postgres@localhost:5432/smp_dev";
const PORT = 3977, BASE = "http://localhost:" + PORT, SLUG = "raya-trade";
const brk = (process.argv.find((a) => a.startsWith("--break=")) || "").slice(8);
/* THE BREAK REACHES THIS PROCESS TOO. `mayWatch` and `maySpeakFor` are
   asked HERE, in-process, so a break set only on the spawned server's
   environment leaves them behaving perfectly and the falsification
   reports NOT RED — a proof that proves nothing (§94.5). */
if (brk) process.env.SMP_BREAK = brk;
const R = createRequire(import.meta.url)("../lib/rules.cjs");
let oks = 0, fails = 0;
const ok = (l) => { oks++; console.log("ok    " + l); };
const fail = (l, m) => { fails++; console.log("FAIL  " + l + (m === undefined ? "" : " — " + String(m).slice(0, 220))); };
const check = (c, l, m) => (c ? ok(l) : fail(l, m));

const { tenantId } = await devTenant({ url: URL_, log: () => {} });
const owner = new pg.Pool({ connectionString: URL_, max: 2 });
const graph0 = await withTenant(tenantId, (c) => readState(c));
const mint = async (key, kind, isAdmin, seat) => {
  const p = graph0.people.find((x) => x.key === key);
  const email = key + "@raya.example";
  await owner.query("DELETE FROM users WHERE email = $1", [email]);
  const u = (await owner.query("INSERT INTO users (email, name, kind, is_admin, must_change, password_hash) VALUES ($1,$2,$3,$4,false,$5) RETURNING id",
    [email, p ? p.name : key, kind, isAdmin, hashPassword(DEV_PASSWORD)])).rows[0];
  await owner.query("INSERT INTO tenant_users (tenant_id, user_id, person_key, seat) VALUES ($1,$2,$3,$4)", [tenantId, u.id, key, seat]);
  return email;
};
const smoteamEmail = await mint("ceo", "client", false, "smoteam");
await owner.query("DELETE FROM login_attempts");

const server = spawn("npx", ["next", "start", "-p", String(PORT)], {
  cwd: join(import.meta.dirname, ".."),
  env: { ...process.env, DATABASE_URL_UNPOOLED: URL_, SMP_BREAK: brk },
  stdio: ["ignore", "pipe", "pipe"], detached: true,
});
server.stdout.on("data", () => {}); server.stderr.on("data", (d) => process.stderr.write(d));
let up = false;
for (let i = 0; i < 60 && !up; i++) { await new Promise((r) => setTimeout(r, 500)); try { up = (await fetch(BASE + "/")).status === 200; } catch {} }
if (!up) { console.log("FAIL  the app did not start"); try { process.kill(-server.pid); } catch {} process.exit(1); }

async function signIn(email, pw = DEV_PASSWORD) {
  const r = await fetch(BASE + "/api/auth/sign-in", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ email, password: pw }) });
  return (r.headers.get("set-cookie") || "").split(";")[0];
}
const post = async (cookie, body, slug = SLUG) => {
  const r = await fetch(BASE + "/api/blob?client=" + slug, {
    method: "POST", headers: { ...(cookie ? { cookie } : {}), "content-type": "application/json" },
    body: JSON.stringify(body), redirect: "manual",
  });
  let j = null; try { j = await r.json(); } catch {}
  return { status: r.status, j };
};
const get = async (cookie, q, slug = SLUG) => {
  const r = await fetch(BASE + "/api/blob?client=" + slug + "&" + q, {
    headers: cookie ? { cookie } : {}, redirect: "manual",
  });
  let j = null; try { j = await r.json(); } catch {}
  return { status: r.status, j, to: r.headers.get("location") };
};

const office = await signIn("office@forefront.example");
const head = await signIn("mobhead@raya.example");
const smoteam = await signIn(smoteamEmail);

try {
  /* ── 1 · the door is in front of it ─────────────────────────────────── */
  console.log("\n1 · the door");
  let r = await post("", { action: "status" });
  check(r.status === 401 && r.j && r.j.auth === true, "no session is refused before anything is read", r.status);
  r = await post(office, { action: "status" }, "no-such-client");
  check(r.status === 404, "a client that does not exist is refused", r.status);
  r = await post(office, { action: "status" }, "public");
  check(r.status === 404, "...and a schema name typed into the address is refused identically (§313)", r.status);

  /* ── 2 · the page asks before it draws ──────────────────────────────── */
  console.log("\n2 · status says there is no store, in words");
  r = await post(office, { action: "status" });
  check(r.status === 200 && r.j && r.j.ready === false, "status answers, and says the store is not there", r.j);
  check(r.j && r.j.max === R.VIDEO_MAX_BYTES && r.j.secs === R.VIDEO_MAX_SECS && r.j.each === R.VIDEO_PER_SUBJECT,
    "...with the three limits the shared rules hold, never numbers of its own", r.j);

  /* ── 3 · the person first, the store second ─────────────────────────── */
  console.log("\n3 · who, before whether there is a store");
  r = await post(head, { action: "list" });
  check(r.status === 403 && /SMO/.test((r.j && r.j.error) || ""), "a unit head is told storage is the office's", r.j);
  r = await post(office, { action: "list" });
  check(r.status === 200 && r.j && r.j.ready === false && Array.isArray(r.j.clips) && !r.j.clips.length,
    "the office is told there is no store — never an empty table with nothing read (§231.4)", r.j);
  r = await post(smoteam, { action: "drop", path: "videos/mobile/x.mp4" });
  check(r.status === 403 && /Super user/.test((r.j && r.j.error) || ""),
    "clearing storage is the Super user's, not merely the office's (§89)",
    r.status + " " + JSON.stringify(r.j));
  r = await post(office, { action: "drop", path: "videos/mobile/x.mp4" });
  check(r.status === 503 && /no video store/.test((r.j && r.j.error) || ""),
    "...and the Super user is then told there is no store", r.j);

  /* ── 4 · every door says it, and none of them hangs ─────────────────── */
  console.log("\n4 · the store's absence is answered everywhere");
  for (const body of [{ action: "begin", target: "mobile", bytes: 1000 },
                      { action: "finish", path: "videos/mobile/x.mp4" }]) {
    r = await post(office, body);
    check(r.status === 503 && /no video store/.test((r.j && r.j.error) || ""),
      "`" + body.action + "` says there is no store", r.status + " " + JSON.stringify(r.j));
  }
  /* `?play=<path>`, WHICH IS WHAT slides.js ASKS FOR (§261.14). A spelling of
     my own here would have tested a door the product does not knock on. */
  r = await get(office, "play=" + encodeURIComponent("videos/mobile/x.mp4"));
  check(r.status === 503, "play says it too, rather than hanging or redirecting nowhere",
    r.status + " " + JSON.stringify(r.j));
  r = await get(office, "");
  check(r.status === 400, "...and a GET naming no clip is refused", r.status);
  r = await post(office, { action: "nonsense" });
  check(r.status === 400, "an action the endpoint does not have is refused", r.status);

  /* ── 5 · a path names its subject, and the rules are the shared ones ── */
  console.log("\n5 · the path, and the two gates");
  /* THE COLON SURVIVES, because a supporting function's target IS `fn:<key>`
     and the path has to read back to it — `safe()` keeps `A-Za-z0-9._:-` and
     nothing else, byte for byte what the frozen endpoint kept. */
  const p = clipPath("fn:finance", "v1abc", "clip.MP4");
  check(p === "videos/fn:finance/v1abc.mp4", "a path is made of the target and the id", p);
  check(targetOfPath(p) === "fn:finance", "...and reads back to the target it was made from", targetOfPath(p));
  check(clipPath("a/b/../c", "x y", "z.mp4") === "videos/a-b-..-c/x-y.mp4",
    "...with anything else in either part made safe", clipPath("a/b/../c", "x y", "z.mp4"));
  check(targetOfPath("etc/passwd") === "" && targetOfPath(null) === "",
    "...while anything that is not one names nothing", targetOfPath("etc/passwd"));

  const state = await withTenant(tenantId, (c) => readState(c));
  const w = R.worldOf(state);
  const person = (k) => state.people.find((x) => x.key === k);
  /* §261.5: `grantIn` answers with a WORD, and "none" is truthy. */
  const noneAt = state.people.filter((x) => R.grantIn(w, x, "unit", "mobile") === "none")[0];
  check(!!noneAt, "the tenant holds somebody whose grant on Mobile is the WORD 'none'", noneAt && noneAt.key);
  if (noneAt) check(mayWatch(w, noneAt, "mobile") === false,
    "...and they cannot watch Mobile's clips — the fault §261.5 records", R.grantIn(w, noneAt, "unit", "mobile"));
  check(mayWatch(w, person("smo"), "mobile") === true, "the office can watch");
  check(maySpeakFor(w, person("smo"), "mobile") === true, "the office can add one");
  const bounded = state.people.filter((x) => R.grantIn(w, x, "unit", "mobile") === "edit" &&
    R.onlyOwnLines(w, x, "unit", "mobile"))[0];
  if (bounded) check(maySpeakFor(w, bounded, "mobile") === false,
    "somebody who edits only their own lines does not speak for the unit (§50, §53.5)", bounded.key);
  else ok("(no bounded editor on Mobile in this tenant — not measured)");
} finally {
  try { process.kill(-server.pid); } catch {}
  await owner.end();
}
console.log("\n" + (fails ? "RED " + fails + " of " + (oks + fails) : "GREEN " + oks + "/" + oks));
process.exit(fails ? 1 : 0);
