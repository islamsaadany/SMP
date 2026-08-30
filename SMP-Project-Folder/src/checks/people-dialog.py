"""THE REGISTER STOPS BEING A FORM (§116).

Islam's six: keep my column choice and make all-on neat; edit in a dialog not
inline; the declarations become a button at the top that opens the pending
people one after another; adding somebody opens it too; drop the row count and
the quick filters; make the top panel concise.

WHAT THIS FILE ASSERTS THAT NOTHING ELSE DOES. The other register checks now
drive the dialog because that is where the fields are — they would all pass on a
build that had merely MOVED the form. This asks the questions the move was made
to answer:

  · the table writes nothing, at any width and with every column showing;
  · every row is one line, in the state that had never been measured;
  · the queue opens the person it counted, says why, and walks to the next;
  · the dialog is the only thing on screen you can touch.

HALF OF IT IS AN ABSENCE, and each absence is paired with the presence that
makes it mean something (§94.2): no filters BUT a queue, no fields in the table
BUT fields in the dialog, no Add row BUT an Add button that adds.

OVER HTTP, because two of the six only exist on a deployment: the Password
column is `live` and the declarations that feed the queue come from the server,
so over `file://` a build that had lost the queue entirely would go green
(§94.11).
"""
import json
import pathlib
import http.server
import socketserver
import threading

from playwright.sync_api import sync_playwright

ROOT = pathlib.Path(__file__).resolve().parents[3]
HTML = (ROOT / "SMP-Project-Folder/src/strategy-management-platform.html").read_bytes()
SEED = json.loads((ROOT / "db/seed-state.json").read_text())
PERSON = {"key": "smo", "name": "Mohamed Essam", "role": "super"}
SAID = {p["key"]: "retailstores" for p in SEED.get("people", [])[:3]}

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
        if body.get("action") == "passwords":
            # A THIRD OF THEM WITH NONE, so the queue has something real in it
            # from the server rather than only from the state graph.
            st = {p["key"]: ["set", "temporary", "none"][i % 3]
                  for i, p in enumerate(SEED.get("people", []))}
            self._s(200, json.dumps({"ok": True, "states": st}).encode(), "application/json")
            return
        if body.get("action") == "declarations":
            self._s(200, json.dumps({"ok": True, "declarations": SAID}).encode(),
                    "application/json")
            return
        self._s(200, b'{"ok":true}', "application/json")


srv = socketserver.ThreadingTCPServer(("127.0.0.1", 0), H)
srv.daemon_threads = True
PORT = srv.server_address[1]
threading.Thread(target=srv.serve_forever, daemon=True).start()
URL = "http://127.0.0.1:%d/raya-trade" % PORT

ALL_ON = {"fullname": True, "empid": True, "key": True, "title": True, "mainbu": True,
          "bu": True, "email": True, "phone": True, "roles": True, "status": True,
          "password": True}
# REAL-SHAPED VALUES. Over file:// the demo has no addresses at all, and an
# empty column never overflows — which is how the Email column stayed 43% cut
# for as long as it did without a check noticing (§116.5).
REAL = """()=>{PEOPLE.forEach((p,i)=>{
  p.email = p.name.toLowerCase().replace(/[^a-z ]/g,'').trim()
            .split(/ +/).slice(0,2).join('.') + '@rayatrade.com';
  p.phone = '+20 100 1234567';
  p.empId = '1' + String(1000 + i);}); paint();}"""


def land(pg, cols=None):
    pg.evaluate("try{sessionStorage.setItem('smp.tour.later','1')}catch(e){}")
    if cols is None:
        pg.evaluate("()=>localStorage.removeItem('smp.people.columns')")
    else:
        pg.evaluate("(c)=>localStorage.setItem('smp.people.columns',JSON.stringify(c))", cols)
    pg.goto(URL)
    pg.wait_for_timeout(1900)
    pg.evaluate("()=>document.querySelector('[data-md=\"setup\"]').click()")
    pg.wait_for_timeout(400)
    pg.evaluate("()=>document.querySelector('[data-setupgo=\"people\"]').click()")
    pg.wait_for_timeout(1500)
    pg.evaluate(REAL)
    pg.wait_for_timeout(700)


def open_person(pg, key):
    pg.evaluate("(k)=>document.querySelector('[data-pmenu=\"'+k+'\"]').click()", key)
    pg.wait_for_timeout(300)
    pg.evaluate("(k)=>document.querySelector('[data-pedit=\"'+k+'\"]').click()", key)
    pg.wait_for_timeout(600)


def close_dialog(pg):
    pg.evaluate("()=>{const b=document.querySelector('[data-pdlg-close]'); if(b) b.click();}")
    pg.wait_for_timeout(600)


print("the register stops being a form — " + URL)
with sync_playwright() as p:
    b = p.chromium.launch()
    pg = b.new_page(viewport={"width": 1280, "height": 940})
    pg.on("pageerror", lambda e: errs.append("pageerror: " + str(e)))
    pg.on("console", lambda m: errs.append("console: " + m.text) if m.type == "error" else None)
    pg.goto(URL)
    pg.wait_for_timeout(300)

    # ── 1. THE HEADER ────────────────────────────────────────────────
    print("\n1. one row, and what is no longer on it")
    land(pg)
    ck("no quick filters", pg.eval_on_selector_all("[data-tkfilter]", "e=>e.length") == 0)
    ck("no row count", pg.evaluate("!document.querySelector('[data-tkcount]')"))
    ck("the search survived", pg.evaluate("!!document.querySelector('.setuphead [data-tksearch]')"))
    ck("Add someone is in the header", pg.evaluate("!!document.querySelector('[data-padd-open]')"))
    ck("...and the Add ROW is gone",
       pg.eval_on_selector_all(".peoplecfg tr.newrow", "e=>e.length") == 0)
    # NO COUNT AT ALL (122). 116 dropped the second copy of it and kept this
    # one; Islam then asked for the survivor too -- "remove the 77 people
    # active text" -- and the table under the row is the register's size.
    # The badge went with it. Asserted here as well as in register-header.py
    # because this file owns the header's inventory.
    ck("no count line, and no badge",
       pg.evaluate("!document.querySelector('.pcount')") and
       pg.eval_on_selector_all(".setuphead .chip", "e=>e.length") == 0)

    # ── 2. THE TABLE WRITES NOTHING ──────────────────────────────────
    # Every collision this register has had was a control being clicked inside a
    # cell (§110.1, §116.3). This is the assertion that makes all of them
    # impossible, and it is asked at four widths because that is where they bit.
    print("\n2. the table reads, at every width")
    for w in (1600, 1440, 1280, 1100):
        pg.set_viewport_size({"width": w, "height": 940})
        land(pg)
        ck("%d: no input or select in the table" % w,
           pg.evaluate("document.querySelectorAll('.peoplecfg input, .peoplecfg select').length") == 0)
        ck("%d: no Save/Cancel column" % w,
           pg.evaluate("!document.querySelector('.peoplecfg .tk-editcell')"))
    pg.set_viewport_size({"width": 1280, "height": 940})

    # ── 3. NEAT WITH EVERYTHING ON ───────────────────────────────────
    # Islam: "if everything is chosen it needs to stay neat." Measured before
    # this section: 54 values cut, and rows at 51px on 32 of 34 — §88's one-line
    # standard was already broken in the state nobody had measured.
    print("\n3. neat with every column showing")
    for cols, label in ((None, "as chosen"), (ALL_ON, "all on")):
        land(pg, cols)
        heights = pg.evaluate("""()=>{const hs={};
          document.querySelectorAll('.peoplecfg tbody tr').forEach(r=>{
            const h=Math.round(r.getBoundingClientRect().height); hs[h]=(hs[h]||0)+1;});
          return hs;}""")
        ck("%s: every row is the same one line" % label, len(heights) == 1, heights)
        # NOTHING CUT WITHOUT A HOVER — §88's actual contract, which a clipped
        # value satisfies and a clipped value with no title does not.
        ck("%s: nothing is cut without a hover" % label,
           pg.evaluate("""()=>{let bad=0;
             document.querySelectorAll('.peoplecfg tbody td').forEach(td=>{
               td.querySelectorAll('.val,.copyval,b,.mono').forEach(e=>{
                 if(e.scrollWidth>e.clientWidth+1 && !e.title && !td.title) bad++;});});
             return bad;}""") == 0)
    land(pg)
    # AND THE ADDRESS FITS, which is where this whole thread started.
    ck("every address is whole",
       pg.evaluate("""()=>{let cut=0;
         document.querySelectorAll('.peoplecfg .copyval.val').forEach(e=>{
           if(e.scrollWidth>e.clientWidth+1) cut++;});
         return cut;}""") == 0)

    # ── 4. THE DIALOG ────────────────────────────────────────────────
    print("\n4. edit opens the dialog, and it writes")
    open_person(pg, "mobhead")
    ck("it is open", pg.evaluate("!!document.querySelector('#modal-b .pdlg')"))
    ck("the title says who", pg.eval_on_selector("#modal-t", "e=>e.textContent") == "Ashraf Laithy")
    ck("...and the subtitle what they hold",
       "BU owner" in pg.eval_on_selector("#modal-s", "e=>e.textContent"))
    ck("the fields are labelled", pg.eval_on_selector_all("#modal-b .pdfl", "e=>e.length") >= 8)
    # THE ONE QUESTION THAT SEPARATES A FORM FROM A PICTURE OF ONE (§96).
    pg.evaluate("""()=>{const i=document.querySelector('#modal-b [data-ptitle]');
       i.value='Head of Mobile, edited'; i.dispatchEvent(new Event('change',{bubbles:true}));}""")
    pg.wait_for_timeout(300)
    ck("typing writes through", pg.evaluate("personBy('mobhead').title") == "Head of Mobile, edited")
    close_dialog(pg)
    ck("closing repaints the register behind it",
       pg.evaluate("""()=>{const tr=[...document.querySelectorAll('.peoplecfg tbody tr')]
          .find(t=>t.querySelector('[data-pmenu="mobhead"]'));
          return !!tr && tr.innerText.indexOf('edited')>-1;}"""))

    # ── 5. THE QUEUE ─────────────────────────────────────────────────
    print("\n5. the button knows which lines")
    land(pg)
    n = pg.evaluate("attentionQueue().length")
    ck("there is something to answer (%d)" % n, n > 0)
    ck("the button carries that number",
       pg.evaluate("parseInt(document.querySelector('[data-attn] .attnn').textContent,10)") == n)
    pg.evaluate("()=>document.querySelector('[data-attn]').click()")
    pg.wait_for_timeout(700)
    ck("it opens the first of them", pg.evaluate("!!document.querySelector('#modal-b .pdlg')"))
    ck("...says where you are", " of " in pg.eval_on_selector("#modal-s", "e=>e.textContent"))
    ck("...and says WHY, above the fields",
       pg.evaluate("!!document.querySelector('#modal-b .pdband')") and
       len(pg.eval_on_selector("#modal-b .pdband", "e=>e.textContent").strip()) > 20)
    first = pg.evaluate("PDLG.key")
    pg.evaluate("()=>document.querySelector('[data-pdlg-next]').click()")
    pg.wait_for_timeout(700)
    ck("Save & next moves to the next, in the same place",
       pg.evaluate("PDLG && PDLG.key") != first and
       pg.evaluate("!!document.querySelector('#modal-b .pdlg')"))
    ck("...and the counter moved with it",
       pg.eval_on_selector("#modal-s", "e=>e.textContent").startswith("2 of "))
    # THE LAST ONE OFFERS A WAY OUT RATHER THAN A NEXT — a queue whose final
    # step is "next" is one nobody can finish.
    pg.evaluate("()=>{ PDLG.at = PDLG.queue.length - 1; PDLG.key = PDLG.queue[PDLG.at].key;"
                " personDialogPaint(); }")
    pg.wait_for_timeout(400)
    ck("the last one closes rather than continuing",
       pg.evaluate("!document.querySelector('[data-pdlg-next]')") and
       pg.evaluate("!!document.querySelector('[data-pdlg-close]')"))
    close_dialog(pg)

    # A DECLARATION FROM SOMEBODY ALREADY PLACED (§116.9). The queue's
    # "they said" sentence names TWO places, and the second half is only
    # reached when the register has already put them somewhere — so the
    # whole half went unexercised while the row read fine, and a
    # ReferenceError in it waited over HTTP for a client to find (§94.11,
    # §94.2). Both halves are asserted, and that nothing threw.
    said_key = pg.evaluate("""()=>{const p=PEOPLE.filter(x=>personAt(x)
        && personAt(x)!=='fn:finance' && !x.retired)[0]; return p ? p.key : null;}""")
    ck("somebody on the register is already placed", said_key is not None, said_key)
    pg.evaluate("(k)=>{ SAIDWHERE = {}; SAIDWHERE[k]='fn:finance'; paint(); }", said_key)
    pg.wait_for_timeout(600)
    say = pg.evaluate("""(k)=>{const e=attentionQueue().filter(q=>q.key===k)[0];
        if(!e) return null;
        const w=e.why.filter(x=>x.kind==='said')[0]; return w ? w.say : null;}""", said_key)
    ck("a placed person's declaration names both places",
       bool(say) and "They said they work in" in say and "the register says" in say, say)
    ck("...in ONE vocabulary, so a match could not read as a difference",
       bool(say) and say.split("the register says")[1].strip(" .") ==
       pg.evaluate("(k)=>roleWhereLabel(personAt(personBy(k)))", said_key), say)
    pg.evaluate("()=>{ SAIDWHERE = null; paint(); }")
    pg.wait_for_timeout(400)

    # ── 6. ADD ───────────────────────────────────────────────────────
    print("\n6. adding somebody is the same dialog")
    land(pg)
    n0 = pg.evaluate("PEOPLE.length")
    pg.evaluate("()=>document.querySelector('[data-padd-open]').click()")
    pg.wait_for_timeout(600)
    ck("it opens empty", pg.evaluate("!!document.querySelector('#modal-b .pdlg')") and
       pg.evaluate("!document.querySelector('#modal-b [data-prole-open]')"))
    # A NAME IS THE ONE THING NEEDED (§87.3) — and pressing with none must SAY
    # so rather than doing nothing.
    pg.evaluate("()=>document.querySelector('[data-pdlg-add]').click()")
    pg.wait_for_timeout(500)
    ck("with no name it refuses", pg.evaluate("PEOPLE.length") == n0)
    pg.evaluate("""()=>{const i=document.querySelector('#modal-b [data-pname]');
       i.value='Nadia Fouad'; i.dispatchEvent(new Event('change',{bubbles:true}));}""")
    pg.wait_for_timeout(200)
    pg.evaluate("()=>document.querySelector('[data-pdlg-add]').click()")
    pg.wait_for_timeout(700)
    ck("with one it adds them", pg.evaluate("PEOPLE.length") == n0 + 1)
    ck("...under the name that was typed",
       pg.evaluate("!!PEOPLE.filter(function(p){return p.name==='Nadia Fouad';})[0]"))
    ck("...and the dialog closed", pg.evaluate("!PDLG"))
    ck("...and nothing is left holding a draft", pg.evaluate("!NEWDRAFT"))

    # ── 7. THE DIALOG IS THE ONLY THING YOU CAN TOUCH ────────────────
    print("\n7. the page behind is inert")
    land(pg)
    open_person(pg, "mobhead")
    ck("the rail cannot be reached",
       pg.evaluate("""()=>{const r=document.querySelector('.setuprail [data-setupgo="units"]');
          if(!r) return false; const q=r.getBoundingClientRect();
          const h=document.elementFromPoint(Math.round(q.left+q.width/2),
                                            Math.round(q.top+q.height/2));
          return !!h && !!h.closest && !!h.closest('#overlay');}"""))
    pg.keyboard.press("Escape")
    pg.wait_for_timeout(700)
    ck("Escape closes it", pg.evaluate("!PDLG"))
    ck("...and empties the dialog rather than hiding a form in it",
       pg.eval_on_selector("#modal-b", "e=>e.innerHTML.trim()") == "")

    # ── 8 · DISMISSING A DECLARATION (§180) ──────────────────────────
    # The register offered only "Use it", so a claim the SMO DISAGREES with
    # had no reply at all — while the Setup Overview had been saying "accept
    # or dismiss" since §108.10. BOTH ENDS everywhere (§113.8): the answered
    # state must be visibly different AND must stop counting, and the
    # outstanding state must still do both of the things it always did.
    print("\n8. dismissing what somebody said (§180)")
    land(pg)
    dk = pg.evaluate("""()=>{const p=PEOPLE.filter(x=>personAt(x)
        && personAt(x)!=='fn:finance' && !x.retired)[0]; return p ? p.key : null;}""")

    def state(k):
        return pg.evaluate("""(k)=>{const m=document.querySelector('.saidmark');
            return { count:saidWhereCount(),
                     inQueue: attentionQueue().some(e=>e.key===k &&
                        e.why.some(w=>w.kind==='said')),
                     glyph: m ? m.textContent.trim() : null,
                     done: !!(m && m.classList.contains('done')),
                     outstanding: saidOutstanding(personBy(k)),
                     at: saidAt(k), dismissed: saidDismissed(k) };}""", k)

    # OUTSTANDING — the shape a server older than §180 also sends (a string),
    # which is why it is written as one here (§58: read either).
    pg.evaluate("(k)=>{ SAIDWHERE = {}; SAIDWHERE[k]='fn:finance'; paint(); }", dk)
    pg.wait_for_timeout(600)
    a = state(dk)
    ck("outstanding: it is counted and it is in the queue",
       a["count"] == 1 and a["inQueue"] and a["outstanding"], a)
    ck("...and wears the solid ring", a["glyph"] == "\u25ce" and not a["done"], a)

    # BOTH CONTROLS, in the row's own dialog.
    pg.evaluate("(k)=>{PDLG={key:k,mode:'edit'};paint();}", dk)
    pg.wait_for_timeout(600)
    btns = pg.evaluate("""()=>{const n=document.querySelector('#modal-b .saidwhere');
        return n ? [...n.querySelectorAll('button')].map(b=>b.textContent.trim()) : [];}""")
    ck("the dialog offers Use it AND Dismiss", btns == ["Use it", "Dismiss"], btns)

    # DISMISSED — the shape §180's server sends for an answered claim.
    pg.evaluate("(k)=>{ SAIDWHERE = {}; SAIDWHERE[k]={at:'fn:finance',dismissed:'2026-08-30'};"
                " PDLG=null; paint(); }", dk)
    pg.wait_for_timeout(600)
    z = state(dk)
    ck("answered: it stops counting and leaves the queue",
       z["count"] == 0 and not z["inQueue"] and not z["outstanding"], z)
    ck("...but the CLAIM is still on record and readable",
       z["at"] == "fn:finance" and z["dismissed"] is True, z)
    ck("...and the mark is a DIFFERENT GLYPH, not a different colour",
       z["glyph"] == "\u25cc" and z["done"], z)

    # AND THE GLYPH DRAWS (§52, §120.2). A font subset maps far more than it
    # has outlines for, so a mark can be mapped and ship as a blank box —
    # and INK ALONE CANNOT SAY: an absent character renders a hollow
    # rectangle, which has ink of its own. The test is whether the bitmap
    # DIFFERS from the one a guaranteed-absent character produces.
    drawn = pg.evaluate("""()=>{
      const fam=getComputedStyle(document.querySelector('.saidmark')).fontFamily;
      const draw=(ch)=>{const c=document.createElement('canvas');c.width=64;c.height=64;
        const x=c.getContext('2d');x.fillStyle='#000';x.font='48px '+fam;
        x.textBaseline='middle';x.fillText(ch,6,32);
        return x.getImageData(0,0,64,64).data;};
      const tofu=draw('\uE000');
      const test=(ch)=>{const d=draw(ch);let n=0;
        for(let i=3;i<d.length;i+=4) if(Math.abs(d[i]-tofu[i])>24) n++;
        return Math.round(n/40.96)/10;};
      return { dotted:test('\u25CC'), solid:test('\u25CE'), tofu:test('\uE000') };}""")
    ck("both rings are drawn, not tofu boxes",
       drawn["tofu"] < 1.0 and drawn["dotted"] >= 1.0 and drawn["solid"] >= 1.0, drawn)

    # A dismissed claim keeps the way back and loses the way it came.
    pg.evaluate("(k)=>{PDLG={key:k,mode:'edit'};paint();}", dk)
    pg.wait_for_timeout(600)
    btns2 = pg.evaluate("""()=>{const n=document.querySelector('#modal-b .saidwhere');
        return n ? [...n.querySelectorAll('button')].map(b=>b.textContent.trim()) : [];}""")
    ck("once answered, Use it stays and Dismiss goes", btns2 == ["Use it"], btns2)
    pg.evaluate("()=>{ SAIDWHERE = null; PDLG = null; SAIDFAIL = null; paint(); }")
    pg.wait_for_timeout(400)

    ck("no console errors", not errs, errs[:3])
    b.close()

print("\n" + ("all good" if not bad else "%d FAILED" % bad))
raise SystemExit(1 if bad else 0)
