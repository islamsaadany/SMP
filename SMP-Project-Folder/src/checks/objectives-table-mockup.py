"""THE OBJECTIVES TABLE, WITH THE MONTHLY DRAWER IN IT (rule 1c).

SECOND ROUND. Islam, of the first: *"as drawn yes but I'd rather keep the months
from the 2nd column of the objective not the numbering column"*, *"for the
hovering C remove it"*, and *"the number and the handle are a bit misalignment
they both needs to be centered vertically"*.

The drawer therefore keeps a blank cell under the `#` and spans everything after
it — which is what the key measures table has always done, and is only safe
BECAUSE the `#` column now exists: the squeeze was never the drawer's indent, it
was that the column left outside the span was the prose one.

AND THE GRIP IS THE PRODUCT'S OWN, three bars from `handle()` — the first round
drew an invented dotted mark, which is a mockup of what the product could look
like rather than of what it does (§41.9).

Islam, from his own tenant, in one message:
  1. *"trying t in the objectives the obecjtive part got damaged. shall it go
     below the whole objective columns to keep the table tidy?"*
  2. *"not sure why on the approaching of hte first row all turnd grey but the
     target cell turned white, and do you think the color change on hovering is
     helpful here given that the other row is already grey? or shall we cancel
     it for good"*
  3. *"the objectives needs a number column as well like the key measures of
     direction with a handle to move them as well"*

Every picture is shot out of the RUNNING platform, same build, same row, same
width — so what differs between them is the change and nothing else (§41.9).

His table is a SUPPORTING FUNCTION'S Overview objectives (`capKoEdit`): seven
columns, a Weight % where a unit has a 3-year target, and a WRAPPING name
(§226) — which is why his rows are 130px tall and the fault is loudest there.
Both shapes are shot, because a unit's objectives table has the same drawer.

Writes PNGs into design-mockups/objectives-table/shots/ and prints the pixels.
"""
import pathlib, json
from playwright.sync_api import sync_playwright

ROOT = pathlib.Path(__file__).resolve().parents[3]
FILE = ROOT / "SMP-Project-Folder/src/strategy-management-platform.html"
OUT = ROOT / "design-mockups/objectives-table/shots"
OUT.mkdir(parents=True, exist_ok=True)
CHROME = "/opt/pw-browsers/chromium"

# The proposal, injected over the live page. Three separable changes.
FIX_CSS = """
/* (2) THE CELL STOPS BEING THE FLEX CONTAINER. A `display:flex` td is no
   longer a table-cell: it does not stretch to the row's height, so in a tall
   row it paints its own 57px and the table's white shows under it. */
td[data-mptgt] { display:table-cell !important; }
td[data-mptgt] > .mpcell { display:flex; align-items:center; gap:8px; }
td[data-mptgt] > .mpcell > input.fld,
td[data-mptgt] > .mpcell > .tgrid { flex:1; min-width:0; }
td[data-mptgt] > .mpcell > .mpopen { flex:0 0 auto; }
/* (3) the # column, the measures table's own */
th.mpidx, td.mpidx { width:38px; text-align:center; font-family:var(--mono);
  font-size:11px; color:var(--ink-3); white-space:nowrap; }
/* CENTRED TO EACH OTHER. `vertical-align:middle` on the grip alone aligns its
   box to the text baseline plus half an x-height, which is not the middle of
   the number beside it — so both take it, and the pair is centred in the cell
   rather than merely near one another. Never `display:flex` on the td (§278.3
   is that exact mistake one column over). */
td.mpidx { vertical-align:middle; }
td.mpidx .grip, td.mpidx .idx-n { vertical-align:middle; }
td.mpidx .grip { margin-right:2px; height:18px; }
td.mpidx .idx-n { display:inline-block; min-width:14px; }
/* THE ACTIONS COLUMN KEEPS ITS LINE. The # column takes 63px, and on a unit's
   nine-column table that is enough to break the eye and Remove onto two lines
   — 57px row -> 74px, for a column holding two controls. Measured, not
   guessed: with this the row is 57px on both tables. */
td.mpacts { white-space:nowrap; }
"""

HOVER_B = """
/* B — ONE HOVER GROUND ON BOTH PARITIES. Today a striped row's zebra outranks
   the hover, so hovering every second row changes nothing at all (§267.1's
   rule, from the other side). */
.pane tbody tr:hover > td, .pane tbody tr:nth-child(even):hover > td,
#panel tbody tr:hover > td, #panel tbody tr:nth-child(even):hover > td
  { background: var(--line-soft, #E8ECF2) !important; }
"""
HOVER_C = """
/* C — NO HOVER AT ALL. The zebra already tells one row from the next. */
#panel tbody tr:hover > td, #panel tbody tr:nth-child(even):hover > td,
#panel .tblscroll tbody tr:hover > td.idx,
#panel .tblscroll tbody tr:hover > td.idx + td { background: inherit !important; }
#panel tbody tr:nth-child(even) > td { background: var(--zebra) !important; }
#panel tbody tr:nth-child(odd) > td { background: var(--surface) !important; }
"""

APPLY = """(what)=>{
  const T = () => [...document.querySelectorAll('#panel table')]
      .find(x => /Objective/i.test((x.querySelector('thead')||{textContent:''}).textContent));
  const t = T(); if (!t) return 'no table';
  if (what.cell) {
    document.querySelectorAll('td[data-mptgt]').forEach(td => {
      if (td.querySelector('.mpcell')) return;
      const w = document.createElement('div'); w.className = 'mpcell';
      while (td.firstChild) w.appendChild(td.firstChild);
      td.appendChild(w);
    });
  }
  if (what.idx) {
    [...t.querySelectorAll('tbody tr:not(.mprow):not(.newrow)')].forEach(r => {
      const last = r.children[r.children.length - 1];
      if (last) last.classList.add('mpacts');
    });
    const hr = t.querySelector('thead tr');
    if (!hr.querySelector('th.mpidx'))
      hr.insertAdjacentHTML('afterbegin', '<th class="mpidx">#</th>');
    let n = 0;
    [...t.querySelectorAll('tbody tr')].forEach(r => {
      if (r.classList.contains('mprow')) {
        if (!r.querySelector('td.mpidx'))
          r.insertAdjacentHTML('afterbegin', '<td class="mpidx"></td>');
        return;
      }
      if (r.classList.contains('newrow')) {
        if (!r.querySelector('td.mpidx'))
          r.insertAdjacentHTML('afterbegin', '<td class="mpidx"></td>');
        return;
      }
      n++;
      if (!r.querySelector('td.mpidx'))
        r.insertAdjacentHTML('afterbegin',
          '<td class="mpidx"><span class="grip" role="button" tabindex="0"' +
          ' title="Drag to reorder"><i></i><i></i><i></i></span>' +
          '<span class="idx-n">' + n + '</span></td>');
    });
  }
  if (what.span) {
    // ISLAM'S: the months start at the SECOND column, so the blank cell under
    // the # stays and the drawer spans everything after it.
    const n = [...t.querySelectorAll('thead th')].reduce((a,th)=>a+th.colSpan,0);
    t.querySelectorAll('tr.mprow').forEach(dr => {
      const cells = [...dr.children];
      const keep = cells[cells.length-1];
      cells.slice(0, -1).forEach((c,i) => { if (i > 0) c.remove(); });
      keep.setAttribute('colspan', String(n - 1));
    });
  }
  return 'ok';
}"""

MEAS = """()=>{
  const t=[...document.querySelectorAll('#panel table')]
    .find(x=>/Objective/i.test((x.querySelector('thead')||{textContent:''}).textContent));
  const r=[...t.querySelectorAll('tbody tr:not(.mprow):not(.newrow)')][0];
  const dr=t.querySelector('tr.mprow');
  const cells=[...r.children].map(td=>({c:td.className||'-',
    w:Math.round(td.getBoundingClientRect().width),
    h:Math.round(td.getBoundingClientRect().height),
    bg:getComputedStyle(td).backgroundColor}));
  const heads=[...t.querySelectorAll('thead th')].map(th=>th.textContent.trim());
  const oi=heads.indexOf('Objective');
  return {rowH:Math.round(r.getBoundingClientRect().height),
    name:Math.round(r.children[oi].getBoundingClientRect().width),
    tallest:Math.max.apply(null,[...r.children].map(td=>{
      let m=0; [...td.querySelectorAll('*')].forEach(k=>{const h=k.getBoundingClientRect().height; if(h>m)m=h;}); return m;})),
    tallCell:[...r.children].map((td,i)=>(heads[i]||'?')+' w'+Math.round(td.getBoundingClientRect().width)+' h'+Math.round(td.getBoundingClientRect().height)),
    tgt:(cells.find(c=>/cc/.test(c.c))||{}),
    grounds:[...new Set(cells.map(c=>c.bg))],
    heights:[...new Set(cells.map(c=>c.h))],
    drawer: dr?[...dr.children].map(td=>td.colSpan):null,
    table:Math.round(t.getBoundingClientRect().width)};
}"""


def land(pg, where):
    pg.goto("file://" + str(FILE)); pg.wait_for_timeout(1400)
    pg.select_option("#asWho", "smo"); pg.wait_for_timeout(250)
    if where == "fn":
        pg.evaluate("()=>{const f=document.querySelector('#units [data-fold]'); if(f)f.click();}")
        pg.wait_for_timeout(350)
        pg.evaluate("()=>{const b=document.querySelector('#units button[data-u=\"fn:finance\"]'); if(b)b.click();}")
        pg.wait_for_timeout(500)
        sec, page = "Overview", "capfoundation"
    else:
        pg.click('#units button[data-u="mobile"]'); pg.wait_for_timeout(450)
        sec, page = "Foundation", "foundation"
    pg.evaluate("()=>{const t=[...document.querySelectorAll('.tabs button')].find(b=>/Strategy/i.test(b.textContent)); if(t)t.click();}")
    pg.wait_for_timeout(350)
    pg.evaluate("(s)=>{const x=[...document.querySelectorAll('#secrow-in button,.secrow button')].find(b=>new RegExp(s,'i').test(b.textContent)); if(x)x.click();}", sec)
    pg.wait_for_timeout(450)
    # A NAME LONG ENOUGH TO WRAP, which is what makes his rows 130px tall.
    pg.evaluate("""(w)=>{
      const list = w === 'fn'
        ? ((GROUP.capabilities||[]).filter(c=>c.fn==='finance')[0]||{}).keyObjectives
        : UNITS.mobile.keyObjectives;
      if (list && list[0]) list[0].name = 'Achieve revenue target';
      paint();
    }""", where)
    pg.wait_for_timeout(400)
    if not pg.evaluate("(p)=>!!(typeof EDIT_PAGE!=='undefined' && EDIT_PAGE[p])", page):
        pg.evaluate("()=>{const p=document.querySelector('#secrow-in .secpen,#panel [data-edit],#panel .penbtn'); if(p)p.click();}")
        pg.wait_for_timeout(800)
    pg.evaluate("()=>{const c=document.querySelector('#panel .mpopen'); if(c)c.click();}")
    pg.wait_for_timeout(600)


def hover_first(pg):
    pos = pg.evaluate("""()=>{const t=[...document.querySelectorAll('#panel table')]
      .find(x=>/Objective/i.test((x.querySelector('thead')||{textContent:''}).textContent));
      const r=[...t.querySelectorAll('tbody tr:not(.mprow):not(.newrow)')][0];
      r.scrollIntoView({block:'center'}); const b=r.getBoundingClientRect();
      return {x:Math.round(b.x+30), y:Math.round(b.y+b.height/2)};}""")
    pg.mouse.move(pos["x"], pos["y"]); pg.wait_for_timeout(280)


def shot(pg, name):
    h = pg.evaluate_handle("""()=>[...document.querySelectorAll('#panel table')]
        .find(x=>/Objective/i.test((x.querySelector('thead')||{textContent:''}).textContent))
        .closest('.scroll') || [...document.querySelectorAll('#panel table')]
        .find(x=>/Objective/i.test((x.querySelector('thead')||{textContent:''}).textContent))""")
    el = h.as_element()
    if not el:
        print("  MISSING", name); return
    el.screenshot(path=str(OUT / (name + ".png")))
    print("  shot", name)


with sync_playwright() as pw:
    b = pw.chromium.launch(executable_path=CHROME,
                           args=["--no-sandbox", "--disable-dev-shm-usage"])
    for where in ("fn", "unit"):
        pg = b.new_page(viewport={"width": 1500, "height": 1000}, device_scale_factor=2)
        errs = []; pg.on("pageerror", lambda e: errs.append(str(e)))

        land(pg, where); hover_first(pg)
        print(where, "TODAY   :", json.dumps(pg.evaluate(MEAS)))
        shot(pg, where + "-today")

        pg.add_style_tag(content=FIX_CSS)
        # HIS C: the hover goes. Applied before the proposal is shot, so every
        # picture below shows the table as it would actually be.
        pg.add_style_tag(content=HOVER_C)
        pg.evaluate(APPLY, {"cell": True, "idx": True, "span": True})
        pg.wait_for_timeout(200)
        # §267.2: a growing box is sized by MEASURING its text at paint time, so
        # widening its column without re-fitting leaves a height measured at the
        # old width. Real code repaints; the injection has to re-fit by hand or
        # the picture shows a fault the proposal does not have.
        pg.evaluate("()=>{ if (typeof growFields === 'function') growFields(); }")
        pg.wait_for_timeout(400); hover_first(pg)
        print(where, "PROPOSED:", json.dumps(pg.evaluate(MEAS)))
        shot(pg, where + "-proposed")

        if where == "fn":
            # THE PAIR, CLOSE UP: the grip and the number as they align today
            # and as they align centred. Same cell, same build.
            for tag, css in (("grip-today",
                              "td.mpidx .grip, td.mpidx .idx-n { vertical-align:baseline !important; }"),
                             ("grip-centred", "")):
                if css: pg.add_style_tag(content=css)
                else: pg.add_style_tag(content="td.mpidx .grip, td.mpidx .idx-n { vertical-align:middle !important; }")
                pg.wait_for_timeout(200)
                h = pg.evaluate_handle("""()=>[...document.querySelectorAll('#panel td.mpidx')].find(td=>td.querySelector('.grip'))""")
                el = h.as_element()
                if el:
                    el.screenshot(path=str(OUT / (tag + ".png")))
                    print("  shot", tag, pg.evaluate("""()=>{const td=[...document.querySelectorAll('#panel td.mpidx')].find(t=>t.querySelector('.grip'));
                      const g=td.querySelector('.grip').getBoundingClientRect(), n=td.querySelector('.idx-n').getBoundingClientRect();
                      return {gripMid:Math.round(g.y+g.height/2), numMid:Math.round(n.y+n.height/2),
                              off:Math.round((g.y+g.height/2)-(n.y+n.height/2))};}"""))
        if False:
            for tag, css in (("hoverB", HOVER_B), ("hoverC", HOVER_C)):
                pg.add_style_tag(content=css)
                # shoot the EVEN row hovered, which is the half that says nothing today
                pos = pg.evaluate("""()=>{const t=[...document.querySelectorAll('#panel table')]
                  .find(x=>/Objective/i.test((x.querySelector('thead')||{textContent:''}).textContent));
                  const rows=[...t.querySelectorAll('tbody tr:not(.mprow):not(.newrow)')];
                  const r=rows[1]||rows[0]; r.scrollIntoView({block:'center'});
                  const b=r.getBoundingClientRect(); return {x:Math.round(b.x+30),y:Math.round(b.y+b.height/2)};}""")
                pg.mouse.move(pos["x"], pos["y"]); pg.wait_for_timeout(280)
                print(where, tag, json.dumps(pg.evaluate("""()=>{const t=[...document.querySelectorAll('#panel table')]
                  .find(x=>/Objective/i.test((x.querySelector('thead')||{textContent:''}).textContent));
                  const rows=[...t.querySelectorAll('tbody tr:not(.mprow):not(.newrow)')];
                  return {even:getComputedStyle(rows[1].children[1]).backgroundColor,
                          odd:getComputedStyle(rows[0].children[1]).backgroundColor};}""")))
                shot(pg, where + "-" + tag)
        print(where, "errors:", errs or "none")
        pg.close()
    b.close()
