"""THE TEMPLATE CARRIES WHAT THE PLATFORM HOLDS (§294).

Islam: *"mka esure that the plans templates for upload and download are
matching all what we have on the platform now."*

§22's contract is that an upload AUTHORS a plan, so a column the file does not
carry is a column the plan LOSES on a download-and-re-upload — silently, and
in the one direction nobody looks, because the file opens perfectly and the
screen after the upload looks like a plan.

WHAT THIS ASSERTS IS A FIXED POINT, never a list of columns (§94.8): the plan
goes out through the platform's OWN builder, is zipped, is read back through
the platform's OWN reader, is applied through the REAL replace path, and every
field a person can author has to come back the same. Add a field to the pen
tomorrow and this goes red until the file carries it — which is the whole
point, and is what a list of expected headers could never do.

AND BOTH ENDS EVERY TIME (§94.2): a row the file says nothing about must be
untouched, or a build that wrote the marker everywhere would satisfy every
assertion above.

THE STATE IS MADE, NEVER WAITED FOR (§255): the worked example carries no
monthly plan, no hidden row, no repeat mark, no tactic outcome and no weight on
a unit's objectives, so every assertion here passes on a build that lost the
feature until the probe writes the value first.

EVERY PROBE DEGRADES rather than throwing (§215): a build without one of these
must REPORT its failures, not die on the first missing name and print a count
that looks like a pass.

Run: SMP_CHROME=... python3 qa-run.py checks/template-round-trip.py
"""
import os
import pathlib
from playwright.sync_api import sync_playwright

# SMP_BUILT points this at another build, so the green run can be checked
# against a copy with a fix taken out (§276, §94.5).
url = "file://" + str(pathlib.Path(
    os.environ.get("SMP_BUILT", "strategy-management-platform.html")).resolve())
bad = 0


def ck(w, ok, x=""):
    global bad
    if not ok:
        bad += 1
    print(("  ok      " if ok else "  FAIL    ") + w + (("  — " + str(x)) if not ok and x else ""))


JS = r"""
async () => {
  const R = { err: [] };
  const guard = async (name, fn) => {
    try { return await fn(); } catch (e) { R.err.push(name + ": " + e.message); return null; }
  };

  /* ── A UNIT'S PLAN, AND A PILLARS FUNCTION'S ───────────────────────── */
  R.plan = {};
  for (const tag of ["unit", "fn"]) {
    R.plan[tag] = await guard("plan/" + tag, async () => {
      /* THE PILLAR IS FOUND, NEVER `items[0]` — the demo's one pillars
         function carries a first pillar with no measures on it, so a probe
         keyed on position reports "nothing to measure" on a tenant that has
         plenty (the check being wrong, not the build). */
      const richPillar = x => ((x && x.items) || []).filter(
        p => (p.measures || []).length && (p.tactics || []).length)[0];
      /* AND OBJECTIVES ARE NOT REQUIRED. A supporting function judged by its
         pillars legitimately carries none (§214.2), so demanding one here
         reported the demo's only pillars function as nothing to measure —
         the check being wrong about the product's own rule. */
      const full = k => { const x = unitLike(k); return x && richPillar(x); };
      const key = tag === "unit"
        ? UNIT_KEYS.filter(k => UNITS[k].active !== false).filter(full)[0]
        : FUNCTION_KEYS.filter(k => FUNCTIONS[k].active !== false && fnPlansInPillars(FUNCTIONS[k]))
            .map(k => "fn:" + k).filter(full)[0];
      if (!key) return { skipped: true };
      const u = unitLike(key);
      const p = richPillar(u), pi = u.items.indexOf(p);
      const ko = u.keyObjectives[0] || null, m = p.measures[0], t = p.tactics[0];

      /* MAKE THE STATE. Everything a person can author, marked. */
      if (ko) Object.assign(ko, { name: "KO NAME", dir: "≤", target: "11 M EGP",
        target3y: "33 M EGP", compile: "Count", weight: 17, hide: true,
        monthly: [1,2,3,4,5,6,7,8,9,10,11,12] });
      Object.assign(m, { name: "M NAME", dir: "≤", target: "22 M EGP", compile: "Count",
        hide: true, monthly: [2,3,4,5,6,7,8,9,10,11,12,13] });
      Object.assign(t, { name: "T NAME", description: "T DESC", outcome: "T OUTCOME",
        outDir: "≤", outTarget: "55 M EGP", outCompile: "Count", owner: "T OWNER",
        collaborators: ["Aa Bb", "Cc Dd"], q1: 1, q2: 0, q3: 1, q4: 0, hide: true,
        outMonthly: [3,4,5,6,7,8,9,10,11,12,13,14] });
      /* THE CONTROL ROW (§94.2): a second objective nothing marks. */
      const ctl = u.keyObjectives[1]
        ? JSON.parse(JSON.stringify(u.keyObjectives[1])) : null;

      const want = { ko: ko ? JSON.parse(JSON.stringify(ko)) : null, m: JSON.parse(JSON.stringify(m)),
                     t: JSON.parse(JSON.stringify(t)),
                     pillarName: p.name, aspiration: u.aspiration };

      const bytes = buildXlsx(planWorkbook(u));
      const sheets = await readXlsx(bytes.buffer ? bytes.buffer : bytes);
      const rows = planFromWorkbook(u, sheets);
      applyPlanReplace(u, rows);

      const ko2 = u.keyObjectives[0], p2 = u.items[pi];
      const m2 = p2 && p2.measures[0], t2 = p2 && p2.tactics[0];
      const ctl2 = u.keyObjectives[1] || null;
      return { key: key, want: want,
        got: { ko: ko2 ? JSON.parse(JSON.stringify(ko2)) : null,
               m: m2 ? JSON.parse(JSON.stringify(m2)) : null,
               t: t2 ? JSON.parse(JSON.stringify(t2)) : null,
               pillarName: p2 ? p2.name : null, aspiration: u.aspiration },
        ctl: ctl, ctl2: ctl2 };
    });
  }

  /* ── A CAPABILITY'S PLAN ───────────────────────────────────────────── */
  R.cap = await guard("cap", async () => {
    const c = GROUP.capabilities.filter(x => (x.keyObjectives || []).length
      && (x.projects || []).length && (x.projects[0].deliverables || []).length
      && (x.projects[0].outcomes || []).length && (x.projects[0].milestones || []).length)[0];
    if (!c) return { skipped: true };
    const ko = c.keyObjectives[0], pr = c.projects[0];
    const d = pr.deliverables[0], o = pr.outcomes[0], ms = pr.milestones[0];
    Object.assign(ko, { name: "CKO", dir: "≤", target: "11 M EGP", compile: "Count",
      weight: 17, hide: true });
    Object.assign(pr, { name: "PR", brief: "BRIEF", owner: "POWN",
      stakeholders: ["S1", "S2"], timeline: "date", start: "Jan 26", end: "Dec 26",
      repeats: 6 });
    Object.assign(d, { name: "D NAME", hide: true });
    Object.assign(o, { name: "O NAME", dir: "≤", target: "22 M EGP",
      measureAt: "Q4 2026", hide: true });
    Object.assign(ms, { name: "MS NAME", covers: "COVERS", owner: "MOWN",
      collaborators: ["A B", "C D"], finish: "Jul 26", hide: true });
    const ctl = c.keyObjectives[1] ? JSON.parse(JSON.stringify(c.keyObjectives[1])) : null;
    const want = { ko: JSON.parse(JSON.stringify(ko)),
      pr: (() => { const x = JSON.parse(JSON.stringify(pr));
                   delete x.deliverables; delete x.outcomes; delete x.milestones; return x; })(),
      d: JSON.parse(JSON.stringify(d)), o: JSON.parse(JSON.stringify(o)),
      ms: JSON.parse(JSON.stringify(ms)) };

    const bytes = buildXlsx(capPlanWorkbook(c));
    const sheets = await readXlsx(bytes.buffer ? bytes.buffer : bytes);
    const rows = capPlanFromWorkbook(c, sheets);
    applyCapPlanReplace(c, rows);

    const pr2 = c.projects[0];
    return { name: c.name, want: want,
      got: { ko: c.keyObjectives[0] ? JSON.parse(JSON.stringify(c.keyObjectives[0])) : null,
             pr: pr2 ? (() => { const x = JSON.parse(JSON.stringify(pr2));
                   delete x.deliverables; delete x.outcomes; delete x.milestones; return x; })() : null,
             d: pr2 && pr2.deliverables[0] ? JSON.parse(JSON.stringify(pr2.deliverables[0])) : null,
             o: pr2 && pr2.outcomes[0] ? JSON.parse(JSON.stringify(pr2.outcomes[0])) : null,
             ms: pr2 && pr2.milestones[0] ? JSON.parse(JSON.stringify(pr2.milestones[0])) : null },
      ctl: ctl, ctl2: c.keyObjectives[1] || null };
  });

  /* ── A UNIT'S PROGRESS FILE LANDS WHAT IT SAYS ─────────────────────── */
  R.prog = await guard("prog", async () => {
    const u = unitLike(UNIT_KEYS.filter(k => UNITS[k].active !== false)[0]);
    const p = u.items[0], t = p.tactics[0], m = p.measures[0], ko = u.keyObjectives[0];
    /* A tactic MEASURED BY ITS OUTCOME (§248): the screen asks for the
       outcome's figure and stores it in `outActual`, never in `actual`. */
    t.outcome = "OUT"; t.outTarget = "80 M EGP"; t.outDir = "≥";
    delete t.outActual; t.actual = 5; delete t.note;
    delete m.note; delete ko.note;
    const t2 = p.tactics[1] || null;               // the control row
    const ctlActual = t2 ? t2.actual : null;

    let sh = progressWorkbook(u);
    const heads = sh.filter(s => s.head).map(s => ({ sheet: s.name, head: s.head.slice() }));
    /* Fill only the FIRST row of each sheet, so the untouched rows are the
       control (§94.2). */
    sh.forEach(s => {
      if (!s.head || !s.rows.length) return;
      s.head.forEach((h, i) => {
        if (/^New/.test(h)) s.rows[0][i] = "63";
        if (/^Note/i.test(h)) s.rows[0][i] = "A NOTE";
      });
    });
    const bytes = buildXlsx(sh);
    const sheets = await readXlsx(bytes.buffer ? bytes.buffer : bytes);
    const rows = progressFromWorkbook(u, sheets);
    const d = diffProgress(u, rows);
    applyProgress(u, d);
    return { heads: heads,
      t: { actual: t.actual, outActual: t.outActual == null ? null : String(t.outActual),
           note: t.note == null ? null : String(t.note) },
      m: { actual: m.actual == null ? null : String(m.actual),
           note: m.note == null ? null : String(m.note) },
      ko: { actual: ko.actual == null ? null : String(ko.actual),
            note: ko.note == null ? null : String(ko.note) },
      ctlBefore: ctlActual, ctlAfter: t2 ? t2.actual : null, hadControl: !!t2 };
  });

  /* ── A CAPABILITY'S PROGRESS FILE LANDS WHAT IT SAYS ───────────────── */
  R.capProg = await guard("capProg", async () => {
    const c = GROUP.capabilities.filter(x => (x.projects || []).length
      && (x.projects[0].deliverables || []).length
      && (x.projects[0].milestones || []).length)[0];
    if (!c) return { skipped: true };
    const pr = c.projects[0], d = pr.deliverables[0], ms = pr.milestones[0];
    d.status = "not"; delete d.pct; delete d.actual; delete d.note;
    ms.status = "not"; delete ms.pct; delete ms.note;
    const dCtl = pr.deliverables[1] || null, msCtl = pr.milestones[1] || null;
    if (dCtl) { dCtl.status = "not"; delete dCtl.pct; }
    if (msCtl) { msCtl.status = "not"; delete msCtl.pct; }

    let cs = capProgressWorkbook(c);
    const heads = cs.filter(s => s.head).map(s => ({ sheet: s.name, head: s.head.slice() }));
    cs.forEach(s => {
      if (!s.head || !s.rows.length) return;
      s.head.forEach((h, i) => {
        if (h === "New status") s.rows[0][i] = "In progress";
        else if (/^New/.test(h)) s.rows[0][i] = "63";
        if (/^Note/i.test(h)) s.rows[0][i] = "A NOTE";
      });
    });
    const bytes = buildXlsx(cs);
    const sheets = await readXlsx(bytes.buffer ? bytes.buffer : bytes);
    const rows = capProgressFromWorkbook(c, sheets);
    const diff = diffCapProgress(c, rows);
    applyCapProgress(c, diff);
    return { heads: heads,
      d: { status: d.status, pct: d.pct == null ? null : String(d.pct),
           actual: d.actual == null ? null : String(d.actual) },
      ms: { status: ms.status, pct: ms.pct == null ? null : String(ms.pct) },
      dCtl: dCtl ? { status: dCtl.status, pct: dCtl.pct == null ? null : String(dCtl.pct) } : null,
      msCtl: msCtl ? { status: msCtl.status, pct: msCtl.pct == null ? null : String(msCtl.pct) } : null };
  });

  /* ── AND THE CSV ROUTE, which is the other live way in ───────────────
     A plan may only arrive as a workbook (its Read me sheet is what says
     whose plan it is), but REPORTING still takes a CSV — so the same two
     facts have to land through this door as well, or the product has two
     answers depending on which file somebody chose (§53.5). */
  R.csv = await guard("csv", async () => {
    const u = unitLike(UNIT_KEYS.filter(k => UNITS[k].active !== false)[0]);
    const p = u.items[0], t = p.tactics[0];
    t.outcome = "OUT"; t.outTarget = "80 M EGP"; t.outDir = "≥";
    delete t.outActual; t.actual = 5; delete t.note;
    const rowsIn = parseCSV(progressTemplate(u)).map(r => {
      if (r.id === t.id) { r.new_value = "71"; r.new_note = "CSV NOTE"; }
      return r;
    });
    const d = diffProgress(u, rowsIn);
    applyProgress(u, d);

    const c = GROUP.capabilities.filter(x => (x.projects || []).length
      && (x.projects[0].deliverables || []).length)[0];
    let dl = null;
    if (c) {
      dl = c.projects[0].deliverables[0];
      dl.status = "todo"; delete dl.pct; delete dl.actual; delete dl.note;
      const cRows = parseCSV(capProgressTemplate(c)).map(r => {
        if (r.id === dl.id) { r.new_value = "In progress"; r.new_pct = "44"; r.new_note = "CSV NOTE"; }
        return r;
      });
      const cd = diffCapProgress(c, cRows);
      applyCapProgress(c, cd);
    }
    return {
      t: { actual: t.actual, outActual: t.outActual == null ? null : String(t.outActual),
           note: t.note == null ? null : String(t.note) },
      d: dl ? { status: dl.status, pct: dl.pct == null ? null : String(dl.pct),
                actual: dl.actual == null ? null : String(dl.actual),
                note: dl.note == null ? null : String(dl.note) } : null };
  });

  return R;
}
"""

with sync_playwright() as p:
    b = p.chromium.launch()
    pg = b.new_page(viewport={"width": 1440, "height": 900})
    errs = []
    pg.on("pageerror", lambda e: errs.append(str(e)))
    pg.goto(url)
    pg.wait_for_timeout(900)
    R = pg.evaluate(JS)

    print("§0  the probe itself")
    ck("no page error", not errs, errs)
    ck("every probe ran", not R["err"], R["err"])

    # ── §1/§2 a plan is a fixed point
    for tag, label in (("unit", "a unit"), ("fn", "a pillars function")):
        d = (R.get("plan") or {}).get(tag)
        print("\n§1  " + label + " — the plan survives a download and re-upload")
        if not d or d.get("skipped"):
            ck("a subject with a full plan to measure", False, "none found")
            continue
        w, g = d["want"], d["got"]
        if w["ko"] is None:
            ck("no objectives here, and that is legitimate (§214.2)", g["ko"] is None,
               g["ko"])
        else:
            ck("the objective came back", g["ko"] is not None)
        if g["ko"] and w["ko"]:
            for f in ("name", "dir", "target", "target3y", "compile"):
                ck("objective " + f, str(g["ko"].get(f)) == str(w["ko"].get(f)),
                   repr(g["ko"].get(f)))
            ck("objective weight", str(g["ko"].get("weight")) == str(w["ko"].get("weight")),
               "want " + str(w["ko"].get("weight")) + ", got " + str(g["ko"].get("weight")))
            ck("objective hidden", bool(g["ko"].get("hide")) is True, g["ko"].get("hide"))
            ck("objective monthly plan", g["ko"].get("monthly") == w["ko"].get("monthly"),
               g["ko"].get("monthly"))
        ck("the measure came back", g["m"] is not None)
        if g["m"]:
            for f in ("name", "dir", "target", "compile"):
                ck("measure " + f, str(g["m"].get(f)) == str(w["m"].get(f)), repr(g["m"].get(f)))
            ck("measure hidden", bool(g["m"].get("hide")) is True, g["m"].get("hide"))
            ck("measure monthly plan", g["m"].get("monthly") == w["m"].get("monthly"),
               g["m"].get("monthly"))
        ck("the tactic came back", g["t"] is not None)
        if g["t"]:
            for f in ("name", "description", "outcome", "outDir", "outTarget",
                      "outCompile", "owner"):
                ck("tactic " + f, str(g["t"].get(f)) == str(w["t"].get(f)), repr(g["t"].get(f)))
            ck("tactic collaborators",
               list(g["t"].get("collaborators") or []) == list(w["t"].get("collaborators") or []),
               g["t"].get("collaborators"))
            ck("tactic quarters",
               [g["t"].get(q) and 1 or 0 for q in ("q1", "q2", "q3", "q4")] == [1, 0, 1, 0],
               [g["t"].get(q) for q in ("q1", "q2", "q3", "q4")])
            ck("tactic hidden", bool(g["t"].get("hide")) is True, g["t"].get("hide"))
            ck("tactic outcome monthly plan",
               g["t"].get("outMonthly") == w["t"].get("outMonthly"), g["t"].get("outMonthly"))
        ck("the pillar's name survived", g["pillarName"] == w["pillarName"], g["pillarName"])
        if tag == "unit":
            ck("the aspiration survived", g["aspiration"] == w["aspiration"])
        # both ends
        if d.get("ctl"):
            c1, c2 = d["ctl"], d["ctl2"]
            ck("a row the file did not mark is untouched",
               bool(c2) and c2.get("name") == c1.get("name")
               and str(c2.get("target")) == str(c1.get("target")),
               (c1.get("name"), c2 and c2.get("name")))

    # ── §2 a capability's plan
    d = R.get("cap")
    print("\n§2  a capability — the plan survives a download and re-upload")
    if not d or d.get("skipped"):
        ck("a capability with a full plan to measure", False, "none found")
    else:
        w, g = d["want"], d["got"]
        ck("the objective came back", g["ko"] is not None)
        if g["ko"]:
            for f in ("name", "dir", "target", "compile", "weight"):
                ck("objective " + f, str(g["ko"].get(f)) == str(w["ko"].get(f)), repr(g["ko"].get(f)))
            ck("objective hidden", bool(g["ko"].get("hide")) is True, g["ko"].get("hide"))
        ck("the project came back", g["pr"] is not None)
        if g["pr"]:
            for f in ("name", "brief", "owner", "timeline", "start", "end"):
                ck("project " + f, str(g["pr"].get(f)) == str(w["pr"].get(f)), repr(g["pr"].get(f)))
            ck("project stakeholders",
               list(g["pr"].get("stakeholders") or []) == list(w["pr"].get("stakeholders") or []),
               g["pr"].get("stakeholders"))
            ck("project repeats", str(g["pr"].get("repeats")) == str(w["pr"].get("repeats")),
               "want " + str(w["pr"].get("repeats")) + ", got " + str(g["pr"].get("repeats")))
        for k, fields in (("d", ("name",)), ("o", ("name", "dir", "target", "measureAt")),
                          ("ms", ("name", "covers", "owner", "finish"))):
            ck("the " + k + " row came back", g[k] is not None)
            if not g[k]:
                continue
            for f in fields:
                ck(k + " " + f, str(g[k].get(f)) == str(w[k].get(f)), repr(g[k].get(f)))
            ck(k + " hidden", bool(g[k].get("hide")) is True, g[k].get("hide"))
        if g["ms"]:
            ck("milestone collaborators",
               list(g["ms"].get("collaborators") or []) == list(w["ms"].get("collaborators") or []),
               g["ms"].get("collaborators"))
        if d.get("ctl"):
            ck("a capability row the file did not mark is untouched",
               bool(d["ctl2"]) and d["ctl2"].get("name") == d["ctl"].get("name"))

    # ── §3 a unit's progress file
    d = R.get("prog")
    print("\n§3  a unit's progress file lands what it says")
    if not d:
        ck("the progress probe ran", False)
    else:
        heads = {h["sheet"]: h["head"] for h in d["heads"]}
        for s in ("Objectives", "Measures", "Tactics"):
            ck(s + " sheet asks for a note",
               any(str(x).lower().startswith("note") for x in heads.get(s, [])),
               heads.get(s))
        ck("an objective's figure landed", d["ko"]["actual"] == "63", d["ko"])
        ck("an objective's note landed", d["ko"]["note"] == "A NOTE", d["ko"])
        ck("a measure's figure landed", d["m"]["actual"] == "63", d["m"])
        ck("a measure's note landed", d["m"]["note"] == "A NOTE", d["m"])
        # §248: the outcome-measured tactic
        ck("an outcome-measured tactic's figure landed in outActual",
           d["t"]["outActual"] is not None and "63" in d["t"]["outActual"], d["t"])
        ck("...and NOT in actual, which means % delivered",
           str(d["t"]["actual"]) != "63", d["t"])
        ck("a tactic's note landed", d["t"]["note"] == "A NOTE", d["t"])
        if d["hadControl"]:
            ck("a tactic the file left blank is untouched",
               d["ctlBefore"] == d["ctlAfter"], (d["ctlBefore"], d["ctlAfter"]))

    # ── §4 a capability's progress file
    d = R.get("capProg")
    print("\n§4  a capability's progress file lands what it says")
    if not d or d.get("skipped"):
        ck("a capability with deliverables and milestones", False, "none found")
    else:
        heads = {h["sheet"]: h["head"] for h in d["heads"]}
        for s in ("Objectives", "Deliverables", "Outcomes", "Milestones"):
            ck(s + " sheet asks for a note",
               any(str(x).lower().startswith("note") for x in heads.get(s, [])),
               heads.get(s))
        ck("a deliverable's status landed", d["d"]["status"] == "wip", d["d"])
        ck("a deliverable's per-cent landed", d["d"]["pct"] == "63", d["d"])
        ck("nothing was written to the field §104 removed",
           d["d"]["actual"] is None, d["d"])
        ck("a milestone's status landed", d["ms"]["status"] == "wip", d["ms"])
        ck("a milestone's per-cent landed", d["ms"]["pct"] == "63", d["ms"])
        if d["dCtl"]:
            ck("a deliverable the file left blank is untouched",
               d["dCtl"]["status"] == "not" and d["dCtl"]["pct"] is None, d["dCtl"])
        if d["msCtl"]:
            ck("a milestone the file left blank is untouched",
               d["msCtl"]["status"] == "not" and d["msCtl"]["pct"] is None, d["msCtl"])

    # ── §5 the CSV route
    d = R.get("csv")
    print("\n§5  the CSV progress route lands the same two facts")
    if not d:
        ck("the csv probe ran", False)
    else:
        ck("an outcome-measured tactic's figure landed in outActual",
           d["t"]["outActual"] is not None and "71" in d["t"]["outActual"], d["t"])
        ck("...and NOT in actual", str(d["t"]["actual"]) != "71", d["t"])
        ck("a tactic's note landed", d["t"]["note"] == "CSV NOTE", d["t"])
        if d["d"]:
            ck("a deliverable's status landed", d["d"]["status"] == "wip", d["d"])
            ck("a deliverable's per-cent landed", d["d"]["pct"] == "44", d["d"])
            ck("nothing was written to the field §104 removed",
               d["d"]["actual"] is None, d["d"])
            ck("a deliverable's note landed", d["d"]["note"] == "CSV NOTE", d["d"])

    b.close()

print("\n" + ("all template round-trip checks passed" if not bad else str(bad) + " FAILURES"))
