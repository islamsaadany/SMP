"""THE RAIL'S BUTTON IS AN OPTIONS MENU, IT CAN HIDE YEARS, AND BOTH HEADS
PIN (§771).

Islam, of a plan whose directions run in different years: *"we need a way to
filter which directions to see from the directions left pan"*; of the shape,
*"part of the options beside the word directions where we make the button an
options drop down that shows details or set which years to show in a sub list
with checks. and we can have the same options button somehow in the
horizontal view"*; and *"the header needs to stay freezed on scrolling down"*
— *"freeze both headers"*. Mockup signed off: design-mockups/strip-years/
2026-11-16_strip-year-filter.html, E. The band's own pinning on the squeezed
window is asserted by strip-stays.py (its point 2, reversed there).

  1 · THE BUTTON OPENS A MENU. The ≡ beside the head's word opens a panel
      holding the detail switch and, on a list whose years are marked, Years
      to show: one tick a year, each with how many directions run in it.
      With years off, the panel holds the detail switch alone.
  2 · THE DETAIL TICK IS THE OLD SWITCH: ticked, every row's small line is
      back and the preference is written where §60 kept it.
  3 · UNTICKING A YEAR hides the directions that run in no ticked year; the
      head reads "n of N"; the button wears its dot; a hidden open direction
      gives way to the first one showing; ticking it back shows all, no dot.
  4 · THE LAST TICK IS HELD, so the rail can never show nothing.
  5 · THE THREE RAILS AGREE: Performance and Reporting draw the same rows
      with the year unticked (§324, §53.5).
  6 · A CLICK ELSEWHERE CLOSES IT, and so does Escape.
  7 · THE STRIP keeps the button at its left end without the word, opens the
      same menu without the detail switch (a strip has no detail line), and
      says "n of N" beside the button only while a year is unticked.
  8 · A TABLE'S HEAD PINS UNDER THE BAND, reading on a wide window, reading
      and editing on the squeezed one: scrolled into the table, its head
      sits at the band's bottom edge.
  9 · A TABLE TOO WIDE FOR ITS PANE KEEPS ITS SCROLL BOX and its head is not
      pinned — reachable beats pinned (§151, §273.1).

SMP_BUILT points it at another build (§276); it is red on the build before.
Run: python3 qa-run.py checks/strip-years.py
"""
import os
from playwright.sync_api import sync_playwright

HERE = os.path.dirname(os.path.abspath(__file__))
F = os.environ.get("SMP_BUILT", os.path.join(os.path.dirname(HERE), "strategy-management-platform.html"))
INIT = ("try{sessionStorage.setItem('smp.welcome.done','1');sessionStorage.setItem('smp.welcome.seen','1');"
        "sessionStorage.setItem('smp.tour.later','1');localStorage.setItem('smp.tour.never','1');"
        "localStorage.setItem('smp.rail.terse','1')}catch(e){}")
ZOOM_OFF = ("new MutationObserver(function(m, o){ var d = document.documentElement; if (!d) return; "
            "d.style.setProperty('zoom','1'); d.style.setProperty('--winw','100vw'); "
            "d.style.setProperty('--winh','100vh'); d.style.setProperty('--wind','100dvh'); "
            "o.disconnect(); }).observe(document, { childList: true });")
fails = []


def ok(label, cond, detail=""):
    if cond:
        print("  ok      " + label)
    else:
        fails.append(label)
        print("  FAIL    " + label + ("  — " + str(detail) if detail else ""))


def press(pg, sel, w=300):
    """A click through the page's own handler — on a build without the control
    the assertion goes red rather than the run dying on a locator (§276)."""
    safe(pg, "()=>{var b=document.querySelector(%r); if(b) b.click(); return !!b;}" % sel)
    pg.wait_for_timeout(w)


def safe(pg, js, dflt=None):
    try:
        return pg.evaluate(js)
    except Exception:
        return dflt


def page(b, w, h=760):
    pg = b.new_page(viewport={"width": w, "height": h})
    pg.add_init_script(INIT)
    pg.add_init_script(ZOOM_OFF)
    pg._errs = []
    pg.on("pageerror", lambda e: pg._errs.append(str(e)))
    pg.goto("file://" + F)
    pg.wait_for_timeout(1300)
    return pg


# Mobile's four: the second runs in Years 2–3, the fourth in Year 1 only.
YEARS_ON = ("()=>{GROUP.structure={details:{years:true}}; UNITS.mobile.items[1].years=[2,3];"
            " UNITS.mobile.items[3].years=[1]; paint();}")
YEARS_OFF = "()=>{delete GROUP.structure; delete UNITS.mobile.items[1].years; delete UNITS.mobile.items[3].years; paint();}"


def go(pg, sub=None, sub2=None):
    pg.click('[role=tab][data-u="mobile"]'); pg.wait_for_timeout(400)
    if sub:
        pg.click('[role=tab][data-s="%s"]' % sub); pg.wait_for_timeout(500)
    if sub2:
        pg.click('[role=tab][data-sub2="%s"]' % sub2); pg.wait_for_timeout(500)


RAIL = r"""() => {
  var r = document.querySelector('.split > .rail'); if (!r) return null;
  var head = r.querySelector('.rhead'), btn = r.querySelector('[data-railopts]'), panel = r.querySelector('.railopts-panel');
  var rows = [].map.call(r.querySelectorAll('.ritem'), function(b){ return { code: (b.querySelector('.rcode')||{}).textContent, on: b.classList.contains('on'), sub: !!b.querySelector('.rsub') }; });
  var hl = head.querySelector('.rhl'), rof = head.querySelector('.rof.strip');
  return { rows: rows, n: rows.length, open: !!panel, filtered: btn.classList.contains('filtered'),
    word: hl ? getComputedStyle(hl).display : null, wordText: hl ? hl.textContent.trim() : '',
    strip: rof ? [getComputedStyle(rof).display, rof.textContent.trim()] : null,
    detail: panel ? [].map.call(panel.querySelectorAll('[data-railterse]'), function(i){ return [i.checked, getComputedStyle(i.closest('.railopt')).display]; }) : null,
    ticks: panel ? [].map.call(panel.querySelectorAll('[data-railyear]'), function(i){ var l = i.closest('.railopt'); return { y: +i.dataset.railyear.split('|')[1], on: i.checked, held: i.disabled, n: +(l.querySelector('small')||{}).textContent, label: l.textContent.trim() }; }) : null,
    btnRight: btn.getBoundingClientRect().right, railRight: r.getBoundingClientRect().right,
    panelRight: panel ? panel.getBoundingClientRect().right : null,
    covered: panel ? (function(){ var q = panel.getBoundingClientRect(); var e = document.elementFromPoint(q.right - 6, q.top + 10); return !(e && panel.contains(e)); })() : null };
}"""

HEADS = r"""() => {
  var band = document.querySelector('.split > .pane > .pband, .split > .pane > .ptitle.edhead');
  var bb = band ? band.getBoundingClientRect().bottom : null, out = [];
  [].forEach.call(document.querySelectorAll('.split > .pane .tblscroll'), function(w){
    var th = w.querySelector('thead th'), t = w.querySelector('table').getBoundingClientRect();
    out.push({ fits: w.classList.contains('fits'), thTop: th.getBoundingClientRect().top, sticky: getComputedStyle(th).position,
               spans: bb != null && t.top < bb && t.bottom > bb + 60, wide: w.scrollWidth > w.clientWidth + 1 });
  });
  return { bandBottom: bb, tables: out, sy: scrollY };
}"""


def pinned_head(pg):
    h = safe(pg, HEADS) or {"tables": [], "bandBottom": None, "sy": 0}
    live = [t for t in h["tables"] if t["spans"]]
    return h, live


with sync_playwright() as p:
    b = p.chromium.launch(executable_path=os.environ.get("SMP_CHROME"))

    # ── 1, 2, 3, 4, 6 · the wide window's list
    pg = page(b, 1440)
    go(pg, sub2="plan")
    safe(pg, YEARS_OFF)
    press(pg, "[data-railopts]")
    r = safe(pg, RAIL)
    ok("1440 · the ≡ opens a panel", r and r["open"])
    ok("1440 · years off: the detail switch alone, no years", r and r["detail"] and len(r["detail"]) == 1 and r["ticks"] == [],
       r and (r["detail"], r["ticks"]))
    safe(pg, YEARS_ON); pg.wait_for_timeout(300)   # the menu stays open through the repaint
    r = safe(pg, RAIL)
    ok("1440 · years on: Years to show, one tick a year, each with its count",
       r and r["ticks"] and [t["y"] for t in r["ticks"]] == [1, 2, 3] and all(t["on"] and not t["held"] for t in r["ticks"])
       and [t["n"] for t in r["ticks"]] == [3, 3, 3], r and r["ticks"])
    ok("1440 · the panel is not covered by the pane beside it", r and r["covered"] is False, r and r["covered"])
    ok("1440 · this year is named", r and r["ticks"] and "this year" in r["ticks"][0]["label"], r and r["ticks"])
    ok("1440 · at rest: four rows, no dot, the head's plain count", r and r["n"] == 4 and not r["filtered"] and r["wordText"].endswith("4"),
       r and (r["n"], r["filtered"], r["wordText"]))
    # 2 · the detail tick
    press(pg, "[data-railterse]", 400)
    r = safe(pg, RAIL)
    ok("1440 · ticking the detail brings every row's small line back", r and all(x["sub"] for x in r["rows"]) and r["detail"][0][0] is True,
       r and ([x["sub"] for x in r["rows"]], r["detail"]))
    ok("1440 · …and writes the preference where §60 kept it", safe(pg, "()=>localStorage.getItem('smp.rail.terse')") == "0")
    ok("1440 · the menu stayed open through the tick", r and r["open"])
    press(pg, "[data-railterse]", 300)
    # 3 · untick Year 1: MB04 (Year 1 only) leaves; MB01 stays open
    press(pg, '[data-railyear=\"mobile|1\"]', 400)
    r = safe(pg, RAIL)
    ok("1440 · Year 1 unticked: the Year-1-only direction leaves the rail", r and r["n"] == 3 and all("04" not in (x["code"] or "") for x in r["rows"]),
       r and [x["code"] for x in r["rows"]])
    ok("1440 · the head reads 3 of 4", r and "3 of 4" in r["wordText"].replace("\n", " "), r and r["wordText"])
    ok("1440 · the button wears its dot", r and r["filtered"])
    ok("1440 · the menu stayed open", r and r["open"] and [t["on"] for t in r["ticks"]] == [False, True, True], r and r["ticks"])
    # the open one hidden: open MB04 first, then hide Year 1
    press(pg, '[data-railyear=\"mobile|1\"]', 300)
    press(pg, ".split > .rail .ritem[data-oi='3']", 400)
    r0 = safe(pg, RAIL)
    press(pg, "[data-railopts]")
    press(pg, '[data-railyear=\"mobile|1\"]', 400)
    r = safe(pg, RAIL)
    ok("1440 · the open direction, hidden, gives way to the first one showing",
       r0 and r0["rows"][3]["on"] and r and r["rows"][0]["on"] and r["n"] == 3, (r0 and [x["on"] for x in r0["rows"]], r and [x["on"] for x in r["rows"]]))
    # 4 · held: untick Year 2 too, leaving Year 3 alone → held
    press(pg, '[data-railyear=\"mobile|2\"]', 400)
    r = safe(pg, RAIL)
    ok("1440 · Years 1 and 2 unticked: only Year 3's run", r and r["n"] == 3 and [t["on"] for t in r["ticks"]] == [False, False, True], r and (r["n"], r["ticks"]))
    ok("1440 · the last tick is held", r and r["ticks"][2]["held"] and not r["ticks"][0]["held"], r and r["ticks"])
    # 5 · the other two rails agree
    pg.click("body", position={"x": 1300, "y": 600}); pg.wait_for_timeout(300)
    r = safe(pg, RAIL)
    ok("1440 · a click elsewhere closes the menu, the years stay", r and not r["open"] and r["n"] == 3 and r["filtered"], r and (r["open"], r["n"]))
    go(pg, sub="performance")
    rp = safe(pg, RAIL)
    ok("1440 · Performance's rail shows the same rows, says 3 of 4, wears the dot",
       rp and rp["n"] == 3 and rp["filtered"] and "3 of 4" in rp["wordText"], rp and (rp["n"], rp["wordText"]))
    go(pg, sub="report")
    rr = safe(pg, RAIL)
    ok("1440 · Reporting's rail shows the same rows", rr and rr["n"] == 3 and rr["filtered"], rr and (rr["n"], rr["filtered"]))
    go(pg, sub="strategy", sub2="plan")
    press(pg, "[data-railopts]")
    pg.keyboard.press("Escape"); pg.wait_for_timeout(300)
    r = safe(pg, RAIL)
    ok("1440 · Escape closes the menu", r and not r["open"])
    press(pg, "[data-railopts]")
    press(pg, '[data-railyear="mobile|1"]', 100); press(pg, '[data-railyear="mobile|2"]', 400)
    r = safe(pg, RAIL)
    ok("1440 · all three ticked again: four rows, no dot, the plain count", r and r["n"] == 4 and not r["filtered"] and r["wordText"].strip().endswith("4"),
       r and (r["n"], r["filtered"], r["wordText"]))
    ok("1440 · no page errors", not pg._errs, pg._errs[:2])
    pg.close()

    # ── 7 · the strip
    pg = page(b, 1100)
    go(pg, sub2="plan")
    safe(pg, YEARS_ON); pg.wait_for_timeout(300)
    r = safe(pg, RAIL)
    ok("1100 · the strip keeps the button, inside its box, without the word", r and r["word"] == "none" and r["btnRight"] <= r["railRight"] and (r["strip"] is None),
       r and (r["word"], r["btnRight"], r["railRight"], r["strip"]))
    press(pg, "[data-railopts]")
    r = safe(pg, RAIL)
    ok("1100 · the same menu opens, its years with their counts", r and r["open"] and [t["n"] for t in r["ticks"]] == [3, 3, 3], r and r["ticks"])
    ok("1100 · without the detail switch — a strip has no detail line", r and r["detail"] and r["detail"][0][1] == "none", r and r["detail"])
    press(pg, '[data-railyear=\"mobile|1\"]', 400)
    r = safe(pg, RAIL)
    ok("1100 · a year unticked: 3 of 4 beside the button, the dot on it", r and r["n"] == 3 and r["filtered"] and r["strip"] and r["strip"][0] != "none" and r["strip"][1] == "3 of 4",
       r and (r["n"], r["filtered"], r["strip"]))
    ok("1100 · no page errors", not pg._errs, pg._errs[:2])
    pg.close()

    # ── 8 · the table's head pins under the band
    def scroll_into(pg, label):
        for dy in [140] * 14:
            pg.mouse.wheel(0, dy); pg.wait_for_timeout(300)
            h, live = pinned_head(pg)
            if live:
                ok(label, all(t["fits"] and t["sticky"] == "sticky" and abs(t["thTop"] - h["bandBottom"]) <= 1 for t in live),
                   {"band bottom": h["bandBottom"], "heads": [(t["thTop"], t["fits"]) for t in live], "sy": h["sy"]})
                return
        ok(label, False, "no table spanned the band's bottom edge after scrolling")

    pg = page(b, 1440)
    go(pg, sub2="plan")
    scroll_into(pg, "1440 · reading: scrolled into a table, its head sits at the band's bottom edge")
    pg.close()
    pg = page(b, 1100)
    go(pg, sub2="plan")
    scroll_into(pg, "1100 · reading: scrolled into a table, its head sits under the band, under the strip")
    safe(pg, "()=>window.scrollTo(0,0)"); pg.wait_for_timeout(200)
    press(pg, ".secpen", 800)
    scroll_into(pg, "1100 · editing: the head sits under the head being edited")
    # 9 · a table forced wider than its pane keeps its scroll box
    safe(pg, "()=>{var s=document.createElement('style'); s.textContent='.split > .pane .tblscroll table{min-width:3000px}'; document.head.appendChild(s); fitPaint();}")
    pg.wait_for_timeout(300)
    h = safe(pg, HEADS) or {"tables": [], "bandBottom": None, "sy": 0}
    ok("1100 · a table wider than its pane keeps its scroll box, its head unpinned",
       h["tables"] and all(t["wide"] and not t["fits"] and t["sticky"] != "sticky" for t in h["tables"]),
       [(t["wide"], t["fits"], t["sticky"]) for t in h["tables"]])
    ok("1100 · no page errors", not pg._errs, pg._errs[:2])
    pg.close()
    b.close()

print("\n%s — %d failed" % ("strip-years", len(fails)) if fails else "\nstrip-years — all good")
