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
    # ── THE REGISTER ONLY READS NOW (§116) ────────────────────────────
    # Every trial that used to live here typed into a field on an open ROW and
    # asked whether the box moved. There are no fields on a row: editing is a
    # dialog, and while it is open the register is inert and covered. So what is
    # asserted changes into what can still go wrong — the presses that DO
    # repaint the register in place.
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

    trial("opening the row menu", None,
      """() => { const rs=[].slice.call(document.querySelectorAll('[data-pmenu]'));
                 rs[rs.length-3].click(); }""")
    trial("closing it again", None,
      """() => { const rs=[].slice.call(document.querySelectorAll('[data-pmenu]'));
                 rs[rs.length-3].click(); }""")
    # ADDING SOMEBODY IS THE DIALOG'S NOW, and the register repaints when it
    # closes — which is the one moment the box could move under you.
    n0 = pg.evaluate("PEOPLE.length")
    trial("adding a person, through the dialog", None,
      """() => { document.querySelector('[data-padd-open]').click();
                 const i=document.querySelector('#modal-b [data-pname]');
                 i.value='Test Person Added';
                 i.dispatchEvent(new Event('change',{bubbles:true}));
                 document.querySelector('[data-pdlg-add]').click(); }""")
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


    # ── AND THE ACT OF OPENING A ROW, ON THE OTHER SIX TABLES (§110) ──
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
    #
    # §261 MOVED THE TABLE THIS USED TO BE (§51.11, and this file caught it):
    # Business units edits in a dialog now, so `[data-rowedit]` matched nothing
    # there and the trial reported MISSING. It is Capabilities now — one of the
    # three tables that still opens its rows in place — and Business units gets
    # its own trial below, asking the same question of the door it has.
    pg.click('.setuprail [data-setupgo="caps"]'); pg.wait_for_timeout(700)
    BOX2 = """() => { const t=document.querySelector('.setuppane table'); let b=t.parentElement;
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

    # ── AND THE SAME QUESTION OF A DOOR THAT IS A DIALOG (§261) ──────────
    # A dialog covers the page, so the row's own top cannot be compared — what
    # can, and what §110.7 was about, is that NOTHING BEHIND MOVED and that the
    # cursor still landed. `focusNoScroll` is the shared answer to both, so a
    # build that reached for a plain focus() fails here rather than on the page
    # that happens to have kept an inline pen.
    pg.click('.setuprail [data-setupgo="units"]'); pg.wait_for_timeout(700)
    # THE DOOR IS BEHIND THE MENU, so the menu is opened first — `data-rowdlg`
    # is only in the document while one is. Found by running this: the first
    # version searched the closed page and reported MISSING on a build that
    # has the feature (§94.5's mirror — a probe wrong towards "broken").
    kebs = pg.eval_on_selector_all("[data-umenu]", "e=>e.map(x=>x.dataset.umenu)")
    if kebs:
        pg.evaluate("() => { const b=document.querySelector('.cfg'); if(b){b.scrollTop=0;} "
                    "window.scrollTo(0, 240); }")
        pg.wait_for_timeout(150)
        pg.evaluate("(k)=>document.querySelector('[data-umenu=\"'+k+'\"]').click()", kebs[-1])
        pg.wait_for_timeout(400)
    dlgs = pg.eval_on_selector_all("[data-rowdlg]", "e=>e.map(x=>x.dataset.rowdlg)")
    if not dlgs:
        bad += 1
        print("  MISSING  Business units has no row dialog to open")
    else:
        b0 = pg.evaluate(BOX2); y0 = pg.evaluate("window.pageYOffset")
        pg.evaluate("(k)=>document.querySelector('[data-rowdlg=\"'+k+'\"]').click()", dlgs[-1])
        pg.wait_for_timeout(600)
        b1 = pg.evaluate(BOX2); y1 = pg.evaluate("window.pageYOffset")
        ok = (b0 == b1 and y0 == y1)
        if not ok: bad += 1
        print(("  ok      " if ok else "  JUMPED  ") + "opening a row's dialog",
              "| box", b0, "->", b1, "| page", y0, "->", y1)
        cur = pg.evaluate("()=>{const f=document.querySelector('#modal-b .tk-firstfield');"
                          "return !!f && document.activeElement===f;}")
        if not cur: bad += 1
        print(("  ok      " if cur else "  NO CURSOR ") + "...and the cursor is in its first field")

    print("errors:", errs or "none")
    print(("ALL STILL" if bad==0 else str(bad)+" JUMPED"))
    b.close()
