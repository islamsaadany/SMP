"""Render a real client's real deck as a standing page, the way the platform
itself would print it.

NOT A MOCKUP. It hydrates the client's own state into the built platform,
presses the same entry the owner presses (`openDeckFor`), and lets the
product assemble AND FIT the deck. The fit matters: every slide is authored
at 1600x900 and `deckFitPass()` decides how many rows a table gets by
MEASURING against that box, splitting a long one across continuation slides.
Render at any other size, or skip the pass, and the tables overrun the
slide — which is the renderer's damage, not the product's.

So the standing page keeps the geometry exactly: 1600x900 boxes, stacked,
scaled as one by the same `min(width/1600)` the presenter's own stage uses.

  python3 design-mockups/owner-performance/render-real-deck.py \
      <state.json> <target> <out.html>
"""
import os, io, sys, json
from playwright.sync_api import sync_playwright

STATE = io.open(sys.argv[1], encoding="utf-8").read()
TARGET = sys.argv[2]
OUT = sys.argv[3]
BUILT = os.environ.get("SMP_BUILT") or os.path.join(
    os.path.dirname(os.path.abspath(__file__)), "..", "..",
    "SMP-Project-Folder", "src", "strategy-management-platform.html")

# The print block's geometry (present.css, §337), as plain CSS: the deck
# stands still, every slide is on, and each is the box it was fitted at.
STAND = """
  html,body{margin:0;padding:0;background:#e9e7e3;}
  /* NO `body.presenting > *:not(#deckroot){display:none}` here, though the
     print block carries it: there the deck IS a child of the body, and here
     it sits inside `.fitbox` — so the rule would hide the wrapper and every
     slide inside it would measure 0, which reads exactly like an empty deck.
     Nothing else is on this page to hide. */
  #dclock{display:none !important;}
  #deckroot.deckroot{position:static;display:block;background:transparent;inset:auto;}
  #deckroot .deckbar{display:none;}
  #deckroot .deckstage{position:static;display:block;padding:0;}
  #deckroot .deck{width:1600px;height:auto;transform-origin:top left;}
  #deckroot .dslide{position:static;display:flex;width:1600px;height:900px;
    margin:0 0 34px;border-radius:0;box-shadow:0 3px 22px rgba(0,0,0,.20);}
  .slideno{font:700 13px/1 ui-sans-serif,system-ui,sans-serif;letter-spacing:.18em;
    text-transform:uppercase;color:#6b6b6b;margin:0 0 9px;}
  .fitbox{overflow:hidden;padding:26px 16px;}
"""

FIT = """
  (function(){
    var box = document.querySelector('.fitbox'),
        deck = document.querySelector('#deckroot .deck');
    function go(){
      var k = Math.min(1, (box.clientWidth - 32) / 1600);
      deck.style.transform = 'scale(' + k + ')';
      box.style.height = (deck.scrollHeight * k) + 'px';
    }
    addEventListener('resize', go); go();
  })();
"""

with sync_playwright() as p:
    b = p.chromium.launch(executable_path=os.environ.get("SMP_CHROME") or None)
    pg = b.new_page(viewport={"width": 1700, "height": 1000})
    errs = []; pg.on("pageerror", lambda e: errs.append(str(e)))
    pg.add_init_script("try{sessionStorage.setItem('smp.welcome.done','1');"
                       "localStorage.setItem('smp.tour.never','1')}catch(e){}")
    pg.goto("file://" + os.path.abspath(BUILT)); pg.wait_for_timeout(900)
    pg.evaluate("(s)=>{SYNC.hydrate(JSON.parse(s)); current='group';"
                " currentSub='performance'; paint();}", STATE)
    pg.wait_for_timeout(600)

    # The product opens, assembles and FITS its own deck.
    pg.evaluate("(t)=>openDeckFor(t)", TARGET); pg.wait_for_timeout(900)

    info = pg.evaluate("""()=>{
      var root = document.getElementById('deckroot');
      if(!root) return null;
      var sl = [...root.querySelectorAll('.dslide')];
      sl.forEach(function(s){ s.classList.add('on'); });
      return {n: sl.length,
        titles: sl.map(function(s){ return ((s.querySelector('h1,h2')||{}).textContent||'').trim(); }),
        tight: sl.filter(function(s){ return s.classList.contains('tight'); }).length,
        cont:  sl.filter(function(s){ return s.dataset.cont; }).length};
    }""")
    if not info:
        print("no deck opened for " + TARGET); b.close(); sys.exit(1)

    deck = pg.evaluate("()=>document.getElementById('deckroot').outerHTML")
    styles = pg.evaluate("()=>[...document.querySelectorAll('style')]"
                         ".map(s=>s.textContent).join('\\n')")
    b.close()

title = "What a direction owner presents"
html = ("<!doctype html><meta charset=\"utf-8\">"
        "<meta name=\"viewport\" content=\"width=device-width,initial-scale=1\">"
        "<title>" + title + "</title>"
        "<style>" + styles + "</style><style>" + STAND + "</style>"
        "<body><div class=\"fitbox\">" + deck + "</div>"
        "<script>" + FIT + "</script>")
io.open(OUT, "w", encoding="utf-8").write(html)

print("target     " + TARGET)
print("slides     %d  (fitted: %d tight, %d continuation)"
      % (info["n"], info["tight"], info["cont"]))
for i, t in enumerate(info["titles"], 1):
    print("  %2d  %s" % (i, t))
if errs: print("page errors: " + "; ".join(errs[:3]))
print("wrote      " + OUT + "  (%d KB)" % (os.path.getsize(OUT) // 1024))
