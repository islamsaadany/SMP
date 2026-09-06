"""A YES OR A NO THAT CAN BE UNDER WAY (§300).

Islam: *"sometimes we have a directly y/n situation like getting profitable so
nothing to be in progress there but some y/n can take in the in progress like
an agrement we are working on"* — and, of three shapes put to him, C: ONE kind
of Y/N row, and the REPORTING control gains the middle answer. Then, of the
first drawing: *"there is no not yet answer. it's either Done, In progress,
Didn't Start"* and *"for the inprogress and the % we used ot have them 2
stached boxes not one as you showed"* — both of which are him pointing at
§104's own control, which the product already has one column over.

WHAT IS ASSERTED, and why each one is here:

  · THE THREE ANSWERS ARE THE PRODUCT'S OWN WORDS. Not started and Done are
    what a tactic's Status column has said since the model was written, so a
    third vocabulary was never on the table (§87's twins).

  · TWO BOXES, NOT ONE. A status picker, and a per-cent box drawn only while
    the answer is In progress — asserted as two SEPARATE controls, because a
    build that merged them into one field satisfies every "you can say 60%"
    assertion and is the drawing Islam sent back.

  · THE PARTIAL IS JUDGED AGAINST THE ROW'S OWN WINDOW. His case, in his
    numbers: an action running Q2 and Q3, 60% at the end of Q2, reads 120 —
    60 against the 50 that window owes. Asserted as AGREEMENT with
    `tacticShare`, never as a literal, so a change to the review point stays
    green and a change to the arithmetic does not.

  · AND A ROW WITH NO WINDOW READS AS ITSELF. A key measure names no quarters,
    so 60% is 60 — inventing a straight line to December would mark a December
    commitment behind all year (§239's own refusal for Latest and Average).

  · DONE DOES NOT PRORATE (his call): 100 whenever it arrives, on a window
    half elapsed and on none at all. Asserted at both ends, because a build
    that prorated everything passes the partial's assertion perfectly.

  · AN IN PROGRESS WITH NO PER-CENT IS NOT AN ANSWER. The row is not counted,
    the box says `Needs a %`, and Submit waits for it — §104.10's rule, and
    the reason the middle answer cannot be used to skip a figure.

  · NOTHING ALREADY REPORTED MOVES. `Yes` and `No` are every Y/N figure a
    tenant holds today; they score 100 and 0 exactly as §257 says and are
    READ in the new words without being rewritten (§96.2).

  · BOTH SIDES OF THE SWITCH (§53.5, A15): a capability function's reporting
    page draws the same pair, where it drew a free text box before.

Proved able to fail (§94.5): against the build before §300 it goes red from
its first section. `SMP_BUILT` points it at another build.

Run:  SMP_CHROME=/opt/pw-browsers/chromium python3 qa-run.py checks/yn-in-progress.py
"""
import os
import pathlib
from playwright.sync_api import sync_playwright

HERE = pathlib.Path(__file__).resolve().parent
FILE = pathlib.Path(os.environ.get("SMP_BUILT") or (HERE.parent / "strategy-management-platform.html"))
bad = 0
SEL = "select[data-ynpart=status]"
PCT = "input[data-ynpart=pct]"


def ck(w, ok, x=""):
    global bad
    if not ok:
        bad += 1
    print(("  ok      " if ok else "  FAIL    ") + w + (("  — " + str(x)) if not ok and x else ""))


class Blank:
    """§215: what a probe that threw answers with — truthy, unequal to
    everything, readable by key and by index, so a failed measurement fails
    its assertion instead of ending the run."""

    def __init__(self, why):
        self.why = why

    def __getitem__(self, k):
        return self

    def get(self, k, d=None):
        return self

    def __bool__(self):
        return True

    def __eq__(self, other):
        return False

    def __repr__(self):
        return "probe threw — " + self.why


def ev(pg, js):
    js = js.replace("SELPLACE", SEL).replace("PCTPLACE", PCT)
    try:
        return pg.evaluate(js)
    except Exception as e:                                   # noqa: BLE001
        return Blank(str(e).split("\n")[0])


# The state is MADE: not one row in the worked example is a yes/no row, so
# every assertion below would pass on a build that lost the feature entirely
# if it waited for the demo to provide one (§94.2, §255).
MAKE = """() => {
  current = 'mobile'; CURSEC = null; REPORTING = null;
  const u = UNITS['mobile'], p = u.items[0];
  const t = p.tactics[0], m = p.measures[0];
  /* the action runs Q2 and Q3, and the cycle is reported at the end of Q2 —
     half its own window, which is the whole of Islam's example. */
  t.q1 = false; t.q2 = true; t.q3 = true; t.q4 = false;
  t.outcome = 'Agreement signed'; t.outTarget = 'Y/N';
  t.outCompile = ''; t.outDir = '\\u2265';
  delete t.outActual; t.status = 'Not started';
  m.target = 'Y/N'; delete m.actual;          /* a row that names NO window */
  REVIEW.asOfMonth = 'Jun ' + String(cycleYear() % 100);
  paint();
  return { tactic: t.id, measure: m.id, share: tacticShare(t) };
}"""

with sync_playwright() as pw:
    b = pw.chromium.launch()
    pg = b.new_page(viewport={"width": 1500, "height": 1000})
    errs = []
    pg.on("pageerror", lambda e: errs.append(str(e)))
    pg.on("console", lambda m: errs.append(m.text) if m.type == "error" else None)
    pg.add_init_script("try{sessionStorage.setItem('smp.welcome.seen','1')}catch(e){}")
    pg.goto("file://" + str(FILE))
    pg.wait_for_timeout(800)

    print("\n── 1 · the answers are the product's own three words")
    w = ev(pg, """() => ({
      words: SMPRules.YN_WORDS,
      state: ['Not started', 'In progress', 'In progress 60', 'Done', 'Yes', 'No', '', '42']
               .map(v => SMPRules.ynState(v).status + ':' + SMPRules.ynState(v).pct),
      join:  [SMPRules.ynJoin('todo'), SMPRules.ynJoin('wip'),
              SMPRules.ynJoin('wip', 60), SMPRules.ynJoin('done'), SMPRules.ynJoin('')],
      shown: [SMPRules.ynShown('In progress 60'), SMPRules.ynShown('Yes'),
              SMPRules.ynShown('No'), SMPRules.ynShown('')]
    })""")
    ck("the three answers are Not started · In progress · Done",
       w["words"] == ["Not started", "In progress", "Done"], w)
    ck("...and the tactic's own Status column already said two of them",
       ev(pg, """() => { const t = {status:'Done'};
         return SMPRules.YN_WORDS.indexOf('Done') > -1 &&
                SMPRules.YN_WORDS.indexOf('Not started') > -1; }""") is True)
    ck("a stored answer reads back as itself, and an old Yes/No still reads",
       w["state"] == ["todo:null", "wip:null", "wip:60", "done:null",
                      "done:null", "todo:null", ":null", ":null"], w["state"])
    ck("...and is written by ONE joiner",
       w["join"] == ["Not started", "In progress", "In progress 60", "Done", ""], w["join"])
    ck("what is DRAWN is the words, never the stored spelling",
       w["shown"] == ["In progress · 60%", "Done", "Not started", ""], w["shown"])

    print("\n── 2 · the partial is judged against the row's own window")
    sc = ev(pg, """() => ({
      half:  SMPRules.ynScore('In progress 60', 0.5),
      none:  SMPRules.ynScore('In progress 60', null),
      unbegun: SMPRules.ynScore('In progress 10', 0),
      nopct: SMPRules.ynScore('In progress', 0.5),
      doneHalf: SMPRules.ynScore('Done', 0.5),
      doneNone: SMPRules.ynScore('Done', null),
      todo:  SMPRules.ynScore('Not started', 0.5),
      silent: SMPRules.ynScore('', 0.5),
      old:   [SMPRules.ynScore('Yes'), SMPRules.ynScore('No')]
    })""")
    ck("60% of a half-elapsed window reads 120 — ahead", sc["half"] == 120, sc)
    ck("...and with NO window it reads as itself", sc["none"] == 60, sc)
    ck("a window that has not begun owes nothing, so it is not scored",
       sc["unbegun"] is None, sc)
    ck("In progress with no per-cent is not scored at all", sc["nopct"] is None, sc)
    ck("Done is 100 whenever it arrives — both ends (Islam's call)",
       sc["doneHalf"] == 100 and sc["doneNone"] == 100, sc)
    ck("Not started is 0 and silence is not scored", sc["todo"] == 0 and sc["silent"] is None, sc)
    ck("nothing already reported moves: Yes 100, No 0", sc["old"] == [100, 0], sc)

    print("\n── 3 · the control is TWO boxes, and only where the number is owed")
    made = ev(pg, MAKE)
    pg.wait_for_timeout(300)
    ck("the made window is half elapsed (Q2 of Q2–Q3, reported at Q2)",
       made and made["share"] == 0.5, made)
    ev(pg, """() => { const b = document.querySelector('[data-s=report]'); if (b) b.click(); }""")
    pg.wait_for_timeout(700)
    TID = str(made["tactic"]) if not isinstance(made, Blank) else ""
    globals()["SEL"] = "select[data-ynpart=status][data-rep='" + TID + "']"
    globals()["PCT"] = "input[data-ynpart=pct][data-rep='" + TID + "']"
    c0 = ev(pg, """() => {
      const s = document.querySelector("SELPLACE");
      if (!s) return { none: true };
      return { opts: [...s.options].map(o => o.value),
               words: [...s.options].map(o => o.textContent.trim()),
               pctBox: !!document.querySelector("PCTPLACE"),
               plain: !!document.querySelector('input[data-rep="' + s.dataset.rep + '"]:not([data-ynpart])') }; }""")
    ck("the answer is picked, in the three words plus a blank",
       not c0.get("none") and c0.get("opts") == ["", "todo", "wip", "done"] and
       c0.get("words") == ["—", "Not started", "In progress", "Done"], c0)
    ck("...and there is no free text box for that row beside it",
       not c0.get("none") and c0.get("plain") is False, c0)
    ck("the per-cent box is NOT drawn until the answer asks for one",
       not c0.get("none") and c0.get("pctBox") is False, c0)

    print("\n── 4 · In progress asks for the number, and waits for it")
    before = ev(pg, """() => reportedCount(unitLike(current)).done""")
    ev(pg, """() => { const s = document.querySelector("SELPLACE");
      s.value = 'wip'; s.dispatchEvent(new Event('change', {bubbles:true})); }""")
    pg.wait_for_timeout(400)
    c1 = ev(pg, """() => {
      const box = document.querySelector("PCTPLACE");
      const t = findById(unitLike(current), '""" + str(made["tactic"] if not isinstance(made, Blank) else "") + """');
      return { box: !!box,
               needs: !!document.querySelector('.pctneed'),
               stacked: box ? getComputedStyle(box.closest('.ynpct')).display : null,
               stored: t && t.obj.outActual,
               answered: t && rowAnswered({kind:'tactic', obj:t.obj}),
               done: reportedCount(unitLike(current)).done }; }""")
    ck("picking In progress draws a SECOND box for the per-cent",
       c1.get("box") is True, c1)
    ck("...on its own line under the answer, never beside it in one field",
       c1.get("stacked") == "flex", c1)
    ck("...and says the number is owed", c1.get("needs") is True, c1)
    ck("the answer is stored whole, as the platform's own word",
       c1.get("stored") == "In progress", c1)
    ck("...and the row is NOT counted as answered until it says how far",
       c1.get("answered") is False and c1.get("done") == before, c1)

    print("\n── 5 · the number lands, and reads against the window")
    ev(pg, """() => { const i = document.querySelector("PCTPLACE");
      i.value = '60'; i.dispatchEvent(new Event('change', {bubbles:true})); }""")
    pg.wait_for_timeout(400)
    c2 = ev(pg, """() => {
      const t = findById(unitLike(current), '""" + str(made["tactic"] if not isinstance(made, Blank) else "") + """');
      const o = t && t.obj;
      return { stored: o && o.outActual, status: o && o.status,
               score: o && tacticOutcomeScore(o),
               agrees: o && tacticOutcomeScore(o) === Math.round(60 / tacticShare(o)),
               bench: o && tacticBenchmark(o),
               shown: o && outcomeShown(o),
               answered: o && rowAnswered({kind:'tactic', obj:o}) }; }""")
    ck("the two halves write ONE field", c2.get("stored") == "In progress 60", c2)
    ck("...and it scores 120, which is 60 against its own window",
       c2.get("score") == 120 and c2.get("agrees") is True, c2)
    ck("the benchmark says what was due by now", c2.get("bench") == "50%", c2)
    # AND IT IS PRINTED WHERE IT IS A COMPARISON, AND NOT WHERE IT IS NOT:
    # "In progress · 60% / 50%" is a sentence; "Done / 50%" is not. The
    # reporting column keeps asking `measureDueLabel` — there it is telling a
    # reporter what is owed rather than comparing anything.
    bb = ev(pg, """() => {
      const o = findById(unitLike(current), '""" + str(made["tactic"] if not isinstance(made, Blank) else "") + """').obj;
      const oc = outcomeOf(o), sh = tacticShare(o);
      const at = v => { const c = Object.assign({}, oc, {actual: v});
        return [benchBeside(c, sh), measureDueLabel(c, sh)]; };
      return { wip: at('In progress 60'), done: at('Done'),
               todo: at('Not started'), silent: at('') }; }""")
    ck("beside a partial the benchmark is printed", bb.get("wip") == ["50%", "50%"], bb)
    ck("...and beside Done or Not started it is not",
       bb.get("done") == [None, "50%"] and bb.get("todo") == [None, "50%"], bb)
    ck("...while an unanswered row still learns what is due",
       bb.get("silent") == [None, "50%"], bb)
    ck("the figure reads in words on the page", c2.get("shown") == "In progress · 60%", c2)
    ck("the row counts as answered now", c2.get("answered") is True, c2)
    ck("the tactic's status follows the ANSWER, not the 120",
       c2.get("status") == "WIP", c2)

    print("\n── 6 · Done clears the number; the answer can be taken back")
    ev(pg, """() => { const s = document.querySelector("SELPLACE");
      s.value = 'done'; s.dispatchEvent(new Event('change', {bubbles:true})); }""")
    pg.wait_for_timeout(400)
    c3 = ev(pg, """() => {
      const o = findById(unitLike(current), '""" + str(made["tactic"] if not isinstance(made, Blank) else "") + """').obj;
      return { stored: o.outActual, score: tacticOutcomeScore(o), status: o.status,
               box: !!document.querySelector("PCTPLACE") }; }""")
    ck("Done stores the word alone — a stale 60 behind it would be unreadable",
       c3.get("stored") == "Done", c3)
    ck("...and scores 100, not 200 for having finished early", c3.get("score") == 100, c3)
    ck("...and the per-cent box is gone with the state that asked for it",
       c3.get("box") is False, c3)
    ck("the status reads Done", c3.get("status") == "Done", c3)
    ev(pg, """() => { const s = document.querySelector("SELPLACE");
      s.value = ''; s.dispatchEvent(new Event('change', {bubbles:true})); }""")
    pg.wait_for_timeout(400)
    c4 = ev(pg, """() => {
      const o = findById(unitLike(current), '""" + str(made["tactic"] if not isinstance(made, Blank) else "") + """').obj;
      return { has: 'outActual' in o, score: tacticOutcomeScore(o) }; }""")
    ck("clearing the answer DELETES the key (§50.6), and stops scoring",
       c4.get("has") is False and c4.get("score") is None, c4)

    print("\n── 7 · a row that names no window reads as itself")
    c5 = ev(pg, """() => {
      const u = UNITS['mobile'], m = u.items[0].measures[0];
      m.actual = 'In progress 60';
      const r = { score: measureScore(m), due: measureDueLabel(m),
                  fig: figShown(m), answered: rowAnswered({kind:'measure', obj:m}) };
      m.actual = 'In progress';
      r.pending = measureScore(m); r.pendAnswered = rowAnswered({kind:'measure', obj:m});
      delete m.actual;
      return r; }""")
    ck("60% on a key measure reads 60 — no straight line is invented",
       c5.get("score") == 60, c5)
    ck("...and no benchmark is printed where nothing was due",
       c5.get("due") is None, c5)
    ck("...and it reads in the words", c5.get("fig") == "In progress · 60%", c5)
    ck("an In progress with no number is unanswered here too",
       c5.get("pending") is None and c5.get("pendAnswered") is False and
       c5.get("answered") is True, c5)

    print("\n── 8 · both sides of the switch")
    c6 = ev(pg, """() => {
      const fk = Object.keys(FUNCTIONS).find(k => (FUNCTIONS[k].format || '') !== 'pillars');
      const f = FUNCTIONS[fk], caps = capsOfFunction ? capsOfFunction(fk) : null;
      const cap = (caps && caps[0]) || (GROUP.capabilities || []).find(c => c.fn === fk);
      if (!cap) return { none: 'no capability' };
      const ko = (cap.keyObjectives || [])[0];
      if (!ko) return { none: 'no key objective' };
      const was = ko.target;
      ko.target = 'Y/N';
      const html = capEntryBox(ko, '', true, ko.name);
      const plain = capEntryBox({id:'x', target:'6 #', actual:null}, '#', true, 'n');
      ko.target = was;
      return { pick: html.indexOf('data-ynpart="status"') > -1,
               words: SMPRules.YN_WORDS.every(x => html.indexOf(x) > -1),
               crep: html.indexOf('data-crep') > -1,
               plainStillTyped: plain.indexOf('data-ynpart') === -1 &&
                                plain.indexOf('<input') > -1 }; }""")
    ck("a capability function's reporting asks with the same pair",
       c6.get("pick") is True and c6.get("words") is True and c6.get("crep") is True, c6)
    ck("...and a numbered row there still gets a plain box (both ends)",
       c6.get("plainStillTyped") is True, c6)

    print("\n── 9 · the page said nothing on the console")
    ck("no page error while driving all of it", not errs, errs[:3])

    b.close()

print("\n" + ("  " + str(bad) + " FAILED" if bad else "  all §300 checks passed"))
