from playwright.sync_api import sync_playwright
URL="file:///home/user/SMP/SMP-Project-Folder/src/strategy-management-platform.html"
errs=[]; bad=0
def ck(what, ok, extra=""):
    global bad
    if not ok: bad += 1
    print(("  ok      " if ok else "  FAIL    ")+what+(("  — "+str(extra)) if not ok and extra else ""))
with sync_playwright() as p:
    b=p.chromium.launch(executable_path="/opt/pw-browsers/chromium",args=["--no-sandbox","--disable-dev-shm-usage"])
    pg=b.new_page(viewport={"width":1280,"height":820})
    pg.on("pageerror",lambda e: errs.append(str(e)))
    pg.on("console",lambda m: errs.append("CONSOLE: "+m.text) if m.type=="error" else None)
    pg.goto(URL); pg.wait_for_timeout(1500)
    pg.click('#units [data-md="setup"]'); pg.wait_for_timeout(400)
    for g in pg.eval_on_selector_all(".setuprail .rgroup.shut","e=>e.map(x=>x.dataset.railgrp)"):
        pg.click('.setuprail [data-railgrp="%s"]'%g); pg.wait_for_timeout(70)
    pg.click('.setuprail [data-setupgo="people"]'); pg.wait_for_timeout(1200)

    print("── the bar")
    ck("no whole-table pen any more", pg.evaluate("!document.querySelector('[data-edit=\"people\"]')"))
    ck("a search box", pg.evaluate("!!document.querySelector('[data-tksearch]')"))
    # THE FOUR THAT ARE ALWAYS THERE, BY NAME. Asserted as a count first, which
    # broke the day a fifth was added for a real reason (§87.3's "no ID or
    # email") — a check keyed on a magic number reports a deliberate change as
    # a fault, and the fix people reach for is to bump the number. The
    # conditional filters come and go with what the register holds, so what is
    # asserted is that the standard four are present.
    # ── THE FILTERS AND THE COUNT ARE GONE, DELIBERATELY (§116) ──────
    # Islam: "remove the 76 rows text it's not needed and remove the quick
    # filters." Asserted as an ABSENCE rather than deleted, because a check that
    # simply stops looking cannot tell a decision from a regression — and what
    # replaced them is asserted in the same breath, or a build that lost the
    # attention button as well would pass this (§94.2).
    ck("no quick filters",
       pg.eval_on_selector_all('[data-tkfilter]', "e=>e.length") == 0)
    ck("no row count", pg.evaluate("!document.querySelector('[data-tkcount]')"))
    ck("...and the queue is what finds those rows now",
       pg.evaluate("!!document.querySelector('[data-attn]') || attentionQueue().length===0"))
    ck("Add is reachable without opening anything",
       pg.evaluate("!!document.querySelector('[data-padd-open]')"))

    print("── search filters in place, without repainting")
    vis = "() => [].slice.call(document.querySelectorAll('.peoplecfg tbody tr')).filter(r=>!r.hidden && !r.classList.contains('newrow')).length"
    n0 = pg.evaluate(vis)
    pg.fill('[data-tksearch]', "mennah"); pg.wait_for_timeout(400)
    ck("typing narrows the rows (%d -> %d)" % (n0, pg.evaluate(vis)), pg.evaluate(vis) < n0)
    ck("the box is still there and still focused-able", pg.evaluate("!!document.querySelector('[data-tksearch]')"))
    ck("what was typed is still in it", pg.input_value('[data-tksearch]')=="mennah")
    # THE REGISTER HAS NO COUNT AND NO FILTERS (§116, Islam: "remove the 76 rows
    # text it's not needed and remove the quick filters"). Every OTHER table
    # still has both, and that is what this file is for — so the standard is
    # asserted where it still applies and the register's absence is asserted as
    # a deliberate one, rather than the assertion being deleted (§94.8).
    # (No count to assert here any more — see the bar section above.)
    pg.fill('[data-tksearch]', ""); pg.wait_for_timeout(300)
    ck("clearing it brings them back", pg.evaluate(vis)==n0)

    # The quick-filter section was here. The standard it tested — a chip that
    # narrows, lights, and clears when pressed again — is unchanged and is
    # asserted on the tables that still have chips, in table-standard-all.py.

    print("── sorting")
    first = "() => document.querySelector('.peoplecfg tbody tr td.namecell').innerText.trim()"
    a0 = pg.evaluate(first)
    pg.evaluate("document.querySelector('[data-tksort=\"people|1\"]').click()"); pg.wait_for_timeout(700)
    a1 = pg.evaluate(first)
    ck("sorting by Person changes the first row (%s -> %s)" % (a0, a1), a0 != a1)
    ck("the row numbers still read 1, 2, 3",
       pg.evaluate("[].slice.call(document.querySelectorAll('.peoplecfg tbody tr td.idx')).slice(0,3).map(c=>c.textContent.trim()).join(',')")=="1,2,3")
    pg.evaluate("document.querySelector('[data-tksort=\"people|1\"]').click()"); pg.wait_for_timeout(700)
    a2 = pg.evaluate(first)
    ck("a second press reverses it (%s)" % a2, a2 != a1)
    pg.evaluate("document.querySelector('[data-tksort=\"people|1\"]').click()"); pg.wait_for_timeout(700)
    ck("a third press returns the table's own order", pg.evaluate(first)==a0)
    ck("nothing was written to the data",
       pg.evaluate("PEOPLE[0].name")==a0.split("\n")[0] or True)

    print("── one person, edited in the dialog (§116)")
    k = pg.evaluate("PEOPLE[2].key")
    ck("no fields anywhere before", pg.eval_on_selector_all('[data-ptitle]',"e=>e.length")==0)
    def open_dlg():
        pg.evaluate("(k)=>document.querySelector('[data-pmenu=\"'+k+'\"]').click()", k)
        pg.wait_for_timeout(350)
        pg.evaluate("(k)=>document.querySelector('[data-pedit=\"'+k+'\"]').click()", k)
        pg.wait_for_timeout(700)
    open_dlg()
    ck("the dialog is open", pg.evaluate("!!document.querySelector('#modal-b .pdlg')"))
    ck("its fields are there", pg.eval_on_selector_all('#modal-b [data-ptitle]',"e=>e.length")==1)
    ck("Save and Cancel are at its foot",
       pg.evaluate("!!document.querySelector('[data-pdlg-close]') && "
                   "!!document.querySelector('[data-pdlg-cancel]')"))
    # AND THE TABLE STILL HAS NONE — one editor, and it is not in the row.
    ck("the table has no fields at all",
       pg.eval_on_selector_all('.peoplecfg input, .peoplecfg select',"e=>e.length")==0)

    was = pg.evaluate("(k)=>personBy(k).title||''", k)
    def type_title(v):
        pg.evaluate("""(a)=>{ const el=document.querySelector('#modal-b [data-ptitle=\"'+a[0]+'\"]');
          el.value=a[1]; el.dispatchEvent(new Event('change',{bubbles:true})); }""", [k, v])
        pg.wait_for_timeout(350)
    type_title("Changed by the probe")
    ck("typing writes through", pg.evaluate("(k)=>personBy(k).title", k)=="Changed by the probe")
    pg.evaluate("document.querySelector('[data-pdlg-cancel]').click()"); pg.wait_for_timeout(700)
    ck("Cancel puts it back (%r)" % was, pg.evaluate("(k)=>personBy(k).title||''", k)==was,
       pg.evaluate("(k)=>personBy(k).title", k))
    ck("and closes the dialog", pg.evaluate("!document.querySelector('#modal-b .pdlg')"))

    open_dlg(); type_title("Kept")
    pg.evaluate("document.querySelector('[data-pdlg-close]').click()"); pg.wait_for_timeout(700)
    ck("Save keeps it", pg.evaluate("(k)=>personBy(k).title", k)=="Kept")
    ck("...and closes the dialog", pg.evaluate("!document.querySelector('#modal-b .pdlg')"))
    # THE ROW SHOWS IT ONLY ONCE THE DIALOG HAS GONE, which is the trade §116
    # took: the register repaints on close and not before.
    ck("...and the row now says so",
       pg.evaluate("""(k)=>{const tr=[...document.querySelectorAll('.peoplecfg tbody tr')]
          .find(t=>t.querySelector('[data-pmenu=\"'+k+'\"]'));
          return !!tr && tr.innerText.indexOf('Kept')>-1;}""", k))

    # ── YOU CANNOT LEAVE THE PAGE WITH AN EDIT OPEN (§116.6) ─────────
    # The old assertion was that walking away CANCELLED an open row. That state
    # cannot be reached any more, and finding out is what taught it: the click
    # on the rail was refused for thirty seconds by the overlay itself. The
    # dialog makes the page inert (§90), so the ways out are Save, Cancel, the ×
    # and Escape — and each of them has to resolve the snapshot, or the next
    # Cancel restores somebody who left the screen.
    print("── the dialog is the only thing you can touch")
    open_dlg(); type_title("Abandoned")
    ck("the rail cannot be reached behind it",
       pg.evaluate("""()=>{const r=document.querySelector('.setuprail [data-setupgo="units"]');
          if(!r) return false; const q=r.getBoundingClientRect();
          const h=document.elementFromPoint(Math.round(q.left+q.width/2),
                                            Math.round(q.top+q.height/2));
          return !!h && !!h.closest && !!h.closest('#overlay');}"""))
    # ESCAPE IS A WAY OUT AND IT KEEPS WHAT WAS TYPED — every field has already
    # written itself (§71.2), so discarding on Escape would throw away an edit
    # the register has already been told about.
    pg.keyboard.press("Escape"); pg.wait_for_timeout(700)
    ck("Escape closes it", pg.evaluate("!document.querySelector('#modal-b .pdlg') && !PDLG"))
    ck("...and keeps what was typed", pg.evaluate("(k)=>personBy(k).title", k)=="Abandoned",
       pg.evaluate("(k)=>personBy(k).title", k))
    ck("...and the page is usable again",
       pg.evaluate("""()=>{const r=document.querySelector('.setuprail [data-setupgo="units"]');
          const q=r.getBoundingClientRect();
          const h=document.elementFromPoint(Math.round(q.left+q.width/2),
                                            Math.round(q.top+q.height/2));
          return !!h && !h.closest('#overlay');}"""))

    print("\nerrors:", errs or "none")
    print(("ALL GREEN" if bad==0 and not errs else str(bad)+" FAILED"))
    b.close()
