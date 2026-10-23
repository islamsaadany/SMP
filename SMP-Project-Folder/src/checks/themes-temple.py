"""THE THEMES ARE WRITTEN ON THE FOUNDATION, AND THE TEMPLE ONLY SHOWS (§606.1).

Islam: *"I added themes but no themes appeared in the foundation"* and *"the
temple should eventually read from the other areas not built on it's own"*;
of the drawing (design-mockups/top-themes-temple/), *"I'm ok with all"*, with
one question — *"would that disrupt elabd?"* — which this check answers in
its last section rather than in a sentence.

  1 · THE THEMES BOX. Read: a card per theme (code, name, note), no add.
      Pen open: a row per theme — code, name, note, how many pillars carry
      it, "In use" where any does and Remove where none does — and
      "+ Add a theme". Every press read back from the DATA (§96): a new
      theme's code is one nobody holds; renaming a code carries its pillars;
      an empty code or one another theme holds is refused; a theme in use is
      never removed, even by a forged press; somebody who may not author is
      drawn no add and writes nothing. Themes off: no box, and nothing stored
      goes (§404). A company's page never draws one (§427).
  2 · THE HEADING COLUMN on the top layer's objectives table, only while its
      Temple is on — the reach the Temple's Edit had. It writes `m.group`,
      and an emptied one is null. Temple off: the table is the nine columns
      it was. A unit's table never has one.
  3 · THE TEMPLE ONLY SHOWS: no pen for the office, no table even with the
      old flag forced on, and it still draws the aspiration, the objectives
      under their headings, the themes and the base.
  4 · EL ABD'S SHAPE (units off, five directions, five capabilities moved
      into the company's plan, themes OFF as its Structure has them, §449):
      no Temple tab, no Themes box, no Heading column, no empty Capabilities
      section beside its own Capabilities tab.

BOTH ENDS (§94.2) throughout. SMP_BUILT points it at another build
(falsified from the SOURCES, §276): the build before §606.1 goes red.
"""
import copy, json, os, pathlib
from playwright.sync_api import sync_playwright

HERE = pathlib.Path(__file__).resolve().parent
ROOT = HERE.parents[2]
BUILT = os.environ.get("SMP_BUILT") or str(HERE / ".." / "strategy-management-platform.html")
URL = "file://" + os.path.abspath(BUILT)
bad, errs = 0, []


def ck(w, ok, x=""):
    global bad
    if not ok:
        bad += 1
    print(("  ok      " if ok else "  FAIL    ") + w + (("  — " + str(x)) if not ok and x != "" else ""))


def ev(pg, js, arg=None, dflt=None):
    """Every probe degrades (§215): a build without the feature REPORTS."""
    try:
        return pg.evaluate(js, arg) if arg is not None else pg.evaluate(js)
    except Exception as e:
        return dflt if dflt is not None else {"err": str(e)[:120]}


def press(pg, sel):
    """A real press, then the wait the shell's click guard asks for (CLICKING)."""
    el = pg.query_selector(sel)
    if not el:
        return False
    el.click()
    pg.wait_for_timeout(200)
    return True


SET = """([sel, v]) => { const e = document.querySelector(sel); if (!e) return false; e.value = v;
  e.dispatchEvent(new Event('change', { bubbles: true })); return true; }"""
TOP_ON = ["brief", "purpose", "aspiration", "keyobj", "theme", "capability", "values"]
FOUND = "(on) => { GROUP.structure = { top: { on: on, temple: true } }; current = 'group'; currentSub = 'strategy'; CURSEC.strategy = 'found'; paint(); }"
BOX = """() => { const b = document.querySelector('#panel .themeband');
  return { box: !!b,
    cards: b ? [...b.querySelectorAll('.themecard .pill')].map((x) => x.textContent) : [],
    rows: b ? b.querySelectorAll('tbody tr').length : 0,
    inuse: b ? b.querySelectorAll('tbody .why').length : 0,
    rms: b ? [...b.querySelectorAll('[data-themerm]')].map((x) => +x.dataset.themerm) : [],
    add: !!(b && b.querySelector('[data-themeadd]')),
    codes: GROUP.themes.map((t) => t.ab) }; }"""
KOHEAD = """() => { const t = document.querySelector('#panel .koband table');
  return t ? [...t.querySelectorAll('thead th')].map((x) => x.textContent.trim()) : null; }"""

# ── EL ABD'S SHAPE, MADE (§255) — capability-tab-edit's el_abd(), with its
# Structure as §449 recorded it: themes switched off at the top.
CAPS = ["End-to-End Quality Mindset", "ERP Enhancement", "Digital Transformation",
        "Talent & Workforce Optimization", "Operational excellence"]
DIRS = ["Maximizing Current Stores", "Egypt Expansion", "Growing FMCG",
        "ELABD Corner, Events and Catering", "E-Commerce Growth"]


def el_abd():
    s = copy.deepcopy(json.loads((ROOT / "db" / "seed-state.json").read_text()))
    s["group"]["structure"] = {"bu": {"exists": False},
                               "top": {"on": ["brief", "purpose", "aspiration", "keyobj", "pillar", "capability", "values"],
                                       "temple": True}}
    s["group"]["items"] = [{
        "id": "group-P%d" % (i + 1), "code": "", "name": n, "sub": "", "kind": "Direction",
        "theme": "", "owner": "",
        "measures": [{"id": "group-P%d-M1" % (i + 1), "name": n + " measure", "dir": "≥",
                      "target": "100", "compile": "Latest", "actual": ""}],
        "tactics": [{"id": "group-P%d-T1" % (i + 1), "name": n + " tactic", "owner": "", "q1": 1}]}
        for i, n in enumerate(DIRS)]
    s["group"]["capabilities"] = [{
        "id": "cap%d" % i, "name": n, "def": "", "format": "pillars", "head": None,
        "keyObjectives": [], "projects": [],
        "items": [{"id": "cap:cap%d-P1" % i, "code": "", "name": n, "sub": "",
                   "kind": "", "theme": "", "owner": "",
                   "measures": [{"id": "cap:cap%d-P1-M1" % i, "name": n + " measure", "dir": "≥",
                                 "target": "100", "compile": "Latest", "actual": ""}],
                   "tactics": [{"id": "cap:cap%d-P1-T1" % i, "name": n + " tactic", "owner": "", "q1": 1}]}]}
        for i, n in enumerate(CAPS)]
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

with sync_playwright() as pw:
    ex = os.environ.get("SMP_CHROME") or None
    br = pw.chromium.launch(executable_path=ex) if ex else pw.chromium.launch()
    pg = br.new_page(viewport={"width": 1440, "height": 900})
    pg.on("pageerror", lambda e: errs.append(str(e)))
    pg.add_init_script("try{sessionStorage.setItem('smp.welcome.done','1');localStorage.setItem('smp.tour.never','1')}catch(e){}")
    pg.goto(URL)
    pg.wait_for_function("() => typeof paint === 'function' && typeof GROUP === 'object'")
    pg.wait_for_timeout(400)

    # ── 1 · THE THEMES BOX ────────────────────────────────────────────
    print("1 · the Themes box on the top layer's Foundation")
    ev(pg, FOUND, TOP_ON)
    ev(pg, "() => { EDIT_PAGE.foundation = false; paint(); }")
    r = ev(pg, BOX)
    ck("reading, a card per theme with its code, and no add",
       r.get("box") and r.get("cards") == r.get("codes") and len(r.get("cards") or []) == 3 and not r.get("add"), r)
    ev(pg, "() => { EDIT_PAGE.foundation = true; paint(); }")
    r = ev(pg, BOX)
    ck("pen open, a row per theme and + Add a theme", r.get("rows") == 3 and r.get("add"), r)
    ck("...every theme the demo's pillars carry reads In use, with no Remove",
       r.get("inuse") == 3 and r.get("rms") == [], r)
    press(pg, "#panel [data-themeadd]")
    press(pg, "#panel [data-themeadd]")
    r = ev(pg, BOX)
    ck("two adds make two themes, each with a code nobody else holds",
       r.get("codes", [])[3:] == ["NEW", "NEW2"], r.get("codes"))
    ck("...and each, carried by no pillar, offers Remove", r.get("rms") == [3, 4], r)
    ev(pg, SET, ["#panel .themeband tbody tr:nth-child(4) input.themecode", "ot"])
    ck("a code another theme holds is refused", ev(pg, "() => GROUP.themes[3].ab") == "NEW")
    ev(pg, SET, ["#panel .themeband tbody tr:nth-child(4) input.themecode", "  "])
    ck("...and so is an empty one", ev(pg, "() => GROUP.themes[3].ab") == "NEW")
    ev(pg, SET, ["#panel .themeband tbody tr:nth-child(4) input.themecode", "xy"])
    ck("a free code is stored, upper case", ev(pg, "() => GROUP.themes[3].ab") == "XY")
    ev(pg, SET, ["#panel .themeband tbody tr:nth-child(4) td:nth-child(3) input", "Customer obsession"])
    ev(pg, SET, ["#panel .themeband tbody tr:nth-child(4) td:nth-child(4) input", "New for 2027"])
    ck("its name and note are stored",
       ev(pg, "() => [GROUP.themes[3].name, GROUP.themes[3].note]") == ["Customer obsession", "New for 2027"])
    n_ot = ev(pg, "() => pillarsUsingTheme('OT')")
    ev(pg, SET, ["#panel .themeband tbody tr:nth-child(1) input.themecode", "ONE"])
    ck("renaming a theme in use carries its pillars with it",
       n_ot and ev(pg, "() => [pillarsUsingTheme('OT'), pillarsUsingTheme('ONE')]") == [0, n_ot],
       ev(pg, "() => [pillarsUsingTheme('OT'), pillarsUsingTheme('ONE')]"))
    ev(pg, SET, ["#panel .themeband tbody tr:nth-child(1) input.themecode", "OT"])
    ev(pg, "() => paint()")
    pg.wait_for_timeout(150)
    press(pg, '#panel [data-themerm="4"]')
    ck("Remove takes the unused theme, and only it",
       ev(pg, "() => GROUP.themes.map((t) => t.ab)") == ["OT", "VC", "DIV", "XY"])
    f = ev(pg, """() => { const b = document.createElement('button'); b.dataset.themerm = '0';
      document.body.appendChild(b); wire(); b.click(); b.remove();
      return GROUP.themes.map((t) => t.ab); }""")
    ck("a forged Remove on a theme in use writes nothing", f == ["OT", "VC", "DIV", "XY"], f)
    r = ev(pg, """() => { const keep = window.mayAuthor; window.mayAuthor = () => false; paint();
      const drawn = !!document.querySelector('#panel [data-themeadd]');
      const b = document.createElement('button'); b.dataset.themeadd = '1'; document.body.appendChild(b);
      const c = document.createElement('button'); c.dataset.themerm = '3'; document.body.appendChild(c);
      wire(); b.click(); c.click(); b.remove(); c.remove(); const n = GROUP.themes.length;
      window.mayAuthor = keep; paint(); return { drawn: drawn, n: n }; }""")
    ck("somebody who may not author is drawn no add, and their presses write nothing",
       r.get("drawn") is False and r.get("n") == 4, r)
    ev(pg, "() => { GROUP.themes.pop(); GROUP.structure.top.on = GROUP.structure.top.on.filter((c) => c !== 'theme'); paint(); }")
    r = ev(pg, BOX)
    ck("themes switched off: no box with the pen open", r.get("box") is False, r)
    ev(pg, "() => { EDIT_PAGE.foundation = false; paint(); }")
    r = ev(pg, BOX)
    ck("...nor reading, and the themes stored stay stored (§404)",
       r.get("box") is False and r.get("codes") == ["OT", "VC", "DIV"], r)
    co = ev(pg, "() => Object.keys(COMPANIES)[0]")
    ev(pg, """(k) => { GROUP.structure = { top: { on: ['brief','aspiration','keyobj','theme','values'], temple: true },
        mid: { exists: true, on: ['brief', 'aspiration', 'keyobj', 'theme', 'values'] } };
      current = 'co:' + k; currentSub = 'foundation'; EDIT_PAGE.foundation = true; paint(); }""", co)
    ck("a company's Foundation draws no Themes box (§427)", ev(pg, BOX).get("box") is False)
    ev(pg, "() => { delete GROUP.coFound; EDIT_PAGE.foundation = false; }")

    # ── 2 · THE HEADING COLUMN ────────────────────────────────────────
    print("2 · the Heading column on the top layer's objectives")
    ev(pg, FOUND, TOP_ON)
    ev(pg, "() => { EDIT_PAGE.foundation = true; paint(); }")
    h = ev(pg, KOHEAD)
    ck("Temple on: Heading sits after Objective", isinstance(h, list) and h[1:3] == ["Objective", "Heading"], h)
    v = ev(pg, "() => [...document.querySelectorAll('#panel .koband tbody tr[data-oi]')].map((r) => (r.children[2].querySelector('input') || {}).value)")
    ck("...each row showing the heading it is grouped under",
       v == [(x or "") for x in ev(pg, "() => GROUP.keyObjectives.map((m) => m.group)")], v)
    ev(pg, SET, ['#panel .koband tbody tr[data-oi="0"] td:nth-child(3) input', "Financial"])
    ck("typing a heading writes the objective's", ev(pg, "() => GROUP.keyObjectives[0].group") == "Financial")
    ev(pg, SET, ['#panel .koband tbody tr[data-oi="0"] td:nth-child(3) input', "  "])
    ck("...and emptying it leaves none", ev(pg, "() => GROUP.keyObjectives[0].group") is None)
    ev(pg, "() => { GROUP.structure.top.temple = false; paint(); }")
    h = ev(pg, KOHEAD)
    ck("Temple off: no Heading, the nine columns it was", isinstance(h, list) and "Heading" not in h and len(h) == 9, h)
    u = ev(pg, "() => UNIT_KEYS[0]")
    ev(pg, "(u) => { GROUP.structure.top.temple = true; current = u; currentSub = 'strategy'; CURSEC.strategy = 'found'; paint(); }", u)
    h = ev(pg, KOHEAD)
    ck("a unit's objectives table never has one", isinstance(h, list) and "Heading" not in h, h)
    ev(pg, "() => { EDIT_PAGE.foundation = false; }")

    # ── 3 · THE TEMPLE ONLY SHOWS ─────────────────────────────────────
    print("3 · the Temple only shows")
    ev(pg, "(on) => { GROUP.structure = { top: { on: on, temple: true } }; current = 'group'; currentSub = 'temple'; paint(); }", TOP_ON)
    t = ev(pg, """() => ({ pen: !!document.querySelector('#panel [data-page], #panel .pageact'),
      ok: GROUP.keyObjectives.some((m) => m.group) ? [...document.querySelectorAll('#panel .ns-group-h')].map((x) => x.textContent) : null,
      cols: document.querySelectorAll('#panel .pillars .pillar').length, themes: GROUP.themes.length,
      arch: (document.querySelector('#panel .architrave') || {}).textContent === GROUP.aspiration,
      base: !!document.querySelector('#panel .stylobate') })""")
    ck("the office is offered no pen on the Temple", t.get("pen") is False, t)
    ck("...and it still draws the aspiration, the headings, a column per theme and the base",
       t.get("arch") and t.get("ok") == ["Market share"] and t.get("cols") == t.get("themes") and t.get("base"), t)
    t = ev(pg, "() => { EDIT_PAGE.temple = true; paint(); const r = { tables: document.querySelectorAll('#panel table').length, fields: document.querySelectorAll('#panel .fld').length, temple: !!document.querySelector('#panel .temple') }; EDIT_PAGE.temple = false; paint(); return r; }")
    ck("the old flag forced on still draws the picture, with no table and no field",
       t.get("temple") and t.get("tables") == 0 and t.get("fields") == 0, t)

    # ── 4 · EL ABD'S SHAPE ────────────────────────────────────────────
    print("4 · El Abd's shape: units off, its capabilities in its plan, themes off")
    ev(pg, LOAD, el_abd())
    ck("(fixture) its five capabilities move into the company's plan", ev(pg, "() => capFoldIntoTop()") == 5)
    ev(pg, "() => { leaveModes(); current = 'group'; currentSub = entrySub(current); paint(); }")
    tabs = ev(pg, "() => allowed(SUBS.group, 'group').map((d) => d.k)")
    secs = ev(pg, "() => allowed(allowed(SUBS.group,'group').filter(d=>d.k==='strategy')[0].sections(),'group').map(d=>d.k)")
    ck("no Temple tab (the Temple needs the themes)", isinstance(tabs, list) and "temple" not in tabs, tabs)
    ck("its own Capabilities tab, and no empty one beside it",
       isinstance(secs, list) and "caps" not in secs and ev(pg, "() => GROUP.capabilities.length") == 0, secs)
    ev(pg, "() => { current = 'group'; currentSub = 'strategy'; CURSEC.strategy = 'found'; EDIT_PAGE.foundation = false; paint(); }")
    ck("its Foundation draws no Themes box", ev(pg, BOX).get("box") is False)
    ev(pg, "() => { EDIT_PAGE.foundation = true; paint(); }")
    ck("...nor with the pen open", ev(pg, BOX).get("box") is False)
    h = ev(pg, KOHEAD)
    ck("its objectives table is the nine columns it was, no Heading",
       isinstance(h, list) and len(h) == 9 and "Heading" not in h, h)
    ev(pg, "() => { EDIT_PAGE.foundation = false; paint(); }")

    ck("no page errors", not errs, errs[:3])
    br.close()

print("PASS" if not bad else "FAIL — %d" % bad)
raise SystemExit(1 if bad else 0)
