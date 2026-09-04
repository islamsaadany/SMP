"""THE REPORTING PAGE SAYS WHERE SUBMIT IS HELD (§274).

Islam, from his own tenant: *"the reporting is not submitting to the SMO as
there is someting requires a note but I can't find it."* Reproduced before
anything was built — every figure entered, the plan owing nothing, the gate
held by exactly one figure at risk with no note, and the pillar holding it up
wearing a green 4/4, because that tally counts figures ENTERED. The row is
marked when it is on screen; the page draws one pillar at a time, so it was
not on the screen. He chose option C: the bar names everything Submit is
waiting for, with a walk.

WHAT THIS ASSERTS, AND WHY EACH ONE IS HERE

· THE BAR AGREES WITH THE BUTTON IT EXPLAINS. Asserted as AGREEMENT with
  `reportPlaces()`/`submitBlockers()` and never as a number (§94.8), so a
  deliberate change to the wording or the arithmetic stays green and a bar
  that starts counting something else does not.

· BOTH ENDS, EVERY TIME (§94.2, §113.8). A build that drew no bar at all
  would satisfy every "the bar does not nag" assertion, so each absence is
  asserted beside the presence it came from: nothing outstanding → no bar,
  something outstanding → a bar; a viewer who cannot submit → no bar, the
  office → a bar.

· THE PLACE IS ADDRESSED BY THE STORED CODE, NOT THE DRAWN ONE. `pillarCode()`
  renders the tenant's prefix (BE03) and the rail matches `p.code` (M03) —
  keying the chip on the label made Next set the rail to a code no pillar has,
  so the press repainted the same pane and looked like a dead button. Found by
  pressing it. The two are asserted to DIFFER on this tenant, or the assertion
  passes on the build that had the fault.

· THE WALK LANDS ON THE ROW, NOT ON THE PAGE. The lit control is read back by
  its row id and compared with the id the map says is owed (§96: a control
  that renders is not a control that acts).

· AND THE PAIR AT THE END. Answering the last thing must clear the bar AND
  open Submit — a build that cleared the bar and left Submit shut is the
  dangerous one, and either half alone passes on it.

PROVED ABLE TO FAIL: run against the previous build with
`SMP_FILE=/path/to/old.html python3 checks/report-blockers.py` — 24 red, the
first of them the reported symptom itself.
"""
import os
import sys
from playwright.sync_api import sync_playwright

URL = "file://" + os.environ.get(
    "SMP_FILE", "/home/user/SMP/SMP-Project-Folder/src/strategy-management-platform.html")
UNIT = "b2becomm"
bad = 0


def ck(w, ok, x=""):
    global bad
    if not ok:
        bad += 1
    print(("  ok      " if ok else "  FAIL    ") + w + (("  — " + str(x)) if not ok and x else ""))


def lum(c):
    r, g, b = [int(x) / 255.0 for x in c]
    f = lambda v: v / 12.92 if v <= 0.03928 else ((v + 0.055) / 1.055) ** 2.4
    return .2126 * f(r) + .7152 * f(g) + .0722 * f(b)


def ratio(a, b):
    la, lb = lum(a), lum(b)
    hi, lo = max(la, lb), min(la, lb)
    return round((hi + .05) / (lo + .05), 2)


def rgb(v):
    import re as _re
    return _re.findall(r"\d+", v or "0 0 0")[:3]


def lst(v):
    """A probe that came back an error is an EMPTY list, never a crash. The
    first run of this file against the previous build died here — `places` was
    `{__err: reportPlaces is not defined}` and the sum below walked it, so
    three failures printed where there are twenty-four and `grep -c FAIL` read
    a crash as a nearly-clean build (§215, in the file that promises it
    doesn't). Every list-shaped probe goes through this."""
    return v if isinstance(v, list) else []


def at(v, i):
    return v[i] if isinstance(v, list) and len(v) > i else {}


def js(pg, expr, *a):
    """Every probe degrades rather than throwing (§215): run against a build
    with none of this in it, a probe that dies takes every assertion after it
    with it and `grep -c FAIL` reports a crash as a pass."""
    try:
        return pg.evaluate("(a)=>{try{ return (" + expr + ")(a); }catch(e){ return {__err:''+e}; }}", a[0] if a else None)
    except Exception as e:
        return {"__err": str(e)}


FILL_ALL = """(u)=>{const un=UNITS[u];
 (un.keyObjectives||[]).forEach(m=>{if(!m.actual)m.actual=m.target;m.note=m.note||"On plan.";});
 (un.items||[]).forEach(p=>{
   (p.measures||[]).forEach(m=>{if(!m.actual)m.actual=m.target;m.note=m.note||"On plan.";});
   (p.tactics||[]).forEach(t=>{
     if(!t.outcome)t.outcome="Something measurable"; if(!t.outTarget)t.outTarget="6 #";
     t.outActual=t.outTarget;
     if(t.actual==null||t.actual==="")t.actual=100; t.note=t.note||"On plan.";});});
 return true;}"""

ONE_NOTE = """(u)=>{const un=UNITS[u],last=un.items[un.items.length-1],m=last.measures[0];
 m.actual=String(Math.round((parseFloat(m.target)||100)*0.3))+
          (String(m.target).replace(/^[\\d.,\\s]+/,"")||"");
 m.note="";
 return {code:last.code, id:m.id};}"""

BAR = """()=>{const b=document.querySelector('[data-repband]');
 if(!b) return {none:true};
 return {count:(b.querySelector('.secmiss')||{}).textContent||"",
   chips:[...b.querySelectorAll('.mchip')].map(c=>({txt:c.textContent.trim(),
     key:c.dataset.rkey||"", rail:c.dataset.rrail||"", code:c.dataset.rcode||"",
     plan:!!c.dataset.rplan, title:c.getAttribute('title')||""})),
   next:(document.querySelector('[data-repnext]')||{}).textContent||null};}"""


def open_report(pg, who_role, unit):
    pg.evaluate("""(a)=>{
      const p = PEOPLE.filter(p => (p.role||'') === a.role)[0];
      if (p) VIEWER = p.key;
      leaveModes(); current = a.unit; paint();
    }""", {"role": who_role, "unit": unit})
    pg.wait_for_timeout(300)
    pg.evaluate("()=>{const b=document.querySelector('[data-s=performance]'); if(b) b.click();}")
    pg.wait_for_timeout(350)
    pg.evaluate("()=>{const b=document.querySelector('[data-s=report]'); if(b) b.click();}")
    pg.wait_for_timeout(550)


with sync_playwright() as p:
    # Launched the way every other check is, so `python3 qa-run.py
    # checks/report-blockers.py` supplies the container's Chromium and a plain
    # run on a laptop uses Playwright's own.
    b = p.chromium.launch()
    pg = b.new_page(viewport={"width": 1500, "height": 950})
    errs = []
    pg.on("pageerror", lambda e: errs.append(str(e)))
    pg.on("console", lambda m: errs.append(m.text) if m.type == "error" else None)
    pg.add_init_script("try{sessionStorage.setItem('smp.welcome.done','1');"
                       "sessionStorage.setItem('smp.tour.later','1');}catch(e){}")
    pg.goto(URL)
    pg.wait_for_timeout(1800)

    # 1 ── NOTHING OUTSTANDING DRAWS NO BAR (the other end, asserted first)
    print("\n1 · a report owing nothing carries no bar (§45.2 from the quiet side)")
    open_report(pg, "super", UNIT)
    js(pg, FILL_ALL, UNIT)
    pg.evaluate("()=>paint()")
    pg.wait_for_timeout(500)
    r = js(pg, BAR)
    ck("with every figure in and nothing at risk, no bar is drawn",
       isinstance(r, dict) and r.get("none") is True, r)
    ck("...and Submit is live", pg.evaluate(
        "()=>{const s=document.querySelector('.rc-submit'); return s? s.getAttribute('aria-disabled') : 'no button';}") is None)

    # 2 ── HIS STATE: ONE NOTE OWED, IN A PILLAR THE RAIL IS NOT ON
    print("\n2 · one figure at risk with no note — the state he reported")
    made = js(pg, ONE_NOTE, UNIT)
    pg.evaluate("()=>paint()")
    pg.wait_for_timeout(500)
    pg.evaluate("()=>{const r=document.querySelectorAll('.rail .ritem');"
                "if(r.length && !r[0].classList.contains('on')) r[0].click();}")
    pg.wait_for_timeout(450)
    blk = js(pg, "(u)=>{const b=submitBlockers(u);"
                 "return {notes:b.notes.length,pending:b.pending.length,owed:b.owed,gaps:b.gaps};}", UNIT)
    ck("the gate is held by the note and by nothing else",
       blk == {"notes": 1, "pending": 0, "owed": 0, "gaps": 0}, blk)
    r = js(pg, BAR)
    ck("a bar is drawn", isinstance(r, dict) and not r.get("none"), r)
    places = lst(js(pg, "(u)=>reportPlaces(u).filter(e=>e.count>0)"
                    ".map(e=>({key:e.key,label:e.label,count:e.count,code:e.code,rail:e.rail}))", UNIT))
    ck("its chips are the places the map names — agreement, never a list",
       isinstance(r, dict) and bool(places) and
       [c["key"] for c in r.get("chips", [])] == [e["key"] for e in places], (r, places))
    ck("...and the headline counts what those chips add up to",
       isinstance(r, dict) and bool(places) and r.get("count", "").startswith(
           str(sum(e["count"] for e in places))), (r, places))
    ck("the chip is pressable and names its place",
       isinstance(r, dict) and len(r.get("chips", [])) == 1 and
       at(r.get("chips"), 0).get("txt", "").startswith(at(places, 0).get("label", "\u0000")), r)

    # 3 ── ADDRESSED BY THE STORED CODE, LABELLED WITH THE DRAWN ONE
    print("\n3 · the chip is addressed by the stored code (§48)")
    ck("the chip's rail code is the pillar's stored code",
       at(r.get("chips") if isinstance(r, dict) else [], 0).get("code") ==
       (made.get("code") if isinstance(made, dict) else None), (r, made))
    ck("...which is NOT what the page draws, or this assertion proves nothing",
       bool(at(r.get("chips") if isinstance(r, dict) else [], 0).get("code")) and
       at(r.get("chips") if isinstance(r, dict) else [], 0).get("code") !=
       (at(r.get("chips") if isinstance(r, dict) else [], 0).get("txt", "").split() or [""])[0],
       (r, made))
    ck("...and the rail key is the rail's own",
       at(r.get("chips") if isinstance(r, dict) else [], 0).get("rail") == "unit:" + UNIT, r)

    # 4 ── THE RAIL SAYS WHICH PILLAR, IN THE STATE THE RAIL SHIPS IN
    print("\n4 · the rail marks the pillar, and stops reading as finished")
    rail = lst(js(pg, """()=>[...document.querySelectorAll('.rail .ritem')].map(b=>({
        txt:b.textContent.trim(),
        alarm:(b.querySelector('.rsub .missing')||{}).textContent||"",
        full:!!b.querySelector('.rtally.full')}))"""))
    ck("exactly one rail row carries an alarm",
       len([x for x in rail if x["alarm"]]) == 1, rail)
    ck("...it is the pillar the map names",
       bool(places) and any(
           x["alarm"] and x["txt"].startswith(at(places, 0).get("label", "\u0000")) for x in rail), rail)
    ck("...it says a note is what is owed",
       any("note" in x["alarm"] for x in rail), rail)
    ck("...and that row's tally is no longer green — asked of the marked row "
       "itself, or a build with no marks at all satisfies it (§113.8)",
       len([x for x in rail if x["alarm"] and not x["full"]]) == 1, rail)
    ck("the rails that owe nothing keep their green tally",
       bool(rail) and len([x for x in rail if x["full"]]) == len(rail) - 1, rail)

    # 5 ── ONE PRESS LANDS ON THE ROW
    print("\n5 · Next goes to the place and lights the row that owes (§177.2)")
    before = pg.evaluate("()=>[...document.querySelectorAll('.rail .ritem.on')]"
                         ".map(b=>b.textContent.trim())[0]||''")
    pressed = False
    try:
        pg.click("[data-repnext]")
        pressed = True
    except Exception as e:
        errs.append("next: " + str(e))
    pg.wait_for_timeout(900)
    ck("the walk button is there to press", pressed)
    after = pg.evaluate("()=>[...document.querySelectorAll('.rail .ritem.on')]"
                        ".map(b=>b.textContent.trim())[0]||''")
    ck("the rail moved to the pillar that owes", pressed and after != before and
       after.startswith(at(places, 0).get("label", "\u0000")), (before, after))
    lit = js(pg, """()=>{const l=document.querySelector('.gaplit');
        return l?{tag:l.tagName, note:l.getAttribute('data-note')||"",
                  place:l.getAttribute('data-rplace')||"",
                  walk:l.classList.contains('repwalk'),
                  focused:document.activeElement===l}:null;}""")
    ck("a control is lit", isinstance(lit, dict) and lit.get("tag"), lit)
    ck("...it is the NOTE box, not the figure box",
       isinstance(lit, dict) and lit.get("tag") == "TEXTAREA" and lit.get("note"), lit)
    ck("...of the very row the map says owes one",
       isinstance(lit, dict) and lit.get("note") ==
       (made.get("id") if isinstance(made, dict) else None), (lit, made))
    ck("...in the place the chip named",
       isinstance(lit, dict) and lit.get("place") == at(places, 0).get("key"), (lit, places))
    ck("...and the cursor is in it, so typing goes where the press landed",
       isinstance(lit, dict) and lit.get("focused") is True, lit)

    # 6 ── ANSWERING IT CLEARS THE BAR *AND* OPENS SUBMIT
    print("\n6 · answering the last thing clears the bar and opens Submit (the pair)")
    pg.evaluate("""()=>{const l=document.querySelector('.gaplit');
        if(!l) return; l.value='Supplier outage in July; recovery agreed.';
        l.dispatchEvent(new Event('change',{bubbles:true}));}""")
    pg.wait_for_timeout(700)
    r2 = js(pg, BAR)
    ck("the bar was there and is now gone — the pair, because 'gone' alone is "
       "true of a build that never drew one",
       isinstance(r, dict) and not r.get("none") and
       isinstance(r2, dict) and r2.get("none") is True, (r, r2))
    ck("...and Submit is live in the same breath", pg.evaluate(
        "()=>{const s=document.querySelector('.rc-submit'); return s? s.getAttribute('aria-disabled') : 'no button';}") is None)
    ck("...and the note reached the stored row",
       js(pg, "(a)=>{const h=findById(unitLike(a.u), a.id); return !!(h && h.obj.note);}",
          {"u": UNIT, "id": made.get("id")}) is True)

    # 7 ── A PLAN GAP IS COUNTED AND IS A DOOR, NEVER A WALK STOP
    print("\n7 · a gap in the plan is counted here and filled there (§16.7)")
    js(pg, "(u)=>{const un=UNITS[u]; un.items[0].measures[0].target=''; return true;}", UNIT)
    pg.evaluate("()=>paint()")
    pg.wait_for_timeout(500)
    r3 = js(pg, BAR)
    gaps = js(pg, "(u)=>gapTotalAll(u)", UNIT)
    ck("the plan's gaps are in the count, or the bar reads nothing over a shut Submit",
       isinstance(gaps, int) and gaps > 0 and isinstance(r3, dict) and
       any(c["plan"] for c in r3.get("chips", [])), (r3, gaps))
    planchip = isinstance(r3, dict) and any(c["plan"] for c in r3.get("chips", []))
    ck("...that chip is not walkable — asserted of a chip that EXISTS",
       planchip and all(not c["plan"] for c in lst(js(pg,
           "()=>[...document.querySelectorAll('[data-repband] .mchip:not([data-rplan])')]"
           ".map(c=>({plan:!!c.dataset.rplan}))"))), r3)
    ck("...and with nothing else outstanding there is no walk offered at all",
       planchip and r3.get("next") is None, r3)
    pg.evaluate("""()=>{const c=document.querySelector('[data-repband] .mchip[data-rplan]');
        if(c) c.click();}""")
    pg.wait_for_timeout(700)
    ck("pressing it opens the Strategy tab, where those are filled",
       pg.evaluate("()=>currentSub") in ("strategy", "fnstrat"),
       pg.evaluate("()=>currentSub"))
    js(pg, "(a)=>{UNITS[a.u].items[0].measures[0].target=a.t; return true;}",
       {"u": UNIT, "t": "2,200"})

    # 8 ── A SUPPORTING FUNCTION GETS THE SAME BAR (it had NONE)
    print("\n8 · a capability function is told too — it never had a banner at all")
    fk = js(pg, "()=>Object.keys(FUNCTIONS).filter(k=>!fnPlansInPillars(FUNCTIONS[k]) "
                "&& capsOfFunction(k).length)[0]||null")
    ck("there is such a function to measure", isinstance(fk, str) and fk, fk)
    if isinstance(fk, str) and fk:
        open_report(pg, "super", "fn:" + fk)
        fb = js(pg, "(k)=>{const b=submitBlockers('fn:'+k);"
                    "return {notes:b.notes.length,pending:b.pending.length,owed:b.owed,gaps:b.gaps};}", fk)
        held = isinstance(fb, dict) and (fb.get("notes") or fb.get("owed") or
                                         fb.get("pending") or fb.get("gaps"))
        r4 = js(pg, BAR)
        ck("its Submit is held by something (or this section proves nothing)", bool(held), fb)
        ck("...and the page says so, where it used to say nothing",
           bool(held) and isinstance(r4, dict) and not r4.get("none"), r4)
        fplaces = lst(js(pg, "(k)=>reportPlaces('fn:'+k).filter(e=>e.count>0).map(e=>e.key)", fk))
        ck("...with a chip per place, agreeing with the map",
           isinstance(r4, dict) and bool(fplaces) and
           [c["key"] for c in r4.get("chips", [])] == fplaces, (r4, fplaces))

    # 9 ── IT IS DRAWN FOR WHOEVER MAY SUBMIT, AND FOR NOBODY ELSE
    print("\n9 · drawn for the people Submit is drawn for (§61), both ends")
    # The state has to be MADE again: section 6 answered the last thing, so
    # without this every assertion below passes over a page with nothing to
    # say (§94.2, and §113.8 — an absence over an empty bar is not an absence).
    open_report(pg, "super", UNIT)
    made9 = js(pg, ONE_NOTE, UNIT)
    pg.evaluate("()=>paint()")
    pg.wait_for_timeout(500)
    office = js(pg, BAR)
    ck("the office may speak for the unit", js(pg, "(u)=>canSpeakFor(u)", UNIT) is True)
    ck("...and is shown the bar", isinstance(office, dict) and not office.get("none"), office)
    # ASKED OF EACH CANDIDATE AS THAT CANDIDATE. The first draft filtered
    # PEOPLE on `canSpeakFor(u)` evaluated for whoever was already signed in,
    # so it asked one person's rights of everybody — §94.5, and it reported
    # "no such person" on a register full of them.
    other = js(pg, """(u)=>{
        const was = VIEWER, out = null;
        for (const p of PEOPLE) {
          if (p.active === false || p.key === was) continue;
          VIEWER = p.key;
          if (!canSpeakFor(u)) { leaveModes(); current = u; paint();
                                 return { key:p.key, may:canSpeakFor(u) }; }
        }
        VIEWER = was; paint(); return null;}""", UNIT)
    if isinstance(other, dict) and other.get("key"):
        pg.evaluate("()=>{const b=document.querySelector('[data-s=report]'); if(b) b.click();}")
        pg.wait_for_timeout(650)
        r5 = js(pg, BAR)
        ck("somebody who cannot submit is not shown a count they cannot clear",
           other.get("may") is False and isinstance(r5, dict) and r5.get("none") is True,
           (other, r5))
        ck("...and it is the same page that HAD one a moment ago, for the office",
           isinstance(office, dict) and not office.get("none"), office)
    else:
        ck("somebody who cannot submit is not shown a count they cannot clear",
           False, "nobody on this register is refused — assertion unmeasured (§54.5)")


    # 10 ── IT IS PAINTED, AND IT READS, IN BOTH PALETTES
    print("\n10 · the bar is dressed and readable (§145.14, §38.5)")
    INK = """()=>{
      const out = {};
      const grab = (sel, name) => {
        const e = document.querySelector(sel);
        if (!e) { out[name] = null; return; }
        const cs = getComputedStyle(e);
        let bg = cs.backgroundColor, n = e;
        while (bg === 'rgba(0, 0, 0, 0)' && n.parentElement) {
          n = n.parentElement; bg = getComputedStyle(n).backgroundColor; }
        out[name] = { fg: cs.color, bg: bg, bw: cs.borderTopWidth };
      };
      grab('[data-repband] .secmiss', 'count');
      grab('[data-repband] .mchip', 'chip');
      grab('[data-repband] .fillcta', 'cta');
      grab('.rail .ritem .rsub .missing', 'railmark');
      return out;}"""
    for theme in ("light", "dark"):
        open_report(pg, "super", UNIT)
        js(pg, FILL_ALL, UNIT)
        js(pg, ONE_NOTE, UNIT)
        pg.evaluate("(t)=>{ if (window.THEME && THEME.set) THEME.set(t);"
                    " else document.documentElement.setAttribute('data-theme', t); }", theme)
        pg.evaluate("()=>paint()")
        pg.wait_for_timeout(500)
        ink = js(pg, INK)
        for name in ("count", "chip", "cta", "railmark"):
            v = ink.get(name) if isinstance(ink, dict) else None
            r = ratio(rgb(v["fg"]), rgb(v["bg"])) if v else 0
            ck("%s reads in %s — %s:1" % (name, theme, r), bool(v) and r >= 4.5, v)
        # §145.14: INSIDE `nav.tabs` the chip and the button lose their dress to
        # `.tabs button`. This bar is in the page body, and that is asserted as
        # PAINT rather than assumed from the class it carries (§272.7).
        chip = ink.get("chip") if isinstance(ink, dict) else None
        cta = ink.get("cta") if isinstance(ink, dict) else None
        ck("the chip is drawn with a border, not left as plain words (%s)" % theme,
           bool(chip) and chip["bw"] not in ("0px", "", None), chip)
        ck("the button is drawn with a ground of its own (%s)" % theme,
           bool(cta) and cta["bg"] != "rgba(0, 0, 0, 0)", cta)
    pg.evaluate("()=>{ if (window.THEME && THEME.set) THEME.set('light'); }")

    ck("no page errors anywhere in the run", not errs, errs[:3])
    b.close()

print("\n" + ("ALL GREEN" if not bad else str(bad) + " FAILED"))
sys.exit(1 if bad else 0)
