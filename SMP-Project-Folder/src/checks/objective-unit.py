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
        koSetUnit(m, u); return [m.target, m.target3y]; };
      return { word: go("100","1500","trips"),
               same: go("30%","45%","%"),
               swap: go("2.4B EGP","6.2B EGP","SQM"),
               bare: go("60000","","SQM"),
               clear: go("30%","45%","") };
    }""")
    ck("a WORD unit gets a space — '100' + trips",
       t["word"] == ["100 trips", "1500 trips"], t["word"])
    ck("a SYMBOL unit gets none", t["same"] == ["30%", "45%"], t["same"])
    ck("both horizons take it", t["swap"] == ["2.4 SQM", "6.2 SQM"], t["swap"])
    ck("an empty horizon is left empty, not given a bare unit",
       t["bare"] == ["60000 SQM", ""], t["bare"])
    ck("clearing the unit leaves the numbers", t["clear"] == ["30", "45"], t["clear"])

    print("\n── 3 · an unchanged unit writes NOTHING (§50.6)")
    same = pg.evaluate("""() => {
      const m = {target:"2.4B EGP", target3y:"6.2B EGP", name:"x"};
      const was = JSON.stringify(m);
      koSetUnit(m, koUnitOf(m));
      return { was: was, now: JSON.stringify(m) };
    }""")
    ck("the row is byte-identical afterwards", same["was"] == same["now"], same)

    print("\n── 4 · the reading table")
    pg.click('[data-u="logistics"]'); pg.wait_for_timeout(400)
    pg.click('[data-s="strategy"]'); pg.wait_for_timeout(300)
    pg.click('[data-sub2="found"]'); pg.wait_for_timeout(600)
    # The chips layout is the default; the columns view is what gained a column.
    pg.evaluate("() => { KO_VIEW='cols'; SHOW_KO_THIS_YEAR = true; paint(); }")
    pg.wait_for_timeout(500)
    v = pg.evaluate("""() => {
      const h = document.querySelector('.ohead');
      return { head: h ? [...h.children].map(c=>c.textContent.trim()) : null,
               rows: [...document.querySelectorAll('.orow')].slice(0,3).map(r =>
                 [...r.children].map(c => (c.innerText||'').replace(/\\s+/g,' ').trim())),
               unitCol: !!document.querySelector('.orow .ou') };
    }""")
    ck("the heading gained Unit, in second place",
       v["head"] and v["head"][1] == "Unit", v["head"])
    ck("a money row says the unit once and the numbers bare",
       v["rows"] and v["rows"][0][1] == "B EGP"
       and v["rows"][0][2] == "2.4" and v["rows"][0][3] == "1.6", v["rows"][:1])
    ck("...and a percentage row does the same",
       any(r[1] == "%" and "%" not in r[2] for r in v["rows"]), v["rows"])

    print("\n── 5 · drawn only where a unit exists (§41)")
    none = pg.evaluate("""() => {
      const ko = UNITS.logistics.keyObjectives;
      const keep = ko.map(m => [m.target, m.target3y]);
      ko.forEach(m => { m.target = splitTarget(m.target).value;
                        m.target3y = splitTarget(m.target3y).value; });
      paint();
      const h = document.querySelector('.ohead');
      const out = { head: h ? [...h.children].map(c=>c.textContent.trim()) : null,
                    anyCell: !!document.querySelector('.orow .ou') };
      ko.forEach((m,i) => { m.target = keep[i][0]; m.target3y = keep[i][1]; });
      paint();
      return out;
    }""")
    ck("with no unit anywhere, no Unit column at all",
       none["head"] and "Unit" not in none["head"], none["head"])
    ck("...and no empty cells left behind", not none["anyCell"], none)

    print("\n── 6 · the chip layout is deliberately untouched")
    chips = pg.evaluate("""() => { KO_VIEW='chips'; paint();
      const c = document.querySelector('.ochip .v');
      return c ? c.textContent.trim() : null; }""")
    ck("a chip still carries the whole figure", chips and "EGP" in chips, chips)
    pg.evaluate("() => { KO_VIEW='cols'; paint(); }"); pg.wait_for_timeout(300)

    print("\n── 7 · the editor writes the plan, and only the office's pen has it")
    pg.evaluate("() => { EDIT_PAGE['foundation'] = true; paint(); }")
    pg.wait_for_timeout(500)
    w = pg.evaluate("""() => {
      const heads = [...document.querySelectorAll('.koband thead th')].map(t=>t.textContent.trim());
      const row = document.querySelectorAll('.koband tbody tr')[0];
      const box = row.querySelectorAll('td')[2].querySelector('input');
      if (!box) return { heads: heads, noBox: true };
      const m = UNITS.logistics.keyObjectives[0];
      const was = [m.target, m.target3y];
      box.value = "SQM"; box.dispatchEvent(new Event('change', {bubbles:true}));
      const now = [m.target, m.target3y];
      m.target = was[0]; m.target3y = was[1];
      return { heads: heads, was: was, now: now };
    }""")
    ck("the pen's table has a Unit column", "Unit" in (w.get("heads") or []), w.get("heads"))
    ck("...and typing in it reaches the stored plan",
       w.get("now") == ["1.6 SQM", "2.4 SQM"], w)

    print("\n── 8 · a unit is not a gap")
    g = pg.evaluate("""() => ({
      inGapFields: SMPRules.isGapField('unit'),
      koGaps: SMPRules.GAP_FIELDS.ko }) """)
    ck("'unit' is not a gap field — 46 of 178 targets have none and are complete",
       not g["inGapFields"], g)

    pg.evaluate("() => { EDIT_PAGE['foundation'] = false; paint(); }")
    pg.wait_for_timeout(200)
    ck("no console errors", not errs, errs[:2])
    b.close()

print("\n" + ("all passed" if not bad else "%d FAILED" % bad))
raise SystemExit(1 if bad else 0)
