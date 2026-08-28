/* A TEST COPY IS WRITTEN DOWN, AND ONLY IT CAN BE REMOVED (§145).

   Islam: "there have been multiple sent emails earlier. weren't they saved?
   I can't see them in the overview."

   They were never written down. `send` wrote a row and a row per recipient;
   `test` — Send me a copy, and the test send on Email settings — sent a REAL
   email through the same builder and wrote nothing at all, so from the record
   those emails had never happened.

   THE CLIENT HALF IS `checks/send-overview.py` §6. This is the half no browser
   can see: that the row is actually written, that history carries the kind,
   that a Super user may remove a test copy, and — Islam's B — that removing a
   message which went to the BUSINESS is refused by the server and not merely
   undrawn. A control that is only hidden is decoration (§42, §44).

   IT STANDS IN FRONT OF THE PROVIDER (`SMP_RESEND_ENDPOINT`, §142.6): a test
   double behind an `if` in lib/mailer.js would be a second code path shipping
   to production.

   Run:  DATABASE_URL=… node scripts/test-test-copies.js <smo-password>
*/
const { spawn } = require("child_process");
const http = require("http");
const path = require("path");
const pg = require("pg");
const io = require("../lib/state-io.js");
const Rules = require("../lib/rules.js");

const SMO_PW = process.argv[2];
if (!SMO_PW) {
  console.error("usage: DATABASE_URL=… node scripts/test-email-greeting.js <smo-password>");
  process.exit(2);
}

let pass = 0; const fails = [];
function ok(cond, what, detail) {
  if (cond) { pass++; console.log("  ok    " + what); }
  else { fails.push(what); console.log("  FAIL  " + what + (detail ? "  — " + detail : "")); }
}

/* ── THE PEOPLE THIS TURNS ON, and each is a shape that has to survive ──
   An ordinary name; the compound one Islam's own register holds, which is the
   case that made the name question worth asking twice; somebody whose short
   name was TYPED, so the correction wins over the guess; and a row whose name
   cannot produce a greeting at all, which must lose the LINE and not gain a
   comma. */
const CAST = [
  { key: "tc_ahmed", name: "Ahmed Test", email: "tc1@example.com" },
  { key: "tc_basma", name: "Basma Test", email: "tc2@example.com" }
];

/* ── A RESEND THAT KEEPS WHAT IT WAS GIVEN ─────────────────────────────── */
let CAUGHT = [];
function fakeResend() {
  return new Promise(function (resolve) {
    const s = http.createServer(function (req, res) {
      let b = "";
      req.on("data", function (c) { b += c; });
      req.on("end", function () {
        let j = null;
        try { j = JSON.parse(b || "[]"); } catch (e) { j = []; }
        const list = Array.isArray(j) ? j : [j];
        list.forEach(function (m) { CAUGHT.push(m); });
        res.writeHead(200, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ data: list.map(function (_, i) {
          return { id: "fake-" + (CAUGHT.length - list.length + i) }; }) }));
      });
    });
    s.listen(0, "127.0.0.1", function () { resolve(s); });
  });
}

function waitFor(url, tries) {
  return new Promise(function (resolve, reject) {
    (function go(n) {
      fetch(url).then(function () { resolve(); })
        .catch(function () {
          if (n <= 0) return reject(new Error("dev-server never came up"));
          setTimeout(function () { go(n - 1); }, 300);
        });
    })(tries);
  });
}


(async function () {
  const pool = io.getPool(pg);
  const client = await pool.connect();
  let resend = null, dev = null, base = null;
  const added = [], mine = [];
  try {
    await io.ensureReady(client);

    /* The cast joins the register and leaves again in the finally: this runs
       against a real tenant, and a test that leaves people behind changes the
       thing it measures. `email` is not a COLUMN — state-io files unrecognised
       keys into `extra` (§52) — so the rows are shaped like every real one. */
    let idx = ((await client.query("SELECT COALESCE(MAX(idx),0) AS m FROM people"))
                 .rows[0].m) + 1;
    for (const p of CAST) {
      await client.query(
        "INSERT INTO people (key, idx, name, extra) VALUES ($1,$2,$3,$4) " +
        "ON CONFLICT (key) DO UPDATE SET name=EXCLUDED.name, extra=EXCLUDED.extra",
        [p.key, idx++, p.name, JSON.stringify({ email: p.email })]);
      added.push(p.key);
    }

    resend = await fakeResend();
    dev = spawn(process.execPath, [path.join(__dirname, "dev-server.js"), "3986"], {
      env: Object.assign({}, process.env, {
        RESEND_API_KEY: "test-key-not-real",
        SMP_MAIL_FROM: "smp@example.com",
        SMP_RESEND_ENDPOINT: "http://127.0.0.1:" + resend.address().port
      }),
      stdio: "ignore"
    });
    base = "http://127.0.0.1:3986";
    await waitFor(base + "/api/state", 40);

    const r = await fetch(base + "/api/auth", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "login", user: "SMO", password: SMO_PW })
    });
    const cookie = (r.headers.get("set-cookie") || "").split(";")[0];
    const lj = await r.json().catch(function () { return null; });
    if (!lj || !lj.ok) { console.error("could not sign in as SMO: " + (lj && lj.error)); process.exit(2); }

    async function mail(body) {
      const x = await fetch(base + "/api/mail", {
        method: "POST",
        headers: { "Content-Type": "application/json", Cookie: cookie },
        body: JSON.stringify(body)
      });
      return { status: x.status, body: await x.json().catch(function () { return null; }) };
    }

    /* ── 1 · A TEST COPY IS WRITTEN DOWN ───────────────────────────── */
    console.log("\n1 · Send me a copy is recorded");
    const before = Number((await client.query("SELECT COUNT(*) c FROM messages")).rows[0].c);
    const t = await mail({ action: "test", to: "tc1@example.com",
                           subject: "A test copy", body: "The body of it.",
                           html: "<p>hello</p>" });
    ok(t.status === 200 && t.body && t.body.ok, "the test copy was accepted", t.body);
    const rows = (await client.query(
      "SELECT id, kind, subject, body, total, sent, failed FROM messages " +
      "ORDER BY id DESC LIMIT 1")).rows;
    const trow = rows[0] || {};
    if (trow.id) mine.push(trow.id);
    ok(Number((await client.query("SELECT COUNT(*) c FROM messages")).rows[0].c) === before + 1,
       "a row was written — it never used to be");
    ok(trow.kind === "test", "and it says what it is", trow.kind);
    ok(trow.subject === "A test copy", "with the subject that went", trow.subject);
    /* THE BODY IS THE FIELD `SYNC.mailTest` DID NOT FORWARD (§142's fault): the
       email would have been perfect and the record would have held nothing. */
    ok(trow.body === "The body of it.", "and the body, which the page had to be taught to send",
       trow.body);
    ok(Number(trow.total) === 1 && Number(trow.sent) === 1 && Number(trow.failed) === 0,
       "reaching one person", [trow.total, trow.sent, trow.failed]);
    const rcp = (await client.query(
      "SELECT address, ok FROM message_recipients WHERE message_id = $1", [trow.id])).rows;
    ok(rcp.length === 1 && rcp[0].address === "tc1@example.com" && rcp[0].ok === true,
       "and who got it is recorded too", rcp);

    /* ── 2 · THE RECORD CARRIES THE KIND ───────────────────────────── */
    console.log("\n2 · the Overview can tell one from the other");
    const h = await mail({ action: "history" });
    const got = ((h.body && h.body.messages) || []).filter(function (m) {
      return String(m.id) === String(trow.id); })[0];
    ok(!!got, "the test copy comes back in the record");
    ok(got && got.kind === "test", "marked as a test", got && got.kind);

    /* ── 3 · A REAL SEND, FOR THE REFUSAL TO HAVE A SUBJECT ────────── */
    console.log("\n3 · a message that went to the business");
    const sres = await mail({ action: "send",
      criteria: { keys: CAST.map(function (p) { return p.key; }) },
      subject: "A real send", body: "Went to people.", html: "<p>hello</p>" });
    ok(sres.status === 200 && sres.body && sres.body.ok, "it went", sres.body);
    const real = (await client.query(
      "SELECT id, kind FROM messages WHERE subject = 'A real send' ORDER BY id DESC LIMIT 1")).rows[0];
    if (real) mine.push(real.id);
    ok(real && real.kind === null, "a real send carries no kind — NULL is what it means",
       real && real.kind);

    /* ── 4 · ONLY A TEST COPY MAY BE REMOVED (Islam's B) ───────────── */
    console.log("\n4 · what may be removed");
    const no = await mail({ action: "historyDelete", id: real.id });
    ok(no.status === 403, "removing a message that went to the business is refused", no.status);
    ok(no.body && /test copies/i.test(no.body.error || ""),
       "and the refusal says why", no.body && no.body.error);
    ok(Number((await client.query("SELECT COUNT(*) c FROM messages WHERE id = $1",
                                  [real.id])).rows[0].c) === 1,
       "and the row is still there — the refusal is not cosmetic");

    const yes = await mail({ action: "historyDelete", id: trow.id });
    ok(yes.status === 200 && yes.body && yes.body.ok, "a test copy is removed", yes.body);
    ok(Number((await client.query("SELECT COUNT(*) c FROM messages WHERE id = $1",
                                  [trow.id])).rows[0].c) === 0, "the row is gone");
    ok(Number((await client.query(
         "SELECT COUNT(*) c FROM message_recipients WHERE message_id = $1",
         [trow.id])).rows[0].c) === 0, "and its recipients went with it, by CASCADE");

    const gone = await mail({ action: "historyDelete", id: trow.id });
    ok(gone.status === 404, "removing it twice says there is no such message", gone.status);

    /* ── 5 · IT IS THE SUPER USER'S, ASKED ON THE SERVER (§89) ─────── */
    console.log("\n5 · and it is the Super user's");
    await client.query("UPDATE people SET role = 'smoteam' WHERE key = 'smo'");
    const asTeam = await mail({ action: "historyDelete", id: real.id });
    /* THE ENDPOINT'S OWN GATE ANSWERS FIRST TODAY — it admits only `super`, so
       this is 403 either way. What is asserted is that it is REFUSED, and the
       guard inside the action is what keeps that true if that gate is ever
       widened to the office as §89 would have it (§94's drift). */
    ok(asTeam.status === 403, "somebody who is not a Super user is refused", asTeam.status);
    await client.query("UPDATE people SET role = 'super' WHERE key = 'smo'");

  } finally {
    if (dev) dev.kill();
    if (resend) resend.close();
    for (const id of mine) {
      await client.query("DELETE FROM messages WHERE id = $1", [id]).catch(function () {});
    }
    for (const k of added) {
      await client.query("DELETE FROM people WHERE key = $1", [k]).catch(function () {});
    }
    await client.query("UPDATE people SET role = 'super' WHERE key = 'smo'").catch(function () {});
    client.release();
    await pool.end();
  }
  console.log("\n" + pass + " passed, " + fails.length + " failed");
  if (fails.length) { fails.forEach(function (f) { console.log("  · " + f); }); process.exit(1); }
})().catch(function (e) { console.error(e); process.exit(1); });
