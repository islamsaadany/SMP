"""A BUSINESS UNIT CHOOSES HOW IT PLANS (§405) — THE PERMANENT CHECK.

Islam: *"build pillars off for a business unit first"*, then *"yes to all
four"* and *"for functions hide and keep yes"*. A unit plans in Pillars,
Projects or Objectives & actions; the pages, the deck and the workbooks are
the FUNCTION'S OWN for that way, driven through the unit's holder `u:<key>`.

§405 was proved by one-off probes when it was built. This file makes those
probes permanent, and adds the three things the follow-up round built
(§405.1): the unit's aspiration and SWOT in its deck, the builder offering the
unit's own way, and Clear plan clearing the work the unit SHOWS.

What is asserted, both ends each time (§94.2):

  - A PILLARS UNIT IS UNTOUCHED. Its deck, its builder map and its gaps are
    measured beside the new-style units in the same run, or a build that drew
    projects everywhere satisfies every presence assertion here (§113.8);

  - THE SWITCH HIDES AND KEEPS. The pillars are still stored after a unit
    moves to projects, and come back when it moves back;

  - THE DECK carries the unit's aspiration and its four SWOT slides, then the
    work it shows — Projects or Actions — and never its hidden pillars;

  - THE WORKBOOK ROUND TRIP IS A FIXED POINT for both new ways (§22: an upload
    authors, so a column the file does not carry is a column the plan loses),
    and each unit is offered in the right template and not in the pillars one;

  - THE BUILDER'S MAP names the unit's own work and counts it, its Review
    names that work's gaps and not the hidden pillars', and New unit asks how
    it plans (the stored format read back, "pillars" as an ABSENCE, §50.6);

  - CLEAR PLAN clears what the unit shows, keeps what it hid, archives first
    and restores (§49.2).

THE STATE IS MADE (§255): no unit in the worked example plans otherwise, so
every assertion here would pass on a build that lost the feature.

Every probe degrades (§215). SMP_BUILT points it at another build (§276).
"""
import os, sys, json
from playwright.sync_api import sync_playwright

BUILT = os.environ.get("SMP_BUILT") or os.path.join(
    os.path.dirname(__file__), "..", "strategy-management-platform.html")
URL = "file://" + os.path.abspath(BUILT)
CHROME = os.environ.get("SMP_CHROME") or "/opt/pw-browsers/chromium-1194/chrome-linux/chrome"

good = bad = 0
def ck(w, ok, x=""):
    global good, bad
    if ok: good += 1
    else: bad += 1
    print(("  ok      " if ok else "  FAIL    ") + w + (("  — %s" % (x,)) if not ok and x != "" else ""))

def ev(pg, js, dflt=None):
    try:
        return pg.evaluate(js)
    except Exception as e:
        return dflt if dflt is not None else {"err": str(e)[:160]}

PK, OK_, CTL = "retailstores", "onlineshop", "mobile"   # projects · objectives · untouched pillars

SETUP = """() => {
  UNITS.%s.format = 'projects'; UNITS.%s.format = 'objectives';
  var h = holderByIdWritable('u:%s'); var np = addProject(h); np.name = 'Store refit';
  np.owner = PEOPLE[5].name; var m = addMilestone(np); m.name = 'Pilot store'; m.finish = 'Mar 26';
  holderWriteBack('u:%s', h);
  var a = addAction('u:%s'); a.name = 'Launch the app'; a.due = 'Mar 26'; a.owner = PEOPLE[6].name;
  return true; }""" % (PK, OK_, PK, PK, OK_)

def page(p):
    b = p.chromium.launch(executable_path=CHROME)
    pg = b.new_page(viewport={"width": 1440, "height": 900})
    errs = []
    pg.on("pageerror", lambda e: errs.append(str(e)))
    pg.add_init_script("try{sessionStorage.setItem('smp.welcome.done','1');"
                       "localStorage.setItem('smp.tour.never','1')}catch(e){}")
    pg.goto(URL); pg.wait_for_timeout(1300)
    return b, pg, errs

with sync_playwright() as p:
    b, pg, errs = page(p)

    print("§0  the control, before anything is switched")
    ctl0 = ev(pg, "() => ({ deck: deckHtmlFor('%s'), gaps: JSON.stringify(builderGaps('%s')),"
                  " map: builderSections('%s').map(s => s.label) })" % (CTL, CTL, CTL))
    ck("the pillars unit's deck is drawn", isinstance(ctl0, dict) and "deck" in ctl0 and len(ctl0["deck"]) > 1000, ctl0)
    pillarsBefore = ev(pg, "() => UNITS.%s.items.length" % PK)
    ck("the unit that will move holds pillars to begin with", isinstance(pillarsBefore, int) and pillarsBefore > 0, pillarsBefore)

    ck("the state is made", ev(pg, SETUP) is True)

    print("§1  the switch hides and keeps")
    r = ev(pg, "() => ({ items: UNITS.%s.items.length, fmt: unitFormat(UNITS.%s),"
               " way: unitOwnWay(UNITS.%s), ow: unitOwnWay(UNITS.%s) })" % (PK, PK, PK, CTL))
    ck("its pillars are still stored after the switch", r.get("items") == pillarsBefore, r)
    ck("it reads as a projects unit", r.get("way") == "projects", r)
    ck("the pillars unit reads as pillars (no own way)", r.get("ow") is None, r)

    print("§2  the deck")
    d = ev(pg, """() => { var o = {}; ['%s','%s','%s'].forEach(k => {
        var h = deckHtmlFor(k); o[k] = { h2: (h.match(/<h2>[^<]*/g) || []).map(s => s.slice(4)),
          asp: /class="asp2"/.test(h), swot: (h.match(/class="dslide d-swot/g) || []).length,
          anchors: (h.match(/data-anchor="[^"]*"/g) || []) }; }); return o; }""" % (PK, OK_, CTL))
    for k, work in ((PK, "Projects"), (OK_, "Actions")):
        x = (d or {}).get(k, {})
        ck(k + ": the aspiration is on its deck", x.get("asp") is True, x)
        ck(k + ": the four SWOT slides are on its deck", x.get("swot") == 4, x.get("swot"))
        ck(k + ": the deck lists its " + work, work in (x.get("h2") or []), x.get("h2"))
        ck(k + ": no hidden pillar is presented", not any("Pillar" in h for h in (x.get("h2") or [])), x.get("h2"))
        an = x.get("anchors") or []
        ck(k + ": every slide's anchor is its own", len(an) == len(set(an)), [a for a in an if an.count(a) > 1])
    ctl1 = ev(pg, "() => deckHtmlFor('%s')" % CTL)
    ck("the pillars unit's deck is byte-identical beside them", ctl1 == ctl0.get("deck"), "changed")

    print("§3  the workbooks")
    w = ev(pg, """async () => { var o = {};
      for (const k of ['%s','%s']) {
        var snap = () => JSON.stringify({ ko:(UNITS[k].keyObjectives||[]).map(x=>[x.name,x.target]),
          pr:(UNITS[k].projects||[]).map(x=>[x.name,(x.milestones||[]).map(y=>[y.name,y.finish])]),
          ac:(UNITS[k].actions||[]).map(x=>[x.name,x.due,x.owner]) });
        var before = snap();
        var bytes = buildXlsx(impPlanWorkbookFor(k));
        var sheets = await readXlsx(bytes.buffer ? bytes.buffer : bytes);
        var c = holderByIdWritable('u:' + k);
        applyCapPlanReplace(c, capPlanFromWorkbook(c, sheets)); holderWriteBack('u:' + k, c);
        o[k] = { same: before === snap(), pick: readmePick(sheets), before: before.slice(0, 160), after: snap().slice(0, 160) };
      }
      o.pillList = planSubjectNames().indexOf(UNITS['%s'].name);
      o.pillListCtl = planSubjectNames().indexOf(UNITS['%s'].name);
      o.projList = projectSubjectNames('projects').indexOf(UNITS['%s'].name);
      o.objList = projectSubjectNames('objectives').indexOf(UNITS['%s'].name);
      return o; }""" % (PK, OK_, PK, CTL, PK, OK_))
    for k in (PK, OK_):
        x = (w or {}).get(k, {})
        ck(k + ": the plan round-trips through its own file", x.get("same") is True, x)
        ck(k + ": the file names the unit", x.get("pick") == ev(pg, "() => UNITS.%s.name" % k), x.get("pick"))
    ck("the projects unit is NOT offered in the pillars template", (w or {}).get("pillList") == -1, w)
    ck("the pillars unit still is", (w or {}).get("pillListCtl", -1) >= 0, w)
    ck("the projects unit is offered in the projects template", (w or {}).get("projList", -1) >= 0, w)
    ck("the objectives unit is offered in the objectives template", (w or {}).get("objList", -1) >= 0, w)

    print("§4  the builder")
    bl = ev(pg, """() => ({ p: builderSections('%s').map(s => s.label + ':' + s.chip().mark),
        o: builderSections('%s').map(s => s.label + ':' + s.chip().mark),
        pg: builderGaps('%s').map(g => g.text), og: builderGaps('%s').map(g => g.text),
        ctlMap: builderSections('%s').map(s => s.label), ctlGaps: JSON.stringify(builderGaps('%s')),
        form: (bformDef('newunit').fields.filter(f => f.k === 'format')[0] || {}).opts }) """
        % (PK, OK_, PK, OK_, CTL, CTL))
    ck("a projects unit's map counts its projects", "Projects:1" in (bl.get("p") or []), bl.get("p"))
    ck("an objectives unit's map counts its actions", "Actions:1" in (bl.get("o") or []), bl.get("o"))
    ck("neither map offers pillars", not any(s.startswith("Pillars") for s in (bl.get("p") or []) + (bl.get("o") or [])), bl)
    ck("the projects unit's Review names its project's gap", any("holds neither deliverables" in t for t in (bl.get("pg") or [])), bl.get("pg"))
    ck("…and no hidden pillar's", not any("measure" in t.lower() or "tactic" in t.lower() for t in (bl.get("pg") or [])), bl.get("pg"))
    ck("the objectives unit's Review is empty of gaps its actions do not owe", bl.get("og") == [], bl.get("og"))
    ck("the pillars unit's map is as it was", bl.get("ctlMap") == ctl0.get("map"), bl.get("ctlMap"))
    ck("the pillars unit's gaps are as they were", bl.get("ctlGaps") == ctl0.get("gaps"), "changed")
    ck("New unit asks how it plans, in three ways", len(bl.get("form") or []) == 3, bl.get("form"))
    nu = ev(pg, """() => { var a = addBusinessUnit('Chk Obj', 'CO', null, 'objectives');
        var b = addBusinessUnit('Chk Pil', 'CP', null, 'pillars');
        return { a: UNITS[a].format, b: ('format' in UNITS[b]) }; }""")
    ck("a unit made in objectives is stored as objectives", nu.get("a") == "objectives", nu)
    ck("a unit made in pillars stores no format (an absence)", nu.get("b") is False, nu)

    print("§5  Clear plan clears what it shows and keeps what it hid")
    cl = ev(pg, """() => { var n = ARCHIVES.length, it = UNITS.%s.items.length;
        clearUnitPlan(UNITS.%s, 'check');
        var o = { items: UNITS.%s.items.length, itemsBefore: it, proj: unitOwnProjects('%s').length,
                  asp: UNITS.%s.aspiration, archives: ARCHIVES.length - n };
        var a = ARCHIVES.filter(x => x.key === 'u:%s')[0];
        o.restored = a && restoreArchive(a.id) ? unitOwnProjects('%s').length : -1;
        return o; }""" % (PK, PK, PK, PK, PK, PK, PK))
    ck("the hidden pillars are kept", cl.get("items") == cl.get("itemsBefore") and cl.get("items", 0) > 0, cl)
    ck("the projects it shows are cleared", cl.get("proj") == 0, cl)
    ck("its foundation is cleared", cl.get("asp") == "", cl)
    ck("the work was archived first", (cl.get("archives") or 0) >= 1, cl)
    ck("and the archive restores the projects", cl.get("restored") == 1, cl)

    print("§6  moving back brings the pillars back")
    mb = ev(pg, """() => { delete UNITS.%s.format; return { way: unitOwnWay(UNITS.%s),
        items: UNITS.%s.items.length, proj: (UNITS.%s.projects || []).length }; }""" % (PK, PK, PK, PK))
    ck("back on pillars", mb.get("way") is None, mb)
    ck("the pillars are drawn again", mb.get("items") == pillarsBefore, mb)
    ck("the projects are hidden and kept", mb.get("proj") == 1, mb)

    ck("no page error", not errs, errs)
    b.close()

print("\n%d passed, %d failed" % (good, bad))
sys.exit(1 if bad else 0)
