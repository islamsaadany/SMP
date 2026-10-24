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
page = """<title>The Strip in the Tenant's Colours</title>
<meta name="claude:viewport-fit-sides" content="cover">
""" + style + """
<div class="wrap">
  <h1>The strip of directions in the tenant's colours, with its directions told apart</h1>
  <p class="sub">The real Plan page (Mobile), with a tenant whose bar is <b>green</b> and whose accent is <b>amber</b> &mdash; set the way Setup &rsaquo; Branding sets them. Each option is drawn into the live page at 1100px and 760px, scrolled so the strip is pinned.</p>

  <h2>Today</h2>
  <p class="cap">The whole chrome takes the tenant's green, but the open direction and the strip's outline stay the house navy: they are painted with a palette token the Branding page never rewrites. The same navy also survives on the Plan switch in Foundation&nbsp;|&nbsp;SWOT&nbsp;|&nbsp;Drivers&nbsp;|&nbsp;Plan. And nothing says where one closed direction ends and the next begins.</p>
  <figure>{{today}}</figure>

  <h2>A&nbsp;&middot;&nbsp;One card, segmented (recommended)</h2>
  <p class="cap">The open direction and the outer line take the tenant's bar colour, with its own ink on top, under the accent edge. A hairline divides each closed direction from its neighbour, so the strip reads as one segmented control: four pressable cells in one frame, the way Foundation&nbsp;|&nbsp;SWOT&nbsp;|&nbsp;Plan already does. Nothing grows: the names keep every pixel they have today.</p>
  <figure>{{a}}</figure>
  <figure style="margin-top:14px">{{a760}}</figure>
  <figure style="margin-top:14px">{{aperf}}</figure>

  <h2>A2&nbsp;&middot;&nbsp;As A, the hairline inset</h2>
  <p class="cap">The same, with the divider stopping short of the top and bottom edges &mdash; a tab-bar reading rather than a table's. Quieter; a little less decisive about where the cell ends.</p>
  <figure>{{a2}}</figure>

  <h2>B&nbsp;&middot;&nbsp;Each direction its own card</h2>
  <p class="cap">The outer frame goes; every direction is a white card on the page's ground, and the open one is filled in the tenant's bar colour. The clearest separation of the shapes &mdash; and the most expensive: the gaps and borders cost each name about 30px, so at 1100 every name wraps to two lines and the strip grows from 46px to 80px. Pinned, that is 34px of plan you no longer see.</p>
  <figure>{{b}}</figure>
  <figure style="margin-top:14px">{{b760}}</figure>

  <h2>C&nbsp;&middot;&nbsp;No fill: the tenant's colour as type</h2>
  <p class="cap">Hairlines as in A, but the open direction is not filled: its code and name are set in the tenant's bar colour, bold, on white, under the accent edge. The lightest of the four, and the weakest highlight &mdash; it walks back what &sect;609 added when the open direction was not clear enough.</p>
  <figure>{{c}}</figure>

  <h2>D&nbsp;&middot;&nbsp;The accent as the fill</h2>
  <p class="cap">The cards of B, with the open one filled in the tenant's <em>accent</em> rather than its bar. Drawn because the tenant has two colours and the question is which one &ldquo;brand&rdquo; means here. Not recommended: the accent is what the platform uses for <em>attention</em> (the Reporting button, the gold edges, a cycle asking for something), so an accent-filled direction reads as a warning rather than a selection.</p>
  <figure>{{d}}</figure>

  <h2>E&nbsp;&middot;&nbsp;A neutral: dark grey (recommended if the tenant's colour is too much)</h2>
  <p class="cap">The segmented shape of A, but the open direction is filled in the palette's own dark grey &mdash; its second ink, the colour of body text &mdash; with white type, and the outer line in the same grey. The tenant shows only where it already does: the chrome above and the accent edge under the open item. This is what the slate palette does today; only the navy palette ever painted this fill navy. A neutral never fights a tenant's colour, whatever it is, and still reads as unmistakably selected.</p>
  <figure>{{e}}</figure>
  <figure style="margin-top:14px">{{e760}}</figure>

  <h2>E2&nbsp;&middot;&nbsp;As E, with the hairline outer line</h2>
  <p class="cap">The same grey fill, but the strip's outer line stays the quiet hairline every other card has, rather than taking the grey. Lighter at the edges; the open direction does all the work.</p>
  <figure>{{e2}}</figure>

  <h2>F&nbsp;&middot;&nbsp;A neutral: light grey</h2>
  <p class="cap">The open direction on a light grey wash with dark bold type, under the accent edge. The quietest filled reading, and the one closest to a plain tab bar. It is clear at a glance here with four directions; with ten, the bold type and the edge are what carry it.</p>
  <figure>{{f}}</figure>

  <h2>What the colour fix is, whichever shape is chosen</h2>
  <p class="cap">The open item's fill and the strip's outline move from the palette's neutral-strong token to the bar token the tenant already sets, and the open item's type to the bar's own ink. With no branding set, nothing changes: in the house palette the two tokens are the same navy. For the neutral options the fill moves to the palette's second ink instead. Either way, the same two-line change fixes the Plan switch in Foundation&nbsp;|&nbsp;SWOT&nbsp;|&nbsp;Drivers&nbsp;|&nbsp;Plan, which borrows the same token.</p>
</div>
"""
page = (page.replace("{{today}}", img("today-plan-1100", 172, 300, "Today, with a green tenant: strip still navy"))
            .replace("{{a}}", img("a-segmented-plan-1100", 172, 300, "A at 1100"))
            .replace("{{a760}}", img("a-segmented-plan-760", 196, 330, "A at 760"))
            .replace("{{aperf}}", img("a-segmented-performance-1100", 172, 320, "A on Performance at 1100"))
            .replace("{{a2}}", img("a2-inset-plan-1100", 172, 300, "A2 at 1100"))
            .replace("{{b}}", img("b-cards-plan-1100", 172, 320, "B at 1100"))
            .replace("{{b760}}", img("b-cards-plan-760", 196, 350, "B at 760"))
            .replace("{{c}}", img("c-underline-plan-1100", 172, 300, "C at 1100"))
            .replace("{{d}}", img("d-accent-plan-1100", 172, 320, "D at 1100"))
            .replace("{{e}}", img("e-darkgrey-plan-1100", 172, 300, "E at 1100"))
            .replace("{{e760}}", img("e-darkgrey-plan-760", 196, 330, "E at 760"))
            .replace("{{e2}}", img("e2-darkgrey-hairline-plan-1100", 172, 300, "E2 at 1100"))
            .replace("{{f}}", img("f-lightgrey-plan-1100", 172, 300, "F at 1100")))
(HERE / "2026-10-24_strip-in-tenant-colours.html").write_text(page)
print("built", len(page))
