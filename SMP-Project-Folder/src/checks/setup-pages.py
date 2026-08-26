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

    print("\n── 1 · every page is named once, in the rail's own word (§120.1) ──")
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

    print("\n── 3 · the name and the table head stay put (§120.2, §120.4) ──")
    pg.evaluate("()=>{currentSub='units';paint();window.scrollTo(0,0);}")
    pg.wait_for_timeout(400)
    top = pg.evaluate("""()=>({t:Math.round(document.querySelector('.setupttl').getBoundingClientRect().top),
      h:Math.round(document.querySelector('#panel table thead th').getBoundingClientRect().top)})""")
    pg.evaluate("()=>window.scrollTo(0,700)")
    pg.wait_for_timeout(450)
    low = pg.evaluate("""()=>({t:Math.round(document.querySelector('.setupttl').getBoundingClientRect().top),
      h:Math.round(document.querySelector('#panel table thead th').getBoundingClientRect().top),
      scrolled:Math.round(window.scrollY)})""")
    # ASSERTED AS "IT IS STILL ON SCREEN", never as a pixel: the offset is built
    # from --chrome-h, so a chrome that changes height must not fail this.
    ck("the page's name is still on screen after scrolling 700px",
       0 < low["t"] < 300, (top, low))
    ck("the table head is still on screen too", 0 < low["h"] < 400, (top, low))
    ck("and the head sits BELOW the name, not over it", low["h"] > low["t"], low)
    ck("neither actually travelled with the page",
       (top["t"] - low["t"]) < 100 and (top["h"] - low["h"]) < 250, (top, low))

    print("\n── 4 · nothing shows through the strip above the pinned name ──")
    # A ::before IS NOT AN ELEMENT, so elementFromPoint cannot see the filler
    # (§53.7's own warning). The colour of the strip is the measurement.
    strip = pg.evaluate("""()=>{
      const h=document.querySelector('.setuphead').getBoundingClientRect();
      const cs=getComputedStyle(document.querySelector('.setuphead'), '::before');
      return {bg:cs.backgroundColor, h:cs.height, top:Math.round(h.top)};}""")
    ck("the header carries a ground filler above it",
       strip["bg"] not in ("rgba(0, 0, 0, 0)", "transparent") and strip["h"] != "0px", strip)

    print("\n── 5 · the headings are separated (§120.4) ──")
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
