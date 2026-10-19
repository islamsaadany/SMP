"""Stand two renders of the same deck side by side, on one page.

Both come from `render-real-deck.py`, so both are the product's own slides,
assembled and FITTED by the product at the size it authors them (1600x900).
The page itself adds nothing to a slide; it only says which build drew it.
"""
import io, os, sys

BEFORE, AFTER, OUT = sys.argv[1], sys.argv[2], sys.argv[3]

MARK = '<body><div class="fitbox">'

def parts(path):
    """Cut a render into its styles, its deck and its fit script.

    ON THE WHOLE MARKER, not on `<body>` alone: the platform's own CSS
    carries the word in a comment, so splitting there silently dropped the
    stylesheet that stands the slides up — and the slides came back 320px
    tall, laid out as flowing text with the tables spilling out of them.
    That is the same damage this page exists to show is NOT the product's,
    so it is worth the assertion below."""
    s = io.open(path, encoding="utf-8").read()
    a = s.index(MARK) + len(MARK)
    b = s.rindex("</div><script>")
    styles = s[s.index("<style>"): s.index(MARK)]
    assert ".deckroot .dslide{position:static" in styles, path + ": no standing CSS"
    return styles, s[a:b], s[s.index("<script>", b): ]

st, deckB, _ = parts(BEFORE)
_,  deckA, tail = parts(AFTER)

CHROME = """
<style>
  /* One column: a quiet bar that says which build, then the slides. The
     slides carry all the colour; the chrome stays out of their way. */
  :root{
    --cmp-ink:#1b2430; --cmp-dim:#5d6876; --cmp-ground:#e9e7e3;
    --cmp-card:#ffffff; --cmp-line:#d4d0c9; --cmp-gold:#b08430;
  }
  @media (prefers-color-scheme: dark){ :root:not([data-theme="light"]){
    --cmp-ink:#e8e6e2; --cmp-dim:#9aa3ae; --cmp-ground:#1a1c20;
    --cmp-card:#24272c; --cmp-line:#3a3e45; --cmp-gold:#d6a84a; color-scheme:dark; } }
  :root[data-theme="dark"]{
    --cmp-ink:#e8e6e2; --cmp-dim:#9aa3ae; --cmp-ground:#1a1c20;
    --cmp-card:#24272c; --cmp-line:#3a3e45; --cmp-gold:#d6a84a; color-scheme:dark; }

  body{background:var(--cmp-ground);color:var(--cmp-ink);margin:0;
    font:400 15px/1.5 ui-sans-serif,system-ui,-apple-system,"Segoe UI",sans-serif;}
  .cmpwrap{padding-left:max(16px,env(safe-area-inset-left,0px));
    padding-right:max(16px,env(safe-area-inset-right,0px));
    padding-block:22px 10px;max-width:1240px;margin:0 auto;}
  .cmpwrap h1{font:700 23px/1.25 inherit;margin:0 0 4px;text-wrap:balance;color:var(--cmp-ink);}
  .cmpwrap p.cmpsub{margin:0 0 18px;color:var(--cmp-dim);max-width:62ch;}
  .cmppick{display:flex;flex-wrap:wrap;gap:10px;}
  .cmppick button{font:600 14px/1 inherit;color:var(--cmp-ink);background:var(--cmp-card);
    border:1px solid var(--cmp-line);border-radius:999px;padding:11px 18px;cursor:pointer;}
  .cmppick button[aria-pressed="true"]{border-color:var(--cmp-gold);
    box-shadow:inset 0 0 0 1px var(--cmp-gold);}
  .cmppick button:focus-visible{outline:2px solid var(--cmp-gold);outline-offset:2px;}
  .cmppick b{font-weight:700;}
  .cmppick span{color:var(--cmp-dim);font-weight:400;}
  .cmpnote{max-width:1240px;margin:0 auto;padding:14px max(16px,env(safe-area-inset-left,0px)) 0;
    color:var(--cmp-dim);font-size:14px;}
  .cmpnote b{color:var(--cmp-ink);}
  .fitbox{max-width:1240px;margin:0 auto;}
  @media (prefers-reduced-motion:reduce){*{animation:none!important;transition:none!important}}
</style>
<div class="cmpwrap">
  <h1>Amr Hassan's deck for D001</h1>
  <p class="cmpsub">The real deck the platform builds for El Abd, rendered at the
    size its slides are authored and fitted at. Switch between the build that is
    live and the build with the change in it.</p>
  <div class="cmppick">
    <button type="button" data-show="b" aria-pressed="false"><b>Today</b></button>
    <button type="button" data-show="a" aria-pressed="true"><b>With the change</b></button>
  </div>
</div>
<p class="cmpnote" data-note="a"><b>Three changes.</b> The second page is gone &mdash;
  the cover already names the direction, its code, the cycle and who presents it. The
  readings leave the corner of the measures, categories and tactics slides. And they
  are said once, properly, on a new <b>Where Maximizing Current Stores stands</b>
  slide at the end, with a word under the figure saying what it counts.</p>
<p class="cmpnote" data-note="b" hidden><b>Today.</b> The cover and the page after it
  both introduce the same direction. Key Measures 95% and Execution &mdash; sit in the
  corner of four slides out of six, and no slide presents them.</p>
"""

SWAP = """
<script>
(function(){
  var btns = [].slice.call(document.querySelectorAll('.cmppick button'));
  function show(k){
    btns.forEach(function(b){ b.setAttribute('aria-pressed', String(b.dataset.show === k)); });
    [].forEach.call(document.querySelectorAll('[data-deck]'), function(d){ d.hidden = d.dataset.deck !== k; });
    [].forEach.call(document.querySelectorAll('[data-note]'), function(n){ n.hidden = n.dataset.cmpnote !== k; });
    if (window.cmpFit) window.cmpFit();
  }
  btns.forEach(function(b){ b.addEventListener('click', function(){ show(b.dataset.show); }); });
})();
</script>
"""

html = ("<title>Amr Hassan's deck for D001</title>"
        "<meta name=\"claude:viewport-fit-sides\" content=\"cover\">"
        + st + CHROME
        + '<div class="fitbox" data-deck="b" hidden>' + deckB + '</div>'
        + '<div class="fitbox" data-deck="a">' + deckA + '</div>'
        + tail.replace("addEventListener('resize', go); go();",
                       "addEventListener('resize', go); window.cmpFit = go; go();")
        + SWAP)
io.open(OUT, "w", encoding="utf-8").write(html)
print("wrote " + OUT + "  (%d KB)" % (os.path.getsize(OUT) // 1024))
