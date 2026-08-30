"""A REPLY SAYS IT WENT AS SOON AS IT HAS GONE (§193).

Islam: *"the messages are sent in the box but still there is sending.. under
the chat box"* — with the reply plainly THERE in the thread above it. Then,
correcting the first diagnosis: *"the reply back of the sending came back it
just takes a long time."*

That is the whole of it. The server STORES the reply and then tries to EMAIL
it, and only answers when both are done. The email is the slow half — so
*Sending…* stood for as long as a mail provider took, over a reply that was
already delivered and already on screen.

TWO SENTENCES IN THE RIGHT ORDER, not one stale one:

  · the thread is asked once, soon, and the moment it comes back holding the
    message the word becomes **Sent.** — the screen stops waiting on the email;
  · when the request finally answers, that upgrades to **Sent, and emailed
    to …**, which is the sentence the office actually wants.

AND A REQUEST THAT NEVER ANSWERS STILL ANSWERS. `post()` had no timeout at all,
so a request that stopped coming back left the word standing for ever. It has a
clock now — in the ONE place every chat request goes through — and a timeout is
said as what it is (*the reply may still have gone*) rather than as a failure,
because "it did not send" and "we do not know" send somebody to two different
places. It can never take back a **Sent.** the thread has already confirmed.

THE STUB MODELS THE SERVER (§100.3), and getting that wrong is recorded here
because it cost a wrong diagnosis: `api/chat.js` returns a thread's fields at
the TOP LEVEL, and a stub that nested them under "thread" left `box.data` with
no messages at all — every reading said 0 and the product looked broken when
the stub was.
"""
import json, os, pathlib, threading, http.server, socketserver
from playwright.sync_api import sync_playwright

ROOT = pathlib.Path(__file__).resolve().parents[3]
HTML = pathlib.Path(os.environ.get("SMP_REPLY_HTML") or
                    (ROOT / "SMP-Project-Folder/src/strategy-management-platform.html")).read_bytes()
SEED = json.loads((ROOT / "db/seed-state.json").read_text())
OFF = {"key": "smo", "name": "Mohamed Essam", "role": "super"}
SLOW = float(os.environ.get("SMP_REPLY_SLOW", "4"))
REPLY = "Yes, fixing today."

bad = 0
def ck(w, ok, x=""):
    global bad
    if not ok: bad += 1
    print(("  ok      " if ok else "  FAIL    ") + w + (("  — " + str(x)) if not ok and x else ""))

THREAD = {"person": "p1", "name": "Mohamed Walid", "waiting": True,
          "address": "mohamed_walid@rayatrade.com", "here": False,
          "messages": [{"id": 1, "from_office": False, "body": "I have an issue", "at": "18:38"}]}
QUEUE = [{"person": "p1", "name": "Mohamed Walid", "waiting": True,
          "last": "I have an issue", "at": "18:38"}]
HANG = {"on": False}

class H(http.server.BaseHTTPRequestHandler):
    def log_message(self, *a): pass
    def _s(self, b, c=200, t="application/json"):
        try:
            self.send_response(c); self.send_header("Content-Type", t)
            self.send_header("Content-Length", str(len(b))); self.end_headers()
            self.wfile.write(b)
        except Exception:
            pass
    def do_GET(self):
        if self.path.startswith("/api/state"):
            self._s(json.dumps({"ok": True, "state": SEED, "person": OFF}).encode()); return
        if self.path.startswith("/raya-trade"):
            self._s(HTML, 200, "text/html; charset=utf-8"); return
        self._s(b"<!doctype html><title>gate</title>", 200, "text/html; charset=utf-8")
    def do_POST(self):
        n = int(self.headers.get("Content-Length") or 0)
        raw = self.rfile.read(n)
        b = {}
        try: b = json.loads(raw or b"{}")
        except Exception: pass
        a = b.get("action")
        if a == "queue":
            self._s(json.dumps({"ok": True, "threads": QUEUE, "waiting": 1}).encode()); return
        # THE REAL SHAPE: the thread's fields at the top level (§100.3).
        if a == "thread":
            self._s(json.dumps(dict(THREAD, ok=True)).encode()); return
        if a == "reply":
            # STORED FIRST, EMAILED SECOND — the server's own order, which is
            # the whole reason the wait exists.
            THREAD["messages"].append({"id": len(THREAD["messages"]) + 1,
                                       "from_office": True, "body": b.get("body", ""),
                                       "at": "18:40"})
            THREAD["waiting"] = False
            import time
            time.sleep(20 if HANG["on"] else SLOW)
            self._s(json.dumps({"ok": True, "mailed": {"sent": True,
                                "to": "mohamed_walid@rayatrade.com"}}).encode()); return
        self._s(b'{"ok":true,"unread":0,"threads":[],"chat":{"on":true},"states":{},"said":{}}')

class SRV(socketserver.ThreadingTCPServer): allow_reuse_address = True
srv = SRV(("127.0.0.1", 0), H)
threading.Thread(target=srv.serve_forever, daemon=True).start()
URL = "http://127.0.0.1:%d/raya-trade" % srv.server_address[1]

NOTE = ("()=>{const n=document.getElementById('chreplynote');"
        "return n?n.textContent.trim():null;}")

def open_inbox(pg):
    pg.goto(URL); pg.wait_for_timeout(2200)
    pg.evaluate("()=>document.querySelector('[data-md=\"setup\"]').click()")
    pg.wait_for_timeout(400)
    pg.evaluate("()=>{const b=document.querySelector('[data-setupgo=\"chat\"]'); if(b) b.click();}")
    pg.wait_for_timeout(1600)
    pg.evaluate("()=>{const r=document.querySelector('[data-chpick]'); if(r) r.click();}")
    pg.wait_for_timeout(1200)

def send(pg, text):
    pg.evaluate("""(t)=>{const a=document.querySelector('[data-chreply]');
        a.focus(); a.value=t; a.dispatchEvent(new Event('input',{bubbles:true}));}""", text)
    pg.wait_for_timeout(150)
    pg.evaluate("()=>document.querySelector('[data-chreplysend]').click()")

def run(pg):
    print("\n1 · a slow send says Sent as soon as it HAS been sent")
    open_inbox(pg)
    ck("the thread is open", pg.evaluate("()=>!!document.querySelector('[data-chreply]')"))
    send(pg, REPLY)
    pg.wait_for_timeout(400)
    ck("it says Sending while it really is", pg.evaluate(NOTE) == "Sending…",
       pg.evaluate(NOTE))
    # THE MEASURE: well before the server answers (SLOW seconds), and only
    # because the thread came back holding the reply.
    pg.wait_for_timeout(2200)
    early = pg.evaluate(NOTE)
    ck("...and says Sent long before the email finishes", early == "Sent.", early)
    ck("...because the reply is visibly in the thread",
       pg.evaluate("()=>document.querySelectorAll('#chtbody *').length") > 0)
    # AND THEN THE FULL NEWS, when the request finally answers.
    pg.wait_for_timeout(int(SLOW * 1000) + 2500)
    late = pg.evaluate(NOTE)
    ck("...and upgrades to the emailed sentence when the server answers",
       "emailed to" in (late or ""), late)
    ck("...which is not the same sentence as before", late != early)

    print("\n2 · a request that never answers still answers")
    HANG["on"] = True
    open_inbox(pg)
    send(pg, "A reply nobody will confirm.")
    pg.wait_for_timeout(1500)
    # The thread confirms it, so the word must already have moved on.
    ck("the thread answers for it even with the request hung",
       pg.evaluate(NOTE) == "Sent.", pg.evaluate(NOTE))
    HANG["on"] = False

    print("\n3 · both ends — nothing is taken back")
    # A confirmed Sent must survive the timeout backstop firing later.
    ck("a confirmed Sent is never replaced by a doubt",
       pg.evaluate(NOTE) == "Sent.", pg.evaluate(NOTE))
    ck("...and it is not dressed as an error",
       "bad" not in (pg.evaluate("()=>{const n=document.getElementById('chreplynote');"
                                 "return n?n.className:'';}") or ""))

errs = []
with sync_playwright() as pw:
    br = pw.chromium.launch(executable_path=os.environ.get("SMP_CHROME") or None)
    pg = br.new_page(viewport={"width": 1500, "height": 950})
    pg.on("pageerror", lambda e: errs.append(str(e)))
    pg.add_init_script("try{sessionStorage.setItem('smp.welcome.seen','1');"
                       "sessionStorage.setItem('smp.tour.later','1')}catch(e){}")
    run(pg)
    br.close()

print("\nconsole: " + (("%d — " % len(errs)) + errs[0] if errs else "clean"))
if errs: bad += 1
print("\n" + ("ALL OK" if not bad else "%d FAILED" % bad))
raise SystemExit(1 if bad else 0)
