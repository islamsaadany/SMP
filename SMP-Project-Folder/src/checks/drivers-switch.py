"""Revenue drivers can be switched off for a client (spec 063, 2026-09-23).

Islam: "this module it should have an on and off button to show or not".
The switch is the office's, at the top of Setup > Revenue drivers, and it is
stored as an ABSENCE (Off deletes the key, §50.6); only an explicit true is on
(§104). Off HIDES and never forgets (§44): every tree stays stored.

Asserted at BOTH ENDS (§94.2) and by PRESSING the real control (§70): a build
that never drew the Drivers tab satisfies every "off hides it" assertion, so
each absence is paired with the presence the same run measured with it on. The
page carrying the switch stays reachable while it is off (§61), or the only way
back on would be to turn it on first. SMP_BUILT points it at another build.
"""
import os, sys
from playwright.sync_api import sync_playwright

HERE = os.path.dirname(os.path.abspath(__file__))
BUILT = os.environ.get("SMP_BUILT") or os.path.join(HERE, "..", "strategy-management-platform.html")
CHROME = os.environ.get("SMP_CHROME") or None
fails = []
def ck(name, ok, detail=""):
    print(("  ok   " if ok else "  FAIL ") + name + ("" if ok else "  — " + str(detail)))
    if not ok: fails.append(name)

def safe(pg, js, dflt=None):
    try: return pg.evaluate(js)
    except Exception as e: return dflt       # §215: degrade, never die

with sync_playwright() as p:
    b = p.chromium.launch(executable_path=CHROME) if CHROME else p.chromium.launch()
    pg = b.new_page(viewport={"width": 1500, "height": 900})
    errs = []; pg.on("pageerror", lambda e: errs.append(str(e)))
    pg.add_init_script("try{sessionStorage.setItem('smp.welcome.done','1')}catch(e){}")
    pg.goto("file://" + os.path.abspath(BUILT)); pg.wait_for_timeout(800)

    unit = (safe(pg, "()=>UNIT_KEYS.filter(k=>drvHasTree(UNITS[k]))", []) or [None])[0]
    ck("the worked example holds a unit with a drivers tree", bool(unit), unit)

    def look():
        """Press into the unit and read what the three surfaces draw."""
        try:
            pg.click('[data-u="%s"]' % unit); pg.wait_for_timeout(150)
            # A section is `data-sub2`, keyed — never its label (§51.11: a
            # probe reading the tab attribute reported the ON state absent).
            drv = safe(pg, "()=>!!document.querySelector('[data-sub2=\"drivers\"]')", None)
            pg.click('[data-s="performance"]'); pg.wait_for_timeout(250)
            sec = safe(pg, "()=>!!document.querySelector('[data-sub2=\"perfdrv\"]')", None)
            card = safe(pg, "()=>/Revenue performance/.test(document.querySelector('#panel').innerText)", None)
            return {"drivers": drv, "section": sec, "card": card}
        except Exception as e:
            return {"drivers": None, "section": None, "card": None, "err": str(e)}

    def setup():
        try:
            pg.click('[data-md="setup"]'); pg.wait_for_timeout(200)
            pg.click('.ritem[data-setupgo="seasons"]'); pg.wait_for_timeout(250)
            return True
        except Exception:
            return False

    on = look()
    ck("ON: the unit shows a Drivers tab", on["drivers"] is True, on)
    ck("ON: Performance offers the Revenue drivers section", on["section"] is True, on)
    ck("ON: Performance shows the Revenue performance card", on["card"] is True, on)

    ck("the Revenue drivers page opens from the Setup rail", setup())
    btns = safe(pg, "()=>[...document.querySelectorAll('[data-drvswitch]')].map(b=>b.dataset.drvswitch+(b.classList.contains('on')?'*':''))", [])
    ck("the switch is drawn, On lit", btns == ["1*", "0"], btns)
    try: pg.click('[data-drvswitch="0"]'); pg.wait_for_timeout(250)
    except Exception as e: ck("pressing Off", False, e)
    ck("OFF deletes the stored key (§50.6)", safe(pg, "()=>!('driversOn' in GROUP)") is True)
    ck("OFF: the page says it is off, and that the trees are kept",
       bool(safe(pg, "()=>/off for this client/.test(document.querySelector('.setuppane').innerText) && /kept/.test(document.querySelector('.setuppane').innerText)")))
    ck("OFF: the trees themselves are still stored (§44)",
       safe(pg, "()=>drvHasTree(UNITS['%s'])" % unit) is True)

    off = look()
    ck("OFF: the unit shows NO Drivers tab", off["drivers"] is False, off)
    ck("OFF: Performance offers NO Revenue drivers section", off["section"] is False, off)
    ck("OFF: Performance shows NO Revenue performance card", off["card"] is False, off)

    ck("OFF: the page carrying the switch is still reachable (§61)", setup())
    try: pg.click('[data-drvswitch="1"]'); pg.wait_for_timeout(250)
    except Exception as e: ck("pressing On", False, e)
    ck("ON again writes an explicit true", safe(pg, "()=>GROUP.driversOn === true") is True)
    back = look()
    ck("ON again: all three come back as they were", back == on, back)

    ck("no page errors", not errs, errs[:3])
    b.close()

print("\n%d failed" % len(fails) if fails else "\nall passed")
sys.exit(1 if fails else 0)
