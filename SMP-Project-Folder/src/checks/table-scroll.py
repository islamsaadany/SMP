"""A WIDE TABLE SCROLLS IN ITS OWN BOX, AND THE NAME STAYS PUT (§141),
AND THE VIEWER SWITCHER SAYS THE NAME AND THE PLACE (§142).

§141 came from Islam using the product on his own laptop: *"I'm stuck with the
unit tables cut and I can't scroll horizontally."* The page never scrolls
sideways by design (§27.2 — it drags every sticky element with it), so a plan
wider than its pane was simply CUT with nothing to reach the rest.

THE DEMO'S PLAN FITS AND THE CLIENT'S DOES NOT, which is how this reached
production unnoticed — so the check MAKES the state (§94.2): it forces the
table wider than its pane and measures from there, rather than waiting for a
tenant whose data happens to overflow.

WHAT IS ASSERTED — the problem, not the pixels (§94.8):
  1. With a table wider than its pane, the BOX can scroll and the PAGE cannot
     (§27.2 holds, which is the whole reason the box exists).
  2. Scrolled to the far end, the last column is reachable AND the name column
     has not moved — the frozen pair, asserted as "the name is still at the
     left edge while a figure column has moved".
  3. The frozen cells are opaque: what scrolls under them does not show
     through (measured with elementFromPoint, not by reading the CSS).
  4. Nothing changes where the table already fits: no scrollbar, no shift.
  5. §142: every switcher option reads "name — place", the job title is on
     the hover rather than in the line, and the closed control shows its whole
     label with nothing clipped.

Run: SMP_CHROME=... python3 qa-run.py checks/table-scroll.py
"""
import pathlib
from playwright.sync_api import sync_playwright

url = "file://" + str(pathlib.Path("strategy-management-platform.html").resolve())
bad = 0


def ck(w, ok, x=""):
    global bad
    if not ok:
        bad += 1
    print(("  ok      " if ok else "  FAIL    ") + w + (("  — " + str(x)) if not ok and x else ""))


WIDEN = """() => {
  var s = document.createElement('style');
  s.id = 'widen';
  s.textContent = '#panel .pane table { min-width:1400px; }';
  document.head.appendChild(s);
}"""

with sync_playwright() as p:
    b = p.chromium.launch()
    pg = b.new_page(viewport={"width": 1100, "height": 760})
    errs = []
    pg.on("pageerror", lambda e: errs.append(str(e)))
    pg.goto(url)
    pg.wait_for_timeout(800)
    who = pg.eval_on_selector_all("#asWho option", "els=>els.map(e=>e.value)")
    pg.select_option("#asWho", who[0])
    pg.wait_for_timeout(300)
    pg.query_selector('#units [data-u="mobile"]').click()
    pg.wait_for_timeout(400)

    print("— where the table already fits, nothing changes —")
    fit = pg.evaluate("""() => {
      var w = document.querySelector('#panel .tblscroll');
      return {wrapped: !!w,
              scrolls: w ? w.scrollWidth - w.clientWidth : -1,
              pageSideways: document.documentElement.scrollWidth - innerWidth};
    }""")
    ck("plan tables are wrapped in a scroll box", fit.get("wrapped"), fit)
    ck("...which does not scroll while the table fits", fit.get("scrolls", 1) <= 0, fit)
    ck("no sideways page scroll", fit.get("pageSideways", 1) <= 0, fit)

    print("— forced wider than the pane (the client's plan) —")
    pg.evaluate(WIDEN)
    pg.wait_for_timeout(300)
    st = pg.evaluate("""() => {
      var w = [...document.querySelectorAll('#panel .tblscroll')].find(x => x.scrollWidth > x.clientWidth);
      return {found: !!w,
              boxScrolls: w ? w.scrollWidth - w.clientWidth : 0,
              pageSideways: document.documentElement.scrollWidth - innerWidth};
    }""")
    ck("the box can scroll", st.get("found") and st.get("boxScrolls", 0) > 0, st)
    ck("the page still cannot (§27.2)", st.get("pageSideways", 1) <= 0, st)

    moved = pg.evaluate("""() => {
      var w = [...document.querySelectorAll('#panel .tblscroll')].find(x => x.scrollWidth > x.clientWidth);
      if (!w) return {err: 'nothing to scroll'};
      var row = w.querySelector('tbody tr');
      var name = row.children[1], last = row.children[row.children.length - 1];
      var n0 = name.getBoundingClientRect().left, l0 = last.getBoundingClientRect().left;
      w.scrollLeft = w.scrollWidth;
      var n1 = name.getBoundingClientRect().left, l1 = last.getBoundingClientRect().left;
      var nb = name.getBoundingClientRect();
      var hit = document.elementFromPoint(nb.left + nb.width/2, nb.top + nb.height/2);
      return {nameMoved: Math.abs(n1 - n0), figureMoved: Math.abs(l1 - l0),
              lastInView: l1 >= 0 && l1 < innerWidth,
              nameOnTop: !!(hit && (hit === name || name.contains(hit)))};
    }""")
    ck("a figure column moves when the box scrolls", moved.get("figureMoved", 0) > 20, moved)
    ck("the name column does NOT move", moved.get("nameMoved", 99) <= 1, moved)
    ck("the last column becomes reachable", moved.get("lastInView"), moved)
    ck("the frozen name is opaque — nothing shows through it",
       moved.get("nameOnTop"), moved)

    print("— the viewer switcher (§142) —")
    pg.evaluate("var s=document.getElementById('widen'); if(s) s.remove();")
    pg.wait_for_timeout(200)
    opts = pg.evaluate("""() => [...document.querySelectorAll('#asWho option')].map(function(o){
      return {text: o.textContent, title: o.getAttribute('title') || ''};
    })""")
    ck("options exist", len(opts) > 3, len(opts))
    ck("every option reads 'name — place'",
       all(" — " in o["text"] and o["text"].count(" — ") == 1 for o in opts),
       [o["text"] for o in opts if o["text"].count(" — ") != 1][:2])
    ck("no option carries a job title in the line",
       not any("Head of" in o["text"] or "Chief" in o["text"] for o in opts),
       [o["text"] for o in opts if "Head of" in o["text"]][:2])
    ck("the job title is on the hover instead",
       all(o["title"] for o in opts) and
       any("Head of" in o["title"] or "Chief" in o["title"] for o in opts),
       [o["title"] for o in opts[:2]])
    ck("no two options read identically",
       len(set(o["text"] for o in opts)) == len(opts),
       [t for t in set(o["text"] for o in opts) if [o["text"] for o in opts].count(t) > 1][:2])
    clip = pg.evaluate("""() => {
      var l = document.querySelector('.viewer .sslabel');
      if (!l) return {none: true};
      return {clipped: l.scrollWidth > l.clientWidth + 1, text: l.textContent};
    }""")
    ck("the closed control shows its label whole", clip.get("clipped") is False, clip)

    ck("no page errors while driving", not errs, errs[:2])
    b.close()

print("table-scroll: %s" % ("OK" if bad == 0 else "%d FAILURES" % bad))
raise SystemExit(1 if bad else 0)
