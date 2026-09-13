"""A CLOCK ON THE REVIEW (§337).

Islam: *"in the presentation module I need to set as an SMO the time of each
presentation so the timer appears for the presenter"*, then *"it needs to be
per unit and it can be set in the master presentation sectoin with the flow"*,
then his three choices from the mockup — the three buttons, the always-there
clock, and pause in the bar.

  1 · THE MINUTES ARE SET IN THE FLOW, and every press is read back off the
      STORED graph rather than off the screen (§96): a control wired to
      nothing renders perfectly. Pressing the lit button CLEARS, which is the
      only way back to no time once a dropdown's blank entry became three
      buttons — and the last key leaving deletes the map (§50.6).

  2 · WITHOUT A REPAINT (§71.2). `.mflist` is a scrolling box of nineteen
      rows, so a repaint would throw somebody setting the fifteenth subject's
      time back to the top on every press. Asserted by SCROLLING first.

  3 · THE TOTAL IS ON THE LINE THAT COUNTS THE SLIDES — the whole argument for
      setting the minutes here rather than on nineteen unit screens. And it
      says nothing about "with no time" until something IS set, or an
      untouched tenant opens on "19 with no time", which reads as a fault
      (§45.2).

  4 · NO MINUTES, NO CLOCK, asserted at BOTH ENDS (§94.2) — the clock absent
      AND the bar's two buttons absent, then all three present once a time is
      set. A build that drew the clock always would pass half of this.

  5 · IT FOLLOWS THE SUBJECT BY ITSELF. Walking slides inside one unit must
      not restart it; crossing into the next unit in a FLOW must start theirs.
      That is the whole value of starting it in `deckShow()`.

  6 · PAUSE HAS THREE WAYS IN AND RESET HAS ONE. The `P` key and a tap on the
      clock reach FULLSCREEN, where §265 takes the bar off the screen; reset
      is bar-only because it cannot be undone, so the key and the clock are
      asserted NOT to reset. And a tap on the clock must not advance the
      slide — `deckOwnControl()` is what makes that free, and a build that
      made the clock a `<div>` would move the deck on every pause.

  7 · THE COLOURS ARE MEASURED IN BOTH THEMES with the sweep's own arithmetic
      (§95). The on-screen slide paints `var(--surface)`, so the deck FOLLOWS
      the viewer's theme — a clock drawn in the literals of the light-mode
      mockup would be unreadable in dark (§38.5).

  8 · THE UNIT SEES ITS OWN SLOT in Manage slides, read-only — and nothing at
      all when none is set. Both ends.

  9 · AND IT DOES NOT PRINT. The deck is printed for the contingency pack
      (§305), where `.deck` becomes a tall column and one absolutely-placed
      clock would land at the bottom of all of it.

Every probe degrades rather than dying (§215): a build without the feature
must REPORT its failures, not stop at the first missing name.

Point it at another build with SMP_BUILT to falsify it (§276: a broken build
is made from the SOURCES, because §238's hashed policy silences an edited
built file).
"""
import os
from playwright.sync_api import sync_playwright
HERE = os.path.dirname(os.path.abspath(__file__))
# `or`, not a `get` default: an EMPTY `SMP_BUILT` is a set variable, so the
# default never fires and the run opens `file://` and reports 43 failures on a
# perfectly good build — which is a broken-build verdict produced by the
# harness (§54.5, met while falsifying this very file).
F = os.environ.get("SMP_BUILT") or \
    os.path.join(os.path.dirname(HERE), "strategy-management-platform.html")
fails = []; passes = [0]
def ok(label, cond, detail=""):
    if cond: passes[0] += 1; print("  ok      " + label)
    else:
        fails.append(label); print("  FAIL    " + label + ("  — " + str(detail) if detail else ""))
def eva(pg, js, arg=None):
    """§215: a build without the feature must report, not die.

    EVERY probe goes through here, the ones that only PRESS something
    included — the first falsification run (a build where the clock is never
    mounted) threw on a raw `pg.evaluate` and the whole file died with three
    sections unmade, printing a stack trace where the count belongs. Which is
    exactly the fault this docstring claims the file does not have."""
    try: return pg.evaluate(js, arg) if arg is not None else pg.evaluate(js)
    except Exception as e: return {"__err": str(e)[:120]}
def val(r, k, d=None):
    return r.get(k, d) if isinstance(r, dict) else d

# The sweep's own arithmetic, never a second one (§95).
def _lum(h):
    h = h.lstrip("#"); r, g, bl = [int(h[i:i+2], 16) / 255 for i in (0, 2, 4)]
    f = lambda c: c / 12.92 if c <= .03928 else ((c + .055) / 1.055) ** 2.4
    return .2126 * f(r) + .7152 * f(g) + .0722 * f(bl)
def _rgb(s):
    n = [int(x) for x in s.replace("rgba", "rgb").split("(")[1].split(")")[0].split(",")[:3]]
    return "#%02X%02X%02X" % tuple(n)
def contrast(a, b):
    L = sorted([_lum(_rgb(a)), _lum(_rgb(b))], reverse=True)
    return (L[0] + .05) / (L[1] + .05)

with sync_playwright() as p:
    b = p.chromium.launch(executable_path=os.environ.get("SMP_CHROME"))
    pg = b.new_page(viewport={"width": 1400, "height": 900})
    pg.add_init_script("try{sessionStorage.setItem('smp.welcome.seen','1');"
                       "sessionStorage.setItem('smp.welcome.done','1');"
                       "sessionStorage.setItem('smp.tour.later','1');}catch(e){}")
    errs = []; pg.on("pageerror", lambda e: errs.append(str(e)))
    pg.goto("file://" + F); pg.wait_for_timeout(900)

    # ── 1 · the office's alone, asked of the RULE ────────────────────────
    print("\n1 · setting the times is the office's")
    r = eva(pg, """()=>{
      var w = world(), out = {};
      (PEOPLE||[]).forEach(function(p){
        var yes = SMPRules.mayMasterPresent(w, p);
        out[yes ? 'allowed' : 'refused'] = (out[yes ? 'allowed' : 'refused']||0) + 1;
      });
      return out; }""")
    ok("somebody may set them", val(r, "allowed", 0) > 0, r)
    ok("and somebody may not — both ends, off the shared rule (§42, §94.2)",
       val(r, "refused", 0) > 0, r)

    # ── 2 · the dialog ───────────────────────────────────────────────────
    print("\n2 · the minutes, in the master presentation")
    eva(pg, "()=>{ delete GROUP[SMPRules.PRESENT_MINS]; masterOpen(); }"); pg.wait_for_timeout(500)
    d = eva(pg, """()=>{
      var rows = document.querySelectorAll('[data-mfflow] tr');
      var head = [...document.querySelectorAll('.mflow [data-mfflow]')].length
        ? [...document.querySelectorAll('.mflow .mftbl thead th')].map(t=>t.textContent.trim()) : [];
      var nm = document.querySelector('[data-mfflow] .c-nm');
      var sp = document.createElement('span');
      sp.style.cssText = 'position:absolute;visibility:hidden;white-space:nowrap;font:'
        + getComputedStyle(nm).font;
      sp.textContent = 'Strategy Management Office'; document.body.appendChild(sp);
      var need = sp.getBoundingClientRect().width; sp.remove();
      var list = document.querySelector('.mflow .mflist');
      return { rows: rows.length,
               btns: document.querySelectorAll('[data-mfflow] [data-mins]').length,
               perRow: document.querySelectorAll('[data-mfflow] tr:first-child [data-mins]').length,
               choices: SMPRules.PRESENT_MIN_CHOICES.slice(),
               head: head, sum: document.querySelector('[data-mfsum]').textContent.trim(),
               name: Math.round(nm.getBoundingClientRect().width), need: Math.round(need),
               sideways: list.scrollWidth - list.clientWidth }; }""")
    ok("the flow's table carries a Minutes column",
       "MINUTES" in [str(x).upper() for x in val(d, "head", [])], val(d, "head"))
    ok("one button per choice on every row, and the choices are the shared rule's",
       val(d, "perRow") == len(val(d, "choices", [])) and
       val(d, "btns") == val(d, "rows", 0) * len(val(d, "choices", [])), d)
    # §158: fit, never "and it scrolls". The new column is only affordable if
    # the longest name on the list still clears its own column.
    ok("the name column still clears the longest name on the list (§158)",
       val(d, "name", 0) > val(d, "need", 1e9), (val(d, "name"), val(d, "need")))
    ok("and nothing runs past the list sideways", val(d, "sideways", 1) <= 0, d)
    # §45.2: an untouched tenant is not nagged about a feature it has not used.
    ok("with nothing set the line says nothing about missing times (§45.2)",
       "no time" not in str(val(d, "sum", "")), val(d, "sum"))

    print("\n3 · a press reaches the stored graph, and clears again")
    first = eva(pg, "()=>document.querySelector('[data-mfflow] tr [data-minsfor]').dataset.minsfor")
    # THE FLOW'S OWN LIST, reached through the tbody that identifies it:
    # there are two `.mflist` and the first is the WAITING column, which is
    # empty on this tenant and cannot scroll at all — so the first draft of
    # this assertion measured a box with nothing in it and passed or failed
    # for reasons that had nothing to do with a repaint (§100.3).
    eva(pg, "()=>{document.querySelector('[data-mfflow]')"
                ".closest('.mflist').scrollTop = 120;}")
    eva(pg, """()=>document.querySelector('[data-mfflow] tr:first-child [data-mins="15"]').click()""")
    pg.wait_for_timeout(250)
    w1 = eva(pg, """(t)=>({ stored: SMPRules.presentMins(GROUP, t),
        lit: document.querySelector('[data-mfflow] tr:first-child [data-mins="15"]').classList.contains('on'),
        pressed: document.querySelector('[data-mfflow] tr:first-child [data-mins="15"]').getAttribute('aria-pressed'),
        sum: document.querySelector('[data-mfsum]').textContent.trim(),
        scroll: document.querySelector('[data-mfflow]').closest('.mflist').scrollTop })""", first)
    ok("pressing 15 writes 15 to the STORED graph (§96)", val(w1, "stored") == 15, w1)
    ok("the button lights, and says so to a screen reader",
       val(w1, "lit") is True and val(w1, "pressed") == "true", w1)
    ok("the review's own length lands on the slide-count line",
       "15m" in str(val(w1, "sum", "")), val(w1, "sum"))
    # §71.2: the press rewrites three buttons and one line, never the dialog.
    ok("and the list did not scroll back to the top — no repaint (§71.2)",
       val(w1, "scroll", 0) == 120, val(w1, "scroll"))
    eva(pg, """()=>document.querySelector('[data-mfflow] tr:first-child [data-mins="15"]').click()""")
    pg.wait_for_timeout(250)
    w2 = eva(pg, """(t)=>({ stored: SMPRules.presentMins(GROUP, t),
        key: GROUP[SMPRules.PRESENT_MINS] === undefined ? 'gone' : 'held',
        lit: document.querySelector('[data-mfflow] tr:first-child [data-mins="15"]').classList.contains('on') })""", first)
    ok("pressing the lit button again clears it — the only way back to none",
       val(w2, "stored") == 0 and val(w2, "lit") is False, w2)
    ok("and the last time leaving takes the whole key with it (§50.6)",
       val(w2, "key") == "gone", w2)
    eva(pg, "()=>closeModal()"); pg.wait_for_timeout(250)

    # ── 4 · no minutes, no clock — BOTH ENDS ─────────────────────────────
    print("\n4 · no minutes, no clock")
    eva(pg, "()=>{ delete GROUP[SMPRules.PRESENT_MINS]; openDeck(UNITS['mobile']); }")
    pg.wait_for_timeout(500)
    n = eva(pg, """()=>({ clock: !!DECK.clock,
        drawn: !document.getElementById('dclock').hidden,
        pause: !document.querySelector('[data-dpause]').hidden,
        reset: !document.querySelector('[data-dreset]').hidden })""")
    ok("a subject with no time set draws no clock", val(n, "drawn") is False and
       val(n, "clock") is False, n)
    ok("and no Pause or Reset either — a control with nothing to act on (§61)",
       val(n, "pause") is False and val(n, "reset") is False, n)
    eva(pg, "()=>closeDeck()"); pg.wait_for_timeout(200)
    ok("closing the deck stops the clock's own interval (§24)",
       eva(pg, "()=>CLOCKTICK") in (None, 0), "an interval outlived its deck")

    print("\n5 · with a time set, on the slide")
    eva(pg, """()=>{ minsWrite('mobile', 15); minsWrite('retailstores', 10);
                     openDeck(UNITS['mobile']); }""")
    pg.wait_for_timeout(500)
    c = eva(pg, """()=>{ var e = document.getElementById('dclock');
      var r = e.getBoundingClientRect(), dk = document.querySelector('.deck');
      var d = dk.getBoundingClientRect(), sl = document.querySelector('.dslide.on');
      return { drawn: !e.hidden, tag: e.tagName, inDeck: dk.contains(e),
               subject: clockSubject(), mins: DECK.clock && DECK.clock.mins,
               shown: e.querySelector('.dctime').textContent,
               rightOfCentre: r.left > d.left + d.width/2,
               belowCentre: r.top > d.top + d.height/2,
               insideSlide: !!sl && r.right <= sl.getBoundingClientRect().right + 1,
               pause: !document.querySelector('[data-dpause]').hidden }; }""")
    ok("the clock is drawn, and it is a BUTTON — which is what lets a tap on "
       "it pause without advancing the slide (§297)", val(c, "drawn") is True and
       val(c, "tag") == "BUTTON", c)
    ok("it lives INSIDE the deck, so it scales with the slide",
       val(c, "inDeck") is True, c)
    ok("in the corner that is empty on every slide kind — bottom right",
       val(c, "rightOfCentre") is True and val(c, "belowCentre") is True, c)
    ok("and within the slide rather than floating past its edge",
       val(c, "insideSlide") is True, c)
    ok("it reads this subject's own time", val(c, "mins") == 15 and
       str(val(c, "shown", "")).startswith("14:"), c)
    ok("and the bar's two controls come with it", val(c, "pause") is True, c)

    print("\n6 · it follows the subject, and nothing else")
    was = eva(pg, "()=>DECK.clock.from")
    for _ in range(3): pg.keyboard.press("ArrowRight")
    pg.wait_for_timeout(250)
    ok("walking slides inside one unit does not restart it",
       eva(pg, "(b)=>DECK.clock.from===b", was) is True, "it restarted")
    eva(pg, "()=>{ closeDeck(); openDeckWith('<b>Master</b>', ['mobile','retailstores']); }")
    pg.wait_for_timeout(700)
    f1 = eva(pg, "()=>({s:clockSubject(), m:DECK.clock&&DECK.clock.mins})")
    eva(pg, "()=>deckShow(DECK.stops[1].at)"); pg.wait_for_timeout(300)
    f2 = eva(pg, """()=>({s:clockSubject(), m:DECK.clock&&DECK.clock.mins,
        shown:document.querySelector('#dclock .dctime').textContent})""")
    ok("a flow opens on the first subject's own time", val(f1, "m") == 15, f1)
    ok("and crossing into the next unit starts THEIRS, with nobody pressing "
       "anything", val(f2, "m") == 10 and val(f2, "s") != val(f1, "s"), (f1, f2))
    # NOT "10:00" — that string is true for one second of a ten-minute slot
    # and the probe cannot reliably run inside it. What is being asserted is
    # that the new subject's clock started FRESH, so ask how much of it has
    # run rather than what the face happens to read (§94.8).
    ran = eva(pg, "()=>DECK.clock.mins*60000 - clockLeft()")
    ok("from the top, not from where the last one left off",
       isinstance(ran, (int, float)) and 0 <= ran < 4000, (ran, f2))

    # ── 7 · pause: three ways in. Reset: one ─────────────────────────────
    print("\n7 · three ways to pause, one way to reset")
    eva(pg, "()=>{ closeDeck(); openDeck(UNITS['mobile']); }"); pg.wait_for_timeout(500)
    pg.keyboard.press("p"); pg.wait_for_timeout(200)
    k = eva(pg, """()=>({ held: !DECK.clock.from,
        mark: !document.querySelector('#dclock .pausemark').hidden,
        word: !document.querySelector('#dclock .dcw').hidden })""")
    ok("the P key holds it — which is the one that reaches FULLSCREEN, where "
       "§265 takes the bar off the screen", val(k, "held") is True, k)
    ok("and it SAYS it is held: the mark and the word (§124)",
       val(k, "mark") is True and val(k, "word") is True, k)
    frozen = eva(pg, "()=>document.querySelector('#dclock .dctime').textContent")
    pg.wait_for_timeout(1400)
    ok("held means held — the figure does not move",
       eva(pg, "()=>document.querySelector('#dclock .dctime').textContent") == frozen,
       "it kept counting")
    pg.keyboard.press("p"); pg.wait_for_timeout(200)
    ok("and the same key starts it again", eva(pg, "()=>!!DECK.clock.from") is True)

    i0 = eva(pg, "()=>DECK.i")
    eva(pg, "()=>document.getElementById('dclock').click()"); pg.wait_for_timeout(200)
    tap = eva(pg, "(i)=>({held:!DECK.clock.from, moved: DECK.i!==i})", i0)
    ok("a tap on the clock holds it — the only pause a tablet can reach (§280)",
       val(tap, "held") is True, tap)
    ok("and it does NOT advance the slide under the presenter",
       val(tap, "moved") is False, tap)
    eva(pg, "()=>document.getElementById('dclock').click()"); pg.wait_for_timeout(150)

    # RESET IS THE BAR'S ALONE. Asserted as an absence on the other two, or a
    # build that put it on the key would pass every assertion above (§94.2).
    eva(pg, """()=>{ DECK.clock.ran = 5*60000; DECK.clock.from = Date.now(); clockPaint(); }""")
    pg.wait_for_timeout(150)
    mid = eva(pg, "()=>Math.round(clockLeft()/1000)")
    pg.keyboard.press("p"); pg.wait_for_timeout(120); pg.keyboard.press("p"); pg.wait_for_timeout(120)
    eva(pg, "()=>document.getElementById('dclock').click()"); pg.wait_for_timeout(120)
    eva(pg, "()=>document.getElementById('dclock').click()"); pg.wait_for_timeout(120)
    # COMPARED AS A FIGURE, never as the face's own string: "10:00" and
    # "9:59" differ in their first two characters with nothing reset, so a
    # prefix comparison reports a working guard as broken across every minute
    # boundary (§122.4's family).
    now = eva(pg, "()=>Math.round(clockLeft()/1000)")
    ok("neither the key nor the clock resets it — reset cannot be undone, so "
       "it is not on a surface a hand brushes past",
       isinstance(now, (int, float)) and isinstance(mid, (int, float))
       and abs(now - mid) < 30, (mid, now))
    eva(pg, "()=>document.querySelector('[data-dreset]').click()"); pg.wait_for_timeout(200)
    ok("and the bar's Reset does", str(eva(pg,
       "()=>document.querySelector('#dclock .dctime').textContent")).startswith("14:"))

    # ── 8 · the states, measured in both themes ──────────────────────────
    print("\n8 · what the room reads, in both palettes")
    def state(ms):
        eva(pg, """(left)=>{ var c = DECK.clock;
            c.ran = c.mins*60000 - left; c.from = Date.now(); clockPaint(); }""", ms)
        pg.wait_for_timeout(120)
        return eva(pg, """()=>{ var e = document.getElementById('dclock');
            var cs = getComputedStyle(e);
            return { txt: e.querySelector('.dctime').textContent, cls: e.className,
                     fg: cs.color, bg: cs.backgroundColor }; }""")
    for theme in ("light", "dark"):
        eva(pg, "(t)=>document.documentElement.setAttribute('data-theme', t)", theme)
        pg.wait_for_timeout(150)
        for label, ms, want in (("calm", 5*60000, ""), ("near", 90000, "near"),
                                ("over", -150000, "over")):
            s = state(ms)
            cls = str(val(s, "cls", ""))
            ok("%-5s %s says so in its class" % (theme, label),
               (want in cls) if want else ("near" not in cls and "over" not in cls), s)
            try:
                cr = contrast(val(s, "fg", "rgb(0,0,0)"), val(s, "bg", "rgb(255,255,255)"))
            except Exception as e:
                cr = 0
            ok("%-5s %s reads at %.2f:1" % (theme, label, cr), cr >= 4.5, s)
        ok("%-5s over counts ON past zero, it does not stop" % theme,
           str(val(state(-150000), "txt", "")).startswith("+"), state(-150000))
        # A clock held while OVER must stay red: the mark says it is held, the
        # colour says where you are, and quieting it would hide the one thing
        # the room needs to know.
        pg.keyboard.press("p"); pg.wait_for_timeout(150)
        h = eva(pg, "()=>document.getElementById('dclock').className")
        ok("%-5s held while over stays red, and adds the mark" % theme,
           "over" in str(h) and "paused" in str(h), h)
        pg.keyboard.press("p"); pg.wait_for_timeout(120)
    eva(pg, "()=>document.documentElement.removeAttribute('data-theme')")

    # ── 9 · it does not print ────────────────────────────────────────────
    print("\n9 · the contingency pack is a record, not a rehearsal")
    pg.emulate_media(media="print"); pg.wait_for_timeout(200)
    ok("the clock is not on a printed slide (§305)",
       eva(pg, "()=>getComputedStyle(document.getElementById('dclock')).display") == "none",
       eva(pg, "()=>getComputedStyle(document.getElementById('dclock')).display"))
    pg.emulate_media(media="screen"); pg.wait_for_timeout(150)
    eva(pg, "()=>closeDeck()"); pg.wait_for_timeout(200)

    # ── 10 · the unit's own view of its slot ─────────────────────────────
    print("\n10 · the unit sees its slot, and cannot set it")
    eva(pg, "()=>slidesOpen('unit','mobile')"); pg.wait_for_timeout(400)
    m = eva(pg, """()=>({ sub: document.querySelector('#slideroot .sl-sub').textContent,
        pens: document.querySelectorAll('#slideroot [data-mins]').length })""")
    ok("Manage slides says how long this subject has",
       "15 minutes" in str(val(m, "sub", "")), val(m, "sub"))
    ok("and offers no control for it — the minutes are the office's (§61, §42)",
       val(m, "pens") == 0, m)
    eva(pg, "()=>slidesClose()"); pg.wait_for_timeout(250)
    eva(pg, "()=>{ minsWrite('mobile', 0); slidesOpen('unit','mobile'); }"); pg.wait_for_timeout(400)
    m2 = eva(pg, "()=>document.querySelector('#slideroot .sl-sub').textContent")
    ok("with no time set it says nothing at all — both ends (§35, §94.2)",
       "minute" not in str(m2), m2)
    eva(pg, "()=>slidesClose()"); pg.wait_for_timeout(200)

    ok("no page error anywhere in the run", not errs, errs[:3])
    b.close()

# §334's own scar: a summary that counts one side and guesses the other
# printed "0 passed, 1 failed" over forty-one lines reading ok.
print("\n%d passed, %d failed" % (passes[0], len(fails)))
if fails:
    print("  " + "\n  ".join(fails))
raise SystemExit(1 if fails else 0)
