from playwright.sync_api import sync_playwright
URL="file:///home/user/SMP/SMP-Project-Folder/src/strategy-management-platform.html"
errs=[]; bad=0
BOX = """() => { const t=document.querySelector('.peoplecfg'); let b=t.parentElement;
  while (b && b.scrollHeight<=b.clientHeight && b.scrollWidth<=b.clientWidth) b=b.parentElement;
  return b ? {top:b.scrollTop, left:b.scrollLeft} : null; }"""
SET = """(v) => { const t=document.querySelector('.peoplecfg'); let b=t.parentElement;
  while (b && b.scrollHeight<=b.clientHeight && b.scrollWidth<=b.clientWidth) b=b.parentElement;
  b.scrollTop=v[0]; b.scrollLeft=v[1]; return {top:b.scrollTop, left:b.scrollLeft}; }"""
with sync_playwright() as p:
    b=p.chromium.launch(executable_path="/opt/pw-browsers/chromium",args=["--no-sandbox","--disable-dev-shm-usage"])
    pg=b.new_page(viewport={"width":1280,"height":820})
    pg.on("pageerror",lambda e: errs.append(str(e)))
    pg.goto(URL); pg.wait_for_timeout(1500)
    pg.click('#units [data-md="setup"]'); pg.wait_for_timeout(400)
    for g in pg.eval_on_selector_all(".setuprail .rgroup.shut","e=>e.map(x=>x.dataset.railgrp)"):
        pg.click('.setuprail [data-railgrp="%s"]'%g); pg.wait_for_timeout(70)
    pg.click('.setuprail [data-setupgo="people"]'); pg.wait_for_timeout(1100)
    # §79.2: the whole-table pen is gone. A row is opened from its own menu.
    OPEN_ROW = """() => { const rs=[].slice.call(document.querySelectorAll('[data-pmenu]'));
      const k=rs[rs.length-3].dataset.pmenu;
      document.querySelector('[data-pmenu="'+k+'"]').click();
      document.querySelector('[data-pedit="'+k+'"]').click();
      return k; }"""
    ROWKEY = pg.evaluate(OPEN_ROW); pg.wait_for_timeout(900)

    def trial(label, prep, fire):
        """prep runs BEFORE the scroll is set, so the probe's own focus() cannot
           be mistaken for the product moving the box."""
        global bad
        if prep: pg.evaluate(prep); pg.wait_for_timeout(120)
        pg.evaluate(SET,[600,300]); pg.evaluate("window.scrollTo(0,220)"); pg.wait_for_timeout(200)
        before = pg.evaluate(BOX); y0 = pg.evaluate("window.pageYOffset")
        pg.evaluate(fire); pg.wait_for_timeout(800)
        after = pg.evaluate(BOX); y1 = pg.evaluate("window.pageYOffset")
        ok = before == after and y0 == y1
        if not ok: bad += 1
        print(("  ok      " if ok else "  JUMPED  ") + label,
              "| box", before, "->", after, "| page", y0, "->", y1)

    trial("editing a job title on the open row",
      """() => { const el=document.querySelector('[data-ptitle]');
                 el.focus(); el.setSelectionRange(3,3); window.__k=el.dataset.ptitle; }""",
      """() => { const el=document.querySelector('[data-ptitle="'+window.__k+'"]');
                 el.value='Zed'; el.dispatchEvent(new Event('change',{bubbles:true})); }""")
    print("          focus kept on the same field:",
          pg.evaluate("!!(document.activeElement.dataset && document.activeElement.dataset.ptitle===window.__k)"))

    trial("opening the role picker", None,
      """() => { const b=document.querySelector('[data-prole-open]'); if(b) b.click(); }""")

    # THIS TRIAL HAD BEEN FIRING NOTHING (§51.11, in the file that exists to
    # catch that class of thing). It asked for `[data-prole-kind]`, a selector
    # the register has never carried — the picker's role select is
    # `data-prole-pick` — and `if(!el) return` made the miss silent, so the
    # trial reported "no jump" every run without touching a control. And
    # 'contrib' is not grantable (§55: the floor is derived, never given), so
    # even against the right selector it would have changed nothing.
    trial("choosing a role in it", None,
      """() => { const el=document.querySelector('[data-prole-pick]');
                 if(!el) throw new Error('the role picker is not there');
                 el.value='owner';
                 el.dispatchEvent(new Event('change',{bubbles:true})); }""")

    trial("changing where somebody sits", None,
      """() => { const el=document.querySelector('[data-pat]'); if(!el) return;
                 el.value='mobile'; el.dispatchEvent(new Event('change',{bubbles:true})); }""")

    # THE VALUE HAS TO BE DISPATCHED, NOT ASSIGNED. Setting `.value` fires no
    # event, and what the Add row reads is `input` — so this measured a paint
    # that added nobody, and printed "33 -> 33" while reporting no jump. A
    # print is not an assertion; the count is asserted now (§50.6).
    n0 = pg.evaluate("PEOPLE.length")
    trial("adding a person", None,
      """() => { const i=document.getElementById('newPersonName');
                 i.value='Test Person Added';
                 i.dispatchEvent(new Event('input',{bubbles:true}));
                 document.querySelector('[data-padd="1"]').click(); }""")
    n1 = pg.evaluate("PEOPLE.length")
    if n1 != n0 + 1:
        bad += 1
        print("  NOBODY   ...and nobody was actually added (%d -> %d)" % (n0, n1))
    else:
        print("  ok      ...and somebody was actually added (%d -> %d)" % (n0, n1))

    trial("searching", None,
      """() => { const i=document.querySelector('[data-tksearch]');
                 i.value='a'; i.dispatchEvent(new Event('input',{bubbles:true})); }""")
    trial("sorting a column", None,
      """() => { document.querySelector('[data-tksort]').click(); }""")

    # ── AND THE ACT OF OPENING A ROW, ON THE OTHER SIX TABLES (§108) ──
    # Everything above opens a row FIRST and then measures repaints, so the
    # press that opens one had never been measured — and it was the press that
    # jumped: a plain focus() lets the browser haul the focused field to the top
    # of the register's own scrolling box. §94.2, in the file whose whole job is
    # this: a check watching what happens after the door is open cannot see the
    # door slam.
    #
    # ON AN INLINE-PEN TABLE, because the fix is shared and the register is
    # already covered by checks/role-picker.py §7. §53.5's rule: a fix built on
    # one side and not the other is how the two sides drift.
    pg.click('.setuprail [data-setupgo="units"]'); pg.wait_for_timeout(700)
    BOX2 = """() => { const t=document.querySelector('.unitcfg'); let b=t.parentElement;
      while (b && b.scrollHeight<=b.clientHeight && b.scrollWidth<=b.clientWidth) b=b.parentElement;
      return b ? {top:b.scrollTop, left:b.scrollLeft} : {top:0, left:0}; }"""
    pens = pg.eval_on_selector_all("[data-rowedit]", "e=>e.map(x=>x.dataset.rowedit)")
    if not pens:
        bad += 1
        print("  MISSING  Business units has no inline pen to open")
    else:
        last = pens[-1]
        pg.evaluate("() => { const b=document.querySelector('.cfg'); if(b){b.scrollTop=0;} "
                    "window.scrollTo(0,0); }")
        pg.wait_for_timeout(150)
        b0 = pg.evaluate(BOX2); y0 = pg.evaluate("window.pageYOffset")
        r0 = pg.evaluate("(k)=>Math.round(document.querySelector('[data-rowedit=\"'+k+'\"]')"
                         ".closest('tr').getBoundingClientRect().top)", last)
        # Pressed from script: playwright scrolls a target into view before
        # clicking it, which is the very thing under test.
        pg.evaluate("(k)=>document.querySelector('[data-rowedit=\"'+k+'\"]').click()", last)
        pg.wait_for_timeout(600)
        b1 = pg.evaluate(BOX2); y1 = pg.evaluate("window.pageYOffset")
        r1 = pg.evaluate("()=>Math.round(document.querySelector('tr.tk-open')"
                         ".getBoundingClientRect().top)")
        ok = (b0 == b1 and y0 == y1 and abs(r0 - r1) <= 2)
        if not ok: bad += 1
        print(("  ok      " if ok else "  JUMPED  ") + "opening an inline-pen row",
              "| box", b0, "->", b1, "| page", y0, "->", y1, "| row", r0, "->", r1)
        # And the cursor still lands, or holding the row still by never
        # focusing would pass the line above and lose the feature.
        cur = pg.evaluate("()=>!!document.querySelector('.tk-firstfield') && "
                          "document.activeElement===document.querySelector('.tk-firstfield')")
        if not cur: bad += 1
        print(("  ok      " if cur else "  NO CURSOR ") + "...and the cursor is in the first field")

    print("errors:", errs or "none")
    print(("ALL STILL" if bad==0 else str(bad)+" JUMPED"))
    b.close()
