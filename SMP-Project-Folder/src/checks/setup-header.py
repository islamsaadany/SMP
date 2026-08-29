"""THE SETUP HEADER LINE (§135), THE MARKING TABLE (§135.5) AND A REPAIRED
MATRIX (§135.2).

Islam, of six Setup pages at once: *"bring all the buttons and search bar to the
sticky header line"*, *"remove the smo pill and 10 names and 10 mapped"*,
*"remove the briefing grey paragraph"*, and of Roles & access, *"check the table
as the design is damaged."*

WHAT IS ASSERTED IS THE PROBLEM, NOT THE LAYOUT (§94.8). Every number in this
file that could be spent on a pixel measurement is spent on a relationship
instead: the header is ONE row rather than 46px tall; the table follows it
rather than starting at y=210; the matrix's header rows are in order and clear
of the body rather than at any particular offset. A check written against the
arrangement I happened to reach has to be rewritten the next time somebody moves
a control, and then it is the check that gets deleted.

FOUR THINGS IT DELIBERATELY MEASURES THE HARD WAY:

  · THE BOX SOMEBODY CAN SEE (§122.4). The header wraps, so a build where the
    controls no longer fit beside the name reports one row on the inner box
    while the header is two. Both are measured, outer first.

  · PRESSED, NOT COUNTED (§70, §93.4). Every control on the line is asked
    `elementFromPoint` at its own centre. This register's own history is
    controls that were present, enabled, correctly sized and landing under
    something else, three versions running.

  · BOTH ENDS (§94.2). A build that removed the count chips AND the alarm chip
    would pass "no counts"; a build that drew no controls at all would pass
    "the controls are one row". So the absences are asserted beside the
    presences they are supposed to leave behind.

  · THE DATA, AFTER THE PRESS (§96). Marking is asked of `CYCLE.focus`, not of
    a lit tick — an editor wired to nothing looks identical and discards every
    keystroke.

Run: SMP_CHROME=... python3 qa-run.py checks/setup-header.py
"""
import pathlib
from playwright.sync_api import sync_playwright

URL = "file://" + str(pathlib.Path(
    pathlib.Path(__file__).resolve().parent.parent,
    "strategy-management-platform.html").resolve())

bad, errs = 0, []


def ck(w, ok, x=""):
    global bad
    if not ok:
        bad += 1
    print(("  ok      " if ok else "  FAIL    ") + w + (("  — " + str(x)) if not ok and x else ""))


# ONE ROW IS NOT ONE `top` VALUE (§122.4): the controls differ in height, so a
# naive count of distinct tops reports three rows on a row that is plainly one.
# Clustered by the middle of each box.
ROWS = """(sel)=>{const e=document.querySelector(sel); if(!e) return -1;
  const kids=[...e.children].filter(c=>c.getClientRects().length);
  const mids=kids.map(c=>{const r=c.getBoundingClientRect(); return r.top+r.height/2;});
  const rows=[]; mids.forEach(m=>{ if(!rows.some(r=>Math.abs(r-m)<10)) rows.push(m); });
  return rows.length;}"""

HITS = """(sel)=>[...document.querySelectorAll(sel)].filter(e=>e.getClientRects().length)
  .map(e=>{const r=e.getBoundingClientRect();
    const t=document.elementFromPoint(r.left+r.width/2, r.top+r.height/2);
    return {what:(e.textContent||e.className||'').trim().slice(0,22),
            ok: !!t && (t===e || e.contains(t) || t.contains(e))};})"""


def setup(pg):
    pg.evaluate("()=>{ current='setup'; paint(); }")
    pg.wait_for_timeout(300)


def go(pg, key):
    pg.evaluate("(k)=>{ currentSub=k; paint(); }", key)
    pg.wait_for_timeout(350)


with sync_playwright() as p:
    b = p.chromium.launch()
    pg = b.new_page(viewport={"width": 1560, "height": 900})
    pg.on("pageerror", lambda e: errs.append("pageerror: " + str(e)))
    pg.on("console", lambda m: errs.append("console: " + m.text) if m.type == "error" else None)
    pg.add_init_script("try{sessionStorage.setItem('smp.tour.later','1');}catch(e){}")
    pg.goto(URL)
    pg.wait_for_timeout(900)
    pg.select_option("#asWho", "smo")
    pg.wait_for_timeout(300)
    setup(pg)
    for _ in range(12):
        g = pg.query_selector(".setuprail .rgroup.shut")
        if not g:
            break
        g.click()
        pg.wait_for_timeout(70)

    pages = pg.eval_on_selector_all(
        ".setuprail .ritem",
        "e=>e.map(x=>[x.dataset.setupgo, x.querySelector('.rilab').textContent.trim()])")
    ck("every Setup page is reachable to walk", len(pages) >= 15, len(pages))

    # ── 1 · ONE LINE, ON EVERY PAGE ──────────────────────────────────
    print("\n1 · the page's controls are on the page's own pinned line")
    withacts = 0
    for k, label in pages:
        go(pg, k)
        st = pg.evaluate("""()=>{const h=document.querySelector('.setuphead');
          return {head:!!h, sticky:h?getComputedStyle(h).position:'',
                  acts:h?h.querySelectorAll('.hright > *').length:0,
                  tools:h?h.querySelectorAll('.tk-bar').length:0,
                  stray:document.querySelectorAll('.setuppane .phead2').length,
                  notes:document.querySelectorAll('.setuppane .sec-note').length,
                  filters:document.querySelectorAll('.setuppane [data-tkfilter]').length,
                  counts:document.querySelectorAll('.setuppane [data-tkcount]').length};}""")
        ok = (st["head"] and st["sticky"] == "sticky" and st["stray"] == 0
              and st["notes"] == 0 and st["filters"] == 0 and st["counts"] == 0)
        ck("%s: one header, no second row, no briefing, no filters" % label, ok, st)
        if st["acts"] or st["tools"]:
            withacts += 1
    # BOTH ENDS: a build that drew no controls anywhere would pass every
    # assertion above, and would be the worst possible outcome of this change.
    ck("...and most pages actually put something on it (%d)" % withacts, withacts >= 6, withacts)

    # ── 2 · WHAT WENT, AND WHAT STAYED ───────────────────────────────
    print("\n2 · the identity pill and the counts are gone; an alarm is not")
    chips = {}
    for k, label in pages:
        go(pg, k)
        # ANYWHERE ON THE PANE, not only on the header line (§113.8). Scoping
        # this to `.setuphead` made it pass on a build where the chips were
        # alive and well one row lower — an assertion satisfied by both sides
        # vanishing, which is the blind spot of every "these must agree" check.
        chips[k] = pg.eval_on_selector_all(".setuppane .chip",
                                           "e=>e.map(x=>x.textContent.trim())")
    flat = [c for v in chips.values() for c in v]
    ck("no `SMO` pill survives anywhere", not any(c.strip() in ("SMO", "SMO only", "Everyone")
                                                  for c in flat), flat)
    ck("no chip is a bare count", not any(c[:1].isdigit() and "not on this list" not in c
                                          for c in flat), flat)
    # AND THE ALARM STILL WORKS. The demo has no stray name, so the state is
    # MADE — otherwise this ships unexercised (§94.2).
    go(pg, "mainbu")
    pg.evaluate("""()=>{ const p=PEOPLE[0];
      p.mainbu='A department nobody listed'; paint(); }""")
    pg.wait_for_timeout(300)
    said = pg.eval_on_selector_all(".setuphead .chip", "e=>e.map(x=>x.textContent.trim())")
    ck("...on the header line, where the page's own marks now live",
       any("not on this list" in c for c in said), said)
    ck("an outstanding thing still gets a chip", any("not on this list" in c for c in said), said)
    pg.evaluate("()=>{ PEOPLE[0].mainbu=''; paint(); }")
    pg.wait_for_timeout(250)

    # ── 3 · IT IS ONE ROW, AND THE TABLE FOLLOWS IT ──────────────────
    print("\n3 · one row at every width, and nothing between it and the page")
    for w in (1920, 1600, 1440, 1280):
        pg.set_viewport_size({"width": w, "height": 900})
        for k in ("people", "units", "mainbu", "caps"):
            go(pg, k)
            nh = pg.evaluate(ROWS, ".setuphead")
            ck("%d %s: the header is one row (%s)" % (w, k, nh), nh == 1, nh)
            hits = pg.evaluate(HITS, ".setuphead .hright > *, .setuphead .tk-bar input")
            ck("%d %s: every control on it can be pressed (%d)" % (w, k, len(hits)),
               all(h["ok"] for h in hits), [h for h in hits if not h["ok"]])
            # THE PAGE, NOT THE TABLE. A section HEADING between the header
            # and its table is content and stays (Official BU list has one);
            # what had to go is the row of controls that used to sit there. So
            # this measures to whatever comes NEXT, whatever that is.
            gap = pg.evaluate("""()=>{const h=document.querySelector('.setuphead'),
                 n=h && h.nextElementSibling;
               return n? Math.round(n.getBoundingClientRect().top -
                                    h.getBoundingClientRect().bottom) : -1;}""")
            ck("%d %s: the page starts directly under it (%dpx)" % (w, k, gap),
               0 <= gap <= 30, gap)
        ck("%d: nothing scrolls sideways" % w,
           not pg.evaluate("()=>document.documentElement.scrollWidth>innerWidth+1"))
    pg.set_viewport_size({"width": 1560, "height": 900})

    # ── 4 · THE MATRIX'S HEADER IS BACK WHERE IT BELONGS (§135.2) ────
    print("\n4 · Roles & access: two header levels, in order, clear of the rows")
    # ── THE STATE HAS TO BE MADE (§94.2) ─────────────────────────────
    # The damage only appears once the page has SCROLLED, and on a 900px window
    # this matrix scrolls by about 60px — so at 1560x900 the first version of
    # this section measured an unscrolled page three times and reported the
    # broken build clean. A short window is what gives it something to scroll,
    # and the scroll is asserted before anything is read off it.
    pg.set_viewport_size({"width": 1400, "height": 560})
    go(pg, "access")
    # ── THE BOX IS WHAT SCROLLS NOW (§174.1) ─────────────────────────
    # This section scrolled the PAGE, which was the only thing that moved when
    # it was written. The matrix is capped and pinned to its own box since
    # §174, so the page barely scrolls at all and the state this measures had
    # to be reached another way — §51.11 in the good direction: the check went
    # red because the product changed, and the fault it guards (a header cell
    # landing on a body row) is exactly as possible as it ever was.
    room = pg.evaluate("""()=>{const b=document.querySelector('.acgrid');
        return Math.round(b.scrollHeight - b.clientHeight);}""")
    ck("the matrix has room to scroll, so there is a state to measure (%dpx)" % room,
       room >= 60, room)
    for y in (0, 60, 140):
        pg.evaluate("(y)=>{document.querySelector('.acgrid').scrollTop=y;}", y)
        pg.wait_for_timeout(250)
        at = pg.evaluate("()=>Math.round(document.querySelector('.acgrid').scrollTop)")
        ck("@%d: it actually scrolled there (%d)" % (y, at), abs(at - y) <= 2, at)
        # THE CELLS, NOT THE `<tr>` — AND THAT IS THE WHOLE MEASUREMENT.
        # A table row has no box of its own once its cells are positioned, so
        # `tr.getBoundingClientRect()` goes on reporting the un-stuck layout
        # while every `th` inside it has been shoved 141px down the table. The
        # first version of this section measured rows and called the broken
        # build clean at three scroll positions — §128's lesson with the sign
        # reversed, and the one that costs a whole section its meaning.
        #
        # Rowspan cells are why this compares TOPS rather than bottoms: half of
        # row one spans both rows, so its bottom is legitimately row two's.
        m = pg.evaluate("""()=>{
          const rows=[...document.querySelectorAll('.acgrid thead tr')]
            .map(r=>[...r.children].map(c=>{const b=c.getBoundingClientRect();
                     return {top:Math.round(b.top), bottom:Math.round(b.bottom)};}));
          const first=document.querySelector('.acgrid tbody tr td');
          const box=document.querySelector('.acgrid');
          const bs=getComputedStyle(box);
          return {rows:rows,
                  boxTop: Math.round(box.getBoundingClientRect().top
                                     + parseFloat(bs.borderTopWidth || 0)),
                  bodyTop: first? Math.round(first.getBoundingClientRect().top) : null};}""")
        r = [{"top": min(c["top"] for c in row), "bottom": max(c["bottom"] for c in row),
              "spread": max(c["top"] for c in row) - min(c["top"] for c in row)}
             for row in m["rows"]]
        ck("@%d: each header level sits on one line" % y,
           all(x["spread"] <= 1 for x in r), r)
        ck("@%d: the second level is BELOW the first, not on it" % y,
           len(r) == 2 and r[1]["top"] > r[0]["top"] + 4, r)
        # THE FAULT WAS THE HEAD DISPLACED DOWN INSIDE THE TABLE (§130.2:
        # 141px down, sitting across rows three and four), and the measurement
        # of it was "a header cell has landed on a body row". That comparison
        # stopped meaning anything the moment the head legitimately pinned:
        # rows pass UNDER a pinned head by design, so the first body row is
        # above its bottom at any scroll and the assertion failed on a correct
        # build. What the fault actually violates is that the head sits at the
        # TOP OF ITS BOX — 141px down is exactly what that catches, at rest and
        # at every scroll position, and a head that slides away catches it too.
        ck("@%d: the head is at the top of its box, not down inside the table" % y,
           abs(min(x["top"] for x in r) - m["boxTop"]) <= 2,
           {"headTop": min(x["top"] for x in r), "boxTop": m["boxTop"]})
    pg.evaluate("()=>{document.querySelector('.acgrid').scrollTop=0;}")
    # WHAT THE DAMAGE WAS HIDING, asserted so a build that broke it again
    # cannot pass by drawing a header that merely does not overlap.
    #
    # THE HEADINGS ARE ABBREVIATED SINCE §174 and the full name moved to the
    # hover, so this asks for BOTH: the short word on screen, and the long one
    # still attached to it. Asserting only the short one would pass on a build
    # that had dropped the meaning altogether.
    heads = pg.eval_on_selector_all(".acgrid thead th",
                                    "e=>e.map(x=>x.textContent.trim().toLowerCase())")
    titles = pg.eval_on_selector_all(".acgrid thead th",
                                     "e=>e.map(x=>(x.getAttribute('title')||'').toLowerCase())")
    ck("the group headings are on the page",
       any("own bu" in h for h in heads) and any("own func" in h for h in heads), heads)
    ck("...and each still says in full what it is",
       any("own business unit" in t for t in titles)
       and any("own supporting function" in t for t in titles), titles)
    pg.set_viewport_size({"width": 1560, "height": 900})

    # ── 5 · FOCUS MEASURES (§135.5) ──────────────────────────────────
    print("\n5 · focus: a switch on the line, destinations in a row, one table")
    go(pg, "focusset")
    st = pg.evaluate("""()=>({
      segs:[...document.querySelectorAll('.setuphead [data-focusswitch]')]
             .map(x=>x.textContent.trim()),
      inHead:!!document.querySelector('.setuphead [data-focusswitch]'),
      dropdown:!!document.querySelector('#fset-unit'),
      dests:[...document.querySelectorAll('[data-fsetgo]')].map(x=>x.dataset.fsetgo),
      sides:[...document.querySelectorAll('[data-fsetside]')].map(x=>x.dataset.fsetside),
      thead:[...document.querySelectorAll('.ftable thead th')].map(x=>x.textContent.trim()),
      bands:document.querySelectorAll('.ftable tr.fband').length })""")
    ck("the switch is On|Off and on the pinned line", st["inHead"] and st["segs"] == ["On", "Off"], st)
    ck("...and the old worded button and dropdown are gone", not st["dropdown"], st)
    ck("the destinations are a row, not a select", len(st["dests"]) >= 5, st["dests"])
    ck("with both sides offered", sorted(st["sides"]) == ["fns", "units"], st["sides"])
    ck("and it is a real table with a real head",
       st["thead"] and st["thead"][0].lower() == "measure" and st["bands"] > 0, st)
    hits = pg.evaluate(HITS, ".setuphead [data-focusswitch], [data-fsetside], [data-fsetgo]")
    ck("every one of those can be pressed (%d)" % len(hits),
       all(h["ok"] for h in hits), [h for h in hits if not h["ok"]])

    print("\n5b · a supporting function can be marked, and the mark is stored")
    # A MISSING CONTROL IS A FAILURE, NOT AN EXCEPTION. A check that throws
    # half way reports fewer failures than the build has, and the sections it
    # never reached look green by absence — which is how a "prove it fails" run
    # can quietly skip the one assertion that mattered.
    side = pg.query_selector('[data-fsetside="fns"]')
    ck("the Functions side is there to press", bool(side))
    if side:
        side.click()
        pg.wait_for_timeout(350)
    dests = pg.eval_on_selector_all("[data-fsetgo]", "e=>e.map(x=>x.dataset.fsetgo)")
    ck("the row switches to functions",
       bool(dests) and all(d.startswith("fn:") for d in dests), dests)
    # A CAPABILITY FUNCTION AND A PILLARS ONE ARE TWO SHAPES, and only walking
    # both proves the resolver rather than one branch of it (§53.5).
    for key, shape in (("fn:finance", "capabilities"), ("fn:merchandising", "pillars")):
        pg.evaluate("(k)=>{FSET.unit=k;paint();}", key)
        pg.wait_for_timeout(300)
        n = pg.eval_on_selector_all(".ftable [data-focus]", "e=>e.length")
        ck("%s (%s) offers something to mark (%d)" % (key, shape, n), n > 0, n)
        mark = pg.query_selector(".ftable [data-focus]")
        if not mark:
            continue
        before = pg.evaluate("()=>Object.keys(CYCLE.focus).length")
        mid = mark.get_attribute("data-focus")
        mark.click()
        pg.wait_for_timeout(300)
        # ASKED OF THE DATA, NOT OF THE TICK (§96).
        ck("%s: pressing it writes the mark" % key,
           pg.evaluate("(id)=>!!CYCLE.focus[id]", mid)
           and pg.evaluate("()=>Object.keys(CYCLE.focus).length") == before + 1, mid)
        ck("%s: and the destination row counts it" % key,
           pg.evaluate("""(k)=>{const b=[...document.querySelectorAll('[data-fsetgo]')]
                 .filter(x=>x.dataset.fsetgo===k)[0];
               return !!b && !!b.querySelector('.fnav-n');}""", key))

    print("\n5c · and the group's board shows it, or it is stored where nobody looks (§61)")
    pg.evaluate("()=>{current='group';currentSub='focus';paint();}")
    pg.wait_for_timeout(450)
    names = pg.eval_on_selector_all("table.board td.unitcell b", "e=>e.map(x=>x.textContent.trim())")
    ck("a function appears on the Focus board beside the units",
       any(n in ("Finance", "Merchandising") for n in names) and len(names) > 1, names)

    # ── 6 · SEND AN EMAIL (§135.3, §135.4) ───────────────────────────
    print("\n6 · one page, three halves, and the settings still work")
    pg.evaluate("()=>{current='setup';currentSub='send';paint();}")
    pg.wait_for_timeout(450)
    secs = pg.eval_on_selector_all(".setuppane .secrow button",
                                   "e=>e.map(x=>x.textContent.trim())")
    # §144 PUT THE RECORD IN FRONT OF THE COMPOSER, so the two halves §135.3
    # built are three now: what you arrive at, what you do, and what you set
    # once. The assertion is the WHOLE row rather than the two it knew about,
    # or a fourth tab appearing later would go unnoticed.
    ck("it has three sections",
       secs == ["Overview", "Compose", "Email settings"], secs)
    ck("the page is called Send an email",
       pg.eval_on_selector(".setupttl", "e=>e.textContent.trim()") == "Send an email")
    ck("and the two chips are gone",
       not pg.evaluate("()=>!!document.querySelector('[data-audcount]')")
       and not any("SMO" == c for c in
                   pg.eval_on_selector_all(".setuphead .chip", "e=>e.map(x=>x.textContent.trim())")))
    # THE SETTINGS ARE THE LAST TAB, NAMED RATHER THAN COUNTED: keying on
    # nth-child is how this check would silently start opening the composer the
    # next time a tab is inserted (§51.11).
    second = None
    for tab in pg.query_selector_all('.setuppane .secrow button'):
        if tab.text_content().strip() == "Email settings":
            second = tab
    ck("the settings half can be opened", bool(second))
    if second:
        second.click()
        pg.wait_for_timeout(450)
    ck("the settings half renders its own fields",
       pg.evaluate("()=>!!document.querySelector('[data-comms]') ||"
                   " !!document.querySelector('#mailprev')"))
    ck("...and Email is no longer a rail row of its own",
       "comms" not in [k for k, _ in pages], [k for k, _ in pages])
    # THE OLD NAME IS GONE, AND THAT IS ALL THIS FILE CAN HONESTLY SAY. The
    # chat needs a server, so over `file://` the entry is not in the rail at
    # all (§94.11) — the POSITIVE assertion lives in checks/office-chat.py,
    # which serves the built file over HTTP. Asserting presence here would
    # either fail forever or be softened into something that passes on a build
    # with the page deleted.
    ck("...and no rail entry is called just 'Inbox' any more",
       not any(lbl in ("Inbox", "In Platform inbox") for _, lbl in pages),
       [lbl for _, lbl in pages])
    # AND IT SITS WITH MEASUREMENT (§135.11). Asserted of the GROUP the rail
    # actually draws it under, not of the def — the rail is what somebody
    # scans, and a def whose `grp` no longer matches a real group would render
    # nowhere at all rather than in the wrong place.
    ck("Focus measures is in the Measurement group",
       pg.evaluate("""()=>{const b=[...document.querySelectorAll('.setuprail .ritem')]
             .filter(x=>x.dataset.setupgo==='focusset')[0];
           return !!b && b.closest('[data-railitems]').dataset.railitems;}""") == "meas")

    # ── 7 · NO SLOT BETWEEN THE TWO PINNED HEADERS (§135.10) ─────────
    print("\n7 · the table's head pins flush under the page's, at every width")
    # THE SLOT IS MEASURED, NOT SAMPLED FOR. The first version of this section
    # scrolled in 20px steps looking for a row showing through — and PASSED on
    # a build with the fix deliberately removed, because the 4px slot only
    # shows something when a row happens to be passing through it. A sampled
    # search for a symptom is a check that finds the fault when it is lucky.
    #
    # Any positive gap between the two pinned boxes IS the fault: it is a hole
    # between two things that do not move, so a row will show through it at
    # some scroll position whether or not this run caught one. Negative is
    # fine — the table's head simply tucks under the page's.
    # THE STATE IS PUT BACK FIRST (§94.2). Section 5b left the focus page on a
    # function with two rows, and a page too short to scroll has a head that
    # never pins — so the first run of this measured the flow gap on a page
    # that was perfectly fine and reported it as a slot.
    pg.evaluate("()=>{ FSET.side='units'; FSET.unit=activeKeys()[0]; }")
    for w in (1560, 1400, 1180):
        pg.set_viewport_size({"width": w, "height": 700})
        for k in ("focusset", "units", "caps"):
            go(pg, k)
            # MEASURED WHILE IT IS ACTUALLY PINNED, which is the only state the
            # claim is about. At a fixed scroll position a short table's head is
            # still in flow, and the distance to it is a layout gap rather than
            # a slot — which is how the first version of this reported 50px on a
            # page that was perfectly fine.
            g = None
            for y in (200, 400, 700, 1200):
                pg.evaluate("(y)=>scrollTo(0,y)", y)
                pg.wait_for_timeout(120)
                v = pg.evaluate("""()=>{const h=document.querySelector('.setuphead');
                  const th=document.querySelector('.setuppane table thead th');
                  if(!h||!th) return null;
                  const cs=getComputedStyle(th);
                  const want=parseFloat(cs.top);
                  const tb=th.getBoundingClientRect().top;
                  return {stuck: cs.position==='sticky' && Math.abs(tb-want)<=1,
                          gap: Math.round(tb - h.getBoundingClientRect().bottom)};}""")
                if v and v["stuck"]:
                    g = v["gap"]
                    break
            # AND SINCE §163.5 THE ORDINARY SETUP TABLE'S HEAD DOES NOT PIN
            # AT ALL, which is why "never pinned" stopped being something to
            # report and became the answer. Those heads pinned to a PAGE
            # offset while sitting in a box that scrolls, so the browser
            # measured the offset from the top of the TABLE and the head sat
            # 136px down its own body, across the third row; the cure was
            # `position:static`, and a head that does not pin cannot leave a
            # slot under one that does. So the claim is asked of the POSITION
            # rather than of a gap that can no longer occur (§51.11 — a check
            # keyed on behaviour deliberately removed goes red for the wrong
            # reason, and this one went red nine times).
            #
            # BOTH BRANCHES ARE REAL ASSERTIONS (§113.8): a build that makes one
            # of these sticky again is measured for the slot exactly as before,
            # so nothing is passed over by never being asked.
            pos = pg.evaluate("""()=>{const th=document.querySelector('.setuppane table thead th');
              return th ? getComputedStyle(th).position : null;}""")
            if pos == "static":
                ck("%d %s: the table's head does not pin, so there is no slot" % (w, k),
                   g is None, g)
            else:
                ck("%d %s: no slot between the two pinned heads (%s)" % (w, k, g),
                   g is not None and g <= 1, g if g is not None else "never pinned")
    pg.set_viewport_size({"width": 1560, "height": 700})

    # AND ONE FINE-GRAINED SWEEP, because "no gap" is the cause and "nothing is
    # visible" is what Islam actually saw — one page, every 4px, so a build that
    # closed the gap by some other means still has to show nothing.
    go(pg, "focusset")
    worst, where = 0, ""
    for y in range(0, 700, 4):
        pg.evaluate("(y)=>scrollTo(0,y)", y)
        v = pg.evaluate("""()=>{const h=document.querySelector('.setuphead');
          const th=document.querySelector('.setuppane table thead th');
          const hb=h.getBoundingClientRect().bottom;
          const tb=th.getBoundingClientRect().top;
          let show=0, who='';
          document.querySelectorAll('.setuppane table tbody tr').forEach(r=>{
            const c=r.firstElementChild; if(!c) return;
            const b=c.getBoundingClientRect();
            const vis=Math.min(b.bottom,tb)-Math.max(b.top,hb);
            if(vis>show){show=vis; who=(c.textContent||'').trim().slice(0,24);}});
          return {show:Math.round(show), who:who};}""")
        if v and v["show"] > worst:
            worst, where = v["show"], "%s at y=%d" % (v["who"], y)
    ck("and nothing is ever visible between them (%dpx)" % worst, worst <= 1, where)
    pg.evaluate("()=>scrollTo(0,0)")
    pg.set_viewport_size({"width": 1560, "height": 900})

    # THE OFFSET IS PUBLISHED FROM THE REAL HEIGHT, asserted as the
    # RELATIONSHIP (§53.5) so a header that legitimately changes height stays
    # green and a literal creeping back does not.
    for k in ("focusset", "units"):
        go(pg, k)
        m = pg.evaluate("""()=>{const h=document.querySelector('.setuphead');
          return {h:Math.round(h.getBoundingClientRect().height),
                  v:getComputedStyle(document.documentElement)
                      .getPropertyValue('--sethead-h').trim()};}""")
        ck("%s: --sethead-h is the header's own height (%s vs %dpx)" % (k, m["v"], m["h"]),
           m["v"] == str(m["h"]) + "px", m)

    print("\n" + ("errors: " + str(errs[:4]) if errs else "no console errors"))
    if errs:
        bad += 1
    b.close()

print("\n" + ("setup-header: all assertions passed" if not bad else "%d FAILED" % bad))
raise SystemExit(1 if bad else 0)
