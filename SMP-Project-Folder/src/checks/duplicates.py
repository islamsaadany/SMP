from playwright.sync_api import sync_playwright
URL="file:///home/user/SMP/SMP-Project-Folder/src/strategy-management-platform.html"
errs=[]; bad=0
def ck(w, ok, x=""):
    global bad
    if not ok: bad+=1
    print(("  ok      " if ok else "  FAIL    ")+w+(("  — "+str(x)) if not ok and x else ""))
with sync_playwright() as p:
    b=p.chromium.launch(executable_path="/opt/pw-browsers/chromium",args=["--no-sandbox","--disable-dev-shm-usage"])
    pg=b.new_page(viewport={"width":1440,"height":900})
    pg.on("pageerror",lambda e: errs.append(str(e)))
    pg.goto(URL); pg.wait_for_timeout(1500)
    pg.click('#units [data-md="setup"]'); pg.wait_for_timeout(400)
    for g in pg.eval_on_selector_all(".setuprail .rgroup.shut","e=>e.map(x=>x.dataset.railgrp)"):
        pg.click('.setuprail [data-railgrp="%s"]'%g); pg.wait_for_timeout(70)
    pg.click('.setuprail [data-setupgo="people"]'); pg.wait_for_timeout(1100)
    ck("a clean register shows no duplicate marks", pg.eval_on_selector_all('.dupemark',"e=>e.length")==0)
    # THE QUICK FILTERS ARE GONE (§116, Islam: "remove the quick filters"), so a
    # clean register is one with nobody in the attention queue for a duplicate.
    ck("...and nobody is queued for one",
       pg.evaluate("attentionQueue().filter(a=>a.why[0].kind==='dupe').length")==0)

    # make three kinds of duplicate, exactly as the real file could
    print("── with real duplicates injected")
    pg.evaluate("""() => {
      const a=PEOPLE[3], b=PEOPLE[4], c=PEOPLE[5], d=PEOPLE[6];
      a.empId='10154'; b.empId='10154';                       // same employee number
      c.email='shared@rayacorp.com'; d.email='shared@rayacorp.com';
      PEOPLE.push({key:'ahmedmostafamo', name:'Ahmed Mostafa Mohamed El Gebely', empId:'185'});
      PEOPLE.push({key:'ahmedmostafam2', name:'Ahmed Mostafa Mohamed Abou El Einen', empId:'9648'});
      PEOPLE.push({key:'twin1', name:'Exactly The Same Person', empId:'A'});
      PEOPLE.push({key:'twin2', name:'Exactly The Same Person', empId:'B'});
      paint(); }""")
    pg.wait_for_timeout(900)
    # THE MARK IS A GLYPH AND THE WORDS ARE ON ITS HOVER (§116.4). It used to
    # read "Emp ID twice" beside the name, in the frozen column — so any row
    # carrying one wrapped and stood 13px taller than its neighbours. What is
    # asserted is unchanged: that each kind of collision is marked and that the
    # mark SAYS WHICH. It is read from the title now, which is where a check
    # should have been reading it all along — the words are the contract, the
    # glyph is a rendering of them.
    marks = pg.eval_on_selector_all('.dupemark',"e=>e.map(x=>x.title)")
    print("     marks:", [m[:44] for m in marks])
    ck("the employee-number pair is marked",
       len([m for m in marks if m.lower().startswith("emp id")])>=2, marks)
    ck("the shared address pair is marked",
       len([m for m in marks if m.lower().startswith("email")])>=2, marks)
    ck("the identical full names are marked",
       len([m for m in marks if m.lower().startswith("name")])>=2, marks)
    ck("the mark names the other rows",
       "is on 2 rows" in pg.eval_on_selector('.dupemark',"e=>e.title"),
       pg.eval_on_selector('.dupemark',"e=>e.title"))

    print("── the two Ahmeds are told apart rather than warned about")
    names = pg.evaluate("""() => [].slice.call(document.querySelectorAll('.peoplecfg td.namecell b'))
        .map(e=>e.textContent.trim()).filter(t=>t.indexOf('Ahmed Mostafa')===0)""")
    print("     shown as:", names)
    ck("both Ahmeds are on screen", len(names)==2, names)
    ck("...and they read differently", len(set(names))==2, names)
    # A LONGER NAME IS ONLY EVER SHOWN TO SOMEBODY WHO NEEDS IT. Asserting a
    # COUNT was wrong: the two identical twins cannot be told apart at any
    # length, so they are lengthened too and the count is four, not two. The
    # contract is "longer only where the three-name form collides".
    ck("...and a longer name is shown only where three names collide",
       pg.evaluate("""() => {
         const rows=[].slice.call(document.querySelectorAll('.peoplecfg td.namecell b'))
           .map(e=>e.textContent.trim());
         const three={};
         rows.forEach(t=>{ const k=t.split(/\\s+/).slice(0,3).join(' ').toLowerCase();
                           three[k]=(three[k]||0)+1; });
         return rows.every(t => t.split(/\\s+/).length<=3 ||
                                three[t.split(/\\s+/).slice(0,3).join(' ').toLowerCase()]>1);
       }"""))
    ck("neither Ahmed is marked as a duplicate (they are different people)",
       pg.evaluate("""() => [].slice.call(document.querySelectorAll('.peoplecfg tbody tr'))
          .filter(r=>/Ahmed Mostafa Mohamed/.test(r.innerText) && r.querySelector('.dupemark')).length""")==0)

    # ── THE QUEUE, NOT A FILTER (§116.2) ─────────────────────────────
    # Islam: "I don't know which lines I should go and check", and then: "remove
    # the quick filters". The Duplicates chip was how you found these rows; the
    # attention queue is how you find them now, and it does the thing the chip
    # could not — it opens them one after another with the reason stated.
    print("── the queue")
    q = pg.evaluate("attentionQueue().filter(a=>a.why.some(w=>w.kind==='dupe')).map(a=>a.key)")
    ck("all six affected people are queued (%d)" % len(q), len(q)==6, q)
    ck("and the reason names the collision",
       pg.evaluate("""()=>{const a=attentionQueue().filter(x=>x.why[0].kind==='dupe')[0];
          return !!a && /same (employee number|address|name)/i.test(a.why[0].say);}"""))
    ck("the button carries the count",
       pg.evaluate("""()=>{const b=document.querySelector('.attnn');
          return !!b && parseInt(b.textContent,10) >= 6;}"""))
    # ── ONE NAME, TWO PEOPLE (§130) ──────────────────────────────────
    # Islam: "for the names you normally take the first 2 names but you allow
    # me to amend the name in the edit. can you notify me as an issue to
    # address if 2 people their 1st 2 names are the same so I can edit one of
    # them." §81.1 already LENGTHENS the guess so the register can be read;
    # this is the notice that somebody should now decide what each of the pair
    # is actually called. A queue entry and never a mark: the Ahmeds are two
    # real people, and §87 says a shared name is not evidence of one human.
    print("── one name, two people (§130)")
    sn = pg.evaluate("""()=>attentionQueue()
        .filter(a=>a.why.some(w=>w.kind==='samename')).map(a=>a.key)""")
    ck("both Ahmeds are queued for sharing a reading",
       set(["ahmedmostafamo","ahmedmostafam2"]) <= set(sn), sn)
    say = pg.evaluate("""()=>{const a=attentionQueue().filter(x=>x.key==='ahmedmostafamo')[0];
        const w=a&&a.why.filter(w=>w.kind==='samename')[0]; return w?w.say:'';}""")
    ck("...and the entry names the other person in full", "Abou El Einen" in say, say)
    ck("...as an issue, never as a duplicate",
       pg.evaluate("""()=>attentionQueue().filter(a=>
          (a.key==='ahmedmostafamo'||a.key==='ahmedmostafam2') &&
          a.why.some(w=>w.kind==='dupe')).length""")==0)
    ck("the identical twins stay the duplicate flag's, said once not twice",
       pg.evaluate("""()=>attentionQueue().filter(a=>(a.key==='twin1'||a.key==='twin2') &&
          a.why.some(w=>w.kind==='samename')).length""")==0)
    # THE REASON IS SAID WHERE THE FIX IS: the queue's dialog, above the very
    # field that clears it — the same band every other kind already uses.
    pg.evaluate("()=>document.querySelector('[data-attn]').click()")
    pg.wait_for_timeout(500)
    pg.evaluate("""()=>{ PDLG.at = PDLG.queue.findIndex(a=>a.key==='ahmedmostafamo');
        PDLG.key = 'ahmedmostafamo'; personDialogPaint(); }""")
    pg.wait_for_timeout(400)
    band = pg.eval_on_selector("#modal-b .pdband", "e=>e.textContent")
    ck("the dialog says it above the fields", "They read as" in band, band)
    # AMENDING ONE CLEARS BOTH — typed through the dialog's own Name field, so
    # the whole path is pressed, and the band re-asks rather than trusting the
    # render that drew it (§48.2).
    pg.evaluate("""()=>{ const f=document.querySelector('#modal-b [data-pknown]');
        f.value='Ahmed El Gebely'; f.dispatchEvent(new Event('change',{bubbles:true})); }""")
    pg.wait_for_timeout(600)
    ck("amending one Name clears both",
       pg.evaluate("""()=>attentionQueue().filter(a=>a.why.some(w=>w.kind==='samename') &&
          (a.key==='ahmedmostafamo'||a.key==='ahmedmostafam2')).length""")==0)
    # A TYPED NAME THAT STILL COLLIDES IS STILL FLAGGED — a typed value is
    # never lengthened (§81.1), so without this the pair reads as one person
    # for ever, with nothing left to notice it.
    pg.evaluate("()=>{ setKnownName(personBy('ahmedmostafamo'),'Ahmed Mostafa'); paint(); }")
    pg.wait_for_timeout(400)
    ck("a typed Name that still collides keeps the pair queued",
       pg.evaluate("""()=>attentionQueue().filter(a=>a.why.some(w=>w.kind==='samename') &&
          (a.key==='ahmedmostafamo'||a.key==='ahmedmostafam2')).length""")==2)
    pg.evaluate("()=>{ setKnownName(personBy('ahmedmostafamo'),''); paint(); }")
    pg.keyboard.press("Escape")
    pg.wait_for_timeout(400)

    # ── AND THE HEADER SAYS IT ONCE, NOT SIX TIMES (§116) ────────────
    # It carried a chip per KIND of collision — "1 employee number on more than
    # one row", "1 address…", "1 name…" — beside three more counts and five
    # filter chips, over two rows that ran off the right edge at 1280. They are
    # one button, and it is the one that opens them.
    print("── header")
    ck("no alarm chips are left in the header",
       pg.eval_on_selector_all('.phead2 .chip', "e=>e.map(x=>x.textContent)")
         .count("more than one row") == 0)
    ck("the count is on the button that opens them",
       pg.evaluate("!!document.querySelector('[data-attn] .attnn')"))
    print("\nerrors:", errs or "none")
    print("ALL GREEN" if bad==0 and not errs else str(bad)+" FAILED")
    b.close()
