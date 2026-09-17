"""THE MOCKUP IS MADE OF THE REAL REGISTER (rule 1c, §41.9).

Islam: "for the client registry I'd like to do some in line adjustments like the
phone, employee ID, email, the unit/function, job title, etc. and about the
roles why do I need to add them as chips why can't we make it a multi tick
searchable drop down to add the roles?"

Not drawn from the stylesheet — DRIVEN. It opens the BUILT platform, walks to
Setup › People register the way somebody walks there, and shoots that one table
five ways off ONE build: as it is today, the two inline shapes, and the roles
cell shut and open. Both sides are the same pixels, so what is signed off is
what the product will look like.

EVERY PROPOSED CONTROL IS THE PLATFORM'S OWN, called in the page (§53.5):
`rowActions()` draws the pen and the Save/Cancel pair on six other Setup tables
already, `.fld` is the field class the dialog's own boxes wear, and the ticking
list is a real `<select multiple>` handed to `SEARCHSEL.wire()` — the same
control a tactic's collaborators use. Nothing here is a drawing OF a control;
they are the controls.

IT MAKES THE AWKWARD CASES ON PURPOSE (§245, §273.3). The roles shot is drawn
on **Mostafa Deif**, who on the shipped register holds all three kinds at once:
a role granted at his own place (BU owner of Care), a role granted SOMEWHERE
ELSE (Function head of the Care function), and a role DERIVED from the plan
(Pillar owner, from being named on a pillar). And the list shows Strategy
custodian as held by Rania Fahmy — the displacing case, real and unforced.

It also MEASURES (§158: fit, never "and it scrolls"), because the register
ALREADY scrolls sideways and an inline field must not make that worse.

Writes PNGs and a measurements file into design-mockups/client-registry/.
It asserts nothing: it is a camera with a tape measure.

    python3 checks/registry-inline-mockup.py
"""
import json
import pathlib
import http.server
import socketserver
import threading

from playwright.sync_api import sync_playwright

ROOT = pathlib.Path(__file__).resolve().parents[3]
HTML = (ROOT / "SMP-Project-Folder/src/strategy-management-platform.html").read_bytes()
SEED = json.loads((ROOT / "db/seed-state.json").read_text())
OUT = ROOT / "design-mockups/client-registry/shots"
OUT.mkdir(parents=True, exist_ok=True)
CHROME = "/opt/pw-browsers/chromium"

PERSON = {"key": "smo", "name": "Mohamed Essam", "role": "super"}
WHO = "cahead"          # Mostafa Deif — three kinds of role at once
WHO_NAME = "Mostafa Deif"


# ── the deployment, modelled ───────────────────────────────────────────────
# Over file:// the Password column does not exist and the demo carries no
# addresses at all, so a register measured there is a register with two of its
# columns empty (§94.11, §116.5).
class H(http.server.BaseHTTPRequestHandler):
    def log_message(self, *a): pass

    def _s(self, c, b, t):
        self.send_response(c)
        self.send_header("Content-Type", t)
        self.send_header("Content-Length", str(len(b)))
        self.end_headers()
        self.wfile.write(b)

    def do_GET(self):
        if self.path.startswith("/api/state"):
            self._s(200, json.dumps({"ok": True, "state": SEED, "person": PERSON}).encode(),
                    "application/json")
            return
        if self.path.startswith("/raya-trade"):
            self._s(200, HTML, "text/html; charset=utf-8")
            return
        self._s(200, b"<!doctype html><title>Sign in</title>", "text/html; charset=utf-8")

    def do_POST(self):
        n = int(self.headers.get("Content-Length") or 0)
        body = {}
        try:
            body = json.loads(self.rfile.read(n) or b"{}")
        except Exception:
            pass
        if body.get("action") == "passwords":
            st = {p["key"]: ["set", "temporary", "none"][i % 3]
                  for i, p in enumerate(SEED.get("people", []))}
            self._s(200, json.dumps({"ok": True, "states": st}).encode(), "application/json")
            return
        if body.get("action") == "declarations":
            self._s(200, json.dumps({"ok": True, "declarations": {}}).encode(),
                    "application/json")
            return
        self._s(200, b'{"ok":true}', "application/json")


srv = socketserver.ThreadingTCPServer(("127.0.0.1", 0), H)
srv.daemon_threads = True
PORT = srv.server_address[1]
threading.Thread(target=srv.serve_forever, daemon=True).start()
URL = "http://127.0.0.1:%d/raya-trade" % PORT

# Real-shaped values, or three of the columns this round is about are empty and
# an empty column never overflows (§116.5).
REAL = """()=>{PEOPLE.filter(p=>!p.forefront).forEach((p,i)=>{
  p.email = p.name.toLowerCase().replace(/[^a-z ]/g,'').trim()
            .split(/ +/).slice(0,2).join('.') + '@rayatrade.com';
  p.phone = '+20 100 1234567';
  p.empId = 'RT-1' + String(1000 + i);}); paint();}"""


def newpage(b, w=1440, h=950):
    """§148's WELCOME SCREEN BLINDS ANY SHOT TAKEN WITHOUT IT (§167.2). It
       covers the viewport, so the first run of this file photographed the
       welcome card five times and called it the register. Suppressed as a
       RETURNING viewer does — and in an `add_init_script`, because setting the
       flag after `goto` is one paint too late."""
    pg = b.new_page(viewport={"width": w, "height": h})
    pg.add_init_script("try{sessionStorage.setItem('smp.tour.later','1');"
                       "sessionStorage.setItem('smp.welcome.done','1');}catch(e){}")
    pg.on("pageerror", lambda e: print("  PAGEERROR:", e))
    return pg


def land(pg, cols=None):
    # A STORAGE CALL ON `about:blank` THROWS SecurityError. Every check in this
    # folder reaches `land()` from a page that has already been to the origin;
    # this one is called on a fresh page, so it goes there itself first.
    if not pg.url.startswith("http"):
        pg.goto(URL)
        pg.wait_for_timeout(400)
    pg.evaluate("try{sessionStorage.setItem('smp.tour.later','1')}catch(e){}")
    if cols is None:
        pg.evaluate("()=>localStorage.removeItem('smp.people.columns')")
    else:
        pg.evaluate("(c)=>localStorage.setItem('smp.people.columns',JSON.stringify(c))", cols)
    pg.goto(URL)
    pg.wait_for_timeout(1900)
    pg.evaluate("()=>document.querySelector('[data-md=\"setup\"]').click()")
    pg.wait_for_timeout(400)
    pg.evaluate("()=>document.querySelector('[data-setupgo=\"people\"]').click()")
    pg.wait_for_timeout(1400)
    pg.evaluate(REAL)
    pg.wait_for_timeout(700)


# ── THE SHOT IS THE VIEWPORT, CROPPED (§144.8) ─────────────────────────────
# An element screenshot DISPLACES the sticky rows inside it, so a pane shot
# that way loses the pinned head it is partly about.
def shot(pg, name, sel, pad=10, rows=None, around=None, scrollx=None):
    """`around` crops a band of rows centred on one person, because the row this
       round is about is the 14th and a shot of the first seven is a shot of
       somebody else. `scrollx` scrolls the table's own box, since the register
       is 1355px in a 1165px box and the Roles column — half of what is being
       asked about — is off the right edge at rest."""
    if scrollx is not None:
        pg.evaluate("""(x)=>{const b=document.querySelector('.peoplecfg')
          .closest('.tblscroll'); if(b) b.scrollLeft = x < 0 ? b.scrollWidth : x;}""", scrollx)
        pg.wait_for_timeout(250)
    box = pg.evaluate("""(a)=>{
      const e = document.querySelector(a.sel);
      if (!e) return null;
      /* X AND WIDTH FROM THE SCROLL BOX, NOT THE TABLE. Scrolled right, the
         table's own left edge is OUTSIDE its box — negative — so cropping to
         it reached back across the Setup rail and shot the whole page. */
      const sb = e.closest('.tblscroll') || e.parentElement;
      const r = { left: sb.getBoundingClientRect().left,
                  width: sb.getBoundingClientRect().width,
                  top: e.getBoundingClientRect().top,
                  height: e.getBoundingClientRect().height };
      let y = r.top, h = r.height;
      const rs = [...e.querySelectorAll('tbody tr')];
      if (a.around && rs.length) {
        const i = rs.findIndex(x => { const k = x.querySelector('[data-pmenu],[data-rowsave]');
          return k && (k.dataset.pmenu === a.around ||
                       (k.dataset.rowsave||'').indexOf(a.around) > -1); });
        if (i > -1) {
          const n = a.rows || 5;
          const from = Math.max(0, i - Math.floor((n - 1) / 2));
          const to = Math.min(rs.length - 1, from + n - 1);
          const a0 = rs[from].getBoundingClientRect();
          const b0 = rs[to].getBoundingClientRect();
          return { x:r.left, y:a0.top, width:r.width, height:(b0.bottom - a0.top) };
        }
      }
      if (a.rows && rs.length) {
        const last = rs[Math.min(a.rows, rs.length) - 1].getBoundingClientRect();
        h = last.bottom - r.top;
      }
      return { x:r.left, y:y, width:r.width, height:h };
    }""", {"sel": sel, "rows": rows, "around": around})
    if not box:
        print("  (no element for " + name + ")")
        return None
    vw, vh = pg.viewport_size["width"], pg.viewport_size["height"]
    clip = {
        "x": max(0, box["x"] - pad),
        "y": max(0, box["y"] - pad),
        "width": min(vw - max(0, box["x"] - pad), box["width"] + pad * 2),
        "height": min(vh - max(0, box["y"] - pad), box["height"] + pad * 2),
    }
    pg.screenshot(path=str(OUT / (name + ".png")), clip=clip)
    print("  shot " + name + "  " + str(round(clip["width"])) + "x" + str(round(clip["height"])))
    return clip


# ── SHAPE A: the pen at the end of the row (the six other tables' shape) ────
# `rowActions('people', key, true)` is the platform's OWN open-state cell —
# Save and Cancel, the classes and the wording those six tables already use.
# The fields are `.fld`, which is what the dialog's boxes are.
SHAPE_A = """(a)=>{
  const key = a.key, freeze = a.freeze !== false;
  const t = document.querySelector('.peoplecfg');
  const head = [...t.querySelectorAll('thead th')].map(x=>x.textContent.trim());
  const rows = [...t.querySelectorAll('tbody tr')];
  const row = rows.find(r => (r.querySelector('[data-pmenu]')||{}).dataset
                             && r.querySelector('[data-pmenu]').dataset.pmenu === key);
  if (!row) return null;
  const p = personBy(key);
  const cell = (label) => { const i = head.indexOf(label);
                            return i < 0 ? null : row.children[i]; };
  const put = (label, html) => { const c = cell(label); if (c) c.innerHTML = html; };

  /* THE SAME `data-` ATTRIBUTES THE DIALOG USES, deliberately: what `wire()`
     binds and `fieldSaved()` writes through does not change because the field
     moved (§116). */
  /* `put` no-ops on a column that is not shown, which is how one transform
     serves both the default column set and the one with Emp. ID and Mobile
     turned on — and is itself the finding: inline reaches what is on screen. */
  put('Job title', '<input class="fld" value="'+esc(p.title||'')+'" data-ptitle="'+p.key+'">');
  put('Emp. ID',   '<input class="fld" value="'+esc(p.empId||'')+'" data-pempid="'+p.key+'">');
  put('Email',     '<input class="fld" value="'+esc(p.email||'')+'" data-pemail="'+p.key+'">');
  put('Mobile',    '<input class="fld" value="'+esc(p.phone||'')+'" data-pphone="'+p.key+'">');
  put('Official BU','<select class="fld" data-pmainbu="'+esc(p.key)+'">'+
      '<option value="">&mdash; none &mdash;</option>'+
      mainbuNamesFor(p).map(nm=>'<option'+(mainbuKey(nm)===mainbuKey(p.mainbu)?' selected':'')+
        '>'+esc(nm)+'</option>').join('')+'</select>');
  put('Unit',      '<select class="fld" data-pat="'+esc(p.key)+'">'+
      '<option value="">&mdash; nowhere yet &mdash;</option>'+
      personAtChoices().map(o=>'<option value="'+esc(o.v)+'"'+
        (o.v===personAt(p)?' selected':'')+'>'+esc(o.label)+'</option>').join('')+'</select>');
  /* The row's own last cell becomes Save/Cancel — the platform's function,
     not a drawing of it.

     AND IT HAS TO KEEP `kebcell`, which is a finding rather than a detail.
     `rowActions()` returns `td.cc.tk-editcell`, which is right on the six
     tables it serves and wrong here: `.peoplecfg td.kebcell` is
     `position:sticky; right:0` (§69.20), and the register is the one Setup
     table wide enough to scroll — 1355px in a 1165px box. Without the class
     the open row's Save and Cancel are the only controls on the page that
     scroll off the right edge, which is exactly the shape §110.1 recorded the
     other way round. Measured: drawn without it, they sit at x≈1390 in a
     1165px box. */
  /* `wrap`, not `cell` — SHAPE_A already declares a `cell(label)` helper and
     a second `const cell` in the same scope is a SyntaxError. §56.7's own
     collision, in the file measuring it. */
  const wrap = document.createElement('div');
  wrap.innerHTML = '<table><tr>' + rowActions('people', key, true) + '</tr></table>';
  const td = wrap.querySelector('td');
  if (freeze) td.classList.add('kebcell');
  row.lastElementChild.replaceWith(td);
  row.classList.add('tk-open');
  return { rowH: Math.round(row.getBoundingClientRect().height),
           saveX: Math.round(td.getBoundingClientRect().left) };
}"""

# ── SHAPE A at rest: the pen beside the ⋮, drawn on every row ───────────────
SHAPE_A_REST = """()=>{
  const t = document.querySelector('.peoplecfg');
  [...t.querySelectorAll('tbody tr')].forEach(r=>{
    const keb = r.querySelector('[data-pmenu]');
    if (!keb) return;
    const pen = document.createElement('button');
    pen.className = 'ico tk-pen';
    pen.title = 'Edit this row';
    pen.setAttribute('aria-label','Edit this row');
    pen.innerHTML = ICO_EDIT;
    keb.parentElement.insertBefore(pen, keb);
  });
  const t2 = document.querySelector('.peoplecfg');
  const box = t2.closest('.tblscroll') || t2.parentElement;
  return { tableW: Math.round(t2.getBoundingClientRect().width),
           boxW: Math.round(box.getBoundingClientRect().width),
           rowH: Math.round(t2.querySelector('tbody tr').getBoundingClientRect().height) };
}"""

# ── SHAPE B: press the value itself; one cell becomes one field ─────────────
SHAPE_B = """(key)=>{
  const t = document.querySelector('.peoplecfg');
  const head = [...t.querySelectorAll('thead th')].map(x=>x.textContent.trim());
  const rows = [...t.querySelectorAll('tbody tr')];
  const row = rows.find(r => { const k = r.querySelector('[data-pmenu]');
                               return k && k.dataset.pmenu === key; });
  if (!row) return null;
  const p = personBy(key);
  const i = head.indexOf('Job title');
  row.children[i].innerHTML =
    '<input class="fld" value="'+esc(p.title||'')+'" data-ptitle="'+p.key+'">';
  /* AND THE ONE THAT CANNOT WORK THIS WAY, drawn rather than described: the
     Email and Mobile values are COPY BUTTONS (§93.6) — a press on them copies
     the address today, so a press cannot also mean "edit this". */
  const e = head.indexOf('Email');
  if (e > -1) row.children[e].classList.add('mk-clash');
  return { rowH: Math.round(row.getBoundingClientRect().height) };
}"""

# ── THE ROLES CELL: chips for what cannot be granted here, a ticking list for
#    what can. Every fact below is read from the platform's own functions. ───
ROLES = """(a)=>{
  const key = a.key, open = a.open;
  const t = document.querySelector('.peoplecfg');
  const head = [...t.querySelectorAll('thead th')].map(x=>x.textContent.trim());
  const rows = [...t.querySelectorAll('tbody tr')];
  const row = rows.find(r => { const k = r.querySelector('[data-pmenu]');
                               return k && k.dataset.pmenu === key; });
  if (!row) return null;
  const p = personBy(key);
  const at = personAt(p);
  const rs = personRoles(p);

  /* WHO HOLDS A ROLE AT THIS PERSON'S OWN PLACE — asked of the graph, never
     invented, so "held by Rania Fahmy" is the register's own truth. */
  function holder(role){
    if (role === 'owner')     return (UNIT_ROLES[at]||{}).head;
    if (role === 'custodian') return at.indexOf('fn:')===0
      ? (FUNCTIONS[at.slice(3)]||{}).custodian : (UNIT_ROLES[at]||{}).custodian;
    if (role === 'fnhead')    return at.indexOf('fn:')===0
      ? (FUNCTIONS[at.slice(3)]||{}).head : null;
    return null;
  }
  const mine = {};   /* roles held AT this person's own place */
  const away = [];   /* granted, but somewhere the register cannot reach */
  const derived = [];
  rs.forEach(r=>{
    if (SMPRules.isOwnLinesRole(r.role)) { derived.push(r); return; }
    if (r.at === at || roleWheres(r.role).length === 1) mine[r.role] = 1;
    else away.push(r);
  });

  /* The ticking list. NO `data-ssall`: "give this person every role" is not an
     act anybody wants, and Select all on a list that displaces people is the
     one press this whole question is about (§295.1 — the two label rules are
     per control). */
  const sel = document.createElement('select');
  sel.multiple = true;
  sel.className = 'fld rolepick';
  sel.setAttribute('aria-label','Roles for ' + p.name);
  ROLES.forEach(function(r){
    if (!roleIsGrantable(r.key)) return;
    const wheres = roleWheres(r.key);
    const fits = wheres.length === 1 || wheres.some(w=>w.v===at);
    const op = document.createElement('option');
    op.value = r.key; op.text = r.name;
    if (mine[r.key]) op.selected = true;
    let hint = '';
    if (!fits) hint = 'held at ' + roleAtWord(r.key) + ' — set the Unit first';
    else if (SMPRules.isSeatRole(r.key)) hint = 'a seat — asks before it lands';
    else { const h = holder(r.key);
           if (h && h !== p.key) hint = 'held by ' + (personBy(h)||{}).name; }
    if (hint) op.dataset.hint = hint;
    if (!fits) op.dataset.fits = '0';
    sel.appendChild(op);
  });

  const cell = row.children[head.indexOf('Roles')];
  const box = document.createElement('span');
  box.className = 'rolebox';
  away.forEach(r=>{
    box.insertAdjacentHTML('beforeend',
      '<span class="rolechip mk-ro" title="Set on the unit or function\\u2019s own page."><b>'+
      esc(roleName(r.role))+'</b><span class="rolewhere">'+esc(placeLabel(r.at))+'</span></span>');
  });
  derived.forEach(r=>{
    box.insertAdjacentHTML('beforeend',
      '<span class="rolechip mk-ro" title="Comes from being named on the plan."><b>'+
      esc(roleName(r.role))+'</b><span class="rolewhere">from the plan</span></span>');
  });
  cell.innerHTML = '';
  cell.appendChild(box);
  box.appendChild(sel);
  SEARCHSEL.wire();
  const btn = cell.querySelector('.ssbtn');
  if (open && btn) btn.click();
  return { at: at, mine: Object.keys(mine), away: away.map(r=>r.role+'@'+r.at),
           derived: derived.map(r=>r.role),
           offered: [...sel.options].map(o=>o.text + (o.dataset.hint?' — '+o.dataset.hint:'')),
           rowH: Math.round(row.getBoundingClientRect().height) };
}"""

# Two marks the mockup adds and the product would not: the read-only chip and
# the clash. Named `mk-` so nothing here can be mistaken for a shipped class.
MARKS = """()=>{
  const s = document.createElement('style');
  s.textContent = `
    .rolechip.mk-ro{opacity:.72}
    .rolechip.mk-ro b{font-weight:500}
    td.mk-clash{outline:2px solid var(--bad); outline-offset:-2px}
  `;
  document.head.appendChild(s);
}"""

# ── A GUESS THAT MEASURED THE SAME BOTH WAYS (§94.2) ───────────────────────
# §110.8 stops an open row widening the table with
#   .cfg table tr.tk-open td input.fld, … textarea.fld { width:100%; min-width:0 }
# which names `input` and `textarea` and NOT `select`. The first build of this
# file added the missing line, watched the table go 1355 → 1498 anyway, and
# measured it BOTH ways rather than shipping the line on the strength of the
# reasoning: 1498 with it and 1498 without. It changes nothing, because
# `tr.tk-open td { max-width:158px }` one block below already caps the cell, so
# the line is NOT proposed (§24 — a rule that does nothing is one the next
# reader takes for load-bearing). Where the width actually goes is measured per
# column instead, in section 5.
COLW = """()=>{
  const t = document.querySelector('.peoplecfg');
  const head = [...t.querySelectorAll('thead th')].map(x=>x.textContent.trim());
  const row = t.querySelector('tbody tr.tk-open') || t.querySelector('tbody tr');
  const out = {};
  head.forEach((h,i)=>{ out[h||'(actions)'] =
    Math.round(row.children[i].getBoundingClientRect().width); });
  const box = t.closest('.tblscroll') || t.parentElement;
  out.__table = Math.round(t.getBoundingClientRect().width);
  out.__box = Math.round(box.getBoundingClientRect().width);
  return out;
}"""

M = {}

print("the client registry, inline — " + URL)
with sync_playwright() as p:
    b = p.chromium.launch(executable_path=CHROME)

    # ── 1 · TODAY ──────────────────────────────────────────────────────
    pg = newpage(b)
    land(pg)
    M["today"] = pg.evaluate("""()=>{
      const t = document.querySelector('.peoplecfg');
      const box = t.closest('.tblscroll') || t.parentElement;
      return { tableW: Math.round(t.getBoundingClientRect().width),
               boxW: Math.round(box.getBoundingClientRect().width),
               rowH: [...t.querySelectorAll('tbody tr')].slice(0,8)
                       .map(r=>Math.round(r.getBoundingClientRect().height)),
               cols: [...t.querySelectorAll('thead th')].map(x=>x.textContent.trim()) };
    }""")
    print("  today: table %d in %d" % (M["today"]["tableW"], M["today"]["boxW"]))
    shot(pg, "today-rest", ".peoplecfg", around=WHO, rows=5)
    shot(pg, "today-roles", ".peoplecfg", around=WHO, rows=5, scrollx=-1)

    # the ⋮ open, so the three presses are visible rather than described
    pg.evaluate("(k)=>document.querySelector('[data-pmenu=\"'+k+'\"]').click()", WHO)
    pg.wait_for_timeout(350)
    shot(pg, "today-menu", ".peoplecfg", around=WHO, rows=9, scrollx=0)
    pg.evaluate("(k)=>document.querySelector('[data-pedit=\"'+k+'\"]').click()", WHO)
    pg.wait_for_timeout(700)
    shot(pg, "today-dialog", ".modal .pdlg", pad=22)
    pg.close()

    # ── 2 · SHAPE A — the pen at the end of the row ─────────────────────
    pg = newpage(b)
    land(pg)
    pg.evaluate(MARKS)

    M["a_rest"] = pg.evaluate(SHAPE_A_REST)
    pg.wait_for_timeout(200)
    shot(pg, "a-rest", ".peoplecfg", around=WHO, rows=5)
    M["a_open"] = pg.evaluate(SHAPE_A, {"key": WHO})
    pg.wait_for_timeout(250)
    shot(pg, "a-open", ".peoplecfg", around=WHO, rows=5)
    pg.emulate_media(color_scheme="dark")
    pg.wait_for_timeout(250)
    shot(pg, "a-open-dark", ".peoplecfg", around=WHO, rows=5)
    pg.close()

    # ── 2b · AND THE TWO COLUMNS HE NAMED THAT ARE OFF BY DEFAULT ──────
    # Emp. ID and Mobile are `off:true` in PEOPLE_COLS — turned on under
    # Columns. Inline can only ever reach a column that is SHOWN, which is a
    # real limit and the clearest argument for the pop-up staying (§61), so it
    # is drawn rather than described.
    pg = newpage(b, 1600, 950)
    land(pg, {"fullname": False, "empid": True, "key": False, "title": True,
              "mainbu": True, "bu": True, "company": False, "email": True,
              "phone": True, "roles": True, "status": True, "password": True})
    pg.evaluate(MARKS)
    pg.evaluate(SHAPE_A_REST)
    pg.evaluate(SHAPE_A, {"key": WHO})
    pg.wait_for_timeout(250)
    M["a_wide"] = pg.evaluate(COLW)
    print("  wide columns: table %d in %d" % (M["a_wide"]["__table"], M["a_wide"]["__box"]))
    shot(pg, "a-open-wide", ".peoplecfg", around=WHO, rows=5)
    pg.close()

    # ── 3 · SHAPE B — press the value itself ───────────────────────────
    pg = newpage(b)
    land(pg)
    pg.evaluate(MARKS)

    M["b_open"] = pg.evaluate(SHAPE_B, WHO)
    pg.wait_for_timeout(250)
    shot(pg, "b-open", ".peoplecfg", around=WHO, rows=5)
    pg.close()

    # ── 4 · THE ROLES CELL ─────────────────────────────────────────────
    pg = newpage(b)
    land(pg)
    pg.evaluate(MARKS)
    M["roles"] = pg.evaluate(ROLES, {"key": WHO, "open": False})
    pg.wait_for_timeout(300)
    shot(pg, "roles-closed", ".peoplecfg", around=WHO, rows=5, scrollx=-1)
    pg.close()

    pg = newpage(b)
    land(pg)
    pg.evaluate(MARKS)
    pg.evaluate("""()=>{const b=document.querySelector('.peoplecfg')
      .closest('.tblscroll'); if(b) b.scrollLeft = b.scrollWidth;}""")
    pg.wait_for_timeout(250)
    pg.evaluate(ROLES, {"key": WHO, "open": True})
    pg.wait_for_timeout(500)
    M["popup"] = pg.evaluate("""()=>{
      const pop = document.querySelector('.sspop');
      if (!pop) return null;
      const r = pop.getBoundingClientRect();
      return { w: Math.round(r.width), h: Math.round(r.height),
               rows: [...pop.querySelectorAll('.ssrow')].map(x=>x.innerText.replace(/\\n/g,' · ')) };
    }""")
    pg.screenshot(path=str(OUT / "roles-open.png"),
                  clip=pg.evaluate("""()=>{
                    const t = document.querySelector('.peoplecfg');
                    const sb = t.closest('.tblscroll') || t.parentElement;
                    const pop = document.querySelector('.sspop');
                    const a = sb.getBoundingClientRect(), b = pop.getBoundingClientRect();
                    const rows = [...t.querySelectorAll('tbody tr')];
                    const i = rows.findIndex(r => { const k = r.querySelector('[data-pmenu]');
                      return k && k.dataset.pmenu === 'cahead'; });
                    const from = rows[Math.max(0, i - 2)].getBoundingClientRect();
                    const x = Math.max(0, Math.min(a.left, b.left) - 12);
                    const y = Math.max(0, from.top - 12);
                    return { x, y,
                             width: Math.min(1440 - x, Math.max(a.right, b.right) - x + 12),
                             height: Math.min(950 - y, b.bottom - y + 12) };
                  }"""))
    print("  shot roles-open")
    pg.emulate_media(color_scheme="dark")
    pg.wait_for_timeout(250)
    pg.screenshot(path=str(OUT / "roles-open-dark.png"),
                  clip=pg.evaluate("""()=>{
                    const t = document.querySelector('.peoplecfg');
                    const sb = t.closest('.tblscroll') || t.parentElement;
                    const pop = document.querySelector('.sspop');
                    const a = sb.getBoundingClientRect(), b = pop.getBoundingClientRect();
                    const rows = [...t.querySelectorAll('tbody tr')];
                    const i = rows.findIndex(r => { const k = r.querySelector('[data-pmenu]');
                      return k && k.dataset.pmenu === 'cahead'; });
                    const from = rows[Math.max(0, i - 2)].getBoundingClientRect();
                    const x = Math.max(0, Math.min(a.left, b.left) - 12);
                    const y = Math.max(0, from.top - 12);
                    return { x, y,
                             width: Math.min(1440 - x, Math.max(a.right, b.right) - x + 12),
                             height: Math.min(950 - y, b.bottom - y + 12) };
                  }"""))
    pg.close()

    # ── 5 · WHERE THE WIDTH GOES, COLUMN BY COLUMN ─────────────────────
    # THE REGISTER ALREADY DOES NOT FIT — 1355 in 1165 — which §93.6 measured
    # and accepted when it widened the Name column. So the question §158 asks
    # here is not "does it fit" but "how much WORSE does each shape make the
    # overflow it already has", and that is a per-column answer.
    pg = newpage(b)
    land(pg)
    M["w_closed"] = pg.evaluate(COLW)
    pg.evaluate(SHAPE_A_REST)
    pg.wait_for_timeout(200)
    M["w_a_rest"] = pg.evaluate(COLW)
    pg.evaluate(SHAPE_A, {"key": WHO})
    pg.wait_for_timeout(250)
    M["w_a_open"] = pg.evaluate(COLW)
    pg.close()

    pg = newpage(b)
    land(pg)
    pg.evaluate(SHAPE_B, WHO)
    pg.wait_for_timeout(250)
    M["w_b_open"] = pg.evaluate(COLW)
    pg.close()

    for k in ("w_closed", "w_a_rest", "w_a_open", "w_b_open"):
        print("  %-10s table %d in %d" % (k[2:], M[k]["__table"], M[k]["__box"]))

    # ── 5b · AND THE FROZEN CLASS, MEASURED BOTH WAYS (§94.2) ──────────
    # `rowActions()` returns `td.cc.tk-editcell` with no `kebcell`. A number
    # from one side proves nothing; what matters is where Save lands with the
    # class and without it, in a box 1165px wide.
    frz = {}
    for label, freeze in (("frozen", True), ("as_rowActions_returns_it", False)):
        pg = newpage(b)
        land(pg)
        pg.evaluate(SHAPE_A_REST)
        r = pg.evaluate(SHAPE_A, {"key": WHO, "freeze": freeze})
        pg.wait_for_timeout(200)
        frz[label] = {"save_x": r["saveX"],
                      "box_right": pg.evaluate("""()=>Math.round(
                        document.querySelector('.peoplecfg').closest('.tblscroll')
                          .getBoundingClientRect().right)""")}
        print("  Save at x=%d, box ends at %d  (%s)"
              % (frz[label]["save_x"], frz[label]["box_right"], label))
        pg.close()
    M["freeze"] = frz

    # ── 6 · AND AT FOUR WIDTHS (§27.1) ─────────────────────────────────
    fit = {}
    for w in (1600, 1440, 1280, 1100):
        pg = newpage(b, w, 950)
        land(pg)
        closed = pg.evaluate(COLW)
        pg.evaluate(SHAPE_A_REST)
        pg.evaluate(SHAPE_A, {"key": WHO})
        pg.wait_for_timeout(200)
        a = pg.evaluate(COLW)
        tall = pg.evaluate("""()=>Math.max.apply(null,
          [...document.querySelectorAll('.peoplecfg tbody tr')]
            .map(r=>Math.round(r.getBoundingClientRect().height)))""")
        pg.close()
        pg = newpage(b, w, 950)
        land(pg)
        pg.evaluate(SHAPE_B, WHO)
        pg.wait_for_timeout(200)
        bb = pg.evaluate(COLW)
        pg.close()
        fit[w] = {"box": closed["__box"], "today": closed["__table"],
                  "a_open": a["__table"], "b_open": bb["__table"],
                  "tallest_row_a": tall}
        print("  %d: box %d · today %d · A %d · B %d · tallest row %d"
              % (w, closed["__box"], closed["__table"], a["__table"],
                 bb["__table"], tall))
    M["fit"] = fit
    b.close()

(OUT.parent / "measurements.json").write_text(json.dumps(M, indent=1))
print("\nwrote " + str(OUT.parent))
