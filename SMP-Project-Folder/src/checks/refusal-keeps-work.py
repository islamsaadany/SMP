"""A REFUSAL COSTS THE ROW IT NAMED, AND NOTHING ELSE (§184).

Islam, on the CX strategy custodian: *"the strategy custodian got this error
on submitting the report and they lost all data they inputed and the dates
showed waiting confirmation and I didn't get them as the SMO."*

THE REFUSAL ITSELF WAS CORRECT. One row genuinely was the office's. What was
wrong is everything around it: the whole graph posts together, so one refused
row failed the whole save, and the only control on the banner was *Discard the
change and reload* — which destroyed three legitimate fills that had never
reached the database. From the office's side those dates simply never arrived.

So this measures the SAVE PATH, not the fields. Which control writes a due
date is `milestone-fill.py`'s and `gap-fill.py`'s subject and is not repeated
here; what is asked here is the one question neither of them can: **when the
server says no to one row, what happens to the other three?**

  · the banner NAMES the refused row — its name and the field, not only "a
    project's milestones", which is what left somebody with nothing to undo
  · it offers to put back THAT row and save the rest, and that button is
    pressed rather than merely found (§70, §93.4: present is not reachable)
  · after pressing, the refused field holds what the SERVER holds, the other
    work is untouched, and a second post goes and is ACCEPTED
  · BOTH ENDS (§113.8): a refusal with no row address — removing a project
    changes WHICH rows exist, and no field revert can undo that — offers no
    put-back at all, because a button that would not work is worse than none

THE STUB RUNS THE REAL AUTHORISER (§100.3). A stub that answered a canned 403
would be a fiction about the one thing under test; every POST here goes
through `lib/authorize.js` against the same stored graph the page hydrated
from, so the refusals are the deployment's own.

PROVE IT CAN FAIL (§94.5). Against the shipped pre-§184 build there is no
put-back button, no row names on the banner, and the second save never
happens:

    SMP_REFUSAL_HTML=/path/to/pre-184.html \\
      SMP_CHROME=/opt/pw-browsers/chromium python3 qa-run.py checks/refusal-keeps-work.py

Run:  SMP_CHROME=/opt/pw-browsers/chromium python3 qa-run.py checks/refusal-keeps-work.py
"""
import json, os, pathlib, subprocess, threading, http.server, socketserver, tempfile
from playwright.sync_api import sync_playwright

ROOT = pathlib.Path(__file__).resolve().parents[3]
HTML = pathlib.Path(os.environ.get("SMP_REFUSAL_HTML") or
                    (ROOT / "SMP-Project-Folder/src/strategy-management-platform.html")).read_bytes()
SEED = json.loads((ROOT / "db/seed-state.json").read_text())

FN = "it"
FILLER = {"key": "t184_fill", "name": "Filler 184", "role": None}
bad = 0


def ck(w, ok, x=""):
    global bad
    if not ok:
        bad += 1
    print(("  ok      " if ok else "  FAIL    ") + w + (("  — " + str(x)) if not ok and x else ""))


# ── THE FIXTURE: THE CX SHAPE, MADE (§94.2) ────────────────────────────────
# No seed row carries an unreadable date and no seed person holds the fill
# grant, so the state this exists to measure has to be built.
STORED = json.loads(json.dumps(SEED))
STORED["functions"][FN]["custodian"] = FILLER["key"]
STORED["people"].append({"key": FILLER["key"], "name": FILLER["name"], "active": True})
STORED["access"]["custodian"] = dict(STORED["access"].get("custodian") or {},
                                     a_fn_own_strat="fill")
CAP = [c for c in STORED["group"]["capabilities"] if c.get("fn") == FN][0]
PROJ = CAP["projects"][0]
MS = PROJ["milestones"]
assert len(MS) >= 3, "the fixture needs a project with three milestones"
MS[0]["finish"] = "Nov 26"          # readable → correcting it is the office's
MS[1]["finish"] = ""                # a gap → the filler may fill it
MS[2]["finish"] = ""                # and this one too
FIX = {"cap": CAP["id"], "proj": PROJ["id"],
       "refused": MS[0]["id"], "refusedName": MS[0]["name"], "held": MS[0]["finish"],
       "fillA": MS[1]["id"], "fillB": MS[2]["id"]}

# The server's own decision, run as a subprocess so nothing about it is
# reimplemented here. `stored` is fixed; `incoming` arrives on stdin.
JUDGE = tempfile.NamedTemporaryFile("w", suffix=".js", delete=False)
JUDGE.write("""
const fs = require("fs");
const { authorize } = require(process.argv[2] + "/lib/authorize.js");
const stored = JSON.parse(fs.readFileSync(process.argv[3], "utf8"));
const person = JSON.parse(process.argv[4]);
const incoming = JSON.parse(fs.readFileSync(0, "utf8")).state;
const v = authorize(stored, incoming, person);
if (v.ok) { process.stdout.write(JSON.stringify({ ok: true })); }
else {
  const undoable = v.refused.length > 0 &&
    v.refused.every(function (r) { return r.rows && r.rows.length; });
  process.stdout.write(JSON.stringify({ ok: false, refused: true,
    error: v.refusals.join(" "), refusals: v.refusals,
    refusedChanges: v.refused, undoable: undoable }));
}
""")
JUDGE.close()
STOREDF = tempfile.NamedTemporaryFile("w", suffix=".json", delete=False)
json.dump(STORED, STOREDF)
STOREDF.close()

POSTS = []


def judge(raw):
    p = subprocess.run(["node", JUDGE.name, str(ROOT), STOREDF.name,
                        json.dumps({"key": FILLER["key"], "name": FILLER["name"]})],
                       input=raw, capture_output=True)
    if p.returncode:
        return 500, json.dumps({"ok": False, "error": p.stderr.decode()[:400]}).encode()
    body = p.stdout
    return (200 if json.loads(body).get("ok") else 403), body


class H(http.server.BaseHTTPRequestHandler):
    def log_message(self, *a): pass

    def _s(self, body, code=200, ctype="application/json"):
        self.send_response(code); self.send_header("Content-Type", ctype)
        self.send_header("Content-Length", str(len(body))); self.end_headers()
        self.wfile.write(body)

    def do_GET(self):
        if self.path.startswith("/api/state"):
            self._s(json.dumps({"ok": True, "state": STORED, "person": FILLER}).encode()); return
        if self.path.startswith("/api/auth"):
            self._s(json.dumps({"ok": True, "person": FILLER}).encode()); return
        if self.path.startswith("/raya-trade"):
            self._s(HTML, 200, "text/html; charset=utf-8"); return
        self._s(b"<!doctype html><title>gate</title>", 200, "text/html; charset=utf-8")

    def do_POST(self):
        raw = self.rfile.read(int(self.headers.get("Content-Length") or 0))
        if self.path.startswith("/api/state"):
            code, body = judge(raw)
            POSTS.append(code)
            self._s(body, code); return
        self._s(b'{"ok":true,"unread":0,"threads":[],"chat":{"on":false},"states":{},"said":{}}')


class S(socketserver.ThreadingTCPServer):
    allow_reuse_address = True


srv = S(("127.0.0.1", 0), H)
threading.Thread(target=srv.serve_forever, daemon=True).start()
URL = "http://127.0.0.1:%d/raya-trade" % srv.server_address[1]

# What the page does to the graph. Deliberately written through the platform's
# own row objects and `afterPaint()`, which is where EVERY change in the
# product becomes a save (§170) — so this is the real save path, not a fetch
# aimed at the endpoint.
MUTATE = """(f) => {
  const cap = (GROUP.capabilities||[]).filter(c => c.id === f.cap)[0];
  const p = cap.projects.filter(x => x.id === f.proj)[0];
  const by = (id) => p.milestones.filter(m => m.id === id)[0];
  const mark = { by: "t184_fill", at: "2026-08-30T09:00:00Z" };
  /* two legitimate fills ... */
  by(f.fillA).finish = "Jul 26"; by(f.fillA).pend = { finish: mark };
  by(f.fillB).finish = "Aug 26"; by(f.fillB).pend = { finish: mark };
  /* ... and one the server will not take. */
  by(f.refused).finish = "Dec 27"; by(f.refused).pend = { finish: mark };
  SYNC.afterPaint();
}"""
READ = """(f) => {
  const cap = (GROUP.capabilities||[]).filter(c => c.id === f.cap)[0];
  const p = cap.projects.filter(x => x.id === f.proj)[0];
  const by = (id) => p.milestones.filter(m => m.id === id)[0];
  const one = (id) => ({ finish: by(id).finish,
                         pend: by(id).pend ? Object.keys(by(id).pend) : null });
  return { refused: one(f.refused), fillA: one(f.fillA), fillB: one(f.fillB) };
}"""

with sync_playwright() as pw:
    b = pw.chromium.launch()
    ctx = b.new_context(viewport={"width": 1500, "height": 980})
    pg = ctx.new_page()
    errs = []
    pg.on("pageerror", lambda e: errs.append(str(e)))
    # A 403 IS THE SUBJECT HERE, NOT A FAULT. Chromium logs every non-2xx
    # fetch to the console as an error, so the unfiltered listener reported the
    # refusal this file exists to produce — a check crying wolf about its own
    # fixture (§128: a measurement wrong in the direction of "broken" costs as
    # much as one wrong the other way). Everything else still counts.
    pg.on("console", lambda m: errs.append(m.text)
          if m.type == "error" and "403" not in m.text else None)
    pg.add_init_script("try{sessionStorage.setItem('smp.welcome.done','1');"
                       "sessionStorage.setItem('smp.tour.later','1');}catch(e){}")
    pg.goto(URL); pg.wait_for_timeout(2600)

    print("\n── the fixture")
    ck("the stub is live, so a save can be seen at all", pg.evaluate("SYNC.isLive()"))
    ck("...and the server's own authoriser is behind it",
       pg.evaluate("!!(window.SMPRules && SMPRules.gapEmpty)"))

    # ══ 1 · ONE ROW REFUSED, AND THE REST SURVIVES ═════════════════════════
    print("\n── one refused row among three")
    POSTS.clear()
    pg.evaluate(MUTATE, FIX)
    pg.wait_for_timeout(2600)
    ck("the save went and was refused", POSTS and POSTS[0] == 403, POSTS)

    banner = pg.evaluate("""()=>{const el=document.getElementById('refused');
        return el && !el.hidden ? el.innerText : null;}""")
    ck("the banner is on screen", bool(banner), banner)
    if banner:
        ck("...it names the refused ROW, not only the table",
           FIX["refusedName"] in banner, banner[:300])
        ck("...and the FIELD, in the word the page uses",
           "Due date" in banner, banner[:300])
        # The two rows the server ACCEPTED are not named: a banner that listed
        # them would send somebody to undo work that was never the problem.
        ck("...and says nothing about the two it did not refuse",
           all(m not in banner for m in (FIX["fillA"], FIX["fillB"])), banner[:300])

    keep = pg.evaluate("""()=>{const b=document.getElementById('refused-keep');
        if(!b) return null;
        const r=b.getBoundingClientRect();
        const hit=document.elementFromPoint(r.left+r.width/2, r.top+r.height/2);
        return { text:b.textContent.trim(), w:Math.round(r.width),
                 reachable: !!(hit && (hit===b || b.contains(hit))) };}""")
    ck("the way that KEEPS the work is offered", keep is not None)
    if keep:
        ck("...and a click at its centre reaches it", keep["reachable"], keep)
        ck("...and it says what it does", "save the rest" in keep["text"], keep["text"])
    ck("Discard is still there, and is no longer the only control",
       pg.evaluate("!!document.getElementById('refused-undo')"))

    # ══ 2 · PRESSING IT ════════════════════════════════════════════════════
    print("\n── putting back only what was refused")
    POSTS.clear()
    pg.evaluate("()=>{const b=document.getElementById('refused-keep'); if(b) b.click();}")
    pg.wait_for_timeout(2600)
    after = pg.evaluate(READ, FIX)
    ck("the refused row holds what the SERVER holds again",
       after["refused"]["finish"] == FIX["held"], after["refused"])
    ck("...and its pending mark went with it",
       not after["refused"]["pend"], after["refused"])
    # THE HALF THE WHOLE SECTION EXISTS FOR.
    ck("the first fill is UNTOUCHED", after["fillA"]["finish"] == "Jul 26", after["fillA"])
    ck("the second fill is UNTOUCHED", after["fillB"]["finish"] == "Aug 26", after["fillB"])
    ck("...and both are still marked pending, so the office still confirms them",
       after["fillA"]["pend"] == ["finish"] and after["fillB"]["pend"] == ["finish"],
       [after["fillA"], after["fillB"]])
    ck("a second save went", len(POSTS) >= 1, POSTS)
    ck("...and this time it was ACCEPTED", 200 in POSTS, POSTS)
    ck("the banner cleared", pg.evaluate("""()=>{const el=document.getElementById('refused');
        return !el || el.hidden;}"""))
    ck("nothing threw", not errs, errs[:1])

    # ══ 3 · THE OTHER END: A REFUSAL WITH NO ADDRESS ═══════════════════════
    # Removing a project changes WHICH rows exist, and no field revert undoes
    # that — so the offer must NOT be made. A button that cannot work is worse
    # than the destructive one, because it looks like it did something.
    print("\n── a refusal nothing can put back")
    errs.clear()
    POSTS.clear()
    pg.evaluate("""(f)=>{
      const cap = (GROUP.capabilities||[]).filter(c => c.id === f.cap)[0];
      cap.projects = cap.projects.filter(x => x.id !== f.proj);
      SYNC.afterPaint();}""", FIX)
    pg.wait_for_timeout(2600)
    ck("removing a project is refused", 403 in POSTS, POSTS)
    ck("...the banner still says why",
       pg.evaluate("""()=>{const el=document.getElementById('refused');
           return !!(el && !el.hidden && el.innerText.trim());}"""))
    ck("...and NO put-back is offered, because there is no row to put back",
       pg.evaluate("!document.getElementById('refused-keep')"))
    ck("...while Discard still is", pg.evaluate("!!document.getElementById('refused-undo')"))
    ck("nothing threw", not errs, errs[:1])

    b.close()
srv.shutdown()
os.unlink(JUDGE.name); os.unlink(STOREDF.name)

print(("\n%d FAILED" % bad) if bad else "\nrefusal-keeps-work: OK")
raise SystemExit(1 if bad else 0)
