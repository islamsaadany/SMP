"""
A capability planned in pillars can be EDITED like a unit's plan (§411).

Islam: "the smo team is not able to set the quarters for the tactics." The
screen drew the four quarter buttons and pressing one did nothing, for anybody:
the press finds its tactic through listById(), which walked business units and
supporting functions and never a capability planned in pillars (§334). The same
walk sits behind removing a tactic or a measure, removing a breakdown row, and
the hide eye (§233), so all of them were dead on that page too.

It MAKES the state (§255): the demo's one capability plans in projects, so it is
switched to pillars and given a copy of a real pillar with ids of its own. Every
control is PRESSED through the navigation and the pen, and the stored plan is
read back (§96) - a control that renders and writes nothing looks identical to
one that works. A unit's plan is asserted to still work beside it (§94.2).

SMP_BUILT points it at another build (§334.13). Run through qa-run.py.
"""
import os, sys
from playwright.sync_api import sync_playwright

HERE = os.path.dirname(os.path.abspath(__file__))
BUILT = os.environ.get("SMP_BUILT") or os.path.join(HERE, "..", "strategy-management-platform.html")
URL = "file://" + os.path.abspath(BUILT)
bad = 0

def ck(ok, what, detail=""):
    global bad
    if not ok: bad += 1
    print(("  ok    " if ok else "  FAIL  ") + what + ("" if ok else "  -> " + repr(detail)))

def js(pg, expr, arg=None):
    try: return pg.evaluate(expr, arg)
    except Exception as e: return {"__error": str(e)[:200]}

def press(pg, sel):
    el = pg.query_selector(sel)
    if not el: return False
    try: el.click(timeout=3000); pg.wait_for_timeout(200); return True
    except Exception: return False

MAKE = """()=>{
  var c = GROUP.capabilities[0]; c.format = 'pillars'; c.projects = [];
  var it = JSON.parse(JSON.stringify(UNITS.mobile.items[0]));
  it.id = c.id + '-P1';
  it.tactics.forEach(function(t,i){ t.id = c.id + '-P1-T' + (i+1); delete t.hide; });
  it.measures.forEach(function(m,i){ m.id = c.id + '-P1-M' + (i+1); delete m.hide; });
  c.items = [it]; paint(); return c.id; }"""

ROW = """(a)=>{ var c = GROUP.capabilities.filter(function(x){ return x.id===a[0]; })[0];
  var it = c.items[0]; var l = it[a[1]] || [];
  var r = l.filter(function(x){ return x.id===a[2]; })[0];
  return { n: l.length, row: r ? { q1:!!r.q1, q2:!!r.q2, q3:!!r.q3, q4:!!r.q4, hide:!!r.hide } : null }; }"""

def open_plan(pg, target):
    press(pg, '[data-fold="%s"]' % ("caps" if target.startswith("cap:") else "units"))
    press(pg, '[data-u="%s"]' % target)
    js(pg, """()=>{ var b=[...document.querySelectorAll('[data-sub2]')]
      .filter(function(e){ return /^(Plan|Pillars)$/.test(e.textContent.trim()); })[0];
      b && b.click(); }""")
    pg.wait_for_timeout(250)
    pen = pg.query_selector(".secpen")
    if pen and pen.inner_text().strip() == "Edit":
        pen.click(); pg.wait_for_timeout(300)

with sync_playwright() as p:
    b = p.chromium.launch(executable_path=os.environ.get("SMP_CHROME") or None)
    pg = b.new_page(viewport={"width": 1600, "height": 1000})
    pg.add_init_script("try{sessionStorage.setItem('smp.welcome.done','1');"
                       "localStorage.setItem('smp.tour.never','1')}catch(e){}")
    errs = []; pg.on("pageerror", lambda e: errs.append(str(e)))
    pg.goto(URL); pg.wait_for_timeout(1200)

    print("\n1. the capability is on the screen and in edit mode")
    cid = js(pg, MAKE)
    open_plan(pg, "cap:" + str(cid))
    where = js(pg, "()=>[current, mayEditPlan()]")
    ck(where == ["cap:" + str(cid), True], "the office is on the capability with the pen", where)
    tid = "%s-P1-T1" % cid
    q = pg.query_selector('[data-qtog^="%s|"]' % tid)
    ck(q is not None, "its tactic draws the quarter buttons")

    print("\n2. a quarter pressed reaches the stored plan")
    before = js(pg, ROW, [cid, "tactics", tid])
    btn = '[data-qtog="%s|1"]' % tid
    ok = press(pg, btn)
    after = js(pg, ROW, [cid, "tactics", tid])
    ck(ok and isinstance(before, dict) and isinstance(after, dict) and before.get("row") and after.get("row")
       and after["row"]["q1"] != before["row"]["q1"],
       "Q1 changed on the tactic", [before, after])
    press(pg, btn)
    back = js(pg, ROW, [cid, "tactics", tid])
    ck(isinstance(back, dict) and back.get("row") and before.get("row")
       and back["row"]["q1"] == before["row"]["q1"], "pressed again, it goes back", back)

    print("\n3. the hide eye reaches the stored plan")
    eye = pg.query_selector('[data-hiderow="%s"]' % tid)
    ck(eye is not None, "the tactic draws its hide control")
    if eye:
        eye.click(); pg.wait_for_timeout(250)
        h = js(pg, ROW, [cid, "tactics", tid])
        ck(isinstance(h, dict) and h.get("row") and h["row"]["hide"], "the tactic is marked hidden", h)

    print("\n4. removing a tactic reaches the stored plan")
    n0 = js(pg, ROW, [cid, "tactics", tid])
    t2 = "%s-P1-T2" % cid
    ok = press(pg, '[data-rowoff="tactics|%s"]' % t2)
    n1 = js(pg, ROW, [cid, "tactics", t2])
    ck(ok and isinstance(n0, dict) and isinstance(n1, dict) and n1["n"] == n0["n"] - 1 and n1["row"] is None,
       "the tactic is gone from the capability's pillar", [ok, n0, n1])

    print("\n5. a unit's plan still works (the control case)")
    open_plan(pg, "mobile")
    ck(js(pg, "()=>current") == "mobile", "the check reached Mobile")
    u0 = js(pg, "()=>!!UNITS.mobile.items[0].tactics[0].q1")
    press(pg, '[data-qtog="%s|1"]' % js(pg, "()=>UNITS.mobile.items[0].tactics[0].id"))
    u1 = js(pg, "()=>!!UNITS.mobile.items[0].tactics[0].q1")
    ck(u0 != u1, "Mobile's Q1 still toggles", [u0, u1])

    ck(not errs, "no page errors", errs[:3])
    b.close()

print("\n" + ("capability-pillar-edit: %d FAILED" % bad if bad else "capability-pillar-edit: all good"))
sys.exit(1 if bad else 0)
