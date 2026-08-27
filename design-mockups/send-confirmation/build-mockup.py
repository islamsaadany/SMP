"""Assemble the send-confirmation mockup from the shots the capture took.

The pictures are the REAL send bar (§41.9) — the platform driven, a message
actually sent through its own controls, and the proposal injected into the live
bar. This file writes the prose around them and inlines them, because a mockup
that has to be downloaded is a review that happens later or not at all.
"""
import base64, pathlib, re

HERE = pathlib.Path(__file__).resolve().parent
SHOTS = HERE / "shots"
OUT = HERE / "2026-08-27_send-confirmation.html"
CSS = re.search(r'CSS = """(.*?)"""',
                (HERE.parent / "email-greeting/build-mockup.py").read_text(), re.S).group(1)


def img(name):
    b = base64.b64encode((SHOTS / name).read_bytes()).decode()
    return '<img alt="" src="data:image/png;base64,%s">' % b


def fig(name, cap, dark=None):
    inner = img(name)
    if dark:
        inner = '<span class="stackimg">' + img(name) + img(dark) + "</span>"
    return "<figure>" + inner + "<figcaption>" + cap + "</figcaption></figure>"


HTML = """<title>Did It Send</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Newsreader:opsz,wght@6..72,400;6..72,600&family=Public+Sans:wght@400;500;700&family=IBM+Plex+Mono:wght@400;600&display=swap">
<style>%(css)s</style>

<div class="wrap">

<header class="mast">
  <div class="kicker">Send a message &middot; after the send</div>
  <h1>Did it send?</h1>
  <p>It did &mdash; and the screen barely says so. What follows is measured on the
     built platform, with a message actually sent through its own controls.</p>
  <div class="standing"><b>Built</b> <span>on the branch &middot; not merged to main</span></div>
</header>

<section class="item">
  <div class="itemhead"><div class="num">The ask</div><h2>What you said</h2></div>
  <div class="body">
    <div class="said">When I send I don&rsquo;t get any verification that the message
      was sent and the page stays the same view.
      <span>Islam &middot; 27 August 2026</span></div>

    <h3>The message really is going out</h3>
    <p>First, the reassuring part: <strong>the send works.</strong> Driven on the
      built platform, the request goes, the server answers, and the record is
      written. Nothing has been lost and nothing needs re-sending.</p>
    <p>What is wrong is everything after that moment &mdash; and it is <strong>two
      separate faults</strong>, not one.</p>

    %(today)s
  </div>
</section>

<section class="item">
  <div class="itemhead"><div class="num">Fault one</div><h2>Success is written in the failure-neutral voice</h2></div>
  <div class="body">
    <p>The words <em>76 messages sent.</em> are on that bar. They are
      <strong>12px, in the same quiet grey as an empty space</strong>, fourth in a
      row after three loud buttons.</p>
    <p>And that grey is not a styling oversight, it is a dropped stitch: the code
      works out whether the send succeeded and stores it &mdash;
      <code>ok: !j.failed</code> &mdash; and <strong>nothing ever reads it.</strong>
      A <em>failed</em> send does turn red. A successful one gets no colour at all,
      because the success path repaints the bar and the repaint draws that line
      plain. So the two outcomes that most need telling apart are drawn in one
      voice and one of them is the voice for &ldquo;nothing happened&rdquo;.</p>
  </div>
</section>

<section class="item">
  <div class="itemhead"><div class="num">Fault two</div><h2>The loudest thing on the bar still says &ldquo;not sent&rdquo;</h2></div>
  <div class="body">
    <p>This is the one that matters, and it is the half of your sentence about the
      page not changing.</p>
    <p>After a successful send the big orange button <strong>still reads SEND TO 76
      PEOPLE and is still live.</strong> The subject is still there, the message is
      still there, the audience is still chosen. Every loud signal on the screen
      says <em>you have not sent this yet</em>, which is exactly what your eye reads
      and exactly what the small grey sentence is arguing against.</p>
    <div class="cost">
      <div class="kicker">The real risk</div>
      <p>A second press sends the whole thing again, to all seventy-six, and nothing
        on screen would have warned you. &sect;95 put a confirmation in front of the
        send because it cannot be recalled &mdash; and then left the button loaded.</p>
    </div>
  </div>
</section>

<section class="item">
  <div class="itemhead"><div class="num">Proposed</div><h2>The bar reports, and moves on</h2></div>
  <div class="body">
    <p>One change, answering both faults:</p>
    <ul>
      <li><strong>The outcome is said properly</strong> &mdash; <em>76 messages
        sent.</em> in the platform&rsquo;s own green, at reading size, with the
        skipped count beside it in grey. A partial failure says so in red, as it
        does now.</li>
      <li><strong>The orange button stops offering the send.</strong> It becomes
        <em>Write another</em> &mdash; the thing you would actually do next &mdash;
        which clears the composer for a new message. Send returns the moment you
        edit the message or change who it goes to, because that is a different
        message.</li>
    </ul>

    %(proposed)s

    <div class="rec">
      <div class="kicker">Why not a pop-up</div>
      <p>A dialog after sending is one more thing to dismiss, and the bar is already
        where your eye is &mdash; you just pressed a button on it. The report belongs
        where the act happened.</p>
    </div>
    %(built)s

    <div class="rec">
      <div class="kicker">Measured, not assumed</div>
      <p>The green reads <strong>6.82:1</strong> on the bar in light and
        <strong>10.45:1</strong> in dark; the red 7.55 and 8.14. All well clear.</p>
    </div>
  </div>
</section>

<footer>
  <h2>What I need from you</h2>
  <ol>
    <li><strong>Sign off the bar</strong> &mdash; the green outcome line, and the
      orange button becoming <em>Write another</em>.</li>
    <li>Say <em>build it</em> and I will, with a check that presses Send and proves
      the outcome is announced and that the send cannot be repeated by a second
      press.</li>
  </ol>
  <div class="sig">
    Measured on the built platform &middot; a real send through its own controls &middot; light and dark<br>
    nothing in src/ touched &middot; nothing merged to main
  </div>
</footer>

</div>
"""

page = HTML % {
    "css": CSS,
    "today": fig("today.png",
                 "<b>Today</b>The send bar straight after a successful send. The words "
                 "are there &mdash; and the orange button beside them still says "
                 "<em>Send to 76 people</em>.",
                 dark="today-dark.png"),
    "built": fig("built.png",
                 "<b>As built</b>The shipped bar, captured the same way &mdash; a real "
                 "send through the product&rsquo;s own controls, on the branch build.",
                 dark="built-dark.png"),
    "proposed": fig("proposed.png",
                    "<b>Proposed</b>The same bar, same build. The outcome reads at a "
                    "size worth reading, and the loud control has become the next thing "
                    "to do rather than the same thing again.",
                    dark="proposed-dark.png"),
}
OUT.write_text(page)
print("wrote %s (%.1f MB)" % (OUT, OUT.stat().st_size / 1e6))
