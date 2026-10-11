"""IS IT SAVED? (§521)

qa-run: own-server — this check SERVES the built file itself, with a stub it
programs (a slow save, a failing one, a refused one). The served app cannot be
told to hold a response or to fail on demand, so re-pointing it would measure
something else; the client under test is `sync.js`, carried into the new app
verbatim.

Islam, of the usability audit's first finding: the platform has never had a
Save button (§268, §273.4) — every box writes when the cursor leaves it and
the autosave carries it — so the person doing the typing had nothing at all to
read. The five outcomes of a save reached only the eight callers that pass a
callback.

This is NOT `save-said.py`'s subject, and the two are deliberately apart
(§53.5): that file asserts what a FAILED save EXPLAINS — the banners, their
references, the put-back, the kept copy. This one asserts whether a save is
reported AT ALL, and the states it is about (`saving`, `clean`, `offline`, a
projector, the fade, the width) are none of that file's business.

WHAT IS ASSERTED IS THE PROBLEM, NOT THE WORDING (§94.8):

  1 · nothing is claimed before the first save of a session (§35);
  2 · a save in flight says so, and says it landed when it did;
  3 · WHEN it last saved is on the hover, never on the line (1b-ii);
  4 · `Saved` fades and `Not saved` DOES NOT — Islam's own asymmetry, and the
      only reason the fade is safe to have. WHAT ENFORCES IT TODAY IS THE
      RETRY rather than the fade's own guard, measured in §7 rather than
      assumed: a failed save is re-sent every five seconds for the life of the
      page, so a six-second fade can never complete while one stands;
  5 · a refusal reports here too, with §32's own banner still speaking beside
      it rather than replaced by this (both surfaces, §53.5);
  6 · `clean` leaves whatever is on screen EXACTLY as it is — §170's trailing
      debounce answers `clean` constantly, so clearing there would take the
      message away mid-sentence and re-arming would hold a stale one up;
  7 · the word's box does not change width as `Saving…` becomes `Saved`, or it
      re-animates the one thing this treatment promises not to;
  8 · the faded pill takes no clicks, and the shown one does (§316.5's cost at
      the other end, named and bounded);
  9 · not on a projector (§265), measured as PAINT and never as a class;
 10 · and `file://` says nothing, because nothing was expected to save.

BOTH ENDS EVERYWHERE (§94.2): every absence is asserted beside the presence
that makes it mean something, or a build that drew nothing at all would pass
half this file.

Point it at another build with SMP_BUILT to falsify it (§276: a broken build is
made from the SOURCES, because §238's hashed policy silences an edited built
file).

Run: SMP_CHROME=... python3 qa-run.py checks/save-tip.py
"""
import json, os, pathlib, threading, time, http.server, socketserver
from playwright.sync_api import sync_playwright

HERE = pathlib.Path(__file__).resolve().parent
ROOT = HERE.parents[2]
BUILT = pathlib.Path(os.environ.get(
    "SMP_BUILT", str(HERE.parent / "strategy-management-platform.html")))
HTML = BUILT.read_bytes()
SEED = json.loads((ROOT / "db/seed-state.json").read_text())
PERSON = {"key": "smo", "name": "Mohamed Essam", "role": "super"}
GATE = b"<!doctype html><title>Sign in</title><h1 id='gate'>Sign in</h1>"

# What the stub does with a POSTed state. Changed mid-run, which is the trial.
# `delay` is what makes a save observable AT ALL: the leading edge of §170's
# debounce posts the first change of a burst at once, so against a local stub
# the round trip is over before a probe can look. Holding the response is also
# the faithful shape — a real save over a network takes time.
POST = {"status": 200, "delay": 0, "n": 0}
bad = 0


def ck(w, cond, x=""):
    global bad
    if not cond:
        bad += 1
    print(("  ok      " if cond else "  FAIL    ") + w + (("  — " + str(x)) if not cond and x else ""))


class H(http.server.BaseHTTPRequestHandler):
    def log_message(self, *a):
        pass

    def _s(self, c, b, t):
        self.send_response(c)
        self.send_header("Content-Type", t)
        self.send_header("Content-Length", str(len(b)))
        self.end_headers()
        self.wfile.write(b)

    def do_GET(self):
        if self.path.startswith("/api/state"):
            self._s(200, json.dumps({"ok": True, "state": SEED, "person": PERSON}).encode(),
                    "application/json")
            return
        if self.path.startswith("/raya-trade"):
            self._s(200, HTML, "text/html; charset=utf-8")
            return
        self._s(200, GATE, "text/html; charset=utf-8")

    def do_POST(self):
        n = int(self.headers.get("Content-Length") or 0)
        self.rfile.read(n)
        if not self.path.startswith("/api/state"):
            self._s(200, b'{"ok":true}', "application/json")
            return
        POST["n"] += 1
        if POST["delay"]:
            time.sleep(POST["delay"])
        if POST["status"] == 403:
            self._s(403, json.dumps({"ok": False, "refusals": [
                "Who may do what is the Super user's."]}).encode(), "application/json")
            return
        if POST["status"] != 200:
            self._s(POST["status"], json.dumps({"ok": False, "error": "boom"}).encode(),
                    "application/json")
            return
        self._s(200, b'{"ok":true}', "application/json")


srv = socketserver.ThreadingTCPServer(("127.0.0.1", 0), H)
srv.daemon_threads = True
PORT = srv.server_address[1]
threading.Thread(target=srv.serve_forever, daemon=True).start()
URL = "http://127.0.0.1:%d/raya-trade" % PORT
FILE_URL = "file://" + str(BUILT)

# EVERY PROBE DEGRADES (§215): a build that never draws the message is exactly
# the build this file exists to catch, and a probe that throws on the missing
# element would report its own death rather than the fault.
TIP = """() => {
  const e = document.getElementById('savetip');
  if (!e) return {there: false};
  const w = e.querySelector('.sword');
  const d = e.querySelector('.sdot');
  const cs = getComputedStyle(e);
  const r = e.getBoundingClientRect();
  return {there: true,
          hidden: !!e.hidden,
          shown: e.classList.contains('show'),
          state: e.getAttribute('data-state') || '',
          word: w ? w.textContent.trim() : '',
          title: e.title || '',
          op: Number(cs.opacity),
          display: cs.display,
          pointer: cs.pointerEvents,
          dot: d ? getComputedStyle(d).backgroundColor : '',
          ink: cs.color,
          wordW: w ? Math.round(w.getBoundingClientRect().width * 10) / 10 : 0,
          box: [Math.round(r.left), Math.round(r.bottom), Math.round(r.width)]};
}"""


def tip(pg):
    try:
        return pg.evaluate(TIP)
    except Exception as e:
        return {"there": False, "err": str(e)}


def change(pg, mark, wait=0):
    """Through the REAL path: mutate the graph and paint(), which ends in
       afterPaint() — never by calling save() directly, or the trial would be
       of a function nothing in the product reaches that way."""
    try:
        pg.evaluate("GROUP.org = %s; paint();" % json.dumps(mark))
    except Exception:
        pass
    if wait:
        pg.wait_for_timeout(wait)


def banner(pg, which):
    try:
        return pg.evaluate("""(id) => { const e = document.getElementById(id);
          return (e && !e.hidden) ? e.textContent.replace(/\\s+/g,' ').trim() : ""; }""", which)
    except Exception:
        return ""


with sync_playwright() as p:
    b = p.chromium.launch(executable_path=os.environ.get("SMP_CHROME") or None)
    cx = b.new_context(viewport={"width": 1440, "height": 900})
    pg = cx.new_page()
    # §167.2: the welcome screen covers the viewport, so every click lands on
    # it — and it must be stood down BEFORE the goto, not after.
    pg.add_init_script("try{sessionStorage.setItem('smp.tour.later','1');"
                       "sessionStorage.setItem('smp.welcome.done','1');}catch(e){}")
    errs = []
    pg.on("pageerror", lambda e: errs.append(str(e)))
    pg.goto(URL, wait_until="networkidle")
    pg.wait_for_timeout(1800)
    ck("the platform hydrated", pg.evaluate("()=>SYNC.isLive()") is True)

    # ── 1 · NOTHING IS CLAIMED BEFORE THE FIRST SAVE ────────────────────
    #    §35: absent is not zero. The element has to BE there (or every
    #    assertion below passes on a build with no message at all) and has to
    #    say nothing.
    print("\n1 · before the first save of a session")
    t = tip(pg)
    ck("the message is in the document", t.get("there") is True, t)
    ck("...and says nothing yet", t.get("hidden") is True, t)
    ck("...so it is not painted", t.get("display") == "none", t)

    # ── 2 · A SAVE IN FLIGHT SAYS SO, AND SAYS IT LANDED ────────────────
    print("\n2 · a save in flight, and a save that landed")
    POST["delay"] = 1.2
    change(pg, "tip-1", 300)
    t = tip(pg)
    ck("it says the platform is saving", t.get("word") == "Saving…", t)
    ck("...and is painted", t.get("shown") is True and t.get("op") == 1, t)
    ck("...at the bottom LEFT, because bottom right is the chat corner's (§97)",
       t.get("box", [9e9])[0] < 200, t.get("box"))
    ck("...with no time on the hover yet", t.get("title") == "", t)
    saving_w = t.get("wordW")
    pg.wait_for_timeout(1600)
    t = tip(pg)
    ck("it says the server took it", t.get("word") == "Saved", t)
    ck("...marked as such, so it can be read without reading the word",
       t.get("state") == "saved", t)
    ck("...and still painted", t.get("shown") is True, t)

    # ── 3 · WHEN, ON THE HOVER (1b-ii) ──────────────────────────────────
    #    A clock on the LINE is a figure that is wrong one minute later; a fact
    #    the screen does not otherwise state belongs on a hover.
    print("\n3 · when it last saved")
    t = tip(pg)
    ck("the hover says when", t.get("title", "").startswith("Last saved at "), t.get("title"))
    import re as _re
    ck("...as a time of day", bool(_re.search(r"\d{1,2}:\d{2}", t.get("title") or "")), t.get("title"))
    ck("...and the line itself carries no clock",
       not _re.search(r"\d", t.get("word") or ""), t.get("word"))

    # ── 4 · THE WIDTH DOES NOT MOVE (§122.5) ────────────────────────────
    #    Measured as the two words' own boxes rather than as a pixel typed into
    #    this file: the floor is derived from the longest of the three in its
    #    own font, so a change of face keeps this true.
    print("\n4 · the box does not change width as the word changes")
    ck("`Saving…` and `Saved` take the same width",
       saving_w is not None and saving_w == t.get("wordW"),
       "%s vs %s" % (saving_w, t.get("wordW")))

    # ── 5 · `Saved` FADES ───────────────────────────────────────────────
    print("\n5 · and then it gets out of the way")
    pg.wait_for_timeout(6600)
    t = tip(pg)
    ck("it has faded", t.get("shown") is False and t.get("op") == 0, t)
    ck("...without being taken out of the document, so nothing moved",
       t.get("display") != "none", t)
    ck("...and the word it faded on is still what it said", t.get("word") == "Saved", t)

    # ── 6 · `clean` LEAVES IT EXACTLY AS IT IS ──────────────────────────
    #    §170's trailing debounce answers `clean` constantly while somebody
    #    works. Clearing there takes the message away mid-sentence; re-arming
    #    holds a stale `Saved` up for ever. Both ends: the word survives AND
    #    the fade is not undone.
    print("\n6 · a paint with nothing to save changes nothing")
    try:
        pg.evaluate("()=>paint()")
    except Exception:
        pass
    pg.wait_for_timeout(1400)
    t = tip(pg)
    ck("the word is untouched", t.get("word") == "Saved", t)
    ck("...and it is still out of the way", t.get("shown") is False, t)

    # ── 7 · A FAILURE SAYS SO, AND DOES NOT FADE ────────────────────────
    #    Islam's own asymmetry, and the only reason the fade is safe to have:
    #    a save that landed has nothing left to say six seconds later, and one
    #    that did not is the only thing on the screen saying so.
    print("\n7 · a save that did not land")
    POST["status"], POST["delay"] = 500, 0
    change(pg, "tip-fail", 1600)
    t = tip(pg)
    ck("it says the change is not saved", t.get("word") == "Not saved", t)
    ck("...marked as a failure", t.get("state") == "failed", t)
    ck("...in a different ink from a save that landed", t.get("ink") != "", t)
    ck("§53.5 — AND THE BAR THAT EXPLAINS IT IS STILL THERE (§504)",
       "safe on this computer" in banner(pg, "unsaved"), banner(pg, "unsaved") or "(nothing)")
    # AND WHAT KEEPS IT THERE IS THE RETRY, NOT THE FADE'S GUARD — measured
    # rather than assumed (§93.11), because the two are indistinguishable from
    # the screen and I had assumed the guard. `sync.js` retries a save that did
    # not land every five seconds for the life of the page (§160.4), and each
    # retry fails again and re-announces, so a six-second fade can never
    # complete while a failure stands. So `if (state === "saved")` provably
    # does nothing today and is kept with its own comment saying so (§298.2) —
    # which is why `tip-fades-failure` is NOT in this file's break list: a
    # falsification that cannot redden reports 0 red, and that is
    # indistinguishable from a guard that works (§54.5).
    #
    # The assertion is the thing a PERSON gets either way (the message is on
    # screen seven seconds later), with the mechanism asserted beside it or the
    # pair would be true for the wrong reason (§113.8).
    was = POST["n"]
    pg.wait_for_timeout(7000)
    t = tip(pg)
    ck("it is STILL there after the quiet window", t.get("shown") is True, t)
    ck("...still saying the same thing", t.get("word") == "Not saved", t)
    ck("...and the retry is what kept it there, which is why it is still up",
       POST["n"] > was, "%d posts before, %d after" % (was, POST["n"]))

    # ── 8 · A REFUSAL REPORTS HERE TOO (§32 unchanged beside it) ─────────
    print("\n8 · a save the server refuses")
    POST["status"] = 403
    change(pg, "tip-refuse", 1600)
    t = tip(pg)
    ck("it says the change is not saved", t.get("word") == "Not saved", t)
    ck("...and this message does not try to explain why",
       "Super user" not in (t.get("word") or ""), t)
    ck("§32's own banner still carries the server's sentence",
       "Super user" in banner(pg, "refused"), banner(pg, "refused") or "(nothing)")
    ck("...with the way out beside it",
       pg.evaluate("()=>!!document.getElementById('refused-undo')") is True)

    # ── 9 · IT GOES WHEN A SAVE LANDS AGAIN ─────────────────────────────
    print("\n9 · and a save that lands settles it")
    POST["status"] = 200
    change(pg, "tip-ok", 1600)
    t = tip(pg)
    ck("it says the server took it", t.get("word") == "Saved" and t.get("state") == "saved", t)

    # ── 10 · THE FADED PILL TAKES NO CLICKS (§316.5 at the other end) ───
    #     The shown one MUST take them, because the time is on its hover and a
    #     hover needs a pointer; the faded one must not, or an invisible box
    #     would eat clicks at that corner for ever. Both ends, measured as a
    #     hit test rather than as a property (§94.8).
    print("\n10 · what the corner does with a click")
    HIT = """() => { const e = document.getElementById('savetip');
      if (!e) return {there:false};
      const r = e.getBoundingClientRect();
      const el = document.elementFromPoint(r.left + r.width/2, r.top + r.height/2);
      return {there:true, hit: el ? (el.id || el.className || el.tagName) : 'NOTHING',
              mine: !!(el && el.closest && el.closest('#savetip'))}; }"""
    try:
        h = pg.evaluate(HIT)
    except Exception as e:
        h = {"there": False, "err": str(e)}
    ck("while it is shown the pointer reaches it, so the hover works",
       h.get("mine") is True, h)
    pg.wait_for_timeout(6600)
    try:
        h = pg.evaluate(HIT)
    except Exception as e:
        h = {"there": False, "err": str(e)}
    ck("...and once it has faded a click goes straight past it",
       h.get("there") is True and h.get("mine") is False, h)

    # ── 11 · NOT ON A PROJECTOR (§265) ──────────────────────────────────
    #     Measured as PAINT and never as a class: a message that comes and goes
    #     in front of a room costs the room more attention than it saves the
    #     presenter, which is the rule .chatdock already follows.
    print("\n11 · in front of a room")
    change(pg, "tip-deck", 1600)
    t = tip(pg)
    ck("it is painted on an ordinary page", t.get("shown") is True, t)
    try:
        pg.evaluate("()=>document.body.classList.add('presenting')")
    except Exception:
        pass
    pg.wait_for_timeout(200)
    t = tip(pg)
    ck("...and drawn NOWHERE while presenting", t.get("display") == "none", t)
    try:
        pg.evaluate("()=>document.body.classList.remove('presenting')")
    except Exception:
        pass

    # ── 12 · NO SERVER BEHIND THE PAGE ──────────────────────────────────
    #     Nothing was expected to save, so there is nothing to say about
    #     saving (§94.11's condition from the other side).
    print("\n12 · opened from a file")
    pg2 = b.new_page(viewport={"width": 1440, "height": 900})
    pg2.add_init_script("try{sessionStorage.setItem('smp.tour.later','1');"
                        "sessionStorage.setItem('smp.welcome.done','1');}catch(e){}")
    pg2.on("pageerror", lambda e: errs.append("file:// " + str(e)))
    pg2.goto(FILE_URL, wait_until="networkidle")
    pg2.wait_for_timeout(2200)
    change(pg2, "offline-1", 1600)
    t = tip(pg2)
    ck("the message is in the document there too", t.get("there") is True, t)
    ck("...and claims nothing", t.get("hidden") is True and t.get("display") == "none", t)
    pg2.close()
    b.close()
srv.shutdown()

print("\npage errors: %d" % len(errs))
for e in errs[:4]:
    print("   " + e)
print(("\nFAILED: %d" % bad) if (bad or errs) else "\nall good")
raise SystemExit(1 if (bad or errs) else 0)
