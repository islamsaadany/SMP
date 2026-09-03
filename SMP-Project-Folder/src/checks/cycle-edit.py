"""EDITING THE CYCLE THAT IS RUNNING (§261).

Islam: *"allow me to edit the cycle name. give me an edit button the cycle to
edit the date as you already built and the cycel name edit as well"* — and then,
of the two shapes drawn for him: *"keep the close cycle inside the edit. as it's
a critical button to click, the pen should hold everything editable so it's kept
secured."*

WHAT IS ASSERTED, AND WHY IT IS THE PROBLEM RATHER THAN THE LAYOUT (§94.8):

  1 · THE STRIP CARRIES NOTHING THAT CHANGES ANYTHING. One Edit, and NO Close
      the cycle and NO month picker on that line — asserted as absences beside
      the presence, or a build that simply added a button would satisfy every
      "there is an Edit" assertion while leaving the critical button exactly
      where it was (§94.2).

  2 · THE PEN HOLDS ALL FIVE FACTS, and Close the cycle is INSIDE it.

  3 · WHAT IS TYPED REACHES THE CYCLE. Every field driven through the real
      controls and read back off `REVIEW` — never off the screen, which is
      what an editor wired to nothing also shows (§96).

  4 · CANCEL WRITES NOTHING, asserted against the values the draft was opened
      with, so a build that saved on every keystroke fails here.

  5 · CLOSE REFUSES WHILE SOMETHING IS UNSAVED, and says so — pressed for
      real, and the refusal proved by the cycle still being OPEN afterwards.
      Then the same press with nothing unsaved is proved to WORK, or a build
      whose Close is simply broken passes assertion 5 perfectly (§94.2).

  6 · AN EMPTY NAME IS REFUSED, in the words the Open panel already uses.

  7 · THE MONTH IS PICKED IN THE PEN and lands on `REVIEW.asOfMonth`, and
      CLEARING it DELETES the key rather than storing an empty one (§50.6) —
      the difference between a cycle nobody asked and one whose month was
      taken away is a phantom change in every later save.

  8 · IT IS THE OFFICE'S, AND ONLY WHILE THE CYCLE IS OPEN. Both ends: a
      custodian gets no Edit, and a closed cycle offers "Open a new cycle"
      instead — the strip a non-office viewer reads is asserted to carry no
      control at all.

  9 · REOPENING A CLOSED CYCLE (§261.2). Islam picked the pen over a button on
      the strip, so the closed cycle's pen is asserted to hold the five facts
      as VALUES and Reopen at its far end — with the strip asserted to carry NO
      Reopen, or a build that put one there passes every "you can reopen"
      assertion while reversing the decision. The press is driven for real and
      the CYCLE is read back: state open, and a figure enterable again, which
      is the whole point of the feature and the thing a state flag alone does
      not prove. The closing record is asserted TAKEN BACK, because a
      close/reopen/close that left it would list the cycle twice.

 10 · AND NOTHING ELSE ON THE STRIP MOVED: the name, the dates and the
      "N of 12 months" line still read what they read before.
"""
import json, os, pathlib, re, threading, http.server, socketserver
from playwright.sync_api import sync_playwright

HERE = os.path.dirname(os.path.abspath(__file__))
# ── THE CONTRAST MEASURER IS READ OUT OF THE SWEEP, NOT COPIED (§67) ──
# The pen is a state nobody arrives at by NAVIGATING — it takes a press — and a
# sweep that walks pages only ever sees states that are pages (§41.4). So its
# two new inks are measured here, with the sweep's own function pulled out of
# its source: two contrast rules would drift, and the one that drifts is the
# one nobody is looking at.
_SWEEP = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(HERE))),
                      "scripts", "contrast-sweep.py")
CONTRAST_JS = None
if os.path.exists(_SWEEP):
    _m = re.search(r'JS = r"""(.*?)"""', open(_SWEEP).read(), re.S)
    CONTRAST_JS = _m.group(1) if _m else None
URL = "file://" + os.path.join(os.path.dirname(HERE), "strategy-management-platform.html")
fails = []

# ── AND A SAVE CANNOT BE SEEN OVER file:// AT ALL (§94.11, §183) ──────
# `SYNC` is not live there, so every assertion above proves the cycle changed
# IN THE TAB and none of them proves it left it — which is §219's fault
# exactly: a field that writes into the graph and never reaches the database
# looks identical to one that does, until somebody comes back tomorrow. So the
# last section serves the built file with a stub that records what is posted.
_ROOT = pathlib.Path(__file__).resolve().parents[3]
_HTML = pathlib.Path(os.path.join(os.path.dirname(HERE),
                     "strategy-management-platform.html")).read_bytes()
_BASE = json.loads((_ROOT / "db/seed-state.json").read_text())
_PERSON = {"key": "smo", "name": "Mohamed Essam", "role": "super"}
POSTS = []


class _H(http.server.BaseHTTPRequestHandler):
    def log_message(self, *a): pass

    def _s(self, body, ctype="application/json"):
        self.send_response(200); self.send_header("Content-Type", ctype)
        self.send_header("Content-Length", str(len(body))); self.end_headers()
        self.wfile.write(body)

    def do_GET(self):
        if self.path.startswith("/api/state"):
            self._s(json.dumps({"ok": True, "state": _BASE, "person": _PERSON}).encode()); return
        if self.path.startswith("/api/auth"):
            self._s(json.dumps({"ok": True, "person": _PERSON}).encode()); return
        if self.path.startswith("/raya-trade"):
            self._s(_HTML, "text/html; charset=utf-8"); return
        if self.path.startswith("/sw.js"):
            self._s(b"/* stub */", "application/javascript"); return
        self._s(b"<!doctype html><title>gate</title>", "text/html; charset=utf-8")

    def do_POST(self):
        n = int(self.headers.get("Content-Length") or 0)
        raw = self.rfile.read(n)
        if self.path.startswith("/api/state"):
            POSTS.append(raw.decode("utf-8", "replace")); self._s(b'{"ok":true}'); return
        self._s(b'{"ok":true,"unread":0,"threads":[],"chat":{"on":false},'
                b'"states":{},"said":{}}')


class _S(socketserver.ThreadingTCPServer):
    allow_reuse_address = True


_srv = _S(("127.0.0.1", 0), _H)
_port = _srv.server_address[1]
threading.Thread(target=_srv.serve_forever, daemon=True).start()
HTTP_URL = "http://127.0.0.1:%d/raya-trade" % _port


def ok(label, cond, detail=""):
    if cond:
        print("  ok      " + label)
    else:
        fails.append(label)
        print("  FAIL    " + label + ("  — " + str(detail) if detail != "" else ""))


def js(pg, expr, arg=None):
    """A throw is a failure, never the end of the run (§215): this file is
    proved by running it against a build that has none of what it measures."""
    try:
        return pg.evaluate(expr, arg) if arg is not None else pg.evaluate(expr)
    except Exception as e:                                   # noqa: BLE001
        return {"threw": str(e).strip().split("\n")[0]}


def strip_state(pg):
    return js(pg, """() => {
      const h = document.querySelector(".fstrip-head");
      if (!h) return {none:true};
      const vis = el => !!(el && el.getClientRects().length);
      return {
        name:  (h.querySelector(".fstrip-t") || {}).textContent || "",
        meta:  (h.querySelector(".fstrip-meta") || {}).textContent || "",
        asof:  (h.querySelector(".fstrip-meta.asof") || {}).textContent || "",
        edit:  vis(h.querySelector("[data-editcycle]")),
        close: vis(h.querySelector("[data-closecycle]")),
        month: vis(h.querySelector(".monthbtn")),
        opennew: vis(h.querySelector("[data-opencycle]"))
      };
    }""")


def pen_state(pg):
    return js(pg, """() => {
      const p = document.querySelector(".newcycle");
      if (!p) return {none:true};
      const btn = p.querySelector("[data-closecycle]");
      const hold = p.querySelector("[data-ce-hold]");
      return {
        head: (p.querySelector(".nc-h") || {}).textContent || "",
        labels: [...p.querySelectorAll(".nc-grid label > span:first-child")]
                  .map(s => s.textContent.trim()),
        fields: [...p.querySelectorAll(".nc-grid input")].map(i => i.value),
        month: (p.querySelector(".monthbtn .mval") || {}).textContent || "",
        close: !!btn,
        held: btn ? btn.getAttribute("aria-disabled") === "true" : null,
        holdSaid: !!(hold && hold.getClientRects().length),
        holdText: hold ? hold.textContent.trim() : ""
      };
    }""")


def review(pg):
    return js(pg, """() => ({name:REVIEW.name, from:REVIEW.from, to:REVIEW.to,
                            due:REVIEW.due, asOf:REVIEW.asOfMonth,
                            hasAsOf:Object.prototype.hasOwnProperty.call(REVIEW,'asOfMonth'),
                            state:REVIEW.state})""")


def go_cycle(pg, who):
    pg.select_option("#asWho", who); pg.wait_for_timeout(320)
    btn = pg.query_selector(".navmenu-btn")
    if btn:
        btn.click(); pg.wait_for_timeout(600)
    # BOTH, not just the page: over HTTP the gear press can land differently,
    # and a check that navigates by pressing one control and then assumes where
    # it arrived measures whatever page it happens to be on (§50.6).
    js(pg, "() => { current = 'setup'; currentSub = 'cycle'; paint(); }")
    pg.wait_for_timeout(360)


def press(pg, sel, what=None, force=False):
    """EVERY PRESS DEGRADES (§215). The first run of this file against the
    build before it DIED on a missing Edit button and reported 3 failures of
    the 30 it holds — a check that stops at the first absence reports a
    fraction of what it knows, on precisely the build it exists to measure."""
    el = pg.query_selector(sel)
    if not el:
        ok((what or sel) + " is there to press", False, "no " + sel)
        return False
    # §222, already learned once: Playwright treats `aria-disabled` as
    # disabled and waits 30s for it to become enabled — so the ONE press this
    # file exists to make, the refused one, can only be driven with `force`.
    # Without it the check hangs on exactly the build that is behaving.
    el.click(force=force); pg.wait_for_timeout(400)
    return True


def typeinto(pg, sel, value):
    el = pg.query_selector(sel)
    if not el:
        return False
    el.click(); pg.keyboard.press("Control+A"); pg.type(sel, value, delay=8)
    pg.wait_for_timeout(120)
    return True


with sync_playwright() as p:
    b = p.chromium.launch()
    pg = b.new_page(viewport={"width": 1600, "height": 900})
    errs = []
    pg.on("pageerror", lambda e: errs.append(str(e)))
    # §167.2: THE WELCOME SCREEN BLINDS ANY CHECK WRITTEN BEFORE IT. Over
    # file:// it never draws; over HTTP it covers the viewport and intercepts
    # every click, so §11 below fails on a build that is behaving. Suppressed
    # as a RETURNING viewer does, in an init script — set after `goto` it is
    # already too late.
    pg.add_init_script("try{sessionStorage.setItem('smp.tour.later','1');"
                       "sessionStorage.setItem('smp.welcome.done','1');}catch(e){}")
    pg.goto(URL); pg.wait_for_timeout(900)

    # ── 1 · the strip at rest ────────────────────────────────────────
    print("\n── 1 · the strip carries nothing that changes anything ──")
    go_cycle(pg, "smo")
    before = strip_state(pg)
    r0 = review(pg)
    ok("the office is offered Edit", before.get("edit") is True, before)
    ok("Close the cycle has LEFT the strip", before.get("close") is False, before)
    ok("and so has the month picker", before.get("month") is False, before)
    ok("the name still reads what it read", (before.get("name") or "").strip() == r0.get("name"),
       before.get("name"))
    ok("the dates still read what they read",
       "to" in (before.get("meta") or "") and "due" in (before.get("meta") or ""),
       before.get("meta"))
    ok("and the review point still says what it means",
       "of 12 months" in (before.get("asof") or ""), before.get("asof"))

    # ── 2 · the pen holds all five, Close included ───────────────────
    print("\n── 2 · the pen holds everything editable ──")
    press(pg, "[data-editcycle]", "Edit")
    pen = pen_state(pg)
    ok("the pen opens", pen.get("head", "").lower() == "edit this cycle", pen.get("head"))
    ok("it asks for all five facts",
       [s.lower() for s in (pen.get("labels") or [])] ==
       ["name", "covers from", "to", "reports due", "reporting as of"], pen.get("labels"))
    ok("filled from the cycle, not empty",
       (pen.get("fields") or [None])[0] == r0.get("name"), pen.get("fields"))
    ok("Close the cycle is INSIDE the pen", pen.get("close") is True, pen)
    ok("and nothing is held back yet", pen.get("held") is False and pen.get("holdSaid") is False,
       pen)

    # ── 5 · Close refuses over an unsaved change ─────────────────────
    print("\n── 5 · Close refuses while something is unsaved, and says why ──")
    typeinto(pg, "#ce-name", "H2 2026 renamed")
    held = pen_state(pg)
    ok("typing holds Close back at once, with no repaint", held.get("held") is True, held)
    ok("and the sentence says why", "save or cancel" in (held.get("holdText") or "").lower(),
       held.get("holdText"))
    press(pg, ".newcycle [data-closecycle]", "Close the cycle in the pen", force=True)
    ok("pressing it closes nothing", review(pg).get("state") == "open", review(pg))
    ok("and the pen is still open", pen_state(pg).get("head", "").lower() == "edit this cycle")

    # Edit stays on the strip while the pen is open, so pressing it again must
    # not hand back a fresh draft over what is being typed.
    press(pg, "[data-editcycle]", "Edit")
    ok("a second press on Edit keeps the draft",
       (pen_state(pg).get("fields") or [None])[0] == "H2 2026 renamed",
       pen_state(pg).get("fields"))

    # ── 3 · what is typed reaches the cycle ──────────────────────────
    print("\n── 3 · Save writes the name and every date ──")
    typeinto(pg, "#ce-from", "Feb 2026")
    typeinto(pg, "#ce-to", "Jul 2026")
    typeinto(pg, "#ce-due", "20 Aug 2026")
    press(pg, "[data-ce-save]", "Save")
    saved = review(pg)
    ok("the name landed", saved.get("name") == "H2 2026 renamed", saved)
    ok("Covers from landed", saved.get("from") == "Feb 2026", saved)
    ok("to landed", saved.get("to") == "Jul 2026", saved)
    ok("Reports due landed", saved.get("due") == "20 Aug 2026", saved)
    ok("the pen shut", pen_state(pg).get("none") is True)
    ok("and the strip says the new name",
       (strip_state(pg).get("name") or "").strip() == "H2 2026 renamed", strip_state(pg))

    # ── 4 · Cancel writes nothing ────────────────────────────────────
    print("\n── 4 · Cancel writes nothing ──")
    press(pg, "[data-editcycle]", "Edit")
    typeinto(pg, "#ce-name", "thrown away")
    typeinto(pg, "#ce-due", "nonsense")
    press(pg, "[data-ce-cancel]", "Cancel")
    after = review(pg)
    ok("the name is untouched", after.get("name") == "H2 2026 renamed", after)
    ok("and so is the due date", after.get("due") == "20 Aug 2026", after)
    ok("and the pen shut", pen_state(pg).get("none") is True)

    # ── 6 · an empty name is refused ─────────────────────────────────
    print("\n── 6 · an empty name is refused, in the Open panel's words ──")
    # ONE dialog handler for the whole run, with a mode (§53.5 in a check):
    # two of them meant §6's `dismiss` answered the confirm §5b was about to
    # accept, and the second handler then threw on an already-handled dialog.
    said, accepting = [], {"on": False}

    def on_dialog(d):
        said.append(d.message)
        d.accept() if accepting["on"] else d.dismiss()

    pg.on("dialog", on_dialog)
    press(pg, "[data-editcycle]", "Edit")
    typeinto(pg, "#ce-name", " ")
    press(pg, "[data-ce-save]", "Save")
    ok("it says what a name is for", any("filed under" in m for m in said), said)
    ok("and the name is not blanked", review(pg).get("name") == "H2 2026 renamed", review(pg))

    # ── 7 · the month, picked in the pen, and CLEARED to an absence ──
    print("\n── 7 · the month is picked in the pen, and clearing it deletes the key ──")
    typeinto(pg, "#ce-name", "H2 2026 renamed")
    press(pg, ".newcycle .monthbtn", "the month picker in the pen")
    picked = js(pg, """() => {
      const pop = document.querySelector(".monthpop");
      if (!pop) return {threw:"no month panel"};
      const m = pop.querySelectorAll("[data-mpick]")[2];   /* Mar */
      m.click();
      return {picked:true};
    }""")
    pg.wait_for_timeout(320)
    ok("a month can be picked", picked.get("picked") is True, picked)
    press(pg, "[data-ce-save]", "Save")
    got = review(pg)
    ok("and it lands on the cycle", (got.get("asOf") or "").startswith("Mar"), got)
    press(pg, "[data-editcycle]", "Edit")
    press(pg, ".newcycle .monthbtn", "the month picker in the pen")
    js(pg, """() => { document.querySelector(".monthpop [data-mclear]").click(); }""")
    pg.wait_for_timeout(320)
    press(pg, "[data-ce-save]", "Save")
    cleared = review(pg)
    ok("cleared, the key is DELETED and not emptied", cleared.get("hasAsOf") is False, cleared)
    ok("and the strip falls back rather than reading Missing",
       "Missing" not in (strip_state(pg).get("asof") or ""), strip_state(pg).get("asof"))

    # ── 5b · with nothing unsaved, Close WORKS ───────────────────────
    print("\n── 5b · and with nothing unsaved the same press closes the cycle ──")
    press(pg, "[data-editcycle]", "Edit")
    st = pen_state(pg)
    ok("Close is live again", st.get("held") is False and st.get("holdSaid") is False, st)
    accepting["on"] = True
    press(pg, ".newcycle [data-closecycle]", "Close the cycle in the pen")
    ok("the cycle closes", review(pg).get("state") == "closed", review(pg))
    shut = strip_state(pg)
    ok("the pen goes with it", pen_state(pg).get("none") is True)
    # REWRITTEN, NOT DELETED (§218). §261 asserted a closed cycle offers Open a
    # new cycle and NOT Edit, which was true until §261.2 gave the closed cycle
    # the pen as well — Islam's pick over a Reopen button on the strip. Both are
    # asserted, because a build that dropped either would satisfy a test for the
    # other on its own.
    ok("and a closed cycle offers BOTH Open a new cycle and the pen (§261.2)",
       shut.get("opennew") is True and shut.get("edit") is True, shut)

    # ── 9 · reopening a closed cycle ─────────────────────────────────
    print("\n── 9 · a closed cycle is reopened from the platform's dialog (§261.3) ──")
    # REWRITTEN, NOT DELETED (§218). §261.2 drew the record as a band under the
    # strip and this asserted its five values; Islam saw that on his own tenant
    # — "the design is very poor" — and the fault was the SHAPE: a band of facts
    # under a band of the same facts, every one of them already on the line
    # above. He picked the dialog from three drawn shapes. What is asserted is
    # unchanged in substance: the strip carries no Reopen, the act is behind the
    # pen, and pressing it reaches the CYCLE.
    shut2 = strip_state(pg)
    ok("the strip carries no Reopen",
       js(pg, "()=>!document.querySelector('.fstrip-head [data-reopenyes]')") is True, shut2)
    ok("...and it still offers Edit and Open a new cycle",
       shut2.get("edit") is True and shut2.get("opennew") is True, shut2)
    hist0 = js(pg, "()=>({n:HISTORY.length, last:(HISTORY[HISTORY.length-1]||{}).name})")
    press(pg, "[data-editcycle]", "Edit")
    dlg = js(pg, """() => {
      const ov = document.querySelector(".overlay.on, #overlay.on");
      const b = document.getElementById("modal-b");
      if (!b || !b.querySelector(".sendconfirm")) return {none:true};
      return {
        title: (document.getElementById("modal-t") || {}).textContent || "",
        keys: [...b.querySelectorAll(".kv .k")].map(k => k.textContent.trim()),
        vals: [...b.querySelectorAll(".kv span:not(.k)")].map(k => k.textContent.trim()),
        yes: !!b.querySelector("[data-reopenyes]"),
        no: !!b.querySelector("[data-reopenno]"),
        band: !!document.querySelector(".fstrip .newcycle"),
        inert: !!(ov || document.querySelector('[aria-hidden="true"].wrap, .wrap[inert]'))
      };
    }""")
    ok("the pen opens the platform's dialog", dlg.get("none") is not True, dlg)
    # `A and B or A` collapses to `A` — written that way first, so the cycle's
    # name was never actually asserted. Both halves, and the name read off the
    # DATA rather than hardcoded (§94.8).
    _t = (dlg.get("title") or "").lower()
    ok("...titled with the act and the cycle by name",
       "reopen" in _t and (review(pg).get("name") or "").lower() in _t, dlg.get("title"))
    ok("...and NO band is drawn on the page (§261.3)", dlg.get("band") is False, dlg)
    # THE ONE FACT THAT IS NOT ON THE STRIP is why the dialog carries a record
    # at all — asserted by name, or a dialog that only repeated the strip would
    # pass every "there is a dialog" assertion.
    ok("it leads on what the cycle closed at",
       "Closed at" in (dlg.get("keys") or []), dlg.get("keys"))
    ok("...and says what reopening does",
       any("become live again" in v for v in (dlg.get("vals") or [])), dlg.get("vals"))
    ok("it offers both a way on and a way out",
       dlg.get("yes") is True and dlg.get("no") is True, dlg)
    # CANCEL CHANGES NOTHING, asserted before the press that does.
    press(pg, "[data-reopenno]", "Cancel")
    ok("Cancel closes it and reopens nothing", review(pg).get("state") == "closed", review(pg))
    press(pg, "[data-editcycle]", "Edit")
    press(pg, "[data-reopenyes]", "Reopen")
    pg.wait_for_timeout(500)
    back = review(pg)
    ok("the cycle is open again", back.get("state") == "open", back)
    hist1 = js(pg, "()=>({n:HISTORY.length, last:(HISTORY[HISTORY.length-1]||{}).name})")
    ok("the closing record was taken back",
       hist1.get("n") == hist0.get("n", 0) - 1, (hist0, hist1))
    # THE POINT OF THE FEATURE, and a state flag alone does not prove it: the
    # reporting gates open with `state !== "open"` before any role test, so
    # this is what "its figures become live again" actually means.
    ok("...and figures can be entered again",
       js(pg, "()=>canReport('mobile')") is True,
       js(pg, "()=>({s:REVIEW.state, can:canReport('mobile')})"))
    ok("and the strip is back to one control",
       strip_state(pg).get("opennew") is False and strip_state(pg).get("edit") is True,
       strip_state(pg))

    # ORDER IS LOAD-BEARING: §8 reloads the page to switch viewer, so anything
    # measuring the closed cycle has to run BEFORE it. Written after §8 first,
    # and every probe answered `{none:true}` — a custodian cannot reach this
    # page at all, so it was measuring a page that was not there (§50.6).
    # ── 8 · it is the office's ───────────────────────────────────────
    print("\n── 8 · a custodian gets no control on that strip at all ──")
    pg.goto(URL); pg.wait_for_timeout(900)
    who = js(pg, """() => [...document.querySelectorAll("#asWho option")].map(o => o.value)""")
    pick = next((w for w in who if "cust" in w or "own" in w), None)
    ok("there is somebody to ask as", bool(pick), who)
    if pick:
        pg.select_option("#asWho", pick); pg.wait_for_timeout(360)
        # THE PAGE ITSELF IS THE FIRST ANSWER, and it is the stronger one: the
        # Reporting cycle page is gated on `c_cycle`, so a custodian never
        # reaches this strip. Asserted through the platform's own reachability
        # rather than by failing to find a button (§94.8).
        seen = js(pg, """() => ({ grant: grant("c_cycle"),
                                  reach: typeof reachable === "function"
                                           ? !!reachable("cycle") : null })""")
        ok("the Reporting cycle page is not theirs", seen.get("grant") != "edit", seen)
        # AND THE RENDERER DRAWS THEM NOTHING EITHER, measured by rendering the
        # page into a probe: reachability and what the page would hold are two
        # questions, and only asking both proves the gate is on the control.
        drawn = js(pg, """() => {
          const box = document.createElement("div");
          box.innerHTML = renderCycle();
          const r = { edit: !!box.querySelector("[data-editcycle]"),
                      close: !!box.querySelector("[data-closecycle]"),
                      month: !!box.querySelector(".monthbtn"),
                      name: (box.querySelector(".fstrip-t") || {}).textContent || "" };
          return r;
        }""")
        ok("no Edit", drawn.get("edit") is False, drawn)
        ok("no Close the cycle", drawn.get("close") is False, drawn)
        ok("no month picker", drawn.get("month") is False, drawn)
        ok("and the cycle still reads", bool((drawn.get("name") or "").strip()), drawn)

    # ── 10 · the pen's two new inks, in both themes ──────────────────
    print("\n── 10 · the pen reads in both palettes ──")
    ok("the sweep's own measurer could be read", CONTRAST_JS is not None, _SWEEP)
    if CONTRAST_JS:
        pg.goto(URL); pg.wait_for_timeout(900)
        go_cycle(pg, "smo")
        press(pg, "[data-editcycle]", "Edit")
        typeinto(pg, "#ce-name", "held back")       # the held state is the point
        for theme in ("light", "dark"):
            js(pg, "(t) => document.documentElement.setAttribute('data-theme', t)", theme)
            pg.wait_for_timeout(220)
            bad = js(pg, CONTRAST_JS, ".newcycle")
            ok("the pen passes contrast in " + theme, bad == [], bad)
        js(pg, "() => document.documentElement.removeAttribute('data-theme')")
        pg.wait_for_timeout(150)

    # ── 11 · and the save LEAVES the tab ─────────────────────────────
    print("\n── 11 · Save reaches the server, not only the screen ──")
    pg.goto(HTTP_URL); pg.wait_for_timeout(1400)
    # NOT `go_cycle`: switching viewer re-opens the welcome screen by design
    # (§237 — a view-as session starts where their session would start, and it
    # deliberately never marks the screen seen), and that overlay then eats
    # every click (§167.2). The stub signs in as the office already, so there
    # is nobody to switch to.
    js(pg, "() => { current = 'setup'; currentSub = 'cycle'; paint(); }")
    pg.wait_for_timeout(400)
    POSTS.clear()
    press(pg, "[data-editcycle]", "Edit")
    typeinto(pg, "#ce-name", "H2 2026 posted")
    press(pg, "[data-ce-save]", "Save")
    pg.wait_for_timeout(1800)
    ok("a save was posted", len(POSTS) > 0, len(POSTS))
    ok("...and it carries the new name",
       any("H2 2026 posted" in b for b in POSTS),
       [b[:160] for b in POSTS][:2])

    ok("no page error anywhere in the run", not errs, errs[:3])
    b.close()

print("\n" + ("ALL GREEN" if not fails else str(len(fails)) + " FAILED"))
for f in fails:
    print("  · " + f)
