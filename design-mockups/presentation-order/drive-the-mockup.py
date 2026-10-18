"""Drives 2026-10-18_the-running-order.html and asserts what it claims.

A mockup nobody drives is a picture of an idea, not a proposal — these are
the claims Islam is being asked to approve, so each is pressed rather than
looked at.
"""
import os, sys
from playwright.sync_api import sync_playwright
HERE = os.path.dirname(os.path.abspath(__file__))
PAGE = "file://" + os.path.join(HERE, "2026-10-18_the-running-order.html")
bad = 0
def ck(w, ok, x=""):
    global bad
    print(("  ok    " if ok else "  FAIL  ") + w + ("" if ok else "  — %s" % (x,)))
    if not ok: bad += 1

with sync_playwright() as p:
    b = p.chromium.launch(); pg = b.new_page(viewport={"width": 1500, "height": 1050})
    errs = []; pg.on("pageerror", lambda e: errs.append(str(e)))
    pg.goto(PAGE); pg.wait_for_timeout(500)

    rows = lambda: pg.evaluate("()=>[...document.querySelectorAll('[data-row]')].map(r=>r.dataset.row)")
    runN = lambda: pg.evaluate("()=>document.querySelectorAll('#run .slide').length")

    print("1 · it opens on a client that plans on the company")
    ck("El Abd is the lit client",
       pg.evaluate("()=>document.querySelector('[data-client=elabd]').getAttribute('aria-pressed')") == "true")
    ck("…and its order opens with the Foundation, then the SWOT",
       rows()[:2] == ["found", "swot"], rows()[:4])
    ck("…directions and capabilities before the functions",
       rows()[2:5] == ["d1", "d2", "d3"] and rows()[-1] == "f4", rows())

    print("\n2 · the company's results are pinned last and cannot be dragged")
    ck("the pinned row is there", pg.evaluate("()=>!!document.querySelector('[data-pinned=results]')"))
    ck("…it is NOT draggable, so the one fixed thing looks fixed",
       pg.evaluate("()=>document.querySelector('[data-pinned=results]').draggable") is False)
    ck("…and it carries no × to take it out",
       pg.evaluate("()=>!document.querySelector('[data-pinned=results] .x')"))
    ck("…while an ordinary row does carry one",
       pg.evaluate("()=>!!document.querySelector('[data-row=found] .x')"))

    print("\n3 · taking a part out puts it back on the left")
    n0 = runN()
    ck("the Foundation is in the order, so its button is dead",
       pg.evaluate("()=>document.querySelector('[data-add=found]').disabled") is True)
    pg.click("[data-drop=found]"); pg.wait_for_timeout(200)
    ck("…pressing × takes it out of the order", "found" not in rows(), rows())
    ck("…its button comes back to life",
       pg.evaluate("()=>document.querySelector('[data-add=found]').disabled") is False)
    ck("…and the run gets shorter", runN() < n0, [n0, runN()])
    pg.click("[data-add=found]"); pg.wait_for_timeout(200)
    ck("…adding it again puts it at the end, not back at the front",
       rows()[-1] == "found", rows())
    ck("…and the run is the length it was", runN() == n0, [n0, runN()])

    print("\n4 · every client is the same screen")
    for k, first, kinds in (("raya", "u1", "unit"), ("rhi", "found", "pillar")):
        pg.click("[data-client=%s]" % k); pg.wait_for_timeout(250)
        ck("%s opens with %s" % (k, first), rows()[0] == first, rows())
        ck("…and offers its own kind of part (%s)" % kinds,
           pg.evaluate("()=>[...document.querySelectorAll('.part .k')].map(e=>e.textContent)").count(kinds) > 0)
        ck("…with the results still pinned last",
           pg.evaluate("()=>!!document.querySelector('[data-pinned=results]')"))

    print("\n5 · BOTH ENDS: an empty order still presents the fixed parts")
    pg.click("[data-client=rhi]"); pg.wait_for_timeout(200)
    for r in list(rows()):
        pg.click("[data-drop=%s]" % r); pg.wait_for_timeout(80)
    ck("the order can be emptied", rows() == [], rows())
    ck("…and it says so rather than showing a blank",
       "Nothing in the order" in pg.inner_text("#order"))
    ck("…the run is the cover, the results and the thank-you", runN() == 3, runN())

    print("\n6 · the SMO builds the order; everyone else presents their part of it")
    # Islam: *"that's for the smo team but for the user it will only show
    # their things"*. The claim being approved is that a person's
    # presentation is THIS LIST filtered — not a second screen and not a
    # second builder — so both ends are pressed: what the office can do that
    # an owner cannot, and that the owner still sees the whole agreed order.
    pg.click("[data-client=elabd]"); pg.wait_for_timeout(300)
    ck("the office can take a part out", pg.evaluate("()=>!!document.querySelector('[data-drop]')"))
    # MAKES ITS OWN STATE (§255): El Abd's order already holds every part, so
    # every add button is rightly dead. Take one out, then the office can add.
    pg.click("[data-drop=f4]"); pg.wait_for_timeout(150)
    ck("…and can add one back once something is out",
       pg.evaluate("()=>!document.querySelector('[data-add=f4]').disabled"))
    pg.click("[data-add=f4]"); pg.wait_for_timeout(150)
    ck("…and its rows are draggable",
       pg.evaluate("()=>document.querySelector('[data-row]').draggable") is True)
    office_rows, office_slides = rows(), runN()

    pg.click("[data-viewer=dir]"); pg.wait_for_timeout(300)
    ck("a direction's owner sees the SAME order, not a different screen",
       rows() == office_rows, [rows(), office_rows])
    ck("…but cannot take anything out", pg.evaluate("()=>!document.querySelector('[data-drop]')"))
    ck("…cannot add anything",
       pg.evaluate("()=>[...document.querySelectorAll('[data-add]')].every(b=>b.disabled)"))
    ck("…cannot drag", pg.evaluate("()=>document.querySelector('[data-row]').draggable") is False)
    ck("…and is told why, rather than finding dead controls (\u00a761)",
       pg.evaluate("()=>!!document.querySelector('[data-locked]')"))
    ck("…their own part is marked as theirs",
       pg.evaluate("()=>document.querySelectorAll('[data-mine]').length") == 1,
       pg.evaluate("()=>document.querySelectorAll('[data-mine]').length"))
    ck("…they present FEWER slides than the office", runN() < office_slides,
       [runN(), office_slides])
    ck("…and the company's results are not theirs to present",
       pg.evaluate("()=>!document.querySelector('[data-pinned=results]')"))

    pg.click("[data-viewer=cap]"); pg.wait_for_timeout(250)
    ck("a capability's owner is the same screen again, one part theirs",
       rows() == office_rows and
       pg.evaluate("()=>document.querySelectorAll('[data-mine]').length") == 1)
    pg.click("[data-client=raya]"); pg.wait_for_timeout(250)
    ck("switching client resets to the office",
       pg.evaluate("()=>document.querySelector('[data-viewer=smo]').getAttribute('aria-pressed')") == "true")
    pg.click("[data-viewer=mob]"); pg.wait_for_timeout(250)
    ck("a unit owner on Raya presents their unit alone",
       pg.evaluate("()=>document.querySelectorAll('[data-mine]').length") == 1)

    pg.click("[data-client=elabd]"); pg.wait_for_timeout(300)
    pg.screenshot(path=os.path.join(HERE, "shot.png"), full_page=True)
    ck("no page errors", not errs, errs[:2])
    b.close()

print("\nall good" if not bad else "\n%d FAILED" % bad)
sys.exit(1 if bad else 0)
