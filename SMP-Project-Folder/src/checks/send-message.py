"""THE COMPOSER STAYS ONE SCREEN (§95).

Islam: "the send message needs a reform for a better user experience."

The page grew a chip per recipient, so the audience — the one part of it that
is not a fixed size — pushed everything below it down: at seventy-six people
the Send button sat most of a screen under the message it belongs to, and the
drafts and the record of what had been sent were further down again.

WHY THIS CHECK CANNOT LIVE IN `qa.py`. Every other screen check opens the built
file over `file://`, where `SYNC.isLive()` is false — and this whole page is
gated on a server: the audience is resolved by one (§74.2), and the drafts and
the sent list are its records. Opened from a file the page says "there is no
server here to send from" and every measurement below is of an empty screen
(§45.2, and §51.11 is what it becomes if nobody notices). So it serves the
built file with a stub that answers the four calls this page makes.

THE ONE THING IT DELIBERATELY DOES NOT MEASURE is the resolver. Who a set of
criteria comes to is `lib/audience.js`'s answer and is tested against a real
register elsewhere; a stub that reproduced it would be a second copy of a rule
(§42). What is measured here is what the page DOES with the answer, which is
the whole of what was asked for.
"""
import json, pathlib, re, threading, http.server, socketserver
from playwright.sync_api import sync_playwright

# ── THE TOUR IS NOT WHAT THIS FILE MEASURES (§107, §108.16) ──────────────
# The onboarding tour auto-opens for a first-time viewer over HTTP, and its
# dim layer covers the page — so every click here lands on `#tdim` and times
# out. Suppressed as a RETURNING VIEWER would have it (the tour's own
# "Skip for now" session flag), never by deleting or disabling the tour:
# the tour has its own check, and a suppression that reached into its
# internals would be this file quietly asserting the tour away.
def _no_tour(pg):
    pg.add_init_script("try{sessionStorage.setItem('smp.tour.later','1');}catch(e){}")


ROOT = pathlib.Path(__file__).resolve().parents[3]
HTML = (ROOT / "SMP-Project-Folder/src/strategy-management-platform.html").read_bytes()
STATE = json.loads((ROOT / "db/seed-state.json").read_text())

# THE COUNT IS THE POINT. Seventy-six is not a round number chosen for effect —
# it is roughly what a group-wide send comes to on this tenant, and it is the
# size at which a chip per recipient stopped fitting on a screen at all.
TO = [{"key": "p%d" % i, "name": "Person %d" % i, "email": "p%d@example.com" % i}
      for i in range(1, 77)]
# Three, with ONE shared reason, so the line can say it once (§95). The names
# are what the disclosure is for.
SKIPPED = [{"key": "s%d" % i, "name": "Skipped %d" % i, "why": "no address on their row"}
           for i in range(1, 4)]

# The signed-in person needs an address on the register or "Send me a copy" has
# nowhere to go — which is itself one of the cases below.
for p in STATE.get("people", []):
    if p.get("key") == "smo":
        p["email"] = "smo@example.com"

PERSON = {"key": "smo", "name": "Mohamed Essam", "role": "super"}
DRAFTS = [{"id": 1, "subject": "Half-written", "updated_at": "2026-08-25T09:10:00"},
          {"id": 2, "subject": "Also half-written", "updated_at": "2026-08-24T17:02:00"}]
# The shape `api/mail.js` actually returns for `history`, field for field — a
# stub that carried only the fields I happened to think of made the page render
# "44 of 0" and an empty By column, and a check written against that would have
# been asserting the stub rather than the product (§51.11's shape, in the
# fixture rather than in the selector).
SENT = [{"id": 9, "subject": "Last week's cycle", "sent_at": "2026-08-18T08:00:00",
         "sent": 44, "failed": 3, "total": 47, "by_name": "Mohamed Essam"}]

MAILED = []            # what the stub was actually asked to send
bad, errs = 0, []

# ── THE CONTRAST MEASURER IS READ OUT OF THE SWEEP, NOT COPIED ───────
# `scripts/contrast-sweep.py` walks every Setup page — including this one — and
# it opens the built file over `file://`, where there is no server, so what it
# scans here is the empty state: no counts, no capsules, no dropdown panels, no
# confirmation. §45.2's fault, and the sweep has been reporting this page clean
# for as long as the page has existed.
#
# So the surfaces this version added are measured HERE, where they exist, with
# the sweep's OWN function — pulled out of its source the way
# `test-clean-parity.js` reads `clearedGraph()` out of the platform rather than
# holding a copy (§67). Two contrast rules would drift, and the one that drifts
# is always the one nobody is looking at.
_SWEEP = (ROOT / "scripts/contrast-sweep.py").read_text()
_m = re.search(r'JS = r"""(.*?)"""', _SWEEP, re.S)
CONTRAST_JS = _m.group(1) if _m else None


def ck(w, ok, x=""):
    global bad
    if not ok:
        bad += 1
    print(("  ok      " if ok else "  FAIL    ") + w + (("  — " + str(x)) if not ok and x else ""))


class H(http.server.BaseHTTPRequestHandler):
    def log_message(self, *a):
        pass

    def _send(self, code, body, ctype):
        self.send_response(code)
        self.send_header("Content-Type", ctype)
        self.send_header("Content-Length", str(len(body)))
        self.end_headers()
        self.wfile.write(body)

    def _json(self, o):
        self._send(200, json.dumps(o).encode(), "application/json")

    def do_GET(self):
        if self.path.startswith("/api/state"):
            return self._json({"ok": True, "state": STATE, "person": PERSON})
        if self.path.startswith("/raya-trade"):
            return self._send(200, HTML, "text/html; charset=utf-8")
        return self._send(200, b"<!doctype html><title>Sign in</title>", "text/html; charset=utf-8")

    def do_POST(self):
        n = int(self.headers.get("Content-Length") or 0)
        try:
            body = json.loads(self.rfile.read(n) or b"{}")
        except Exception:
            body = {}
        a = body.get("action")
        if self.path.startswith("/api/mail"):
            if a == "status":
                return self._json({"ok": True, "key": True, "from": "smp@example.com",
                                   "domain": "example.com", "verified": True})
            if a == "audience":
                return self._json({"ok": True, "to": TO, "skipped": SKIPPED,
                                   "active": len(TO) + len(SKIPPED),
                                   "withAddress": len(TO)})
            if a == "draftList":
                return self._json({"ok": True, "drafts": DRAFTS})
            if a == "history":
                return self._json({"ok": True, "messages": SENT})
            if a in ("send", "test"):
                MAILED.append(body)
                return self._json({"ok": True, "sent": len(TO), "failed": 0})
        if self.path.startswith("/api/state"):
            return self._json({"ok": True})
        return self._json({"ok": True})


srv = socketserver.ThreadingTCPServer(("127.0.0.1", 0), H)
srv.daemon_threads = True
PORT = srv.server_address[1]
threading.Thread(target=srv.serve_forever, daemon=True).start()
URL = "http://127.0.0.1:%d/raya-trade" % PORT


# ── WHAT IS ON SCREEN, MEASURED ──────────────────────────────────────
# `elementFromPoint` at a control's own centre, never "the element exists":
# §90 and §93.4 are both controls that were present, styled and enabled while
# hitting BODY, and neither would have failed a query for them.
READ = """() => {
  const box = (s) => { const e = document.querySelector(s);
                       return e ? e.getBoundingClientRect() : null; };
  const hits = (s) => {
    const e = document.querySelector(s); if (!e) return null;
    const r = e.getBoundingClientRect();
    if (!r.width || !r.height) return "no box";
    const at = document.elementFromPoint(r.left + r.width / 2, r.top + r.height / 2);
    return at ? (at === e || e.contains(at) || at.contains(e) ? "itself" : at.tagName) : "nothing";
  };
  const send = document.getElementById("msgsend");
  return {
    sendLabel: send ? send.textContent.trim() : null,
    sendHits: hits("#msgsend"),
    sendBox: box("#msgsend"),
    barPos: (() => { const b = document.querySelector(".sendbar");
                     return b ? getComputedStyle(b).position : null; })(),
    barBg: (() => { const b = document.querySelector(".sendbar");
                    return b ? getComputedStyle(b).backgroundColor : null; })(),
    /* THE LOUDNESS ORDER, not the position (§94.8's rewritten check): Send is
       the one solid fill on this page and the others are quiet beside it. */
    fills: ["#msgsend", "#msgdraft", "#msgtestme"].map((s) => {
      const e = document.querySelector(s);
      return e ? getComputedStyle(e).backgroundColor : null; }),
    testDisabled: (() => { const e = document.getElementById("msgtestme");
                           return e ? e.disabled : null; })(),
    /* Names are a DISCLOSURE. Counting the chips is how "bounded" is measured;
       the height of the audience block is how it is felt. */
    chips: document.querySelectorAll(".audnamebox .chip").length,
    audText: (() => { const e = document.querySelector(".audsum");
                      return e ? e.textContent.replace(/\\s+/g, " ").trim() : null; })(),
    audH: (() => { const e = document.getElementById("audout");
                   return e ? Math.round(e.getBoundingClientRect().height) : null; })(),
    moreLabel: (() => { const e = document.querySelector("[data-audnames]");
                        return e ? e.textContent.trim() : null; })(),
    draftBtn: (() => { const e = document.querySelector("[data-draftmenu]");
                       return e ? e.textContent.replace(/\\s+/g, " ").trim() : null; })(),
    sentBtn: (() => { const e = document.querySelector("[data-sentmenu]");
                      return e ? e.textContent.replace(/\\s+/g, " ").trim() : null; })(),
    draftHits: hits("[data-draftmenu]"),
    /* A section in the page body called Drafts or Sent would mean the move
       never happened — a removal is the easiest thing to half-do (§90). */
    bodySecs: Array.from(document.querySelectorAll("#panel .section h2"))
                   .map((h) => h.textContent.trim()),
    ctaRow: !!document.querySelector(".ctarow #msgctalabel"),
    /* SHOWN, not merely present. `closeModal()` drops a class and leaves the
       markup where it is (§3.2, §48.3) — asking whether the element exists
       calls a dialog that is still on screen closed, and a closed one open. */
    modal: (() => {
      const e = document.querySelector(".sendconfirm"); if (!e) return false;
      const ov = e.closest("#modal, .modal-overlay, [aria-hidden]");
      return e.getClientRects().length > 0 &&
             (!ov || ov.getAttribute("aria-hidden") !== "true");
    })(),
    modalText: (() => { const e = document.querySelector(".sendconfirm");
                        return e ? e.textContent.replace(/\\s+/g, " ").trim() : null; })(),
    said: (() => { const e = document.getElementById("msgsaid");
                   return e ? e.textContent.trim() : null; })(),
    /* §93.11: A DECLARATION THAT PROVABLY MATCHES CAN PROVABLY DO NOTHING when
       the parser threw the block away. Ask the browser what rules it holds. */
    rules: (() => {
      const want = [".audsum", ".sendbar", ".ctarow", ".hcount",
                    ".hmenu-panel.wide", ".sendconfirm .kv"];
      const have = {}; want.forEach((w) => { have[w] = false; });
      for (const sh of document.styleSheets) {
        let rs; try { rs = sh.cssRules; } catch (e) { continue; }
        for (const r of rs) if (r.selectorText)
          want.forEach((w) => { if (r.selectorText.split(",").some(
            (s) => s.trim() === w)) have[w] = true; });
      }
      return have;
    })()
  };
}"""


def go():
    global bad
    with sync_playwright() as pw:
        br = pw.chromium.launch()
        pg = br.new_page(viewport={"width": 1440, "height": 900})
        _no_tour(pg)
        pg.on("console", lambda m: errs.append(m.text) if m.type == "error" else None)
        pg.on("pageerror", lambda e: errs.append(str(e)))
        pg.goto(URL)
        pg.wait_for_selector("nav.units", timeout=15000)

        # Setup › Send a message, reached the way somebody reaches it.
        pg.click('#units [data-md="setup"]')
        pg.wait_for_timeout(400)
        for g in pg.eval_on_selector_all(".setuprail .rgroup.shut",
                                         "e=>e.map(x=>x.dataset.railgrp)"):
            pg.click('.setuprail [data-railgrp="%s"]' % g)
            pg.wait_for_timeout(70)
        pg.click('.setuprail [data-setupgo="send"]')
        pg.wait_for_timeout(900)
        if not pg.query_selector("#msgsend"):
            ck("the page opens", False, "no send button")
            return
        ck("the page opens", True)

        # Every rule this version added is one the browser actually holds.
        r = pg.evaluate(READ)
        missing = [k for k, v in r["rules"].items() if not v]
        ck("every new rule is in the stylesheet the browser holds", not missing, missing)

        # ── THE AUDIENCE IS A SUMMARY ────────────────────────────────
        pg.evaluate("() => { sendmsg().criteria.everyone = true; sendmsgAsk(); paint(); }")
        pg.wait_for_timeout(900)
        r = pg.evaluate(READ)
        ck("76 recipients render no chips until asked for", r["chips"] == 0, r["chips"])
        ck("the counts are on the line", "76" in (r["audText"] or "") and
           "3" in (r["audText"] or ""), r["audText"])
        # THE SKIPPED COUNT IS NEVER BEHIND THE DISCLOSURE — the fault that
        # started this whole thread was three people silently missed (§93.15).
        ck("skipped is said without opening anything",
           "Skipped" in (r["audText"] or ""), r["audText"])
        ck("and it says why, once, when they share a reason",
           "no address on their row" in (r["audText"] or ""), r["audText"])
        # A summary that is taller than a handful of lines is a list again.
        ck("the block stays small", r["audH"] is not None and r["audH"] < 140, r["audH"])

        pg.click("[data-audnames]")
        pg.wait_for_timeout(300)
        r2 = pg.evaluate(READ)
        ck("showing the names shows all 79", r2["chips"] == 79, r2["chips"])
        ck("and the button says how to put them away",
           r2["moreLabel"] == "Hide the names", r2["moreLabel"])
        pg.click("[data-audnames]")
        pg.wait_for_timeout(300)
        ck("and they go away again", pg.evaluate(READ)["chips"] == 0)

        # THE COUNT ARRIVES WITH THE ANSWER, NOT WITH THE NEXT REPAINT. The
        # answer is written into the page by `paintAudience()`, which does not
        # call `paint()` — so the button that has to carry the number is the one
        # control a full repaint would have fixed and this never touches (§95).
        # Asked here, before anything else on this page repaints, or the
        # measurement is of the repaint rather than of the answer.
        # THE HEADER CHIP IS GONE (§130.1). Islam: "remove the tag SMO and
        # nobody chosen." The count was being said twice, and §95 had already
        # settled which of the two matters — the control that ACTS. So what is
        # asserted is that it is gone AND that the Send button still carries the
        # number: a build that dropped both would otherwise pass the removal.
        ck("the header no longer says it a second time",
           not pg.evaluate("()=>!!document.querySelector('[data-audcount]')"))
        ck("and the Send button already carries the count",
           pg.evaluate(READ)["sendLabel"] == "Send to 76 people",
           pg.evaluate(READ)["sendLabel"])

        # ── THE BAR ─────────────────────────────────────────────────
        pg.evaluate("""() => {
          document.getElementById('msgprev'); sendmsg().subject = 'A subject';
          sendmsg().body = 'Something in it.'; paint(); }""")
        pg.wait_for_timeout(300)
        r = pg.evaluate(READ)
        ck("the button says what it will do",
           r["sendLabel"] == "Send to 76 people", r["sendLabel"])
        ck("the bar is pinned, not at the end of the scroll",
           r["barPos"] == "sticky", r["barPos"])
        ck("and it has an opaque ground of its own",
           r["barBg"] not in (None, "rgba(0, 0, 0, 0)"), r["barBg"])
        ck("Send is the one solid fill",
           r["fills"][0] != r["fills"][1] and r["fills"][1] == r["fills"][2], r["fills"])
        ck("Send me a copy is live once there is something to copy",
           r["testDisabled"] is False, r["testDisabled"])

        # AT THE TOP AND AT THE BOTTOM. The complaint was that the button moved
        # away from the message; a sticky bar that is only reachable at one
        # scroll position has not fixed it.
        for where, js in (("at the top", "window.scrollTo(0,0)"),
                          ("scrolled to the end",
                           "window.scrollTo(0,document.body.scrollHeight)")):
            pg.evaluate(js)
            pg.wait_for_timeout(250)
            h = pg.evaluate(READ)
            ck("the Send button is pressable " + where, h["sendHits"] == "itself",
               h["sendHits"])

        # ── DRAFTS AND SENT LEFT THE SCROLL ─────────────────────────
        r = pg.evaluate(READ)
        ck("Drafts is a header button carrying its count",
           r["draftBtn"] and r["draftBtn"].startswith("Drafts") and "2" in r["draftBtn"],
           r["draftBtn"])
        ck("Sent is too", r["sentBtn"] and r["sentBtn"].startswith("Sent") and
           "1" in r["sentBtn"], r["sentBtn"])
        # MEASURED AT THE TOP. The page was scrolled to the end a moment ago,
        # and elementFromPoint answers about the VIEWPORT — a header button
        # off-screen reports as unreachable, which is the check being wrong
        # rather than the product (§68.10's fault, in miniature).
        pg.evaluate("window.scrollTo(0,0)")
        pg.wait_for_timeout(200)
        ck("and it is pressable", pg.evaluate(READ)["draftHits"] == "itself",
           pg.evaluate(READ)["draftHits"])
        # BOTH ENDS (§90): gone from the page, present in the header.
        ck("neither is a section in the page any more",
           "Drafts" not in r["bodySecs"] and "Sent" not in r["bodySecs"], r["bodySecs"])
        ck("the button is a row under the composer, not a section of its own",
           r["ctaRow"] and "A button" not in " ".join(r["bodySecs"]), r["bodySecs"])

        # NOTHING IN EITHER PANEL IS CUT OFF WITHOUT A HOVER. §88's 150px cell
        # cap is deliberately off inside a panel (§95.5) — these tables are
        # fixed-layout with an explicit share per column, so a cell cannot hold
        # one open — and a heading clipped to "Half-wri…" is a draft nobody can
        # tell from the next one.
        clipped = """() => { const t = document.querySelector(".hmenu-panel.wide table");
          if (!t) return null;
          return [...t.querySelectorAll("td,th")]
                 .filter((c) => c.scrollWidth > c.clientWidth + 1 && !c.title)
                 .map((c) => c.textContent.trim().slice(0, 24)); }"""
        pg.click("[data-draftmenu]")
        pg.wait_for_timeout(300)
        ck("the drafts open in the header",
           pg.evaluate("() => !!document.querySelector('.hmenu-panel.wide [data-draftopen]')"))
        cl = pg.evaluate(clipped)
        ck("and nothing in them is cut off without a hover", cl == [], cl)
        pg.keyboard.press("Escape")
        pg.wait_for_timeout(250)
        ck("and Escape closes them",
           pg.evaluate("() => !document.querySelector('.hmenu-panel.wide')"))
        pg.click("[data-sentmenu]")
        pg.wait_for_timeout(300)
        cl = pg.evaluate(clipped)
        ck("nor in the sent list", cl == [], cl)
        # The row is the way in to who got it (§93.15) — a record nothing opens
        # is the fault that section exists to fix.
        ck("and its row opens what happened to each person",
           pg.evaluate("() => !!document.querySelector('.hmenu-panel.wide [data-sentone]')"))
        pg.keyboard.press("Escape")
        pg.wait_for_timeout(250)

        # ── THE CONFIRMATION IS THE PLATFORM'S OWN ──────────────────
        pg.evaluate("window.scrollTo(0,0)")
        pg.click("#msgsend")
        pg.wait_for_timeout(400)
        r = pg.evaluate(READ)
        ck("Send asks first, in the platform's own dialog", r["modal"])
        ck("and the dialog names who will NOT get it",
           "Skipped 1" in (r["modalText"] or ""), (r["modalText"] or "")[:160])
        ck("and says there is no undo", "No undo" in (r["modalText"] or ""))
        n_before = len(MAILED)
        pg.click("[data-sendno]")
        pg.wait_for_timeout(300)
        ck("Cancel sends nothing", len(MAILED) == n_before)
        ck("and the dialog goes", not pg.evaluate(READ)["modal"])

        # ── SEND ME A COPY ──────────────────────────────────────────
        pg.click("#msgtestme")
        pg.wait_for_timeout(600)
        test = [m for m in MAILED if m.get("action") == "test"]
        ck("Send me a copy sends exactly one", len(test) == 1, len(test))
        if test:
            # IT GOES TO THE PERSON SIGNED IN, and it is the real message: a
            # preview of something else is not a preview.
            ck("to the signed-in person's own address",
               test[0].get("to") == "smo@example.com", test[0].get("to"))
            ck("with the subject people will actually see",
               test[0].get("subject") == "A subject", test[0].get("subject"))
            ck("and the body built by the same builder",
               "Something in it." in (test[0].get("html") or ""))
        ck("and the page says so", "copy sent" in (pg.evaluate(READ)["said"] or ""),
           pg.evaluate(READ)["said"])

        # ── AND EVERY NEW SURFACE IS MEASURED FOR CONTRAST ──────────
        # The dialog is left OPEN for this, and each surface is scanned as its
        # own subtree rather than as "the page" — a modal counted with the page
        # behind it reports that page's failures twice under a second name
        # (§50.6).
        ck("the sweep's measurer was found", CONTRAST_JS is not None)
        if CONTRAST_JS:
            # THE MOUSE IS MOVED AWAY FIRST, and that is not tidiness.
            # Chromium keeps `:hover` after a click, and the last thing pressed
            # above was "Send me a copy" — so the first run of this measured the
            # button's HOVER state and found `--gold-deep` on `--over-bg` at
            # 4.34:1. That is real, and it is `.editbtn:hover` — the product's
            # standard secondary button, on every page, since long before this
            # version. §38.5's family for the sixth time, and fixing it is a
            # palette decision about every button in the platform rather than
            # anything §95 touched, so it is RECORDED (§16.16) and not quietly
            # changed here. Measured at rest, like the sweep everywhere else.
            pg.mouse.move(4, 4)
            pg.wait_for_timeout(150)
            for theme in ("light", "dark"):
                pg.evaluate("(t) => document.documentElement.setAttribute('data-theme', t)",
                            theme)
                pg.wait_for_timeout(250)
                surfaces = [("the audience summary", "#audout"),
                            ("the send bar", ".sendbar"),
                            ("the header counts", ".setuphead .hright")]
                for name, sel in surfaces:
                    # THE SWEEP'S FUNCTION TAKES A SELECTOR, not an element —
                    # it scans `root + ' *'` so a modal can pass its own root
                    # and not be counted with the page behind it (§50.6).
                    f = pg.evaluate(CONTRAST_JS, sel) if pg.query_selector(sel) else "absent"
                    ck(name + " reads, in " + theme, f == [], f)
                pg.click("[data-sentmenu]")
                pg.wait_for_timeout(300)
                f = pg.evaluate(CONTRAST_JS, ".hmenu-panel.wide")
                ck("the sent panel reads, in " + theme, f == [], f)
                pg.keyboard.press("Escape")
                pg.wait_for_timeout(200)
                pg.click("#msgsend")
                pg.wait_for_timeout(350)
                f = pg.evaluate(CONTRAST_JS, ".sendconfirm")
                ck("the confirmation reads, in " + theme, f == [], f)
                pg.click("[data-sendno]")
                pg.wait_for_timeout(250)

        br.close()


go()
print("  " + ("ERRORS: " + "; ".join(errs[:4]) if errs else "no console errors"))
if errs:
    bad += 1
print("send-message " + ("ALL GREEN" if not bad else "%d FAILED" % bad))
raise SystemExit(1 if bad else 0)
