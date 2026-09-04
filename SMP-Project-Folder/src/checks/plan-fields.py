"""THE PLAN PEN'S LAST THREE READ-ONLY FIELDS (§114).

Islam: "the quarters in the tactics are not editable in the edit mode and for
the measures the direction and the compiled."

§31 made all three read-only on purpose — they change what a figure MEANS —
while the pen could fall to the person being measured. §94 closed the pen to
the office, the reason expired, and what was left was the office unable to
correct exactly the fields that most need correcting after an upload.

§96 is the shape of fault to fear here: an editor drawn and wired to nothing
looks identical and discards every keystroke. So every control is PRESSED and
the DATA is read back, and both ends are asserted (§94.2): with the pen off,
none of the three is drawn.
"""
import os
from playwright.sync_api import sync_playwright

URL = "file://" + os.path.abspath(os.path.join(os.path.dirname(__file__), "..",
      "strategy-management-platform.html"))
bad = 0
def ck(w, ok, x=""):
    global bad
    if not ok: bad += 1
    print(("  ok      " if ok else "  FAIL    ") + w + (("  — %s" % (x,)) if not ok and x != "" else ""))

with sync_playwright() as p:
    b = p.chromium.launch(executable_path="/opt/pw-browsers/chromium",
                          args=["--no-sandbox", "--disable-dev-shm-usage"])
    pg = b.new_page(viewport={"width": 1500, "height": 2400})
    errs = []
    pg.on("pageerror", lambda e: errs.append(str(e)))
    pg.on("console", lambda m: errs.append(m.text) if m.type == "error" else None)
    pg.goto(URL); pg.wait_for_timeout(1500)
    pg.select_option("#asWho", "smo"); pg.wait_for_timeout(250)
    pg.click('#units button[data-u="mobile"]'); pg.wait_for_timeout(500)

    # ── the closed end first: pen OFF, none of the three drawn ──────────
    off = pg.evaluate("""() => ({
      dirSel: [...document.querySelectorAll('.pane select.fld')].length,
      qtogs: document.querySelectorAll('[data-qtog]').length })""")
    ck("pen off: no selects, no quarter toggles",
       off["dirSel"] == 0 and off["qtogs"] == 0, off)

    pen = pg.query_selector('#secrow-in .secpen[data-page="plan"]')
    ck("the plan pen is there", bool(pen))
    pen.click(); pg.wait_for_timeout(500)

    # ── direction ───────────────────────────────────────────────────────
    r = pg.evaluate("""() => {
      const m = UNITS.mobile.items[0].measures[0];
      const before = m.dir;
      const sel = [...document.querySelectorAll('.pane select.fld')]
        .find(s => [...s.options].some(o => o.value === "\\u2265"));
      if (!sel) return { none: true };
      sel.value = before === "\\u2265" ? "\\u2264" : "\\u2265";
      sel.dispatchEvent(new Event('change', { bubbles: true }));
      return { before, after: m.dir, changed: m.dir !== before };
    }""")
    ck("direction: a select, and choosing WRITES", not r.get("none") and r["changed"], r)

    # ── compile ─────────────────────────────────────────────────────────
    r = pg.evaluate("""() => {
      const m = UNITS.mobile.items[0].measures[0];
      const before = m.compile;
      const sel = [...document.querySelectorAll('.pane select.fld')]
        .find(s => [...s.options].some(o => o.value === "Average"));
      if (!sel) return { none: true };
      sel.value = before === "Average" ? "Sum" : "Average";
      sel.dispatchEvent(new Event('change', { bubbles: true }));
      return { before, after: m.compile, changed: m.compile !== before };
    }""")
    ck("compile: a select, and choosing WRITES", not r.get("none") and r["changed"], r)

    # ── quarters ────────────────────────────────────────────────────────
    r = pg.evaluate("""() => {
      const t = UNITS.mobile.items[0].tactics[0];
      const before = !!t.q3;
      const btn = document.querySelector('[data-qtog="' + t.id + '|3"]');
      if (!btn) return { none: true };
      btn.click();
      return { id: t.id, before };
    }""")
    pg.wait_for_timeout(400)
    after = pg.evaluate("(id) => !!UNITS.mobile.items[0].tactics[0].q3", r.get("id"))
    ck("a quarter toggle flips the stored quarter",
       not r.get("none") and after != r["before"], (r, after))
    # ...and the flipped state survived the repaint the click caused, drawn lit
    lit = pg.evaluate("""(id) => {
      const b = document.querySelector('[data-qtog="' + id + '|3"]');
      return b ? b.classList.contains('on') : null; }""", r.get("id"))
    ck("...and the toggle re-draws in its new state", lit == after, (lit, after))

    # a value already stored but OUTSIDE the list is offered, not lied about
    odd = pg.evaluate("""() => {
      UNITS.mobile.items[0].measures[1].dir = "=";
      paint();
      const m = UNITS.mobile.items[0].measures[1];
      const sel = [...document.querySelectorAll('.pane select.fld')]
        .find(s => [...s.options].some(o => o.value === "="));
      return { drawn: !!sel, selected: sel ? sel.value : null };
    }""")
    ck("a stored value outside the vocabulary stays visible and selected",
       odd["drawn"] and odd["selected"] == "=", odd)

    # ── THE × SITS ON THE LINE (§114.4) ────────────────────────────────
    # The problem, not the pixel: with the pen on, a cell holding a field and
    # a remove button keeps them on ONE line with the × hittable — it used to
    # wrap and grow every editable row by 20px. Asserted here because this is
    # the check that already has the pen open; the :has() rule reaches every
    # table using the pair.
    seat = pg.evaluate("""() => {
      const tds = [...document.querySelectorAll('.pane td')]
        .filter(c => c.querySelector(':scope > .fld') && c.querySelector(':scope > .xbtn'));
      if (!tds.length) return { none: true };
      return tds.map(td => {
        const f = td.querySelector(':scope > .fld'), x = td.querySelector(':scope > .xbtn');
        const fr = f.getBoundingClientRect(), xr = x.getBoundingClientRect();
        const hit = document.elementFromPoint(xr.left + xr.width/2, xr.top + xr.height/2);
        return { sameLine: Math.abs((xr.top + xr.height/2) - (fr.top + fr.height/2)) < 8,
                 hittable: hit === x || x.contains(hit) };
      });
    }""")
    ck("every field-and-× pair shares one line (%d cells)" % (0 if seat == {"none": True} else len(seat)),
       seat != {"none": True} and all(c["sameLine"] for c in seat), seat if seat == {"none": True} else [c for c in seat if not c["sameLine"]][:2])
    ck("...and every × is hittable at its centre",
       seat != {"none": True} and all(c["hittable"] for c in seat), [c for c in seat if not c.get("hittable")][:2])

    ck("no console errors", not errs, errs[:2])
    b.close()
print(("\n%d FAILED" % bad) if bad else "\nall passed")
raise SystemExit(1 if bad else 0)
