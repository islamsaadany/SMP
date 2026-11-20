"""THE REFINE PANEL ON THE COMPETITIVE DISCIPLINE TAB (§791).

Islam, with a screenshot of the panel saying "This part · Mobile" over "The
Copilot works on the Foundation, the SWOT and the Plan here": *"in the refine
in the competitive discipline I can't see the chats button nor the chat box
to start like the other areas of the plan"*.

THE CAUSE WAS ONE MISSING ENTRY: the panel reads the open Strategy tab into
the Copilot's area through a small map (STRAT_AREA), and the map named
Foundation, SWOT and the Plan — not Competitive Discipline, whose area the
Copilot tab already had (`compete`). So the tab fell to "no area" and the
panel to its refusal.

WHAT IS ASSERTED, both ends (§94.2):

  1 · With the section on for the business units and the live gate stubbed
      (the panel is drawn only live, and this is the file), the Competitive
      Discipline tab is there and the panel opened on it is a PANE — the
      chats rail, the question naming the part and the place, the box —
      never the refusal; its header names the part.

  2 · SWOT is as it was: the same pane, named SWOT.

  3 · A tab with no area (Drivers) still gets the refusal, which now names
      the four parts — so the map was widened by one entry, not thrown away.

The live gate is stubbed (data-copilot and SYNC.isLive), never the panel:
what is measured is the panel's own answer to the tab. SMP_BUILT points it
at another build (§276).
"""
import os
from playwright.sync_api import sync_playwright

HERE = os.path.dirname(os.path.abspath(__file__))
FILE = os.environ.get("SMP_BUILT") or os.path.join(os.path.dirname(HERE), "strategy-management-platform.html")
fails = []


def ok(label, cond, got=None):
    if cond:
        print("  ok   " + label)
    else:
        fails.append(label)
        print("  FAIL " + label + ("" if got is None else "  — %s" % (got,)))


def js(pg, expr, arg=None):
    try:
        return pg.evaluate(expr, arg) if arg is not None else pg.evaluate(expr)
    except Exception as e:                                    # noqa: BLE001
        return {"threw": str(e).strip().split("\n")[0][:140]}


PANEL = """()=>{ const el = document.getElementById('copPanel'); if (!el) return { panel: false };
  const t = el.textContent.replace(/\\s+/g, ' ');
  return { panel: true, none: !!el.querySelector('[data-cop-panelnone]'), pane: !!el.querySelector('[data-cop-pane]'),
           head: ((el.querySelector('.copPhead small') || {}).textContent || '').trim(),
           rail: !!el.querySelector('.coprhl, [data-cop-home]'),
           box: !!el.querySelector('textarea, [contenteditable="true"], input[type="text"]'),
           text: t.slice(0, 260) }; }"""


def open_tab(pg, key):
    hit = js(pg, "(k)=>{ var b = document.querySelector('#secrow-in button[data-sub2=\"' + k + '\"]'); if (!b) return false; b.click(); return true; }", key)
    pg.wait_for_timeout(300)
    return hit is True


def open_panel(pg):
    js(pg, "()=>{ var p = document.querySelector('[data-cop-panelclose]'); if (p) p.click(); }")
    pg.wait_for_timeout(150)
    pg.click("[data-cop-panelbtn]"); pg.wait_for_timeout(500)
    return js(pg, PANEL)


with sync_playwright() as p:
    b = p.chromium.launch(executable_path=os.environ.get("SMP_CHROME"))
    pg = b.new_page(viewport={"width": 1600, "height": 900})
    pg.add_init_script("try{sessionStorage.setItem('smp.welcome.seen','1');sessionStorage.setItem('smp.welcome.done','1');"
                       "sessionStorage.setItem('smp.tour.later','1');localStorage.setItem('smp.tour.never','1');}catch(e){}")
    errs = []
    pg.on("pageerror", lambda e: errs.append(str(e)))
    pg.goto("file://" + FILE); pg.wait_for_timeout(900)
    js(pg, "()=>{ switchViewer((PEOPLE.find(p=>SMPRules.isOffice(world(), p))||{}).key); }"); pg.wait_for_timeout(400)
    js(pg, "()=>{ window.cpPlanHeldProbe = function(){ var h = competeHolder(current); return h && h.compete && h.compete.discipline ? h.compete : null; }; }")
    made = js(pg, """()=>{ document.documentElement.setAttribute('data-copilot','1'); SYNC.isLive = function(){ return true; };
      current = activeKeys()[0]; currentSub = 'strategy'; CURSEC.strategy = 'found';
      /* the section on for this unit by Structure's own per-target override, the level's list untouched */
      var s = GROUP.structure = GROUP.structure || {}; s.over = s.over || {}; s.over[current] = Object.assign({}, s.over[current] || {}, { compete: true });
      var h = competeHolder(current); if (h && !(h.compete && h.compete.discipline)) h.compete = { discipline: 'solution', values: [{ title: 'Service that answers in a day', how: ['One desk'], measure: [] }] };
      paint();
      return { unit: UNITS[current].name, offered: SMPRules.compOffered(current, SMPRules.COMPETE), written: !!cpPlanHeldProbe(),
               tabs: [...document.querySelectorAll('#secrow-in button[data-sub2]')].map(b => b.textContent.trim()) }; }""")
    unit = (made or {}).get("unit") or ""
    ok("made: the section is on, written on the unit's plan, and the Strategy row carries Competitive Discipline", isinstance(made, dict) and made.get("offered") is True and made.get("written") is True and "Competitive Discipline" in (made.get("tabs") or []), made)

    print("\n── 1 · the panel on Competitive Discipline")
    ok("the tab opens", open_tab(pg, "compete") and js(pg, "()=>CURSEC.strategy") == "compete", js(pg, "()=>CURSEC.strategy"))
    r = open_panel(pg)
    ok("the panel is a pane — the chats rail and the box — not the refusal", isinstance(r, dict) and r.get("pane") is True and r.get("none") is False and r.get("rail") is True and r.get("box") is True, r)
    ok("…named Competitive Discipline · " + unit, isinstance(r, dict) and r.get("head") == "Competitive Discipline · " + unit, r)
    ok("…asking what to change in the unit's Competitive Discipline", isinstance(r, dict) and ("change in %s’s Competitive Discipline" % unit) in (r.get("text") or ""), r)

    print("\n── 2 · SWOT as it was")
    ok("the SWOT tab opens", open_tab(pg, "swot") and js(pg, "()=>CURSEC.strategy") == "swot")
    r = open_panel(pg)
    ok("the panel is the SWOT pane, named SWOT · " + unit, isinstance(r, dict) and r.get("pane") is True and r.get("head") == "SWOT · " + unit, r)

    print("\n── 3 · a tab with no area still gets the refusal, naming the four parts")
    if open_tab(pg, "drivers"):
        r = open_panel(pg)
        ok("Drivers: the refusal, not a pane", isinstance(r, dict) and r.get("none") is True and r.get("pane") is False, r)
        ok("…naming the Foundation, the SWOT, the Competitive Discipline and the Plan", isinstance(r, dict) and "the Foundation, the SWOT, the Competitive Discipline and the Plan" in (r.get("text") or ""), r)
    else:
        print("  (no Drivers tab on this unit — §3 not measured)")
    ok("no page errors", not errs, errs)
    b.close()

print()
if fails:
    print("FAILED %d: %s" % (len(fails), "; ".join(fails)))
    raise SystemExit(1)
print("copilot-panel-compete: all green")
