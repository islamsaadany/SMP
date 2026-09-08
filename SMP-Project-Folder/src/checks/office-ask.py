"""WAITING AND ASK (§299) — the office's corner, and the list it fills.

WHY THIS IS ITS OWN FILE AND NOT PART OF `qa.py`, for §94.11's reason twice
over: the corner does not exist over `file://` at all, so a build that had lost
this whole half would go green every time; and the office's side needs a server
that answers as the office's server does. It serves the built file over HTTP
with a stub `/api/chat`.

WHAT IS ASSERTED, AND WHY EACH HALF IS HERE:

  · BOTH ENDS OF THE SWITCH (§94.2). With Ask off there is no segmented control
    at all — a switch with one half is not a choice (§61) — and that absence is
    the state every tenant is in until the office turns it on, so it is the one
    a check that only looks for presence would never see.
  · WAITING TAKES TWO THIRDS, asserted as a RATIO of the two halves and never
    as a pixel count (§94.8), so a change to the panel's width stays green.
  · THE COMPOSER COMES BACK, and comes back changed. §298 hides it over a list
    of people; on Ask there IS somebody to write to, so it returns — without
    the attach button, because the assistant cannot see a picture (§61).
  · A DECLINED QUESTION IS NARRATED, NEVER SPOKEN (§125): the line saying it
    could not answer is not a bubble, and it says nothing about anybody coming,
    because on this side nobody is.
  · UNREACHED IS NOT DECLINED (§123, §124), asserted at BOTH ends — a build
    that drew the warning always would satisfy half of this perfectly.
  · AND NOTHING ELSE MOVES: the office's own conversation is not drawn, no
    `say` is posted, and the waiting list is exactly where it was. The server
    half of that is `scripts/test-ask.js`, against a real database.

The list on the Knowledge base page is measured here too, because it is drawn
from the same endpoint and is equally invisible over `file://`.
"""
import json, pathlib, threading, time, http.server, socketserver
from playwright.sync_api import sync_playwright

ROOT = pathlib.Path(__file__).resolve().parents[3]
HTML = (ROOT / "SMP-Project-Folder/src/strategy-management-platform.html").read_bytes()
SW = (ROOT / "sw.js").read_bytes()
SEED = json.loads((ROOT / "db/seed-state.json").read_text())
PERSON = {"key": "smo", "name": "Mohamed Essam", "role": "super"}

# §107, §167.2: the tour and the welcome screen both cover the page, and every
# click here would land on their overlay. Suppressed as a RETURNING viewer has
# it, never by reaching into either — both have checks of their own.
def _no_tour(pg):
    pg.add_init_script("try{sessionStorage.setItem('smp.tour.later','1');"
                       "sessionStorage.setItem('smp.welcome.done','1');}catch(e){}")

CFG = {"on": True, "shots": True, "promise": "Usually answers the same day",
       "beat": 4000, "ask": False}
STUB = {"posted": [], "asks": [], "reached": True, "questions": [],
        "asksHold": 0, "asksFail": False}
QUEUE = [{"person_key": "hend", "person_name": "Hend Farouk", "last_at": "2026-09-05T09:19:00Z",
          "last_body": "The Q3 target on Active Base still reads 4.2M."},
         {"person_key": "ramy", "person_name": "Ramy Behairy", "last_at": "2026-09-05T08:02:00Z",
          "last_body": "I cannot submit — something needs a note."}]

errs, bad = [], 0
def ck(w, ok, x=""):
    global bad
    if not ok: bad += 1
    print(("  ok      " if ok else "  FAIL    ") + w + (("  — " + str(x)) if not ok and x else ""))

GATE = b"<!doctype html><title>Sign in</title><h1 id='gate'>Sign in</h1>"


class H(http.server.BaseHTTPRequestHandler):
    def log_message(self, *a): pass

    def _send(self, code, body, ctype):
        self.send_response(code); self.send_header("Content-Type", ctype)
        self.send_header("Content-Length", str(len(body))); self.end_headers()
        self.wfile.write(body)

    def do_GET(self):
        if self.path.startswith("/api/state"):
            self._send(200, json.dumps({"ok": True, "state": SEED, "person": PERSON}).encode(),
                       "application/json"); return
        # §231.5: served as the gate serves it, or `register()` rejects on the
        # content type and a working build reports as a refusing browser.
        if self.path.startswith("/sw.js"):
            self._send(200, SW, "application/javascript"); return
        if self.path.startswith("/raya-trade"):
            self._send(200, HTML, "text/html; charset=utf-8"); return
        self._send(200, GATE, "text/html; charset=utf-8")

    def do_POST(self):
        n = int(self.headers.get("Content-Length") or 0)
        body = json.loads(self.rfile.read(n) or b"{}")
        if not self.path.startswith("/api/chat"):
            self._send(200, b'{"ok":true}', "application/json"); return
        STUB["posted"].append(body)
        a = body.get("action")
        # THE STUB MODELS THE SERVER (§100.3). `ask` records the question and
        # answers with the whole history, exactly as the endpoint does — a
        # stand-in that merely answered would let a client that never redrew
        # the list pass.
        if a == "ask":
            q = body.get("body") or ""
            if STUB["reached"]:
                answered = "?" not in q or "reopen" not in q.lower()
                STUB["asks"].append({
                    "id": len(STUB["asks"]) + 1, "at": "2026-09-06T09:0%d:00Z" % len(STUB["asks"]),
                    "question": q, "answered": answered,
                    "answer": ("A measure that adds up over the year is compared with the "
                               "share of its target due by the review point.") if answered else None})
            self._send(200, json.dumps({"ok": True, "reached": STUB["reached"],
                                        "rows": STUB["asks"]}).encode(), "application/json")
            return
        if a == "askMine":
            self._send(200, json.dumps({"ok": True, "rows": STUB["asks"]}).encode(),
                       "application/json"); return
        if a == "askQuestions":
            # THE STUB CAN BE SLOW AND CAN REFUSE (§302). Both states are
            # reachable in the product — the list rides §293's collection
            # sweep, which sits in front of every chat request — and neither
            # was ever driven here, so a panel that said "Nothing has been
            # asked yet" over a real history went green for as long as it
            # existed.
            if STUB["asksHold"]:
                time.sleep(STUB["asksHold"])
            if STUB["asksFail"]:
                self._send(500, b'{"ok":false,"error":"nope"}', "application/json"); return
            self._send(200, json.dumps({"ok": True, "days": 90,
                                        "rows": STUB["questions"]}).encode(),
                       "application/json"); return
        if a == "queue":
            self._send(200, json.dumps({"ok": True, "office": True, "threads": QUEUE,
                                        "chat": CFG, "waiting": len(QUEUE), "flagged": 0}).encode(),
                       "application/json"); return
        self._send(200, json.dumps({
            "ok": True, "office": True, "messages": [], "unread": 0, "thread": None,
            "waiting": len(QUEUE), "queue": QUEUE, "chat": dict(CFG, vapid="")}).encode(),
            "application/json")


srv = socketserver.ThreadingTCPServer(("127.0.0.1", 0), H)
srv.daemon_threads = True
PORT = srv.server_address[1]
threading.Thread(target=srv.serve_forever, daemon=True).start()
URL = "http://127.0.0.1:%d/raya-trade" % PORT
print("serving the built file at " + URL)

with sync_playwright() as p:
    b = p.chromium.launch()
    pg = b.new_page(viewport={"width": 1400, "height": 950})
    _no_tour(pg)
    # THE REFUSAL §10 ASKS FOR IS NOT A CONSOLE ERROR THIS FILE FOUND (§128).
    # A listener that counts the 500 the check itself produces reports a clean
    # build as broken — recorded once already, in a file that drives a refusal
    # on purpose. Narrowed to that window and nothing else.
    def _console(m):
        if m.type != "error": return
        if STUB["asksFail"] and "500" in m.text: return
        errs.append(m.text)
    pg.on("console", _console)
    pg.on("pageerror", lambda e: errs.append("pageerror: " + str(e)))

    def open_corner():
        pg.goto(URL, wait_until="networkidle")
        pg.wait_for_selector("#chatdock:not([hidden])", timeout=10000)
        pg.click("#chatbtn")
        pg.wait_for_selector("#chatpanel:not([hidden])")
        pg.wait_for_timeout(400)

    # ── 1 · WITH ASK OFF THERE IS NO SWITCH ──────────────────────────────
    print("\n1 · the switch, off")
    CFG["ask"] = False
    open_corner()
    ck("the office sees the waiting list", "Hend" in pg.inner_text("#chatbody"))
    ck("no segmented control at all", pg.query_selector(".cqseg") is None)
    ck("...and the search is still there", pg.query_selector("#cqfind") is not None)
    ck("...and no Ask half to press", pg.query_selector('[data-cqside="ask"]') is None)
    # §298 stands: no composer over a list of people.
    ck("no composer over the list", pg.eval_on_selector("#chatfoot", "e => e.hidden"))

    # ── 2 · WITH IT ON, TWO HALVES AND WAITING TAKES TWO THIRDS ──────────
    print("\n2 · the switch, on")
    CFG["ask"] = True
    open_corner()
    ck("the switch is drawn", pg.query_selector(".cqseg") is not None)
    ck("...with Waiting and Ask", [t.strip() for t in pg.eval_on_selector_all(
        ".cqseg button", "es => es.map(e => e.textContent)")][0].startswith("Waiting"))
    ck("...and no My messages anywhere",
       "My messages" not in pg.inner_text("#chatpanel"))
    # A RATIO, NEVER A NUMBER (§94.8): the panel's width may move, the
    # proportion is the decision.
    w = pg.eval_on_selector_all(".cqseg button",
                                "es => es.map(e => e.getBoundingClientRect().width)")
    ck("Waiting is about twice Ask", len(w) == 2 and 1.75 < w[0] / w[1] < 2.25,
       [round(x) for x in w])
    ck("...and neither half wraps", pg.eval_on_selector_all(
        ".cqseg button", "es => es.every(e => e.getClientRects().length === 1)"))

    # ── 3 · THE ASK HALF ─────────────────────────────────────────────────
    print("\n3 · opening Ask")
    pg.click('[data-cqside="ask"]')
    pg.wait_for_timeout(400)
    ck("the empty state invites a question",
       "Ask about the platform" in pg.inner_text("#chatbody"))
    ck("the composer comes back", not pg.eval_on_selector("#chatfoot", "e => e.hidden"))
    ck("...saying which box it is",
       pg.eval_on_selector("#chatsay", "e => e.placeholder").startswith("Ask about"))
    ck("...with no attach button", pg.eval_on_selector("#chatpic", "e => e.hidden"))
    ck("...and it says the questions are kept",
       "kept" in pg.inner_text("#chatnote").lower(), pg.inner_text("#chatnote"))
    ck("the waiting list is not drawn under it",
       "Hend" not in pg.inner_text("#chatbody"))

    # ── 4 · ASKING ───────────────────────────────────────────────────────
    print("\n4 · asking")
    pg.fill("#chatsay", "Why is my YTD compared with less than the full target?")
    pg.click("#chatsend")
    pg.wait_for_timeout(700)
    last = STUB["posted"][-1]
    ck("it posts `ask`, never `say`", last.get("action") == "ask", last.get("action"))
    ck("...carrying the question", "YTD" in (last.get("body") or ""), last.get("body"))
    ck("no `say` was ever posted",
       not any(x.get("action") == "say" for x in STUB["posted"]))
    body = pg.inner_text("#chatbody")
    ck("the question is on screen", "Why is my YTD" in body)
    ck("...and the answer under it", "share of its target" in body)
    ck("...captioned as the assistant's", "Assistant" in body, body[:120])

    # ── 5 · A QUESTION IT CANNOT ANSWER ──────────────────────────────────
    print("\n5 · declined")
    pg.fill("#chatsay", "Can a unit head reopen their own report?")
    pg.click("#chatsend")
    pg.wait_for_timeout(700)
    ck("the line says it has no answer",
       "don" in pg.inner_text("#chatbody") and "Questions asked" in pg.inner_text("#chatbody"))
    # NARRATED, NOT SPOKEN (§125): `.chsys`, never a bubble.
    ck("...as a narrated line rather than a message", pg.evaluate(
        """() => [...document.querySelectorAll('#chatbody .chsys')]
                  .some(e => e.textContent.indexOf('Questions asked') > -1)"""))
    ck("...and it promises nobody is coming",
       "office will" not in pg.inner_text("#chatbody").lower())

    # ── 6 · UNREACHED IS NOT DECLINED, BOTH ENDS ─────────────────────────
    print("\n6 · not reached")
    ck("nothing says it was unreachable while it is",
       "could not be reached" not in pg.inner_text("#chatbody"))
    STUB["reached"] = False
    pg.fill("#chatsay", "and this one never reaches it")
    pg.click("#chatsend")
    pg.wait_for_timeout(700)
    ck("the office is told when it was never reached",
       "could not be reached" in pg.inner_text("#chatbody"))
    ck("...and pointed at the diagnostic",
       "Test the assistant" in pg.inner_text("#chatbody"))
    STUB["reached"] = True

    # ── 7 · BACK TO WAITING, AND THE SWITCH GOING OFF ────────────────────
    print("\n7 · back")
    pg.click('[data-cqside="wait"]')
    pg.wait_for_timeout(400)
    ck("the waiting list is back", "Hend" in pg.inner_text("#chatbody"))
    ck("...and the composer is hidden again", pg.eval_on_selector("#chatfoot", "e => e.hidden"))
    pg.click('[data-cqside="ask"]')
    pg.wait_for_timeout(300)
    # THE SWITCH CAN GO OFF UNDER SOMEBODY STANDING ON IT (§61's trap): the
    # office is several people and every browser reads the setting from the
    # poll.
    CFG["ask"] = False
    pg.wait_for_timeout(5000)
    ck("turning Ask off does not strand whoever was on it",
       pg.query_selector(".cqseg") is None and "Hend" in pg.inner_text("#chatbody"),
       pg.inner_text("#chatbody")[:80])
    CFG["ask"] = True

    # ── 8 · THE LIST ON THE KNOWLEDGE BASE PAGE ──────────────────────────
    print("\n8 · questions asked")
    STUB["questions"] = [
        {"qkey": "why is my ytd compared with less than the full target",
         "question": "Why is my YTD compared with less than the full target?",
         "times": 14, "people": 9, "last_at": "2026-09-06T09:12:00Z",
         "by_office": False, "office_only": False, "answered": True,
         "answer": "A measure that adds up over the year is compared with the share due by now.",
         "source": "scoring"},
        {"qkey": "can a unit head reopen their own report",
         "question": "Can a unit head reopen their own report?",
         "times": 7, "people": 4, "last_at": "2026-09-06T09:02:00Z",
         "by_office": True, "office_only": True, "answered": False, "answer": None,
         "source": None}]
    pg.goto(URL, wait_until="networkidle")
    pg.wait_for_timeout(600)
    pg.click('[data-md="setup"]')
    pg.wait_for_timeout(300)
    pg.click('[data-setupgo="kb"]')
    pg.wait_for_timeout(900)
    # THE PAGE OPENS ON `How it works` AND THE LIST IS ON `Questions & answers`
    # — it is a list of questions, and the thing you do with a row is write one
    # of the answers below it. Pressed here rather than assumed: the first run
    # of this file measured the other tab and reported a working build broken
    # (§100.3, from the check's own side).
    if pg.query_selector('[data-kbtab="qa"]'):
        pg.click('[data-kbtab="qa"]')
        pg.wait_for_timeout(700)
    ck("the list is on the page", pg.query_selector(".askpane") is not None)
    txt = pg.inner_text(".askpane") if pg.query_selector(".askpane") else ""
    ck("...with the answered question and its answer",
       "less than the full target" in txt and "share due by now" in txt)
    ck("...and the unanswered one named as such", "No answer" in txt)
    ck("...counted", "14" in txt and "7" in txt)
    ck("...and the office's own marked as theirs", "Office" in txt)
    # THE UNANSWERED ROW IS THE ONE THE OFFICE CAN CLOSE, and it wears the
    # warning ground rather than an alarm one (§168). Measured as PAINT.
    grounds = pg.evaluate("""() => [...document.querySelectorAll('.asktable tbody tr')]
        .map(r => getComputedStyle(r.querySelector('td')).backgroundColor)""")
    ck("the unanswered row is marked and the answered one is not",
       len(grounds) == 2 and grounds[0] != grounds[1], grounds)
    ck("only the unanswered row offers to be answered",
       len(pg.query_selector_all("[data-askadd]")) == 1,
       len(pg.query_selector_all("[data-askadd]")))
    # AND THE ANSWERED ONE OPENS THE ANSWER IT WAS GIVEN FROM, rather than
    # offering to write a second beside it (§87). Both ends, or a build that
    # drew no control at all on either row would satisfy the line above.
    ck("...and the answered one opens the entry it answered from",
       len(pg.query_selector_all("[data-askopen]")) == 1,
       len(pg.query_selector_all("[data-askopen]")))
    # THE FILTER SAYS WHICH SIDE IT IS ON, and the empty case describes THIS
    # filter rather than the product (§113).
    if pg.query_selector('[data-askfilter="miss"]'):
        pg.click('[data-askfilter="miss"]')
        pg.wait_for_timeout(400)
        ck("the filter narrows to the unanswered",
           "less than the full target" not in pg.inner_text(".askpane"))
    else:
        ck("the filter narrows to the unanswered", False, "no filter drawn")

    # ── 9 · WRITING THE ANSWER ───────────────────────────────────────────
    print("\n9 · answering one")
    n0 = pg.evaluate("() => SMPRules.kbAllAdds(GROUP.kb).length")
    # DEGRADES RATHER THAN DYING (§215, in a file that says so at the top):
    # Playwright waits 30s on a control that is not there and then throws,
    # which reports FEWER failures than there are — the exact fault this
    # suite has recorded four times.
    if pg.query_selector("[data-askadd]"):
        pg.click("[data-askadd]")
        pg.wait_for_timeout(700)
    else:
        ck("there is a row to answer", False, "no [data-askadd] drawn")
    adds = pg.evaluate("() => SMPRules.kbAllAdds(GROUP.kb)")
    ck("an entry is minted in the knowledge base", len(adds) == n0 + 1, len(adds))
    made = adds[-1] if adds else {}
    ck("...carrying the question as asked",
       made.get("q") == "Can a unit head reopen their own report?", made.get("q"))
    ck("...with the audience of the side that asked", made.get("w") == "office", made.get("w"))
    ck("...and the pen is open on it",
       pg.query_selector('[data-kba="%s"]' % made.get("id")) is not None)
    ck("...with the cursor in the answer",
       pg.evaluate("() => document.activeElement && document.activeElement.dataset.kba") ==
       made.get("id"))
    # AND THE ROW STOPS OFFERING AT ONCE, so a second press cannot mint a
    # second entry for one question (§87) — but it does NOT yet claim an answer
    # has been written, because nothing has been typed into it (§35).
    ck("the row stops offering to be answered", pg.query_selector("[data-askadd]") is None)
    ck("...and says an answer is being written, not that one is",
       "being written" in pg.inner_text(".askpane"), pg.inner_text(".askpane")[:200])
    pg.fill('[data-kba="%s"]' % made.get("id"),
            "Yes. Whoever may submit for a subject may reopen it.")
    pg.eval_on_selector('[data-kba="%s"]' % made.get("id"), "e => e.blur()")
    pg.wait_for_timeout(500)
    ck("...and once it is written, the row says so",
       "An answer has been written here" in pg.inner_text(".askpane"),
       pg.inner_text(".askpane")[:200])

    # ── 10 · THE LIST WHILE IT IS COMING, AND WHEN IT DOES NOT (§302) ────
    # Islam, of this panel on his own tenant: a card reading "Questions asked
    # Nothing has been lost" over "**These could not be loaded.** no answer
    # Nothing has been lost…", with the assistant beside it answering normally.
    # Three faults in one card and none of them reachable through a stub that
    # always answers at once, which is why none was ever measured.
    print("\n10 · the list is slow, and the list refuses")
    n_asks = lambda: len([p for p in STUB["posted"] if p.get("action") == "askQuestions"])
    # PUT THE PAGE BACK FIRST (§94.2). §8 left the filter on the unanswered and
    # §9 then answered the only row it holds, so the last assertion here would
    # be measuring an empty filter rather than an arrived list.
    if pg.query_selector('[data-askfilter="all"]'):
        pg.click('[data-askfilter="all"]')
        pg.wait_for_timeout(300)

    # THE WAIT FIRST, AND ON ITS OWN. Once the failure card is up the retry is
    # the only way back, so on a build that draws no retry the loading state is
    # unreachable through that path and its assertions pass for the wrong
    # reason (§113.8). Driven here through the product's own state — `null` is
    # what the shell waits for — so it is measured on every build.
    STUB["asksHold"] = 1.5
    pg.evaluate("() => { ASKS = null; paint(); }")
    pg.wait_for_timeout(400)          # inside the hold, deliberately
    # AND THE SECOND PAINT IS THE ONE THAT MATTERS. The first render happens
    # while `ASKS` is still null, so even the broken build says "Asking…" once;
    # the shell then sets `{asking:true}`, and every paint after that fell
    # through to the empty list. A repaint mid-flight is not a contrivance —
    # the corner polls every few seconds and each answer repaints — so a check
    # that only looked once would have called the fault clean.
    pg.evaluate("() => paint()")
    pg.wait_for_timeout(150)
    wait = pg.inner_text(".askpane") if pg.query_selector(".askpane") else ""
    ck("while the list is coming the panel says so", "Asking" in wait, wait[:160])
    ck("...and does not say nothing has been asked",
       "Nothing has been asked yet" not in wait, wait[:200])
    ck("...nor count a history it has not read",
       "Last 0 days" not in wait and "All 0" not in wait, wait[:200])
    pg.wait_for_timeout(1800)
    STUB["asksHold"] = 0

    # THEN THE REFUSAL. Same door, so the page under it is the page the office
    # was already reading rather than a reload.
    STUB["asksFail"] = True
    before = n_asks()
    pg.evaluate("() => { ASKS = null; paint(); }")
    pg.wait_for_timeout(700)
    ck("a refusal is asked for once", n_asks() == before + 1, n_asks() - before)
    card = pg.inner_text(".askpane") if pg.query_selector(".askpane") else ""
    ck("the card says the list could not be loaded", "could not be loaded" in card, card[:160])
    # SAID ONCE. It was the window's label AND the sentence, one line apart.
    ck("...and says nothing was lost exactly once",
       card.count("Nothing has been lost") == 1, card.count("Nothing has been lost"))
    # AND IT SAYS ONLY WHAT IT MEANS TO SAY. The card printed `post()`'s own
    # sentinel — "no answer", its word for a 25-second clock running out —
    # mid-sentence, where it reads as a fragment of somebody else's error
    # (§124). Asserted as the WHOLE wording rather than as the absence of that
    # one string: the sentinel arrives only on a real timeout, so a stub
    # answering 500 can never produce it and an assertion naming it could not
    # fail here (§94.5).
    want = ("The list could not be loaded. Nothing has been lost — "
            "the questions are on the server. Try again")
    ck("...and says nothing else", " ".join(card.split()).endswith(want),
       " ".join(card.split())[:200])
    # A DEAD END IS THE OTHER HALF OF THE FAULT: the list is asked once per
    # visit, so a moment's trouble stood until the whole page was reloaded.
    ck("...and carries a way out", pg.query_selector("[data-askretry]") is not None)
    # DRESSED AS A CONTROL. `.askact .mini` could not reach a button in the
    # card, so a correct fix still shipped a bare browser button on the one
    # screen whose job is saying something went wrong quietly (§168). Measured
    # as PAINT, never as a class (§94.8).
    look = pg.evaluate("""() => { const b = document.querySelector('[data-askretry]');
        if (!b) return null; const s = getComputedStyle(b);
        return { w: s.fontWeight, r: s.borderRadius, st: s.borderTopStyle }; }""")
    ck("...drawn as the pane's own control",
       bool(look) and int(look["w"]) >= 600 and look["r"] != "0px" and look["st"] == "solid",
       look)

    # THEN THE WAIT. With the server healthy again but slow, the panel must say
    # it is asking — the branch that says so read `!ASKS` and could never run,
    # because the shell sets `{asking:true}` the moment it asks, so the page
    # fell through and told the office nothing had ever been asked.
    STUB["asksFail"] = False
    STUB["asksHold"] = 1.5
    before = n_asks()
    # DEGRADES RATHER THAN DYING (§215). Playwright waits 30s on a control that
    # is not there and then throws, so this section's first falsification run
    # reported three failures where there are seven — the exact fault this
    # file's own docstring warns about, walked into while adding to it.
    if pg.query_selector("[data-askretry]"):
        pg.click("[data-askretry]")
    else:
        ck("there is a way out to press", False, "no [data-askretry] drawn")
    pg.wait_for_timeout(400)          # inside the hold, deliberately
    mid = pg.inner_text(".askpane") if pg.query_selector(".askpane") else ""
    ck("trying again asks again", n_asks() == before + 1, n_asks() - before)
    ck("...and while it is coming the panel says so", "Asking" in mid, mid[:160])
    # BOTH ENDS (§94.2): a build that only ever said "Asking…" would satisfy
    # the line above and be useless.
    ck("...and never says nothing has been asked",
       "Nothing has been asked yet" not in mid, mid[:200])
    ck("...nor counts a history it has not read",
       "Last 0 days" not in mid and "All 0" not in mid, mid[:200])
    pg.wait_for_timeout(1800)
    done = pg.inner_text(".askpane") if pg.query_selector(".askpane") else ""
    ck("...and the list arrives", "less than the full target" in done, done[:200])
    STUB["asksHold"] = 0

    b.close()

print("\nconsole errors: " + (str(errs) if errs else "none"))
if errs: bad += len(errs)
print(("ALL CLEAR" if not bad else "%d FAILURES" % bad))
raise SystemExit(1 if bad else 0)
