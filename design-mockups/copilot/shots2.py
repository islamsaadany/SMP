# Round 2 mockup shots for the Copilot tab (decisions v0.4 §3.2 roads, §4.6
# company-level assignment; plan §7-§8). Reuses round 1's helpers by running
# the part of shots.py above its screenshot block, so round 1 stays exactly
# reproducible by running shots.py on its own. Not a check.
import pathlib
_src = (pathlib.Path(__file__).parent / "shots.py").read_text()
exec(_src.split("with sync_playwright() as p:")[0])

CSS2 = r"""
.cx-clip{display:inline-flex;align-items:center;justify-content:center;width:38px;height:38px;flex:none;border:1px solid var(--line);border-radius:var(--r-sm);color:var(--stone);background:var(--surface)}
.cx-clip svg{width:18px;height:18px}
.cx-compcol{flex:1;display:flex;flex-direction:column;gap:8px;min-width:0}
.cx-file{display:inline-flex;align-items:center;gap:8px;border:1px solid var(--line);border-radius:var(--r-sm);background:var(--surface);padding:6px 10px;font-size:12.5px;color:var(--ink-2);max-width:100%;align-self:flex-start}
.cx-file svg{width:16px;height:16px;flex:none;color:var(--stone)}
.cx-file b{color:var(--ink);font-weight:600}
.cx-file .cx-x{margin-left:4px;color:var(--ink-3);font-weight:700}
.chbod .cx-file{display:flex;width:fit-content;margin-top:8px}
.cx-own{display:inline-flex;align-items:center;justify-content:space-between;gap:8px;min-width:150px;border:1px solid var(--line);border-radius:var(--r-sm);padding:5px 9px;background:var(--surface);font-size:13px;color:var(--ink)}
.cx-own::after{content:"";width:7px;height:7px;border-right:1.5px solid var(--ink-3);border-bottom:1.5px solid var(--ink-3);transform:rotate(45deg) translateY(-2px)}
.cx-own.cx-unas{color:var(--warn-tx);border-color:var(--warn)}
.cx-prop{font-size:11px;color:var(--ink-3);margin-left:8px;font-style:italic}
.cx-otbl{width:100%;border-collapse:collapse;min-width:0}
.cx-otbl th{font:700 10.5px var(--sans);letter-spacing:.1em;text-transform:uppercase;color:var(--ink-3);text-align:left;padding:6px 10px;border-bottom:1px solid var(--line);background:none}
.cx-otbl td{padding:9px 10px;border-bottom:1px solid var(--line-soft);font-size:13.5px;color:var(--ink);vertical-align:middle;background:none}
.cx-otbl td.cx-n{color:var(--ink-3);width:28px}
.cx-otbl tr:hover td{background:none}
.cx-kind.cx-from{background:var(--surface-2);color:var(--stone);border:1px solid var(--line)}
.cx-kind.cx-ro{background:var(--surface-2);color:var(--ink-3);border:1px dashed var(--line)}
.cx-link{font:600 12.5px var(--sans);color:var(--stone);text-decoration:underline}
.cx-rolock{color:var(--ink-3);font-size:12px}
"""

CLIP = ('<svg viewBox="0 0 20 20" aria-hidden="true"><path d="M13.5 6.5 7.7 12.3a1.6 1.6 0 0 0 2.3 2.3l6-6a3.2 3.2 0 0 0-4.5-4.5l-6.1 6.1a4.8 4.8 0 0 0 6.8 6.8l5.3-5.3" '
        'fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/></svg>')
DOC = ('<svg viewBox="0 0 16 16" aria-hidden="true"><path d="M4 1.5h5.5L13 5v9.5H4z M9.5 1.5V5H13" fill="none" stroke="currentColor" stroke-width="1.3" stroke-linejoin="round"/></svg>')

def fchip(name, kind, size, x=False):
    return ('<span class="cx-file" title="Stored with this chat">' + DOC + '<span><b>' + name + '</b> &middot; ' + kind + ' &middot; ' + size + '</span>'
            + ('<span class="cx-x" title="Remove">&times;</span>' if x else '') + '</span>')

def comp(ph, staged=''):
    return ('<div class="cop-comp"><span class="cx-clip" title="Attach a Word, PDF or Excel file">' + CLIP + '</span>'
            '<div class="cx-compcol">' + staged + '<div class="ta">' + ph + '</div></div><span class="send">Send</span></div>')

def draw2(pg, sel, rail, pane):
    draw(pg, sel, rail, pane)
    pg.evaluate("c=>{const s=document.createElement('style');s.textContent=c;document.head.appendChild(s)}", CSS2)
    pg.wait_for_timeout(150)

# One-company client: relabel the chrome of the demo page so it reads as El Abd.
ELABD = r"""(sel)=>{
  document.getElementById('orgname').textContent='El Abd';
  const s=document.querySelector('#topsel > summary'); if(s) s.firstChild.textContent='El Abd';
  const sw=document.querySelector('#units .navswitch'); if(sw) sw.style.display='none';
  const ns=document.getElementById('navscroll');
  ns.innerHTML=['Sales','Operations','HR','Finance'].map(n=>'<button role="tab" data-u="x'+n+'" aria-selected="'+(n===sel)+'">'+n+'</button>').join('');
  if (sel) { const sm=document.querySelector('#topsel > summary'); if(sm) sm.setAttribute('aria-selected','false'); }
  const w=document.getElementById('asWho'); if(w) [...w.options].forEach(o=>{o.textContent=o.textContent.replace('the group','El Abd')});
  document.querySelectorAll('.top .sslabel').forEach(e=>{e.textContent=e.textContent.replace('the group','El Abd')});
  document.querySelectorAll('.top *').forEach(e=>{ if(e.children.length===0 && /Raya/.test(e.textContent)) e.textContent=e.textContent.replace(/Raya Trade/g,'El Abd'); });
}"""

it = lambda name, meta, on=False: '<div class="cop-it'+(' on' if on else '')+'"><b>'+name+'</b><small>'+meta+'</small></div>'
NEWC = '<button class="cop-new">+ New chat</button>'
def rail(title, dels, chats):
    return ('<div class="rhead"><span class="rhl">'+title+'</span></div>'+NEWC+'<div class="cop-gh">Deliverables</div>'+dels+'<div class="cop-gh">Chats</div>'+chats+'<div style="height:10px"></div>')
me = lambda t, extra='': '<div class="chmsg chme"><span class="chwho">Islam Saadany</span><div class="chbod">'+t+extra+'</div></div>'
ai = lambda t: '<div class="chmsg chthem"><span class="chwho">Copilot</span><div class="chbod">'+t+'</div></div>'

ELABD_CTX = '<span class="i" title="What the chat can see: El Abd&rsquo;s structure, its live plan and its reported figures">i</span>El Abd &middot; planned as one company &middot; 2 units &middot; 2 functions &middot; Q3 reported'

DIRS = [("Grow modern-trade share in the Delta", "Sales", True),
        ("Cut order-to-delivery time to 48 hours", "Operations", True),
        ("Build a second production line by 2028", "Operations", True),
        ("Make every branch manager a certified coach", "HR", False),
        ("Enter two export markets", None, False)]

with sync_playwright() as p:
    b = p.chromium.launch(executable_path="/opt/pw-browsers/chromium-1194/chrome-linux/chrome")

    # 8. Roads offered inside the chat (Foundation)
    body = (me('Build Mobile&rsquo;s foundation.')
      + ai('Mobile has no foundation on its shelf yet. I can take you through it one question at a time, which usually works best. Or pick another way:'
           '<div class="cop-acts"><span class="cop-btn cx-go">Guided questions (recommended)</span><span class="cop-btn">Upload notes</span>'
           '<span class="cop-btn" title="Download the multi-stakeholder template, fill it outside, bring it back">Template</span>'
           '<span class="cop-btn">Import a finished foundation</span></div>'))
    r = rail('Foundation &middot; Mobile', '<div class="cop-it"><small>Nothing saved here yet.</small></div>', it('Mobile&rsquo;s foundation', 'Today &middot; Islam Saadany', True))
    pg = page(b); draw2(pg, "Foundation", r, '<div class="cop-ctx">'+MOBILE_CTX+'<span class="t">Mobile&rsquo;s foundation</span></div><div class="cop-body">'+body+'</div>'+comp('Ask about Mobile&rsquo;s foundation&hellip;'))
    pg.screenshot(path=str(OUT/"8-roads.png"), clip={"x":0,"y":0,"width":1500,"height":900}); pg.close()

    # 9. The AI picks a road itself (Analysis)
    body = (me('Here are the notes from the kick-off interviews.', fchip('Kick-off interviews.docx', 'Word', '240 KB'))
      + me('Update Mobile&rsquo;s internal analysis.')
      + ai('I can see Q3 is reported and there&rsquo;s an interview file in this chat, so I&rsquo;ll work from those. Say if you&rsquo;d rather be asked.'
           '<div class="cop-acts"><span class="cop-btn">Ask me instead</span><span class="cop-btn">Use the template</span></div>')
      + ai('<dl class="cx-play"><dt>Understood</dt><dd>You want Mobile&rsquo;s internal analysis updated.</dd>'
           '<dt>Working from</dt><dd>Mobile&rsquo;s Q3 figures &middot; Kick-off interviews.docx</dd>'
           '<dt>Missing</dt><dd class="cx-miss">Nothing on the app team&rsquo;s capacity. I&rsquo;ll mark items that need it.</dd></dl>'))
    pg = page(b); draw2(pg, "Analysis", rail_analysis('c1').replace('Refresh the SWOT after Q3','Update the internal analysis'),
        '<div class="cop-ctx">'+MOBILE_CTX+'<span class="t">Update the internal analysis</span></div><div class="cop-body">'+body+'</div>'+comp('Ask about Mobile&rsquo;s analysis&hellip;'))
    pg.screenshot(path=str(OUT/"9-road-picked.png"), clip={"x":0,"y":0,"width":1500,"height":900}); pg.close()

    # 10. Attaching a file, and the file named as evidence
    body = (me('Use this for the channel side.', fchip('Channel review Q3.pdf', 'PDF', '1.2 MB'))
      + ai('Read it: 14 pages. I&rsquo;ll name it on anything I take from it.')
      + ai('Two channel items for the SWOT:'
           '<div class="cx-sw"><div><h5>Strengths</h5><ul><li>Dealer network covers 92% of target districts <span class="cx-ev">Channel review Q3.pdf</span></li></ul></div>'
           '<div><h5>Weaknesses</h5><ul><li>Online share flat at 6% for three quarters <span class="cx-ev">Channel review Q3.pdf</span></li></ul></div></div>'
           '<div class="cop-acts"><span class="cop-btn cx-go">Save to the shelf</span></div>'))
    staged = fchip('Retail Stores sales.xlsx', 'Excel', '380 KB', x=True)
    pg = page(b); draw2(pg, "Analysis", rail_analysis('c1'),
        '<div class="cop-ctx">'+MOBILE_CTX+'<span class="t">Refresh the SWOT after Q3</span></div><div class="cop-body">'+body+'</div>'+comp('Say what this file is for&hellip;', staged))
    pg.screenshot(path=str(OUT/"10-attach.png"), clip={"x":0,"y":0,"width":1500,"height":900}); pg.close()

    # 11. Company-level directions: owners in the save preview
    rail_co = rail('Directions &middot; El Abd', '<div class="cop-it"><small>Nothing saved here yet.</small></div>', it('Directions for 2027', 'Today &middot; Islam Saadany', True))
    rows = ''.join('<tr><td class="cx-n">%d</td><td>%s</td><td><span class="cx-own%s">%s</span>%s</td></tr>' % (
        i+1, d, '' if o else ' cx-unas', o or 'Unassigned', '<span class="cx-prop" title="The Copilot proposed this owner. Change it here or leave it.">proposed</span>' if prop else '')
        for i, (d, o, prop) in enumerate(DIRS))
    pg = page(b, "group"); pg.evaluate(ELABD, None)
    draw2(pg, "Directions", rail_co, '<div class="cop-ctx">'+ELABD_CTX+'<span class="t">Directions for 2027</span></div><div class="cop-body"></div>'+comp('Ask about El Abd&rsquo;s directions&hellip;'))
    pg.evaluate(r"""(rows)=>{
      const t=document.getElementById('modal-t'), s=document.getElementById('modal-s'), bd=document.getElementById('modal-b');
      t.innerHTML='Save El Abd directions as v1';
      s.innerHTML='Planned at company level. Each direction names the unit or function that will own it.';
      bd.style.display='block'; bd.innerHTML='<div style="display:block;width:760px;max-width:100%">'
       +'<table class="cx-otbl"><thead><tr><th>#</th><th>Direction</th><th>Owner</th></tr></thead><tbody>'+rows+'</tbody></table>'
       +'<div class="sv-gap" style="margin-top:12px">1 direction has no owner yet. You can save it unassigned.</div>'
       +'<div class="sv-f"><label>What changed</label><div class="in">First set of company directions for 2027.</div></div>'
       +'<div class="sv-foot"><span class="cop-btn">Back to the chat</span><span class="cop-btn cx-go">Save as v1</span></div></div>';
      const ov=t.closest('.overlay')||t.parentElement.parentElement.parentElement; ov.classList.add('on');
    }""", rows)
    pg.wait_for_timeout(300)
    pg.screenshot(path=str(OUT/"11-owners-save.png"), clip={"x":0,"y":0,"width":1500,"height":900}); pg.close()

    # 12. The company deliverable with its Owner column
    rows2 = ''.join('<tr><td class="cx-n">%d</td><td>%s</td><td title="Double-click to change the owner">%s</td></tr>' % (
        i+1, d, o or '<span class="cx-miss">Unassigned</span>') for i, (d, o, prop) in enumerate(DIRS))
    rail_co2 = rail('Directions &middot; El Abd', it('El Abd directions', '<span class="cx-kind cx-pro">Promotable</span> v1 &middot; Islam Saadany &middot; today', True), it('Directions for 2027', 'Today &middot; Islam Saadany'))
    hist = ('<h4>Versions</h4><div class="cx-vrow"><b>v1</b><span class="cx-cur">Current</span><br>First set of company directions for 2027.<small>Islam Saadany &middot; today 15:05</small></div>')
    pg = page(b, "group"); pg.evaluate(ELABD, None)
    draw2(pg, "Directions", rail_co2,
        '<div class="dl-head"><h3>El Abd directions</h3><span class="cx-kind cx-pro">Promotable</span><span class="by">v1 &middot; Islam Saadany &middot; today &middot; 5 directions, 4 owned</span>'
        '<div class="r"><span class="cop-btn">Continue in a new chat</span><span class="cop-btn">Edit</span></div></div>'
        '<div class="dl-grid"><div class="dl-main"><table class="cx-otbl"><thead><tr><th>#</th><th>Direction</th><th>Owner</th></tr></thead><tbody>'+rows2+'</tbody></table></div>'
        '<div class="dl-hist">'+hist+'</div></div>')
    pg.screenshot(path=str(OUT/"12-owners-deliverable.png"), clip={"x":0,"y":0,"width":1500,"height":900}); pg.close()

    # 13. The owner's own shelf: Sales sees its row, read-only
    rail_sales = rail('Directions &middot; Sales',
        it('El Abd directions &mdash; 1 row', '<span class="cx-kind cx-from" title="Planned at El Abd and owned by Sales">from El Abd</span><span class="cx-kind cx-ro" title="Edited only at El Abd">read-only</span>', True),
        '<div class="cop-it"><small>No chats yet.</small></div>')
    pane = ('<div class="dl-head"><h3>El Abd directions</h3><span class="cx-kind cx-from">from El Abd</span><span class="cx-kind cx-ro">read-only</span>'
        '<span class="by">v1 &middot; Islam Saadany &middot; today &middot; the row owned by Sales</span>'
        '<div class="r"><span class="cx-link" title="These directions are planned together at El Abd. Changes are made there and reach Sales from there.">Edited at El Abd &rsaquo;</span></div></div>'
        '<div class="dl-main"><table class="cx-otbl"><thead><tr><th>#</th><th>Direction</th><th>Owner</th></tr></thead><tbody>'
        '<tr><td class="cx-n">1</td><td>Grow modern-trade share in the Delta</td><td>Sales</td></tr></tbody></table></div>')
    pg = page(b); pg.evaluate(ELABD, "Sales")
    draw2(pg, "Directions", rail_sales, '<div class="cop-ctx"><span class="i" title="What the chat can see for Sales">i</span>Sales &middot; part of El Abd &middot; 1 company direction owned here</div>' + pane)
    pg.screenshot(path=str(OUT/"13-owner-shelf.png"), clip={"x":0,"y":0,"width":1500,"height":900}); pg.close()
