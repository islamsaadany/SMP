"""A plan in the client does not freeze one row's settings (§436).

Islam, on the set-up flow of a client holding a plan: *"it belongs to
commercial division but I can't change that"*, *"for the capability I can't
set where they are assigned"*, and *"if I change how we plan ... it needs to
be changable with a warning that things will be archived and will start
fresh with a way to bring it back"*.

The freeze (§346.5) stops the LIST being rewritten — adding, removing,
renaming — because that re-mints every row. Which division a row belongs to,
which function carries a capability and how a row plans are properties of
ONE row, written straight into it. Asserted at BOTH ENDS (§94.2): the list is
still frozen (no Add, names read-only) beside every control that now writes.
Every press is read back off the stored graph (§96). The worked example holds
a plan, so the frozen state is the one it opens in (no state to make, and
that is asserted rather than assumed).

Also: a function's first section offers a Description and no key objectives,
and a capability's first section offers the description and the North Star.
"""
import os, pathlib
from playwright.sync_api import sync_playwright

URL = "file://" + str(pathlib.Path(os.environ.get("SMP_BUILT") or pathlib.Path(
    pathlib.Path(__file__).resolve().parent.parent,
    "strategy-management-platform.html")).resolve())
CHROME = os.environ.get("SMP_CHROME") or None
fails, errs = [], []

def ck(name, ok, extra=""):
    print(("  ok   " if ok else "  FAIL ") + name + ((" — " + str(extra)) if not ok and extra != "" else ""))
    if not ok: fails.append(name)

def ev(pg, js, d=None):
    try: return pg.evaluate(js)
    except Exception as e:
        errs.append("PROBE: " + str(e)[:160]); return d

def press(pg, sel, wait=400):
    try:
        el = pg.query_selector(sel)
        if not el: return False
        el.click(); pg.wait_for_timeout(wait); return True
    except Exception as e:
        errs.append("PRESS %s: %s" % (sel, str(e)[:90])); return False

def pick(pg, sel, value, wait=500):
    """Set a select and fire its change — returns False if absent or disabled."""
    return ev(pg, """()=>{ var s=document.querySelector(%r); if(!s||s.disabled) return false;
      s.value=%r; s.dispatchEvent(new Event('change',{bubbles:true})); return true; }""" % (sel, value), False) \
        and (pg.wait_for_timeout(wait) or True)

def step(pg, k):
    return press(pg, ".csetup .wzstep[data-step=%s]" % k, 500)

with sync_playwright() as p:
    b = p.chromium.launch(executable_path=CHROME) if CHROME else p.chromium.launch()
    pg = b.new_page(viewport={"width": 1440, "height": 900})
    pg.on("pageerror", lambda e: errs.append("PAGEERROR: " + str(e)))
    pg.add_init_script("sessionStorage.setItem('smp.welcome.done','1'); localStorage.setItem('smp.tour.never','1');")
    pg.goto(URL); pg.wait_for_timeout(1000)
    ev(pg, "()=>{ current='setup'; currentSub='start'; paint(); }"); pg.wait_for_timeout(500)

    print("\n§0 · the state")
    ck("(fixture) the worked example holds a plan, so the shape is frozen",
       ev(pg, "()=>{var h=__smpHoldsNow(); return h.plans>0}", False), ev(pg, "()=>__smpHoldsNow()"))
    ck("(fixture) the set-up flow is on the page", ev(pg, "()=>!!document.querySelector('.csetup .wzrail')", False))
    cos = ev(pg, "()=>COMPANY_KEYS.map(k=>COMPANIES[k].name)", [])
    ck("(fixture) there are at least two divisions to move between", len(cos) >= 2, cos)

    print("\n§1 · a unit's division")
    step(pg, "units")
    ck("the list is still frozen: no Add, names read-only",
       ev(pg, "()=>!document.querySelector('.csetup .wzadd') && [...document.querySelectorAll('.csetup .wzrow input.fld')].every(i=>i.readOnly)", False))
    u0 = ev(pg, "()=>activeKeys()[0]")
    before = ev(pg, "()=>UNITS[%r].company||null" % u0)
    other = ev(pg, "()=>COMPANY_KEYS.filter(k=>k!==(UNITS[%r].company||''))[0]" % u0)
    oname = ev(pg, "()=>COMPANIES[%r].name" % other)
    ok = pick(pg, ".csetup select[data-wzdiv=unit]", oname)
    ck("the division select is live on a frozen client", ok)
    ck("…and writes the unit's company", ev(pg, "()=>UNITS[%r].company" % u0) == other, [before, ev(pg, "()=>UNITS[%r].company" % u0)])
    pick(pg, ".csetup select[data-wzdiv=unit]", "")
    ck("choosing no division clears it", ev(pg, "()=>UNITS[%r].company" % u0) in (None, ""))
    ev(pg, "()=>{UNITS[%r].company=%r}" % (u0, before))

    print("\n§2 · a function's division and how it plans")
    step(pg, "fns")
    # the first function row without a capability, and one with
    free = ev(pg, "()=>FUNCTION_KEYS.filter(k=>!capsOfFunction(k).length && FUNCTIONS[k].active!==false)[0]")
    held = ev(pg, "()=>FUNCTION_KEYS.filter(k=>capsOfFunction(k).length)[0]")
    ck("(fixture) a function with no capability, and one carrying one", bool(free) and bool(held), [free, held])
    ok = pick(pg, ".csetup select[data-wzdiv=fn]", oname)
    fk0 = ev(pg, "()=>document.querySelector('.csetup select[data-wzfmt]').dataset.wzfmt")
    ck("the function's division select writes its company",
       ok and ev(pg, "()=>FUNCTIONS[%r].company" % fk0) == other, ev(pg, "()=>FUNCTIONS[%r].company" % fk0))
    pick(pg, ".csetup select[data-wzdiv=fn]", "")
    ck("…and clears it, never leaving a stale share", ev(pg, "()=>!('company' in FUNCTIONS[%r]) && !('coWeight' in FUNCTIONS[%r])" % (fk0, fk0)), False)

    was = ev(pg, "()=>fnFormat(FUNCTIONS[%r])" % free)
    to = "pillars" if was != "pillars" else "projects"
    held_n = ev(pg, "()=>{var f=FUNCTIONS[%r]; return (f.projects||[]).length+(f.items||[]).length+(f.actions||[]).length}" % free)
    ok = pick(pg, ".csetup select[data-wzfmt=%s]" % free, to)
    ck("the function's plans-in select is live on a frozen client", ok)
    if held_n:
        ck("a function holding work is WARNED before it changes (the platform's own dialog)",
           ev(pg, "()=>!!document.querySelector('#modal-b [data-rmyes]')", False))
        ck("…and nothing changes until it is confirmed", ev(pg, "()=>fnFormat(FUNCTIONS[%r])" % free) == was)
        press(pg, "#modal-b [data-rmyes]", 600)
    ck("confirmed, the function plans the new way", ev(pg, "()=>fnFormat(FUNCTIONS[%r])" % free) == to)
    step(pg, "fns")
    ok = pick(pg, ".csetup select[data-wzfmt=%s]" % free, was)
    if held_n and ev(pg, "()=>!!document.querySelector('#modal-b [data-rmyes]')", False):
        press(pg, "#modal-b [data-rmyes]", 600)
    ck("switching back brings the old way back, with what it held",
       ev(pg, "()=>fnFormat(FUNCTIONS[%r])" % free) == was and
       ev(pg, "()=>{var f=FUNCTIONS[%r]; return (f.projects||[]).length+(f.items||[]).length+(f.actions||[]).length}" % free) == held_n)
    step(pg, "fns")
    hwas = ev(pg, "()=>fnFormat(FUNCTIONS[%r])" % held)
    pick(pg, ".csetup select[data-wzfmt=%s]" % held, "pillars" if hwas != "pillars" else "projects")
    ck("a function carrying a capability is refused, and the refusal is SAID",
       ev(pg, "()=>fnFormat(FUNCTIONS[%r])" % held) == hwas and
       "carries" in (ev(pg, "()=>(document.querySelector('.csetup [data-cssaid]')||{}).textContent||''", "") or ""))

    print("\n§3 · a capability's function and how it plans")
    step(pg, "caps")
    cid = ev(pg, "()=>(GROUP.capabilities||[])[0] && GROUP.capabilities[0].id")
    ck("(fixture) there is a capability", bool(cid))
    fnames = ev(pg, "()=>FUNCTION_KEYS.map(k=>FUNCTIONS[k].name)", [])
    cfn = ev(pg, "()=>GROUP.capabilities[0].fn")
    target = [k for k in ev(pg, "()=>FUNCTION_KEYS", []) if k != cfn][0]
    tname = ev(pg, "()=>FUNCTIONS[%r].name" % target)
    ok = pick(pg, ".csetup .wzrow select[aria-label^='Which function carries']", tname)
    ck("the capability's carried-by select is live and writes its function",
       ok and ev(pg, "()=>GROUP.capabilities[0].fn") == target, ev(pg, "()=>GROUP.capabilities[0].fn"))
    pick(pg, ".csetup .wzrow select[aria-label^='Which function carries']", "")
    ck("…and it can be left unassigned", not ev(pg, "()=>GROUP.capabilities[0].fn"))
    ev(pg, "()=>{GROUP.capabilities[0].fn=%r; paint();}" % cfn); pg.wait_for_timeout(300)
    step(pg, "caps")
    cwas = ev(pg, "()=>GROUP.capabilities[0].format==='pillars'?'pillars':'projects'")
    cto = "pillars" if cwas != "pillars" else "projects"
    ok = pick(pg, ".csetup .wzrow select[aria-label^='How ']", cto)
    ck("the capability's plans-in select is live", ok)
    if ev(pg, "()=>!!document.querySelector('#modal-b [data-rmyes]')", False):
        ck("…holding work, it warns before changing", ev(pg, "()=>(GROUP.capabilities[0].format==='pillars'?'pillars':'projects')") == cwas)
        press(pg, "#modal-b [data-rmyes]", 600)
    ck("confirmed, the capability plans the new way",
       ev(pg, "()=>GROUP.capabilities[0].format==='pillars'?'pillars':'projects'") == cto)

    print("\n§4 · the first section")
    ck("a function's description is off until ticked", ev(pg, "()=>compOn('fn:%s','desc')" % free) is False)
    ck("a function never takes a unit's brief", ev(pg, "()=>compOn('fn:%s','brief')" % free) is False)
    ck("a unit never takes a function's description", ev(pg, "()=>compOn(%r,'desc')" % u0) is False)
    ck("the description is what a function's Overview reads",
       ev(pg, "()=>SMPRules.descPart('fn:x')==='desc' && SMPRules.descPart('mobile')==='brief'", False))

    print("\n§5 · a function's key objectives are a tick (§437)")
    ev(pg, "()=>{ current='setup'; currentSub='start'; paint(); }"); pg.wait_for_timeout(400)
    step(pg, "structure")
    tick = ev(pg, "()=>{var b=document.querySelector('.csetup [data-stcomp=\"fn|keyobj\"]'); return b ? b.getAttribute('aria-pressed') : null}")
    ck("the functions' first section offers a Key objectives tick, on by default", tick == "true", tick)
    # the rule, both ends: on by default, off stops counting, a unit untouched
    pf = ev(pg, "()=>FUNCTION_KEYS.filter(k=>fnOwnsProjects(k) && (FUNCTIONS[k].keyObjectives||[]).some(m=>measureScore(m)!=null))[0]")
    ck("(fixture) a projects function with scored objectives", bool(pf), pf)
    on0 = ev(pg, "()=>({ko:fnKoCounted('fn:%s'), asked:fnReportItems('%s').filter(x=>x.kind==='objective').length, perf:fnMemberScores('%s').perf, ko2:capKOScore(fnHolders('%s')[0])})" % (pf, pf, pf, pf), {})
    ck("on by default: counted, asked and scored", on0.get("ko") is True and on0.get("asked", 0) > 0 and on0.get("perf") == on0.get("ko2"), on0)
    ev(pg, "()=>{ var s=GROUP.structure=GROUP.structure||{}; s.over=s.over||{}; s.over['fn:%s']={keyobj:false}; }" % pf)
    off = ev(pg, "()=>({ko:fnKoCounted('fn:%s'), asked:fnReportItems('%s').filter(x=>x.kind==='objective').length, perf:fnMemberScores('%s').perf, cap:capPerf(fnHolders('%s')[0])})" % (pf, pf, pf, pf), {})
    ck("off: not asked, and the headline is the projects' own figure",
       off.get("ko") is False and off.get("asked") == 0 and off.get("perf") == off.get("cap"), off)
    ck("off: the objectives are still stored", ev(pg, "()=>(FUNCTIONS[%r].keyObjectives||[]).length" % pf, 0) > 0)
    ck("a unit is never reached", ev(pg, "()=>fnKoCounted(%r)" % u0) is True)
    ev(pg, "()=>{ delete GROUP.structure.over['fn:%s']; }" % pf)
    ck("ticked back: counted again", ev(pg, "()=>fnKoCounted('fn:%s')" % pf) is True)

    print("\n§6 · a business unit says how it plans (§438)")
    ev(pg, "()=>{ current='setup'; currentSub='start'; paint(); }"); pg.wait_for_timeout(400)
    step(pg, "units")
    nsel = ev(pg, "()=>document.querySelectorAll('.csetup select[data-wzfmt]').length", 0)
    ck("every unit row carries a plans-in select", nsel == ev(pg, "()=>UNIT_KEYS.length", -1), [nsel])
    shown = ev(pg, "()=>document.querySelector('.csetup select[data-wzfmt=%s]').value" % u0)
    ck("…reading the way the unit plans today", shown == ev(pg, "()=>unitFormat(UNITS[%r])" % u0), shown)
    uwas = ev(pg, "()=>unitFormat(UNITS[%r])" % u0)
    un = ev(pg, "()=>(UNITS[%r].items||[]).length" % u0, 0)
    ck("(fixture) the unit plans in pillars and holds some", uwas == "pillars" and un > 0, [uwas, un])
    ok = pick(pg, ".csetup select[data-wzfmt=%s]" % u0, "projects")
    ck("the unit's plans-in select is live on a frozen client", ok)
    ck("a unit holding pillars is WARNED first, and nothing changes yet",
       ev(pg, "()=>!!document.querySelector('#modal-b [data-rmyes]')", False) and
       ev(pg, "()=>unitFormat(UNITS[%r])" % u0) == "pillars")
    press(pg, "#modal-b [data-rmyes]", 600)
    ck("confirmed, the unit plans in projects", ev(pg, "()=>UNITS[%r].format" % u0) == "projects")
    step(pg, "units")
    pick(pg, ".csetup select[data-wzfmt=%s]" % u0, "pillars")
    if ev(pg, "()=>!!document.querySelector('#modal-b [data-rmyes]')", False):
        press(pg, "#modal-b [data-rmyes]", 600)
    ck("switching back brings the pillars back, and pillars is stored as an absence",
       ev(pg, "()=>!('format' in UNITS[%r])" % u0) and ev(pg, "()=>(UNITS[%r].items||[]).length" % u0) == un)
    ck("no page errors", not errs, errs[:4])
    b.close()

print("\n%d FAILED" % len(fails) if fails else "\nsetup-live-rows: all good")
