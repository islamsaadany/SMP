"""A FUNCTION'S OBJECTIVES ARE WRITTEN AT THE PAGE'S WIDTH (§226).

   Islam, from Consumer Finance's Overview: *"the keyobjectives table is tight
   I can't see the direction and I can't find the unit and the ibjectives cell
   is not wrapping"*, and *"led by is not open to edit"*.

   Measured before a line was written, at a 1500px window: the table edited
   INSIDE the half-width fgrid card — the Objective input got 101px, the Dir.
   select 34px (a select whose value cannot be seen), and there was no Unit
   column at all. §96.6 fixed exactly this squeeze on a unit's Foundation by
   moving the editing table to a full-width band, and that fix never reached
   the function's Overview; §199's Unit column and §189's wrapping prose never
   reached capKoEdit either.

   WHAT IS ASSERTED, and why it is the problem rather than the layout (§94.8):

     1. In edit mode the objectives table sits in a `.koband` OUTSIDE the
        `.fgrid`, on BOTH function formats (§53.5 — one page, one answer),
        and its box does not scroll sideways.
     2. The Dir. select can show its value (the broken build measured 34px).
     3. The Unit column exists and is §199's: picking writes the stored
        target, and a bare number typed after it INHERITS it. §251 reversed
        the third clause — a row with no target used to say why there was
        nothing to pick, and now gets the picker like every other row, with
        the unit held alone until a number joins it.
     4. The Objective name is prose: a long name WRAPS and typing writes the
        DATA (§96: a control wired to nothing renders identically).
     5. Led by opens for the OFFICE with the pen — Setup's own picker writing
        the same head pointer — and for NOBODY else: a non-office viewer
        whose strategy cell was opened gets fields and no Led by control,
        because the server classifies a head change as Setup and the screen
        must not offer what the save refuses (§42). Both ends.
     6. THE UNIT SIDE IS UNTOUCHED, at Islam's instruction ("don't touch the
        unit side") — koEdit keeps its 3-year column and its one-line name,
        measured rather than claimed.

   §94.2 throughout: the demo's pillars function holds no objectives, so the
   states are MADE — through the real Add button, not by assignment.
"""
import sys
from playwright.sync_api import sync_playwright

URL = "file:///home/user/SMP/SMP-Project-Folder/src/strategy-management-platform.html"
errs = []
bad = 0


def ck(w, ok, x=""):
    global bad
    if not ok:
        bad += 1
    print(("  ok      " if ok else "  FAIL    ") + w + (("  — " + str(x)) if not ok and x else ""))


with sync_playwright() as p:
    b = p.chromium.launch(executable_path="/opt/pw-browsers/chromium",
                          args=["--no-sandbox", "--disable-dev-shm-usage"])
    pg = b.new_page(viewport={"width": 1500, "height": 1000})
    pg.add_init_script("try{sessionStorage.setItem('smp.welcome.seen','1')}catch(e){}")
    pg.on("pageerror", lambda e: errs.append(str(e)))
    pg.goto(URL)
    pg.wait_for_timeout(1200)

    print("\n-- the fixture")
    w = pg.evaluate("""() => {
      const fk = Object.keys(FUNCTIONS).filter(k=>String(FUNCTIONS[k].format)==='pillars')[0];
      const ck = Object.keys(FUNCTIONS).filter(k=>String(FUNCTIONS[k].format)!=='pillars'
        && capsOfFunction(k).length)[0];
      return { fk, ck, smo: PEOPLE.filter(p=>p.role==='super')[0].key };
    }""")
    ck("a pillars function and a capability one", bool(w["fk"]) and bool(w["ck"]), w)
    if not w["fk"] or not w["ck"]:
        b.close(); sys.exit(1)

    def at_overview(fk, pen):
        pg.evaluate("""(a) => { VIEWER=a.smo; leaveModes();
          current='fn:'+a.fk; currentSub='fnstrat'; CURSEC.fnstrat='found';
          EDIT_PAGE.capfoundation=a.pen; paint(); }""",
          {"fk": fk, "pen": pen, "smo": w["smo"]})
        pg.wait_for_timeout(500)

    print("\n-- 1 · the first objective is ADDED through the real button, and lands")
    at_overview(w["fk"], True)
    pg.click('[data-capkoadd="fn:' + w["fk"] + '"]')
    pg.wait_for_timeout(500)
    n = pg.evaluate("(k)=>(FUNCTIONS[k].keyObjectives||[]).length", w["fk"])
    ck("pressing + Add an objective writes the stored function", n == 1, n)
    pg.evaluate("""(k)=>{ const m=FUNCTIONS[k].keyObjectives[0];
      m.name='Hitting our Total Revenue target across the whole portfolio';
      m.target=''; m.target3y=''; paint(); }""", w["fk"])
    pg.wait_for_timeout(500)

    print("\n-- 2 · while it is written, the table gets the page (§96.6's rule)")
    m = pg.evaluate("""() => {
      const band = document.querySelector('#panel .koband');
      const grid = document.querySelector('#panel .fgrid');
      const tbl = band && band.querySelector('table');
      const scroll = band && band.querySelector('.scroll');
      const dir = tbl && tbl.querySelector('tbody tr td:nth-child(2) select');
      return band && {
        inGrid: !!band.closest('.fgrid'),
        bandW: band.getBoundingClientRect().width,
        gridW: grid.getBoundingClientRect().width,
        sideways: scroll.scrollWidth > scroll.clientWidth + 1,
        dirW: dir ? dir.getBoundingClientRect().width : null,
        heads: [...tbl.querySelectorAll('thead th')].map(t=>t.textContent.trim()) };
    }""")
    ck("the editing table sits in a band, not in the half-width card",
       bool(m) and not m["inGrid"], m)
    ck("...as wide as the grid it left", bool(m) and abs(m["bandW"] - m["gridW"]) < 2, m)
    ck("...and nothing scrolls sideways inside it", bool(m) and not m["sideways"], m)
    # The broken build measured the Dir. select at 34px — two characters of
    # chrome and no value. 44 is between the two measurements, not a design.
    ck("the Dir. select can show its value", bool(m) and m["dirW"] and m["dirW"] > 44, m)
    ck("the Unit column is there, in §199's position",
       bool(m) and m["heads"] == ["Objective", "Dir.", "Unit", "This year", "Compile", "Weight %", ""],
       m and m["heads"])

    print("\n-- 3 · the Unit column IS §199's: view of the target, nothing stored")
    why = pg.evaluate("""() => {
      const td = document.querySelector('.koband tbody tr td:nth-child(3)');
      return { sel: !!td.querySelector('select'), why: !!td.querySelector('.why') };
    }""")
    # §251 REVERSED THIS ONE, so it is REWRITTEN rather than deleted (§218):
    # a row with no target used to have nothing to pick and a `.why` span
    # saying so, and Islam asked for the picker to be there whether or not a
    # target is — the unit is held alone until a number joins it. Left as it
    # was, this would have gone on demanding the dead end it was written for.
    ck("a row with no target STILL gets the picker — the unit is held alone",
       why["sel"] and not why["why"], why)
    typed = pg.evaluate("""(k) => {
      const m = FUNCTIONS[k].keyObjectives[0];
      const i = document.querySelector('.koband tbody tr td:nth-child(4) input');
      i.value = '1.6'; i.dispatchEvent(new Event('change',{bubbles:true}));
      return m.target;
    }""", w["fk"])
    ck("typing this year's figure stores it bare", typed == "1.6", typed)
    pg.evaluate("() => paint()"); pg.wait_for_timeout(500)
    picked = pg.evaluate("""(k) => {
      const m = FUNCTIONS[k].keyObjectives[0];
      const s = document.querySelector('.koband tbody tr td:nth-child(3) select');
      if (!s) return { noSel: true };
      s.value = 'B EGP'; s.dispatchEvent(new Event('change',{bubbles:true}));
      return m.target;
    }""", w["fk"])
    # "6.2B EGP" is §199's own example — the money units are TIGHT, no space.
    ck("...picking B EGP writes it ONTO the target", picked == "1.6B EGP", picked)
    inh = pg.evaluate("""(k) => {
      const m = FUNCTIONS[k].keyObjectives[0];
      const i = document.querySelector('.koband tbody tr td:nth-child(4) input');
      i.value = '2.4'; i.dispatchEvent(new Event('change',{bubbles:true}));
      return m.target;
    }""", w["fk"])
    ck("...and the next bare number INHERITS it (§199.6)", inh == "2.4B EGP", inh)

    print("\n-- 4 · the name is prose: it wraps, and it writes")
    pg.evaluate("() => paint()"); pg.wait_for_timeout(500)
    name = pg.evaluate("""() => {
      const t = document.querySelector('.koband tbody tr td:first-child textarea.fld.grow');
      if (!t) return { kind: (document.querySelector('.koband tbody tr td:first-child .fld')||{}).tagName };
      const line = parseFloat(getComputedStyle(t).lineHeight) || 18;
      return { grow: true, h: t.getBoundingClientRect().height, line,
               fits: t.scrollHeight <= t.clientHeight + 3 };
    }""")
    ck("the Objective is a growing box (§189's textOr)", name.get("grow"), name)
    ck("...a long name takes more than one line",
       name.get("grow") and name["h"] > name["line"] * 1.8, name)
    ck("...and the whole of it is readable — nothing clipped inside the box",
       name.get("grow") and name["fits"], name)
    wrote = pg.evaluate("""(k) => {
      const m = FUNCTIONS[k].keyObjectives[0];
      const t = document.querySelector('.koband tbody tr td:first-child textarea');
      t.value = 'A renamed objective'; t.dispatchEvent(new Event('change',{bubbles:true}));
      return m.name;
    }""", w["fk"])
    ck("typing into it writes the DATA (§96)", wrote == "A renamed objective", wrote)

    print("\n-- 5 · Led by opens for the office, and for nobody else")
    pg.evaluate("() => paint()"); pg.wait_for_timeout(400)
    led = pg.evaluate("""() => {
      const dt = [...document.querySelectorAll('#panel .clause dt')]
        .filter(d=>d.textContent.trim()==='Led by')[0];
      const dd = dt && dt.parentElement.querySelector('dd');
      return { btn: !!(dd && dd.querySelector('.pickbtn')) };
    }""")
    ck("the office's pen draws the picker on the row", led["btn"], led)
    pg.click('#panel [data-pick-open]'); pg.wait_for_timeout(400)
    head = pg.evaluate("""(k) => {
      const row = document.querySelector('#panel .picker .pickrow');
      if (!row) return { noRows: true };
      const key = row.dataset.pickSet.split('|')[2];
      row.click();
      return { key };
    }""", w["fk"])
    pg.wait_for_timeout(500)
    after = pg.evaluate("""(a) => {
      const f = FUNCTIONS[a.fk];
      const p = PEOPLE.filter(p=>p.key===a.key)[0];
      const dt = [...document.querySelectorAll('#panel .clause dt')]
        .filter(d=>d.textContent.trim()==='Led by')[0];
      return { head: f.head, fn: p && p.fn,
               shown: dt.parentElement.querySelector('dd').textContent.trim() };
    }""", {"fk": w["fk"], "key": head.get("key")})
    ck("picking somebody writes the function's head — the register's own fact",
       after["head"] == head.get("key"), {"picked": head, "after": after})
    ck("...and attaches them to the function, as the register would",
       after["fn"] == w["fk"], after)
    ck("...and the row now says their name",
       bool(after["shown"]) and after["shown"] != "—", after)

    # THE OTHER END (§94.2): a non-office viewer whose strategy cell was
    # OPENED (§117: the SMO can hand the pen over) gets the fields and never
    # the Led by control — the server would refuse the head change as Setup.
    other = pg.evaluate("""(a) => {
      const f = FUNCTIONS[a.fk];
      ACCESS.custodian = ACCESS.custodian || {};
      ACCESS.custodian.a_fn_own_strat = 'edit';
      const p = PEOPLE.filter(x=>personActive(x) && x.key!==f.head
        && !['super','smoteam'].includes(x.role))[0];
      f.custodian = p.key; p.fn = a.fk; p.unit = null; p.company = null;
      VIEWER = p.key; leaveModes();
      current='fn:'+a.fk; currentSub='fnstrat'; CURSEC.fnstrat='found';
      EDIT_PAGE.capfoundation = true; paint();
      return p.key;
    }""", {"fk": w["fk"]})
    pg.wait_for_timeout(500)
    nono = pg.evaluate("""() => {
      const dt = [...document.querySelectorAll('#panel .clause dt')]
        .filter(d=>d.textContent.trim()==='Led by')[0];
      if (!dt) return { noRow: true };
      return { authoring: authoring('capfoundation','k_found'),
               btn: !!dt.parentElement.querySelector('dd .pickbtn'),
               fields: document.querySelectorAll('.koband .fld').length };
    }""")
    ck("a custodian holding the opened strategy cell is authoring", nono.get("authoring") is True, nono)
    ck("...their table is open", (nono.get("fields") or 0) > 0, nono)
    ck("...and Led by is NOT offered to them", nono.get("btn") is False, nono)

    print("\n-- 6 · the capability format takes the same band (§53.5)")
    at_overview(w["ck"], True)
    capm = pg.evaluate("""(k) => {
      const bands = [...document.querySelectorAll('#panel .koband')];
      const inGrid = bands.filter(b=>b.closest('.fgrid')).length;
      const heads = bands[0] ? [...bands[0].querySelectorAll('thead th')].map(t=>t.textContent.trim()) : null;
      return { n: bands.length, caps: capsOfFunction(k).length, inGrid, heads };
    }""", w["ck"])
    ck("one band per capability, none inside the grid",
       capm["n"] == capm["caps"] and capm["n"] > 0 and capm["inGrid"] == 0, capm)
    ck("...with the same columns", capm["heads"] and "Unit" in capm["heads"], capm)

    print("\n-- 7 · reading mode keeps the card, on both formats")
    for fk in (w["fk"], w["ck"]):
        at_overview(fk, False)
        r = pg.evaluate("""() => ({
          band: !!document.querySelector('#panel .koband'),
          cards: document.querySelectorAll('#panel .fgrid > .card').length })""")
        ck("no band and two cards while reading (" + fk + ")",
           not r["band"] and r["cards"] >= 2, r)

    # §243 REVERSES HALF OF THIS, AT ISLAM'S OWN INSTRUCTION: *"there is no
    # weighting on the objectives in units it needs to be added."* The
    # assertion is REWRITTEN rather than deleted (§218's rule), because what it
    # was protecting is still worth protecting — a unit authors a 3-year target
    # and a function does not, and the two tables must not quietly converge.
    # So: the unit keeps the columns a function has never had, gains the one
    # Islam asked for, and keeps its one-line name box.
    print("\n-- 8 · the unit keeps what is its own, and gains the weight column (§243)")
    pg.evaluate("""(smo) => { VIEWER=smo; leaveModes(); current='mobile';
      currentSub='strategy'; CURSEC.strategy='found';
      EDIT_PAGE.foundation=true; paint(); }""", w["smo"])
    pg.wait_for_timeout(600)
    um = pg.evaluate("""() => {
      const band = document.querySelector('.koband');
      const tbl = band && band.querySelector('table');
      return tbl && {
        heads: [...tbl.querySelectorAll('thead th')].map(t=>t.textContent.trim()),
        name: (tbl.querySelector('tbody tr td:first-child .fld')||{}).tagName };
    }""")
    ck("koEdit keeps its 3-year column, which a function has no equivalent of",
       bool(um) and um["heads"] ==
       ["Objective", "Dir.", "Unit", "3-year", "This year", "Compile", "Weight %", ""],
       um)
    ck("...and the weight column Islam asked for is on it (§243)",
       bool(um) and "Weight %" in um["heads"], um)
    ck("...and its one-line name box", bool(um) and um["name"] == "INPUT", um)

    ck("no console errors anywhere in the run", not errs, errs)
    b.close()

print(("\n%d FAILED" % bad) if bad else "\nall ok")
sys.exit(1 if bad else 0)
