"""THE UNIT IS THERE BEFORE THE NUMBER IS (§251).

Islam, from his own plan with the pen open: *"In the edit I can't set the unit
for a measure."* Two of his four measures had no target yet, so the Unit column
drew an em-dash and the hover *"Set a target first"* — the unit could only ever
be set AFTER the number, and setting it first is the obvious way round.

§199 could not have done otherwise: there is no unit FIELD, the unit lives
inside the target string, and a row with no target had nowhere to keep one. The
answer is not a second home for it — it is that the target holds the unit ALONE
until a number joins it, which is exactly what §248 settled one table over for a
tactic's outcome ("%", then "90%"). This reverses that section's own explicit
carve-out for the measures column, at Islam's instruction, on all four surfaces
at once: he was shown where and answered *"all 4 places"*.

WHAT IS ASSERTED, and why each one is here:
  · THE PICKER IS DRAWN ON A ROW WITH NO TARGET, on the unit's Overview, the
    group's Foundation, a pillar's Key measures and a supporting function's
    Overview — asserted by finding the Unit column through its own HEADING
    rather than by a column number, so a table that gains a column stays green
    and a table that loses the picker does not (§94.8).
  · THE UNIT IS HELD ALONE, in THIS YEAR's target and never the 3-year one: a
    pillar's measures draw no 3-year column at all, so writing there would put
    a value into a field no screen shows.
  · AND THE ROW STILL SAYS MISSING. This is the one cost of §251 and the whole
    reason `GAP_NUM` grew: a target holding "%" is non-blank and holds nothing
    anybody can be measured against, so without it the red word would vanish
    the instant a unit was picked, the count would drop and Submit would stop
    refusing (§249.2's fault exactly). Asserted on the page AND through the
    shared rule, because the server reads the same function.
  · THE NUMBER JOINS IT — 90 typed after "%" is "90%", not "90".
  · CLEARED, THE KEY GOES (§50.6): a row put back is byte-identical to one that
    never had a unit picked, or every visit carries a phantom change into the
    next save and a non-office save is refused for the rest of the cycle.
  · PROSE IS SAFE, which is the guard that makes this shippable on a live
    tenant. A target somebody typed as words is not this row's unit, so it is
    never appended to the next bare number ("30 Maintain share"), and picking a
    unit on such a row still gives "TBD %" exactly as it does today (§96.2).
  · FILL MODE IS UNCHANGED, deliberately: a custodian still sets a unit only
    where a target exists, and a blank row stays the office's. Asserted so the
    limit is a decision somebody can find rather than a drift.
  · THE OUTCOME SIDE ANSWERS THE SAME, because §251 made one reader serve both.

Run:  SMP_CHROME=/opt/pw-browsers/chromium python3 qa-run.py checks/unit-before-number.py
"""
import pathlib
from playwright.sync_api import sync_playwright

HERE = pathlib.Path(__file__).resolve().parent
FILE = HERE.parent / "strategy-management-platform.html"
bad = 0


def ck(w, ok, x=""):
    global bad
    if not ok:
        bad += 1
    print(("  ok      " if ok else "  FAIL    ") + w + (("  — " + str(x)) if not ok and x else ""))


# THE COLUMN IS FOUND BY ITS HEADING, never by an index (§94.8). The three
# tables carry different columns in different orders — a unit's objectives hold
# a 3-year the measures do not — and an index would be a literal that the next
# column added quietly invalidates while the check went on passing (§51.11).
CELLS = """
  (a) => {
    const rowText = a.rowText, unitHead = a.unitHead, valHead = a.valHead;
    const said = r => (r.textContent || "") +
      [...r.querySelectorAll('input,textarea')].map(i => i.value || "").join(" ");
    const tables = [...document.querySelectorAll('#panel table')];
    for (const t of tables) {
      const heads = [...t.querySelectorAll('thead th')].map(h => h.textContent.trim());
      const ui = heads.findIndex(h => h.toLowerCase() === unitHead.toLowerCase());
      const vi = heads.findIndex(h => h.toLowerCase() === valHead.toLowerCase());
      if (ui < 0 || vi < 0) continue;
      const row = [...t.querySelectorAll('tbody tr')].find(r => said(r).indexOf(rowText) >= 0);
      if (!row || !row.children[ui]) continue;
      return { ui: ui, vi: vi,
               unitHTML: row.children[ui].innerHTML,
               hasSelect: !!row.children[ui].querySelector('select'),
               opts: [...row.children[ui].querySelectorAll('option')].map(o => o.value),
               shows: (row.children[ui].querySelector('select') || {}).value,
               says: row.textContent.replace(/\\s+/g, ' ') };
    }
    return null;
  }
"""

PICK = """
  (a) => {
    const said = r => (r.textContent || "") +
      [...r.querySelectorAll('input,textarea')].map(i => i.value || "").join(" ");
    const tables = [...document.querySelectorAll('#panel table')];
    for (const t of tables) {
      const heads = [...t.querySelectorAll('thead th')].map(h => h.textContent.trim());
      const ui = heads.findIndex(h => h.toLowerCase() === a.unitHead.toLowerCase());
      if (ui < 0) continue;
      const row = [...t.querySelectorAll('tbody tr')].find(r => said(r).indexOf(a.rowText) >= 0);
      const sel = row && row.children[ui] ? row.children[ui].querySelector('select') : null;
      if (!sel) continue;
      sel.value = a.unit;
      sel.dispatchEvent(new Event('change', { bubbles: true }));
      return true;
    }
    return false;
  }
"""

TYPE = """
  (a) => {
    const said = r => (r.textContent || "") +
      [...r.querySelectorAll('input,textarea')].map(i => i.value || "").join(" ");
    const tables = [...document.querySelectorAll('#panel table')];
    for (const t of tables) {
      const heads = [...t.querySelectorAll('thead th')].map(h => h.textContent.trim());
      const vi = heads.findIndex(h => h.toLowerCase() === a.valHead.toLowerCase());
      if (vi < 0) continue;
      const row = [...t.querySelectorAll('tbody tr')].find(r => said(r).indexOf(a.rowText) >= 0);
      const inp = row && row.children[vi] ? row.children[vi].querySelector('input') : null;
      if (!inp) continue;
      inp.value = a.text;
      inp.dispatchEvent(new Event('change', { bubbles: true }));
      return true;
    }
    return false;
  }
"""

with sync_playwright() as pw:
    b = pw.chromium.launch()
    pg = b.new_page(viewport={"width": 1500, "height": 1000})
    errs = []
    pg.on("pageerror", lambda e: errs.append(str(e)))
    pg.on("console", lambda m: errs.append(m.text) if m.type == "error" else None)
    pg.goto("file://" + str(FILE))
    pg.wait_for_timeout(900)

    print("\n── 1 · the reader knows a unit from a number and from prose")
    r = pg.evaluate("""() => ({
      bare:   unitOfTarget("%"),
      spaced: unitOfTarget("SQM"),
      money:  unitOfTarget("6.2B EGP"),
      plain:  unitOfTarget("30"),
      prose:  unitOfTarget("Maintain share"),
      tbd:    unitOfTarget("TBD"),
      empty:  unitOfTarget(""),
      keepNum:   targetKeep("6.2B EGP"),
      keepUnit:  targetKeep("%"),
      keepProse: targetKeep("TBD")
    })""")
    ck("a target holding nothing but a unit reads as that unit", r["bare"] == "%", r)
    ck("...a worded one too", r["spaced"] == "SQM", r)
    ck("a number with a unit still reads its unit", r["money"] == "B EGP", r)
    ck("a bare number has none", r["plain"] == "", r)
    # THE GUARD THAT MAKES THIS SAFE ON A LIVE TENANT. Reading prose as the
    # row's unit would append it to the next bare number typed into the other
    # horizon — "30 Maintain share" — silently, and a target written as words
    # is a real thing on somebody's plan.
    ck("PROSE IS NOT A UNIT — 'Maintain share' would corrupt the next number",
       r["prose"] == "" and r["tbd"] == "", r)
    ck("nothing is nothing", r["empty"] == "", r)
    ck("what survives in front of a unit: the number", r["keepNum"] == "6.2", r)
    ck("...nothing at all, where the field held only a unit", r["keepUnit"] == "", r)
    ck("...and prose exactly as typed (§96.2)", r["keepProse"] == "TBD", r)

    print("\n── 2 · a unit-only target is still a gap, on the page and on the server")
    g = pg.evaluate("""() => ({
      unitOnly:  SMPRules.gapEmpty("target", { target: "%" }),
      unitOnly3: SMPRules.gapEmpty("target3y", { target3y: "SQM" }),
      real:      SMPRules.gapEmpty("target", { target: "90%" }),
      blank:     SMPRules.gapEmpty("target", { target: "" }),
      missing:   SMPRules.gapMissing("measure", { dir:"\\u2265", target:"%", compile:"Sum" }),
      scored:    measureDue({ target: "%", compile: "Latest" })
    })""")
    ck("a target holding only a unit counts as MISSING", g["unitOnly"] is True, g)
    ck("...the 3-year one as well", g["unitOnly3"] is True, g)
    ck("a real target does not", g["real"] is False, g)
    ck("a blank one still does", g["blank"] is True, g)
    ck("...and the row names `target` among what it owes", "target" in (g["missing"] or []), g)
    # THE COUNT AND THE SCORE ASK ONE FUNCTION (§249's rule, §53.5). A build
    # where they disagreed would count the row as answered while refusing to
    # score it, or score a row the page says is empty.
    ck("...and the score refuses it too, from the same test", g["scored"] is None, g)

    print("\n── 3 · A BUSINESS UNIT · Strategy › Overview — key objectives")
    pg.evaluate("""() => {
      const m = UNITS.mobile.keyObjectives[0];
      m.target = ""; delete m.target3y; delete m.pend;
      current = "mobile"; currentSub = "strategy"; CURSEC.strategy = "foundation";
      EDIT_PAGE['foundation'] = true; paint();
    }""")
    pg.wait_for_timeout(600)
    name = pg.evaluate("() => UNITS.mobile.keyObjectives[0].name")
    c = pg.evaluate(CELLS, {"rowText": name, "unitHead": "Unit", "valHead": "This year"})
    ck("the Unit cell on a row with NO target is a picker",
       bool(c and c["hasSelect"]), (c or {}).get("unitHTML"))
    ck("...offering the platform's own list",
       (c or {}).get("opts") == pg.evaluate("() => TARGET_UNITS"), (c or {}).get("opts"))
    ck("...showing nothing chosen yet", (c or {}).get("shows") == "", c)
    before = pg.evaluate("() => gapTotal('mobile')")
    pg.evaluate(PICK, {"rowText": name, "unitHead": "Unit", "unit": "%"})
    pg.wait_for_timeout(250)
    st = pg.evaluate("""() => { const m = UNITS.mobile.keyObjectives[0];
      return { t: m.target, has3: ('target3y' in m), keys: Object.keys(m),
               gap: gapTotal('mobile'), owes: SMPRules.gapMissing("ko", m) }; }""")
    ck("picking a unit holds it ALONE in this year's target", st["t"] == "%", st)
    ck("...and never writes the 3-year one, which some tables do not draw",
       st["has3"] is False, st)
    ck("...the row goes on owing its target", "target" in (st["owes"] or []), st)
    ck("...and the unit's gap count does NOT fall", st["gap"] == before, [before, st["gap"]])
    pg.evaluate("() => paint()"); pg.wait_for_timeout(400)
    pg.evaluate(TYPE, {"rowText": name, "valHead": "This year", "text": "90"})
    pg.wait_for_timeout(250)
    joined = pg.evaluate("""() => { const m = UNITS.mobile.keyObjectives[0];
      return { t: m.target, gap: gapTotal('mobile') }; }""")
    ck("typing the number joins the two — 90 becomes 90%", joined["t"] == "90%", joined)
    ck("...and only THEN does the count fall", joined["gap"] == before - 1,
       [before, joined["gap"]])

    print("\n── 4 · cleared, the row is byte-identical to one never touched (§50.6)")
    trip = pg.evaluate("""() => {
      const m = UNITS.mobile.keyObjectives[1];
      const was = JSON.stringify(m);
      delete m.target; delete m.target3y;
      const blank = JSON.stringify(m);
      setTargetUnit(m, "%");
      const held = m.target;
      setTargetUnit(m, "");
      const back = JSON.stringify(m);
      return { held: held, same: blank === back, blank: blank, back: back, was: was };
    }""")
    ck("the unit is held on its own", trip["held"] == "%", trip)
    ck("...and clearing it DELETES the key rather than leaving \"\"",
       trip["same"] is True, [trip["blank"], trip["back"]])

    print("\n── 5 · prose on the row is left exactly as it was typed")
    pr = pg.evaluate("""() => {
      const m = { target: "TBD", target3y: "" };
      setTargetUnit(m, "%");
      const n = { target: "", target3y: "Maintain share" };
      const inherit = unitInherit(n)("30");
      return { tbd: m.target, inherit: inherit };
    }""")
    # Today's behaviour on a prose target is to append the unit ("TBD %"), and
    # §251 must not quietly change it — this is the assertion that says so.
    ck("picking a unit on a worded target still gives 'TBD%' as it always did",
       pr["tbd"] == "TBD%", pr)
    ck("...and a bare number never inherits prose as a unit", pr["inherit"] == "30", pr)

    print("\n── 6 · A BUSINESS UNIT · Strategy › Plan — a pillar's key measures")
    # The table Islam was looking at. Two of his four measures had no target,
    # so the only rows that needed a unit picking were the ones without one.
    pg.evaluate("""() => {
      EDIT_PAGE['foundation'] = false;
      const m = UNITS.mobile.items[0].measures[0];
      m.target = ""; delete m.target3y; delete m.pend;
      current = "mobile"; currentSub = "strategy"; CURSEC.strategy = "plan";
      RAIL['mobile'] = UNITS.mobile.items[0].code || RAIL['mobile'];
      EDIT_PAGE['plan'] = true; paint();
    }""")
    pg.wait_for_timeout(700)
    mname = pg.evaluate("() => UNITS.mobile.items[0].measures[0].name")
    mc = pg.evaluate(CELLS, {"rowText": mname, "unitHead": "Unit", "valHead": "Target"})
    ck("the measure with no target gets the picker", bool(mc and mc["hasSelect"]),
       (mc or {}).get("unitHTML"))
    ck("...and the dead end that used to stand there is gone — no 'set a target "
       "first' span, and the dash is now the picker saying nothing is chosen",
       "Set a target first" not in ((mc or {}).get("unitHTML") or "")
       and "why" not in ((mc or {}).get("unitHTML") or ""), (mc or {}).get("unitHTML"))
    pg.evaluate(PICK, {"rowText": mname, "unitHead": "Unit", "unit": "M EGP"})
    pg.wait_for_timeout(250)
    ms = pg.evaluate("""() => { const m = UNITS.mobile.items[0].measures[0];
      return { t: m.target, has3: ('target3y' in m),
               owes: SMPRules.gapMissing("measure", m) }; }""")
    ck("a worded unit is held alone too", ms["t"] == "M EGP", ms)
    ck("...still with no 3-year written — that column is not even drawn here",
       ms["has3"] is False, ms)
    ck("...and the measure still owes its target", "target" in (ms["owes"] or []), ms)
    pg.evaluate("() => paint()"); pg.wait_for_timeout(400)
    pg.evaluate(TYPE, {"rowText": mname, "valHead": "Target", "text": "37.5"})
    pg.wait_for_timeout(250)
    mj = pg.evaluate("() => UNITS.mobile.items[0].measures[0].target")
    ck("...and the number joins it as ONE token, the plan's own habit for a "
       "scaled currency (§199.4) — 37.5M EGP", mj == "37.5M EGP", mj)

    print("\n── 7 · reading mode is untouched")
    pg.evaluate("() => { EDIT_PAGE['plan'] = false; paint(); }")
    pg.wait_for_timeout(500)
    rd = pg.evaluate("""() => {
      const heads = [...document.querySelectorAll('#panel table thead th')]
        .map(h => h.textContent.trim());
      return { unitCol: heads.filter(h => h.toLowerCase() === 'unit').length,
               says: (document.querySelector('#panel') || {}).textContent
                       .indexOf('37.5M EGP') >= 0 };
    }""")
    ck("no Unit column when the pen is shut", rd["unitCol"] == 0, rd)
    ck("...and the figure still reads whole, unit and all", rd["says"] is True, rd)

    print("\n── 8 · THE GROUP · Foundation — the same table one level up")
    pg.evaluate("""() => {
      const m = GROUP.keyObjectives[0];
      m.target = ""; delete m.target3y; delete m.pend;
      /* THE GROUP'S FOUNDATION IS A TAB, NOT A SECTION OF ONE. A unit reaches
         it through Strategy › Overview; the group carries Performance ·
         Foundation · Focus · Temple · Weighting of its own, so asking for
         "strategy" here lands silently back on Performance and the check
         measures a page with no objectives table on it at all (§50.6). */
      current = "group"; currentSub = "foundation";
      EDIT_PAGE['foundation'] = true; paint();
    }""")
    pg.wait_for_timeout(600)
    gname = pg.evaluate("() => GROUP.keyObjectives[0].name")
    gc = pg.evaluate(CELLS, {"rowText": gname, "unitHead": "Unit", "valHead": "This year"})
    ck("the group's objective with no target gets the picker",
       bool(gc and gc["hasSelect"]), (gc or {}).get("unitHTML"))
    pg.evaluate(PICK, {"rowText": gname, "unitHead": "Unit", "unit": "B EGP"})
    pg.wait_for_timeout(250)
    gs = pg.evaluate("() => GROUP.keyObjectives[0].target")
    ck("...and it holds the unit alone", gs == "B EGP", gs)
    pg.evaluate("() => { EDIT_PAGE['foundation'] = false; paint(); }")
    pg.wait_for_timeout(300)

    print("\n── 9 · A SUPPORTING FUNCTION · Overview — both formats")
    fns = pg.evaluate("""() => {
      const out = {};
      Object.keys(FUNCTIONS).forEach(k => {
        const f = FUNCTIONS[k];
        if (f.format === "pillars") out.pillars = out.pillars || k;
        else out.caps = out.caps || k;
      });
      return out;
    }""")
    for shape in ("caps", "pillars"):
        fk = fns.get(shape)
        if not fk:
            ck("a %s function exists to measure" % shape, False, fns)
            continue
        # THE STATE IS MADE, NOT WAITED FOR (§94.2). The demo's one
        # pillars function carries no key objective at all, so a check that
        # only measured what ships would report this surface as unmeasurable
        # while quietly asserting nothing about it (§54.5).
        got = pg.evaluate("""(fk) => {
          const f = FUNCTIONS[fk];
          let list = null;
          if (f.format === "pillars") {
            EDIT_PAGE['capfoundation'] = true;
            list = unitLikeWritable("fn:" + fk).keyObjectives;
            if (!list.length) list.push({ id: "fn-" + fk + "-KO1",
              name: "Made for the check \u00b7 " + fk, dir: "\u2265", compile: "Latest" });
          } else { const c = (GROUP.capabilities || []).find(c => c.fn === fk);
                   list = c ? c.keyObjectives : null; }
          if (!list || !list.length) return null;
          const m = list[0];
          m.target = ""; delete m.target3y; delete m.pend;
          current = "fn:" + fk; currentSub = "strategy";
          EDIT_PAGE['capfoundation'] = true; paint();
          return { name: m.name };
        }""", fk)
        if not got:
            ck("the %s function has an objective to measure" % shape, False, fk)
            continue
        pg.wait_for_timeout(650)
        fc = pg.evaluate(CELLS, {"rowText": got["name"], "unitHead": "Unit", "valHead": "This year"})
        ck("a %s function's objective with no target gets the picker" % shape,
           bool(fc and fc["hasSelect"]), (fc or {}).get("unitHTML"))
        pg.evaluate(PICK, {"rowText": got["name"], "unitHead": "Unit", "unit": "#"})
        pg.wait_for_timeout(250)
        fs = pg.evaluate("""(fk) => {
          const f = FUNCTIONS[fk];
          const list = f.format === "pillars"
            ? unitLikeWritable("fn:" + fk).keyObjectives
            : ((GROUP.capabilities || []).find(c => c.fn === fk) || {}).keyObjectives;
          return { t: list[0].target, has3: ('target3y' in list[0]) };
        }""", fk)
        ck("...held alone on the %s format too" % shape, fs["t"] == "#", fs)
        ck("...with no 3-year written (%s)" % shape, fs["has3"] is False, fs)
    pg.evaluate("() => { EDIT_PAGE['capfoundation'] = false; paint(); }")
    pg.wait_for_timeout(300)

    print("\n── 10 · the workbook puts the unit in the Unit column")
    # §22: AN UPLOAD AUTHORS A PLAN, so what the file says is what the plan
    # becomes — a unit-only target written into the Value column would come
    # back as a value of "%", and the round trip would stop being a fixed
    # point. `splitTarget` alone reads a value FOLLOWED BY a unit, which is
    # why the workbook asks the same pair reader the screen does.
    wb = pg.evaluate("""() => ({
      unitOnly: targetPair("%"),
      worded:   targetPair("SQM"),
      number:   targetPair("6.2B EGP"),
      prose:    targetPair("TBD"),
      blank:    targetPair(""),
      /* THE FIXED POINT: what the file carries must rejoin to what is stored,
         so a download and an untouched upload changes nothing (§161). */
      rejoin:   targetFromPair("%", targetPair("%").value, targetPair("%").unit),
      /* A REPORTED figure is NOT a plan target: an emptied box must stay
         empty, never become the unit on its own (§243). */
      clearedFigure: joinTarget("8 M EGP", "", "M EGP"),
      realStill: targetFromPair("6.2B EGP", "6.2", "B EGP"),
      unchanged: targetChanged("%", targetPair("%").value, targetPair("%").unit)
    })""")
    ck("a unit-only target writes the UNIT column, not the value",
       wb["unitOnly"] == {"value": "", "unit": "%"}, wb)
    ck("...a worded unit too", wb["worded"] == {"value": "", "unit": "SQM"}, wb)
    ck("a real target is split exactly as it always was",
       wb["number"] == {"value": "6.2", "unit": "B EGP"}, wb)
    ck("...and prose stays in the value, where it was typed",
       wb["prose"] == {"value": "TBD", "unit": ""}, wb)
    ck("nothing stays nothing", wb["blank"] == {"value": "", "unit": ""}, wb)
    ck("the round trip is a FIXED POINT — it rejoins to itself",
       wb["rejoin"] == "%", wb)
    ck("...and a real target rejoins exactly as it always did",
       wb["realStill"] == "6.2B EGP", wb)
    ck("...while an emptied REPORTED figure stays empty, never the bare unit",
       wb["clearedFigure"] == "", wb)
    ck("...so an untouched upload reports NO change", wb["unchanged"] is False, wb)

    print("\n── 11 · a tactic's outcome answers from the SAME reader (§248, §251)")
    oc = pg.evaluate("""() => {
      const t = { outTarget: "%" };
      const u = outUnitOf(t);
      const joined = nextTargetUnit({ outTarget: "6" }, "M EGP");
      const kept = nextTargetUnit({ outTarget: "TBD" }, "%");
      return { u: u, joined: joined, kept: kept };
    }""")
    ck("an outcome holding only a unit still reads it", oc["u"] == "%", oc)
    ck("...a number joins it the plan's way", oc["joined"] == "6 M EGP", oc)
    # §251 UNIFIED THE TWO READERS, and this is the behaviour that moved: the
    # outcome used to drop prose on the floor when a unit was picked. It now
    # keeps it, which is what the measures column has always done.
    ck("...and prose is kept rather than dropped", oc["kept"] == "TBD%", oc)

    print("\n── 12 · fill mode is DELIBERATELY unchanged (§201.2)")
    fill = pg.evaluate("""() => {
      const u = "mobile";
      ACCESS.custodian = ACCESS.custodian || {};
      ACCESS.custodian.a_unit_own_strat = "fill";
      ACCESS.custodian.a_unit_own = "edit";
      const kos = UNITS[u].keyObjectives;
      kos[0].target = ""; delete kos[0].target3y; delete kos[0].pend;
      kos[1].target3y = "30"; kos[1].target = ""; delete kos[1].pend;
      VIEWER = (UNIT_ROLES[u] || {}).custodian; leaveModes();
      current = u; currentSub = "strategy"; CURSEC.strategy = "foundation";
      paint();
      return { blank: kos[0].name, hasOne: kos[1].name };
    }""")
    pg.wait_for_timeout(500)
    door = pg.query_selector('[data-fillcta="foundation"]')
    ck("the custodian still holds a fill way in", door is not None)
    if door:
        door.click()
        pg.wait_for_timeout(650)
        fb = pg.evaluate(CELLS, {"rowText": fill["blank"], "unitHead": "Unit", "valHead": "This year"})
        fh = pg.evaluate(CELLS, {"rowText": fill["hasOne"], "unitHead": "Unit", "valHead": "This year"})
        ck("a row with NO target stays the office's — the filler gets no picker",
           bool(fb) and fb["hasSelect"] is False, (fb or {}).get("unitHTML"))
        ck("...while a row whose target exists is still offered one",
           bool(fh) and fh["hasSelect"] is True, (fh or {}).get("unitHTML"))
    pg.evaluate("() => { VIEWER = null; leaveModes(); paint(); }")
    pg.wait_for_timeout(300)

    ck("no console errors", not errs, errs[:3])
    b.close()

print("\nall passed" if not bad else "\n%d FAILED" % bad)
raise SystemExit(1 if bad else 0)
