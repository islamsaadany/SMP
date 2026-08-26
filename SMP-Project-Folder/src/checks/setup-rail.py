"""The Setup rail: it fits the window, and every entry is reachable (§101).

WHAT THIS ASSERTS IS THE PROBLEM, NOT THE LAYOUT (§94.8). Islam's question was
"would the rail stay fit to the window with an internal scroll down?", and the
fault behind it was measurable: 18 entries under 5 groups made the rail 984px
tall, so Branding and Email hung below the fold on any laptop — a control below
the fold is a control that does nothing (§90). So the assertions are:

  * the rail ends inside the window, at four window heights;
  * EVERY entry can be brought into view by scrolling the rail's own list —
    never the page, which is the whole point of an internal scroll;
  * the rail's head stays put while the list scrolls under it;
  * --chrome-h does not move when the rail's height changes, which is the one
    thing that would resurrect v2.8's oscillation (§28.3) and the reason the
    cap is allowed to read it at all.

None of them asserts a NUMBER: a later change to the gutters, the groups or the
entry list stays green, and a cap quietly removed does not.

MEASURED IN THE PINNED STATE, and that is a decision rather than a convenience.
This file carries the prototype banner above the chrome, so at scroll 0 the
rail sits 33px below its sticky pin; a real deployment has no banner and pins at
scroll 0. Measuring at scroll 0 here would assert the prototype's accident
rather than the product's behaviour — so the sweep scrolls past the banner
first, and then asserts separately that nothing was stranded on the way.

Run: SMP_CHROME=... python3 qa-run.py checks/setup-rail.py
"""
import pathlib, sys
from playwright.sync_api import sync_playwright

URL = "file://" + str(pathlib.Path(
    pathlib.Path(__file__).resolve().parent.parent,
    "strategy-management-platform.html").resolve())

fails = []
errs = []


def ck(name, ok, extra=""):
    print(("  ok   " if ok else "  FAIL ") + name + ((" — " + str(extra)) if extra else ""))
    if not ok:
        fails.append(name)


def open_setup(pg):
    pg.select_option("#asWho", "smo")
    pg.wait_for_timeout(300)
    btn = pg.query_selector(".navmenu-btn")
    assert btn, "no Setup control in the navigation row"
    btn.click()
    pg.wait_for_timeout(500)
    # EVERY group open, or the rail is measured at a height nobody has (§51.11:
    # a check that quietly measures less than it claims).
    for g in pg.query_selector_all(".setuprail .rgroup.shut"):
        g.click()
        pg.wait_for_timeout(60)


with sync_playwright() as p:
    b = p.chromium.launch()
    pg = b.new_page(viewport={"width": 1600, "height": 1000})
    pg.on("pageerror", lambda e: errs.append("PAGEERROR: " + str(e)))
    pg.on("console", lambda m: errs.append(m.text) if m.type == "error" else None)
    pg.goto(URL)
    pg.wait_for_timeout(800)
    open_setup(pg)

    print("\n── 1 · the rail fits the window ──")
    for h in (1000, 900, 800, 700):
        pg.set_viewport_size({"width": 1600, "height": h})
        pg.wait_for_timeout(300)
        # Past the prototype banner, so the rail is measured where it lives.
        pg.evaluate("window.scrollTo(0, 200)")
        pg.wait_for_timeout(200)
        m = pg.evaluate("""()=>{
          const r=document.querySelector('.setuprail');
          const l=r.querySelector('.raillist');
          const bb=r.getBoundingClientRect(), hb=r.querySelector('.rhead').getBoundingClientRect();
          return {bottom:Math.round(bb.bottom), top:Math.round(bb.top), win:innerHeight,
                  headTop:Math.round(hb.top), railTop:Math.round(bb.top),
                  scrolls:l.scrollHeight>l.clientHeight+1,
                  chromeH:getComputedStyle(document.documentElement)
                            .getPropertyValue('--chrome-h').trim()};}""")
        ck("ends inside the window @%dpx" % h, m["bottom"] <= m["win"] + 1,
           "bottom %d of %d" % (m["bottom"], m["win"]))
        ck("head sits at the top of the rail @%dpx" % h,
           abs(m["headTop"] - m["railTop"]) <= 1, m)
        # Below the floor the rail stops shrinking on purpose, so "scrolls" is
        # only required where the list is genuinely taller than the box.
        ck("the LIST is what scrolls @%dpx" % h, m["scrolls"], m["scrolls"])

    print("\n── 2 · every entry is reachable by scrolling the LIST ──")
    pg.set_viewport_size({"width": 1600, "height": 800})
    pg.wait_for_timeout(300)
    pg.evaluate("window.scrollTo(0, 200)")
    pg.wait_for_timeout(200)
    keys = pg.eval_on_selector_all(".setuprail [data-setupgo]",
                                   "e=>e.map(x=>x.dataset.setupgo)")
    ck("the rail has entries at all", len(keys) > 8, len(keys))
    pagescroll_before = pg.evaluate("window.scrollY")
    unreachable = pg.evaluate("""(keys)=>{
      const l=document.querySelector('.setuprail .raillist');
      const bad=[];
      for (const k of keys){
        const el=l.querySelector('[data-setupgo="'+k+'"]');
        if(!el){ bad.push(k+':missing'); continue; }
        el.scrollIntoView({block:'nearest'});
        const eb=el.getBoundingClientRect(), lb=l.getBoundingClientRect();
        // Inside the LIST's box, and inside the window.
        if (eb.top < lb.top-1 || eb.bottom > lb.bottom+1) bad.push(k+':outside-list');
        else if (eb.top < 0 || eb.bottom > innerHeight+1) bad.push(k+':offscreen');
      }
      return bad;}""", keys)
    ck("every entry can be scrolled into view", not unreachable, unreachable)
    ck("scrolling the rail did not scroll the PAGE",
       abs(pg.evaluate("window.scrollY") - pagescroll_before) <= 1,
       "page moved %d" % (pg.evaluate("window.scrollY") - pagescroll_before))

    print("\n── 3 · no v2.8 loop: the rail's height does not move the chrome ──")
    # THE ONE ASSERTION THAT LICENSES THE CAP (§28.3). If --chrome-h ever
    # answered differently because the rail got shorter, the feedback loop is
    # back and this cap has to go. Folding every group is the biggest height
    # change the rail can make on its own.
    before = pg.evaluate("getComputedStyle(document.documentElement)"
                         ".getPropertyValue('--chrome-h').trim()")
    hb = pg.evaluate("document.querySelector('.setuprail').getBoundingClientRect().height")
    # RE-QUERIED EVERY TIME, because folding one group repaints the whole rail
    # and every handle taken before it is detached — qa.py's walk loops carry
    # the same note. The group holding the page you are ON never folds, by
    # design, so this deliberately does not assert that all of them shut.
    for k in pg.eval_on_selector_all(".setuprail .rgroup",
                                     "e=>e.map(x=>x.dataset.railgrp)"):
        el = pg.query_selector('.setuprail .rgroup[data-railgrp="%s"]:not(.shut)' % k)
        if el:
            el.click()
            pg.wait_for_timeout(80)
    pg.wait_for_timeout(300)
    after = pg.evaluate("getComputedStyle(document.documentElement)"
                        ".getPropertyValue('--chrome-h').trim()")
    ha = pg.evaluate("document.querySelector('.setuprail').getBoundingClientRect().height")
    ck("the rail's height really did change", abs(ha - hb) > 20, "%d -> %d" % (hb, ha))
    ck("--chrome-h is unmoved by it", before == after, "%s -> %s" % (before, after))

    print("\n── 4 · the cap comes off where the rail is not a rail ──")
    pg.set_viewport_size({"width": 860, "height": 800})
    pg.wait_for_timeout(400)
    narrow = pg.evaluate("""()=>{
      const r=document.querySelector('.setuprail');
      const cs=getComputedStyle(r);
      return {maxH:cs.maxHeight, dir:cs.flexDirection};}""")
    ck("no cap below 900px", narrow["maxH"] == "none", narrow)
    ck("rows lay out in a row below 900px", narrow["dir"] == "row", narrow)

    b.close()

print("\nconsole errors:", errs or "none")
if fails:
    print("\nFAILED: %d" % len(fails))
    for f in fails:
        print("  - " + f)
    sys.exit(1)
print("\nsetup-rail: all assertions passed")
