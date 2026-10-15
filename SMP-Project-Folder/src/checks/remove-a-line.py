"""REMOVING A LINE: the question under it (§534.4).

The last nine browser dialogs in the product asked ONE sentence — "Remove X?
This cannot be undone here." — across six screens: a key objective, a theme,
a capability's objective, a clause of Who we are, a SWOT line, a value on How
we compete, and the revenue tree's route, period and driver. A box over a list
of nine never says which line of it is going, which is the whole of what §186
asks a confirmation to do.

Islam picked B of two drawn (design-mockups/remove-a-line/, 2026-10-14): the
line STAYS where it is and readable, and the question opens under it.

What is asserted, and why each end matters (§94.2):

  - NO BROWSER DIALOG IS LEFT, asserted over the whole built file rather than
    the screens this file can reach. Nine controls across six screens is more
    navigation than one check should own, and a behavioural check of three of
    them would pass on a build that left the other six — §272.7's fault, which
    is exactly how this family came to be nine copies of one sentence;
  - the strip opens UNDER the line and the line is still there to read, which
    is the whole of why B was picked over A;
  - the line is MARKED, because the sentence says "this line" and the browser
    could not point;
  - KEEP removes nothing — the fault §534.1 found in the one place Cancel was
    an answer, asserted here so it cannot come back;
  - REMOVE takes exactly that line and leaves its neighbours, read back from
    the DATA (§96);
  - ONE QUESTION AT A TIME: pressing another × moves it rather than leaving
    two open over one list;
  - an EMPTY line still goes on the first press with no question, which is
    what the browser's box did and the easiest thing to lose in a rewrite;
  - and the three that take more than the line still SAY so.

SMP_BUILT points it at another build, so it can be run against the build
before (§276: a broken build is made from the SOURCES).
"""
import os, re
from playwright.sync_api import sync_playwright

BUILT = os.environ.get("SMP_BUILT") or os.path.join(
    os.path.dirname(__file__), "..", "strategy-management-platform.html")
URL = "file://" + os.path.abspath(BUILT)

bad = 0
def ck(w, ok, x=""):
    global bad
    if not ok: bad += 1
    print(("  ok      " if ok else "  FAIL    ") + w + (("  — %s" % (x,)) if not ok and x != "" else ""))

def ev(pg, js, arg=None, dflt=None):
    try:
        return pg.evaluate(js, arg) if arg is not None else pg.evaluate(js)
    except Exception as e:
        return dflt if dflt is not None else {"err": str(e)[:90]}

print("\n§1 · no browser dialog is left in the whole build")
# THE ONE A CHECK CAN MAKE TOTAL. Reading the source is the only way to answer
# for all nine without walking six screens, and walking three of them would
# pass on a build that left the other six.
src = open(os.path.abspath(BUILT), encoding="utf-8").read()
# CALLS, NOT THE WORD, and the comments have to go before the count. These
# sources are thick with prose ABOUT confirm() and prompt() -- the §95 rulings,
# the §69.22 note, and now §534's own reasoning -- written both in backticks
# and bare, so no regex over the raw text can tell "it was a confirm()" from
# "it is a confirm()". The comments are stripped first and the scan runs on
# what is left, which is the code.
code = re.sub(r"/\*.*?\*/", " ", src, flags=re.S)
code = re.sub(r"(?m)^\s*//.*$", " ", code)
# NO SPACE BEFORE THE PAREN. Allowing one matched the Copilot's own button
# copy -- "Download the research prompt (.txt)" -- which is a sentence with a
# bracket in it, not a call. Nothing in this codebase writes `confirm (x)`,
# and a check that reports a label as a browser dialog is one somebody learns
# to ignore.
calls = re.findall(r"(?<![A-Za-z.`'\"])(confirm|prompt|alert)\(", code)
# NONE LEFT, ANYWHERE. This file first allowed one: sync.js's "Discard
# everything changed since the last successful save", which was outside this
# family and had not been drawn. §534.5 converted it, so the number is zero and
# the check says zero — an allowance kept after the thing it allowed is gone
# is a hole somebody's next browser dialog slips through.
ck("no browser dialog is left anywhere in the product",
   len(calls) == 0, calls[:6])

with sync_playwright() as p:
    b = p.chromium.launch(executable_path="/opt/pw-browsers/chromium",
                          args=["--no-sandbox", "--disable-dev-shm-usage"])
    pg = b.new_page(viewport={"width": 1500, "height": 2200})
    errs, natives = [], []
    pg.on("pageerror", lambda e: errs.append(str(e)))
    pg.on("console", lambda m: errs.append(m.text) if m.type == "error" else None)
    pg.on("dialog", lambda d: (natives.append(d.message), d.dismiss()))
    pg.goto(URL); pg.wait_for_timeout(1500)
    pg.select_option("#asWho", "smo"); pg.wait_for_timeout(300)

    print("\n§2 · the SWOT: the line stays, and the question opens under it")
    fx = ev(pg, """() => {
      const u = UNIT_KEYS[0];
      const w = swotWritable(u);
      w.s = ["Two-day letter of credit turnaround",
             "Relationships with the four largest importers",
             "Correspondent network across the Gulf"];
      EDIT_PAGE['analysis'] = true;
      current = u; currentSub = 'strategy'; CURSEC.strategy = 'swot';
      RMASK = null; paint();
      return { lines: swotWritable(u).s.slice(), ukey: u };
    }""")
    pg.wait_for_timeout(350)
    xs = ev(pg, "() => document.querySelectorAll('[data-swrm]').length", None, 0)
    ck("(fixture) three lines, with the pen open", len(fx.get("lines", [])) == 3, fx)
    ck("every line carries a ×", xs >= 3, xs)
    # the SECOND line, so "it took the right one" can fail both ways
    ev(pg, """(u) => { document.querySelector('[data-swrm="' + u + '|s|1"]').click(); }""",
       fx.get("ukey"))
    pg.wait_for_timeout(300)
    st = ev(pg, """(u) => {
      const li = document.querySelector('[data-swrm="' + u + '|s|1"]').closest('li');
      const strip = li ? li.querySelector('.rmask') : null;
      const fld = li ? li.querySelector('input, textarea') : null;
      return { strip: !!strip, say: strip ? strip.innerText.replace(/\\s+/g,' ').trim() : "",
               lineStillThere: !!fld, lineReads: fld ? fld.value : null,
               marked: !!(li && li.className.indexOf('rmasking') > -1),
               keep: !!(strip && strip.querySelector('[data-rmkeep]')),
               go: !!(strip && strip.querySelector('[data-rmnow]')),
               strips: document.querySelectorAll('.rmask').length };
    }""", fx.get("ukey"), {})
    ck("no browser dialog is raised", not natives, natives)
    ck("a strip opens, in that line's own place", st.get("strip"), st)
    ck("...THE LINE IS STILL THERE AND STILL READS", st.get("lineStillThere")
       and st.get("lineReads") == fx["lines"][1], st)
    ck("...the line is marked as the one being asked about", st.get("marked"), st)
    ck("...the strip offers Keep and Remove", st.get("keep") and st.get("go"), st)
    ck("...and says what it cannot do",
       "cannot be undone here" in st.get("say", ""), st.get("say"))
    ck("...only one question is open", st.get("strips") == 1, st)

    print("\n§3 · Keep removes nothing")
    pg.eval_on_selector("[data-rmkeep]", "e => e.click()"); pg.wait_for_timeout(250)
    after = ev(pg, "(u) => ({ lines: swotWritable(u).s.slice(), strips: document.querySelectorAll('.rmask').length })",
               fx.get("ukey"), {})
    ck("the question closes", after.get("strips") == 0, after)
    ck("...and the three lines are untouched", after.get("lines") == fx["lines"], after)

    print("\n§4 · pressing another × moves the question rather than opening a second")
    ev(pg, """(u) => { document.querySelector('[data-swrm="' + u + '|s|0"]').click(); }""", fx.get("ukey"))
    pg.wait_for_timeout(250)
    ev(pg, """(u) => { document.querySelector('[data-swrm="' + u + '|s|2"]').click(); }""", fx.get("ukey"))
    pg.wait_for_timeout(250)
    two = ev(pg, """(u) => {
      const li = document.querySelector('[data-swrm="' + u + '|s|2"]').closest('li');
      return { strips: document.querySelectorAll('.rmask').length,
               onLast: !!(li && li.querySelector('.rmask')) }; }""", fx.get("ukey"), {})
    ck("still one question", two.get("strips") == 1, two)
    ck("...and it is on the line last pressed", two.get("onLast"), two)

    print("\n§5 · Remove takes exactly that line")
    pg.eval_on_selector(".rmask [data-rmnow]", "e => e.click()"); pg.wait_for_timeout(300)
    gone = ev(pg, "(u) => ({ lines: swotWritable(u).s.slice(), strips: document.querySelectorAll('.rmask').length })",
              fx.get("ukey"), {})
    ck("no browser dialog anywhere in that", not natives, natives)
    ck("the third line is gone", gone.get("lines") == fx["lines"][:2], gone)
    ck("...its neighbours are not", len(gone.get("lines", [])) == 2, gone)
    ck("...and the question closed with it", gone.get("strips") == 0, gone)

    print("\n§6 · an empty line still goes on the first press")
    ev(pg, """(u) => { swotWritable(u).s.push(""); RMASK = null; paint(); }""", fx.get("ukey"))
    pg.wait_for_timeout(300)
    before_n = ev(pg, "(u) => swotWritable(u).s.length", fx.get("ukey"), 0)
    ev(pg, """(u) => { const b = document.querySelector('[data-swrm="' + u + '|s|' +
         (swotWritable(u).s.length - 1) + '"]'); if (b) b.click(); }""", fx.get("ukey"))
    pg.wait_for_timeout(300)
    emp = ev(pg, "(u) => ({ n: swotWritable(u).s.length, strips: document.querySelectorAll('.rmask').length })",
             fx.get("ukey"), {})
    ck("no question is asked for a line holding nothing", emp.get("strips") == 0, emp)
    ck("...and it is gone", emp.get("n") == before_n - 1, (before_n, emp))

    print("\n§7 · in a table the strip is a row, and the Temple is one")
    natives.clear()
    fx2 = ev(pg, """() => {
      EDIT_PAGE['temple'] = true;
      current = 'group'; currentSub = 'temple'; RMASK = null;
      /* A key objective only asks when it carries something (the handler's own
         rule), so the fixture gives the first one a target to lose. */
      if (GROUP.keyObjectives[0]) GROUP.keyObjectives[0].target = GROUP.keyObjectives[0].target || "100";
      paint();
      return { n: GROUP.keyObjectives.length,
               first: GROUP.keyObjectives[0] ? GROUP.keyObjectives[0].name : null };
    }""")
    pg.wait_for_timeout(350)
    hit = ev(pg, """() => { const b = document.querySelector('[data-trm="ko|0"]');
      if (!b) return false; b.click(); return true; }""", None, False)
    pg.wait_for_timeout(300)
    row = ev(pg, """() => {
      const r = document.querySelector('tr.rmaskrow');
      const td = r ? r.querySelector('td') : null;
      return { there: !!r, cols: td ? +td.getAttribute('colspan') : 0,
               say: r ? r.innerText.replace(/\\s+/g,' ').trim() : "",
               afterMarked: !!document.querySelector('tr.rmasking') }; }""", None, {})
    ck("(fixture) the Temple draws its key objectives", fx2.get("n", 0) > 0, fx2)
    ck("the row's Remove is reachable", hit)
    ck("no browser dialog is raised", not natives, natives)
    ck("the strip is a row of its own", row.get("there"), row)
    ck("...spanning the table", row.get("cols") == 8, row)
    ck("...naming the objective it would take",
       (fx2.get("first") or "") in row.get("say", ""), (fx2.get("first"), row.get("say")))
    ck("...and the row above it is marked", row.get("afterMarked"), row)
    n_before = ev(pg, "() => GROUP.keyObjectives.length", None, 0)
    pg.eval_on_selector("tr.rmaskrow [data-rmkeep]", "e => e.click()"); pg.wait_for_timeout(250)
    ck("Keep removes nothing here either",
       ev(pg, "() => GROUP.keyObjectives.length", None, -1) == n_before)

    print("\n§8 · and the three that take more than the line still say so")
    natives.clear()
    drv = ev(pg, """() => {
      const u = UNIT_KEYS[0];
      const ch = { subs: [{ name: "Walk-in", periods: [
        { name: "Summer", drivers: [{ id: "d1", name: "Footfall" },
                                    { id: "d2", name: "Basket" },
                                    { id: "d3", name: "Conversion" }] } ] }] };
      UNITS[u].drivers = ch; UNITS[u].driverChannel = ch;
      if (typeof setDriversOn === 'function') setDriversOn(true);
      EDIT_PAGE['plan'] = true;   /* the tree rides the plan's pen (§42) */
      current = u; currentSub = 'strategy'; CURSEC.strategy = 'drivers';
      RMASK = null; paint();
      return { has: !!document.querySelector('[data-drvprm]') };
    }""")
    pg.wait_for_timeout(350)
    if drv.get("has"):
        pg.eval_on_selector("[data-drvprm]", "e => e.click()"); pg.wait_for_timeout(300)
        say = ev(pg, """() => { const r = document.querySelector('.rmask');
          return r ? r.innerText.replace(/\\s+/g,' ').trim() : ""; }""", None, "")
        ck("no browser dialog is raised", not natives, natives)
        ck("the period's question names the period", "Summer" in say, say)
        ck("...and the drivers it takes with it", "3 drivers" in say, say)
    else:
        ck("(fixture) a period with drivers could be drawn", False, drv)

    print("\n§9 · the BU list, which used to ask nothing at all")
    # The drawing named these two as a difference to DECIDE rather than leave;
    # Islam: they should ask.
    #
    # THE TWO CONTROLS WANT OPPOSITE STATES, which the first draft of this
    # section did not know: the chip's × is drawn only while the row's pen is
    # OPEN, and the row's Remove only while it is SHUT. A fixture that set one
    # state measured one control and threw on the other.
    natives.clear()
    bu = ev(pg, """() => {
      GROUP.mainbus = [{ name:"Payments", at: UNIT_KEYS[0] }];
      current='setup'; currentSub='mainbu'; ROWEDIT = "mainbu:0"; RMASK = null; paint();
      return { drop: !!document.querySelector('[data-mbdrop]') };
    }""")
    pg.wait_for_timeout(350)
    ck("(fixture) a mapped BU with its row open", bu.get("drop"), bu)
    if bu.get("drop"):
        pg.eval_on_selector("[data-mbdrop]", "e => e.click()"); pg.wait_for_timeout(300)
        d1 = ev(pg, """() => { const r = document.querySelector('.rmask');
          return { there: !!r, say: r ? r.innerText.replace(/\\s+/g,' ').trim() : "",
                   mapped: !!GROUP.mainbus[0].at }; }""", None, {})
        ck("unmapping asks now", d1.get("there"), d1)
        ck("...naming the BU and where it points", "Payments" in d1.get("say", ""), d1.get("say"))
        ck("...and has unmapped nothing yet", d1.get("mapped") is True, d1)
        pg.eval_on_selector(".rmask [data-rmnow]", "e => e.click()"); pg.wait_for_timeout(300)
        ck("...pressing it through unmaps it",
           ev(pg, "() => !GROUP.mainbus[0].at", None, False))

    # The row's own Remove, with the pen shut. It asks while the row points at
    # something and lets a bare name go on one press -- the family's rule for
    # an empty line.
    shut = ev(pg, """() => {
      GROUP.mainbus = [{ name:"Payments", at: UNIT_KEYS[0] }];
      ROWEDIT = null; RMASK = null; paint();
      return !!document.querySelector('[data-mbdel]');
    }""", None, False)
    pg.wait_for_timeout(300)
    ck("(fixture) the row's Remove is drawn with the pen shut", shut)
    if shut:
        pg.eval_on_selector("[data-mbdel]", "e => e.click()"); pg.wait_for_timeout(300)
        d2 = ev(pg, """() => ({ row: !!document.querySelector('tr.rmaskrow'),
          say: (document.querySelector('tr.rmaskrow') || {}).innerText || "",
          n: (GROUP.mainbus || []).length })""", None, {})
        ck("removing a mapped BU asks", d2.get("row"), d2)
        ck("...naming what goes with it", "mapping" in d2.get("say", ""), d2.get("say"))
        ck("...and has removed nothing yet", d2.get("n") == 1, d2)
        pg.eval_on_selector("tr.rmaskrow [data-rmnow]", "e => e.click()"); pg.wait_for_timeout(300)
        ck("...pressing it through removes it",
           ev(pg, "() => (GROUP.mainbus || []).length", None, -1) == 0)
        ev(pg, """() => { GROUP.mainbus = [{ name:"Spare" }]; ROWEDIT = null; RMASK = null; paint(); }""")
        pg.wait_for_timeout(300)
        if ev(pg, "() => !!document.querySelector('[data-mbdel]')", None, False):
            pg.eval_on_selector("[data-mbdel]", "e => e.click()"); pg.wait_for_timeout(300)
            ck("a BU pointing at nothing still goes on one press",
               ev(pg, "() => (GROUP.mainbus || []).length", None, -1) == 0)
    ck("no browser dialog in any of that", not natives, natives)

    print("\n§10 · and the build is quiet")
    ck("no page errors", not errs, errs[:3])
    b.close()

print("\n%d failure(s)" % bad)
raise SystemExit(1 if bad else 0)
