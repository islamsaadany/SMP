"""Assemble the send-dashboard mockup from the shots the capture took.

The pictures are the REAL platform (§41.9): the built file served with the
send-message stub, walked to Setup > Send a message, with the PANE's contents
replaced by the proposal — chrome, rail, type and classes all the product's
own, and the dashboard assembled with the page's own `section()`.
"""
import base64, pathlib, re

HERE = pathlib.Path(__file__).resolve().parent
SHOTS = HERE / "shots"
OUT = HERE / "2026-08-27_send-dashboard.html"
CSS = re.search(r'CSS = """(.*?)"""',
                (HERE.parent / "email-greeting/build-mockup.py").read_text(), re.S).group(1)


def img(name):
    return '<img alt="" src="data:image/png;base64,%s">' % \
        base64.b64encode((SHOTS / name).read_bytes()).decode()


def fig(name, cap, dark=None):
    inner = img(name)
    if dark:
        inner = '<span class="stackimg">' + img(name) + img(dark) + "</span>"
    return "<figure>" + inner + "<figcaption>" + cap + "</figcaption></figure>"


HTML = """<title>Messages, Then The Message</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Newsreader:opsz,wght@6..72,400;6..72,600&family=Public+Sans:wght@400;500;700&family=IBM+Plex+Mono:wght@400;600&display=swap">
<style>%(css)s</style>

<div class="wrap">

<header class="mast">
  <div class="kicker">Send a message &middot; proposed</div>
  <h1>Messages, then the message</h1>
  <p>One page, two tabs: what has gone out, and writing the next one. Sending
     lands you back on the record. No grey prose on either.</p>
  <div class="standing"><b>Waiting on your sign-off</b> <span>nothing in src/ has been touched</span></div>
</header>

<section class="item">
  <div class="itemhead"><div class="num">The ask</div><h2>What you said</h2></div>
  <div class="body">
    <div class="said">The opening page of Send a message should be a dashboard of
      what was sent &mdash; sent to whom, how many people. And when I say create a
      message it takes me to another tab to write it, and when I finish and send
      it, it should take me back to the dashboard and show me that the message was
      sent there. It should be a cleaner configuration.
      <span>Islam &middot; 27 August 2026</span></div>

    <h3>Why this is mostly a rearrangement</h3>
    <p>Everything the dashboard needs is <strong>already recorded</strong>. Every
      send writes a row &mdash; subject, when, who it was aimed at, how many were
      reached, how many failed, and who sent it &mdash; plus a row per recipient
      saying whether it arrived. Today that record is hidden behind a small
      <em>Sent</em> dropdown in the corner, and the page opens on the composer
      instead.</p>
    <p>So this moves the record to the front and makes writing a message a step
      you choose, rather than the thing the page is.</p>
  </div>
</section>

<section class="item">
  <div class="itemhead"><div class="num">Today</div><h2>The page opens on a blank form</h2></div>
  <div class="body">
    <p>Whatever you came to do &mdash; check whether last week's message went out,
      see who missed it, pick up a draft &mdash; the page opens ready to compose,
      and the record is two dropdowns away.</p>
    %(today)s
  </div>
</section>

<section class="item">
  <div class="itemhead"><div class="num">1</div><h2>It opens on what was sent</h2></div>
  <div class="body">
    <p>Newest first. Each row says <strong>what went, when, who it went to, how
      many it reached</strong> and who sent it &mdash; and opening a row shows what
      happened to each person, which is the one place &ldquo;did they get it&rdquo;
      can be answered.</p>
    <p><strong>Drafts sit above it</strong>, under <em>Not sent yet</em>. They were
      behind their own dropdown; unfinished work you cannot see is unfinished work
      you forget. Both dropdowns go.</p>
    <p><strong>And no grey descriptions.</strong> The headings say what the two
      lists are; a paragraph under each saying it again in grey is the rest of the
      &ldquo;cleaner configuration&rdquo;. They go on the writing tab too &mdash;
      one page, one rule.</p>
    %(dashboard)s
    <div class="cost">
      <div class="kicker">Deliberately not there</div>
      <p>No totals strip across the top. Each row already says how many people it
        reached; a lifetime total answers a question nobody asks and is one more
        number to keep true.</p>
    </div>
  </div>
</section>

<section class="item">
  <div class="itemhead"><div class="num">2</div><h2>Writing one is a step you take</h2></div>
  <div class="body">
    <p>The second tab is the composer &mdash; unchanged, every control of it,
      including the greeting row and Send me a copy. What went is the grey prose
      under its three headings, which bought back most of a screen.</p>
    %(compose)s
  </div>
</section>

<section class="item">
  <div class="itemhead"><div class="num">3</div><h2>Sending brings you back</h2></div>
  <div class="body">
    <p>The confirmation lands <strong>where the record is</strong>: a green line
      saying how many it went to and how many were skipped, and the message itself
      at the top of the list, marked as the one that just went.</p>
    <p>This is a better answer to the thing you raised this morning than the one I
      built: instead of the bar reporting and the page staying put, the page
      <em>moves</em>, and what it moves to is the proof.</p>
    %(aftersend)s
    <div class="rec">
      <div class="kicker">If some of them fail</div>
      <p>You still come back here. The message did go to most people, the row shows
        the failures in red, and opening it names who missed out &mdash; one
        behaviour, not two.</p>
    </div>
    <div class="rec ask">
      <div class="kicker">What this replaces</div>
      <p><strong>Write another</strong> in the send bar goes: coming back to the
        dashboard is the same idea done better. The outcome line goes with it. What
        stays is the rule underneath &mdash; that after a send, the send cannot be
        repeated by one press.</p>
    </div>
  </div>
</section>

<footer>
  <h2>One thing to decide, and one to know</h2>
  <p style="max-width:var(--measure);color:var(--ink-2);margin:0 0 14px">
    <strong>One sentence was doing real work</strong> and I have removed it with the
    rest: <em>&ldquo;Tick as many as you like &mdash; they add up rather than narrow
    each other.&rdquo;</em> That behaviour is genuinely not obvious, and nothing else
    on the page says it. Say the word and it comes back as a hover on the heading
    rather than as a paragraph.</p>
  <p style="max-width:var(--measure);color:var(--ink-2);margin:0 0 22px">
    <strong>And the rule is wider than this page.</strong> Every other Setup page
    still carries its grey description. I have not touched them &mdash; you asked
    about this one. Say so and I will strip them across Setup in one pass.</p>
  <h2 style="margin-top:34px">What I need from you</h2>
  <ol>
    <li><strong>Sign off the dashboard</strong> &mdash; the two lists, and the five
      columns on the sent one.</li>
    <li><strong>Sign off the flow</strong> &mdash; two subtabs, and the return to
      the record with the green line after a send.</li>
    <li>Say <em>build it</em> and I will, with a check that walks the whole
      round trip and proves the message you just sent is on the list when you
      land.</li>
  </ol>
  <div class="sig">
    Drawn in the real platform &middot; light and dark &middot; the page&rsquo;s own section() and tables<br>
    nothing in src/ touched &middot; nothing merged to main
  </div>
</footer>

</div>
"""

page = HTML % {
    "css": CSS,
    "today": fig("today.png",
                 "<b>Today</b>Send a message opens on the composer. The record of what "
                 "has been sent is behind the <em>Sent</em> dropdown at the top right.",
                 dark="today-dark.png"),
    "dashboard": fig("dashboard.png",
                     "<b>Proposed &mdash; the first tab</b>Drafts above, what was sent "
                     "below, and nothing explaining either of them.",
                     dark="dashboard-dark.png"),
    "compose": fig("compose.png",
                   "<b>Proposed &mdash; the second tab</b>Every control exactly as it "
                   "is today. Only the grey descriptions have gone.",
                   dark="compose-dark.png"),
    "aftersend": fig("after-send.png",
                     "<b>Proposed &mdash; after Send</b>Back on the list, with the "
                     "outcome stated and the message that just went at the top of it.",
                     dark="after-send-dark.png"),
}
OUT.write_text(page)
print("wrote %s (%.1f MB)" % (OUT, OUT.stat().st_size / 1e6))
