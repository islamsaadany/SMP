#!/usr/bin/env node
/* EVERY PERMISSION DECISION, MEASURED BEFORE A RULE MOVES (§595).
 *
 * `test-access-unmoved.js` answers what every person may OPEN. This answers
 * what they may DO: every reporting rule the screen and the server share
 * (`mayReportTop`, the company's seat rules, `mayReportRow`, `mayMarkDone`,
 * `grantAtPage`) and every save the server's authoriser judges, one probe
 * edit at a time (a measure's figure, a tactic's, a key objective's, a
 * milestone, a picture slide, a note, a plan target) — for every person, on
 * the worked example and on variants made from it that the example lacks: a
 * company that plans its own directions with seated owners and custodians, a
 * company that plans in projects, capabilities with seated holders, and a
 * unit pillar whose custodian is not its owner.
 *
 * NO BROWSER, NO DATABASE, NO CLIENT DATA: built from db/seed-state.json.
 * Write the baseline from the code you are comparing AGAINST, then compare:
 *
 *     node scripts/test-permission-census.js --write /tmp/census-main.json
 *     node scripts/test-permission-census.js --against /tmp/census-main.json
 *
 * Any difference is printed and is a finding, never a tolerance. Proved able
 * to fail: dropping a custodian from the seat rule moves 22 decisions. */
"use strict";
const fs = require("fs"), path = require("path");
const R = require(path.join(__dirname, "..", "lib", "rules.js"));
const A = require(path.join(__dirname, "..", "lib", "authorize.js"));
const SEED = path.join(__dirname, "..", "db", "seed-state.json");
const STATES = { seed: SEED };
const VARIANTS = {
  company_directions: ["seed", function (S) {
    const ppl = S.people.filter((p) => p.key);
    S.group.structure = Object.assign({}, S.group.structure || {}, { bu: { exists: false } });
    S.group.items = [
      { id: "group-P1", code: "", name: "Dir one", kind: "", theme: "", owner: ppl[4].name, custodian: ppl[6].name,
        measures: [{ id: "group-P1-M1", name: "M", dir: "\u2265", target: "10", compile: "Sum", actual: "" }], tactics: [{ id: "group-P1-T1", name: "T", owner: ppl[4].name, q1: 1 }] },
      { id: "group-P2", code: "", name: "Cap one", kind: "Capability", theme: "", owner: "", custodian: ppl[8].name,
        measures: [{ id: "group-P2-M1", name: "M2", dir: "\u2265", target: "5", compile: "Sum", actual: "" }], tactics: [] }];
  }],
  company_projects: ["seed", function (S) {
    S.group.structure = Object.assign({}, S.group.structure || {});
    S.group.structure.top = Object.assign({}, S.group.structure.top || {}, { plan: { way: "projects" } });
    const ppl = S.people.filter((p) => p.key);
    S.group.topProjects = [
      { id: "tp1", name: "Top project one", owner: ppl[5].name, start: "Q1 2026", end: "Q4 2026", deliverables: [{ id: "tp1-d1", name: "D1", status: "todo" }], outcomes: [], milestones: [{ id: "tp1-m1", name: "M1", status: "todo" }] },
      { id: "tp2", name: "Top project two", owner: ppl[9].name, start: "Q1 2026", end: "Q4 2026", deliverables: [], outcomes: [], milestones: [{ id: "tp2-m1", name: "M1", status: "todo" }] }];
    S.group.items = [{ id: "group-P1", code: "", name: "Top dir", kind: "", theme: "", owner: ppl[12].name, custodian: ppl[13].name,
      measures: [{ id: "group-P1-M1", name: "M", dir: "\u2265", target: "10", compile: "Sum", actual: "" }], tactics: [{ id: "group-P1-T1", name: "T", owner: ppl[12].name, q1: 1 }] }];
    arr(S.group.capabilities).forEach((c, j) => { c.head = ppl[15 + j] && ppl[15 + j].key; c.custodian = ppl[20 + j] && ppl[20 + j].key; });
    /* custodians who are NOT the owner, on a unit's pillar and on a direction */
    const uk = Object.keys(S.units)[0]; if (S.units[uk].items[0]) S.units[uk].items[0].custodian = ppl[25].name;
    if (S.units[uk].items[1]) S.units[uk].items[1].custodian = ppl[26].name;
    S.group.items.push({ id: "group-P2", code: "", name: "Second dir", kind: "Capability", theme: "", owner: "", custodian: ppl[27].name,
      measures: [{ id: "group-P2-M1", name: "M2", dir: "\u2265", target: "5", compile: "Sum", actual: "" }], tactics: [] });
  }],
};
const clone = (x) => JSON.parse(JSON.stringify(x));
const arr = (x) => Array.isArray(x) ? x : [];
const ENTRIES = Object.entries(STATES).map(([n, f]) => [n, f, null]).concat(
  Object.entries(VARIANTS).map(([n, v]) => [n, STATES[v[0]], v[1]]));
const out = {};
for (const [name, file, vary] of ENTRIES) {
  const S = JSON.parse(fs.readFileSync(file, "utf8"));
  if (vary) vary(S);
  S.review = S.review || {};
  const w = R.worldOf(S);
  const people = arr(S.people).filter((p) => p && p.key);
  const G = S.group || {};
  /* ── the probes: one edit each, the kind people make ── */
  const probes = [];
  const add = (label, fn) => probes.push({ label, fn });
  arr(G.items).forEach((p, i) => {
    if (arr(p.measures)[0]) add("top pillar " + p.id + " measure", (s) => { s.group.items[i].measures[0].actual = "123"; });
    if (arr(p.tactics)[0]) add("top pillar " + p.id + " tactic", (s) => { s.group.items[i].tactics[0].actual = "77"; });
    add("slides dir:" + p.id, (s) => { s.review.slides = s.review.slides || {}; s.review.slides["dir:" + p.id] = [{ id: "psprobe", title: "P", pics: [] }]; });
  });
  arr(G.topProjects).forEach((pr, i) => {
    if (arr(pr.milestones)[0]) add("top project " + i + " milestone", (s) => { s.group.topProjects[i].milestones[0].status = "done"; });
    if (arr(pr.deliverables)[0]) add("top project " + i + " deliverable", (s) => { s.group.topProjects[i].deliverables[0].status = "done"; });
  });
  arr(G.capabilities).forEach((c, i) => {
    if (arr(c.keyObjectives)[0]) add("cap " + c.id + " ko", (s) => { s.group.capabilities[i].keyObjectives[0].actual = "55"; });
    const pr = arr(c.projects)[0];
    if (pr && arr(pr.milestones)[0]) add("cap " + c.id + " milestone", (s) => { s.group.capabilities[i].projects[0].milestones[0].status = "done"; });
  });
  if (arr(G.keyObjectives)[0]) add("group ko", (s) => { s.group.keyObjectives[0].actual = "66"; });
  add("slides group", (s) => { s.review.slides = s.review.slides || {}; s.review.slides.group = [{ id: "psprobe", title: "P", pics: [] }]; });
  add("note group", (s) => { s.review.note = Object.assign({}, s.review.note || {}, { group: "probe note" }); });
  Object.keys(S.units || {}).forEach((k) => {
    const u = S.units[k], p = arr(u.items)[0];
    if (p && arr(p.measures)[0]) add("unit " + k + " measure", (s) => { s.units[k].items[0].measures[0].actual = "123"; });
    if (p && arr(p.tactics)[0]) add("unit " + k + " tactic", (s) => { s.units[k].items[0].tactics[0].actual = "77"; });
    if (arr(u.keyObjectives)[0]) add("unit " + k + " ko", (s) => { s.units[k].keyObjectives[0].actual = "66"; });
    add("slides " + k, (s) => { s.review.slides = s.review.slides || {}; s.review.slides[k] = [{ id: "psprobe", title: "P", pics: [] }]; });
    add("note " + k, (s) => { s.review.note = Object.assign({}, s.review.note || {}, { [k]: "probe" }); });
    if (p) add("unit " + k + " plan target", (s) => { if (s.units[k].items[0].measures[0]) s.units[k].items[0].measures[0].target = "999"; });
  });
  Object.keys(S.functions || {}).forEach((k) => {
    const f = S.functions[k];
    if (arr(f.keyObjectives)[0]) add("fn " + k + " ko", (s) => { s.functions[k].keyObjectives[0].actual = "66"; });
    const pr = arr(f.projects)[0];
    if (pr && arr(pr.milestones)[0]) add("fn " + k + " milestone", (s) => { s.functions[k].projects[0].milestones[0].status = "done"; });
    if (pr && arr(pr.deliverables)[0]) add("fn " + k + " deliverable", (s) => { s.functions[k].projects[0].deliverables[0].status = "done"; });
    if (arr(f.actions)[0]) add("fn " + k + " action", (s) => { s.functions[k].actions[0].status = "done"; });
    const fp = arr(f.items)[0];
    if (fp && arr(fp.measures)[0]) add("fn " + k + " measure", (s) => { s.functions[k].items[0].measures[0].actual = "123"; });
    add("slides fn:" + k, (s) => { s.review.slides = s.review.slides || {}; s.review.slides["fn:" + k] = [{ id: "psprobe", title: "P", pics: [] }]; });
    add("note fn:" + k, (s) => { s.review.note = Object.assign({}, s.review.note || {}, { ["fn:" + k]: "probe" }); });
  });
  /* the mutated graphs, built once */
  const incs = probes.map((pr) => { const s = clone(S); try { pr.fn(s); } catch (e) { return null; } return s; });
  /* ── the targets and pages for the rule questions ── */
  const targets = ["group"].concat(Object.keys(S.units || {})).concat(Object.keys(S.functions || {}).map((k) => "fn:" + k))
    .concat(Object.keys(S.companies || {}).map((k) => "co:" + k)).concat(arr(G.capabilities).map((c) => "cap:" + c.id))
    .concat(arr(G.items).map((p) => "dir:" + p.id));
  const pages = Object.keys(R.PAGE_AREA).sort();
  const res = {};
  for (const person of people) {
    const r = {};
    const q = (k, f) => { try { r[k] = f(); } catch (e) { r[k] = "THREW " + (e && e.message || "").slice(0, 60); } };
    q("roles", () => R.personRoleKeys(w, person).slice().sort().join(","));
    q("mayReportTop", () => R.mayReportTop(w, person));
    q("ownsTopPillar*", () => R.ownsTopPillar(w, person));
    arr(G.items).forEach((p) => q("ownsTopPillar " + p.id, () => R.ownsTopPillar(w, person, p.owner || "", p.custodian || "")));
    q("ownsTopCapability", () => R.ownsTopCapability(w, person));
    q("ownsTopProject*", () => R.ownsTopProject(w, person));
    arr(G.topProjects).forEach((p, i) => q("ownsTopProject " + i, () => R.ownsTopProject(w, person, p.owner || "")));
    for (const t of targets) {
      for (const area of ["unit", "fn"]) {
        q("mayReportRow " + area + " " + t, () => R.mayReportRow(w, person, area, t, {}));
      }
    }
    Object.keys(S.units || {}).forEach((k) => arr(S.units[k].items).forEach((p, i) => {
      q("mayReportRow unit " + k + " p" + i, () => R.mayReportRow(w, person, "unit", k, { pillarOwner: p.owner || "", pillarCust: p.custodian || "", row: arr(p.measures)[0] || null }));
      q("mayMarkDone unit " + k + " p" + i, () => R.mayMarkDone(w, person, "unit", k, p.owner || "", p.custodian || ""));
    }));
    arr(G.items).forEach((p, i) => {
      q("mayReportRow group p" + i, () => R.mayReportRow(w, person, "unit", "group", { pillarOwner: p.owner || "", pillarCust: p.custodian || "", row: arr(p.measures)[0] || null }));
      q("mayMarkDone group p" + i, () => R.mayMarkDone(w, person, "unit", "group", p.owner || "", p.custodian || ""));
    });
    Object.keys(S.functions || {}).forEach((k) => arr(S.functions[k].projects).forEach((pr, i) => {
      q("mayReportRow fn " + k + " pr" + i, () => R.mayReportRow(w, person, "fn", "fn:" + k, { project: pr, row: arr(pr.milestones)[0] || null }));
      q("mayMarkDone fn " + k + " pr" + i, () => R.mayMarkDone(w, person, "fn", "fn:" + k, pr.owner || ""));
    }));
    for (const page of pages) for (const t of targets) {
      let g; try { g = R.grantAtPage(w, person, page, t); } catch (e) { g = "THREW"; }
      if (g && g !== "none") r["grant " + page + "@" + t] = g;
    }
    probes.forEach((pr, i) => {
      if (!incs[i]) { r["auth " + pr.label] = "probe-failed"; return; }
      let v; try { v = A.authorize(S, incs[i], person); } catch (e) { v = { ok: "THREW", refusals: [String(e && e.message).slice(0, 80)] }; }
      r["auth " + pr.label] = v.ok === true ? "ok" : (v.ok === "THREW" ? "THREW " + v.refusals[0] : "no: " + String((v.refusals || [])[0] || "").slice(0, 90));
    });
    res[person.key] = r;
  }
  const n = Object.values(res).reduce((a, r) => a + Object.keys(r).length, 0);
  console.log("%s · people %d · probes %d · decisions %d", name, people.length, probes.length, n);
  out[name] = res;
}
const argAt = (f) => { const i = process.argv.indexOf(f); return i > 0 ? process.argv[i + 1] : null; };
const write = argAt("--write"), against = argAt("--against");
if (write) { fs.writeFileSync(write, JSON.stringify(out)); console.log("wrote " + write); }
if (against) {
  const a = JSON.parse(fs.readFileSync(against, "utf8"));
  let n = 0, d = 0;
  for (const st of Object.keys(a)) for (const p of Object.keys(a[st])) {
    const ka = Object.keys(a[st][p]), kb = Object.keys(((out[st] || {})[p]) || {});
    for (const k of new Set(ka.concat(kb))) {
      n++; const x = a[st][p][k], y = ((out[st] || {})[p] || {})[k];
      if (JSON.stringify(x) !== JSON.stringify(y)) { d++; if (d <= 40) console.log("  MOVED  %s · %s · %s  — was %j, now %j", st, p, k, x, y); }
    }
  }
  console.log(d ? "MOVED — " + d + " of " + n + " decisions" : "UNMOVED — all " + n + " decisions answer as they did");
  process.exit(d ? 1 : 0);
}
