"""A KEY OBJECTIVE'S UNIT, WITH NOTHING NEW STORED (§199).

Islam: *"for the key objectives we need a unit, as some are numbers, some
might be money and some are SQM."* He picked Option A — a Unit column — from
two drawn.

THE FINDING THAT SHAPED THE BUILD. There is no unit field and there does not
need to be: the unit has always been typed INTO the target (`"6.2B EGP"`,
`"60000 SQM"`, `"100#"`), and the platform has held a matched pair for taking
that apart and putting it back since the upload template gained a Unit column.
Measured before anything was written: 178 targets across every unit,
capability, group objective and pillar measure, ZERO round-trip failures. So
the column is a view of what is already stored — `target` goes on holding the
whole string, all 103 places that read it keep working, and there is no
migration.

WHAT IS ASSERTED:
  · THE ROUND TRIP, on every target the plan holds. This is the whole licence
    for the feature; if it ever stops being true, the column starts rewriting
    people's plans and this is the only thing that would say so.
  · The column is drawn only where a row HAS a unit (§41's budget).
  · The values lose the unit and keep the number.
  · The chip layout is deliberately UNTOUCHED — one figure with nothing beside
    it to line up against gains nothing from splitting.
  · Writing a unit rewrites the targets, with the separator taken from the NEW
    unit ("100#" → "trips" must not give "100trips").
  · AN UNCHANGED UNIT WRITES NOTHING (§50.6, §42) — re-typing what is there
    must leave the plan byte-identical, or every visit puts a phantom change
    into the next save and a non-office save is refused for the rest of the
    cycle.
  · A row with NO target offers no box, because the unit lives inside the
    target and there would be nowhere to put it (§61).
  · It is the OFFICE'S, not the filler's: a unit is not a gap (46 of the 178
    carry none and are complete without one), so it must not join the count.

Run:  SMP_CHROME=/opt/pw-browsers/chromium python3 qa-run.py checks/objective-unit.py
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


with sync_playwright() as pw:
    b = pw.chromium.launch()
    pg = b.new_page(viewport={"width": 1500, "height": 1000})
    errs = []
    pg.on("pageerror", lambda e: errs.append(str(e)))
    pg.on("console", lambda m: errs.append(m.text) if m.type == "error" else None)
    pg.goto("file://" + str(FILE)); pg.wait_for_timeout(800)

    print("\n── 1 · the licence: every stored target survives the round trip")
    r = pg.evaluate("""() => {
      const vals = [];
      Object.keys(UNITS).forEach(k => {
        (UNITS[k].keyObjectives||[]).forEach(m =>
          ['target','target3y'].forEach(f => { if (m[f]) vals.push(m[f]); }));
        (UNITS[k].items||[]).forEach(p => (p.measures||[]).forEach(m => {
          if (m.target) vals.push(m.target); })); });
      (GROUP.capabilities||[]).forEach(c => (c.keyObjectives||[]).forEach(m => {
        if (m.target) vals.push(m.target); }));
      (GROUP.keyObjectives||[]).forEach(m =>
        ['target','target3y'].forEach(f => { if (m[f]) vals.push(m[f]); }));
      const bad = vals.filter(v => {
        const s = splitTarget(v);
        return joinTarget(v, s.value, s.unit) !== String(v).trim(); });
      return { n: vals.length, bad: bad.slice(0, 8) };
    }""")
    ck("there are targets to test at all", r["n"] > 100, r["n"])
    ck("all %d split and rejoin to exactly what was stored" % r["n"], not r["bad"], r["bad"])

    print("\n── 2 · the setter")
    t = pg.evaluate("""() => {
      const go = (a, b2, u) => { const m = {target:a, target3y:b2};
        setTargetUnit(m, u); return [m.target, m.target3y]; };
      return { word: go("100","1500","SQM"),
               same: go("30%","45%","%"),
               swap: go("2.4B EGP","6.2B EGP","SQM"),
               bare: go("60000","","SQM"),
               clear: go("30%","45%","") };
    }""")
    ck("a spaced unit gets its space", t["word"] == ["100 SQM", "1500 SQM"], t["word"])
    ck("a SYMBOL unit gets none", t["same"] == ["30%", "45%"], t["same"])
    ck("both horizons take it", t["swap"] == ["2.4 SQM", "6.2 SQM"], t["swap"])
    ck("an empty horizon is left empty, not given a bare unit",
       t["bare"] == ["60000 SQM", ""], t["bare"])
    ck("clearing the unit leaves the numbers", t["clear"] == ["30", "45"], t["clear"])

    print("\n── 2b · the separator is the PLAN's own habit, not a rule (§199.4)")
    # `%` and `#` and a SCALED currency are written against the number; a bare
    # currency and a word take a space. Read off the shipped data, so this
    # asserts the convention rather than inventing one.
    sep = pg.evaluate("""() => {
      const out = {};
      TARGET_UNITS.forEach(u => { const m = {target:"6.2B EGP"};
        setTargetUnit(m, u); out[u || '(none)'] = m.target; });
      return out; }""")
    ck("a scaled currency is written tight — 6.2B EGP / 6.2M EGP",
       sep.get("B EGP") == "6.2B EGP" and sep.get("M EGP") == "6.2M EGP", sep)
    ck("a bare currency takes a space — 6.2 EGP", sep.get("EGP") == "6.2 EGP", sep)
    ck("% and # are tight", sep.get("%") == "6.2%" and sep.get("#") == "6.2#", sep)
    ck("clearing leaves the number alone", sep.get("(none)") == "6.2", sep)

    print("\n── 2c · anything the pen writes still round-trips")
    # THE LICENCE AGAIN, from the writing side. §1 proves it of what is stored;
    # this proves it of what this feature will store from now on — a value the
    # reader could not take apart again would be a plan the pen had broken.
    # §251 MOVED THIS ASSERTION'S SCOPE, and it is REWRITTEN rather than
    # dropped (§218, §214.3 — a check left asserting a rule a decision has
    # deliberately reversed is how a build drifts back through it unnoticed).
    # Every unit but one is written BESIDE a number and so must survive
    # splitTarget/joinTarget; `Y/N` is the unit whose value part is always
    # empty, so splitTarget cannot read it back BY DESIGN and the function
    # that answers for it is `targetUnitOf`. Both are asserted, or the
    # exemption would be a hole rather than a rule.
    rt = pg.evaluate("""() => {
      const bad = [];
      TARGET_UNITS.concat(["B USD"]).filter(u => u !== SMPRules.YN_UNIT).forEach(u => {
        const m = {target:"6.2B EGP"}; setTargetUnit(m, u);
        const s = splitTarget(m.target);
        if (joinTarget(m.target, s.value, s.unit) !== m.target) bad.push(["rejoin", u, m.target]);
        if (s.unit !== String(u).trim()) bad.push(["read back", u, s.unit]);
      });
      return bad; }""")
    ck("every NUMBER-carrying unit the picker offers writes a value that reads back as itself",
       not rt, rt)
    yn = pg.evaluate("""() => {
      const m = {target:"6.2B EGP", target3y:"9.0B EGP"};
      setTargetUnit(m, SMPRules.YN_UNIT);
      const after = [m.target, m.target3y, targetUnitOf(m)];
      setTargetUnit(m, "%");                       /* and back out again */
      return { after: after, out: [m.target, m.target3y, targetUnitOf(m)] };
    }""")
    # §251.2 REVERSED §251's OWN FIRST BUILD, at Islam's instruction — *"even
    # they are set before they need to be dimmed even by keeping the values
    # but as if they are not counted anymore"* — so these two are REWRITTEN
    # rather than deleted (§218), and the reversal is recorded here where a
    # later build would otherwise drift back through them unnoticed. Y/N is
    # written like every other unit: beside the figure, which stops being
    # counted and is not destroyed.
    ck("Y/N is written BESIDE the figure, on both horizons — nothing destroyed",
       yn["after"] == ["6.2 Y/N", "9.0 Y/N", "Y/N"], yn["after"])
    ck("...and changing your mind hands the figure straight back",
       yn["out"] == ["6.2%", "9.0%", "%"], yn["out"])

    print("\n── 3 · an unchanged unit writes NOTHING (§50.6)")
    same = pg.evaluate("""() => {
      const m = {target:"2.4B EGP", target3y:"6.2B EGP", name:"x"};
      const was = JSON.stringify(m);
      setTargetUnit(m, targetUnitOf(m));
      return { was: was, now: JSON.stringify(m) };
    }""")
    ck("the row is byte-identical afterwards", same["was"] == same["now"], same)

    print("\n── 4 · the reading view keeps the unit ON the figure (§199.4)")
    # §199 split it into a column of its own and Islam looked at it: *"let the
    # unit be set in the edit table, but in the view attach the unit to the
    # target."* The column belonged where the unit is SET, not where the plan
    # is read — a column of units lines "B EGP" up against "%" and gives the
    # eye nothing, while a figure needs to be complete where it stands.
    pg.click('[data-u="logistics"]'); pg.wait_for_timeout(400)
    pg.click('[data-s="strategy"]'); pg.wait_for_timeout(300)
    pg.click('[data-sub2="found"]'); pg.wait_for_timeout(600)
    # §243: there is one layout now, so nothing selects it.
    pg.evaluate("() => { SHOW_KO_THIS_YEAR = true; paint(); }")
    pg.wait_for_timeout(500)
    v = pg.evaluate("""() => {
      const h = document.querySelector('.ohead');
      return { head: h ? [...h.children].map(c=>c.textContent.trim()) : null,
               rows: [...document.querySelectorAll('.orow')].slice(0,4).map(r =>
                 [...r.children].map(c => (c.innerText||'').replace(/\\s+/g,' ').trim())),
               strayCol: !!document.querySelector('.orow .ou') };
    }""")
    ck("there is NO Unit column in the reading view",
       v["head"] and "Unit" not in v["head"], v["head"])
    ck("...and no cell left behind from one (§24)", not v["strayCol"], v)
    ck("a money figure is complete where it stands",
       any(c == "2.4B EGP" for r in v["rows"] for c in r), v["rows"][:2])
    ck("...and so is a percentage",
       any(c.endswith("%") for r in v["rows"] for c in r), v["rows"])

    # §243 DELETED THE CHIP LAYOUT at Islam's instruction: *"the other toggle
    # that shows the objective in table or cards — remove it and make the view
    # in table only."* This asserted that the chips still carried the whole
    # figure; what it was protecting — that the unit stays ON the figure and is
    # not split into a column of its own (§199.4) — is still true and is now
    # asserted of the only layout there is. §51.11 in the other direction: a
    # check keyed on markup that has gone must be REWRITTEN, not deleted, or
    # nothing guards what it was guarding.
    print("\n── 6 · one layout, and it carries the whole figure (§243)")
    lay = pg.evaluate("""() => { paint();
      return { chipsGone: !document.querySelector('.ochip'),
               switchGone: !document.querySelector('[data-kov]'),
               noGlobal: typeof KO_VIEW === 'undefined',
               figure: (()=>{ const c=document.querySelector('.orow .ot');
                              return c ? c.textContent.trim() : null; })() }; }""")
    ck("the chip layout is gone", lay["chipsGone"], lay)
    ck("...and so is the switch that chose it", lay["switchGone"] and lay["noGlobal"], lay)
    ck("the table's figure still carries its unit (§199.4)",
       lay["figure"] and "EGP" in lay["figure"], lay)
    pg.wait_for_timeout(300)

    print("\n── 7 · the editor writes the plan, and only the office's pen has it")
    pg.evaluate("() => { EDIT_PAGE['foundation'] = true; paint(); }")
    pg.wait_for_timeout(500)
    # §199.4: IT IS A PICKER NOW, NOT A BOX. Islam: "the financial units can be
    # B EGP or M EGP or EGP only" and "let's commit to #" — both are the same
    # decision, and a fixed list is the vocabulary maintenance not happening.
    w = pg.evaluate("""() => {
      const heads = [...document.querySelectorAll('.koband thead th')].map(t=>t.textContent.trim());
      const row = document.querySelectorAll('.koband tbody tr')[0];
      const sel = row.querySelectorAll('td')[2].querySelector('select');
      if (!sel) return { heads: heads, noPicker: row.querySelectorAll('td')[2].innerHTML.slice(0,90) };
      const m = UNITS.logistics.keyObjectives[0];
      const was = [m.target, m.target3y];
      const opts = [...sel.options].map(o => o.value);
      const showing = sel.value;
      sel.value = "SQM"; sel.dispatchEvent(new Event('change', {bubbles:true}));
      const now = [m.target, m.target3y];
      m.target = was[0]; m.target3y = was[1];
      return { heads: heads, opts: opts, showing: showing, was: was, now: now };
    }""")
    ck("the pen's table has a Unit column", "Unit" in (w.get("heads") or []), w.get("heads"))
    ck("...and it is a PICKER, not a free box", not w.get("noPicker"), w)
    ck("...showing what the row already holds", w.get("showing") == "B EGP", w.get("showing"))
    ck("...offering the three currencies and nothing else made up",
       [o for o in (w.get("opts") or []) if "EGP" in o] == ["EGP", "M EGP", "B EGP"],
       w.get("opts"))
    ck("...and # among them, committed to rather than a placeholder",
       "#" in (w.get("opts") or []), w.get("opts"))
    ck("...and picking reaches the stored plan",
       w.get("now") == ["1.6 SQM", "2.4 SQM"], w)

    print("\n── 7b · a unit the list does not offer is kept (§96.2, §114)")
    # §239.5 MOVED THIS ASSERTION'S EXAMPLE. It was keyed on "M USD", which
    # was the shipped plan's own outsider -- and dollars are now ON the list at
    # Islam's instruction, so the assertion would have gone on passing while
    # guarding nothing (§51.11). It asks about a unit that is genuinely outside
    # now, and asserts the dollars are offered outright.
    keep = pg.evaluate("() => targetUnitOpts('B USD')")
    ck("a stored unit the list does not carry is still offered",
       "B USD" in keep and keep.index("B USD") == 1, keep)
    ck("...and the standard list is still all there",
       all(u in keep for u in ["%", "#", "EGP", "M EGP", "B EGP"]), keep)
    offered = pg.evaluate("() => targetUnitOpts('')")
    ck("the dollars are on the list to be CHOSEN, not merely kept (§239.5)",
       "K USD" in offered and "M USD" in offered, offered)
    ck("...and read as one token, like their Egyptian twins",
       pg.evaluate("""() => { const m = {target:"6.2B EGP"};
         setTargetUnit(m, "M USD"); return m.target; }""") == "6.2M USD")

    print("\n── 7d · a number typed into a row INHERITS its unit (§199.6)")
    # Islam, from a group objective reading `3-year 30` with no unit at all:
    # "the objectives need to inherit the unit automatically as they are
    # entered as a number in the value cell." §199 only wrote the unit onto
    # targets that ALREADY EXISTED, so setting the unit and then filling the
    # row — the obvious order — lost it.
    inh = pg.evaluate("""() => {
      const t = (row, typed) => unitInherit(row)(typed);
      return { pct:   t({target:"", target3y:"45%"}, "30"),
               tight: t({target:"1.6B EGP"}, "2.4"),
               space: t({target:"33 EGP"}, "28"),
               none:  t({target:"", target3y:"45"}, "30"),
               word:  t({target3y:"45%"}, "TBD"),
               own:   t({target3y:"45%"}, "50 EGP"),
               blank: t({target3y:"45%"}, ""),
               neg:   t({target3y:"45%"}, "-3") };
    }""")
    ck("a bare number takes the row's unit", inh["pct"] == "30%", inh)
    ck("...with the right separator, both ways",
       inh["tight"] == "2.4B EGP" and inh["space"] == "28 EGP", inh)
    ck("a row with no unit is left exactly as typed", inh["none"] == "30", inh)
    ck("something that is NOT a number never inherits — 'TBD%' would be wrong",
       inh["word"] == "TBD", inh)
    ck("a value typed WITH its own unit is what somebody meant (§96.2)",
       inh["own"] == "50 EGP", inh)
    ck("clearing stays cleared", inh["blank"] == "", inh)
    ck("a negative number is still a number", inh["neg"] == "-3%", inh)

    # AND THE WHOLE FLOW, through the real controls, on a row emptied first
    # (§94.2 — the demo has no blank objective to walk).
    pg.evaluate("() => { EDIT_PAGE['foundation'] = true; paint(); }")
    pg.wait_for_timeout(500)
    step = {}
    step["empty"] = pg.evaluate("""() => { const m = UNITS.logistics.keyObjectives[0];
      m.target = ""; m.target3y = ""; paint(); return [m.target3y, m.target]; }""")
    pg.wait_for_timeout(400)
    step["typed30"] = pg.evaluate("""() => {
      const m = UNITS.logistics.keyObjectives[0];
      const i = document.querySelectorAll('.koband tbody tr')[0]
                  .querySelectorAll('td')[3].querySelector('input');
      i.value = "30"; i.dispatchEvent(new Event('change',{bubbles:true}));
      return [m.target3y, m.target]; }""")
    # A FIELD WRITES WITHOUT REPAINTING (§71.2), so on a row that had NO target
    # the Unit picker appears at the next paint rather than instantly. Stated
    # here rather than worked around: repainting under a typing hand is the
    # fault that rule exists to prevent.
    pg.evaluate("() => paint()"); pg.wait_for_timeout(500)
    step["pickedPct"] = pg.evaluate("""() => {
      const m = UNITS.logistics.keyObjectives[0];
      const s = document.querySelectorAll('.koband tbody tr')[0]
                  .querySelectorAll('td')[2].querySelector('select');
      s.value = "%"; s.dispatchEvent(new Event('change',{bubbles:true}));
      return [m.target3y, m.target]; }""")
    pg.wait_for_timeout(400)
    step["typed50"] = pg.evaluate("""() => {
      const m = UNITS.logistics.keyObjectives[0];
      const i = document.querySelectorAll('.koband tbody tr')[0]
                  .querySelectorAll('td')[4].querySelector('input');
      i.value = "50"; i.dispatchEvent(new Event('change',{bubbles:true}));
      return [m.target3y, m.target]; }""")
    ck("typing 30 into an empty row stores it bare", step["typed30"] == ["30", ""], step)
    ck("...picking % then reaches the value already there",
       step["pickedPct"] == ["30%", ""], step)
    ck("...and the NEXT number inherits it without being asked",
       step["typed50"] == ["30%", "50%"], step)
    pg.evaluate("() => { EDIT_PAGE['foundation'] = false; paint(); }")
    pg.wait_for_timeout(300)

    print("\n── 7c · a PILLAR MEASURE gets the same picker (§199.5)")
    # Islam: "for the pillar measures let's do the same fix." Identical shape,
    # identical control, from the IDENTICAL functions — two tables asking one
    # question must not answer it twice (§53.5), which is why the helpers lost
    # their `ko` prefix rather than being copied.
    pg.evaluate("() => { EDIT_PAGE['foundation'] = false; paint(); }")
    pg.click('[data-u="mobile"]'); pg.wait_for_timeout(400)
    pg.click('[data-s="strategy"]'); pg.wait_for_timeout(300)
    pg.click('[data-sub2="plan"]'); pg.wait_for_timeout(700)
    read = pg.evaluate("""() => [...document.querySelectorAll('.pane table tbody tr')]
      .slice(0,2).map(r => [...r.querySelectorAll('td')].map(c=>c.innerText.trim()).slice(0,5))""")
    ck("reading a measure keeps the unit ON the figure",
       any("%" in (c or "") for r in read for c in r), read)
    pg.evaluate("() => { EDIT_PAGE['plan'] = true; paint(); }")
    pg.wait_for_timeout(700)
    pm = pg.evaluate("""() => {
      const tbl = [...document.querySelectorAll('.pane table')]
        .find(t => (t.querySelector('thead')||{}).textContent.indexOf('Measure') > -1);
      if (!tbl) return { noTable: true };
      const row = tbl.querySelector('tbody tr');
      const sel = row.querySelectorAll('td')[3].querySelector('select');
      const last = tbl.querySelector('tbody tr:last-child td[colspan]');
      let was = null, wrote = null;
      if (sel) { const m = UNITS.mobile.items[0].measures[0];
        was = m.target; sel.value = "SQM";
        sel.dispatchEvent(new Event('change',{bubbles:true}));
        wrote = m.target; m.target = was; }
      return { heads: [...tbl.querySelectorAll('thead th')].map(t=>t.textContent.trim()),
               cells: row.querySelectorAll('td').length,
               addSpan: last ? last.getAttribute('colspan') : null,
               opts: sel ? [...sel.options].map(o=>o.value) : null,
               showing: sel ? sel.value : null, was: was, wrote: wrote };
    }""")
    ck("the pen's measures table has a Unit heading",
       pm.get("heads") and pm["heads"][3] == "Unit", pm.get("heads"))
    ck("...and the Add row still reaches the end of it",
       str(pm.get("addSpan")) == str(pm.get("cells")), pm)
    ck("...offering exactly the same list as an objective's",
       pm.get("opts") == pg.evaluate("() => TARGET_UNITS"), pm.get("opts"))
    ck("...and picking reaches the stored plan", pm.get("wrote") == "1 SQM", pm)
    pg.evaluate("() => { EDIT_PAGE['plan'] = false; paint(); }")
    pg.wait_for_timeout(300)
    hid = pg.evaluate("""() => {
      const tbl = [...document.querySelectorAll('.pane table')]
        .find(t => (t.querySelector('thead')||{}).textContent.indexOf('Measure') > -1);
      return tbl ? [...tbl.querySelectorAll('thead th')].map(t=>t.textContent.trim()) : null; }""")
    ck("...and the column is gone again when the pen closes",
       hid and "Unit" not in hid, hid)

    print("\n── 8 · a unit is not a gap")
    g = pg.evaluate("""() => ({
      inGapFields: SMPRules.isGapField('unit'),
      koGaps: SMPRules.GAP_FIELDS.ko }) """)
    ck("'unit' is not a gap field — 46 of 178 targets have none and are complete",
       not g["inGapFields"], g)

    # ── 9 · THE FILLER SETS A MISSING UNIT (§201.2) ────────────────────
    # Islam, from the deployment: "on filling the missing by the custodian
    # he can't fill the unit while he needs to fill if missing." The exact
    # state from his screenshot — a bare 3-year, a missing this-year, an
    # empty Unit — must offer the picker in fill mode, stamp the pend mark,
    # and leave a row whose unit IS set alone (that one stays the office's).
    print("\n── 9 · fill mode offers the picker on a missing unit (§201.2)")
    setup = pg.evaluate("""() => {
      const u = "mobile";
      ACCESS.custodian = ACCESS.custodian || {};
      ACCESS.custodian.a_unit_own_strat = "fill";
      ACCESS.custodian.a_unit_own = "edit";
      const kos = UNITS[u].keyObjectives;
      kos[0].target3y = "30"; kos[0].target = ""; delete kos[0].pend;
      kos[1].target3y = "50%"; kos[1].target = "40%"; delete kos[1].pend;
      const cust = (UNIT_ROLES[u] || {}).custodian;
      VIEWER = cust; leaveModes();
      current = u; currentSub = "strategy"; CURSEC.strategy = "foundation";
      paint();
      return { unit: u, cust: cust };
    }""")
    pg.wait_for_timeout(450)
    ck("the custodian holds a fill way in", setup["cust"] is not None
       and pg.query_selector('[data-fillcta="foundation"]') is not None)
    pg.click('[data-fillcta="foundation"]')
    pg.wait_for_timeout(600)
    fv = pg.evaluate("""(a) => {
      const kos = UNITS[a.unit].keyObjectives;
      const rows = [...document.querySelectorAll('#panel table tbody tr')];
      const row = rows.find(r => (r.textContent||"").indexOf(kos[0].name) >= 0);
      const row2 = rows.find(r => (r.textContent||"").indexOf(kos[1].name) >= 0);
      const cell = row ? row.children[2] : null;
      const sel = cell ? cell.querySelector('select') : null;
      const before = gapTotal(a.unit);
      if (sel) { sel.value = "%"; sel.dispatchEvent(new Event('change',{bubbles:true})); }
      const m = kos[0];
      return { picker: !!sel,
               opts: sel ? [...sel.options].map(o=>o.value) : null,
               noPicker2: !!(row2 && !row2.children[2].querySelector('select')),
               t3: m.target3y, pend3: !!(m.pend && m.pend.target3y),
               t: m.target, pendT: !!(m.pend && m.pend.target),
               before: before, after: gapTotal(a.unit) };
    }""", setup)
    ck("the bare row's Unit cell is a picker", fv["picker"], fv)
    ck("...offering the fixed list", fv.get("opts") == pg.evaluate("() => TARGET_UNITS"),
       fv.get("opts"))
    ck("a row whose unit is set gets none — that one stays the office's",
       fv["noPicker2"], fv)
    ck("picking % lands on the 3-year target, PENDING",
       fv["t3"] == "30%" and fv["pend3"], fv)
    ck("...the blank this-year untouched", fv["t"] == "" and not fv["pendT"], fv)
    ck("...and the gap count did not move — a unit is not a gap",
       fv["before"] == fv["after"] and fv["before"] >= 1, fv)
    # filling the missing value now inherits the unit just set
    iv = pg.evaluate("""(a) => {
      paint();
      return new Promise(res => setTimeout(() => {
        const kos = UNITS[a.unit].keyObjectives;
        const rows = [...document.querySelectorAll('#panel table tbody tr')];
        const row = rows.find(r => (r.textContent||"").indexOf(kos[0].name) >= 0);
        const inp = row ? row.children[4].querySelector('input') : null;
        if (!inp) { res({no:"this-year input"}); return; }
        inp.value = "25"; inp.dispatchEvent(new Event('change',{bubbles:true}));
        const pickerGone = !row.children[2].querySelector('select');
        res({ t: kos[0].target, pendT: !!(kos[0].pend && kos[0].pend.target),
              pickerGone: pickerGone,
              plain: row.children[2].textContent.trim() });
      }, 400));
    }""", setup)
    ck("a bare 25 typed after inherits it — 25%, pending",
       iv.get("t") == "25%" and iv.get("pendT") is True, iv)
    ck("once set the picker leaves and the unit reads plain",
       iv.get("pickerGone") is True and iv.get("plain") == "%", iv)
    # both ends: the shared rule the server judges by
    ua = pg.evaluate("""() => ({
      fill: SMPRules.unitAddedOnly('target3y', '30', '30%'),
      moved: SMPRules.unitAddedOnly('target3y', '30', '31%'),
      notAUnitField: SMPRules.unitAddedOnly('name', '30', '30%') });""")
    ck("the server's own test agrees: unit added, number unmoved",
       ua["fill"] and not ua["moved"] and not ua["notAUnitField"], ua)
    pg.evaluate("() => { leaveModes(); paint(); }")
    pg.wait_for_timeout(300)

    pg.evaluate("() => { EDIT_PAGE['foundation'] = false; paint(); }")
    pg.wait_for_timeout(200)
    ck("no console errors", not errs, errs[:2])
    b.close()

print("\n" + ("all passed" if not bad else "%d FAILED" % bad))
raise SystemExit(1 if bad else 0)
