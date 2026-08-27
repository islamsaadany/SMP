"""THE MOCKUP IS MADE OF THE REAL COMPOSER (§41.9, spec 021).

Not drawn from the stylesheet — driven. This serves the BUILT platform with the
same stub `checks/send-message.py` uses (the whole page is the empty state over
`file://`, §94.11), walks to Setup › Send a message the way somebody walks
there, and injects the proposed greeting row into the LIVE pane. Both sides of
every picture are the same build, so what is agreed is what the product will
look like rather than what its CSS could be made to do.

THE CONTROL IS THE PLATFORM'S OWN. `.imp-row` + `.cfg-lab` + `.minisw` is the
Off/On switch the naming setting already wears (§44) — a second switch idiom
invented for this row is exactly §53.5's drift, and it would be invisible in a
mockup that had drawn one.

Writes PNGs into design-mockups/email-greeting/shots/. It measures nothing and
asserts nothing: it is a camera, not a check. The check comes with the build.
"""
import json, pathlib, threading, http.server, socketserver
from playwright.sync_api import sync_playwright

ROOT = pathlib.Path(__file__).resolve().parents[3]
HTML = (ROOT / "SMP-Project-Folder/src/strategy-management-platform.html").read_bytes()
STATE = json.loads((ROOT / "db/seed-state.json").read_text())
OUT = ROOT / "design-mockups/email-greeting/shots"
OUT.mkdir(parents=True, exist_ok=True)

# The audience the tenant actually produces for a group-wide send (§95's 76),
# with the three real shapes of first name this feature has to survive: an
# ordinary one, a compound one the register really holds, and a row whose name
# cannot produce a greeting at all.
TO = ([{"key": "p1", "name": "Ahmed Mostafa Mohamed El Gebely", "email": "a@example.com"},
       {"key": "p2", "name": "Abd El Moniem Mohamed Abd El Moniem Mahmoud",
        "email": "b@example.com"},
       {"key": "p3", "name": "Amaka Eze", "email": "c@example.com"}] +
      [{"key": "p%d" % i, "name": "Person %d" % i, "email": "p%d@example.com" % i}
       for i in range(4, 77)])
SKIPPED = [{"key": "s%d" % i, "name": "Skipped %d" % i, "why": "no address on their row"}
           for i in range(1, 4)]

for p in STATE.get("people", []):
    if p.get("key") == "smo":
        p["email"] = "smo@example.com"
PERSON = {"key": "smo", "name": "Mohamed Essam", "role": "super"}


class H(http.server.BaseHTTPRequestHandler):
    def log_message(self, *a):
        pass

    def _send(self, code, body, ctype):
        self.send_response(code)
        self.send_header("Content-Type", ctype)
        self.send_header("Content-Length", str(len(body)))
        self.end_headers()
        self.wfile.write(body)

    def _json(self, o):
        self._send(200, json.dumps(o).encode(), "application/json")

    def do_GET(self):
        if self.path.startswith("/api/state"):
            return self._json({"ok": True, "state": STATE, "person": PERSON})
        if self.path.startswith("/raya-trade"):
            return self._send(200, HTML, "text/html; charset=utf-8")
        return self._send(200, b"<!doctype html><title>Sign in</title>",
                          "text/html; charset=utf-8")

    def do_POST(self):
        n = int(self.headers.get("Content-Length") or 0)
        try:
            body = json.loads(self.rfile.read(n) or b"{}")
        except Exception:
            body = {}
        a = body.get("action")
        if self.path.startswith("/api/mail"):
            if a == "status":
                return self._json({"ok": True, "key": True, "from": "smp@example.com",
                                   "domain": "example.com", "verified": True})
            if a == "audience":
                return self._json({"ok": True, "to": TO, "skipped": SKIPPED,
                                   "active": len(TO) + len(SKIPPED),
                                   "withAddress": len(TO)})
            if a == "draftList":
                return self._json({"ok": True, "drafts": []})
            if a == "history":
                return self._json({"ok": True, "messages": []})
        return self._json({"ok": True})


srv = socketserver.ThreadingTCPServer(("127.0.0.1", 0), H)
srv.daemon_threads = True
PORT = srv.server_address[1]
threading.Thread(target=srv.serve_forever, daemon=True).start()
URL = "http://127.0.0.1:%d/raya-trade" % PORT

SUBJECT = "The Q3 reporting cycle opens on Monday"
BODY = ("The cycle opens on Monday 1 September and closes on Friday 12 September.\n\n"
        "Please enter your figures against every measure your unit owns, and write a "
        "note against anything at risk — a figure at risk with no note cannot be "
        "submitted.\n\n"
        "If a number is not yours to enter, the platform will tell you whose it is.")

# ── THE PROPOSED ROW, in the platform's own parts ────────────────────────
# `.imp-row` / `.cfg-lab` / `.minisw` is the naming switch's shape (§44); the
# word box is a `.fld` like the two beside it in `.ctarow`; the note is a
# `.why`, which is how every other row on this page explains itself.
ROW = """(on) => {
  // CLEARED BEFORE IT IS FOUND. The injected row wears `.ctarow` too, so a
  // plain query on the second call finds the LAST one's leftover — which is
  // then removed, leaving a detached node with no parent to insert before.
  document.querySelectorAll('.greetrow').forEach(e => e.remove());
  const cta = document.querySelector('.ctarow:not(.greetrow)');
  if (!cta) return false;
  const d = document.createElement('div');
  d.className = 'greetrow';
  // The dashed rule and spacing `.ctarow` carries — the row belongs to the
  // composer, not to the page, so it is separated the way its neighbour is.
  d.setAttribute('style', 'border-top:1px dashed var(--line);margin-top:12px;padding-top:11px');
  // ── ONE LINE, AND NOTHING EXPLAINING ITSELF ──────────────────────────
  // Islam, of the two-line version: "the design of the setting is poor. It
  // should be one line you dont need 2 lines .. and no explanations needed in
  // the setting itself it's clear." §127's ruling on the chat settings, and he
  // is right twice over — a label reading "Open with a greeting" beside a box
  // holding the word "Dear" has already said everything the sentence said.
  //
  // `.imp-row` is a flex line and `.cfg-lab` is flex:1, so the label takes the
  // free space and the field and switch sit together at the right. THE SWITCH
  // DOES NOT MOVE when the field appears: it is last in the row either way,
  // and a control that shifts under the press that produced it is §41.8's
  // fault.
  d.innerHTML =
    '<div class="imp-row" style="margin:0">' +
      '<span class="cfg-lab">Open with a greeting</span>' +
      // THE BOX HOLDS ONE WORD, so it is sized for one word.
      (on ? '<input class="fld" value="Dear" placeholder="Dear" ' +
              'aria-label="The greeting word" style="width:120px;flex:none">' : '') +
      '<span class="minisw">' +
        '<button aria-pressed="' + (!on) + '">Off</button>' +
        '<button aria-pressed="' + on + '">On</button>' +
      '</span>' +
    '</div>';
  cta.parentNode.insertBefore(d, cta);
  return true;
}"""

# The greeting as it renders INSIDE the preview — the real `MAIL.html` output is
# in a shadow root, so the line is put where the builder would put it: the first
# paragraph of the body, in the body's own type.
GREET_IN_PREVIEW = """(name) => {
  const host = document.getElementById('msgprev');
  if (!host || !host.shadowRoot) return false;
  const b = host.shadowRoot.querySelector('[data-mail-body]');
  if (!b) return false;
  b.querySelectorAll('.greetline').forEach(e => e.remove());
  const first = b.querySelector('p');
  if (!first) return false;
  const p = document.createElement('p');
  p.className = 'greetline';
  p.setAttribute('style', first.getAttribute('style') || '');
  p.textContent = 'Dear ' + name + ',';
  b.insertBefore(p, first);
  // WHOSE NAME THIS IS, said OUTSIDE the message. The preview is the builder's
  // real output (§72.3) and a badge inside it would be a line nobody receives
  // — so the sample is named under the card, where the platform is speaking
  // rather than the email.
  const host2 = document.getElementById('msgprev');
  host2.parentNode.querySelectorAll('.greetnote').forEach(e => e.remove());
  const n = document.createElement('span');
  n.className = 'why greetnote';
  n.setAttribute('style', 'display:block;margin:8px 0 0');
  // The row explains nothing now, and this line is not the row — it is the one
  // thing the screen cannot say by showing: that the name in the preview is a
  // sample. Cut to six words rather than dropped, because without it a draft
  // opened by somebody else reads as "everybody gets Dear Ahmed".
  n.innerHTML = 'Everyone sees their own name here.';
  host2.parentNode.insertBefore(n, host2.nextSibling);
  return true;
}"""


def shot(pg, sel, name, pad=0):
    el = pg.query_selector(sel)
    if not el:
        print("  MISSING " + sel)
        return
    # A clip is in PAGE coordinates against the rendered image, so an element
    # below the fold clips outside it and the call fails rather than scrolling.
    el.scroll_into_view_if_needed()
    pg.wait_for_timeout(150)
    if pad:
        box = el.bounding_box()
        pg.screenshot(path=str(OUT / name), clip={
            "x": max(0, box["x"] - pad), "y": max(0, box["y"] - pad),
            "width": box["width"] + pad * 2, "height": box["height"] + pad * 2})
    else:
        el.screenshot(path=str(OUT / name))
    print("  wrote " + name)


def shot_pair(pg, a, b, name, pad=8):
    """Both elements in one picture — the preview card and the line under it
    that says whose name it is showing."""
    ea, eb = pg.query_selector(a), pg.query_selector(b)
    if not ea or not eb:
        print("  MISSING " + a + " / " + b)
        return
    ea.scroll_into_view_if_needed()
    pg.wait_for_timeout(150)
    ra, rb = ea.bounding_box(), eb.bounding_box()
    top, bot = min(ra["y"], rb["y"]), max(ra["y"] + ra["height"], rb["y"] + rb["height"])
    left = min(ra["x"], rb["x"])
    right = max(ra["x"] + ra["width"], rb["x"] + rb["width"])
    pg.screenshot(path=str(OUT / name), clip={
        "x": max(0, left - pad), "y": max(0, top - pad),
        "width": (right - left) + pad * 2, "height": (bot - top) + pad * 2})
    print("  wrote " + name)


def run(theme):
    tag = "" if theme == "light" else "-dark"
    with sync_playwright() as pw:
        br = pw.chromium.launch()
        pg = br.new_page(viewport={"width": 1440, "height": 1000},
                         device_scale_factor=2)
        pg.add_init_script("try{sessionStorage.setItem('smp.tour.later','1');"
                           "localStorage.setItem('smp.theme','%s');}catch(e){}" % theme)
        pg.goto(URL)
        pg.wait_for_selector("nav.units", timeout=15000)
        pg.click('#units [data-md="setup"]')
        pg.wait_for_timeout(400)
        for g in pg.eval_on_selector_all(".setuprail .rgroup.shut",
                                         "e=>e.map(x=>x.dataset.railgrp)"):
            pg.click('.setuprail [data-railgrp="%s"]' % g)
            pg.wait_for_timeout(70)
        pg.click('.setuprail [data-setupgo="send"]')
        pg.wait_for_timeout(900)

        # A message with something in it, and an audience — the composer is the
        # empty state otherwise, and an empty state is not what is being agreed.
        pg.evaluate("""([s, b]) => {
          const st = sendmsg();
          st.criteria.everyone = true; st.subject = s; st.body = b;
          sendmsgAsk(); paint();
        }""", [SUBJECT, BODY])
        pg.wait_for_timeout(1200)

        # ── TODAY ────────────────────────────────────────────────────
        shot(pg, ".ctarow", "today-ctarow%s.png" % tag, pad=10)
        shot(pg, "#msgprev", "today-preview%s.png" % tag)

        # ── THE SWITCH, OFF ──────────────────────────────────────────
        pg.evaluate(ROW, False)
        pg.wait_for_timeout(250)
        shot(pg, ".greetrow", "row-off%s.png" % tag, pad=10)

        # ── THE SWITCH, ON ───────────────────────────────────────────
        pg.evaluate(ROW, True)
        pg.wait_for_timeout(250)
        shot(pg, ".greetrow", "row-on%s.png" % tag, pad=10)

        # ── THE PREVIEW, GREETED ─────────────────────────────────────
        pg.evaluate(GREET_IN_PREVIEW, "Ahmed")
        pg.wait_for_timeout(250)
        shot_pair(pg, "#msgprev", ".greetnote", "preview-greeted%s.png" % tag)

        # The compound case, which is the one decision that needed asking twice.
        pg.evaluate(GREET_IN_PREVIEW, "Abd El Moniem")
        pg.wait_for_timeout(200)
        shot_pair(pg, "#msgprev", ".greetnote", "preview-compound%s.png" % tag)

        # And the whole composer, so the row is seen in its place rather than
        # as a crop — a row that reads well alone can still crowd the page.
        pg.evaluate(GREET_IN_PREVIEW, "Ahmed")
        pg.wait_for_timeout(200)
        shot(pg, "#panel", "composer-whole%s.png" % tag)
        br.close()


for t in ("light", "dark"):
    print(t + ":")
    run(t)
print("done → " + str(OUT))
