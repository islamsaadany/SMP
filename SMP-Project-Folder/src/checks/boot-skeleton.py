"""NOTHING WEARS A COLOUR IT WILL HAVE TO CHANGE (§94.10).

Islam: "when I open the platform it opens on a color scheme and then it
glitches and shifts to the current color."

THIS CHECK EXISTS BECAUSE `qa.py` CANNOT SEE THE THING. Every other check opens
the built file over `file://`, where there is no server, nothing arrives late,
and `theme.js` deliberately does not stamp `booting` at all — so the entire
feature is invisible to the whole suite, and a build that had lost it would go
green every time (§51.11, and this is the version of that trap you walk into
knowingly).

So this serves the built file over HTTP with a deliberately SLOW `/api/state`,
which is the only condition under which the fault was ever visible. The stub
answers with branding the baked file does not have — a purple bar — so
"the tenant's colours arrived" and "the baked colours were never shown" are two
different measurements rather than one hopeful one.

Four states, because a loading screen that can get stuck is worse than the
glitch it replaces: slow, fast, unreachable, and refused.
"""
import json, pathlib, threading, http.server, socketserver, time, copy
from playwright.sync_api import sync_playwright

# ── THE TOUR IS NOT WHAT THIS FILE MEASURES (§107, §108.16) ──────────────
# The onboarding tour auto-opens for a first-time viewer over HTTP, and its
# dim layer covers the page — so every click here lands on `#tdim` and times
# out. Suppressed as a RETURNING VIEWER would have it (the tour's own
# "Skip for now" session flag), never by deleting or disabling the tour:
# the tour has its own check, and a suppression that reached into its
# internals would be this file quietly asserting the tour away.
def _no_tour(pg):
    pg.add_init_script("try{sessionStorage.setItem('smp.tour.later','1');"
                       "sessionStorage.setItem('smp.welcome.done','1');}catch(e){}")


ROOT = pathlib.Path(__file__).resolve().parents[3]
HTML = (ROOT / "SMP-Project-Folder/src/strategy-management-platform.html").read_bytes()
SEED = json.loads((ROOT / "db/seed-state.json").read_text())

# A bar colour the baked file cannot possibly be showing, so "the tenant's
# branding landed" is measurable rather than assumed.
TENANT_BAR = "#4B0082"
STATE = copy.deepcopy(SEED)
STATE.setdefault("group", {})["branding"] = {"accent": "#7A1FA2", "bar": TENANT_BAR}
PERSON = {"key": "smo", "name": "SMO", "role": "super"}

MODE = {"delay": 1.2, "status": 200}
errs, bad = [], 0


def ck(w, ok, x=""):
    global bad
    if not ok:
        bad += 1
    print(("  ok      " if ok else "  FAIL    ") + w + (("  — " + str(x)) if not ok and x else ""))


class H(http.server.BaseHTTPRequestHandler):
    def log_message(self, *a):
        pass

    def _send(self, code, body, ctype):
        self.send_response(code)
        self.send_header("Content-Type", ctype)
        self.send_header("Content-Length", str(len(body)))
        self.end_headers()
        self.wfile.write(body)

    def do_GET(self):
        if self.path.startswith("/api/state"):
            time.sleep(MODE["delay"])
            if MODE["status"] != 200:
                self._send(MODE["status"], b'{"ok":false}', "application/json")
                return
            body = json.dumps({"ok": True, "state": STATE, "person": PERSON}).encode()
            self._send(200, body, "application/json")
            return
        if self.path.startswith("/raya-trade"):
            self._send(200, HTML, "text/html; charset=utf-8")
            return
        # The gate, which is where a refused session is sent.
        self._send(200, GATE, "text/html; charset=utf-8")

    def do_POST(self):
        n = int(self.headers.get("Content-Length") or 0)
        self.rfile.read(n)
        self._send(200, b'{"ok":true}', "application/json")


# THE PLATFORM IS SERVED AT ITS REAL PATH (§35.6), AND `/` IS THE GATE.
# Serving the platform at `/` as well made the 401 case an infinite loop: the
# refusal sends the browser to `/`, which was the platform again, which asked
# again. The stub has to model the deployment, not just the one file under
# test — and that IS the fifth case, so getting it wrong hid it.
GATE = b"<!doctype html><title>Sign in</title><h1 id='gate'>Sign in</h1>"

srv = socketserver.ThreadingTCPServer(("127.0.0.1", 0), H)
srv.daemon_threads = True
PORT = srv.server_address[1]
threading.Thread(target=srv.serve_forever, daemon=True).start()
BASE = "http://127.0.0.1:%d" % PORT
URL = BASE + "/raya-trade"
print("serving the built file at " + URL)

SKELETON = """() => {
  const root = document.documentElement;
  const sk = document.getElementById("bootsk");
  const chrome = document.querySelector(".chrome");
  const banner = document.getElementById("banner");
  const bars = document.querySelectorAll(".bk");
  const vis = (el) => !!el && getComputedStyle(el).display !== "none";
  /* WHAT IS ACTUALLY PAINTED, not what a class implies. The fault was a
     COLOUR on screen, so the colour on screen is what is read. */
  const bg = (el) => el ? getComputedStyle(el).backgroundColor : null;
  return {
    booting: root.classList.contains("booting"),
    busy: root.getAttribute("aria-busy"),
    skeleton: vis(sk),
    chromeShown: vis(chrome),
    bannerShown: vis(banner),
    bars: bars.length,
    skBg: bg(sk),
    panelToken: getComputedStyle(root).getPropertyValue("--panel").trim(),
    navBg: bg(document.querySelector("nav.units")),
    /* ── WHAT IS PAINTED, NOT WHAT IS COMPUTED ──
       `getComputedStyle` on a `display:none` element still returns its
       background, so reading `nav.units` reported the navy bar as being on
       screen while the skeleton was correctly covering the whole chrome —
       §68.10's fault in the other direction, calling a correct build broken.
       Two measurements that cannot make that mistake: whether the bar has a
       BOX at all, and what is actually under a point at the top of the page. */
    navRendered: (function () {
      var n = document.querySelector("nav.units");
      return !!n && n.getClientRects().length > 0;
    })(),
    atTop: (function () {
      var el = document.elementFromPoint(20, 20);
      return el ? (el.closest("#bootsk") ? "skeleton"
                 : el.closest(".chrome") ? "chrome" : el.tagName.toLowerCase()) : null;
    })(),
    /* The page's own half. #panel is replaced wholesale by paint(), so the
       skeleton inside it cannot outlive the first real one. */
    pageSkeleton: !!document.querySelector(".bootpg"),
    painted: !!document.querySelector("#panel .view, #panel .bands, #panel .card, " +
                                      "#panel .split, #panel .note, #panel table")
  };
}"""


def rgb(h):
    h = h.lstrip("#")
    return "rgb(%d, %d, %d)" % tuple(int(h[i:i + 2], 16) for i in (0, 2, 4))


with sync_playwright() as p:
    b = p.chromium.launch(executable_path="/opt/pw-browsers/chromium",
                          args=["--no-sandbox", "--disable-dev-shm-usage"])

    def page():
        pg = b.new_page(viewport={"width": 1440, "height": 900})
        _no_tour(pg)
        pg.on("pageerror", lambda e: errs.append(str(e)))
        return pg

    # ── 1 · A SLOW ANSWER: the state the fault lived in ──────────────
    print("\n1 · while the database is answering")
    MODE["delay"], MODE["status"] = 1.2, 200
    pg = page()
    pg.goto(URL, wait_until="domcontentloaded")
    v = pg.evaluate(SKELETON)
    ck("the skeleton is up", v["skeleton"] is True, v)
    ck("...and says so to a screen reader", v["busy"] == "true", v["busy"])
    ck("the real chrome is hidden, not painted behind it", v["chromeShown"] is False, v)
    ck("...and the prototype banner with it", v["bannerShown"] is False, v)
    ck("the page's own blocks are there", v["pageSkeleton"] is True, v)
    ck("nothing of the real page is painted yet", v["painted"] is False, v)
    # THE MEASUREMENT THAT IS THE WHOLE POINT: what is on screen is the page's
    # own neutral, and NOT the bar colour --panel resolves to.
    ck("the skeleton wears the page's neutral, not the bar colour",
       v["skBg"] not in (None, "rgba(0, 0, 0, 0)") and v["skBg"] != rgb("#16325C"),
       "skeleton %s vs --panel %s" % (v["skBg"], v["panelToken"]))
    ck("...and the tenant's bar has no box on screen at all",
       v["navRendered"] is False, v["navBg"])
    ck("...so the top of the page IS the skeleton", v["atTop"] == "skeleton", v["atTop"])

    # ── 2 · AND THEN THE REAL PAGE, ONCE ────────────────────────────
    print("\n2 · when it lands")
    pg.wait_for_selector("#panel .bands, #panel .card, #panel table, #panel .note",
                         timeout=15000)
    pg.wait_for_timeout(300)
    v = pg.evaluate(SKELETON)
    ck("the skeleton is gone", v["skeleton"] is False and v["booting"] is False, v)
    ck("...and the busy flag with it", v["busy"] in (None, ""), v["busy"])
    ck("the real chrome is back", v["chromeShown"] is True, v)
    ck("...with a box, and at the top of the page",
       v["navRendered"] is True and v["atTop"] == "chrome", v["atTop"])
    ck("the page is painted", v["painted"] is True, v)
    # §201: a server that ANSWERED raises no wall.
    ck("no no-server wall on a live answer",
       pg.query_selector("#noserver") is None)
    # The tenant's branding is what is on screen — not the file's.
    ck("the bar wears the TENANT's colour, which the file does not hold",
       v["navBg"] == rgb(TENANT_BAR), "%s, wanted %s" % (v["navBg"], rgb(TENANT_BAR)))
    ck("...and it is the data from the server", "smo" in pg.evaluate("() => VIEWER || ''"),
       pg.evaluate("() => VIEWER"))
    pg.close()

    # ── 3 · A FAST ANSWER MUST NOT FLASH ────────────────────────────
    print("\n3 · a fast answer")
    MODE["delay"] = 0
    pg = page()
    t0 = time.time()
    pg.goto(URL, wait_until="domcontentloaded")
    pg.wait_for_selector("#panel .bands, #panel .card, #panel table, #panel .note",
                         timeout=15000)
    held = (time.time() - t0) * 1000
    v = pg.evaluate(SKELETON)
    ck("it still lands", v["painted"] is True and v["skeleton"] is False, v)
    # The floor is 180ms and it is a FLOOR, so anything at or above it is the
    # rule working; the assertion is that it was not zero.
    ck("...and the skeleton was held rather than blinked", held >= 150, "%dms" % held)
    pg.close()

    # ── 4 · NOBODY IS LEFT LOOKING AT GREY ──────────────────────────
    print("\n4 · when the database cannot be reached")
    MODE["delay"], MODE["status"] = 0, 500
    pg = page()
    pg.goto(URL, wait_until="domcontentloaded")
    pg.wait_for_selector("#panel .bands, #panel .card, #panel table, #panel .note",
                         timeout=15000)
    v = pg.evaluate(SKELETON)
    ck("the baked data is painted anyway", v["painted"] is True, v)
    ck("...and the skeleton came down", v["skeleton"] is False and v["booting"] is False, v)

    # ── §201: THE WALL. Islam, after a hard refresh met a hiccup: "it
    # opened on the prototype page with no way to exit it!!" — the baked
    # example painted SILENTLY, wearing Raya Trade's data as though it were
    # his. The example may paint (that is the fallback working); what may
    # not happen is nobody being told.
    #
    # §226.2 RESHAPED THE CARD AT ISLAM'S DIRECTION: "the message after 8
    # seconds is too technical for the users" — then "make a very simple
    # user message", then "no need for examples to look at". Four short
    # lines in the user's language (no "server", no "data", no "example"),
    # and the "look at the example anyway" way past is REMOVED — asserted
    # as an ABSENCE, or a build that quietly brought it back would pass.
    # a build that lost the wall must FAIL here, not crash the check (§192)
    try:
        pg.wait_for_selector("#noserver", timeout=8000)
    except Exception:
        pass
    w = pg.evaluate("""() => {
      const d = document.getElementById("noserver");
      if (!d) return { covers: false, atMid: false, saysMoment: false,
                       saysSafe: false, saysSelf: false, plainWords: false,
                       retryHits: false, noWayPast: false, missing: "no #noserver" };
      const card = d.querySelector(".nosrv-card");
      const txt = card ? card.textContent : "";
      const r = d.getBoundingClientRect();
      const mid = document.elementFromPoint(innerWidth / 2, innerHeight / 2);
      const btn = d.querySelector("[data-nosrv-retry]");
      const br = btn ? btn.getBoundingClientRect() : null;
      const hit = br ? document.elementFromPoint(br.left + br.width / 2,
                                                 br.top + br.height / 2) : null;
      /* a fixed inset:0 box stops at the demo page's scrollbar (~15px), so
         the tolerance is a scrollbar's width — what matters is measured
         separately: the point in the MIDDLE lands on the wall */
      return { covers: r.width >= innerWidth - 30 && r.height >= innerHeight - 30,
               atMid: !!(mid && mid.closest("#noserver")),
               saysMoment: txt.indexOf("Just a moment") >= 0,
               saysSafe: txt.indexOf("Your work is safe") >= 0,
               saysSelf: txt.indexOf("open by itself") >= 0,
               plainWords: !/server|data|example/i.test(txt),
               retryHits: hit === btn,
               noWayPast: !d.querySelector("[data-nosrv-view]") };
    }""")
    ck("the wall is up and covers the page", w["covers"] and w["atMid"], w)
    ck("...it speaks the user's language: a moment, work safe, opens by itself",
       w["saysMoment"] and w["saysSafe"] and w["saysSelf"], w)
    ck("...with no technical word on it (server, data, example)",
       w["plainWords"], w)
    ck("...Try again is really reachable (a press lands on it)", w["retryHits"], w)
    ck("...and the removed way past stays removed (§226.2)", w["noWayPast"], w)

    # The retry is a reload: with the server answering again it must land
    # LIVE and wall-free. On a build with no wall there is nothing to
    # press, and that is already five failures above; report this one
    # rather than hanging on a click (§192).
    if w.get("missing"):
        ck("Try again reloads into the live tenant, no wall", False, w)
    else:
        MODE["status"] = 200
        pg.click("[data-nosrv-retry]")
        pg.wait_for_selector("#panel .bands, #panel .card, #panel table, #panel .note",
                             timeout=15000)
        pg.wait_for_timeout(400)
        ck("Try again reloads into the live tenant, no wall",
           pg.query_selector("#noserver") is None
           and pg.evaluate("() => !!document.querySelector('nav.units')"))
    pg.close()

    # ── 5 · REFUSED IS NOT A PAINT ──────────────────────────────────
    # 401 sends the browser to the gate. Painting there would draw a page
    # nobody sees, over data this person is not entitled to — so the skeleton
    # stays up until the navigation happens, and that is correct.
    print("\n5 · when the session is refused")
    MODE["status"] = 401
    pg = page()
    pg.goto(URL, wait_until="domcontentloaded")
    pg.wait_for_selector("#gate", timeout=15000)
    ck("the browser is sent to the gate", pg.url.rstrip("/") == BASE,
       pg.url)
    ck("...and the platform was never painted on the way",
       pg.evaluate("() => !document.querySelector('#panel')"), pg.url)
    pg.close()

    # ── 6 · A LATE ANSWER STILL LANDS (§226) ────────────────────────
    # Islam, hard-refreshing after every deployment: the wall, every time —
    # a cold function's first answer routinely arrives a few seconds AFTER
    # the 8s give-up. The answer was being dropped: hydrate() had run and
    # `live` was true, but the one-shot land() swallowed the paint, so the
    # person sat behind the wall while their real data was in memory,
    # waiting for the probe's reload. The wall must go up (that is §201
    # unchanged) and then come down BY ITSELF — no click, no reload — with
    # the live tenant painted in place. On the pre-§226 build the wall
    # stands until the probe reloads, so both halves below fail there.
    print("\n6 · when the answer arrives after the give-up")
    MODE["delay"], MODE["status"] = 10.5, 200
    pg = page()
    pg.goto(URL, wait_until="domcontentloaded")
    pg.evaluate("() => { window.__noReload = 1; }")
    try:
        pg.wait_for_selector("#noserver", timeout=11000)
        walled = True
    except Exception:
        walled = False
    ck("the wall still goes up at the give-up", walled)
    try:
        pg.wait_for_selector("#noserver", state="detached", timeout=8000)
        downed = True
    except Exception:
        downed = False
    ck("...and comes down by itself when the answer lands", downed)
    v = pg.evaluate(SKELETON)
    ck("...with the LIVE tenant painted in place (the bar wears its colour)",
       v["navBg"] == rgb(TENANT_BAR), "%s, wanted %s" % (v["navBg"], rgb(TENANT_BAR)))
    ck("...as the server's own data", "smo" in (pg.evaluate("() => VIEWER || ''") or ""),
       pg.evaluate("() => VIEWER"))
    # In place means IN PLACE: the flag set before the wait survives, so this
    # was a paint, never the probe's reload wearing the fix's clothes.
    ck("...and nothing reloaded on the way", pg.evaluate("() => window.__noReload") == 1)
    pg.close()


    print("\nerrors:", errs or "none")
    print("ALL GREEN" if bad == 0 and not errs else "%d FAILED" % bad)
    b.close()
srv.shutdown()
raise SystemExit(1 if bad or errs else 0)
