"""THE FIGURES ARE ENTERED FROM THE KEYBOARD (§528).

Islam, of the usability audit's second item: *"all"* — all four of the
keyboard behaviours put to him for the reporting page. Measured first, on the
shipped build: Enter already COMMITTED a figure (Chromium fires `change` on
Enter in an input outside a form, and there are no forms on this page) and
then went nowhere, so a reporter typing fourteen to forty-one figures reached
for the mouse between every one of them; and the note box sat in the tab path
on EVERY row, so Tab stepped figure → note → figure and half of every journey
was a box most rows never need.

WHAT THIS ASSERTS, AND WHY EACH ONE IS HERE

· THE KEYS ARE PRESSED, NEVER READ FOR (§96, §70). A handler that exists is
  not a handler that acts, and `aria-keyshortcuts` is an announcement rather
  than a behaviour — so every behaviour here is driven through the keyboard
  and read back from the STORED plan or from where the cursor actually is.

· BOTH ENDS, EVERY TIME (§94.2, §113.8). A build that wired Enter to nothing
  satisfies "a picker gets no step" perfectly, and a build that stepped from
  everything satisfies "Enter steps" perfectly — so each refusal is asserted
  beside the move it is a refusal of: a typed figure steps and a picker does
  not; a figure's Enter steps and a NOTE's Enter still makes a newline (§271,
  the one rule "all" does not override).

· THE ANNOUNCEMENT AGREES WITH WHAT IS WIRED, never with a typed list
  (§94.8). The expected set is DERIVED here from what the element is and
  whether its row has a note, so a key added tomorrow moves the product and
  this file together, and a key announced on a box that cannot use it is red.

· THE CURSOR IS NEVER DROPPED ON THE BODY. Enter blurs before it steps, so a
  step that lands nowhere leaves the focus on `<body>` and the next Tab starts
  at the top of the document. Asserted at the last typed box, which is the end
  the product reaches first.

· AND THE STATE IS MADE (§255). The worked example has no yes/no row answered
  *In progress*, so the shape change `repStep` guards against — a per-cent box
  that appears beside a status sharing its `data-rep` (§300) — would go
  unexercised on the demo's own data.

PROVED ABLE TO FAIL: run against a build made from the SOURCES with one
behaviour broken (§276, §238's hashed CSP silences an edited built file):
`SMP_FILE=/path/to/broken.html python3 qa-run.py checks/report-keys.py`.
Run it through `qa-run.py`, never directly (§320.6b).
"""
import os
from playwright.sync_api import sync_playwright

URL = "file://" + os.environ.get(
    "SMP_FILE", "/home/user/SMP/SMP-Project-Folder/src/strategy-management-platform.html")
UNIT = "b2becomm"
bad = 0


def ck(w, ok, x=""):
    global bad
    if not ok:
        bad += 1
    print(("  ok      " if ok else "  FAIL    ") + w + (("  — " + str(x)) if not ok and x else ""))


def js(pg, expr, arg=None):
    """Every probe degrades rather than throwing (§215): against a build with
    none of this in it, a probe that dies takes every assertion after it with
    it and a count of FAIL lines reads a crash as a nearly-clean run.

    The probe is interpolated into an EXPRESSION position, so a trailing `;` is
    a parse error of the whole wrapper and the wrapper's own `try/catch` cannot
    see it — the throw arrives at the outer `except` with no hint of which probe
    it came from. §10's probe was written that way and the three failures beneath
    it printed `{'status': None, 'pct': None}`, which is what an empty list looks
    like from the outside. Stripped HERE rather than fixed at the one call site
    (§104.7: a rule every probe author has to remember is the one somebody
    forgets the day a thirteenth section is written)."""
    expr = expr.strip().rstrip(";").strip()
    try:
        return pg.evaluate("(a)=>{try{ return (" + expr + ")(a); }catch(e){ return {__err:''+e}; }}", arg)
    except Exception as e:
        return {"__err": str(e)}


ERRS = []


def lst(v):
    """A probe that threw must not read as an EMPTY LIST.

    §215 says degrade rather than die and §298.3 says the tail is the verdict:
    a swallowed error that comes out as `[]` is the same fault class as a crash
    reading clean, because every `len(x) == 1` beneath it fails with no cause
    printed. §10's first red was exactly that — three failures whose detail was
    `{'status': None, 'pct': None}`, which is what an empty list looks like
    from the outside. So the error is kept and printed in the tail."""
    if isinstance(v, dict) and "__err" in v:
        ERRS.append(v["__err"])
        return []
    return v if isinstance(v, list) else []


def dct(v):
    return v if isinstance(v, dict) and "__err" not in v else {}


# ── probes ───────────────────────────────────────────────────────────────────

BOXES = """()=>[...document.querySelectorAll(REP_BOXES)].map(function(el){
  var row = el.closest("tr");
  var isNote = el.dataset.note != null || el.dataset.cnote != null;
  return {tag: el.tagName, note: isNote,
    rowNote: !!(row && row.querySelector("[data-note],[data-cnote]")),
    want: el.classList.contains("needed"),
    tabindex: el.getAttribute("tabindex"),
    ks: (el.getAttribute("aria-keyshortcuts") || "").split(" ").filter(Boolean).sort(),
    key: repKeyOf(el)};}) """

TYPED = """()=>repTypedBoxes().map(function(el){
  return {key: repKeyOf(el), value: el.value};}) """

WHERE = """()=>{var a=document.activeElement||{};
 return {tag:a.tagName||"", key:(a.dataset&&typeof repKeyOf==="function"&&a.dataset.repkeys)?repKeyOf(a):"",
   note:!!(a.dataset&&(a.dataset.note!=null||a.dataset.cnote!=null)),
   gapat:!!(a.dataset&&a.dataset.gapat), value:a.value==null?null:a.value};}"""


def settle(pg):
    """Let go of whatever holds the cursor and WAIT, before focusing anything.

    §222: a box left holding a typed value commits on blur, and a committing
    note repaints — so focusing the next box in the same breath focuses a node
    the repaint is about to detach, and the cursor lands on the body. Found by
    this file's own §6 reading `{'now': None}` after §5 had typed into a note:
    the figure WAS focused and was gone a frame later. A person does the same
    thing in two acts — click away, the page redraws, then click the box — so
    the check does too, rather than racing it."""
    pg.evaluate("()=>{var a=document.activeElement; if(a && a.blur) a.blur();}")
    pg.wait_for_timeout(400)


def focus_nth(pg, n):
    """Focus the nth typed box through the product's own cursor (`gapLight`),
    so `data-gapat` is where the walk thinks it is — the same door the Enter
    step goes through."""
    settle(pg)
    return js(pg, "(n)=>{var e=repTypedBoxes()[n]; if(!e) return false;"
                  " gapLight(e); return true;}", n)


def make_yn(pg, unit):
    """Make a yes/no row answered In progress, ON THE PILLAR THE PAGE IS
    SHOWING, and return its id.

    §255: no measure in the worked example carries a `Y/N` target, so both the
    picker (§4) and the two halves (§10) are shapes the demo cannot show and
    every assertion about them would pass on a build that drew neither.
    And a unit's reporting page draws ONE pillar at a time (§279's own
    finding), so the row has to be made on the pillar that is on screen — the
    first attempt set the FIRST pillar's and read an empty page, because §8
    had clicked the LAST rail item."""
    settle(pg)
    pg.evaluate("()=>{var r=document.querySelectorAll('.rail .ritem');"
                "if(r.length) r[0].click();}")
    pg.wait_for_timeout(500)
    made = js(pg, """(u)=>{var un=UNITS[u], first=(un.items||[])[0];
      if(!first || !(first.measures||[]).length) return false;
      var m = first.measures[0];
      m.target = "Y/N"; m.actual = "In progress 60";
      paint(); return m.id;}""", unit)
    pg.wait_for_timeout(500)
    return made


def stored(pg, unit, rid):
    return js(pg, """(a)=>{var un=UNITS[a.u], out=null;
      (un.items||[]).forEach(function(p){
        (p.measures||[]).forEach(function(m){ if(m.id===a.id) out=m.actual; });});
      (un.keyObjectives||[]).forEach(function(m){ if(m.id===a.id) out=m.actual; });
      return {v: out};}""", {"u": unit, "id": rid})


def open_report(pg, role, unit):
    pg.evaluate("""(a)=>{
      var p = PEOPLE.filter(function(p){ return (p.role||'') === a.role; })[0];
      if (p) VIEWER = p.key;
      leaveModes(); current = a.unit; paint();
    }""", {"role": role, "unit": unit})
    pg.wait_for_timeout(300)
    pg.evaluate("()=>{var b=document.querySelector('[data-s=performance]'); if(b) b.click();}")
    pg.wait_for_timeout(350)
    pg.evaluate("()=>{var b=document.querySelector('[data-s=report]'); if(b) b.click();}")
    pg.wait_for_timeout(600)


with sync_playwright() as p:
    b = p.chromium.launch()
    pg = b.new_page(viewport={"width": 1500, "height": 950})
    errs = []
    pg.on("pageerror", lambda e: errs.append(str(e)))
    pg.on("console", lambda m: errs.append(m.text) if m.type == "error" else None)
    pg.add_init_script("try{sessionStorage.setItem('smp.welcome.done','1');"
                       "sessionStorage.setItem('smp.tour.later','1');}catch(e){}")
    pg.goto(URL)
    pg.wait_for_timeout(1800)

    # 0 ── THE SHARED READERS, ASKED FOR BY NAME FIRST
    #      Against a build without them every probe below answers {__err}, and
    #      a file that reports forty absences rather than one missing name has
    #      buried its own finding (§252's lesson, §215).
    print("\n0 · the readers this file measures through are there")
    have = js(pg, """()=>({boxes: typeof REP_BOXES, keyOf: typeof repKeyOf,
      typed: typeof repTypedBoxes, keys: typeof repKeys, step: typeof repStep,
      light: typeof gapLight, walk: typeof repWalk})""")
    have = dct(have)
    ck("REP_BOXES, repKeyOf, repTypedBoxes, repKeys, repStep are reachable",
       have.get("boxes") == "string" and have.get("keyOf") == "function"
       and have.get("typed") == "function" and have.get("keys") == "function"
       and have.get("step") == "function", have)
    ck("...and the two it steps through: gapLight and repWalk",
       have.get("light") == "function" and have.get("walk") == "function", have)

    open_report(pg, "super", UNIT)

    # 1 ── THE ANNOUNCEMENT AGREES WITH WHAT THE ELEMENT CAN DO
    print("\n1 · the keys are announced where they reach something, and nowhere else")
    # The picker is MADE, because the worked example carries no `Y/N` target at
    # all (§255) — so on an untouched unit's page there is no SELECT in
    # REP_BOXES, and the refusal below (a picker announces no Enter) would have
    # had no subject while reading perfectly green (§113.8). Through the same
    # helper §4 and §10 use, which also lands on the pillar the row is in,
    # because a unit's page draws ONE pillar at a time (§279).
    make_yn(pg, UNIT)
    boxes = lst(js(pg, BOXES))
    ck("the reporting page draws boxes to measure", len(boxes) > 4, len(boxes))
    typed = [x for x in boxes if x.get("tag") == "INPUT"]
    notes = [x for x in boxes if x.get("note")]
    picks = [x for x in boxes if x.get("tag") == "SELECT"]
    ck("...a typed figure, a note and a picker are all on this page (§113.8: "
       "every refusal below needs its own subject)",
       len(typed) > 1 and len(notes) > 1 and len(picks) > 0,
       {"typed": len(typed), "notes": len(notes), "picks": len(picks)})

    def want_keys(x):
        """Derived from WHAT THE ELEMENT IS, never from a list typed here
        (§94.8) — so a key added to the product moves this with it."""
        k = []
        if x.get("tag") == "INPUT":
            k += ["Enter", "Shift+Enter"]
        k += ["Alt+Enter"]
        if x.get("tag") in ("INPUT", "TEXTAREA"):
            k += ["Escape"]
        if x.get("rowNote") and not x.get("note"):
            k += ["Alt+N"]
        return sorted(k)

    wrong = [{"tag": x.get("tag"), "note": x.get("note"), "said": x.get("ks"),
              "wanted": want_keys(x)} for x in boxes if x.get("ks") != want_keys(x)]
    ck("every box announces exactly the keys its kind can use", not wrong, wrong[:3])
    ck("...and a NOTE never announces Enter (§271 is the one rule 'all' does "
       "not override)",
       all("Enter" not in (x.get("ks") or []) for x in notes),
       [x.get("ks") for x in notes[:3]])
    ck("...while a typed figure does",
       all("Enter" in (x.get("ks") or []) for x in typed),
       [x.get("ks") for x in typed[:3]])

    # 2 ── ENTER COMMITS AND STEPS
    print("\n2 · Enter writes the figure and the cursor lands on the next one")
    ck("the cursor starts in the first typed box", focus_nth(pg, 0) is True)
    t0 = lst(js(pg, TYPED))
    first = t0[0] if t0 else {}
    second = t0[1] if len(t0) > 1 else {}
    pg.keyboard.press("Control+a")
    pg.keyboard.type("41")
    pg.keyboard.press("Enter")
    pg.wait_for_timeout(400)
    rid = (first.get("key") or "").split("\u0001")[1] if first.get("key") else ""
    sv = dct(stored(pg, UNIT, rid))
    ck("the figure reaches the stored row (§96: read the plan, not the screen)",
       str(sv.get("v") or "").startswith("41"), {"row": rid, "stored": sv.get("v")})
    w = dct(js(pg, WHERE))
    ck("...and the cursor is on the NEXT typed box",
       w.get("key") == second.get("key"),
       {"landed": w.get("key"), "wanted": second.get("key"), "tag": w.get("tag")})
    ck("...through the walk's own cursor, so data-gapat is in step (§177.2)",
       w.get("gapat") is True, w)

    print("\n2b · at the last typed box Enter leaves the cursor where it is")
    tn = lst(js(pg, TYPED))
    ck("there is a last box to stand on", len(tn) > 1, len(tn))
    ck("the cursor is in it", focus_nth(pg, len(tn) - 1) is True)
    last = tn[-1] if tn else {}
    pg.keyboard.press("Enter")
    pg.wait_for_timeout(400)
    w = dct(js(pg, WHERE))
    ck("the focus is still on that box and NEVER on the body",
       w.get("tag") == "INPUT" and w.get("key") == last.get("key"),
       {"tag": w.get("tag"), "key": w.get("key")})

    # 3 ── SHIFT+ENTER STEPS BACK
    print("\n3 · Shift+Enter steps back")
    t = lst(js(pg, TYPED))
    ck("the cursor is on the second box", focus_nth(pg, 1) is True)
    pg.keyboard.press("Shift+Enter")
    pg.wait_for_timeout(400)
    w = dct(js(pg, WHERE))
    ck("...and lands on the first",
       w.get("key") == (t[0].get("key") if t else None),
       {"landed": w.get("key"), "wanted": t[0].get("key") if t else None})
    print("\n3b · and at the first box it stays there")
    pg.keyboard.press("Shift+Enter")
    pg.wait_for_timeout(350)
    w = dct(js(pg, WHERE))
    ck("the focus is still on the first box, not on the body",
       w.get("tag") == "INPUT" and w.get("key") == (t[0].get("key") if t else None),
       {"tag": w.get("tag"), "key": w.get("key")})

    # 4 ── A PICKER GETS NO STEP, AND A NOTE'S ENTER IS A NEWLINE
    print("\n4 · a picker is left to the browser (§130.1: Enter there chooses an option)")
    # The state is MADE: no demo measure carries a Y/N target, so there is no
    # SELECT in REP_BOXES on a unit's page at all and the first run of this
    # section measured nothing (§255, §4's own first red).
    yn4 = make_yn(pg, UNIT)
    ck("a yes/no target is set, so there is a picker to stand on", bool(yn4), yn4)
    pk = js(pg, """()=>{var e=[...document.querySelectorAll(REP_BOXES)]
      .filter(function(x){ return x.tagName==="SELECT"; })[0];
      if(!e) return false; gapLight(e); return repKeyOf(e);}""")
    ck("a picker is on the page and holds the cursor", isinstance(pk, str) and pk, pk)
    pg.keyboard.press("Enter")
    pg.wait_for_timeout(350)
    w = dct(js(pg, WHERE))
    ck("...and Enter does not step off it",
       w.get("tag") == "SELECT", {"tag": w.get("tag"), "key": w.get("key")})

    print("\n5 · a note's Enter still makes a newline (§271)")
    nb = js(pg, """()=>{var e=document.querySelector("[data-note],[data-cnote]");
      if(!e) return false; e.removeAttribute("tabindex"); e.focus(); e.value="One";
      return repKeyOf(e);}""")
    ck("a note box holds the cursor", isinstance(nb, str) and nb, nb)
    pg.keyboard.press("End")
    pg.keyboard.press("Enter")
    pg.keyboard.type("Two")
    pg.wait_for_timeout(250)
    w = dct(js(pg, WHERE))
    ck("the break is in the box, and the cursor never left it",
       (w.get("value") or "") == "One\nTwo" and w.get("note") is True,
       {"value": w.get("value"), "note": w.get("note")})

    # 6 ── ESCAPE PUTS THE BOX BACK AND WRITES NOTHING
    print("\n6 · Escape puts a box back, and nothing is written (§372's rule, "
          "without the removal)")
    ck("the cursor is in the first typed box", focus_nth(pg, 0) is True)
    t = lst(js(pg, TYPED))
    was = (t[0].get("value") if t else "") or ""
    rid = ((t[0].get("key") or "").split("\u0001")[1]) if t else ""
    before = dct(stored(pg, UNIT, rid)).get("v")
    pg.keyboard.press("Control+a")
    pg.keyboard.type("777")
    w = dct(js(pg, WHERE))
    ck("the box holds what was typed", (w.get("value") or "") == "777", w.get("value"))
    pg.keyboard.press("Escape")
    pg.wait_for_timeout(300)
    w = dct(js(pg, WHERE))
    ck("Escape puts the box back to what it was", (w.get("value") or "") == was,
       {"now": w.get("value"), "was": was})
    ck("...and keeps the cursor in it, so nothing is committed",
       w.get("tag") == "INPUT", w.get("tag"))
    ck("...and the stored row is untouched",
       dct(stored(pg, UNIT, rid)).get("v") == before,
       {"stored": dct(stored(pg, UNIT, rid)).get("v"), "before": before})

    print("\n6b · and a note is put back too")
    nb = js(pg, """()=>{var e=document.querySelector("[data-note],[data-cnote]");
      if(!e) return false; e.removeAttribute("tabindex"); e.value="Kept."; e.focus();
      return true;}""")
    ck("a note holds the cursor", nb is True, nb)
    pg.keyboard.press("End")
    pg.keyboard.type(" and more")
    pg.keyboard.press("Escape")
    pg.wait_for_timeout(300)
    w = dct(js(pg, WHERE))
    ck("the note reads what it held when the cursor arrived",
       (w.get("value") or "") == "Kept.", w.get("value"))

    # 7 ── ALT+N REACHES THE ROW'S OWN NOTE
    print("\n7 · Alt+N opens the note of the row the cursor is in (§61: the key "
          "is what keeps it reachable)")
    pair = js(pg, """()=>{var els=repTypedBoxes(), i;
      for(i=0;i<els.length;i++){
        var row=els[i].closest("tr");
        var n=row && row.querySelector("[data-note],[data-cnote]");
        if(n){ gapLight(els[i]); return {from:repKeyOf(els[i]), note:repKeyOf(n)}; }}
      return false;}""")
    pair = dct(pair)
    ck("a figure whose row has a note holds the cursor",
       bool(pair.get("from")) and bool(pair.get("note")), pair)
    pg.keyboard.press("Alt+n")
    pg.wait_for_timeout(350)
    w = dct(js(pg, WHERE))
    ck("...and Alt+N lands on THAT row's note, not on the page's first",
       w.get("note") is True and w.get("key") == pair.get("note"),
       {"landed": w.get("key"), "wanted": pair.get("note"), "note": w.get("note")})

    # 8 ── THE NOTE LEAVES THE TAB PATH UNLESS THE ROW IS AT RISK
    print("\n8 · the note is in the tab path exactly when the row is at risk")
    risk = js(pg, """(u)=>{var un=UNITS[u], last=un.items[un.items.length-1],
      m=last.measures[0];
      m.actual=String(Math.round((parseFloat(m.target)||100)*0.3))+
               (String(m.target).replace(/^[\\d.,\\s]+/,"")||"");
      m.note=""; paint(); return {id:m.id};}""", UNIT)
    pg.wait_for_timeout(500)
    pg.evaluate("()=>{var r=document.querySelectorAll('.rail .ritem');"
                "if(r.length) r[r.length-1].click();}")
    pg.wait_for_timeout(500)
    boxes = lst(js(pg, BOXES))
    nb = [x for x in boxes if x.get("note")]
    wanted = [x for x in nb if x.get("want")]
    quiet = [x for x in nb if not x.get("want")]
    ck("this pillar holds a note that is wanted AND one that is not (§255: the "
       "state is made, or one end goes unmeasured)",
       len(wanted) > 0 and len(quiet) > 0,
       {"wanted": len(wanted), "quiet": len(quiet), "made": dct(risk).get("id")})
    ck("a wanted note is in the tab path", all(x.get("tabindex") is None for x in wanted),
       [x.get("tabindex") for x in wanted[:3]])
    ck("...and a quiet one is not", all(x.get("tabindex") == "-1" for x in quiet),
       [x.get("tabindex") for x in quiet[:3]])
    ck("...and both still announce Alt+Enter and Escape, so the quiet one is "
       "reachable (§61)",
       all(sorted(x.get("ks") or []) == sorted(["Alt+Enter", "Escape"]) for x in nb),
       [x.get("ks") for x in nb[:3]])

    # 9 ── ALT+ENTER CONTINUES THE WALK
    #      REWRITTEN, never loosened (§218): the first version asserted that
    #      the cursor ended on a field carrying `data-gapat` — and
    #      `focus_nth()` lights the box it focuses, so that box ALREADY had
    #      it and the assertion was true however Alt+Enter behaved. The
    #      `no-walk` falsification duly came back 0 red (§113.8, §54.5).
    #      What can fail is that the cursor MOVED, and moved to the box the
    #      walk itself names — asserted as an AGREEMENT with
    #      `repWalkFields()` rather than against a row typed in here (§94.8).
    #      AND THE TARGET IS MADE (§255): the worked example answers every
    #      figure on this unit, so `repWalkFields()` is EMPTY and §279's bar
    #      draws no Next at all — measured, `walkfields: []` — so every
    #      assertion here would have had no subject on an untouched page, and
    #      the old one passed only on whatever §1–§8 had left unanswered,
    #      which is accidental state (§94.2).
    print("\n9 · Alt+Enter continues §279's walk from the box the cursor is in")
    settle(pg)
    blanked = js(pg, """(u)=>{var un=UNITS[u], ks=un.keyObjectives||[];
      var k=ks[ks.length-1]; if(!k) return false;
      k.__was = k.actual; k.actual = ""; paint(); return k.id;}""", UNIT)
    pg.wait_for_timeout(500)
    walk = dct(js(pg, """()=>({there: !!document.querySelector("[data-repnext]"),
      left: (function(b){ return b ? b.textContent.trim() : ""; })(
        document.querySelector("[data-repnext] .ngleft")),
      fields: repWalkFields().map(function(e){ return repKeyOf(e); })})"""))
    # AND THE TARGET IS ASKED OF THE PAGE, never built from a key spelt in
    # here (§94.8) — and asserted as MEMBERSHIP rather than as a list of
    # one: §279's walk holds every box Submit is waiting for, which
    # includes a NOTE owed an explanation (§105), so §5's typing leaves a
    # second entry beside the blanked figure and a length test reported a
    # correct build broken (§100.3). What can fail is that the blanked row
    # is IN that list and is where the cursor lands.
    target = js(pg, """(id)=>{var el = document.querySelector(
      '[data-rep="' + id + '"]'); return el ? repKeyOf(el) : "";}""", blanked)
    ck("the blanked figure is one of the boxes §279's walk is waiting for",
       bool(blanked) and bool(target) and target in (walk.get("fields") or []),
       {"blanked": blanked, "target": target, "fields": walk.get("fields")})
    ck("...and §279's bar draws Next with a count on it",
       walk.get("there") is True and "left" in (walk.get("left") or ""),
       {"there": walk.get("there"), "left": walk.get("left")})
    ck("the cursor is in a typed box", focus_nth(pg, 0) is True)
    w0 = dct(js(pg, WHERE))
    ck("...which is NOT the box the walk is waiting for, so a step is visible",
       bool(w0.get("key")) and w0.get("key") != target,
       {"here": w0.get("key"), "target": target})
    pg.keyboard.press("Alt+Enter")
    pg.wait_for_timeout(500)
    w = dct(js(pg, WHERE))
    ck("...and Alt+Enter moves the cursor to what Submit is waiting for",
       w.get("key") == target and w.get("gapat") is True,
       {"landed": w.get("key"), "target": target, "gapat": w.get("gapat")})
    ck("...and the hover on Next names the keys (1b-ii, §88: the hint rides a "
       "hover rather than being drawn)",
       "Alt+Enter" in (pg.evaluate(
           "()=>{var b=document.querySelector('[data-repnext]');"
           " return b ? (b.getAttribute('title')||'') : '';}") or ""),
       pg.evaluate("()=>{var b=document.querySelector('[data-repnext]');"
                   " return b ? (b.getAttribute('title')||'') : '';}"))
    # and the figure goes back, or §10 measures a page this section emptied
    settle(pg)
    js(pg, """(u)=>{var un=UNITS[u], ks=un.keyObjectives||[];
      var k=ks[ks.length-1];
      if(k && k.__was != null){ k.actual = k.__was; delete k.__was; paint(); }
      return true;}""", UNIT)
    pg.wait_for_timeout(400)
    # 10 ── A YES/NO ROW ANSWERED IN PROGRESS (the shape the step guards against)
    print("\n10 · a yes/no row's two halves are told apart (§300, §528's own "
          "identity)")
    # Through the same helper §4 uses — which also lands on the pillar the row
    # is in, because a unit's page draws ONE pillar at a time (§279) and §8 has
    # clicked the last rail item by now.
    ynid = make_yn(pg, UNIT)
    yn = {"id": ynid}
    ck("a yes/no row answered In progress is on the page", bool(ynid), ynid)
    halves = js(pg, """(id)=>[...document.querySelectorAll(REP_BOXES)]
      .filter(function(e){ return e.dataset.rep === id; })
      .map(function(e){ return {tag:e.tagName, part:e.dataset.ynpart||"",
        key:repKeyOf(e), typedIn: repTypedBoxes().indexOf(e) >= 0};});""",
                 yn.get("id"))
    halves = lst(halves)
    st = [x for x in halves if x.get("part") == "status"]
    pc = [x for x in halves if x.get("part") == "pct"]
    ck("both halves are drawn — a status and a per-cent (§300)",
       len(st) == 1 and len(pc) == 1, halves)
    ck("...sharing one data-rep and NOT one identity, or the step would read "
       "them as one box",
       bool(st) and bool(pc) and st[0].get("key") != pc[0].get("key"),
       {"status": st[0].get("key") if st else None, "pct": pc[0].get("key") if pc else None})
    ck("...and only the typed half is a step the cursor can land on",
       bool(st) and bool(pc) and pc[0].get("typedIn") is True
       and st[0].get("typedIn") is False,
       {"status": st[0].get("typedIn") if st else None,
        "pct": pc[0].get("typedIn") if pc else None})
    pg.keyboard.press("Escape")
    pg.wait_for_timeout(150)
    hit = js(pg, "(id)=>{var e=[...document.querySelectorAll(REP_BOXES)]"
                 ".filter(function(x){ return x.dataset.rep===id && x.dataset.ynpart==='pct'; })[0];"
                 " if(!e) return false; gapLight(e); return repKeyOf(e);}", yn.get("id"))
    ck("the per-cent holds the cursor", isinstance(hit, str) and hit, hit)
    pg.keyboard.press("Enter")
    pg.wait_for_timeout(450)
    w = dct(js(pg, WHERE))
    ck("...and Enter from it lands on a box rather than on the body",
       w.get("tag") in ("INPUT",), {"tag": w.get("tag"), "key": w.get("key")})

    # ── page errors
    print("\n11 · nothing threw while the keys were pressed")
    real = [e for e in errs if "favicon" not in e.lower()]
    ck("no console or page error", not real, real[:3])

    b.close()

for e in ERRS:
    print("  PROBE THREW  " + e)
print(("\n%d FAILED\n" % bad) if bad else "\nall report-keys checks passed\n")
raise SystemExit(1 if bad else 0)
