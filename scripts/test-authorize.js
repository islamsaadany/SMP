/* Does the server actually refuse what it should, and accept what it should?
   Run: node scripts/test-authorize.js     (no database needed — pure functions)

   The second half matters more than the first. Refusing an attack is easy;
   the real risk in spec 006 is a rule written too TIGHTLY, so every role is
   also made to do its own legitimate work and must not be refused. */

const fs = require("fs");
const path = require("path");
const A = require("../lib/authorize.js");
const R = require("../lib/rules.js");

const SEED = JSON.parse(fs.readFileSync(path.join(__dirname, "..", "db", "seed-state.json"), "utf8"));
const clone = function (x) { return JSON.parse(JSON.stringify(x)); };
const personOf = function (state, key) {
  return state.people.filter(function (p) { return p.key === key; })[0];
};

let pass = 0, fail = 0;
function check(name, cond, extra) {
  if (cond) { pass++; return; }
  fail++;
  console.log("  FAIL  " + name + (extra ? "\n        " + extra : ""));
}
function allows(who, mutate, name) {
  const inc = clone(SEED); mutate(inc);
  const v = A.authorize(SEED, inc, personOf(SEED, who));
  check(name, v.ok, v.refusals.join(" / "));
}
function refuses(who, mutate, name) {
  const inc = clone(SEED); mutate(inc);
  const v = A.authorize(SEED, inc, personOf(SEED, who));
  check(name, !v.ok, "was ALLOWED — changes: " +
    JSON.stringify(v.changes.map(function (c) { return c.kind + ":" + c.what; })));
}

/* Who is who in the seed, so the tests read as sentences. */
const w = R.worldOf(SEED);
SEED.people.slice(0, 0);
const UNIT = SEED.unitKeys[0];
const headKey = (SEED.unitRoles[UNIT] || {}).head;
const custKey = (SEED.unitRoles[UNIT] || {}).custodian;
const OTHER = SEED.unitKeys.filter(function (k) { return k !== UNIT; })[0];

console.log("unit under test: " + UNIT + "  head: " + headKey + "  custodian: " + custKey);
["smo", "ceo", headKey, custKey].forEach(function (k) {
  console.log("  " + k + " holds: " + R.personRoleKeys(w, personOf(SEED, k)).join(", "));
});

/* ── 0 · A save that changes nothing is never refused ───────────── */
console.log("\n0 · no change");
SEED.people.forEach(function (p) {
  const v = A.authorize(SEED, clone(SEED), p);
  check("unchanged save is accepted for " + p.key, v.ok, v.refusals.join(" / "));
});

/* ── 1 · The escalation in spec 006 §1 ─────────────────────────── */
console.log("\n1 · privilege escalation");
refuses(headKey, function (s) {
  s.people.forEach(function (p) { if (p.key === headKey) p.role = "super"; });
}, "a unit head cannot make themselves the SMO");

refuses(headKey, function (s) {
  s.access.owner = Object.assign({}, s.access.owner, { a_setup: "edit" });
}, "a unit head cannot widen the access matrix");

refuses(headKey, function (s) { s.unitRoles[OTHER] = { head: headKey }; },
  "a unit head cannot make themselves owner of another unit");

refuses(headKey, function (s) {
  s.people.forEach(function (p) { if (p.key === headKey) p.role = "super"; });
  s.units[OTHER].name = "Mine now";
}, "escalating and using it in ONE save is still refused");

refuses("ceo", function (s) {
  s.people.forEach(function (p) { if (p.key === "ceo") p.role = "super"; });
}, "the group CEO cannot make themselves the SMO either");

/* ── 2 · Reach: the plan, other units, setup ────────────────────── */
console.log("\n2 · reach");
refuses(headKey, function (s) { s.units[UNIT].items[0].measures[0].target = 999; },
  "a unit head cannot rewrite their own plan's target (§31)");
refuses(headKey, function (s) { var t = s.units[UNIT].items[0].tactics[0]; t.q3 = t.q3 ? 0 : 1; },
  "a unit head cannot move a tactic's quarters (§7.3 — plan)");
refuses(headKey, function (s) { s.units[OTHER].items[0].measures[0].actual = 1; },
  "a unit head cannot report for another unit");
refuses(headKey, function (s) { s.labels[0].bu = "changed"; },
  "a unit head cannot change the labels");
refuses(headKey, function (s) { s.group.aspiration = "changed"; },
  "a unit head cannot change the group's aspiration");
refuses(headKey, function (s) { s.cycle.locked = !s.cycle.locked; },
  "a unit head cannot lock or unlock the cycle");
refuses(headKey, function (s) { s.cycle.focus = Object.assign({}, s.cycle.focus, { zzz: true }); },
  "a unit head cannot mark a focus measure (§37)");
refuses(headKey, function (s) { s.somethingNew = { a: 1 }; },
  "an unrecognised change fails closed");
refuses(headKey, function (s) { s.units[UNIT].brandNewField = 1; },
  "an unrecognised field on their OWN unit also fails closed");
refuses(headKey, function (s) { s.group.branding = { accent: "#123456" }; },
  "a unit head cannot change the tenant's branding");
allows("smo", function (s) { s.group.branding = { accent: "#123456" }; },
  "the SMO can");
/* Communication (§72). The same shape as branding, and asserted rather than
   left to the unknown bucket: an unclassified change IS refused for everybody
   but the SMO, so this passes either way — what it pins is that the refusal
   names Setup, which is what sends the person somewhere (§16.7). */
refuses(headKey, function (s) { s.group.comms = { fromName: "Raya Trade" }; },
  "a unit head cannot change the communication settings");
allows("smo", function (s) { s.group.comms = { fromName: "Raya Trade" }; },
  "the SMO can");

/* The knowledge base's overlay (§140) — the same shape as comms: named as
   setup so the refusal points at the page with the pen, refused to anybody
   the matrix does not give Setup to, and BOTH ENDS asked (§94.2). */
refuses(headKey, function (s) { s.group.kb = { ov: { "report-a-figure": { q: "q", a: "mine" } } }; },
  "a unit head cannot rewrite the knowledge base's answers");
allows("smo", function (s) { s.group.kb = { ov: { "report-a-figure": { q: "q", a: "mine" } } }; },
  "the SMO can rewrite an answer");
(function () {
  const inc = clone(SEED); inc.group.kb = { add: [{ id: "kbx1", g: "Reporting", q: "q", a: "a" }] };
  const ch = A.collect(SEED, inc, R.worldOf(SEED))
              .filter(function (c) { return c.what === "the knowledge base's answers"; })[0];
  check("a knowledge base change is classified as setup, not as unknown",
        !!ch && ch.kind === "setup", ch && ch.kind);
})();
(function () {
  /* A.collect, NOT A.classify — the lesson §54.5 left further down this file,
     applied forward rather than re-learned. */
  const inc = clone(SEED); inc.group.comms = { fromName: "Raya Trade" };
  const ch = A.collect(SEED, inc, R.worldOf(SEED))
              .filter(function (c) { return c.what === "the communication settings"; })[0];
  check("a communication change is classified as setup, not as unknown",
        !!ch && ch.kind === "setup", ch ? ch.kind : "not classified at all");
})();

/* The regression that the browser found and the unit tests did not: the
   platform used to send a branding of four nulls that the database never
   held, so EVERY non-SMO save carried an unexplained group change and was
   refused. sync.js drops it now; this asserts the classifier's half — an
   all-null branding is still a change, so the fix has to be at the source. */
(function () {
  const inc = clone(SEED); inc.group.branding = { palette:null, font:null, accent:null, bar:null };
  const v = A.authorize(SEED, inc, personOf(SEED, headKey));
  check("an all-null branding still counts as a change (so sync.js must not send it)",
        !v.ok, "classifier saw: " + JSON.stringify(v.changes.map(function (c) { return c.kind; })));
})();

/* ── 2c · THE STRATEGY TAB IS THE OFFICE'S (§94) ──────────────────
   These two were in section 3 as work a unit head MUST be able to do — the
   aspiration and the SWOT were open to whoever held their own unit at edit
   while the plan beneath them was the SMO's. Islam closed the whole tab on
   2026-08-25 after signing in as a custodian and finding the pens, so they
   move here rather than being deleted: what changed is the answer, and a
   deleted test would leave nothing saying the answer used to be the other
   one. */
console.log("\n2c · a unit's own words and its SWOT are the SMO's");
refuses(headKey, function (s) { s.units[UNIT].aspiration = "A new aspiration"; },
  "a unit head may not rewrite their own aspiration");
refuses(headKey, function (s) { s.units[UNIT].swot.s = ["Something"]; },
  "a unit head may not rewrite their own SWOT");
refuses(headKey, function (s) { s.units[UNIT].clauses = [["Who we are", "Rewritten"]]; },
  "...nor the clauses beside it");

/* ── 2d · AND THE FUNCTION'S HALF OF THE SAME TAB (§94, §53.5) ────
   A capability's definition, key objectives and projects ARE a supporting
   function's Strategy tab. The pen has been the office's since §69.13 and the
   server had never been told, so a function head could write with the API
   what the screen would not draw for them. Tested on both sides of the
   navigation switch, because that is what §53.5 is for. */
console.log("\n2d · a capability's plan is the SMO's");
(function () {
  const cap = (SEED.group.capabilities || [])[0];
  const fnHead = cap && (SEED.functions[cap.fn] || {}).head;
  if (!cap || !fnHead || !personOf(SEED, fnHead)) {
    check("a capability with a function head exists to test", false,
          "seed has no capability whose function has a head");
    return;
  }
  refuses(fnHead, function (s) {
    s.group.capabilities[0] = Object.assign({}, s.group.capabilities[0],
                                            { def: "Rewritten by the function" });
  }, "the head of " + cap.fn + " may not rewrite their capability's definition");
  refuses(fnHead, function (s) {
    const c = s.group.capabilities[0];
    if (c.keyObjectives && c.keyObjectives[0]) c.keyObjectives[0].target = "999";
    else c.keyObjectives = [{ id:"zz", name:"Invented", target:"1" }];
  }, "...nor a key objective's target");
  allows("smo", function (s) {
    s.group.capabilities[0] = Object.assign({}, s.group.capabilities[0],
                                            { def: "Rewritten by the office" });
  }, "the SMO can");
})();

/* ── 3 · The work each role must still be able to do ────────────── */
console.log("\n3 · legitimate work is not refused");
allows(headKey, function (s) { s.units[UNIT].items[0].measures[0].actual = 42; },
  "a unit head reports their own figure");
allows(headKey, function (s) { s.units[UNIT].items[0].tactics[0].status = "On track"; },
  "a unit head sets their own tactic's status");
allows(headKey, function (s) { s.review.submitted[UNIT] = true; },
  "a unit head submits their own report");
allows(headKey, function (s) { s.review.note[UNIT] = "Why we are behind."; },
  "a unit head writes their own report note");
if (custKey) allows(custKey, function (s) { s.units[UNIT].items[0].measures[0].actual = 7; },
  "the strategy custodian reports the same figure");
allows("ceo", function (s) { s.cycle.focus = Object.assign({}, s.cycle.focus, { zzz: true }); },
  "the group CEO marks a focus measure");

console.log("\n4 · the SMO");
allows("smo", function (s) { s.units[UNIT].items[0].measures[0].target = 999; }, "corrects a plan");
allows("smo", function (s) { s.people.push({ key: "newbie", name: "New Person", unit: UNIT }); }, "adds a person");
allows("smo", function (s) { s.access.owner = Object.assign({}, s.access.owner, { a_setup: "edit" }); }, "changes the matrix");
allows("smo", function (s) { s.cycle.locked = true; }, "locks the cycle");
allows("smo", function (s) { s.somethingNew = { a: 1 }; }, "may make an unrecognised change");

/* ── 5 · A locked cycle takes no more figures ───────────────────── */
console.log("\n5 · a locked cycle");
(function () {
  const locked = clone(SEED); locked.cycle.locked = true;
  const inc = clone(locked); inc.units[UNIT].items[0].measures[0].actual = 5;
  const v = A.authorize(locked, inc, personOf(locked, headKey));
  check("a unit head cannot report into a locked cycle", !v.ok, v.refusals.join(" / "));
  const v2 = A.authorize(locked, inc, personOf(locked, "smo"));
  check("the SMO still can", v2.ok, v2.refusals.join(" / "));
})();

/* ── 6 · A contributor writes their own lines only ──────────────── */
console.log("\n6 · a contributor");
(function () {
  /* Give contrib edit, as an SMO might, and prove the rule still bites. */
  const base = clone(SEED);
  base.access.contrib = Object.assign({}, base.access.contrib, { a_unit_own: "edit" });
  /* A contributor attached to a real UNIT — contrib@group reaches the group
     pages and no unit at all, which is §33 working, not a case to test here. */
  const contribs = base.people.filter(function (p) {
    /* Either floor role: somebody attached to a unit and holding nothing else.
       Which of the two they are depends on whether the plan names them, and
       this fixture wants "holds nothing else", not one or the other. */
    return R.personRoleKeys(R.worldOf(base), p).every(R.isOwnLinesRole) &&
           R.personRoleKeys(R.worldOf(base), p).length === 1 && base.units[p.unit];
  });
  if (!contribs.length) { console.log("  (no contributor in the seed — skipped)"); return; }
  const me = contribs[0];
  const myUnit = me.unit;
  const rows = [];
  (base.units[myUnit].items || []).forEach(function (p) {
    (p.tactics || []).forEach(function (t) { rows.push({ t: t, mine: A.namedOn(t, me) }); });
  });
  const mine = rows.filter(function (r) { return r.mine; })[0];
  const theirs = rows.filter(function (r) { return !r.mine; })[0];
  console.log("  contributor: " + me.key + " (" + me.name + ") in " + myUnit +
              " — own lines: " + rows.filter(function (r) { return r.mine; }).length +
              " of " + rows.length);

  if (theirs) {
    const inc = clone(base);
    inc.units[myUnit].items.forEach(function (p) {
      (p.tactics || []).forEach(function (t) { if (t.id === theirs.t.id) t.status = "Done"; });
    });
    const v = A.authorize(base, inc, personOf(base, me.key));
    check("a contributor cannot report a line that is not theirs", !v.ok, v.refusals.join(" / "));
  }
  if (mine) {
    const inc = clone(base);
    inc.units[myUnit].items.forEach(function (p) {
      (p.tactics || []).forEach(function (t) { if (t.id === mine.t.id) t.status = "Done"; });
    });
    const v = A.authorize(base, inc, personOf(base, me.key));
    check("a contributor CAN report their own line", v.ok, v.refusals.join(" / "));
  }
  /* And with the shipped default (view), they write nothing at all. */
  const inc2 = clone(SEED);
  (inc2.units[myUnit].items[0].tactics || []).forEach(function (t) { t.status = "Done"; });
  const v3 = A.authorize(SEED, inc2, personOf(SEED, me.key));
  check("with the shipped default a contributor reports nothing", !v3.ok, v3.refusals.join(" / "));
})();

/* ── 6b · Figure sets (spec 008) ────────────────────────────────── */
console.log("\n6b · figure sets");
(function () {
  const base = clone(SEED);
  const fin = base.people.filter(function (p) { return p.fn === "finance"; })[0];
  const tre = base.people.filter(function (p) { return p.fn === "treasury"; })[0];
  if (!fin || !tre) { console.log("  (no finance/treasury people in the seed — skipped)"); return; }

  /* Two sets: one the SMO fills, one its owner fills. */
  base.group.sets = [
    { id: "fin", name: "Financial Figures", team: "finance",  owner: fin.key, pick: "owner" },
    { id: "tre", name: "Treasury Figures",  team: "treasury", owner: tre.key, pick: "smo" }
  ];
  const m  = base.units[UNIT].items[0].measures[0];
  const m2 = base.units[UNIT].items[0].measures[1];
  const free = base.units[UNIT].items[0].measures[2];
  m.src = { set: "fin" };
  console.log("  " + m.name + " is in Financial Figures (owner " + fin.name + ")");

  const setActual = function (state, id, to) {
    state.units[UNIT].items[0].measures.forEach(function (x) { if (x.id === id) x.actual = to; });
  };
  const setNote = function (state, id, txt) {
    state.units[UNIT].items[0].measures.forEach(function (x) { if (x.id === id) x.note = txt; });
  };
  const setSrc = function (state, id, src) {
    state.units[UNIT].items[0].measures.forEach(function (x) {
      if (x.id === id) { if (src) x.src = src; else delete x.src; } });
  };
  const verdict = function (who, mutate) {
    const inc = clone(base); mutate(inc);
    return A.authorize(base, inc, personOf(base, who));
  };

  /* — entering the figure — */
  let v = verdict(headKey, function (s) { setActual(s, m.id, "77%"); });
  check("the unit head cannot enter a figure held by a set", !v.ok, v.refusals.join(" / "));
  console.log("        " + v.refusals.join(" / "));

  v = verdict(fin.key, function (s) { setActual(s, m.id, "77%"); });
  check("the set's owner can", v.ok, v.refusals.join(" / "));

  v = verdict(tre.key, function (s) { setActual(s, m.id, "77%"); });
  check("another set's owner cannot", !v.ok, v.refusals.join(" / "));

  v = verdict(headKey, function (s) { setNote(s, m.id, "Why it landed there."); });
  check("the UNIT still writes the note on a set-held figure", v.ok, v.refusals.join(" / "));

  v = verdict(fin.key, function (s) { setNote(s, m.id, "Finance's opinion."); });
  check("and the set's owner does not", !v.ok, v.refusals.join(" / "));

  v = verdict(headKey, function (s) { setActual(s, m2.id, "12%"); });
  check("the unit still reports its own unclaimed figures", v.ok, v.refusals.join(" / "));

  /* — claiming — */
  v = verdict(fin.key, function (s) { setSrc(s, free.id, { set: "fin" }); });
  check("an owner whose set is theirs to fill may claim into it", v.ok, v.refusals.join(" / "));

  v = verdict(tre.key, function (s) { setSrc(s, free.id, { set: "tre" }); });
  check("an owner whose set is the SMO's to fill may NOT", !v.ok, v.refusals.join(" / "));
  console.log("        " + v.refusals.join(" / "));

  v = verdict(fin.key, function (s) { setSrc(s, free.id, { set: "tre" }); });
  check("nobody may claim into somebody else's set", !v.ok, v.refusals.join(" / "));

  v = verdict(tre.key, function (s) { setSrc(s, m.id, { set: "tre" }); });
  check("a figure another set already holds is refused, by name", !v.ok, v.refusals.join(" / "));
  console.log("        " + v.refusals.join(" / "));

  v = verdict(fin.key, function (s) { setSrc(s, m.id, null); });
  check("an owner may release what their own set holds", v.ok, v.refusals.join(" / "));

  v = verdict(tre.key, function (s) { setSrc(s, m.id, null); });
  check("but not what somebody else's holds", !v.ok, v.refusals.join(" / "));

  v = verdict(headKey, function (s) { setSrc(s, free.id, { set: "fin" }); });
  check("a unit head cannot claim figures into a set at all", !v.ok, v.refusals.join(" / "));

  v = verdict("smo", function (s) { setSrc(s, m.id, { set: "tre" }); });
  check("the SMO can move a figure between sets", v.ok, v.refusals.join(" / "));

  /* — the sets themselves — */
  v = verdict(fin.key, function (s) {
    s.group.sets = s.group.sets.map(function (x) {
      return x.id === "tre" ? Object.assign({}, x, { owner: fin.key }) : x; });
  });
  check("an owner cannot make themselves the owner of another set", !v.ok, v.refusals.join(" / "));

  v = verdict(fin.key, function (s) {
    s.group.sets = s.group.sets.map(function (x) {
      return x.id === "tre" ? Object.assign({}, x, { pick: "owner" }) : x; });
  });
  check("nor open another set's picking to its owner", !v.ok, v.refusals.join(" / "));

  v = verdict(fin.key, function (s) {
    s.group.sets = s.group.sets.map(function (x) {
      return x.id === "fin" ? Object.assign({}, x, { name: "Everything, actually" }) : x; });
  });
  check("nor rename their OWN set — a set is Setup", !v.ok, v.refusals.join(" / "));

  v = verdict("smo", function (s) { s.group.sets.push(
    { id: "mkt", name: "Market Figures", team: "marketing", owner: "smo", pick: "smo" }); });
  check("the SMO creates sets", v.ok, v.refusals.join(" / "));

  /* — a locked cycle stops the set owner too — */
  const locked = clone(base); locked.cycle.locked = true;
  const li = clone(locked); setActual(li, m.id, "88%");
  v = A.authorize(locked, li, personOf(locked, fin.key));
  check("a locked cycle stops the set's owner as well", !v.ok, v.refusals.join(" / "));

  /* — handing the set over is ONE edit — */
  const handed = clone(base);
  handed.group.sets = handed.group.sets.map(function (x) {
    return x.id === "fin" ? Object.assign({}, x, { owner: tre.key }) : x; });
  const inc2 = clone(handed); setActual(inc2, m.id, "31%");
  v = A.authorize(handed, inc2, personOf(handed, tre.key));
  check("handing a set over moves every figure with it, in one edit", v.ok, v.refusals.join(" / "));
  const inc3 = clone(handed); setActual(inc3, m.id, "31%");
  v = A.authorize(handed, inc3, personOf(handed, fin.key));
  check("and the previous owner stops being able to enter them", !v.ok, v.refusals.join(" / "));
})();

/* ── 6c · Claim requests (spec 008 §5) ──────────────────────────── */
console.log("\n6c · claim requests");
(function () {
  const base = clone(SEED);
  const fin = base.people.filter(function (p) { return p.fn === "finance"; })[0];
  const tre = base.people.filter(function (p) { return p.fn === "treasury"; })[0];
  if (!fin || !tre) { console.log("  (skipped)"); return; }
  base.group.sets = [
    { id: "fin", name: "Financial Figures", team: "finance",  owner: fin.key, pick: "owner" },
    { id: "tre", name: "Treasury Figures",  team: "treasury", owner: tre.key, pick: "owner" }
  ];
  const m    = base.units[UNIT].items[0].measures[0];
  const free = base.units[UNIT].items[0].measures[1];
  m.src = { set: "fin" };
  base.group.claims = [];

  const ask = function (state, over) {
    state.group.claims = (state.group.claims || []).concat([Object.assign(
      { id: "c1", unit: UNIT, figure: m.id, set: "tre", by: tre.key, state: "open" }, over || {})]);
  };
  const verdict = function (who, mutate) {
    const inc = clone(base); mutate(inc);
    return A.authorize(base, inc, personOf(base, who));
  };

  let v = verdict(tre.key, function (s) { ask(s); });
  check("a set owner may ask for a figure another set holds", v.ok, v.refusals.join(" / "));

  v = verdict(tre.key, function (s) { ask(s, { by: fin.key }); });
  check("but not in somebody else's name", !v.ok, v.refusals.join(" / "));

  v = verdict(tre.key, function (s) { ask(s, { set: "fin" }); });
  check("nor on behalf of a set they do not fill", !v.ok, v.refusals.join(" / "));

  v = verdict(tre.key, function (s) { ask(s, { state: "granted" }); });
  check("nor already answered — the SMO answers it", !v.ok, v.refusals.join(" / "));
  console.log("        " + v.refusals.join(" / "));

  v = verdict(tre.key, function (s) { ask(s, { figure: free.id }); });
  check("nor for a figure nobody holds", !v.ok, v.refusals.join(" / "));

  v = verdict(headKey, function (s) { ask(s, { by: headKey }); });
  check("a unit head cannot ask at all — they fill no set", !v.ok, v.refusals.join(" / "));

  /* Asking twice is not asking louder. */
  const asked = clone(base); ask(asked);
  const twice = clone(asked);
  twice.group.claims = twice.group.claims.concat([
    { id: "c2", unit: UNIT, figure: m.id, set: "tre", by: tre.key, state: "open" }]);
  v = A.authorize(asked, twice, personOf(asked, tre.key));
  check("a second open request for the same figure is refused", !v.ok, v.refusals.join(" / "));

  /* Answering is the SMO's. */
  const answered = clone(asked);
  answered.group.claims = answered.group.claims.map(function (c) {
    return Object.assign({}, c, { state: "granted" }); });
  v = A.authorize(asked, answered, personOf(asked, tre.key));
  check("the asker cannot answer their own request", !v.ok, v.refusals.join(" / "));
  v = A.authorize(asked, answered, personOf(asked, fin.key));
  check("nor can the holder", !v.ok, v.refusals.join(" / "));
  v = A.authorize(asked, answered, personOf(asked, "smo"));
  check("the SMO can", v.ok, v.refusals.join(" / "));

  /* Granting moves the figure, and that is the SMO's to do anyway. */
  const moved = clone(answered);
  moved.units[UNIT].items[0].measures.forEach(function (x) {
    if (x.id === m.id) x.src = { set: "tre" }; });
  v = A.authorize(asked, moved, personOf(asked, "smo"));
  check("and moves the figure in the same save", v.ok, v.refusals.join(" / "));
  v = A.authorize(asked, moved, personOf(asked, tre.key));
  check("which the asker still cannot do for themselves", !v.ok, v.refusals.join(" / "));

  /* Withdrawing somebody else's request is not asking. */
  const gone = clone(asked); gone.group.claims = [];
  v = A.authorize(asked, gone, personOf(asked, tre.key));
  check("removing a request is the SMO's", !v.ok, v.refusals.join(" / "));
})();

/* ── 6d · Naming a person against ONE figure (spec 008 §3B) ─────── */
console.log("\n6d · naming a person on a figure");
(function () {
  const base = clone(SEED);
  const fin = base.people.filter(function (p) { return p.fn === "finance"; })[0];
  const somebody = base.people.filter(function (p) {
    return p.key !== custKey && p.key !== headKey && p.key !== "smo";
  })[0];
  if (!fin || !somebody) { console.log("  (skipped)"); return; }
  base.group.sets = [
    { id: "fin", name: "Financial Figures", team: "finance", owner: fin.key, pick: "owner" }
  ];
  const held = base.units[UNIT].items[0].measures[0];
  const free = base.units[UNIT].items[0].measures[1];
  held.src = { set: "fin" };

  const name = function (state, id, who) {
    state.units[UNIT].items[0].measures.forEach(function (x) {
      if (x.id === id) x.src = { by: who };
    });
  };
  const from = function (state, who, mutate) {
    const inc = clone(state); mutate(inc);
    return A.authorize(state, inc, personOf(state, who));
  };

  /* OFF is the shipped answer, and the SERVER is where it is enforced. */
  let v = from(base, custKey, function (s) { name(s, free.id, somebody.key); });
  check("naming is refused while the tenant has it switched off", !v.ok, v.refusals.join(" / "));
  console.log("        " + v.refusals.join(" / "));

  const on = clone(base); on.group.naming = true;

  v = from(on, custKey, function (s) { name(s, free.id, somebody.key); });
  check("the unit's custodian may name somebody once it is on", v.ok, v.refusals.join(" / "));

  v = from(on, headKey, function (s) { name(s, free.id, somebody.key); });
  check("so may the unit's head", v.ok, v.refusals.join(" / "));

  /* ANYONE THE PLATFORM KNOWS (spec 008 §9) — but only somebody it knows. */
  v = from(on, custKey, function (s) { name(s, free.id, "nobody-at-all"); });
  check("naming somebody who is not on the register is refused", !v.ok, v.refusals.join(" / "));

  const retiredOn = clone(on);
  retiredOn.people.forEach(function (p) { if (p.key === somebody.key) p.active = false; });
  v = from(retiredOn, custKey, function (s) { name(s, free.id, somebody.key); });
  check("nor is naming somebody who has been retired", !v.ok, v.refusals.join(" / "));

  /* FIRST CLAIM WINS, in both directions (spec 008 §4). */
  v = from(on, custKey, function (s) { name(s, held.id, somebody.key); });
  check("a figure a SET holds cannot be named from the unit", !v.ok, v.refusals.join(" / "));
  console.log("        " + v.refusals.join(" / "));

  const named = clone(on); name(named, free.id, somebody.key);
  v = from(named, fin.key, function (s) {
    s.units[UNIT].items[0].measures.forEach(function (x) {
      if (x.id === free.id) x.src = { set: "fin" }; });
  });
  check("and a figure the unit NAMED cannot be claimed into a set", !v.ok, v.refusals.join(" / "));
  console.log("        " + v.refusals.join(" / "));

  /* Releasing is the same act read backwards. */
  v = from(named, custKey, function (s) {
    s.units[UNIT].items[0].measures.forEach(function (x) {
      if (x.id === free.id) delete x.src; });
  });
  check("the unit may release what it named", v.ok, v.refusals.join(" / "));

  v = from(named, fin.key, function (s) {
    s.units[UNIT].items[0].measures.forEach(function (x) {
      if (x.id === free.id) delete x.src; });
  });
  check("a set owner may not release it for them", !v.ok, v.refusals.join(" / "));

  /* Nobody in ANOTHER unit, and nobody who only reports their own lines. */
  const other = clone(on);
  v = from(other, custKey, function (s) {
    s.units[OTHER].items[0].measures[0].src = { by: somebody.key };
  });
  check("a custodian cannot name against another unit's figures", !v.ok, v.refusals.join(" / "));

  const contribOn = clone(on);
  contribOn.access = Object.assign({}, contribOn.access,
    { contrib: Object.assign({}, (contribOn.access || {}).contrib, { a_unit_own: "edit" }) });
  const contribKey = "smp_test_contrib";
  contribOn.people = contribOn.people.concat([
    { key: contribKey, name: "A Contributor", unit: UNIT }]);
  v = from(contribOn, contribKey, function (s) { name(s, free.id, somebody.key); });
  check("a contributor with edit stored still cannot decide who enters a figure",
        !v.ok, v.refusals.join(" / "));

  /* The switch itself is Setup. */
  v = from(base, custKey, function (s) { s.group.naming = true; });
  check("a custodian cannot switch naming on", !v.ok, v.refusals.join(" / "));
  v = from(base, "smo", function (s) { s.group.naming = true; });
  check("the SMO can", v.ok, v.refusals.join(" / "));
})();

/* ── 6e · The BU list (§54.1, spec 011) ────────────────────────────
   A row's target decides where every person carrying that name is attached
   the next time an employee file lands, so re-pointing one is a way to walk a
   department into a unit. It is Setup, and nothing below the SMO may touch
   it. */
console.log("\n6e · the BU list");
(function () {
  const base = clone(SEED);
  const from = function (state, who, mutate) {
    const inc = clone(state); mutate(inc);
    return A.authorize(state, inc, personOf(state, who));
  };
  const put = function (s) { s.group.mainbus = [{ name: "Risk", at: UNIT }]; };

  let v = from(base, headKey, put);
  check("a unit head cannot point a BU name at their own unit", !v.ok, v.refusals.join(" / "));
  v = from(base, custKey, put);
  check("nor can a custodian", !v.ok, v.refusals.join(" / "));
  v = from(base, "smo", put);
  check("the SMO can", v.ok, v.refusals.join(" / "));

  /* Re-pointing an existing row is the same act as writing the first one — it
     is the one that moves people who are already placed. */
  const withList = clone(base);
  withList.group.mainbus = [{ name: "Risk", at: null }];
  v = from(withList, headKey, function (s) { s.group.mainbus[0].at = UNIT; });
  check("a unit head cannot re-point one either", !v.ok, v.refusals.join(" / "));
  v = from(withList, "smo", function (s) { s.group.mainbus[0].at = UNIT; });
  check("the SMO can", v.ok, v.refusals.join(" / "));

  /* And it is NAMED rather than falling into the unknown bucket: a refusal
     that says "the group's mainbus" sends nobody to a screen.

     UNCONDITIONAL, and it was not: written as `A.classify ? … : null` it
     skipped in silence, because the export is called collect(). A check that
     asks whether it can run is a check that passes when it cannot — the
     fault CLAUDE.md names twice over, walked into while writing the test for
     something else. */
  const moved = clone(withList); moved.group.mainbus[0].at = UNIT;
  const cls = A.collect(withList, moved, null);
  check("the change is classified as setup, not unknown",
        cls.some(function (c) { return c.kind === "setup" && c.what === "the BU list"; }) &&
        !cls.some(function (c) { return c.kind === "unknown"; }),
        JSON.stringify(cls.map(function (c) { return c.kind + ":" + c.what; })));
})();

/* ── 7 · A retired person can do nothing ───────────────────────── */
console.log("\n7 · a retired person");
(function () {
  const base = clone(SEED);
  base.people.forEach(function (p) { if (p.key === headKey) p.active = false; });
  const inc = clone(base); inc.units[UNIT].items[0].measures[0].actual = 3;
  const v = A.authorize(base, inc, personOf(base, headKey));
  check("a retired unit head reports nothing", !v.ok, v.refusals.join(" / "));
})();

/* ── 8 · Picture slides are the unit's, not a row's (§50.5) ────── */
console.log("\n8 · the review's picture slides");
(function () {
  const slide = { id: "psTEST", title: "Site visit", at: "cover", layout: 1,
                  pics: [{ src: "data:image/png;base64,AAAA", cap: "", z: 1, x: 50, y: 50 }] };
  const put = function (s, key) {
    s.review = s.review || {};
    s.review.slides = Object.assign({}, s.review.slides);
    s.review.slides[key] = [slide];
  };

  /* The three people who prepare and present a review. */
  allows("smo",   function (s) { put(s, UNIT); }, "the SMO adds a picture slide");
  allows(headKey, function (s) { put(s, UNIT); }, "the unit's head adds one to their own unit");
  allows(custKey, function (s) { put(s, UNIT); }, "the strategy custodian adds one");

  /* And the people who must not. */
  refuses(headKey, function (s) { put(s, OTHER); },
          "a unit head cannot put a picture in ANOTHER unit's deck");
  refuses("ceo",   function (s) { put(s, UNIT); },
          "the group CEO, who views everything, still adds none");

  /* A contributor speaks for their own lines, never for the unit — the same
     refusal `submitted` and the note already get, which is the whole reason
     picture slides were classified with them rather than on their own. */
  (function () {
    const base = clone(SEED);
    base.access = Object.assign({}, base.access,
      { contrib: Object.assign({}, (base.access || {}).contrib, { a_unit_own: "edit" }) });
    const key = "smp_test_pic_contrib";
    base.people = base.people.concat([{ key: key, name: "A Contributor", unit: UNIT }]);
    const inc = clone(base); put(inc, UNIT);
    const v = A.authorize(base, inc, personOf(base, key));
    check("a contributor with edit stored still adds no picture slide",
          !v.ok, v.refusals.join(" / "));
  })();

  /* A locked cycle has stopped taking the review's content, pictures with it. */
  (function () {
    const base = clone(SEED);
    base.cycle = Object.assign({}, base.cycle, { locked: true });
    const inc = clone(base); put(inc, UNIT);
    let v = A.authorize(base, inc, personOf(base, custKey));
    check("a locked cycle takes no more picture slides", !v.ok, v.refusals.join(" / "));
    v = A.authorize(base, inc, personOf(base, "smo"));
    check("...except from the SMO, who locked it", v.ok, v.refusals.join(" / "));
  })();

  /* And it must be NAMED in the refusal, or a refusal cannot be diagnosed.
     Asked of the CONTRIBUTOR rather than of a unit head reaching into another
     unit: there the refusal is "you cannot report for X" and stops before the
     what, which is correct — reach is answered before the act. */
  (function () {
    const base = clone(SEED);
    base.access = Object.assign({}, base.access,
      { contrib: Object.assign({}, (base.access || {}).contrib, { a_unit_own: "edit" }) });
    const key = "smp_test_pic_named";
    base.people = base.people.concat([{ key: key, name: "A Contributor", unit: UNIT }]);
    /* AND THEY HAVE TO BE NAMED ON SOMETHING TO BE ONE. Since the floor split
       in two, somebody attached to a unit and named on nothing is an EMPLOYEE
       — so granting `contrib` edit reached nobody and this test failed on
       reach ("you cannot report for mobile") before it ever got to the act it
       is about. Naming them on a tactic is what makes them the contributor the
       test says it is asking about. */
    const firstTactic = ((base.units[UNIT].items || [])[0] || {}).tactics || [];
    if (firstTactic[0]) {
      firstTactic[0].collaborators = (firstTactic[0].collaborators || []).concat(["A Contributor"]);
    }
    const inc = clone(base); put(inc, UNIT);
    const v = A.authorize(base, inc, personOf(base, key));
    check("the refusal names the picture slides",
          v.refusals.join(" ").indexOf("picture slides") > -1, v.refusals.join(" / "));
  })();
})();

/* ── 9 · The floor is two roles now (Islam, 2026-08-23) ────────────
   Somebody attached to a unit and holding nothing else is a CONTRIBUTOR where
   the plan names them and an EMPLOYEE where it does not. Derived, never
   granted — and neither of them speaks for the unit.

   The third test is the one that matters. Twelve places asked `onlyVia(...,
   "contrib")` by name, and a second floor role beside it would have widened
   every one of them by omission: give Employee edit on its own unit and an
   employee could submit the unit's report, write the cycle note, add a
   picture slide and decide who enters a figure. The rule is named once
   (OWN_LINES_ONLY) so both are covered by construction. */
console.log("\n9 · employee and contributor");
(function () {
  const UNIT = Object.keys(SEED.units)[0];
  const key = "smp_test_floor";
  const withPerson = function (named) {
    const base = clone(SEED);
    base.people = base.people.concat([{ key: key, name: "Ordinary Person", unit: UNIT }]);
    if (named) {
      const t = (((base.units[UNIT].items || [])[0] || {}).tactics || [])[0];
      if (t) t.collaborators = (t.collaborators || []).concat(["Ordinary Person"]);
    }
    return base;
  };

  let base = withPerson(false);
  /* NAMED ON NOTHING, THEY HOLD NOTHING (§93). Islam: "anyone with no role is
     employee — employee doesn't give the person anything, so let's remove this
     strange role." It was a role on the register and a chip on their row, and
     it granted exactly what the floor grants. The floor stayed; the role went. */
  check("named on nothing, they hold no role at all",
        R.personRoleKeys(R.worldOf(base), personOf(base, key)).length === 0,
        R.personRoleKeys(R.worldOf(base), personOf(base, key)).join());
  check("...and it is not offered as a role either",
        R.ROLE_KEYS.indexOf(R.NO_ROLE) === -1, R.ROLE_KEYS.join());
  check("...but they still see their own unit",
        R.grantIn(R.worldOf(base), personOf(base, key), "unit", UNIT) === "view",
        R.grantIn(R.worldOf(base), personOf(base, key), "unit", UNIT));
  check("...and not somebody else's",
        R.grantIn(R.worldOf(base), personOf(base, key), "unit",
                  Object.keys(SEED.units)[1]) === "none");

  base = withPerson(true);
  check("named on a tactic, the same person is a Contributor",
        R.personRoleKeys(R.worldOf(base), personOf(base, key)).join() === "contrib",
        R.personRoleKeys(R.worldOf(base), personOf(base, key)).join());

  /* THE WIDENING THAT DID NOT HAPPEN. */
  base = withPerson(false);
  base.access = Object.assign({}, base.access,
    { employee: Object.assign({}, (base.access || {}).employee, { a_unit_own: "edit" }) });
  const w = R.worldOf(base), person = personOf(base, key);
  check("the floor given edit still speaks only for themselves",
        R.onlyOwnLines(w, person, "unit", UNIT),
        "editing roles: " + R.editingRoles(w, person, "unit", UNIT).join());
  check("...so they may not decide who enters a figure",
        !R.mayName(Object.assign({}, w, { naming: true }), person, UNIT));
  check("neither floor can be granted from a file",
        R.isOwnLinesRole(R.NO_ROLE) && R.isOwnLinesRole("contrib") &&
        !R.isOwnLinesRole("owner"));
})();

/* ── 10 · A function that plans in pillars can be reported on (§59) ──
   The bug this fixes was silent and total: a function's plan and its figures
   live on the FUNCTION, and every change anywhere in `functions` classified as
   Setup — so Merchandising's custodian could open the Report page, type a
   number, and have the save refused with "Setup is the SMO's". Nothing threw
   and no test failed, because no test had ever asked. */
console.log("\n10 · a function that plans in pillars");
(function () {
  const FK = Object.keys(SEED.functions || {}).filter(function (k) {
    return String((SEED.functions[k] || {}).format) === "pillars";
  })[0];
  if (!FK) { check("the seed carries a pillars function to test with", false); return; }
  const f = SEED.functions[FK];
  const custKey = f.custodian;

  /* Report a figure on its first measure — the act that was refused. */
  const withFigure = function () {
    const base = clone(SEED);
    const inc = clone(base);
    const m = (((inc.functions[FK].items || [])[0] || {}).measures || [])[0];
    if (m) { m.actual = "99%"; m.progress = 99; }
    return { base: base, inc: inc, ok: !!m };
  };
  let t = withFigure();
  check("the seed's pillars function has a measure to report", t.ok);
  let v = A.authorize(t.base, t.inc, personOf(t.base, custKey));
  check("its custodian may report a figure", v.ok, v.refusals.join(" / "));
  /* A.collect, NOT A.classify — there is no A.classify, and written that way
     this line threw rather than skipping, which is the whole difference
     between §54.5's silent pass and a check that says something. */
  const kinds = A.collect(t.base, t.inc, R.worldOf(t.base))
                 .map(function (c) { return c.kind; });
  check("...classified as reporting, not as setup",
        kinds.indexOf("unitReporting") > -1, kinds.join());

  /* And the plan is still the SMO's, exactly as a unit's is (§22, §31). */
  const plan = clone(SEED), planInc = clone(plan);
  const p0 = (planInc.functions[FK].items || [])[0];
  if (p0) p0.name = "Renamed by somebody who should not";
  v = A.authorize(plan, planInc, personOf(plan, custKey));
  check("but it may not rewrite the plan", !v.ok, v.refusals.join(" / "));
  v = A.authorize(plan, planInc, personOf(plan, "smo"));
  check("...which the SMO may", v.ok, v.refusals.join(" / "));

  /* Its settings stay Setup. */
  const set = clone(SEED), setInc = clone(set);
  setInc.functions[FK].codePrefix = "ZZ";
  v = A.authorize(set, setInc, personOf(set, custKey));
  check("its settings are still the SMO's", !v.ok, v.refusals.join(" / "));
})();

/* ── 11 · A row LEAVING the register is the SMO's (§69) ──────────
   Deleting a person is a change to `people`, which is in TOP_SETUP, so this
   is §42's "an unrecognised change is the SMO's" already covering a feature
   that did not exist when it was written — exactly as it did for deleting a
   function (§62). It is asserted rather than assumed, because the whole point
   of that rule is that nobody has to remember it, and the way to keep it
   honest is to check it the day the feature lands. */
/* ── 10b · A FUNCTION SUBMITS ITS REPORT (§105) ────────────────────
   The server has carried an explicit `fn:` branch in the `reportState` case
   since spec 006, and nothing ever asked it a question -- the control was
   never drawn, so no test had a reason to exist. §94.2 says a check that only
   looks at something present cannot see a closed door, so BOTH ends are asked:
   the function's own head may submit, and the head of another may not. */
console.log("\n10b · a function submits its report");
(function () {
  const keys = Object.keys(SEED.functions || {});
  const withHead = keys.filter(function (k) { return (SEED.functions[k] || {}).head; });
  if (withHead.length < 2) {
    check("the seed carries two functions with heads to test with", false); return;
  }
  const A1 = withHead[0], A2 = withHead[1];
  const mine = function (fk) {
    const base = clone(SEED), inc = clone(base);
    inc.review.submitted = Object.assign({}, inc.review.submitted);
    inc.review.submitted["fn:" + fk] = true;
    return { base: base, inc: inc };
  };
  let t = mine(A1);
  let v = A.authorize(t.base, t.inc, personOf(t.base, SEED.functions[A1].head));
  check("a function head submits their own function's report", v.ok, v.refusals.join(" / "));
  const kinds = A.collect(t.base, t.inc, R.worldOf(t.base))
                 .map(function (c) { return c.kind + ":" + c.target; });
  check("...classified as reportState against the fn: target",
        kinds.indexOf("reportState:fn:" + A1) > -1, kinds.join());
  /* THE CLOSED DOOR. Without this the branch could accept anybody and the
     test above would still print ok. */
  t = mine(A2);
  v = A.authorize(t.base, t.inc, personOf(t.base, SEED.functions[A1].head));
  check("...and may NOT submit another function's", !v.ok, "it was allowed");
})();

/* ── 10c · THE REPEATS MARK IS PLAN (§115) ──────────────────────────
   `p.repeats` is a new field on a project row, so it classifies the way any
   project change does — capPlan, the office's (§94). Both ends (§94.2): the
   SMO may mark it, the function's own head may not, or the flag that decides
   whether a whole run's figures are wiped each cycle would be the one plan
   field a custodian could reach. */
console.log("\n10c · the repeats mark is plan");
(function () {
  const FK = Object.keys(SEED.functions || {}).filter(function (k) {
    return (SEED.functions[k] || {}).head;
  })[0];
  const cap = (SEED.group.capabilities || []).filter(function (c) {
    return c.fn === FK && (c.projects || []).length;
  })[0];
  if (!FK || !cap) { check("the seed carries a function with a project", false); return; }
  const mark = function () {
    const base = clone(SEED), inc = clone(base);
    const c = inc.group.capabilities.filter(function (x) { return x.id === cap.id; })[0];
    c.projects[0].repeats = "cycle";
    return { base: base, inc: inc };
  };
  let t = mark();
  let v = A.authorize(t.base, t.inc, personOf(t.base, "smo"));
  check("the SMO may mark a project as repeating", v.ok, v.refusals.join(" / "));
  t = mark();
  v = A.authorize(t.base, t.inc, personOf(t.base, SEED.functions[FK].head));
  check("...and the function's own head may NOT", !v.ok, "it was allowed");
})();

console.log("\n11 · a row leaving the register");
(function () {
  const victim = SEED.people.filter(function (p) {
    return p.key !== "smo" && p.key !== headKey && p.key !== custKey;
  })[0];
  if (!victim) { check("the seed has somebody to delete", false); return; }
  const drop = function (s) {
    s.people = s.people.filter(function (p) { return p.key !== victim.key; });
  };
  allows("smo", drop, "the SMO may delete " + victim.key);
  refuses(headKey, drop, "a unit head may not delete " + victim.key);
  refuses(custKey, drop, "a strategy custodian may not delete " + victim.key);
  /* And deleting YOURSELF is refused for everybody who is not the SMO, which
     is the same rule and worth naming: the escape hatch a save could otherwise
     use is removing the row the authoriser reads its own roles from. */
  refuses(headKey, function (s) {
    s.people = s.people.filter(function (p) { return p.key !== headKey; });
  }, "a unit head may not delete themselves");
})();

/* ── 12 · The SMO team runs it and cannot change who runs it (§89) ──
   The role holds `a_setup` at edit, which is what makes these three worth
   asserting HERE rather than trusting to the matrix: every one of them is a
   setup-shaped change that an ordinary setup grant would wave through, and
   each is refused by a rule instead. The screen hides all three
   (src/checks/smo-team.py); this is the half that decides. */
console.log("\n12 · the SMO team, and the three it does not get");
(function () {
  const TEAM = "testcase_office";
  /* Seated in the STORED world, because that is the world the authoriser
     reads its roles from (§42's first rule) — a person the incoming state
     invents authorises nothing. */
  const base = clone(SEED);
  base.people = base.people.concat([{ key:TEAM, name:"Testcase Office", role:"smoteam", unit:"group" }]);
  const asTeam = function (mutate, name, want) {
    const inc = clone(base); mutate(inc);
    const v = A.authorize(base, inc, personOf(base, TEAM));
    check(name, want ? v.ok : !v.ok,
      want ? v.refusals.join(" / ")
           : "was ALLOWED — " + JSON.stringify(v.changes.map(function (c) { return c.kind; })));
  };

  /* What they CAN do, first — a check that only proves the refusals would pass
     a role that could do nothing at all. */
  asTeam(function (s) { s.group.mission = "A different mission"; },
         "the SMO team may edit the group", true);
  asTeam(function (s) { s.labels[0].internal = "Renamed"; },
         "...and the ordinary Setup pages", true);
  asTeam(function (s) {
    s.people = s.people.concat([{ key:"newperson", name:"New Person", unit:"mobile" }]);
  }, "...and may add somebody to the register", true);
  /* ── THE DRIFT §94 FOUND (§89, §42) ─────────────────────────────
     This case asked `isSMO` — the Super user — while the platform's pen asked
     `inOffice()`. So the SMO team was OFFERED the plan pen on every unit and
     every save came back refused: the exact screen-says-yes / server-says-no
     drift `lib/rules.js` exists to prevent, sitting inside the file that
     enforces it. Both sides call `mayAuthorPage()` now. */
  asTeam(function (s) { s.units[UNIT].items[0].measures[0].target = 999; },
         "...and may correct a plan, which it could not before §94", true);
  asTeam(function (s) { s.units[UNIT].aspiration = "The office rewrote this"; },
         "...and the aspiration above it", true);

  /* And the three it does not. */
  /* A REAL MOVE, not a value the cell already held: the seed stores the team's
     own row at edit throughout, so writing `edit` back produced an identical
     object, `same()` saw no change, and the check passed on a save that had
     asked for nothing (§50.6, in a test). Narrowing their own row is the move
     that cannot be a no-op.

     FOUND TWICE, IN TWO BRANCHES, ON THE SAME DAY — §93 on main and §94 here
     — and the two fixes were different: narrow the team's own row, or widen
     somebody else's. THIS ONE IS KEPT, because narrowing their own row is the
     escalation the rule actually guards against, and the line below already
     covers the other direction. Worth recording rather than quietly resolving:
     the same no-op assertion was invisible to two people reading the same file
     for two unrelated reasons, which is how long it had been passing. */
  asTeam(function (s) {
    s.access = Object.assign({}, s.access);
    s.access.smoteam = Object.assign({}, s.access.smoteam || {}, { a_setup:"view" });
  }, "1 · may not touch the access matrix", false);
  asTeam(function (s) {
    s.access = Object.assign({}, s.access);
    s.access.contrib = Object.assign({}, s.access.contrib || {}, { a_group:"edit" });
  }, "...not even somebody else's row", false);
  asTeam(function (s) {
    s.people = s.people.filter(function (p) { return p.key !== "smo"; });
  }, "2 · may not delete a person", false);

  /* THE ESCAPE HATCH, ASKED FOR EXPLICITLY. A role that cannot edit the matrix
     but can make itself a Super user on the register has not been restricted —
     it has been inconvenienced. `people` carries the seat. */
  asTeam(function (s) {
    s.people = s.people.map(function (p) {
      return p.key === TEAM ? Object.assign({}, p, { role:"super" }) : p;
    });
  }, "3 · and may not promote itself to Super user", false);
})();

/* ── 13 · REORDERING IS THE UNIT'S AGAIN (§101, reversing §94.3) ──
   The half that was silently broken for two versions: the drag handles were
   drawn, the rows moved, and every save came back refused because the
   authoriser compares row ids IN ORDER and could not tell a reorder from a
   rewrite. So these assert BOTH SIDES of that line — a reorder goes through,
   and the words are still the office's. Getting only the first would be a
   feature that quietly handed the plan away. */
console.log("\n13 · reordering, and the line it must not cross");
function shuffleFirstToLast(list) { list.push(list.shift()); }

[headKey, custKey, "smo"].forEach(function (who) {
  allows(who, function (s) { shuffleFirstToLast(s.units[UNIT].items); },
    who + " may reorder their own unit's pillars");
  allows(who, function (s) { shuffleFirstToLast(s.units[UNIT].keyObjectives); },
    who + " may reorder their own unit's key objectives");
});

/* THE WORDS ARE STILL THE OFFICE'S — this is the assertion that stops §101
   from being a hole in §94 rather than a door beside it. */
[headKey, custKey].forEach(function (who) {
  refuses(who, function (s) { s.units[UNIT].items[0].name = "Renamed by a reorder test"; },
    who + " still may not RENAME a pillar");
  refuses(who, function (s) { s.units[UNIT].items.pop(); },
    who + " still may not REMOVE a pillar");
  refuses(who, function (s) { shuffleFirstToLast(s.units[OTHER].items); },
    who + " may not reorder ANOTHER unit's pillars");
});

/* A contributor was asked about directly and answered no (Islam, 2026-08-26).
   Found by role rather than by key, so a reseeded demo cannot quietly turn
   this into an assertion about nobody (§54.5). */
(function () {
  const contribs = SEED.people.filter(function (p) {
    const rs = R.personRoleKeys(w, p);
    return rs.length > 0 && rs.every(R.isOwnLinesRole) && !!p.unit;
  });
  check("the seed still has a contributor to test with", contribs.length > 0,
        "nobody holds only own-lines roles — this assertion is measuring nothing");
  contribs.forEach(function (p) {
    refuses(p.key, function (s) { shuffleFirstToLast(s.units[p.unit].items); },
      "a contributor (" + p.key + ") may not reorder their unit's pillars");
  });
})();

/* AND THE CLASSIFIER ITSELF, asked directly — because every assertion above
   would also pass if `arrange` were being classified as something harmless
   that nothing guards. §94.5's lesson: a check that cannot fail is invisible. */
(function () {
  const inc = clone(SEED); shuffleFirstToLast(inc.units[UNIT].items);
  const kinds = A.collect(SEED, inc, w).map(function (c) { return c.kind; });
  check("a reorder is classified as `arrange`, and as nothing else",
        kinds.length > 0 && kinds.every(function (k) { return k === "arrange"; }),
        "got: " + JSON.stringify(kinds));
  const inc2 = clone(SEED); inc2.units[UNIT].items.pop();
  const kinds2 = A.collect(SEED, inc2, w).map(function (c) { return c.kind; });
  check("but a removed row is still `unitPlan`",
        kinds2.indexOf("unitPlan") > -1, "got: " + JSON.stringify(kinds2));
})();

/* ── 14 · THE FOCUS SWITCH IS NOT A BIGGER MARK (§102) ────────────
   Marking a measure is the CEO's and the SMO's (§37); turning the whole
   feature off for the tenant is the SMO's alone. Asserted as a PAIR, because
   the fault this guards against is the switch quietly inheriting the marks'
   permission — which would let a CEO remove a feature rather than use it. */
console.log("\n14 · the focus switch");
allows("smo", function (s) { s.group.focusOff = true; },
  "the SMO may switch focus measures off");
refuses("ceo", function (s) { s.group.focusOff = true; },
  "the CEO may NOT switch focus measures off");
refuses(headKey, function (s) { s.group.focusOff = true; },
  "a unit head may NOT switch focus measures off");

/* AND THE MARKS ARE STILL THE CEO'S, or the pair above proves only that
   something was locked down, not that the right thing was. */
(function () {
  const anyId = Object.keys(SEED.cycle.focus || {})[0] ||
                (SEED.units[UNIT].keyObjectives[0] || {}).id;
  check("the seed has a markable id to test with", !!anyId,
        "no id — this assertion would be measuring nothing");
  if (!anyId) return;
  allows("ceo", function (s) { s.cycle.focus[anyId] = !s.cycle.focus[anyId]; },
    "the CEO may still mark a focus measure");
})();

/* THE SWITCH CLASSIFIES AS setup, NOT focus. Every assertion above would pass
   if it were classified as something nothing guards at all (§94.5). */
(function () {
  const inc = clone(SEED); inc.group.focusOff = true;
  const kinds = A.collect(SEED, inc, w).map(function (c) { return c.kind; });
  check("the switch is classified `setup`, and never `focus`",
        kinds.length > 0 && kinds.indexOf("setup") > -1 && kinds.indexOf("focus") === -1,
        "got: " + JSON.stringify(kinds));
})();

/* SWITCHING IT BACK ON DELETES THE KEY, so a tenant that never answered and one
   that turned it off and on again are byte-identical (§50.6). Asserted from the
   rule's own default rather than from the writer, because the writer lives in
   the browser and this file cannot reach it. */
check("an absent key reads as ON", R.focusOn(R.worldOf({ group: {} })) === true);
check("and `false` reads as ON too, so a stale write cannot hide the feature",
      R.focusOn(R.worldOf({ group: { focusOff: false } })) === true);
check("only `true` switches it off",
      R.focusOn(R.worldOf({ group: { focusOff: true } })) === false);

console.log("\n15 · the strategy | reporting split (§117)");
/* The own columns are two questions now. The old stored key kept meaning the
   Reporting half — every §13 assertion above already proves a custodian's
   stored `a_unit_own: edit` does NOT author — so this section proves the new
   half both ways: opened it authors, closed it takes the arrows too.

   PROVED ABLE TO FAIL (§94.5): the "opened" cases below refuse on the
   pre-§117 build, where mayAuthorPage() was a hard office-only rule that no
   grant could open. Run against the parent commit's lib/rules.js they go red. */
(function () {
  function withAccess(role, patch) {
    const s = clone(SEED);
    s.access = Object.assign({}, s.access,
      { [role]: Object.assign({}, (s.access || {})[role], patch) });
    return s;
  }
  function fromStored(stored, who, mutate) {
    const inc = clone(stored); mutate(inc);
    return A.authorize(stored, inc, personOf(stored, who));
  }

  /* The SMO opens strategy edit to the custodian role — a deliberate act on
     the table (Islam, 2026-08-26), and from then on the words are theirs. */
  const opened = withAccess("custodian", { a_unit_own_strat: "edit" });
  let v = fromStored(opened, custKey, function (s) {
    s.units[UNIT].items[0].name = "Renamed under an opened strategy grant";
  });
  check("strategy edit OPENED: the custodian may rename a pillar", v.ok, v.refusals.join(" / "));
  v = fromStored(opened, custKey, function (s) {
    s.units[UNIT].aspiration = "Rewritten under an opened strategy grant";
  });
  check("strategy edit OPENED: the custodian may rewrite the aspiration", v.ok, v.refusals.join(" / "));
  v = fromStored(opened, custKey, function (s) {
    s.units[UNIT].swot.s[0] = "Rewritten under an opened strategy grant";
  });
  check("strategy edit OPENED: the custodian may edit the SWOT", v.ok, v.refusals.join(" / "));
  /* Opening OWN opens own and nothing else — another unit's plan stays the
     office's however wide the stored map goes, because the other columns are
     not split and mayAuthorPage() refuses a non-office author who does not
     hold the target. */
  const openedWide = withAccess("custodian",
    { a_unit_own_strat: "edit", a_unit_other: "edit" });
  v = fromStored(openedWide, custKey, function (s) {
    s.units[OTHER].items[0].name = "Renamed in a unit this custodian does not hold";
  });
  check("strategy edit opened + other-units edit: ANOTHER unit's plan still refuses",
        !v.ok, "was ALLOWED");

  /* Closing the Strategy half takes the arrows with it (§101 rides the
     Reporting half now, but a pane you cannot open is a pane you cannot
     arrange) — while reporting itself is untouched. */
  const closed = withAccess("custodian", { a_unit_own_strat: "none" });
  const wClosed = R.worldOf(closed);
  check("strategy NONE: the plan page's grant reads none",
        R.grantAtPage(wClosed, personOf(closed, custKey), "u_plan", UNIT) === "none");
  check("strategy NONE: mayArrange follows the pane out",
        R.mayArrange(wClosed, personOf(closed, custKey), UNIT) === false);
  check("strategy NONE: reporting is untouched",
        R.grantAtPage(wClosed, personOf(closed, custKey), "u_report", UNIT) === "edit");
  v = fromStored(closed, custKey, function (s) {
    s.units[UNIT].items[0].measures[0].actual = "999";
    s.units[UNIT].items[0].measures[0].progress = 12;
  });
  check("strategy NONE: the custodian still reports figures", v.ok, v.refusals.join(" / "));

  /* The function side answers the same way through its own half. */
  const FN = SEED.functionKeys.filter(function (k) {
    return (SEED.functions[k] || {}).custodian && !(SEED.functions[k] || {}).format;
  })[0];
  const fnCust = (SEED.functions[FN] || {}).custodian;
  check("the seed still has a capability-function custodian to test with", !!fnCust,
        "no function with a custodian — these assertions measure nothing");
  if (fnCust) {
    v = fromStored(SEED, fnCust, function (s) {
      s.group.capabilities.filter(function (c) { return c.fn === FN; })[0]
        .def = "Rewritten by the function's custodian";
    });
    check("a function custodian may not rewrite a capability by default", !v.ok, "was ALLOWED");
    const fnOpened = withAccess("custodian", { a_fn_own_strat: "edit" });
    v = fromStored(fnOpened, fnCust, function (s) {
      s.group.capabilities.filter(function (c) { return c.fn === FN; })[0]
        .def = "Rewritten under an opened strategy grant";
    });
    check("strategy edit OPENED on the function half: now they may", v.ok, v.refusals.join(" / "));
  }

  /* The download is a pure rule with no server half — asserted here so the
     one definition is proven where every other rule is (§117). */
  const wSeed = R.worldOf(SEED);
  check("download: the unit's custodian may", R.mayDownloadPlan(wSeed, personOf(SEED, custKey), UNIT) === true);
  check("download: the unit's owner may", R.mayDownloadPlan(wSeed, personOf(SEED, headKey), UNIT) === true);
  check("download: the office may", R.mayDownloadPlan(wSeed, personOf(SEED, "smo"), UNIT) === true);
  if (fnCust) {
    const fnHead = (SEED.functions[FN] || {}).head;
    check("download: a function's head may, for their function",
          R.mayDownloadPlan(wSeed, personOf(SEED, fnHead), "fn:" + FN) === true);
  }
  const nobody = { key: "smp_test_nobody", unit: UNIT };
  check("download: somebody holding nothing may not",
        R.mayDownloadPlan(wSeed, nobody, UNIT) === false);
  check("download: strategy at none takes it away",
        R.mayDownloadPlan(wClosed, personOf(closed, custKey), UNIT) === false);
})();

console.log("\n16 · fill the gaps (§145, spec 023)");
/* The third grant state: a fill-holder writes only where the plan holds
   nothing, the write carries a pending mark, and the office confirms.

   PROVED ABLE TO FAIL (§94.5): every ALLOWED case below refuses on the
   pre-§145 build — the stored "fill" grant ranks as nothing there, so the
   classifier lands the change on unitPlan and the verdict says office-only.
   The refused cases are each one rule-flip from passing: drop the pend mark
   requirement and case 3 goes green, drop the blank(stored) requirement and
   case 4 does. */
(function () {
  function withAccess(role, patch) {
    const s = clone(SEED);
    s.access = Object.assign({}, s.access,
      { [role]: Object.assign({}, (s.access || {})[role], patch) });
    return s;
  }
  function fromStored(stored, who, mutate) {
    const inc = clone(stored); mutate(inc);
    return A.authorize(stored, inc, personOf(stored, who));
  }
  const MARK = { by: "somebody", at: "2026-08-27" };

  /* A stored world whose plan has real gaps, under the fill grant. */
  function gappy() {
    const s = withAccess("custodian", { a_unit_own_strat: "fill" });
    const u = s.units[UNIT];
    u.aspiration = "";
    u.items[0].measures[0].compile = "";
    u.items[0].tactics[0].owner = "";
    u.items[0].tactics[0].collaborators = [];
    u.items[0].tactics[0].q1 = 0; u.items[0].tactics[0].q2 = 0;
    u.items[0].tactics[0].q3 = 0; u.items[0].tactics[0].q4 = 0;
    return s;
  }

  /* 1 · a fill: blank → value + mark, on the fill grant. */
  let s = gappy();
  let v = fromStored(s, custKey, function (i) {
    const m = i.units[UNIT].items[0].measures[0];
    m.compile = "Latest"; m.pend = { compile: MARK };
  });
  check("FILL: a blank compile filled with the mark is the custodian's", v.ok, v.refusals.join(" / "));

  /* 2 · the same save with the grant at its shipped default refuses. */
  s = gappy(); s.access = clone(SEED.access || {});
  v = fromStored(s, custKey, function (i) {
    const m = i.units[UNIT].items[0].measures[0];
    m.compile = "Latest"; m.pend = { compile: MARK };
  });
  check("FILL: the same save without the fill grant refuses", !v.ok, "was ALLOWED");

  /* 3 · a fill WITHOUT the mark is an ordinary plan write — office-only. */
  s = gappy();
  v = fromStored(s, custKey, function (i) {
    i.units[UNIT].items[0].measures[0].compile = "Latest";
  });
  check("FILL: writing the value without the pending mark refuses", !v.ok, "was ALLOWED");

  /* 4 · a settled value is never the fill grant's, mark or no mark. */
  s = gappy();
  v = fromStored(s, custKey, function (i) {
    const m = i.units[UNIT].items[0].measures[0];
    m.target = "999"; m.pend = { target: MARK };
  });
  check("FILL: overwriting a settled target refuses, even wearing the mark", !v.ok, "was ALLOWED");

  /* 5 · amending while pending stays the fill grant's; 6 · so does the undo. */
  function pending() {
    const s2 = gappy();
    const m = s2.units[UNIT].items[0].measures[0];
    m.compile = "Latest"; m.pend = { compile: MARK };
    return s2;
  }
  s = pending();
  v = fromStored(s, custKey, function (i) {
    i.units[UNIT].items[0].measures[0].compile = "Average";
  });
  check("AMEND: a pending value corrected by the filler is allowed", v.ok, v.refusals.join(" / "));
  s = pending();
  v = fromStored(s, custKey, function (i) {
    const m = i.units[UNIT].items[0].measures[0];
    m.compile = ""; delete m.pend;
  });
  check("UNFILL: the filler's own undo is allowed", v.ok, v.refusals.join(" / "));

  /* 7 · confirming is the office's alone; 8 · and the office may. */
  s = pending();
  v = fromStored(s, custKey, function (i) {
    delete i.units[UNIT].items[0].measures[0].pend;
  });
  check("CONFIRM: the fill-holder may not lift their own mark", !v.ok, "was ALLOWED");
  s = pending();
  v = fromStored(s, "smo", function (i) {
    delete i.units[UNIT].items[0].measures[0].pend;
  });
  check("CONFIRM: the office lifts the mark", v.ok, v.refusals.join(" / "));
  s = pending();
  v = fromStored(s, "smo", function (i) {
    const m = i.units[UNIT].items[0].measures[0];
    m.compile = "Sum"; delete m.pend;
  });
  check("CONFIRM: the office correcting the value confirms in the same act", v.ok, v.refusals.join(" / "));

  /* 9 · the aspiration is a unit-level gap. */
  s = gappy();
  v = fromStored(s, custKey, function (i) {
    i.units[UNIT].aspiration = "Filled by the custodian";
    i.units[UNIT].pend = { aspiration: MARK };
  });
  check("FILL: an empty aspiration is fillable", v.ok, v.refusals.join(" / "));

  /* 10 · quarters move as ONE mark, and only from nothing. */
  s = gappy();
  v = fromStored(s, custKey, function (i) {
    const t = i.units[UNIT].items[0].tactics[0];
    t.q2 = 1; t.pend = { quarters: MARK, owner: MARK };
    t.owner = "Somebody Named";
  });
  check("FILL: a no-quarter tactic takes its quarters and owner", v.ok, v.refusals.join(" / "));
  s = withAccess("custodian", { a_unit_own_strat: "fill" });
  v = fromStored(s, custKey, function (i) {
    const t = i.units[UNIT].items[0].tactics.filter(function (x) {
      return x.q1 || x.q2 || x.q3 || x.q4; })[0];
    t.q4 = t.q4 ? 0 : 1; t.pend = { quarters: MARK };
  });
  check("FILL: a tactic that already names a quarter refuses more, mark or not",
        !v.ok, "was ALLOWED");

  /* 11 · the capability side, through the fn half. */
  const FN2 = SEED.functionKeys.filter(function (k) {
    return (SEED.functions[k] || {}).custodian && !(SEED.functions[k] || {}).format;
  })[0];
  const fnCust2 = FN2 && (SEED.functions[FN2] || {}).custodian;
  check("the seed still holds a capability-function custodian for §16", !!fnCust2);
  if (fnCust2) {
    const sf = withAccess("custodian", { a_fn_own_strat: "fill" });
    const cap = sf.group.capabilities.filter(function (c) { return c.fn === FN2; })[0];
    cap.projects[0].start = "";
    v = fromStored(sf, fnCust2, function (i) {
      const p = i.group.capabilities.filter(function (c) { return c.fn === FN2; })[0].projects[0];
      p.start = "Jan 2026"; p.pend = { start: MARK };
    });
    check("FILL: a project's missing start date, on the function half", v.ok, v.refusals.join(" / "));
    v = fromStored(sf, fnCust2, function (i) {
      const p = i.group.capabilities.filter(function (c) { return c.fn === FN2; })[0].projects[0];
      p.name = "Renamed by a fill grant"; p.pend = { start: MARK };
    });
    check("FILL: the same grant never renames a project", !v.ok, "was ALLOWED");
  }

  /* 13 · collaborators join the fillable list (§145.10) — an empty list is
     a gap, an existing one never opens, and A PENDING NAME CONFERS NO
     REPORTING RIGHT until the office confirms: being named is what lets a
     Contributor report the line (§50.2), so this is the half that makes
     the reversal safe. */
  s = gappy();
  v = fromStored(s, custKey, function (i) {
    const t = i.units[UNIT].items[0].tactics[0];
    t.collaborators = ["Somebody Supporting"]; t.pend = { collaborators: MARK };
  });
  check("FILL: an empty collaborators list is fillable", v.ok, v.refusals.join(" / "));
  s = gappy();
  v = fromStored(s, custKey, function (i) {
    const t = i.units[UNIT].items[0].tactics.filter(function (x) {
      return (x.collaborators || []).length; })[0];
    if (!t) { i.__skip = true; return; }
    t.collaborators = t.collaborators.concat("Somebody Extra");
    t.pend = Object.assign({}, t.pend, { collaborators: MARK });
  });
  check("FILL: adding to an EXISTING collaborators list refuses, mark or not",
        !v.ok, "was ALLOWED");
  (function () {
    const t = { owner: "", collaborators: ["Test Person"],
                pend: { collaborators: MARK } };
    const who = { key: "tp", name: "Test Person" };
    check("RIGHTS: a pending collaborator is not namedOn the line",
          R.namedOn(t, who) === false);
    delete t.pend;
    check("RIGHTS: the same name counts the moment the mark lifts",
          R.namedOn(t, who) === true);
    const t2 = { owner: "Test Person", pend: { owner: MARK } };
    check("RIGHTS: a pending owner is not namedOn either",
          R.namedOn(t2, who) === false);
  })();

  /* 14 · u_anal never fills: a strategy page with no fillable field must
     not draw the fill pen — a pen that opens nothing is §61's trap. */
  check("mayFillPage: never the SWOT page",
        R.mayFillPage(R.worldOf(gappy()), personOf(gappy(), custKey), "u_anal", UNIT) === false);

  /* 12 · the rule's own ends. */
  const wf = R.worldOf(gappy());
  check("mayFillPage: the fill grant answers for the holder",
        R.mayFillPage(wf, personOf(gappy(), custKey), "u_plan", UNIT) === true);
  check("mayFillPage: never for the office (their writes settle)",
        R.mayFillPage(wf, personOf(gappy(), "smo"), "u_plan", UNIT) === false);
  check("mayFillPage: never off a strategy page",
        R.mayFillPage(wf, personOf(gappy(), custKey), "u_report", UNIT) === false);
  const sOther = withAccess("custodian", { a_unit_own_strat: "fill" });
  check("mayFillPage: never a unit this sign-in does not hold",
        R.mayFillPage(R.worldOf(sOther), personOf(sOther, custKey), "u_plan", OTHER) === false);
})();

/* ── 17 · A CUSTODIAN PER PROJECT — TWO ROLES, NOT ONE (§147.7) ────
   Islam: "a project owner is a role", "we need to add another role which is
   pillar owner ... same pattern", and "contributor is someone whose name is
   on the project anywhere but that doesn't mean that he is a project owner".

   TWO CONDITIONS before anybody reports (his words): the role's Reporting
   cell opened to edit on Roles & access, AND being named the Owner on the
   thing. Contributors — a milestone's owner, a stakeholder — report NOTHING
   until the Contributor row is opened, and then only the rows that name
   them. None of the three ever submits.

   EVERY allows() ALSO ASSERTS THE FIXTURE CHANGED SOMETHING (§94.5): the
   no-op assertion is this suite's own recorded fault. */
console.log("\n17 · a custodian per project — two roles (§147.7)");
(function () {
  const FN = "it";
  const T = "fn:" + FN;
  const capOf = function (s) {
    return s.group.capabilities.filter(function (c) { return c.fn === FN; })[0];
  };
  /* The base: three people the plan names — an owner of project 1, the owner
     of one of project 1's milestones, and a stakeholder on project 1 — and
     the two owner rows opened, Islam's condition 1. DELIBERATELY UNATTACHED
     (no p.unit, no p.fn): his two conditions do not include the register
     attachment, and this is the exact shape of the Ahmed test that started
     §147.7. The contributor row is left at its default. */
  const base = clone(SEED);
  base.access.powner = Object.assign({}, base.access.powner, { a_fn_own: "edit" });
  base.people.push({ key: "t147_own",   name: "Project Owner 147",   active: true });
  base.people.push({ key: "t147_mile",  name: "Milestone Owner 147", active: true });
  base.people.push({ key: "t147_stake", name: "Stakeholder 147",     active: true });
  const cap = capOf(base);
  cap.projects[0].owner = "Project Owner 147";
  cap.projects[0].milestones[0].owner = "Milestone Owner 147";
  cap.projects[0].stakeholders = (cap.projects[0].stakeholders || []).concat("Stakeholder 147");
  const wb = R.worldOf(base);

  check("named Owner of a project derives PROJECT OWNER, unattached included",
        JSON.stringify(R.personRoles(wb, personOf(base, "t147_own"))) ===
        JSON.stringify([{ role: "powner", at: T }]),
        JSON.stringify(R.personRoles(wb, personOf(base, "t147_own"))));
  check("a project owner is bounded — never the whole function",
        R.onlyOwnLines(wb, personOf(base, "t147_own"), "fn", T) === true);
  check("the two owner roles are never grantable by hand",
        R.isOwnLinesRole("powner") && R.isOwnLinesRole("plowner"));

  const same = function (a, b) { return JSON.stringify(a) === JSON.stringify(b); };
  const run = function (stored, who, mutate) {
    const inc = clone(stored); mutate(inc);
    return { v: A.authorize(stored, inc, personOf(stored, who)),
             moved: !same(stored, inc) };
  };
  const ok = function (name, r) {
    check(name + " — the fixture actually changed something", r.moved);
    check(name, r.v.ok, r.v.refusals.join(" / "));
  };
  const not = function (name, r) {
    check(name + " — the fixture actually changed something", r.moved);
    check(name, !r.v.ok, "was ALLOWED — " +
      JSON.stringify(r.v.changes.map(function (c) { return c.kind + ":" + c.what; })));
  };

  /* The custodian regressions §147.3 fixed stay fixed. */
  const fnCust = (SEED.functions[FN] || {}).custodian;
  if (fnCust && personOf(SEED, fnCust)) {
    ok("the custodian reports a deliverable (the §147.3 drift, fixed)",
       run(SEED, fnCust, function (s) {
         capOf(s).projects[0].deliverables[0].status = "todo"; }));
    ok("the custodian gives an In-progress milestone its required %",
       run(SEED, fnCust, function (s) {
         const m = capOf(s).projects[0].milestones[2]; m.pct = 75; }));
    ok("the custodian still submits the function",
       run(SEED, fnCust, function (s) {
         s.review.submitted = Object.assign({}, s.review.submitted); s.review.submitted[T] = true; }));
  }

  /* THE PROJECT OWNER: their project, whole — and nothing beside it. */
  ok("the project owner reports their own project's deliverable",
     run(base, "t147_own", function (s) {
       capOf(s).projects[0].deliverables[0].status = "todo"; }));
  ok("the project owner reports their own project's milestone, % included",
     run(base, "t147_own", function (s) {
       const m = capOf(s).projects[0].milestones[2]; m.pct = 80; m.note = "on it"; }));
  ok("the project owner reports their own project's outcome, note included",
     run(base, "t147_own", function (s) {
       const o = capOf(s).projects[0].outcomes[0]; o.actual = "3"; o.note = "up"; }));
  not("the project owner may NOT report the project beside theirs",
      run(base, "t147_own", function (s) {
        capOf(s).projects[1].deliverables[0].status = "done"; }));
  not("the project owner may NOT enter the capability's own key objectives",
      run(base, "t147_own", function (s) {
        const k = capOf(s).keyObjectives[0]; if (k) k.actual = "99"; else s.group.capabilities[0].name = "x"; }));
  not("the project owner may NOT submit the function",
      run(base, "t147_own", function (s) {
        s.review.submitted = Object.assign({}, s.review.submitted); s.review.submitted[T] = true; }));
  not("the project owner may NOT write the function's cycle note",
      run(base, "t147_own", function (s) {
        s.review.note = Object.assign({}, s.review.note); s.review.note[T] = "our quarter"; }));
  not("the project owner may NOT edit the project's plan",
      run(base, "t147_own", function (s) {
        capOf(s).projects[0].name = "Renamed by its owner"; }));

  /* CONDITION 1 WITHOUT CONDITION 2, AND THE REVERSE. */
  const unopened = clone(base);
  delete unopened.access.powner;
  not("named, but the Project owner row still at its default: nothing",
      run(unopened, "t147_own", function (s) {
        capOf(s).projects[0].deliverables[0].status = "todo"; }));
  const unnamed = clone(base);
  capOf(unnamed).projects[0].owner = "Somebody Else Entirely";
  not("the row opened, but not named on any project: nothing",
      run(unnamed, "t147_own", function (s) {
        capOf(s).projects[0].deliverables[0].status = "todo"; }));

  /* CONTRIBUTORS REPORT NOTHING FOR NOW (Islam) — the row ships at view. */
  check("a milestone's owner derives Contributor, not Project owner",
        R.personRoleKeys(wb, personOf(base, "t147_mile")).join() === "contrib",
        R.personRoleKeys(wb, personOf(base, "t147_mile")).join());
  check("a stakeholder derives Contributor too",
        R.personRoleKeys(wb, personOf(base, "t147_stake")).join() === "contrib",
        R.personRoleKeys(wb, personOf(base, "t147_stake")).join());
  not("with the shipped default a milestone owner reports nothing",
      run(base, "t147_mile", function (s) {
        const m = capOf(s).projects[0].milestones[0]; m.status = "todo"; }));

  /* ...AND THE FUTURE ISLAM ASKED TO BE READY: contributor edit opened. */
  const cOpen = clone(base);
  cOpen.access.contrib = Object.assign({}, cOpen.access.contrib, { a_fn_own: "edit" });
  ok("contrib opened: the milestone owner reports THEIR milestone",
     run(cOpen, "t147_mile", function (s) {
       const m = capOf(s).projects[0].milestones[0]; m.status = "wip"; m.pct = 10; }));
  not("...and still not the deliverable beside it",
      run(cOpen, "t147_mile", function (s) {
        capOf(s).projects[0].deliverables[0].status = "todo"; }));
  ok("contrib opened: the stakeholder reaches their project's rows",
     run(cOpen, "t147_stake", function (s) {
       capOf(s).projects[0].deliverables[0].status = "todo"; }));
  not("...and not the project beside it",
      run(cOpen, "t147_stake", function (s) {
        capOf(s).projects[1].deliverables[0].status = "done"; }));

  /* THE PILLAR OWNER — same pattern, on a unit's pillar. */
  const pb = clone(SEED);
  pb.access.plowner = Object.assign({}, pb.access.plowner, { a_unit_own: "edit" });
  pb.people.push({ key: "t147_pill", name: "Pillar Owner 147", active: true });
  pb.units[UNIT].items[0].owner = "Pillar Owner 147";
  const wpb = R.worldOf(pb);
  check("named Owner of a unit's pillar derives PILLAR OWNER",
        JSON.stringify(R.personRoles(wpb, personOf(pb, "t147_pill"))) ===
        JSON.stringify([{ role: "plowner", at: UNIT }]),
        JSON.stringify(R.personRoles(wpb, personOf(pb, "t147_pill"))));
  ok("the pillar owner reports a measure of their pillar",
     run(pb, "t147_pill", function (s) {
       const m = s.units[UNIT].items[0].measures[0]; m.actual = "7"; m.note = "up"; }));
  ok("the pillar owner reports a tactic of their pillar",
     run(pb, "t147_pill", function (s) {
       const x = s.units[UNIT].items[0].tactics[0]; if (x) { x.status = "Done"; } else { s.units[UNIT].items[0].measures[0].note = "n2"; } }));
  not("the pillar owner may NOT report the pillar beside theirs",
      run(pb, "t147_pill", function (s) {
        const q = s.units[UNIT].items[1];
        const m = (q.measures || [])[0] || (q.tactics || [])[0];
        if (m.actual !== undefined) m.actual = "9"; else m.status = "Done"; }));
  not("the pillar owner may NOT submit the unit",
      run(pb, "t147_pill", function (s) {
        s.review.submitted = Object.assign({}, s.review.submitted); s.review.submitted[UNIT] = true; }));
  not("named, but the Pillar owner row still at its default: nothing",
      run((function () { const s2 = clone(pb); delete s2.access.plowner; return s2; })(),
          "t147_pill", function (s) {
            s.units[UNIT].items[0].measures[0].actual = "7"; }));

  /* ...AND ON A PILLARS FUNCTION, where the old code skipped every fn:
     target. Merchandising plans in pillars (spec 010). */
  const MR = "merchandising";
  if ((SEED.functions[MR] || {}).format === "pillars" &&
      (SEED.functions[MR].items || []).length) {
    const fb = clone(SEED);
    fb.access.plowner = Object.assign({}, fb.access.plowner, { a_fn_own: "edit" });
    fb.people.push({ key: "t147_fnp", name: "Fn Pillar Owner 147", active: true });
    fb.functions[MR].items[0].owner = "Fn Pillar Owner 147";
    check("named Owner of a pillars function's pillar derives PILLAR OWNER there",
          JSON.stringify(R.personRoles(R.worldOf(fb), personOf(fb, "t147_fnp"))) ===
          JSON.stringify([{ role: "plowner", at: "fn:" + MR }]),
          JSON.stringify(R.personRoles(R.worldOf(fb), personOf(fb, "t147_fnp"))));
    ok("...and reports a measure of that pillar",
       run(fb, "t147_fnp", function (s) {
         const m = s.functions[MR].items[0].measures[0]; m.actual = "5"; m.note = "up"; }));
    if ((fb.functions[MR].items || []).length > 1) {
      not("...and not the pillar beside it",
          run(fb, "t147_fnp", function (s) {
            const q = s.functions[MR].items[1];
            const m = (q.measures || [])[0] || (q.tactics || [])[0];
            if (m.actual !== undefined) m.actual = "9"; else m.status = "Done"; }));
    }
    not("...and never submits the function",
        run(fb, "t147_fnp", function (s) {
          s.review.submitted = Object.assign({}, s.review.submitted);
          s.review.submitted["fn:" + MR] = true; }));
  } else {
    check("the pillars function fixture exists in the seed", false,
          "merchandising is not a pillars function with items");
  }

  /* THE CUSTODIAN WHO ALSO OWNS A PROJECT LOSES NOTHING (§147.7, asked by
     Islam): the most generous role wins (§33), so the powner chip beside the
     custodian's narrows nothing — whole function, Submit and all. And the
     roles stay separable: with the CUSTODIAN row closed and the Project
     owner row open, the same person keeps their own project and loses the
     rest — bounded reach engaging only when the bounded role is the only way
     in. Guarded here so no later edit can turn the union into a narrowing. */
  const both = clone(SEED);
  const custKey2 = SEED.functions[FN].custodian;
  const custName2 = SEED.people.filter(function (x) { return x.key === custKey2; })[0].name;
  capOf(both).projects[0].owner = custName2;
  check("custodian + project owner: not read as bounded",
        R.onlyOwnLines(R.worldOf(both), personOf(both, custKey2), "fn", T) === false);
  ok("custodian + project owner: still reports the OTHER project",
     run(both, custKey2, function (s) {
       capOf(s).projects[1].deliverables[0].status = "done"; }));
  ok("custodian + project owner: still submits the function",
     run(both, custKey2, function (s) {
       s.review.submitted = Object.assign({}, s.review.submitted); s.review.submitted[T] = true; }));
  const narrowed = clone(both);
  narrowed.access.custodian = Object.assign({}, narrowed.access.custodian, { a_fn_own: "view" });
  narrowed.access.powner = Object.assign({}, narrowed.access.powner, { a_fn_own: "edit" });
  ok("custodian row closed, owner row open: their project still reports",
     run(narrowed, custKey2, function (s) {
       capOf(s).projects[0].deliverables[0].status = "todo"; }));
  not("...and the rest of the function no longer does",
      run(narrowed, custKey2, function (s) {
        capOf(s).projects[1].deliverables[0].status = "done"; }));

  /* A retired owner derives nothing (§110.4). */
  const retired = clone(base);
  personOf(retired, "t147_own").active = false;
  check("a retired project owner derives nothing",
        R.personRoles(R.worldOf(retired), personOf(retired, "t147_own")).length === 0);
})();

console.log("\n18 · a bounded role fills only what it holds (§177)");
/* §177 gave a milestone's owner and due date and an outcome's target to the
   fill grant, and narrowed that grant to the ROWS a bounded role holds.
   Islam: "his project has missing items. he should be able to fill the
   missing items" and "the fill grant should be for his project only he is
   not a cutodian."

   PROVED ABLE TO FAIL (§94.5): on the pre-§177 rules every ALLOWED case here
   refuses -- an outcome and a milestone are not gap kinds there, so the pass
   never classifies the change and it lands on capPlan, which is office-only.
   And the two REFUSED cases go green the moment mayFillRow() is replaced by
   mayFillPage(), which is exactly the narrowing under test. */
(function () {
  const FN = "it";
  const T = "fn:" + FN;
  const MARK = { by: "t176_own", at: "2026-08-29" };
  const capOf = function (st) {
    return st.group.capabilities.filter(function (c) { return c.fn === FN; })[0];
  };
  const fromStored = function (stored, who, mutate) {
    const inc = clone(stored); mutate(inc);
    return A.authorize(stored, inc, personOf(stored, who));
  };

  /* A project owner who holds NOTHING else, over a function with two
     projects, the Strategy half opened to `fill` -- Islam's own shape. */
  const base = clone(SEED);
  base.access.powner = Object.assign({}, base.access.powner,
    { a_fn_own_strat: "fill", a_fn_own: "edit" });
  base.people.push({ key: "t176_own", name: "Bounded Filler 176", active: true });
  const cap = capOf(base);
  if (!cap || (cap.projects || []).length < 2) {
    check("§177: the fixture needs a function with two projects", false, FN);
  } else {
    const mine = cap.projects[0], theirs = cap.projects[1];
    mine.owner = "Bounded Filler 176";
    mine.milestones[0].finish = "";
    mine.milestones[0].owner = "";
    if ((mine.outcomes || []).length) mine.outcomes[0].target = "";
    theirs.milestones[0].finish = "";
    if ((cap.keyObjectives || []).length) cap.keyObjectives[0].compile = "";

    const w = R.worldOf(base);
    check("the fixture's filler holds project owner and nothing else",
          JSON.stringify(R.personRoles(w, personOf(base, "t176_own"))) ===
          JSON.stringify([{ role: "powner", at: T }]),
          JSON.stringify(R.personRoles(w, personOf(base, "t176_own"))));

    /* 1 · his own project's milestone: the whole point of §176. */
    let v = fromStored(base, "t176_own", function (i) {
      const m = capOf(i).projects[0].milestones[0];
      m.finish = "Jul 26"; m.pend = { finish: MARK };
    });
    check("FILL: a blank due date on HIS project is his", v.ok, v.refusals.join(" / "));

    v = fromStored(base, "t176_own", function (i) {
      const m = capOf(i).projects[0].milestones[0];
      m.owner = "Somebody Else"; m.pend = { owner: MARK };
    });
    check("FILL: a blank milestone owner on HIS project is his", v.ok, v.refusals.join(" / "));

    if ((mine.outcomes || []).length) {
      v = fromStored(base, "t176_own", function (i) {
        const o = capOf(i).projects[0].outcomes[0];
        o.target = "80%"; o.pend = { target: MARK };
      });
      check("FILL: a blank outcome target on HIS project is his", v.ok, v.refusals.join(" / "));
    }

    /* 2 · the project BESIDE it is not. This is the narrowing. */
    v = fromStored(base, "t176_own", function (i) {
      const m = capOf(i).projects[1].milestones[0];
      m.finish = "Jul 26"; m.pend = { finish: MARK };
    });
    check("REFUSED: the same fill on the project beside it", !v.ok,
          "was ALLOWED — " + JSON.stringify(v.changes.map(function (c) { return c.kind; })));

    /* 3 · nor a gap that sits inside no project at all. */
    if ((cap.keyObjectives || []).length) {
      v = fromStored(base, "t176_own", function (i) {
        const k = capOf(i).keyObjectives[0];
        k.compile = "Latest"; k.pend = { compile: MARK };
      });
      check("REFUSED: the capability's own key objective", !v.ok,
            "was ALLOWED — " + JSON.stringify(v.changes.map(function (c) { return c.kind; })));
    }

    /* 4 · and confirming is never the filler's, on his own project either. */
    const pending = clone(base);
    (function () {
      const m = capOf(pending).projects[0].milestones[0];
      m.finish = "Jul 26"; m.pend = { finish: MARK };
    })();
    v = fromStored(pending, "t176_own", function (i) {
      const m = capOf(i).projects[0].milestones[0];
      delete m.pend;
    });
    check("REFUSED: the filler confirming their own fill", !v.ok,
          "was ALLOWED — " + JSON.stringify(v.changes.map(function (c) { return c.kind; })));

    /* 5 · THE UNBOUNDED ROLE IS UNTOUCHED (§94.2, the other end): a check
       that only proves a door shut can be satisfied by shutting every door. */
    const fnCust = (SEED.functions[FN] || {}).custodian;
    if (fnCust && personOf(base, fnCust)) {
      const open = clone(base);
      open.access.custodian = Object.assign({}, open.access.custodian,
        { a_fn_own_strat: "fill" });
      v = fromStored(open, fnCust, function (i) {
        const m = capOf(i).projects[1].milestones[0];
        m.finish = "Jul 26"; m.pend = { finish: MARK };
      });
      check("a function custodian with fill still reaches every project", v.ok,
            v.refusals.join(" / "));
      /* And the office authors it outright, with no mark at all. */
      v = fromStored(base, "smo", function (i) {
        capOf(i).projects[1].milestones[0].finish = "Jul 26";
      });
      check("the office writes a due date with no mark and it settles", v.ok,
            v.refusals.join(" / "));
    }
  }
})();

console.log("\n19 · a date the platform cannot read is a gap (§184)");
/* Islam, on the CX strategy custodian: "they lost all data they inputed and
   the dates showed waiting confirmation and I didn't get them as the SMO."

   THE REFUSAL WAS CORRECT AND THE LOSS WAS EVERYTHING AROUND IT. He filled
   three empty milestone due dates -- accepted, marked pending -- and touched
   a fourth whose stored value was `30/09/2026`, a value `monthsOf()` cannot
   read at all. Non-blank is not a gap, so correcting it classified as
   AUTHORING and the whole save was refused; the whole graph posts together,
   so the three good fills went down with it, and the only control on the
   banner destroyed them.

   Two halves are asserted here, and BOTH ENDS of each (§113.8):
     · an unreadable date IS a gap, so filling it is accepted...
     · ...while a date the platform CAN read is still the office's, or §184
       has quietly handed every date to every filler.

   PROVED ABLE TO FAIL (§94.5): put `gapBlank` back inside `R.gapEmpty` and
   the first case refuses -- and the third, which is the one that reproduces
   the report: three good fills refused because a fourth row was in the same
   post. */
(function () {
  const FN = "it";
  const T = "fn:" + FN;
  const MARK = { by: "t184_fill", at: "2026-08-30" };
  const capOf = function (st) {
    return st.group.capabilities.filter(function (c) { return c.fn === FN; })[0];
  };
  const fromStored = function (stored, who, mutate) {
    const inc = clone(stored); mutate(inc);
    return A.authorize(stored, inc, personOf(stored, who));
  };

  /* The reader itself, before anything is asked of the authoriser. */
  check("§184: `30/09/2026` is not a date the platform can read",
        R.whenReadable("30/09/2026") === false);
  check("§184: `Jul 26` is", R.whenReadable("Jul 26") === true);
  check("§184: a bare quarter is, with no cycle to resolve it",
        R.whenReadable("Q3") === true && R.whenMonths("Q3", false, null) === null);
  check("§184: an unreadable due date is a GAP",
        R.gapEmpty("finish", { finish: "30/09/2026" }) === true);
  check("§184: a readable one is not",
        R.gapEmpty("finish", { finish: "Jul 26" }) === false);
  check("§184: and the rule is the FIELD's, not every field's — an unreadable " +
        "TARGET is still a target somebody wrote",
        R.gapEmpty("target", { target: "30/09/2026" }) === false);

  const base = clone(SEED);
  base.access.custodian = Object.assign({}, base.access.custodian,
    { a_fn_own_strat: "fill" });
  base.functions[FN].custodian = "t184_fill";
  base.people.push({ key: "t184_fill", name: "Filler 184", active: true });
  const cap = capOf(base);
  if (!cap || !(cap.projects || []).length || (cap.projects[0].milestones || []).length < 3) {
    check("§184: the fixture needs a project with three milestones", false, FN);
  } else {
    /* THE STATE IS MADE, because no seed row carries a bad date (§94.2): one
       unreadable, two empty — the CX shape exactly. */
    const ms = cap.projects[0].milestones;
    ms[0].finish = "30/09/2026";
    ms[1].finish = "";
    ms[2].finish = "";

    let v = fromStored(base, "t184_fill", function (i) {
      const m = capOf(i).projects[0].milestones[0];
      m.finish = "Sep 26"; m.pend = { finish: MARK };
    });
    check("FILL: correcting a due date the platform cannot read", v.ok,
          v.refusals.join(" / "));

    v = fromStored(base, "t184_fill", function (i) {
      const m = capOf(i).projects[0].milestones;
      m[0].finish = "Sep 26"; m[0].pend = { finish: MARK };
      m[1].finish = "Jul 26"; m[1].pend = { finish: MARK };
      m[2].finish = "Aug 26"; m[2].pend = { finish: MARK };
    });
    check("FILL: all three in one save — the report, reproduced", v.ok,
          v.refusals.join(" / "));

    /* THE OTHER END. A date that reads is a plan decision and stays one. */
    const good = clone(base);
    capOf(good).projects[0].milestones[0].finish = "Nov 26";
    v = fromStored(good, "t184_fill", function (i) {
      const m = capOf(i).projects[0].milestones[0];
      m.finish = "Dec 27"; m.pend = { finish: MARK };
    });
    check("REFUSED: correcting a due date that READS is still the office's", !v.ok,
          "was ALLOWED — " + JSON.stringify(v.changes.map(function (c) { return c.kind; })));
  }
})();

console.log("\n20 · a refusal names the rows it refused (§184)");
/* THE SECOND HALF OF THE SAME FAULT. Even with §184's date rule, some row
   somewhere will be genuinely refused — and until now the verdict said only
   WHY, so the platform had nothing to put back and the only way past a
   refusal was to discard every unsaved change on the page.

   What is asserted is the ADDRESS: target, row id, field, and the value the
   row HELD — enough for the client to revert exactly those and re-save the
   rest. And `undoable`, the server's own answer to "is every refusal
   addressable", because a client working that out for itself would be a
   second copy of the rule (§42).

   BOTH ENDS: a refusal that CAN be put back, and one that cannot — a change
   to which rows exist has no row address, and saying so is what stops the
   client offering a button that would not work. */
(function () {
  const FN = "it";
  const capOf = function (st) {
    return st.group.capabilities.filter(function (c) { return c.fn === FN; })[0];
  };
  const base = clone(SEED);
  base.functions[FN].custodian = "t184_row";
  base.people.push({ key: "t184_row", name: "Row Namer 184", active: true });
  const run = function (mutate) {
    const inc = clone(base); mutate(inc);
    return A.authorize(base, inc, personOf(base, "t184_row"));
  };

  /* A custodian correcting a milestone's due date: plan, and refused. */
  let v = run(function (i) { capOf(i).projects[0].milestones[0].finish = "Dec 27"; });
  check("the plan refusal happens at all", !v.ok);
  const hit = (v.refused || []).filter(function (r) {
    return (r.rows || []).some(function (x) { return x.field === "finish"; }); })[0];
  check("...and it names the row and the field", !!hit,
        JSON.stringify(v.refused));
  if (hit) {
    const row = hit.rows.filter(function (x) { return x.field === "finish"; })[0];
    check("...with the id the plan actually holds",
          row.id === capOf(base).projects[0].milestones[0].id, row.id);
    check("...the row's NAME, so the banner can say which line",
          row.name === capOf(base).projects[0].milestones[0].name, row.name);
    check("...and the value it HELD, which is what gets put back",
          row.from === capOf(base).projects[0].milestones[0].finish, row.from);
    check("...`had` says the key was there, so it is set and not deleted",
          row.had === true);
    check("every refusal is addressable, so the offer can be made",
          v.refused.every(function (r) { return r.rows && r.rows.length; }));
  }

  /* A project's own front matter — §179's Start and End (§184's other half). */
  v = run(function (i) { capOf(i).projects[0].start = "Jan 27"; });
  const front = (v.refused || []).filter(function (r) {
    return (r.rows || []).some(function (x) { return x.field === "start"; }); })[0];
  check("a project's Start is named too", !!front, JSON.stringify(v.refused));
  if (front) {
    const row = front.rows.filter(function (x) { return x.field === "start"; })[0];
    check("...addressed by the PROJECT's id", row.id === capOf(base).projects[0].id, row.id);
  }

  /* A field the stored row did not have at all: `had` false, so the client
     DELETES rather than writing null — a null where nothing was is a change
     of its own and would be refused a second time. */
  const bare = clone(base);
  delete capOf(bare).projects[0].milestones[0].owner;
  v = (function () {
    const inc = clone(bare);
    capOf(inc).projects[0].milestones[0].owner = "Somebody";
    return A.authorize(bare, inc, personOf(bare, "t184_row"));
  })();
  const own = (v.refused || []).filter(function (r) {
    return (r.rows || []).some(function (x) { return x.field === "owner"; }); })[0];
  check("a field the stored row never had is marked absent, not null",
        !!own && own.rows.filter(function (x) { return x.field === "owner"; })[0].had === false,
        JSON.stringify(own && own.rows));

  /* THE OTHER END: a change with no row address says so. Removing a project
     changes WHICH rows exist, which no field revert can undo. */
  v = run(function (i) { capOf(i).projects.pop(); });
  check("removing a project is refused", !v.ok);
  check("...and is NOT addressable, so no put-back is offered",
        (v.refused || []).some(function (r) { return !r.rows || !r.rows.length; }),
        JSON.stringify(v.refused));
})();

console.log("\n21 · viewing as somebody is judged as somebody (§185)");
/* Islam: *"Hala got this error, when I view as her I didn't get it — so the
   view-as function is not showing exactly what people see."*

   THE MEASUREMENT THAT SETTLED IT, kept as an assertion: one edit, one
   screen, two answers. The whole fault is that authorisation read the
   session cookie while the page read the simulation, so the office could
   never reproduce anybody's refusal — and could write through a colleague's
   view what that colleague could never write.

   `actingFor()` can only NARROW, and these are the three answers that make
   that true. A session without the seat is judged as itself, so a forged
   `viewAs` buys nothing (§42: a switch that only hides a control is
   decoration); an unknown key is REFUSED rather than treated as somebody
   with no roles, because "no roles" is a narrowing that hides a mistake
   instead of reporting it. */
(function () {
  const FN = "it";
  const capOf = function (st) {
    return st.group.capabilities.filter(function (c) { return c.fn === FN; })[0];
  };
  const base = clone(SEED);
  base.functions[FN].custodian = "t185_hala";
  base.people.push({ key: "t185_hala", name: "Hala 185", active: true });
  const smo = personOf(base, "smo") || { key: "smo", name: "SMO" };

  /* The same edit, judged twice — the report, as an assertion. */
  const edit = function () {
    const i = clone(base);
    capOf(i).projects[0].milestones[0].finish = "Dec 27";
    return i;
  };
  const asHer = A.authorize(base, edit(), personOf(base, "t185_hala"));
  const asSMO = A.authorize(base, edit(), smo);
  check("the edit IS refused for her", !asHer.ok, asHer.refusals.join(" / "));
  check("...and accepted for the office — which is why it could not be seen",
        asSMO.ok, asSMO.refusals.join(" / "));

  /* And the rule that closes it. */
  const people = base.people;
  check("§185: no viewAs is judged as yourself",
        R.actingFor(smo, "", "super", people).person.key === "smo");
  check("§185: viewAs YOURSELF is not a simulation either",
        !R.actingFor(smo, "smo", "super", people).simulated);
  const sim = R.actingFor(smo, "t185_hala", "super", people);
  check("§185: the office viewing as her is judged as HER",
        sim.person && sim.person.key === "t185_hala" && sim.simulated === true,
        JSON.stringify(sim));
  check("§185: and authorising with that person reproduces her refusal",
        !A.authorize(base, edit(), sim.person).ok);

  /* THE OTHER END (§113.8): it must not be a way to become somebody else. */
  check("§185: a session without the seat cannot simulate at all",
        !!R.actingFor(personOf(base, "t185_hala"), "smo", "custodian", people).refuse);
  check("§185: ...and a person the register does not hold is refused, never " +
        "waved through as somebody with no roles",
        !!R.actingFor(smo, "nobody_at_all", "super", people).refuse);
  /* A forged viewAs from a session that cannot simulate is REFUSED rather
     than silently ignored: ignoring it would judge the save as the forger,
     which is wider than what they asked for and hides that they asked. */
  check("§185: the refusal is a sentence somebody can act on",
        /Only the SMO/.test(R.actingFor(personOf(base, "t185_hala"), "smo",
                                        "custodian", people).refuse));
})();

console.log("\n" + pass + " passed, " + fail + " failed");
process.exit(fail ? 1 : 0);
