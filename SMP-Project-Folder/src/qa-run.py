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

target = sys.argv[1] if len(sys.argv) > 1 else "qa.py"
sys.argv = [target] + sys.argv[2:]
runpy.run_path(target, run_name="__main__")
