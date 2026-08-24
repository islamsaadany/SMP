"""EDITING A ROW ON THE ROW (spec 012 §2.1, §85)."""
from playwright.sync_api import sync_playwright
URL="file:///home/user/SMP/SMP-Project-Folder/src/strategy-management-platform.html"
TABLES=[("units","Business units"),("companies","Companies"),("fns","Functions"),("caps","Capabilities"),("mainbu","Official BU list"),("sets","Figure sets")]
bad=0; errs=[]
def ck(w, ok, x=""):
    global bad
    if not ok: bad+=1
    print(("    ok   " if ok else "    FAIL ")+w+(("  — "+str(x)) if not ok and x else ""))
with sync_playwright() as p:
    b=p.chromium.launch(executable_path="/opt/pw-browsers/chromium",args=["--no-sandbox","--disable-dev-shm-usage"])
    pg=b.new_page(viewport={"width":1440,"height":950})
    pg.on("pageerror",lambda e: errs.append(str(e)))
    pg.goto(URL); pg.wait_for_timeout(1500)
    pg.click('#units [data-md="setup"]'); pg.wait_for_timeout(400)
    for g in pg.eval_on_selector_all(".setuprail .rgroup.shut","e=>e.map(x=>x.dataset.railgrp)"):
        pg.click('.setuprail [data-railgrp="%s"]'%g); pg.wait_for_timeout(70)
    for key,label in TABLES:
        pg.click('.setuprail [data-setupgo="%s"]'%key); pg.wait_for_timeout(900)
        print("──", label)
        pens = pg.eval_on_selector_all('[data-rowedit^="%s|"]'%key, "e=>e.length")
        rows = pg.evaluate("""(k)=>{const t=document.querySelector('[data-tktable="'+k+'"]');
          return [].slice.call(t.tBodies[0].rows).filter(r=>!r.classList.contains('newrow')).length;}""", key)
        # ONE PEN PER ROW — not "more than one", which fails on the one-row
        # table for having exactly the right number.
        ck("every row offers a pen (%d of %d rows)" % (pens, rows), pens == rows, (pens, rows))
        ck("no fields are open before one is pressed",
           pg.evaluate("""(k)=>document.querySelectorAll('[data-tktable="'+k+'"] tbody tr:not(.newrow) input').length""", key)==0)
        # open the second row
        # NOT ALWAYS THE SECOND ROW — Figure sets has one. Take the second
        # where there is one, so the test still exercises "a row other than the
        # first", and the first where there is not.
        target = pg.evaluate("""(k)=>{const ps=document.querySelectorAll('[data-rowedit^="'+k+'|"]');
          return ps[Math.min(1, ps.length-1)].dataset.rowedit;}""", key)
        pg.evaluate("""(t)=>document.querySelector('[data-rowedit="'+t+'"]').click()""", target)
        pg.wait_for_timeout(700)
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
        # reopen, edit, save — it must stick
        pg.evaluate("""(t)=>document.querySelector('[data-rowedit="'+t+'"]').click()""", target)
        pg.wait_for_timeout(500)
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
        pg.evaluate("""(t)=>document.querySelector('[data-rowedit="'+t+'"]').click()""", target)
        pg.wait_for_timeout(400)
        pg.click('.setuprail [data-setupgo="labels"]'); pg.wait_for_timeout(600)
        pg.click('.setuprail [data-setupgo="%s"]'%key); pg.wait_for_timeout(700)
        ck("leaving the page closes the open row",
           pg.evaluate("""(k)=>!document.querySelector('[data-tktable="'+k+'"]')
             .querySelector('tr.tk-open')""", key))
    print("\nerrors:", errs or "none")
    print("ALL GREEN" if bad==0 and not errs else str(bad)+" FAILED")
    b.close()
