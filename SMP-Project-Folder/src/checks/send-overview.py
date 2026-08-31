"""SEND A MESSAGE OPENS ON WHAT WENT (§144).

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
    is also what keeps §143's rule alive: the send cannot be repeated by one
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
  # A TEST COPY (§145). `audience` is null on one, which is why the mark has to
  # be what that column says rather than a dash.
  {"id": 7, "subject": "The Q3 reporting cycle opens on Monday",
   "sent_at": "2026-08-27T09:06", "by_name": "Mohamed Essam",
   "audience": None, "total": 1, "sent": 1, "failed": 0, "kind": "test"},
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
            if a == "historyDelete":
                if DELREFUSE:
                    return self._send(403, b'{"ok":false,"error":"That is a message that '
                                           b'went to the business. Only test copies can be removed."}',
                                      "application/json")
                DELETED.append(body.get("id"))
                return self._json({"ok": True})
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
DELETED = []     # ids the page asked the server to remove
DELREFUSE = False  # the server refuses the delete
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
    /* THE OVERVIEW'S OWN LOUD CONTROL (§144.8) — and `elementFromPoint` at its
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
    # §167.2, AND THIS FILE WAS WINNING A RACE RATHER THAN AVOIDING IT:
    # the welcome screen (§148) covers the viewport, so every click lands on
    # `.welcomeover`. Sections 1–6 happened to press Setup before the screen
    # was built (it opens after the boot paint); anything that waits first
    # met it. Suppressed as a RETURNING viewer has it, in an init script —
    # setting the flag after `goto` is too late — and never by reaching into
    # the welcome screen, which has its own check.
    pg.add_init_script("try{sessionStorage.setItem('smp.tour.later','1');"
                       "sessionStorage.setItem('smp.welcome.done','1');}catch(e){}")
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
           [t["label"] for t in r["tabs"]] == ["Overview", "Compose", "Email settings"], r["tabs"])
        ck("and it opens on Overview", r["on"] == "Overview", r["on"])
        ck("which draws both lists",
           r["headings"] == ["Not sent yet", "What has been sent"], r["headings"])
        # THE FAULT THIS CHECK EXISTS FOR: gated on a control that moved tabs.
        ck("the lists actually resolve", not r["asking"], "still Asking...")
        ck("no grey descriptions", r["notes"] == 0, r["notes"])

        # ── THE ACTION IS OBVIOUS (§144.8) ──────────────────────────
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
        ck("the button opens the composer", r["on"] == "Compose", r["on"])
        # A control offering to take you where you are is a duplicate (§94.15).
        ck("and it is not drawn there", r["writeBtn"] is None, r["writeBtn"])
        pg.click('.secrow [role=tab]:nth-of-type(1)')
        pg.wait_for_timeout(800)
        to_write(pg)
        r = pg.evaluate(READ)
        ck("the composer is the second tab", r["on"] == "Compose", r["on"])
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
        # §143's rule, kept by construction: there is no Send to press.
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
        ck("it stays on the composer", r["on"] == "Compose", r["on"])
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

        # ── 6 · THE TEST COPY, AND WHAT MAY BE REMOVED (§145) ────────────
        print("\n6 · a test copy is in the record, and only it can be removed")
        br, pg = open_page(pw)
        pg.wait_for_timeout(1400)

        rows = pg.evaluate("""() => {
          const t = [...document.querySelectorAll('#msgover table')].pop();
          if (!t) return null;
          return [...t.querySelectorAll('tbody tr')].map(tr => ({
            subject: (tr.children[0].innerText || '').trim(),
            who: (tr.children[2].innerText || '').trim(),
            del: !!tr.querySelector('[data-sentdel]'),
            /* THE FAULT THE MOCKUP CAUGHT: a mark beside the heading pushed the
               frozen first column onto a SECOND LINE (§88, §116.4). A table cell
               returns ONE client rect however many lines it holds (§105.2), so
               the lines are counted off a Range over its contents — the distinct
               tops among rects that have width. Never the row's HEIGHT: §88's
               own check deliberately does not assert equal heights, because the
               way to pass that is to delete real content. */
            lines: (() => {
              /* OVER THE TEXT NODE, never the cell: a Range over an element's
                 contents spans the boxes inside it too, so the button and its
                 own text reported two tops and every row — marked or not —
                 came back as two lines. `no-wrap.py` had this right already
                 and this is its shape, not a second one. */
              const walk = document.createTreeWalker(tr.children[0], NodeFilter.SHOW_TEXT);
              const tops = new Set();
              let n;
              while ((n = walk.nextNode())) {
                if (!n.textContent.trim()) continue;
                const rg = document.createRange();
                rg.selectNodeContents(n);
                [...rg.getClientRects()].filter(x => x.width > 0)
                  .forEach(x => tops.add(Math.round(x.top)));
              }
              /* TOPS ACROSS THE WHOLE CELL, not the worst single text node: the
                 fault this exists for puts the MARK on the second line, and the
                 mark is its own text node sitting happily on one line of its
                 own. Counted per node this assertion could not fail for the one
                 reason it was written (§113.8), and the deliberate break proved
                 exactly that before this was corrected. */
              return tops.size;
            })()
          }));
        }""")
        ck("the record is drawn", bool(rows), rows)
        if rows:
            tests = [r for r in rows if "Test copy" in r["who"]]
            real = [r for r in rows if "Test copy" not in r["who"]]
            ck("the test copy is marked", len(tests) == 1, [r["who"] for r in rows])
            ck("and a real send is not", all("Test copy" not in r["who"] for r in real))
            ck("a real send still says who it went to",
               all(r["who"] and r["who"] != "\u2014" for r in real), [r["who"] for r in real])
            # §88: EVERY HEADING IS ONE LINE. The first drawing failed here, and
            # a 1px difference between rows is not that fault — asserting equal
            # heights called a correct build broken.
            ck("no heading is pushed onto a second line",
               all(r["lines"] == 1 for r in rows), [r["lines"] for r in rows])
            ck("Delete is on the test copy", tests and tests[0]["del"])
            ck("and on no message that went to the business",
               not any(r["del"] for r in real), [r["subject"] for r in real if r["del"]])

        print("\n6b · removing one")
        pg.click("[data-sentdel]")
        pg.wait_for_timeout(400)
        ck("it asks first, in the platform's own dialog",
           pg.evaluate("()=>!!document.querySelector('#modal-b .sendconfirm')"))
        ck("and names the row being removed",
           "Q3 reporting cycle" in (pg.inner_text("#modal-b") if
                                    pg.query_selector("#modal-b") else ""))
        ck("and says there is no undo",
           "no undo" in (pg.inner_text("#modal-b").lower() if
                         pg.query_selector("#modal-b") else ""))
        n0 = len(DELETED)
        pg.click("[data-delno]"); pg.wait_for_timeout(300)
        ck("Cancel removes nothing", len(DELETED) == n0, DELETED)
        pg.click("[data-sentdel]"); pg.wait_for_timeout(300)
        pg.click("[data-delyes]"); pg.wait_for_timeout(900)
        ck("Yes asks the server", len(DELETED) == n0 + 1, DELETED)
        ck("and the list is asked again rather than guessed at",
           pg.evaluate("()=>SENTLIST !== null"))
        br.close()

        # ── 6c · A REFUSAL IS SAID ON THE PAGE (§32) ─────────────────────
        print("\n6c · a refusal from the server is said, not swallowed")
        global DELREFUSE
        DELREFUSE = True
        br, pg = open_page(pw)
        pg.wait_for_timeout(1400)
        pg.click("[data-sentdel]"); pg.wait_for_timeout(350)
        pg.click("[data-delyes]"); pg.wait_for_timeout(900)
        said = pg.inner_text("#msgover") if pg.query_selector("#msgover") else ""
        ck("the refusal reaches the page", "test copies" in said.lower(), said[:160])
        ck("in the bad voice", pg.evaluate("""() => {
            const e = document.querySelector('#msgover .sentsaid');
            return !!e && e.className.indexOf('bad') > -1; }"""))
        DELREFUSE = False
        br.close()

        # ── 6d · IT IS THE SUPER USER'S (§89) ────────────────────────────
        print("\n6d · somebody who may not destroy is offered nothing")
        # THE SEAT IS ON THE REGISTER ROW (§89): `isSMO` reads `people[].role`,
        # so changing the session's own field proves nothing — the first version
        # of this did exactly that and passed while the control was still drawn.
        for _p in STATE.get("people", []):
            if _p.get("key") == "smo":
                _p["role"] = "smoteam"
        PERSON["role"] = "smoteam"
        br, pg = open_page(pw)
        pg.wait_for_timeout(1400)
        ck("no Delete anywhere in the record",
           not pg.evaluate("()=>!!document.querySelector('#msgover [data-sentdel]')"))
        ck("and no empty column left behind", pg.evaluate("""() => {
            const t = [...document.querySelectorAll('#msgover table')].pop();
            if (!t) return false;
            const th = t.querySelectorAll('thead th').length;
            const td = t.querySelectorAll('tbody tr').length
                       ? t.querySelector('tbody tr').children.length : 0;
            return th === 5 && td === 5; }"""))
        ck("but the record still reads",
           "Q3 reporting" in (pg.inner_text("#msgover") if pg.query_selector("#msgover") else ""))
        for _p in STATE.get("people", []):
            if _p.get("key") == "smo":
                _p["role"] = "super"
        PERSON["role"] = "super"
        br.close()

        # ══ 7 · A PRESS OUTSIDE PUTS THE PICKER AWAY (§203) ════════
        # Islam: "when I choose the who to send to from the filters, when I
        # click outside the drop down let it close. Of course what is
        # selected is saved." Nothing is at risk — every tick is written to
        # SENDMSG as it is made — so this is purely putting the panel away.
        # THE TWO THINGS THAT MUST NOT CLOSE IT are asserted beside it: a
        # press inside the panel (its own search box), and a press on
        # another filter's button, which must SWITCH rather than shut.
        print("\n7 · a press outside closes the recipient picker")
        br, pg = open_page(pw)
        to_write(pg)
        pg.click('[data-ddopen="roles"]')
        pg.wait_for_timeout(400)
        ck("the panel opens", pg.evaluate("() => !!document.querySelector('.ddpop')"))
        n = pg.evaluate("""() => {
          const rows=[...document.querySelectorAll('.ddpop [data-aud]')].slice(0,2);
          rows.forEach(r => { r.checked = true;
            r.dispatchEvent(new Event('change',{bubbles:true})); });
          return rows.length; }""")
        pg.wait_for_timeout(500)
        ck("...two roles ticked", n == 2, n)
        # TICKING MUST NOT CLOSE IT — a list you are ticking is not answered
        # until you stop (§130.1's rule, from the other side).
        ck("...and ticking leaves it open",
           pg.evaluate("() => !!document.querySelector('.ddpop')"))
        chosen = pg.evaluate("() => (sendmsg().criteria.roles || []).slice()")
        pg.mouse.click(1200, 940)
        pg.wait_for_timeout(500)
        ck("a press outside closes it",
           pg.evaluate("() => !document.querySelector('.ddpop')"))
        ck("...and what was chosen is kept",
           pg.evaluate("() => (sendmsg().criteria.roles || []).slice()") == chosen
           and len(chosen) == 2, chosen)
        ck("...with the count still on the button",
           pg.evaluate("""() => { const b =
             document.querySelector('[data-ddopen="roles"] .ddn');
             return b ? b.textContent.trim() : null; }""") == "2")
        # inside is not outside
        pg.click('[data-ddopen="units"]')
        pg.wait_for_timeout(400)
        pg.click(".ddpop .ddsearch")
        pg.wait_for_timeout(300)
        ck("a press INSIDE the panel does not close it",
           pg.evaluate("() => !!document.querySelector('.ddpop')"))
        pg.click('[data-ddopen="fns"]')
        pg.wait_for_timeout(400)
        ck("...and another filter's button still SWITCHES panels",
           pg.evaluate("""() => { const p = document.querySelector('.ddpop');
             return !!p && p.dataset.ddpop === 'fns'; }"""))
        # WIRED ONCE: wire() runs on every paint, so a listener added there
        # would stack one deep per repaint (§24, §47.2) — and this repaints.
        pg.evaluate("() => { for (let i=0;i<5;i++) paint(); }")
        pg.wait_for_timeout(500)
        pg.click('[data-ddopen="roles"]')
        pg.wait_for_timeout(400)
        pg.mouse.click(1200, 940)
        pg.wait_for_timeout(500)
        ck("after five repaints one press still just closes it",
           pg.evaluate("() => !document.querySelector('.ddpop')"))
        ck("...and the ticks survived all of it",
           pg.evaluate("() => (sendmsg().criteria.roles || []).length") == 2)
        br.close()

        # ══ 8 · THE ORGANISATION IS NAMED ONCE UNDER THE CARD (§203) ═
        # Islam: "remove the raya trade small title in the bottom, it's
        # already in the long title above." Asserted on the BUILT email
        # rather than on the page: the line lived outside the card's table,
        # so nothing on the composer would have shown it going.
        print("\n8 · the email does not sign itself twice")
        br, pg = open_page(pw)
        m = pg.evaluate("""() => {
          const h = MAIL.html({ org:"Raya Trade", title:"A heading",
                                body:"A line.", footer:"Sent from Raya Trade" });
          const d = document.createElement('div'); d.innerHTML = h;
          const tbl = d.querySelector('table');
          return { afterTables: [...d.querySelectorAll('table')]
                     .map(t => (t.nextElementSibling||{}).tagName || null),
                   orgCount: (h.match(/Raya Trade/g)||[]).length,
                   stray: !!d.querySelector('table + div') }; }""")
        ck("no grey line hangs under the card", m and not m["stray"], m)
        ck("...and the name is not printed a third time",
           m and m["orgCount"] <= 2, m)
        br.close()


go()

print("\n%s" % ("ALL GOOD" if not bad else "%d FAILED" % bad))
raise SystemExit(1 if bad else 0)
