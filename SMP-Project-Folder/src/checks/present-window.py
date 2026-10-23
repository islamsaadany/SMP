"""Presenting in a window, for an online meeting (§582.1).

Islam, presenting from a Mac in Teams, Zoom or Meet with no second screen:
the slides in a window of their own that the meeting shares, the slide view
staying on the laptop to drive them. "Always there, office only, build it."

The two-screen machinery (§582), told it is a window: the button before
Present, for the office whatever is plugged in; pressed, a window on this
screen named "Slides · <client> · <what>", filling with the slide and never
asking for full screen; the laptop's strip saying which window to share.
The window is real — the same file opened again. SMP_BUILT points it at
another build (§276).
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
BTN = "()=>{var b=document.querySelector('#slideroot [data-slwin]'); return b ? {hidden:b.hidden, text:b.textContent.trim(), w:b.getBoundingClientRect().width} : null}"
LIVE = "()=>{var e=document.querySelector('#slideroot .sl-live'); return e ? e.textContent : ''}"
STRIP = "()=>{var e=document.getElementById('roomstrip'); return e ? e.textContent : ''}"
ROOMAT = "()=>DECK.i"
ON = "()=>document.getElementById('deckroot').classList.contains('on')"

with sync_playwright() as p:
    b = p.chromium.launch(executable_path=os.environ.get("SMP_CHROME") or None)
    ctx = b.new_context(viewport={"width": 1440, "height": 860})
    ctx.add_init_script("try{sessionStorage.setItem('smp.welcome.done','1');localStorage.setItem('smp.tour.never','1')}catch(e){}" + EXTENDED)
    pg = ctx.new_page()
    errs = []; pg.on("pageerror", lambda e: errs.append("laptop: " + str(e)))
    pg.goto("file://" + os.path.abspath(BUILT)); pg.wait_for_timeout(800)
    office = safe(pg, "()=>(PEOPLE.find(p=>SMPRules.mayMasterPresent(world(), p))||{}).key")
    org = safe(pg, "()=>String(GROUP.org||'').trim()")
    safe(pg, "()=>{switchViewer('%s'); return true}" % office); pg.wait_for_timeout(300)

    # ── 1. The button: the office's, whatever is plugged in ──────────────
    safe(pg, "()=>{window.__two=false; slidesOpenFlow(%s); return true}" % FLOW); pg.wait_for_timeout(500)
    bt = safe(pg, BTN)
    ck("one screen: Present in a window is in the slide view's bar", bt and not bt["hidden"] and bt["text"] == "Present in a window" and bt["w"] > 0, bt)
    ck("…just before Present", safe(pg, "()=>{var b=document.querySelector('#slideroot [data-slwin]'); return b.nextElementSibling===document.querySelector('#slideroot [data-slplay]')}") is True)
    safe(pg, "()=>{window.__two=true; slidesPaint(); return true}"); pg.wait_for_timeout(200)
    ck("…and still there with a second screen connected", (safe(pg, BTN) or {}).get("hidden") is False, safe(pg, BTN))
    safe(pg, "()=>{window.__two=false; SLED.sel=SLED.all[2].dataset.ed; slidesPaint(); return true}"); pg.wait_for_timeout(200)
    want = safe(pg, "()=>JSON.stringify(slidesWhich(SLED.all, 2))")

    # ── 2. Pressed: a window on this screen ──────────────────────────────
    pages = len(ctx.pages)
    with ctx.expect_page(timeout=5000) as pi:
        pg.click("#slideroot [data-slwin]")
    room = pi.value
    room.on("pageerror", lambda e: errs.append("room: " + str(e)))
    up = until(room, ON, 8000); room.wait_for_timeout(700)
    ck("pressed: the slides open in a window of their own", up and "room=1" in room.url and len(ctx.pages) == pages + 1, room.url)
    ck("…the laptop stays on the slide view, nothing presented over it",
       safe(pg, "()=>document.getElementById('slideroot').classList.contains('on') && !document.getElementById('deckroot').classList.contains('on')") is True)
    ck("…the window opens on the slide that was selected", safe(room, "()=>JSON.stringify(slidesWhich(DECK.slides, DECK.i))") == want,
       (safe(room, "()=>JSON.stringify(slidesWhich(DECK.slides, DECK.i))"), want))
    ck("…the slide fills it, the platform behind unseen",
       safe(room, "()=>document.getElementById('deckroot').classList.contains('fs') && getComputedStyle(document.querySelector('.wrap')).visibility==='hidden'") is True)
    ck("…and it never asks to go full screen", safe(room, "()=>!document.querySelector('#deckroot .roomfull') && document.fullscreenElement===null") is True)
    title = safe(room, "()=>document.title") or ""
    ck("the window is named for the meeting's list: Slides · client · Master presentation",
       title == "Slides · %s · Master presentation" % org if org else title == "Slides · Master presentation", title)

    # ── 3. The laptop says what to share ─────────────────────────────────
    until(pg, "()=>ROOM && ROOM.at && ROOM.at.on")
    pg.wait_for_timeout(400)
    live = safe(pg, LIVE) or ""
    ck("the strip says In the slides window, the slide and slide n of N", "In the slides window" in live and "slide 3 of" in live, live)
    ck("…and which window to share, by its name", ("share the window called “%s”" % title) in live, live)
    ck("…with no word about full screen or a projector", "full screen" not in live and "projector" not in live, live)
    ck("Present reads Stop presenting, and Present in a window is gone",
       safe(pg, "()=>document.querySelector('#slideroot [data-slplay] .lbl').textContent") == "Stop presenting" and (safe(pg, BTN) or {}).get("hidden") is True)

    # ── 4. Driving it, as on two screens ─────────────────────────────────
    i0 = safe(room, ROOMAT)
    pg.keyboard.press("ArrowRight"); pg.wait_for_timeout(500)
    ck("→ on the laptop moves the slides window", safe(room, ROOMAT) == i0 + 1, (i0, safe(room, ROOMAT)))
    safe(pg, "()=>{SLED.sel=SLED.all[6].dataset.ed; slidesPaint(); return true}"); pg.wait_for_timeout(300)
    ck("a slide looked at is said to be not in the slides window",
       "Not in the slides window" in (safe(pg, "()=>(document.querySelector('#slidepane .sl-notroom')||{}).textContent||''") or ""))
    pg.keyboard.press("Enter"); pg.wait_for_timeout(600)
    ck("Enter shows it there", safe(room, "()=>JSON.stringify(slidesWhich(DECK.slides, DECK.i))") == safe(pg, "()=>JSON.stringify(slidesWhich(SLED.all, 6))"))
    room.keyboard.press("Escape"); room.wait_for_timeout(400)
    ck("Esc in the slides window keeps the slides", safe(room, ON) is True and not safe(room, "()=>!!document.querySelector('#deckroot .roomfull')"))
    safe(room, "()=>{window.__calls=0; SYNC.refresh=function(done){ window.__calls++; GROUP.org=GROUP.org; done(true,true); }; return true}")
    pg.keyboard.press("r"); pg.wait_for_timeout(900)
    ck("R updates the figures there, and the window keeps its name",
       safe(room, "()=>window.__calls") == 1 and safe(room, "()=>document.title") == title, (safe(room, "()=>window.__calls"), safe(room, "()=>document.title")))

    # ── 5. Away from the slide view ──────────────────────────────────────
    pg.keyboard.press("Escape"); pg.wait_for_timeout(300)
    if safe(pg, "()=>document.getElementById('slideroot').classList.contains('on')"):
        pg.keyboard.press("Escape"); pg.wait_for_timeout(300)
    pg.wait_for_timeout(700)
    strip = safe(pg, STRIP) or ""
    ck("on any other page the strip says Presenting in the slides window", "Presenting in the slides window" in strip and "Back to slides" in strip, strip)
    pg.click("#roomstrip [data-rs='back']"); pg.wait_for_timeout(700)

    # ── 6. Stopping ──────────────────────────────────────────────────────
    pg.click("#slideroot [data-slplay]"); pg.wait_for_timeout(800)
    ck("Stop presenting closes the slides window, and the button comes back",
       room.is_closed() and not safe(pg, LIVE) and (safe(pg, BTN) or {}).get("hidden") is False, (room.is_closed(), safe(pg, BTN)))

    # ── 7. Present is as it was ──────────────────────────────────────────
    with ctx.expect_page(timeout=5000) as pi:
        safe(pg, "()=>{window.__two=true; return true}")
        pg.click("#slideroot [data-slplay]")
    proj = pi.value
    until(proj, ON, 8000); until(pg, "()=>ROOM && ROOM.at && ROOM.at.on")
    ck("with a second screen, Present still goes to the projector", safe(pg, "()=>ROOM && ROOM.mode") == "screen" and "On the room" in (safe(pg, LIVE) or ""), safe(pg, LIVE))
    pg.click("#slideroot [data-slplay]"); pg.wait_for_timeout(700)
    safe(pg, "()=>{window.__two=false; return true}")
    pg.keyboard.press("p"); pg.wait_for_timeout(500)
    ck("with one screen, Present still fills this screen", safe(pg, ON) is True and len(ctx.pages) == 1, len(ctx.pages))
    for _ in range(2):
        if safe(pg, ON): pg.keyboard.press("Escape"); pg.wait_for_timeout(300)
    safe(pg, "()=>{slidesClose(); return true}"); pg.wait_for_timeout(300)

    # ── 8. The office only ───────────────────────────────────────────────
    other = safe(pg, """()=>{for (const p of PEOPLE) { switchViewer(p.key);
        if (!inOffice() && canSpeakFor('mobile')) return p.key; } return null}""")
    pg.wait_for_timeout(300)
    if other:
        safe(pg, "()=>{slidesOpen('unit','mobile'); return true}"); pg.wait_for_timeout(500)
        ck("somebody outside the office has no Present in a window", (safe(pg, BTN) or {}).get("hidden") is True, safe(pg, BTN))
        n = len(ctx.pages)
        safe(pg, "()=>{slidesPlayWindow(); return true}"); pg.wait_for_timeout(600)
        ck("…and asking for it opens nothing", len(ctx.pages) == n, len(ctx.pages))
    else:
        ck("a unit presenter outside the office was found to test with", False)

    ck("no page errors", not errs, errs[:3])
    b.close()
print("FAILED" if bad else "all green", bad)
raise SystemExit(1 if bad else 0)
