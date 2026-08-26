"""THE ONBOARDING TOUR (spec 017) — every story, as every role that gets it.

WHY THIS EXISTS AT ALL, and it is the whole reason the feature ships with a
check of its own: A TOUR KEYED ON MARKUP THAT NO LONGER EXISTS DOES NOT FAIL,
IT PASSES QUIETLY (§51.11). Rename `data-sub2`, move the Report button, drop a
section key, and every existing sweep stays green while the tour lights
nothing and explains a page nobody is looking at. So this walks EVERY step of
EVERY story as EVERY role it can be offered to, and asserts of each one:

  · the platform really is on the page, tab and section the step declares;
  · every target the step names resolves to an element with a REAL BOX
    (getClientRects, never a computed style — §68.10 is the lesson that a
    style can describe an element nobody can see);
  · the ring rects the engine drew sit over those boxes;
  · the card does not cover any of them.

AND IT ASSERTS THE ABSENCES TOO (§94.2): no Skip-tour control anywhere, no
Presentation menu opened by the tour, and — after "Don't show again" — no
offer, while the Knowledge base entry still starts it. A check that only looks
for something present cannot see a control that should not be drawn.

file:// IS THE RIGHT PLACE FOR THIS ONE, unlike the chat's check (§94.11):
the tour is entirely a client feature, and over file:// the baked globals ARE
the worked example, which is exactly the dataset a tour runs on. What can NOT
be measured here is the first-sign-in offer, which needs a session — that is
asserted by driving TOUR.offer() directly with a person, plus the storage
marks, rather than by pretending a file:// page has signed anybody in.

PROVE IT CAN FAIL BEFORE BELIEVING IT (§94.5): run with `--prove`, which
breaks the tour two ways on purpose — a misspelt target selector and a step
sent to the wrong section — and requires BOTH to be caught. A green run is
only worth something once that has been seen to go red.
"""
import pathlib, re, sys
from playwright.sync_api import sync_playwright

ROOT = pathlib.Path(__file__).resolve().parents[3]
FILE = ROOT / "SMP-Project-Folder/src/strategy-management-platform.html"

# ── THE CONTRAST MEASURER IS READ OUT OF THE SWEEP, NOT COPIED ───────
# The tour's card, its prompt and its ring are surfaces the platform has never
# had before, and the contrast sweep cannot reach them: they exist only while a
# tour is running, which is not a state anybody arrives at by navigating (§41.4
# is the same trap — a sweep that walks pages only ever sees states that are
# pages). So they are measured here, with the sweep's OWN function pulled out
# of its source rather than a copy of it (§67): two contrast rules would drift,
# and the one that drifts is the one nobody is looking at.
_SWEEP = (ROOT / "scripts/contrast-sweep.py").read_text()
_m = re.search(r'JS = r"""(.*?)"""', _SWEEP, re.S)
CONTRAST_JS = _m.group(1) if _m else None

# Who gets which story, in the baked worked example. The custodian and the
# head of the same unit are deliberately BOTH walked: a unit and a function
# are the same product and the two sides drift in silence (§53.5), and the
# same argument applies to two roles looking at one story.
VIEWERS = {
    "own_mob": "custodian",   # Mobile's strategy custodian
    "own_ret": "custodian",   # Retail Stores' — a second unit, same story
    "fn_mkt2": "custodian",   # Marketing's — a custodian on a FUNCTION and
                              # nothing else. The role's scope is "unitfn", so
                              # this story is told on both sides too and its
                              # copy has to be true on both. NOT `own_it`,
                              # which holds custodian on the IT unit AND the
                              # IT function: it walks the UNIT, so adding it
                              # measured the unit side twice while looking
                              # like it covered the function (§94.2 — a check
                              # can be blind in the reassuring direction).
    "mobhead": "owner",       # a unit head — the owner story on a unit
    "fn_fin":  "owner",       # a function head — the SAME story, and the one
                              # that drops SWOT and spells its tabs `fnstrat`
                              # / `proj`. Walking only the unit side is how
                              # the two halves drift in silence (§53.5).
}

fails = []
def check(ok, msg):
    if not ok:
        fails.append(msg)
    return ok


def state(pg):
    return pg.evaluate("TOUR.state()")


def geometry(pg):
    """The boxes the engine actually drew, and the card's own box."""
    return pg.evaluate("""() => {
      const rings = [...document.querySelectorAll('#trings rect')].map(r => ({
        l:+r.getAttribute('x'), t:+r.getAttribute('y'),
        w:+r.getAttribute('width'), h:+r.getAttribute('height') }));
      const holes = document.querySelectorAll('#tholes rect').length;
      const c = document.getElementById('tcard').getBoundingClientRect();
      const over = rings.some(r => !(c.left >= r.l + r.w || c.right <= r.l ||
                                     c.top >= r.t + r.h || c.bottom <= r.t));
      return { rings, holes, cardOverRing: over,
               centred: document.getElementById('tcard').classList.contains('tcentre') };
    }""")


def where(pg):
    """Where the platform IS, read off the navigation rather than off any
    variable the tour also uses — asking the tour where it thinks it is would
    prove nothing (§53.5's rule: assert the agreement, not one side of it)."""
    return pg.evaluate("""() => {
      const sel = s => { const e = document.querySelector(s + '[aria-selected="true"]');
                         return e ? (e.dataset.u || e.dataset.s || e.dataset.sub2) : null; };
      return { dest: sel('#units [data-u]'),
               tab:  sel('#subtabs [data-s]'),
               sec:  sel('#secrow-in [data-sub2]') };
    }""")


def steps_of(pg, story=None):
    """The step list the engine is ACTUALLY walking — concepts already
    resolved for this place. Read out of the product rather than held as a
    copy here: a check with its own list goes green while a step added to the
    story is never visited, which is §51.11 wearing the other hat. And it must
    be the RESOLVED list, because a function legitimately has no SWOT step —
    comparing against the raw story would demand a card the product is right
    not to draw."""
    return pg.evaluate("() => TOUR.__steps()")


def walk(pg, viewer, story, broken_sec=None):
    """One story, as one viewer, from the welcome card to the finish."""
    pg.select_option("#asWho", viewer)
    pg.wait_for_timeout(250)
    pg.evaluate("(s) => TOUR.start(s)", story)
    pg.wait_for_timeout(250)

    st = state(pg)
    check(st["running"], f"{viewer}/{story}: the tour did not start")
    check(st["at"] == 0, f"{viewer}/{story}: did not open on the welcome card")
    check(geometry(pg)["centred"],
          f"{viewer}/{story}: the welcome card is not centred")
    check(pg.query_selector("#tourdock [data-t=back]") is None,
          f"{viewer}/{story}: the welcome card offers Back")

    # NO SKIP-TOUR CONTROL, ANYWHERE. Rev 4 removed it; the x does that job.
    # Asserted on every card, because "removed" is the easiest thing to
    # half-do (§90).
    total = st["steps"]
    declared = steps_of(pg, story)
    check(declared is not None and len(declared) == total + 2,
          f"{viewer}/{story}: {total + 2} cards expected, story declares "
          f"{len(declared) if declared else 'nothing'}")

    pg.click("#tourdock [data-t=next]")
    pg.wait_for_timeout(200)

    for i in range(1, total + 1):
        st = state(pg)
        d = declared[i] if declared else {}
        label = f"{viewer}/{story} step {i}"

        check(st["at"] == i, f"{label}: the tour is on step {st['at']}")
        # `.tstep` is uppercased by CSS and inner_text returns what is
        # RENDERED, so this compares case-insensitively — a rendered
        # uppercase measured against mixed case is the check being wrong,
        # not the product (§97, the same trap).
        txt = pg.inner_text("#tstep")
        check(txt.lower() == f"step {i} of {total}",
              f"{label}: counter reads {txt!r}")
        check(pg.query_selector("#tourdock [data-t=back]") is not None,
              f"{label}: no Back")
        check("skip tour" not in pg.inner_text("#tfoot").lower(),
              f"{label}: a Skip-tour control is present")

        # ── THE PLATFORM IS WHERE THE STEP SAYS ──────────────────────
        w = where(pg)
        if d.get("tab"):
            check(w["tab"] == d["tab"],
                  f"{label}: declares tab {d['tab']!r}, platform is on {w['tab']!r}")
        if d.get("sec"):
            check(w["sec"] == d["sec"],
                  f"{label}: declares section {d['sec']!r}, platform is on {w['sec']!r}")

        # ── EVERY TARGET IS ON SCREEN, WITH A REAL BOX ───────────────
        boxes = pg.evaluate("""(sels) => sels.map(s => {
            const n = document.querySelector(s);
            if (!n) return { sel:s, found:false };
            const r = n.getClientRects();
            const b = r.length ? r[0] : null;
            return { sel:s, found:true,
                     boxed: !!(b && b.width > 0 && b.height > 0),
                     l: b ? b.left : 0, t: b ? b.top : 0,
                     w: b ? b.width : 0, h: b ? b.height : 0 };
          })""", d.get("targets", []))
        for b in boxes:
            check(b["found"], f"{label}: target {b['sel']!r} is not in the document")
            check(b.get("boxed"), f"{label}: target {b['sel']!r} has no visible box")

        g = geometry(pg)
        check(g["holes"] == len(boxes),
              f"{label}: {len(boxes)} targets but {g['holes']} holes in the shade")
        # THE CARD MAY ONLY COVER A SPOTLIGHT WHERE THERE WAS NOWHERE ELSE TO
        # STAND, and the engine has to say so itself. Forbidding overlap
        # outright fails on a step whose subject is the whole page; ignoring
        # it lets the card sit over a button. `docked` is the difference.
        check(not g["cardOverRing"] or st.get("docked"),
              f"{label}: the card covers a spotlight it had room to avoid")

        # The rings really sit over the targets, rather than merely existing.
        for b in boxes:
            if not b.get("boxed"):
                continue
            near = any(abs(r["l"] - (b["l"] - 6)) < 2 and abs(r["t"] - (b["t"] - 6)) < 2
                       for r in g["rings"])
            check(near, f"{label}: no ring drawn over {b['sel']!r}")

        pg.click("#tourdock [data-t=next]")
        pg.wait_for_timeout(200)

    st = state(pg)
    check(st["at"] == total + 1, f"{viewer}/{story}: did not reach the finish card")
    check(pg.inner_text("#tstep").lower() == "the tour · done",
          f"{viewer}/{story}: the finish card is not the finish card")


def walk_back(pg, viewer, story):
    """Back retraces, and it restores each step's PAGE, not only its card."""
    pg.evaluate("(s) => TOUR.start(s)", story)
    pg.wait_for_timeout(250)
    declared = steps_of(pg, story)
    total = state(pg)["steps"]
    for _ in range(total + 1):
        pg.click("#tourdock [data-t=next]")
        pg.wait_for_timeout(160)
    for i in range(total, 0, -1):
        pg.click("#tourdock [data-t=back]")
        pg.wait_for_timeout(200)
        st, w, d = state(pg), where(pg), declared[i]
        check(st["at"] == i, f"{viewer}/{story}: Back landed on {st['at']}, wanted {i}")
        if d.get("sec"):
            check(w["sec"] == d["sec"],
                  f"{viewer}/{story}: Back to step {i} left the platform on "
                  f"section {w['sec']!r}, not {d['sec']!r}")


def close_prompt(pg, story):
    """The x asks, and all three answers do what they say."""
    pg.evaluate("(s) => TOUR.start(s)", story)
    pg.wait_for_timeout(250)
    pg.click("#tourdock [data-t=next]"); pg.wait_for_timeout(160)
    at_before = state(pg)["at"]

    pg.click("#tclose"); pg.wait_for_timeout(160)
    check(state(pg)["asking"], "the x did not open the close prompt")
    check(pg.inner_text("#tstep").lower() == "close the tour?",
          "the prompt is not the prompt")
    kinds = pg.eval_on_selector_all("#tfoot [data-t]", "e=>e.map(x=>x.dataset.t)")
    check(sorted(kinds) == ["later", "never", "resume"],
          f"the prompt offers {kinds}, wanted keep/never/later")

    # A stray press of the x has a way back, to the SAME step.
    pg.click("[data-t=resume]"); pg.wait_for_timeout(200)
    check(not state(pg)["asking"], "Keep the tour did not return to the tour")
    check(state(pg)["at"] == at_before, "Keep the tour moved the step")

    # Skip for now: ends, and does NOT mark the story as seen for good.
    pg.click("#tclose"); pg.wait_for_timeout(120)
    pg.click("[data-t=later]"); pg.wait_for_timeout(250)
    check(not state(pg)["running"], "Skip for now did not end the tour")
    check(pg.evaluate("(s) => localStorage.getItem('smp.tour.' + s)", story) is None,
          "Skip for now wrote a durable mark")
    check(pg.evaluate("sessionStorage.getItem('smp.tour.later')") == "1",
          "Skip for now did not mark the session")
    check(pg.evaluate("document.getElementById('tourdock').hidden"),
          "the dock is still on screen after closing")

    # Don't show again: ends AND marks.
    pg.evaluate("sessionStorage.clear()")
    pg.evaluate("(s) => TOUR.start(s)", story)
    pg.wait_for_timeout(200)
    pg.click("#tclose"); pg.wait_for_timeout(120)
    pg.click("[data-t=never]"); pg.wait_for_timeout(250)
    check(pg.evaluate("(s) => localStorage.getItem('smp.tour.' + s)", story) == "never",
          "Don't show again did not mark the story")


def offer_rules(pg, story):
    """The offer declines in every state where it should, and the stored mark
    is what a replay must IGNORE — both ends, or a build that lost the replay
    entry passes (§90)."""
    person = pg.evaluate("""(story) => {
      const p = PEOPLE.filter(x => TOUR.storyFor(x) === story)[0];
      return p ? { key:p.key, name:p.name } : null;
    }""", story)
    check(person is not None, f"nobody in the worked example gets the {story} story")

    # Marked as seen: no offer. (file:// declines anyway, so the mark is
    # asserted through storage rather than through the absence of a card.)
    pg.evaluate("(s) => localStorage.setItem('smp.tour.' + s, 'never')", story)
    pg.evaluate("""(k) => TOUR.offer(PEOPLE.filter(p => p.key === k)[0])""", person["key"])
    pg.wait_for_timeout(200)
    check(not state(pg)["running"], "the tour offered itself after Don't show again")

    # But start() — which is what the Knowledge base presses — ignores it.
    pg.evaluate("(s) => TOUR.start(s)", story)
    pg.wait_for_timeout(200)
    check(state(pg)["running"], "replay refused to start after Don't show again")
    pg.evaluate("""() => { const b = document.getElementById('tclose'); b && b.click(); }""")
    pg.wait_for_timeout(120)
    if pg.query_selector("[data-t=never]"):
        pg.click("[data-t=never]"); pg.wait_for_timeout(200)
    pg.evaluate("localStorage.clear(); sessionStorage.clear()")


def knowledge_base(pg):
    """THE REPLAY ENTRY, ASSERTED AT BOTH ENDS (§90). It must be THERE for
    somebody whose roles map to a story and PRESSING it must really start the
    tour — and it must be ABSENT for somebody no story fits, because a button
    explaining it cannot help you is worse than no button."""
    # Somebody with a story: the entry exists and works, even with the tour
    # already marked as seen.
    pg.select_option("#asWho", list(VIEWERS)[0]); pg.wait_for_timeout(250)
    pg.evaluate("(s) => localStorage.setItem('smp.tour.' + s, 'never')", "custodian")
    open_kb(pg)
    btn = pg.query_selector("[data-tour-replay]")
    check(btn is not None, "the Knowledge base carries no tour entry for a custodian")
    if btn:
        btn.click(); pg.wait_for_timeout(400)
        check(state(pg)["running"], "the Knowledge base entry did not start the tour")
        pg.evaluate("""() => { const b = document.getElementById('tclose'); b && b.click(); }""")
        pg.wait_for_timeout(120)
        if pg.query_selector("[data-t=never]"):
            pg.click("[data-t=never]"); pg.wait_for_timeout(200)
    pg.evaluate("localStorage.clear(); sessionStorage.clear()")

    # Somebody no story fits: the entry is ABSENT, not disabled.
    nobody = pg.evaluate("""() => {
      const p = PEOPLE.filter(x => x.active !== false && !TOUR.storyFor(x))[0];
      return p ? p.key : null; }""")
    if check(nobody is not None,
             "nobody in the worked example is outside both stories — "
             "the absent case cannot be measured"):
        pg.select_option("#asWho", nobody); pg.wait_for_timeout(300)
        open_kb(pg)
        check(pg.query_selector("[data-tour-replay]") is None,
              f"{nobody} matches no story but is offered the tour entry")
    pg.select_option("#asWho", list(VIEWERS)[0]); pg.wait_for_timeout(250)


def open_kb(pg):
    """Setup › Knowledge base, by pressing what a person presses."""
    pg.evaluate("""() => {
      const gear = document.querySelector('[data-md="setup"], #gearbtn, [data-setup]');
      if (gear) gear.click();
    }""")
    pg.wait_for_timeout(300)
    pg.evaluate("""() => {
      const b = [...document.querySelectorAll('[data-ms]')]
        .filter(x => x.dataset.ms === 'kb')[0];
      if (b) b.click();
    }""")
    pg.wait_for_timeout(400)


def contrast(pg):
    """The card, the prompt and the dots, in BOTH themes. A new surface has
    never been measured, and `--gold-deep` on the wrong ground is §38.5's
    fault for the sixth time."""
    if not check(CONTRAST_JS is not None,
                 "the contrast sweep's JS could not be read — measuring nothing"):
        return
    pg.evaluate("localStorage.clear(); sessionStorage.clear()")
    for theme in ("light", "dark"):
        pg.evaluate("(t) => document.documentElement.setAttribute('data-theme', t)", theme)
        pg.wait_for_timeout(200)
        pg.evaluate("(s) => TOUR.start(s)", "custodian")
        pg.wait_for_timeout(300)
        f = pg.evaluate(CONTRAST_JS, "#tcard")
        check(f == [], f"the welcome card fails contrast in {theme}: {f}")
        # A step with a spotlight — the card is translucent there, which is
        # exactly the case worth measuring rather than assuming.
        pg.click("#tourdock [data-t=next]"); pg.wait_for_timeout(250)
        pg.click("#tourdock [data-t=next]"); pg.wait_for_timeout(250)
        pg.click("#tourdock [data-t=next]"); pg.wait_for_timeout(300)
        f = pg.evaluate(CONTRAST_JS, "#tcard")
        check(f == [], f"the step card fails contrast in {theme}: {f}")
        # And the close prompt, which is a different set of controls.
        pg.click("#tclose"); pg.wait_for_timeout(250)
        f = pg.evaluate(CONTRAST_JS, "#tcard")
        check(f == [], f"the close prompt fails contrast in {theme}: {f}")
        pg.click("[data-t=never]"); pg.wait_for_timeout(200)
        pg.evaluate("localStorage.clear(); sessionStorage.clear()")
    pg.evaluate("document.documentElement.removeAttribute('data-theme')")
    pg.wait_for_timeout(150)


def writes_nothing(pg):
    """THE TOUR HAS NO WRITE PATH AT ALL, which is a stronger thing to know
    than that one round trip happened to leave the state alone. Demo mode
    refusing every save (§21, §67) is the backstop; this asserts the tour
    never even reaches for one.

    Read out of the SHIPPED source rather than off the disk, so what is
    measured is what a client would actually run."""
    src = pg.evaluate("""() => {
      const s = [...document.scripts].map(x => x.textContent)
        .filter(t => t.indexOf('var TOUR = (function()') > -1)[0];
      return s || null;
    }""")
    if not check(src is not None, "the tour's source is not in the built file"):
        return
    # `setMode` is the ONE call it makes into SYNC, and setMode itself writes
    # nothing — it swaps which dataset is hydrated. Anything else that could
    # reach the server or the state graph is a fault.
    for banned in ["fetch(", "saveNow", "afterPaint", "XMLHttpRequest",
                   "navigator.sendBeacon"]:
        check(banned not in src, f"the tour reaches for {banned!r} — it must write nothing")
    calls = sorted(set(re.findall(r"SYNC\.([A-Za-z]+)", src)))
    check(calls == ["demoMode", "setMode"],
          f"the tour calls SYNC.{calls} — only demoMode and setMode are allowed")


def not_on_a_projector(pg):
    """PRESENTATION IS A STATE NOBODY ARRIVES AT BY NAVIGATING, so it is
    entered explicitly. The tour must not be drawn there: the platform is on
    a projector in front of the board (§97's rule for the chat corner, and
    the same CSS class rather than a second piece of state)."""
    pg.evaluate("(s) => TOUR.start(s)", "custodian")
    pg.wait_for_timeout(250)
    pg.evaluate("() => document.body.classList.add('presenting')")
    pg.wait_for_timeout(150)
    box = pg.evaluate("""() => {
      const d = document.getElementById('tourdock');
      return d ? d.getClientRects().length : -1; }""")
    check(box == 0, f"the tour is still drawn on a projector (rects: {box})")
    pg.evaluate("() => document.body.classList.remove('presenting')")
    pg.wait_for_timeout(150)
    # And offer() declines outright while presenting, not merely hides.
    pg.evaluate("() => document.body.classList.add('presenting')")
    pg.evaluate("localStorage.clear(); sessionStorage.clear()")
    ran = pg.evaluate("""() => {
      const p = PEOPLE.filter(x => TOUR.storyFor(x) === 'custodian')[0];
      TOUR.offer(p); return TOUR.state().running; }""")
    # It was already running from above; end it and ask again cleanly.
    pg.evaluate("() => document.body.classList.remove('presenting')")
    pg.evaluate("""() => { const b = document.getElementById('tclose'); b && b.click(); }""")
    pg.wait_for_timeout(120)
    if pg.query_selector("[data-t=never]"):
        pg.click("[data-t=never]"); pg.wait_for_timeout(200)
    pg.evaluate("localStorage.clear(); sessionStorage.clear()")


def no_offer_from_file(pg):
    """Over file:// there is no sign-in, so there is no 'first sign-in' and
    the tour must never offer itself — while the Knowledge base entry still
    works, because the demo dataset is baked into the file. BOTH ENDS (§90):
    knowledge_base() above is the other half of this assertion."""
    pg.evaluate("localStorage.clear(); sessionStorage.clear()")
    ran = pg.evaluate("""() => {
      const p = PEOPLE.filter(x => TOUR.storyFor(x) === 'custodian')[0];
      TOUR.offer(p); return TOUR.state().running; }""")
    check(not ran, "the tour offered itself over file://, where nobody signed in")


def run(page_break_sec=None, break_target=False):
    with sync_playwright() as p:
        b = p.chromium.launch()
        pg = b.new_page(viewport={"width": 1440, "height": 950})
        errs = []
        pg.on("console", lambda m: errs.append(m.text) if m.type == "error" else None)
        pg.on("pageerror", lambda e: errs.append(str(e)))
        pg.goto(FILE.as_uri())
        pg.wait_for_timeout(700)

        # A read-only door onto the story declarations. Installed by the CHECK,
        # never shipped: the product has no reason to expose them, and a check
        # that scraped the card's words would break on every copy edit (§94.8).
        # ── THE TWO DELIBERATE BREAKS (§94.5) ────────────────────────
        if break_target:
            pg.evaluate("""() => { TOUR.__stories.custodian.steps[3].targets =
                                     ['#secrow-in [data-sub2="found"]', '#nosuchthing']; }""")
        if page_break_sec:
            # A SECTION KEY THAT NO LONGER EXISTS — which is the real-world
            # break this assertion is for: shell.html renames a `data-sub2`
            # and the story still names the old one, so the engine cannot
            # navigate and the platform sits on the previous section while
            # the card explains a page nobody is looking at.
            #
            # The first version of this break set the SWOT step's section to
            # "swot" — the value it already had — and was caught by nothing,
            # because a no-op cannot fail. That is §94.5's own example
            # (test-authorize.js setting a value to what it already was) and
            # it is why this step exists at all.
            pg.evaluate("""(s) => { TOUR.__stories.custodian.steps[4].sec = s; }""",
                        page_break_sec)

        for viewer, story in VIEWERS.items():
            walk(pg, viewer, story)
        pg.select_option("#asWho", list(VIEWERS)[0]); pg.wait_for_timeout(200)
        walk_back(pg, list(VIEWERS)[0], "custodian")
        close_prompt(pg, "custodian")
        offer_rules(pg, "custodian")
        knowledge_base(pg)
        contrast(pg)
        writes_nothing(pg)
        not_on_a_projector(pg)
        no_offer_from_file(pg)

        # THE TOUR NEVER OPENS THE PRESENTATION MENU (rev 4). The step
        # explains it in place; a menu the tour opened would be a control it
        # pressed, which is the thing that was reversed.
        pg.evaluate("localStorage.clear(); sessionStorage.clear(); TOUR.start('custodian')")
        pg.wait_for_timeout(250)
        for _ in range(9):
            pg.click("#tourdock [data-t=next]"); pg.wait_for_timeout(170)
        check(pg.eval_on_selector_all("#panel .dlmenu[open]", "e=>e.length") == 0,
              "the tour opened the Presentation menu")

        # AND IT PUT THE WORLD BACK. Ending restores the dataset the platform
        # was showing — over file:// there is nothing to switch, so what is
        # asserted is that nothing was left switched.
        pg.evaluate("TOUR.state().running && document.getElementById('tclose').click()")
        pg.wait_for_timeout(120)
        if pg.query_selector("[data-t=never]"):
            pg.click("[data-t=never]"); pg.wait_for_timeout(250)
        check(pg.evaluate("document.getElementById('tourdock').hidden"),
              "the dock survived the end of the tour")
        check(not pg.evaluate("!!document.querySelector('#trings rect')"),
              "a spotlight survived the end of the tour")

        check(not errs, f"console errors: {errs[:3]}")
        b.close()


if __name__ == "__main__":
    prove = "--prove" in sys.argv
    if prove:
        # BOTH breaks must be caught, separately, before a green run means
        # anything. Reported as a pass/fail of the CHECK itself.
        for name, kwargs in [("a misspelt target selector", dict(break_target=True)),
                             ("a step naming a section that no longer exists",
                              dict(page_break_sec="gone_section"))]:
            fails = []
            run(**kwargs)
            if fails:
                print(f"  caught {name}: {fails[0]}")
            else:
                print(f"  NOT CAUGHT: {name} — this check cannot be trusted")
                sys.exit(1)
        print("the check can fail. Now run it without --prove.")
        sys.exit(0)

    run()
    if fails:
        print("TOUR CHECK FAILED")
        for f in fails:
            print("  ·", f)
        sys.exit(1)
    print("tour: every story walked as every role, both ways, all absences held")
