"""THE SHAPE OF A SETUP TABLE IS THE READER'S OWN (§754).

Islam, of a reel of a table whose columns the viewer shapes: "have a look so we
can see what we can do with our settings tables" — then "Do all make them all
personal" — then, of the mockup, "go ahead with as today look, build it into
the setup tables". Four things a reader may do to a Setup table and one way
back, every one remembered in the browser and none written to the tenant.

WHAT IS ASSERTED, AND WHY EACH END MATTERS (§94.2):

  * THE MENU IS ON EVERY LIST TABLE, and it counts. Units, the register,
    Functions, Divisions, Capabilities, the Official BU list and Figure sets
    each carry the Columns button with "shown/of", and a status line under the
    table that says the same number — two readings of one store;
  * A COLUMN HIDDEN IS GONE FROM THE ROWS TOO, not only from the head: a table
    that drops the heading and keeps the cells is a table whose values have
    slid one column left (the fault the row permutation exists to avoid);
  * THE REGISTER'S OLD CHOICES ARE CARRIED, not lost: a stored
    `smp.people.columns` from before this round is read once as the starting
    point, so somebody who had Full Name on and Job title off still has;
  * A WIDTH SET IS THE WIDTH SEEN — the drag moves the column by what the
    pointer moved, under the page's own zoom (§601: the page is zoomed to .8,
    and a width read off a rectangle came back four fifths as wide on the first
    run — asserted here so it cannot come back);
  * FIT GOES BOTH WAYS. A column made wider than its content comes back to its
    content on a double-click of the edge; a column made narrower opens up (his
    "expand or squeeze to fit content as well");
  * A COLUMN MOVED STAYS MOVED, and the two ends do not: # and the name stay
    where the freeze expects them (§151), the ⋮ stays last, whatever is dragged;
  * THE KEYBOARD DOES THE SAME FOUR THINGS on a focused heading;
  * EVERYTHING COMES BACK AFTER A RELOAD, and Reset puts the shipped table back
    and goes quiet;
  * THE SORT STILL READS THE SHIPPED ORDER: with the columns rearranged, a sort
    by a heading orders the rows by THAT column's values, not by whatever cell
    now sits at its index (the reason apply() runs after wire()).

Run: python3 qa-run.py checks/table-columns.py      (from src/)
SMP_HTML points it at another build (§276).
"""
import json, os, pathlib
from playwright.sync_api import sync_playwright

HTML = pathlib.Path(os.environ.get("SMP_HTML") or "strategy-management-platform.html").resolve()
url = "file://" + str(HTML)
bad = 0
def ck(w, ok, x=""):
    global bad
    if not ok: bad += 1
    print(("  ok      " if ok else "  FAIL    ") + w + (("  — " + str(x)) if not ok and x else ""))

def heads(pg, tid):
    return pg.eval_on_selector_all(
        'table[data-tktable="%s"] thead th' % tid,
        "els=>els.filter(e=>!e.classList.contains('tc-hidden')).map(e=>[e.dataset.col||'?', e.offsetWidth])")
def keys(pg, tid): return [h[0] for h in heads(pg, tid)]
def width(pg, tid, k): return dict(heads(pg, tid)).get(k)
def foot(pg, tid):
    el = pg.query_selector('[data-tcfoot="%s"] .tcstate' % tid)
    return el.text_content().strip() if el else None
def open_setup(pg):
    pg.goto(url); pg.wait_for_timeout(900)
    pg.click('#units [data-md="setup"]'); pg.wait_for_timeout(300)
    for g in pg.eval_on_selector_all(".setuprail .rgroup.shut", "els=>els.map(e=>e.dataset.railgrp)"):
        pg.click('.setuprail [data-railgrp="%s"]' % g); pg.wait_for_timeout(60)
def go(pg, key):
    pg.click('.setuprail [data-setupgo="%s"]' % key); pg.wait_for_timeout(450)
def grip(pg, k):
    return pg.query_selector('.tcgrip[data-tcgrip="%s"]' % k).bounding_box()
def drag(pg, x0, y0, x1, y1, steps=8):
    pg.mouse.move(x0, y0); pg.mouse.down(); pg.mouse.move(x0 + 8, y0, steps=2)
    pg.mouse.move(x1, y1, steps=steps); pg.mouse.up(); pg.wait_for_timeout(350)

errs = []
with sync_playwright() as p:
    b = p.chromium.launch(executable_path=os.environ.get("SMP_CHROME"))
    ctx = b.new_context(viewport={"width": 1440, "height": 900})
    ctx.add_init_script("""try{ sessionStorage.setItem('smp.welcome.done','1');
      if (!localStorage.getItem('smp.table.people') && !localStorage.getItem('smp.tc.seeded')) {
        localStorage.setItem('smp.people.columns', JSON.stringify({fullname:true, title:false}));
        localStorage.setItem('smp.tc.seeded', '1'); } }catch(e){}""")
    pg = ctx.new_page()
    pg.on("pageerror", lambda e: errs.append(str(e)))
    open_setup(pg)

    # ── 1. the menu and the line on every list table ────────────────────────
    for tid, rail in [("units", "units"), ("people", "people"), ("fns", "fns"), ("companies", "companies"),
                      ("caps", "caps"), ("mainbu", "mainbu"), ("sets", "sets")]:
        go(pg, rail)
        btn = pg.query_selector('[data-colmenu="%s"]' % tid)
        cnt = pg.query_selector('[data-colmenu="%s"] .tccount' % tid)
        f = foot(pg, tid) or ""
        # the count rides the button only while a column is hidden; with every column shown the line says "N of N"
        same = (cnt is None and f.split(" of ")[0] == f.split(" of ")[1].split(" ")[0]) if f else False
        if cnt is not None: same = f.startswith(cnt.text_content().replace("/", " of "))
        ck("%s: the Columns button and the line under the table count the same" % tid,
           btn is not None and f and same, (cnt and cnt.text_content(), f))

    # ── 2. units: hide a column, head and rows together ─────────────────────
    go(pg, "units")
    ck("units: the heading reads In navigation (Islam, 2026-11-16)",
       pg.eval_on_selector('table[data-tktable="units"] th[data-col="nav"]', "e=>e.textContent.trim()") == "In navigation")
    before = keys(pg, "units")
    pg.click('[data-colmenu="units"]'); pg.wait_for_timeout(250)
    pg.click('input[data-col="code"][data-coltable="units"]'); pg.wait_for_timeout(300)
    after = keys(pg, "units")
    ck("units: Code hidden leaves the head without it", "code" in before and "code" not in after, after)
    ck("units: ...and the menu stays open for the next tick", pg.query_selector(".tcmenu.open") is not None)
    row_cells = pg.eval_on_selector_all('table[data-tktable="units"] tbody tr:first-child td',
                                        "els=>els.filter(e=>!e.classList.contains('tc-hidden')).length")
    ck("units: ...and every row has one cell per visible heading", row_cells == len(after), (row_cells, len(after)))
    ck("units: ...and the line says 9 of 10", (foot(pg, "units") or "").startswith("9 of 10"), foot(pg, "units"))
    pg.click('[data-tcdens="units|compact"]'); pg.wait_for_timeout(300)
    ck("units: Compact rows are shorter", pg.eval_on_selector('table[data-tktable="units"]', "e=>e.classList.contains('tc-compact')")
       and "compact rows" in (foot(pg, "units") or ""), foot(pg, "units"))
    pg.keyboard.press("Escape"); pg.wait_for_timeout(200)

    # ── 3. width: dragged by what the pointer moved, under the zoom ─────────
    w0 = width(pg, "units", "weight"); g = grip(pg, "weight")
    zoom = pg.evaluate("()=>{const t=document.querySelector('table[data-tktable=\"units\"]'); return t.getBoundingClientRect().width/t.offsetWidth}")
    drag(pg, g["x"] + 5, g["y"] + 8, g["x"] + 5 + 60 * zoom, g["y"] + 8)
    w1 = width(pg, "units", "weight")
    ck("units: dragging Weight's edge 60px makes it 60px wider (zoom %.2f)" % zoom, w1 is not None and abs(w1 - (w0 + 60)) <= 2, (w0, w1))
    g = grip(pg, "weight"); pg.mouse.click(g["x"] + 5, g["y"] + 8); pg.wait_for_timeout(60)
    g = grip(pg, "weight"); pg.mouse.click(g["x"] + 5, g["y"] + 8); pg.wait_for_timeout(350)
    w2 = width(pg, "units", "weight")
    ck("units: a double-click on the edge squeezes it back to its content", w2 is not None and w2 < w1 - 20, (w1, w2))
    pg.focus('table[data-tktable="units"] th[data-col="weight"]')
    for _ in range(6): pg.keyboard.press("Shift+ArrowLeft")
    pg.wait_for_timeout(250); w3 = width(pg, "units", "weight")
    pg.keyboard.press("f"); pg.wait_for_timeout(350); w4 = width(pg, "units", "weight")
    ck("units: narrowed from the keyboard, F opens it back up to its content", w3 is not None and w4 is not None and w3 < w2 and abs(w4 - w2) <= 2, (w2, w3, w4))

    # ── 4. order: dragged, and the ends stay ────────────────────────────────
    src = pg.query_selector('table[data-tktable="units"] th[data-col="weight"]').bounding_box()
    dst = pg.query_selector('table[data-tktable="units"] th[data-col="plans"]').bounding_box()
    drag(pg, src["x"] + src["width"] / 2, src["y"] + 10, dst["x"] + 6, dst["y"] + 10)
    k = keys(pg, "units")
    ck("units: Weight dragged onto Plans in lands before it", k.index("weight") == k.index("plans") - 1, k)
    ck("units: ...and # and the name stay first, the menu last", k[0] == "idx" and k[1] == "name" and k[-1] == "menu", k)
    ck("units: ...and the drag did not sort the table", not pg.eval_on_selector('table[data-tktable="units"] th[data-col="weight"]', "e=>e.classList.contains('tk-asc')||e.classList.contains('tk-desc')"))
    pg.focus('table[data-tktable="units"] th[data-col="division"]'); pg.keyboard.press("Alt+ArrowLeft"); pg.wait_for_timeout(300)
    k2 = keys(pg, "units")
    ck("units: Alt+Left moves Division one place left", k2.index("division") == k.index("division") - 1, k2)
    ck("units: ...and the heading keeps the focus", pg.evaluate("()=>document.activeElement && document.activeElement.dataset.col") == "division")
    pg.keyboard.press("h"); pg.wait_for_timeout(300)
    ck("units: H hides the focused column", "division" not in keys(pg, "units"), keys(pg, "units"))
    shape = keys(pg, "units")

    # ── 5. remembered; reset ────────────────────────────────────────────────
    open_setup(pg); go(pg, "units")
    ck("units: the shape comes back after a reload", keys(pg, "units") == shape and "compact rows" in (foot(pg, "units") or ""), (keys(pg, "units"), shape))
    ck("units: ...and the line says so", "changed from the shipped table" in (foot(pg, "units") or ""))
    pg.click('[data-colmenu="units"]'); pg.wait_for_timeout(250)
    pg.click('[data-tcreset="units"]'); pg.wait_for_timeout(350)
    ck("units: Reset puts the shipped table back", keys(pg, "units") == before and foot(pg, "units") == "10 of 10 columns · normal rows", (keys(pg, "units"), foot(pg, "units")))
    ck("units: ...and nothing is stored any more", pg.evaluate("()=>localStorage.getItem('smp.table.units')") is None)
    ck("units: ...and nothing was written to the tenant", pg.evaluate("()=>JSON.stringify(GROUP).indexOf('smp.table')") == -1)

    # ── 6. the register: old choices carried, sort reads the right column ───
    go(pg, "people")
    k = keys(pg, "people")
    ck("register: the old chooser's choices are the starting point (Full Name on, Job title off)", "fullname" in k and "title" not in k, k)
    ck("register: ...and were written to the new store", (pg.evaluate("()=>localStorage.getItem('smp.table.people')") or "").find('"title":true') >= 0)
    # move Email before Official BU, then sort by Email: the first row's EMAIL must be the smallest
    src = pg.query_selector('table[data-tktable="people"] th[data-col="email"]').bounding_box()
    dst = pg.query_selector('table[data-tktable="people"] th[data-col="mainbu"]').bounding_box()
    drag(pg, src["x"] + src["width"] / 2, src["y"] + 10, dst["x"] + 6, dst["y"] + 10)
    k = keys(pg, "people")
    ck("register: Email dragged before Official BU", k.index("email") < k.index("mainbu"), k)
    pg.click('table[data-tktable="people"] th[data-col="email"]'); pg.wait_for_timeout(400)
    emails = pg.eval_on_selector_all('table[data-tktable="people"] tbody tr:not([hidden]) td[data-col="email"], table[data-tktable="people"] tbody tr:not([hidden])',
        """rows=>{ const th=[...document.querySelectorAll('table[data-tktable="people"] thead th')]; const i=th.findIndex(h=>h.dataset.col==='email');
                 return rows.filter(r=>r.tagName==='TR'&&r.cells.length===th.length).map(r=>r.cells[i].textContent.trim().toLowerCase()).filter(Boolean); }""")
    ck("register: sorted by the moved Email heading, the emails are in order", len(emails) > 3 and emails == sorted(emails), emails[:4])
    pg.click('table[data-tktable="people"] th[data-col="email"]'); pg.click('table[data-tktable="people"] th[data-col="email"]'); pg.wait_for_timeout(300)
    ck("register: the name column still freezes (sticky)",
       pg.eval_on_selector('table[data-tktable="people"] tbody tr:first-child td.namecell', "e=>getComputedStyle(e).position") == "sticky")

    ck("no page errors while driving", not errs, errs[:2])
    b.close()

print("table-columns: %s" % ("all good" if bad == 0 else "%d FAILED" % bad))
raise SystemExit(1 if bad else 0)
