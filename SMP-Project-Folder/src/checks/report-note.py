"""THE REPORTING NOTE WRAPS AND GROWS TO FIT (§254).

Islam, from a client's reporting page: *"make the reporting note to grow to fit
as well."* It was an `<input>` — one line by definition — so an explanation ran
off the end of its box and could only be read by scrolling sideways inside it.
Measured on the demo's own data before a line was written: **3 of 12 notes
clipped** on one unit's reporting page, the worst by 185px, and his own row
reproduced to the word.

§189's fault on the one prose field that round did not reach: it made the
PLAN's titles and descriptions wrap and the reporting note stayed as it was.

WHAT IS ASSERTED IS THE PROBLEM, NOT THE CONTROL (§94.8): nothing is cut off,
at two widths, with a note long enough to need more than one line. A later
change to which element draws it stays green as long as the note is readable.

BOTH SIDES OF THE SWITCH (A15): a unit's reporting page and a capability
function's are two panes with two hooks — `data-note` and `data-cnote` — and a
check that opened only the unit would not have seen the other stay an input.

AND BOTH ENDS (§113.8), or a build that made every row taller would pass: a
SHORT note is still one line high, so the table does not lose a row's worth of
height for every note in it.

THE COMMIT IS ASKED OF THE DATA, never of the box (§96): a box that shows a
note the graph does not hold is the same fault wearing a fix. And Enter still
COMMITS rather than opening a line (§229), which is what the `<input>` did —
so nothing about what a note may hold changes.

PROVED ABLE TO FAIL: against the pre-§254 build the long notes clip and the
control is an INPUT — 6 red.

Run:  SMP_CHROME=/opt/pw-browsers/chromium python3 qa-run.py checks/report-note.py
      SMP_NOTE_HTML=/tmp/old.html python3 qa-run.py checks/report-note.py
"""
import os, pathlib, sys
from playwright.sync_api import sync_playwright

HERE = pathlib.Path(__file__).resolve().parent
URL = "file://" + str(pathlib.Path(os.environ.get("SMP_NOTE_HTML") or
                                   (HERE.parent / "strategy-management-platform.html")))
bad = 0
errs = []

LONG = ("Rollout gated on the merchant app release. Recovery plan agreed with "
        "Ramy for Q3, and the pilot units carry it first.")
SHORT = "Pilot phase"


def ck(w, ok, x=""):
    global bad
    if not ok:
        bad += 1
    print(("  ok      " if ok else "  FAIL    ") + w + (("  — " + str(x)) if not ok and x else ""))


# A unit and a capability function: two panes, two hooks, one control.
SHAPES = [
    ("a unit", "mobile", "performance", False, "[data-note]", """(a)=>{ const v=a[0], s=a[1];
        const it = UNITS.mobile.items[0];
        (it.measures||[]).forEach((m,i) => { m.note = i ? s : v; });
        (UNITS.mobile.keyObjectives||[]).forEach(k => { k.note = v; });
      }"""),
    ("a capability function", "fn:finance", "fnperf", True, "[data-cnote]", """(a)=>{ const v=a[0], s=a[1];
        (GROUP.capabilities||[]).filter(c => c.fn === 'finance').forEach(c => {
          (c.keyObjectives||[]).forEach(k => { k.note = v; });
          (c.projects||[]).forEach(p => {
            (p.milestones||[]).forEach((m,i) => { m.note = i ? s : v; });
            (p.outcomes||[]).forEach(o => { o.note = v; });
          });
        });
      }"""),
]

with sync_playwright() as pw:
    b = pw.chromium.launch(executable_path="/opt/pw-browsers/chromium",
                           args=["--no-sandbox", "--disable-dev-shm-usage"])
    pg = b.new_page(viewport={"width": 1500, "height": 980})
    pg.on("pageerror", lambda e: errs.append(str(e)))
    pg.on("console", lambda m: errs.append(m.text) if m.type == "error" else None)
    pg.add_init_script("try{sessionStorage.setItem('smp.welcome.done','1');"
                       "localStorage.setItem('smp.tour.never','1')}catch(e){}")

    for name, target, tab, folded, hook, mk in SHAPES:
        for w in (1500, 1200):
            pg.set_viewport_size({"width": w, "height": 980})
            pg.goto(URL); pg.wait_for_timeout(1500)
            # The office, so every note box is drawn (canEnterNote).
            pg.evaluate("()=>{VIEWER=PEOPLE.filter(x=>SMPRules.mayEditAccess(world(),x))[0].key;}")
            if folded:
                pg.evaluate("""(t)=>{const f=document.querySelector('#units [data-fold]');
                    if(f && !document.querySelector('[data-u="'+t+'"]')) f.click();}""", target)
                pg.wait_for_timeout(300)
            pg.click('[data-u="%s"]' % target); pg.wait_for_timeout(400)
            pg.evaluate(mk, [LONG, SHORT])
            pg.evaluate("()=>{const b=document.querySelector('[data-s=report]'); if(b)b.click();}")
            pg.wait_for_timeout(900)

            got = pg.evaluate("""(hook)=>{
              const n=[...document.querySelectorAll('#panel .notefld' + hook)];
              if(!n.length) return {n:0};
              const box=e=>e.getBoundingClientRect();
              const clipped=n.filter(e =>
                e.scrollWidth > e.clientWidth + 1 || e.scrollHeight > e.clientHeight + 1);
              const oneLine=n.filter(e => box(e).height < 40).length;
              return { n:n.length, tags:[...new Set(n.map(e=>e.tagName))],
                       clipped:clipped.map(e=>[e.value.slice(0,30),
                         Math.max(e.scrollWidth-e.clientWidth, e.scrollHeight-e.clientHeight)]),
                       tall:n.filter(e => box(e).height > 40).length, oneLine:oneLine,
                       longest:Math.round(Math.max.apply(null, n.map(e=>box(e).height))) };}""", hook)
            tag = "%-24s @%d" % (name, w)
            ck("%s the note boxes are drawn" % tag, got["n"] > 0, got)
            if not got["n"]:
                continue
            # THE PROBLEM: nothing is cut off.
            ck("%s nothing is cut off" % tag, not got["clipped"], got["clipped"][:3])
            # ...because the box grew to hold it.
            ck("%s ...a long note took more than a line" % tag, got["tall"] > 0, got)
            # BOTH ENDS: a short note has not made the row taller.
            ck("%s ...and a short note is still one line" % tag, got["oneLine"] > 0, got)

    # ── WHAT IS TYPED LANDS, AND ENTER COMMITS ────────────────────────
    # Asked of the DATA (§96), on the unit's hook.
    pg.set_viewport_size({"width": 1500, "height": 980})
    pg.goto(URL); pg.wait_for_timeout(1500)
    pg.evaluate("()=>{VIEWER=PEOPLE.filter(x=>SMPRules.mayEditAccess(world(),x))[0].key;}")
    pg.click('[data-u="mobile"]'); pg.wait_for_timeout(400)
    pg.evaluate("()=>{const b=document.querySelector('[data-s=report]'); if(b)b.click();}")
    pg.wait_for_timeout(900)
    sel = "#panel .notefld[data-note]"
    pg.click(sel)
    pg.keyboard.press("Control+a")
    pg.keyboard.insert_text("Typed into the note")
    pg.wait_for_timeout(120)
    pg.keyboard.press("Tab")
    pg.wait_for_timeout(500)
    landed = pg.evaluate("""()=>{
      const u=UNITS.mobile, all=[];
      (u.keyObjectives||[]).forEach(k=>all.push(k.note));
      (u.items||[]).forEach(p=>{ (p.measures||[]).forEach(m=>all.push(m.note));
        (p.tactics||[]).forEach(t=>all.push(t.note)); });
      return all.filter(v=>/Typed into the note/.test(v||""))[0] || null;}""")
    ck("a typed note reaches the plan", landed == "Typed into the note", landed)

    # Enter commits (§229's rule, unchanged by the control): it must not open a
    # line inside a note the deck and the workbook print inline.
    pg.click(sel)
    pg.keyboard.press("End")
    pg.keyboard.press("Enter")
    pg.wait_for_timeout(120)
    pg.keyboard.insert_text("second")
    pg.wait_for_timeout(120)
    pg.keyboard.press("Tab")
    pg.wait_for_timeout(500)
    after = pg.evaluate("""()=>{
      const u=UNITS.mobile, all=[];
      (u.keyObjectives||[]).forEach(k=>all.push(k.note));
      (u.items||[]).forEach(p=>{ (p.measures||[]).forEach(m=>all.push(m.note)); });
      return all.filter(v=>/Typed into the note|second/.test(v||""))[0] || null;}""")
    ck("Enter does not open a line in a note",
       after is not None and "\n" not in after, (after or "").replace("\n", "\\n"))

    # A PASTE cannot leave one behind either (§253's rule at this field's door).
    pg.click(sel)
    pg.keyboard.press("Control+a")
    pg.keyboard.insert_text("Pasted one\nPasted two\n\n")
    pg.wait_for_timeout(120)
    pg.keyboard.press("Tab")
    pg.wait_for_timeout(500)
    pasted = pg.evaluate("""()=>{
      const u=UNITS.mobile, all=[];
      (u.keyObjectives||[]).forEach(k=>all.push(k.note));
      (u.items||[]).forEach(p=>{ (p.measures||[]).forEach(m=>all.push(m.note)); });
      return all.filter(v=>/Pasted one/.test(v||""))[0] || null;}""")
    ck("a pasted note is stored as one line",
       pasted == "Pasted one Pasted two", (pasted or "").replace("\n", "\\n"))

    # AND SOMEBODY WHO MAY NOT ENTER ONE STILL READS IT. Only the editable
    # branch of the cell changed, and a check watching the box alone would not
    # notice the read half going with it. The group CEO reaches Mobile's
    # reporting page and may not write its notes — measured, not assumed.
    #
    # THE FIRST VERSION OF THIS ASKED A VIEWER WITH NO ROLES AT ALL and got an
    # empty pane: they have no Reporting tab (§222), so it was measuring
    # nothing and reporting it as a finding (§100.3's shape, in a check).
    pg.evaluate("()=>{VIEWER='ceo'; paint();}")
    pg.wait_for_timeout(700)
    pg.evaluate("()=>{const b=document.querySelector('[data-s=report]'); if(b)b.click();}")
    pg.wait_for_timeout(800)
    read = pg.evaluate("""()=>({
      boxes:document.querySelectorAll('#panel .notefld').length,
      text:(document.querySelector('#panel')||{textContent:""})
             .textContent.indexOf('Pasted one Pasted two') > -1 })""")
    ck("a reader sees the note as text, with no box",
       read["boxes"] == 0 and read["text"], read)

    ck("nothing threw", not errs, errs[:1])
    b.close()

print(("\n%d FAILED" % bad) if bad else "\nall good")
sys.exit(1 if bad else 0)
