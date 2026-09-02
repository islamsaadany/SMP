"""SUBMIT IS SHUT UNTIL THE REPORT IS COMPLETE, AND A CLOSED REPORT IS CLOSED
(§220, §221).

Islam, from the deployment: *"we need to remove the ability of people to
submit a report that is not complete … the submit to SMO should be dimmed with
a hover noting that he can't submit until full reporting of all numbers … and
of course they shouldn't be able to submit if they still have something
missing in the plan itself"*, and *"the submit or the save as a draft locks the
report and in both cases you can find the button Reopen to unlock it."*

WHAT THIS ASSERTS, AND WHY EACH ONE IS HERE

· THE LOCK IS A LOCK, NOT A LOOK. Measured before the change: after pressing
  Submit all twelve figure boxes and the owner's note were still fully
  editable. So this counts controls that are actually `disabled`, never a
  class — `pointer-events:none` reads identically to a lock and the keyboard
  walks straight past it.

· BOTH ENDS OF EVERY STATE (§113.8). A build that drew no report at all would
  satisfy every "nothing is editable" assertion, so each locked state is
  asserted beside the open one it came from, and the row count is checked so
  the plan is known to be on screen.

· THE REASON IS REACHABLE WITHOUT A MOUSE. `aria-disabled`, not `disabled`,
  is what keeps the dimmed button focusable — so the button is asserted to
  take focus, which is the whole reason for that choice (§163).

· THE COUNT IGNORES THE VIEWER (§221). `gapMap()` is scoped to what the person
  looking could close (§177); the submission gate must not be, or a unit head
  submits past holes only the office can fill. Asserted as the DIFFERENCE
  between the two counts on a viewer who can close nothing.

· THE CHECK MAKES ITS OWN STATES (§94.2): the demo plan has no gaps and most
  units are fully reported, so a check that only opened the page would never
  see a blocked Submit for either reason.

PROVED ABLE TO FAIL (§94.5), AND THE FIRST ATTEMPT LIED. Run against the
shipped pre-§220 build the check THREW at section 3 — `gapTotalAll` does not
exist there — so sections 3 to 6 never ran and a count of the FAIL lines read
four, which looked like a measurement and was a crash (§215's own trap, in a
check rather than in a suite). Every probe that can meet a missing function
now answers -1 instead of throwing. With that corrected the previous build
fails 18 ways, among them the reported faults themselves: the bar reads
"Cancel", Submit carries no reason, and NOTHING in a submitted report is
disabled.
"""
import sys
from playwright.sync_api import sync_playwright

URL = "file:///home/user/SMP/SMP-Project-Folder/src/strategy-management-platform.html"
errs = []
bad = 0


def ck(w, ok, x=""):
    global bad
    if not ok:
        bad += 1
    print(("  ok      " if ok else "  FAIL    ") + w + (("  — " + str(x)) if not ok and x else ""))


def bar_state(pg):
    return pg.evaluate("""() => {
      const panel = document.getElementById('panel');
      const ctl = [...panel.querySelectorAll('input, textarea, select')];
      const sub = document.querySelector('.rc-submit');
      const bar = document.querySelector('.repchrome');
      return {
        fields:   ctl.length,
        editable: ctl.filter(e => !e.disabled).length,
        rows:     panel.querySelectorAll('table tr').length,
        locked:   panel.classList.contains('replocked'),
        words:    bar ? bar.textContent : "",
        state:    (document.querySelector('.rc-state') || {}).textContent || "",
        reopen:   !!document.querySelector('.rc-reopen'),
        submit:   !!sub,
        dim:      sub ? sub.getAttribute('aria-disabled') : null,
        tip:      sub ? (sub.getAttribute('data-tip') || "") : "",
        draft:    !!document.querySelector('[data-repsave]')
      };
    }""")


def open_report(pg, unit="mobile"):
    pg.evaluate("""(u) => {
      const smo = PEOPLE.filter(p => (p.role || '') === 'super')[0];
      VIEWER = smo.key; leaveModes(); current = u; paint();
    }""", unit)
    pg.wait_for_timeout(300)
    pg.click('[data-s="performance"]')
    pg.wait_for_timeout(400)
    pg.evaluate("() => { const b = document.querySelector('[data-s=report]'); if (b) b.click(); }")
    pg.wait_for_timeout(600)


with sync_playwright() as p:
    b = p.chromium.launch()
    pg = b.new_page(viewport={"width": 1500, "height": 900})
    pg.on("pageerror", lambda e: errs.append(str(e)))
    pg.on("console", lambda m: errs.append(m.text) if m.type == "error" else None)
    pg.add_init_script("try{sessionStorage.setItem('smp.welcome.done','1');"
                       "sessionStorage.setItem('smp.tour.later','1');}catch(e){}")
    pg.goto(URL)
    pg.wait_for_timeout(1800)

    # 1 - THE REPORT OPENS, AND CLOSE IS THE WORD
    print("\n1 · the report opens editable, and Cancel is now Close (§220)")
    open_report(pg)
    r = bar_state(pg)
    ck("the report is open and its boxes take typing",
       r["fields"] > 0 and r["editable"] == r["fields"], r)
    ck("...and the plan is on screen", r["rows"] > 3, r)
    ck("the way out says Close", "Close" in r["words"], r["words"])
    ck("...and never Cancel", "Cancel" not in r["words"], r["words"])
    ck("Save draft is offered", r["draft"] is True, r)

    # 2 - SUBMIT IS DIMMED, AND SAYS WHY BEFORE IT IS PRESSED
    print("\n2 · not ready: dimmed, with the reason on hover (§221)")
    r = bar_state(pg)
    ck("Submit is drawn", r["submit"] is True, r)
    ck("...and marked not-ready", r["dim"] == "true", r)
    ck("...carrying a reason", r["tip"].startswith("Cannot submit yet"), r["tip"])
    focusable = pg.evaluate("""() => {
      const s = document.querySelector('.rc-submit');
      s.focus(); return document.activeElement === s;
    }""")
    ck("...and the button still takes focus, so the reason is reachable",
       focusable is True)

    pg.evaluate("""() => {
      const u = UNITS[current];
      (u.items || []).forEach(p => (p.tactics || []).forEach(t => {
        if (t.actual == null || t.actual === "") t.actual = 1;
        t.note = t.note || "explained";
      }));
      (u.items || []).forEach(p => (p.measures || []).forEach(m => {
        if (m.actual == null || m.actual === "") m.actual = m.target;
        m.note = m.note || "explained";
      }));
      (u.keyObjectives || []).forEach(m => {
        if (m.actual == null || m.actual === "") m.actual = m.target;
        m.note = m.note || "explained";
      });
      /* §249 MADE A TACTIC'S OUTCOME AND ITS TARGET OWED, and the shipped
         plan carries neither on any row — so "owing nothing" stopped being
         true of this fixture the day that landed, and the assertion below
         read a deliberate decision as a regression. The fixture writes them
         the way it already writes every other missing figure: this section is
         about the SUBMIT GATE, and the gate's own subject is a plan with
         nothing left in it. That the two new fields DO shut the gate is
         asserted on its own below. */
      (u.items || []).forEach(p => (p.tactics || []).forEach(t => {
        if (!t.outcome)   t.outcome   = "Something measurable";
        if (!t.outTarget) t.outTarget = "6 #";
        /* §251.6: AND THE FIGURE THE PAGE ACTUALLY ASKS FOR. Giving a tactic
           an outcome moves the question — the box asks for `outActual`, and a
           per cent typed before that question existed is not an answer to it
           (Islam: *"a - is not an entry"*). This fixture filled `actual` and
           then handed every row an outcome, so it stopped answering what it
           was asking; the assertion below then read a deliberate decision as
           a regression, which is §51.11 with the CHECK holding the stale
           method rather than a stale selector. */
        if (t.outActual == null || t.outActual === "") t.outActual = 6;
      }));
      paint();
    }""")
    pg.wait_for_timeout(400)
    r = bar_state(pg)
    ck("a report owing nothing offers a live Submit", r["dim"] is None, r)

    # §249: AND THE TWO NEW FIELDS SHUT IT THE SAME WAY, asserted here rather
    # than trusted from the list — the gate reads gapMap, and a build that
    # counted them everywhere except the submission gate would be the one
    # exception the product does not have.
    for fld, word in (("outcome", "outcome"), ("outTarget", "target")):
        pg.evaluate("""(f) => { delete UNITS[current].items[0].tactics[0][f]; paint(); }""", fld)
        pg.wait_for_timeout(300)
        rr = bar_state(pg)
        ck("a tactic with no %s shuts Submit (§249)" % word, rr["dim"] == "true", rr["tip"])
        ck("...naming the plan", "missing in the plan" in rr["tip"], rr["tip"])
        pg.evaluate("""(f) => { UNITS[current].items[0].tactics[0][f] =
          f === "outcome" ? "Something measurable" : "6 #"; paint(); }""", fld)
        pg.wait_for_timeout(300)
    ck("...and putting them back opens it again", bar_state(pg)["dim"] is None,
       bar_state(pg))

    # 3 - A GAP IN THE PLAN SHUTS IT AGAIN, WHOEVER IS LOOKING
    print("\n3 · a plan gap shuts Submit, and the count ignores the viewer")
    made = pg.evaluate("""() => {
      const t = UNITS[current].items[0].tactics[0];
      t.q1 = t.q2 = t.q3 = t.q4 = false;
      paint();
      /* GONE IS A FAILURE, NOT A CRASH. On a build without the
         viewer-independent count this whole section used to throw, the run
         ended, and a `grep -c FAIL` over the output read four — a
         falsification that looked like a pass (§215). */
      return { all: typeof gapTotalAll === "function" ? gapTotalAll(current) : -1,
               mine: typeof gapTotal === "function" ? gapTotal(current) : -1 };
    }""")
    pg.wait_for_timeout(400)
    ck("the gap is counted at all", made["all"] >= 1, made)
    r = bar_state(pg)
    ck("Submit is shut again", r["dim"] == "true", r)
    ck("...and names the plan", "missing in the plan" in r["tip"], r["tip"])
    seen = pg.evaluate("""() => {
      const head = PEOPLE.filter(p => (p.role || '') !== 'super')[0];
      const was = VIEWER; VIEWER = head.key;
      const out = { mine: typeof gapTotal === "function" ? gapTotal(current) : -1,
                    all:  typeof gapTotalAll === "function" ? gapTotalAll(current) : -1 };
      VIEWER = was; return out;
    }""")
    ck("the viewer's own count can read zero", seen["mine"] == 0, seen)
    ck("...while the gate's count does not", seen["all"] >= 1, seen)

    # 4 - SAVE DRAFT CLOSES THE REPORT
    print("\n4 · Save draft parks it, and Reopen brings it back (§220)")
    before = bar_state(pg)
    # A SAVE THAT DID NOT HAPPEN MUST NOT CLOSE THE REPORT (§220). Opened from
    # a file there is no server, so Save draft answers "offline" and parks
    # NOTHING — asserted here rather than worked around, because parking on a
    # failed save is the worse half of the fault this ordering exists to
    # avoid: a tidy "Draft saved" over work that never left the browser.
    pg.evaluate("() => { const b = document.querySelector('[data-repsave]'); if (b) b.click(); }")
    pg.wait_for_timeout(700)
    off = bar_state(pg)
    ck("with no server, Save draft parks nothing", off["editable"] == before["editable"], off)
    ck("...and says so", "no server" in off["words"], off["words"])
    # THE LOCK ITSELF IS THEN DRIVEN THROUGH THE STATE, because the button
    # cannot reach it over file:// (§94.11) — what is under test here is the
    # closed report, not the save.
    pg.evaluate("""() => { REVIEW.parked = REVIEW.parked || {};
                           REVIEW.parked[current] = true; paint(); }""")
    pg.wait_for_timeout(500)
    r = bar_state(pg)
    ck("every control in the report is disabled", r["editable"] == 0, r)
    ck("...and there were controls to disable", before["editable"] > 0, before)
    ck("...the report is still readable", r["rows"] == before["rows"], (before, r))
    ck("the bar says Draft saved", "Draft saved" in r["state"], r)
    ck("...and offers Reopen", r["reopen"] is True, r)
    ck("...with no Submit left lying there", r["submit"] is False, r)
    pg.evaluate("() => { const b = document.querySelector('.rc-reopen'); if (b) b.click(); }")
    pg.wait_for_timeout(600)
    r = bar_state(pg)
    ck("Reopen gives the boxes back", r["editable"] == before["editable"], r)
    ck("...and Submit with them", r["submit"] is True, r)

    # 5 - SUBMITTING CLOSES IT THE SAME WAY
    print("\n5 · submitting closes it, and Reopen is the same control")
    pg.evaluate("""() => { REVIEW.submitted[current] = true; paint(); }""")
    pg.wait_for_timeout(600)
    r = bar_state(pg)
    ck("a submitted report is locked too", r["editable"] == 0, r)
    ck("...and says Submitted", "Submitted" in r["state"], r)
    ck("...through the same Reopen", r["reopen"] is True, r)
    pg.evaluate("() => { const b = document.querySelector('.rc-reopen'); if (b) b.click(); }")
    pg.wait_for_timeout(600)
    r = pg.evaluate("""() => ({ sub: !!(REVIEW.submitted || {})[current],
                                park: !!(REVIEW.parked || {})[current],
                                editable: [...document.querySelectorAll(
                                  '#panel input,#panel textarea,#panel select')]
                                  .filter(e => !e.disabled).length })""")
    ck("Reopen clears the submission in the DATA", r["sub"] is False, r)
    ck("...and any park with it", r["park"] is False, r)
    ck("...and the report is editable again", r["editable"] > 0, r)

    # 6 - SUBMITTING SUPERSEDES A PARK
    print("\n6 · two closed states can never stand at once")
    pg.evaluate("""() => {
      REVIEW.parked = REVIEW.parked || {}; REVIEW.parked[current] = true;
      REVIEW.submitted[current] = true; paint();
    }""")
    pg.wait_for_timeout(400)
    pg.evaluate("() => { const b = document.querySelector('.rc-reopen'); if (b) b.click(); }")
    pg.wait_for_timeout(500)
    r = pg.evaluate("""() => ({ sub: !!(REVIEW.submitted || {})[current],
                                park: !!(REVIEW.parked || {})[current],
                                map: !!REVIEW.parked })""")
    ck("one Reopen clears both states", r["sub"] is False and r["park"] is False, r)
    ck("...and the empty map is deleted, not left behind", r["map"] is False, r)

    print("\n  " + ("ok      no page errors anywhere in the run"
                    if not errs else "FAIL    console: " + errs[0]))
    if errs:
        bad += 1
    b.close()

print("\n" + ("ALL OK" if not bad else "%d FAILED" % bad))
sys.exit(1 if bad else 0)
