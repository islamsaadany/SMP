/* ══ UNSAVED (§504) ═══════════════════════════════════════════════════════
   Islam: a save that fails (the server or the network, never a refusal) is
   kept on the person's computer and resent by itself (sync.js); "Send to the
   Strategy Office" puts its changed lines on ONE list here, Setup › Unsaved
   changes, for the office to work through.

   ONE ROW PER LINE, AND ONE GROUP PER PLACE: two people who sent the same
   line are one decision — "Two people sent this", Use X / Use Y / Discard —
   because applying one answer closes the other on the server (lib/unsaved.ts).

   APPLY RUNS AS THE SENDER, on the server, never with the office's rights:
   a line the sender could not have saved is refused and stays on the list.
   A line that has landed by itself leaves the list on the next read.

   Built on TRAIL's pattern (§262): the page draws a frame, asks, and writes
   the answer into its own node; NEVER paint() from a fetch (§35, §71.2);
   every control is delegated on the document once (§29.5). Not drawn over
   file:// — there is no server to send to. */
var UNSAVED = (function(){
  var lines = [], loading = false, error = null, busy = {}, said = {};

  function servable(){ return location.protocol !== "file:"; }
  function E(s){ return typeof esc === "function" ? esc(s) : String(s == null ? "" : s); }
  function api(){ return typeof SYNC !== "undefined" && SYNC.withClient ? SYNC.withClient("/api/state") : "/api/state"; }

  /* ── WORDS ─────────────────────────────────────────────────────────── */
  function placeOf(at){
    var a = String(at || ""), m;
    if (a === "group" || a.indexOf("group") === 0) return "The group";
    if ((m = /^units\.([^.]+)/.exec(a))) return word(m[1]);
    if ((m = /^functions\.([^.]+)/.exec(a))) return word("fn:" + m[1]);
    return "Setup";
  }
  function word(t){ try { if (typeof placeLabel === "function") return placeLabel(t) || t; } catch (e) {} return String(t).replace(/^fn:/, ""); }
  function field(f){ return typeof TRAIL !== "undefined" && TRAIL.fieldWord ? TRAIL.fieldWord(f) : String(f || ""); }
  /* the row's own name, read from the graph this tab holds — a name only,
     so a row the plan no longer has simply goes unnamed */
  function rowName(id){
    if (!id) return "";
    var hit = "";
    (function walk(o, d){
      if (hit || !o || typeof o !== "object" || d > 9) return;
      if (Array.isArray(o)) { for (var i = 0; i < o.length && !hit; i++) walk(o[i], d + 1); return; }
      if (o.id === id && typeof o.name === "string") { hit = o.name; return; }
      for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) walk(o[k], d + 1);
    })(typeof SYNC !== "undefined" && SYNC.graph ? SYNC.graph() : null, 0);
    return hit;
  }
  function label(l){
    var a = String(l.addr || "");
    if (a.indexOf("p:") === 0) {
      var p = a.slice(2), parts = p.split(".");
      return { place: placeOf(p), what: field(parts[parts.length - 1]) };
    }
    var r = a.slice(2).split("|");   /* r:<at>|<path>|<id>|<field> */
    var nm = rowName(r[2]);
    return { place: placeOf(r[0]), what: (nm ? nm + " · " : "") + field(r[3]) };
  }
  function show(v){
    if (!v || !v.has) return '<span class="hist-none">empty</span>';
    var x = v.value;
    if (x == null || x === "") return '<span class="hist-none">empty</span>';
    var s = typeof x === "object" ? JSON.stringify(x) : String(x);
    if (s.length > 140) s = s.slice(0, 137) + "…";
    return E(s);
  }
  function who(l){
    var e = { person_key: l.by, person_name: l.byName };
    try { if (typeof TRAIL !== "undefined" && TRAIL.whoWord) return TRAIL.whoWord(e); } catch (er) {}
    return l.byName || l.by;
  }
  function when(at){
    try { if (typeof TRAIL !== "undefined" && TRAIL.whenWord) return TRAIL.whenWord(at); } catch (e) {}
    return String(at || "").slice(0, 16).replace("T", " ");
  }

  /* ── THE PAGE ──────────────────────────────────────────────────────── */
  function groups(){
    var by = {}, order = [];
    lines.forEach(function(l){ if (!by[l.addr]) { by[l.addr] = []; order.push(l.addr); } by[l.addr].push(l); });
    return order.map(function(a){ return by[a]; });
  }
  function rowHtml(l, two){
    var lb = label(l), b = busy[l.id];
    var act = two
      ? '<button type="button" class="hist-rst" data-uns-apply="' + E(l.id) + '"' + (b ? ' disabled' : '') + '>Use ' + E(who(l)) + '</button>'
      : '<button type="button" class="hist-rst" data-uns-apply="' + E(l.id) + '"' + (b ? ' disabled' : '') + '>Apply</button> ' +
        '<button type="button" class="hist-rst" data-uns-discard="' + E(l.id) + '"' + (b ? ' disabled' : '') + '>Discard</button>';
    var note = said[l.id] ? '<div class="hist-err">' + E(said[l.id]) + '</div>' : '';
    return '<tr data-uns-row="' + E(l.id) + '">' +
      '<td><b>' + E(lb.place) + '</b><div class="hist-none">' + E(lb.what) + '</div></td>' +
      '<td class="hist-fromto">' + show(l.now) + '</td>' +
      '<td class="hist-fromto">' + show(l.mine) + '</td>' +
      '<td><span title="' + E(l.error || "") + '">' + E(who(l)) + '</span><div class="hist-t">' + E(when(l.at)) + '</div></td>' +
      '<td class="hist-act">' + act + note + '</td></tr>';
  }
  function bodyHtml(){
    if (error) return '<p class="hist-empty hist-err">The list could not be read — ' + E(error) + '. Nothing has been lost. <button type="button" class="linkbtn" data-uns-retry>Try again</button></p>';
    if (loading && !lines.length) return '<p class="hist-empty">Reading…</p>';
    if (!lines.length) return '<p class="hist-empty">Nothing is waiting. Changes people sent when a save failed appear here until they land.</p>';
    var gs = groups(), body = "";
    gs.forEach(function(g){
      if (g.length > 1) {
        body += '<tr class="grp"><td colspan="5">Two people sent this · ' +
          '<button type="button" class="hist-rst" data-uns-discard-all="' + E(g.map(function(x){ return x.id; }).join(",")) + '">Discard</button></td></tr>';
      }
      g.forEach(function(l){ body += rowHtml(l, g.length > 1); });
    });
    return '<p class="hist-count">' + lines.length + (lines.length === 1 ? ' change' : ' changes') + ' waiting</p>' +
      '<table class="hist uns"><thead><tr><th>Line</th><th>On the platform now</th><th>Sent</th><th>From</th><th></th></tr></thead><tbody>' +
      body + '</tbody></table>';
  }
  function draw(){
    var el = document.querySelector("[data-uns-page]");
    if (el) el.innerHTML = bodyHtml();
  }
  function load(){
    if (!servable()) return;
    loading = true; error = null; draw();
    fetch(api() + (api().indexOf("?") === -1 ? "?" : "&") + "unsaved=1", { cache:"no-store" })
      .then(function(r){ return r.json().then(function(j){ return { st:r.status, j:j }; }); })
      .then(function(x){
        loading = false;
        if (x.st !== 200 || !x.j || !x.j.ok) { error = (x.j && x.j.error) || ("HTTP " + x.st); lines = []; draw(); return; }
        lines = x.j.lines || []; draw();
      })
      .catch(function(e){ loading = false; error = (e && e.message) || "could not reach the server"; lines = []; draw(); });
  }
  function renderPage(){
    var head = typeof cfgHead === "function" ? cfgHead("Unsaved changes", [], null, false, null, null, "") : '<h2>Unsaved changes</h2>';
    setTimeout(load, 0);
    return head + '<div class="hist-page" data-uns-page>' + bodyHtml() + '</div>';
  }
  function act(kind, id, done){
    busy[id] = true; delete said[id]; draw();
    fetch(api(), { method:"POST", headers:{ "Content-Type":"application/json" }, body: JSON.stringify({ unsaved: kind, id: id }) })
      .then(function(r){ return r.json().then(function(j){ return { st:r.status, j:j }; }, function(){ return { st:r.status, j:null }; }); })
      .then(function(x){
        delete busy[id];
        if (x.st !== 200 || !x.j || !x.j.ok) said[id] = (x.j && x.j.error) || ("Not done — HTTP " + x.st);
        if (done) done(x.st === 200 && x.j && x.j.ok);
      })
      .catch(function(){ delete busy[id]; said[id] = "Not done — the server did not answer."; if (done) done(false); });
  }

  document.addEventListener("click", function(ev){
    var b = ev.target && ev.target.closest && ev.target.closest("[data-uns-apply],[data-uns-discard],[data-uns-discard-all],[data-uns-retry]");
    if (!b) return;
    if (b.hasAttribute("data-uns-retry")) { load(); return; }
    if (b.hasAttribute("data-uns-apply")) {
      act("apply", b.getAttribute("data-uns-apply"), function(ok){
        if (ok && typeof SYNC !== "undefined" && SYNC.refresh) { try { SYNC.refresh(); } catch (e) {} }
        load();
      });
      return;
    }
    if (b.hasAttribute("data-uns-discard")) { act("discard", b.getAttribute("data-uns-discard"), load); return; }
    var ids = b.getAttribute("data-uns-discard-all").split(","), left = ids.length;
    ids.forEach(function(id){ act("discard", id, function(){ if (--left === 0) load(); }); });
  });

  return { renderPage: renderPage, load: load, servable: servable,
           /* for the checks */ lines: function(){ return lines; }, label: label };
})();
