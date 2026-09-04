"""Assemble the objectives-table document from the shots.

Run `objectives-table-mockup.py` first — this only assembles. Pictures are
embedded as data URIs: a mockup is LOOKED AT, and a page that has to fetch six
files from a folder only renders on the machine that made it (rule 1c).
"""
import base64, pathlib

ROOT = pathlib.Path(__file__).resolve().parents[3]
SHOTS = ROOT / "design-mockups/objectives-table/shots"
OUT = ROOT / "design-mockups/objectives-table/2026-09-04_the-objectives-table.html"
STYLE = (pathlib.Path(__file__).resolve().parent / "_mockup-style.html")


def img(name, alt):
    b = base64.b64encode((SHOTS / (name + ".png")).read_bytes()).decode()
    return ('<figure class="shot"><img alt="%s" src="data:image/png;base64,%s">'
            '</figure>' % (alt, b))


BODY = """<title>The Objectives Table</title>
__STYLE__

<div class="wrap">
<header>
  <p class="kicker">SMP &middot; mockup for sign-off &middot; objectives table</p>
  <h1>The objectives table</h1>
  <p class="lede">Three things from one message, and two of them turn out to be
    the same fault. Both were reproduced on your own screen before anything was
    proposed &mdash; the pictures below are the running platform, not a drawing
    of it.</p>
  <div class="drawn">
    <span><b>Drawn from</b> the running build, a supporting function &rsaquo; Overview, pen open, drawer open</span>
    <span><b>1500px window</b>, first row hovered</span>
    <span><b>4 September 2026</b></span>
  </div>
</header>

<section>
  <h2>What is happening</h2>
  <p class="measure">Your screenshot is a supporting function's objectives, which
    is where this is loudest: that table's Objective name <b>wraps</b>, so when
    the column is squeezed the name goes to four lines and the row grows with it.
    A unit's objectives table has the same drawer and the same two faults, just
    with a name that clips instead of wrapping.</p>
  __SHOT_TODAY__
  <figcaption>Today. The Objective column is <b>97px</b> and the row is
    <b>136px</b> tall. Under the target box there is a block of white in a row
    that is otherwise grey &mdash; the thing you spotted.</figcaption>

  <ul class="facts">
    <li><span class="k">Fault 1</span><span class="v"><b>The drawer sits under
      every column except the first.</b> It spans columns 2&ndash;8, and a table
      shares a spanning cell's width across the columns it covers &mdash; so the
      twelve month boxes push those seven wider and the one column outside the
      span pays for all of it. Measured: Objective <b>242px &rarr; 97px</b> the
      moment the drawer opens, with the table's own width unchanged at
      1493px.</span></li>
    <li><span class="k">Fault 2</span><span class="v"><b>The target cell stopped
      being a table cell.</b> To seat the little mark beside the box, that one
      cell was made a flex container &mdash; and a flex cell no longer stretches
      to its row's height. Measured on your row: every cell is <b>136px</b> tall
      and the target cell is <b>57px</b>. The 79px underneath it is not the cell
      at all; it is the bare table showing through. Nothing to do with hover
      &mdash; hover just makes it visible.</span></li>
  </ul>
</section>

<section class="opt rec">
  <div class="opthead">
    <h2>The fix &mdash; and it is your own proposal</h2>
    <span class="tag pick">recommended</span>
  </div>
  <p class="measure">The drawer goes <b>under the whole width</b>, exactly as you
    said: <em>"shall it go below the whole objective columns to keep the table
    tidy?"</em> With nothing left outside the span there is no column to pay, and
    every column returns to the pixel it had before the drawer opened. The target
    cell becomes an ordinary table cell again with the box and the mark seated
    inside it, so it fills its row and the white block is gone. And the
    <b>#</b> column with a handle joins it.</p>
  __SHOT_PROPOSED__
  <figcaption>The same table, same build, same width. Objective back to
    <b>244px</b>, the row <b>136px &rarr; 56px</b>, the whole hovered row one
    grey, the drawer starting at the left edge, and a numbered handle
    column.</figcaption>

  <ul class="facts">
    <li><span class="k">Costs</span><span class="v">The <b>#</b> column takes
      38px from the table, which the Objective column absorbs &mdash; it is still
      wider than it was before the drawer existed. Nothing else moves, on any of
      the four tables that carry a monthly drawer.</span></li>
    <li><span class="k">Reach</span><span class="v">The same three changes apply
      to a unit's objectives, a pillar's key measures and a tactic's outcome
      &mdash; one answer for all four, not a patch on the one you were looking
      at.</span></li>
  </ul>
</section>

<section>
  <h2>The number column, and who may drag it</h2>
  <p class="measure">The <b>#</b> and the grip are the key measures table's own
    &mdash; copied, not designed again. Two things follow from that and are worth
    saying before you agree to them:</p>
  <ul class="facts">
    <li><span class="k">The number</span><span class="v">Always drawn, in edit
      and in reading, exactly as the measures table draws it.</span></li>
    <li><span class="k">The handle</span><span class="v">Only while you are
      arranging &mdash; the same rule the measures table follows, so a stray drag
      cannot reorder a plan somebody is reading.</span></li>
    <li><span class="k">Who</span><span class="v">Reordering objectives becomes
      the same grant as reordering measures: the office, and the unit's own owner
      or custodian while they are arranging. Nobody gains a right they do not
      already have over the rows beneath.</span></li>
  </ul>
</section>

<section class="opt">
  <div class="opthead">
    <h2>The hover &mdash; and it does nothing on every second row</h2>
    <span class="tag">your call</span>
  </div>
  <p class="measure">You asked whether the colour change on hovering earns its
    place when the next row is already grey. Measured, the answer is worse than
    that: <b>on a striped row the stripe wins and the hover changes nothing at
    all.</b> A white row hovered goes <code>#FFFFFF &rarr; #EFF2F6</code>; a
    striped row hovered stays <code>#F5F7FA</code> &mdash; the same colour it
    already was. So today the highlight speaks on half the rows and is silent on
    the other half, which is why it reads as unreliable rather than as
    helpful.</p>
  <ul class="facts">
    <li><span class="k">A &mdash; leave it</span><span class="v">No work, and it
      goes on saying something on odd rows and nothing on even ones.</span></li>
    <li><span class="k">B &mdash; fix it</span><span class="v">One hover ground
      that is a clear step from <b>both</b> the white and the stripe
      (<code>#E6EAF0</code>). These tables are wide and scroll sideways, and
      following one row across ten columns is exactly what a row highlight is
      for. <b>My recommendation.</b></span></li>
    <li><span class="k">C &mdash; drop it</span><span class="v">No hover at all;
      the stripe alone separates the rows. Quietest, and it costs the one thing
      that helps on a wide table.</span></li>
  </ul>
  __SHOT_HOVERB__
  <figcaption>B &mdash; a striped row hovered. It now steps to
    <code>#E6EAF0</code> where today it does not move.</figcaption>
  __SHOT_HOVERC__
  <figcaption>C &mdash; no hover. The stripe does all the work.</figcaption>
</section>

<section>
  <h2>Two more, found while measuring</h2>
  <ul class="facts">
    <li><span class="k">The gap</span><span class="v">The drawer's footer reads
      <em>"not in force yetUntil all twelve are filled"</em> &mdash; two
      sentences with no space between them. One character.</span></li>
    <li><span class="k">Count</span><span class="v">The same footer says
      <em>"Set Sum, Latest or Average"</em>, written before <b>Count</b> existed.
      It should name all four, read off the platform's own list so it can never
      go stale again.</span></li>
  </ul>
</section>

<section class="ask">
  <h2>What I need from you</h2>
  <ol>
    <li><b>The drawer full width, the target cell put back, and the # column with
      a handle</b> &mdash; yes or no, and whether the # goes on all four tables
      or the objectives ones only.</li>
    <li><b>The hover: A, B or C.</b> I recommend B.</li>
    <li>The missing space and the Count wording go in with it unless you say
      otherwise.</li>
  </ol>
</section>
</div>
"""

html = (BODY
        .replace("__STYLE__", STYLE.read_text())
        .replace("__SHOT_TODAY__", img("fn-today", "The objectives table today"))
        .replace("__SHOT_PROPOSED__", img("fn-proposed", "The proposal"))
        .replace("__SHOT_HOVERB__", img("fn-hoverB", "Hover treatment B"))
        .replace("__SHOT_HOVERC__", img("fn-hoverC", "Hover treatment C")))
OUT.parent.mkdir(parents=True, exist_ok=True)
OUT.write_text(html)
print("wrote", OUT, OUT.stat().st_size, "bytes")
