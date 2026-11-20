"""THE TACTIC'S MAIN FIELDS IN THE TABLE, THE EXTRAS IN THE PANEL (§773, §775).

Islam, on the §773 list: make the tactic's main info editable in the table
and the extra details in the panel. Settled over eleven rounds on the
working mockup (design-mockups/tactic-edit-panel/2026-11-16_table-and-
panel.html). With the pen on, one line per tactic: the name, each outcome's
name (and + Add an outcome), the owner and the quarters typed in the row; a
ringed × on the name box and on each outcome box that ASKS first. The panel
beside the table holds the description, each outcome's target, the
collaborators, the key measures and the requirements; its head is the
tactic's name and the arrows, with no close and no Done — the top's Done
editing is the one. The open row is tinted and joined to the panel.

  1 · READ MODE IS WHAT IT WAS: no list, no panel.
  2 · EDIT: five heads, one line per tactic, the first marked, the panel
      beside it with the name in its head and the extras in its sections;
      the row holds the name box, the outcome boxes, the owner picker and
      the quarters; the panel holds no name box, no owner, no quarters, no
      close, no Done.
  3 · THE ROW IS WHERE THE MAIN FIELDS ARE TYPED: the name typed in the row
      reaches the panel's head at once and the stored tactic on leaving;
      the outcome's name typed in the row reaches the panel's read line.
  4 · THE PANEL FOLLOWS THE ROW YOU WORK IN: a row press, the focus landing
      in another row's box (the focus kept), ↓ in the head.
  5 · REMOVING ASKS FIRST: the tactic's × opens the question, Cancel keeps
      it, Remove takes it; the outcome's × the same, the first outcome
      included, the next moving up into its place.
  6 · ADD A TACTIC opens the new one; Done editing at the top turns the
      pen off.
  7 · THE GAP WALK: a tactic whose target is missing says so on its row,
      with the walk mark, while it is not the open one.

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
    safe(pg, "()=>{GROUP.structure={details:{outcomes:true}};}")
    def go(ed=False):
        safe(pg, "()=>{ current='mobile'; EDIT_PAGE={}; REPORTING=null; PEN_TACTIC=null; paint(); }"); pg.wait_for_timeout(250)
        click(pg, "[data-s='strategy']"); click(pg, "[data-sub2='plan']")
        if ed: click(pg, "[data-page='plan']", 700)
    def q(js): return safe(pg, "()=>" + js)
    def row(i): return "#panel .penlist tr[data-tacrow]:nth-child(%d)" % (i + 1)

    print("\n1 · read mode is what it was")
    go()
    ok("no list, no panel", q("document.querySelectorAll('#panel .penlist, #panel .tacpanel').length") == 0)

    print("\n2 · Edit: the list and the panel")
    go(True)
    st = q("""({heads:[...document.querySelectorAll('#panel .penlist thead th')].map(x=>x.textContent.trim()), rows:document.querySelectorAll('#panel .penlist tr[data-tacrow]').length,
      n:%s.tactics.length, on:(document.querySelector('#panel tr.penon')||{dataset:{}}).dataset.tacrow, first:%s.tactics[0].id, panel:!!document.querySelector('#panel .tacpanel')})""" % (P, P))
    ok("five heads, one line per tactic, the first marked, the panel beside",
       st and st["heads"] == ["#", "Tactic", "Outcome", "Owner", "Quarters"] and st["rows"] == st["n"] and st["on"] == st["first"] and st["panel"], st)
    rw = q("""(function(r){ return {name:!!r.querySelector('.namerow .tacpn'), rm:r.querySelectorAll('.rm').length, outs:r.querySelectorAll('.outline .outpn').length, add:!!r.querySelector('[data-outadd]'),
      owner:!!r.querySelector('.ownersel'), qs:!!r.querySelector('.qs-edit'), collab:!!r.querySelector('.collabsel'), km:!!r.querySelector('.kmpick')}; })(document.querySelector('%s'))""" % row(0))
    ok("the first row holds the name box with its ×, the outcome box with its ×, + Add an outcome, the owner picker and the quarters — no collaborators, no key measures",
       rw and rw["name"] and rw["rm"] == 2 and rw["outs"] == 1 and rw["add"] and rw["owner"] and rw["qs"] and not rw["collab"] and not rw["km"], rw)
    pn = q("""({head:(document.querySelector('.tacpanel .tpname')||{}).textContent, secs:[...document.querySelectorAll('.tacpanel .tpsec h4')].map(h=>h.textContent),
      desc:!!document.querySelector('.tacpanel .tacpd'), oname:document.querySelectorAll('.tacpanel .oname').length, tgrid:!!document.querySelector('.tacpanel .tgrid'), collab:!!document.querySelector('.tacpanel .collabsel'), km:!!document.querySelector('.tacpanel .kmdrop'),
      namebox:!!document.querySelector('.tacpanel .tacpn'), owner:!!document.querySelector('.tacpanel .ownersel'), qs:!!document.querySelector('.tacpanel .qs-edit'), close:!!document.querySelector('.tacpanel [data-tacclose]'), done:!!document.querySelector('.tacpanel .tpdone'), arrows:document.querySelectorAll('.tacpanel .tpnav [data-tacopen]').length, eye:!!document.querySelector('.tacpanel .eyebtn')})""")
    ok("the panel's head is the name, the eye and the arrows; its sections Description, Outcomes, Collaborators, then the key measures and requirements",
       pn and pn["head"] == q("%s.tactics[0].name" % P) and pn["secs"][:3] == ["Description", "Outcomes", "Collaborators"] and pn["desc"] and pn["oname"] >= 1 and pn["tgrid"] and pn["collab"] and pn["km"] and pn["arrows"] == 2 and pn["eye"], pn)
    ok("…and holds no name box, no owner, no quarters, no close, no Done", pn and not pn["namebox"] and not pn["owner"] and not pn["qs"] and not pn["close"] and not pn["done"], pn)

    print("\n3 · the main fields are typed in the row")
    try:
        pg.fill(row(0) + " .namerow .tacpn", "Clean the customer base"); pg.wait_for_timeout(150)
        live = q("document.querySelector('.tacpanel .tpname').textContent")
        pg.click("h1, body", position={"x": 5, "y": 5}); pg.wait_for_timeout(300)
        stored = q("%s.tactics[0].name" % P)
        pg.fill(row(0) + " .outline .outpn", "Duplicates gone from the base"); pg.wait_for_timeout(150)
        oline = q("document.querySelector('.tacpanel .oname[data-oname=\"first\"]').textContent")
        pg.click("h1, body", position={"x": 5, "y": 5}); pg.wait_for_timeout(300)
        ostored = q("%s.tactics[0].outcome" % P)
    except Exception as e: live = "ERR " + str(e)[:100]; stored = oline = ostored = None
    ok("the name typed in the row reaches the panel's head at once", live == "Clean the customer base", live)
    ok("…and the stored tactic on leaving the box", stored == "Clean the customer base", stored)
    ok("the outcome's name typed in the row reaches the panel's read line at once", oline == "Duplicates gone from the base", oline)
    ok("…and the stored tactic on leaving", ostored == "Duplicates gone from the base", ostored)

    print("\n4 · the panel follows the row you work in")
    try: pg.click(row(2) + " td.idx"); pg.wait_for_timeout(500)
    except Exception as e: print("   (click)", str(e)[:80])
    ok("a row press opens that tactic", q("document.querySelector('#panel tr.penon').dataset.tacrow") == q("%s.tactics[2].id" % P))
    try:
        pg.click(row(3) + " .namerow .tacpn"); pg.wait_for_timeout(500)
        fo = q("({on:document.querySelector('#panel tr.penon').dataset.tacrow, focusIn:!!(document.activeElement && document.activeElement.closest('%s')), isName:!!(document.activeElement && document.activeElement.classList.contains('tacpn'))})" % row(3))
    except Exception as e: fo = "ERR " + str(e)[:80]
    ok("the focus landing in another row's name box moves the panel there and keeps the focus", fo and fo["on"] == q("%s.tactics[3].id" % P) and fo["focusIn"] and fo["isName"], fo)
    click(pg, ".tacpanel .tpnav button[title^='Next']", 500)
    ok("↓ moves to the next", q("document.querySelector('#panel tr.penon').dataset.tacrow") == q("%s.tactics[4].id" % P))

    print("\n5 · removing asks first")
    n0 = q("%s.tactics.length" % P)
    click(pg, row(1) + " .namerow .rm", 400)
    asked = q("!!document.querySelector('[data-rmyes]')")
    ok("the tactic's × opens the question", asked is True)
    click(pg, "[data-rmno]", 400)
    ok("Cancel keeps it", q("%s.tactics.length" % P) == n0 and q("!document.querySelector('[data-rmyes]')") is True)
    click(pg, row(1) + " .namerow .rm", 400); click(pg, "[data-rmyes]", 600)
    ok("Remove takes it", q("%s.tactics.length" % P) == n0 - 1, q("%s.tactics.length" % P))
    safe(pg, "()=>{var t=%s.tactics[0]; t.outs=[{id:'O2', outcome:'Second thing', outTarget:'5#', outDir:'\\u2265', outCompile:'Sum'}]; PEN_TACTIC=t.id; paint();}" % P); pg.wait_for_timeout(400)
    ok("a tactic with two outcomes shows two boxes in its row, each with a ×", q("document.querySelector('%s').querySelectorAll('.outline .rm').length" % row(0)) == 2)
    click(pg, row(0) + " .outline[data-oid='first'] .rm", 400); ok("the FIRST outcome's × opens the question too", q("!!document.querySelector('[data-rmyes]')") is True); click(pg, "[data-rmyes]", 600)
    pr = q("({name:%s.tactics[0].outcome, tgt:%s.tactics[0].outTarget, outs:'outs' in %s.tactics[0]})" % (P, P, P))
    ok("removing the first moves the next up into its place, and the lists go (§50.6)", pr and pr["name"] == "Second thing" and pr["tgt"] == "5#" and pr["outs"] is False, pr)

    print("\n6 · add, and Done at the top")
    n1 = q("%s.tactics.length" % P)
    click(pg, "#panel .penlist [data-rowadd^='tactic|']", 600)
    ad = q("({n:%s.tactics.length, on:document.querySelector('#panel tr.penon').dataset.tacrow, last:%s.tactics[%s.tactics.length-1].id})" % (P, P, P))
    ok("Add a tactic adds one and opens it", ad and ad["n"] == n1 + 1 and ad["on"] == ad["last"], ad)
    click(pg, "[data-page='plan']", 600)
    ok("Done editing at the top turns the pen off: no list, no panel", q("!EDIT_PAGE.plan && !document.querySelector('#panel .penlist') && !document.querySelector('#panel .tacpanel')") is True)

    print("\n7 · the gap walk")
    safe(pg, "()=>{var t=%s.tactics[1]; t._tg=t.outTarget; delete t.outTarget; EDIT_PAGE.plan=true; PEN_TACTIC=%s.tactics[0].id; paint();}" % (P, P)); pg.wait_for_timeout(500)
    gw = q("({mark:!!document.querySelector('%s .tacgap.gapwalk'), says:(document.querySelector('%s .tacgap')||{}).textContent, open:!!document.querySelector('#panel tr.penon .tacgap')})" % (row(1), row(1)))
    ok("a tactic whose target is missing says so on its row, with the walk mark, while it is not the open one", gw and gw["mark"] and "Target missing" in gw["says"] and not gw["open"], gw)
    safe(pg, "()=>{var t=%s.tactics[1]; t.outTarget=t._tg; delete t._tg;}" % P)
    b.close()

ok("no page errors", not errs, errs[:3])
print("\n%d FAILED" % len(fails) if fails else "\nall good")
