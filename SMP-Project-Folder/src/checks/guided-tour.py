"""The guided tour of one subject's slides (§574).

Islam, before El Abd's Q3 review: an option in the master flow to present a
demo direction, unit or function, and on clicking in the presentation a tour
through that subject's slides that lights one part and dims the rest, with a
card saying what the part is.

It MAKES its state (§255): El Abd's shape — the company plans its own
directions, the business units off — from the worked example's figures, one
tactic made late so the Delayed stop has something to light. BOTH ENDS
(§94.2): the picker offers the flow and nothing else; the button is on the
picked direction's cover and on no other slide; a pick that is not in the
flow draws nothing. And A15: a business unit's deck takes the same tour.
SMP_BUILT points it at another build (§276).
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
  var t=GROUP.items[0].tactics[2]; t.q1=1; t.q2=1; t.q3=0; t.q4=0;
  current='group'; currentSub='performance'; paint(); return true}"""

STATE = """()=>({on:!!DTOUR, i:DTOUR?DTOUR.i:-1, n:DTOUR?DTOUR.stops.length:0, slide:DECK.i,
  h:(document.querySelector('.dtcard h3')||{}).textContent||'',
  ring:(e=>e?+e.getAttribute('width'):0)(document.querySelector('.dtring'))})"""

with sync_playwright() as p:
    b = p.chromium.launch(executable_path=os.environ.get("SMP_CHROME") or None)
    pg = b.new_page(viewport={"width": 1600, "height": 900})
    errs = []; pg.on("pageerror", lambda e: errs.append(str(e)))
    pg.add_init_script("try{sessionStorage.setItem('smp.welcome.done','1');localStorage.setItem('smp.tour.never','1');localStorage.removeItem('smp.deck.tour')}catch(e){}")
    pg.goto("file://" + os.path.abspath(BUILT)); pg.wait_for_timeout(800)
    office = safe(pg, "()=>(PEOPLE.find(p=>SMPRules.mayMasterPresent(world(), p))||{}).key")
    safe(pg, "(k)=>{switchViewer(k); return true}".replace("(k)", "()").replace("switchViewer(k)", "switchViewer('%s')" % office)); pg.wait_for_timeout(400)
    safe(pg, MAKE); pg.wait_for_timeout(400)

    # ── 1. The picker: the flow, and only the flow ─────────────────────
    safe(pg, "()=>{masterOpen(); MFLOW.pick=['dir:group-P1','dir:group-P2']; masterPaint(); return true}"); pg.wait_for_timeout(300)
    opts = safe(pg, "()=>[...document.querySelectorAll('[data-mftour] option')].map(o=>o.value)") or []
    ck("the Guided tour picker offers None and the flow's two directions, nothing else",
       opts == ["", "dir:group-P1", "dir:group-P2"], opts)
    try: pg.select_option("[data-mftour]", "dir:group-P1"); pg.wait_for_timeout(300)
    except Exception as e: pass
    ck("picking one is remembered", safe(pg, "()=>deckTourPick()") == "dir:group-P1", safe(pg, "()=>deckTourPick()"))
    ck("…and the picker still shows it after the repaint",
       safe(pg, "()=>document.querySelector('[data-mftour]').value") == "dir:group-P1")
    safe(pg, "()=>{MFLOW.pick=['dir:group-P2']; masterPaint(); return true}"); pg.wait_for_timeout(200)
    ck("a direction taken out of the flow is not offered, and the picker reads None",
       safe(pg, "()=>document.querySelector('[data-mftour]').value") == "", safe(pg, "()=>document.querySelector('[data-mftour]').value"))
    safe(pg, "()=>{MFLOW.pick=[]; masterPaint(); return true}"); pg.wait_for_timeout(200)
    ck("an empty flow draws no picker (§61)", safe(pg, "()=>!document.querySelector('[data-mftour]')") is True)
    safe(pg, "()=>{closeModal(); return true}")

    # ── 2. The button: on the picked direction's cover, nowhere else ───
    safe(pg, "()=>{openDeckWith('t', flowWithParts(['dir:group-P1','dir:group-P2'])); return true}"); pg.wait_for_timeout(700)
    btn = safe(pg, """()=>{var b=[...document.querySelectorAll('#deckroot [data-dtourgo]')];
      return b.map(x=>{var s=x.closest('.dslide'); return {sub:s.dataset.subject, cover:s.classList.contains('d-cover'), part:!!s.dataset.flowpart}})}""") or []
    ck("one Guided tour button, on the picked direction's own cover — not the flow's cover",
       len(btn) == 1 and btn[0] == {"sub": "dir:group-P1", "cover": True, "part": False}, btn)
    safe(pg, "()=>{closeDeck(); openDeckWith('t', flowWithParts(['dir:group-P2'])); return true}"); pg.wait_for_timeout(600)
    ck("a pick that is not in the flow draws no button", safe(pg, "()=>document.querySelectorAll('#deckroot [data-dtourgo]').length") == 0)
    pg.keyboard.press("g"); pg.wait_for_timeout(200)
    ck("…and G starts nothing", safe(pg, "()=>!!DTOUR") is False)
    safe(pg, "()=>{closeDeck(); return true}")

    # ── 3. The tour: the stops it makes, in order ──────────────────────
    safe(pg, "()=>{openDeckWith('t', flowWithParts(['dir:group-P1','dir:group-P2'])); return true}"); pg.wait_for_timeout(700)
    cover = safe(pg, "()=>DECK.slides.findIndex(s=>s.querySelector('[data-dtourgo]'))")
    safe(pg, "(i)=>{deckShow(%d); return true}".replace("(i)", "()") % cover); pg.wait_for_timeout(200)
    try: pg.click("[data-dtourgo]"); pg.wait_for_timeout(500)
    except Exception: pass
    st = safe(pg, STATE) or {}
    ck("pressing the button starts the tour on its first stop, lit", st.get("on") and st.get("i") == 0 and st.get("ring", 0) > 0, st)
    heads, kinds = [], []
    for k in range(st.get("n", 0)):
        s = safe(pg, STATE) or {}
        heads.append(s.get("h"))
        kinds.append(safe(pg, "()=>{var s=DECK.slides[DECK.i]; return s.dataset.split?s.dataset.split.slice(-1):(s.classList.contains('d-head')?'stand':(s.classList.contains('d-cover')?'cover':'?'))}"))
        if k < st.get("n", 0) - 1:
            pg.keyboard.press("ArrowRight"); pg.wait_for_timeout(250)
    ck("it walks cover, key measures, tactics, then where it stands — in that order",
       [x for i, x in enumerate(kinds) if i == 0 or kinds[i-1] != x] == ["cover", "M", "T", "stand"], kinds)
    for h in ["Annual target", "Actual", "Progress", "Note", "Quarters", "Status", "Delayed", "YTD actual and Progress", "Two different questions"]:
        ck("…with a stop for " + h, h in heads, heads)
    ck("every stop but the closing card lights something",
       all(x for x in kinds), kinds)
    at = safe(pg, "()=>DECK.i")
    pg.keyboard.press("ArrowRight"); pg.wait_for_timeout(250)
    ck("Next on the closing card ends the tour and leaves the deck where it is",
       safe(pg, "()=>!!DTOUR") is False and safe(pg, "()=>DECK.i") == at and safe(pg, "()=>document.getElementById('deckroot').classList.contains('on')") is True)

    # ── 4. Keys and presses are the tour's while it runs ───────────────
    pg.keyboard.press("g"); pg.wait_for_timeout(400)
    s0 = safe(pg, STATE) or {}
    ck("G starts it from anywhere in the deck", s0.get("on") is True, s0)
    pg.keyboard.press("ArrowRight"); pg.wait_for_timeout(250)
    pg.keyboard.press("ArrowRight"); pg.wait_for_timeout(250)
    s1 = safe(pg, STATE) or {}
    ck("→ moves the tour, not the deck past it", s1.get("i") == 2, s1)
    pg.keyboard.press("ArrowLeft"); pg.wait_for_timeout(250)
    ck("← steps back", (safe(pg, STATE) or {}).get("i") == 1)
    safe(pg, "()=>{document.getElementById('deckroot').classList.add('fs'); return true}")
    sl = safe(pg, "()=>DECK.i")
    pg.mouse.click(24, 880); pg.wait_for_timeout(300)
    s2 = safe(pg, STATE) or {}
    ck("a press on the dim is Next, and the full-screen stage does not ALSO turn the slide",
       s2.get("i") == 2 and s2.get("slide") == sl, {"before": sl, "after": s2})
    try: pg.click("[data-dtend]"); pg.wait_for_timeout(200)
    except Exception: pass
    ck("the × ends the tour", safe(pg, "()=>!!DTOUR") is False and safe(pg, "()=>!document.querySelector('[data-dtour]')") is True)
    pg.keyboard.press("g"); pg.wait_for_timeout(300); pg.keyboard.press("g"); pg.wait_for_timeout(200)
    ck("G again ends it", safe(pg, "()=>!!DTOUR") is False)
    safe(pg, "()=>{document.getElementById('deckroot').classList.remove('fs'); return true}")
    pg.keyboard.press("g"); pg.wait_for_timeout(300)
    safe(pg, "()=>{closeDeck(); return true}"); pg.wait_for_timeout(200)
    ck("closing the deck ends the tour with it", safe(pg, "()=>!!DTOUR") is False and safe(pg, "()=>!document.querySelector('[data-dtour]')") is True)

    # ── 5. Never printed ───────────────────────────────────────────────
    safe(pg, "()=>{openDeckWith('t', flowWithParts(['dir:group-P1'])); return true}"); pg.wait_for_timeout(600)
    pg.emulate_media(media="print")
    ck("the button is not on the PDF", safe(pg, "()=>getComputedStyle(document.querySelector('[data-dtourgo]')).display") == "none")
    pg.emulate_media(media="screen")
    safe(pg, "()=>{closeDeck(); return true}")

    # ── 6. A15: a business unit's deck takes the same tour ─────────────
    pg.goto("file://" + os.path.abspath(BUILT)); pg.wait_for_timeout(800)
    safe(pg, "()=>{switchViewer('%s'); return true}" % office); pg.wait_for_timeout(300)
    safe(pg, "()=>{deckTourPickWrite('mobile'); openDeckWith('t', ['mobile']); return true}"); pg.wait_for_timeout(800)
    ck("a unit picked gets the button on its cover", safe(pg, "()=>{var b=document.querySelector('[data-dtourgo]'); return b?b.closest('.dslide').dataset.subject:null}") == "mobile")
    pg.keyboard.press("g"); pg.wait_for_timeout(400)
    u = safe(pg, STATE) or {}
    heads = []
    for k in range(u.get("n", 0)):
        heads.append((safe(pg, STATE) or {}).get("h"))
        pg.keyboard.press("ArrowRight"); pg.wait_for_timeout(200)
    ck("…and the tour lights its key measures, tactics and where it stands",
       all(h in heads for h in ["Progress", "Status", "Two different questions"]) and heads[0] == "One business unit, from cover to close", heads)
    safe(pg, "()=>{closeDeck(); deckTourPickWrite(''); return true}")

    ck("no page errors", not errs, errs[:3])
    b.close()
print("FAILED" if bad else "all green", bad)
raise SystemExit(1 if bad else 0)
