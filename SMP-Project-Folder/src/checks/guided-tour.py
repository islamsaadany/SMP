"""The guided tour, on a made-up direction (§574–§574.5).

Islam, before El Abd's Q3 review: a tour through a direction's slides that
lights one part and dims the rest, with a card saying what it is — and then,
on the first build: *"remove step 14 … start it … from the options of
presentation drop down below the master presentation … on a dummy direction
with multiple dynamics … a made up one not an actual one"*.

It MAKES its state (§255): El Abd's shape, the company planning its own
directions with the business units off. BOTH ENDS (§94.2): the office gets
the menu entry under Master presentation and somebody who may not open the
flow does not; the flow's picker and a real direction's tour button are gone;
the example is drawn and NEVER reaches the stored plan; its tactics show
Completed, Delayed, on track and Not due at H1 and at Q3 alike, because which
quarters do that is asked of the platform. SMP_BUILT points it at another
build (§276).
"""
import os, json
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
  current='group'; currentSub='performance'; paint(); return true}"""

STATE = """()=>({on:!!DTOUR, i:DTOUR?DTOUR.i:-1, n:DTOUR?DTOUR.stops.length:0, slide:DECK.i,
  clear:!!document.querySelector('[data-dtour].dtclear'),
  mark:!!document.querySelector('[data-dtour].dtmark'),
  label:(e=>e&&getComputedStyle(e).display!=='none'?e.innerText.replace(/\\s+/g,' ').trim():'')(document.querySelector('.dtlabel')),
  ringop:(e=>e?+getComputedStyle(e).opacity:-1)(document.querySelector('.dtring')),
  marked:document.querySelectorAll('#deckroot .dslide.dtmarked').length,
  gold:(e=>e?getComputedStyle(e).fontWeight:'')(document.querySelector('#deckroot .dslide.on .dwhich')),
  card:(e=>e?getComputedStyle(e).display!=='none':false)(document.querySelector('.dtcard')),
  shade:(e=>e?+getComputedStyle(e).opacity:-1)(document.querySelector('.dtshade')),
  step:(document.querySelector('.dtstep')||{}).textContent||'',
  deck:document.getElementById('deckroot').classList.contains('on'),
  h:(document.querySelector('.dtcard h3')||{}).textContent||'',
  ring:(e=>e?+e.getAttribute('width'):0)(document.querySelector('.dtring'))})"""
KIND = """()=>{var s=DECK.slides[DECK.i]; return s.dataset.split?s.dataset.split.slice(-1):(s.classList.contains('d-head')?'stand':(s.classList.contains('d-cover')?'cover':'?'))}"""
DYN = """()=>{var x=exampleDirection();
  return {bands:x.p.measures.map(m=>band(measureScore(m))),
          states:x.p.tactics.map(t=>tacticStatusKey(t)+(tacticDelayed(t)?'+late':''))}}"""
MENU = """()=>{var m=[...document.querySelectorAll('.dlmenu')].find(x=>x.querySelector('[data-master],[data-extour],[data-deckpdf]'));
  return m?[...m.querySelectorAll('[role=menuitem]')].map(b=>b.childNodes[0].textContent.trim()):null}"""

with sync_playwright() as p:
    b = p.chromium.launch(executable_path=os.environ.get("SMP_CHROME") or None)
    pg = b.new_page(viewport={"width": 1600, "height": 900})
    errs = []; pg.on("pageerror", lambda e: errs.append(str(e)))
    pg.add_init_script("try{sessionStorage.setItem('smp.welcome.done','1');localStorage.setItem('smp.tour.never','1')}catch(e){}")
    pg.goto("file://" + os.path.abspath(BUILT)); pg.wait_for_timeout(800)
    office = safe(pg, "()=>(PEOPLE.find(p=>SMPRules.mayMasterPresent(world(), p))||{}).key")
    other = safe(pg, "()=>(PEOPLE.find(p=>!SMPRules.mayMasterPresent(world(), p) && p.unit==='mobile')||PEOPLE.find(p=>!SMPRules.mayMasterPresent(world(), p))||{}).key")
    safe(pg, "()=>{switchViewer('%s'); return true}" % office); pg.wait_for_timeout(400)
    safe(pg, MAKE); pg.wait_for_timeout(400)

    # ── 1. The way in: the Presentation menu, under Master presentation ─
    items = safe(pg, MENU) or []
    ck("the office's Presentation menu reads Master presentation, then Guided tour",
       items[:2] == ["Master presentation", "Guided tour"], items)
    safe(pg, "()=>{masterOpen(); MFLOW.pick=['dir:group-P1','dir:group-P2']; masterPaint(); return true}"); pg.wait_for_timeout(300)
    ck("the Master presentation carries no tour picker any more (Islam: the menu only)",
       safe(pg, "()=>!document.querySelector('[data-mftour]') && !/Guided tour/.test(document.getElementById('modal-b').textContent)") is True)
    safe(pg, "()=>{closeModal(); openDeckWith('t', flowWithParts(['dir:group-P1','dir:group-P2'])); return true}"); pg.wait_for_timeout(600)
    ck("a real direction's deck has no tour button", safe(pg, "()=>!document.querySelector('#deckroot [data-dtourgo]')") is True)
    real = safe(pg, "()=>({sw:SMPRules.slideColOn(GROUP,'owner'), th:[...document.querySelectorAll('#deckroot [data-split$=T] th')].some(t=>t.textContent.trim()==='Owner')})") or {}
    ck("a real deck still follows the office's Owner switch — the demo's rule is the demo's",
       real.get("sw") is True and real.get("th") is True, real)
    pg.keyboard.press("g"); pg.wait_for_timeout(200)
    ck("…and G on a real deck starts nothing", safe(pg, "()=>!!DTOUR") is False)
    safe(pg, "()=>{closeDeck(); return true}"); pg.wait_for_timeout(200)

    # ── 2. The press: the example, full screen, the tour on its first stop
    before = safe(pg, "()=>JSON.stringify([GROUP, UNITS, REVIEW])")
    safe(pg, "()=>{document.querySelector('[data-extour]').click(); return true}"); pg.wait_for_timeout(900)
    st = safe(pg, STATE) or {}
    ck("pressing Guided tour opens the deck with the tour on stop 1, lit",
       st.get("deck") and st.get("on") and st.get("i") == 0 and st.get("ring", 0) > 0, st)
    ck("…full screen, as Present from the slides opens", safe(pg, "()=>document.getElementById('deckroot').classList.contains('fs')") is True)
    ck("…on the made-up direction and nothing else",
       safe(pg, "()=>DECK.targets.join()+'|'+DECK.slides.every(s=>s.dataset.subject==='example:tour')") == "example:tour|true")
    cover = safe(pg, "()=>DECK.slides[0].textContent") or ""
    ck("its cover says it is an example with made-up figures", "the figures are made up" in cover, cover[:200])
    ck("…and it is coded EX001, never a D-code a real direction holds",
       safe(pg, "()=>[...document.querySelectorAll('#deckroot .dcode')].every(e=>e.textContent.trim()==='EX001')") is True)
    ths = safe(pg, "()=>[...document.querySelectorAll('#deckroot [data-split$=T] th')].map(t=>t.textContent.trim())") or []
    ck("its tactics slide has no Owner and no Collabs. column (Islam: hidden on the demo)",
       ths and "Owner" not in ths and "Collabs." not in ths, ths)
    ck("…and it has no Thank you slide — the tour ends the deck",
       safe(pg, "()=>!document.querySelector('#deckroot .d-thanks')") is True)

    # ── 3. The stops, in order, with step 14 gone ──────────────────────
    heads, kinds, clears, seen = [], [], [], []
    for k in range(st.get("n", 0)):
        s = safe(pg, STATE) or {}
        pg.wait_for_timeout(350)
        s = safe(pg, STATE) or {}
        seen.append(s)
        clears.append(s.get("clear"))
        heads.append(None if s.get("clear") else s.get("h")); kinds.append(safe(pg, KIND))
        if k < st.get("n", 0) - 1:
            pg.keyboard.press("ArrowRight"); pg.wait_for_timeout(220)
    run = lambda kd: [c for c, x in zip(clears, kinds) if x == kd]
    lit = [h for h in heads if h]
    ck("it walks cover, key measures, tactics, then where it stands",
       [x for i, x in enumerate(kinds) if i == 0 or kinds[i-1] != x] == ["cover", "M", "T", "stand"], kinds)
    for h in ["Annual target", "Actual", "Progress", "Note", "Quarters", "Status", "Delayed",
              "YTD actual and Progress", "Where it stands: Execution"]:
        ck("…with a stop for " + h, h in heads, heads)
    ck("the stop on the line under the two readings is gone (Islam: remove step 14)",
       "Two different questions" not in lit and len(lit) == 15, lit)
    ck("the last stop before the closing card is Execution",
       len(lit) > 1 and lit[-2] == "Where it stands: Execution", lit[-3:])
    # §574.2: each table opens and closes on the whole slide, clear
    for kd, word in [("M", "key measures"), ("T", "tactics")]:
        r = run(kd)
        ck("the %s slide opens clear, walks its parts lit, and closes clear" % word,
           len(r) >= 4 and r[0] is True and r[-1] is True and not any(r[1:-1]), r)
    cl = [x for x in seen if x.get("clear")]
    ck("a clear stop draws no card and no shade",
       len(cl) == 4 and all(not x.get("card") and x.get("shade") == 0 for x in cl), cl[:2])
    ck("…and a lit stop draws both",
       all(x.get("card") and x.get("shade", 0) > 0 for x in seen if not x.get("clear")))
    ck("the count is of the parts lit: 1 of 14 … 14 of 14",
       [x.get("step") for x in seen if not x.get("clear")][0] == "1 of 14" and
       "14 of 14" in [x.get("step") for x in seen], [x.get("step") for x in seen])
    # §574.3: after the Note, one key measure's whole line — the one furthest behind
    ni = lit.index("Note") if "Note" in lit else -1
    ck("after the Note, the key measures light one whole line: the off-track one (Islam)",
       ni >= 0 and lit[ni + 1] == "Delivery share of sales", lit[ni:ni+2] if ni >= 0 else lit)
    ck("…and that line is the last lit before the slide closes clear",
       ni >= 0 and run("M")[-2] is False and run("M")[-1] is True, run("M"))
    # §574.5: the clear views say which slide, and what it is about
    for kd, want in [("M", "KEY MEASURES The results we committed to"), ("T", "TACTICS The work that delivers them")]:
        cv = [x for x, k in zip(seen, kinds) if k == kd and x.get("clear")]
        ck("each clear view of the %s slide rings its title and names it: %s" % (kd, want),
           len(cv) == 2 and all(x.get("mark") and x.get("ringop") == 1 and x.get("label", "").upper() == want.upper()
                               and x.get("marked") == 1 and x.get("gold") == "700" for x in cv), cv)
    ck("…and nothing is dimmed on them", all(x.get("shade") == 0 for x in seen if x.get("clear")))
    ck("a lit stop draws no label and leaves no slide marked",
       all(not x.get("mark") and not x.get("label") and x.get("marked") == 0 for x in seen if not x.get("clear")),
       [x for x in seen if not x.get("clear") and (x.get("mark") or x.get("marked"))][:1])
    ck("YTD actual and Progress come before Delayed (Islam)",
       "Delayed" in lit and lit.index("YTD actual and Progress") < lit.index("Delayed"), lit)

    # ── 4. Never stored ────────────────────────────────────────────────
    ck("the example reaches nothing stored — GROUP, the units and the review read as before",
       safe(pg, "()=>JSON.stringify([GROUP, UNITS, REVIEW])") == before)

    # ── 5. Keys and presses are the tour's; Finish closes the deck ──────
    pg.keyboard.press("ArrowRight"); pg.wait_for_timeout(300)
    ck("Finish on the closing card closes the example and lands on the platform",
       safe(pg, "()=>!DTOUR && !document.getElementById('deckroot').classList.contains('on')") is True)
    safe(pg, "()=>{exampleTourOpen(); return true}"); pg.wait_for_timeout(700)
    pg.keyboard.press("ArrowRight"); pg.wait_for_timeout(250)
    pg.keyboard.press("ArrowRight"); pg.wait_for_timeout(250)
    s1 = safe(pg, STATE) or {}
    ck("→ moves the tour, not the deck past it", s1.get("i") == 2, s1)
    pg.keyboard.press("ArrowLeft"); pg.wait_for_timeout(250)
    ck("← steps back", (safe(pg, STATE) or {}).get("i") == 1)
    sl = safe(pg, "()=>DECK.i")
    pg.mouse.click(24, 880); pg.wait_for_timeout(300)
    s2 = safe(pg, STATE) or {}
    ck("a press on the dim is Next, and the full-screen stage does not ALSO turn the slide",
       s2.get("i") == 2 and s2.get("slide") == sl, {"before": sl, "after": s2})
    try: pg.click("[data-dtend]"); pg.wait_for_timeout(200)
    except Exception: pass
    ck("the × ends the tour and leaves the deck on its slide",
       safe(pg, "()=>!DTOUR && !document.querySelector('[data-dtour]') && document.getElementById('deckroot').classList.contains('on')") is True)
    pg.keyboard.press("g"); pg.wait_for_timeout(400)
    ck("G starts it again", safe(pg, "()=>!!DTOUR && DTOUR.i===0") is True)
    pg.keyboard.press("g"); pg.wait_for_timeout(200)
    ck("…and G again ends it", safe(pg, "()=>!!DTOUR") is False)
    pg.emulate_media(media="print")
    pg.keyboard.press("g"); pg.wait_for_timeout(300)
    ck("the tour is not on paper", safe(pg, "()=>getComputedStyle(document.querySelector('[data-dtour]')).display") == "none")
    pg.emulate_media(media="screen")
    safe(pg, "()=>{closeDeck(); return true}"); pg.wait_for_timeout(200)
    ck("closing the deck ends the tour with it", safe(pg, "()=>!DTOUR && !document.querySelector('[data-dtour]')") is True)
    ck("…and leaves no slide marked", safe(pg, "()=>document.querySelectorAll('#deckroot .dtmarked').length") == 0)

    # ── 6. The dynamics, asked of the platform at H1 and at Q3 ─────────
    for to, name in [(None, "the demo's own cycle"), ("2026-09", "Q3, El Abd's"), ("2026-08", "a review point mid-quarter")]:
        if to: safe(pg, "()=>{REVIEW.to='%s'; return true}" % to)
        d = safe(pg, DYN) or {}
        ck("at %s the key measures span all three bands" % name,
           sorted(set(d.get("bands") or [])) == ["attn", "bad", "good"], d)
        ck("…and the tactics read Completed, Delayed, on track and Not due",
           d.get("states") == ["done", "wip+late", "wip", "notdue"], d)

    # ── 7. Somebody who may not open the flow gets no entry ─────────────
    if other:
        safe(pg, "()=>{switchViewer('%s'); paint(); return true}" % other); pg.wait_for_timeout(400)
        ck("somebody who may not open the Master presentation has no Guided tour",
           safe(pg, "()=>!document.querySelector('[data-extour]')") is True)
        safe(pg, "()=>{exampleTourOpen(); return true}"); pg.wait_for_timeout(300)
        ck("…and the opener refuses them at the press (§48.2)",
           safe(pg, "()=>!document.getElementById('deckroot').classList.contains('on')") is True)

    # ── 8. §574.4: sized for a projector, and never over the part it explains
    FIT = """()=>{var c=document.querySelector('.dtcard'), d=document.querySelector('[data-dtour]');
      if(!c||d.classList.contains('dtclear')) return null;
      var r=c.getBoundingClientRect(), g=document.querySelector('.dtring');
      var x=+g.getAttribute('x'), y=+g.getAttribute('y'), w=+g.getAttribute('width'), h=+g.getAttribute('height');
      var ox=Math.max(0, Math.min(r.right, x+w)-Math.max(r.left, x)), oy=Math.max(0, Math.min(r.bottom, y+h)-Math.max(r.top, y));
      return {h:c.querySelector('h3').textContent, body:parseFloat(getComputedStyle(c.querySelector('.dtbody')).fontSize),
        inside:r.left>=0 && r.top>=0 && r.right<=innerWidth && r.bottom<=innerHeight, over:w?Math.round(ox*oy):0}}"""
    for W, H, least in [(1920, 1080, 24), (1366, 768, 17)]:
        q = b.new_page(viewport={"width": W, "height": H})
        q.on("pageerror", lambda e: errs.append(str(e)))
        q.add_init_script("try{sessionStorage.setItem('smp.welcome.done','1');localStorage.setItem('smp.tour.never','1')}catch(e){}")
        q.goto("file://" + os.path.abspath(BUILT)); q.wait_for_timeout(800)
        safe(q, "()=>{switchViewer('%s'); return true}" % office); safe(q, MAKE); q.wait_for_timeout(300)
        safe(q, "()=>{REVIEW.to='2026-09'; exampleTourOpen(); return true}"); q.wait_for_timeout(800)
        rows, labs = [], []
        LAB = """()=>{var d=document.querySelector('[data-dtour]'), l=d&&d.querySelector('.dtlabel');
          if(!l||!d.classList.contains('dtmark')) return null;
          var r=l.getBoundingClientRect(), g=d.querySelector('.dtring');
          var x=+g.getAttribute('x'), y=+g.getAttribute('y'), w=+g.getAttribute('width'), h=+g.getAttribute('height');
          var ox=Math.max(0, Math.min(r.right, x+w)-Math.max(r.left, x)), oy=Math.max(0, Math.min(r.bottom, y+h)-Math.max(r.top, y));
          return {inside:r.left>=0 && r.top>=0 && r.right<=innerWidth && r.bottom<=innerHeight, over:Math.round(ox*oy)}}"""
        for k in range(safe(q, "()=>DTOUR?DTOUR.stops.length:0") or 0):
            q.wait_for_timeout(420)
            m = safe(q, FIT)
            if m: rows.append(m)
            l = safe(q, LAB)
            if l: labs.append(l)
            q.keyboard.press("ArrowRight")
        ck("at %dx%d the card's text is at least %dpx (Islam: bigger for the projector)" % (W, H, least),
           rows and min(r["body"] for r in rows) >= least, [r["body"] for r in rows][:2])
        ck("…and on every lit stop the card stays on screen and off the part it explains",
           rows and all(r["inside"] and r["over"] == 0 for r in rows),
           [r for r in rows if not r["inside"] or r["over"]][:2])
        ck("…and on every clear view the label stays on screen and clear of the ringed title",
           len(labs) == 4 and all(l["inside"] and l["over"] == 0 for l in labs), labs)
        q.close()

    ck("no page errors", not errs, errs[:3])
    b.close()
print("FAILED" if bad else "all green", bad)
raise SystemExit(1 if bad else 0)
