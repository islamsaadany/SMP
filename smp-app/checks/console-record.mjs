/* A RECORD OF WHAT FOREFRONT HAS DONE, AND THE PAGE THAT READS IT (§487).

   Islam, of the rules audit's fix 04: *"let's do the recording on console"* —
   then, of the drawing, *"the console record should sit as a separate page as
   history, ok for the acts and opened a client is not really important."*

   `tenant_log` has existed since the rebuild with NO WRITER anywhere in the
   product: its only references were two checks counting its rows as a
   control. Every act arrives at ONE door (platformAction), so the record is
   a call at each act rather than a change to fourteen screens.

     DATABASE_URL_UNPOOLED=postgres://…/smp_dev node checks/console-record.mjs
     … --break=no-record    (RED: the acts happen and nothing is recorded)
     … --break=history-all  (RED: the record shows a client you cannot open)

   NO BROWSER (§94.11 does not apply to §2–§3 — the subject is a door and a
   read): the acts are PRESSED through the real platformAction and read back
   from Postgres, never written by the check itself (§96 — a build whose door
   records nothing renders perfectly). §1 and §4 read the two sources for the
   claims only a reading can make. Every probe degrades rather than dying
   (§215), and the check sweeps its own leftovers before it starts. */
import { readFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { createRequire } from "node:module";
import pg from "pg";
import { applyAll } from "../db/apply.mjs";
import { SCHEMA } from "../db/schema-name.mjs";
import { withTenant } from "../lib/tenant.ts";
import { loadGraph } from "../lib/state-io.ts";
import { platformAction } from "../lib/platform-api.ts";

const require = createRequire(import.meta.url);
const frozen = require("../lib/frozen.cjs");
/* the platform's own rules, so the words in a recorded sentence are asserted
   through the one module that decides them rather than spelled here (§487.1) */
const FF = require("../lib/platform-rules.cjs");
const here = dirname(fileURLToPath(import.meta.url));
const URL_ = process.env.DATABASE_URL_UNPOOLED || "postgres://postgres:postgres@localhost:5432/smp_dev";
const brk = (process.argv.find((a) => a.startsWith("--break=")) || "").slice(8);
if (brk) process.env.SMP_BREAK = brk;
let oks = 0, fails = 0;
const ok = (l) => { oks++; console.log("  ok   " + l); };
const fail = (l, m) => { fails++; console.log("  FAIL " + l + (m === undefined ? "" : "  — " + String(m).slice(0, 220))); };
const check = (c, l, m) => (c ? ok(l) : fail(l, m));
const say = (s) => console.log("\n── " + s);

const API = readFileSync(join(here, "..", "lib", "platform-api.ts"), "utf8");
const PAGE = readFileSync(join(here, "..", "..", "platform.html"), "utf8");

/* the acts Islam signed off, in the drawing's own order
   (design-mockups/console-record/2026-10-04_what-forefront-has-done.html).
   THE LAST FOUR ARE §487.1's, added on his word — §487 flagged them in its
   own code and left them off because *proceed* had not reached them, so this
   list grew rather than being loosened (§218): all four change what somebody
   can REACH, and the admin flag hands over every column of Who sees what at
   once. ASSERTED AS A SET, never a count, so adding one here is what reddens
   the file until its door records it (§94.8). */
const ACTS = [
  ["client.made", "Made a client"],
  ["client.archived", "Archived a client"], ["client.restored", "or brought one back"],
  ["client.deleted", "Deleted a client"],
  ["client.renamed", "Renamed one"], ["client.mark", "or changed its mark"],
  ["client.shape", "Set its shape"],
  ["module.on", "Turned a module on"], ["module.off", "or off"],
  ["team.on", "Put somebody on a client's team"], ["team.off", "or took them off"],
  ["team.seat", "Gave or moved the super user seat"],
  ["consultant.added", "Added a consultant"], ["consultant.removed", "or removed one"],
  ["consultant.retired", "retired"], ["consultant.restored", "or restored"],
  ["password.issued", "Handed out a password"],
  ["report.published", "Published a report"], ["report.withdrawn", "or withdrew one"],
  ["access.set", "Changed Who sees what"],
  ["consultant.admin", "Gave or took the admin flag"],
  ["consultant.renamed", "Renamed a consultant"], ["consultant.address", "or changed their address"],
];

/* ────────────────────────────────────────────────────────────────── §1 */
say("the shape of the record (no database)");

check((API.match(/async function logAct\(/g) || []).length === 1,
  "logAct is declared exactly once — one door, one line of writing (§53.5)");

/* IT CAN NEVER FAIL THE ACT IT RECORDS (§231.3): a helper degrades to no
   record, never to no feature — so the insert is inside a try and the catch
   writes to the log rather than throwing. A build whose logAct threw would
   turn every press in this console into "Something went wrong". */
const body = API.slice(API.indexOf("async function logAct("));
const logBody = body.slice(0, body.indexOf("\n}\n") + 3);
check(/try \{[\s\S]*INSERT INTO tenant_log[\s\S]*\} catch/.test(logBody),
  "and the insert is inside a try, so recording can never fail the act (§231.3)");
check(!/throw/.test(logBody), "and its catch does not re-throw");

/* every act is recorded somewhere, asserted as the SET rather than a count:
   a build that recorded nine of eleven satisfies any count at all (§94.8) */
const calls = [...API.matchAll(/logAct\(([\s\S]{0,300}?)\);/g)].map((m) => m[1]);
const keys = calls.flatMap((c) => [...c.matchAll(/"([a-z]+\.[a-z]+)"/g)].map((m) => m[1]));
const missing = ACTS.filter(([k]) => !keys.includes(k)).map(([k, w]) => k + " (" + w + ")");
check(missing.length === 0, "each of the acts Islam signed off is recorded at its own door", missing.join(", "));

/* OPENING A CLIENT IS DELIBERATELY NOT ONE (his: "not really important"), so
   nothing writes the table's own 'open' default and the read drops it —
   BOTH ENDS, or a build that recorded every page load passes above (§94.2) */
check(!keys.includes("client.open") && !/logAct\([^)]*"open"/.test(API),
  "opening a client is NOT recorded — his own call");
check(/what <> 'open'/.test(API), "and the read leaves any row carrying that default out");

/* THE PASSWORD VALUE IS NEVER ON A ROW. A record of who was handed one is
   the point; a record of what it was is a second place to read it from. */
const pwCall = API.slice(API.indexOf('"password.issued"'));
const pwArgs = pwCall.slice(0, pwCall.indexOf(");") + 2);
check(!/\bpw\b/.test(pwArgs), "the generated password is never passed to the record", pwArgs.slice(0, 120));

/* DELETING A CLIENT RECORDS BEFORE THE DELETE, with null for the tenant: the
   FK is ON DELETE SET NULL, so a row written after it would point at nothing
   and the record would not know which client went (§49.2). */
const del = API.slice(API.indexOf('if (action === "deleteClient")'));
const delBlock = del.slice(0, del.indexOf('if (action === "setModules")'));
const iLog = delBlock.indexOf('"client.deleted"'), iDrop = delBlock.indexOf("deleteTenant(");
check(iLog > 0 && iDrop > 0 && iLog < iDrop, "a deleted client is recorded BEFORE it goes", iLog + " / " + iDrop);
/* …and with the ROW, so the NAME lands. The FK clears the id a statement
   later either way, so passing null buys nothing and costs the one thing
   this row is for — which is how the check found it (§104.8). The end state
   is measured in §10; this is the source-level half. */
check(/logAct\(pool, account, row, "client.deleted"/.test(delBlock),
  "and with the row, so the client's name lands before the id is cleared");

/* THE NAMES AND THE SENTENCE ARE STORED, NOT RE-DERIVED. Both FKs are
   ON DELETE SET NULL and two of the acts destroy their own subject, so a
   record that joined for a name would go blank on exactly those rows. */
check(/who_name, tenant_name, detail/.test(API), "the row carries the names and the sentence");
check(!/JOIN\s+users|JOIN\s+tenants/i.test(API.slice(API.indexOf('action === "history"'), API.indexOf('action === "history"') + 1200)),
  "and the read takes them off the row rather than joining (§49.2)");

/* ────────────────────────────────────────────────────────────────── §2 */
say("the acts are written by the door, not by this check");

const KEY = "check-record";
const ADMIN = "record-admin@forefront.example";
const OUT = "record-outsider@forefront.example";
const IN_ = "record-inside@forefront.example";
const NEW_ = "record-new@forefront.example";

await applyAll(URL_, { appPassword: process.env.SMP_APP_PASSWORD || "smp_app", log: () => {} });
const owner = new pg.Client({ connectionString: URL_, options: "-c search_path=" + SCHEMA });
await owner.connect();

const q = async (sql, args) => (await owner.query(sql, args)).rows;
const sweep = async () => {
  await owner.query("DELETE FROM tenants WHERE key LIKE 'check-record%'");
  await owner.query("DELETE FROM users WHERE email LIKE 'record-%@forefront.example'");
  await owner.query("DELETE FROM tenant_log WHERE who_name LIKE 'Record %' OR tenant_name LIKE 'Record %'");
};

let tenantId = null;
try {
  await sweep();

  const mk = async (email, name, admin) => (await q(
    "INSERT INTO users (email, name, kind, is_admin, must_change, password_hash) " +
    "VALUES ($1,$2,'office',$3,false,'x') RETURNING id", [email, name, admin]))[0].id;
  const adminId = await mk(ADMIN, "Record Admin", true);
  const outId = await mk(OUT, "Record Outsider", false);
  const inId = await mk(IN_, "Record Insider", false);

  const sess = (id, email, name, isAdmin) => ({ id, email, name, kind: "office", isAdmin, mustChange: false });
  const AS_ADMIN = sess(adminId, ADMIN, "Record Admin", true);
  const AS_OUT = sess(outId, OUT, "Record Outsider", false);
  const AS_IN = sess(inId, IN_, "Record Insider", false);

  /* every act is a PRESS through the real door */
  const press = async (who, body) => {
    try { return await platformAction(owner, who, body); }
    catch (e) { return { code: 500, body: { ok: false, error: String(e && e.message) } }; }
  };
  /* …and every assertion reads the row back out of Postgres */
  const rows = async () => q("SELECT what, who_name, tenant_name, detail, tenant_id FROM tenant_log " +
    "WHERE who_name LIKE 'Record %' ORDER BY id");
  const since = async (n) => (await rows()).slice(n);
  const n = async () => (await rows()).length;

  /* ── 1. made ── */
  let was = await n();
  let a = await press(AS_ADMIN, { action: "createClient", name: "Record Client", key: KEY });
  check(a.code === 200, "a client is made", JSON.stringify(a.body).slice(0, 120));
  let got = await since(was);
  check(got.length === 1 && got[0].what === "client.made", "and the door recorded it once",
    JSON.stringify(got.map((r) => r.what)));
  check(got.length === 1 && got[0].who_name === "Record Admin" && got[0].tenant_name === "Record Client",
    "naming who did it and which client", got.length ? got[0].who_name + " / " + got[0].tenant_name : "none");
  check(got.length === 1 && /Record Client/.test(got[0].detail || ""),
    "with a sentence a person reads", got.length ? got[0].detail : "none");

  const t = (await q("SELECT id, key, name FROM tenants WHERE key = $1", [KEY]))[0];
  tenantId = t ? t.id : null;
  check(!!t, "the client is really there");

  /* ── 2. renamed, and a press that changes nothing ── */
  was = await n();
  await press(AS_ADMIN, { action: "saveClient", key: KEY, name: "Record Client" });
  check((await since(was)).length === 0, "a press that changes nothing records nothing",
    JSON.stringify((await since(was)).map((r) => r.what)));

  was = await n();
  await press(AS_ADMIN, { action: "saveClient", key: KEY, name: "Record Client Renamed" });
  got = await since(was);
  check(got.length === 1 && got[0].what === "client.renamed", "a rename is recorded",
    JSON.stringify(got.map((r) => r.what)));
  check(got.length === 1 && /Record Client Renamed/.test(got[0].detail || ""),
    "and the sentence says what it was renamed to", got.length ? got[0].detail : "none");

  /* ── 3. a module on, then off ── */
  was = await n();
  a = await press(AS_ADMIN, { action: "setModules", key: KEY, module: "tracker", on: true });
  check(a.code === 200, "a module is turned on", JSON.stringify(a.body).slice(0, 140));
  await press(AS_ADMIN, { action: "setModules", key: KEY, module: "tracker", on: false });
  got = await since(was);
  check(got.map((r) => r.what).join(",") === "module.on,module.off",
    "a module turned on and then off is two rows, the right way round",
    JSON.stringify(got.map((r) => r.what)));
  /* the module's own LABEL, read from MODULE_DEF rather than spelled here */
  check(got.length === 2 && /Internal Tracker/.test(got[0].detail || ""),
    "named by the module's own label", got.length ? got[0].detail : "none");

  /* ── 4. the team: on, seat moved, off ── */
  was = await n();
  a = await press(AS_ADMIN, { action: "setTeam", key: KEY, email: IN_, seat: "smoteam" });
  check(a.code === 200, "somebody joins the team", JSON.stringify(a.body).slice(0, 140));
  await press(AS_ADMIN, { action: "setTeam", key: KEY, email: IN_, seat: "super" });
  await press(AS_ADMIN, { action: "setTeam", key: KEY, email: IN_, seat: "super" });
  got = await since(was);
  check(got.map((r) => r.what).join(",") === "team.on,team.seat",
    "joining the team and moving the seat are two acts, and the third press records nothing",
    JSON.stringify(got.map((r) => r.what)));
  check(got.length === 2 && /Record Insider/.test(got[0].detail || "") && /super user/.test(got[1].detail || ""),
    "each naming the person and the seat", JSON.stringify(got.map((r) => r.detail)));

  /* ── 5. shape ── */
  was = await n();
  a = await press(AS_ADMIN, { action: "shapeClient", key: KEY,
    answers: { units: [{ name: "Alpha" }], functions: [{ name: "Ops" }], companies: [] } });
  got = await since(was);
  check(a.code !== 200 || (got.length === 1 && got[0].what === "client.shape"),
    "setting the shape is recorded, after the write has landed",
    a.code + " / " + JSON.stringify(got.map((r) => r.what)));

  /* ── 6. a password handed out ── */
  was = await n();
  a = await press(AS_ADMIN, { action: "issuePassword", email: IN_ });
  got = await since(was);
  const pw = a.body && (a.body.password || a.body.temp || a.body.pw);
  check(got.length === 1 && got[0].what === "password.issued", "handing out a password is recorded",
    JSON.stringify(got.map((r) => r.what)));
  check(!pw || !got.some((r) => String(r.detail).includes(String(pw))),
    "and the password is nowhere on the row", pw ? "found " + pw : "no password in the answer");

  /* ── 7. a consultant added, retired, restored, removed ── */
  was = await n();
  await press(AS_ADMIN, { action: "saveConsultant", email: NEW_, name: "Record Newcomer" });
  await press(AS_ADMIN, { action: "saveConsultant", email: NEW_, status: "retired" });
  await press(AS_ADMIN, { action: "saveConsultant", email: NEW_, status: "active" });
  await press(AS_ADMIN, { action: "saveConsultant", email: NEW_, status: "retired" });
  a = await press(AS_ADMIN, { action: "deleteConsultant", email: NEW_ });
  check(a.code === 200, "and then removed", JSON.stringify(a.body).slice(0, 140));
  got = await since(was);
  check(got.map((r) => r.what).join(",") ===
    "consultant.added,consultant.retired,consultant.restored,consultant.retired,consultant.removed",
    "a consultant's whole life is recorded, retiring included (§338 — most people leave that way)",
    JSON.stringify(got.map((r) => r.what)));
  check(got.length > 0 && /Record Newcomer/.test(got[got.length - 1].detail || ""),
    "and the removal keeps their name, the account being gone",
    got.length ? got[got.length - 1].detail : "none");
  check(got.every((r) => r.tenant_name === ""), "a consultant's act names no client");

  /* ── 7b. the four §487 flagged and left (§487.1) — every one of them
     changes what somebody can REACH, which is why they are here and why
     each compares before it writes. BOTH ENDS on all four: the press that
     changes nothing must record nothing, or the record fills with rows for
     acts nobody made and the page stops being worth reading (§94.2). */
  was = await n();
  /* the admin flag, pressed to the value it already holds */
  await press(AS_ADMIN, { action: "saveConsultant", email: IN_, isAdmin: false });
  check((await since(was)).length === 0, "setting the admin flag to what it already is records nothing",
    JSON.stringify((await since(was)).map((r) => r.what)));
  await press(AS_ADMIN, { action: "saveConsultant", email: IN_, isAdmin: true });
  await press(AS_ADMIN, { action: "saveConsultant", email: IN_, isAdmin: false });
  got = await since(was);
  check(got.map((r) => r.what).join(",") === "consultant.admin,consultant.admin",
    "giving the admin flag and taking it back are two acts",
    JSON.stringify(got.map((r) => r.what)));
  check(got.length === 2 && /^Gave Record Insider/.test(got[0].detail || "") &&
        /^Took the platform admin flag off Record Insider/.test(got[1].detail || ""),
    "and each says which way it went, by name",
    JSON.stringify(got.map((r) => r.detail)));

  /* the name */
  was = await n();
  await press(AS_ADMIN, { action: "saveConsultant", email: IN_, name: "Record Insider" });
  check((await since(was)).length === 0, "a press that re-types the same name records nothing",
    JSON.stringify((await since(was)).map((r) => r.what)));
  await press(AS_ADMIN, { action: "saveConsultant", email: IN_, name: "Record Insider Renamed" });
  got = await since(was);
  check(got.length === 1 && got[0].what === "consultant.renamed", "a rename is recorded",
    JSON.stringify(got.map((r) => r.what)));
  check(got.length === 1 && /Record Insider to Record Insider Renamed/.test(got[0].detail || ""),
    "and names what it was and what it became", got.length ? got[0].detail : "none");

  /* the address — the identity, so the row carries BOTH (§87) */
  was = await n();
  const MOVED = "record-moved@forefront.example";
  a = await press(AS_ADMIN, { action: "saveConsultant", email: IN_, newEmail: MOVED });
  check(a.code === 200, "an address is changed", JSON.stringify(a.body).slice(0, 140));
  got = await since(was);
  check(got.length === 1 && got[0].what === "consultant.address", "and recorded",
    JSON.stringify(got.map((r) => r.what)));
  check(got.length === 1 && String(got[0].detail).includes(IN_) && String(got[0].detail).includes(MOVED),
    "with BOTH addresses on the row, the old one being who this was (§87)",
    got.length ? got[0].detail : "none");
  /* put it back, or every assertion after this one is about a person whose
     address this section moved (§94.2) */
  await press(AS_ADMIN, { action: "saveConsultant", email: MOVED, newEmail: IN_ });
  await press(AS_ADMIN, { action: "saveConsultant", email: IN_, name: "Record Insider" });

  /* Who sees what — the act §487 named and left, and the widest of the four */
  was = await n();
  await press(AS_ADMIN, { action: "saveAccess", area: "demo", grant: "edit" });   /* the shipped default */
  check((await since(was)).length === 0, "setting a column to the setting already in force records nothing",
    JSON.stringify((await since(was)).map((r) => r.what)));
  a = await press(AS_ADMIN, { action: "saveAccess", area: "demo", grant: "view" });
  check(a.code === 200, "a column of Who sees what is narrowed", JSON.stringify(a.body).slice(0, 140));
  got = await since(was);
  check(got.length === 1 && got[0].what === "access.set", "and it is recorded",
    JSON.stringify(got.map((r) => r.what)));
  /* THE WORDS ARE THE SHARED MODULE'S, asserted through it rather than
     spelled here, so renaming a setting moves the sentence and this check
     together and cannot move one (§94.8) */
  check(got.length === 1 && String(got[0].detail) ===
        "Set " + FF.AREAS.find((x) => x.key === "demo").name + " to " + FF.stateName("view") + " (was " + FF.stateName("edit") + ")",
    "saying the column, what it became and what it was", got.length ? got[0].detail : "none");
  check(got.length === 1 && got[0].tenant_name === "" && got[0].tenant_id === null,
    "and it names no client, being the platform's own act");
  /* AND NOT ONE BUTTON ON THAT TABLE MOVES (§94.2, rule 1b). The page drew
     these words by capitalising the state key, so the shared map has to
     produce exactly that or a round about a RECORD has quietly reworded the
     Who sees what table — which is how the first build of this turned `None`
     into `Nothing`. It would have reached ONE button and not three: four areas
     hold that word, and the page skips `none` wherever an area offers more
     than two states, so *Add a client* is the only column that ever draws one.
     Measured against the old expression rather than against a list typed here,
     or the two drift the next time a state is added. */
  const oldWord = (st) => st.charAt(0).toUpperCase() + st.slice(1);
  const everyState = [...new Set(FF.AREAS.flatMap((a) => a.states || []))];
  const reworded = everyState.filter((st) => FF.stateName(st) !== oldWord(st));
  check(everyState.length >= 5 && reworded.length === 0,
    "and every setting still reads the word the table already drew",
    everyState.length + " states, reworded: " + JSON.stringify(reworded));
  await press(AS_ADMIN, { action: "saveAccess", area: "demo", grant: "edit" });   /* back as found */

  /* ── 8. archived, brought back ── */
  was = await n();
  await press(AS_ADMIN, { action: "archiveClient", key: KEY, on: true });
  await press(AS_ADMIN, { action: "archiveClient", key: KEY, on: false });
  got = await since(was);
  check(got.map((r) => r.what).join(",") === "client.archived,client.restored",
    "archiving and bringing back are two acts from one handler",
    JSON.stringify(got.map((r) => r.what)));

  /* ── 9. the read, and its narrowing at BOTH ends (§94.2, §355) ── */
  say("the History read, and who it shows");

  const hist = async (who) => {
    const r = await press(who, { action: "history" });
    return r.code === 200 && Array.isArray(r.body.acts) ? r.body : null;
  };
  const mineOnly = (h) => (h ? h.acts.filter((x) => x.client === "Record Client Renamed" || x.client === "Record Client") : []);

  const hAdmin = await hist(AS_ADMIN);
  check(!!hAdmin && mineOnly(hAdmin).length > 0, "the admin reads the acts on this client",
    hAdmin ? mineOnly(hAdmin).length : "no answer");
  check(!!hAdmin && hAdmin.cap === 200, "and the cap is answered so the page can print it",
    hAdmin ? hAdmin.cap : "none");
  check(!!hAdmin && hAdmin.acts.every((x) => x.what !== "open"), "no row carrying the old default is read");
  check(!!hAdmin && hAdmin.acts.length > 1 && new Date(hAdmin.acts[0].at) >= new Date(hAdmin.acts[1].at),
    "newest first");
  check(!!hAdmin && hAdmin.acts.some((x) => x.who === "Record Admin" && x.detail),
    "each act carries who, which client and the sentence");

  /* THE NARROWING IS THE LOAD-BEARING HALF: a consultant with no seat on
     this client may not open it, so the record must not name it. */
  const hOut = await hist(AS_OUT);
  check(!!hOut, "a consultant with no seat still gets the page", hOut ? "yes" : "refused");
  check(!!hOut && mineOnly(hOut).length === 0,
    "and is shown nothing about a client they cannot open (§355)",
    hOut ? JSON.stringify(mineOnly(hOut).map((x) => x.what)) : "no answer");
  /* …and the other end, or a read that answered nothing to everybody passes */
  const hIn = await hist(AS_IN);
  check(!!hIn && mineOnly(hIn).length > 0,
    "while the consultant who holds a seat on it does see them",
    hIn ? mineOnly(hIn).length : "no answer");
  check(!!hIn && !hIn.acts.some((x) => x.what.startsWith("consultant.")),
    "a platform-wide act names no client, so it is the admin's alone",
    hIn ? JSON.stringify(hIn.acts.filter((x) => x.what.startsWith("consultant.")).map((x) => x.what)) : "none");
  check(!!hAdmin && hAdmin.acts.some((x) => x.what.startsWith("consultant.")),
    "and the admin does see it (§94.2 — both ends, or an empty read passes above)");

  /* ── 10. deleting the client, and the record surviving it ── */
  was = await n();
  await press(AS_ADMIN, { action: "archiveClient", key: KEY, on: true });
  a = await press(AS_ADMIN, { action: "deleteClient", key: KEY, confirm: "Record Client Renamed" });
  got = (await since(was)).filter((r) => r.what === "client.deleted");
  check(a.code === 200, "the client is deleted", JSON.stringify(a.body).slice(0, 140));
  check(got.length === 1, "and the deletion is recorded",
    JSON.stringify((await since(was)).map((r) => r.what)));
  check(got.length === 1 && got[0].tenant_name === "Record Client Renamed" && got[0].tenant_id === null,
    "the row keeps the client's NAME with nothing to point at (§49.2)",
    got.length ? got[0].tenant_name + " / " + got[0].tenant_id : "none");
  /* the acts recorded against it before it went are still there, which is
     what a record is for — and they still name the client */
  const after = (await rows()).filter((r) => r.tenant_name === "Record Client Renamed");
  check(after.length > 1, "every act recorded against it survived the delete", after.length);
  tenantId = null;
} catch (e) {
  fail("the fixture ran to the end", e && e.message);
} finally {
  try { await sweep(); } catch { /* a sweep that cannot run must not hide the verdict */ }
  await owner.end();
}

/* ────────────────────────────────────────────────────────────────── §4 */
say("the page (read from the console's own source)");

check(/var TABS_KNOWN = \[[^\]]*"history"/.test(PAGE), "History is a tab the address can name");
check(/READS = \[[^\]]*"history"/.test(PAGE), "and a READ, so it keeps its last copy (§400.2)");
check(/TAB === "history"\) return drawHistory\(\)/.test(PAGE), "redraw dispatches to it");
/* LAST on the row — his own placement from the drawing: where you go to look
   back rather than to work. Asserted as the position, never as the list. */
const tabs = [...PAGE.matchAll(/\["([a-z]+)", "[^"]+", (?:true|false|[A-Za-z.()!]+)\]/g)].map((m) => m[1]);
check(tabs.length > 1 && tabs[tabs.length - 1] === "history",
  "drawn last on the navigation row", JSON.stringify(tabs));

const draw = PAGE.slice(PAGE.indexOf("function drawHistory("));
const drawBody = draw.slice(0, draw.indexOf("\n  function "));
check(/Nothing recorded yet/.test(drawBody) && /not here/.test(drawBody),
  "an empty record says what it holds and what it does not (§45.2)");
check(/nOf\(/.test(drawBody), "the count is plural by the page's own rule, never by adding an s (§107.8)");
check(/j\.cap/.test(drawBody), "the cap is printed rather than left as a silent limit (§35)");
check(/Could not reach the server/.test(drawBody), "a read that failed says so rather than reading as empty (§93)");
/* TYPING NEVER REPAINTS (§35): the search hides rows in place, so a build
   that called redraw() on every keystroke would throw away the box being
   typed into. */
const srch = drawBody.slice(drawBody.indexOf("addEventListener(\"input\""));
check(srch.length > 0 && !/redraw\(|go\(/.test(srch.slice(0, 1400)),
  "the search filters in place and never repaints");
check(/dataset\.find =/.test(drawBody), "matching on a value worked out once per row rather than per keystroke");
/* NO NEW CSS (§53.5): the table is My work's own treatment. */
check(/el\("table", "work"\)/.test(drawBody) && /el\("tr", "grp"\)/.test(drawBody),
  "it wears My work's own table rather than a second answer to one question (§53.5)");

console.log("\n" + (fails ? fails + " FAILED" : oks + " assertions, all good") +
  (brk ? "   [break: " + brk + "]" : ""));
process.exit(fails ? 1 : 0);
