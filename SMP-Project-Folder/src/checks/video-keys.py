"""THE KEYBOARD BELONGS TO THE PRESENTATION (§296).

Islam, presenting with a clip on a slide: *"when I'm playing the video the right
and elft arrows are editing the video forward and backward &hellip; the forward
and backward of the video stream should be done by clicing on the video directly
and the right and left arrows and same for the up and down and pagup and down
stay for the repsentaiton."*

THE KEYS WERE NEVER IGNORED — THEY NEVER ARRIVED. A cross-origin iframe keeps
every key pressed while it holds focus, so the deck's window listener fires zero
times and there is nothing for `preventDefault` to cancel. The fix hands the
FOCUS back rather than intercepting the key.

WHAT IS ASSERTED, AND WHY EACH ONE IS HERE:

  1 · FOCUS LANDING IN A PLAYER COMES STRAIGHT BACK, on the projector AND in
      Manage slides — the editor arms a live player too and walks its rail with
      the same arrows (§69.6), so a fix on one side only is how the two drift
      (§53.5, A15).

  2 · AND THE KEY THEN WORKS: the slide moves. Asserted as a PAIR with the
      handoff, because focus coming back is only worth anything if the deck can
      then hear the key — and measured BEFORE the fix it is zero.

  3 · A CLICK ON A PLAYER DOES NOT ADVANCE THE SLIDE in fullscreen, where §265
      makes a click on the stage move the deck. A native `<video>` lives in our
      own document, so its clicks land here: pressing the player's own play
      button moved the deck on as well. Both ends — a click on the STAGE still
      advances, or a build that stopped every click would pass.

  4 · NOTHING IS TAKEN FROM THE MOUSE. The player still carries `controls`, and
      the iframe still carries the sandbox and referrer policy §261.11 settled —
      a fix that quietly dropped either would satisfy every assertion above.

  5 · AN ORDINARY TAB-SWITCH HANDS NOTHING BACK: the guard is
      `document.activeElement`, so a blur with focus somewhere else is a no-op.
      Without this the deck would steal focus from the whole browser.

It MAKES its state: the demo tenant carries no video slide, so every assertion
here passes on a build that lost the feature entirely (§94.2).

Run it against the pre-§296 file to watch it fail:
  python3 qa-run.py checks/video-keys.py ../strategy-management-platform-v3.22.html
"""
import os, sys
from playwright.sync_api import sync_playwright

HERE = os.path.dirname(os.path.abspath(__file__))
FILE = (os.path.abspath(sys.argv[1]) if len(sys.argv) > 1 else
        os.path.join(os.path.dirname(HERE), "strategy-management-platform.html"))
fails = []
UNIT = "mobile"


def ok(label, cond, detail=""):
    if cond:
        print("  ok      " + label)
    else:
        fails.append(label)
        print("  FAIL    " + label + ("  — " + str(detail) if detail != "" else ""))


def js(pg, expr, arg=None):
    """Every probe degrades rather than dying (§215)."""
    try:
        return pg.evaluate(expr, arg) if arg is not None else pg.evaluate(expr)
    except Exception as e:                                        # noqa: BLE001
        return {"threw": str(e).strip().split("\n")[0]}


# A video slide the demo does not have. `srcdoc` stands in for the embed: what
# matters is that it is an IFRAME holding focus, which is the whole fault — and
# it needs no network, so the check does not depend on YouTube being reachable.
MAKE = """(target) => {
  const r = (typeof REVIEW === 'undefined') ? null : REVIEW;
  if (!r) return { no: 'REVIEW' };
  r.slides = r.slides || {};
  r.slides[target] = [{ id: 'ps:vid1', title: 'A clip', after: null,
                        video: { kind: 'embed', url: 'https://example.invalid/v' } }];
  return { made: true };
}"""

# Put a real, focusable iframe and a native <video> on the slide that is showing,
# whichever surface is open — the platform's own builder needs a reachable
# provider, and the fault is about FOCUS, not about who serves the bytes.
PLANT = """(sel) => {
  const stage = document.querySelector(sel);
  if (!stage) return { no: sel };
  const w = document.createElement('div');
  w.className = 'vwrap';
  w.innerHTML = '<iframe id="vk-frame" srcdoc="&lt;body&gt;&lt;input id=i&gt;&lt;/body&gt;"' +
                ' style="width:320px;height:180px"></iframe>' +
                '<video id="vk-video" controls style="width:320px;height:180px"></video>';
  stage.appendChild(w);
  return { planted: true };
}"""

STATE = """() => {
  const dr = document.getElementById('deckroot');
  return { active: document.activeElement ? (document.activeElement.id ||
                    document.activeElement.tagName) : null,
           i: (typeof DECK === 'undefined') ? null : DECK.i,
           deckOn: !!(dr && dr.classList.contains('on')) };
}"""


def click(pg, sel, label):
    """A press degrades (§215). `pg.click` on an element with no box throws
    after its timeout and takes every later assertion with it — which is how
    the first run of this file reported four results instead of sixteen."""
    try:
        pg.eval_on_selector(sel, "el => el.click()")
        return True
    except Exception as e:                                        # noqa: BLE001
        ok(label, False, str(e).split("\n")[0])
        return False


def handoff(pg, label, stage_sel, root_id):
    print("\n── " + label + " ──────────────────────────────────────")
    # the previous surface's player is still in the document — a second
    # `#vk-frame` makes the locator ambiguous and the run dies on it
    js(pg, "() => document.querySelectorAll('.vwrap:has(#vk-frame)')"
           ".forEach(function(e){ e.remove(); })")
    r = js(pg, PLANT, stage_sel)
    ok("a player is on the slide", r.get("planted") is True, r)

    # §1 — focus into the frame, and watch it come back
    try:
        pg.frame_locator("#vk-frame").locator("#i").click(timeout=3000)
    except Exception as e:                                        # noqa: BLE001
        ok("focus can be put in the player", False, str(e).split("\n")[0])
        return
    pg.wait_for_timeout(500)
    s = js(pg, STATE)
    ok("focus is handed back to the presentation",
       s.get("active") == root_id, s)


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
    js(pg, MAKE, UNIT)

    # ── the projector ───────────────────────────────────────────────────────
    js(pg, "(t) => openDeckFor(t)", UNIT)
    pg.wait_for_timeout(900)
    ok("the deck is open", js(pg, STATE).get("deckOn") is True)
    handoff(pg, "ON THE PROJECTOR", "#deckroot .dslide.on", "deckroot")

    # §2 — and the key then works. Measured as a PAIR with the handoff.
    before = js(pg, STATE).get("i")
    pg.keyboard.press("ArrowRight")
    pg.wait_for_timeout(400)
    after = js(pg, STATE).get("i")
    ok("...and the arrow then moves the slide",
       isinstance(before, int) and isinstance(after, int) and after == before + 1,
       {"was": before, "now": after})

    # §5 — a blur with focus elsewhere hands nothing back
    js(pg, "() => { document.getElementById('vk-video').focus();"
           "         dispatchEvent(new Event('blur')); }")
    pg.wait_for_timeout(300)
    ok("an ordinary blur elsewhere hands nothing back",
       js(pg, STATE).get("active") == "vk-video", js(pg, STATE))

    # §3 — a click on a player does not advance the slide in fullscreen
    js(pg, "() => document.getElementById('deckroot').classList.add('fs')")
    before = js(pg, STATE).get("i")
    click(pg, "#vk-video", "the player can be clicked at all")
    pg.wait_for_timeout(400)
    ok("a click on the player does NOT advance the slide",
       js(pg, STATE).get("i") == before, {"was": before, "now": js(pg, STATE).get("i")})
    # ...and the stage itself still does, or a build that stopped every click passes
    before = js(pg, STATE).get("i")
    click(pg, "#deckroot .deckstage", "the stage can be clicked at all")
    pg.wait_for_timeout(400)
    ok("...but a click on the stage still does",
       js(pg, STATE).get("i") != before, {"was": before, "now": js(pg, STATE).get("i")})
    js(pg, "() => document.getElementById('deckroot').classList.remove('fs')")

    # §4 — nothing is taken from the mouse, and §261.11's frame rules survive
    r = js(pg, """() => {
      const embed = vslideHtml({ id:'x', title:'t', kind:'video',
        vid:{ url:'https://www.youtube.com/watch?v=abc123' } }, false) || '';
      const file  = vslideHtml({ id:'y', title:'t', kind:'video',
        vid:{ path:'a/b.mp4' } }, false) || '';
      return { drewEmbed: /<iframe/.test(embed), drewFile: /<video/.test(file),
               controls: /<video[^>]*\\scontrols/.test(file),
               sandbox: /sandbox="allow-scripts allow-same-origin allow-presentation"/.test(embed),
               referrer: /referrerpolicy="strict-origin"/.test(embed) };
    }""")
    ok("the builder still draws both kinds",
       r.get("drewEmbed") is True and r.get("drewFile") is True, r)
    ok("a file player keeps its controls", r.get("controls") is True, r)
    ok("the embed keeps §261.11's sandbox", r.get("sandbox") is True, r)
    ok("...and its referrer policy", r.get("referrer") is True, r)

    js(pg, "() => closeDeck()")
    pg.wait_for_timeout(500)

    # ── the editor: the same fault, the same helper (§53.5, A15) ────────────
    js(pg, "() => slidesOpen('unit', %s)" % repr(UNIT).replace("'", '"'))
    pg.wait_for_timeout(900)
    handoff(pg, "IN MANAGE SLIDES", "#slidepane", "slideroot")
    js(pg, "() => slidesClose()")
    pg.wait_for_timeout(400)

    ok("no page errors", not errs, errs[:3])
    b.close()

print("\n" + ("video-keys: %d FAILURES" % len(fails) if fails
             else "video-keys: all checks passed"))
sys.exit(1 if fails else 0)
