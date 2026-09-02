"""A PROJECT OWNER REPORTS, AND THE BAR STOPS SAYING VIEW ONLY (S250).

Islam, from the running platform: "a project owner is not able to report,
despite being the project owner and in the roles and access I allowed this."

He could. Measured on the shipped build: twelve live, ENABLED controls on his
own project, a press writing the row, the server accepting the save -- and the
bar above all of it reading **View only**, with no Submit and no Save draft, so
nothing on the screen acknowledged that anything had been entered.

`repChrome`'s pill is drawn from canSpeakFor(), which asks whether this person
may SUBMIT. Rightly false for a bounded role, and the wrong two words to
describe everything they can do.

WHAT THIS ASSERTS, both ends each time (S94.2, S42):

  * the bar no longer says View only to somebody who reports here, and says
    what is true instead -- their own container, named by the code the rail
    shows, with the tally the rail shows;
  * the finished mark is a CONTROL on the project's own band, and PRESSING it
    changes REVIEW.done and nothing else (S96 -- a drawn control proves
    nothing);
  * it is the container's OWNER's: the project beside theirs offers no mark;
  * a plain reader still reads View only, and the custodian still gets Submit
    -- a build that simply deleted the pill would pass every assertion above;
  * both sides of the switch: a unit's pillar owner meets the same bar and the
    same control (S53.5), and the two are asserted to AGREE rather than to
    match a literal (S94.8);
  * the shared rule answers the same way the screen renders.

THE STATE IS MADE, not found: no demo person is named as a project's Owner
while attached to nothing else, so waiting for one means shipping this
unexercised (S94.2).
"""
import os
from playwright.sync_api import sync_playwright

HERE = os.path.dirname(os.path.abspath(__file__))
FILE = os.path.join(HERE, "..", "strategy-management-platform.html")
URL = "file://" + os.path.abspath(FILE)
FN, FDEST = "it", "fn:it"
UNIT = "mobile"

bad = 0
def ck(what, ok, x=""):
    global bad
    if not ok: bad += 1
    print(("    ok   " if ok else "    FAIL ") + what + (("  — %s" % (x,)) if not ok and x != "" else ""))

def to_fn_reporting(pg):
    for _ in range(3):
        if not pg.query_selector("#units .navswitch"): break
        on = pg.eval_on_selector_all("#units .navswitch .nsw.on", "e=>e.map(x=>x.textContent.trim())")
        if on and on[0] == "Functions": break
        pg.click("#units .navswitch"); pg.wait_for_timeout(150)
    d = pg.query_selector('#units button[data-u="%s"]' % FDEST)
    if d: d.click(); pg.wait_for_timeout(300)
    open_report(pg)

def to_unit_reporting(pg):
    for _ in range(3):
        if not pg.query_selector("#units .navswitch"): break
        on = pg.eval_on_selector_all("#units .navswitch .nsw.on", "e=>e.map(x=>x.textContent.trim())")
        if on and on[0] == "Units": break
        pg.click("#units .navswitch"); pg.wait_for_timeout(150)
    d = pg.query_selector('#units button[data-u="%s"]' % UNIT)
    if d: d.click(); pg.wait_for_timeout(300)
    open_report(pg)

def open_report(pg):
    pg.evaluate("""()=>{const b=[...document.querySelectorAll('#subtabs button')]
        .find(x=>x.textContent.trim().indexOf('Performance')===0); if(b)b.click()}""")
    pg.wait_for_timeout(250)
    r = pg.query_selector('[data-s=report]')
    if r: r.click(); pg.wait_for_timeout(400)
    return bool(r)

# The bar, and what the bands offer. Read as data so an assertion can name what
# it saw rather than "not found".
BAR = """()=>{
  var box = document.querySelector('.repchrome');
  return {
    text: box ? box.innerText.replace(/\\n/g,' | ') : null,
    viewOnly: !!(box && box.querySelector('.pill.none') &&
                 /View only/.test(box.querySelector('.pill.none').textContent)),
    ownChip: box && box.querySelector('.rc-state')
               ? box.querySelector('.rc-state').textContent.trim() : null,
    submit: !!document.querySelector('[data-submit]'),
    marks: [...document.querySelectorAll('[data-rowdone]')].map(e=>e.dataset.rowdone),
    donePills: [...document.querySelectorAll('.pband .pill.good')].map(e=>e.textContent.trim())
  };
}"""

with sync_playwright() as pw:
    b = pw.chromium.launch(executable_path=os.environ.get("SMP_CHROME", "/opt/pw-browsers/chromium"),
                           args=["--no-sandbox", "--disable-dev-shm-usage"])
    pg = b.new_page(viewport={"width": 1500, "height": 1400})
    errs = []
    pg.on("pageerror", lambda e: errs.append(str(e)))
    pg.on("console", lambda m: errs.append(m.text) if m.type == "error" else None)
    pg.goto(URL); pg.wait_for_timeout(1300)
    pg.select_option("#asWho", "smo"); pg.wait_for_timeout(250)

    ids = pg.evaluate("""() => {
      ACCESS.powner = Object.assign({}, ACCESS.powner, { a_fn_own: "edit" });
      ACCESS.plowner = Object.assign({}, ACCESS.plowner, { a_unit_own: "edit" });
      /* A GENUINE READER, and the demo has none: this tenant's floor is
         `none` on a unit, so somebody holding nothing has no Reporting tab
         at all and never meets the pill. Opened to VIEW, which is a real
         tenant's configuration and the one state "View only" describes. */
      ACCESS.employee = Object.assign({}, ACCESS.employee, { a_unit_own: "view" });
      PEOPLE.push({ key:"t250p", name:"Project Owner 250", active:true });
      PEOPLE.push({ key:"t250l", name:"Pillar Owner 250",  active:true });
      PEOPLE.push({ key:"t250r", name:"Plain Reader 250",  active:true, unit:"%s" });
      var cap = capsOfFunction("%s")[0];
      cap.projects[0].owner = "Project Owner 250";
      var u = UNITS["%s"];
      u.items[0].owner = "Pillar Owner 250";
      paint();
      return { own: cap.projects[0].id, other: cap.projects[1].id,
               ownCode: projCode("%s", cap.projects[0]),
               otherCode: projCode("%s", cap.projects[1]),
               pillar: u.items[0].id, pillarCode: pillarCode(u, 0),
               cust: FUNCTIONS["%s"].custodian };
    }""" % (UNIT, FN, UNIT, FN, FN, FN))
    print("  fixture: project %(own)s (%(ownCode)s) · beside it %(other)s (%(otherCode)s) · "
          "pillar %(pillar)s (%(pillarCode)s) · custodian %(cust)s" % ids)

    # ── 1 · THE PROJECT OWNER ────────────────────────────────────────────
    print("-- the project owner, on a supporting function")
    pg.select_option("#asWho", "t250p"); pg.wait_for_timeout(400)
    to_fn_reporting(pg)
    st = pg.evaluate(BAR)
    ck("the bar no longer says View only", not st["viewOnly"], st["text"])
    ck("it names their own project and its tally instead",
       st["ownChip"] is not None and ids["ownCode"] in (st["ownChip"] or "") and
       "entered" in (st["ownChip"] or ""), st["ownChip"])
    ck("Submit is still not drawn for them", not st["submit"])
    mine = [m for m in st["marks"] if m.split("|")[0] == ids["own"]]
    theirs = [m for m in st["marks"] if m.split("|")[0] == ids["other"]]
    ck("their own project's band carries the mark", len(mine) == 1, st["marks"])
    ck("the project beside theirs carries none — it is the owner's",
       len(theirs) == 0, st["marks"])

    # PRESSING IT, and the DATA read back (§96).
    # §215: A CHECK THAT DIES REPORTS NOTHING. The first run of this file
    # against the pre-§250 build crashed on `mine[0]` and printed 3 failures
    # where there are 8 — a falsification that undercounts itself. Everything
    # below depends on a control that build does not draw, so each is reported
    # as failing rather than allowed to raise.
    def press(addr):
        pg.click('[data-rowdone="%s"]' % addr); pg.wait_for_timeout(350)

    if not mine:
        for w in ["pressing it WRITES the mark against this function",
                  "the mark records who and when",
                  "the bar now reads Done for that project",
                  "the band shows the Done pill and a way back",
                  "undoing DELETES the mark — the key goes, and the map with it"]:
            ck(w, False, "no mark control is drawn")
    else:
        before = pg.evaluate("()=>JSON.stringify(REVIEW.done||null)")
        press(mine[0])
        after = pg.evaluate("""(id)=>({ mark: JSON.parse(JSON.stringify(
            (REVIEW.done||{})[id] || null)),
            keys: Object.keys(REVIEW.done||{}) })""", ids["own"])
        ck("pressing it WRITES the mark, keyed by the project itself",
           bool(after["mark"]) and after["keys"] == [ids["own"]],
           "before=%s after=%s" % (before, after))
        ck("the mark records who and when",
           bool(after["mark"]) and after["mark"].get("by") == "t250p" and
           bool(after["mark"].get("at")), after["mark"])
        st2 = pg.evaluate(BAR)
        ck("the bar now reads Done for that project",
           "Done" in (st2["ownChip"] or ""), st2["ownChip"])
        ck("the band shows the Done pill and a way back",
           "Done" in st2["donePills"] and
           any(m.endswith("|0") for m in st2["marks"]), st2)

        # UNDO deletes the key rather than storing a false (§50.6)
        back = [m for m in st2["marks"] if m.split("|")[0] == ids["own"]]
        if back: press(back[0])
        ck("undoing DELETES the mark — the key goes, and the map with it",
           bool(back) and pg.evaluate("()=>REVIEW.done===undefined") is True,
           pg.evaluate("()=>JSON.stringify(REVIEW.done||null)"))

    # ── 2 · BOTH ENDS: the shared rule ───────────────────────────────────
    # Guarded for the same reason as the presses above: on a build without the
    # shared rule this evaluate THROWS, and a check that throws reports nothing.
    both = pg.evaluate("""(o)=>({
      has: typeof SMPRules.mayMarkDone === 'function'})""", ids)
    if not both.get("has"):
        ck("both ends: the rule says theirs yes, the other no", False,
           "SMPRules.mayMarkDone does not exist")
        ck("both ends: the platform reads them as a bounded reporter", False,
           "SMPRules.mayMarkDone does not exist")
    else:
      both = pg.evaluate("""(o)=>({
        mineRule: SMPRules.mayMarkDone(world(), viewer(), 'fn', '%s',
                    capsOfFunction('%s')[0].projects.find(p=>p.id===o.own).owner),
        otherRule: SMPRules.mayMarkDone(world(), viewer(), 'fn', '%s',
                    capsOfFunction('%s')[0].projects.find(p=>p.id===o.other).owner),
        bounded: boundedHere('%s'), reports: boundedReporter('%s')
      })""" % (FDEST, FN, FDEST, FN, FDEST, FDEST), ids)
      ck("both ends: the rule says theirs yes, the other no",
         both["mineRule"] is True and both["otherRule"] is False, both)
      ck("both ends: the platform reads them as a bounded reporter",
         both["bounded"] is True and both["reports"] is True, both)

    # ── 3 · THE CUSTODIAN, unchanged ─────────────────────────────────────
    print("-- the custodian, unchanged")
    pg.select_option("#asWho", ids["cust"]); pg.wait_for_timeout(400)
    to_fn_reporting(pg)
    st = pg.evaluate(BAR)
    ck("Submit is still drawn for them", st["submit"], st["text"])
    ck("no View only pill, and no own-project chip either",
       not st["viewOnly"] and st["ownChip"] is None, st["text"])

    # ── 4 · A PLAIN READER still reads View only ─────────────────────────
    print("-- a plain reader")
    pg.select_option("#asWho", "t250r"); pg.wait_for_timeout(400)
    to_unit_reporting(pg)
    st = pg.evaluate(BAR)
    ck("View only is still what a reader is told",
       st["viewOnly"] is True, st["text"])
    ck("and they are offered no mark", st["marks"] == [], st["marks"])

    # ── 5 · THE UNIT SIDE: a pillar owner (§53.5) ────────────────────────
    print("-- the pillar owner, on a business unit")
    pg.select_option("#asWho", "t250l"); pg.wait_for_timeout(400)
    to_unit_reporting(pg)
    st = pg.evaluate(BAR)
    ck("the bar does not say View only here either", not st["viewOnly"], st["text"])
    ck("it names their own pillar and its tally",
       st["ownChip"] is not None and ids["pillarCode"] in (st["ownChip"] or "") and
       "entered" in (st["ownChip"] or ""), st["ownChip"])
    umine = [m for m in st["marks"] if m.split("|")[0] == ids["pillar"]]
    ck("their pillar's band carries the mark", len(umine) == 1, st["marks"])
    ck("and no other pillar's does",
       len(st["marks"]) == len(umine), st["marks"])
    if umine: press(umine[0])
    ck("pressing it writes the pillar's own key",
       bool(umine) and pg.evaluate("()=>Object.keys(REVIEW.done||{})") == [ids["pillar"]],
       pg.evaluate("()=>JSON.stringify(REVIEW.done||null)"))

    ck("no console errors", not errs, "; ".join(errs[:3]))
    b.close()

print("\n" + ("all passed" if not bad else "%d FAILED" % bad))
raise SystemExit(1 if bad else 0)
