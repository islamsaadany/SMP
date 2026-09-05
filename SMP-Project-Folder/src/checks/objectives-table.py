"""THE OBJECTIVES TABLE, WITH THE MONTHLY DRAWER IN IT (§278.3).

Islam, from the live product, of a supporting function's objectives with the
drawer open:

  1. *"trying t in the objectives the obecjtive part got damaged. shall it go
     below the whole objective columns to keep the table tidy?"*
  2. *"not sure why on the approaching of hte first row all turnd grey but the
     target cell turned white, and do you think the color change on hovering is
     helpful here given that the other row is already grey? or shall we cancel
     it for good"* — then *"for the hovering C remove it"*.
  3. *"the objectives needs a number column as well like the key measures of
     direction with a handle to move them as well"*, and then twice about the
     pair: *"they both needs to be centered vertically"*, *"these are not
     centered to each other."*

WHAT THIS ASSERTS, AND WHY IT IS NOT WHAT THE FIRST DRAWING MEASURED:

  · The drawer's cell spans the table MINUS the first column, and the first
    column is the `#` — the squeeze was never the indent, it was that the one
    column left outside the span was the prose one. So the assertion is that
    opening the drawer moves NO column's width, on both tables.

  · Every cell in a row is the row's own height. `display:flex` on a `<td>`
    stops it stretching, and the bare table shows through underneath — which
    is only visible on a TALL row, so the check MAKES one by giving the first
    objective a name long enough to wrap.

  · Hovering changes nothing, on BOTH parities. Asserting it on one is how the
    old rule passed for versions: on a striped row the stripe already outranked
    the hover, so half the table was already correct by accident.

  · The pair is centred BY ITS MARKS, read off the painted pixels at eight
    times scale. Measuring the element boxes reports 0.00px on a build the eye
    plainly rejects — that measurement is what produced the round Islam sent
    back (§185: measure the mark, never the box).

  · Both ends on the handle: somebody who may arrange gets one, somebody who
    may not gets the number and no handle. A check that only looks for a
    control that is PRESENT cannot see one that should not be drawn (§94.2).

  · AND THE TACTICS TABLE'S FOUR BOXES SIT INSIDE THEIR CELL. Islam, of the
    shipped build: *"the table is damged."* Same fault, third symptom: a
    `display:block` td is not a table-cell either, so the table generates an
    anonymous cell around it and the block computes its width against nothing
    — measured on that build, the `.tgrid` reports a width of ZERO and its
    four fixed boxes lay out on top of the Owner column, at every width.

  · And the drag is a REAL pointer drag, with the STORED list read back after
    it — a handle that moves a row on screen and is refused on save is the
    fault §94.3 shipped for two versions.

SMP_BUILT points it at another build, so it can be run against the one before.
"""
import os, pathlib, json, sys
from playwright.sync_api import sync_playwright

ROOT = pathlib.Path(__file__).resolve().parents[3]
FILE = pathlib.Path(os.environ.get("SMP_BUILT") or
                    (ROOT / "SMP-Project-Folder/src/strategy-management-platform.html"))
CHROME = os.environ.get("SMP_CHROME") or "/opt/pw-browsers/chromium"
SHOTS = pathlib.Path(os.environ.get("SMP_TMP") or "/tmp")
SCALE = 8
LONGNAME = "Achieve revenue target"

fails = []
def ok(cond, what, detail=""):
    if cond: print("  ok   %s" % what)
    else:
        print("  FAIL %s %s" % (what, detail)); fails.append(what)

def ev(pg, js, arg=None):
    """Every probe degrades (§215): a check that DIES reports fewer failures
    than the build has, which is worst on exactly the build it exists to see."""
    try:
        return pg.evaluate(js, arg) if arg is not None else pg.evaluate(js)
    except Exception as e:
        return {"__err": str(e)[:120]}

TBL = """()=>[...document.querySelectorAll('#panel table')]
  .find(x=>/Objective/i.test((x.querySelector('thead')||{textContent:''}).textContent))"""


def land(pg, where, viewer="smo"):
    pg.goto("file://" + str(FILE)); pg.wait_for_timeout(1400)
    pg.select_option("#asWho", viewer); pg.wait_for_timeout(300)
    # THE SWITCH IS A TOGGLE, so it is pressed only when the destination is not
    # already on the row — pressing it for a UNIT lands on the functions half,
    # where that button does not exist and the whole section then fails on a
    # page nobody navigated to.
    key = "fn:finance" if where == "fn" else "mobile"
    ev(pg, """(k)=>{
      if (document.querySelector('#units button[data-u="' + k + '"]')) return;
      const f = document.querySelector('#units [data-fold]'); if (f) f.click();
    }""", key)
    pg.wait_for_timeout(320)
    ev(pg, "(k)=>{const b=document.querySelector('#units button[data-u=\"'+k+'\"]'); if(b)b.click();}", key)
    sec, page = ("Overview", "capfoundation") if where == "fn" else ("Foundation", "foundation")
    pg.wait_for_timeout(500)
    ev(pg, "()=>{const t=[...document.querySelectorAll('.tabs button')].find(b=>/Strategy/i.test(b.textContent)); if(t)t.click();}")
    pg.wait_for_timeout(320)
    ev(pg, "(s)=>{const x=[...document.querySelectorAll('#secrow-in button,.secrow button')].find(b=>new RegExp(s,'i').test(b.textContent)); if(x)x.click();}", sec)
    pg.wait_for_timeout(420)
    return page


def longname(pg, where):
    """A NAME THAT WRAPS, because the row has to be TALL for the cell fault to
    show at all: on a 56px row the box covers the cell and nothing is visible
    under it. The demo's objective names are short, so the state is MADE."""
    ev(pg, """(o)=>{
      const list = o.where === 'fn'
        ? ((GROUP.capabilities||[]).filter(c=>c.fn==='finance')[0]||{}).keyObjectives
        : UNITS.mobile.keyObjectives;
      if (list && list[0]) list[0].name = o.name;
      paint();
    }""", {"where": where, "name": LONGNAME})
    pg.wait_for_timeout(400)


def openpen(pg, page):
    if not ev(pg, "(p)=>!!(typeof EDIT_PAGE !== 'undefined' && EDIT_PAGE[p])", page):
        ev(pg, "()=>{const p=document.querySelector('#secrow-in .secpen,#panel [data-edit],#panel .penbtn'); if(p)p.click();}")
        pg.wait_for_timeout(800)
    return ev(pg, "(p)=>!!(typeof EDIT_PAGE !== 'undefined' && EDIT_PAGE[p])", page)


def cols(pg):
    return ev(pg, """()=>{const t=(%s)(); if(!t) return null;
      const r=[...t.querySelectorAll('tbody tr:not(.mprow):not(.newrow)')][0];
      if(!r) return null;
      return [...r.children].map(td=>Math.round(td.getBoundingClientRect().width));}""" % TBL)


def inkOffset(path, scale=SCALE):
    """WHERE THE MARKS ARE, NOT WHERE THEIR BOXES ARE (§185). The cell's own
    1px border is ink too, so step two whole CSS pixels in before looking —
    without it the border bridges the bars and the digit into one run and the
    probe reports nothing at all."""
    try:
        from PIL import Image
    except ImportError:
        return "no-PIL"
    im = Image.open(path).convert("RGB"); px = im.load(); W, H = im.size
    M = 2 * scale
    dark = lambda x, y: px[x, y][0] < 150 and px[x, y][1] < 150 and px[x, y][2] < 160
    runs = []; cur = None
    for x in range(M, W - M):
        hit = any(dark(x, y) for y in range(M, H - M))
        if hit and cur is None: cur = x
        elif not hit and cur is not None: runs.append((cur, x)); cur = None
    if cur is not None: runs.append((cur, W - M))
    runs = [r for r in runs if r[1] - r[0] > 3]
    if len(runs) < 2: return None
    def mid(a, b):
        ys = [y for y in range(M, H - M) if any(dark(x, y) for x in range(a, b))]
        return (ys[0] + ys[-1]) / 2
    return round((mid(*runs[1]) - mid(*runs[0])) / scale, 2)


with sync_playwright() as pw:
    b = pw.chromium.launch(executable_path=CHROME,
                           args=["--no-sandbox", "--disable-dev-shm-usage"])

    # ── 1..5 · both tables, the same four questions ──────────────────────
    for where in ("fn", "unit"):
        print("\n§ %s objectives" % where)
        pg = b.new_page(viewport={"width": 1500, "height": 1000})
        errs = []; pg.on("pageerror", lambda e: errs.append(str(e)))
        page = land(pg, where)
        longname(pg, where)
        ok(openpen(pg, page), "%s · the pen opens" % where)

        head = ev(pg, "()=>{const t=(%s)(); return t?[...t.querySelectorAll('thead th')].map(x=>x.textContent.trim()):null;}" % TBL)
        ok(isinstance(head, list) and head and head[0] == "#",
           "%s · the table leads with a # column" % where, json.dumps(head))
        nums = ev(pg, "()=>{const t=(%s)(); return t?[...t.querySelectorAll('tbody tr:not(.mprow):not(.newrow) td.idx .idx-n')].map(s=>s.textContent.trim()):null;}" % TBL)
        ok(isinstance(nums, list) and nums == [str(i + 1) for i in range(len(nums))] and len(nums) > 1,
           "%s · every row is numbered, in order" % where, json.dumps(nums))

        before = cols(pg)
        ev(pg, "()=>{const c=document.querySelector('#panel .mpopen'); if(c)c.click();}")
        pg.wait_for_timeout(600)
        after = cols(pg)
        ok(before and after and before == after,
           "%s · opening the drawer moves no column" % where,
           "before %s after %s" % (json.dumps(before), json.dumps(after)))

        d = ev(pg, """()=>{const t=(%s)(); if(!t) return null;
          const dr=t.querySelector('tr.mprow'); if(!dr) return {noDrawer:true};
          const cells=[...dr.children];
          return {spans:cells.map(td=>td.colSpan), first:cells[0].className,
                  headSpan:[...t.querySelectorAll('thead th')].reduce((a,th)=>a+th.colSpan,0)};}""" % TBL)
        ok(isinstance(d, dict) and d.get("spans") and
           sum(d["spans"]) == d.get("headSpan") and len(d["spans"]) == 2 and
           d["spans"][0] == 1 and "idx" in (d.get("first") or ""),
           "%s · the months start at the second column, under the whole rest" % where,
           json.dumps(d))

        h = ev(pg, """()=>{const t=(%s)(); if(!t) return null;
          const r=[...t.querySelectorAll('tbody tr:not(.mprow):not(.newrow)')][0];
          return {row:Math.round(r.getBoundingClientRect().height),
                  cells:[...new Set([...r.children].map(td=>Math.round(td.getBoundingClientRect().height)))],
                  tgt:!!t.querySelector('.mpcell')};}""" % TBL)
        ok(isinstance(h, dict) and h.get("cells") and len(h["cells"]) == 1 and
           h["cells"][0] == h.get("row"),
           "%s · every cell fills its row, the target cell included" % where,
           json.dumps(h))
        ok(isinstance(h, dict) and h.get("tgt"),
           "%s · the box and the mark sit in a wrapper, not in the cell" % where)

        # ── the hover, on BOTH parities ───────────────────────────────────
        moved = []
        for i in (0, 1):
            pos = ev(pg, """(i)=>{const t=(%s)(); const rows=[...t.querySelectorAll('tbody tr:not(.mprow):not(.newrow)')];
              if(!rows[i]) return null; rows[i].scrollIntoView({block:'center'});
              const b=rows[i].getBoundingClientRect(); return {x:Math.round(b.x+b.width*0.55),y:Math.round(b.y+b.height/2),i:i};}""" % TBL, i)
            if not isinstance(pos, dict) or "x" not in pos: continue
            rest = ev(pg, """(i)=>{const t=(%s)(); const r=[...t.querySelectorAll('tbody tr:not(.mprow):not(.newrow)')][i];
              return [...r.children].map(td=>getComputedStyle(td).backgroundColor);}""" % TBL, i)
            pg.mouse.move(pos["x"], pos["y"]); pg.wait_for_timeout(220)
            hov = ev(pg, """(i)=>{const t=(%s)(); const r=[...t.querySelectorAll('tbody tr:not(.mprow):not(.newrow)')][i];
              return {on:r.matches(':hover'), bgs:[...r.children].map(td=>getComputedStyle(td).backgroundColor)};}""" % TBL, i)
            if isinstance(hov, dict) and hov.get("on"):
                moved.append((i, rest == hov.get("bgs")))
            pg.mouse.move(4, 4); pg.wait_for_timeout(120)
        ok(len(moved) == 2 and all(m[1] for m in moved),
           "%s · hovering changes nothing, on both parities" % where,
           json.dumps(moved))

        ok(not errs, "%s · no page error" % where, str(errs[:1]))
        pg.close()

    # ── 6 · the drag, and the STORED list ────────────────────────────────
    print("\n§ the drag reaches the plan")
    pg = b.new_page(viewport={"width": 1500, "height": 1000})
    errs = []; pg.on("pageerror", lambda e: errs.append(str(e)))
    page = land(pg, "unit")
    ok(openpen(pg, page), "the pen opens")
    was = ev(pg, "()=>UNITS.mobile.keyObjectives.map(m=>m.id||m.name)")
    grips = ev(pg, "()=>{const t=(%s)(); return t?t.querySelectorAll('tbody .grip').length:0;}" % TBL)
    ok(isinstance(grips, int) and grips >= 2, "the office gets a handle on every row",
       str(grips))
    # A REAL POINTER DRAG, and the distance matters: the insertion point is
    # found by closest edge, so a drop that stops short of the next row's
    # midpoint is a drag that correctly changes nothing (§101's makeSortable).
    box = ev(pg, """()=>{const t=(%s)(); const rows=[...t.querySelectorAll('tbody tr[data-oi]')];
      if (rows.length < 3) return null;
      const g=rows[0].querySelector('.grip'); if(!g) return null;
      rows[0].scrollIntoView({block:'center'});
      const a=g.getBoundingClientRect(), c=rows[2].getBoundingClientRect();
      return {fx:a.x+a.width/2, fy:a.y+a.height/2, ty:c.y+c.height*0.75};}""" % TBL)
    if isinstance(box, dict) and "fx" in box:
        pg.mouse.move(box["fx"], box["fy"]); pg.wait_for_timeout(80)
        pg.mouse.down(); pg.wait_for_timeout(80)
        for k in range(1, 13):
            pg.mouse.move(box["fx"], box["fy"] + (box["ty"] - box["fy"]) * k / 12)
            pg.wait_for_timeout(30)
        pg.wait_for_timeout(150); pg.mouse.up(); pg.wait_for_timeout(700)
    now = ev(pg, "()=>UNITS.mobile.keyObjectives.map(m=>m.id||m.name)")
    ok(isinstance(was, list) and isinstance(now, list) and len(was) == len(now) and
       sorted(map(str, was)) == sorted(map(str, now)) and was != now,
       "dragging a row reorders the STORED list", "%s -> %s" % (json.dumps(was), json.dumps(now)))
    ok(not errs, "no page error while dragging", str(errs[:1]))
    pg.close()

    # ── 7 · and NOT for somebody who may not arrange (§94.2) ─────────────
    print("\n§ both ends")
    # SINCE §94 THE OBJECTIVES PEN IS THE OFFICE'S, so there is no viewer who
    # can open this table and may not reorder it — which means the only honest
    # way to assert the shut end is to make the rule say no and watch the same
    # table draw. Asking a viewer who cannot open the pen at all would be an
    # absence over an empty table, which proves nothing (§113.8).
    pg = b.new_page(viewport={"width": 1500, "height": 1000})
    page = land(pg, "unit")
    openpen(pg, page)
    open_ = ev(pg, """()=>{const t=(%s)(); if(!t) return {noTable:true};
      return {grips:t.querySelectorAll('tbody .grip').length,
              nums:t.querySelectorAll('tbody td.idx .idx-n').length};}""" % TBL)
    shut = ev(pg, """()=>{
      if (typeof mayArrangeHere !== 'function') return {noRule:true};
      const real = mayArrangeHere;
      window.mayArrangeHere = function(){ return false; };
      mayArrangeHere = window.mayArrangeHere;
      paint();
      const t=(%s)();
      const out = t ? {grips:t.querySelectorAll('tbody .grip').length,
                       nums:t.querySelectorAll('tbody td.idx .idx-n').length}
                    : {noTable:true};
      mayArrangeHere = real; window.mayArrangeHere = real; paint();
      return out;
    }""" % TBL)
    ok(isinstance(open_, dict) and (open_.get("grips") or 0) > 0,
       "somebody who may arrange gets a handle on every row", json.dumps(open_))
    ok(isinstance(shut, dict) and shut.get("grips") == 0 and (shut.get("nums") or 0) > 0,
       "somebody who may not gets the numbers and no handle", json.dumps(shut))
    pg.close()

    # ── 8 · the pair, by its MARKS ───────────────────────────────────────
    print("\n§ the number and the handle")
    pg = b.new_page(viewport={"width": 1500, "height": 1000}, device_scale_factor=SCALE)
    page = land(pg, "fn")
    openpen(pg, page)
    # The handle is drawn at .55 opacity until the row is under the pointer,
    # and a faded bar is not a fair thing to measure a digit's ink against.
    pg.add_style_tag(content="td.idx .grip { opacity:1; }")
    pg.wait_for_timeout(200)
    h = pg.evaluate_handle("""()=>[...document.querySelectorAll('#panel td.idx')].find(td=>td.querySelector('.idx-n'))""")
    el = h.as_element()
    if not el:
        ok(False, "the # cell is there to measure")
    else:
        f = SHOTS / "smp-objidx.png"
        el.screenshot(path=str(f))
        off = inkOffset(f)
        if off == "no-PIL":
            print("  --   (Pillow absent: the ink measurement was skipped)")
        else:
            ok(off is not None and abs(off) <= 0.75,
               "the number and the handle are centred by their MARKS",
               "digit minus bars %s px" % off)
    pg.close()

    # ── 9 · the tactics table's four boxes stay in their cell ───────────
    print("\n§ the target's four boxes")
    pg = b.new_page(viewport={"width": 1500, "height": 1000})
    errs = []; pg.on("pageerror", lambda e: errs.append(str(e)))
    for W in (1920, 1600, 1500, 1440, 1300, 1100):
        pg.set_viewport_size({"width": W, "height": 1000})
        pg.goto("file://" + str(FILE)); pg.wait_for_timeout(1300)
        pg.select_option("#asWho", "smo"); pg.wait_for_timeout(250)
        ev(pg, "()=>{const b=document.querySelector('#units button[data-u=\"mobile\"]'); if(b)b.click();}")
        pg.wait_for_timeout(450)
        ev(pg, "()=>{const r=document.querySelector('.rail [data-urail]'); if(r)r.click();}")
        pg.wait_for_timeout(380)
        # MAKE Islam's row: a long name and an outcome carrying a target, which
        # is what puts the table under width pressure. The demo's first tactic
        # is short, so the squeeze is unreachable otherwise (§94.2).
        ev(pg, """(L)=>{ const t = UNITS.mobile.items[0].tactics[0];
          t.name = L; t.outcome = "Number of brands"; t.outTarget = "8#";
          t.outCompile = "Sum"; t.outDir = "\u2265"; paint(); }""",
           "Narrow CE & SDA portfolios to profitable, high-demand brands")
        pg.wait_for_timeout(300)
        openpen(pg, "plan")
        r = ev(pg, """()=>{
          const t=[...document.querySelectorAll('#panel table')]
            .find(x=>/Tactic/i.test((x.querySelector('thead')||{textContent:''}).textContent));
          if(!t) return {noTable:true};
          const td=t.querySelector('td.tgtcell, td.tgtcol');
          if(!td) return {noCell:true};
          const g=td.querySelector('.tgrid');
          if(!g) return {noGrid:true};
          const a=td.getBoundingClientRect(), c=g.getBoundingClientRect();
          return {td:Math.round(a.width), grid:Math.round(c.width),
                  over:Math.round(c.right-a.right), disp:getComputedStyle(td).display};}""")
        ok(isinstance(r, dict) and r.get("grid", 0) > 0 and r.get("over", 1) <= 0 and
           r.get("disp") == "table-cell",
           "the target's four boxes stay inside their cell at %d" % W, json.dumps(r))
    ok(not errs, "no page error while measuring the target cell", str(errs[:1]))
    pg.close()

    # ── 10 · the drawer's footer says it in words ────────────────────────
    print("\n§ the drawer's footer")
    pg = b.new_page(viewport={"width": 1500, "height": 1000})
    page = land(pg, "unit")
    openpen(pg, page)
    ev(pg, "()=>{const c=document.querySelector('#panel .mpopen'); if(c)c.click();}")
    pg.wait_for_timeout(600)
    txt = ev(pg, "()=>{const m=document.querySelector('.mpmsg'); return m?m.textContent:'';}")
    ok(isinstance(txt, str) and "yetUntil" not in txt and "yet Until" in txt,
       "the two halves of the sentence are separated", json.dumps(txt[:90]))
    rules = ev(pg, """()=>{
      const t=(%s)(); const r=[...t.querySelectorAll('tbody tr:not(.mprow):not(.newrow)')][0];
      return { list: (typeof SMPRules !== 'undefined' && SMPRules.COMPILES) || null };}""" % TBL)
    said = ev(pg, """(list)=>{
      // MAKE the state: twelve months set with no compile rule, which no demo
      // row is in — the sentence naming the rules is unreachable otherwise.
      const m = UNITS.mobile.keyObjectives[0];
      m.monthly = [1,2,3,4,5,6,7,8,9,10,11,12]; m.compile = "";
      paint();
      const el = document.querySelector('.mpmsg');
      return el ? el.textContent : '';
    }""", None)
    lst = rules.get("list") if isinstance(rules, dict) else None
    ok(isinstance(lst, list) and len(lst) >= 4 and isinstance(said, str) and
       all(str(x) in said for x in lst),
       "the sentence names every compile rule the platform has",
       "%s in %s" % (json.dumps(lst), json.dumps(said[-70:])))
    pg.close()
    b.close()

print("\n%d checks failed" % len(fails))
for f in fails: print("  FAIL", f)
sys.exit(0)
