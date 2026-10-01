"""A SEAT IS NOT AN ORDINARY ROLE (§186).

Islam, from the deployment: *"hussein khaled is a custodian and getting the
super user — see why this happened as this might be repeated somewhere else
and people are getting super user … you assured me that it's impossible."*

IT WAS NOT IMPOSSIBLE, AND THE ROUTE IS ONE SELECTION. The register's role
picker offered every role a `<select>` can hold and commits on the `change`
event — §92 grants a one-destination role ON THE PICK, and a seat has exactly
one destination — so the most powerful grant in the product was a single
dropdown change with nothing in between. The server has always been right
(a seat move classifies as `access`, which is the Super user's), so the fault
was entirely the SCREEN offering what the save refuses — and, for the one
person it does not refuse, going through instantly and silently.

WHAT IS ASSERTED, and all of it at BOTH ENDS (§113.8), or a build that simply
removed the seats would pass every assertion about absence:

  · a viewer who may not change access is not OFFERED a seat, in the picker
    or in the people workbook's Role column — and still gets every ordinary
    role, or the fix has broken granting altogether
  · a Super user IS offered them, and picking one no longer grants on the
    pick: a dialog stands in front, it NAMES the person and the role (the
    failure mode is landing on the wrong line, and a confirmation that does
    not say which line catches none of them), and Cancel leaves the register
    exactly as it was
  · saying yes grants it, read back from the DATA and not from the screen
  · and the register WATCHES: a seat whose place is not where the person sits
    joins the attention queue, while the bootstrap SMO — who holds
    super@group AND heads the SMO function (§118) — does not, which is the
    whole reason the test is the place rather than "holds two roles"

PROVE IT CAN FAIL (§94.5): drop the `isSeatRole` branch out of
`tryGrantRole()` in shell.html, rebuild, and §3 fails on the dialog and on
the grant happening anyway.

Run:  SMP_CHROME=/opt/pw-browsers/chromium python3 qa-run.py checks/seat-grant.py
"""
import os, pathlib, sys
from playwright.sync_api import sync_playwright

HERE = pathlib.Path(__file__).resolve().parent
FILE = pathlib.Path(os.environ.get("SMP_SEAT_HTML") or
                    (HERE.parent / "strategy-management-platform.html"))
bad = 0
errs = []


def ck(w, ok, x=""):
    global bad
    if not ok:
        bad += 1
    print(("  ok      " if ok else "  FAIL    ") + w + (("  — " + str(x)) if not ok and x else ""))


def go_register(pg):
    """To the People register, through the chrome's own controls (§70)."""
    pg.evaluate("()=>document.querySelector('[data-md=\"setup\"]').click()")
    pg.wait_for_timeout(400)
    pg.evaluate("()=>document.querySelector('[data-setupgo=\"people\"]').click()")
    pg.wait_for_timeout(700)


def open_person(pg, key):
    pg.evaluate("(k)=>document.querySelector('[data-pmenu=\"'+k+'\"]').click()", key)
    pg.wait_for_timeout(300)
    pg.evaluate("(k)=>document.querySelector('[data-pedit=\"'+k+'\"]').click()", key)
    pg.wait_for_timeout(700)


def add_role(pg, key):
    """OPENS THE ROLES LIST (§372). There is no "+ role" control any more: the
    Roles cell IS the ticking list, so this presses the cell — the dialog's
    copy first, because a row's cell and the open person dialog draw the same
    picker for the same person."""
    pg.evaluate("""(k)=>{const s=document.querySelector('#modal-b [data-proleset="'+k+'"]')
                        || document.querySelector('[data-proleset="'+k+'"]');
                   const b=s&&s.previousElementSibling;
                   if(b&&b.classList.contains('ssbtn')) b.click();}""", key)
    pg.wait_for_timeout(500)


with sync_playwright() as pw:
    b = pw.chromium.launch(executable_path="/opt/pw-browsers/chromium",
                           args=["--no-sandbox", "--disable-dev-shm-usage"])
    pg = b.new_page(viewport={"width": 1600, "height": 1000})
    pg.on("pageerror", lambda e: errs.append(str(e)))
    pg.on("console", lambda m: errs.append(m.text) if m.type == "error" else None)
    pg.add_init_script("try{sessionStorage.setItem('smp.welcome.seen','1');"
                       "sessionStorage.setItem('smp.welcome.done','1');"
                       "localStorage.setItem('smp.tour.never','1')}catch(e){}")
    pg.goto("file://" + str(FILE)); pg.wait_for_timeout(1400)

    # ── 0 · THE SHARED RULE ────────────────────────────────────────────────
    print("\n0 · which roles are seats")
    seats = pg.evaluate("() => SMPRules.SEAT_ROLES")
    ck("the four seats are named in the shared rules",
       sorted(seats) == ["cceo", "gceo", "smoteam", "super"], seats)
    ck("...and a job on a plan is not one of them",
       pg.evaluate("() => ['custodian','owner','fnhead','powner','plowner']"
                   ".every(k => !SMPRules.isSeatRole(k))"))

    # ── 1 · WHO IS OFFERED ONE ─────────────────────────────────────────────
    # The picker's list is built from roleIsGrantable(), which asks the same
    # question the server asks about the save (§42).
    print("\n1 · a seat is only offered by somebody who may give one")
    who = pg.evaluate("""() => {
      const w = world();
      const smo = PEOPLE.filter(p => SMPRules.mayEditAccess(w, p))[0];
      const not = PEOPLE.filter(p => !SMPRules.mayEditAccess(w, p) &&
                                     personActive(p) &&
                                     SMPRules.personRoles(w, p).length)[0];
      const offered = (v) => ROLES.filter(r => roleIsGrantable(r.key, v)).map(r => r.key);
      return { smo: smo && smo.key, notKey: not && not.key,
               smoSees: smo ? offered(smo) : null,
               otherSees: not ? offered(not) : null };
    }""")
    ck("the fixture found both a Super user and somebody who is not one",
       who["smo"] and who["notKey"], who)
    ck("a Super user is offered the seats",
       all(k in (who["smoSees"] or []) for k in seats), who["smoSees"])
    ck("...and nobody else is",
       all(k not in (who["otherSees"] or []) for k in seats), who["otherSees"])
    # BOTH ENDS: granting must still work for everything that is not a seat,
    # or "no seats offered" is satisfied by a picker that offers nothing.
    ck("...while every ordinary role is still on offer to them",
       set(who["otherSees"] or []) ==
       set(k for k in (who["smoSees"] or []) if k not in seats),
       who["otherSees"])

    # ── 2 · AND THE WORKBOOK IS THE SAME QUESTION ──────────────────────────
    # The Role column is the second road to p.role = "super": the reader
    # grants what it names, so the template must not offer what the picker
    # will not (§53.5).
    print("\n2 · the people file agrees with the picker")
    ck("a seat named in a file is refused for somebody who may not give one",
       pg.evaluate("""() => {
         const w = world();
         const not = PEOPLE.filter(p => !SMPRules.mayEditAccess(w, p) &&
                                        personActive(p))[0];
         const was = VIEWER; VIEWER = not.key;
         const ok = SMPRules.SEAT_ROLES.every(k => !roleIsGrantable(k));
         VIEWER = was; return ok; }"""))

    # ── 3 · THE ASK ────────────────────────────────────────────────────────
    print("\n3 · picking a seat asks before it grants")
    # Somebody seated at a function and holding no seat — Islam's Hussein.
    target = pg.evaluate("""() => {
      const w = world();
      const fk = FUNCTION_KEYS.filter(k => (FUNCTIONS[k]||{}).head)[0];
      const p = personBy(FUNCTIONS[fk].head);
      VIEWER = PEOPLE.filter(x => SMPRules.mayEditAccess(w, x))[0].key;
      return { key: p.key, at: personAt(p), role: p.role || null };
    }""")
    go_register(pg)
    open_person(pg, target["key"])
    add_role(pg, target["key"])
    ck("the fixture's person holds no seat to begin with",
       target["role"] is None, target)
    # WHAT THE LIST SHOWS BEFORE ANYTHING IS PICKED. §372 made the cell a
    # ticking list, so its ticks are the roles this person already holds —
    # `fnhead` here, legitimately. Cancel's claim is that the register is left
    # EXACTLY as it was, so it is compared against this rather than against a
    # list the check would have to re-derive from the product's own rules.
    TICKS = """(k)=>{
      const sel = document.querySelector('#modal-b [data-proleset="'+k+'"]')
               || document.querySelector('[data-proleset="'+k+'"]');
      return sel ? [...sel.options].filter(o=>o.selected).map(o=>o.value) : null;
    }"""
    ticks0 = pg.evaluate(TICKS, target["key"])

    picked = pg.evaluate("""(a) => {
      const k = a[0], role = a[1];
      const sel = document.querySelector('#modal-b [data-proleset="' + k + '"]')
               || document.querySelector('[data-proleset="' + k + '"]');
      if (!sel) return null;
      const op = [...sel.options].find(o => o.value === role);
      if (!op) return { has: false };
      /* WHAT A TICK IS (searchsel's toggle): the option goes on and the select
         fires its own change. Driven here rather than through the popup row
         because this file is about what the SERVER and the rules do with it. */
      op.selected = true;
      sel.dispatchEvent(new Event('change', { bubbles: true }));
      return { has: true };
    }""", [target["key"], "super"])
    ck("the picker is on the row and offers the seat to the SMO",
       picked and picked.get("has"), picked)
    pg.wait_for_timeout(600)

    # THE ASK IS IN THE DIALOG'S OWN BODY, not a modal of its own — the
    # register repaints that dialog on every change (§116.6), so a second
    # modal is overwritten before anybody can read it. Measured, not
    # reasoned: the first build did exactly that and the person form painted
    # straight back over the question.
    dlg = pg.evaluate("""() => {
      const a = document.querySelector('#modal-b .seatask');
      return { open: !!a,
               text: a ? a.innerText.replace(/\\s+/g, ' ').trim() : "",
               yes: !!document.querySelector('#modal-b [data-seatyes]'),
               no:  !!document.querySelector('#modal-b [data-seatno]') };
    }""")
    ck("the ask stands in front of it", dlg["open"] and dlg["yes"] and dlg["no"], dlg)
    if dlg["open"]:
        nm = pg.evaluate("(k)=>personBy(k).name", target["key"])
        # NAMING IS THE POINT. The failure mode is landing on the wrong line of
        # a dropdown, so a confirmation that does not say WHICH line and WHICH
        # person catches none of them.
        ck("...it names the person", nm and nm in dlg["text"], dlg["text"][:140])
        ck("...and the role", "Super user" in dlg["text"], dlg["text"][:140])
        ck("...and says what it hands over",
           "who may do what" in dlg["text"], dlg["text"][:220])
        # AND NOTHING IS GRANTED WHILE IT STANDS (§113.8: an ask that grants
        # anyway is a notice, not a question).
        ck("...and nothing is granted while it stands",
           pg.evaluate("(k)=>personBy(k).role || null", target["key"]) is None)

    # CANCEL LEAVES THE REGISTER EXACTLY AS IT WAS.
    pg.evaluate("()=>{const b=document.querySelector('#modal-b [data-seatno]'); if(b) b.click();}")
    pg.wait_for_timeout(500)
    # `ADDROLE_KIND` was the ONE pending value of a picker that had exactly one,
    # so an empty string there meant "nothing is being offered" (§372 replaced
    # it with a ticking list). The list's ticks are what the person HOLDS, and
    # this fixture holds `fnhead` legitimately — so the claim is REWRITTEN to
    # what it was always about: the REFUSED seat is not left ticked, or picking
    # it again fires no `change` (§110) and the row reads as dead.
    after = {"role": pg.evaluate("(k)=>personBy(k).role || null", target["key"]),
             "ticked": pg.evaluate(TICKS, target["key"])}
    ck("Cancel grants nothing", after["role"] is None, after)
    ck("...and the refused seat is not left ticked",
       "super" not in (after["ticked"] or []), after)
    # BOTH ENDS (§113.8): a build that emptied the list on Cancel would satisfy
    # the line above perfectly while throwing away what they do hold.
    ck("...and the list is exactly what it was before the pick",
       after["ticked"] == ticks0, {"was": ticks0, "now": after["ticked"]})

    # ── 4 · AND YES GRANTS IT ──────────────────────────────────────────────
    print("\n4 · confirming hands it over")
    # Back to the register and open the picker again. Stated rather than
    # assumed: closing the dialog returns focus and repaints, and a check that
    # took the page's state on trust after a modal would be measuring
    # whatever the close left behind (§94.2).
    go_register(pg)
    open_person(pg, target["key"])
    add_role(pg, target["key"])
    ck("the picker is back on the row",
       pg.evaluate("(k)=>!!document.querySelector('#modal-b [data-proleset=\"'+k+'\"]')"
                   " || !!document.querySelector('[data-proleset=\"'+k+'\"]')",
                   target["key"]))
    pg.evaluate("""(a) => {
      const k = a[0], role = a[1];
      const sel = document.querySelector('#modal-b [data-proleset="' + k + '"]')
               || document.querySelector('[data-proleset="' + k + '"]');
      if (!sel) return null;
      const op = [...sel.options].find(o => o.value === role);
      if (!op) return { has: false };
      /* WHAT A TICK IS (searchsel's toggle): the option goes on and the select
         fires its own change. Driven here rather than through the popup row
         because this file is about what the SERVER and the rules do with it. */
      op.selected = true;
      sel.dispatchEvent(new Event('change', { bubbles: true }));
      return { has: true };
    }""", [target["key"], "super"])
    pg.wait_for_timeout(600)
    pg.evaluate("()=>{const b=document.querySelector('#modal-b [data-seatyes]'); if(b) b.click();}")
    pg.wait_for_timeout(700)
    # Asked of the DATA, never of the screen.
    got = pg.evaluate("(k)=>personBy(k).role || null", target["key"])
    ck("saying yes writes the seat", got == "super", got)

    # ── 5 · AND THE REGISTER NOTICES IT ────────────────────────────────────
    print("\n5 · a seat sitting somewhere else joins the queue")
    q = pg.evaluate("""(k) => {
      const rows = attentionQueue();
      const mine = rows.filter(r => r.key === k)[0];
      const w = world();
      const smo = PEOPLE.filter(p => p.key === 'smo')[0];
      return { inQueue: !!mine,
               kind: mine ? mine.why[0].kind : null,
               say: mine ? mine.why.map(x=>x.kind).join(",") : null,
               first: rows.length ? rows[0].why[0].kind : null,
               officeFlagged: smo ? !!SMPRules.seatOutOfPlace(w, smo, personAt(smo)) : null };
    }""", target["key"])
    ck("the row is in the attention queue", q["inQueue"], q)
    ck("...under its own kind", q["kind"] == "seat", q)
    # THE OTHER END, and the whole reason the test is the PLACE: the office's
    # own row holds a seat AND a function head, and must not be nagged about.
    ck("...and the bootstrap SMO is NOT flagged", q["officeFlagged"] is False, q)

    ck("nothing threw", not errs, errs[:1])
    b.close()

print(("\n%d FAILED" % bad) if bad else "\nseat-grant: OK")
sys.exit(1 if bad else 0)
