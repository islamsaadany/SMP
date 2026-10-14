"""DELETING FOR GOOD: what goes, what stays, and no way back (§533).

Three acts in the product take something away with nothing behind them: a
clip's bytes, every clip outside the open review, and a filed archive.
Everything else that reads like a deletion archives first — an imported plan,
a pillar, a project, a retired person — so these three are the whole of the
exception, and until now all three asked in the BROWSER's box. The mockup
(design-mockups/delete-for-good/) was signed off 2026-10-14.

What is asserted, and why each end matters (§94.2):

  - the browser's dialog is GONE and the platform's own is drawn, with the
    ledger in it — a check that only looked for the new dialog would pass on
    a build that raised both;
  - the one-clip question still NAMES the file, its size and its review, which
    is the one thing the old box did well and the easiest thing to lose in a
    rewrite (§186);
  - WHAT STAYS is said out loud, because that is the half the box was worst
    at and the half somebody hesitates over;
  - Cancel destroys nothing, read back from the STORE rather than the screen;
  - the bulk question NAMES ITS TWELVE. This is the half that did not exist
    before: it asked with a count, and a count catches none of the mistakes a
    confirmation exists for. The clip in the open review is not in that list
    and is named as staying;
  - the archive's question agrees WORD FOR WORD with its row about what the
    archive holds (§53.5 — `archiveHeld()` is one builder, and two copies of
    it is how the table and the question come to disagree about what is about
    to be lost);
  - and the row's control says FORGET, the same word as the question it
    opens.

SMP_BUILT points it at another build, so it can be run against the build
before (§276: a broken build is made from the SOURCES).
"""
import os
from playwright.sync_api import sync_playwright

BUILT = os.environ.get("SMP_BUILT") or os.path.join(
    os.path.dirname(__file__), "..", "strategy-management-platform.html")
URL = "file://" + os.path.abspath(BUILT)

bad = 0
def ck(w, ok, x=""):
    global bad
    if not ok: bad += 1
    print(("  ok      " if ok else "  FAIL    ") + w + (("  — %s" % (x,)) if not ok and x != "" else ""))

def ev(pg, js, dflt=None):
    """Every probe degrades (§215): a build without the feature must REPORT,
       never die partway and leave later sections unmade."""
    try: return pg.evaluate(js)
    except Exception as e: return dflt if dflt is not None else {"err": str(e)[:90]}

# ── THE CHECK MAKES ITS OWN STORE (§255, §333) ────────────────────────────
# Opened from a file there is no server to ask, so renderVideoStore() draws a
# note and nothing else — correctly (§32). The store, the drop and the archive
# are stubbed here so the page has something to destroy; the PRODUCT still
# decides what to draw over them and what the buttons do, which is the line
# between a fixture and a lie (§100.3).
FIXTURE = """() => {
  const u = UNIT_KEYS[0], v = UNIT_KEYS[1] || UNIT_KEYS[0];
  window.__dropped = [];
  SYNC.isLive = () => true;
  SYNC.videoDrop = (paths, cb) => { window.__dropped.push.apply(window.__dropped, paths); cb(null); };
  /* One clip on a slide in the OPEN review, so the bulk question has
     something it must leave alone and say so. */
  REVIEW.slides = REVIEW.slides || {};
  REVIEW.slides[u] = [{ title: "Site visit", vid: { path: "videos/" + u + "/open.mp4", name: "open-review.mp4" } }];
  VIDSTORE = { ready: true, clips: [
    { path: "videos/" + u + "/open.mp4",  bytes: 12000000, at: "2026-06-02T09:00:00Z" },
    { path: "videos/" + u + "/march.mp4", bytes: 48200000, at: "2026-03-11T09:00:00Z" },
    { path: "videos/" + v + "/ceo.mov",   bytes: 124000000, at: "2026-02-04T09:00:00Z" },
    { path: "videos/" + v + "/demo.mp4",  bytes: 61800000, at: "2026-01-20T09:00:00Z" } ] };
  ARCHIVES.unshift({ id: "arcfix", name: "H2 2025", at: "2026-01-04",
    by: "Islam Saadany", why: "cleared when H1 2026 opened", kind: "figures",
    counts: { reported: 184, notes: 37, units: 12 } });
  paint();
  return { unit: u, other: v, archives: ARCHIVES.length };
}"""

def pane(pg, sec):
    pg.evaluate("(s) => { current='setup'; currentSub='import'; CURSEC.import=s; paint(); }", sec)
    pg.wait_for_timeout(250)

def dlg(pg):
    """The dialog as the page has it: its words, and whether it wears the
       shape this conversion is for."""
    return ev(pg, """() => {
      const m = document.querySelector('.overlay.on');
      if (!m) return { open: false };
      const b = document.getElementById('modal-b');
      return { open: true,
        title: (document.getElementById('modal-t') || {}).textContent || '',
        sub:   (document.getElementById('modal-s') || {}).textContent || '',
        text:  b ? b.innerText : '',
        ledger: !!(b && b.querySelector('.ledger')),
        goes:  !!(b && b.querySelector('.ledger .goes')),
        stays: !!(b && b.querySelector('.ledger .stays')),
        noway: !!(b && b.querySelector('.noway')),
        yes:   b && b.querySelector('[data-dstyes]') ? b.querySelector('[data-dstyes]').textContent : null,
        files: b ? Array.from(b.querySelectorAll('.scroll tbody tr td:first-child')).map(t => t.innerText.trim()) : [] };
    }""", {"open": False})

with sync_playwright() as p:
    b = p.chromium.launch(executable_path="/opt/pw-browsers/chromium",
                          args=["--no-sandbox", "--disable-dev-shm-usage"])
    pg = b.new_page(viewport={"width": 1500, "height": 2200})
    errs, natives = [], []
    pg.on("pageerror", lambda e: errs.append(str(e)))
    pg.on("console", lambda m: errs.append(m.text) if m.type == "error" else None)
    # A NATIVE confirm() is auto-dismissed and RECORDED — the old build raised
    # one at every site below, and "no browser dialog" is half of this file.
    pg.on("dialog", lambda d: (natives.append(d.message), d.dismiss()))
    pg.goto(URL); pg.wait_for_timeout(1500)
    pg.select_option("#asWho", "smo"); pg.wait_for_timeout(300)
    made = ev(pg, FIXTURE)

    print("\n§1 · one clip: the platform's own dialog, and it names the file")
    ck("the store is stubbed and the page has clips to lose",
       isinstance(made, dict) and made.get("archives", 0) > 0, made)
    pane(pg, "vids")
    rows = ev(pg, "() => document.querySelectorAll('[data-viddel]').length", 0)
    ck("Video storage draws a Delete per closed clip (3 of the 4)", rows == 3, rows)
    if rows:
        pg.eval_on_selector("[data-viddel]", "e => e.click()"); pg.wait_for_timeout(250)
    d = dlg(pg)
    ck("no browser dialog is raised", not natives, natives)
    ck("the platform's own dialog opens", d.get("open"), d)
    ck("...wearing the ledger", d.get("ledger") and d.get("goes") and d.get("stays"), d)
    ck("...and saying there is no way back", d.get("noway"), d)
    ck("the file is named (§186)", "march.mp4" in d.get("text", ""), d.get("text", "")[:160])
    ck("...with its size", "MB" in d.get("text", "") or "GB" in d.get("text", ""), d.get("text", "")[:160])
    ck("...and the date the table carries beside the button",
       "2026-03-11" in d.get("text", ""), d.get("text", "")[:200])
    ck("WHAT STAYS is said: the slide, in its place",
       "slide" in d.get("text", "").lower(), d.get("text", "")[:240])
    ck("the button names the act, not Okay", d.get("yes") == "Delete the clip", d.get("yes"))

    print("\n§2 · Cancel destroys nothing, read back from the store")
    pg.eval_on_selector("[data-dstno]", "e => e.click()"); pg.wait_for_timeout(200)
    st = ev(pg, "() => ({ dropped: window.__dropped.slice(), clips: VIDSTORE.clips.length, open: !!document.querySelector('.overlay.on') })")
    ck("the dialog closes", not st.get("open"), st)
    ck("...and nothing was dropped", st.get("dropped") == [], st)
    ck("...the store still holds its four", st.get("clips") == 4, st)

    print("\n§3 · pressing it through destroys exactly that one")
    pg.eval_on_selector("[data-viddel]", "e => e.click()"); pg.wait_for_timeout(250)
    pg.eval_on_selector("[data-dstyes]", "e => e.click()"); pg.wait_for_timeout(300)
    st = ev(pg, "() => ({ dropped: window.__dropped.slice(), paths: VIDSTORE.clips.map(c => c.path) })")
    ck("one path dropped", len(st.get("dropped", [])) == 1, st)
    ck("...and it is the clip that was named",
       st.get("dropped", [""])[0].endswith("march.mp4"), st)
    ck("...the clip on the open review untouched",
       any(x.endswith("open.mp4") for x in st.get("paths", [])), st)

    print("\n§4 · the bulk question NAMES ITS TWELVE")
    natives.clear()
    bulk = ev(pg, "() => !!document.querySelector('[data-viddelold]')", False)
    ck("the bulk control is drawn while closed clips remain", bulk)
    if bulk:
        pg.eval_on_selector("[data-viddelold]", "e => e.click()"); pg.wait_for_timeout(250)
    d = dlg(pg)
    ck("no browser dialog is raised", not natives, natives)
    ck("the platform's own dialog opens", d.get("open"), d)
    ck("every clip it would delete is NAMED, not counted",
       sorted(d.get("files", [])) == sorted(["ceo.mov", "demo.mp4"]), d.get("files"))
    ck("...the clip in the open review is not among them",
       not any("open-review" in f or f == "open.mp4" for f in d.get("files", [])), d.get("files"))
    ck("...and is named as staying", "open" in d.get("text", "").lower(), d.get("text", "")[:260])
    ck("the space freed is said", "MB" in d.get("text", "") or "GB" in d.get("text", ""), d.get("text", "")[:160])
    ck("the button carries the count", (d.get("yes") or "").startswith("Delete 2 clip"), d.get("yes"))
    pg.eval_on_selector("[data-dstyes]", "e => e.click()"); pg.wait_for_timeout(300)
    st = ev(pg, "() => ({ dropped: window.__dropped.slice(), paths: VIDSTORE.clips.map(c => c.path) })")
    ck("...and pressing it drops exactly those two", len(st.get("dropped", [])) == 3, st)
    ck("...leaving the open review's clip alone",
       st.get("paths") == [x for x in st.get("paths", []) if x.endswith("open.mp4")], st)

    print("\n§5 · forgetting an archive, in the row's own words")
    natives.clear()
    pane(pg, "arch")
    row = ev(pg, """() => {
      const b = document.querySelector('[data-forget]');
      if (!b) return { there: false };
      const tr = b.closest('tr');
      return { there: true, word: b.textContent.trim(),
               held: tr ? (tr.querySelectorAll('td')[3] || {}).innerText || '' : '' };
    }""", {"there": False})
    ck("Archived plans draws the control", row.get("there"), row)
    ck("...and it says Forget, the word of the question it opens", row.get("word") == "Forget", row)
    if row.get("there"):
        pg.eval_on_selector("[data-forget]", "e => e.click()"); pg.wait_for_timeout(250)
    d = dlg(pg)
    ck("no browser dialog is raised", not natives, natives)
    ck("the platform's own dialog opens", d.get("open"), d)
    ck("...and names what the archive holds", "184 reported figures" in d.get("text", ""),
       d.get("text", "")[:240])
    # §53.5 FROM THE OTHER SIDE: not merely that the dialog says something, but
    # that it says the SAME thing the row does. One builder or two is the whole
    # question, and this is the assertion that can tell.
    ck("...in the same words as the row it was pressed on (§53.5)",
       all(bit.strip() in d.get("text", "")
           for bit in (row.get("held", "").split("\n")[0]).split("·") if bit.strip()),
       (row.get("held", "")[:120], d.get("text", "")[:200]))
    ck("...says who filed it and why", "Islam Saadany" in d.get("text", "")
       and "cleared when" in d.get("text", ""), d.get("text", "")[:260])
    ck("...and that Restore goes with it", "Restore" in d.get("text", ""), d.get("text", "")[:260])
    ck("the button names the act", d.get("yes") == "Forget this archive", d.get("yes"))
    pg.eval_on_selector("[data-dstno]", "e => e.click()"); pg.wait_for_timeout(200)
    ck("Cancel keeps it", ev(pg, "() => ARCHIVES.filter(a => a.id === 'arcfix').length", 0) == 1)
    pg.eval_on_selector("[data-forget]", "e => e.click()"); pg.wait_for_timeout(250)
    pg.eval_on_selector("[data-dstyes]", "e => e.click()"); pg.wait_for_timeout(300)
    ck("...and Forget removes it", ev(pg, "() => ARCHIVES.filter(a => a.id === 'arcfix').length", 1) == 0)

    print("\n§6 · and the build is quiet")
    ck("no page errors", not errs, errs[:3])
    b.close()

print("\n%d failure(s)" % bad)
raise SystemExit(1 if bad else 0)
