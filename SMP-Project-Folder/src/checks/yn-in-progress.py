"""AN ACTION HALF WAY THROUGH ITS WINDOW (§296).

Islam, of a yes/no action running Q2 and Q3 and reported after Q2: *"if we
report mid way it's either done or not and that is not fair"*. Reproduced on
the running platform before anything was proposed — at the end of June the
three answers available were blank (unanswered, so Submit is refused), No
(scores 0, and the red then demands a note for a failure that has not
happened) and Yes (untrue) — and the platform already knew the window was half
gone while the YTD Target column printed an em-dash.

He chose: a third answer, `In progress`, with a MANDATORY per-cent measured
against the share of the action's own window that has passed, so 60% at the
half-way point reads 120 — *"it should read 120 as 60% would lower the
progress value while it's not due in Q2"*.

WHAT THIS ASSERTS, AND WHY EACH ONE IS HERE

· THE STORED PLAN, NOT THE SCREEN. Every press is a real press on the real
  control and every reading is taken from the row afterwards (§96: a control
  that renders is not a control that acts).

· BOTH ENDS OF THE GATE (§94.2). `In progress` with no number must NOT answer
  the row — a build that accepted it would satisfy every "the third answer
  exists" assertion and quietly let a unit submit a report it has not made —
  so the pending state and the answered state are asserted separately, and the
  per-cent is then shown to clear both.

· THE NUMBER SURVIVES RE-PICKING. Two controls write one field, so choosing
  `In progress` a second time must not throw away what somebody typed
  (§96.2 — there is no undo).

· A KEPT LEGACY FIGURE IS STILL NOT SCORED. §257.2 keeps a figure when a row
  is switched to Y/N, so "28%" sits in `actual` on rows in the wild; the rule
  requires the WORD, and this asserts that such a row goes on scoring nothing.
  A build that read any bare number as "in progress" passes everything else
  here and silently moves stored scores.

· AND IT FITS (§158). The stacked control is the one Islam picked over side by
  side precisely on width, so the table is measured at three of them.

THE DEMO CANNOT SHOW ANY OF THIS — 0 of 210 targets in the worked example are
Y/N — so the state is MADE (§255).

PROVED ABLE TO FAIL: run against the previous build with
`SMP_FILE=/home/user/SMP/SMP-Project-Folder/strategy-management-platform-v3.22.html`
— 22 red, and honestly: every probe degrades rather than throwing (§215) and
the new rule is asked for BY NAME rather than leaned on to measure with
(§264.1). Both faults were committed here first and are recorded in the file.
"""
import os, pathlib
from playwright.sync_api import sync_playwright

SRC = pathlib.Path("/home/user/SMP/SMP-Project-Folder/src")
URL = "file://" + os.environ.get("SMP_FILE", str(SRC / "strategy-management-platform.html"))
UNIT = "b2becomm"
bad = 0


def ck(w, ok, x=""):
    global bad
    if not ok:
        bad += 1
    print(("  ok    " if ok else "  FAIL  ") + w + (("   — " + str(x)) if not ok and x else ""))


def js(pg, expr, arg=None):
    try:
        return pg.evaluate("(a)=>{try{return (" + expr + ")(a);}catch(e){return {__err:''+e};}}", arg)
    except Exception as e:
        return {"__err": str(e)}


def pick(pg, tid, v):
    """§215: a control that is not there is a FAILURE REPORTED, never a throw.
    The first run of this file against the shipped build died on a 30s timeout
    with every later assertion unmade, and `grep -c FAIL` read that crash as a
    clean run — in a file written to reject exactly that build."""
    sel = '[data-rep="%s"][data-yn]' % tid
    if pg.locator(sel).count() != 1:
        ck("the answer picker is there (to pick %r)" % v, False, "absent")
        return False
    pg.select_option(sel, v)
    pg.wait_for_timeout(430)
    return True


def typ(pg, tid, v):
    sel = '[data-rep="%s"][data-ynpct]' % tid
    if pg.locator(sel).count() != 1:
        ck("the per-cent box is there (to type %r)" % v, False, "absent")
        return False
    pg.fill(sel, v)
    pg.locator(sel).blur()
    pg.wait_for_timeout(430)
    return True


FILL = """(u)=>{const un=UNITS[u];
 (un.keyObjectives||[]).forEach(m=>{if(!m.actual)m.actual=m.target;m.note=m.note||"On plan.";});
 (un.items||[]).forEach(p=>{
   (p.measures||[]).forEach(m=>{if(!m.actual)m.actual=m.target;m.note=m.note||"On plan.";});
   (p.tactics||[]).forEach(t=>{
     if(!t.outcome)t.outcome="Something measurable"; if(!t.outTarget)t.outTarget="6 #";
     t.outActual=t.outTarget; if(t.actual==null||t.actual==="")t.actual=100;
     t.note=t.note||"On plan.";});});
 return true;}"""

MAKE = """(u)=>{const un=UNITS[u],p=un.items[0],t=p.tactics[0];
 t.name="Sign the distribution agreement with the regional partner";
 t.outcome="Agreement signed"; t.outTarget="Y/N"; t.outDir="="; t.outCompile="";
 delete t.outActual; t.q1=0;t.q2=1;t.q3=1;t.q4=0; t.note="";
 REVIEW.asOfMonth=monthValue(5,reviewYear());
 return {tid:t.id, share:tacticShare(t)};}"""

ROW = """(a)=>{const t=findById(unitLike(a.u),a.tid).obj;
 return {stored:t.outActual===undefined?null:t.outActual, status:t.status,
         score:tacticProgress(t), bench:tacticBenchmark(t),
         answered:tacticAnswered(t),
         /* §264.1: ASKED FOR BY NAME, NEVER LEANED ON. The first red run of
            this file reported six honest assertions as "rowPending is not
            defined" — the probe used the NEW rule to measure with, so on the
            build it exists to reject it took every neighbour down with it. */
         pending:(typeof rowPending==="function")
                   ? rowPending({kind:"tactic",obj:t}) : "no rowPending()",
         note:needsNote({kind:"tactic",obj:t})};}"""


def open_report(pg):
    pg.evaluate("""(u)=>{const p=PEOPLE.filter(p=>(p.role||'')==='super')[0];
      if(p)VIEWER=p.key; leaveModes(); current=u; paint();}""", UNIT)
    pg.wait_for_timeout(250)
    pg.evaluate("()=>{const b=document.querySelector('[data-s=performance]');if(b)b.click();}")
    pg.wait_for_timeout(250)
    pg.evaluate("()=>{const b=document.querySelector('[data-s=report]');if(b)b.click();}")
    pg.wait_for_timeout(500)


with sync_playwright() as p:
    b = p.chromium.launch()
    pg = b.new_page(viewport={"width": 1500, "height": 950})
    errs = []
    pg.on("pageerror", lambda e: errs.append(str(e)))
    pg.goto(URL)
    pg.wait_for_timeout(900)
    pg.evaluate("()=>{try{localStorage.setItem('smp.welcome.seen','1')}catch(e){}}")
    pg.evaluate(FILL, UNIT)
    info = pg.evaluate(MAKE, UNIT)
    tid = info["tid"]
    open_report(pg)

    print("\n§1  the action, before anybody answers")
    ck("its window share is a half (Q2-Q3, end of June)", info["share"] == 0.5, info["share"])
    r = js(pg, ROW, {"u": UNIT, "tid": tid})
    ck("unanswered", r.get("answered") is False, r)
    ck("the YTD Target column now shows the prorated target",
       r.get("bench") == "50%", r.get("bench"))

    print("\n§2  the picker offers a third answer")
    opts = pg.eval_on_selector_all(
        '[data-rep="%s"][data-yn] option' % tid, "els=>els.map(e=>e.value)")
    ck("— / Yes / In progress / No", opts == ["", "Yes", "In progress", "No"], opts)

    print("\n§3  picking In progress, and NOT saying how far")
    pick(pg, tid, "In progress")
    r = js(pg, ROW, {"u": UNIT, "tid": tid})
    ck("stored as the word", r.get("stored") == "In progress", r.get("stored"))
    ck("NOT scored", r.get("score") is None, r.get("score"))
    ck("still unanswered, so Submit stays shut", r.get("answered") is False, r)
    ck("and it is named as pending, not merely owed", r.get("pending") is True, r)
    ck("the row says Needs a %",
       pg.locator('td.cc .ynstack .missing').count() == 1,
       pg.locator('td.cc .ynstack .missing').count())
    ck("no note is demanded of it", r.get("note") is False, r)

    print("\n§4  saying how far — Islam's own example")
    typ(pg, tid, "60")
    r = js(pg, ROW, {"u": UNIT, "tid": tid})
    ck("stored as the word and the number", r.get("stored") == "In progress 60", r.get("stored"))
    ck("60 against 50 due reads 120", r.get("score") == 120, r.get("score"))
    ck("answered", r.get("answered") is True, r)
    ck("no longer pending", r.get("pending") is False, r)
    ck("no note demanded — it is ahead of plan", r.get("note") is False, r)
    ck("Needs a % is gone", pg.locator('td.cc .ynstack .missing').count() == 0)

    print("\n§5  re-picking In progress does not destroy the number")
    pick(pg, tid, "In progress")
    r = js(pg, ROW, {"u": UNIT, "tid": tid})
    ck("still 60", r.get("stored") == "In progress 60", r.get("stored"))

    print("\n§6  behind plan is still behind, and is explained")
    typ(pg, tid, "20")
    r = js(pg, ROW, {"u": UNIT, "tid": tid})
    ck("20 against 50 due reads 40", r.get("score") == 40, r.get("score"))
    ck("and a note IS demanded", r.get("note") is True, r)

    print("\n§7  yes and no are untouched (§257 still stands)")
    pick(pg, tid, "Yes")
    r = js(pg, ROW, {"u": UNIT, "tid": tid})
    ck("Yes scores 100", r.get("score") == 100, r.get("score"))
    ck("and the number is gone with it", r.get("stored") == "Yes", r.get("stored"))
    pick(pg, tid, "No")
    r = js(pg, ROW, {"u": UNIT, "tid": tid})
    ck("No scores 0", r.get("score") == 0, r.get("score"))
    pick(pg, tid, "")
    r = js(pg, ROW, {"u": UNIT, "tid": tid})
    ck("cleared, the key is DELETED (§50.6)", r.get("stored") is None, r.get("stored"))
    ck("and it is unanswered again", r.get("answered") is False, r)

    print("\n§8  a figure kept from before the row was made yes/no is STILL not scored")
    r2 = js(pg, """(a)=>{const t=findById(unitLike(a.u),a.tid).obj;
      t.outActual="28%"; return {score:tacticProgress(t), answered:tacticAnswered(t)};}""",
            {"u": UNIT, "tid": tid})
    ck("not scored (§257.2's kept value is untouched)", r2.get("score") is None, r2)

    print("\n§9  the table still fits its pane")
    pg.evaluate("""(a)=>{const t=findById(unitLike(a.u),a.tid).obj;
      t.outActual="In progress 60";}""", {"u": UNIT, "tid": tid})
    pg.evaluate("()=>paint()")
    pg.wait_for_timeout(400)
    for w in (1500, 1280, 1100):
        pg.set_viewport_size({"width": w, "height": 950})
        pg.wait_for_timeout(350)
        over = pg.evaluate("""()=>{let m=0;
          document.querySelectorAll('#panel .tblscroll').forEach(b=>{
            m=Math.max(m, b.scrollWidth-b.clientWidth);});return m;}""")
        ck("no sideways overflow at %dpx" % w, over == 0, over)
    pg.set_viewport_size({"width": 1500, "height": 950})

    print("\n§10  a part-way answer typed into the progress workbook")
    # The workbook is a FORM, not an export: "New value" is blank on download
    # and the reader ignores a row that leaves it so. The question is therefore
    # what happens when somebody TYPES a part-way answer into it — and the
    # target is given a kept number on purpose (§257.2 keeps a figure when a
    # row is switched to Y/N), because that is the one shape where the old
    # arithmetic would have found something to divide by.
    wb = js(pg, """(u)=>{const un=UNITS[u], k=un.keyObjectives[0];
      k.target="100 Y/N"; delete k.actual; delete k.progress;
      /* SHAPED THE WAY THE UPLOAD PARSER SHAPES IT — `sheetObjects` takes a
         rows-array with the head as row 0, not the sheet object the writer
         returns. Handing it the writer's object read as a clean parse of an
         empty file, which is the quiet way this probe could have passed
         while measuring nothing (§100.3). */
      const map={};
      progressWorkbook(un).forEach(sh=>{
        if(sh && sh.name && sh.head) map[sh.name]=[sh.head].concat(sh.rows||[]); });
      const sh=map["Objectives"]; if(!sh) return {__err:"no Objectives sheet"};
      const idc=sh[0].indexOf("ID"), nvc=sh[0].indexOf("New value");
      if(idc<0||nvc<0) return {__err:"columns moved: "+sh[0].join("|")};
      const row=sh.slice(1).filter(r=>r[idc]===k.id)[0];
      if(!row) return {__err:"the objective is not in the sheet"};
      row[nvc]="In progress 60";
      const got=progressFromWorkbook(un, map);
      if(!got.length) return {__err:"the reader saw nothing"};
      applyProgress(un, {rows:got.map(r=>({
        hit:findById(un, r.id), now:r.new_value}))});
      return {actual:k.actual===undefined?null:k.actual,
              progress:k.progress===undefined?null:k.progress,
              score:measureScore(k)};}""", UNIT)
    if wb.get("__err"):
        ck("the progress workbook takes a part-way answer", False, wb["__err"])
    else:
        ck("it arrives whole, never re-spelled",
           wb.get("actual") == "In progress 60", wb.get("actual"))
        ck("and no raw progress is invented from the kept number",
           wb.get("progress") is None, wb.get("progress"))
        ck("the row is scored by the rule, not by the sheet",
           wb.get("score") == 120, wb.get("score"))

    ck("no page error", not errs, errs[:2])
    b.close()

print("\n%d failures" % bad)
