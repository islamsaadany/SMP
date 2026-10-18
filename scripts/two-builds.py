"""── WHAT A BRANCH CHANGES FOR A LIVE CLIENT (§544.12) ──────────────────

Islam, before any merge: *"elabd and wander are active now for the users,
this merge to main will not damage anything right?"*

The only honest answer is a measured one. This loads ONE client's state into
TWO builds — the deployed one and this branch's — in a real browser, asks
both the same questions, and prints every answer that differs. It writes
nothing and connects to nothing.

IN A BROWSER, NOT A VM, and that is the whole point. The first version of
this ran the sources in node, where `SUBS` does not exist because the tab
definitions live in shell.html: eight of its ten questions read nothing,
agreed with each other, and reported "same". A check that passes on two
blanks is decoration (§94.2), so a question that reads nothing on BOTH
builds is reported as UNREAD here and counted separately — it is not
evidence of anything.

WHAT IT CANNOT SEE, said out loud: a reader behind a gate this fixture does
not satisfy — the Copilot's section list needs the module live and the
viewer in the office — comes back empty on both builds and must be checked
another way, by asking its own rule directly. That is how §544.12's
regression was found after this script had already said "nothing moved".

  Build the other side first:
    git worktree add -f --detach <scratch>/mainwt origin/main
    cd <scratch>/mainwt/SMP-Project-Folder/src && python3 build.py

  Then:
    python3 scripts/two-builds.py <state.json>

The state is the `smp-offline` block out of a working copy, or any file
holding the same object."""
import os, io, json, sys
from playwright.sync_api import sync_playwright
SCRATCH = os.environ.get("SMP_SCRATCH") or os.path.expanduser("~/.smp-scratch")
BUILDS = { "origin/main": SCRATCH + "/mainwt/SMP-Project-Folder/src/strategy-management-platform.html",
           "this branch": os.path.abspath("SMP-Project-Folder/src/strategy-management-platform.html") }
STATE = io.open(sys.argv[1], encoding="utf-8").read()

ASK = {
  "the settings the pages read":
    """()=>JSON.stringify({buExists:buExists(), fnExists:SMPRules.fnExists(GROUP),
        capExists:SMPRules.capExists(GROUP), capAtTop:SMPRules.capAtTop(GROUP),
        topSplit:SMPRules.topSplit(GROUP), planOnTop:SMPRules.planOn(GROUP,'group')})""",
  "the navigation row":
    "()=>JSON.stringify(navSides().map(s=>s.label + '(' + (s.keys||[]).length + ')'))",
  "the company's tabs":
    "()=>JSON.stringify(allowed(SUBS.group,'group').map(d=>d.k))",
  "the company's Strategy sections":
    """()=>{var d=SUBS.group.filter(x=>x.k==='strategy')[0];
       return JSON.stringify(d&&d.sections?allowed(d.sections(),'group').map(s=>(s.label||s.k)):null)}""",
  "the company's own pillars, as the page codes them":
    "()=>{var t=topAsUnit(); return JSON.stringify((t.items||[]).map((p,i)=>pillarCode(t,i)+' '+p.name+' ['+(p.kind||'-')+']'))}",
  "a unit's tabs":
    "()=>JSON.stringify(UNIT_KEYS.length?allowed(SUBS.unit,UNIT_KEYS[0]).map(d=>d.k):[])",
  "a function's tabs":
    "()=>JSON.stringify(FUNCTION_KEYS.length?allowed(SUBS.fn,'fn:'+FUNCTION_KEYS[0]).map(d=>d.k):[])",
  "the Copilot's sections on the company":
    """()=>{try{ TARGET='group'; var s=COPILOT&&COPILOT.sections?COPILOT.sections():null;
       return JSON.stringify(s?s.map(x=>x.k):null);}catch(e){return 'THREW '+e.message}}""",
  "the company page, rendered":
    """()=>{try{current='group';currentSub='strategy';paint();
       return (document.querySelector('#panel')||{}).textContent.replace(/\\s+/g,' ').trim().slice(0,4000);}
       catch(e){return 'THREW '+e.message}}""",
  "the company's Performance page, rendered":
    """()=>{try{current='group';currentSub='performance';paint();
       return (document.querySelector('#panel')||{}).textContent.replace(/\\s+/g,' ').trim().slice(0,4000);}
       catch(e){return 'THREW '+e.message}}""",
}

def readall(path):
    out, errs = {}, []
    with sync_playwright() as p:
        b = p.chromium.launch(); pg = b.new_page(viewport={"width":1500,"height":950})
        pg.on("pageerror", lambda e: errs.append(str(e)))
        pg.add_init_script("sessionStorage.setItem('smp.welcome.done','1');localStorage.setItem('smp.tour.never','1');")
        pg.goto("file://"+path); pg.wait_for_timeout(900)
        pg.evaluate("(s)=>{SYNC.hydrate(JSON.parse(s)); current='group'; currentSub='performance'; paint();}", STATE)
        pg.wait_for_timeout(600)
        for k, js in ASK.items():
            try: out[k] = pg.evaluate(js)
            except Exception as e: out[k] = "THREW " + str(e)[:80]
        b.close()
    return out, errs

a, ea = readall(BUILDS["origin/main"])
c, eb = readall(BUILDS["this branch"])
print("client state: " + os.path.basename(sys.argv[1]) + "\n")
moved = unread = 0
def blank(v): return v in (None, "", "null", "[]", "{}") or str(v).startswith("THREW")
for k in ASK:
    if a[k] == c[k]:
        if blank(a[k]): print("  UNREAD %s   (%s)" % (k, str(a[k])[:60])); unread += 1
        else: print("  same   %s" % k)
        continue
    moved += 1
    print("  MOVED  " + k)
    print("           main        " + str(a[k])[:260])
    print("           this branch " + str(c[k])[:260])
print("\npage errors — main %d, branch %d" % (len(ea), len(eb)))
print(("%d ANSWER(S) MOVED" % moved) if moved else "NOTHING MOVED")
if unread: print("(%d read nothing on either build — not evidence)" % unread)
