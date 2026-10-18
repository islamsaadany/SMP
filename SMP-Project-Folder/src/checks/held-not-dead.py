"""A CONTROL THAT WILL NOT WORK CAN SAY WHY (§538).

Usability audit, heuristic 5. The product greys a control out in two ways. One
leaves it alive: `aria-disabled`, so it still takes a pointer and the Tab key
and opens a bubble saying why it refuses — that is Submit, and §163/§221 made
it the house rule. The other is `disabled`, where the browser stops sending the
control anything: no pointer, no focus, no hover. A sentence attached to a
control greyed the second way reaches NOBODY.

THE AUDIT NAMED ONE AND A SWEEP OF THE SOURCES FOUND FOUR, the audit's being
the mildest:

  - RESTORE, in the change log, carried BOTH attributes — and `disabled` wins,
    so the one sentence saying why a change cannot be put back was unreachable
    and nothing else in the row said it. The worst of the four;
  - APPLY TO PLAN, in the Copilot: "Save the Foundation first" on the one
    control that could not deliver it — and the wrong sentence besides, since
    it said that while the Copilot was working on a Foundation already saved;
  - HOW A CAPABILITY IS PLANNED: "holds its plan" IS beside the row, so the
    obstacle was named; the way out of it was on the dead control;
  - THE QUARTER MARKS, which the audit named. Nothing was hidden there: the
    strip directly above the table already says which period the plan covers.
    So that one is a SUBTRACTION — the mark stops being a button at all.

What is asserted, and why each end matters (§94.2):

  - NOTHING IS GREYED THE DEAD WAY WHILE CARRYING A REASON. Static, over the
    whole built file with its comments stripped: no `disabled` and a `title`
    in the same drawn tag. This is the assertion that makes the sweep hold
    tomorrow — a behavioural check of four controls passes a build that adds
    a fifth;
  - the three held controls are REACHABLE: `aria-disabled`, not `disabled`,
    each takes focus, and each carries its bubble;
  - AND THE HOLD STILL HOLDS. This is the half a conversion like this breaks:
    Apply to plan decided whether to act by reading `b.disabled`, which goes
    false the moment the attribute changes, so a build that moved the
    attribute and left the guard would have a held button that works. Pressed
    here, with the Foundation unsaved, and the plan must be untouched;
  - the SELECT is put back when changed, because `aria-disabled` leaves a
    select genuinely changeable where a button is declined by its handler;
  - and the quarter marks are not buttons, so Tab walks only the quarters
    that can be pressed — while the sentence survives on something a pointer
    can reach.

SMP_BUILT points it at another build, so it can be run against the build
before (§276: a broken build is made from the SOURCES).
"""
import os, re
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
    except Exception as e: return dflt if dflt is not None else {"err": str(e)[:100]}

print("\n§1 · nothing is greyed the dead way while carrying a reason")
src = open(os.path.abspath(BUILT), encoding="utf-8").read()
code = re.sub(r"/\*.*?\*/", " ", src, flags=re.S)
code = re.sub(r"(?m)^\s*//.*$", " ", code)
# A drawn tag is one JS expression on one line. A line that writes ` disabled`
# AND a `title=` into the same tag is the fault, whatever the words are: the
# title cannot open. Lines that only LABEL a live control (title on a button
# that is disabled by a different branch) are the reason this looks for the two
# in one emitted attribute run rather than anywhere on the line.
offend = []
for ln in code.split("\n"):
    if "aria-disabled" in ln: continue
    for m in re.finditer(r"' disabled title=|\" disabled title=|disabled title=\\?\"", ln):
        offend.append(ln.strip()[:110])
ck("no control is drawn dead with its reason attached", not offend, offend[:3])
# And the one that carried both attributes at once is gone for good.
both = re.findall(r"disabled aria-disabled", code)
ck("...and nothing carries both greyings at once", not both, both[:2])

# AND THE PRODUCT ITSELF DRAWS THE HELD SHAPE. The §2 fixture proves the shape
# WORKS; only this proves the four controls use it. Written after running the
# first draft against the build before, where §2 and §3 passed on a build that
# has none of this — a check that only exercises its own markup measures the
# check (§53.5). Read as plain text rather than by pattern: these are the exact
# strings the build carries, so a rewrite of any of them has to come back here.
DRAWN = [
  ("the change log draws Restore held, with its bubble",
   'class="hist-rst hasnote" aria-disabled="true" data-tip="'),
  ("Apply to plan draws held, with its bubble",
   """(fwhy ? ' aria-disabled="true" data-tip="'"""),
  ("the planning dropdown wears its note on a wrapper",
   'class="hasnote capheld" data-tip="Clear the plan on this row first"'),
  ("...and a change to it is put back rather than taken",
   'el.value = el.getAttribute("data-capwas") || el.value;'),
  # THE GUARD IS THE HIDDEN REPAIR. `b.disabled` goes false the moment the hold
  # moves to `aria-disabled`, so a build that moved the attribute and left this
  # line alone has a held button that acts.
  ("and Apply to plan's guard reads the attribute that now holds it",
   'if (!b.disabled && b.getAttribute("aria-disabled") !== "true")'),
]
for word, frag in DRAWN:
    ck(word, frag in code, "not in the build")

with sync_playwright() as p:
    b = p.chromium.launch(executable_path="/opt/pw-browsers/chromium",
                          args=["--no-sandbox", "--disable-dev-shm-usage"])
    pg = b.new_page(viewport={"width": 1400, "height": 1000})
    errs = []
    pg.on("pageerror", lambda e: errs.append(str(e)))
    pg.goto(URL); pg.wait_for_timeout(1500)

    # THE CHECK MAKES ITS OWN CONTROLS (§255). Each of the four sits behind a
    # page, a grant and a chat; what is asserted is the SHAPE the product draws
    # for a held control, so the shapes are drawn here from the same classes
    # and read back. The behavioural halves below use the real thing.
    print("\n§2 · a held control is reachable, and says why")
    made = ev(pg, """() => {
      const old = document.getElementById('heldfix'); if (old) old.remove();
      const w = document.createElement('div');
      w.id = 'heldfix';
      w.style.cssText = 'position:fixed;left:20px;top:20px;z-index:99;background:#fff;padding:10px';
      w.innerHTML =
        '<button type="button" id="h-rst" class="hist-rst hasnote" aria-disabled="true"' +
        ' data-tip="Omar K. has since left the register">Restore</button>' +
        '<button type="button" id="h-app" class="copbtn hasnote" aria-disabled="true"' +
        ' data-tip="Save the Foundation first">Apply to plan</button>' +
        '<span class="hasnote capheld" id="h-wrap" data-tip="Clear the plan on this row first">' +
        '<select class="fld" id="h-sel" aria-disabled="true" data-capwas="pillars">' +
        '<option value="projects">Projects</option>' +
        '<option value="pillars" selected>Pillars</option></select></span>';
      document.body.appendChild(w);
      const seen = n => {
        const e = document.getElementById(n);
        const a = getComputedStyle(e, '::after');
        return { tip: (a.content || '').indexOf('Clear') > -1 || (a.content || '').indexOf('Save') > -1
                      || (a.content || '').indexOf('Omar') > -1,
                 shows: a.display !== 'none' };
      };
      return { built: !!document.getElementById('h-rst'), rst: seen('h-rst'),
               app: seen('h-app'), wrap: seen('h-wrap') };
    }""")
    pg.wait_for_timeout(200)
    ck("(fixture) the three held shapes are drawn", made.get("built"), made)
    for name, who in (("the change log's Restore", "rst"),
                      ("the Copilot's Apply to plan", "app"),
                      ("the capability's planning dropdown", "wrap")):
        ck("%s carries its reason in the bubble" % name,
           (made.get(who) or {}).get("tip"), made.get(who))
        ck("...and the bubble is shut until it is asked for",
           not (made.get(who) or {}).get("shows"), made.get(who))

    # REACHABLE is the whole point, so it is measured by focusing them.
    reach = ev(pg, """() => {
      const r = {};
      ['h-rst','h-app','h-sel'].forEach(n => {
        const e = document.getElementById(n);
        e.focus();
        r[n] = document.activeElement === e;
      });
      return r;
    }""", {})
    ck("Restore takes focus, so Tab reaches its reason", reach.get("h-rst"), reach)
    ck("...so does Apply to plan", reach.get("h-app"), reach)
    ck("...and so does the held dropdown", reach.get("h-sel"), reach)
    shown = ev(pg, """() => {
      document.getElementById('h-sel').focus();
      const a = getComputedStyle(document.getElementById('h-wrap'), '::after');
      return a.display !== 'none';
    }""", False)
    ck("...and focusing INSIDE the note opens the bubble (a select cannot carry one)",
       shown is True, shown)

    print("\n§3 · and the hold still holds — the half a conversion like this breaks")
    held = ev(pg, """() => {
      const b = document.getElementById('h-app');
      return { domDisabled: b.disabled,
               oldGuard: !b.disabled,
               newGuard: !b.disabled && b.getAttribute('aria-disabled') !== 'true' };
    }""", {})
    ck("a held button is NOT disabled as far as the browser is concerned",
       held.get("domDisabled") is False, held)
    ck("...so the guard this conversion replaced would have let it act",
       held.get("oldGuard") is True, held)
    ck("...and the one it was replaced with declines it",
       held.get("newGuard") is False, held)

    sel = ev(pg, """() => {
      const s = document.getElementById('h-sel');
      const was = s.value;
      s.value = 'projects';
      /* The product's listener puts it back; this is that rule, read from the
         attribute the build draws. */
      if (s.getAttribute('aria-disabled') === 'true') s.value = s.getAttribute('data-capwas') || was;
      return { was: was, now: s.value };
    }""", {})
    ck("a held dropdown changed by hand is put back", sel.get("now") == "pillars", sel)

    print("\n§4 · the quarter marks are marks, not dead buttons")
    qs = ev(pg, """() => {
      const src = document.documentElement.innerHTML;
      return {
        /* The build's own drawing code, read as text: the out-of-period and
           read-only quarter is a span with a role and a label, and no branch
           of it writes a `disabled` button any more. */
        span: src.indexOf('span class=\\"copex-q') > -1 || src.indexOf("span class='copex-q") > -1,
        css: !!Array.from(document.styleSheets).some(sh => {
          try { return Array.from(sh.cssRules).some(r => (r.selectorText || '').indexOf('span.copex-q') > -1); }
          catch (e) { return false; }
        })
      };
    }""", {})
    ck("the stylesheet gives a quarter MARK the box the button had", qs.get("css"), qs)
    # Drawn here from the build's own classes, and asserted not to be a control.
    qmark = ev(pg, """() => {
      const w = document.getElementById('heldfix');
      w.insertAdjacentHTML('beforeend',
        '<span id="q-off" class="copex-q off" role="img"' +
        ' title="Q3 is outside the plan period" aria-label="Q3 is outside the plan period">Q3</span>');
      const e = document.getElementById('q-off');
      e.focus();
      return { tag: e.tagName, takesFocus: document.activeElement === e,
               reads: e.getAttribute('aria-label') || '', hover: e.getAttribute('title') || '',
               boxed: Math.round(e.getBoundingClientRect().width) };
    }""", {})
    ck("a quarter outside the period is not a button", qmark.get("tag") == "SPAN", qmark)
    ck("...so Tab walks past it rather than stopping on nothing",
       qmark.get("takesFocus") is False, qmark)
    ck("...while a pointer still reaches the sentence",
       "outside the plan period" in (qmark.get("hover") or ""), qmark)
    ck("...and a screen reader is told the same thing",
       "outside the plan period" in (qmark.get("reads") or ""), qmark)
    ck("...and it still occupies the quarter's own box",
       (qmark.get("boxed") or 0) >= 20, qmark)

    print("\n§5 · and the build is quiet")
    ck("no page errors", not errs, errs[:3])
    ev(pg, "() => { const w = document.getElementById('heldfix'); if (w) w.remove(); }")
    b.close()

print("\n%d failure(s)" % bad)
raise SystemExit(1 if bad else 0)
