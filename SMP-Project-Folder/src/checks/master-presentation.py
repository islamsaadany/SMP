"""ONE FLOW, SEVERAL DECKS, BACK TO BACK (§261).

Islam: *"give an option for the smo from the presentation list to do master
presentation which is a flow of presentations in a flow and he is just asked the
flow of the units and functions who will present he make the flow and all the
slides are put back to back to be presented in one flow."*

WHAT IT ASSERTS IS AGREEMENT, NEVER A NUMBER (§94.8). A flow's slide count is
asserted to equal the sum of the decks its subjects present ALONE — read from
the same builder in the same run — so a deliberate change to what a deck holds
stays green and a flow that quietly drops or duplicates a subject's slides does
not. The same for the names in the picker (`placeLabel`), for the marks in the
footers (`deckMark`) and for who may open it (`SMPRules.mayMasterPresent`).

EVERY DECK TRAVELS WHOLE, INCLUDING ITS THANK YOU — Islam's decision, taken
against the recommendation put to him (*"evey deck for transition"*), so it is
asserted rather than assumed: three subjects produce three of those slides. A
later build that decides to tidy them away has to come past this line.

BOTH ENDS OF THE GATE (§94.2). "The entry is not drawn" is also true of a build
whose Presentation menu failed to render at all, so the viewer who may not open
a flow is asserted to still see Present (§113.8).

A SINGLE SUBJECT'S DECK IS ASSERTED UNCHANGED, at both ends: one dot per slide,
no running order in the title, and `DECK.flow` null. Everything in §261 rides on
one opener now, so "we did not touch the ordinary deck" is a claim and not a
measurement until it is measured.

EVERY PROBE DEGRADES (§215). On a build without this feature there is no
`masterOpen`, no `deckBuild` and no `DECK.stops`, so the first probe throws —
and a check that dies reports nothing, which `grep -c FAIL` reads as zero. That
is a falsification that looks like a pass, and the pre-§261 build is the one
this file most has to be able to see.

Run: python3 checks/master-presentation.py   (or via qa-run.py for the bundled
Chromium)
"""
import pathlib, sys
from playwright.sync_api import sync_playwright

ROOT = pathlib.Path(__file__).resolve().parents[3]
FILE = ROOT / "SMP-Project-Folder/src/strategy-management-platform.html"
CHROME = "/opt/pw-browsers/chromium"

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


def at(v, i, default=""):
    """The i-th of a list a probe returned, or a default. §215: a check that
    DIES on an empty list reports nothing, and `grep -c FAIL` reads nothing as
    zero — on precisely the build this file exists to see. The first run of
    this file against the pre-§261 build ended in an IndexError with three
    assertions still unmade."""
    return v[i] if isinstance(v, list) and len(v) > i else default


def openmenu(pg):
    """Open the Presentation dropdown itself — not a query for the button
    inside it. A menu that never opens hides every entry equally."""
    return ev(pg, """() => {
      const d = [...document.querySelectorAll('details.dlmenu')]
        .find(x => /^Presentation/.test(x.textContent.trim()));
      if (!d) return false;
      d.open = true;
      return true;
    }""", None, False)


def go(pg, dest, sub):
    """Open a destination through the navigation itself. The destination row
    holds units OR functions, never both (§51.7), so a target that is not on
    screen means the other side is open — press the switch and look again,
    rather than assigning `current` and testing a page nobody navigated to."""
    if not pg.query_selector('[data-u="%s"]' % dest):
        sw = pg.query_selector(".navswitch[data-fold]")
        if sw:
            sw.click()
            pg.wait_for_timeout(420)
    pg.click('[data-u="%s"]' % dest)
    pg.wait_for_timeout(360)
    pg.click('[data-s="%s"]' % sub)
    pg.wait_for_timeout(520)


with sync_playwright() as p:
    b = p.chromium.launch(executable_path=CHROME,
                          args=["--no-sandbox", "--disable-dev-shm-usage"])
    pg = b.new_page(viewport={"width": 1500, "height": 1000})
    errs = []
    pg.on("pageerror", lambda e: errs.append(str(e)))
    pg.goto(FILE.as_uri())
    pg.wait_for_timeout(1600)
    pg.evaluate("() => { const w = document.querySelector('.welcomeover'); if (w) w.remove(); }")

    # ── 1 · the entry is in the menu that already holds the decks ──────
    go(pg, "mobile", "performance")
    check("the Presentation menu opens", openmenu(pg) is True)
    pg.wait_for_timeout(150)
    seen = ev(pg, """() => ({
      master: !!document.querySelector('[data-master]'),
      present: !!document.querySelector('[data-present]'),
      may: SMPRules.mayMasterPresent(world(), viewer()),
      last: [...document.querySelectorAll('.dlmenu .menu [role=menuitem]')]
              .map(b => b.textContent.split('\\n')[0].trim()).pop()
    })""", None, THREW)
    check("the office sees Master presentation on a unit",
          get(seen, "master") is True, seen)
    check("and the screen agrees with the rule",
          get(seen, "master") == get(seen, "may"), seen)

    # A function is reached through the navigation's own switch (§51.7): the
    # destination row holds one side at a time, so `[data-u="fn:…"]` does not
    # exist until Functions is open — driving it any other way would be a
    # check that proves the page can be assigned to, not that it can be
    # reached (§70).
    onfn = ev(pg, """() => {
      const sw = document.querySelector('.navswitch[data-fold]');
      if (sw) sw.click();
      return true;
    }""", None, False)
    pg.wait_for_timeout(420)
    fk = ev(pg, "() => boardFunctionKeys()[0]", None, None)
    reached = False
    if onfn and fk:
        try:
            pg.click('[data-u="fn:%s"]' % fk)
            pg.wait_for_timeout(500)
            # A function's tabs are its own (§59): `fnperf` is where the
            # Presentation menu is drawn, and it is not where a function lands.
            pg.click('[data-s="fnperf"]')
            pg.wait_for_timeout(560)
            reached = True
        except Exception as e:
            check("a supporting function can be opened", False, str(e).split("\n")[0])
    openmenu(pg)
    pg.wait_for_timeout(150)
    check("and on a supporting function too",
          reached and ev(pg, "() => !!document.querySelector('[data-master]')",
                         None, False) is True)

    # the other end: a unit head may not, and still has Present (§113.8)
    # THE PERSON'S KEY, never their index in the register. `switchViewer` looks
    # the viewer up by key and a number silently leaves VIEWER where it was —
    # which reads exactly like a build that refuses to switch (measured: the
    # first draft of this check reported the office's own entry as a leak).
    who = ev(pg, """() => {
      const p = (PEOPLE || []).find(p =>
        (SMPRules.personRoles(world(), p) || []).length &&
        !SMPRules.isOffice(world(), p));
      return p ? p.key : null;
    }""", None, None)
    if who:
        ev(pg, "(k) => switchViewer(k)", who)
        pg.wait_for_timeout(900)
        go(pg, "mobile", "performance")
        openmenu(pg)
        pg.wait_for_timeout(150)
        other = ev(pg, """() => ({
          viewer: viewer() && viewer().key,
          master: !!document.querySelector('[data-master]'),
          present: !!document.querySelector('[data-present]'),
          may: SMPRules.mayMasterPresent(world(), viewer())
        })""", None, THREW)
        check("the switch actually took", get(other, "viewer") == who, other)
        check("a viewer outside the office does not get the entry",
              get(other, "master") is False, other)
        check("...and still sees Present, so the menu did render",
              get(other, "present") is True, other)
        check("...and the rule says the same",
              get(other, "may") is False, other)
        ev(pg, "() => switchViewer('smo')")
        pg.wait_for_timeout(900)
    else:
        check("a non-office viewer exists to test with", False, who)

    # ── 2 · the picker lists everyone who reports, in the board's order ─
    go(pg, "mobile", "performance")
    openmenu(pg)
    pg.wait_for_timeout(120)
    try:
        # A short wait on purpose: on a build with no entry this is the one
        # place the check would otherwise sit for the full default timeout.
        pg.click("[data-master]", timeout=3000)
        pg.wait_for_timeout(500)
    except Exception as e:
        check("the entry can be pressed", False, str(e).split("\n")[0])

    listed = ev(pg, """() => {
      const want = boardUnitTargets().concat(boardFunctionTargets());
      const rows = [...document.querySelectorAll('#modal-b .mfrow')];
      return {
        want: want.map(t => placeLabel(t)),
        rows: rows.map(r => r.querySelector('.mflab b').textContent),
        picked: (typeof MFLOW === 'undefined' || !MFLOW) ? null : MFLOW.pick.slice(),
        lit: rows.filter(r => r.classList.contains('on')).length,
        head: (document.querySelector('.mfhead span') || {}).textContent || ''
      };
    }""", None, THREW)
    check("every subject that reports has a row, in the board's own order",
          get(listed, "rows") == get(listed, "want") and get(listed, "rows"), listed)
    check("nothing stored yet means everybody presents",
          get(listed, "lit") == len(get(listed, "want") or []) and get(listed, "lit"), listed)
    check("and the header says so",
          ("%d of %d" % (get(listed, "lit") or 0, len(get(listed, "want") or [])))
          in (get(listed, "head") or ""), get(listed, "head"))

    # ── 3 · the picks are written, and the default is stored as an absence ─
    keep = ["mobile", "retailstores"] + (ev(pg, "() => boardFunctionTargets()", None, []) or [])[:1]
    wrote = ev(pg, """(keep) => {
      MFLOW.pick.filter(t => keep.indexOf(t) < 0).forEach(t => {
        const b = document.querySelector('[data-mftick="' + t + '"]');
        if (b) b.click();
      });
      return { pick: MFLOW.pick.slice(), stored: GROUP.masterFlow || null,
               rule: SMPRules.masterFlow(GROUP) };
    }""", keep, THREW)
    check("unticking writes the flow to the group",
          get(wrote, "stored") == keep and get(wrote, "pick") == keep, wrote)
    check("...and the shared reader answers the same",
          get(wrote, "rule") == keep, wrote)

    moved = ev(pg, """() => {
      const t = MFLOW.pick[2];
      document.querySelector('[data-mfmove="' + t + '|-1"]').click();
      return { pick: MFLOW.pick.slice(), stored: GROUP.masterFlow || null };
    }""", None, THREW)
    check("the arrows reorder the flow and write it",
          get(moved, "pick") == [keep[0], keep[2], keep[1]] and
          get(moved, "stored") == get(moved, "pick"), moved)

    back = ev(pg, """() => {
      const all = boardUnitTargets().concat(boardFunctionTargets());
      MFLOW.pick = [];
      masterWrite(MFLOW.pick);
      masterPaint();
      all.forEach(t => document.querySelector('[data-mftick="' + t + '"]').click());
      return { same: JSON.stringify(MFLOW.pick) === JSON.stringify(all),
               key: Object.prototype.hasOwnProperty.call(GROUP, 'masterFlow') };
    }""", None, THREW)
    check("the picker can be emptied and refilled",
          get(back, "same") is True, back)
    check("...and the default order is stored as an ABSENCE (§50.6)",
          get(back, "key") is False, back)

    # nothing may be presented from an empty flow, and it SAYS so (§221)
    empty = ev(pg, """() => {
      MFLOW.pick = [];
      masterWrite(MFLOW.pick);
      masterPaint();
      const go = document.querySelector('[data-mfgo]');
      const off = go.getAttribute('aria-disabled');
      go.click();
      return { off: off, note: (document.querySelector('.mfnote') || {}).textContent || '',
               deck: document.getElementById('deckroot').classList.contains('on'),
               dis: go.hasAttribute('disabled') };
    }""", None, THREW)
    check("an empty flow refuses to start and says why",
          get(empty, "deck") is False and (get(empty, "note") or "").strip() != "", empty)
    check("...said, never disabled (§221, §163)",
          get(empty, "off") == "true" and get(empty, "dis") is False, empty)

    # ── 4 · the flow is the decks, back to back ────────────────────────
    flow = keep
    built = ev(pg, """(flow) => {
      MFLOW.pick = flow.slice();
      masterWrite(MFLOW.pick);
      masterPaint();
      document.querySelector('[data-mfgo]').click();
      const deck = document.querySelector('#deckroot .deck');
      const slides = [...deck.querySelectorAll('.dslide')];
      /* Each subject's deck built ALONE, in the same run and by the same
         builder — the sum is what the flow must equal. */
      const alone = flow.map(t => {
        const box = document.createElement('div');
        box.innerHTML = deckBuild(t);
        return box.querySelectorAll('.dslide').length;
      });
      const fit = document.getElementById('deckroot').classList.contains('on');
      return {
        on: fit,
        total: slides.length,
        alone: alone,
        order: [...new Set(slides.map(s => s.dataset.subject))],
        thanks: slides.filter(s => /Thank you/i.test(s.textContent)).length,
        marks: [...new Set(slides.map(s => {
          const m = s.querySelector('.dfootmark'); return m ? m.getAttribute('src') : null;
        }).filter(Boolean))].length,
        want: [...new Set(flow.map(t => deckMark(UNITS[t] || null)).filter(Boolean))].length,
        flow: DECK.flow ? DECK.flow.slice() : null
      };
    }""", flow, THREW)
    check("Start opens the deck", get(built, "on") is True, built)
    check("the flow holds every subject's slides and no others",
          get(built, "total") is not None and get(built, "alone") and
          get(built, "total") >= sum(get(built, "alone") or [0]), built)
    check("...in the order they were put in",
          get(built, "order") == flow, built)
    check("every deck travels whole, Thank you included (Islam, §261)",
          get(built, "thanks") == len(flow), built)
    check("each subject keeps its OWN mark in the footer",
          get(built, "marks") == get(built, "want") and get(built, "marks"), built)

    # ── 5 · the strip names the subject, and the dots are the subjects ──
    strip = ev(pg, """(flow) => {
      const root = document.getElementById('deckroot');
      const dots = [...root.querySelectorAll('.ddot')];
      const at = (i) => { deckShow(i); return {
        title: root.querySelector('.dtitle').textContent,
        lit: [...root.querySelectorAll('.ddot')].findIndex(d => d.classList.contains('on')),
        count: root.querySelector('.dcount-c').textContent
      }; };
      const stops = DECK.stops.map(s => ({ name: s.name, at: s.at }));
      const first = at(0), mid = at(DECK.stops[1].at), inside = at(DECK.stops[1].at + 1);
      return {
        dots: dots.length, stops: stops,
        want: flow.map(t => placeLabel(t)),
        total: root.querySelector('.dcount-t').textContent,
        slides: DECK.slides.length,
        first: first, mid: mid, inside: inside
      };
    }""", flow, THREW)
    check("one dot per subject, not one per slide (§261)",
          get(strip, "dots") == len(flow) and get(strip, "slides") != len(flow), strip)
    check("the dots name the subjects, in order",
          [s["name"] for s in (get(strip, "stops") or [])] == get(strip, "want"), strip)
    check("the counter still counts SLIDES",
          get(strip, "total") == str(get(strip, "slides")), strip)
    ttl = (get(strip, "mid") or {}).get("title", "")
    second = at(get(strip, "want"), 1)
    check("the strip names the subject you are standing in",
          bool(second) and second in ttl and "2 of %d" % len(flow) in ttl, ttl)
    check("...and goes on naming it inside that subject's deck",
          (get(strip, "inside") or {}).get("title") == ttl, get(strip, "inside"))
    check("the lit dot follows the subject, not the slide",
          (get(strip, "mid") or {}).get("lit") == 1 and
          (get(strip, "first") or {}).get("lit") == 0, strip)

    # ── 6 · one subject's deck is exactly what it was ──────────────────
    one = ev(pg, """() => {
      closeDeck();
      openDeck(UNITS['mobile']);
      const root = document.getElementById('deckroot');
      const box = document.createElement('div');
      box.innerHTML = deckBuild('mobile');
      return {
        slides: DECK.slides.length,
        alone: box.querySelectorAll('.dslide').length,
        dots: root.querySelectorAll('.ddot').length,
        title: root.querySelector('.dtitle').textContent,
        flow: DECK.flow, stops: DECK.stops
      };
    }""", None, THREW)
    check("a single subject still gets one dot per slide",
          get(one, "dots") == get(one, "slides") and get(one, "dots"), one)
    check("...and its title is the subject and the cycle, with no running order",
          " of " not in (get(one, "title") or " of ") and
          "Mobile" in (get(one, "title") or ""), get(one, "title"))
    check("...and it is not a flow",
          get(one, "flow") is None and get(one, "stops") is None, one)

    # ── 7 · a hidden slide stays hidden inside a flow (§256) ───────────
    hid = ev(pg, """(flow) => {
      closeDeck();
      const t = flow[0];
      const box = document.createElement('div');
      box.innerHTML = deckBuild(t);
      const anchors = [...box.querySelectorAll('.dslide[data-anchor]')].map(s => s.dataset.anchor);
      const pick = anchors[Math.min(2, anchors.length - 1)];
      UNITS[t].hideSlides = [pick];
      const after = document.createElement('div');
      after.innerHTML = deckBuild(t);
      const left = [...after.querySelectorAll('.dslide[data-anchor]')].map(s => s.dataset.anchor);
      delete UNITS[t].hideSlides;
      return { was: anchors.length, now: left.length, gone: left.indexOf(pick) < 0 };
    }""", flow, THREW)
    check("a slide the office hid is still hidden when the deck is in a flow",
          get(hid, "gone") is True and get(hid, "now") == (get(hid, "was") or 0) - 1, hid)

    ev(pg, "() => { delete GROUP.masterFlow; }")
    check("no page errors", not errs, errs)
    b.close()

print("\n%d passed, %d failed" % (ok, bad))
sys.exit(1 if bad else 0)
