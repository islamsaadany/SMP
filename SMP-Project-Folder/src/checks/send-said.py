"""THE BAR REPORTS, AND MOVES ON (§136).

Islam: "When I send I don't get any verification that the message was sent and
the page stays the same view."

Both halves were true, and they are two faults.

The outcome line was drawn in `.why` — 12px, the same quiet grey as an empty
space — and `result.ok` was worked out and never read, so a FAILED send turned
red and a successful one got no colour at all. And the orange button still read
*Send to 76 people* and was still live, with the message and the audience all
still loaded, so every loud signal said not-sent-yet.

THE SECOND PRESS IS WHAT THIS CHECK IS REALLY FOR. §95 put a confirmation in
FRONT of the send because it cannot be recalled, and then left the button
loaded. So the assertions that matter are that the send CANNOT be repeated by
one press, and that the way back exists — because a composer whose only control
clears the message is a dead end for anybody fixing a typo (§61).

OVER HTTP, because this whole page is the empty state over `file://` (§94.11).
"""
import json, pathlib, re, threading, http.server, socketserver
from playwright.sync_api import sync_playwright

ROOT = pathlib.Path(__file__).resolve().parents[3]
HTML = (ROOT / "SMP-Project-Folder/src/strategy-management-platform.html").read_bytes()
STATE = json.loads((ROOT / "db/seed-state.json").read_text())

# The three shapes of name this has to survive, first one first — the preview
# shows the FIRST recipient, so which one leads is load-bearing.
TO = [{"key": "p1", "name": "Ahmed Mostafa Mohamed El Gebely", "email": "a@example.com"},
      {"key": "p2", "name": "Abd El Moniem Mohamed Abd El Moniem Mahmoud",
       "email": "b@example.com"},
      {"key": "p3", "name": "Amaka Eze", "email": "c@example.com"}]
SKIPPED = []

for p in STATE.get("people", []):
    if p.get("key") == "smo":
        p["email"] = "smo@example.com"
PERSON = {"key": "smo", "name": "Mohamed Essam", "role": "super"}

POSTED = []          # every body the page sent to /api/mail
FAILN = 0            # how many the stub reports as failed (§6)
bad, errs = 0, []


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
        return self._send(200, b"<!doctype html><title>Sign in</title>",
                          "text/html; charset=utf-8")

    def do_POST(self):
        n = int(self.headers.get("Content-Length") or 0)
        try:
            body = json.loads(self.rfile.read(n) or b"{}")
        except Exception:
            body = {}
        a = body.get("action")
        if self.path.startswith("/api/mail"):
            POSTED.append(body)
            if a == "status":
                return self._json({"ok": True, "key": True, "from": "smp@example.com",
                                   "domain": "example.com", "verified": True})
            if a == "audience":
                return self._json({"ok": True, "to": TO, "skipped": SKIPPED,
                                   "active": len(TO), "withAddress": len(TO)})
            if a == "draftList":
                return self._json({"ok": True, "drafts": []})
            if a == "history":
                return self._json({"ok": True, "messages": []})
            if a == "draftSave":
                return self._json({"ok": True, "id": "7"})
            if a in ("send", "test"):
                return self._json({"ok": True, "sent": len(TO) - FAILN,
                                   "failed": FAILN})
        return self._json({"ok": True})


srv = socketserver.ThreadingTCPServer(("127.0.0.1", 0), H)
srv.daemon_threads = True
PORT = srv.server_address[1]
threading.Thread(target=srv.serve_forever, daemon=True).start()
URL = "http://127.0.0.1:%d/raya-trade" % PORT



# ── WHAT IS ON SCREEN AFTER A SEND ───────────────────────────────────
READ = """() => {
  const shown = (s) => { const e = document.querySelector(s);
    return !!e && !e.hidden && e.getClientRects().length > 0; };
  const hits = (s) => {
    const e = document.querySelector(s); if (!e) return null;
    const r = e.getBoundingClientRect();
    if (!r.width || !r.height) return "no box";
    const at = document.elementFromPoint(r.left + r.width / 2, r.top + r.height / 2);
    return at ? (at === e || e.contains(at) || at.contains(e) ? "itself" : at.tagName) : "nothing";
  };
  const said = document.getElementById("msgsaid");
  const cs = said ? getComputedStyle(said) : null;
  const b = said ? said.querySelector("b") : null;
  return {
    sendShown: shown("#msgsend"),
    againShown: shown("#msgagain"),
    sendLabel: (() => { const e = document.getElementById("msgsend");
                        return e ? e.textContent.trim() : null; })(),
    againHits: hits("#msgagain"),
    said: said ? said.textContent.replace(/\\s+/g, " ").trim() : null,
    saidClass: said ? said.className : null,
    /* The colour of the OUTCOME, read off the <b> the render puts it in — the
       whole first fault was that this was the page's quiet grey. */
    saidColor: b ? getComputedStyle(b).color : null,
    quietColor: cs ? cs.color : null,
    saidSize: cs ? cs.fontSize : null,
    subject: (typeof sendmsg === "function") ? sendmsg().subject : null,
    body: (typeof sendmsg === "function") ? sendmsg().body : null,
    audience: (typeof sendmsg === "function")
      ? ((sendmsg().aud && sendmsg().aud.to) ? sendmsg().aud.to.length : 0) : null,
    sent: (typeof sendmsg === "function") ? sendmsg().sent : null
  };
}"""


def open_page(pw, theme="light"):
    br = pw.chromium.launch()
    pg = br.new_page(viewport={"width": 1440, "height": 950})
    pg.add_init_script("try{sessionStorage.setItem('smp.tour.later','1');"
                       "localStorage.setItem('smp.theme','%s');}catch(e){}" % theme)
    pg.on("console", lambda m: errs.append(m.text) if m.type == "error" else None)
    pg.on("pageerror", lambda e: errs.append(str(e)))
    pg.goto(URL)
    pg.wait_for_selector("nav.units", timeout=15000)
    pg.click('#units [data-md="setup"]')
    pg.wait_for_timeout(400)
    for g in pg.eval_on_selector_all(".setuprail .rgroup.shut",
                                     "e=>e.map(x=>x.dataset.railgrp)"):
        pg.click('.setuprail [data-railgrp="%s"]' % g)
        pg.wait_for_timeout(70)
    pg.click('.setuprail [data-setupgo="send"]')
    pg.wait_for_timeout(800)
    pg.evaluate("""() => { const st = sendmsg();
      st.criteria.everyone = true;
      st.subject = "The Q3 reporting cycle opens on Monday";
      st.body = "The cycle opens on Monday 1 September.";
      sendmsgAsk(); paint(); }""")
    pg.wait_for_timeout(900)
    return br, pg


def send(pg):
    pg.click("#msgsend")
    pg.wait_for_timeout(400)
    pg.click("[data-sendyes]")
    pg.wait_for_timeout(1200)


def go():
    with sync_playwright() as pw:
        br, pg = open_page(pw)

        # ══ 1 · BEFORE ═════════════════════════════════════════════
        print("\n1 · before the send")
        r = pg.evaluate(READ)
        ck("Send is the control on offer", r["sendShown"] and not r["againShown"])
        ck("it says who it will go to", r["sendLabel"] == "Send to 3 people", r["sendLabel"])
        ck("and nothing is claimed about a send", not r["said"], r["said"])

        # ══ 2 · THE OUTCOME IS ANNOUNCED ═══════════════════════════
        print("\n2 · the send says it happened")
        del POSTED[:]
        send(pg)
        r = pg.evaluate(READ)
        ck("one send went", len([p for p in POSTED if p.get("action") == "send"]) == 1)
        ck("the outcome is stated", "3 messages sent." in (r["said"] or ""), r["said"])
        # THE FIRST FAULT: success was drawn in the failure-neutral grey.
        ck("in the good voice, not the page's grey",
           "good" in (r["saidClass"] or "") and r["saidColor"] != r["quietColor"],
           "%s / %s vs %s" % (r["saidClass"], r["saidColor"], r["quietColor"]))
        ck("at a size worth reading, not the legend's",
           r["saidSize"] and float(r["saidSize"].replace("px", "")) >= 13, r["saidSize"])

        # ══ 3 · IT CANNOT BE SENT AGAIN BY ONE PRESS ═══════════════
        print("\n3 · the second press is not the same send")
        ck("Send is gone", not r["sendShown"], r["sendShown"])
        ck("and Write another stands in its place", r["againShown"])
        ck("which can actually be pressed", r["againHits"] == "itself", r["againHits"])
        # BOTH ENDS: pressing where Send WAS must not send (§94.2).
        del POSTED[:]
        pg.click("#msgagain")
        pg.wait_for_timeout(700)
        ck("pressing it sends nothing",
           len([p for p in POSTED if p.get("action") == "send"]) == 0)
        r = pg.evaluate(READ)
        ck("it clears the message", not r["subject"] and not r["body"],
           "%r / %r" % (r["subject"], r["body"]))
        # Deliberate: the recipients are usually the same list.
        ck("and keeps who it goes to", r["audience"] == 3, r["audience"])
        ck("Send is back for the next one", r["sendShown"] and not r["againShown"])
        ck("and the old outcome went with the old message", not r["said"], r["said"])
        br.close()

        # ══ 4 · EDITING BRINGS SEND BACK, WITHOUT A REPAINT ════════
        # §61: without this the composer is a dead end — the only control on
        # offer CLEARS, so fixing a typo to re-send means losing the fix.
        print("\n4 · correcting a sent message")
        br, pg = open_page(pw)
        send(pg)
        r = pg.evaluate(READ)
        ck("after sending, Send is gone", not r["sendShown"] and r["againShown"])
        pg.evaluate("""() => { const h = document.getElementById('msgprev');
          h.shadowRoot.querySelector('[data-mail-body]').focus(); }""")
        pg.keyboard.type("!")
        pg.wait_for_timeout(400)
        r = pg.evaluate(READ)
        ck("one keystroke brings Send back", r["sendShown"] and not r["againShown"])
        ck("the stale outcome goes with it", not r["said"], r["said"])
        # THE CARET MUST SURVIVE. The whole reason this is not a paint().
        ck("and the caret is still in the message",
           pg.evaluate("""() => { const h = document.getElementById('msgprev');
             return h.shadowRoot.activeElement &&
                    h.shadowRoot.activeElement.hasAttribute('data-mail-body'); }"""))
        # NOT `endswith`: `focus()` puts the caret at the START of a
        # contenteditable, so the character lands first. What matters is that
        # it reached the state and that nothing already there was lost.
        ck("what was typed reached the message", "!" in (r["body"] or ""),
           repr(r["body"])[:60])
        ck("and the message that was already there survived",
           "The cycle opens on Monday" in (r["body"] or ""), repr(r["body"])[:60])
        br.close()

        # ══ 5 · CHANGING WHO IT GOES TO IS A DIFFERENT SEND ════════
        print("\n5 · changing the audience")
        br, pg = open_page(pw)
        send(pg)
        ck("after sending, Send is gone", not pg.evaluate(READ)["sendShown"])
        pg.evaluate("""() => { const i = document.querySelector('[data-aud="everyone"]');
          i.checked = false; i.dispatchEvent(new Event('change', {bubbles:true})); }""")
        pg.wait_for_timeout(900)
        ck("Send comes back", pg.evaluate(READ)["sendShown"])
        br.close()

        # ══ 6 · A PARTIAL FAILURE IS STILL A SEND ══════════════════
        # It must not be one press from repeating — the people it DID reach
        # would get it twice — and it must not read as a success.
        print("\n6 · when some of them failed")
        global FAILN
        FAILN = 1
        br, pg = open_page(pw)
        send(pg)
        r = pg.evaluate(READ)
        ck("the failure is stated", "failed" in (r["said"] or ""), r["said"])
        ck("in the bad voice", "bad" in (r["saidClass"] or ""), r["saidClass"])
        ck("and it still cannot be repeated by one press",
           not r["sendShown"] and r["againShown"])
        FAILN = 0
        br.close()

        ck("no console errors anywhere in that", not errs, errs[:3])


go()
print("\n%s" % ("ALL GOOD" if not bad else "%d FAILED" % bad))
raise SystemExit(1 if bad else 0)
