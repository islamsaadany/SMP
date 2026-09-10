/* THE CHAT AND THE MAIL ON THE NEW STACK (spec 043 Phase G, §316.7).

   WHAT THIS PROVES, AND WHAT IT DELIBERATELY DOES NOT. `lib/chat-api.cjs` and
   `lib/mail-api.cjs` are the frozen `api/chat.js` and `api/mail.js` CARRIED
   ACROSS — every decision, every query and every sentence byte for byte, with
   ten named edits to the plumbing and nothing else. So the things those files
   were argued into (the collection's ten minutes, the greeting filled from the
   stored register, RFC 8291's encryption) are not re-proved here: they are the
   same lines, and `scripts/test-chat*.js`, `test-ask.js`, `test-mail-send.js`,
   `test-email-greeting.js` and `test-push.js` are their checks on the frozen
   stack. WHAT THE PORT CAN BREAK IS THE PLUMBING, and that is what this file
   asks about:

     · the door in front of both endpoints — no session, a client this account
       may not open, a password still temporary;
     · THE TENANT BOUNDARY, which is new and is the whole model: one client's
       office must not see another client's conversations, and a write must
       land under the tenant that made it;
     · that every action reaches its rows at all — a carried file whose
       `WHERE id = 1` names a column the shared schema does not have answers
       "Something went wrong" for ever, which is exactly what happened
       (§316.7, edit 9);
     · the two `ON CONFLICT` targets, one of which found a fault in the SHARED
       SCHEMA rather than in the carried file (edit 10);
     · the refusals, asked of somebody the rules actually refuse rather than
       of an empty page (§94.2);
     · and that a switch turned off is refused ON THE SERVER (§98.2), because
       a switch that only hides a control is decoration.

     DATABASE_URL_UNPOOLED=postgres://…/smp_dev node checks/comms-api.mjs
     … --break=no-boundary   (RED: the tenant setting is ignored — one office reads another client's chat)
     … --break=chat-on       (RED: the chat's OFF switch stops being enforced on the server)

   Needs `next build` first. Re-runnable: the dev tenant is REMADE at the start. */
import { spawn } from "node:child_process";
import { join } from "node:path";
import { createRequire } from "node:module";
import pg from "pg";
import { devTenant, DEV_PASSWORD } from "../scripts/dev-tenant.mjs";
import { hashPassword } from "../lib/auth.ts";
import { withTenant } from "../lib/tenant.ts";

const URL_ = process.env.DATABASE_URL_UNPOOLED || "postgres://postgres:postgres@localhost:5432/smp_dev";
const PORT = 3976, BASE = "http://localhost:" + PORT, SLUG = "raya-trade";
const brk = (process.argv.find((a) => a.startsWith("--break=")) || "").slice(8);
if (brk) process.env.SMP_BREAK = brk;
const R = createRequire(import.meta.url)("../lib/rules.cjs");
let oks = 0, fails = 0;
const ok = (l) => { oks++; console.log("ok    " + l); };
const fail = (l, m) => { fails++; console.log("FAIL  " + l + (m === undefined ? "" : " — " + String(m).slice(0, 220))); };
const check = (c, l, m) => (c ? ok(l) : fail(l, m));

/* ── the tenant, remade, plus a SECOND client so the boundary can be asked ── */
const { tenantId } = await devTenant({ url: URL_, log: () => {} });
const owner = new pg.Pool({ connectionString: URL_, max: 3 });
const other = (await owner.query(
  "INSERT INTO tenants (key, name, made_here) VALUES ('el-abd', 'El Abd', true) RETURNING id")).rows[0].id;
/* Its office, and a second person on THIS client who holds no seat at all. */
const mint = async (email, name, kind, seat, tid, personKey) => {
  await owner.query("DELETE FROM users WHERE email = $1", [email]);
  const u = (await owner.query(
    "INSERT INTO users (email, name, kind, is_admin, must_change, password_hash) VALUES ($1,$2,$3,$4,false,$5) RETURNING id",
    [email, name, kind, kind !== "client", hashPassword(DEV_PASSWORD)])).rows[0];
  /* A MEMBERSHIP NAMES A PERSON ON THAT CLIENT'S REGISTER, so an office
     account opening a client that has NO register yet is given none at all —
     `is_admin` holds the Super user seat BY RULE at the door (door.ts,
     seatFor), and `personFor` mints the register row on first contact
     (§313.32). El Abd having no register is the point of this fixture. */
  if (personKey)
    await owner.query("INSERT INTO tenant_users (tenant_id, user_id, person_key, seat) VALUES ($1,$2,$3,$4)",
      [tid, u.id, personKey, seat]);
  return email;
};
const otherOffice = await mint("other@forefront.example", "Other Office", "office", "super", other, null);
const plain = await mint("own_ret@raya.example", "Retail Owner", "client", "none", tenantId, "own_ret");
const team = await mint("ceo@raya.example", "Group CEO", "client", "smoteam", tenantId, "ceo");
await owner.query("DELETE FROM login_attempts");
/* El Abd needs an office row for `personFor` to resolve, which it mints on
   first contact (§313.32) — nothing to seed. */

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
const post = async (where, cookie, body) => {
  const r = await fetch(BASE + "/api/" + where, {
    method: "POST", headers: { ...(cookie ? { cookie } : {}), "content-type": "application/json" },
    body: JSON.stringify(body),
  });
  let j = null; try { j = await r.json(); } catch {}
  return { status: r.status, j };
};
const chat = (cookie, body, slug = SLUG) => post("chat", cookie, { client: slug, ...body });
const mail = (cookie, body, slug = SLUG) => post("mail", cookie, { client: slug, ...body });
const rows = (tid, sql, params) => withTenant(tid, async (c) => (await c.query(sql, params)).rows);

const office = await signIn("office@forefront.example");
const head = await signIn("mobhead@raya.example");
const reader = await signIn(plain);
const smoteam = await signIn(team);
const elabd = await signIn(otherOffice);

try {
  /* ── 1 · the door ────────────────────────────────────────────────────── */
  console.log("\n1 · the door in front of both endpoints");
  for (const [name, fn] of [["chat", chat], ["mail", mail]]) {
    let r = await fn("", { action: "status" });
    check(r.status === 401, name + ": no session is refused", r.status);
    r = await fn(office, { action: "status" }, "no-such-client");
    check(r.status === 404, name + ": a client that does not exist is refused", r.status);
    r = await fn(office, { action: "status" }, "public");
    check(r.status === 404, name + ": ...and a schema name is refused identically (§313)", r.status);
  }

  /* ── 2 · every action reaches its rows ───────────────────────────────── */
  console.log("\n2 · the actions reach the rows (§316.7's edit 9 and 10)");
  let r = await chat(head, { action: "say", body: "Hello from the unit head" });
  check(r.status === 200 && r.j && r.j.ok, "a person writes into their own conversation", r.j && r.j.error);
  const msgs = await rows(tenantId, "SELECT person_key, body, from_office FROM chat_messages ORDER BY id");
  check(msgs.length === 1 && msgs[0].person_key === "mobhead" && !msgs[0].from_office,
    "...and the row lands under them", msgs);
  const th = await rows(tenantId, "SELECT person_key, waiting FROM chat_threads");
  check(th.length === 1 && th[0].waiting === true, "...leaving the conversation waiting", th);

  r = await chat(office, { action: "queue" });
  check(r.status === 200 && r.j.threads && r.j.threads.length === 1, "the office sees it in the queue", r.j && r.j.threads);
  check(r.j && r.j.chat && r.j.chat.away === R.chatCfg({}).away,
    "...and the settings read off `org.extra`, whose singleton has no `id` (edit 9)", r.j && r.j.chat);

  r = await chat(office, { action: "reply", person: "mobhead", body: "Thanks, noted." });
  check(r.status === 200 && r.j.ok, "the office replies", r.j && r.j.error);
  const after = await rows(tenantId, "SELECT waiting FROM chat_threads WHERE person_key = 'mobhead'");
  check(after[0] && after[0].waiting === false, "...and the conversation stops waiting (§71)", after);

  r = await chat(office, { action: "flag", person: "mobhead", id: String(msgs[0] && 1), flag: "issue" });
  check(r.status === 200, "the office flags a message", r.status);
  r = await chat(office, { action: "chatSearch", q: "unit head" });
  check(r.status === 200 && r.j.ok && (r.j.hits || []).length >= 1, "the office searches history", r.j);

  /* ── 3 · the refusals, asked of somebody the rules refuse ────────────── */
  console.log("\n3 · the refusals (§94.2)");
  for (const a of ["queue", "chatSearch", "thread", "reply", "flag", "drop"]) {
    const rr = await chat(reader, { action: a, person: "mobhead", body: "x", q: "x", id: "1", flag: "issue" });
    check(rr.status === 403, "somebody with no seat cannot " + a, rr.status + " " + JSON.stringify(rr.j));
  }
  r = await chat(smoteam, { action: "queue" });
  check(r.status === 200, "the SMO team can read the queue (§89)", r.status);
  r = await chat(smoteam, { action: "drop", person: "mobhead" });
  check(r.status === 403 && /Super user/.test((r.j && r.j.error) || ""),
    "...and removing a conversation is the Super user's", r.j);

  /* ── 4 · the tenant boundary ─────────────────────────────────────────── */
  console.log("\n4 · one client's office cannot read another's");
  r = await chat(elabd, { action: "queue" }, "el-abd");
  check(r.status === 200 && (r.j.threads || []).length === 0,
    "El Abd's office sees no conversation of Raya's", r.j && r.j.threads);
  /* THE BOUNDARY A CLIENT'S OWN PERSON MEETS. An office account is
     `is_admin` and opens every client BY RULE at the door (§313.4) — that is
     the platform, not a leak — so the door is asked of somebody it does
     refuse: a person on Raya's register, reaching for El Abd. */
  r = await chat(reader, { action: "mine" }, "el-abd");
  check(r.status === 404, "a client's own person cannot open another client", r.status);
  r = await chat(elabd, { action: "say", body: "Ours" }, "el-abd");
  check(r.status === 200 && r.j.ok, "El Abd's own office writes into El Abd", r.j && r.j.error);
  const mine2 = await rows(other, "SELECT person_key FROM chat_messages");
  const raya = await rows(tenantId, "SELECT person_key FROM chat_messages");
  check(mine2.length === 1 && raya.length === 2,
    "...and the row landed under El Abd, not Raya", { elabd: mine2.length, raya: raya.length });

  /* ── 5 · a switch off is refused on the SERVER (§98.2) ───────────────── */
  console.log("\n5 · the chat's own switch");
  await withTenant(tenantId, (c) => c.query(
    "UPDATE org SET extra = jsonb_set(COALESCE(extra,'{}'::jsonb), '{chat}', '{\"on\":false}'::jsonb)"));
  r = await chat(head, { action: "say", body: "with the chat off" });
  check(r.status === 403, "with the chat off, `say` is refused on the server", r.status + " " + JSON.stringify(r.j));
  r = await chat(office, { action: "reply", person: "mobhead", body: "off" });
  check(r.status === 403, "...and so is `reply`", r.status);
  await withTenant(tenantId, (c) => c.query(
    "UPDATE org SET extra = COALESCE(extra,'{}'::jsonb) - 'chat'"));

  /* ── 6 · a device that changes hands MOVES (§316.7's edit 10) ────────── */
  console.log("\n6 · one endpoint, one subscription");
  /* §225's switch is the tenant's and ships OFF, so it is turned on here —
     `pushOn` is refused outright while it is off, which is the switch working
     and not the thing under test. */
  await withTenant(tenantId, (c) => c.query(
    "UPDATE org SET extra = jsonb_set(COALESCE(extra,'{}'::jsonb), '{chat}', '{\"popup\":true}'::jsonb)"));
  const sub = { endpoint: "https://push.example/abc", keys: { p256dh: "aaa", auth: "bbb" } };
  r = await chat(head, { action: "pushOn", sub });
  check(r.status === 200, "a device subscribes", r.status + " " + JSON.stringify(r.j));
  r = await chat(office, { action: "pushOn", sub });
  check(r.status === 200, "...and the same device, signed in to by somebody else", r.status);
  const subs = await rows(tenantId, "SELECT person_key FROM push_subscriptions WHERE endpoint = $1", [sub.endpoint]);
  check(subs.length === 1 && subs[0].person_key === "smo",
    "...holds ONE row, and it moved (§231: the previous person stops being notified)", subs);

  /* ── 7 · the mail endpoint ───────────────────────────────────────────── */
  console.log("\n7 · sending an email");
  r = await mail(head, { action: "status" });
  check(r.status === 403 && /SMO/.test((r.j && r.j.error) || ""),
    "mail goes out over the organisation's name, so it is the SMO's", r.j);
  r = await mail(smoteam, { action: "status" });
  check(r.status === 403, "...the SMO team included (`role !== 'super'`)", r.status);
  r = await mail(office, { action: "status" });
  check(r.status === 200 && r.j.ok && r.j.you && r.j.you.key === "smo", "the office reads the status", r.j);
  r = await mail(office, { action: "audience", audience: { mode: "all" } });
  check(r.status === 200 && r.j.ok && typeof r.j.active === "number" && r.j.active > 0,
    "the audience is resolved from the graph", r.j);
  r = await mail(office, { action: "draftSave", subject: "Hello", body: "<p>Body</p>", audience: { mode: "all" } });
  const draftId = r.j && r.j.id;
  check(r.status === 200 && draftId, "a draft is saved", r.j);
  r = await mail(office, { action: "draftList" });
  check((r.j.drafts || []).length === 1, "...and listed", r.j && r.j.drafts);
  r = await mail(office, { action: "draftOpen", id: draftId });
  check(r.j.draft && r.j.draft.subject === "Hello", "...and opened", r.j && r.j.draft);
  r = await mail(office, { action: "draftDelete", id: draftId });
  check(r.status === 200 && (await rows(tenantId, "SELECT id FROM message_drafts")).length === 0,
    "...and deleted", r.status);
  const drafts = await rows(other, "SELECT id FROM message_drafts");
  check(drafts.length === 0, "and El Abd never saw the draft", drafts.length);
} finally {
  try { process.kill(-server.pid); } catch {}
  await owner.query("DELETE FROM tenants WHERE key = 'el-abd'").catch(() => {});
  await owner.end();
}
console.log("\n" + (fails ? "RED " + fails + " of " + (oks + fails) : "GREEN " + oks + "/" + oks));
process.exit(fails ? 1 : 0);
