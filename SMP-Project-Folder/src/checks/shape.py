"""The shape, on one screen: a layer per kind, and a chosen navigation (§544).

Spec 066 stage 4, from the signed-off mockup
(design-mockups/setup-one-screen/2026-10-18_the-shape-interactive.html).
Islam: *"no not 1 list the business units has it's own layer above and the
functions has their own layer above"*, *"the main layer is the bottom layer…
creating another layer in between these layers and the company should be the
thing that is the exception, or the creation"*, and of the navigation:
*"this should be a choice what are the navigation switch… so it needs to be
chosen somehow not derived"*.

WHAT THIS ASSERTS, AND WHY EACH ONE IS HERE. The three steps, the tree's
rows, the ticks' opening state and a box's own answers are client-setup.py's
(§53.5 — one claim, one check); this one is the shape's own behaviour:

· A LAYER IS CREATED BY THE KIND THAT NEEDS ONE, and removed the same way,
  and removing it keeps every division and every assignment (§405: hidden,
  never cleared) — asserted by grouping again and finding them back.

· TWO LAYERS AT ONCE, each with its own name, because that is the case one
  shared word cannot serve (§544's layerWords). Both ends: with one layer
  the client's own word is what the row reads.

· THE TREE SHOWS ONE DIVISION'S BOXES AT A TIME, and says how many — the
  thing Islam asked for in those words: *"it should be the number beside
  functions 22 and between two brackets (5 under commercial)"*.

· THE BOXES WITH NO DIVISION ARE FLAGGED, not hidden, and giving one a
  division takes it off the flag.

· AND THE TICK REACHES THE REAL NAVIGATION: the rail the viewer sees is
  read before and after, so a tick that stored an answer nothing draws
  would fail (§42).

THE STATE IS MADE (§255): the plan is cleared out of a copy so the shape is
open, exactly as client-setup.py does. Every probe degrades (§215).

PROVED ABLE TO FAIL (§113.8), from the sources, with what was counted:
  · removing a layer clearing its boxes' divisions   → 1 red
  · the tree drawing every box, not the chosen one's → 3 red
  · a layer's own name written client-wide instead   → 1 red
  · the catch-all side added while the kind's row is ticked too → 1 red

Run: python3 SMP-Project-Folder/src/checks/shape.py
     SMP_BUILT=<another build> …   # prove it can fail, from the sources (§276)
"""
import os, pathlib, sys
from playwright.sync_api import sync_playwright

URL = "file://" + str(pathlib.Path(os.environ.get("SMP_BUILT") or pathlib.Path(
    pathlib.Path(__file__).resolve().parent.parent, "strategy-management-platform.html")).resolve())
CHROME = os.environ.get("SMP_CHROME") or None
fails, errs = [], []


def ck(name, ok, extra=""):
    print(("  ok   " if ok else "  FAIL ") + name + ((" — " + str(extra)) if extra != "" and not ok else ""))
    if not ok: fails.append(name)


def ev(pg, js, d=None):
    try: return pg.evaluate(js)
    except Exception as e:
        errs.append("PROBE: " + str(e)[:150]); return d


def press(pg, sel, wait=350):
    try:
        el = pg.query_selector(sel)
        if not el: return False
        el.click(); pg.wait_for_timeout(wait); return True
    except Exception as e:
        errs.append("PRESS %s: %s" % (sel, str(e)[:80])); return False


def lvls(pg):
    return ev(pg, "()=>[...document.querySelectorAll('.csetup [data-shlvl]')].map(b=>b.dataset.shlvl)", [])


def count(pg, lvl):
    return ev(pg, '()=>{var n=document.querySelector(\'.csetup [data-shcount="%s"]\'); return n?Number(n.textContent):-1}' % lvl, -1)


def shown(pg, kind):
    return ev(pg, '()=>[...document.querySelectorAll(\'.csetup [data-shrow="%s"] [data-shbox]\')].map(b=>b.textContent.replace(/\\d+$/,""))' % kind, [])


BARE = """()=>{ var g=JSON.parse(JSON.stringify(SYNC.graph()));
  g.unitKeys.forEach(k=>{g.units[k].items=[];g.units[k].keyObjectives=[];g.units[k].swot={s:[],w:[],o:[],t:[]};});
  g.functionKeys.forEach(k=>{g.functions[k].items=[];g.functions[k].keyObjectives=[];});
  (g.group.capabilities||[]).forEach(c=>{c.keyObjectives=[];c.projects=[];c.items=[];});
  SYNC.hydrate(g); current='setup'; currentSub='start'; paint(); return __smpHoldsNow(); }"""

with sync_playwright() as p:
    b = p.chromium.launch(executable_path=CHROME) if CHROME else p.chromium.launch()
    pg = b.new_page(viewport={"width": 1500, "height": 950})
    pg.on("pageerror", lambda e: errs.append("PAGEERROR: " + str(e)))
    pg.add_init_script("sessionStorage.setItem('smp.welcome.done','1'); localStorage.setItem('smp.tour.never','1');")
    pg.goto(URL); pg.wait_for_timeout(900)
    pg.select_option("#asWho", "smo"); pg.wait_for_timeout(300)

    print("\n0 · the state is made")
    holds = ev(pg, BARE, {})
    ck("(fixture) the shape is open — no plan line anywhere", isinstance(holds, dict) and holds.get("plans") == 0, holds)
    ck("the shape step opens", press(pg, ".csetup .wzstep[data-step=shape]", 500) and bool(pg.query_selector(".csetup .shtree")))
    ck("(fixture) the worked example is Raya's shape: a layer above the units, none above the functions",
       lvls(pg) == ["top", "bu@g", "bu", "fn"], lvls(pg))
    ck("the top box carries the client's own name",
       ev(pg, "()=>{var b=document.querySelector('.csetup [data-shbox=top]'); return b?b.textContent.trim():null}") ==
       ev(pg, "()=>String(GROUP.org||'').trim()"),
       ev(pg, "()=>{var b=document.querySelector('.csetup [data-shbox=top]'); return b&&b.textContent}"))

    print("\n1 · one division's boxes at a time, and the count says both")
    first = ev(pg, "()=>COMPANIES[COMPANY_KEYS[0]].name", "")
    second = ev(pg, "()=>COMPANIES[COMPANY_KEYS[1]].name", "")
    n_units = ev(pg, "()=>UNIT_KEYS.length", -1)
    ck("the units' row counts every unit, not the ones on screen",
       count(pg, "bu") == n_units, [count(pg, "bu"), n_units])
    inFirst = ev(pg, "()=>UNIT_KEYS.filter(k=>UNITS[k].company===COMPANY_KEYS[0]).map(k=>UNITS[k].name)", [])
    ck("…and the boxes drawn are the first division's", sorted(shown(pg, "bu")) == sorted(inFirst), [shown(pg, "bu"), inFirst])
    ck("…said beside the count, in words — (N under <division>)",
       ev(pg, "()=>{var r=[...document.querySelectorAll('.csetup .shlvl')].filter(x=>x.querySelector('[data-shlvl=bu]'))[0]; return r?r.textContent:''}", "")
       .find("(%d under %s)" % (len(inFirst), first)) >= 0,
       ev(pg, "()=>{var r=[...document.querySelectorAll('.csetup .shlvl')].filter(x=>x.querySelector('[data-shlvl=bu]'))[0]; return r&&r.textContent}"))
    press(pg, ".csetup [data-shbox='co:1']", 400)
    inSecond = ev(pg, "()=>UNIT_KEYS.filter(k=>UNITS[k].company===COMPANY_KEYS[1]).map(k=>UNITS[k].name)", [])
    ck("pressing the second division shows its boxes instead",
       sorted(shown(pg, "bu")) == sorted(inSecond) and sorted(inSecond) != sorted(inFirst), [shown(pg, "bu"), inSecond])
    ck("…and the count is still every unit", count(pg, "bu") == n_units)

    print("\n2 · the units with no division are flagged, never hidden")
    loose = ev(pg, "()=>UNIT_KEYS.filter(k=>!UNITS[k].company).map(k=>UNITS[k].name)", [])
    ck("(fixture) this client has units in no division", len(loose) > 0, loose)
    flagged = ev(pg, "()=>[...document.querySelectorAll('.csetup .shneeds [data-shbox]')].map(b=>b.textContent.trim())", [])
    ck("every one of them is in the needs-a-division block", sorted(flagged) == sorted(loose), [flagged, loose])
    ck("…under a heading that counts them and names the layer",
       ev(pg, "()=>{var h=document.querySelector('.csetup .shneedh'); return h?h.textContent:''}", "")
       .startswith("%d need a " % len(loose)),
       ev(pg, "()=>{var h=document.querySelector('.csetup .shneedh'); return h&&h.textContent}"))
    one = ev(pg, "()=>UNIT_KEYS.filter(k=>!UNITS[k].company)[0]")
    at = ev(pg, "()=>{var k=%r; for(var i=0;i<UNIT_KEYS.length;i++) if(UNIT_KEYS[i]===k) return i; return -1}" % one, -1)
    press(pg, ".csetup [data-shbox='bu:%d']" % at, 350)
    try:
        pg.select_option(".csetup [data-wzdiv=unit]", first); pg.wait_for_timeout(300)
    except Exception as e:
        errs.append("SELECT: " + str(e)[:80])
    ck("giving one a division takes it off the flag",
       len(ev(pg, "()=>[...document.querySelectorAll('.csetup .shneeds [data-shbox]')]", [])) == len(loose) - 1,
       ev(pg, "()=>[...document.querySelectorAll('.csetup .shneeds [data-shbox]')].map(b=>b.textContent)"))

    print("\n3 · a layer is created by the kind that needs one, and removing it keeps everything")
    ck("the functions' row offers to group them, the units' does not (it has one)",
       bool(pg.query_selector(".csetup [data-shgroup=fn]")) and pg.query_selector(".csetup [data-shgroup=bu]") is None)
    ck("grouping the functions gives them a layer of their own",
       press(pg, ".csetup [data-shgroup=fn]", 400) and lvls(pg) == ["top", "bu@g", "bu", "fn@g", "fn"], lvls(pg))
    ck("…stored as a real true on the functions' level",
       ev(pg, "()=>SMPRules.structureOf(GROUP).fn.layer", None) is True,
       ev(pg, "()=>JSON.stringify(SMPRules.structureOf(GROUP))"))
    ck("…and the units' layer is untouched",
       ev(pg, "()=>{var s=SMPRules.structureOf(GROUP)||{}; return !(s.bu && 'layer' in s.bu)}", False))
    cos_before = ev(pg, "()=>COMPANY_KEYS.map(k=>COMPANIES[k].name).join(',')", "")
    links_before = ev(pg, "()=>UNIT_KEYS.map(k=>UNITS[k].company||'').join(',')", "")
    ck("removing the units' layer takes the row away",
       press(pg, ".csetup [data-shungroup=bu]", 400) and lvls(pg) == ["top", "bu", "fn@g", "fn"], lvls(pg))
    ck("…and keeps every division and every unit's division (§405: hidden, never cleared)",
       ev(pg, "()=>COMPANY_KEYS.map(k=>COMPANIES[k].name).join(',')", "") == cos_before and
       ev(pg, "()=>UNIT_KEYS.map(k=>UNITS[k].company||'').join(',')", "") == links_before,
       [ev(pg, "()=>COMPANY_KEYS.map(k=>COMPANIES[k].name).join(',')"), cos_before])
    ck("…so grouping them again brings all of it back",
       press(pg, ".csetup [data-shgroup=bu]", 400) and lvls(pg) == ["top", "bu@g", "bu", "fn@g", "fn"] and
       ev(pg, "()=>UNIT_KEYS.map(k=>UNITS[k].company||'').join(',')", "") == links_before, lvls(pg))

    print("\n4 · two layers, each with its own name")
    ck("a layer's card offers its own name, one and many",
       press(pg, ".csetup [data-shlvl='fn@g']", 400) and
       all(pg.query_selector('.csetup [data-shlw="fn|%s"]' % f) for f in ("one", "many")))
    ck("…empty, it reads the client's own word for the second layer",
       ev(pg, "()=>{var i=document.querySelector('.csetup [data-shlw=\"fn|many\"]'); return [i.value, i.placeholder]}", [])
       == ["", ev(pg, "()=>labelWord('division','bu')")],
       ev(pg, "()=>{var i=document.querySelector('.csetup [data-shlw=\"fn|many\"]'); return [i.value, i.placeholder]}"))
    try:
        pg.fill('.csetup [data-shlw="fn|many"]', "Divisions"); pg.keyboard.press("Tab"); pg.wait_for_timeout(350)
        pg.fill('.csetup [data-shlw="fn|one"]', "Division"); pg.keyboard.press("Tab"); pg.wait_for_timeout(350)
    except Exception as e:
        errs.append("FILL: " + str(e)[:80])
    ck("a name typed there is stored on that kind's level",
       ev(pg, "()=>JSON.stringify(SMPRules.layerWords(GROUP,'fn'))") == '{"many":"Divisions","one":"Division"}',
       ev(pg, "()=>JSON.stringify(SMPRules.layerWords(GROUP,'fn'))"))
    ck("…and read on the functions' layer row, while the units' keeps the client's word",
       ev(pg, "()=>{var b=[...document.querySelectorAll('.csetup [data-shlvl]')]; return b.filter(x=>x.dataset.shlvl==='fn@g')[0].textContent}") == "Divisions" and
       ev(pg, "()=>{var b=[...document.querySelectorAll('.csetup [data-shlvl]')]; return b.filter(x=>x.dataset.shlvl==='bu@g')[0].textContent}") == ev(pg, "()=>labelWord('division','bu')"),
       [ev(pg, "()=>[...document.querySelectorAll('.csetup [data-shlvl]')].map(x=>x.textContent)")])
    ck("…and emptying it deletes the key rather than storing nothing (§50.6)",
       ev(pg, """()=>{var i=document.querySelector('.csetup [data-shlw="fn|many"]'); i.value=''; i.dispatchEvent(new Event('change',{bubbles:true}));
         var j=document.querySelector('.csetup [data-shlw="fn|one"]'); j.value=''; j.dispatchEvent(new Event('change',{bubbles:true}));
         return !SMPRules.layerWords(GROUP,'fn')}""", False))

    print("\n5 · the tick reaches the navigation the viewer sees")
    press(pg, ".csetup [data-shungroup=fn]", 400)
    sides0 = ev(pg, "()=>navSides().map(s=>s.label).join(',')", "")
    fnword = ev(pg, "()=>navWord('fnword','Functions')", "")
    ck("(before) the functions have a side of their own on the row",
       fnword and fnword in sides0.split(","), [sides0, fnword])
    want = ",".join([x for x in sides0.split(",") if x != fnword])
    ck("unticking the functions takes their side off the row",
       press(pg, ".csetup [data-shnav=fn]", 400) and
       ev(pg, "()=>navSides().map(s=>s.label).join(',')", "") == want,
       [ev(pg, "()=>navSides().map(s=>s.label).join(',')"), want])
    ck("…and the rail the viewer sees loses it too (§42: the setting is read)",
       ev(pg, """()=>{current='group';currentSub='performance';paint();
         var r=document.querySelector('#units'); return r ? r.textContent.indexOf(%s)<0 : null}"""
          % __import__("json").dumps(fnword), None) is True)
    ev(pg, "()=>{current='setup'; currentSub='start'; paint();}"); pg.wait_for_timeout(400)
    press(pg, ".csetup .wzstep[data-step=shape]", 400)
    ck("ticking it back brings the row back exactly as it was",
       press(pg, ".csetup [data-shnav=fn]", 400) and
       ev(pg, "()=>navSides().map(s=>s.label).join(',')", "") == sides0, ev(pg, "()=>navSides().map(s=>s.label).join(',')"))
    ck("…with nothing left stored (§50.6)",
       ev(pg, "()=>{var f=(SMPRules.structureOf(GROUP)||{}).fn||{}; return !('nav' in f)}", False))
    ck("ticking the units' divisions puts a side per division on the row",
       press(pg, ".csetup [data-shnav='bu@g']", 400) and
       ev(pg, "()=>navSides().filter(s=>String(s.fold).indexOf('div:')===0).length", 0) > 0,
       ev(pg, "()=>navSides().map(s=>s.fold).join(',')"))
    ck("…each holding the units of that division, and nothing else",
       ev(pg, """()=>navSides().filter(s=>String(s.fold).indexOf('div:')===0)
            .every(s=>s.keys.every(k=>UNITS[k] && UNITS[k].company===s.co))""", False))
    # §544.2: both rows ticked at once must not put two sides under one
    # fold key — the row could not say which of them is open.
    ck("with the units' row ticked too, no two sides share a fold key",
       ev(pg, "()=>{var f=navSides().map(s=>s.fold); return new Set(f).size===f.length}", False),
       ev(pg, "()=>navSides().map(s=>s.fold)"))
    ck("…and the units in no division are still reachable, on the kind's own side",
       ev(pg, """()=>{var loose=UNIT_KEYS.filter(k=>UNITS[k].active!==false && !UNITS[k].company);
         var all=[]; navSides().forEach(s=>{(s.keys||[]).forEach(k=>all.push(k))});
         return loose.every(k=>all.indexOf(k)>=0)}""", False))
    press(pg, ".csetup [data-shnav='bu@g']", 400)
    ck("…and unticking them leaves the row as it started",
       ev(pg, "()=>navSides().map(s=>s.label).join(',')", "") == sides0, ev(pg, "()=>navSides().map(s=>s.label).join(',')"))

    print("\n6 · both levels can plan at once (§544.4)")
    # Islam, of the where-planned question: *"there's no question that now
    # … you might even have both. What's the point of this choice now?"*
    # So: the either/or is gone, and the state it could not express — the
    # company planning AND the units planning — is reachable and real.
    ev(pg, "()=>{current='setup'; currentSub='start'; paint();}"); pg.wait_for_timeout(400)
    press(pg, ".csetup .wzstep[data-step=shape]", 400)
    press(pg, ".csetup [data-shlvl=top]", 350)
    ck("the top card asks no where-planned question",
       ev(pg, "()=>!document.querySelector('.csetup [data-stplan]')", False))
    ck("switching the company's own plan on", press(pg, '.csetup [data-stsec="top|plan"] button:nth-child(1)', 400))
    ck("…leaves the units planning too, both on at once",
       ev(pg, "()=>SMPRules.planOn(GROUP,'group') && buExists() && SMPRules.planOn(GROUP, UNIT_KEYS[0])", False),
       ev(pg, "()=>[SMPRules.planOn(GROUP,'group'), buExists(), SMPRules.planOn(GROUP, UNIT_KEYS[0])]"))
    ck("…and both are on the pages: the company's Strategy tab and the units' sides",
       ev(pg, """()=>{var g=allowed(SUBS.group,'group').map(d=>d.k);
         return g.indexOf('strategy')>=0 && navSides().some(s=>s.fold==='units')}""", False))
    ck("switching the units off leaves the company's plan exactly as it was",
       press(pg, ".csetup [data-shlvl=bu]", 350) and press(pg, '.csetup [data-stsec="bu|layer"] button:nth-child(2)', 400) and
       ev(pg, "()=>SMPRules.planOn(GROUP,'group')", False) is True)
    press(pg, ".csetup [data-shlvl=bu]", 350); press(pg, '.csetup [data-stsec="bu|layer"] button:nth-child(1)', 400)
    press(pg, ".csetup [data-shlvl=top]", 350); press(pg, '.csetup [data-stsec="top|plan"] button:nth-child(2)', 400)

    # §544.5: and the capabilities have nothing to do with the units.
    # Islam: *"switching units off is not relevant to the capabilities.
    # A capability is something that belongs to the company in general and
    # maybe a business unit if chosen to. What's the relation?"* None.
    where0 = ev(pg, "()=>[SMPRules.capAtTop(GROUP), navSides().some(s=>s.fold==='caps')]", [])
    ck("(fixture) the capabilities are a layer of their own, with a side",
       where0 == [False, True], where0)
    # §544.5, REWRITTEN TO THE RULE AS IT STANDS (§218). The first draft of
    # this asserted that switching the units off left the capabilities
    # untouched, full stop. That was my too-blunt reading of Islam's *"what's
    # the relation?"*, and `checks/direction-part.py` showed what it cost:
    # the line being cut is §465's own, *"planned at company level they are
    # always the company's"*, which he approved and which §520's whole shape
    # rests on. It is a DEFAULT now rather than an override, so BOTH halves
    # are asserted here — the half he objected to is the one the office can
    # now answer, and until it does, §465 still reads.
    ck("with nobody having said, switching the units off still carries them (§465's reading)",
       press(pg, ".csetup [data-shlvl=bu]", 350) and press(pg, '.csetup [data-stsec="bu|layer"] button:nth-child(2)', 450) and
       ev(pg, "()=>SMPRules.capAtTop(GROUP)", None) is True,
       ev(pg, "()=>[buExists(), SMPRules.capAtTop(GROUP), navSides().map(s=>s.fold)]"))
    ck("…but the office's own answer wins over it, which is what the units could not be told before",
       press(pg, ".csetup [data-shlvl=top]", 350) and press(pg, '.csetup [data-stsec="cap|top"] button:nth-child(2)', 450) and
       ev(pg, "()=>[SMPRules.capAtTop(GROUP), (SMPRules.structureOf(GROUP).cap||{}).at]", []) == [False, "layer"],
       ev(pg, "()=>[buExists(), SMPRules.capAtTop(GROUP), (SMPRules.structureOf(GROUP).cap||{}).at]"))
    ck("…and their side is back on the row with it", ev(pg, "()=>navSides().some(s=>s.fold==='caps')", None) is True)
    ck("…and the office's own switch for them is drawn, whatever the units do",
       press(pg, ".csetup [data-shlvl=top]", 350) and
       ev(pg, "()=>{var b=[...document.querySelectorAll('.csetup [data-stsec=\"cap|top\"] button')]; return b.length===2 && b.every(x=>!x.disabled)}", False))
    press(pg, ".csetup [data-shlvl=bu]", 350); press(pg, '.csetup [data-stsec="bu|layer"] button:nth-child(1)', 450)

    print("\n8 · the console")
    ck("no page errors", not errs, errs[:3])
    b.close()

print("\n%s" % ("all good" if not fails else "%d FAILED" % len(fails)))
sys.exit(1 if fails else 0)
