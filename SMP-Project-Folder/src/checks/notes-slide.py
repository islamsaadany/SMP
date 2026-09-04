"""THE NOTES SLIDE APPEARS WHEN SOMEBODY WROTE A NOTE (§243, §246).

Islam, having had §243: *"for functions who already didn't fill the notes an
achievments slide it's still appearing."*

§243's gate was `if (unote)` and it is right. What it READ was not: the deck's
own note box is contenteditable and wrote `box.textContent` into `REVIEW.note`
on every keystroke, and until §243 that box was drawn on every deck — so a
click into it and a space, or a word typed and deleted, left a note made of
whitespace. Whitespace is truthy. §104.10's trap in a third place.

WHAT IS ASSERTED:

  1 · A SUBJECT WITH NO NOTE HAS NO NOTES SLIDE, on all three deck shapes —
      a unit, a function planning in pillars, a function planning in projects.

  2 · WHITESPACE IS NOT A NOTE. The state is MADE (§94.2): a space, a newline
      and a tab-and-spaces are each written and the slide must stay away. This
      is the assertion the previous build fails.

  3 · A REAL NOTE STILL DRAWS ITS SLIDE, and carries the words. Without this a
      build that never drew the slide at all would pass every assertion above
      (§113.8).

  4 · AND THE EMPTIED KEY IS DELETED (§50.6) — a note written and cleared is
      the same absence as one never written, or the two states drift apart
      where only one of them is tested.
"""
import os, sys
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


# One probe for all three shapes: set the note, build that subject's OWN deck,
# and count the slides whose heading is the notes slide.
PROBE = """(a) => {
  const set = (k, v) => { if (v === null) { delete REVIEW.note[k]; }
                          else { REVIEW.note[k] = v; } };
  const had = REVIEW.note[a.key];
  set(a.key, a.note);
  const html = a.shape === "caps" ? deckSlidesFn(a.fk) : deckSlides(unitLike(a.key));
  const d = document.createElement("div");
  d.innerHTML = (typeof html === "string" ? html : (html || []).join(""));
  const hit = [...d.querySelectorAll("section.dslide")]
    .filter(s => /Notes and achievements/i.test(s.textContent));
  const out = { slides: d.querySelectorAll("section.dslide").length,
                notes: hit.length,
                text: hit.length ? hit[0].textContent.replace(/\\s+/g, " ").trim() : "",
                stored: Object.prototype.hasOwnProperty.call(REVIEW.note, a.key) };
  d.remove();
  if (had === undefined) delete REVIEW.note[a.key]; else REVIEW.note[a.key] = had;
  return out;
}"""

with sync_playwright() as p:
    b = p.chromium.launch(executable_path=os.environ.get("SMP_CHROME"))
    pg = b.new_page(viewport={"width": 1500, "height": 1000})
    pg.add_init_script("try{sessionStorage.setItem('smp.welcome.seen','1');"
                       "sessionStorage.setItem('smp.welcome.done','1');"
                       "sessionStorage.setItem('smp.tour.later','1');}catch(e){}")
    errs = []
    pg.on("pageerror", lambda e: errs.append(str(e)))
    pg.goto("file://" + FILE)
    pg.wait_for_timeout(900)

    print("\n── the fixture: one subject of each deck shape")
    fx = js(pg, """() => ({
      unit: activeKeys()[0],
      pillars: (Object.keys(FUNCTIONS).filter(k => fnShows(k)
                 && fnPlansInPillars(FUNCTIONS[k]))[0] || null),
      caps: (Object.keys(FUNCTIONS).filter(k => fnShows(k)
              && !fnPlansInPillars(FUNCTIONS[k]) && capsOfFunction(k).length)[0] || null)
    })""")
    ok("a business unit", bool(fx.get("unit")), fx)
    ok("a supporting function that plans in pillars", bool(fx.get("pillars")), fx)
    ok("a supporting function that plans in projects", bool(fx.get("caps")), fx)
    if not (fx.get("unit") and fx.get("pillars") and fx.get("caps")):
        b.close(); sys.exit(1)

    SUBJECTS = [("a unit", {"shape": "unit", "key": fx["unit"], "fk": None}),
                ("a function planning in pillars",
                 {"shape": "pillars", "key": "fn:" + fx["pillars"], "fk": fx["pillars"]}),
                ("a function planning in projects",
                 {"shape": "caps", "key": "fn:" + fx["caps"], "fk": fx["caps"]})]

    # ── 1 · no note, no slide ───────────────────────────────────────────────
    print("\n── 1 · nothing written, so the slide is not drawn (§243)")
    for label, a in SUBJECTS:
        r = js(pg, PROBE, dict(a, note=None))
        ok(label + " — no notes slide", r.get("notes") == 0, r)
        ok("...and the deck is otherwise built", (r.get("slides") or 0) > 5, r)

    # ── 2 · whitespace is not a note — the reported fault ───────────────────
    print("\n── 2 · whitespace is not a note (§246 — this is what was reported)")
    for label, a in SUBJECTS:
        for what, v in [("a single space", " "), ("a newline", "\n"),
                        ("tabs and spaces", "\t   \n ")]:
            r = js(pg, PROBE, dict(a, note=v))
            ok(label + " — " + what + " draws no notes slide",
               r.get("notes") == 0, r)

    # ── 3 · a real note still draws it (§113.8) ─────────────────────────────
    print("\n── 3 · a note somebody wrote still gets its slide")
    for label, a in SUBJECTS:
        r = js(pg, PROBE, dict(a, note="Recovered the quarter on service."))
        ok(label + " — the slide is drawn", r.get("notes") == 1, r)
        ok("...and it carries the words",
           "Recovered the quarter on service." in (r.get("text") or ""), r.get("text"))

    # ── 4 · emptying deletes the key (§50.6) ────────────────────────────────
    print("\n── 4 · a note cleared is a note absent, not an empty one")
    r = js(pg, """(k) => {
      const had = REVIEW.note[k];
      setCycleNote(k, "Something");
      const on = Object.prototype.hasOwnProperty.call(REVIEW.note, k);
      setCycleNote(k, "   \\n ");
      const off = Object.prototype.hasOwnProperty.call(REVIEW.note, k);
      if (had === undefined) delete REVIEW.note[k]; else REVIEW.note[k] = had;
      return { on: on, off: off };
    }""", "fn:" + fx["pillars"])
    ok("writing a note stores the key", r.get("on") is True, r)
    ok("...and clearing it REMOVES the key rather than storing \"\"",
       r.get("off") is False, r)

    ok("no page errors throughout", not errs, errs[:3])
    b.close()

print("\n%d failed" % len(fails))
for f in fails:
    print("  FAIL  " + f)
sys.exit(1 if fails else 0)
