"""ONE WAY TO WRITE A DATE (§537).

Usability audit, heuristic 4(a). It counted six spellings across the product:
two spacings of the same options object, "en-GB" hard-coded in two places and
the browser's locale everywhere else, and a bare `toLocaleString()`. So how a
date read depended on which screen you were standing on — and, wherever the
locale was the browser's, on whose machine.

What is asserted, and why each end matters (§94.2):

  - THE SPELLING DOES NOT FOLLOW THE BROWSER. The same page is opened twice,
    once in a context set to en-US, and the date has to read the same both
    times. This is the fault itself, measured rather than reasoned about: with
    the browser's locale, `{day, month:"short"}` renders "Sep 30" on an
    American machine and "30 Sep" on a British one, so two people reading one
    report saw two different dates;
  - AND IT MATCHES THE DATES THE PLATFORM WRITES BY HAND. `dayValue()` makes
    "30 Sep 2026" and the month picker makes "Jul 26" — day first, always — so
    a formatted date that put the month first would sit on screen beside the
    product's own strings contradicting them. Asserted against `dayValue`
    itself rather than against a copy of its output;
  - there is exactly ONE place that formats a date, proved over the built
    file: two `toLocaleDateString` calls (the two shapes) and one
    `toLocaleString` (the stamp), and nothing else anywhere. A seventh
    spelling added tomorrow fails here;
  - and a value that is not a date comes back EMPTY rather than as "Invalid
    Date" — these are fed from stored strings, and this product's rule is that
    a value it cannot read is left alone rather than rewritten into nonsense.

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

print("\n§1 · exactly one place formats a date")
src = open(os.path.abspath(BUILT), encoding="utf-8").read()
code = re.sub(r"/\*.*?\*/", " ", src, flags=re.S)
code = re.sub(r"(?m)^\s*//.*$", " ", code)
d_calls = len(re.findall(r"toLocaleDateString\s*\(", code))
# `toLocaleString` is a NUMBER formatter too, so the count has to look at what
# is being handed to it: a date call passes date options, a number call passes
# none or number ones. The first draft of this counted every toLocaleString in
# the build and reported three, two of which were the real finding -- two more
# date formatters the first sweep missed by searching for empty parens.
s_calls = len(re.findall(r"toLocaleString\s*\(\s*[A-Za-z_$][\w$]*\s*,\s*\{\s*day", code))
s_bare  = len(re.findall(r"toLocaleString\s*\(\s*[A-Za-z_$][\w$]*\s*\)", code))
# Two shapes (short, full), one day-with-time, one bare stamp, and the comments
# are stripped first so the paragraph explaining the decision is not counted as
# a seventh spelling.
ck("two date shapes, written once each", d_calls == 2, d_calls)
ck("one day-with-time, written once", s_calls == 1, s_calls)
ck("one bare stamp, written once", s_bare == 1, s_bare)

PROBE = """() => ({
  short: dateShort('2026-03-11T09:00:00Z'),
  full:  dateFull('2026-03-11T09:00:00Z'),
  stamp: dateStamp('2026-03-11T09:00:00Z'),
  at:    dateAt('2026-03-11T09:00:00Z'),
  junk:  dateShort('On-going'),
  blank: dateShort(''),
  nul:   dateShort(null),
  /* What the platform writes BY HAND for the same day, which the formatted
     one has to agree with. */
  hand:  (typeof dayValue === 'function') ? dayValue(11, 2, 2026) : null
})"""

with sync_playwright() as p:
    b = p.chromium.launch(executable_path="/opt/pw-browsers/chromium",
                          args=["--no-sandbox", "--disable-dev-shm-usage"])
    seen = {}
    for loc in ("en-GB", "en-US"):
        ctx = b.new_context(locale=loc)
        pg = ctx.new_page()
        errs = []
        pg.on("pageerror", lambda e: errs.append(str(e)))
        pg.goto(URL); pg.wait_for_timeout(1600)
        seen[loc] = pg.evaluate(PROBE)
        if loc == "en-GB":
            print("\n§2 · the shapes")
            r = seen[loc]
            ck("a near day is day and month", r.get("short") == "11 Mar", r)
            ck("a date that carries its year spells the month out",
               r.get("full") == "11 March 2026", r)
            ck("the stamp carries a time", ":" in (r.get("stamp") or ""), r)
            ck("the day-with-time is a day AND a time",
               r.get("at", "").startswith("11 Mar") and ":" in r.get("at", ""), r)
            ck("...and it agrees with what the platform writes by hand",
               (r.get("hand") or "").startswith("11 Mar"), r)
            ck("a value that is not a date comes back empty",
               r.get("junk") == "" and r.get("blank") == "" and r.get("nul") == "", r)
            ck("no page errors", not errs, errs[:2])
        ctx.close()

    print("\n§3 · and it does not follow the browser — the fault itself")
    gb, us = seen["en-GB"], seen["en-US"]
    ck("the short date reads the same on an American machine",
       gb.get("short") == us.get("short"), (gb.get("short"), us.get("short")))
    ck("...so does the full one",
       gb.get("full") == us.get("full"), (gb.get("full"), us.get("full")))
    ck("...and the stamp",
       gb.get("stamp") == us.get("stamp"), (gb.get("stamp"), us.get("stamp")))
    ck("...and the day-with-time",
       gb.get("at") == us.get("at"), (gb.get("at"), us.get("at")))
    ck("...and the month is still not first",
       not (us.get("short") or "").startswith("Mar"), us.get("short"))
    b.close()

print("\n%d failure(s)" % bad)
raise SystemExit(1 if bad else 0)
