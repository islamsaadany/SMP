"""A DISMISS FOR EVERY ATTENTION ITEM, ON THE BOX IT IS ABOUT (§190).

Islam: "attention items that stays attention item is a problem — always give me
the option to dismiss, and make generally the dismiss under the box with the
issue and mark the issue box with some sort of surrounding outline to make sure
I understand what is the issue."

WHAT THIS ASSERTS THAT NOTHING ELSE DOES. `people-dialog.py` proves the queue
opens the person it counted and walks to the next; every assertion in it passes
on a build where each item is a life sentence. This asks the three questions the
ask was made of:

  · every kind can be answered — and `said`, which had its own answer since
    §180, still has exactly ONE control rather than two (§53.5);
  · the sentence sits on the box that answers it, and the box is PAINTED as
    outstanding rather than merely wearing a class (§145.14: a class assertion
    goes green on a build where the ring renders as nothing);
  · a dismissal is one act across the queue, the count and the button, because
    they are one list (§116.2) — and it REMEMBERS WHAT IT ANSWERED, so moving
    the seat that was dismissed brings the item straight back. That last one is
    the whole reason a dismiss is safe to give at all: §186 exists to catch a
    seat nobody meant to give, and a press that silenced the next one too would
    be a hole dressed as a convenience.

BOTH ENDS EVERY TIME (§113.8): a person with nothing outstanding wears no ring
and offers no Dismiss, or a build that outlined every field would pass.

THE STATE IS MADE (§94.2). The demo tenant produces exactly one kind of item on
its own, so five of the six would ship unexercised.

OVER HTTP, because two kinds come from the server (§94.11).
"""
import json
import os
import pathlib
import http.server
import socketserver
import threading

from playwright.sync_api import sync_playwright

ROOT = pathlib.Path(__file__).resolve().parents[3]
HTML = (ROOT / "SMP-Project-Folder/src/strategy-management-platform.html").read_bytes()
SEED = json.loads((ROOT / "db/seed-state.json").read_text())
PERSON = {"key": "smo", "name": "Mohamed Essam", "role": "super"}

errs, bad = [], 0


def ck(w, ok, x=""):
    global bad
    if not ok:
        bad += 1
    print(("  ok      " if ok else "  FAIL    ") + w + (("  — " + str(x)) if not ok and x else ""))


class H(http.server.BaseHTTPRequestHandler):
    def log_message(self, *a):
        pass

    def _s(self, c, b, t):
        self.send_response(c)
        self.send_header("Content-Type", t)
        self.send_header("Content-Length", str(len(b)))
        self.end_headers()
        self.wfile.write(b)

    def do_GET(self):
        if self.path.startswith("/api/state"):
            self._s(200, json.dumps({"ok": True, "state": SEED, "person": PERSON}).encode(),
                    "application/json")
            return
        if self.path.startswith("/raya-trade"):
            self._s(200, HTML, "text/html; charset=utf-8")
            return
        self._s(200, b"<!doctype html><title>Sign in</title>", "text/html; charset=utf-8")

    def do_POST(self):
        n = int(self.headers.get("Content-Length") or 0)
        raw = self.rfile.read(n)
        body = {}
        try:
            body = json.loads(raw or b"{}")
        except Exception:
            pass
        # THE ACTION NAMES ARE THE PRODUCT'S, read out of sync.js rather than
        # guessed: `passwordStates` answering under `states`, `declarations`
        # answering under `said`. A stub that answers the wrong key falls
        # through to `{"ok":true}`, the client stores `{}`, and every assertion
        # about those two kinds goes green having measured nothing (§94.5).
        if body.get("action") == "passwordStates":
            # ONE PERSON WITH NONE, chosen by key rather than by position, so
            # the `nopw` case is a named row this file can open (§94.2).
            st = {p["key"]: "set" for p in SEED.get("people", [])}
            st["nopwguy"] = "none"
            self._s(200, json.dumps({"ok": True, "states": st}).encode(), "application/json")
            return
        if body.get("action") == "declarations":
            self._s(200, json.dumps({"ok": True, "said": {"saidguy": "retailstores"}}).encode(),
                    "application/json")
            return
        self._s(200, b'{"ok":true}', "application/json")


srv = socketserver.ThreadingTCPServer(("127.0.0.1", 0), H)
srv.daemon_threads = True
PORT = srv.server_address[1]
threading.Thread(target=srv.serve_forever, daemon=True).start()
URL = "http://127.0.0.1:%d/raya-trade" % PORT

# ── THE STATE, MADE (§94.2) ──────────────────────────────────────────
# Everybody clean first — the demo's people carry no employee numbers at all,
# so without this every one of the 33 is in the queue for `noident` and no
# assertion about a SINGLE kind could be made. Then one row per kind.
MAKE = """()=>{
  PEOPLE.forEach(function(p,i){
    p.empId = 'E' + (1000+i);
    p.email = 'p' + i + '@rayatrade.com';
    delete p.attnOff;
  });
  function add(key, name, at){
    var p = { key:key, name:name, empId:'X'+key, email:key+'@rayatrade.com' };
    PEOPLE.push(p);
    if (at) attachPersonAt(p, at);
    return p;
  }
  var seat = add('seatguy','Seat Guy','mobile');
  seat.role = 'super';                       /* a seat over the group, sitting in a unit */
  var ne = add('noemailguy','Noemail Guy','mobile');
  ne.email = '';
  var ni = add('noidentguy','Noident Guy','mobile');
  ni.email = ''; ni.empId = '';
  add('nopwguy','Nopw Guy','mobile');
  add('saidguy','Said Guy','mobile');
  var a = add('twin1','Sameas Reads','mobile');
  var b = add('twin2','Sameas Reads Two','mobile');
  var d1 = add('dupe1','Dupe One','mobile');
  var d2 = add('dupe2','Dupe Two','mobile');
  d2.email = d1.email;                       /* one address, two rows (§87) */
  paint();
}"""

KINDS = {
    "seatguy": ("seat", "Roles"),
    "noemailguy": ("noemail", "Email"),
    "noidentguy": ("noident", "Emp. ID"),
    "nopwguy": ("nopw", None),
    "saidguy": ("said", "Unit or function"),
    "twin1": ("samename", "Name"),
    "dupe1": ("dupe", "Name"),
}


def land(pg):
    pg.evaluate("try{sessionStorage.setItem('smp.tour.later','1')}catch(e){}")
    pg.goto(URL)
    pg.wait_for_timeout(1900)
    pg.evaluate("()=>document.querySelector('[data-md=\"setup\"]').click()")
    pg.wait_for_timeout(400)
    pg.evaluate("()=>document.querySelector('[data-setupgo=\"people\"]').click()")
    pg.wait_for_timeout(1500)
    pg.evaluate(MAKE)
    pg.wait_for_timeout(900)
    # WAIT FOR THE TWO SERVER FACTS, never for a fixed delay: `nopw` and `said`
    # do not exist until the two fetches land, and a check that asks before
    # they do reports the product as missing two kinds it raises perfectly
    # (§94.5 — the first run of this file did exactly that).
    pg.evaluate("()=>paint()")
    pg.wait_for_function("()=>PWSTATES && !PWSTATES.__error && SAIDWHERE && "
                         "!SAIDWHERE.__error && SAIDWHERE.saidguy", timeout=8000)
    pg.evaluate("()=>paint()")
    pg.wait_for_timeout(400)


def open_person(pg, key):
    pg.evaluate("(k)=>document.querySelector('[data-pmenu=\"'+k+'\"]').click()", key)
    pg.wait_for_timeout(300)
    pg.evaluate("(k)=>document.querySelector('[data-pedit=\"'+k+'\"]').click()", key)
    pg.wait_for_timeout(600)


def close_dialog(pg):
    pg.evaluate("()=>{const b=document.querySelector('[data-pdlg-close]'); if(b) b.click();}")
    pg.wait_for_timeout(600)


def run(pg):
    global bad
    land(pg)

    # ── 1. EVERY KIND IS RAISED, AND EVERY KIND CAN BE ANSWERED ──────
    print("\n1. one item per kind, and each of them has an answer")
    for key, (kind, label) in KINDS.items():
        got = pg.evaluate("(k)=>{var e=attentionOf(personBy(k)); "
                          "return e ? e.why.map(function(w){return w.kind+'|'+(w.at||'');}) : [];}", key)
        ck("%s raises %s" % (key, kind), any(g.split("|")[0] == kind for g in got), got)
        ck("...and it points at %s" % (label or "no field"),
           any(g == kind + "|" + (label or "") for g in got), got)

    for key, (kind, label) in KINDS.items():
        open_person(pg, key)
        rings = pg.evaluate("[...document.querySelectorAll('#modal-b .pdf.attn .pdfl')]"
                            ".map(e=>e.textContent)")
        loose = pg.evaluate("document.querySelectorAll('#modal-b .attnloose .attnsay').length")
        if label:
            ck("%s: the ring is on %s" % (key, label), label in rings, rings)
        else:
            # A KIND NO FIELD ANSWERS IS SAID, NEVER DROPPED — the whole point
            # of the trailing block (§61: an item you cannot see is an item
            # nobody can answer).
            ck("%s: said in a block of its own" % key, loose > 0, loose)
        drops = pg.evaluate("[...document.querySelectorAll('#modal-b [data-attnoff]')]"
                            ".map(e=>e.dataset.attnkind)")
        if kind == "said":
            # §180 ALREADY ANSWERED THIS ONE, in the field itself. Two controls
            # for one act is one too many (§53.5) — so the ring, yes, and a
            # second Dismiss, no.
            ck("said keeps its own Dismiss and gains no second one",
               kind not in drops and
               pg.evaluate("!!document.querySelector('#modal-b [data-dropsaid]')"), drops)
        else:
            ck("%s can be dismissed" % kind, kind in drops, drops)
        close_dialog(pg)

    # ── 2. THE RING IS PAINTED, NOT MERELY CLASSED (§145.14) ─────────
    print("\n2. the outline is a thing you can see")
    open_person(pg, "noemailguy")
    paint = pg.evaluate("""()=>{
      const a = document.querySelector('#modal-b .pdf.attn');
      const p = [...document.querySelectorAll('#modal-b .pdf')].find(e=>!e.classList.contains('attn'));
      if (!a || !p) return null;
      const ca = getComputedStyle(a), cp = getComputedStyle(p);
      const r = a.getBoundingClientRect();
      // THE RING IS WHATEVER PAINTS IT, not a property it was expected to use:
      // it began as a border and had to become an outline, because a border
      // with padding moves the field out of its own grid row (§190). Asked as
      // "is there a ring of some kind, in a real colour" so the assertion
      // survives the next honest way of drawing one (§94.8).
      const bw = Math.max(parseFloat(ca.borderTopWidth)||0,
                          parseFloat(ca.outlineWidth)||0);
      const bc = (parseFloat(ca.outlineWidth)||0) >= 1 ? ca.outlineColor
                                                       : ca.borderTopColor;
      return { bg:ca.backgroundColor, plain:cp.backgroundColor,
               bw:bw, bc:bc, w:r.width, h:r.height };}""")
    ck("there is a ring to measure", bool(paint), paint)
    if paint:
        ck("...its ground differs from an ordinary field's", paint["bg"] != paint["plain"],
           paint["bg"] + " vs " + paint["plain"])
        ck("...it has a ring of its own", paint["bw"] >= 1, paint["bw"])
        ck("...in a real colour", "rgba(0, 0, 0, 0)" not in paint["bc"], paint["bc"])
        ck("...and it is a box, not a hairline", paint["w"] > 60 and paint["h"] > 30, paint)
    # BOTH ENDS: the ordinary fields are NOT outlined, or a build that ringed
    # everything would pass every assertion above (§113.8).
    n_attn = pg.evaluate("document.querySelectorAll('#modal-b .pdf.attn').length")
    n_all = pg.evaluate("document.querySelectorAll('#modal-b .pdf').length")
    ck("only the box with the issue is ringed", 0 < n_attn < n_all, "%d of %d" % (n_attn, n_all))
    close_dialog(pg)

    # ── 3. ONE PRESS, THREE SURFACES (§116.2) ────────────────────────
    print("\n3. the count and the queue are one list")
    before_q = pg.evaluate("attentionQueue().length")
    before_n = pg.evaluate("parseInt(document.querySelector('[data-attn] .attnn').textContent,10)")
    ck("the button carries the queue's own number", before_q == before_n,
       "%s vs %s" % (before_q, before_n))
    open_person(pg, "noemailguy")
    ck("there is a Dismiss to press",
       pg.evaluate("()=>{var b=document.querySelector('#modal-b [data-attnoff]');"
                   "if(b) b.click(); return !!b;}"))
    pg.wait_for_timeout(700)
    ck("the item goes from the person",
       not pg.evaluate("()=>{var e=attentionOf(personBy('noemailguy'));"
                       "return e && e.why.some(function(w){return w.kind==='noemail';});}"))
    ck("...and from the ring",
       not pg.evaluate("!!document.querySelector('#modal-b .pdf.attn')"))
    close_dialog(pg)
    after_q = pg.evaluate("attentionQueue().length")
    after_n = pg.evaluate("parseInt(document.querySelector('[data-attn] .attnn').textContent,10)")
    ck("...and from the queue", after_q == before_q - 1, "%s -> %s" % (before_q, after_q))
    ck("...and the button says the same number", after_q == after_n,
       "%s vs %s" % (after_q, after_n))

    # ── 4. STORED AS AN ABSENCE (§50.6) ──────────────────────────────
    print("\n4. what is stored is what was answered")
    ck("the dismissal rides the person",
       pg.evaluate("()=>{var p=personBy('noemailguy'); return !!(p.attnOff && p.attnOff.noemail);}"))
    ck("...and nobody else carries the key",
       pg.evaluate("()=>PEOPLE.filter(function(p){return p.attnOff;}).length") == 1)
    ck("...and it holds the FACT, not a flag",
       pg.evaluate("()=>{var p=personBy('noemailguy'); return p.attnOff.noemail;}") ==
       "|Xnoemailguy")

    # ── 5. IT REMEMBERS WHAT IT ANSWERED (§186's whole reason) ───────
    print("\n5. dismissing this seat says nothing about the next one")
    open_person(pg, "seatguy")
    ck("the seat has a Dismiss",
       pg.evaluate("()=>{var b=document.querySelector('#modal-b [data-attnoff]');"
                   "if(b) b.click(); return !!b;}"))
    pg.wait_for_timeout(700)
    close_dialog(pg)
    ck("the seat item is answered",
       not pg.evaluate("()=>{var e=attentionOf(personBy('seatguy'));"
                       "return e && e.why.some(function(w){return w.kind==='seat';});}"))
    pg.evaluate("()=>{ attachPersonAt(personBy('seatguy'),'retailstores'); paint(); }")
    pg.wait_for_timeout(700)
    ck("...and moving them brings it straight back",
       pg.evaluate("()=>{var e=attentionOf(personBy('seatguy'));"
                   "return !!(e && e.why.some(function(w){return w.kind==='seat';}));}"))

    # ── 6. BOTH ENDS: a clean row wears nothing (§113.8) ─────────────
    print("\n6. a row with nothing outstanding")
    clean = pg.evaluate("()=>{var c=PEOPLE.filter(function(p){"
                        "return personActive(p) && !attentionOf(p);}); return c.length ? c[0].key : null;}")
    ck("there is a clean row to look at", bool(clean), clean)
    if clean:
        open_person(pg, clean)
        ck("...it wears no ring",
           pg.evaluate("document.querySelectorAll('#modal-b .pdf.attn').length") == 0)
        ck("...and offers no Dismiss",
           pg.evaluate("document.querySelectorAll('#modal-b [data-attnoff]').length") == 0)
        ck("...but still draws its fields",
           pg.evaluate("document.querySelectorAll('#modal-b .pdf').length") > 5)
        close_dialog(pg)


with sync_playwright() as pw:
    br = pw.chromium.launch(executable_path=os.environ.get("SMP_CHROME") or None)
    pg = br.new_page(viewport={"width": 1500, "height": 900})
    pg.on("pageerror", lambda e: errs.append(str(e)))
    pg.on("console", lambda m: errs.append(m.text) if m.type == "error" else None)
    run(pg)
    br.close()

print("\nconsole: " + (("%d — " % len(errs)) + errs[0] if errs else "clean"))
if errs:
    bad += 1
print("\n" + ("ALL OK" if not bad else "%d FAILED" % bad))
raise SystemExit(1 if bad else 0)
