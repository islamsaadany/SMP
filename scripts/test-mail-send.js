/* ── SENDING TO MANY PEOPLE, WITHOUT A REAL KEY (§74.4) ───────────────────
   The one piece of the composer that can fail SILENTLY is the join between
   Resend's answer and the register: the batch endpoint returns ids in the
   order they were sent, so a recipient is matched to its result BY POSITION.
   Get that wrong and every row still says "sent" — against the wrong person.

   So `fetch` is stubbed and the handler is driven for real, against a real
   Postgres, and the rows are read back and checked address by address. It also
   drives the case nobody writes by hand: an answer SHORTER than what was sent.

   DATABASE_URL=... node scripts/test-mail-send.js                            */
const pg = require("pg");
const io = require("../lib/state-io.js");
const auth = require("../lib/auth.js");

let pass = 0, fail = 0;
function check(what, ok, extra) {
  if (ok) { pass++; console.log("  ok   " + what); }
  else { fail++; console.log("  FAIL " + what + (extra ? "  — " + extra : "")); }
}

/* What the stub was asked to send, so the test can assert the SHAPE of the
   request as well as what came back — one shared To would pass every
   row-matching check and still be the bug this design exists to avoid. */
let LAST = null;
function stubFetch(answer) {
  globalThis.fetch = async function (url, opt) {
    LAST = { url: String(url), body: JSON.parse(opt.body) };
    if (String(url).indexOf("/emails/batch") < 0) {
      return { ok: true, status: 200, json: async () => ({ data: [] }) };
    }
    return { ok: true, status: 200, json: async () => ({ data: answer(LAST.body) }) };
  };
}

function fakeReq(body, cookie) {
  return { method: "POST", body: body, headers: { cookie: cookie }, socket: {},
           on: function () {}, };
}
function fakeRes() {
  const r = { statusCode: 0, body: null, setHeader() {}, end(s) { r.body = JSON.parse(s); } };
  return r;
}

(async function () {
  process.env.RESEND_API_KEY = process.env.RESEND_API_KEY || "re_stub";
  process.env.SMP_MAIL_FROM = "Raya Trade <smp@example.com>";
  const handler = require("../api/mail.js");
  const pool = io.getPool(pg);
  const client = await pool.connect();
  await io.ensureReady(client);

  const token = await auth.createSession(client, "smo");
  const cookie = "smp_session=" + token;

  const payload = {
    action: "send", criteria: { everyone: true },
    subject: "Reporting opens Monday", body: "Please enter your figures.",
    html: "<p>hi</p>", fromName: "Raya Trade"
  };

  console.log("1 · every recipient gets their own message");
  stubFetch(b => b.map((_, i) => ({ id: "id-" + i })));
  let res = fakeRes();
  await handler(fakeReq(payload, cookie), res);
  check("the send is accepted", res.body && res.body.ok, JSON.stringify(res.body));
  const n = res.body.sent;
  check("every recipient is reported sent", res.body.failed === 0 && n > 0,
        "sent " + n + " failed " + res.body.failed);
  check("one email object per person, never a shared To",
        Array.isArray(LAST.body) && LAST.body.length === n &&
        LAST.body.every(e => Array.isArray(e.to) && e.to.length === 1),
        JSON.stringify(LAST.body && LAST.body.map(e => e.to)));
  check("nobody appears in anybody else's To",
        new Set(LAST.body.map(e => e.to[0])).size === n);

  let rows = (await client.query(
    "SELECT person_name, address, ok, provider_id FROM message_recipients " +
    "WHERE message_id = $1 ORDER BY id", [res.body.id])).rows;
  check("a row per recipient", rows.length === n, "rows " + rows.length);
  check("all recorded as sent", rows.every(r => r.ok));
  /* THE JOIN. The stub numbered its answers by position, so row i must carry
     id-i AND the address that was in position i of the request. */
  check("each row carries the id for ITS position, against ITS address",
        rows.every((r, i) => r.provider_id === "id-" + i &&
                             r.address === LAST.body[i].to[0]),
        rows.map((r, i) => r.address + "→" + r.provider_id).join(" "));

  console.log("2 · an answer shorter than what was sent");
  stubFetch(b => b.slice(0, b.length - 1).map((_, i) => ({ id: "short-" + i })));
  res = fakeRes();
  await handler(fakeReq(payload, cookie), res);
  check("the missing one is counted as failed, not as sent",
        res.body.ok && res.body.failed === 1 && res.body.sent === n - 1,
        "sent " + res.body.sent + " failed " + res.body.failed);
  rows = (await client.query(
    "SELECT address, ok, error FROM message_recipients WHERE message_id = $1 ORDER BY id",
    [res.body.id])).rows;
  check("and it is the LAST one, named, with a reason",
        rows[rows.length - 1].ok === false && !!rows[rows.length - 1].error,
        JSON.stringify(rows[rows.length - 1]));

  console.log("3 · Resend refuses the whole batch");
  globalThis.fetch = async function (url, opt) {
    LAST = { url: String(url), body: JSON.parse(opt.body) };
    if (String(url).indexOf("/emails/batch") < 0)
      return { ok: true, status: 200, json: async () => ({ data: [] }) };
    return { ok: false, status: 401, json: async () => ({ message: "API key is invalid" }) };
  };
  res = fakeRes();
  await handler(fakeReq(payload, cookie), res);
  check("the send still answers rather than throwing", res.body && res.body.ok === true,
        JSON.stringify(res.body));
  check("everybody is recorded as failed", res.body.sent === 0 && res.body.failed === n);
  rows = (await client.query(
    "SELECT ok, error FROM message_recipients WHERE message_id = $1", [res.body.id])).rows;
  check("with Resend's own sentence against each of them",
        rows.length === n && rows.every(r => !r.ok && /API key is invalid/.test(r.error || "")),
        JSON.stringify(rows[0]));

  console.log("4 · the record survives what a save would erase");
  const before = (await client.query("SELECT count(*)::int c FROM messages")).rows[0].c;
  const state = await io.readState(client);
  await io.writeState(client, state);
  const after = (await client.query("SELECT count(*)::int c FROM messages")).rows[0].c;
  check("a full state write leaves the sent messages alone", before === after,
        before + " → " + after);

  console.log("\n" + pass + " passed, " + fail + " failed");
  client.release();
  await pool.end();
  process.exit(fail ? 1 : 0);
})().catch(e => { console.error(e); process.exit(1); });
