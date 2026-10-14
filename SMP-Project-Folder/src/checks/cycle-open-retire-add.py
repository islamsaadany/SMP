"""§533.3 — THE THREE PATHS NOTHING ELSE WALKS.

Three conversions in §533.3 have no check between them: opening a new cycle,
retiring a person, and naming a new supporting function. cycle-edit.py covers
CLOSING a cycle and monthly-plan.py covers clearing a plan; these three were
browser dialogs nothing pressed.

What is asserted, and why each end matters (§94.2):

  - OPENING A CYCLE NO LONGER ARCHIVES BEFORE IT ASKS. It archived, asked, and
    undid the archive on Cancel — the one place in the product where Cancel
    had work to reverse rather than nothing to do, and safe only while the
    undo ran. Cancel is measured against ARCHIVES, not against the screen
    (§96), because the fault it replaces was invisible on screen: the archive
    was there and the dialog was over it;
  - and the question says what the archive WILL hold, which is the same
    snapshot the archive is made from — a dialog quoting different numbers
    from the thing it is about is the §53.5 fault in its most expensive form;
  - RETIRING asks in the row's own corner, and only when there is something to
    take. Somebody holding nothing is retired by the press, which is what the
    browser's box did and must survive the move;
  - NAMING A FUNCTION is a field in the page. A browser may suppress a
    prompt() (§95, §69.22), so the last one is gone; Enter still adds, because
    a field beside an Add button that ignores Enter feels broken.

SMP_BUILT points it at another build, so it can be run against the build
before (§276: a broken build is made from the SOURCES).
"""
import os
from playwright.sync_api import sync_playwright

BUILT = os.environ.get("SMP_BUILT") or os.path.join(
    os.path.dirname(__file__), "..", "strategy-management-platform.html")
URL = "file://" + os.path.abspath(BUILT)

bad = 0
def ck(w, ok, x=""):
    global bad
    if not ok: bad += 1
    print(("  ok      " if ok else "  FAIL    ") + w + (("  — %s" % (x,)) if not ok and x != "" else ""))

def ev(pg, js, arg=None, dflt=None):
    try:
        return pg.evaluate(js, arg) if arg is not None else pg.evaluate(js)
    except Exception as e:
        return dflt if dflt is not None else {"err": str(e)[:90]}

with sync_playwright() as p:
    b = p.chromium.launch(executable_path="/opt/pw-browsers/chromium",
                          args=["--no-sandbox", "--disable-dev-shm-usage"])
    pg = b.new_page(viewport={"width": 1500, "height": 2200})
    errs, natives = [], []
    pg.on("pageerror", lambda e: errs.append(str(e)))
    pg.on("console", lambda m: errs.append(m.text) if m.type == "error" else None)
    pg.on("dialog", lambda d: (natives.append(d.message), d.dismiss()))
    pg.goto(URL); pg.wait_for_timeout(1500)
    pg.select_option("#asWho", "smo"); pg.wait_for_timeout(300)

    print("\n§1 · opening a cycle asks BEFORE it archives")
    before = ev(pg, """() => {
      current='setup'; currentSub='cycle';
      NEWCYCLE = { name:"H2 2027", from:"Jul 2027", to:"Dec 2027", due:"10 Jan 2028" };
      paint();
      return { archives: ARCHIVES.length, review: REVIEW.name,
               counts: figuresSnapshotCounts(figuresSnapshot()) };
    }""")
    pg.wait_for_timeout(250)
    ok = ev(pg, "() => { const b = document.querySelector('[data-nc-go]'); if (!b) return false; b.click(); return true; }", None, False)
    pg.wait_for_timeout(300)
    d = ev(pg, """() => { const b = document.getElementById('modal-b');
      return { open: !!document.querySelector('.overlay.on'),
               text: b ? b.innerText : "",
               yes: !!(b && b.querySelector('[data-ncyes]')) }; }""", None, {"open": False})
    ck("the panel is on screen with its Open", ok)
    ck("no browser dialog is raised", not natives, natives)
    ck("the platform's own dialog opens", d.get("open") and d.get("yes"), d)
    ck("...quoting the same figures the archive will hold (§53.5)",
       str(before.get("counts", {}).get("reported", "?")) in d.get("text", ""),
       (before.get("counts"), d.get("text", "")[:200]))
    mid = ev(pg, "() => ({ archives: ARCHIVES.length, review: REVIEW.name })")
    # THE WHOLE POINT, and it is invisible on screen: the old build had already
    # filed the archive by the time this dialog stood over it.
    ck("NOTHING is archived while the question stands",
       mid.get("archives") == before.get("archives"), (before, mid))
    ck("...and the cycle has not changed", mid.get("review") == before.get("review"), mid)

    print("\n§2 · Cancel has nothing to undo")
    pg.eval_on_selector("[data-ncno]", "e => e.click()"); pg.wait_for_timeout(250)
    after = ev(pg, "() => ({ archives: ARCHIVES.length, review: REVIEW.name })")
    ck("no archive was filed", after.get("archives") == before.get("archives"), (before, after))
    ck("...and the cycle is untouched", after.get("review") == before.get("review"), after)

    print("\n§3 · and pressing it through does both, in that order")
    pg.eval_on_selector("[data-nc-go]", "e => e.click()"); pg.wait_for_timeout(300)
    pg.eval_on_selector("[data-ncyes]", "e => e.click()"); pg.wait_for_timeout(400)
    done = ev(pg, """() => ({ archives: ARCHIVES.length, review: REVIEW.name,
      top: ARCHIVES[0] ? { kind: ARCHIVES[0].kind, name: ARCHIVES[0].name,
                           why: ARCHIVES[0].why } : null })""")
    ck("the new cycle is open", done.get("review") == "H2 2027", done)
    ck("...and the old cycle's figures are archived", done.get("archives") == before.get("archives") + 1, done)
    ck("...as a figures archive, filed under the cycle it came from",
       (done.get("top") or {}).get("kind") == "figures"
       and (done.get("top") or {}).get("name") == before.get("review"), done.get("top"))
    ck("...saying which cycle cleared it",
       "H2 2027" in ((done.get("top") or {}).get("why") or ""), done.get("top"))

    print("\n§4 · retiring asks in the row's own corner")
    natives.clear()
    fx = ev(pg, """() => {
      const k = "retguy";
      if (!personBy(k)) PEOPLE.push({ key:k, name:"Ret Guy", unit:UNIT_KEYS[0], active:true });
      const p = personBy(k); p.active = true; delete p.heldRoles;
      grantPersonRole(k, "owner", UNIT_KEYS[0]);
      current='setup'; currentSub='people'; PMENU = k; paint();
      return { roles: personRoles(personBy(k)).length };
    }""")
    pg.wait_for_timeout(250)
    hit = ev(pg, """() => { const b = document.querySelector('[data-pact="retguy"]');
      if (!b) return false; b.click(); return true; }""", None, False)
    pg.wait_for_timeout(250)
    panel = ev(pg, """() => { const el = document.querySelector('.kconfirm .cq');
      return { open: !!document.querySelector('[data-pret-yes]'),
               text: el ? el.innerText : "" }; }""", None, {"open": False})
    ck("(fixture) somebody holding a seat", fx.get("roles", 0) > 0, fx)
    ck("Retire is reachable from the menu", hit)
    ck("no browser dialog is raised", not natives, natives)
    ck("the question opens in the row's corner", panel.get("open"), panel)
    ck("...naming what retiring takes", "role" in panel.get("text", "").lower(), panel.get("text", "")[:200])
    ck("...and that Restore brings them back", "Restore" in panel.get("text", ""), panel.get("text", "")[:200])
    ck("...nobody is retired yet",
       ev(pg, "() => !!personActive(personBy('retguy'))", None, False))
    pg.eval_on_selector("[data-pret-no]", "e => e.click()"); pg.wait_for_timeout(200)
    ck("Cancel retires nobody", ev(pg, "() => !!personActive(personBy('retguy'))", None, False))
    ev(pg, "() => { PMENU = 'retguy'; paint(); }"); pg.wait_for_timeout(200)
    pg.eval_on_selector('[data-pact="retguy"]', "e => e.click()"); pg.wait_for_timeout(250)
    pg.eval_on_selector("[data-pret-yes]", "e => e.click()"); pg.wait_for_timeout(300)
    ck("...and pressing it through retires them",
       ev(pg, "() => !personActive(personBy('retguy'))", None, False))

    print("\n§5 · somebody holding nothing is retired by the press")
    natives.clear()
    ev(pg, """() => {
      const k = "bareguy";
      if (!personBy(k)) PEOPLE.push({ key:k, name:"Bare Guy", unit:UNIT_KEYS[0], active:true });
      const p = personBy(k); p.active = true; delete p.heldRoles;
      PMENU = k; paint();
    }""")
    pg.wait_for_timeout(250)
    pg.eval_on_selector('[data-pact="bareguy"]', "e => e.click()"); pg.wait_for_timeout(300)
    ck("no question, because nothing is being decided",
       not ev(pg, "() => !!document.querySelector('[data-pret-yes]')", None, False))
    ck("...and no browser dialog either", not natives, natives)
    ck("...they are retired", ev(pg, "() => !personActive(personBy('bareguy'))", None, False))

    print("\n§6 · naming a function is a field in the page")
    natives.clear()
    ev(pg, "() => { current='setup'; currentSub='fns'; paint(); }"); pg.wait_for_timeout(300)
    fld = ev(pg, "() => !!document.getElementById('newfn')", None, False)
    ck("the add row carries a field", fld)
    before_n = ev(pg, "() => FUNCTION_KEYS.length", None, 0)
    if fld:
        pg.fill("#newfn", "Internal Audit")
        pg.eval_on_selector("#addfn", "e => e.click()"); pg.wait_for_timeout(300)
    after_n = ev(pg, "() => FUNCTION_KEYS.length", None, 0)
    ck("no browser prompt is raised", not natives, natives)
    ck("the function is added", after_n == before_n + 1, (before_n, after_n))
    ck("...under the typed name",
       ev(pg, "() => FUNCTION_KEYS.map(k => FUNCTIONS[k].name).indexOf('Internal Audit') > -1", None, False))
    ck("...and the field is emptied for the next one",
       ev(pg, "() => { const f = document.getElementById('newfn'); return f ? f.value : null; }") == "")
    # Enter adds too — the control this replaced took it.
    if fld:
        pg.fill("#newfn", "Procurement")
        pg.press("#newfn", "Enter"); pg.wait_for_timeout(300)
    ck("Enter adds as well",
       ev(pg, "() => FUNCTION_KEYS.map(k => FUNCTIONS[k].name).indexOf('Procurement') > -1", None, False))
    ck("an empty field adds nothing",
       (lambda n: (pg.eval_on_selector("#addfn", "e => e.click()"),
                   pg.wait_for_timeout(200),
                   ev(pg, "() => FUNCTION_KEYS.length", None, 0) == n)[-1])(
           ev(pg, "() => FUNCTION_KEYS.length", None, 0)))

    print("\n§7 · and the build is quiet")
    ck("no page errors", not errs, errs[:3])
    b.close()

print("\n%d failure(s)" % bad)
raise SystemExit(1 if bad else 0)
