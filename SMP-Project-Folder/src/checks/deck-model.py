#!/usr/bin/env python3
"""§557 — EVERY PRESENTATION FOLLOWS ONE DECK MODEL.

Islam chose it on real slides: a divider "before every part"; "the
presentation should show what the function or unit or company has in their
structure"; and of a projects box, "the projects view at the start should
show the projects like the pillars not the performance … in the overall
performance view it's fine to show it as performance".

Every claim is read off the deck the product builds, and each rule is held
at BOTH ENDS (§94.2): switched on and written draws the slide, switched off
(or empty) does not — so a build that drew it always, or never, goes red.

  python3 checks/deck-model.py
  SMP_BUILT=<other build> python3 checks/deck-model.py   # falsify (§276)
"""
import os, sys
from playwright.sync_api import sync_playwright

HERE = os.path.dirname(os.path.abspath(__file__))
F = os.environ.get("SMP_BUILT") or os.path.join(os.path.dirname(HERE), "strategy-management-platform.html")
fails = []
def ok(label, cond, detail=""):
    print(("  ok   " if cond else "  FAIL ") + label + ("" if cond else "  — " + str(detail)[:300]))
    if not cond: fails.append(label)

ANCH = """(t)=>{var d=document.createElement('div'); d.innerHTML=deckHtmlFor(t);
  return [...d.querySelectorAll('.dslide')].map(s=>s.getAttribute('data-anchor')||'');}"""
def struct_off(pg, level, comp):
    # From the EFFECTIVE list, so switching one part off leaves the rest as they were.
    pg.evaluate("""([lv, c])=>{ var st = JSON.parse(JSON.stringify(SMPRules.structureOf(GROUP) || {}));
      var t = lv === 'top' ? 'group' : lv === 'fn' ? 'fn:finance' : 'mobile';
      var on = SMPRules.STRUCT_COMPONENTS.concat(['desc']).filter(x => SMPRules.compOn(GROUP, t, x));
      st[lv] = st[lv] || {}; st[lv].on = on.filter(x => x !== c); GROUP.structure = st; }""", [level, comp])

with sync_playwright() as p:
    b = p.chromium.launch(executable_path=os.environ.get("SMP_CHROME") or None)
    pg = b.new_page(); errs = []; pg.on("pageerror", lambda e: errs.append(str(e)))
    pg.add_init_script("try{sessionStorage.setItem('smp.welcome.done','1');localStorage.setItem('smp.tour.never','1')}catch(e){}")
    pg.goto("file://" + F); pg.wait_for_timeout(1500)
    keep = pg.evaluate("()=>JSON.stringify({s:GROUP.structure||null, sw:UNITS.mobile.swot})")

    print("1 · the Foundation part shows what the structure has, and what is written")
    g = pg.evaluate(ANCH, "group")
    ok("the company's deck draws its Foundation behind a divider",
       g[:2] == ["cover", "sfound"], g[:6])
    ok("…Who we are, the aim and the values, in that order",
       all(a in g for a in ("who", "aim", "values")) and g.index("who") < g.index("aim") < g.index("values"), g[:8])
    struct_off(pg, "top", "values")
    g2 = pg.evaluate(ANCH, "group")
    ok("Values switched off: no Values slide (the other end)", "values" not in g2 and "aim" in g2, g2[:8])
    struct_off(pg, "top", "brief"); struct_off(pg, "top", "purpose")
    g3 = pg.evaluate(ANCH, "group")
    ok("Brief and Purpose switched off: no Who we are", "who" not in g3, g3[:8])
    pg.evaluate("(k)=>{var o=JSON.parse(k); GROUP.structure=o.s; if(!o.s) delete GROUP.structure;}", keep)

    print("\n2 · a section switched off is not drawn, and it is named by its layer")
    f = pg.evaluate(ANCH, "fn:finance")
    title = pg.evaluate("""()=>{var d=document.createElement('div'); d.innerHTML=deckHtmlFor('fn:finance');
      var s=d.querySelector('.dslide[data-anchor="sfound"] h1'); return s ? s.textContent.trim() : null;}""")
    want = pg.evaluate("()=>SMPRules.foundTitle(GROUP,'fn:finance')")
    ok("a function's Foundation divider carries its layer's own name", title == want and bool(want), [title, want])
    pg.evaluate("""()=>{ var st = JSON.parse(JSON.stringify(SMPRules.structureOf(GROUP) || {}));
      st.fn = st.fn || {}; st.fn.found = { on:false }; GROUP.structure = st; }""")
    f2 = pg.evaluate(ANCH, "fn:finance")
    ok("its first section switched off: no Foundation part at all", "sfound" not in f2 and "sfound" in f, [f[:4], f2[:4]])
    pg.evaluate("(k)=>{var o=JSON.parse(k); GROUP.structure=o.s; if(!o.s) delete GROUP.structure;}", keep)

    print("\n3 · projects: named at the start, scored at the end")
    f = pg.evaluate(ANCH, "fn:finance")
    ok("a divider opens the plan, before the projects are named",
       "sprojects" in f and "capfn:finance" in f and f.index("sprojects") < f.index("capfn:finance"), f)
    names = pg.evaluate("""()=>{var d=document.createElement('div'); d.innerHTML=deckHtmlFor('fn:finance');
      var s=d.querySelector('.dslide[data-anchor="capfn:finance"]');
      return s ? {cards:s.querySelectorAll('.pcard').length, table:!!s.querySelector('table'), pct:/\\d%/.test(s.textContent),
                  n:(FUNCTIONS.finance.projects||[]).length} : null;}""")
    ok("the projects open as cards, one each, with no scores",
       names and names["cards"] == names["n"] and names["n"] > 0 and not names["table"] and not names["pct"], names)
    ok("their scores sit in Overall performance, before where the box stands",
       "capfn:financep" in f and f.index("sperf") < f.index("capfn:financep") < f.index("stand"), f)

    print("\n4 · a part switched on but empty draws nothing")
    pg.evaluate("()=>{UNITS.mobile.swot = {s:[],w:[],o:[],t:[]};}")
    m = pg.evaluate(ANCH, "mobile")
    ok("an empty SWOT draws no SWOT section", not any(a.startswith("swot") for a in m), m[:10])
    pg.evaluate("()=>{UNITS.mobile.swot = {s:['A strength'],w:[],o:[],t:[]};}")
    m2 = pg.evaluate(ANCH, "mobile")
    ok("…and one written strength brings it back, behind its divider", "swothead" in m2, m2[:10])
    pg.evaluate("(k)=>{UNITS.mobile.swot = JSON.parse(k).sw;}", keep)

    ok("no page errors", not errs, errs[:3])
    b.close()

print("\n" + ("deck-model: %d FAILED" % len(fails) if fails else "deck-model: all passed"))
sys.exit(1 if fails else 0)
