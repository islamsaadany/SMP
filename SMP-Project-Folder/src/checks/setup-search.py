"""Setup · the rail's search (§108.13).

WHAT IS WORTH ASSERTING HERE IS MOSTLY NOT "IT FILTERS". A box that narrows a
list is the easy half and the half that fails loudly. The three that fail
QUIETLY, and that this file exists for:

1. **Typing must never repaint** (§35, §45.5). A repaint replaces the input
   being typed into, and the symptom is a caret that jumps or a word that
   vanishes — intermittent, blamed on the keyboard, and invisible to any check
   that only reads the filtered list afterwards. Asserted by watching the
   input's own identity across keystrokes, and by typing into it and reading
   the value back.

2. **An unrelated repaint must not silently un-filter.** The Overview's three
   fetches each end in `paint()` and answer about a second after the page
   opens, which is exactly when somebody is typing. A filter that quietly
   reset then would leave somebody reading the whole list believing it was
   their results.

3. **A match inside a FOLDED group must be findable.** Folded items used to be
   omitted from the DOM entirely, so a filter could never reveal them —
   and the failure is silent: the search simply reports nothing found, which
   looks exactly like "no such setting" (§108.14).

Run: SMP_CHROME=... python3 qa-run.py checks/setup-search.py
"""
import pathlib, sys
from playwright.sync_api import sync_playwright

URL = "file://" + str(pathlib.Path(
    pathlib.Path(__file__).resolve().parent.parent,
    "strategy-management-platform.html").resolve())
fails, errs = [], []


def ck(name, ok, extra=""):
    print(("  ok   " if ok else "  FAIL ") + name + ((" — " + str(extra)) if extra else ""))
    if not ok:
        fails.append(name)


def shown(pg):
    return pg.eval_on_selector_all(
        ".setuprail .ritem",
        "e=>e.filter(x=>!x.hidden && x.offsetParent!==null).map(x=>x.dataset.setupgo)")


def type_q(pg, q):
    inp = pg.query_selector("[data-railq]")
    inp.click()
    pg.keyboard.press("Control+A")
    pg.keyboard.press("Delete")
    if q:
        pg.type("[data-railq]", q, delay=18)
    pg.wait_for_timeout(220)


with sync_playwright() as p:
    b = p.chromium.launch()
    pg = b.new_page(viewport={"width": 1600, "height": 1000})
    pg.on("pageerror", lambda e: errs.append("PAGEERROR: " + str(e)))
    pg.on("console", lambda m: errs.append(m.text) if m.type == "error" else None)
    pg.goto(URL)
    pg.wait_for_timeout(800)
    pg.select_option("#asWho", "smo")
    pg.wait_for_timeout(300)
    # THE GEAR BY ITS OWN ATTRIBUTE, never by a class it shares (§316.8, the
    # third file to need this): `.navmenu-btn` is worn by the HOUSE too since
    # §193.2 put the way home at the head of that row, so the first one is the
    # house and this click went home rather than into Setup — the rail never
    # opened and every assertion below it read a page that is not this one.
    pg.query_selector('[data-md="setup"]').click()
    pg.wait_for_timeout(600)

    print("\n── 1 · the box is there, and above the list it filters ──")
    ck("the rail has a search box", pg.query_selector("[data-railq]") is not None)
    ck("it is OUTSIDE the scrolling list (§108.5 caps that list)",
       pg.evaluate("()=>{const q=document.querySelector('[data-railq]');"
                   "return !document.querySelector('.setuprail .raillist').contains(q);}"))
    everything = shown(pg)
    ck("with no query, the rail shows the unfiltered list", len(everything) >= 15, len(everything))

    print("\n── 2 · a keyword finds a page whose NAME does not contain it ──")
    # The whole reason keywords exist: these words appear on no label.
    # ("logo", "brand") STOOD HERE and is REWRITTEN, never loosened (§218,
    # §214.3): §360 absorbed Branding into the client set-up, so that def is
    # gone and the mark-and-colours errand lands on Getting started — which,
    # until the set-up is done, is the STRIP above this box and needs no
    # finding (it is on screen, always). Once it is a row it is findable, and
    # THAT is asserted where the done state is made (setup-per-module §7b).
    # What this block is about survives whole: a word on no label finds its page.
    for word, want in [("weighting", "units"), ("password", "people"), ("upload", "import"),
                       ("threshold", "bands"), ("permissions", "access"),
                       ("vocabulary", "labels"),
                       # §135.4: the Email page became Send an email's second
                       # section, so its keywords moved onto that def. The
                       # errand is unchanged — "where do I set the reply-to" —
                       # and it still lands somewhere that answers it.
                       ("reply-to", "send")]:
        type_q(pg, word)
        got = shown(pg)
        ck("'%s' finds %s" % (word, want), want in got, got)

    print("\n── 3 · every word must match, in any order ──")
    type_q(pg, "reset password")
    a = shown(pg)
    type_q(pg, "password reset")
    bb = shown(pg)
    ck("'reset password' and 'password reset' are the same errand", a == bb and "people" in a,
       (a, bb))
    type_q(pg, "logo password")
    ck("two words from different pages narrow to nothing", shown(pg) == [], shown(pg))
    ck("and the rail SAYS so rather than emptying silently",
       pg.eval_on_selector("[data-railnone]", "e=>!e.hidden && e.textContent.trim()"))

    print("\n── 4 · a match inside a FOLDED group is still found (§108.14) ──")
    type_q(pg, "")
    # THE GROUP IS FOUND, NEVER NAMED (§214.3, §94.8). This block folded
    # `look` and searched for "logo", and §360 deleted that group outright —
    # Branding is the client set-up's first step now — so the check DIED on a
    # selector matching nothing rather than saying a decision had moved. What
    # it is about is the RELATIONSHIP (a folded group's match is still found),
    # so it takes whatever group the rail draws first and searches for that
    # row's own label, which matches by construction: a page renamed or moved
    # to another group cannot orphan it again.
    # …AND NEVER THE GROUP HOLDING THE PAGE YOU ARE ON, which §47.7 refuses to
    # fold: a rail that can hide the row saying where you are lies about it. A
    # naive "the first group with rows" picks exactly that one, because the
    # rail lands on its primary — so the pick skips any group holding `.on`.
    grp = pg.evaluate("""()=>{const box=(g)=>document.querySelector('[data-railitems="'+g+'"]');
      const h=[...document.querySelectorAll('.rgroup[data-railgrp]')].find(x=>{
        const b=box(x.dataset.railgrp);
        return !!b && !!b.querySelector('.ritem') && !b.querySelector('.ritem.on');});
      if(!h) return null; const g=h.dataset.railgrp;
      const it=box(g).querySelector('.ritem');
      const lab=it.querySelector('.rilab')||it;
      return { g:g, k:it.dataset.setupgo, lab:lab.textContent.trim() };}""")
    ck("there is a group with rows in it to fold", bool(grp and grp["k"] and grp["lab"]), grp)
    fold = ("()=>{const h=document.querySelector('.rgroup[data-railgrp=\"%s\"]');"
            "if(h && !h.classList.contains('shut')) h.click();}" % grp["g"])
    unfold = ("()=>{const h=document.querySelector('.rgroup[data-railgrp=\"%s\"]');"
              "if(h && h.classList.contains('shut')) h.click();}" % grp["g"])
    pg.evaluate(fold)
    pg.wait_for_timeout(300)
    ck("the group is folded and its rows are hidden",
       grp["k"] not in shown(pg), shown(pg))
    type_q(pg, grp["lab"])
    ck("searching still reveals the folded match", grp["k"] in shown(pg), shown(pg))
    ck("and its group heading is shown with it",
       pg.eval_on_selector('.rgroup[data-railgrp="%s"]' % grp["g"], "e=>!e.hidden"))

    print("\n── 5 · clearing puts the rail back exactly as it was found ──")
    type_q(pg, "")
    ck("the folded group is folded again, not left open",
       grp["k"] not in shown(pg), shown(pg))
    # THE NUMBER IS COUNTED, NOT WRITTEN DOWN (§135.4 removed a row from this
    # very group). A literal here fails the day somebody adds or moves a page,
    # which is a check reporting a change as a fault.
    folded = pg.eval_on_selector_all('[data-railitems="%s"] .ritem' % grp["g"], "e=>e.length")
    ck("everything else is back", len(shown(pg)) == len(everything) - folded,
       (len(shown(pg)), len(everything)))
    # Put it back for the blocks below.
    pg.evaluate(unfold)
    pg.wait_for_timeout(250)

    print("\n── 6 · TYPING NEVER REPAINTS (§35) ──")
    # The input must be the SAME NODE before and after a keystroke: a repaint
    # would replace it, which is what throws away a half-typed word.
    pg.evaluate("()=>{document.querySelector('[data-railq]').dataset.same='1';}")
    type_q(pg, "pass")
    ck("the input survived the keystrokes (it was never replaced)",
       pg.eval_on_selector("[data-railq]", "e=>e.dataset.same") == "1")
    ck("and holds what was typed", pg.eval_on_selector("[data-railq]", "e=>e.value") == "pass")
    ck("the rail did filter", shown(pg) == ["people"], shown(pg))

    print("\n── 7 · an unrelated repaint keeps the query AND the filter ──")
    pg.evaluate("()=>paint()")
    pg.wait_for_timeout(300)
    ck("the query survives a repaint",
       pg.eval_on_selector("[data-railq]", "e=>e.value") == "pass")
    ck("and so does the filtering", shown(pg) == ["people"], shown(pg))

    print("\n── 8 · Escape and the × clear it, and only it ──")
    pg.query_selector("[data-railq]").click()
    pg.keyboard.press("Escape")
    pg.wait_for_timeout(250)
    ck("Escape clears the query", pg.eval_on_selector("[data-railq]", "e=>e.value") == "")
    ck("Escape did not close the rail", pg.query_selector(".setuprail .raillist") is not None)
    ck("the whole list is back", len(shown(pg)) == len(everything), len(shown(pg)))
    type_q(pg, "logo")
    ck("the clear button appears only with a query",
       pg.eval_on_selector("[data-railqx]", "e=>!e.hidden"))
    pg.query_selector("[data-railqx]").click()
    pg.wait_for_timeout(250)
    ck("pressing it clears", pg.eval_on_selector("[data-railq]", "e=>e.value") == "")
    ck("and it hides itself again", pg.eval_on_selector("[data-railqx]", "e=>e.hidden"))

    print("\n── 9 · arriving is the end of the errand ──")
    # THE ROW IS THE SEARCH'S OWN ANSWER, never a named page (§214.3): this
    # pressed `brand`, which §360 deleted. It presses whatever the query finds
    # and asserts the page that opens is THAT row's — an agreement, so the next
    # page to be renamed or absorbed cannot orphan it (§94.8).
    type_q(pg, "weighting")
    hit = shown(pg)
    ck("the query finds exactly one row to press", len(hit) == 1, hit)
    want_lab = pg.eval_on_selector('.setuprail .ritem[data-setupgo="%s"] .rilab' % hit[0],
                                   "e=>e.textContent.trim()")
    pg.query_selector('.setuprail .ritem[data-setupgo="%s"]' % hit[0]).click()
    pg.wait_for_timeout(500)
    ck("the page opened", pg.eval_on_selector("#panel .setupttl", "e=>e.textContent.trim()")
       == want_lab, want_lab)
    ck("and the rail is no longer filtered",
       pg.eval_on_selector("[data-railq]", "e=>e.value") == "" and
       len(shown(pg)) == len(everything), (len(shown(pg)), len(everything)))

    print("\n── 10 · the search reaches the rail on screen and nothing else (§359.2) ──")
    # Served, Setup is two rails — a module's own and the client's — and a
    # search in one must not find a page that lives in the other, or a match
    # opens a page the rail is not drawing. The scope is the document's own
    # attribute (shell.html setupScope), set here the way the served router
    # sets it, and BOTH ENDS are asserted: the page absent from the wrong
    # rail AND present in the right one, or a filter that finds nothing
    # anywhere passes the first half (§94.2).
    # Standing on a page of the rail being scoped, because the page decides
    # the rail (research R2): scoped to Strategy while on Branding, the shell
    # would correctly move the scope straight back.
    pg.evaluate("()=>{currentSub='cycle'; document.documentElement.setAttribute('data-setup-scope','strategy'); paint();}")
    pg.wait_for_timeout(400)
    # BRANDING STOOD FOR "the client's page" HERE (§214.3): it is gone, so the
    # client's side is named by a page that is still the client's — the
    # register, whose errand is a password reset and which no module draws.
    type_q(pg, "password")
    ck("the People register (the client's) is not found from Strategy's rail", "people" not in shown(pg), shown(pg))
    type_q(pg, "threshold")
    ck("…and Scoring bands (Strategy's) is", shown(pg) == ["bands"], shown(pg))
    pg.evaluate("()=>{currentSub='mainbu'; document.documentElement.setAttribute('data-setup-scope','client'); paint();}")
    pg.wait_for_timeout(400)
    type_q(pg, "password")
    ck("from the client's rail the People register is found", "people" in shown(pg), shown(pg))
    type_q(pg, "threshold")
    ck("…and Scoring bands is not", "bands" not in shown(pg), shown(pg))
    type_q(pg, "")
    pg.evaluate("()=>{document.documentElement.removeAttribute('data-setup-scope'); paint();}")
    pg.wait_for_timeout(300)
    ck("unscoped again, the whole list is back (§94.2)", len(shown(pg)) == len(everything), len(shown(pg)))

    b.close()

print("\nconsole errors:", errs or "none")
if fails:
    print("\nFAILED: %d" % len(fails))
    for f in fails:
        print("  - " + f)
    sys.exit(1)
print("\nsetup-search: all assertions passed")
