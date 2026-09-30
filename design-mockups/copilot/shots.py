# Mockup shots for the Copilot tab (core slice, decisions v0.3).
# Drives the REAL built platform and lays the proposal onto Mobile's page.
# Not a check; lives beside the mockup it makes.
import pathlib
from playwright.sync_api import sync_playwright
FILE = pathlib.Path("/home/user/SMP/SMP-Project-Folder/src/strategy-management-platform.html")
OUT = pathlib.Path(__file__).parent / "shots"
INIT = "try{sessionStorage.setItem('smp.welcome.done','1');sessionStorage.setItem('smp.welcome.seen','1');sessionStorage.setItem('smp.tour.later','1');localStorage.setItem('smp.tour.never','1')}catch(e){}"

CSS = r"""
.cop-split{display:grid;grid-template-columns:260px minmax(0,1fr);gap:18px;align-items:start}
.cop-rail{background:var(--surface);border:1px solid var(--line);border-radius:var(--r-md);overflow:hidden}
.cop-rail .rhead{display:flex;justify-content:space-between;align-items:center}
.cop-new{margin:10px;display:block;width:calc(100% - 20px);text-align:center;border:1px dashed var(--line);border-radius:var(--r-sm);padding:7px;font:600 13px var(--sans);color:var(--stone);background:var(--surface)}
.cop-gh{font:700 10.5px var(--sans);letter-spacing:.12em;text-transform:uppercase;color:var(--ink-3);padding:12px 14px 4px}
.cop-place{font:700 12px var(--sans);color:var(--ink);padding:10px 14px 2px;border-top:1px solid var(--line-soft)}
.cop-it{display:block;padding:8px 14px;border-left:3px solid transparent;cursor:pointer}
.cop-it.on{background:var(--surface-2);border-left-color:var(--gold)}
.cop-it b{display:block;font:600 13.5px var(--sans);color:var(--ink)}
.cop-it small{display:block;font-size:11.5px;color:var(--ink-3);margin-top:2px}
.cx-kind{display:inline-block;font:700 9.5px var(--sans);letter-spacing:.08em;text-transform:uppercase;border-radius:var(--r-pill);padding:1px 7px;margin-right:4px;vertical-align:1px}
.cx-kind.cx-pro{background:var(--good-bg);color:var(--good-tx)}
.cx-kind.cx-only{background:var(--surface-2);color:var(--ink-2);border:1px solid var(--line)}
.cx-kind.cx-client{background:var(--warn-bg);color:var(--warn-tx)}
.cop-pane{background:var(--surface);border:1px solid var(--line);border-radius:var(--r-md);display:flex;flex-direction:column;min-height:640px}
.cop-ctx{display:flex;gap:8px;align-items:center;padding:11px 18px;border-bottom:1px solid var(--line-soft);font-size:13px;color:var(--ink-2)}
.cop-ctx .i{width:15px;height:15px;border-radius:50%;border:1px solid var(--ink-3);color:var(--ink-3);font:700 10px/13px var(--sans);text-align:center}
.cop-ctx .t{margin-left:auto;font:600 13px var(--sans);color:var(--ink)}
.cop-body{flex:1;padding:18px 22px;display:flex;flex-direction:column;gap:14px}
.cop-empty{flex:1}
.cop-comp{border-top:1px solid var(--line-soft);padding:14px 18px;display:flex;gap:10px;align-items:flex-end}
.cop-comp .ta{flex:1;border:1px solid var(--line);border-radius:var(--r-md);padding:11px 13px;min-height:46px;font-size:14px;color:var(--ink-3);background:var(--surface)}
.cop-comp .send{background:var(--stone);color:var(--surface);border-radius:var(--r-sm);padding:10px 16px;font:600 13px var(--sans)}
.chmsg{max-width:88%}
.chmsg .chbod ul{margin:4px 0 0;padding-left:18px}
.chmsg .chbod li{margin:2px 0}
.cx-play{display:grid;grid-template-columns:auto 1fr;gap:4px 12px;font-size:13px}
.cx-play dt{font:700 10.5px var(--sans);letter-spacing:.1em;text-transform:uppercase;color:var(--ink-3);padding-top:2px}
.cx-play dd{margin:0;color:var(--ink-2)}
.cx-miss{color:var(--warn-tx)}
.cop-acts{display:flex;gap:8px;flex-wrap:wrap;margin-top:6px}
.cop-btn{border:1px solid var(--line);background:var(--surface);color:var(--stone);border-radius:var(--r-sm);padding:5px 11px;font:600 12.5px var(--sans)}
.cop-btn.cx-go{background:var(--stone);color:var(--surface);border-color:var(--stone)}
.cop-quick{display:flex;gap:8px}
.cop-quick span{border:1px solid var(--line);border-radius:var(--r-pill);padding:4px 11px;font-size:12.5px;color:var(--ink-2);background:var(--surface-2)}
.cx-budget{font:700 10.5px var(--sans);letter-spacing:.1em;text-transform:uppercase;color:var(--ink-3)}
.cx-sw{display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-top:6px}
.cx-sw div{border:1px solid var(--line);border-radius:var(--r-sm);padding:8px 10px;background:var(--surface)}
.cx-sw h5{margin:0 0 4px;font:700 10.5px var(--sans);letter-spacing:.1em;text-transform:uppercase;color:var(--ink)}
.cx-sw ul{margin:0;padding-left:16px;font-size:12.5px;color:var(--ink-2)}
.cx-ev{font-size:11px;color:var(--ink-3)}
.cx-ev.no{color:var(--warn-tx);font-weight:600}
.cx-pasted{display:inline-block;font:700 9.5px var(--sans);letter-spacing:.08em;text-transform:uppercase;background:var(--attn-bg);color:var(--attn-tx);border-radius:var(--r-pill);padding:1px 7px}
.dl-head{display:flex;align-items:center;gap:10px;padding:14px 22px;border-bottom:1px solid var(--line-soft)}
.dl-head h3{margin:0;font:700 19px var(--sans);color:var(--ink)}
.dl-head .by{font-size:12.5px;color:var(--ink-3)}
.dl-head .r{margin-left:auto;display:flex;gap:8px}
.dl-grid{display:grid;grid-template-columns:minmax(0,1fr) 270px;gap:0;flex:1}
.dl-main{padding:18px 22px}
.dl-hist{border-left:1px solid var(--line-soft);padding:14px 16px;background:var(--surface-2)}
.dl-hist h4{margin:0 0 8px;font:700 10.5px var(--sans);letter-spacing:.12em;text-transform:uppercase;color:var(--ink-3)}
.cx-vrow{padding:9px 0;border-top:1px solid var(--line-soft);font-size:12.5px;color:var(--ink-2)}
.cx-vrow b{color:var(--ink);font-size:13px}
.cx-vrow .cx-cur{font:700 9.5px var(--sans);letter-spacing:.08em;text-transform:uppercase;color:var(--good-tx);margin-left:6px}
.cx-vrow .cx-rs{float:right;font:600 12px var(--sans);color:var(--stone);text-decoration:underline}
.cx-vrow small{display:block;color:var(--ink-3);margin-top:2px}
.cx-pen{outline:2px solid var(--gold);outline-offset:2px;border-radius:3px;background:var(--surface)}
.cx-assume{border:1px solid var(--line);border-left:3px solid var(--gold);border-radius:var(--r-sm);padding:8px 12px;font-size:12.5px;color:var(--ink-2);background:var(--surface-2)}
.cx-assume b{color:var(--ink)}
.sv-gap{border:1px solid var(--warn);background:var(--warn-bg);color:var(--warn-tx);border-radius:var(--r-sm);padding:8px 12px;font-size:13px}
.sv-f label{display:block;font:700 10.5px var(--sans);letter-spacing:.1em;text-transform:uppercase;color:var(--ink-3);margin:12px 0 4px}
.sv-f .in{border:1px solid var(--line);border-radius:var(--r-sm);padding:8px 10px;font-size:13.5px;color:var(--ink)}
.sv-foot{display:flex;justify-content:flex-end;gap:8px;margin-top:16px}
"""

SETUP = r"""([css, secs, sel, tabs]) => {
  if (!document.getElementById('copcss')) { const s=document.createElement('style'); s.id='copcss'; s.textContent=css; document.head.appendChild(s); }
  const t = document.getElementById('subtabs');
  if (!t.querySelector('[data-s=copilot]')) {
    t.querySelectorAll('button').forEach(b=>b.setAttribute('aria-selected','false'));
    const last=[...t.querySelectorAll('button[data-s]')].pop(); last.insertAdjacentHTML('afterend', '<button role="tab" data-s="copilot" aria-selected="true">Copilot</button>');
  }
  const seg = document.querySelector('.secseg');
  seg.innerHTML = secs.map(x=>'<button role="tab" aria-selected="'+(x===sel)+'">'+x+'</button>').join('');
  const row = seg.parentElement; [...row.children].forEach(c=>{ if(c!==seg) c.style.visibility='hidden'; });
}"""

def page(p, unit="mobile", h=1000):
    pg = p.new_page(viewport={"width": 1500, "height": h})
    pg.add_init_script(INIT)
    pg.goto("file://" + str(FILE)); pg.wait_for_timeout(1500)
    if unit == "group":
        pg.click("#topsel > summary"); pg.wait_for_timeout(200)
        pg.click('#topsel [data-u="group"]'); pg.wait_for_timeout(600)
        pg.click('#units [data-u="mobile"]') if False else None
    else:
        pg.click('#units [data-u="%s"]' % unit); pg.wait_for_timeout(600)
    return pg

SECS = ["Foundation","Analysis","Directions","Execution","Advisory"]

def draw(pg, sel, rail, pane):
    pg.evaluate(SETUP, [CSS, SECS, sel, None])
    pg.evaluate("""([r,p])=>{document.getElementById('panel').innerHTML='<div class="cop-split"><div class="cop-rail rail">'+r+'</div><div class="cop-pane">'+p+'</div></div>'}""", [rail, pane])
    pg.wait_for_timeout(250)

MOBILE_CTX = '<span class="i" title="What the chat can see">i</span>Mobile &middot; 4 pillars &middot; 20 key measures &middot; Q3 reported &middot; 2 measures off track'
def rail_analysis(on):
    it = lambda k, name, meta, cls='': '<div class="cop-it'+(' on' if k==on else '')+'"><b>'+name+'</b><small>'+meta+'</small></div>'
    return ('<div class="rhead"><span class="rhl">Analysis &middot; Mobile</span></div>'
      '<button class="cop-new">+ New chat</button>'
      '<div class="cop-gh">Deliverables</div>'
      + it('swot','SWOT','<span class="cx-kind cx-pro">Promotable</span> v3 &middot; Islam Saadany &middot; 12 Sep')
      + it('macro','Macro scan &mdash; Egypt handsets','<span class="cx-kind cx-only">Copilot-only</span> v1 &middot; Omar Adel &middot; 2 Sep')
      + '<div class="cop-gh">Chats</div>'
      + it('c1','Refresh the SWOT after Q3','Today &middot; Islam Saadany')
      + it('c2','Competitor pricing notes','3 Sep &middot; Omar Adel')
      + it('c3','Internal audit of channels','28 Aug &middot; Islam Saadany')
      + '<div style="height:10px"></div>')

COMP = '<div class="cop-comp"><div class="ta">Ask about Mobile&rsquo;s analysis&hellip;</div><span class="send">Send</span></div>'

with sync_playwright() as p:
    b = p.chromium.launch(executable_path="/opt/pw-browsers/chromium-1194/chrome-linux/chrome")

    # 1. A new chat: the empty box and its one line of context
    pg = page(b); draw(pg, "Analysis", rail_analysis('new').replace('class="cop-new"','class="cop-new" style="border-style:solid;border-color:var(--gold);background:var(--surface-2)"'),
        '<div class="cop-ctx">'+MOBILE_CTX+'<span class="t">New chat</span></div><div class="cop-body cop-empty"></div>'+COMP)
    pg.screenshot(path=str(OUT/"1-new-chat.png"), clip={"x":0,"y":0,"width":1500,"height":900}); pg.close()

    # 2. A chat at work: playback, draft, save
    body = ('<div class="chmsg chme"><span class="chwho">Islam Saadany</span><div class="chbod">Refresh Mobile&rsquo;s SWOT now Q3 is reported. Keep what still holds.</div></div>'
      '<div class="chmsg chthem"><span class="chwho">Copilot</span><div class="chbod"><dl class="cx-play">'
      '<dt>Understood</dt><dd>You want the SWOT updated to reflect Q3, keeping items that still hold.</dd>'
      '<dt>Working from</dt><dd>SWOT v3 on this shelf &middot; Mobile&rsquo;s Q3 figures &middot; Retail Stores&rsquo; Q3 channel figures</dd>'
      '<dt>Missing</dt><dd class="cx-miss">No competitor data after June. I&rsquo;ll mark any item that rests on it.</dd></dl></div></div>'
      '<div class="chmsg chme"><span class="chwho">Islam Saadany</span><div class="chbod">I don&rsquo;t know the competitor side &mdash; assume for me.</div></div>'
      '<div class="cx-assume"><b>Assumption recorded:</b> competitor pricing unchanged since June. It will travel with anything saved from this chat.</div>'
      '<div class="chmsg chthem"><span class="chwho">Copilot</span><div class="chbod">Here&rsquo;s the refreshed SWOT. Two measures moved it: app coverage is now 41% against 50%, and digital orders beat target.'
      '<div class="cx-sw"><div><h5>Strengths</h5><ul><li>Orders processed digitally at 93% <span class="cx-ev">Mobile Q3</span></li><li>Wide merchant network</li></ul></div>'
      '<div><h5>Weaknesses</h5><ul><li>App coverage 41% vs 50% <span class="cx-ev">Mobile Q3</span></li><li>Manual reports remain</li></ul></div>'
      '<div><h5>Opportunities</h5><ul><li>Regional asset-light expansion</li></ul></div>'
      '<div><h5>Threats</h5><ul><li>Price pressure from grey imports <span class="cx-ev">assumed</span></li></ul></div></div>'
      '<div class="cop-acts"><span class="cop-btn cx-go">Save to the shelf</span></div></div></div>')
    pg = page(b, h=1250); draw(pg, "Analysis", rail_analysis('c1'),
        '<div class="cop-ctx">'+MOBILE_CTX+'<span class="t">Refresh the SWOT after Q3</span></div><div class="cop-body">'+body+'</div>'+COMP)
    pg.screenshot(path=str(OUT/"2-chat.png")); pg.close()

    # 3. Save preview
    pg = page(b); draw(pg, "Analysis", rail_analysis('c1'), '<div class="cop-ctx">'+MOBILE_CTX+'<span class="t">Refresh the SWOT after Q3</span></div><div class="cop-body"></div>'+COMP)
    pg.evaluate(r"""()=>{
      const t=document.getElementById('modal-t'), s=document.getElementById('modal-s'), bd=document.getElementById('modal-b');
      t.innerHTML='Save SWOT as v4';
      s.innerHTML='This is exactly what will be stored, in Mobile&rsquo;s shape.';
      bd.style.display='block'; bd.innerHTML='<div style="display:block;width:720px;max-width:100%"><div class="cx-sw" style="margin-top:0"><div><h5>Strengths</h5><ul><li>Orders processed digitally at 93% <span class="cx-ev">Mobile Q3 figures</span></li><li>Wide merchant network <span class="cx-ev no">no evidence</span></li></ul></div>'
       +'<div><h5>Weaknesses</h5><ul><li>App coverage 41% against 50% <span class="cx-ev">Mobile Q3 figures</span></li><li>Manual reports remain <span class="cx-ev no">no evidence</span></li></ul></div>'
       +'<div><h5>Opportunities</h5><ul><li>Regional asset-light expansion <span class="cx-ev">SWOT v3</span></li></ul></div>'
       +'<div><h5>Threats</h5><ul><li>Price pressure from grey imports <span class="cx-ev">assumption</span></li></ul></div></div>'
       +'<div class="sv-gap" style="margin-top:12px">2 items have no evidence. You can save them as they are.</div>'
       +'<div class="cx-assume" style="margin-top:10px"><b>Rests on 1 assumption:</b> competitor pricing unchanged since June.</div>'
       +'<div class="sv-f"><label>What changed</label><div class="in">Refreshed after Q3: app coverage moved to weaknesses, digital orders confirmed as a strength.</div></div>'
       +'<div class="sv-foot"><span class="cop-btn">Back to the chat</span><span class="cop-btn cx-go">Save as v4</span></div></div>';
      const ov=t.closest('.overlay')||t.parentElement.parentElement.parentElement; ov.classList.add('on');
    }""")
    pg.wait_for_timeout(300)
    pg.screenshot(path=str(OUT/"3-save.png"), clip={"x":0,"y":0,"width":1500,"height":1000}); pg.close()

    # 4. The deliverable, with its versions
    main = ('<div class="cx-sw" style="margin-top:0"><div><h5>Strengths</h5><ul><li>Orders processed digitally at 93% <span class="cx-ev">Mobile Q3 figures</span></li><li><span class="cx-pen">Wide merchant network across Upper Egypt</span> <span class="cx-ev no">no evidence</span></li></ul></div>'
       '<div><h5>Weaknesses</h5><ul><li>App coverage 41% against 50% <span class="cx-ev">Mobile Q3 figures</span></li><li>Manual reports remain <span class="cx-ev no">no evidence</span></li></ul></div>'
       '<div><h5>Opportunities</h5><ul><li>Regional asset-light expansion <span class="cx-ev">SWOT v3</span></li></ul></div>'
       '<div><h5>Threats</h5><ul><li>Price pressure from grey imports <span class="cx-ev">assumption</span></li></ul></div></div>'
       '<div class="cx-assume" style="margin-top:14px"><b>Rests on 1 assumption:</b> competitor pricing unchanged since June.</div>')
    hist = ('<h4>Versions</h4>'
      '<div class="cx-vrow"><b>v4</b><span class="cx-cur">Current</span><br>Refreshed after Q3: app coverage moved to weaknesses.<small>Islam Saadany &middot; today 14:20</small></div>'
      '<div class="cx-vrow"><b>v3</b><span class="cx-rs">Restore</span><br>Restored from v1.<small>Islam Saadany &middot; 12 Sep</small></div>'
      '<div class="cx-vrow"><b>v2</b><span class="cx-rs">Restore</span><br>Added grey-import threat.<small>Omar Adel &middot; 5 Sep</small></div>'
      '<div class="cx-vrow"><b>v1</b><span class="cx-rs">Restore</span><br>First draft from the kick-off interviews.<small>Omar Adel &middot; 20 Aug</small></div>')
    pg = page(b); draw(pg, "Analysis", rail_analysis('swot').replace('v3 &middot; Islam Saadany &middot; 12 Sep','v4 &middot; Islam Saadany &middot; today'),
        '<div class="dl-head"><h3>SWOT</h3><span class="cx-kind cx-pro">Promotable</span><span class="by">v4 &middot; Islam Saadany &middot; today</span>'
        '<div class="r"><span class="cop-btn">Continue in a new chat</span><span class="cop-btn cx-go">Done editing</span></div></div>'
        '<div class="dl-grid"><div class="dl-main">'+main+'</div><div class="dl-hist">'+hist+'</div></div>')
    pg.screenshot(path=str(OUT/"4-deliverable.png"), clip={"x":0,"y":0,"width":1500,"height":900}); pg.close()

    # 5. Missing input
    rail_dir = ('<div class="rhead"><span class="rhl">Directions &middot; Mobile</span></div><button class="cop-new">+ New chat</button>'
      '<div class="cop-gh">Deliverables</div><div class="cop-it"><small>Nothing saved here yet.</small></div>'
      '<div class="cop-gh">Chats</div><div class="cop-it on"><b>Directions for 2027</b><small>Today &middot; Islam Saadany</small></div><div style="height:10px"></div>')
    body = ('<div class="chmsg chme"><span class="chwho">Islam Saadany</span><div class="chbod">Propose three directions for Mobile for 2027.</div></div>'
      '<div class="chmsg chthem"><span class="chwho">Copilot</span><div class="chbod">Mobile has no internal analysis on its shelf yet, only a SWOT. Directions would rest on that gap. How do you want to go on?'
      '<div class="cop-acts"><span class="cop-btn">Go to Analysis first</span><span class="cop-btn cx-go">Paste what you have</span></div></div></div>'
      '<div class="chmsg chme"><span class="chwho">Islam Saadany</span><div class="chbod">[pasted] Internal review, channel section &mdash; 2 pages</div></div>'
      '<div class="chmsg chthem"><span class="chwho">Copilot</span><div class="chbod">Got it. I&rsquo;ll mark it as <span class="cx-pasted">Pasted</span> on anything I produce from it. Do you want it saved to Analysis as its own deliverable, so it doesn&rsquo;t live only in this chat?'
      '<div class="cop-acts"><span class="cop-btn cx-go">Save to Analysis</span><span class="cop-btn">Not now</span></div></div></div>')
    pg = page(b); draw(pg, "Directions", rail_dir,
        '<div class="cop-ctx">'+MOBILE_CTX+'<span class="t">Directions for 2027</span></div><div class="cop-body">'+body+'</div>'+COMP.replace('analysis','directions'))
    pg.screenshot(path=str(OUT/"5-missing.png"), clip={"x":0,"y":0,"width":1500,"height":900}); pg.close()

    # 6. Advisory: question budget and quick replies
    rail_adv = ('<div class="rhead"><span class="rhl">Advisory &middot; Mobile</span></div><button class="cop-new">+ New chat</button>'
      '<div class="cop-gh">Deliverables</div>'
      '<div class="cop-it"><b>Decision brief &mdash; dealer margins</b><small><span class="cx-kind cx-only">Copilot-only</span> v2 &middot; Omar Adel &middot; 9 Sep</small></div>'
      '<div class="cop-it"><b>Why app coverage keeps missing</b><small><span class="cx-kind cx-only">Copilot-only</span> v1 &middot; Islam Saadany &middot; 1 Sep</small></div>'
      '<div class="cop-gh">Chats</div><div class="cop-it on"><b>Price the new handset line</b><small>Today &middot; Islam Saadany</small></div><div style="height:10px"></div>')
    body = ('<div class="chmsg chme"><span class="chwho">Islam Saadany</span><div class="chbod">Should Mobile price the new handset line above or at market?</div></div>'
      '<div class="chmsg chthem"><span class="chwho">Copilot</span><div class="chbod">Which matters more for this line this year: volume or margin?</div></div>'
      '<div class="chmsg chme"><span class="chwho">Islam Saadany</span><div class="chbod">Margin.</div></div>'
      '<div class="chmsg chthem"><span class="chwho">Copilot</span><div class="chbod">Your pasted memo says dealers were promised launch pricing at market, but Mobile&rsquo;s plan targets 18% margin on new lines. Which should win?'
      '<div class="cop-acts"><span class="cop-btn">The memo</span><span class="cop-btn">The plan</span></div></div></div>'
      '<div class="cx-budget">Question 2 of 5 &middot; round 1 of 2</div>'
      '<div class="cop-quick"><span>I don&rsquo;t know &mdash; assume for me</span><span>Proceed with what you have</span></div>')
    pg = page(b); draw(pg, "Advisory", rail_adv,
        '<div class="cop-ctx">'+MOBILE_CTX+'<span class="t">Price the new handset line</span></div><div class="cop-body">'+body+'</div>'+COMP.replace('Mobile&rsquo;s analysis','anything for Mobile'))
    pg.screenshot(path=str(OUT/"6-advisory.png"), clip={"x":0,"y":0,"width":1500,"height":900}); pg.close()

    # 7. The group: shelf organised by place
    it = lambda name, meta, on=False: '<div class="cop-it'+(' on' if on else '')+'"><b>'+name+'</b><small>'+meta+'</small></div>'
    rail_grp = ('<div class="rhead"><span class="rhl">Execution &middot; the group</span></div><button class="cop-new">+ New chat</button>'
      '<div class="cop-gh">Deliverables</div>'
      '<div class="cop-place">Group</div>' + it('Group focus cascade','<span class="cx-kind cx-only">Copilot-only</span> v2 &middot; Islam Saadany')
      + '<div class="cop-place">Mobile</div>' + it('Pillars &amp; tactics 2027','<span class="cx-kind cx-pro">Promotable</span> v5 &middot; Islam Saadany', True)
      + '<div class="cop-place">Retail Stores</div>' + it('Pillars &amp; tactics 2027','<span class="cx-kind cx-pro">Promotable</span> v2 &middot; Omar Adel')
      + '<div class="cop-place">Finance</div>' + it('Projects 2027','<span class="cx-kind cx-pro">Promotable</span> v1 &middot; <span class="cx-kind cx-client">Client</span> Hala Mostafa')
      + '<div class="cop-gh">Chats</div>' + it('How the group focus flows into units','Today &middot; Islam Saadany') + '<div style="height:10px"></div>')
    head = ('<div class="dl-head"><h3>Mobile &mdash; pillars &amp; tactics 2027</h3><span class="cx-kind cx-pro">Promotable</span><span class="by">v5 &middot; Islam Saadany &middot; 27 Sep &middot; planned in pillars</span></div>')
    tbl = ('<div class="dl-main"><h4 class="mini">MB01 &middot; Digital &amp; data-driven operations</h4>'
      '<div class="tblscroll"><table><thead><tr><th>#</th><th>Key measure</th><th>Dir.</th><th>Target</th></tr></thead><tbody>'
      '<tr><td class="idx">1</td><td>Orders processed digitally</td><td class="cc">&ge;</td><td class="num">95%</td></tr>'
      '<tr><td class="idx">2</td><td>App coverage rate</td><td class="cc">&ge;</td><td class="num">60%</td></tr></tbody></table></div></div>')
    pg = page(b, "group")
    pg.evaluate(SETUP, [CSS, SECS, "Execution", None])
    pg.evaluate("""([r,p])=>{const sec=document.querySelector('.secseg'); if(!sec){const t=document.getElementById('subtabs'); t.insertAdjacentHTML('afterend','');}
      document.getElementById('panel').innerHTML='<div class="cop-split"><div class="cop-rail rail">'+r+'</div><div class="cop-pane">'+p+'</div></div>'}""",
      [rail_grp, '<div class="cop-ctx"><span class="i">i</span>The group &middot; 10 units &middot; 8 functions &middot; Q3 reported by 9 of 18</div>' + head + tbl])
    pg.wait_for_timeout(300)
    pg.screenshot(path=str(OUT/"7-group.png"), clip={"x":0,"y":0,"width":1500,"height":900}); pg.close()
