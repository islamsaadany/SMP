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
  <p class="lede"><b>Second round.</b> Your three corrections are drawn: the
    months start at the second column, the hover is gone, and the number and the
    handle are centred to each other. The pictures are the running platform, not
    a drawing of it.</p>
  <div class="drawn">
    <span><b>Drawn from</b> the running build, a supporting function &rsaquo; Overview, pen open, drawer open</span>
    <span><b>1500px window</b>, first row under the pointer</span>
    <span><b>4 September 2026 &middot; round two</b></span>
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
    <h2>The fix, with your three corrections</h2>
    <span class="tag pick">as drawn</span>
  </div>
  __SHOT_PROPOSED__
  <figcaption>Same build, same width, same rows. Objective <b>97 &rarr;
    234px</b>, the row <b>136 &rarr; 56px</b>, the target cell filling its row
    again, the months starting under Objective, and no hover tint.</figcaption>

  <ul class="facts">
    <li><span class="k">Months</span><span class="v"><b>From the second
      column</b>, as you asked &mdash; the blank cell under <b>#</b> stays and
      the drawer spans everything after it. That is what the key measures table
      has always done, and it is only safe now: the squeeze was never the
      indent, it was that the column left outside the span was the prose one.
      With a <b>#</b> outside it instead, every column keeps the width it had
      before the drawer opened.</span></li>
    <li><span class="k">Hover</span><span class="v"><b>Gone</b>, your C. The
      stripe alone separates the rows. Recorded with its cost: on these wide
      tables there is now nothing that follows one row across the
      columns.</span></li>
    <li><span class="k">The pair</span><span class="v">Centred. Measured, the
      handle sat <b>5px</b> above the number's middle; it is <b>0</b>
      now.</span></li>
    <li><span class="k">The cell</span><span class="v">The target cell is an
      ordinary table cell again, with the box and the mark seated inside it
      &mdash; so it fills its row and the white block is gone.</span></li>
  </ul>
</section>

<section>
  <h2>The pair, close up</h2>
  <div class="pair">
    <figure class="crop">__SHOT_GRIP_TODAY__<figcaption>As it aligns today
      &mdash; the handle 5px high of the number.</figcaption></figure>
    <figure class="crop">__SHOT_GRIP_CENTRED__<figcaption>Centred to each
      other, and centred in the cell.</figcaption></figure>
  </div>
  <p class="measure quiet">The handle is the platform&rsquo;s own three-bar grip
    &mdash; the same one the key measures table uses. The first round drew an
    invented dotted mark, which is a picture of what the product could look like
    rather than of what it does.</p>
</section>

<section>
  <h2>What it costs, stated</h2>
  <ul class="facts">
    <li><span class="k">Width</span><span class="v">The <b>#</b> column takes
      <b>63px</b>, which the Objective column absorbs and then some &mdash; it
      is still more than twice what it has today with the drawer open, on both
      tables.</span></li>
    <li><span class="k">One line</span><span class="v">On a unit&rsquo;s
      nine-column table those 63px were enough to break the eye and
      <b>Remove</b> onto a second line, taking the row to 74px. That column is
      held to one line, so both tables come out at <b>56px</b>.</span></li>
    <li><span class="k">Reach</span><span class="v">The same three changes apply
      to a unit&rsquo;s objectives, a supporting function&rsquo;s, a
      pillar&rsquo;s key measures and a tactic&rsquo;s outcome &mdash; one
      answer for all four.</span></li>
    <li><span class="k">Who drags</span><span class="v">The handle shows only
      while you are arranging, and reordering objectives becomes the same grant
      as reordering measures. Nobody gains a right they do not already have over
      the rows beneath.</span></li>
  </ul>
</section>

<section>
  <h2>Two more, going in with it</h2>
  <ul class="facts">
    <li><span class="k">The gap</span><span class="v">The drawer&rsquo;s footer
      reads <em>&ldquo;not in force yetUntil all twelve are filled&rdquo;</em>
      &mdash; two sentences with no space between them.</span></li>
    <li><span class="k">Count</span><span class="v">The same footer says
      <em>&ldquo;Set Sum, Latest or Average&rdquo;</em>, written before
      <b>Count</b> existed. It will name all four, read off the platform&rsquo;s
      own list so it cannot go stale again.</span></li>
  </ul>
</section>

<section class="ask">
  <h2>What I need from you</h2>
  <ol>
    <li>Say <b>go</b> and I build exactly this.</li>
    <li>The only thing still open is whether the <b>#</b> column goes on the two
      objectives tables only, or on all four that carry a monthly drawer. The
      key measures and tactics tables already have one, so in practice this is a
      question about the two objectives tables alone &mdash; I would put it on
      both of them.</li>
  </ol>
</section>
</div>
"""

BODY = BODY.replace("</style>", """
  .pair { display:flex; gap:34px; flex-wrap:wrap; margin-top:18px; }
  .crop { margin:0; }
  .crop img { display:block; height:74px; width:auto; image-rendering:pixelated;
    border:1px solid var(--shot-edge); border-radius:6px; background:var(--surface); }
</style>""")

html = (BODY
        .replace("__STYLE__", STYLE.read_text())
        .replace("__SHOT_TODAY__", img("fn-today", "The objectives table today"))
        .replace("__SHOT_PROPOSED__", img("fn-proposed", "The proposal"))
        .replace("__SHOT_GRIP_TODAY__", img("grip-today", "The pair as it aligns today"))
        .replace("__SHOT_GRIP_CENTRED__", img("grip-centred", "The pair centred")))
OUT.parent.mkdir(parents=True, exist_ok=True)
OUT.write_text(html)
print("wrote", OUT, OUT.stat().st_size, "bytes")
