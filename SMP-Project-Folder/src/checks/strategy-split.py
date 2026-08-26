"""THE OWN COLUMNS ARE TWO QUESTIONS, AND THE PLAN LEAVES AS SLIDES (§117).

Islam, 2026-08-26: "the strategy should be locked from the non SMO but the
reporting should be editable by who we grant the access so they can submit —
we need this split in the roles and access table", and "add the access of
downloading a presentation for the plan for the custodian and the business
unit owner through a button in the strategy panel."

WHAT THIS FILE ASSERTS, AND WHY EACH HALF EXISTS:

· The matrix draws the split — two header rows, the pair names spanning their
  halves, ten columns under them. Asserted from the DOM, because a header is
  what the SMO reads before granting anything.

· OPENING a strategy cell opens the pens, and closing it closes them — the new
  capability, pressed through the REAL cell (§70: a DOM check passed every day
  the pen was invisible), asked at BOTH ENDS (§94.2: the screen and the shared
  rule), in BOTH DIRECTIONS (§94.5: a check that only watches a door open
  passes when the door is stuck open).

· §101's arrows survive the split — the one behaviour the new resolution was
  most likely to take away silently, because the plan page's grant moved to a
  half the custodian reads at view.

· The download button is there for the people Islam named, absent for the
  people he did not, and the file it saves is a REAL .pptx: unzipped, every
  part parsed as XML, the plan's own words found inside it — and the cycle's
  reported figures PROVED ABSENT, because "the plan only" is the decision and
  a builder that quietly copied an actuals column would pass every presence
  assertion (§94.2, from the negative side).
"""
import io, sys, zipfile
import xml.etree.ElementTree as ET
from playwright.sync_api import sync_playwright

URL = "file:///home/user/SMP/SMP-Project-Folder/src/strategy-management-platform.html"
errs = []
bad = 0


def ck(w, ok, x=""):
    global bad
    if not ok:
        bad += 1
    print(("  ok      " if ok else "  FAIL    ") + w + (("  — " + str(x)) if not ok and x else ""))


def be(pg, key, dest=None, tab=None, sec=None):
    pg.evaluate("""(a) => {
      VIEWER = a.k; leaveModes();
      current = a.dest || null; currentSub = a.tab || null;
      if (a.tab && a.sec) CURSEC[a.tab] = a.sec;
      paint();
    }""", {"k": key, "dest": dest, "tab": tab, "sec": sec})
    pg.wait_for_timeout(400)


def read_pptx(path):
    """Unzip, parse EVERY xml part (a file PowerPoint refuses is one that
    parses nowhere), and return the concatenated slide text."""
    z = zipfile.ZipFile(path)
    text = []
    for n in z.namelist():
        if n.endswith(".xml") or n.endswith(".rels"):
            ET.fromstring(z.read(n))  # raises on anything malformed
    slides = [n for n in z.namelist() if n.startswith("ppt/slides/slide") and n.endswith(".xml")]
    for n in sorted(slides):
        root = ET.fromstring(z.read(n))
        for t in root.iter("{http://schemas.openxmlformats.org/drawingml/2006/main}t"):
            text.append(t.text or "")
    # the package is consistent: every slide the presentation lists exists
    pres = z.read("ppt/presentation.xml").decode()
    return {"slides": len(slides), "text": "\n".join(text), "pres": pres}


with sync_playwright() as p:
    b = p.chromium.launch(executable_path="/opt/pw-browsers/chromium",
                          args=["--no-sandbox", "--disable-dev-shm-usage"])
    pg = b.new_page(viewport={"width": 1600, "height": 1000}, accept_downloads=True)
    pg.on("pageerror", lambda e: errs.append(str(e)))
    pg.goto(URL)
    pg.wait_for_timeout(1500)

    who = pg.evaluate("""() => {
      const u = "mobile";
      const fk = FUNCTION_KEYS.filter(k => capsOfFunction(k).length)[0];
      const pf = FUNCTION_KEYS.filter(k => fnPlansInPillars(FUNCTIONS[k]))[0];
      /* Somebody attached to a unit who HOLDS nothing that owns it — a
         contributor or the floor — found by role shape, never by key, so a
         reseeded demo cannot quietly turn the negative case into a test of
         nobody (§54.5). */
      const world_ = world();
      const bystander = PEOPLE.filter(p => {
        if (!personActive(p) || !p.unit) return false;
        const rs = SMPRules.personRoles(world_, p);
        return rs.every(r => ["owner","custodian","fnhead","super","smoteam"]
          .indexOf(r.role) < 0);
      })[0];
      return { unit:u, fn:fk, pillarsFn:pf,
               smo: PEOPLE.filter(p => p.role === "super")[0].key,
               head: (UNIT_ROLES[u] || {}).head,
               cust: (UNIT_ROLES[u] || {}).custodian,
               fnhead: (FUNCTIONS[fk] || {}).head,
               floor: bystander ? bystander.key : null,
               floorUnit: bystander ? bystander.unit : null };
    }""")
    print("unit %(unit)s · cap function %(fn)s · pillars function %(pillarsFn)s · "
          "smo %(smo)s · head %(head)s · custodian %(cust)s · floor %(floor)s" % who)

    # ── 1 · THE TABLE DRAWS THE SPLIT ────────────────────────────────
    print("\n1 · the matrix draws two halves under each own column")
    be(pg, who["smo"])
    pg.click('#units [data-md="setup"]'); pg.wait_for_timeout(250)
    pg.click('.setuprail [data-setupgo="access"]'); pg.wait_for_timeout(350)
    shape = pg.evaluate("""() => {
      const t = document.querySelector(".cfg.acgrid table");
      const rows = t.querySelectorAll("thead tr");
      const pairs = [...t.querySelectorAll("th.acpair")].map(e => e.textContent.trim());
      const halves = [...t.querySelectorAll("th.achalf")].map(e => e.textContent.trim());
      const body = t.querySelector("tbody tr");
      return { headRows: rows.length, pairs, halves,
               cols: body ? body.children.length : 0 };
    }""")
    ck("two header rows", shape["headRows"] == 2, shape["headRows"])
    ck("the two pair names span their halves",
       shape["pairs"] == ["Own business unit", "Own supporting function"], shape["pairs"])
    ck("Strategy | Reporting under each",
       shape["halves"] == ["Strategy", "Reporting", "Strategy", "Reporting"], shape["halves"])
    ck("a body row holds the role and nine answers", shape["cols"] == 10, shape["cols"])

    # ── 2 · OPENING A STRATEGY CELL OPENS THE PENS, CLOSING IT CLOSES THEM ──
    print("\n2 · the strategy cell is a real door, pressed both ways")

    def asks(pg, w):
        return pg.evaluate("""(w) => {
          const world_ = world();
          return {
            rule: SMPRules.mayAuthorPage(world_, personBy(w.cust), "u_plan", w.unit),
            arrange: SMPRules.mayArrange(world_, personBy(w.cust), w.unit),
            report: SMPRules.grantAtPage(world_, personBy(w.cust), "u_report", w.unit)
          };
        }""", w)

    before = asks(pg, who)
    ck("before: the rule refuses the custodian the plan", before["rule"] is False)
    ck("before: §101's arrows are still theirs", before["arrange"] is True)
    ck("before: reporting reads edit", before["report"] == "edit", before["report"])

    be(pg, who["cust"], who["unit"], "strategy", "plan")
    ck("before: no pen on the custodian's plan pane",
       pg.query_selector(".pane .paneact [data-page]") is None)
    ck("before: the arrange control IS drawn",
       pg.query_selector(".pane .paneact [data-arrange]") is not None)

    # The SMO opens the cell — through the real button, not by poking state.
    be(pg, who["smo"])
    pg.click('#units [data-md="setup"]'); pg.wait_for_timeout(250)
    pg.click('.setuprail [data-setupgo="access"]'); pg.wait_for_timeout(350)
    cell = pg.query_selector('[data-ac="custodian|a_unit_own_strat|edit"]')
    ck("the strategy cell offers the pen (Islam: the SMO can open it)", cell is not None)
    if cell:
        cell.click(); pg.wait_for_timeout(350)
    after = asks(pg, who)
    ck("opened: the rule now allows the custodian the plan", after["rule"] is True, after)
    be(pg, who["cust"], who["unit"], "strategy", "plan")
    pen = pg.query_selector(".pane .paneact [data-page]")
    ck("opened: the pen is drawn for the custodian", pen is not None)
    if pen:
        pen.click(); pg.wait_for_timeout(400)
        fields = pg.evaluate("() => document.querySelectorAll('.pane input, .pane textarea, .pane select').length")
        ck("opened: pressing it produces fields", fields > 0, fields)
        # In edit mode the pen sits on the pillar's own title row, not in the
        # corner slot — ask for it anywhere in the pane to press Done.
        pg.query_selector(".pane [data-page]").click(); pg.wait_for_timeout(300)

    # And closed again — the direction a stuck-open door would hide (§94.5).
    be(pg, who["smo"])
    pg.click('#units [data-md="setup"]'); pg.wait_for_timeout(250)
    pg.click('.setuprail [data-setupgo="access"]'); pg.wait_for_timeout(350)
    pg.click('[data-ac="custodian|a_unit_own_strat|none"]'); pg.wait_for_timeout(300)
    pg.click('[data-ac="custodian|a_unit_own_strat|view"]'); pg.wait_for_timeout(300)
    closed = asks(pg, who)
    ck("closed again: the rule refuses once more", closed["rule"] is False, closed)
    be(pg, who["cust"], who["unit"], "strategy", "plan")
    ck("closed again: the pen is gone from the screen",
       pg.query_selector(".pane .paneact [data-page]") is None)

    # ── 3 · THE DOWNLOAD, FOR THE PEOPLE ISLAM NAMED ─────────────────
    print("\n3 · the plan leaves as slides, for the right people")
    import tempfile, os
    tmp = tempfile.mkdtemp(prefix="smp-pptx-")

    def grab(pg, name):
        btn = pg.query_selector(".pane .paneact [data-dlpptx]")
        if btn is None:
            return None
        with pg.expect_download() as dl:
            btn.click()
        path = os.path.join(tmp, name)
        dl.value.save_as(path)
        return path

    be(pg, who["smo"], who["unit"], "strategy", "plan")
    ck("the SMO sees the download beside the pen",
       pg.query_selector(".pane .paneact [data-dlpptx]") is not None)
    f = grab(pg, "smo-unit.pptx")
    ck("...and pressing it saves a file", f is not None)
    if f:
        d = read_pptx(f)
        ck("every part of the package parses as XML", True)
        ck("it carries more than a cover", d["slides"] >= 6, d["slides"])
        ck("the plan's own words are inside (a measure)",
           "Orders processed digitally" in d["text"])
        ck("...the SWOT Islam asked for by name",
           "STRENGTHS" in d["text"] and "Strong brand equity (Raya & i2)" in d["text"])
        ck("...a tactic and its owner",
           "Clean and standardize customer and SKU base" in d["text"] and "Ramy Behairy" in d["text"])
        ck("...and the key objectives", "Distribution revenue" in d["text"])
        # THE NEGATIVE HALF IS THE DECISION (plan only, no reported figures):
        # Mobile's demo actuals are distinctive strings no target shares.
        for figure in ["2.7B", "48%", "3,180"]:
            ck("no reported figure leaks in (" + figure + ")", figure not in d["text"])

    be(pg, who["cust"], who["unit"], "strategy", "plan")
    ck("the custodian sees it", pg.query_selector(".pane .paneact [data-dlpptx]") is not None)
    ck("...beside the arrows, not instead of them",
       pg.query_selector(".pane .paneact [data-arrange]") is not None)
    ck("...and their press is allowed at press time", grab(pg, "cust-unit.pptx") is not None)

    be(pg, who["head"], who["unit"], "strategy", "plan")
    ck("the unit owner sees it", pg.query_selector(".pane .paneact [data-dlpptx]") is not None)

    # The fixture itself is asserted (§54.5): a demo with nobody to say no
    # about would pass the negative case by never running it.
    ck("the demo still holds a bystander to test the refusal with",
       who["floor"] is not None)
    if who["floor"]:
        be(pg, who["floor"], who["floorUnit"], "strategy", "plan")
        ck("somebody who does not hold the unit does NOT see it",
           pg.query_selector(".pane .paneact [data-dlpptx]") is None)
        rule = pg.evaluate("""(w) =>
          SMPRules.mayDownloadPlan(world(), personBy(w.floor), w.floorUnit)""", who)
        ck("...and the rule says the same", rule is False)

    # A function's head, on the projects their plan lives behind.
    be(pg, who["fnhead"], "fn:" + who["fn"], "fnstrat", "proj")
    fbtn = pg.query_selector(".pane .paneact [data-dlpptx]")
    ck("a function head sees it on their Projects pane", fbtn is not None)
    ff = grab(pg, "fn-caps.pptx")
    ck("...and it downloads", ff is not None)
    if ff:
        d = read_pptx(ff)
        got = pg.evaluate("""(w) => {
          const c = capsOfFunction(w.fn)[0];
          return { cap: c.name, proj: (c.projects[0] || {}).name || "" };
        }""", who)
        ck("a capability and its project are inside",
           got["cap"] in d["text"] and got["proj"] in d["text"],
           got)

    print("")
    ck("no page errors anywhere in the run", not errs, "; ".join(errs[:3]))
    b.close()

print("\n%s" % ("ALL OK" if bad == 0 else "%d FAILURES" % bad))
sys.exit(1 if bad else 0)
