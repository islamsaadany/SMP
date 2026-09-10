"""THE CONTINGENCY FILES (spec 030).

qa-run: own-server — this check SERVES the built file and its own /api/state, and
the state is the subject: a review day set to each of the moments the reminder
speaks at, and a working copy fetched back from `location.pathname`. The served
app cannot be moved through those moments, and `sync.js` is carried into it
verbatim, so the client under test is the same either way (§316.1).

Islam: *"if the platform all is down we need to have a substitue action. so
before the review day I will download all the presnetations with a time stamp.
so in case if things are down I have a backup to adjust to and present from."*

WHAT IS ASSERTED, and why each one can fail.

  1 · THE WHOLE FEATURE IS THE OFFICE'S, at BOTH ENDS (§94.2). The card, the
      banner and the list are drawn for the SMO team and are ABSENT for a unit
      head — and the absence is asked of somebody the shared rule actually
      refuses, not of an empty page. This is Islam's own correction of the
      first drawing, which put the reminder where every viewer would meet it.

  2 · THE REVIEW DAY IS NOT A MEASURING DATE, and that is measured rather than
      promised: every score, benchmark and proration on the page is read
      before and after a review day is set, and has to be byte-identical. If
      this ever fails, the field has grown into the arithmetic and Islam's
      objection — *"more dates will create confusion"* — has come true.

  3 · THE THREE FIELDS WRITE AND CLEAR, read back off the STORED review and
      never off the screen (§96): a box wired to nothing looks identical.
      Clearing DELETES the keys (§50.6), so a cycle that never named a day and
      one whose day was taken away are byte-identical.

  4 · THE REMINDER FIRES AT THE RIGHT MOMENTS AND IN THE RIGHT VOICE. Time is
      moved by moving the review day, never by waiting: quiet at 24 and 12,
      the alarm at 6 and 3, nothing before the first moment, nothing after the
      review has begun, and no *Later* at the last moment.

  5 · EACH PERSON'S REMINDERS END WHEN THAT PERSON HAS BOTH — not when
      somebody else has. Without this it is four nags whatever anybody does,
      and people learn to dismiss it (§190).

  6 · THE WORKING COPY IS A WORKING COPY. Built, then OPENED: the block must
      sit above the platform's own scripts, the copy must come up holding this
      tenant's data, and the page must not error. Asserted by loading it —
      a copy that boots on the baked worked example renders perfectly and is
      the one failure this feature exists to prevent.

  7 · THE SLIDES CARRY THE FIGURES. One PowerPoint per subject, a valid
      package, and the reported numbers actually in it — because the file the
      platform already had (*Download the plan*) is a valid package too and
      carries none, which is the whole reason this was built.

  8 · THE PRESS RECORDS ITSELF, and a failure does NOT. A person told they are
      covered when the download never happened is worse than one told nothing
      (§124).

Run it through the container's Chromium wrapper:
    SMP_CHROME=... python3 qa-run.py checks/contingency.py
`SMP_BUILT` points it at another build (§276), so it can be falsified from the
sources rather than by editing the built file, whose script blocks are silenced
by their own hashes when their bytes change (§238).
"""
import http.server
import json
import os
import pathlib
import re
import socketserver
import threading
import zipfile
import io
import base64

from playwright.sync_api import sync_playwright

ROOT = pathlib.Path(__file__).resolve().parents[3]
HTML = pathlib.Path(os.environ.get("SMP_BUILT") or
                    (ROOT / "SMP-Project-Folder/src/strategy-management-platform.html")).read_bytes()
SW = (ROOT / "sw.js").read_bytes()
BASE = json.loads((ROOT / "db/seed-state.json").read_text())

OFFICE = {"key": "smo", "name": "Mohamed Essam", "role": "super"}
bad = 0
person = dict(OFFICE)


def ck(w, ok, x=""):
    global bad
    if not ok:
        bad += 1
    print(("  ok      " if ok else "  FAIL    ") + w + (("  — " + str(x)) if not ok and x else ""))


def head(t):
    print("\n── " + t)


# §38.5, an eighth time in this file's family: a colour that works as a MARK
# does not always work as TYPE, and the banner puts words on three grounds.
def lum(rgb):
    r, g, b = [int(x) / 255.0 for x in rgb]
    f = lambda c: c / 12.92 if c <= 0.03928 else ((c + 0.055) / 1.055) ** 2.4
    return .2126 * f(r) + .7152 * f(g) + .0722 * f(b)


def ratio(a, b):
    la, lb = lum(a), lum(b)
    hi, lo = max(la, lb), min(la, lb)
    return round((hi + .05) / (lo + .05), 2)


def rgb(s):
    return re.findall(r"\d+", s or "")[:3]


class H(http.server.BaseHTTPRequestHandler):
    def log_message(self, *a): pass

    def _s(self, body, ctype="application/json"):
        self.send_response(200)
        self.send_header("Content-Type", ctype)
        self.send_header("Content-Length", str(len(body)))
        self.end_headers()
        self.wfile.write(body)

    def do_GET(self):
        if self.path.startswith("/api/state"):
            self._s(json.dumps({"ok": True, "state": BASE, "person": person}).encode()); return
        if self.path.startswith("/api/auth"):
            self._s(json.dumps({"ok": True, "person": person}).encode()); return
        if self.path.startswith("/sw.js"):
            self._s(SW, "application/javascript"); return
        # BOTH THE PLATFORM AND THE COPY ARE SERVED FROM THE SAME PATH the
        # product asks for: `buildCopy()` fetches `location.pathname`, so a
        # stub that answered the platform anywhere else would be testing a
        # request the product never makes (§100.3).
        if self.path.startswith("/raya-trade"):
            self._s(HTML, "text/html; charset=utf-8"); return
        self._s(b"<!doctype html><title>gate</title>", "text/html; charset=utf-8")

    def do_POST(self):
        n = int(self.headers.get("Content-Length") or 0)
        self.rfile.read(n)
        if self.path.startswith("/api/state"):
            self._s(b'{"ok":true}'); return
        self._s(b'{"ok":true,"unread":0,"threads":[],"chat":{"on":false},"states":{},"said":{}}')


class S(socketserver.ThreadingTCPServer):
    allow_reuse_address = True


srv = S(("127.0.0.1", 0), H)
PORT = srv.server_address[1]
threading.Thread(target=srv.serve_forever, daemon=True).start()
URL = "http://127.0.0.1:%d/raya-trade" % PORT


def js(pg, expr, arg=None):
    """Every probe degrades rather than dying (§215): a build without one of
    these names must REPORT its failures, not print three of forty."""
    try:
        return pg.evaluate(expr, arg) if arg is not None else pg.evaluate(expr)
    except Exception as e:                                        # noqa: BLE001
        return {"threw": str(e).strip().split("\n")[0][:160]}


# The page reads scores off the real functions rather than off rendered text,
# so §2's "nothing moved" is about the arithmetic and not about a layout.
SCORES = """()=>{
  const out = {};
  activeKeys().forEach(k => {
    const u = UNITS[k];
    try { out[k+':obj'] = koScore(u); } catch(e){ out[k+':obj'] = 'x'; }
    try { out[k+':pil'] = unitPillars(u); } catch(e){ out[k+':pil'] = 'x'; }
    try { out[k+':exe'] = unitExec(u); } catch(e){ out[k+':exe'] = 'x'; }
  });
  try { out.elapsed = elapsedMonths(); } catch(e){ out.elapsed = 'x'; }
  try { out.asof = reviewAsOfLabel(); } catch(e){ out.asof = 'x'; }
  return out;
}"""

BANNER = """()=>{
  const el = document.getElementById('contingency');
  if (!el) return { there:false };
  const cs = getComputedStyle(el);
  return {
    there: !el.hidden,
    loud: el.classList.contains('loud'),
    done: el.classList.contains('done'),
    ground: cs.backgroundColor,
    text: (el.innerText||'').replace(/\\n/g,' | ').trim(),
    later: !!el.querySelector('[data-cont-later]'),
    take: !!el.querySelector('[data-cont-take]')
  };
}"""

# Moving the review day is how time moves here: waiting four hours is not a
# check, and a clock the check sets is a clock the product does not read.
SET_DAY = """(h)=>{
  if (h === null) { delete REVIEW.reviewDay; delete REVIEW.reviewAt; paint(); return null; }
  const w = new Date(Date.now() + h*3600000);
  const p = n => (n<10?'0':'')+n;
  REVIEW.reviewDay = w.getFullYear()+'-'+p(w.getMonth()+1)+'-'+p(w.getDate());
  REVIEW.reviewAt  = p(w.getHours())+':'+p(w.getMinutes());
  paint();
  return { day: REVIEW.reviewDay, at: REVIEW.reviewAt, due: SMPRules.remindDue(REVIEW) };
}"""

with sync_playwright() as pw:
    b = pw.chromium.launch(executable_path=os.environ.get("SMP_CHROME"))
    ctx = b.new_context(viewport={"width": 1500, "height": 1000})
    # §167.2: THE WELCOME SCREEN COVERS THE VIEWPORT and intercepts every
    # click, so a check written before it existed reports the product broken.
    # Suppressed as a RETURNING viewer would, in an init script — set after
    # `goto` it is already too late.
    ctx.add_init_script("try{sessionStorage.setItem('smp.tour.later','1');"
                        "sessionStorage.setItem('smp.welcome.done','1');}catch(e){}")
    pg = ctx.new_page()
    errs = []
    pg.on("pageerror", lambda e: errs.append(str(e)[:200]))
    pg.goto(URL)
    pg.wait_for_timeout(2600)

    ck("the platform hydrated from the stub", js(pg, "()=>SYNC.isLive()") is True)
    ck("and this session is the office", js(pg, "()=>CONT.mayTake()") is True)

    # ── 2 · the review day changes no figure ────────────────────────────
    head("2 · the review day is not a measuring date")
    before = js(pg, SCORES)
    js(pg, SET_DAY, 20)
    after = js(pg, SCORES)
    ck("every score, the elapsed months and the review point are unmoved",
       before == after and isinstance(before, dict) and len(before) > 10,
       {k: (before.get(k), after.get(k)) for k in (after or {})
        if isinstance(before, dict) and before.get(k) != after.get(k)})

    # ── 3 · the three fields ────────────────────────────────────────────
    head("3 · the pen's three fields write, and clear")
    js(pg, "()=>{ current='setup'; currentSub='cycle'; paint(); }")
    pg.wait_for_timeout(400)
    opened = False
    for btn in pg.query_selector_all(".setuppane button"):
        if (btn.inner_text() or "").strip().lower().startswith("edit"):
            btn.click(); pg.wait_for_timeout(400); opened = True
            break
    ck("the cycle pen opens", opened)
    # §308: THE REVIEW BLOCK, NAMED. The planning period is a `.cyc2-r` too
    # and it is drawn FIRST, so a bare `.cyc2-r` is satisfied by a build that
    # lost the review block entirely — §113.8, an assertion that can no longer
    # fail for its own reason. Rewritten rather than loosened (§218): it asks
    # for the block that holds the review day, and still asserts it is not
    # among the cycle's own dates, which is Islam's decision.
    ck("and the review block is in it, not among the cycle's own dates",
       js(pg, "()=>!!document.querySelector('.cyc2-r:not(.planper) input[type=date]') && "
              "!document.querySelector('.cyc2-f .cyc2-r')") is True)

    if pg.query_selector(".cyc2-r:not(.planper) input[type=date]"):
        pg.fill(".cyc2-r:not(.planper) input[type=date]", "2026-07-28")
        pg.fill(".cyc2-r:not(.planper) input[type=time]", "10:00")
        pg.click("body"); pg.wait_for_timeout(250)
        ck("the day and time reach the stored review",
           js(pg, "()=>[REVIEW.reviewDay, REVIEW.reviewAt]") == ["2026-07-28", "10:00"],
           js(pg, "()=>[REVIEW.reviewDay, REVIEW.reviewAt]"))
        pg.fill(".cyc2-r:not(.planper) .nc-rem", "48, 6, 6, x")
        pg.click("body"); pg.wait_for_timeout(250)
        ck("the moments are cleaned by the shared rule, and the box says what is stored",
           js(pg, "()=>[SMPRules.remindHours(REVIEW), document.querySelector('.nc-rem').value]")
           == [[48, 6], "48 · 6"],
           js(pg, "()=>[SMPRules.remindHours(REVIEW), document.querySelector('.nc-rem').value]"))
        pg.fill(".cyc2-r:not(.planper) input[type=date]", "")
        pg.click("body"); pg.wait_for_timeout(250)
        ck("clearing the day DELETES both keys, never stores an empty string",
           js(pg, "()=>['reviewDay' in REVIEW, 'reviewAt' in REVIEW]") == [False, False],
           js(pg, "()=>[REVIEW.reviewDay, REVIEW.reviewAt]"))
    else:
        ck("the review block draws its three fields", False, "no date box in the review block")

    # ── 4 · the reminder ────────────────────────────────────────────────
    head("4 · the reminder, at each moment")
    js(pg, "()=>{ delete REVIEW.remindAt; current='group'; currentSub='performance'; paint(); }")
    pg.wait_for_timeout(300)
    js(pg, SET_DAY, None)
    pg.wait_for_timeout(200)
    ck("no review day, no banner", js(pg, BANNER).get("there") is False)

    js(pg, SET_DAY, 40); pg.wait_for_timeout(200)
    ck("40 hours out — before the first moment — still nothing",
       js(pg, BANNER).get("there") is False, js(pg, BANNER))

    js(pg, SET_DAY, 20); pg.wait_for_timeout(200)
    q = js(pg, BANNER)
    ck("20 hours out the banner is there and QUIET", q.get("there") and not q.get("loud"), q)
    ck("and it says which review, and offers Later",
       "review" in q.get("text", "").lower() and q.get("later") is True, q.get("text"))

    js(pg, SET_DAY, 5); pg.wait_for_timeout(200)
    l = js(pg, BANNER)
    ck("5 hours out it is LOUD", l.get("there") and l.get("loud"), l)
    ck("and the two grounds actually differ — measured as paint, not as a class",
       q.get("ground") and l.get("ground") and q.get("ground") != l.get("ground"),
       [q.get("ground"), l.get("ground")])

    js(pg, SET_DAY, 2); pg.wait_for_timeout(200)
    last = js(pg, BANNER)
    ck("at the last moment there is no Later, because there is no later",
       last.get("there") and last.get("take") and last.get("later") is False, last)

    js(pg, SET_DAY, -1); pg.wait_for_timeout(200)
    ck("once the review has begun it stops — a backup nag during the review is noise",
       js(pg, BANNER).get("there") is False, js(pg, BANNER))

    # ── 5 · it ends for the person who has taken them ───────────────────
    head("5 · each person's reminders end with THEIR files")
    js(pg, SET_DAY, 5); pg.wait_for_timeout(200)
    ck("somebody else having them changes nothing",
       js(pg, """()=>{ REVIEW.taken = { someoneelse: { copy:'x', slides:'y' } }; paint();
                       const el=document.getElementById('contingency'); return !el.hidden; }""") is True)
    ck("this person having BOTH ends it",
       js(pg, """()=>{ REVIEW.taken[viewer().key] = { copy:'x', slides:'y' }; paint();
                       const el=document.getElementById('contingency'); return el.hidden; }""") is True)
    ck("but ONE of the two does not — half covered is not covered",
       js(pg, """()=>{ REVIEW.taken[viewer().key] = { copy:'x' }; paint();
                       const el=document.getElementById('contingency');
                       return !el.hidden && /still missing/i.test(el.innerText); }""") is True)
    js(pg, "()=>{ delete REVIEW.taken; paint(); }")

    # ── 1 · both ends: a unit head sees none of it ──────────────────────
    head("1 · the office's, and asked of somebody the rule refuses")
    js(pg, SET_DAY, 5)
    js(pg, "()=>{ current='setup'; currentSub='import'; paint(); }")
    pg.wait_for_timeout(400)
    ck("the office is drawn the card", js(pg, "()=>!!document.querySelector('.contcard')") is True)
    # REWRITTEN, NOT LOOSENED (§218, §214.3): §312 gives the card a third
    # act, so the claim is the same — the card carries every way of taking
    # the files — and the list it is asserted against grew by one.
    ck("with all three buttons on it",
       js(pg, "()=>[...document.querySelectorAll('[data-conttake]')].map(b=>b.dataset.conttake)")
       == ["copy", "slides", "pdf"])

    # ── §312 · ONE PDF, EVERY SUBJECT ────────────────────────
    # Islam: *"the pdf in the contiengcy back is like the master presentation
    # a full pdf with all slides there."* Three things must be true at once,
    # and each can fail on its own: the deck opened is the FLOW rather than
    # one subject, the browser is asked to print it exactly once, and nothing
    # is stamped — because `afterprint` fires on Cancel too, so a mark would
    # be a claim the platform cannot see (§124).
    js(pg, "()=>{ window.__printed = 0; window.print = function(){ window.__printed++; }; }")
    before = js(pg, "()=>JSON.stringify(REVIEW.taken || null)")
    subs = js(pg, "()=>masterSubjects().length")
    js(pg, "()=>document.querySelector('[data-conttake=\"pdf\"]').click()")
    pg.wait_for_timeout(1200)
    got = js(pg, "()=>{ const r=document.getElementById('deckroot');"
                 " return { on:r.classList.contains('on'),"
                 " slides:r.querySelectorAll('.dslide').length,"
                 " subjects:new Set([...r.querySelectorAll('.dslide')]"
                 "   .map(s=>s.dataset.subject)).size,"
                 " printed: window.__printed }; }")
    ck("the print dialog is asked for, once", got.get("printed") == 1, got)
    ck("the deck opened holds every subject that presents",
       got.get("subjects") == subs and isinstance(subs, int) and subs > 1,
       (got.get("subjects"), subs))
    # REWRITTEN, not kept (§113.8). This first compared the flow's slide
    # count against one subject's deck built DETACHED — and §69 records that
    # `deckFitPass()` measures nothing on a detached element, so the single
    # deck came back short and the comparison passed for the wrong reason
    # even on a build opening one subject. Asked of the SUBJECTS instead: a
    # flow ends on a different subject from the one it opens on, which one
    # deck can never do.
    ends = js(pg, "()=>{ const s=[...document.getElementById('deckroot')"
                  "  .querySelectorAll('.dslide')];"
                  " return s.length ? [s[0].dataset.subject,"
                  " s[s.length-1].dataset.subject] : []; }")
    ck("and it is a FLOW, not one subject's deck",
       isinstance(ends, list) and len(ends) == 2 and ends[0] != ends[1], ends)
    ck("nothing is stamped by it",
       js(pg, "()=>JSON.stringify(REVIEW.taken || null)") == before, before)
    js(pg, "()=>window.dispatchEvent(new Event('afterprint'))")
    pg.wait_for_timeout(400)
    ck("and it closes when the dialog does",
       js(pg, "()=>document.getElementById('deckroot').classList.contains('on')") is False)
    # BOTH ENDS (§94.2): the banner's one press stays a silent download of
    # TWO things — a build that folded the PDF into it would hang that press
    # on a dialog nobody pressing it is expecting.
    ck("the banner's own press asks for no dialog",
       js(pg, "()=>{ const s = String(CONT.takeBoth || '');"
              " return s.indexOf('FlowPdf') < 0 && s.indexOf('print') < 0; }") is True)
    js(pg, "()=>{ current='setup'; currentSub='import'; paint(); }")
    pg.wait_for_timeout(400)

    # SWITCHED TO, never doctored: a matrix cell edited by hand would be
    # testing a tenant nobody has (§270's own falsification argument).
    head_key = js(pg, """()=>{
      const p = PEOPLE.find(p => SMPRules.personActive(p) &&
        !SMPRules.mayTakeContingency(world(), p));
      return p ? p.key : null; }""")
    ck("the register holds somebody the rule refuses", bool(head_key), head_key)
    if head_key:
        js(pg, "(k)=>{ switchViewer(k); }", head_key)
        pg.wait_for_timeout(500)
        js(pg, "()=>{ current='setup'; currentSub='import'; paint(); }")
        pg.wait_for_timeout(400)
        ck("they are refused by the rule", js(pg, "()=>CONT.mayTake()") is False)
        ck("and the card is ABSENT for them, not drawn and disabled",
           js(pg, "()=>!!document.querySelector('.contcard')") is False)
        js(pg, "()=>{ current='group'; currentSub='performance'; paint(); }")
        pg.wait_for_timeout(300)
        ck("and so is the banner",
           js(pg, BANNER).get("there") is False, js(pg, BANNER))
        js(pg, "()=>{ current='setup'; currentSub='cycle'; paint(); }")
        pg.wait_for_timeout(400)
        ck("the cycle page draws them no contingency list",
           js(pg, "()=>!!document.querySelector('.contlist')") is False)
        js(pg, "(k)=>{ switchViewer(k); }", "smo")
        pg.wait_for_timeout(500)

    # ── the list ────────────────────────────────────────────────────────
    head("the record of who has taken them")
    # §237: switching viewer REBASES on the server's graph, which is correct
    # and throws away the day the section above set on this tab. Set again
    # rather than assumed — the first run failed here and the product was
    # right (§94.5's shape: a check measuring a state it had itself destroyed).
    js(pg, SET_DAY, 5)
    js(pg, "()=>{ current='setup'; currentSub='cycle'; paint(); }")
    pg.wait_for_timeout(400)
    ck("with a review day set, the list is there",
       js(pg, "()=>!!document.querySelector('.contlist')") is True)
    ck("its rows are exactly the people the rule allows — an agreement, never a number",
       js(pg, """()=>{
         const rows = document.querySelectorAll('.contlist tbody tr').length;
         const w = world();
         const n = (PEOPLE||[]).filter(p => SMPRules.personActive(p) &&
           SMPRules.mayTakeContingency(w, p)).length;
         return rows === n && n > 0; }""") is True,
       js(pg, "()=>document.querySelectorAll('.contlist tbody tr').length"))
    js(pg, SET_DAY, None)
    js(pg, "()=>{ current='setup'; currentSub='cycle'; paint(); }")
    pg.wait_for_timeout(400)
    ck("and with no review day it is absent — nothing is being counted down to",
       js(pg, "()=>!!document.querySelector('.contlist')") is False)

    # ── 6 · the working copy ────────────────────────────────────────────
    head("6 · the working copy")
    js(pg, SET_DAY, 5)
    built = pg.evaluate("""()=>new Promise(res=>{
      CONT.buildCopy((err, html)=>res(err ? {err:String(err.message||err)} : {
        len: html.length,
        islandAt: html.indexOf('id="smp-offline"'),
        firstScript: html.indexOf('<script>'),
        charsetAt: html.indexOf("<meta charset='utf-8'>")
      }));
    })""")
    ck("it builds", isinstance(built, dict) and not built.get("err"), built)
    if isinstance(built, dict) and not built.get("err"):
        ck("the block is IN it", built["islandAt"] > 0)
        ck("and ABOVE every one of the platform's own scripts — below them it is not "
           "in the document when the boot code looks, and the copy silently opens on the "
           "worked example",
           0 < built["islandAt"] < built["firstScript"],
           [built["islandAt"], built["firstScript"]])
        ck("it is bigger than the platform it was made from", built["len"] > len(HTML))

    # OPENED, not merely built (§96). The copy is written to a file and loaded
    # over file:// — the way it is actually used — and asked for a value that
    # exists only in THIS tenant.
    copy_html = pg.evaluate("""()=>new Promise(res=>{
      UNITS[UNIT_KEYS[0]].name = 'ZZ-Copy-Proof';
      CONT.buildCopy((err, html)=>res(err ? null : html));
    })""")
    if copy_html:
        out = pathlib.Path(os.environ.get("TMPDIR") or "/tmp") / "smp-contingency-copy.html"
        out.write_text(copy_html, encoding="utf-8")
        p2 = ctx.new_page()
        cerrs = []
        p2.on("pageerror", lambda e: cerrs.append(str(e)[:200]))
        p2.goto(out.resolve().as_uri())
        p2.wait_for_timeout(2600)
        ck("the copy opens from a file with nothing running, and holds THIS tenant",
           p2.evaluate("()=>UNITS[UNIT_KEYS[0]].name") == "ZZ-Copy-Proof",
           p2.evaluate("()=>UNITS[UNIT_KEYS[0]].name"))
        ck("it knows it is a copy", p2.evaluate("()=>SYNC.isOffline()") is True)
        ck("a deck opens in it and carries slides",
           (p2.evaluate("""()=>{ const d=document.createElement('div');
              d.innerHTML = deckHtmlFor(activeKeys()[0]);
              return d.querySelectorAll('.dslide').length; }""") or 0) > 5)
        ck("and nothing threw while it booted", not cerrs, cerrs[:2])
        p2.close()
        try: out.unlink()
        except OSError: pass
    else:
        ck("the copy could be built for opening", False)

    # ── 7 · the slides ──────────────────────────────────────────────────
    head("7 · the slides carry the figures")
    pg.reload(); pg.wait_for_timeout(2600)
    one = pg.evaluate("""()=>{
      const t = activeKeys()[0];
      const u = buildReviewPptx(t);
      let s=''; const c=new Uint8Array(u);
      for (let i=0;i<c.length;i++) s += String.fromCharCode(c[i]);
      return { name: reviewPptxName(t), b64: btoa(s),
               slides: reviewPptxSlides(t).length,
               deck: (()=>{ const d=document.createElement('div');
                 d.innerHTML = deckHtmlFor(t); return d.querySelectorAll('.dslide').length; })() };
    }""")
    ck("the file is named after the subject and the cycle",
       one["name"].endswith(".pptx") and len(one["name"]) > 10, one["name"])
    ck("it has at least a slide for every slide of the real deck — a long table "
       "continues rather than being dropped",
       one["slides"] >= one["deck"] > 5, [one["slides"], one["deck"]])
    z = zipfile.ZipFile(io.BytesIO(base64.b64decode(one["b64"])))
    ck("it is a valid package PowerPoint will open", z.testzip() is None)
    names = [n for n in z.namelist() if re.match(r"ppt/slides/slide\d+\.xml", n)]
    ck("with one part per slide", len(names) == one["slides"], [len(names), one["slides"]])
    words = " | ".join(w for n in names
                       for w in re.findall(r"<a:t>([^<]*)</a:t>", z.read(n).decode("utf8")))
    for probe in ("YTD", "Progress", "Annual target"):
        ck("the reported column %r is in the file — which is the whole difference from "
           "the plan download" % probe, probe in words)
    ck("a figure reported against its benchmark is in it, not just the target",
       re.search(r"\d+% / \d+%", words) is not None)
    ck("a quarter mark reads as quarters, not as the digits 1234",
       "1234" not in words and re.search(r"\bQ[1-4]\b", words) is not None)
    ck("and no slide came out empty — an empty page in a backup is the fault this "
       "feature exists to prevent",
       all(len([w for w in re.findall(r"<a:t>([^<]*)</a:t>", z.read(n).decode("utf8"))
                if w.strip()]) >= 2 for n in names),
       [n for n in names
        if len([w for w in re.findall(r"<a:t>([^<]*)</a:t>", z.read(n).decode("utf8"))
                if w.strip()]) < 2])

    ck("every subject that presents gets one",
       (js(pg, "()=>CONT.subjects().length") or 0) > 5,
       js(pg, "()=>CONT.subjects().length"))

    # ── 8 · the press records itself, and a failure does not ────────────
    head("8 · the press records itself")
    js(pg, SET_DAY, 5)
    js(pg, "()=>{ current='setup'; currentSub='import'; paint(); }")
    pg.wait_for_timeout(400)
    ck("nothing is recorded before the press",
       js(pg, "()=>!CONT.taken()") is True)
    got = pg.evaluate("""()=>new Promise(res=>{
      CONT.takeSlides(err => res({ err: err ? String(err.message||err) : null,
                                   taken: JSON.parse(JSON.stringify(CONT.taken()||{})) }));
    })""")
    ck("taking the slides stamps the slides and NOT the copy",
       got.get("err") is None and got["taken"].get("slides") and not got["taken"].get("copy"),
       got)
    ck("and the card then says what is still missing",
       bool(js(pg, """()=>{ paint(); const e=document.querySelector('.contgot');
                            return e && /working copy/i.test(e.innerText); }""")))

    # A FAILURE MUST NOT STAMP. The one way to make the build fail here without
    # touching the product is to take the file away from under it (§100.3: the
    # stub models the server, so it can model a broken one too).
    js(pg, "()=>{ delete REVIEW.taken; paint(); }")
    failed = pg.evaluate("""()=>new Promise(res=>{
      const real = window.fetch;
      window.fetch = () => Promise.resolve({ ok:false, status:503, text:()=>Promise.resolve('') });
      CONT.takeCopy(err => { window.fetch = real;
        res({ err: err ? String(err.message||err) : null,
              taken: JSON.parse(JSON.stringify(CONT.taken()||{})) }); });
    })""")
    ck("a copy that could not be fetched reports the failure",
       bool(failed.get("err")), failed)
    ck("and writes NO stamp — being told you are covered when nothing downloaded is "
       "worse than being told nothing",
       not failed["taken"].get("copy"), failed)

    # ── the banner is READ, in both themes ──────────────────────────────
    head("the banner's words are readable, in both themes")
    js(pg, "()=>{ delete REVIEW.taken; current='group'; currentSub='performance'; paint(); }")
    for theme in ("light", "dark"):
        js(pg, "(t)=>{ document.documentElement.setAttribute('data-theme', t); }", theme)
        for hrs, word in ((20, "quiet"), (2, "loud")):
            js(pg, SET_DAY, hrs)
            pg.wait_for_timeout(150)
            m = js(pg, """()=>{
              const el = document.getElementById('contingency');
              if (!el || el.hidden) return null;
              const s = el.querySelector('.safety-msg strong');
              const b = el.querySelector('.safety-btn');
              const cs = getComputedStyle(el);
              return { bg: cs.backgroundColor,
                       ink: getComputedStyle(s).color,
                       btnBg: getComputedStyle(b).backgroundColor,
                       btnInk: getComputedStyle(b).color }; }""")
            if not m or m.get("threw"):
                ck("the %s banner is measurable in %s" % (word, theme), False, m)
                continue
            r1 = ratio(rgb(m["ink"]), rgb(m["bg"]))
            r2 = ratio(rgb(m["btnInk"]), rgb(m["btnBg"]))
            ck("%s / %s — the sentence reads (%.2f)" % (theme, word, r1), r1 >= 4.5, m)
            ck("%s / %s — and so does the button (%.2f)" % (theme, word, r2), r2 >= 4.5, m)
    js(pg, "()=>document.documentElement.removeAttribute('data-theme')")

    # ── AND IT HOLDS ONE ROW (§158: fit, never "and it scrolls") ────────
    head("the banner fits, and the page never moves sideways")
    js(pg, SET_DAY, 2)
    for w in (1600, 1280, 1000):
        pg.set_viewport_size({"width": w, "height": 900})
        pg.wait_for_timeout(200)
        m = js(pg, """()=>{
          const el = document.getElementById('contingency');
          return el && !el.hidden
            ? { h: Math.round(el.getBoundingClientRect().height),
                over: document.documentElement.scrollWidth - document.documentElement.clientWidth }
            : null; }""")
        ck("at %dpx the page does not scroll sideways" % w,
           m and m.get("over", 1) <= 0, m)
    pg.set_viewport_size({"width": 1500, "height": 1000})

    ck("the page threw nothing throughout", not errs, errs[:3])

    b.close()

srv.shutdown()
print("\n%d failures" % bad)
raise SystemExit(1 if bad else 0)
