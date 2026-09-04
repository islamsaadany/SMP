"""FULLSCREEN IS THE SLIDE, THE ARROWS AND NOTHING ELSE (§265).

Islam, from a live presentation: *"on the presntation in full screen with every
click the bottom banner appear then hide. it shouldn't appear full screen
accepts only the arros. down and rigth for moving the slides forward left and
up takes me back and the escape button to exit the full screen."*

§69.7 hid the bar in fullscreen and brought it back for 2.2 seconds on a
pointer move, so a presenter could always find Exit. `pointerdown` is a pointer
move, so every click flashed a navy strip across the bottom of the projected
slide and took it away again. This reverses that half of §69.7 and rebuilds the
way out of the keyboard.

WHAT IS ASSERTED, AND WHY EACH ONE IS HERE:

  1 · THE BAR IS OFF THE SCREEN IN FULLSCREEN AND A CLICK DOES NOT BRING IT
      BACK. The fault is TRANSIENT — it showed for 2.2s — so the bar is
      measured immediately after the click and again a beat later, and
      `pointermove` is driven too. Measured as a BOX and as hit-testing, never
      as a class: a build that renamed the class and kept the behaviour must
      still fail (§94.8).

  2 · A CLICK ON THE SLIDE ADVANCES IT, in fullscreen only (Islam's choice) —
      and a click on an interactive target does NOT, or clicking into the note
      box to type would move the slide out from under the cursor.

  3 · FORWARD IS FOUR KEYS AND BACK IS THREE, each asserted to move the deck
      AND to stop the page behind it scrolling. Both directions, or a build
      that advanced on every key would pass every forward assertion (§113.8).

  4 · ESCAPE LEAVES FULLSCREEN AND THE DECK IS STILL OPEN; pressed again it
      closes the deck. This is the second half of what was reported: one key
      used to do both, in front of the room.

  5 · WINDOWED MODE IS UNTOUCHED, measured rather than claimed (§53.5) — the
      bar is on screen and a click on the stage does not advance, because the
      bar's own Next button is six inches below it.

Run it against the shipped pre-§265 file to watch it fail:
  python3 qa-run.py checks/deck-fullscreen.py ../strategy-management-platform-v3.22.html
"""
import os, sys
from playwright.sync_api import sync_playwright

HERE = os.path.dirname(os.path.abspath(__file__))
FILE = (os.path.abspath(sys.argv[1]) if len(sys.argv) > 1 else
        os.path.join(os.path.dirname(HERE), "strategy-management-platform.html"))
fails = []


def ok(label, cond, detail=""):
    if cond:
        print("  ok      " + label)
    else:
        fails.append(label)
        print("  FAIL    " + label + ("  — " + str(detail) if detail != "" else ""))


def js(pg, expr, arg=None):
    """Every probe degrades rather than dying: a check that throws on the build
    it exists to judge reports zero failures and looks like a pass (§215)."""
    try:
        return pg.evaluate(expr, arg) if arg is not None else pg.evaluate(expr)
    except Exception as e:                                        # noqa: BLE001
        return {"threw": str(e).strip().split("\n")[0]}


# ── Where the bar IS, and whether anything can reach it ──────────────────────
# Not "does it carry a class": the whole point is what the room sees. A bar
# pushed below the fold reports a top at or past the window's height; a bar
# that is back reports a top inside it and answers elementFromPoint.
BAR = """() => {
  const r = document.getElementById('deckroot');
  const bar = r && r.querySelector('.deckbar');
  if (!bar) return { missing: true };
  const b = bar.getBoundingClientRect();
  const cs = getComputedStyle(bar);
  const x = Math.round(b.left + b.width / 2), y = Math.round(b.top + b.height / 2);
  const at = (y >= 0 && y < innerHeight) ? document.elementFromPoint(x, y) : null;
  return { top: Math.round(b.top), h: Math.round(b.height), wh: innerHeight,
           opacity: +cs.opacity, events: cs.pointerEvents,
           /* HEIGHT IS PART OF "ON SCREEN". Without it a CLOSED deck reports
              top 0, height 0, opacity 1 and satisfies every assertion that the
              bar came back — which it did on the pre-§265 build, where Escape
              had closed the deck (§94.5). */
           onScreen: b.height > 1 && b.top < innerHeight - 1 && +cs.opacity > .05,
           reachable: !!(at && (at === bar || bar.contains(at))),
           fs: !!r.classList.contains('fs'),
           deckOpen: !!r.classList.contains('on'),
           reallyFs: document.fullscreenElement === r };
}"""

STATE = """() => {
  const r = document.getElementById('deckroot');
  return { i: (typeof DECK === 'undefined' ? null : DECK.i),
           n: (typeof DECK === 'undefined' ? null : (DECK.slides || []).length),
           deckOpen: !!(r && r.classList.contains('on')),
           reallyFs: !!(r && document.fullscreenElement === r) };
}"""


def bar_hidden(pg, when):
    r = js(pg, BAR)
    ok("the bar is off the screen " + when, r.get("onScreen") is False, r)
    ok("...and nothing can reach it " + when, r.get("reachable") is False, r)


with sync_playwright() as p:
    b = p.chromium.launch(executable_path=os.environ.get("SMP_CHROME"))
    # Touch is emulated for §6. The mouse still reports pointerType "mouse",
    # so the mouse assertions above are measuring what they always did — and
    # a tablet that also has a trackpad is the honest case anyway.
    pg = b.new_page(viewport={"width": 1400, "height": 900}, has_touch=True)
    pg.add_init_script("try{sessionStorage.setItem('smp.welcome.seen','1');"
                       "sessionStorage.setItem('smp.welcome.done','1');"
                       "sessionStorage.setItem('smp.tour.later','1');}catch(e){}")
    errs = []
    pg.on("pageerror", lambda e: errs.append(str(e)))
    pg.goto("file://" + FILE)
    pg.wait_for_timeout(900)
    print("\nmeasuring " + os.path.basename(FILE))

    # ── open a real deck ─────────────────────────────────────────────────────
    print("\n── the fixture: a unit's deck, open")
    fx = js(pg, "() => { openDeck(unitLike(activeKeys()[0])); "
                "return { key: activeKeys()[0], n: DECK.slides.length }; }")
    pg.wait_for_timeout(400)
    ok("the deck opened with slides in it", (fx.get("n") or 0) > 5, fx)
    if not (fx.get("n") or 0) > 5:
        b.close(); sys.exit(1)

    # ── 5 · windowed mode first, so a later fullscreen assertion cannot be
    #        satisfied by a build that simply lost the bar altogether ─────────
    print("\n── 5 · windowed mode is untouched (§53.5)")
    js(pg, "() => deckShow(2)")
    r = js(pg, BAR)
    ok("windowed — the bar is on screen", r.get("onScreen") is True, r)
    ok("windowed — and it can be pressed", r.get("reachable") is True, r)
    pg.mouse.click(700, 350)
    pg.wait_for_timeout(120)
    s = js(pg, STATE)
    ok("windowed — a click on the stage does NOT advance", s.get("i") == 2, s)

    # ── into fullscreen, through the platform's own control ─────────────────
    print("\n── into fullscreen through the deck's own button")
    js(pg, "() => document.getElementById('deckroot').querySelector('[data-dfs]').click()")
    pg.wait_for_timeout(500)
    s = js(pg, STATE)
    ok("the deck is genuinely fullscreen", s.get("reallyFs") is True, s)
    if s.get("reallyFs") is not True:
        print("  (cannot measure fullscreen in this browser — stopping)")
        b.close(); sys.exit(1)

    # ── 1 · the reported fault ──────────────────────────────────────────────
    print("\n── 1 · the bar does not come back (§265 — this is what was reported)")
    bar_hidden(pg, "on entering fullscreen")

    js(pg, "() => deckShow(2)")
    pg.mouse.move(700, 400)
    pg.wait_for_timeout(60)
    bar_hidden(pg, "after the pointer moves")

    pg.mouse.click(700, 400)
    pg.wait_for_timeout(60)                    # the flash was 2.2s: look at once
    bar_hidden(pg, "at the moment of a click")
    pg.wait_for_timeout(700)
    bar_hidden(pg, "and half a second after it")

    # ── 2 · the click advances, and an interactive target keeps its click ────
    print("\n── 2 · a click on the slide advances it, in fullscreen only")
    js(pg, "() => deckShow(2)")
    pg.mouse.click(700, 400)
    pg.wait_for_timeout(120)
    s = js(pg, STATE)
    ok("a click moves one slide forward", s.get("i") == 3, s)
    pg.mouse.click(700, 400)
    pg.wait_for_timeout(120)
    s = js(pg, STATE)
    ok("...and the next click moves one more", s.get("i") == 4, s)

    # An interactive target inside the stage: the click is that control's, never
    # the stage's, or typing in the note box would move the slide.
    guard = js(pg, """() => {
      const r = document.getElementById('deckroot');
      const before = DECK.i;
      const box = document.createElement('div');
      box.setAttribute('contenteditable', 'true');
      box.textContent = 'a note';
      box.style.cssText = 'position:fixed;left:20px;top:20px;width:120px;height:40px;z-index:99';
      r.appendChild(box);
      box.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true }));
      const after = DECK.i;
      box.remove();
      return { before, after };
    }""")
    ok("a click on a contenteditable does not advance",
       guard.get("before") == guard.get("after"), guard)

    # ── 3 · the keys ────────────────────────────────────────────────────────
    print("\n── 3 · forward is four keys and back is three (§265)")

    def key(k, want, label):
        js(pg, "() => deckShow(4)")
        pg.keyboard.press(k)
        pg.wait_for_timeout(120)
        s = js(pg, STATE)
        ok(label + " — " + k, s.get("i") == want, s)

    for k in ["ArrowRight", "ArrowDown", "PageDown", "Space"]:
        key(k, 5, "forward")
    for k in ["ArrowLeft", "ArrowUp", "PageUp"]:
        key(k, 3, "back")

    # And each of them stops the page behind. Dispatched rather than pressed,
    # because `defaultPrevented` is the only way to read the answer.
    pv = js(pg, """() => {
      const out = {};
      ['ArrowRight','ArrowDown','PageDown',' ','ArrowLeft','ArrowUp','PageUp'].forEach(k => {
        const ev = new KeyboardEvent('keydown', { key: k, bubbles: true, cancelable: true });
        document.body.dispatchEvent(ev);
        out[k === ' ' ? 'Space' : k] = ev.defaultPrevented;
      });
      return out;
    }""")
    for k, v in (pv.items() if isinstance(pv, dict) else []):
        ok("the page behind does not scroll on " + k, v is True, pv)

    # ── 4 · Escape ──────────────────────────────────────────────────────────
    print("\n── 4 · Escape leaves fullscreen, and only then the deck")
    pg.keyboard.press("Escape")
    pg.wait_for_timeout(500)
    s = js(pg, STATE)
    ok("Escape left fullscreen", s.get("reallyFs") is False, s)
    ok("...and the deck is STILL OPEN", s.get("deckOpen") is True, s)
    r = js(pg, BAR)
    ok("...with the bar back, whole", r.get("onScreen") is True, r)
    ok("...and pressable again", r.get("reachable") is True, r)

    pg.keyboard.press("Escape")
    pg.wait_for_timeout(300)
    s = js(pg, STATE)
    ok("Escape again closes the deck", s.get("deckOpen") is False, s)

    # ── 6 · a tablet: tap zones and swipes (§280) ───────────────────────────
    # Back into fullscreen — §4 left it windowed on purpose.
    print("\n── 6 · a finger: the left third goes back, and swipes turn pages (§280)")
    js(pg, "() => { const r=document.getElementById('deckroot');"
           "  if (!r.classList.contains('on')) openDeck(unitLike(activeKeys()[0]));"
           "  return 1; }")
    pg.wait_for_timeout(300)
    js(pg, "() => document.getElementById('deckroot').querySelector('[data-dfs]').click()")
    pg.wait_for_timeout(500)
    s = js(pg, STATE)
    ok("back in fullscreen for the touch pass", s.get("reallyFs") is True, s)

    W, H = 1400, 900
    RIGHT, LEFT, JUST_PAST = int(W * .80), int(W * .10), int(W * .40)

    def at(n):
        js(pg, "(n) => deckShow(n)", n)
        pg.wait_for_timeout(80)

    def i():
        return js(pg, STATE).get("i")

    # ONE session for the whole pass. A session per gesture is what made the
    # first run of this section DIE rather than report on the build it exists
    # to judge (§215): three assertions came back None, and a probe that
    # cannot answer is not a probe that found something.
    CDP = pg.context.new_cdp_session(pg)

    def drag(x0, y0, x1, y1, steps=6):
        CDP.send("Input.dispatchTouchEvent",
                 {"type": "touchStart", "touchPoints": [{"x": x0, "y": y0}]})
        for k in range(1, steps + 1):
            CDP.send("Input.dispatchTouchEvent",
                     {"type": "touchMove",
                      "touchPoints": [{"x": x0 + (x1 - x0) * k / steps,
                                       "y": y0 + (y1 - y0) * k / steps}]})
        CDP.send("Input.dispatchTouchEvent", {"type": "touchEnd", "touchPoints": []})
        pg.wait_for_timeout(180)

    def swipe(x0, x1, y=450):
        drag(x0, y, x1, y)

    at(4); pg.touchscreen.tap(RIGHT, 450); pg.wait_for_timeout(150)
    ok("a tap on the right goes forward", i() == 5, i())
    at(4); pg.touchscreen.tap(LEFT, 450); pg.wait_for_timeout(150)
    ok("a tap on the left third goes BACK", i() == 3, i())
    # The boundary itself, or "left goes back" is satisfied by a build that
    # sends the whole slide backwards (§113.8).
    at(4); pg.touchscreen.tap(JUST_PAST, 450); pg.wait_for_timeout(150)
    ok("a tap just past the third still goes forward", i() == 5, i())

    # Both ends: a MOUSE keeps §265 exactly, on the very pixel a finger would
    # have gone back from. Without this the check cannot tell the two apart.
    at(4); pg.mouse.click(LEFT, 450); pg.wait_for_timeout(150)
    ok("a MOUSE click on the left still goes forward (§265 kept)", i() == 5, i())

    at(4); swipe(int(W * .75), int(W * .20))
    ok("swiping left goes forward", i() == 5, i())
    ok("...by exactly one slide, so the gesture's own click did not count twice",
       i() == 5, i())

    # THE RIGHTWARD SWIPE IS THE ONE THE BROWSER WANTS FOR ITSELF. Without
    # `touch-action` on the stage it fires the platform's own back-navigation
    # and the page LEAVES — measured on the pre-§280 build, which lands on
    # about:blank and takes the presenter out of the deck mid-presentation.
    # Asserted before the direction, because a page that is gone answers every
    # later question with nothing (§215): three assertions here came back None
    # before this one existed, and a probe that cannot answer is not a probe
    # that found something.
    where = pg.url
    at(4); swipe(int(W * .20), int(W * .75))
    ok("a rightward swipe does not navigate the browser away", pg.url == where,
       pg.url[-30:])
    if pg.url != where:                      # recover, so the rest still reports
        pg.goto(where); pg.wait_for_timeout(900)
        js(pg, "() => openDeck(unitLike(activeKeys()[0]))"); pg.wait_for_timeout(300)
        js(pg, "() => document.getElementById('deckroot')"
               ".querySelector('[data-dfs]').click()"); pg.wait_for_timeout(500)
    else:
        ok("swiping right goes back", i() == 3, i())

    # A vertical drag is somebody steadying the tablet, not turning a page.
    at(4); drag(700, 250, 712, 640)
    ok("a vertical drag turns no page", i() == 4, i())

    # And windowed mode is still untouched by a finger, as it is by a mouse.
    js(pg, "() => { if (document.fullscreenElement) document.exitFullscreen(); }")
    pg.wait_for_timeout(500)
    at(4); pg.touchscreen.tap(LEFT, 450); pg.wait_for_timeout(150)
    ok("windowed — a tap turns no page either", i() == 4, i())

    print("\n── the page said nothing")
    ok("no page error", not errs, errs[:2])

    b.close()

print("\n" + ("ALL PASS" if not fails else str(len(fails)) + " FAILED"))
for f in fails:
    print("  - " + f)
sys.exit(1 if fails else 0)
