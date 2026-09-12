/* The state API, driven over HTTP against the built app (spec 043 Phase A).

   The six frozen harnesses' assertions — two tabs (§210/§215/§216/§234),
   eight concurrent saves (§240), a refusal that names its rows (§184), a
   view-as save judged as the viewed person (§185), the history read (§262)
   and the safety peek (§258) — re-run through the REAL route on a real
   Postgres, with the door's own sign-in in front of every request. Nothing
   is asserted as a literal that the seed could answer differently: every
   "survives" reads the graph back through the API and compares it with
   what was posted. Prints one line per property (§215) and ends RED/GREEN.

     DATABASE_URL_UNPOOLED=postgres://…/smp_dev node checks/state-api.mjs
     … --break=apply-on-base     (RED: a tab's own baseline is what the changes are laid over — the fault §210 closed)
     … --break=no-save-lock      (RED: saves no longer take turns — §240's lost update, on the review row)
     … --break=bare-refusal      (RED: a refusal names its reason and not its rows — §184's dead end)
     … --break=viewas-widens     (RED: view-as is judged as the SMO — §185's fault)
     … --break=log-for-all       (RED: everybody reads everybody's history — §262's one refusal)
     … --break=peek-includes-me  (RED: your own landing is news to you — §258)

   Needs `next build` first. Re-runnable: the dev tenant is REMADE at the start. */
import { spawn } from "node:child_process";
import { SCHEMA } from "../db/schema-name.mjs";   /* the shared schema is not `public` (§317.4) */
import { join } from "node:path";
import { createRequire } from "node:module";
import pg from "pg";
import { devTenant, DEV_PASSWORD } from "../scripts/dev-tenant.mjs";
import { hashPassword } from "../lib/auth.ts";
import { withTenant } from "../lib/tenant.ts";
import { readState } from "../lib/state-io.ts";

const URL_ = process.env.DATABASE_URL_UNPOOLED || "postgres://postgres:postgres@localhost:5432/smp_dev";
const PORT = 3978, BASE = "http://localhost:" + PORT, SLUG = "raya-trade";
const brk = (process.argv.find((a) => a.startsWith("--break=")) || "").slice(8);
const D = createRequire(import.meta.url)("../lib/graph-diff.cjs");
const clone = (o) => JSON.parse(JSON.stringify(o));
let oks = 0, fails = 0;
const ok = (l) => { oks++; console.log("ok    " + l); };
const fail = (l, m) => { fails++; console.log("FAIL  " + l + (m === undefined ? "" : " — " + String(m).slice(0, 220))); };
const check = (c, l, m) => (c ? ok(l) : fail(l, m));

/* ── the tenant, remade, and the logins this file needs beyond the dev four ── */
const { tenantId } = await devTenant({ url: URL_, log: () => {} });
const owner = new pg.Pool({ connectionString: URL_, max: 2, options: "-c search_path=" + SCHEMA });
const graph0 = await withTenant(tenantId, (c) => readState(c));
const mint = async (key, kind, isAdmin, seat) => {
  const p = graph0.people.find((x) => x.key === key);
  const email = key + "@raya.example";
  await owner.query("DELETE FROM users WHERE email = $1", [email]);
  const u = (await owner.query("INSERT INTO users (email, name, kind, is_admin, must_change, password_hash) VALUES ($1,$2,$3,$4,false,$5) RETURNING id",
    [email, p ? p.name : key, kind, isAdmin, hashPassword(DEV_PASSWORD)])).rows[0];
  if (key) await owner.query("INSERT INTO tenant_users (tenant_id, user_id, person_key, seat) VALUES ($1,$2,$3,$4)", [tenantId, u.id, key, seat]);
  return email;
};
await mint("own_ret", "client", false, "none");
await mint("cfo", "client", false, "none");
await owner.query("DELETE FROM login_attempts");

const server = spawn("npx", ["next", "start", "-p", String(PORT)], {
  cwd: join(import.meta.dirname, ".."),
  env: { ...process.env, DATABASE_URL_UNPOOLED: URL_, SMP_BREAK: brk },
  stdio: ["ignore", "pipe", "pipe"], detached: true,
});
server.stdout.on("data", () => {}); server.stderr.on("data", (d) => process.stderr.write(d));
let up = false;
for (let i = 0; i < 60 && !up; i++) { await new Promise((r) => setTimeout(r, 500)); try { up = (await fetch(BASE + "/")).status === 200; } catch {} }
if (!up) { console.log("FAIL  the app did not start"); process.kill(-server.pid); process.exit(1); }

/* ── the door in front of every request ── */
async function signIn(email, pw = DEV_PASSWORD) {
  const r = await fetch(BASE + "/api/auth/sign-in", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ email, password: pw }) });
  const cookie = (r.headers.get("set-cookie") || "").split(";")[0];
  return { cookie, status: r.status, j: await r.json().catch(() => null) };
}
const api = async (cookie, method, q = "", body, slug = SLUG) => {
  const r = await fetch(BASE + "/api/" + slug + "/state" + q, {
    method, headers: { ...(cookie ? { cookie } : {}), ...(body ? { "content-type": "application/json" } : {}) },
    body: body ? JSON.stringify(body) : undefined,
  });
  let j = null; try { j = await r.json(); } catch {}
  return { status: r.status, j };
};
const get = (cookie, q) => api(cookie, "GET", q);
const post = (cookie, body) => api(cookie, "POST", "", body);
const graph = async (cookie) => (await get(cookie)).j.state;
const changed = (base, edit) => { const m = clone(base); edit(m); return { m, changes: D.graphChanges(base, m) }; };

async function section(name, fn) {
  console.log("── " + name);
  try { await fn(); } catch (e) { fail(name + " — the section died rather than reporting (§215)", e && e.stack ? e.stack.split("\n").slice(0, 2).join(" ") : e); }
}
const smo = (await signIn("office@forefront.example")).cookie;
const mob = (await signIn("mobhead@raya.example")).cookie;
const fin = (await signIn("fn_fin@raya.example")).cookie;
const ret = (await signIn("own_ret@raya.example")).cookie;
const cfo = (await signIn("cfo@raya.example")).cookie;

await section("0 · the guards", async () => {
  let r = await get("");
  check(r.status === 401 && r.j && r.j.auth === true, "no session: 401, and the shell is told it is the session (auth)", r.status);
  const temp = await signIn("own_mob@raya.example", "Temp-2026!");
  check(temp.status === 200 && temp.j && temp.j.mustChange === true, "a temporary password signs in and says mustChange", temp.status);
  r = await get(temp.cookie);
  check(r.status === 403 && r.j && r.j.mustChange === true && r.j.auth === true, "…and the state is refused until a password is chosen (§43.2)", r.status + " " + JSON.stringify(r.j));
  r = await post(temp.cookie, { changes: [] });
  check(r.status === 403 && r.j && r.j.mustChange === true, "…a save too", r.status);
  const a = await get(mob, "", undefined), b = await api(mob, "GET", "", undefined, "no-such-client"), c2 = await api(mob, "GET", "", undefined, "demo");
  check(a.status === 200, "a client's own person reads their client", a.status);
  check(b.status === 404 && c2.status === 404 && JSON.stringify(b.j) === JSON.stringify(c2.j), "a client that does not exist and one that is not theirs answer IDENTICALLY (§313)", b.status + "/" + c2.status + " " + JSON.stringify(b.j) + " " + JSON.stringify(c2.j));
  r = await post(mob, { state: graph0 });
  check(r.status === 400, "a whole graph is not a save (400)", r.status);
  r = await post(mob, { changes: { set: { "nowhere.at.all": 1 } } });
  check(r.status === 400, "a path the server does not understand is refused, never guessed at (§210)", r.status + " " + JSON.stringify(r.j));
  r = await post(mob, { changes: [{ path: "x", set: 1 }] });
  check(r.status === 400, "…and a list that is not §210's shape is refused rather than applied as nothing", r.status + " " + JSON.stringify(r.j));
});

await section("1 · the graph, the person, and the office on the register", async () => {
  const r = await get(mob);
  check(r.status === 200 && r.j.ok && r.j.state && r.j.person, "GET answers the graph and the person");
  const direct = await withTenant(tenantId, (c) => readState(c));
  check(JSON.stringify(r.j.state) === JSON.stringify(direct), "the graph over HTTP IS readState's graph, byte for byte (agreement, never a literal)");
  const p = r.j.person;
  check(p.key === "mobhead" && p.role === "" && p.kind === "client" && p.cards === false && p.clientName === "Raya Trade" && p.mustChange === false && p.email === "mobhead@raya.example",
    "a client's person: their register key, no seat, no cards, the client's name", JSON.stringify(p));
  const s = (await get(smo)).j.person;
  check(s.key === "smo" && s.role === "super" && s.kind === "office" && s.cards === true, "the office's person: the seat as role, and cards to go back to", JSON.stringify(s));
  /* an admin with no membership arrives on a register the platform built (§313.30) */
  await owner.query("DELETE FROM users WHERE email = 'ffadmin@raya.example'");
  await owner.query("INSERT INTO users (email, name, kind, is_admin, must_change, password_hash) VALUES ('ffadmin@raya.example','Islam S.','office',true,false,$1)", [hashPassword(DEV_PASSWORD)]);
  const adm = (await signIn("ffadmin@raya.example")).cookie;
  let a = await get(adm);
  const row = (await owner.query("SELECT key, role, extra FROM people WHERE tenant_id = $1 AND key = $2", [tenantId, "ff_ffadmin"])).rows[0];
  /* REWRITTEN, never loosened (§218). This asserted a TEAM row, because a
     client could hold only one super user — and §313.26 (two super users)
     was put back on the frozen product before the schema heard: the unique
     index is dropped (migration 001), so the row a minted office person gets
     FOLLOWS THE SEAT, and an admin holding none is the Super user by rule
     (door.ts's seatFor). The marks are asserted exactly as before. */
  check(a.status === 200 && a.j.person.key === "ff_ffadmin" && a.j.person.role === "super" && row && row.role === "super" && row.extra.ffrow === true && row.extra.forefront === true,
    "an admin holding no seat acts as the Super user and the row minted for them says so — marked as the platform's (§313.30, §313.26)", a.status + " " + JSON.stringify(a.j && a.j.person) + " " + JSON.stringify(row));
  const m = (await owner.query("SELECT 1 FROM tenant_users m JOIN users u ON u.id = m.user_id WHERE u.email = 'ffadmin@raya.example' AND m.tenant_id = $1", [tenantId])).rowCount;
  check(!m, "…and NO membership is written — the seat is the door's rule, and the client keeps ONE super (§313.4)", m);
  a = await get(adm);
  const rows = (await owner.query("SELECT count(*)::int AS n FROM people WHERE tenant_id = $1 AND extra->>'email' = 'ffadmin@raya.example'", [tenantId])).rows[0].n;
  check(a.status === 200 && a.j.person.key === "ff_ffadmin" && rows === 1, "…the second read finds them by their address, and mints nothing (§313.32)", a.status + " " + rows);
  /* the row the platform DID NOT mint is adopted, never rewritten (§313.29) */
  const before = (await owner.query("SELECT name, role FROM people WHERE tenant_id = $1 AND key = 'smo'", [tenantId])).rows[0];
  await get(smo);
  const after = (await owner.query("SELECT name, role, extra FROM people WHERE tenant_id = $1 AND key = 'smo'", [tenantId])).rows[0];
  check(after.name === before.name && after.role === before.role && after.extra.forefront === true && !after.extra.ffrow,
    "the office's own row on the client's register keeps its name and role, marked forefront and never ffrow (§313.29)", JSON.stringify(after));
  /* on a client that brought its own register, nobody is invented (§313.32) */
  await owner.query("UPDATE tenants SET made_here = false WHERE id = $1", [tenantId]);
  await owner.query("DELETE FROM users WHERE email = 'ff2@raya.example'");
  const u2 = (await owner.query("INSERT INTO users (email, name, kind, is_admin, must_change, password_hash) VALUES ('ff2@raya.example','Second Admin','office',true,false,$1) RETURNING id", [hashPassword(DEV_PASSWORD)])).rows[0];
  const adm2 = (await signIn("ff2@raya.example")).cookie;
  a = await get(adm2);
  const none = (await owner.query("SELECT 1 FROM people WHERE tenant_id = $1 AND key = 'ff_ff2'", [tenantId])).rowCount;
  check(a.status === 404 && !none && /not on this client's register/.test(a.j.error), "…an admin nobody placed on a client that brought its own register is told so and NOT invented (§313.32)", a.status + " " + JSON.stringify(a.j));
  /* …but the register places them by email (§313.32) */
  await owner.query("UPDATE people SET extra = extra || '{\"email\":\"ff2@raya.example\"}' WHERE tenant_id = $1 AND key = 'cfo'", [tenantId]);
  a = await get(adm2);
  check(a.status === 200 && a.j.person.key === "cfo", "…and an address the register holds places them on that row", a.status + " " + JSON.stringify(a.j && a.j.person));
  await owner.query("UPDATE tenants SET made_here = true WHERE id = $1", [tenantId]);
  await owner.query("DELETE FROM tenant_users WHERE user_id = $1", [u2.id]);
  await owner.query("UPDATE people SET extra = extra - 'email' WHERE tenant_id = $1 AND key = 'cfo'", [tenantId]);
});

await section("2 · two tabs, one database (§210 · §215 · §216 · §234)", async () => {
  /* Ahmed's tab opens; the office then changes three things; his stale tab saves */
  const his = await graph(mob);
  let base = await graph(smo);
  let e = changed(base, (m) => { m.units.mobile.aspiration = "THE OFFICE'S ASPIRATION " + Date.now(); m.people.find((p) => p.key === "mobhead").name = "Ashraf L."; m.review.note.mobile = "the office's note"; });
  let r = await post(smo, { changes: e.changes });
  check(r.status === 200, "the office's own save is accepted", r.status + " " + JSON.stringify(r.j));
  const offAsp = e.m.units.mobile.aspiration;
  e = changed(his, (m) => { m.units.mobile.items[0].tactics[0].actual = 77; });
  check(D.countChanges(e.changes) === 1, "his save carries " + D.countChanges(e.changes) + " part, not the whole graph", D.countChanges(e.changes));
  r = await post(mob, { base: his, changes: e.changes });
  check(r.status === 200, "his save is accepted", r.status + " " + JSON.stringify(r.j));
  let after = await graph(smo);
  check(after.units.mobile.items[0].tactics[0].actual === 77, "his own change landed", after.units.mobile.items[0].tactics[0].actual);
  check(after.units.mobile.aspiration === offAsp, "the office's aspiration SURVIVES his stale tab", after.units.mobile.aspiration);
  check(after.people.find((p) => p.key === "mobhead").name === "Ashraf L.", "the office's register rename SURVIVES");
  check(after.review.note.mobile === "the office's note", "the office's cycle note SURVIVES", after.review.note.mobile);
  /* a change by somebody who may not author it — refused, naming ONLY their own unit */
  const cb = await graph(cfo);
  e = changed(cb, (m) => { m.units.mobile.items[0].measures[0].target = "55%"; });
  r = await post(cfo, { changes: e.changes });
  check(r.status === 403, "a plan change by somebody who may not author it is refused", r.status);
  check(r.j && r.j.refusals && r.j.refusals.length === 1 && /mobile|Mobile/.test(r.j.refusals[0]), "…and the refusal names ONLY that unit", JSON.stringify(r.j && r.j.refusals));
  /* §215: two people fill the SAME unit from one baseline */
  const t0 = await graph(smo);
  const o1 = changed(t0, (m) => { m.units.mobile.items[0].measures[0].target = "2%"; });
  const o2 = changed(t0, (m) => { m.units.mobile.items[0].measures[1].target = "91%"; });
  const r1 = await post(smo, { changes: o1.changes }), r2 = await post(smo, { base: t0, changes: o2.changes });
  check(r1.status === 200 && r2.status === 200, "§215: both saves on the SAME unit were accepted", r1.status + "/" + r2.status);
  after = await graph(smo);
  check(after.units.mobile.items[0].measures[0].target === "2%" && after.units.mobile.items[0].measures[1].target === "91%", "§215: the first fill SURVIVES the second's save, and the second landed too");
  /* §216, ADDRESSED WHERE THE PROJECTS NOW ARE (§322, §329): a milestone
     reported on CARE's own project from a stale tab, while FINANCE's
     definition is edited in between. This named `cap5` and `cap7` — every
     project in the tenant sat inside a capability until §322 gave them to the
     function, and the worked example ships none since §329, so both lookups
     answered `undefined`. The claim has not changed and is the stronger one
     for being asked of the shape every client is actually in. */
  const hers = await graph(smo);
  base = await graph(smo);
  e = changed(base, (m) => { m.functions.finance.def = "FINANCE'S NEW DEFINITION"; });
  r = await post(smo, { changes: e.changes });
  check(r.status === 200, "§216: the office edits another function's definition", r.status);
  e = changed(hers, (m) => { m.functions.care.projects[0].milestones[0].status = "wip"; m.functions.care.projects[0].milestones[0].pct = 40; });
  /* THE ADDRESSES, NOT A QUOTED SPELLING (§94.8). This asked `/"care"/` of the
     stringified list, and §322 moved her report from a capability under the
     group to the FUNCTION — where the address reads `functions.care`, so the
     quote before the word is not there and the assertion could never match.
     The claim is unchanged and is now asked of the thing it is about: every
     row addressed at her function, and NO whole-part set or del, which is
     what §216 is for — a stale tab must not carry another function's plan. */
  const named = JSON.stringify(e.changes);
  const rowsAt = (e.changes.rows || []).map((x) => x.at);
  check(rowsAt.length > 0 && rowsAt.every((a) => a === "functions.care")
        && Object.keys(e.changes.set || {}).length === 0 && (e.changes.del || []).length === 0,
        "§216: her change list names her function and no other", named.slice(0, 200));
  r = await post(smo, { base: hers, changes: e.changes });
  after = await graph(smo);
  check(r.status === 200 && after.functions.care.projects[0].milestones[0].pct === 40, "§216: her report landed", r.status);
  check(after.functions.finance.def === "FINANCE'S NEW DEFINITION", "§216: …and the other function's work survives her stale tab", after.functions.finance.def);
  /* §234: one unit's submit does not carry everybody's report state */
  const stale = await graph(smo);
  e = changed(await graph(smo), (m) => { delete m.review.submitted.retailstores; });
  r = await post(smo, { changes: e.changes });
  check(r.status === 200 && !(await graph(smo)).review.submitted.retailstores, "§234: the office reopens Retail", r.status);
  e = changed(stale, (m) => { m.review.submitted.mobile = true; });
  check(Object.keys(e.changes.set).length === 1 && e.changes.set["review.submitted.mobile"] === true && !(e.changes.del || []).length && !(e.changes.rows || []).length, "§234: a submit travels as its own key", JSON.stringify(e.changes));
  r = await post(smo, { base: stale, changes: e.changes });
  after = await graph(smo);
  check(r.status === 200 && after.review.submitted.mobile === true, "§234: the submit landed", r.status);
  check(!after.review.submitted.retailstores, "§234: …and Retail's reopen SURVIVES the stale tab", JSON.stringify(after.review.submitted));
});

await section("3 · eight saves at once take turns (§240)", async () => {
  const base = await graph(smo);
  const units = base.unitKeys.slice(0, 8);
  check(units.length === 8, "the seed has eight units to test with", units.length);
  const posts = units.map((u) => { const e = changed(base, (m) => { m.review.note[u] = "at once " + u; }); return post(smo, { changes: e.changes }); });
  const rs = await Promise.all(posts);
  const accepted = rs.filter((r) => r.status === 200).length;
  check(accepted === 8, "every concurrent save was accepted (" + accepted + "/8)", rs.map((r) => r.status + " " + JSON.stringify(r.j).slice(0, 60)).join(" | "));
  const after = await graph(smo);
  const survived = units.filter((u) => after.review.note[u] === "at once " + u);
  check(survived.length === 8, "all 8 concurrent changes survived — none lost (" + survived.length + "/8)", units.filter((u) => survived.indexOf(u) < 0).join(","));
});

await section("4 · a refusal names its rows, and costs only them (§184)", async () => {
  /* the custodian is given Fill gaps on their own unit's strategy — the office's to grant (§145) */
  let base = await graph(smo);
  let e = changed(base, (m) => { m.access.custodian.a_unit_own_strat = "fill"; });
  let r = await post(smo, { changes: e.changes });
  check(r.status === 200, "the office grants the custodian Fill gaps", r.status + " " + JSON.stringify(r.j));
  await owner.query("UPDATE users SET must_change = false, password_hash = $1 WHERE email = 'own_mob@raya.example'", [hashPassword(DEV_PASSWORD)]);
  const cust = (await signIn("own_mob@raya.example")).cookie;
  base = await graph(cust);
  const T = base.units.mobile.items[0].tactics;
  const blank = T.find((t) => !t.outcome), held = T.find((t) => t.owner);
  check(!!blank && !!held, "the seed holds a tactic with no outcome and one with an owner", JSON.stringify([blank && blank.id, held && held.id]));
  const stamp = { by: "own_mob", at: new Date().toISOString() };
  e = changed(base, (m) => { const tt = m.units.mobile.items[0].tactics; const b = tt.find((t) => t.id === blank.id); b.outcome = "A FILLED OUTCOME"; b.pend = { outcome: stamp }; tt.find((t) => t.id === held.id).owner = "Somebody Else"; });
  r = await post(cust, { changes: e.changes });
  check(r.status === 403 && r.j && r.j.refused === true, "one amended row among the fills: the save is refused", r.status + " " + JSON.stringify(r.j).slice(0, 160));
  const rc = r.j && r.j.refusedChanges && r.j.refusedChanges[0];
  check(rc && rc.rows && rc.rows.length === 1 && rc.rows[0].id === held.id && rc.rows[0].field === "owner" && rc.rows[0].had === true && rc.rows[0].from === held.owner && rc.rows[0].name === held.name,
    "…and the verdict NAMES the row, the field and what it held (§184)", JSON.stringify(rc));
  check(r.j.undoable === true, "…so a put-back can be offered (undoable)", r.j.undoable);
  let after = await graph(smo);
  check(!after.units.mobile.items[0].tactics.find((t) => t.id === blank.id).outcome, "nothing of it was written — the good fill waits with the bad", after.units.mobile.items[0].tactics.find((t) => t.id === blank.id).outcome);
  e = changed(base, (m) => { const b = m.units.mobile.items[0].tactics.find((t) => t.id === blank.id); b.outcome = "A FILLED OUTCOME"; b.pend = { outcome: stamp }; });
  r = await post(cust, { changes: e.changes });
  after = await graph(smo);
  const filled = after.units.mobile.items[0].tactics.find((t) => t.id === blank.id);
  check(r.status === 200 && filled.outcome === "A FILLED OUTCOME" && filled.pend && filled.pend.outcome && filled.pend.outcome.by === "own_mob",
    "the fill alone is accepted, and lands PENDING under the filler's mark (§145)", r.status + " " + JSON.stringify(filled.pend));
  /* a refusal nothing can put back offers no button (§184) */
  base = await graph(cust);
  e = changed(base, (m) => { m.units.mobile.items[0].tactics.splice(0, 1); });
  r = await post(cust, { changes: e.changes });
  check(r.status === 403 && r.j.undoable === false, "removing a row is refused with NO put-back — there is no row to put back", r.status + " " + (r.j && r.j.undoable));
});

await section("5 · viewing as somebody is judged as somebody (§185)", async () => {
  let base = await graph(smo);
  let e = changed(base, (m) => { m.units.mobile.items[0].measures[0].name = "RENAMED THROUGH A VIEW"; });
  let r = await post(smo, { viewAs: "own_mob", changes: e.changes });
  check(r.status === 403 && r.j.judgedAs && r.j.judgedAs.key === "own_mob", "the SMO renaming a measure through the custodian's view is REFUSED, and told who it was judged as", r.status + " " + JSON.stringify(r.j && r.j.judgedAs));
  check((await graph(smo)).units.mobile.items[0].measures[0].name !== "RENAMED THROUGH A VIEW", "…and nothing was written");
  base = await graph(smo);
  e = changed(base, (m) => { m.units.mobile.items[0].measures[0].actual = "1.9%"; });
  r = await post(smo, { viewAs: "own_mob", changes: e.changes });
  check(r.status === 200, "a figure the custodian may report is accepted through their view", r.status + " " + JSON.stringify(r.j).slice(0, 120));
  const log = (await owner.query("SELECT person_key, email FROM change_log WHERE tenant_id = $1 ORDER BY id DESC LIMIT 1", [tenantId])).rows[0];
  check(log && log.person_key === "smo" && log.email === "office@forefront.example", "…and the record names who SIGNED IN, never the simulation", JSON.stringify(log));
  r = await post(mob, { viewAs: "own_mob", changes: e.changes });
  check(r.status === 403 && /Only the SMO/.test(r.j.error), "somebody who is not the SMO cannot act through a view at all", r.status + " " + (r.j && r.j.error));
  r = await post(smo, { viewAs: "nobody-here", changes: e.changes });
  check(r.status === 403, "a view of somebody the register does not hold is refused", r.status);
});

await section("6 · history is read filtered, and only by who may (§262)", async () => {
  const t0 = (await owner.query("SELECT now() AS t")).rows[0].t.toISOString();
  const cust = (await signIn("own_mob@raya.example")).cookie;
  let base = await graph(smo), e = changed(base, (m) => { m.units.mobile.items[0].measures[0].target = "4.2B EGP"; });
  let r = await post(smo, { changes: e.changes }); check(r.status === 200, "the office corrects a Mobile target", r.status);
  base = await graph(cust); e = changed(base, (m) => { m.units.mobile.items[0].tactics[0].actual = 60; });
  r = await post(cust, { changes: e.changes }); check(r.status === 200, "Mobile's custodian reports a figure", r.status + " " + JSON.stringify(r.j).slice(0, 120));
  base = await graph(smo); e = changed(base, (m) => { m.units.retailstores.items[0].measures[0].target = "9 %"; });
  r = await post(smo, { changes: e.changes }); check(r.status === 200, "the office corrects a Retail target", r.status);
  base = await graph(smo); const asp0 = base.units.mobile.aspiration; e = changed(base, (m) => { m.units.mobile.aspiration = "PEEK-WORDS " + Date.now(); });
  r = await post(smo, { changes: e.changes }); check(r.status === 200, "the office rewrites Mobile's aspiration", r.status);
  r = await get(smo, "?log=1&from=" + encodeURIComponent(t0));
  check(r.status === 200 && r.j.office === true && r.j.log.length >= 4, "everything since the start, for the office", r.status + " " + (r.j && r.j.log && r.j.log.length));
  const L = r.j.log;
  check(L[0].target === "mobile" && L.every((x, i) => i === 0 || Date.parse(x.at) <= Date.parse(L[i - 1].at)), "…most recent first", L.map((x) => x.target + "@" + x.at).join(","));
  check(L.every((x) => x.person_key && x.at && x.kind && x.target && x.what), "…each row carrying who, when, place and what", JSON.stringify(L[0]));
  const fm = L[0].rows_ && L[0].rows_.moved && L[0].rows_.moved[0];
  check(fm && fm.id === "mobile" && fm.field === "aspiration" && fm.from === asp0 && fm.to === e.m.units.mobile.aspiration, "…the unit's own words logged with from AND to (§262.3)", JSON.stringify(fm));
  check(!r.j.state, "…and no state graph rides along");
  r = await get(smo, "?log=1&from=" + encodeURIComponent(t0) + "&target=mobile");
  check(r.j.log.length >= 3 && r.j.log.every((x) => x.target === "mobile"), "by place: Mobile's", r.j.log.length);
  r = await get(smo, "?log=1&from=" + encodeURIComponent(t0) + "&person=own_mob");
  check(r.j.log.length === 1 && r.j.log[0].person_key === "own_mob", "by person: the custodian's one", r.j.log.length);
  r = await get(smo, "?log=1&from=" + encodeURIComponent(t0) + "&kind=unitReporting");
  check(r.j.log.length === 1 && r.j.log[0].kind === "unitReporting", "by kind: the one figure", r.j.log.length);
  const t1 = (await owner.query("SELECT now() AS t")).rows[0].t.toISOString();
  r = await get(smo, "?log=1&from=" + encodeURIComponent(t1));
  check(r.j.log.length === 0, "a window after everything: empty", r.j.log.length);
  r = await get(smo, "?log=1&limit=2");
  check(r.j.log.length === 2, "the cap holds", r.j.log.length);
  r = await get(smo, "?log=1&limit=99999"); check(r.status === 200 && r.j.log.length <= 500, "…and is never above 500");
  r = await get(cust, "?log=1&from=" + encodeURIComponent(t0) + "&target=mobile");
  check(r.status === 200 && r.j.office === false && r.j.log.length >= 3, "Mobile's custodian reads Mobile", r.status + " " + (r.j && r.j.log && r.j.log.length));
  r = await get(cust, "?log=1&target=retailstores"); check(r.status === 403, "…and not Retail (403)", r.status);
  r = await get(cust, "?log=1"); check(r.status === 403, "…and not everything (403)", r.status);
  r = await get(ret, "?log=1&from=" + encodeURIComponent(t0) + "&target=retailstores"); check(r.status === 200 && r.j.log.length === 1, "Retail's custodian reads Retail", r.status + " " + (r.j && r.j.log && r.j.log.length));
  r = await get("", "?log=1"); check(r.status === 401, "no session, no history (401)", r.status);
});

await section("7 · the page asks who else landed a change on it (§258)", async () => {
  const cust = (await signIn("own_mob@raya.example")).cookie;
  const t0 = (await owner.query("SELECT now() AS t")).rows[0].t.toISOString();
  let r = await get(cust, "?since=" + encodeURIComponent(t0) + "&target=mobile");
  check(r.status === 200 && Array.isArray(r.j.changed) && r.j.changed.length === 0 && !r.j.state, "nothing yet: an empty list, and no graph (a peek is light)", JSON.stringify(r.j).slice(0, 120));
  const base = await graph(smo), e = changed(base, (m) => { m.units.mobile.items[0].measures[0].target = "7%"; });
  r = await post(smo, { changes: e.changes }); check(r.status === 200, "the office lands a change on Mobile", r.status);
  r = await get(cust, "?since=" + encodeURIComponent(t0) + "&target=mobile");
  check(r.j.changed.length === 1 && r.j.changed[0].by === "Mohamed Essam" && !isNaN(Date.parse(r.j.changed[0].at)), "somebody else asking about that page is told WHO and WHEN", JSON.stringify(r.j.changed));
  r = await get(smo, "?since=" + encodeURIComponent(t0) + "&target=mobile");
  check(r.j.changed.length === 0, "the asker's own landing is not news to them", JSON.stringify(r.j.changed));
  r = await get(cust, "?since=" + encodeURIComponent(t0) + "&target=retailstores");
  check(r.j.changed.length === 0, "another page's asker is told nothing", JSON.stringify(r.j.changed));
  const t1 = (await owner.query("SELECT now() AS t")).rows[0].t.toISOString();
  r = await get(cust, "?since=" + encodeURIComponent(t1) + "&target=mobile");
  check(r.j.changed.length === 0, "asking from AFTER the landing is told nothing", JSON.stringify(r.j.changed));
  const fb = await graph(fin), fe = changed(fb, (m) => { m.functions.finance.projects[0].milestones[0].status = "wip"; m.functions.finance.projects[0].milestones[0].pct = 25; });
  r = await post(fin, { changes: fe.changes }); check(r.status === 200, "a function's head reports on its own project", r.status + " " + JSON.stringify(r.j).slice(0, 120));
  r = await get(cust, "?since=" + encodeURIComponent(t0) + "&target=fn:finance");
  check(r.j.changed.length >= 1, "a peek on the function's page is told, as fn:<key>", JSON.stringify(r.j.changed));
  const dbNow = Date.parse((await owner.query("SELECT now() AS t")).rows[0].t.toISOString());
  r = await get(cust, "?since=" + encodeURIComponent(t0) + "&target=mobile&sync=1");
  check(r.status === 200 && r.j.now && Math.abs(Date.parse(r.j.now) - dbNow) < 5000 && r.j.changed.length === 0 && !r.j.state, "a sync answers the DATABASE's clock and no changes", JSON.stringify(r.j));
  r = await get(cust, "?since=not-a-date&target=mobile"); check(r.status === 200 && r.j.state && !r.j.changed, "an unreadable since falls through to the full read", r.status);
  r = await get(cust, "?since=" + encodeURIComponent(t0)); check(r.status === 200 && r.j.state && !r.j.changed, "since without a target falls through to the full read", r.status);
  r = await get("", "?since=" + encodeURIComponent(t0) + "&target=mobile"); check(r.status === 401, "no session, no peek (401)", r.status);
});

await section("8 · a new cycle carries no quarter, and saves (§316.3)", async () => {
  /* Islam, in his own words: "Open a new cycle" looked like it worked and the
     change never saved. §307 took the review point off that panel, so the mint
     carries NO `endsQuarter` at all — and the column was NOT NULL, so the save
     was refused and the cycle never left the browser. Proved on the FROZEN
     writer first (§303), so it is a live defect on main rather than the port's.

     ASSERTED AS THE MINT'S OWN SHAPE, never as a column's nullability: what
     must hold is that the review openNewCycle produces is one this server
     accepts and hands back. A build that put the constraint back fails here. */
  const base = await graph(smo);
  const e = changed(base, (m) => {
    const rv = { name: "H2 2026", from: "Jul 2026", to: "Dec 2026", due: "",
                 state: "open", note: {}, submitted: {}, cadence: m.review.cadence };
    m.review = rv;                       /* exactly what shell.html mints */
  });
  let r = await post(smo, { changes: e.changes });
  check(r.status === 200, "a review with no endsQuarter is accepted", r.status + " " + JSON.stringify(r.j).slice(0, 160));
  const back = await graph(smo);
  check(back.review.name === "H2 2026", "…and the new cycle is what comes back", back.review && back.review.name);
  check(back.review.endsQuarter == null, "…with the quarter ABSENT, not invented (§50.6)", JSON.stringify(back.review.endsQuarter));
  /* BOTH ENDS (§94.2): a tenant that HOLDS a quarter keeps it — the DEFAULT
     stays, so this is a value the platform may still carry, never one it
     rewrites. */
  const e2 = changed(back, (m) => { m.review.endsQuarter = 3; });
  r = await post(smo, { changes: e2.changes });
  const back2 = await graph(smo);
  check(r.status === 200 && back2.review.endsQuarter === 3, "…and a quarter that IS set still round-trips", r.status + " " + JSON.stringify(back2.review.endsQuarter));
});

try { process.kill(-server.pid); } catch {}
await owner.end();
console.log((fails ? "RED   " : "GREEN ") + oks + " ok, " + fails + " failed" + (brk ? "  (--break=" + brk + ")" : ""));
process.exit(fails ? 1 : 0);
