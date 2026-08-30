"""THE OFFICE INBOX: THE CARET, THE BOX, THE PILL AND THE TAG (§188).

Four things Islam hit using the inbox, and three of them are the same
omission: §97 built the CORNER panel carefully against exactly these faults,
and the office's inbox — the surface the office actually lives in — got a
thinner version that skipped them.

  · THE CARET. The inbox polls every ten seconds and redraws the thread pane;
    the reply box is inside it. The typed VALUE was carried across
    deliberately, which is why this reads as the cursor jumping rather than
    work being lost — and the element was replaced regardless, so focus and
    the cursor went with it. Now only the messages redraw while the composer
    has the cursor.

  · THE BOX THAT COULD NOT GROW. The corner's composer has grown to fit since
    §97; this one was the same control with the handler missing, so it stayed
    one row and everything past the first line scrolled out of sight.

  · THE PILL THAT WOULD NOT MOVE. Both numbers on that screen were right and
    of different ages: the inbox re-asks every beat, the rail's pill is
    fetched once per visit (§108.10) and was never told the summary had
    stopped being true. Replying is the act that makes it wrong.

  · THE TAG. The platform has chased people by email since §97.5 and RECORDED
    NOTHING: the outcome went to the browser, was shown once under the
    composer, and was forgotten. A reply that left now says so, with the
    address on the hover, and NULL means it did not leave — which is what
    every message before §188 honestly is.

SERVED OVER HTTP WITH A STUB, because none of this exists over file:// —
there is no queue, no thread and no poll (§94.11).

TWO OF THIS FILE'S OWN FIRST RUNS WERE THE CHECK, both worth keeping:
Playwright types "\n" as ENTER and Enter SENDS, so the box was emptied and
every caret assertion compared "" with "" and passed (§94.5 — hence the
assertion that there is something written in it); and 129 characters in a
964px composer fits on ONE line, so the grow test called a working build
broken (§128).

PROVE IT CAN FAIL: run against main's build, where there is no tag, no
grower, and the pill and the caret both hold their old behaviour.

Run:  SMP_CHROME=/opt/pw-browsers/chromium python3 qa-run.py checks/office-inbox.py
"""
import os
import json, pathlib, threading, http.server, socketserver, sys
from playwright.sync_api import sync_playwright
ROOT = pathlib.Path(__file__).resolve().parents[3]
HTML = pathlib.Path(os.environ.get("SMP_INBOX_HTML") or
                    (ROOT/"SMP-Project-Folder/src/strategy-management-platform.html")).read_bytes()
BASE = json.loads((ROOT/"db/seed-state.json").read_text())
SMO = {"key":"smo","name":"Mohamed Essam","role":"super"}
WAITING = [1]
MSGS = [
  {"id":1,"at":"2026-08-30T10:00:00Z","from_office":False,"by_key":"mobhead",
   "by_name":"Ashraf Laithy","body":"A question about the plan.","flag":None,
   "bot":False,"source":None,"handoff":None,"emailed_to":None,"has_shot":False},
  {"id":2,"at":"2026-08-30T10:05:00Z","from_office":True,"by_key":"smo",
   "by_name":"Mohamed Essam","body":"Looking now.","flag":None,"bot":False,
   "source":None,"handoff":None,"emailed_to":"ashraf@rayacorp.com","has_shot":False},
]
bad = 0
def ck(w, ok, x=""):
    global bad
    if not ok: bad += 1
    print(("  ok      " if ok else "  FAIL    ") + w + (("  — " + str(x)) if not ok and x else ""))

class H(http.server.BaseHTTPRequestHandler):
    def log_message(self,*a): pass
    def _s(self,b,c=200,t="application/json"):
        self.send_response(c); self.send_header("Content-Type",t)
        self.send_header("Content-Length",str(len(b))); self.end_headers(); self.wfile.write(b)
    def do_GET(self):
        if self.path.startswith("/api/state"):
            self._s(json.dumps({"ok":True,"state":BASE,"person":SMO}).encode()); return
        if self.path.startswith("/api/auth"):
            self._s(json.dumps({"ok":True,"person":SMO}).encode()); return
        if self.path.startswith("/raya-trade"): self._s(HTML,200,"text/html; charset=utf-8"); return
        self._s(b"<!doctype html><title>gate</title>",200,"text/html; charset=utf-8")
    def do_POST(self):
        n=int(self.headers.get("Content-Length") or 0)
        body=json.loads(self.rfile.read(n) or b"{}")
        a=body.get("action")
        if a=="queue":
            self._s(json.dumps({"ok":True,"waiting":WAITING[0],"flagged":0,"threads":[
              {"person_key":"mobhead","person_name":"Ashraf Laithy","live_name":"Ashraf Laithy",
               "waiting":True,"unread":0,"last_at":"2026-08-30T10:05:00Z",
               "last_body":"Looking now.","last_from_office":True,"last_by":"Mohamed Essam"}]}).encode()); return
        if a=="thread":
            self._s(json.dumps({"ok":True,"person":"mobhead","name":"Ashraf Laithy",
              "waiting":True,"address":"ashraf@rayacorp.com","messages":MSGS,
              "here_at":None,"mail":True,"chatOn":True}).encode()); return
        self._s(json.dumps({"ok":True,"chat":{"on":True},"states":{},"said":{},
                            "unread":0,"threads":[]}).encode())
class S(socketserver.ThreadingTCPServer): allow_reuse_address=True
srv=S(("127.0.0.1",0),H); threading.Thread(target=srv.serve_forever,daemon=True).start()
URL="http://127.0.0.1:%d/raya-trade"%srv.server_address[1]

with sync_playwright() as p:
    b=p.chromium.launch(executable_path="/opt/pw-browsers/chromium",
                        args=["--no-sandbox","--disable-dev-shm-usage"])
    pg=b.new_page(viewport={"width":1600,"height":1000})
    errs=[]; pg.on("pageerror", lambda e: errs.append(str(e)))
    pg.add_init_script("try{sessionStorage.setItem('smp.welcome.done','1');"
                       "sessionStorage.setItem('smp.tour.later','1')}catch(e){}")
    pg.goto(URL); pg.wait_for_timeout(2600)
    pg.evaluate("()=>document.querySelector('[data-md=\"setup\"]').click()"); pg.wait_for_timeout(400)
    pg.evaluate("()=>document.querySelector('[data-setupgo=\"chat\"]').click()"); pg.wait_for_timeout(1200)
    pg.evaluate("()=>{const b=document.querySelector('[data-chpick]'); if(b) b.click();}")
    pg.wait_for_timeout(1200)

    print("\n1 · the email tag")
    tag = pg.evaluate("""()=>{const e=document.querySelector('#chtbody .chmail');
      return e ? { text:e.textContent.trim(), title:e.title,
                   onOffice: !!e.closest('.chme'),
                   count: document.querySelectorAll('#chtbody .chmail').length } : null;}""")
    ck("the reply that left is tagged", tag is not None, tag)
    if tag:
        ck("...it says where it went", "ashraf@rayacorp.com" in tag["title"], tag)
        ck("...only the one that left", tag["count"] == 1, tag)

    print("\n2 · the reply box grows with what is typed")
    ta = pg.query_selector("#chtbody ~ * [data-chreply], [data-chreply]")
    ck("there is a reply box", ta is not None)
    if ta:
        h0 = pg.evaluate("()=>document.querySelector('[data-chreply]').getBoundingClientRect().height")
        # NO NEWLINES. Playwright types "\n" as Enter, and Enter SENDS —
        # so the first run emptied the box and every assertion below compared
        # "" with "" and passed. A long single line grows it by wrapping,
        # which is the thing under test anyway (§94.5).
        ta.click()
        # LONG ENOUGH FOR THE BOX IT IS ACTUALLY IN. The first attempt used
        # 129 characters and the inbox composer is 964px wide, so it fitted on
        # ONE line and the check reported the product broken (§128: a
        # measurement wrong in the direction of "broken" costs as much as one
        # wrong the other way).
        ta.type("a reply long enough to wrap onto several lines inside a box that "
                "is only one row tall to begin with, which is the whole complaint, "
                "and long enough again that it cannot possibly fit across a single "
                "line of a composer that is most of the width of the page, because "
                "that is what the first version of this check got wrong")
        pg.wait_for_timeout(300)
        h1 = pg.evaluate("()=>document.querySelector('[data-chreply]').getBoundingClientRect().height")
        ck("...and it grew", h1 > h0 + 8, "%s -> %s" % (round(h0), round(h1)))


        print("\n3 · the caret survives the poll")
        pg.evaluate("""()=>{const t=document.querySelector('[data-chreply]');
          t.focus(); t.setSelectionRange(3,3);}""")
        before = pg.evaluate("""()=>{const t=document.querySelector('[data-chreply]');
          return { focused: document.activeElement===t, at:t.selectionStart, v:t.value };}""")
        ck("the cursor is in the box", before["focused"], before)
        # AND THERE IS SOMETHING IN IT. Without this the two comparisons below
        # are "" against "" and cannot fail — which is exactly what the first
        # run of this file did.
        ck("...and there is something written in it", len(before["v"]) > 20, before["v"])
        # the inbox beat is 10s — wait past one
        pg.wait_for_timeout(11500)
        after = pg.evaluate("""()=>{const t=document.querySelector('[data-chreply]');
          return { focused: document.activeElement===t, at:t.selectionStart, v:t.value };}""")
        ck("...and it is still there after a poll", after["focused"], after)
        ck("...at the same place", after["at"] == before["at"], [before["at"], after["at"]])
        ck("...with the same words", after["v"] == before["v"], after["v"])

    print("\n4 · the rail's count follows the inbox")
    WAITING[0] = 0
    pg.wait_for_timeout(11500)
    pill = pg.evaluate("""()=>{const b=document.querySelector('.ritem[data-setupgo="chat"]');
      const p=b?b.querySelector('.riwait'):null;
      return { pill: p ? p.textContent.trim() : null, ov: JSON.stringify(window.OVQUEUE) };}""")
    ck("the pill goes when nothing is waiting", pill["pill"] is None, pill)
    ck("...and the shell's own count agrees", '"waiting":0' in (pill["ov"] or ""), pill)

    ck("nothing threw", not errs, errs[:1])
    b.close()
srv.shutdown()
print(("\n%d FAILED" % bad) if bad else "\nall good")
sys.exit(1 if bad else 0)
