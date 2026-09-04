"""A supporting function's Performance controls sit where a unit's do (§272).

Islam: *"can you move the presntation button for the functions to be in the same
place like what we did in the units while having the bands button as well?"*

WHAT IT ASSERTS IS THE AGREEMENT, NEVER A COORDINATE (§94.8, §53.5). The whole
point of the change is that one page stopped being odd, so the assertion is that
the capability-format function's controls land on the same pixels, in the same
row, as a unit's — which stays true if somebody later moves BOTH deliberately,
and goes red the moment one of them moves alone. A check written against
`x == 1206` would have to be rewritten by every future gutter change and would
still not notice the two drifting apart.

AND BOTH ENDS, OR IT PASSES ON A BUILD THAT LOST THE FEATURE ENTIRELY (§94.2):
a build drawing NOTHING on either page agrees perfectly with itself. So the
controls are asserted PRESENT and named first, on both pages, before the two are
compared — and the page body is asserted EMPTY of them, because leaving the old
`.pageact` behind while adding the new one draws the menu twice and satisfies
every "it is on the tab row" assertion (§113.8).

THE MENU'S ENTRIES ARE ASSERTED AGAINST THE RULE, not against a list. §272 moves
a control; it must move nobody's rights, and the way to know that is to ask
`SMPRules.mayDownloadPlan()` of a viewer and compare it with what the menu draws
for that viewer (§42, §252.2). A literal list of four entries would go stale the
next time an entry is added and would never have proved the gate.

THE PILLARS HALF IS ASSERTED UNCHANGED IN THE SAME BREATH. A function that plans
in pillars is drawn by the unit's own page (spec 010) and has had this shape all
along — so it is the control case: a build that routed everything through the
unit's renderer would pass every assertion about the capability half while
having broken the product.

Run: SMP_CHROME=... python3 qa-run.py checks/fn-perf-controls.py
"""
import os, pathlib, json
from playwright.sync_api import sync_playwright

CHROME = os.environ.get("SMP_CHROME", "/opt/pw-browsers/chromium")
URL = "file://" + str(pathlib.Path("strategy-management-platform.html").resolve())

fails = []


def ck(name, cond, got=None):
    if cond:
        print("  ok   %s" % name)
    else:
        fails.append(name)
        print("  FAIL %s%s" % (name, "" if got is None else "  — %s" % (got,)))


# Where the page's controls are, and what they are. Degrades rather than throwing
# (§215): a build without one of these draws nothing and must still REPORT.
WHERE = """()=>{
  const acts = document.querySelector('#subtabs .tabacts');
  const panel = document.getElementById('panel');
  const box = e => { const r = e.getBoundingClientRect();
    return {x:Math.round(r.left), y:Math.round(r.top), w:Math.round(r.width)}; };
  const words = (root, sel) => root
    ? [...root.querySelectorAll(sel)].map(e => Object.assign(
        {word:(e.textContent||'').trim().split('\\n')[0].replace(/[\\u25be\\s]+$/,'')}, box(e)))
    : [];
  const menuOf = cls => {
    const d = acts ? acts.querySelector(cls) : null;
    return d ? [...d.querySelectorAll('.menu > *')].map(
      x => (x.textContent||'').trim().split('\\n')[0].trim()) : null;
  };
  return {
    tab: words(acts, 'summary'),
    body: words(panel, '.pageact summary, .pageact button'),
    bands: !!(acts && acts.querySelector('.bandsmenu')),
    present: !!(acts && acts.querySelector('.dlmenu:not(.bandsmenu)')),
    entries: menuOf('.dlmenu:not(.bandsmenu)'),
    bandRows: (() => { const d = acts ? acts.querySelector('.bandsmenu') : null;
      return d ? d.querySelectorAll('.bandslist > div').length : 0; })(),
    /* THE FIRST REAL CONTENT, never the first CHILD: before §272 the
       `.pageact` div WAS that child, so a first-child measurement reported
       the same y either way and the assertion below could not fail
       (§113.8, found by falsifying rather than by reading). A capability
       band on a function, the first score card on a unit — the thing the
       reader came for, whichever page this is. */
    contentY: (() => { const e = panel &&
        (panel.querySelector('.capline') || panel.querySelector('.scores'));
      return e ? Math.round(e.getBoundingClientRect().top) : null; })()
  };
}"""

GO = {
    "unit": "()=>{current='mobile'; currentSub='performance'; paint();}",
    "fn-cap": "()=>{const k=FUNCTION_KEYS.find(k=>!fnPlansInPillars(FUNCTIONS[k]));"
              "current='fn:'+k; currentSub='fnperf'; paint();}",
    "fn-pil": "()=>{const k=FUNCTION_KEYS.find(k=>fnPlansInPillars(FUNCTIONS[k]));"
              "current='fn:'+k; currentSub='fnperf'; paint();}",
    "group":  "()=>{current='group'; currentSub='performance'; paint();}",
}


def read(pg, key):
    pg.evaluate(GO[key])
    pg.wait_for_timeout(650)
    try:
        return pg.evaluate(WHERE)
    except Exception as e:                                   # §215
        return {"err": str(e)[:120], "tab": [], "body": [], "bands": False,
                "present": False, "entries": None, "bandRows": 0, "contentY": None}


def named(rows, word):
    return next((r for r in rows if r["word"].lower().startswith(word)), None)


with sync_playwright() as p:
    b = p.chromium.launch(executable_path=CHROME, args=["--allow-file-access-from-files"])
    pg = b.new_page(viewport={"width": 1500, "height": 950})
    errs = []
    pg.on("pageerror", lambda e: errs.append(str(e)))        # §130.3
    pg.add_init_script("try{sessionStorage.setItem('smp.tour.later','1');"
                       "sessionStorage.setItem('smp.welcome.done','1');}catch(e){}")
    pg.goto(URL)
    pg.wait_for_timeout(900)
    pg.select_option("#asWho", "smo")
    pg.wait_for_timeout(400)

    # ── 1 · THE CONTROLS ARE THERE AT ALL, ON BOTH PAGES ────────────────
    # First, or every comparison below is satisfied by two empty rows.
    print("\n== 1 · both pages draw both controls, on the tab row ==")
    unit = read(pg, "unit")
    fn = read(pg, "fn-cap")

    for label, r in (("a unit", unit), ("a capability function", fn)):
        ck("%s draws Presentation on the tab row" % label,
           r["present"] and bool(named(r["tab"], "presentation")), r["tab"])
        ck("%s draws Bands on the tab row" % label, r["bands"], r["tab"])
        # LEFT BEHIND IS AS BAD AS NEVER MOVED: two menus is not a fix.
        ck("%s draws neither in the page body" % label, not r["body"], r["body"])

    # A bands menu with no bands in it is a control that failed to render (§45.2).
    ck("the function's Bands menu lists the tenant's bands",
       fn["bandRows"] > 0 and fn["bandRows"] == unit["bandRows"],
       (fn["bandRows"], unit["bandRows"]))

    # ── 2 · AND THEY AGREE WITH THE UNIT'S, WHICH IS THE ASK ────────────
    print("\n== 2 · the function's controls land where the unit's do ==")
    for word in ("presentation", "bands"):
        u, f = named(unit["tab"], word), named(fn["tab"], word)
        if not (u and f):
            ck("%s is on both pages to compare" % word, False, (u, f))
            continue
        ck("%s: same x as the unit's" % word, u["x"] == f["x"], (u["x"], f["x"]))
        ck("%s: same y as the unit's" % word, u["y"] == f["y"], (u["y"], f["y"]))
        ck("%s: same width as the unit's" % word, u["w"] == f["w"], (u["w"], f["w"]))

    # ── 3 · THE PAGE GAINS THE ROW BACK ─────────────────────────────────
    # Asserted as the AGREEMENT again: the function's content now starts within
    # a few pixels of a unit's, where before it began a whole control-row lower.
    print("\n== 3 · the row the button was spending comes back ==")
    ck("the function's content starts about where a unit's does",
       fn["contentY"] is not None and unit["contentY"] is not None
       and abs(fn["contentY"] - unit["contentY"]) <= 14,
       (fn["contentY"], unit["contentY"]))

    # ── 4 · THE PILLARS HALF AND THE GROUP ARE UNTOUCHED ────────────────
    print("\n== 4 · the pages that already agreed still do ==")
    pil = read(pg, "fn-pil")
    ck("a pillars function still draws both on the tab row",
       pil["present"] and pil["bands"] and not pil["body"], pil["tab"])
    for word in ("presentation", "bands"):
        u, q = named(unit["tab"], word), named(pil["tab"], word)
        ck("pillars function: %s agrees with the unit" % word,
           bool(u and q) and u["x"] == q["x"] and u["y"] == q["y"], (u, q))
    grp = read(pg, "group")
    # The group has never had a Presentation button; §272 does not give it one,
    # and that absence is asserted so a build that widened the change fails here.
    ck("the group still has Bands and still no Presentation",
       grp["bands"] and not grp["present"], grp["tab"])

    # ── 5 · THE CONTROL MOVED; NOBODY'S RIGHTS MOVED ────────────────────
    # Asked of the SHARED RULE rather than of a list of entries (§42, §252.2).
    print("\n== 5 · the menu still says what the rule says ==")
    fn = read(pg, "fn-cap")
    ck("the menu has entries at all", bool(fn["entries"]), fn["entries"])
    if fn["entries"]:
        ck("...Present is among them",
           any(e.lower().startswith("present") for e in fn["entries"]), fn["entries"])
        may = pg.evaluate("()=>{try{return !!SMPRules.mayDownloadPlan(world(), viewer(),"
                          " current);}catch(e){return 'ERR '+e;}}")
        has = any("download" in e.lower() for e in fn["entries"])
        ck("...and Download the plan is drawn exactly when the rule allows it",
           may is True and has, (may, fn["entries"]))

        # THE OTHER END, or the line above passes on a build that draws it for
        # everybody (§94.2): somebody the rule refuses must not be offered it.
        who = pg.evaluate("""()=>{ const keep=VIEWER, out=[];
          PEOPLE.filter(p=>p.active!==false).forEach(p=>{ VIEWER=p.key;
            try{ if(!SMPRules.mayDownloadPlan(world(), viewer(), current)) out.push(p.key); }
            catch(e){} });
          VIEWER=keep; return out; }""")
        ck("somebody exists that the rule refuses", bool(who), who)
        if who:
            pg.evaluate("(k)=>{VIEWER=k; paint();}", who[0])
            pg.wait_for_timeout(650)
            r = pg.evaluate(WHERE)
            ck("...and their menu does not offer the download",
               r["entries"] is not None
               and not any("download" in e.lower() for e in r["entries"]),
               (who[0], r["entries"]))
            pg.evaluate("()=>{VIEWER=PEOPLE.filter(x=>SMPRules.mayEditAccess(world(),x))[0].key;"
                        " paint();}")
            pg.wait_for_timeout(400)

    pg.close()

    # ── 6 · ONE LINE, AT EVERY WIDTH SOMEBODY WORKS AT ──────────────────
    # A function's tab names are longer than a unit's, so the row carrying two
    # more controls is measured rather than assumed (§27.1, §158: fit, never
    # "and it scrolls").
    print("\n== 6 · the tab row stays one line ==")
    FIT = """()=>{
      const row=document.getElementById('subtabs');
      if(!row) return {err:'no row'};
      const kids=[...row.children].map(e=>e.getBoundingClientRect());
      const tops=[...new Set(kids.map(r=>Math.round(r.top/6)))];
      const acts=row.querySelector('.tabacts');
      return { lines: tops.length,
        overflow: Math.round(row.scrollWidth - row.clientWidth),
        side: Math.round(document.documentElement.scrollWidth
                         - document.documentElement.clientWidth),
        gap: (acts && kids.length>1)
          ? Math.round(acts.getBoundingClientRect().left - kids[kids.length-2].right) : null };
    }"""
    for w in (1920, 1500, 1280, 1100, 1000, 900, 820, 768):
        pg = b.new_page(viewport={"width": w, "height": 900})
        pg.on("pageerror", lambda e: errs.append(str(e)))
        pg.add_init_script("try{sessionStorage.setItem('smp.tour.later','1');"
                           "sessionStorage.setItem('smp.welcome.done','1');}catch(e){}")
        pg.goto(URL)
        pg.wait_for_timeout(700)
        pg.select_option("#asWho", "smo")
        pg.wait_for_timeout(300)
        pg.evaluate(GO["fn-cap"])
        pg.wait_for_timeout(600)
        r = pg.evaluate(FIT)
        ck("%d · one line, nothing overflowing, no sideways page scroll" % w,
           r.get("lines") == 1 and r.get("overflow", 1) <= 0 and r.get("side", 1) <= 0,
           json.dumps(r))
        ck("%d · the controls clear the last tab" % w,
           r.get("gap") is not None and r["gap"] > 0, r.get("gap"))
        pg.close()

    ck("no page error anywhere", not errs, errs[:3])
    b.close()

print("\n" + ("FAILED (%d): " % len(fails) + ", ".join(fails[:8]) if fails
             else "all fn-perf-controls checks passed"))
raise SystemExit(1 if fails else 0)
