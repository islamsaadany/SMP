"""GIVING SOMEBODY A ROLE ON THE REGISTER (§110).

WHY THIS IS ITS OWN CHECK, AND WHY EVERY ASSERTION PRESSES SOMETHING.

The fault it was written for was a control that was PRESENT, ENABLED, CORRECTLY
SIZED AND UNREACHABLE: the picker's second half was laid out 133px outside its
own cell and painted under the Email field, which took every click. Every check
in the suite went green on it for as long as it existed, because all of them ask
whether a control is in the document — `elementFromPoint` at the thing's own
centre returned the Email input (§93.4, third time; §70).

So nothing here reads the DOM for reassurance. It presses the control and then
asks BOTH ENDS (§94.2): did the data change, AND does the row say so. Either
alone can be true while the product is broken — a grant that is written and not
drawn is exactly what a retired row used to do.

HALF OF WHAT IS WORTH ASSERTING IS AN ABSENCE. There must be no second dropdown
anywhere, no picker on a retired row, and no field overflowing its cell — and a
build that had lost the whole picker would satisfy every one of those, which is
why each absence is paired with the presence that makes it meaningful.

PROVED ABLE TO FAIL BEFORE IT WAS BELIEVED (§94.5). Run it against a build from
before §110 — `python3 checks/role-picker.py ../strategy-management-platform-v3.22.html`
— and sections 1, 2, 5, 6, 7 and 8 fail. The default target is the built file.
"""
import json
import pathlib
import sys

from playwright.sync_api import sync_playwright

SRC = pathlib.Path(__file__).resolve().parent.parent
TARGET = sys.argv[1] if len(sys.argv) > 1 else "strategy-management-platform.html"
URL = "file://" + str((SRC / TARGET).resolve())

errs = []
bad = 0


def ck(what, ok, x=""):
    global bad
    if not ok:
        bad += 1
    print(("  ok      " if ok else "  FAIL    ") + what + (("  — " + str(x)) if not ok and x else ""))


def people(pg):
    pg.goto(URL)
    pg.wait_for_timeout(700)
    pg.click("[data-md='setup']")
    pg.wait_for_timeout(300)
    pg.click("[data-setupgo='people']")
    pg.wait_for_timeout(600)


def open_row(pg, key):
    """Opens the person DIALOG (§116): the register stopped editing inline, so
    every field this file presses now lives in the platform's own modal.

    From script, never pg.click(): playwright scrolls a target into view before
    pressing it, and section 7 measures whether anything moved."""
    pg.evaluate("(k)=>document.querySelector('[data-pmenu=\"'+k+'\"]').click()", key)
    pg.wait_for_timeout(200)
    pg.evaluate("(k)=>document.querySelector('[data-pedit=\"'+k+'\"]').click()", key)
    pg.wait_for_timeout(500)


def close_row(pg):
    """Save and let the register repaint — the row only shows what was typed
    once the dialog is closed, which is the trade §116 took deliberately."""
    pg.evaluate("()=>{const b=document.querySelector('[data-pdlg-close]'); if(b) b.click();}")
    pg.wait_for_timeout(500)


def set_unit(pg, key, at):
    """WHICHEVER FIELD HOLDS THAT KIND OF PLACE (§135.6). Companies left the
    Unit dropdown when they became a field of their own, so putting somebody in
    a company is now the Company select — and driving the Unit select with a
    `co:` value would be testing a path the product no longer has."""
    if str(at).startswith("co:"):
        pg.evaluate(
            """(a)=>{const s=document.querySelector('[data-pco="'+a[0]+'"]');
               s.value=a[1]; s.dispatchEvent(new Event('change',{bubbles:true}));}""",
            [key, at[3:]])
    else:
        pg.evaluate(
            """(a)=>{const s=document.querySelector('[data-pat="'+a[0]+'"]');
               s.value=a[1]; s.dispatchEvent(new Event('change',{bubbles:true}));}""",
            [key, at])
    pg.wait_for_timeout(400)


def pick_role(pg, key, label):
    """THROUGH THE CONTROL A PERSON ACTUALLY TOUCHES. The native <select> is
    hidden in place behind a searchsel button (§45.5), so setting `.value` from
    script would test a path nobody walks — and the bug this file exists for was
    precisely that the visible control could not be reached."""
    pg.evaluate(
        """(k)=>{const s=document.querySelector('[data-prole-pick="'+k+'"]');
           (s.__ssbtn||s.previousElementSibling).click();}""", key)
    pg.wait_for_timeout(250)
    hit = pg.evaluate(
        """(n)=>{const r=[...document.querySelectorAll('.sspop .ssrow')]
             .find(x=>x.textContent.trim()===n);
           if(!r) return false; r.click(); return true;}""", label)
    pg.wait_for_timeout(500)
    return hit


def roles_of(pg, key):
    return json.loads(pg.evaluate("(k)=>JSON.stringify(personRoles(personBy(k)))", key))


def stop_text(pg):
    return pg.evaluate(
        "()=>{const e=document.querySelector('.rolestop');return e?e.textContent.trim():null;}")


def chip_text(pg, key):
    """What the ROW says, as opposed to what the graph holds."""
    return pg.evaluate(
        """(k)=>{const tr=[...document.querySelectorAll('.peoplecfg tbody tr')]
             .find(t=>t.querySelector('[data-pmenu="'+k+'"]')||t.classList.contains('tk-open'));
           const c=tr&&tr.querySelector('td.roles');
           return c?c.innerText.replace(/\\s+/g,' ').trim():null;}""", key)


print("role picker — " + TARGET)
with sync_playwright() as p:
    b = p.chromium.launch()
    pg = b.new_page(viewport={"width": 1440, "height": 900})
    pg.on("pageerror", lambda e: errs.append("pageerror: " + str(e)))
    pg.on("console", lambda m: errs.append("console: " + m.text) if m.type == "error" else None)

    # ── 1. ONE DROPDOWN ──────────────────────────────────────────────
    # The absence, and the presence that makes it mean something: a build with
    # no picker at all would pass the first assertion on its own (§94.2).
    print("\n1. one dropdown, not two")
    people(pg)
    open_row(pg, "cfo")
    pg.evaluate("()=>document.querySelector('[data-prole-open]').click()")
    pg.wait_for_timeout(300)
    ck("the role picker is there",
       pg.evaluate("!!document.querySelector('[data-prole-pick]')"))
    ck("and there is no second dropdown",
       pg.evaluate("document.querySelectorAll('[data-prole-where]').length") == 0,
       pg.evaluate("document.querySelectorAll('[data-prole-where]').length"))

    # ── 2. THE ORDINARY CASE, BOTH ENDS ──────────────────────────────
    print("\n2. the role lands where the Unit says")
    for at, role, want in (("mobile", "BU owner", {"role": "owner", "at": "mobile"}),
                           ("mobile", "Strategy custodian", {"role": "custodian", "at": "mobile"}),
                           ("fn:finance", "Function head", {"role": "fnhead", "at": "fn:finance"}),
                           ("co:distribution", "Company CEO", {"role": "cceo", "at": "co:distribution"})):
        people(pg)
        open_row(pg, "cfo")
        set_unit(pg, "cfo", at)
        pg.evaluate("()=>document.querySelector('[data-prole-open]').click()")
        pg.wait_for_timeout(300)
        ck(role + ": the option is in the list", pick_role(pg, "cfo", role))
        held = roles_of(pg, "cfo")
        ck(role + " at " + at + " — the graph",
           any(r["role"] == want["role"] and r["at"] == want["at"] for r in held), held)
        # AND THE ROW SAYS SO. The retired case proves why: a grant can be
        # written and never drawn, which is the failure nobody can see.
        ck(role + ": nothing is refused", stop_text(pg) is None, stop_text(pg))
        # AND THE ROW SAYS SO, once the dialog is out of the way. The register
        # repaints on close (§116.6), which is the one moment the two are
        # compared — a grant written and never drawn is what a retired row used
        # to do, and it is still the failure nobody can see.
        close_row(pg)
        ck(role + " at " + at + " — the row", role.lower() in (chip_text(pg, "cfo") or "").lower(),
           chip_text(pg, "cfo"))

    # ── 3. A SEAT OVER THE GROUP IGNORES THE UNIT (§92) ──────────────
    # Somebody sitting in Mobile can be the Super user; the Unit cell has
    # nothing to say about a role with one destination, and must not refuse it.
    print("\n3. a seat over the group ignores the Unit (§92)")
    for role, key in (("Super user", "super"), ("SMO team", "smoteam"), ("Group CEO", "gceo")):
        people(pg)
        open_row(pg, "cfo")
        set_unit(pg, "cfo", "mobile")
        pg.evaluate("()=>document.querySelector('[data-prole-open]').click()")
        pg.wait_for_timeout(300)
        pick_role(pg, "cfo", role)
        held = roles_of(pg, "cfo")
        ck(role + " granted at the group",
           any(r["role"] == key and r["at"] == "group" for r in held), held)
        ck(role + ": not refused", stop_text(pg) is None, stop_text(pg))

    # ── 4. A PICK THAT CANNOT LAND SAYS SO ───────────────────────────
    # BOTH ENDS AGAIN, and this is the pair the old control could not tell
    # apart: nothing granted AND a sentence on the row. Nothing granted on its
    # own is what it did before — silently.
    print("\n4. a pick that cannot land says so")
    people(pg)
    open_row(pg, "cfo")
    set_unit(pg, "cfo", "")
    pg.evaluate("()=>document.querySelector('[data-prole-open]').click()")
    pg.wait_for_timeout(300)
    pick_role(pg, "cfo", "BU owner")
    said = stop_text(pg) or ""
    ck("no Unit: nothing granted", roles_of(pg, "cfo") == [], roles_of(pg, "cfo"))
    ck("no Unit: the row says to set it", "Unit" in said and said != "", said)

    people(pg)
    open_row(pg, "cfo")
    set_unit(pg, "cfo", "mobile")
    pg.evaluate("()=>document.querySelector('[data-prole-open]').click()")
    pg.wait_for_timeout(300)
    pick_role(pg, "cfo", "Company CEO")
    said = stop_text(pg) or ""
    ck("wrong kind: nothing granted",
       not any(r["role"] == "cceo" for r in roles_of(pg, "cfo")), roles_of(pg, "cfo"))
    ck("wrong kind: the row names the kind it needs", "company" in said.lower(), said)
    # AND IT NAMES THE FIELD THAT CAN ANSWER IT (§135.6). Before the company
    # field existed, "change the Unit" was the way out; it is not any more, and
    # a refusal pointing at a control that cannot answer is §16.7's dead end.
    ck("wrong kind: ...and the field that answers it",
       "company" in said.lower() and "unit" not in said.lower(), said)

    # ── 4b. AND EITHER HALF CAN BE THE ONE THAT FINISHES IT ─────────
    # A refused pick leaves the picker open with that role still SHOWING, so
    # picking it again fires no change at all — setting the Unit has to be what
    # completes it, or the way out of a refusal is a control that does nothing.
    # Islam: "the role and the unit shouldn't block each other but they only
    # function together."
    print("\n4b. the Unit can be the answer, not only the role")
    people(pg)
    open_row(pg, "cfo")
    set_unit(pg, "cfo", "")
    pg.evaluate("()=>document.querySelector('[data-prole-open]').click()")
    pg.wait_for_timeout(300)
    pick_role(pg, "cfo", "BU owner")
    ck("refused first", roles_of(pg, "cfo") == [], roles_of(pg, "cfo"))
    set_unit(pg, "cfo", "nigeria")
    held = roles_of(pg, "cfo")
    ck("setting the Unit completes it",
       any(r["role"] == "owner" and r["at"] == "nigeria" for r in held), held)
    ck("...and the refusal is gone", stop_text(pg) is None, stop_text(pg))
    # AND A UNIT CHANGE WITH NO PICK STANDING IS STILL JUST A MOVE.
    people(pg)
    open_row(pg, "cfo")
    set_unit(pg, "cfo", "nigeria")
    ck("moving somebody with no pick standing grants nothing",
       roles_of(pg, "cfo") == [], roles_of(pg, "cfo"))

    # ── 4c. AND LEAVING THE ROW TAKES THE PICKER WITH IT ────────────
    # `ADDROLE` and `ROLESTOP` belong to one open row; neither was cleared when
    # it closed, so a refusal answered by pressing Cancel came back the next
    # time that row was opened, about a pick nobody had just made (§25.2).
    print("\n4c. a refusal does not outlive the row")
    people(pg)
    open_row(pg, "cfo")
    set_unit(pg, "cfo", "")
    pg.evaluate("()=>document.querySelector('[data-prole-open]').click()")
    pg.wait_for_timeout(300)
    pick_role(pg, "cfo", "BU owner")
    ck("refused", stop_text(pg) is not None)
    # Cancel is the dialog's now (§116): `data-rowcancel` was the open row's,
    # and there is no open row.
    pg.evaluate("()=>document.querySelector('[data-pdlg-cancel]').click()")
    pg.wait_for_timeout(500)
    ck("Cancel takes the refusal away", stop_text(pg) is None, stop_text(pg))
    open_row(pg, "cfo")
    ck("and reopening the row starts clean — the picker is shut",
       pg.evaluate("!!document.querySelector('[data-prole-open]')") and
       stop_text(pg) is None, stop_text(pg))

    # ── 5. A RETIRED ROW IS REFUSED, AND NOTHING IS WRITTEN ──────────
    print("\n5. a retired row holds nothing and is offered nothing")
    people(pg)
    was = pg.evaluate("JSON.stringify(UNIT_ROLES.nigeria)")
    pg.evaluate("()=>{retirePerson('cfo'); paint();}")
    pg.wait_for_timeout(400)
    open_row(pg, "cfo")
    ck("no picker on a retired row",
       not pg.evaluate("!!document.querySelector('[data-prole-open]')"))
    ck("and it says why", "retired" in (stop_text(pg) or "").lower(), stop_text(pg))
    ck("no unit was pointed at them",
       pg.evaluate("JSON.stringify(UNIT_ROLES.nigeria)") == was)

    # ── 6. CANCEL PUTS BOTH HALVES BACK ──────────────────────────────
    # Including the person the grant DISPLACED: granting an owner overwrites
    # whoever held it, so undoing by revoking would leave the unit with no head.
    print("\n6. Cancel puts back what the grant displaced")
    people(pg)
    before = pg.evaluate(
        "[JSON.stringify(UNIT_ROLES.nigeria), personBy('cfo').unit||null]")
    open_row(pg, "cfo")
    set_unit(pg, "cfo", "nigeria")
    pg.evaluate("()=>document.querySelector('[data-prole-open]').click()")
    pg.wait_for_timeout(300)
    pick_role(pg, "cfo", "BU owner")
    mid = pg.evaluate("[JSON.stringify(UNIT_ROLES.nigeria), personBy('cfo').unit||null]")
    ck("the grant landed first", mid != before, mid)
    pg.evaluate("()=>document.querySelector('[data-pdlg-cancel]').click()")
    pg.wait_for_timeout(600)
    after = pg.evaluate("[JSON.stringify(UNIT_ROLES.nigeria), personBy('cfo').unit||null]")
    ck("Cancel restores the unit's head and the person's own place",
       after == before, str(before) + " -> " + str(after))

    # ── 7. OPENING A ROW DOES NOT MOVE IT ────────────────────────────
    # The register is its own scrolling box, and a plain focus() lets the
    # browser haul the focused field to the top of it. Measured on a row well
    # down the list, because the fault is invisible on the first few.
    print("\n7. opening a row leaves it where it was")
    people(pg)
    key = pg.evaluate("()=>[...document.querySelectorAll('[data-pmenu]')][19].dataset.pmenu")
    pg.evaluate("()=>{document.querySelector('.cfg.peoplebox').scrollTop=0;}")
    pg.wait_for_timeout(200)
    b4 = pg.evaluate(
        "(k)=>[document.querySelector('.cfg.peoplebox').scrollTop,"
        " Math.round(document.querySelector('[data-pmenu=\"'+k+'\"]')"
        ".closest('tr').getBoundingClientRect().top)]", key)
    open_row(pg, key)
    # THE ROW ITSELF, FOUND BY ITS KEY. There is no `tr.tk-open` any more — the
    # register does not open rows — so the question becomes the one that always
    # mattered: is the row where it was when you pressed it.
    af = pg.evaluate(
        "(k)=>[document.querySelector('.cfg.peoplebox').scrollTop,"
        " Math.round(document.querySelector('[data-pmenu=\"'+k+'\"]')"
        ".closest('tr').getBoundingClientRect().top)]", key)
    ck("the register does not scroll", b4 == af, str(b4) + " -> " + str(af))
    # AND THE CURSOR LANDS IN THE DIALOG. Opening it without focusing anything
    # would pass the line above and lose the feature (§110.7's pair, one surface
    # along).
    ck("the cursor is in the dialog's first field",
       pg.evaluate("()=>{const a=document.activeElement;"
                   "return !!(a && a.closest && a.closest('#modal-b .pdf'));}"))
    close_row(pg)

    # ── 8. THE TABLE HAS NOTHING TO OVERFLOW WITH (§116) ────────────
    # Section 8 used to measure an open row's fields against their cells, and
    # the answer now is that there are none: the register only reads. So the
    # assertion changes into the one that made all of those impossible — no
    # input, no select and no Save/Cancel column anywhere in the table, at any
    # width — and the fields are measured where they actually live.
    print("\n8. the table reads, the dialog writes")
    for w in (1600, 1440, 1280, 1100):
        pg.set_viewport_size({"width": w, "height": 900})
        people(pg)
        ck("%d: no field in the table" % w,
           pg.evaluate("document.querySelectorAll('.peoplecfg input, .peoplecfg select').length") == 0,
           pg.evaluate("document.querySelectorAll('.peoplecfg input, .peoplecfg select').length"))
        ck("%d: every row is one line" % w,
           pg.evaluate("""()=>{const hs={};
             document.querySelectorAll('.peoplecfg tbody tr').forEach(r=>{
               const h=Math.round(r.getBoundingClientRect().height); hs[h]=(hs[h]||0)+1;});
             return Object.keys(hs).length===1;}"""),
           pg.evaluate("""()=>{const hs={};
             document.querySelectorAll('.peoplecfg tbody tr').forEach(r=>{
               const h=Math.round(r.getBoundingClientRect().height); hs[h]=(hs[h]||0)+1;});
             return JSON.stringify(hs);}"""))
        open_row(pg, "cfo")
        # AND NOTHING IN THE DIALOG OVERFLOWS ITS FIELD.
        ck("%d: nothing clipped in the dialog" % w,
           pg.evaluate("""()=>{let bad=0;
             document.querySelectorAll('#modal-b .pdf .fld').forEach(f=>{
               if(f.scrollWidth>f.clientWidth+1) bad++;});
             return bad;}""") == 0)
        ck("%d: the role picker can be pressed" % w,
           pg.evaluate("""()=>{const a=document.querySelector('#modal-b [data-prole-open]');
             if(!a) return false; const q=a.getBoundingClientRect();
             const h=document.elementFromPoint(Math.round(q.left+q.width/2),
                                               Math.round(q.top+q.height/2));
             return !!h && (h===a || a.contains(h));}"""))
        close_row(pg)

    ck("no console errors", not errs, errs[:3])
    b.close()

print("\n" + ("all good" if not bad else "%d FAILED" % bad))
sys.exit(1 if bad else 0)
