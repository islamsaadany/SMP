/* §210 — TWO PEOPLE, ONE DATABASE. The scenario that was silently destroying
   work this morning, replayed through the REAL reader, writer, authoriser and
   change-applier — no browser, no stub.

   Proved able to fail: run it with SMP_WHOLE_GRAPH=1 and the client's save is
   posted the old way (the whole graph), which is what the platform did until
   today. Every "survives" assertion goes red. */
process.env.DATABASE_URL = process.env.DATABASE_URL ||
  "postgres://postgres@localhost:55191/smptabs?host=/tmp";
const io = require("/home/user/SMP/lib/state-io.js");
const D = require("/home/user/SMP/lib/graph-diff.js");
const { authorize } = require("/home/user/SMP/lib/authorize.js");
const { Pool } = require("/home/user/SMP/node_modules/pg");
const fs = require("fs");
const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const clone = o => JSON.parse(JSON.stringify(o));
const WHOLE = !!process.env.SMP_WHOLE_GRAPH;
let pass = 0, fail = 0;
function check(w, ok, x) {
  if (ok) { pass++; console.log("  ok  " + w); }
  else { fail++; console.log("  FAIL  " + w + (x ? "  — " + x : "")); }
}

/* What the SERVER does with a save, exactly as api/state.js does it. */
function serverSave(stored, body, actor) {
  let state = body.state;
  if (body.changes) {
    const applied = D.applyChanges(clone(stored), body.changes);
    if (!applied.ok) return { ok: false, error: applied.error };
    state = applied.state;
  }
  const verdict = authorize(stored, state, actor);
  if (!verdict.ok) return { ok: false, refusals: verdict.refusals };
  return { ok: true, state: state };
}
/* What the CLIENT posts — the new way, or the old one under the flag. */
function clientBody(baseline, screen) {
  if (WHOLE) return { state: screen };
  return { changes: D.graphChanges(baseline, screen) };
}

(async () => {
  const c = await pool.connect();
  try {
    await io.ensureReady(c);
    const seed = JSON.parse(fs.readFileSync("/home/user/SMP/db/seed-state.json", "utf8"));
    await io.writeState(c, seed);

    const start = await io.readState(c);
    const U = start.unitKeys[0], U2 = start.unitKeys[1];
    const smo = (start.people || []).find(p => p.role === "super");
    console.log((WHOLE ? "THE OLD WAY (whole graph)" : "§210 (only what changed)") +
                " · units " + U + " / " + U2 + "\n");

    /* AHMED opens his tab at 9am. */
    const ahmedTab = clone(start);

    /* THE OFFICE saves real work while his tab sits there. */
    const office = clone(start);
    office.units[U2].aspiration = "THE OFFICE WROTE THIS";
    office.people[0].name = "THE OFFICE RENAMED THIS PERSON";
    office.cycle = Object.assign({}, office.cycle, { note: "THE OFFICE'S CYCLE NOTE" });
    const r1 = serverSave(await io.readState(c), { state: office }, smo);
    check("the office's own save is accepted", r1.ok, (r1.refusals || []).join(" / "));
    await io.writeState(c, r1.state);

    /* AHMED, in his 9am tab, changes ONE thing on HIS unit and saves. */
    const ahmedScreen = clone(ahmedTab);
    ahmedScreen.units[U].aspiration = "AHMED'S OWN CHANGE";
    const body = clientBody(ahmedTab, ahmedScreen);
    if (!WHOLE)
      check("his save carries " + D.countChanges(body.changes) + " part, not the whole graph",
            D.countChanges(body.changes) === 1, JSON.stringify(Object.keys(body.changes.set)));
    const storedNow = await io.readState(c);
    const r2 = serverSave(storedNow, body, smo);
    check("his save is accepted", r2.ok, (r2.refusals || []).join(" / "));
    if (r2.ok) await io.writeState(c, r2.state);

    const after = await io.readState(c);
    console.log("");
    check("his own change landed", after.units[U].aspiration === "AHMED'S OWN CHANGE",
          after.units[U].aspiration);
    check("the office's aspiration SURVIVES",
          after.units[U2].aspiration === "THE OFFICE WROTE THIS", after.units[U2].aspiration);
    check("the office's register rename SURVIVES",
          after.people[0].name === "THE OFFICE RENAMED THIS PERSON", after.people[0].name);
    check("the office's cycle note SURVIVES",
          (after.cycle || {}).note === "THE OFFICE'S CYCLE NOTE", (after.cycle || {}).note);

    /* AND THE REFUSAL CAN ONLY NAME WHAT TRAVELLED. A person who may not
       author a plan, filling from a stale tab, must be refused for their OWN
       change and never for the office's leftovers. */
    console.log("");
    const plain = (start.people || []).find(p => p.unit && p.key !== smo.key && !p.role);
    if (plain) {
      const stale = clone(ahmedTab);            // still the 9am copy
      const scr = clone(stale);
      scr.units[U].items[0].measures[0].target = "999%";
      const b3 = clientBody(stale, scr);
      const r3 = serverSave(await io.readState(c), b3, plain);
      check("a plan change by somebody who may not author it is refused", !r3.ok);
      const named = (r3.refusals || []).join(" ");
      check("...and the refusal names ONLY their own unit",
            named.includes(U) && !named.includes("register") && !named.includes("archives"),
            named);
    } else check("(no role-less person on the seed to test the refusal with)", true);

    /* ── THE EVERYDAY CASE ──────────────────────────────────────────
       Two custodians filling gaps on their own units at the same time, both
       from tabs opened before either saved. This is what the SMO team was
       doing this morning, and until §210 the second save silently undid the
       first. */
    console.log("");
    await io.writeState(c, seed);
    const s0 = await io.readState(c);
    const cu1 = (s0.unitRoles[U] || {}).custodian, cu2 = (s0.unitRoles[U2] || {}).custodian;
    const pp1 = s0.people.find(p => p.key === cu1), pp2 = s0.people.find(p => p.key === cu2);
    if (pp1 && pp2) {
      const tabA = clone(s0), tabB = clone(s0);
      const scrA = clone(tabA); scrA.units[U].aspiration = "FILLED BY THE FIRST";
      const scrB = clone(tabB); scrB.units[U2].aspiration = "FILLED BY THE SECOND";
      const rA = serverSave(await io.readState(c), clientBody(tabA, scrA), smo);
      if (rA.ok) await io.writeState(c, rA.state);
      const rB = serverSave(await io.readState(c), clientBody(tabB, scrB), smo);
      if (rB.ok) await io.writeState(c, rB.state);
      const fin = await io.readState(c);
      /* ── AND THE CASE §210 LEFT OPEN: THE SAME UNIT (§215) ──────────
         Two of the office filling gaps on ONE unit at once, from tabs opened
         before either saved. Until row-level this was last-write-wins: the
         second save carried the whole unit and quietly undid the first. It is
         the Consumer Finance morning exactly, one level down. */
      {
        await io.writeState(c, seed);
        const t0 = await io.readState(c);
        const one = clone(t0), two = clone(t0);
        const scr1 = clone(one), scr2 = clone(two);
        const u1 = scr1.units[U], u2 = scr2.units[U];
        /* Two different rows of the SAME unit — a measure on the first pillar
           and a tactic's owner on the second, which is what two people filling
           the same plan actually touch. */
        u1.items[0].measures[0].target = "FIRST PERSON";
        const p2i = u2.items.length > 1 ? 1 : 0;
        u2.items[p2i].tactics[0].owner = "SECOND PERSON";
        const r1 = serverSave(await io.readState(c), clientBody(one, scr1), smo);
        if (r1.ok) await io.writeState(c, r1.state);
        const r2 = serverSave(await io.readState(c), clientBody(two, scr2), smo);
        if (r2.ok) await io.writeState(c, r2.state);
        const end = await io.readState(c);
        check("§215: both saves on the SAME unit were accepted", r1.ok && r2.ok,
              (r1.error || "") + " / " + (r2.error || ""));
        check("§215: the first person's fill SURVIVES the second's save",
              end.units[U].items[0].measures[0].target === "FIRST PERSON",
              end.units[U].items[0].measures[0].target);
        check("§215: ...and the second person's landed too",
              end.units[U].items[p2i].tactics[0].owner === "SECOND PERSON",
              end.units[U].items[p2i].tactics[0].owner);
        /* AND NOTHING ELSE ON THAT UNIT MOVED — the point of sending a row
           rather than a unit is that everything untouched stays untouched. */
        check("§215: ...and the rest of the unit is untouched",
              end.units[U].aspiration === seed.units[U].aspiration &&
              end.units[U].items.length === seed.units[U].items.length,
              end.units[U].aspiration);
      }

      /* ── §216 · THE CX REFUSAL, REPRODUCED AND CLOSED ───────────────
         Hala, working on CX, was refused with "a project's milestones
         (admin) cannot be changed here" — naming a function she had never
         opened. Every capability lives in `org`, which travelled as ONE
         part, so her save carried every function's plan and a difference
         somebody else had made was judged as hers. */
      {
        await io.writeState(c, seed);
        const g0 = await io.readState(c);
        const caps = (g0.group && g0.group.capabilities) || [];
        const mine = 0;
        const other = caps.findIndex((x, i) => i > 0 && x.fn !== caps[0].fn);
        if (caps.length > 1 && other > 0 &&
            (caps[mine].projects || []).length && (caps[other].projects || []).length) {
          /* Her tab is opened NOW. */
          const herTab = clone(g0);
          /* Somebody else then changes a milestone on the OTHER function. */
          const theirs = clone(await io.readState(c));
          theirs.group.capabilities[other].projects[0].milestones[0].owner = "SOMEBODY ELSE";
          const rT = serverSave(await io.readState(c), clientBody(clone(g0), theirs), smo);
          if (rT.ok) await io.writeState(c, rT.state);
          /* She fills ONE row on her own capability, from the stale tab. */
          const herScreen = clone(herTab);
          herScreen.group.capabilities[mine].projects[0].milestones[0].owner = "HALA FILLED THIS";
          const rH = serverSave(await io.readState(c), clientBody(herTab, herScreen), smo);
          if (rH.ok) await io.writeState(c, rH.state);
          const end = await io.readState(c);
          check("§216: her save is accepted", rH.ok, rH.error);
          check("§216: ...and it does not name a function she never opened",
                rH.ok || !/admin|" + caps[other].fn + "/.test(rH.error || ""), rH.error);
          check("§216: her own fill landed",
                end.group.capabilities[mine].projects[0].milestones[0].owner === "HALA FILLED THIS",
                end.group.capabilities[mine].projects[0].milestones[0].owner);
          check("§216: ...and the OTHER function's work survives her stale tab",
                end.group.capabilities[other].projects[0].milestones[0].owner === "SOMEBODY ELSE",
                end.group.capabilities[other].projects[0].milestones[0].owner);
        } else check("(the seed has no second function with projects to test §216 with)", true);
      }

      check("two people on two units: the first one's work survives",
            fin.units[U].aspiration === "FILLED BY THE FIRST", fin.units[U].aspiration);
      check("...and the second one's landed",
            fin.units[U2].aspiration === "FILLED BY THE SECOND", fin.units[U2].aspiration);
    }

    console.log("\n" + pass + " passed, " + fail + " failed");
    process.exit(fail ? 1 : 0);
  } finally { c.release(); await pool.end(); }
})().catch(e => { console.error("FAILED:", e.message); process.exit(1); });
