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


def slidenames(z):
    """Slide parts IN DECK ORDER. `sorted()` is lexicographic, so slide10 comes
    before slide2 — which silently measures a different slide than the one the
    check went looking for. Numeric, once, for every reader here."""
    return sorted((n for n in z.namelist()
                   if n.startswith("ppt/slides/slide") and n.endswith(".xml")),
                  key=lambda n: int(n.split("slide")[-1].split(".")[0]))


def read_pptx(path):
    """Unzip, parse EVERY xml part (a file PowerPoint refuses is one that
    parses nowhere), and return the concatenated slide text."""
    z = zipfile.ZipFile(path)
    text = []
    for n in z.namelist():
        if n.endswith(".xml") or n.endswith(".rels"):
            ET.fromstring(z.read(n))  # raises on anything malformed
    slides = slidenames(z)
    for n in slides:
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

    # §145.9 (Islam, 2026-08-27): the download BUTTON is hidden for everyone —
    # the builder and its rule stand, kept for the feature's return, so the
    # deck's content is still proved through a direct call to sendPlanPptx()
    # while every surface is asserted to draw NO button.
    def grab(pg, name, target):
        with pg.expect_download() as dl:
            pg.evaluate("(t) => sendPlanPptx(t)", target)
        path = os.path.join(tmp, name)
        dl.value.save_as(path)
        return path

    be(pg, who["smo"], who["unit"], "strategy", "plan")
    ck("§145.9: the download button is drawn for nobody — the SMO included",
       pg.query_selector("[data-dlpptx]") is None)
    f = grab(pg, "smo-unit.pptx", who["unit"])
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
    ck("the custodian sees no download either (§145.9)",
       pg.query_selector("[data-dlpptx]") is None)
    ck("...and hiding it did not take the arrows with it",
       pg.query_selector(".pane .paneact [data-arrange]") is not None)
    ck("...while the dormant rule still answers for them (kept for its return)",
       grab(pg, "cust-unit.pptx", who["unit"]) is not None)

    be(pg, who["head"], who["unit"], "strategy", "plan")
    ck("the unit owner sees no download (§145.9)",
       pg.query_selector("[data-dlpptx]") is None)

    # The fixture itself is asserted (§54.5): a demo with nobody to say no
    # about would pass the negative case by never running it.
    ck("the demo still holds a bystander to test the refusal with",
       who["floor"] is not None)
    if who["floor"]:
        be(pg, who["floor"], who["floorUnit"], "strategy", "plan")
        ck("somebody who does not hold the unit does NOT see it",
           pg.query_selector("[data-dlpptx]") is None)
        rule = pg.evaluate("""(w) =>
          SMPRules.mayDownloadPlan(world(), personBy(w.floor), w.floorUnit)""", who)
        ck("...and the dormant rule still refuses them", rule is False)

    # A function's head, on the projects their plan lives behind.
    be(pg, who["fnhead"], "fn:" + who["fn"], "fnstrat", "proj")
    ck("a function head sees no download on their Projects pane (§145.9)",
       pg.query_selector("[data-dlpptx]") is None)
    ff = grab(pg, "fn-caps.pptx", "fn:" + who["fn"])
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

    # ── 4 · §119'S FOUR FOLLOW-UPS ───────────────────────────────────
    print("\n4 · the deck names its gaps, the rail opens terse, the KB is the office's")

    # THE DECK MAKES ITS OWN GAPS (§94.2): the demo plan is complete, so a
    # check that only downloads it would never once render a Missing mark.
    be(pg, who["smo"], who["unit"], "strategy", "plan")
    pg.evaluate("""(u) => {
      const x = UNITS[u];
      x.aspiration = ""; x.swot.t = [];
      x.keyObjectives[0].target = "";
      x.items[0].measures[0].dir = ""; x.items[0].measures[0].compile = "";
      x.items[0].tactics[0].owner = "";
      paint();
    }""", who["unit"])
    pg.wait_for_timeout(300)
    gaps = grab(pg, "gaps.pptx", who["unit"])
    ck("a plan with holes still downloads", gaps is not None)
    if gaps:
        z = zipfile.ZipFile(gaps)
        A = "{http://schemas.openxmlformats.org/drawingml/2006/main}"
        marks, plain = [], 0
        for n in slidenames(z):
            root = ET.fromstring(z.read(n))
            for r in root.iter(A + "r"):
                t = r.find(A + "t")
                if t is None or (t.text or "") != "Missing":
                    continue
                pr = r.find(A + "rPr")
                clr = pr.find(A + "solidFill/" + A + "srgbClr") if pr is not None else None
                bold = pr is not None and pr.get("b") == "1"
                val = clr.get("val") if clr is not None else None
                marks.append((bold, val))
                if not bold or val is None:
                    plain += 1
        # SIX GAPS WERE MADE AND SIX MUST BE NAMED — an exact count, because
        # "at least one" passes a build that marks the aspiration and forgets
        # every table cell.
        ck("every gap made is named Missing (6)", len(marks) == 6, len(marks))
        ck("...all of them bold", all(b for b, _ in marks), marks)
        ck("...all of them in the platform's own red, not the page ink",
           all(v == "B04434" for _, v in marks), marks)
        # AND THE FILLED FACTS ARE NOT TOUCHED: a builder that marked
        # everything would pass every assertion above.
        txt = read_pptx(gaps)["text"]
        ck("a filled target still reads its value", "32%" in txt)
        ck("a filled owner still reads its name", "Mohamed Rizk" in txt)

        # THE TACTICS TABLE IS FOUR QUARTER COLUMNS (§119, Islam: "a column for
        # each Q with a mark for the qs in action").
        heads, marked = None, 0
        for n in slidenames(z):
            root = ET.fromstring(z.read(n))
            body = "".join(t.text or "" for t in root.iter(A + "t"))
            if "Tactics" not in body:
                continue
            for tbl in root.iter(A + "tbl"):
                rows = list(tbl.iter(A + "tr"))
                cells = [ "".join(t.text or "" for t in c.iter(A + "t"))
                          for c in rows[0].iter(A + "tc") ]
                heads = heads or cells
                for row in rows[1:]:
                    vals = [ "".join(t.text or "" for t in c.iter(A + "t"))
                             for c in row.iter(A + "tc") ]
                    marked += sum(1 for v in vals[-4:] if v.strip())
            break
        ck("the tactics table ends in Q1 Q2 Q3 Q4",
           heads is not None and heads[-4:] == ["Q1", "Q2", "Q3", "Q4"], heads)
        ck("...and the quarters in action carry a mark", marked > 0, marked)
        ck("...while the ones that are not stay empty",
           heads is not None and marked < 4 * 12, marked)

    # THE RAIL OPENS TERSE (§119). Asserted from a FRESH page, because the
    # preference is per-browser and this one has been driven all run.
    fresh = b.new_page(viewport={"width": 1600, "height": 1000})
    fresh.goto(URL); fresh.wait_for_timeout(1400)
    fresh.evaluate("""(k) => { VIEWER = k; leaveModes();
      current = "mobile"; currentSub = "strategy"; CURSEC["strategy"] = "plan"; paint(); }""",
      who["smo"])
    fresh.wait_for_timeout(350)
    r = fresh.evaluate("""() => ({
      terse: RAIL_TERSE,
      subs: document.querySelectorAll(".rail .rsub").length,
      lit: !!document.querySelector(".railterse.on"),
      names: document.querySelectorAll(".rail .ritem").length })""")
    ck("a first visit opens the pillar rail collapsed", r["terse"] is True, r)
    ck("...so no row carries its small line", r["subs"] == 0, r["subs"])
    ck("...the control shows itself as on", r["lit"] is True)
    ck("...and the names are all still there", r["names"] > 0, r["names"])
    # BOTH ENDS: pressing it brings the detail back, or a build that had lost
    # the sub-lines entirely would pass everything above (§94.2).
    fresh.click(".railterse"); fresh.wait_for_timeout(350)
    back = fresh.evaluate("() => document.querySelectorAll('.rail .rsub').length")
    ck("pressing the control brings the detail back", back > 0, back)

    # THE KNOWLEDGE BASE IS THE OFFICE'S (§119, reversing §30). Asked of the
    # page def — the one thing the rail, the search and paint() all read.
    kb = fresh.evaluate("""(w) => {
      const d = setupDefs().filter(x => x.k === "kb")[0];
      const asks = (k) => { VIEWER = k; return !d.when || d.when(); };
      return { exists: !!d, smo: asks(w.smo), head: asks(w.head),
               cust: asks(w.cust), fnhead: asks(w.fnhead),
               floor: w.floor ? asks(w.floor) : null };
    }""", who)
    ck("the knowledge base page still exists", kb["exists"] is True)
    ck("the office opens it", kb["smo"] is True)
    for k, lab in [("head", "a unit owner"), ("cust", "a strategy custodian"),
                   ("fnhead", "a function head"), ("floor", "somebody with no role")]:
        if kb[k] is None:
            continue
        ck("%s does NOT" % lab, kb[k] is False, kb[k])
    fresh.close()

    # ── 5 · §119'S THREE FOLLOW-UPS ──────────────────────────────────
    print("\n5 · quarters that say nothing, a closing slide, and the overview's download")

    # A TACTIC WITH NO QUARTER AT ALL IS A GAP; ONE WITH SOME IS NOT (§119.7).
    # Both halves, because a build that marked every quarter cell would pass a
    # check that only looked for the word.
    be(pg, who["smo"], who["unit"], "strategy", "plan")
    pg.evaluate("""(u) => {
      const p = UNITS[u].items[0];
      p.tactics.forEach(t => { t.q1 = 0; t.q2 = 0; t.q3 = 0; t.q4 = 0; });
      p.tactics[0].q2 = 1;              /* one tactic still says WHEN */
      paint();
    }""", who["unit"])
    pg.wait_for_timeout(300)
    MUTATED = pg.evaluate("(u) => UNITS[u].items[0].name", who["unit"])
    noq = grab(pg, "noq.pptx", who["unit"])
    ck("a plan whose tactics have no quarters still downloads", noq is not None)
    if noq:
        z = zipfile.ZipFile(noq)
        A = "{http://schemas.openxmlformats.org/drawingml/2006/main}"
        rows = []
        for n in slidenames(z):
            root = ET.fromstring(z.read(n))
            body = "".join(t.text or "" for t in root.iter(A + "t"))
            if "Tactics" not in body or MUTATED not in body:
                continue   # the pillar the mutation touched, not merely the first
            for tbl in root.iter(A + "tbl"):
                for tr in list(tbl.iter(A + "tr"))[1:]:
                    tcs = list(tr.iter(A + "tc"))
                    qs = tcs[-4:]
                    texts = ["".join(t.text or "" for t in c.iter(A + "t")) for c in qs]
                    def red(c):
                        clr = c.find(".//" + A + "rPr/" + A + "solidFill/" + A + "srgbClr")
                        return clr is not None and clr.get("val") == "B04434"
                    def bold(c):
                        pr = c.find(".//" + A + "rPr")
                        return pr is not None and pr.get("b") == "1"
                    rows.append({
                        "cells": len(qs),
                        "texts": texts,
                        "reds": sum(1 for c in qs if red(c)),
                        "bolds": sum(1 for c in qs if bold(c)),
                        "alarm": sum(1 for c in qs if red(c)) == 4,
                        "span": qs[0].get("gridSpan"),
                        "merged": [c.get("hMerge") for c in qs[1:]] })
            break
        ck("the tactics table was found", len(rows) > 0, len(rows))
        # THE TEMPLATE'S SHAPE IS NOT SPENT ON SAYING THE GAP (§128.1, Islam's
        # correction): four separate columns on EVERY row, no merged cell ever.
        ck("every row keeps all four quarter columns",
           all(r["cells"] == 4 for r in rows), [r["cells"] for r in rows])
        ck("...and nothing is merged", all(not r["span"] and not any(r["merged"])
                                           for r in rows), rows[:2])
        gapped = [r for r in rows if r["alarm"]]
        # A QUESTION MARK, NEVER A TICK (§128.2). Asserted as BOTH halves —
        # the mark is `?` AND no tick appears on a gapped row — because a
        # build that put a red ✓ back would satisfy "four red bold cells".
        ck("a tactic with no quarter carries a question mark in all four",
           all(r["texts"] == ["?"] * 4 for r in gapped), gapped[:2])
        ck("...and never a tick, which would read as an affirmation",
           all("\u2713" not in r["texts"] for r in gapped), gapped[:2])
        ck("...in bold red, the colour the deck keeps for a gap",
           all(r["reds"] == 4 and r["bolds"] == 4 for r in gapped), gapped[:2])
        ck("...and that is every tactic but the one that names a quarter",
           len(gapped) == len(rows) - 1, (len(gapped), len(rows)))
        # THE OTHER HALF, or a build that marked every row would pass.
        kept = [r for r in rows if not r["alarm"]]
        ck("a tactic that names a quarter is not flagged", len(kept) == 1, kept)
        ck("...its tick is the ordinary ink, and only the named quarter carries one",
           all(r["reds"] == 0 and r["texts"].count("\u2713") < 4 for r in kept), kept)
        ck("...and an answered row never wears a question mark",
           all("?" not in r["texts"] for r in kept), kept)

        # THE DECK CLOSES ON THANK YOU (§119.8).
        last = slidenames(z)[-1]
        txt = "".join(t.text or "" for t in ET.fromstring(z.read(last)).iter(A + "t"))
        ck("the last slide is the Thank you", "Thank you" in txt, txt[:60])

    # THE FUNCTION OVERVIEW carried the download too (§119.9) and §145.9 hides
    # it there like everywhere else — asserted, because a hide that missed one
    # of the two surfaces would be exactly §119.9's fault inverted.
    be(pg, who["smo"], "fn:" + who["fn"], "fnstrat", "found")
    ck("the Function overview draws no download either (§145.9)",
       pg.query_selector("[data-dlpptx]") is None)
    f = grab(pg, "fn-overview.pptx", "fn:" + who["fn"])
    ck("...while the builder still answers a direct ask", f is not None)
    if f:
        d = read_pptx(f)
        ck("...and its deck closes on Thank you", "Thank you" in d["text"])

    print("")
    ck("no page errors anywhere in the run", not errs, "; ".join(errs[:3]))
    b.close()

print("\n%s" % ("ALL OK" if bad == 0 else "%d FAILURES" % bad))
sys.exit(1 if bad else 0)
