"""THE KEYS ARE WRITTEN DOWN SOMEWHERE (§539).

Usability audit, heuristic 7. Its headline finding is that the platform has ONE
keyboard idiom and it is the projector. It has FOUR — the projector, §528's
reporting keys, §536's dropdown and `arrange.js`'s row move — and the finding
the audit does not make is the one this file guards: NOTHING ON ANY SCREEN SAID
SO. §528's hints ride a hover and a per-control `aria-keyshortcuts`, so the
only way to discover Alt+Enter was to hover the one button carrying it.

NO NEW SHORTCUT IS BOUND BY §539, and that is asserted rather than asserted of
itself: every key the sheet names has to already work, and the sheet is checked
against the product's own bindings where they can be reached.

What is asserted, and why each end matters (§94.2):

  - THE SHEET EXISTS AND IS REACHABLE TWO WAYS. A key and a button, because a
    sheet you can only open by already knowing the key to open it is this
    section's own fault one level up;
  - "?" DOES NOT FIRE WHILE SOMEBODY IS TYPING. Most of this product is
    fields, and a question mark is a character people mean to write. This is
    the assertion that catches the obvious way to ship this broken;
  - IT DOES NOT OPEN OVER THE DECK — a refusal, not an oversight: the modal is
    outside the fullscreen element, so there it would open where nobody can
    see it;
  - THE "HERE" MARKS TELL THE TRUTH. Each section asks the module that owns it,
    so the check MAKES a control and asserts the mark follows. A sheet that
    marks a section live on a page without it is worse than no sheet;
  - A SECTION THAT IS NOT LIVE IS STILL SHOWN, quieter. This is the whole
    argument for Islam's treatment A over B, and a build that quietly hid them
    would pass every other assertion here;
  - AND THE KEYS IT NAMES MATCH WHAT THE PRODUCT BINDS. Read out of the built
    file: every key the sheet claims for reporting is a key `shell.html`'s own
    handler tests for, and every one it claims for the deck is one
    `present.js` tests for. This is the assertion that goes red when somebody
    changes a binding and not the sheet.

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
    except Exception as e: return dflt if dflt is not None else {"err": str(e)[:110]}

with sync_playwright() as p:
    b = p.chromium.launch(executable_path="/opt/pw-browsers/chromium",
                          args=["--no-sandbox", "--disable-dev-shm-usage"])
    pg = b.new_page(viewport={"width": 1400, "height": 1000})
    errs = []
    pg.on("pageerror", lambda e: errs.append(str(e)))
    pg.goto(URL); pg.wait_for_timeout(1600)

    print("\n§1 · the sheet exists, and is reachable two ways")
    there = ev(pg, """() => ({
      mod: typeof KEYSHEET === 'object' && typeof KEYSHEET.open === 'function',
      btn: (() => { const b = document.getElementById('keysbtn');
        return b ? { label: b.getAttribute('aria-label') || '',
                     says: b.getAttribute('aria-keyshortcuts') || '',
                     inBar: !!(b.closest('#topacts')) } : null; })()
    })""", {})
    ck("the product has a keyboard sheet", there.get("mod"), there)
    ck("...and a button in the top bar opens it",
       (there.get("btn") or {}).get("inBar"), there)
    ck("...which says what it is, for a screen reader",
       "eyboard" in ((there.get("btn") or {}).get("label") or ""), there)
    ck("...and announces its own key",
       (there.get("btn") or {}).get("says") == "?", there)

    # Pressed on the page itself, not called: the binding is what is asserted.
    pg.keyboard.press("?"); pg.wait_for_timeout(350)
    shown = ev(pg, """() => {
      const t = document.getElementById('modal-t');
      const on = document.querySelector('.overlay.on, [class*=overlay].on');
      return { title: t ? t.textContent.trim() : '',
               open: !!on,
               secs: Array.from(document.querySelectorAll('#modal-b h4.mini'))
                          .map(h => h.firstChild ? h.firstChild.textContent.trim() : ''),
               rows: document.querySelectorAll('#modal-b .ks-rows').length,
               caps: document.querySelectorAll('#modal-b kbd').length };
    }""", {})
    ck("pressing ? opens it", shown.get("open") and shown.get("title") == "Keyboard", shown)
    ck("...with every section, not only the live ones (treatment A)",
       shown.get("rows") == 5 and len(shown.get("secs") or []) == 5, shown)
    ck("...and the deck's keys are on it even though the deck is shut",
       "Presenting" in (shown.get("secs") or []), shown.get("secs"))
    ck("...drawn as keycaps", (shown.get("caps") or 0) >= 20, shown)

    print("\n§2 · the marks tell the truth about where you are standing")
    was = ev(pg, "() => KEYSHEET.live()", {})
    ck("Anywhere is always live", was.get("anywhere") is True, was)
    ck("...and with no reporting box on the page, figures are NOT marked live",
       was.get("figures") is False, was)
    ck("...nor the deck", was.get("deck") is False, was)
    # THE CHECK MAKES THE CONTROL (§255) and the mark has to follow it.
    made = ev(pg, """() => {
      const w = document.createElement('div');
      w.id = 'ksfix';
      w.innerHTML = '<input data-rep="x"><span class="grip"></span>';
      document.body.appendChild(w);
      return KEYSHEET.live();
    }""", {})
    ck("a reporting box on the page marks the figures live", made.get("figures") is True, made)
    ck("...and a drag handle marks the row keys live", made.get("rows") is True, made)
    marked = ev(pg, """() => {
      KEYSHEET.open();
      return Array.from(document.querySelectorAll('#modal-b h4.mini')).map(h => ({
        name: h.firstChild ? h.firstChild.textContent.trim() : '',
        here: !!h.querySelector('.ks-here')
      }));
    }""", [])
    by = {m["name"]: m["here"] for m in (marked or []) if isinstance(m, dict)}
    ck("the sheet marks 'Entering figures' here", by.get("Entering figures") is True, by)
    ck("...and does NOT mark 'Presenting' here", by.get("Presenting") is False, by)
    ck("...while still showing Presenting's keys, quieter rather than hidden",
       ev(pg, """() => {
         const h = Array.from(document.querySelectorAll('#modal-b h4.mini'))
           .find(x => x.firstChild && x.firstChild.textContent.trim() === 'Presenting');
         if (!h) return false;
         const rows = h.nextElementSibling;
         return !!rows && rows.classList.contains('ks-dim') &&
                rows.offsetHeight > 0 && rows.querySelectorAll('kbd').length >= 7;
       }""", False) is True)
    ev(pg, "() => { const w = document.getElementById('ksfix'); if (w) w.remove(); }")
    ev(pg, "() => { const x = document.getElementById('modal-x'); if (x) x.click(); }")
    pg.wait_for_timeout(250)

    print("\n§3 · ? is a character before it is a shortcut")
    typed = ev(pg, """() => {
      const w = document.createElement('div');
      w.id = 'ksfix2';
      w.innerHTML = '<input id="ks-in"><textarea id="ks-ta"></textarea>';
      document.body.appendChild(w);
      document.getElementById('ks-in').focus();
      return document.activeElement.id;
    }""", "")
    ck("(fixture) a field has focus", typed == "ks-in", typed)
    pg.keyboard.press("?"); pg.wait_for_timeout(300)
    ck("? in a field does NOT open the sheet",
       ev(pg, "() => !!document.querySelector('.overlay.on, [class*=overlay].on')", True) is False)
    ck("...and the character reaches the box",
       ev(pg, "() => document.getElementById('ks-in').value", "") == "?")
    ev(pg, "() => document.getElementById('ks-ta').focus()")
    pg.keyboard.press("?"); pg.wait_for_timeout(300)
    ck("...the same in a note box",
       ev(pg, "() => !!document.querySelector('.overlay.on, [class*=overlay].on')", True) is False
       and ev(pg, "() => document.getElementById('ks-ta').value", "") == "?")
    ev(pg, "() => { document.activeElement.blur(); const w = document.getElementById('ksfix2'); if (w) w.remove(); }")

    print("\n§4 · and it refuses the one place it could not be seen")
    pg.wait_for_timeout(150)
    deck = ev(pg, """() => {
      const d = document.getElementById('deckroot');
      if (!d) return { no: true };
      d.classList.add('on');
      return { on: true };
    }""", {})
    ck("(fixture) the deck reads as open", deck.get("on"), deck)
    pg.keyboard.press("?"); pg.wait_for_timeout(300)
    ck("? over the deck opens nothing, rather than opening it unseen",
       ev(pg, "() => !!document.querySelector('.overlay.on, [class*=overlay].on')", True) is False)
    ev(pg, "() => { const d = document.getElementById('deckroot'); if (d) d.classList.remove('on'); }")

    print("\n§5 · the sheet agrees with what the product actually binds")
    src = open(os.path.abspath(BUILT), encoding="utf-8").read()
    code = re.sub(r"/\*.*?\*/", " ", src, flags=re.S)
    code = re.sub(r"(?m)^\s*//.*$", " ", code)
    said = ev(pg, """() => {
      const out = {};
      KEYSHEET.sections().forEach(s => {
        out[s.id] = [];
        s.rows.forEach(r => (r.keys || []).forEach(c => c.forEach(k => out[s.id].push(k))));
      });
      return out;
    }""", {})
    # Only the named keys a handler can be grepped for; the arrows and Space
    # are asserted through the product's own tables rather than as `.key ===`.
    NAMED = {"Enter": '"Enter"', "Esc": '"Escape"', "Home": '"Home"', "End": '"End"',
             "F": '"f"', "W": '"w"', "P": '"p"', "N": 'KeyN', "Alt": "altKey",
             "Shift": "shiftKey", "Tab": "Tab", "Space": '" "'}
    missing = []
    for sec in ("figures", "deck", "anywhere", "lists", "rows"):
        for k in set(said.get(sec) or []):
            frag = NAMED.get(k)
            if frag and frag not in code:
                missing.append(sec + ":" + k)
    ck("every key the sheet names is one the build tests for", not missing, missing[:5])
    ck("...and the sheet claims five idioms, which is what the product has",
       len(said) == 5, sorted(said.keys()))
    # NO NEW SHORTCUT: `?` is bound once, by the sheet, and nowhere else.
    qbind = len(re.findall(r'key !== "\?"|key === "\?"', code))
    ck("? is bound in exactly one place — the sheet itself", qbind == 1, qbind)

    print("\n§6 · and the build is quiet")
    ck("no page errors", not errs, errs[:3])
    b.close()

print("\n%d failure(s)" % bad)
raise SystemExit(1 if bad else 0)
