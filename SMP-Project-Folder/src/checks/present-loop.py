"""THE PRESENTATION LOOP — PLAY FROM THE EDITOR, AND COME BACK TO IT (§295).

Islam: *"why don't we make the indvidual presentation section act like normal
ppts. like when they open the presentation, they see the manage section part
and then present from there and if they exit the presentation mood thye get
back to the manage ppt for quick edits if needed etc."*

Shape A of the mockup, which is what he picked: both menu entries stay, the
editor's bar gains Play, and a deck PLAYED FROM THE EDITOR returns to it.
A deck opened from the menu is untouched and lands on the page exactly as it
always has.

WHAT IS ASSERTED, AND WHY EACH ONE IS HERE:

  1 · THE BAR CARRIES PLAY AND DONE ON ONE ROW, measured as boxes and as one
      top. Two `margin-left:auto` items do not sit together — they split the
      free space and land a gap apart (§225) — so "both buttons exist" is not
      the assertion; "both buttons are next to each other" is.

  2 · PLAY OPENS A DECK THAT IS ACTUALLY IN FRONT. A HIT-TEST at the centre of
      the window, never `classList.contains('on')`: both roots were z-index 60
      and the editor comes later in the document, so the pre-§295 build sets
      every class, lays the deck out, scales it — and paints it UNDERNEATH the
      editor. §96's family, and the one fault here that a class assertion
      reports as a pass.

  3 · THE WORD SAYS WHERE YOU LAND, at BOTH ENDS: "Back to slides" when played
      from the editor, "Exit" when opened from the page — and the page case is
      asserted AFTER the editor case in the same session, because a flag left
      standing would send the next deck home to a mode nobody opened (§265's
      `fs` class, and §94.2).

  4 · ESCAPE RETURNS TO THE EDITOR, WITH THE WORK WHERE IT WAS: the mode still
      open, the deck gone, `body.presenting` still set (it is the editor's too),
      the editor no longer inert, and THE SAME SLIDE STILL SELECTED. That last
      one is the ask — "for quick edits" means the rail has not moved.

  5 · THE DECK IN FRONT HAS THE KEYBOARD. Both keydown handlers are on the
      window and each gates on its own root, so while a deck is played from the
      editor BOTH are live: Escape ran two closers and an arrow key moved the
      slide AND walked the rail underneath. Asserted as a PAIR — the deck moved
      by exactly one, and the editor's selection did not move at all.

  6 · A DECK OPENED FROM THE MENU IS BYTE-FOR-BYTE WHAT IT WAS: Escape lands on
      the page, the editor was never opened, and `body.presenting` is gone.
      Without this a build that sent every deck back to an editor would satisfy
      every assertion above.

  7 · BOTH SIDES OF THE SWITCH (§53.5, A15). A unit and a supporting function
      that plans in PILLARS — the format resolver is exactly what §224 and
      §253.3 each found broken on one surface and working on another, and Play
      is the third caller.

  8 · THE PAINT, in both palettes, with the sweep's own arithmetic: Play is the
      accent as a FILL with `--on-accent` over it, never gold type (§38.4).

Run it against the shipped pre-§295 file to watch it fail:
  python3 qa-run.py checks/present-loop.py ../strategy-management-platform-v3.22.html
"""
import os, sys
from playwright.sync_api import sync_playwright

HERE = os.path.dirname(os.path.abspath(__file__))
FILE = (os.path.abspath(sys.argv[1]) if len(sys.argv) > 1 else
        os.path.join(os.path.dirname(HERE), "strategy-management-platform.html"))
fails = []

UNIT = "mobile"
FNP = "merchandising"          # plans in pillars — the other side of the switch


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


# ── What is actually in front, and what each mode holds ─────────────────────
# `front` is a HIT-TEST at the middle of the window. It is the whole of §2: the
# pre-§295 build has the deck open, laid out and invisible behind the editor,
# and every class-based question answers yes.
STATE = """() => {
  const dr = document.getElementById('deckroot');
  const sr = document.getElementById('slideroot');
  const at = document.elementFromPoint(Math.round(innerWidth / 2),
                                       Math.round(innerHeight / 2));
  const ex = dr && dr.querySelector('[data-dexit]');
  return {
    deckOn:   !!(dr && dr.classList.contains('on')),
    edOn:     !!(sr && sr.classList.contains('on')),
    presenting: document.body.classList.contains('presenting'),
    edInert:  !!(sr && (sr.inert || sr.getAttribute('aria-hidden') === 'true')),
    front:    !at ? null : (dr && dr.contains(at)) ? 'deck'
                         : (sr && sr.contains(at)) ? 'editor' : 'page',
    exitWord: ex ? ex.textContent.trim() : null,
    exitTitle: ex ? (ex.getAttribute('title') || '') : '',
    from:     (typeof DECK === 'undefined') ? null : DECK.from,
    i:        (typeof DECK === 'undefined') ? null : DECK.i,
    sel:      (typeof SLED === 'undefined') ? null : SLED.sel,
    railTop:  (function(){ var l = document.getElementById('slidelist');
                           return l ? Math.round(l.scrollTop) : null; })()
  };
}"""

BAR = """() => {
  const sr = document.getElementById('slideroot');
  const play = sr && sr.querySelector('[data-slplay]');
  const done = sr && sr.querySelector('[data-slexit]');
  if (!play || !done) return { missing: !play ? 'play' : 'done' };
  const p = play.getBoundingClientRect(), d = done.getBoundingClientRect();
  const at = document.elementFromPoint(Math.round(p.left + p.width / 2),
                                       Math.round(p.top + p.height / 2));
  return { pTop: Math.round(p.top), dTop: Math.round(d.top),
           pMid: Math.round(p.top + p.height / 2),
           dMid: Math.round(d.top + d.height / 2),
           gap: Math.round(d.left - p.right),
           playFirst: p.left < d.left,
           reachable: !!(at && (at === play || play.contains(at))),
           label: play.textContent.replace(/\\s+/g, ' ').trim() };
}"""


def press(pg, sel):
    """A press degrades too (§215). `pg.click` on a control the build does not
    have waits 30 seconds and then THROWS — so the first run of this file
    against the pre-§295 build died with four of its assertions made and
    reported them as the whole story, which is the exact fault the docstring
    above promises it avoids."""
    try:
        el = pg.query_selector(sel)
        if not el:
            return False
        el.click(timeout=2000)
        return True
    except Exception:                                             # noqa: BLE001
        return False


def open_editor(pg, kind, key):
    js(pg, "([k, v]) => slidesOpen(k, v)", [kind, key])
    pg.wait_for_timeout(700)


def loop(pg, label, kind, key):
    """Arrange, play, come back — the whole of what was asked for."""
    print("\n── " + label + " ─────────────────────────────────────────")
    open_editor(pg, kind, key)
    s = js(pg, STATE)
    ok("the editor opens", s.get("edOn") is True, s)

    b = js(pg, BAR)
    ok("Play is on the bar", b.get("missing") is None, b)
    ok("...and it can be pressed", b.get("reachable") is True, b)
    ok("...beside Done, not a gap away",
       b.get("playFirst") is True and isinstance(b.get("gap"), int)
       and 0 <= b.get("gap", 999) <= 24, b)
    ok("...on the same line",
       isinstance(b.get("pMid"), int) and b.get("pMid") == b.get("dMid"), b)

    before = js(pg, STATE)
    played = press(pg, "#slideroot [data-slplay]")
    ok("Play can be pressed at all", played is True)
    pg.wait_for_timeout(900)
    s = js(pg, STATE)
    ok("Play opens the deck", s.get("deckOn") is True, s)
    # §2 — the assertion the pre-§295 build fails while every class says yes
    ok("...and the deck is IN FRONT of the editor", s.get("front") == "deck", s)
    ok("...the editor is still open behind it", s.get("edOn") is True, s)
    ok("...and stood down for the keyboard", s.get("edInert") is True, s)
    ok("the way out says where it lands",
       s.get("exitWord") == "Back to slides", s)
    ok("...and so does its hover", "Back to slides" in s.get("exitTitle", ""), s)

    # §5 — one arrow key, one thing moves
    i0, sel0 = s.get("i"), before.get("sel")
    pg.keyboard.press("ArrowRight")
    pg.wait_for_timeout(400)
    s = js(pg, STATE)
    ok("an arrow key moves the deck",
       isinstance(s.get("i"), int) and isinstance(i0, int) and s["i"] == i0 + 1, s)
    ok("...and does NOT walk the rail underneath", s.get("sel") == sel0,
       {"was": sel0, "now": s.get("sel")})

    # §4 — Escape comes home
    pg.keyboard.press("Escape")
    pg.wait_for_timeout(700)
    s = js(pg, STATE)
    ok("Escape closes the deck", s.get("deckOn") is False, s)
    ok("...and lands back on the editor", s.get("edOn") is True and
       s.get("front") == "editor", s)
    ok("...which is live again", s.get("edInert") is False, s)
    ok("...with the page behind still held", s.get("presenting") is True, s)
    ok("...and the same slide still selected", s.get("sel") == sel0,
       {"was": sel0, "now": s.get("sel")})

    # and the deck's own button does it too, not only the key
    press(pg, "#slideroot [data-slplay]")
    pg.wait_for_timeout(800)
    press(pg, "#deckroot [data-dexit]")
    pg.wait_for_timeout(700)
    s = js(pg, STATE)
    ok("Back to slides does the same as Escape",
       s.get("deckOn") is False and s.get("edOn") is True, s)

    js(pg, "() => slidesClose()")
    pg.wait_for_timeout(500)


with sync_playwright() as p:
    b = p.chromium.launch(executable_path=os.environ.get("SMP_CHROME"))
    pg = b.new_page(viewport={"width": 1500, "height": 900})
    errs = []
    pg.on("pageerror", lambda e: errs.append(str(e)))
    pg.add_init_script("try{sessionStorage.setItem('smp.welcome.seen','1');"
                       "localStorage.setItem('smp.tour.done','1')}catch(e){}")
    pg.goto("file://" + FILE)
    pg.wait_for_timeout(1800)
    js(pg, "() => document.querySelectorAll('.welcomeover,.tourdock')"
           ".forEach(function(e){ e.remove(); })")

    # §7 — both sides of the switch
    loop(pg, "A UNIT", "unit", UNIT)
    loop(pg, "A SUPPORTING FUNCTION THAT PLANS IN PILLARS", "fn", FNP)

    # §6 — the menu's own deck is untouched, and it is measured AFTER the
    # editor's, so a `from` left standing is caught rather than hidden.
    print("\n── A DECK OPENED FROM THE PAGE (unchanged) ────────────────")
    js(pg, "(t) => openDeckFor(t)", UNIT)
    pg.wait_for_timeout(900)
    s = js(pg, STATE)
    ok("it opens", s.get("deckOn") is True, s)
    ok("the editor was never opened", s.get("edOn") is False, s)
    ok("the way out still says Exit", s.get("exitWord") == "Exit", s)
    ok("...and `from` did not survive the last deck", s.get("from") == "page", s)
    pg.keyboard.press("Escape")
    pg.wait_for_timeout(700)
    s = js(pg, STATE)
    ok("Escape lands on the page", s.get("deckOn") is False and
       s.get("front") == "page", s)
    ok("...and gives the page back its scroll", s.get("presenting") is False, s)

    # §8 — the paint, both palettes, with the sweep's own arithmetic
    print("\n── THE PAINT ──────────────────────────────────────────────")
    CONTRAST = """() => {
      const lum = (c) => {
        const [r, g, b] = c.match(/\\d+(\\.\\d+)?/g).slice(0, 3).map(Number)
          .map(v => { v /= 255; return v <= .03928 ? v / 12.92
                                                   : Math.pow((v + .055) / 1.055, 2.4); });
        return .2126 * r + .7152 * g + .0722 * b;
      };
      const el = document.querySelector('#slideroot [data-slplay]');
      if (!el) return { missing: true };
      const cs = getComputedStyle(el);
      const a = lum(cs.color), z = lum(cs.backgroundColor);
      return { ratio: +(((Math.max(a, z) + .05) / (Math.min(a, z) + .05)).toFixed(2)),
               fill: cs.backgroundColor, ink: cs.color,
               /* a FILL, never gold type: the ground must not be transparent */
               filled: !/rgba\\(0, 0, 0, 0\\)/.test(cs.backgroundColor) };
    }"""
    for theme in ("light", "dark"):
        js(pg, "(t) => document.documentElement.setAttribute('data-theme', t)", theme)
        open_editor(pg, "unit", UNIT)
        r = js(pg, CONTRAST)
        ok("Play is a FILL in " + theme, r.get("filled") is True, r)
        ok("...and its ink reads on it in " + theme,
           isinstance(r.get("ratio"), (int, float)) and r["ratio"] >= 4.5, r)
        js(pg, "() => slidesClose()")
        pg.wait_for_timeout(300)
    js(pg, "() => document.documentElement.removeAttribute('data-theme')")

    ok("no page errors", not errs, errs[:3])
    b.close()

print("\n" + ("present-loop: %d FAILURES" % len(fails) if fails
             else "present-loop: all checks passed"))
sys.exit(1 if fails else 0)
