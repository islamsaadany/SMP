"""SEND A MESSAGE OPENS ON WHAT WAS SENT (proposed).

Islam: "The opening page of the send the email should be a dashboard of what
was sent, to whom, how many people ... and when I say create a message it takes
me to another tab to send the message, and when I finish and send it it should
take me back to the dashboard and show me that the message was sent there. It
should be a cleaner configuration."

DRAWN IN THE LIVE PAGE, not on a blank canvas: the platform is served with the
send-message stub, walked to Setup > Send a message, and the PANEL's contents
are replaced with the proposal — so the chrome, the rail, the type and every
class around it are the product's own (§41.9). The dashboard is assembled with
the page's OWN `section()`, so it cannot look like something the product could
not build.
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
   "who": "Everyone on the register", "total": 79, "sent": 76, "failed": 0},
  {"id": 3, "subject": "Reminder \u2014 figures close on Friday",
   "sent_at": "2026-08-20T08:00", "by_name": "Mohamed Essam",
   "who": "Unit owners \u00b7 Strategy custodians", "total": 22, "sent": 22, "failed": 0},
  {"id": 2, "subject": "Mobile: your plan has been updated",
   "sent_at": "2026-08-14T16:40", "by_name": "Nadia Fahmy",
   "who": "Mobile", "total": 9, "sent": 9, "failed": 0},
  {"id": 1, "subject": "Welcome to the platform",
   "sent_at": "2026-08-01T10:05", "by_name": "Mohamed Essam",
   "who": "Everyone on the register", "total": 79, "sent": 71, "failed": 8},
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

OUT = ROOT / "design-mockups/send-dashboard/shots"
OUT.mkdir(parents=True, exist_ok=True)

# ── THE DASHBOARD ────────────────────────────────────────────────────
# Built with the page's own `section()` and `.cfg table`, so the columns, the
# rules and the type are the register's and the Sent panel's, not new ones.
DASH = """(o) => {
  const esc = (s) => String(s == null ? "" : s)
    .replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;");
  const when = (s) => String(s || "").slice(0,16).replace("T"," ");

  const head =
    '<div class="phead2"><h1 class="ptitle">Send a message</h1>' +
      '<div class="hright">' +
        '<button class="editbtn cta" id="mockwrite">Write a message</button>' +
      '</div>' +
    '</div>';

  /* THE OUTCOME LANDS HERE, not on the composer you have just left. */
  const said = o.said
    ? '<div class="sentsaid"><b>' + esc(o.said) + '</b>' +
      (o.saidQuiet ? ' <span class="quiet">' + esc(o.saidQuiet) + '</span>' : '') +
      '</div>'
    : '';

  const drafts = o.drafts.length
    ? section("", "Not sent yet",
        "Pick one up where you left it, or throw it away.",
        '<div class="cfg"><table><thead><tr>' +
          '<th style="width:56%">Heading</th>' +
          '<th style="width:26%">Last saved</th>' +
          '<th style="width:18%">By</th></tr></thead><tbody>' +
        o.drafts.map(d =>
          '<tr><td><button class="linkbu"><b>' + esc(d.subject) + '</b></button></td>' +
          '<td>' + when(d.updated_at) + '</td>' +
          '<td>' + esc(d.by_name) + '</td></tr>').join("") +
        '</tbody></table></div>')
    : '';

  const sent = section("", "What has been sent",
    "The record lives outside the saved data, so a save cannot erase it. " +
    "Open one to see what happened to each person.",
    '<div class="cfg"><table><thead><tr>' +
      '<th style="width:34%">Heading</th>' +
      '<th style="width:16%">Sent</th>' +
      '<th style="width:23%">Who it went to</th>' +
      '<th class="cc" style="width:13%">Reached</th>' +
      '<th style="width:14%">By</th></tr></thead><tbody>' +
    o.sent.map((m,i) =>
      '<tr' + (i === 0 && o.said ? ' class="justsent"' : '') + '>' +
      '<td><button class="linkbu"><b>' + esc(m.subject) + '</b></button></td>' +
      '<td>' + when(m.sent_at) + '</td>' +
      '<td>' + esc(m.who) + '</td>' +
      '<td class="cc">' + m.sent + ' of ' + m.total +
        (m.failed ? ' <span class="pill bad">' + m.failed + ' failed</span>' : '') + '</td>' +
      '<td>' + esc(m.by_name) + '</td></tr>').join("") +
    '</tbody></table></div>');

  const st = document.createElement("style");
  st.textContent =
    '.sentsaid{margin:0 0 18px;padding:11px 16px;border-radius:8px;' +
      'background:var(--good-bg);border:1px solid var(--good);' +
      'font-size:var(--fs-note);color:var(--good-tx)}' +
    '.sentsaid .quiet{color:var(--ink-2);font-weight:400}' +
    'tr.justsent td{background:var(--good-bg)}';
  document.head.appendChild(st);
  /* INTO THE PANE, never `#panel` — the Setup rail is the panel's first child,
     so replacing the panel takes the navigation with it and the picture stops
     being a picture of this product. */
  const pane = document.querySelector(".setuppane");
  if (!pane) return false;
  pane.innerHTML = head + said + drafts + sent;
  return true;
}"""

# ── THE COMPOSER, WITH A WAY BACK ────────────────────────────────────
BACK = """() => {
  /* The pane's sticky title is `.setupttl` inside `.setuphead` (§121.2) — NOT
     `.ptitle`, which is the register's own header. The first build aimed at
     the wrong one and the way back simply did not appear. */
  const t = document.querySelector(".setuphead .setupttl");
  if (!t) return false;
  t.innerHTML = '<button class="linkbu backbu">\u2039 Messages</button>' +
                '<span style="display:block">Write a message</span>';
  const st = document.createElement("style");
  st.textContent = '.backbu{display:block;font-size:var(--fs-small);' +
    'color:var(--gold-deep);margin-bottom:1px;font-weight:600;letter-spacing:.02em}';
  document.head.appendChild(st);
  /* Drafts and Sent were header dropdowns; the dashboard is where they live
     now, so nothing here duplicates it. */
  document.querySelectorAll("[data-draftmenu],[data-sentmenu]").forEach(e => {
    const w = e.closest("details") || e; w.remove(); });
  return true;
}"""


def shot(pg, name):
    pg.evaluate("() => window.scrollTo(0,0)")
    pg.wait_for_timeout(250)
    pg.screenshot(path=str(OUT / name))
    print("  wrote " + name)


def run(theme):
    sfx = "" if theme == "light" else "-dark"
    with sync_playwright() as pw:
        br = pw.chromium.launch()
        pg = br.new_page(viewport={"width": 1400, "height": 1180},
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

        # 1 · TODAY — the composer is what the page opens on.
        shot(pg, "today%s.png" % sfx)

        # 2 · THE DASHBOARD, as it would open.
        pg.evaluate(DASH, {"sent": SENT, "drafts": DRAFTS, "said": None})
        pg.wait_for_timeout(300)
        shot(pg, "dashboard%s.png" % sfx)

        # 3 · THE COMPOSER, reached from it, with a way back.
        pg.evaluate("() => paint()")
        pg.wait_for_timeout(600)
        pg.evaluate("""() => { const st = sendmsg();
          st.criteria.everyone = true;
          st.subject = "The Q3 reporting cycle opens on Monday";
          st.body = "The cycle opens on Monday 1 September and closes on Friday "
                  + "12 September.";
          sendmsgAsk(); paint(); }""")
        pg.wait_for_timeout(1000)
        pg.evaluate(BACK)
        pg.wait_for_timeout(250)
        shot(pg, "compose%s.png" % sfx)

        # 4 · BACK ON THE DASHBOARD, with the message that just went.
        pg.evaluate(DASH, {"sent": SENT, "drafts": DRAFTS,
                           "said": "Sent to 76 people.",
                           "saidQuiet": "3 skipped — no address on their row."})
        pg.wait_for_timeout(300)
        shot(pg, "after-send%s.png" % sfx)
        br.close()


for t in ("light", "dark"):
    print(t + ":")
    run(t)
print("done -> " + str(OUT))
