"""Assemble the "how big should the way in be" document from the four shots.

Run `monthly-chip-mockup.py` first — this only assembles. Pictures are embedded
as data URIs: a mockup is LOOKED AT, and a page that has to fetch six files from
a folder only renders on the machine that made it (rule 1c).
"""
import base64, pathlib

ROOT = pathlib.Path(__file__).resolve().parents[3]
SHOTS = ROOT / "design-mockups/monthly-chip/shots"
OUT = ROOT / "design-mockups/monthly-chip/2026-09-04_the-way-in.html"


def img(name, alt):
    b = base64.b64encode((SHOTS / (name + ".png")).read_bytes()).decode()
    return ('<figure class="shot"><img alt="%s" src="data:image/png;base64,%s">'
            '</figure>' % (alt, b))


DOC = """<title>The Way In</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Newsreader:ital,opsz,wght@0,6..72,400;0,6..72,500;1,6..72,400&family=IBM+Plex+Sans:wght@400;500;600&family=IBM+Plex+Mono:wght@400;500&display=swap">
<style>
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
    background:var(--ground); color:var(--ink); margin:0;
    font-family:"IBM Plex Sans", ui-sans-serif, system-ui, -apple-system, sans-serif;
    font-size:15px; line-height:1.55; padding:0 24px 96px;
  }
  .wrap { max-width:1220px; margin:0 auto; }
  .measure { max-width:68ch; }

  header { padding:56px 0 34px; border-bottom:1px solid var(--line); margin-bottom:40px; }
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

  section { margin:0 0 48px; }
  h2 {
    font-family:Newsreader, Georgia, serif; font-weight:400;
    font-size:27px; line-height:1.2; margin:0 0 14px; letter-spacing:-.005em;
  }
  p { margin:0 0 14px; }
  .quiet { color:var(--ink-2); }

  .shot { margin:18px 0 0; }
  .shot img {
    display:block; width:100%; height:auto;
    border:1px solid var(--shot-edge); border-radius:8px; background:var(--surface);
  }
  figcaption { font-size:12.5px; color:var(--ink-3); margin-top:9px; max-width:76ch; }

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
    flex:0 0 82px; font-size:var(--fs-micro); letter-spacing:.12em;
    text-transform:uppercase; font-weight:600; color:var(--ink-3);
  }
  ul.facts .v { flex:1; color:var(--ink-2); max-width:72ch; }

  .tblwrap { overflow-x:auto; }
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
  table.data .bad { color:var(--bad); font-weight:600; }

  .ask { border:1px solid var(--line); border-left:3px solid var(--gold);
         background:var(--surface); border-radius:8px; padding:22px 24px; }
  .ask h2 { margin-top:0; }
  .ask ol { margin:0; padding-left:20px; }
  .ask li { margin-bottom:10px; color:var(--ink-2); max-width:70ch; }
  .ask li b { color:var(--ink); font-weight:600; }
  code {
    font-family:"IBM Plex Mono", ui-monospace, monospace; font-size:.92em;
    background:var(--surface-2); padding:1px 5px; border-radius:4px;
  }
</style>

<div class="wrap">
<header>
  <p class="kicker">SMP &middot; mockup for sign-off &middot; monthly plan</p>
  <h1>The way in</h1>
  <p class="lede">You said the <b>MONTHLY</b> button is big. It is &mdash; but not
    in the way it looks: measured on your own table it costs the target box
    nothing at all. What makes it big is that it is bordered, uppercase and bold,
    eight times down one column, on rows that will never use it. Here are four
    treatments, drawn in the real table.</p>
  <div class="drawn">
    <span><b>Drawn from</b> the running build, Mobile &rsaquo; MB03, pen open</span>
    <span><b>Row 4</b> carries a monthly plan; the other seven do not</span>
    <span><b>4 September 2026</b></span>
  </div>
</header>

<section>
  <h2>What it actually costs</h2>
  <p class="measure">All four options leave the Target box between 334 and 343
    pixels &mdash; the column has slack, so the control comes out of the column's
    spare width rather than out of the box. The row is 57px in every one of them.
    <b>This is a decision about weight, not about room</b>, which also means the
    quietest option buys no space; it only stops shouting.</p>
  <div class="tblwrap">
  <table class="data">
    <thead><tr><th>Treatment</th><th>Control</th><th>Target box</th><th>Row</th>
      <th>Says what it is</th><th>Says which rows have one</th></tr></thead>
    <tbody>
      <tr><td>Today &mdash; bordered chip</td><td class="n">72px</td><td class="n">343px</td>
        <td class="n">57px</td><td class="good">yes</td><td class="good">yes</td></tr>
      <tr><td>The word, quiet</td><td class="n">50px</td><td class="n">335px</td>
        <td class="n">57px</td><td class="good">yes</td><td class="good">yes</td></tr>
      <tr><td>A mark</td><td class="n">24px</td><td class="n">335px</td>
        <td class="n">57px</td><td class="bad">on hover only</td><td class="good">clearest</td></tr>
      <tr><td>A caret on the box</td><td class="n">13px</td><td class="n">334px</td>
        <td class="n">57px</td><td class="bad">no</td><td class="bad">no</td></tr>
    </tbody>
  </table>
  </div>
</section>

<section class="opt">
  <div class="opthead">
    <h2>1 &mdash; What shipped</h2>
    <span class="tag">72px</span>
  </div>
  <p class="measure">Bordered, uppercase, bold. Three emphasis devices on a
    secondary control, so it carries the same weight as the fields beside it and
    repeats eight times.</p>
  __SHOT1__
</section>

<section class="opt">
  <div class="opthead">
    <h2>2 &mdash; The word, quiet</h2>
    <span class="tag">50px</span>
  </div>
  <p class="measure">Same word, no box, sentence case, a hairline underline. It
    stops competing with the controls and still says what it does. What remains
    is that the word itself repeats down the column &mdash; eight
    <em>Monthly</em>s under a heading that says Target.</p>
  __SHOT2__
</section>

<section class="opt rec">
  <div class="opthead">
    <h2>3 &mdash; A mark</h2>
    <span class="tag pick">Recommended</span>
    <span class="tag">24px</span>
  </div>
  <p class="measure">Twelve cells, four across and three down: a year by month,
    without a word. It is the platform&rsquo;s own per-row control &mdash; exactly
    the size and shape of the eye that hides a row, two columns to its left, with
    the same amber lit state.</p>
  __SHOT3__
  <ul class="facts">
    <li><span class="k">Why</span><span class="v">It is the only one where
      &ldquo;which of these eight has a monthly plan&rdquo; reads at a glance:
      row 4 is amber and the other seven are grey. That question gets asked far
      more often than &ldquo;what does this button do&rdquo;, which is asked
      once.</span></li>
    <li><span class="k">Cost</span><span class="v">A first-time reader has to
      hover it to learn what it is. Against that: the hover says so, the drawer
      names itself when it opens, and the knowledge base answers <em>How do I set
      a target month by month?</em></span></li>
    <li><span class="k">Drawn</span><span class="v">As SVG, not a font character
      &mdash; a glyph that is mapped and not drawn ships as a blank box, which
      this project has been bitten by twice.</span></li>
  </ul>
</section>

<section class="opt">
  <div class="opthead">
    <h2>4 &mdash; A caret on the box</h2>
    <span class="tag">13px</span>
    <span class="tag">Refused</span>
  </div>
  <p class="measure">The quietest, and it fails the thing the control is for:
    row 4 is indistinguishable from the rest except by its dimmed box, so a plan
    with three seasonal measures in it looks exactly like one with none. A bare
    caret against a text field also reads as a dropdown that would fill that
    field, which is not what it does.</p>
  __SHOT4__
</section>

<section>
  <h2>None of them exists while reading</h2>
  <p class="measure">All four are drawn only with the pen open, so the page
    somebody reads is unchanged whichever you pick. The word <em>by month</em>
    under the annual target on Performance is what a reader sees, and that is
    not changing here.</p>
  __SHOTR__
</section>

<section class="ask">
  <h2>What I need from you</h2>
  <ol>
    <li><b>1, 2, 3 or 4.</b> I recommend <b>3</b>: it is a quarter of the width,
      it matches the control already sitting on that row, and it is the only one
      that answers &ldquo;which rows have a monthly plan&rdquo; from across the
      table.</li>
    <li><b>If you would rather keep a word</b>, 2 is the one &mdash; same
      discoverability as today at two thirds of the width and none of the
      shouting.</li>
  </ol>
  <p style="margin:16px 0 0; color:var(--ink-3); font-size:13.5px">Whichever you
    pick is a small change: the control is one builder called from four tables,
    so it moves in one place. Nothing about the drawer, the arithmetic or the
    stored plan changes.</p>
</section>
</div>
"""

DOC = (DOC
       .replace("__SHOT1__", img("opt1", "The bordered uppercase chip on every row"))
       .replace("__SHOT2__", img("opt2", "A quiet underlined word on every row"))
       .replace("__SHOT3__", img("opt3", "A twelve-cell mark on every row, lit on row 4"))
       .replace("__SHOT4__", img("opt4", "A bare caret at the end of each target box"))
       .replace("__SHOTR__", img("reading",
                "The same table with the pen shut — no control at all")))

OUT.parent.mkdir(parents=True, exist_ok=True)
OUT.write_text(DOC, encoding="utf-8")
print("wrote", OUT, len(DOC), "bytes")
