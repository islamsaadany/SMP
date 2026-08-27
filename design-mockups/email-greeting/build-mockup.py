"""Assemble the greeting mockup from the shots `checks/greeting-mockup.py` took.

The pictures are the REAL platform (§41.9) — driven, not drawn — so this file
only writes the prose around them and inlines them, because a mockup that has
to be downloaded is a review that happens later or not at all (rule 1c).
"""
import base64, pathlib

HERE = pathlib.Path(__file__).resolve().parent
SHOTS = HERE / "shots"
OUT = HERE / "2026-08-27_email-greeting.html"


def img(name, cls=""):
    b = base64.b64encode((SHOTS / name).read_bytes()).decode()
    c = (' class="%s"' % cls) if cls else ""
    return '<img%s alt="" src="data:image/png;base64,%s">' % (c, b)


def fig(name, cap, dark=None):
    """One picture, FULL WIDTH, with its caption.

    The first build put the light and dark twins side by side, which halved
    every picture — and the row shots are 2370px wide and 200px tall, so at
    half width the control being reviewed was 44px tall and unreadable. A
    mockup whose evidence cannot be read is a mockup that has not been shown.
    The dark proof gets its own section at full width instead.
    """
    inner = img(name)
    if dark:
        inner = '<span class="stackimg">' + img(name) + img(dark) + "</span>"
    return "<figure>" + inner + "<figcaption>" + cap + "</figcaption></figure>"


CSS = """
  :root{
    --ground:#F5F6F9; --surface:#FFFFFF; --surface-2:#EDF0F5;
    --line:#D8DEE8; --line-soft:#E6EAF1;
    --ink:#141C2B; --ink-2:#465268; --ink-3:#6E7A90;
    --navy:#173156; --navy-ink:#F2F5FA;
    --gold:#C29B2A; --gold-deep:#7E6410;
    --bad:#B23025; --bad-bg:#FBEDEB;
    --good:#1B6E4E; --good-bg:#E9F4EF;
    --shadow:0 1px 2px rgba(20,28,43,.06), 0 8px 28px rgba(20,28,43,.06);
    --measure:44rem;
  }
  @media (prefers-color-scheme: dark){
    :root:not([data-theme="light"]){
      --ground:#12151C; --surface:#1A1F29; --surface-2:#222834;
      --line:#333B4A; --line-soft:#2A313E;
      --ink:#E7EBF2; --ink-2:#AAB4C6; --ink-3:#8590A3;
      --navy:#132845; --navy-ink:#E7EBF2;
      --gold:#D7B04A; --gold-deep:#E3C266;
      --bad:#E8776B; --bad-bg:#33211F;
      --good:#63BE96; --good-bg:#1B2C26;
      --shadow:0 1px 2px rgba(0,0,0,.4), 0 10px 30px rgba(0,0,0,.35);
    }
  }
  :root[data-theme="dark"]{
    --ground:#12151C; --surface:#1A1F29; --surface-2:#222834;
    --line:#333B4A; --line-soft:#2A313E;
    --ink:#E7EBF2; --ink-2:#AAB4C6; --ink-3:#8590A3;
    --navy:#132845; --navy-ink:#E7EBF2;
    --gold:#D7B04A; --gold-deep:#E3C266;
    --bad:#E8776B; --bad-bg:#33211F;
    --good:#63BE96; --good-bg:#1B2C26;
    --shadow:0 1px 2px rgba(0,0,0,.4), 0 10px 30px rgba(0,0,0,.35);
  }
  *{box-sizing:border-box}
  body{
    background:var(--ground); color:var(--ink);
    font:400 16.5px/1.62 "Public Sans", ui-sans-serif, system-ui, -apple-system, "Segoe UI", sans-serif;
    margin:0; padding:0 20px 96px;
    -webkit-font-smoothing:antialiased;
  }
  .wrap{max-width:66rem; margin:0 auto}
  h1,h2,h3{font-family:"Newsreader", Georgia, "Times New Roman", serif; font-weight:600;
    text-wrap:balance; letter-spacing:-.005em; margin:0}
  .kicker{font:600 11px/1 "IBM Plex Mono", ui-monospace, SFMono-Regular, Menlo, monospace;
    letter-spacing:.16em; text-transform:uppercase; color:var(--gold-deep)}

  header.mast{padding:64px 0 34px; border-bottom:1px solid var(--line)}
  header.mast h1{font-size:clamp(34px,5.2vw,52px); line-height:1.1; margin:14px 0 16px}
  header.mast p{max-width:var(--measure); color:var(--ink-2); font-size:18px; margin:0}
  .standing{display:flex; flex-wrap:wrap; align-items:center; gap:10px; margin-top:26px;
    font:600 12px/1 "IBM Plex Mono", ui-monospace, monospace; letter-spacing:.08em;
    text-transform:uppercase; color:var(--ink-3)}
  .standing b{display:inline-block; padding:5px 10px; border-radius:999px;
    background:var(--gold); color:#1B1400; letter-spacing:.08em}

  .item{padding:52px 0; border-bottom:1px solid var(--line)}
  .item:last-of-type{border-bottom:0}
  .itemhead{display:flex; gap:20px; align-items:baseline; flex-wrap:wrap}
  .num{font:600 11px/1 "IBM Plex Mono", ui-monospace, monospace; color:var(--gold-deep);
    letter-spacing:.14em; flex:none; padding-top:8px; text-transform:uppercase}
  .itemhead h2{font-size:clamp(25px,3.2vw,33px); line-height:1.2}
  .said{margin:22px 0 0; padding:14px 0 14px 20px; border-left:3px solid var(--gold);
    color:var(--ink-2); font-style:italic; max-width:var(--measure)}
  .said span{font-style:normal; display:block; margin-top:8px;
    font:600 10.5px/1 "IBM Plex Mono", ui-monospace, monospace;
    letter-spacing:.14em; text-transform:uppercase; color:var(--ink-3)}
  .body > *{max-width:var(--measure)}
  .body figure, .body .wide{max-width:none}
  .body h3{font-size:19px; margin:34px 0 10px}
  .body p{margin:0 0 14px; color:var(--ink-2)}
  .body p strong, .body li strong{color:var(--ink); font-weight:700}
  .body ul{margin:0 0 14px; padding-left:20px; color:var(--ink-2)}
  .body li{margin-bottom:7px}
  code{font:400 .88em/1.4 "IBM Plex Mono", ui-monospace, monospace;
    background:var(--surface-2); padding:2px 5px; border-radius:4px; color:var(--ink)}

  figure{margin:26px 0 8px}
  figure img{display:block; width:100%; height:auto; border:1px solid var(--line);
    border-radius:8px; background:var(--surface); box-shadow:var(--shadow)}
  .stackimg{display:grid; gap:16px}
  figcaption{margin-top:10px; font-size:13px; line-height:1.5; color:var(--ink-3);
    max-width:var(--measure)}
  figcaption b{display:block; color:var(--ink); font-weight:700;
    font-size:10.5px; letter-spacing:.14em; text-transform:uppercase; margin-bottom:4px}
  figcaption b.bad{color:var(--bad)} figcaption b.good{color:var(--good)}

  table.dec{border-collapse:collapse; width:100%; max-width:var(--measure); margin:22px 0 6px;
    font-size:15px}
  table.dec th, table.dec td{text-align:left; padding:11px 14px; border-bottom:1px solid var(--line-soft);
    vertical-align:top; color:var(--ink-2)}
  table.dec th{font:600 10.5px/1.4 "IBM Plex Mono", ui-monospace, monospace;
    letter-spacing:.12em; text-transform:uppercase; color:var(--ink-3); white-space:nowrap}
  table.dec td:first-child{color:var(--ink); font-weight:700; width:34%}
  .scroller{overflow-x:auto}

  .rec{border:1px solid var(--line); border-left:3px solid var(--good);
    background:var(--surface); border-radius:0 8px 8px 0; padding:18px 22px;
    margin:26px 0; max-width:var(--measure); box-shadow:var(--shadow)}
  .rec.ask{border-left-color:var(--gold)}
  .rec .kicker{display:block; margin-bottom:8px}
  .rec.ask .kicker{color:var(--gold-deep)}
  .rec p{color:var(--ink-2); margin:0 0 12px}
  .rec p:last-child{margin-bottom:0}

  .cost{display:flex; gap:14px; align-items:flex-start; margin:18px 0;
    padding:14px 18px; background:var(--surface-2); border-radius:8px; max-width:var(--measure)}
  .cost .kicker{flex:none; padding-top:3px; color:var(--ink-3)}
  .cost p{margin:0; font-size:15px; color:var(--ink-2)}

  footer{padding:52px 0 0; border-top:1px solid var(--line); margin-top:8px}
  footer h2{font-size:26px; margin-bottom:14px}
  footer ol{max-width:var(--measure); color:var(--ink-2); padding-left:20px; margin:0}
  footer li{margin-bottom:9px}
  .sig{margin-top:34px; font:600 11px/1.6 "IBM Plex Mono", ui-monospace, monospace;
    letter-spacing:.12em; text-transform:uppercase; color:var(--ink-3)}
  a{color:var(--gold-deep)}
  :focus-visible{outline:2px solid var(--gold); outline-offset:2px}
  @media (prefers-reduced-motion: reduce){ *{animation:none !important; transition:none !important} }
"""

HTML = """<title>Dear Ahmed</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Newsreader:opsz,wght@6..72,400;6..72,600&family=Public+Sans:wght@400;500;700&family=IBM+Plex+Mono:wght@400;600&display=swap">
<style>%(css)s</style>

<div class="wrap">

<header class="mast">
  <div class="kicker">Spec 021 &middot; Send a message</div>
  <h1>Dear Ahmed</h1>
  <p>An on/off switch on the composer that opens every email with the receiver&rsquo;s
     own first name. Drawn in the real platform, not sketched &mdash; every picture
     below is the built product with the proposal injected into the live page.</p>
  <div class="standing"><b>Waiting on your sign-off</b> <span>nothing in src/ has been touched</span></div>
</header>

<section class="item">
  <div class="itemhead"><div class="num">The ask</div><h2>What you said</h2></div>
  <div class="body">
    <div class="said">For the emails sent can we make an option while sending the email
      to customize the email by the first name of the receiver like starting the email
      with Dear Ahmed and then the body comes after &mdash; it&rsquo;s a turn on and off option.
      <span>Islam &middot; 27 August 2026</span></div>

    <h3>Why this is cheaper than it sounds</h3>
    <p><strong>Every recipient already receives their own separate email.</strong> The
      platform has never sent one message to a list of addresses &mdash; it posts one
      message per person, which is how the record of who received what gets written.
      So nothing about how many emails go out, or who can see whom, changes at all.
      What changes is what each of those emails says at the top.</p>
    <p>The one real consequence: today the browser builds one email and the server
      sends that same one to everybody. A greeting that names the receiver means the
      emails are no longer identical, so <strong>the name is filled in on the server</strong>
      &mdash; which is the side that knows who the recipients actually are.</p>
  </div>
</section>

<section class="item">
  <div class="itemhead"><div class="num">Settled</div><h2>The five decisions</h2></div>
  <div class="body">
    <p>All five are yours, from the questions on 27 August. Recorded here so the
      build has one place to be checked against.</p>
    <div class="scroller"><table class="dec">
      <tr><th>Question</th><th>Answer</th></tr>
      <tr><td>Which name</td><td>The <strong>first name</strong>, kept whole when it is
        compound &mdash; &ldquo;Dear Ahmed&rdquo;, and &ldquo;Dear Abd El Moniem&rdquo;,
        never &ldquo;Dear Abd&rdquo;.</td></tr>
      <tr><td>The switch&rsquo;s default</td><td><strong>Off.</strong> A message sends
        exactly as it does today unless you turn it on for that message.</td></tr>
      <tr><td>The greeting word</td><td><strong>Editable per message</strong>, starting
        at &ldquo;Dear&rdquo;.</td></tr>
      <tr><td>Which emails</td><td><strong>Send a message only</strong>, including
        <em>Send me a copy</em>. Chat replies and password emails are untouched.</td></tr>
      <tr><td>Where it lives</td><td>On the composer, with the button fields &mdash; a
        property of one message, never a Setup page.</td></tr>
    </table></div>
  </div>
</section>

<section class="item">
  <div class="itemhead"><div class="num">The row</div><h2>One switch, and a word</h2></div>
  <div class="body">
    <p>It sits under the message and above the button fields &mdash; the order the email
      itself reads in: the greeting is the top of the message, the button is the bottom.
      The switch is <strong>the platform&rsquo;s own Off/On control</strong>, the one the
      naming setting already wears; nothing new was invented to hold it.</p>

    %(row_off)s
    %(row_on)s

    <div class="cost">
      <div class="kicker">Caught by drawing it</div>
      <p>The word box first ran to half the width of the pane, because the row it sits
        in is a two-column grid. A field that wide reads as one expecting a sentence.
        It is sized for one word now, with the note beside it rather than under it.</p>
    </div>
  </div>
</section>

<section class="item">
  <div class="itemhead"><div class="num">The preview</div><h2>What the message looks like</h2></div>
  <div class="body">
    <p>The greeting is the first paragraph of the body, in the body&rsquo;s own type &mdash;
      not a heading, not a styled banner. The preview is built by the same builder that
      sends, so what is on screen is what lands in an inbox.</p>
    <p><strong>The sample is named under the card, never inside it.</strong> The preview
      shows the first person on your list, and the line beneath says so. It is deliberately
      outside the email: a badge inside would be a line nobody receives, and the whole
      point of that preview is that it is the real thing.</p>

    %(prev)s
    %(prevc)s

    <div class="rec">
      <div class="kicker">The compound case</div>
      <p><strong>Abd El Moniem Mohamed Abd El Moniem Mahmoud</strong> is a real row on
        your register, and it is the case that made me ask the name question twice.
        The greeting reads <strong>Dear Abd El Moniem</strong> &mdash; one first name,
        kept whole. This uses the same name rules the register already has, so
        &ldquo;Abd&rdquo; alone can never come out.</p>
    </div>
  </div>
</section>

<section class="item">
  <div class="itemhead"><div class="num">In place</div><h2>The whole page</h2></div>
  <div class="body">
    <p>A row that reads well on its own can still crowd the page, so here it is where
      it will actually live &mdash; between the message and the Send bar, at the width
      the pane really is.</p>
    %(whole)s
  </div>
</section>

<section class="item">
  <div class="itemhead"><div class="num">Both themes</div><h2>Checked in dark too</h2></div>
  <div class="body">
    <p>Every visual decision in this product is made in both palettes, because a
      colour that reads in one can vanish in the other. Same build, same page,
      dark.</p>
    %(darkpair)s
  </div>
</section>

<section class="item">
  <div class="itemhead"><div class="num">The rules</div><h2>What it must never do</h2></div>
  <div class="body">
    <ul>
      <li><strong>Never &ldquo;Dear ,&rdquo;.</strong> A register row whose name cannot
        produce a greeting gets the message with no greeting line at all. The send is
        not refused and nothing is marked &mdash; a greeting is a courtesy, not a
        condition of delivery.</li>
      <li><strong>Off is byte-identical to today.</strong> With the switch off the
        builder emits nothing, the server substitutes nothing, and every recipient gets
        the same email they would get now.</li>
      <li><strong>Blanking the word does not send a bare name.</strong> It falls back to
        &ldquo;Dear&rdquo;. The way to send a message with no greeting is the switch.</li>
      <li><strong>Your copy greets you.</strong> <em>Send me a copy</em> uses the first
        name of whoever is <strong>signed in</strong> &mdash; never the person you are
        viewing as, which would put a real message in a real colleague&rsquo;s inbox.</li>
      <li><strong>A draft remembers it.</strong> Save a draft with the greeting on and
        it reopens on, with the same word.</li>
      <li><strong>Correcting how somebody is greeted is one door.</strong> It is the
        Name column on the register &mdash; there is no per-person override here.</li>
    </ul>

    <div class="cost">
      <div class="kicker">What it costs</div>
      <p>One nullable column on drafts and on the sent record, one small migration, and
        one row on the composer. No new page, no Setup entry, no change to any other
        email the platform sends.</p>
    </div>
  </div>
</section>

<footer>
  <h2>What I need from you</h2>
  <ol>
    <li><strong>Sign off the row</strong> &mdash; its place under the message, the label
      <em>Open with a greeting</em>, and the word box beside it.</li>
    <li><strong>Sign off the preview line</strong> &mdash; the sample name shown under the
      card rather than marked inside it.</li>
    <li>Say <em>build it</em> and I will, against the spec, with a check that proves each
      recipient gets their own name and that off sends exactly what it sends today.</li>
  </ol>
  <div class="sig">
    Drawn in the real platform &middot; light and dark &middot; every picture is the built file<br>
    spec 021 pushed &middot; nothing in src/ touched &middot; nothing merged to main
  </div>
</footer>

</div>
"""

page = HTML % {
    "css": CSS,
    # The label is a display:block heading in this stylesheet, so the sentence
    # after it has to stand on its own rather than continue it.
    "row_off": fig("row-off.png",
                   "<b>Off</b>How every message opens. The switch is the platform&rsquo;s "
                   "own Off/On pair &mdash; the same control the naming setting uses."),
    "row_on": fig("row-on.png",
                  "<b>On</b>The word box holds one word and is sized for one. The note "
                  "beside it says what will happen, and what happens to a row with no "
                  "usable name."),
    "prev": fig("preview-greeted.png",
                "The message as it arrives. &ldquo;Dear Ahmed,&rdquo; is the first "
                "paragraph of the body, in the body&rsquo;s own type &mdash; and the line "
                "under the card says whose name is being shown."),
    "prevc": fig("preview-compound.png",
                 "The same message for the compound name on your register. One first "
                 "name, kept whole."),
    "whole": fig("composer-whole.png",
                 "Send a message, whole, with the greeting on. The message, then the "
                 "sample line, then the greeting row, then the button fields, then Send."),
    "darkpair": fig("row-on-dark.png",
                    "The same row and the same message in dark. The email card itself "
                    "stays light in both, because an email is not the platform &mdash; "
                    "its colours are literal and every client renders them the same way.",
                    dark="preview-greeted-dark.png"),
}
OUT.write_text(page)
print("wrote %s (%.1f MB)" % (OUT, OUT.stat().st_size / 1e6))
