/* ══ TRAIL (§261) ═════════════════════════════════════════════════════════
   Islam, after a reporting round in which people lost work: *"how about a
   history saving and recovery feature to track the changes per user and per
   unit and function to ensure nothing is lost?"* — and, from the mockup drawn
   out of real log rows: *"ok agreed let's build."*

   NOTHING NEW IS WRITTEN. Every accepted save has written `change_log` since
   §42 — who, when, which place, which row, which field, the value before and
   the value after. What was missing was a SCREEN over it and a WAY BACK. This
   file is both: Setup › History for the office (every person, every place), a
   line and a door on a unit's or function's own page for the people who hold
   it, and Restore.

   RESTORE IS AN ORDINARY CHANGE, NEVER A ROLLBACK (Islam's 2, agreed). It puts
   the old value into the row and lets the platform save, so it is authorised
   (§42), merged with everyone else's work (§210) and logged like any change —
   which is what lets a restore itself be put back. A rollback would copy an
   earlier database over the current one and silently destroy what everybody
   did since.

   THE READ IS FILTERED, NEVER THE WHOLE LOG (Islam's 3, agreed): a person, a
   place, a kind, a window, a cap — one indexed query on the log, never the
   graph (§98).

   NEVER paint() FROM A FETCH (§35, §71.2): the page draws a frame, asks, and
   writes the answer into its own node. Every control here is delegated on the
   document, so a repaint cannot leave a handler bound to a dead element
   (§29.5). Nothing here is drawn over file:// — there is no log to read. */
var TRAIL = (function(){
  var F = { person:"", target:"", kind:"", when:"today", q:"" };   /* the page's filters */
  var rows = [], loading = false, error = null, office = false, loadedFor = null;
  var lastCache = {};      /* target → {at, rows, when} for the unit line   */
  var pending = null;      /* the row a confirmation is open for            */

  function servable(){ return location.protocol !== "file:"; }
  function live(){ return typeof SYNC !== "undefined" && SYNC.isLive && SYNC.isLive(); }
  function E(s){ return typeof esc === "function" ? esc(s) : String(s == null ? "" : s); }

  /* ── WORDS ─────────────────────────────────────────────────────────── */
  var KIND = { unitPlan:"Plan", unitFoundation:"Plan", unitAnalysis:"Plan", unitReporting:"Reporting",
               reportState:"Report", capPlan:"Plan", capReporting:"Reporting", gapFill:"Fill",
               gapConfirm:"Fill", arrange:"Order", setup:"Setup", access:"Access", cycle:"Cycle",
               group:"Group", focus:"Focus", claim:"Figure set", claimRequest:"Figure set",
               sourceReporting:"Reporting", deckHide:"Slides", destroy:"Register", unknown:"Other" };
  var FIELD = { target:"Target", target3y:"3-year target", actual:"Actual", outActual:"Outcome actual",
                outTarget:"Outcome target", outcome:"Outcome", note:"Note", pct:"% complete",
                status:"Status", compile:"Compile rule", dir:"Direction", quarters:"Quarters",
                owner:"Owner", collaborators:"Collaborators", name:"Name", description:"Description",
                weight:"Weight", finish:"Due date", start:"Start", end:"End", def:"Definition",
                aspiration:"Aspiration", progress:"Progress", measureAt:"Measure date",
                horizon:"Horizon", kind:"Measured as", hide:"Hidden" };
  function kindWord(k){ return KIND[k] || k; }
  function fieldWord(f){ return FIELD[f] || String(f || ""); }
  function placeWord(t){
    if (!t) return "Setup";
    try { if (typeof placeLabel === "function") { var w = placeLabel(t); return t === "group" ? "The group" : w; } } catch (e) {}
    return String(t).replace(/^fn:/, "");
  }
  /* WHO IS THE REGISTER'S NAME, NEVER THE FULL LEGAL ONE (§261.1, Islam:
     "make the who matching the name in the register not the full name"):
     the same word the register and every picker show (§93.8, §130.7),
     resolved off the key; the full name the log stored goes on the hover. */
  function whoWord(e){
    try {
      var dn = typeof displayNames === "function" ? displayNames() : null;
      var p = (typeof PEOPLE !== "undefined" ? PEOPLE : []).filter(function(x){ return x.key === e.person_key; })[0];
      if (p && typeof knownName === "function") { var k = knownName(p, dn); if (k) return k; }
    } catch (x) {}
    return e.person_name || e.person_key || "";
  }
  function pad(n){ return (n < 10 ? "0" : "") + n; }
  function dateWord(at){
    var d = new Date(at); if (isNaN(d)) return "";
    var now = new Date();
    var sameDay = function(a, b){ return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate(); };
    if (sameDay(d, now)) return "Today";
    var y = new Date(now); y.setDate(now.getDate() - 1);
    if (sameDay(d, y)) return "Yesterday";
    var M = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
    return d.getDate() + " " + M[d.getMonth()] + (d.getFullYear() !== now.getFullYear() ? " " + d.getFullYear() : "");
  }
  function timeWord(at){ var d = new Date(at); return isNaN(d) ? "" : pad(d.getHours()) + ":" + pad(d.getMinutes()); }
  function whenWord(at){
    var d = new Date(at); if (isNaN(d)) return "";
    var now = new Date(), t = pad(d.getHours()) + ":" + pad(d.getMinutes());
    var sameDay = function(a, b){ return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate(); };
    if (sameDay(d, now)) return "Today " + t;
    var y = new Date(now); y.setDate(now.getDate() - 1);
    if (sameDay(d, y)) return "Yesterday " + t;
    var M = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
    return d.getDate() + " " + M[d.getMonth()] + (d.getFullYear() !== now.getFullYear() ? " " + d.getFullYear() : "") + ", " + t;
  }
  function plain(v){
    if (v === null || v === undefined || v === "") return "nothing";
    if (Array.isArray(v) && v.length === 4 && v.every(function(x){ return typeof x === "boolean"; }))
      return v.map(function(b, i){ return b ? "Q" + (i+1) : null; }).filter(Boolean).join(" ") || "no quarter";
    if (Array.isArray(v)) return v.join(", ");
    if (typeof v === "object") return JSON.stringify(v);
    return String(v);
  }
  function valHtml(v){
    if (v === null || v === undefined || v === "") return '<span class="hist-none" title="nothing">—</span>';
    if (Array.isArray(v) && v.length === 4 && v.every(function(x){ return typeof x === "boolean"; }))
      return v.map(function(b, i){ return '<i class="hist-q' + (b ? ' on' : '') + '" title="Q' + (i+1) + (b ? ' on' : ' off') + '"></i>'; }).join("");
    if (Array.isArray(v)) return E(v.join(", "));
    if (typeof v === "object") return E(JSON.stringify(v));
    return E(String(v));
  }

  /* ── THE ROWS, ONE PER CHANGED FIELD ───────────────────────────────── */
  /* A log entry holds one change with 0..n moved fields. The table draws one
     line per field, or one line for an entry with none (a submission, a
     setting), so what a person reads is the FACT and never the envelope. */
  function flatten(entries){
    var out = [];
    (entries || []).forEach(function(e){
      var moved = e.rows_ && e.rows_.moved && e.rows_.moved.length ? e.rows_.moved : null;
      if (!moved) { out.push({ e:e, m:null }); return; }
      moved.forEach(function(m){ out.push({ e:e, m:m }); });
    });
    return out;
  }
  /* WHY A ROW CANNOT BE PUT BACK, or null when it can (§61: a greyed control
     carries its reason, never a missing one). */
  function noRestore(r){
    var k = r.e.kind;
    if (k === "reportState") return "A submitted report is reopened from its Reporting tab.";
    if (k === "arrange") return "The order of a plan is put back by dragging it on the Plan page.";
    if (!r.m) return "This change has no single value to put back.";
    if (k === "setup" || k === "access" || k === "cycle" || k === "destroy" || k === "focus" ||
        k === "claim" || k === "claimRequest" || k === "deckHide")
      return "This is a setting, put back on its own page.";
    if (r.m.field === "name" && r.m.from == null) return "A row that was added is removed from the Plan page.";
    return null;
  }

  function tableHtml(list, opts){
    opts = opts || {};
    if (!list.length) return '<p class="hist-empty">' + E(opts.empty || "No changes recorded for this.") + '</p>';
    /* ROW AND FROM → TO WRAP; EVERYTHING ELSE IS ONE LINE (§261.1, reversing
       §88 for exactly two columns at Islam's instruction: "you need to wrap
       the change to appear in the cell and same for the row"). A value is
       what this page exists to show, and a value clipped to an ellipsis is a
       value not shown. The short cells stay one line, or the row's height
       would be set by a name. */
    var h = '<table class="hist" data-hist-table><colgroup>' +
      (opts.noPlace
        ? '<col style="width:9%"><col style="width:6%"><col style="width:12%"><col style="width:10%"><col style="width:22%"><col style="width:11%"><col style="width:20%"><col style="width:10%">'
        : '<col style="width:7%"><col style="width:6%"><col style="width:13%"><col style="width:9%"><col style="width:10%"><col style="width:17%"><col style="width:10%"><col style="width:20%"><col style="width:8%">') +
      '</colgroup><thead><tr>' +
      '<th>Date</th><th>Time</th><th>Who</th>' + (opts.noPlace ? '' : '<th>Where</th>') + '<th>Kind</th><th>Row</th><th>Field</th><th>From → To</th><th>Restore</th></tr></thead><tbody>';
    list.forEach(function(r, i){
      var e = r.e, m = r.m, why = noRestore(r);
      var rowName = m ? (m.name || m.id) : (e.what || kindWord(e.kind));
      h += '<tr data-hist-row="' + i + '">' +
        '<td class="hist-t" title="' + E(new Date(e.at).toLocaleString()) + '">' + E(dateWord(e.at)) + '</td>' +
        '<td class="hist-t">' + E(timeWord(e.at)) + '</td>' +
        '<td title="' + E(e.person_name || "") + '">' + E(whoWord(e)) + '</td>' +
        (opts.noPlace ? '' : '<td>' + E(placeWord(e.target)) + '</td>') +
        '<td><span class="hist-chip">' + E(kindWord(e.kind)) + '</span></td>' +
        '<td class="hist-name hist-wrap" title="' + E(m ? m.id : "") + '">' + E(rowName) + '</td>' +
        '<td class="hist-fld">' + (m ? E(fieldWord(m.field)) : '') + '</td>' +
        '<td class="hist-fromto hist-wrap" title="' + (m ? E(plain(m.from) + ' → ' + plain(m.to)) : '') + '">' + (m ? valHtml(m.from) + ' <span class="hist-arr">→</span> ' + valHtml(m.to) : '<span class="hist-none">—</span>') + '</td>' +
        '<td class="hist-act">' + (why
          ? '<button type="button" class="hist-rst" disabled aria-disabled="true" title="' + E(why) + '">Restore</button>'
          : '<button type="button" class="hist-rst" data-hist-restore="' + i + '">Restore</button>') + '</td>' +
        '</tr>';
    });
    return h + '</tbody></table>';
  }

  /* ── THE ASK ───────────────────────────────────────────────────────── */
  /* The window is worked out from the READER's day, so "today" is their
     today; the server compares instants and never a date of its own. */
  function window_(when){
    var now = new Date(), from = null, to = null;
    var day0 = function(d){ return new Date(now.getFullYear(), now.getMonth(), now.getDate() + (d || 0)); };
    if (when === "today") from = day0(0);
    else if (when === "yesterday") { from = day0(-1); to = day0(0); }
    else if (when === "week") from = day0(-6);
    else if (when === "month") from = day0(-29);
    else if (when === "year") from = new Date(now.getFullYear(), 0, 1);
    return { from: from ? from.toISOString() : null, to: to ? to.toISOString() : null };
  }
  function fetchLog(f, done){
    if (!servable() || !live()) return done(new Error("no server"), null);
    var qs = ["log=1"];
    if (f.target) qs.push("target=" + encodeURIComponent(f.target));
    if (f.person) qs.push("person=" + encodeURIComponent(f.person));
    if (f.kind) qs.push("kind=" + encodeURIComponent(f.kind));
    var w = window_(f.when);
    if (w.from) qs.push("from=" + encodeURIComponent(w.from));
    if (w.to) qs.push("to=" + encodeURIComponent(w.to));
    qs.push("limit=" + (f.limit || 200));
    fetch("/api/state?" + qs.join("&"), { cache:"no-store" })
      .then(function(r){ return r.json().then(function(j){ return { st:r.status, j:j }; }); })
      .then(function(x){
        if (x.st !== 200 || !x.j || !x.j.ok) return done(new Error((x.j && x.j.error) || ("HTTP " + x.st)), null);
        done(null, x.j);
      })
      .catch(function(e){ done(e || new Error("could not reach the server"), null); });
  }

  /* ── THE SETUP PAGE ────────────────────────────────────────────────── */
  function opt(v, label, cur){ return '<option value="' + E(v) + '"' + (v === cur ? ' selected' : '') + '>' + E(label) + '</option>'; }
  function toolsHtml(){
    var people = '';
    try {
      var dn = typeof displayNames === "function" ? displayNames() : null;
      (typeof PEOPLE !== "undefined" ? PEOPLE : []).filter(function(p){ return typeof personActive !== "function" || personActive(p); })
        .sort(function(a, b){ return String(a.name).localeCompare(String(b.name)); })
        .forEach(function(p){ people += opt(p.key, (typeof knownName === "function" ? knownName(p, dn) : p.name) || p.key, F.person); });
    } catch (e) {}
    var places = '';
    try {
      places += opt("group", "The group", F.target);
      (typeof UNIT_KEYS !== "undefined" ? UNIT_KEYS : []).forEach(function(k){ places += opt(k, placeWord(k), F.target); });
      Object.keys(typeof FUNCTIONS !== "undefined" ? FUNCTIONS : {}).forEach(function(k){ places += opt("fn:" + k, placeWord("fn:" + k), F.target); });
    } catch (e) {}
    var kinds = [["unitPlan","Plan (unit)"],["capPlan","Plan (function)"],["unitReporting","Reporting (unit)"],["capReporting","Reporting (function)"],
                 ["gapFill","Fill"],["reportState","Report submitted"],["setup","Setup"],["access","Access"],["cycle","Cycle"],["group","Group"]]
      .map(function(k){ return opt(k[0], k[1], F.kind); }).join("");
    return '<span class="hist-tools">' +
      '<input class="fld tk-search" type="search" data-hist-q placeholder="Search a row or a person…" autocomplete="off" value="' + E(F.q) + '">' +
      '<select class="fld" data-hist-f="person" aria-label="Person">' + opt("", "Everyone", F.person) + people + '</select>' +
      '<select class="fld" data-hist-f="target" aria-label="Place">' + opt("", "Everywhere", F.target) + places + '</select>' +
      '<select class="fld" data-hist-f="kind" aria-label="Kind">' + opt("", "Every kind", F.kind) + kinds + '</select>' +
      '<select class="fld" data-hist-f="when" aria-label="When">' + opt("today", "Today", F.when) + opt("yesterday", "Yesterday", F.when) + opt("week", "Last 7 days", F.when) + opt("month", "Last 30 days", F.when) + opt("year", "This year", F.when) + opt("all", "All time", F.when) + '</select>' +
      '</span>';
  }
  function bodyHtml(){
    if (error) return '<p class="hist-empty hist-err">History could not be read — ' + E(error) + ' <button type="button" class="linkbtn" data-hist-retry>Try again</button></p>';
    if (loading && !rows.length) return '<p class="hist-empty">Reading…</p>';
    var list = flatten(rows);
    return '<p class="hist-count">' + (list.length ? list.length + (list.length === 1 ? ' change' : ' changes') + (rows.length >= 200 ? ' — the most recent 200 entries; narrow the filters for older ones' : '') : 'Nothing changed in this window') + '</p>' +
      tableHtml(list, { empty: "Nothing was changed in this window. Widen the filters to look further back." });
  }
  function renderPage(){
    var head = typeof cfgHead === "function" ? cfgHead("History", [], null, false, null, null, toolsHtml()) : '<h2>History</h2>' + toolsHtml();
    setTimeout(function(){ load(true); }, 0);
    return head + '<div class="hist-page" data-hist-page>' + bodyHtml() + '</div>';
  }
  function applySearch(){
    var q = String(F.q || "").trim().toLowerCase();
    document.querySelectorAll("[data-hist-page] table.hist tbody tr, .hist-modal table.hist tbody tr").forEach(function(tr){
      tr.hidden = !!q && tr.textContent.toLowerCase().indexOf(q) === -1;
    });
  }
  function draw(){
    var el = document.querySelector("[data-hist-page]");
    if (!el) return;
    el.innerHTML = bodyHtml();
    applySearch();
    if (typeof clipTitles === "function") { try { clipTitles(); } catch (e) {} }
  }
  function load(force){
    var key = JSON.stringify([F.person, F.target, F.kind, F.when]);
    if (!force && key === loadedFor) return;
    loading = true; error = null; loadedFor = key; draw();
    fetchLog(F, function(err, j){
      if (loadedFor !== key) return;      /* a newer ask has superseded this one */
      loading = false;
      if (err) { error = err.message || String(err); rows = []; draw(); return; }
      rows = j.log || []; office = !!j.office; draw();
    });
  }

  /* ── THE UNIT'S OWN LINE, AND THE DOOR ─────────────────────────────── */
  function target(){
    var c = typeof current !== "undefined" ? current : null;
    if (!c || c === "setup" || c === "manage" || c === "group") return null;
    if (String(c).indexOf("co:") === 0) return null;
    return typeof TARGET !== "undefined" ? TARGET : null;
  }
  function lineHtml(t, entry){
    return '<span class="pband-hist">Last changed by <b>' + E(whoWord(entry)) + '</b>, ' +
      E(whenWord(entry.at).replace(/^Today /, "today ").replace(/^Yesterday /, "yesterday ")) +
      ' · <button type="button" class="linkbtn" data-hist-open="' + E(t) + '">See history</button></span>';
  }
  function placeLine(t, entry){
    var band = document.querySelector(".pane > .pband, .pane .pband");
    if (!band || band.querySelector(".pband-hist")) return;
    var r = band.querySelector(".pband-r");
    var span = document.createElement("span");
    span.innerHTML = lineHtml(t, entry);
    if (r) r.insertBefore(span.firstChild, r.firstChild); else band.appendChild(span.firstChild);
  }
  function onPaint(){
    if (!servable() || !live()) return;
    var t = target(); if (!t) return;
    var c = lastCache[t];
    if (c && Date.now() - c.when < 60000) { if (c.entry) placeLine(t, c.entry); return; }
    fetchLog({ target:t, when:"all", limit:1 }, function(err, j){
      if (err) return;                       /* a page is not for complaining about its log */
      var entry = (j.log || [])[0] || null;
      lastCache[t] = { when: Date.now(), entry: entry };
      if (entry && target() === t) placeLine(t, entry);
    });
  }
  function openFor(t){
    if (typeof openModalHtml !== "function") return;
    openModalHtml("History — " + E(placeWord(t)), "Who changed what here, most recent first.",
      '<div class="hist-modal" data-hist-modal="' + E(t) + '"><p class="hist-empty">Reading…</p></div>');
    fetchLog({ target:t, when:"all", limit:200 }, function(err, j){
      var el = document.querySelector('[data-hist-modal="' + t.replace(/"/g, '\\"') + '"]');
      if (!el) return;
      if (err) { el.innerHTML = '<p class="hist-empty hist-err">History could not be read — ' + E(err.message || err) + '</p>'; return; }
      rows = j.log || []; office = !!j.office;
      el.innerHTML = tableHtml(flatten(rows), { noPlace:true, empty:"Nothing has been changed here yet." });
      if (typeof clipTitles === "function") { try { clipTitles(); } catch (e) {} }
    });
  }

  /* ── RESTORE ───────────────────────────────────────────────────────── */
  /* FINDING THE ROW: by target and id, never by position (§48). A unit's and
     a pillars function's rows go through the platform's own finder; a
     capability function's rows are walked here, because no shared finder
     answers a milestone by id. */
  function locate(t, id){
    var hit = null;
    try {
      if (t === "group") {
        (GROUP.keyObjectives || []).forEach(function(m){ if (m.id === id) hit = m; });
        return hit;
      }
      var u = typeof unitLikeWritable === "function" ? unitLikeWritable(t) : null;
      if (u && typeof findById === "function") {
        var f = findById(u, id);
        if (f && f.swot) return { __swot: f.swot };
        if (f && f.obj) return f.obj;
      }
      (GROUP.capabilities || []).forEach(function(c){
        if (String(t) !== "fn:" + c.fn) return;
        if (c.id === id) hit = c;
        (c.keyObjectives || []).forEach(function(m){ if (m.id === id) hit = m; });
        (c.projects || []).forEach(function(p){
          if (p.id === id) hit = p;
          ["deliverables", "outcomes", "milestones"].forEach(function(k){
            (p[k] || []).forEach(function(x){ if (x.id === id) hit = x; });
          });
        });
      });
    } catch (e) { hit = null; }
    return hit;
  }
  function confirmHtml(r){
    var m = r.m, e = r.e;
    return '<div class="hist-confirm">' +
      '<p><strong>Put back the ' + E(fieldWord(m.field).toLowerCase()) + ' of ' + E(m.name || m.id) + ' on ' + E(placeWord(e.target)) + ' to ' +
      (m.from == null || m.from === "" ? 'nothing' : E(Array.isArray(m.from) ? m.from.join(", ") : String(m.from))) + '?</strong></p>' +
      '<p>It reads <b>' + (m.to == null || m.to === "" ? 'nothing' : E(Array.isArray(m.to) ? m.to.join(", ") : String(m.to))) + '</b> now, set by ' + E(whoWord(e)) + ' ' + E(whenWord(e.at).toLowerCase()) + '. ' +
      'Putting it back is an ordinary change: it is saved, authorised and logged like any other, so it can itself be put back.</p>' +
      '<div class="hist-confirm-acts"><button type="button" class="btn ghost" data-hist-cancel>Cancel</button>' +
      '<button type="button" class="btn" data-hist-ok>Put it back</button></div></div>';
  }
  function restore(r){
    var m = r.m, e = r.e;
    var obj = locate(e.target, m.id);
    if (!obj) return "That row is no longer in the plan, so there is nothing to put the value back into.";
    if (obj.__swot) { obj.__swot.arr[obj.__swot.idx] = m.from == null ? "" : m.from; }
    else if (m.had === false || m.from === undefined) { delete obj[m.field]; }
    else obj[m.field] = m.from;
    return null;
  }

  /* ── WIRING, DELEGATED ONCE ────────────────────────────────────────── */
  document.addEventListener("change", function(ev){
    var s = ev.target && ev.target.closest && ev.target.closest("[data-hist-f]");
    if (!s) return;
    F[s.dataset.histF] = s.value;
    load(false);
  });
  document.addEventListener("input", function(ev){
    var i = ev.target && ev.target.closest && ev.target.closest("[data-hist-q]");
    if (!i) return;
    F.q = i.value; applySearch();       /* typing never repaints (§35) */
  });
  document.addEventListener("click", function(ev){
    var b = ev.target && ev.target.closest && ev.target.closest("[data-hist-retry],[data-hist-open],[data-hist-restore],[data-hist-ok],[data-hist-cancel]");
    if (!b) return;
    if (b.hasAttribute("data-hist-retry")) { load(true); return; }
    if (b.hasAttribute("data-hist-open")) { openFor(b.getAttribute("data-hist-open")); return; }
    if (b.hasAttribute("data-hist-restore")) {
      var list = flatten(rows), r = list[+b.getAttribute("data-hist-restore")];
      if (!r || !r.m) return;
      pending = r;
      var inModal = !!b.closest("[data-hist-modal]");
      if (inModal) {
        var host = b.closest("[data-hist-modal]");
        var box = host.querySelector(".hist-confirm-host") || document.createElement("div");
        box.className = "hist-confirm-host"; box.innerHTML = confirmHtml(r);
        if (!box.parentNode) host.insertBefore(box, host.firstChild);
      } else if (typeof openModalHtml === "function") {
        openModalHtml("Put it back?", "", confirmHtml(r));
      }
      return;
    }
    if (b.hasAttribute("data-hist-cancel")) {
      pending = null;
      var hostc = b.closest(".hist-confirm-host");
      if (hostc) hostc.remove(); else if (typeof closeModal === "function") closeModal();
      return;
    }
    if (b.hasAttribute("data-hist-ok")) {
      if (!pending) return;
      var why = restore(pending);
      var box2 = b.closest(".hist-confirm");
      if (why) { if (box2) box2.innerHTML = '<p class="hist-empty hist-err">' + E(why) + '</p>'; pending = null; return; }
      pending = null;
      var wasModalOnly = !b.closest(".hist-confirm-host");
      if (wasModalOnly && typeof closeModal === "function") closeModal();
      else { var h2 = b.closest(".hist-confirm-host"); if (h2) h2.remove(); }
      /* THE SAVE IS THE PLATFORM'S OWN: paint() ends in afterPaint(), which
         posts the change at once (§170) and says so if it fails (§171). */
      if (typeof paint === "function") paint();
      /* The restore lands as a new log row; ask again once it has. */
      setTimeout(function(){ load(true); var t = target(); if (t) { delete lastCache[t]; onPaint(); } }, 1800);
      return;
    }
  });

  return { renderPage: renderPage, onPaint: onPaint, openFor: openFor, load: load,
           /* for the checks */
           filters: function(){ return F; }, rows: function(){ return rows; }, flatten: flatten,
           locate: locate, noRestore: noRestore, servable: servable };
})();
