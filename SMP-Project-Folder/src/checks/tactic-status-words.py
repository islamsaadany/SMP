"""§411: a tactic's status is RHI's words, and the platform picks them.

Islam, fitting the platform to RHI: Completed · In progress · Delayed ·
Not due, and Not started at 0% -- with Delayed and Not due set by the
platform, never picked by anybody.

What this asserts, both ends every time (§94.2):
  · every Status pill on a unit's Performance page says what
    `tacticStatusWord()` says for that row, and only one of the five words --
    an AGREEMENT, never a list of expected words per row (§94.8);
  · each of the five states MADE on one tactic (§255), so a build that could
    only ever say "In progress" cannot pass by the demo happening to hold it;
  · Delayed needs the WHOLE window gone: a tactic halfway through and behind
    reads In progress, or Delayed would be a second, looser reading of the
    score beside it;
  · what is STORED is untouched -- `t.status` still holds the old spelling
    after the page is drawn (§96.2), because a workbook and a closed cycle
    read it.
"""
import os
import pathlib
from playwright.sync_api import sync_playwright

HERE = pathlib.Path(__file__).resolve().parent
FILE = pathlib.Path(os.environ.get("SMP_BUILT") or (HERE.parent / "strategy-management-platform.html"))
bad = 0
WORDS = ["Completed", "In progress", "Delayed", "Not due", "Not started"]


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
      const t = JSON.parse(JSON.stringify(UNITS['mobile'].items[0].tactics[0]));
      delete t.outcome; delete t.outTarget; delete t.outActual;
      REVIEW.asOfMonth = 'Jun ' + String(cycleYear() % 100);
      const at = (q, actual, status) => { t.q1 = q[0]; t.q2 = q[1]; t.q3 = q[2]; t.q4 = q[3];
        t.actual = actual; t.status = status; return tacticStatusWord(t); };
      return {
        done:    at([1,1,0,0], 100, 'Done'),
        doneEarly: at([0,0,1,1], 100, 'Done'),
        notdue:  at([0,0,1,1], null, 'Not started'),
        late:    at([1,1,0,0], 60, 'WIP'),
        lateNone: at([1,1,0,0], null, 'Not started'),
        wip:     at([0,1,1,0], 20, 'WIP'),
        behind:  at([1,1,1,1], 5, 'WIP'),
        todo:    at([0,1,1,0], 0, 'Not started'),
        todoNone: at([0,1,1,0], null, 'Not started'),
        stored:  t.status
      };
    }""")
    ck("Completed when it is done, whenever that is", r.get("done") == "Completed" and r.get("doneEarly") == "Completed", r)
    ck("Not due when its window has not begun", r.get("notdue") == "Not due", r)
    ck("Delayed when the whole window has passed unfinished", r.get("late") == "Delayed" and r.get("lateNone") == "Delayed", r)
    ck("In progress while the window is still running, behind or not", r.get("wip") == "In progress" and r.get("behind") == "In progress", r)
    ck("Not started at 0%, reported or not", r.get("todo") == "Not started" and r.get("todoNone") == "Not started", r)

    print("── 2 · the page says what the rule says, on every row")
    pg.click('#units [data-u="mobile"]')
    pg.wait_for_timeout(500)
    ev(pg, """() => { const b = [...document.querySelectorAll('[data-s]')].find(x => /^Performance/.test(x.textContent.trim())); if (b) b.click(); }""")
    pg.wait_for_timeout(800)
    rows = ev(pg, """() => {
      const out = [], u = UNITS['mobile'];
      const pills = [...document.querySelectorAll('#panel tr[data-oi] td.cc .pill')];
      u.items.forEach(p => (p.tactics || []).forEach(t => out.push({ want: tacticStatusWord(t), stored: t.status })));
      return { pills: pills.map(x => x.textContent.trim()), want: out };
    }""")
    pills = rows.get("pills", []) if isinstance(rows, dict) else []
    drawn = [p for p in pills if p in WORDS]
    ck("the page draws Status pills", len(drawn) > 0, rows)
    ck("every drawn status is one of the five words", all(p in WORDS for p in pills if p != "Not reported"), pills)
    wants = set(w["want"] for w in rows.get("want", [])) if isinstance(rows, dict) else set()
    ck("...and the set drawn is the set the rule answers for the shown pillar", set(drawn) <= wants, (drawn, wants))
    ck("nothing drawn still says Done or WIP", "Done" not in pills and "WIP" not in pills, pills)
    stored = [w["stored"] for w in rows.get("want", [])] if isinstance(rows, dict) else []
    ck("what is STORED is the old spelling, untouched", set(stored) <= {"WIP", "Done", "Not started", "Blocked"} and "WIP" in stored, set(stored))

    print("── 3 · a tactic that is not due says so once (§411.1)")
    nd = ev(pg, """() => {
      const p = UNITS['mobile'].items.find(x => (x.tactics||[]).length) , t = p.tactics[0];
      window.__k = JSON.stringify(t);
      t.q1 = false; t.q2 = false; t.q3 = false; t.q4 = true; t.actual = null;
      paint();
      const rows = [...document.querySelectorAll('#panel tr[data-oi]')].filter(r => r.textContent.includes(t.name));
      const txt = rows.map(r => r.textContent.replace(/\\s+/g, ' ')).join(' | ');
      p.tactics[0] = JSON.parse(window.__k); paint();
      return { word: tacticStatusWord(Object.assign({}, t, {q1:false,q2:false,q3:false,q4:true,actual:null})), n: rows.length, txt };
    }""")
    ck("the made tactic is not due and its row is on the page", isinstance(nd, dict) and nd.get("word") == "Not due" and nd.get("n", 0) > 0, nd)
    ck("...Status says Not due", isinstance(nd, dict) and "Not due" in nd.get("txt", ""), nd)
    ck("...and nothing beside it says Not yet due", isinstance(nd, dict) and "Not yet due" not in nd.get("txt", ""), nd)

    ck("no page error", not errs, errs)
    b.close()

print("\n" + ("tactic-status-words: all passed" if not bad else "%d FAILED" % bad))
raise SystemExit(1 if bad else 0)
