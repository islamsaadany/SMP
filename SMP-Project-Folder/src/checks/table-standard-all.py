"""THE TABLE STANDARD, ON EVERY TABLE IT APPLIES TO (spec 012, §84).

Driven rather than read: for each of the seven row-flow tables, does it search,
does it sort where the spec says it should, does it NOT sort where the spec says
it must not, and does a filter chip narrow it."""
from playwright.sync_api import sync_playwright

URL = "file:///home/user/SMP/SMP-Project-Folder/src/strategy-management-platform.html"
PAGES = [("people","People register"), ("mainbu","Official BU list"),
         ("units","Business units"), ("companies","Companies"),
         ("fns","Functions"), ("caps","Capabilities"), ("sets","Figure sets")]
# Their row order IS the setting somebody arranged, so a sort would be
# indistinguishable from a rearrangement (spec §6.2).
# THE FIVE THAT CARRIED QUICK FILTERS BEFORE §135.1. Named, because the claim
# being tested is that dropping the chips hid nothing — and a table that never
# had one has nothing to prove. Figure sets is the case that caught this: its
# rows carry no `data-tkrow` at all, so "every row is flagged" was false and
# meant nothing.
HAD_CHIPS = {"units", "mainbu", "companies", "fns", "caps"}
SORTLESS = {"units", "sets"}

# ONE READER, and it reads a cell the way the product does: an input's VALUE,
# because `innerText` on a td holding an <input> is '' and Capabilities is
# editable for the SMO without a pen.
READ = """(k)=>{const t=document.querySelector('[data-tktable="'+k+'"]');
  if(!t) return null;
  return [].slice.call(t.tBodies[0].rows).filter(x=>!x.classList.contains('newrow'))
    .map(r=>{const c=r.cells[1]; if(!c) return '';
             const i=c.querySelector('input'); return (i?i.value:c.textContent).trim();});}"""
SHOWN = """(k)=>{const t=document.querySelector('[data-tktable="'+k+'"]');
  return [].slice.call(t.tBodies[0].rows)
    .filter(x=>!x.classList.contains('newrow') && !x.hidden).length;}"""

bad = 0; errs = []
def ck(w, ok, x=""):
    global bad
    if not ok: bad += 1
    print(("    ok   " if ok else "    FAIL ") + w + (("  — " + str(x)) if not ok and x else ""))

with sync_playwright() as p:
    b = p.chromium.launch(executable_path="/opt/pw-browsers/chromium",
                          args=["--no-sandbox","--disable-dev-shm-usage"])
    pg = b.new_page(viewport={"width":1440,"height":950})
    pg.on("pageerror", lambda e: errs.append(str(e)))
    pg.goto(URL); pg.wait_for_timeout(1500)
    pg.click('#units [data-md="setup"]'); pg.wait_for_timeout(400)
    for g in pg.eval_on_selector_all(".setuprail .rgroup.shut","e=>e.map(x=>x.dataset.railgrp)"):
        pg.click('.setuprail [data-railgrp="%s"]' % g); pg.wait_for_timeout(70)

    for key, label in PAGES:
        pg.click('.setuprail [data-setupgo="%s"]' % key); pg.wait_for_timeout(900)
        st = pg.evaluate("""(k) => {
          const t = document.querySelector('[data-tktable="'+k+'"]');
          if (!t) return {wired:false};
          const rows = [].slice.call(t.tBodies[0].rows).filter(r=>!r.classList.contains('newrow'));
          return { wired:true, rows:rows.length,
                   bar: !!document.querySelector('[data-tkbar="'+k+'"]'),
                   search: !!document.querySelector('[data-tksearch="'+k+'"]'),
                   sortables: t.querySelectorAll('[data-tksort]').length,
                   flagged: rows.filter(r=>r.dataset.tkrow).length }; }""", key)
        print("──", label, st)
        ck("wired into the kit", st.get("wired"), st)
        if not st.get("wired"): continue

        if key in SORTLESS:
            ck("does NOT sort — its order is the setting (spec §6.2)", st["sortables"] == 0, st)
        else:
            ck("sortable headers", st["sortables"] > 0, st)

        # ── AND EVERY TABLE'S SEARCH LEFT THE BAR (§116, then §135.1) ──
        # §116 took the register's quick filters and row count away; §135.1 took
        # the same pair from the other five, and moved every search box onto the
        # page's pinned header line. The STANDARD is unchanged and is what is
        # asserted: a table of nine rows or more is searchable. Where the box
        # lives is the page's business — which is why this asks whether the
        # search EXISTS and never where it is drawn (§94.8).
        if st["rows"] >= 9:
            ck("is searchable (%d rows)" % st["rows"], st["bar"] or st["search"], st)
        ck("no quick filters left on it (§135.1)",
           pg.evaluate("""(k)=>document.querySelectorAll('[data-tkfilter^="'+k+'|"]').length""",
                       key) == 0)

        if st["bar"]:
            names = pg.evaluate(READ, key)
            term = (names[0] or "")[:6]
            if term:
                pg.evaluate("""(a)=>{const i=document.querySelector('[data-tksearch="'+a[0]+'"]');
                  i.value=a[1]; i.dispatchEvent(new Event('input',{bubbles:true}));}""", [key, term])
                pg.wait_for_timeout(300)
                shown = pg.evaluate(SHOWN, key)
                ck('search narrows it (%d of %d on "%s")' % (shown, st["rows"], term),
                   0 < shown < st["rows"] or st["rows"] == 1, shown)
                ck("...and typing did not repaint",
                   pg.evaluate("""(k)=>!!document.querySelector('[data-tksearch="'+k+'"]')""", key))
                pg.evaluate("""(k)=>{const i=document.querySelector('[data-tksearch="'+k+'"]');
                  i.value=''; i.dispatchEvent(new Event('input',{bubbles:true}));}""", key)
                pg.wait_for_timeout(200)

        # NOTHING WAS HIDDEN WHEN THE CHIPS WENT, and this is where that is
        # proved rather than asserted in a comment: the states the chips used to
        # filter TO are still drawn, so a retired unit is still a row on the
        # page. `data-tkrow` is what the chips read, and every row still has it.
        if key in HAD_CHIPS:
            ck("every row is still drawn, retired ones included",
               st["flagged"] == st["rows"], st)

        if key not in SORTLESS and st["sortables"] and st["rows"] > 1:
            # A TWO-ROW TABLE RETURNS TO ITS START after ascending then
            # descending, so comparing only the end to the beginning tests
            # nothing on exactly the smallest tables. Every step is captured.
            seen = [pg.evaluate(READ, key)]
            for _ in range(2):
                pg.evaluate("""(k)=>document.querySelector('[data-tktable="'+k+'"]')
                  .closest('.section, #panel')
                  .querySelector('[data-tksort]:not([data-tksort$="|0"])').click()""", key)
                pg.wait_for_timeout(450)
                seen.append(pg.evaluate(READ, key))
            ck("sorting reorders the view", any(x != seen[0] for x in seen[1:]),
               [x[:3] for x in seen])
            ck("...without losing a row", all(len(x) == len(seen[0]) for x in seen),
               [len(x) for x in seen])

    print("\nerrors:", errs or "none")
    print("ALL GREEN" if bad == 0 and not errs else str(bad) + " FAILED")
    b.close()
