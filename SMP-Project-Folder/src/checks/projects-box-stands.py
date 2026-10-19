"""A BOX THAT PLANS IN PROJECTS SAYS HOW IT DID (§553.2, spec 066 stage 5b).

A pillars box has ended its deck on its readings since §254.4 — Islam:
*"where the units stands to be the last slide"*. A projects box ended on its
last milestone: no Overall performance divider, no standing, nothing
answering the question the review is for. There was never a decision that it
should not; it fell between two builders.

WHAT IS ASSERTED, AND WHY EACH:

· THE CELLS IT HAS, NOT THE CELLS THE OTHER ONE HAS. A projects box has no
  pillars score (`unitPillars` answers null), so a copy of the pillars slide
  would print an empty middle cell. Asserted as the ABSENCE of a pillars
  cell beside the presence of the two it does have.

· AGREEMENT, NEVER A LITERAL (§94.8). The figures on the slide are compared
  with `capKOScore` and `capExec` read in the same run, so a client with
  different numbers stays green and a slide that prints the wrong reading
  does not.

· ONE DESCRIPTION, NOT TWO (§53.5). Both decks' slides must come from the
  same builder, or this grows back. Proved by shape: the two carry the same
  wrapper, the same heading pattern and the same cell markup.

· AND THE PILLARS DECKS MUST NOT HAVE MOVED. The change refactored the slide
  they already had, so a unit is asserted to still draw three cells with its
  pillars reading among them.

· BOTH ENDS (§94.2, §45.2): a box with no readings at all draws neither the
  divider nor the standing, rather than a heading over three dashes.

It MAKES its state (§255); SMP_BUILT points it at another build (§276).
"""
import os, sys, json
from playwright.sync_api import sync_playwright

BUILT = os.environ.get("SMP_BUILT") or os.path.join(
    os.path.dirname(__file__), "..", "strategy-management-platform.html")
bad = 0
def ck(name, ok, x=""):
    global bad
    print(("  ok    " if ok else "  FAIL  ") + name + ("" if ok else "  — %s" % (x,)))
    if not ok: bad += 1
def ev(pg, js, d=None, a=None):
    try: return pg.evaluate(js, a) if a is not None else pg.evaluate(js)
    except Exception as e: return d if d is not None else {"threw": str(e)[:90]}

DECK = """(t)=>{
  var d = document.createElement('div');
  try { d.innerHTML = deckHtmlFor(t); } catch(e){ return { threw: String(e.message) }; }
  var S = [...d.querySelectorAll('.dslide')];
  var st = S.filter(s => s.getAttribute('data-anchor') === 'stand')[0];
  return { anchors: S.map(s => s.getAttribute('data-anchor')),
           cells: st ? [...st.querySelectorAll('.headcell')].map(c => ({
                    label: (c.querySelector('.dlab')||{}).textContent || '',
                    val:   (c.querySelector('b')||{}).textContent || '',
                    sub:   (c.querySelector('.headsub')||{}).textContent || '' })) : null,
           head:  st ? (st.querySelector('h2')||{}).textContent : null,
           foot:  st ? (st.querySelector('.headfoot')||{}).textContent : null,
           wrap:  st ? st.className : null };
}"""

with sync_playwright() as p:
    b = p.chromium.launch(executable_path=os.environ.get("SMP_CHROME") or None)
    pg = b.new_page(viewport={"width": 1500, "height": 1000})
    errs = []; pg.on("pageerror", lambda e: errs.append(str(e)))
    pg.add_init_script("try{sessionStorage.setItem('smp.welcome.done','1');"
                       "localStorage.setItem('smp.tour.never','1')}catch(e){}")
    pg.goto("file://" + os.path.abspath(BUILT)); pg.wait_for_timeout(900)

    print("1 · (fixture) the worked example really has both kinds of box")
    ck("a function that plans in PROJECTS", ev(pg, "()=>!plansInPillars('fn:finance')") is True)
    ck("a function that plans in PILLARS", ev(pg, "()=>plansInPillars('fn:merchandising')") is True)

    print("\n2 · the projects box now says how it did")
    pj = ev(pg, DECK, {}, "fn:finance")
    ck("…it draws the Overall performance divider", "sperf" in (pj.get("anchors") or []),
       pj.get("anchors"))
    # A unit reads sperf, pillars, stand, notes, end — the notes come AFTER
    # the standing. So "last" is wrong for both; what matters is that the two
    # agree, which section 6 asserts, and that the standing is there at all.
    ck("…and the standing is in it, before the Thank you",
       "stand" in (pj.get("anchors") or [])
       and (pj.get("anchors") or []).index("stand") < len(pj.get("anchors") or []) - 1,
       pj.get("anchors"))
    ck("…headed by the box's own name", "Finance" in (pj.get("head") or ""), pj.get("head"))

    print("\n3 · the cells it HAS, not the cells the pillars box has")
    labs = [c["label"] for c in (pj.get("cells") or [])]
    ck("…two cells, not three", len(labs) == 2, labs)
    ck("…no pillars reading, because it has no pillars",
       not any("illar" in l for l in labs), labs)
    ck("…its objectives and its execution", any("bjective" in l for l in labs)
       and any("xecution" in l for l in labs), labs)

    print("\n4 · the figures AGREE with what the product computes (§94.8)")
    want = ev(pg, """()=>{var f = FUNCTIONS['finance'];
      return { ko: holderHasKOs(f) ? capKOScore(f) : null, ex: (capExec(f)||{}).pct };}""", {})
    got = { ("ko" if "bjective" in c["label"] else "ex"): c["val"]
            for c in (pj.get("cells") or []) }
    ck("…the objectives figure is capKOScore's",
       want.get("ko") is not None and str(round(want["ko"])) in (got.get("ko") or ""),
       [want.get("ko"), got.get("ko")])
    ck("…the execution figure is capExec's",
       want.get("ex") is not None and str(round(want["ex"])) in (got.get("ex") or ""),
       [want.get("ex"), got.get("ex")])

    print("\n5 · the pillars decks did NOT move")
    un = ev(pg, DECK, {}, "mobile")
    ulabs = [c["label"] for c in (un.get("cells") or [])]
    ck("a unit still draws three cells", len(ulabs) == 3, ulabs)
    ck("…with its pillars reading among them", any("illar" in l for l in ulabs), ulabs)
    ck("…and still carries its standing", "stand" in (un.get("anchors") or []),
       (un.get("anchors") or [])[-4:])
    # THE ORDER IS THE SAME ON BOTH, which is the half that caught the fault:
    # the first draft put the projects box's standing AFTER its notes, so one
    # kind of box ended on a different slide from every other.
    def order(a):
        a = [x for x in (a or []) if x in ("sperf", "stand", "notes", "end")]
        return {k: a.index(k) for k in set(a)}
    def ordered(a):
        o = order(a)
        if "sperf" in o and not (o["sperf"] < o.get("stand", 9e9)): return False
        if "stand" in o and not (o["stand"] < o.get("end", 9e9)):   return False
        if "notes" in o and "stand" in o and not (o["stand"] < o["notes"]): return False
        if "notes" in o and "end" in o and not (o["notes"] < o["end"]):     return False
        return True
    # NOT A LITERAL COMPARISON OF THE TWO LISTS: a projects box with no cycle
    # note has no notes slide, which is content, not order. What is asserted
    # is the ORDER both must keep — divider, standing, notes if any, Thank
    # you — and it is proved on a projects box that HAS a note (§255).
    ck("the unit orders them divider → standing → notes → Thank you", ordered(un.get("anchors")),
       un.get("anchors"))
    ck("…and so does the projects box", ordered(pj.get("anchors")), pj.get("anchors"))
    # Through the product's own writer (§42), not by reaching into a store
    # whose shape the check would then be a second description of — the
    # first draft wrote CYCLE.notes, which nothing reads.
    withnote = ev(pg, """()=>{ setCycleNote('fn:finance', 'A note made by the check.');
      return cycleNote('fn:finance').length > 0;}""")
    ck("giving the projects box a cycle note", withnote is True, withnote)
    pj2 = ev(pg, DECK, {}, "fn:finance")
    ck("…its notes slide appears AFTER the standing, as a unit's does",
       "notes" in (pj2.get("anchors") or []) and ordered(pj2.get("anchors")),
       pj2.get("anchors"))

    print("\n6 · ONE description of the slide, not two (§53.5)")
    ck("both carry the same wrapper", pj.get("wrap") == un.get("wrap"),
       [pj.get("wrap"), un.get("wrap")])
    ck("…both head it the same way",
       (pj.get("head") or "").startswith("Where") and (un.get("head") or "").startswith("Where"),
       [pj.get("head"), un.get("head")])
    ck("…and both close on the same sentence about execution",
       "landing on time" in (pj.get("foot") or "") and "landing on time" in (un.get("foot") or ""),
       [pj.get("foot"), un.get("foot")])

    print("\n7 · BOTH ENDS: nothing to report draws nothing (§45.2)")
    made = ev(pg, """()=>{
      /* A function with no objectives and no work at all. Made rather than
         found, because the worked example has no such box (§255). */
      var k = FUNCTION_KEYS[0];
      window.__keep = JSON.stringify({ p: FUNCTIONS[k].projects || [],
                                       o: FUNCTIONS[k].keyObjectives || [] });
      FUNCTIONS[k].projects = []; FUNCTIONS[k].keyObjectives = [];
      var own = fnOwnHolder(k); if (own) { own.projects = []; own.keyObjectives = []; }
      return 'fn:' + k;}""", "")
    empty = ev(pg, DECK, {}, made)
    ck("an empty box draws no Overall performance divider",
       "sperf" not in (empty.get("anchors") or []), empty.get("anchors"))
    ck("…and no standing", "stand" not in (empty.get("anchors") or []), empty.get("anchors"))
    ck("…but still a cover and a Thank you, so it is a deck",
       (empty.get("anchors") or [])[:1] == ["cover"] and (empty.get("anchors") or [])[-1:] == ["end"],
       empty.get("anchors"))

    ck("no page errors", not errs, errs[:3])
    b.close()

print("\nall good" if not bad else "\n%d FAILED" % bad)
sys.exit(1 if bad else 0)
