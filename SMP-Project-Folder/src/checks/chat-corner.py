"""THE CORNER AFTER AN ANSWER THAT NEVER CAME (§197).

Islam: *"I didn't see the icon on login and when I sent to myself a message
it appeared again"* — and, correcting my first diagnosis, *"the chat wasn't
off."* He was right, and the cause is one missing branch.

The dock is created HIDDEN and the only thing that ever reveals it is a
SUCCESSFUL poll. A 500, a timeout or a dropped connection matched neither
that branch nor the 401/403 one, so nothing showed it — and the next attempt
was POLL_SHUT (three minutes) away. On the one morning the server is having
trouble, there is no way to reach the office for three minutes.

WHAT IS ASSERTED IS RECOVERY, NOT A NUMBER (§94.8). The corner must be there
after a first answer that failed, it must still be bounded when the server
never answers at all (§98.1: a five-second poll for ever is the cost that
section fought), and 401/403 must still take it away and STOP.

THE WHOLE SURFACE IS INVISIBLE OVER file:// (§94.11) — no server, no poll,
no dock — so this serves the built file over HTTP with a stub that can be
told to fail.

PROVE IT CAN FAIL (§94.5). On the pre-§197 build sections 2 and 3 fail: the
corner is still HIDDEN at eight seconds and the poll count is still 1.

Run:  SMP_CHROME=/opt/pw-browsers/chromium python3 qa-run.py checks/chat-corner.py
"""
import json, pathlib, threading, http.server, socketserver
from playwright.sync_api import sync_playwright

ROOT = pathlib.Path(__file__).resolve().parents[3]
HTML = (ROOT / "SMP-Project-Folder/src/strategy-management-platform.html").read_bytes()
SEED = json.loads((ROOT / "db/seed-state.json").read_text())
PERSON = {"key": "smo", "name": "Mohamed Essam", "role": "super"}
GATE = b"<!doctype html><title>Sign in</title><h1 id='gate'>Sign in</h1>"
CHAT = {"fail_first": 0, "polls": 0, "status": 500, "on": True}
bad = 0


def ck(w, ok, x=""):
    global bad
    if not ok:
        bad += 1
    print(("  ok      " if ok else "  FAIL    ") + w + (("  — " + str(x)) if not ok and x else ""))


class H(http.server.BaseHTTPRequestHandler):
    def log_message(self, *a):
        pass

    def _send(self, code, body, ctype):
        self.send_response(code); self.send_header("Content-Type", ctype)
        self.send_header("Content-Length", str(len(body))); self.end_headers()
        try:
            self.wfile.write(body)
        except BrokenPipeError:
            pass

    def do_GET(self):
        if self.path.startswith("/api/state"):
            self._send(200, json.dumps({"ok": True, "state": SEED, "person": PERSON}).encode(),
                       "application/json")
            return
        # THE STUB MODELS THE DEPLOYMENT, not just the endpoint (§94.11): the
        # gate at / and the platform at /raya-trade, or a 401 loops for ever.
        if self.path.startswith("/raya-trade"):
            self._send(200, HTML, "text/html; charset=utf-8")
            return
        self._send(200, GATE, "text/html; charset=utf-8")

    def do_POST(self):
        n = int(self.headers.get("Content-Length") or 0)
        self.rfile.read(n)
        if not self.path.startswith("/api/chat"):
            self._send(200, b'{"ok":true}', "application/json")
            return
        CHAT["polls"] += 1
        if CHAT["polls"] <= CHAT["fail_first"]:
            self._send(CHAT["status"], b'{"ok":false,"error":"boom"}', "application/json")
            return
        self._send(200, json.dumps({
            "ok": True, "messages": [], "unread": 0, "thread": None, "office": True,
            "chat": {"on": CHAT["on"], "shots": True,
                     "promise": "Usually the same day", "beat": 4000}}).encode(),
                   "application/json")


class S(socketserver.ThreadingTCPServer):
    allow_reuse_address = True
    daemon_threads = True


srv = S(("127.0.0.1", 0), H)
threading.Thread(target=srv.serve_forever, daemon=True).start()
BASE = "http://127.0.0.1:%d" % srv.server_address[1]


def look(fail_first, wait, status=500, on=True):
    """Open the platform with the first `fail_first` polls failing, wait, and
    report whether the corner is on screen and how many times it asked."""
    CHAT.update(fail_first=fail_first, polls=0, status=status, on=on)
    with sync_playwright() as pw:
        b = pw.chromium.launch()
        pg = b.new_page(viewport={"width": 1440, "height": 900})
        errs = []
        pg.on("pageerror", lambda e: errs.append(str(e)))
        # §167.2: the welcome screen covers the viewport and intercepts every
        # click; suppressed as a returning viewer has it, in an init script
        # because setting the flag after goto is too late.
        pg.add_init_script("try{sessionStorage.setItem('smp.tour.later','1');"
                           "sessionStorage.setItem('smp.welcome.done','1');}catch(e){}")
        pg.goto(BASE + "/raya-trade")
        pg.wait_for_timeout(wait)
        # MEASURE THE BOX, never the class list (§68.10) — and press the point,
        # because present-and-unreachable is this project's recurring fault
        # (§70, §93.4, §110).
        seen = pg.evaluate("""() => {
            const d = document.getElementById('chatdock');
            if (!d) return { there:false, why:'no dock element' };
            const r = d.getBoundingClientRect();
            if (d.hidden || r.width <= 0) return { there:false, why:'hidden' };
            // THE BUBBLE IS `.chatbtn`, NAMED (§51.11). The dock also holds the
            // panel, whose Minimise/attach/Send buttons come first in document
            // order and are zero-size while it is shut — so `querySelector
            // ('button')` measured the wrong control and reported a perfectly
            // reachable corner as unreachable.
            const bub = d.querySelector('.chatbtn');
            const q = bub && bub.getBoundingClientRect();
            const hit = q ? document.elementFromPoint(q.x + q.width/2, q.y + q.height/2) : null;
            return { there:true, reaches: !!(hit && bub && bub.contains(hit)) };
        }""")
        out = dict(seen, polls=CHAT["polls"], errs=errs[:2])
        b.close()
    return out


print("\n── 1 · a server that answers: nothing changes")
r = look(0, 2500)
ck("the corner is drawn", r["there"], r)
ck("...and a click at its centre reaches it", r.get("reaches"), r)
ck("...on one poll", r["polls"] == 1, r)
ck("no page errors", not r["errs"], r["errs"])

print("\n── 2 · the FIRST answer fails — the corner must still arrive")
r = look(1, 2500)
ck("it is not there yet at 2.5s (nothing is guessed)", not r["there"], r)
r = look(1, 8000)
ck("it IS there by 8s", r["there"], r)
ck("...because it asked again", r["polls"] >= 2, r)

print("\n── 3 · three failures — still arrives, without a three-minute wait")
r = look(3, 20000)
ck("the corner is drawn", r["there"], r)
ck("...and reachable", r.get("reaches"), r)

print("\n── 4 · a server that never answers must not poll for ever (§98.1)")
r = look(9999, 20000)
ck("nothing is drawn — a bubble that lied would be worse", not r["there"], r)
ck("...and the asking is BOUNDED", 2 <= r["polls"] <= 8, r["polls"])

print("\n── 5 · not signed in still takes it away, and stops")
r = look(9999, 6000, status=401)
ck("the corner is gone", not r["there"], r)
ck("...and it stopped asking", r["polls"] == 1, r["polls"])

print("\n── 6 · the tenant has the chat OFF — off still means gone (§98.2)")
r = look(0, 3000, on=False)
ck("the corner is not drawn", not r["there"], r)

srv.shutdown()
print("\n" + ("all passed" if not bad else "%d FAILED" % bad))
raise SystemExit(1 if bad else 0)
