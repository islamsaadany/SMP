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
    ck("...and no Duplicates filter", pg.evaluate("!document.querySelector('[data-tkfilter=\"people|dupe\"]')"))

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
    marks = pg.eval_on_selector_all('.dupemark',"e=>e.map(x=>x.textContent.trim())")
    print("     marks:", marks)
    ck("the employee-number pair is marked", marks.count("Emp ID twice")>=2, marks)
    ck("the shared address pair is marked", marks.count("Email twice")>=2, marks)
    ck("the identical full names are marked", marks.count("Name twice")>=2, marks)
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

    print("── the filter")
    ck("a Duplicates chip appears", pg.evaluate("!!document.querySelector('[data-tkfilter=\"people|dupe\"]')"))
    pg.evaluate("document.querySelector('[data-tkfilter=\"people|dupe\"]').click()"); pg.wait_for_timeout(800)
    vis = pg.evaluate("() => [].slice.call(document.querySelectorAll('.peoplecfg tbody tr')).filter(r=>!r.hidden && !r.classList.contains('newrow')).length")
    ck("it narrows to exactly the six affected rows (%d)" % vis, vis==6, vis)
    ck("every visible row carries a mark",
       pg.evaluate("""() => [].slice.call(document.querySelectorAll('.peoplecfg tbody tr'))
          .filter(r=>!r.hidden && !r.classList.contains('newrow'))
          .every(r=>!!r.querySelector('.dupemark'))"""))
    print("── header")
    chips = pg.eval_on_selector_all('.phead2 .chip',"e=>e.map(x=>x.textContent.trim())")
    print("     chips:", [c for c in chips if "row" in c])
    ck("the header counts them too", any("more than one row" in c for c in chips), chips)
    print("\nerrors:", errs or "none")
    print("ALL GREEN" if bad==0 and not errs else str(bad)+" FAILED")
    b.close()
