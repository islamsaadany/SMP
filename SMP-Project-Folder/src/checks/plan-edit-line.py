"""THE STRATEGY PEN LIVES ON THE SECTION LINE (§248).

Islam: *"the edit button of the plans can you make it in the same line of the
foundation sowt and plan? as it's a better placement for opening and savng?
verifying that it's only in the startegy anyway and not anywhere else."*

WHAT THIS ASSERTS — the problem, not the layout (§94.8):

  1. ON EVERY STRATEGY SECTION, both sides of the navigation switch (§53.5):
     the control is IN the section row, it opens the mode, the page gains
     fields, and pressing it again closes it. Asked of the DATA (EDIT_PAGE and
     the fields on the page), never of the button's own word — a button that
     renders and does nothing renders perfectly (§96).
  2. IT IS THE ONLY ONE. No pen is left in the page body for the same page, or
     the move added a control instead of moving one (§94.15). Measured on a
     function with TWO projects, which is where the duplication was worst.
  3. BOTH ENDS (§94.2): drawn for whoever may AUTHOR the page and drawn for
     nobody else — a build that removed it for everyone passes half of this.
  4. NOT ANYWHERE ELSE, which is the second half of the ask: no such control on
     Performance or Reporting, and the GROUP's own Foundation and Temple are
     UNTOUCHED — they are tabs with no section line, so their pens stay where
     they are. Asserting only the absence would pass on a build that had taken
     the group's pens away too.
  5. ONE WAY OUT. With the mode open the row does not carry both *Done editing*
     and *Done filling* (§248's own duplication, and the wrong word for the
     office).
  6. THE MAP IS ONE MAP. A pillars function's Overview: the row's fill button
     names the page that section actually reads. Before §248 it named
     `foundation` while the page has read `capfoundation` since §213, so it set
     a flag nothing acts on and opened ZERO fields — rendering perfectly.
  7. IT IS DRESSED. Inside `nav.tabs`, `.tabs button` (0,1,1) outranks a bare
     class and strips a control to a plain word — §145.14's trap, which is what
     `Done filling` has been wearing on this line all along. So: a real border
     and, while the mode is open, a real ground.
  8. IT FITS on one line at the widths the product is used at.

Run: SMP_CHROME=... python3 qa-run.py checks/plan-edit-line.py
"""
import pathlib
from playwright.sync_api import sync_playwright

URL = "file://" + str(pathlib.Path("strategy-management-platform.html").resolve())
bad = []


def ck(w, ok, x=""):
    if not ok:
        bad.append(w)
    print(("  ok      " if ok else "  FAIL    ") + w + (("  — " + str(x)) if not ok and x else ""))


STATE = """() => ({
  row:   document.querySelectorAll('#secrow-in .secpen').length,
  rowPage: (document.querySelector('#secrow-in .secpen')||{dataset:{}}).dataset.page || '',
  body:  document.querySelectorAll('#panel [data-page]').length,
  fdone: document.querySelectorAll('#secrow-in .fdone').length,
  edit:  Object.keys(EDIT_PAGE).filter(k => EDIT_PAGE[k]),
  flds:  document.querySelectorAll('#panel .fld, #panel [data-fld]').length,
  sec:   (typeof CURSEC !== 'undefined') ? (CURSEC[currentSub] || '') : '',
  fill:  (document.querySelector('#secrow-in [data-fillcta]')||{dataset:{}}).dataset.fillcta
})"""

DRESS = """() => {
  const b = document.querySelector('#secrow-in .secpen');
  if (!b) return null;
  const s = getComputedStyle(b), q = b.getBoundingClientRect();
  return { bw: s.borderTopWidth, bg: s.backgroundColor, color: s.color,
           radius: s.borderTopLeftRadius, w: Math.round(q.width),
           right: Math.round(q.right) };
}"""

FIT = """() => {
  const row = document.querySelector('#secrow-in');
  if (!row) return null;
  const pen = row.querySelector('.secpen');
  if (!pen) return {noPen: true};
  const tabs = [...row.querySelectorAll('[data-sub2]')];
  const mid = r => Math.round(r.top + r.height / 2);
  const p = pen.getBoundingClientRect();
  /* ONE ROW IS NOT ONE `top` (§122.4): controls of different heights on one
     line have different tops, so the middles are what cluster. */
  return { lines: new Set(tabs.map(t => mid(t.getBoundingClientRect()))
                              .concat([mid(p)])).size,
           inRow: row.contains(pen),
           overflow: Math.round(row.scrollWidth - row.clientWidth) };
}"""


def viewer(pg, key):
    pg.select_option("#asWho", key); pg.wait_for_timeout(420)


# THE SWITCH IS ONE SEGMENTED CONTROL (§47.5), so "press the unlit half" is
# only the way ACROSS — pressed when you are already there it takes you back.
# My own first run did exactly that and reported Merchandising as missing from
# the navigation on a build that draws it (§94.5's lesson, in the harness).
def side(pg, want):
    lit = pg.query_selector("#units .navswitch .nsw.on")
    if lit and want.lower() in (lit.text_content() or "").lower():
        return
    other = pg.query_selector("#units .navswitch .nsw:not(.on)")
    if other and other.is_visible():
        other.click(); pg.wait_for_timeout(430)


def units(pg): side(pg, "Units")
def fns(pg):   side(pg, "Functions")


def dest(pg, key):
    el = pg.query_selector('#units [data-u="%s"]' % key)
    if not (el and el.is_visible()):
        return False
    el.click(); pg.wait_for_timeout(600); return True


def tab(pg, k):
    el = pg.query_selector('#subtabs [data-s="%s"], [data-s="%s"]' % (k, k))
    if el and el.is_visible():
        el.click(); pg.wait_for_timeout(500); return True
    return False


def sec(pg, k):
    el = pg.query_selector('#secrow-in [data-sub2="%s"]' % k)
    if not el:
        return False
    el.click(); pg.wait_for_timeout(480); return True


def press(pg):
    el = pg.query_selector("#secrow-in .secpen")
    if not el:
        return False
    el.click(); pg.wait_for_timeout(700); return True


with sync_playwright() as pw:
    br = pw.chromium.launch()
    pg = br.new_page(viewport={"width": 1500, "height": 950})
    errs = []
    pg.on("pageerror", lambda e: errs.append(str(e)[:160]))
    pg.add_init_script("try{sessionStorage.setItem('smp.tour.later','1');"
                       "sessionStorage.setItem('smp.welcome.done','1');}catch(e){}")
    pg.goto(URL); pg.wait_for_timeout(1000)
    viewer(pg, "smo")

    # ── 1 · EVERY STRATEGY SECTION, BOTH SIDES OF THE SWITCH ──────────
    print("\n1 · the office opens and closes every section from the line")
    WALK = [("unit", "mobile", "strategy", ["found", "swot", "plan"]),
            ("fn",   "finance",       "fnstrat", ["found", "proj"]),
            ("fn",   "merchandising", "fnstrat", ["found", "proj"])]
    for kind, key, tb, secs in WALK:
        (units if kind == "unit" else fns)(pg)
        if not dest(pg, key if kind == "unit" else "fn:" + key):
            ck("%s reached" % key, False, "not in the navigation"); continue
        tab(pg, tb)
        for s in secs:
            if not sec(pg, s):
                ck("%s/%s exists" % (key, s), False); continue
            a = pg.evaluate(STATE)
            ck("%s/%s · the control is on the section line" % (key, s), a["row"] == 1, a)
            ck("%s/%s · and nothing in the page body offers the same page"
               % (key, s), a["body"] == 0, a)
            if not press(pg):
                ck("%s/%s · it can be pressed" % (key, s), False); continue
            o = pg.evaluate(STATE)
            ck("%s/%s · pressing it opens the mode the page reads" % (key, s),
               o["edit"] == [a["rowPage"]], (a["rowPage"], o["edit"]))
            ck("%s/%s · ...and the page gains editable fields" % (key, s),
               o["flds"] > 0, o["flds"])
            ck("%s/%s · one way out, not two (§248)" % (key, s), o["fdone"] == 0, o)
            press(pg)
            c = pg.evaluate(STATE)
            ck("%s/%s · pressing it again closes the mode" % (key, s),
               c["edit"] == [], c["edit"])

    # ── 2 · IT IS THE ONLY ONE, where there used to be several ────────
    print("\n2 · a function with two projects carries one control, not two")
    fns(pg)
    if dest(pg, "fn:marketing"):
        tab(pg, "fnstrat"); sec(pg, "proj")
        d = pg.evaluate("""() => ({
          panes: document.querySelectorAll('#panel .pane').length,
          pens:  document.querySelectorAll('#panel .penbtn[data-page]').length,
          line:  document.querySelectorAll('#secrow-in .secpen').length })""")
        ck("more than one project pane is on screen", d["panes"] >= 2, d)
        ck("...and they carry no pen between them", d["pens"] == 0, d)
        ck("...while the line carries exactly one", d["line"] == 1, d)

    # ── 3 · THE MAP IS ONE MAP (§213, and what §248 corrected) ────────
    print("\n3 · a pillars function's Overview names the page it actually reads")
    fns(pg)
    if dest(pg, "fn:merchandising"):
        tab(pg, "fnstrat"); sec(pg, "found")
        a = pg.evaluate(STATE)
        ck("the row's fill button names capfoundation, not foundation",
           a["fill"] == "capfoundation", a["fill"])
        el = pg.query_selector("#secrow-in [data-fillcta]")
        if el:
            el.click(); pg.wait_for_timeout(700)
            r = pg.evaluate(STATE)
            ck("...and pressing it opens fields rather than a flag nobody reads",
               r["flds"] > 0 and "capfoundation" in r["edit"], r)
            press(pg)

    # ── 4 · BOTH ENDS ────────────────────────────────────────────────
    print("\n4 · drawn for an author, and for nobody else")
    for who, want in (("smo", True), ("mobhead", False), ("ceo", False)):
        viewer(pg, who); units(pg)
        if not dest(pg, "mobile"):
            continue
        tab(pg, "strategy"); sec(pg, "plan")
        got = pg.evaluate("""() => ({
          line: document.querySelectorAll('#secrow-in .secpen').length,
          rule: SMPRules.mayAuthorPage(world(), viewer(), 'u_plan', TARGET) })""")
        ck("%s %s the control" % (who, "has" if want else "has NOT"),
           (got["line"] > 0) is want, got)
        ck("...and the screen agrees with the shared rule",
           (got["line"] > 0) is bool(got["rule"]), got)

    # ── 5 · NOT ANYWHERE ELSE — and the group is untouched ────────────
    print("\n5 · only the Strategy tab, and the group keeps its own pens")
    viewer(pg, "smo"); units(pg); dest(pg, "mobile")
    for t in ("performance", "report"):
        if tab(pg, t):
            n = pg.evaluate("()=>document.querySelectorAll('#secrow-in .secpen,"
                            " #panel [data-page]').length")
            ck("a unit's %s carries no edit control at all" % t, n == 0, n)
    pg.evaluate("""()=>{ const d=document.querySelector('#units details');
      if (d) d.open = true; }""")
    pg.wait_for_timeout(200)
    g = pg.query_selector('#units [data-u="group"]')
    if g:
        g.click(); pg.wait_for_timeout(700)
        for t, sel, what in (("foundation", '#panel .hoverpen .penbtn[data-page="foundation"]',
                              "the group's Foundation keeps its pen in the card"),
                             ("temple", '#panel .pageact [data-page="temple"]',
                              "the group's Temple keeps its Edit bar")):
            tab(pg, t)
            ck(what, pg.query_selector(sel) is not None)
            ck("...and it is not on a section line (that tab has none)",
               pg.evaluate("()=>document.querySelectorAll('#secrow-in .secpen').length") == 0)

    # ── 6 · IT IS DRESSED, and it fits ───────────────────────────────
    print("\n6 · it is a button, not a bare word, and the line holds")
    units(pg); dest(pg, "mobile"); tab(pg, "strategy"); sec(pg, "plan")
    d = pg.evaluate(DRESS)
    ck("it has a real border (§145.14's trap)",
       d and d["bw"] not in ("0px", "", None), d)
    ck("...and a radius, so it reads as a control", d and d["radius"] != "0px", d)
    press(pg)
    o = pg.evaluate(DRESS)
    ck("open, it takes a ground of its own",
       o and o["bg"] not in ("rgba(0, 0, 0, 0)", "transparent"), o)
    press(pg)
    pg.close()

    for w in (1500, 1280, 1100, 1000, 900, 820):
        pg = br.new_page(viewport={"width": w, "height": 850})
        pg.on("pageerror", lambda e: errs.append(str(e)[:160]))
        pg.add_init_script("try{sessionStorage.setItem('smp.tour.later','1');"
                           "sessionStorage.setItem('smp.welcome.done','1');}catch(e){}")
        pg.goto(URL); pg.wait_for_timeout(900)
        viewer(pg, "smo"); units(pg)
        if dest(pg, "mobile"):
            tab(pg, "strategy"); sec(pg, "plan")
            f = pg.evaluate(FIT)
            ck("@%d · the control is inside the section row" % w,
               bool(f) and f.get("inRow") is True, f)
            ck("@%d · tabs and control share one line" % w,
               bool(f) and f.get("lines") == 1, f)
            ck("@%d · and the row does not scroll sideways" % w,
               bool(f) and f.get("overflow", 1) <= 0, f)
        pg.close()

    ck("no page errors anywhere in the walk", not errs, errs[:3])
    br.close()

print("\n" + ("FAILED (%d): " % len(bad) + "; ".join(bad[:8])
              if bad else "all plan-edit-line checks passed"))
