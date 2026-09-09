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
    def new_page(self, **kw): kw.setdefault("bypass_csp", True); return _new_page(self, **kw)
    def new_context(self, **kw): kw.setdefault("bypass_csp", True); return _new_context(self, **kw)
    Browser.new_page, Browser.new_context = new_page, new_context

target = sys.argv[1] if len(sys.argv) > 1 else "qa.py"
sys.argv = [target] + sys.argv[2:]
runpy.run_path(target, run_name="__main__")
