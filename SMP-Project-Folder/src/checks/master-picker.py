"""THE PICKER IS TWO TABLES, SEARCHED, AND DRAGGED BY ITS OWN NUMBERS (§266.10).

Islam, from his own tenant's picker: *"make the everyone who reports searchable
and make it a simple table wiht a nother oclumn of a BU or a FUNC and make the
popup a bit bigger to see more of the units and functions"*, then of the running
order: *"make the right hand side without the up and down arrows just the x to
remove and make the list can be dragged by a handle to rearrange if needed"*,
and *"do you think the handle can be the same as the number?"*

WHAT IS ASSERTED, AND WHY IT IS ASSERTED THAT WAY:

· AGREEMENT, NEVER A LITERAL (§94.8). The Kind column is asserted to agree with
  `boardFunctionTargets()` and the Slides column with `masterCount()`, both read
  in the same run — so a tenant with different subjects, or a deliberate change
  to what a deck holds, stays green while a column that says the wrong thing
  about a row does not.

· THE SEARCH HIDES ROWS IN PLACE AND NEVER REPAINTS (§35, §108.13). Proved by
  identity: the tbody element is the SAME node before and after typing, and the
  number of rows in the DOM does not change — a build that rebuilt the list on
  every keystroke would satisfy every "the right rows are shown" assertion and
  still throw away the box being typed into.

· AND A REPAINT KEEPS THE FILTER, or ticking somebody quietly shows the whole
  list again to a person who believes they are reading their results.

· THE GRIP IS FOCUSABLE. A `display:none` or `visibility:hidden` grip is out of
  the tab order, so the keyboard route to reordering would not exist at all
  (§61) — and it renders identically. Asserted by focusing it and reading back
  what the browser actually focused: the first build of this feature landed on
  the dialog's close button.

· THE SWAP IS HELD THROUGH A REAL DRAG. Measured on the drawing first: with the
  swap driven by `:hover` alone the bars changed six times in a four-row drag,
  half of them landing on a row the pointer was PASSING. So the assertion is
  made at EVERY step of a real pointer drag, and it asks two things — the
  dragged row keeps its bars, and no other row shows any.

· BOTH ENDS (§94.2). The dialog is asserted WIDER than the ordinary one and the
  width asserted GONE again after it closes, because a class left on the shared
  overlay would widen whatever opens next.

EVERY PROBE DEGRADES (§215). On the pre-§266.10 build there is no search box, no
table and no grip, so an undegraded probe would throw and report nothing — which
`grep -c FAIL` reads as a pass, on precisely the build this file exists to see.

Run: python3 checks/master-picker.py   (or via qa-run.py for the bundled
Chromium)
"""
import pathlib
from playwright.sync_api import sync_playwright

ROOT = pathlib.Path(__file__).resolve().parents[3]
FILE = ROOT / "SMP-Project-Folder/src/strategy-management-platform.html"
CHROME = "/opt/pw-browsers/chromium"

ok = bad = 0


def check(what, cond, got=""):
    global ok, bad
    if cond:
        ok += 1
    else:
        bad += 1
        print("  FAIL  %s%s" % (what, ("  --  " + str(got)) if got != "" else ""))


def head(t):
    print("\n" + t)


_said = set()


def ev(pg, expr, arg=None, default=None):
    try:
        return pg.evaluate(expr) if arg is None else pg.evaluate(expr, arg)
    except Exception as e:
        msg = str(e).split("\n")[0]
        if msg not in _said:
            _said.add(msg)
            print("  (threw: %s)" % msg)
        return default


def get(d, k):
    return d.get(k) if isinstance(d, dict) else None


def _rgb(v):
    return [float(x) for x in str(v)[str(v).index("(") + 1:str(v).index(")")].split(",")[:3]]


def _lum(c):
    def f(v):
        v = v / 255.0
        return v / 12.92 if v <= 0.03928 else ((v + 0.055) / 1.055) ** 2.4
    return 0.2126 * f(c[0]) + 0.7152 * f(c[1]) + 0.0722 * f(c[2])


def ratio(fg, bg):
    try:
        a, b = _lum(_rgb(fg)), _lum(_rgb(bg))
    except Exception:
        return 0
    hi, lo = max(a, b), min(a, b)
    return round((hi + 0.05) / (lo + 0.05), 2)


def typed(pg, sel, text):
    """§215: `pg.fill` on a box that is not there THROWS, and a check that dies
    reports nothing — which `grep -c FAIL` reads as a pass, on exactly the build
    with no search box. The first run of this file against the pre-§266.10 build
    ended in a 30s timeout with five sections unmade."""
    try:
        pg.fill(sel, text, timeout=2500)
        pg.wait_for_timeout(200)
        return True
    except Exception as e:
        msg = str(e).split("\n")[0]
        if msg not in _said:
            _said.add(msg)
            print("  (could not type into %s: %s)" % (sel, msg))
        return False


def press(pg, key):
    try:
        pg.keyboard.press(key)
        pg.wait_for_timeout(300)
        return True
    except Exception:
        return False


def openpicker(pg):
    """Through the platform's own control wherever it can be, and by name if
    the dialog is already open — never by assigning state."""
    ev(pg, "() => { if (typeof closeModal === 'function') closeModal(); }")
    pg.wait_for_timeout(150)
    ev(pg, "() => masterOpen()")
    pg.wait_for_timeout(450)
    return ev(pg, "() => !!document.querySelector('#modal-b .mflow')", None, False)


with sync_playwright() as p:
    b = p.chromium.launch(executable_path=CHROME,
                          args=["--no-sandbox", "--disable-dev-shm-usage"])
    pg = b.new_page(viewport={"width": 1500, "height": 1000})
    errs = []
    pg.on("pageerror", lambda e: errs.append(str(e)))
    pg.add_init_script("try{sessionStorage.setItem('smp.welcome.seen','1');"
                       "localStorage.setItem('smp.tour.never','1')}catch(e){}")
    pg.goto(FILE.as_uri())
    pg.wait_for_timeout(1500)

    # ══ 1 · TWO TABLES, AND A DIALOG WIDE ENOUGH TO HOLD THEM ══════════
    head("1 · The dialog is two tables, and it is wider than the rest")
    check("the picker opens", openpicker(pg) is True)
    shape = ev(pg, """() => {
      const m = document.querySelector('.overlay .modal');
      const tb = [...document.querySelectorAll('#modal-b .mftbl')];
      const heads = tb.map(t => [...t.tHead.rows[0].cells].map(c => c.textContent.trim()));
      return {
        width: m ? Math.round(m.getBoundingClientRect().width) : null,
        marked: document.getElementById('overlay').classList.contains('mflow-on'),
        tables: tb.length,
        heads: heads,
        find: document.querySelectorAll('#modal-b .mffind').length,
        arrows: document.querySelectorAll('#modal-b [data-mfmove]').length,
        fits: tb.every(t => t.parentNode.scrollWidth <= t.parentNode.clientWidth),
        // [clipped-with-no-title, unclipped-but-titled] — both must be nought,
        // or the hover is either missing where it is needed or stealing the
        // pointer where it is not (§88, §93.6).
        titles: (() => { const c = [...document.querySelectorAll('#modal-b .mftbl .c-nm')];
          return [c.filter(t => t.scrollWidth > t.clientWidth + 1 && !t.title).length,
                  c.filter(t => t.scrollWidth <= t.clientWidth + 1 && t.title).length]; })(),
        onScreen: (() => { const g = document.querySelector('#modal-b .mfgo');
          if (!g) return false; const r = g.getBoundingClientRect();
          return r.bottom <= window.innerHeight && r.top > 0; })()
      };
    }""", None, {})
    check("two tables, one per column", get(shape, "tables") == 2, shape)
    check("both name their columns the same way",
          get(shape, "heads") and
          [c for c in (get(shape, "heads") or [[]])[0] if c] == ["Name", "Kind", "Slides"] and
          [c for c in (get(shape, "heads") or [[], []])[1] if c] == ["Name", "Kind", "Slides"],
          get(shape, "heads"))
    check("one search box, on the waiting column", get(shape, "find") == 1, shape)
    check("the up and down arrows are gone (§266.10)", get(shape, "arrows") == 0, shape)
    check("the dialog is wider than the 940px every other one gets",
          (get(shape, "width") or 0) > 940, get(shape, "width"))
    check("...and the width is marked on the OVERLAY, not on .modal (§122)",
          get(shape, "marked") is True, shape)
    check("neither table runs past its own column (§158)",
          get(shape, "fits") is True, shape)
    check("a name too long for its column is one hover away, and only then (§88)",
          get(shape, "titles") == [0, 0], get(shape, "titles"))
    check("and Start the flow is still on screen (§90)",
          get(shape, "onScreen") is True, shape)

    # ══ 2 · THE COLUMNS SAY WHAT THE PRODUCT SAYS ══════════════════════
    head("2 · Kind and Slides agree with the rules they are read from (§94.8)")
    agree = ev(pg, """() => {
      const fns = boardFunctionTargets();
      const rows = [...document.querySelectorAll('#modal-b [data-mfflow] tr[data-oi]')];
      const want = MFLOW.pick.slice();
      return {
        kinds: rows.map(r => r.querySelector('.mfkind').textContent.trim()),
        wantKinds: want.map(t => fns.indexOf(t) >= 0 ? 'FUNC' : 'BU'),
        slides: rows.map(r => +r.cells[3].textContent.trim()),
        wantSlides: want.map(t => masterCount(t)),
        names: rows.map(r => r.cells[1].textContent.trim()),
        wantNames: want.map(t => placeLabel(t)),
        anyFn: want.some(t => fns.indexOf(t) >= 0)
      };
    }""", None, {})
    check("the Kind column agrees with the board's own function list",
          get(agree, "kinds") == get(agree, "wantKinds") and get(agree, "kinds"), agree)
    check("...and there is at least one of each, or the agreement proves nothing",
          get(agree, "anyFn") is True and "BU" in (get(agree, "kinds") or []), agree)
    check("the Slides column agrees with the deck's own count",
          get(agree, "slides") == get(agree, "wantSlides") and get(agree, "slides"), agree)
    check("the names are the navigation's own (placeLabel)",
          get(agree, "names") == get(agree, "wantNames"), agree)

    # ══ 3 · THE SEARCH ═════════════════════════════════════════════════
    head("3 · The search hides rows in place, and matches the code as well")
    # take five out so the waiting column has something in it: a search over an
    # empty list passes every assertion about what it shows (§113.8).
    made = ev(pg, """() => {
      const out = MFLOW.pick.slice(0, 5);
      out.forEach(t => { const b = document.querySelector('[data-mftick="' + t + '"]');
                         if (b) b.click(); });
      const rows = [...document.querySelectorAll('#modal-b tr[data-mfrest]')];
      return { waiting: rows.length,
               names: rows.map(r => r.cells[1].textContent.trim()),
               codes: out.map(t => deckCode(t, placeLabel(t))) };
    }""", None, {})
    check("five taken out are five waiting", get(made, "waiting") == 5, made)
    code = (get(made, "codes") or [""])[0]
    name = (get(made, "names") or [""])[0]
    tbid = ev(pg, """() => { const t = document.querySelector('#modal-b .mftbl tbody');
      if (t) t.__probe = 1; return !!t; }""", None, False)
    typed(pg, "#modal-b .mffind", code)
    bycode = ev(pg, """(n) => {
      const rows = [...document.querySelectorAll('#modal-b tr[data-mfrest]')];
      return { inDom: rows.length,
               shown: rows.filter(r => !r.hidden).map(r => r.cells[1].textContent.trim()),
               same: !!document.querySelector('#modal-b .mftbl tbody').__probe,
               count: (document.querySelector('#modal-b [data-mfrestcount]') || {}).textContent,
               box: (document.querySelector('#modal-b .mffind') || {}).value };
    }""", name, {})
    check("the code finds the subject (§266.9's own letters)",
          get(bycode, "shown") == [name] and code, {"code": code, "got": bycode})
    check("...and it hides in place: every row is still in the DOM",
          get(bycode, "inDom") == 5, bycode)
    check("...and NEVER repaints — the same tbody node (§35)",
          get(bycode, "same") is True, bycode)
    check("the count says how many of how many",
          "of 5" in str(get(bycode, "count")), bycode)
    typed(pg, "#modal-b .mffind", "zzzznothing")
    miss = ev(pg, """() => { const e = document.querySelector('#modal-b [data-mfrestempty]');
      return { hidden: e ? e.hidden : null, say: e ? e.textContent : null,
               shown: [...document.querySelectorAll('#modal-b tr[data-mfrest]')]
                        .filter(r => !r.hidden).length }; }""", None, {})
    check("nothing matching says so, and says what was typed (§105)",
          get(miss, "hidden") is False and "zzzznothing" in str(get(miss, "say")) and
          get(miss, "shown") == 0, miss)
    # A REPAINT KEEPS THE FILTER (§108.13)
    typed(pg, "#modal-b .mffind", code)
    kept = ev(pg, """() => {
      const t = MFLOW.pick[0];
      document.querySelector('#modal-b .mfx').click();
      const rows = [...document.querySelectorAll('#modal-b tr[data-mfrest]')];
      return { q: MFLOW.q, box: document.querySelector('#modal-b .mffind').value,
               shown: rows.filter(r => !r.hidden).length, inDom: rows.length };
    }""", None, {})
    check("a repaint keeps the filter (§108.13)",
          get(kept, "box") == code and get(kept, "inDom") == 6 and
          get(kept, "shown") == 1, kept)
    typed(pg, "#modal-b .mffind", "")

    # ══ 4 · ONE ACT, TWO COLUMNS ═══════════════════════════════════════
    head("4 · The tick and the × are the same act (§53.5)")
    same = ev(pg, """() => {
      const t = document.querySelector('#modal-b .mftick');
      const x = document.querySelector('#modal-b .mfx');
      return { tick: t ? t.getAttribute('data-mftick') : null,
               x: x ? x.getAttribute('data-mftick') : null,
               tickIsFor: t ? t.getAttribute('aria-label') : null,
               xIsFor: x ? x.getAttribute('aria-label') : null };
    }""", None, {})
    check("both are drawn from data-mftick", bool(get(same, "tick")) and bool(get(same, "x")), same)
    check("...and each says which subject it is for",
          "into the flow" in str(get(same, "tickIsFor")) and
          "out of the flow" in str(get(same, "xIsFor")), same)
    ret = ev(pg, """() => {
      const t = document.querySelector('#modal-b .mftick').getAttribute('data-mftick');
      document.querySelector('#modal-b .mftick').click();
      return { back: MFLOW.pick.indexOf(t) >= 0, last: MFLOW.pick[MFLOW.pick.length - 1] === t,
               stored: JSON.stringify(GROUP.masterFlow || []) === JSON.stringify(MFLOW.pick) };
    }""", None, {})
    check("a tick puts a subject back, at the end of the flow", get(ret, "last") is True, ret)
    check("...and the stored order is what the screen shows",
          get(ret, "stored") is True, ret)

    # ══ 5 · THE NUMBER IS THE HANDLE ═══════════════════════════════════
    head("5 · The number is the handle, and the handle can be reached")
    rest = ev(pg, """() => {
      const td = document.querySelector('#modal-b td.mfh');
      if (!td) return null;
      const g = td.querySelector('.grip'), n = td.querySelector('.idx-n');
      const cs = getComputedStyle(g);
      return { number: n ? n.textContent.trim() : null,
               numVis: n ? getComputedStyle(n).visibility : null,
               gripOpacity: +cs.opacity, gripDisplay: cs.display,
               numbers: [...document.querySelectorAll('#modal-b .idx-n')].map(x => x.textContent.trim()) };
    }""", None, {})
    check("at rest the number is what is drawn",
          get(rest, "numVis") == "visible" and get(rest, "gripOpacity") == 0, rest)
    check("...and the numbers run 1..n", get(rest, "numbers") ==
          [str(i + 1) for i in range(len(get(rest, "numbers") or []))] and
          get(rest, "numbers"), get(rest, "numbers"))
    cell = ev(pg, """() => { const r = document.querySelector('#modal-b td.mfh').getBoundingClientRect();
      return { x: r.x + r.width / 2, y: r.y + r.height / 2, w: Math.round(r.width) }; }""", None, None)
    check("the handle column is a column, not the width of the table",
          0 < (get(cell, "w") or 999) <= 60, cell)
    if cell:
        pg.mouse.move(cell["x"], cell["y"])
        pg.wait_for_timeout(150)
        hov = ev(pg, """() => { const td = document.querySelector('#modal-b td.mfh');
          const g = td.querySelector('.grip'), n = td.querySelector('.idx-n');
          return { grip: +getComputedStyle(g).opacity, num: getComputedStyle(n).visibility,
                   bars: g.querySelectorAll('i').length }; }""", None, {})
        check("pointing at the cell swaps the digit for the platform's own bars",
              get(hov, "grip") == 1 and get(hov, "num") == "hidden" and get(hov, "bars") == 3, hov)
    focused = ev(pg, """() => {
      const g = document.querySelector('#modal-b td.mfh .grip');
      if (!g) return null;
      g.focus();
      return { isGrip: document.activeElement === g,
               role: g.getAttribute('role'), tab: g.getAttribute('tabindex'),
               label: g.getAttribute('aria-label') };
    }""", None, {})
    check("the grip can actually be focused (§61 — display:none is unreachable)",
          get(focused, "isGrip") is True, focused)
    check("...and it says what it is",
          get(focused, "role") == "button" and get(focused, "tab") == "0" and
          "reorder" in str(get(focused, "label")).lower(), focused)

    # ══ 6 · A REAL DRAG, AND THE SWAP HELD THROUGH IT ══════════════════
    head("6 · A real pointer drag reorders it — and the bars never leave the row")
    before = ev(pg, "() => MFLOW.pick.slice()", None, [])
    src = ev(pg, """() => { const rs = document.querySelectorAll('#modal-b [data-mfflow] tr[data-oi]');
      const c = rs[4] && rs[4].querySelector('td.mfh');
      if (!c) return null; const r = c.getBoundingClientRect();
      return { x: r.x + r.width / 2, y: r.y + r.height / 2 }; }""", None, None)
    dst = ev(pg, """() => { const r = document.querySelector('#modal-b [data-mfflow] tr[data-oi]')
        .getBoundingClientRect(); return { x: r.x + 20, y: r.y + 3 }; }""", None, None)
    states = []
    # Nothing may hold the focus first: a focused grip legitimately shows its
    # bars, and this section asserts that NO other row does — so leaving the
    # focus where §5 put it would report a correct build broken (§68.10).
    ev(pg, "() => { if (document.activeElement && document.activeElement.blur) "
           "document.activeElement.blur(); }")
    if src and dst:
        pg.mouse.move(src["x"], src["y"])
        # THE BARS FADE, SO THE PROBE SETTLES FIRST. `.grip` carries a 120ms
        # opacity transition (arrange.css), so a row the pointer left a moment
        # ago is still measurably lit — the first run of this section reported
        # a row that had no hover, no focus and no reason to be lit except that
        # it was still on its way out (§68.10: a correct build reported broken).
        pg.wait_for_timeout(250)
        pg.mouse.down()
        for k in range(1, 25):
            pg.mouse.move(src["x"] + (dst["x"] - src["x"]) * k / 24.0,
                          src["y"] + (dst["y"] - src["y"]) * k / 24.0)
            states.append(ev(pg, """() => {
              const d = document.querySelector('#modal-b tr.dragging');
              if (!d) return 'no dragging row';
              const g = d.querySelector('td.mfh .grip'), n = d.querySelector('.idx-n');
              const others = [...document.querySelectorAll('#modal-b [data-mfflow] tr[data-oi]')]
                .filter(r => r !== d)
                .filter(r => +getComputedStyle(r.querySelector('.grip')).opacity > 0).length;
              const who = [...document.querySelectorAll('#modal-b [data-mfflow] tr[data-oi]')]
                .filter(r => r !== d)
                .filter(r => +getComputedStyle(r.querySelector('.grip')).opacity > 0)
                .map(r => r.cells[1].textContent.trim() + '[' +
                     (r.querySelector('td.mfh').matches(':hover') ? 'hover' : '') +
                     (r.matches(':hover') ? '+rowhover' : '') +
                     (r.querySelector('td.mfh').matches(':focus-within') ? '+focus' : '') + ']');
              return (+getComputedStyle(g).opacity === 1 ? 'bars' : 'DIGIT') + '/' +
                     getComputedStyle(n).visibility + '/' + (who.length ? who.join('+') : '0');
            }""", None, "(threw)"))
        pg.mouse.up()
        pg.wait_for_timeout(350)
    check("the drag starts at all", "no dragging row" not in states and states, set(states))
    check("the dragged row keeps its bars at EVERY step of the drag",
          set(states) == {"bars/hidden/0"}, sorted(set(states)))
    after = ev(pg, """() => ({ pick: MFLOW.pick.slice(),
      stored: GROUP.masterFlow || null,
      numbers: [...document.querySelectorAll('#modal-b .idx-n')].map(x => x.textContent.trim()) })""",
               None, {})
    check("the drag moved the row it was holding",
          get(after, "pick") != before and
          (get(after, "pick") or [None])[0] == (before[4] if len(before) > 4 else "?"),
          {"before": before[:6], "after": (get(after, "pick") or [])[:6]})
    check("...and the flow is still every subject it was, none lost or doubled (§118)",
          sorted(get(after, "pick") or []) == sorted(before) and before, after)
    check("...and it is written, so the screen and the store agree",
          get(after, "stored") == get(after, "pick"), after)
    check("...and the numbers were renumbered",
          get(after, "numbers") ==
          [str(i + 1) for i in range(len(get(after, "numbers") or []))], after)

    # ══ 7 · THE KEYBOARD MOVES A ROW, AND KEEPS IT ═════════════════════
    head("7 · The keyboard moves a row and the focus follows it")
    first = ev(pg, "() => MFLOW.pick[0]", None, None)
    ev(pg, "() => { const g = document.querySelector('#modal-b [data-mfflow] .grip'); if (g) g.focus(); }")
    press(pg, "ArrowDown")
    kb = ev(pg, """(f) => {
      const rows = [...document.querySelectorAll('#modal-b [data-mfflow] tr[data-oi]')];
      const a = document.activeElement;
      return { at: MFLOW.pick.indexOf(f),
               stored: JSON.stringify(GROUP.masterFlow || []) === JSON.stringify(MFLOW.pick),
               focusRow: a && a.classList.contains('grip') ? rows.indexOf(a.closest('tr')) : -1 };
    }""", first, {})
    check("ArrowDown moves the row one place later", get(kb, "at") == 1, kb)
    check("...the focus follows it, so the next press moves the same row",
          get(kb, "focusRow") == 1, kb)
    check("...and it is written", get(kb, "stored") is True, kb)
    press(pg, "ArrowUp")
    check("ArrowUp brings it back", ev(pg, "(f) => MFLOW.pick.indexOf(f)", first, -1) == 0)

    # ══ 8 · CONTRAST, AND THE WIDTH GOING AWAY AGAIN ═══════════════════
    head("8 · Read in both themes, and the dialog gives its width back")
    for theme in ("light", "dark"):
        ev(pg, "(t) => document.documentElement.setAttribute('data-theme', t)", theme)
        pg.wait_for_timeout(200)
        inks = ev(pg, """() => {
          const pick = (sel) => { const e = document.querySelector(sel); if (!e) return null;
            let g = e, bg = getComputedStyle(g).backgroundColor;
            while (g && (bg === 'rgba(0, 0, 0, 0)' || bg === 'transparent')) {
              g = g.parentElement; if (!g) break; bg = getComputedStyle(g).backgroundColor; }
            return [getComputedStyle(e).color, bg]; };
          return { kind: pick('#modal-b .mfkind.fn'), num: pick('#modal-b .idx-n'),
                   count: pick('#modal-b .mfcount'), head: pick('#modal-b .mftbl thead th') };
        }""", None, {})
        for what in ("kind", "num", "count", "head"):
            pair = get(inks, what)
            r = ratio(pair[0], pair[1]) if pair else 0
            check("%s · the %s reads at 4.5:1" % (theme, what), r >= 4.5, "%s %s" % (r, pair))
    ev(pg, "() => document.documentElement.removeAttribute('data-theme')")
    closed = ev(pg, """() => { closeModal();
      return { marked: document.getElementById('overlay').classList.contains('mflow-on'),
               width: Math.round(document.querySelector('.overlay .modal').getBoundingClientRect().width) };
    }""", None, {})
    check("closing takes the extra width off the shared overlay",
          get(closed, "marked") is False, closed)

    check("no page errors", not errs, errs)
    b.close()

print("\n%d passed, %d failed" % (ok, bad))
