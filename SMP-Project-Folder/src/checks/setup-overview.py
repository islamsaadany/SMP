"""Setup · Overview: it agrees with the pages it summarises (§108.10).

THE ONE FAULT A SUMMARY PAGE CAN HAVE IS BEING WRONG, and it is the one fault
that is invisible from the page itself: every number here is also printed
somewhere else, so a drift shows up as two screens disagreeing about the same
tenant with nothing to say which is right. So almost nothing below asserts a
NUMBER. It asserts that the Overview's number EQUALS the answer the source
function gives — the discipline §53.5 set for the unit/function pair, applied
to a page whose whole job is to restate other pages.

AND IT MAKES THE STATE IT MEASURES. The demo tenant has every custodian filled
and no open claims, so on the shipped data this page correctly shows its quiet
state and every attention row is unexercised — §45.2's trap, and §94.2's:
a check that only looks at what is drawn cannot see a row that should have been
drawn and was not. So the sweep seeds the faults, asserts the exact rows that
appear, and puts the tenant back.

WHAT IT CANNOT SEE FROM file://, AND SAYS SO. Three of the five rows depend on
a server fact (the inbox queue, password states, declarations). Over file://
they are correctly ABSENT, and this file asserts that they are absent rather
than zero — the distinction §93 was written about. Their live behaviour belongs
to an HTTP check the way the chat's does (§94.11, §97.9); it is named in the
output rather than silently skipped, so nobody reads this run as covering them.

Run: SMP_CHROME=... python3 qa-run.py checks/setup-overview.py
"""
import pathlib, sys
from playwright.sync_api import sync_playwright

URL = "file://" + str(pathlib.Path(
    pathlib.Path(__file__).resolve().parent.parent,
    "strategy-management-platform.html").resolve())

fails, errs = [], []


def ck(name, ok, extra=""):
    print(("  ok   " if ok else "  FAIL ") + name + ((" — " + str(extra)) if extra else ""))
    if not ok:
        fails.append(name)


def open_setup(pg, who="smo"):
    pg.select_option("#asWho", who)
    pg.wait_for_timeout(300)
    pg.query_selector('[data-md="setup"]').click()
    pg.wait_for_timeout(500)


with sync_playwright() as p:
    b = p.chromium.launch()
    pg = b.new_page(viewport={"width": 1600, "height": 1000})
    pg.on("pageerror", lambda e: errs.append("PAGEERROR: " + str(e)))
    pg.on("console", lambda m: errs.append(m.text) if m.type == "error" else None)
    pg.goto(URL)
    pg.wait_for_timeout(800)
    open_setup(pg)

    print("\n── 1 · the gear lands here, and only for the office ──")
    ck("the SMO lands on Overview",
       pg.eval_on_selector(".setuprail .ritem.on .rilab", "e=>e.textContent.trim()") == "Overview")
    ck("Overview is first in the rail",
       pg.eval_on_selector(".setuprail [data-setupgo]", "e=>e.dataset.setupgo") == "overview")

    print("\n── 2 · the cycle strip equals cycleTotals() ──")
    # THE SOURCE IS ASKED IN THE PAGE, not restated here: a literal 163 in this
    # file would pass for ever and mean nothing the day the demo data moves.
    src = pg.evaluate("()=>{const t=cycleTotals();"
                      "return {done:t.done,total:t.total,sub:t.sub,none:t.none,prog:t.progress,units:t.units};}")
    # §198: THE STRIP IS NOW A COLUMN. The numbers and their source are
    # unchanged; only where they are drawn moved, so the assertion follows the
    # markup and goes on asking the same question (§94.8: assert the problem).
    # §198: THE ROWS ARE READ AS LABEL AND VALUE, never as one blob. The first
    # attempt matched "Submitted 6" against the summary's textContent, which
    # has no space between the label span and its value — the numbers were
    # right and the CHECK was wrong (§130.7's family: measure the thing, not a
    # rendering of it).
    side = pg.evaluate("""()=>{
      const o = {};
      document.querySelectorAll('.ovside .ovsline').forEach(r=>{
        const k = r.querySelector('span'), v = r.querySelector('b');
        if (k && v) o[k.textContent.trim()] = v.textContent.trim(); });
      return o; }""")
    ck("done/total agree with cycleTotals()",
       side.get("Reported") == "%d of %d" % (src["done"], src["total"]), (src, side))
    ck("submitted agrees", side.get("Submitted") == str(src["sub"]), (src["sub"], side))
    ck("in progress agrees", side.get("In progress") == str(src["prog"]), (src["prog"], side))
    ck("not started agrees, and is drawn only when there is one",
       (side.get("Not started") == str(src["none"])) if src["none"]
       else ("Not started" not in side), (src["none"], side))
    # DERIVED, NOT COUNTED — and the denominator is units AND the supporting
    # functions main's §105 put on this board. This assertion read
    # `activeKeys().length` while it was units-only, which the merge made
    # false: the CHECK carried the old assumption, not the product (§108.16).
    ck("in progress is the remainder, not a third count",
       src["prog"] == src["units"] - src["sub"] - src["none"], src)
    # §244 WIDENED THE UNIT HALF and this assertion carried the old formula —
    # the second time this line has held a stale copy of the board's own
    # membership (the comment above records the first). It asks the PRODUCT
    # which subjects are on the board now, rather than rebuilding the answer
    # from a list of parts that keeps changing.
    ck("and the board counts every subject on it, functions of both shapes too",
       src["units"] == pg.evaluate("boardUnitTargets().length + boardFunctionKeys().length")
       and src["units"] > pg.evaluate("activeKeys().length"), src)
    # §245 moved those rows to the function list; the ASSERTION is unchanged in
    # substance — a function that plans in pillars is counted — and asks the
    # product where it lives rather than naming a half (§94.8).
    ck("...including a function that plans in pillars, wherever the board lists it",
       pg.evaluate("boardUnitTargets().concat(boardFunctionTargets())"
                   ".filter(t=>{const k=fnKeyOfTarget(t);"
                   "return k && fnPlansInPillars(FUNCTIONS[k]||{});}).length") > 0)
    ck("the strip is a way through, not a control",
       pg.eval_on_selector(".ovcyc-go", "e=>e.dataset.setupgo") == "cycle")

    print("\n── 3 · with the demo as shipped, it says so rather than showing nothing ──")
    # A NULL IS NOT A ZERO (§93, §108.10), AND IT IS NOT A FACT ABOUT THE
    # PROTOCOL EITHER (spec 043). Over `file://` three of these sources cannot
    # be asked at all, so the shipped demo has nothing waiting and the page
    # must say so; served, the password state IS asked and answers honestly —
    # a dev tenant mints four logins, so thirty people on the register have
    # never been issued one, which is a real row and the point of the row.
    # The RULE is what is asserted on both stacks (§218, §316.4's own shape):
    # a source that could not be asked draws no row and no zero; one that was
    # asked draws a row that agrees with it.
    clean = pg.evaluate("""()=>{
      const q = document.querySelector('.ovquiet');
      const list = document.querySelector('.ovlist');
      return { pw: noPasswordCount(), said: saidWhereCount(),
               rows: [...document.querySelectorAll('.ovrow')]
                       .map(x => ({ k: x.dataset.setupgo, t: x.textContent.trim() })),
               quiet: !!q,
               zero: /\\b0 /.test(list ? list.textContent : "") };}""")
    asked = [c for c in (clean["pw"], clean["said"]) if c not in (None, 0)]
    if not asked:
        ck("no attention rows on the clean tenant", len(clean["rows"]) == 0, clean["rows"])
        ck("and the page SAYS nothing is waiting", clean["quiet"], clean)
    else:
        ck("the only rows are the ones a source actually answered",
           len(clean["rows"]) == len(asked), clean["rows"])
        ck("...and the count on the row is that source's own",
           all(str(n) in " ".join(r["t"] for r in clean["rows"]) for n in asked), clean)
        ck("...so the page does not also say nothing is waiting", not clean["quiet"], clean)
    ck("an unasked count draws no row and no zero", not clean["zero"], clean)

    print("\n── 4 · seed the faults: every row appears, and agrees with its source ──")
    # MADE, NOT WAITED FOR. Two units lose their custodian and one open claim is
    # raised — the two sources that live in the state graph and can be exercised
    # without a server.
    pg.evaluate("""()=>{
      window.__ovkeep = {roles: JSON.stringify(UNIT_ROLES), claims: JSON.stringify(GROUP.claims||[])};
      const ks = activeKeys().slice(0,2);
      ks.forEach(k=>{ UNIT_ROLES[k] = UNIT_ROLES[k]||{}; UNIT_ROLES[k].custodian = null; });
      GROUP.claims = [{id:"cl-test", state:"open", figure:"f1", set:"s1", by:"smo"}];
      paint();}""")
    pg.wait_for_timeout(400)
    rows = pg.eval_on_selector_all(".ovrow",
                                   "e=>e.map(x=>({k:x.dataset.setupgo,t:x.textContent.trim()}))")
    # THE TWO SEEDED ROWS, BESIDE WHATEVER WAS ALREADY WAITING. Asserting the
    # LIST's length made the check's subject the whole page rather than the two
    # rows it seeds, which is only the same thing on a stack where nothing else
    # can answer (§113.8).
    ck("both seeded rows are drawn",
       len([r for r in rows if r["k"] == "cycle"]) == 1 and
       len(rows) == 2 + len(asked), [r["t"] for r in rows])
    src2 = pg.evaluate("()=>({cust:unitsWithoutCustodian().length, claims:openClaimsList().length})")
    txt = " | ".join(r["t"] for r in rows)
    ck("the custodian row agrees with unitsWithoutCustodian()",
       ("%d units with no custodian" % src2["cust"]) in txt, "%s in %s" % (src2["cust"], txt))
    ck("the claim row agrees with openClaimsList()",
       ("%d claim request" % src2["claims"]) in txt, "%s in %s" % (src2["claims"], txt))
    ck("the quiet panel is gone while something waits",
       pg.eval_on_selector_all(".ovquiet", "e=>e.length") == 0)
    ck("each row goes to the page that FIXES it",
       sorted(set(r["k"] for r in rows)) == ["cycle", "people"],
       sorted(r["k"] for r in rows))
    # The destination's name comes off the rail's own list, so a rename follows.
    ck("the row names its destination as the rail names it",
       "People register" in txt and "Reporting cycle" in txt, txt)

    print("\n── 4b · the rail's pills are the same counts (§108.15) ──")
    # THE AGREEMENT AGAIN, one surface further out. The pill is not allowed to
    # be its own arithmetic: it is the Overview's own rows summed by
    # destination, so a rail badge can never disagree with the page it points
    # at — which is the one place nobody would ever catch it.
    # READ IN ONE BREATH, because §93 DROPS the password cache on every save
    # and the next paint asks again: two evaluates either side of that gap
    # compare a pill drawn before it with a map computed after it, and report a
    # product that agrees with itself as a product that does not.
    # AND THE PILL IS READ FROM A FRESH PAINT. The rail's number is
    # `attentionByPage()` computed AT PAINT TIME (shell.html's `ATT`), and §93
    # drops the password cache on every save — re-asked only when the register
    # is drawn — so after the write above the rail carries the number it was
    # painted with while a call answers a smaller one. They are one arithmetic,
    # which is §108.15's rule; comparing across a paint measures the gap.
    # OBSERVED AND RECORDED (§316.5): a save on the Overview leaves the rail's
    # pill one paint stale, and any navigation puts it right.
    pg.evaluate("()=>paint()")
    pg.wait_for_timeout(300)
    both = pg.evaluate("""()=>({
      pills: [...document.querySelectorAll('.setuprail .ritem')].map(x=>({
        k: x.dataset.setupgo,
        n: (x.querySelector('.riwait') || {}).textContent || null })),
      byPage: attentionByPage() })""")
    pills, byp = both["pills"], both["byPage"]
    drawn = dict((r["k"], r["n"]) for r in pills if r["n"])
    ck("every pill equals attentionByPage()",
       drawn == dict((k, str(v)) for k, v in byp.items() if v), (drawn, byp))
    ck("the People register's pill is the SUM of its Overview rows",
       byp.get("people") == sum(r["n"] for r in
                                pg.evaluate("attentionRows()") if r["dest"] == "people"),
       byp)
    # NEVER A ZERO: every page with nothing waiting must carry no pill at all.
    quiet = [r["k"] for r in pills if not r["n"]]
    ck("a page with nothing waiting carries no pill",
       all(not byp.get(k) for k in quiet), [k for k in quiet if byp.get(k)])
    ck("and no pill anywhere reads 0",
       "0" not in [r["n"] for r in pills if r["n"]], pills)

    # A FOLDED group speaks for its rows; an open one does not repeat them.
    open_gw = pg.eval_on_selector_all(".setuprail .rgroup:not(.shut) .rgwait",
                                      "e=>e.filter(x=>!x.hidden).length")
    ck("an open group does not repeat its rows' pills", open_gw == 0, open_gw)
    pg.evaluate("""()=>{const h=document.querySelector('.rgroup[data-railgrp=\"who\"]');
                   if(h && !h.classList.contains('shut')) h.click();}""")
    pg.wait_for_timeout(300)
    gw = pg.eval_on_selector('.rgroup[data-railgrp="who"] .rgwait',
                             "e=>e.textContent.trim()")
    ck("a folded group carries the sum of what is behind it",
       gw == str(byp.get("people", 0)), (gw, byp))
    pg.evaluate("""()=>{const h=document.querySelector('.rgroup[data-railgrp=\"who\"]');
                   if(h && h.classList.contains('shut')) h.click();}""")
    pg.wait_for_timeout(250)

    print("\n── 5 · a row is a door ──")
    pg.query_selector('.ovrow[data-setupgo="people"]').click()
    pg.wait_for_timeout(500)
    ck("pressing the custodian row opens the People register",
       pg.eval_on_selector(".setuprail .ritem.on .rilab", "e=>e.textContent.trim()") == "People register")

    print("\n── 6 · one gap closes, one row goes ──")
    pg.evaluate("""()=>{ GROUP.claims=[]; currentSub='overview'; paint(); }""")
    pg.wait_for_timeout(400)
    left = pg.eval_on_selector_all(".ovrow", "e=>e.map(x=>x.dataset.setupgo)")
    ck("the answered claim's row is gone, the custodian row stays",
       left == ["people"] * (1 + len(asked)), left)

    # PUT THE TENANT BACK, or every later block in a combined run measures a
    # tenant this one broke (§51.11's cousin: a check that leaves state behind).
    pg.evaluate("""()=>{
      const k = window.__ovkeep;
      Object.assign(UNIT_ROLES, JSON.parse(k.roles));
      GROUP.claims = JSON.parse(k.claims);
      currentSub='overview'; paint();}""")
    pg.wait_for_timeout(300)
    # PUT BACK MEANS "what it was", not "empty" — on a served tenant the
    # password row was there before this file touched anything.
    ck("the tenant is put back",
       pg.eval_on_selector_all(".ovrow", "e=>e.length") == len(asked),
       pg.eval_on_selector_all(".ovrow", "e=>e.map(x=>x.textContent.trim())"))

    print("\n── 6b · a cycle with no dates SAYS so (§120.1) ──")
    # Islam's own screenshot: a client tenant whose cycle carries no dates read
    # "to  ·  due  ·  as of Q4" — three separators and nothing between them.
    # ASSERTED ON BOTH SURFACES, because the sentence is built once and the
    # whole point is that the Overview and the Reporting cycle cannot drift
    # apart about it (§53.5).
    full = pg.evaluate("""()=>{REVIEW.from='Jan 2026';REVIEW.to='Jun 2026';
      REVIEW.due='15 Jul 2026';REVIEW.endsQuarter=2;currentSub='overview';paint();
      return document.querySelector('.ovsmeta').textContent.trim();}""")
    # §239: THE SENTENCE NO LONGER CARRIES THE REVIEW POINT. It used to end
    # "as of Q" + endsQuarter -- the words of one field over the value of
    # another -- and the review point is now a control on the cycle strip, so
    # printing it here as well would say one thing twice and let the two
    # disagree the moment one is edited.
    ck("with dates, it reads as a span", full == "Jan 2026 to Jun 2026 \u00b7 due 15 Jul 2026", full)
    bare = pg.evaluate("""()=>{REVIEW.from='';REVIEW.to='';REVIEW.due='';
      REVIEW.endsQuarter=4;paint();
      return document.querySelector('.ovsmeta').textContent.trim();}""")
    ck("with none, it says the dates are not set", bare == "Dates not set", bare)
    ck("and never prints a bare separator",
       " \u00b7  \u00b7 " not in bare and not bare.startswith("\u00b7"), bare)
    onCycle = pg.evaluate("""()=>{currentSub='cycle';paint();
      return document.querySelector('.fstrip-meta:not(.asof)').textContent.trim();}""")
    ck("the Reporting cycle page says exactly the same", onCycle == bare, (bare, onCycle))
    # ONE END IS NOT A SPAN: "Jan 2026 to" is worse than saying nothing.
    half = pg.evaluate("""()=>{REVIEW.from='Jan 2026';REVIEW.to='';REVIEW.due='';
      currentSub='overview';paint();
      return document.querySelector('.ovsmeta').textContent.trim();}""")
    ck("one end alone is reported on its own terms", half == "from Jan 2026", half)
    pg.evaluate("""()=>{REVIEW.from='Jan 2026';REVIEW.to='Jun 2026';
      REVIEW.due='15 Jul 2026';REVIEW.endsQuarter=2;paint();}""")
    pg.wait_for_timeout(200)

    print("\n── 6c · two columns, and the queue leads when they stack (§198) ──")
    # §120.4's assertion is RETIRED WITH THE THING IT GUARDED: the way through
    # used to share a wrapping row and drop to the left of a second line, and
    # there is no such row any more. What replaces it is the property Option B
    # is actually about — the width is used, and when it runs out the QUEUE is
    # the half that stays first (§94.8: assert the problem, not the layout).
    for w in [1920, 1600, 1400, 1280, 1150, 1024, 900, 820]:
        pg.set_viewport_size({"width": w, "height": 1000})
        pg.wait_for_timeout(280)
        r = pg.evaluate("""()=>{const m=document.querySelector('.ovmain');
          const s=document.querySelector('.ovside');
          if(!m||!s) return null;
          const mb=m.getBoundingClientRect(), sb=s.getBoundingClientRect();
          return { side:Math.round(sb.x), main:Math.round(mb.x),
                   mainY:Math.round(mb.y), sideY:Math.round(sb.y),
                   beside: Math.abs(mb.y-sb.y) < 3,
                   scrolls: document.documentElement.scrollWidth > window.innerWidth + 1 };}""")
        ck("at %dpx nothing scrolls sideways" % w, r and not r["scrolls"], r)
        if w >= 950:
            ck("at %dpx the cycle sits BESIDE the queue" % w, r["beside"] and r["side"] > r["main"], r)
        else:
            ck("at %dpx they stack, queue first" % w,
               not r["beside"] and r["sideY"] > r["mainY"], r)
    pg.set_viewport_size({"width": 1600, "height": 1000})
    pg.wait_for_timeout(300)

    print("\n── 7 · somebody who is not the office ──")
    # The page is about the office's queue, so it is not offered to anybody
    # else — and their gear must still land somewhere real.
    pg.goto(URL)
    pg.wait_for_timeout(800)
    who = pg.eval_on_selector_all("#asWho option", "e=>e.map(x=>x.value)")
    other = [w for w in who if w not in ("smo",)]
    landed = None
    for w in other:
        pg.select_option("#asWho", w)
        pg.wait_for_timeout(250)
        btn = pg.query_selector('[data-md="setup"]')
        if not btn or not btn.is_visible():
            continue
        btn.click()
        pg.wait_for_timeout(400)
        office = pg.evaluate("inOffice()")
        has = pg.eval_on_selector_all('.setuprail [data-setupgo="overview"]', "e=>e.length")
        if not office:
            landed = (w, pg.eval_on_selector(".setuprail .ritem.on .rilab", "e=>e.textContent.trim()"), has)
            break
    if landed:
        ck("a non-office viewer is not offered Overview", landed[2] == 0, landed)
        ck("and their gear still lands on a real page", bool(landed[1]), landed)
        # §69'S DOT: a count somebody cannot clear is a screen nagging them.
        ck("and they are shown no attention pills at all",
           pg.eval_on_selector_all(".setuprail .riwait, .setuprail .rgwait",
                                   "e=>e.length") == 0)
    else:
        ck("a non-office viewer reached Setup at all", False,
           "nobody outside the office could open Setup — assertion not exercised")

    b.close()

print("\nNOT COVERED HERE (needs a server, §94.11): the inbox-queue, password and "
      "declaration rows — asserted absent over file://, never asserted present.")
print("console errors:", errs or "none")
if fails:
    print("\nFAILED: %d" % len(fails))
    for f in fails:
        print("  - " + f)
    sys.exit(1)
print("\nsetup-overview: all assertions passed")
