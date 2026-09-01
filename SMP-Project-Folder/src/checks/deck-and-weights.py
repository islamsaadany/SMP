"""THE REVIEW DECK, AND THE WEIGHTS THE OBJECTIVES ARE SCORED BY (§237).

Islam, from a client's decks and his own screens. Every item here is his, and
every one is asserted as the PROBLEM rather than as the layout (§94.8), so a
later change to the wording or the spacing stays green and a change to the
behaviour does not.

  1 · A SUPPORTING FUNCTION'S AIM SLIDE. *"It has a title of winning
      aspiration but it shouldn't show this as they don't have it, and what we
      are aiming at should be the key objectives only — remove the by 2027 and
      the direction."* A function inherits its aspiration and its SWOT from the
      unit it plans under and never authors either (§213), and its objectives
      carry a weight and no 3-year target — so the label stood over an empty
      paragraph and two columns held nothing but em-dashes.

  2 · AND THE THIS-YEAR COLUMN IS UNCONDITIONAL THERE. `SHOW_KO_THIS_YEAR` is
      a per-viewer setting (§66); on a function it is the only target there is,
      so a viewer who turned it off would get objectives with no target at all.
      Islam settled the reason: *"the functions has no 3 years objectives."*

  3 · NO SWOT SLIDES ON A FUNCTION — five of twenty-one, for something it does
      not have. A UNIT still draws its section when its SWOT is empty: there it
      is a plan not yet analysed, which is worth saying (§45.2). The test is
      whether the subject AUTHORS one.

  4 · THREE HEADLINE NUMBERS, on a unit AND a function. *"Where the units
      stands needs to show the 3 main numbers not only 2."* §64 gave the
      Performance page three; only the slide was left at two. Asserted as
      AGREEMENT with what that page computes, never as a figure.

  5 · THE HEADING NAMES ITS SUBJECT on a function, and still says "the unit" on
      a unit — which is right and is not changed for tidiness.

  6 · THE QUARTERS ARE THE FOUR BOXES the screens already draw, not "Q1, Q2".

  7 · THE NOTES SLIDE IS DRAWN ONLY WHEN A NOTE IS WRITTEN. Both ends, and on
      both decks (§53.5).

  8 · A BLANK WEIGHT IS NEVER NOUGHT. *"If it's missing it should be considered
      equally weighted objectives not 0."* This is one of the two mechanisms
      that put a dash where a reported figure should be: `koScore()` read
      `weights[i] == null ? 0`, so where every reported row was blank the total
      came to nothing and the headline returned null.

  9 · A UNIT'S OBJECTIVES GET A WEIGHT COLUMN, and it writes the row.

 10 · A FUNCTION'S READ TABLE DROPS THE WEIGHT COLUMN when nothing is weighted.

 11 · THE UNIT IS NEVER WRITTEN TWICE — "8 M EGP M EGP", reproduced and closed.

 12 · A LONG FIGURE IS READ AT ITS TARGET'S SCALE, display only, and the demo's
      own figures do not move.
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
    """A throw is a FAILURE, never the end of the run (§215) — this file is
    proved by running it against a build that lacks what it measures."""
    try:
        return pg.evaluate(expr, arg) if arg is not None else pg.evaluate(expr)
    except Exception as e:                        # noqa: BLE001
        return {"threw": str(e).strip().split("\n")[0]}


DECK = """(t) => {
  const u = plansInPillars(t) ? unitLike(t) : null;
  if (!u) return { err: "no subject" };
  const box = document.createElement("div");
  box.innerHTML = deckSlides(u);
  const sl = [...box.querySelectorAll(".dslide")];
  const h2 = s => ((s.querySelector("h2") || {}).textContent || "").trim();
  const h1 = s => ((s.querySelector("h1") || {}).textContent || "").trim();
  const aim = sl.find(s => h2(s) === "What we are aiming at");
  const stand = sl.find(s => h2(s).indexOf("Where ") === 0);
  const tac = sl.find(s => [...s.querySelectorAll("thead th")]
                            .some(e => e.textContent.trim() === "Tactic"));
  return {
    n: sl.length,
    aimHeads: aim ? [...aim.querySelectorAll("thead th")].map(e => e.textContent.trim()) : null,
    aimLabels: aim ? [...aim.querySelectorAll(".dlab")].map(e => e.textContent.trim()) : null,
    aimAspiration: aim ? !!aim.querySelector(".aimtop") : null,
    standH2: stand ? h2(stand) : null,
    standCells: stand ? [...stand.querySelectorAll(".headcell .dlab")].map(e => e.textContent.trim()) : null,
    standValues: stand ? [...stand.querySelectorAll(".headcell b")].map(e => e.textContent.trim()) : null,
    swot: sl.filter(s => s.className.indexOf("d-swot") > -1 || h1(s) === "SWOT").length,
    notes: sl.some(s => h2(s) === "Notes and achievements"),
    quarterBoxes: tac ? tac.querySelectorAll("tbody .qs i").length : 0,
    quarterText: tac ? [...tac.querySelectorAll("tbody tr")].some(
      r => /^Q\\d(,\\s*Q\\d)*$/.test((r.children[4] || {}).textContent || "")) : null,
    page: { ko: unitObjectives(u), pillars: unitPillars(u), exec: unitRatio(u) }
  };
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

    print("\n── the fixture")
    fk = pg.evaluate("()=>Object.keys(FUNCTIONS).filter(k=>fnPlansInPillars(FUNCTIONS[k]))[0]")
    unit = pg.evaluate("()=>UNIT_KEYS.filter(k=>UNITS[k].active&&UNITS[k].items.length)[0]")
    T = "fn:" + (fk or "")
    ok("a function that plans in pillars, and a unit", bool(fk) and bool(unit), [fk, unit])
    if not (fk and unit):
        b.close(); sys.exit(1)
    # §94.2: the demo's pillars function holds no objectives and no note.
    js(pg, """(k)=>{ const f=FUNCTIONS[k];
      f.keyObjectives=[{id:"fn:"+k+"-KO1", name:"Availability on shelf", dir:"\\u2265",
                        target:"95%", weight:40, actual:"92%", progress:97, compile:"Latest"}];
      delete REVIEW.note["fn:"+k]; }""", fk)

    # ── 1 · the aim slide ───────────────────────────────────────────────────
    print("\n── 1 · what a function aims at is its objectives, and nothing else")
    f = js(pg, DECK, T)
    ok("no aspiration block on the function's aim slide", f.get("aimAspiration") is False, f)
    ok("...no 'by 2027' heading over the table", f.get("aimLabels") == [], f)
    ok("...and the columns are the objective and this year only",
       f.get("aimHeads") == ["#", "Objective", "This year"], f)

    print("\n── 2 · and the target shows whatever the viewer's toggle says (§66)")
    off = js(pg, "(t)=>{ SHOW_KO_THIS_YEAR=false; return 1; }", T)
    f2 = js(pg, DECK, T)
    ok("with the this-year toggle OFF a function still shows its only target",
       f2.get("aimHeads") == ["#", "Objective", "This year"], f2)
    js(pg, "()=>{ SHOW_KO_THIS_YEAR=true; }")

    # ── 3 · SWOT ────────────────────────────────────────────────────────────
    print("\n── 3 · a function draws no SWOT; a unit still does")
    u = js(pg, DECK, unit)
    ok("no SWOT slides on the function's deck", f.get("swot") == 0, f)
    ok("...and the unit's section is untouched", (u.get("swot") or 0) > 0, u)
    ok("...which is what makes the function's absence a decision (§113.8)",
       f.get("swot") == 0 and (u.get("swot") or 0) >= 5, [f.get("swot"), u.get("swot")])

    # ── 4 · three numbers, agreeing with the page ───────────────────────────
    print("\n── 4 · three headline numbers, and they are the page's own")
    for label, d in (("the function", f), ("the unit", u)):
        ok(label + " — the slide carries three numbers",
           len(d.get("standCells") or []) == 3, d.get("standCells"))
        pg_vals = d.get("page") or {}
        want = [None if pg_vals.get(k) is None else str(pg_vals[k]) + "%"
                for k in ("ko", "pillars", "exec")]
        got = [v.replace("—", "") or None for v in (d.get("standValues") or [])]
        ok("...and each is what the Performance page computes (§53.5)",
           got == [None if w is None else w for w in want], {"slide": got, "page": want})

    # ── 5 · the heading ─────────────────────────────────────────────────────
    print("\n── 5 · the heading names its subject on a function")
    name = pg.evaluate("(k)=>FUNCTIONS[k].name", fk)
    ok("the function's slide names the function",
       f.get("standH2") == "Where " + name + " stands", f.get("standH2"))
    ok("...and a unit's still says 'the unit', unchanged",
       u.get("standH2") == "Where the unit stands", u.get("standH2"))

    # ── 6 · the quarters ────────────────────────────────────────────────────
    print("\n── 6 · the quarters are the four boxes the screens draw")
    for label, d in (("the function", f), ("the unit", u)):
        ok(label + " — the tactics table draws quarter boxes",
           (d.get("quarterBoxes") or 0) > 0 and (d.get("quarterBoxes") or 0) % 4 == 0,
           d.get("quarterBoxes"))
        ok("...and no cell is left printing 'Q1, Q2'", d.get("quarterText") is False, d)

    # ── 7 · the notes slide ─────────────────────────────────────────────────
    print("\n── 7 · the notes slide follows the note, on both decks")
    ok("the function has no note, so no slide", f.get("notes") is False, f)
    js(pg, "(k)=>{ REVIEW.note['fn:'+k] = 'Something worth saying.'; }", fk)
    ok("...write one and the slide appears",
       (js(pg, DECK, T) or {}).get("notes") is True)
    js(pg, "(k)=>{ delete REVIEW.note['fn:'+k]; }", fk)
    was = js(pg, "(k)=>{ const n=REVIEW.note[k]; delete REVIEW.note[k]; return n||''; }", unit)
    ok("a unit with no note draws none either",
       (js(pg, DECK, unit) or {}).get("notes") is False)
    js(pg, "(a)=>{ if(a.n) REVIEW.note[a.k]=a.n; }", {"k": unit, "n": was})

    # ── 8 · a blank weight is never nought ──────────────────────────────────
    print("\n── 8 · a blank weight counts as the average, never as nought")
    w = js(pg, """() => ({
      noneSet:      koScore([{progress:90},{progress:50}], null),
      blankOnTheOnlyReportedRow:
                    koScore([{progress:null,weight:40},{progress:null,weight:25},
                             {progress:90,  weight:null},{progress:null,weight:15}], null),
      everySetWeightZero: koScore([{progress:90,weight:0},{progress:50,weight:0}], null),
      weighted:     koScore([{progress:90,weight:80},{progress:50,weight:20}], null),
      legacyArray:  koScore([{progress:90},{progress:50}], [80,20]),
      rowBeatsLegacy: koScore([{progress:90,weight:20},{progress:50,weight:20}], [80,20])
    })""")
    ok("a list nobody weighted is the plain mean", w.get("noneSet") == 70, w)
    ok("a blank weight on the only reported row scores it, never a dash",
       w.get("blankOnTheOnlyReportedRow") == 90, w)
    ok("...and every set weight being zero falls back to equal, not to a dash",
       w.get("everySetWeightZero") == 70, w)
    ok("a genuinely weighted list is still weighted", w.get("weighted") == 82, w)
    ok("a tenant's stored weights array is still read", w.get("legacyArray") == 82, w)
    ok("...and the row's own weight wins over it", w.get("rowBeatsLegacy") == 70, w)

    # ── 9 · the unit's weight column, pressed ───────────────────────────────
    print("\n── 9 · a unit's objectives carry a weight column, and it writes")
    js(pg, """(k)=>{ VIEWER=PEOPLE.filter(p=>p.role==='super')[0].key; leaveModes();
      current=k; currentSub='foundation'; CURSEC.foundation='found';
      EDIT_PAGE.foundation=true; paint(); }""", unit)
    pg.wait_for_timeout(600)
    col = js(pg, """() => {
      const t = [...document.querySelectorAll('#panel table')].find(x =>
        [...x.querySelectorAll('thead th')].some(h => h.textContent.trim() === 'Objective'));
      if (!t) return { err: 'no objectives table' };
      const heads = [...t.querySelectorAll('thead th')].map(h => h.textContent.trim());
      const i = heads.indexOf('Weight %');
      if (i < 0) return { heads: heads, i: -1 };
      const el = t.querySelectorAll('tbody tr')[0].children[i].querySelector('input');
      if (!el) return { heads: heads, i: i, noInput: true };
      el.value = '35'; el.dispatchEvent(new Event('change', { bubbles: true }));
      return { heads: heads, i: i, bound: !!el.dataset.fld };
    }""")
    ok("the Weight % column is on a unit's objectives table", col.get("i", -1) > -1, col)
    ok("...its cell holds a bound field, not decoration (§96)", col.get("bound") is True, col)
    stored = js(pg, "(k)=>UNITS[k].keyObjectives[0].weight", unit)
    ok("...and typing into it reaches the stored plan", stored == 35, stored)

    # ── 10 · the read table drops a column nobody filled ────────────────────
    print("\n── 10 · a function's read table shows weights only when there are some")
    r = js(pg, """() => {
      const heads = html => { const d = document.createElement('div'); d.innerHTML = html;
        return [...d.querySelectorAll('.ohead span')].map(s => s.textContent.trim()); };
      return { none: heads(koReadBlock([{name:'A', target:'1.6B EGP', weight:null}], 'x')),
               some: heads(koReadBlock([{name:'A', target:'1.6B EGP', weight:60}], 'x')) };
    }""")
    ok("nothing weighted — no Weight column", r.get("none") == ["Objective", "This year"], r)
    ok("...something weighted — the column is back",
       r.get("some") == ["Objective", "This year", "Weight"], r)

    # ── 11 · the unit written twice ─────────────────────────────────────────
    print("\n── 11 · the unit is never written twice")
    j = js(pg, """() => ({
      bare:      joinTarget("", "8", "M EGP"),
      typedUnit: joinTarget("", "8 M EGP", "M EGP"),
      lowercase: joinTarget("", "8 m egp", "M EGP"),
      spaced:    joinTarget("", "8  M  EGP", "M EGP"),
      different: joinTarget("", "8 B EGP", "M EGP")
    })""")
    ok("the bare number still gets its unit", j.get("bare") == "8 M EGP", j)
    ok("...and a unit already typed in is NOT added again", j.get("typedUnit") == "8 M EGP", j)
    ok("...however it was spelled", j.get("lowercase") == "8 M EGP"
       and j.get("spaced") == "8 M EGP", j)
    ok("...and a DIFFERENT unit is left exactly as typed, never rewritten",
       j.get("different") == "8 B EGP", j)

    # ── 12 · a long figure read at its target's scale ───────────────────────
    print("\n── 12 · a long figure is read at its target's scale, and nothing else moves")
    sc = js(pg, """() => {
      const moved = [];
      const walk = (m) => { if (!m || !m.target) return;
        const s = figureScaled(m.target, m.actual);
        if (s !== String(m.actual == null ? "" : m.actual).trim()) moved.push(m.name + ": " + m.actual + " -> " + s); };
      UNIT_KEYS.forEach(k => { UNITS[k].keyObjectives.forEach(walk);
        UNITS[k].items.forEach(p => { p.measures.forEach(walk); }); });
      (GROUP.capabilities || []).forEach(c => (c.keyObjectives || []).forEach(walk));
      return { long:    figureScaled("3.59B EGP", "3,590,800,500"),
               full:    figureFull("3.59B EGP", "3,590,800,500"),
               inUnits: figureScaled("6 M EGP", "8"),
               noFull:  figureFull("6 M EGP", "8"),
               percent: figureScaled("95%", "92"),
               hasUnit: figureScaled("3.59B EGP", "3.6B EGP"),
               moved: moved };
    }""")
    ok("a figure written out in full reads at the target's scale",
       sc.get("long") == "3.59B EGP", sc)
    ok("...with the whole number kept on the hover", sc.get("full") == "3,590,800,500", sc)
    ok("a figure already IN the target's unit is untouched (§199.6)",
       sc.get("inUnits") == "8" and sc.get("noFull") == "", sc)
    ok("...so is a percentage, and so is one carrying its own unit",
       sc.get("percent") == "92" and sc.get("hasUnit") == "3.6B EGP", sc)
    ok("and not one figure in the shipped plan moves", sc.get("moved") == [], sc.get("moved"))

    ok("no page errors throughout", not errs, errs[:3])
    b.close()

print("\n%d failed" % len(fails))
for f in fails:
    print("  FAIL  " + f)
sys.exit(1 if fails else 0)
