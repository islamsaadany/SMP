"""Assemble the monthly-plan mockup document from the shots the camera took.

The pictures are embedded as data URIs, because a mockup is LOOKED AT and a
page that has to fetch six files from a folder is a page that only renders on
this machine (rule 1c: a mockup is published, never handed over as a file to
open). Run `monthly-plan-mockup.py` first — this only assembles.
"""
import base64, pathlib

ROOT = pathlib.Path(__file__).resolve().parents[3]
SHOTS = ROOT / "design-mockups/monthly-plan/shots"
OUT = ROOT / "design-mockups/monthly-plan/2026-09-03_monthly-plan-entry.html"


def img(name, alt):
    b = base64.b64encode((SHOTS / (name + ".png")).read_bytes()).decode()
    return ('<figure class="shot"><img alt="%s" src="data:image/png;base64,%s">'
            '</figure>' % (alt, b))


DOC = """<title>Targets by Month</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Newsreader:ital,opsz,wght@0,6..72,400;0,6..72,500;1,6..72,400&family=IBM+Plex+Sans:wght@400;500;600&family=IBM+Plex+Mono:wght@400;500&display=swap">
<style>
  /* The platform's own Forefront tokens, so a page ABOUT the product is drawn
     in the product's language (rule 1c: navy/gold). Light is the bare :root;
     dark redefines only the tokens, in both the system and the stamped state. */
  :root {
    --navy:#16325C; --gold:#C9A24D; --gold-deep:#8A6B22;
    --ground:#F7F8FA; --surface:#FFFFFF; --surface-2:#EFF2F6;
    --line:#D6DCE5; --line-soft:#E6EAF0;
    --ink:#171B22; --ink-2:#414A58; --ink-3:#636C79;
    --good:#2E7D5B; --attn:#B8860B; --bad:#B04434;
    --shot-edge:#D6DCE5;
    --fs-micro:10.5px;
  }
  @media (prefers-color-scheme: dark) {
    :root:not([data-theme="light"]) {
      --navy:#0E1014; --gold:#D9B665; --gold-deep:#C9A24D;
      --ground:#14161A; --surface:#1C2027; --surface-2:#242932;
      --line:#333A45; --line-soft:#2A303A;
      --ink:#E9ECF1; --ink-2:#B4BCC8; --ink-3:#949DAA;
      --good:#5FB68C; --attn:#D9B23C; --bad:#D97066;
      --shot-edge:#3A4250;
    }
  }
  :root[data-theme="dark"] {
    --navy:#0E1014; --gold:#D9B665; --gold-deep:#C9A24D;
    --ground:#14161A; --surface:#1C2027; --surface-2:#242932;
    --line:#333A45; --line-soft:#2A303A;
    --ink:#E9ECF1; --ink-2:#B4BCC8; --ink-3:#949DAA;
    --good:#5FB68C; --attn:#D9B23C; --bad:#D97066;
    --shot-edge:#3A4250;
  }

  * { box-sizing:border-box; }
  body {
    background:var(--ground); color:var(--ink);
    font-family:"IBM Plex Sans", ui-sans-serif, system-ui, -apple-system, sans-serif;
    font-size:15px; line-height:1.55;
    padding:0 24px 96px; margin:0;
  }
  .wrap { max-width:1220px; margin:0 auto; }
  .measure { max-width:68ch; }

  header { padding:56px 0 34px; border-bottom:1px solid var(--line); margin-bottom:44px; }
  .kicker {
    font-size:var(--fs-micro); letter-spacing:.16em; text-transform:uppercase;
    font-weight:600; color:var(--gold-deep); margin:0 0 14px;
  }
  h1 {
    font-family:Newsreader, Georgia, serif; font-weight:400;
    font-size:clamp(34px, 5vw, 52px); line-height:1.08; letter-spacing:-.01em;
    margin:0 0 16px; text-wrap:balance;
  }
  .lede { font-size:17px; color:var(--ink-2); margin:0; max-width:62ch; }
  .drawn {
    display:flex; flex-wrap:wrap; gap:8px 26px; margin-top:26px;
    font-family:"IBM Plex Mono", ui-monospace, monospace;
    font-size:12px; color:var(--ink-3);
  }
  .drawn b { color:var(--ink-2); font-weight:500; }

  section { margin:0 0 52px; }
  h2 {
    font-family:Newsreader, Georgia, serif; font-weight:400;
    font-size:27px; line-height:1.2; margin:0 0 14px; letter-spacing:-.005em;
  }
  h3 {
    font-size:var(--fs-micro); letter-spacing:.14em; text-transform:uppercase;
    font-weight:600; color:var(--ink-3); margin:34px 0 10px;
  }
  p { margin:0 0 14px; }
  .quiet { color:var(--ink-2); }

  .shot { margin:18px 0 0; }
  .shot img {
    display:block; width:100%; height:auto;
    border:1px solid var(--shot-edge); border-radius:8px;
    background:var(--surface);
  }
  figcaption {
    font-size:12.5px; color:var(--ink-3); margin-top:9px; max-width:74ch;
  }

  /* An option is a block of argument, not a card in a deck of equals — the
     recommended one carries a gold rule and the others do not (§41's budget). */
  .opt { border-top:1px solid var(--line); padding-top:22px; margin-top:38px; }
  .opt.rec { border-top:2px solid var(--gold); }
  .opthead { display:flex; align-items:baseline; gap:12px; flex-wrap:wrap; margin-bottom:10px; }
  .opthead h2 { margin:0; }
  .tag {
    font-size:var(--fs-micro); letter-spacing:.12em; text-transform:uppercase;
    font-weight:600; color:var(--ink-3);
    border:1px solid var(--line); border-radius:999px; padding:3px 10px;
  }
  .tag.pick { color:var(--gold-deep); border-color:var(--gold); }

  ul.facts { list-style:none; padding:0; margin:14px 0 0; display:grid; gap:9px; }
  ul.facts li { display:flex; gap:14px; align-items:baseline; }
  ul.facts .k {
    flex:0 0 92px; font-size:var(--fs-micro); letter-spacing:.12em;
    text-transform:uppercase; font-weight:600; color:var(--ink-3);
  }
  ul.facts .v { flex:1; color:var(--ink-2); max-width:70ch; }

  table.data {
    border-collapse:collapse; width:100%; margin-top:18px;
    font-variant-numeric:tabular-nums;
  }
  table.data th, table.data td {
    text-align:left; padding:9px 14px 9px 0; border-bottom:1px solid var(--line-soft);
    font-size:14px;
  }
  table.data th {
    font-size:var(--fs-micro); letter-spacing:.12em; text-transform:uppercase;
    color:var(--ink-3); font-weight:600; border-bottom:1px solid var(--line);
  }
  table.data td.n { font-family:"IBM Plex Mono", ui-monospace, monospace; }
  table.data .good { color:var(--good); font-weight:600; }
  table.data .bad { color:var(--attn); font-weight:600; }
  .tblwrap { overflow-x:auto; }

  .ask { border:1px solid var(--line); border-left:3px solid var(--gold);
         background:var(--surface); border-radius:8px; padding:22px 24px; }
  .ask h2 { margin-top:0; }
  .ask ol { margin:0; padding-left:20px; }
  .ask li { margin-bottom:10px; color:var(--ink-2); max-width:70ch; }
  .ask li b { color:var(--ink); font-weight:600; }

  .settled { display:grid; gap:10px; margin-top:16px; }
  .settled div {
    border-left:2px solid var(--line); padding-left:14px; color:var(--ink-2);
    max-width:74ch;
  }
  .settled b { color:var(--ink); font-weight:600; }
  code {
    font-family:"IBM Plex Mono", ui-monospace, monospace; font-size:.92em;
    background:var(--surface-2); padding:1px 5px; border-radius:4px;
  }
</style>

<div class="wrap">
<header>
  <p class="kicker">SMP &middot; mockup for sign-off &middot; monthly plan</p>
  <h1>Targets by month</h1>
  <p class="lede">Proration is flat: the platform divides the year&rsquo;s target
    by twelve and compares whatever has been reported against that. A business
    with a season is judged against a month it never planned to have. This is
    where the twelve numbers would be typed, and what they do to the reading.</p>
  <div class="drawn">
    <span><b>Drawn from</b> the running build, Mobile &rsaquo; MB03</span>
    <span><b>Review point</b> Jun 26 &mdash; 6 of 12 months</span>
    <span><b>Widths</b> 1600 &middot; 1500 &middot; 1280 &middot; 1100</span>
    <span><b>3 September 2026</b></span>
  </div>
</header>

<section>
  <h2>What the plan cannot say today</h2>
  <p class="measure">Every prorating row in the product is prorated the same
    way: the annual target multiplied by the months that have passed, over
    twelve. Nothing in a plan can state that December is four times January.</p>
  <p class="measure quiet">Measured on the shipped plan: <b>17 of 76</b> pillar
    measures and <b>11 of 40</b> unit key objectives compile by <code>Sum</code>,
    so 28 rows are prorated today &mdash; every one of them flat. Rows that
    compile by <code>Latest</code> or <code>Average</code> do not prorate at all,
    for the good reason that no glide path is stored anywhere. A monthly plan
    <em>is</em> that glide path, supplied by the tenant rather than invented by
    us, which is why it makes those two prorate honestly for the first time.</p>
  __SHOT_TODAY__
</section>

<section>
  <h2>One row, two readings</h2>
  <p class="measure">Mobile&rsquo;s <b>Accessory revenue</b>, from the plan as it
    stands: a 300M EGP year, 96M reported, read at June. The seasonal column
    uses an illustrative second-half shape that adds to the same 300M &mdash;
    it is not a claim about Raya&rsquo;s own trading.</p>
  <div class="tblwrap">
  <table class="data">
    <thead><tr><th>Read at Jun 26</th><th>Annual target</th><th>YTD target</th>
      <th>Reported</th><th>Progress</th><th>Band</th></tr></thead>
    <tbody>
      <tr><td>Flat, as today</td><td class="n">300M EGP</td><td class="n">150M EGP</td>
        <td class="n">96M</td><td class="n bad">64%</td><td>Behind</td></tr>
      <tr><td>Its own monthly plan</td><td class="n">300M EGP</td><td class="n">96M EGP</td>
        <td class="n">96M</td><td class="n good">100%</td><td>On plan</td></tr>
    </tbody>
  </table>
  </div>
  <p class="quiet" style="margin-top:14px">Same plan, same figure, same day
    &mdash; and the unit is either 36 points behind or exactly on plan. Which
    one is true is a fact about the business that the plan currently has no way
    to state.</p>
</section>

<section class="opt rec">
  <div class="opthead">
    <h2>Option A &mdash; a drawer under the row</h2>
    <span class="tag pick">Recommended</span>
    <span class="tag">Costs the row 1px</span>
  </div>
  <p class="measure">A quiet <b>MONTHLY</b> chip sits beside every target while
    the pen is open. Pressing it opens twelve boxes across the width of the
    table, in the target&rsquo;s own unit, with what they add up to underneath.
    A full-width row inside a table is the shape the deliverables band already
    uses, so it is not a new component.</p>
  __SHOT_A__
  <figcaption>Complete: twelve months set, so the monthly plan is in force. The
    annual target is then the sum &mdash; drawn and disabled, showing the number
    it now derives, the same way a Yes/No row dims what it no longer uses.</figcaption>
  <ul class="facts">
    <li><span class="k">Costs</span><span class="v">Measured on this table: the
      Target box is 303px before and 306px after &mdash; the column had the
      slack and the chip (72px) came out of it. Row height 56px against 57px.
      The open drawer adds 147px, once, to the row you are working on.</span></li>
    <li><span class="k">Why here</span><span class="v">The chip is in the Target
      cell because the monthly plan <em>is</em> the target. Under Compiled it
      read as a second compile rule.</span></li>
    <li><span class="k">Watch</span><span class="v">The drawer is a row inside a
      sortable table, so it must carry no ordering index &mdash; the &ldquo;+
      Add&rdquo; row being counted there is what silently corrupted a plan in
      &sect;118.</span></li>
  </ul>
  __SHOT_A_PART__
  <figcaption>Incomplete: five months typed, seven blank. It says so, in the
    warning ink, and stays out of force &mdash; the annual target is still the
    authored one and still live. A half-filled year must never quietly become
    the target, or eight months entered would cut it by a third.</figcaption>
</section>

<section class="opt">
  <div class="opthead">
    <h2>Option B &mdash; a floating panel</h2>
    <span class="tag">Covers four rows</span>
  </div>
  <p class="measure">The same twelve boxes in a panel that opens beside the
    cell, the way the milestone month picker already does. It costs the table
    no height at all &mdash; and it covers the rows underneath while it is
    open, including the annual target it is changing.</p>
  __SHOT_B__
  <figcaption>Shot at the same width, from the same build. Four rows are behind
    the panel, and the sum it is producing has to be read back through the box
    it hides.</figcaption>
</section>

<section>
  <h2>What it does to the reading</h2>
  <p class="measure">Nothing on the Performance page is rebuilt: the YTD column
    already prints what the row is measured against, so a seasonal target
    arrives there on its own. What is added is a word saying why the benchmark
    is no longer half the year.</p>
  __SHOT_PERF__
  <figcaption>Row 4 reads 96M against 96M EGP &mdash; on plan &mdash; with
    <b>by month</b> under its annual target. Row 6, Sary revenue, has no monthly
    plan and reads 42M against 75M EGP exactly as it does today: half the year,
    flat. Both ends in one picture.</figcaption>
</section>

<section>
  <h2>Measured, at four widths</h2>
  <p class="measure">Twelve boxes of 72px with their gutters need 970px. The
    rule is that a plan table fits its pane &mdash; never &ldquo;and it
    scrolls&rdquo;.</p>
  <div class="tblwrap">
  <table class="data">
    <thead><tr><th>Window</th><th>Pane</th><th>Table</th><th>Drawer</th>
      <th>Sideways scroll</th></tr></thead>
    <tbody>
      <tr><td class="n">1600</td><td class="n">1325</td><td class="n">1285</td>
        <td>one row of twelve</td><td class="good">none</td></tr>
      <tr><td class="n">1500</td><td class="n">1225</td><td class="n">1185</td>
        <td>one row of twelve</td><td class="good">none</td></tr>
      <tr><td class="n">1280</td><td class="n">1005</td><td class="n">965</td>
        <td>two rows of six</td><td class="good">none</td></tr>
      <tr><td class="n">1100</td><td class="n">825</td><td class="n">785</td>
        <td>two rows of six</td><td class="good">none</td></tr>
    </tbody>
  </table>
  </div>
  <p class="quiet" style="margin-top:14px">It wraps rather than overflowing, so
    the table never gains a sideways scroll at any of the four. On a phone the
    boxes stack further; the plan pen is not a phone screen and is not drawn
    as one here.</p>
</section>

<section>
  <h2>Already settled</h2>
  <div class="settled">
    <div><b>The monthly plan is the target once it is complete.</b> The annual
      box then shows the sum and is read-only. One authored place, so the two
      can never disagree.</div>
    <div><b>A typed 0 is a real month; an empty box is not.</b> A month can
      legitimately plan nothing, so &ldquo;is this month set&rdquo; asks whether
      somebody typed something &mdash; never whether the number is above zero.
      <code>Number("")</code> is 0 and finite, which is exactly how a blank
      month would quietly become a real one.</div>
    <div><b>All four surfaces.</b> A pillar&rsquo;s key measures, a unit&rsquo;s
      and the group&rsquo;s key objectives, a supporting function&rsquo;s
      objectives, and a tactic&rsquo;s outcome &mdash; they run through one
      arithmetic, so they get one control.</div>
    <div><b>Reporting is unchanged.</b> One YTD figure per cycle, as now,
      compared against a benchmark that is finally accurate. No monthly
      actuals.</div>
  </div>
</section>

<section class="ask">
  <h2>What I need from you</h2>
  <ol>
    <li><b>The drawer or the panel</b> &mdash; A or B. I recommend A: nothing is
      covered, and the sum lands beside the target it replaces.</li>
    <li><b>The word on the chip.</b> <b>MONTHLY</b> is what is drawn. It appears
      on every measure while the pen is open, so it is the one piece of
      furniture this adds to rows that will never use it.</li>
    <li><b>Anything in the drawer you would word differently</b> &mdash;
      &ldquo;12 of 12 months set&rdquo;, &ldquo;Adds up to 300M EGP &mdash; the
      annual target&rdquo;, and the amber &ldquo;not in force yet&rdquo;.</li>
  </ol>
  <p style="margin:16px 0 0; color:var(--ink-3); font-size:13.5px">Say yes and
    I&rsquo;ll build it: the arithmetic behind one function, the twelve columns
    the workbook needs so a download and re-upload cannot drop a monthly plan,
    and a check that fails on today&rsquo;s build before it passes on the new
    one. Nothing in a live tenant moves until somebody fills twelve boxes in.</p>
</section>
</div>
"""

DOC = (DOC
       .replace("__SHOT_TODAY__",
                img("today-measures-edit",
                    "Mobile MB03 Key measures with the plan pen open, today")
                + '<figcaption>The Key measures table as it is today, with the '
                  'pen open. Four of these eight rows compile by Sum, and every '
                  'one of them is spread evenly across the year.</figcaption>')
       .replace("__SHOT_A__", img("optionA-drawer-open",
                "The drawer open under Accessory revenue, twelve months set"))
       .replace("__SHOT_A_PART__", img("optionA-incomplete",
                "The same drawer with five of twelve months set"))
       .replace("__SHOT_B__", img("optionB-panel",
                "A floating panel over the measures table"))
       .replace("__SHOT_PERF__", img("after-performance",
                "The Performance table with a seasonal benchmark on row 4")))

OUT.parent.mkdir(parents=True, exist_ok=True)
OUT.write_text(DOC, encoding="utf-8")
print("wrote", OUT, len(DOC), "bytes")
