"""THE ROLE PICKER ASKS FOR AN ADDRESS BEFORE IT MINTS ANYBODY (§531).

WHAT WENT WRONG AND WHY A STAR ALONE WOULD NOT HAVE FIXED IT. §506 marked the
register's Add form with a star and refused the press without an address; §87.3
had already put the same two identifier fields in this popover and required
NEITHER. So the one control that creates a person WITHOUT opening that form was
the one control that could still create one with no address — and a person with
no address cannot sign in (§69) and cannot be written to. §531 closes it.

EVERY ASSERTION PRESSES SOMETHING, AND THEN ASKS BOTH ENDS (§94.2). A refusal
that is drawn and not enforced, and a refusal that is enforced and not drawn,
are two different shipped bugs and each would satisfy half this file. So the
press is made, `PEOPLE` is counted across it, and the popover is read: nobody
added AND the box ringed AND the sentence under it AND the cursor in it.

HALF OF IT IS THE PRESENCE THAT MAKES THE ABSENCE MEAN ANYTHING (§54.5). A
build whose "+ Add" did nothing at all — the easiest way to pass a check that
only counts people after a refused press — fails section 5, where the SAME
press with an address must add exactly one person and give them the role. And
a build that required an address of EVERYBODY, rather than of somebody being
created, fails section 6, where an existing row with no address is still
assignable: that is the cost line the mockup was signed off on, and it is the
half a blunt `required` would have broken silently.

THE WORDS ARE NOT WRITTEN OUT HERE EITHER. The sentence is read from the page's
own `PERSON_NEEDED`, so this file cannot be the reason the star, the press and
the check agree (§53.5) — if that entry is reworded, the product and this file
move together, and if the picker stops reading it they part.

PROVED ABLE TO FAIL BEFORE IT WAS BELIEVED (§94.5, §334.13). Pointed at the
build from before the change, sections 1 to 5 and 7 fail and the file still
REPORTS them — it does not die on the first control that is no longer there
(§215). Section 6 passes on both builds, which is the point of it: it is the
half the change must leave alone.

    git show HEAD:SMP-Project-Folder/strategy-management-platform-v3.22.html > /tmp/before.html
    SMP_BUILT=/tmp/before.html python3 checks/role-picker-email.py

Run: python3 checks/role-picker-email.py   (default target: the built file)
"""
import os
import pathlib

from playwright.sync_api import sync_playwright

# SMP_BUILT points it at another build, which is how it is falsified from the
# SOURCES (§276, §334.13 — a check that ignores it measures this build while
# the run claims to measure the broken one).
URL = "file://" + str(pathlib.Path(os.environ.get("SMP_BUILT") or pathlib.Path(
    pathlib.Path(__file__).resolve().parent.parent,
    "strategy-management-platform.html")).resolve())

fails = []
errs = []


def ck(name, ok, extra=""):
    print(("  ok   " if ok else "  FAIL ") + name + ((" — " + str(extra)) if extra else ""))
    if not ok:
        fails.append(name)


def open_unit_picker(pg):
    """Setup › Business units › ⋮ › Edit details › the BU head picker.

    THE ROUTE IS identity-merge.py's, not a shorter one invented here: §261 put
    a unit's fields in a dialog behind a three-dots menu, so the menu is opened
    first or Edit details is not in the document to press. Opened from script
    for the same reason that file gives — the menu press is not what is under
    test, and a real click would need the row scrolled into view."""
    pg.click("[data-md='setup']")
    pg.wait_for_timeout(350)
    pg.click("[data-setupgo='units']")
    pg.wait_for_timeout(800)
    pg.evaluate("()=>{const b=document.querySelector('[data-umenu]'); if(b) b.click();}")
    pg.wait_for_timeout(350)
    pg.evaluate("()=>{const b=document.querySelector('[data-rowdlg^=\"units|\"]'); if(b) b.click();}")
    pg.wait_for_timeout(700)
    pg.click(".pickbtn")
    pg.wait_for_timeout(500)


def type_name(pg, name):
    """`fill` fires `input`, which is what draws the Add button and the two
    identifier fields — they are hidden until there is a name to add."""
    pg.fill("#pickQ", name)
    pg.wait_for_timeout(400)


def press_add(pg):
    pg.evaluate("()=>{const b=document.querySelector('[data-pick-new]'); if(b) b.click();}")
    pg.wait_for_timeout(450)


def ensure_picker(pg, name):
    """Lands back in the picker when a press has closed it.

    ON THIS BUILD IT DOES NOTHING: a refused press draws onto the open popover
    and leaves it open, which is section 2's and section 4's whole point. It is
    here for the build where the press WENT THROUGH — the popover is gone, the
    person is made, and without this the next `fill` waits thirty seconds for a
    control that is never coming back and the file DIES rather than reporting
    (§215). A failure is section 2's to state in words, never an exception's."""
    st = picker_state(pg)
    if st["open"] and pg.query_selector("#pickNewEmail"):
        return False
    if pg.query_selector(".pickbtn"):
        pg.click(".pickbtn")
        pg.wait_for_timeout(450)
    else:
        pg.evaluate("""()=>{const b=document.querySelector('[data-rowdlg-cancel]')
            || document.querySelector('[data-rowdlg-close]'); if(b) b.click();}""")
        pg.wait_for_timeout(400)
        open_unit_picker(pg)
    type_name(pg, name)
    return True


def picker_state(pg):
    return pg.evaluate("""()=>{
      const mail = document.getElementById('pickNewEmail');
      const say  = document.querySelector('.picker .reqsay');
      const star = document.querySelector('.picknew .pickreq .reqmark');
      const idf  = document.getElementById('pickNewId');
      const q    = document.getElementById('pickQ');
      let starInBox = false, starClickable = null;
      if (star && mail) {
        const s = star.getBoundingClientRect(), m = mail.getBoundingClientRect();
        const cx = s.left + s.width/2, cy = s.top + s.height/2;
        starInBox = cx > m.left && cx < m.right && cy > m.top && cy < m.bottom;
        /* THE STAR MUST NOT TAKE THE CLICK the field is there for: §93.4's
           fault is a control that is present, correctly sized and
           unreachable, and this project has shipped it three times. */
        const hit = document.elementFromPoint(cx, cy);
        starClickable = hit ? (hit === mail ? 'the email box' : hit.tagName + '.' + hit.className) : null;
      }
      return {
        people: PEOPLE.length,
        open: !!document.querySelector('.picker'),
        typedName: q ? q.value : null,
        typedId: idf ? idf.value : null,
        ringed: !!(mail && mail.classList.contains('reqmiss')),
        outline: mail ? getComputedStyle(mail).outlineColor : null,
        focused: !!(mail && document.activeElement === mail),
        saidHidden: say ? !!say.hidden : null,
        said: say ? say.textContent.trim() : null,
        star: !!star,
        starShown: !!(star && star.offsetParent !== null),
        starInBox: starInBox,
        starTakesTheClick: starClickable,
        starOnEmpId: !!(idf && idf.parentElement &&
                        idf.parentElement.querySelector(':scope > .reqmark')),
        /* The page's own rule, never a copy of its words in this file. */
        needSay: (typeof PERSON_NEEDED !== 'undefined' &&
                  (PERSON_NEEDED.filter(function(n){return n.field==='email';})[0]||{}).say) || null
      };}""")


print("role picker — the address is needed (§531) — " + URL.split("/")[-1])
with sync_playwright() as p:
    b = p.chromium.launch(executable_path="/opt/pw-browsers/chromium",
                          args=["--no-sandbox", "--disable-dev-shm-usage"])
    pg = b.new_page(viewport={"width": 1440, "height": 900})
    pg.on("pageerror", lambda e: errs.append("pageerror: " + str(e)))
    pg.on("console", lambda m: errs.append("console: " + m.text) if m.type == "error" else None)
    pg.goto(URL)
    pg.wait_for_timeout(900)

    # ── 1 · THE STAR IS THERE BEFORE ANYBODY PRESSES ANYTHING ────────
    print("\n1 · the box says it is needed, before the press")
    open_unit_picker(pg)
    ck("the picker opened", pg.query_selector("#pickQ") is not None)
    type_name(pg, "Sara Nabil Fahmy")
    s = picker_state(pg)
    ck("the Email box carries the star", s["star"] and s["starShown"])
    ck("...inside the box, where there is no label to hang it beside", s["starInBox"])
    ck("...and it does not take the click the field is there for",
       s["starTakesTheClick"] == "the email box", s["starTakesTheClick"])
    ck("Emp ID is left optional, and carries none", not s["starOnEmpId"])
    ck("nothing is ringed before anybody has tried", not s["ringed"])
    ck("...and the sentence is there, and silent until it is pressed",
       s["saidHidden"] is True, s["said"])

    # ── 2 · THE PRESS ADDS NOBODY ────────────────────────────────────
    print("\n2 · pressing Add with no address adds nobody")
    before = picker_state(pg)["people"]
    pg.fill("#pickNewId", "4471")
    pg.wait_for_timeout(200)
    press_add(pg)
    s = picker_state(pg)
    ck("the register is unchanged", s["people"] == before, {"before": before, "after": s["people"]})
    ck("the popover is still open", s["open"])

    # ── 3 · AND IT SAYS WHY, IN THE FORM'S OWN WORDS ─────────────────
    print("\n3 · and it says why, where the box is")
    ck("the Email box is ringed", s["ringed"])
    ck("...in the alarm colour, not the attention one",
       s["outline"] not in (None, "", "rgba(0, 0, 0, 0)"), s["outline"])
    ck("the reason is written under it", s["saidHidden"] is False)
    ck("...and it is PERSON_NEEDED's sentence, not a second copy of it",
       bool(s["needSay"]) and s["said"] == s["needSay"], {"said": s["said"], "rule": s["needSay"]})
    ck("the cursor is put in the box that is wanted", s["focused"])

    # ── 4 · WHAT WAS TYPED IS STILL THERE ────────────────────────────
    # The refusal draws onto the open popover rather than repainting: a repaint
    # closes the picker, and a form that empties itself to tell somebody off is
    # worse than the row it was refusing to make.
    print("\n4 · nothing typed is thrown away")
    ck("the name is still in the search box", s["typedName"] == "Sara Nabil Fahmy", s["typedName"])
    ck("the employee number is still in its box", s["typedId"] == "4471", s["typedId"])

    # ── 5 · WITH AN ADDRESS IT GOES IN, AND TAKES THE ROLE ───────────
    # The presence that makes section 2 mean anything: an "+ Add" wired to
    # nothing would pass every count above and fail here.
    print("\n5 · with an address, the same press adds them and grants the role")
    if ensure_picker(pg, "Sara Nabil Fahmy"):
        print("  (the picker had closed — reopened, see section 2)")
    pg.fill("#pickNewEmail", "sara.nabil@example.com")
    pg.wait_for_timeout(250)
    cleared = picker_state(pg)
    ck("typing clears the ring", not cleared["ringed"])
    ck("...and takes the sentence down with it", cleared["saidHidden"] is True, cleared["said"])
    press_add(pg)
    pg.wait_for_timeout(600)
    made = pg.evaluate("""()=>{
      const p = PEOPLE.filter(function(x){return x.email==='sara.nabil@example.com';})[0];
      return { n: PEOPLE.length, found: !!p, empId: p ? p.empId : null,
               roles: p ? personRoles(p).map(function(r){return r.role;}) : [] };}""")
    ck("exactly one person was added", made["n"] == before + 1, made["n"])
    ck("...the one that was typed, with the number as well", made["found"] and made["empId"] == "4471", made)
    ck("...and they hold the role the picker was opened for",
       "owner" in made["roles"], made["roles"])

    # ── 6 · SOMEBODY ALREADY ON THE REGISTER IS UNCHANGED ────────────
    # The cost the mockup was signed off on, stated from the other side: the
    # rule is about CREATING a person, never about choosing one. A row that
    # arrived from a file with no address is still a row, and still assignable
    # — §506 drew the same line at the register's own form.
    print("\n6 · picking somebody already there is untouched, address or not")
    pg.evaluate("""()=>{ const b=document.querySelector('[data-rowdlg-cancel]')
        || document.querySelector('[data-rowdlg-close]'); if(b) b.click(); }""")
    pg.wait_for_timeout(400)
    pg.evaluate("""()=>{ window.__noaddr = addPerson({ name:"Hani Noaddress Fouad" });
        const p = personBy(window.__noaddr); if (p) { delete p.email; delete p.empId; }
        paint(); }""")
    pg.wait_for_timeout(600)
    open_unit_picker(pg)
    type_name(pg, "Hani Noaddress")
    picked = pg.evaluate("""()=>{
      const r=[...document.querySelectorAll('.pickrow:not([hidden])')]
        .find(x=>/Hani Noaddress/.test(x.textContent));
      if(!r) return {clicked:false};
      r.click(); return {clicked:true};}""")
    pg.wait_for_timeout(600)
    held = pg.evaluate("""()=>{ const p=personBy(window.__noaddr);
      return p ? personRoles(p).map(function(r){return r.role;}) : null; }""")
    ck("they are offered in the list", picked["clicked"])
    ck("...and take the role with no address on their row", held and "owner" in held, held)

    # ── 7 · A DIFFERENT NAME IS A DIFFERENT PERSON ───────────────────
    # The refusal belongs to the person being added, so retyping the name takes
    # it down — the same reason the duplicate refusal (§87.3) clears there.
    print("\n7 · retyping the name clears a refusal about the last one")
    pg.evaluate("""()=>{ const b=document.querySelector('[data-rowdlg-cancel]')
        || document.querySelector('[data-rowdlg-close]'); if(b) b.click(); }""")
    pg.wait_for_timeout(400)
    open_unit_picker(pg)
    type_name(pg, "Mona Adel Kamel")
    press_add(pg)
    ck("refused once", picker_state(pg)["ringed"])
    ensure_picker(pg, "Mona Adel Kamel")
    type_name(pg, "Mona Adel Kamel Hassan")
    after = picker_state(pg)
    ck("...and the ring goes with the name", not after["ringed"])
    ck("...and so does the sentence", after["saidHidden"] is True, after["said"])

    ck("nothing threw on the way", not errs, errs[:3])
    b.close()

print("\n" + ("FAILED: " + ", ".join(fails) if fails else "all role-picker-email checks passed"))
raise SystemExit(1 if fails else 0)
