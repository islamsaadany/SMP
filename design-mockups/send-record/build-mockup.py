"""The test-copy record, and the Super user's delete. Drawn in the REAL page
(§41.9) — the built platform served with a stub, the proposal injected into the
live list — so what is reviewed is the product and not a sketch."""
import base64, pathlib, re

HERE = pathlib.Path(__file__).resolve().parent
SHOTS = HERE / "shots"
OUT = HERE / "2026-08-28_send-record.html"
CSS = re.search(r'CSS = """(.*?)"""',
                (HERE.parent / "email-greeting/build-mockup.py").read_text(), re.S).group(1)


def img(n):
    return '<img alt="" src="data:image/png;base64,%s">' % \
        base64.b64encode((SHOTS / n).read_bytes()).decode()


def fig(n, cap, dark=None):
    inner = ('<span class="stackimg">' + img(n) + img(dark) + "</span>") if dark else img(n)
    return "<figure>" + inner + "<figcaption>" + cap + "</figcaption></figure>"


HTML = """<title>The Test Copy And The Delete</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Newsreader:opsz,wght@6..72,400;6..72,600&family=Public+Sans:wght@400;500;700&family=IBM+Plex+Mono:wght@400;600&display=swap">
<style>%(css)s
  .pick{border:1px solid var(--line);border-left:3px solid var(--gold);
    background:var(--surface);border-radius:0 8px 8px 0;padding:16px 20px;
    margin:18px 0 0;max-width:var(--measure);box-shadow:var(--shadow)}
  .pick b{color:var(--ink)} .pick p{margin:6px 0 0;color:var(--ink-2);font-size:15px}
  .cost{border-left-color:var(--bad)}
  .opts{display:grid;gap:20px;margin-top:8px}
  @media (min-width:900px){.opts{grid-template-columns:1fr 1fr}}
  .opt{border:1px solid var(--line);border-radius:10px;background:var(--surface);
    padding:16px 18px;box-shadow:var(--shadow)}
  .opt h3{margin:0 0 4px;font-size:16px;letter-spacing:0}
  .opt .tag{font-family:'IBM Plex Mono',monospace;font-size:11px;letter-spacing:.09em;
    text-transform:uppercase;color:var(--ink-3)}
  .opt p{font-size:14.5px;color:var(--ink-2);margin:8px 0 0}
  .rec{border-color:var(--gold)}
  .rec .tag{color:var(--gold-deep)}
</style>

<div class="wrap">

<header class="mast">
  <div class="kicker">Send an email &middot; Overview</div>
  <h1>The test copy, and the delete</h1>
  <p>You asked why earlier emails were missing from the record. They were not
     lost &mdash; they were never written down. This is what changes, drawn in
     the real page.</p>
  <div class="standing"><b>Waiting on you</b> <span>one decision, marked below</span></div>
</header>

<section class="item">
  <div class="itemhead"><div class="num">Why</div><h2>What I found</h2></div>
  <div class="body">
    <div class="said">There have been multiple sent emails earlier. Weren&rsquo;t
      they saved? I can&rsquo;t see them in the overview.</div>
    <p><strong>Nothing was lost, and nothing ever could be.</strong> The record
       sits outside the state graph with no foreign key to the register &mdash;
       deliberately, so the <code>TRUNCATE</code> that runs on every save cannot
       reach it &mdash; and nothing anywhere in the platform deletes from it. I
       proved the path end to end against a real database: a send writes its row
       <em>before</em> the emails go out, and it appears on the Overview at once.</p>
    <p><strong>There are two kinds of email leaving this platform, and only one
       was recorded.</strong> <em>Send</em> writes a row and a row per recipient.
       <em>Send me a copy</em> &mdash; and the test send on Email settings &mdash;
       sends a real email through the same builder and writes nothing at all.
       Both look like the same act, and nothing on screen said otherwise.</p>
  </div>
</section>

<section class="item">
  <div class="itemhead"><div class="num">Now</div><h2>The record today</h2></div>
  <div class="body">
    <p>Five emails went out. The record holds three of them.</p>
    %(before)s
  </div>
</section>

<section class="item">
  <div class="itemhead"><div class="num">1</div><h2>Test copies join the record</h2></div>
  <div class="body">
    <p>Every test copy is written down like any other send &mdash; same table,
       same chronology, so &ldquo;I tested it twice and then sent it&rdquo; reads
       straight down the page.</p>
    <p><strong>The mark goes in the column that already answers who received
       it</strong>, not beside the heading. Beside the heading it pushed the
       first column onto a second line, which is the one thing a setup table may
       never do (&sect;88) &mdash; the same fault as three marks that had to move
       in &sect;116.4. Here it costs no height at all: every row is still one line.</p>
    %(after_all)s
  </div>
</section>

<section class="item">
  <div class="itemhead"><div class="num">2</div><h2>Deleting, and one thing to decide</h2></div>
  <div class="body">
    <p>The Super user alone may delete, asked through <code>mayDestroy()</code>
       &mdash; the rule that already means exactly this, and already governs
       dropping a conversation. <strong>Enforced on the server</strong>, because a
       control that is merely hidden is decoration. A confirmation names what
       goes, and there is no undo.</p>

    <p><strong>What the delete should reach is yours to say.</strong></p>
    <div class="opts">
      <div class="opt rec">
        <div class="tag">Recommended &middot; B</div>
        <h3>Test copies only</h3>
        <p>The clutter goes and the record of what the business was actually
           sent stays whole &mdash; nobody can quietly remove the evidence that a
           message went to seventy-six people.</p>
      </div>
      <div class="opt">
        <div class="tag">A</div>
        <h3>Any record</h3>
        <p>Full control, and the cost is real: once a real send can be deleted,
           &ldquo;what did we send in March&rdquo; is answerable only as far as
           nobody has tidied it away.</p>
      </div>
    </div>

    <div class="pick"><b>A &mdash; delete reaches every row</b>
      <p>Delete on all five.</p></div>
    %(after_all_2)s

    <div class="pick"><b>B &mdash; delete reaches test copies only</b>
      <p>Delete on the two tests; the three real sends carry none.</p></div>
    %(after_tests)s
  </div>
</section>

<section class="item">
  <div class="itemhead"><div class="num">3</div><h2>The line by Send me a copy</h2></div>
  <div class="body">
    <p>You said yes to this too &mdash; and with test copies in the record it
       shrinks to almost nothing, which is worth saying rather than building
       twice. The surprise was that a test copy vanished; once it appears in the
       list, the record itself is the answer.</p>
    <p>So it is <strong>one clause on the hover the button already has</strong>,
       not a new sentence under it: <em>&ldquo;One copy, to you &mdash; kept in
       the record as a test copy.&rdquo;</em> No prose added to the page
       (CLAUDE.md 1b-ii), and nothing that repeats what the row beneath it now
       says.</p>
    <div class="pick cost"><b>Say if you want it louder</b>
      <p>If you would rather it were visible without hovering, say so and it
         becomes a line &mdash; but then it is a sentence explaining a control,
         which is the thing &sect;127 spent a whole panel removing.</p></div>
  </div>
</section>

<section class="item">
  <div class="itemhead"><div class="num">4</div><h2>What it costs</h2></div>
  <div class="body">
    <ul>
      <li><strong>A migration</strong> &mdash; one column on <code>messages</code>
          saying a row is a test. Nothing is backfilled: every existing row is a
          real send, which is true.</li>
      <li><strong>The heading stays &ldquo;What has been sent&rdquo;</strong>,
          because a test copy <em>was</em> sent &mdash; to you.</li>
      <li><strong>Opening a test row works like any other</strong>: one
          recipient, you, so the panel needs no special case.</li>
      <li><strong>The record becomes deletable.</strong> It was written to be
          un-erasable by design; this is a deliberate exception for one person,
          and it is the reason B is the narrower answer.</li>
    </ul>
  </div>
</section>

<footer class="foot">
  <p>Drawn in the real platform at 1500px, light and dark, with the proposal
     injected into the live list. Nothing here is built yet.</p>
</footer>

</div>
""" % {
  "css": CSS,
  "before": fig("before-light.png",
                "Today. Two of the five emails that went out are not here.",
                "before-dark.png"),
  "after_all": fig("after-all-light.png",
                   "With test copies recorded and marked. Every row is one line.",
                   "after-dark.png" if (SHOTS / "after-dark.png").exists() else "after-all-dark.png"),
  "after_all_2": fig("after-all-dark.png", "A &mdash; every row can be deleted."),
  "after_tests": fig("after-tests-light.png",
                     "B &mdash; only the test copies carry Delete.",
                     "after-tests-dark.png"),
}

OUT.write_text(HTML)
print("wrote", OUT, len(HTML), "bytes")
