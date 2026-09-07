"""THE PLAN TABLE AT A NARROWER WINDOW (§267).

THE FAULT, in Islam's words: *"are you sure of your fix? this is a zoomed
page"* — the TACTIC column reading one character per line. §260 fixed blank
lines somebody had pasted into a title; this is the table itself, and it is
only ever seen with the pen open, which is why every sweep at 1440 walked past
it. Five of a tactic's seven columns hold CONTROLS and a control does not
shrink: the four target boxes, the owner select, the collabs select and the
four quarter marks come to 666px whatever the window is, so every pixel the
window loses comes off the two PROSE columns. Measured on the build before
this one: the Tactic column 269 → 192 → 115 → 74px at 1400 / 1300 / 1200 /
1100, the tallest row 191 → 313 → 1957px, and at 1100 the table finally ran
past its own pane (§158).

WHAT THIS ASSERTS — the problem, not the layout (§94.8):
  1. ABOVE 1400 NOTHING CHANGES. Seven columns, both headings, the tail in its
     own two columns. This is half the decision (Islam: *"ok with your
     recomendation of width switching"* — and the recommendation opens with
     "above 1400, nothing changes"), and a build that folded everywhere would
     satisfy every other assertion here.
  2. BELOW IT THE TAIL FOLDS AND ITS HEADINGS GO WITH IT (*"on squeezing I'd
     say the collab and the quarters to lose their haeders"*) — five columns,
     no Collabs. and no Quarters heading.
  3. AND IT IS STILL THERE. A fold that dropped the two controls would pass
     every assertion about width and headings and would be the worst possible
     build (§61): both are asserted present, INSIDE the tactic's own name
     cell, and both are PRESSED and the stored plan read back (§96 — a control
     rendered somewhere new is a control that may have been rendered somewhere
     nothing is listening).
  4. THE PROSE COLUMN IS READABLE ALL THE WAY DOWN. A floor, not a value: any
     later change that gives it MORE keeps passing.
  5. NOTHING SCROLLS SIDEWAYS at any width (§158: it fits, never "and it
     scrolls") — which is where the previous build failed outright.
  6. READ MODE IS UNTOUCHED, measured. Its columns are all text and shrink
     together; the ladder is the pen's, and "we did not touch it" is a claim
     until something measures it (§213).
  7. THE WINDOW CHANGING SIZE REACHES IT. `tailFolds()` is read while the
     table is BUILT, so the whole thing is worthless to the person who
     reported it — a zoom is a resize — unless the page re-renders when the
     answer flips. Asserted without a reload.
  8. BOTH SIDES OF THE SWITCH (§53.5, A15): a unit's Plan pane and a pillars
     function's, which go through one builder and drift apart when only one is
     measured.
  9. §267.2 — EVERY BOX SAYS WHAT IT IS, and each key belongs to the box BELOW
     it: the gap over a key is measured against the gap under it, which is the
     whole of Islam's correction to the drawing ("the description title is
     stuck to the tactic box"). Read mode draws none of them.
 10. §267.2 — THE PILLARS GO ACROSS AT 1200, beside above it, and the table
     gets the width that buys.
 11. §267.2 — AND THE BOXES FIT THEIR TEXT AFTER A RESIZE. The defect he
     reported: a growing box is sized at the end of a paint, so narrowing the
     window without crossing a threshold left the box holding a height
     measured at the old width. Asserted by NARROWING, never by loading — a
     page opened at 1000px has never had a cut box.

Run: SMP_CHROME=... python3 qa-run.py checks/plan-tail-fold.py
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


WIDE = (1600, 1500)          # above the threshold: nothing may change
FOLDED = (1400, 1300, 1200, 1100, 1000)
PROSE_FLOOR = 200            # ≈28 characters at 13px — measured, not chosen

# Every probe degrades rather than throwing: a file without the feature must
# REPORT failures, not die and print none of them (§215).
TABLE = """() => {
  var t = [].slice.call(document.querySelectorAll('#panel table'))
    .filter(function(x){ var h = x.querySelector('thead');
                         return h && /tactic/i.test(h.textContent || ''); })[0];
  if (!t) return {none: true};
  var heads = [].map.call(t.querySelectorAll('thead th'),
                          function(h){ return (h.textContent || '').trim(); });
  var row = t.querySelector('tbody tr[data-oi]');
  var pane = t.closest('.pane');
  var name = row ? row.children[1] : null;
  var add = t.querySelector('tbody tr.newrow td[colspan]');
  return {
    heads: heads,
    cols: heads.length,
    tactic: Math.round(t.querySelectorAll('thead th')[1].getBoundingClientRect().width),
    tallest: Math.max.apply(null, [].map.call(t.querySelectorAll('tbody tr[data-oi]'),
      function(r){ return Math.round(r.getBoundingClientRect().height); })),
    over: Math.round(t.scrollWidth - (pane ? pane.clientWidth : t.scrollWidth)),
    /* Where the two controls actually are, asked of the DOM rather than
       assumed from the class: inside the name cell is the fold, in a cell of
       their own is not, and absent is the build nobody wants. */
    collabsInName: !!(name && name.querySelector('.collabsel')),
    quartersInName: !!(name && name.querySelector('.qs-edit')),
    collabsAnywhere: !!t.querySelector('.collabsel'),
    quartersAnywhere: !!t.querySelector('.qs-edit'),
    /* The Add row has to reach the end of whatever table this is (§199.5). */
    addSpan: add ? Number(add.getAttribute('colspan')) : null,
    handles: t.querySelectorAll('tbody tr[data-oi] .grip').length,
    /* §267.2 · the keys, and what each one is nearer to. `cut` is the defect
       he reported: a box holding less height than its own text needs. */
    keys: [].map.call(t.querySelectorAll('tbody tr[data-oi] .bxkey'),
                      function(k){ return (k.textContent || '').trim(); }),
    rowKeys: [].map.call((row || document.createElement('tr')).querySelectorAll('.bxkey'),
                         function(k){ return (k.textContent || '').trim(); }),
    cut: [].filter.call(t.querySelectorAll('tbody textarea.fld.grow'),
                        function(x){ return x.scrollHeight - x.clientHeight > 2; }).length,
    boxes: t.querySelectorAll('tbody textarea.fld.grow').length,
    /* A key's own margins, resolved — the correction was about which box it
       reads as belonging to, so the two gaps are compared, never a number. */
    keyGaps: (function(){
      var k = t.querySelector('tbody tr[data-oi] .bxkey + textarea') ? null : null;
      var all = t.querySelectorAll('tbody tr[data-oi] .bxkey'), out = [];
      for (var i = 0; i < all.length; i++) {
        var cs = getComputedStyle(all[i]);
        if (all[i].previousElementSibling)
          out.push({over: parseFloat(cs.marginTop), under: parseFloat(cs.marginBottom)});
      }
      return out;
    })()
  };
}"""

PAGE_X = "() => Math.round(document.documentElement.scrollWidth - document.documentElement.clientWidth)"

# §267.2 · where the pillars are. Asked of the LAYOUT, not of a width: a rail
# that is as wide as the pane it sits above has gone across, whatever the
# media query says it did.
RAIL = """() => {
  var r = document.querySelector('#panel .rail'), p = document.querySelector('#panel .pane');
  if (!r || !p) return {none: true};
  var rw = Math.round(r.getBoundingClientRect().width),
      pw = Math.round(p.getBoundingClientRect().width);
  return {rail: rw, pane: pw, across: rw > pw * 0.9};
}"""

# The first tactic of the first pillar, read out of the stored plan — never off
# the screen, which is what the control was just asked to change.
STORED = """(k) => {
  var u = (typeof unitLike === 'function') ? unitLike(k) : null;
  var t = u && u.items && u.items[0] && u.items[0].tactics && u.items[0].tactics[0];
  if (!t) return {none: true};
  return {q: (typeof quartersOf === 'function' ? quartersOf(t) : []).slice(),
          collabs: (typeof collabNames === 'function' ? collabNames(t) : []).slice(),
          id: t.id};
}"""


def open_plan(pg, kind, key):
    """Land on a subject's plan with the pen open, or say so."""
    if kind == "fn":
        sw = pg.query_selector("#units .navswitch .nsw:not(.on)")
        if sw and sw.is_visible():
            sw.click(); pg.wait_for_timeout(420)
    sel = '#units [data-u="%s"]' % (("fn:" + key) if kind == "fn" else key)
    el = pg.query_selector(sel)
    if not (el and el.is_visible()):
        return False
    el.click(); pg.wait_for_timeout(520)
    tab = pg.query_selector('[data-sub="strategy"]') or pg.query_selector('[data-sub="fnstrat"]')
    if tab and tab.is_visible():
        tab.click(); pg.wait_for_timeout(300)
    sec = pg.query_selector('[data-sub2="plan"]') or pg.query_selector('[data-sub2="proj"]')
    if sec and sec.is_visible():
        sec.click(); pg.wait_for_timeout(320)
    # §268: the strategy pen is on the section line now, outside #panel
    pen = pg.query_selector('#secrow-in .secpen')
    if not (pen and pen.is_visible()):
        return False
    pen.click(); pg.wait_for_timeout(650)          # a REAL press (§70)
    return True


SUBJECTS = (("unit", "mobile"), ("fn", "merchandising"))

with sync_playwright() as p:
    b = p.chromium.launch()

    for kind, key in SUBJECTS:
        label = "unit" if kind == "unit" else "function"
        print("\n== %s: %s ==" % (label, key))
        for w in WIDE + FOLDED:
            pg = b.new_page(viewport={"width": w, "height": 900})
            errs = []
            pg.on("pageerror", lambda e: errs.append(str(e)))
            pg.goto(url); pg.wait_for_timeout(750)
            who = pg.eval_on_selector_all("#asWho option", "els=>els.map(e=>e.value)")
            pg.select_option("#asWho", who[0]); pg.wait_for_timeout(320)
            if not open_plan(pg, kind, key):
                ck("%d · %s · the plan opens with the pen" % (w, label), False)
                pg.close(); continue
            m = pg.evaluate(TABLE)
            if m.get("none"):
                ck("%d · %s · a tactics table was measured" % (w, label), False, m)
                pg.close(); continue

            if w in WIDE:
                ck("%d · %s · seven columns, unchanged" % (w, label), m["cols"] == 7, m["heads"])
                ck("%d · %s · ...and both headings are still there" % (w, label),
                   "Collabs." in m["heads"] and "Quarters" in m["heads"], m["heads"])
                ck("%d · %s · ...and the tail is NOT in the name cell" % (w, label),
                   not m["collabsInName"] and not m["quartersInName"], m)
                ck("%d · %s · the Add row still reaches the end" % (w, label),
                   m["addSpan"] == 6, m["addSpan"])
            else:
                ck("%d · %s · five columns" % (w, label), m["cols"] == 5, m["heads"])
                ck("%d · %s · ...neither heading survives" % (w, label),
                   not any(h in ("Collabs.", "Quarters") for h in m["heads"]), m["heads"])
                ck("%d · %s · ...and BOTH controls moved under the name" % (w, label),
                   m["collabsInName"] and m["quartersInName"], m)
                ck("%d · %s · the Add row still reaches the end" % (w, label),
                   m["addSpan"] == 4, m["addSpan"])
                ck("%d · %s · the tactic column stays readable (>=%dpx)"
                   % (w, label, PROSE_FLOOR), m["tactic"] >= PROSE_FLOOR, m["tactic"])
            ck("%d · %s · the tail is drawn SOMEWHERE" % (w, label),
               m["collabsAnywhere"] and m["quartersAnywhere"], m)
            # §267.2 · every box names itself. Collabs. and Quarters only where
            # they have left their columns — with a heading over them, a key
            # under it would say the word twice on one row (§87).
            want = (["Tactic", "Description"] +
                    (["Collabs.", "Quarters"] if w in FOLDED else []) + ["Outcome"])
            ck("%d · %s · the row's boxes are named %s" % (w, label, want),
               m["rowKeys"] == want, m["rowKeys"])
            ck("%d · %s · ...and every key reads DOWN onto its own box" % (w, label),
               bool(m["keyGaps"]) and all(g["over"] > g["under"] for g in m["keyGaps"]),
               m["keyGaps"])
            r = pg.evaluate(RAIL)
            ck("%d · %s · the pillars go %s" % (w, label,
                                                "across" if w <= 1200 else "beside"),
               not r.get("none") and r["across"] == (w <= 1200), r)
            ck("%d · %s · reordering keeps its handles" % (w, label), m["handles"] > 0, m)
            ck("%d · %s · the table fits its pane" % (w, label), m["over"] <= 0, m["over"])
            ck("%d · %s · the page does not scroll sideways" % (w, label),
               pg.evaluate(PAGE_X) <= 0)
            if errs:
                ck("%d · %s · no page errors" % (w, label), False, errs[:2])
            pg.close()

    # ── THE CONTROLS STILL WRITE, FOLDED (§96) ────────────────────────────
    # A control rendered into a new place is a control that may have been
    # rendered into a place nothing is listening to — and it would look
    # perfect. Pressed, then the STORED plan read back.
    for kind, key in SUBJECTS:
        label = "unit" if kind == "unit" else "function"
        pg = b.new_page(viewport={"width": 1200, "height": 900})
        pg.goto(url); pg.wait_for_timeout(750)
        who = pg.eval_on_selector_all("#asWho option", "els=>els.map(e=>e.value)")
        pg.select_option("#asWho", who[0]); pg.wait_for_timeout(320)
        target = ("fn:" + key) if kind == "fn" else key
        if not open_plan(pg, kind, key):
            ck("%s · folded · the plan opens with the pen" % label, False)
            pg.close(); continue
        before = pg.evaluate(STORED, target)
        q = pg.query_selector('#panel table.tactable tbody tr[data-oi] td:nth-child(2) .qs-edit button')
        if q:
            q.click(); pg.wait_for_timeout(420)
        after = pg.evaluate(STORED, target)
        ck("%s · folded · a quarter mark writes the plan" % label,
           bool(q) and not before.get("none") and before.get("q") != after.get("q"),
           {"before": before.get("q"), "after": after.get("q")})

        # The collabs picker is SEARCHSEL's (§45.5): the native select is
        # hidden in place and the button in front of it is what a person
        # presses, so the option is chosen through it and not by setting a
        # value nothing would hear.
        opened = pg.evaluate("""() => {
          var cell = document.querySelector('#panel table.tactable tbody tr[data-oi] td:nth-child(2)');
          var btn = cell && cell.querySelector('.ssbtn');
          if (!btn) return false; btn.click(); return true; }""")
        pg.wait_for_timeout(350)
        picked = pg.evaluate("""() => {
          var op = document.querySelector('.sspop .ssrow');
          if (!op) return false; op.click(); return true; }""")
        pg.wait_for_timeout(420)
        end = pg.evaluate(STORED, target)
        ck("%s · folded · the collaborators picker writes the plan" % label,
           opened and picked and end.get("collabs") != before.get("collabs"),
           {"opened": opened, "picked": picked,
            "before": before.get("collabs"), "after": end.get("collabs")})
        ck("%s · folded · the picker's list escaped the cell" % label,
           pg.evaluate("""() => {
             var pop = document.querySelector('.sspop');
             return !pop || pop.getBoundingClientRect().width > 40; }"""))
        pg.close()

    # ── READ MODE IS UNTOUCHED (§213: a claim, until it is measured) ───────
    for w in (1500, 1200, 1000):
        pg = b.new_page(viewport={"width": w, "height": 900})
        pg.goto(url); pg.wait_for_timeout(750)
        who = pg.eval_on_selector_all("#asWho option", "els=>els.map(e=>e.value)")
        pg.select_option("#asWho", who[0]); pg.wait_for_timeout(320)
        el = pg.query_selector('#units [data-u="mobile"]')
        if el:
            el.click(); pg.wait_for_timeout(500)
        tab = pg.query_selector('[data-sub="strategy"]')
        if tab and tab.is_visible():
            tab.click(); pg.wait_for_timeout(300)
        sec = pg.query_selector('[data-sub2="plan"]')
        if sec and sec.is_visible():
            sec.click(); pg.wait_for_timeout(320)
        m = pg.evaluate(TABLE)
        ck("%d · reading · seven columns, both headings" % w,
           not m.get("none") and m["cols"] == 7 and "Quarters" in m["heads"], m.get("heads"))
        # §267.2: the keys are the PEN's. Reading has a bold name and a grey
        # line, told apart by their weight, and a key over each would spend
        # height on a table nobody is filling in.
        ck("%d · reading · and no box keys at all" % w,
           not m.get("none") and not m["keys"], m.get("keys"))
        pg.close()

    # ── A ROW IS ONE COLOUR ALL THE WAY ACROSS (§267.1, REWRITTEN AT §278.3) ──
    # Islam, of the folded table: *"on squeezing the outcome cell left outline
    # is damged"*. §267.1's answer was to make the frozen pair follow the row
    # HOVER, and this asserted the hovered row was one ground.
    #
    # THE HOVER IS GONE (§278.3) — Islam, asked whether the tint earned its
    # place beside the stripe: *"for the hovering C remove it"* — so an
    # assertion about a hovered row now asserts a rule the product does not
    # have. REWRITTEN RATHER THAN DELETED (§218): the property Islam reported
    # is that a row does not read as split down the middle, and that is still
    # worth guarding — it is simply no longer a fact about hover.
    #
    # SO IT IS MEASURED AS PAINT, NOT AS A COMPUTED STRING. The frozen pair
    # carries an explicit `#FFFFFF` where the rest of the row carries
    # `rgba(0,0,0,0)`; on the table's own white ground those are the same
    # pixels, and comparing the strings would report a seam that nobody can
    # see. The row is hovered first anyway, because the assertion has to hold
    # in the state Islam was in when he reported it.
    print("\n== a row is one colour, hover or no hover ==")
    for w, where in ((1500, "unfolded"), (1200, "folded")):
        pg = b.new_page(viewport={"width": w, "height": 1000})
        pg.goto(url); pg.wait_for_timeout(750)
        who = pg.eval_on_selector_all("#asWho option", "els=>els.map(e=>e.value)")
        pg.select_option("#asWho", who[0]); pg.wait_for_timeout(320)
        if not open_plan(pg, "unit", "mobile"):
            ck("%s · the plan opens with the pen" % where, False)
            pg.close(); continue
        for n, parity in ((0, "unstriped"), (1, "striped")):
            spot = pg.evaluate("""(n) => {
              var t = [].slice.call(document.querySelectorAll('#panel table'))
                .filter(function(x){ var h = x.querySelector('thead');
                                     return h && /tactic/i.test(h.textContent || ''); })[0];
              var r = t && t.querySelectorAll('tbody tr')[n];
              if (!r) return null;
              r.scrollIntoView({block: 'center'});
              var q = r.getBoundingClientRect();
              if (q.bottom < 0 || q.top > window.innerHeight) return null;
              return {x: q.x + Math.min(q.width * 0.5, window.innerWidth - q.x - 20),
                      y: Math.max(4, Math.min(q.y + q.height * 0.5,
                                              window.innerHeight - 4))}; }""", n)
            if not spot:
                ck("%s · %s · a row to hover" % (where, parity), False)
                continue
            pg.mouse.move(spot["x"], spot["y"]); pg.wait_for_timeout(260)
            grounds = pg.evaluate("""(n) => {
              var t = [].slice.call(document.querySelectorAll('#panel table'))
                .filter(function(x){ var h = x.querySelector('thead');
                                     return h && /tactic/i.test(h.textContent || ''); })[0];
              var r = t && t.querySelectorAll('tbody tr')[n];
              if (!r) return [];
              /* WHAT IS PAINTED, walking up to whatever actually lays down a
                 colour: a transparent cell shows its table's ground, and a
                 cell carrying that same ground explicitly is not a seam. */
              function ground(el){
                while (el) {
                  var c = getComputedStyle(el).backgroundColor;
                  if (c && c !== 'rgba(0, 0, 0, 0)' && c !== 'transparent') return c;
                  el = el.parentElement;
                }
                return 'none';
              }
              return [].map.call(r.children, ground); }""", n)
            ck("%s · a %s row is one ground across every cell" % (where, parity),
               len(set(grounds)) == 1, grounds)
        pg.close()

    # ── THE BOXES FIT THEIR TEXT AFTER A RESIZE (§267.2) ──────────────────
    # Islam: *"the tactic and description and outcome boxes stopped fitting the
    # content and started cutting it"*. NARROWED, never loaded: a page opened
    # at 1000px has never had a cut box, which is why this went unseen — so an
    # assertion that loads the page at each width passes on the broken build.
    print("\n== the boxes fit their text after a resize ==")
    pg = b.new_page(viewport={"width": 1500, "height": 1000})
    pg.goto(url); pg.wait_for_timeout(750)
    who = pg.eval_on_selector_all("#asWho option", "els=>els.map(e=>e.value)")
    pg.select_option("#asWho", who[0]); pg.wait_for_timeout(320)
    if not open_plan(pg, "unit", "mobile"):
        ck("resize · the plan opens with the pen", False)
    else:
        start = pg.evaluate(TABLE)
        ck("resize · nothing is cut to begin with",
           not start.get("none") and start["cut"] == 0, start.get("cut"))
        for w in (1350, 1150, 1050, 950):
            pg.set_viewport_size({"width": w, "height": 1000}); pg.wait_for_timeout(450)
            m = pg.evaluate(TABLE)
            ck("resize · narrowed to %d · no box cuts its own text" % w,
               not m.get("none") and m["cut"] == 0,
               "%s of %s cut" % (m.get("cut"), m.get("boxes")))
    pg.close()

    # ── AND A ZOOM REACHES IT (§267) ──────────────────────────────────────
    # The reported case. `tailFolds()` is read while the table is built, so
    # without the watcher the person who resizes — or zooms — goes on looking
    # at the layout chosen for the width before.
    pg = b.new_page(viewport={"width": 1500, "height": 900})
    pg.goto(url); pg.wait_for_timeout(750)
    who = pg.eval_on_selector_all("#asWho option", "els=>els.map(e=>e.value)")
    pg.select_option("#asWho", who[0]); pg.wait_for_timeout(320)
    if not open_plan(pg, "unit", "mobile"):
        ck("resize · the plan opens with the pen", False)
    else:
        wide = pg.evaluate(TABLE)
        ck("resize · it starts wide", not wide.get("none") and wide["cols"] == 7,
           wide.get("cols"))
        pg.set_viewport_size({"width": 1200, "height": 900})
        pg.wait_for_timeout(600)
        narrow = pg.evaluate(TABLE)
        ck("resize · narrowing the window folds the tail, with no reload",
           not narrow.get("none") and narrow["cols"] == 5, narrow.get("heads"))
        ck("resize · ...and the pen is still open", not narrow.get("none")
           and narrow.get("quartersAnywhere"), narrow)
        pg.set_viewport_size({"width": 1500, "height": 900})
        pg.wait_for_timeout(600)
        back = pg.evaluate(TABLE)
        ck("resize · ...and widening it puts the two columns back",
           not back.get("none") and back["cols"] == 7, back.get("heads"))
    pg.close()
    b.close()

print("\n%d failed" % bad)
