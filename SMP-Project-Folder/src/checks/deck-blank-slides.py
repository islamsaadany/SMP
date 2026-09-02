"""A TABLE WITH NO ROWS IS NOT A SLIDE (§253).

Islam: *"slides are showing blank pages for the merchandizing."*

Measured on the demo before anything was changed: FOUR slides in the whole
product draw a heading, a navy column strip and then a whole empty page, and
all four are Merchandising — its own deck's two objectives slides (a
supporting function judged by its pillars legitimately carries none, §214.2),
and Retail's RS04, the pillar carried by that function, which by construction
holds no measures and no tactics of its own and printed 93% / 60% / 61%
across the top of a slide with nothing behind those numbers.

`deckSlidesFn` has guarded its own objectives slide since it was written,
which is why Marketing — whose two capabilities also carry no objectives —
has always been right. The unit deck, which a pillars function goes through
since §224, had no such guard. §53.5.

WHAT IS ASSERTED:

  1 · NO DECK IN THE PRODUCT DRAWS A TABLE WITH NO ROWS, swept over every
      unit and every active function, each through the builder its own
      Present button would call. This is the assertion the previous build
      fails, and it fails it four times.

  2 · THE STATE IS MADE, NEVER WAITED FOR (§94.2). A unit is stripped of its
      objectives and a pillar of its measures and tactics in memory, so the
      rule is proved on a business unit and not only on the one function the
      demo happens to ship empty.

  3 · A SUBJECT THAT HAS ROWS STILL GETS ITS SLIDES, asserted by name. A
      build that drew no tables at all would satisfy every absence above
      (§113.8), so the presence is asserted in the same breath.

  4 · A UNIT KEEPS ITS ASPIRATION WHEN ITS OBJECTIVES GO. The aim slide
      carries the aspiration and end-in-mind ABOVE its table; dropping the
      whole slide there would remove something nobody asked to remove. On a
      function that half is already absent (§243), so the slide goes.

  5 · THE HEADLINE SLIDE DROPS THE READING NOBODY TOOK. Islam: drop the
      objectives cell, *"and this applies to any function without key
      objectives like marekting as well."* Two cells, no `three` class — the
      shape the slide wore before §243 — and the footnote loses the clause
      that names the number that is no longer there, or the slide explains a
      reading it is not showing.

  6 · ONE ANSWER TO "WHICH DECK DOES THIS TARGET GET" (§253.3). Islam, on
      the live deployment: *"the manage presentation show this"* — the Manage
      slides editor open on a pillars function with its bar drawn and the rail
      and stage completely empty. §224 fixed the Present button to branch on
      the function's FORMAT rather than the `fn:` prefix and stopped there;
      `slidesAssemble()` and `deckAnchors()` were both still asking by prefix.
      Every surface is asked here, and the CAPABILITY deck is asserted
      unchanged in the same breath — a build that sent everything through the
      unit deck would satisfy every assertion about the function.

  7 · AND MERCHANDISING IS NOT CARRIED BY RETAIL ANY MORE (§253). Islam:
      *"drop the merchandizing connection with the retail stores."* The
      pointer is cut in the demo's data; the FEATURE is untouched, so
      `pillarCarrier` is asserted to still be there and still to answer.
"""
import os
from playwright.sync_api import sync_playwright

HERE = os.path.dirname(os.path.abspath(__file__))
FILE = os.path.join(os.path.dirname(HERE), "strategy-management-platform.html")
fails = []


def ok(label, cond, detail=""):
    if cond:
        print("  ok      " + label)
    else:
        fails.append(label)
        print("  FAIL    " + label + ("  — " + str(detail) if detail != "" else ""))


def js(pg, expr, arg=None):
    try:
        return pg.evaluate(expr, arg) if arg is not None else pg.evaluate(expr)
    except Exception as e:                        # noqa: BLE001
        return {"threw": str(e).strip().split("\n")[0]}


# Build a subject's deck the way its own Present button would (§224: the
# FORMAT decides the deck, never the `fn:` prefix), render it detached, and
# report every slide holding a table with no rows.
SWEEP = """() => {
  const bad = [], seen = [];
  const shapes = activeKeys().map(k => ({ t: k, fn: null }))
    .concat(Object.keys(FUNCTIONS).filter(k => fnShows(k)).map(k => ({
      t: "fn:" + k, fn: fnPlansInPillars(FUNCTIONS[k]) ? null : k })));
  shapes.forEach(s => {
    const html = s.fn ? deckSlidesFn(s.fn) : deckSlides(unitLike(s.t));
    const d = document.createElement("div");
    d.innerHTML = (typeof html === "string" ? html : (html || []).join(""));
    seen.push({ t: s.t, slides: d.querySelectorAll("section.dslide").length });
    [...d.querySelectorAll("section.dslide")].forEach((sl, i) => {
      const tb = sl.querySelector("tbody");
      if (tb && tb.rows.length === 0)
        bad.push({ t: s.t, i, head: (sl.querySelector("h2") || {}).textContent || "" });
    });
    d.remove();
  });
  return { bad, seen };
}"""

# Headings of one subject's deck, so presence and absence are asserted from
# the same list.
HEADS = """(t) => {
  const fk = t.indexOf("fn:") === 0 ? t.slice(3) : null;
  const html = (fk && !fnPlansInPillars(FUNCTIONS[fk]))
    ? deckSlidesFn(fk) : deckSlides(unitLike(t));
  const d = document.createElement("div");
  d.innerHTML = (typeof html === "string" ? html : (html || []).join(""));
  const out = [...d.querySelectorAll("section.dslide")].map(s =>
    ((s.querySelector("h2") || s.querySelector("h1") || {}).textContent || "").trim());
  d.remove();
  return out;
}"""

with sync_playwright() as p:
    b = p.chromium.launch(executable_path=os.environ.get("SMP_CHROME"))
    pg = b.new_page(viewport={"width": 1600, "height": 900})
    pg.add_init_script("try{sessionStorage.setItem('smp.welcome.seen','1');"
                       "sessionStorage.setItem('smp.welcome.done','1');"
                       "sessionStorage.setItem('smp.tour.later','1');}catch(e){}")
    errs = []
    pg.on("pageerror", lambda e: errs.append(str(e)))
    pg.goto("file://" + FILE)
    pg.wait_for_timeout(900)

    # The two shared readers this file leans on, asked for BY NAME before they
    # are used (§215): a build without them dies mid-sweep and reports zero
    # failures, which reads exactly like a pass.
    print("\n── the readers this check needs")
    have = js(pg, """() => ({
      shown: typeof SMPRules === "object" && typeof SMPRules.shown === "function",
      deckSlides: typeof deckSlides === "function",
      deckSlidesFn: typeof deckSlidesFn === "function",
      unitLike: typeof unitLike === "function",
      carrier: typeof pillarCarrier === "function"
    })""")
    for k in ("shown", "deckSlides", "deckSlidesFn", "unitLike", "carrier"):
        ok("the build carries " + k, have.get(k) is True, have)

    print("\n── 1 · no deck draws a table with no rows")
    sw = js(pg, SWEEP)
    ok("every deck builds", isinstance(sw, dict) and "bad" in sw, sw)
    if isinstance(sw, dict) and "bad" in sw:
        ok("no slide holds an empty table, anywhere", sw["bad"] == [], sw["bad"])
        ok("and every subject actually produced a deck",
           all(s["slides"] > 2 for s in sw["seen"]), sw["seen"])

    print("\n── 2 · the state is MADE, on a business unit")
    made = js(pg, """() => {
      const k = activeKeys()[0], u = UNITS[k];
      const ko = u.keyObjectives, p = u.items[0];
      const ms = p.measures, ts = p.tactics;
      const heads = () => { const d = document.createElement("div");
        d.innerHTML = deckSlides(unitLike(k));
        const r = { blank: 0, heads: [] };
        [...d.querySelectorAll("section.dslide")].forEach(s => {
          const tb = s.querySelector("tbody");
          if (tb && tb.rows.length === 0) r.blank++;
          r.heads.push(((s.querySelector("h2") || s.querySelector("h1") || {})
            .textContent || "").trim());
        });
        r.asp = /\\bAspiration|asp2/i.test(d.innerHTML) ||
                !!d.querySelector(".asp2");
        d.remove(); return r; };
      u.keyObjectives = []; p.measures = []; p.tactics = [];
      const stripped = heads();
      u.keyObjectives = ko; p.measures = ms; p.tactics = ts;
      const restored = heads();
      /* THE PILLAR IS NAMED, or the assertion is unfalsifiable: the other
         pillars keep their tables, so "no head says Key measures" is false on
         a correct build and "none in the first six" is TRUE on the broken one
         — it passed on the pre-§253 build, which is what §94.5 is for. */
      return { key: k, name: u.name, code: pillarCode(u, 0), stripped, restored };
    }""")
    if isinstance(made, dict) and "stripped" in made:
        s, r = made["stripped"], made["restored"]
        ok("a unit stripped bare draws no empty table", s["blank"] == 0, s)
        ok("its objectives slide is gone",
           not any("where we stand" in h for h in s["heads"]), s["heads"])
        code = made.get("code") or ""
        mine = [h for h in s["heads"] if h.startswith(code)]
        ok("and the stripped pillar's two tables with it (" + code + ")",
           code != "" and not any("Key measures" in h or "Tactics" in h
                                  for h in mine), mine)
        print("\n── 4 · and the aspiration it never asked to lose survives")
        ok("the aim slide is still drawn",
           any("aiming at" in h for h in s["heads"]), s["heads"])
        ok("carrying the unit's aspiration", s["asp"] is True, s)
        print("\n── 3 · put back, the slides come back (§113.8)")
        ok("the objectives slide returns",
           any("where we stand" in h for h in r["heads"]), r["heads"])
        back = [h for h in r["heads"] if h.startswith(code)]
        ok("the stripped pillar's measures and tactics return",
           any("Key measures" in h for h in back)
           and any("Tactics" in h for h in back), back)
        ok("and the deck is longer than the stripped one",
           len(r["heads"]) > len(s["heads"]), (len(r["heads"]), len(s["heads"])))
    else:
        ok("the unit fixture ran", False, made)

    print("\n── 5 · the headline slide, with and without objectives")
    head = js(pg, """() => {
      const read = (t) => {
        const fk = t.indexOf("fn:") === 0 ? t.slice(3) : null;
        const d = document.createElement("div");
        d.innerHTML = (fk && !fnPlansInPillars(FUNCTIONS[fk]))
          ? deckSlidesFn(fk) : deckSlides(unitLike(t));
        const s = [...d.querySelectorAll("section.dslide")]
          .filter(x => /stands$/.test(((x.querySelector("h2") || {})
            .textContent || "").trim()))[0];
        const out = s ? {
          cells: s.querySelectorAll(".headcell").length,
          three: !!s.querySelector(".headgrid.three"),
          labs: [...s.querySelectorAll(".dlab")].map(x => x.textContent.trim()),
          foot: (s.querySelector(".headfoot") || {}).textContent || ""
        } : null;
        d.remove(); return out;
      };
      const fk = Object.keys(FUNCTIONS).filter(k => fnShows(k)
        && fnPlansInPillars(FUNCTIONS[k])
        && !SMPRules.shown(unitLike("fn:" + k).keyObjectives).length)[0];
      return { none: fk ? read("fn:" + fk) : null, fk,
               some: read(activeKeys()[0]) };
    }""")
    if isinstance(head, dict) and head.get("some"):
        n, s = head.get("none"), head["some"]
        ok("a subject WITH objectives keeps three readings",
           s["cells"] == 3 and s["three"] is True, s)
        ok("and its footnote still opens on them",
           s["foot"].strip().startswith("Objectives measure"), s["foot"][:60])
        ok("a subject with none is found to measure", n is not None, head.get("fk"))
        if n:
            ok("it draws two readings, not three",
               n["cells"] == 2 and n["three"] is False, n)
            ok("and neither of them is the objectives cell",
               not any("bjectives" in x for x in n["labs"]), n["labs"])
            ok("the footnote drops the clause that names it",
               "Objectives measure" not in n["foot"], n["foot"][:80])
            ok("and still explains the two it shows",
               "landing on time" in n["foot"] and len(n["foot"]) > 40, n["foot"][:80])
    else:
        ok("the headline fixture ran", False, head)

    print("\n── 6 · one answer to which deck a target gets (§253.3)")
    decks = js(pg, """() => {
      const count = (html) => { const d = document.createElement("div");
        d.innerHTML = (typeof html === "string" ? html : (html || []).join(""));
        const n = d.querySelectorAll("section.dslide").length; d.remove(); return n; };
      const pf = Object.keys(FUNCTIONS).filter(k => fnShows(k)
        && fnPlansInPillars(FUNCTIONS[k]))[0];
      const cf = Object.keys(FUNCTIONS).filter(k => fnShows(k)
        && !fnPlansInPillars(FUNCTIONS[k]) && capsOfFunction(k).length)[0];
      const u = activeKeys()[0];
      const r = { pf, cf, u, shared: typeof deckHtmlFor === "function" };
      if (r.shared) {
        r.viaShared_pf = count(deckHtmlFor("fn:" + pf));
        r.viaShared_cf = count(deckHtmlFor("fn:" + cf));
        r.viaShared_u  = count(deckHtmlFor(u));
      }
      r.capsDirect = count(deckSlidesFn(cf));
      r.unitDirect = count(deckSlides(unitLike("fn:" + pf)));
      /* The editor, opened the way its own button opens it. */
      try {
        slidesOpen("fn", pf);
        const list = document.getElementById("slidelist");
        r.editorRows = list ? list.querySelectorAll(".slrow").length : -1;
        r.editorSaysSomething = !!(list && list.innerHTML.trim().length > 20);
        slidesClose();
      } catch (e) { r.editorThrew = e.message; }
      r.anchors_pf = deckAnchors("fn", pf).length;
      r.anchors_cf = deckAnchors("fn", cf).length;
      return r;
    }""")
    if isinstance(decks, dict) and decks.get("shared") is not None:
        ok("the build carries ONE reader for it (deckHtmlFor)",
           decks["shared"] is True, decks)
        if decks["shared"]:
            ok("a pillars function gets the UNIT deck through it",
               decks["viaShared_pf"] == decks["unitDirect"] and decks["unitDirect"] > 3,
               decks)
            ok("a capability function still gets the CAPABILITY deck (§113.8)",
               decks["viaShared_cf"] == decks["capsDirect"] and decks["capsDirect"] > 3,
               decks)
            ok("and a unit is untouched by it",
               decks["viaShared_u"] > 3, decks)
        ok("Manage slides draws the whole deck, not one useless cover",
           decks.get("editorRows", 0) == decks["unitDirect"], decks)
        ok("and never an empty rail with nothing said",
           decks.get("editorSaysSomething") is True, decks)
        ok("the anchors offered a picture come from the same deck",
           decks["anchors_pf"] == decks["unitDirect"]
           and decks["anchors_cf"] == decks["capsDirect"], decks)
    else:
        ok("the deck-router fixture ran", False, decks)

    print("\n── 7 · Merchandising is no longer carried by Retail")
    car = js(pg, """() => {
      const carried = [];
      activeKeys().forEach(k => (UNITS[k].items || []).forEach(p => {
        if (p.by) carried.push(UNITS[k].name + " · " + (p.code || p.name) + " → " + p.by);
      }));
      const rs = UNITS.retailstores
        ? (UNITS.retailstores.items || []).filter(p => /Merchandising/i.test(p.name))[0]
        : null;
      return { carried, rs: rs ? { code: rs.code, by: rs.by || null,
                                   perf: pillarPerf(rs) } : null,
               featureLives: typeof pillarCarrier === "function"
                 && pillarCarrier({ by: "merchandising" }) !== undefined };
    }""")
    if isinstance(car, dict) and "carried" in car:
        ok("no unit pillar points at a function any more", car["carried"] == [],
           car["carried"])
        ok("Retail's Merchandising pillar carries no pointer",
           car["rs"] is not None and car["rs"]["by"] is None, car["rs"])
        ok("so it scores as the empty pillar it is, not the function's 93%",
           car["rs"] is not None and car["rs"]["perf"] is None, car["rs"])
        ok("and the FEATURE is untouched — pillarCarrier still answers",
           car["featureLives"] is True, car)
    else:
        ok("the carrier fixture ran", False, car)

    ok("no page error anywhere in the run", errs == [], errs[:3])
    b.close()

print("\n" + ("deck-blank-slides: all passed" if not fails
              else "deck-blank-slides: %d failed" % len(fails)))
for f in fails:
    print("  - " + f)
raise SystemExit(1 if fails else 0)
