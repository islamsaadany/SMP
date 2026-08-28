"""WHERE THE SEND BUTTON GOES — three placements, drawn in the real page.

Islam: "In the overview I'd like to add a button, send an email, somewhere for
the action to be obvious. Where should we place it? What are my options?"

Injected into the LIVE Overview (§41.9) so what is compared is PLACEMENT and
not a sketch: the chrome, the rail, the tables and the type are the product's
own, and only the button is added.

TWO THINGS THE CAPTURE TAUGHT, both worth keeping:

  · AN ELEMENT SCREENSHOT DISPLACES THE STICKY ROWS INSIDE IT. Shooting
    `.setuppane` directly dropped the tab row out of every picture — the
    capture lying, not the product. The viewport is shot and cropped to the
    pane's MEASURED box instead.

  · THE TAB ROW STYLES ITS OWN BUTTONS, so a CTA dropped into it renders as
    plain text. Forced inline for option B so the comparison is fair — and
    needing that is itself a cost of B, recorded rather than hidden.
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

# A record with something in it — a dashboard drawn over an empty list is a
# picture of the empty state (§45.2).
SENT = [
  {"id": 4, "subject": "The Q3 reporting cycle opens on Monday",
   "sent_at": "2026-08-27T09:12", "by_name": "Mohamed Essam",
   "audience": {"everyone": True}, "total": 79, "sent": 76, "failed": 0},
  {"id": 3, "subject": "Reminder \u2014 figures close on Friday",
   "sent_at": "2026-08-20T08:00", "by_name": "Mohamed Essam",
   "audience": {"roles": ["owner", "custodian"]}, "total": 22, "sent": 22, "failed": 0},
  {"id": 2, "subject": "Mobile: your plan has been updated",
   "sent_at": "2026-08-14T16:40", "by_name": "Nadia Fahmy",
   "audience": {"targets": ["mobile"]}, "total": 9, "sent": 9, "failed": 0},
  {"id": 1, "subject": "Welcome to the platform",
   "sent_at": "2026-08-01T10:05", "by_name": "Mohamed Essam",
   "audience": {"everyone": True}, "total": 79, "sent": 71, "failed": 8},
]
DRAFTS = [
  {"id": 9, "subject": "Q4 planning \u2014 what we need from each unit",
   "updated_at": "2026-08-26T17:02", "by_name": "Mohamed Essam"},
  {"id": 8, "subject": "Board pack cover note",
   "updated_at": "2026-08-22T11:20", "by_name": "Mohamed Essam"},
]


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
            if a == "draftList": return self._json({"ok": True, "drafts": DRAFTS})
            if a == "history":  return self._json({"ok": True, "messages": SENT})
            if a in ("send", "test"):
                return self._json({"ok": True, "sent": len(TO), "failed": 0})
        return self._json({"ok": True})


srv = socketserver.ThreadingTCPServer(("127.0.0.1", 0), H)
srv.daemon_threads = True
PORT = srv.server_address[1]
threading.Thread(target=srv.serve_forever, daemon=True).start()
URL = "http://127.0.0.1:%d/raya-trade" % PORT
OUT = ROOT / "design-mockups/send-button/shots"
OUT.mkdir(parents=True, exist_ok=True)

# ── THE THREE PLACES IT COULD GO ─────────────────────────────────────
# Each injected into the LIVE Overview, built with `.editbtn cta` — the one
# solid fill this product allows itself per screen (§41's budget), the same
# class Send itself wears on the composer.
PLACE = """(which) => {
  document.querySelectorAll(".optbtn").forEach(e => e.remove());
  const b = document.createElement("button");
  b.className = "editbtn cta optbtn";
  b.textContent = "Write a message";
  const head = document.querySelector(".setuphead");
  const tabs = document.querySelector(".secrow");
  const over = document.getElementById("msgover");
  if (which === "head") {
    // A · beside the page's name, in the header that STAYS (§121.2).
    head.style.display = "flex";
    head.style.alignItems = "center";
    head.style.justifyContent = "space-between";
    head.style.gap = "16px";
    head.appendChild(b);
  } else if (which === "tabs") {
    // B · at the right end of the tab row.
    tabs.style.display = "flex";
    tabs.style.alignItems = "center";
    b.style.marginLeft = "auto";
    b.style.marginBottom = "6px";
    // THE TAB ROW STYLES ITS OWN BUTTONS, so a CTA dropped into it comes out
    // as plain text. Forced here so the comparison is about PLACEMENT — and
    // recorded, because needing this is itself a cost of option B.
    b.style.background = "var(--cta)";
    b.style.color = "var(--cta-ink, #fff)";
    b.style.borderRadius = "999px";
    b.style.padding = "9px 18px";
    b.style.border = "0";
    tabs.appendChild(b);
  } else {
    // C · above the lists, inside the Overview's own content.
    const w = document.createElement("div");
    w.className = "optbtn";
    w.setAttribute("style", "margin:0 0 18px");
    w.appendChild(b);
    over.insertBefore(w, over.firstChild);
  }
  return true;
}"""


def run(theme, opts):
    sfx = "" if theme == "light" else "-dark"
    with sync_playwright() as pw:
        br = pw.chromium.launch()
        pg = br.new_page(viewport={"width": 1400, "height": 900}, device_scale_factor=2)
        pg.add_init_script("try{sessionStorage.setItem('smp.tour.later','1');"
                           "localStorage.setItem('smp.theme','%s');}catch(e){}" % theme)
        pg.goto(URL); pg.wait_for_selector("nav.units", timeout=15000)
        pg.click('#units [data-md="setup"]'); pg.wait_for_timeout(400)
        for g in pg.eval_on_selector_all(".setuprail .rgroup.shut",
                                         "e=>e.map(x=>x.dataset.railgrp)"):
            pg.click('.setuprail [data-railgrp="%s"]' % g); pg.wait_for_timeout(70)
        pg.click('.setuprail [data-setupgo="send"]'); pg.wait_for_timeout(1200)

        # FULL VIEWPORT, then cropped to the pane's MEASURED box. An element
        # screenshot displaces the sticky rows inside it — the tab row vanished
        # from every shot, which is the capture lying, not the product.
        def shot(name):
            box = pg.eval_on_selector(".setuppane", """e => { const r =
                e.getBoundingClientRect();
                return {x:r.left, y:r.top, w:r.width, h:r.height}; }""")
            pg.screenshot(path=str(OUT / name), clip={
                "x": max(0, box["x"] - 8), "y": max(0, box["y"] - 8),
                "width": box["w"] + 16, "height": min(box["h"] + 16, 900 - box["y"] + 8)})
            print("  " + name)

        shot("none%s.png" % sfx)
        for k in opts:
            pg.evaluate(PLACE, k); pg.wait_for_timeout(300)
            shot("%s%s.png" % (k, sfx))
        br.close()

run("light", ["head", "tabs", "body"])
run("dark", ["head"])
