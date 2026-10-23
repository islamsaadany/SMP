# Builds the mockup page from the shots (crops them and embeds them).
import base64, io, pathlib
from PIL import Image
HERE = pathlib.Path(__file__).parent
S = HERE / "shots"
def img(name, y0, y1, alt):
    im = Image.open(S / (name + ".png")); im = im.crop((0, y0 * 2, im.width, min(im.height, y1 * 2)))
    buf = io.BytesIO(); im.save(buf, "PNG", optimize=True)
    return '<img alt="%s" src="data:image/png;base64,%s">' % (alt, base64.b64encode(buf.getvalue()).decode())
head = (HERE.parent / "pinned-directions" / "2026-10-23_directions-stay-in-view.html").read_text()
style = head[head.index("<style>"):head.index("</style>") + 8]
page = """<title>Strip as Its Own Card</title>
<meta name="claude:viewport-fit-sides" content="cover">
""" + style + """
<div class="wrap">
  <h1>The strip of directions as its own card</h1>
  <p class="sub">Real Plan and Performance pages (Mobile), 1100px wide, scrolled down, with each option drawn into the live page.</p>

  <h2>Today</h2>
  <p class="cap">Scrolled down, the plan slides right up against the strip, so the two read as one block.</p>
  <figure>{{today}}</figure>

  <h2>A&nbsp;&middot;&nbsp;A gap under the strip (recommended)</h2>
  <p class="cap">The strip keeps a strip of page background under it while you scroll, the same gap the side list keeps beside the plan on a wide window. The plan slides away into the gap. Nothing new is added, and at the top of the page nothing changes.</p>
  <figure>{{a}}</figure>
  <figure style="margin-top:14px">{{a_perf}}</figure>

  <h2>D&nbsp;&middot;&nbsp;An outer line, with the gap</h2>
  <p class="cap">As A, with the strip's border drawn in the navy of the open direction, so the strip is outlined as a separate thing.</p>
  <figure>{{dg}}</figure>
  <figure style="margin-top:14px">{{dg_perf}}</figure>

  <h2>E&nbsp;&middot;&nbsp;An outer line, without the gap</h2>
  <p class="cap">The navy outline only. The plan still slides right up to the strip, but the line marks where the strip ends.</p>
  <figure>{{d}}</figure>

  <h2>B&nbsp;&middot;&nbsp;A gap and a soft shadow</h2>
  <p class="cap">As A, with a light shadow under the strip so it looks lifted above the page.</p>
  <figure>{{b}}</figure>

  <h2>C&nbsp;&middot;&nbsp;A gap and the side list's header</h2>
  <p class="cap">As A, with the side list's own navy header (&ldquo;Pillars 4&rdquo;) as the strip's first cell, so it reads as the same card turned sideways. It costs width, and its navy runs into the open direction when the first one is open.</p>
  <figure>{{c}}</figure>
  <figure style="margin-top:14px">{{c760}}</figure>
</div>
"""
subs = {"today": img("today-plan-1100", 170, 350, "Today"), "a": img("a-gap-plan-1100", 170, 350, "Option A"),
        "a_perf": img("a-gap-performance-1100", 110, 330, "Option A on Performance"),
        "b": img("b-lift-plan-1100", 170, 350, "Option B"), "c": img("c-head-plan-1100", 170, 350, "Option C"),
        "dg": img("d-line-gap-plan-1100", 170, 350, "Outline with gap"), "dg_perf": img("d-line-gap-performance-1100", 110, 330, "Outline with gap on Performance"), "d": img("d-line-plan-1100", 170, 350, "Outline without gap"),
        "c760": img("c-head-plan-760", 170, 370, "Option C at 760px")}
for k, v in subs.items(): page = page.replace("{{%s}}" % k, v)
(HERE / "2026-10-23_strip-as-own-card.html").write_text(page)
