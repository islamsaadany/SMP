"""The remote, from any page of the platform (§582.2).

Islam: on the platform making edits, the remote's and the keyboard's arrows
stopped reaching the slides window — they went to the window in front.
Now, while the slides are up (two screens or a window, §582 / §582.1) and
somebody is on any other page: Page Down / Page Up and → / ← move the
slides, T holds or starts their timer; ↑ ↓ keep scrolling the page ("keep
for scrolling"); typing in a box, a control that uses the keys (the tab
bar), and Alt / Ctrl / Cmd with them are never taken. BOTH ENDS (§94.2):
each key that moves the slides, and each place it must not. The slides
window is real — the same file opened again. SMP_BUILT points it at another
build (§276).
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

with sync_playwright() as p:
    b = p.chromium.launch(executable_path=os.environ.get("SMP_CHROME") or None)
    ctx = b.new_context(viewport={"width": 1440, "height": 860})
    ctx.add_init_script("try{sessionStorage.setItem('smp.welcome.done','1');localStorage.setItem('smp.tour.never','1')}catch(e){}")
    pg = ctx.new_page()
    errs = []; pg.on("pageerror", lambda e: errs.append("laptop: " + str(e)))
    pg.goto("file://" + os.path.abspath(BUILT)); pg.wait_for_timeout(800)
    office = safe(pg, "()=>(PEOPLE.find(p=>SMPRules.mayMasterPresent(world(), p))||{}).key")
    safe(pg, "()=>{switchViewer('%s'); slidesOpenFlow(['mobile','fn:finance']); SLED.sel=SLED.all[3].dataset.ed; slidesPaint(); return true}" % office)
    pg.wait_for_timeout(500)
    with ctx.expect_page(timeout=5000) as pi:
        pg.click("#slideroot [data-slwin]")
    room = pi.value
    room.on("pageerror", lambda e: errs.append("room: " + str(e)))
    until(room, "()=>document.getElementById('deckroot').classList.contains('on')", 8000)
    until(pg, "()=>ROOM && ROOM.at && ROOM.at.on")
    safe(room, "()=>{DECK.clock={t:clockSubject(), mins:15, ran:0, from:Date.now()}; clockPaint(); return true}")
    # Out of the slide view onto a page of the platform, the slides kept.
    pg.keyboard.press("Escape"); pg.wait_for_timeout(600)
    ck("on a page of the platform, the slides still up", safe(pg, "()=>!document.getElementById('slideroot').classList.contains('on') && !!ROOM") is True)
    safe(pg, "()=>{document.activeElement && document.activeElement.blur && document.activeElement.blur(); return true}")
    I = "()=>DECK.i"

    def press(key, settle=450):
        before = safe(room, I)
        pg.keyboard.press(key); pg.wait_for_timeout(settle)
        return before, safe(room, I)

    # ── 1. The keys that move the slides ─────────────────────────────────
    a, z = press("PageDown"); ck("Page Down moves the slides forward", z == a + 1, (a, z))
    a, z = press("PageUp");   ck("Page Up moves them back", z == a - 1, (a, z))
    a, z = press("ArrowRight"); ck("→ moves them forward", z == a + 1, (a, z))
    a, z = press("ArrowLeft");  ck("← moves them back", z == a - 1, (a, z))
    held = safe(room, "()=>!!DECK.clock.from")
    pg.keyboard.press("t"); pg.wait_for_timeout(450)
    ck("T holds the timer", held is True and safe(room, "()=>DECK.clock.from===null") is True)
    pg.keyboard.press("t"); pg.wait_for_timeout(450)
    ck("T again starts it", safe(room, "()=>!!DECK.clock.from") is True)
    pg.wait_for_timeout(700)
    strip = safe(pg, "()=>(document.getElementById('roomstrip')||{}).textContent||''") or ""
    ck("the strip on the page says which keys reach the slides", "PgDn" in strip and "next" in strip and "PgUp" in strip and "T timer" in strip, strip)

    # ── 2. Where they must not ───────────────────────────────────────────
    a, z = press("ArrowDown"); ck("↓ keeps scrolling the page: the slides stay", z == a, (a, z))
    a, z = press("ArrowUp");   ck("↑ the same", z == a, (a, z))
    a, z = press("Alt+ArrowRight"); ck("Alt with → is the platform's, not the slides'", z == a, (a, z))
    box = safe(pg, """()=>{var i=document.createElement('input'); i.id='__probe'; i.value='12345'; document.querySelector('.wrap').prepend(i); i.focus(); i.setSelectionRange(2,2); return true}""")
    a, z = press("ArrowRight")
    caret = safe(pg, "()=>document.getElementById('__probe').selectionStart")
    ck("typing in a box: → moves the cursor in the box, not the slides", z == a and caret == 3, (a, z, caret))
    a, z = press("PageDown"); ck("…Page Down in a box leaves the slides too", z == a, (a, z))
    clk = safe(room, "()=>!!DECK.clock.from")
    pg.keyboard.type("t"); pg.wait_for_timeout(400)
    ck("…and a T typed is a letter in the box, the timer untouched",
       safe(pg, "()=>document.getElementById('__probe').value") == "123t45" and safe(room, "()=>!!DECK.clock.from") == clk,
       safe(pg, "()=>document.getElementById('__probe').value"))
    safe(pg, "()=>{document.getElementById('__probe').remove(); return true}")
    tab = safe(pg, "()=>{var t=[...document.querySelectorAll('[role=\"tab\"]')].find(x=>x.offsetParent); if(!t) return false; t.focus(); return document.activeElement===t}")
    if tab:
        a, z = press("ArrowRight")
        ck("on the tab bar, → is the tab bar's", z == a, (a, z))
    else:
        ck("a tab bar was found to test with", False)
    safe(pg, "()=>{document.activeElement && document.activeElement.blur(); return true}")

    # ── 3. Back in the slide view, and after stopping ────────────────────
    pg.click("#roomstrip [data-rs='back']"); pg.wait_for_timeout(700)
    a, z = press("ArrowRight")
    ck("in the slide view → still moves the slides once, as §582 has it", z == a + 1, (a, z))
    pg.click("#slideroot [data-slplay]"); pg.wait_for_timeout(800)
    safe(pg, "()=>{slidesClose(); return true}"); pg.wait_for_timeout(400)
    safe(pg, "()=>{window.__taken=null; addEventListener('keydown', function(e){ if (e.key==='PageDown') window.__taken=e.defaultPrevented; }); return true}")
    pg.keyboard.press("PageDown"); pg.wait_for_timeout(200)
    ck("presenting stopped: the window closed, and Page Down is the page's again, nothing taken",
       safe(pg, "()=>ROOM===null") is True and room.is_closed() and safe(pg, "()=>window.__taken") is False,
       (safe(pg, "()=>ROOM"), room.is_closed(), safe(pg, "()=>window.__taken")))
    ck("no page errors", not errs, errs[:3])
    b.close()
print("FAILED" if bad else "all green", bad)
raise SystemExit(1 if bad else 0)
