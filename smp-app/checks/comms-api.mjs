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

   HOW `chat-on` IS MADE, and why not the way the others are. Every other break
   in this app is an `if (process.env.SMP_BREAK …)` in code I wrote. This one's
   subject is three lines INSIDE `lib/chat-api.cjs`, which is the frozen
   endpoint carried across and whose header promises every line below it is the
   frozen file's byte for byte — so a test hook there would be a second code
   path shipping to production in exactly the file that must not have one
   (§142.6, §100.3). It is made from the SOURCE instead (§276): the file is
   copied aside, `if (!cfg.on)` becomes `if (false)`, the app is REBUILT — the
   carried module is bundled, so an edited source reaches nothing without one,
   measured rather than assumed — and both the file and the build are put back
   in the `finally`. That is what `qa.py` does to falsify the platform, and it
   leaves the shipped bytes clean. If a run is killed between the two, what is
   left behind is a BROKEN BUILD over a GOOD source, so the next ordinary run
   goes red on the switch rather than quietly passing (§113.8's direction).

   Needs `next build` first. Re-runnable: the dev tenant is REMADE at the start. */
import { spawn } from "node:child_process";
import { SCHEMA } from "../db/schema-name.mjs";   /* the shared schema is not `public` (§317.4) */
import { chromium } from "playwright-core";
import { join } from "node:path";
import { createRequire } from "node:module";
import pg from "pg";
import { devTenant, DEV_PASSWORD } from "../scripts/dev-tenant.mjs";
import { hashPassword } from "../lib/auth.ts";
import { withTenant } from "../lib/tenant.ts";

const URL_ = process.env.DATABASE_URL_UNPOOLED || "postgres://postgres:postgres@localhost:5432/smp_dev";
const CHROME = process.env.SMP_CHROME || "/opt/pw-browsers/chromium-1194/chrome-linux/chrome";
const PORT = 3976, BASE = "http://localhost:" + PORT, SLUG = "raya-trade";
const brk = (process.argv.find((a) => a.startsWith("--break=")) || "").slice(8);
if (brk) process.env.SMP_BREAK = brk;
/* `chat-on` is broken in the CARRIED FILE, from its source, and put back —
   see the note above. Restored in the outer `finally`, and asserted restored,
   because leaving that file edited would be worse than any check. */
const { readFileSync, writeFileSync } = await import("node:fs");
const CARRIED = join(import.meta.dirname, "..", "lib", "chat-api.cjs");
const carriedWas = brk === "chat-on" ? readFileSync(CARRIED, "utf8") : null;
const rebuild = () => new Promise((res, rej) => {
  const b = spawn("npx", ["next", "build"], {
    cwd: join(import.meta.dirname, ".."),
    env: { ...process.env, SMP_BREAK: "", DATABASE_URL: URL_, DATABASE_URL_UNPOOLED: URL_ },
    stdio: "ignore",
  });
  b.on("exit", (c) => (c === 0 ? res() : rej(new Error("next build exited " + c))));
});
if (carriedWas) {
  const off = carriedWas.replaceAll("if (!cfg.on) {", 'if (false) { /* --break=chat-on */');
  if (off === carriedWas) { console.log("FAIL  the chat-on break found nothing to break"); process.exit(1); }
  writeFileSync(CARRIED, off);
  await rebuild();
}
const R = createRequire(import.meta.url)("../lib/rules.cjs");
let oks = 0, fails = 0;
const ok = (l) => { oks++; console.log("ok    " + l); };
const fail = (l, m) => { fails++; console.log("FAIL  " + l + (m === undefined ? "" : " — " + String(m).slice(0, 220))); };
const check = (c, l, m) => (c ? ok(l) : fail(l, m));

/* ── the tenant, remade, plus a SECOND client so the boundary can be asked ── */
const { tenantId } = await devTenant({ url: URL_, log: () => {} });
const owner = new pg.Pool({ connectionString: URL_, max: 3, options: "-c search_path=" + SCHEMA });
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

  /* ── 8 · THE SEAM: the frozen corner meets this endpoint ─────────────────
     EVERY ONE of the twelve frozen browser checks for this surface serves its
     own stub, and it has to: the chat does not exist over `file://` at all
     (§94.11), so each one stands its own server up. That is right for what
     they measure — the CLIENT — and it means not one of them has ever spoken
     to the endpoint this phase ported. Sections 1-7 above are the other half:
     they speak to the endpoint and never draw a pixel. So the seam between
     them is measured by nobody, and a corner that never came up, or a Send
     that answers 500, would pass all nineteen files.

     What is asked here is ONLY the seam — the shipped chat.js, served by
     `lib/shell.ts`, against `app/api/chat`. Everything about how the corner
     behaves is the stub checks', and everything about what the endpoint
     decides is sections 1-7's; neither is re-proved. */
  console.log("\n8 · the frozen corner, in a browser, against this endpoint");
  const browser = await chromium.launch({ executablePath: CHROME, args: ["--no-sandbox"] });
  try { await (async () => {
    const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
    const page = await ctx.newPage();
    /* TWO KINDS, KEPT APART. A `pageerror` is an exception the product threw
       and is a fault whatever else is true; a console error may be the
       browser reporting the missing worker below, which is a RECORDED gap
       awaiting Islam rather than something this port broke. Lumping them
       together would either fail on a known state for ever or excuse a real
       throw. */
    const errs = [], cons = [];
    page.on("pageerror", (e) => errs.push(String(e)));
    page.on("console", (m) => { if (m.type() === "error") cons.push(m.text()); });
    /* §167.2: the welcome screen covers the viewport, in an init script
       because setting the flag after `goto` is too late. */
    await page.addInitScript(() => { try {
      sessionStorage.setItem("smp.tour.later", "1");
      sessionStorage.setItem("smp.welcome.done", "1");
    } catch (e) {} });
    await page.goto(BASE + "/", { waitUntil: "networkidle" });
    await page.waitForSelector(".gate[data-hydrated]", { state: "attached", timeout: 15000 });
    await page.fill("#user", "mobhead@raya.example");
    await page.fill("#password", DEV_PASSWORD);
    await Promise.all([page.waitForURL(BASE + "/" + SLUG), page.click("#loginForm button[type=submit]")]);
    /* `/<client>` is the LANDING (§315), not the platform — a React page with
       no shell on it, so no corner and no `SYNC`. The platform is behind
       *Continue*, and that is where this section's subject lives. */
    await page.goto(BASE + "/" + SLUG + "/mobile", { waitUntil: "networkidle" });
    await page.waitForSelector("nav.units", { timeout: 20000 });
    /* MEASURE THE BOX AND PRESS THE POINT, never the class (§68.10, §70) —
       present-and-unreachable is this project's recurring fault. */
    await page.waitForFunction(() => {
      const d = document.getElementById("chatdock");
      return !!(d && !d.hidden && d.getBoundingClientRect().width > 0);
    }, null, { timeout: 20000 }).catch(() => {});
    const seen = await page.evaluate(() => {
      const d = document.getElementById("chatdock");
      if (!d) return { there: false, why: "no dock" };
      if (d.hidden || d.getBoundingClientRect().width <= 0) return { there: false, why: "hidden" };
      const b = d.querySelector(".chatbtn"), q = b && b.getBoundingClientRect();
      const hit = q ? document.elementFromPoint(q.x + q.width / 2, q.y + q.height / 2) : null;
      return { there: true, reaches: !!(hit && b && b.contains(hit)) };
    });
    check(seen.there && seen.reaches, "the corner is drawn against the real endpoint, and a click reaches it", seen);

    const WORD = "seam " + Date.now();
    await page.click("#chatbtn");
    await page.waitForSelector("#chatsay", { state: "visible", timeout: 10000 });
    await page.fill("#chatsay", WORD);
    await page.click("#chatsend");
    /* The row, read through the TENANT — so this also asserts the write
       landed under the tenant the door resolved, from a real browser. */
    let landed = [];
    for (let i = 0; i < 40 && !landed.length; i++) {
      await new Promise((r) => setTimeout(r, 250));
      landed = await rows(tenantId, "SELECT person_key, body FROM chat_messages WHERE body = $1", [WORD]);
    }
    check(landed.length === 1 && landed[0].person_key === "mobhead",
      "a message typed into the corner lands in the database, under this tenant", landed);
    const elsewhere = await rows(other, "SELECT id FROM chat_messages WHERE body = $1", [WORD]);
    check(elsewhere.length === 0, "...and nowhere else", elsewhere.length);
    /* THE OFFICE'S SIDE OF THE SAME MESSAGE, through the endpoint the office
       reads — the seam closed at both ends rather than half of it. */
    const q = await chat(office, { action: "queue" });
    const mine = ((q.j && q.j.threads) || []).filter((x) => x.person_key === "mobhead");
    check(q.status === 200 && mine.length === 1 && mine[0].waiting,
      "...and the office's queue is waiting on them (§71)", q.j && q.j.threads);
    check(errs.length === 0, "no page errors in any of that", errs.slice(0, 2));
    /* NAMED, never a blanket exemption: the one console error this build is
       allowed is the browser refusing to register a worker that is not
       served. Anything else fails, and when the worker question is answered
       this line goes red and is rewritten (§218) rather than quietly passing. */
    /* NOT `other` — that is this file's second tenant, forty lines up
       (§56.7, and the section reported it rather than dying). */
    const unexpected = cons.filter((m) => !/fetching the script|sw\.js|ServiceWorker|service worker/i.test(m));
    check(unexpected.length === 0, "no console errors either, beyond the missing worker below", unexpected.slice(0, 2));

    /* PRINTED, NOT ASSERTED (§302's own move). The new stack serves no
       `/sw.js`, which the plan states as a cost — "no service worker and no
       offline copy" — reasoned about CACHING and §91's name trap. But that
       one file also carries `push` and `notificationclick`, and `chat.js`
       waits on `navigator.serviceWorker.ready` before it subscribes, so with
       no worker NO DEVICE CAN EVER REGISTER and §231's box cannot arrive —
       while Phase G's own row in the plan says to carry notifications. The
       two lines cannot both hold. Asserting either way would be choosing,
       and that choice is Islam's (§316.7, stop point C), so the state is
       PRINTED on every run and the cost stays visible rather than
       disappearing into a green tick. */
    const sw = await fetch(BASE + "/sw.js").then((x) => x.status).catch(() => "unreachable");
    console.log("      · /sw.js answers " + sw + " — with no worker no device can register (§316.7, awaiting Islam)");
    await ctx.close();
  })(); }
  /* §215: a section that DIES reports nothing, and this one drives a browser,
     where every wait can throw. It reports instead. */
  catch (e) { fail("8 · the seam — the section died rather than reporting (§215)", (e && e.message ? e.message.split("\n")[0] : e)); }
  finally { await browser.close(); }
} finally {
  if (carriedWas) {
    writeFileSync(CARRIED, carriedWas);
    if (readFileSync(CARRIED, "utf8") !== carriedWas) console.log("FAIL  the carried file was NOT put back");
    await rebuild().catch(() => console.log("FAIL  the build was NOT put back — run `npx next build`"));
  }
  try { process.kill(-server.pid); } catch {}
  await owner.query("DELETE FROM tenants WHERE key = 'el-abd'").catch(() => {});
  await owner.end();
}
console.log("\n" + (fails ? "RED " + fails + " of " + (oks + fails) : "GREEN " + oks + "/" + oks));
process.exit(fails ? 1 : 0);
