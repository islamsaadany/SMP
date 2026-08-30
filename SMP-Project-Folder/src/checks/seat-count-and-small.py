"""FOUR SMALL ONES, AND ONE THAT IS NOT (§187).

Islam's round after the seat work, in his order:

  · "level smo shouldn't be a super user — super user is only granted by the
    super user in the registry, for now."  personRoles() read the pre-§33
    `level` field as a fallback, so a person object carrying `level:"smo"`
    derived Super user on the SCREEN and on the SERVER, and an unrecognised
    key on a person round-trips through `people.extra` untouched. Nothing has
    written it for fifty versions — an ungated fallback nobody was watching,
    which is §186's shape exactly.

  · "where will I find this out if it's applied to anyone else?"  §186's queue
    catches a seat sitting somewhere other than where its holder does, and is
    deliberately quiet about one held BY somebody who sits at the group. This
    is the count that cannot be quiet about anybody.

  · "remove the missing collaborators as missing items."  Reversing §145.10:
    a tactic with nobody supporting it is a tactic ONE person owns, which is
    a complete way to write a line, and every one of them was owing something.

  · the welcome header at 204px — his pick from the mockup.

EVERY ASSERTION AT BOTH ENDS (§113.8), or a build that removed the feature
would satisfy every one about absence: the fallback derives nothing AND a
granted seat still does; collaborators are off the gap list AND the owner is
still on it; the tenant block holds its place at three widths AND stacks
again below 820, which is deliberate rather than a regression.

THE SEAT COUNT IS ASSERTED AS AGREEMENT, never as a number (§94.8): it must
equal what the register itself holds, so a tenant with different people stays
green and a count that drifts from its own source does not.

Run:  SMP_CHROME=/opt/pw-browsers/chromium python3 qa-run.py checks/seat-count-and-small.py
"""
from playwright.sync_api import sync_playwright
import os, pathlib, sys
HERE = pathlib.Path(__file__).resolve().parent
URL = "file://" + str(pathlib.Path(os.environ.get("SMP_SMALL_HTML") or
                      (HERE.parent / "strategy-management-platform.html")))
bad = 0
def ck(w, ok, x=""):
    global bad
    if not ok: bad += 1
    print(("  ok      " if ok else "  FAIL    ") + w + (("  — " + str(x)) if not ok and x else ""))

with sync_playwright() as p:
    b = p.chromium.launch(executable_path="/opt/pw-browsers/chromium",
                          args=["--no-sandbox","--disable-dev-shm-usage"])
    errs = []
    pg = b.new_page(viewport={"width":1600,"height":1000})
    pg.on("pageerror", lambda e: errs.append(str(e)))
    pg.add_init_script("try{sessionStorage.setItem('smp.welcome.done','1');"
                       "localStorage.setItem('smp.tour.never','1')}catch(e){}")
    pg.goto(URL); pg.wait_for_timeout(1500)

    print("\n1 · the seat count on the register")
    pg.evaluate("()=>{VIEWER=PEOPLE.filter(x=>SMPRules.mayEditAccess(world(),x))[0].key;}")
    pg.evaluate("()=>document.querySelector('[data-md=\"setup\"]').click()"); pg.wait_for_timeout(400)
    pg.evaluate("()=>document.querySelector('[data-setupgo=\"people\"]').click()"); pg.wait_for_timeout(800)
    seat = pg.evaluate("""()=>{const e=document.querySelector('.pseats');
      if(!e) return null;
      const w=world();
      const holders=PEOPLE.filter(p=>personActive(p) &&
        SMPRules.personRoles(w,p).some(r=>SMPRules.isSeatRole(r.role)));
      return { text:e.textContent.trim(), title:e.title,
               agrees: e.textContent.indexOf(String(holders.length))===0,
               n:holders.length,
               names: holders.every(p=>e.title.indexOf(p.name)>-1) };}""")
    ck("the register says how many hold a seat", seat is not None, seat)
    if seat:
        ck("...and the number agrees with the register itself", seat["agrees"], seat)
        ck("...and the hover names every one of them", seat["names"], seat["title"][:120])
        # ALWAYS DRAWN — a count that vanishes cannot be trusted to be complete.
        ck("...it is drawn even on a healthy tenant", seat["n"] > 0 and seat["text"], seat)

    print("\n2 · a seat is granted, never derived")
    ck("level:smo derives nothing on the page",
       pg.evaluate("()=>SMPRules.personRoles(world(),{key:'x',name:'X',level:'smo',unit:'group'}).length===0"))
    ck("...and a granted seat still does",
       pg.evaluate("()=>SMPRules.personRoles(world(),{key:'x',name:'X',role:'super',unit:'group'})[0].role==='super'"))

    print("\n3 · collaborators are not a missing item")
    ck("collaborators is off the tactic's gap list",
       pg.evaluate("()=>SMPRules.GAP_FIELDS.tactic.indexOf('collaborators')===-1"))
    ck("...and the owner is still on it",
       pg.evaluate("()=>SMPRules.GAP_FIELDS.tactic.indexOf('owner')>-1"))

    print("\n4 · the welcome header, at three widths")
    for w in (1440, 1100, 900):
        pg.set_viewport_size({"width": w, "height": 800})
        pg.wait_for_timeout(200)
        m = pg.evaluate("""()=>{
          document.querySelectorAll('.welcomeover').forEach(e=>e.remove());
          const box=document.createElement('div'); box.className='welcomeover';
          box.innerHTML=`<div class="wwrap"><div class="whero">
            <div class="wgreet"><p class="wkick">Strategy Management Platform</p>
              <h2>Welcome, Hala</h2><div class="wwho">
              <span class="wchip">Strategy custodian &middot; Customer Experience (function)</span>
              <span class="wchip">Project owner &middot; Customer Experience (function)</span>
              <span class="wchip wcycle"><i></i>Cycle 1 cycle is open</span></div></div>
            <div class="wtenant"><div class="wmark">RT</div><h1>Raya Trade</h1>
              <div class="woffice">Strategy Management Office</div></div>
          </div></div>`;
          document.body.appendChild(box);
          const h=document.querySelector('.whero').getBoundingClientRect();
          const g=document.querySelector('.wgreet').getBoundingClientRect();
          const t=document.querySelector('.wtenant').getBoundingClientRect();
          return { hero:Math.round(h.height), below: t.top > g.bottom-4 };}""")
        ck("%d: the tenant block holds its place" % w, not m["below"], m)
        ck("%d: ...and the header is under 250px" % w, m["hero"] < 250, m)
    # BELOW 820 THE OLD STACKING IS DELIBERATE, so it is asserted rather than
    # left to look like a regression.
    pg.set_viewport_size({"width": 760, "height": 800}); pg.wait_for_timeout(250)
    st = pg.evaluate("""()=>{const g=document.querySelector('.wgreet').getBoundingClientRect();
      const t=document.querySelector('.wtenant').getBoundingClientRect();
      return t.top > g.bottom-4;}""")
    ck("760: below 820 it stacks again, on purpose", st, st)

    ck("nothing threw", not errs, errs[:1])
    b.close()
print(("\n%d FAILED" % bad) if bad else "\nall good")
sys.exit(1 if bad else 0)
