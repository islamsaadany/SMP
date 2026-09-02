/* ── WHAT THE CHAT ENDPOINT REFUSES (§97) ─────────────────────────────────
   Run against a dev-server with a database behind it:

     DATABASE_URL=postgres://… NODE_TLS_REJECT_UNAUTHORIZED=0 \
       node scripts/dev-server.js 3999 &
     DATABASE_URL=postgres://… node scripts/test-chat.js <smo-password>

   THE TLS VARIABLE IS FOR §231 AND FOR NOTHING ELSE. The push section below
   stands a throwaway HTTPS server in front of the real push service — an
   endpoint is just a URL a browser hands over, so a test can hand over one of
   its own (§100.3) — and it carries a self-signed certificate the dev-server
   would otherwise refuse. Without the variable that section fails loudly
   rather than skipping: a check that asks whether it can run is a check that
   passes (§54.5).

   THE REFUSALS ARE THE POINT, and they are what a browser drive cannot reach:
   driving the product as the SMO proves the office's own path and proves
   NOTHING about the person who may hold no role at all — §94.2's lesson, that
   a check which only looks for something PRESENT cannot see a door that should
   be shut. So this signs in as a second, ordinary person and tries every one
   of the office's actions with their session.

   It creates that person and their credential DIRECTLY, and removes them
   again: there is no UI path to a password for somebody else that does not go
   through the office, and the point here is to hold a session that is not the
   office's.
   ──────────────────────────────────────────────────────────────────────── */
const pg = require("pg");
const io = require("../lib/state-io.js");
const auth = require("../lib/auth.js");

const BASE = process.env.SMP_BASE || "http://127.0.0.1:3999";

/* ── A STAND-IN PUSH SERVICE (§231, §100.3) ───────────────────────────
   An endpoint is only a URL a browser hands over, so a test can hand over one
   of its own — which means what leaves the platform is read off the wire by
   the real `web-push` doing the real thing, and nothing in `lib/push.js`
   branches for a test. HTTPS because the endpoint guard requires it, and the
   guard requires it because our own server fetches the address. */
const https = require("https");
const crypto = require("crypto");
const { execFileSync } = require("child_process");
const fs = require("fs");
const os = require("os");
const path = require("path");

const PUSH_GOT = [];
let PUSH_PORT = 0;
let PUSH_SRV = null;
const PUSH_EP = function (n) { return "https://127.0.0.1:" + PUSH_PORT + "/dev/" + n; };
/* A browser's own public values, which is exactly what a subscription
   carries — so they are safe to make here and safe to write down. */
const PUSH_ECDH = crypto.createECDH("prime256v1"); PUSH_ECDH.generateKeys();
const PUSH_P256 = PUSH_ECDH.getPublicKey().toString("base64url");
const PUSH_AUTH = crypto.randomBytes(16).toString("base64url");

function pushStandIn() {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "smp-push-"));
  const key = path.join(dir, "k.pem"), crt = path.join(dir, "c.pem");
  execFileSync("openssl", ["req", "-x509", "-newkey", "rsa:2048", "-nodes",
    "-keyout", key, "-out", crt, "-days", "1", "-subj", "/CN=127.0.0.1",
    "-addext", "subjectAltName=IP:127.0.0.1"], { stdio: "ignore" });
  PUSH_SRV = https.createServer(
    { key: fs.readFileSync(key), cert: fs.readFileSync(crt) },
    function (req, res) {
      let n = 0;
      req.on("data", function (c) { n += c.length; });
      req.on("end", function () {
        PUSH_GOT.push({ path: req.url, bytes: n,
                        auth: req.headers.authorization || "" });
        res.writeHead(201); res.end();
      });
    });
  return new Promise(function (r) {
    PUSH_SRV.listen(0, "127.0.0.1", function () {
      PUSH_PORT = PUSH_SRV.address().port; r();
    });
  });
}
const SMO_PW = process.argv[2];
if (!SMO_PW) { console.error("usage: node scripts/test-chat.js <smo-password>"); process.exit(2); }

const OTHER = { key: "chattest", name: "Dalia Chattest", pw: "TestingChat!2026" };
let pass = 0; const fails = [];
function ok(cond, what) { if (cond) { pass++; console.log("  ok   " + what); }
                          else { fails.push(what); console.log("  FAIL " + what); } }

/* A cookie jar of one, because that is all a session is here. */
async function call(cookie, body) {
  const r = await fetch(BASE + "/api/chat", {
    method: "POST",
    headers: Object.assign({ "Content-Type": "application/json" },
                           cookie ? { Cookie: cookie } : {}),
    body: JSON.stringify(body)
  });
  return { status: r.status, body: await r.json().catch(function () { return null; }) };
}
async function signIn(who, password) {
  const r = await fetch(BASE + "/api/auth", {
    method: "POST", headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ action: "login", user: who, password: password })
  });
  const j = await r.json().catch(function () { return null; });
  const set = r.headers.get("set-cookie") || "";
  return { ok: !!(j && j.ok), cookie: set.split(";")[0], why: j && j.error };
}

(async function () {
  const pool = io.getPool(pg);
  const client = await pool.connect();
  let hadSmo = false, hadChat = null;
  try {
    await io.ensureReady(client);
    await pushStandIn();

    /* ── a second person, with a password and no role at all ───────────── */
    await client.query("DELETE FROM chat_threads WHERE person_key = $1", [OTHER.key]);
    await client.query("DELETE FROM credentials WHERE person_key = $1", [OTHER.key]);
    await client.query("DELETE FROM people WHERE key = $1", [OTHER.key]);
    await client.query(
      "INSERT INTO people (key, idx, name, role, extra) VALUES ($1, 900, $2, '', $3)",
      [OTHER.key, OTHER.name, JSON.stringify({ email: "dalia.chattest@example.com" })]);
    await client.query(
      "INSERT INTO credentials (person_key, password_hash, must_change) VALUES ($1,$2,false)",
      [OTHER.key, await auth.hashPassword(OTHER.pw)]);
    await client.query("DELETE FROM login_attempts");
    /* THE ASSISTANT IS SOMEBODY ELSE'S SETTING, AND IT CHANGES EVERY COUNT IN
       THIS FILE (§125.4). This tests the HUMAN path — she writes, the office
       replies — and with the assistant on and a key present her message comes
       back with a second row beside it and her conversation is no longer
       waiting, so five assertions fail for a reason that has nothing to do
       with what any of them is about.

       It cost an hour of hunting a race that did not exist: the run after a
       restart failed and the next passed, because this file's own settings
       section happens to clear the switch on its way past. A test that reads
       a setting it does not control is a test whose result depends on what
       somebody did on the screen an hour ago. Put back in the `finally`. */
    hadChat = (await client.query(
      "SELECT extra->'chat' AS c FROM org WHERE id = 1")).rows[0];
    hadChat = hadChat ? hadChat.c : null;
    await client.query(
      "UPDATE org SET extra = jsonb_set(COALESCE(extra,'{}'::jsonb), '{chat}', " +
      "COALESCE(extra->'chat','{}'::jsonb) || '{\"assistant\":false}'::jsonb, true) WHERE id = 1");
    /* A TEST THAT LEAVES STATE BEHIND BREAKS THE NEXT ONE. This writes into the
       office's own conversation on purpose (to prove her thread does not show
       it), so it has to know whether that conversation existed before it ran —
       and put things back either way. Learned by running the browser drive
       straight after this and watching it fail on the first-time state. */
    hadSmo = (await client.query(
      "SELECT 1 FROM chat_threads WHERE person_key = 'smo'")).rowCount > 0;

    const smo = await signIn("SMO", SMO_PW);
    ok(smo.ok, "the SMO signs in" + (smo.ok ? "" : " — " + smo.why));
    const her = await signIn(OTHER.key, OTHER.pw);
    ok(her.ok, "a person with no role signs in" + (her.ok ? "" : " — " + her.why));
    if (!smo.ok || !her.ok) throw new Error("cannot continue without both sessions");

    console.log("\nANYBODY SIGNED IN MAY WRITE — that is the whole point (§71).");
    let r = await call(her.cookie, { action: "say", body: "The Care figure looks wrong to me." });
    ok(r.status === 200 && r.body.ok, "somebody with no role can write to the office");
    ok(r.body.messages && r.body.messages.length === 1, "and it comes straight back in their thread");

    console.log("\nAND READS THEIR OWN, AND ONLY THEIR OWN.");
    r = await call(smo.cookie, { action: "say", body: "A note the office wrote to itself." });
    ok(r.status === 200, "the office can write into its own conversation too");
    r = await call(her.cookie, { action: "mine" });
    ok(r.body.messages.length === 1, "her thread still holds one message, not the office's");
    ok(r.body.office === false, "and she is not told she is the office");

    console.log("\nEVERY ONE OF THE OFFICE'S ACTIONS IS REFUSED TO HER.");
    for (const body of [{ action: "queue" },
                        { action: "thread", person: "smo" },
                        { action: "reply", person: "smo", body: "let me in" },
                        { action: "flag", id: 1, flag: "issue" },
                        { action: "answered", person: "smo", waiting: false },
                        { action: "shot", id: 1 },
                        { action: "drop", person: "smo" }]) {
      r = await call(her.cookie, body);
      ok(r.status === 403 && !r.body.ok, "refused: " + body.action);
    }

    console.log("\nAND THE REFUSAL NEVER SAYS WHICH ROLE IS MISSING.");
    r = await call(her.cookie, { action: "queue" });
    ok(!/super|smoteam|smo team/i.test(String(r.body.error)),
       "the sentence does not name the office's roles: " + JSON.stringify(r.body.error));

    console.log("\nTHE OFFICE SEES EVERYBODY.");
    r = await call(smo.cookie, { action: "queue" });
    ok(r.status === 200 && r.body.ok, "the office reads the queue");
    const keys = (r.body.threads || []).map(function (t) { return t.person_key; });
    ok(keys.indexOf(OTHER.key) > -1 && keys.indexOf("smo") > -1,
       "and both conversations are on it: " + JSON.stringify(keys));
    const hers = (r.body.threads || []).filter(function (t) { return t.person_key === OTHER.key; })[0];
    ok(hers && +hers.unread === 1, "with her message counted unread");
    ok(hers && hers.waiting === true, "and her conversation waiting on us");

    console.log("\nPRESENCE IS DECIDED BY POLLING, AND BY NOTHING ELSE (§97.5).");
    /* BOTH SIDES OF THE RULE, and the second one has to be staged: she polled
       a moment ago as part of this run, so the only honest way to ask "and
       what about somebody who has been away?" is to age the row. Asserting
       only the first half would leave the whole email rule untested — a check
       that can only see the state it happens to be in. */
    await call(her.cookie, { action: "mine" });
    r = await call(smo.cookie, { action: "thread", person: OTHER.key });
    ok(r.body.here === true, "having just asked, she is here");

    await client.query(
      "UPDATE chat_threads SET here_at = now() - interval '10 minutes' WHERE person_key = $1",
      [OTHER.key]);
    r = await call(smo.cookie, { action: "thread", person: OTHER.key });
    ok(r.body.here === false, "ten minutes without asking, and she is away");
    ok(r.body.address === "dalia.chattest@example.com", "and her address is resolved on the server");

    console.log("\nA REPLY ANSWERS IT, BY THE ACT (§71).");
    r = await call(smo.cookie, { action: "reply", person: OTHER.key, body: "Looking now." });
    ok(r.status === 200 && r.body.ok, "the office replies");
    ok(r.body.here === false, "the reply agrees she was away");
    /* NO `html` WAS POSTED, so there is nothing to send — and the endpoint
       says nothing went out rather than claiming it did. */
    ok(!r.body.mailed || !r.body.mailed.sent, "and with nothing to send, no mail is claimed");
    r = await call(smo.cookie, { action: "queue" });
    const after = (r.body.threads || []).filter(function (t) { return t.person_key === OTHER.key; })[0];
    ok(after && after.waiting === false, "her conversation left the waiting list on its own");

    console.log("\nAND SHE HAS IT, WITH A NAME ON IT.");
    r = await call(her.cookie, { action: "mine" });
    ok(r.body.messages.length === 2, "the reply is in her thread");
    ok(r.body.unread === 1, "and it counts as one unread");
    ok(r.body.messages[1].from_office === true &&
       String(r.body.messages[1].by_name || "").length > 0,
       "signed by whoever answered: " + JSON.stringify(r.body.messages[1].by_name));
    await call(her.cookie, { action: "seen" });
    r = await call(her.cookie, { action: "mine" });
    ok(r.body.unread === 0, "reading it clears the count");

    console.log("\nWHAT IS REFUSED TO EVERYBODY.");
    r = await call(her.cookie, { action: "say", body: "" });
    ok(r.status === 400, "an empty message is refused");
    r = await call(her.cookie, { action: "say", body: "x", shot: "https://example.com/a.png" });
    ok(r.status === 400, "a picture given as a URL is refused, not fetched");
    r = await call(her.cookie, { action: "say", body: "x", shot: "data:image/png;base64,AAAA" });
    ok(r.status === 200, "a data URI is taken");
    r = await call("", { action: "mine" });
    ok(r.status === 401, "no session, no conversation");

    /* ── THE SETTINGS, AND THE HALF THAT IS NOT ON SCREEN (§98) ───────
       A switch that only hides a control is decoration (§42, §44). With the
       chat off the corner is not drawn at all, so nothing in the PRODUCT can
       reach these — which is exactly why they are worth a test: the browser is
       not the thing being guarded against. */
    async function setChat(patch) {
      await client.query(
        "UPDATE org SET extra = jsonb_set(COALESCE(extra,'{}'::jsonb), '{chat}', $1::jsonb, true) WHERE id = 1",
        [JSON.stringify(patch)]);
    }

    console.log("\nTHE SETTINGS TRAVEL WITH THE POLL.");
    await setChat({});
    r = await call(her.cookie, { action: "mine" });
    ok(r.body.chat && r.body.chat.on === true, "on by default when nothing was ever set");
    ok(r.body.chat.beat === 4000, "Live means 4000ms, from the shared rule");
    ok(r.body.chat.promise === "Usually answers the same day", "and the shipped promise");
    await setChat({ fast: false, promise: "We answer 9-5" });
    r = await call(her.cookie, { action: "mine" });
    ok(r.body.chat.beat === 15000, "Relaxed means 15000ms");
    ok(r.body.chat.promise === "We answer 9-5", "and the office's own words travel");

    /* ── HOW LONG SOMEBODY COUNTS AS HERE IS THE TENANT'S (§169) ─────
       The whole of this feature is that a number on a settings panel changes
       what the SERVER decides, so it is asked of the server with the row aged
       to a fixed distance and the threshold moved either side of it. A screen
       that offers the box and an endpoint still reading a constant is exactly
       the drift `lib/rules.js` exists to prevent, and nothing else here would
       have noticed it. */
    /* ── THE OFFICE IS TOLD WHAT IS WAITING (§225) ──────────────────
       Their corner is the only thing that polls on every page — the Platform
       Inbox's own clock stops the moment they navigate away — so this is the
       only place a notification for the office can come from. Asked of a REAL
       Postgres, because it is a query and a query nothing has run is a guess
       (§172, §100.3), and asked at BOTH ENDS: everybody else's poll must carry
       none of it. */
    /* ── A BOX THAT ARRIVES WITH NO TAB OPEN (§231) ─────────────────
       The MODULE is proved end to end in scripts/test-push.js; what is proved
       here is the endpoint around it — who may subscribe, whose device a row
       is written against, and that the two write paths actually SEND, which
       is the half §71 built and never wired up. */
    console.log("\nA DEVICE SUBSCRIBES, AND ONLY EVER ITS OWNER'S (§231).");
    await setChat({ popup: true });
    r = await call(her.cookie, { action: "mine" });
    ok(!!(r.body.chat && r.body.chat.vapid), "the public key travels with the poll",
       r.body.chat && (r.body.chat.vapid || "").slice(0, 12));
    await setChat({});                        /* popup off is the shipped default */
    r = await call(her.cookie, { action: "mine" });
    ok(r.body.chat.vapid === "", "...and not while notifications are off for the company",
       r.body.chat.vapid);

    const SUB = function (n) {
      return { endpoint: "https://push.example.test/dev/" + n,
               keys: { p256dh: PUSH_P256, auth: PUSH_AUTH } };
    };
    /* WITH THE COMPANY SWITCH OFF, THE SERVER REFUSES — the browser is not
       the thing being guarded against (§42, §98.2). */
    r = await call(her.cookie, { action: "pushOn", sub: SUB("a") });
    ok(r.status === 403, "with notifications off for the company, subscribing is refused", r.status);

    await setChat({ popup: true });
    r = await call(her.cookie, { action: "pushOn", sub: SUB("a") });
    ok(r.status === 200 && r.body.ok, "with it on, a device subscribes", r.status);
    let row = (await client.query(
      "SELECT person_key FROM push_subscriptions WHERE endpoint = $1",
      ["https://push.example.test/dev/a"])).rows[0];
    ok(row && row.person_key === OTHER.key,
       "...against the signed-in person, never a key from the body", row);

    /* AND A KEY IN THE BODY CHANGES NOTHING. Taking `person` from the browser
       would let anybody subscribe their own phone to somebody else's
       conversation and read every reply that person is sent (§185). */
    r = await call(her.cookie, { action: "pushOn", sub: SUB("b"), person: "smo" });
    row = (await client.query(
      "SELECT person_key FROM push_subscriptions WHERE endpoint = $1",
      ["https://push.example.test/dev/b"])).rows[0];
    ok(row && row.person_key === OTHER.key,
       "a person named in the body is ignored", row);

    /* THE SAME DEVICE AGAIN REPLACES ITS ROW, never adds a second: a browser
       re-issues its endpoint, and two rows for one device is two boxes. */
    await call(her.cookie, { action: "pushOn", sub: SUB("a") });
    let n = (await client.query(
      "SELECT count(*)::int n FROM push_subscriptions WHERE person_key = $1",
      [OTHER.key])).rows[0].n;
    ok(n === 2, "re-subscribing the same device replaces its row", n);

    /* AN ENDPOINT THAT IS NOT AN HTTPS URL IS REFUSED — our own server
       fetches it, so anything else is somebody choosing the host (§71). */
    for (const bad of ["http://push.example.test/x", "file:///etc/passwd", "not a url"]) {
      r = await call(her.cookie, { action: "pushOn",
        sub: { endpoint: bad, keys: { p256dh: PUSH_P256, auth: PUSH_AUTH } } });
      ok(r.status === 400, "refused: " + bad, r.status);
    }

    /* TURNING THE BELL OFF FORGETS THE DEVICE, and only her own. */
    await client.query(
      "INSERT INTO push_subscriptions (endpoint, person_key, p256dh, auth) VALUES ($1,$2,$3,$4) " +
      "ON CONFLICT (endpoint) DO NOTHING",
      ["https://push.example.test/dev/smo", "smo", PUSH_P256, PUSH_AUTH]);
    r = await call(her.cookie, { action: "pushOff", endpoint: "https://push.example.test/dev/a" });
    ok(r.status === 200, "a device unsubscribes", r.status);
    n = (await client.query("SELECT count(*)::int n FROM push_subscriptions WHERE endpoint = $1",
      ["https://push.example.test/dev/a"])).rows[0].n;
    ok(n === 0, "...and its row is gone", n);
    /* SCOPED TO THE SIGNED-IN PERSON, so a guessed endpoint silences nobody. */
    r = await call(her.cookie, { action: "pushOff", endpoint: "https://push.example.test/dev/smo" });
    n = (await client.query("SELECT count(*)::int n FROM push_subscriptions WHERE endpoint = $1",
      ["https://push.example.test/dev/smo"])).rows[0].n;
    ok(n === 1, "somebody else's device cannot be unsubscribed", n);

    /* ── AND THE TWO WRITE PATHS ACTUALLY SEND ──────────────────────
       §71's fault is the one to guard against here: the back half built and
       the control never wired to it. A stand-in HTTPS server in front of the
       real push service is the only place that claim is true or false. */
    console.log("\nAND A MESSAGE ACTUALLY SENDS ONE (§231).");
    await client.query("DELETE FROM push_subscriptions");
    await client.query(
      "INSERT INTO push_subscriptions (endpoint, person_key, p256dh, auth) VALUES ($1,$2,$3,$4)",
      [PUSH_EP("smo"), "smo", PUSH_P256, PUSH_AUTH]);
    await client.query(
      "INSERT INTO push_subscriptions (endpoint, person_key, p256dh, auth) VALUES ($1,$2,$3,$4)",
      [PUSH_EP("her"), OTHER.key, PUSH_P256, PUSH_AUTH]);

    PUSH_GOT.length = 0;
    await call(her.cookie, { action: "say", body: "My plan will not open." });
    await new Promise(function (r2) { setTimeout(r2, 400); });
    ok(PUSH_GOT.length === 1,
       "a question sends one box, to the office", PUSH_GOT.map(function (g) { return g.path; }));
    ok(PUSH_GOT.length === 1 && PUSH_GOT[0].path.indexOf("/smo") > 0,
       "...to the office's device and not the sender's own",
       PUSH_GOT.map(function (g) { return g.path; }));

    PUSH_GOT.length = 0;
    await call(smo.cookie, { action: "reply", person: OTHER.key, body: "Looking now." });
    await new Promise(function (r2) { setTimeout(r2, 400); });
    ok(PUSH_GOT.length === 1,
       "a reply sends one box, to the person", PUSH_GOT.map(function (g) { return g.path; }));
    ok(PUSH_GOT.length === 1 && PUSH_GOT[0].path.indexOf("/her") > 0,
       "...to their device and not the office's",
       PUSH_GOT.map(function (g) { return g.path; }));

    /* BOTH ENDS (§94.2): with the company switch off, nothing is sent at all. */
    await setChat({});
    PUSH_GOT.length = 0;
    await call(smo.cookie, { action: "reply", person: OTHER.key, body: "And again." });
    await new Promise(function (r2) { setTimeout(r2, 400); });
    ok(PUSH_GOT.length === 0, "with notifications off, nothing is sent", PUSH_GOT.length);
    await client.query("DELETE FROM push_subscriptions");
    await setChat({});

    /* ── THE OFFICE STARTS A CONVERSATION (§247) ────────────────────
       Islam: "from the platform inbox allow the smo to initiate a message
       with someone." It is a FLAG on the reply, not an action of its own —
       everything a message from the office does is written once, here — so
       what is proved is the one thing starting adds. */
    console.log("\nTHE OFFICE STARTS A CONVERSATION (§247).");
    await setChat({});
    /* A conversation that does not exist yet. */
    await client.query("DELETE FROM chat_messages WHERE person_key = $1", [OTHER.key]);
    await client.query("DELETE FROM chat_threads WHERE person_key = $1", [OTHER.key]);
    /* WITHOUT THE FLAG IT IS STILL REFUSED, which is what keeps that refusal
       meaningful for a plain reply to a bad key (§94.2: both ends). */
    r = await call(smo.cookie, { action: "reply", person: OTHER.key, body: "hello" });
    ok(r.status === 404, "a reply into no conversation is still refused", r.status);
    r = await call(smo.cookie, { action: "reply", person: OTHER.key, body: "First word.",
                                 start: true });
    ok(r.status === 200 && r.body.ok, "...and with `start` it goes", r.status);
    let msgs = (await client.query(
      "SELECT from_office, body FROM chat_messages WHERE person_key = $1 ORDER BY id",
      [OTHER.key])).rows;
    ok(msgs.length === 1 && msgs[0].from_office === true && msgs[0].body === "First word.",
       "the conversation exists with the office's message in it", msgs);
    /* IT IS NOT WAITING ON THE OFFICE — they just wrote it (§71: answered by
       the act, never by remembering to set it). */
    let th = (await client.query(
      "SELECT waiting FROM chat_threads WHERE person_key = $1", [OTHER.key])).rows[0];
    ok(th && th.waiting === false, "...and it is not waiting on the office", th);

    /* ONE CONVERSATION PER PERSON SURVIVES (§97). Starting one with somebody
       who already has a thread carries on into it — this can never make a
       second, because person_key is the primary key. */
    r = await call(smo.cookie, { action: "reply", person: OTHER.key, body: "Second word.",
                                 start: true });
    ok(r.status === 200, "starting again with the same person is accepted", r.status);
    const threads = (await client.query(
      "SELECT count(*)::int n FROM chat_threads WHERE person_key = $1", [OTHER.key])).rows[0].n;
    ok(threads === 1, "...and there is still exactly one conversation", threads);
    msgs = (await client.query(
      "SELECT count(*)::int n FROM chat_messages WHERE person_key = $1", [OTHER.key])).rows[0];
    ok(msgs.n === 2, "...with both messages in it", msgs.n);

    /* A TYPO MUST NOT MAKE A CONVERSATION WITH NOBODY. `ensureThread` will
       mint a row for any string, so this is checked against the STORED
       register (§74.2) — and a row nobody can open would sit in the queue for
       ever, answerable by no one. */
    r = await call(smo.cookie, { action: "reply", person: "nobodyatall",
                                 body: "hello?", start: true });
    ok(r.status === 404, "a person who is not on the register is refused", r.status);
    ok(((await client.query(
      "SELECT count(*)::int n FROM chat_threads WHERE person_key = $1",
      ["nobodyatall"])).rows[0]).n === 0, "...and no conversation is left behind");

    /* AND A RETIRED PERSON CANNOT SIGN IN TO READ IT. */
    await client.query(
      "UPDATE people SET extra = COALESCE(extra,'{}'::jsonb) || '{\"active\":\"false\"}'::jsonb " +
      "WHERE key = $1", [OTHER.key]);
    await client.query("DELETE FROM chat_threads WHERE person_key = $1", [OTHER.key]);
    r = await call(smo.cookie, { action: "reply", person: OTHER.key, body: "hello?",
                                 start: true });
    ok(r.status === 404, "a retired person is refused", r.status);
    await client.query("UPDATE people SET extra = extra - 'active' WHERE key = $1", [OTHER.key]);

    /* AND IT IS THE OFFICE'S ALONE — the endpoint already refuses everybody
       else every action below `reply`, and this rides on that rather than
       adding a gate of its own. */
    r = await call(her.cookie, { action: "reply", person: "smo", body: "hi", start: true });
    ok(r.status === 403, "and somebody who is not the office cannot start one", r.status);

    console.log("\nAND THE OFFICE'S POLL CARRIES WHAT IS WAITING (§225).");
    await setChat({});
    r = await call(smo.cookie, { action: "mine" });
    ok(r.body.office === true, "the office's poll says so");
    ok("popup" in (r.body.chat || {}),
       "and the popup setting travels with it — named there or it never arrives");
    /* NOTHING WAITING: a count of nought and nobody to name. */
    await client.query("UPDATE chat_threads SET waiting = false");
    r = await call(smo.cookie, { action: "mine" });
    ok(r.body.waiting === 0, "nought while nobody is waiting");
    ok(!r.body.waitingWho && !r.body.waitingBody, "...and nobody to name");
    /* SOMEBODY WRITES IN. */
    await call(her.cookie, { action: "say", body: "Mobile's plan will not open for me." });
    r = await call(smo.cookie, { action: "mine" });
    ok(r.body.waiting >= 1, "a question raises the count");
    ok(!!r.body.waitingWho && r.body.waitingWho !== OTHER.key,
       "...naming who wrote, never the bare person key");
    ok(r.body.waitingBody === "Mobile's plan will not open for me.",
       "...with their first line, the same two facts everybody else's box carries");
    /* AND NOBODY ELSE IS TOLD ANY OF IT. */
    r = await call(her.cookie, { action: "mine" });
    ok(r.body.waiting === undefined && r.body.waitingWho === undefined,
       "somebody who is not the office is told none of it");

    console.log("\nAND THE AWAY THRESHOLD IS A SETTING, NOT A CONSTANT (§169).");
    await client.query(
      "UPDATE chat_threads SET here_at = now() - interval '7 minutes' WHERE person_key = $1",
      [OTHER.key]);
    await setChat({});
    r = await call(smo.cookie, { action: "thread", person: OTHER.key });
    ok(r.body.here === false, "seven minutes out, and the shipped three calls her away");
    await setChat({ away: 20 });
    r = await call(smo.cookie, { action: "thread", person: OTHER.key });
    ok(r.body.here === true, "...and twenty calls the same row here");
    r = await call(smo.cookie, { action: "queue" });
    ok(r.body.hereMinutes === 20, "the office's page is told the number in force");
    /* A STORED VALUE OUT OF RANGE IS CLAMPED, NEVER OBEYED — the endpoint runs
       on every poll, so a nonsense number must answer something rather than
       throw or divide by nothing. */
    await setChat({ away: 99999 });
    r = await call(smo.cookie, { action: "queue" });
    ok(r.body.hereMinutes === 120, "an absurd value is clamped to the ceiling");
    await setChat({ away: "nonsense" });
    r = await call(smo.cookie, { action: "queue" });
    ok(r.body.hereMinutes === 3, "and a value that is not a number reads as the default");
    await setChat({});
    await client.query(
      "UPDATE chat_threads SET here_at = now() - interval '10 minutes' WHERE person_key = $1",
      [OTHER.key]);

    console.log("\nWITH THE CHAT OFF, THE SERVER REFUSES — NOT JUST THE SCREEN.");
    await setChat({ on: false });
    r = await call(her.cookie, { action: "say", body: "let me through anyway" });
    ok(r.status === 403, "writing is refused");
    ok(/off/i.test(String(r.body.error)), "and it says why: " + JSON.stringify(r.body.error));
    r = await call(smo.cookie, { action: "reply", person: OTHER.key, body: "hello?" });
    ok(r.status === 403, "and so is replying — nobody could see it");
    r = await call(her.cookie, { action: "mine" });
    ok(r.body.chat.on === false, "the corner is told to take itself down");
    ok(r.body.ok === true, "but reading the conversation still works");
    r = await call(smo.cookie, { action: "queue" });
    ok(r.status === 200 && r.body.threads.length > 0,
       "and the office can still read every conversation");

    console.log("\nSCREENSHOTS OFF MEANS THE PICTURE IS REFUSED, NOT DROPPED.");
    await setChat({ shots: false });
    r = await call(her.cookie, { action: "say", body: "with a picture",
                                 shot: "data:image/png;base64,AAAA" });
    ok(r.status === 400, "a picture is refused when they are turned off");
    ok(/screenshot/i.test(String(r.body.error)), "and named: " + JSON.stringify(r.body.error));
    r = await call(her.cookie, { action: "say", body: "without one" });
    ok(r.status === 200, "and the words still go through");

    console.log("\nEMAIL OFF MEANS NO CHASE, AND IT SAYS SO.");
    await setChat({ mail: false });
    await client.query(
      "UPDATE chat_threads SET here_at = now() - interval '10 minutes' WHERE person_key = $1",
      [OTHER.key]);
    r = await call(smo.cookie, { action: "reply", person: OTHER.key, body: "still looking" });
    ok(r.status === 200 && r.body.here === false, "she is away, and the reply lands");
    ok(r.body.mailed && r.body.mailed.sent === false &&
       /turned off/i.test(String(r.body.mailed.why)),
       "no email went out, and the reason is the setting: " + JSON.stringify(r.body.mailed));
    await setChat({});

    console.log("\nAND DROPPING ONE IS THE SUPER USER'S ALONE (§89).");
    r = await call(smo.cookie, { action: "drop", person: OTHER.key });
    ok(r.status === 200 && r.body.ok, "the Super user drops a conversation");
    const left = +(await client.query(
      "SELECT count(*) AS n FROM chat_messages WHERE person_key = $1", [OTHER.key])).rows[0].n;
    ok(left === 0, "and it takes its messages with it (CASCADE)");
  } finally {
    await client.query("DELETE FROM chat_threads WHERE person_key = $1", [OTHER.key]).catch(function(){});
    if (!hadSmo) {
      await client.query("DELETE FROM chat_threads WHERE person_key = 'smo'").catch(function(){});
    } else {
      await client.query(
        "DELETE FROM chat_messages WHERE person_key = 'smo' AND body = $1",
        ["A note the office wrote to itself."]).catch(function(){});
    }
    if (PUSH_SRV) { try { PUSH_SRV.close(); } catch (e) {} }
    await client.query("DELETE FROM credentials WHERE person_key = $1", [OTHER.key]).catch(function(){});
    await client.query("DELETE FROM people WHERE key = $1", [OTHER.key]).catch(function(){});
    await client.query("DELETE FROM login_attempts").catch(function(){});
    /* The tenant's chat settings back exactly as they were — including absent,
       which is not the same as `{}` (§50.6: a reader that creates what it
       looked for puts a phantom change into every save). */
    if (hadChat === null) {
      await client.query("UPDATE org SET extra = extra - 'chat' WHERE id = 1").catch(function(){});
    } else {
      await client.query(
        "UPDATE org SET extra = jsonb_set(COALESCE(extra,'{}'::jsonb), '{chat}', $1::jsonb, true) " +
        "WHERE id = 1", [JSON.stringify(hadChat)]).catch(function(){});
    }
    client.release();
    await pool.end();
  }

  console.log("\n" + pass + " passed, " + fails.length + " failed");
  if (fails.length) { fails.forEach(function (f) { console.log("  · " + f); }); process.exit(1); }
})().catch(function (e) { console.error(e); process.exit(1); });
