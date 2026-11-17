"""THE WHOLE STRATEGY ON PAPER, THE OFFICE'S ALONE (§787).

Islam, 2026-11-17: *"can we have printing options from the reading option
as a printing option. to print the strategy in a good format"*; of the two
shapes drawn, *"option 1, the whole strategy"*; of who may, *"smo only"*.

IT PRINTS WHAT THE WINDOW SHOWS (§305's argument, for the deck): every
section of the paper is the same builder the tab calls, so the paper cannot
disagree with the screen; a builder of its own would be a second answer to
"what is in this tab" that drifts at the next change. The way out is the
browser's print dialog — paper or Save as PDF — and the platform never holds
PDF bytes.

WHAT IS ASSERTED, and why each one can fail:

  1 · THE READERS ARE ASKED FOR BY NAME FIRST (§215): a build without them
      dies at the first press and reports nothing, which reads as a pass.

  2 · THE GATE, BOTH ENDS (§94.2): the office sees Print in the strip,
      directly before Exit, saying what it does on hover; a reader's seat
      sees no Print, and the reader (`READING.print`) refuses — a build that
      drew the button for everybody, or drew it for nobody, fails here.

  3 · THE PRESS BUILDS THE DOCUMENT AND ASKS TO PRINT. `window.print` is
      stubbed and counted; the title is the document's name for the
      browser's own header and footer; the theme is light for the dialog.

  4 · NOTHING OF IT SHOWS ON THE SCREEN while the dialog is up — the window
      stays as it was; the document is paper only.

  5 · ON PAPER: the cover, then every tab the subject offers in the tabs'
      own order and under the tabs' own names; every direction open with
      its two tables; the fold's own controls gone; the platform, the strip,
      the row and the tabs absent; the colours kept (print-color-adjust) —
      a standing bar in outline is not a standing; the phone layout NOT
      applied to a page narrower than 760px.

  6 · THE PAPER SAYS WHAT THE SCREEN SAYS: the Foundation section is the
      tab's own markup, character for character.

  7 · THE DIALOG CLOSING PUTS EVERYTHING BACK — the document gone, the
      theme, the title, the window open on the same subject and tab.

  8 · THE KEY: Ctrl+P in the window prints for the office and does nothing
      for a reader.

  9 · AND THE COMPANY PRINTS TOO, its tabs in order.
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
    """Every probe degrades rather than dying (§215)."""
    try:
        return pg.evaluate(expr, arg) if arg is not None else pg.evaluate(expr)
    except Exception as e:                                    # noqa: BLE001
        return {"threw": str(e).strip().split("\n")[0][:140]}


STRIP = """()=>{
  const top = document.querySelector('#readroot .rwtop');
  const b = top && top.querySelector('[data-rprint]');
  const x = top && top.querySelector('[data-rexit]');
  return { print: !!b, text: b ? b.textContent.trim() : null, title: b ? b.getAttribute('title') : null,
           beforeExit: !!(b && x && b.nextElementSibling === x),
           shown: b ? getComputedStyle(b).display !== 'none' : null };
}"""

NOW = """()=>({
  printed: window.__printed || 0,
  doc: !!document.querySelector('#readroot .rprintdoc'),
  rprinting: document.body.classList.contains('rprinting'),
  theme: document.documentElement.getAttribute('data-theme'),
  title: document.title,
  open: READING.isOpen(), state: READING.state()
})"""

SCREEN = """()=>{
  const d = document.querySelector('#readroot .rprintdoc');
  const body = document.querySelector('#readroot .rwbody');
  return { docShown: d ? getComputedStyle(d).display !== 'none' : null,
           bodyShown: body ? getComputedStyle(body).display !== 'none' : null,
           sumShown: (()=>{ const s = body && body.querySelector('.rfold .rsum'); return s ? getComputedStyle(s).display !== 'none' : null; })() };
}"""

PAPER = """()=>{
  const r = document.getElementById('readroot');
  const d = r.querySelector('.rprintdoc');
  const shown = e => !!e && getComputedStyle(e).display !== 'none';
  const cover = d && d.querySelector('.rpcover');
  const secs = d ? [...d.querySelectorAll('.rpsec')] : [];
  const dirs = d ? [...d.querySelectorAll('.rdir')] : [];
  const th = d && d.querySelector('.rtable th');
  const wrap = document.querySelector('.wrap') || document.getElementById('panel');
  const fold = d && d.querySelector('.rfold');
  const sum = fold && fold.querySelector('.rsum');
  return {
    docShown: shown(d),
    cover: cover ? cover.textContent.replace(/\\s+/g, ' ').trim() : null,
    coverShown: shown(cover),
    sections: secs.map(s => s.querySelector('h2').textContent.trim()),
    sectionsShown: secs.every(shown),
    tabs: [...r.querySelectorAll('.rwtabs button')].map(b => b.textContent.trim()),
    dirs: dirs.length,
    dirsOpen: dirs.filter(x => x.classList.contains('open') && shown(x.querySelector('.rmore'))).length,
    dirsWithTables: dirs.filter(x => x.querySelectorAll('.rmore .rtable').length >= 1).length,
    tools: d ? d.querySelectorAll('.rtools').length : null,
    chrome: ['.rwtop', '.rwnav', '.rwtabs', '.rwbody'].map(s => shown(r.querySelector(s))),
    platform: wrap ? shown(wrap) : null,
    rootStatic: getComputedStyle(r).position,
    adjust: th ? (getComputedStyle(th).printColorAdjust || getComputedStyle(th).webkitPrintColorAdjust || '') : '',
    headBg: th ? getComputedStyle(th).backgroundColor : '',
    foldCursor: fold ? getComputedStyle(fold).cursor : null,
    sumShown: sum ? shown(sum) : null,
    width: d ? d.getBoundingClientRect().width : 0
  };
}"""

FOUND_PAPER = "()=>{ const s = document.querySelector('#readroot .rpsec[data-rptab=found]'); if (!s) return null; const c = s.cloneNode(true); c.querySelector('h2').remove(); return c.innerHTML; }"
FOUND_SCREEN = "()=>document.querySelector('#readroot .rwbody').innerHTML"

with sync_playwright() as p:
    b = p.chromium.launch(executable_path=os.environ.get("SMP_CHROME"))
    pg = b.new_page(viewport={"width": 1440, "height": 860})
    pg.add_init_script("try{sessionStorage.setItem('smp.welcome.seen','1');"
                       "sessionStorage.setItem('smp.welcome.done','1');"
                       "sessionStorage.setItem('smp.tour.later','1');"
                       "localStorage.setItem('smp.tour.never','1');}catch(e){}")
    errs = []
    pg.on("pageerror", lambda e: errs.append(str(e)))
    pg.goto("file://" + FILE)
    pg.wait_for_timeout(900)

    print("\n── 1 · the readers this check needs")
    have = js(pg, "()=>({ print: typeof READING.print === 'function', mayPrint: typeof READING.mayPrint === 'function', isOffice: typeof SMPRules.isOffice === 'function' })")
    for k in ("print", "mayPrint", "isOffice"):
        ok("the build carries " + k, isinstance(have, dict) and have.get(k) is True, have)

    office = js(pg, "()=>(PEOPLE.find(p=>SMPRules.isOffice(world(), p))||{}).key")
    reader = js(pg, "()=>(PEOPLE.find(p=>!SMPRules.isOffice(world(), p) && SMPRules.grantAtPage(world(), p, 'performance', activeKeys()[0]))||{}).key")
    unit = js(pg, "()=>activeKeys()[0]")
    org = js(pg, "()=>String(GROUP.org||'').trim()")
    review = js(pg, "()=>String((REVIEW&&REVIEW.name)||'')")
    ok("an office seat, a reader's seat and a unit to read", bool(office) and bool(reader) and bool(unit), (office, reader, unit))
    js(pg, "()=>{ window.__printed = 0; window.print = function(){ window.__printed++; }; }")

    print("\n── 2 · the gate, both ends")
    js(pg, "(k)=>{ switchViewer(k); }", reader)
    pg.wait_for_timeout(400)
    js(pg, "(u)=>{ try{READING.close()}catch(e){}; READING.open(u); }", unit)
    pg.wait_for_timeout(400)
    s = js(pg, STRIP)
    ok("a reader's seat opens the window with no Print in the strip", isinstance(s, dict) and s.get("print") is False, s)
    ok("…and the reader refuses to print for it", js(pg, "()=>READING.print()") is False and js(pg, "()=>window.__printed") == 0 and js(pg, "()=>!document.querySelector('#readroot .rprintdoc')") is True)
    js(pg, "()=>READING.close()")
    js(pg, "(k)=>{ switchViewer(k); }", office)
    pg.wait_for_timeout(400)
    js(pg, "(u)=>{ try{READING.close()}catch(e){}; READING.open(u); }", unit)
    pg.wait_for_timeout(400)
    s = js(pg, STRIP)
    ok("the office opens the window with Print in the strip", isinstance(s, dict) and s.get("print") is True and s.get("shown") is True, s)
    ok("…directly before Exit", isinstance(s, dict) and s.get("beforeExit") is True, s)
    ok("…saying Print, and on hover that it saves as PDF too", isinstance(s, dict) and s.get("text") == "Print" and s.get("title") == "Print or save as PDF", s)

    print("\n── 3 · the press builds the document and asks to print")
    js(pg, "()=>document.documentElement.setAttribute('data-theme','dark')")
    was_title = js(pg, "()=>document.title")
    pg.click("#readroot [data-rprint]")
    pg.wait_for_timeout(300)
    n = js(pg, NOW)
    ok("the press asks the browser to print, once", isinstance(n, dict) and n.get("printed") == 1, n)
    ok("…with the document built in the window", isinstance(n, dict) and n.get("doc") is True and n.get("rprinting") is True, n)
    ok("…the theme light for the dialog", isinstance(n, dict) and n.get("theme") == "light", n)
    subj = js(pg, "(u)=>UNITS[u].name", unit)
    ok("…and the title the document's name, for the browser's own header and footer",
       isinstance(n, dict) and n.get("title") == " · ".join([x for x in ["Strategy", org, subj] if x]), n)

    print("\n── 4 · nothing of it shows on the screen")
    sc = js(pg, SCREEN)
    ok("on a screen the document is not shown and the window's own page is", isinstance(sc, dict) and sc.get("docShown") is False and sc.get("bodyShown") is True, sc)

    print("\n── 5 · on paper")
    pg.emulate_media(media="print")
    pg.wait_for_timeout(200)
    pp = js(pg, PAPER)
    ok("the document is the only thing: the platform, the strip, the row, the tabs and the page are absent",
       isinstance(pp, dict) and pp.get("docShown") is True and pp.get("platform") is False and pp.get("chrome") == [False, False, False, False] and pp.get("rootStatic") == "static", pp)
    ok("the cover carries the client, the subject, the period and the day",
       isinstance(pp, dict) and pp.get("coverShown") is True and all(x in (pp.get("cover") or "") for x in [org, subj, review, "Printed"]), pp.get("cover") if isinstance(pp, dict) else pp)
    ok("every tab the subject offers, in the tabs' own order, under the tabs' own names",
       isinstance(pp, dict) and pp.get("sections") == pp.get("tabs") and len(pp.get("tabs") or []) >= 3 and pp.get("sectionsShown") is True, pp)
    ok("every direction open, with its tables",
       isinstance(pp, dict) and (pp.get("dirs") or 0) >= 2 and pp.get("dirsOpen") == pp.get("dirs") and pp.get("dirsWithTables") == pp.get("dirs"), pp)
    ok("the fold's own controls are gone — paper has no press", isinstance(pp, dict) and pp.get("tools") == 0 and pp.get("foldCursor") == "default", pp)
    ok("the colours survive the printer", isinstance(pp, dict) and pp.get("adjust") == "exact" and pp.get("headBg") not in ("", "rgba(0, 0, 0, 0)", "transparent"), pp)
    # the phone layout is the screen's: a page narrower than 760px keeps the direction's summary
    pg.set_viewport_size({"width": 700, "height": 1000})
    pg.wait_for_timeout(200)
    narrow = js(pg, PAPER)
    ok("a page narrower than 760px keeps its columns (the phone layout is the screen's alone)", isinstance(narrow, dict) and narrow.get("sumShown") is True and narrow.get("width") > 600, narrow)

    print("\n── 6 · the paper says what the screen says")
    paper_found = js(pg, FOUND_PAPER)
    pg.emulate_media(media="screen")
    pg.set_viewport_size({"width": 1440, "height": 860})
    pg.wait_for_timeout(200)
    # the window stays on Foundation, so its body is the same builder's answer
    screen_found = js(pg, FOUND_SCREEN)
    ok("the Foundation section is the tab's own markup, character for character", isinstance(paper_found, str) and paper_found == screen_found, (len(paper_found or ""), len(screen_found or "")))

    print("\n── 7 · the dialog closing puts everything back")
    js(pg, "()=>window.dispatchEvent(new Event('afterprint'))")
    pg.wait_for_timeout(200)
    n = js(pg, NOW)
    ok("the document is gone, the theme and the title are back", isinstance(n, dict) and n.get("doc") is False and n.get("rprinting") is False and n.get("theme") == "dark" and n.get("title") == was_title, n)
    ok("…and the window is open where it was", isinstance(n, dict) and n.get("open") is True and (n.get("state") or {}).get("target") == unit and (n.get("state") or {}).get("tab") == "foundation", n)
    js(pg, "()=>document.documentElement.setAttribute('data-theme','light')")

    print("\n── 8 · the key")
    pg.focus("#readroot")
    pg.keyboard.press("Control+p")
    pg.wait_for_timeout(300)
    n = js(pg, NOW)
    ok("Ctrl+P in the window prints for the office", isinstance(n, dict) and n.get("printed") == 2 and n.get("doc") is True, n)
    js(pg, "()=>window.dispatchEvent(new Event('afterprint'))")
    pg.wait_for_timeout(200)
    js(pg, "()=>READING.close()")
    js(pg, "(k)=>{ switchViewer(k); }", reader)
    pg.wait_for_timeout(400)
    js(pg, "(u)=>{ try{READING.close()}catch(e){}; READING.open(u); }", unit)
    pg.wait_for_timeout(400)
    pg.focus("#readroot")
    pg.keyboard.press("Control+p")
    pg.wait_for_timeout(300)
    n = js(pg, NOW)
    ok("…and does nothing for a reader", isinstance(n, dict) and n.get("printed") == 2 and n.get("doc") is False, n)
    js(pg, "()=>READING.close()")

    print("\n── 9 · the company prints too")
    js(pg, "(k)=>{ switchViewer(k); }", office)
    pg.wait_for_timeout(400)
    opened = js(pg, "()=>{ try{READING.close()}catch(e){}; return READING.open('group') && READING.state().target; }")
    pg.wait_for_timeout(400)
    if opened == "group":
        pg.click("#readroot [data-rprint]")
        pg.wait_for_timeout(300)
        pg.emulate_media(media="print")
        pp = js(pg, PAPER)
        ok("the company's paper: its tabs in order, the cover naming it",
           isinstance(pp, dict) and pp.get("sections") == pp.get("tabs") and len(pp.get("tabs") or []) >= 3 and org in (pp.get("cover") or ""), pp)
        pg.emulate_media(media="screen")
        js(pg, "()=>window.dispatchEvent(new Event('afterprint'))")
    else:
        ok("the company can be read by the office", False, opened)

    ok("no page errors", not errs, errs)
    b.close()

print()
if fails:
    print("FAILED %d: %s" % (len(fails), "; ".join(fails)))
    raise SystemExit(1)
print("reading-print: all green")
