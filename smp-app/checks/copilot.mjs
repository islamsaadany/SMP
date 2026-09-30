/* ── THE STRATEGY COPILOT, STAGE 1 (spec 064) ─────────────────────────────
   The shelf with no AI yet, checked against a real Postgres:

     · §1 the pure rules — the five sections, the shape of a place word, who
       may delete a chat (both ends, §94.2), and the stamp's own rule;
     · §2 every statement run as `smp_app` with the tenant set — a chat keeps
       what is typed and answers with the product's line, versions only go
       UP (an edit and a restore each ADD one, decisions §3.6/§3.7), two
       presses at once cannot both write the same number, and one client
       cannot see another's chats;
     · §3 the module's own server at both ends of the gate — the office in,
       a client's own person refused at the api AND every read, in words —
       and every act refused where it must be;
     · §4 the catalogue — every table RLS-forced with the policy IDENTICAL to
       `tracker_actions`', and none on PLATFORM_TABLES.

   Run it with the database up:
     DATABASE_URL_UNPOOLED=postgres://owner@… node --experimental-strip-types checks/copilot.mjs
   Its breaks (`check:copilot:red`) must each turn it red (§94.5). */
import pg from "pg";
import { usePools } from "../lib/db.ts";
import { SCHEMA } from "../db/schema-name.mjs";
import { PLATFORM_TABLES } from "../lib/schema-check.ts";
import { serve } from "../modules/copilot/index.ts";
import {
  SECTIONS, isSection, isPlace, mayDeleteChat, MAX_MESSAGE, NOT_CONNECTED, copilotStampFor,
  chatsOn, newChat, messagesOf, say, deliverablesOn, newDeliverable, versionsOf, addVersion, restoreVersion,
} from "../lib/copilot.ts";

let ok = 0;
const bad = [];
const check = (what, good, detail) => {
  if (good) { ok++; console.log("  ok   " + what); }
  else { bad.push(what); console.log("  FAIL " + what + (detail ? "  — " + detail : "")); }
};
const section = (n) => console.log("\n" + n);
const probe = async (what, fn) => { try { return await fn(); } catch (e) { check(what, false, "threw: " + String(e && e.message || e)); return undefined; } };

/* ══ §1 · the rules ══════════════════════════════════════════════════ */
section("§1 · the sections, the place word, and who may delete");
check("five sections, in the record's order", SECTIONS.join(",") === "foundation,analysis,directions,execution,advisory");
check("a near miss is not a section", !isSection("Foundation") && !isSection("plan") && isSection("advisory"));
check("a place is the product's own word — group, a unit, fn:, co:, cap:",
  ["group", "mobile", "fn:finance", "co:distribution", "cap:cap6"].every(isPlace));
check("...and nothing else is: an address, a quote, an empty string",
  !isPlace("") && !isPlace("fn:") && !isPlace("mobile/x") && !isPlace("x'--") && !isPlace("zz:q"));
const chatBy = { by: "noran" };
check("whoever started a chat may delete it", mayDeleteChat(chatBy, { personKey: "noran", seat: "smoteam" }));
check("...and the Super user may, whoever started it", mayDeleteChat(chatBy, { personKey: "islam", seat: "super" }));
check("...and another member of the SMO team may NOT (both ends, §94.2)", !mayDeleteChat(chatBy, { personKey: "omar", seat: "smoteam" }));
check("an unplaced login never matches an unsigned chat", !mayDeleteChat({ by: "" }, { personKey: null, seat: "smoteam" }));
check("the tab is stamped for the office where the client has the module", copilotStampFor(["strategy", "copilot"], "smoteam") && copilotStampFor(["strategy", "copilot"], "super"));
check("...and for nobody else — a client's person, or a client without it", !copilotStampFor(["strategy", "copilot"], "none") &&
  !copilotStampFor(["strategy", "copilot"], null) && !copilotStampFor(["strategy"], "super"));

/* ══ the database ══════════════════════════════════════════════════ */
const URL_ = process.env.DATABASE_URL_UNPOOLED || process.env.DATABASE_URL || "";
if (!URL_) {
  console.log("\nNo DATABASE_URL — §2–§4 need one. A check that cannot run is not a check that passed (§54.5).");
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
  } catch (e) { await c.query("ROLLBACK").catch(() => {}); throw e; } finally { c.release(); }
}

let failed = false;
let A = null, B = null;
try {
  await owner("SET search_path TO " + SCHEMA);
  const stamp = "cop" + Date.now().toString(36);
  [{ id: A }] = await owner("INSERT INTO tenants (key, name) VALUES ($1, $2) RETURNING id", [stamp + "-a", "Raya Trade"]);
  [{ id: B }] = await owner("INSERT INTO tenants (key, name) VALUES ($1, $2) RETURNING id", [stamp + "-b", "RHI"]);

  /* ══ §2 · the statements ════════════════════════════════════════ */
  section("§2 · a chat keeps what is typed; a version is never overwritten");
  const c1 = await asTenant(A, (c) => newChat(c, { place: "mobile", section: "analysis", title: "SWOT refresh", by: "noran" }));
  check("a chat is born on its place and section with its title", c1.place === "mobile" && c1.section === "analysis" && c1.title === "SWOT refresh" && c1.by === "noran", JSON.stringify(c1));
  await asTenant(A, (c) => say(c, c1.id, "Refresh Mobile's SWOT from Q3", "noran"));
  const m1 = await asTenant(A, (c) => messagesOf(c, c1.id));
  check("what is typed is kept, then the product's own line — never dressed as the AI (§125)",
    m1.length === 2 && m1[0].who === "person" && m1[0].body === "Refresh Mobile's SWOT from Q3" && m1[0].by === "noran" &&
    m1[1].who === "ai" && m1[1].body === NOT_CONNECTED && m1[1].part && m1[1].part.kind === "notConnected", JSON.stringify(m1));
  const rail = await asTenant(A, (c) => chatsOn(c, "mobile", "analysis"));
  check("the rail lists it, counting what the PERSON said", rail.length === 1 && rail[0].id === c1.id && rail[0].count === 1, JSON.stringify(rail));
  check("...and another section of the same place does not", (await asTenant(A, (c) => chatsOn(c, "mobile", "foundation"))).length === 0);
  check("...and another place does not", (await asTenant(A, (c) => chatsOn(c, "fn:finance", "analysis"))).length === 0);
  check("B cannot see A's chat — the tenant is the boundary", (await asTenant(B, (c) => chatsOn(c, "mobile", "analysis"))).length === 0);

  const d1 = await asTenant(A, (c) => newDeliverable(c, { place: "mobile", section: "analysis", title: "Mobile SWOT", type: "free",
    kind: "promotable", approach: "", body: { text: "S: presence" }, note: "First", by: "noran", chatId: null, chatTitle: "" }));
  const n2 = await asTenant(A, (c) => addVersion(c, d1, { body: { text: "S: presence\nW: margin" }, note: "Added a weakness", by: "islam" }));
  const n3 = await asTenant(A, (c) => addVersion(c, d1, { body: { text: "S: presence\nW: margin\nO: B2B" }, note: "Added an opportunity", by: "noran" }));
  check("an edit ADDS a version: 1, then 2, then 3", n2 === 2 && n3 === 3, n2 + "," + n3);
  const r = await asTenant(A, (c) => restoreVersion(c, d1, 1, "islam"));
  const vs = await asTenant(A, (c) => versionsOf(c, d1));
  check("a restore ADDS v4 holding v1's body, marked where it came from — nothing in between is lost",
    r === 4 && vs.length === 4 && vs[0].n === 4 && vs[0].body.text === "S: presence" && vs[0].restoredFrom === 1 && vs[0].note === "Restored from v1" &&
    vs.map((v) => v.n).join(",") === "4,3,2,1", JSON.stringify(vs.map((v) => [v.n, v.note])));
  check("restoring the version that is already the latest is refused, not copied", (await asTenant(A, (c) => restoreVersion(c, d1, 4, "islam"))) === "same");
  check("...and a version that was never there is named as missing", (await asTenant(A, (c) => restoreVersion(c, d1, 9, "islam"))) === "missing");
  const shelf = await asTenant(A, (c) => deliverablesOn(c, "mobile", "analysis"));
  check("the shelf shows the deliverable at its latest version", shelf.length === 1 && shelf[0].latest === 4 && shelf[0].kind === "promotable", JSON.stringify(shelf));
  /* THE NUMBERING IS FROM THE MAXIMUM, UNDER A LOCK (§96.2): two presses at
     the same moment get two numbers, never one — asserted by pressing twice
     at once, on a deliverable whose versions are NOT 1..n (a count would
     collide with the maximum there). */
  await owner("DELETE FROM copilot_versions WHERE deliverable_id = $1 AND n = 2", [d1]);
  const both = await probe("two edits at once both land", () => Promise.all([
    asTenant(A, (c) => addVersion(c, d1, { body: { text: "x" }, note: "one", by: "islam" })),
    asTenant(A, (c) => addVersion(c, d1, { body: { text: "y" }, note: "two", by: "noran" })),
  ]));
  check("two edits at once get two NEW numbers after the maximum — 5 and 6, whatever was removed below",
    both && both.slice().sort().join(",") === "5,6", JSON.stringify(both));
  await probe("a version cannot be written twice under one number", async () => {
    let threw = false;
    try { await asTenant(A, (c) => c.query("INSERT INTO copilot_versions (deliverable_id, n, body, note, by_key) VALUES ($1, 5, '{}', '', 'x')", [d1])); }
    catch (e) { threw = /copilot_versions_tenant_id_deliverable_id_n_key|unique/.test(String(e.message)); }
    check("the unique constraint refuses a second v5 — the backstop behind the lock", threw);
  });

  /* ══ §3 · the server ═══════════════════════════════════════════ */
  section("§3 · the module's server: the office in, everybody else out, in words");
  const call = async (method, path, body, who, qs = "") => {
    const req = new Request("https://smp.example/raya-trade/copilot/" + path + qs,
      method === "POST" ? { method, body: JSON.stringify(body), headers: { "Content-Type": "application/json" } } : { method });
    const res = await serve({ req, slug: "raya-trade", module: "copilot", tenantId: A, tenantName: "Raya Trade",
      have: ["strategy", "copilot"], rest: [path], personKey: who.personKey, seat: who.seat });
    let j = null; try { j = await res.json(); } catch { j = null; }
    return { st: res.status, j, to: res.headers.get("location") || "" };
  };
  const NORAN = { personKey: "noran", seat: "smoteam" }, ISLAM = { personKey: "islam", seat: "super" },
        OMAR = { personKey: "omar", seat: "smoteam" }, HEND = { personKey: "hend", seat: "none" };
  const list = await call("GET", "list", null, NORAN, "?place=mobile&section=analysis");
  check("the office reads the two rails", list.st === 200 && list.j.ok && list.j.chats.length === 1 && list.j.deliverables.length === 1, list.st + " " + JSON.stringify(list.j).slice(0, 120));
  for (const [path, qs] of [["list", "?place=mobile&section=analysis"], ["chat", "?id=" + c1.id], ["deliverable", "?id=" + d1]]) {
    const out = await call("GET", path, null, HEND, qs);
    check("a client's own person is refused at " + path + ", in words", out.st === 403 && out.j && /office/.test(out.j.why), out.st + " " + JSON.stringify(out.j));
  }
  const postHend = await call("POST", "api", { act: "newChat", place: "mobile", section: "analysis" }, HEND);
  check("...and at the api, writing nothing", postHend.st === 403 && (await asTenant(A, (c) => chatsOn(c, "mobile", "analysis"))).length === 1, postHend.st);
  const bare = await call("GET", "", null, NORAN);
  check("the Copilot's own address goes back to Strategy — it has no page of its own",
    bare.st === 302 && /\/raya-trade(\/strategy)?\/?$/.test(new URL(bare.to).pathname), bare.st + " " + bare.to);
  check("a place that is not a place word is refused", (await call("GET", "list", null, NORAN, "?place=../x&section=analysis")).st === 400);
  const made = await call("POST", "api", { act: "newChat", place: "fn:finance", section: "advisory", title: "  Pricing   question " }, OMAR);
  check("+ New chat makes one, its title on one line", made.st === 200 && made.j.chat.title === "Pricing question" && made.j.chat.by === "omar", JSON.stringify(made.j));
  const unnamed = await call("POST", "api", { act: "newChat", place: "fn:finance", section: "advisory" }, OMAR);
  check("...and a chat with no title is named after its section rather than left blank", unnamed.j && unnamed.j.chat.title === "New advisory chat", JSON.stringify(unnamed.j));
  const said = await call("POST", "api", { act: "say", id: made.j.chat.id, text: "Should we cut prices?" }, OMAR);
  check("saying something answers with the conversation, the product's line last", said.st === 200 && said.j.messages.length === 2 && said.j.messages[1].body === NOT_CONNECTED);
  const long = await call("POST", "api", { act: "say", id: made.j.chat.id, text: "x".repeat(MAX_MESSAGE + 1) }, OMAR);
  check("a paste past about thirty pages is refused with the reason, and nothing kept (§96.2)",
    long.st === 400 && /thirty pages/.test(long.j.why) && (await asTenant(A, (c) => messagesOf(c, made.j.chat.id))).length === 2, JSON.stringify(long.j));
  const ren = await call("POST", "api", { act: "rename", id: made.j.chat.id, title: "Prices" }, NORAN);
  check("anybody in the office may rename a chat", ren.st === 200);
  const delNo = await call("POST", "api", { act: "deleteChat", id: made.j.chat.id }, NORAN);
  check("somebody else in the SMO team may NOT delete Omar's chat, and is told who can", delNo.st === 403 && /started this chat/.test(delNo.j.why), JSON.stringify(delNo.j));
  const delYes = await call("POST", "api", { act: "deleteChat", id: made.j.chat.id }, ISLAM);
  check("...the Super user may, and it and everything said in it are gone",
    delYes.st === 200 && (await owner("SELECT count(*)::int AS n FROM copilot_messages WHERE chat_id = $1", [made.j.chat.id]))[0].n === 0);
  const own = await call("POST", "api", { act: "deleteChat", id: unnamed.j.chat.id }, OMAR);
  check("...and whoever started a chat may delete their own", own.st === 200);
  const ed = await call("POST", "api", { act: "editVersion", id: d1, text: "edited", note: "Tightened" }, NORAN);
  check("Edit through the server adds the next version", ed.st === 200 && ed.j.n === 7, JSON.stringify(ed.j));
  const same = await call("POST", "api", { act: "editVersion", id: d1, text: "edited" }, NORAN);
  check("...an edit that changes nothing is refused rather than stored as a copy", same.st === 400 && /Nothing changed/.test(same.j.why));
  const rs = await call("POST", "api", { act: "restore", id: d1, from: 3 }, NORAN);
  check("Restore through the server adds the next version", rs.st === 200 && rs.j.n === 8, JSON.stringify(rs.j));
  const noDel = await call("POST", "api", { act: "deleteDeliverable", id: d1 }, ISLAM);
  check("a deliverable cannot be deleted, not even by the Super user — its versions are the record", noDel.st === 400 && (await asTenant(A, (c) => versionsOf(c, d1))).length === 7);
  const gone = await call("GET", "chat", null, NORAN, "?id=" + made.j.chat.id);
  check("a deleted chat reads as gone, in words", gone.st === 404 && /not here/.test(gone.j.why));

  /* ══ §4 · the catalogue ═══════════════════════════════════════ */
  section("§4 · every table is the tenant's, fenced like the tracker's");
  const T = ["copilot_chats", "copilot_messages", "copilot_deliverables", "copilot_versions"];
  const rls = await owner("SELECT relname, relrowsecurity, relforcerowsecurity FROM pg_class c JOIN pg_namespace n ON n.oid = c.relnamespace WHERE n.nspname = $1 AND relname = ANY($2)", [SCHEMA, T]);
  check("all four tables exist, RLS on and FORCED", rls.length === 4 && rls.every((x) => x.relrowsecurity && x.relforcerowsecurity), JSON.stringify(rls));
  const pol = await owner("SELECT tablename, qual, with_check FROM pg_policies WHERE schemaname = $1 AND tablename = ANY($2)", [SCHEMA, T.concat(["tracker_actions"])]);
  const ref = pol.find((p) => p.tablename === "tracker_actions");
  check("each carries the policy IDENTICAL to tracker_actions' (§94.8)",
    !!ref && T.every((t) => pol.some((p) => p.tablename === t && p.qual === ref.qual && p.with_check === ref.with_check)), JSON.stringify(pol.map((p) => p.tablename)));
  check("none is on PLATFORM_TABLES — they are the client's rows", T.every((t) => !PLATFORM_TABLES.includes(t)));
} catch (e) {
  failed = true;
  console.log("\nDIED: " + (e && e.stack || e));
} finally {
  /* Leave nothing behind: a stray tenant named "Raya Trade" is a second card
     the console draws, and a neighbouring check reads the wrong one (§94.2). */
  if (A || B) await owner("DELETE FROM tenants WHERE id = ANY($1)", [[A, B].filter(Boolean)]).catch((e) => console.log("cleanup: " + e.message));
  await pool.end().catch(() => {}); await appPool.end().catch(() => {});
}
console.log("\n" + ok + " passed, " + bad.length + " failed" + (failed ? " — AND THE RUN DIED (§215)" : ""));
process.exit(bad.length || failed ? 1 : 0);
