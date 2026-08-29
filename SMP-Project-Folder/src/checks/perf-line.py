"""THE PERFORMANCE LINE, THE BANDS BUTTON, THREE BANDS, AND THE HOVER (§163).

Four asks from Islam plus one guard, all on or around a unit's Performance
page. What is asserted is the promise, never the mechanism (§94.8).

  1  The hover is the PRODUCT'S note, not the browser's. A `title` is not a
     failure the eye can see — it works, slowly, and on a tablet not at all —
     so the assertion is that the bubble is PAINTED on hover AND on focus,
     focus being what a tap gives you, and that no `title` is left to fire a
     second note underneath it.
  2  Report, Presentation and Bands share the Performance LINE, to its right.
  3  Bands opens, and shuts on a second press or a click outside.
  4  Three bands, reading 90+/70-89/below 70 — and the chart legend agrees with
     them, because it used to keep its own copy and that copy was already wrong.
  7  Nothing paints over the pinned pane title, at any width or scroll offset.

AND THE COLOUR BANNER IS GONE — asserted as an absence beside its replacement,
or a build that dropped both would pass (§94.2).
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


def open_perf(pg):
    el = pg.query_selector('#units [data-u="mobile"]')
    if el and el.is_visible():
        el.click(); pg.wait_for_timeout(520)
    for bt in pg.query_selector_all("#subtabs button[data-s]"):
        if (bt.text_content() or "").strip().lower().startswith("performance"):
            bt.click(); pg.wait_for_timeout(520); return True
    return False


with sync_playwright() as p:
    b = p.chromium.launch()
    pg = b.new_page(viewport={"width": 1180, "height": 700})
    errs = []
    pg.on("pageerror", lambda e: errs.append(str(e)))
    pg.goto(url); pg.wait_for_timeout(720)
    who = pg.eval_on_selector_all("#asWho option", "els=>els.map(e=>e.value)")
    pg.select_option("#asWho", who[0]); pg.wait_for_timeout(330)

    # ── 1 · the hover note (on the Plan page, where the two columns live)
    el = pg.query_selector('#units [data-u="mobile"]')
    if el: el.click(); pg.wait_for_timeout(520)
    note = pg.query_selector(".hasnote")
    ck("a value carries a note", bool(note))
    if note:
        attrs = pg.evaluate("""(e)=>({tip:e.getAttribute('data-tip'),
            title:e.getAttribute('title'), tab:e.getAttribute('tabindex')})""", note)
        ck("...it is the product's note, not the browser's",
           bool(attrs["tip"]) and not attrs["title"], attrs)
        ck("...and it can be reached by tap or keyboard", attrs["tab"] == "0", attrs)
        note.hover(); pg.wait_for_timeout(140)
        ck("...the bubble is painted on hover",
           pg.evaluate("(e)=>getComputedStyle(e,'::after').display", note) == "block")
        pg.mouse.move(4, 4); pg.wait_for_timeout(90)
        pg.evaluate("(e)=>e.focus()", note); pg.wait_for_timeout(140)
        # THE HALF A `title` COULD NEVER DO — a tablet has no hover.
        ck("...and on focus, which is what a tap gives",
           pg.evaluate("(e)=>getComputedStyle(e,'::after').display", note) == "block")

    # ── 1b · AND THE BUBBLE MUST FIT (§164). It centres on its own value, and
    # the two values that carry one are the LAST columns of the plan tables,
    # inside a box that is `overflow-x:auto` and therefore clips — Islam saw
    # the note with its right-hand end sliced off. Swept at the widths where
    # the pane is narrow enough to bite.
    #
    # ANCHORED OR CENTRED IS TOLD BY THE TRANSFORM, not by `left`: an element
    # placed with `right:0` still reports a used px `left`, so reading `left`
    # calls an anchored bubble centred and measures a box that is not there.
    # The first version of this did exactly that and reported a working fix as
    # 16px over.
    BUB = """() => {
      var worst = null;
      document.querySelectorAll('.hasnote').forEach(function(e){
        var s = getComputedStyle(e, '::after');
        if (s.display !== 'block') return;
        var er = e.getBoundingClientRect(), w = parseFloat(s.width);
        var box = e.closest('.tblscroll') || e.closest('.pane'); if (!box) return;
        var br = box.getBoundingClientRect();
        var centred = s.transform && s.transform !== 'none';
        var left = centred ? (er.left + er.width/2 - w/2) : (er.right - w);
        var over = Math.max(Math.round((left + w) - br.right), Math.round(br.left - left));
        if (over > 1 && (!worst || over > worst.over))
          worst = {over: over, txt: (e.textContent||'').trim(), centred: centred};
      });
      return worst;
    }"""
    for wpx in (1440, 1180, 900):
        pg.set_viewport_size({"width": wpx, "height": 800}); pg.wait_for_timeout(320)
        u = pg.query_selector('#units [data-u="mobile"]')
        if u and u.is_visible():
            u.click(); pg.wait_for_timeout(460)
        spans = pg.query_selector_all(".hasnote")
        ck("%d · values carrying a note were found" % wpx, len(spans) > 1, len(spans))
        bad_one = None
        for s in spans:
            try: s.hover(timeout=1200)
            except Exception: continue
            pg.wait_for_timeout(55)
            r = pg.evaluate(BUB)
            if r: bad_one = r; break
        ck("%d · no note opens past its box" % wpx, not bad_one, bad_one)
    pg.set_viewport_size({"width": 1180, "height": 700}); pg.wait_for_timeout(320)
    u = pg.query_selector('#units [data-u="mobile"]')
    if u and u.is_visible(): u.click(); pg.wait_for_timeout(460)

    # ── 2, 3, 4 · the Performance line
    ck("Performance opens", open_perf(pg))
    ck("the reading-the-colours banner is gone",
       pg.evaluate("()=>!document.querySelector('.bands')"))
    row = pg.evaluate("""()=>{
      var st=document.getElementById('subtabs'); if(!st) return null;
      var acts=st.querySelector('.tabacts'); if(!acts) return {noacts:true};
      var names=[].map.call(acts.querySelectorAll(':scope > button, :scope > details > summary'),
        function(e){ return (e.textContent||'').trim().replace(/[\\u25be\\u25b4]/g,'').trim(); });
      var sr=st.getBoundingClientRect(), ar=acts.getBoundingClientRect();
      var tabs=[].map.call(st.querySelectorAll('button[data-s]'), function(t){
        return Math.round(t.getBoundingClientRect().top); });
      return {names:names, rightGap:Math.round(sr.right-ar.right),
              sameLine: tabs.length ? Math.abs(Math.round(ar.top+ar.height/2)
                        - (tabs[0] + 16)) < 40 : false,
              actsTop:Math.round(ar.top), tabTop:tabs[0]};
    }""")
    ck("the controls are in the tab row", row and not row.get("noacts"), row)
    if row and not row.get("noacts"):
        ck("...all three of them, named", row["names"] == ["Report", "Presentation", "Bands"], row["names"])
        # RIGHT-ALIGNED IS THE ASK, so it is measured against the row's own
        # right edge rather than against a pixel count that a later gutter
        # change would falsify (§94.14).
        ck("...pushed to the right of the row", row["rightGap"] < 30, row)
        ck("...and on the same line as the tabs, not below them",
           abs(row["actsTop"] - row["tabTop"]) < 26, row)

    summ = pg.query_selector(".bandsmenu > summary")
    ck("the Bands button is there", bool(summ))
    if summ:
        # §145.14: a control in the tab row loses to `.tabs button` unless its
        # rule outranks it — it shipped once as plain words with no border.
        dressed = pg.evaluate("""(e)=>{var c=getComputedStyle(e);
          return {border:c.borderTopWidth, radius:c.borderTopLeftRadius}; }""", summ)
        ck("...and it is dressed as a button", dressed["border"] != "0px", dressed)
        summ.click(); pg.wait_for_timeout(300)
        rows = pg.evaluate("""()=>[].map.call(document.querySelectorAll('.bandslist div'),
              function(d){ return {t:(d.querySelector('b')||{}).textContent,
                                   r:(d.querySelector('span')||{}).textContent}; })""")
        ck("it opens", pg.evaluate("()=>{var d=document.querySelector('.bandsmenu');return !!(d&&d.open);}"))
        ck("...on three bands", len(rows) == 3, rows)
        ck("...reading 90+ / 70 to 89 / below 70",
           [r["r"] for r in rows] == ["90% and above", "70 to 89%", "below 70%"], rows)
        # THE PANEL MUST BE VISIBLE, NOT MERELY OPEN — the tab row clips
        # horizontally by default and this is the one thing that escapes it.
        vis = pg.evaluate("""()=>{var l=document.querySelector('.bandslist');
          if(!l) return null; var r=l.getBoundingClientRect();
          var e=document.elementFromPoint(r.left+r.width/2, r.top+12);
          return {h:Math.round(r.height), onTop: !!(e && l.contains(e))}; }""")
        ck("...and the panel is actually on screen", vis and vis["h"] > 40 and vis["onTop"], vis)
        pg.mouse.click(320, 520); pg.wait_for_timeout(260)
        ck("...it shuts on a click outside",
           pg.evaluate("()=>{var d=document.querySelector('.bandsmenu');return !!(d&&!d.open);}"))
        summ.click(); pg.wait_for_timeout(200)
        summ.click(); pg.wait_for_timeout(200)
        ck("...and on a second press of the button",
           pg.evaluate("()=>{var d=document.querySelector('.bandsmenu');return !!(d&&!d.open);}"))

    # ── 4 · ONE definition. The legend used to keep its own and disagree.
    leg = pg.evaluate("""()=>{
      var l=document.querySelector('.chart-legend');
      return l ? (l.textContent||'').replace(/\\s+/g,' ').trim() : null; }""")
    if leg:
        ck("the chart legend agrees with the bands",
           "90+" in leg and "under 70" in leg and "50" not in leg, leg)
    else:
        print("  note    no chart legend on this page — not asserted here")

    # ── 7 · nothing over the pinned title, swept
    found = None
    for w in (1440, 1180, 1024, 900, 860, 820, 800, 768):
        pg.set_viewport_size({"width": w, "height": 700}); pg.wait_for_timeout(320)
        el = pg.query_selector('#units [data-u="mobile"]')
        if el and el.is_visible():
            el.click(); pg.wait_for_timeout(430)
        for y in range(120, 1300, 25):
            pg.evaluate("(y)=>window.scrollTo(0,y)", y); pg.wait_for_timeout(18)
            r = pg.evaluate("""() => {
              var t=document.querySelector('.pane .pband'); if(!t) return null;
              var r=t.getBoundingClientRect(); if(r.height<2) return null;
              var pts=[[r.left+14,r.top+6],[r.left+r.width/2,r.top+r.height/2],
                       [r.right-14,r.bottom-6],[r.left+r.width/2,r.bottom-3]];
              for (var i=0;i<pts.length;i++){
                var e=document.elementFromPoint(pts[i][0],pts[i][1]);
                if (e && !t.contains(e) && e!==t)
                  return {w:Math.round(innerWidth), covered:e.tagName+'.'+
                    (typeof e.className==='string'?e.className.split(' ')[0]:''),
                    txt:(e.textContent||'').trim().slice(0,18)};
              }
              return null; }""")
            if r: found = (w, y, r); break
        if found: break
    ck("nothing paints over the pinned pane title, at any width or scroll", not found, found)

    ck("no page errors while driving", not errs, errs[:2])
    b.close()

print("perf-line: %s" % ("OK" if bad == 0 else "%d FAILURES" % bad))
raise SystemExit(1 if bad else 0)
