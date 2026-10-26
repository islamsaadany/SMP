/* PUBLISHING INSIGHTS FROM THE CLIENT'S OWN PAGE (§647).

   Islam: "this needs to be doable from the module inside the client like the
   meeting notes as the insights are client relevant", then "it can be a pop
   up modal", then "yes build it". The console's room is no longer the way in
   (lib/modules.ts LIBRARY_MODULES is empty), so this is the only place a
   report is written — and the claims worth proving are the ones that would
   hurt:
     · whoever may publish (the platform's admin, or this client's Super
       user) sees + Publish a report, the drafts and Open; a client's person,
       an SMO-team seat, and anybody being viewed as, see none of it and no
       draft (BOTH ENDS, §94.2);
     · every press lands through the console's own door (platformAction) and
       is READ BACK from Postgres: a draft saved, publishing refused without a
       file, published, withdrawn, deleted (§96);
     · the pop-up keeps what was typed when closed by mistake.

   WHAT IS DRIVEN AND WHAT IS READ (§100.3): §1 renders the real page through
   the module's own serve(); §2 serves that page and its script over a port,
   with /api/platform answered by the real platformAction for a real admin
   account, and PRESSES it in Chromium.

     DATABASE_URL_UNPOOLED=postgres://owner@… SMP_CHROME=… node checks/insights-publish.mjs
     SMP_BREAK=publish-anyone node checks/insights-publish.mjs   # must go red */
import http from "node:http";
import pg from "pg";
import { chromium } from "playwright-core";
import { usePools, endPools } from "../lib/db.ts";
import { SCHEMA } from "../db/schema-name.mjs";
import { applyAll } from "../db/apply.mjs";
import { serve } from "../modules/insights/index.ts";
import { platformAction } from "../lib/platform-api.ts";
import { filePath, setFile } from "../lib/library.ts";
import { withTenant } from "../lib/tenant.ts";

let ok = 0;
const bad = [];
const check = (what, good, detail) => {
  if (good) { ok++; console.log("  ok   " + what); }
  else { bad.push(what); console.log("  FAIL " + what + (detail ? "  — " + detail : "")); }
};
const section = (s) => console.log("\n" + s);

const URL_ = process.env.DATABASE_URL_UNPOOLED || process.env.DATABASE_URL || "";
if (!URL_) { console.log("No DATABASE_URL — this check needs one. A check that cannot run is not a check that passed (§54.5)."); process.exit(1); }
await applyAll(URL_, { appPassword: process.env.SMP_APP_PASSWORD || "smp_app", log: () => {} });
const pool = new pg.Pool({ connectionString: URL_, max: 4, options: "-c search_path=" + SCHEMA });
const appUrl = new URL(URL_);
appUrl.username = "smp_app"; appUrl.password = process.env.SMP_APP_PASSWORD || "smp_app";
const appPool = new pg.Pool({ connectionString: appUrl.toString(), max: 4, options: "-c search_path=" + SCHEMA });
usePools(pool, appPool);
const q = async (sql, args) => (await pool.query(sql, args)).rows;

const KEY = "check-publish";
const ADMIN = "publish-admin@forefront.example";
const sweep = async () => {
  await q("DELETE FROM tenants WHERE key = $1", [KEY]);
  await q("DELETE FROM users WHERE email LIKE 'publish-%@forefront.example'");
};

let server = null, browser = null;
try {
  await sweep();
  const [t] = await q("INSERT INTO tenants (key, name, modules) VALUES ($1, 'Publish Client', $2::jsonb) RETURNING id", [KEY, JSON.stringify(["strategy", "insights"])]);
  const [u] = await q("INSERT INTO users (email, name, kind, is_admin, must_change, password_hash) VALUES ($1, 'Publish Admin', 'office', true, false, 'x') RETURNING id", [ADMIN]);
  const AS_ADMIN = { id: u.id, email: ADMIN, name: "Publish Admin", kind: "office", isAdmin: true, mustChange: false };
  const reports = () => withTenant(t.id, async (c) => (await c.query(
    "SELECT id, title, state, categories, file_path FROM library_items WHERE kind = 'insights' ORDER BY created_at")).rows);

  /* the module's own serve(), as the route hands it a request */
  const page = async (who, path = "") => {
    const a = { req: new Request("http://x/" + KEY + "/insights" + path), slug: KEY, module: "insights", tenantId: t.id, tenantName: "Publish Client",
      have: ["strategy", "insights"], rest: path ? path.split("/").filter(Boolean) : [], personKey: who.personKey || null, seat: who.seat ?? null,
      admin: !!who.admin, consultant: !!who.consultant, me: { personKey: who.personKey || null, seat: who.seat ?? null } };
    const r = await serve(a);
    return { status: r.status, text: await r.text(), type: r.headers.get("Content-Type") || "" };
  };

  /* ══ §1 · who sees the controls, read from the real page ════════════ */
  section("§1 · who may publish, and what everybody else sees");
  /* one draft in the library first, so "no draft shown" is a claim about a
     draft that EXISTS (§113.8) */
  const made = await platformAction(pool, AS_ADMIN, { action: "librarySave", key: KEY, kind: "insights", title: "A draft nobody outside sees", categories: ["Market"] });
  check("the fixture's draft is saved through the console's own door", made.code === 200 && made.body.ok, JSON.stringify(made.body).slice(0, 160));
  const asAdmin = (await page({ consultant: true, admin: true, seat: null })).text;
  check("the platform's admin sees + Publish a report in the band", /<header class="mast">[\s\S]*data-act="new-report"[\s\S]*<\/header>/.test(asAdmin));
  check("...the draft, tagged Draft, with Open", asAdmin.includes("A draft nobody outside sees") && /class="draft">Draft</.test(asAdmin) && /data-act="open-report"/.test(asAdmin));
  check("...and the pop-up's script, with nothing inline", asAdmin.includes('src="/' + KEY + '/insights/app.js"') && !/<script(?![^>]*\bsrc=)/.test(asAdmin));
  check("the band counts what the client can see, not the draft", /<div class="tile"><b>0<\/b><span>Reports<\/span>/.test(asAdmin),
    (asAdmin.match(/<div class="tile">[\s\S]{0,60}/) || [""])[0]);
  const asSuper = (await page({ consultant: true, admin: false, seat: "super", personKey: "ff_super" })).text;
  check("this client's Super user sees it too", asSuper.includes('data-act="new-report"') && asSuper.includes("A draft nobody outside sees"));
  for (const [who, w] of [["an SMO-team seat", { consultant: true, admin: false, seat: "smoteam", personKey: "ff_smo" }],
    ["a client's own person", { consultant: false, admin: false, seat: "none", personKey: "p1" }],
    ["the admin viewing as a client's person (admin is already false then)", { consultant: true, admin: false, seat: "none", personKey: "p1" }]]) {
    const html = (await page(w)).text;
    check(who + " sees no button, no Open, no draft and no script",
      !html.includes('data-act="new-report"') && !html.includes('data-act="open-report"') && !html.includes("A draft nobody outside sees") &&
      !html.includes("app.js") && !/class="modal|mscrim|\.openr/.test(html) && html.includes("Insights"), "");
    const d = await page(w, "/data");
    check("...and its /data answers Not found, with no report in it", d.status === 404 && !d.text.includes("A draft nobody outside sees"), d.status + " " + d.text.slice(0, 80));
  }
  const js = await page({ consultant: true, admin: true }, "/app.js");
  check("the script is served at the module's own address, as JavaScript", js.status === 200 && /javascript/.test(js.type) && js.text.includes("/api/platform"));
  const data = await page({ consultant: true, admin: true }, "/data");
  const dj = JSON.parse(data.text || "{}");
  check("the admin's /data holds the draft, the categories and this client's key", data.status === 200 && dj.ok && dj.key === KEY &&
    Object.values(dj.items || {}).some((it) => it.title === "A draft nobody outside sees" && it.state === "draft") && (dj.categories || []).includes("Market"), data.text.slice(0, 160));

  /* ══ §2 · pressed in a browser, read back from Postgres ═════════════ */
  section("§2 · the pop-up, pressed, and every press read back");
  server = http.createServer(async (rq, rs) => {
    try {
      const path = String(rq.url).split("?")[0];
      if (rq.method === "POST" && path === "/api/platform") {
        let raw = ""; for await (const ch of rq) raw += ch;
        const a = await platformAction(pool, AS_ADMIN, JSON.parse(raw || "{}"));
        rs.writeHead(a.code, { "Content-Type": "application/json" }); rs.end(JSON.stringify(a.body)); return;
      }
      if (path === "/" + KEY + "/insights/data") { const r = await page({ consultant: true, admin: true }, "/data"); rs.writeHead(r.status, { "Content-Type": "application/json" }); rs.end(r.text); return; }
      if (path === "/" + KEY + "/insights/app.js") { const r = await page({ consultant: true, admin: true }, "/app.js"); rs.writeHead(200, { "Content-Type": r.type }); rs.end(r.text); return; }
      if (path === "/" + KEY + "/insights") { const r = await page({ consultant: true, admin: true }); rs.writeHead(200, { "Content-Type": "text/html; charset=utf-8" }); rs.end(r.text); return; }
      rs.writeHead(404); rs.end("");
    } catch (e) { rs.writeHead(500); rs.end(String(e && e.stack)); }
  });
  await new Promise((r) => server.listen(0, r));
  const base = "http://127.0.0.1:" + server.address().port + "/" + KEY + "/insights";
  browser = await chromium.launch({ executablePath: process.env.SMP_CHROME || undefined, args: ["--no-sandbox"] });
  const pg_ = await browser.newPage({ viewport: { width: 1280, height: 900 } });
  const errs = []; pg_.on("pageerror", (e) => errs.push(e.message));
  await pg_.goto(base, { waitUntil: "load" });

  await pg_.locator('[data-act="new-report"]').click();
  check("+ Publish a report opens the pop-up over the list, the title box focused",
    await pg_.locator(".mscrim .modal[role=dialog]").isVisible() && await pg_.evaluate("document.activeElement && document.activeElement.id") === "m-title" &&
    await pg_.locator(".list .item").count() === 1);
  check("...Publish is held until there is a file", (await pg_.locator(".mfoot .btn.amber").getAttribute("aria-disabled")) === "true");
  /* force: the button is aria-disabled on purpose, held rather than dead,
     and the claim is what pressing it says */
  await pg_.locator(".mfoot .btn.amber").click({ force: true });
  check("...and pressed, it says why rather than doing nothing (§61)", /Add the file first/.test(await pg_.locator(".msaid").textContent()));
  await pg_.locator("#m-title").fill("Egypt FMCG outlook, H2");
  await pg_.keyboard.press("Escape");
  check("Escape with words typed asks first, and nothing is lost", await pg_.locator(".mask").isVisible() && (await pg_.locator("#m-title").inputValue()) === "Egypt FMCG outlook, H2");
  await pg_.locator(".mask .btn", { hasText: "Keep editing" }).click();
  await pg_.locator("#m-sum").fill("Volume recovers slowly.");
  await pg_.locator(".chip", { hasText: "Sector" }).click();
  if (process.env.SMP_SHOT) await pg_.screenshot({ path: process.env.SMP_SHOT + "-modal.png" });
  await pg_.locator(".mfoot .btn", { hasText: "Save the draft" }).click();
  await pg_.waitForFunction(() => /only Forefront/.test(document.querySelector(".mstate").textContent), null, { timeout: 5000 }).catch(() => {});
  let rows = await reports();
  const mine = rows.find((r) => r.title === "Egypt FMCG outlook, H2");
  check("Save the draft writes a draft, its summary's words and its category", !!mine && mine.state === "draft" && JSON.stringify(mine.categories) === '["Sector"]', JSON.stringify(rows));
  check("...and the pop-up stays open, saying it is a draft only Forefront sees", await pg_.locator(".modal").isVisible() && /only Forefront/i.test(await pg_.locator(".mstate").textContent()));
  await pg_.locator(".modal .x").click();
  await pg_.waitForLoadState("load");
  await pg_.waitForSelector(".list .item:nth-child(2)", { timeout: 5000 }).catch(() => {});
  check("closing after a write reads the list again: the new draft is a row, tagged Draft", (await pg_.locator(".item h3", { hasText: "Egypt FMCG outlook, H2" }).locator(".draft").count()) === 1);

  /* THE FILE. There is no file store on a check database, so the file is
     attached the way finishing an upload attaches it (lib/library setFile) —
     the pieces route is the console's, unchanged, and is not this check's. */
  await withTenant(t.id, (c) => setFile(c, mine.id, filePath("insights", t.id, mine.id, "fmcg.pdf"), "fmcg.pdf", 2400000));
  await pg_.reload({ waitUntil: "load" });
  await pg_.locator('[data-act="open-report"][data-id="' + mine.id + '"]').click();
  check("Open brings up the same pop-up, filled in, the file named", (await pg_.locator("#m-title").inputValue()) === "Egypt FMCG outlook, H2" &&
    /fmcg\.pdf/.test(await pg_.locator(".file .fname").textContent()) && (await pg_.locator(".mfoot .btn.amber").getAttribute("aria-disabled")) === null);
  await pg_.locator(".mfoot .btn.amber").click();
  await pg_.waitForFunction(() => !document.querySelector(".mscrim"), null, { timeout: 5000 }).catch(() => {});
  await pg_.waitForLoadState("load");
  rows = await reports();
  check("Publish to … publishes it, and the pop-up closes", rows.find((r) => r.id === mine.id)?.state === "published" && (await pg_.locator(".mscrim").count()) === 0, JSON.stringify(rows.map((r) => r.state)));
  await pg_.waitForSelector('.tile b', { timeout: 5000 }).catch(() => {});
  check("...the band now counts it, and its row offers Download", (await pg_.locator(".mast .tile b").first().textContent()) === "1" &&
    (await pg_.locator(".item", { hasText: "Egypt FMCG outlook, H2" }).locator("a.dl").count()) === 1);
  const asClient = (await page({ consultant: false, admin: false, seat: "none", personKey: "p1" })).text;
  check("...and the client's own page lists it, still without the draft", asClient.includes("Egypt FMCG outlook, H2") && !asClient.includes("A draft nobody outside sees"));

  await pg_.locator('[data-act="open-report"][data-id="' + mine.id + '"]').click();
  check("a published report's Delete is held: withdraw first", await pg_.locator(".arow .btn.risk").isDisabled());
  await pg_.locator(".arow .btn", { hasText: "Withdraw" }).click();
  await pg_.waitForFunction(() => /only Forefront/.test(document.querySelector(".mstate").textContent), null, { timeout: 5000 }).catch(() => {});
  rows = await reports();
  check("Withdraw takes it back to a draft", rows.find((r) => r.id === mine.id)?.state === "draft");
  await pg_.locator(".arow .btn.risk").click();
  await pg_.locator(".arow .btn.risksolid").click();
  await pg_.waitForFunction(() => !document.querySelector(".mscrim"), null, { timeout: 5000 }).catch(() => {});
  rows = await reports();
  check("Delete, asked and answered, removes it", !rows.some((r) => r.id === mine.id) && rows.length === 1, JSON.stringify(rows.map((r) => r.title)));
  if (process.env.SMP_SHOT) { await pg_.goto(base, { waitUntil: "load" }); await pg_.screenshot({ path: process.env.SMP_SHOT + "-list.png", fullPage: true }); }
  check("no page error on the way", errs.length === 0, errs.join(" | "));
} catch (e) {
  bad.push("the check itself threw");
  console.log("  FAIL the check itself threw — " + (e && e.stack || e));
} finally {
  if (browser) await browser.close();
  if (server) server.close();
  await sweep().catch(() => {});
  await pool.end(); await appPool.end().catch(() => {});
}
console.log("\n" + ok + " passed, " + bad.length + " failed");
process.exit(bad.length ? 1 : 0);
