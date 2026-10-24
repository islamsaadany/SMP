# Builds the interactive mockup: the snapshot of the real page (its own CSS on
# its own markup, no scripts) plus a floating panel of switches that apply each
# option live, a pressable strip, and a tenant colour picker that writes the
# same tokens brandTokens() writes.
import pathlib
HERE = pathlib.Path(__file__).parent
snap = (HERE / "snapshot.html").read_text()
# The platform's CSP admits only its own scripts by hash; the mockup's panel
# script is not one of them, so the policy goes.
import re
snap = re.sub(r'<meta http-equiv="Content-Security-Policy"[^>]*>', '', snap)

R = '.split:not(.setupsplit) > .rail:not(.setuprail)'
def m(css): return "@media (max-width:1200px){" + css + "}"
H = "html"
# Each option is keyed on an attribute of <html>, so the panel only ever sets
# attributes and every rule below is plain CSS the platform could carry.
FILLS = {  # fill, ink, matching outer line, bold?
  "brand":  ("var(--panel)", "var(--panel-ink)", "var(--panel)", False),
  "grey":   ("var(--ink-2)", "var(--surface)", "var(--ink-2)", False),
  "light":  ("color-mix(in srgb, var(--ink) 11%, var(--surface))", "var(--ink)", "var(--line)", True),
  "accent": ("var(--gold)", "var(--on-accent)", "var(--gold)", False),
  "type":   ("var(--surface)", "var(--panel)", "var(--line)", True),
}
css = []
for k, (bg, ink, line, bold) in FILLS.items():
    h = f'{H}[data-fill="{k}"]'
    css.append(m(f'''
  {h}[data-line="match"] {R} {{ border-color:{line}; }}
  {h}[data-line="hair"] {R} {{ border-color:var(--line); }}
  {h} {R} button.ritem.on, {h} {R} button.ritem.on:hover {{ background:{bg}; border-bottom-color:var(--gold); }}
  {h} {R} .ritem.on .rcode, {h} {R} .ritem.on b {{ color:{ink}; }}
  {h} {R} .ritem.on .grip i {{ background:{ink}; }}
  {h} {R} .sortable > button.ritem.on, {h} {R} .sortable > button.ritem.on:hover {{ background:{bg}; border-color:{line}; }}
  {'%s %s .ritem.on b { font-weight:700; }' % (h, R) if bold else ''}
  {'%s %s .ritem.on .rnum:not(:has(.rtally)), %s %s .ritem.on .rgap { background:var(--surface-2); }' % (h, R, h, R) if k == "type" else ''}
  {'%s[data-shape="cards"] %s .sortable > button.ritem.on { box-shadow:none; }' % (h, R) if k == "accent" else ''}
'''))
    # The Plan switch in Foundation | SWOT | Drivers | Plan borrows the same token.
    sw_bg = "var(--surface-2)" if k == "type" else bg
    css.append(f'{h}[data-switch="fix"] .tabs .secseg button[aria-selected="true"] {{ background:{sw_bg}; color:{ink}; }}')
# Shapes.
css.append(m(f'''
  {H}[data-shape="seg"] {R} .sortable {{ gap:0; }}
  {H}[data-shape="seg"] {R} .sortable > button.ritem:not(:first-child) {{ border-left:1px solid var(--line); }}
  {H}[data-shape="seg"] {R} .sortable > button.ritem.on, {H}[data-shape="seg"] {R} .sortable > button.ritem.on + button.ritem {{ border-left-color:transparent; }}
  {H}[data-shape="inset"] {R} .sortable {{ gap:0; }}
  {H}[data-shape="inset"] {R} .sortable > button.ritem:not(:first-child)::before {{ content:""; position:absolute; left:0; top:9px; bottom:9px; width:1px; background:var(--line); }}
  {H}[data-shape="inset"] {R} .sortable > button.ritem.on::before, {H}[data-shape="inset"] {R} .sortable > button.ritem.on + button.ritem::before {{ display:none; }}
  {H}[data-shape="cards"] {R} {{ border-color:transparent !important; background:var(--ground); }}
  {H}[data-shape="cards"] {R} .sortable {{ gap:8px; }}
  {H}[data-shape="cards"] {R} .sortable > button.ritem {{ border:1px solid var(--line); border-radius:var(--r); background:var(--surface); }}
  {H}[data-shape="cards"] {R} .sortable > button.ritem:not(.on):hover {{ background:var(--surface-2); }}
  {H}[data-shape="cards"] {R} .sortable > button.ritem.on {{ box-shadow:inset 0 -3px 0 var(--gold); border-bottom-color:inherit; }}
  {H}[data-shape="cards"][data-fill="today"] {R} .sortable > button.ritem.on {{ background:var(--stone); border-color:var(--stone); }}
  {H}[data-shape="cards"] {R} .ritem {{ cursor:pointer; }}
'''))
# The strip is pressable in the mockup; nothing else is.
css.append(f'{R} .ritem {{ cursor:pointer; }}')

PANEL_CSS = '''
#mk { position:fixed; right:14px; bottom:14px; z-index:99999; width:272px; max-height:calc(100vh - 300px); overflow:auto;
  font:13px/1.4 system-ui, -apple-system, "Segoe UI", sans-serif; color:#1a1d23; background:#fff; border:1px solid #cfd5de;
  border-radius:12px; box-shadow:0 10px 30px rgba(0,0,0,.18); }
#mk * { box-sizing:border-box; }
#mk header { display:flex; align-items:center; justify-content:space-between; padding:10px 12px; border-bottom:1px solid #e6e9ef;
  position:sticky; top:0; background:#fff; border-radius:12px 12px 0 0; }
#mk header b { font-size:13px; }
#mk header button { border:0; background:#f1f3f6; border-radius:6px; padding:3px 8px; cursor:pointer; font:inherit; }
#mk.min { width:auto; } #mk.min section, #mk.min footer { display:none; }
#mk section { padding:9px 12px; border-bottom:1px solid #eef0f4; }
#mk h4 { margin:0 0 6px; font-size:10.5px; letter-spacing:.08em; text-transform:uppercase; color:#6b7280; }
#mk label.o { display:flex; align-items:center; gap:7px; padding:3px 0; cursor:pointer; }
#mk label.o input { margin:0; }
#mk label.o small { color:#6b7280; margin-left:auto; }
#mk .row { display:flex; gap:6px; flex-wrap:wrap; }
#mk .pre { border:1px solid #cfd5de; background:#fff; border-radius:999px; padding:3px 9px 3px 5px; cursor:pointer; font:inherit; font-size:12px;
  display:inline-flex; align-items:center; gap:6px; }
#mk .pre i { width:12px; height:12px; border-radius:50%; display:inline-block; border:1px solid rgba(0,0,0,.15); }
#mk .pre.on { border-color:#1a1d23; box-shadow:inset 0 0 0 1px #1a1d23; }
#mk .pick { display:flex; align-items:center; gap:8px; padding:3px 0; }
#mk .pick input[type=color] { width:28px; height:22px; padding:0; border:1px solid #cfd5de; border-radius:5px; background:none; }
#mk .pick span { flex:1; } #mk .pick code { color:#6b7280; font-size:11px; }
#mk footer { padding:8px 12px; font-size:11.5px; color:#6b7280; }
#mk footer b { color:#b45309; }
'''

PANEL = '''
<aside id="mk">
  <header><b>Strip options</b><button type="button" id="mk-min">hide</button></header>
  <section><h4>Tenant</h4>
    <div class="row" id="mk-pre">
      <button class="pre" data-bar="" data-acc=""><i style="background:#16325C"></i>House navy</button>
      <button class="pre on" data-bar="#1F5C3F" data-acc="#D08A1E"><i style="background:#1F5C3F"></i>Green</button>
      <button class="pre" data-bar="#6B1F2A" data-acc="#C9A24D"><i style="background:#6B1F2A"></i>Burgundy</button>
      <button class="pre" data-bar="#0F5F6B" data-acc="#E08A2E"><i style="background:#0F5F6B"></i>Teal</button>
      <button class="pre" data-bar="#7A1FA2" data-acc="#F2B705"><i style="background:#7A1FA2"></i>Purple</button>
    </div>
    <div class="pick"><input type="color" id="mk-bar" value="#1F5C3F"><span>Bar</span><code id="mk-bar-v">#1F5C3F</code></div>
    <div class="pick"><input type="color" id="mk-acc" value="#D08A1E"><span>Accent</span><code id="mk-acc-v">#D08A1E</code></div>
  </section>
  <section><h4>Open direction</h4>
    <label class="o"><input type="radio" name="fill" value="today">Today <small>palette navy</small></label>
    <label class="o"><input type="radio" name="fill" value="brand">Tenant's bar colour</label>
    <label class="o"><input type="radio" name="fill" value="grey" checked>Dark grey <small>E</small></label>
    <label class="o"><input type="radio" name="fill" value="light">Light grey <small>F</small></label>
    <label class="o"><input type="radio" name="fill" value="type">No fill, type only <small>C</small></label>
    <label class="o"><input type="radio" name="fill" value="accent">Accent <small>D</small></label>
  </section>
  <section><h4>Separation</h4>
    <label class="o"><input type="radio" name="shape" value="today">Today <small>none</small></label>
    <label class="o"><input type="radio" name="shape" value="seg" checked>Hairline, full height <small>A</small></label>
    <label class="o"><input type="radio" name="shape" value="inset">Hairline, inset <small>A2</small></label>
    <label class="o"><input type="radio" name="shape" value="cards">Separate cards <small>B</small></label>
  </section>
  <section><h4>Outer line</h4>
    <label class="o"><input type="radio" name="line" value="match" checked>Same as the fill</label>
    <label class="o"><input type="radio" name="line" value="hair">Hairline</label>
  </section>
  <section><h4>Also</h4>
    <label class="o"><input type="checkbox" id="mk-switch" checked>Fix the Plan switch the same way</label>
    <label class="o"><input type="checkbox" id="mk-dark">Dark theme</label>
  </section>
  <footer id="mk-foot"></footer>
</aside>
'''

JS = r'''
(function(){
  var root = document.documentElement, mk = document.getElementById('mk');
  function hexRgb(h){ h = h.replace('#',''); return [0,2,4].map(function(i){ return parseInt(h.substr(i,2),16); }); }
  function rgbHex(c){ return '#' + c.map(function(v){ v = Math.max(0, Math.min(255, Math.round(v))); return (v < 16 ? '0' : '') + v.toString(16); }).join('').toUpperCase(); }
  function lum(c){ var a = c.map(function(v){ v /= 255; return v <= .03928 ? v/12.92 : Math.pow((v+.055)/1.055, 2.4); }); return .2126*a[0] + .7152*a[1] + .0722*a[2]; }
  function contrast(a, b){ var x = lum(a), y = lum(b); return (Math.max(x,y)+.05)/(Math.min(x,y)+.05); }
  function mix(a, b, t){ return a.map(function(v,i){ return v + (b[i]-v)*t; }); }
  function inkFor(c){ return contrast(c,[255,255,255]) >= contrast(c,[0,0,0]) ? [255,255,255] : [0,0,0]; }
  function readableOn(c, bg, need){ var out = c.slice(), n = 0; while (contrast(out, bg) < need && n++ < 40) out = mix(out, [0,0,0], .08); return out; }
  var TOK = ['--gold','--gold-deep','--on-accent','--accent-glow','--panel','--panel-ink','--panel-quiet','--panel-hover'];
  // The same eight tokens brandTokens() writes, from the same two inputs.
  function brand(bar, acc){
    TOK.forEach(function(k){ root.style.removeProperty(k); });
    if (acc) { var a = hexRgb(acc);
      root.style.setProperty('--gold', rgbHex(a));
      root.style.setProperty('--gold-deep', rgbHex(readableOn(a, [255,255,255], 4.5)));
      root.style.setProperty('--on-accent', rgbHex(inkFor(a)));
      root.style.setProperty('--accent-glow', 'rgba(' + a.join(',') + ',.22)'); }
    if (bar) { var p = hexRgb(bar), ink = inkFor(p);
      root.style.setProperty('--panel', rgbHex(p));
      root.style.setProperty('--panel-ink', rgbHex(ink));
      root.style.setProperty('--panel-quiet', rgbHex(mix(p, ink, .55)));
      root.style.setProperty('--panel-hover', rgbHex(mix(p, ink, .12))); }
  }
  var bar = document.getElementById('mk-bar'), acc = document.getElementById('mk-acc');
  function apply(){
    if (bar.disabled) TOK.forEach(function(k){ root.style.removeProperty(k); }); else brand(bar.value, acc.value);
    document.getElementById('mk-bar-v').textContent = bar.value.toUpperCase();
    document.getElementById('mk-acc-v').textContent = acc.value.toUpperCase();
    ['fill','shape','line'].forEach(function(n){ root.setAttribute('data-' + n, mk.querySelector('input[name=' + n + ']:checked').value); });
    root.setAttribute('data-switch', document.getElementById('mk-switch').checked ? 'fix' : 'today');
    root.setAttribute('data-theme', document.getElementById('mk-dark').checked ? 'dark' : 'light');
    foot();
  }
  mk.addEventListener('change', apply);
  mk.addEventListener('input', function(e){ if (e.target.type === 'color') apply(); });
  document.getElementById('mk-pre').addEventListener('click', function(e){
    var b = e.target.closest('.pre'); if (!b) return;
    mk.querySelectorAll('.pre').forEach(function(x){ x.classList.toggle('on', x === b); });
    if (b.dataset.bar) { bar.value = b.dataset.bar; acc.value = b.dataset.acc; bar.disabled = acc.disabled = false; apply(); }
    else { bar.disabled = acc.disabled = true; apply(); }
  });
  document.getElementById('mk-min').addEventListener('click', function(){ mk.classList.toggle('min'); this.textContent = mk.classList.contains('min') ? 'options' : 'hide'; });
  // The strip is pressable: the open item moves. The plan beneath stays MB01's.
  document.addEventListener('click', function(e){
    var it = e.target.closest('.rail .ritem'); if (!it) return;
    e.preventDefault(); it.parentElement.querySelectorAll('.ritem.on').forEach(function(x){ x.classList.remove('on'); }); it.classList.add('on');
  }, true);
  // Everything else on the page is a picture.
  document.addEventListener('click', function(e){ if (!e.target.closest('#mk') && !e.target.closest('.rail .ritem')) e.preventDefault(); }, true);
  function foot(){
    var w = window.innerWidth, f = document.getElementById('mk-foot');
    f.innerHTML = w > 1200 ? '<b>Window is ' + w + 'px wide.</b> The strip only appears under 1200px; above that the directions are the side list. Narrow the window to see the options.'
                           : 'Window ' + w + 'px. Press a direction in the strip to move the highlight; scroll to see it pinned. Real page, real CSS; only the strip responds.';
  }
  window.addEventListener('resize', foot);
  apply();
})();
'''

inject = ("<style id=\"mk-css\">" + "\n".join(css) + PANEL_CSS + "</style>" + PANEL + "<script>" + JS + "</script>")
out = snap.replace("</body>", inject + "\n</body>")
out = out.replace("<title>", "<title>Strip options, live — ", 1)
(HERE / "2026-10-24_strip-options-live.html").write_text(out)
print("built", len(out))
