"""IMPORT & ARCHIVES, REBUILT AS THREE TABS (§295).

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

  · THE ZIP IS OPENED AND EVERY MEMBER READ. §295 taught `zipStore()` to hold
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
from playwright.sync_api import sync_playwright

URL = "file://" + str(pathlib.Path(
    pathlib.Path(__file__).resolve().parent.parent,
    "strategy-management-platform.html").resolve())
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

    print("\n§1  three tabs, and the mode switch is gone")
    setup(pg, "dl")
    tabs = pg.eval_on_selector_all(".setuppane .secrow button",
                                   "e => e.map(x => x.textContent.trim())")
    ck("the page's three tabs", tabs == ["Download", "Upload", "Archived plans"], tabs)
    # BOTH ENDS: the switch is gone from the page, not merely from this tab.
    setup(pg, "up")
    up_sw = pg.eval_on_selector_all("[data-impkind]", "e => e.length")
    setup(pg, "dl")
    dl_sw = pg.eval_on_selector_all("[data-impkind]", "e => e.length")
    ck("the Plan|Progress switch is gone from both tabs", up_sw == 0 and dl_sw == 0,
       "%s / %s" % (dl_sw, up_sw))
    ck("Build a plan is off this page (§295.2)", not pg.query_selector("[data-buildplan]"))

    print("\n§2  the blank template, both formats, as files")
    n1, d1 = grab(pg, '[data-dlblank="pillars"]', "pillars template")
    if d1:
        names, first = sheets_of(d1)
        ck("the pillars template is a workbook with a Read me", names[0] == "Read me", names[:3])
        ck("…and it says which kind it is", "Plan workbook" in first)
        ck("…and it names the cycle (§295.3)", "Cycle" in first)
    n2, d2 = grab(pg, '[data-dlblank="projects"]', "projects template")
    if d2:
        names2, _ = sheets_of(d2)
        ck("the projects template carries a Projects sheet", "Projects" in names2, names2)

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
        # EVERY MEMBER IS ITSELF A WORKBOOK — the whole of §295's binary-zip change.
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
        ck("a plan pressed as Progress is refused BY NAME (§295.4)",
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

    print("\n§9  console")
    ck("no console errors", not errs, errs[:3])
    b.close()

print("\nimport-page: " + ("all green" if not bad else "%d FAILED" % bad))
