"""The horizon arrives with the plan, and not before it (§321).

WHAT THIS ASSERTS, AND WHY EACH ONE IS HERE.

· PICKING A FILE CHANGES NOTHING. `planFromWorkbook` used to assign
  GROUP.horizon while READING, and it runs the moment a file is chosen — so
  opening a plan to look at it moved the year for the whole client, Discard
  did not put it back, and no screen said so. The first assertion is the
  reported fault, driven through the real file input rather than by calling
  the reader: a value written during a preview is invisible to any probe that
  only looks at the end state (§96).

· AND DISCARD LEAVES IT ALONE. That is the half that made it dangerous — the
  write survived a decision not to import.

· BOTH ENDS, EVERY TIME (§94.2). A file whose Horizon cell is EMPTY must
  leave the stored year exactly as it was — the rule the import always had —
  and one carrying a different year must move it on Apply. Asserting only the
  first passes on a build that ignores the column entirely; asserting only the
  second passes on a build that overwrites with blanks.

· THE PREVIEW SAYS IT BEFORE THE PRESS, and says it ONLY when it moves. There
  is one horizon for the whole client, so this is the one value in a unit's
  workbook that reaches outside that unit; a file carrying the year already
  stored is the normal round trip and must say nothing (§41's budget).

· AND THE ROUND TRIP IS STILL A FIXED POINT. The template is built with the
  stored horizon in it, so downloading and re-uploading untouched must leave
  the year where it was — asserted, because a fix that stopped reading the
  column at all would satisfy every "nothing moved" assertion above.

EVERY PROBE DEGRADES (§215): this file drives an upload, and a step that
throws must report rather than take the count down with it.

Run: SMP_CHROME=... python3 qa-run.py checks/plan-horizon.py
     SMP_BUILT=/path/to/other.html to point it at another build.
"""
import os, pathlib, tempfile
from playwright.sync_api import sync_playwright

BUILT = os.environ.get("SMP_BUILT") or str(pathlib.Path(
    pathlib.Path(__file__).resolve().parent.parent,
    "strategy-management-platform.html").resolve())
URL = "file://" + BUILT
TMP = tempfile.mkdtemp(prefix="smp-horizon-")

fails = []


def ck(name, ok, extra=""):
    print(("  ok   " if ok else "  FAIL ") + name + ((" — " + str(extra)) if extra else ""))
    if not ok:
        fails.append(name)


def js(pg, expr, *a):
    try:
        return pg.evaluate(expr, *a)
    except Exception as e:
        return {"__err": str(e)[:200]}


def upload_page(pg):
    """Setup › Import & storage › Upload, addressed by its own keys."""
    js(pg, "()=>{ current='setup'; currentSub='import'; "
           "if (typeof CURSEC === 'object') CURSEC['import'] = 'up'; paint(); }")
    pg.wait_for_timeout(320)


def make_file(pg, unit_key, horizon):
    """Build THIS unit's real plan workbook and doctor one cell.

    The platform's own builder, so the file is the file a person downloads —
    a hand-rolled workbook would be testing a fixture (§100.3). `horizon` is
    written into the Aspiration sheet's Horizon row: None leaves the row as
    the builder wrote it, "" empties it, a string sets it.
    """
    b64 = js(pg, """(a)=>{
      const u = UNITS[a.k];
      /* A WORKBOOK IS AN ARRAY OF SHEETS — [{name, widths, head, rows}] —
         not a map keyed by name; the first draft of this check guessed the
         second shape, doctored nothing, and reported a correct build broken
         four times (§100.3). Doctored by NAME, and the row is found by its
         own first cell rather than by position (§65: a position moves). */
      const wb = planWorkbook(u);
      let touched = 0;
      if (a.h !== null) {
        for (const sh of wb) {
          if (!sh || sh.name !== "Aspiration") continue;
          for (const row of (sh.rows || [])) {
            if (/horizon/i.test(String((row && row[0]) || ""))) { row[1] = a.h; touched++; }
          }
        }
        if (!touched) return null;          /* say so rather than ship a lie */
      }
      const bytes = buildXlsx(wb);
      const arr = bytes instanceof Uint8Array ? bytes : new Uint8Array(bytes);
      let s = ''; for (let i = 0; i < arr.length; i++) s += String.fromCharCode(arr[i]);
      return btoa(s);
    }""", {"k": unit_key, "h": horizon})
    if not isinstance(b64, str):
        return None
    import base64
    path = os.path.join(TMP, "plan-%s.xlsx" % (horizon or "blank"))
    open(path, "wb").write(base64.b64decode(b64))
    return path


def pick(pg, path):
    """Choose the file the way a person does, and let the preview render."""
    upload_page(pg)
    el = pg.query_selector("#imp-file-plan")
    if not el:
        return False
    el.set_input_files(path)
    pg.wait_for_timeout(700)
    return True


def horizon(pg):
    return js(pg, "()=>String(GROUP.horizon == null ? '' : GROUP.horizon)")


def preview_says(pg):
    return js(pg, "()=>{var n=document.querySelector('.note.attn-note');"
                  "return n ? n.textContent : '';}")


with sync_playwright() as p:
    b = p.chromium.launch()
    pg = b.new_page(viewport={"width": 1560, "height": 940})
    pg.on("pageerror", lambda e: fails.append("pageerror: " + str(e)))
    pg.add_init_script("try{sessionStorage.setItem('smp.welcome.done','1');"
                       "sessionStorage.setItem('smp.tour.later','1');}catch(e){}")
    pg.goto(URL)
    pg.wait_for_timeout(900)
    try:
        pg.select_option("#asWho", "smo")
        pg.wait_for_timeout(320)
    except Exception as e:
        print("  (could not switch viewer: %s)" % e)

    stored = horizon(pg)
    unit = js(pg, "()=>UNIT_KEYS[0]")
    print("\n§0 · the ground")
    ck("the demo has a horizon to move", bool(stored), stored)
    ck("and a unit to upload for", isinstance(unit, str) and bool(unit), unit)

    other = "2099" if stored != "2099" else "2088"

    # ── 1 · PICKING A FILE MUST CHANGE NOTHING (the reported fault) ──────
    print("\n§1 · picking the file")
    f_moves = make_file(pg, unit, other)
    ck("a plan workbook is built with a different horizon in it", bool(f_moves))
    if f_moves:
        ck("the file is picked", pick(pg, f_moves))
        ck("the preview was read", bool(js(pg, "()=>!!(IMP && IMP.summary)")),
           js(pg, "()=>IMP && IMP.read"))
        ck("and the stored horizon has NOT moved", horizon(pg) == stored,
           "stored " + str(stored) + ", now " + str(horizon(pg)))

        # ── 2 · AND IT SAYS SO, BEFORE THE PRESS ────────────────────────
        print("\n§2 · what the preview says")
        said = preview_says(pg)
        ck("the preview warns that this file moves the horizon",
           isinstance(said, str) and "horizon" in said.lower(), said[:120])
        ck("…and names the year it would move to",
           isinstance(said, str) and other in said, said[:120])

        # ── 3 · DISCARD LEAVES IT ALONE ─────────────────────────────────
        print("\n§3 · discarding")
        d = pg.query_selector("[data-cancel]")
        if d:
            d.click(); pg.wait_for_timeout(400)
        ck("Discard is there", bool(d))
        ck("and the horizon is still where it was", horizon(pg) == stored,
           "stored " + str(stored) + ", now " + str(horizon(pg)))

        # ── 4 · APPLY WRITES IT, AND NAMES IT ───────────────────────────
        print("\n§4 · applying")
        ck("the file is picked again", pick(pg, f_moves))
        a = pg.query_selector("[data-apply]")
        if a:
            a.click(); pg.wait_for_timeout(600)
        ck("Apply is there and not blocked", bool(a))
        ck("the horizon moved on Apply", horizon(pg) == other,
           "wanted " + other + ", got " + str(horizon(pg)))
        done = js(pg, "()=>IMP && IMP.done ? IMP.done.what : null")
        ck("and the outcome names it", isinstance(done, str) and "Horizon" in done, done)

    # ── 5 · A BLANK CELL LEAVES THE STORED YEAR (both ends, §94.2) ───────
    print("\n§5 · a file that says nothing")
    now = horizon(pg)
    f_blank = make_file(pg, unit, "")
    ck("a workbook is built with the Horizon cell empty", bool(f_blank))
    if f_blank:
        ck("it is picked", pick(pg, f_blank))
        ck("the preview says nothing about the horizon", preview_says(pg) == "",
           str(preview_says(pg))[:80])
        a = pg.query_selector("[data-apply]")
        if a:
            a.click(); pg.wait_for_timeout(600)
        ck("and applying it leaves the stored year alone", horizon(pg) == now,
           "was " + str(now) + ", now " + str(horizon(pg)))

    # ── 6 · THE UNTOUCHED ROUND TRIP IS STILL A FIXED POINT ─────────────
    print("\n§6 · download and upload, untouched")
    now = horizon(pg)
    f_same = make_file(pg, unit, None)
    ck("the platform's own file carries the stored horizon", bool(f_same))
    if f_same:
        ck("it is picked", pick(pg, f_same))
        ck("nothing is said — this is the normal round trip", preview_says(pg) == "",
           str(preview_says(pg))[:80])
        a = pg.query_selector("[data-apply]")
        if a:
            a.click(); pg.wait_for_timeout(600)
        ck("and the year is exactly where it was", horizon(pg) == now,
           "was " + str(now) + ", now " + str(horizon(pg)))

    b.close()

print("\n%d failures" % len(fails))
for f in fails:
    print("  - " + f)
