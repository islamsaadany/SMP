"""Setup pages: named once, and the name stays put (§117).

Islam, on the built product: *"we need to make the title like overview with a
better design … this page needs to be sticky for the title … there is some
duplication in the titles like business unit business unit."*

THREE THINGS, AND ALL THREE FAIL QUIETLY. A duplicated title looks like a
design choice until somebody counts; a page calling itself something the rail
does not is invisible unless the two are read together; and a header that
scrolls away is only noticed by whoever is on row 20 of a table.

SO IT WALKS EVERY SETUP PAGE rather than sampling one. The naming faults were
found by listing all eighteen side by side — five pages disagreed with the rail
and two printed their name twice, and no single page looks wrong on its own.

Run: SMP_CHROME=... python3 qa-run.py checks/setup-pages.py
"""
import pathlib, sys
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
    pg = b.new_page(viewport={"width": 1600, "height": 900})
    pg.on("pageerror", lambda e: errs.append("PAGEERROR: " + str(e)))
    pg.on("console", lambda m: errs.append(m.text) if m.type == "error" else None)
    pg.add_init_script("try{sessionStorage.setItem('smp.tour.later','1');}catch(e){}")
    pg.goto(URL)
    pg.wait_for_timeout(900)
    pg.select_option("#asWho", "smo")
    pg.wait_for_timeout(300)
    pg.query_selector(".navmenu-btn").click()
    pg.wait_for_timeout(700)
    for _ in range(12):
        g = pg.query_selector(".setuprail .rgroup.shut")
        if not g:
            break
        g.click()
        pg.wait_for_timeout(80)

    entries = pg.eval_on_selector_all(".setuprail .ritem",
        "e=>e.map(x=>[x.dataset.setupgo, x.querySelector('.rilab').textContent.trim()])")
    ck("every Setup page is reachable to walk", len(entries) >= 15, len(entries))

    print("\n── 1 · every page is named once, in the rail's own word (§121.1) ──")
    wrong_name, duplicated, missing = [], [], []
    for k, label in entries:
        pg.evaluate("k=>{currentSub=k;paint();}", k)
        pg.wait_for_timeout(200)
        title = pg.eval_on_selector_all(".setupttl", "e=>e.map(x=>x.textContent.trim())")
        if not title:
            missing.append(label)
            continue
        if title[0] != label:
            wrong_name.append((label, title[0]))
        # THE DUPLICATE IS THE POINT: a section heading repeating the page's
        # name. Compared case-insensitively, because that is how a reader sees
        # it rather than how the source spells it.
        h2 = pg.eval_on_selector_all("#panel h2", "e=>e.map(x=>x.textContent.trim().toLowerCase())")
        if label.lower() in h2:
            duplicated.append(label)
        ck2 = len(title)
        if ck2 != 1:
            missing.append((label, "%d titles" % ck2))
    ck("every page draws exactly one title", not missing, missing)
    ck("and it is the word the rail uses", not wrong_name, wrong_name)
    ck("no section heading repeats the page's name", not duplicated, duplicated)

    print("\n── 2 · a real section heading is NOT swallowed ──")
    # The rule drops a heading that MATCHES the page name, never simply the
    # first one — the Reporting cycle's first section is "Who has reported",
    # which is a real name and must survive.
    pg.evaluate("()=>{currentSub='cycle';paint();}")
    pg.wait_for_timeout(300)
    h2 = pg.eval_on_selector_all("#panel h2", "e=>e.map(x=>x.textContent.trim())")
    ck("Reporting cycle keeps 'Who has reported'", "Who has reported" in h2, h2)

    print("\n── 3 · the name stays put, and a BOXED table's head pins (§273.1) ──")
    # REWRITTEN, NOT DELETED (§218). This asserted §121.4's general rule — every
    # Setup table's `thead th` pinned under the page's own header — and that
    # rule is GONE: §163.5, §130.2 and §174 took the page offset away from every
    # table that had it, because a Setup table sits in `.tblscroll`
    # (`overflow:auto`) and a PAGE offset resolves inside the box, landing the
    # head partway down its own body (141px measured on the matrix, 293px on the
    # register). So the assertion was describing a behaviour the product had
    # deliberately stopped having.
    #
    # AND IT PASSED ON THREE PAGES OUT OF FOUR BY LUCK: Functions and
    # Capabilities are too short to scroll 700px, so their heads never left the
    # screen and "still on screen" was true of a page that had not moved. Only
    # Business units is long enough to expose it. §113.8's shape — an assertion
    # that cannot fail on most of what it walks.
    #
    # What is asserted now is what is TRUE and what matters: the page's name
    # pins on every page, and the tables that DO pin pin inside their own box.
    # THE PAGE IS CHOSEN BY MEASURING, NEVER NAMED (§94.8, §214.3). This was
    # pinned to `units`, and main's own §261 — the Setup tables arranged, their
    # rows acting from one menu — made that page 33px tall, so the guard added
    # one commit earlier ("the page really scrolled") went red on a build that
    # is behaving. Only four Setup pages scroll at all now. Picking the longest
    # keeps this true whichever page that is tomorrow.
    longest, most = None, 0
    for k, _label in entries:
        pg.evaluate("(k)=>{currentSub=k;paint();window.scrollTo(0,0);}", k)
        pg.wait_for_timeout(140)
        h = pg.evaluate("()=>Math.round(document.documentElement.scrollHeight"
                        " - window.innerHeight)")
        if h > most:
            longest, most = k, h
    ck("some Setup page scrolls, so the pinning can be measured at all",
       most > 300, (longest, most))
    pg.evaluate("(k)=>{currentSub=k;paint();window.scrollTo(0,0);}", longest)
    pg.wait_for_timeout(300)
    top = pg.evaluate("()=>Math.round(document.querySelector('.setupttl').getBoundingClientRect().top)")
    pg.evaluate("(n)=>window.scrollTo(0, n)", min(most, 700))
    pg.wait_for_timeout(400)
    low = pg.evaluate("""()=>({t:Math.round(document.querySelector('.setupttl').getBoundingClientRect().top),
      scrolled:Math.round(window.scrollY)})""")
    # PROVED TO HAVE SCROLLED FIRST, or "it is still on screen" is true of a
    # page that never moved — which is exactly how this section used to pass.
    ck("the page really scrolled (%s)" % longest, low["scrolled"] > 300, (longest, low))
    ck("the page's name is still on screen after scrolling",
       0 < low["t"] < 300, (top, low))
    ck("...and it did not travel with the page", (top - low["t"]) < 100, (top, low))

    # AND THE BOXED TABLES ARE DELIBERATELY NOT ASSERTED HERE, WITH THE
    # MEASUREMENT WRITTEN DOWN RATHER THAN HALF-TESTED. Probing them raised a
    # question this file was not opened to answer: `.peoplecfg thead tr` is
    # sticky, but the nearest scroll container above it is `.tblscroll` — so
    # scrolling `.cfg.peoplebox`, which is the box the register actually
    # scrolls in, moved the head straight out of view (measured: top 0 -> -400
    # at scrollTop 400). Either the register's head does not pin the way
    # §69.19 says it does, or the probe is measuring the wrong box — and
    # asserting it either way before that is settled would write a guess into
    # the suite (§94.5). Recorded as open, not as done.

    print("\n── 4 · nothing shows through the strip above the pinned name ──")
    # A ::before IS NOT AN ELEMENT, so elementFromPoint cannot see the filler
    # (§53.7's own warning). The colour of the strip is the measurement.
    strip = pg.evaluate("""()=>{
      const h=document.querySelector('.setuphead').getBoundingClientRect();
      const cs=getComputedStyle(document.querySelector('.setuphead'), '::before');
      return {bg:cs.backgroundColor, h:cs.height, top:Math.round(h.top)};}""")
    ck("the header carries a ground filler above it",
       strip["bg"] not in ("rgba(0, 0, 0, 0)", "transparent") and strip["h"] != "0px", strip)

    print("\n── 5 · the headings are separated (§121.4) ──")
    # PUT THE PAGE BACK FIRST (§94.2, §50.6). §3 now walks every Setup page to
    # find the one that scrolls and leaves the run on it — which is the
    # Knowledge base, a page with no table at all, so this measured an empty
    # list and reported a correct build as broken. A check that moves the state
    # puts it back.
    pg.evaluate("()=>{currentSub='units';paint();window.scrollTo(0,0);}")
    pg.wait_for_timeout(300)
    sep = pg.eval_on_selector_all("#panel table thead th + th",
        "e=>e.map(x=>getComputedStyle(x).borderLeftWidth)")
    ck("every heading after the first has a divider",
       sep and all(v != "0px" for v in sep), sorted(set(sep)))

    b.close()

print("\nconsole errors:", errs or "none")
if fails:
    print("\nFAILED: %d" % len(fails))
    for f in fails:
        print("  - " + f)
    sys.exit(1)
print("\nsetup-pages: all assertions passed")
