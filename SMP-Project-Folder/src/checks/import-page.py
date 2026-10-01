"""IMPORT & ARCHIVES, REBUILT AS THREE TABS (§304).

Islam: *"I need a mockup to refine this page and the buttons inside it as it's
too clumsy"*, then, of three tidier drawings of it, *"I don't like any of the
options. we need to rethink the page."*

WHAT IS ASSERTED IS THE PROBLEM, NOT THE LAYOUT (§94.8). The old page's fault
was measurable — 894px of empty row before the first control, at a distance
that changed with the window, because `.minisw { margin-left:auto }` ate the
row's free space — and the fix is not "the button is at x=1180" but that the
page no longer HAS that switch and every control sits in a card's own foot.

FIVE THINGS IT DELIBERATELY MEASURES THE HARD WAY:

  · THE FILE, NEVER THE BUTTON (§96). Every download is PRESSED and the bytes
    are caught and opened. A button wired to nothing renders identically to one
    that works, and this page is six of them.

  · THE ZIP IS OPENED AND EVERY MEMBER READ. §304 taught `zipStore()` to hold
    bytes; a zip of workbooks built by a writer that still ran them through
    TextEncoder would download, look right, and refuse to open.

  · BOTH ENDS (§94.2). Select all / none is asserted present HERE and ABSENT on
    a tactic's collaborators picker — it is opt-in per control, and a build that
    gave it to every ticking list would pass the first half alone.

  · A NAME IS A FACT ABOUT A FILE ON A DISK. The plan and the progress file for
    one subject were briefly given the SAME name, because the leaf leaned on a
    folder that a single file does not get. Found by downloading both and
    reading the two names.

  · THE STATE IS MADE. The demo has no archives at all, so the Archives button
    and its held state are unreachable by navigating (§94.2, §255).

Run: SMP_CHROME=... python3 qa-run.py checks/import-page.py
"""
import io
import pathlib
import zipfile
import os
from playwright.sync_api import sync_playwright

# SMP_BUILT points it at another build, which is how a falsification is made
# (§276) and how a red is established as somebody else's (§303). Without it a
# falsification runs against the file it was falsifying and goes green.
URL = "file://" + str(pathlib.Path(os.environ.get("SMP_BUILT") or pathlib.Path(
    pathlib.Path(__file__).resolve().parent.parent,
    "strategy-management-platform.html")).resolve())
DL = pathlib.Path("/tmp/smp-import-check")
DL.mkdir(exist_ok=True)

bad, errs = 0, []


def ck(w, ok, x=""):
    global bad
    if not ok:
        bad += 1
    print(("  ok      " if ok else "  FAIL    ") + w + (("  — " + str(x)) if not ok and x else ""))


def grab(pg, sel, label):
    """Press a control and return (filename, bytes). EVERY PROBE DEGRADES
    (§215): a missing button reports a failure rather than killing the run and
    taking every later assertion's honesty with it."""
    el = pg.query_selector(sel)
    if not el:
        ck(label + " — the control is there", False, sel)
        return None, None
    try:
        with pg.expect_download(timeout=20000) as di:
            pg.eval_on_selector(sel, "e => e.click()")
        d = di.value
        path = DL / d.suggested_filename
        d.save_as(str(path))
        return d.suggested_filename, path.read_bytes()
    except Exception as e:
        ck(label + " — pressing it produces a file", False, e)
        return None, None


def sheets_of(data):
    """The sheet names of an .xlsx, and the text of its first sheet."""
    z = zipfile.ZipFile(io.BytesIO(data))
    import re
    wb = z.read("xl/workbook.xml").decode()
    names = re.findall(r'<sheet name="([^"]+)"', wb)
    first = z.read("xl/worksheets/sheet1.xml").decode()
    return names, first


def setup(pg, sec):
    pg.evaluate("(s) => { current='setup'; currentSub='import'; CURSEC.import=s; paint(); }", sec)
    pg.wait_for_timeout(350)


with sync_playwright() as p:
    b = p.chromium.launch()
    pg = b.new_page(viewport={"width": 1600, "height": 1000}, accept_downloads=True)
    pg.on("pageerror", lambda e: errs.append("PAGEERROR: " + str(e)))
    pg.on("console", lambda m: errs.append(m.text) if m.type == "error" else None)
    pg.goto(URL)
    pg.wait_for_timeout(800)
    pg.select_option("#asWho", "smo")
    pg.wait_for_timeout(300)

    print("\n§1  the three tabs lead the page, and the mode switch is gone")
    setup(pg, "dl")
    tabs = pg.eval_on_selector_all(".setuppane .secrow button",
                                   "e => e.map(x => x.textContent.trim())")
    # THE THREE ARE ASSERTED IN ORDER AND AT THE FRONT, never as the whole list
    # (§218, §214.3): §261.9 from another session hangs **Video storage** off
    # this same page — a fourth thing the platform is HOLDING rather than a
    # fourth way in — so a flat comparison would call a build behaving exactly
    # as two decisions decided it broken. What this section is about is that
    # out and back are two tabs and the mode switch is gone; what comes after
    # them is that section's to say.
    ck("the page's three tabs lead it, in order",
       tabs[:3] == ["Download", "Upload", "Archived plans"], tabs)
    # BOTH ENDS: the switch is gone from the page, not merely from this tab.
    setup(pg, "up")
    up_sw = pg.eval_on_selector_all("[data-impkind]", "e => e.length")
    setup(pg, "dl")
    dl_sw = pg.eval_on_selector_all("[data-impkind]", "e => e.length")
    ck("the Plan|Progress switch is gone from both tabs", up_sw == 0 and dl_sw == 0,
       "%s / %s" % (dl_sw, up_sw))
    ck("Build a plan is off this page (§304.2)", not pg.query_selector("[data-buildplan]"))

    print("\n§2  the blank template, one per way of planning, as files")
    n1, d1 = grab(pg, '[data-dlblank="pillars"]', "pillars template")
    if d1:
        names, first = sheets_of(d1)
        ck("the pillars template is a workbook with a Read me", names[0] == "Read me", names[:3])
        ck("…and it says which kind it is", "Plan workbook" in first)
        ck("…and it names the cycle (§304.3)", "Cycle" in first)
    n2, d2 = grab(pg, '[data-dlblank="projects"]', "projects template")
    if d2:
        names2, _ = sheets_of(d2)
        ck("the projects template carries a Projects sheet", "Projects" in names2, names2)

    # ── §380: A TEMPLATE PER WAY OF PLANNING, AND THE LIST IS THE NARROWING ──
    # ASSERTED AS THE AGREEMENT WITH `FN_FORMATS` (§94.8, §214.3), never as the
    # number three: a fourth way of planning added tomorrow should turn this red
    # rather than leave the card quietly a format short, which is exactly how the
    # card came to be two decisions stale.
    fmts = pg.evaluate("() => FN_FORMATS")
    btns = pg.eval_on_selector_all("[data-dlblank]", "e => e.map(x => x.dataset.dlblank)")
    ck("one blank template per way a plan is written (§380)",
       sorted(btns) == sorted(fmts), "%s vs %s" % (btns, fmts))
    # THE STATE IS MADE (§255): the worked example has no objectives-and-actions
    # function at all, so every assertion below about what that file offers would
    # pass on a build that offers nothing. Put back at the end of the section.
    made = pg.evaluate("""() => {
      const k = FUNCTION_KEYS.filter(x => !fnPlansInPillars(FUNCTIONS[x]))[0];
      const was = { fmt: FUNCTIONS[k].format, acts: FUNCTIONS[k].actions };
      FUNCTIONS[k].format = "objectives";
      FUNCTIONS[k].actions = [{ id:k+"-A1", name:"Sign the framework agreement",
                                owner:"Hala Nabil", due:"Jul 2026" }];
      window.__impWas = was; window.__impK = k;
      paint();
      return { k, name: FUNCTIONS[k].name };
    }""")
    pg.wait_for_timeout(300)
    n3, d3 = grab(pg, '[data-dlblank="objectives"]', "objectives & actions template")
    # THE PROJECTS FILE IS TAKEN AGAIN, FROM THE SAME TENANT. `d2` above was
    # built before the state was made, so comparing the two lists compared two
    # different tenants and reported the narrowing broken on a build that does
    # it perfectly — a measurement whose two halves are of different worlds
    # (§105.6's family, in a fixture rather than in a file on disk).
    n2b, d2b = grab(pg, '[data-dlblank="projects"]', "projects template, same tenant")
    if d3:
        names3, first3 = sheets_of(d3)
        # WHAT EACH FORMAT DROPS IS THE WHOLE DECISION, and both halves are
        # asserted (§94.2): a build that shipped one file with every sheet in it
        # satisfies "it carries Actions" perfectly.
        ck("the objectives template carries Objectives and Actions",
           "Objectives" in names3 and "Actions" in names3, names3)
        ck("…and none of the project sheets",
           not ({"Projects", "Deliverables", "Outcomes", "Milestones"} & set(names3)), names3)
        ck("…and the projects template drops Actions instead",
           d2b is not None and "Actions" not in sheets_of(d2b)[0]
           and "Milestones" in sheets_of(d2b)[0],
           sheets_of(d2b)[0] if d2b else None)
        # THE READ ME'S OWN DROPDOWN IS WHAT SOMEBODY IS STANDING IN FRONT OF.
        # Read out of the FILE (§96) — the list lives in the sheet's one inline
        # dataValidation, so this measures the bytes and not a function's return.
        def b2list(xml):
            import re
            m = re.search(r'<dataValidation [^>]*sqref="B2:B2"[^>]*>'
                          r'<formula1>"?([^"<]*)"?</formula1>', xml)
            return [x for x in (m.group(1).split(",") if m else []) if x]
        l3 = b2list(first3)
        l2 = b2list(sheets_of(d2b)[1]) if d2b else []
        ck("the objectives file offers only the functions that plan that way",
           l3 == [made["name"]], l3)
        ck("…and the projects file does not offer it", made["name"] not in l2, l2)
        ck("…while still offering everything else", len(l2) > 0, l2)
        # THE ROW ABOVE THE NAME, and the prose under it — a file with no
        # Projects sheet must not tell somebody to fill Projects first.
        ck("the objectives file says Supporting function over its name",
           "Supporting function" in first3 and "Capability" not in first3)
        ck("…and its instructions do not name a sheet it does not carry",
           "Fill Projects FIRST" not in first3)
        ck("…while the projects file still says Capability",
           d2b is not None and "Capability" in sheets_of(d2b)[1])
    # AND A TEMPLATE NOBODY CAN FILL IN IS §61's TRAP WEARING A DROPDOWN: with
    # the tenant put back, nothing plans that way, so the list is EMPTY — and an
    # empty inline list refuses every value there is. The guard is that no
    # validation is written at all, asserted on the bytes.
    pg.evaluate("""() => {
      const k = window.__impK, was = window.__impWas;
      FUNCTIONS[k].format = was.fmt;
      if (was.acts === undefined) delete FUNCTIONS[k].actions; else FUNCTIONS[k].actions = was.acts;
      paint();
    }""")
    pg.wait_for_timeout(300)
    n4, d4 = grab(pg, '[data-dlblank="objectives"]', "objectives template, nobody planning that way")
    if d4:
        _, first4 = sheets_of(d4)
        ck("with nobody planning that way the file still opens and B2 is typeable",
           "dataValidation" not in first4, first4[-300:])

    # THE THIRD BUTTON HAD TO BE GROUPED, AND NOTHING MEASURED THE ROW. `.ffoot`
    # wraps and `.why` takes the free space, so three loose buttons split 2+1
    # below ~1100px with the odd one stranded at the FAR LEFT under the
    # sentence — the new flex line starting where the ROW starts, not where the
    # buttons were. Asserted as the property (one run, ending where the row
    # ends), never as a coordinate (§94.8), and at four widths because the
    # fault does not exist at the one this file otherwise runs at (§27.1).
    for w in (1440, 1280, 1100, 1000):
        pg.set_viewport_size({"width": w, "height": 1000})
        pg.wait_for_timeout(150)
        setup(pg, "dl")
        row = pg.eval_on_selector(".fcard .ffoot", """e => {
          const bs = [...e.querySelectorAll('button')], f = e.getBoundingClientRect();
          return { n: bs.length,
                   rows: new Set(bs.map(b => Math.round(b.getBoundingClientRect().top))).size,
                   gap: Math.round(f.right - bs[bs.length-1].getBoundingClientRect().right),
                   lead: Math.round(bs[0].getBoundingClientRect().left - f.left) };
        }""")
        ck("at %dpx the three buttons are one run, ending where the row does" % w,
           row["n"] == 3 and row["rows"] == 1 and row["gap"] < 30 and row["lead"] > 60, row)
    pg.set_viewport_size({"width": 1600, "height": 1000})
    pg.wait_for_timeout(150)
    setup(pg, "dl")

    print("\n§3  the picker — a count, ticks, and Select all / none")
    lab = pg.eval_on_selector(".pickrow .ssbtn .sslabel", "e => e.textContent.trim()")
    n_all = pg.evaluate("impPlanSubjects().length")
    ck("the closed control says a count, not every name",
       lab == "%d of %d subjects" % (n_all, n_all), lab)
    pg.eval_on_selector(".pickrow .ssbtn", "e => e.click()")
    pg.wait_for_timeout(250)
    ck("the popup carries Select all and Select none",
       pg.eval_on_selector_all(".sspop .ssall .linkbu", "e => e.map(x => x.textContent.trim())")
       == ["Select all", "Select none"])
    ck("…and it searches", bool(pg.query_selector(".sspop .sssearch")))
    # NOTHING REPAINTS UNDER A TICKING HAND (§130.1): the popup must survive a
    # tick, and the counts must follow it anyway.
    pg.eval_on_selector_all(".sspop .ssrow", "e => e[0].click()")
    pg.wait_for_timeout(200)
    still = bool(pg.query_selector(".sspop"))
    cnt = pg.eval_on_selector('[data-dlpick="plans"] .cnt', "e => e.textContent.trim()")
    ck("a tick leaves the popup open", still)
    ck("…and the count follows it in place", cnt == "(%d)" % (n_all - 1), cnt)
    pg.keyboard.press("Escape")
    pg.wait_for_timeout(150)

    print("\n§4  Select all / none is THIS control's, not every ticking list's")
    # A tactic's collaborators is the platform's other multiple select (§130.1).
    # THE PEN IS PRESSED, never assigned: §269 made EDIT_PAGE a MAP keyed by
    # page, so `EDIT_PAGE=['plan']` set a shape nothing reads and opened
    # nothing — a probe that models the state instead of using the control
    # measures a page the product never draws (§96).
    pg.evaluate("() => { current=UNIT_KEYS[0]; currentSub='strategy';"
                " CURSEC.strategy='plan'; paint(); }")
    pg.wait_for_timeout(350)
    pen = pg.query_selector(".secpen") or pg.query_selector("[data-page]")
    if pen:
        pen.click()
    pg.wait_for_timeout(450)
    # SEARCHSEL PUTS ITS BUTTON BEFORE THE SELECT (§34), and CSS has no
    # previous-sibling selector — so the button is found from the select rather
    # than guessed at from the cell.
    opened = pg.evaluate("() => { var s = document.querySelector('.collabsel');"
                         " if (!s) return false;"
                         " var b = s.previousSibling;"
                         " if (!b || !b.classList || !b.classList.contains('ssbtn')) return false;"
                         " b.click(); return true; }")
    pg.wait_for_timeout(250)
    ck("a collaborators picker exists to compare against", opened)
    if opened:
        ck("the collaborators picker did NOT gain Select all / none (§53.5)",
           pg.eval_on_selector_all(".sspop .ssall", "e => e.length") == 0)
        ck("…and it lists its names rather than a count",
           pg.evaluate("() => { var s = document.querySelector('.collabsel');"
                       " return s.dataset.sslabel !== 'count'; }"))
        pg.keyboard.press("Escape"); pg.wait_for_timeout(150)
    pg.evaluate("() => { leaveModes(); paint(); }")

    print("\n§5  one subject is one workbook; several are a zip")
    setup(pg, "dl")
    pg.evaluate("() => { IMP.pick = [UNIT_KEYS[0]]; paint(); }")
    pg.wait_for_timeout(250)
    np, dp = grab(pg, '[data-dlpick="plans"]', "one plan")
    ng, dg = grab(pg, '[data-dlpick="progress"]', "one progress file")
    ck("one subject arrives as a workbook, not a zip of one",
       bool(np) and np.endswith(".xlsx"), np)
    # A NAME IS A FACT ABOUT A FILE ON A DISK — the two must differ.
    ck("the plan and the progress file are not given the same name",
       bool(np) and bool(ng) and np != ng, "%s vs %s" % (np, ng))
    ck("…and each names its cycle", bool(np) and "h1-2026" in np, np)

    pg.evaluate("() => { IMP.pick = null; paint(); }")
    pg.wait_for_timeout(250)
    nz, dz = grab(pg, '[data-dlpick="plans"]', "every plan")
    if dz:
        ck("several subjects arrive as a zip", nz.endswith(".zip"), nz)
        z = zipfile.ZipFile(io.BytesIO(dz))
        mem = z.namelist()
        ck("the zip holds one file per subject", len(mem) == n_all, "%s of %s" % (len(mem), n_all))
        ck("…in a folder that says what they are",
           all(m.startswith("plans/") for m in mem), mem[:2])
        ck("…and testzip passes", z.testzip() is None)
        # EVERY MEMBER IS ITSELF A WORKBOOK — the whole of §304's binary-zip change.
        okd = 0
        for m in mem:
            try:
                inner = zipfile.ZipFile(io.BytesIO(z.read(m)))
                if "xl/workbook.xml" in inner.namelist():
                    okd += 1
            except Exception:
                pass
        ck("every workbook inside the zip opens", okd == len(mem), "%s of %s" % (okd, len(mem)))

    print("\n§6  Archives is held at nought, and live when there is one")
    held = pg.eval_on_selector('[data-dlpick="archives"]',
                               "e => ({ dis: e.getAttribute('aria-disabled'),"
                               " tip: e.getAttribute('data-tip'), n: e.textContent.trim() })")
    ck("with no archives the button is HELD, never disabled (§221)",
       held["dis"] == "true", held)
    ck("…and it says why", bool(held["tip"]), held)
    # THE STATE IS MADE: the demo has no archives at all.
    pg.evaluate("() => { archiveUnitPlan(UNITS[UNIT_KEYS[0]], 'made by the check'); paint(); }")
    pg.wait_for_timeout(300)
    live = pg.eval_on_selector('[data-dlpick="archives"]',
                               "e => ({ dis: e.getAttribute('aria-disabled'),"
                               " n: e.querySelector('.cnt').textContent }) ")
    ck("with one archive it is live and counts it", live["dis"] is None and live["n"] == "(1)", live)
    na, da = grab(pg, '[data-dlpick="archives"]', "the archive")
    if da:
        namesA, _ = sheets_of(da)
        ck("an archived plan comes back as its own workbook", "Read me" in namesA, namesA[:3])

    print("\n§7  upload — two buttons, and the file confirms the one you pressed")
    setup(pg, "up")
    ups = pg.eval_on_selector_all("[data-upkind]", "e => e.map(x => x.dataset.upkind)")
    ck("two buttons, a plan and progress", ups == ["plan", "progress"], ups)
    ck("…and the tab says which cycle it writes into",
       "H1 2026" in pg.inner_text(".setuppane"))
    if dp:
        pg.set_input_files("#imp-file-progress", str(DL / np))
        pg.wait_for_timeout(900)
        msg = pg.evaluate("() => ((IMP.check && IMP.check.problems) || []).map(x => x.msg).join(' ')")
        ck("a plan pressed as Progress is refused BY NAME (§304.4)",
           "plan workbook" in msg and "Progress" in msg, msg[:90])
        ck("…and nothing was read", pg.evaluate("() => !IMP.summary && !IMP.diff"))
        pg.set_input_files("#imp-file-plan", str(DL / np))
        pg.wait_for_timeout(900)
        ck("the same file on the right button is read",
           pg.evaluate("() => !!IMP.summary"))
        # PYTHON SLICING IS NOT JAVASCRIPT. The first draft put `[:60]` inside an
        # evaluate and the whole run DIED on it — in the file whose own docstring
        # promises every probe degrades (§215, again).
        barTxt = (pg.eval_on_selector(".readbar", "e => e.textContent")
                  if pg.query_selector(".readbar") else "")
        ck("…and the bar says what it found", "Plan workbook" in barTxt, barTxt[:70])

    print("\n§8  nothing hands out a CSV any more")
    for sec in ("dl", "up"):
        setup(pg, sec)
        ck("no CSV control on the %s tab" % sec,
           pg.eval_on_selector_all("[data-dl], [data-showcsv]", "e => e.length") == 0)
    ck("…and the reader is untouched", pg.evaluate("typeof loadCSV === 'function'"))

    print("\n§8b every subject the page offers can actually be built (§334.15)")
    setup(pg, "dl")
    offered = pg.evaluate("() => impPlanSubjects().map(o => o.v)")
    # THE LIST AND THE BUILDER MUST AGREE. §326 taught `impHolderFor()` to
    # resolve `fn:<key>` to a projects function's own holder and taught the
    # upload to offer that function BY NAME — and left this list offering the
    # PILLARS functions alone, so seven functions owning eighteen projects
    # between them could not download a plan at all: built and unreachable
    # (§61, §96), and a plan that cannot leave cannot come back (§22).
    # Asserted as the AGREEMENT rather than as a count of subjects (§94.8),
    # so a tenant with different functions cannot make it wrong.
    owns = pg.evaluate("() => FUNCTION_KEYS.filter(k => fnOwnProjects(k).length)"
                       ".map(k => 'fn:' + k)")
    ck("every function that owns projects is offered", owns and
       all(v in offered for v in owns), {"owns": owns, "offered": offered})
    built = pg.evaluate("(vs) => vs.map(v => { try { const w = impPlanWorkbookFor(v);"
                        " return w && w.length ? null : v; } catch (e) { return v; } })"
                        ".filter(Boolean)", offered)
    ck("…and every subject on the list builds a workbook", built == [], built)
    # BOTH ENDS (§94.2): the file really carries that function's own projects,
    # so a build that offered the subject and shipped an empty sheet fails.
    rows = pg.evaluate("""(v) => {
      const w = impPlanWorkbookFor(v) || [];
      const sh = w.filter(s => /project/i.test(s.name || ""))[0];
      return sh ? (sh.rows || []).length : -1; }""", owns[0] if owns else "")
    ck("…and the file carries that function's own projects", rows > 0, rows)

    print("\n§9  console")
    ck("no console errors", not errs, errs[:3])
    b.close()

print("\nimport-page: " + ("all green" if not bad else "%d FAILED" % bad))
