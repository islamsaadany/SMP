"""NO GREY DESCRIPTION UNDER A HEADING (§548, rule 1b-ii).

Usability audit, heuristic 8 — the one the audit measured only halfway and
said so: it counted the `.why` and `.note` strings and admitted in its own
words that it did NOT read them to say whether any is a description rather
than information. *"That needs a page-by-page pass and is the honest limit of
this finding."* This is that pass, turned into something that stays true.

THE RULE, in Islam's words: *"remove the grey descriptions and stop adding
descriptions to pages."* A heading names the thing; a paragraph under it in
grey saying the same thing again is furniture, and it pushes the content
people came for further down. And where a sentence DOES carry a fact the
screen does not otherwise state, the rule is equally explicit about where it
goes: *"it is information, and it belongs on a hover ... never as a
paragraph."*

WHAT THE PASS FOUND, so the next reader does not repeat it: 257 `.why` and
`.note` strings — 185 built from a value (a fact by construction), 18 a bare
mark, and some fifty of real prose which are pending states ("Asking…"),
empty states ("Nothing planned yet."), values on a row, and warnings about
consequence. NOT ONE is a description, and §127 already settles the empty
states: it kept "No one is set" because A STATUS IS NOT A DESCRIPTION.

AND THE AUDIT WAS WRONG THE OTHER WAY on the half it did measure. It reports
ZERO `note:` arguments passed to `section()`. There were THREE. Two appear
only when there is something true to say — no factor values entered, nothing
written yet — which §127 protects. The third stood on the page every time,
and §548 moved it to `section()`'s own hover.

What is asserted, and why each end matters (§94.2):

  - NO HEADING IS FOLLOWED BY A GREY PARAGRAPH, over the built file. This is
    the rule's own shape rather than a judgement about tone, so it cannot
    drift with whoever runs it;
  - NO `section()` CALL CARRIES A STANDING NOTE. The two that remain are
    CONDITIONAL — written `x ? null : "..."` — and that is asserted as the
    shape, because the difference between a description and an empty state is
    exactly whether it is there when there is nothing to say;
  - AND THE FACT SURVIVED THE MOVE. The sentence §548 took off the page is
    asserted to be IN the build, on a hover — a check that only counted
    paragraphs would be satisfied by deleting it, which is the one outcome
    the rule forbids ("flag it rather than deleting it silently").

SMP_BUILT points it at another build, so it can be run against the build
before (§276: a broken build is made from the SOURCES).
"""
import os, re
from playwright.sync_api import sync_playwright

BUILT = os.environ.get("SMP_BUILT") or os.path.join(
    os.path.dirname(__file__), "..", "strategy-management-platform.html")
URL = "file://" + os.path.abspath(BUILT)

bad = 0
def ck(w, ok, x=""):
    global bad
    if not ok: bad += 1
    print(("  ok      " if ok else "  FAIL    ") + w + (("  — %s" % (x,)) if not ok and x != "" else ""))

src = open(os.path.abspath(BUILT), encoding="utf-8").read()
# BLANKED, NOT REMOVED. An earlier run of this pass stripped the comments
# outright and every line number after the first comment was wrong — it
# reported a heading-followed-by-a-note that does not exist in the file. The
# newlines stay so a position still means something (§94.2).
code = re.sub(r"/\*.*?\*/", lambda m: re.sub(r"[^\n]", " ", m.group(0)), src, flags=re.S)

print("\n§1 · no heading is followed by a grey paragraph")
near = [m for m in re.finditer(r'</(h1|h2|h3|h4)>(.{0,120}?)class="(why|note)', code, re.S)]
ck("no <h1>-<h4> is followed by a .why or .note", not near,
   [code[:m.start()].count("\n") + 1 for m in near][:4])

print("\n§2 · no section() carries a standing note")
def args_of(s, i):
    depth = 1; out = [""]; q = None
    while i < len(s) and depth:
        c = s[i]
        if q:
            if c == "\\": out[-1] += s[i:i+2]; i += 2; continue
            if c == q: q = None
        elif c in "\"'": q = c
        elif c in "([{": depth += 1
        elif c in ")]}":
            depth -= 1
            if not depth: break
        elif c == "," and depth == 1: out.append(""); i += 1; continue
        out[-1] += c; i += 1
    return out

EMPTY = ("", '""', "''", "null", "undefined", "0", "false")
standing, conditional = [], []
# NOT THE DEFINITION. `function section(eyebrow, title, note, body, ...)` names
# its third parameter `note`, so a scan for calls reads the declaration as a
# call carrying a standing note — which it reported on its first run.
for m in re.finditer(r'(?<![\w.])section\s*\(', code):
    if re.search(r"function\s+$", code[max(0, m.start() - 12):m.start()]): continue
    a = args_of(code, m.end())
    if len(a) < 3: continue
    note = a[2].strip()
    if note in EMPTY: continue
    line = code[:m.start()].count("\n") + 1
    # CONDITIONAL is the shape that makes an empty state an empty state: it is
    # not there when there is nothing to say.
    (conditional if "?" in note and "null" in note else standing).append((line, note[:70]))
ck("every note a section carries is conditional, never standing",
   not standing, standing[:3])
ck("...and the two conditional ones are still there, rather than deleted away",
   len(conditional) == 2, [c[0] for c in conditional])

print("\n§3 · and the fact that moved is still in the product")
FACT = "Written when it was sent, so it is what actually happened"
ck("the sentence survived the move", FACT in code)
ck("...and is no longer passed as a section's note",
   not any(FACT in n for _, n in standing + conditional))

with sync_playwright() as p:
    b = p.chromium.launch(executable_path="/opt/pw-browsers/chromium",
                          args=["--no-sandbox", "--disable-dev-shm-usage"])
    pg = b.new_page(viewport={"width": 1100, "height": 800})
    errs = []
    pg.on("pageerror", lambda e: errs.append(str(e)))
    pg.goto(URL); pg.wait_for_timeout(1600)

    print("\n§4 · drawn, it is a hover on the heading and not a paragraph")
    drew = pg.evaluate("""(fact) => {
      const w = document.createElement('div');
      w.id = 'greyfix';
      w.innerHTML = section("", "Who got \\u201cQ3\\u201d", null, "<p>body</p>", fact);
      document.body.appendChild(w);
      const h = w.querySelector('h2');
      const t = w.querySelector('.tip');
      return { heading: !!h,
               tipInHeading: !!(h && h.querySelector('.tip')),
               says: t ? (t.getAttribute('data-tip') || '') : '',
               greyPara: w.querySelectorAll('.why, .note').length };
    }""", FACT)
    ck("the section still has its heading", drew.get("heading"), drew)
    ck("...with the fact on a hover INSIDE it", drew.get("tipInHeading"), drew)
    ck("...carrying the words themselves", FACT in (drew.get("says") or ""), drew)
    ck("...and no grey paragraph under it", drew.get("greyPara") == 0, drew)
    pg.evaluate("() => { const w = document.getElementById('greyfix'); if (w) w.remove(); }")
    ck("no page errors", not errs, errs[:3])
    b.close()

print("\n%d failure(s)" % bad)
raise SystemExit(1 if bad else 0)
