"""THE OFFICE HIDES A SLIDE, AND THE PROJECTOR SKIPS IT (§253).

Islam: *"allow the smo to hide presentation slides of any unit or function."*
§246 recorded the question this answers and named the half that matters most —
**whether hiding one hides what it counts**. It does not, so the assertion this
file exists for is that every headline number is byte-identical either side of
the press, and it is made before anything about how the rail looks.

WHAT IT DRIVES RATHER THAN READS. Every claim goes through the real control and
comes back out of the stored graph: the eye is HOVERED and PRESSED (§70 — a
control in the document is not a control anybody can reach), and
`UNITS[k].hideSlides` is read afterwards. A check that asserted a class on a row
would pass on a build that painted the row and wrote nothing.

BOTH ENDS OF EVERY GATE (§94.2), and never an absence on its own (§113.8):
"the slide is gone from the deck" is true of a deck that failed to build at
all, so every such assertion also insists the deck HAS slides.

EVERY PROBE DEGRADES (§215). On a build without this feature there is no
`SMPRules.hiddenSlides` and no `deckHidePass`, so the first probe throws — and
a check that dies reports nothing, which `grep -c FAIL` reads as zero. That is
a falsification that looks like a pass, and this is the build the file most has
to be able to see.

Run: python3 checks/hide-slide.py   (or via qa-run.py for the bundled Chromium)
"""
import json, pathlib, sys
from playwright.sync_api import sync_playwright

ROOT = pathlib.Path(__file__).resolve().parents[3]
FILE = ROOT / "SMP-Project-Folder/src/strategy-management-platform.html"
CHROME = "/opt/pw-browsers/chromium"
UNIT = "mobile"

ok = bad = 0
def check(what, cond, got=""):
    global ok, bad
    if cond:
        ok += 1
    else:
        bad += 1
        print("  FAIL  %s%s" % (what, ("  --  " + str(got)) if got != "" else ""))


THREW = "(the page threw)"
_said = set()
def ev(pg, expr, arg=None, default=None):
    """A throw becomes a value the assertions can fail on, reported once."""
    try:
        return pg.evaluate(expr) if arg is None else pg.evaluate(expr, arg)
    except Exception as e:
        msg = str(e).split("\n")[0]
        if msg not in _said:
            _said.add(msg)
            print("  (threw: %s)" % msg)
        return default


def get(d, k):
    """A probe that threw answers None for every key rather than raising."""
    return d.get(k) if isinstance(d, dict) else None


def press(pg, i):
    """Point at the row, then press its eye — the real interaction, and proof
    the control is reachable rather than merely present (§70). The eye is
    `display:none` until its row is hovered, selected or already hidden, so
    Playwright refuses to click it cold; forcing the click would pass on a
    build where nobody could ever press it."""
    try:
        pg.query_selector_all("#slidelist .slrow")[i].hover()
        pg.wait_for_timeout(80)
        pg.query_selector_all("#slidelist .slrow")[i].query_selector(".slhide").click()
        pg.wait_for_timeout(320)
        return True
    except Exception:
        return False


def counts(pg, key):
    """The subject's headline numbers, read from the platform's OWN functions.
    §253's claim is about what those return; a screen reading could pass on a
    build that merely stopped drawing them."""
    return ev(pg, """(k) => {
      const u = UNITS[k];
      const n = (v) => (v == null || isNaN(v)) ? null : Math.round(v * 1000) / 1000;
      return { objectives: n(unitObjectives(u)), pillars: n(unitPillars(u)),
               execution: n(unitRatio(u)),
               reported: JSON.stringify(reportedCount(u)) };
    }""", key, THREW)


def deck(pg, key):
    """The deck the PROJECTOR assembles — built the way openDeckWith() builds
    it, hide pass and all, so this is what a room would see."""
    return ev(pg, """(k) => {
      const box = document.createElement('div');
      box.className = 'deck';
      box.innerHTML = deckSlides(UNITS[k]);
      insertPictureSlides(box, k);
      deckHidePass(box, k);
      return { anchors: [...box.querySelectorAll('.dslide[data-anchor]')]
                          .map(s => s.dataset.anchor),
               slides: box.querySelectorAll('.dslide').length,
               pics: box.querySelectorAll('.dslide[data-ps]').length };
    }""", key, None)


def gone(d, anchor):
    """Absent AND the deck was really built (§113.8)."""
    return isinstance(d, dict) and d.get("slides", 0) > 0 and anchor not in d["anchors"]


with sync_playwright() as pw:
    b = pw.chromium.launch(executable_path=CHROME,
                           args=["--no-sandbox", "--disable-dev-shm-usage"])
    pg = b.new_page(viewport={"width": 1600, "height": 950})
    errs = []
    pg.on("pageerror", lambda e: errs.append(str(e)))
    pg.goto("file://" + str(FILE))
    pg.wait_for_timeout(600)

    print("1 · the shared reader answers before anything is stored")
    r = ev(pg, """(k) => ({
      empty: SMPRules.hiddenSlides(UNITS[k]).length,
      frozen: Object.isFrozen(SMPRules.hiddenSlides({})),
      shared: SMPRules.hiddenSlides({}) === SMPRules.hiddenSlides({ukey:'x'}),
      created: ('hideSlides' in UNITS[k]),
      field: SMPRules.HIDE_SLIDES
    })""", UNIT, THREW)
    check("nothing is hidden to begin with", get(r, "empty") == 0, get(r, "empty"))
    # §42: a reader that creates the field it looked for makes every later save
    # carry a change the database never held.
    check("reading never creates the field", get(r, "created") is False, get(r, "created"))
    check("the empty answer is frozen and shared",
          get(r, "frozen") is True and get(r, "shared") is True, r)
    check("the field is named from the shared module",
          get(r, "field") == "hideSlides", get(r, "field"))

    print("2 · Manage slides opens, and the office gets an eye")
    ev(pg, "slidesOpen('unit', %s)" % json.dumps(UNIT))
    pg.wait_for_timeout(700)
    check("the mode is open", bool(pg.query_selector("#slideroot.on")))
    rows = pg.query_selector_all("#slidelist .slrow")
    eyes = pg.query_selector_all("#slidelist .slhide")
    check("every slide is a row", len(rows) > 10, len(rows))
    # A picture slide carries no anchor and is REMOVED, never hidden (§24).
    check("the office gets an eye on every generated slide",
          len(eyes) > 0 and len(eyes) == len(rows),
          "%d eyes / %d rows" % (len(eyes), len(rows)))

    print("3 · the scores do not move — §246's question, answered")
    before = counts(pg, UNIT)
    anchor = ev(pg, "() => { const e = document.querySelectorAll('#slidelist .slhide')[3];"
                    " return e ? e.dataset.slhide : null; }", None, None)
    check("a slide can be named", bool(anchor), anchor)
    check("the eye can be hovered and pressed", press(pg, 3))
    stored = ev(pg, "(k) => UNITS[k].hideSlides || null", UNIT, None)
    check("the press reached the stored graph", stored == [anchor], stored)
    after = counts(pg, UNIT)
    check("every headline number is byte-identical",
          before == after and before != THREW, "%s -> %s" % (before, after))

    print("4 · the projector skips it and the rail does not")
    d = deck(pg, UNIT)
    check("the hidden slide is gone from the deck", gone(d, anchor), d)
    check("and the deck is otherwise whole",
          isinstance(d, dict) and d.get("slides", 0) > 10, get(d, "slides"))
    check("the rail still shows it, marked",
          len(pg.query_selector_all("#slidelist .slrow.off")) >= 1)
    line = pg.inner_text("#slidelist .sl-hidden") if pg.query_selector("#slidelist .sl-hidden") else ""
    check("the rail says how many", "1 slide hidden" in line, line or "(no line)")
    # Outside `.sl-lab`, which is `-webkit-line-clamp:2` — a tag written inside
    # it is eaten on exactly the rows whose names are longest.
    check("the row says HIDDEN outside the clamped label",
          bool(pg.query_selector("#slidelist .slrow.off > .sl-off")))

    print("5 · a hidden table takes its continuations with it")
    # deckFitPass() clones a long table's slide and the clone carries its
    # parent's anchor (§236.3). The pass runs BEFORE the split, so no
    # continuation is ever made.
    split = ev(pg, """(k) => {
      const mk = (hide) => {
        const host = document.createElement('div');
        host.className = 'slmeasure';
        const box = document.createElement('div');
        box.className = 'deck';
        host.appendChild(box); document.body.appendChild(host);
        box.innerHTML = deckSlides(UNITS[k]);
        if (hide) deckHidePass(box, k);
        deckFitPass(box);
        const out = { n: box.querySelectorAll('.dslide').length,
                      a: [...box.querySelectorAll('.dslide[data-anchor]')]
                           .map(s => s.dataset.anchor) };
        host.remove();
        return out;
      };
      const was = UNITS[k].hideSlides;
      delete UNITS[k].hideSlides;
      const all = mk(false);
      UNITS[k].hideSlides = was;
      const cut = mk(true);
      return { all: all, cut: cut };
    }""", UNIT, THREW)
    a_n = get(get(split, "all") or {}, "n")
    c_n = get(get(split, "cut") or {}, "n")
    check("hiding one removes at least one slide from the split deck",
          bool(a_n) and bool(c_n) and c_n < a_n, "%s -> %s" % (a_n, c_n))
    check("and no part of it survives the split",
          isinstance(split, dict) and anchor not in split["cut"]["a"] and c_n > 10,
          c_n)

    print("6 · a picture anchored to a hidden slide still appears")
    ev(pg, """(a) => {
      REVIEW.slides = REVIEW.slides || {};
      REVIEW.slides[%s] = [{ id:'psTest', at:a, title:'Evidence', layout:1,
        pics:[{ src:'data:image/gif;base64,R0lGODlhAQABAAAAACH5BAEKAAEALAAAAAABAAEAAAICTAEAOw==',
                cap:'', z:1, x:50, y:50 }] }];
    }""" % json.dumps(UNIT), anchor)
    d2 = deck(pg, UNIT)
    check("the picture is in the deck", get(d2, "pics") == 1, get(d2, "pics"))
    check("with its anchor slide still gone", gone(d2, anchor))
    ev(pg, "() => { delete REVIEW.slides; }")

    print("7 · showing it again deletes the key")
    ev(pg, "() => slidesPaint()")
    pg.wait_for_timeout(300)
    try:
        pg.query_selector("#slidelist .slrow.off .slhide").click()
        pg.wait_for_timeout(320)
    except Exception:
        pass
    r = ev(pg, "(k) => ({ has: ('hideSlides' in UNITS[k]),"
               " line: !!document.querySelector('#slidelist .sl-hidden') })", UNIT, THREW)
    # §50.6: never hidden, and hidden-then-shown-again, are the same bytes.
    check("the emptied key is DELETED, not left empty", get(r, "has") is False, r)
    check("and the count line goes with it", get(r, "line") is False, r)

    print("8 · the list is sorted, so the order of two presses does not matter")
    two = ev(pg, """(k) => {
      const e = [...document.querySelectorAll('#slidelist .slhide')];
      if (e.length < 6) return null;
      const a = e[2].dataset.slhide, b = e[5].dataset.slhide;
      delete UNITS[k].hideSlides;
      slidesSetHidden(a, true); slidesSetHidden(b, true);
      const first = JSON.stringify(UNITS[k].hideSlides);
      delete UNITS[k].hideSlides;
      slidesSetHidden(b, true); slidesSetHidden(a, true);
      const second = JSON.stringify(UNITS[k].hideSlides);
      return { first: first, second: second };
    }""", UNIT, THREW)
    check("hiding A then B and B then A leave the same bytes",
          isinstance(two, dict) and two["first"] == two["second"] and two["first"], two)

    print("9 · Show all, and the last slide standing")
    ev(pg, "() => slidesPaint()")
    pg.wait_for_timeout(300)
    try:
        pg.query_selector("[data-slshowall]").click()
        pg.wait_for_timeout(320)
        pressed_all = True
    except Exception:
        pressed_all = False
    check("Show all is there and clears everything",
          pressed_all and ev(pg, "(k) => !('hideSlides' in UNITS[k])", UNIT, False) is True)

    last = ev(pg, """(k) => {
      /* Hide every generated slide but one, then ask the rail about the one
         left: a review with no slides in it cannot be presented. */
      const box = document.createElement('div');
      box.innerHTML = deckSlides(UNITS[k]);
      const all = [...new Set([...box.querySelectorAll('.dslide[data-anchor]')]
                    .map(s => s.dataset.anchor))];
      UNITS[k].hideSlides = all.slice(1).sort();
      slidesPaint();
      const live = [...document.querySelectorAll('#slidelist .slrow')]
        .filter(r => !r.classList.contains('off'));
      const eye = live[0] && live[0].querySelector('.slhide');
      return { left: live.length, refused: eye ? eye.getAttribute('aria-disabled') : null };
    }""", UNIT, THREW)
    check("one slide is left showing", get(last, "left") == 1, get(last, "left"))
    # §221: `aria-disabled`, never `disabled` — a disabled button takes no
    # focus, so the sentence explaining the refusal could not be reached.
    check("its eye refuses, and says so rather than being dead",
          get(last, "refused") == "true", get(last, "refused"))
    # Pressed programmatically ON PURPOSE: Playwright treats `aria-disabled` as
    # disabled and would decline, and the refusal path is what is under test
    # (§222's lesson).
    kept = ev(pg, """(k) => {
      const live = [...document.querySelectorAll('#slidelist .slrow')]
        .filter(r => !r.classList.contains('off'));
      const n = SMPRules.hiddenSlides(UNITS[k]).length;
      live[0].querySelector('.slhide').click();
      return { was: n, now: SMPRules.hiddenSlides(UNITS[k]).length };
    }""", UNIT, THREW)
    pg.wait_for_timeout(250)
    check("and pressing it changes nothing",
          isinstance(kept, dict) and kept["was"] == kept["now"] and kept["was"] > 0, kept)
    err = pg.inner_text("#slidepane .picerr") if pg.query_selector("#slidepane .picerr") else ""
    check("the refusal is said on the page, not swallowed", "hidden" in err.lower(),
          err or "(nothing)")
    ev(pg, "(k) => { delete UNITS[k].hideSlides; slidesPaint(); }", UNIT)
    pg.wait_for_timeout(250)

    print("10 · the custodian sees the state and gets no control — both ends")
    ev(pg, "(k) => { UNITS[k].hideSlides = ['swot']; slidesPaint(); }", UNIT)
    pg.wait_for_timeout(300)
    office = {"eyes": len(pg.query_selector_all("#slidelist .slhide")),
              "showall": len(pg.query_selector_all("[data-slshowall]")),
              "marked": len(pg.query_selector_all("#slidelist .slrow.off"))}
    cust = ev(pg, """(k) => {
      const who = (UNIT_ROLES[k] || {}).custodian;
      if (!who) return null;
      switchViewer(who);
      return who;
    }""", UNIT, None)
    check("the seed holds a custodian to switch to", bool(cust), cust)
    if cust:
        ev(pg, "slidesOpen('unit', %s)" % json.dumps(UNIT))
        pg.wait_for_timeout(700)
        theirs = {"eyes": len(pg.query_selector_all("#slidelist .slhide")),
                  "showall": len(pg.query_selector_all("[data-slshowall]")),
                  "marked": len(pg.query_selector_all("#slidelist .slrow.off"))}
        check("the office has eyes and Show all",
              office["eyes"] > 0 and office["showall"] == 1, office)
        check("the custodian has neither",
              theirs["eyes"] == 0 and theirs["showall"] == 0, theirs)
        # Seeing the state is not the same act as setting it.
        check("and still sees what is hidden",
              theirs["marked"] == office["marked"] and office["marked"] > 0,
              "%s / %s" % (theirs["marked"], office["marked"]))
        ev(pg, "() => switchViewer('smo')")
        pg.wait_for_timeout(500)
    ev(pg, "(k) => { delete UNITS[k].hideSlides; }", UNIT)

    print("11 · a supporting function, on both formats")
    for fmt in ("pillars", "projects"):
        # THE PRODUCT'S OWN TEST, not a literal: `format` is ABSENT on a
        # capability function in the seed (7 of 8) and §59 asks
        # `String(f.format) === "pillars"` — so a filter looking for the string
        # "projects" finds nothing and reports a working build as untestable,
        # which is what the first run of this file did.
        fk = ev(pg, """(f) => {
          const want = (x) => (String(FUNCTIONS[x].format) === 'pillars') === (f === 'pillars');
          const k = Object.keys(FUNCTIONS).filter(want)[0];
          if (!k) return null;
          delete FUNCTIONS[k].hideSlides;
          return k;
        }""", fmt, None)
        check("a %s function exists to test with" % fmt, bool(fk), fk)
        if not fk:
            continue
        # THE STATE IS MADE, because the demo cannot supply it (§94.2): the
        # tenant's only pillars function has an empty plan, so its deck is a
        # cover and a Thank you and there is nothing in between to hide. A
        # pillar is lent to it from a unit, which is what a real one carries.
        if fmt == "pillars":
            check("the pillars function is given a plan to present",
                  ev(pg, """(a) => {
                    const f = FUNCTIONS[a.k];
                    f.items = JSON.parse(JSON.stringify(UNITS[a.u].items.slice(0, 1)));
                    f.keyObjectives = JSON.parse(JSON.stringify(UNITS[a.u].keyObjectives));
                    const box = document.createElement('div');
                    box.innerHTML = deckHtmlFor('fn:' + a.k);
                    return box.querySelectorAll('.dslide').length;
                  }""", {"k": fk, "u": UNIT}, 0) > 4)
        # §253.2: THE EDITOR AND THE PROJECTOR ASSEMBLE THE SAME DECK. This
        # branched on the `fn:` prefix in one file and on the FORMAT in
        # another, so a pillars function's Manage slides showed 2 slides where
        # its projector showed 15 — asserted as their agreement, never as a
        # number, so a deliberate change to the deck keeps it green (§94.8).
        same = ev(pg, """(k) => {
          const n = (html) => { const d = document.createElement('div');
                                d.innerHTML = html;
                                return d.querySelectorAll('.dslide').length; };
          return { editor: n(deckHtmlFor('fn:' + k)),
                   /* what the Present button reaches, by its own rule */
                   projector: n(deckCapShaped('fn:' + k) ? deckSlidesFn(k)
                                                         : deckSlides(unitLike('fn:' + k))) };
        }""", fk, THREW)
        check("the %s function's editor and projector build one deck" % fmt,
              isinstance(same, dict) and same["editor"] == same["projector"]
              and same["editor"] > 1, same)
        # MEASURED BOTH WAYS rather than against a floor: exactly one slide
        # fewer, and the named one is the one that went. A floor would have to
        # guess how long a function's deck is, and it guessed wrong first time.
        n = ev(pg, """(k) => {
          const build = (hide) => {
            const box = document.createElement('div');
            box.className = 'deck';
            box.innerHTML = deckHtmlFor('fn:' + k);
            if (hide) deckHidePass(box, 'fn:' + k);
            return [...box.querySelectorAll('.dslide[data-anchor]')]
                     .map(s => s.dataset.anchor);
          };
          const all = build(false);
          /* Never the cover and never the last: a middle slide is what an
             office actually prunes, and it proves the pass does not simply
             truncate the deck at one end. */
          const pick = all[Math.floor(all.length / 2)];
          FUNCTIONS[k].hideSlides = [pick];
          const left = build(true);
          return { anchor: pick, all: all.length, left: left.length,
                   gone: left.indexOf(pick) < 0,
                   subject: deckSubject('fn:' + k) === FUNCTIONS[k] };
        }""", fk, THREW)
        check("a %s function's slide is hidden from its deck" % fmt,
              get(n, "gone") is True and get(n, "all") and
              get(n, "left") == get(n, "all") - 1, n)
        # deckSubject() must reach the STORED function, never fnAsUnit()'s
        # reading view — a view's copy would take the write nowhere (§61).
        check("and the subject is the stored function, not a reading view (%s)" % fmt,
              get(n, "subject") is True, get(n, "subject"))
        ev(pg, "(k) => { delete FUNCTIONS[k].hideSlides; }", fk)

    check("no page errors", not errs, errs)
    b.close()

print("\n%d passed, %d failed" % (ok, bad))
sys.exit(1 if bad else 0)
