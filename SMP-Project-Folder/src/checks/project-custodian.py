"""A CUSTODIAN PER PROJECT — TWO ROLES (S147.7).

Islam: "in a case of a function that has 2 projects each project has an owner
so the custodian here is not on the whole capability there is a custodian per
project" — and then: "a project owner is a role ... for the assigning to work
there are 2 things need to happen (1- is to be granted edit access in the
roles & access setup, 2- that is assigned as an owner on a project)".

A project's owner is a PROJECT OWNER — its own role, derived from the
project's Owner row, never granted by hand, no register attachment asked —
and reports THEIR project, whole, and nothing beside it. Everyone else the
project names (a milestone's owner, a stakeholder) is a CONTRIBUTOR, who
reports nothing until that row is opened, and then only the rows that name
them. This asks the SCREEN, because the server half lives in
test-authorize.js §17 and a check that only asks one end is how the two
drift (§94.2, §42):

  · the owner's own project offers every entry control, and PRESSING one
    CHANGES THE DATA (§96 — a drawn control proves nothing);
  · the project beside it offers none, and the capability's own key
    objectives offer none;
  · Submit is not drawn for the owner and IS drawn for the custodian, and
    the dot (reportPending) agrees with the controls (§69.9);
  · the shared rule answers the same way the screen renders (§42) — both
    ends, each viewer.

THE STATE IS MADE, not found: no demo person is attached to a function and
named on a project (asserted by the node suite), so waiting for one means
shipping this unexercised (§94.2).
"""
import os
from playwright.sync_api import sync_playwright

HERE = os.path.dirname(os.path.abspath(__file__))
FILE = os.path.join(HERE, "..", "strategy-management-platform.html")
URL = "file://" + os.path.abspath(FILE)
FN, DEST = "it", "fn:it"

bad = 0
def ck(what, ok, x=""):
    global bad
    if not ok: bad += 1
    print(("    ok   " if ok else "    FAIL ") + what + (("  — %s" % (x,)) if not ok and x != "" else ""))

def goto_reporting(pg):
    # A viewer who reaches one function has no Units | Functions switch at
    # all (navFolds), and their entry already stands on the function (§94.6)
    # — so both steps are taken only where the control exists.
    for _ in range(3):
        if not pg.query_selector("#units .navswitch"): break
        on = pg.eval_on_selector_all("#units .navswitch .nsw.on", "e=>e.map(x=>x.textContent.trim())")
        if on and on[0] == "Functions": break
        pg.click("#units .navswitch"); pg.wait_for_timeout(150)
    dest = pg.query_selector('#units button[data-u="%s"]' % DEST)
    if dest: dest.click(); pg.wait_for_timeout(300)
    pg.evaluate("""()=>{const b=[...document.querySelectorAll('#subtabs button')]
        .find(x=>x.textContent.trim().indexOf('Performance')===0); if(b)b.click()}""")
    pg.wait_for_timeout(300)
    r = pg.query_selector('[data-s=report]')
    if r: r.click(); pg.wait_for_timeout(400)
    return bool(r)

# What the reporting pane offers, and to whom — controls counted per surface,
# never as one loose total, or a Submit lost and a picker gained cancel out.
READ = """([own, other]) => {
  const body = document.querySelector('.capbody');
  const inKO = new Set((capsOfFunction('%s')[0].keyObjectives || []).map(k => k.id));
  const crep = [...document.querySelectorAll('.capbody [data-crep]')].map(e => e.dataset.crep);
  return {
    koBoxes:  crep.filter(id => inKO.has(id)).length,
    figBoxes: crep.filter(id => !inKO.has(id)).length,
    picks:  document.querySelectorAll('.capbody [data-cpick]').length,
    pcts:   document.querySelectorAll('.capbody [data-cpct]').length,
    notes:  document.querySelectorAll('.capbody [data-cnote]').length,
    submit: !!document.querySelector('[data-submit]'),
    viewOnly: !!document.querySelector('.rep-bar .pill.none'),
    railOn: (document.querySelector('.capbody .ritem.on') || {}).dataset
              ? document.querySelector('.capbody .ritem.on').dataset.rail : null,
    // both ends: the shared rule, asked exactly as the server asks it (§42)
    ownLines: SMPRules.onlyOwnLines(world(), viewer(), 'fn', 'fn:%s'),
    mayOwn:  canReportFnProject('%s', capsOfFunction('%s')[0].projects.find(p => p.id === own)),
    mayOther: canReportFnProject('%s', capsOfFunction('%s')[0].projects.find(p => p.id === other)),
    pending: reportPending('fn:%s')
  };
}""" % (FN, FN, FN, FN, FN, FN, FN)

with sync_playwright() as pw:
    b = pw.chromium.launch(executable_path=os.environ.get("SMP_CHROME", "/opt/pw-browsers/chromium"),
                           args=["--no-sandbox", "--disable-dev-shm-usage"])
    pg = b.new_page(viewport={"width": 1500, "height": 1400})
    errs = []
    pg.on("pageerror", lambda e: errs.append(str(e)))
    pg.on("console", lambda m: errs.append(m.text) if m.type == "error" else None)
    pg.goto(URL); pg.wait_for_timeout(1300)
    pg.select_option("#asWho", "smo"); pg.wait_for_timeout(250)

    # THE AHMED SHAPE (§147.7): named as a project's Owner, the Project
    # owner row opened — and deliberately NOT attached to the function on
    # the register, because Islam's two conditions do not include it.
    ids = pg.evaluate("""() => {
      ACCESS.powner = Object.assign({}, ACCESS.powner, { a_fn_own: "edit" });
      PEOPLE.push({ key:"t130", name:"Project Owner 130", title:"Project owner",
                    active:true });
      PEOPLE.push({ key:"t130m", name:"Milestone Owner 130", title:"Engineer",
                    active:true });
      var cap = capsOfFunction("%s")[0];
      cap.projects[0].owner = "Project Owner 130";
      cap.projects[0].milestones[0].owner = "Milestone Owner 130";
      paint();
      return { own: cap.projects[0].id, other: cap.projects[1].id,
               m0: cap.projects[0].milestones[0].id,
               d0: cap.projects[0].deliverables[0].id,
               cust: FUNCTIONS["%s"].custodian,
               shape: cap.projects[0].deliverables.length + "d " +
                      cap.projects[0].outcomes.length + "o " +
                      cap.projects[0].milestones.length + "m" };
    }""" % (FN, FN))
    print("  fixture: own %(own)s (%(shape)s) · other %(other)s · custodian %(cust)s" % ids)

    print("-- the project owner")
    pg.select_option("#asWho", "t130"); pg.wait_for_timeout(400)
    ck("landed on the reporting mode", goto_reporting(pg))
    pg.evaluate("""(id)=>{const r=document.querySelector('.capbody .ritem[data-rail="'+id+'"]');
        if(r)r.click()}""", ids["own"]); pg.wait_for_timeout(350)
    d = pg.evaluate(READ, [ids["own"], ids["other"]])
    ck("their own project is on the rail", d["railOn"] == ids["own"], d["railOn"])
    ck("own project: the status pickers are drawn", d["picks"] > 0, d)
    ck("own project: the outcome boxes are drawn", d["figBoxes"] > 0, d)
    ck("own project: the note boxes are drawn", d["notes"] > 0, d)
    ck("the capability's own key objectives take nothing from them", d["koBoxes"] == 0, d)
    ck("Submit is not drawn for them", not d["submit"])
    ck("no dot nags them for a submission they cannot make", d["pending"] == False)
    ck("both ends: the shared rule reads them as bounded", d["ownLines"] == True)
    roles = pg.evaluate("() => personRoleKeys(viewer()).join()")
    ck("they hold PROJECT OWNER — a role, not a contributor", roles == "powner", roles)
    ck("both ends: canReportFnProject says yes to theirs, no to the other",
       d["mayOwn"] == True and d["mayOther"] == False, (d["mayOwn"], d["mayOther"]))

    # PRESSING IT CHANGES THE DATA (§96): a drawn picker proves rendering,
    # not writing — flip the first deliverable's status and read it back.
    wrote = pg.evaluate("""(own) => {
      var cap = capsOfFunction("%s")[0];
      var p = cap.projects.find(x => x.id === own), d0 = p.deliverables[0];
      var before = d0.status;
      var sel = document.querySelector('.capbody [data-cpick="' + d0.id + '"]');
      if (!sel) return { drawn: false };
      var next = [...sel.options].map(o => o.value).find(v => v && v !== String(before || ""));
      sel.value = next;
      sel.dispatchEvent(new Event("change", { bubbles: true }));
      return { drawn: true, before: before, want: next, got: d0.status };
    }""" % FN, ids["own"])
    ck("pressing their own picker WRITES the row", wrote.get("drawn") and wrote["got"] == wrote["want"], wrote)

    pg.evaluate("""(id)=>{const r=document.querySelector('.capbody .ritem[data-rail="'+id+'"]');
        if(r)r.click()}""", ids["other"]); pg.wait_for_timeout(350)
    d = pg.evaluate(READ, [ids["own"], ids["other"]])
    ck("the project beside theirs: on the rail", d["railOn"] == ids["other"], d["railOn"])
    ck("the project beside theirs offers NOTHING",
       d["picks"] == 0 and d["figBoxes"] == 0 and d["pcts"] == 0 and d["notes"] == 0, d)

    print("-- the custodian, unchanged")
    if ids["cust"]:
        pg.select_option("#asWho", ids["cust"]); pg.wait_for_timeout(400)
        ck("landed on the reporting mode", goto_reporting(pg))
        pg.evaluate("""(id)=>{const r=document.querySelector('.capbody .ritem[data-rail="'+id+'"]');
            if(r)r.click()}""", ids["other"]); pg.wait_for_timeout(350)
        d = pg.evaluate(READ, [ids["own"], ids["other"]])
        ck("every project still takes their figures", d["picks"] > 0 and d["notes"] > 0, d)
        ck("Submit is drawn for them", d["submit"])
        ck("the dot agrees: they owe the submission", d["pending"] == True)
        ck("both ends: the rule does not read them as own-lines", d["ownLines"] == False)
    else:
        ck("the function has a custodian to compare against", False)

    print("-- the contributor, built for the future")
    pg.select_option("#asWho", "t130m"); pg.wait_for_timeout(400)
    ck("landed on the reporting mode", goto_reporting(pg))
    pg.evaluate("""(id)=>{const r=document.querySelector('.capbody .ritem[data-rail="'+id+'"]');
        if(r)r.click()}""", ids["own"]); pg.wait_for_timeout(350)
    croles = pg.evaluate("() => personRoleKeys(viewer()).join()")
    ck("a milestone's owner derives CONTRIBUTOR", croles == "contrib", croles)
    n = pg.evaluate("""() => document.querySelectorAll(
        '.capbody [data-cpick], .capbody [data-crep], .capbody [data-cpct], .capbody [data-cnote]').length""")
    ck("with the shipped default they report NOTHING", n == 0, n)
    opened = pg.evaluate("""([m0, d0]) => {
      ACCESS.contrib = Object.assign({}, ACCESS.contrib, { a_fn_own: "edit" });
      paint();
      return { mine: !!document.querySelector('.capbody [data-cpick="' + m0 + '"]'),
               theirs: !!document.querySelector('.capbody [data-cpick="' + d0 + '"]') };
    }""", [ids["m0"], ids["d0"]])
    ck("contrib opened: THEIR milestone takes a status", opened["mine"], opened)
    ck("contrib opened: the deliverable beside it still does not", not opened["theirs"], opened)

    ck("no console errors", not errs, errs[:2])
    pg.close(); b.close()

print(("\n%d FAILED" % bad) if bad else "\nall passed")
raise SystemExit(1 if bad else 0)
