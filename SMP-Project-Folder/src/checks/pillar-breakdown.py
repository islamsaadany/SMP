"""A BREAKDOWN OF A PILLAR'S TARGETS (§339, spec 050).

Islam, of one of his own pillars: *"Maximizing Current Stores has its targets
broken down by category."* Five categories, each with a growth target, a
contribution-margin target and a share of the mix — fifteen numbers that had
nowhere to go, and which written as measures make the pillar read as though it
had nineteen headline targets rather than three and a table.

THE STATE IS MADE AND PUT BACK (§255, §94.2). No pillar in the worked example
carries a breakdown, so EVERY assertion here would pass on a build that lost
the feature entirely unless the fixture builds one first — and the fixture
must be undone, or every check that runs after this one measures a tenant this
one changed.

  1 · A PILLAR WITHOUT ONE IS UNTOUCHED, on all three panes. Both ends
      (§113.8): the pillar beside it, which HAS one, is asserted to draw it in
      the same run — a build that drew nothing anywhere satisfies half of this
      file perfectly.

  2 · THE PEN BUILDS IT. Every control PRESSED and the STORED plan read back
      (§96) — an editor wired to nothing renders identically and discards
      every keystroke.

  2b· AND IT FITS THE PANE, with the pen open, at three widths (§158). The
      head holds three controls in one cell, so `.fld { width:100% }` — the
      one line that stops an open register row growing its table (§110.8) —
      is what asked for 1286px inside a 660px cell and clipped two of them.

  3 · A COLUMN IS A KEY MEASURE WITH SEVERAL VALUES. Asserted as AGREEMENT
      with the platform's own scorer (§94.8) rather than against typed
      numbers, and the pillar's headline asserted to be the average of its
      measures AND its scored columns — with the card's own count and its
      Highest/Lowest agreeing, which is §264's fault waiting to happen again.

  4 · THE INDICATOR IS THE COLUMN WITH NO DIRECTION. It scores nothing, it
      joins no average, and a figure in it can never be at risk — so it never
      asks for a note, at any value.

  5 · SUBMIT WAITS FOR EVERY FIGURE (Islam's A, 2026-09-13, reversing the
      "optional to fill" reading of the extras). A blank cell is owed; the
      count moves by exactly the number of cells.

  6 · AND THE PROJECTOR SAYS WHAT THE PAGE SAYS — one slide, after that
      pillar's targets, with the same direction marks and the same colouring.

Point it at another build with SMP_BUILT to falsify it (§276: a broken build
is made from the SOURCES, because §238's hashed policy silences an edited
built file).
"""
import os, json
from playwright.sync_api import sync_playwright
HERE = os.path.dirname(os.path.abspath(__file__))
F = os.environ.get("SMP_BUILT",
    os.path.join(os.path.dirname(HERE), "strategy-management-platform.html"))
fails = []
def ok(label, cond, detail=""):
    if cond: print("  ok      " + label)
    else:
        fails.append(label); print("  FAIL    " + label + ("  — " + str(detail) if detail else ""))
def click(pg, sel, w=450):
    pg.evaluate("s=>{var b=document.querySelector(s); if(b) b.click();}", sel); pg.wait_for_timeout(w)

# The fixture, in the product's own minters — never a graph typed out here
# (§100.3: a fixture that models less than the thing it stands in for reports
# a working build as broken).
MAKE = """() => {
  const u = UNITS["mobile"], p = u.items[1];
  addBreakdown(p); const b = p.breakdown;
  b.cols[0].name = "Growth"; b.cols[0].dir = "\\u2265";
  const c2 = addBdCol(p); c2.name = "CM"; c2.dir = "\\u2265";
  const c3 = addBdCol(p); c3.name = "Mix"; c3.dir = "";
  /* Bakery's growth is deliberately OFF TRACK (4 against 7 scores 57), which
     is the row the note rule has to reach — and its Mix is off by as much,
     which it must NOT. */
  [["Bakery","7%","4%","69%","66%","13%","9%"],
   ["Barista","22%","27%","59%","62%","5%","5%"]].forEach(d => {
    const r = addBdRow(p); r.name = d[0];
    r["t_"+b.cols[0].id]=d[1]; r["a_"+b.cols[0].id]=d[2];
    r["t_"+c2.id]=d[3]; r["a_"+c2.id]=d[4];
    r["t_"+c3.id]=d[5]; r["a_"+c3.id]=d[6]; });
  RAIL["unit:mobile"] = p.code;
  return { code: p.code, cols: b.cols.map(c => c.id) };
}"""

with sync_playwright() as pw:
    b = pw.chromium.launch(executable_path=os.environ.get("SMP_CHROME"))
    pg = b.new_page(viewport={"width": 1600, "height": 900})
    pg.add_init_script("try{sessionStorage.setItem('smp.welcome.seen','1');sessionStorage.setItem('smp.welcome.done','1');sessionStorage.setItem('smp.tour.later','1');}catch(e){}")
    errs = []; pg.on("pageerror", lambda e: errs.append(str(e)))
    pg.goto("file://" + F); pg.wait_for_timeout(900)

    print("\n1 · a pillar without one is untouched, and one with it draws it")
    # BEFORE anything is made: the pane a breakdown would be on.
    pg.evaluate("()=>{ current='mobile'; RAIL['unit:mobile']=UNITS['mobile'].items[1].code; paint(); }")
    pg.wait_for_timeout(300)
    click(pg, "[data-s='strategy']"); click(pg, "[data-sub2='plan']")
    heads = lambda: pg.evaluate("""()=>[...document.querySelectorAll('#panel h4.mini, #panel h5.mini')]
        .map(h=>h.innerText.trim())""")
    before = heads()
    ok("with no breakdown the Plan page says nothing about one",
       not any("CATEG" in h.upper() or "BREAKDOWN" in h.upper() for h in before), before)
    made = pg.evaluate(MAKE)
    COLS = made["cols"]
    pg.evaluate("()=>paint()"); pg.wait_for_timeout(350)
    after = heads()
    ok("...and with one it draws its own section", 
       any("CATEGORIES" in h.upper() for h in after), after)
    # the OTHER pillar, in the same run
    pg.evaluate("()=>{ RAIL['unit:mobile']=UNITS['mobile'].items[0].code; paint(); }")
    pg.wait_for_timeout(350)
    other = heads()
    ok("the pillar beside it still says nothing about one",
       not any("CATEGORIES" in h.upper() for h in other), other)
    pg.evaluate("()=>{ RAIL['unit:mobile']=UNITS['mobile'].items[1].code; paint(); }")
    pg.wait_for_timeout(300)

    print("\n2 · the pen builds it, and every press reaches the stored plan")
    click(pg, '#secrow-in .secpen[data-page="plan"]', 600)
    state = lambda: pg.evaluate("""()=>{const b=UNITS['mobile'].items[1].breakdown;
      return b ? { name:b.name, cols:b.cols.map(c=>c.id+':'+(c.name||'')+':'+(c.dir||'-')),
                   rows:b.rows.map(r=>r.name) } : null;}""")
    s0 = state()
    ok("the pen draws the table's own name in a box",
       pg.evaluate("()=>!!document.querySelector('#panel input.bdname')"), "")
    ok("...and a name box and a direction picker per column",
       pg.evaluate("()=>document.querySelectorAll('#panel input.bdcol').length") == 3 and
       pg.evaluate("()=>document.querySelectorAll('#panel select.bddirsel').length") == 3, "")
    click(pg, '[data-rowadd^="bdcol|"]', 600)
    ok("+ adds a column, and the plan holds it", len(state()["cols"]) == 4, state())
    click(pg, '[data-rowadd^="bdrow|"]', 600)
    ok("Add a row adds a category", len(state()["rows"]) == 3, state())
    pg.eval_on_selector_all('[data-bdcoloff]', 'e=>e[e.length-1].click()'); pg.wait_for_timeout(600)
    ok("× removes a column", len(state()["cols"]) == 3, state())
    ok("...and takes that column's cells with it (§53.4)",
       pg.evaluate("""()=>{const b=UNITS['mobile'].items[1].breakdown;
         const live={}; b.cols.forEach(c=>live[c.id]=1);
         return b.rows.every(r=>Object.keys(r).filter(k=>/^[ta]_/.test(k))
           .every(k=>live[k.slice(2)]));}"""), "")
    # the new row goes again, so the fixture is what section 3 measures
    pg.eval_on_selector_all('[data-rowoff^="breakdown|"]', 'e=>e[e.length-1].click()')
    pg.wait_for_timeout(600)
    ok("...and removing the last-added row leaves the other two",
       len(state()["rows"]) == 2, state())
    # a target typed through the real box
    pg.evaluate("""()=>{const ins=[...document.querySelectorAll('#panel input.mono')]
      .filter(i=>i.closest('table') && i.closest('table').innerText.indexOf('Add a row')>-1);
      if(ins[0]){ins[0].value='8%'; ins[0].dispatchEvent(new Event('change',{bubbles:true}));}}""")
    pg.wait_for_timeout(500)
    ok("a target typed in the pen reaches the stored plan (§96)",
       pg.evaluate("()=>UNITS['mobile'].items[1].breakdown.rows[0]['t_"+COLS[0]+"']") == "8%",
       pg.evaluate("()=>UNITS['mobile'].items[1].breakdown.rows[0]"))
    pg.evaluate("()=>{UNITS['mobile'].items[1].breakdown.rows[0]['t_"+COLS[0]+"']='7%'; paint();}")
    pg.wait_for_timeout(300)

    # 2b · IT FITS THE PANE, AT EVERY WIDTH THE PAGE FITS AT (§158: fit,
    # never "and it scrolls"). With the pen OPEN, because that is the state
    # that carries controls — read mode is prose and shrinks with the window,
    # and this table's head holds three controls in one cell (§267's shape).
    # Islam reported it as *"the table is messed up not fitting in the box"*:
    # at 1600 a one-column table wanted 1851px in a 1285px box, so the
    # direction picker and the + were CLIPPED rather than drawn small. It is
    # WORST with one column, because a single head gets the whole free width
    # and both its boxes claim 633px each — this fixture builds THREE, which
    # share it, so a falsification here prints 264 over rather than 566.
    print("\n2b · the table fits its pane (§158)")
    FIT = """() => {
      const t = [...document.querySelectorAll('#panel table')]
        .filter(x => x.innerText.indexOf('Add a row') > -1 &&
                     x.querySelector('input.bdcol'))[0];
      if (!t) return null;
      const bx = t.closest('.tblscroll') || t.parentElement;
      const sel = t.querySelector('select.bddirsel');
      const xs = [...t.querySelectorAll('[data-bdcoloff]')];
      const x = xs[xs.length - 1];
      /* The VISIBLE right edge, never the scroll box's own right edge: a box
         that scrolls contains everything by definition, so measuring against
         `bx.getBoundingClientRect().right` passes on the very build this
         section exists to catch (§113.8). */
      const seen = bx.getBoundingClientRect().left + bx.clientWidth;
      return { over: Math.round(bx.scrollWidth - bx.clientWidth),
               box: Math.round(bx.clientWidth),
               sel: sel ? Math.round(sel.getBoundingClientRect().width) : 0,
               tw: Math.round(parseFloat(getComputedStyle(t)
                     .getPropertyValue('--tw')) || 0),
               xIn: !!(x && x.getBoundingClientRect().right <= seen + 1) };
    }"""
    for w in (1600, 1280, 1100):
        pg.set_viewport_size({"width": w, "height": 900}); pg.wait_for_timeout(400)
        m = pg.evaluate(FIT)
        ok("at %dpx the breakdown table fits its pane" % w,
           m is not None and m["over"] <= 0, m)
        # AT ITS OWN WIDTH, never "wide enough" — on the build before the fix
        # the picker was 293px, STRETCHED by `.fld { width:100% }` rather than
        # squeezed, so a minimum would have passed on it (§94.5). The number
        # is the product's own `--tw`, so a later change to that token stays
        # green and a picker that goes back to filling its cell does not.
        ok("...the direction picker is drawn at its own width, not its cell's",
           m is not None and m["tw"] > 0 and abs(m["sel"] - m["tw"]) <= 1, m)
        ok("...and the × of the last column is on screen, not off the end",
           m is not None and m["xIn"], m)
    pg.set_viewport_size({"width": 1600, "height": 900}); pg.wait_for_timeout(400)

    click(pg, '#secrow-in .secpen[data-page="plan"]', 600)   # close the pen

    print("\n3 · a column is a key measure with several values")
    sc = pg.evaluate("""()=>{ const p = UNITS['mobile'].items[1];
      const cols = SMPRules.bdCols(p);
      const mine = cols.filter(SMPRules.bdScored).map(c => {
        const v = SMPRules.bdRows(p).map(r => bdCellScore(r, c)).filter(x => x != null);
        return Math.round(v.reduce((a,x)=>a+x,0) / v.length); });
      const ms = scorableMeasures(p).map(m => measureScore(m));
      return { product: bdColScores(p), mine: mine,
               perf: pillarPerf(p),
               expect: Math.round(ms.concat(mine).reduce((a,x)=>a+x,0) / (ms.length + mine.length)),
               cell: bdCellScore(SMPRules.bdRows(p)[0], cols[0]),
               measures: ms.length, rows: p.measures.length }; }""")
    ok("the product's column scores agree with the arithmetic worked out here",
       sc["product"] == sc["mine"] and len(sc["mine"]) == 2, sc)
    ok("a cell scores as the platform's own scorer does (4 of 7 is 57)",
       sc["cell"] == 57, sc["cell"])
    ok("the pillar's headline is its measures AND its scored columns",
       sc["perf"] == sc["expect"], sc)
    card = pg.evaluate("""()=>{ current='mobile'; paint(); return null; }""")
    click(pg, "[data-s='performance']", 600)
    # THE PILLAR'S OWN CARD, not the unit's. The page draws the unit's three
    # headline cards first and the open pillar's pane below them, so the first
    # `.card.primary` on the page is the unit's objectives — measuring it
    # reported a correct build broken on this check's own first run.
    nums = pg.evaluate("""()=>{const cs=[...document.querySelectorAll('#panel .scores .card.primary')];
      const c = cs[cs.length - 1];
      if(!c) return null;
      return { measures: (c.querySelector('.minirow div b') || {}).textContent,
               hi: [...c.querySelectorAll('.minirow div')][1].querySelector('b').textContent,
               lo: [...c.querySelectorAll('.minirow div')][2].querySelector('b').textContent };}""")
    ok("the card counts the scored columns among its measures (§264)",
       nums and nums["measures"] == str(sc["rows"] + 2), {"card": nums, "sc": sc})

    print("\n4 · the indicator scores nothing and never asks for a note")
    # THE COLUMN HAS TO BE FOUND FIRST (§113.8, §94.5). Without this, a build
    # that scores EVERY column leaves `c` undefined, `bdCellScore(r, undefined)`
    # answers null, and all three assertions below go green on exactly the
    # build they exist to catch — which is what falsification B did.
    ind = pg.evaluate("""()=>{ const p=UNITS['mobile'].items[1];
      const c = SMPRules.bdCols(p).filter(x=>!SMPRules.bdScored(x))[0];
      if (!c) return { found:false };
      const r = SMPRules.bdRows(p)[0];
      const item = { id:r.id+'|'+c.id, obj:r, col:c, kind:'bdcell' };
      const was = r['a_'+c.id];
      r['a_'+c.id] = '1%';                       /* miles off its 13% target */
      const out = { score: bdCellScore(r,c), note: needsNote(item),
                    inScores: bdColScores(p).length };
      r['a_'+c.id] = was;
      out.found = true;
      return out; }""")
    ok("the table HAS a column with no direction to measure", ind.get("found") is True, ind)
    ok("an indicator cell scores nothing whatever its figure",
       ind.get("found") and ind["score"] is None, ind)
    ok("...so it never asks for a note", ind.get("note") is False, ind)
    ok("...and it joins no column average", ind.get("inScores") == 2, ind)
    bad = pg.evaluate("""()=>{ const p=UNITS['mobile'].items[1];
      const c = SMPRules.bdCols(p).filter(SMPRules.bdScored)[0];
      const r = SMPRules.bdRows(p)[0];
      return needsNote({ id:r.id+'|'+c.id, obj:r, col:c, kind:'bdcell' }); }""")
    ok("a SCORED cell at 57% does ask for one (§105)", bad is True, bad)

    print("\n5 · Submit waits for every figure (Islam's A)")
    gate = pg.evaluate("""()=>{ const p=UNITS['mobile'].items[1];
      const c = SMPRules.bdCols(p)[0], r = SMPRules.bdRows(p)[1];
      const was = r['a_'+c.id];
      const full = submitBlockers('mobile').owed;
      delete r['a_'+c.id];
      const short = submitBlockers('mobile').owed;
      const cells = bdCells(p).length;
      r['a_'+c.id] = was;
      return { full, short, cells,
               items: reportItems(UNITS['mobile']).filter(x=>x.kind==='bdcell').length }; }""")
    ok("every asked cell is an item on the ask list", gate["items"] == gate["cells"], gate)
    ok("...and a blank one is owed", gate["short"] == gate["full"] + 1, gate)

    print("\n5b · the figures are typed on the Reporting page")
    pg.evaluate("()=>{ current='mobile'; REPORTING='mobile'; paint(); }")
    pg.wait_for_timeout(500)
    rep = pg.evaluate("""()=>{
      const tbs=[...document.querySelectorAll('#panel table')]
        .filter(t=>t.innerText.indexOf('Bakery')>-1);
      if(!tbs.length) return { tables:0 };
      const t=tbs[0];
      return { tables: tbs.length,
        head: [...t.querySelectorAll('th')].map(x=>x.innerText.trim()),
        boxes: t.querySelectorAll('input[data-bdcol]').length,
        notes: t.querySelectorAll('[data-note]').length,
        rows: t.querySelectorAll('tbody tr').length,
        behind: [...t.querySelectorAll('tbody tr')][0].innerText.indexOf('/ 7%') > -1,
        wantnote: t.querySelectorAll('tr.wantnote').length }; }""")
    ok("the Reporting page draws the breakdown", rep.get("tables") == 1, rep)
    ok("...with a box per asked cell (three columns, two rows)",
       rep.get("boxes") == 6, rep)
    ok("...ONE note per row, not one per figure", rep.get("notes") == rep.get("rows"), rep)
    ok("...the target behind each box, so nobody has to remember it",
       rep.get("behind") is True, rep)
    ok("...and the row whose growth is off track is rung for a note",
       rep.get("wantnote") == 1, rep)
    typed = pg.evaluate("""()=>{ const p=UNITS['mobile'].items[1];
      const c=SMPRules.bdCols(p)[0], r=SMPRules.bdRows(p)[1];
      const el=document.querySelector('input[data-rep="'+r.id+'"][data-bdcol="'+c.id+'"]');
      if(!el) return null;
      el.value='31'; el.dispatchEvent(new Event('change',{bubbles:true}));
      return null; }""")
    pg.wait_for_timeout(500)
    ok("a figure typed reaches the stored cell, joined with its unit (§199)",
       pg.evaluate("()=>SMPRules.bdActual(SMPRules.bdRows(UNITS['mobile'].items[1])[1],"
                   " SMPRules.bdCols(UNITS['mobile'].items[1])[0])") == "31%",
       pg.evaluate("()=>SMPRules.bdRows(UNITS['mobile'].items[1])[1]"))
    pg.evaluate("()=>{ REPORTING=null; paint(); }"); pg.wait_for_timeout(300)

    print("\n6 · the projector says what the page says")
    deck = pg.evaluate("""()=>{ const html = deckHtmlFor('mobile');
      const d = document.createElement('div'); d.innerHTML = html;
      const sl = [...d.querySelectorAll('section')]
        .filter(s => s.innerText.indexOf('Bakery') > -1);
      if (!sl.length) return { slides: 0 };
      return { slides: sl.length,
               head: [...sl[0].querySelectorAll('th')].map(t=>t.innerText.trim()),
               banded: sl[0].querySelectorAll('td.final').length,
               anchor: sl[0].getAttribute('data-anchor'),
               note: sl[0].innerText.indexOf('Ramadan') > -1 }; }""")
    ok("the breakdown has one slide of its own", deck.get("slides") == 1, deck)
    ok("...its head carries the direction on the scored columns only",
       deck.get("head") and deck["head"][2].endswith("≥") and
       not deck["head"][4].endswith("≥"), deck.get("head"))
    ok("...only the scored cells are banded (one per row)",
       deck.get("banded") == 4, deck)
    ok("...and it carries its own anchor, clear of the measures slide's",
       deck.get("anchor", "").endswith("b"), deck.get("anchor"))

    print("\n7 · and the fixture is put back (§94.2)")
    pg.evaluate("()=>{ delete UNITS['mobile'].items[1].breakdown; paint(); }")
    pg.wait_for_timeout(300)
    ok("the pillar is byte-identical to one that never had a breakdown",
       pg.evaluate("()=>!('breakdown' in UNITS['mobile'].items[1])"), "")

    ok("no page error anywhere", not errs, errs[:3])
    b.close()

print("\n" + ("%d passed, %d failed" % (0, len(fails)) if False else
      "%d failed" % len(fails) if fails else "all breakdown checks passed"))
raise SystemExit(1 if fails else 0)
