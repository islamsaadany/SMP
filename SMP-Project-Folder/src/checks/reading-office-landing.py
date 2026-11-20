"""THE OFFICE LANDS IN THE READING WINDOW TOO, UNDER THE SAME SWITCH (§799).

Islam: *"make this view the default for the smo as well"*; of the one
first-screen switch on Roles & access, *"same switch"*.

Both ends (§94.2), each read off the window's own state after the press
that lands a person (switchViewer runs the same `READING.offer` the sign-in
runs, §743):

  1 · With the switch on (the shipped default), the SMO team and the Super
      user open in the window, on the Overview; a reader's seat as before.
  2 · A seat that holds a piece — a function head — still opens on the
      workbench: the gate widened by the office alone.
  3 · With the switch off, nobody opens in the window, the office included.
  4 · Roles & access says the switch covers the office: its heading and the
      Today list name the office rows.
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
        return {"threw": str(e).strip().split("\n")[0][:160]}


LAND = "(k)=>{ try { READING.close(); } catch (e) {} switchViewer(k); return { open: READING.isOpen(), state: READING.state() }; }"

with sync_playwright() as p:
    b = p.chromium.launch(executable_path=os.environ.get("SMP_CHROME"))
    pg = b.new_page(viewport={"width": 1440, "height": 900})
    pg.add_init_script("try{sessionStorage.setItem('smp.welcome.seen','1');sessionStorage.setItem('smp.welcome.done','1');"
                       "sessionStorage.setItem('smp.tour.later','1');localStorage.setItem('smp.tour.never','1');}catch(e){}")
    errs = []
    pg.on("pageerror", lambda e: errs.append(str(e)))
    pg.goto("file://" + FILE); pg.wait_for_timeout(900)
    seats = js(pg, """()=>{ const w = world();
      const roles = k => SMPRules.personRoleKeys(w, PEOPLE.find(p => p.key === k));
      return { superUser: (PEOPLE.find(p => roles(p.key).indexOf('super') >= 0) || {}).key,
               smoTeam: (PEOPLE.find(p => roles(p.key).indexOf('smoteam') >= 0 && roles(p.key).indexOf('super') < 0) || {}).key,
               reader: (PEOPLE.find(p => READING.readerSeat(p)) || {}).key,
               head: (FUNCTION_KEYS.map(k => FUNCTIONS[k].head).filter(Boolean)[0]) || null,
               on: SMPRules.readersOpen(GROUP) }; }""")
    ok("made: a Super user, an SMO team member, a reader's seat, a function head; the switch on", isinstance(seats, dict) and all(seats.get(k) for k in ("superUser", "reader", "head")) and seats.get("on") is True, seats)

    print("\n── 1 · with the switch on")
    for label, key in (("the Super user", seats.get("superUser")), ("an SMO team member", seats.get("smoTeam")), ("a reader's seat", seats.get("reader"))):
        if not key:
            print("  (no %s in this data — not measured)" % label); continue
        r = js(pg, LAND, key); pg.wait_for_timeout(300)
        ok(label + " opens in the window, on the Overview", isinstance(r, dict) and r.get("open") is True and (r.get("state") or {}).get("tab") == "overview", r)

    print("\n── 2 · a seat that holds a piece still opens on the workbench")
    r = js(pg, LAND, seats.get("head")); pg.wait_for_timeout(300)
    ok("a function head opens on the workbench", isinstance(r, dict) and r.get("open") is False, r)

    print("\n── 3 · with the switch off")
    js(pg, "()=>{ var s = GROUP.structure = GROUP.structure || {}; s.readers = 'workbench'; }")
    for label, key in (("the Super user", seats.get("superUser")), ("a reader's seat", seats.get("reader"))):
        r = js(pg, LAND, key); pg.wait_for_timeout(300)
        ok(label + " opens on the workbench", isinstance(r, dict) and r.get("open") is False, r)
    js(pg, "()=>{ delete GROUP.structure.readers; }")

    print("\n── 4 · Roles & access says so")
    txt = js(pg, "()=>{ var d = document.createElement('div'); d.innerHTML = accLanding(false, SMPRules.ACCESS_ROWS.filter(r => !r.mid || midExists())); return d.textContent; }")
    ok("the switch's heading names the office", isinstance(txt, str) and "First screen for the office and for people who can change nothing" in txt, txt)
    office_titles = js(pg, "()=>SMPRules.ACCESS_ROWS.filter(r => r.of.length === 1 && SMPRules.isOfficeRole(r.of[0])).map(accTitle)")
    ok("…and the Today list carries the office rows", isinstance(txt, str) and isinstance(office_titles, list) and office_titles and all(t in txt for t in office_titles), (office_titles, txt))
    ok("no page errors", not errs, errs)
    b.close()

print()
if fails:
    print("FAILED %d: %s" % (len(fails), "; ".join(fails)))
    raise SystemExit(1)
print("reading-office-landing: all green")
