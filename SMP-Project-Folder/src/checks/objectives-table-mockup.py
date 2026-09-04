"""THE OBJECTIVES TABLE, WITH THE MONTHLY DRAWER IN IT (rule 1c).

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
          '<td class="mpidx"><span class="grip" title="Reorder" aria-hidden="true">' +
          '<svg viewBox="0 0 10 16" width="10" height="16"><g fill="currentColor">' +
          [0,1,2].map(row => [0,1].map(col =>
            '<circle cx="' + (2 + col*5) + '" cy="' + (3 + row*5) + '" r="1.3"/>').join('')).join('') +
          '</g></svg></span><span class="idx-n">' + n + '</span></td>');
    });
  }
  if (what.span) {
    const n = [...t.querySelectorAll('thead th')].reduce((a,th)=>a+th.colSpan,0);
    t.querySelectorAll('tr.mprow').forEach(dr => {
      const cells = [...dr.children];
      // keep exactly one cell and give it the whole width
      cells.slice(0, -1).forEach(c => c.remove());
      cells[cells.length-1].setAttribute('colspan', String(n));
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
  return {rowH:Math.round(r.getBoundingClientRect().height),
    name:Math.round(r.children[0].getBoundingClientRect().width),
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
