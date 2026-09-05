"""NO COMPOSER OVER A LIST OF PEOPLE, AND A TEST THAT SAYS WHAT IT CANNOT SEE (§297).

Islam, as the office: *"After sending the reply message as an sMO the message
didn't appear in the box and when it appeard it appeard above the message of ht
employee which is wrong"*, then *"and the message never reached the user."*

WHY THIS CANNOT BE PART OF `qa.py`. The chat does not exist over `file://` at
all — `CHAT.mount()` refuses without a server (§94.11) — so the corner this
file is about cannot be opened there, and a build that had lost the whole
feature would go green every time. Served over HTTP with a stub, like
`checks/office-chat.py`.

AND IT ASSERTS BOTH ENDS EVERY TIME (§94.2). A build that removed the composer
from the panel ENTIRELY satisfies every "it is not drawn on the list"
assertion perfectly — so each absence is measured beside the presence that must
survive it: the office's own thread, a conversation opened from the list, and
somebody who is not the office at all.

AND IT MEASURES THE PAINT, NEVER THE ATTRIBUTE (§96, §94.8). `.chatfoot` is
`display:flex`, which outranks the browser's own `[hidden]{display:none}` — so
`foot.hidden === true` is true of a build where the composer is still on screen,
and that is exactly the fault this could have shipped with.

Run: SMP_CHROME=/opt/pw-browsers/chromium python3 qa-run.py checks/corner-reply-box.py
     SMP_BUILT=/path/to/other.html  points it at another build.
"""
import base64, json, os, pathlib, threading, http.server, socketserver, sys
from playwright.sync_api import sync_playwright

ROOT = pathlib.Path(__file__).resolve().parents[3]
BUILT = os.environ.get("SMP_BUILT") or str(
    ROOT / "SMP-Project-Folder/src/strategy-management-platform.html")
HTML = pathlib.Path(BUILT).read_bytes()
SW = (ROOT / "sw.js").read_bytes()
SEED = json.loads((ROOT / "db/seed-state.json").read_text())
PERSON = {"key": "smo", "name": "Mohamed Essam", "role": "super"}
VAPID = base64.urlsafe_b64encode(b"\x04" + bytes(range(64))).decode().rstrip("=")
GATE = b"<!doctype html><title>Sign in</title><h1 id='gate'>Sign in</h1>"

CFG = {"on": True, "shots": True, "promise": "Usually answers the same day",
       "beat": 4000, "assistant": True, "popup": True, "notify": False, "away": 10}
QUEUE = [{"person_key": "hend", "person_name": "Hend Farouk", "live_name": "Hend Farouk",
          "waiting": True, "last_at": "2026-09-05T13:37:00Z", "here_at": None,
          "unit_key": "mobile", "fn_key": None, "title": "Head of Mobile", "gone": False,
          "unread": 1, "last_body": "The YTD number looks wrong on Mobile.",
          "last_from_office": False, "last_by": "Hend Farouk", "flagged": 0}]
HERMSGS = [{"id": 1, "body": "The YTD number looks wrong on Mobile.",
            "at": "2026-09-05T13:37:00Z", "from_office": False,
            "by_name": "Hend Farouk", "bot": False, "shot": None}]
MINE = [{"id": 9, "body": "A note to the office.", "at": "2026-09-05T08:00:00Z",
         "from_office": False, "by_name": "Mohamed Essam", "bot": False, "shot": None}]

# THE ASSISTANT'S TEST IS CLEAN ON PURPOSE. The line under test must NOT
# appear there — `testHtml` is shared, so a build that put the sentence inside
# the shared builder passes every assertion about the notification test and
# says the same thing on a chain an operating system has nothing to do with.
ATEST = [{"name": "The switch", "state": "ok", "detail": "The assistant answers first"},
         {"name": "The knowledge base", "state": "ok", "detail": "43 how-tos"},
         {"name": "The API key", "state": "ok", "word": "PRESENT", "detail": "AIza… (39)"}]
PUSH_OK = [{"name": "The chat", "state": "ok", "word": "ON", "detail": "Messages are on."},
           {"name": "Notifications", "state": "ok", "detail": "On for the company."},
           {"name": "The sending library", "state": "ok", "word": "LOADED", "detail": ""},
           {"name": "The signing key", "state": "ok", "word": "PRESENT", "detail": ""},
           {"name": "This browser", "state": "ok", "detail": "Allowed and registered."},
           {"name": "Your devices", "state": "ok", "detail": "1 registered."},
           {"name": "The send", "state": "ok", "detail": "1 of 1 device took it."}]
PUSH_BAD = PUSH_OK[:4] + [
    {"name": "This browser", "state": "fail", "detail": "It has not been asked yet."}]

STATE = {"office": True, "push": PUSH_OK}
SEEN = []
bad = [0]


def ck(w, ok, x=""):
    if not ok:
        bad[0] += 1
    print(("  ok      " if ok else "  FAIL    ") + w + (("  — " + str(x)) if not ok and x else ""))


class H(http.server.BaseHTTPRequestHandler):
    def log_message(self, *a): pass

    def _s(self, c, b, t):
        self.send_response(c); self.send_header("Content-Type", t)
        self.send_header("Content-Length", str(len(b))); self.end_headers(); self.wfile.write(b)

    def do_GET(self):
        if self.path.startswith("/api/state"):
            self._s(200, json.dumps({"ok": True, "state": SEED, "person": PERSON}).encode(),
                    "application/json"); return
        # §231.5: served as the gate serves it, or `register()` rejects on the
        # content type and reads as the product throwing (§100.3).
        if self.path.startswith("/sw.js"):
            self._s(200, SW, "application/javascript"); return
        if self.path.startswith("/raya-trade"):
            self._s(200, HTML, "text/html; charset=utf-8"); return
        self._s(200, GATE, "text/html; charset=utf-8")

    def do_POST(self):
        n = int(self.headers.get("Content-Length") or 0)
        body = json.loads(self.rfile.read(n) or b"{}")
        if not self.path.startswith("/api/chat"):
            self._s(200, b'{"ok":true}', "application/json"); return
        a = body.get("action")
        if a in ("say", "reply"):
            # THE RECIPIENT RIDES IN `person`, and the first draft of this file
            # asked for `to` — so it reported a correct build broken on the one
            # assertion the whole section exists for. Read the endpoint's own
            # field, never the one the sentence would use.
            SEEN.append({"action": a, "person": body.get("person"),
                         "body": body.get("body")})
        out = {"ok": True, "chat": CFG, "vapid": VAPID, "unread": 0,
               "messages": MINE, "thread": None, "office": STATE["office"]}
        if STATE["office"]:
            out["queue"] = QUEUE
            out["threads"] = QUEUE
            out["waiting"] = 1; out["flagged"] = 0; out["hereMinutes"] = 5
            out["mail"] = False
        if a == "thread":
            out["messages"] = HERMSGS
            out["thread"] = {"person_key": "hend", "person_name": "Hend Farouk",
                             "waiting": True, "here_at": None, "flagged": 0}
        if a == "assistantTest":
            out["steps"] = ATEST
        if a == "pushTest":
            out["steps"] = STATE["push"]
        self._s(200, json.dumps(out).encode(), "application/json")


class S(socketserver.ThreadingTCPServer):
    allow_reuse_address = True; daemon_threads = True


srv = S(("127.0.0.1", 0), H)
URL = "http://127.0.0.1:%d/raya-trade" % srv.server_address[1]
threading.Thread(target=srv.serve_forever, daemon=True).start()

# ── WHAT IS ON SCREEN, NEVER WHAT IS IN THE MARKUP ──────────────────────
# `checkVisibility()` answers the paint; the hit test answers whether a person
# could reach it. Both, because a `display:flex` foot with `hidden` set paints
# and hit-tests perfectly while the attribute reads exactly as intended.
LOOK = """()=>{
  const g=id=>document.getElementById(id);
  const say=g('chatsay'), send=g('chatsend'), pic=g('chatpic'), foot=g('chatfoot');
  const body=g('chatbody'), panel=g('chatpanel');
  const hit=el=>{ if(!el) return null; const r=el.getBoundingClientRect();
    if(!r.width||!r.height) return 'no box';
    const t=document.elementFromPoint(r.left+r.width/2, r.top+r.height/2);
    return t ? (t===el || el.contains(t) ? 'itself' : t.tagName+'.'+(t.className||'')) : 'nothing'; };
  const out=g('chatbody') ? [...document.querySelectorAll('[data-cqinbox]')][0] : null;
  return {
    bodyClass: body?body.className:null,
    footPainted: foot?foot.checkVisibility():false,
    sayPainted: say?say.checkVisibility():false,
    sendPainted: send?send.checkVisibility():false,
    picPainted: pic?pic.checkVisibility():false,
    sayReach: hit(say), sendReach: hit(send),
    placeholder: say?say.placeholder:null,
    panelH: panel?Math.round(panel.getBoundingClientRect().height):null,
    bodyH: body?Math.round(body.getBoundingClientRect().height):null,
    rows: document.querySelectorAll('#chatbody [data-cqopen]').length,
    wayOutPainted: out?out.checkVisibility():false,
    wayOutReach: hit(out)
  };
}"""

OSLINE = """()=>{
  const p=[...document.querySelectorAll('.chtest-os')];
  const inPush=[...document.querySelectorAll('[data-chpoptest]')]
    .map(b=>b.closest('.chset-test')).filter(Boolean)
    .some(w=>w.querySelector('.chtest-os'));
  const inAsst=[...document.querySelectorAll('[data-chtest]')]
    .map(b=>b.closest('.chset-test')).filter(Boolean)
    .some(w=>w.querySelector('.chtest-os'));
  const one=p[0];
  return { count:p.length, inPush:inPush, inAsst:inAsst,
           text: one?one.textContent.replace(/\\s+/g,' ').trim():null,
           painted: one?one.checkVisibility():false,
           ink: one?getComputedStyle(one).color:null,
           border: one?getComputedStyle(one).borderLeftWidth:null };
}"""


def land(pg, theme="light"):
    pg.add_init_script("try{sessionStorage.setItem('smp.tour.later','1');"
                       "sessionStorage.setItem('smp.welcome.done','1');}catch(e){}")
    pg.goto(URL, wait_until="networkidle"); pg.wait_for_timeout(2600)
    if theme == "dark":
        pg.evaluate("()=>{try{THEME.set('dark')}catch(e){"
                    "document.documentElement.setAttribute('data-theme','dark')}}")
        pg.wait_for_timeout(350)


def corner(pg):
    pg.evaluate("()=>{const b=document.getElementById('chatbtn'); if(b) b.click();}")
    pg.wait_for_timeout(1300)


def look(pg):
    # EVERY PROBE DEGRADES rather than throwing (§215): a file that dies
    # reports fewer failures than it found, on exactly the build it exists for.
    try:
        return pg.evaluate(LOOK)
    except Exception as e:
        return {"threw": str(e)}


with sync_playwright() as pw:
    b = pw.chromium.launch(executable_path=os.environ.get("SMP_CHROME") or None,
                           args=["--no-sandbox", "--disable-dev-shm-usage"])

    # ── 1 · THE OFFICE, STANDING ON THE WAITING LIST ────────────────────
    print("\n§1  the office, on the Waiting list")
    pg = b.new_page(viewport={"width": 1400, "height": 900})
    land(pg); corner(pg)
    m = look(pg)
    ck("the list is what is drawn", m.get("bodyClass") == "chatbody cqbody", m.get("bodyClass"))
    ck("people are on it", (m.get("rows") or 0) >= 1, m.get("rows"))
    ck("no composer is painted", m.get("sayPainted") is False, m)
    ck("no Send is painted", m.get("sendPainted") is False, m)
    ck("no attach button is painted", m.get("picPainted") is False, m)
    ck("the foot is not painted", m.get("footPainted") is False, m)
    ck("nothing of the composer can be reached",
       m.get("sayReach") in (None, "no box") and m.get("sendReach") in (None, "no box"),
       (m.get("sayReach"), m.get("sendReach")))
    # THE ONE PERMANENT WAY OUT MUST SURVIVE IT (§61, §290.1) — the foot the
    # composer sits in is not the foot the Inbox link sits in, and a fix that
    # took both would strand somebody on the list.
    ck("Open the Platform Inbox is still there and reachable",
       m.get("wayOutPainted") is True and m.get("wayOutReach") == "itself",
       (m.get("wayOutPainted"), m.get("wayOutReach")))
    listH = m.get("bodyH"); panelH = m.get("panelH")

    # AND THE REPORTED SEND CANNOT HAPPEN. Nothing is posted while the list is
    # showing — asserted as the server's own record, not as an absent element.
    SEEN.clear()
    pg.wait_for_timeout(600)
    ck("nothing is posted from the list", SEEN == [], SEEN)

    # ── 2 · THE OTHER END: HER CONVERSATION, OPENED FROM THAT LIST ───────
    print("\n§2  the same box, with her conversation open")
    SEEN.clear()
    pg.evaluate("()=>{const r=document.querySelector('#chatbody [data-cqopen]'); if(r) r.click();}")
    pg.wait_for_timeout(1400)
    m2 = look(pg)
    ck("the composer comes back", m2.get("sayPainted") is True, m2)
    ck("and it is reachable", m2.get("sayReach") == "itself", m2.get("sayReach"))
    ck("it says whose conversation this is",
       (m2.get("placeholder") or "").startswith("Reply to"), m2.get("placeholder"))
    try:
        pg.fill("#chatsay", "Thanks Hend — looking at it now.")
        pg.click("#chatsend"); pg.wait_for_timeout(1400)
    except Exception as e:
        ck("the reply could be sent", False, e)
    ck("and it is sent as a REPLY, to her",
       len(SEEN) == 1 and SEEN[0]["action"] == "reply" and SEEN[0]["person"] == "hend", SEEN)
    # ONE PANEL, WHATEVER IS IN IT (§285.2). The panel is anchored at the
    # bottom, so a height that moved between the two halves would move its top
    # edge under the pointer — the fault that section closed.
    ck("the panel did not change height",
       m2.get("panelH") == panelH, (panelH, m2.get("panelH")))
    ck("the list had the room the composer was taking",
       listH is not None and m2.get("bodyH") is not None and listH > m2.get("bodyH"),
       (listH, m2.get("bodyH")))

    # ── 3 · AND THE OFFICE'S OWN THREAD IS UNTOUCHED ────────────────────
    print("\n§3  the office's own thread — My messages")
    SEEN.clear()
    pg.evaluate("""()=>{const b=[...document.querySelectorAll('[data-cqside]')]
        .filter(x=>/my/i.test(x.textContent))[0]; if(b) b.click();}""")
    pg.wait_for_timeout(1300)
    m3 = look(pg)
    ck("the composer is drawn", m3.get("sayPainted") is True, m3)
    ck("it writes to the office", m3.get("placeholder") == "Write to the office…",
       m3.get("placeholder"))
    try:
        pg.fill("#chatsay", "A note to myself.")
        pg.click("#chatsend"); pg.wait_for_timeout(1400)
    except Exception as e:
        ck("it could be sent", False, e)
    ck("and it is sent as `say`",
       len(SEEN) == 1 and SEEN[0]["action"] == "say", SEEN)
    pg.close()

    # ── 4 · SOMEBODY WHO IS NOT THE OFFICE ──────────────────────────────
    print("\n§4  everybody else's corner")
    STATE["office"] = False
    pg = b.new_page(viewport={"width": 1400, "height": 900})
    land(pg); corner(pg)
    m4 = look(pg)
    ck("their composer is drawn", m4.get("sayPainted") is True, m4)
    ck("and reachable", m4.get("sayReach") == "itself", m4.get("sayReach"))
    ck("their panel has no queue", m4.get("bodyClass") == "chatbody", m4.get("bodyClass"))
    pg.close()
    STATE["office"] = True

    # ── 5 · THE NOTIFICATION TEST SAYS WHAT IT CANNOT SEE ───────────────
    for theme in ("light", "dark"):
        print("\n§5  the notification test, all green (%s)" % theme)
        STATE["push"] = PUSH_OK
        pg = b.new_page(viewport={"width": 1400, "height": 1000})
        land(pg, theme)
        pg.click('[data-md="setup"]'); pg.wait_for_timeout(900)
        pg.click('[data-setupgo="chat"]'); pg.wait_for_selector("#chinbox", timeout=8000)
        pg.wait_for_timeout(900)
        pg.evaluate("()=>{const b=document.querySelector('[data-chsetmenu]');"
                    "if(b && b.getAttribute('aria-expanded')!=='true') b.click();}")
        pg.wait_for_timeout(450)
        # THE SWITCH HAS TO BE ON FOR THE CONTROL TO EXIST (§61), and the stub
        # cannot decide it — the panel reads the value the browser holds.
        pg.evaluate("""()=>{const s=[...document.querySelectorAll('[data-chset="popup"]')];
            const on=s[s.length-1]; if(on && on.className.indexOf('on')<0) on.click();}""")
        pg.wait_for_timeout(800)
        pg.evaluate("()=>{const b=document.querySelector('[data-chtest]'); if(b) b.click();}")
        pg.wait_for_timeout(900)
        pg.evaluate("()=>{const b=document.querySelector('[data-chpoptest]'); if(b) b.click();}")
        pg.wait_for_timeout(1600)
        try:
            o = pg.evaluate(OSLINE)
        except Exception as e:
            o = {"threw": str(e)}
        ck("the line is drawn once", o.get("count") == 1, o)
        ck("and it is painted", o.get("painted") is True, o)
        ck("it names the computer's own settings",
           "System Settings" in (o.get("text") or "")
           and "Notifications" in (o.get("text") or ""), o.get("text"))
        ck("it is under the NOTIFICATION test", o.get("inPush") is True, o)
        # THE SHARED-BUILDER TRAP. `testHtml` draws the assistant's result too,
        # and its steps here are clean — a build that put the sentence inside
        # that builder passes every assertion above and says it twice.
        ck("and never under the assistant's", o.get("inAsst") is False, o)
        ck("quiet, not an alarm — no border colour of its own",
           (o.get("border") or "0px") != "0px", o.get("border"))
        pg.close()

    print("\n§5b the notification test, one step failing")
    STATE["push"] = PUSH_BAD
    pg = b.new_page(viewport={"width": 1400, "height": 1000})
    land(pg)
    pg.click('[data-md="setup"]'); pg.wait_for_timeout(900)
    pg.click('[data-setupgo="chat"]'); pg.wait_for_selector("#chinbox", timeout=8000)
    pg.wait_for_timeout(900)
    pg.evaluate("()=>{const b=document.querySelector('[data-chsetmenu]');"
                "if(b && b.getAttribute('aria-expanded')!=='true') b.click();}")
    pg.wait_for_timeout(450)
    pg.evaluate("""()=>{const s=[...document.querySelectorAll('[data-chset="popup"]')];
        const on=s[s.length-1]; if(on && on.className.indexOf('on')<0) on.click();}""")
    pg.wait_for_timeout(800)
    pg.evaluate("()=>{const b=document.querySelector('[data-chpoptest]'); if(b) b.click();}")
    pg.wait_for_timeout(1600)
    try:
        o2 = pg.evaluate(OSLINE)
    except Exception as e:
        o2 = {"threw": str(e)}
    # A FAILING STEP ALREADY NAMES THE ADDRESS (§123), so a second sentence
    # beside it competes with the row that says where it actually stopped.
    ck("no line over a failing result", o2.get("count") == 0, o2)
    ck("and the failure is still reported",
       pg.evaluate("()=>!!document.querySelector('.chtest.bad')"), "no failing verdict drawn")
    pg.close()
    b.close()

srv.shutdown()
print("\n%d failure(s)" % bad[0])
sys.exit(1 if bad[0] else 0)
