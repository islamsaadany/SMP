"""A FAILED RENDER SAYS SO ON THE PAGE (§137).

WHAT WAS BROKEN: a throw mid-`paint()` kept the PREVIOUS page on screen with
the only witness in the hidden console (§118.7) — so a data fault read as a
dead click, and the person reported the wrong symptom. §32's rule one level
deeper: before the answer is drawn there is exactly one honest thing to show,
and after a failure there is too — the failure.

WHAT THIS ASSERTS, both ends (§94.2):
  1. With a page's renderer poisoned to throw, navigating there draws the
     failure card — the friendly sentence, the Reload control receiving its
     own click point, and the error text folded behind a CLOSED disclosure.
  2. The rest of the platform survives: the navigation still works, and
     walking back to a healthy page renders it normally with no card.
  3. The throw no longer escapes paint() — zero uncaught page errors — while
     the card's details still carry the real message, so nothing is hidden.

On the pre-§137 build this fails as the fault was reported from production:
no card, the previous page left standing, and the error uncaught.

The renderer is poisoned through the real def table (`SUBS`), which is what
paint() actually calls — not a copy of it.

Run: SMP_CHROME=... python3 qa-run.py checks/render-fail.py
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


with sync_playwright() as p:
    b = p.chromium.launch()
    pg = b.new_page(viewport={"width": 1440, "height": 900})
    uncaught = []
    pg.on("pageerror", lambda e: uncaught.append(str(e)))
    pg.goto(url)
    pg.wait_for_timeout(800)
    who = pg.eval_on_selector_all("#asWho option", "els=>els.map(e=>e.value)")
    pg.select_option("#asWho", who[0])
    pg.wait_for_timeout(300)
    pg.query_selector('#units [data-u="mobile"]').click()
    pg.wait_for_timeout(400)

    # Poison the group's landing page — the def table paint() actually reads.
    poisoned = pg.evaluate("""() => {
      var d = SUBS.group.filter(function(x){ return x.render; })[0];
      if (!d) return "no renderable group def";
      d.render = function(){ throw new Error("injected by render-fail check"); };
      return d.k;
    }""")
    ck("a group def was poisoned", isinstance(poisoned, str) and "no " not in poisoned, poisoned)

    # Walk to the group through the real control (§68: it lives in a details).
    pg.query_selector("#topsel > summary").click()
    pg.wait_for_timeout(200)
    pg.query_selector('#topsel [data-u="group"]').click()
    pg.wait_for_timeout(500)

    card = pg.query_selector("#panel .failcard")
    ck("the failure card is drawn where the page would be", card is not None)
    if card:
        txt = card.text_content()
        ck("it says what happened, in the agreed words",
           "Something went wrong opening this page." in txt and "Your data is safe" in txt, txt[:120])
        ck("the error itself is in the details", "injected by render-fail check" in txt, txt[:120])
        opened = pg.evaluate("!!document.querySelector('#panel .failcard details[open]')")
        ck("the details are folded until asked", opened is False, opened)
        hit = pg.evaluate("""() => {
          var el = document.querySelector('#panel .failcard [data-failreload]');
          if (!el) return "absent";
          var r = el.getBoundingClientRect();
          var h = document.elementFromPoint(r.left + r.width/2, r.top + r.height/2);
          return (el === h || el.contains(h)) ? "ok" : "intercepted";
        }""")
        ck("Reload receives its own click point", hit == "ok", hit)
    ck("the throw no longer escapes paint()", not uncaught, uncaught[:2])

    # The rest of the platform is genuinely alive: walk back to a healthy page.
    pg.query_selector('#units [data-u="mobile"]').click()
    pg.wait_for_timeout(500)
    ck("a healthy page renders normally afterwards",
       pg.query_selector("#panel .failcard") is None and
       bool(pg.query_selector("#panel .pband, #panel .split, #panel table")))
    ck("still no uncaught errors after walking on", not uncaught, uncaught[:2])
    b.close()

print("render-fail: %s" % ("OK" if bad == 0 else "%d FAILURES" % bad))
raise SystemExit(1 if bad else 0)
