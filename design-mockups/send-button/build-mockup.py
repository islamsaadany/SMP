"""Where the loud control goes on the Overview — three placements, drawn in the
real page (§41.9), so what is compared is placement rather than a sketch."""
import base64, pathlib, re

HERE = pathlib.Path(__file__).resolve().parent
SHOTS = HERE / "shots"
OUT = HERE / "2026-08-28_send-button.html"
CSS = re.search(r'CSS = """(.*?)"""',
                (HERE.parent / "email-greeting/build-mockup.py").read_text(), re.S).group(1)


def img(n):
    return '<img alt="" src="data:image/png;base64,%s">' % \
        base64.b64encode((SHOTS / n).read_bytes()).decode()


def fig(n, cap, dark=None):
    inner = ('<span class="stackimg">' + img(n) + img(dark) + "</span>") if dark else img(n)
    return "<figure>" + inner + "<figcaption>" + cap + "</figcaption></figure>"


HTML = """<title>Where The Send Button Goes</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Newsreader:opsz,wght@6..72,400;6..72,600&family=Public+Sans:wght@400;500;700&family=IBM+Plex+Mono:wght@400;600&display=swap">
<style>%(css)s
  .pick{border:1px solid var(--line);border-left:3px solid var(--gold);
    background:var(--surface);border-radius:0 8px 8px 0;padding:16px 20px;
    margin:18px 0 0;max-width:var(--measure);box-shadow:var(--shadow)}
  .pick b{color:var(--ink)}
  .pick p{margin:0;color:var(--ink-2);font-size:15px}
</style>

<div class="wrap">

<header class="mast">
  <div class="kicker">Send a message &middot; Overview</div>
  <h1>Where the send button goes</h1>
  <p>Three places it could sit, each drawn in the real page. Islam picked
     <strong>C</strong>, above the lists, labelled <strong>Send an email</strong>.
     Built; the other two are kept here as the record of what was weighed.</p>
  <div class="standing"><b>Built &mdash; C</b> <span>&ldquo;Send an email&rdquo;, above the lists</span></div>
</header>

<section class="item">
  <div class="itemhead"><div class="num">The ask</div><h2>What you said</h2></div>
  <div class="body">
    <div class="said">In the overview I&rsquo;d like to add a button, send an
      email, somewhere for the action to be obvious. Where should we place it?
      What are my options?
      <span>Islam &middot; 28 August 2026</span></div>
    <p>You are right that it is missing. <em>Write a message</em> is a tab, and a
      tab reads as <strong>where you are</strong>, not as <strong>something to
      do</strong>. The page&rsquo;s whole purpose has no loud control on it.</p>
    %(none)s
  </div>
</section>

<section class="item">
  <div class="itemhead"><div class="num">A</div><h2>Beside the page&rsquo;s name</h2></div>
  <div class="body">
    <p>In the header, opposite the title. This is the slot the People register
      already uses for its controls, and the header <strong>stays put when you
      scroll</strong> &mdash; so on a long record the button is still there.</p>
    %(head)s
    <div class="pick">
      <div class="kicker">My recommendation &mdash; not taken</div>
      <p><b>And the reason is what it does on the other tab: nothing.</b> Drawn
        only on Overview, so while you are writing there is no button offering to
        take you where you already are &mdash; a control with no audience of its
        own is a duplicate, not a choice.</p>
    </div>
  </div>
</section>

<section class="item">
  <div class="itemhead"><div class="num">B</div><h2>At the end of the tab row</h2></div>
  <div class="body">
    <p>Right of the two tabs. It sits with the navigation it duplicates, which
      makes the relationship plain, and it is always in view.</p>
    %(tabs)s
    <div class="cost">
      <div class="kicker">What it costs</div>
      <p>It reads as a <strong>third tab</strong> at a glance &mdash; same row,
        same height. And the tab row styles its own buttons, so making this one
        solid means a rule fighting a rule; in the picture above the fill had to
        be forced.</p>
    </div>
  </div>
</section>

<section class="item">
  <div class="itemhead"><div class="num">C</div><h2>Above the lists</h2></div>
  <div class="body">
    <p>Inside the Overview&rsquo;s own content, before <em>Not sent yet</em>.
      Unambiguously part of this tab and nothing else.</p>
    %(body)s
    <div class="cost">
      <div class="kicker">What it costs</div>
      <p>It <strong>scrolls away</strong>. On a record with thirty messages the
        one action on the page is off the top of the screen, which is the fault
        that made the send bar sticky in the first place.</p>
    </div>
  </div>
</section>

<section class="item">
  <div class="itemhead"><div class="num">Both themes</div><h2>A, checked in dark</h2></div>
  <div class="body">
    %(headdark)s
  </div>
</section>

<footer>
  <h2>What was decided</h2>
  <p style="max-width:var(--measure);color:var(--ink-2);margin:0 0 18px">
    <strong>C, and &ldquo;Send an email&rdquo;.</strong> Both costs were on the
    table before the choice and are recorded rather than re-argued: the button
    scrolls away on a long record, and the platform now has three nouns for one
    thing &mdash; the page is <em>Send a message</em>, the tab is <em>Write a
    message</em>, the button says <em>Send an email</em>.</p>
  <h2 style="margin-top:34px">Settled with it</h2>
  <ol>
    <li><strong>The word is <em>Send an email</em></strong>, Islam&rsquo;s
      choice.</li>
    <li><strong>The tab stays.</strong> The button is the loud way in; the tab is
      how you get <em>back</em> to a half-written message without losing it.</li>
    <li><strong>It is drawn only on the Overview.</strong> On the writing tab a
      button offering to take you where you already are would be a duplicate,
      not a choice.</li>
  </ol>
  <div class="sig">
    Drawn in the real platform &middot; light and dark &middot; C built on the branch
  </div>
</footer>

</div>
"""

page = HTML % {
    "css": CSS,
    "none": fig("none.png",
                "<b>Today</b>Two quiet tabs and two tables. Nothing on the page looks "
                "like the thing the page is for."),
    "head": fig("head.png",
                "<b>A &mdash; beside the name</b>Opposite the title, in the header that "
                "stays put as you scroll."),
    "tabs": fig("tabs.png",
                "<b>B &mdash; on the tab row</b>Right of the tabs, always in view."),
    "body": fig("body.png",
                "<b>C &mdash; above the lists</b>Inside the tab&rsquo;s own content, "
                "before the first table."),
    "headdark": fig("built.png",
                    "<b>As built &mdash; C, in both themes</b>The shipped Overview: "
                    "<em>Send an email</em> above the lists, drawn on this tab only.",
                    dark="built-dark.png"),
}
OUT.write_text(page)
print("wrote %s (%.1f MB)" % (OUT, OUT.stat().st_size / 1e6))
