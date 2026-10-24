"""THE ORGANISATION TABLES OPEN A CELL ON A DOUBLE-CLICK (§630).

Islam: *"why to edit row by row why the editing doesn't happen on the cell
level with a double click that opens the editable cells for editing?"* and
*"the capabilities exist why to remove it?"* — then, of the mockup that drew
both, *"go ahead with the mockup, build it"*.

WHAT IS ASSERTED IS THE PROBLEM (§94.8), BOTH ENDS EVERY TIME (§94.2):

  1 · BUSINESS UNITS. A double-click opens the cell where it is, holding the
      dialog's own control; typing and Enter WRITES the record (read off the
      record, never off the page — §96); Escape puts the old value back; the
      division list writes; a head cell opens the person list floating UNDER
      the cell and on screen, picking writes the seat and shuts the cell,
      Cancel shuts it with nothing written, and a press elsewhere lets go.
      While arranging nothing opens, and a viewer who may not edit is offered
      no cell at all.
  2 · FUNCTIONS. Name, code, how it plans and where it belongs open and
      write; the head opens the same list.
  3 · DIVISIONS. Name and what its CEO sees open and write; the search box
      says divisions.
  4 · CAPABILITIES ON EL ABD'S SHAPE (made, §255: directions and the five
      capabilities moved into the company plan by the product's own
      `capFoldIntoTop()`). The page is a table of the five with their codes
      and owners; a name typed there is what the company plan's own pillar
      holds; an owner chosen writes the pillar's owner; Add makes the next
      capability, C006, in the company plan with its name open; Open in the
      plan lands on the company's Capabilities tab with that row picked.
      Somebody who may edit this page but not the company plan gets the
      table to read, with neither cells nor Add.

EVERY PROBE DEGRADES (§215). Over file://, because every write here lands in
memory first and the record is what is read.

Run: python3 qa-run.py checks/org-cells.py
     SMP_BUILT=<another build> …   # prove it can fail (§276)
"""
import copy, json, os, pathlib
from playwright.sync_api import sync_playwright

HERE = pathlib.Path(__file__).resolve().parent
ROOT = HERE.parents[2]
BUILT = os.environ.get("SMP_BUILT") or str(HERE / ".." / "strategy-management-platform.html")
URL = "file://" + os.path.abspath(BUILT)
bad = 0
errs = []


def ck(w, ok, x=""):
    global bad
    if not ok:
        bad += 1
    print(("  ok      " if ok else "  FAIL    ") + w + (("  - " + str(x)) if not ok and x != "" else ""))


def ev(pg, js, arg=None, default=None):
    try:
        return pg.evaluate(js, arg) if arg is not None else pg.evaluate(js)
    except Exception as e:
        errs.append("PROBE: " + str(e)[:160])
        return default


def go(pg, sub):
    ev(pg, "(k)=>{ VIEWER=null; current='setup'; currentSub=k; paint(); }", sub)
    pg.wait_for_timeout(400)


def dbl(pg, cell):
    try:
        pg.locator('[data-ocell="%s"]' % cell).dblclick(timeout=3000)
    except Exception as e:
        errs.append("PROBE: no cell " + cell)
    pg.wait_for_timeout(350)


OPEN = """()=>{ const o=document.querySelector('td.ocellopen'); if(!o) return null;
  const f=o.querySelector('.fld'); const a=document.activeElement;
  return { tag: f ? f.tagName : null, attrs: f ? [...f.attributes].map(x=>x.name).filter(n=>n.startsWith('data-')) : [],
           focus: !!(a && o.contains(a)) || (a && a.id==='pickQ'), pop: !!o.querySelector('.ocellpop') }; }"""
SHUT = "()=>!document.querySelector('td.ocellopen') && OCELL===null"

# ── EL ABD'S SHAPE (capability-tab-edit.py's own builder, §255) ──────────────
CAPS = ["End-to-End Quality Mindset", "ERP Enhancement", "Digital Transformation",
        "Talent & Workforce Optimization", "Operational excellence"]
DIRS = ["Maximizing Current Stores", "Egypt Expansion", "Growing FMCG",
        "ELABD Corner, Events and Catering", "E-Commerce Growth"]


def el_abd():
    s = copy.deepcopy(json.loads((ROOT / "db" / "seed-state.json").read_text()))
    s["group"]["structure"] = dict(s["group"].get("structure") or {}, bu={"exists": False})
    who = [p for p in s["people"] if p.get("key") and p.get("name")]
    s["group"]["items"] = [{
        "id": "group-P%d" % (i + 1), "code": "", "name": n, "sub": "", "kind": "Direction",
        "theme": "", "owner": "",
        "measures": [{"id": "group-P%d-M1" % (i + 1), "name": n + " measure", "dir": "≥",
                      "target": "100", "compile": "Latest", "actual": ""}],
        "tactics": [{"id": "group-P%d-T1" % (i + 1), "name": n + " tactic", "owner": "", "q1": 1}]}
        for i, n in enumerate(DIRS)]
    s["group"]["capabilities"] = [{
        "id": "cap%d" % i, "name": n, "def": "", "format": "pillars",
        "head": who[i]["key"] if i < 3 else None,
        "keyObjectives": [], "projects": [],
        "items": [{"id": "cap:cap%d-P1" % i, "code": "", "name": "" if i == 0 else n, "sub": "",
                   "kind": "", "theme": "", "owner": "",
                   "measures": [{"id": "cap:cap%d-P1-M1" % i, "name": n + " measure", "dir": "≥",
                                 "target": "100", "compile": "Latest", "actual": ""}],
                   "tactics": [{"id": "cap:cap%d-P1-T1" % i, "name": n + " tactic", "owner": "", "q1": 1}]}]}
        for i, n in enumerate(CAPS)]
    return s


LOAD = """(s)=>{
  GROUP = s.group; UNIT_KEYS = s.unitKeys; UNITS = s.units;
  FUNCTION_KEYS = s.functionKeys; FUNCTIONS = s.functions;
  if (typeof fnPruneNulls === "function") (FUNCTION_KEYS || []).forEach(function (k) { fnPruneNulls(FUNCTIONS[k]); });
  COMPANY_KEYS = s.companyKeys || []; COMPANIES = s.companies || {};
  PEOPLE = s.people; UNIT_ROLES = s.unitRoles; ACCESS = s.access;
  LABELS.entries = s.labels; BANDS.bands = s.bands;
  KO_WEIGHTS = s.koWeights || {}; CYCLE = s.cycle; REVIEW = s.review;
  HISTORY = s.history; ARCHIVES = s.archives || [];
  PRIOR_CYCLE = s.priorCycle || { factors: [] };
  UNIT_KEYS.forEach(function (k) { UNITS[k].ukey = k; });
  syncWeights(); }"""


def fresh(b):
    pg = b.new_page(viewport={"width": 1440, "height": 900})
    pg.add_init_script("try{sessionStorage.setItem('smp.welcome.done','1');"
                       "localStorage.setItem('smp.tour.never','1')}catch(e){}")
    pg.on("pageerror", lambda e: errs.append(str(e)))
    pg.goto(URL)
    pg.wait_for_timeout(1300)
    return pg


with sync_playwright() as p:
    b = p.chromium.launch(executable_path=os.environ.get("SMP_CHROME") or "/opt/pw-browsers/chromium",
                          args=["--no-sandbox", "--disable-dev-shm-usage"])
    pg = fresh(b)
    K = ev(pg, "()=>UNIT_KEYS.filter(k=>UNITS[k].active)[0]")

    print("\n1 · Business units: a double-click opens the cell where it is")
    go(pg, "units")
    ck("the cells the dialog changes are offered", (ev(pg, "()=>document.querySelectorAll('[data-ocell^=\"units|\"]').length", None, 0) or 0) >= 7)
    dbl(pg, "units|%s|code" % K)
    o = ev(pg, OPEN) or {}
    ck("the code opens as the dialog's own box, with the cursor in it",
       o.get("tag") == "INPUT" and "data-upx" in o.get("attrs", []) and o.get("focus"), o)
    pg.keyboard.press("Control+A"); pg.keyboard.type("ZQ9"); pg.keyboard.press("Enter")
    pg.wait_for_timeout(300)
    ck("Enter writes the record", ev(pg, "(k)=>UNITS[k].codePrefix", K) == "ZQ9", ev(pg, "(k)=>UNITS[k].codePrefix", K))
    ck("…and shuts the cell", ev(pg, SHUT) is True)
    dbl(pg, "units|%s|name" % K)
    name0 = ev(pg, "(k)=>UNITS[k].name", K)
    pg.keyboard.press("Control+A"); pg.keyboard.type("Nothing kept"); pg.keyboard.press("Escape")
    pg.wait_for_timeout(300)
    ck("Escape puts the old value back", ev(pg, "(k)=>UNITS[k].name", K) == name0, ev(pg, "(k)=>UNITS[k].name", K))
    ck("…and shuts the cell", ev(pg, SHUT) is True)
    dbl(pg, "units|%s|nav" % K)
    pg.keyboard.type("Short"); pg.keyboard.press("Enter"); pg.wait_for_timeout(300)
    ck("the name in the navigation writes", ev(pg, "(k)=>UNITS[k].navName", K) == "Short")
    dbl(pg, "units|%s|division" % K)
    o = ev(pg, OPEN) or {}
    ck("the division opens as the dialog's own list", o.get("tag") == "SELECT" and "data-ucomp" in o.get("attrs", []), o)
    ev(pg, """()=>{ const s=document.querySelector('td.ocellopen select'); s.value='';
                    s.dispatchEvent(new Event('change',{bubbles:true})); }""")
    pg.wait_for_timeout(300)
    ck("choosing writes the unit's division", ev(pg, "(k)=>UNITS[k].company||''", K) == "")
    ck("…and shuts the cell", ev(pg, SHUT) is True)
    dbl(pg, "units|%s|plans" % K)
    o = ev(pg, OPEN) or {}
    ck("how it plans opens as the dialog's own list", o.get("tag") == "SELECT" and "data-uformat" in o.get("attrs", []), o)
    pg.keyboard.press("Escape"); pg.wait_for_timeout(300)
    ck("…and Escape shuts it", ev(pg, SHUT) is True)

    print("\n1b · a head is picked from the person list, floating under the cell")
    dbl(pg, "units|%s|head" % K)
    o = ev(pg, OPEN) or {}
    ck("the head cell opens its list in the same press, cursor in the search", o.get("pop") and o.get("focus"), o)
    geo = ev(pg, """()=>{ const c=document.querySelector('td.ocellopen').getBoundingClientRect();
        const p=document.querySelector('.ocellpop').getBoundingClientRect();
        return { below: p.top >= c.bottom - 4, onscreen: p.bottom <= innerHeight && p.right <= innerWidth && p.left >= 0,
                 fixed: getComputedStyle(document.querySelector('.ocellpop')).position }; }""") or {}
    ck("…under the cell and wholly on screen, not clipped by the table's box",
       geo.get("below") and geo.get("onscreen") and geo.get("fixed") == "fixed", geo)
    who = ev(pg, """()=>{ const r=[...document.querySelectorAll('.ocellpop .pickrow')]
        .filter(x=>!x.closest('[hidden]'))[1]; r.click(); return r.querySelector('b').textContent; }""")
    pg.wait_for_timeout(350)
    ck("picking somebody makes them the head", ev(pg, "(k)=>personName((UNIT_ROLES[k]||{}).head)", K) == who,
       [who, ev(pg, "(k)=>personName((UNIT_ROLES[k]||{}).head)", K)])
    ck("…and shuts the cell", ev(pg, "()=>!document.querySelector('td.ocellopen') && PICKING===null") is True)
    head0 = ev(pg, "(k)=>(UNIT_ROLES[k]||{}).head", K)
    dbl(pg, "units|%s|head" % K)
    ev(pg, "()=>document.querySelector('td.ocellopen .ocellbtn').click()")
    pg.wait_for_timeout(300)
    ck("pressing the name again cancels: nothing written, the cell shut",
       ev(pg, "(k)=>(UNIT_ROLES[k]||{}).head", K) == head0 and
       ev(pg, "()=>!document.querySelector('td.ocellopen') && PICKING===null") is True)
    dbl(pg, "units|%s|custodian" % K)
    pg.mouse.click(700, 120); pg.wait_for_timeout(350)
    ck("a press elsewhere lets go of an open list", ev(pg, "()=>!document.querySelector('td.ocellopen') && PICKING===null") is True)

    print("\n1c · nothing opens while arranging, nor for a viewer who may not edit")
    ev(pg, "()=>{ const b=document.querySelector('[data-arrange=\"units\"], [data-setarrange=\"units\"]'); if (b) b.click(); }")
    pg.wait_for_timeout(300)
    arr = ev(pg, "()=>setArrangeOn('units')")
    if arr:
        ck("arranging: no cell is offered", ev(pg, "()=>document.querySelectorAll('[data-ocell]').length") == 0)
        ev(pg, "()=>{ const b=document.querySelector('[data-arrange=\"units\"], [data-setarrange=\"units\"]'); if (b) b.click(); }")
        pg.wait_for_timeout(300)
    else:
        errs.append("PROBE: could not start arranging")
    ev(pg, "()=>{ VIEWER='ceo'; paint(); }"); pg.wait_for_timeout(300)
    ck("the CEO, who may not edit this page, is offered no cell",
       ev(pg, "()=>document.querySelectorAll('[data-ocell]').length") == 0 and
       ev(pg, "()=>grant('c_units')") != "edit", ev(pg, "()=>grant('c_units')"))
    ev(pg, "()=>{ VIEWER=null; paint(); }"); pg.wait_for_timeout(200)

    print("\n2 · Functions")
    F = ev(pg, "()=>FUNCTION_KEYS.filter(k=>FUNCTIONS[k].active!==false)[0]")
    go(pg, "fns")
    dbl(pg, "fns|%s|name" % F)
    pg.keyboard.press("Control+A"); pg.keyboard.type("Finance & Treasury"); pg.keyboard.press("Enter")
    pg.wait_for_timeout(300)
    ck("a function's name writes", ev(pg, "(k)=>FUNCTIONS[k].name", F) == "Finance & Treasury")
    dbl(pg, "fns|%s|code" % F)
    pg.keyboard.press("Control+A"); pg.keyboard.type("FT"); pg.keyboard.press("Enter")
    pg.wait_for_timeout(300)
    ck("…its code too", ev(pg, "(k)=>FUNCTIONS[k].codePrefix", F) == "FT")
    dbl(pg, "fns|%s|plans" % F)
    o = ev(pg, OPEN) or {}
    ck("how it plans opens as the dialog's own list", "data-fnformat" in (o.get("attrs") or []), o)
    pg.keyboard.press("Escape"); pg.wait_for_timeout(250)
    dbl(pg, "fns|%s|division" % F)
    o = ev(pg, OPEN) or {}
    ck("where it belongs opens as the dialog's own list", "data-fnco" in (o.get("attrs") or []), o)
    pg.keyboard.press("Escape"); pg.wait_for_timeout(250)
    dbl(pg, "fns|%s|head" % F)
    ck("its head opens the person list", (ev(pg, OPEN) or {}).get("pop") is True)
    ev(pg, "()=>document.querySelector('td.ocellopen .ocellbtn').click()"); pg.wait_for_timeout(250)

    print("\n3 · Divisions")
    C = ev(pg, "()=>COMPANY_KEYS[0]")
    go(pg, "companies")
    ck("the search box says divisions",
       "divisions" in (ev(pg, "()=>(document.querySelector('[data-tksearch=\"companies\"]')||{}).placeholder||''") or "").lower(),
       ev(pg, "()=>(document.querySelector('[data-tksearch=\"companies\"]')||{}).placeholder"))
    dbl(pg, "companies|%s|name" % C)
    pg.keyboard.press("Control+A"); pg.keyboard.type("Distribution Co"); pg.keyboard.press("Enter")
    pg.wait_for_timeout(300)
    ck("a division's name writes", ev(pg, "(k)=>COMPANIES[k].name", C) == "Distribution Co")
    was = ev(pg, "(k)=>!!COMPANIES[k].seeGroup", C)
    dbl(pg, "companies|%s|seeGroup" % C)
    ev(pg, """(v)=>{ const s=document.querySelector('td.ocellopen select'); s.value=v;
                     s.dispatchEvent(new Event('change',{bubbles:true})); }""", "no" if was else "yes")
    pg.wait_for_timeout(300)
    ck("what its CEO sees writes", ev(pg, "(k)=>!!COMPANIES[k].seeGroup", C) == (not was))
    pg.close()

    print("\n4 · Capabilities on El Abd's shape: the company plan's own pillars, as a table")
    pg = fresh(b)
    ev(pg, LOAD, el_abd())
    ck("El Abd's five capabilities move onto the company", ev(pg, "()=>capFoldIntoTop()") == 5)
    go(pg, "caps")
    rows = ev(pg, """()=>[...document.querySelectorAll('table[data-tktable="caps"] tbody tr')]
        .map(r=>[...r.cells].slice(1,4).map(c=>c.innerText.trim()))""") or []
    ck("the page is a table of the five", len(rows) == 5, rows)
    ck("…each with its C code", [r[0] for r in rows] == ["C001", "C002", "C003", "C004", "C005"], rows)
    ck("…its name", rows[1][1] == CAPS[1] if len(rows) > 1 else False, rows)
    owner = ev(pg, "()=>{ const p=GROUP.items.filter(x=>SMPRules.pillarIsCap(x)&&x.owner)[0]; return p&&p.owner; }")
    ck("…and its owner as the plan holds it", any(r[2] == owner for r in rows) if owner else False, [owner, rows])
    ck("the old read-only note is gone", ev(pg, "()=>!document.querySelector('.capsmoved')") is True)
    pid = ev(pg, "()=>GROUP.items.filter(x=>SMPRules.pillarIsCap(x))[1].id")
    dbl(pg, "caps|%s|name" % pid)
    pg.keyboard.press("Control+A"); pg.keyboard.type("ERP Upgrade"); pg.keyboard.press("Enter")
    pg.wait_for_timeout(300)
    ck("a name typed here is what the company plan's pillar holds",
       ev(pg, "(i)=>GROUP.items.filter(x=>x.id===i)[0].name", pid) == "ERP Upgrade")
    pick = ev(pg, "()=>PEOPLE.filter(p=>p.name && p.active!==false)[3].name")
    dbl(pg, "caps|%s|owner" % pid)
    ev(pg, """(v)=>{ const s=document.querySelector('td.ocellopen select'); s.value=v;
                     s.dispatchEvent(new Event('change',{bubbles:true})); }""", pick)
    pg.wait_for_timeout(350)
    ck("an owner chosen here is the pillar's owner, by name", ev(pg, "(i)=>GROUP.items.filter(x=>x.id===i)[0].owner", pid) == pick,
       [pick, ev(pg, "(i)=>GROUP.items.filter(x=>x.id===i)[0].owner", pid)])
    try:
        pg.click("#addcappillar", timeout=3000)
    except Exception:
        errs.append("PROBE: no Add")
    pg.wait_for_timeout(400)
    new = ev(pg, """()=>{ const n=GROUP.items[GROUP.items.length-1];
        return { cap: SMPRules.pillarIsCap(n), code: pillarCode(topAsUnit(), GROUP.items.length-1),
                 focus: document.activeElement && document.activeElement.dataset.cpname === n.id }; }""") or {}
    ck("Add makes the next capability in the company plan, C006", new.get("cap") and new.get("code") == "C006", new)
    ck("…with its name open and the cursor in it", new.get("focus") is True, new)
    pg.keyboard.type("Data Culture"); pg.keyboard.press("Enter"); pg.wait_for_timeout(300)
    ck("…and the name typed is kept", ev(pg, "()=>GROUP.items[GROUP.items.length-1].name") == "Data Culture")
    ev(pg, "(i)=>document.querySelector('[data-cpmenu=\"'+i+'\"]').click()", pid); pg.wait_for_timeout(250)
    ev(pg, "(i)=>document.querySelector('[data-cpopen=\"'+i+'\"]').click()", pid); pg.wait_for_timeout(600)
    at = ev(pg, """(i)=>({ d: current, s: currentSub, sec: curSec(),
        rail: RAIL[pillarRailKey(topAsUnit(), GROUP.items.filter(x=>x.id===i)[0])] === i,
        shown: (document.getElementById('panel')||document.body).innerText.indexOf('ERP Upgrade') > -1 })""", pid) or {}
    ck("Open in the plan lands on the company's Capabilities tab", at.get("d") == "group" and at.get("sec") == "plancap", at)
    ck("…with that row picked, under the name given here", at.get("rail") and at.get("shown"), at)
    # THE SECOND DOOR, MADE (§255): only the strategy office reaches Setup in
    # the worked example, and it also authors the company plan — so somebody
    # who may edit this page but NOT the company plan is made by answering
    # that one question no, and put back after (§94.2).
    ev(pg, """()=>{ window.__ma = mayAuthor;
        window.mayAuthor = function(a, t){ return (a === 'u_plan' && t === 'group') ? false : window.__ma(a, t); };
        current='setup'; currentSub='caps'; paint(); }""")
    pg.wait_for_timeout(300)
    ck("somebody who may not change the company plan gets neither cells nor Add",
       ev(pg, "()=>grant('c_caps')==='edit' && document.querySelectorAll('[data-ocell]').length===0 && !document.getElementById('addcappillar')") is True)
    ck("…and still reads the table", (ev(pg, "()=>document.querySelectorAll('table[data-tktable=\"caps\"] tbody tr').length") or 0) == 6)
    ev(pg, "()=>{ window.mayAuthor = window.__ma; paint(); }")
    b.close()

ck("no page errors", not [e for e in errs if not e.startswith("PROBE")], errs[:3])
ck("every probe answered (§215)", not [e for e in errs if e.startswith("PROBE")], errs[:3])
print("\n%d failure%s" % (bad, "" if bad == 1 else "s"))
print("org-cells: " + ("all assertions passed" if not bad else "RED"))
raise SystemExit(1 if bad else 0)
