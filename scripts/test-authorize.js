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

/* ── 3 · The work each role must still be able to do ────────────── */
console.log("\n3 · legitimate work is not refused");
allows(headKey, function (s) { s.units[UNIT].items[0].measures[0].actual = 42; },
  "a unit head reports their own figure");
allows(headKey, function (s) { s.units[UNIT].items[0].tactics[0].status = "On track"; },
  "a unit head sets their own tactic's status");
allows(headKey, function (s) { s.units[UNIT].aspiration = "A new aspiration"; },
  "a unit head writes their own foundation");
allows(headKey, function (s) { s.units[UNIT].swot.s = ["Something"]; },
  "a unit head writes their own SWOT");
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
    return R.personRoleKeys(R.worldOf(base), p).join() === "contrib" && base.units[p.unit];
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

/* ── 7 · A retired person can do nothing ───────────────────────── */
console.log("\n7 · a retired person");
(function () {
  const base = clone(SEED);
  base.people.forEach(function (p) { if (p.key === headKey) p.active = false; });
  const inc = clone(base); inc.units[UNIT].items[0].measures[0].actual = 3;
  const v = A.authorize(base, inc, personOf(base, headKey));
  check("a retired unit head reports nothing", !v.ok, v.refusals.join(" / "));
})();

console.log("\n" + pass + " passed, " + fail + " failed");
process.exit(fail ? 1 : 0);
