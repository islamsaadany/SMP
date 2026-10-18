"""THREE ACTIONS, FROM THE KEYBOARD (§545).

Usability audit, heuristic 7: "no accelerator for Submit, Save draft, or the
pen". §544 answered the navigation half with the arrows every row of tabs
already promised. This half had NO standard to follow — somebody had to pick
the keys, and Islam picked Alt+S, Alt+D, Alt+E.

What is asserted, and why each end matters (§94.2):

  - THE MATCH IS ON THE PHYSICAL KEY, never on the character. On a Mac,
    Option+S is "ß" and `e.key` says so; §528 learned this on Alt+N and this
    reuses the answer rather than rediscovering it. Asserted over the built
    file, because a build that matched `e.key` would pass every behavioural
    assertion below on this machine and fail for every Mac;
  - SUBMIT JUMPS AND DOES NOT SEND. Islam's own answer, and the assertion that
    matters most here: after Alt+S the report must NOT be submitted. A build
    that sent on one key would pass "the key does something";
  - ...AND THE OTHER TWO ACT, because a draft and the pen never leave your own
    screen. Both halves asserted, so neither can drift into the other;
  - A HELD CONTROL IS NOT PRESSED BY A KEY EITHER. §538 holds a control that
    cannot act and says why; a shortcut that clicked straight through would be
    the one way round a refusal the rest of the product enforces. The key
    lands on it instead — and on a held Submit that OPENS the reason, because
    §538's bubble opens on focus;
  - NOTHING FIRES WHILE SOMEBODY IS TYPING. Alt+S in a note must leave the
    note alone;
  - and the keys SAY THEMSELVES on the controls they belong to, so somebody
    who never opens the sheet still meets them (§528's rule).

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

print("\n§1 · the physical key, not the character — the Mac half")
src = open(os.path.abspath(BUILT), encoding="utf-8").read()
code = re.sub(r"/\*.*?\*/", " ", src, flags=re.S)
code = re.sub(r"(?m)^\s*//.*$", " ", code)
for letter in ("KeyS", "KeyD", "KeyE"):
    ck("Alt+%s is matched on the physical key" % letter[-1], ('"%s"' % letter) in code, letter)
# A build that reached for the character instead would work here and nowhere else.
ck("...and none of the three is matched on the character it types",
   not re.search(r'altKey[^;{}]{0,80}key === "[sde]"', code, re.I), "found a character match")

with sync_playwright() as p:
    b = p.chromium.launch(executable_path="/opt/pw-browsers/chromium",
                          args=["--no-sandbox", "--disable-dev-shm-usage"])
    pg = b.new_page(viewport={"width": 1400, "height": 1000})
    errs = []
    pg.on("pageerror", lambda e: errs.append(str(e)))
    pg.goto(URL); pg.wait_for_timeout(1700)

    print("\n§2 · Submit jumps, and does NOT send")
    # THE CHECK MAKES THE CONTROLS (§255): all three sit behind a page, a grant
    # and a cycle. What is asserted is what the KEYS do to the shapes the
    # product draws, so the shapes are drawn here from its own selectors.
    made = ev(pg, """() => {
      const old = document.getElementById('akfix'); if (old) old.remove();
      const w = document.createElement('div');
      w.id = 'akfix';
      w.style.cssText = 'position:fixed;left:20px;top:20px;z-index:99';
      w.innerHTML =
        '<button class="rc-submit" data-submit="mob" id="ak-sub">Submit to the SMO</button>' +
        '<button class="rc-draft" data-repsave="1" id="ak-draft">Save draft</button>' +
        '<button class="penbtn" data-page="plan" id="ak-pen">pen</button>';
      document.body.appendChild(w);
      window.__ak = { sub: 0, draft: 0, pen: 0 };
      document.getElementById('ak-sub').addEventListener('click', () => window.__ak.sub++);
      document.getElementById('ak-draft').addEventListener('click', () => window.__ak.draft++);
      document.getElementById('ak-pen').addEventListener('click', () => window.__ak.pen++);
      document.body.focus();
      return !!document.getElementById('ak-sub');
    }""", False)
    ck("(fixture) the three controls are on the page", made is True, made)

    pg.keyboard.press("Alt+KeyS"); pg.wait_for_timeout(200)
    st = ev(pg, "() => ({ on: document.activeElement.id, acts: window.__ak })", {})
    ck("Alt+S lands ON Submit", st.get("on") == "ak-sub", st)
    ck("...and does NOT send it — the whole point of Islam's answer",
       (st.get("acts") or {}).get("sub") == 0, st)

    print("\n§3 · ...and the other two act, because they never leave your screen")
    pg.keyboard.press("Alt+KeyD"); pg.wait_for_timeout(200)
    ck("Alt+D saves the draft", ev(pg, "() => window.__ak.draft", 0) == 1,
       ev(pg, "() => window.__ak", {}))
    pg.keyboard.press("Alt+KeyE"); pg.wait_for_timeout(200)
    ck("Alt+E works the pen", ev(pg, "() => window.__ak.pen", 0) == 1,
       ev(pg, "() => window.__ak", {}))

    print("\n§4 · a held control is not pressed by a key either (§538)")
    ev(pg, """() => {
      window.__ak = { sub: 0, draft: 0, pen: 0 };
      const d = document.getElementById('ak-draft');
      d.setAttribute('aria-disabled', 'true');
      d.classList.add('hasnote');
      d.setAttribute('data-tip', 'Nothing has changed yet');
      document.body.focus();
    }""")
    pg.keyboard.press("Alt+KeyD"); pg.wait_for_timeout(200)
    after = ev(pg, "() => ({ on: document.activeElement.id, acts: window.__ak })", {})
    ck("a held Save draft is not pressed", (after.get("acts") or {}).get("draft") == 0, after)
    ck("...the key lands on it instead, so its reason can be read",
       after.get("on") == "ak-draft", after)

    print("\n§5 · and nothing fires while somebody is typing")
    ev(pg, """() => {
      window.__ak = { sub: 0, draft: 0, pen: 0 };
      const t = document.createElement('textarea');
      t.id = 'ak-note';
      document.getElementById('akfix').appendChild(t);
      t.focus();
    }""")
    for k in ("Alt+KeyS", "Alt+KeyD", "Alt+KeyE"):
        pg.keyboard.press(k)
    pg.wait_for_timeout(250)
    typed = ev(pg, "() => ({ on: document.activeElement.id, acts: window.__ak })", {})
    ck("Alt+S, Alt+D and Alt+E in a note do nothing at all",
       typed.get("acts") == {"sub": 0, "draft": 0, "pen": 0}, typed)
    ck("...and the cursor stays in the note", typed.get("on") == "ak-note", typed)

    print("\n§6 · the keys say themselves on the buttons they belong to")
    says = ev(pg, """() => {
      document.getElementById('ak-note').remove();
      ACTIONKEYS.mark();
      const g = id => {
        const e = document.getElementById(id);
        return e ? e.getAttribute('aria-keyshortcuts') : null;
      };
      return { sub: g('ak-sub'), draft: g('ak-draft'), pen: g('ak-pen') };
    }""", {})
    ck("Submit announces Alt+S", says.get("sub") == "Alt+S", says)
    ck("Save draft announces Alt+D", says.get("draft") == "Alt+D", says)
    ck("the pen announces Alt+E", says.get("pen") == "Alt+E", says)

    ev(pg, "() => { const w = document.getElementById('akfix'); if (w) w.remove(); delete window.__ak; }")
    print("\n§7 · and the build is quiet")
    ck("no page errors", not errs, errs[:3])
    b.close()

print("\n%d failure(s)" % bad)
raise SystemExit(1 if bad else 0)
