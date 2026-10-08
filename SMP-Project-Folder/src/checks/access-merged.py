"""ONE ACCESS TABLE, AND A SEAT ON EVERY PILLAR (§508, spec 066 stage 2).

Islam signed off the mockup (2a23b8c): Setup › Roles & access becomes 8 rows by
6 columns — 48 cells where there were 117 — and every pillar gains a Custodian
seat beside its Owner. THE TABLE IS A VIEW, NEVER A NEW STORE: the stored map
keeps its 13 roles and its areas, and a drawn cell is every (role, area) pair
under it that can come up. So the claims here are about the VIEW agreeing with
what is stored, never about numbers typed into this file (§94.8).

  1 · THE SHAPE IS THE SHARED LIST'S. 8 rows and 6 columns, the names read off
      SMPRules.ACCESS_ROWS / ACCESS_COLS rather than typed here, and every one
      of the 48 cells drawn.

  2 · EVERY CELL AGREES WITH THE STORED PAIRS UNDER IT. Worked out in this
      file from the product's own grantFor() and accessNA(): a cell with no
      pair that can come up is a dash, one whose pairs agree lights exactly
      that answer, one whose pairs differ lights NOTHING.

  3 · A CELL THAT DIFFERS SAYS SO, AT BOTH ENDS (§94.2). The tray is marked,
      the hover names every pair and what it holds, and the line above the
      table counts them — and with every pair made to agree, the line is GONE
      rather than reading "0 cells" (§45.2). The state is MADE where the
      shipped defaults do not already hold one (§255).

  4 · A PRESS WRITES EVERY PAIR UNDER THE CELL AND NOTHING ELSE. Read off the
      stored map before and after, so a press that wrote one pair, or wrote a
      neighbour's, cannot pass (§96). Pressing the lit state writes none to
      all of them.

  5 · A PILLAR CAN NAME A CUSTODIAN. The pen draws the seat beside the Owner;
      a pick writes the STORED pillar and derives the Part owner role at that
      unit; clearing it DELETES the key (§50.6) and the role goes with it.

  6 · THE LINE ABOVE THE TABLE READS IN BOTH PALETTES (§38.5), measured as
      paint with the sweep's own arithmetic.

Point it at another build with SMP_BUILT to falsify it (§276: a broken build
is made from the SOURCES, because §238's hashed policy silences an edited
built file). Every probe degrades rather than dying (§215).
"""
import os
from playwright.sync_api import sync_playwright
HERE = os.path.dirname(os.path.abspath(__file__))
F = os.environ.get("SMP_BUILT",
    os.path.join(os.path.dirname(HERE), "strategy-management-platform.html"))
fails = []
def ok(label, cond, detail=""):
    if cond: print("  ok      " + label)
    else:
        fails.append(label); print("  FAIL    " + label + ("  — " + str(detail) if detail else ""))
def js(pg, src, arg=None):
    try: return pg.evaluate(src, arg) if arg is not None else pg.evaluate(src)
    except Exception as e: return {"__error": str(e)[:200]}

OPEN_ACCESS = """()=>{ var g=document.querySelector('[data-md="setup"]'); if(g) g.click(); }"""
GO_ACCESS = """()=>{ var a=document.querySelector('[data-setupgo="access"]'); if(a) a.click(); }"""

# What the table SHOULD draw, worked out here from the product's own readers
# (grantFor, accessNA) over the shared rows and columns — never typed.
EXPECT = r"""()=>{
  var R = SMPRules.ACCESS_ROWS, C = SMPRules.ACCESS_COLS, out = [];
  R.forEach(function(r){ C.forEach(function(c){
    var vals = [], pairs = [];
    r.of.forEach(function(rk){ c.areas.forEach(function(ak){
      if (accessNA(rk, ak)) return;
      var v = grantFor(rk, ak); pairs.push(rk+':'+ak);
      if (vals.indexOf(v) < 0) vals.push(v); }); });
    out.push({row:r.key, col:c.key, pairs:pairs,
              want: !pairs.length ? 'dash' : vals.length > 1 ? 'mixed' : vals[0]});
  }); });
  return out; }"""

READ = r"""()=>{
  var t = document.querySelector('.acgrid table'); if (!t) return null;
  var rows = [...t.querySelectorAll('tbody tr')];
  return { heads: [...t.querySelectorAll('thead th')].map(h=>h.textContent.trim()),
    names: rows.map(tr=>((tr.querySelector('.rolecell b')||{}).textContent||'').trim()),
    cells: rows.map(tr=>[...tr.querySelectorAll('td.ac')].map(td=>{
      var set = td.querySelector('.stset'), lit = td.querySelector('.stbtn.on');
      var st = !set ? 'dash' : lit ? (lit.className.match(/st-(\w+)/)||[])[1]
             : set.classList.contains('mixed') ? 'mixed' : 'none';
      var b = td.querySelector('.stbtn');
      return {st:st, title:td.getAttribute('title')||'',
              target: b ? (b.dataset.acm||'').split('|')[0] : null}; })),
    differ: (document.querySelector('p.acdiffer')||{}).textContent || null }; }"""

SNAP = r"""()=>{ var o={}; ROLES.map(r=>r.key).concat([SMPRules.NO_ROLE]).forEach(function(rk){
  AREAS.forEach(function(a){ o[rk+':'+a.key] = grantFor(rk, a.key); }); }); return o; }"""

with sync_playwright() as p:
    b = p.chromium.launch(executable_path=os.environ.get("SMP_CHROME") or None)
    pg = b.new_page(viewport={"width": 1500, "height": 1100})
    pg.add_init_script("try{sessionStorage.setItem('smp.welcome.seen','1');"
                       "sessionStorage.setItem('smp.welcome.done','1');"
                       "sessionStorage.setItem('smp.tour.later','1');}catch(e){}")
    errs = []; pg.on("pageerror", lambda e: errs.append(str(e)[:200]))
    pg.goto("file://" + F); pg.wait_for_timeout(1200)
    pg.select_option("#asWho", "smo"); pg.wait_for_timeout(400)
    js(pg, OPEN_ACCESS); pg.wait_for_timeout(400)
    js(pg, GO_ACCESS); pg.wait_for_timeout(700)

    print("\n1 · the shape is the shared list's")
    shape = js(pg, """()=>({rows:(SMPRules.ACCESS_ROWS||[]).map(r=>r.name),
      cols:(SMPRules.ACCESS_COLS||[]).map(c=>c.col||c.label),
      pairs:(SMPRules.ACCESS_COLS||[]).filter(c=>c.pair).map(c=>c.pair)})""")
    got = js(pg, READ)
    ok("the shared module names the rows and columns",
       isinstance(shape, dict) and len(shape.get("rows", [])) == 8 and len(shape.get("cols", [])) == 6, shape)
    ok("the page draws the table", isinstance(got, dict) and "cells" in got, got)
    if isinstance(got, dict) and "cells" in got and isinstance(shape, dict) and "rows" in shape:
        ok("its rows are the shared rows, in order", got["names"] == shape["rows"], got["names"])
        flat = [c for row in got["cells"] for c in row]
        ok("48 cells, six to a row", len(flat) == 48 and all(len(r) == 6 for r in got["cells"]),
           [len(r) for r in got["cells"]])
        ok("every column is named in the head", all(c in got["heads"] for c in shape["cols"]),
           got["heads"])
        ok("the paired columns share one name written once above them",
           all(got["heads"].count(n) == 1 for n in set(shape["pairs"])), got["heads"])

    print("\n2 · every cell agrees with the stored pairs under it")
    exp = js(pg, EXPECT)
    if isinstance(exp, list) and isinstance(got, dict) and "cells" in got:
        flat = [c for row in got["cells"] for c in row]
        bad = [(e["row"], e["col"], e["want"], d["st"]) for e, d in zip(exp, flat) if e["want"] != d["st"]]
        ok("all 48 agree", not bad and len(flat) == len(exp), bad[:6])
        badt = [(e["row"], e["col"]) for e, d in zip(exp, flat)
                if e["pairs"] and d["target"] is not None and sorted(d["target"].split(",")) != sorted(e["pairs"])]
        ok("and each press names exactly the pairs under its cell", not badt, badt[:4])
        kinds = set(e["want"] for e in exp)
        ok("the table holds a dash, a lit cell and a none (the fixture can tell them apart)",
           {"dash", "none"} <= kinds and bool(kinds & {"view", "edit", "fill"}), sorted(kinds))
        sup = [d["st"] for e, d in zip(exp, flat) if e["row"] in ("super", "smoteam") and e["col"] == "other"]
        ok("the office's Other boxes is a dash, not a refusal", sup == ["dash", "dash"], sup)
    else:
        ok("all 48 agree", False, exp)

    print("\n3 · a cell that differs says so — at both ends")
    # MAKE the state rather than relying on the shipped defaults (§255):
    # the Owner row's Reporting cell, its pairs set to two different answers.
    made = js(pg, r"""()=>{
      var r = SMPRules.ACCESS_ROWS.filter(x=>x.key==='owner')[0];
      var c = SMPRules.ACCESS_COLS.filter(x=>x.key==='rep')[0];
      var ps = [];
      r.of.forEach(rk=>c.areas.forEach(ak=>{ if(!accessNA(rk,ak)) ps.push([rk,ak]); }));
      window.__keep = ps.map(([rk,ak])=>[rk,ak,(ACCESS[rk]||{})[ak]]);
      // Neither answer is the 'view' §4 will press, so a press that wrote
      // only SOME pairs cannot pass by the rest already holding it (§113.8).
      ps.forEach(([rk,ak],i)=>{ (ACCESS[rk]=ACCESS[rk]||{})[ak] = i ? 'none' : 'edit'; });
      paint(); return ps.length; }""")
    pg.wait_for_timeout(400)
    ok("the fixture has more than one pair to disagree", isinstance(made, int) and made > 1, made)
    got = js(pg, READ)
    cell = None
    if isinstance(got, dict) and "cells" in got:
        ri = got["names"].index("Owner") if "Owner" in got["names"] else -1
        ci = [c["key"] for c in js(pg, "()=>SMPRules.ACCESS_COLS")].index("rep")
        cell = got["cells"][ri][ci] if ri >= 0 else None
    ok("the cell lights nothing", cell and cell["st"] == "mixed", cell)
    pairs = len(cell["target"].split(",")) if cell and cell["target"] else 0
    # The hover is "These differ underneath: A — x; B — y; C — z. Press …",
    # so one entry per pair is the "; "-separated list after the colon.
    listed = (cell["title"].split(":", 1)[1].split(". Press")[0].split("; ")
              if cell and ":" in cell["title"] else [])
    ok("its hover names every pair under it, and what each holds",
       cell and "differ" in cell["title"] and len(listed) == pairs
       and "may read and change" in cell["title"] and "no access" in cell["title"],
       {"pairs": pairs, "listed": len(listed), "title": cell and cell["title"]})
    tray = js(pg, r"""()=>{ var s=[...document.querySelectorAll('.acgrid .stset.mixed')][0];
      if(!s) return null; var cs=getComputedStyle(s);
      return {border:cs.borderTopStyle, w:parseFloat(cs.borderTopWidth)}; }""")
    ok("the tray is ringed", isinstance(tray, dict) and tray.get("border") == "solid" and tray.get("w", 0) >= 1, tray)
    ok("the line above the table names it",
       got and got.get("differ") and "Owner" in got["differ"] and "different answers" in got["differ"],
       got and got.get("differ"))

    print("\n4 · a press writes every pair under the cell, and nothing else")
    before = js(pg, SNAP)
    res = js(pg, r"""()=>{
      var td=[...document.querySelectorAll('.acgrid td.ac')].find(t=>t.querySelector('.stset.mixed')
        && (t.querySelector('.stbtn').dataset.acm||'').indexOf('owner:')===0);
      if(!td) return null;
      var b=[...td.querySelectorAll('.stbtn')].find(x=>(x.dataset.acm||'').endsWith('|view'));
      var t=b.dataset.acm.split('|')[0]; b.click(); return t; }""")
    pg.wait_for_timeout(400)
    after = js(pg, SNAP)
    under = (res or "").split(",") if isinstance(res, str) else []
    moved = sorted(k for k in (after or {}) if isinstance(before, dict) and before.get(k) != after.get(k))
    ok("every pair under it now reads 'may read'",
       bool(under) and isinstance(after, dict) and all(after.get(k) == "view" for k in under),
       {k: (after or {}).get(k) for k in under})
    ok("and nothing outside it moved",
       bool(under) and all(k in under for k in moved), [k for k in moved if k not in under])
    got = js(pg, READ)
    # The shipped defaults leave the Part owner row differing (its project
    # owner reads none in a unit and view in a function), so the line stays —
    # what must change is that it stops naming THIS cell. "Owner · " is
    # case-sensitive on purpose: "Part owner · …" does not contain it.
    ok("the line above the table stops naming the cell once its pairs agree",
       isinstance(got, dict) and "cells" in got and "Owner · This box: Reporting" not in (got.get("differ") or ""),
       got and got.get("differ"))
    res2 = js(pg, r"""(t)=>{
      var b=[...document.querySelectorAll('.acgrid .stbtn')].find(x=>(x.dataset.acm||'')===t+'|none');
      if(!b) return null; var on=b.classList.contains('on'); b.click(); return on; }""", res or "")
    pg.wait_for_timeout(400)
    after2 = js(pg, SNAP)
    ok("pressing the lit state again leaves every pair with no access",
       res2 is True and bool(under) and all((after2 or {}).get(k) == "none" for k in under),
       {k: (after2 or {}).get(k) for k in under})
    # Put the state back (§94.2): what was stored, including an absence.
    js(pg, r"""()=>{ (window.__keep||[]).forEach(([rk,ak,v])=>{
      if (v === undefined) { if (ACCESS[rk]) delete ACCESS[rk][ak]; }
      else (ACCESS[rk]=ACCESS[rk]||{})[ak]=v; }); paint(); }""")
    pg.wait_for_timeout(300)
    # The other end (§45.2, §94.2): with EVERY cell's pairs made to agree the
    # line is gone, not "0 cells" — and so is the legend's "differs" entry.
    # Made from a copy of the stored map and put back whole afterwards.
    agree = js(pg, r"""()=>{
      window.__all = JSON.stringify(ACCESS); var n = 0;
      SMPRules.ACCESS_ROWS.forEach(r=>SMPRules.ACCESS_COLS.forEach(c=>{
        var ps=[]; r.of.forEach(rk=>c.areas.forEach(ak=>{ if(!accessNA(rk,ak)) ps.push([rk,ak]); }));
        if (ps.length < 2) return;
        var v = grantFor(ps[0][0], ps[0][1]);
        ps.forEach(([rk,ak])=>{ if (grantFor(rk,ak)!==v){ (ACCESS[rk]=ACCESS[rk]||{})[ak]=v; n++; } }); }));
      paint(); return n; }""")
    pg.wait_for_timeout(400)
    got = js(pg, READ)
    leg = js(pg, r"""()=>[...document.querySelectorAll('.st-mixed')].length""")
    ok("with every cell agreeing, the line above the table is gone (§45.2)",
       isinstance(agree, int) and agree > 0 and isinstance(got, dict) and "cells" in got
       and not got.get("differ") and leg == 0, {"made": agree, "differ": got and got.get("differ"), "legend": leg})
    js(pg, r"""()=>{ if (window.__all){ var o=JSON.parse(window.__all);
      Object.keys(ACCESS).forEach(k=>delete ACCESS[k]); Object.assign(ACCESS,o); } paint(); }""")
    pg.wait_for_timeout(300)

    print("\n5 · a pillar can name a custodian")
    js(pg, "()=>{ current='mobile'; paint(); }"); pg.wait_for_timeout(400)
    js(pg, "()=>{var s=document.querySelector(\"[data-s='strategy']\"); if(s) s.click();}"); pg.wait_for_timeout(400)
    js(pg, "()=>{var s=document.querySelector(\"[data-sub2='plan']\"); if(s) s.click();}"); pg.wait_for_timeout(400)
    js(pg, "()=>{var s=document.querySelector('#secrow-in .secpen'); if(s) s.click();}"); pg.wait_for_timeout(800)
    seat = js(pg, r"""()=>{
      var rows=[...document.querySelectorAll('.pfront .pfrow')].map(r=>(r.querySelector('em')||{}).textContent);
      return rows; }""")
    ok("the pen draws Owner, then Custodian",
       isinstance(seat, list) and "Custodian" in seat and "Owner" in seat
       and seat.index("Custodian") == seat.index("Owner") + 1, seat)
    pick = js(pg, r"""()=>{
      var row=[...document.querySelectorAll('.pfront .pfrow')].find(r=>(r.querySelector('em')||{}).textContent==='Custodian');
      if(!row) return {none:true};
      var sel=row.querySelector('select');
      // Somebody who owns no pillar ANYWHERE yet, so "the role is at this
      // unit" and "the role goes with it" are about this seat alone.
      var noPart = p => !personRoles(p).some(r=>r.role==='plowner');
      var opt=[...sel.options].map(o=>o.value).filter(v=>{
        var p=PEOPLE.filter(x=>x.name===v)[0]; return v && p && noPart(p); })[0];
      var who=PEOPLE.filter(p=>p.name===opt)[0];
      sel.value=opt; sel.dispatchEvent(new Event('change',{bubbles:true}));
      return {opt:opt, who: who ? who.key : null}; }""")
    pg.wait_for_timeout(500)
    stored = js(pg, r"""(who)=>{
      var hit=UNITS.mobile.items.filter(x=>x.custodian)[0];
      var p=PEOPLE.filter(x=>x.key===who)[0];
      return {cust: hit ? hit.custodian : null, id: hit ? hit.id : null,
              roles: p ? personRoles(p).filter(r=>r.role==='plowner').map(r=>r.at) : null}; }""",
        (pick or {}).get("who") or "")
    ok("a pick writes the STORED pillar (§96)",
       isinstance(pick, dict) and pick.get("opt") and isinstance(stored, dict) and stored.get("cust") == pick["opt"],
       {"pick": pick, "stored": stored})
    ok("and derives the Part owner role at that unit",
       isinstance(stored, dict) and stored.get("roles") == ["mobile"], stored)
    clr = js(pg, r"""(id)=>{
      var row=[...document.querySelectorAll('.pfront .pfrow')].find(r=>(r.querySelector('em')||{}).textContent==='Custodian');
      if(!row) return {none:true};
      var sel=row.querySelector('select'); sel.value=''; sel.dispatchEvent(new Event('change',{bubbles:true}));
      var it=UNITS.mobile.items.filter(x=>x.id===id)[0];
      return {has: it ? Object.prototype.hasOwnProperty.call(it,'custodian') : null}; }""",
        (stored or {}).get("id") or "")
    pg.wait_for_timeout(300)
    gone = js(pg, r"""(who)=>{ var p=PEOPLE.filter(x=>x.key===who)[0];
      return p ? personRoles(p).filter(r=>r.role==='plowner').length : null; }""", (pick or {}).get("who") or "")
    ok("clearing it DELETES the key (§50.6)", isinstance(clr, dict) and clr.get("has") is False, clr)
    ok("and the role goes with it", gone == 0, gone)

    print("\n6 · the line above the table reads in both palettes")
    for theme in ("light", "dark"):
        js(pg, "(t)=>{ document.documentElement.setAttribute('data-theme', t); }", theme)
        js(pg, r"""()=>{ var r=SMPRules.ACCESS_ROWS.filter(x=>x.key==='owner')[0];
          var c=SMPRules.ACCESS_COLS.filter(x=>x.key==='rep')[0]; var i=0;
          r.of.forEach(rk=>c.areas.forEach(ak=>{ if(!accessNA(rk,ak)){
            (ACCESS[rk]=ACCESS[rk]||{})[ak] = i++ ? 'view' : 'edit'; } })); }""")
        js(pg, OPEN_ACCESS); pg.wait_for_timeout(300); js(pg, GO_ACCESS); pg.wait_for_timeout(500)
        ratio = js(pg, r"""()=>{
          var p=document.querySelector('p.acdiffer'); if(!p) return null;
          function rgb(s){var m=s.match(/[\d.]+/g).map(Number); return m;}
          function lum(c){ c=c.slice(0,3).map(v=>{v/=255; return v<=0.03928? v/12.92 : Math.pow((v+0.055)/1.055,2.4);});
            return 0.2126*c[0]+0.7152*c[1]+0.0722*c[2]; }
          var cs=getComputedStyle(p), f=rgb(cs.color), g=rgb(cs.backgroundColor);
          var a=lum(f), b=lum(g); return Math.round((Math.max(a,b)+0.05)/(Math.min(a,b)+0.05)*100)/100; }""")
        ok("%s: the line reads at 4.5:1 or better" % theme, isinstance(ratio, (int, float)) and ratio >= 4.5, ratio)
        js(pg, r"""()=>{ (window.__keep||[]).forEach(([rk,ak,v])=>{
          if (v === undefined) { if (ACCESS[rk]) delete ACCESS[rk][ak]; }
          else (ACCESS[rk]=ACCESS[rk]||{})[ak]=v; }); }""")
    js(pg, "()=>document.documentElement.removeAttribute('data-theme')")

    ok("no page errors", not errs, errs[:3])
    b.close()

print("\n" + ("%d FAILED" % len(fails) if fails else "all good"))
raise SystemExit(1 if fails else 0)
