/* ── OPEN ON WHAT YOU SAW LAST TIME (§415) ──────────────────────────────
   Islam: "why everytime I open the tab it opens from the start? why don't we
   cash the pages and refresh silently and adjust if something new comes" —
   with the three conditions he said yes to: one saved copy per person, wiped
   on sign-in and sign-out; an "Updating…" mark while it is only the saved
   copy; and nothing saved until the fresh copy has landed.

   Driven in Chromium against the built app. The server's answer is HELD open
   with page.route so the saved-copy window can be looked at at all, and the
   answer is ALTERED so "adjust if something new comes" is measured rather
   than assumed (§94.11, §255).

     DATABASE_URL_UNPOOLED=postgres://…/smp_dev node checks/quick-open.mjs
     … SMP_BREAK_QUICK=no-cache   (RED: nothing is saved, so nothing opens early)
     … SMP_BREAK_QUICK=no-lock    (RED: the saved copy takes typing)
     … SMP_BREAK_QUICK=late-baseline (RED: the fresh copy's landing posts a save)

   The breaks are applied to the served shell.js bytes by route, so no file
   on disk is ever doctored (§343.9). Needs `npm run build` first. */
import { spawn } from "node:child_process";
import { join } from "node:path";
import { chromium } from "playwright-core";
import { devTenant, DEV_PASSWORD } from "../scripts/dev-tenant.mjs";

const URL_ = process.env.DATABASE_URL_UNPOOLED || "postgres://postgres:postgres@localhost:5432/smp_dev";
const CHROME = process.env.SMP_CHROME || "/opt/pw-browsers/chromium-1194/chrome-linux/chrome";
const PORT = 3981, BASE = "http://localhost:" + PORT;
const brk = process.env.SMP_BREAK_QUICK || "";
let oks = 0, fails = 0;
const check = (c, l, m) => { if (c) { oks++; console.log("ok    " + l); } else { fails++; console.log("FAIL  " + l + (m === undefined ? "" : " — " + String(m).slice(0, 220))); } };

await devTenant({ url: URL_, log: () => {} });
const server = spawn("npx", ["next", "start", "-p", String(PORT)], { cwd: join(import.meta.dirname, ".."), env: { ...process.env, DATABASE_URL_UNPOOLED: URL_ }, stdio: ["ignore", "pipe", "pipe"], detached: true });
server.stdout.on("data", () => {}); server.stderr.on("data", () => {});
let up = false;
for (let i = 0; i < 60 && !up; i++) { await new Promise((r) => setTimeout(r, 500)); try { up = (await fetch(BASE + "/")).status === 200; } catch {} }
if (!up) { console.log("FAIL  the app did not start"); try { process.kill(-server.pid); } catch {} process.exit(1); }
const browser = await chromium.launch({ executablePath: CHROME, args: ["--no-sandbox"] });
const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
await ctx.addInitScript(() => { try { sessionStorage.setItem("smp.welcome.done", "1"); } catch (e) {} });
const page = await ctx.newPage();
const errs = [];
page.on("pageerror", (e) => errs.push(e.message));

/* the breaks, on the served bytes */
if (brk) await page.route("**/shell.js", async (route) => {
  const r = await route.fetch(); let body = await r.text(); const orig = body;
  if (brk === "no-cache") body = body.replace("function cacheWrite(state, who) {", "function cacheWrite(state, who) { return;");
  if (brk === "late-baseline") body = body.replace(/lastSaved = serialize\(\);(\s*land\(function \(\) \{)/, "$1").replace("setInterval(save, 5000);", "lastSaved = serialize(); setInterval(save, 5000);");
  if (brk === "no-lock") body = body.replace('if (on) panel.setAttribute("inert", "");', "if (false) {}");
  if (body === orig) { console.log("FAIL  the break " + brk + " matched nothing"); process.exit(1); }
  await route.fulfill({ response: r, body });
});

/* the server's answer: held for `hold` ms, optionally altered, optionally refused */
let hold = 0, rename = null, refuse = false, posts = 0;
await page.route("**/api/state**", async (route) => {
  if (route.request().method() === "POST") { posts++; return route.continue(); }
  if (refuse) return route.abort();
  const r = await route.fetch();
  let j = await r.json();
  if (rename && j.state && j.state.units && j.state.units.mobile) j.state.units.mobile.name = rename;
  if (hold) await new Promise((res) => setTimeout(res, hold));
  await route.fulfill({ response: r, json: j });
});
const cacheOf = () => page.evaluate(() => { try { return JSON.parse(localStorage.getItem("smp.cache.raya-trade") || "null"); } catch (e) { return "unreadable"; } });
const where = "/raya-trade/strategy/mobile/strategy";

try {
  console.log("── 1 · the first open has nothing saved, and saves what it was handed");
  await page.goto(BASE + "/raya-trade/sign-in", { waitUntil: "networkidle" });
  await page.evaluate(() => localStorage.setItem("smp.cache.raya-trade", JSON.stringify({ person: { key: "someone" }, state: {} })));
  await page.waitForSelector(".gate[data-hydrated]", { state: "attached", timeout: 15000 });
  await page.fill("#user", "office@forefront.example"); await page.fill("#password", DEV_PASSWORD);
  await page.click("#loginForm button[type=submit]");
  await page.waitForURL((u) => !/sign-in/.test(u.pathname), { timeout: 15000 }).catch(() => {});
  check((await page.evaluate(() => localStorage.getItem("smp.cache.raya-trade"))) === null || (await cacheOf()).person.key !== "someone",
    "signing in wipes a saved copy left by whoever was here before");
  await page.goto(BASE + where, { waitUntil: "networkidle" });
  await page.waitForFunction(() => !document.documentElement.classList.contains("booting"), null, { timeout: 20000 });
  await page.waitForTimeout(600);
  const c1 = await cacheOf();
  check(c1 && c1.state && c1.state.units && c1.person && c1.person.key, "after a live open the client's page is saved, with the person it belongs to", JSON.stringify(c1 && c1.person));

  console.log("── 2 · the next open draws the saved copy at once, marked and locked");
  hold = 3000; rename = "Mobile Fresh";
  const t0 = Date.now();
  await page.goto(BASE + where);
  await page.waitForFunction(() => !document.documentElement.classList.contains("booting"), null, { timeout: 20000 }).catch(() => {});
  const early = Date.now() - t0;
  const s = await page.evaluate(() => ({
    stale: document.documentElement.getAttribute("data-stale"),
    flag: (document.getElementById("staleflag") || {}).textContent || "",
    inert: (document.getElementById("panel") || { hasAttribute: () => false }).hasAttribute("inert"),
    text: document.body.innerText.includes("Mobile Fresh"),
  }));
  check(early < 2500, "the page is drawn before the server answers (" + early + "ms against a 3000ms answer)", early);
  check(s.stale === "1" && /Updating/.test(s.flag), "…and it says it is the saved copy, \"Updating…\"", JSON.stringify(s));
  check(s.inert, "…and the page body takes no input while it is", JSON.stringify(s));
  check(!s.text, "…showing what was saved, not what the server is about to say", JSON.stringify(s));
  const typed = await page.evaluate(() => { const f = document.querySelector("#panel input, #panel textarea, #panel button, #panel [tabindex]"); if (!f) return "none"; f.focus(); return document.activeElement === f; });
  check(typed === false, "…a field in it cannot be focused (nothing typed there can be lost)", typed);
  check(posts === 0, "…and no save leaves while it is the saved copy", posts);

  console.log("── 3 · the fresh copy replaces it, and what changed shows");
  await page.waitForFunction(() => !document.documentElement.hasAttribute("data-stale"), null, { timeout: 15000 }).catch(() => {});
  await page.waitForTimeout(400);
  const f = await page.evaluate(() => ({
    stale: document.documentElement.hasAttribute("data-stale"),
    flag: !!document.getElementById("staleflag"),
    inert: document.getElementById("panel").hasAttribute("inert"),
    text: document.body.innerText.includes("Mobile Fresh"),
    signout: Array.from(document.querySelectorAll("#topacts button")).filter((b) => /sign out/i.test(b.textContent)).length,
  }));
  check(!f.stale && !f.flag && !f.inert, "the mark goes and the page takes input again once the answer lands", JSON.stringify(f));
  check(f.text, "…and the new name the server sent is on the screen — adjusted, not reloaded", JSON.stringify(f));
  check(f.signout <= 1, "…with the chrome drawn once, not twice", JSON.stringify(f));
  check(((await cacheOf()).state.units.mobile || {}).name === "Mobile Fresh", "…and the saved copy is now the fresh one");
  await page.waitForTimeout(1500);
  check(posts === 0, "…and landing the fresh copy saves nothing (nobody changed anything)", posts);
  rename = null; hold = 0;

  console.log("── 4 · a saved copy that belongs to somebody else is never drawn under this person");
  await page.evaluate(() => { const c = JSON.parse(localStorage.getItem("smp.cache.raya-trade")); c.person = Object.assign({}, c.person, { key: "not-this-person", name: "Somebody Else" }); localStorage.setItem("smp.cache.raya-trade", JSON.stringify(c)); });
  /* a DOCUMENT load, never a history change: the router rewrites the address
     after every paint, and framenavigated counts that too */
  let navs = 0; page.on("request", (rq) => { if (rq.resourceType() === "document" && rq.frame() === page.mainFrame()) navs++; });
  await page.goto(BASE + where);
  await page.waitForTimeout(4000);
  await page.waitForFunction(() => !document.documentElement.classList.contains("booting") && !document.documentElement.hasAttribute("data-stale"), null, { timeout: 20000 }).catch(() => {});
  check(navs === 2 && ((await cacheOf()).person.key !== "not-this-person"), "the page starts again, once, rather than repainting another person's chrome", navs);

  console.log("── 5 · a server that never answers still gets the wall, over the saved copy");
  refuse = true;
  await page.goto(BASE + where);
  await page.waitForTimeout(9500);
  check(await page.evaluate(() => !!document.querySelector(".nosrv-card")), "after the give-up the wall is up (§201)");
  refuse = false;

  console.log("── 6 · signing out wipes it");
  /* as a unit head, whose key is NOT the file's default viewer — as the office
     ("smo") the viewer assertion below could not fail (§113.8). The office's
     session is cleared first, or the sign-in address forwards a signed-in
     person on and the form is never drawn. */
  await page.context().clearCookies();
  await page.goto(BASE + "/raya-trade/sign-in", { waitUntil: "networkidle" });
  await page.waitForSelector(".gate[data-hydrated]", { state: "attached", timeout: 15000 });
  await page.fill("#user", "mobhead@raya.example"); await page.fill("#password", DEV_PASSWORD);
  await page.click("#loginForm button[type=submit]");
  await page.waitForURL((u) => !/sign-in/.test(u.pathname), { timeout: 15000 }).catch(() => {});
  await page.waitForTimeout(2500);
  await page.goto(BASE + where); await page.waitForTimeout(2500);
  const navs6 = navs;
  await page.goto(BASE + where);
  await page.waitForTimeout(6000);
  check(navs - navs6 <= 1, "a normal open navigates once — no reload loop", navs - navs6);
  await page.waitForFunction(() => !document.documentElement.hasAttribute("data-stale") && !document.documentElement.classList.contains("booting"), null, { timeout: 20000 }).catch(() => {});
  /* A FAST ANSWER LANDS INSIDE THE SAVED COPY'S 180ms FLOOR, and whichever
     landing runs first must draw the chrome (§415): the first build painted
     without it there, leaving VIEWER at the file's default — the office. */
  const fast = await page.evaluate(() => ({ viewer: window.VIEWER,
    signout: Array.from(document.querySelectorAll("#topacts button")).filter((b) => /sign out/i.test(b.textContent)).length }));
  const who = (await cacheOf()).person.key;
  check(fast.viewer === who && fast.signout === 1, "with a fast answer the page is this person's, chrome drawn once", JSON.stringify([fast, who]));
  await page.waitForTimeout(500);
  const btn = page.locator("#topacts button", { hasText: /sign out/i }).first();
  if (await btn.count()) await btn.click(); else await page.evaluate(() => document.getElementById("signout") && document.getElementById("signout").click());
  await page.waitForTimeout(1500);
  check((await page.evaluate(() => Object.keys(localStorage).filter((k) => k.indexOf("smp.cache.") === 0).length)) === 0, "no saved copy survives signing out");
  check(errs.length === 0, "no page errors", errs.join(" | "));
} catch (e) { check(false, "the run died rather than reporting (§215)", e.message); }
await browser.close();
try { process.kill(-server.pid); } catch {}
console.log((fails ? "RED   " : "GREEN ") + oks + " ok, " + fails + " failed");
process.exit(fails ? 1 : 0);
