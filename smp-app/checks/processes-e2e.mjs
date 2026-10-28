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
const bl = await B.get("/" + S + "/processes/read/todo");
const blText = await bl.text();
check(bl.status() === 200 && /To approve/.test(blText) && /Supplier onboarding/.test(blText) && /Version 1 is ready for your approval/.test(blText), "the approver's To do says it is waiting for their approval", bl.status());
await B.page.goto(BASE + "/" + S + "/processes/read", { waitUntil: "networkidle" });
check(/1 to approve/.test((await B.page.locator("a.tbread").first().innerText().catch(() => "")) || ""), "the top bar says 1 to approve");
await B.page.goto(BASE + "/" + S + "/processes/read/" + P2, { waitUntil: "networkidle" });
await waitFor(B.page, "button:text-is('Approve v1')", "the approver's Approve button on the reading page");
const bt = await body(B.page);
check(/for your approval/i.test(bt) && /credit check/.test(bt) && /Check the customer's credit/.test(bt), "they see what changed and the steps before approving");
await B.page.click("button:text-is('Approve v1')");
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

/* ── 1b · moving in and out of every part of a process: the builder page's menu of sections (spec 067 §4.3) ── */
const nav = async (pg, path) => { await pg.goto(BASE + "/" + S + "/processes/processes/" + P2 + path, { waitUntil: "networkidle" }); return pg.$$eval("nav[aria-label='Process sections'] a", (a) => a.map((x) => x.textContent.trim())); };
const current = (pg) => pg.$$eval("nav[aria-label='Process sections'] a[aria-current=page]", (a) => a.map((x) => x.textContent.trim()));
const onMap = await nav(A.page, "/map");
check(onMap.length === 10 && onMap[0] === "Map" && onMap.includes("Risks & controls") && onMap.includes("People") && /^Check with AI/.test(onMap[9]), "the Process Map page shows the builder's menu of the process's ten sections", JSON.stringify(onMap));
for (const [pth, label] of [["/raci", "RACI"], ["/authority", "Authority"], ["/review", "Check with AI"]]) {
  const items = await nav(A.page, pth), on = await current(A.page);
  check(items.length === 10 && on.length === 1 && on[0].startsWith(label), "…and " + pth.slice(1) + " carries the same menu, with " + label + " marked", JSON.stringify(on));
}
const mapHref = await A.page.$eval("nav[aria-label='Process sections'] a:has-text('Map')", (a) => a.getAttribute("href")).catch(() => null);
check(mapHref === "/" + S + "/processes/processes/" + P2 + "/map", "the menu's Map goes to this process's own map, not the list", mapHref);
const onPage = await nav(A.page, "");
check(new URL(A.page.url()).pathname.endsWith("/" + P2 + "/map") && onPage.length === 10, "the process's own address opens the builder on its Map", A.page.url());
await nav(A.page, "/map");
await A.page.click("nav[aria-label='Process sections'] >> text=Risks & controls");
await A.page.waitForURL(/tab=risks/, { timeout: 20000 });
check(/Risks & controls/.test(await body(A.page)), "from the map into Risks & controls");
await A.page.click("nav[aria-label='Process sections'] a:has-text('Map')");
await A.page.waitForURL(/\/map$/, { timeout: 20000 });
check(true, "…and back to the map from the menu");

/* ── 2 · staff: read and acknowledge ── */
const list = await T.get("/" + S + "/processes/read");
const listText = await list.text();
check(list.status() === 200 && /Supplier onboarding/.test(listText) && !/Order to cash/.test(listText), "staff see the published process and not the draft", list.status());
await T.page.goto(BASE + "/" + S + "/processes/read", { waitUntil: "networkidle" });
check(/To read/.test(await (await T.get("/" + S + "/processes/read/todo")).text()) && /Supplier onboarding/.test(await (await T.get("/" + S + "/processes/read/todo")).text()), "their To do asks them to read it");
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

await T.page.goto(BASE + "/" + S + "/processes/read/" + P2 + "?tab=summary", { waitUntil: "networkidle" });
const rdSum = await body(T.page);
await T.page.goto(BASE + "/" + S + "/processes/read/" + P2 + "?tab=steps", { waitUntil: "networkidle" });
const rd = await body(T.page);
check(/Version 1 is in force/.test(rdSum) && /credit check/.test(rdSum) && /Check the customer's credit/.test(rd) && /Done by: Credit Controller/.test(rd), "the reading page shows what changed and the steps with who does them");
check(!/Risks & controls|Non-conform|Reviewer|Lifecycle|Send for review/i.test(rd + rdSum), "…and none of the office's working material");
await T.page.click("header button:text-is('I have read it')");
await T.page.waitForFunction(() => !/Waiting on you/.test(document.querySelector("[data-ffp] header")?.innerText || "Waiting on you"), null, { timeout: 20000 });
const ack = await q(ffp, 'select "personKey" k, "versionNumber" n, "personName" nm from process_acknowledgements where "processId"=$1', [P2]);
check(ack.length === 1 && ack[0].k === "mobhead" && ack[0].n === 1, "the acknowledgement is recorded against the person and the version", JSON.stringify(ack));
const strat2 = await (await T.get("/" + S + "/strategy")).text();
check(/data-processes-read='[^']*&quot;count&quot;:null/.test(strat2), "the count falls to none once they have read it");

/* a second person is unaffected, and the office sees the tally */
check(/To read/.test(await (await B.get("/" + S + "/processes/read/todo")).text()), "another person still has it to read");
await A.page.goto(L(P2), { waitUntil: "networkidle" });
const tally = await body(A.page);
check(/1 of 2 have confirmed/.test(tally) && /Still to read:/.test(tally), "the office sees 1 of 2 have confirmed, and who is outstanding", (tally.match(/Read and acknowledged.{0,120}/) || [""])[0]);

/* ── 2b · owners, the yearly review and suggestions (stage 4, spec 067 §3, §4.2) ── */
await A.page.goto(L(P2), { waitUntil: "networkidle" });
await A.page.selectOption("select[aria-label='Owner']", people.fn_fin);
await A.page.click("button:text-is('Save')");
await A.page.waitForSelector("text=Saved", { timeout: 20000 });
const own = (await q(ffp, 'select "ownerPersonId" o from processes where id=$1', [P2]))[0];
check(own.o === people.fn_fin, "the office picks the owner from the client register", JSON.stringify(own));
const yours = await (await B.get("/" + S + "/processes/read?f=yours")).text();
check(/Owner/.test(yours) && /Supplier onboarding/.test(yours), "the owner finds it under Yours");
/* a member of staff suggests a change to step 1 */
await T.page.goto(BASE + "/" + S + "/processes/read/" + P2 + "?tab=steps", { waitUntil: "networkidle" });
await T.page.locator("button", { hasText: "Suggest a change to this step" }).first().click();
await T.page.fill("[data-ffp-dialog] textarea >> nth=0", "Ask for two trade references, not one.");
await T.page.click("[data-ffp-dialog] button:text-is('Send to the Strategy Office')");
await T.page.waitForSelector("[data-ffp-dialog]", { state: "detached", timeout: 20000 });
let sg = (await q(ffp, 'select id, state, "stepId" st, "byName" b from process_suggestions where "processId"=$1', [P2]))[0];
check(sg && sg.state === "NEW" && !!sg.st, "a suggestion is recorded, pinned to the step, from the person signed in", JSON.stringify(sg));
await A.page.goto(BASE + "/" + S + "/processes/handle", { waitUntil: "networkidle" });
check(/Suggestion/.test(await body(A.page)) && /suggested a change to step 1/.test(await body(A.page)), "the office sees it on To handle, with its step");
await A.page.click("button:text-is('Answer')");
await A.page.fill("[data-ffp-dialog] textarea", "Two from the same sector, or any two?");
await A.page.click("[data-ffp-dialog] button:text-is('Send answer')");
await A.page.waitForSelector("[data-ffp-dialog]", { state: "detached", timeout: 20000 });
await T.page.goto(BASE + "/" + S + "/processes/read/todo", { waitUntil: "networkidle" });
check(/Answers to your suggestions/i.test(await body(T.page)), "the answer lands in the person's To do");
await T.page.click("button:text-is('Reply')");
await T.page.fill("[data-ffp-dialog] textarea", "Any two.");
await T.page.click("[data-ffp-dialog] button:text-is('Send reply')");
await T.page.waitForSelector("[data-ffp-dialog]", { state: "detached", timeout: 20000 });
sg = (await q(ffp, 'select state, "replyText" r from process_suggestions where id=$1', [sg.id]))[0];
check(sg.state === "REPLIED" && sg.r === "Any two.", "their reply goes back to the office", JSON.stringify(sg));
await A.page.goto(BASE + "/" + S + "/processes/handle", { waitUntil: "networkidle" });
await A.page.click("button:text-is('Start a draft from this')");
await A.page.waitForURL(/\/map$/, { timeout: 30000 });
await A.page.waitForSelector("nav[aria-label='Process sections']", { timeout: 30000 });
check(/suggestion on step 1/.test(await body(A.page)) && /Any two\./.test(await body(A.page)), "a draft started from it opens the builder with the person's words on the Map");
/* the owner's yearly review, once it is a month away */
await q(ffp, `update processes set "nextReviewDue" = now() + interval '10 days' where id=$1`, [P2]);
await B.page.goto(BASE + "/" + S + "/processes/read/todo", { waitUntil: "networkidle" });
check(/To review/i.test(await body(B.page)), "the owner is asked to review it in their To do");
await B.page.goto(BASE + "/" + S + "/processes/read/" + P2 + "?tab=summary", { waitUntil: "networkidle" });
await B.page.click("button:text-is('It is still right')");
await B.page.waitForFunction(() => !/It is still right|Saving/.test(document.body.innerText), null, { timeout: 20000 });
const rv = (await q(ffp, 'select "nextReviewDue" d, "reviewConfirmedByKey" k from processes where id=$1', [P2]))[0];
const away = (new Date(rv.d) - Date.now()) / 86400000;
check(rv.k === "fn_fin" && away > 360 && away < 370, "It is still right puts the next review a year away, recorded against the owner", JSON.stringify(rv));

/* ── 2c · the next version is drafted beside the one in force (stage 5, spec 067 §1) ── */
const steps2 = async (pg) => { await pg.goto(BASE + "/" + S + "/processes/read/" + P2 + "?tab=steps", { waitUntil: "networkidle" }); return body(pg); };
await A.page.goto(BASE + "/" + S + "/processes/processes/" + P2 + "/map", { waitUntil: "networkidle" });
await A.page.click("button:text-is('☰ Steps List')");
await A.page.click("button[aria-label='Edit Raise the invoice']");
const stepForm = A.page.locator("div.border-indigo-200", { has: A.page.getByLabel("Step name") });
await stepForm.getByLabel("Step name").fill("Raise the invoice the same day");
await stepForm.locator("button:text-is('Save')").click();
await A.page.waitForSelector("button[aria-label='Edit Raise the invoice the same day']", { timeout: 20000 });
check((await st(P2)).s === "DRAFT", "the office edits a step of the version in force: the process is a draft again");
let s2 = await steps2(T.page);
check(/Raise the invoice/.test(s2) && !/the same day/.test(s2) && /In force · v1/i.test(s2), "staff keep reading version 1 while version 2 is drafted", (s2.match(/Raise the invoice.{0,40}/) || [""])[0]);
await T.page.goto(BASE + "/" + S + "/processes/read", { waitUntil: "networkidle" });
check(!!(await T.page.$("a:text-is('Supplier onboarding')")), "…and it stays in their list, open to read");
await A.page.goto(L(P2), { waitUntil: "networkidle" });
const b2 = await body(A.page);
check(/In force · v1/i.test(b2) && /Draft v2: 1 step changed since v1/.test(b2) && /This is draft v2\. Readers keep v1/.test(b2), "the builder shows version 1 in force beside draft v2, with what changed", (b2.match(/Draft v2[^.]*\./) || [""])[0]);
await A.page.selectOption("select[name=approver]", people.fn_fin);
await A.page.fill("textarea[name=changeNote]", "Invoices go out the day the goods do");
await A.page.click("button:text-is('Send for review')");
await A.page.waitForFunction(() => /Waiting for/.test(document.body.innerText), null, { timeout: 20000 });
s2 = await steps2(T.page);
check((await st(P2)).s === "IN_REVIEW" && !/the same day/.test(s2), "sent for review: staff still read version 1");
await B.page.goto(BASE + "/" + S + "/processes/read/" + P2, { waitUntil: "networkidle" });
await waitFor(B.page, "button:text-is('Approve v2')", "the approver's Approve v2 button");
check(/the same day/.test(await body(B.page)), "the approver reads draft v2, not the version in force");
await B.page.click("button:text-is('Approve v2')");
await B.page.waitForFunction(() => /\/processes\/read$/.test(location.pathname), null, { timeout: 20000 });
s2 = await steps2(T.page);
check((await st(P2)).s === "APPROVED" && !/the same day/.test(s2), "approved: staff still read version 1 until the office publishes");
await A.page.goto(L(P2), { waitUntil: "networkidle" });
await waitFor(A.page, "button:text-is('Publish')", "Publish v2 after approval");
await A.page.click("button:text-is('Publish')");
await waitFor(A.page, "button:text-is('Retire')", "Retire after publishing v2");
r = await st(P2);
s2 = await steps2(T.page);
check(r.s === "PUBLISHED" && r.v === "v2" && /Raise the invoice the same day/.test(s2) && /Changed in v2/i.test(s2), "published: staff read version 2, its changed step marked", JSON.stringify(r));
const todo2 = await body((await T.page.goto(BASE + "/" + S + "/processes/read/todo", { waitUntil: "networkidle" }), T.page));
check(/Your step changed: Raise the invoice the same day/i.test(todo2) && /1 to read/.test((await T.page.locator("a.tbread").first().innerText().catch(() => "")) || ""), "having read version 1, they are asked to read version 2, told their step changed", (todo2.match(/To read.{0,120}/i) || [""])[0]);
const sg2 = await q(ffp, 'select state from process_suggestions where "processId"=$1', [P2]);
check(sg2.length === 1 && sg2[0].state === "CLOSED", "the suggestion worked into version 2 closes when it is published", JSON.stringify(sg2));
await A.page.goto(L(P2), { waitUntil: "networkidle" });
check(!(await A.page.$("select[name=approver]")), "with nothing changed since version 2, there is nothing to send");

/* ── 3 · the gate: a client's own person opens nothing else of Processes ── */
const office = ["processes/priorities", "processes/reports/priorities", "processes", "processes/processes", "processes/processes/" + P2, "processes/processes/" + P2 + "/map", "processes/processes/" + P2 + "/raci", "processes/processes/" + P2 + "/review", "processes/governance", "processes/reports", "processes/reports/sop", "processes/export", "processes/handle", "processes/roles", "processes/value-chain", "processes/helicopter"];
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
check(await A.page.isVisible("nav[aria-label='Steps']") && (await A.page.$$("tbody tr:has(.font-mono)")).length === 5, "Priorities lists every high-level process");
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

/* Layout: nothing pushed off the right edge, and every row's "Open" is reachable. */
await A.page.setViewportSize({ width: 1440, height: 900 });
await A.page.goto(BASE + "/" + S + "/processes/priorities", { waitUntil: "networkidle" });
check(await A.page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth + 1), "the Priorities page does not run off the right edge");
/* REWRITTEN (§218), not loosened: the page's own banner, which stepped aside for the client's logo in the
   margin, went by decision (spec 067 §4.2): the builder's band names every section and the logo left the margin.
   What the line was FOR is kept: the working area is not squeezed, it is exactly as wide as the band over it. */
const navBox = await A.page.locator("nav[aria-label='Steps']").boundingBox();
const band = await A.page.locator("header", { hasText: "Process builder" }).first().boundingBox();
check(!!navBox && !!band && Math.abs(navBox.x - band.x) <= 2 && navBox.width >= band.width - 2, "the Priorities page sits under the builder's band and uses its full width", JSON.stringify([navBox?.x, navBox?.width, band?.x, band?.width]));
for (const w of [1440, 2200]) {
  await A.page.setViewportSize({ width: w, height: 900 });
  await A.page.goto(BASE + "/" + S + "/processes/priorities", { waitUntil: "networkidle" });
  const nb = await A.page.locator("nav[aria-label='Steps']").boundingBox();
  /* REWRITTEN (§218): the side menu went by decision (spec 067 §4.2), and the old line went on passing by finding
     the tab bar instead. What it was FOR is kept: the working area starts where the builder's tabs start, with no
     empty band beside it, on a wide screen as on a laptop. */
  const sb = await A.page.locator("nav[aria-label='Builder sections']").first().boundingBox();
  check(!!nb && !!sb && Math.abs(nb.x - sb.x) <= 2, `at ${w} pixels wide the working area lines up under the builder's tabs, with no empty band`, JSON.stringify([nb?.x, sb?.x]));
}
await A.page.setViewportSize({ width: 1440, height: 900 });
await A.page.goto(BASE + "/" + S + "/processes/processes", { waitUntil: "networkidle" });
const openBox = await A.page.locator("tbody a:text-is('Open')").first().boundingBox();
check(!!openBox && openBox.x + openBox.width <= 1440, "the process list's Open link is inside the window", JSON.stringify(openBox));
await A.page.setViewportSize({ width: 1280, height: 720 });
/* The picker: choose which processes the table shows; remembered; Select all brings them back. */
await A.page.goto(BASE + "/" + S + "/processes/priorities", { waitUntil: "networkidle" });
await A.page.click("button:has-text('Choose processes')");
await A.page.click("[aria-label='Choose processes'] button:text-is('None')");
check(/No processes chosen/.test(await body(A.page)), "with none chosen the table says so");
await A.page.click("[aria-label='Choose processes'] label:has-text('Order to cash') input");
await A.page.click("[aria-label='Choose processes'] button:text-is('Done')");
check((await A.page.$$("tbody tr:has(.font-mono)")).length === 1 && /Order to cash/.test(await body(A.page)) && /1 \/ 5\s*shown/i.test(await body(A.page)), "the table shows only the chosen process, and the count says 1 / 5");
await A.page.reload({ waitUntil: "networkidle" });
await A.page.waitForFunction(() => document.querySelectorAll("tbody tr .font-mono").length === 1, null, { timeout: 10000 }).catch(() => {});
check((await A.page.$$("tbody tr:has(.font-mono)")).length === 1, "the choice is remembered when the page is opened again");
await A.page.click("button:has-text('Choose processes')");
await A.page.click("[aria-label='Choose processes'] button:text-is('Select all')");
await A.page.click("[aria-label='Choose processes'] button:text-is('Done')");
check((await A.page.$$("tbody tr:has(.font-mono)")).length === 5, "Select all brings every process back");

/* The list keeps its order while scoring; sub-processes sit under their main; "Clear entries" clears only what was picked. */
const order = () => A.page.$$eval("tbody tr td:nth-child(2) .font-mono", (e) => e.map((x) => x.textContent.trim()));
await A.page.goto(BASE + "/" + S + "/processes/priorities", { waitUntil: "networkidle" });
const before = await order();
await dot("Hire to Retire", "risk", 5); await dot("Hire to Retire", "importance", 5);
await waitScore("Hire to Retire", "—").catch(() => {}); await A.page.waitForTimeout(1200);
const afterOrder = await order();
check(JSON.stringify(before) === JSON.stringify(afterOrder) && before.join() === [...before].sort((a, b) => a.localeCompare(b, undefined, { numeric: true })).join(), "scoring a process does not move any row", before.join() + " | " + afterOrder.join());
await q(ffp, 'update processes set "parentProcessId"=(select id from processes where code=$2 and "workspaceId"=$1) where code=$3 and "workspaceId"=$1', [S, "P2.4", "P3.1"]);
await A.page.goto(BASE + "/" + S + "/processes/priorities", { waitUntil: "networkidle" });
const collapsed = await order();
check(!collapsed.includes("P3.1") && (await A.page.$$("button[aria-label^='Show the sub-processes of']")).length === 1, "sub-processes start folded under their main, with a + that opens them", collapsed.join());
await A.page.click("button[aria-label='Show the sub-processes of Supplier onboarding']");
const tree = await order();
check(tree.indexOf("P3.1") === tree.indexOf("P2.4") + 1 && /main/i.test(await body(A.page)) && (await A.page.$$("tbody td.ps-8:has(.font-mono)")).length === 1, "a sub-process sits directly under its main process, indented", tree.join());
await q(ffp, 'update processes set "parentProcessId"=null where code=$2 and "workspaceId"=$1', [S, "P3.1"]);
await A.page.goto(BASE + "/" + S + "/processes/priorities", { waitUntil: "networkidle" });
await A.page.click("button:text-is('Clear entries…')");
await A.page.click("[aria-label='Clear entries'] label:text-is('Risk') input");
await A.page.click("button:text-is('Untick all')");
await A.page.click("input[aria-label='Clear Hire to Retire']");
A.page.once("dialog", (d) => d.accept());
await A.page.click("button:text-is('Clear the selected')");
await A.page.waitForSelector("[role=status]:has-text('Cleared 1')", { timeout: 20000 });
const cl = Object.fromEntries((await q(ffp, 'select code, "priorityRisk" r, "priorityImportance" i from processes where "workspaceId"=$1', [S])).map((r) => [r.code, r]));
check(cl["P5.1"].r == null && cl["P5.1"].i === 5 && cl["P1.1"].r === 5, "Clear entries empties only the kind picked, on only the processes ticked", JSON.stringify(cl["P5.1"]) + JSON.stringify(cl["P1.1"]));
await q(ffp, 'update processes set "priorityImportance"=null where code=$2 and "workspaceId"=$1', [S, "P5.1"]);

await A.page.goto(BASE + "/" + S + "/processes/priorities?step=rank", { waitUntil: "networkidle" });
const nCirc = (await A.page.$$("svg[aria-label^='Importance against risk'] circle")).length; const bodyR = await body(A.page);
check(nCirc === 2 && /Not scored yet/.test(bodyR), "the chart plots the scored processes and names the rest", nCirc + " | " + bodyR.slice(0, 300));
await A.page.click("svg a >> nth=0"); await A.page.waitForURL(/sel=/, { timeout: 20000 });
check(/selected/i.test(await body(A.page)), "a circle opens that process beside the chart");
await A.page.goto(BASE + "/" + S + "/processes/priorities?step=plan", { waitUntil: "networkidle" });
const w1 = await A.page.$$eval("section[aria-label='Wave 1'] article", (a) => a.map((x) => x.textContent));
check(w1.length === 1 && /Order to cash/.test(w1[0]) && /Deep dive \d of 6/.test(w1[0]), "the plan puts the process in its wave with its deep-dive progress", JSON.stringify(w1));
await A.page.click("section[aria-label='Wave 1'] summary[aria-label='What the bars mean']");
const info = await A.page.innerText("section[aria-label='Wave 1'] details");
check(["Map", "RACI", "Authority", "Controls", "SOP", "Approved"].every((k) => info.includes(k)) && /at least 3 steps/.test(info) && /Green = done/.test(info), "the ! on a deep-dive card says what each bar is and what turns it green");
check(/Team capacity: 4 deep dives at a time\. Wave 1 holds 1 — fits/.test(await body(A.page)), "…and says whether Wave 1 fits the team");

await A.page.goto(BASE + "/" + S + "/processes/processes", { waitUntil: "networkidle" });
const lst = await body(A.page);
/* REWRITTEN (§218): Depth and Priority left the list by decision (Islam, 2026-10-28: "1 A", spec 067 §4.2); the
   process page and Priorities still say both (the next line). The list now says where each process is, how ready it
   is and how many gaps it has. */
check(/Where it is/i.test(lst) && /Ready/i.test(lst) && /Gaps/i.test(lst) && !/High-level/.test(lst) && (await A.page.locator("tbody span[aria-label$='of 6 ready']").count()) > 0, "the process list shows where each process is, its six ready marks and its gaps, and no longer Depth and Priority");
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

await B.page.goto(BASE + "/" + S + "/processes/read/todo", { waitUntil: "networkidle" });
check(/Deep-dive plan/.test(await body(B.page)) && /To approve/i.test(await body(B.page)), "the named approver is told, on their To do");
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
const xl = await A.get("/api/ffp/export/priorities/" + S);
const ExcelJS = (await import("exceljs")).default;
const wbk = new ExcelJS.Workbook(); await wbk.xlsx.load(await xl.body());
const sh = wbk.getWorksheet("Priorities");
const hdr = sh.getRow(1).values.slice(1);
const xr = []; sh.eachRow((r, n) => { if (n > 1) xr.push(r.values.slice(1)); });
const oc = xr.find((r) => r[1] === "P1.1");
check(xl.status() === 200 && hdr.includes("Why") && hdr.includes("Deep dive (of 6)") && xr.length === 5 && oc && oc[8] === 95 && oc[10] === "Wave 1", "the Excel download has one row per process with scores, decision and progress", JSON.stringify(oc));
const xs = await T.get("/api/ffp/export/priorities/" + S);
check(xs.status() === 403, "…and a client's own person cannot download it");
await A.page.goto(BASE + "/" + S + "/processes/priorities?step=sign", { waitUntil: "networkidle" });
await A.page.fill("input[aria-label='Why reopen']", "Client asked to add Credit & Collections");
await A.page.click("button:text-is('Reopen')");
await A.page.waitForFunction(() => document.querySelector("button")?.textContent !== undefined && !/Changing it from here needs a reason/.test(document.body.innerText), null, { timeout: 20000 });
const ro = (await q(ffp, 'select status, history from priority_plans where "workspaceId"=$1', [S]))[0];
check(ro.status === "DRAFT" && ro.history.some((h) => /Reopened/.test(h.what) && /Credit & Collections/.test(h.reason || "")), "reopening takes a reason and keeps it on record", JSON.stringify(ro.history.slice(-1)));

/* ── steps inside a process: noticed, flagged, scored, made into a process ── */
const decStep = (await q(ffp, 'insert into process_steps (id,"processId",type,label,"order","assignedRoleId") values (gen_random_uuid()::text,$1,\'DECISION\',$2,9,$3) returning id', [P1, "Approve the credit limit", rCc]))[0].id;
await q(ffp, 'insert into process_controls (id,"processId","stepId",risk,"riskLevel",control) values (gen_random_uuid()::text,$1,$2,$3,\'high\',$4)', [P1, decStep, "Limit set too high", "Two people sign"]);
await A.page.goto(BASE + "/" + S + "/processes/priorities", { waitUntil: "networkidle" });
const orderRow = A.page.locator("tbody tr", { hasText: "Order to cash" }).first();
await A.page.locator("button:has-text('Steps inside')").first().click();
const stepRowTxt = await A.page.locator("tr", { hasText: "Step: Approve the credit limit" }).innerText();
check(/Step: Raise the invoice/.test(await body(A.page)) && (await A.page.$$("button[aria-label='Flag step Raise the invoice']")).length === 1, "opening Steps inside lists every step, and any of them can be flagged");
check(/High-risk control/i.test(stepRowTxt) && /Decision point/i.test(stepRowTxt) && /Not flagged/i.test(stepRowTxt), "a step with a high-risk control and a decision is noticed, and is not scored until flagged", stepRowTxt.replace(/\s+/g, " "));
await A.page.click("button[aria-label='Flag step Approve the credit limit']");
await A.page.waitForFunction(() => !!document.querySelector("button[aria-label='importance 5 of 5 for step Approve the credit limit']"), null, { timeout: 20000 });
const fl = (await q(ffp, 'select "priorityFlagged" f, "priorityComplexity" c, "priorityRisk" r, "priorityImportance" i from process_steps where id=$1', [decStep]))[0];
check(fl.f === true && fl.r === 4 && fl.c === 2 && fl.i == null, "flagging starts the scores from the map (risk 4 from one high control) and leaves importance to the office", JSON.stringify(fl));
await A.page.click("button[aria-label='importance 5 of 5 for step Approve the credit limit']");
await A.page.waitForFunction(() => /\b77\b/.test([...document.querySelectorAll("tr")].find((r) => r.textContent.includes("Step: Approve the credit limit"))?.querySelector("td.tabular-nums")?.textContent ?? ""), null, { timeout: 20000 }).catch(() => {});
const stScore = await A.page.locator("tr", { hasText: "Step: Approve the credit limit" }).locator("td.tabular-nums").innerText();
check(stScore.trim() === "77", "the step gets its own score (77)", stScore);
check((await scoreOf("Order to cash")) === "95", "…and the process's own score is untouched");
await A.page.goto(BASE + "/" + S + "/processes/priorities?step=plan", { waitUntil: "networkidle" });
const w1s = await A.page.$$eval("section[aria-label='Wave 1'] article", (x) => x.map((y) => y.textContent));
check(w1s.length === 1 && /Approve the credit limit/.test(w1s[0]) && /Step of Order to cash/.test(w1s[0]) && !/Deep dive \d of 6/.test(w1s[0]), "the plan shows the flagged step, not its whole process", JSON.stringify(w1s));
await A.page.goto(BASE + "/" + S + "/processes/priorities", { waitUntil: "networkidle" });
await A.page.locator("button:has-text('Steps inside')").first().click();
await A.page.selectOption("select[aria-label='Wave for step Approve the credit limit']", "WAVE_2");
await A.page.waitForFunction(() => document.querySelector("select[aria-label='Wave for step Approve the credit limit']")?.value === "WAVE_2");
await A.page.waitForTimeout(800);
await A.page.goto(BASE + "/" + S + "/processes/priorities?step=plan", { waitUntil: "networkidle" });
const w2s = await A.page.$$eval("section[aria-label='Wave 2'] article", (x) => x.map((y) => y.textContent));
check(w2s.some((t) => /Approve the credit limit/.test(t)), "a flagged step can go in its own wave", JSON.stringify(w2s));
const fs_ = await A.get("/api/ffp/export/priorities/" + S + "/flagged-steps");
const wb3 = new (await import("exceljs")).default.Workbook(); await wb3.xlsx.load(await fs_.body());
const hs = wb3.getWorksheet("Steps").getRow(1).values.slice(1);
const fsr = []; wb3.getWorksheet("Steps").eachRow((r, n) => { if (n > 1) fsr.push(r.values.slice(1)); });
const ci = (h) => hs.indexOf(h);
const flaggedRows = fsr.filter((r) => r[ci("Flagged")] === "Yes");
check(fs_.status() === 200 && fsr.length >= 11 && flaggedRows.length === 1 && flaggedRows[0][ci("Step")] === "Approve the credit limit" && flaggedRows[0][ci("Role")] === "Credit Controller" && flaggedRows[0][ci("Wave")] === "Wave 2", "the steps download lists every step of every process, with a Flagged column, and the flagged one carries its scores and wave", JSON.stringify([fsr.length, flaggedRows[0]]));
check(fsr.some((r) => r[ci("Step")] === "Raise the invoice" && r[ci("Flagged")] === "No") && new Set(fsr.map((r) => r[ci("Level")])).has("Main"), "…an unflagged step is in it too, marked No");
check((await T.get("/api/ffp/export/priorities/" + S + "/flagged-steps")).status() === 403, "…and a client's own person cannot download it");
await A.page.goto(BASE + "/" + S + "/processes/priorities", { waitUntil: "networkidle" });
await A.page.locator("button:has-text('Steps inside')").first().click();
A.page.once("dialog", (d) => d.accept("Approve the credit limit"));
await A.page.click("button:text-is('Make it a process')");
await A.page.waitForSelector("[role=status]:has-text('Made')", { timeout: 20000 });
const np = (await q(ffp, 'select p.code, p."priorityImportance" i, p."priorityRisk" r, p."parentProcessId" pp, p."branchFromStepId" b, s."priorityFlagged" f from processes p join process_steps s on s.id=p."branchFromStepId" where p."workspaceId"=$1 and p."branchFromStepId"=$2', [S, decStep]))[0];
check(!!np && np.pp === P1 && np.b === decStep && np.i === 5 && np.r === 4 && np.f === false, "making it a process creates a sub-process branching from the step, carries the scores, and keeps the step as the link", JSON.stringify(np));
await A.page.goto(BASE + "/" + S + "/processes/priorities?step=plan", { waitUntil: "networkidle" });
const ex2 = await A.get("/api/ffp/export/priorities/" + S);
const wb2 = new (await import("exceljs")).default.Workbook(); await wb2.xlsx.load(await ex2.body());
check(!!wb2.getWorksheet("Flagged steps"), "the Excel file has a Flagged steps sheet");

/* ── AI review: a finding can be added as a proposed step, shown on the map, and confirmed or deleted ── */
const P6 = await proc("P6.1", "Month-end close");
await q(ffp, `insert into review_findings (id,"processId",category,area,severity,title,description,recommendation,status,"updatedAt") values (gen_random_uuid()::text,$1,'RISK','PROCESS_MAP','HIGH',$2,$3,$4,'OPEN',now())`, [P6, "No second check on journal entries", "Journals are posted by one person.", "Add a review of journals before posting"]);
await A.page.goto(BASE + "/" + S + "/processes/processes/" + P6 + "/review", { waitUntil: "networkidle" });
check(/No second check on journal entries/.test(await body(A.page)) && (await A.page.$$("button:text-is('Add as a step')")).length === 1, "the AI review page lists a finding with Add as a step");
await A.page.click("button:text-is('Add as a step')");
await A.page.click("button:text-is('Add to process (proposed)')");
await A.page.waitForSelector("text=Proposed · waiting on the map", { timeout: 20000 });
await A.page.goto(BASE + "/" + S + "/processes/processes/" + P6 + "/map", { waitUntil: "networkidle" });
check(/Proposed · from AI review/i.test(await body(A.page)) && (await A.page.$$("button:text-is('Confirm')")).length === 1 && (await A.page.$$("button:text-is('Delete')")).length >= 1, "the proposed step is highlighted on the map with Confirm and Delete");
const before6 = (await q(ffp, 'select count(*)::int n from process_steps where "processId"=$1', [P6]))[0].n;
check(before6 === 2, "until it is confirmed it is not a step");
await A.page.click("button:text-is('Confirm')");
await A.page.waitForFunction(() => !/Proposed · from AI review/i.test(document.body.innerText), null, { timeout: 20000 });
const after6 = (await q(ffp, 'select count(*)::int n from process_steps where "processId"=$1', [P6]))[0].n;
check(after6 === 3, "Confirm creates the real step", String(after6));

const sopHtml = await (await A.get("/" + S + "/processes/reports/sop?ids=" + P1)).text();
check(/Back to picker/.test(sopHtml) && /\/processes\/export/.test(sopHtml), "the SOP page has a Back to picker link");

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
