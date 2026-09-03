"""THE GLYPH AND THE RULE SAY WHAT THEY MEAN (§149).

Islam kept the ≥ / ≤ glyphs and asked for better words behind them than the
audit's first draft ("at least / at most", which only restates the glyph):
*"some descriptive like Less is better or more is better"* — and the same for
COMPILED: *"take last measure, accumulative across the time, average across
the time"*.

WHAT THIS ASSERTS — the problem, not the wording (§94.8), so a later change to
the phrasing stays green and a build that lost the notes does not:
  1. Every direction glyph rendered in a read-mode table carries a note, and
     the two directions carry DIFFERENT notes (§113.8: a check that asserts
     agreement passes when both sides vanish — here the fault would be one
     note on both, so difference is the assertion).
  2. Every compile value carries a note, and the three rules differ.
  3. The note says which way is better rather than restating the glyph: it
     never contains "at least"/"at most", and it does name better/last/adds/
     averages.
  4. The repeated default ("Latest") is quieter than a non-default value in
     the same column — asserted as a COLOUR DIFFERENCE, never a hex, so the
     palette may move (§53.5).
  5. The edit path is untouched: behind the pen these cells are still real
     dropdowns, because a note is a reading aid and must not become an
     obstacle to authoring (§61).
  6. Nothing is clipped or wrapped by the added markup (§88's one-line rule).

Run: SMP_CHROME=... python3 qa-run.py checks/plan-columns.py
"""
import pathlib
from playwright.sync_api import sync_playwright

url = "file://" + str(pathlib.Path("strategy-management-platform.html").resolve())
bad = 0


def ck(w, ok, x=""):
    global bad
    if not ok:
        bad += 1
    print(("  ok      " if ok else "  FAIL    ") + w + (("  — " + str(x)) if not ok and x else ""))


with sync_playwright() as p:
    b = p.chromium.launch()
    pg = b.new_page(viewport={"width": 1440, "height": 900})
    errs = []
    pg.on("pageerror", lambda e: errs.append(str(e)))
    pg.goto(url)
    pg.wait_for_timeout(800)
    who = pg.eval_on_selector_all("#asWho option", "els=>els.map(e=>e.value)")
    pg.select_option("#asWho", who[0])
    pg.wait_for_timeout(300)
    pg.query_selector('#units [data-u="mobile"]').click()
    pg.wait_for_timeout(400)

    # ── the direction column
    dirs = pg.evaluate("""() => {
      var out = [];
      document.querySelectorAll('#panel td').forEach(function(td){
        var t = td.textContent.trim();
        if (t !== '\\u2265' && t !== '\\u2264') return;
        /* §163 MOVED THESE OFF THE BROWSER'S OWN TOOLTIP and onto the
           platform's bubble, because a native `title` waits a second, hangs
           off an 11px target and does not exist on a tablet at all. This
           check went on reading `[title]` and so reported a working build as
           having lost its explanations — §51.11, in a check nobody had
           re-read since the control changed shape. `data-tip` is what the
           bubble is filled from; `title` is accepted as well, so a cell that
           still carries one is not called broken. */
        var s = td.querySelector('[data-tip], [title]');
        out.push({glyph: t, note: s ? (s.getAttribute('data-tip') ||
                                       s.getAttribute('title')) : null});
      });
      return out;
    }""")
    ck("direction glyphs are on the page", len(dirs) > 0, len(dirs))
    ck("every direction glyph carries a note", all(d["note"] for d in dirs),
       [d for d in dirs if not d["note"]][:2])
    notes = {d["glyph"]: d["note"] for d in dirs if d["note"]}
    ck("both directions appear", len(notes) == 2, notes)
    ck("the two directions say DIFFERENT things", len(set(notes.values())) == len(notes), notes)
    joined = " ".join(notes.values()).lower()
    ck("the note says which way is better", "better" in joined, notes)
    ck("it does not merely restate the glyph",
       "at least" not in joined and "at most" not in joined, notes)

    # ── the compile column
    comps = pg.evaluate("""() => {
      var out = [];
      document.querySelectorAll('#panel td').forEach(function(td){
        var t = td.textContent.trim();
        if (['Latest','Sum','Average'].indexOf(t) < 0) return;
        var s = td.querySelector('[data-tip], [title]');
        var el = td.querySelector('span') || td;
        out.push({val: t, note: s ? (s.getAttribute('data-tip') ||
                                     s.getAttribute('title')) : null,
                  colour: getComputedStyle(el).color,
                  quiet: !!td.querySelector('.cdefault')});
      });
      return out;
    }""")
    ck("compile values are on the page", len(comps) > 0, len(comps))
    ck("every compile value carries a note", all(c["note"] for c in comps),
       [c for c in comps if not c["note"]][:2])
    cnotes = {c["val"]: c["note"] for c in comps if c["note"]}
    ck("the compile notes differ from each other",
       len(set(cnotes.values())) == len(cnotes), cnotes)
    cj = " ".join(cnotes.values()).lower()
    ck("the notes describe the rule", "last" in cj or "adds" in cj or "average" in cj, cnotes)

    # ── the repeated default is quieter, and it is still there
    ck("the default is marked quiet", any(c["quiet"] for c in comps if c["val"] == "Latest"),
       [c for c in comps if c["val"] == "Latest"][:1])
    quiet = [c["colour"] for c in comps if c["val"] == "Latest"]
    loud = [c["colour"] for c in comps if c["val"] != "Latest"]
    if quiet and loud:
        ck("quiet and non-default read in different colours", quiet[0] != loud[0],
           (quiet[0], loud[0]))
    else:
        print("  note    only one kind of compile value on this page — colour pair not compared")
    ck("the default value is still readable, not removed",
       all(c["val"] for c in comps))

    # ── nothing wraps or clips (§88)
    lines = pg.evaluate("""() => {
      var bad = [];
      document.querySelectorAll('#panel td .hasnote, #panel td .cdefault').forEach(function(s){
        var r = document.createRange(); r.selectNodeContents(s);
        var tops = new Set([...r.getClientRects()].filter(x=>x.width>0).map(x=>Math.round(x.top)));
        if (tops.size > 1) bad.push(s.textContent.trim());
        if (s.scrollWidth > s.clientWidth + 1) bad.push('clipped: ' + s.textContent.trim());
      });
      return bad;
    }""")
    ck("no note wraps or is clipped", not lines, lines[:3])

    # ── the pen still edits these cells
    # §268: the strategy pen is on the section line, outside #panel.
    pen = pg.query_selector("#secrow-in .secpen, #panel [data-edit], #panel .penbtn")
    if pen:
        pen.click()
        pg.wait_for_timeout(500)
        sels = pg.evaluate("""() => {
          var n = 0;
          document.querySelectorAll('#panel select').forEach(function(s){
            var v = [...s.options].map(o=>o.value);
            if (v.indexOf('\\u2265') >= 0 || v.indexOf('Latest') >= 0) n++;
          });
          return n;
        }""")
        ck("behind the pen both columns are still dropdowns", sels >= 2, sels)
    else:
        ck("a pen was found to test the edit path", False, "no pen on this page")

    ck("no page errors while driving", not errs, errs[:2])
    b.close()

print("plan-columns: %s" % ("OK" if bad == 0 else "%d FAILURES" % bad))
raise SystemExit(1 if bad else 0)
