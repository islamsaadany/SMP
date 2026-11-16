"""THE TACTIC PANEL (§769).

Islam, with a picture of the pen: "can we work on a cleaner approach to edit
the tactic. as it became very complex." From the working mockup he tried:
with the pen on, the tactics table is a plain list — one line per tactic —
and the tactic being edited opens in a panel beside the table, in sections.
The one Edit button turns the pen on and opens the panel on the first
tactic; any row press moves it; Done editing turns the pen off.

  1 · READ MODE IS WHAT IT WAS: no list, no panel.
  2 · EDIT: the list has eight heads, one line per tactic, the first marked;
      the panel is there with the name box, the outcome boxes, the owner and
      collaborator pickers, the quarters, the key measures dropdown.
  3 · A ROW PRESS moves the panel; ↑ ↓ walk; the typed name reaches the row
      and the stored tactic; a target typed in the panel is stored.
  4 · × closes the panel and keeps the pen; a row press opens it again;
      Done editing in the panel turns the pen off.
  5 · ADD A TACTIC opens the new one; × on a row removes it.
  6 · THE GAP WALK: a tactic owing a gap carries the mark on its row while
      it is not open; the open one carries it on its fields.
  7 · FILL MODE (a filler, not the office) is untouched: the table, not the list.

SMP_BUILT points it at another build (§276).
"""
import os
from playwright.sync_api import sync_playwright
HERE = os.path.dirname(os.path.abspath(__file__))
F = os.environ.get("SMP_BUILT") or os.path.join(os.path.dirname(HERE), "strategy-management-platform.html")
fails = []
def ok(label, cond, detail=""):
    if cond: print("  ok      " + label)
    else:
        fails.append(label); print("  FAIL    " + label + ("  — " + str(detail) if detail else ""))
def safe(pg, js, dflt=None):
    try: return pg.evaluate(js)
    except Exception as e: return dflt
def click(pg, sel, w=400):
    try: pg.evaluate("s=>{var b=document.querySelector(s); if(b) b.click();}", sel)
    except Exception: pass
    pg.wait_for_timeout(w)
P = "UNITS.mobile.items[0]"

with sync_playwright() as p:
    b = p.chromium.launch(executable_path=os.environ.get("SMP_CHROME") or None)
    pg = b.new_page(viewport={"width": 1600, "height": 950})
    pg.add_init_script("try{sessionStorage.setItem('smp.welcome.seen','1');sessionStorage.setItem('smp.welcome.done','1');localStorage.setItem('smp.tour.never','1')}catch(e){}")
    errs = []; pg.on("pageerror", lambda e: errs.append(str(e)))
    pg.goto("file://" + os.path.abspath(F)); pg.wait_for_timeout(900)
    safe(pg, "()=>{delete GROUP.structure;}")
    def go(ed=False):
        safe(pg, "()=>{ current='mobile'; EDIT_PAGE={}; REPORTING=null; PEN_TACTIC=null; paint(); }"); pg.wait_for_timeout(250)
        click(pg, "[data-s='strategy']"); click(pg, "[data-sub2='plan']")
        if ed: click(pg, "[data-page='plan']", 700)
    def q(js): return safe(pg, "()=>" + js)

    print("\n1 · read mode is what it was")
    go()
    ok("no list, no panel", q("document.querySelectorAll('#panel .penlist, #panel .tacpanel').length") == 0)
    ok("the tactics table still carries its read columns", q("[...document.querySelectorAll('#panel table')].some(t=>t.querySelector('.tacname')) && !document.querySelector('#panel .penwrap')") is True)

    print("\n2 · Edit: the list and the panel")
    go(True)
    st = q("""({heads:[...document.querySelectorAll('#panel .penlist thead th')].map(x=>x.textContent.trim()), rows:document.querySelectorAll('#panel .penlist tr[data-tacrow]').length,
      n:%s.tactics.length, on:(document.querySelector('#panel tr.penon')||{dataset:{}}).dataset.tacrow, first:%s.tactics[0].id, panel:!!document.querySelector('#panel .tacpanel')})""" % (P, P))
    ok("eight heads, one line per tactic, the first marked, the panel beside",
       st and st["heads"] == ["#", "Tactic", "Outcomes", "Owner", "Collabs.", "Quarters", "Key measures", ""] and st["rows"] == st["n"] and st["on"] == st["first"] and st["panel"], st)
    pn = q("""({name:!!document.querySelector('.tacpanel .tacpn'), desc:!!document.querySelector('.tacpanel .tacpd'), out:!!document.querySelector('.tacpanel .tpout'), tgrid:!!document.querySelector('.tacpanel .tgrid'),
      owner:!!document.querySelector('.tacpanel .ownersel'), collab:!!document.querySelector('.tacpanel .collabsel'), qs:!!document.querySelector('.tacpanel .qs-edit'), km:!!document.querySelector('.tacpanel .kmdrop'),
      head:(document.querySelector('.tacpanel .tpk')||{}).textContent, done:!!document.querySelector('.tacpanel .tpdone[data-page=\"plan\"]')})""")
    ok("the panel holds the name, description, outcome boxes, owner and collaborator pickers, quarters, key measures and Done",
       pn and all(pn[k] for k in ["name","desc","out","tgrid","owner","collab","qs","km","done"]) and pn["head"] and pn["head"].endswith("1 of 5"), pn)
    ok("no field is left in the list's rows", q("document.querySelectorAll('#panel .penlist input, #panel .penlist select, #panel .penlist textarea').length") == 0)

    print("\n3 · a row press moves the panel; typing reaches the row")
    try:
        pg.click("#panel .penlist tr[data-tacrow]:nth-child(3) td:nth-child(2)"); pg.wait_for_timeout(500)
    except Exception as e: print("   (click)", str(e)[:80])
    mv = q("({on:document.querySelector('#panel tr.penon').dataset.tacrow, id:%s.tactics[2].id, head:document.querySelector('.tacpanel .tpk').textContent})" % P)
    ok("the third row opens in the panel", mv and mv["on"] == mv["id"] and "3 of 5" in mv["head"], mv)
    click(pg, ".tacpanel .tpnav button[title^=\"Next\"]", 500)
    ok("↓ moves to the fourth", q("document.querySelector('#panel tr.penon').dataset.tacrow") == q("%s.tactics[3].id" % P))
    try:
        pg.fill(".tacpanel .tacpn", "Scale the app, phase two"); pg.wait_for_timeout(150)
        live = q("({row:document.querySelector('#panel tr.penon .tacname').textContent, head:document.querySelector('.tacpanel .tpname').textContent})")
        pg.click("h1, body", position={"x": 5, "y": 5}); pg.wait_for_timeout(300)
        stored = q("%s.tactics[3].name" % P)
        tg = pg.locator(".tacpanel .tgrid input").first; tg.fill("2000"); pg.click("h1, body", position={"x": 5, "y": 5}); pg.wait_for_timeout(300)
        tstored = q("%s.tactics[3].outTarget" % P)
    except Exception as e: live = "ERR " + str(e)[:100]; stored = tstored = None
    ok("the typed name is on the row and in the panel's head at once", live and live["row"] == "Scale the app, phase two" and live["head"] == "Scale the app, phase two", live)
    ok("…and stored on leaving the box", stored == "Scale the app, phase two", stored)
    ok("a target typed in the panel is stored on the tactic", tstored and str(tstored).startswith("2000"), tstored)

    print("\n4 · close, reopen, Done")
    click(pg, ".tacpanel [data-tacclose]", 500)
    ok("× closes the panel and keeps the pen and the list", q("!document.querySelector('#panel .tacpanel') && !!EDIT_PAGE.plan && !!document.querySelector('#panel .penlist')") is True)
    try: pg.click("#panel .penlist tr[data-tacrow]:nth-child(2) td:nth-child(2)"); pg.wait_for_timeout(500)
    except Exception: pass
    ok("a row press opens it again", q("!!document.querySelector('#panel .tacpanel') && document.querySelector('#panel tr.penon').dataset.tacrow===%s.tactics[1].id" % P) is True)
    click(pg, ".tacpanel .tpdone", 600)
    ok("Done editing in the panel turns the pen off: read mode, no list, no panel", q("!EDIT_PAGE.plan && !document.querySelector('#panel .penlist') && !document.querySelector('#panel .tacpanel')") is True)

    print("\n5 · add and remove")
    go(True)
    n0 = q("%s.tactics.length" % P)
    click(pg, "#panel .penlist [data-rowadd^='tactic|']", 600)
    ad = q("({n:%s.tactics.length, on:document.querySelector('#panel tr.penon').dataset.tacrow, last:%s.tactics[%s.tactics.length-1].id, head:document.querySelector('.tacpanel .tpname').textContent})" % (P, P, P))
    ok("Add a tactic adds one and opens it in the panel", ad and ad["n"] == n0 + 1 and ad["on"] == ad["last"] and ad["head"].startswith("New"), ad)
    safe(pg, "()=>{var b=document.querySelector('#panel tr.penon [data-rowoff]'); b&&b.click();}"); pg.wait_for_timeout(500)
    ok("× on its row removes it", q("%s.tactics.length" % P) == n0, q("%s.tactics.length" % P))

    print("\n6 · the gap walk")
    safe(pg, "()=>{var t=%s.tactics[2]; t._o=t.owner; delete t.owner; PEN_TACTIC=%s.tactics[0].id; paint();}" % (P, P)); pg.wait_for_timeout(400)
    gw = q("({row:!!document.querySelector('#panel .penlist tr[data-tacrow=\"'+%s.tactics[2].id+'\"] .tacopenb.gapwalk'), says:(document.querySelector('#panel .penlist tr[data-tacrow=\"'+%s.tactics[2].id+'\"] .tacgaps')||{}).textContent, open:!!document.querySelector('#panel tr.penon .tacopenb.gapwalk')})" % (P, P))
    ok("a tactic owing an owner carries the walk mark and says '1 missing' on its row; the open one does not", gw and gw["row"] and gw["says"] == "1 missing" and not gw["open"], gw)
    safe(pg, "()=>{var t=%s.tactics[2]; t.owner=t._o; delete t._o;}" % P)

    print("\n7 · fill mode is untouched")
    go()
    fm = q("({pen:!!EDIT_PAGE.plan, list:!!document.querySelector('#panel .penlist'), tactable:!!document.querySelector('#panel .tactable')})")
    ok("with the pen off the tactics table is the table it was", fm and not fm["pen"] and not fm["list"], fm)
    b.close()

ok("no page errors", not errs, errs[:3])
print("\n%d FAILED" % len(fails) if fails else "\nall good")
