"""A company without business units still reads its functions (§601).

§593 gave the functions their own two cards and their own "where to look
next" on the group page — but only where the group has units. A client with
no units (El Abd) is all functions under one company, and its page showed
none of them: the company's own objectives and directions, and nothing for
the eight functions that do most of the work.

BOTH ENDS (§94.2): with units, the row sits under the units' two cards as
before; with the units layer off, the same two cards and the same strip are
drawn, leading with no gap, and they read the very figure the drill lists.
It MAKES its state (§255). SMP_BUILT points it at another build (§276).
"""
import os
from playwright.sync_api import sync_playwright

BUILT = os.environ.get("SMP_BUILT") or os.path.join(os.path.dirname(__file__), "..", "strategy-management-platform.html")
bad = 0
def ck(name, ok, detail=""):
    global bad
    print(("  ok   " if ok else "  FAIL ") + name + ("" if ok else "  — " + str(detail)))
    if not ok: bad += 1

READ = """()=>{ current='group'; currentSub='performance'; paint();
  var b=document.querySelector('button[data-sec="0"]'); if(b) b.click();
  var rows=[...document.querySelectorAll('.scores')].filter(x=>!x.closest('.pane'));
  var fnRow=rows.find(r=>/\\u2014 execution/.test(r.textContent) && r.textContent.indexOf(L('fnword','bu'))>=0);
  var strip=[...document.querySelectorAll('.ustrip-h')].map(h=>h.textContent);
  var r=fnsReading(boardFunctionKeys());
  return { units:SMPRules.buExists(GROUP), fns:boardFunctionKeys().length,
    row:!!fnRow, gaps:fnRow?fnRow.querySelectorAll('.scores-gap').length:-1,
    text:fnRow?fnRow.textContent:'', perf:r.perf, exec:r.exec,
    strip:strip.filter(t=>t.indexOf(L('fnword','bu'))>=0).length,
    go:document.querySelectorAll('.ustrip [data-go^="fn:"]').length }}"""

with sync_playwright() as p:
    b = p.chromium.launch(executable_path=os.environ.get("SMP_CHROME") or None)
    pg = b.new_page()
    errs = []; pg.on("pageerror", lambda e: errs.append(str(e)))
    pg.add_init_script("try{sessionStorage.setItem('smp.welcome.done','1');localStorage.setItem('smp.tour.never','1')}catch(e){}")
    pg.goto("file://" + os.path.abspath(BUILT)); pg.wait_for_timeout(1200)

    a = pg.evaluate(READ)
    ck("the worked example has units and functions", a["units"] and a["fns"] > 1, a)
    ck("with units, the functions' row is on the group page", a["row"], a)
    ck("…under the units' two cards (a gap before them)", a["gaps"] >= 1, a["gaps"])

    pg.evaluate("()=>{GROUP.structure=Object.assign({},GROUP.structure||{}); GROUP.structure.bu=Object.assign({},GROUP.structure.bu||{},{exists:false}); return true}")
    o = pg.evaluate(READ)
    ck("the units layer is off", o["units"] is False, o)
    ck("without units, the functions' row is still drawn", o["row"], o)
    ck("…leading with no gap", o["gaps"] == 0, o["gaps"])
    ck("…showing the functions' own reading", o["perf"] is not None and (str(o["perf"]) + "%") in o["text"], (o["perf"], o["text"][:160]))
    ck("…and the functions' where-to-look-next strip", o["strip"] == 1 and o["go"] >= 2, (o["strip"], o["go"]))
    ck("no page errors", not errs, errs[:3])
    b.close()

print("\n" + ("functions-no-units: all passed" if not bad else "functions-no-units: %d FAILED" % bad))
raise SystemExit(1 if bad else 0)
