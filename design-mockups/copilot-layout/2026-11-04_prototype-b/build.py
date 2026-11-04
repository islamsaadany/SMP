"""Prototype B — the Copilot on the plan, on a copy of the real platform build.
Run from the repo root:  python3 design-mockups/copilot-layout/2026-11-04_prototype-b/build.py OUT.html
Takes SMP-Project-Folder/strategy-management-platform-v3.22.html, drops its CSP meta (the copy is a
prototype; the injected script is not in its hash list), and appends inject.html at the end."""
import re, sys, pathlib
here = pathlib.Path(__file__).parent
src = (here / "../../../SMP-Project-Folder/strategy-management-platform-v3.22.html").read_text()
m = re.search(r'<meta http-equiv="Content-Security-Policy"[^>]*>', src)
if m: src = src[:m.start()] + src[m.end():]
src = src.replace("<title>Raya Trade — Strategy Management Platform</title>", "<title>Prototype B — Copilot on the Plan</title>", 1)
# Served over https (the artifact), the sync layer would talk to a server that is not there and send the
# page to the sign-in address; the prototype runs on its own demo data, as the file does from disk.
old = 'var enabled = typeof location !== "undefined" &&\n    (location.protocol === "http:" || location.protocol === "https:");'
assert src.count(old) == 1, "sync switch not found"
src = src.replace(old, "var enabled = false; /* prototype: standalone */", 1)
pathlib.Path(sys.argv[1] if len(sys.argv) > 1 else "proto-b.html").write_text(src + (here / "inject.html").read_text())
