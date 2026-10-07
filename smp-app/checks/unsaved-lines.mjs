/* Unsaved changes sent to the Strategy Office (§504) — the server half.

   Drives lib/unsaved.ts directly against a real Postgres, as the people who
   would press its buttons, and reads every result back from the database
   rather than trusting the answer (§96). Both ends every time (§94.2):
     · a line splits and re-applies to exactly the change it came from;
     · anybody signed in may send, and the address cannot lie about the change;
     · only the office reads the list or acts on it;
     · APPLY RUNS AS THE SENDER — a line the sender may make lands, a line the
       sender may NOT make is refused even when the office presses Apply
       (the half a check that only looked for success could never see);
     · a line that landed by itself leaves the list on the next read;
     · applying one of two answers to the same line closes the other.
   Prints one line per property and ends RED/GREEN (§298.3: the tail is the verdict).

     DATABASE_URL_UNPOOLED=postgres://…/smp_dev node checks/unsaved-lines.mjs
     … --break=apply-as-office   (RED: Apply borrows the office's rights) */
import { createRequire } from "node:module";
import { devTenant } from "../scripts/dev-tenant.mjs";
import { withTenant } from "../lib/tenant.ts";
import { readState } from "../lib/state-io.ts";

const brk = (process.argv.find((a) => a.startsWith("--break=")) || "").slice(8);
if (brk) process.env.SMP_BREAK = brk;
const { unsavedRead, unsavedWrite } = await import("../lib/unsaved.ts");
const D = createRequire(import.meta.url)("../lib/graph-diff.cjs");
const URL_ = process.env.DATABASE_URL_UNPOOLED || "postgres://postgres:postgres@localhost:5432/smp_dev";
const clone = (o) => JSON.parse(JSON.stringify(o));
let oks = 0, fails = 0;
const check = (c, l, m) => { if (c) { oks++; console.log("ok    " + l); } else { fails++; console.log("FAIL  " + l + (m === undefined ? "" : " — " + String(m).slice(0, 240))); } };
async function section(name, fn) {
  console.log("── " + name);
  try { await fn(); } catch (e) { fails++; console.log("FAIL  " + name + " — the section died rather than reporting (§215) — " + (e && e.stack ? e.stack.split("\n").slice(0, 2).join(" ") : e)); }
}

const { tenantId } = await devTenant({ url: URL_, log: () => {} });
const g0 = await withTenant(tenantId, (c) => readState(c));
const people = g0.people || [];
const office = { key: people.find((p) => p.role === "super")?.key || "smo", name: "Office", role: "super" };
const head = people.find((p) => p.key === "own_mob") ? { key: "own_mob", name: "Mobile owner", role: "" } : null;
const stranger = { key: "own_ret", name: "Retail owner", role: "" };
const mk = (edit) => { const m = clone(g0); edit(m); return D.splitLines(D.graphChanges(g0, m)); };
const rowsOf = (sql, p) => withTenant(tenantId, async (c) => (await c.query(sql, p)).rows);

await section("0 · a change list as lines", async () => {
  const m = clone(g0);
  m.units.mobile.items[0].name += " X";
  m.units.mobile.items[0].measures[0].target = "77%";
  delete m.units.mobile.items[0].measures[0].dir;
  const ch = D.graphChanges(g0, m), lines = D.splitLines(ch);
  check(lines.length === 3, "three edits make three lines", lines.length);
  let t = clone(g0);
  for (const l of lines) { const r = D.applyChanges(t, l.change); if (!r.ok) throw new Error(r.error); t = r.state; }
  check(D.sameValue(t, m), "applied one at a time, the lines make exactly the whole change");
  check(lines.every((l) => { const v = D.valueAt(m, l); return v.has === l.mine.has && (!v.has || D.sameValue(v.value, l.mine.value)); }),
    "every line reads back as its own value from the graph it came from");
  check(lines.some((l) => !l.mine.has), "a deleted field is a line too, holding nothing");
});

await section("1 · sending", async () => {
  await rowsOf("DELETE FROM unsaved_lines");
  const lines = mk((m) => { m.units.mobile.items[0].measures[0].target = "55%"; })
    .map((l) => ({ ...l, base: D.valueAt(g0, l) }));
  let r = await unsavedWrite(tenantId, stranger, { unsaved: "send", lines, error: "HTTP 500 · ref ABC" });
  check(r.code === 200 && r.body.lines === 1, "anybody signed in may send their lines", JSON.stringify(r));
  const back = await rowsOf("SELECT person_key, addr, error, status FROM unsaved_lines");
  check(back.length === 1 && back[0].person_key === stranger.key && back[0].status === "open" && back[0].error.includes("ABC"),
    "the line is stored against the sender, open, with the error", JSON.stringify(back));
  r = await unsavedWrite(tenantId, stranger, { unsaved: "send", lines: [{ ...lines[0], addr: "p:people" }] });
  check(r.code === 400, "an address that lies about the change is refused", r.code);
  const whole = { addr: lines[0].addr, change: D.graphChanges(g0, (() => { const m = clone(g0); m.group.aspiration = "x"; m.units.mobile.items[0].name = "y"; return m; })()) };
  r = await unsavedWrite(tenantId, stranger, { unsaved: "send", lines: [whole] });
  check(r.code === 400, "a whole change list posing as one line is refused", r.code);
});

await section("2 · only the office reads and acts", async () => {
  let r = await unsavedRead(tenantId, stranger);
  check(r.code === 403, "somebody who is not the office is refused the list", r.code);
  r = await unsavedRead(tenantId, office);
  check(r.code === 200 && r.body.lines.length === 1, "the office reads the open list", JSON.stringify(r.body).slice(0, 120));
  const id = r.body.lines[0].id;
  r = await unsavedWrite(tenantId, stranger, { unsaved: "discard", id });
  check(r.code === 403, "somebody who is not the office cannot discard", r.code);
  r = await unsavedWrite(tenantId, stranger, { unsaved: "apply", id });
  check(r.code === 403, "…nor apply", r.code);
});

await section("3 · apply runs as the sender", async () => {
  /* the stranger (Retail's owner) sent a line for MOBILE: theirs to send, not theirs to make */
  const [l] = await unsavedRead(tenantId, office).then((r) => r.body.lines);
  let r = await unsavedWrite(tenantId, office, { unsaved: "apply", id: l.id });
  check(r.code === 403, "a line the sender could not have saved is refused, even when the office presses Apply", r.code + " " + JSON.stringify(r.body).slice(0, 160));
  const still = await rowsOf("SELECT status FROM unsaved_lines WHERE id = $1", [l.id]);
  check(still[0].status === "open", "…and stays on the list for the office to decide", still[0].status);
  const now = await withTenant(tenantId, (c) => readState(c));
  check(now.units.mobile.items[0].measures[0].target === g0.units.mobile.items[0].measures[0].target, "…and the plan did not move");
  await unsavedWrite(tenantId, office, { unsaved: "discard", id: l.id });
  const gone = await rowsOf("SELECT status, done_by FROM unsaved_lines WHERE id = $1", [l.id]);
  check(gone[0].status === "discarded" && gone[0].done_by === office.key, "Discard takes it off and says who", JSON.stringify(gone));

  /* the office's own line: the office may make it, so it lands */
  const lines = mk((m) => { m.group.aspiration = "Applied by the office for its sender"; }).map((x) => ({ ...x, base: D.valueAt(g0, x) }));
  await unsavedWrite(tenantId, office, { unsaved: "send", lines });
  const [mine] = (await unsavedRead(tenantId, office)).body.lines;
  r = await unsavedWrite(tenantId, office, { unsaved: "apply", id: mine.id });
  check(r.code === 200, "a line its sender may make is applied", r.code + " " + JSON.stringify(r.body).slice(0, 160));
  const after = await withTenant(tenantId, (c) => readState(c));
  check(after.group.aspiration === "Applied by the office for its sender", "…and is in the plan, read back from the database");
  const log = await rowsOf("SELECT person_key FROM change_log ORDER BY id DESC LIMIT 1");
  check(log[0] && log[0].person_key === office.key, "…and the record names its sender", JSON.stringify(log));
});

await section("4 · two people, one line; and a line that landed by itself", async () => {
  await rowsOf("DELETE FROM unsaved_lines");
  const g = await withTenant(tenantId, (c) => readState(c));
  const a = D.splitLines(D.graphChanges(g, (() => { const m = clone(g); m.group.aspiration = "Answer A"; return m; })()));
  const b = D.splitLines(D.graphChanges(g, (() => { const m = clone(g); m.group.aspiration = "Answer B"; return m; })()));
  /* two real people on the register: Retail's owner sent A, the office sent B */
  await unsavedWrite(tenantId, stranger, { unsaved: "send", lines: a });
  await unsavedWrite(tenantId, office, { unsaved: "send", lines: b });
  let list = (await unsavedRead(tenantId, office)).body.lines;
  check(list.length === 2 && list[0].addr === list[1].addr, "two people's answers to one line arrive as one address", JSON.stringify(list.map((x) => x.addr)));
  const pick = list.find((x) => x.mine.value === "Answer B");
  const ap = await unsavedWrite(tenantId, office, { unsaved: "apply", id: pick.id });
  check(ap.code === 200, "the office's answer applies", ap.code + " " + JSON.stringify(ap.body).slice(0, 160));
  const st = await rowsOf("SELECT status FROM unsaved_lines ORDER BY status");
  check(st.map((x) => x.status).join() === "applied,discarded", "applying one closes the other", JSON.stringify(st));

  const g2 = await withTenant(tenantId, (c) => readState(c));
  /* already true: the plan holds Answer B, and somebody sends it again */
  await unsavedWrite(tenantId, stranger, { unsaved: "send", lines: b });
  list = (await unsavedRead(tenantId, office)).body.lines;
  check(list.length === 0, "a line the plan already holds leaves the list on the next read", JSON.stringify(list).slice(0, 160));
  const landed = await rowsOf("SELECT count(*)::int AS n FROM unsaved_lines WHERE status = 'landed'");
  check(landed[0].n === 1, "…marked landed rather than deleted", JSON.stringify(landed));

  const d = D.splitLines(D.graphChanges(g2, (() => { const m = clone(g2); m.group.aspiration = "Sender's own"; return m; })()));
  const s = await unsavedWrite(tenantId, stranger, { unsaved: "send", lines: d });
  let r = await unsavedWrite(tenantId, office, { unsaved: "landed", report: s.body.report });
  check(r.body.landed === 0, "only the sender may say their own report landed", JSON.stringify(r.body));
  r = await unsavedWrite(tenantId, stranger, { unsaved: "landed", report: s.body.report });
  check(r.body.landed === 1, "…and when they do, it leaves the list", JSON.stringify(r.body));
});

await rowsOf("DELETE FROM unsaved_lines");
console.log(fails ? "RED " + oks + " ok, " + fails + " failed" : "GREEN " + oks + " ok, 0 failed");
process.exit(fails ? 1 : 0);
