"""A PROJECT MOVES FROM ONE FUNCTION TO ANOTHER (§797).

Islam: *"I want to be able to move a project from a function to another
function"*; of the two shapes offered, *"option 1, functions only"*.

On a function's plan page with the pen on, the office's project band carries
"Move to another function" beside Remove. Pressed, the floating box asks
first (§621): where to, among the other functions that plan in projects, and
what changes — the code where it lands, who reports it from now. Move takes
the project whole — deliverables, outcomes, milestones, owner, figures — and
the page follows it to its new function; Keep changes nothing.

WHAT IS ASSERTED, both ends (§94.2), every press read back off the stored
plan (§96):

  1 · THE CONTROL: for the office, with the pen on, on a function's own
      project — offering exactly the other shown functions that plan in
      projects, never the function itself, never a pillars function.

  2 · KEEP CHANGES NOTHING: the box opens, names the project and the
      destination's name, Keep closes it, both functions hold what they held.

  3 · MOVE: the project is gone from the source and is the last of the
      destination, the same row (id, name, owner, its three lists' lengths,
      a milestone's status) under a NEW code; the source's grouping is in
      the archives; the page is the destination's with the project showing.

  4 · THE OTHER END: with no other projects function, no control; a seat
      outside the office sees none.
"""
import os
from playwright.sync_api import sync_playwright

HERE = os.path.dirname(os.path.abspath(__file__))
FILE = os.environ.get("SMP_BUILT") or os.path.join(os.path.dirname(HERE), "strategy-management-platform.html")
fails = []


def ok(label, cond, got=None):
    if cond:
        print("  ok   " + label)
    else:
        fails.append(label)
        print("  FAIL " + label + ("" if got is None else "  — %s" % (got,)))


def js(pg, expr, arg=None):
    try:
        return pg.evaluate(expr, arg) if arg is not None else pg.evaluate(expr)
    except Exception as e:                                    # noqa: BLE001
        return {"threw": str(e).strip().split("\n")[0][:160]}


def go_fn(pg, key):
    js(pg, "(k)=>{ current = 'fn:' + k; currentSub = 'fnstrat'; CURSEC.fnstrat = 'proj'; EDIT_PAGE.plan = true; paint(); }", key)
    pg.wait_for_timeout(400)


BAND = """()=>{ const b = document.querySelector('.pane .pband.edband'); if (!b) return { band: false };
  const mv = b.querySelector('[data-mvrow]');
  return { band: true, code: (b.querySelector('.pband-code') || {}).textContent || '', move: !!mv, text: mv ? mv.textContent.trim() : null, id: mv ? mv.dataset.mvrow.split('|')[1] : null }; }"""

BOX = """()=>{ const x = document.querySelector('.askbox'); if (!x) return { box: false };
  return { box: true, title: (x.querySelector('.asktitle') || {}).textContent || '',
           options: [...x.querySelectorAll('[data-mvto] option')].map(o => o.value),
           impact: (x.querySelector('[data-mvimpact]') || {}).textContent || '',
           yes: (x.querySelector('.askyes') || {}).textContent || '', no: (x.querySelector('.askno') || {}).textContent || '' }; }"""

ROW = """(id)=>{ const h = holderOfProjectId(id), p = projById(id); if (!h || !p) return null;
  return { fn: h.fn || null, own: !!h.own, idx: h.projects.map(x => x.id).indexOf(id), n: h.projects.length,
           code: projCode(holderCodeOwner(h), p), name: p.name, owner: p.owner,
           d: (p.deliverables || []).length, o: (p.outcomes || []).length, m: (p.milestones || []).length,
           ms: ((p.milestones || [])[0] || {}).status || null }; }"""

with sync_playwright() as p:
    b = p.chromium.launch(executable_path=os.environ.get("SMP_CHROME"))
    pg = b.new_page(viewport={"width": 1500, "height": 900})
    pg.add_init_script("try{sessionStorage.setItem('smp.welcome.seen','1');sessionStorage.setItem('smp.welcome.done','1');"
                       "sessionStorage.setItem('smp.tour.later','1');localStorage.setItem('smp.tour.never','1');}catch(e){}")
    errs = []
    pg.on("pageerror", lambda e: errs.append(str(e)))
    pg.goto("file://" + FILE); pg.wait_for_timeout(900)
    js(pg, "()=>{ switchViewer((PEOPLE.find(p=>SMPRules.isOffice(world(), p))||{}).key); }"); pg.wait_for_timeout(400)
    fns = js(pg, "()=>FUNCTION_KEYS.filter(k => fnShows(k) && fnPlansInProjects(FUNCTIONS[k]) && (FUNCTIONS[k].projects||[]).length)")
    ok("made: two or more shown functions plan in projects and hold some", isinstance(fns, list) and len(fns) >= 2, fns)
    src, dst = fns[0], fns[1]
    srcName = js(pg, "(k)=>FUNCTIONS[k].name", src); dstName = js(pg, "(k)=>FUNCTIONS[k].name", dst)
    expect = js(pg, "(k)=>FUNCTION_KEYS.filter(x => x !== k && fnShows(x) && fnPlansInProjects(FUNCTIONS[x]))", src)

    print("\n── 1 · the control")
    go_fn(pg, src)
    band = js(pg, BAND)
    ok("the office, pen on, on a function's own project: the band carries Move to another function",
       isinstance(band, dict) and band.get("move") is True and (band.get("text") or "").startswith("Move to another "), band)
    pid = (band or {}).get("id")
    before_src = js(pg, ROW, pid)
    before_dst_n = js(pg, "(k)=>(fnOwnProjects(k)||[]).length", dst)
    ok("…on a project the source function holds itself", isinstance(before_src, dict) and before_src.get("own") is True and before_src.get("fn") == src, before_src)
    pg.click("[data-mvrow]"); pg.wait_for_timeout(300)
    box = js(pg, BOX)
    ok("pressed: the floating box asks first, naming the project and the other functions that plan in projects, exactly",
       isinstance(box, dict) and box.get("box") is True and box.get("options") == expect and (before_src or {}).get("name", "") in (box.get("impact") or ""), (box, expect))
    ok("…saying the code changes and who keeps it, with Move it / Keep it here",
       isinstance(box, dict) and "Its code" in (box.get("impact") or "") and "keeps it" in (box.get("impact") or "") and box.get("yes") == "Move it" and box.get("no") == "Keep it here", box)

    print("\n── 2 · Keep changes nothing")
    pg.click(".askbox .askno"); pg.wait_for_timeout(200)
    after_keep = js(pg, ROW, pid)
    ok("Keep: the box is gone and the project is where it was", js(pg, "()=>!document.querySelector('.askbox')") is True and after_keep == before_src and js(pg, "(k)=>(fnOwnProjects(k)||[]).length", dst) == before_dst_n, after_keep)

    print("\n── 3 · Move")
    pg.click("[data-mvrow]"); pg.wait_for_timeout(300)
    js(pg, "(k)=>{ const s = document.querySelector('[data-mvto]'); s.value = k; s.dispatchEvent(new Event('change', { bubbles: true })); }", dst)
    pg.wait_for_timeout(100)
    imp = (js(pg, BOX) or {}).get("impact") or ""
    ok("choosing a destination rewrites the impact for it", dstName in imp, imp)
    arch0 = js(pg, "()=>ARCHIVES.length")
    pg.click(".askbox .askyes"); pg.wait_for_timeout(500)
    after = js(pg, ROW, pid)
    ok("the project is gone from the source and is the destination's last",
       isinstance(after, dict) and after.get("fn") == dst and after.get("own") is True and after.get("idx") == after.get("n") - 1 and after.get("n") == before_dst_n + 1
       and js(pg, "(k)=>(fnOwnProjects(k)||[]).map(x=>x.id)", src).count(pid) == 0, after)
    ok("…the same row: name, owner, its three lists and a milestone's status", isinstance(after, dict) and all(after.get(k) == before_src.get(k) for k in ("name", "owner", "d", "o", "m", "ms")), (before_src, after))
    ok("…under a new code, the destination's", isinstance(after, dict) and after.get("code") and after.get("code") != before_src.get("code"), (before_src.get("code"), after.get("code")))
    ok("…the source's grouping archived first, saying where it went",
       js(pg, "()=>ARCHIVES.length") == arch0 + 1 and dstName in (js(pg, "()=>ARCHIVES[0].why") or "") and js(pg, "()=>ARCHIVES[0].key") == "fn:" + src, js(pg, "()=>ARCHIVES[0] && [ARCHIVES[0].key, ARCHIVES[0].why]"))
    ok("…and the page followed it: the destination's plan, the moved project on the band",
       js(pg, "()=>current") == "fn:" + dst and (js(pg, BAND) or {}).get("code") == after.get("code"), (js(pg, "()=>current"), js(pg, BAND)))

    print("\n── 4 · the other end")
    others = js(pg, "(k)=>{ const was = {}; FUNCTION_KEYS.forEach(x => { if (x !== k && fnPlansInProjects(FUNCTIONS[x])) { was[x] = FUNCTIONS[x].format; FUNCTIONS[x].format = 'pillars'; } }); return was; }", dst)
    go_fn(pg, dst)
    ok("with no other function planning in projects, no Move on the band", (js(pg, BAND) or {}).get("move") is False, js(pg, BAND))
    js(pg, "(was)=>{ Object.keys(was).forEach(x => { FUNCTIONS[x].format = was[x]; }); }", others)
    head = js(pg, "(k)=>FUNCTIONS[k].head", dst)
    js(pg, "(k)=>{ switchViewer(k); }", head); pg.wait_for_timeout(300)
    go_fn(pg, dst)
    ok("a seat outside the office sees no Move", js(pg, "()=>!document.querySelector('[data-mvrow]')") is True)
    ok("no page errors", not errs, errs)
    b.close()

print()
if fails:
    print("FAILED %d: %s" % (len(fails), "; ".join(fails)))
    raise SystemExit(1)
print("project-move: all green")
