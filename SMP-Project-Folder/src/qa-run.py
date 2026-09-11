#!/usr/bin/env python3
"""Run qa.py (or another sweep) against the Chromium this cloud image already
carries.

The image ships build 1194 at /opt/pw-browsers/chromium and pip installs
whatever playwright is current, which wants a different build number and a
headless-shell binary that is not there. `playwright install` is explicitly not
the answer (the environment says so, and there is no download).

So the launch is patched, not the sweep: qa.py stays the file that runs on a
laptop unchanged, and this wrapper supplies `executable_path` and the sandbox
flags a container needs. Usage: python3 qa-run.py [qa.py|scripts/....py]
"""
import os, sys, runpy
from playwright.sync_api import BrowserType

CHROME = os.environ.get("SMP_CHROME", "/opt/pw-browsers/chromium")
_launch = BrowserType.launch

def launch(self, **kw):
    kw.setdefault("executable_path", CHROME)
    kw["args"] = list(kw.get("args") or []) + ["--no-sandbox", "--disable-dev-shm-usage"]
    return _launch(self, **kw)

BrowserType.launch = launch

# THE SERVED SHELL CARRIES `script-src 'self'` AND NOTHING ELSE (spec 043
# Phase B) — which refuses the eval Playwright's Python `evaluate(<string>)`
# runs the checks' probes through. The checks are not the product, so under
# SMP_BASE every context bypasses the page's policy for its own probes; the
# policy itself is asserted by smp-app/checks/shell.mjs, which does not.
if os.environ.get("SMP_BASE"):
    from playwright.sync_api import Browser
    _new_page, _new_context = Browser.new_page, Browser.new_context
    # AND THE CHAT CORNER TAKES CLICKS THAT ARE NOT ITS OWN (§97, §167.2).
    # The corner is deliberately NOT DRAWN over `file://` — there is no server
    # to answer it — so every screen check ever written has been written on a
    # page that does not have one, and against the served app a fixed 60px
    # bubble now sits over the bottom-right corner of every page: Playwright
    # clicks an element's CENTRE, so a control whose centre lands under it is
    # reported as unreachable and the file dies retrying (§215). §167.2's own
    # finding, with the welcome overlay swapped for the chat dock.
    #
    # POINTER-EVENTS, NEVER `display:none`: hiding it would change what a
    # contrast or layout probe measures, and the corner is a real part of the
    # served page.
    #
    # AND NEVER FOR A CHECK THAT SERVES ITS OWN APP. That stand-down happens
    # BELOW this block — the wrappers are installed while SMP_BASE is still
    # set, and only then is it popped — so without this an own-server check run
    # through a runner that sets SMP_BASE would have the corner in ITS OWN stub
    # made unclickable, and every one of the twelve whose subject IS the corner
    # would die retrying a press (§215) looking exactly like a product fault.
    # Latent rather than seen, because those twelve were run with SMP_BASE
    # unset; found by asking who uses the escape hatch this once had, and the
    # answer is that nobody can — §94.11 forces a chat check to serve its own
    # stub, so own-server IS the condition and a second mark was one more thing
    # to forget (§24, §104.7).
    _CHAT_STAND_DOWN = """(() => { const put = () => {
        const s = document.createElement('style');
        s.textContent = '#chatdock{pointer-events:none !important}';
        (document.head || document.documentElement).appendChild(s); };
      if (document.head) put(); else document.addEventListener('DOMContentLoaded', put); })()"""
    _serves_own = False
    try:
        with open(sys.argv[1] if len(sys.argv) > 1 else "qa.py") as _f:
            _serves_own = "qa-run: own-server" in _f.read(4000)
    except OSError:
        pass
    def _stand_down(o):
        if not _serves_own:
            try: o.add_init_script(_CHAT_STAND_DOWN)
            except Exception: pass
        return o
    def new_page(self, **kw): kw.setdefault("bypass_csp", True); return _stand_down(_new_page(self, **kw))
    def new_context(self, **kw): kw.setdefault("bypass_csp", True); return _stand_down(_new_context(self, **kw))
    Browser.new_page, Browser.new_context = new_page, new_context

# ── AND A CHECK OPENS THE PRODUCT WHEREVER THE PRODUCT IS (spec 043, Phase C)
# Every check names the built file — `file://…/strategy-management-platform.html`
# — because until now that WAS the product. On the new stack the product is a
# page a person signs in to, and re-pointing 158 checks one at a time is 158
# chances to point one at something else (§53.5). So the wrapper answers it
# once: under SMP_BASE a goto of the built file signs in at the client's own
# door and opens a real page instead, and the frozen sources are untouched.
#
# The sign-in happens ONCE per browser context: a check that opens the file
# twice is navigating, not signing in again, and doing it per goto would cost
# a round trip on every navigation and lose whatever the check had set up.
# A CHECK THAT STANDS UP ITS OWN SERVER IS NOT RE-POINTED (§316.1). Forty-odd
# checks serve the built file themselves so they can answer /api/state with a
# state the running app cannot be made to hold — a graph poisoned with a null,
# a 500, a slow answer, a dataset that moves mid-run. Their subject is the
# CLIENT judged against a controlled server, and `sync.js` is carried into the
# app verbatim, so they exercise the same code either way; what the served app
# cannot give them is the server half. Such a check says so in its own first
# lines and SMP_BASE is stood down for it — never a list of names in this file,
# which is a list somebody forgets to add to (§104.7).
_OWN_SERVER = "qa-run: own-server"
if os.environ.get("SMP_BASE"):
    try:
        with open(sys.argv[1] if len(sys.argv) > 1 else "qa.py") as _f:
            if _OWN_SERVER in _f.read(4000):
                print("(SMP_BASE stood down: this check serves its own app — %s)" % _OWN_SERVER)
                os.environ.pop("SMP_BASE", None)
    except OSError:
        pass
if os.environ.get("SMP_BASE"):
    import re as _re
    from playwright.sync_api import Page
    _BASE = os.environ["SMP_BASE"].rstrip("/")
    _EMAIL = os.environ.get("SMP_QA_EMAIL", "office@forefront.example")
    _PW = os.environ.get("SMP_QA_PASSWORD", "")
    _HOME = os.environ.get("SMP_QA_HOME", "/raya-trade/mobile/strategy")
    _FILE = _re.compile(r"strategy-management-platform[^/]*\.html")
    _STUB = _re.compile(r"^https?://(127\.0\.0\.1|localhost):\d+/raya-trade/?$")
    _goto = Page.goto
    _signed = set()
    def _open(self, **kw):
        ctx = self.context
        if id(ctx) not in _signed:
            _goto(self, _BASE + "/raya-trade/sign-in", wait_until="networkidle")
            self.wait_for_selector(".gate[data-hydrated]", state="attached", timeout=20000)
            self.fill("#user", _EMAIL); self.fill("#password", _PW)
            self.click("#loginForm button[type=submit]")
            self.wait_for_url("**/raya-trade", timeout=20000)
            _signed.add(id(ctx))
        r = _goto(self, _BASE + _HOME, **kw)
        # The boot is a fetch now, not a parse: wait for the shell to have
        # painted the tenant rather than for a guessed number of milliseconds.
        self.wait_for_function("!document.documentElement.classList.contains('booting')", timeout=25000)
        return r
    def goto(self, url, **kw):
        if _FILE.search(url or "") or _STUB.match(url or ""):
            return _open(self, **kw)
        return _goto(self, url, **kw)
    Page.goto = goto

    # ── A VIEWER SWITCH IS ASYNCHRONOUS OVER HTTP (§237) ─────────────────
    # `switchViewer` flushes, rebases the tab on the server's graph and only
    # then switches — or, refused, does not switch at all and puts the select
    # back (§209). A check that reads the page a few hundred milliseconds
    # after picking measures whoever happened to be there. So a pick of the
    # viewer settles first, and says on stderr when the switch never took.
    _sel = Page.select_option
    def select_option(self, selector, value=None, **kw):
        r = _sel(self, selector, value, **kw)
        if selector in ("#asWho", "select#asWho"):
            want = value if isinstance(value, str) else None
            try:
                self.wait_for_function(
                    "() => document.getElementById('asWho').value === window.VIEWER",
                    timeout=20000)
            except Exception:
                pass
            if want is not None and self.evaluate("window.VIEWER") != want:
                print("  (switch to %r never took — the flush before it was refused)" % want,
                      file=sys.stderr)
        return r
    Page.select_option = select_option

    # ── AND A REFUSAL SAYS WHICH AND WHY (§124) ─────────────────────────
    # A browser reports a refused save as "403 (Forbidden)" and nothing more,
    # and a check that collects console errors collects exactly that. The
    # server's own sentence is printed beside it, with the viewer it was
    # judged as, so a refusal names where it belongs rather than a number.
    def _said(r):
        if "/api/" not in r.url or r.status < 400: return
        # The BODY SENT, not the answer: the sync API drains these events when
        # the run ends, by which time the page is closed and a response body
        # can no longer be read — while what was asked for is on the request
        # and says which change the server refused.
        try: sent = (r.request.post_data or "")
        except Exception: sent = "?"
        if os.environ.get("SMP_DUMP"):
            open(os.environ["SMP_DUMP"], "w").write(sent)
        print("  (%s %s -> %d, sent %s)" % (r.request.method, r.url.split("/api/")[-1], r.status, sent[:300]),
              file=sys.stderr, flush=True)
    _newpage = Browser.new_page
    def new_page_said(self, **kw):
        pg = _newpage(self, **kw); pg.on("response", _said); return pg
    Browser.new_page = new_page_said
    _ctxpage = None

    # ── AND A CHECK THAT SETS `VIEWER` BY HAND FLUSHES FIRST (§204) ──────
    # Thirty-one checks change who they are looking as by assigning `VIEWER`
    # rather than by pressing the switcher. Over `file://` that is harmless,
    # because nothing is ever saved; against a server it is §204's own hazard
    # — the office's unsaved work rides into the next save and is judged as
    # the person now being simulated (§185), which for a custodian correcting
    # a plan is a refusal (§94), reported as a bare 403 on the console.
    # `switchViewer`'s FIRST act is that flush; the wrapper puts it back where
    # a check goes round the control. Nothing about any assertion moves.
    _eval = Page.evaluate
    _VSET = _re.compile(r"\bVIEWER\s*=[^=]")
    _FLUSH = ("() => new Promise(function (r) { try { (window.SYNC && SYNC.saveNow)"
              " ? SYNC.saveNow(function () { r(1); }) : r(0); } catch (e) { r(0); } })")
    def evaluate(self, expression, *a, **kw):
        if isinstance(expression, str) and _VSET.search(expression):
            try: _eval(self, _FLUSH)
            except Exception: pass
        return _eval(self, expression, *a, **kw)
    Page.evaluate = evaluate

target = sys.argv[1] if len(sys.argv) > 1 else "qa.py"
sys.argv = [target] + sys.argv[2:]
runpy.run_path(target, run_name="__main__")
