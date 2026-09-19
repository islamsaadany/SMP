#!/usr/bin/env python3
"""The console asks once, and asks both at once (§369).

Islam: "something strange the window is not active on opening I need to click
anyway to start accepting clicks on the cards." THE WINDOW IS ACTIVE AND THE
PAGE IS NOT FINISHED, and from outside the two are the same thing: `.top` is
drawn OUTSIDE `.wrap`, so the bar stands up with Forefront's name and a Sign
out button over a body `body:not(.ready)` has hidden — a window that looks
open, answers nothing, and says nothing about either.

Measured before anything was proposed (§3a), at 600ms a round trip: the
requests went out `me` → `cards` → `cards`, THREE sequential trips for one page
load with the last two the SAME request — the heaviest in the page, which opens
a connection per client to read its units, its plan and its cycle. The bar was
up and dead for 1,255ms, the page then appeared titled and empty, and the cards
landed at 1,872. Established as NOT §368's first (§303): the same probe against
the build before that section reports 1,259 to 1,255.

WHAT IS ASSERTED IS THE PROPERTY, NEVER THE MILLISECONDS (§94.8) — a faster
machine must not turn this green and a slower one must not turn it red:

  §1  `cards` is asked ONCE for one page load, and `me` and `cards` OVERLAP.
      Overlap is the test rather than a duration, because two trips that
      happen to be quick are still two trips.
  §2  the grid is NEVER STANDING EMPTY — from the moment the page is up it
      holds cards, placeholder or real. That is the property both answers to
      the second stage he was watching satisfy: §369's (page and cards
      arriving together) and §371's (placeholders drawn first).
  §3  BOTH ENDS OF THE HAND-OVER (§94.2), and this is the load-bearing one:
      the boot's answer is used by the FIRST draw and by nobody else, so a
      later `go("clients")` reads the list AGAIN. Used twice, the grid would
      draw a client that had just been archived — worse than the fault this
      repairs — so the second draw is asserted to ask (§48.2).
  §4  THE WINDOW WHILE IT WAITS (§371). §369 left this silent on purpose and
      recorded the silence here, so that the day it gained a treatment these
      would go red rather than outlive their decision (§214.3) — which is
      what happened: Islam took §94.10's grey skeleton over the page's own
      words. Rewritten, never loosened (§218), to four claims that can each
      fail: the waiting window exists and holds placeholders; they carry no
      word, no mark and nobody's name (§94.10's rule, and the whole reason
      anything may be drawn before the answer); a press where a card will be
      lands on the page rather than on BODY, which is his own report
      measured at his own point; and none is left standing once the clients
      arrive (§94.2 — a build that drew them and kept them passes the other
      three).
      AND THE PAIR THEY REPLACE HAD STARTED PASSING FOR THE WRONG REASON: the
      page is ready from the first frame now, so the sample list they read was
      EMPTY and `all([])` reported the silence intact on the build that ended
      it (§113.8). Every list here is asserted non-empty before it is read.

IT NEEDS NO DATABASE, for platform-cards.py's reason: the page is served as it
is by both stacks, so a stub drives it — and a stub is also the only way to
hold a round trip open long enough to look at the window at all (§94.11, §255).

Run:  SMP_CHROME=… python3 SMP-Project-Folder/src/checks/console-boot.py
      … --break=sequential   # the boot before §369; must go red
      … --break=handed-twice # the hand-over reused; must go red
      SMP_PAGE=smp-app/shell/platform.html …   # the new stack's own copy
      (that spelling is relative to the REPOSITORY ROOT, and is also accepted
       from SMP-Project-Folder/src, where qa-run.py is — a page that is not
       there is named rather than served empty)
"""
import http.server, json, os, re, socketserver, sys, threading, time
from playwright.sync_api import sync_playwright

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))
REPO = os.path.abspath(os.path.join(ROOT, ".."))
PORT = int(os.environ.get("SMP_CHECK_PORT", "3991"))
BREAK = next((a.split("=", 1)[1] for a in sys.argv[1:] if a.startswith("--break=")), "")
LAG = 0.45   # one round trip, held open so the window can be looked at


def pagePath():
    """WHERE THE PAGE IS, SAID RATHER THAN HANDED BACK AS A BROWSER ERROR.

    `SMP_PAGE` is documented relative to the REPOSITORY ROOT, and every
    browser check in this project is run through `qa-run.py`, which lives in
    `SMP-Project-Folder/src` (§320.6b) — so the spelling that is documented is
    relative to one directory and typed from another. Both are accepted: as
    given, then against the repo root.

    AND A PAGE THAT IS NOT THERE IS REFUSED BEFORE THE SERVER STARTS, never
    opened inside the request thread. That is §369.3's own fault one line
    over: a failure raised in the server thread kills only that thread, so the
    page is never served and the run comes back `ERR_EMPTY_RESPONSE`, naming
    neither the file nor the directory it was looked for in (§54.5, §123).
    """
    want = os.environ.get("SMP_PAGE")
    tries = [os.path.abspath(want), os.path.abspath(os.path.join(REPO, want))] if want \
        else [os.path.join(REPO, "platform.html")]
    tries = list(dict.fromkeys(tries))
    for p in tries:
        if os.path.isfile(p):
            return p
    sys.exit("the console page is not there — %s\n  tried: %s"
             % ("SMP_PAGE=%s" % want if want else "no platform.html at the repository root",
                "\n  tried: ".join(tries)))


PAGE = pagePath()

# THE BROKEN BUILD IS MADE FROM THE SOURCE (§276), and every substitution
# ASSERTS IT MATCHED before it is written — a break that quietly applies to
# nothing reports 0 red, which is indistinguishable from a guard that works
# (§54.5, §344.1).
BREAKS = {
    # the boot before §369: ask `me`, then `cards`, then let the first draw
    # ask `cards` all over again
    "sequential": [
        ('Promise.all([post({ action: "me" }), post({ action: "cards" })]).then(function (r) {\n    var j = r[0], c = r[1];',
         'post({ action: "me" }).then(function (j) {\n    var c = null;'),
        ('    document.body.classList.add("ready");\n    go("clients");\n  }).catch(function (e) {\n    if (String(e.message) === "sign in") return;',
         '    return post({ action: "cards" }).then(function (c2) {\n      if (c2 && c2.ok) { ME.canConsultants = !!c2.canConsultants; ME.canAccess = !!c2.canAccess; }\n      document.body.classList.add("ready");\n      BOOTCARDS = null;\n      go("clients");\n    });\n  }).catch(function (e) {\n    if (String(e.message) === "sign in") return;'),
    ],
    # the hand-over kept rather than spent: every later draw shows the list as
    # it was at boot, so an archived client stays on the grid
    "handed-twice": [
        ("var handed = BOOTCARDS; BOOTCARDS = null;", "var handed = BOOTCARDS;"),
    ],
    # §371 reverted: the page waits behind the gate again, silent, which is
    # the state §369 recorded and Islam replaced
    "no-skeleton": [
        ("  drawWaiting();\n  Promise.all(", "  Promise.all("),
    ],
    # a placeholder that carries somebody's name — §94.10's own fault, and the
    # one thing a skeleton may never do, since what is drawn before the answer
    # must be nothing that could turn out to have been the wrong tenant's
    "skeleton-named": [
        ('      top.appendChild(el("div", "sk-line"));',
         '      top.appendChild(el("h2", null, "Raya Trade"));'),
    ],
    # the placeholders left standing under the clients: `go` stops clearing,
    # so the grid gains the real cards below three grey ones
    "skeleton-stays": [
        ("    drawNav();\n    clear();\n    return redraw();",
         "    drawNav();\n    return redraw();"),
    ],
}

if BREAK and BREAK not in BREAKS:
    print("  unknown break: " + BREAK); sys.exit(1)

# THE BREAK LANDS WHEREVER THE CODE LIVES, which is two places: this page
# carries its script inline and the new stack's copy has it in
# /platform-page.js (§329). A `doctor` that insisted on a match in whichever
# file it was handed FIRST died inside the server thread against the generated
# copy — the page was never served and the run reported 0 FAIL, which reads
# exactly like a working guard (§54.5, §215). So each substitution is applied
# to whichever body holds it, and WHETHER IT LANDED AT ALL is asserted at the
# end of the run rather than mid-request (§344.1).
APPLIED = set()

def doctor(text):
    if not BREAK: return text
    for i, (old, new) in enumerate(BREAKS[BREAK]):
        if old in text:
            text = text.replace(old, new, 1); APPLIED.add(i)
    return text

fails, passes = [], []
def check(what, ok, detail=""):
    if ok:
        passes.append(what); print("  ok   " + what)
    else:
        print("  FAIL " + what + ("  — " + str(detail) if detail else "")); fails.append(what)

STRAT = [{"key": "strategy", "label": "Strategy", "mark": "3 of 10", "alarm": False, "tip": "t"}]
CARDS = [{"key": "raya-trade", "name": "Raya Trade", "industry": "Trade", "kind": "client",
          "mark": None, "mine": True, "seat": "super", "state": "open", "canOpen": True,
          "canConfig": True, "units": 10, "planned": True, "cycleOpen": True,
          "unreadable": False, "modules": STRAT}]

# EVERY REQUEST, WITH WHEN IT STARTED AND WHEN IT WAS ANSWERED — overlap is
# read off these rather than inferred from a total (§94.8).
HITS = []

class Stub(http.server.SimpleHTTPRequestHandler):
    def log_message(self, *a): pass
    def _send(self, body, ctype):
        b = body.encode("utf-8")
        self.send_response(200); self.send_header("Content-Type", ctype)
        self.send_header("Content-Length", str(len(b))); self.end_headers(); self.wfile.write(b)
    def do_GET(self):
        p = self.path.split("?")[0]
        if p in ("/platform", "/"):
            with open(PAGE, encoding="utf-8") as f: self._send(doctor(f.read()), "text/html; charset=utf-8")
            return
        # the new stack's copy is GENERATED from this one with the script moved
        # to a file — walking one copy proves one copy (§53.5, A15)
        for name in ("platform-page.js", "memory-split.js", "client-setup.js"):
            if p == "/" + name:
                fp = os.path.join(REPO, "smp-app", "public", name)
                if os.path.exists(fp):
                    with open(fp, encoding="utf-8") as f:
                        # doctored too, or a break run against the generated
                        # copy applies to nothing and reports 0 red (§54.5)
                        body = f.read()
                        self._send(doctor(body) if name == "platform-page.js" else body,
                                   "application/javascript; charset=utf-8")
                else:
                    self._send("", "application/javascript; charset=utf-8")
                return
        # a row's address answers, so a press is a real navigation; anything
        # else 404s rather than the stub answering for the product (§100.3)
        if re.match(r"^/[a-z0-9][a-z0-9-]*/[a-z]+$", p):
            self._send("<!doctype html><title>opened</title>", "text/html; charset=utf-8"); return
        self.send_response(404); self.end_headers()
    def do_POST(self):
        n = int(self.headers.get("Content-Length", "0"))
        body = json.loads(self.rfile.read(n) or b"{}")
        act = body.get("action")
        t0 = time.time()
        time.sleep(LAG)
        if act == "me":
            out = {"ok": True, "account": {"email": "a@f.example", "name": "Admin", "isAdmin": True},
                   "access": {}, "mine": ["raya-trade"]}
        elif act == "cards":
            out = {"ok": True, "cards": CARDS, "canConsultants": True, "canAccess": True}
        else:
            out = {"ok": True}
        HITS.append({"act": act, "t0": t0, "t1": time.time()})
        self._send(json.dumps(out), "application/json")

class TS(socketserver.ThreadingMixIn, http.server.HTTPServer): daemon_threads = True

srv = TS(("127.0.0.1", PORT), Stub)
threading.Thread(target=srv.serve_forever, daemon=True).start()
BASE = "http://127.0.0.1:%d" % PORT

with sync_playwright() as pw:
    br = pw.chromium.launch(executable_path=os.environ.get("SMP_CHROME") or None)
    pg = br.new_page(viewport={"width": 1440, "height": 900})
    errs = []
    pg.on("pageerror", lambda e: errs.append(str(e)))

    print("§1 · one question each, asked together")
    pg.goto(BASE + "/platform", wait_until="commit")
    # WHAT IS ON SCREEN WHILE IT WAITS, sampled — the dead window is read from
    # the page rather than described (§3a). A click's target is asked where a
    # card will be, which is what he was pressing.
    dead = []
    for _ in range(40):
        time.sleep(0.05)
        st = pg.evaluate("""() => {
          const bar = document.querySelector('.top'), wrap = document.getElementById('page');
          const box = wrap ? wrap.getBoundingClientRect() : null;
          let at = null;
          if (box) {
            const e = document.elementFromPoint(Math.round(box.left + 120), Math.round(box.top + 60));
            at = e ? e.tagName : null;
          }
          const sk = document.querySelectorAll('.ccard.skel');
          /* WHAT THE PLACEHOLDERS HOLD, read off the page rather than off
             the builder: §94.10's rule is that nothing is drawn which will
             have to be corrected, so what can fail is a placeholder that
             carries a word, a picture, or anybody's name. */
          let words = 0, imgs = 0;
          sk.forEach((c) => {
            words += (c.textContent || '').trim().length;
            imgs += c.querySelectorAll('img, svg').length;
          });
          return { ready: document.body.classList.contains('ready'),
                   bar: !!(bar && bar.getClientRects().length),
                   cards: document.querySelectorAll('.ccard[data-name]').length,
                   skel: sk.length, words: words, imgs: imgs,
                   /* what the page has DRAWN, so §4 can assert the waiting
                      state where it can fail rather than after it has ended */
                   drew: wrap ? wrap.childElementCount : -1, at: at };
        }""")
        dead.append(st)
        if st["ready"] and st["cards"]: break
    pg.wait_for_selector(".ccard[data-name]", timeout=15000)

    acts = [h["act"] for h in HITS]
    check("`cards` is asked ONCE for one page load", acts.count("cards") == 1, acts)
    check("`me` is asked once", acts.count("me") == 1, acts)
    # OVERLAP, not duration: the second request starts before the first is
    # answered. Two quick trips are still two trips (§94.8).
    me = next((h for h in HITS if h["act"] == "me"), None)
    cd = next((h for h in HITS if h["act"] == "cards"), None)
    check("`me` and `cards` overlap — one round trip, not two",
          bool(me and cd) and cd["t0"] < me["t1"] and me["t0"] < cd["t1"],
          {"me": me and round(me["t1"] - me["t0"], 3), "gap": bool(me and cd) and round(cd["t0"] - me["t0"], 3)})

    print("§2 · the grid is never standing empty")
    # THE SECOND STAGE HE WAS WATCHING was ready, titled and nothing where the
    # cards go. §369 closed it by making the page and the cards arrive
    # together; §371 closes it the other way round, by drawing placeholders
    # first — so what is asserted is the PROPERTY both satisfy and neither
    # spelling of it (§94.8): from the moment the page is up, the grid holds
    # cards, placeholder or real. REWRITTEN, never loosened (§218): this is
    # stronger than "no ready-and-empty window", because it also fails on a
    # build that drew the skeleton and then cleared the grid before the real
    # cards landed — the flicker a naive redraw produces.
    empty = [s for s in dead if s["ready"] and not s["cards"] and not s["skel"]]
    check("no window in which the page is up and the grid holds nothing",
          len(empty) == 0, "%d of %d samples" % (len(empty), len(dead)))
    check("the bar is drawn the whole time — the window always looked open",
          all(s["bar"] for s in dead), dead[0] if dead else None)

    print("§3 · the hand-over is one-shot, both ends")
    # It was used: the first draw asked nobody.
    check("the first draw used the boot's answer — it asked nobody",
          acts.count("cards") == 1, acts)
    # AND THE SECOND DRAW ASKS. Without this the grid draws a client that has
    # just been archived (§48.2) — worse than the fault §369 repairs.
    before = len(HITS)
    pg.evaluate("""() => { document.querySelector('[data-tab=\"clients\"]')?.click(); }""")
    pg.wait_for_timeout(200)
    if len(HITS) == before:
        # the tab may not be a [data-tab]; press the product's own way back
        pg.evaluate("""() => {
          const t = Array.from(document.querySelectorAll('#nav button, #nav a'))
            .find((b) => /client/i.test(b.textContent || ''));
          if (t) t.click();
        }""")
        pg.wait_for_timeout(200)
    pg.wait_for_selector(".ccard[data-name]", timeout=15000)
    again = [h["act"] for h in HITS[before:]]
    check("a later draw reads the list again", again.count("cards") >= 1, again)
    check("and the cards are still drawn after it",
          pg.eval_on_selector_all(".ccard[data-name]", "n => n.length") >= 1)

    print("§4 · the window while it waits (§371)")
    # THE DAY IT GAINED A TREATMENT THIS WENT RED, which is what the two
    # assertions it replaces were for (§214.3). They recorded the silence:
    # a dead window, a click hitting BODY, and nothing drawn at all. Islam
    # took §94.10's grey skeleton over the page's own words, so they are
    # REWRITTEN to the claims that are true now — and not loosened, because
    # each of these can fail where the old ones no longer could.
    #
    # AND THE OLD PAIR HAD ALREADY STARTED PASSING FOR THE WRONG REASON
    # (§113.8): with the page ready from the first frame the sample list they
    # read was EMPTY, so `all([])` reported the silence as intact on the very
    # build that ended it. Asserted over a list proved non-empty here.
    waiting = [s for s in dead if s["skel"] and not s["cards"]]
    check("there is a window before the cards, and it holds placeholders",
          len(waiting) >= 1, "%d of %d samples" % (len(waiting), len(dead)))
    # AND THEY HOLD NOTHING THAT IS ANYBODY'S, which is the whole reason a
    # skeleton may be drawn before the answer at all (§94.10). A placeholder
    # carrying a name, a mark or a word is the painting-and-correcting the
    # gate above exists to stop.
    check("and they carry no word, no mark and nobody's name",
          bool(waiting) and all(s["words"] == 0 and s["imgs"] == 0 for s in waiting),
          {"words": max([s["words"] for s in waiting] or [-1]),
           "imgs": max([s["imgs"] for s in waiting] or [-1])})
    # AND THE PAGE IS DRAWN WHERE HE WAS PRESSING. His report was a window in
    # which a click over a card hit BODY; measured at that same point, it now
    # lands inside the grid. It does not make the press DO anything — there is
    # no client to open yet — so what is asserted is that the page is there,
    # never that the click works (§124).
    check("a press where a card will be lands on the page, not on BODY",
          bool(waiting) and all(s["at"] != "BODY" for s in waiting),
          sorted(set(s["at"] for s in waiting)))
    # AND THEY GO WHEN THE REAL ONES ARRIVE. Both ends (§94.2): a build that
    # drew placeholders and left them standing beside the clients would pass
    # every assertion above.
    landed = [s for s in dead if s["cards"]]
    check("and none is left standing once the clients arrive",
          bool(landed) and all(s["skel"] == 0 for s in landed),
          "%d samples with cards, max skel %d"
          % (len(landed), max([s["skel"] for s in landed] or [-1])))

    check("no page errors", not errs, errs[:2])
    br.close()

srv.shutdown()

# AND THE BREAK IS ASSERTED TO HAVE LANDED. A falsification that applies to
# nothing prints 0 red and is indistinguishable from a guard that works
# (§54.5) — so it is the CHECK that fails here, loudly, and never the run that
# quietly passes.
if BREAK:
    want = set(range(len(BREAKS[BREAK])))
    if APPLIED != want:
        print("  FAIL break %r matched %d of %d — it proved nothing"
              % (BREAK, len(APPLIED), len(want)))
        fails.append("break landed")
    else:
        print("  (break %r landed, all %d parts)" % (BREAK, len(want)))

print("")
print("%d ok, %d failed" % (len(passes), len(fails)))
sys.exit(1 if fails else 0)
