"""THE REPORTING CONTROLS RIDE THE TAB ROW (§150).

Islam's own placement, chosen over the audit's pinned bar: *"if we take the
floating bar to be in a box beside the performance icon would that look
better?"* On a 41-figure report the tally, Submit and Save draft used to leave
the screen on the first scroll.

WHAT THIS ASSERTS — the problem, not the pixels (§94.8):
  1. The box is IN the tab row, and the row is what holds it on screen: after
     scrolling to the bottom of a long report, the box is still inside the
     window and Submit still receives its own click point (§93.4 — "in the
     document" passed every day §110 was broken).
  2. The old in-page bar is GONE — both ends, or a build drawing both would
     pass a presence-only check (§94.2).
  3. Its controls still work from outside #panel: Save draft is pressed and
     says something, Cancel leaves reporting mode.
  4. Islam's colours, asserted as RELATIONSHIPS rather than hexes (§53.5):
     Submit is a filled button in the Report orange, Save draft is the same
     hue as TYPE with no fill, no border and a lighter weight than Submit.
  5. BOTH SIDES of the navigation switch (§53.5): a unit's report and a
     supporting function's, since one builder now serves both.
  6. It is not drawn when nobody is reporting — the box belongs to the mode.

Run: SMP_CHROME=... python3 qa-run.py checks/report-chrome.py
"""
import pathlib
from playwright.sync_api import sync_playwright

url = "file://" + str(pathlib.Path("strategy-management-platform.html").resolve())
bad = 0


def ck(w, ok, x=""):
    global bad
    if not ok:
        bad += 1
    print(("  ok      " if ok else "  FAIL    ") + w + (("  — " + str(x)) if not ok and x else ""))


def open_report(pg):
    for bt in pg.query_selector_all("#subtabs button"):
        if (bt.text_content() or "").strip().lower().startswith("performance"):
            bt.click(); pg.wait_for_timeout(400); break
    rep = pg.query_selector('[data-s=report]')
    if not rep:
        return False
    rep.click(); pg.wait_for_timeout(500)
    # §221: SUBMIT IS DIMMED UNTIL THE REPORT IS COMPLETE, so the colours
    # below — which are about how the two controls read AGAINST EACH OTHER —
    # have to be measured on a report that is ready. Every note the plan is
    # waiting on is answered first; that is state this check MAKES rather
    # than one the demo happens to be in (§94.2).
    pg.evaluate("""() => {
      const u = UNITS[current]; if (!u) return;
      const fix = (r) => { if (r.actual == null || r.actual === "") r.actual = r.target || 1;
                           r.note = r.note || "explained"; };
      (u.keyObjectives || []).forEach(fix);
      (u.items || []).forEach(p => { (p.measures || []).forEach(fix);
                                     (p.tactics || []).forEach(fix); });
      paint();
    }""")
    pg.wait_for_timeout(400)
    return True


def box_state(pg):
    return pg.evaluate("""() => {
      var box = document.querySelector('.repchrome');
      if (!box) return {there: false};
      var r = box.getBoundingClientRect();
      var sub = box.closest('#subtabs');
      var sb = document.querySelector('.rc-submit');
      var dr = document.querySelector('.rc-draft');
      function hit(el){
        if (!el) return 'absent';
        var b = el.getBoundingClientRect();
        var h = document.elementFromPoint(b.left + b.width/2, b.top + b.height/2);
        return (el === h || el.contains(h)) ? 'ok' : 'intercepted';
      }
      function st(el){
        if (!el) return null;
        var c = getComputedStyle(el);
        return {colour: c.color, bg: c.backgroundColor, weight: c.fontWeight,
                border: c.borderTopWidth};
      }
      return {there: true, inTabRow: !!sub,
              onScreen: r.top >= 0 && r.bottom <= innerHeight && r.width > 0,
              submitHit: hit(sb), submit: st(sb), draft: st(dr),
              /* §221 gave Submit a HELD state that is deliberately not filled,
                 so the fill can only be asked about once it is known whether
                 the gate is open (§280.1). */
              submitHeld: !!(sb && sb.getAttribute('aria-disabled') === 'true'),
              /* The reason rides `data-tip` — the platform's own bubble, which
                 opens on hover AND focus (§163) — never a native `title`, so
                 asking for one would be an assertion that cannot pass. */
              submitWhy: sb ? (sb.getAttribute('data-tip') || '').trim() : '',
              oldBar: !!document.querySelector('.rep-bar')};
    }""")


def rgb(s):
    try:
        return tuple(int(x) for x in s[s.index("(") + 1:s.index(")")].split(",")[:3])
    except Exception:
        return None


with sync_playwright() as p:
    b = p.chromium.launch()
    pg = b.new_page(viewport={"width": 1440, "height": 900})
    errs = []
    pg.on("pageerror", lambda e: errs.append(str(e)))
    pg.goto(url)
    pg.wait_for_timeout(800)
    who = pg.eval_on_selector_all("#asWho option", "els=>els.map(e=>e.value)")
    pg.select_option("#asWho", who[0])
    pg.wait_for_timeout(300)

    print("— a unit's report —")
    pg.query_selector('#units [data-u="mobile"]').click()
    pg.wait_for_timeout(400)
    ck("reporting mode opens", open_report(pg))
    s = box_state(pg)
    ck("the box is drawn", s.get("there"), s)
    ck("it is in the tab row", s.get("inTabRow"), s)
    ck("the old in-page bar is gone", not s.get("oldBar"), s)
    ck("Submit receives its own click point", s.get("submitHit") == "ok", s.get("submitHit"))

    # Islam's colours, as relationships.
    sub, dr = s.get("submit") or {}, s.get("draft") or {}

    # ── SUBMIT IS FILLED WHEN IT CAN BE PRESSED (§222) AND QUIET WHILE IT IS
    #    HELD (§221) — REWRITTEN, NOT DELETED (§280.1, §218) ─────────────────
    # This asked for the fill unconditionally. It was written under §222, when
    # Submit was always solid; §221 then gave it a held state that is
    # deliberately NOT filled, and nobody came back here (§51.11). It has been
    # red on main ever since, and it could never go green again: every one of
    # the ten demo units is blocked by something, so the state it was asserting
    # is unreachable on the shipped data.
    #
    # Both ends, or a build that lost the fill entirely still passes the half
    # it can reach (§94.2, §113.8). The state is MADE, because the demo has no
    # complete report to borrow.
    held = s.get("submitHeld")
    ck("Submit is HELD while the report is incomplete (§221)", held is True, s)
    ck("...and it says why, on the platform's own bubble",
       len(s.get("submitWhy") or "") > 0, s.get("submitWhy"))
    ck("...and a held Submit is deliberately NOT filled",
       "rgba(0, 0, 0, 0)" in sub.get("bg", ""), sub)

    open_gate = pg.evaluate("""() => {
      window.__realBlockers = window.submitBlockers;
      window.submitBlockers = () => ({notes: [], pending: [], owed: 0, gaps: 0});
      paint();
      var sb = document.querySelector('.rc-submit');
      var c = sb ? getComputedStyle(sb) : null;
      var out = sb ? {held: sb.getAttribute('aria-disabled') === 'true',
                      bg: c.backgroundColor, colour: c.color} : null;
      window.submitBlockers = window.__realBlockers;
      delete window.__realBlockers;
      paint();
      return out;
    }""")
    pg.wait_for_timeout(300)
    og = open_gate or {}
    ck("with the gate open Submit is no longer held", og.get("held") is False, og)
    ck("...and THEN it is filled (§222)",
       rgb(og.get("bg", "")) not in (None, (0, 0, 0)) and
       "rgba(0, 0, 0, 0)" not in og.get("bg", ""), og)
    ck("...and the fill carries light ink, never the page's own (§38.4)",
       (rgb(og.get("colour", "")) or (0, 0, 0))[0] > 200, og)
    s = box_state(pg)                       # the gate is shut again; re-read
    sub, dr = s.get("submit") or {}, s.get("draft") or {}
    ck("Save draft has no fill", "rgba(0, 0, 0, 0)" in dr.get("bg", ""), dr)
    ck("Save draft has no border", dr.get("border") in ("0px", "0"), dr)
    # Compared against the fill Submit ACTUALLY wears when it is filled, not
    # against the held button's transparency — `rgb("rgba(0,0,0,0)")` parses to
    # (0,0,0) rather than None, so the old comparison was passing over a value
    # that means "no colour at all" (§94.5).
    ck("Save draft's ink is the same hue family as Submit's fill",
       rgb(dr.get("colour", "")) is not None and rgb(og.get("bg", "")) is not None and
       rgb(dr.get("colour", ""))[0] > rgb(dr.get("colour", ""))[2] and
       rgb(og.get("bg", ""))[0] > rgb(og.get("bg", ""))[2], (og, dr))
    ck("Save draft is lighter than Submit",
       int(dr.get("weight", 400)) < int(sub.get("weight", 700)), (sub.get("weight"), dr.get("weight")))

    # It stays on screen at the bottom of a long report — the whole point.
    pg.evaluate("window.scrollTo(0, document.body.scrollHeight)")
    pg.wait_for_timeout(400)
    s2 = box_state(pg)
    ck("after scrolling to the end the box is still on screen", s2.get("onScreen"), s2)
    ck("...and Submit is still pressable there", s2.get("submitHit") == "ok", s2.get("submitHit"))

    # The controls work from outside #panel.
    pg.evaluate("window.scrollTo(0,0)")
    pg.wait_for_timeout(200)
    d = pg.query_selector(".rc-draft")
    if d:
        d.click()
        pg.wait_for_timeout(500)
        said = pg.evaluate("(document.querySelector('[data-savesay]')||{}).textContent || ''")
        ck("Save draft answers in words", bool(said.strip()), repr(said))
    else:
        ck("Save draft is present to press", False)
    c = pg.query_selector("[data-repcancel]")
    if c:
        c.click()
        pg.wait_for_timeout(500)
        ck("Cancel leaves reporting mode and the box goes with it",
           not pg.query_selector(".repchrome"))
    else:
        ck("Cancel is present to press", False)

    print("— a supporting function's report (§53.5) —")
    sw = pg.query_selector("#units .navswitch")
    if sw:
        sw.click(); pg.wait_for_timeout(400)
    fns = [e for e in pg.query_selector_all("#units button[data-u]") if e.is_visible()]
    ck("a function is reachable", bool(fns))
    if fns:
        fns[0].click(); pg.wait_for_timeout(450)
        if open_report(pg):
            s3 = box_state(pg)
            ck("the function's report draws the same box", s3.get("there"), s3)
            ck("...in the tab row too", s3.get("inTabRow"), s3)
            ck("...and no old bar beside it", not s3.get("oldBar"), s3)
        else:
            print("  note    this function has no Report control — nothing to compare")

    ck("no page errors while driving", not errs, errs[:2])
    b.close()

print("report-chrome: %s" % ("OK" if bad == 0 else "%d FAILURES" % bad))
raise SystemExit(1 if bad else 0)
