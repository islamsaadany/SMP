"""§575: a tactic measured in numbers is Completed at its WHOLE target, never
at the part of it due so far.

Islam, of D003 *Digitalizing Route to Market* on the live Performance page --
Q3 and Q4, *10k outlets coverage*, 8 reported at the end of Q3 against 5 due,
150%, and the pill reading **Completed** beside the reporter's own note *"to be
finalized Q4"*: *"someone reported a tactic is completed while in the ytd
actual is still in progress ... how can we resolve this"*. Nobody picked the
word. The reporting box set `Done` from a score of 100 or more, and the score
is against the PRORATED target -- so "ahead of what is due" read as "finished".
Agreed: Completed only when the figure reaches the full target; the row reads
In progress with its 150%, and rows already saved that way read right at once.

What this asserts, both ends every time (§94.2):
  · the rule, each state MADE on one tactic (§255): Islam's row in progress
    and not late; at and past the whole target Completed; a stored `Done`
    under the whole target no longer believed (rows saved before this heal on
    screen, with nothing migrated); the window gone at 8 of 10 is late; a
    yes/no outcome, a tactic with no outcome and an "at most" outcome read as
    they did; several outcomes are Completed only when every one is;
  · TYPED on the Reporting page through the real box: 8 stores `WIP`, not
    `Done`, and Performance draws In progress beside 150%; 10 stores `Done`
    and draws Completed; back to 8 goes back to `WIP`.
"""
import os
import pathlib
from playwright.sync_api import sync_playwright

HERE = pathlib.Path(__file__).resolve().parent
FILE = pathlib.Path(os.environ.get("SMP_BUILT") or (HERE.parent / "strategy-management-platform.html"))
bad = 0


def ck(w, ok, x=""):
    global bad
    if not ok:
        bad += 1
    print(("  ok      " if ok else "  FAIL    ") + w + (("  — " + str(x)) if not ok and x else ""))


def ev(pg, js):
    try:
        return pg.evaluate(js)
    except Exception as e:                                   # noqa: BLE001 — §215
        return {"threw": str(e).split("\n")[0]}


# Islam's row, MADE (§255): the demo carries it as a yes/no, the live tenant
# as a number. Q3–Q4, a target of 10 counted up over the window, the review
# at the end of September -- so half the window has passed and 5 are due.
ROW = r"""() => {
  const p = UNITS.mobile.items[1];
  window.__keep = { to: REVIEW.to, tactics: p.tactics };
  REVIEW.to = 'Sep ' + cycleYear();
  p.tactics = [{ id:'d3-route', name:'Digitalizing Route to Market', description:'',
    outcome:'10k outlets coverage', outDir:'≥', outTarget:'10 #', outCompile:'Sum',
    q1:0, q2:0, q3:1, q4:1, status:'Not started', actual:null, owner:'', note:'to be finalized Q4' }];
  current = 'mobile'; RAIL['unit:mobile'] = p.id;
  return p.tactics[0].id;
}"""
UNDO = """() => { const k = window.__keep, p = UNITS.mobile.items[1];
  REVIEW.to = k.to; p.tactics = k.tactics; paint(); return REVIEW.to === k.to; }"""

with sync_playwright() as pw:
    b = pw.chromium.launch()
    pg = b.new_page(viewport={"width": 1500, "height": 1000})
    errs = []
    pg.on("pageerror", lambda e: errs.append(str(e)))
    pg.add_init_script("try{sessionStorage.setItem('smp.welcome.done','1');"
                       "localStorage.setItem('smp.tour.never','1')}catch(e){}")
    pg.goto("file://" + str(FILE))
    pg.wait_for_timeout(900)

    print("── 1 · the rule, each state made on one tactic")
    r = ev(pg, """() => {
      if (typeof tacticStatusWord !== 'function') return { threw: 'no tacticStatusWord' };
      const was = REVIEW.to, y = String(cycleYear());
      /* several outcomes count only with their switch on (§414, §420) */
      const st = JSON.stringify(GROUP.structure === undefined ? null : GROUP.structure);
      GROUP.structure = JSON.parse(st) || {};
      GROUP.structure.details = Object.assign({}, GROUP.structure.details, { outcomes: true });
      ['top', 'mid', 'bu', 'fn'].forEach(k => { const l = GROUP.structure[k];
        if (l && l.details) l.details.outcomes = true; });
      const base = { id:'x', name:'x', outcome:'Outlets covered', outDir:'\\u2265', outTarget:'10 #',
                     outCompile:'Sum', q1:0, q2:0, q3:1, q4:1, actual:null };
      const at = (to, over) => { REVIEW.to = to + ' ' + y;
        const t = Object.assign({}, base, over);
        return [tacticStatusWord(t), tacticDelayed(t), tacticProgress(t)]; };
      const out = {
        islam:     at('Sep', { outActual:'8 #',  status:'WIP' }),
        storedDone:at('Sep', { outActual:'8 #',  status:'Done' }),
        whole:     at('Sep', { outActual:'10 #', status:'WIP' }),
        past:      at('Sep', { outActual:'12 #', status:'WIP' }),
        behind:    at('Sep', { outActual:'3 #',  status:'WIP' }),
        windowGone:at('Dec', { outActual:'8 #',  status:'Done' }),
        latest:    at('Sep', { outActual:'9 #',  outCompile:'Latest', status:'WIP' }),
        ynDone:    at('Sep', { outTarget:'Y/N', outCompile:'', outActual:SMPRules.YN_DONE, status:'Done' }),
        ynWip:     at('Sep', { outTarget:'Y/N', outCompile:'', outActual:SMPRules.ynJoin('wip', 80), status:'WIP' }),
        noOutcome: at('Sep', { outcome:'', outTarget:'', outActual:'', actual:100, status:'Done' }),
        noOutWip:  at('Sep', { outcome:'', outTarget:'', outActual:'', actual:60, status:'WIP' }),
        atMost:    at('Sep', { outDir:'\\u2264', outTarget:'5%', outCompile:'Latest', outActual:'4%', status:'Done' }),
        twoAhead:  at('Sep', { outActual:'8 #', outs:[{ id:'O2', outcome:'Agents trained', outTarget:'20 #', outCompile:'Sum' }],
                               outActs:{ O2:'15 #' }, status:'Done' }),
        twoWhole:  at('Sep', { outActual:'10 #', outs:[{ id:'O2', outcome:'Agents trained', outTarget:'20 #', outCompile:'Sum' }],
                               outActs:{ O2:'20 #' }, status:'WIP' }),
        twoHalf:   at('Sep', { outActual:'10 #', outs:[{ id:'O2', outcome:'Agents trained', outTarget:'20 #', outCompile:'Sum' }],
                               outActs:{ O2:'15 #' }, status:'Done' })
      };
      out.extras = tacticExtras(Object.assign({}, base, { outs:[{ id:'O2' }] })).length;
      REVIEW.to = was; out.back = REVIEW.to === was;
      const back = JSON.parse(st);
      if (back === null) delete GROUP.structure; else GROUP.structure = back;
      out.structBack = JSON.stringify(GROUP.structure === undefined ? null : GROUP.structure) === st;
      return out;
    }""")
    ck("the several-outcomes switch is on for the made tactics", r.get("extras") == 1, r.get("extras", r))
    ck("Islam's row: 8 of 10 with 5 due is In progress, not late, and still 150%",
       r.get("islam") == ["In progress", False, 150], r.get("islam", r))
    ck("...and a row SAVED as Done before this reads In progress too (nothing migrated)",
       r.get("storedDone") == ["In progress", False, 150], r.get("storedDone", r))
    ck("the whole target reached is Completed", r.get("whole", [None])[0] == "Completed", r.get("whole", r))
    ck("...and past it too", r.get("past", [None])[0] == "Completed", r.get("past", r))
    ck("behind what is due: In progress, as before", r.get("behind", [None])[0] == "In progress", r.get("behind", r))
    ck("its window gone at 8 of 10: In progress and late",
       r.get("windowGone", [None, None])[:2] == ["In progress", True], r.get("windowGone", r))
    ck("a Latest outcome at 9 of 10 is In progress", r.get("latest", [None])[0] == "In progress", r.get("latest", r))
    ck("a yes/no outcome: Done is Completed, In progress is In progress (unchanged)",
       r.get("ynDone", [None])[0] == "Completed" and r.get("ynWip", [None])[0] == "In progress", (r.get("ynDone"), r.get("ynWip")))
    ck("a tactic with no outcome: 100% delivered is Completed, 60% In progress (unchanged)",
       r.get("noOutcome", [None])[0] == "Completed" and r.get("noOutWip", [None])[0] == "In progress",
       (r.get("noOutcome"), r.get("noOutWip")))
    ck("an \"at most\" outcome within its target reads Completed, as before",
       r.get("atMost", [None])[0] == "Completed", r.get("atMost", r))
    ck("two outcomes both ahead but short of whole: In progress",
       r.get("twoAhead", [None])[0] == "In progress", r.get("twoAhead", r))
    ck("...both at whole: Completed", r.get("twoWhole", [None])[0] == "Completed", r.get("twoWhole", r))
    ck("...one whole and one short: In progress", r.get("twoHalf", [None])[0] == "In progress", r.get("twoHalf", r))
    ck("...and the review month and the switches are put back",
       r.get("back") is True and r.get("structBack") is True, r)

    print("── 2 · typed on the Reporting page, read on Performance")
    pg.click('#units [data-u="mobile"]')
    pg.wait_for_timeout(500)
    tid = ev(pg, ROW)
    pg.click('[data-s="report"]')
    pg.wait_for_timeout(700)

    def type_figure(v):
        try:
            return pg.evaluate("""(v) => {
          const t = UNITS.mobile.items[1].tactics[0];
          const el = document.querySelector('[data-rep="' + t.id + '"]');
          if (!el) return { err: 'no box' };
          el.value = v; el.dispatchEvent(new Event('change', { bubbles: true }));
          return { fld: el.dataset.fld, outActual: t.outActual, status: t.status,
                   word: tacticStatusWord(t), score: tacticProgress(t) };
        }""", v)
        except Exception as e:                               # noqa: BLE001 — §215
            return {"threw": str(e).split("\n")[0]}

    def perf_row():
        pg.click('[data-s="performance"]')
        pg.wait_for_timeout(600)
        pg.evaluate("() => document.querySelectorAll('.pbody[hidden]').forEach(x => x.hidden = false)")
        got = ev(pg, """() => {
          const tr = [...document.querySelectorAll('#panel tr[data-oi]')]
            .filter(r => r.textContent.includes('Digitalizing Route to Market')).pop();
          if (!tr) return { err: 'no row' };
          const pill = tr.querySelector('td.cc .pill'), prog = tr.querySelector('td.final');
          return { word: pill ? pill.textContent.trim() : null, late: !!tr.querySelector('.latemark'),
                   prog: prog ? prog.textContent.trim() : null };
        }""")
        pg.click('[data-s="report"]')
        pg.wait_for_timeout(600)
        return got

    g8 = type_figure("8")
    ck("the box is the outcome's", isinstance(g8, dict) and g8.get("fld") == "outActual", g8)
    ck("8 is stored as WIP, not Done", isinstance(g8, dict) and g8.get("status") == "WIP", g8)
    p8 = perf_row()
    ck("...and Performance draws In progress, not late, beside 150%",
       p8.get("word") == "In progress" and p8.get("late") is False and (p8.get("prog") or "").startswith("150"), p8)
    g10 = type_figure("10")
    ck("10 is stored as Done", isinstance(g10, dict) and g10.get("status") == "Done", g10)
    p10 = perf_row()
    ck("...and Performance draws Completed", p10.get("word") == "Completed", p10)
    g8b = type_figure("8")
    ck("back to 8 goes back to WIP", isinstance(g8b, dict) and g8b.get("status") == "WIP", g8b)
    ck("...and the row is put back", ev(pg, UNDO) is True)

    ck("no page error", not errs, errs)
    b.close()

print("\n" + ("tactic-completed: all passed" if not bad else "%d FAILED" % bad))
raise SystemExit(1 if bad else 0)
