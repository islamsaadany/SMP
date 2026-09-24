"""The main tab row after §406.2/§406.3: no tab draws a box, Reporting is a filled
orange button whose word sits on the other tabs' baseline and in the middle of
its own box, and Performance is the same quiet grey as the other tabs.

Every claim is measured as PAINT or geometry, never read off a stylesheet
(§94.8): the box Islam reported was an outline, so an outline is asked of the
computed style of the tab that holds focus AFTER a real click and after a real
Tab key; the centring is read off the painted pixels of the word (§302) with
the dot taken away, because the dot is not the word. Contrast in both palettes
with the sweep's own arithmetic (§38.4). SMP_BUILT points it at another build
(§276, §334.13). Every probe degrades (§215)."""
import io, os, sys
from PIL import Image
from playwright.sync_api import sync_playwright

HERE = os.path.dirname(os.path.abspath(__file__))
BUILT = os.environ.get("SMP_BUILT") or os.path.join(HERE, "..", "strategy-management-platform.html")
URL = "file://" + os.path.abspath(BUILT)
bad = 0
def ck(ok, what, detail=""):
    global bad
    print(("  ok    " if ok else "  FAIL  ") + what + ("" if ok else "  " + str(detail)))
    if not ok: bad += 1

LUM = """function L(c){var m=c.match(/[\\d.]+/g).map(Number).slice(0,3).map(v=>{v/=255;return v<=0.03928?v/12.92:Math.pow((v+0.055)/1.055,2.4)});return 0.2126*m[0]+0.7152*m[1]+0.0722*m[2]}
function R(a,b){a=L(a);b=L(b);return (Math.max(a,b)+.05)/(Math.min(a,b)+.05)}"""

def page(b, scheme, scale=2):
    pg = b.new_page(viewport={"width": 1440, "height": 800}, color_scheme=scheme, device_scale_factor=scale)
    pg.add_init_script("try{sessionStorage.setItem('smp.welcome.done','1')}catch(e){}")
    pg.goto(URL); pg.wait_for_timeout(700)
    pg.evaluate("document.querySelector('.units button[data-u=\"mobile\"]').click()")
    pg.wait_for_timeout(600)
    return pg

def js(pg, expr, default=None):
    try: return pg.evaluate(expr)
    except Exception as e: return default

def press(pg, sel):
    try: pg.locator(sel).first.click(timeout=4000); pg.wait_for_timeout(700); return True
    except Exception: return False

p = sync_playwright().start()
b = p.chromium.launch(executable_path=os.environ.get("SMP_CHROME") or None)
TABS = "#subtabs > button[role=tab]"

for scheme in ["light", "dark"]:
    print(f"— {scheme}")
    pg = page(b, scheme)
    # 1. no box after a mouse press, on the tab pressed
    for sel, name in [(TABS + ":not(.cta)", "Strategy"), (TABS + ".cta", "Reporting")]:
        press(pg, sel); pg.mouse.move(1430, 790); pg.wait_for_timeout(200)
        st = js(pg, "(()=>{var a=document.activeElement,s=getComputedStyle(a);return [a.matches('#subtabs > button[role=tab]'),s.outlineStyle,s.boxShadow]})()", [None]*3)
        ck(st[1] in ("none", None) and st[2] in ("none", None), f"{name} pressed: no outline or ring", st)
    # 2. no box on keyboard focus either (Islam: no box, for mouse and keyboard alike)
    js(pg, "document.querySelector('#subtabs > button[role=tab]:not(.cta):not([aria-selected=true])').focus()")
    pg.keyboard.press("Shift+Tab"); pg.keyboard.press("Tab"); pg.wait_for_timeout(150)
    st = js(pg, "(()=>{var a=document.activeElement,s=getComputedStyle(a);return [a.matches('#subtabs > button[role=tab]'),a.matches(':focus-visible'),s.outlineStyle]})()", [None]*3)
    ck(st[0] and st[1] and st[2] == "none", "keyboard focus on a tab draws no outline", st)
    # 3. Performance is the same colour as the other unselected tab words, and not Reporting's
    press(pg, TABS + ":not(.cta)")
    cols = js(pg, "[...document.querySelectorAll('#subtabs > button[role=tab]')].map(b=>[b.firstChild.textContent.trim(),b.getAttribute('aria-selected'),b.classList.contains('cta'),getComputedStyle(b).color,getComputedStyle(b).backgroundColor])", [])
    plain = [c for c in cols if c[1] == "false" and not c[2]]
    ck(len(plain) >= 1 and len({c[3] for c in plain}) == 1, "every unselected plain tab shares one quiet colour", plain)
    perf = [c for c in cols if c[0].startswith("Performance")]
    ck(perf and perf[0][4] in ("rgba(0, 0, 0, 0)", "transparent"), "Performance has no fill", perf)
    # 4. Reporting is filled, readable, deeper when selected
    rep = js(pg, "(()=>{" + LUM + ";var b=document.querySelector('#subtabs > button.cta'),s=getComputedStyle(b),r=getComputedStyle(document.documentElement);return [s.backgroundColor,s.color,R(s.color,s.backgroundColor)]})()", [None, None, 0])
    cta = js(pg, "(()=>{var d=document.createElement('i');d.style.color='var(--cta)';document.body.appendChild(d);var c=getComputedStyle(d).color;d.remove();return c})()")
    ck(rep[0] == cta, "Reporting's fill is --cta", [rep[0], cta])
    ck(rep[2] >= 4.5, "Reporting's word reads on its fill (>=4.5:1)", round(rep[2], 2))
    press(pg, TABS + ".cta")
    rep2 = js(pg, "(()=>{" + LUM + ";var b=document.querySelector('#subtabs > button.cta'),s=getComputedStyle(b);return [s.backgroundColor,R(s.color,s.backgroundColor)]})()", [None, 0])
    ck(rep2[0] != rep[0] and rep2[1] >= 4.5, "selected Reporting is the deeper fill and still reads", rep2)
    # 5. the word is on the others' baseline, in both states
    for state in ["Reporting selected", "Strategy selected"]:
        if state.startswith("Strategy"): press(pg, TABS + ":not(.cta)")
        bl = js(pg, "[...document.querySelectorAll('#subtabs > button[role=tab]')].map(b=>{var r=document.createRange();r.selectNodeContents(b.firstChild);return +r.getBoundingClientRect().bottom.toFixed(1)})", [])
        ck(len(bl) >= 3 and max(bl) - min(bl) <= 0.5, f"{state}: every tab word on one baseline", bl)
    # 5b. the section switch is squared, sharing Reporting's corner (§406.3)
    rad = js(pg, "(()=>{var g=document.querySelector('.tabs .secseg'),s=g&&g.querySelector('button[aria-selected=true]'),c=document.querySelector('#subtabs > button.cta');return g&&s&&c?[getComputedStyle(g).borderTopLeftRadius,getComputedStyle(s).borderTopLeftRadius,getComputedStyle(c).borderTopLeftRadius]:null})()")
    ck(bool(rad) and rad[0] == rad[2] and rad[0] != rad[1] and float(rad[1].rstrip('px') or 0) < float(rad[0].rstrip('px') or 0) <= 8,
       "section switch squared: box corner = Reporting's, segment corner smaller", rad)
    pg.close()
    # 6. the word is centred in its box — read off the pixels, dot removed
    pg = page(b, scheme, 4)
    for state in ["unselected", "selected"]:
        if state == "selected": press(pg, TABS + ".cta")
        pg.mouse.move(1430, 790); pg.wait_for_timeout(200)
        js(pg, "document.querySelectorAll('#subtabs .tabdot').forEach(d=>d.style.display='none')")
        bb = js(pg, "(()=>{var r=document.querySelector('#subtabs > button.cta').getBoundingClientRect();return [r.x,r.y,r.width,r.height]})()")
        if not bb: ck(False, f"{state}: Reporting box found"); continue
        im = Image.open(io.BytesIO(pg.screenshot(clip={"x": bb[0], "y": bb[1], "width": bb[2], "height": bb[3]}))).convert("RGB")
        W, H = im.size; bg = im.getpixel((W // 2, 4))
        diff = lambda px: sum(abs(a - c) for a, c in zip(px, bg)) > 150
        rows = [y for y in range(H) if any(diff(im.getpixel((x, y))) for x in range(28, W - 28))]
        cols_ = [x for x in range(28, W - 28) if any(diff(im.getpixel((x, y))) for y in range(28, H - 28))]
        if not rows or not cols_: ck(False, f"{state}: word ink found"); continue
        up, down = rows[0] / 4, bb[3] - rows[-1] / 4 - 0.25
        lf, rt = cols_[0] / 4, bb[2] - cols_[-1] / 4 - 0.25
        ck(abs(up - down) <= 1.0, f"{state}: word centred top to bottom (within 1px)", (up, round(down, 2)))
        ck(abs(lf - rt) <= 1.0, f"{state}: word centred left to right (within 1px)", (lf, round(rt, 2)))
        js(pg, "document.querySelectorAll('#subtabs .tabdot').forEach(d=>d.style.display='')")
    pg.close()

b.close(); p.stop()
print(("%d FAILED" % bad) if bad else "all good")
sys.exit(1 if bad else 0)
