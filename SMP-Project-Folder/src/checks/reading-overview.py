"""THE READING WINDOW'S OVERVIEW TAB (§798; design-mockups/strategy-reading-view
round 7).

Islam, of El Abd's board: *"make it an overview page where people can see a
dashboard with the general performance and access to the plan and the
directions perform, capabilities perform and functional performance"*, then
*"they land on the overview and keep the tabs"*, and of the mockup, *"build
it"*.

NOTHING NEW IS COMPUTED (§53.5) and EVERY CARD IS A DOOR — so what is
asserted is AGREEMENT with the tabs behind it, never a figure of its own,
and every door is pressed and read back off the window's state (§96):

  1 · THE WINDOW OPENS ON THE OVERVIEW, for the office and for a reader's
      seat alike; the tabs stay; the address says "overview".

  2 · WHERE WE STAND is Overall performance's own three figures, character
      for character.

  3 · THE DIRECTIONS DOOR lists the directions the Directions tab lists, in
      its codes, each line's figure the fold's own; a line opens the tab on
      that direction, unfolded; the title opens the tab.

  4 · THE FUNCTIONS DOOR lists the functions the viewer reaches with the
      headline the division's table gives; a line opens the window on it.

  5 · THE PLAN DOOR opens the Directions with every direction unfolded;
      Print beside it for the office, absent for a reader.

  6 · THE SHAPES: El Abd's (the company's own directions, no units) reads
      directions and functions; Raya's group reads units and functions and
      no empty directions door (§61); a unit reads its directions alone; a
      function has no Overview and opens on its first tab.
"""
import os
from playwright.sync_api import sync_playwright

HERE = os.path.dirname(os.path.abspath(__file__))
FILE = os.environ.get("SMP_BUILT") or os.path.join(os.path.dirname(HERE), "strategy-management-platform.html")
fails = []


def ok(label, cond, got=None):
    if cond:
        print("  ok   " + label)
    else:
        fails.append(label)
        print("  FAIL " + label + ("" if got is None else "  — %s" % (got,)))


def js(pg, expr, arg=None):
    try:
        return pg.evaluate(expr, arg) if arg is not None else pg.evaluate(expr)
    except Exception as e:                                    # noqa: BLE001
        return {"threw": str(e).strip().split("\n")[0][:160]}


SHAPE = """()=>{ const r = document.getElementById('readroot');
  const tabs = [...r.querySelectorAll('.rwtabs button')];
  return { state: READING.state(), tabs: tabs.map(b => b.textContent.trim()), lit: (tabs.find(b => b.getAttribute('aria-current')) || {}).textContent,
           doors: [...r.querySelectorAll('.rdoor h3')].map(h => h.firstChild.textContent.trim()),
           plan: !!r.querySelector('.rplan'), planPrint: !!r.querySelector('.rplan [data-rprint]'),
           figures: (r.querySelector('.rwbody .rthree') || {}).outerHTML || null }; }"""

DIRS = """()=>{ const r = document.getElementById('readroot');
  return [...r.querySelectorAll('.rovrow[data-rover^="dir|"]')].map(b => ({ code: b.querySelector('.rcode').textContent, name: b.querySelector('.rovname').textContent, pct: b.querySelector(':scope > b').textContent, to: b.dataset.rover })); }"""
FOLDS = """()=>{ const r = document.getElementById('readroot');
  return [...r.querySelectorAll('.rdir')].map(d => ({ id: d.dataset.rdir, code: d.querySelector('.rcode').textContent, name: d.querySelector('h3').firstChild.textContent, pct: d.querySelector('.rsum b:last-child').textContent, open: d.classList.contains('open') })); }"""
FNS = """()=>{ const r = document.getElementById('readroot');
  return [...r.querySelectorAll('.rovrow[data-rgo^="fn:"]')].map(b => ({ fn: b.dataset.rgo.slice(3), name: b.querySelector('.rovname').textContent, pct: b.querySelector(':scope > b').textContent })); }"""

with sync_playwright() as p:
    b = p.chromium.launch(executable_path=os.environ.get("SMP_CHROME"))
    pg = b.new_page(viewport={"width": 1440, "height": 900})
    pg.add_init_script("try{sessionStorage.setItem('smp.welcome.seen','1');sessionStorage.setItem('smp.welcome.done','1');"
                       "sessionStorage.setItem('smp.tour.later','1');localStorage.setItem('smp.tour.never','1');}catch(e){}")
    errs = []
    pg.on("pageerror", lambda e: errs.append(str(e)))
    pg.goto("file://" + FILE); pg.wait_for_timeout(900)
    js(pg, "()=>{ switchViewer((PEOPLE.find(p=>SMPRules.isOffice(world(), p))||{}).key); }"); pg.wait_for_timeout(400)
    # El Abd's shape, made: the company's own directions, the units' layer off
    made = js(pg, """()=>{ var k = activeKeys()[0]; GROUP.items = JSON.parse(JSON.stringify(UNITS[k].items));
      var s = GROUP.structure = GROUP.structure || {}; s.bu = Object.assign({}, s.bu || {}, { exists: false }); try { paint(); } catch (e) {}
      try { READING.close(); } catch (e) {}
      return { own: topHasPlan(), noUnits: !buExists(), opened: READING.open('group') && READING.state().target }; }""")
    pg.wait_for_timeout(400)
    ok("made: El Abd's shape — the company holds its own directions and no units", isinstance(made, dict) and made.get("own") is True and made.get("noUnits") is True and made.get("opened") == "group", made)

    print("\n── 1 · the window opens on the Overview")
    sh = js(pg, SHAPE)
    ok("the office opens on Overview, first of the tabs, the tabs kept", isinstance(sh, dict) and sh.get("lit") == "Overview" and (sh.get("tabs") or [None])[0] == "Overview" and "Foundation" in sh.get("tabs", []) and "Overall performance" in sh.get("tabs", []), sh)
    ok("…and the address says overview", isinstance(sh, dict) and (sh.get("state") or {}).get("tab") == "overview", sh.get("state") if isinstance(sh, dict) else sh)
    ok("El Abd's doors: Directions, the functions, the plan — no units", isinstance(sh, dict) and sh.get("doors") and sh["doors"][0] == "Directions" and any("unction" in d for d in sh["doors"]) and not any("unit" in d.lower() for d in sh["doors"]) and sh.get("plan") is True, sh)
    ok("…Print on the plan door for the office", isinstance(sh, dict) and sh.get("planPrint") is True, sh)

    print("\n── 2 · where we stand is Overall performance's own figures")
    over_figs = (sh or {}).get("figures")
    js(pg, "()=>READING.open('group', 'performance')"); pg.wait_for_timeout(300)
    perf_figs = js(pg, "()=>(document.querySelector('#readroot .rwbody .rthree') || {}).outerHTML || null")
    ok("the three figures are the tab's, character for character", isinstance(over_figs, str) and over_figs == perf_figs, (len(over_figs or ""), len(perf_figs or "")))

    print("\n── 3 · the directions door agrees with the Directions tab")
    js(pg, "()=>READING.open('group', 'directions')"); pg.wait_for_timeout(300)
    folds = js(pg, FOLDS)
    js(pg, "()=>READING.open('group', 'overview')"); pg.wait_for_timeout(300)
    lines = js(pg, DIRS)
    ok("the same directions, codes, names and figures, in the tab's order",
       isinstance(lines, list) and isinstance(folds, list) and len(lines) >= 2 and [(x["code"], x["name"], x["pct"]) for x in lines] == [(f["code"], f["name"], f["pct"]) for f in folds], (lines, folds))
    target = lines[1] if isinstance(lines, list) and len(lines) > 1 else None
    if target:
        pg.click('#readroot .rovrow[data-rover="%s"]' % target["to"]); pg.wait_for_timeout(300)
        st = js(pg, SHAPE); f2 = js(pg, FOLDS)
        ok("a line opens the Directions tab on that direction, unfolded, the others as they were",
           isinstance(st, dict) and st.get("lit") == "Directions" and isinstance(f2, list) and [x for x in f2 if x["id"] == target["to"].split("|", 1)[1]][0]["open"] is True and sum(1 for x in f2 if x["open"]) == 1, (st.get("lit") if isinstance(st, dict) else st, f2))
    js(pg, "()=>READING.open('group', 'overview')"); pg.wait_for_timeout(300)
    pg.click('#readroot .rdoor h3 .rgo[data-rtab="dir"]'); pg.wait_for_timeout(300)
    ok("the door's title opens the Directions tab", (js(pg, SHAPE) or {}).get("lit") == "Directions")

    print("\n── 4 · the functions door")
    js(pg, "()=>READING.open('group', 'overview')"); pg.wait_for_timeout(300)
    fns = js(pg, FNS)
    want = js(pg, "()=>FUNCTION_KEYS.filter(k => fnShows(k)).map(k => ({ fn: k, name: FUNCTIONS[k].name }))")
    ok("every shown function the viewer reaches, by name, in the row's order", isinstance(fns, list) and fns and [(x["fn"], x["name"]) for x in fns] == [(x["fn"], x["name"]) for x in want], (fns, want))
    # a function's line is its own Overall performance's headline: the Measures figure where it plans in
    # pillars or in objectives, the Projects figure where it plans in projects (the division's table's rule)
    agree = []
    for x in (fns if isinstance(fns, list) else [])[:3]:
        own = js(pg, """(k)=>{ READING.open('fn:' + k, 'performance'); const figs = [...document.querySelectorAll('#readroot .rwbody .rthree .rfig > b')].map(b => b.textContent);
          const way = fnFormat(FUNCTIONS[k]); return { way: way, fig: way === 'projects' ? figs[1] : figs[0] }; }""", x["fn"])
        agree.append((x["fn"], x["pct"], own))
    ok("…each line's figure is the function's own Overall performance headline", agree and all(a[1] == (a[2] or {}).get("fig") for a in agree), agree)
    js(pg, "()=>READING.open('group', 'overview')"); pg.wait_for_timeout(300)
    if isinstance(fns, list) and fns:
        pg.click('#readroot .rovrow[data-rgo="fn:%s"]' % fns[0]["fn"]); pg.wait_for_timeout(300)
        st = js(pg, SHAPE)
        # a function has no Overview of ours: it opens on its own first tab (its Foundation, which a
        # function's page happens to call Overview too — the address says which it is)
        ok("a line opens the window on that function, on its own first tab",
           isinstance(st, dict) and (st.get("state") or {}).get("target") == "fn:" + fns[0]["fn"] and (st.get("state") or {}).get("tab") == "foundation" and st.get("lit") == (st.get("tabs") or [None])[0] and st.get("doors") == [], st)

    print("\n── 5 · the plan door")
    js(pg, "()=>READING.open('group', 'overview')"); pg.wait_for_timeout(300)
    pg.click('#readroot .rplan [data-rover="plan"]'); pg.wait_for_timeout(300)
    st = js(pg, SHAPE); f3 = js(pg, FOLDS)
    ok("Read the plan opens the Directions with every direction unfolded", isinstance(st, dict) and st.get("lit") == "Directions" and isinstance(f3, list) and f3 and all(x["open"] for x in f3), (st.get("lit") if isinstance(st, dict) else st, f3))

    print("\n── 6 · a reader's seat, and the other shapes")
    reader = js(pg, "()=>(PEOPLE.find(p => READING.readerSeat(p)) || PEOPLE.find(p => !SMPRules.isOffice(world(), p)) || {}).key")
    js(pg, "(k)=>{ READING.close(); switchViewer(k); }", reader); pg.wait_for_timeout(400)
    js(pg, "()=>{ try { READING.close(); } catch (e) {} READING.open('group'); }"); pg.wait_for_timeout(400)
    st = js(pg, SHAPE)
    ok("a reader opens on the Overview too, with no Print on the plan door", isinstance(st, dict) and st.get("lit") == "Overview" and st.get("planPrint") is False, st)
    js(pg, "(k)=>{ READING.close(); switchViewer(k); }", js(pg, "()=>(PEOPLE.find(p=>SMPRules.isOffice(world(), p))||{}).key")); pg.wait_for_timeout(300)
    # Raya's shape again: a fresh load
    pg.goto("file://" + FILE); pg.wait_for_timeout(900)
    js(pg, "()=>{ switchViewer((PEOPLE.find(p=>SMPRules.isOffice(world(), p))||{}).key); try { READING.close(); } catch (e) {} READING.open('group'); }"); pg.wait_for_timeout(400)
    st = js(pg, SHAPE)
    uw = js(pg, "()=>L1('unitword') + 's'")
    ok("Raya's group: the units' door and the functions', no empty directions door, no plan door",
       isinstance(st, dict) and st.get("lit") == "Overview" and (st.get("doors") or [None])[0] == uw and not any(d == "Directions" for d in st.get("doors", [])) and st.get("plan") is False, st)
    n_units = js(pg, "()=>document.querySelectorAll('#readroot .rovrow[data-rgo]:not([data-rgo^=\"fn:\"])').length")
    ok("…one line per unit reached", n_units == js(pg, "()=>activeKeys().length"), (n_units, js(pg, "()=>activeKeys().length")))
    first_unit = js(pg, "()=>activeKeys()[0]")
    pg.click('#readroot .rovrow[data-rgo="%s"]' % first_unit); pg.wait_for_timeout(300)
    st = js(pg, SHAPE)
    ok("a unit's line opens the window on it, on its Overview: its directions and the plan, no functions, no units",
       isinstance(st, dict) and (st.get("state") or {}).get("target") == first_unit and st.get("lit") == "Overview" and (st.get("doors") or [None])[0] == "Directions" and len(st.get("doors") or []) == 1 and st.get("plan") is True, st)
    ok("no page errors", not errs, errs)
    b.close()

print()
if fails:
    print("FAILED %d: %s" % (len(fails), "; ".join(fails)))
    raise SystemExit(1)
print("reading-overview: all green")
