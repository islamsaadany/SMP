"""THE DESTINATION ROW IS ONE LINE THAT SCROLLS (§136, reversing arrange.css's
wrap comment at Islam's direction — "Decision 1: B").

WHAT WAS BROKEN: below ~1100px the row WRAPPED while its box was held at 46px
(`height:46px` in _shared.css against `flex-wrap:wrap` in arrange.css), so the
second line painted OUTSIDE the box, over the tab row — overlapping text, and
on some pages the hidden line took the clicks: §118.7, confirmed live at 1024
when a function's Strategy tab press was intercepted and a sweep hung on it.

WHAT THIS ASSERTS — the PROBLEM, not the markup (§94.8, §51.11):
  1. No overlap: every tab-row button receives its own click point
     (elementFromPoint at its centre), and the units row's box ends above the
     tab row's top.
  2. The controls never leave the screen: the Units|Functions switch and the
     gear are fully inside the viewport and receive their own click points —
     the flaw the first draft of B showed (the switch slid off the left edge).
  3. The tail is reachable: the LAST destination can be brought into view by
     scrolling the row itself and then navigates when pressed.
  4. The fades tell the truth: visible only on the side that actually has
     more to show, and absent entirely at a width where everything fits.
  5. No sideways page scroll at any swept width (§27.2 — it drags every
     sticky element with it).
  6. Both sides of the navigation switch (§53.5): the function list gets the
     same row, and the exact press that hung the sweep — a function's
     Strategy tab at 1024 — lands.

Run: SMP_CHROME=... python3 qa-run.py checks/nav-scroll.py
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


def hits_self(pg, sel):
    """The centre of the element resolves to the element (or a child of it).
    'In the document' passed every day this was broken (§93.4, §110)."""
    return pg.evaluate("""(sel) => {
      var el = document.querySelector(sel);
      if (!el) return "absent: " + sel;
      var r = el.getBoundingClientRect();
      if (r.width === 0 || r.right < 0 || r.left > innerWidth) return "off-screen";
      var hit = document.elementFromPoint(r.left + r.width/2, r.top + r.height/2);
      return (el === hit || el.contains(hit)) ? "ok"
        : "intercepted by " + (hit ? hit.tagName + "." + (hit.className || "") : "nothing");
    }""", sel)


def row_geometry(pg):
    return pg.evaluate("""() => {
      var u = document.querySelector("nav.units"), t = document.getElementById("tabrow");
      if (!u || !t) return {err: "rows missing"};
      var ub = u.getBoundingClientRect(), tb = t.getBoundingClientRect();
      // Any UNIT BUTTON whose box reaches below the units row's own bottom is
      // the §118.7 fault: content painting outside the 46px box. The Group
      // dropdown's own menu items also carry data-u and legitimately sit
      // below the row — a dropdown's items are not the row, so they are out.
      var spill = [...u.querySelectorAll("button[data-u]")].filter(function(b){
        if (b.closest(".menu")) return false;
        var r = b.getBoundingClientRect();
        return r.width > 0 && r.bottom > ub.bottom + 1;
      }).length;
      return {unitsBottom: ub.bottom, tabTop: tb.top, spill: spill,
              pageScroll: document.documentElement.scrollWidth - innerWidth};
    }""")


def tab_centres_clean(pg):
    return pg.evaluate("""() => {
      var out = [];
      document.querySelectorAll("#tabrow button").forEach(function(b){
        var r = b.getBoundingClientRect();
        if (!r.width) return;
        var hit = document.elementFromPoint(r.left + r.width/2, r.top + r.height/2);
        if (!(b === hit || b.contains(hit)))
          out.push(b.textContent.trim() + " -> " + (hit ? hit.tagName + "." + (hit.className || "") : "?"));
      });
      return out;
    }""")


def sweep(pg, width):
    print("— %dpx —" % width)
    pg.set_viewport_size({"width": width, "height": 720})
    pg.wait_for_timeout(400)
    g = row_geometry(pg)
    ck("units row does not spill past its own box", g.get("spill") == 0, g)
    ck("tab row starts below the units row", g.get("tabTop", 0) >= g.get("unitsBottom", 1) - 1, g)
    ck("no sideways page scroll", g.get("pageScroll", 1) <= 0, g)
    inter = tab_centres_clean(pg)
    ck("every tab receives its own click point", not inter, inter)
    ck("the Units|Functions switch receives its click", hits_self(pg, "#units .navswitch") == "ok",
       hits_self(pg, "#units .navswitch"))
    ck("the gear receives its click", hits_self(pg, "#units .navmenu-btn") == "ok",
       hits_self(pg, "#units .navmenu-btn"))


with sync_playwright() as p:
    b = p.chromium.launch()
    pg = b.new_page(viewport={"width": 1024, "height": 720})
    errs = []
    pg.on("pageerror", lambda e: errs.append(str(e)))
    pg.goto(url)
    pg.wait_for_timeout(800)
    who = pg.eval_on_selector_all("#asWho option", "els=>els.map(e=>e.value)")
    pg.select_option("#asWho", who[0])
    pg.wait_for_timeout(300)
    pg.query_selector('#units [data-u="mobile"]').click()
    pg.wait_for_timeout(300)

    for w in (1024, 1100, 1280):
        sweep(pg, w)

    print("— the tail, at 1024 —")
    pg.set_viewport_size({"width": 1024, "height": 720})
    pg.wait_for_timeout(400)
    # The row must be able to SCROLL ITSELF to the last destination. On the
    # broken build there is no scroll region at all, so this fails as
    # "cannot be brought into view", which is the truthful description.
    tail = pg.evaluate("""() => {
      var sc = document.getElementById("navscroll");
      var last = [...document.querySelectorAll('#units button[data-u]')].pop();
      if (!last) return "no destinations";
      if (sc) sc.scrollLeft = sc.scrollWidth;
      var r = last.getBoundingClientRect();
      if (r.width === 0 || r.right > innerWidth || r.left < 0) return "not in view";
      var hit = document.elementFromPoint(r.left + r.width/2, r.top + r.height/2);
      return (last === hit || last.contains(hit)) ? "ok:" + last.dataset.u : "intercepted";
    }""")
    ck("the last destination can be scrolled into view", str(tail).startswith("ok:"), tail)
    if str(tail).startswith("ok:"):
        key = str(tail)[3:]
        pg.query_selector('#units button[data-u="%s"]' % key).click()
        pg.wait_for_timeout(400)
        now = pg.evaluate("document.querySelector('#units button[aria-selected=\\'true\\'][data-u]')?.dataset.u")
        ck("pressing it navigates", now == key, now)
        # Fades tell the truth at the far end: something behind, nothing ahead.
        fl = pg.evaluate("(document.querySelector('.navfade.l')||{}).hidden")
        fr = pg.evaluate("""() => { var sc = document.getElementById("navscroll");
          if (!sc) return "no scroll region";
          var more = sc.scrollWidth - sc.clientWidth - sc.scrollLeft > 2;
          var f = document.querySelector('.navfade.r');
          return f ? (f.hidden === !more ? "ok" : "lies") : "absent"; }""")
        ck("left fade shows once there is something behind", fl is False, fl)
        ck("right fade agrees with what is left to see", fr == "ok", fr)

    print("— everything fits: no fades, no overflow —")
    pg.set_viewport_size({"width": 1600, "height": 900})
    pg.wait_for_timeout(400)
    fits = pg.evaluate("""() => {
      var sc = document.getElementById("navscroll");
      if (!sc) return {err: "no scroll region"};
      var l = document.querySelector('.navfade.l'), r = document.querySelector('.navfade.r');
      return {overflow: sc.scrollWidth - sc.clientWidth,
              fadeL: l ? l.hidden : "absent", fadeR: r ? r.hidden : "absent"};
    }""")
    ck("no overflow at 1600", isinstance(fits, dict) and fits.get("overflow", 1) <= 0, fits)
    ck("both fades hidden at 1600", isinstance(fits, dict) and fits.get("fadeL") is True and fits.get("fadeR") is True, fits)

    print("— the other side of the switch, at 1024 (§53.5) —")
    pg.set_viewport_size({"width": 1024, "height": 720})
    pg.wait_for_timeout(400)
    pg.query_selector("#units .navswitch").click()
    pg.wait_for_timeout(400)
    sweep(pg, 1024)
    # The exact press that hung the sweep on the broken build: a function's
    # Strategy tab. click() with a short timeout — Playwright refuses a click
    # on an intercepted control, which IS the fault (§70's argument).
    fn = [e for e in pg.query_selector_all("#units button[data-u]") if e.is_visible()]
    ck("a function is reachable on this side", bool(fn))
    if fn:
        fn[0].click()
        pg.wait_for_timeout(400)
        landed = "no strategy tab"
        try:
            t = pg.query_selector('#tabrow button[data-s="fnstrat"]') or \
                pg.query_selector('#tabrow button[data-s]')
            if t:
                t.click(timeout=3000)
                pg.wait_for_timeout(300)
                landed = pg.evaluate("document.querySelector('#tabrow button[aria-selected=\\'true\\']')?.textContent.trim()")
        except Exception as e:
            landed = "CLICK REFUSED: " + str(e).split("\n")[0]
        ck("the function's first tab press lands", isinstance(landed, str) and "REFUSED" not in landed, landed)

    ck("no page errors while driving", not errs, errs[:2])
    b.close()

print("nav-scroll: %s" % ("OK" if bad == 0 else "%d FAILURES" % bad))
raise SystemExit(1 if bad else 0)
