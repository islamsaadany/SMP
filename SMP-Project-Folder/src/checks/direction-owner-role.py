"""A direction's owner and custodian are a row on Roles & access (§504).

Islam, of Amr Hassan, named Owner of one of the company's directions: *"we
dont have a direction owner in the roles & access and I made him a custodian
but nothing appearing for him"*, then *"A, view on group is fine, build it."*

Being named on a direction let somebody REPORT it (`ownsTopPillar`, §447) and
derived no role, so a person holding nothing else reached no destination and
read "No pages granted". It MAKES its state (§255) — two people on the
register holding nothing, the business units switched off, one direction
naming one as Owner and the other as Custodian — and asserts BOTH ENDS
(§94.2): each lands on the company, and somebody named on nothing still
reaches nothing. Then the Roles & access row: drawn, View on the group, and
the own-unit and own-function columns dashed. SMP_BUILT points it at another
build (§276).
"""
import os
from playwright.sync_api import sync_playwright

BUILT = os.environ.get("SMP_BUILT") or os.path.join(os.path.dirname(__file__), "..", "strategy-management-platform.html")
bad = 0
def ck(name, ok, detail=""):
    global bad
    print(("  ok   " if ok else "  FAIL ") + name + ("" if ok else "  — " + str(detail)))
    if not ok: bad += 1
def safe(pg, js, arg=None, dflt=None):
    try: return pg.evaluate(js, arg)
    except Exception as e: return dflt

MAKE = """()=>{
  PEOPLE.push({key:'t504a',name:'Testcase Direction Owner',active:true},
              {key:'t504b',name:'Testcase Direction Custodian',active:true},
              {key:'t504c',name:'Testcase Nobody Named',active:true});
  GROUP.structure = Object.assign({}, GROUP.structure || {}, {bu:{exists:false}});
  GROUP.items = [{id:'group-P1', code:'EA01', name:'Direction one', owner:'Testcase Direction Owner',
                  custodian:'Testcase Direction Custodian', measures:[], tactics:[]}];
  return true}"""

LOOK = """(k)=>{ switchViewer(k); paint();
  var p = document.getElementById('panel');
  return {roles: SMPRules.personRoles(world(), viewer()).map(r=>r.role+'@'+r.at),
          cur: current, none: /No pages granted/.test(p ? p.innerText : '')}; }"""

with sync_playwright() as p:
    b = p.chromium.launch(executable_path=os.environ.get("SMP_CHROME") or None)
    pg = b.new_page(viewport={"width": 1500, "height": 900})
    errs = []; pg.on("pageerror", lambda e: errs.append(str(e)))
    pg.add_init_script("try{sessionStorage.setItem('smp.welcome.done','1');localStorage.setItem('smp.tour.never','1')}catch(e){}")
    pg.goto("file://" + os.path.abspath(BUILT)); pg.wait_for_timeout(1500)
    safe(pg, MAKE)

    for k, who in (("t504a", "the owner"), ("t504b", "the custodian")):
        r = safe(pg, LOOK, k, {}) or {}
        ck("%s holds the Direction owner role at the group" % who, r.get("roles") == ["dirowner@group"], r.get("roles"))
        ck("%s lands on the company, not on 'No pages granted'" % who,
           r.get("cur") == "group" and not r.get("none"), r)
    r = safe(pg, LOOK, "t504c", {}) or {}
    ck("somebody named on no direction still reaches nothing (the other end)",
       r.get("roles") == [] and r.get("none"), r)

    # The row on Roles & access, seen as the office.
    acc = safe(pg, """()=>{ switchViewer(PEOPLE.find(p=>p.role==='super').key);
      current='setup'; currentSub='access'; paint();
      var row = [...document.querySelectorAll('#panel tr')].find(tr=>/Direction owner/.test(tr.textContent));
      if (!row) return null;
      return {cells: [...row.querySelectorAll('td')].map(td=>({t:td.textContent.trim(), dash: !!td.querySelector('.na,[data-na]') || /^\\u2014$/.test(td.textContent.trim())}))}; }""")
    ck("Roles & access draws a Direction owner row", bool(acc), acc)
    if acc:
        ck("the row is the group's View and some columns are not applicable",
           any(c["dash"] for c in acc["cells"]), acc["cells"])
    ck("no page errors", not errs, errs)
    b.close()

print("all good" if not bad else "%d FAILED" % bad)
raise SystemExit(1 if bad else 0)
