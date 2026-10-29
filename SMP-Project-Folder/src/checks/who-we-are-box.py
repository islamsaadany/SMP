"""WHO WE ARE IS TYPED IN ONE BOX (§679).

Islam, of the five lines of two boxes each: *"is there a more convenient way
for adding this part without filling 8 boxes"*; then, shown the one-box
drawing §613 had set aside: *"keep approach 2 in creation but shows like today
with each bold title on the left and allows the user to make bold the words
from the start of the line only"*; a working copy was put in front of him
(design-mockups/who-we-are-one-box/2026-10-29_one-box-openers-left.html) and
he said *"go ahead and build it everywhere"*.

What is asserted, and why each end matters (§94.2):

  - READING IS UNCHANGED: with the pen off the list is the same rows of
    opener and text it always was, and no box is drawn;
  - WITH THE PEN ON there is ONE box, a line per stored row with its opener
    already bold, and none of the old furniture — no small boxes, no
    "+ Add a line", no × — because a build that drew both would be two
    editors over one record (§53.5);
  - ENTER IS A NEW ROW and BOLD IS THE OPENER, read back from the DATA on
    blur (§96), and a unit's new line carries the next id (§96's renumber);
  - BOLD RUNS FROM THE START OF THE LINE whatever was selected — selecting a
    word in the middle bolds from the first word to it — because that is
    the one rule that keeps every line splittable into the two columns;
  - BOLD PRESSED INSIDE THE BOLD WORDS TAKES IT OFF, so a wrong opener is
    undone with the same key;
  - PASTE BRINGS WORDS ONLY, a row per pasted line, and nothing of the
    markup it came with;
  - A BLANK LINE IS NOT A ROW, and a line taken out is a row gone, the ids
    closed up;
  - AN UNCHANGED BLUR WRITES NOTHING — a contenteditable box fires no
    `change`, so the comparison is done by hand and asserted;
  - THE GROUP'S PAGE writes its own record through the same box, and a
    viewer the rule refuses is drawn the list, not the box.

Run: python3 qa-run.py checks/who-we-are-box.py     (SMP_BUILT points it at
another build; §276: a broken build is made from the SOURCES.)
"""
import os, json
from playwright.sync_api import sync_playwright

URL = "file://" + os.path.abspath(os.environ.get("SMP_BUILT") or
    os.path.join(os.path.dirname(__file__), "..", "strategy-management-platform.html"))
errs, bad = [], 0
def ck(w, ok, x=""):
    global bad
    if not ok: bad += 1
    print(("  ok      " if ok else "  FAIL    ") + w + (("  — %s" % (x,)) if not ok and x != "" else ""))

with sync_playwright() as p:
    b = p.chromium.launch(executable_path=os.environ.get("SMP_CHROME"),
                          args=["--no-sandbox", "--disable-dev-shm-usage"])
    pg = b.new_page(viewport={"width": 1400, "height": 1000})
    pg.add_init_script("try{sessionStorage.setItem('smp.welcome.seen','1')}catch(e){}")
    pg.on("pageerror", lambda e: errs.append(str(e)))
    pg.on("console", lambda m: errs.append(m.text) if m.type == "error" else None)
    pg.goto(URL); pg.wait_for_timeout(1000)

    def found(pen):
        pg.evaluate("(on) => { leaveModes(); current='mobile'; currentSub='strategy';"
                    " CURSEC.strategy='foundation'; EDIT_PAGE.foundation=on; paint(); }", pen)
        pg.wait_for_timeout(350)
    rows = lambda: pg.evaluate("() => UNITS.mobile.clauses.map(c => [c[0], c[1], c[2]])")
    def blur():
        pg.evaluate("() => { var x = document.querySelector('#panel .clausebox'); if (x) x.blur(); }")
        pg.wait_for_timeout(150)
    def box_lines():
        return pg.evaluate("() => [...document.querySelectorAll('#panel .clausebox > div')]"
                           ".map(d => [(d.firstChild && d.firstChild.nodeName === 'B') ? d.firstChild.textContent : '', d.textContent])")
    def caret_at(line, off):
        pg.evaluate("([i, o]) => { var d = document.querySelectorAll('#panel .clausebox > div')[i];"
                    " CLAUSEBOX.place(d, o); }", [line, off])

    print("\n§1 · reading is the list it always was")
    found(False)
    start = rows()
    dts = pg.evaluate("() => [...document.querySelectorAll('#panel .fgrid .card:first-child .clause dt')].map(d => d.textContent)")
    ck("one row per stored line, the opener down the left", dts == [r[0] for r in start], dts)
    ck("no box while reading", pg.evaluate("() => document.querySelectorAll('#panel .clausebox').length") == 0)

    print("\n§2 · with the pen on, one box and nothing of the old furniture")
    found(True)
    ck("one box", pg.evaluate("() => document.querySelectorAll('#panel .clausebox').length") == 1)
    ck("...a person can type in it", pg.evaluate("() => document.querySelector('#panel .clausebox').isContentEditable"))
    ck("...a line per row, the opener already bold", box_lines() == [[r[0], (r[0] + " " + r[1]).strip()] for r in start], box_lines())
    old = pg.evaluate("() => document.querySelectorAll('#panel .clause, [data-clauseadd], [data-clauserm], #panel .clausebox input, #panel .clausebox textarea').length")
    ck("no small boxes, no + Add a line, no ×", old == 0, old)
    ck("the B button stands above it", pg.evaluate("() => !!document.querySelector('#panel .clausebar .bbtn[data-clausebold]')"))

    print("\n§3 · Enter is a new row; bold is the opener; read back from the data on blur")
    pg.click("#panel .clausebox"); pg.keyboard.press("Control+End"); pg.keyboard.press("Enter")
    pg.keyboard.type("Backed by a team of two thousand")
    pg.keyboard.press("Home")
    for _ in range(9): pg.keyboard.press("Shift+ArrowRight")
    pg.keyboard.press("Control+b")
    ck("the B button lights while the caret is in the bold words",
       pg.evaluate("() => { var b = document.querySelector('#panel .bbtn'); return b.classList.contains('on') && b.getAttribute('aria-pressed') === 'true'; }"))
    ck("nothing is stored before the box is left", rows() == start)
    # the other way round, which is how a NEW unit is written (its openers
    # come ready, with nothing after them): the opener first, bold, then type
    pg.keyboard.press("End"); pg.keyboard.press("Enter"); pg.keyboard.type("Rooted")
    pg.keyboard.press("Shift+Home"); pg.keyboard.press("Control+b")
    pg.keyboard.type(" in Egypt")
    ck("typing on from a bold opener writes the text, not the opener", box_lines()[-1] == ["Rooted", "Rooted in Egypt"], box_lines()[-1])
    caret_at(0, 6); pg.keyboard.type(" truly")
    ck("...on a line that already has text too", box_lines()[0] == ["We are", "We are truly " + start[0][1]], box_lines()[0])
    caret_at(0, 2); pg.keyboard.type("X")
    ck("...while typing INSIDE the opener still extends it", box_lines()[0][0] == "WeX are", box_lines()[0])
    pg.keyboard.press("Backspace")
    blur()
    now = rows()
    ck("the new lines are rows, their bold words the openers", len(now) == len(start) + 2 and
       now[-2][:2] == ["Backed by", "a team of two thousand"] and now[-1][:2] == ["Rooted", "in Egypt"], now[-2:])
    ck("...carrying the next ids", [now[-2][2], now[-1][2]] == ["mobile-F%d" % (len(start) + 1), "mobile-F%d" % (len(start) + 2)], now[-2:])
    ck("...and the first line's text took the typed word", now[0][:2] == ["We are", "truly " + start[0][1]], now[0])
    # the two extra rows are not what the sections below count on
    pg.evaluate("() => { UNITS.mobile.clauses.pop(); UNITS.mobile.clauses[0][1] = UNITS.mobile.clauses[0][1].replace(/^truly /, ''); }")
    now = rows()
    found(False)
    dts = pg.evaluate("() => [...document.querySelectorAll('#panel .fgrid .card:first-child .clause dt')].map(d => d.textContent)")
    ck("...and reading shows it down the left", dts[-1] == "Backed by", dts)

    print("\n§4 · bold runs from the start of the line, whatever was selected")
    found(True)
    n = len(now) - 1
    caret_at(n, 0)
    pg.keyboard.press("End")
    for _ in range(12): pg.keyboard.press("Shift+ArrowLeft")      # "two thousand", mid-line
    pg.keyboard.press("Control+b")
    ck("...the opener grows to the end of the selection, from the first word",
       box_lines()[n][0] == "Backed by a team of two thousand" or box_lines()[n][0].startswith("Backed by a team"), box_lines()[n])
    blur(); mid = rows()[n]
    ck("...and that is what is stored", mid[0].startswith("Backed by a team"), mid)

    print("\n§5 · pressed inside the bold words, B takes the bold off")
    found(True)
    caret_at(n, 3)
    pg.click("#panel .bbtn")
    ck("the line is plain again in the box", box_lines()[n][0] == "", box_lines()[n])
    ck("...and the box kept the cursor", pg.evaluate("() => document.activeElement === document.querySelector('#panel .clausebox')"))
    blur(); plain = rows()[n]
    ck("...stored with no opener and all the words", plain[0] == "" and plain[1] == "Backed by a team of two thousand", plain)

    print("\n§6 · paste brings words only, a row per pasted line")
    found(True)
    caret_at(n, 0); pg.keyboard.press("End")
    pg.keyboard.press("Enter")
    pg.evaluate("""() => { var dt = new DataTransfer();
      dt.setData('text/plain', 'Serving\\nthree countries');
      dt.setData('text/html', '<p style="color:red"><i>Serving</i></p><p>three <u>countries</u></p>');
      document.querySelector('#panel .clausebox').dispatchEvent(new ClipboardEvent('paste', { clipboardData: dt, bubbles: true, cancelable: true })); }""")
    markup = pg.evaluate("() => document.querySelectorAll('#panel .clausebox i, #panel .clausebox u, #panel .clausebox p, #panel .clausebox [style]').length")
    ck("nothing of the markup it came with", markup == 0, markup)
    blur(); after = rows()
    ck("two rows, one per pasted line", [r[:2] for r in after[-2:]] == [["", "Serving"], ["", "three countries"]], after[-2:])

    print("\n§7 · a blank line is not a row; a line taken out is a row gone")
    found(True)
    pg.click("#panel .clausebox"); pg.keyboard.press("Control+End"); pg.keyboard.press("Enter"); pg.keyboard.press("Enter")
    blur()
    ck("two empty lines store nothing", rows() == after, rows()[-2:])
    found(True)
    # take out the "Serving" line: caret at its end, Shift+Home selects it, delete, then Backspace joins the empty line away
    caret_at(len(after) - 2, 0); pg.keyboard.press("End"); pg.keyboard.press("Shift+Home"); pg.keyboard.press("Delete"); pg.keyboard.press("Backspace")
    blur(); gone = rows()
    ck("the row is gone and its neighbours stay", len(gone) == len(after) - 1 and gone[-1][:2] == ["", "three countries"] and gone[-2][:2] == plain[:2], gone[-3:])
    ck("...and the ids are closed up", [r[2] for r in gone] == ["mobile-F%d" % (i + 1) for i in range(len(gone))], [r[2] for r in gone])

    print("\n§8 · an unchanged blur writes nothing")
    found(True)
    pg.evaluate("() => { window.__saves = 0; var o = fieldSaved; fieldSaved = function(){ window.__saves++; return o(); }; }")
    pg.click("#panel .clausebox"); blur()
    ck("in and out with nothing typed: no save", pg.evaluate("() => window.__saves") == 0, pg.evaluate("() => window.__saves"))
    pg.click("#panel .clausebox"); pg.keyboard.press("Control+End"); pg.keyboard.type(" and more"); blur()
    ck("...and one save when something was", pg.evaluate("() => window.__saves") == 1, pg.evaluate("() => window.__saves"))

    print("\n§9 · the group's own page, and a viewer the rule refuses")
    pg.evaluate("() => { leaveModes(); current='group'; currentSub='strategy'; CURSEC.strategy='foundation'; EDIT_PAGE.foundation=true; paint(); }")
    pg.wait_for_timeout(350)
    g0 = pg.evaluate("() => GROUP.clauses.map(c => [c[0], c[1]])")
    ck("the group draws the box with its own lines", box_lines() == [[r[0], (r[0] + " " + r[1]).strip()] for r in g0], box_lines()[:2])
    pg.click("#panel .clausebox"); pg.keyboard.press("Control+End"); pg.keyboard.press("Enter"); pg.keyboard.type("Rooted in Egypt")
    pg.keyboard.press("Home");
    for _ in range(9): pg.keyboard.press("Shift+ArrowRight")
    pg.keyboard.press("Control+b"); blur()
    g1 = pg.evaluate("() => GROUP.clauses.map(c => [c[0], c[1]])")
    ck("...and writes the group's record", g1 == g0 + [["Rooted in", "Egypt"]], g1[-1:])
    other = pg.evaluate("""() => { var s = document.querySelector('#asWho'); if (!s) return null;
      var o = [...s.options].find(x => x.value && x.value !== 'smo'); if (!o) return null;
      s.value = o.value; s.dispatchEvent(new Event('change', { bubbles: true })); return o.value; }""")
    pg.wait_for_timeout(500)
    pg.evaluate("() => { leaveModes(); current='mobile'; currentSub='strategy'; CURSEC.strategy='foundation'; EDIT_PAGE.foundation=true; paint(); }")
    pg.wait_for_timeout(350)
    may = pg.evaluate("() => !!mayAuthor(foundKeyFor('mobile'), 'mobile')")
    boxes = pg.evaluate("() => document.querySelectorAll('#panel .clausebox').length")
    ck("as %s (may author: %s) the box is drawn exactly when the rule allows" % (other, may), bool(other) and boxes == (1 if may else 0), boxes)
    if not may:
        ck("...and the list is what they read", pg.evaluate("() => document.querySelectorAll('#panel .fgrid .card:first-child .clause').length") == len(gone))

    ck("no console errors anywhere in the run", not errs, errs)
    b.close()

print(("\n%d FAILED" % bad) if bad else "\nall ok")
raise SystemExit(1 if bad else 0)
