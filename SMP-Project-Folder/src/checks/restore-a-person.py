"""RESTORING A PERSON: three answers, so three controls (§533.1).

The one place in the product where the browser's box had been made to carry a
question with three answers. OK gave back the roles it could; CANCEL brought
the person back with no role; and not restoring at all was a SECOND box behind
the Cancel. The mockup (design-mockups/restore-a-person/) was signed off
2026-10-14.

What is asserted, and why each end matters (§94.2):

  - the browser's dialog is GONE and the platform's own is drawn, with THREE
    answers — a check that only counted the new dialog would pass on a build
    that raised both;
  - CANCEL RESTORES NOTHING. This is the whole fault: the old Cancel was an
    answer, so Escape, a dismissed box and a browser that has stopped showing
    them (§95) all landed on a real change nobody chose. Read back from the
    DATA, never from the screen (§96);
  - Give them back returns the free seats AND LEAVES THE TAKEN ONE WITH ITS
    HOLDER — §49.4's rule, which is what the question exists to protect;
  - No role returns the person holding nothing, which is a different answer
    and has to stay reachable;
  - the all-taken case offers ONE answer and says why, rather than offering a
    button that would give nothing back (the old build asked twice there, the
    first time pointlessly);
  - and somebody who held nothing is restored with no question at all, because
    nothing is being decided.

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

def ev(pg, js, dflt=None):
    try: return pg.evaluate(js)
    except Exception as e: return dflt if dflt is not None else {"err": str(e)[:90]}

# ── THE CHECK MAKES ITS OWN PEOPLE (§255, §333) ───────────────────────────
# Three shapes are needed and the demo guarantees none of them: somebody
# retired holding free seats AND one taken since, somebody retired whose seats
# are all taken, and somebody retired holding nothing. Built through the
# platform's OWN grant and retire, so what is measured is the product's rule
# and not a hand-made state it would never produce (§100.3).
FIXTURE = """() => {
  const u = UNIT_KEYS[0], v = UNIT_KEYS[1] || UNIT_KEYS[0];
  const mk = (key, name) => {
    let p = personBy(key);
    if (!p) { PEOPLE.push({ key: key, name: name, unit: u, title: "Analyst", active: true }); p = personBy(key); }
    p.name = name; p.unit = u; p.title = "Analyst"; p.active = true;
    delete p.heldRoles;
    return p;
  };
  const a = mk("fixa", "Khalid Al-Mutairi");   // free seats, one taken later
  const b = mk("fixb", "Sara Belhaj");          // all taken
  const c = mk("fixc", "Omar Siddiqui");        // holds nothing
  const t = mk("fixt", "Noura Al-Harbi");       // the one who takes a seat
  grantPersonRole("fixa", "owner", u);
  grantPersonRole("fixa", "custodian", v);
  grantPersonRole("fixb", "owner", v);
  retirePerson("fixa"); retirePerson("fixb"); retirePerson("fixc");
  /* Somebody else takes one of each person's seats while they are out. */
  grantPersonRole("fixt", "custodian", v);
  grantPersonRole("fixt", "owner", v);
  current = 'setup'; currentSub = 'people'; paint();
  return { a: personHeldRoles("fixa").length, afree: personHeldRoles("fixa").filter(r => !r.taken).length,
           b: personHeldRoles("fixb").length, bfree: personHeldRoles("fixb").filter(r => !r.taken).length,
           c: personHeldRoles("fixc").length };
}"""

def act(pg, key):
    """Open the person's menu and press its Restore — the two deliberate
       presses the product asks for, never the handler called directly."""
    pg.evaluate("(k) => { PMENU = k; paint(); }", key)
    pg.wait_for_timeout(150)
    hit = pg.evaluate("""(k) => { const b = document.querySelector('[data-pact="' + k + '"]');
                                  if (!b) return false; b.click(); return true; }""", key)
    pg.wait_for_timeout(250)
    return hit

def dlg(pg):
    return ev(pg, """() => {
      const m = document.querySelector('.overlay.on');
      if (!m) return { open: false };
      const b = document.getElementById('modal-b');
      return { open: true,
        title: (document.getElementById('modal-t') || {}).textContent || '',
        text: b ? b.innerText : '',
        picks: b ? b.querySelectorAll('.pick').length : 0,
        free:  b ? b.querySelectorAll('.rolelist .back').length : 0,
        taken: b ? b.querySelectorAll('.rolelist .taken').length : 0,
        give:  !!(b && b.querySelector('[data-rsgive]')),
        none:  !!(b && b.querySelector('[data-rsnone]')),
        cancel:!!(b && b.querySelector('[data-rsno]')) };
    }""", {"open": False})

def who(pg, key):
    """READ BACK FROM THE DATA, and ALWAYS WITH THE KEY IN HAND (§96). The
       first draft of this file called evaluate() without passing the key, so
       every answer came from personBy(undefined) — and "still retired" passed
       for a person who did not exist, which is the quietest way a check can
       lie about the thing it exists to prove."""
    try:
        return pg.evaluate("""(k) => { const p = personBy(k); if (!p) return { missing: true };
          return { active: !!personActive(p), roles: personRoles(p).map(r => r.role + '@' + r.at) }; }""", key)
    except Exception as e:
        return {"err": str(e)[:90]}

with sync_playwright() as p:
    b = p.chromium.launch(executable_path="/opt/pw-browsers/chromium",
                          args=["--no-sandbox", "--disable-dev-shm-usage"])
    pg = b.new_page(viewport={"width": 1500, "height": 2200})
    errs, natives = [], []
    pg.on("pageerror", lambda e: errs.append(str(e)))
    pg.on("console", lambda m: errs.append(m.text) if m.type == "error" else None)
    # The old build raised TWO of these in a row at this one control.
    pg.on("dialog", lambda d: (natives.append(d.message), d.dismiss()))
    pg.goto(URL); pg.wait_for_timeout(1500)
    pg.select_option("#asWho", "smo"); pg.wait_for_timeout(300)
    made = ev(pg, FIXTURE)

    print("\n§1 · three answers, in the platform's own dialog")
    ck("(fixture) one retired holding 2 seats, 1 taken since",
       made.get("a") == 2 and made.get("afree") == 1, made)
    ck("(fixture) one retired whose only seat is taken",
       made.get("b") == 1 and made.get("bfree") == 0, made)
    ck("(fixture) one retired holding nothing", made.get("c") == 0, made)
    ck("the menu's Restore is reachable", act(pg, "fixa"))
    d = dlg(pg)
    ck("no browser dialog is raised", not natives, natives)
    ck("the platform's own dialog opens", d.get("open"), d)
    ck("...with three answers, not two", d.get("give") and d.get("none") and d.get("cancel"), d)
    ck("...the free seat listed as free", d.get("free") == 1, d)
    ck("...the taken one listed as taken", d.get("taken") == 1, d)
    ck("...and whoever holds it now is named",
       "Noura Al-Harbi" in d.get("text", ""), d.get("text", "")[:260])

    print("\n§2 · Cancel restores nothing — the fault this conversion is for")
    pg.eval_on_selector("[data-rsno]", "e => e.click()"); pg.wait_for_timeout(250)
    st = who(pg, "fixa")
    ck("the person is still retired", st.get("active") is False and not st.get("missing"), st)
    ck("...and still holds nothing", st.get("roles") == [], st)

    print("\n§3 · Give them back: the free seat returns, the taken one does not move")
    act(pg, "fixa")
    pg.eval_on_selector("[data-rsgive]", "e => e.click()"); pg.wait_for_timeout(300)
    st = who(pg, "fixa")
    hold = ev(pg, """() => ({ taker: personRoles(personBy('fixt')).map(r => r.role + '@' + r.at) })""")
    ck("the person is active again", st.get("active") is True, st)
    ck("...holding the seat that was free", any(r.startswith("owner@") for r in st.get("roles", [])), st)
    ck("...and NOT the one somebody else took (§49.4)",
       not any(r.startswith("custodian@") for r in st.get("roles", [])), st)
    ck("...which its holder still has", any(r.startswith("custodian@") for r in hold.get("taker", [])), hold)

    print("\n§4 · No role is the other answer, and it stays reachable")
    natives.clear()
    ev(pg, "() => { retirePerson('fixa'); paint(); }")
    act(pg, "fixa")
    d = dlg(pg)
    ck("the dialog opens again", d.get("open") and d.get("none"), d)
    pg.eval_on_selector("[data-rsnone]", "e => e.click()"); pg.wait_for_timeout(300)
    st = who(pg, "fixa")
    ck("the person is active", st.get("active") is True, st)
    ck("...and holds no granted seat", not [r for r in st.get("roles", []) if "@" in r and not r.startswith("contrib")], st)
    ck("no browser dialog anywhere in that", not natives, natives)

    print("\n§5 · when nothing can be given back, ONE answer and the reason")
    natives.clear()
    act(pg, "fixb")
    d = dlg(pg)
    ck("the platform's own dialog opens", d.get("open"), d)
    ck("no browser dialog is raised", not natives, natives)
    ck("...offering no Give back it could not honour", not d.get("give"), d)
    ck("...one answer and a Cancel", d.get("none") and d.get("cancel") and d.get("picks") == 1, d)
    ck("...and saying why", "holds it now" in d.get("text", "")
       or "cannot be given back" in d.get("text", ""), d.get("text", "")[:260])
    pg.eval_on_selector("[data-rsno]", "e => e.click()"); pg.wait_for_timeout(200)
    ck("Cancel still restores nothing", who(pg, "fixb").get("active") is False)

    print("\n§6 · holding nothing, nothing is asked")
    natives.clear()
    act(pg, "fixc")
    ck("no dialog of any kind", not dlg(pg).get("open") and not natives, natives)
    ck("...and the row is simply active again", who(pg, "fixc").get("active") is True)

    print("\n§7 · and the build is quiet")
    ck("no page errors", not errs, errs[:3])
    b.close()

print("\n%d failure(s)" % bad)
raise SystemExit(1 if bad else 0)
