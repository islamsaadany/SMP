# Mockup shots: the squeezed strip reads as its own card, apart from the
# direction's pane, the way the side rail does on a wide window (after §609).
# Drives the REAL built platform and adds each option's CSS to the live page.
# Not a check; lives beside the mockup it makes.
import pathlib
from playwright.sync_api import sync_playwright
FILE = pathlib.Path("/home/user/SMP/SMP-Project-Folder/src/strategy-management-platform.html")
OUT = pathlib.Path(__file__).parent / "shots"
INIT = ("try{sessionStorage.setItem('smp.welcome.done','1');sessionStorage.setItem('smp.welcome.seen','1');"
        "sessionStorage.setItem('smp.tour.later','1');localStorage.setItem('smp.tour.never','1')}catch(e){}")

R = ".split:not(.setupsplit) > .rail:not(.setuprail)"
TILES = """
  radial-gradient(circle at 100% 100%, transparent calc(var(--r) - .5px), var(--ground) var(--r)) left top / var(--r) var(--r) no-repeat,
  radial-gradient(circle at 0 100%, transparent calc(var(--r) - .5px), var(--ground) var(--r)) right top / var(--r) var(--r) no-repeat,
  radial-gradient(circle at 100% 0, transparent calc(var(--r) - .5px), var(--ground) var(--r)) left 0 bottom var(--split-gap) / var(--r) var(--r) no-repeat,
  radial-gradient(circle at 0 0, transparent calc(var(--r) - .5px), var(--ground) var(--r)) right 0 bottom var(--split-gap) / var(--r) var(--r) no-repeat"""

# A · the gutter under the strip: the corner layer reaches one split-gap
# further down and paints that band in the page's ground, so the plan slides
# away into the gap rather than up against the strip.
GAP = """@media (max-width:1200px){ %s::after { bottom:calc(-1px - var(--split-gap, 16px));
  background:%s,
  linear-gradient(var(--ground), var(--ground)) left bottom / 100%% var(--split-gap) no-repeat; } }""" % (R, TILES)

# B · A, and the strip lifted: a soft shade inside that gap, under the card.
LIFT = """@media (max-width:1200px){ %s::after { bottom:calc(-1px - var(--split-gap, 16px));
  background:%s,
  linear-gradient(rgba(16,24,40,.13), rgba(16,24,40,0) 70%%) left bottom / 100%% var(--split-gap) no-repeat,
  linear-gradient(var(--ground), var(--ground)) left bottom / 100%% var(--split-gap) no-repeat; } }""" % (R, TILES)

# C · A, and the side rail's own header as the strip's first cell: the
# tenant's word for the list and its count, on the rail header's navy.
HEAD = GAP + """
@media (max-width:1200px){
  %s .rhead { display:flex; flex:none; flex-direction:column; justify-content:center; gap:3px;
    padding:0 16px; border-radius:calc(var(--r) - 1px) 0 0 calc(var(--r) - 1px); }
  %s .rhead .rhl { flex-direction:column; gap:2px; }
  %s .rhead .rhl span { font-size:15px; letter-spacing:0; }
  %s .rhead .railterse { display:none; } }""" % (R, R, R, R)

OPTIONS = {"a-gap": GAP, "b-lift": LIFT, "c-head": HEAD}


def plan(b, w, sub=None, h=760):
    pg = b.new_page(viewport={"width": w, "height": h}, device_scale_factor=2)
    pg.add_init_script(INIT)
    pg.goto("file://" + str(FILE)); pg.wait_for_timeout(1400)
    pg.click('[role=tab][data-u="mobile"]'); pg.wait_for_timeout(500)
    if sub:
        pg.click('[role=tab][data-s="%s"]' % sub); pg.wait_for_timeout(600)
    else:
        pg.click('[role=tab][data-sub2="plan"]'); pg.wait_for_timeout(600)
    return pg


def shoot(pg, name, y=520):
    if y:
        pg.mouse.wheel(0, y); pg.wait_for_timeout(700)
    w = pg.viewport_size["width"]
    pg.screenshot(path=str(OUT / (name + ".png")), clip={"x": 0, "y": 0, "width": w, "height": 470})


with sync_playwright() as p:
    b = p.chromium.launch(executable_path="/opt/pw-browsers/chromium")
    for key, css in [("today", "")] + list(OPTIONS.items()):
        for w, sub in ((1100, None), (1100, "performance"), (760, None)):
            pg = plan(b, w, sub)
            if css:
                pg.add_style_tag(content=css); pg.wait_for_timeout(250)
            tag = "%s-%s-%d" % (key, sub or "plan", w)
            if key in ("today", "c-head") and not sub and w == 1100:
                shoot(pg, tag + "-top", 0)
            shoot(pg, tag)
            pg.close()
    b.close()
print("done")
