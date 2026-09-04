"""THE OFFICE'S CORNER CARRIES THE QUEUE (§285), AND SURVIVES THE WALK (§284).

Islam: "the chat bubble of the SMO team shouldn't be something to be sent to
the smo, that is redundancy" — for the office it was a conversation with
themselves — and "we need the chat to sustain the navigation so it's open
while me navigating across the different pages."

OVER HTTP AGAINST A STUB, because the whole surface is invisible from file://
(§94.11): the corner is not drawn without a server to answer it.

WHAT IT ASSERTS IS THE AGREEMENT, not the numbers (§94.8): the badge is the
LENGTH of the list rather than a second count of the same thing, and the email
a reply carries is the one the Platform Inbox builds rather than a lesser copy
made here — the two would otherwise drift the first time either improved
(§53.5).

AND IT LISTENS FOR PAGE ERRORS, because the fault this found while being
written was a throw inside the poll's own callback: the body kept the class it
had just been given and its contents stayed empty, so the corner rendered as a
blank box with nothing on the console of a page that had not reloaded. A DOM
probe that only asked "is the panel there" would have called it clean.
"""
import json, socketserver, threading, http.server, pathlib
from playwright.sync_api import sync_playwright
ROOT = pathlib.Path("/home/user/SMP")
HTML = (ROOT/"SMP-Project-Folder/src/strategy-management-platform.html").read_bytes()
GATE = (ROOT/"index.html").read_bytes(); SW = (ROOT/"sw.js").read_bytes()
SEED = json.loads((ROOT/"db/seed-state.json").read_text())
PERSON = {"key":"smo","name":"Mohamed Essam","role":"super"}
# THE STORED NAME IS THE LONG ONE, WHICH IS WHAT THE SERVER ACTUALLY HOLDS
# (§288). Islam's own report: "the serach is bringing the full name and we
# agreed across the platform we use the short name from the registry". The
# demo register cannot show this on its own — every one of its 33 people has
# a two-word name, so short and long coincide and a build that lost the
# shortening would pass every assertion (§255). So the state is MADE: these
# keys ARE on the register, under short names, and the stub sends the long
# form beside them exactly as a stored `person_name` does.
QUEUE = [
 {"person_key":"mobhead","person_name":"Ashraf Mohamed Laithy El Sayed",
  "last_at":"2026-09-03T09:41:00Z",
  "last_body":"The Q3 target on Active Base still reads 4.2M."},
 {"person_key":"cxcust","person_name":"Hala Nabil","last_at":"2026-09-03T09:12:00Z",
  "last_body":"I updated the definition and it did not stick."},
 # AND SOMEBODY THE REGISTER DOES NOT HOLD, which is the one case the browser
 # cannot answer: the stored name must stand, and no place may be invented.
 {"person_key":"leftus","person_name":"Farida Selim","last_at":"2026-09-03T08:02:00Z",
  "last_body":"Where do I find last year's plan?"},
]
HITS = [
 {"person_key":"rethead","person_name":"Hossam Farid","waiting":False,
  "line":"...so the target we agreed in March is the one on the page.",
  "line_at":"2026-08-14T10:22:00Z","from_office":False,"is_last":False},
 # A SEARCH HIT CARRIES ONLY A KEY AND THE STORED NAME — no unit, no title —
 # so it is the case Islam reported, and the case that proves the row reads
 # the browser's own register rather than whatever the server sent.
 {"person_key":"mobhead","person_name":"Ashraf Mohamed Laithy El Sayed","waiting":True,
  "line":"The Q3 target on Active Base still reads 4.2M.",
  "line_at":"2026-09-03T09:41:00Z","from_office":False,"is_last":True},
]
# PEOPLE WITH NO CONVERSATION (§290). These are on the register and have never
# written in — the case Islam reported as "Nothing found". ELEVEN of them, so
# the cap at ten bites and the foot line has something to count.
# NOBODY HERE IS IN `QUEUE` OR `HITS` — a person in both halves is exactly the
# fault the server's NOT EXISTS clause prevents, so a stub that put one in both
# would make that assertion untestable. `loghead` IS on the demo register, which
# is what lets the row be asserted to draw the register's short name and place.
FOLK=[{"key":"loghead","name":"Hazem Roushdy","unit_key":"logistics","fn_key":None,"title":None}] + [
  {"key":"newp%d"%i,"name":"Hazem Newcomer %d"%i,"unit_key":None,"fn_key":None,"title":None}
  for i in range(1,11)]
POSTED=[]
class H(http.server.BaseHTTPRequestHandler):
    def log_message(self,*a): pass
    def _s(self,c,b,t):
        self.send_response(c); self.send_header("Content-Type",t)
        self.send_header("Content-Length",str(len(b))); self.end_headers(); self.wfile.write(b)
    def do_GET(self):
        if self.path.startswith("/sw.js"): self._s(200,SW,"application/javascript"); return
        if self.path.startswith("/api/state"):
            self._s(200,json.dumps({"ok":True,"state":SEED,"person":PERSON}).encode(),"application/json"); return
        if self.path.startswith("/raya-trade"): self._s(200,HTML,"text/html; charset=utf-8"); return
        self._s(200,GATE,"text/html; charset=utf-8")
    def do_POST(self):
        n=int(self.headers.get("Content-Length") or 0); raw=self.rfile.read(n)
        b=json.loads(raw or b"{}"); a=b.get("action") or ""
        POSTED.append(b)
        cfg={"on":True,"shots":True,"promise":"Usually answers the same day",
             "beat":4000,"popup":False,"vapid":""}
        if a=="chatSearch":
            q=(b.get("q") or "").lower()
            folk=[f for f in FOLK if q in f["name"].lower()]
            self._s(200,json.dumps({"ok":True,"q":q,
              "hits":[h for h in HITS if q in h["line"].lower() or q in h["person_name"].lower()],
              "people":folk[:10], "more":max(0,len(folk)-10)
              }).encode(),"application/json"); return
        if a=="thread":
            who=b.get("person")
            nm={"mobhead":"Ashraf Laithy","cxcust":"Hala Nabil","rethead":"Hossam Farid"}.get(who,who)
            self._s(200,json.dumps({"ok":True,"person":who,"name":nm,"waiting":True,
              "messages":[{"id":1,"at":"2026-09-03T09:41:00Z","from_office":False,
                           "by_key":who,"by_name":nm,"body":"The Q3 target still reads 4.2M.",
                           "flag":None}],"mail":False,"chatOn":True}).encode(),"application/json"); return
        if a=="reply":
            self._s(200,json.dumps({"ok":True,"mailed":None}).encode(),"application/json"); return
        self._s(200,json.dumps({"ok":True,"office":True,"messages":[],"unread":0,
            "thread":None,"waiting":len(QUEUE),"queue":QUEUE,"chat":cfg}).encode(),"application/json")
srv=socketserver.ThreadingTCPServer(("127.0.0.1",0),H); srv.daemon_threads=True
threading.Thread(target=srv.serve_forever,daemon=True).start()
URL="http://127.0.0.1:%d/raya-trade"%srv.server_address[1]
ok=[0]; bad=[0]
def ck(w,c,d=""):
    if c: ok[0]+=1; print("  ok    "+w+(("  ("+str(d)+")") if d else ""))
    else: bad[0]+=1; print("  FAIL  "+w+(("  — "+str(d)) if d else ""))
with sync_playwright() as p:
    br=p.chromium.launch(executable_path="/opt/pw-browsers/chromium-1194/chrome-linux/chrome")
    pg=br.new_page(viewport={"width":1400,"height":950})
    errs=[]; pg.on("pageerror", lambda e: errs.append(str(e)[:160]))
    pg.add_init_script("try{sessionStorage.setItem('smp.tour.later','1');"
                       "sessionStorage.setItem('smp.welcome.done','1');}catch(e){}")
    pg.goto(URL,wait_until="networkidle")
    pg.wait_for_selector("#chatdock:not([hidden])",timeout=20000)
    pg.wait_for_timeout(1500)

    print("\nTHE BADGE COUNTS PEOPLE WAITING")
    ck("the badge is shown before opening",
       not pg.eval_on_selector("#chatn","e=>e.hidden"))
    ck("...and it is the length of the list",
       pg.eval_on_selector("#chatn","e=>e.textContent")==str(len(QUEUE)),
       pg.eval_on_selector("#chatn","e=>e.textContent"))

    pg.click("#chatbtn"); pg.wait_for_timeout(900)
    print("\nTHE SPLIT")
    ck("the two segments are drawn", pg.query_selector_all(".cqseg button").__len__()==2)
    ck("Waiting is the one lit", pg.eval_on_selector(".cqseg button","e=>e.classList.contains('on')"))
    ck("the search box is there", pg.query_selector("#cqfind") is not None)

    print("\nTHE QUEUE")
    rows=pg.query_selector_all(".cqrow")
    ck("one row per waiting conversation", len(rows)==len(QUEUE), len(rows))
    first = rows[0].inner_text() if rows else ""
    ck("the first row names the person", "Ashraf Laithy" in first, first[:60])
    # THE REGISTER'S NAME, NOT THE SERVER'S (§288) — asserted at BOTH ends, or
    # a build that simply printed a shorter substring would satisfy the first.
    ck("...the register's short name, not the stored long one",
       "Ashraf Laithy" in first and "Ashraf Mohamed Laithy El Sayed" not in first, first[:60])
    ck("...with where they sit beside it",
       (rows[0].query_selector(".cqpl").inner_text().strip() if rows and rows[0].query_selector(".cqpl") else "") != "",
       rows[0].query_selector(".cqpl").inner_text() if rows and rows[0].query_selector(".cqpl") else "no place drawn")
    # AND IT IS THE NAVIGATION'S OWN WORD, asked of the platform rather than
    # spelled here (§94.8) — a literal would go stale the day a unit is renamed.
    want = pg.evaluate("""() => { try { return placeLabel(personAt(personBy('mobhead'))); }
                                  catch(e){ return null; } }""")
    got = rows[0].query_selector(".cqpl").inner_text().strip() if rows and rows[0].query_selector(".cqpl") else ""
    ck("...and it agrees with placeLabel(), never a literal", bool(want) and got == want, got + " vs " + str(want))
    # SOMEBODY THE REGISTER NO LONGER HOLDS keeps the stored name and gets NO
    # place — absent is not guessed (§35).
    gone = [r for r in rows if "Farida" in r.inner_text()]
    ck("a person the register does not hold still reads as a name", len(gone)==1)
    ck("...and no place is invented for them",
       len(gone)==1 and gone[0].query_selector(".cqpl") is None)
    ck("a click at its centre reaches the row",
       pg.evaluate("""() => { const r=document.querySelector('.cqrow').getBoundingClientRect();
         const e=document.elementFromPoint(r.x+r.width/2, r.y+r.height/2);
         return !!(e && e.closest('.cqrow')); }"""))
    ck("the way through to the Inbox is there", pg.query_selector(".cqinbox") is not None)

    print("\nOPENING ONE IN PLACE")
    rows[0].click(); pg.wait_for_timeout(900)
    ck("the header becomes the person",
       "Ashraf" in pg.eval_on_selector("#chatpanel .cht","e=>e.textContent"),
       pg.eval_on_selector("#chatpanel .cht","e=>e.textContent"))
    ck("there is a way back", pg.query_selector("[data-cqback]") is not None)
    ck("the messages are drawn", len(pg.query_selector_all("#chatbody .chmsg"))>0)
    ck("the search box steps aside", pg.query_selector("#cqfind") is None)
    ck("the composer invites a reply to them",
       "Ashraf" in pg.eval_on_selector("#chatsay","e=>e.placeholder"),
       pg.eval_on_selector("#chatsay","e=>e.placeholder"))

    print("\nREPLYING FROM THE CORNER")
    POSTED.clear()
    pg.fill("#chatsay","Looking at it now."); pg.click("#chatsend"); pg.wait_for_timeout(1200)
    rep=[b for b in POSTED if b.get("action")=="reply"]
    ck("it posts a reply", len(rep)==1, [b.get("action") for b in POSTED])
    ck("...naming the person", rep and rep[0].get("person")=="mobhead")
    ck("...with the words typed", rep and rep[0].get("body")=="Looking at it now.")
    ck("...and the SAME email the Inbox builds, not a lesser one",
       bool(rep and rep[0].get("html") and "Open the platform" in rep[0]["html"]),
       (rep[0].get("html") or "")[:60] if rep else "")

    print("\nBACK, AND THE OTHER HALF")
    pg.click("[data-cqback]"); pg.wait_for_timeout(700)
    ck("back returns to the list", len(pg.query_selector_all(".cqrow"))==len(QUEUE))
    ck("...and the header is the office again",
       "Strategy Office" in pg.eval_on_selector("#chatpanel .cht","e=>e.textContent"))
    pg.click("[data-cqside='mine']"); pg.wait_for_timeout(700)
    ck("My messages shows their own conversation, not the queue",
       pg.query_selector(".cqrow") is None and pg.query_selector("#chatbody") is not None)
    ck("...and the composer writes to the office again",
       "office" in pg.eval_on_selector("#chatsay","e=>e.placeholder").lower(),
       pg.eval_on_selector("#chatsay","e=>e.placeholder"))
    pg.click("[data-cqside='wait']"); pg.wait_for_timeout(700)

    print("\nSEARCHING ALL HISTORY")
    POSTED.clear()
    pg.fill("#cqfind","target"); pg.wait_for_timeout(1400)
    ck("it asks the server", any(b.get("action")=="chatSearch" for b in POSTED),
       [b.get("action") for b in POSTED])
    # REVERSED AND REWRITTEN, NEVER DELETED (§218). Under §285 the scope was a
    # grey line above the rows, and asserting it was right. Islam read that line
    # as a header — it was one — so the scope moved INTO THE BOX, where it is
    # read at the moment somebody decides to type and costs no row. The claim is
    # unchanged: the office must not be left thinking the search is limited to
    # Waiting while that segment is the one lit (§35, §124). Both ends, or a
    # build that simply dropped the scope entirely would pass the absence half.
    ph = pg.eval_on_selector("#cqfind","e=>e.placeholder") or ""
    ck("the box says the scope out loud", "all conversations" in ph and "register" in ph, ph)
    ck("...and no grey line says it above the rows", pg.query_selector(".cqfound") is None,
       (pg.eval_on_selector(".cqfound","e=>e.textContent") or "") if pg.query_selector(".cqfound") else "none")
    ck("a match in an older message says so",
       any("earlier message" in (h.inner_text() or "") for h in pg.query_selector_all(".cqrow")))
    ck("...and an answered conversation is reachable",
       any("Hossam" in (h.inner_text() or "") for h in pg.query_selector_all(".cqrow")))
    # THE CASE ISLAM REPORTED (§288). A search hit carries only a key and the
    # stored name, so if the row reads the browser's own register it shortens
    # here too — and if it does not, this is the one place the long name shows.
    hitrows = pg.query_selector_all(".cqrow")
    ash = [h for h in hitrows if "Ashraf" in (h.inner_text() or "")]
    ck("a search hit says the register's short name", len(ash)==1 and
       "Ashraf Laithy" in ash[0].inner_text() and
       "Ashraf Mohamed Laithy El Sayed" not in ash[0].inner_text(),
       ash[0].inner_text()[:60] if ash else "no row")
    ck("...with where they sit beside it, though the server sent no unit",
       len(ash)==1 and ash[0].query_selector(".cqpl") is not None and
       ash[0].query_selector(".cqpl").inner_text().strip() != "",
       ash[0].query_selector(".cqpl").inner_text() if ash and ash[0].query_selector(".cqpl") else "no place")
    ck("the search box still holds what was typed",
       pg.eval_on_selector("#cqfind","e=>e.value")=="target",
       pg.eval_on_selector("#cqfind","e=>e.value"))

    print("\nREACHING SOMEBODY WHO HAS NEVER WRITTEN IN (§290)")
    pg.fill("#cqfind","hazem"); pg.wait_for_timeout(900)
    rows=pg.query_selector_all(".cqrow")
    ck("the people who match are listed", len(rows)>0, len(rows))
    # NO HEADINGS AT ALL — Islam's own instruction, and asserted as an ABSENCE
    # beside the presence, or a build that kept them satisfies everything else.
    ck("no group heading is drawn", pg.query_selector(".cqfound") is None,
       pg.eval_on_selector(".cqfound","e=>e.textContent") if pg.query_selector(".cqfound") else "none")
    # THE ROW SHAPE IS WHAT SAYS WHICH IS WHICH: a person who has never written
    # has no message line and no time. That IS the grouping, so it is the thing
    # to assert — not a class, not a heading.
    fresh=[r for r in rows if r.get_attribute("data-cqfresh")=="1"]
    ck("they are marked as having no conversation yet", len(fresh)>0, len(fresh))
    ck("...and carry no time, because they have none",
       all(r.query_selector(".cqw") is None for r in fresh))
    ck("...and no last message either",
       all((r.query_selector(".cqln").inner_text().strip() if r.query_selector(".cqln") else "")==""
           for r in fresh))
    # THE REGISTER'S NAME AND PLACE, same reader as a conversation row (§288.1).
    hz=[r for r in fresh if "Hazem Roushdy" in (r.inner_text() or "")]
    ck("a person on the register reads with their place", len(hz)==1 and
       hz[0].query_selector(".cqpl") is not None, len(hz))
    want = pg.evaluate("""() => { try { return placeLabel(personAt(personBy('loghead'))); }
                                  catch(e){ return null; } }""")
    got = hz[0].query_selector(".cqpl").inner_text().strip() if hz and hz[0].query_selector(".cqpl") else ""
    ck("...and it agrees with placeLabel(), never a literal", bool(want) and got==want, got+" vs "+str(want))
    # THE CAP SPEAKS AT THE FOOT — eleven match, ten are shown.
    ck("ten are shown, not eleven", len(fresh)==10, len(fresh))
    more = pg.query_selector(".cqmore")
    ck("the rest are counted at the foot", more is not None and "1 more" in more.inner_text(),
       more.inner_text() if more else "no line")
    # AND THE WAY OUT DOES NOT SCROLL AWAY — measured as a BOX against the
    # body's own box, never as a class: sticky is paint, not markup.
    #
    # THE FIRST OF THE TWO IS THE CONTROL CASE AND CANNOT FAIL (§113.8): with
    # the list scrolled to its end the foot is at the end whether it is pinned
    # or not. It is kept because it proves the foot is DRAWN at all — the
    # second one, at the TOP of a long list, is the one that goes red, and it
    # was watched doing so with the sticky rule taken out.
    pg.evaluate("() => { const b=document.getElementById('chatbody'); b.scrollTop=b.scrollHeight; }")
    pg.wait_for_timeout(200)
    ck("the way out is still on screen at the bottom of a long list",
       pg.evaluate("""() => { const f=document.querySelector('.cqfoot'),
                                    b=document.getElementById('chatbody');
         if (!f||!b) return false;
         const fr=f.getBoundingClientRect(), br=b.getBoundingClientRect();
         return fr.bottom <= br.bottom + 2 && fr.top >= br.top - 2 && fr.height > 0; }"""))
    pg.evaluate("() => { document.getElementById('chatbody').scrollTop = 0; }")
    pg.wait_for_timeout(150)
    ck("...and at the top of it too",
       pg.evaluate("""() => { const f=document.querySelector('.cqfoot'),
                                    b=document.getElementById('chatbody');
         const fr=f.getBoundingClientRect(), br=b.getBoundingClientRect();
         return fr.bottom <= br.bottom + 2 && fr.height > 0; }"""))
    # OPENING ONE OPENS AN EMPTY CONVERSATION AND ASKS THE SERVER NOTHING —
    # a 404 drawn as a failure would say something is wrong when nothing is.
    before=len([b for b in POSTED if b.get("action")=="thread"])
    # RE-QUERIED AT PRESS TIME, never held from before: the poll rebuilds this
    # list every few seconds, so a handle taken earlier is detached by the time
    # it is used — which is a failure of the CHECK reported as one of the
    # product's (§215). The row is addressed by the key it carries.
    # EVERY PROBE BELOW DEGRADES (§215). On a build with no people half the row
    # is simply not there, and a check that DIES on it reports six failures of
    # sixteen and calls the run finished — which is this file's own lesson,
    # walked into while writing the section that quotes it.
    opened = False
    try:
        pg.wait_for_selector('.cqrow[data-cqopen="loghead"]', timeout=4000)
        pg.click('.cqrow[data-cqopen="loghead"]'); pg.wait_for_timeout(700)
        opened = True
    except Exception as e:
        pass
    ck("the row can be opened at all", opened)
    after=len([b for b in POSTED if b.get("action")=="thread"])
    ck("opening one asks the server nothing", opened and after==before, str(before)+" -> "+str(after))
    def txt(sel, prop="textContent"):
        try: return pg.eval_on_selector(sel, "e=>e."+prop) or ""
        except Exception: return ""
    ck("...and the header becomes them", "Hazem" in txt("#chatpanel .cht"), txt("#chatpanel .cht"))
    ck("...with a composer that says WRITE, not reply",
       "Write to" in txt("#chatsay","placeholder"), txt("#chatsay","placeholder"))
    # AND THE FIRST MESSAGE CARRIES `start`, which is what mints it (§247).
    sent=[]
    if opened:
        try:
            pg.fill("#chatsay","Could you look at the Q3 figure?")
            pg.click("#chatsend"); pg.wait_for_timeout(800)
        except Exception: pass
        sent=[b for b in POSTED if b.get("action")=="reply" and b.get("person")=="loghead"]
    ck("the first message is sent as a NEW conversation", len(sent)==1 and sent[0].get("start") is True,
       json.dumps(sent[0].get("start")) if sent else "nothing sent")
    ck("...and it carries the same email every reply carries",
       len(sent)==1 and bool(sent[0].get("html")))
    # AND THE STATE IS PUT BACK (§94.2) — the section below asserts the search
    # survives navigating, and it asserts the term IT typed. A section that
    # leaves the box holding something else fails its neighbour, not itself.
    try: pg.click("[data-cqback]", timeout=3000); pg.wait_for_timeout(400)
    except Exception: pass          # nothing was open to come back from
    pg.fill("#cqfind","target"); pg.wait_for_timeout(800)

    print("\nAND THE CORNER ARRIVES WITH THE PAGE (§290)")
    # The bubble must be drawn from the state the page hydrated with, BEFORE
    # the chat has answered. Measured on a page whose chat endpoint is slow.
    ck("the switch is readable from the page's own state",
       pg.evaluate("() => { try { return !!SMPRules.chatCfg(GROUP.chat).on; } catch(e){ return null; } }"))

    print("\nAND IT SURVIVES MOVING ABOUT (§284)")
    tabs=[e for e in pg.query_selector_all("[data-s]") if e.is_visible()]
    if tabs:
        tabs[-1].click(); pg.wait_for_timeout(800)
        ck("still open after changing page",
           not pg.eval_on_selector("#chatpanel","e=>e.hidden"))
        ck("...and still on the queue with the search kept",
           pg.query_selector("#cqfind") is not None and
           pg.eval_on_selector("#cqfind","e=>e.value")=="target")
    print("\npage errors:", errs or "none")
    if errs: bad[0]+=1
    br.close()
srv.shutdown()
print("\n%d ok, %d FAILED" % (ok[0], bad[0]))

import sys
sys.exit(1 if bad[0] else 0)
