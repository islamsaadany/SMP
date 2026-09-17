"""Getting started — the client set-up flow, inside the platform's own Setup
(§360, spec 057).

Islam: "the client either we open a module or we go to the client settings
page where we find a rail with the client settings and I suggest having the
getting started with the client setup to stay at the top of the rail until
it's all fulfilled and then moves to the bottom and it absorbs the branding
part with the mark and the brand colors and remove the separate branding
setting" — and, of two drawings of which chrome draws that rail, "A": the
client platform's own Setup, one rail, one chrome.

WHAT THIS ASSERTS, AND WHY EACH ONE IS HERE.

· THE STATE IS MADE (§255, §94.2). The shape is frozen once a client holds a
  plan line, and the worked example holds hundreds — so every assertion
  about adding, removing and refusing would be unreachable on it. The plan
  is cleared out of a COPY of the graph and the platform rebound to it,
  exactly as the served client that has just been created stands.

· THE STRIP'S COUNT IS AGREEMENT, NEVER A LITERAL (§94.8): it is compared
  with `CLIENTSETUP.progress()`, the one reader the rail asks, and the total
  with the steps the flow draws — a "3 of 7" typed into this file would
  outlive the next step added.

· WHAT THE STORED GRAPH HOLDS, NOT WHAT THE STEP DRAWS (§96): a unit typed
  and Next pressed is read back off UNIT_KEYS and UNITS; a removal refused
  is read back as the row count AND the key list unchanged. A flow that
  draws the row and writes nothing renders perfectly.

· THE HEADS SURVIVE A PASS (§346): the unit in charge of Mobile before is
  the unit in charge of Mobile after, and the weighting rows are one per
  unit — asserted as agreement between two counts, or every pass appends a
  second row per unit and halves every weight.

· THE REFUSAL PUTS THE ROW BACK (§360.3): a removed headed unit is refused
  BY NAME, its row is on the step again, the graph is untouched, and the
  very next Next proceeds — a refusal that held the person on the step for
  ever was the first build's fault.

· BOTH ENDS OF DONE (§94.2): before, the strip and the Done button; after,
  neither, and the same def under its new name in the last group — found in
  `setupDefsAll()` AND in the rail's DOM, because a label resolved in one
  place and not the other is §53.5's drift.

· THE BRANDING IS ABSORBED, NOT LOST: the first step holds the colour and
  mark controls the Branding page held, they are WIRED (a colour set writes
  `branding()`), and the old def is asserted absent (§24).

· THE SHAPE FREEZES WITH A PLAN: a plan line put back takes the Add button
  away and the step says why, with the unfrozen state asserted first.

EVERY PROBE DEGRADES (§215): a press that finds nothing reports rather than
waiting thirty seconds and taking the count down with it.

Run: SMP_CHROME=... python3 qa-run.py checks/client-setup.py
     SMP_BUILT=<another build> …   # prove it can fail, from the SOURCES (§276)
"""
import json, os, pathlib, sys
from playwright.sync_api import sync_playwright

URL = "file://" + str(pathlib.Path(os.environ.get("SMP_BUILT") or pathlib.Path(
    pathlib.Path(__file__).resolve().parent.parent,
    "strategy-management-platform.html")).resolve())

fails, errs = [], []


def ck(name, ok, extra=""):
    print(("  ok   " if ok else "  FAIL ") + name + ((" — " + str(extra)) if extra and not ok else ""))
    if not ok:
        fails.append(name)


def ev(pg, js, default=None):
    """Every probe degrades rather than dying (§215)."""
    try:
        return pg.evaluate(js)
    except Exception as e:
        errs.append("PROBE: " + str(e)[:160])
        return default


def q(pg, sel):
    try:
        return pg.query_selector(sel)
    except Exception:
        return None


def press(pg, sel, wait=400):
    el = q(pg, sel)
    if not el:
        return False
    try:
        el.click(); pg.wait_for_timeout(wait); return True
    except Exception as e:
        errs.append("PRESS %s: %s" % (sel, str(e)[:90]))
        return False


def said(pg):
    n = q(pg, ".csetup [data-cssaid]")
    return (n.inner_text() if n else "") or ""


def at(pg):
    return ev(pg, "()=>CLIENTSETUP.at()")


def rows(pg):
    return ev(pg, "()=>document.querySelectorAll('.csetup .wzrow').length", -1)


# THE STATE IS MADE (§255): every plan line cleared out of a copy, the
# platform rebound to it through SYNC.hydrate (the flow's own road), and
# the page opened on Getting started.
BARE = """()=>{ var g=JSON.parse(JSON.stringify(SYNC.graph()));
  g.unitKeys.forEach(k=>{g.units[k].items=[];g.units[k].keyObjectives=[];g.units[k].swot={s:[],w:[],o:[],t:[]};});
  g.functionKeys.forEach(k=>{g.functions[k].items=[];g.functions[k].keyObjectives=[];});
  (g.group.capabilities||[]).forEach(c=>{c.keyObjectives=[];c.projects=[];c.items=[];});
  SYNC.hydrate(g); current='setup'; currentSub='people'; paint(); return __smpHoldsNow(); }"""

with sync_playwright() as p:
    b = p.chromium.launch()
    pg = b.new_page(viewport={"width": 1440, "height": 900})
    pg.on("pageerror", lambda e: errs.append("PAGEERROR: " + str(e)))
    pg.on("console", lambda m: errs.append(m.text) if m.type == "error" else None)
    pg.add_init_script("sessionStorage.setItem('smp.welcome.done','1'); localStorage.setItem('smp.tour.never','1');")
    pg.goto(URL)
    pg.wait_for_timeout(1000)
    pg.select_option("#asWho", "smo")
    pg.wait_for_timeout(300)

    print("\n§0 · the state is made")
    holds = ev(pg, BARE, {})
    ck("(fixture) the client holds no plan line and no capability with anything in it",
       isinstance(holds, dict) and holds.get("plans") == 0 and holds.get("capabilities") == 0, holds)
    ck("(fixture) set-up is not done on the worked example", ev(pg, "()=>!SMPRules.setupDone(GROUP)", False))
    ck("(fixture) the page stands on a Setup page that is not Getting started", ev(pg, "()=>current==='setup' && currentSub==='people'", False))

    # ── 1 · THE STRIP, AND ITS COUNT ──────────────────────────────────────
    print("\n§1 · Getting started is a strip under the rail's head")
    strip = q(pg, '.setuprail .railstart[data-setupgo="start"]')
    ck("the strip is drawn under the head, before the search", bool(strip) and
       ev(pg, "()=>{const s=document.querySelector('.setuprail .railstart');const f=document.querySelector('.setuprail .railfind');"
              "return !!s && !!f && !!(s.compareDocumentPosition(f) & Node.DOCUMENT_POSITION_FOLLOWING);}", False))
    ck("…labelled Getting started", ev(pg, "()=>(document.querySelector('.railstart .rslab')||{}).textContent", "") == "Getting started",
       ev(pg, "()=>(document.querySelector('.railstart .rslab')||{}).textContent"))
    pr = ev(pg, "()=>CLIENTSETUP.progress()", {}) or {}
    prog = ev(pg, "()=>(document.querySelector('.railstart .rsprog')||{}).textContent||''", "")
    ck("…its count AGREES with CLIENTSETUP.progress() (never a literal)",
       isinstance(pr, dict) and pr.get("total") and prog.startswith("%s of %s done" % (pr.get("done"), pr.get("total"))), (prog, pr))
    ck("…the total is the number of steps the flow draws",
       isinstance(pr, dict) and pr.get("total") == ev(pg, "()=>CLIENTSETUP.STEPS.length", -1) == 7, pr)
    ck("…and it names what is left", isinstance(pr, dict) and bool(pr.get("todo")) and all(t in prog for t in pr["todo"][:2]), (prog, pr))
    ck("…and the def is NOT a row in any group while the strip stands",
       q(pg, '.setuprail .ritem[data-setupgo="start"]') is None and q(pg, '.setuprail .rgroup[data-railgrp="client"]') is None)
    ck("the old Branding def is gone from the list (§24)", ev(pg, "()=>!setupDefsAll().some(d=>d.k==='brand')", False))

    # ── 2 · PRESSING IT OPENS THE FLOW ────────────────────────────────────
    print("\n§2 · pressing the strip")
    ck("the strip opens Getting started", press(pg, '.setuprail .railstart[data-setupgo="start"]', 500)
       and ev(pg, "()=>currentSub", None) == "start" and bool(q(pg, ".csetup")), ev(pg, "()=>currentSub"))
    ck("…headed Getting started", ev(pg, "()=>(document.querySelector('#panel .setupttl')||{}).textContent", "") == "Getting started",
       ev(pg, "()=>(document.querySelector('#panel .setupttl')||{}).textContent"))
    ck("…and the strip is lit as the page you are on",
       ev(pg, "()=>{const s=document.querySelector('.railstart');return !!s && s.classList.contains('on') && s.getAttribute('aria-current')==='page';}", False))
    steps = ev(pg, "()=>Array.from(document.querySelectorAll('.csetup .wzstep')).map(e=>e.dataset.step)", [])
    ck("seven steps, in order — client, units, cos, fns, caps, words, office",
       steps == ["client", "units", "cos", "fns", "caps", "words", "office"], steps)
    ck("…the same seven the flow declares (§53.5)", steps == ev(pg, "()=>CLIENTSETUP.STEPS.map(s=>s.k)", None), steps)
    ck("standing on the first", at(pg) == "client" and ev(pg, "()=>(document.querySelector('.csetup .wzstep[aria-current=step]')||{}).dataset.step", None) == "client")
    ck("Done with set-up is offered", bool(q(pg, ".csetup [data-wzdone]")))
    ck("…Next too, and Back is shut on the first step", bool(q(pg, ".csetup [data-wznext]")) and
       ev(pg, "()=>{const b=document.querySelector('.csetup [data-wzback]');return !!b && b.disabled;}", False))
    ck("over file:// the client's own record is said to be the served platform's, in words",
       ev(pg, "()=>/served platform/.test(document.querySelector('.csetup').textContent)", False))

    # ── 3 · THE BRANDING IS ABSORBED INTO STEP ONE ─────────────────────────
    print("\n§3 · the branding lives on the first step")
    ck("the colour controls are inside the flow", bool(q(pg, ".csetup .wzbrand [data-brand]")))
    ck("…and the group's mark upload", bool(q(pg, ".csetup .wzbrand [data-glogo]")))
    key = ev(pg, "()=>(document.querySelector('.csetup [data-brand]')||{}).dataset && document.querySelector('.csetup [data-brand]').dataset.brand", None)
    before = after = wrote = None
    if key:   # degrades: a build with no control here has nothing to write with (§215)
        before = ev(pg, "()=>branding()[%r]" % key, None)
        wrote = ev(pg, """()=>{const i=document.querySelector('.csetup [data-brand]'); if(!i) return 'no control';
          i.value='#123456'; i.dispatchEvent(new Event('change',{bubbles:true})); return 'set';}""", "probe")
        pg.wait_for_timeout(300)
        after = ev(pg, "()=>branding()[%r]" % key, None)
    ck("…and a colour set there WRITES the tenant's branding (§96)", wrote == "set" and after == "#123456" and after != before, (key, before, after, wrote))
    if key:
        ev(pg, "()=>{branding()[%r]=%s; applyBrand(); paint();}" % (key, json.dumps(before)))   # put back (§94.2)
    pg.wait_for_timeout(300)

    # ── 4 · THE UNITS STEP: ADD, TYPE, NEXT — READ BACK OFF THE GRAPH ─────
    print("\n§4 · a business unit is added")
    ck("the units step opens", press(pg, ".csetup .wzstep[data-step=units]") and at(pg) == "units", at(pg))
    n_units = ev(pg, "()=>UNIT_KEYS.length", -1)
    head0 = ev(pg, "()=>({key:UNIT_KEYS[0], head:(UNIT_ROLES[UNIT_KEYS[0]]||{}).head, mob:(UNIT_ROLES.mobile||{}).head})", {})
    ck("(fixture) the first unit has somebody in charge — the refusal below needs one (§113.8)",
       isinstance(head0, dict) and bool(head0.get("head")), head0)
    r0 = rows(pg)
    ck("one row per unit, and the Add button (the shape is not frozen)", r0 == n_units and bool(q(pg, ".csetup .wzadd")), (r0, n_units))
    ck("pressing Add puts the cursor in the new box",
       press(pg, ".csetup .wzadd", 400) and rows(pg) == r0 + 1 and
       ev(pg, "()=>{const b=document.querySelectorAll('.csetup .wzrow input.fld');return b.length>0 && document.activeElement===b[b.length-1];}", False),
       ev(pg, "()=>document.activeElement && document.activeElement.className"))
    ck("…and nothing is written until Next", ev(pg, "()=>UNIT_KEYS.length", -1) == n_units)
    try:
        pg.fill(".csetup .wzrow input.fld >> nth=-1", "Test Unit X"); pg.wait_for_timeout(100)
    except Exception as e:
        errs.append("FILL: " + str(e)[:90])
    ck("Next writes the unit into the STORED graph", press(pg, ".csetup [data-wznext]", 500) and
       ev(pg, "()=>UNIT_KEYS.length", -1) == n_units + 1 and
       ev(pg, "()=>UNITS[UNIT_KEYS[UNIT_KEYS.length-1]].name", None) == "Test Unit X",
       ev(pg, "()=>[UNIT_KEYS.length, UNITS[UNIT_KEYS[UNIT_KEYS.length-1]].name]"))
    ck("…and moves on to the next step", at(pg) == "cos", at(pg))
    ck("the heads survive the pass (§346): who runs Mobile before is who runs it after",
       ev(pg, "()=>(UNIT_ROLES.mobile||{}).head", None) == head0.get("mob") and bool(head0.get("mob")),
       (head0.get("mob"), ev(pg, "()=>(UNIT_ROLES.mobile||{}).head")))
    ck("…and the weighting rows are one per unit — never a second row per pass (§346.1)",
       ev(pg, "()=>GROUP.weighting.units.length===UNIT_KEYS.length && new Set(GROUP.weighting.units.map(r=>r.key)).size===UNIT_KEYS.length", False),
       ev(pg, "()=>[GROUP.weighting.units.length, UNIT_KEYS.length]"))
    ck("…and the strip's count moved with the data", ev(pg, "()=>(document.querySelector('.railstart .rsprog')||{}).textContent||''", "")
       .startswith("%s of %s done" % (ev(pg, "()=>CLIENTSETUP.progress().done"), 7)))

    # ── 5 · REMOVING A HEADED UNIT IS REFUSED BY NAME, AND THE ROW IS BACK ─
    print("\n§5 · a headed unit cannot be removed here")
    press(pg, ".csetup .wzstep[data-step=units]")
    r1 = rows(pg); keys1 = ev(pg, "()=>UNIT_KEYS.slice()", None)
    name0 = ev(pg, "()=>UNITS[UNIT_KEYS[0]].name", "")
    ck("(fixture) the first row is the headed unit", at(pg) == "units" and r1 == n_units + 1 and bool(name0), (at(pg), r1))
    ck("the × takes the row off the step", press(pg, ".csetup .wzrow >> nth=0 >> .wzx", 300) and rows(pg) == r1 - 1, rows(pg))
    press(pg, ".csetup [data-wznext]", 500)
    s = said(pg)
    ck("Next is refused, naming the unit somebody is in charge of", "Somebody is in charge of" in s and name0 in s, s[:120])
    ck("…and saying the row is back", "back as it was" in s, s[:160])
    ck("…the row IS back on the step", rows(pg) == r1, (rows(pg), r1))
    ck("…the flow stays on the units step", at(pg) == "units", at(pg))
    ck("…and the stored graph is untouched", ev(pg, "()=>UNIT_KEYS.slice()", None) == keys1 and
       ev(pg, "()=>(UNIT_ROLES[UNIT_KEYS[0]]||{}).head", None) == head0.get("head"))
    ck("the very next Next then proceeds (§360.3 — the person is not held on the step)",
       press(pg, ".csetup [data-wznext]", 500) and at(pg) == "cos" and ev(pg, "()=>UNIT_KEYS.slice()", None) == keys1, (at(pg), said(pg)[:80]))

    # ── 6 · A ROW WITH NO NAME ─────────────────────────────────────────────
    print("\n§6 · a row with no name")
    press(pg, ".csetup .wzstep[data-step=units]")
    r2 = rows(pg)
    press(pg, ".csetup .wzadd", 300)
    press(pg, ".csetup [data-wznext]", 400)
    s = said(pg)
    ck("Next with an empty row is refused in words", "Name a business unit" in s and "remove the empty row" in s, s[:120])
    ck("…and nothing is written", at(pg) == "units" and ev(pg, "()=>UNIT_KEYS.length", -1) == n_units + 1)
    ck("taking the empty row off lets Next through", press(pg, ".csetup .wzrow >> nth=-1 >> .wzx", 300) and rows(pg) == r2
       and press(pg, ".csetup [data-wznext]", 500) and at(pg) == "cos", (rows(pg), at(pg), said(pg)[:60]))

    # ── 7 · DONE WITH SET-UP ───────────────────────────────────────────────
    print("\n§7 · Done with set-up")
    ck("(before) the strip stands and the button is there", bool(q(pg, ".railstart")) and bool(q(pg, ".csetup [data-wzdone]")))
    press(pg, ".csetup [data-wzdone]", 700)
    ck("the mark is written on the group — SMPRules.setupDone(GROUP)", ev(pg, "()=>SMPRules.setupDone(GROUP)", False))
    ck("the strip is gone", q(pg, ".setuprail .railstart") is None)
    ck("…and the button with it", q(pg, ".csetup [data-wzdone]") is None)
    ck("the def is now Client set-up, in the client group (setupDefsAll)",
       ev(pg, "()=>{const d=setupDefsAll().find(d=>d.k==='start');return !!d && d.label==='Client set-up' && d.grp==='client';}", False),
       ev(pg, "()=>{const d=setupDefsAll().find(d=>d.k==='start');return d && [d.label,d.grp];}"))
    ck("…and drawn as a row of the LAST group in the rail's DOM",
       ev(pg, """()=>{const it=document.querySelector('.setuprail .ritem[data-setupgo="start"]');
         const g=document.querySelector('.setuprail .rgroup[data-railgrp="client"]');
         const groups=Array.from(document.querySelectorAll('.setuprail .rgroup'));
         return !!it && !!g && /Client set-up/.test(it.textContent) && groups[groups.length-1]===g &&
           !!(g.compareDocumentPosition(it) & Node.DOCUMENT_POSITION_FOLLOWING);}""", False))
    ck("…the page's head reads Client set-up too", ev(pg, "()=>(document.querySelector('#panel .setupttl')||{}).textContent", "") == "Client set-up")
    ck("…and every answer stays editable — the steps are still there", ev(pg, "()=>document.querySelectorAll('.csetup .wzstep').length", -1) == 7)

    # ── 8 · THE SHAPE FREEZES WITH A PLAN ──────────────────────────────────
    print("\n§8 · a client with a plan in it")
    press(pg, ".csetup .wzstep[data-step=units]")
    ck("(before) the Add button is there", at(pg) == "units" and bool(q(pg, ".csetup .wzadd")) and q(pg, ".csetup .wzarched") is None)
    ev(pg, "()=>{UNITS[UNIT_KEYS[0]].items.push({id:'x-P1', code:'X01', name:'A pillar', measures:[], tactics:[]}); paint();}")
    pg.wait_for_timeout(400)
    ck("with a plan line, the Add button is gone and no common name is offered",
       q(pg, ".csetup .wzadd") is None and q(pg, ".csetup .wzcm") is None)
    ck("…the step says the shape is set", ev(pg, "()=>/shape is set from here on/.test((document.querySelector('.csetup .wzarched')||{}).textContent||'')", False))
    ck("…and the names are read-only", ev(pg, "()=>{const b=Array.from(document.querySelectorAll('.csetup .wzrow input.fld'));return b.length>0 && b.every(x=>x.readOnly);}", False))
    ev(pg, "()=>{UNITS[UNIT_KEYS[0]].items.pop(); paint();}")
    pg.wait_for_timeout(300)
    ck("…and back again with the line gone (§94.2)", bool(q(pg, ".csetup .wzadd")))

    print("\n§9 · the console")
    ck("no page errors", not errs, errs[:3])
    b.close()

print("\n%d failures" % len(fails))
for f in fails:
    print("  - " + f)
if fails:
    sys.exit(1)
print("client-setup: all assertions passed")
