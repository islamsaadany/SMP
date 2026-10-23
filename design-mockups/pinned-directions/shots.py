# Mockup shots: the direction strip stays in view on a narrow window.
# Drives the REAL built platform and adds the proposal's CSS to the live page.
# Not a check; lives beside the mockup it makes.
import pathlib
from playwright.sync_api import sync_playwright
FILE = pathlib.Path("/home/user/SMP/SMP-Project-Folder/src/strategy-management-platform.html")
OUT = pathlib.Path(__file__).parent / "shots"
INIT = "try{sessionStorage.setItem('smp.welcome.done','1');sessionStorage.setItem('smp.welcome.seen','1');sessionStorage.setItem('smp.tour.later','1');localStorage.setItem('smp.tour.never','1')}catch(e){}"

# The proposal. Only below 1200px, where the rail already goes across.
PROPOSAL = r"""
@media (max-width:1200px){
  :root { --strip-h:42px; }
  /* 1. The strip pins under the chrome, exactly where it sits at rest. */
  .split:not(.setupsplit) > .rail:not(.setuprail) {
    position:sticky; top:calc(var(--chrome-h,118px) + var(--rail-gap,22px)); z-index:5;
    overflow:visible; display:flex; }
  .split:not(.setupsplit) > .rail:not(.setuprail)::before {
    display:block; left:-1px; right:-1px; height:calc(var(--rail-gap,22px) + 1px); }
  /* 2. Every direction on the strip; when the room runs out the NAMES WRAP,
     the codes never do. A grid inside each item so its smallest size is the
     code alone and its natural size is code and whole name on one line: the
     strip shares the room in proportion to the names, the open one included,
     and no direction is pushed off the end. Past three lines a name ends in
     an ellipsis, which only a unit with many directions ever reaches. */
  .split:not(.setupsplit) > .rail:not(.setuprail) { min-width:0; }
  .rail:not(.setuprail) .sortable { flex:1 1 auto; min-width:0; overflow-x:auto;
    border-radius:calc(var(--r) - 1px); }
  .rail:not(.setuprail) button.ritem { display:grid; grid-template-columns:auto minmax(0,max-content);
    column-gap:8px; align-items:center; flex:1 1 auto; width:auto; min-height:var(--strip-h);
    padding:7px 14px 4px; text-align:left; }
  .rail:not(.setuprail) .ritem .rcode { grid-column:auto; margin:0; }
  .rail:not(.setuprail) .ritem b { min-width:0; white-space:normal; overflow-wrap:break-word;
    line-height:1.3; display:-webkit-box; -webkit-box-orient:vertical; -webkit-line-clamp:3;
    overflow:hidden; }
  /* The open one wears the house's own "selected": the section switch's
     navy with white type (Foundation | SWOT | Plan), over the gold edge the
     strip already had. The others step back to the quiet ink, and come up
     to full ink under the pointer. */
  .rail:not(.setuprail) button.ritem.on,
  .rail:not(.setuprail) button.ritem.on:hover { background:var(--stone); color:var(--surface);
    border-bottom-color:var(--gold); }
  .rail:not(.setuprail) .ritem.on .rcode,
  .rail:not(.setuprail) .ritem.on b { color:var(--surface); }
  .rail:not(.setuprail) .ritem.on .grip i { background:var(--surface); }
  .rail:not(.setuprail) .ritem:not(.on) .rcode,
  .rail:not(.setuprail) .ritem:not(.on) b { color:var(--ink-3); font-weight:500; }
  .rail:not(.setuprail) .ritem:not(.on):hover .rcode,
  .rail:not(.setuprail) .ritem:not(.on):hover b { color:var(--ink); }
  /* While editing: the reorder handle joins the line, and Add sits at its end. */
  .rail.arranging:not(.setuprail) button.ritem {
    grid-template-columns:auto auto minmax(0,max-content); }
  .rail:not(.setuprail) .railadd { flex:none; align-self:center; padding:0 14px;
    white-space:nowrap; }
  /* 3. The open direction's title scrolls with the plan, reading or editing:
     the strip already names it, and Done editing is in the top bar. */
  .split:not(.setupsplit) > .pane > .pband,
  .split:not(.setupsplit) > .pane > .ptitle.edhead { position:relative; top:auto; }
  .split:not(.setupsplit) > .pane > .pband::before,
  .split:not(.setupsplit) > .pane > .ptitle.edhead::before { display:none; }
}
"""
# Corner fill for the pinned strip, drawn the way the band's is (radial tiles).
CORNERS = r"""
@media (max-width:1200px){
  .split:not(.setupsplit) > .rail:not(.setuprail).pinnedx::after { content:""; position:absolute; pointer-events:none; left:-1px; right:-1px; top:-1px; bottom:-1px; z-index:1;
    background:
      radial-gradient(circle at 100% 100%, transparent calc(var(--r) - .5px), var(--ground) var(--r)) left top / calc(var(--r) + 1px) var(--r) no-repeat,
      radial-gradient(circle at 0 100%, transparent calc(var(--r) - .5px), var(--ground) var(--r)) right top / calc(var(--r) + 1px) var(--r) no-repeat,
      radial-gradient(circle at 100% 0, transparent calc(var(--r) - .5px), var(--ground) var(--r)) left bottom / calc(var(--r) + 1px) var(--r) no-repeat,
      radial-gradient(circle at 0 0, transparent calc(var(--r) - .5px), var(--ground) var(--r)) right bottom / calc(var(--r) + 1px) var(--r) no-repeat; }
}
"""

def plan(b, w, h=760):
    pg = b.new_page(viewport={"width": w, "height": h}, device_scale_factor=2)
    pg.add_init_script(INIT)
    pg.goto("file://" + str(FILE)); pg.wait_for_timeout(1500)
    pg.click('[role=tab][data-u="mobile"]'); pg.wait_for_timeout(600)
    pg.click('[role=tab][data-sub2="plan"]'); pg.wait_for_timeout(700)
    return pg

def propose(pg):
    pg.add_style_tag(content=PROPOSAL + CORNERS); pg.wait_for_timeout(300)

def scroll(pg, y):
    pg.mouse.wheel(0, y); pg.wait_for_timeout(700)
    pg.evaluate("""() => { const r=document.querySelector('.split:not(.setupsplit) > .rail');
      if (r) r.classList.toggle('pinnedx', window.scrollY > 0); }""")
    pg.wait_for_timeout(150)

def measure(pg):
    return pg.evaluate("""() => { const r=document.querySelector('.split > .rail'), b=document.querySelector('.pane > .pband, .pane > .ptitle.edhead');
      const s=r.querySelector('.sortable'), R=x=>Math.round(x*10)/10;
      return {rail:R(r.getBoundingClientRect().top), band:R(b.getBoundingClientRect().top),
              rowsFrom:R(Math.max(0, r.getBoundingClientRect().bottom, b.getBoundingClientRect().top > 150 && b.getBoundingClientRect().top < 400 ? b.getBoundingClientRect().bottom : 0)),
              railH:Math.round(r.getBoundingClientRect().height*10)/10,
              overflow:s.scrollWidth - s.clientWidth,
              names:[...r.querySelectorAll('.ritem b')].map(x=>x.scrollWidth>x.clientWidth?'cut':'whole')} }""")

with sync_playwright() as p:
    b = p.chromium.launch(executable_path="/opt/pw-browsers/chromium-1243/chrome-linux64/chrome")
    # Today, 1100 wide: top of the page, then scrolled.
    pg = plan(b, 1100)
    pg.screenshot(path=str(OUT / "today-1100-top.png"))
    scroll(pg, 700); print("today 1100 scrolled", measure(pg))
    pg.screenshot(path=str(OUT / "today-1100-scrolled.png"))
    pg.close()
    # Today, 900 wide: the last direction is cut off the end.
    pg = plan(b, 900); print("today 900 top", measure(pg))
    pg.screenshot(path=str(OUT / "today-900-top.png"), clip={"x":0,"y":0,"width":900,"height":360})
    pg.close()
    # Proposed: at rest and scrolled, at three widths.
    for w in (1100, 900, 760):
        pg = plan(b, w); propose(pg)
        print("proposed", w, "top", measure(pg))
        pg.screenshot(path=str(OUT / f"proposed-{w}-top.png"))
        scroll(pg, 300); print("proposed", w, "scroll300", measure(pg))
        scroll(pg, 400); print("proposed", w, "scroll700", measure(pg))
        pg.screenshot(path=str(OUT / f"proposed-{w}-scrolled.png"))
        pg.close()
    # Proposed, 760: MB04 open, to show the open one keeps its name longest.
    pg = plan(b, 760); propose(pg)
    pg.click('.rail .ritem[data-oi="3"]'); pg.wait_for_timeout(600)
    scroll(pg, 700); print("proposed 760 MB04 scrolled", measure(pg))
    pg.screenshot(path=str(OUT / "proposed-760-mb04-scrolled.png"))
    pg.close()
    # Proposed, 1100, editing: top of the page and scrolled into the measures.
    pg = plan(b, 1100); propose(pg)
    pg.click('.secpen'); pg.wait_for_timeout(800)
    print("proposed 1100 edit top", measure(pg))
    pg.screenshot(path=str(OUT / "proposed-1100-edit-top.png"))
    scroll(pg, 700); print("proposed 1100 edit scrolled", measure(pg))
    pg.screenshot(path=str(OUT / "proposed-1100-edit-scrolled.png"))
    pg.close()
    b.close()
