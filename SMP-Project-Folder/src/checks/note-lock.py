"""§576: a red figure gets its note before anything else.

Islam: "when people enter a number in the performance that is deviated and in
red the note becomes mandatory as agreed. to the level it blocks the rest of
the entries until the note is made". Agreed in chat — every other box locks,
that row's note and its own figure stay open, the note written opens the page
again, every Reporting page and My reporting, a page that opens with red rows
asks for those first, and on My reporting the tactic's owner writes the note
on their own red rows — then drawn (design-mockups/note-first/) and approved.

What this asserts, both ends every time (§94.2):
  · THE RULE (`noteLockOf`): nothing red, nothing held; a red figure holds the
    page; its note, a figure moved out of the red, or a report already
    closed lets it go; a breakdown's cells are ONE row; the company's page
    asks the capabilities it reports too;
  · TYPED on Mobile's Reporting page: 18% against 32% due, Tab — the bar in
    the "to finish" bar's place, every other box shut, the row's figure and
    note open, the cursor in the note, Save draft still pressable; the note
    typed and the page opens again; Enter from the red figure goes to its note;
  · GO TO IT: a red measure on another pillar holds the pillar on screen, and
    the button opens that pillar on the note; opening a page that already holds
    a red row moves nobody's cursor;
  · A SUPPORTING FUNCTION'S report (Finance: a capability note, `data-cnote`)
    and a unit that plans in OBJECTIVES AND ACTIONS hold the same way;
  · MY REPORTING, as a tactic's owner who does not run the unit: the Note
    column, a box on their own red row only, the lock, and the note landing on
    the right tactic in the right unit.
"""
import os
import pathlib
from playwright.sync_api import sync_playwright

HERE = pathlib.Path(__file__).resolve().parent
FILE = pathlib.Path(os.environ.get("SMP_BUILT") or (HERE.parent / "strategy-management-platform.html"))
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


# What the page holds open and shut, read off the controls the walk reads.
STATE = r"""() => {
  const boxes = [...document.querySelectorAll('[data-rep],[data-crep],[data-cpick],[data-cpct],[data-note],[data-cnote]')];
  const id = el => { const d = el.dataset; return d.rep ?? d.crep ?? d.cpick ?? d.cpct ?? d.note ?? d.cnote; };
  const open = boxes.filter(e => !e.disabled), shut = boxes.filter(e => e.disabled);
  const a = document.activeElement;
  const sd = document.querySelector('[data-repsave]');
  return { lock: typeof NOTELOCK !== 'undefined' && NOTELOCK ? NOTELOCK.rows.map(r => r.noteId || r.id) : null,
           bar: (document.querySelector('.lockbar') || {}).textContent || null,
           missbar: !!document.querySelector('.missbar'),
           open: [...new Set(open.map(id))], openN: open.length, shutN: shut.length,
           greyed: document.querySelectorAll('.lockshut').length,
           ringed: [...document.querySelectorAll('.lockhere')].map(id),
           active: a && a !== document.body ? { note: a.dataset.note ?? a.dataset.cnote ?? null, rep: a.dataset.rep ?? null } : null,
           save: sd ? !sd.disabled : null,
           shutTitle: shut.length ? shut[0].getAttribute('title') : null };
}"""


def to_unit(pg, key, sub):
    ev(pg, "() => { var o = document.querySelector('.welcomeover'); if (o) o.remove(); }")
    pg.click('#units [data-u="%s"]' % key)
    pg.wait_for_timeout(450)
    pg.click('[data-s="%s"]' % sub)
    pg.wait_for_timeout(600)


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
      if (typeof noteLockOf !== 'function') return { threw: 'no noteLockOf' };
      const ko = UNITS.mobile.keyObjectives[1], keep = { a: ko.actual, n: ko.note };
      const out = {};
      out.clean = noteLockOf('mobile', false);
      ko.actual = '18%'; delete ko.note;
      const l = noteLockOf('mobile', false);
      out.red = l && l.rows.map(x => x.id);
      ko.note = 'Why'; out.noted = noteLockOf('mobile', false);
      delete ko.note; ko.actual = '31%'; out.outOfRed = noteLockOf('mobile', false);
      ko.actual = '18%'; REVIEW.submitted = REVIEW.submitted || {}; const was = REVIEW.submitted.mobile;
      REVIEW.submitted.mobile = true; out.closed = noteLockOf('mobile', false);
      if (was === undefined) delete REVIEW.submitted.mobile; else REVIEW.submitted.mobile = was;
      out.notReporting = noteLockOf(null, false);
      out.groupAsks = noteLockSubjects('group');
      out.capsHere = (typeof capsHere === 'function') ? capsHere().map(c => 'cap:' + c.id) : [];
      ko.actual = keep.a; if (keep.n !== undefined) ko.note = keep.n;
      return out;
    }""")
    ck("nothing red, nothing held", isinstance(r, dict) and r.get("clean") is None, r)
    ck("a red figure with no note holds the page, on that row", r.get("red") == ["mobile-KO2"], r)
    ck("...its note lets it go", r.get("noted") is None, r)
    ck("...and so does the figure moved out of the red", r.get("outOfRed") is None, r)
    ck("...and a report already submitted has nothing open to hold", r.get("closed") is None, r)
    ck("a page that is not a report holds nothing", r.get("notReporting") is None, r)
    ck("the company's page asks the capabilities it reports as well",
       r.get("groupAsks", [None])[0] == "group" and all(c in r.get("groupAsks", []) for c in r.get("capsHere", [])) and
       len(r.get("capsHere", [])) > 0, r)
    bd = ev(pg, """() => {
      /* §343: a breakdown's cells share their row's note, so a row with two
         red cells is ONE entry. Made on Mobile's first pillar (§255). */
      const p = UNITS.mobile.items[0];
      const keep = JSON.stringify(p.breakdown || null);
      p.breakdown = { name: 'Region', cols: [{ id: 'c1', name: 'Cairo', dir: '\u2265' }, { id: 'c2', name: 'Delta', dir: '\u2265' }],
                      rows: [{ id: 'mobile-P1-B1', name: 'Bakery', t_c1: '10', t_c2: '10', a_c1: '1', a_c2: '1' }] };
      const cells = subjectAsked('mobile').filter(x => x.kind === 'bdcell');
      const l = noteLockOf('mobile', false);
      const out = { cells: cells.length, red: cells.filter(needsNote).length,
                    rows: l ? l.rows.filter(x => (x.noteId || x.id) === 'mobile-P1-B1').length : 0 };
      const k = JSON.parse(keep); if (k === null) delete p.breakdown; else p.breakdown = k;
      return out;
    }""")
    ck("the made breakdown asks two cells and both are red",
       isinstance(bd, dict) and bd.get("cells") == 2 and bd.get("red") == 2, bd)
    ck("...and its row is held ONCE", isinstance(bd, dict) and bd.get("rows") == 1, bd)

    print("── 2 · typed on Mobile's Reporting page")
    to_unit(pg, "mobile", "report")
    s0 = ev(pg, STATE)
    ck("before: nothing held, nothing greyed", s0.get("lock") is None and s0.get("shutN") == 0 and s0.get("bar") is None, s0)
    pg.click('[data-rep="mobile-KO2"]')
    pg.fill('[data-rep="mobile-KO2"]', "18")
    pg.keyboard.press("Tab")
    pg.wait_for_timeout(400)
    s1 = ev(pg, STATE)
    ck("18% against 32% due holds the page on that row", s1.get("lock") == ["mobile-KO2"], s1)
    ck("the bar names it, in the words approved",
       (s1.get("bar") or "").startswith("Mobile market share is off track. Write its note before entering anything else."), s1.get("bar"))
    ck("...with Go to it", "Go to it" in (s1.get("bar") or ""), s1.get("bar"))
    ck("...in the \"to finish\" bar's place", s1.get("missbar") is False, s1)
    ck("every other box is shut", s1.get("open") == ["mobile-KO2"] and s1.get("shutN", 0) >= 20, s1)
    ck("...the row's figure and its note stay open", s1.get("openN") == 2, s1)
    ck("...greyed, and the hover says why", s1.get("greyed", 0) >= 20 and
       s1.get("shutTitle") == "Write the note on Mobile market share first", s1)
    ck("the note is ringed", s1.get("ringed") == ["mobile-KO2"], s1)
    ck("the cursor is in the note after Tab", (s1.get("active") or {}).get("note") == "mobile-KO2", s1.get("active"))
    ck("Save draft is still pressable", s1.get("save") is True, s1)
    # The bar reads in both palettes — its name, its sentence and its button
    # (§38.5's 4.5:1, measured as PAINT off the computed colours).
    for theme in ("light", "dark"):
        ev(pg, "(t) => { if (window.THEME && THEME.set) THEME.set(t); else document.documentElement.setAttribute('data-theme', t); }", theme)
        ev(pg, "() => paint()")
        pg.wait_for_timeout(300)
        ink = ev(pg, """() => {
          const lum = c => { const v = (c.match(/\\d+(\\.\\d+)?/g) || [0,0,0]).slice(0,3).map(x => +x / 255)
              .map(x => x <= 0.03928 ? x / 12.92 : Math.pow((x + 0.055) / 1.055, 2.4));
            return .2126 * v[0] + .7152 * v[1] + .0722 * v[2]; };
          const ratio = (a, b) => { const x = lum(a), y = lum(b); return (Math.max(x, y) + .05) / (Math.min(x, y) + .05); };
          const bg = e => { let n = e, c = getComputedStyle(n).backgroundColor;
            while (c === 'rgba(0, 0, 0, 0)' && n.parentElement) { n = n.parentElement; c = getComputedStyle(n).backgroundColor; }
            return c; };
          const out = {};
          [['name', '.lockbar b'], ['line', '.lockbar > span'], ['button', '.lockbar .lockgo']].forEach(([k, s]) => {
            const e = document.querySelector(s); out[k] = e ? Math.round(ratio(getComputedStyle(e).color, bg(e)) * 100) / 100 : 0; });
          return out; }""")
        ck("the bar reads in %s — %s" % (theme, ink), isinstance(ink, dict) and all(v >= 4.5 for v in ink.values()), ink)
    ev(pg, "() => { if (window.THEME && THEME.set) THEME.set('light'); else document.documentElement.removeAttribute('data-theme'); paint(); }")
    pg.wait_for_timeout(300)
    pg.focus('[data-note="mobile-KO2"]')
    pg.keyboard.type("Share lost to the new entrant in Q3; recovery plan with trade marketing")
    pg.keyboard.press("Tab")
    pg.wait_for_timeout(400)
    s2 = ev(pg, STATE)
    stored = ev(pg, "() => UNITS.mobile.keyObjectives[1].note")
    ck("the note is stored on the row", isinstance(stored, str) and stored.startswith("Share lost"), stored)
    ck("...and the page opens again: nothing held, nothing shut, no bar",
       s2.get("lock") is None and s2.get("shutN") == 0 and s2.get("bar") is None, s2)

    print("── 3 · Enter from the red figure goes to its note")
    ev(pg, "() => { const k = UNITS.mobile.keyObjectives[2]; window.__k3 = { a: k.actual, n: k.note }; delete k.note; paint(); }")
    pg.click('[data-rep="mobile-KO3"]')
    pg.fill('[data-rep="mobile-KO3"]', "900")
    pg.keyboard.press("Enter")
    pg.wait_for_timeout(400)
    s3 = ev(pg, STATE)
    ck("Active merchant reach at 900 against 4,500 holds the page", s3.get("lock") == ["mobile-KO3"], s3)
    ck("...and Enter landed in its note", (s3.get("active") or {}).get("note") == "mobile-KO3", s3.get("active"))
    ev(pg, """() => { const k = UNITS.mobile.keyObjectives[2], w = window.__k3; k.actual = w.a;
      if (w.n !== undefined) k.note = w.n; paint(); }""")

    print("── 4 · Go to it, across pillars")
    made = ev(pg, """() => {
      const u = UNITS.mobile, p2 = u.items[1];
      const m = SMPRules.shown(p2.measures).filter(x => x.dir !== '\u2264' && SMPRules.targetHasNumber(x.target))[0];
      window.__m = { id: m.id, a: m.actual, n: m.note };
      m.actual = '0'; delete m.note;
      RAIL[reportRailKey(u, u.items[0])] = pillarRailId(u.items[0]);
      if (document.activeElement) document.activeElement.blur();
      paint();
      return { id: m.id, name: m.name, red: needsNote({ kind: 'measure', obj: m, id: m.id }) };
    }""")
    ck("a measure on the second pillar is made red", isinstance(made, dict) and made.get("red") is True, made)
    s4 = ev(pg, STATE)
    ck("the first pillar is on screen and every box on it is shut",
       s4.get("lock") == [made.get("id")] and s4.get("openN") == 0 and s4.get("shutN", 0) > 0, s4)
    ck("...the bar names the measure on the other pillar",
       (s4.get("bar") or "").startswith((made.get("name") or "?") + " is off track."), s4.get("bar"))
    ck("...and opening the page with it moved nobody's cursor", s4.get("active") is None, s4.get("active"))
    if pg.query_selector("[data-notego]"):
        pg.click("[data-notego]")
        pg.wait_for_timeout(500)
    s5 = ev(pg, STATE)
    ck("Go to it opens that pillar on the note", (s5.get("active") or {}).get("note") == made.get("id") and
       made.get("id") in (s5.get("open") or []), s5)
    ev(pg, """() => { const w = window.__m, m = UNITS.mobile.items[1].measures.filter(x => x.id === w.id)[0];
      m.actual = w.a; if (w.n !== undefined) m.note = w.n; paint(); }""")

    print("── 5 · a supporting function's report (Finance)")
    fn = ev(pg, """() => {
      const rows = subjectAsked('fn:finance');
      const o = rows.filter(x => x.kind === 'outcome')[0];
      if (!o) return { none: true };
      window.__o = { id: o.id, a: o.obj.actual, n: o.obj.note };
      o.obj.actual = '0'; delete o.obj.note;
      return { id: o.id, red: needsNote(o), may: noteMayWrite('fn:finance', o) };
    }""")
    if isinstance(fn, dict) and fn.get("none"):
        ck("Finance carries an outcome to make red", False, fn)
    else:
        ck("an outcome at nought is red, and the office may write its note",
           fn.get("red") is True and fn.get("may") is True, fn)
        # A function is a destination of its own; opened the way
        # fn-report-gate.py opens one (§222: being on the tab is the mode).
        ev(pg, "() => { current = 'fn:finance'; currentSub = 'report'; REPORTING = 'fn:finance'; paint(); }")
        pg.wait_for_timeout(600)
        s6 = ev(pg, STATE)
        ck("the function's page is held on that outcome", s6.get("lock") == [fn.get("id")], s6)
        ck("...its capability note is open and ringed, everything else shut",
           fn.get("id") in (s6.get("open") or []) and s6.get("ringed") == [fn.get("id")] and s6.get("shutN", 0) > 0, s6)
        ev(pg, """() => { const w = window.__o, x = subjectAsked('fn:finance').filter(r => r.id === w.id)[0];
          x.obj.actual = w.a; if (w.n !== undefined) x.obj.note = w.n; paint(); }""")

    print("── 6 · a unit that plans in objectives and actions")
    ob = ev(pg, """() => {
      /* a unit whose report is still open — a submitted one has no open box
         to hold (section 1), and the demo has submitted several */
      const key = UNIT_KEYS.filter(k => k !== 'mobile' && !reportClosed(k))[0];
      window.__uk = key;
      const u = UNITS[key];
      window.__u = JSON.stringify({ f: u.format, k: u.keyObjectives, a: u.actions });
      u.format = 'objectives';
      u.keyObjectives = [{ id: key + '-KO1', name: 'Online revenue', dir: '\\u2265', target: '100', actual: '10' }];
      u.actions = [];
      const rows = subjectAsked(key);
      const k = rows.filter(x => x.id === key + '-KO1')[0];
      return { key, rows: rows.length, red: k ? needsNote(k) : null, may: k ? noteMayWrite(key, k) : null };
    }""")
    ck("an objective at 10 of 100 is red, and the office may write its note",
       isinstance(ob, dict) and ob.get("red") is True and ob.get("may") is True, ob)
    uk = (ob or {}).get("key") or "?"
    ev(pg, "(k) => { current = k; currentSub = 'report'; REPORTING = k; paint(); }", uk)
    pg.wait_for_timeout(600)
    s7 = ev(pg, STATE)
    ck("its Reporting page is held, with the bar above the tables",
       s7.get("lock") == [uk + "-KO1"] and (s7.get("bar") or "").startswith("Online revenue is off track."), s7)
    ck("...that objective's note open, the rest shut",
       s7.get("open") == [uk + "-KO1"] and s7.get("ringed") == [uk + "-KO1"], s7)
    ev(pg, """() => { const w = JSON.parse(window.__u), u = UNITS[window.__uk];
      if (w.f === undefined) delete u.format; else u.format = w.f;
      u.keyObjectives = w.k; if (w.a === undefined) delete u.actions; else u.actions = w.a; paint(); }""")

    print("── 7 · My reporting, as a tactic's owner who does not run the unit")
    own = ev(pg, """() => {
      GROUP.lineOwners = true;
      const p = { key: 't576', name: 'Line Owner Five', active: true, unit: 'retailstores' };
      PEOPLE.push(p);
      const t = UNITS.mobile.items[0].tactics.filter(x => tacticDue(x))[0];
      t.owner = p.name; delete t.note;
      paint();
      return { key: p.key, tid: t.id, out: !!outcomeOf(t) };
    }""")
    ck("an owner who does not run Mobile is made", isinstance(own, dict) and own.get("key") == "t576", own)
    pg.select_option("#asWho", "t576")
    pg.wait_for_timeout(900)
    tab = pg.query_selector('[data-s="mylines"]')
    ck("My reporting is drawn for them", tab is not None)
    if tab:
        tab.click()
        pg.wait_for_timeout(600)
        heads = ev(pg, "() => [...document.querySelectorAll('#panel table thead th')].map(x => x.textContent.trim())")
        ck("the table carries a Note column", isinstance(heads, list) and "Note" in heads, heads)
        tid = own.get("tid")
        before = ev(pg, "(id) => !!document.querySelector('[data-note=\"' + id + '\"]')", tid)
        ck("no note box while the line is not red", before is False, before)
        pg.click('[data-rep="%s"]' % tid)
        pg.fill('[data-rep="%s"]' % tid, "1")
        pg.keyboard.press("Tab")
        pg.wait_for_timeout(500)
        s8 = ev(pg, STATE)
        ck("a red figure on their own line holds My reporting", s8.get("lock") == [tid], s8)
        ck("...the note box is theirs, ringed, and names the line's unit",
           s8.get("ringed") == [tid] and
           ev(pg, "(id) => (document.querySelector('[data-note=\"' + id + '\"]') || {dataset:{}}).dataset.repu", tid) == "mobile", s8)
        ck("...and the cursor is in it", (s8.get("active") or {}).get("note") == tid, s8.get("active"))
        pg.keyboard.type("Rollout slipped a month")
        pg.keyboard.press("Tab")
        pg.wait_for_timeout(500)
        got = ev(pg, "(id) => { const t = UNITS.mobile.items[0].tactics.filter(x => x.id === id)[0]; return t && t.note; }", tid)
        ck("the note lands on that tactic, in Mobile", got == "Rollout slipped a month", got)
        s9 = ev(pg, STATE)
        ck("...and My reporting opens again", s9.get("lock") is None and s9.get("shutN") == 0, s9)
        still = ev(pg, "(id) => !!document.querySelector('[data-note=\"' + id + '\"]')", tid)
        ck("...with the box still there to correct it", still is True, still)
        # AND A RED ROW THIS PERSON CANNOT EXPLAIN HOLDS NOTHING FOR THEM: the
        # owner does not run Mobile, so a red objective there is the unit's to
        # explain, and locking them out of their own lines for it would be a
        # page shut with no way out.
        nope = ev(pg, """() => { const k = UNITS.mobile.keyObjectives[0], w = { a: k.actual, n: k.note };
          k.actual = '0.1B'; delete k.note;
          const out = { mobile: noteLockOf('mobile', false), mine: noteLockOf(null, true),
                        red: needsNote({ kind: 'objective', obj: k, id: k.id }) };
          k.actual = w.a; if (w.n !== undefined) k.note = w.n;
          return out; }""")
        ck("a red row they cannot explain holds nothing for them",
           isinstance(nope, dict) and nope.get("red") is True and nope.get("mobile") is None and
           nope.get("mine") is None, nope)

    ck("no page error", not errs, errs[:3])
    b.close()

print("\n" + ("note-lock: all passed" if not bad else "%d FAILED" % bad))
raise SystemExit(1 if bad else 0)
