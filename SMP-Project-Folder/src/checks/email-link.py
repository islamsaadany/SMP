"""A LINK IN AN EMAIL HAS NOTHING TO BE RELATIVE TO (spec 027).

Islam sent himself a message with a button and pressed it: macOS answered
"The application can't be opened. -50". The link was `smp-orpin-tau.vercel.app`
— what he typed, taken exactly as typed and mailed. A BROWSER forgives a
missing scheme because it has an address bar to guess with; an EMAIL has no
base document, so the mail client hands the raw string to the operating
system, which looks for a file of that name and gives up. The button was dead
for every person who received it, and nothing on the way out said so.

WHY NOTHING CAUGHT IT. Grep the suite before this file existed and no check
presses "Send a test" or "Send me a copy" at all — the whole surface is the
empty state over `file://` (§94.11), so it was never driven. Every assertion
that did exist asks whether the page RENDERS, and a dead link renders
perfectly.

WHAT IS ASSERTED IS THE LINK THAT LEAVES, read out of the html actually posted
to /api/mail — never the value in the box, which is what looked right the
whole time. Both surfaces, because a unit and a function are the same product
(§53.5) and so are two ways of sending one email.
"""
import json, pathlib, re, threading, http.server, socketserver
from playwright.sync_api import sync_playwright

ROOT = pathlib.Path("/home/user/SMP")
HTML = (ROOT / "SMP-Project-Folder/src/strategy-management-platform.html").read_bytes()
STATE = json.loads((ROOT / "db/seed-state.json").read_text())
for p in STATE.get("people", []):
    if p.get("key") == "smo":
        p["email"] = "smo@example.com"
PERSON = {"key": "smo", "name": "Mohamed Essam", "role": "super"}
TO = [{"key": "p1", "name": "Person One", "email": "p1@example.com"}]

POSTED = []
bad, errs = 0, []


def ck(w, ok, x=""):
    global bad
    if not ok:
        bad += 1
    print(("  ok      " if ok else "  FAIL    ") + w + (("  — " + str(x)) if not ok and x else ""))


class H(http.server.BaseHTTPRequestHandler):
    def log_message(self, *a): pass
    def _send(self, c, b, t):
        self.send_response(c); self.send_header("Content-Type", t)
        self.send_header("Content-Length", str(len(b))); self.end_headers(); self.wfile.write(b)
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
                return self._json({"ok": True, "hasKey": True, "from": "smp@example.com",
                                   "domain": "example.com", "sandbox": False,
                                   "domainCheck": {"asked": True, "ok": True, "status": "verified"},
                                   "you": {"name": "Mohamed Essam", "key": "smo"}})
            if a == "audience":
                return self._json({"ok": True, "to": TO, "skipped": [],
                                   "active": 1, "withAddress": 1})
            if a in ("send", "test"):
                return self._json({"ok": True, "sent": len(TO), "failed": 0})
            if a == "history": return self._json({"ok": True, "messages": []})
            if a == "draftList": return self._json({"ok": True, "drafts": []})
        return self._json({"ok": True})


srv = socketserver.ThreadingTCPServer(("127.0.0.1", 0), H)
srv.daemon_threads = True
PORT = srv.server_address[1]
threading.Thread(target=srv.serve_forever, daemon=True).start()
URL = "http://127.0.0.1:%d/raya-trade" % PORT
ORIGIN = "http://127.0.0.1:%d" % PORT


def links(html):
    """Every href in a built email."""
    return re.findall(r'<a href="([^"]*)"', html or "")


def last(action):
    xs = [p for p in POSTED if p.get("action") == action]
    return xs[-1] if xs else None


def to_send(pg):
    pg.click('#units [data-md="setup"]'); pg.wait_for_timeout(400)
    for g in pg.eval_on_selector_all(".setuprail .rgroup.shut", "e=>e.map(x=>x.dataset.railgrp)"):
        pg.click('.setuprail [data-railgrp="%s"]' % g); pg.wait_for_timeout(60)
    pg.click('.setuprail [data-setupgo="send"]'); pg.wait_for_timeout(1000)


def compose(pg, subject, body_text, label, href):
    pg.click('.secrow [role=tab]:nth-of-type(2)'); pg.wait_for_timeout(800)
    # THE AUDIENCE HAS TO BE RESOLVED, not merely ticked: `st.aud` is what the
    # server answered, and Send counts THAT. Setting the criteria alone leaves
    # it null and the send is refused for a reason this check is not about.
    pg.evaluate("""(o) => { const st = sendmsg();
      st.criteria.everyone = true; st.subject = o.s; st.body = o.b;
      sendmsgAsk(); paint(); }""", {"s": subject, "b": body_text})
    pg.wait_for_timeout(1000)
    # FILLED AFTER THE PAINT, which rebuilds these two boxes.
    pg.fill("#msgctalabel", label)
    pg.fill("#msgctahref", href)
    # BLUR IS THE EVENT: the field writes on `change`, which for a text box
    # means when the person has finished (§35).
    pg.eval_on_selector("#msgctahref", "e=>e.blur()")
    pg.wait_for_timeout(500)


with sync_playwright() as pw:
    br = pw.chromium.launch(executable_path="/opt/pw-browsers/chromium-1194/chrome-linux/chrome")
    pg = br.new_page(viewport={"width": 1440, "height": 1000})
    # §167.2: the welcome screen covers the viewport and intercepts every click,
    # and it must be suppressed BEFORE goto or it is already up.
    pg.add_init_script("try{sessionStorage.setItem('smp.tour.later','1');"
                       "sessionStorage.setItem('smp.welcome.done','1');}catch(e){}")
    pg.on("console", lambda m: errs.append(m.text) if m.type == "error" else None)
    pg.on("pageerror", lambda e: errs.append(str(e)))
    pg.goto(URL); pg.wait_for_selector("nav.units", timeout=20000)

    # ── 1 · THE RULE ITSELF, on both sides of the one that bit ────────────
    print("\n1 · what counts as a link")
    # ASKED FOR AT ALL FIRST. On a build without the shared rule every call
    # below throws and the run dies at line one, which reports "the check is
    # broken" for what is really "the product has no such rule".
    has = pg.evaluate("()=>typeof (window.SMPRules||{}).webUrl === 'function'")
    ck("the platform has one rule for what a link is", has)
    r = pg.evaluate("""() => (!(window.SMPRules||{}).webUrl ? {} : {
      bare: SMPRules.webUrl("smp-orpin-tau.vercel.app"),
      full: SMPRules.webUrl("https://smp-orpin-tau.vercel.app/"),
      http: SMPRules.webUrl("http://x.io"),
      proto: SMPRules.webUrl("//x.io"),
      js: SMPRules.webUrl("javascript:alert(1)"),
      data: SMPRules.webUrl("data:text/html,x"),
      path: SMPRules.webUrl("/raya-trade"),
      words: SMPRules.webUrl("click here"),
      empty: SMPRules.webUrl("")
    })""")
    r = r or {}
    ck("a bare host is completed", r.get("bare") == "https://smp-orpin-tau.vercel.app", r.get("bare"))
    ck("a complete address is left alone", r.get("full") == "https://smp-orpin-tau.vercel.app/", r.get("full"))
    ck("http is a web address too", r.get("http") == "http://x.io", r.get("http"))
    ck("protocol-relative is completed", r.get("proto") == "https://x.io", r.get("proto"))
    # A scheme the product never sends must not survive: this same string is
    # rendered into the platform's own live preview, which is a page (§43.6).
    ck("javascript: is refused", r.get("js") == "", r.get("js"))
    ck("data: is refused", r.get("data") == "", r.get("data"))
    # A bare path is the trap that reads as reasonable and points at nothing
    # once the message has left the building.
    ck("a bare path is refused", r.get("path") == "", r.get("path"))
    ck("a sentence is refused", r.get("words") == "", r.get("words"))
    ck("empty stays empty", r.get("empty") == "", r.get("empty"))

    # ── 2 · THE FIELD COMPLETES WHAT WAS TYPED ───────────────────────────
    print("\n2 · the box completes it, where it was typed")
    to_send(pg)
    compose(pg, "The Q3 cycle opens", "Please report by Friday.",
            "Open the platform", "smp-orpin-tau.vercel.app")
    got = pg.input_value("#msgctahref")
    ck("the field shows the completed address", got == "https://smp-orpin-tau.vercel.app", got)
    # WRITTEN THROUGH, not merely displayed: the box and the state must agree,
    # or the send uses a value the person never saw.
    st = pg.evaluate("()=>sendmsg().ctaHref")
    ck("and the message holds the same one", st == "https://smp-orpin-tau.vercel.app", st)

    # ── 3 · WHAT ACTUALLY LEAVES ─────────────────────────────────────────
    print("\n3 · the link in the email that goes")
    before = len(POSTED)
    pg.click("#msgsend"); pg.wait_for_timeout(600)
    pg.click("[data-sendyes]"); pg.wait_for_timeout(1200)
    sent = last("send")
    ck("the send went", bool(sent))
    ls = links(sent.get("html") if sent else "")
    ck("the email carries exactly one button link", len(ls) == 1, ls)
    ck("and it is absolute", bool(ls) and ls[0].startswith("https://"), ls)
    ck("and it is the completed address, not the typed one",
       ls == ["https://smp-orpin-tau.vercel.app"], ls)
    # THE RECORD TOO: the Overview and a re-opened draft read this, so a raw
    # value stored here comes back into the composer and out again.
    ck("the record stores the completed address",
       sent and sent.get("ctaHref") == "https://smp-orpin-tau.vercel.app",
       sent and sent.get("ctaHref"))

    # ── 4 · A LINK THAT CANNOT BE COMPLETED IS REFUSED, NOT SENT ─────────
    print("\n4 · what cannot be a link stops the send")
    compose(pg, "Another one", "Body text here.", "Press me", "click here")
    n0 = len([p for p in POSTED if p.get("action") == "send"])
    pg.click("#msgsend"); pg.wait_for_timeout(800)
    said = pg.evaluate("()=>{const e=document.getElementById('msgsaid');"
                       "return e?e.textContent.trim():null}")
    # BOTH ENDS (§94.2): it must say so AND nothing may go. A build that
    # merely dropped the button silently would pass the second alone.
    ck("it says the link would not open", bool(said) and "would not open" in said, said)
    ck("and no confirmation was even offered",
       pg.evaluate("()=>!document.querySelector('[data-sendyes]')"))
    ck("and nothing was sent",
       len([p for p in POSTED if p.get("action") == "send"]) == n0)
    # A build WITHOUT the refusal opens the confirmation here, and an overlay
    # left standing intercepts every later click — so the run would die rather
    # than report the rest. Cleared defensively: the assertions above have
    # already said whether it should have been there at all.
    if pg.evaluate("()=>!!document.querySelector('[data-sendno]')"):
        pg.click("[data-sendno]"); pg.wait_for_timeout(400)

    # ── 5 · THE TEST EMAIL NEVER SHIPS A DEAD BUTTON ─────────────────────
    print("\n5 · the test send on Email settings")
    pg.click('.secrow [role=tab]:nth-of-type(3)'); pg.wait_for_timeout(1000)
    pg.evaluate("()=>document.querySelector('[data-mailtest]').scrollIntoView({block:'center'})")
    pg.wait_for_timeout(250)
    pg.click("[data-mailtest]"); pg.wait_for_timeout(1200)
    t = last("test")
    ck("the test went", bool(t))
    tl = links(t.get("html") if t else "")
    ck("its button link is absolute", bool(tl) and tl[0].startswith("http"), tl)
    # THE FAULT, NAMED: "#" is a quiet no-op on a page and a -50 in an inbox.
    ck("and is never '#'", "#" not in tl, tl)

    # ── 6 · BOTH EMAILS MEAN THE SAME PLACE ──────────────────────────────
    print("\n6 · one answer to where the platform is")
    where = pg.evaluate("()=>commsShape().href")
    ck("the platform's own address is the platform, not the gate",
       where == ORIGIN + "/raya-trade", where)
    ck("and the test email uses it", tl == [where], [tl, where])

    ck("no console errors", not errs, errs[:3])
    br.close()

print("\n%s — %d failed" % ("FAILED" if bad else "all good", bad))
raise SystemExit(1 if bad else 0)
