/* ══ THE SHAPE OF A SETUP TABLE IS THE READER'S OWN (§754) ═══════════════════
   Islam, 2026-11-06, with a reel of a table whose columns the viewer shapes:
   "have a look so we can see what we can do with our settings tables"; then
   "Do all make them all personal"; then, of the mockup
   (mockups/mock-tablecols.html), "go ahead with as today look, build it into
   the setup tables".

   FOUR THINGS A READER MAY DO TO A SETUP TABLE, AND ONE WAY BACK:
     show or hide a column   — the Columns menu the register has had since §47.2,
                               now on every list table;
     set a column's width    — drag a heading's edge; the pixels show while it
                               moves; a double-click on the edge, or F on the
                               focused heading, fits the column to its content,
                               narrower or wider;
     move a column           — drag a heading; the column lifts as a ghost and a
                               line marks where it lands;
     set the row height      — Comfortable · Normal · Compact, under Rows in
                               the same menu;
     Reset                   — the table as it ships, lit only while something
                               differs.
   Every act also works from the keyboard on a focused heading (the hints under
   the table), because a drag is not a thing everybody can do.

   PERSONAL, PER BROWSER, NEVER THE TENANT'S (his decision): localStorage under
   `smp.table.<id>`, merged over the shipped defaults the way the register's
   chooser always was (§30.2) — a column added later appears, a saved choice
   wins, anything unreadable falls back to the shipped table. The register's
   and the functions page's own stores (`smp.people.columns`, `smp.fns.columns`)
   are read once as the starting point and then superseded, so nobody who had
   set their columns loses them.

   ONE MECHANISM FOR SEVEN TABLES (§53.5). The renderers draw their table as
   they always did, in the shipped order; this file reads the drawn table after
   each paint and bends it to the reader's shape — moves the cells, hides the
   hidden, sets the widths, classes the density — and draws the menu and the
   status line. A renderer that wants it declares its columns once (`define`)
   and places `tools(id)` in its header line and `foot(id)` under its table.
   Nothing about what a cell holds or how a row is edited changes.

   TWO WAYS A HIDDEN COLUMN IS NOT DRAWN, AND BOTH READ ONE STORE. The register
   and Functions OMIT a hidden column at render (`showCol`, `fnShowCol`): their
   add row, their frozen pair and their sort index were built around that and
   are left as they are. The other five draw every column and this file hides
   the cell. The menu, the store and the count are the same either way.

   WHAT NEVER MOVES OR HIDES: the row number and the ⋮ (the two ends — `fixed`),
   and the name column (`lock`), because `.tblscroll` freezes # and the name
   on every Setup table (§151, §631) and a frozen column has to be where the
   freeze expects it. A `keep` column (Status on Functions) stays shown but may
   move. The name column may still be made wider or narrower.

   THE SORT STILL READS THE SHIPPED ORDER. `tkSort` reorders rows by
   `cells[st.col]` inside wire(), which runs BEFORE this file moves anything,
   and every repaint rebuilds the table in shipped order first — so a column
   index baked into `data-tksort` at render stays true. This is why `apply()`
   is called after wire() and never before.

   WIDTHS ARE TAKEN AS A SET. The first time a width is set by hand, every
   visible column's width as drawn is written down with it, and from then on
   the table is laid out from those numbers (fixed layout, the sum as its
   width). Taken one at a time, a stored width beside columns still sized by
   content would jump with the data. Spare room, where the columns are
   narrower than the box, goes to the name column alone, so a column made
   narrower is seen to be narrower (the mockup's finding, 2026-11-16).
   ═══════════════════════════════════════════════════════════════════════════ */
var TABLECOLS = (function(){
  "use strict";

  var SPECS = {};          /* id → array of columns, or a function(variant) returning one */
  var OMIT = {};           /* id → true where the renderer omits a hidden column itself */
  var STATE = {};          /* id → the saved shape, loaded once */
  var MENU = null;         /* the table whose Columns menu is open */
  var DENSITIES = ["comfortable", "normal", "compact"];
  var DENSITY_WORD = { comfortable:"comfortable rows", normal:"normal rows", compact:"compact rows" };
  var MINW = 56, MAXW = 900, STEP = 8;
  var OLD_STORES = { people:"smp.people.columns", fns:"smp.fns.columns" };
  var LASTGRIP = null;     /* the last edge pressed, for the double-click (see startResize) */
  var SWALLOW = false;     /* the click that follows a drag must not sort the column */

  function storeKey(id){ return "smp.table." + id; }
  function html(s){
    return String(s == null ? "" : s).replace(/[&<>"]/g, function(c){
      return { "&":"&amp;", "<":"&lt;", ">":"&gt;", '"':"&quot;" }[c];
    });
  }
  function repaint(){ if (typeof paint === "function") paint(); }
  /* THE PAGE IS ZOOMED (_shared.css §601: `html { zoom:.8 }` under 1000px and
     wherever the console's rule applies), so a rectangle is in screen pixels
     and a width set in CSS is not. Widths are read and written in layout
     pixels (`offsetWidth`), and a pointer's movement is divided by the zoom
     before it becomes one. Measured, not assumed: the first run wrote every
     column back four fifths as wide. */
  function zoomOf(el){
    var r = el.getBoundingClientRect().width, w = el.offsetWidth;
    return (r && w) ? r / w : 1;
  }

  /* ── The declaration ───────────────────────────────────────────────────── */
  function define(id, cols, opts){
    SPECS[id] = cols;
    OMIT[id] = !!(opts && opts.omit);
  }
  /* The columns on offer right now: a column with an `offered` function that
     answers no (Caps on Functions, Password when not served) is neither drawn
     nor listed — the renderer and this file ask the same question. */
  function spec(id, variant){
    var cols = typeof SPECS[id] === "function" ? SPECS[id](variant) : SPECS[id];
    return (cols || []).filter(function(c){ return !c.offered || c.offered(); });
  }
  function labelOf(c){ return typeof c.label === "function" ? c.label() : (c.label || ""); }
  function pinned(c){ return !!(c.fixed || c.lock); }
  function hideable(c){ return !(c.fixed || c.lock || c.keep); }

  /* ── The store ─────────────────────────────────────────────────────────── */
  function load(id){
    if (STATE[id]) return STATE[id];
    var raw = null, migrated = false;
    try { raw = JSON.parse(localStorage.getItem(storeKey(id)) || "null"); } catch (e) { raw = null; }
    if ((!raw || typeof raw !== "object") && OLD_STORES[id]) {
      /* The chooser this replaces kept {key: shown}; this keeps {key: hidden}. */
      var old = null;
      try { old = JSON.parse(localStorage.getItem(OLD_STORES[id]) || "null"); } catch (e) { old = null; }
      if (old && typeof old === "object") {
        raw = { hidden:{} };
        Object.keys(old).forEach(function(k){ if (typeof old[k] === "boolean") raw.hidden[k] = !old[k]; });
        migrated = true;
      }
    }
    if (!raw || typeof raw !== "object") raw = {};
    STATE[id] = {
      order: Array.isArray(raw.order) ? raw.order.filter(function(k){ return typeof k === "string"; }) : [],
      hidden: (raw.hidden && typeof raw.hidden === "object") ? raw.hidden : {},
      widths: (raw.widths && typeof raw.widths === "object") ? raw.widths : {},
      density: DENSITIES.indexOf(raw.density) >= 0 ? raw.density : "normal"
    };
    if (migrated) save(id);
    return STATE[id];
  }
  function save(id){
    try { localStorage.setItem(storeKey(id), JSON.stringify(STATE[id])); } catch (e) {}
  }
  function reset(id){
    delete STATE[id];
    try { localStorage.removeItem(storeKey(id)); } catch (e) {}
    if (OLD_STORES[id]) { try { localStorage.removeItem(OLD_STORES[id]); } catch (e) {} }
  }

  /* The saved shape read against the columns on offer: hidden answers for every
     column (saved, else the shipped default), widths only where set by hand. */
  function hiddenOf(id, c){
    var st = load(id), v = st.hidden[c.k];
    if (!hideable(c)) return false;
    return typeof v === "boolean" ? v : !!c.off;
  }
  function widthOf(id, c){
    var w = +load(id).widths[c.k];
    return (!c.fixed && w >= MINW && w <= MAXW) ? Math.round(w) : 0;
  }
  function shown(id, k, variant){
    var c = spec(id, variant).filter(function(x){ return x.k === k; })[0];
    return c ? !hiddenOf(id, c) : true;
  }
  function setShown(id, k, on){
    load(id).hidden[k] = !on; save(id);
  }
  /* The order the columns are shown in: the leading pinned ones as shipped,
     the movable ones as saved (a movable column the store has never seen
     takes its shipped place), the trailing fixed ones as shipped. */
  function displayOrder(id, cols){
    var first = 0, last = cols.length - 1;
    while (first < cols.length && pinned(cols[first])) first++;
    while (last >= 0 && pinned(cols[last])) last--;
    var lead = cols.slice(0, first), mid = cols.slice(first, last + 1), tail = cols.slice(last + 1);
    var saved = load(id).order, byKey = {};
    mid.forEach(function(c){ byKey[c.k] = c; });
    var out = saved.filter(function(k){ return byKey[k]; }).map(function(k){ return byKey[k]; });
    mid.forEach(function(c, i){
      if (out.indexOf(c) >= 0) return;
      /* its shipped neighbour on the left, if that one is placed; else the front */
      var at = 0;
      for (var j = i - 1; j >= 0; j--) { var p = out.indexOf(mid[j]); if (p >= 0) { at = p + 1; break; } }
      out.splice(at, 0, c);
    });
    return lead.concat(out, tail);
  }
  function isDefault(id, cols){
    var st = load(id);
    if (st.density !== "normal") return false;
    if (cols.some(function(c){ return widthOf(id, c) > 0; })) return false;
    if (cols.some(function(c){ return hiddenOf(id, c) !== !!c.off; })) return false;
    var shipped = cols.filter(function(c){ return !pinned(c); }).map(function(c){ return c.k; });
    var now = displayOrder(id, cols).filter(function(c){ return !pinned(c); }).map(function(c){ return c.k; });
    return shipped.join("|") === now.join("|");
  }
  function counts(id, cols){
    var all = cols.filter(function(c){ return !c.fixed; });
    var on = all.filter(function(c){ return !hiddenOf(id, c); });
    return { shown: on.length, of: all.length };
  }

  /* ── What the renderers place: the menu in the header line, the status line under the table ── */
  function tools(id, variant){
    var cols = spec(id, variant), n = counts(id, cols), open = MENU === id, st = load(id);
    var out = '<span class="hmenu tcmenu' + (open ? " open" : "") + '">' +
      '<button class="hmenu-btn" data-colmenu="' + html(id) + '" aria-haspopup="true" aria-expanded="' + open + '" ' +
        'title="Columns, row height, and the table as it ships">Columns <span class="hcar">&#9662;</span>' +
        /* The count rides the button's corner and takes no width: the register's
           header line is full (§135, checks/identity-merge.py measures every
           menu as reachable), and a button that grew by a chip pushed itself
           under the pane's edge. Shown only while something is hidden — when
           every column is there, there is nothing to count. */
        (n.shown < n.of ? '<span class="tccount">' + n.shown + '/' + n.of + '</span>' : '') + '</button>';
    if (open) {
      out += '<div class="hmenu-panel cols tcpanel">' +
        '<div class="hmenu-h"><span>Show columns</span><span>' +
          '<button class="linkbu" data-tcall="' + html(id) + '">All</button> &middot; ' +
          '<button class="linkbu" data-tcnone="' + html(id) + '">None</button></span></div>' +
        cols.filter(function(c){ return !c.fixed; }).map(function(c){
          var on = !hiddenOf(id, c), w = widthOf(id, c), can = hideable(c);
          return '<label class="colrow' + (can ? "" : " locked") + '">' +
            '<input type="checkbox" data-col="' + html(c.k) + '" data-coltable="' + html(id) + '"' +
              (on ? " checked" : "") + (can ? "" : " disabled") + '>' +
            '<span class="lbl">' + html(labelOf(c)) + '</span>' +
            '<span class="px">' + (!can ? "always" : on ? (w ? w + " px" : "") : "hidden") + '</span></label>';
        }).join("") +
        '<div class="hmenu-sep"></div>' +
        '<div class="tcrows"><span class="tcrows-l">Rows</span><span class="segsw">' +
          DENSITIES.map(function(d){
            return '<button class="seg' + (st.density === d ? " on" : "") + '" data-tcdens="' + html(id + "|" + d) + '">' +
              d.charAt(0).toUpperCase() + d.slice(1) + '</button>';
          }).join("") + '</span></div>' +
        '<div class="hmenu-sep"></div>' +
        '<div class="tcback"><button class="linkbu" data-tcreset="' + html(id) + '"' +
          (isDefault(id, cols) ? " disabled" : "") + '>Reset the table</button>' +
          '<span class="hmenu-note">Drag a heading to move its column, its edge to set the width; ' +
          'double-click the edge to fit. Yours on this browser only.</span></div>' +
      '</div>';
    }
    return out + '</span>';
  }
  function foot(id){
    return '<div class="tcfoot" data-tcfoot="' + html(id) + '"><span class="tcstate"></span>' +
      '<span class="tckeys" aria-label="Keyboard, on a focused heading">' +
        '<span>Heading focused:</span>' +
        '<span><kbd>&larr;</kbd><kbd>&rarr;</kbd> next</span>' +
        '<span><kbd>Alt</kbd>+<kbd>&larr;</kbd><kbd>&rarr;</kbd> move</span>' +
        '<span><kbd>Shift</kbd>+<kbd>&larr;</kbd><kbd>&rarr;</kbd> width</span>' +
        '<span><kbd>F</kbd> fit</span><span><kbd>H</kbd> hide</span>' +
      '</span></div>';
  }

  /* ── After each paint: bend every declared table to its reader's shape ──── */
  function headCells(t){ return t.tHead && t.tHead.rows[0] ? [].slice.call(t.tHead.rows[0].cells) : []; }
  function hostOf(t){ return t.closest(".tblscroll, .cfg") || t.parentNode; }
  function plainRow(tr, n){
    if (tr.cells.length !== n) return false;
    for (var i = 0; i < tr.cells.length; i++) if (tr.cells[i].colSpan > 1) return false;
    return true;
  }
  function apply(root){
    (root || document).querySelectorAll("table[data-tktable]").forEach(function(t){
      if (SPECS[t.dataset.tktable]) applyOne(t);
    });
  }
  function applyOne(t){
    var id = t.dataset.tktable, cols = spec(id, t.dataset.tcvariant);
    var rendered = OMIT[id] ? cols.filter(function(c){ return !hiddenOf(id, c); }) : cols;
    var ths = headCells(t);
    /* A renderer and its declaration that disagree on how many columns there
       are leave the table exactly as drawn: bending the wrong cells is worse
       than bending none, and the count under the table says nothing. */
    if (!ths.length || ths.length !== rendered.length) return;
    var host = hostOf(t); if (host) host.classList.add("tc-host");

    ths.forEach(function(th, i){
      var c = rendered[i];
      th.setAttribute("data-col", c.k);
      if (c.fixed) return;
      th.classList.add("tcth");
      /* The edge is positioned inside its heading. A Setup heading is pinned
         `position:static` by a rule more specific than any class here
         (config.css §130.2), so the heading is made relative INLINE — and only
         where it is static: a frozen heading is sticky, which is positioned
         already and must stay so. */
      if (getComputedStyle(th).position === "static") {
        /* ...and its offsets with it: the freeze rule leaves a `left` on the
           name heading that static ignores and relative would obey — measured
           as the heading sliding 38px over its neighbour. */
        th.style.position = "relative"; th.style.left = "auto"; th.style.top = "auto";
      }
      if (!th.hasAttribute("tabindex")) th.setAttribute("tabindex", "0");
      if (!pinned(c)) th.classList.add("tcmove");
      th.insertAdjacentHTML("beforeend",
        '<span class="tcgrip" data-tcgrip="' + html(c.k) + '" title="Drag to set the width · double-click to fit"></span>');
    });

    /* Hidden (where the renderer drew it anyway) and moved, row by row. */
    var hide = {};
    rendered.forEach(function(c){ if (!OMIT[id] && hideable(c) && hiddenOf(id, c)) hide[c.k] = true; });
    var order = displayOrder(id, rendered);
    [].slice.call(t.rows).forEach(function(tr){
      if (!plainRow(tr, rendered.length)) return;
      var byKey = {};
      rendered.forEach(function(c, i){ byKey[c.k] = tr.cells[i]; });
      order.forEach(function(c){
        var cell = byKey[c.k];
        if (hide[c.k]) cell.classList.add("tc-hidden");
        tr.appendChild(cell);
      });
    });

    if (cols.some(function(c){ return widthOf(id, c) > 0; })) sizeTable(t, id, cols);

    var d = load(id).density;
    t.classList.remove("tc-comfortable", "tc-compact");
    if (d !== "normal") t.classList.add("tc-" + d);

    var n = counts(id, cols), dflt = isDefault(id, cols);
    var f = document.querySelector('[data-tcfoot="' + id + '"] .tcstate');
    if (f) f.innerHTML = '<b>' + n.shown + '</b> of ' + n.of + ' columns · ' + DENSITY_WORD[d] +
      (dflt ? '' : ' · <span class="tcchanged">changed from the shipped table</span>');
  }

  /* Lay the table out from the stored widths. Measured first, set second: a
     column the store has no number for keeps the width it was drawn at. */
  function sizeTable(t, id, cols){
    var ths = headCells(t), byKey = {}, natural = {};
    cols.forEach(function(c){ byKey[c.k] = c; });
    ths.forEach(function(th){ natural[th.dataset.col] = th.offsetWidth; });
    t.classList.add("tc-sized");
    t.style.tableLayout = "fixed"; t.style.minWidth = "0";
    var sum = 0, lockTh = null;
    ths.forEach(function(th){
      var k = th.dataset.col, c = byKey[k];
      /* Border-box, so the number set is the number measured: a cell's own
         `width` is its content and leaves out 16px of padding, and twelve
         of those summed into the table's width scaled every column by four
         fifths (found on the first run). */
      th.style.boxSizing = "border-box";
      if (th.classList.contains("tc-hidden")) { th.style.width = ""; return; }
      var w = Math.round((c && widthOf(id, c)) || natural[k]);
      th.style.width = w + "px"; sum += w;
      if (c && c.lock && !lockTh) lockTh = th;
    });
    var host = hostOf(t), room = host ? host.clientWidth : 0;
    if (room > sum && lockTh) {
      lockTh.style.width = (parseInt(lockTh.style.width, 10) + room - sum) + "px";
      sum = room;
    }
    t.style.width = sum + "px";
  }
  /* The first width set by hand writes every visible column down with it. */
  function takeWidths(t, id, cols){
    if (cols.some(function(c){ return widthOf(id, c) > 0; })) return;
    var st = load(id), byKey = {};
    cols.forEach(function(c){ byKey[c.k] = c; });
    headCells(t).forEach(function(th){
      var c = byKey[th.dataset.col];
      if (!c || c.fixed || th.classList.contains("tc-hidden")) return;
      st.widths[c.k] = Math.max(MINW, Math.min(MAXW, th.offsetWidth));
    });
  }
  function setWidth(t, id, cols, k, w){
    takeWidths(t, id, cols);
    load(id).widths[k] = Math.max(MINW, Math.min(MAXW, Math.round(w)));
    sizeTable(t, id, cols);
  }

  /* ── The pixel label beside a moving edge ───────────────────────────────── */
  var TIP = null, TIP_T = null;
  function tipAt(host, th, text){
    if (!TIP) { TIP = document.createElement("div"); TIP.className = "tctip"; }
    if (TIP.parentNode !== host) host.appendChild(TIP);
    var hr = host.getBoundingClientRect(), r = th.getBoundingClientRect(), z = zoomOf(host);
    TIP.textContent = text;
    TIP.style.left = ((r.right - hr.left) / z + host.scrollLeft) + "px";
    TIP.style.top = ((r.bottom - hr.top) / z + host.scrollTop + 4) + "px";
  }
  function tipGone(){ if (TIP && TIP.parentNode) TIP.parentNode.removeChild(TIP); }

  /* ── Width: drag the edge; a second press on it within 400ms fits ─────────
     The double-click is counted here rather than left to the browser: the
     repaint after the first release puts a NEW edge under the pointer, so the
     browser never sees a second click on the same element (the mockup's
     finding). */
  function startResize(e, grip){
    var th = grip.parentNode, t = th.closest("table"), id = t.dataset.tktable, k = grip.dataset.tcgrip;
    var cols = spec(id, t.dataset.tcvariant), host = hostOf(t);
    e.preventDefault(); e.stopPropagation();
    var now = Date.now();
    if (LASTGRIP && LASTGRIP.id === id && LASTGRIP.k === k && now - LASTGRIP.t < 400) {
      LASTGRIP = null; fit(t, id, cols, k); return;
    }
    LASTGRIP = { id:id, k:k, t:now };
    takeWidths(t, id, cols); sizeTable(t, id, cols);
    var w0 = parseInt(th.style.width, 10) || th.offsetWidth, x0 = e.clientX, z = zoomOf(host);
    grip.classList.add("on");
    try { grip.setPointerCapture(e.pointerId); } catch (x) {}
    tipAt(host, th, w0 + " px");
    function move(ev){
      var w = Math.max(MINW, Math.min(MAXW, Math.round(w0 + (ev.clientX - x0) / z)));
      load(id).widths[k] = w; sizeTable(t, id, cols); tipAt(host, th, w + " px");
    }
    function up(){
      grip.removeEventListener("pointermove", move); grip.removeEventListener("pointerup", up); grip.removeEventListener("pointercancel", up);
      grip.classList.remove("on"); tipGone(); save(id); repaint(); refocus(id, k);
    }
    grip.addEventListener("pointermove", move); grip.addEventListener("pointerup", up); grip.addEventListener("pointercancel", up);
  }
  /* Fit = the widest thing in the column plus the cell's own padding, whether
     that is wider or narrower than the column is now. Measured on a copy laid
     out at its natural width, because a cell reports the width it was GIVEN. */
  function contentWidth(cell){
    var c = document.createElement("div"); c.className = "tcmeasure"; c.innerHTML = cell.innerHTML;
    [].forEach.call(c.querySelectorAll(".tcgrip, .tk-arrow"), function(g){ g.parentNode.removeChild(g); });
    cell.appendChild(c);
    var w = c.offsetWidth, cs = getComputedStyle(cell);
    cell.removeChild(c);
    return w + parseFloat(cs.paddingLeft) + parseFloat(cs.paddingRight);
  }
  function fit(t, id, cols, k){
    var th = headCells(t).filter(function(h){ return h.dataset.col === k; })[0]; if (!th) return;
    var i = th.cellIndex, w = contentWidth(th) + 14;
    [].slice.call(t.tBodies[0] ? t.tBodies[0].rows : []).forEach(function(tr){
      if (tr.hidden || tr.classList.contains("newrow") || !tr.cells[i] || tr.cells.length !== th.parentNode.cells.length) return;
      w = Math.max(w, contentWidth(tr.cells[i]));
    });
    setWidth(t, id, cols, k, w + 2); save(id); repaint(); refocus(id, k);
  }
  function refocus(id, k){
    var th = document.querySelector('table[data-tktable="' + id + '"] th[data-col="' + k + '"]');
    if (th) { try { th.focus({ preventScroll:true }); } catch (e) { th.focus(); } }
  }

  /* ── Order: drag a heading; the column lifts and a line shows where it lands ── */
  function startMove(e, th){
    var t = th.closest("table"), id = t.dataset.tktable, k = th.dataset.col, host = hostOf(t);
    var cols = spec(id, t.dataset.tcvariant);
    var x0 = e.clientX, y0 = e.clientY, started = false, ghost = null, line = null, slots = [], target = null, grabX = 0, hr = null, z = 1;
    try { th.setPointerCapture(e.pointerId); } catch (x) {}
    function colCells(idx){
      return [].slice.call(t.rows).filter(function(tr){ return plainRow(tr, th.parentNode.cells.length); })
        .map(function(tr){ return tr.cells[idx]; });
    }
    function start(){
      started = true; host.classList.add("tc-dragging");
      hr = host.getBoundingClientRect(); z = zoomOf(host);
      var r = th.getBoundingClientRect(), w = th.offsetWidth; grabX = (x0 - r.left) / z;
      var idx = th.cellIndex, cells = colCells(idx);
      ghost = document.createElement("div"); ghost.className = "tcghost"; ghost.style.width = w + "px";
      var g = '<table class="' + html(t.className) + '" style="width:' + w + 'px"><thead><tr>' + th.outerHTML + '</tr></thead><tbody>';
      cells.slice(1).forEach(function(td){
        g += '<tr style="height:' + td.parentNode.offsetHeight + 'px">' + td.outerHTML + '</tr>';
      });
      ghost.innerHTML = g + '</tbody></table>';
      [].forEach.call(ghost.querySelectorAll(".tcgrip"), function(x){ x.parentNode.removeChild(x); });
      ghost.style.height = t.offsetHeight + "px";
      ghost.style.top = ((t.getBoundingClientRect().top - hr.top) / z + host.scrollTop) + "px";
      host.appendChild(ghost);
      cells.forEach(function(c){ c.classList.add("tc-lifted"); });
      line = document.createElement("div"); line.className = "tcdrop";
      line.style.height = ghost.style.height; line.style.top = ghost.style.top;
      host.appendChild(line);
      /* where a column may land: before each movable heading, and after the last one */
      var hs = [].slice.call(th.parentNode.cells).filter(function(h){ return !h.classList.contains("tc-hidden"); });
      var movers = hs.filter(function(h){ return h.classList.contains("tcmove"); });
      movers.forEach(function(h){ slots.push({ before:h.dataset.col, x:(h.getBoundingClientRect().left - hr.left) / z + host.scrollLeft }); });
      var lastM = movers[movers.length - 1];
      if (lastM) slots.push({ before:null, x:(lastM.getBoundingClientRect().right - hr.left) / z + host.scrollLeft });
    }
    function move(ev){
      if (!started) { if (Math.abs(ev.clientX - x0) < 5 && Math.abs(ev.clientY - y0) < 5) return; start(); }
      var px = (ev.clientX - hr.left) / z + host.scrollLeft;
      ghost.style.left = (px - grabX) + "px";
      var best = slots[0];
      slots.forEach(function(s){ if (Math.abs(s.x - px) < Math.abs(best.x - px)) best = s; });
      target = best; line.style.left = (best.x - 1) + "px"; line.style.display = "block";
    }
    function up(){
      th.removeEventListener("pointermove", move); th.removeEventListener("pointerup", up); th.removeEventListener("pointercancel", up);
      if (!started) return;              /* a plain press: the heading's own click sorts, as before */
      SWALLOW = true;
      host.classList.remove("tc-dragging");
      if (ghost) ghost.parentNode.removeChild(ghost);
      if (line) line.parentNode.removeChild(line);
      [].forEach.call(t.querySelectorAll(".tc-lifted"), function(c){ c.classList.remove("tc-lifted"); });
      if (target && target.before !== k) placeBefore(id, cols, k, target.before);
      repaint(); refocus(id, k);
    }
    th.addEventListener("pointermove", move); th.addEventListener("pointerup", up); th.addEventListener("pointercancel", up);
  }
  /* The movable keys, in display order, with k taken out and put back before
     `before` (null: at the end). Written as the whole movable order, so the
     store never holds a half-list. */
  function placeBefore(id, cols, k, before){
    var mid = displayOrder(id, cols).filter(function(c){ return !pinned(c); }).map(function(c){ return c.k; });
    mid.splice(mid.indexOf(k), 1);
    var at = before == null ? mid.length : mid.indexOf(before);
    if (at < 0) at = mid.length;
    mid.splice(at, 0, k);
    load(id).order = mid; save(id);
  }

  /* ── The keyboard, on a focused heading ─────────────────────────────────── */
  function onKey(e, th){
    var t = th.closest("table"), id = t.dataset.tktable, k = th.dataset.col;
    var cols = spec(id, t.dataset.tcvariant), c = cols.filter(function(x){ return x.k === k; })[0];
    if (!c) return;
    var dir = e.key === "ArrowRight" ? 1 : e.key === "ArrowLeft" ? -1 : 0;
    var heads = [].slice.call(th.parentNode.cells).filter(function(h){
      return h.classList.contains("tcth") && !h.classList.contains("tc-hidden"); });
    if (dir && e.altKey) {
      if (pinned(c)) return;
      e.preventDefault();
      var movers = heads.filter(function(h){ return h.classList.contains("tcmove"); });
      var at = movers.indexOf(th), other = movers[at + dir];
      if (!other) return;
      placeBefore(id, cols, k, dir < 0 ? other.dataset.col : (movers[at + 2] ? movers[at + 2].dataset.col : null));
      repaint(); refocus(id, k);
    } else if (dir && e.shiftKey) {
      e.preventDefault();
      var w = (parseInt(th.style.width, 10) || th.offsetWidth) + dir * STEP;
      setWidth(t, id, cols, k, w); save(id); repaint(); refocus(id, k);
      var nt = document.querySelector('table[data-tktable="' + id + '"] th[data-col="' + k + '"]');
      if (nt) { tipAt(hostOf(nt.closest("table")), nt, parseInt(nt.style.width, 10) + " px"); clearTimeout(TIP_T); TIP_T = setTimeout(tipGone, 900); }
    } else if (dir) {
      e.preventDefault();
      var n = heads[heads.indexOf(th) + dir]; if (n) n.focus();
    } else if (e.key === "f" || e.key === "F") {
      e.preventDefault(); fit(t, id, cols, k);
    } else if ((e.key === "h" || e.key === "H") && hideable(c)) {
      e.preventDefault();
      var next = heads[heads.indexOf(th) + 1] || heads[heads.indexOf(th) - 1];
      setShown(id, k, false); repaint(); if (next) refocus(id, next.dataset.col);
    }
  }

  /* ── Bound once, on the document: the headings are rebuilt by every paint ── */
  /* §772 (carried for main's §754) — the server reads this file too, to build a client (lib/frozen.cjs), and has no document to listen on */
  if (typeof document !== "undefined") {
  document.addEventListener("pointerdown", function(e){
    var grip = e.target.closest && e.target.closest(".tcgrip");
    if (grip) { startResize(e, grip); return; }
    var th = e.target.closest && e.target.closest("th.tcmove");
    if (th && e.button === 0 && !e.target.closest("button, a, input, select")) startMove(e, th);
  });
  document.addEventListener("click", function(e){
    if (SWALLOW) { SWALLOW = false; e.stopPropagation(); e.preventDefault(); }
  }, true);
  document.addEventListener("click", function(e){
    var el = e.target.closest ? e.target : null; if (!el) return;
    var b;
    if ((b = el.closest("[data-colmenu]"))) {
      e.stopPropagation();
      MENU = MENU === b.dataset.colmenu ? null : b.dataset.colmenu;
      /* one header menu open at a time, the register's own rule (§90) */
      if (typeof PWMENU !== "undefined") PWMENU = false;
      if (typeof PFILEMENU !== "undefined") PFILEMENU = false;
      repaint(); return;
    }
    if ((b = el.closest("[data-tcall],[data-tcnone]"))) {
      e.stopPropagation();
      var id = b.dataset.tcall || b.dataset.tcnone, on = b.hasAttribute("data-tcall");
      var tbl = document.querySelector('table[data-tktable="' + id + '"]');
      spec(id, tbl && tbl.dataset.tcvariant).forEach(function(c){ if (hideable(c)) setShown(id, c.k, on); });
      repaint(); return;
    }
    if ((b = el.closest("[data-tcdens]"))) {
      e.stopPropagation();
      var bits = b.dataset.tcdens.split("|");
      load(bits[0]).density = bits[1]; save(bits[0]); repaint(); return;
    }
    if ((b = el.closest("[data-tcreset]"))) {
      e.stopPropagation(); reset(b.dataset.tcreset); repaint(); return;
    }
    if (MENU && !el.closest(".hmenu")) { MENU = null; repaint(); }
  });
  /* A tick repaints the table and keeps the menu open — you come here to set
     several columns (§47.2). */
  document.addEventListener("change", function(e){
    var cb = e.target;
    if (!cb || !cb.matches || !cb.matches("input[data-col][data-coltable]")) return;
    e.stopPropagation();
    setShown(cb.dataset.coltable, cb.dataset.col, cb.checked); repaint();
  });
  document.addEventListener("keydown", function(e){
    if (e.key === "Escape" && MENU) { MENU = null; repaint(); return; }
    var th = e.target && e.target.closest && e.target.closest("th.tcth");
    if (th && !e.ctrlKey && !e.metaKey) onKey(e, th);
  });
  }

  return { define:define, spec:spec, shown:shown, setShown:setShown, tools:tools, foot:foot,
           apply:apply, reset:reset, shut:function(){ MENU = null; }, isOpen:function(){ return MENU; } };
})();
