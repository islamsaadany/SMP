"""EDITING A ROW, WHEREVER THE TABLE KEEPS THE WAY IN (spec 012 §2.1, §85).

THREE OF THE SIX MOVED AND THIS DID NOT (§324.11). Business units, Companies
and Functions edit from a kebab that opens `ROWDLG` — the register's own
dialog (§261) — so they carry no pen on the row, no `tk-open` row and no
in-row Save. This file asked all six for a pen, found nought on the first,
and then DIED on the empty list rather than reporting the other five (§215),
which is why it read as one failure and was four.

So the three have a block of their own that ends where their shape ends: every
row offers a kebab, the kebab offers exactly ONE way in, it opens a dialog with
fields and Save and Cancel, no row opens in place (§94.2 — a build doing both
would satisfy every other line), and Cancel closes it. The dialog's own
behaviour is NOT re-asserted here: people-dialog.py drives it end to end
(§116), and a second copy of that is a second answer to what it does (§53.5).
"""
from playwright.sync_api import sync_playwright
URL="file:///home/user/SMP/SMP-Project-Folder/src/strategy-management-platform.html"
# `menu` = the ATTRIBUTE the row's kebab carries, or None where the pen is on
# the row (§93.14). The register settled that shape and Functions took it: a
# closed row carries no `data-rowedit` at all, so the menu is opened first.
#
# AND THE ONE WORD THIS FILE PROMISED WAS NEVER CHANGED (§324.11). It said so
# itself — *"written as a property of the table rather than a special case
# inside the loop, so the next table to move its actions into a menu is one
# word here"* — and §261 moved Business units AND Companies into kebabs of
# their own, so this asked ten rows for a pen that is no longer on them, found
# nought, and then DIED on the empty list rather than reporting the other five
# tables (§215). The attribute is per table because the three of them are
# `data-umenu`, `data-comenu` and `data-fnmenu` — a single flag could not have
# said which, which is how a boolean outlives its subject.
TABLES=[("units","Business units","data-umenu"),
        ("companies","Companies","data-comenu"),
        ("fns","Functions","data-fnmenu"),
        ("caps","Capabilities",None),
        ("mainbu","Official BU list",None),
        ("sets","Figure sets",None)]
bad=0; errs=[]
def ck(w, ok, x=""):
    global bad
    if not ok: bad+=1
    print(("    ok   " if ok else "    FAIL ")+w+(("  — "+str(x)) if not ok and x else ""))
def open_row(pg, target):
    """Press the row's pen.

    ITS KEBAB BRANCH IS DELETED (§324.11, §24). It existed because Functions
    kept its pen inside the menu, and §261 moved the three menu tables on to a
    DIALOG instead — they never reach this helper now, so the branch was a
    shape nothing in the product has, sitting where the next reader would take
    it for the way menus work.
    """
    pg.evaluate("""(t)=>document.querySelector('[data-rowedit="'+t+'"]').click()""", target)
    pg.wait_for_timeout(500)

with sync_playwright() as p:
    b=p.chromium.launch(executable_path="/opt/pw-browsers/chromium",args=["--no-sandbox","--disable-dev-shm-usage"])
    pg=b.new_page(viewport={"width":1440,"height":950})
    pg.on("pageerror",lambda e: errs.append(str(e)))
    pg.goto(URL); pg.wait_for_timeout(1500)
    pg.click('#units [data-md="setup"]'); pg.wait_for_timeout(400)
    for g in pg.eval_on_selector_all(".setuprail .rgroup.shut","e=>e.map(x=>x.dataset.railgrp)"):
        pg.click('.setuprail [data-railgrp="%s"]'%g); pg.wait_for_timeout(70)
    for key,label,menu in TABLES:
        pg.click('.setuprail [data-setupgo="%s"]'%key); pg.wait_for_timeout(900)
        print("──", label)
        rows = pg.evaluate("""(k)=>{const t=document.querySelector('[data-tktable="'+k+'"]');
          return [].slice.call(t.tBodies[0].rows).filter(r=>!r.classList.contains('newrow')).length;}""", key)
        ck("no fields are open before anything is pressed",
           pg.evaluate("""(k)=>document.querySelectorAll('[data-tktable="'+k+'"] tbody tr:not(.newrow) input').length""", key)==0)

        if menu:
            # ── §261 MOVED THESE THREE INTO A DIALOG (§324.11) ───────────
            # Business units, Companies and Functions edit from a kebab that
            # opens `ROWDLG` — the register's own dialog — so there is no pen
            # on the row, no `tk-open` row and no in-row Save. Everything
            # below this block asks about a shape they no longer have, which
            # is why it stops here rather than half-measuring them.
            # THE DIALOG'S OWN BEHAVIOUR IS NOT RE-ASSERTED: people-dialog.py
            # drives it end to end (§116), and a second copy of that is a
            # second answer to what the dialog does (§53.5). What this file
            # keeps for them is the part it is named after — that every row
            # can be opened, and that the way in is one press and then one.
            kebabs = pg.eval_on_selector_all("[%s]" % menu, "e=>e.length")
            ck("every row offers a kebab (%d of %d rows)" % (kebabs, rows),
               kebabs == rows, (kebabs, rows))
            if not kebabs:
                continue
            pg.evaluate("(m)=>{const b=document.querySelectorAll('['+m+']');"
                        "b[Math.min(1, b.length-1)].click();}", menu)
            pg.wait_for_timeout(400)
            dlg = pg.eval_on_selector_all('[data-rowdlg^="%s|"]' % key, "e=>e.length")
            ck("the open menu offers one way in", dlg == 1, dlg)
            if dlg != 1:
                continue
            pg.evaluate('(k)=>document.querySelector(\'[data-rowdlg^="\'+k+\'|"]\').click()', key)
            pg.wait_for_timeout(500)
            st = pg.evaluate("""()=>({ dlg: !!document.querySelector('.pdlg'),
              fields: document.querySelectorAll('.pdlg input,.pdlg select').length,
              save: !!document.querySelector('[data-rowdlg-close]'),
              cancel: !!document.querySelector('[data-rowdlg-cancel]'),
              openRows: document.querySelectorAll('tr.tk-open').length })""")
            print("    ", st)
            ck("...and it opens the dialog, with fields in it",
               st["dlg"] and st["fields"] > 0, st)
            ck("...carrying Save and Cancel", st["save"] and st["cancel"], st)
            # BOTH ENDS (§94.2): the row must NOT also open in place, or a
            # build doing both would satisfy every assertion above.
            ck("...and no row opened in place", st["openRows"] == 0, st)
            pg.evaluate("()=>{const b=document.querySelector('[data-rowdlg-cancel]'); if (b) b.click();}")
            pg.wait_for_timeout(400)
            ck("Cancel closes it", pg.evaluate("()=>!document.querySelector('.pdlg')"))
            continue

        pens = pg.eval_on_selector_all('[data-rowedit^="%s|"]'%key, "e=>e.length")
        # ONE PEN PER ROW — not "more than one", which fails on the one-row
        # table for having exactly the right number.
        ck("every row offers a pen (%d of %d rows)" % (pens, rows), pens == rows, (pens, rows))
        # IT DIED HERE RATHER THAN REPORTING (§215): with no pen on the row
        # `ps[0]` is undefined and the whole file stopped at the first table,
        # so five others went unmeasured and the count printed was 1.
        # NOT ALWAYS THE SECOND ROW — Figure sets has one. Take the second
        # where there is one, so this still exercises "a row other than the
        # first", and the first where there is not.
        target = pg.evaluate("""(k)=>{const ps=document.querySelectorAll('[data-rowedit^="'+k+'|"]');
          return ps.length ? ps[Math.min(1, ps.length-1)].dataset.rowedit : null;}""", key)
        if not target:
            ck("a row can be opened at all", False, "no pen found for %s" % key)
            continue
        open_row(pg, target)
        pg.wait_for_timeout(200)
        st = pg.evaluate("""(k)=>{const t=document.querySelector('[data-tktable="'+k+'"]');
          const open=t.querySelectorAll('tbody tr.tk-open');
          return { openRows:open.length,
                   fieldsInOpen: open[0]?open[0].querySelectorAll('input,select').length:0,
                   fieldsElsewhere: t.querySelectorAll('tbody tr:not(.tk-open):not(.newrow) input').length,
                   save: !!t.querySelector('[data-rowsave]'),
                   cancel: !!t.querySelector('[data-rowcancel]'),
                   pensLeft: t.querySelectorAll('[data-rowedit]').length }; }""", key)
        print("    ", st)
        ck("exactly one row opens", st["openRows"]==1, st)
        ck("...with fields in it", st["fieldsInOpen"]>0, st)
        ck("...and none anywhere else", st["fieldsElsewhere"]==0, st)
        ck("Save and Cancel are in the row", st["save"] and st["cancel"], st)
        ck("the cursor is in the row's first field",
           pg.evaluate("document.activeElement && document.activeElement.classList.contains('tk-firstfield')"))
        # type, then cancel — it must come back
        was = pg.evaluate("""()=>document.querySelector('.tk-firstfield').value""")
        pg.evaluate("""()=>{const f=document.querySelector('.tk-firstfield');
          f.value='ZZZ Renamed'; f.dispatchEvent(new Event('change',{bubbles:true}));}""")
        pg.wait_for_timeout(500)
        ck("typing lands in the data", pg.evaluate("""(k)=>{
             const t=k.split('|'); return ROWFIND[t[0]](t[1]).name;}""", target)=="ZZZ Renamed")
        pg.evaluate("""()=>document.querySelector('[data-rowcancel]').click()""")
        pg.wait_for_timeout(700)
        ck("Cancel puts it back", pg.evaluate("""(a)=>{
             const t=a[0].split('|'); return ROWFIND[t[0]](t[1]).name===a[1];}""", [target, was]),
           pg.evaluate("""(t)=>{const x=t.split('|'); return ROWFIND[x[0]](x[1]).name;}""", target))
        ck("...and closes the row", pg.evaluate("""(k)=>!document
             .querySelector('[data-tktable="'+k+'"]').querySelector('tr.tk-open')""", key))
        # reopen, edit, save — it must stick.
        # ON A MENU TABLE THE PEN IS BEHIND THE KEBAB AGAIN, because Cancel
        # closed the row and the menu with it. Reopening is two presses,
        # which is exactly what somebody does.
        open_row(pg, target)
        pg.evaluate("""()=>{const f=document.querySelector('.tk-firstfield');
          f.value='Kept Name'; f.dispatchEvent(new Event('change',{bubbles:true}));}""")
        pg.wait_for_timeout(400)
        pg.evaluate("""()=>document.querySelector('[data-rowsave]').click()""")
        pg.wait_for_timeout(700)
        ck("Save keeps the change", pg.evaluate("""(t)=>{
             const x=t.split('|'); return ROWFIND[x[0]](x[1]).name;}""", target)=="Kept Name")
        ck("...and closes the row", pg.evaluate("""(k)=>!document
             .querySelector('[data-tktable="'+k+'"]').querySelector('tr.tk-open')""", key))
        # leaving the page cancels
        open_row(pg, target)
        pg.click('.setuprail [data-setupgo="labels"]'); pg.wait_for_timeout(600)
        pg.click('.setuprail [data-setupgo="%s"]'%key); pg.wait_for_timeout(700)
        ck("leaving the page closes the open row",
           pg.evaluate("""(k)=>!document.querySelector('[data-tktable="'+k+'"]')
             .querySelector('tr.tk-open')""", key))
    print("\nerrors:", errs or "none")
    print("ALL GREEN" if bad==0 and not errs else str(bad)+" FAILED")
    b.close()
