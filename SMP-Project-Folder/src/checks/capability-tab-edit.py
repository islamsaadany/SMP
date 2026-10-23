"""THE COMPANY'S CAPABILITIES TAB CARRIES THE EDIT (§560).

Islam: *"the edit button in the capabilities disappeared for the smo team"*.

§540 draws a split box's capabilities on a tab of their own, `plancap`, and
El Abd's move (§544.13) handed the company's old `caps` section over to it. The
Edit on that line is drawn by `secActs()`, which asks `secPagePair()` for the
tab's page — and neither SEC_PENS_TOP nor SEC_PENS listed `plancap`, so the
answer was null and nobody was drawn it: not the SMO team, not the Super user.
The fields were never shut; `renderUnitPlan` opens them on `EDIT_PAGE.plan`, so
pressing Edit on the Pillars tab and walking across opened them. The door was
missing, not the room.

What is asserted, both ends each time (§94.2):

  1 - on El Abd's shape AFTER the move, the Super user and the SMO team are
      each drawn Edit on the Capabilities tab, worded as on the Pillars tab;
  2 - PRESSED, it opens the capabilities' fields, and a name typed into one
      is what the company's stored pillar then holds (§96 - a control that
      renders and writes nothing looks identical to one that works);
  3 - it moves no grant: the CEO and a capability's own owner, neither of
      whom authors the company's plan (§428), are drawn no Edit there, and
      the tab is still offered to the owner so the absence is the pen's;
  4 - a BUSINESS UNIT set apart (§540's other door, SEC_PENS) draws it too,
      for the office.

THE STATE IS MADE (§255): El Abd's shape as scripts/test-capability-fold.js
builds it - units off, five directions, five capabilities each one pillar -
then moved with the product's own `capFoldIntoTop()`.

PROVED ABLE TO FAIL (§94.5): against the build before §560
  SMP_BUILT=<that build> python3 qa-run.py checks/capability-tab-edit.py
goes red on 1, 2 and 4 - no Edit for either office row, nothing to press, and
none on the split unit - while 3 stays green, because a pen drawn for nobody
is also not drawn for the CEO.

Run: python3 qa-run.py checks/capability-tab-edit.py
"""
import copy, json, os, pathlib
from playwright.sync_api import sync_playwright

HERE = pathlib.Path(__file__).resolve().parent
ROOT = HERE.parents[2]
BUILT = os.environ.get("SMP_BUILT") or str(HERE / ".." / "strategy-management-platform.html")
URL = "file://" + os.path.abspath(BUILT)
bad = 0
errs = []


def ck(w, ok, x=""):
    global bad
    if not ok:
        bad += 1
    print(("  ok      " if ok else "  FAIL    ") + w + (("  - " + str(x)) if not ok and x != "" else ""))


# ── EL ABD'S SHAPE, MADE (§255) — test-capability-fold.js's elAbd(), with an
# SMO team member added: the worked example's only office row is the Super
# user's, and `role` on a register row IS the seat (§187).
CAPS = ["End-to-End Quality Mindset", "ERP Enhancement", "Digital Transformation",
        "Talent & Workforce Optimization", "Operational excellence"]
DIRS = ["Maximizing Current Stores", "Egypt Expansion", "Growing FMCG",
        "ELABD Corner, Events and Catering", "E-Commerce Growth"]
TEAM, SUPER, CEO = "cfo", "smo", "ceo"


def el_abd():
    s = copy.deepcopy(json.loads((ROOT / "db" / "seed-state.json").read_text()))
    s["group"]["structure"] = dict(s["group"].get("structure") or {}, bu={"exists": False})
    who = [p for p in s["people"] if p.get("key") and p.get("name")]
    s["group"]["items"] = [{
        "id": "group-P%d" % (i + 1), "code": "", "name": n, "sub": "", "kind": "Direction",
        "theme": "", "owner": "",
        "measures": [{"id": "group-P%d-M1" % (i + 1), "name": n + " measure", "dir": "≥",
                      "target": "100", "compile": "Latest", "actual": ""}],
        "tactics": [{"id": "group-P%d-T1" % (i + 1), "name": n + " tactic", "owner": "", "q1": 1}]}
        for i, n in enumerate(DIRS)]
    s["group"]["capabilities"] = [{
        "id": "cap%d" % i, "name": n, "def": "", "format": "pillars",
        "head": who[i]["key"] if i < 3 else None,
        "keyObjectives": [], "projects": [],
        "items": [{"id": "cap:cap%d-P1" % i, "code": "", "name": "" if i == 0 else n, "sub": "",
                   "kind": "", "theme": "", "owner": "",
                   "measures": [{"id": "cap:cap%d-P1-M1" % i, "name": n + " measure", "dir": "≥",
                                 "target": "100", "compile": "Latest", "actual": ""}],
                   "tactics": [{"id": "cap:cap%d-P1-T1" % i, "name": n + " tactic", "owner": "", "q1": 1}]}]}
        for i, n in enumerate(CAPS)]
    for p in s["people"]:
        if p.get("key") == TEAM:
            p["role"] = "smoteam"
    return s


LOAD = """(s)=>{
  GROUP = s.group; UNIT_KEYS = s.unitKeys; UNITS = s.units;
  FUNCTION_KEYS = s.functionKeys; FUNCTIONS = s.functions;
  if (typeof fnPruneNulls === "function") (FUNCTION_KEYS || []).forEach(function (k) { fnPruneNulls(FUNCTIONS[k]); });
  COMPANY_KEYS = s.companyKeys || []; COMPANIES = s.companies || {};
  PEOPLE = s.people; UNIT_ROLES = s.unitRoles; ACCESS = s.access;
  LABELS.entries = s.labels; BANDS.bands = s.bands;
  KO_WEIGHTS = s.koWeights || {}; CYCLE = s.cycle; REVIEW = s.review;
  HISTORY = s.history; ARCHIVES = s.archives || [];
  PRIOR_CYCLE = s.priorCycle || { factors: [] };
  UNIT_KEYS.forEach(function (k) { UNITS[k].ukey = k; });
  syncWeights(); }"""

# Lands on a destination as this viewer and presses a Strategy tab by its key,
# as the tab row does. Returns what the section line carries.
AT = """(a)=>{
  var who = a[0], dest = a[1], tab = a[2];
  VIEWER = who; leaveModes(); current = dest; currentSub = entrySub(current); paint();
  var t = document.querySelector('[data-sub2="' + tab + '"]');
  if (!t) return { tab: false };
  t.click();
  return { tab: true, sec: curSec(),
           pens: [].map.call(document.querySelectorAll('.secpen'), function(e){ return e.textContent.trim(); }) }; }"""


def fresh(b):
    pg = b.new_page(viewport={"width": 1600, "height": 1000})
    pg.add_init_script("try{sessionStorage.setItem('smp.welcome.done','1');"
                       "localStorage.setItem('smp.tour.never','1')}catch(e){}")
    pg.on("pageerror", lambda e: errs.append(str(e)))
    pg.goto(URL)
    pg.wait_for_timeout(1200)
    pg.evaluate(LOAD, el_abd())
    return pg


with sync_playwright() as p:
    b = p.chromium.launch(executable_path=os.environ.get("SMP_CHROME") or "/opt/pw-browsers/chromium",
                          args=["--no-sandbox", "--disable-dev-shm-usage"])

    print("\n1 · the office is drawn Edit on the company's Capabilities tab")
    pg = fresh(b)
    ck("El Abd's five capabilities move onto the company", pg.evaluate("()=>capFoldIntoTop()") == 5)
    for who, name in ((SUPER, "the Super user"), (TEAM, "the SMO team")):
        pil = pg.evaluate(AT, [who, "group", "plan"])
        cap = pg.evaluate(AT, [who, "group", "plancap"])
        ck(name + ": the Capabilities tab is offered", cap.get("tab") is True, cap)
        ck("...and its line carries Edit", cap.get("pens") == ["Edit"], cap)
        ck("...worded as the Pillars tab's beside it (§269)", cap.get("pens") == pil.get("pens"), [pil, cap])

    print("\n2 · pressed, it opens the capabilities and the typing lands")
    pg.evaluate(AT, [TEAM, "group", "plancap"])
    pressed = pg.query_selector(".secpen")
    if pressed:
        pressed.click()
        pg.wait_for_timeout(300)
    ck("the button now reads Done editing",
       pg.evaluate("()=>[].map.call(document.querySelectorAll('.secpen'), e=>e.textContent.trim())") == ["Done editing"])
    box = None
    for el in pg.query_selector_all(".pane input, .pane textarea"):
        if el.input_value() == "End-to-End Quality Mindset":
            box = el
            break
    ck("the capability's own name is an open field", box is not None)
    if box:
        box.fill("End-to-End Quality, renamed")
        box.dispatch_event("change")
        pg.wait_for_timeout(200)
    stored = pg.evaluate("""()=>{ var p = GROUP.items.filter(function(x){ return SMPRules.pillarIsCap(x); })[0];
      return p ? p.name : null; }""")
    ck("...and what was typed is what the company's pillar holds", stored == "End-to-End Quality, renamed", stored)
    pg.close()

    print("\n3 · no grant moved - the CEO and a capability's owner are drawn none")
    pg = fresh(b)
    pg.evaluate("()=>capFoldIntoTop()")
    owner = pg.evaluate("""()=>{ var p = GROUP.items.filter(function(x){ return SMPRules.pillarIsCap(x) && x.owner; })
      .map(function(x){ return x.owner; }); return PEOPLE.filter(function(q){
        return q.key !== "smo" && q.key !== "ceo" && p.indexOf(q.name) > -1; }).map(function(q){ return q.key; })[0] || null; }""")
    ck("a capability's owner who is not the office is on the register", bool(owner), owner)
    for who, name in ((CEO, "the CEO"), (owner, "a capability's owner")):
        if not who:
            continue
        cap = pg.evaluate(AT, [who, "group", "plancap"])
        if who == owner:
            ck(name + " is still offered the tab - so the absence below is the pen's", cap.get("tab") is True, cap)
        ck(name + " is drawn no Edit on it", not cap.get("pens"), cap)
    pg.close()

    print("\n4 · a business unit set apart carries it too, for the office")
    pg = fresh(b)
    unit = pg.evaluate("""()=>{ var k = UNIT_KEYS.filter(function(k){ var it = UNITS[k].items || [];
        return it.some(function(p){ return SMPRules.pillarIsCap(p); }) &&
               it.some(function(p){ return !SMPRules.pillarIsCap(p); }); })[0];
      if (k) UNITS[k].pillarSplit = true; return k || null; }""")
    ck("a unit holding both kinds is set apart", bool(unit), unit)
    if unit:
        # The units back on: El Abd's shape has them off, and a unit's page
        # is only a destination while they exist.
        pg.evaluate("()=>{ delete GROUP.structure.bu; }")
        pil = pg.evaluate(AT, [TEAM, unit, "plan"])
        cap = pg.evaluate(AT, [TEAM, unit, "plancap"])
        ck("its Capabilities tab is offered", cap.get("tab") is True, cap)
        ck("...and carries the same Edit as its Pillars tab", cap.get("pens") == ["Edit"] and pil.get("pens") == ["Edit"], [pil, cap])
    pg.close()

    ck("no script error anywhere", not errs, errs[:3])
    b.close()

print("\n" + ("all good" if not bad else "%d FAILED" % bad))
raise SystemExit(1 if bad else 0)
