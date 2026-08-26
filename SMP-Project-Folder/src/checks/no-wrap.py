"""A SETUP TABLE ROW IS ONE LINE (§88).

Islam, on a register where one person's address had broken across four lines and
taken the row from 39px to 100px: "the table should NEVER wrap like that where
the row gets bigger — that's a visual mistake that should be avoided everywhere
in the setup tables."

MEASURED PER ELEMENT, NOT PER ROW, and that is the whole design of this check.
A row can be legitimately taller than its neighbour — two badges instead of one,
a value that carries an explanatory line under it, the add row at the foot of
the table — and asserting that every row in a table is the same height would
report all three as faults and push somebody to hide real content. What is
never legitimate is a piece of TEXT rendering on more than one line, and that is
what this measures: every leaf element inside every Setup table, against its own
line-height.

The height spread per table is printed beside it as information rather than
asserted, so a table that becomes ragged for a new reason is visible to whoever
reads the run without failing it.
"""
from playwright.sync_api import sync_playwright

URL = "file:///home/user/SMP/SMP-Project-Folder/src/strategy-management-platform.html"
errs = []
bad = 0

MEASURE = r"""() => {
  const out = { wrapped: [], tables: [], over: [] };
  document.querySelectorAll('.setuppane table').forEach((t, ti) => {
    const rows = [...t.querySelectorAll('tbody tr')].filter(r => !r.hidden);
    if (!rows.length) return;
    const hs = rows.map(r => Math.round(r.getBoundingClientRect().height));
    out.tables.push({ i: ti, n: rows.length,
                      min: Math.min(...hs), max: Math.max(...hs) });

    /* THE BOX IT HAS TO FIT IN. Wrapping was introduced to stop a table
       holding itself open past its own scroll box (§81.5); clipping has to
       keep that win or it is the same fault with tidier rows. */
    /* WIDER THAN ITS BOX IS FINE; UNREACHABLE IS NOT. The register has been
       wider than its box since it grew its ninth column (§54.6) and the first
       and last columns were frozen to make that scroll workable (§69.19,
       §69.20) — so the contract is not "never wider", it is "never wider than
       something you can scroll to". A table overflowing a box that does not
       scroll is content nobody can reach, which is the fault worth failing. */
    const box = t.closest('.cfg') || t.parentElement;
    if (box) {
      const overBy = Math.round(t.getBoundingClientRect().width - box.clientWidth);
      if (overBy > 2) {
        const scrolls = box.scrollWidth - box.clientWidth > 2 &&
          ['auto', 'scroll'].indexOf(getComputedStyle(box).overflowX) > -1;
        out.over.push({ i: ti, by: overBy, scrolls: scrolls });
      }
    }

    /* THE TEXT ITSELF, THROUGH A RANGE, AND NOT A HEIGHT ANYWHERE.
       Written first as "is this element taller than one line", which measures
       the ROW: a `td` is as tall as the tallest cell beside it, so a cell
       holding the number 7 was reported as wrapping 172 times. A Range over a
       text node returns ONE RECT PER LINE BOX it occupies — the direct
       measurement of the thing being asserted, and it cannot be confused by
       anything around it (§50.6, caught inside an hour this time). */
    rows.forEach((r, ri) => {
      /* A BAND IS A HEADING, NOT A DATA ROW (§105.2). §88's rule exists so a
         row's height cannot depend on how long somebody's email is — that is
         about CELLS. The cycle board's "Supporting functions" band spans the
         whole table and carries a sentence of vocabulary; §105.2 decided it
         takes a second line at 1000px rather than pushing the table 8px past
         its box, which was the measured alternative. Asserting one line here
         would make the fix "delete real content" — the exact trap §88's own
         note about equal row heights names. */
      if (r.classList.contains('dxband') || r.classList.contains('dxhead')) return;
      const walk = document.createTreeWalker(r, NodeFilter.SHOW_TEXT);
      let n;
      while ((n = walk.nextNode())) {
        const txt = n.textContent.trim();
        if (!txt) continue;
        const el = n.parentElement;
        if (!el || el.tagName === 'OPTION') continue;
        const cs = getComputedStyle(el);
        if (cs.display === 'none' || cs.visibility === 'hidden') continue;
        const rg = document.createRange();
        rg.selectNodeContents(n);
        /* DISTINCT LINE TOPS, NOT RECT COUNT. getClientRects() returns more
           than one rect for text that sits on a single line — an empty
           leading rect, a fragment either side of a clipped edge — so
           counting rects reported "Operational Excellence" as two lines while
           it was plainly one, with white-space:nowrap computed on it. The
           number of lines is the number of distinct tops among the rects that
           have any width, and nothing else. */
        const tops = {};
        [...rg.getClientRects()].forEach(function (rc) {
          if (rc.width > 0.5 && rc.height > 0.5) tops[Math.round(rc.top)] = 1;
        });
        const lines = Object.keys(tops).length;
        if (lines > 1)
          out.wrapped.push({ row: ri + 1, lines: lines,
                             cls: el.className || el.tagName,
                             text: txt.slice(0, 46) });
      }
    });
  });
  return out;
}"""

# EVERY WIDTH IT IS USED AT, NOT THE ONE IT WAS BUILT AT (§27.1). A cap that
# holds at 1440 says nothing about 1000, which is the laptop Islam works on —
# and a column squeezed by a narrow window is exactly where a cell would start
# wrapping again.
WIDTHS = [1440, 1180, 1000]

with sync_playwright() as p:
    b = p.chromium.launch(executable_path="/opt/pw-browsers/chromium",
                          args=["--no-sandbox", "--disable-dev-shm-usage"])
    pg = b.new_page(viewport={"width": WIDTHS[0], "height": 900})
    pg.on("pageerror", lambda e: errs.append(str(e)))
    pg.goto(URL)
    pg.wait_for_timeout(1500)

    # NOTHING TO SEE ON AN EMPTY TABLE (§45.2). The register is the table the
    # fault appeared on and the demo's addresses are all blank, so the worst row
    # it can produce is seeded before the walk: a long legal name, a long job
    # title and a long address on one person.
    pg.click('#units [data-md="setup"]')
    pg.wait_for_timeout(400)
    for g in pg.eval_on_selector_all(".setuprail .rgroup.shut",
                                     "e=>e.map(x=>x.dataset.railgrp)"):
        pg.click('.setuprail [data-railgrp="%s"]' % g)
        pg.wait_for_timeout(60)

    pg.evaluate("""() => {
      PEOPLE[1].name  = "Mohamed Hamed Ahmed Hamed Ahmed El Sayed";
      PEOPLE[1].title = "Senior Manager, Commercial Planning and Analysis";
      PEOPLE[1].email = "mohamed_hamed_elsayed@rayacorp.com";
      PEOPLE[1].empId = "1002347";
      PEOPLE[2].email = "m.ehsan@rayacorp.com";
      paint(); }""")
    pg.wait_for_timeout(500)

    keys = pg.eval_on_selector_all(".setuprail [data-setupgo]",
                                   "e=>e.map(x=>x.dataset.setupgo)")
    for W in WIDTHS:
      pg.set_viewport_size({"width": W, "height": 900})
      pg.wait_for_timeout(400)
      print("\n── at %dpx" % W)
      print("%-12s %-6s %-12s %s" % ("page", "rows", "row heights", "verdict"))
      for k in keys:
          pg.click('.setuprail [data-setupgo="%s"]' % k)
          pg.wait_for_timeout(450)
          out = pg.evaluate(MEASURE)
          for t in out["tables"]:
                print("%-12s %-6d %-12s %s"
                      % (k + ("" if t["i"] == 0 else "#%d" % t["i"]), t["n"],
                         "%d-%d" % (t["min"], t["max"]),
                         "one line" if not out["wrapped"] else ""))
          for w in out["wrapped"]:
                bad += 1
                print("  WRAPPED  %s row %d — on %d lines — %s :: %s"
                      % (k, w["row"], w["lines"], w["cls"], w["text"]))
          # AND WHAT IS CLIPPED IS STILL READABLE (§88). An ellipsis with no way
          # to see the rest is worse than a wrapped line, so the check that
          # forbids the wrap has to be the one that proves the value survived.
          miss = pg.evaluate("""() => {
              const out=[];
              document.querySelectorAll('.setuppane .cfg table tbody td').forEach(td=>{
                if (td.title) return;
                const kids=td.querySelectorAll('.val, .why, b, .mono');
                (kids.length?[...kids]:[td]).forEach(el=>{
                  if (el.scrollWidth-el.clientWidth>1 && !el.title)
                    out.push((el.textContent||'').trim().slice(0,40));
                });
              });
              return out; }""")
          for m in miss:
                bad += 1
                print("  NO HOVER  %s — clipped with nothing to read it by :: %s" % (k, m))
          for o in out["over"]:
                if o["scrolls"]:
                    print("  wide      %s table %d is %dpx past its box, and scrolls to it"
                          % (k, o["i"], o["by"]))
                    continue
                bad += 1
                print("  UNREACHABLE  %s table %d is %dpx past a box that does not scroll"
                      % (k, o["i"], o["by"]))

    print("\nerrors:", errs or "none")
    print("ALL ONE LINE" if bad == 0 and not errs else "%d FAILED" % bad)
    b.close()
raise SystemExit(1 if bad or errs else 0)
