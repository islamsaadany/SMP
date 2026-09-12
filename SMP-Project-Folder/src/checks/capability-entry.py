"""A CAPABILITY IS A STRATEGIC ENTRY (§330, spec 046 stage 2).

Islam, correcting a proposal of mine that would have hidden the problem:
"capability is something Strategic ... the problem with having the capability
hidden in the functional plans is confusing for the whole structure." Stage 1
(§322) gave a function its own projects and left the box drawn INSIDE the
function's four pages. This is the round that gives it pages of its own, and
his four answers to the signed-off mockup are what it asserts.

What is asserted, and why each end matters (§94.2):

  - THE THIRD SIDE IS DRAWN ONLY WHEN THERE IS ONE. Both ends: with the
    tenant's capability removed the switch is the two-part control every
    tenant has today, and with it back the third side returns. A check that
    only looked for three sides would pass on a build that drew them always,
    which is the fault the mockup's own "a side with nothing behind it is not
    drawn" exists to stop;

  - ITS THREE TABS ARE THE FUNCTION'S THREE TABS, asserted as an AGREEMENT
    with what a projects function draws rather than as three literals
    (§53.5, §94.8) — a second tab list for the second kind is the drift §211
    and §213 each cost a day to undo;

  - THE OVERVIEW SAYS Capability AND Held by, and names the function too:
    "Rana Fouad" alone does not say which desk holds the work;

  - A PROJECT'S CODE IS ITS HOLDER'S POSITION (§310). The capability's own
    letters on its projects, and the function's own on what it kept — read
    off the PRODUCT's own `projCode`, so a build that stopped deriving them
    cannot pass by agreeing with a literal;

  - THE FUNCTION'S PAGES DRAW NO BAND AND NO CAPABILITY, on all four —
    asserted beside the capability's own pages being DRAWN, or a build that
    deleted both satisfies every absence here (§113.8);

  - THE PROMOTE CONTROL names what it will change BEFORE the press, in the
    codes themselves, and follows the name as it is typed — that is the cost
    Islam took with the drawing in front of him ("ok with the promirting
    mockup"), so a build that stopped saying it has broken the promise the
    press rests on;

  - AND THE ROUND TRIP CLOSES: promoted and given back through §321's own
    dialog, every id identical at the end and every code back where it
    started (§232, §316 — an id that moves re-addresses every figure keyed
    on it).

Every probe degrades (§215). SMP_BUILT points it at another build, so it can
be run against the build before (§276: a broken build is made from the
SOURCES, because §238's hashed CSP silences an edited built file).
"""
import os
from playwright.sync_api import sync_playwright

BUILT = os.environ.get("SMP_BUILT") or os.path.join(
    os.path.dirname(__file__), "..", "strategy-management-platform.html")
URL = "file://" + os.path.abspath(BUILT)

good = bad = 0
def ck(w, ok, x=""):
    global good, bad
    if ok: good += 1
    else: bad += 1
    print(("  ok      " if ok else "  FAIL    ") + w + (("  — %s" % (x,)) if not ok and x != "" else ""))

def ev(pg, js, dflt=None, arg=None):
    try:
        return pg.evaluate(js, arg) if arg is not None else pg.evaluate(js)
    except Exception as e:
        return dflt if dflt is not None else {"err": str(e)[:110]}

def side(pg, s):
    """Press the side, never the control (§330): with three sides the switch is
       a group of buttons, and `data-fold` is absent exactly when that side is
       already lit."""
    ev(pg, "(s)=>{const b=document.querySelector('#units [data-fold=\"'+s+'\"]');"
           " if (b) b.click();}", None, s)
    pg.wait_for_timeout(260)

def panel(pg):
    return ev(pg, "()=>document.getElementById('panel').innerText", "")

def secs(pg):
    return ev(pg, "()=>[...document.querySelectorAll('#secrow-in [data-sub2]')]"
                  ".map(x=>x.textContent.trim())", [])

def tabs(pg):
    """THE TAB KEYS, never the words on them. A Reporting tab wears its own
    status (§69: *Reporting — not submitted yet*), which is a fact about the
    SUBJECT and not about which tabs it has — so comparing the words made a
    capability and a function differ for the one reason they must (a capability
    reports, and §330 had to teach `reportPending` so, which is the fault this
    assertion found). `data-s` is the key both sides are built from."""
    return ev(pg, "()=>[...document.querySelectorAll('#subtabs button')]"
                  ".map(x=>x.dataset.s || x.textContent.trim().split('\\n')[0])", [])

def go(pg, dest):
    side(pg, "caps" if dest.startswith("cap:") else
             "fns" if dest.startswith("fn:") else "units")
    try:
        pg.click('#units [data-u="%s"]' % dest, timeout=4000); pg.wait_for_timeout(520)
        return True
    except Exception:
        return False

def sec(pg, k):
    try:
        pg.click('#secrow-in [data-sub2="%s"]' % k, timeout=3000); pg.wait_for_timeout(460)
        return True
    except Exception:
        return False

def tab(pg, k):
    try:
        pg.click('#subtabs button[data-s="%s"]' % k, timeout=3000); pg.wait_for_timeout(560)
        return True
    except Exception:
        return False

def main():
    with sync_playwright() as pw:
        br = pw.chromium.launch(executable_path=os.environ.get("SMP_CHROME") or None)
        pg = br.new_page(viewport={"width": 1500, "height": 900})
        errs = []
        pg.on("pageerror", lambda e: errs.append(str(e)[:200]))
        pg.on("console", lambda m: errs.append("console: " + m.text[:200])
              if m.type == "error" else None)
        pg.add_init_script("try{localStorage.setItem('smp.welcome.seen','1');"
                           "sessionStorage.setItem('smp.tour.skip','1')}catch(e){}")
        pg.goto(URL); pg.wait_for_timeout(1200)

        # ── 1 · the demo carries one, and it is the one the data chose ──────
        print("\n1 · the demo's one real capability")
        caps = ev(pg, "()=>GROUP.capabilities.map(c=>({id:c.id,name:c.name,fn:c.fn,"
                      "n:(c.projects||[]).length}))", [])
        ck("the worked example holds exactly one capability",
           isinstance(caps, list) and len(caps) == 1, caps)
        if not (isinstance(caps, list) and len(caps) == 1):
            print("cannot continue"); br.close(); return 1
        CAP, CID, FK = caps[0], caps[0]["id"], caps[0]["fn"]
        ck("...and it holds projects, so its pages have something on them",
           CAP["n"] >= 1, CAP)

        # ── 2 · the third side, BOTH ENDS ──────────────────────────────────
        print("\n2 · a side with nothing behind it is not drawn")
        words = ev(pg, "()=>[...document.querySelectorAll('#units .nsw')]"
                       ".map(x=>x.textContent.trim())", [])
        ck("the switch has three sides while a capability exists",
           words == ["Units", "Capabilities", "Functions"], words)
        ck("...and each is its own button, because 'press to switch' has no "
           "answer with three (§330)",
           ev(pg, "()=>document.querySelectorAll('#units .navswitch.multi .nsw[data-fold]')"
                  ".length", 0) == 3, words)
        gone = ev(pg, "()=>{const k=GROUP.capabilities.map(c=>c.id);"
                      " window.__CAPS=GROUP.capabilities.slice();"
                      " GROUP.capabilities.length=0; paint();"
                      " return [...document.querySelectorAll('#units .nsw')]"
                      ".map(x=>x.textContent.trim());}", [])
        ck("with none, it is the two-part control every tenant has today",
           gone == ["Units", "Functions"], gone)
        back = ev(pg, "()=>{GROUP.capabilities.push.apply(GROUP.capabilities, window.__CAPS);"
                      " paint(); return [...document.querySelectorAll('#units .nsw')]"
                      ".map(x=>x.textContent.trim());}", [])
        ck("...and the third side comes back with the first capability",
           back == ["Units", "Capabilities", "Functions"], back)

        # ── 3 · its pages are the function's pages ─────────────────────────
        print("\n3 · the same pages a supporting function has")
        ck("the capability is a destination", go(pg, "cap:" + CID))
        capTabs, capSecs = tabs(pg), secs(pg)
        # AND IT REPORTS AS A SUBJECT (§69, §244) — measured HERE, standing on
        # the capability, because the comparison below walks off to the
        # function. The board asks it for a report, so the tab has to say one
        # is owed; `reportPending` answered "not a real subject" for a
        # capability, so the one page that is somebody's whole project said
        # nothing while the board counted it.
        ck("its Reporting tab says a submission is owed",
           "not submitted yet" in (ev(pg,
             "()=>{const b=[...document.querySelectorAll('#subtabs button')]"
             ".find(x=>x.dataset.s==='report'); return b ? b.textContent : '';}",
             "") or ""),
           ev(pg, "()=>[...document.querySelectorAll('#subtabs button')]"
                  ".map(x=>x.textContent.trim())", []))
        ck("it opens on its plan, as a function does",
           ev(pg, "()=>currentSub", "") == "fnstrat", ev(pg, "()=>currentSub", ""))
        ck("a projects function is reachable for the comparison", go(pg, "fn:" + FK))
        fnTabs, fnSecs = tabs(pg), secs(pg)
        ck("its three tabs AGREE with a function's (§53.5, §94.8)",
           capTabs == fnTabs and len(capTabs) >= 2, "%s / %s" % (capTabs, fnTabs))
        # AND IT REPORTS AS A SUBJECT (§69, §244). The board asks it for a
        # report, so the tab has to say one is owed — `reportPending` answered
        # "not a real subject" for a capability, so the one page that is
        # somebody's whole project said nothing while the board counted it.

        ck("...and so do its sections", capSecs == fnSecs and len(capSecs) == 2,
           "%s / %s" % (capSecs, fnSecs))

        # ── 4 · the Overview says what the thing is ────────────────────────
        print("\n4 · Capability · Held by · Definition")
        go(pg, "cap:" + CID); sec(pg, "found")
        keys = ev(pg, "()=>[...document.querySelectorAll('#panel .clause dt')]"
                      ".map(x=>x.textContent.trim())", [])
        ck("the Overview reads Capability, Held by, Definition",
           keys == ["Capability", "Held by", "Definition"], keys)
        held = ev(pg, "()=>{const d=[...document.querySelectorAll('#panel .clause')]"
                      ".find(x=>/Held by/.test(x.textContent)); return d? d.innerText"
                      ".replace(/\\n/g,' ') : null}", None)
        fname = ev(pg, "(k)=>FUNCTIONS[k].name", "", FK)
        ck("...and Held by names the FUNCTION too, not a person alone",
           bool(held) and fname in held, held)
        ck("an empty objectives list says a CAPABILITY is judged by its projects",
           "This capability is judged by its projects" in panel(pg)
           or "Key Objectives" in panel(pg), panel(pg)[:160])

        # ── 5 · the codes are the holder's position (§310) ─────────────────
        print("\n5 · a project's code is its holder's position")
        codes = ev(pg, "(id)=>{const c=capById(id); return (c.projects||[])"
                       ".map(p=>({id:p.id, code:projCode('cap:'+id,p)}));}", [], CID)
        pre = ev(pg, "(id)=>capPrefix(capById(id))", "", CID)
        ck("the capability's projects wear its own letters",
           bool(pre) and all(str(x["code"]).startswith(pre) for x in codes), 
           "%s / %s" % (pre, codes))
        own = ev(pg, "(k)=>(FUNCTIONS[k].projects||[]).map(p=>projCode(k,p))", [], FK)
        fpre = ev(pg, "(k)=>FUNCTIONS[k].codePrefix", "", FK)
        ck("...and the function's own keep the function's",
           all(str(c).startswith(str(fpre)) for c in own), "%s / %s" % (fpre, own))

        # ── 6 · the band is gone, and the pages are DRAWN (§113.8) ─────────
        print("\n6 · no band on a function's pages, and its projects still drawn")
        go(pg, "fn:" + FK)
        for k, lab in [("fnstrat", "Strategy"), ("fnperf", "Performance"),
                       ("report", "Reporting")]:
            if not tab(pg, k): 
                ck("the %s tab opens" % lab, False, k); continue
            ck("no CAPABILITY band on %s" % lab,
               ev(pg, "()=>document.querySelectorAll('#panel .capline').length", -1) == 0,
               ev(pg, "()=>document.querySelectorAll('#panel .capline').length", -1))
            ck("...and the capability's NAME is not on it either",
               CAP["name"] not in panel(pg), CAP["name"])
        tab(pg, "fnstrat"); sec(pg, "proj")
        ck("the function's own projects are DRAWN, not merely un-banded",
           ev(pg, "()=>document.querySelectorAll('#panel .rail .ritem').length", 0) > 0
           or "PROJECTS" in panel(pg).upper(), panel(pg)[:120])

        # ── 7 · the cycle board ────────────────────────────────────────────
        print("\n7 · every subject that reports has a row (§244)")
        rowsOf = ev(pg, "()=>{current='setup'; currentSub='cycle'; paint(); return {"
                        " bands:[...document.querySelectorAll('#panel tr.dxband th')]"
                        ".map(x=>x.innerText.replace(/\\n/g,' ')),"
                        " rows:[...document.querySelectorAll('#panel tbody tr:not(.dxband)"
                        " td:first-child')].map(x=>x.textContent)};}", {})
        ck("a Capabilities band is drawn",
           any("CAPABILIT" in str(b).upper() for b in rowsOf.get("bands", [])),
           rowsOf.get("bands"))
        ck("...and the capability has a row of its own",
           CAP["name"] in rowsOf.get("rows", []), rowsOf.get("rows", [])[:24])
        ck("the headline counts it (§108.1: the parts and the divisor agree)",
           ev(pg, "()=>cycleTotals().units", 0) ==
           ev(pg, "()=>boardUnitTargets().length + boardCapTargets().length"
                  " + boardFunctionTargets().length", -1),
           "%s / %s" % (ev(pg, "()=>cycleTotals().units", 0),
                        ev(pg, "()=>boardUnitTargets().length + boardCapTargets().length"
                               " + boardFunctionTargets().length", -1)))

        # ── 8 · making projects a capability ───────────────────────────────
        print("\n8 · the promote control names its cost before the press")
        before = ev(pg, "(k)=>({own:(FUNCTIONS[k].projects||[]).map(p=>p.id),"
                        " codes:(FUNCTIONS[k].projects||[]).map(p=>projCode(k,p)),"
                        " arch:ARCHIVES.length})", {}, "finance")
        ok = go(pg, "fn:finance") and tab(pg, "fnstrat") and sec(pg, "proj")
        ev(pg, "()=>{const b=document.querySelector('.penbtn[data-page=\"plan\"]')"
               "||document.querySelector('[data-page=\"plan\"]'); if(b)b.click();}")
        pg.wait_for_timeout(600)
        ck("the door is beside the projects", 
           ev(pg, "()=>!!document.querySelector('[data-cappromo]')", False))
        try:
            pg.click('[data-cappromo]', timeout=4000); pg.wait_for_timeout(520)
        except Exception:
            ck("the dialog opens", False, "no [data-cappromo]")
        rows = ev(pg, "()=>[...document.querySelectorAll('#promo-b .pick .t')]"
                      ".map(x=>x.textContent)", [])
        ck("it lists the function's own projects, so not all of them need go",
           len(rows) == len(before.get("own", [])), rows)
        ck("with nothing chosen it refuses and says why",
           "at least one" in ev(pg, "()=>{const e=document.querySelector('#promo-cost');"
                                    " return e? e.innerText : ''}", ""),
           ev(pg, "()=>{const e=document.querySelector('#promo-cost'); return e? e.innerText : ''}", "")[:90])
        ev(pg, "()=>{const t=document.querySelectorAll('[data-promotick]');"
               " if(t[0])t[0].click(); if(t[1])t[1].click();}"); pg.wait_for_timeout(320)
        try: pg.fill('#promo-name', 'Cash Discipline'); pg.wait_for_timeout(320)
        except Exception: pass
        cost = ev(pg, "()=>{const e=document.querySelector('#promo-cost');"
                      " return e? e.innerText.replace(/\\n/g,' ') : ''}", "")
        ck("the cost names the NEW codes, derived from the name as it is typed",
           "CD01" in cost and "CD02" in cost, cost[:150])
        ck("...and what the function keeps, so both halves are checkable",
           "FIN01" in cost.split("remaining")[-1] if "remaining" in cost else False,
           cost[:200])
        ev(pg, "()=>{const b=document.querySelector('[data-promogo]'); if(b)b.click();}")
        pg.wait_for_timeout(900)
        after = ev(pg, "()=>{const c=GROUP.capabilities.filter(x=>x.name==='Cash Discipline')[0];"
                       " return c? {id:c.id, p:(c.projects||[]).map(x=>x.id),"
                       " codes:(c.projects||[]).map(x=>projCode('cap:'+c.id,x)),"
                       " own:(FUNCTIONS.finance.projects||[]).map(x=>x.id),"
                       " ownCodes:(FUNCTIONS.finance.projects||[]).map(x=>projCode('finance',x)),"
                       " arch:ARCHIVES.length} : null;}", None)
        ck("the capability is made", bool(after), after)
        # §215 IS ABOUT WHAT A CHECK REPORTS, NOT ONLY ABOUT WHAT IT SURVIVES.
        # These eight sat behind `if after:` and were therefore SKIPPED on the
        # one build they exist for: falsifying the promote path printed a single
        # red where there are nine, which reads as a near miss rather than as a
        # feature that is not there. They degrade instead, so the count is the
        # truth (§298.3: the tail is the verdict, and the count has to match it).
        a = after or {}
        ck("the projects keep their IDS (§232, §316)",
           a.get("p") == before.get("own", [])[:2],
           "%s / %s" % (a.get("p"), before.get("own")))
        ck("...and take the capability's codes, as the dialog said",
           a.get("codes") == ["CD01", "CD02"], a.get("codes"))
        ck("...and the function's remaining project closes up",
           a.get("ownCodes") == ["FIN01"], a.get("ownCodes"))
        ck("an archive is written first (§49.2)",
           isinstance(a.get("arch"), int) and a["arch"] > before.get("arch", 0),
           "%s -> %s" % (before.get("arch"), a.get("arch")))

        # ── 9 · and giving them back ───────────────────────────────────────
        print("\n9 · the round trip closes where it started")
        gave = ev(pg, "(id)=>{ if(!id) return {}; removeCapability(id, 'fn:finance');"
                      " paint();"
                      " return {own:(FUNCTIONS.finance.projects||[]).map(p=>p.id),"
                      " codes:(FUNCTIONS.finance.projects||[]).map(p=>projCode('finance',p)),"
                      " caps:GROUP.capabilities.map(c=>c.id)};}", {}, a.get("id") or "")
        ck("every project is back with the function, ids unmoved",
           bool(gave.get("own")) and
           sorted(gave.get("own", [])) == sorted(before.get("own", [])),
           "%s / %s" % (gave.get("own"), before.get("own")))
        ck("...and every code is back where it started",
           bool(gave.get("codes")) and gave.get("codes") == before.get("codes"),
           "%s / %s" % (gave.get("codes"), before.get("codes")))
        ck("...and the capability is gone",
           bool(a.get("id")) and a["id"] not in gave.get("caps", []),
           "%s / %s" % (a.get("id"), gave.get("caps")))

        # ── 10 · the other form ────────────────────────────────────────────
        print("\n10 · a capability can be planned in pillars (Islam's own answer)")
        made = ev(pg, "(id)=>{const c=capById(id); c.format='pillars';"
                      " c.items=[{id:id+'-P1', code:'X1', name:'A pillar of its own',"
                      " measures:[], tactics:[]}]; paint();"
                      " return capPlansInPillars(c);}", False, CID)
        ck("the form is the capability's own", made is True, made)
        go(pg, "cap:" + CID)
        ck("...and its plan is drawn by the unit's pages, as a pillars function is",
           "A pillar of its own" in panel(pg) or sec(pg, "proj")
           and "A pillar of its own" in panel(pg), panel(pg)[:140])
        ev(pg, "(id)=>{const c=capById(id); delete c.format; delete c.items; paint();}",
           None, CID)

        print("\n── nothing threw")
        ck("no page error anywhere in the run", not errs, errs[:3])
        br.close()
    # THE TAIL IS THE VERDICT (§298.3), so it says both numbers every time —
    # the first draft of this line read `"..." % (0, bad) if bad else "..."`,
    # where the ternary binds looser than `%`, so a clean run printed "0
    # passed" with every line above it saying ok.
    print("\n%d passed, %d failed" % (good, bad))
    return 1 if bad else 0

if __name__ == "__main__":
    raise SystemExit(main())
