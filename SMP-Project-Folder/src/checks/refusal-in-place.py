"""NINE REFUSALS, SAID WHERE THEY HAPPENED (§534.2).

Nine of the product's browser boxes were not questions at all: each fired
AFTER the platform had already refused and changed nothing, so nothing was
waiting on an answer and the box was only how somebody was told — told away
from the control that refused. The mockup (design-mockups/refusal-in-place/)
was signed off 2026-10-14. Four shapes cover all nine, and three of the four
already existed in the product:

  A  a line under the box that refused   — the cycle's name, the month it
                                           covers to, a BU name already taken
  B  the panel's own refusal              — the function's two, the person's
  C  a line under the row                 — a season still in use
  D  nothing at all                       — Submit, and a live Apply the
                                           office alone may press

What is asserted, and why each end matters (§94.2):

  - NO BROWSER DIALOG anywhere in the nine, caught by its own text — a check
    that only looked for the new line would pass on a build raising both;
  - the refusal is on screen WITH the control it is about, which is the whole
    point: a box covers the form it is complaining about;
  - the empty field is MARKED, so the line does not leave somebody hunting a
    box in a row of four;
  - the BU refusal KEEPS WHAT WAS TYPED — the repaint used to put the old name
    back, so the correction had to be typed twice;
  - the season's refusal makes the units it names REACHABLE (§16.7: a count
    that cannot take you to what it counts makes work);
  - the panels STAY OPEN and say what was not done, rather than closing and
    sending somebody to "open the menu again to see what";
  - and Submit's refusal is simply gone while its GATE still holds — the
    button is still refused, the bar and the bubble still explain, and the
    third telling is what was deleted.

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

def errline(pg, where):
    """The refusal as the page has it: its words, and whether the control it
       is about is marked and on screen beside it."""
    return ev(pg, """(sel) => {
      const root = document.querySelector(sel) || document;
      const e = root.querySelector('.picerr');
      const bad = root.querySelector('.bad, [aria-invalid="true"]');
      return { line: e ? e.innerText.trim() : "", marked: !!bad,
               both: !!(e && bad) };
    }""", where, {"line": ""})

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

    print("\n§A1 · opening a cycle with no name")
    ev(pg, """() => { current='setup'; currentSub='cycle';
      NEWCYCLE = { name:"", from:"Jan 2027", to:"", due:"10 Jul 2027" }; paint(); }""")
    pg.wait_for_timeout(250)
    ok = ev(pg, "() => { const b = document.querySelector('[data-nc-go]'); if (!b) return false; b.click(); return true; }", None, False)
    pg.wait_for_timeout(250)
    e = errline(pg, ".newcycle")
    ck("the panel is on screen with its Open", ok)
    ck("no browser dialog is raised", not natives, natives)
    ck("the refusal is a line in the panel", "needs a name" in e.get("line", ""), e)
    ck("...and the empty box is marked", e.get("marked"), e)
    ck("...both at once, which a box over the form cannot do", e.get("both"), e)
    ck("the panel is still open", ev(pg, "() => !!document.querySelector('.newcycle')", None, False))
    ck("...and nothing was opened", ev(pg, "() => !!NEWCYCLE", None, False))
    ck("the cursor is in the box it means",
       ev(pg, "() => document.activeElement && document.activeElement.id === 'nc-name'", None, False))

    print("\n§A2 · filling the name clears it, and the month is refused next")
    ev(pg, "() => { NEWCYCLE.name = 'H1 2027'; paint(); }"); pg.wait_for_timeout(200)
    ck("the line clears itself when the box is filled (derived, not stored)",
       "needs a name" not in errline(pg, ".newcycle").get("line", ""), errline(pg, ".newcycle"))
    pg.eval_on_selector("[data-nc-go]", "e => e.click()"); pg.wait_for_timeout(250)
    e = errline(pg, ".newcycle")
    ck("no browser dialog is raised", not natives, natives)
    ck("the month's refusal is a line too", "month this cycle covers to" in e.get("line", ""), e)
    ck("...and that control is marked as well", e.get("marked"), e)
    ck("...which the old build did not even focus",
       ev(pg, "() => !!(document.activeElement && document.activeElement.classList.contains('tobtn'))", None, False))

    print("\n§A3 · a BU name already taken keeps what was typed")
    natives.clear()
    made = ev(pg, """() => { current='setup'; currentSub='mainbu';
      GROUP.mainbus = [{ name:"Payments" }, { name:"Retail" }];
      ROWEDIT = "mainbu:1"; paint();
      return (GROUP.mainbus || []).map(b => b.name); }""")
    pg.wait_for_timeout(250)
    typed = ev(pg, """() => { const i = document.querySelector('input[data-mbname]');
      if (!i) return false; i.value = "Payments";
      i.dispatchEvent(new Event('change', { bubbles: true })); return true; }""", None, False)
    pg.wait_for_timeout(250)
    e = errline(pg, ".cfg")
    ck("(fixture) two BUs, the second open for editing", made == ["Payments", "Retail"], made)
    ck("the rename was attempted", typed)
    ck("no browser dialog is raised", not natives, natives)
    ck("the refusal is a line under the box", "already a BU called" in e.get("line", ""), e)
    ck("...the box is marked", e.get("marked"), e)
    ck("...AND IT KEEPS WHAT WAS TYPED, to be corrected rather than retyped",
       ev(pg, "() => { const i = document.querySelector('input[data-mbname]'); return i ? i.value : null; }") == "Payments")
    ck("...and the two were not merged",
       ev(pg, "() => (GROUP.mainbus || []).map(b => b.name)") == ["Payments", "Retail"])

    print("\n§C · a season still in use, with the units reachable")
    natives.clear()
    fx = ev(pg, """() => {
      const u = UNIT_KEYS[0];
      GROUP[SMPRules.SEASONS] = [{ id:"se1", name:"Summer", start:"1 Jun", end:"31 Aug" }];
      const ch = { subs: [{ name:"Walk-in", periods: [{ type:"season", seasonId:"se1" }] }] };
      UNITS[u].drivers = ch; UNITS[u].driverChannel = ch;
      if (typeof setDriversOn === 'function') setDriversOn(true);
      current='setup'; currentSub='seasons'; paint();
      return { used: SMPRules.seasonUsedBy(UNIT_KEYS.map(k => UNITS[k]), "se1").map(x => x.name) };
    }""")
    pg.wait_for_timeout(250)
    hit = ev(pg, "() => { const b = document.querySelector('[data-seasrm]'); if (!b) return false; b.click(); return true; }", None, False)
    pg.wait_for_timeout(250)
    if fx.get("used"):
        e = errline(pg, ".cfg")
        ck("(fixture) one unit has the season as a period of its own", len(fx.get("used", [])) == 1, fx)
        ck("the × was pressed", hit)
        ck("no browser dialog is raised", not natives, natives)
        ck("the refusal is a line under the row", "still in use" in e.get("line", ""), e)
        ck("...naming the unit", fx["used"][0] in e.get("line", ""), e)
        ck("...and the name is a control that goes there (§16.7)",
           ev(pg, "() => !!document.querySelector('[data-goseas]')", None, False))
        ck("...the season was not removed",
           ev(pg, "() => (SMPRules.seasonsOf(GROUP) || []).length") == 1)
        pg.eval_on_selector("[data-goseas]", "e => e.click()"); pg.wait_for_timeout(300)
        where = ev(pg, "() => ({ cur: current, sub: currentSub, sec: CURSEC && CURSEC.strategy })")
        ck("...pressing it lands on that unit's Drivers",
           where.get("sub") == "strategy" and where.get("sec") == "drivers", where)
    else:
        ck("(fixture) a unit using the season could be made", False, fx)

    print("\n§B · the panel keeps the refusal, rather than a box closing it")
    natives.clear()
    fx = ev(pg, """() => {
      const k = "lateguy";
      if (!personBy(k)) PEOPLE.push({ key:k, name:"Late Guy", unit:UNIT_KEYS[0], active:true });
      const p = personBy(k); p.active = true; delete p.heldRoles;
      current='setup'; currentSub='people'; PDEL = k; paint();
      return { blockers: personDeleteBlockers(k).length };
    }""")
    pg.wait_for_timeout(250)
    ck("(fixture) a person nothing points at, with the question open",
       fx.get("blockers") == 0, fx)
    ck("the question offers a Yes", ev(pg, "() => !!document.querySelector('[data-pdel-yes]')", None, False))
    # Something comes to point at them WHILE the question stands — the race the
    # browser box existed for, and the only way to reach that branch.
    ev(pg, """() => { grantPersonRole("lateguy", "owner", UNIT_KEYS[0]); }""")
    pg.eval_on_selector("[data-pdel-yes]", "e => e.click()"); pg.wait_for_timeout(250)
    panel = ev(pg, """() => { const el = document.querySelector('.kconfirm .cq');
      return { open: !!el, text: el ? el.innerText : "" }; }""", None, {"open": False})
    ck("no browser dialog is raised", not natives, natives)
    ck("the panel is still open", panel.get("open"), panel)
    ck("...saying it was NOT deleted, which is the news", "was not deleted" in panel.get("text", ""), panel.get("text", "")[:200])
    ck("...and naming what came to point at them, rather than sending somebody looking",
       "role" in panel.get("text", "").lower() or "owner" in panel.get("text", "").lower(),
       panel.get("text", "")[:240])
    ck("...the person is still there", ev(pg, "() => !!personBy('lateguy')", None, False))

    print("\n§D · Submit's refusal is gone, and its gate is not")
    natives.clear()
    fx = ev(pg, """() => {
      /* The unit is CHOSEN for being held, never assumed: the demo's first
         unit owes nothing, so a fixture that took UNIT_KEYS[0] measured a
         gate that was already open and proved nothing. */
      const t = UNIT_KEYS.filter(k => submitRefusal(k))[0];
      if (!t) return { why: "" };
      REVIEW.submitted = REVIEW.submitted || {}; delete REVIEW.submitted[t];
      REPORTING = t; current = t; currentSub = 'report'; paint();
      return { t: t, why: submitRefusal(t), submitted: !!REVIEW.submitted[t] };
    }""")
    pg.wait_for_timeout(300)
    if fx.get("why"):
        pressed = ev(pg, "() => { const b = document.querySelector('[data-submit]'); if (!b) return false; b.click(); return true; }", None, False)
        pg.wait_for_timeout(250)
        # THE TARGET, NOT THE TALLY. Counting every submitted unit in the
        # review measured the six the demo ships with and would have failed on
        # a build that submitted nothing — the question is whether THIS one went.
        after = ev(pg, """(t) => ({ mine: !!(REVIEW.submitted || {})[t],
          tip: (document.querySelector('[data-submit]') || {}).getAttribute
               ? document.querySelector('[data-submit]').getAttribute('data-tip') : null })""",
          fx.get("t"))
        ck("(fixture) the report is held by something", bool(fx.get("why")), fx)
        ck("the held Submit was pressed", pressed)
        ck("no browser dialog is raised", not natives, natives)
        ck("...and nothing was submitted — the GATE is untouched",
           after.get("mine") is False, after)
        ck("...while the button still carries the reason it is shut (§221)",
           bool(after.get("tip")), after)
    else:
        ck("(fixture) a report held by something could be found", False, fx)

    print("\n§E · and the build is quiet")
    ck("no page errors", not errs, errs[:3])
    b.close()

print("\n%d failure(s)" % bad)
raise SystemExit(1 if bad else 0)
