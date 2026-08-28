"""SEND A MESSAGE OPENS ON WHAT WENT (§137).

Islam: "The opening page of Send a message should be a dashboard of what was
sent, to whom, how many people ... and when I say create a message it takes me
to another tab ... and when I finish and send it it should take me back to the
dashboard and show me that the message was sent there. It should be a cleaner
configuration." And: "change messages to Overview."

WHAT THIS IS REALLY FOR. Two things, and neither is visible in a screenshot of
a page that renders:

  · THE LISTS MUST RESOLVE. Both fetches were gated on `#msgsend` — the Send
    button — which now lives on the other tab, so on the Overview neither list
    was ever asked and both said "Asking..." for ever (§93, §51.11: a gate
    keyed on markup that moved, failing silently and in the safe-looking
    direction). Found by driving it, not by reading it.

  · A SEND MUST LAND ON THE RECORD, with the composer emptied behind it — which
    is also what keeps §136's rule alive: the send cannot be repeated by one
    press, by construction now rather than by a flag.

OVER HTTP, because this whole page is the empty state over `file://` (§94.11).
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
            POSTED.append(body)
            if a == "status":
                return self._json({"ok": True, "key": True, "from": "smp@example.com",
                                   "domain": "example.com", "verified": True})
            if a == "audience":
                return self._json({"ok": True, "to": TO, "skipped": SKIPPED,
                                   "active": len(TO) + len(SKIPPED), "withAddress": len(TO)})
            if a == "draftList": return self._json({"ok": True, "drafts": DRAFTS})
            if a == "history":  return self._json({"ok": True, "messages": SENT})
            if a in ("send", "test"):
                if DOWN:
                    return self._send(500, b'{"ok":false,"error":"Could not reach Resend."}',
                                      "application/json")
                return self._json({"ok": True, "sent": len(TO) - FAILN, "failed": FAILN})
        return self._json({"ok": True})


srv = socketserver.ThreadingTCPServer(("127.0.0.1", 0), H)
srv.daemon_threads = True
PORT = srv.server_address[1]
threading.Thread(target=srv.serve_forever, daemon=True).start()
URL = "http://127.0.0.1:%d/raya-trade" % PORT

POSTED = []      # every body the page sent to /api/mail
FAILN = 0        # how many the stub reports as failed
DOWN = False     # the send never reaches the server
bad, errs = 0, []


def ck(w, ok, x=""):
    global bad
    if not ok:
        bad += 1
    print(("  ok      " if ok else "  FAIL    ") + w + (("  — " + str(x)) if not ok and x else ""))

# ── WHAT IS ON SCREEN ────────────────────────────────────────────────
READ = """() => {
  const txt = (e) => e ? e.textContent.replace(/\\s+/g, " ").trim() : null;
  const tabs = Array.from(document.querySelectorAll(".secrow [role=tab]"))
    .map(b => ({ label: b.textContent.trim(), on: b.getAttribute("aria-selected") === "true" }));
  const rows = Array.from(document.querySelectorAll("#msgover .section")).slice(-1)[0];
  return {
    tabs: tabs,
    on: (tabs.filter(t => t.on)[0] || {}).label || null,
    /* NO GREY DESCRIPTIONS anywhere on either tab (CLAUDE.md 1b-ii). Its
       ABSENCE is the assertion, so it is counted rather than looked for. */
    notes: document.querySelectorAll("#panel .sec-note").length,
    /* The two header dropdowns are the lists in a second place (§90). */
    menus: document.querySelectorAll("[data-draftmenu],[data-sentmenu]").length,
    overview: !!document.getElementById("msgover"),
    headings: Array.from(document.querySelectorAll("#msgover .section h2"))
                   .map(h => h.textContent.trim()),
    /* "Asking..." is what a list that was never fetched says for ever. */
    asking: (txt(document.getElementById("msgover")) || "").indexOf("Asking") > -1,
    sentRows: Array.from(document.querySelectorAll("#msgover .section")).slice(-1)
      .flatMap(s => Array.from(s.querySelectorAll("tbody tr"))
        .map(tr => Array.from(tr.children).map(td => td.textContent.trim()))),
    said: txt(document.querySelector(".sentsaid")),
    saidBad: !!document.querySelector(".sentsaid.bad"),
    barSaid: txt(document.getElementById("msgsaid")),
    barSaidBad: !!document.querySelector("#msgsaid.bad"),
    /* The send button exists only on the composer — so its ABSENCE on the
       Overview is what says the send cannot be repeated by one press. */
    sendShown: (() => { const e = document.getElementById("msgsend");
                        return !!e && e.getClientRects().length > 0; })(),
    /* THE OVERVIEW'S OWN LOUD CONTROL (§137.8) — and `elementFromPoint` at its
       centre, never "it is in the document": §90, §93.4 and §110 are all
       controls that were present, styled and enabled while hitting something
       else, and none would have failed a query. */
    writeBtn: (() => { const e = document.querySelector("[data-msgwrite]");
                       return e ? e.textContent.trim() : null; })(),
    writeHits: (() => {
      const e = document.querySelector("[data-msgwrite]"); if (!e) return null;
      const r = e.getBoundingClientRect();
      if (!r.width || !r.height) return "no box";
      const at = document.elementFromPoint(r.left + r.width / 2, r.top + r.height / 2);
      return at ? (at === e || e.contains(at) || at.contains(e) ? "itself" : at.tagName) : "nothing";
    })(),
    /* ABOVE THE LISTS, which is the placement Islam picked (C, not the header).
       Measured against the first heading rather than by position in the markup. */
    writeAboveLists: (() => {
      const b = document.querySelector("[data-msgwrite]");
      const h = document.querySelector("#msgover .section h2");
      if (!b || !h) return null;
      return b.getBoundingClientRect().bottom <= h.getBoundingClientRect().top + 2;
    })(),
    subject: (typeof sendmsg === "function") ? sendmsg().subject : null,
    body: (typeof sendmsg === "function") ? sendmsg().body : null
  };
}"""


def open_page(pw):
    br = pw.chromium.launch()
    pg = br.new_page(viewport={"width": 1400, "height": 1100})
    pg.add_init_script("try{sessionStorage.setItem('smp.tour.later','1');}catch(e){}")
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
    pg.wait_for_timeout(1100)
    return br, pg


def to_write(pg):
    pg.click('.secrow [role=tab]:nth-of-type(2)')
    pg.wait_for_timeout(900)
    pg.evaluate("""() => { const st = sendmsg();
      st.criteria.everyone = true;
      st.subject = "The Q3 reporting cycle opens on Monday";
      st.body = "The cycle opens on Monday 1 September."; sendmsgAsk(); paint(); }""")
    pg.wait_for_timeout(1000)


def send(pg):
    pg.click("#msgsend")
    pg.wait_for_timeout(400)
    pg.click("[data-sendyes]")
    pg.wait_for_timeout(1600)


def go():
    global FAILN, DOWN
    with sync_playwright() as pw:
        # ══ 1 · IT OPENS ON THE RECORD ═════════════════════════════
        print("\n1 · the page opens on what went")
        br, pg = open_page(pw)
        r = pg.evaluate(READ)
        ck("there are two tabs",
           [t["label"] for t in r["tabs"]] == ["Overview", "Write a message"], r["tabs"])
        ck("and it opens on Overview", r["on"] == "Overview", r["on"])
        ck("which draws both lists",
           r["headings"] == ["Not sent yet", "What has been sent"], r["headings"])
        # THE FAULT THIS CHECK EXISTS FOR: gated on a control that moved tabs.
        ck("the lists actually resolve", not r["asking"], "still Asking...")
        ck("no grey descriptions", r["notes"] == 0, r["notes"])

        # ── THE ACTION IS OBVIOUS (§137.8) ──────────────────────────
        ck("there is a loud control for the action",
           r["writeBtn"] == "Send an email", r["writeBtn"])
        ck("it can actually be pressed", r["writeHits"] == "itself", r["writeHits"])
        ck("and it sits above the lists, where Islam put it",
           r["writeAboveLists"] is True, r["writeAboveLists"])
        ck("and no header dropdowns duplicating the lists", r["menus"] == 0, r["menus"])

        # WHO IT WENT TO, in the platform's own words rather than keys or JSON.
        who = [row[2] for row in r["sentRows"]]
        ck("who it went to reads in words",
           "Everyone on the register" in who and "Mobile" in who, who)
        ck("a role audience is named, not keyed",
           any("owner" in w.lower() and "{" not in w for w in who), who)
        ck("nothing shows raw criteria", not any("{" in w for w in who), who)

        # ══ 2 · WRITING IS THE OTHER TAB ═══════════════════════════
        print("\n2 · writing one")
        # PRESSED, not navigated around: the button is the way in this section
        # exists for, so the check goes the way a person would.
        pg.click("[data-msgwrite]")
        pg.wait_for_timeout(900)
        r = pg.evaluate(READ)
        ck("the button opens the composer", r["on"] == "Write a message", r["on"])
        # A control offering to take you where you are is a duplicate (§94.15).
        ck("and it is not drawn there", r["writeBtn"] is None, r["writeBtn"])
        pg.click('.secrow [role=tab]:nth-of-type(1)')
        pg.wait_for_timeout(800)
        to_write(pg)
        r = pg.evaluate(READ)
        ck("the composer is the second tab", r["on"] == "Write a message", r["on"])
        ck("Send is there", r["sendShown"])
        ck("still no grey descriptions", r["notes"] == 0, r["notes"])

        # ══ 3 · SENDING BRINGS YOU BACK ════════════════════════════
        print("\n3 · sending lands on the record")
        del POSTED[:]
        send(pg)
        r = pg.evaluate(READ)
        ck("one send went", len([p for p in POSTED if p.get("action") == "send"]) == 1)
        ck("it lands on Overview", r["on"] == "Overview", r["on"])
        ck("the outcome is stated there",
           "76 messages sent" in (r["said"] or ""), r["said"])
        ck("and it names who was skipped",
           "3 people skipped" in (r["said"] or ""), r["said"])
        ck("in the good voice", not r["saidBad"])
        # §136's rule, kept by construction: there is no Send to press.
        ck("the send cannot be repeated by one press", not r["sendShown"])
        ck("and the composer it left behind is empty",
           not r["subject"] and not r["body"], "%r / %r" % (r["subject"], r["body"]))
        br.close()

        # ══ 4 · A PARTIAL FAILURE IS STILL A SEND ══════════════════
        print("\n4 · when some of them failed")
        FAILN = 4
        br, pg = open_page(pw)
        to_write(pg)
        send(pg)
        r = pg.evaluate(READ)
        ck("it still lands on the record", r["on"] == "Overview", r["on"])
        ck("the failure is stated", "failed" in (r["said"] or ""), r["said"])
        ck("in the bad voice", r["saidBad"])
        ck("and it still cannot be repeated by one press", not r["sendShown"])
        FAILN = 0
        br.close()

        # ══ 5 · A SEND THAT NEVER HAPPENED STAYS PUT ═══════════════
        # The one case that must NOT navigate: nothing went, so the message has
        # to still be here to try again.
        print("\n5 · when the send never happened")
        DOWN = True
        br, pg = open_page(pw)
        to_write(pg)
        send(pg)
        r = pg.evaluate(READ)
        ck("it stays on the composer", r["on"] == "Write a message", r["on"])
        ck("the message is still loaded", bool(r["subject"]) and bool(r["body"]))
        ck("Send is still there to try again", r["sendShown"])
        ck("and the bar says what went wrong", bool(r["barSaid"]), r["barSaid"])
        ck("in the bad voice", r["barSaidBad"])
        DOWN = False
        br.close()

        # THE 500 IN §5 IS THE FIXTURE, not a fault — the stub is told to fail.
        # Anything else, including any uncaught page error, still counts.
        left = [e for e in errs if "500" not in e]
        ck("no console errors anywhere in that", not left, left[:3])


go()
print("\n%s" % ("ALL GOOD" if not bad else "%d FAILED" % bad))
raise SystemExit(1 if bad else 0)
