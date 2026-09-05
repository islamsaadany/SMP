"""THE DECK AS A PDF (§296).

Islam, having asked for the presentation to be downloadable beside the plan:
*"let's go with the pdf for now."*

THE FILE IS THE DECK, PRINTED — never a second builder writing the review
into a .pptx. That was the other option and its cost was stated before he
chose: this deck has moved four times in a fortnight (§243, §253, §254,
§259), so a second builder would be two answers to "what is on this slide"
and they would part company at the next change, silently, with the file
still opening and still looking right (§53.5, §294). Printing what the
platform already assembled cannot drift by construction.

WHAT IS ASSERTED, and why each one can fail:

  1 · THE TWO NEW READERS ARE ASKED FOR BY NAME FIRST (§215). A build
      without them dies at the first press and reports nothing, which reads
      exactly like a pass.

  2 · THE ENTRY IS BESIDE PRESENT, on a unit, a capability function AND a
      function that plans in pillars (§53.5, A15) — and it carries the word
      PDF, because the file cannot be edited and the press opens the
      browser's print dialog rather than downloading at once.

  3 · PRESSING IT OPENS THE REAL DECK AND ASKS TO PRINT. `window.print` is
      stubbed and counted; a build that opened the deck and never printed,
      or printed without opening one, fails here.

  4 · WHAT PRINTS IS EVERY SLIDE, ONE PER PAGE, AT THE SIZE THEY WERE
      AUTHORED. Measured under print emulation: every slide displayed, each
      1600×900, the deck's window-fit transform gone.

  5 · AND NOTHING ELSE PRINTS — the deck's own bar and the whole platform
      behind it are absent, or the PDF opens on a page of navigation.

  6 · THE COLOURS SURVIVE. A browser drops backgrounds when it prints, which
      would take the navy table headers, §259's blue dividers and every
      scoring band with it — a deck that reads as unscored rather than as
      printed.

  7 · BOTH ENDS (§94.2): on a SCREEN the deck still shows exactly one slide.
      A build that simply drew them all would satisfy every assertion in 4
      and would have broken the projector.

  8 · FIT-TO-WINDOW IS TURNED OFF BEFORE THE PAGES ARE MEASURED, AND PUT
      BACK. It persists between openings (§69.7) and resizes `.deck`, so the
      fit pass would split the tables against a box that is not the page and
      the PDF would break in different places from the deck the presenter
      rehearsed. Asserted as a DIFFERENCE — the window-fitted deck and the
      16:9 one carry different numbers of slides here — so a build that
      ignored the toggle is caught rather than flattered.

  9 · THE DECK CLOSES WHEN THE DIALOG DOES, and the press ends where it
      started.
"""
import os
from playwright.sync_api import sync_playwright

HERE = os.path.dirname(os.path.abspath(__file__))
FILE = os.environ.get("SMP_BUILT") or os.path.join(
    os.path.dirname(HERE), "strategy-management-platform.html")
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


GO = ("(t)=>{ current = t; currentSub = t.indexOf('fn:')===0 ? 'fnperf' "
      ": 'performance'; paint(); }")

MENU = """()=>{
  const acts = document.querySelector('#subtabs .tabacts');
  const d = acts ? acts.querySelector('.dlmenu:not(.bandsmenu)') : null;
  if (!d) return { entries: null };
  const rows = [...d.querySelectorAll('.menu > *')];
  return {
    entries: rows.map(x => (x.textContent||'').trim().split('\\n')[0].trim()),
    pdf: rows.findIndex(x => x.hasAttribute('data-deckpdf')),
    present: rows.findIndex(x => x.hasAttribute('data-present')),
    sub: rows.map(x => { const s = x.querySelector('.dlsub');
      return s ? (s.textContent||'').trim() : ''; })
  };
}"""

# What the deck looks like right now, whatever medium is being emulated.
SHAPE = """()=>{
  const root = document.getElementById('deckroot');
  const deck = root.querySelector('.deck');
  const sl = [...deck.querySelectorAll('.dslide')];
  const shown = sl.filter(s => getComputedStyle(s).display !== 'none');
  const box = e => { const r = e.getBoundingClientRect();
    return [Math.round(r.width), Math.round(r.height)]; };
  const bar = root.querySelector('.deckbar');
  const chrome = document.querySelector('.wrap') || document.getElementById('panel');
  const th = deck.querySelector('.dslide thead th');
  return {
    open: root.classList.contains('on'),
    fitwin: root.classList.contains('fitwin'),
    slides: sl.length,
    shown: shown.length,
    sizes: [...new Set(shown.map(s => box(s).join('x')))],
    /* THE LAYOUT BOX, NEVER THE PAINTED ONE. `.deck` is scaled into the
       window by a transform (§69), so its bounding rect is the fit and its
       clientWidth/Height is the box the slides were AUTHORED and FITTED in —
       which is the one that has to be the page. Measuring the rect reported
       1490x838 on a correct build and failed. */
    deckW: deck.clientWidth, deckH: deck.clientHeight,
    transform: getComputedStyle(deck).transform,
    barShown: bar ? getComputedStyle(bar).display !== 'none' : null,
    chromeShown: chrome ? getComputedStyle(chrome).display !== 'none' : null,
    adjust: th ? (getComputedStyle(th).printColorAdjust ||
                  getComputedStyle(th).webkitPrintColorAdjust || '') : '',
    headBg: th ? getComputedStyle(th).backgroundColor : ''
  };
}"""

TARGETS = [
    ("a business unit", "()=>activeKeys()[0]"),
    ("a capability function",
     "()=>'fn:'+FUNCTION_KEYS.find(k=>fnShows(k)&&!fnPlansInPillars(FUNCTIONS[k]))"),
    ("a function that plans in pillars",
     "()=>'fn:'+FUNCTION_KEYS.find(k=>fnShows(k)&&fnPlansInPillars(FUNCTIONS[k]))"),
]

with sync_playwright() as p:
    b = p.chromium.launch(executable_path=os.environ.get("SMP_CHROME"))
    pg = b.new_page(viewport={"width": 1600, "height": 900})
    pg.add_init_script("try{sessionStorage.setItem('smp.welcome.seen','1');"
                       "sessionStorage.setItem('smp.welcome.done','1');"
                       "sessionStorage.setItem('smp.tour.later','1');}catch(e){}")
    errs = []
    pg.on("pageerror", lambda e: errs.append(str(e)))
    pg.goto("file://" + FILE)
    pg.wait_for_timeout(900)

    print("\n── 1 · the readers this check needs")
    have = js(pg, """()=>({
      deckToPdf: typeof deckToPdf === 'function',
      openDeckTarget: typeof openDeckTarget === 'function',
      closeDeck: typeof closeDeck === 'function'
    })""")
    for k in ("deckToPdf", "openDeckTarget", "closeDeck"):
        ok("the build carries " + k, have.get(k) is True, have)

    print("\n── 2 · the entry, beside Present, on both sides of the switch")
    for label, pick in TARGETS:
        t = js(pg, pick)
        pg.evaluate(GO, t)
        pg.wait_for_timeout(600)
        m = js(pg, MENU)
        e = (m or {}).get("entries")
        ok("%s draws the Presentation menu" % label, isinstance(e, list) and e, m)
        if not isinstance(e, list) or not e:
            continue
        ok("%s offers the presentation as a file" % label,
           (m.get("pdf") or -1) >= 0, e)
        ok("%s puts it directly after Present" % label,
           m.get("present") == 0 and m.get("pdf") == 1, m)
        sub = (m.get("sub") or [""] * 9)[m.get("pdf") or 0]
        ok("%s says PDF, so the format is not a surprise" % label,
           "PDF" in sub, sub)

    # From here on, one subject is enough: the entry resolves through the same
    # `openDeckTarget()` the Present button uses, and §2 asserted all three
    # draw it.
    t = js(pg, TARGETS[0][1])
    pg.evaluate(GO, t)
    pg.wait_for_timeout(500)

    print("\n── 8 · fit-to-window is off before the pages are measured")
    # The window-fitted deck FIRST, so what the toggle actually does to the
    # box is measured here rather than asserted below. It is the deck's own
    # HEIGHT that moves: the stage is the window less the 62px bar, so a
    # fitted deck is 838 tall where an authored one is 900 — and that height
    # is what `deckFitPass()` splits a long table against.
    js(pg, "()=>{ document.getElementById('deckroot').classList.add('fitwin'); }")
    js(pg, "(t)=>openDeckTarget(t)", t)
    pg.wait_for_timeout(700)
    fitted = js(pg, SHAPE)
    ok("fit-to-window really does change the box the slides are fitted in",
       fitted.get("fitwin") is True and fitted.get("deckH") != 900, fitted)
    js(pg, "()=>closeDeck()")
    pg.wait_for_timeout(300)

    print("\n── 3 · the press opens the deck and asks to print")
    js(pg, "()=>{ window.__printed = 0; window.print = function(){ "
           "window.__printed++; }; }")
    # fitwin is still ON here — deckToPdf has to turn it off itself.
    js(pg, "()=>document.getElementById('deckroot').classList.add('fitwin')")
    pg.evaluate("(t)=>deckToPdf(t)", t)
    pg.wait_for_timeout(700)
    printed = js(pg, "()=>window.__printed")
    live = js(pg, SHAPE)
    ok("the print dialog is asked for, once", printed == 1, printed)
    ok("and the deck is open behind it", live.get("open") is True, live)
    ok("with slides in it", (live.get("slides") or 0) > 2, live)
    ok("fit-to-window was turned off for the pages",
       live.get("fitwin") is False, live)
    ok("so the pages are laid out in the box they were authored in",
       [live.get("deckW"), live.get("deckH")] == [1600, 900],
       {"box": [live.get("deckW"), live.get("deckH")],
        "fitted was": [fitted.get("deckW"), fitted.get("deckH")]})

    print("\n── 7 · on a screen it is still one slide at a time")
    ok("exactly one slide is shown", live.get("shown") == 1, live)
    ok("and the bar is there to drive it", live.get("barShown") is True, live)

    print("\n── 4·5·6 · what actually prints")
    pg.emulate_media(media="print")
    pg.wait_for_timeout(250)
    pr = js(pg, SHAPE)
    ok("every slide prints", pr.get("shown") == pr.get("slides"),
       {"shown": pr.get("shown"), "of": pr.get("slides")})
    ok("one page each, at the size they were authored",
       pr.get("sizes") == ["1600x900"], pr.get("sizes"))
    ok("the window-fit scale is gone",
       pr.get("transform") in ("none", "matrix(1, 0, 0, 1, 0, 0)"),
       pr.get("transform"))
    ok("the deck's own bar does not print", pr.get("barShown") is False, pr)
    ok("and neither does the platform behind it",
       pr.get("chromeShown") is False, pr)
    ok("the colours survive the printer",
       str(pr.get("adjust")).lower() == "exact", pr.get("adjust"))
    ok("so a table header still has its ground",
       pr.get("headBg") not in ("", "rgba(0, 0, 0, 0)", "transparent"),
       pr.get("headBg"))
    pg.emulate_media(media="screen")
    pg.wait_for_timeout(150)

    print("\n── 9 · the press ends where it started")
    js(pg, "()=>window.dispatchEvent(new Event('afterprint'))")
    pg.wait_for_timeout(400)
    after = js(pg, SHAPE)
    ok("the deck closes with the dialog", after.get("open") is False, after)
    ok("and fit-to-window is put back as it was",
       after.get("fitwin") is True, after)

    print("\n── the page threw nothing")
    ok("no page error", errs == [], errs[:2])
    b.close()

print("\n%d failures" % len(fails))
for f in fails:
    print("  - " + f)
