#!/usr/bin/env python3
"""The room we publish a client's library from (spec 053).

Publishing is Forefront's, so this screen is the module's ONLY authoring
surface — the client's own page reads and cannot write at all, which
checks/insights.mjs §11 asserts from the other end. If a control here is
drawn and wired to nothing, nobody finds out from the client's side: their
page renders perfectly and the report simply never appears.

WHICH IS §96 EXACTLY, and why this file PRESSES rather than looking. That
section found twenty input fields and four buttons on a plan's objectives
table, every one of them decoration — typing was accepted and discarded on
the next repaint — and nothing caught it, because a bound field and an unbound
one differ by one absent attribute. So every assertion below reads what the
page SENT, never what it drew.

AND BOTH ENDS EVERY TIME (§94.2). A build that removed Publish would satisfy
"Publish is held while there is no file" perfectly, so each refusal is
asserted beside the press that must land.

IT NEEDS NO DATABASE. platform.html is served as it is by both stacks and
every rule it obeys is the server's, so a stub answers /api/platform and
records what arrived — which is also the only way to MAKE the states that
matter: a report with no file, a published one, a store that is not there
(§94.11, §255).

Run:  SMP_CHROME=… python3 SMP-Project-Folder/src/checks/publishing-room.py
      SMP_PAGE=smp-app/shell/platform.html …     # the new stack's own copy
      … --break=publish-anyway    # a Publish with no report saved behind it
      … --break=delete-published  # Delete offered on a published report
      … --break=mark-published    # every row marked, not only the drafts

SECTION 8 IS FALSIFIED FROM THE SOURCE, WHICH IS THE STRONGER ROAD (§276) and
is open to it because SMP_PAGE takes any path: copy platform.html, make ONE
edit, point this at the copy. Four were made and each reddens its own
assertions and nothing else — `All` ticking every place rather than handing it
back (2 red), a tick on an everyone report starting at everything-minus-one
(1), `Done` saving whether or not anything moved (2), and the panel rebuilt on
every keystroke rather than hiding in place (4).

TWO OF THOSE FOUR TAUGHT THIS FILE SOMETHING BEFORE THEY WORKED. The first
DIED rather than reporting — `press` throws when the word is not on a button,
and the word is exactly what an all-ticks build changes, so the one fault the
break stages was the one that killed the run (§215, inside the helper written
to stop it; the press is inside the try now). And a search break went GREEN,
because the assertion counted rows and a rebuilt list holds the same four:
"in place" is about the nodes being the SAME nodes, so it is asserted as
identity now and the box being typed into is asserted beside them (§113.8).

THE ONE THING WITH NO BREAK BEHIND IT, said rather than left as a gap (§54.5):
the piece loop. A break here is a DOM edit after the page has drawn, and
`sendFile` is inside the card's own closure where nothing outside can reach
it — so "the file goes in three pieces" is asserted against the three requests
that arrived and has no synthetic way to fail. A build that sent the whole
file in one request would produce `[1]` and go red; a build that ignored the
server's piece size would trip the size assertion beside it. Both are real
regressions and neither can be staged from here.
"""
import http.server, json, os, socketserver, sys, threading
from playwright.sync_api import sync_playwright

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))
REPO = os.path.abspath(os.path.join(ROOT, ".."))
PORT = int(os.environ.get("SMP_CHECK_PORT", "3989"))
BASE = "http://127.0.0.1:%d" % PORT
BREAK = next((a.split("=", 1)[1] for a in sys.argv[1:] if a.startswith("--break=")), "")
def pagePath():
    """WHERE THE PAGE IS, SAID RATHER THAN HANDED BACK AS A TIMEOUT (§371).

    §369.4 found this and fixed it in ONE file: `SMP_PAGE` is documented
    relative to the REPOSITORY ROOT, and every browser check here is run
    through `qa-run.py`, which lives in `SMP-Project-Folder/src` (§320.6b) —
    so the documented spelling is relative to one directory and typed from
    another. Run from `src/` this resolved to a file that is not there, the
    page was never served, and the run died on a navigation timeout naming
    neither the file nor the directory it was looked for in (§215, §123).
    Both spellings are accepted, and a page that is not there is refused
    BEFORE the server starts rather than inside a request thread.
    """
    want = os.environ.get("SMP_PAGE")
    tries = [os.path.abspath(want), os.path.abspath(os.path.join(REPO, want))] if want \
        else [os.path.join(REPO, "platform.html")]
    tries = list(dict.fromkeys(tries))
    for p in tries:
        if os.path.isfile(p):
            return p
    sys.exit("the console page is not there — %s\n  tried: %s"
             % ("SMP_PAGE=%s" % want if want else "no platform.html at the repository root",
                "\n  tried: ".join(tries)))


PAGE = pagePath()
SHOT = os.environ.get("SMP_SHOT")

fails, passes = [], []
def check(what, ok, detail=""):
    if ok:
        passes.append(what); print("  ok   " + what)
    else:
        print("  FAIL " + what + ("  — " + str(detail) if detail else "")); fails.append(what)

CATS = ["Analysis", "Macro", "Market", "Sector", "Governance"]
PIECE = 3 * 1024 * 1024

def item(**kw):
    d = {"id": "i1", "kind": "insights", "title": "A report", "summary": "",
         "categories": [], "reportDate": "", "version": 1, "fileName": "", "fileSize": 0,
         "sizeLabel": "", "hasFile": False, "state": "draft", "downloads": 0,
         "publishedAt": "", "publishedBy": "", "filePath": "",
         # null is everyone, [] is nobody, a list is those places (spec 046
         # §4.10). `seenLabel` is the SERVER's words, so the row and the card
         # cannot describe one report's reach two ways (§53.5).
         "seen": None, "seenLabel": ""}
    d.update(kw); return d

def label_for(seen):
    """The server's own seenLabel, which is what the stub has to answer with."""
    if seen is None: return ""
    if not seen: return "Nobody"
    return "%d department%s" % (len(seen), "" if len(seen) == 1 else "s")

# This client's own units and functions — and Care is BOTH, which is the row
# the suffix exists for (§65).
PLACES = [{"at": "mobile", "label": "Mobile", "kind": "unit"},
          {"at": "care", "label": "Care", "kind": "unit"},
          {"at": "fn:finance", "label": "Finance (function)", "kind": "fn"},
          {"at": "fn:care", "label": "Care (function)", "kind": "fn"}]

# The scene the stub is standing in, and the record of what reached it.
SCENE = {"items": [], "sent": [], "pieces": [], "store": True}

CARD = {"key": "raya-trade", "name": "Raya Trade", "industry": "Trade & distribution",
        "kind": "client", "mark": None, "mine": True, "seat": "super", "state": "open",
        "canOpen": True, "canConfig": True, "units": 10, "planned": True, "cycleOpen": True,
        "unreadable": False,
        "modules": [{"key": "strategy", "label": "Strategy", "state": "cycle open", "room": False},
                    {"key": "insights", "label": "Insights", "state": "", "room": True}]}

class Stub(http.server.SimpleHTTPRequestHandler):
    def log_message(self, *a): pass
    def _send(self, body, ctype, code=200):
        b = body.encode("utf-8")
        self.send_response(code)
        self.send_header("Content-Type", ctype)
        self.send_header("Content-Length", str(len(b)))
        self.end_headers()
        self.wfile.write(b)
    def do_GET(self):
        p = self.path.split("?")[0]
        if p in ("/platform", "/"):
            with open(PAGE, encoding="utf-8") as f: self._send(f.read(), "text/html; charset=utf-8")
            return
        # Both stacks serve this page from one source (§53.5): the new stack's
        # copy is generated with the script moved out, so SMP_PAGE points the
        # run at it and the script is served from beside it.
        if p == "/platform-page.js":
            with open(os.path.join(REPO, "smp-app", "public", "platform-page.js"), encoding="utf-8") as f:
                self._send(f.read(), "application/javascript; charset=utf-8")
            return
        self.send_response(404); self.end_headers()

    def do_POST(self):
        n = int(self.headers.get("Content-Length", "0"))
        raw = self.rfile.read(n) or b"{}"
        p = self.path.split("?")[0]

        # ── a piece of a file: raw bytes, named in the query ─────────────
        if p == "/api/platform/file":
            from urllib.parse import parse_qs, urlparse
            q = {k: v[0] for k, v in parse_qs(urlparse(self.path).query).items()}
            SCENE["pieces"].append({"q": q, "bytes": len(raw), "head": raw[:5].decode("latin-1")})
            self._send(json.dumps({"ok": True, "partNumber": int(q.get("n", "0")),
                                   "etag": "e" + q.get("n", "0")}), "application/json")
            return

        body = json.loads(raw)
        act = body.get("action")
        if act != "me": SCENE["sent"].append(body)

        if act == "me":
            self._send(json.dumps({"ok": True, "account": {
                "email": "islam.saadany@forefront.consulting", "name": "Islam Saadany",
                "isAdmin": True}}), "application/json"); return
        if act == "cards":
            self._send(json.dumps({"ok": True, "cards": [CARD], "canAdd": True,
                                   "canConsultants": True, "canAccess": True}), "application/json"); return
        if act == "library":
            rows = SCENE["items"]
            q = (body.get("q") or "").lower()
            if q: rows = [r for r in rows if q in r["title"].lower()]
            if body.get("category"): rows = [r for r in rows if body["category"] in r["categories"]]
            if body.get("state"): rows = [r for r in rows if r["state"] == body["state"]]
            self._send(json.dumps({"ok": True, "items": rows, "categories": CATS,
                                   "kind": body.get("kind"), "places": PLACES}), "application/json"); return
        if act == "librarySeen":
            # The server narrows the list to places this client HAS (§42), so
            # the stub does too — or the check would prove the panel can send
            # a word the product would drop.
            known = [x["at"] for x in PLACES]
            seen = body.get("seen")
            seen = None if not isinstance(seen, list) else [k for k in known if k in seen]
            hit = [r for r in SCENE["items"] if r["id"] == body.get("id")]
            if not hit:
                self._send(json.dumps({"ok": False, "error": "That report is not there any more."}),
                           "application/json", 404); return
            hit[0]["seen"] = seen
            hit[0]["seenLabel"] = label_for(seen)
            self._send(json.dumps({"ok": True, "item": hit[0]}), "application/json"); return
        if act == "librarySave":
            it = item(id=body.get("id") or "new-1", title=body.get("title", ""),
                      summary=body.get("summary", ""), categories=body.get("categories") or [],
                      reportDate=body.get("reportDate") or "")
            was = [r for r in SCENE["items"] if r["id"] == it["id"]]
            if was: it.update({k: was[0][k] for k in ("hasFile", "fileName", "sizeLabel", "version", "state", "downloads")})
            SCENE["items"] = [r for r in SCENE["items"] if r["id"] != it["id"]] + [it]
            self._send(json.dumps({"ok": True, "item": it}), "application/json"); return
        if act == "libraryState":
            for r in SCENE["items"]:
                if r["id"] == body.get("id"):
                    r["state"] = body.get("state")
                    r["publishedAt"] = "2026-09-04T00:00:00.000Z" if r["state"] == "published" else ""
                    r["publishedBy"] = "islam.saadany@forefront.consulting" if r["state"] == "published" else ""
                    self._send(json.dumps({"ok": True, "item": r}), "application/json"); return
            self._send(json.dumps({"ok": False, "error": "gone"}), "application/json", 404); return
        if act == "libraryUploadBegin":
            if not SCENE["store"]:
                # THE STUB SAYS WHAT THE SERVER SAYS (§100.3, §374). This held
                # "There is no file store set up yet", which the server stopped
                # producing once the sentence began naming WHICH half is missing
                # — the software or the key — so the assertion below was reading
                # this file's own literal back rather than anything the product
                # does. lib/blob-api.ts's storeWhy() is the one answer; this is
                # its software half, which is the one that shipped.
                self._send(json.dumps({"ok": False, "error":
                    "The software for the file store is not in this deployment, "
                    "so a report cannot be uploaded. "
                    "Everything else about the library works."}), "application/json", 503); return
            self._send(json.dumps({"ok": True, "path": "insights/t/i/f.pdf", "storeKey": "K",
                                   "uploadId": "U", "piece": PIECE}), "application/json"); return
        if act == "libraryUploadFinish":
            for r in SCENE["items"]:
                if r["id"] == body.get("id"):
                    r.update({"hasFile": True, "fileName": body.get("name"),
                              "fileSize": body.get("bytes"), "sizeLabel": "6.0 MB",
                              "version": r["version"] + (1 if r["hasFile"] else 0)})
                    self._send(json.dumps({"ok": True, "item": r}), "application/json"); return
            self._send(json.dumps({"ok": False, "error": "gone"}), "application/json", 404); return
        if act == "libraryDelete":
            SCENE["items"] = [r for r in SCENE["items"] if r["id"] != body.get("id")]
            self._send(json.dumps({"ok": True, "removed": True, "fileRemoved": True}), "application/json"); return
        self._send(json.dumps({"ok": True}), "application/json")

def serve():
    socketserver.TCPServer.allow_reuse_address = True
    srv = socketserver.TCPServer(("127.0.0.1", PORT), Stub)
    threading.Thread(target=srv.serve_forever, daemon=True).start()
    return srv

# ── the falsifications ───────────────────────────────────────────────────
# Applied to the PAGE, because platform.html is hand-written and served as it
# is: there is no build step to make a broken copy through (§276 needs one).
BREAKS = {
  # HELD AND DRAWN AS THOUGH LIVE — the build before §358.12, and the reason
  # Islam asked for the fade. Note it keeps `aria-disabled`, so it reddens the
  # dimming assertion ALONE; `publish-anyway` below removes the attribute and
  # therefore reddens the refusal as well, which is a different fault.
  "held-not-dimmed": """() => {
    const b = Array.from(document.querySelectorAll('.byline .btn'))
      .find(x => /^Publish/.test(x.textContent));
    if (!b) return false;
    b.style.opacity = '1';
    return true;
  }""",
  # A Publish that does not ask whether there is anything to open.
  "publish-anyway": """() => {
    const b = Array.from(document.querySelectorAll('.byline .btn'))
      .find(x => /^Publish/.test(x.textContent));
    if (!b) return false;
    b.removeAttribute('aria-disabled');
    return true;
  }""",
  # Delete offered while the client is still reading it.
  "delete-published": """() => {
    const b = Array.from(document.querySelectorAll('.apart .btn'))
      .find(x => /^Delete/.test(x.textContent));
    if (!b) return false;
    b.disabled = false;
    return true;
  }""",
  # Every row marked, which is the accent spent on the state that needs none.
  "mark-published": """() => {
    const rows = Array.from(document.querySelectorAll('.erow'));
    if (!rows.length) return false;
    rows.forEach(r => {
      if (r.querySelector('.tag')) return;
      const t = document.createElement('span');
      t.className = 'tag none'; t.textContent = 'Published';
      r.appendChild(t);
    });
    return true;
  }""",
}

def press(pg, sel_text, root=""):
    pg.evaluate("""([t, r]) => {
      const scope = r ? document.querySelector(r) : document;
      const b = Array.from(scope.querySelectorAll('button')).find(x => x.textContent.trim() === t);
      if (!b) throw new Error('no button: ' + t);
      b.click();
    }""", [sel_text, root])

def opens(pg, word):
    """Open the tick panel, and SAY so rather than dying if it does not
    (§215, in a file whose own comment promises every wait degrades).

    It is also the one place that can catch §222's fault, which is what it
    was written for: `Done` saves, the save reloads the library, and the
    card is REBUILT — so a press held over that repaint lands on a DETACHED
    node, whose panel is then appended to nothing at all. Every assertion
    about the panel would go on failing with the product behaving perfectly.
    """
    try:
        press(pg, word, ".seen")
        pg.wait_for_selector(".tickpanel", timeout=9000)
        return True
    except Exception as e:
        # THE PRESS IS INSIDE THE TRY, AND THAT IS NOT TIDINESS: `press` throws
        # when the word is not on any button, and the word IS the assertion —
        # a build where All ticks every place says `Change` where this one says
        # `Narrow it…`, which is the fault reported as a stack trace with no
        # failures at all until the throw was caught (§215, twice in one file).
        check("the panel opens when '%s' is pressed" % word, False, str(e).split("\n")[0])
        return False

def done(pg, saves):
    """Press Done and then wait for what that press actually CAUSES.

    A Done that changed something saves, and the save reloads the library and
    replaces the card — so the wait is for the NEW node (stamp the old one and
    watch the stamp go), never for the panel disappearing, which is true the
    instant it closes and a whole repaint too early. A Done that changed
    nothing replaces nothing, which is the point of it, so there the panel
    going IS the whole event.
    """
    if saves:
        pg.evaluate("""() => document.querySelector('.seen').setAttribute('data-was', '1')""")
    press(pg, "Done", ".seen")
    try:
        if saves:
            pg.wait_for_function(
                """() => { const s = document.querySelector('.seen');
                           return s && !s.hasAttribute('data-was'); }""", timeout=9000)
        else:
            pg.wait_for_function("""() => !document.querySelector('.tickpanel')""", timeout=9000)
        return True
    except Exception:
        check("pressing Done closes the panel" + (" and the save lands" if saves else ""),
              False, "the panel stayed open, or the card was never redrawn")
        return False

def run():
    serve()
    exe = os.environ.get("SMP_CHROME")
    with sync_playwright() as p:
        b = p.chromium.launch(executable_path=exe) if exe else p.chromium.launch()
        pg = b.new_page(viewport={"width": 1440, "height": 1000})
        errs = []
        pg.on("pageerror", lambda e: errs.append(str(e)))

        # EVERY WAIT DEGRADES (§215, in a file that presses thirty controls):
        # on a build with no room at all, Playwright waits thirty seconds and
        # then throws a stack trace with nothing reported — which reads as a
        # broken check rather than a missing feature.
        def open_room():
            pg.goto(BASE + "/platform")
            # A REAL card, never a bare `.ccard` (§371): the console draws three
            # PLACEHOLDER cards while it waits for the answer, and they carry no
            # client, no name and no module rows — so waiting on `.ccard` is
            # waiting for the skeleton and finding the room a beat too early.
            pg.wait_for_selector(".ccard[data-client]", timeout=9000)
            got = pg.evaluate("""() => {
              const r = document.querySelector('.mrow[data-module="insights"]');
              if (!r) return false;
              r.click(); return true;
            }""")
            if not got:
                check("the client's card carries a row for Insights", False,
                      "no .mrow[data-module=insights] — is this a build before spec 053?")
                raise SystemExit(1)
            try:
                pg.wait_for_selector(".ptitle h1", timeout=9000)
            except Exception:
                check("pressing it opens the publishing room", False,
                      "the row was pressed and no room was drawn")
                raise SystemExit(1)

        # ══ 1 · the way in, and an empty library ════════════════════════
        print("\n1 · the room, and a client with nothing published")
        SCENE["items"] = []; SCENE["sent"] = []
        open_room()
        shape = pg.evaluate("""() => ({
          title: document.querySelector('.ptitle h1').textContent,
          client: (document.querySelector('.ptitle .tag') || {}).textContent,
          empty: (document.querySelector('.muted') || {}).textContent || '',
          add: !!Array.from(document.querySelectorAll('.ptitle button'))
                 .find(x => /Publish a report/.test(x.textContent)),
          rows: document.querySelectorAll('.erow').length,
          href: location.pathname
        })""")
        check("the module's row opens the room rather than the client's page",
              shape["href"] == "/platform" and shape["title"] == "Insights", shape)
        check("...and it says which client it is publishing to", shape["client"] == "Raya Trade", shape)
        check("an empty library SAYS so rather than drawing an empty list (§45.2)",
              "Nothing has been published" in shape["empty"] and "Raya Trade" in shape["empty"], shape)
        check("...and the way to put the first one up is on it (§61)", shape["add"], shape)
        asked = [s for s in SCENE["sent"] if s.get("action") == "library"]
        check("the list is the SERVER's answer, asked for this client and this kind",
              len(asked) == 1 and asked[0]["key"] == "raya-trade" and asked[0]["kind"] == "insights", asked)

        # ══ 2 · writing one, and what the page SENDS ════════════════════
        print("\n2 · a new report — what is typed is what is posted (§96)")
        SCENE["sent"] = []
        press(pg, "Publish a report", ".ptitle")
        pg.wait_for_selector(".ecard", timeout=9000)
        pg.fill("#lib-title", "Governance Review: Board Reporting Practice")
        pg.fill("#lib-sum", "How the quarterly pack is assembled today.")
        pg.fill("#lib-date", "2026-09-04")
        pg.evaluate("""() => Array.from(document.querySelectorAll('.catpick'))
          .filter(c => ['Macro','Governance'].includes(c.textContent))
          .forEach(c => c.click())""")
        lit = pg.evaluate("""() => Array.from(document.querySelectorAll('.catpick'))
          .filter(c => c.getAttribute('aria-pressed') === 'true').map(c => c.textContent)""")
        check("a category chip lights when pressed", lit == ["Macro", "Governance"], lit)
        if BREAK in BREAKS: pg.evaluate(BREAKS[BREAK])
        held = pg.evaluate("""() => {
          const b = Array.from(document.querySelectorAll('.byline .btn'))
            .find(x => /^Publish/.test(x.textContent));
          const f = Array.from(document.querySelectorAll('.filestrip .btn'))[0];
          const sv = Array.from(document.querySelectorAll('.byline .btn'))
            .find(x => /^Save/.test(x.textContent));
          return { pubHeld: b.getAttribute('aria-disabled'), pubWhy: b.title,
                   fileOff: f.disabled, fileWhy: (document.querySelector('.filestrip .fname')||{}).textContent,
                   pubDim: getComputedStyle(b).opacity, pubCursor: getComputedStyle(b).cursor,
                   saveDim: sv ? getComputedStyle(sv).opacity : null };
        }""")
        # §358 REWRITTEN, NEVER LOOSENED (§218, §214.3). Both of these asserted
        # the two-step: Publish held because nothing was SAVED, and the file
        # control switched off saying "Save it first". Attaching is the
        # ordinary act now and saving a draft is one of two ways of FINISHING,
        # so what must hold is the opposite on one line and NARROWER on the
        # other — the one refusal that survives is about the report rather
        # than about the machinery. Asserted at BOTH ENDS (§94.2): the file
        # control live, AND Publish still shut, or a build that simply opened
        # everything would pass the half above.
        check("Publish is HELD on a report with nothing to open, and names the FILE",
              held["pubHeld"] == "true" and "Add the file first" in (held["pubWhy"] or ""), held)
        check("...and the file control is LIVE on a report that has never been saved (§358)",
              held["fileOff"] is False and "No file yet" in (held["fileWhy"] or ""), held)
        check("...and nothing on the card tells anybody to go and save something first",
              "Save it first" not in ((held["fileWhy"] or "") + (held["pubWhy"] or "")), held)
        # §358.12: THE HELD BUTTON LOOKS HELD. Islam's A, taken from four drawn
        # side by side and against the recommendation. Measured as PAINT rather
        # than as a class or an attribute (§94.8, §272.8 — a rule can provably
        # match and provably do nothing), and at BOTH ENDS (§94.2): the live
        # button beside it must NOT dim, or a build that faded the whole row
        # would satisfy the half above. The cursor is its own assertion and
        # guards the decision underneath the look — this button is pressable,
        # and pressing it is what names the gap, so a `default` cursor would be
        # the one part of the treatment that is untrue.
        check("...and the held button is DIMMED, while the live one beside it is not (§358.12)",
              float(held["pubDim"] or 1) < 0.9 and float(held["saveDim"] or 0) == 1.0, held)
        check("...and it still says it can be pressed, because pressing it is what names the gap",
              held["pubCursor"] == "pointer", held)
        # AND THE COST IS PRINTED RATHER THAN ASSERTED (§302.3's own device).
        # The fade composites the fill and the words together, so the label
        # falls under the 4.5 floor — which is the decision, not a defect, and
        # asserting it either way would be choosing against Islam or against
        # the floor. Printing it keeps the cost in front of whoever runs this,
        # in both palettes, on every run. Nothing else measures it: the console's
        # contrast sweep walks the three console tabs and the door and never
        # opens a report, so this line is the only place the number appears.
        for pal in ("light", "dark"):
            pg.evaluate("(t) => document.documentElement.setAttribute('data-theme', t)", pal)
            pg.wait_for_timeout(120)
            r = pg.evaluate("""() => {
              const b = Array.from(document.querySelectorAll('.byline .btn'))
                .find(x => /^Publish/.test(x.textContent));
              const px = (v) => v.match(/[\\d.]+/g).slice(0, 3).map(Number);
              const lin = (c) => { c /= 255; return c <= 0.04045 ? c / 12.92
                                 : Math.pow((c + 0.055) / 1.055, 2.4); };
              const L = (c) => 0.2126 * lin(c[0]) + 0.7152 * lin(c[1]) + 0.0722 * lin(c[2]);
              const over = (fg, bg, a) => fg.map((f, i) => Math.round(a * f + (1 - a) * bg[i]));
              const cs = getComputedStyle(b), a = Number(cs.opacity);
              // the card behind it, which is what a faded button composites over
              const ground = px(getComputedStyle(b.closest('.ecard') || document.body).backgroundColor);
              const ink = over(px(cs.color), ground, a), fill = over(px(cs.backgroundColor), ground, a);
              const hi = Math.max(L(ink), L(fill)), lo = Math.min(L(ink), L(fill));
              return Math.round(((hi + 0.05) / (lo + 0.05)) * 100) / 100;
            }""")
            print("       cost of §358.12 · the held label reads %.2f:1 on %s "
                  "(4.5 is the floor) — Islam's, measured" % (r, pal))
        pg.evaluate("() => document.documentElement.removeAttribute('data-theme')")
        press(pg, "Save the draft", ".byline")
        pg.wait_for_function("""() => document.querySelectorAll('.erow').length === 1 ||
          (document.querySelector('.ecard h2')||{}).textContent === 'Governance Review: Board Reporting Practice'""", timeout=9000)
        saved = [s for s in SCENE["sent"] if s.get("action") == "librarySave"]
        check("the press POSTS the report, and posts what was typed into it",
              len(saved) == 1 and saved[0]["title"] == "Governance Review: Board Reporting Practice"
              and saved[0]["summary"].startswith("How the quarterly")
              and saved[0]["reportDate"] == "2026-09-04", saved)
        check("...including the categories, which are the one list the server sent",
              len(saved) == 1 and saved[0]["categories"] == ["Macro", "Governance"], saved)
        check("...and no state, because saving a draft is not publishing it",
              not [s for s in SCENE["sent"] if s.get("action") == "libraryState"], SCENE["sent"])

        # ══ 3 · the file, in pieces ═════════════════════════════════════
        print("\n3 · the file — in pieces, every one of them named")
        SCENE["sent"] = []; SCENE["pieces"] = []
        pg.evaluate("""() => {
          const r = document.querySelector('.erow'); if (r) r.click();
        }""")
        pg.wait_for_selector(".ecard", timeout=9000)
        # 6.5MB of PDF: three pieces at 3MB, so the loop is exercised rather
        # than asserted (a one-piece file passes on a build that ignores the
        # size entirely).
        pg.set_input_files(".filestrip input[type=file]", {
            "name": "raya-governance-review-sep26.pdf",
            "mimeType": "application/pdf",
            "buffer": b"%PDF-1.7\n" + b"x" * (6 * 1024 * 1024 + 512 * 1024)})
        pg.wait_for_function("""() => !!document.querySelector('.filestrip .fname') &&
          /raya-governance/.test(document.querySelector('.filestrip .fname').textContent)""", timeout=20000)
        began = [s for s in SCENE["sent"] if s.get("action") == "libraryUploadBegin"]
        fin = [s for s in SCENE["sent"] if s.get("action") == "libraryUploadFinish"]
        ns = [int(x["q"]["n"]) for x in SCENE["pieces"]]
        check("the upload begins on the server, naming the file's own size",
              len(began) == 1 and began[0]["bytes"] > 6 * 1024 * 1024, began)
        check("the file goes in PIECES, in order, from one (§261: a function refuses a big body)",
              ns == [1, 2, 3], ns)
        check("...and no piece is bigger than the size the server named",
              all(x["bytes"] <= PIECE for x in SCENE["pieces"]),
              [x["bytes"] for x in SCENE["pieces"]])
        check("every piece carries the client, the report and the upload it belongs to",
              all(x["q"].get("client") == "raya-trade" and x["q"].get("id")
                  and x["q"].get("storeKey") == "K" and x["q"].get("uploadId") == "U"
                  for x in SCENE["pieces"]), SCENE["pieces"][:1])
        check("...and the store's key is NOT sent as `key`, which is the client's (§87's twins)",
              all("key" not in x["q"] for x in SCENE["pieces"]), SCENE["pieces"][:1])
        check("the first piece is the file's own first bytes, so the server can tell it is a PDF",
              SCENE["pieces"][0]["head"] == "%PDF-", SCENE["pieces"][0]["head"])
        check("finishing hands back every part, and the store key under its own name",
              len(fin) == 1 and [p["partNumber"] for p in fin[0]["parts"]] == [1, 2, 3]
              and fin[0].get("storeKey") == "K" and fin[0].get("uploadId") == "U", fin)
        strip = pg.evaluate("""() => (document.querySelector('.filestrip .fname')||{}).textContent""")
        check("...and the strip then says which file it is", "raya-governance" in strip, strip)

        # ══ 4 · publishing, and what it opens ═══════════════════════════
        print("\n4 · publishing it, and taking it back")
        SCENE["sent"] = []
        free = pg.evaluate("""() => {
          const b = Array.from(document.querySelectorAll('.byline .btn'))
            .find(x => /^Publish/.test(x.textContent));
          return { held: b.getAttribute('aria-disabled'), word: b.textContent };
        }""")
        check("with a file on it, Publish is free — and names the client it goes to",
              free["held"] is None and "Raya Trade" in free["word"], free)
        press(pg, "Publish to Raya Trade", ".byline")
        pg.wait_for_function("""() => !!Array.from(document.querySelectorAll('.byline .nm'))
          .find(x => /^Published to/.test(x.textContent))""", timeout=9000)
        st = [s for s in SCENE["sent"] if s.get("action") == "libraryState"]
        check("publishing POSTS the state, named rather than implied",
              len(st) == 1 and st[0]["state"] == "published" and st[0]["key"] == "raya-trade", st)
        after = pg.evaluate("""() => ({
          nm: (document.querySelector('.byline .nm')||{}).textContent,
          tags: Array.from(document.querySelectorAll('.etags .tag')).map(t => t.textContent),
          withdraw: !Array.from(document.querySelectorAll('.apart .btn'))
            .find(x => x.textContent === 'Withdraw').disabled,
          del: !Array.from(document.querySelectorAll('.apart .btn'))
            .find(x => /^Delete/.test(x.textContent)).disabled,
          delWhy: Array.from(document.querySelectorAll('.apart .em')).map(e => e.textContent)
        })""")
        check("a published report says so, and drops the Draft mark (§41's budget)",
              after["nm"].startswith("Published to") and "Draft" not in after["tags"], after)
        check("Withdraw is what is offered on it", after["withdraw"], after)
        # A NAME AND ITS SENTENCE ARE TWO LINES, measured as PAINT rather than
        # as markup. The first build of this card wrote them as spans, copying
        # `.byline`'s shape into `.teamrow`, which is not a flex column — so
        # the row read "WithdrawLeaves Raya Trade's library" and every
        # assertion above was green (§311, §96: a run-together line renders
        # perfectly). Found by looking at it.
        lines = pg.evaluate("""() => Array.from(document.querySelectorAll('.apart .teamrow')).map(r => {
          const n = r.querySelector('.nm'), e = r.querySelector('.em');
          if (!n || !e) return null;
          const a = n.getBoundingClientRect(), b = e.getBoundingClientRect();
          return { same: Math.abs(a.top - b.top) < 2, nm: n.textContent };
        })""")
        check("a row's name sits above its sentence rather than running into it (§311)",
              lines and all(l and not l["same"] for l in lines), lines)
        if BREAK in BREAKS: pg.evaluate(BREAKS[BREAK])
        blocked = pg.evaluate("""() => !Array.from(document.querySelectorAll('.apart .btn'))
          .find(x => /^Delete/.test(x.textContent)).disabled""")
        check("Delete is REFUSED while the client is still reading it — and says why",
              not blocked and any("Withdraw first" in e for e in after["delWhy"]), after)
        if SHOT: pg.screenshot(path=SHOT, full_page=True)

        # ══ 5 · the way back, and deleting ══════════════════════════════
        print("\n5 · withdrawing, then deleting")
        SCENE["sent"] = []
        press(pg, "Withdraw", ".apart")
        pg.wait_for_function("""() => Array.from(document.querySelectorAll('.etags .tag'))
          .some(t => t.textContent === 'Draft')""", timeout=9000)
        back = [s for s in SCENE["sent"] if s.get("action") == "libraryState"]
        check("withdrawing POSTS the draft state, and the card says Draft again",
              len(back) == 1 and back[0]["state"] == "draft", back)
        ready = pg.evaluate("""() => !Array.from(document.querySelectorAll('.apart .btn'))
          .find(x => /^Delete/.test(x.textContent)).disabled""")
        check("...and Delete is only then free, which is the guard rather than a second question (§323)",
              ready, ready)
        SCENE["sent"] = []
        press(pg, "Delete…", ".apart")
        pg.wait_for_selector(".apart .wzask", timeout=9000)
        asks = pg.evaluate("""() => ({
          names: (document.querySelector('.apart .wzask b')||{}).textContent,
          goes: (document.querySelector('.apart .wzask .goes')||{}).textContent,
          sentYet: true
        })""")
        check("the question is asked where the button was, and it NAMES the report (§323)",
              "Governance Review" in (asks["names"] or ""), asks)
        check("...and says what goes with it", "file goes with it" in (asks["goes"] or ""), asks)
        check("...and nothing has been posted yet", not SCENE["sent"], SCENE["sent"])
        press(pg, "Delete it", ".apart")
        pg.wait_for_function("""() => document.querySelectorAll('.erow').length === 0 &&
          !document.querySelector('.ecard')""", timeout=9000)
        gone = [s for s in SCENE["sent"] if s.get("action") == "libraryDelete"]
        check("deleting POSTS it, and lands back on the list (§144)",
              len(gone) == 1 and gone[0]["id"], gone)

        # ══ 6 · the list, and its three empty states ════════════════════
        print("\n6 · the list — a filter's empty state is not the library's (§105)")
        SCENE["items"] = [item(id="a", title="FX and Import Cost Exposure", categories=["Macro"],
                               state="published", hasFile=True, sizeLabel="1.2 MB", downloads=4),
                          item(id="b", title="Modern Trade Channel Share", categories=["Market"],
                               state="draft", hasFile=True, sizeLabel="3.8 MB")]
        SCENE["sent"] = []
        open_room()
        if BREAK in BREAKS: pg.evaluate(BREAKS[BREAK])
        rows = pg.evaluate("""() => Array.from(document.querySelectorAll('.erow')).map(r => ({
          title: (r.querySelector('h3')||{}).textContent,
          tag: (r.querySelector('.tag')||{}).textContent || '',
          facts: (r.querySelector('.facts')||{}).textContent || ''
        }))""")
        check("both reports are on the list", len(rows) == 2, rows)
        check("only the DRAFT wears a mark — published is the ordinary state (§41)",
              [r["tag"] for r in rows] == ["", "Draft"], rows)
        check("a published row says how it has done; a draft says it has not gone out",
              "4 downloads" in rows[0]["facts"] and "not published" in rows[1]["facts"], rows)
        pg.fill(".filters input[type=search]", "nothing at all")
        pg.evaluate("""() => document.querySelector('.filters input[type=search]').dispatchEvent(new Event('change'))""")
        pg.wait_for_function("""() => !!document.querySelector('.muted')""", timeout=9000)
        said = pg.evaluate("""() => document.querySelector('.muted').textContent""")
        check("a search that matches nothing describes THE SEARCH, not the library (§105)",
              "No reports match" in said and "Nothing has been published" not in said, said)

        # ══ 7 · no file store ═══════════════════════════════════════════
        print("\n7 · with no file store, the rest of the library still works")
        SCENE["store"] = False
        SCENE["items"] = [item(id="c", title="A report with no file yet")]
        # BOTH records are cleared, and the second one had to be learnt: the
        # first run of this section read §3's three pieces and reported a
        # correct build broken (§100.3 — a probe measuring its own earlier
        # state). An assertion that nothing was sent is only an assertion if
        # nothing could have been sent before it.
        SCENE["sent"] = []; SCENE["pieces"] = []
        open_room()
        pg.evaluate("""() => document.querySelector('.erow').click()""")
        pg.wait_for_selector(".ecard", timeout=9000)
        pg.set_input_files(".filestrip input[type=file]", {
            "name": "x.pdf", "mimeType": "application/pdf", "buffer": b"%PDF-1.7\nx"})
        pg.wait_for_selector(".err", timeout=9000)
        told = pg.evaluate("""() => ({
          err: document.querySelector('.err').textContent,
          btn: Array.from(document.querySelectorAll('.filestrip .btn'))[0].textContent,
          pieces: 0
        })""")
        check("a store that is not there is said in words, and names WHICH half "
              "is missing rather than 'not set up' (§171, §374)",
              "file store" in told["err"]
              and ("software" in told["err"] or "key" in told["err"]), told)
        check("...and it says the rest of the library still works", "Everything else" in told["err"], told)
        check("...and the control goes back to what it was, rather than staying on 'Sending…'",
              told["btn"] in ("Add the file", "Replace"), told)
        check("...and not one piece was sent", not SCENE["pieces"], SCENE["pieces"])
        SCENE["store"] = True

        # ══ 8 · who can see one report ══════════════════════════════════
        # Spec 046 §4.10, reversing decision 15. EVERY ASSERTION READS WHAT THE
        # PAGE SENT (§96): a panel that ticks beautifully and posts nothing
        # renders identically to one that works, and the client's side — where
        # the report would simply never disappear — is no louder.
        print("\n8 · who can see one report (spec 046 §4.10)")
        SCENE["items"] = [item(id="a", title="Everyone Outlook", state="published"),
                          item(id="b", title="FX Cost Exposure", state="published",
                               seen=["fn:finance"], seenLabel="1 department"),
                          item(id="c", title="Staged Governance Review", state="published",
                               seen=[], seenLabel="Nobody")]
        SCENE["sent"] = []
        open_room()
        marks = pg.evaluate("""() => Array.from(document.querySelectorAll('.erow')).map(r => ({
          title: (r.querySelector('h3')||{}).textContent,
          tags: Array.from(r.querySelectorAll('.tag')).map(t => ({ t: t.textContent, c: t.className })),
          hover: Array.from(r.querySelectorAll('.tag')).map(t => t.title || '')
        }))""")
        # ONLY THE EXCEPTION CARRIES A MARK — the Draft tag's own rule, and the
        # everyone row is asserted BESIDE the other two or "the narrowed one is
        # marked" is equally true of a build that marks everything (§94.2).
        check("a report everyone can see wears no mark at all",
              marks[0]["tags"] == [], marks[0])
        check("...a narrowed one says how many", 
              [t["t"] for t in marks[1]["tags"]] == ["1 department"], marks[1])
        check("...and one nobody can open wears the alarm, which the other two do not",
              marks[2]["tags"][0]["t"] == "Nobody" and "shut" in marks[2]["tags"][0]["c"]
              and all("shut" not in t["c"] for t in marks[1]["tags"]), marks)
        # AND IT TAKES NO ACCENT, found by drawing it: amber beside the amber
        # Draft tag put two meanings in one colour in one slot (§87's twins).
        check("the narrowed mark is the plain tag, so it cannot be read as a Draft",
              marks[1]["tags"][0]["c"].strip() == "tag", marks[1]["tags"][0]["c"])
        check("the names are on the hover, because the row has no width for three (§88)",
              marks[1]["hover"][0] == "Finance (function)", marks[1]["hover"])

        pg.evaluate("""() => Array.from(document.querySelectorAll('.erow'))
          .find(r => /Everyone Outlook/.test(r.textContent)).click()""")
        pg.wait_for_selector(".ecard .seen", timeout=9000)
        strip = pg.evaluate("""() => ({
          says: document.querySelector('.seen .who').textContent,
          btn: document.querySelector('.seen .sp button').textContent,
          panel: !!document.querySelector('.tickpanel'),
          note: Array.from(document.querySelectorAll('.ecard .note')).map(n => n.textContent).join(' ')
        })""")
        check("a report nobody has narrowed says EVERYONE, and names the client",
              "Everyone at Raya Trade" in strip["says"], strip)
        check("...and the word on the control says it only ever takes people away",
              strip["btn"] == "Narrow it…", strip)
        check("...and no panel is open until it is asked for", not strip["panel"], strip)
        check("THERE IS NO ON/OFF BESIDE IT — the absence of a list IS everyone (§110's pair)",
              pg.evaluate("""() => !document.querySelector('.ecard .minisw, .ecard input[type=checkbox]')"""))

        if not opens(pg, "Narrow it…"): raise SystemExit(1)
        panel = pg.evaluate("""() => ({
          groups: Array.from(document.querySelectorAll('.ticklist .gp')).map(g => g.textContent),
          rows: Array.from(document.querySelectorAll('.tick')).map(t => t.textContent.trim()),
          on: Array.from(document.querySelectorAll('.tick[aria-pressed="true"]')).length,
          links: Array.from(document.querySelectorAll('.tickhead .lnk')).map(l => l.textContent),
          foot: document.querySelector('.tickfoot').textContent,
          search: !!document.querySelector('.tickhead input[type=search]'),
          drawn: Array.from(document.querySelectorAll('.tick .bx svg')).length
        })""")
        check("the list is the client's units and then its functions",
              panel["groups"] == ["Business units", "Supporting functions"], panel["groups"])
        check("...and a unit called Care and a function called Care are told apart (§65)",
              panel["rows"] == ["Mobile", "Care", "Finance (function)", "Care (function)"], panel["rows"])
        check("nothing is ticked on a report everyone can see, which is not the same as all ticked",
              panel["on"] == 0, panel["on"])
        check("it is searchable, with All and None", panel["search"] and panel["links"] == ["All", "None"], panel)
        # THE TICK IS DRAWN, never a text character: the mark is outside the
        # latin subsets this platform embeds and would ship as a blank box
        # (§52, §120.2, §130.1).
        check("every tick is a drawn mark rather than a font character",
              panel["drawn"] == 4, panel["drawn"])
        check("...and the panel SAYS that All is not every tick, rather than leaving it to be found",
              "including a department added later" in panel["foot"], panel["foot"])

        # TICKING ONE STARTS THE LIST AT THAT ONE, never at everything-minus-one.
        pg.evaluate("""() => document.querySelector('.tick[data-at="fn:finance"]').click()""")
        done(pg, True)
        sent = [x for x in SCENE["sent"] if x.get("action") == "librarySeen"]
        check("ticking one place and pressing Done POSTS exactly that place (§96)",
              len(sent) == 1 and sent[0]["seen"] == ["fn:finance"] and sent[0]["id"] == "a", sent)

        # AND `All` REMOVES THE KEY. This is the one that would have bitten in
        # six months: a list of today's four places EXCLUDES a unit made next
        # month, silently, and nobody would connect the two.
        SCENE["sent"] = []
        if not opens(pg, "Change"): raise SystemExit(1)
        press(pg, "All", ".tickhead")
        done(pg, True)
        allSent = [x for x in SCENE["sent"] if x.get("action") == "librarySeen"]
        check("All sends NULL — everyone, including a department added later",
              len(allSent) == 1 and allSent[0]["seen"] is None, allSent)

        SCENE["sent"] = []
        if not opens(pg, "Narrow it…"): raise SystemExit(1)
        press(pg, "None", ".tickhead")
        shutSays = pg.evaluate("""() => document.querySelector('.seen .who').textContent""")
        done(pg, True)
        noneSent = [x for x in SCENE["sent"] if x.get("action") == "librarySeen"]
        check("None sends an EMPTY LIST, which is a different row from everyone",
              len(noneSent) == 1 and noneSent[0]["seen"] == [], noneSent)
        check("...and the strip says so in words rather than looking like any other report",
              "Nobody can open this report" in shutSays, shutSays)

        # OPENING IT TO LOOK AND PRESSING DONE WRITES NOTHING (§50.6's habit —
        # a reader that creates what it looked for puts a phantom change into
        # every save, and here it would re-assert who may read something).
        SCENE["sent"] = []
        if not opens(pg, "Change"): raise SystemExit(1)
        done(pg, False)
        check("opening the panel and closing it again writes nothing",
              not [x for x in SCENE["sent"] if x.get("action") == "librarySeen"], SCENE["sent"])

        # THE SEARCH HIDES IN PLACE AND TAKES ITS EMPTY GROUP WITH IT.
        if not opens(pg, "Change"): raise SystemExit(1)
        # ASSERTED AS NODE IDENTITY, NEVER AS A COUNT. A list rebuilt on every
        # keystroke holds exactly the same four rows, so counting them passes
        # on the build this exists to catch — measured, a break that rebuilt
        # the list went green on the count (§113.8). What "in place" means is
        # that the nodes are the SAME nodes, which is also what keeps the box
        # being typed into alive (§35, §108.13).
        pg.evaluate("""() => { document.querySelectorAll('.tick').forEach(t => t.dataset.was = '1');
                               document.querySelector('.tickhead input[type=search]').dataset.was = '1'; }""")
        before = pg.evaluate("""() => document.querySelectorAll('.tick').length""")
        pg.fill(".tickhead input[type=search]", "mob")
        found = pg.evaluate("""() => ({
          rows: Array.from(document.querySelectorAll('.tick')).length,
          kept: Array.from(document.querySelectorAll('.tick')).filter(t => t.dataset.was).length,
          box: !!(document.querySelector('.tickhead input[type=search]') || {}).dataset?.was,
          shown: Array.from(document.querySelectorAll('.tick')).filter(t => !t.hidden).map(t => t.textContent.trim()),
          groups: Array.from(document.querySelectorAll('.ticklist .gp')).filter(g => !g.hidden).map(g => g.textContent)
        })""")
        check("the search HIDES rather than rebuilding — the same rows, not four new ones (§35)",
              found["rows"] == before == 4 and found["kept"] == 4, [before, found])
        check("...and the box being typed into is the box that was there", found["box"], found)
        check("...and it shows what matches", found["shown"] == ["Mobile"], found["shown"])
        check("...and a group with nothing left in it goes with its rows",
              found["groups"] == ["Business units"], found["groups"])

        # ══ 9 · attaching on a report nobody saved (§358) ═════════════
        print("\n9 · one press: the draft is saved, then the file is sent (§358)")
        SCENE["items"] = []; SCENE["sent"] = []; SCENE["pieces"] = []
        open_room()
        press(pg, "Publish a report", ".ptitle")
        pg.wait_for_selector(".ecard", timeout=9000)

        # THE TITLE IS THE ONE THING THAT MUST BE THERE, and it is asserted
        # FIRST: if attaching with an empty title posted anything at all it
        # would put a row nobody can pick out of the list into the library,
        # which is the one cost this flow must not have.
        pg.set_input_files(".filestrip input[type=file]", {
            "name": "untitled.pdf", "mimeType": "application/pdf", "buffer": b"%PDF-1.7\nx"})
        pg.wait_for_selector(".err", timeout=9000)
        # NOTHING ABOUT THE REPORT, never "nothing at all": opening the room
        # is three reads of its own, so a bare `not SCENE["sent"]` fails on a
        # build behaving perfectly — which is what it did the first time it
        # was run (§100.3).
        posted = [x.get("action") for x in SCENE["sent"]
                  if x.get("action") in ("librarySave", "libraryUploadBegin", "libraryUploadFinish")]
        check("attaching with no title says so, and posts nothing about the report",
              "needs a title" in pg.evaluate("() => document.querySelector('.err').textContent")
              and not posted, SCENE["sent"])
        check("...and it puts the cursor in the one box that is missing (§61)",
              pg.evaluate("() => document.activeElement && document.activeElement.id") == "lib-title")

        SCENE["sent"] = []; SCENE["pieces"] = []
        pg.fill("#lib-title", "Suppliers under the new tariff")
        pg.fill("#lib-sum", "What the March schedule does to landed cost.")
        pg.set_input_files(".filestrip input[type=file]", {
            "name": "suppliers-tariff.pdf", "mimeType": "application/pdf",
            "buffer": b"%PDF-1.7\n" + b"x" * 4096})
        # EVERY WAIT IN THIS SECTION DEGRADES (§215, and this file's own
        # docstring promises it). On a build that still makes you save first
        # the strip never names the file, and a bare wait_for_function throws
        # a stack trace with NOTHING reported — which is what the first
        # falsification run of this section did, printing no failures on
        # precisely the build it exists to catch.
        def waited(fn, why, ms=20000):
            try:
                pg.wait_for_function(fn, timeout=ms); return True
            except Exception:
                check(why, False, "waited %dms and it never happened" % ms); return False

        waited("""() => !!document.querySelector('.filestrip .fname') &&
          /suppliers-tariff/.test(document.querySelector('.filestrip .fname').textContent)""",
               "the strip names the file that was just attached")

        order = [x["action"] for x in SCENE["sent"] if x.get("action")]
        saved8 = [x for x in SCENE["sent"] if x.get("action") == "librarySave"]
        began8 = [x for x in SCENE["sent"] if x.get("action") == "libraryUploadBegin"]
        check("ONE press saves the draft and THEN begins the upload, in that order",
              order[:2] == ["librarySave", "libraryUploadBegin"], order)
        check("...and what it saved is what was typed, never an empty row",
              len(saved8) == 1 and saved8[0]["title"] == "Suppliers under the new tariff"
              and saved8[0]["summary"].startswith("What the March"), saved8)
        check("...and the pieces are addressed to the id that save returned (§48)",
              len(began8) == 1 and began8[0].get("id") == "new-1", began8)
        check("...and the card now says the report exists, rather than 'Not saved yet'",
              "Not saved yet" not in pg.evaluate(
                  "() => (document.querySelector('.byline .who')||{}).textContent || ''"))
        # BOTH ENDS (§94.2): a report that ALREADY has a row must not be saved
        # a second time by attaching — that would overwrite the stored form
        # with whatever happens to be in the boxes on a card somebody only
        # opened to replace the file.
        SCENE["sent"] = []; SCENE["pieces"] = []
        pg.set_input_files(".filestrip input[type=file]", {
            "name": "suppliers-tariff-v2.pdf", "mimeType": "application/pdf",
            "buffer": b"%PDF-1.7\n" + b"y" * 4096})
        waited("""() => !!document.querySelector('.filestrip .fname') &&
          /v2/.test(document.querySelector('.filestrip .fname').textContent)""",
               "the strip names the replacement file")
        check("replacing a file on a saved report posts NO second save",
              not [x for x in SCENE["sent"] if x.get("action") == "librarySave"], SCENE["sent"])

        check("no page error anywhere in the room", not errs, errs[:3])
        b.close()

    print("\n%d passed, %d failed" % (len(passes), len(fails)))
    if fails:
        print("\nWhat failed:")
        for f in fails: print("  · " + f)
    sys.exit(1 if fails else 0)

run()
