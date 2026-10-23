/* THE PROCESSES LIFECYCLE, THE STAFF READING VIEW AND THEIR GATE — against a real server and a real database.
   Nothing here is stubbed: the app is `next start`, the people sign in at the real door, and every press is a
   real server action.

     DATABASE_URL_UNPOOLED=postgres://…/smp_dev node checks/processes-e2e.mjs

   What it proves, in the order a client would meet it:
     · the office sends a draft for review, the named approver (and nobody else) approves, and it publishes;
     · a client's own person on the register can read it and acknowledge it — and can open NOTHING else of
       Processes (every office page answers in words, none shows a process);
     · a draft is invisible to staff; a signed-out visitor is sent to sign in;
     · the top bar says "N to read" on Strategy's frozen bar and on the shared bar, and the count falls when
       they acknowledge;
     · the office sees who has and has not read it, and the review calendar.
   Needs `npm run build` first and the chromium this image carries. Development and the checks only. */
import { spawn } from "node:child_process";
import { chromium } from "playwright-core";
import pg from "pg";
import { SCHEMA } from "../db/schema-name.mjs";
import { devTenant, DEV_PASSWORD } from "../scripts/dev-tenant.mjs";
import { applyFfp } from "../db/apply-ffp.mjs";
import { hashPassword } from "../lib/auth.ts";

const URL_ = process.env.DATABASE_URL_UNPOOLED || "postgres://postgres:postgres@localhost:5432/smp_dev";
const CHROME = process.env.SMP_CHROME || "/opt/pw-browsers/chromium-1194/chrome-linux/chrome";
const PORT = 3981, BASE = "http://localhost:" + PORT, S = "raya-trade";
let oks = 0, fails = 0;
const check = (c, l, m) => { if (c) { oks++; console.log("ok    " + l); } else { fails++; console.log("FAIL  " + l + (m === undefined ? "" : " — " + String(m).slice(0, 240))); } };

const { tenantId } = await devTenant({ url: URL_, log: () => {} });
await applyFfp(URL_, { log: () => {} });
const smp = new pg.Pool({ connectionString: URL_, max: 2, options: "-c search_path=" + SCHEMA });
const ffp = new pg.Pool({ connectionString: URL_, max: 2, options: "-c search_path=ffprocess" });
const q = async (pool, sql, args) => (await pool.query(sql, args)).rows;
/* a rerun starts clean: Processes' rows for this client go with its workspace (devTenant only remakes SMP's side) */
await q(ffp, "delete from workspaces where id = $1", [S]);

/* the client holds Processes and Notes; a second office login (the approver) */
const mt = (await q(smp, "select data_type from information_schema.columns where table_name='tenants' and column_name='modules'"))[0].data_type;
const mods = ["strategy", "notes", "processes"];
await q(smp, "update tenants set modules = $1 where key = $2", [mt === "jsonb" ? JSON.stringify(mods) : mods, S]);
const APPROVER = "fn_fin@raya.example", OFFICE = "office@forefront.example", STAFF = "mobhead@raya.example";
/* a second office login who is NOT the approver, to prove the office cannot approve for them */
const u2 = (await q(smp, "insert into users (email, name, kind, is_admin, must_change, password_hash) values ('second@forefront.example','Second Office','office',false,false,$1) returning id", [hashPassword(DEV_PASSWORD)]))[0];
await q(smp, "insert into tenant_users (tenant_id, user_id, person_key, seat) values ($1,$2,'cfo','smoteam')", [tenantId, u2.id]);

/* the approver's email lives where it does for a real client: on the SMP People register (Processes mirrors it) */
await q(smp, "update people set extra = coalesce(extra, '{}'::jsonb) || jsonb_build_object('email', $1::text) where tenant_id = $2 and key = 'fn_fin'", [APPROVER, tenantId]);

const server = spawn("npx", ["next", "start", "-p", String(PORT)], { cwd: new URL("..", import.meta.url).pathname, env: { ...process.env, DATABASE_URL_UNPOOLED: URL_ }, stdio: ["ignore", "pipe", "pipe"], detached: true });
server.stdout.on("data", () => {}); server.stderr.on("data", () => {});
const stop = () => { try { process.kill(-server.pid); } catch {} };
process.on("exit", stop);
let up = false;
for (let i = 0; i < 80 && !up; i++) { await new Promise((r) => setTimeout(r, 500)); try { up = (await fetch(BASE + "/")).status === 200; } catch {} }
if (!up) { console.log("FAIL  the app did not start"); stop(); process.exit(1); }

const browser = await chromium.launch({ executablePath: CHROME, args: ["--no-sandbox"] });
async function as(email) {
  const ctx = await browser.newContext({ viewport: { width: 1300, height: 900 } });
  await ctx.addInitScript(() => { try { sessionStorage.setItem("smp.welcome.done", "1"); } catch (e) {} });
  const page = await ctx.newPage();
  const errs = []; page.on("pageerror", (e) => errs.push(String(e).slice(0, 160)));
  await page.goto(BASE + "/" + S + "/sign-in", { waitUntil: "networkidle" });
  await page.waitForSelector(".gate[data-hydrated]", { state: "attached", timeout: 20000 });
  await page.fill("#user", email); await page.fill("#password", DEV_PASSWORD);
  await page.click("#loginForm button[type=submit]");
  await page.waitForURL((u) => !/sign-in/.test(u.pathname), { timeout: 20000 }).catch(() => {});
  return { ctx, page, errs, get: (p) => ctx.request.get(BASE + p, { maxRedirects: 0 }) };
}
/* a wait that says what the page showed when it gave up, so a red run is a finding and not a mystery */
const waitFor = async (page, sel, why) => {
  try { await page.waitForSelector(sel, { timeout: 20000 }); }
  catch (e) { console.log("      gave up waiting for " + why + " at " + page.url() + "\n      the page said: " + (await page.innerText("body").catch(() => "?")).replace(/\s+/g, " ").slice(0, 1600)); throw e; }
};
const body = async (page) => (await page.innerText("body")).replace(/\s+/g, " ");

/* ── the office opens Processes: the workspace and the register mirror now exist ── */
const A = await as(OFFICE);
const opened = await A.get("/" + S + "/processes/processes");
check(opened.status() === 200, "the office opens Processes", opened.status());
await A.page.goto(BASE + "/" + S + "/processes/processes", { waitUntil: "networkidle" });

/* seed: roles, who holds them, two processes (neither published) */
const people = Object.fromEntries((await q(ffp, 'select id, "smpKey" k from people where "workspaceId"=$1', [S])).map((r) => [r.k, r.id]));
check(!!(people.mobhead && people.fn_fin), "the register is mirrored into Processes", Object.keys(people).join(","));
const role = async (name) => (await q(ffp, 'insert into roles (id,"workspaceId",name) values (gen_random_uuid()::text,$1,$2) returning id', [S, name]))[0].id;
const rFin = await role("Head of Finance"), rCc = await role("Credit Controller");
for (const [p, r] of [["fn_fin", rFin], ["fn_fin", rCc], ["mobhead", rCc]]) await q(ffp, 'insert into person_roles ("personId","roleId") values ($1,$2)', [people[p], r]);
const proc = async (code, name) => {
  const id = (await q(ffp, 'insert into processes (id,"workspaceId",code,name,"processPurpose","updatedAt") values (gen_random_uuid()::text,$1,$2,$3,$4,now()) returning id', [S, code, name, "Turn an accepted order into cash."]))[0].id;
  for (const [i, l] of ["Check the customer's credit", "Raise the invoice"].entries())
    await q(ffp, 'insert into process_steps (id,"processId",type,label,"assignedRoleId","order","detailedAction") values (gen_random_uuid()::text,$1,\'TASK\',$2,$3,$4,$5)', [id, l, rCc, i, ["Open the file"]]);
  return id;
};
const P1 = await proc("P1.1", "Order to cash"), P2 = await proc("P2.4", "Supplier onboarding");
const st = async (id) => (await q(ffp, 'select "lifecycleStatus" s, "sopVersion" v, "approverName" an, "approverRole" ar, "nextReviewDue" d from processes where id=$1', [id]))[0];
check((await st(P2)).s === "DRAFT", "a new process starts as a draft");

/* ── 1 · the lifecycle, as the office ── */
const L = (id) => BASE + "/" + S + "/processes/processes/" + id + "?tab=lifecycle";
await A.page.goto(L(P2), { waitUntil: "networkidle" });
await A.page.waitForSelector("select[name=approver]");
const approverOpts = await A.page.$$eval("select[name=approver] option", (o) => o.map((x) => ({ t: x.textContent, d: x.disabled })));
check(approverOpts.some((o) => /— Head of Finance/.test(o.t) && !o.d), "the approver list offers somebody with an email and a role", JSON.stringify(approverOpts.filter((o) => /CFO|Finance/.test(o.t))));
check(approverOpts.some((o) => /no (email|role)/.test(o.t) && o.d), "people with no email or no role are offered greyed out");
await A.page.selectOption("select[name=approver]", people.fn_fin);
await A.page.fill("textarea[name=changeNote]", "First version: added the credit check");
await A.page.click("button:text-is('Send for review')");
await A.page.waitForFunction(() => /Waiting for/.test(document.body.innerText) || document.querySelector("[role=alert]"), null, { timeout: 20000 });
const said = await A.page.locator("[role=alert]").first().innerText().catch(() => "");
if (said) console.log("      the page said: " + said);
let r = await st(P2);
check(r.s === "IN_REVIEW" && /Head of Finance/.test(r.ar) && !!r.an, "sent for review, approver recorded with name and role", JSON.stringify(r));
check(!(await A.page.$("button:text-is('Approve')")), "the person who sent it cannot approve it");

/* a member of staff who is not the approver cannot see it while it waits */
const T = await as(STAFF);
check(!/Supplier onboarding/.test(await (await T.get("/" + S + "/processes/read")).text()), "staff do not see a process that is only in review");
check((await T.get("/" + S + "/processes/read/" + P2)).status() === 404, "…nor open it by its address");

/* the office cannot approve on the approver's behalf: another office login sees no Approve, only the wait */
const O2 = await as("second@forefront.example");
await O2.page.goto(L(P2), { waitUntil: "networkidle" });
check(/Waiting for/.test(await body(O2.page)) && !(await O2.page.$("button:text-is('Approve')")), "another office login cannot approve for them");

/* the named approver is a CLIENT person on the register, and approves from their own reading page */
const B = await as(APPROVER);
const bl = await B.get("/" + S + "/processes/read");
const blText = await bl.text();
check(bl.status() === 200 && /Waiting for your approval/.test(blText) && /Supplier onboarding/.test(blText), "the approver's reading list says it is waiting for their approval", bl.status());
await B.page.goto(BASE + "/" + S + "/processes/read", { waitUntil: "networkidle" });
check(/1 to approve/.test((await B.page.locator("a.tbread").first().innerText().catch(() => "")) || ""), "the top bar says 1 to approve");
await B.page.goto(BASE + "/" + S + "/processes/read/" + P2, { waitUntil: "networkidle" });
await waitFor(B.page, "button:text-is('Approve')", "the approver's Approve button on the reading page");
const bt = await body(B.page);
check(/For your approval/.test(bt) && /credit check/.test(bt) && /Check the customer's credit/.test(bt), "they see what changed and the steps before approving");
await B.page.click("button:text-is('Approve')");
await B.page.waitForFunction(() => /\/processes\/read$/.test(location.pathname), null, { timeout: 20000 });
r = await st(P2);
const v = (await q(ffp, 'select number, "approvedBy" b, "approvedRole" ro, "changeNote" n from process_versions where "processId"=$1', [P2]))[0];
check(r.s === "APPROVED" && v && v.number === 1 && v.b === r.an && /Head of Finance/.test(v.ro) && /credit check/.test(v.n), "the named approver approves: version 1 records who, in which role, and what changed", JSON.stringify([r, v]));

/* the office publishes */
await A.page.goto(L(P2), { waitUntil: "networkidle" });
await waitFor(A.page, "button:text-is('Publish')", "Publish after approval");
await A.page.click("button:text-is('Publish')");
await waitFor(A.page, "button:text-is('Retire')", "Retire after publishing");
r = await st(P2);
const days = (new Date(r.d) - Date.now()) / 86400000;
check(r.s === "PUBLISHED" && r.v === "v1" && days > 360 && days < 370, "published: version stamped on the SOP, review a year out", JSON.stringify(r));
check((await body(A.page)).includes("Link for staff"), "the office is given the staff link");
const row = (await A.get("/" + S + "/processes/processes")).ok() ? await (async () => { await A.page.goto(BASE + "/" + S + "/processes/processes", { waitUntil: "networkidle" }); return body(A.page); })() : "";
check(/Published/.test(row) && /Draft/.test(row), "the process list shows each status");
await A.page.goto(BASE + "/" + S + "/processes/governance", { waitUntil: "networkidle" });
const gov = await body(A.page);
check(/Process review calendar/.test(gov) && /Later · 1/i.test(gov) && /Supplier onboarding/.test(gov) && /Staff reading page/.test(gov), "the review calendar and the staff link are on Governance", (gov.match(/Process review calendar.{0,260}/) || ["no calendar section: " + gov.slice(0, 200)])[0]);

/* ── 1a · the exported report states the process's real document control ── */
const report = async (id) => { await A.page.goto(BASE + "/" + S + "/processes/reports?ids=" + id, { waitUntil: "networkidle" }); return body(A.page); };
const rp = await report(P2);
const an = (await st(P2)).an;
check(/Status Published/.test(rp) && /Version v1/.test(rp) && /Effective Date \d{4}-\d{2}-\d{2}/.test(rp), "the report shows the published version, status and effective date", (rp.match(/Document ID.{0,260}/) || [rp.slice(0, 200)])[0]);
check(new RegExp("Approved By " + an.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")).test(rp), "…and who approved it");
check(/Review Cycle Every 12 months · next \d{4}-\d{2}-\d{2}/.test(rp), "…and the real review cycle and next review date, not 'Annual'");
const rd1 = await report(P1);
check(/Status Draft/.test(rd1) && /Version —/.test(rd1) && /Approved By —/.test(rd1), "a draft says Draft and shows dashes, not an invented version", (rd1.match(/Document ID.{0,260}/) || [rd1.slice(0, 200)])[0]);

/* ── 1b · moving in and out of every part of a process ── */
const nav = async (pg, path) => { await pg.goto(BASE + "/" + S + "/processes/processes/" + P2 + path, { waitUntil: "networkidle" }); return pg.$$eval("nav[aria-label='Process sections'] a", (a) => a.map((x) => x.textContent)); };
const onMap = await nav(A.page, "/map");
check(onMap.length === 7 && onMap[0] === "Overview" && onMap.includes("Risks & controls") && onMap.includes("People"), "the Process Map page shows the process's own tabs", JSON.stringify(onMap));
for (const pth of ["/raci", "/authority", "/review"]) check((await nav(A.page, pth)).length === 0, "…and " + pth.slice(1) + " does not", pth);
const stepHref = await A.page.$eval("a[aria-label^='Process —']", (a) => a.getAttribute("href")).catch(() => null);
check(stepHref === "/" + S + "/processes/processes/" + P2, "the strip's Process button goes to this process's own page, not the list", stepHref);
const onPage = await nav(A.page, "");
check(onPage.length === 7 && !!(await A.page.$("a[aria-label^='Process Map']")), "the process page carries the same strip as the others");
await nav(A.page, "/map");
await A.page.click("nav[aria-label='Process sections'] >> text=Risks & controls");
await A.page.waitForURL(/tab=risks/, { timeout: 20000 });
check(/Risks & controls/.test(await body(A.page)), "from the map into Risks & controls");
await A.page.click("a[aria-label^='Process Map']");
await A.page.waitForURL(/\/map$/, { timeout: 20000 });
check(true, "…and back to the map from the strip");

/* ── 2 · staff: read and acknowledge ── */
const list = await T.get("/" + S + "/processes/read");
const listText = await list.text();
check(list.status() === 200 && /Supplier onboarding/.test(listText) && !/Order to cash/.test(listText), "staff see the published process and not the draft", list.status());
await T.page.goto(BASE + "/" + S + "/processes/read", { waitUntil: "networkidle" });
check(/Needs your acknowledgement/.test(await body(T.page)), "it asks for their acknowledgement");
check(/1 to read/.test((await T.page.locator("a.tbread").first().innerText().catch(() => "")) || ""), "the shared top bar says 1 to read on the reading pages");
const strat = await (await T.get("/" + S + "/strategy")).text();
check(/data-processes-read='[^']*1 to read/.test(strat), "Strategy's page is stamped with the count");
await T.page.goto(BASE + "/" + S + "/strategy", { waitUntil: "networkidle" });
await T.page.waitForSelector("a.processes-read", { timeout: 25000 }).catch(() => {});
const sl = await T.page.locator("a.processes-read").first().innerText().catch(() => "");
check(/Processes/.test(sl) && /1 to read/.test(sl), "Strategy's frozen bar draws the link with the count", sl);
check((await T.page.locator("a.processes-read").first().getAttribute("href").catch(() => "")) === "/" + S + "/processes/read", "…and it goes to the reading list");
const notes = await T.get("/" + S + "/notes");
const notesHtml = notes.status() === 200 ? await notes.text() : "";
check(notes.status() !== 200 || /class="tbread"/.test(notesHtml), "a module page drawn by the shared bar carries it too", notes.status());

await T.page.goto(BASE + "/" + S + "/processes/read/" + P2, { waitUntil: "networkidle" });
const rd = await body(T.page);
check(/What changed in this version/.test(rd) && /credit check/.test(rd) && /Check the customer's credit/.test(rd) && /Done by: Credit Controller/.test(rd), "the reading page shows what changed and the steps with who does them");
check(!/Risks|Non-conform|Approver|Reviewer|Lifecycle/i.test(rd), "…and none of the office's working material");
await T.page.click("button:text-is('I have read this')");
await T.page.waitForFunction(() => /You have read version 1/.test(document.body.innerText), null, { timeout: 20000 });
const ack = await q(ffp, 'select "personKey" k, "versionNumber" n, "personName" nm from process_acknowledgements where "processId"=$1', [P2]);
check(ack.length === 1 && ack[0].k === "mobhead" && ack[0].n === 1, "the acknowledgement is recorded against the person and the version", JSON.stringify(ack));
const strat2 = await (await T.get("/" + S + "/strategy")).text();
check(/data-processes-read='[^']*&quot;count&quot;:null/.test(strat2), "the count falls to none once they have read it");

/* a second person is unaffected, and the office sees the tally */
check(/Needs your acknowledgement/.test(await (await B.get("/" + S + "/processes/read")).text()), "another person still has it to read");
await A.page.goto(L(P2), { waitUntil: "networkidle" });
const tally = await body(A.page);
check(/1 of 2 have confirmed/.test(tally) && /Still to read:/.test(tally), "the office sees 1 of 2 have confirmed, and who is outstanding", (tally.match(/Read and acknowledged.{0,120}/) || [""])[0]);

/* ── 3 · the gate: a client's own person opens nothing else of Processes ── */
const office = ["processes/priorities", "processes/reports/priorities", "processes", "processes/processes", "processes/processes/" + P2, "processes/processes/" + P2 + "/map", "processes/processes/" + P2 + "/raci", "processes/processes/" + P2 + "/review", "processes/governance", "processes/reports", "processes/reports/sop", "processes/export", "processes/org", "processes/value-chain", "processes/helicopter"];
for (const p of office) {
  const res = await T.get("/" + S + "/" + p);
  const t = await res.text();
  const loc = res.headers().location || "";
  const redirected = res.status() >= 300 && res.status() < 400 && new RegExp("/" + S + "/processes/read$").test(loc);
  const leaked = /Supplier onboarding|Order to cash|Check the customer|Send for review|kpis|controlPoints/.test(t);
  check(redirected && !leaked, "staff are sent to their reading page from /" + p + ", and nothing of the page comes with it", res.status() + " " + loc + (leaked ? " LEAKED " + (t.match(/Supplier onboarding|Order to cash|Check the customer|Send for review|kpis|controlPoints/) || [""])[0] : ""));
}
for (const api of ["/api/ffp/export/report/" + S, "/api/ffp/export/process-map/" + P2, "/api/ffp/export/raci/" + P2, "/api/ffp/export/org-chart/" + S]) {
  const res = await T.get(api);
  check(res.status() !== 200, "staff cannot download " + api.split("/").slice(3, 5).join("/"), res.status());
}
const draft = await T.get("/" + S + "/processes/read/" + P1);
check(draft.status() === 404, "a draft is not readable by staff, even by its address", draft.status());
const anon = await (await browser.newContext()).request.get(BASE + "/" + S + "/processes/read", { maxRedirects: 0 });
check(anon.status() >= 300 && anon.status() < 400 && /sign-in/.test(anon.headers().location || ""), "a signed-out visitor is sent to sign in", anon.status() + " " + anon.headers().location);

/* ── 3b · Priorities: choosing which processes to take deep, and the client's sign-off ── */
const extra = [["P3.1", "Inventory & Stock Count"], ["P4.1", "Credit & Collections"], ["P5.1", "Hire to Retire"]];
for (const [c, n] of extra) await proc(c, n);
await A.page.goto(BASE + "/" + S + "/processes/priorities", { waitUntil: "networkidle" });
check(await A.page.isVisible("nav[aria-label='Steps']") && (await A.page.$$("tbody tr")).length === 5, "Priorities lists every high-level process");
const dot = (name, k, n) => A.page.click(`button[aria-label='${k} ${n} of 5 for ${name}']`);
const scoreOf = async (name) => A.page.$$eval("tbody tr", (rows, nm) => { const r = rows.find((x) => x.textContent.includes(nm)); return r ? (r.querySelector("td.tabular-nums")?.textContent ?? "") : "?"; }, name);
const waitScore = (name, v) => A.page.waitForFunction(([nm, val]) => { const r = [...document.querySelectorAll("tbody tr")].find((x) => x.textContent.includes(nm)); return r && r.querySelector("td.tabular-nums")?.textContent === val; }, [name, v], { timeout: 20000 });
await dot("Order to cash", "importance", 5); await dot("Order to cash", "complexity", 4); await dot("Order to cash", "risk", 5);
await waitScore("Order to cash", "95");
check((await scoreOf("Order to cash")) === "95", "scoring three dots gives the weighted score out of 100 (95)");
await dot("Supplier onboarding", "importance", 3); await dot("Supplier onboarding", "complexity", 2); await dot("Supplier onboarding", "risk", 3);
await waitScore("Supplier onboarding", "55");
check((await scoreOf("Supplier onboarding")) === "55", "a second process scores 55");
check((await scoreOf("Inventory & Stock Count")) === "—", "a process not yet scored has no score and no rank");
await dot("Inventory & Stock Count", "importance", 4);
await A.page.waitForSelector("text=suggested", { timeout: 20000 }).catch(() => {});
check(/suggested \d: \d+ steps/.test(await body(A.page)), "complexity is offered from the map as a suggestion, with its reason");
await A.page.click("button:text-is('Fill the empty complexity and risk from the map')");
await A.page.waitForSelector("[role=status]:has-text('Filled')", { timeout: 20000 });
check(true, "the suggestions are accepted only when asked for");
const imp = await q(ffp, 'select "priorityImportance" i, "priorityComplexity" c, "priorityRisk" r from processes where code=$1 and "workspaceId"=$2', ["P3.1", S]);
check(imp[0].i === 4 && imp[0].c != null && imp[0].r == null, "…importance stays the office's own, and a risk nobody logged is not invented", JSON.stringify(imp));
await A.page.selectOption("select[aria-label='Decision for Order to cash']", "WAVE_1");
await A.page.selectOption("select[aria-label='Decision for Supplier onboarding']", "WAVE_2");
await A.page.waitForFunction(() => document.querySelector("select[aria-label='Decision for Supplier onboarding']")?.value === "WAVE_2");
await A.page.waitForTimeout(600);
const dec = Object.fromEntries((await q(ffp, 'select code, "deepDiveDecision" d from processes where "workspaceId"=$1', [S])).map((r) => [r.code, r.d]));
check(dec["P1.1"] === "WAVE_1" && dec["P2.4"] === "WAVE_2", "decisions are saved", JSON.stringify(dec));
await A.page.click("button:text-is('Suggest waves from the ranking')");
await A.page.waitForSelector("[role=status]:has-text('Set')", { timeout: 20000 });
const dec2 = Object.fromEntries((await q(ffp, 'select code, "deepDiveDecision" d from processes where "workspaceId"=$1', [S])).map((r) => [r.code, r.d]));
check(dec2["P1.1"] === "WAVE_1" && dec2["P2.4"] === "WAVE_2", "suggesting waves never changes a decision somebody made");
check(dec2["P4.1"] == null && dec2["P5.1"] == null, "…and leaves unscored processes undecided", JSON.stringify(dec2));

await A.page.goto(BASE + "/" + S + "/processes/priorities?step=rank", { waitUntil: "networkidle" });
check((await A.page.$$("svg circle")).length === 3 && /Not scored yet/.test(await body(A.page)), "the chart plots the scored processes and names the rest");
await A.page.click("svg a >> nth=0"); await A.page.waitForURL(/sel=/, { timeout: 20000 });
check(/selected/i.test(await body(A.page)), "a circle opens that process beside the chart");
await A.page.goto(BASE + "/" + S + "/processes/priorities?step=plan", { waitUntil: "networkidle" });
const w1 = await A.page.$$eval("section[aria-label='Wave 1'] article", (a) => a.map((x) => x.textContent));
check(w1.length === 1 && /Order to cash/.test(w1[0]) && /Deep dive \d of 6/.test(w1[0]), "the plan puts the process in its wave with its deep-dive progress", JSON.stringify(w1));
check(/Team capacity: 4 deep dives at a time\. Wave 1 holds 1 — fits/.test(await body(A.page)), "…and says whether Wave 1 fits the team");

await A.page.goto(BASE + "/" + S + "/processes/processes", { waitUntil: "networkidle" });
const lst = await body(A.page);
check(/Order to cash.*Deep dive.*Wave 1 · rank 1/.test(lst) && /High-level/.test(lst), "the process list shows Depth and Priority");
await A.page.goto(BASE + "/" + S + "/processes/processes/" + P1, { waitUntil: "networkidle" });
check(/Wave 1 · rank 1 · deep dive \d of 6/.test(await body(A.page)), "the process page says why it is being worked on and how far it has got");
await A.page.goto(BASE + "/" + S + "/processes/helicopter", { waitUntil: "networkidle" });
await A.page.waitForSelector("text=Deep dive", { timeout: 25000 }).catch(() => {});
check(/Deep dive/.test(await body(A.page)), "the Helicopter View marks what is being taken deep");

await A.page.goto(BASE + "/" + S + "/processes/priorities?step=sign", { waitUntil: "networkidle" });
const doc = await body(A.page);
check(/Deep-dive priorities — /.test(doc) && /Wave 1/.test(doc) && /Order to cash/.test(doc) && /Draft/.test(doc) && !/suggested/i.test(doc.split("Who signs")[0]), "the sign-off page is the client's page: weights, waves and reasons, nothing from the working view");
await A.page.selectOption("select[aria-label='Who signs for the client']", people.fn_fin);
await A.page.click("button:text-is('Send to client for approval')");
await A.page.waitForFunction(() => /Waiting for/.test(document.body.innerText), null, { timeout: 20000 });
const pl = (await q(ffp, 'select status, "approverName" a, "approverRole" r, snapshot from priority_plans where "workspaceId"=$1', [S]))[0];
check(pl.status === "SENT" && !!pl.a && /Head of Finance/.test(pl.r) && pl.snapshot.rows.length >= 2, "sent: the approver's name and role and what was sent are recorded", JSON.stringify([pl.status, pl.a, pl.r]));
await A.page.goto(BASE + "/" + S + "/processes/priorities?step=score", { waitUntil: "networkidle" });
check((await A.page.isDisabled("button[aria-label='importance 3 of 5 for Order to cash']")) && /with the client/.test(await body(A.page)), "once sent, scores and decisions are locked");

await B.page.goto(BASE + "/" + S + "/processes/read", { waitUntil: "networkidle" });
check(/Deep-dive priorities/.test(await body(B.page)) && /Waiting for your approval/.test(await body(B.page)), "the named approver is told, on their reading list");
check(/1 to approve/.test((await B.page.locator("a.tbread").first().innerText().catch(() => "")) || ""), "…and on the top bar");
await B.page.goto(BASE + "/" + S + "/processes/read/priorities", { waitUntil: "networkidle" });
await waitFor(B.page, "button:text-is('Approve')", "the approver's Approve button on the plan");
const bp = await body(B.page);
check(/Wave 1/.test(bp) && /Order to cash/.test(bp) && /35%/.test(bp) && !/suggested/i.test(bp), "they see exactly what was sent");
check((await T.get("/" + S + "/processes/read/priorities")).status() === 404, "nobody else on the register can open it");
await B.page.click("button:text-is('Approve')");
await B.page.waitForFunction(() => /\/processes\/read$/.test(location.pathname), null, { timeout: 20000 });
const ap = (await q(ffp, 'select status, "approvedByName" n, "approvedByRole" r, history from priority_plans where "workspaceId"=$1', [S]))[0];
check(ap.status === "APPROVED" && !!ap.n && /Head of Finance/.test(ap.r) && ap.history.length >= 2, "approved: who, in which role, and the record", JSON.stringify([ap.status, ap.n]));
const pr = await A.get("/" + S + "/processes/reports/priorities");
const prt = await pr.text();
check(pr.status() === 200 && /Approved by/.test(prt) && /Order to cash/.test(prt), "the one-page export shows the approval");
await A.page.goto(BASE + "/" + S + "/processes/priorities?step=sign", { waitUntil: "networkidle" });
await A.page.fill("input[aria-label='Why reopen']", "Client asked to add Credit & Collections");
await A.page.click("button:text-is('Reopen')");
await A.page.waitForFunction(() => document.querySelector("button")?.textContent !== undefined && !/Changing it from here needs a reason/.test(document.body.innerText), null, { timeout: 20000 });
const ro = (await q(ffp, 'select status, history from priority_plans where "workspaceId"=$1', [S]))[0];
check(ro.status === "DRAFT" && ro.history.some((h) => /Reopened/.test(h.what) && /Credit & Collections/.test(h.reason || "")), "reopening takes a reason and keeps it on record", JSON.stringify(ro.history.slice(-1)));

/* ── 4 · the office is unaffected, and its exports carry nothing from the AI review ── */
const rep = await A.get("/" + S + "/processes/reports");
check(rep.status() === 200 && !/AI Review|from AI review/.test(await rep.text()), "the office's report page opens and says nothing from the AI review", rep.status());
const exp = await A.get("/api/ffp/export/report/" + S);
check(exp.status() < 500, "the report export does not error on the new columns", exp.status());
check(!/data-processes-read/.test(await (await A.get("/" + S + "/strategy")).text()), "the office's own pages carry no staff link");
check([A, B, T, O2].every((x) => x.errs.length === 0), "no page errors anywhere", JSON.stringify([A, B, T, O2].map((x) => x.errs)));

await browser.close(); stop();
console.log(`\n${fails ? "RED" : "GREEN"}   ${oks} ok, ${fails} failed`);
process.exit(fails ? 1 : 0);
