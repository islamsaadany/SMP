/* The Frameworks tab, driven in a real browser against the built app
 * (spec 050, phase A).
 *
 * WHAT IT IS FOR, beyond "the page renders": a page wired to nothing looks
 * identical to one that works (§96). And the fault this file found on its
 * first run is the one it exists for — the filter set `row.hidden = true` and
 * the rows STAYED ON SCREEN, because `.fwrow { display:block }` beats the
 * browser's own `[hidden]` rule (measured, §93.11). The count said "12 of 80"
 * over eighty visible rows, which is the worst shape a filter can take: it
 * looks like it worked.
 *
 * SO EVERY ASSERTION HERE ASKS WHICH ROWS ARE VISIBLE, never which carry the
 * attribute (§94.8). A check written against the attribute would have gone
 * green on the broken build.
 *
 *   DATABASE_URL_UNPOOLED=postgres://…/smp_dev node checks/frameworks-page.mjs
 *   … --break=no-hidden-rule (RED: the served page loses `.fwrow[hidden]`, which IS the fault above)
 *
 * Needs `next build` first and the chromium this image carries. */
import { spawn } from "node:child_process";
import { join } from "node:path";
import { readFileSync, writeFileSync } from "node:fs";
import { chromium } from "playwright-core";
import { devTenant, DEV_PASSWORD } from "../scripts/dev-tenant.mjs";

const URL_ = process.env.DATABASE_URL_UNPOOLED || "postgres://postgres:postgres@localhost:5432/smp_dev";
const CHROME = process.env.SMP_CHROME || "/opt/pw-browsers/chromium-1194/chrome-linux/chrome";
const PORT = 3984, BASE = "http://localhost:" + PORT;
const brk = (process.argv.find((a) => a.startsWith("--break=")) || "").slice(8);
let oks = 0, fails = 0;
const ok = (l) => { oks++; console.log("ok    " + l); };
const fail = (l, m) => { fails++; console.log("FAIL  " + l + (m === undefined ? "" : " — " + String(m).slice(0, 220))); };
const check = (c, l, m) => (c ? ok(l) : fail(l, m));
async function section(name, fn) {
  console.log("\n── " + name);
  try { await fn(); } catch (e) { fail(name + " — the section died rather than reporting (§215)", e && e.stack ? e.stack.split("\n").slice(0, 2).join(" ") : e); }
}

await devTenant({ url: URL_, log: () => {} });

/* A CHECK MUST NOT TALK TO A SERVER IT DID NOT START (§105.6, §54.5). */
async function portFree(port) {
  try { await fetch("http://localhost:" + port + "/", { signal: AbortSignal.timeout(800) }); return false; }
  catch { return true; }
}
async function stopServer(s) {
  try { process.kill(-s.pid); } catch {}
  try { s.kill("SIGKILL"); } catch {}
  for (let i = 0; i < 20; i++) { if (await portFree(PORT)) return; await new Promise((r) => setTimeout(r, 250)); }
}
if (!(await portFree(PORT))) {
  console.log("FAIL  something is already listening on " + PORT + " — this check will not measure a server it did not start");
  process.exit(1);
}

/* THE BREAK IS MADE FROM THE REAL ARTEFACT (§276), not from a doctored copy
   of the check: the one rule is cut out of the page the server is about to
   serve, and put back in the `finally` whatever happens. */
const DOC = join(import.meta.dirname, "..", "shell", "platform.html");
const RULE = "  .fwrow[hidden]{ display:none }";
let original = null;
if (brk === "no-hidden-rule") {
  original = readFileSync(DOC, "utf8");
  if (original.indexOf(RULE) < 0) { console.log("FAIL  the rule this break removes is not in the served page"); process.exit(1); }
  writeFileSync(DOC, original.replace(RULE, ""));
}
const putItBack = () => { if (original != null) { try { writeFileSync(DOC, original); } catch {} } };

const server = spawn("npx", ["next", "start", "-p", String(PORT)], {
  cwd: join(import.meta.dirname, ".."),
  env: { ...process.env, DATABASE_URL_UNPOOLED: URL_, DATABASE_URL: URL_ },
  stdio: ["ignore", "pipe", "pipe"], detached: true,
});
server.stdout.on("data", () => {}); server.stderr.on("data", () => {});
let up = false;
for (let i = 0; i < 60 && !up; i++) { await new Promise((r) => setTimeout(r, 500)); try { up = (await fetch(BASE + "/")).status === 200; } catch {} }
if (!up) { console.log("FAIL  the app did not start"); await stopServer(server); putItBack(); process.exit(1); }

const browser = await chromium.launch({ executablePath: CHROME });
const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
const errs = [];
page.on("console", (m) => { if (m.type() === "error") errs.push(m.text()); });
page.on("pageerror", (e) => errs.push(String(e)));

const visible = () => page.$$eval(".fwlist .fwrow", (rs) => rs.filter((r) => r.offsetParent !== null).length);

try {
  await page.goto(BASE + "/", { waitUntil: "networkidle" });
  await page.fill("#user", "office@forefront.example");
  await page.fill("#password", DEV_PASSWORD);
  await page.click("button[type=submit]");
  await page.waitForURL("**/platform*", { timeout: 20000 });
  await page.waitForSelector("body.ready", { timeout: 20000 });

  await section("the tab, and what it opens on", async () => {
    const tab = await page.$('.nav button[data-tab="frameworks"]');
    check(!!tab, "Frameworks is in the console's nav");
    await tab.click();
    await page.waitForSelector(".fwlist .fwrow", { timeout: 20000 });
    check((await page.$$(".fwlist .fwrow")).length === 80, "eighty rows are drawn");
    check((await page.innerText(".fwcount")).trim() === "80 frameworks",
      "and the count says eighty", await page.innerText(".fwcount"));
    const chips = await page.$$eval(".fwchip", (cs) => cs.map((c) => c.textContent.trim()));
    check(chips.length === 9, "one chip per section, plus All", chips.length);
    check(chips[1].startsWith("Knowing Your Business"),
      "and the first section is the book's first, not the alphabet's", chips[1]);
  });

  await section("the search narrows it, and does not rebuild it", async () => {
    /* The first row is MARKED before typing and looked for afterwards: a
       filter that rebuilt the list would lose the mark, and the cursor with
       it (constitution XV). */
    await page.$eval(".fwlist .fwrow", (r) => { r.dataset.mark = "one"; });
    await page.fill(".fwbox input", "pricing");
    await page.waitForTimeout(150);
    const shown = await visible();
    check(shown > 0 && shown < 80, "typing narrows the list — measured as what is VISIBLE", shown);
    check((await page.innerText(".fwcount")).indexOf("of 80") > 0,
      "and the count says how many of how many", await page.innerText(".fwcount"));
    check((await page.$$(".fwlist .fwrow")).length === 80,
      "every row is still in the document — they were hidden, not removed");
    check(!!(await page.$('.fwlist .fwrow[data-mark="one"]')),
      "and the marked row survived, so nothing repainted under the typing hand");
    check(await page.evaluate(() => document.activeElement === document.querySelector(".fwbox input")),
      "the box still has the cursor");

    await page.fill(".fwbox input", "zzzznotathing");
    await page.waitForTimeout(150);
    check(await visible() === 0, "nothing matching hides them all");
    check((await page.innerText(".fwcount")).trim() === "Nothing matches that.",
      "and it SAYS so rather than leaving a blank box to read as a page that failed (§45.2)",
      await page.innerText(".fwcount"));

    await page.fill(".fwbox input", "");
    await page.waitForTimeout(150);
    check(await visible() === 80, "clearing it brings all eighty back");
  });

  await section("the section chips", async () => {
    const chips = await page.$$(".fwchip");
    await chips[1].click(); await page.waitForTimeout(150);
    check(await visible() === 6, "a chip narrows to that section's own count", await visible());
    check(await page.$eval(".fwchip:nth-child(2)", (c) => c.getAttribute("aria-pressed")) === "true",
      "the pressed one says it is pressed");
    await chips[1].click(); await page.waitForTimeout(150);
    check(await visible() === 80,
      "and pressing the lit one clears it — the only way back to All without reaching for it");
  });

  await section("one framework, and the way back", async () => {
    const rows = await page.$$(".fwlist .fwrow");
    await rows[30].click();
    await page.waitForSelector(".band .fwsec", { timeout: 20000 });
    check((await page.innerText(".ptitle h1")).indexOf("Three Generic Strategies") >= 0,
      "pressing a row opens that framework", await page.innerText(".ptitle h1"));
    check((await page.$$(".band .fwsec h3")).length === 9, "nine headed sections",
      (await page.$$(".band .fwsec h3")).length);
    check((await page.innerText(".band .apart")).indexOf("Came with the library") >= 0,
      "and it says it came with the library rather than naming an author (§35)");
    await page.click(".cback");
    await page.waitForSelector(".fwlist .fwrow", { timeout: 20000 });
    check(await visible() === 80, "the way back returns to all eighty");
  });

  await section("nothing threw", async () => {
    check(errs.length === 0, "no console error anywhere in that", errs.slice(0, 2).join(" | "));
  });
} finally {
  await browser.close().catch(() => {});
  await stopServer(server);
  putItBack();
}

console.log("\n" + oks + " passed, " + fails + " failed");
process.exit(fails ? 1 : 0);
