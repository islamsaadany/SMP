"""Proves the build-time hashed CSP (§235 follow-up) is doing its job, over
HTTP where it is actually enforced the way production serves it:

  1. the app's OWN inline scripts still execute — i.e. the SHA-256 allow-list
     matches the shipped bytes (a wrong hash would blank the page);
  2. an INJECTED inline handler (onerror=) does NOT fire — i.e. the net blocks
     exactly the XSS execution vector escaping already closes, as defence in
     depth.

Served over http://127.0.0.1 because a meta CSP is enforced there the same way
Vercel serves it; the app falls back to its baked data when /api/* 404s, which
is all this needs (the inline scripts run regardless of the API)."""
import http.server, socketserver, threading, functools, os, sys
from playwright.sync_api import sync_playwright

HERE = os.path.dirname(os.path.abspath(__file__))
SRC = os.path.dirname(HERE)
FILE = "strategy-management-platform.html"

os.chdir(SRC)
Handler = functools.partial(http.server.SimpleHTTPRequestHandler)
httpd = socketserver.TCPServer(("127.0.0.1", 0), Handler)
port = httpd.server_address[1]
threading.Thread(target=httpd.serve_forever, daemon=True).start()

fails = []
with sync_playwright() as p:
    b = p.chromium.launch()
    pg = b.new_page()
    violations = []
    pg.on("console", lambda m: violations.append(m.text) if "Content Security Policy" in m.text or "Refused" in m.text else None)
    pg.goto("http://127.0.0.1:%d/%s" % (port, FILE), wait_until="load")
    pg.wait_for_timeout(1200)

    # 1) the app's own scripts ran → the hash allow-list is correct
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
