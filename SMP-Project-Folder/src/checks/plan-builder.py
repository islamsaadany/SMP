"""The plan builder (§129, spec 020): a plan can be BUILT, whole, on the platform.

WHAT THIS PROVES, AND HOW IT HAS TO PROVE IT. Every assertion below asks the
DATA after pressing the CONTROL (§96's question — "does pressing this change
what is stored?"), because the builder is a layer over editors that have
already once been drawn fully and wired to nothing. And it MAKES the states
it measures (§94.2, §45.2): the demo tenant has ten units all carrying plans,
so an empty unit, a virgin pillars function, a projects function with no
capability and a measure with no target are all constructed here, through the
product's own controls wherever one exists.

BOTH ENDS, EACH TIME (§94.2): the door is asserted present for the SMO and
the band asserted to HIDE when the viewer switches to somebody the shared
rule refuses — a check that only looks for something present cannot see a
control that should not be drawn.

PROVED ABLE TO FAIL (§94.5) before its green run was believed, twice — and
the second proof caught THE CHECK, not the product:
  · bApply("measure", …) made to return true without pushing — the form
    accepted and the data unchanged — failed §5 twice, as predicted;
  · builderSections' plan chip forced to read every plan as empty — and the
    first agreement assertion PASSED, because it looked for the count as a
    substring of the row and the gap sentence beside the lying chip also
    contained a "1". It compares the chip's own mark against the data now,
    and the same break fails it (plan:○ against 1).
Both breaks were run, watched to fail, and reverted.

Run: SMP_CHROME=... python3 qa-run.py checks/plan-builder.py
"""
import pathlib
from playwright.sync_api import sync_playwright

URL = "file://" + str(pathlib.Path(
    pathlib.Path(__file__).resolve().parent.parent,
    "strategy-management-platform.html").resolve())

fails, errs = [], []


def ck(name, ok, extra=""):
    print(("  ok   " if ok else "  FAIL ") + name + ((" — " + str(extra)) if extra else ""))
    if not ok:
        fails.append(name)


with sync_playwright() as p:
    b = p.chromium.launch()
    pg = b.new_page(viewport={"width": 1600, "height": 1000})
    pg.on("pageerror", lambda e: errs.append("PAGEERROR: " + str(e)))
    pg.on("console", lambda m: errs.append(m.text) if m.type == "error" else None)
    pg.on("dialog", lambda d: d.accept())
    pg.goto(URL)
    pg.wait_for_timeout(800)
    pg.select_option("#asWho", "smo")
    pg.wait_for_timeout(300)

    def open_chooser():
        pg.query_selector(".navmenu-btn").click(); pg.wait_for_timeout(300)
        pg.query_selector('[data-setupgo="import"]').click(); pg.wait_for_timeout(300)
        pg.query_selector("[data-buildplan]").click(); pg.wait_for_timeout(250)

    print("\n── 1 · the door, and who it opens for ──")
    pg.query_selector(".navmenu-btn").click(); pg.wait_for_timeout(300)
    pg.query_selector('[data-setupgo="import"]').click(); pg.wait_for_timeout(300)
    ck("the SMO finds Build a plan beside Import", bool(pg.query_selector("[data-buildplan]")))

    print("\n── 2 · the chooser tells the truth about every subject ──")
    pg.query_selector("[data-buildplan]").click(); pg.wait_for_timeout(250)
    rows = pg.evaluate("""Array.from(document.querySelectorAll('.brow[data-bpick], .brow:has([data-bpick])')).length""")
    # statuses must AGREE with the data's own answer, never a hard-coded count (§53.5)
    agree = pg.evaluate("""(() => {
      var bad = [];
      document.querySelectorAll('[data-bpick]').forEach(function(b){
        var t = b.dataset.bpick;
        var word = b.closest('.brow').querySelector('.bstat').textContent;
        var has = builderHasPlan(t);
        if ((word === 'Has a plan') !== has) bad.push(t);
      });
      return bad;
    })()""")
    ck("every unit row's status agrees with builderHasPlan()", agree == [], agree)
    pg.query_selector('[data-bside="fns"]').click(); pg.wait_for_timeout(200)
    fnrows = pg.evaluate("document.querySelectorAll('[data-bpick^=\"fn:\"]').length")
    fnlive = pg.evaluate("activeFunctionKeys().length")
    ck("the functions side lists every active function", fnrows == fnlive, "%s vs %s" % (fnrows, fnlive))

    print("\n── 3 · a new unit is asked for by name and arrives whole ──")
    pg.query_selector('[data-bside="units"]').click(); pg.wait_for_timeout(200)
    pg.query_selector('[data-bnew="unit"]').click(); pg.wait_for_timeout(200)
    ck("Create is dead until the name exists",
       pg.eval_on_selector('[data-bfadd="one"]', "e=>e.disabled"))
    pg.fill('[data-bf="name"]', "Line Electronics")
    pg.wait_for_timeout(100)
    ck("…and live once it does", not pg.eval_on_selector('[data-bfadd="one"]', "e=>e.disabled"))
    pg.query_selector('[data-bfadd="one"]').click(); pg.wait_for_timeout(600)
    T = "lineelectronics"
    ck("the unit exists under a key minted from its name", pg.evaluate("!!UNITS['%s']" % T))
    ck("it is the client's own, never illustrative", pg.evaluate("UNITS['%s'].real === true" % T))
    wrow = pg.evaluate("GROUP.weighting.units.filter(r=>r.key==='%s')[0] || null" % T)
    ck("it has a weighting row minted from the factor list",
       bool(wrow) and all(f in wrow for f in pg.evaluate("GROUP.weighting.factors.map(f=>f.key)")), wrow)
    ck("the builder entered it", pg.evaluate("BUILDER && BUILDER.target") == T)
    ck("the band is on screen", not pg.eval_on_selector("#buildband", "e=>e.hidden"))

    print("\n── 4 · a map, not a march ──")
    chips = pg.evaluate("Array.from(document.querySelectorAll('#buildband [data-bnav]')).map(b=>b.dataset.bnav)")
    ck("the unit's five chips", chips == ["found", "obj", "swot", "plan", "review"], chips)
    pg.query_selector('#buildband [data-bnav="plan"]').click(); pg.wait_for_timeout(400)
    ck("Pillars opens directly with the foundation still empty",
       pg.evaluate("currentSub === 'strategy' && !UNITS['%s'].aspiration" % T))
    pa = pg.query_selector('[data-rowadd^="pillar"]')
    ck("an empty plan offers the first pillar (§129's audit)", bool(pa))
    pa.click(); pg.wait_for_timeout(200)
    pg.fill('[data-bf="name"]', "Route to market")
    pg.query_selector('[data-bfadd="one"]').click(); pg.wait_for_timeout(500)
    ck("the pillar is IN THE DATA", pg.evaluate(
        "UNITS['%s'].items.length === 1 && UNITS['%s'].items[0].name === 'Route to market'" % (T, T)))

    print("\n── 5 · a row is added whole, and the form says what is missing ──")
    ma = pg.query_selector('[data-rowadd^="measure"]')
    ck("the measure add is there behind the pen", bool(ma))
    ma.click(); pg.wait_for_timeout(200)
    order = pg.evaluate("Array.from(document.querySelectorAll('#modal-b .bfl')).map(e=>e.textContent.split(' —')[0])")
    ck("the fields come in the outcome's order",
       order[:2] == ["Measure", "Direction"] and "Compile rule" in order[-1], order)
    segs = pg.evaluate("Array.from(document.querySelectorAll('#modal-b .bfseg [data-bfv]')).map(e=>e.dataset.bfv)")
    # §260: asserted as AGREEMENT with the shared list rather than as a literal
    # — this line held the three old rules and went red on a correct build
    # the day Count joined them (§214.3, again).
    want = pg.evaluate("['≥', '≤'].concat(SMPRules.COMPILES)")
    ck("the vocabulary is the pen's own", segs == want, {"got": segs, "want": want})
    pg.fill('[data-bf="name"]', "Repair turnaround")
    pg.query_selector('.bfseg [data-bfv="≤"]').click()
    pg.wait_for_timeout(100)
    miss = pg.eval_on_selector(".bfmiss", "e=>e.hidden ? '' : e.textContent")
    ck("what is still empty is NAMED before the row lands",
       "Target this year" in miss, miss)
    pg.query_selector('[data-bfadd="more"]').click(); pg.wait_for_timeout(400)
    ck("Add & add another keeps the form open and counts",
       pg.eval_on_selector(".bfnote", "e=>e.textContent") == "1 added")
    pg.fill('[data-bf="name"]', "Service NPS")
    pg.fill('[data-bf="target"]', "60")
    pg.query_selector('[data-bfadd="one"]').click(); pg.wait_for_timeout(400)
    ms = pg.evaluate("UNITS['%s'].items[0].measures.map(m=>({n:m.name,d:m.dir,t:m.target}))" % T)
    ck("both measures landed, shaped", len(ms) == 2 and ms[0]["d"] == "≤" and ms[0]["t"] == ""
       and ms[1]["t"] == "60", ms)
    # the mark lives in READ mode: close the pen, look, reopen (§48.2 — press
    # the real control, never poke EDIT_PAGE)
    pg.query_selector('#panel [data-page="plan"]').click(); pg.wait_for_timeout(300)
    ck("the target left empty reads as missing ON THE PAGE",
       pg.evaluate("document.querySelector('#panel').textContent.includes('Missing')"))
    # THE PEN A ONE-PILLAR UNIT CARRIES CHANGED SHAPE (§130.2). This hovered
    # `#panel .hoverpen` unconditionally, which is the pen on a pillar TITLE —
    # and a unit with one pillar is railed now, so the title is a band and the
    # pen is the pane's own corner one, which needs no hover at all (§70: that
    # is the pen §70 made always visible, because a hover never happens on a
    # touch screen). Keyed on the old markup this timed out for thirty seconds
    # on a build that is correct — §51.11, and the reason the rule says to grep
    # every check when a control changes shape.
    #
    # SO IT ASSERTS WHAT MATTERS instead: a pen is on the page and a click at
    # its own centre reaches it, whichever of the two it is.
    hp = pg.query_selector('#panel .hoverpen')
    if hp:
        hp.hover(); pg.wait_for_timeout(100)
    ck("the closed pen is reachable where it sits", pg.evaluate("""()=>{
      const p=document.querySelector('#panel [data-page="plan"]');
      if (!p) return false;
      const r=p.getBoundingClientRect();
      const at=document.elementFromPoint(r.left+r.width/2, r.top+r.height/2);
      return !!at && (at===p||p.contains(at)||at.contains(p));}"""))
    pg.query_selector('#panel [data-page="plan"]').click(); pg.wait_for_timeout(300)

    print("\n── 6 · the surfaces that could never start (§129's audit) ──")
    pg.query_selector('#buildband [data-bnav="found"]').click(); pg.wait_for_timeout(400)
    ca = pg.query_selector("[data-clauseadd='%s']" % T)
    ck("the first 'Who we are' line can be written", bool(ca))
    ca.click(); pg.wait_for_timeout(200)
    pg.fill('[data-bf="label"]', "We are")
    pg.fill('[data-bf="text"]', "The consumer electronics arm")
    pg.query_selector('[data-bfadd="one"]').click(); pg.wait_for_timeout(400)
    ck("…and it is in the data with an id",
       pg.evaluate("UNITS['%s'].clauses.some(c=>c[0]==='We are' && c[1] && c[2])" % T))
    pg.query_selector('#buildband [data-bnav="obj"]').click(); pg.wait_for_timeout(400)
    pg.query_selector("[data-koadd]").click(); pg.wait_for_timeout(200)
    pg.fill('[data-bf="name"]', "Line revenue")
    pg.fill('[data-bf="target"]', "1.2B EGP")
    pg.query_selector('[data-bfadd="one"]').click(); pg.wait_for_timeout(400)
    ck("the objective landed with a minted id",
       pg.evaluate("UNITS['%s'].keyObjectives.length === 1 && UNITS['%s'].keyObjectives[0].id === '%s-KO1'" % (T, T, T)))
    pg.query_selector('#buildband [data-bnav="swot"]').click(); pg.wait_for_timeout(400)
    ck("all four SWOT quadrants offer their first line",
       pg.evaluate("document.querySelectorAll('[data-swadd]').length") == 4)
    pg.query_selector('[data-swadd="%s|s"]' % T).click(); pg.wait_for_timeout(200)
    pg.fill('[data-bf="text"]', "Strong brand equity")
    pg.query_selector('[data-bfadd="one"]').click(); pg.wait_for_timeout(400)
    ck("the strength is in the data", pg.evaluate("UNITS['%s'].swot.s[0] === 'Strong brand equity'" % T))

    print("\n── 7 · the projects route, from a function that does not exist yet ──")
    open_chooser()
    pg.query_selector('[data-bnew="fn"]').click(); pg.wait_for_timeout(200)
    pg.fill('[data-bf="name"]', "Quality Assurance")
    pg.query_selector('[data-bfadd="one"]').click(); pg.wait_for_timeout(600)
    FK = "qualityassuran"
    ck("the function exists, planning in projects",
       pg.evaluate("FUNCTIONS['%s'] && FUNCTIONS['%s'].format === 'projects'" % (FK, FK)))
    ck("its first capability was minted, named after it",
       pg.evaluate("capsOfFunction('%s').length === 1 && capsOfFunction('%s')[0].name === 'Quality Assurance'" % (FK, FK)))
    chips = pg.evaluate("Array.from(document.querySelectorAll('#buildband [data-bnav]')).map(b=>b.dataset.bnav)")
    ck("the projects route's chips", chips == ["def", "obj", "proj", "review"], chips)
    ck("a capability's first objective can be written (import-only until §129)",
       bool(pg.query_selector("[data-capkoadd]")))
    pg.query_selector("[data-capkoadd]").click(); pg.wait_for_timeout(200)
    pg.fill('[data-bf="name"]', "Defect escape rate")
    pg.fill('[data-bf="weight"]', "60")
    pg.query_selector('[data-bfadd="one"]').click(); pg.wait_for_timeout(400)
    ck("…and it carries its weight as a number",
       pg.evaluate("capsOfFunction('%s')[0].keyObjectives[0].weight === 60" % FK))
    pg.query_selector('#buildband [data-bnav="proj"]').click(); pg.wait_for_timeout(400)
    pg.query_selector('[data-rowadd^="project"]').click(); pg.wait_for_timeout(200)
    pg.fill('[data-bf="name"]', "Supplier audit programme")
    pg.query_selector('[data-bfadd="one"]').click(); pg.wait_for_timeout(500)
    pg.query_selector('[data-rowadd^="deliverable"]').click(); pg.wait_for_timeout(200)
    pg.fill('[data-bf="name"]', "Audit checklist rolled out")
    pg.query_selector('.bfseg [data-bfv="pct"]').click()
    pg.query_selector('[data-bfadd="one"]').click(); pg.wait_for_timeout(400)
    ck("the deliverable landed with its kind",
       pg.evaluate("capsOfFunction('%s')[0].projects[0].deliverables[0].kind === 'pct'" % FK))

    print("\n── 8 · the review restates the data, gaps named, and finishing closes only the band ──")
    open_chooser()
    ck("a part-built subject offers Continue AND Start fresh — pausing never costs the plan",
       bool(pg.query_selector('[data-bcont="%s"]' % T)) and bool(pg.query_selector('[data-bpick="%s"]' % T)))
    pg.query_selector('[data-bcont="%s"]' % T).click(); pg.wait_for_timeout(300)
    pg.query_selector('#buildband [data-bfinish]').click(); pg.wait_for_timeout(300)
    # THE MARK ITSELF, never `includes(count)` — the first version of this
    # passed with the chip forced to lie, because the count it looked for
    # also appeared inside the GAP sentence beside it (§94.5's own example:
    # an agreement a substring can satisfy is no agreement)
    agree = pg.evaluate("""(() => {
      var u = UNITS['%s'];
      var mark = function(k){
        var e = document.querySelector('.brvrow[data-bnav="' + k + '"] .bst');
        return e ? e.textContent : null;
      };
      var bad = [];
      if (mark('obj') !== String(u.keyObjectives.length)) bad.push('obj:' + mark('obj'));
      if (mark('plan') !== String(u.items.length)) bad.push('plan:' + mark('plan'));
      var noT = u.items[0].measures.filter(function(m){ return !m.target; }).length;
      var ptext = (document.querySelector('.brvrow[data-bnav="plan"]') || {}).textContent || '';
      if (noT && !ptext.includes('measure')) bad.push('gap-measure');
      return bad;
    })()""" % T)
    ck("the review rows agree with the plan itself", agree == [], agree)
    pg.query_selector('.brvrow[data-bnav="plan"]').click(); pg.wait_for_timeout(400)
    ck("a review row jumps to its section, dialog closed",
       pg.evaluate("!document.querySelector('.modal-overlay.on, .overlay.on')") or
       pg.eval_on_selector("#modal-b", "e=>e.innerHTML==''"))
    pg.query_selector('#buildband [data-bfinish]').click(); pg.wait_for_timeout(300)
    pg.query_selector("[data-bdone]").click(); pg.wait_for_timeout(400)
    ck("finishing clears the mode and hides the band",
       pg.evaluate("BUILDER === null") and pg.eval_on_selector("#buildband", "e=>e.hidden"))
    ck("…and the plan is untouched by it",
       pg.evaluate("UNITS['%s'].items.length === 1 && UNITS['%s'].keyObjectives.length === 1" % (T, T)))

    print("\n── 9 · dismissal writes nothing, and the band hides from whoever may not build ──")
    open_chooser()
    pg.query_selector('[data-bcont="%s"]' % T).click(); pg.wait_for_timeout(300)
    n0 = pg.evaluate("UNITS['%s'].items[0].measures.length" % T)
    pg.query_selector('#buildband [data-bnav="plan"]').click(); pg.wait_for_timeout(300)
    pg.query_selector('[data-rowadd^="measure"]').click(); pg.wait_for_timeout(200)
    pg.fill('[data-bf="name"]', "Never lands")
    pg.keyboard.press("Escape"); pg.wait_for_timeout(300)
    ck("Escape cancels the form without writing",
       pg.evaluate("UNITS['%s'].items[0].measures.length" % T) == n0)
    # a viewer the SHARED RULE refuses — asked of the rule, not guessed from
    # the list, or the first option could be a Super user the band rightly
    # keeps (§94.2: assert the closed door with somebody it is closed to)
    other = pg.evaluate("""(() => {
      var opts = Array.from(document.querySelectorAll('#asWho option'))
        .map(o=>o.value).filter(Boolean);
      for (var i = 0; i < opts.length; i++) {
        var p = personBy(opts[i]);
        if (p && !SMPRules.mayAuthorPage(world(), p, 'u_plan', '%s')) return opts[i];
      }
      return null;
    })()""" % T)
    ck("somebody the rule refuses exists to test with", bool(other), other)
    pg.select_option("#asWho", other)
    pg.wait_for_timeout(400)
    hid = pg.eval_on_selector("#buildband", "e=>e.hidden")
    kept = pg.evaluate("BUILDER && BUILDER.target") == T
    # switching viewers moves `current` to that viewer's own entry (§94.6),
    # so the way back is the builder's own door — Continue, not a hidden
    # assumption that the page never moved
    pg.select_option("#asWho", "smo"); pg.wait_for_timeout(400)
    open_chooser()
    pg.query_selector('[data-bcont="%s"]' % T).click(); pg.wait_for_timeout(400)
    ck("the band hides for a viewer the rule refuses — with the mode kept — and Continue brings it back",
       hid and kept and not pg.eval_on_selector("#buildband", "e=>e.hidden"))

    print("\n── 10 · starting fresh is an archive, never a deletion ──")
    n_arch = pg.evaluate("ARCHIVES.length")
    open_chooser()
    pg.query_selector('[data-bpick="mobile"]').click(); pg.wait_for_timeout(200)
    ck("a standing plan is not overwritten on one press",
       bool(pg.query_selector('[data-bfresh="mobile"]')))
    pg.query_selector('[data-bfresh="mobile"]').click(); pg.wait_for_timeout(600)
    ck("the outgoing plan is archived with the reason",
       pg.evaluate("ARCHIVES.length") == n_arch + 1 and
       pg.evaluate("ARCHIVES[0].kind==='unit' && ARCHIVES[0].key==='mobile' && ARCHIVES[0].why.includes('built on the platform')"))
    ck("…and the plan is now empty for building", pg.evaluate("UNITS.mobile.items.length") == 0)

    print()
    if errs:
        print("console/page errors:", errs[:6])
    if fails or errs:
        print("FAILED:", len(fails), "assertion(s)", "+", len(errs), "error(s)")
        raise SystemExit(1)
    print("plan-builder: all green")
    b.close()
