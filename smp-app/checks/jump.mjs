/* JUMP TO AND THE OFFLINE STRIP (§699), driven in a real browser against the
   BUILT app on its own port and the dev tenant, given the Tracker, Notes,
   Insights and Portfolio for the run and put back after:
     · the "Jump to…" box is on Strategy's bar, a module's bar and the
       console's column, and Ctrl K opens the window on each;
     · the office is offered the modules, the Tracker's views, Setup and the
       console — and NOT Strategy's own tabs, units or functions;
     · a client's own person is offered neither Setup, the console, nor the
       office's own modules (the Tracker and Meeting Notes turn them away);
     · typing narrows the list and Enter opens the page it names;
     · losing the connection draws the strip, moves the page down rather
       than covering the bar, holds a press on Save and says why; the
       connection back turns it green and it goes.
   Prints one line per property (§215) and ends RED/GREEN.
     DATABASE_URL_UNPOOLED=postgres://…/smp_dev node checks/jump.mjs
     … --break=jump-office-for-all   (RED: a client's person is offered Setup)
   Needs `npm run build` first and the chromium this image carries. */
import { spawn } from "node:child_process";
import { join } from "node:path";
import { chromium } from "playwright-core";
import pg from "pg";
import { SCHEMA } from "../db/schema-name.mjs";
import { devTenant, DEV_PASSWORD } from "../scripts/dev-tenant.mjs";

const URL_ = process.env.DATABASE_URL_UNPOOLED || "postgres://postgres:postgres@localhost:5432/smp_dev";
const CHROME = process.env.SMP_CHROME || "/opt/pw-browsers/chromium";
const PORT = 3981, BASE = "http://localhost:" + PORT;
const brk = (process.argv.find((a) => a.startsWith("--break=")) || "").slice(8);
let oks = 0, fails = 0;
const ok = (l) => { oks++; console.log("ok    " + l); };
const fail = (l, m) => { fails++; console.log("FAIL  " + l + (m === undefined ? "" : " — " + String(m).slice(0, 220))); };
const check = (c, l, m) => (c ? ok(l) : fail(l, m));

await devTenant({ url: URL_, log: () => {} });
const db = new pg.Client({ connectionString: URL_, options: "-c search_path=" + SCHEMA });
await db.connect();
const was = (await db.query("SELECT modules FROM tenants WHERE key = 'raya-trade'")).rows[0].modules;
await db.query("UPDATE tenants SET modules = $1 WHERE key = 'raya-trade'", [JSON.stringify(["strategy", "insights", "tracker", "notes", "portfolio"])]);

const server = spawn("npx", ["next", "start", "-p", String(PORT)], { cwd: join(import.meta.dirname, ".."),
  env: { ...process.env, DATABASE_URL_UNPOOLED: URL_, SMP_BREAK: brk }, stdio: ["ignore", "pipe", "pipe"], detached: true });
server.stdout.on("data", () => {}); server.stderr.on("data", (d) => process.stderr.write(d));
const done = async (code) => {
  try { await db.query("UPDATE tenants SET modules = $1 WHERE key = 'raya-trade'", [JSON.stringify(was)]); await db.end(); } catch {}
  try { process.kill(-server.pid); } catch {}
  process.exit(code);
};
let up = false;
for (let i = 0; i < 60 && !up; i++) { await new Promise((r) => setTimeout(r, 500)); try { up = (await fetch(BASE + "/")).status === 200; } catch {} }
if (!up) { console.log("FAIL  the app did not start"); await done(1); }

const browser = await chromium.launch({ executablePath: CHROME });
const errs = [];
async function as(email) {
  const ctx = await browser.newContext({ viewport: { width: 1300, height: 820 } });
  const page = await ctx.newPage();
  page.on("pageerror", (e) => errs.push(email + ": " + e.message));
  await page.goto(BASE + "/raya-trade/sign-in", { waitUntil: "networkidle" });
  await page.waitForSelector(".gate[data-hydrated]", { state: "attached", timeout: 15000 });
  await page.fill("#user", email); await page.fill("#password", DEV_PASSWORD);
  await page.click("#loginForm button[type=submit]");
  await page.waitForURL((u) => !/sign-in/.test(u.pathname), { timeout: 15000 }).catch(() => {});
  return { ctx, page };
}
const listed = (page) => page.evaluate(() => Array.from(document.querySelectorAll("#sjres .sjit[data-i]"))
  .map((b) => ({ n: b.querySelector(".sjn").textContent, w: b.querySelector(".sjw").textContent })));
async function openWith(page, how) {
  if (how === "key") await page.keyboard.press("Control+k"); else await page.click(".sjbtn");
  await page.waitForFunction(() => document.querySelectorAll("#sjres .sjit[data-i]").length > 0, null, { timeout: 8000 }).catch(() => {});
}

try {
  /* ── the office ─────────────────────────────────────────────────── */
  let { ctx, page } = await as("office@forefront.example");
  await page.goto(BASE + "/raya-trade/strategy", { waitUntil: "networkidle" }); await page.waitForTimeout(800);
  check(await page.evaluate(() => !!document.querySelector("#topacts .sjbtn")), "the Jump to box is on Strategy's bar");
  await openWith(page, "key");
  const L = await listed(page);
  const names = L.map((x) => x.n + " | " + x.w);
  check(await page.evaluate(() => !!document.getElementById("sjscrim") && !document.getElementById("sjscrim").hidden), "Ctrl K opens the window");
  check(names.includes("Strategy | Module") && names.includes("Internal Tracker | Module"), "…listing the modules, Strategy as one entry", names.slice(0, 6).join("; "));
  check(names.includes("Weekly check | Internal Tracker"), "…the other modules' pages (the Tracker's views)");
  check(names.includes("Roles & access | Setup · Strategy") && names.includes("Client register | Setup · Client"), "…Setup's pages");
  check(names.includes("Who sees what | Console"), "…and the console's tabs");
  check(!L.some((x) => /^(Foundation|Analysis|Directions|Overall performance|Mobile|Logistics)$/.test(x.n)), "…and none of Strategy's tabs, units or functions (Islam's rule)", names.join("; "));
  await page.keyboard.type("weekly");
  const narrowed = await listed(page);
  check(narrowed.length === 1 && narrowed[0].n === "Weekly check", "typing narrows it", JSON.stringify(narrowed));
  await Promise.all([page.waitForURL(/\/raya-trade\/tracker\?view=check/, { timeout: 10000 }).catch(() => {}), page.keyboard.press("Enter")]);
  check(/\/raya-trade\/tracker\?view=check$/.test(page.url()), "…and Enter opens the page it names", page.url());
  await page.waitForLoadState("networkidle");
  check(await page.evaluate(() => !!document.querySelector("header.tb .sjbtn")), "the box is on a module's bar too");
  await page.goto(BASE + "/platform", { waitUntil: "networkidle" }); await page.waitForTimeout(800);
  check(await page.evaluate(() => !!document.querySelector(".sjbtn.sjside")), "…and in the console's column");
  await openWith(page, "button");
  await page.keyboard.type("consultants");
  await Promise.all([page.waitForURL(/#consultants$/, { timeout: 10000 }).catch(() => {}), page.keyboard.press("Enter")]);
  await page.waitForLoadState("networkidle"); await page.waitForTimeout(800);
  check(/\/platform#consultants$/.test(page.url()), "a jump to a console tab lands on that tab", page.url());

  /* ── the strip ──────────────────────────────────────────────────── */
  await page.goto(BASE + "/raya-trade/strategy", { waitUntil: "networkidle" }); await page.waitForTimeout(800);
  await page.evaluate(() => { const b = document.createElement("button"); b.id = "probe"; b.textContent = "Save";
    b.style.cssText = "position:fixed;left:600px;top:420px;z-index:2147483000"; b.onclick = () => { window.__saved = (window.__saved || 0) + 1; }; document.body.appendChild(b); });
  await ctx.setOffline(true); await page.waitForTimeout(300);
  const strip = await page.evaluate(() => { const s = document.getElementById("sjstrip"); return s && !s.hidden ? s.textContent : ""; });
  check(/You’re offline/.test(strip) && /Try again/.test(strip), "losing the connection draws the strip", strip);
  const moved = await page.evaluate(() => { const s = document.getElementById("sjstrip"), b = document.querySelector("#topacts");
    return { strip: s.getBoundingClientRect().bottom, bar: b.getBoundingClientRect().top }; });
  check(moved.bar >= moved.strip - 1, "…and moves the page down rather than covering the bar", JSON.stringify(moved));
  await page.click("#probe"); await page.waitForTimeout(200);
  check(!(await page.evaluate(() => window.__saved)), "a press on Save is held while offline");
  check(/Held until you’re back online/.test(await page.evaluate(() => { const t = document.getElementById("sjtip"); return t && !t.hidden ? t.textContent : ""; })), "…and says why");
  await ctx.setOffline(false); await page.waitForTimeout(300);
  check(/Back online/.test(await page.evaluate(() => document.getElementById("sjstrip").textContent)), "the connection back turns it to Back online");
  await page.click("#probe");
  check((await page.evaluate(() => window.__saved)) === 1, "…and Save works again");
  await page.waitForTimeout(4400);
  check(await page.evaluate(() => document.getElementById("sjstrip").hidden && !document.body.hasAttribute("data-sjpad")), "…and then it goes, giving the room back");
  await ctx.close();

  /* ── a client's own person ──────────────────────────────────────── */
  ({ ctx, page } = await as("mobhead@raya.example"));
  await page.goto(BASE + "/raya-trade/strategy", { waitUntil: "networkidle" }); await page.waitForTimeout(800);
  await openWith(page, "key");
  const C = await listed(page);
  check(C.some((x) => x.n === "Strategy"), "a client's own person is offered Strategy", JSON.stringify(C));
  check(!C.some((x) => /^Setup/.test(x.w) || x.w === "Console"), "…and neither Setup nor the console", C.map((x) => x.n + " | " + x.w).join("; "));
  check(!C.some((x) => x.n === "Internal Tracker" || x.n === "Meeting Notes" || x.w === "Internal Tracker"), "…nor the office's Tracker and Notes, which would only turn them away");
  await ctx.close();

  check(errs.length === 0, "no script error on any page", errs.slice(0, 3).join(" | "));
} catch (e) {
  fail("the run itself", e && e.stack || e);
}
await browser.close();
console.log((fails ? "RED" : "GREEN") + " — " + oks + " ok, " + fails + " failed");
await done(fails ? 1 : 0);
