"""§571: ONE SWITCH HIDES OWNER AND COLLABS. ON EVERY TACTICS SLIDE.

Islam: *"can you give me the option to hide the owner and collabs in the
slides if needed?"*, and *"one switch for everything"*. The People register's
Columns menu, in the slide view's bar beside Grid, for the office.

What this asserts, both ends every time (§94.2):
  · untouched, nothing is stored and both columns are on the slide;
  · the office SEES the menu, and every tick is PRESSED and the STORED field
    read back (§96) — the names left out, sorted, and the key DELETED when
    both are back on (§50.6), so a client that never touches it and one that
    turned both back on are the same bytes;
  · the slide's head and every row lose exactly the column ticked off, and a
    row is still as wide as the head (a column dropped from one and not the
    other is a table whose figures sit under the wrong words);
  · the PowerPoint download follows, read off the file itself;
  · the plan download KEEPS both, where an empty owner is a gap still owed;
  · a unit custodian, who may open the same view, is not offered the menu.

Point it at another build with SMP_BUILT to watch it fail.
"""
import base64, io, os, pathlib, re, zipfile
from playwright.sync_api import sync_playwright

HERE = pathlib.Path(__file__).resolve().parent
FILE = pathlib.Path(os.environ.get("SMP_BUILT") or (HERE.parent / "strategy-management-platform.html"))
bad = 0


def ck(w, ok, x=""):
    global bad
    if not ok:
        bad += 1
    print(("  ok      " if ok else "  FAIL    ") + w + (("  — " + str(x)) if not ok and x != "" else ""))


def press(pg, sel):
    """A press that DEGRADES (§215): on a build without the control the run
    goes on and reports what is missing, rather than dying and reporting less."""
    try:
        pg.click(sel, timeout=2000)
        return True
    except Exception:                                        # noqa: BLE001
        return False


def ev(pg, js, arg=None):
    try:
        return pg.evaluate(js, arg) if arg is not None else pg.evaluate(js)
    except Exception as e:                                   # noqa: BLE001 — §215
        return {"threw": str(e).split("\n")[0]}


# The tactics slide of Mobile's first pillar: its head and its rows' widths.
HEADS = """(mode) => {
  const d = document.createElement('div');
  d.innerHTML = mode === 'plan' ? planDeckBox('mobile').innerHTML : deckHtmlFor('mobile');
  const s = [...d.querySelectorAll('section.dslide')].find(x =>
    [...x.querySelectorAll('thead th')].some(t => t.textContent.trim() === L1('tactic')));
  if (!s) return null;
  const head = [...s.querySelectorAll('thead th')].map(t => t.textContent.trim());
  const widths = [...s.querySelectorAll('tbody tr')].filter(r => !r.classList.contains('osub'))
    .map(r => [...r.children].reduce((n, c) => n + (c.colSpan || 1), 0));
  return { head, widths };
}"""

with sync_playwright() as pw:
    b = pw.chromium.launch()
    pg = b.new_page(viewport={"width": 1600, "height": 900})
    errs = []
    pg.on("pageerror", lambda e: errs.append(str(e)))
    pg.add_init_script("try{sessionStorage.setItem('smp.welcome.seen','1');sessionStorage.setItem('smp.welcome.done','1');"
                       "sessionStorage.setItem('smp.tour.later','1');}catch(e){}")
    pg.goto("file://" + str(FILE))
    pg.wait_for_timeout(900)

    print("── 0 · the rule this hangs off, by name (§215)")
    have = ev(pg, """() => ({ rule: typeof SMPRules.slideColOn === 'function',
      cols: (SMPRules.SLIDE_COLS || []).join(','), field: SMPRules.SLIDE_COLS_OFF })""")
    ck("the shared rule names the two columns and its field",
       have.get("rule") is True and have.get("cols") == "owner,collabs" and have.get("field") == "slideColsOff", have)

    print("── 1 · untouched: nothing stored, both columns shown")
    h0 = ev(pg, HEADS, "review")
    ck("nothing is stored on the company", ev(pg, "() => !('slideColsOff' in GROUP)") is True)
    ck("the tactics slide carries Owner and Collabs.",
       h0 and "Owner" in h0["head"] and "Collabs." in h0["head"], h0)
    ck("...and every row is as wide as its head",
       h0 and h0["widths"] and all(w == len(h0["head"]) for w in h0["widths"]), h0)

    print("── 2 · the office's menu, pressed")
    ev(pg, "() => slidesOpen('unit', 'mobile')")
    pg.wait_for_timeout(800)
    ck("the office is offered the Columns menu", ev(pg, "() => !document.getElementById('slcols').hidden") is True)
    press(pg, "[data-slcols]")
    pg.wait_for_timeout(250)
    ck("...it opens on a press, both ticked",
       ev(pg, """() => { const p = document.getElementById('slcolspanel');
         return !p.hidden && [...p.querySelectorAll('input[data-slcol]')].every(i => i.checked); }""") is True)
    press(pg, "[data-slcol='owner']")
    pg.wait_for_timeout(400)
    ck("Owner off: stored as the name left out",
       ev(pg, "() => JSON.stringify(GROUP.slideColsOff)") == '["owner"]')
    ck("...and the menu stays open for the next one",
       ev(pg, "() => !document.getElementById('slcolspanel').hidden") is True)
    h1 = ev(pg, HEADS, "review")
    ck("...the slide loses Owner and keeps Collabs.",
       h1 and "Owner" not in h1["head"] and "Collabs." in h1["head"], h1)
    ck("...and every row is still as wide as its head",
       h1 and h1["widths"] and all(w == len(h1["head"]) for w in h1["widths"]), h1)
    press(pg, "[data-slcol='collabs']")
    pg.wait_for_timeout(400)
    ck("both off: both names, sorted",
       ev(pg, "() => JSON.stringify(GROUP.slideColsOff)") == '["collabs","owner"]')
    h2 = ev(pg, HEADS, "review")
    ck("...the slide carries neither, and its rows still line up",
       h2 and "Owner" not in h2["head"] and "Collabs." not in h2["head"] and
       all(w == len(h2["head"]) for w in h2["widths"]), h2)

    print("── 3 · the downloads")
    # The file's own bytes, built as review-pptx.py builds them.
    pptx = ev(pg, """() => { const b = buildReviewPptx('mobile');
      let s = ''; for (let i = 0; i < b.length; i += 0x8000) s += String.fromCharCode.apply(null, b.subarray(i, i + 0x8000));
      return btoa(s); }""")
    if isinstance(pptx, str):
        z = zipfile.ZipFile(io.BytesIO(base64.b64decode(pptx)))
        words = [w for n in z.namelist() if re.match(r"ppt/slides/slide\d+\.xml$", n)
                 for w in re.findall(r"<a:t>([^<]*)</a:t>", z.read(n).decode("utf8"))]
        ck("the PowerPoint download follows: no Owner or Collabs. heading in it",
           "Status" in words and "Owner" not in words and "Collabs." not in words,
           [w for w in words if w in ("Owner", "Collabs.", "Status")][:6])
    else:
        ck("the PowerPoint download could be built", False, pptx)
    hp = ev(pg, HEADS, "plan")
    ck("the plan download KEEPS both, and carries no Status",
       hp and "Owner" in hp["head"] and "Collabs." in hp["head"] and "Status" not in hp["head"], hp)

    print("── 4 · back on, and the field is gone")
    press(pg, "[data-slcol='owner']")
    press(pg, "[data-slcol='collabs']")
    pg.wait_for_timeout(400)
    ck("both ticked again: the key is DELETED, not an empty list (§50.6)",
       ev(pg, "() => !('slideColsOff' in GROUP)") is True)
    pg.keyboard.press("Escape")
    pg.wait_for_timeout(200)
    ev(pg, "() => { const p = document.getElementById('slcolspanel'); if (!p.hidden) slidesColsOpen(false); }")
    ev(pg, "() => slidesClose()")
    pg.wait_for_timeout(300)

    print("── 5 · nobody but the office is offered it")
    pg.select_option("#asWho", "mobhead")
    pg.wait_for_timeout(400)
    ev(pg, "() => slidesOpen('unit', 'mobile')")
    pg.wait_for_timeout(800)
    seen = ev(pg, """() => ({ on: document.getElementById('slideroot').classList.contains('on'),
      office: inOffice(), menu: !document.getElementById('slcols').hidden })""")
    ck("the unit's head opens the slide view and is not offered the menu",
       seen.get("on") is True and seen.get("office") is False and seen.get("menu") is False, seen)

    ck("no page error", not errs, errs[:3])
    b.close()

print("\n" + ("slide-columns: all passed" if not bad else "%d FAILED" % bad))
raise SystemExit(1 if bad else 0)
