"""THE EMAIL GREETS ITS RECEIVER — THE CLIENT HALF (spec 021).

Islam: "customize the email by the first name of the reciever like starting the
email with Dear Ahmed ... it's a turn on and off option." And of the first
draft of the row: "the design of the setting is poor. It should be one line you
dont need 2 lines .. and no explanations needed in the setting itself it's
clear."

WHAT THIS MEASURES, AND WHAT IT DELIBERATELY DOES NOT. The naming itself — who
gets called what, and what happens to a row with no usable name — is the
SERVER's, and `scripts/test-email-greeting.js` proves it against a real
Postgres by standing in front of the provider and reading what each recipient
was actually sent. Reproducing that here would be a second copy of the rule
(§42). What is measured here is the SCREEN: that the row is one line with no
prose, that pressing it does what it says, and that what the page POSTS carries
the region for the server to fill — the seam between the two halves.

OVER HTTP, because this whole page is the empty state over `file://` (§94.11):
the audience is resolved by a server, so opened from a file there is nothing to
send and every measurement below is of a page saying so.
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
                return self._json({"ok": True, "sent": len(TO), "failed": 0})
        return self._json({"ok": True})


srv = socketserver.ThreadingTCPServer(("127.0.0.1", 0), H)
srv.daemon_threads = True
PORT = srv.server_address[1]
threading.Thread(target=srv.serve_forever, daemon=True).start()
URL = "http://127.0.0.1:%d/raya-trade" % PORT


# ── WHAT IS ON SCREEN ────────────────────────────────────────────────
# `elementFromPoint` at each control's own centre, never "the element exists":
# §90, §93.4 and §110 are all controls that were present, styled and enabled
# while hitting something else, and none would have failed a query.
READ = """() => {
  const hits = (s) => {
    const e = document.querySelector(s); if (!e) return null;
    const r = e.getBoundingClientRect();
    if (!r.width || !r.height) return "no box";
    const at = document.elementFromPoint(r.left + r.width / 2, r.top + r.height / 2);
    return at ? (at === e || e.contains(at) || at.contains(e) ? "itself" : at.tagName) : "nothing";
  };
  const row = document.querySelector(".greetrow");
  const word = document.getElementById("msggreet");
  const sw = document.querySelectorAll("[data-greet]");
  const body = (() => {
    const h = document.getElementById("msgprev");
    if (!h || !h.shadowRoot) return null;
    const b = h.shadowRoot.querySelector("[data-mail-body]");
    return b ? b.textContent.replace(/\\s+/g, " ").trim() : null;
  })();
  const firstPara = (() => {
    const h = document.getElementById("msgprev");
    if (!h || !h.shadowRoot) return null;
    const p = h.shadowRoot.querySelector("[data-mail-body] p");
    return p ? p.textContent.trim() : null;
  })();
  return {
    row: !!row,
    rowH: row ? Math.round(row.getBoundingClientRect().height) : null,
    /* ONE LINE is measured as one line of CONTROLS, not as a height: a height
       is a number that changes the day a font does — and the row legitimately
       grows a little when a text input joins a chip and a label.

       CLUSTERED BY THE MIDDLE, NEVER THE TOP (§122.4). Three controls of three
       heights sitting on one line have three different tops; what makes it one
       line is that their centres agree. The tolerance is the tallest one's
       half-height, so it comes from the row rather than from a number somebody
       picked. */
    rowMids: row ? Array.from(row.querySelectorAll(".cfg-lab, .fld, .minisw"))
                        .map(e => { const b = e.getBoundingClientRect();
                                    return { mid: b.top + b.height / 2, h: b.height }; }) : [],
    /* NO PROSE IN THE SETTING (Islam). `.why` is how every other row on this
       page explains itself, so its ABSENCE here is the assertion. */
    rowWhy: row ? row.querySelectorAll(".why").length : null,
    wordShown: !!word,
    wordW: word ? Math.round(word.getBoundingClientRect().width) : null,
    wordVal: word ? word.value : null,
    wordHits: hits("#msggreet"),
    swHits: hits('[data-greet="1"]'),
    /* THE SWITCH MUST NOT MOVE when the word box appears (§41.8). */
    swX: sw.length ? Math.round(sw[0].getBoundingClientRect().left) : null,
    pressed: Array.from(sw).map(b => b.getAttribute("aria-pressed")),
    say: (() => { const e = document.querySelector(".greetsay");
                  return e ? e.textContent.trim() : null; })(),
    firstPara: firstPara,
    bodyText: body,
    /* The row belongs with the button row, under the message. */
    orderOK: (() => {
      const g = document.querySelector(".greetrow"), c = document.querySelector(".ctarow:not(.greetrow)");
      const p = document.getElementById("msgprev");
      if (!g || !c || !p) return null;
      return p.getBoundingClientRect().bottom <= g.getBoundingClientRect().top + 2 &&
             g.getBoundingClientRect().bottom <= c.getBoundingClientRect().top + 2;
    })()
  };
}"""


def one_line(r):
    """One line = every control's vertical centre within the tallest one."""
    m = r.get("rowMids") or []
    if len(m) < 2:
        return len(m) == 1
    tall = max(x["h"] for x in m)
    return (max(x["mid"] for x in m) - min(x["mid"] for x in m)) <= tall / 2


def go():
    global bad
    with sync_playwright() as pw:
        br = pw.chromium.launch()
        pg = br.new_page(viewport={"width": 1440, "height": 950})
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
        pg.wait_for_timeout(800)
        if not pg.query_selector("#msgsend"):
            ck("the page opens", False, "no send button")
            return
        ck("the page opens", True)

        pg.evaluate("""() => {
          const st = sendmsg();
          st.criteria.everyone = true;
          st.subject = "The Q3 reporting cycle opens on Monday";
          st.body = "The cycle opens on Monday 1 September.";
          sendmsgAsk(); paint();
        }""")
        pg.wait_for_timeout(800)

        # ══ 1 · OFF IS THE DEFAULT, AND OFF IS ONE LINE ══════════════
        print("\n1 · off, which is how every message opens")
        # Below the fold on a 950px window, and `elementFromPoint` answers
        # about the VIEWPORT — a control off-screen reports as unreachable when
        # it is merely unscrolled-to.
        pg.eval_on_selector(".greetrow", "e => e.scrollIntoView({block:'center'})")
        pg.wait_for_timeout(250)
        r = pg.evaluate(READ)
        ck("the row is on the page", r["row"])
        ck("it is Off by default", r["pressed"] == ["true", "false"], r["pressed"])
        ck("no word box while it is off", not r["wordShown"])
        ck("no sample line while it is off", r["say"] is None, r["say"])
        ck("no prose in the setting", r["rowWhy"] == 0, r["rowWhy"])
        ck("every control shares one line", one_line(r), r["rowMids"])
        ck("the message opens with the body, not a greeting",
           (r["firstPara"] or "").startswith("The cycle opens"), r["firstPara"])
        offX, offH = r["swX"], r["rowH"]

        # ══ 2 · TURNING IT ON ═══════════════════════════════════════
        print("\n2 · on")
        ck("the On half can actually be pressed", r["swHits"] == "itself", r["swHits"])
        pg.click('[data-greet="1"]')
        pg.wait_for_timeout(500)
        r = pg.evaluate(READ)
        ck("it reads On", r["pressed"] == ["false", "true"], r["pressed"])
        ck("the word box appears", r["wordShown"])
        ck("it starts at Dear", r["wordVal"] == "Dear", r["wordVal"])
        ck("the box is sized for one word", r["wordW"] and r["wordW"] <= 160, r["wordW"])
        ck("the box can be reached", r["wordHits"] == "itself", r["wordHits"])
        ck("STILL one line, with the word box in it", one_line(r), r["rowMids"])
        ck("still no prose in the setting", r["rowWhy"] == 0, r["rowWhy"])
        # §41.8 — a control that shifts under the press that produced it.
        ck("the switch did not move", r["swX"] == offX, "%s -> %s" % (offX, r["swX"]))
        # NOT a pixel height: a text input is taller than a chip, so the row
        # genuinely grows a few pixels, and asserting otherwise would assert a
        # number rather than the thing Islam asked for (§94.8).
        ck("and it stays a single row rather than becoming two",
           r["rowH"] and r["rowH"] < 60, r["rowH"])

        # ══ 3 · WHAT THE MESSAGE NOW SAYS ═══════════════════════════
        print("\n3 · the preview")
        ck("the message opens “Dear Ahmed,”", r["firstPara"] == "Dear Ahmed,", r["firstPara"])
        ck("the body is still there",
           "The cycle opens on Monday" in (r["bodyText"] or ""), r["bodyText"])
        ck("and one short line says the name is a sample",
           r["say"] == "Everyone sees their own name here.", r["say"])
        ck("the row still sits between the message and the button row", r["orderOK"] is True)

        # THE WORD IS THE SENDER'S. Typed, not chosen from a list.
        pg.fill("#msggreet", "Hi")
        pg.wait_for_timeout(400)
        r = pg.evaluate(READ)
        ck("typing the word changes the message", r["firstPara"] == "Hi Ahmed,", r["firstPara"])
        # §35 — a repaint would replace the box being typed into.
        ck("and the box being typed into survives it",
           pg.evaluate("() => document.activeElement && document.activeElement.id") == "msggreet",
           pg.evaluate("() => document.activeElement && document.activeElement.id"))
        pg.fill("#msggreet", "Dear")
        pg.wait_for_timeout(300)

        # ══ 4 · WHAT THE PAGE POSTS ═════════════════════════════════
        # The seam: the browser must NOT name anybody, because who the
        # recipients are is the server's answer (§74.2).
        print("\n4 · what is posted for the server to fill")
        del POSTED[:]
        pg.click("#msgsend")
        pg.wait_for_timeout(400)
        pg.click("[data-sendyes]")
        pg.wait_for_timeout(900)
        sent = [p for p in POSTED if p.get("action") == "send"]
        ck("the send goes", len(sent) == 1, len(sent))
        if sent:
            s = sent[0]
            ck("it carries the greeting word", s.get("greet") == "Dear", s.get("greet"))
            ck("the html carries the region for the server to fill",
               "<!--smp-greet-->" in (s.get("html") or "") and
               "<!--smp-name-->" in (s.get("html") or ""))
            # THE BROWSER NAMES NOBODY. A build that resolved the sample into
            # the posted html would send "Dear Ahmed," to all seventy-six.
            ck("and it names NOBODY",
               "Dear Ahmed," not in (s.get("html") or ""),
               (s.get("html") or "")[:0])

        # ══ 5 · OFF POSTS WHAT IT ALWAYS POSTED ═════════════════════
        print("\n5 · off is byte-identical to before this existed")
        pg.click('[data-greet="0"]')
        pg.wait_for_timeout(500)
        r = pg.evaluate(READ)
        ck("the word box goes", not r["wordShown"])
        ck("the sample line goes with it", r["say"] is None, r["say"])
        ck("the greeting leaves the message",
           (r["firstPara"] or "").startswith("The cycle opens"), r["firstPara"])
        del POSTED[:]
        pg.click("#msgsend")
        pg.wait_for_timeout(400)
        pg.click("[data-sendyes]")
        pg.wait_for_timeout(900)
        sent = [p for p in POSTED if p.get("action") == "send"]
        ck("the send goes", len(sent) == 1, len(sent))
        if sent:
            s = sent[0]
            ck("nothing is posted for the greeting", s.get("greet") in (None, ""), s.get("greet"))
            ck("and the html carries no region at all",
               "<!--smp-greet-->" not in (s.get("html") or ""))

        # ══ 6 · A DRAFT CARRIES IT ══════════════════════════════════
        print("\n6 · a draft carries the switch")
        pg.click('[data-greet="1"]')
        pg.wait_for_timeout(400)
        pg.fill("#msggreet", "Dear")
        pg.wait_for_timeout(200)
        del POSTED[:]
        pg.click("#msgdraft")
        pg.wait_for_timeout(800)
        saved = [p for p in POSTED if p.get("action") == "draftSave"]
        ck("the draft is saved", len(saved) == 1, len(saved))
        if saved:
            ck("with the greeting word on it", saved[0].get("greet") == "Dear",
               saved[0].get("greet"))

        ck("no console errors anywhere in that", not errs, errs[:3])
        br.close()


go()
print("\n%s" % ("ALL GOOD" if not bad else "%d FAILED" % bad))
raise SystemExit(1 if bad else 0)
