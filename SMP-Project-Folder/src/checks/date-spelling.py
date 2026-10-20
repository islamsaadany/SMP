"""ONE WAY TO WRITE A DATE (§537).

Usability audit, heuristic 4(a). It counted six spellings across the product;
the first sweep fixed those six and the second found THREE MORE it had walked
past, because it had searched for the browser's formatters and these were
written out by hand from a `["Jan","Feb",...]` array of their own — the
history log's day column, the log's "set by X on Y", and the Copilot's
deliverable dates. A spelling is a spelling whether a browser made it or a
loop did, so this file asserts over both.

THE SHAPE IS ISLAM'S: a day reads "5 Mar 26" — day first, no leading zero,
the month in three letters, the year in two digits. Asked directly whether
the spelled-out "11 March 2026" on the printed decks and the chat's day
separators should become that too, he said yes, so there is now ONE day shape
and not a near one and a far one.

TWO HAND-WRITTEN DAY DATES ARE LEFT ALONE, BY INSTRUCTION (Islam: *"don't
touch the stored one"*), and the distinction is data vs. display:
`dayValue()`'s "30 Sep 2026" is STORED and the platform reads the year back
out of that string to do its arithmetic, and `todayLabel()`'s "15 Oct 2026"
is STAMPED into archives and slide credits at the moment they are made.
Re-spelling either would not change a date on screen — it would change what
new records say while every record already filed kept the old words, which is
two spellings in one table rather than one.

What is asserted, and why each end matters (§94.2):

  - THE SPELLING DOES NOT FOLLOW THE BROWSER. The same page is opened twice,
    once in a context set to en-US, and every writer has to read the same
    both times. This is the fault itself, measured rather than reasoned
    about: with the browser's locale, `{day, month:"short"}` renders "Sep 30"
    on an American machine and "30 Sep" on a British one, and a bare time
    renders "09:00 AM" against "09:00" — so two people reading one report saw
    two different dates;
  - THE SHAPE IS WRITTEN ONCE. `DATE_DAY` appears exactly once in the built
    file, so changing the shape is changing one line rather than finding six;
  - THERE ARE THREE FORMATTER CALLS IN THE WHOLE PRODUCT: a day, a time, and
    the stamp. The day-with-time is COMPOSED from the first two rather than
    being a fourth options object, so it cannot drift from the day;
  - NO ARRAY IS INDEXED BY `getMonth()` except the one stored writer. This is
    the assertion the first sweep lacked: it is total over the built file and
    catches a day date written out by hand anywhere in it, including in the
    two modules whose formatters are private and cannot be called from here;
  - AND THE LOG AGREES WITH THE WRITER. `TRAIL.whenWord` is reachable, so the
    one hand-rolled formatter that *can* be called is asserted to return
    exactly what `dateAt` does for the same moment — while keeping its own
    "Today"/"Yesterday", which is this file's judgement and not a spelling;
  - and a value that is not a date comes back EMPTY rather than as "Invalid
    Date" — these are fed from stored strings, and this product's rule is
    that a value it cannot read is left alone rather than rewritten into
    nonsense.

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

print("\n§1 · three formatter calls, and the shape written once")
src = open(os.path.abspath(BUILT), encoding="utf-8").read()
# The comments go first, so the paragraphs explaining the decision are not
# counted as further spellings of it.
code = re.sub(r"/\*.*?\*/", " ", src, flags=re.S)
code = re.sub(r"(?m)^\s*//.*$", " ", code)
d_calls = len(re.findall(r"toLocaleDateString\s*\(", code))
t_calls = len(re.findall(r"toLocaleTimeString\s*\(", code))
# `toLocaleString` is a NUMBER formatter too, so the count has to look at what
# is handed to it: a date call passes date options, a number call passes none
# or number ones. The first draft of this counted every toLocaleString in the
# build and reported three, two of which were the real finding — two more date
# formatters the first sweep missed by searching for empty parens.
s_opts = len(re.findall(r"toLocaleString\s*\(\s*[A-Za-z_$][\w$]*\s*,\s*\{\s*day", code))
s_bare = len(re.findall(r"toLocaleString\s*\(\s*[A-Za-z_$][\w$]*\s*\)", code))
shape  = len(re.findall(r"day\s*:\s*\"numeric\"\s*,\s*month\s*:\s*\"short\"\s*,\s*year\s*:\s*\"2-digit\"", code))
# A day date written out by hand reaches for its month by name: `M[d.getMonth()]`.
# Exactly one is allowed, and it is `todayLabel()` — stamped into archives, not
# drawn on a screen.
byhand = len(re.findall(r"getMonth\(\)\s*\]", code))
ck("one day writer", d_calls == 1, d_calls)
ck("one time writer", t_calls == 1, t_calls)
ck("the day-with-time is composed, not a fourth options object", s_opts == 0, s_opts)
ck("one stamp, written once", s_bare == 1, s_bare)
ck("the day shape is written ONCE, so changing it is one line", shape == 1, shape)
ck("nothing writes a day date out by hand but the stored stamp", byhand == 1, byhand)

# EVERY CALL GOES THROUGH A GUARD, so a build that does not have one of the
# writers reports a FAILURE rather than a stack trace. Written after running
# this against the build before, where it threw on line one and said nothing
# about the other twenty assertions.
PROBE = """() => {
  const has = n => typeof window[n] === 'function';
  const f = n => has(n) ? window[n] : (() => null);
  const dateDay = f('dateDay'), timeOf = f('timeOf'),
        dateAt = f('dateAt'),  dateStamp = f('dateStamp');
  const iso = '2026-03-11T09:00:00Z';
  const old = '2024-07-02T14:30:00Z';
  return {
    missing: ['dateDay','timeOf','dateAt','dateStamp'].filter(n => !has(n)),
    day:   dateDay(iso),
    time:  timeOf(iso),
    at:    dateAt(iso),
    stamp: dateStamp(iso),
    junk:  [dateDay('On-going'), timeOf('On-going'), dateAt('On-going')],
    blank: [dateDay(''), timeOf(''), dateAt('')],
    nul:   [dateDay(null), timeOf(null), dateAt(null)],
    /* What the platform writes BY HAND for the same day and keeps, which the
       formatted one has to agree with as far as it goes. */
    hand:  (typeof dayValue === 'function') ? dayValue(11, 2, 2026) : null,
    stored:(typeof todayLabel === 'function') ? todayLabel() : null,
    /* The one hand-rolled formatter that is reachable from outside its file. */
    logOld:  (typeof TRAIL !== 'undefined' && TRAIL.whenWord) ? TRAIL.whenWord(old) : null,
    logAtOld:dateAt(old),
    logToday:(typeof TRAIL !== 'undefined' && TRAIL.whenWord) ? TRAIL.whenWord(new Date().toISOString()) : null
  };
}"""

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
            print("\n§2 · the shape Islam chose")
            r = seen[loc]
            ck("the product has a day writer, a time writer, a day-with-time and a stamp",
               r.get("missing") == [], r.get("missing"))
            ck("a day is day, short month, two-digit year", r.get("day") == "11 Mar 26", r)
            ck("a time is 24 hours and no AM/PM",
               bool(re.match(r"^\d{2}:\d{2}$", r.get("time") or "")), r)
            ck("the day-with-time is exactly the two of them",
               bool(r.get("at")) and r.get("at") == ((r.get("day") or "") + ", " + (r.get("time") or "")), r)
            ck("the stamp carries a time", ":" in (r.get("stamp") or ""), r)
            # The two STORED writers are asserted to be UNCHANGED, which is the
            # other half of Islam's instruction: day first, short month, and a
            # four-digit year, because `cycleYear()` reads that year back out of
            # the string and archives already filed carry the same words.
            ck("...and the date the platform STORES is untouched — day first, four-digit year",
               bool(re.match(r"^\d{1,2} [A-Z][a-z]{2} \d{4}$", r.get("hand") or ""))
               and bool(re.match(r"^\d{1,2} [A-Z][a-z]{2} \d{4}$", r.get("stored") or "")),
               (r.get("hand"), r.get("stored")))
            ck("...and the day on screen agrees with it as far as it goes",
               (r.get("hand") or "").startswith("11 Mar") and (r.get("day") or "").startswith("11 Mar"), r)
            ck("a value that is not a date comes back empty, from every writer",
               r.get("junk") == ["", "", ""] and r.get("blank") == ["", "", ""]
               and r.get("nul") == ["", "", ""], r)

            print("\n§3 · and the history log says it the same way")
            ck("a logged moment past yesterday is the product's day-with-time",
               r.get("logOld") == r.get("logAtOld"), (r.get("logOld"), r.get("logAtOld")))
            ck("...while today is still 'Today', which is a judgement not a spelling",
               (r.get("logToday") or "").startswith("Today "), r.get("logToday"))
            ck("no page errors", not errs, errs[:2])
        ctx.close()

    print("\n§4 · and it does not follow the browser — the fault itself")
    gb, us = seen["en-GB"], seen["en-US"]
    for w in ("day", "time", "at", "stamp", "logOld"):
        ck("the %s reads the same on an American machine" % w,
           gb.get(w) == us.get(w), (gb.get(w), us.get(w)))
    ck("...the month is still not first", not (us.get("day") or "").startswith("Mar"), us.get("day"))
    ck("...and the time still has no AM/PM",
       "AM" not in (us.get("time") or "") and "PM" not in (us.get("time") or ""), us.get("time"))
    b.close()

print("\n%d failure(s)" % bad)
raise SystemExit(1 if bad else 0)
