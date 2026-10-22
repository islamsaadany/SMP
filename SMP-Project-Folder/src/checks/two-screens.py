"""Presenting on two screens (§579).

Islam: *"how about the presenter has a different view than the presented on
the screen"* — not a presenter view with notes, but *"the typical view of
the slides management … to manage the platform without disrupting the
presentation but somehow can get back and do any shortcut action"*. On the
mockup: clicking a slide waits for Enter, the strip's buttons are enough,
the office only for now.

With a second screen, Present opens the slides in a window of their own
(the room's) and the laptop keeps the slide view, driving it: ← → move the
room, T R Y act on the room, a click looks without showing, Enter shows,
Esc comes back to what the room sees; on any other page a strip at the top
says what the room sees, with ← → T and Back to slides. One screen, and
Present is what it was. The room's window saves nothing.

The second screen is stood in for by `screen.isExtended` answering true;
the room's window is real — the same file opened again — and the two talk
as they do in the product. SMP_BUILT points it at another build (§276).
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
def until(pg, js, ms=4000):
    for _ in range(ms // 100):
        if safe(pg, js): return True
        pg.wait_for_timeout(100)
    return False

FLOW = "['mobile','fn:finance']"
EXTENDED = "Object.defineProperty(Screen.prototype,'isExtended',{get(){return !!window.__two}, configurable:true});"
ROOMAT = "()=>{var s=DECK.slides[DECK.i]; return s ? [DECK.i, JSON.stringify(slidesWhich(DECK.slides, DECK.i))] : null}"
SELWHICH = "()=>JSON.stringify(slidesWhich(SLED.all, SLED.all.map(e=>e.dataset.ed).indexOf(SLED.sel)))"
ONROW = "()=>[].map.call(document.querySelectorAll('#slidelist .slrow'), (r,i)=>r.classList.contains('onscreen')?i:-1).filter(i=>i>=0)"
SELROW = "()=>SLED.all.map(e=>e.dataset.ed).indexOf(SLED.sel)"
LIVE = "()=>{var e=document.querySelector('#slideroot .sl-live'); return e ? e.textContent : ''}"
NOTE = "()=>!!document.querySelector('#slidepane .sl-notroom')"
STRIP = "()=>{var e=document.getElementById('roomstrip'); return e ? e.textContent : ''}"

with sync_playwright() as p:
    b = p.chromium.launch(executable_path=os.environ.get("SMP_CHROME") or None)
    ctx = b.new_context(viewport={"width": 1600, "height": 900})
    ctx.add_init_script("try{sessionStorage.setItem('smp.welcome.done','1');localStorage.setItem('smp.tour.never','1')}catch(e){}" + EXTENDED)
    pg = ctx.new_page()
    errs = []; pg.on("pageerror", lambda e: errs.append("laptop: " + str(e)))
    pg.goto("file://" + os.path.abspath(BUILT)); pg.wait_for_timeout(800)
    office = safe(pg, "()=>(PEOPLE.find(p=>SMPRules.mayMasterPresent(world(), p))||{}).key")
    safe(pg, "()=>{switchViewer('%s'); return true}" % office); pg.wait_for_timeout(300)

    # ── 0. One screen: Present is what it was ─────────────────────────────
    safe(pg, "()=>{window.__two=false; slidesOpenFlow(%s); return true}" % FLOW); pg.wait_for_timeout(500)
    pages = len(ctx.pages)
    pg.keyboard.press("p"); pg.wait_for_timeout(500)
    ck("one screen: P presents on this screen, as before, and opens no window",
       safe(pg, "()=>document.getElementById('deckroot').classList.contains('on')") is True and len(ctx.pages) == pages,
       len(ctx.pages))
    for _ in range(2):  # out of full screen where the browser gave it, then out of the deck
        if safe(pg, "()=>document.getElementById('deckroot').classList.contains('on')"):
            pg.keyboard.press("Escape"); pg.wait_for_timeout(300)
    ck("…and Esc comes back to the slide view", safe(pg, "()=>document.getElementById('slideroot').classList.contains('on') && !document.getElementById('deckroot').classList.contains('on')") is True)

    # ── 1. Two screens: the room gets the slides, the laptop keeps the view
    safe(pg, "()=>{window.__two=true; SLED.sel=SLED.all[2].dataset.ed; slidesPaint(); return true}"); pg.wait_for_timeout(200)
    want = safe(pg, SELWHICH)
    with ctx.expect_page(timeout=5000) as pi:
        pg.keyboard.press("p")
    room = pi.value
    room.on("pageerror", lambda e: errs.append("room: " + str(e)))
    up = until(room, "()=>document.getElementById('deckroot').classList.contains('on')", 8000)
    room.wait_for_timeout(600)
    ck("two screens: P opens the slides in a window of their own", up and "room=1" in room.url, room.url)
    ck("…the laptop stays on the slide view, with nothing presented over it",
       safe(pg, "()=>document.getElementById('slideroot').classList.contains('on') && !document.getElementById('deckroot').classList.contains('on')") is True)
    at = safe(room, ROOMAT)
    ck("…the room opens on the slide the laptop had selected", at and at[1] == want, (at, want))
    ck("…filling its window, with the platform behind it unseen",
       safe(room, "()=>document.getElementById('deckroot').classList.contains('fs') && getComputedStyle(document.querySelector('.wrap')).visibility==='hidden'") is True)
    ck("…and asks for the one click full screen needs there, unless the browser gave it already",
       safe(room, "()=>!!document.querySelector('#deckroot .roomfull') !== (document.fullscreenElement===document.getElementById('deckroot'))") is True)
    until(pg, "()=>ROOM && ROOM.at && ROOM.at.on")
    live = safe(pg, LIVE) or ""
    total = safe(room, "()=>DECK.slides.length")
    ck("the slide view says what the room is seeing, which slide of how many",
       "On the room" in live and ("slide %d of %d" % (at[0] + 1, total)) in live if at else False, live)
    ck("…marks that slide ON SCREEN in the list", safe(pg, ONROW) == [safe(pg, SELROW)], (safe(pg, ONROW), safe(pg, SELROW)))
    ck("…and Present now reads Stop presenting",
       safe(pg, "()=>document.querySelector('[data-slplay] .lbl').textContent") == "Stop presenting")
    keys = safe(pg, "()=>document.getElementById('slkeys').textContent") or ""
    ck("…with the keys for driving the room listed", "move the room" in live and "update figures" in live and
       "show it to the room" in keys and "back to what they see" in keys, (live, keys))

    # ── 2. Arrows move the room, the laptop follows ───────────────────────
    i0 = safe(room, "()=>DECK.i")
    pg.keyboard.press("ArrowRight"); pg.wait_for_timeout(400)
    i1 = safe(room, "()=>DECK.i")
    ck("→ on the laptop moves the room forward", i1 == i0 + 1, (i0, i1))
    pg.wait_for_timeout(300)
    ck("…and the laptop's selection follows it", safe(pg, SELWHICH) == safe(room, ROOMAT)[1], (safe(pg, SELWHICH), safe(room, ROOMAT)))
    pg.keyboard.press("ArrowLeft"); pg.wait_for_timeout(500)
    ck("← moves it back", safe(room, "()=>DECK.i") == i0, safe(room, "()=>DECK.i"))

    # ── 3. A click looks without showing; Esc comes back; Enter shows ─────
    room_i = safe(room, "()=>DECK.i")
    pg.click("#slidelist .slrow:nth-child(7)"); pg.wait_for_timeout(300)
    if safe(pg, SELROW) != 6:  # rows may carry headings between them
        safe(pg, "()=>{SLED.sel=SLED.all[6].dataset.ed; slidesPaint(); return true}"); pg.wait_for_timeout(200)
    pg.wait_for_timeout(700)
    ck("clicking another slide shows it on the laptop only", safe(room, "()=>DECK.i") == room_i and safe(pg, SELROW) == 6,
       (safe(room, "()=>DECK.i"), safe(pg, SELROW)))
    ck("…saying the room cannot see it", safe(pg, NOTE) is True)
    ck("…with the whole slide still on the stage", safe(pg, """()=>{var st=document.querySelector('#slidepane .sstage-in');
        var pn=document.querySelector('#slidepane .sstage').getBoundingClientRect(), r=st && st.getBoundingClientRect();
        return !!r && r.bottom <= pn.bottom + 1}""") is True)
    ck("…and the room's reports do not pull the laptop back", safe(pg, SELROW) == 6, safe(pg, SELROW))
    pg.keyboard.press("Escape"); pg.wait_for_timeout(300)
    ck("Esc brings the laptop back to what the room is seeing, still in the slide view",
       safe(pg, SELWHICH) == safe(room, ROOMAT)[1] and safe(pg, NOTE) is False and
       safe(pg, "()=>document.getElementById('slideroot').classList.contains('on')") is True,
       (safe(pg, SELWHICH), safe(room, ROOMAT)))
    safe(pg, "()=>{SLED.sel=SLED.all[6].dataset.ed; slidesPaint(); return true}"); pg.wait_for_timeout(200)
    want6 = safe(pg, SELWHICH)
    pg.keyboard.press("Enter"); pg.wait_for_timeout(600)
    ck("Enter puts it on the room's screen", safe(room, ROOMAT)[1] == want6, (safe(room, ROOMAT), want6))
    ck("…and the ON SCREEN mark moves to it, the note gone", safe(pg, ONROW) == [6] and safe(pg, NOTE) is False, safe(pg, ONROW))
    ck("P does nothing more while presenting", safe(pg, "()=>{var e=new KeyboardEvent('keydown',{key:'p'}); dispatchEvent(e); return document.getElementById('deckroot').classList.contains('on')}") is False
       and len(ctx.pages) == 2, len(ctx.pages))

    # ── 4. T, Y and R act on the room ─────────────────────────────────────
    safe(room, "()=>{DECK.clock={t:clockSubject(), mins:15, ran:3*60000, from:Date.now()}; clockPaint(); window.__calls=0; SYNC.refresh=function(done){window.__calls++; done(true,false)}; return true}")
    pg.wait_for_timeout(700)
    ck("the room's clock reads on the laptop", "11:5" in (safe(pg, LIVE) or "") or "12:00" in (safe(pg, LIVE) or ""), safe(pg, LIVE))
    pg.keyboard.press("t"); pg.wait_for_timeout(500)
    ck("T on the laptop pauses the room's timer", safe(room, "()=>DECK.clock && DECK.clock.from===null") is True)
    ck("…and the laptop says it is paused", "paused" in (safe(pg, LIVE) or ""), safe(pg, LIVE))
    pg.keyboard.press("t"); pg.wait_for_timeout(300)
    ck("T again starts it", safe(room, "()=>DECK.clock && !!DECK.clock.from") is True)
    pg.keyboard.press("y"); pg.wait_for_timeout(300)
    ck("Y resets the room's timer", safe(room, "()=>Math.round(clockLeft()/60000)") == 15, safe(room, "()=>clockLeft()"))
    pg.keyboard.press("r"); pg.wait_for_timeout(500)
    ck("R updates the figures on the room's screen", safe(room, "()=>window.__calls") == 1, safe(room, "()=>window.__calls"))

    # ── 5. The room's window: no saving, no closing ──────────────────────
    ck("the room's window saves nothing", safe(room, "()=>new Promise(r=>SYNC.saveNow(r))") == "clean"
       and safe(pg, "()=>new Promise(r=>SYNC.saveNow(r))") != "clean",
       (safe(room, "()=>new Promise(r=>SYNC.saveNow(r))"), safe(pg, "()=>new Promise(r=>SYNC.saveNow(r))")))
    fsd = safe(room, "()=>document.fullscreenElement===document.getElementById('deckroot')")
    room.keyboard.press("Escape"); room.wait_for_timeout(400)
    ck("Esc on the projector does not close the slides there",
       safe(room, "()=>document.getElementById('deckroot').classList.contains('on') && document.getElementById('deckroot').classList.contains('fs')") is True, fsd)
    room.keyboard.press("Escape"); room.wait_for_timeout(400)
    ck("…pressed twice, neither", safe(room, "()=>document.getElementById('deckroot').classList.contains('on')") is True)
    ck("…and it asks again for the click full screen needs",
       safe(room, "()=>!!document.querySelector('#deckroot .roomfull')") is True)
    ri = safe(room, "()=>DECK.i")
    room.keyboard.press("ArrowRight"); room.wait_for_timeout(600)
    ck("a clicker on the projector's window moves the room, and the laptop follows",
       safe(room, "()=>DECK.i") == ri + 1 and safe(pg, SELWHICH) == safe(room, ROOMAT)[1],
       (ri, safe(room, "()=>DECK.i"), safe(pg, SELWHICH), safe(room, ROOMAT)))

    # ── 6. Away from the slide view: the strip ────────────────────────────
    pg.keyboard.press("Escape"); pg.wait_for_timeout(500)
    ck("Esc on the room's slide leaves the slide view; the room keeps its slide",
       safe(pg, "()=>document.getElementById('slideroot').classList.contains('on')") is False and
       safe(room, "()=>document.getElementById('deckroot').classList.contains('on')") is True)
    pg.wait_for_timeout(600)
    strip = safe(pg, STRIP) or ""
    ck("a strip at the top of the page says what the room is seeing",
       "Presenting on the second screen" in strip and "slide " in strip and "Back to slides" in strip, strip)
    ck("…pinned with the page's own bars", safe(pg, "()=>!!document.querySelector('.chrome > #roomstrip')") is True)
    ri = safe(room, "()=>DECK.i")
    pg.keyboard.press("ArrowRight"); pg.wait_for_timeout(400)
    ck("on a page the keys stay the page's own: → does not move the room", safe(room, "()=>DECK.i") == ri)
    pg.click("#roomstrip [data-rs='next']"); pg.wait_for_timeout(500)
    ck("the strip's → moves the room", safe(room, "()=>DECK.i") == ri + 1, (ri, safe(room, "()=>DECK.i")))
    pg.click("#roomstrip [data-rs='prev']"); pg.wait_for_timeout(500)
    ck("…its ← back", safe(room, "()=>DECK.i") == ri)
    safe(room, "()=>{DECK.clock={t:clockSubject(), mins:15, ran:0, from:Date.now()}; clockPaint(); return true}"); pg.wait_for_timeout(700)
    pg.click("#roomstrip [data-rs='t']"); pg.wait_for_timeout(500)
    ck("…its T pauses the room's timer", safe(room, "()=>DECK.clock && DECK.clock.from===null") is True)
    pg.wait_for_timeout(600)
    ck("…and the button then offers to start it", "T start" in (safe(pg, STRIP) or ""), safe(pg, STRIP))
    pg.click("#roomstrip [data-rs='back']"); pg.wait_for_timeout(700)
    ck("Back to slides opens the slide view on the room's slide, the strip gone",
       safe(pg, "()=>document.getElementById('slideroot').classList.contains('on')") is True and
       safe(pg, SELWHICH) == safe(room, ROOMAT)[1] and not safe(pg, STRIP) and "On the room" in (safe(pg, LIVE) or ""),
       (safe(pg, SELWHICH), safe(room, ROOMAT), safe(pg, STRIP)))

    # ── 7. Stopping ───────────────────────────────────────────────────────
    pg.click("#slideroot [data-slplay]"); pg.wait_for_timeout(700)
    ck("Stop presenting closes the room's window and the strip",
       room.is_closed() and not safe(pg, LIVE) and safe(pg, "()=>document.querySelector('[data-slplay] .lbl').textContent") == "Present",
       (room.is_closed(), safe(pg, LIVE)))
    with ctx.expect_page(timeout=5000) as pi:
        pg.click("#slideroot [data-slplay]")
    room = pi.value
    until(room, "()=>document.getElementById('deckroot').classList.contains('on')", 8000)
    until(pg, "()=>ROOM && ROOM.at && ROOM.at.on")
    room.close(); pg.wait_for_timeout(1200)
    ck("closing the projector's window ends presenting on the laptop",
       safe(pg, "()=>ROOM===null") is True and not safe(pg, LIVE) and safe(pg, ONROW) == [], (safe(pg, LIVE), safe(pg, ONROW)))
    safe(pg, "()=>{slidesClose(); return true}"); pg.wait_for_timeout(300)

    # ── 8. The office only, for now ───────────────────────────────────────
    other = safe(pg, """()=>{for (const p of PEOPLE) { switchViewer(p.key);
        if (!inOffice() && canSpeakFor('mobile')) return p.key; } return null}""")
    pg.wait_for_timeout(300)
    if other:
        safe(pg, "()=>{slidesOpen('unit','mobile'); return true}"); pg.wait_for_timeout(500)
        n = len(ctx.pages)
        pg.keyboard.press("p"); pg.wait_for_timeout(600)
        ck("somebody outside the office presents on one screen, as before",
           len(ctx.pages) == n and safe(pg, "()=>document.getElementById('deckroot').classList.contains('on')") is True, len(ctx.pages))
    else:
        ck("a unit presenter outside the office was found to test with", False)

    ck("no page errors", not errs, errs[:3])
    b.close()
print("FAILED" if bad else "all green", bad)
raise SystemExit(1 if bad else 0)
