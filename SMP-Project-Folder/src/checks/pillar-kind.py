"""A PILLAR SAYS WHETHER IT IS A DIRECTION OR A CAPABILITY (§319).

Islam, of a client whose supporting functions plan the way a unit does: *"a
capability might have targets and tactics like the pillar but it's mostly an
internal thing as well"*, and of three of his own functions, *"they are
planning somehow in a capability format"*. That is the mark §29 hid — his own
*"it will be brought later not now"* — coming back.

  1 · IT IS DRAWN on the Plan page: the rail's sub-line and the pill beside
      the pillar's name.

  2 · IT CAN BE SET, which is the half that makes showing it safe. The field
      was writable on NO screen at all, so the mark alone would have been
      §61's trap — a word every surface shows and nobody can change without
      re-uploading the whole plan. Asserted by PICKING one and reading the
      stored plan back, never the screen (§96) — and the blank asserted as an
      AGREEMENT with what `addPillar` itself mints (§94.8), because §50.6's
      "put it back to its default" here means `""` and not an absence.

  3 · UNSAID DRAWS NOTHING (§15.1). `addPillar` mints `kind: ""`, and the two
      old sites restored by the flag had no guard on the value: an empty one
      gave an empty pill and a separator pointing at nothing.

  4 · AND A SUPPORTING FUNCTION SAYS IT TOO (§53.5, A15) — not a formality,
      because a function planning in pillars is the subject the whole piece
      is for.

  5 · AND SO DOES THE REPORTING BAND, the third surface a pillar is read on.

Point it at another build with SMP_BUILT to falsify it (§276: a broken build
is made from the SOURCES, because §238's hashed policy silences an edited
built file).
"""
import os
from playwright.sync_api import sync_playwright
HERE = os.path.dirname(os.path.abspath(__file__))
F = os.environ.get("SMP_BUILT",
    os.path.join(os.path.dirname(HERE), "strategy-management-platform.html"))
fails = []
def ok(label, cond, detail=""):
    if cond: print("  ok      " + label)
    else:
        fails.append(label); print("  FAIL    " + label + ("  — " + str(detail) if detail else ""))
def click(pg, sel, w=500):
    pg.evaluate("s=>{var b=document.querySelector(s); if(b) b.click();}", sel); pg.wait_for_timeout(w)

with sync_playwright() as p:
    b = p.chromium.launch(executable_path=os.environ.get("SMP_CHROME"))
    pg = b.new_page(viewport={"width": 1600, "height": 900})
    pg.add_init_script("try{sessionStorage.setItem('smp.welcome.seen','1');sessionStorage.setItem('smp.welcome.done','1');sessionStorage.setItem('smp.tour.later','1');}catch(e){}")
    errs = []; pg.on("pageerror", lambda e: errs.append(str(e)))
    pg.goto("file://" + F); pg.wait_for_timeout(900)

    print("\n1 · the mark is drawn where the product used to draw it")
    pg.evaluate("()=>{ current='mobile'; paint(); }"); pg.wait_for_timeout(300)
    click(pg, "[data-s='strategy']"); click(pg, "[data-sub2='plan']")
    click(pg, '.rail .railterse')   # §119.3 ships the rail's detail FOLDED
    rail = pg.evaluate("()=>[...document.querySelectorAll('.rail .ritem .rsub')].map(x=>x.textContent.trim())")
    ok("the rail has rows to read at all", len(rail) >= 3, rail)
    ok("the rail's sub-line names the kind",
       bool(rail) and all(r.startswith(("Direction", "Capability")) for r in rail), rail[:2])
    ok("and no row starts with a stray separator",
       bool(rail) and not any(r.startswith("\u00b7") for r in rail), rail[:2])

    pill = pg.evaluate("()=>{var x=document.querySelector('.pane .pband .pill.kind'); return x?x.textContent.trim():None_}"
                       .replace("None_", "null"))
    ok("and the pill beside the pillar's name says it too",
       pill in ("Direction", "Capability"), pill)

    print("\n2 · it can be SET, which is what makes showing it safe (§61)")
    click(pg, "[data-page='plan']", 700)
    got = pg.evaluate("""()=>{
      var s = document.querySelector('.pfront .kindsel');
      return s ? { opts:[...s.options].map(o=>o.value), val:s.value } : null; }""")
    ok("the pen draws a Kind picker", got is not None, got)
    if got:
        ok("offering blank, Direction and Capability", got["opts"] == ["", "Direction", "Capability"], got["opts"])
    # §215: EVERY DEPENDENT STEP DEGRADES. The first falsification run of this
    # file died here rather than reporting — `select_option` waits 30s for a
    # control the broken build does not draw, then throws — so it printed ONE
    # failure of four and never reached sections 3 or 4 at all. A check that
    # dies on the build it exists to catch is a check that reports nothing.
    # AND THE VALUE PICKED IS THE ONE THE ROW DOES NOT ALREADY HOLD (§94.5).
    # The first draft picked "Capability" outright, and Mobile's first pillar
    # IS a Capability in the worked example — so with the picker deleted the
    # assertion read the seed's own value back and went GREEN on exactly the
    # build it exists to catch. The target is derived from what is stored.
    before = pg.evaluate("()=>UNITS.mobile.items[0].kind")
    want = "Direction" if before != "Direction" else "Capability"
    ok("the row starts on something else, so the pick can be seen",
       before != want, (before, want))
    after = before
    if got:
        try:
            pg.select_option(".pfront .kindsel", want, timeout=3000)
            pg.wait_for_timeout(400)
            after = pg.evaluate("()=>UNITS.mobile.items[0].kind")
        except Exception as e:
            after = "could not pick: " + str(e).split("\n")[0]
    ok("picking one writes the PLAN, not just the screen", after == want, (before, want, after))

    # AND CLEARING IT SPELLS THE BLANK THE WAY THE MINTER DOES — asserted as
    # an AGREEMENT with `addPillar`'s own output rather than as a literal
    # (§94.8), so a later decision to change what an unmarked pillar holds
    # moves both ends together and this stays true.
    #
    # THE FIRST BUILD OF THIS DELETED THE KEY, on §50.6, and the rule says a
    # value put back to its DEFAULT loses its key — the default here is the
    # empty string, not an absence, because `addPillar` writes `kind: ""` and
    # the workbook reader normalises a missing cell to the same. Deleting
    # would have left a cleared pillar differing from every added and every
    # uploaded row, which is a real difference to `same()` and a change the
    # authoriser then has to judge (§249.3 with the sign reversed). *Reading
    # the minter is what caught it; reciting the rule is what would have
    # shipped it.*
    minted = pg.evaluate("""()=>{
      var u = UNITS.mobile, n = u.items.length;
      var it = addPillar(u); var k = it.kind; u.items.length = n; return k; }""")
    cleared = "not attempted"
    if got:
        try:
            pg.select_option(".pfront .kindsel", "", timeout=3000); pg.wait_for_timeout(400)
            cleared = pg.evaluate("()=>UNITS.mobile.items[0].kind")
        except Exception as e:
            cleared = "could not clear: " + str(e).split("\n")[0]
    ok("clearing it leaves the row as an unmarked pillar already is",
       cleared == minted, (cleared, minted))

    pg.evaluate("k=>{ UNITS.mobile.items[0].kind=k; }", before)   # put it back (§94.2)

    print("\n3 · an unsaid kind draws nothing at all (§15.1)")
    pg.evaluate("()=>{ UNITS.mobile.items[0].kind=''; paint(); }"); pg.wait_for_timeout(400)
    st = pg.evaluate("""()=>{
      var sub = document.querySelector('.rail .ritem .rsub');
      var pill = document.querySelector('.pane .pband .pill.kind');
      return { sub: sub ? sub.textContent.trim() : null,
               pill: pill ? pill.textContent.trim() : null }; }""")
    ok("no empty pill", st["pill"] is None or st["pill"] != "", st)
    ok("no leading separator on the rail", not (st["sub"] or "").startswith("·"), st)

    pg.evaluate("k=>{ UNITS.mobile.items[0].kind=k; paint(); }", before); pg.wait_for_timeout(300)

    print("\n4 · and a supporting function that plans in pillars says it too (A15)")
    # §53.5: the two sides of the navigation switch are one product. This is
    # the side the whole feature is FOR -- Islam's three functions "planning
    # somehow in a capability format" -- so a mark that reached a unit only
    # would have missed its own subject.
    # AND THE PEN IS SHUT FIRST. Section 2 opened it, the mode is the TAB's
    # (§269) and survives a destination set from script — and with the pen open
    # the pane draws its EDITING head (§194) rather than the band, so this
    # section measured a shape that was not there and read `None` twice. §245's
    # own lesson inside a check: a section that leaves a mode on hands the next
    # one a different page.
    pg.evaluate("()=>{ EDIT_PAGE = {}; }")
    pg.evaluate("()=>{ FUNCTIONS.merchandising.items[0].kind='Capability'; current='fn:merchandising'; paint(); }")
    pg.wait_for_timeout(400)
    click(pg, "[data-s='fnstrat']")
    # §211: a unit's plan section is `plan` and a FUNCTION's is `proj` — the
    # same page under two keys, and the reason that section exists at all.
    click(pg, "[data-sub2='proj']")
    fn = pg.evaluate('''()=>{
      var band = document.querySelector('.pane .pband .pill.kind');
      var subs = [...document.querySelectorAll('.rail .ritem .rsub')].map(x=>x.textContent.trim());
      return { band: band ? band.textContent.trim() : null, subs: subs.slice(0,2) }; }''')
    ok("a function's band carries the mark", fn["band"] == "Capability", fn)
    ok("its rail has rows to read", len(fn["subs"]) >= 2, fn["subs"])
    ok("and its rail line leads with it",
       bool(fn["subs"]) and fn["subs"][0].startswith("Capability"), fn["subs"])
    ok("while a pillar marked the other way says the other word",
       any(x.startswith("Direction") for x in fn["subs"]), fn["subs"])
    print("\n5 · and the reporting page's band says it too")
    # THE THIRD SURFACE THIS CHANGE TOUCHES. A pillar is read on its plan, on
    # its performance and on the page it is reported against, and a mark on two
    # of the three is how one page comes to disagree with its neighbour
    # (§53.5). §222 made Reporting a TAB, keyed `report`.
    #
    # AND `.pill.kind` IS WORN BY SOMETHING ELSE ON THIS VERY PAGE — the
    # "Not yet due" pill — which is §65.9's collision exactly: one word, one
    # global namespace. Every selector here is scoped to the band, and the
    # assertion below says the band's pill is the KIND and not whatever else
    # happens to carry that class, or a later widening would pass unseen.
    pg.evaluate("()=>{ current='mobile'; paint(); }"); pg.wait_for_timeout(300)
    click(pg, "[data-s='report']", 700)
    rep = pg.evaluate("""()=>{
      var b = document.querySelector('.pane .pband .pill.kind');
      var all = [...document.querySelectorAll('.pill.kind')].map(x=>x.textContent.trim());
      return { band: b ? b.textContent.trim() : null, all: all }; }""")
    ok("the reporting band carries the mark",
       rep["band"] in ("Direction", "Capability"), rep)
    ok("and the class it shares with another pill did not decide the answer",
       rep["band"] != "Not yet due", rep)

    print("\npage errors:", errs[:3])
    ok("no page error", not errs, errs[:1])
    b.close()

print("\n%d failure%s" % (len(fails), "" if len(fails)==1 else "s"))
raise SystemExit(1 if fails else 0)
