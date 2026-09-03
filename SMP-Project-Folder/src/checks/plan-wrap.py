"""PROSE YOU CAN READ WHILE YOU EDIT IT (§189).

Islam: *"wrap the content of the plans edit boxes across pillars and
functions, specially for the titles and descriptions, as they become hard to
read when the lines get long."*

IT WAS NOT THAT THEY WRAPPED BADLY — THEY COULD NOT WRAP AT ALL. Every title
and description on a plan was an `<input>`, which is a single line by
definition, so a long title ran past the end of its box and you scrolled
sideways inside it to read your own words.

WHAT IS ASSERTED IS THE PROBLEM, NOT THE CONTROL (§94.8): nothing clips, at
two widths, on BOTH sides of the switch. A later change to which element is
used stays green as long as the text is readable.

AND BOTH ENDS (§113.8), or a build that made every field a paragraph box
would pass: the PROSE fields grow, and the short ones — a direction, a
target, a picked owner — are still single-line, because giving those room to
wrap would make rows taller for nothing.

A UNIT AND A FUNCTION, because that is what Islam asked for and because they
are two panes fed by one builder (A15): the function's Projects pane is the
one that carries the milestones and the descriptions, and a check that only
opened a unit would never see them.

PROVED ABLE TO FAIL: against main's build every prose field is an INPUT and
the clip counts are 4 at 1440 and 8 at 1100.

THE PEN TOGGLES. §50.6 bit while this was being written: the first section
left it on, so pressing it for the second turned it OFF and the function's
pane reported zero editable fields. leaveModes() first, every time.

Run:  SMP_CHROME=/opt/pw-browsers/chromium python3 qa-run.py checks/plan-wrap.py
"""
import os, pathlib, sys
from playwright.sync_api import sync_playwright

HERE = pathlib.Path(__file__).resolve().parent
URL = "file://" + str(pathlib.Path(os.environ.get("SMP_WRAP_HTML") or
                                   (HERE.parent / "strategy-management-platform.html")))
bad = 0
errs = []


def ck(w, ok, x=""):
    global bad
    if not ok:
        bad += 1
    print(("  ok      " if ok else "  FAIL    ") + w + (("  — " + str(x)) if not ok and x else ""))


# Long enough to need more than one line in either pane, on the fields Islam
# named. Made rather than hoped for: the demo's own titles are mostly short.
LONG_UNIT = """(() => {
  const u = UNITS[UNIT_KEYS[0]]; const it = (u.items||[])[0]; if (!it) return;
  it.name = "Grow the Mobile category through partnerships with the regional carriers";
  it.sub  = "Everything that depends on somebody else's distribution network";
  (it.measures||[]).forEach(m => { m.name =
    "Revenue from post-paid subscriptions attached at the point of sale"; });
  (it.tactics||[]).forEach(t => { t.name =
    "Negotiate and sign the attachment agreement with the carrier group"; });
})()"""
LONG_FN = """(() => {
  const cap = (GROUP.capabilities||[]).filter(c => c.fn === 'finance' &&
    (c.projects||[]).length)[0];
  if (!cap) return; const p = cap.projects[0];
  p.name = "Rebuild the month-end close so the numbers land before the review";
  p.brief = "A long brief describing what this project is for, why it exists now, "
          + "and what the finance team expects to be different at the end of it.";
  (p.milestones||[]).forEach(m => {
    m.name = "Agree the new close calendar with every reporting unit";
    m.covers = "Covers the ten units and the two companies, and replaces the "
             + "spreadsheet that is emailed round on the last working day";
  });
  (p.outcomes||[]).forEach(o => { o.name =
    "Days from period end to a signed set of management accounts"; });
  (p.deliverables||[]).forEach(d => { d.name =
    "A published close calendar every unit has agreed to in writing"; });
})()"""

PANES = [
    ("a unit's Plan", LONG_UNIT,
     "()=>{current=UNIT_KEYS[0]; currentSub='strategy'; CURSEC.strategy='plan'; paint();}"),
    ("a function's Projects", LONG_FN, """()=>{
        const cap=(GROUP.capabilities||[]).filter(c=>c.fn==='finance'&&(c.projects||[]).length)[0];
        current='fn:finance'; currentSub='fnstrat'; CURSEC.fnstrat='proj';
        if(cap) RAIL['cap:'+cap.id]=cap.projects[0].id;
        paint();}"""),
]

with sync_playwright() as pw:
    b = pw.chromium.launch(executable_path="/opt/pw-browsers/chromium",
                           args=["--no-sandbox", "--disable-dev-shm-usage"])
    pg = b.new_page(viewport={"width": 1440, "height": 1000})
    pg.on("pageerror", lambda e: errs.append(str(e)))
    pg.on("console", lambda m: errs.append(m.text) if m.type == "error" else None)
    pg.add_init_script("try{sessionStorage.setItem('smp.welcome.done','1');"
                       "localStorage.setItem('smp.tour.never','1')}catch(e){}")
    pg.goto(URL); pg.wait_for_timeout(1400)

    for name, mk, go in PANES:
        for w in (1440, 1100):
            pg.set_viewport_size({"width": w, "height": 1000})
            # §50.6: the pen TOGGLES, so a section that left it on turns it off
            # for the next one — which reported a pane as having no fields.
            pg.evaluate("()=>{ leaveModes(); }")
            pg.evaluate("()=>{VIEWER=PEOPLE.filter(x=>SMPRules.mayEditAccess(world(),x))[0].key;}")
            pg.evaluate(go); pg.wait_for_timeout(400)
            pg.evaluate(mk)
            pg.evaluate("()=>{const b=document.querySelector('#secrow-in .secpen');"
                        " if(b) b.click();}")
            pg.wait_for_timeout(700)

            got = pg.evaluate("""()=>{
              const all=[...document.querySelectorAll('#panel .fld')];
              const clipped=all.filter(e=>e.scrollWidth>e.clientWidth+1).length;
              const grow=all.filter(e=>e.classList.contains('grow'));
              const tall=grow.filter(e=>e.getBoundingClientRect().height>30).length;
              const scrolls=grow.filter(e=>e.scrollHeight>e.clientHeight+1).length;
              const short=all.filter(e=>!e.classList.contains('grow'));
              return { fields:all.length, clipped:clipped, grow:grow.length,
                       tall:tall, scrolls:scrolls, short:short.length,
                       shortAreas:short.filter(e=>e.tagName==='TEXTAREA').length };}""")
            tag = "%-22s @%d" % (name, w)
            ck("%s the pen opens" % tag, got["fields"] > 0, got)
            if not got["fields"]:
                continue
            # THE PROBLEM, not the control.
            ck("%s nothing is cut off" % tag, got["clipped"] == 0, got)
            ck("%s prose fields exist" % tag, got["grow"] > 0, got)
            ck("%s ...and at least one grew past a line" % tag, got["tall"] > 0, got)
            # A box sized to fit never scrolls inside itself; one that does is
            # a box that is still hiding words.
            ck("%s ...and none of them scrolls" % tag, got["scrolls"] == 0, got)
            # BOTH ENDS: the short fields are still short.
            ck("%s the short fields stay single-line" % tag,
               got["short"] > 0 and got["shortAreas"] == 0, got)

    ck("nothing threw", not errs, errs[:1])
    b.close()

print(("\n%d FAILED" % bad) if bad else "\nall good")
sys.exit(1 if bad else 0)
