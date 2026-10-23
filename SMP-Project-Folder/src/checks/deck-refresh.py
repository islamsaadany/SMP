"""Updating the figures while presenting (§581).

Islam: *"if I refresh can it keep the slides presented but update the numbers
if I changed something in the inputs?"* — in place: `R` fetches the latest
saved figures and redraws the deck on the slide the room is looking at; the
flow does it by itself on moving to the next direction; the timer's reset
moves from R to Y.

From file:// there is no server, so the platform's quiet refresh is stood in
for by one that changes a figure the way a fetched graph would and answers
as `SYNC.refresh` does — `done(ok, changed)`. BOTH ENDS (§94.2): a change
redraws, no change and a failure do not; within a direction nothing is
fetched, across one it is. SMP_BUILT points it at another build (§276).
"""
import os
from playwright.sync_api import sync_playwright

BUILT = os.environ.get("SMP_BUILT") or os.path.join(os.path.dirname(__file__), "..", "strategy-management-platform.html")
bad = 0
def ck(name, ok, detail=""):
    global bad
    print(("  ok   " if ok else "  FAIL ") + name + ("" if ok else "  — " + str(detail)))
    if not ok: bad += 1
def safe(pg, js, dflt=None):
    try: return pg.evaluate(js)
    except Exception as e: return dflt

MAKE = """()=>{
  var src=UNITS.mobile.items;
  GROUP.structure = {bu:{exists:false}, top:{on:SMPRules.STRUCT_COMPONENTS.slice(), temple:true}};
  GROUP.items = ['Maximizing Current Stores','New Store Expansion'].map(function(n,i){
    var p=JSON.parse(JSON.stringify(src[i])), id='group-P'+(i+1);
    p.id=id; p.name=n; p.code=''; p.owner='Owner '+(i+1); p.sub=''; p.theme=''; p.kind='';
    (p.measures||[]).forEach(function(m,k){ m.id=id+'-M'+(k+1); });
    (p.tactics||[]).forEach(function(t,k){ t.id=id+'-T'+(k+1); });
    return p; });
  window.__calls = 0; window.__answer = 'change';
  SYNC.refresh = function(done){
    window.__calls++;
    if (window.__answer === 'fail') return done(false);
    if (window.__answer === 'same') return done(true, false);
    GROUP.items[0].measures[0].actual = '0.9%';
    done(true, true);
  };
  current='group'; currentSub='performance'; paint(); return true}"""
SAY = "()=>{var e=document.querySelector('#deckroot .drefresh'); return e && e.classList.contains('show') ? e.textContent : ''}"
FIG = "()=>{var s=DECK.slides.find(x=>/M$/.test(x.dataset.split||'')); return s ? s.querySelector('tbody tr .dprog').textContent.trim() : null}"

with sync_playwright() as p:
    b = p.chromium.launch(executable_path=os.environ.get("SMP_CHROME") or None)
    pg = b.new_page(viewport={"width": 1600, "height": 900})
    errs = []; pg.on("pageerror", lambda e: errs.append(str(e)))
    pg.add_init_script("try{sessionStorage.setItem('smp.welcome.done','1');localStorage.setItem('smp.tour.never','1')}catch(e){}")
    pg.goto("file://" + os.path.abspath(BUILT)); pg.wait_for_timeout(800)
    office = safe(pg, "()=>(PEOPLE.find(p=>SMPRules.mayMasterPresent(world(), p))||{}).key")
    safe(pg, "()=>{switchViewer('%s'); return true}" % office); pg.wait_for_timeout(300)
    safe(pg, MAKE); pg.wait_for_timeout(300)

    # ── 1. R on a direction's slides: new figures, the same slide, the same clock
    safe(pg, """()=>{GROUP.presentMins = GROUP.presentMins || {}; openDeckFor('dir:group-P1'); deckGoFull();
      DECK.clock = {t:'dir:group-P1', mins:15, ran:4*60000, from:Date.now()}; clockPaint(); return true}"""); pg.wait_for_timeout(500)
    tslide = safe(pg, "()=>DECK.slides.findIndex(x=>/T$/.test(x.dataset.split||'') && !x.dataset.cont)")
    safe(pg, "()=>{deckShow(%d); return true}" % tslide); pg.wait_for_timeout(200)
    before = {"fig": safe(pg, FIG), "left": safe(pg, "()=>Math.round(clockLeft()/1000)"),
              "node": safe(pg, "()=>{window.__old = DECK.slides[DECK.i]; return true}")}
    pg.keyboard.press("r"); pg.wait_for_timeout(500)
    after = {"fig": safe(pg, FIG), "left": safe(pg, "()=>Math.round(clockLeft()/1000)"),
             "same": safe(pg, "()=>DECK.slides[DECK.i]===window.__old"),
             "on": safe(pg, "()=>/T$/.test(DECK.slides[DECK.i].dataset.split||'') && !DECK.slides[DECK.i].dataset.cont"),
             "fs": safe(pg, "()=>document.getElementById('deckroot').classList.contains('fs')")}
    ck("R fetches once and the slides are redrawn with the new figure", safe(pg, "()=>window.__calls") == 1 and after["same"] is False and after["fig"] != before["fig"], {"before": before, "after": after})
    ck("…on the same slide the room was looking at", after["on"] is True, after)
    ck("…still full screen", after["fs"] is True)
    ck("…and the clock carries on, not restarted", isinstance(before["left"], int) and isinstance(after["left"], int) and abs(after["left"] - before["left"]) <= 3, (before["left"], after["left"]))
    ck("…saying so for a moment", "Figures updated" in (safe(pg, SAY) or ""), safe(pg, SAY))
    # no change: nothing redrawn
    safe(pg, "()=>{window.__answer='same'; window.__old = DECK.slides[DECK.i]; return true}")
    pg.keyboard.press("r"); pg.wait_for_timeout(400)
    ck("nothing new: nothing is redrawn, and it says the figures are up to date",
       safe(pg, "()=>DECK.slides[DECK.i]===window.__old") is True and "up to date" in (safe(pg, SAY) or ""), safe(pg, SAY))
    # failure: the room keeps what it had
    safe(pg, "()=>{window.__answer='fail'; window.__old = DECK.slides[DECK.i]; return true}")
    pg.keyboard.press("r"); pg.wait_for_timeout(400)
    ck("a failed fetch leaves the slides as they were, and says they were not updated",
       safe(pg, "()=>DECK.slides[DECK.i]===window.__old") is True and "not updated" in (safe(pg, SAY) or ""), safe(pg, SAY))
    # line by line: a half-built slide stays half built
    safe(pg, "()=>{window.__answer='change'; GROUP.slideBuild=true; deckBuildShow(DECK.slides[DECK.i], 2); return true}")
    pg.keyboard.press("r"); pg.wait_for_timeout(400)
    ck("a slide half built line by line stays where it was", safe(pg, "()=>+DECK.slides[DECK.i].dataset.bn") == 2, safe(pg, "()=>DECK.slides[DECK.i].dataset.bn"))
    safe(pg, "()=>{delete GROUP.slideBuild; closeDeck(); return true}"); pg.wait_for_timeout(200)

    # ── 2. The flow fetches on moving to the next direction, and only then ─
    safe(pg, "()=>{window.__calls=0; window.__answer='same'; openDeckWith('t', flowWithParts(['dir:group-P1','dir:group-P2'])); return true}"); pg.wait_for_timeout(500)
    log = []
    for k in range(30):
        log.append(safe(pg, "()=>[DECK.i, DECK.slides[DECK.i].dataset.subject||'', window.__calls]"))
        if log[-1][0] == safe(pg, "()=>DECK.slides.length-1"): break
        pg.keyboard.press("ArrowRight"); pg.wait_for_timeout(120)
    cross = [i for i in range(1, len(log)) if log[i][1] != log[i-1][1] and log[i-1][1] and log[i][1]]
    ck("the flow fetches once, as it moves on to the next direction", log[-1][2] == 1 and len(cross) == 1, log)
    ck("…and not on any step inside one", all(log[i][2] == (1 if i >= cross[0] else 0) for i in range(len(log))) if cross else False, log)
    ck("…quietly: nothing is said to the room", (safe(pg, SAY) or "") == "", safe(pg, SAY))
    safe(pg, "()=>{closeDeck(); return true}"); pg.wait_for_timeout(200)

    # ── 3. The tour's made-up example has nothing to fetch ────────────────
    safe(pg, "()=>{window.__calls=0; exampleTourOpen(); return true}"); pg.wait_for_timeout(600)
    pg.keyboard.press("g"); pg.wait_for_timeout(200)
    pg.keyboard.press("r"); pg.wait_for_timeout(300)
    ck("R on the guided tour's example fetches nothing", safe(pg, "()=>window.__calls") == 0)
    safe(pg, "()=>{closeDeck(); return true}"); pg.wait_for_timeout(200)

    # ── 4. The keys, as the slide view lists them ────────────────────────
    safe(pg, "()=>{slidesOpen('dir','group-P1'); return true}"); pg.wait_for_timeout(600)
    keys = safe(pg, "()=>(document.getElementById('slkeys')||{}).textContent||''") or ""
    ck("the slide view lists R as updating the figures and Y as resetting the timer",
       "R update the figures" in keys and "Y reset the timer" in keys, keys)
    safe(pg, "()=>{slidesClose(); return true}")

    ck("no page errors", not errs, errs[:3])
    b.close()
print("FAILED" if bad else "all green", bad)
raise SystemExit(1 if bad else 0)
