"""THE MOCKUP IS MADE OF THE REAL SEND BAR (§41.9).

Islam: "When I send I don't get any verification that the message was sent and
the page stays the same view."

Driven, not drawn: the built platform is served with the send-message stub, a
message is actually SENT, and the proposal is injected into the live bar — so
both sides of every picture are the same build.
"""
import json, pathlib, threading, http.server, socketserver
from playwright.sync_api import sync_playwright

ROOT = pathlib.Path("/home/user/SMP")
HTML = (ROOT / "SMP-Project-Folder/src/strategy-management-platform.html").read_bytes()
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

# ── THE PROPOSAL, in the platform's own parts ────────────────────────
# `.pill good` is the mark the Sent record already uses for a delivered row, so
# the outcome is said in the vocabulary this page already has (§53.5).
PROPOSE = """() => {
  const said = document.getElementById("msgsaid");
  const send = document.getElementById("msgsend");
  if (!said || !send) return false;
  // THE OUTCOME, at reading size and in the platform's own good colour, with
  // the `.pill good` mark the Sent record already uses for a delivered row
  // (§53.5 — said in the vocabulary this page has, not a new one).
  said.innerHTML = '<b style="color:var(--good-tx)">76 messages sent.</b>' +
    ' <span style="color:var(--ink-3)">3 were skipped \u2014 they have no address.</span>';
  said.style.fontSize = "13px";
  // THE PRIMARY ACTION BECOMES THE NEXT THING YOU WOULD DO. Send is not
  // disabled-and-left-lying-there: it is REPLACED, because after a send the
  // one thing that must not be one press away is the same send again. It
  // comes back the moment the message or the audience is edited.
  send.classList.remove("cta");
  send.classList.add("cta");
  send.textContent = "Write another";
  send.id = "msgagain";
  return true;
}"""

def shot(pg, sel, name, pad=10):
    el = pg.query_selector(sel)
    if not el:
        print("  MISSING " + sel); return
    el.scroll_into_view_if_needed(); pg.wait_for_timeout(200)
    box = el.bounding_box()
    pg.screenshot(path=str(OUT / name), clip={
        "x": max(0, box["x"] - pad), "y": max(0, box["y"] - pad),
        "width": box["width"] + pad * 2, "height": box["height"] + pad * 2})
    print("  wrote " + name)


def run(theme):
    tag = "" if theme == "light" else "-dark"
    with sync_playwright() as pw:
        br = pw.chromium.launch()
        pg = br.new_page(viewport={"width": 1440, "height": 950}, device_scale_factor=2)
        pg.add_init_script("try{sessionStorage.setItem('smp.tour.later','1');"
                           "localStorage.setItem('smp.theme','%s');}catch(e){}" % theme)
        pg.goto(URL)
        pg.wait_for_selector("nav.units", timeout=15000)
        pg.click('#units [data-md="setup"]'); pg.wait_for_timeout(400)
        for g in pg.eval_on_selector_all(".setuprail .rgroup.shut",
                                         "e=>e.map(x=>x.dataset.railgrp)"):
            pg.click('.setuprail [data-railgrp="%s"]' % g); pg.wait_for_timeout(70)
        pg.click('.setuprail [data-setupgo="send"]'); pg.wait_for_timeout(800)
        pg.evaluate("""() => { const st = sendmsg();
          st.criteria.everyone = true;
          st.subject = "The Q3 reporting cycle opens on Monday";
          st.body = "The cycle opens on Monday 1 September and closes on Friday 12 September.";
          sendmsgAsk(); paint(); }""")
        pg.wait_for_timeout(1000)

        # ── ACTUALLY SEND, through the real controls ──────────────────
        pg.click("#msgsend"); pg.wait_for_timeout(400)
        pg.click("[data-sendyes]"); pg.wait_for_timeout(1500)
        shot(pg, ".sendbar", "today%s.png" % tag)

        pg.evaluate(PROPOSE); pg.wait_for_timeout(300)
        shot(pg, ".sendbar", "proposed%s.png" % tag)
        br.close()


for t in ("light", "dark"):
    print(t + ":")
    run(t)
print("done -> " + str(OUT))
