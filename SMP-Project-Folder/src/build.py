# chat.css and tour.css are concatenated LAST, beside arrange.css and for the
# same reason: they are furniture that floats over the page, and a rule that
# loses to `.cfg table` on source order is a rule that silently does nothing
# (§93.11).
css = (open('_shared.css').read() + "\n" + open('group-extra.css').read()
       + "\n" + open('config.css').read() + "\n" + open('arrange.css').read()
       + "\n" + open('present.css').read() + "\n" + open('chat.css').read()
       + "\n" + open('tour.css').read() + "\n" + open('welcome.css').read()
       + "\n" + open('builder.css').read())
shell = open('shell.html').read()

# lib/rules.js is the SHARED one — the same file api/state.js requires. It is
# inlined FIRST so config-data.js can alias it. Two copies of "may this person
# edit this" would drift, and the drift is silent: a screen that offers an edit
# the server then refuses (spec 006 §2).
for tag, f in [("RULES","../../lib/rules.js"), ("DIFF","../../lib/graph-diff.js"),
               ("AUDIENCE","../../lib/audience.js"),
               ("DATA","group-data.js"), ("CONFIGDATA","config-data.js"),
               ("ARRANGE","arrange.js"), ("PAGEINFO","pageinfo.js"), ("RECIPES","recipes.js"), ("TEMPLATES","templates.js"), ("XLSX","xlsx.js"),
               ("PPTX","pptx.js"),
               ("MAIL","mail.js"),
               ("RENDER","group-render.js"), ("CONFIGRENDER","config-render.js"), ("BUILDER","builder.js"), ("PRESENT","present.js"), ("SLIDES","slides.js"),
               ("SEARCHSEL","searchsel.js"), ("CHAT","chat.js"), ("TOUR","tour.js"), ("WELCOME","welcome.js"), ("SYNC","sync.js")]:
    shell = shell.replace('<script src="%s"></script>' % tag, '<script>\n' + open(f).read() + '\n</script>')
# The icon travels INSIDE the built file, as a data URI, because the file has
# to carry everything it needs — opened from a memory stick it still shows its
# own mark in the tab. It is the Strategy Temple, the platform's own drawing:
# pediment, architrave, three pillars, stylobate, in the house navy and gold.
# The SVG is what modern browsers use; the PNG is there for the ones that will
# not take an SVG favicon. Both are generated from favicon.svg at the repo root
# (see the note beside it) — regenerate both together if the mark changes.
ICON = (
  '<link rel="icon" type="image/svg+xml" href="data:image/svg+xml,%3Csvg%20xmlns=%22http://www.w3.org/2000/svg%22%20width=%2232%22%20height=%2232%22%20viewBox=%220%200%2032%2032%22%3E%20%3Crect%20width=%2232%22%20height=%2232%22%20rx=%226%22%20fill=%22%2316325C%22/%3E%20%3Cpath%20d=%22M16%205.2%2027.4%2012H4.6z%22%20fill=%22%23C9A24D%22/%3E%20%3Crect%20x=%225.2%22%20y=%2213.2%22%20width=%2221.6%22%20height=%222.4%22%20fill=%22%23C9A24D%22/%3E%20%3Crect%20x=%227.2%22%20y=%2217%22%20width=%223.2%22%20height=%227.4%22%20fill=%22%23C9A24D%22/%3E%20%3Crect%20x=%2214.4%22%20y=%2217%22%20width=%223.2%22%20height=%227.4%22%20fill=%22%23C9A24D%22/%3E%20%3Crect%20x=%2221.6%22%20y=%2217%22%20width=%223.2%22%20height=%227.4%22%20fill=%22%23C9A24D%22/%3E%20%3Crect%20x=%224.4%22%20y=%2225.6%22%20width=%2223.2%22%20height=%222.8%22%20rx=%220.6%22%20fill=%22%23C9A24D%22/%3E%20%3C/svg%3E">' "\n"
  '<link rel="icon" type="image/png" sizes="32x32" href="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACAAAAAgCAYAAABzenr0AAACh0lEQVR4nOyXy2sTURTGvzuZacb4qpY+sEhc+FhowUQUQSmUgHFZQS3WulBEfHSh/huCbnwUETfaCnVRXYitEAKiKIqNUgXRLAw+aCOVWGOcaWZyvHdC2wRjOknTSRf9LZIzdy5zvjln7j33yMihwdd5hMDaubmTMbYGFYSIvvG/5wx0Lx7puzU1zsRPra/TqzB2nYHtgQMQ6FGa6EQi0heTxIAC1uuUc4HwpTDptmXX+7uO8jDcRBUg4BiPAHWgalCHzAhbs19CaUgSYZ9v0rIHIjXIZEp/iPAtg7FGlMiWZgOnAymsXU3WdWCzjqshD95+lVES3Ddr8HeR3fl1y0wcb9Wwe6NR8P6TDzJuPFYxnnTBLrYEKC4ebr+OAzs0qErxUGtpwt0XKgaG3Uibs6dlVgF+bxqn2v6gqdZ2oCxGEwzXwkswHFNQloCmlSZOtmnYts7AXHj1SUZPWMXoT5c9AapC2L9d5yHXUCOXsTwKMGkQT4nKU+OGbrDiApym4Lo5HxRLzEQl+fzDhYtDHtgSIJyvb8zACQoKeBZVEI1XVsD3CQm2BfS/VOEURffOS4d+TafickjF0Ih7+t4ZvhXvbUlb9uCIgiuhmfwGW3R0BzTLjo5JOHdneXkCnGBRwKKAhS2gnxePFZ5sqXj3JX9q+H0N36yyFU5ss7mIuWLZCiZSxQvaP8XIW2di14Y05oOnHxXExvPFyrxlGcs9Fx7kp57WTXM7A/yP5lUmLjxcOjPAfUvE8Dp30m+9MmeAQiS1/HogfMv8ON3jkhCcGnzwxo1ESsJ8IFKQi/BtvW69//Agb5eCcBKi+/FIb7v1qhmWOcv7JB0OwTvlpGGiW9h5Ca9Ge/4XAAD//5ZnhOIAAAAGSURBVAMAdNLgS2NC1g8AAAAASUVORK5CYII=">')

# ── The typefaces travel inside the file too ────────────────────────────
# Same rule as the icon: opened from a memory stick with no network, the
# platform still has to look like itself. A <link> to a font host would break
# that, and would put a request to a third party on every load of a file
# holding a client's strategy.
#
# ONE EMBEDDED FACE, NOT FOUR (§157). Four rode in every build from §38.7 so
# they could be compared in the real product — "B is how you decide, A is how
# you ship" — and Islam has now decided: the system stack and Source Sans 3,
# nothing else. Inter, Manrope and IBM Plex Sans leave the file with their
# .woff2 files, which is 116 KB off every handover and three faces that can no
# longer drift out of step with the switch that offers them.
#
# A Latin subset of a variable face, so the whole family costs 28 KB rather
# than the several hundred a static family per weight would. font-display:swap
# so text is readable while it decodes rather than invisible — the data URI
# decodes almost instantly, but swap is what makes the failure mode "the system
# font" instead of "nothing", which is also the other option on the switch.
import base64, glob, os
FACES = [("Source Sans 3", "fonts/Source_Sans_3.woff2")]
faces_css = []
for family, path in FACES:
    if not os.path.exists(path):
        raise SystemExit("missing font: " + path + " (see fonts/README.md)")
    b64 = base64.b64encode(open(path, "rb").read()).decode()
    faces_css.append(
        "@font-face{font-family:'%s';font-style:normal;font-weight:400 800;"
        "font-display:swap;src:url(data:font/woff2;base64,%s) format('woff2')}" % (family, b64))
css = "\n".join(faces_css) + "\n" + css

# THE <html> TAG IS WRITTEN OUT, for `lang` (§48.5). The file relied on the
# parser inserting an implicit one, which works for rendering and gives a screen
# reader no language to pronounce the page in — every one of the 22 page states
# failed on it. theme.js stamps data-theme and data-palette on the same element
# at runtime, so declaring it here changes nothing about how those work.
out = ("<!doctype html>\n<html lang='en'>\n<meta charset='utf-8'>\n"
       "<meta name='viewport' content='width=device-width,initial-scale=1'>\n"
       + ICON + "\n"
       # Root-absolute, and harmless when it 404s on file:// — the platform has
       # to stay openable from a memory stick. The worker itself is registered
       # by the gate, not here: its scope is the whole origin and you cannot
       # reach this file without signing in there first.
       '<link rel="manifest" href="/manifest.webmanifest">\n'
       '<meta name="theme-color" content="#16325C" media="(prefers-color-scheme: light)">\n'
       '<meta name="theme-color" content="#14161A" media="(prefers-color-scheme: dark)">\n'
       "<title>Raya Trade \u2014 Strategy Management Platform</title>\n<style>\n"
       + css + "\n</style>\n"
       # The theme is chosen in the HEAD, before the body is parsed, so a
       # person who picked dark never sees the page paint light and flip.
       # It has to be inline for the same reason the icon is a data URI:
       # the file has to carry everything it needs.
       "<script>\n" + open('theme.js').read() + "\n</script>\n\n" + shell)

# ── THE BUILT PAGE HAS TO PARSE (§69.22) ────────────────────────────────
# `node --check` sees the .js sources and CANNOT see inline script in HTML, so
# a stray brace spliced into shell.html passed every file-level check and
# produced a page that died on load with "Unexpected token ')'" — a blank
# platform, and nothing anywhere said why.
#
# So the build refuses to emit a page whose script does not parse. Every
# <script> block is pulled out and run through `new Function`, which parses
# without executing. It costs one node invocation and it is the only check
# that looks at what is actually SHIPPED.
import json, re, shutil, subprocess, sys, tempfile

def check_scripts(html):
    if not shutil.which("node"):
        print("  ! node not found — the built page was NOT parse-checked")
        return
    blocks = re.findall(r"<script>([\s\S]*?)</script>", html)
    with tempfile.NamedTemporaryFile("w", suffix=".json", delete=False) as f:
        json.dump(blocks, f)
        path = f.name
    js = ("const b=require(" + json.dumps(path) + ");let bad=[];"
          "b.forEach(function(s,i){try{new Function(s);}catch(e){bad.push(i+': '+e.message);}});"
          "if(bad.length){console.error(bad.join('\\n'));process.exit(1);}"
          "console.log('  '+b.length+' script blocks parse');")
    r = subprocess.run(["node", "-e", js], capture_output=True, text=True)
    sys.stdout.write(r.stdout)
    if r.returncode:
        sys.stderr.write("BUILD REFUSED — the built page does not parse:\n" + r.stderr)
        sys.exit(1)

# ── A CSP SAFETY-NET, HASHED AT BUILD TIME (2026-09-01 security sweep) ───────
# The XSS holes are closed by escaping (§235), but this is defence in depth: if
# an escaping gap is ever reintroduced, an injected inline handler (onerror=,
# onfocus=) must still not RUN. The vercel.json header keeps script-src
# 'unsafe-inline' (the gate needs it, and it is not built here); this meta adds
# a SECOND, stricter policy scoped to the platform page — every legitimate
# inline <script> is allow-listed by the SHA-256 of its exact contents, and
# nothing else inline can execute. The browser enforces both policies, so a
# script must pass both: the real blocks pass (hash + unsafe-inline), an
# injected handler is blocked by this one (no hash, no unsafe-inline).
#
# HASHED HERE, SO IT CAN NEVER GO STALE. The whole danger of a hashed CSP is a
# hash that no longer matches the page (§91's "a stale hash is a page that does
# not load"). Computing it in the same build that emits the scripts makes drift
# impossible by construction — the hashes are of exactly the bytes shipped.
#
# ONLY script-src is set, so styles/images/etc. stay governed by the header and
# nothing else about the page's policy changes. The meta is placed immediately
# after <meta charset> so it precedes every <script> it must govern. The app
# adds all its handlers with addEventListener and injects no <script> at
# runtime (verified), so nothing legitimate relies on inline execution.
import hashlib
def csp_meta(html):
    blocks = re.findall(r"<script>([\s\S]*?)</script>", html)
    hashes = ["'sha256-" + base64.b64encode(
        hashlib.sha256(b.encode("utf-8")).digest()).decode() + "'" for b in blocks]
    return ('<meta http-equiv="Content-Security-Policy" '
            'content="script-src \'self\' ' + " ".join(hashes) + '">')

_meta = csp_meta(out)
_anchor = "<meta charset='utf-8'>\n"
assert out.count(_anchor) == 1, "charset meta anchor not found exactly once"
out = out.replace(_anchor, _anchor + _meta + "\n", 1)

check_scripts(out)
open('strategy-management-platform.html','w').write(out)
print("built", len(out))
