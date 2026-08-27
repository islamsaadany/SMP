/* THE EMAIL GREETS ITS RECEIVER — THE SERVER HALF (spec 021).
   ═══════════════════════════════════════════════════════════════════════

   Islam: "customize the email by the first name of the reciever like starting
   the email with Dear Ahmed ... it's a turn on and off option."

   WHAT THIS ASSERTS IS THE ONLY THING THE FEATURE CLAIMS: that each of the
   seventy-odd emails a send produces carries THAT PERSON'S first name and
   nobody else's. Every other check in this repository can be satisfied by a
   build that greets everybody "Dear Ahmed", because the browser only ever
   posts ONE html and the personalisation happens after it leaves.

   SO IT STANDS IN FRONT OF THE PROVIDER AND READS WHAT WENT. `SMP_RESEND_ENDPOINT`
   points the real mailer at a server this file owns (§100.3), so nothing is
   stubbed inside the product and there is no second code path: api/mail.js
   runs exactly as it runs in production and the messages are caught on the
   wire.

   IT SPAWNS ITS OWN DEV-SERVER, because the endpoint has to be in the child's
   environment before it loads lib/mailer.js — a test that asked somebody to
   export three variables first is a test that gets run wrong.

   Usage: DATABASE_URL=… node scripts/test-email-greeting.js <smo-password>
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
  { key: "gt_ahmed",  name: "Ahmed Mostafa Mohamed El Gebely", email: "gt1@example.com",
    want: "Ahmed" },
  { key: "gt_abd",    name: "Abd El Moniem Mohamed Abd El Moniem Mahmoud",
    email: "gt2@example.com", want: "Abd El Moniem" },
  { key: "gt_typed",  name: "Mohamed Essam Farouk", known: "Mo", email: "gt3@example.com",
    want: "Mo" },
  { key: "gt_noname", name: "   ", email: "gt4@example.com", want: "" }
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
  const added = [];
  try {
    await io.ensureReady(client);

    /* The cast joins the register, and is taken out again in the finally —
       this runs against a real tenant and a test that leaves people behind is
       a test that changes the thing it measures. */
    /* `email` and `known` are not COLUMNS — state-io files every key it does
       not recognise into `extra` and reads it back (§52), which is why a
       register can grow a field without a migration. Written the same way
       here, or the rows would be shaped unlike every real one. */
    let idx = ((await client.query("SELECT COALESCE(MAX(idx),0) AS m FROM people"))
                 .rows[0].m) + 1;
    for (const p of CAST) {
      const extra = { email: p.email };
      if (p.known) extra.known = p.known;
      await client.query(
        "INSERT INTO people (key, idx, name, extra) VALUES ($1,$2,$3,$4) " +
        "ON CONFLICT (key) DO UPDATE SET name=EXCLUDED.name, extra=EXCLUDED.extra",
        [p.key, idx++, p.name, JSON.stringify(extra)]);
      added.push(p.key);
    }

    resend = await fakeResend();
    const rport = resend.address().port;

    dev = spawn(process.execPath, [path.join(__dirname, "dev-server.js"), "3987"], {
      env: Object.assign({}, process.env, {
        RESEND_API_KEY: "test-key-not-real",
        SMP_MAIL_FROM: "smp@example.com",
        SMP_RESEND_ENDPOINT: "http://127.0.0.1:" + rport
      }),
      stdio: "ignore"
    });
    base = "http://127.0.0.1:3987";
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

    /* THE HTML IS BUILT THE WAY THE PAGE BUILDS IT — the region markers come
       from the shared module, which is exactly what src/mail.js writes. */
    const keys = CAST.map(function (p) { return p.key; });
    function htmlWith(greeting) {
      const p = '<p style="margin:0 0 16px;font:400 15px/1.6 Helvetica,Arial,sans-serif;color:#1B2330">';
      const greet = greeting
        ? Rules.GREET_OPEN + p + greeting + " " + Rules.GREET_NAME + ",</p>" + Rules.GREET_CLOSE
        : "";
      return "<html><body><div data-mail-body>" + greet +
             p + "The cycle opens on Monday.</p></div></body></html>";
    }

    /* ══ 1 · WITH THE GREETING ON ═══════════════════════════════════════ */
    console.log("\n1 · every recipient gets their own name");
    CAUGHT = [];
    let out = await mail({ action: "send", subject: "Cycle opens",
      body: "The cycle opens on Monday.", greet: "Dear",
      criteria: { keys: keys }, html: htmlWith("Dear") });
    ok(out.status === 200 && out.body && out.body.ok, "the send is accepted",
       JSON.stringify(out.body));
    ok(CAUGHT.length === CAST.length,
       "one message per person (" + CAST.length + ")", "caught " + CAUGHT.length);

    const byAddr = {};
    CAUGHT.forEach(function (m) { byAddr[[].concat(m.to)[0]] = m.html || ""; });

    CAST.forEach(function (p) {
      const h = byAddr[p.email] || "";
      if (p.want) {
        ok(h.indexOf("Dear " + p.want + ",") > -1,
           p.email + " is greeted “Dear " + p.want + ",”",
           h.slice(h.indexOf("data-mail-body"), h.indexOf("data-mail-body") + 160));
      } else {
        /* NEVER "Dear ,". The whole line goes, and the message still arrives. */
        ok(h.indexOf("Dear ,") < 0 && !/Dear\s*,/.test(h),
           p.email + " gets NO greeting line rather than “Dear ,”");
        ok(h.indexOf("The cycle opens on Monday.") > -1,
           p.email + " still receives the message itself");
      }
      ok(h.indexOf(Rules.GREET_OPEN) < 0 && h.indexOf(Rules.GREET_NAME) < 0,
         p.email + " carries no leftover markers");
    });

    /* NOBODY ELSE'S NAME. The assertion that separates this from a build that
       greets everybody with the first recipient's name — which is exactly what
       a single shared html would do. */
    CAST.forEach(function (p) {
      if (!p.want) return;
      const h = byAddr[p.email] || "";
      const others = CAST.filter(function (q) { return q.want && q.want !== p.want; });
      ok(others.every(function (q) { return h.indexOf("Dear " + q.want + ",") < 0; }),
         p.email + " carries nobody else's name");
    });

    ok((await client.query(
        "SELECT greet FROM messages ORDER BY id DESC LIMIT 1")).rows[0].greet === "Dear",
       "the record remembers the greeting word");

    /* ══ 2 · WITH IT OFF ════════════════════════════════════════════════ */
    console.log("\n2 · off sends exactly what it sent before this existed");
    CAUGHT = [];
    out = await mail({ action: "send", subject: "Cycle opens",
      body: "The cycle opens on Monday.",
      criteria: { keys: keys }, html: htmlWith(null) });
    ok(out.status === 200 && out.body && out.body.ok, "the send is accepted");
    const bodies = CAUGHT.map(function (m) { return m.html || ""; });
    ok(bodies.length === CAST.length, "one message per person");
    ok(new Set(bodies).size === 1, "every recipient gets the IDENTICAL email",
       new Set(bodies).size + " distinct");
    ok(bodies[0].indexOf("Dear") < 0, "and no greeting anywhere in it");
    ok((await client.query(
        "SELECT greet FROM messages ORDER BY id DESC LIMIT 1")).rows[0].greet === null,
       "the record stores NULL rather than an empty word");

    /* ══ 3 · A TYPED TOKEN IN THE MESSAGE IS NOT A WAY IN ═══════════════ */
    console.log("\n3 · nothing outside the region is substituted");
    CAUGHT = [];
    const nasty = htmlWith("Dear").replace("The cycle opens on Monday.",
      "The cycle opens on Monday. " + Rules.GREET_NAME + " and " + Rules.GREET_OPEN);
    out = await mail({ action: "send", subject: "Cycle opens",
      body: "x", greet: "Dear", criteria: { keys: [CAST[0].key] }, html: nasty });
    ok(out.status === 200, "the send is accepted");
    const h0 = (CAUGHT[0] || {}).html || "";
    ok(h0.indexOf("Dear Ahmed,") > -1, "the real greeting is still filled");
    ok(h0.indexOf("Monday. " + Rules.GREET_NAME) > -1,
       "a token typed into the body is left exactly as it was");

    /* ══ 4 · THE DRAFT REMEMBERS IT, AND OFF IS AN ABSENCE ══════════════ */
    console.log("\n4 · a draft round-trips the switch");
    let d = await mail({ action: "draftSave", subject: "s", body: "b",
                         greet: "Hi", criteria: { keys: keys } });
    ok(d.body && d.body.ok && d.body.id, "a draft saves with the greeting on");
    const did = d.body.id;
    let o = await mail({ action: "draftOpen", id: did });
    ok(o.body && o.body.draft && o.body.draft.greet === "Hi",
       "it reopens with the same word", JSON.stringify(o.body && o.body.draft));
    await mail({ action: "draftSave", id: did, subject: "s", body: "b",
                 greet: null, criteria: { keys: keys } });
    o = await mail({ action: "draftOpen", id: did });
    ok(o.body && o.body.draft && o.body.draft.greet === null,
       "turning it off puts the column back to NULL, not to an empty string",
       JSON.stringify(o.body && o.body.draft && o.body.draft.greet));
    await mail({ action: "draftDelete", id: did });

    /* ══ 5 · THE NAME RULE ITSELF ══════════════════════════════════════ */
    console.log("\n5 · the first name, kept whole");
    ok(Rules.firstName({ name: "Ahmed Mostafa Mohamed El Gebely" }) === "Ahmed",
       "an ordinary name gives one word");
    ok(Rules.firstName({ name: "Abd El Moniem Mohamed Mahmoud" }) === "Abd El Moniem",
       "a compound first name is kept whole, never “Abd”");
    ok(Rules.firstName({ name: "Mohamed Essam", known: "Mo" }) === "Mo",
       "a typed short name wins over the guess");
    ok(Rules.firstName({ name: "   " }) === "" && Rules.firstName(null) === "",
       "an unusable name gives nothing at all");
    ok(Rules.greetFill("<p>no region here</p>", "Ahmed") === "<p>no region here</p>",
       "html with no region comes back byte-identical");
    ok(Rules.greetFill(Rules.GREET_OPEN + "Dear " + Rules.GREET_NAME + "," +
                       Rules.GREET_CLOSE + "rest", "") === "rest",
       "an empty name removes the whole region");
    ok(Rules.greetFill(Rules.GREET_OPEN + "Dear " + Rules.GREET_NAME + "," +
                       Rules.GREET_CLOSE, "A<b>&") === "Dear A&lt;b&gt;&amp;,",
       "a name holding markup is escaped");

    /* ══ 6 · THE BUILDER'S TWO MODES ═══════════════════════════════════
       An ABSENT name means "the server will fill it"; a name that is PRESENT
       and EMPTY means the caller looked and there is none — which is what
       `Send me a copy` hands over when the signed-in sender's own row has no
       usable name. Reading those as one answer emits markers nobody fills,
       and an HTML comment renders as nothing, so the reader gets "Dear ,":
       the only one this feature can produce, and it is on the path no server
       ever touches. */
    console.log("\n6 · the builder tells an absent name from an empty one");
    const MAIL = new Function("SMPRules",
      require("fs").readFileSync(
        __dirname + "/../SMP-Project-Folder/src/mail.js", "utf8") + ";return MAIL;")(Rules);
    const region = MAIL.html({ body: "x", greeting: { word: "Dear" } });
    ok(region.indexOf(Rules.GREET_OPEN) > -1,
       "no name at all leaves the region for the server");
    const none = MAIL.html({ body: "x", greeting: { word: "Dear", name: "" } });
    ok(none.indexOf(Rules.GREET_OPEN) < 0 && !/Dear\s*,/.test(none),
       "an empty name writes no greeting, and no leftover region");
    const named = MAIL.html({ body: "x", greeting: { word: "Hi", name: "Ahmed" } });
    ok(named.indexOf("Hi Ahmed,") > -1 && named.indexOf(Rules.GREET_OPEN) < 0,
       "a name is written straight in, with no region");
    ok(MAIL.html({ body: "x" }).indexOf("Dear") < 0,
       "and no greeting at all when none was asked for");

  } finally {
    for (const k of added) {
      await client.query("DELETE FROM message_recipients WHERE person_key = $1", [k]);
      await client.query("DELETE FROM people WHERE key = $1", [k]);
    }
    client.release();
    await pool.end();
    if (dev) dev.kill();
    if (resend) resend.close();
  }

  console.log("\n" + pass + " passed, " + fails.length + " failed");
  if (fails.length) { fails.forEach(function (f) { console.log("  · " + f); }); process.exit(1); }
})().catch(function (e) { console.error(e); process.exit(1); });
