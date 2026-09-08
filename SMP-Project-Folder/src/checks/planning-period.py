"""THE PLANNING PERIOD, AND THE REVIEW CYCLE INSIDE IT (§308).

Islam, from his own tenant with `Covers from` empty and the strip reading
*"reported as of Aug 2026 · 8 of 12 months"*: **"how is it reading 8 or 12
months while I didn't add the covers from?"** — and then, when the two
readings were put to him, the model itself: *"the cycle of planning is yearly
so that's the full time start and end dates. and then we have a review cycle
that has a cycle start and end ... sometimes we start planning mid year. the
main planning cycle is not a year maybe 6 month but the review cycle might
have the same start date but will have a closer end date."*

WHAT IS ASSERTED, AND WHY IT IS THE PROBLEM RATHER THAN THE LAYOUT (§94.8):

  1 · THE BLOCK IS FIRST IN THE PEN and holds two pickers and a status. First
      because it is the frame the cycle sits inside — a strip reading "2 of 6
      months of the plan" is answered above the block that sets the cycle, not
      below it — and asserted as a POSITION among the pen's blocks rather than
      as a pixel.

  2 · "NOT SET" IS NOT AN ALARM, AND `Missing` STILL IS. Both ends in one
      breath (§94.2): the period's two buttons read a quiet "Not set" while
      the cycle's own dates go on reading "Missing" in the alarm ink — a build
      that quietened every month picker in the product would satisfy the first
      half and lose §177's red word everywhere.

  3 · NOTHING MOVES UNTIL A PERIOD IS SET. With none, the share is the month
      of the calendar year over twelve — the expression this file replaces,
      asserted as AGREEMENT with `monthOfYear()/12` rather than as a number,
      so a deliberate change to both stays green (§53.5) — and the strip NAMES
      the assumption instead of printing it as a fact (§35, §124).

  4 · THE PERIOD IS PICKED AND IT REACHES THE GROUP. Driven through the real
      popup, read back off `GROUP` and never off the screen, which is what an
      editor wired to nothing also shows (§96) — and the strip and the status
      chip are asserted to have FOLLOWED, because a value that stores and does
      not repaint is a control nobody can tell has worked (§257.2a).

  5 · THE ARITHMETIC IS THE PLAN'S. A real Sum measure is asserted against the
      RULE — target × elapsed ÷ the plan's own length — never against a
      literal, and the same row is asserted to move when the period does.

  6 · THE MONTHLY PLAN IS STILL READ BY THE MONTH OF THE YEAR. Twelve boxes
      labelled Jan to Dec, so a plan running July to December still compiles
      its August cell as the eighth — asking the plan's elapsed count there
      would sum January and February instead. The state is MADE, because no
      row in the worked example carries a monthly plan (§255).

  7 · THE EDGES, both of which the old arithmetic could not reach: a review
      point BEFORE the plan starts owes nothing and is NOT SCORED (never a
      division by nought), and an end before its start is a contradiction
      somebody typed rather than a length to divide by, so it falls back.

  8 · AND CLEARING IT LEAVES NOTHING BEHIND. The keys are DELETED, not
      emptied (§50.6), and every reading is asserted back to what it was
      before the period was ever set — a tenant that took one back must be
      byte-identical to one that never set one.

Every probe degrades rather than throwing (§215): a check that dies at the
first absence reports a fraction of what it knows, on precisely the build it
exists to measure.
"""
import os
from playwright.sync_api import sync_playwright

HERE = os.path.dirname(os.path.abspath(__file__))
BUILT = os.environ.get("SMP_BUILT") or os.path.join(
    os.path.dirname(HERE), "strategy-management-platform.html")
URL = "file://" + BUILT
fails = []


def ok(what, cond, got=None):
    if cond:
        print("  ok   " + what)
    else:
        fails.append(what)
        print("  FAIL " + what + ("" if got is None else "   got: " + repr(got)))


def js(pg, fn, *a):
    try:
        return pg.evaluate(fn, *a)
    except Exception as e:                       # §215
        return {"__err": str(e)[:120]}


def pick(pg, sel_all, idx, word):
    """A MONTH IS PRESSED, NEVER ASSIGNED. A picker that writes nothing renders
    exactly like one that works (§96)."""
    btns = pg.query_selector_all(sel_all)
    if len(btns) <= idx:
        return False
    btns[idx].click(); pg.wait_for_timeout(260)
    got = js(pg, """(w) => {
      const b = [...document.querySelectorAll(".monthpop [data-mpick]")]
        .find(x => x.textContent.trim() === w);
      if (!b) return false;
      b.click(); return true;
    }""", word)
    pg.wait_for_timeout(340)
    return got is True


def strip(pg):
    return js(pg, """()=>{const e=document.querySelector('.fstrip-meta.asof');
                          return e ? e.textContent.replace(/\\s+/g,' ').trim() : null;}""")


def nums(pg):
    return js(pg, """()=>({set:planSet(), len:planLength(), months:elapsedMonths(),
                           moy:monthOfYear(), share:elapsedShare(),
                           from:GROUP[SMPRules.PLAN_FROM]||null,
                           to:GROUP[SMPRules.PLAN_TO]||null,
                           keys:Object.keys(GROUP).filter(k=>k.indexOf('plan')===0)})""")


def run(pg):
    errs = []
    pg.on("pageerror", lambda e: errs.append(str(e)))
    pg.add_init_script("try{localStorage.setItem('smp.welcome.seen','1')}catch(e){}")
    pg.goto(URL); pg.wait_for_timeout(1400)
    js(pg, "() => { current='setup'; currentSub='cycle'; paint(); }")
    pg.wait_for_timeout(400)

    # ── 3 · nothing moves until a period is set ──────────────────────
    print("\n── 3 · with no period, the year is used AND the line says so ──")
    n0 = nums(pg)
    ok("no planning period is stored on the worked example",
       n0.get("keys") == [] and n0.get("set") is False, n0)
    ok("the length is twelve", n0.get("len") == 12, n0)
    ok("and the share IS the old expression — the month of the year over twelve",
       n0.get("months") == n0.get("moy") and n0.get("share") == (n0.get("moy") or 0) / 12.0, n0)
    s0 = strip(pg)
    ok("the strip names the assumption rather than printing it as a fact",
       isinstance(s0, str) and "calendar year" in s0, s0)
    ok("...and does not claim the number is the plan's",
       isinstance(s0, str) and "of the plan" not in s0, s0)

    # ── 1 · the block is first in the pen ────────────────────────────
    print("\n── 1 · the block, first in the pen ──")
    btn = pg.query_selector("[data-editcycle]")
    if btn:
        btn.click(); pg.wait_for_timeout(420)
    shape = js(pg, """()=>{
      const pen = document.querySelector('.newcycle');
      if (!pen) return {none:true};
      const blocks = [...pen.children].map(c => (c.querySelector('.nc-h')||{}).textContent || '');
      const per = pen.querySelector('.planper');
      return { blocks: blocks,
               firstIsPeriod: !!per && pen.firstElementChild === per,
               picks: per ? per.querySelectorAll('.monthbtn').length : 0,
               labels: per ? [...per.querySelectorAll('label span')].map(e=>e.textContent) : [],
               status: per ? (per.querySelector('.nc-unit')||{}).textContent : null };
    }""")
    ok("the pen opens", shape.get("none") is not True, shape)
    ok("the planning period is the FIRST block in it", shape.get("firstIsPeriod") is True, shape)
    ok("...and the cycle's own block is still there under it",
       any("This cycle" in (b or "") for b in (shape.get("blocks") or [])), shape.get("blocks"))
    ok("it holds two month pickers", shape.get("picks") == 2, shape)
    ok("named for the two ends of a period",
       [l for l in (shape.get("labels") or []) if l in ("Plan starts", "and ends")]
       == ["Plan starts", "and ends"], shape.get("labels"))
    ok("and a status saying what is being used instead",
       "not set" in (shape.get("status") or "").lower(), shape.get("status"))

    # ── 2 · "Not set" is not an alarm, and "Missing" still is ────────
    print("\n── 2 · quiet here, and the alarm word kept where it is owed ──")
    words = js(pg, """()=>{
      const w = el => el ? [...el.querySelectorAll('.mval')].map(
        s => [s.textContent.trim(), s.classList.contains('mnone')]) : null;
      return { period: w(document.querySelector('.planper')),
               cycle: w(document.querySelector('.cyc2-f .nc-grid')) };
    }""")
    per = words.get("period") or []
    ok("the period's empty ends read a quiet 'Not set'",
       len(per) == 2 and all(t == "Not set" and not alarm for t, alarm in per), per)
    cyc = words.get("cycle") or []
    ok("...and a cycle date the platform NEEDS still wears the alarm word",
       any(t == "Missing" and alarm for t, alarm in cyc)
       or all(t != "Not set" for t, alarm in cyc), cyc)

    # ── 4 · picked, and it reaches the group ─────────────────────────
    print("\n── 4 · the period is picked, and it reaches the group ──")
    ok("the start is picked", pick(pg, ".planper .monthbtn", 0, "Jul"))
    half = nums(pg)
    ok("half a period is not a period", half.get("set") is False and half.get("len") == 12, half)
    ok("the end is picked", pick(pg, ".planper .monthbtn", 1, "Dec"))
    n1 = nums(pg)
    ok("both ends reach GROUP, four digits and all",
       n1.get("from") == "Jul 2026" and n1.get("to") == "Dec 2026", n1)
    ok("the plan is six months long", n1.get("set") is True and n1.get("len") == 6, n1)
    st = js(pg, "()=>{const e=document.querySelector('.planper .nc-unit'); return e?e.textContent:null;}")
    ok("the status followed the press", "6 months" in (st or ""), st)
    s1 = strip(pg)
    ok("the strip followed it too, and says it is the plan's",
       isinstance(s1, str) and "of 6 months of the plan" in s1, s1)
    ok("...and has stopped naming the calendar year",
       isinstance(s1, str) and "calendar year" not in s1, s1)

    # ── 5 · the arithmetic is the plan's ─────────────────────────────
    print("\n── 5 · a real measure, against the rule and never a literal ──")
    js(pg, "()=>{ REVIEW.to='Aug 2026'; paint(); }"); pg.wait_for_timeout(320)
    row = js(pg, """()=>{
      let hit=null;
      Object.keys(UNITS).forEach(k=>(UNITS[k].items||[]).forEach(p=>(p.measures||[]).forEach(m=>{
        if(!hit && (m.compile||'').toLowerCase()==='sum' && m.target &&
           SMPRules.targetHasNumber(m.target)) hit=m; })));
      if(!hit) return {none:true};
      const t = parseFloat(String(hit.target).replace(/[^0-9.]/g,''));
      return { target:t, due:measureDue(hit), want:t*elapsedShare(),
               months:elapsedMonths(), len:planLength(), moy:monthOfYear() };
    }""")
    ok("a Sum measure to measure with", row.get("none") is not True, row)
    ok("two of six months have passed at August",
       row.get("months") == 2 and row.get("len") == 6, row)
    ok("the month of the YEAR is still eight", row.get("moy") == 8, row)
    ok("and the target is prorated by the plan, not by the year",
       row.get("due") is not None and abs(row["due"] - row["want"]) < 1e-9, row)

    # ── 6 · the monthly plan still reads Jan to Dec ──────────────────
    print("\n── 6 · a monthly plan is compiled by the month of the year ──")
    mp = js(pg, """()=>{
      let hit=null, uk=null, pi=null, mi=null;
      Object.keys(UNITS).forEach(k=>(UNITS[k].items||[]).forEach((p,i)=>(p.measures||[]).forEach((m,j)=>{
        if(!hit && (m.compile||'').toLowerCase()==='sum'){ hit=m; uk=k; pi=i; mi=j; } })));
      if(!hit) return {none:true};
      /* THE KEY IS THE PRODUCT'S, read out of `SMPRules.monthlyPlan` rather
         than guessed: the first draft of this probe wrote `extra.monthly`,
         the plan was never found, the row fell down the flat path and the
         check reported a CORRECT build broken (§215's family — a fixture that
         models the wrong shape measures nothing). */
      const keep = {t:hit.target, m:hit.monthly};
      hit.monthly = [1,1,1,1,1,1,1,1,1,1,1,1];   /* one a month */
      hit.target = "12";
      const plan = SMPRules.monthlyPlan(hit);
      const due = measureDue(hit);
      hit.target = keep.t; if (keep.m) hit.monthly = keep.m; else delete hit.monthly;
      return { due: due, moy: monthOfYear(), months: elapsedMonths(),
               planRead: !!plan };
    }""")
    if mp.get("none") is True or "__err" in mp:
        ok("a row to hang a monthly plan on", False, mp)
    else:
        ok("the monthly plan is read at all", mp.get("planRead") is True, mp)
        ok("twelve monthly cells of one compile to the MONTH OF THE YEAR",
           mp.get("due") == mp.get("moy") == 8, mp)
        ok("...and not to the months of the plan, which is two here",
           mp.get("due") != mp.get("months"), mp)

    # ── 7 · the edges ────────────────────────────────────────────────
    print("\n── 7 · before it starts, and an end before its start ──")
    edge = js(pg, """()=>{
      const keep = REVIEW.to;
      REVIEW.to = "Feb 2026";                       /* before the plan begins */
      let hit=null;
      Object.keys(UNITS).forEach(k=>(UNITS[k].items||[]).forEach(p=>(p.measures||[]).forEach(m=>{
        if(!hit && (m.compile||'').toLowerCase()==='sum' && m.target &&
           SMPRules.targetHasNumber(m.target)) hit=m; })));
      const early = { months: elapsedMonths(), share: elapsedShare(),
                      due: measureDue(hit), score: measureScore(hit) };
      REVIEW.to = keep;
      const kf = GROUP[SMPRules.PLAN_FROM], kt = GROUP[SMPRules.PLAN_TO];
      GROUP[SMPRules.PLAN_TO] = "Mar 2026";         /* ends before it starts */
      const back = { set: planSet(), len: planLength(), months: elapsedMonths() };
      GROUP[SMPRules.PLAN_FROM] = kf; GROUP[SMPRules.PLAN_TO] = kt;
      paint();
      return { early: early, back: back, moy: monthOfYear() };
    }""")
    e = edge.get("early") or {}
    ok("a review point before the plan starts owes nothing",
       e.get("months") == 0 and e.get("share") == 0, e)
    ok("...and is NOT SCORED rather than divided by nought",
       e.get("score") is None, e)
    b = edge.get("back") or {}
    ok("an end before its start is not a period", b.get("set") is False, b)
    ok("...so it falls back to the year rather than a negative length",
       b.get("len") == 12 and b.get("months") == edge.get("moy"), edge)

    # ── 8 · and clearing it leaves nothing behind ────────────────────
    print("\n── 8 · cleared, and back to what it was ──")
    js(pg, """()=>{ delete GROUP[SMPRules.PLAN_FROM]; delete GROUP[SMPRules.PLAN_TO];
                    REVIEW.to = 'Jun 2026'; paint(); }""")
    pg.wait_for_timeout(300)
    n2 = nums(pg)
    ok("the keys are DELETED, not emptied", n2.get("keys") == [], n2)
    ok("every reading is back to what it was before the period existed",
       n2.get("set") == n0.get("set") and n2.get("len") == n0.get("len")
       and n2.get("months") == n0.get("months") and n2.get("share") == n0.get("share"), [n0, n2])
    ok("and the strip is back to naming the calendar year",
       strip(pg) == s0, [s0, strip(pg)])

    ok("no page error anywhere in the run", not errs, errs[:2])


with sync_playwright() as p:
    b = p.chromium.launch()
    page = b.new_page(viewport={"width": 1500, "height": 1000})
    run(page)
    b.close()

print("\n" + ("PLANNING PERIOD: %d failure%s" % (len(fails), "" if len(fails) == 1 else "s")
              if fails else "all planning-period checks passed"))
