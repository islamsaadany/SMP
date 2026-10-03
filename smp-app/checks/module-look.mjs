/* EVERY COLOUR ON A MODULE'S OWN PAGE, MEASURED AGAINST ITS BACKGROUND
   (audit fix 06, 2026-10-03).

   WHAT THIS FILE IS FOR. `scripts/contrast-sweep.py` opens ONE file — the
   frozen platform — and `checks/platform-look.py` opens the console. Between
   them they reach Strategy and Forefront's own two pages, and that is the
   whole of what any check has ever measured. **Insights, Meeting Notes, the
   Internal Tracker, Portfolio and the Copilot are five more surfaces, served
   rather than baked, and not one of them has ever been opened by a contrast
   check at all.** Each draws its own stylesheet beside the shared top bar, so
   each is a palette nobody has read — and a colour that cannot be read is a
   screen somebody cannot use, which is not a preference (§38.4, §38.5).

   THE ARITHMETIC IS READ OUT OF ITS ONE SOURCE, never copied (§67, §53.5):
   `contrast-sweep.py` holds the ratio, the gradient stops and the
   pseudo-element cover rule (§68.10's `.gauge` lesson), and
   `platform-look.py` holds the gradient-text exclusion — both are lifted from
   those files at run time and this check refuses BY NAME if either block has
   moved, because a copy here would be the second definition of each.

   WHAT IS DRIVEN AND WHAT IS READ (§100.3): every page is SERVED through the
   module's own `serve()` — the same function the route calls — over a real
   port, and OPENED in Chromium in both themes. Nothing here reads a
   stylesheet or reasons about a token: a rule that provably matches can
   provably do nothing (§93.11), so what is measured is the paint.

   THE STATE IS MADE (§255), through each module's own lib writers rather than
   raw SQL, because an empty page is exactly the page whose colours are least
   exercised — a sweep of five empty states is a sweep that proves least, and
   a second definition of what a row looks like would report a working build
   broken (§100.3).

   BOTH ENDS (§94.2): the pages are asserted to have been DRAWN — real
   headings, real rows — before their colours are believed, or a build serving
   five blank documents passes every "no contrast failure" assertion here
   (§113.8). And anything the gradient-text exclusion sets aside is PRINTED
   rather than asserted about, so the cost stays visible in every run.

     DATABASE_URL_UNPOOLED=postgres://owner@… SMP_CHROME=… npm run check:look
     SMP_BREAK=bar-ink npm run check:look   # must go red, on all five modules  */
import pg from "pg";
import { createServer } from "node:http";
import { readFileSync, existsSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const HERE = dirname(fileURLToPath(import.meta.url));
const APP = join(HERE, "..");
const REPO = join(APP, "..");

let ok = 0;
const bad = [];
const check = (what, good, detail) => {
  if (good) { ok++; console.log("  ok   " + what); }
  else { bad.push(what); console.log("  FAIL " + what + (detail === undefined ? "" : "  — " + String(detail).slice(0, 300))); }
};
const section = (n) => console.log("\n" + n);
/* EVERY PROBE DEGRADES (§215): a thrown probe is a failure in the throw's own
   words, never a run that stopped and printed fewer failures. */
const probe = async (what, fn) => { try { return await fn(); } catch (e) { check(what, false, "threw: " + String((e && e.message) || e)); return undefined; } };

/* ── THE TWO BORROWED BLOCKS ──────────────────────────────────────────── */
function contrastJs() {
  const src = readFileSync(join(REPO, "scripts", "contrast-sweep.py"), "utf8");
  const m = /JS = r"""(.*?)"""/s.exec(src);
  if (!m) throw new Error("contrast-sweep.py no longer holds `JS` — this check READS it, and a copy here would be the second definition of the arithmetic (§51.11, §67)");
  return m[1];
}
function clipJs() {
  const src = readFileSync(join(REPO, "SMP-Project-Folder", "src", "checks", "platform-look.py"), "utf8");
  const m = /CLIP_JS = """(.*?)"""/s.exec(src);
  if (!m) throw new Error("platform-look.py no longer holds `CLIP_JS` — this check READS its gradient-text exclusion (§68.10), and a copy here would be the second definition");
  return m[1];
}
/* PYTHON'S PLAYWRIGHT CALLS A FUNCTION-SHAPED STRING AND NODE'S MERELY
   EVALUATES IT, so every `() => …` handed to `page.evaluate` as a string
   comes back as the function object — which does not serialise, so the answer
   is `undefined` and NOTHING IS THROWN. `call()` wraps and calls, and every
   evaluate in this file goes through it.

   IT IS ONE HELPER BECAUSE THE FIRST FIX WAS NOT (§51.11, §100.3): the two
   borrowed blocks were corrected when the first run died on
   `Cannot read properties of undefined`, and the four function-shaped strings
   this file writes itself were left — a theme that was never set (so the dark
   half of the sweep measured light twice), two menus that were never opened,
   and a width read that answered `undefined`, where `undefined > 1` is false
   and the sideways-scroll assertion passed on nothing (§113.8). A fault fixed
   where it threw and left where it is silent is the same fault, undetected —
   and what found it was the control below, not a failure. */
const call = (src, arg) => "(" + src + ")(" + (arg === undefined ? "" : JSON.stringify(arg)) + ")";
const CONTRAST = call(contrastJs(), null);
const CLIP = call(clipJs());

/* §68.10: a contrast reader measures gradient-painted text as exactly 1:1,
   because the ink is transparent by design. The exclusion asks the PAGE which
   elements are painted that way rather than excusing a tag name. */
const notClipPainted = (findings, painted) =>
  findings.filter((f) => !painted.some((t) => t && f.text && (f.text.includes(t) || t.includes(f.text))));

const { usePools } = await import("../lib/db.ts");
const { SCHEMA } = await import("../db/schema-name.mjs");
const { serverFor } = await import("../modules/registry.ts");
const { TOPBAR_SCRIPT } = await import("../lib/topbar.ts");
const T = await import("../lib/tracker.ts");
const N = await import("../lib/notes.ts");
const L = await import("../lib/library.ts");
const C = await import("../lib/copilot.ts");
const P = await import("../lib/portfolio-io.ts");
const { todayIn } = await import("../lib/day.ts");

/* ══ the database ═════════════════════════════════════════════════════ */
const URL_ = process.env.DATABASE_URL_UNPOOLED || process.env.DATABASE_URL || "";
if (!URL_) {
  console.log("\nNo DATABASE_URL — every page here is served from a real tenant. A check that cannot run is not a check that passed (§54.5).");
  process.exit(1);
}
const pool = new pg.Pool({ connectionString: URL_, max: 4, options: "-c search_path=" + SCHEMA });
const appUrl = new URL(URL_);
appUrl.username = "smp_app";
appUrl.password = process.env.SMP_APP_PASSWORD || "smp_app";
const appPool = new pg.Pool({ connectionString: appUrl.toString(), max: 4, options: "-c search_path=" + SCHEMA });
usePools(pool, appPool);
const owner = async (sql, args) => (await pool.query(sql, args)).rows;
async function asTenant(tenantId, fn) {
  const c = await pool.connect();
  try {
    await c.query("BEGIN");
    await c.query("SET LOCAL search_path TO " + SCHEMA);
    await c.query("SET LOCAL ROLE smp_app");
    await c.query("SELECT set_config('app.tenant_id', $1, true)", [tenantId]);
    const out = await fn(c);
    await c.query("COMMIT");
    return out;
  } catch (e) {
    await c.query("ROLLBACK").catch(() => {});
    throw e;
  } finally { c.release(); }
}

const WIDTHS = [1920, 1500, 1280, 1000];
const HAVE = ["strategy", "portfolio", "insights", "tracker", "notes", "copilot"];

let A_ = null, srv = null, browser = null;
try {
  await owner("SET search_path TO " + SCHEMA);
  /* A run killed before its `finally` leaves its world behind (§442.15), and
     the console's Memory page opens on the FIRST client BY NAME — so anything
     of this file's own older than an hour goes before we start. A concurrent
     run is untouched. */
  await owner("DELETE FROM tenants WHERE key LIKE 'look%' AND created_at < now() - interval '1 hour'").catch(() => {});

  const TODAY = todayIn();
  const stamp = "look" + Date.now().toString(36);
  const [{ id: A }] = await owner("INSERT INTO tenants (key, name) VALUES ($1,$2) RETURNING id", [stamp + "-a", "Raya Trade"]);
  A_ = A;
  const person = async (key, name, seat, idx, unit) => {
    const [u] = await owner(
      "INSERT INTO users (email, name, kind, is_admin, must_change, password_hash) VALUES ($1,$2,'client',false,false,'x') RETURNING id",
      [stamp + "-" + key + "@example.test", name]);
    await owner("INSERT INTO people (tenant_id, key, idx, name, unit_key, extra) VALUES ($1,$2,$3,$4,$5,$6)",
      [A, key, idx, name, unit || null, JSON.stringify({ email: key + "@raya.test" })]);
    await owner("INSERT INTO tenant_users (tenant_id, user_id, person_key, seat) VALUES ($1,$2,$3,$4)", [A, u.id, key, seat]);
  };
  await owner("INSERT INTO units (tenant_id, key, idx, name, active) VALUES ($1,'mobile',0,'Mobile',true)", [A]);
  await person("islam", "Islam Saadany", "super", 0);
  await person("noran", "Noran Essam", "smoteam", 1);
  await person("ramy", "Ramy Behairy", "none", 2, "mobile");

  /* ══ THE STATE, THROUGH EACH MODULE'S OWN WRITERS ═══════════════════ */
  const D = (n) => new Date(Date.parse(TODAY + "T00:00:00Z") + n * 864e5).toISOString().slice(0, 10);

  /* The Tracker: one action in each status, one late and one with a note, so
     every pill, every week word and the strip's four cards are drawn. */
  await asTenant(A, async (c) => {
    const a1 = await T.addAction(c, { title: "Draft the Q3 board pack", ownerKey: "islam", by: "islam", due: D(2), description: "Figures from Finance by Tuesday." });
    const a2 = await T.addAction(c, { title: "Chase the Mobile submission", ownerKey: "noran", by: "islam", due: D(-9) });
    const a3 = await T.addAction(c, { title: "Book the review room", ownerKey: "islam", by: "islam", due: D(16) });
    const a4 = await T.addAction(c, { title: "Send the cycle note", ownerKey: "noran", by: "islam", due: D(-2) });
    await T.setStatus(c, a2.id, "in_progress", "islam");
    await T.setStatus(c, a4.id, "done", "islam");
    await T.addAction(c, { title: "Nothing dated yet", ownerKey: "islam", by: "islam", due: null });
    return [a1, a3];
  });

  /* Meeting Notes: one note with attendees, a raw note and sent minutes, so
     the minutes panel and the sent record are both on the page. */
  const noteId = await asTenant(A, async (c) => {
    const n = await N.newNote(c, "islam", TODAY);
    await N.setFields(c, n.id, {
      title: "Q3 review preparation",
      raw: "ramy: figures by the 20th\nagreed: drafts circulate on the 22nd",
      attendees: [{ key: "islam" }, { key: "ramy" }, { name: "Karim Fawzy", email: "karim@partner.test" }],
      /* An action is `{what, who, when}` and a bare string is DROPPED by
         `actionLines` — so a fixture written in strings would claim six parts
         and make five, silently (§443's own lesson). The shape is read off
         `lib/notes.ts`'s `ActionLine` rather than guessed at. */
      minutes: N.minutesOf({
        summary: "The cycle opens on the 20th and the drafts circulate two days later.",
        discussed: ["Where the figures come from", "What the board pack has to carry"],
        agreed: ["Finance sends the revenue lines by the 20th"],
        actions: [
          { what: "Send the revenue lines", who: "Ramy Behairy", when: "the 20th" },
          { what: "Circulate the drafts", who: "Islam Saadany", when: "the 22nd" },
        ],
        open: ["Whether the Nigeria numbers are in scope"],
        next: "Thursday, same time.",
      }),
    }, "islam");
    await N.newNote(c, "islam", D(-14));
    return n.id;
  });

  /* Insights: three published reports across categories and one draft — the
     library has no write path in the module at all (it is written from the
     console), so the rows come from lib/library.ts, which is that writer. */
  await asTenant(A, async (c) => {
    const pub = async (title, summary, cats, date) => {
      const it = await L.insertItem(c, "insights", { title, summary, categories: cats, reportDate: date });
      await L.setState(c, it.id, "published", "islam");
    };
    await pub("Egypt macro outlook, Q3", "Inflation eases but the devaluation keeps imported input costs high through the half.", ["Macro"], D(-12));
    await pub("Consumer electronics: the share picture", "Three of five categories lost share to grey-market imports this quarter.", ["Market", "Sector"], D(-40));
    await pub("Board reporting practice", "What a quarterly pack carries, and what it leaves to the appendix.", ["Governance"], D(-70));
    await L.insertItem(c, "insights", { title: "A draft nobody has published", summary: "Still being written.", categories: ["Analysis"], reportDate: null });
  });

  /* The Copilot: two chats (one with an exchange) and a deliverable with two
     versions, so the rails, the conversation and the version line are drawn. */
  const chatId = await asTenant(A, async (c) => {
    const ch = await C.newChat(c, { place: "mobile", section: "foundation", title: "Sharpening the End in Mind", by: "islam" });
    await C.recordSaid(c, ch.id, { body: "The current end in mind reads as a slogan. What would make it measurable?", by: "islam", fileIds: [], pasted: false });
    await C.recordAnswer(c, ch.id, {
      body: "The line commits to no horizon and no measure. Three ways to tighten it, in rising order of commitment.",
      part: { options: [{ label: "Add a year" }, { label: "Add a measure" }], source: "assumed" },
      assumptions: ["The horizon is the planning period, not the cycle."],
    });
    await C.newChat(c, { place: "mobile", section: "analysis", title: "Reading the SWOT against the market", by: "noran" });
    const dv = await C.newDeliverable(c, {
      place: "mobile", section: "foundation", title: "End in Mind — Mobile", type: "End in Mind", kind: "promotable",
      approach: "guided", body: { text: "To be the first place Egypt shops for a connected device." },
      note: "First draft from the Copilot.", by: "islam", chatId: ch.id, chatTitle: "Sharpening the End in Mind",
    });
    await C.addVersion(c, dv, { body: { text: "To be the first place Egypt shops for a connected device, by 2028." }, note: "Horizon added.", by: "islam" });
    return ch.id;
  });

  /* Portfolio: one project with a charter, a plan either side of today, a
     signed-off activity, one waiting and one overdue — so every pill, bar and
     chip on all four tabs is drawn. The rows are placed RELATIVE to today
     (§440), or the sweep goes stale on whatever day it is next run. */
  const projId = await asTenant(A, async (c) => {
    const pr = await P.addProject(c, { name: "Culture Transformation", by: "islam" });
    /* The field names are `CHARTER_FIELDS`' own — a name outside that list
       THROWS rather than being ignored (§42 fails closed), which is how the
       first draft of this fixture was found to be writing two fields the
       charter does not have. */
    await P.setCharter(c, pr.id, "brief", "Make the stated values the ones people are actually managed by.");
    await P.setCharter(c, pr.id, "inScope", "The three retail units and the two shared functions.");
    await P.setCharter(c, pr.id, "outScope", "The Nigeria business, which is reviewed separately.");
    await P.setCharter(c, pr.id, "deliverables", "An attribute survey, two workshops and a written set of behaviours.");
    await P.setCharter(c, pr.id, "risks", "Workshop attendance in the retail units during the selling season.");
    await P.setCharter(c, pr.id, "agreedStart", D(-60));
    await P.setCharter(c, pr.id, "agreedEnd", D(30));
    /* ON THE TENANT'S OWN CONNECTION, never the owner's: the project above is
       inside this uncommitted transaction, so a second connection cannot see
       it and every foreign key here would be refused — and `tenant_id` comes
       from `app.tenant_id` by column default, which is how the product writes
       (§314's one line). */
    const mem = (key, role) => c.query("INSERT INTO portfolio_members (project_id, person_key, role) VALUES ($1,$2,$3)", [pr.id, key, role]);
    await mem("islam", "lead");
    await mem("ramy", "contributor");
    const ph = async (name, pos) => (await c.query(
      "INSERT INTO portfolio_phases (project_id, name, pos) VALUES ($1,$2,$3) RETURNING id", [pr.id, name, pos])).rows[0].id;
    const act = async (o) => (await c.query(
      `INSERT INTO portfolio_activities
         (phase_id, name, description, pos, planned_start, planned_end, actual_start, actual_end,
          assignee_key, assignee_name, status, progress, is_milestone, signed_off_by, signed_off_at)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15) RETURNING id`,
      [o.phase, o.name, o.about || "", o.pos, o.s, o.e, o.rs || null, o.re || null,
       o.who || null, o.whoName || "", o.status, o.pct ?? 0, o.ms === true, o.offBy || "", o.offAt || null])).rows[0].id;
    const P1 = await ph("Culture audit", 0);
    const P2 = await ph("Alignment workshops", 1);
    await act({ phase: P1, name: "Attribute survey", pos: 0, s: D(-60), e: D(-48), rs: D(-60), re: D(-48),
                who: "ramy", whoName: "Ramy Behairy", status: "completed", pct: 100, offBy: "islam", offAt: D(-48) });
    await act({ phase: P1, name: "Leadership interviews", pos: 1, s: D(-45), e: D(-35), rs: D(-45), re: D(-30),
                who: "islam", whoName: "Islam Saadany", status: "completed", pct: 100, ms: true, offBy: "islam", offAt: D(-30) });
    await act({ phase: P2, name: "Run the first workshop", pos: 0, s: D(-20), e: D(-6), rs: D(-20),
                who: "ramy", whoName: "Ramy Behairy", status: "done", pct: 100, about: "Waiting on the Lead to agree the date it finished." });
    await act({ phase: P2, name: "Write up the themes", pos: 1, s: D(-10), e: D(-3), rs: D(-10),
                who: "islam", whoName: "Islam Saadany", status: "in_progress", pct: 40 });
    await act({ phase: P2, name: "Second workshop", pos: 2, s: D(8), e: D(22), status: "not_started", pct: 0 });
    await P.addProject(c, { name: "Operating model review", by: "islam" });
    return pr.id;
  });

  /* ══ ONE SERVER, DISPATCHING BY THE MODULE WORD ═════════════════════
     The same `serverFor` the route asks, so a page swept here is the page a
     client is served (§96). `/topbar.js` is the app's own route and anything
     else rooted at `/` comes out of `public/` — or the pages render in a
     fallback face and every one of them reports a 404 that is the harness's
     rather than the product's (§100.3). */
  const PUBLIC = join(APP, "public");
  const MIME = { js: "application/javascript", css: "text/css", svg: "image/svg+xml", png: "image/png", woff2: "font/woff2", json: "application/json" };
  srv = createServer(async (rq, rs) => {
    try {
      const path = String(rq.url).split("?")[0];
      if (path === "/topbar.js") { rs.writeHead(200, { "Content-Type": "application/javascript" }); rs.end(TOPBAR_SCRIPT); return; }
      /* THE BAR ASKS THE SPINE FOR THE OTHER CLIENTS (§401, §444), so a
         harness that does not answer puts a 404 on every page in the sweep
         and reports the harness as the product (§100.3) — found by running
         it, 32 red across all sixteen pages. Answered with TWO others, or
         the menu draws "No other clients" and the rows whose colours this is
         here to read are never drawn (§255). */
      if (path === "/api/platform" && rq.method === "POST") {
        rs.writeHead(200, { "Content-Type": "application/json" });
        rs.end(JSON.stringify({ ok: true, clients: [
          { key: "x", name: "Raya Trade" }, { key: "rhi", name: "RHI" }, { key: "el-abd", name: "El Abd" },
        ] }));
        return;
      }
      const parts = path.split("/").filter(Boolean);
      if (parts[0] !== "x") {
        const file = join(PUBLIC, path.replace(/^\//, ""));
        if (file.startsWith(PUBLIC) && existsSync(file)) {
          rs.writeHead(200, { "Content-Type": MIME[file.split(".").pop()] || "application/octet-stream" });
          rs.end(readFileSync(file));
          return;
        }
        rs.writeHead(404); rs.end("no"); return;
      }
      const mod = parts[1];
      const server = serverFor(mod);
      if (!server) { rs.writeHead(404); rs.end("no such module"); return; }
      const chunks = []; for await (const ch of rq) chunks.push(ch);
      const req = new Request("http://smp.test" + rq.url, {
        method: rq.method, headers: { "Content-Type": rq.headers["content-type"] || "" },
        body: rq.method === "POST" ? Buffer.concat(chunks) : undefined,
      });
      const res = await server({
        req, slug: "x", module: mod, tenantId: A, tenantName: "Raya Trade", have: HAVE,
        rest: parts.slice(2), personKey: "islam", seat: "super", admin: true, consultant: true,
        me: { personKey: "islam", seat: "super" },
      });
      rs.writeHead(res.status, Object.fromEntries(res.headers));
      rs.end(Buffer.from(await res.arrayBuffer()));
    } catch (e) { rs.writeHead(500); rs.end(String(e)); }
  });
  await new Promise((r) => srv.listen(0, "127.0.0.1", r));
  const base = "http://127.0.0.1:" + srv.address().port;

  /* ══ THE PAGES ══════════════════════════════════════════════════════
     Every page each of the five modules draws, and `must` is a word the page
     cannot produce unless it was genuinely drawn from the fixture — asserted
     BEFORE its colours are believed, or a build serving five blank documents
     passes the whole file (§94.2, §113.8). */
  const PAGES = [
    { mod: "insights", what: "Insights — the library", url: "/x/insights", must: "Egypt macro outlook" },
    { mod: "insights", what: "Insights — narrowed to one category", url: "/x/insights?category=Macro", must: "Egypt macro outlook" },
    { mod: "tracker", what: "the Internal Tracker — this week", url: "/x/tracker", must: "board pack" },
    { mod: "tracker", what: "the Internal Tracker — every action", url: "/x/tracker?view=all", must: "Nothing dated yet" },
    { mod: "tracker", what: "the Internal Tracker — grouped by status", url: "/x/tracker?view=all&group=status", must: "board pack" },
    { mod: "notes", what: "Meeting Notes — the list", url: "/x/notes", must: "Q3 review preparation" },
    { mod: "notes", what: "Meeting Notes — one note, with its minutes", url: "/x/notes?note=" + noteId, must: "circulate" },
    { mod: "copilot", what: "the Copilot — chats and deliverables", url: "/x/copilot", must: "End in Mind" },
    /* No `must` here, deliberately: the settings page draws the SHIPPED
       instructions and templates rather than anything this fixture wrote, so
       a word asserted here would be a literal about that prose (§214.3). The
       200-and-a-body assertion above is what stands for it. */
    { mod: "copilot", what: "the Copilot — its settings", url: "/x/copilot/settings", must: "" },
    { mod: "portfolio", what: "Portfolio — the landing", url: "/x/portfolio", must: "Culture Transformation" },
    { mod: "portfolio", what: "Portfolio — a project's charter", url: "/x/portfolio/" + projId, must: "managed by" },
    { mod: "portfolio", what: "Portfolio — the plan, as a list", url: "/x/portfolio/" + projId + "/plan", must: "Leadership interviews" },
    { mod: "portfolio", what: "Portfolio — the plan, as a timeline", url: "/x/portfolio/" + projId + "/plan?view=time", must: "Leadership interviews" },
    /* The pen open: it draws controls nothing else on this page draws, which
       is exactly the state a colour sweep has never reached (§101.6's own
       finding — a state nobody can navigate to is a state nothing measures). */
    { mod: "portfolio", what: "Portfolio — the plan, with the pen open", url: "/x/portfolio/" + projId + "/plan?edit=1", must: "Leadership interviews" },
    { mod: "portfolio", what: "Portfolio — Progress", url: "/x/portfolio/" + projId + "/progress", must: "workshop" },
    { mod: "portfolio", what: "Portfolio — Analytics", url: "/x/portfolio/" + projId + "/analytics", must: "Culture audit" },
  ];

  try {
    const { chromium } = await import("playwright-core");
    browser = await chromium.launch({ executablePath: process.env.SMP_CHROME || undefined, args: ["--no-sandbox"] });
  } catch (e) { check("a browser to open the pages in (set SMP_CHROME)", false, e.message.split("\n")[0]); }

  if (browser) {
    const setAside = [];
    for (const p of PAGES) {
      section("§ " + p.what);
      const page = await browser.newPage({ viewport: { width: 1500, height: 1200 } });
      const errs = [], missing = [];
      page.on("pageerror", (e) => errs.push(String(e)));
      page.on("console", (m) => { if (m.type() === "error") errs.push(m.text()); });
      page.on("requestfailed", (r) => missing.push(r.url()));
      page.on("response", (r) => { if (r.status() >= 400) missing.push(r.status() + " " + r.url()); });

      const drawn = await probe(p.what + ": the page is served", async () => {
        const res = await page.goto(base + p.url, { waitUntil: "load" });
        await page.waitForTimeout(350);
        return { status: res.status(), text: await page.evaluate("document.body.innerText") };
      });
      check("it answers 200 and draws a body", !!drawn && drawn.status === 200 && (drawn.text || "").trim().length > 40,
        drawn ? drawn.status + " · " + String(drawn.text || "").slice(0, 60) : "no answer");
      /* BOTH ENDS (§94.2): a word the fixture put there, so a blank document
         cannot pass the colour assertions below by having no colours. */
      if (p.must)
        check("...and it is this client's own page, drawn from its rows", !!drawn && (drawn.text || "").includes(p.must),
          String((drawn && drawn.text) || "").replace(/\s+/g, " ").slice(0, 100));

      /* CONTRAST, IN BOTH THEMES. The theme is set EXPLICITLY both ways
         (`data-theme`), never left to the browser's own preference, so the
         run is the same on any machine and each of the two dark blocks is the
         one being measured (the page contract's three states). */
      const ground = {};
      for (const theme of ["light", "dark"]) {
        const found = await probe(p.what + " [" + theme + "]: contrast read", async () => {
          await page.evaluate(call("(t) => { document.documentElement.setAttribute('data-theme', t); " +
            "try { localStorage.setItem('smp.theme', t); } catch (e) {} }", theme));
          /* AND THE SECOND THEME IS PROVED TO BE THE SECOND THEME. A sweep
             that sets an attribute and then reads colours is claiming the
             attribute landed, which is exactly the kind of claim that passes
             on a build where it did not (§113.8, §94.8) — so the bar's own
             ground is read back per theme and the two are asserted to
             DIFFER below. It is the bar's token rather than the page's,
             because the bar is the one surface all five modules share and
             the one the break moves. */
          ground[theme] = await page.evaluate(call("() => getComputedStyle(document.documentElement)" +
            ".getPropertyValue('--tb-surface').trim() + ' / ' + " +
            "getComputedStyle(document.documentElement).getPropertyValue('--tb-ink').trim()"));
          /* THE TRAIL'S TWO MENUS ARE OPENED, because the reader SKIPS a box
             with no size (`if(!r.width||!r.height)return`) — so a closed
             `<details>` is a palette nobody has read, which is the whole
             fault this file exists to close one level down (§101.6: a state
             nobody can navigate to is a state nothing measures). They are
             absolutely positioned, so nothing below them moves, and the
             width sweep below closes them again. */
          await page.evaluate(call("() => Array.prototype.forEach.call(" +
            "document.querySelectorAll('header.tb details'), (d) => { d.open = true; })"));
          await page.waitForTimeout(250);
          const painted = await page.evaluate(CLIP);
          const all = await page.evaluate(CONTRAST);
          /* THE FILTER BELONGS INSIDE THE PROBE (§215): the first run had it
             outside, so an unserialisable answer threw past every degrade in
             the file and the whole sweep ended on one page with two
             assertions made — a run that STOPPED rather than reported
             (§298.3). */
          if (!Array.isArray(all) || !Array.isArray(painted))
            throw new Error("the reader answered " + typeof all + " / " + typeof painted + " rather than two lists");
          return { real: notClipPainted(all, painted), painted };
        });
        if (!found) continue;
        const real = found.real;
        for (const t of found.painted) if (t) setAside.push(p.what + " [" + theme + "] " + t);
        check("every colour on it reads against its own background (" + theme + ")", real.length === 0,
          real.slice(0, 4).map((f) => f.ratio + " < " + f.need + "  " + f.sel + "  “" + String(f.text).slice(0, 40) + "”").join(" | "));
      }
      check(p.what + ": the two themes really are two palettes",
        !!ground.light && !!ground.dark && ground.light !== ground.dark,
        "light " + ground.light + " · dark " + ground.dark);
      await page.evaluate(call("() => { document.documentElement.setAttribute('data-theme', 'light'); " +
        "Array.prototype.forEach.call(document.querySelectorAll('header.tb details'), (d) => { d.open = false; }); }"));

      /* NO SIDEWAYS SCROLL, at four widths (§27.1, §27.2 — a horizontal
         scroll drags every sticky element with it). Measured as the
         document's own overflow, never as a box. */
      const over = await probe(p.what + ": widths swept", async () => {
        const out = [];
        for (const w of WIDTHS) {
          await page.setViewportSize({ width: w, height: 1000 });
          await page.waitForTimeout(150);
          const d = await page.evaluate(call("() => document.documentElement.scrollWidth - document.documentElement.clientWidth"));
          /* `undefined > 1` is false, so a read that answered nothing passed
             this silently (the fault named at `call()` above): the answer is
             asserted to BE a number before it is compared. */
          if (typeof d !== "number") out.push(w + "px: the overflow read answered " + typeof d);
          else if (d > 1) out.push(w + "px over by " + d);
        }
        await page.setViewportSize({ width: 1500, height: 1200 });
        return out;
      });
      if (over) check("nothing runs past the page at 1920 / 1500 / 1280 / 1000", over.length === 0, over.join(", "));

      check("...and the page raised nothing", errs.length === 0, errs.slice(0, 2).join(" | "));
      check("...and every file it asks for answers", missing.length === 0, missing.slice(0, 3).join(" | "));
      await page.close();
    }

    /* §113.8: what the exclusion set aside is PRINTED and never asserted
       about, so the one thing this sweep deliberately cannot measure stays
       visible in every run rather than disappearing into a green tick. */
    section("§ set aside — gradient-painted text, which a contrast reader measures as 1:1 (§68.10)");
    if (!setAside.length) console.log("  ·    nothing: no page paints its text through a gradient");
    else for (const s of Array.from(new Set(setAside))) console.log("  ·    " + s);

    /* AND THE FIVE MODULES ARE ALL OF THEM (§214.3): the list is derived from
       the registry rather than typed here, so a sixth module that serves its
       own page turns this red rather than going unswept. */
    section("§ the list is every module that draws its own page");
    const { MODULES, MODULE_DEF } = await import("../lib/modules.ts");
    const ownPage = MODULES.filter((k) => k !== "strategy" && MODULE_DEF[k].built && !MODULE_DEF[k].appRoute && serverFor(k));
    const swept = Array.from(new Set(PAGES.map((p) => p.mod))).sort();
    check("every built module with a server of its own is swept here", ownPage.slice().sort().join(",") === swept.join(","),
      "serves itself: " + ownPage.join(",") + "  ·  swept: " + swept.join(","));
    check("...and there is more than one of them, or the agreement above is vacuous", ownPage.length > 1, String(ownPage.length));
  }
} catch (e) {
  console.log("\nFAIL (the run itself): " + String((e && e.stack) || e));
  bad.push("the run itself");
} finally {
  if (browser) await browser.close().catch(() => {});
  if (srv) srv.close();
  if (A_) await owner("DELETE FROM tenants WHERE id = $1", [A_]).catch(() => {});
  await pool.end().catch(() => {});
  await appPool.end().catch(() => {});
}

console.log("\n" + ok + " passed, " + bad.length + " failed");
if (bad.length) { for (const b of bad) console.log("  - " + b); process.exit(1); }
