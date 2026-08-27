"""FULL-PAGE BEFORE AND AFTER, WITH THE CHANGE RINGED (§136).

Islam: "I want to see the full mock with a highlight on the change before and
after. I can't see only the rail."

Two REAL BUILDS, not one build with something injected: the "before" is the
platform exactly as it was committed at d4b81ca, taken out of git, and the
"after" is the current one. Both are driven the same way — walked to Send a
message, given the same message and audience, and SENT through their own
confirmation — so the two pictures differ only by the change.

Usage: python3 checks/sendsaid-fullshot.py <platform.html> <tag>
"""
import sys
import json, pathlib, threading, http.server, socketserver
from playwright.sync_api import sync_playwright

ROOT = pathlib.Path("/home/user/SMP")
PLATFORM = sys.argv[1] if len(sys.argv) > 1 else str(
    ROOT / "SMP-Project-Folder/src/strategy-management-platform.html")
TAG = sys.argv[2] if len(sys.argv) > 2 else "after"
HTML = pathlib.Path(PLATFORM).read_bytes()
STATE = json.loads((ROOT / "db/seed-state.json").read_text())
OUT = ROOT / "design-mockups/send-confirmation/shots"
OUT.mkdir(parents=True, exist_ok=True)

TO = [{"key": "p%d" % i, "name": "Person %d" % i, "email": "p%d@example.com" % i}
      for i in range(1, 77)]
SKIPPED = [{"key": "s%d" % i, "name": "Skipped %d" % i, "why": "no address on their row"}
           for i in range(1, 4)]
for p in STATE.get("people", []):
    if p.get("key") == "smo":
        p["email"] = "smo@example.com"
PERSON = {"key": "smo", "name": "Mohamed Essam", "role": "super"}


class H(http.server.BaseHTTPRequestHandler):
    def log_message(self, *a): pass
    def _send(self, code, body, ctype):
        self.send_response(code); self.send_header("Content-Type", ctype)
        self.send_header("Content-Length", str(len(body))); self.end_headers()
        self.wfile.write(body)
    def _json(self, o): self._send(200, json.dumps(o).encode(), "application/json")
    def do_GET(self):
        if self.path.startswith("/api/state"):
            return self._json({"ok": True, "state": STATE, "person": PERSON})
        if self.path.startswith("/raya-trade"):
            return self._send(200, HTML, "text/html; charset=utf-8")
        return self._send(200, b"<!doctype html><title>Sign in</title>", "text/html; charset=utf-8")
    def do_POST(self):
        n = int(self.headers.get("Content-Length") or 0)
        try: body = json.loads(self.rfile.read(n) or b"{}")
        except Exception: body = {}
        a = body.get("action")
        if self.path.startswith("/api/mail"):
            if a == "status":
                return self._json({"ok": True, "key": True, "from": "smp@example.com",
                                   "domain": "example.com", "verified": True})
            if a == "audience":
                return self._json({"ok": True, "to": TO, "skipped": SKIPPED,
                                   "active": len(TO) + len(SKIPPED), "withAddress": len(TO)})
            if a == "draftList": return self._json({"ok": True, "drafts": []})
            if a == "history":   return self._json({"ok": True, "messages": []})
            if a in ("send", "test"):
                return self._json({"ok": True, "sent": len(TO), "failed": 0})
        return self._json({"ok": True})


srv = socketserver.ThreadingTCPServer(("127.0.0.1", 0), H)
srv.daemon_threads = True
PORT = srv.server_address[1]
threading.Thread(target=srv.serve_forever, daemon=True).start()
URL = "http://127.0.0.1:%d/raya-trade" % PORT


OUT = ROOT / "design-mockups/send-confirmation/shots"
OUT.mkdir(parents=True, exist_ok=True)

# ── THE RING ─────────────────────────────────────────────────────────
# Drawn over the send bar, in the house gold, with the rest of the page left
# READABLE rather than dimmed: the point of a full-page shot is to see the
# change in its place, and a dim would take the place away.
RING = """() => {
  const bar = document.querySelector(".sendbar");
  if (!bar) return false;
  const r = bar.getBoundingClientRect();
  const d = document.createElement("div");
  d.setAttribute("style",
    "position:fixed;z-index:99999;pointer-events:none;border-radius:12px;" +
    "border:3px solid #C9A24D;box-shadow:0 0 0 4px rgba(201,162,77,.22)," +
    "0 6px 26px rgba(0,0,0,.18);" +
    "left:" + (r.left - 8) + "px;top:" + (r.top - 8) + "px;" +
    "width:" + (r.width + 16) + "px;height:" + (r.height + 16) + "px;");
  document.body.appendChild(d);
  return true;
}"""


def run(theme):
    sfx = "" if theme == "light" else "-dark"
    with sync_playwright() as pw:
        br = pw.chromium.launch()
        # TALL, so the whole composer and the bar are in one picture. A
        # full_page screenshot would misplace the sticky bar.
        pg = br.new_page(viewport={"width": 1400, "height": 1500},
                         device_scale_factor=2)
        pg.add_init_script("try{sessionStorage.setItem('smp.tour.later','1');"
                           "localStorage.setItem('smp.theme','%s');}catch(e){}" % theme)
        pg.goto(URL)
        pg.wait_for_selector("nav.units", timeout=15000)
        pg.click('#units [data-md="setup"]')
        pg.wait_for_timeout(400)
        for g in pg.eval_on_selector_all(".setuprail .rgroup.shut",
                                         "e=>e.map(x=>x.dataset.railgrp)"):
            pg.click('.setuprail [data-railgrp="%s"]' % g)
            pg.wait_for_timeout(70)
        pg.click('.setuprail [data-setupgo="send"]')
        pg.wait_for_timeout(900)
        pg.evaluate("""() => { const st = sendmsg();
          st.criteria.everyone = true;
          st.subject = "The Q3 reporting cycle opens on Monday";
          st.body = "The cycle opens on Monday 1 September and closes on Friday "
                  + "12 September.\\n\\nPlease enter your figures against every "
                  + "measure your unit owns.";
          sendmsgAsk(); paint(); }""")
        pg.wait_for_timeout(1200)

        # SENT THROUGH THE PRODUCT'S OWN CONTROLS, confirmation and all.
        pg.click("#msgsend")
        pg.wait_for_timeout(500)
        pg.click("[data-sendyes]")
        pg.wait_for_timeout(1600)

        pg.evaluate("() => window.scrollTo(0, document.body.scrollHeight)")
        pg.wait_for_timeout(400)
        pg.evaluate(RING)
        pg.wait_for_timeout(200)
        name = "full-%s%s.png" % (TAG, sfx)
        pg.screenshot(path=str(OUT / name))
        print("  wrote " + name)
        br.close()


for t in ("light", "dark"):
    run(t)
