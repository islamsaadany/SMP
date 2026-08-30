"""A PROJECT'S FRONT MATTER (§109).

Islam: "any project needs 3 things at its starting part which are the brief,
stakeholders, start and end date."

Two things this asserts that nothing else would:

  · THE ALIGNMENT IS THE ASK. "Make sure the start of the brief description
    aligns with the start of the pills" is a property of the grid, not
    something that happens to be true at one width -- so it is measured at
    three widths in both themes, on the VALUE box rather than on the text
    (a pill's own padding sits inside it and is not the alignment).

  · THE FIELDS MUST WRITE. §96 is the whole reason: an editor drawn and wired
    to nothing looks identical, accepts every keystroke, and throws it away on
    the next repaint. Every one of the five is typed into and read back OUT OF
    THE DATA, and then survives a paint().

And both ends (§94.2): the band must have LOST the owner and the timeline
pill, or the header says the same fact twice.
"""
import os, sys
from playwright.sync_api import sync_playwright

HERE = os.path.dirname(os.path.abspath(__file__))
FILE = os.path.join(HERE, "..", "strategy-management-platform.html")
URL = "file://" + os.path.abspath(FILE)
DEST, FN = "fn:finance", "finance"

bad = 0
def ck(what, ok, x=""):
    global bad
    if not ok: bad += 1
    print(("    ok   " if ok else "    FAIL ") + what + (("  — %s" % (x,)) if not ok and x != "" else ""))

def open_project(pg, theme, w):
    pg.evaluate("t=>document.documentElement.setAttribute('data-theme',t)", theme)
    pg.select_option("#asWho", "smo"); pg.wait_for_timeout(220)
    for _ in range(3):
        on = pg.eval_on_selector_all("#units .navswitch .nsw.on", "e=>e.map(x=>x.textContent.trim())")
        if on and on[0] == "Functions": break
        pg.click("#units .navswitch"); pg.wait_for_timeout(140)
    pg.click('#units button[data-u="%s"]' % DEST); pg.wait_for_timeout(500)
    pg.evaluate("() => window.scrollTo(0,0)"); pg.wait_for_timeout(150)

READ = """() => {
  const pane = document.querySelector('.pane');
  const box = pane.querySelector('.pfront');
  if (!box) return { none: true };
  const cs = getComputedStyle(pane), pr = pane.getBoundingClientRect();
  const right = pr.right - parseFloat(cs.paddingRight);
  const left  = pr.left  + parseFloat(cs.paddingLeft);
  // A LABEL WIDER THAN ITS TRACK does not move the value column -- both rows
  // stay aligned with each other and the WORD is what gets clipped, silently.
  // Measured against the text, because the <em> box is the track.
  const fits = el => { const r = document.createRange(); r.selectNodeContents(el);
    const t = r.getBoundingClientRect(), b = el.getBoundingClientRect();
    return t.width <= b.width + 0.5; };
  const rows = [...box.querySelectorAll('.pfright .pfrow')].map(r => {
    const val = r.querySelector('.pfval'), em = r.querySelector('em');
    const first = val.firstElementChild || val;
    return { label: em.textContent.trim(),
             valLeft: Math.round(val.getBoundingClientRect().left),
             firstLeft: Math.round(first.getBoundingClientRect().left),
             fits: fits(em),
             gap: Math.round(val.getBoundingClientRect().left -
                             em.getBoundingClientRect().right) };
  });
  const allLabels = [...box.querySelectorAll('.pfrow em')].map(e => ({
    t: e.textContent.trim(), fits: fits(e) }));
  return {
    labels: allLabels.map(e => e.t),
    clipped: allLabels.filter(e => !e.fits).map(e => e.t),
    rows: rows,
    bandCarriesFacts: /By date|By quarter/.test(pane.querySelector('.pband').textContent),
    escapes: [...box.querySelectorAll('*')].filter(e => {
      const r = e.getBoundingClientRect();
      return r.width && (r.right > right + 1 || r.left < left - 1); }).length,
    pagex: document.documentElement.scrollWidth - document.documentElement.clientWidth
  };
}"""

with sync_playwright() as pw:
    b = pw.chromium.launch(executable_path="/opt/pw-browsers/chromium",
                           args=["--no-sandbox", "--disable-dev-shm-usage"])
    print("── the block, read")
    for theme in ("light", "dark"):
        for w in (1500, 1280, 1000):
            pg = b.new_page(viewport={"width": w, "height": 2600})
            errs = []
            pg.on("pageerror", lambda e: errs.append(str(e)))
            pg.on("console", lambda m: errs.append(m.text) if m.type == "error" else None)
            pg.goto(URL); pg.wait_for_timeout(1300)
            open_project(pg, theme, w)
            d = pg.evaluate(READ)
            tag = "%s %s" % (theme, w)
            if d.get("none"):
                ck(tag + ": the block is drawn", False); pg.close(); continue
            ck(tag + ": Owner · Start · End · Brief · Stakeholders",
               d["labels"] == ["Owner", "Start", "End", "Brief", "Stakeholders"], d["labels"])
            ck(tag + ": the band no longer repeats the facts", not d["bandCarriesFacts"])
            # THE ASK, measured
            ck(tag + ": the brief and the pills begin at one x",
               len(set(r["valLeft"] for r in d["rows"])) == 1
               and len(set(r["firstLeft"] for r in d["rows"])) == 1, d["rows"])
            ck(tag + ": no label is clipped by its own track",
               d["clipped"] == [], d["clipped"])
            ck(tag + ": the value stands clear of its label",
               all(r["gap"] >= 14 for r in d["rows"]), [r["gap"] for r in d["rows"]])
            ck(tag + ": nothing escapes the pane",
               d["escapes"] == 0 and d["pagex"] <= 0, (d["escapes"], d["pagex"]))
            ck(tag + ": no console errors", not errs, errs[:1])
            pg.close()

    print("── the pen, pressed")
    pg = b.new_page(viewport={"width": 1500, "height": 2600})
    errs = []
    pg.on("pageerror", lambda e: errs.append(str(e)))
    pg.on("console", lambda m: errs.append(m.text) if m.type == "error" else None)
    pg.goto(URL); pg.wait_for_timeout(1300)
    open_project(pg, "light", 1500)
    pen = pg.query_selector('.pane .paneact .penbtn[data-page="plan"]')
    ck("the plan pen is there", bool(pen))
    if pen:
        pen.click(); pg.wait_for_timeout(500)
        # THE OWNER IS A LIST NOW (§130.1), and the count that used to answer
        # this stopped being able to (§51.11: a check keyed on markup that has
        # changed shape). It was `input, textarea` == 5, which silently left
        # out the Repeats select that has been in this block since §115 — so
        # adding selects to the query makes the honest total SIX, and a total
        # was never what this was about.
        #
        # IT ASKS PER ROW INSTEAD: every one of the five rows this section
        # then drives must carry a field, which is the thing that has to be
        # true and stays true whatever else the block grows.
        # §179: Start and End are a MONTH PICKER now, not a box — so the
        # query has to admit a button, and the two are asserted BY NAME below
        # rather than merely counted. A query that only looked for fields
        # would report "no field behind Start" for a control that is working
        # exactly as designed.
        got = pg.evaluate("""()=>{const out={};
          [...document.querySelectorAll('.pfront .pfrow')].forEach(r=>{
            const el=r.querySelector('input, textarea, select, button.monthbtn');
            /* By CLASS MEMBERSHIP, never by the last word of className:
               searchsel.js appends `ss-native` to the select it enhances, so
               the last class is the enhancement rather than the field. */
            out[r.querySelector('em').textContent.trim()] = !el ? null
              : el.tagName.toLowerCase() +
                (el.classList.contains('ownersel') ? '.ownersel' : '') +
                (el.classList.contains('monthbtn') ? '.monthbtn' : '');});
          return out;}""")
        want = ["Owner", "Start", "End", "Brief", "Stakeholders"]
        ck("a field behind every one of the five",
           all(got.get(k) for k in want), got)
        ck("and the owner among them is a list from the register",
           got.get("Owner") == "select.ownersel", got)
        # BOTH ENDS (§94.2, §113.8): the picker is there AND the box is gone.
        # Asserting only "a control exists" would pass on the old build, where
        # the control was a text input that let `30/4/2026` in — the value
        # §179 exists to make unwritable.
        ck("Start and End are the month picker, not a box",
           got.get("Start") == "button.monthbtn" and got.get("End") == "button.monthbtn", got)
        # ── Start and End go through the REAL picker (§70) ────────────────
        # Pressed, not set: a control that renders and does nothing has
        # shipped five times in this project, and setting a value from script
        # would prove nothing about the button somebody actually presses.
        for label, mi, field, want_val in (("Start", 1, "start", "Feb 26"),
                                           ("End", 10, "end", "Nov 26")):
            pg.evaluate("""(label)=>{
              const row=[...document.querySelectorAll('.pfront .pfrow')]
                .find(r=>r.querySelector('em').textContent.trim()===label);
              row.querySelector('button.monthbtn').click();}""", label)
            pg.wait_for_timeout(220)
            opened = pg.eval_on_selector_all(".monthpop", "e=>e.length")
            ck("%-13s opens a month panel" % label, opened == 1, opened)
            pg.click('.monthpop [data-mpick="%d"]' % mi)
            pg.wait_for_timeout(340)
            stored = pg.evaluate("(f) => capsOfFunction('%s')[0].projects[0][f]" % FN, field)
            ck("%-13s is written as a month the platform reads" % label,
               stored == want_val, "picked %d, stored %r" % (mi, stored))
            # THE VALUE MUST READ BACK, which is the whole point of §179: the
            # old box collected `30/4/2026`, which monthsOf() cannot read at
            # all, so the project's End was no date and nothing that depends
            # on it could ever fire.
            reads = pg.evaluate("(v)=>monthsOf(v)", stored)
            ck("%-13s ...and monthsOf() reads it" % label, reads is not None, stored)

        for label, typed, field in (("Owner", "Someone Else", "owner"),
                                    ("Brief", "A rewritten brief.", "brief"),
                                    ("Stakeholders", "Treasury, Risk", "stakeholders")):
            pg.evaluate("""([label, typed]) => {
              const row = [...document.querySelectorAll('.pfront .pfrow')]
                .find(r => r.querySelector('em').textContent.trim() === label);
              const el = row && row.querySelector('input, textarea, select');
              if (!el) return;
              /* A select can only be set to something it holds — which is the
                 point of the control (§130.1) — so the value is added if the
                 register does not carry it, exactly as a stored name outside
                 the list is (§96.2). */
              if (el.tagName === "SELECT" &&
                  ![...el.options].some(o => o.value === typed)) {
                const o = document.createElement("option");
                o.textContent = typed; el.appendChild(o);
              }
              el.value = typed;
              el.dispatchEvent(new Event('change', { bubbles: true }));
            }""", [label, typed])
            pg.wait_for_timeout(320)
            stored = pg.evaluate("(f) => capsOfFunction('%s')[0].projects[0][f]" % FN, field)
            want = ["Treasury", "Risk"] if field == "stakeholders" else typed
            ck("%-13s is written to the plan" % label, stored == want,
               "typed %r, stored %r" % (typed, stored))
        pg.evaluate("() => paint()"); pg.wait_for_timeout(400)
        after = pg.evaluate("""() => { const p = capsOfFunction('%s')[0].projects[0];
          return [p.owner, p.start, p.end]; }""" % FN)
        ck("and survives a repaint",
           after == ["Someone Else", "Feb 26", "Nov 26"], after)
    ck("no console errors", not errs, errs[:1])
    pg.close()
    b.close()

print(("\n%d FAILED" % bad) if bad else "\nall passed")
raise SystemExit(1 if bad else 0)
