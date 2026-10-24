"""THE CLIENT PLATFORM AT 80% ON A COMPUTER, AND NOTHING SPILLS (§630).

Islam, of a Setup table: *"cells content is overflowing and I believe the page
needs to be 80% smaller like what we did in the console page"* — *"by 80% I
mean it goes to 80% of the current size"* — then, of the mockup, *"proceed"*.

WHAT IS ASSERTED IS THE PROBLEM (§94.8), BOTH ENDS (§94.2):

  1 · THE ZOOM. 0.8 at 1440 wide; 1 at 900, where 80% would put the words
      under a readable size; and 1 while a deck is being shown, because a
      projection at 80% is a smaller deck on the same wall.
  2 · BUSINESS UNITS HOLDS ITS CELLS. Five units given long names and
      "Objectives & actions" (the reported table): at 1280, 1366, 1440 and
      1920 no cell's content passes its cell's edge and no heading is wider
      than its column; and Plans in never spills even at 900 and 1100, where
      its count goes under the word and the word wraps in its own tag.
  3 · WHAT REACHES THE BOTTOM STILL DOES. A zoomed `100vh` is 80% of the
      window (measured), so the Setup list and the register's box are asked
      to end where the window ends, not 20% short of it.
  4 · WHAT IS PLACED FROM A MEASUREMENT LANDS BY ITS ANCHOR. A box reports
      the window's pixels and is placed in the page's (§630's helper), so the
      row menu, the people list under a cell, a long list's popup and the ask
      box are each asked to sit beside what opened them — the place a build
      without the conversion misses by a fifth of the distance from the
      corner.

Over file://; nothing here needs a server. EVERY PROBE DEGRADES (§215).

Run: python3 qa-run.py checks/platform-80.py
     SMP_BUILT=<another build> …   # prove it can fail (§276)
"""
import os, json
from playwright.sync_api import sync_playwright

URL = "file://" + os.path.abspath(os.environ.get("SMP_BUILT") or
      os.path.join(os.path.dirname(__file__), "..", "strategy-management-platform.html"))
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


ZOOM = "()=>parseFloat(getComputedStyle(document.documentElement).zoom)||1"
SETUP = """()=>{ var names=['Retail Expansion Accross Egypt','Maximizing Current Stores','FMCG Growth',
    'Exploring Catering and Events','E-Commerce Growth'];
  UNIT_KEYS.slice(0,5).forEach(function(k,i){ var u=UNITS[k]; u.name=names[i]; u.navName=names[i];
    u.format='objectives'; u.actions=[1,2,3,4,5].slice(0,3+i%3).map(function(n){ return {id:k+'-A'+n, name:'a'+n}; }); });
  current='setup'; currentSub='units'; paint(); }"""
# A cell's content is measured by every box inside it; a heading by its own
# scroll width — the same two questions the reported screenshot answers.
SPILL = """(only)=>{ const out=[];
  document.querySelectorAll('table.unitcfg tbody tr').forEach((tr,ri)=>{
    [...tr.cells].forEach((td,ci)=>{
      if (only !== null && ci !== only) return;
      if (ci===1 || ci===2) return;      /* the names clip with an ellipsis, on purpose */
      const r=td.getBoundingClientRect(); let mx=r.left;
      td.querySelectorAll('*').forEach(e=>{ const b=e.getBoundingClientRect(); if (b.width) mx=Math.max(mx,b.right); });
      if (mx > r.right + 0.5) out.push(ri+':'+ci+' +'+Math.round(mx-r.right)); }); });
  return { cells: out,
           heads: [...document.querySelectorAll('table.unitcfg thead th')]
             .filter(th=>th.scrollWidth > th.clientWidth + 1).map(th=>th.textContent.trim()) }; }"""


def page(b, w, h=900):
    pg = b.new_page(viewport={"width": w, "height": h})
    pg.add_init_script("try{sessionStorage.setItem('smp.welcome.done','1');"
                       "localStorage.setItem('smp.tour.never','1')}catch(e){}")
    pg.on("pageerror", lambda e: errs.append(str(e)))
    pg.goto(URL)
    pg.wait_for_timeout(1300)
    return pg


with sync_playwright() as p:
    b = p.chromium.launch(executable_path=os.environ.get("SMP_CHROME") or "/opt/pw-browsers/chromium",
                          args=["--no-sandbox", "--disable-dev-shm-usage"])

    print("\n1 · the page is drawn at 80% on a computer, and only there")
    pg = page(b, 1440)
    ck("80% at 1440 wide", abs((ev(pg, ZOOM) or 1) - 0.8) < 1e-6, ev(pg, ZOOM))
    ev(pg, "()=>document.body.classList.add('presenting')")
    ck("100% while a deck is shown", ev(pg, ZOOM) == 1, ev(pg, ZOOM))
    ev(pg, "()=>document.body.classList.remove('presenting')")
    pg.close()
    pg = page(b, 900)
    ck("100% at 900 wide, where 80% would be too small to read", ev(pg, ZOOM) == 1, ev(pg, ZOOM))
    pg.close()

    print("\n2 · Business units: nothing spills at a computer's widths")
    for w in (1280, 1366, 1440, 1920):
        pg = page(b, w)
        ev(pg, SETUP); pg.wait_for_timeout(400)
        r = ev(pg, SPILL, None) or {}
        ck("at %d no cell spills and no heading overlaps" % w,
           r.get("cells") == [] and r.get("heads") == [], r)
        pg.close()
    for w in (900, 1100):
        pg = page(b, w)
        ev(pg, SETUP); pg.wait_for_timeout(400)
        r = ev(pg, SPILL, 4) or {}
        ck("at %d Plans in still stays in its cell" % w, r.get("cells") == [], r)
        pg.close()

    print("\n3 · what reaches the bottom of the window still does")
    pg = page(b, 1440)
    ev(pg, SETUP); pg.wait_for_timeout(400)
    rail = ev(pg, "()=>{ const r=document.querySelector('.setuprail').getBoundingClientRect(); return {bottom:r.bottom, win:innerHeight}; }") or {}
    ck("the Setup list ends at the window's foot, not a fifth short of it",
       rail.get("win", 0) - rail.get("bottom", 0) < 40, rail)
    ev(pg, "()=>{ current='setup'; currentSub='people'; paint(); }"); pg.wait_for_timeout(500)
    box = ev(pg, "()=>{ const e=document.querySelector('.cfg.peoplebox'); if(!e) return null; const r=e.getBoundingClientRect(); return {bottom:r.bottom, win:innerHeight}; }") or {}
    ck("the register's box ends at the window's foot", box and box.get("win", 0) - box.get("bottom", 0) < 40, box)

    print("\n4 · what is placed from a measurement lands beside what opened it")
    ev(pg, SETUP); pg.wait_for_timeout(400)
    try:
        pg.locator("[data-umenu]").first.click(timeout=3000)
    except Exception:
        errs.append("PROBE: no row menu")
    pg.wait_for_timeout(300)
    m = ev(pg, """()=>{ const m=document.querySelector('.kmenu'), bt=document.querySelector('[data-umenu]');
        if(!m||!bt) return null; const a=bt.getBoundingClientRect(), r=m.getBoundingClientRect();
        return {gap: r.top - a.bottom, right: a.right - r.right}; }""") or {}
    ck("the row menu opens under its button, right edges together",
       0 <= m.get("gap", -9) <= 6 and abs(m.get("right", 99)) <= 2, m)
    pg.mouse.click(700, 130); pg.wait_for_timeout(250)
    k = ev(pg, "()=>UNIT_KEYS[0]")
    try:
        pg.locator('[data-ocell="units|%s|head"]' % k).dblclick(timeout=3000)
    except Exception:
        errs.append("PROBE: no head cell")
    pg.wait_for_timeout(300)
    o = ev(pg, """()=>{ const c=document.querySelector('td.ocellopen'), p=c&&c.querySelector('.ocellpop');
        if(!p) return null; const a=c.getBoundingClientRect(), r=p.getBoundingClientRect();
        return {top: r.top - a.bottom, left: r.left - a.left}; }""") or {}
    ck("the people list opens under its cell", abs(o.get("top", 99)) <= 4 and abs(o.get("left", 99)) <= 2, o)
    pg.keyboard.press("Escape"); pg.wait_for_timeout(250)
    ev(pg, "()=>{ current='setup'; currentSub='people'; paint(); }"); pg.wait_for_timeout(400)
    try:
        pg.locator('[data-pcell$="|Unit or function"]').first.dblclick(timeout=3000)
    except Exception:
        errs.append("PROBE: no unit cell on the register")
    pg.wait_for_timeout(400)
    s = ev(pg, """()=>{ const p=document.querySelector('.sspop'), b=document.querySelector('td.pcellopen .ssbtn');
        if(!p||!b) return null; const a=b.getBoundingClientRect(), r=p.getBoundingClientRect();
        return {top: r.top - a.bottom, left: r.left - a.left}; }""") or {}
    ck("a long list opens under its button", 0 <= s.get("top", -9) <= 6 and abs(s.get("left", 99)) <= 2, s)
    pg.keyboard.press("Escape"); pg.keyboard.press("Escape"); pg.wait_for_timeout(200)
    ev(pg, "()=>{ current='setup'; currentSub='access'; paint(); }"); pg.wait_for_timeout(500)
    a = ev(pg, """()=>{ const b=[...document.querySelectorAll('[data-acm]')].filter(x=>x.offsetParent && !x.disabled)[0];
        if(!b) return null; b.click(); const box=document.querySelector('.askbox'); if(!box) return {nobox:true};
        const a=b.getBoundingClientRect(), r=box.getBoundingClientRect();
        return {below: r.top - a.bottom, above: a.top - r.bottom}; }""") or {}
    ck("the ask box sits just beside the control it asks about",
       (0 <= a.get("below", -99) <= 14) or (0 <= a.get("above", -99) <= 14), a)
    pg.close()
    b.close()

ck("no page errors", not [e for e in errs if not e.startswith("PROBE")], errs[:3])
ck("every probe answered (§215)", not [e for e in errs if e.startswith("PROBE")], errs[:3])
print("\n%d failure%s" % (bad, "" if bad == 1 else "s"))
print("platform-80: " + ("all assertions passed" if not bad else "RED"))
raise SystemExit(1 if bad else 0)
