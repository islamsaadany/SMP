"""Compose the mockup: four states of the Reporting page, drawn out of the
running platform, in the platform's own CSS."""
import json, re, pathlib
from html import escape

SRC = pathlib.Path("/home/user/SMP/SMP-Project-Folder/src")
SC  = pathlib.Path("/tmp/claude-0/-home-user-SMP/24e488c3-befb-57af-9d5b-35e85b22a4fe/scratchpad")
DST = pathlib.Path("/home/user/SMP/design-mockups/report-find-the-blocker")
DST.mkdir(parents=True, exist_ok=True)

d = json.loads((SC / "panels.json").read_text())

# The platform's own stylesheet, verbatim and IN BUILD ORDER — source order is
# load-bearing here (§29.2), so this is build.py's own list, less the embedded
# font faces (the mockup runs on the system stack, which is what the platform
# does when no `data-font` is set).
#
# NEVER scraped out of the built file: its second <style> match is a JavaScript
# STRING inside xlsx.js (the workbook's own styles.xml), so the first draft of
# this shipped a mockup with no platform CSS at all — and it rendered
# perfectly, as an unstyled page. Found by shooting it (§41.9).
CSS = "\n".join((SRC / f).read_text() for f in [
    "_shared.css", "group-extra.css", "config.css", "arrange.css",
    "present.css", "chat.css", "tour.css", "welcome.css", "builder.css"])
assert ".missbar" in CSS and ".ritem" in CSS, "the platform's CSS is not in here"


def bar(count_word, chips, cta):
    """The platform's own missing bar, class for class (missBar(), §272)."""
    ch = "".join(
        '<button type="button" class="mchip" title="%s">%s <b>%d</b></button>'
        % (escape(t), escape(lab), n) for lab, n, t in chips)
    return ('<div class="missbar" data-gapband="1">'
            '<span class="secmiss">%s</span>%s'
            '<span class="gaptail"><button type="button" class="fillcta">%s</button></span>'
            '</div>' % (escape(count_word), ch, cta))


def rail_marks(html, marks):
    """The alarm railSub() already carries (§119.3) — the half of the rail's
    small line that survives a collapsed rail, which is what the rail is by
    default. And the green tally stops reading as finished."""
    def one(m):
        row = m.group(0)
        code = re.search(r'rcode">([^<]*)<', row)
        code = code.group(1).strip() if code else ""
        owed = marks.get(code)
        if not owed:
            return row
        row = row.replace('rtally full', 'rtally')
        row = re.sub(r'<span class="rsub">.*?</span>',
                     '<span class="rsub"><span class="missing">%s</span></span>' % owed, row)
        if '<span class="rsub">' not in row:
            row = row.replace("</button>",
                              '<span class="rsub"><span class="missing">%s</span></span></button>' % owed)
        return row
    return re.sub(r'<button class="ritem.*?</button>', one, html, flags=re.S)


def swap_banner(html, new):
    return re.sub(r'<div class="note bad-note">.*?</div>', new, html, count=1, flags=re.S)


def frame(html):
    return '<main class="wrap"><div class="view">%s</div></main>' % html


TODAY = d["today"]
MIXED = d["mixed"]

# ── A: the rail says where ─────────────────────────────────────────────
A = rail_marks(TODAY, {"BE03": "1 needs a note"})

# ── B: the missing bar, in the banner's place ──────────────────────────
B = swap_banner(A, bar("1 to explain",
                       [("BE03", 1, "1 figure at risk with no note — press to go")],
                       "Take me to it &rarr;"))

# ── C: the bar names everything Submit is waiting for (mixed state) ────
C = rail_marks(MIXED, {"BE01": "2 still to enter", "BE03": "1 needs a note"})
C = swap_banner(C, bar("4 to finish", [
        ("Key objectives", 1, "1 figure still to enter — press to go"),
        ("BE01", 2, "2 figures still to enter — press to go"),
        ("BE03", 1, "1 figure at risk with no note — press to go")],
        "Next &rarr;&nbsp;<span class=\"ngleft\">4 left</span>"))
# The mixed state has no banner of its own for notes+figures, so if the swap
# found nothing, put the bar at the top.
if 'class="missbar"' not in C:
    C = bar("4 to finish", [
        ("Key objectives", 1, "1 figure still to enter — press to go"),
        ("BE01", 2, "2 figures still to enter — press to go"),
        ("BE03", 1, "1 figure at risk with no note — press to go")],
        "Next &rarr;&nbsp;<span class=\"ngleft\">4 left</span>") + C

PANELS = [
  ("today", "As it is today", "",
   "Everything is entered — <b>17 of 17</b> — and Submit is held by one thing: a "
   "figure at risk with no note. The banner counts it and names no place. "
   "<b>The rail is worse than silent:</b> the pillar that owes the note wears a "
   "green <b>4/4</b>, because that tally counts figures entered, which is a "
   "different question — and the rail ships collapsed, so its small line says "
   "nothing at all. Nothing on this screen points anywhere.",
   TODAY, None),

  ("a", "Option A", "The rail says which pillar",
   "Each pillar in the rail carries the mark the <b>plan</b> rail already uses, and its tally "
   "stops being green while it owes something. The mark is the one thing that survives a "
   "collapsed rail (that is what it was built for), so it shows in the state the rail ships "
   "in. Two presses: read the mark, open that pillar. The banner is unchanged.",
   A, ("Smallest change. You still scan the pillar's own tables to find the row — "
       "short on a small pillar, slower on a long one. Key Objectives sit above the rail, "
       "so they take the same mark on their heading.")),

  ("b", "Option B", "The bar takes you there",
   "The red banner becomes the platform's own <b>missing bar</b> — the one a custodian already "
   "meets when a plan is short: a count, one chip per place, and a button. Pressing a chip opens "
   "that pillar and puts the cursor in the note box that is owed. The rail marks from A stay.",
   B, ("The same control, the same words and the same colour people already know from filling "
       "a plan. Counts notes only — the other three things that hold Submit still say a number "
       "and no place.")),

  ("c", "Option C", "The bar names everything Submit is waiting for",
   "The same bar, counting all four: figures not entered, rows that said <i>In progress</i> without "
   "a per-cent, figures at risk with no note, and gaps in the plan. The button becomes a walk — "
   "one press per outstanding item until there are none. Drawn here on a report that is genuinely "
   "short: <b>3 figures to enter and 1 note owed</b>.",
   C, ("Largest of the three, and the only one that answers the question for the other three "
       "blockers as well as notes. Same list the hover already reads, so nothing new is counted.")),
]

body = []
for key, kicker, title, lede, html, cost in PANELS:
    body.append(
      '<section class="mk-sec" id="mk-%s">'
      '<div class="mk-head"><span class="mk-kick">%s</span>%s</div>'
      '<p class="mk-lede">%s</p>%s'
      '<div class="mk-shot">%s</div></section>'
      % (key, escape(kicker), ("<h2>" + escape(title) + "</h2>") if title else "",
         lede, ('<p class="mk-cost"><b>What it costs.</b> ' + cost + '</p>') if cost else "",
         frame(html)))

page = """<title>Reporting — finding the blocker</title>
<style>%s</style>
<style>
  body { background:var(--ground); }
  .mk-top { max-width:1400px; margin:0 auto; padding:34px 24px 6px; }
  .mk-top h1 { font-size:26px; margin:0 0 8px; letter-spacing:-.01em; }
  .mk-top p { color:var(--ink-2); font-size:14.5px; line-height:1.62; margin:0 0 12px; max-width:78ch; }
  .mk-facts { display:flex; flex-wrap:wrap; gap:10px; margin:16px 0 8px; }
  .mk-fact { border:1px solid var(--line); background:var(--surface); border-radius:9px;
             padding:9px 13px; font-size:12.5px; color:var(--ink-2); }
  .mk-fact b { color:var(--ink); font-weight:700; }
  .mk-sec { max-width:1400px; margin:0 auto; padding:30px 24px 0; }
  .mk-head { display:flex; align-items:baseline; gap:12px; border-top:1px solid var(--line);
             padding-top:26px; }
  .mk-kick { font-size:10.5px; letter-spacing:.10em; text-transform:uppercase;
             font-weight:800; color:var(--gold-deep); }
  .mk-head h2 { font-size:20px; margin:0; letter-spacing:-.01em; }
  .mk-lede, .mk-cost { color:var(--ink-2); font-size:14px; line-height:1.62;
                       max-width:78ch; margin:10px 0 0; }
  .mk-cost { color:var(--ink-3); font-size:13px; }
  .mk-cost b { color:var(--ink-2); }
  .mk-shot { margin:18px 0 0; border:1px solid var(--line); border-radius:12px;
             overflow:hidden; background:var(--ground); box-shadow:0 1px 3px rgba(16,32,64,.06); }
  .mk-shot .wrap { padding-top:18px; padding-bottom:20px; }
  .mk-shot .missbar { margin-bottom:6px; }
  .mk-foot { max-width:1400px; margin:0 auto; padding:34px 24px 60px; }
  .mk-foot h2 { font-size:18px; margin:26px 0 10px; border-top:1px solid var(--line); padding-top:26px; }
  .mk-foot p, .mk-foot li { color:var(--ink-2); font-size:14px; line-height:1.65; max-width:78ch; }
  .mk-ask { border-left:3px solid var(--gold); background:var(--surface-2);
            padding:14px 16px; border-radius:0 9px 9px 0; margin-top:14px; }
  .mk-ask b { color:var(--ink); }
</style>
<div class="mk-top">
  <h1>Reporting &mdash; finding what is holding Submit</h1>
  <p>Drawn out of the running platform on a report in exactly the state you hit: every figure
     entered, the plan owing nothing, and Submit held by one figure at risk with no note.
     Three options, smallest first. Nothing is built.</p>
  <div class="mk-facts">
    <span class="mk-fact"><b>17 of 17</b> figures entered</span>
    <span class="mk-fact">Submit held by <b>1 note</b>, nothing else</span>
    <span class="mk-fact">The pillar that owes it wears a green <b>4/4</b></span>
    <span class="mk-fact">The row <b>is</b> marked &mdash; in a pillar the rail is not standing on</span>
  </div>
</div>
%s
<div class="mk-foot">
  <h2>What I would do</h2>
  <p><b>Option B</b>, and I would count all four blockers in it rather than notes alone &mdash; which is
     Option C, and it is the same one list the Submit hover already reads, so nothing new is computed.
     Building it for notes only means building it again the next time somebody is stuck on a
     missing per-cent.</p>
  <p>Whichever you pick, one thing goes with it: the rail must stop saying <i>Complete</i> over a
     pillar that is holding the report up. That line is what sent you past it.</p>
  <h2>The one placement question</h2>
  <p>The bar is drawn here where the red banner is now, across the page. It could instead ride the
     tab row beside Submit, where the reason is already on the hover. On the page it has room for
     the chips; beside Submit it sits with the control it explains and has about half the width.
     I would keep it on the page.</p>
  <div class="mk-ask">
    <b>To settle it:</b> A, B or C &mdash; and for B or C, whether the bar counts notes only or
    everything Submit is waiting for.
  </div>
</div>""" % (CSS, "\n".join(body))

out = DST / "2026-09-04_reporting-find-the-blocker.html"
out.write_text(page)
print("wrote", out, out.stat().st_size)
