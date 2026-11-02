"""§705: a red figure's note is asked for ON THE BOX, and nothing is shut.

Islam, 2026-11-02: "let's remove the feature that dims the whole plan until
the note of non achieving number is not there and let's replace it by a clear
tag or note on the text box to be obvious but don't stop a person from
entering the numbers" — then, on the mockup (design-mockups/note-tag/), option
A with a grey prompt in the box and, where the note is only read, the red
words "Needs justification". §576's lock (every other box disabled and greyed,
a bar in the "to finish" bar's place, the cursor steered to the note) is gone.

What this asserts, both ends every time (§94.2):
  · THE RULE (`noteWant`): "" on a row that owes nothing; the band's word on a
    red row with no note; "" again once the note is written or the figure is
    out of the red;
  · TYPED on Mobile's Reporting page: 18% against 32% due, Tab — NO box is
    disabled, no lock bar, the usual "to finish" bar counts the note, the
    row's note box wears the tag "Note needed · off track", asks "No
    justification yet — why, and what is being done", is in the tab path and
    is red; another figure can be typed straight away; the note written takes
    the tag away and the bar with it;
  · A CAPABILITY'S page (cap6, the worked example's own red rows): the tag on
    each owed `data-cnote` box with the same prompt, nothing disabled; and the
    same page read by somebody who may not write prints "Needs justification"
    in red on those rows and no box;
  · MY REPORTING, as a tactic's owner who does not run the unit: the Note
    column, the box only on their own red row, tagged, nothing else shut, and
    the note landing on the right tactic in the right unit;
  · the tag and the red words read at 4.5:1 or better in light and dark.
"""
import os
import pathlib
from playwright.sync_api import sync_playwright

HERE = pathlib.Path(__file__).resolve().parent
FILE = pathlib.Path(os.environ.get("SMP_BUILT") or (HERE.parent / "strategy-management-platform.html"))
PROMPT = "No justification yet — why, and what is being done"
bad = 0


def ck(w, ok, x=""):
    global bad
    if not ok:
        bad += 1
    print(("  ok      " if ok else "  FAIL    ") + w + (("  — " + str(x)) if not ok and x != "" else ""))


def ev(pg, js, arg=None):
    try:
        return pg.evaluate(js, arg) if arg is not None else pg.evaluate(js)
    except Exception as e:                                   # noqa: BLE001 — §215
        return {"threw": str(e).split("\n")[0]}


STATE = r"""() => {
  const boxes = [...document.querySelectorAll('[data-rep],[data-crep],[data-cpick],[data-cpct],[data-note],[data-cnote]')];
  const id = el => { const d = el.dataset; return d.rep ?? d.crep ?? d.cpick ?? d.cpct ?? d.note ?? d.cnote; };
  const tagged = [...document.querySelectorAll('.notetag')].map(t => {
    const n = t.nextElementSibling; return { words: t.textContent, note: n ? id(n) : null,
      ph: n ? n.placeholder : null, tab: n ? n.getAttribute('tabindex') : null, red: n ? n.classList.contains('needed') : null }; });
  const a = document.activeElement;
  return { boxes: boxes.length, shut: boxes.filter(e => e.disabled).length, greyed: document.querySelectorAll('.lockshut').length,
           lockbar: !!document.querySelector('.lockbar'),
           bar: (document.querySelector('[data-repband]') || {}).textContent || null,
           tagged, needjust: [...document.querySelectorAll('.needjust')].map(e => e.textContent),
           active: a && a !== document.body ? { note: a.dataset.note ?? a.dataset.cnote ?? null, rep: a.dataset.rep ?? null } : null };
}"""


def to_unit(pg, key, sub):
    ev(pg, "() => { var o = document.querySelector('.welcomeover'); if (o) o.remove(); }")
    pg.click('#units [data-u="%s"]' % key)
    pg.wait_for_timeout(450)
    pg.click('[data-s="%s"]' % sub)
    pg.wait_for_timeout(600)


def contrast(pg, sel):
    return ev(pg, """(sel) => {
      const lum = c => { const v = (c.match(/\\d+(\\.\\d+)?/g) || [0,0,0]).slice(0,3).map(x => +x / 255)
          .map(x => x <= 0.03928 ? x / 12.92 : Math.pow((x + 0.055) / 1.055, 2.4));
        return .2126 * v[0] + .7152 * v[1] + .0722 * v[2]; };
      const ratio = (a, b) => { const x = lum(a), y = lum(b); return (Math.max(x, y) + .05) / (Math.min(x, y) + .05); };
      const bg = e => { let n = e, c = getComputedStyle(n).backgroundColor;
        while (c === 'rgba(0, 0, 0, 0)' && n.parentElement) { n = n.parentElement; c = getComputedStyle(n).backgroundColor; }
        return c; };
      const e = document.querySelector(sel); return e ? Math.round(ratio(getComputedStyle(e).color, bg(e)) * 100) / 100 : 0; }""", sel)


with sync_playwright() as pw:
    b = pw.chromium.launch()
    pg = b.new_page(viewport={"width": 1500, "height": 1000})
    errs = []
    pg.on("pageerror", lambda e: errs.append(str(e)))
    pg.add_init_script("try{sessionStorage.setItem('smp.welcome.done','1');"
                       "localStorage.setItem('smp.tour.never','1')}catch(e){}")
    pg.goto("file://" + str(FILE))
    pg.wait_for_timeout(900)

    print("── 1 · the rule")
    r = ev(pg, """() => {
      if (typeof noteWant !== 'function') return { threw: 'no noteWant' };
      const ko = UNITS.mobile.keyObjectives[1], keep = { a: ko.actual, n: ko.note };
      const x = { kind: 'objective', obj: ko, id: ko.id }, out = {};
      out.clean = noteWant(x);
      ko.actual = '18%'; delete ko.note; out.red = noteWant(x);
      ko.note = 'Why'; out.noted = noteWant(x);
      delete ko.note; ko.actual = '31%'; out.outOfRed = noteWant(x);
      out.gone = typeof noteLockOf === 'undefined' && typeof noteLockBar === 'undefined' && typeof NOTELOCK === 'undefined';
      out.read = noteRead('', true, true); out.readQuiet = noteRead('', true, false); out.readNote = noteRead('Done.', true, true);
      ko.actual = keep.a; if (keep.n !== undefined) ko.note = keep.n;
      return out;
    }""")
    ck("a row that owes nothing wants no tag", isinstance(r, dict) and r.get("clean") == "", r)
    ck("a red figure with no note wants the band's word", r.get("red") == "Off track", r)
    ck("...its note takes the word away", r.get("noted") == "", r)
    ck("...and so does the figure moved out of the red", r.get("outOfRed") == "", r)
    ck("the lock is gone from the build: no rule, no bar, no state", r.get("gone") is True, r)
    ck("the read side says Needs justification where a note is owed and nobody wrote one",
       'class="why notetext needjust"' in (r.get("read") or "") and "Needs justification" in (r.get("read") or ""), r.get("read"))
    ck("...and nothing where none is owed, the note itself where one is written",
       r.get("readQuiet") == "" and "Done." in (r.get("readNote") or "") and "needjust" not in (r.get("readNote") or ""), r)

    print("── 2 · typed on Mobile's Reporting page")
    to_unit(pg, "mobile", "report")
    s0 = ev(pg, STATE)
    ck("before: nothing shut, no tag, no bar", s0.get("shut") == 0 and s0.get("tagged") == [] and s0.get("bar") is None, s0)
    pg.click('[data-rep="mobile-KO2"]')
    pg.fill('[data-rep="mobile-KO2"]', "18")
    pg.keyboard.press("Tab")
    pg.wait_for_timeout(400)
    s1 = ev(pg, STATE)
    ck("18% against 32% due: NO box is disabled and nothing is greyed",
       s1.get("shut") == 0 and s1.get("greyed") == 0 and s1.get("boxes", 0) >= 20, s1)
    ck("no lock bar; the usual \"to finish\" bar counts the note",
       s1.get("lockbar") is False and (s1.get("bar") or "").startswith("1 to finish") and "Key Objectives" in (s1.get("bar") or ""), s1.get("bar"))
    tg = s1.get("tagged") or []
    ck("the row's note box wears the tag, in the mockup's words",
       len(tg) == 1 and tg[0].get("note") == "mobile-KO2" and tg[0].get("words") == "Note needed · off track", tg)
    ck("...asks in the prompt's words, is red, and is in the tab path",
       len(tg) == 1 and tg[0].get("ph") == PROMPT and tg[0].get("red") is True and tg[0].get("tab") is None, tg)
    ck("the prompt is a placeholder, nothing stored",
       ev(pg, "() => UNITS.mobile.keyObjectives[1].note || ''") == "", "stored")
    # ANOTHER FIGURE GOES STRAIGHT IN — the whole point.
    pg.click('[data-rep="mobile-KO3"]')
    pg.fill('[data-rep="mobile-KO3"]', "4000")
    pg.keyboard.press("Tab")
    pg.wait_for_timeout(400)
    got3 = ev(pg, "() => UNITS.mobile.keyObjectives[2].actual")
    ck("another figure is typed and stored while the note is still owed", str(got3).startswith("4000") or str(got3).startswith("4,000"), got3)
    s1b = ev(pg, STATE)
    ck("...and the tag is still on the red row, nothing shut", len(s1b.get("tagged") or []) == 1 and s1b.get("shut") == 0, s1b)
    for theme in ("light", "dark"):
        ev(pg, "(t) => { if (window.THEME && THEME.set) THEME.set(t); else document.documentElement.setAttribute('data-theme', t); }", theme)
        ev(pg, "() => paint()")
        pg.wait_for_timeout(300)
        c = contrast(pg, ".notetag")
        ck("the tag reads in %s — %s" % (theme, c), c >= 4.5, c)
    ev(pg, "() => { if (window.THEME && THEME.set) THEME.set('light'); else document.documentElement.removeAttribute('data-theme'); paint(); }")
    pg.wait_for_timeout(300)
    pg.focus('[data-note="mobile-KO2"]')
    pg.keyboard.type("Share lost to the new entrant in Q3; recovery plan with trade marketing")
    pg.keyboard.press("Tab")
    pg.wait_for_timeout(400)
    s2 = ev(pg, STATE)
    stored = ev(pg, "() => UNITS.mobile.keyObjectives[1].note")
    ck("the note is stored on the row", isinstance(stored, str) and stored.startswith("Share lost"), stored)
    ck("...and the tag goes, and the bar with it", s2.get("tagged") == [] and s2.get("bar") is None and s2.get("shut") == 0, s2)
    ev(pg, "() => { const k = UNITS.mobile.keyObjectives[2]; k.actual = '3,180'; paint(); }")

    print("── 3 · a capability's page: the worked example's own red rows")
    pg.select_option("#asWho", "smo")
    pg.wait_for_timeout(500)
    ev(pg, "() => { leaveModes(); current = 'cap:cap6'; paint(); }")
    pg.wait_for_timeout(500)
    ev(pg, "() => { const t = [...document.querySelectorAll('#subtabs [data-s]')].find(x => /Reporting/.test(x.textContent)); if (t) t.click(); }")
    pg.wait_for_timeout(700)
    owed = ev(pg, "() => subjectAsked('cap:cap6').filter(needsNote).map(x => x.id)")
    s3 = ev(pg, STATE)
    ck("cap6 owes notes on its shipped data", isinstance(owed, list) and len(owed) >= 1, owed)
    ck("every owed row's box is tagged, with the prompt, and nothing is shut",
       isinstance(owed, list) and sorted(t.get("note") for t in (s3.get("tagged") or [])) == sorted(owed) and
       all(t.get("ph") == PROMPT and t.get("red") for t in (s3.get("tagged") or [])) and s3.get("shut") == 0 and s3.get("lockbar") is False, s3)
    ck("...and no red words, because the office may write them", s3.get("needjust") == [], s3)
    # NOT-DUE ROWS OWE NOTHING: cap6's project carries milestones and an
    # outcome that are red on their own figure and not yet asked — Submit
    # leaves them out (`fnAskedItems`), so the tag must too (§94.2: measured,
    # four tagged where one was owed, before `asked` reached the builder).
    red_all = ev(pg, "() => fnReportItems('cap:cap6').filter(needsNote).length")
    ck("...and a red row whose date has not come is not tagged (Submit does not ask it)",
       isinstance(red_all, int) and red_all > len(owed) and len(s3.get("tagged") or []) == len(owed), (red_all, len(owed)))

    print("── 3b · read by somebody who may not write the note")
    # The Group CEO reads Mobile's Reporting page with no box on it (§520):
    # the red row says "Needs justification" where the box would be.
    ev(pg, "() => { const k = UNITS.mobile.keyObjectives[1]; window.__r = { a: k.actual, n: k.note }; k.actual = '18%'; delete k.note; }")
    pg.select_option("#asWho", "ceo")
    pg.wait_for_timeout(400)
    to_unit(pg, "mobile", "report")
    s3b = ev(pg, STATE)
    may = ev(pg, "() => canEnterNote('mobile', subjectAsked('mobile').find(x => x.id === 'mobile-KO2'))")
    found = isinstance(s3b, dict) and s3b.get("needjust") == ["Needs justification"] and s3b.get("boxes") == 0
    ck("the Group CEO may not write Mobile's note, is drawn no box, and reads \"Needs justification\" on the red row",
       may is False and found, (may, s3b))
    ck("...and nothing on a row that is explained or in the green", isinstance(s3b, dict) and len(s3b.get("needjust") or []) == 1, s3b)
    red = ev(pg, "() => { const e = document.querySelector('.needjust'), cs = getComputedStyle(document.documentElement); const s = document.createElement('span'); s.style.color = cs.getPropertyValue('--bad-tx').trim(); document.body.appendChild(s); const want = getComputedStyle(s).color; s.remove(); return e ? { is: getComputedStyle(e).color, want } : null; }")
    ck("...and the words are RED, not the table's grey for a note", isinstance(red, dict) and red.get("is") == red.get("want"), red)
    if found:
        for theme in ("light", "dark"):
            ev(pg, "(t) => { if (window.THEME && THEME.set) THEME.set(t); else document.documentElement.setAttribute('data-theme', t); }", theme)
            ev(pg, "() => paint()")
            pg.wait_for_timeout(300)
            c = contrast(pg, ".needjust")
            ck("the red words read in %s — %s" % (theme, c), c >= 4.5, c)
        ev(pg, "() => { if (window.THEME && THEME.set) THEME.set('light'); else document.documentElement.removeAttribute('data-theme'); paint(); }")
    ev(pg, "() => { const k = UNITS.mobile.keyObjectives[1], w = window.__r; k.actual = w.a; if (w.n !== undefined) k.note = w.n; }")

    print("── 4 · My reporting, as a tactic's owner who does not run the unit")
    pg.select_option("#asWho", "smo")
    pg.wait_for_timeout(400)
    own = ev(pg, """() => {
      GROUP.lineOwners = true;
      const p = { key: 't705', name: 'Line Owner Seven', active: true, unit: 'retailstores' };
      PEOPLE.push(p);
      const t = UNITS.mobile.items[0].tactics.filter(x => tacticDue(x))[0];
      t.owner = p.name; delete t.note;
      paint();
      return { key: p.key, tid: t.id };
    }""")
    ck("an owner who does not run Mobile is made", isinstance(own, dict) and own.get("key") == "t705", own)
    pg.select_option("#asWho", "t705")
    pg.wait_for_timeout(900)
    tab = pg.query_selector('[data-s="mylines"]')
    ck("My reporting is drawn for them", tab is not None)
    if tab:
        tab.click()
        pg.wait_for_timeout(600)
        tid = own.get("tid")
        before = ev(pg, "(id) => !!document.querySelector('[data-note=\"' + id + '\"]')", tid)
        ck("no note box while the line is not red", before is False, before)
        pg.click('[data-rep="%s"]' % tid)
        pg.fill('[data-rep="%s"]' % tid, "1")
        pg.keyboard.press("Tab")
        pg.wait_for_timeout(500)
        s4 = ev(pg, STATE)
        tg4 = s4.get("tagged") or []
        ck("a red figure on their own line draws their note box, tagged, naming the line's unit",
           len(tg4) == 1 and tg4[0].get("note") == tid and tg4[0].get("ph") == PROMPT and
           ev(pg, "(id) => (document.querySelector('[data-note=\"' + id + '\"]') || {dataset:{}}).dataset.repu", tid) == "mobile", tg4)
        ck("...and nothing on My reporting is shut, no lock bar", s4.get("shut") == 0 and s4.get("lockbar") is False, s4)
        pg.focus('[data-note="%s"]' % tid)
        pg.keyboard.type("Rollout slipped a month")
        pg.keyboard.press("Tab")
        pg.wait_for_timeout(500)
        got = ev(pg, "(id) => { const t = UNITS.mobile.items[0].tactics.filter(x => x.id === id)[0]; return t && t.note; }", tid)
        ck("the note lands on that tactic, in Mobile", got == "Rollout slipped a month", got)
        s5 = ev(pg, STATE)
        ck("...and the tag goes, the box stays to correct it",
           s5.get("tagged") == [] and ev(pg, "(id) => !!document.querySelector('[data-note=\"' + id + '\"]')", tid) is True, s5)

    ck("no page error", not errs, errs[:3])
    b.close()

print("\n" + ("note-tag: all passed" if not bad else "%d FAILED" % bad))
raise SystemExit(1 if bad else 0)
