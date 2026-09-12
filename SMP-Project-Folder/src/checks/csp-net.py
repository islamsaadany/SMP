"""Proves the build-time hashed CSP (§235 follow-up) is doing its job, over
HTTP where it is actually enforced the way production serves it:

  1. the app's OWN inline scripts still execute — i.e. the SHA-256 allow-list
     matches the shipped bytes (a wrong hash would blank the page);
  2. an INJECTED inline handler (onerror=) does NOT fire — i.e. the net blocks
     exactly the XSS execution vector escaping already closes, as defence in
     depth.

Served over http://127.0.0.1 because a meta CSP is enforced there the same way
Vercel serves it.

AND IT HAD STOPPED MEASURING THE PLATFORM AT ALL (§324.5). The line above used
to read *"the app falls back to its baked data when /api/* 404s, which is all
this needs"*, and that was true until §313 made every request name a CLIENT: a
404 from the state API now sends the page to `/platform`, which this stub also
404s — so what the check was measuring was the 404 page. It has **no meta
element and no app**, which is why BOTH its assertions failed: the app's
scripts had not run, and an injected handler ran unpoliced. *A check that
navigates away measures whatever it lands on, and reports it under the name of
the page it meant to open.*

So the stub answers `/api/state` and serves the platform at a CLIENT path, the
way every other own-server check here does. The CSP itself was never in doubt
and was proved separately by hashing the shipped file: 28 inline blocks, 28
hashes, all matching, no `unsafe-inline` and no `unsafe-hashes`."""
import http.server, json, pathlib, socketserver, threading, os, sys
from playwright.sync_api import sync_playwright

HERE = os.path.dirname(os.path.abspath(__file__))
SRC = os.path.dirname(HERE)
ROOT = os.path.dirname(os.path.dirname(SRC))
FILE = "strategy-management-platform.html"
HTML = pathlib.Path(SRC, FILE).read_bytes()
SEED = json.loads(pathlib.Path(ROOT, "db/seed-state.json").read_text())
PERSON = {"key": "smo", "name": "Mohamed Essam", "role": "super"}


class Stub(http.server.BaseHTTPRequestHandler):
    def log_message(self, *a):
        pass

    def _s(self, code, body, ctype):
        self.send_response(code)
        self.send_header("Content-Type", ctype)
        self.send_header("Content-Length", str(len(body)))
        self.end_headers()
        self.wfile.write(body)

    def do_GET(self):
        if self.path.startswith("/api/state"):
            self._s(200, json.dumps({"ok": True, "state": SEED, "person": PERSON}).encode(),
                    "application/json")
            return
        if self.path.startswith("/api/"):
            self._s(200, b'{"ok":true}', "application/json")
            return
        # A WORKER IS SERVED AS JAVASCRIPT OR THE REGISTRATION REJECTS (§231.5),
        # and a rejection here is a console error that looks like the product.
        if self.path.startswith("/sw.js"):
            self._s(200, b"/* stub */", "application/javascript")
            return
        self._s(200, HTML, "text/html; charset=utf-8")

    def do_POST(self):
        n = int(self.headers.get("Content-Length") or 0)
        self.rfile.read(n)
        self._s(200, b'{"ok":true}', "application/json")


os.chdir(SRC)
httpd = socketserver.TCPServer(("127.0.0.1", 0), Stub)
# A BROWSER CLOSING A CONNECTION IS NOT A FAILURE. Chromium drops the socket
# when it finishes with a resource, and socketserver prints the whole
# ConnectionResetError traceback into this check's own output — where a
# traceback is the first thing a reader takes for the result (§298.3: the tail
# is the verdict). It belongs on the SERVER, not on the request handler.
httpd.handle_error = lambda *a: None
port = httpd.server_address[1]
threading.Thread(target=httpd.serve_forever, daemon=True).start()

fails = []
with sync_playwright() as p:
    b = p.chromium.launch()
    pg = b.new_page()
    violations = []
    pg.on("console", lambda m: violations.append(m.text) if "Content Security Policy" in m.text or "Refused" in m.text else None)
    pg.goto("http://127.0.0.1:%d/raya-trade" % port, wait_until="load")
    pg.wait_for_timeout(1200)

    # 1) the app's own scripts ran → the hash allow-list is correct
    # THE PAGE WE OPENED IS THE PAGE WE ARE ON (§324.5). Asserted FIRST and by
    # name, because everything below it is true of a 404 page: no meta, no app,
    # and an injected handler that runs because nothing is policing it.
    here = pg.evaluate("() => ({url: location.pathname, metas: document.querySelectorAll('meta[http-equiv]').length})")
    on_page = here["metas"] >= 1
    print(("  ok    " if on_page else "  FAIL  ") +
          "the platform is still the document, and it carries a policy — %s" % here)
    if not on_page: fails.append("navigated away: the rest of this check measured another page")
    ran = pg.evaluate("() => typeof esc === 'function' && typeof LABELS !== 'undefined'")
    print(("  ok    " if ran else "  FAIL  ") + "the app's own inline scripts execute under the CSP")
    if not ran: fails.append("app scripts blocked — a hash does not match the shipped bytes")

    # 2) an injected inline handler must NOT run
    pwned = pg.evaluate("""() => {
        window.__pwned = 0;
        document.body.insertAdjacentHTML('beforeend',
          '<img src=\\"x\\" onerror=\\"window.__pwned=1\\">');
        return new Promise(r => setTimeout(() => r(window.__pwned), 300));
    }""")
    print(("  ok    " if pwned == 0 else "  FAIL  ") +
          "an injected onerror= handler is blocked (window.__pwned=%s)" % pwned)
    if pwned: fails.append("injected inline handler EXECUTED — the CSP net is not active")

    # 3) the browser actually reported blocking it (belt and braces)
    blocked_msg = any("Content Security Policy" in v or "Refused to execute" in v for v in violations)
    print(("  ok    " if blocked_msg else "  note ") +
          "browser logged a CSP refusal for the injected handler" +
          ("" if blocked_msg else " (not logged, but it did not run)"))

    b.close()
httpd.shutdown()

if fails:
    print("\nCSP-NET FAILED:\n  - " + "\n  - ".join(fails)); sys.exit(1)
print("\nCSP-NET OK — legit scripts run, injected handlers are blocked")
