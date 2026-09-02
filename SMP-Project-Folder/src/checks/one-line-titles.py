"""A TITLE IS ONE LINE, AND THE BOX SAYS SO (§255).

Islam, from a client's plan with the pen open: a tactic's name box 643px tall
holding one sentence, the description and the outcome the same, the eye and the
× floating in the middle of the empty space.

NOTHING WAS WRONG WITH THE BOX. §189 sizes a growing box to what is IN it, and
what was in it was blank lines — measured on the demo, thirty of them make a
643px box and a 962px row, which is the reported screen to the pixel. They are
invisible everywhere else: the same row reads 42px in reading mode, because
HTML collapses a line break, and the deck and both workbooks print these fields
on one line too. So the value could carry them for weeks and only the pen would
ever show it.

WHAT IS ASSERTED IS AGREEMENT, NEVER A PIXEL COUNT (§94.8): the box holding a
value with blank lines must be the same height as the box holding the same
words without them. A later change to the metrics stays green; a build that
sizes to the blank lines does not.

AND BOTH ENDS (§113.8), or a build that flattened every box would pass: a
rows-2 PARAGRAPH box — an aspiration, an end in mind, a capability's
definition — keeps its breaks, and what is typed into one is stored with them.

A UNIT AND A FUNCTION (A15), because they are two panes fed by one builder and
a check that opened only the unit would not see the other half drift.

THE COMMIT IS ASKED OF THE DATA, never of the box (§96): a box that shows one
line while the graph holds four is the same fault wearing a fix.

PROVED ABLE TO FAIL: against the pre-§255 build the tall boxes are 8 assertions
red, and the pasted value is stored with its breaks.

Run:  SMP_CHROME=/opt/pw-browsers/chromium python3 qa-run.py checks/one-line-titles.py
      SMP_ONELINE_HTML=/tmp/old.html python3 qa-run.py checks/one-line-titles.py
"""
import os, pathlib, sys
from playwright.sync_api import sync_playwright

HERE = pathlib.Path(__file__).resolve().parent
URL = "file://" + str(pathlib.Path(os.environ.get("SMP_ONELINE_HTML") or
                                   (HERE.parent / "strategy-management-platform.html")))
bad = 0
errs = []


def ck(w, ok, x=""):
    global bad
    if not ok:
        bad += 1
    print(("  ok      " if ok else "  FAIL    ") + w + (("  — " + str(x)) if not ok and x else ""))


# The fault as it was reported: a title, a description and an outcome each
# carrying blank lines nobody can see. Made rather than hoped for — the demo's
# own plan is clean (§94.2).
DIRTY_UNIT = """(() => {
  const it = UNITS[UNIT_KEYS[0]].items[0]; const t = it.tactics[0];
  t.name = "Utilize Raya shop as the digital interface" + "\\n".repeat(30);
  t.description = "Raya Trade and Raya Group" + "\\n".repeat(12);
  t.outcome = "Min 3 BUs On-boarded on Raya Shop" + "\\n".repeat(5);
  it.measures[0].name = "Orders processed digitally" + "\\n\\n";
  it.name = "Digital and Data-Driven Operations" + "\\n\\n\\n";
})()"""
DIRTY_FN = """(() => {
  const cap = (GROUP.capabilities||[]).filter(c => c.fn === 'finance' &&
    (c.projects||[]).length)[0];
  if (!cap) return; const p = cap.projects[0];
  p.name = "Rebuild the month-end close" + "\\n".repeat(20);
  p.brief = "What this project is for and what changes at the end of it." + "\\n\\n";
  (p.milestones||[]).forEach(m => {
    m.name = "Agree the new close calendar" + "\\n".repeat(8);
    m.covers = "The ten units and the two companies" + "\\n\\n"; });
  (p.outcomes||[]).forEach(o => { o.name = "Days to a signed set of accounts" + "\\n\\n"; });
})()"""

PANES = [
    ("a unit's Plan", DIRTY_UNIT,
     "()=>{current=UNIT_KEYS[0]; currentSub='strategy'; CURSEC.strategy='plan'; paint();}"),
    ("a function's Projects", DIRTY_FN, """()=>{
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

    # ── 1 · THE BOX IS DRAWN AS ONE LINE, ON BOTH SIDES OF THE SWITCH ──
    for name, mk, go in PANES:
        # §50.6: the pen TOGGLES, so a section that left it on turns it off.
        pg.evaluate("()=>{ leaveModes(); }")
        pg.evaluate("()=>{VIEWER=PEOPLE.filter(x=>SMPRules.mayEditAccess(world(),x))[0].key;}")
        pg.evaluate(go); pg.wait_for_timeout(300)
        pg.evaluate(mk)
        pg.evaluate("()=>{const b=document.querySelector('#panel .penbtn[data-page]');"
                    " if(b) b.click();}")
        pg.wait_for_timeout(700)

        got = pg.evaluate("""()=>{
          const g=[...document.querySelectorAll('#panel textarea.fld.grow')];
          if(!g.length) return {n:0};
          // AGREEMENT, never a number (§94.8): every box measured against a
          // clone of itself holding the same words with no breaks.
          const probe=document.createElement('textarea');
          const tall=[];
          g.forEach(t=>{
            const cs=getComputedStyle(t);
            probe.className=t.className; probe.style.cssText=cs.cssText;
            probe.style.height='auto'; probe.style.width=t.getBoundingClientRect().width+'px';
            probe.style.position='absolute'; probe.style.visibility='hidden';
            probe.value=t.value.replace(/[ \\t]*[\\r\\n]+[ \\t\\r\\n]*/g,' ').trim();
            t.parentNode.appendChild(probe);
            const want=probe.scrollHeight, have=t.scrollHeight;
            probe.remove();
            if (have > want + 4) tall.push([t.value.slice(0,24), have, want]);
          });
          return { n:g.length, tall:tall,
                   breaks:g.filter(t=>t.value.indexOf('\\n')>-1).length };}""")
        tag = "%-24s" % name
        ck("%s the pen opens" % tag, got["n"] > 0, got)
        if not got["n"]:
            continue
        # THE REPORTED FAULT: no box is taller than its own words need.
        ck("%s no box is sized to blank lines" % tag, not got["tall"], got["tall"][:3])
        # ...and the reason it is not: the box holds one line.
        ck("%s ...because none holds a break" % tag, got["breaks"] == 0, got)

    # ── 2 · WHAT IS TYPED OR PASTED IS STORED AS ONE LINE ──────────────
    # §229 stopped Enter; a paste was measured storing four lines verbatim.
    pg.evaluate("()=>{ leaveModes(); }")
    pg.evaluate("()=>{current=UNIT_KEYS[0]; currentSub='strategy'; CURSEC.strategy='plan'; paint();}")
    pg.wait_for_timeout(300)
    pg.evaluate("()=>{const b=document.querySelector('#panel .penbtn[data-page]');"
                " if(b) b.click();}")
    pg.wait_for_timeout(600)
    sel = "#panel table textarea.fld.grow"
    pg.click(sel)
    pg.keyboard.press("Control+a")
    pg.keyboard.insert_text("Line one\nLine two\n\n\n")
    pg.wait_for_timeout(150)
    pg.keyboard.press("Tab")      # blur is what commits (§35)
    pg.wait_for_timeout(400)
    typed = pg.evaluate("""()=>{
      const it=UNITS[UNIT_KEYS[0]].items[0];
      const all=(it.measures||[]).concat(it.tactics||[]).map(x=>x.name)
        .concat([it.name]);
      const hit=all.filter(v=>/Line one/.test(v||""))[0];
      const box=document.querySelector('#panel table textarea.fld.grow');
      return { stored:hit, boxH:Math.round(box.getBoundingClientRect().height),
               boxVal:box.value };}""")
    ck("a pasted value reaches the plan", bool(typed["stored"]), typed)
    ck("...and is stored as one line",
       typed["stored"] and "\n" not in typed["stored"], typed)
    ck("...keeping every word",
       (typed["stored"] or "").split() == ["Line", "one", "Line", "two"], typed)
    ck("...and the box shows what was stored",
       typed["boxVal"] == typed["stored"], typed)

    # ── 3 · BOTH ENDS: A PARAGRAPH BOX KEEPS ITS BREAKS ────────────────
    # An aspiration and an end in mind are rows-2 areas: prose that is MEANT
    # to hold paragraphs, and §229 leaves Enter alone in them for that reason.
    pg.evaluate("()=>{ leaveModes(); }")
    pg.evaluate("()=>{current=UNIT_KEYS[0]; currentSub='strategy'; "
                "CURSEC.strategy='found'; paint();}")
    pg.wait_for_timeout(300)
    pg.evaluate("()=>{const b=document.querySelector('#panel .penbtn[data-page]');"
                " if(b) b.click();}")
    pg.wait_for_timeout(600)
    para = "#panel textarea.fld:not(.grow)"
    n_para = pg.evaluate("()=>document.querySelectorAll('%s').length" % para)
    ck("the Foundation has paragraph boxes", n_para > 0, n_para)
    if n_para:
        pg.click(para)
        pg.keyboard.press("Control+a")
        pg.keyboard.insert_text("First line.\n\nSecond paragraph.")
        pg.wait_for_timeout(150)
        pg.keyboard.press("Tab")
        pg.wait_for_timeout(400)
        kept = pg.evaluate("""()=>{
          const u=UNITS[UNIT_KEYS[0]];
          const vals=[u.aspiration,u.endInMind].concat((u.clauses||[]).map(c=>c[1]));
          return vals.filter(v=>/First line/.test(v||""))[0] || null;}""")
        ck("a paragraph box keeps its break", kept and "\n\n" in kept,
           kept and kept.replace("\n", "\\n"))

    ck("nothing threw", not errs, errs[:1])
    b.close()

print(("\n%d FAILED" % bad) if bad else "\nall good")
sys.exit(1 if bad else 0)
