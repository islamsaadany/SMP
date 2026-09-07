"""ONE DECK'S STRIP IS LABELLED, AND ITS PILLS ARE GROUPED (§266.12).

Islam, of the flow's own strip: *"for the presentations in general of the units
not the master how can we use the bullets in the bottom like we did in the master
one?"* — and of the four treatments drawn for him, *"B is good but we can make
them grouped like C as well."*

WHAT IS ASSERTED, AND WHY IT IS ASSERTED THAT WAY:

· AGREEMENT, NEVER A LIST OF LITERALS (§94.8). The pills are asserted to equal
  the codes the product itself computes — `pillarCode()` for a pillar, the
  capability's own name for a capability — read in the same run. A tenant with
  different pillars stays green; a strip that says the wrong thing about a
  section does not.

· THE GROUPS ARE THE DECK'S OWN. Asserted against the slides carrying
  `data-sec-head`, which are the four blue dividers (§259) — never against the
  number 5, which is Mobile's and nobody else's.

· THE LIT PILL IS WALKED ACROSS THE WHOLE DECK, slide by slide, and asserted to
  be the section that slide belongs to. A build that lit the first pill always
  passes every "there is a lit pill" assertion.

· THE FLOW IS ASSERTED UNCHANGED at both ends (§94.2, §113.8): everything here
  rides one strip now, so "we did not touch the master presentation" is a claim
  and not a measurement until the flow is measured — its pills are subjects, it
  has no groups, and its title still names the subject you are standing in.

· AND A SINGLE DECK'S TITLE IS NOT REWRITTEN. `DECK.stops` is set for both kinds
  now, and the line that renames the bar had been reading it: without the flow
  test a unit's deck would call itself "Foundation · 2 of 10" and lose the unit.

· IT FITS (§158: fit, never "and it scrolls") — one row and nothing past the
  edge at 1920, 1400, 1280 and 1024, measured as boxes rather than as
  `scrollWidth`, which lies on a flex row carrying margins (§105.2).

EVERY PROBE DEGRADES (§215). On the build before this there is no `deckSections`
and no `data-sec`, so an undegraded probe throws and reports nothing — which
`grep -c FAIL` reads as a pass, on precisely the build this file exists to see.

Run: python3 checks/deck-strip.py   (or via qa-run.py for the bundled Chromium)
"""
import pathlib
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


def head(t):
    print("\n" + t)


_said = set()


def ev(pg, expr, arg=None, default=None):
    try:
        return pg.evaluate(expr) if arg is None else pg.evaluate(expr, arg)
    except Exception as e:
        msg = str(e).split("\n")[0]
        if msg not in _said:
            _said.add(msg)
            print("  (threw: %s)" % msg)
        return default


def get(d, k):
    return d.get(k) if isinstance(d, dict) else None


def _rgb(v):
    return [float(x) for x in str(v)[str(v).index("(") + 1:str(v).index(")")].split(",")[:3]]


def _lum(c):
    def f(v):
        v = v / 255.0
        return v / 12.92 if v <= 0.03928 else ((v + 0.055) / 1.055) ** 2.4
    return 0.2126 * f(c[0]) + 0.7152 * f(c[1]) + 0.0722 * f(c[2])


def ratio(fg, bg):
    try:
        a, b = _lum(_rgb(fg)), _lum(_rgb(bg))
    except Exception:
        return 0
    hi, lo = max(a, b), min(a, b)
    return round((hi + 0.05) / (lo + 0.05), 2)


STRIP = """() => {
  const d = document.querySelector('#deckroot .ddots');
  if (!d) return { __err: 'no strip' };
  const dr = d.getBoundingClientRect();
  const kids = [...d.children];
  const pills = [...d.querySelectorAll('.ddot')];
  return {
    cls: d.className,
    groups: d.querySelectorAll('.dgrp').length,
    pills: pills.map(b => b.textContent),
    hovers: pills.map(b => b.title),
    labels: pills.map(b => b.getAttribute('aria-label')),
    lit: pills.findIndex(b => b.classList.contains('on')),
    stops: (typeof DECK !== 'undefined' && DECK.stops) ? DECK.stops.map(s => s.at) : null,
    flow: (typeof DECK !== 'undefined') ? !!DECK.flow : null,
    w: Math.round(dr.width),
    rows: new Set(kids.map(k => Math.round(k.getBoundingClientRect().top))).size,
    past: kids.filter(k => k.getBoundingClientRect().right > dr.right + 1).length,
    title: document.querySelector('#deckroot .dtitle').textContent.trim(),
    slides: (typeof DECK !== 'undefined' && DECK.slides) ? DECK.slides.length : null,
    heads: document.querySelectorAll('#deckroot .dslide[data-sec-head]').length,
    secs: document.querySelectorAll('#deckroot .dslide[data-sec]').length
  };
}"""


def open_deck(pg, t):
    ev(pg, "(t) => { if (typeof closeDeck === 'function') closeDeck(); }")
    pg.wait_for_timeout(120)
    ev(pg, "(t) => openDeckWith('<b>' + placeLabel(t) + '</b>', [t])", t)
    pg.wait_for_timeout(450)
    return ev(pg, STRIP, None, {})


with sync_playwright() as p:
    b = p.chromium.launch(executable_path=CHROME,
                          args=["--no-sandbox", "--disable-dev-shm-usage"])
    pg = b.new_page(viewport={"width": 1500, "height": 950})
    errs = []
    pg.on("pageerror", lambda e: errs.append(str(e)))
    pg.add_init_script("try{sessionStorage.setItem('smp.welcome.seen','1');"
                       "localStorage.setItem('smp.tour.never','1')}catch(e){}")
    pg.goto(FILE.as_uri())
    pg.wait_for_timeout(1500)

    # ══ 1 · A UNIT'S DECK ══════════════════════════════════════════════
    head("1 · A unit's deck — pills, and the codes are the product's own")
    u = open_deck(pg, "mobile")
    check("the strip is drawn", get(u, "pills") not in (None, []), u)
    check("it is pills, not one dot per slide",
          len(get(u, "pills") or []) < (get(u, "slides") or 0) and
          "bysub" in str(get(u, "cls")), u)
    check("...and they are grouped (§266.12)",
          "bygrp" in str(get(u, "cls")) and (get(u, "groups") or 0) > 1, u)
    want = ev(pg, """() => {
      const u = UNITS['mobile'];
      return { codes: u.items.map((p, i) => pillarCode(u, i)),
               names: u.items.map(p => p.name), name: u.name };
    }""", None, {})
    check("every pillar has a pill, and it is the code the product computes",
          all(c in (get(u, "pills") or []) for c in (get(want, "codes") or [])) and
          get(want, "codes"), {"want": get(want, "codes"), "got": get(u, "pills")})
    check("...and its hover is the pillar's own name",
          all(n in (get(u, "hovers") or []) for n in (get(want, "names") or [])),
          {"want": get(want, "names"), "got": get(u, "hovers")})
    check("the deck's four dividers are the groups (§259)",
          get(u, "groups") == get(u, "heads") and get(u, "heads"),
          {"groups": get(u, "groups"), "heads": get(u, "heads")})
    check("every pill says what it is, for a reader who cannot see it",
          all(bool(x) for x in (get(u, "labels") or [])) and get(u, "labels"), u)
    check("the title still names the unit, and nothing else",
          get(u, "title") == get(want, "name"), get(u, "title"))

    # ══ 2 · THE LIT PILL, WALKED ═══════════════════════════════════════
    head("2 · The lit pill is the section the slide belongs to, all the way down")
    walk = ev(pg, """() => {
      const at = DECK.stops.map(s => s.at);
      const out = [];
      for (let i = 0; i < DECK.slides.length; i++) {
        deckShow(i);
        let want = -1;
        at.forEach((a, j) => { if (a <= i) want = j; });
        const lit = [...document.querySelectorAll('#deckroot .ddot')]
          .findIndex(b => b.classList.contains('on'));
        out.push([i, want, lit]);
      }
      return { rows: out, bad: out.filter(r => r[1] !== r[2]) };
    }""", None, {})
    check("every slide lights its own section's pill",
          get(walk, "bad") == [] and len(get(walk, "rows") or []) > 20,
          {"wrong": (get(walk, "bad") or [])[:6],
           "of": len(get(walk, "rows") or [])})
    check("...and more than one pill is lit across the deck (§113.8)",
          len(set(r[2] for r in (get(walk, "rows") or []))) > 3,
          sorted(set(r[2] for r in (get(walk, "rows") or []))))

    # ══ 3 · PRESSING ONE MOVES THE DECK ════════════════════════════════
    head("3 · A pill is a control, not a picture (§70)")
    press = ev(pg, """() => {
      deckShow(0);
      const pills = [...document.querySelectorAll('#deckroot .ddot')];
      const target = pills[pills.length - 2];
      const want = +target.dataset.dgo;
      target.click();
      return { want: want, got: DECK.i,
               lit: pills.findIndex(b => b.classList.contains('on')),
               of: pills.length };
    }""", None, {})
    check("pressing a pill moves the deck to that slide",
          get(press, "want") == get(press, "got") and get(press, "want"), press)
    check("...and the pill pressed is the one lit",
          get(press, "lit") == (get(press, "of") or 0) - 2, press)

    # ══ 4 · BOTH SUPPORTING-FUNCTION SHAPES (A15, §53.5) ═══════════════
    head("4 · A function gets the same strip, in both of its shapes")
    m = open_deck(pg, "fn:merchandising")
    fwant = ev(pg, """() => { const f = fnAsUnit('merchandising');
      return f.items.map((p, i) => pillarCode(f, i)); }""", None, [])
    check("a pillars function is drawn the unit's way",
          "bygrp" in str(get(m, "cls")) and
          all(c in (get(m, "pills") or []) for c in (fwant or [])) and fwant,
          {"want": fwant, "got": get(m, "pills")})
    check("...and its groups are its own dividers, of which it has fewer",
          get(m, "groups") == get(m, "heads") and
          (get(m, "groups") or 0) < (get(u, "groups") or 0), m)
    k = open_deck(pg, "fn:marketing")
    check("a capability function is drawn the same way",
          "bysub" in str(get(k, "cls")) and (get(k, "pills") or []), k)
    check("...a capability has no code, so it falls back to two letters (§266.9)",
          all(len(x) == 2 for x in (get(k, "pills") or [])
              if x not in ("COVER", "END")) and
          len(get(k, "pills") or []) >= 3, get(k, "pills"))
    check("...and the full name is on the hover",
          all(len(h) > 3 for h in (get(k, "hovers") or [])), get(k, "hovers"))

    # ══ 5 · THE FLOW IS UNTOUCHED (§94.2) ══════════════════════════════
    head("5 · The master flow's strip is exactly what it was (§266)")
    ev(pg, "() => { closeDeck(); }")
    pg.wait_for_timeout(150)
    ev(pg, """() => openDeckWith('<b>Master presentation</b>',
        boardUnitTargets().slice(0, 3))""")
    pg.wait_for_timeout(800)
    f = ev(pg, STRIP, None, {})
    check("a flow is still labelled by SUBJECT, not by section",
          get(f, "flow") is True and len(get(f, "pills") or []) == 3, f)
    check("...and it has no groups at all",
          get(f, "groups") == 0 and "bygrp" not in str(get(f, "cls")), f)
    check("...and its title still names the subject and the running order",
          "1 of 3" in str(get(f, "title")), get(f, "title"))
    # INTO THE SECOND SUBJECT, asked of the deck rather than guessed at: slide
    # 30 is still Mobile's on this tenant, so a fixed number reported a correct
    # build broken (§68.10).
    ev(pg, "() => { deckShow(DECK.stops[1].at + 1); }")
    pg.wait_for_timeout(150)
    f2 = ev(pg, STRIP, None, {})
    check("...and it still moves with the deck",
          get(f2, "lit") == 1 and get(f2, "title") != get(f, "title"), f2)
    ev(pg, "() => { closeDeck(); }")

    # ══ 6 · IT FITS ════════════════════════════════════════════════════
    head("6 · One row, nothing past the edge (§158)")
    for w in (1920, 1400, 1280, 1024):
        pg.set_viewport_size({"width": w, "height": 900})
        pg.wait_for_timeout(200)
        r = open_deck(pg, "mobile")
        check("%d · one row and nothing past it" % w,
              get(r, "rows") == 1 and get(r, "past") == 0, r)
    pg.set_viewport_size({"width": 1500, "height": 950})
    pg.wait_for_timeout(200)

    # ══ 7 · READABLE ON A PROJECTOR ════════════════════════════════════
    head("7 · The pills read, lit and unlit (§38.4)")
    open_deck(pg, "mobile")
    ink = ev(pg, """() => {
      const pills = [...document.querySelectorAll('#deckroot .ddot')];
      const on = pills.find(b => b.classList.contains('on')) || pills[0];
      const off = pills.find(b => !b.classList.contains('on'));
      const bar = getComputedStyle(document.querySelector('#deckroot .deckbar')).backgroundColor;
      const cs = (e) => [getComputedStyle(e).color, getComputedStyle(e).backgroundColor];
      return { on: cs(on), off: cs(off), bar: bar,
               sep: getComputedStyle(document.querySelector('#deckroot .dgrp')).borderRightColor };
    }""", None, {})
    lit = get(ink, "on") or ["", ""]
    unlit = get(ink, "off") or ["", ""]
    check("the lit pill's ink on its own gold reads",
          ratio(lit[0], lit[1]) >= 4.5, "%s %s" % (ratio(lit[0], lit[1]), lit))
    check("an unlit pill reads on the bar",
          ratio(unlit[0], get(ink, "bar")) >= 4.5,
          "%s %s on %s" % (ratio(unlit[0], get(ink, "bar")), unlit[0], get(ink, "bar")))
    check("the separator is a border, never a character",
          "rgba" in str(get(ink, "sep")) or "rgb" in str(get(ink, "sep")),
          get(ink, "sep"))
    check("...and no pill is a bar or a slash",
          not any(x.strip() in ("|", "/", "│") for x in (get(u, "pills") or [])),
          get(u, "pills"))

    ev(pg, "() => { closeDeck(); }")
    check("no page errors", not errs, errs)
    b.close()

print("\n%d passed, %d failed" % (ok, bad))
