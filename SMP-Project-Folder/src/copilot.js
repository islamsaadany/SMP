/* ══ THE STRATEGY COPILOT, AS A TAB (spec 064, stages 1 and 2) ════════════
   Islam's decision record v0.4, and the picture he signed off
   (design-mockups/copilot/2026-09-30_copilot-tab.html): a Copilot tab on
   every place after Reporting, five sections inside it, and on the left two
   rails for this place and section — Chats on top with + New chat, and
   Deliverables below it. The office's alone.

   STAGE 1 IS THE SHELF WITH NO AI (plan §5). A chat keeps what is typed and
   answers with the product's own line saying the AI is not connected yet —
   drawn as the PRODUCT speaking, never dressed as an answer (§125). A
   deliverable opens with every version it has had; Edit and Restore each ADD
   a version, and nothing is ever overwritten (decisions §3.6, §3.7).

   STAGE 2 IS THE AI IN THE CHAT (plan §5), drawn as round 2 signed it off
   (design-mockups/copilot/2026-09-30_copilot-round2.html): the one line of
   what the AI can see for this place, read from the platform's own scoring
   so the numbers match Performance; missing input
   named with its ways on as quick replies; "Assume for me" recorded on the
   chat; pasted material marked with an offer to keep it; and files — Word,
   PDF and Excel — attached beside the box and shown as chips.

   WHERE IT IS DRAWN IS THE SERVER'S ANSWER (§61, the Insights tab's own
   rule, §376): the served document carries `data-copilot` only where the
   client has the module and the door gave this person an office seat, so
   there is no dead tab over file:// or for a client's own person. `inOffice()`
   is asked as well, because viewing as somebody (§185) is judged as them and
   the stamp was written for the person signed in.

   NEVER paint() FROM A FETCH (§35, §71.2): the tab draws a frame, asks, and
   writes the answer into its own nodes. A half-typed message survives every
   answer that lands, because the composer is never rewritten while a hand
   is in it.

   THE PLACE IS THE SHELL'S OWN WORD — TARGET, the string a role is held at —
   so nothing is translated between the tab and the rows it reads (§53.5). */
var COPILOT = (function(){
  var SECTIONS = [
    { k:"foundation", label:"Foundation" },
    { k:"analysis",   label:"Analysis" },
    { k:"directions", label:"Directions" },
    { k:"execution",  label:"Execution" },
    { k:"advisory",   label:"Advisory" }
  ];
  /* What is open, per place and section, so walking to another section and
     back lands where you were. */
  var OPEN = {};                 /* "place|section" -> {kind:"chat"|"deliv", id} */
  var LISTS = {};                /* "place|section" -> {chats, deliverables} or {failed} */
  var PANE = null;               /* the open item's answer: chat+messages or deliverable+versions */
  /* §456: THE COPILOT PAGE OPENS A ROW HERE. Its link ends in
     `#cop=chat-<id>` or `#cop=deliv-<id>`, read ONCE as the script loads —
     the shell rewrites the address after its first paint and drops the hash —
     and spent on the first list that holds that id, so it opens that chat or
     deliverable in its place and section and never again. An id the list
     does not hold (deleted since, or archived) opens nothing and says nothing:
     the list on screen is the answer. */
  var DEEP = (function(){
    try {
      var m = /^#cop=(chat|deliv)-([0-9a-f-]{36})$/i.exec(String(location.hash || ""));
      return m ? { kind: m[1].toLowerCase(), id: m[2].toLowerCase() } : null;
    } catch (e) { return null; }
  })();
  var EDIT = null;               /* {id, text, note} while a deliverable is being edited */
  var RENAME = null;             /* chat id being renamed, in the rail */
  var MENU = null;               /* chat id whose three-dot menu is open */
  var ASKDEL = null;             /* archived chat id asking "Delete?" in its row */
  var ARCH = {};                 /* "place|section" -> true while the rail shows the archived chats */
  var DRAFT = {};                /* chat id -> what is half-typed in its composer */
  var SAY = "";                  /* the outcome line under the pane (§63) */
  var busy = false, askedFor = null;
  var THINKING = null;           /* chat id while its answer is being written */
  var NOTNOW = {};               /* pasted-offer message ids waved away, this session */
  var MAX_FILE = 3 * 1024 * 1024;

  function E(s){ return typeof esc === "function" ? esc(s) : String(s == null ? "" : s); }
  function live(){ return typeof SYNC !== "undefined" && SYNC.isLive && SYNC.isLive(); }
  function stamped(){ return document.documentElement.getAttribute("data-copilot") === "1"; }
  /* VIEW OR EDIT (Islam, 2026-10-01, from the signed-off
     design-mockups/copilot-access/2026-10-01_copilot-column.html): the
     viewer's office roles asked of the LIVE access map through the module
     cell's own reader, with the area's shipped default the api applies
     (lib/copilot.ts copilotGrant) — so a cell the Super user changes on Roles
     & access reads here at once, and the server refuses the same writes.
     No declared area (an older document) is today's behaviour, edit. */
  function grant(){
    var a = typeof copilotArea === "function" ? copilotArea() : null;
    if (!a) return "edit";
    var rs = [];
    try { rs = (typeof personRoles === "function" && typeof viewer === "function") ? personRoles(viewer()) : []; } catch (e) { rs = []; }
    var best = "none", RANK = { none:0, view:1, edit:2 };
    rs.forEach(function(r){
      if (!SMPRules.isOfficeRole(r.role)) return;
      var g = typeof moduleGrantFor === "function" ? moduleGrantFor(r.role, a) : a.shipped;
      if ((RANK[g] || 0) > RANK[best]) best = g;
    });
    return best;
  }
  function canEdit(){ return grant() === "edit"; }
  function shown(){ return stamped() && live() && (typeof inOffice !== "function" || inOffice()) && grant() !== "none"; }

  function sections(){
    if (!shown()) return [];
    return SECTIONS.map(function(s){ return { k:s.k, ac:"c_kb", label:s.label, render:renderPane }; });
  }
  function place(){ return typeof TARGET !== "undefined" ? String(TARGET || "") : ""; }
  function section(){
    var s = (typeof CURSEC !== "undefined" && CURSEC.copilot) || "foundation";
    for (var i = 0; i < SECTIONS.length; i++) if (SECTIONS[i].k === s) return s;
    return "foundation";
  }
  function key(){ return place() + "|" + section(); }
  function slug(){
    var m = String(location.pathname || "").match(/^\/([a-z0-9][a-z0-9-]{0,47})/);
    return m ? m[1] : "";
  }
  /* Viewing as somebody asks as them (§383): the route narrows with it and
     can only narrow, so an office member looking through a unit head's eyes
     is refused here exactly as the unit head would be. */
  function url(path, qs){
    var who = (typeof SYNC !== "undefined" && SYNC.actingAs) ? SYNC.actingAs() : null;
    var q = (qs || []).slice();
    if (who) q.push("viewAs=" + encodeURIComponent(who));
    return "/" + slug() + "/copilot/" + path + (q.length ? "?" + q.join("&") : "");
  }
  function getJ(path, qs){
    return fetch(url(path, qs), { cache:"no-store", credentials:"same-origin" })
      .then(function(r){ return r.json().then(function(j){ return { st:r.status, j:j }; }, function(){ return { st:r.status, j:null }; }); });
  }
  /* A question is waited for two minutes at most (§464): with no limit a
     slow answer left the page on "working" for as long as it took, which
     read as broken. */
  var WAIT_MS = (window.__copWaitMs || 120000);
  function post(body, waitMs){
    var ctrl = (waitMs && typeof AbortController !== "undefined") ? new AbortController() : null, timedOut = false;
    var tm = ctrl ? setTimeout(function(){ timedOut = true; ctrl.abort(); }, waitMs) : null;
    return fetch(url("api"), { method:"POST", cache:"no-store", credentials:"same-origin",
      headers:{ "Content-Type":"application/json" }, body: JSON.stringify(body), signal: ctrl ? ctrl.signal : undefined })
      .then(function(r){ if (tm) clearTimeout(tm); return r.json().then(function(j){ return { st:r.status, j:j }; }, function(){ return { st:r.status, j:null }; }); },
        function(e){ if (tm) clearTimeout(tm); throw (timedOut ? { timedOut: true } : e); });
  }

  /* ── NAMES ARE THE REGISTER'S (§93.8, §130.7) ──────────────────────────
     A row stores the key; the name is read at draw time, so a person
     renamed on the register reads renamed here. Somebody the register no
     longer holds keeps their key rather than a guess (§35). */
  function nameOf(k){
    if (!k) return "The office";
    var p = (typeof personBy === "function") ? personBy(k) : null;
    if (!p) return k;
    return (typeof knownName === "function" ? knownName(p) : "") || p.name || k;
  }
  function when(iso){
    if (!iso) return "";
    var d = new Date(iso); if (isNaN(d)) return "";
    var M = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
    return d.getDate() + " " + M[d.getMonth()] + " " + d.getFullYear();
  }

  /* ── THE PANE ────────────────────────────────────────────────────────── */
  function renderPane(){
    setTimeout(function(){ loadList(false); }, 0);
    var shut = railShut();
    return '<div class="coppane' + (shut ? " copshut" : "") + '" data-cop-pane>' +
      '<div class="copslim"><button type="button" class="coptog" data-cop-railtog aria-expanded="' + !shut + '" aria-label="Show chats and deliverables" title="Show chats and deliverables">' + TOGMARK + '</button>' +
        (canEdit() ? '<button type="button" class="coptog" data-cop-newchat aria-label="New chat" title="New chat">+</button>' : '') + '</div>' +
      '<aside class="coprails">' +
        '<section class="coprail copchats"><div class="coprh" data-cop-chatshead>' + chatsHead() + '</div>' +
          '<div class="coplist" data-cop-chats>' + chatsHtml() + '</div>' +
          '<div class="coprft" data-cop-chatsfoot>' + chatsFoot() + '</div></section>' +
        '<section class="coprail"><div class="coprh"><span>Deliverables</span></div>' +
          '<div class="coplist" data-cop-delivs>' + delivsHtml() + '</div></section>' +
      '</aside>' +
      '<div class="copmain" data-cop-main>' + mainHtml() + '</div>' +
    '</div>';
  }
  function list(){ return LISTS[key()] || null; }
  /* ── THE CHATS RAIL (§453, Islam 2026-10-01, from the signed-off
     design-mockups/copilot/2026-10-01_chat-composer.html) ──────────────
     Rename and Archive live on each chat's three dots, not on the open
     chat's header: they act on a chat, so they sit beside it, and any chat
     can be renamed without opening it first. The dots show on the open chat
     always, on the others when hovered, and always on a touch screen — a
     tablet has no hover (§280). A chat is ARCHIVED, never deleted, by anyone
     in the office; the archived list is the same rail, reached from its
     foot, where anyone may Restore and only the Super user may Delete, and
     Delete asks once more in its row (§62 — never a browser dialog, §95). */
  var DOTS = '<svg viewBox="0 0 16 16" aria-hidden="true"><circle cx="3.5" cy="8" r="1.4"/><circle cx="8" cy="8" r="1.4"/><circle cx="12.5" cy="8" r="1.4"/></svg>';
  function archView(){ return !!ARCH[key()]; }
  /* §470 option A (Islam, 2 Oct: "A ok"): the hide control sits at the
     start of the Chats header rather than on a row of its own above the
     rails, so an open rail spends no line on it. */
  function chatsHead(){
    var tog = '<button type="button" class="coptog cophtog" data-cop-railtog aria-expanded="' + !railShut() + '" aria-label="Hide chats and deliverables" title="Hide chats and deliverables">' + TOGMARK + '</button>';
    return archView() ? tog + '<span class="coprhl">Archived chats</span>'
      : tog + '<span class="coprhl">Chats</span>' + (canEdit() ? '<button type="button" class="copnew" data-cop-newchat>+ New chat</button>' : '');
  }
  function chatsFoot(){
    var l = list();
    if (archView()) return '<button type="button" class="coparch" data-cop-archview>&lsaquo; Back to chats</button>';
    if (!l || l.failed) return '';
    return '<button type="button" class="coparch" data-cop-archview>Archived &middot; ' + (l.archived || []).length + '</button>';
  }
  function chatsHtml(){
    var l = list();
    if (!l) return '<div class="copnone">Asking…</div>';
    if (l.failed) return '<div class="copnone">The chats could not be read just now. Nothing has been lost. ' +
      '<button type="button" class="linkbu" data-cop-retry>Try again</button></div>';
    var arch = archView(), rows = arch ? (l.archived || []) : l.chats;
    var head = arch && canEdit() ? '<div class="copnote">' + (l.mayDelete ? "Restore brings a chat back. Delete removes it for good."
      : "Restore brings a chat back. Only the Super user can delete.") + '</div>' : '';
    var o = OPEN[key()] || {};
    if (!rows.length) return head + '<div class="copnone">' + (arch ? "Nothing archived." : "No chats here yet.") + '</div>';
    return head + rows.map(function(c){
      var on = o.kind === "chat" && o.id === c.id;
      if (ASKDEL === c.id) return '<div class="coprow ask" data-cop-row="' + E(c.id) + '"><span class="copt">' + E(c.title) + '</span>' +
        '<span class="copaskrow">Delete? <button type="button" class="copbtn danger solid" data-cop-delete-yes="' + E(c.id) + '">Delete</button>' +
        '<button type="button" class="copbtn quiet" data-cop-delete-no>Cancel</button></span></div>';
      if (RENAME === c.id) return '<div class="coprow' + (on ? " on" : "") + '" data-cop-row="' + E(c.id) + '">' +
        '<input class="fld copren" data-cop-rename-box="' + E(c.id) + '" value="' + E(c.title) + '" aria-label="Chat name" maxlength="160"></div>';
      var menu = MENU === c.id ? '<div class="copmenu" role="menu">' + (arch
          ? '<button type="button" role="menuitem" data-cop-restore-chat="' + E(c.id) + '">Restore</button>' +
            (l.mayDelete ? '<button type="button" role="menuitem" class="danger" data-cop-delete="' + E(c.id) + '">Delete…</button>' : '')
          : '<button type="button" role="menuitem" data-cop-rename="' + E(c.id) + '">Rename</button>' +
            '<button type="button" role="menuitem" data-cop-archive="' + E(c.id) + '">Archive</button>') + '</div>' : '';
      return '<div class="coprow' + (on ? " on" : "") + '" data-cop-row="' + E(c.id) + '">' +
        '<button type="button" class="copitem" data-cop-chat="' + E(c.id) + '"' + (on ? ' aria-current="true"' : '') + '>' +
          '<span class="copt">' + E(c.title) + '</span>' +
          '<span class="copm">' + E(nameOf(c.by)) + ' · ' + E(when(c.last)) + (c.guided ? ' · Guided' : '') + '</span></button>' +
        (!canEdit() ? '' : '<button type="button" class="copdots" data-cop-menu="' + E(c.id) + '" aria-haspopup="menu" aria-expanded="' + (MENU === c.id) +
          '" aria-label="Actions for ' + E(c.title) + '" title="Rename, archive…">' + DOTS + '</button>' + menu) + '</div>';
    }).join("");
  }
  function delivsHtml(){
    var l = list();
    if (!l) return '<div class="copnone">Asking…</div>';
    if (l.failed) return '<div class="copnone">—</div>';
    if (!l.deliverables.length) return '<div class="copnone">Nothing saved here yet.</div>';
    var o = OPEN[key()] || {};
    return l.deliverables.map(function(d){
      var on = o.kind === "deliv" && o.id === d.id;
      return '<button type="button" class="copitem' + (on ? " on" : "") + '" data-cop-deliv="' + E(d.id) + '"' +
        (on ? ' aria-current="true"' : '') + '>' +
        '<span class="copt">' + E(d.title) + '</span>' +
        '<span class="copm">' + kindWord(d.kind) + ' · v' + E(d.latest) + ' · ' + E(when(d.latestAt)) + '</span></button>';
    }).join("");
  }
  function kindWord(k){ return k === "promotable" ? "Promotable" : "Copilot-only"; }

  function mainHtml(){
    var o = OPEN[key()];
    var say = SAY ? '<div class="copsay" role="status">' + E(SAY) + '</div>' : '';
    if (!o) return say + '<div class="copempty">' +
      '<b>' + (canEdit() ? 'Start a chat, or open a deliverable.' : 'Open a chat or a deliverable.') + '</b>' +
      'A chat here is about ' + E(placeWord()) + '’s ' + E(sectionWord()) + '.</div>';
    if (!PANE || PANE.id !== o.id) return say + '<div class="copnone">Opening…</div>';
    if (PANE.failed) return say + '<div class="copnone"><b>This could not be opened just now.</b> ' + E(PANE.why || "Nothing has been lost.") +
      ' <button type="button" class="linkbu" data-cop-reopen>Try again</button></div>';
    return say + (o.kind === "chat" ? (flowView() ? flowHtml() : chatHtml()) : delivHtml());
  }
  function placeWord(){
    var t = place();
    try { if (typeof placeLabel === "function") { var w = placeLabel(t); if (w) return w; } } catch (e) {}
    return t === "group" ? "the group" : t;
  }
  function sectionWord(){
    var s = section();
    for (var i = 0; i < SECTIONS.length; i++) if (SECTIONS[i].k === s) return SECTIONS[i].label;
    return s;
  }

  /* ── WHAT THE AI CAN SEE (plan §5 stage 2) ─────────────────────────────
     One line, with the detail on hover, built from the SAME readers the
     Performance page scores with (unitLike, itemsNow, measureScore, bandOf,
     reportedCount), so the Copilot is never told a number the platform does
     not show (§53.5). It travels with each message as prompt material and
     is stored nowhere. A place the scoring cannot read is named and nothing
     more is claimed about it (§35). */
  function lw(k, many){
    try { if (typeof labelWord === "function") return labelWord(k, many ? "bu" : "group"); } catch (e) {}
    return k;
  }
  function contextOf(){
    var line = [placeWord()], detail = [];
    var u = null;
    try { u = typeof unitLike === "function" ? unitLike(place()) : null; } catch (e) { u = null; }
    if (u) {
      try {
        var items = typeof itemsNow === "function" ? itemsNow(u) : (u.items || []);
        var nm = 0, off = [];
        items.forEach(function(p){
          var shownM = (p.measures || []).filter(function(m){ return !(SMPRules.isHidden && SMPRules.isHidden(m)); });
          nm += shownM.length;
          var perf = typeof pillarPerf === "function" ? pillarPerf(p) : null;
          detail.push((p.code ? p.code + " " : "") + (p.name || "") + (perf != null ? " — " + perf + "%" : ""));
          shownM.forEach(function(m){
            var sc = typeof measureScore === "function" ? measureScore(m) : null;
            if (sc != null && typeof bandOf === "function" && bandOf(sc).key === "bad") off.push(m.name + " (" + sc + "%)");
          });
        });
        if (items.length) line.push(plural(items.length, lw("pillar"), lw("pillar", true)));
        if (nm) line.push(plural(nm, lw("measure"), lw("measure", true)));
        var ko = (u.keyObjectives || []).length;
        if (ko) line.push(plural(ko, lw("keyobj"), lw("keyobj", true)));
        if (typeof REVIEW !== "undefined" && REVIEW && REVIEW.name) {
          var rc = typeof reportedCount === "function" ? reportedCount(u) : null;
          line.push(REVIEW.name + (rc && rc.total ? ": " + rc.done + " of " + rc.total + " reported" : ""));
        }
        if (off.length) { line.push(plural(off.length, "measure", "measures") + " off track"); detail.push("Off track: " + off.join("; ")); }
      } catch (e) { /* a place the readers cannot score is only named */ }
    } else if (typeof REVIEW !== "undefined" && REVIEW && REVIEW.name) {
      line.push(REVIEW.name);
    }
    var text = planText(place(), u);
    return { line: line.join(" · ") + (text ? " · the plan's own text" : ""), detail: detail.join("\n"), text: text };
  }

  /* THE PLAN'S OWN WORDS (§457). Islam: the Copilot told him Mobile had no
     Winning Aspiration while the Foundation plainly held one — because the
     line above sent names and counts and never a sentence anybody wrote. Each
     message now carries the place's written plan as the page shows it, read
     off the same object the page renders (unitLike, so a function, a
     capability and the group's own plan come too), hidden rows left out
     exactly as every score leaves them out (§233). The chat's own section
     goes FIRST, so the server's cap trims the far sections and never the one
     being asked about. Nothing is stored from it. */
  function clean(v){ return String(v == null ? "" : v).replace(/\s+/g, " ").trim(); }
  /* Where the words live depends on the place: a unit's are on the unit; the
     group's Foundation is GROUP's own (topAsUnit carries only its pillars and
     SWOT); a supporting function or a capability that plans in projects or
     actions is not unit-shaped at all, so its definition and objectives are
     read off the function or capability and its work off its holders — the
     list its own pages draw (fnHolders, §326, §342). */
  function sourceOf(t, u){
    var o = {}, k;
    if (u) for (k in u) o[k] = u[k];
    if (t === "group" && typeof GROUP !== "undefined" && GROUP) {
      o.aspiration = GROUP.aspiration; o.endInMind = GROUP.endInMind;
      o.clauses = GROUP.clauses; o.keyObjectives = GROUP.keyObjectives;
    }
    var holder = null;
    try {
      if (t.indexOf("fn:") === 0 && typeof FUNCTIONS !== "undefined") {
        var fk = t.slice(3), F = FUNCTIONS[fk];
        if (F) { if (!u) { o.def = F.def; o.keyObjectives = F.keyObjectives; } }
        holder = typeof fnHolders === "function" ? fnHolders(fk) : [];
      } else if (t.indexOf("cap:") === 0 && typeof capById === "function") {
        var C = capById(t.slice(4));
        if (C && !u) { o.def = C.def; o.keyObjectives = C.keyObjectives; holder = [C]; }
      }
    } catch (e) { holder = null; }
    o.projects = []; o.actions = [];
    (holder || []).forEach(function(h){
      if (!h) return;
      o.projects = o.projects.concat(h.projects || []);
      o.actions = o.actions.concat(h.actions || []);
      if (!o.def && h.def) o.def = h.def;
    });
    return o;
  }
  function planText(t, u0){
    var u = sourceOf(t, u0);
    var hid = function(r){ return SMPRules.isHidden && SMPRules.isHidden(r); };
    var fig = function(r){
      var b = [];
      if (clean(r.dir) || clean(r.target)) b.push("target " + clean((r.dir || "") + " " + (r.target || "")));
      if (clean(r.target3y)) b.push("3-year " + clean(r.target3y));
      if (clean(r.actual)) b.push("reported " + clean(r.actual));
      return b.length ? " (" + b.join(", ") + ")" : "";
    };
    var parts = {};
    var f = [];
    if (clean(u.aspiration)) f.push(lw("aspiration") + (typeof GROUP !== "undefined" && GROUP && GROUP.horizon ? " (horizon " + GROUP.horizon + ")" : "") + ": " + clean(u.aspiration));
    if (clean(u.endInMind)) f.push("End in mind: " + clean(u.endInMind));
    if (clean(u.def)) f.push("Definition: " + clean(u.def));
    (u.clauses || []).forEach(function(c){ if (c && clean(c[1])) f.push(clean(c[0]) + ": " + clean(c[1])); });
    var kos = (u.keyObjectives || []).filter(function(k){ return !hid(k) && clean(k.name); });
    if (kos.length) f.push(lw("keyobj", true) + ":\n" + kos.map(function(k){ return "- " + clean(k.name) + fig(k); }).join("\n"));
    if (f.length) parts.foundation = "FOUNDATION\n" + f.join("\n");
    var sw = u.swot || {}, sn = { s:"Strengths", w:"Weaknesses", o:"Opportunities", t:"Threats" }, a = [];
    ["s","w","o","t"].forEach(function(q){
      var list = (sw[q] || []).map(function(x){ return clean(x && typeof x === "object" ? (x.text || x.name) : x); }).filter(Boolean);
      if (list.length) a.push(sn[q] + ":\n" + list.map(function(x){ return "- " + x; }).join("\n"));
    });
    if (a.length) parts.analysis = "SWOT\n" + a.join("\n");
    var items = [];
    try { items = typeof itemsNow === "function" ? itemsNow(u) : (u.items || []); } catch (e) { items = u.items || []; }
    var d = [], x = [];
    items.forEach(function(p){
      var head = (p.code ? p.code + " " : "") + clean(p.name) + (clean(p.owner) ? " (owner " + clean(p.owner) + ")" : "");
      var ms = (p.measures || []).filter(function(m){ return !hid(m) && clean(m.name); });
      d.push(head + (clean(p.sub) ? " — " + clean(p.sub) : "") + (ms.length ? "\n" + ms.map(function(m){ return "- " + clean(m.name) + fig(m); }).join("\n") : ""));
      var ts = (p.tactics || []).filter(function(t){ return !hid(t) && clean(t.name); });
      if (ts.length) x.push(head + "\n" + ts.map(function(t){
        var qs = ["q1","q2","q3","q4"].filter(function(q){ return t[q]; }).map(function(q){ return q.toUpperCase(); }).join("/");
        var b = [];
        if (clean(t.owner)) b.push("owner " + clean(t.owner));
        if (qs) b.push(qs);
        if (clean(t.status)) b.push(clean(t.status));
        if (clean(t.outcome)) b.push("outcome " + clean(t.outcome) + (clean(t.outTarget) ? " target " + clean(t.outTarget) : "") + (clean(t.outActual) ? " reported " + clean(t.outActual) : ""));
        return "- " + clean(t.name) + (b.length ? " (" + b.join(", ") + ")" : "");
      }).join("\n"));
    });
    (u.projects || []).filter(function(pr){ return pr && !hid(pr) && clean(pr.name); }).forEach(function(pr){
      var b = [];
      if (clean(pr.owner)) b.push("owner " + clean(pr.owner));
      if (clean(pr.start) || clean(pr.end)) b.push(clean(pr.start) + " to " + clean(pr.end));
      var rows = [];
      if (clean(pr.brief)) rows.push("Brief: " + clean(pr.brief));
      (pr.deliverables || []).filter(function(r){ return !hid(r) && clean(r.name); }).forEach(function(r){
        rows.push("- deliverable: " + clean(r.name) + (clean(r.status) ? " (" + clean(r.status) + ")" : ""));
      });
      (pr.outcomes || []).filter(function(r){ return !hid(r) && clean(r.name); }).forEach(function(r){
        rows.push("- outcome: " + clean(r.name) + fig(r));
      });
      (pr.milestones || []).filter(function(r){ return !hid(r) && clean(r.name); }).forEach(function(r){
        rows.push("- milestone: " + clean(r.name) + (clean(r.finish) ? " due " + clean(r.finish) : "") + (clean(r.status) ? " (" + clean(r.status) + ")" : ""));
      });
      d.push("Project: " + clean(pr.name) + (b.length ? " (" + b.join(", ") + ")" : "") + (rows.length ? "\n" + rows.join("\n") : ""));
    });
    var acts = (u.actions || []).filter(function(r){ return r && !hid(r) && clean(r.name); });
    if (acts.length) x.push("Actions\n" + acts.map(function(r){
      var b = [];
      ["owner","due","status"].forEach(function(k){ if (clean(r[k])) b.push(k + " " + clean(r[k])); });
      return "- " + clean(r.name) + (b.length ? " (" + b.join(", ") + ")" : "");
    }).join("\n"));
    if (d.length) parts.directions = (items.length ? lw("pillar", true).toUpperCase() + " AND MEASURES" : "PROJECTS") + "\n" + d.join("\n");
    if (x.length) parts.execution = "TACTICS\n" + x.join("\n");
    var order = ["foundation","analysis","directions","execution"], sec = section();
    if (order.indexOf(sec) > 0) order = [sec].concat(order.filter(function(k){ return k !== sec; }));
    return order.filter(function(k){ return parts[k]; }).map(function(k){ return parts[k]; }).join("\n\n");
  }

  function sizeWord(n){ return n >= 1048576 ? (Math.round(n / 104857.6) / 10) + " MB" : Math.max(1, Math.round(n / 1024)) + " KB"; }
  var KINDW = { pdf:"PDF", docx:"Word", xlsx:"Excel" };
  function fileChip(f, pending){
    var name = '<b>' + E(f.name) + '</b> · ' + (KINDW[f.kind] || "") + ' · ' + sizeWord(f.size);
    return '<span class="copfile">' + FILEMARK +
      (pending ? name + ' <button type="button" class="copx" data-cop-detach="' + E(f.id) + '" aria-label="Remove ' + E(f.name) + '">&times;</button>'
               : '<a href="' + E(url("file", ["id=" + encodeURIComponent(f.id)])) + '" download>' + name + '</a>') + '</span>';
  }
  var FILEMARK = '<svg class="copfm" viewBox="0 0 16 16" aria-hidden="true"><path d="M4 1.5h5.5L13 5v9.5H4z M9.5 1.5V5H13" fill="none" stroke="currentColor" stroke-width="1.3" stroke-linejoin="round"/></svg>';
  var CLIP = '<svg viewBox="0 0 16 16" aria-hidden="true"><path d="M10.5 4.5 5.8 9.2a1.3 1.3 0 0 0 1.9 1.9l5-5a2.6 2.6 0 0 0-3.7-3.7l-5 5a3.9 3.9 0 0 0 5.5 5.5l4.2-4.2" fill="none" stroke="currentColor" stroke-width="1.3" stroke-linecap="round"/></svg>';
  var SENDMARK = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M20 5v7a3 3 0 0 1-3 3H5M9 11l-4 4 4 4" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>';
  var INFO = '<svg viewBox="0 0 16 16" aria-hidden="true"><circle cx="8" cy="8" r="6.5" fill="none" stroke="currentColor" stroke-width="1.2"/><path d="M8 7v4.5M8 4.6v.1" stroke="currentColor" stroke-width="1.4" stroke-linecap="round"/></svg>';

  function srcTag(s){
    if (!s || s === "platform") return '';
    return ' <span class="copsrc' + (s === "assumed" ? " assumed" : "") + '">' + E(s === "pasted" ? "Pasted" : s === "assumed" ? "Assumed" : s) + '</span>';
  }
  /* An item in the method's own shape (§460): a title and its score on one
     line, the description under it, then what it rests on. An item with
     none of that is the one line it always was. */
  function itemHtml(it){
    if (!it.title && !it.evidence && !it.score) return '<li>' + E(it.text) + srcTag(it.source) + '</li>';
    return '<li class="copit">' +
      (it.title || it.score ? '<div class="copith"><span>' + E(it.title || "") + '</span>' + (it.score ? '<span class="copscore">' + E(it.score) + '</span>' : '') + '</div>' : '') +
      '<div>' + E(it.text) + '</div>' +
      '<div class="copev">' + (it.evidence ? 'Evidence: ' + E(it.evidence) : '') + srcTag(it.source) + '</div></li>';
  }
  function secLabel(){
    var s = section();
    for (var i = 0; i < SECTIONS.length; i++) if (SECTIONS[i].k === s) return SECTIONS[i].label;
    return s;
  }
  /* WHILE THE COPILOT WORKS (§464, Islam: "keep it one word"): one word that
     changes every two seconds, three moving dots, and after forty seconds a
     line saying it is taking longer. The word is rewritten IN PLACE on a
     clock and never by a repaint, or the box under it would be rebuilt while
     somebody types the next message (§35). */
  var WORK_WORDS = ["Reading", "Thinking", "Checking", "Fetching", "Weighing", "Drafting", "Writing"];
  var WORK_SLOW = "Still working — this one is taking a little longer";
  var THINK_AT = 0, WORK_TIMER = null;
  function workWord(){
    var ms = THINK_AT ? Date.now() - THINK_AT : 0;
    if (ms >= 40000) return WORK_SLOW;
    return WORK_WORDS[Math.floor(ms / 2000) % WORK_WORDS.length];
  }
  function workTick(){
    if (!THINKING) { clearInterval(WORK_TIMER); WORK_TIMER = null; return; }
    var w = document.querySelector("[data-cop-wword]"); if (w) w.textContent = workWord();
  }
  window.__copWork = { words: WORK_WORDS, slow: WORK_SLOW, word: workWord };
  function answerHtml(m, last){
    var p = m.part || {};
    var h = m.body ? '<div class="copbody">' + E(m.body) + '</div>' : '';
    /* §463: no "Understood / Working from" box. A stored answer from before
       may still carry one; it is not drawn — the reply says it in words. */
    if (p.missing && p.missing.length) h += '<div class="copmiss"><b>Missing</b><ul>' + p.missing.map(function(x){ return '<li>' + E(x) + '</li>'; }).join("") + '</ul></div>';
    if (p.draft && p.draft.groups) {
      h += '<div class="copdraft">' + (p.draft.title ? '<div class="copdt">' + E(p.draft.title) + '</div>' : '') +
        '<div class="copdg">' + p.draft.groups.map(function(g){
          return '<div class="copgrp"><div class="copgt">' + E(g.title) + '</div><ul>' +
            g.items.map(itemHtml).join("") + '</ul></div>';
        }).join("") + '</div></div>';
      /* SAVED TO THE RAIL (§464): a button under every draft, and once it is
         saved the line says which version it became and opens it. */
      if (p.saved && p.saved.deliverableId) {
        h += '<div class="copopts"><span class="copsaved">&#10003; Saved as v' + E(String(p.saved.n || 1)) + '</span>' +
          '<button type="button" class="copopt" data-cop-deliv="' + E(p.saved.deliverableId) + '">Open it</button></div>';
      } else if (canEdit() && PANE && PANE.chat && !PANE.chat.archived) {
        h += '<div class="copopts"><button type="button" class="copopt rec" data-cop-savedraft="' + E(m.id) + '">Save to ' + E(secLabel()) + ' deliverables</button></div>';
      }
    }
    if (p.assumptions && p.assumptions.length) h += '<div class="copassume"><b>Assumed</b> ' + p.assumptions.map(E).join(" · ") + '</div>';
    if (p.pastedOffer && !NOTNOW[p.pastedOffer.messageId] && canEdit()) {
      var sw = p.pastedOffer.section, lab = "";
      for (var i = 0; i < SECTIONS.length; i++) if (SECTIONS[i].k === sw) lab = SECTIONS[i].label;
      h += '<div class="copopts"><span class="copm">Keep the pasted material as its own deliverable?</span>' +
        '<button type="button" class="copopt rec" data-cop-savepasted="' + E(p.pastedOffer.messageId) + '" data-cop-sec="' + E(sw) + '">Save to ' + E(lab || sw) + '</button>' +
        '<button type="button" class="copopt" data-cop-notnow="' + E(p.pastedOffer.messageId) + '">Not now</button></div>';
    }
    if (p.options && p.options.length && last && canEdit()) {
      h += '<div class="copopts">' + p.options.map(function(o){
        return '<button type="button" class="copopt" data-cop-reply="' + E(o.label) + '">' + E(o.label) + '</button>';
      }).join("") + '</div>';
    }
    /* What part of the method this turn works through (§460): quiet, and
       only when the model named one. */
    if (p.following) h += '<div class="copfollow">Following: ' + E(p.following) + '</div>';
    return h;
  }
  function personHtml(m){
    var p = m.part || {}, body;
    if (p.pasted) {
      var first = String(m.body || "").replace(/\s+/g, " ").trim().slice(0, 80);
      body = '<details class="coppaste"><summary><span class="copsrc">Pasted</span> ' + E(first) + '… — ' + plural(p.words || 0, "word", "words") + '</summary>' +
        '<div class="copbody">' + E(m.body) + '</div></details>';
    } else body = m.body ? '<div class="copbody">' + E(m.body) + '</div>' : '';
    var files = (p.files || []).map(function(f){ return fileChip(f, false); }).join("");
    return body + (files ? '<div class="copfiles">' + files + '</div>' : '');
  }

  /* THE CHAT'S TEXT SIZE (§462, Islam 2026-10-02, design-mockups/copilot-font-size/):
     A− / A+ on the chat's title line, four steps, the conversation and the
     reply box only. A screen preference, so localStorage and never the state
     graph (§25, §47.1); a throwing or empty store reads as the normal size.
     The press changes the size IN PLACE and never repaints, or a half-typed
     message in the box would be rebuilt under the hand typing it (§35). */
  var ZOOMS = [0.9, 1, 1.15, 1.3], ZKEY = "smp.copilot.textsize";
  function zi(){
    var v = null; try { v = localStorage.getItem(ZKEY); } catch (e) {}
    var n = parseInt(v, 10);
    return n >= 0 && n < ZOOMS.length ? n : 1;
  }
  function sizeHtml(){
    var i = zi();
    return '<span class="copsize" role="group" aria-label="Chat text size">' +
      '<button type="button" class="copsz sm" data-cop-size="-1"' + (i === 0 ? ' disabled' : '') + ' title="Smaller text" aria-label="Smaller text">A&minus;</button>' +
      '<button type="button" class="copsz big" data-cop-size="1"' + (i === ZOOMS.length - 1 ? ' disabled' : '') + ' title="Larger text" aria-label="Larger text">A+</button></span>';
  }
  function setSize(step){
    var i = Math.max(0, Math.min(ZOOMS.length - 1, zi() + step));
    try { if (i === 1) localStorage.removeItem(ZKEY); else localStorage.setItem(ZKEY, String(i)); } catch (e) {}
    var box = document.querySelector("[data-cop-chatbox]");
    if (box) box.style.setProperty("--copz", String(ZOOMS[i]));
    var sm = document.querySelector('[data-cop-size="-1"]'), bg = document.querySelector('[data-cop-size="1"]');
    if (sm) sm.disabled = i === 0;
    if (bg) bg.disabled = i === ZOOMS.length - 1;
    fitBox();
  }
  window.__copSize = { steps: ZOOMS, index: function(){ return ZOOMS[zi()]; } };

  function chatHtml(){
    var c = PANE.chat;
    var head = '<h3 class="coph">' + E(c.title) + '</h3>' + (c.archived ? '<span class="copchip">Archived</span>' : '');
    var n = PANE.messages.length;
    var msgs = PANE.messages.map(function(m, i){
      if (m.who === "ai") {
        var product = !m.part || m.part.kind !== "answer";
        if (product) return '<div class="copmsg product"><div class="copbody">' + E(m.body) + '</div></div>';
        return '<div class="copmsg ai"><span class="copwho">Copilot</span>' + answerHtml(m, i === n - 1 && THINKING !== c.id) + '</div>';
      }
      return '<div class="copmsg me"><span class="copwho">' + E(nameOf(m.by)) + ' · ' + E(when(m.at)) + '</span>' + personHtml(m) + '</div>';
    }).join("") + (THINKING === c.id ? '<div class="copmsg product copworking" role="status"><div class="copbody"><span data-cop-wword>' + E(workWord()) + '</span><span class="copdots" aria-hidden="true"><i></i><i></i><i></i></span></div></div>' : '');
    var ctx = contextOf();
    var pend = canEdit() ? (PANE.pending || []).map(function(f){ return fileChip(f, true); }).join("") : "";
    return '<div class="copchat" data-cop-chatbox style="--copz:' + ZOOMS[zi()] + '">' +
      '<div class="copctx" title="' + E(ctx.detail || ctx.line) + '">' + INFO + '<span>' + E(ctx.line) + '</span></div>' +
      '<div class="copheadrow">' + head + sizeHtml() + '</div>' +
      (PANE.flow ? roadLine() : '') +
      '<div class="copmsgs" data-cop-msgs><div class="copzoom">' + (msgs || '<div class="copnone">Nothing said yet.</div>') + '</div></div>' +
      (pend ? '<div class="coppend" data-cop-pending>' + pend + '</div>' : '') +
      (!canEdit() ? VIEWONLY
        : c.archived
        ? '<div class="copsay copparked">This chat is archived. Restore it to keep talking. ' +
            '<button type="button" class="copbtn" data-cop-restore-chat="' + E(c.id) + '">Restore</button></div>'
        : composerHtml(c, !!pend)) +
      '</div>';
  }
  /* THE COMPOSER (§453, from the signed-off mockup): one box shaped like
     Claude's — one line to start, growing as you type to about ten lines and
     then scrolling inside itself — with Send as the return-arrow icon in its
     corner and the paperclip on the tight line beneath it. Enter sends and
     Shift+Enter makes a new line. */
  /* WHERE THE BOX WAS, FOR A VIEW GRANT (Islam: "keep the view only
     label"): a status rather than a description (1b-ii), so an empty space
     under the chat does not read as a box that failed to draw (§45.2). */
  /* What the box asks for: in the guided flow it says what a typed line
     will do there (§465). */
  function boxWord(pend){
    if (flowView()) {
      var ph = PANE.flow.phase;
      return ph === "ask" ? "Type your answer…" : ph === "draft" ? "Say what to change in this draft…"
        : ph === "loaded" ? "Pick a part on the left to work on it…" : "Use the buttons above to carry on…";
    }
    return pend ? "Say what this file is for…" : "Ask about " + placeWord() + "’s " + sectionWord().toLowerCase() + "…";
  }
  var VIEWONLY = '<div class="copviewonly" data-cop-viewonly><span>View only</span></div>';
  function composerHtml(c, pend){
    var text = DRAFT[c.id] || "";
    return '<div class="copcompose">' +
      '<div class="copbox">' +
        '<textarea data-cop-text rows="1" placeholder="' + E(boxWord(pend)) + '" aria-label="Message">' + E(text) + '</textarea>' +
        '<button type="button" class="copsend" data-cop-send aria-label="Send" title="Send"' + (THINKING === c.id || (!text.trim() && !pend) ? ' disabled' : '') + '>' + SENDMARK + '</button>' +
      '</div>' +
      '<div class="copunder">' + (flowView() ? '<span class="cophint">Enter sends · Shift + Enter for a new line</span></div></div>' :
        '<button type="button" class="copclip" data-cop-attach aria-label="Attach a Word, PDF or Excel file" title="Attach a Word, PDF or Excel file (up to 3 MB)">' + CLIP + '</button>' +
        '<input type="file" hidden data-cop-file accept=".docx,.pdf,.xlsx,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet">' +
        '<span class="cophint">Enter sends · Shift + Enter for a new line</span>' +
      '</div></div>');
  }


  /* ══ THE GUIDED FOUNDATION (§465, the signed-off
     design-mockups/copilot-foundation-flow/2026-10-02_working-flow.html,
     Option A) ═══════════════════════════════════════════════════════════
     Islam: "ok approved, build it". A Foundation chat can carry a FLOW: the
     years first, then the way to build it, then each part in order —
     each question with its examples, the answers back in boxes, a draft, a
     refine, save and on — then one check across all five and the whole saved
     as the next version of "Foundation — <place>".

     THE SCREEN IS DRAWN FROM THE STORED FLOW, never from a list of messages,
     so leaving and coming back lands exactly where you were, and the
     QUESTIONS are the ones the server sends with the chat — the ones the
     draft is written from (§53.5). Every press saves the flow at once; the
     server cuts it to shape (§96.2) and decides alone what was saved. */
  var NUDGE = null;              /* {id, text}: a short answer held for "Add more detail" / "Continue anyway" */
  /* No road is marked Recommended (§470, Islam 2026-10-02: "remove the
     label") — the four are offered as equals, as the quick replies are (§469). */
  var PATH_CARDS = [
    { k:"guided", t:"Answer guided questions", d:"I ask you a few questions and draft your Foundation from your answers.",
      i:'<path d="M21 12a8 8 0 0 1-11.6 7.1L4 20l1.1-4.6A8 8 0 1 1 21 12z"/><path d="M9 11h.01M12 11h.01M15 11h.01"/>' },
    { k:"notes", t:"Upload raw notes", d:"Upload interview notes or a workshop export and I turn them into a Foundation.",
      i:'<path d="M12 16V4M7 9l5-5 5 5"/><path d="M4 20h16"/>' },
    { k:"template", t:"Use a template", d:"Download an interview template, fill it in, and upload it back.",
      i:'<path d="M14 3H6v18h12V7z"/><path d="M14 3v4h4M9 13h6M9 17h6"/>' },
    { k:"import", t:"Import a finished Foundation", d:"Already have one? Paste it and I structure it into the 5 elements.",
      i:'<path d="M12 4v12M7 11l5 5 5-5"/><path d="M4 20h16"/>' }
  ];
  function pathWord(k){ for (var i = 0; i < PATH_CARDS.length; i++) if (PATH_CARDS[i].k === k) return PATH_CARDS[i].t; return k; }
  function icon(paths){ return '<svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">' + paths + '</svg>'; }
  var TOGMARK = '<svg viewBox="0 0 16 16" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.4"><rect x="1.5" y="2.5" width="13" height="11" rx="2"/><path d="M6 2.5v11"/></svg>';
  function flowOn(){ return !!(PANE && PANE.chat && PANE.flow); }
  /* The flow's own screen while it is the guided road or no road is chosen
     yet; the other three roads go on as an ordinary chat (§465). */
  function flowView(){ return flowOn() && (PANE.flow.path === "guided" || !PANE.flow.path); }
  function steps(){ return (PANE && PANE.flowSteps) || []; }
  function withY(s, f){ return String(s).replace(/\{Y\}/g, f.y1 == null ? "the strategy" : String(f.y1)); }
  function fname(){ return "Foundation — " + placeWord(); }
  function doneCount(f){ return f.done.filter(Boolean).length; }
  function yearsWord(f){ return f.y0 + " to the end of " + f.y1 + " (" + (f.y1 - f.y0 + 1) + (f.y1 - f.y0 + 1 === 1 ? " year)" : " years)"); }
  function aiMsg(html, wide){ return '<div class="copmsg ai' + (wide ? " copwide" : "") + '"><span class="copwho">Copilot</span><div class="copbody">' + html + '</div></div>'; }
  function meMsg(text){ return '<div class="copmsg me"><span class="copwho">' + E(nameOf(PANE.chat.by)) + '</span><div class="copbody">' + E(text) + '</div></div>'; }
  function examplesHtml(ex, f){
    if (!ex || !ex.length) return '';
    return '<div class="copexs"><div class="copeh">Examples to inspire you</div>' +
      ex.map(function(x){ return '<p>• ' + E(withY(x, f)) + '</p>'; }).join("") + '</div>';
  }
  /* WHAT THE PLAN ALREADY SAYS, PART BY PART (§473), read off the place
     the way its own Foundation page draws it — a unit's fields, the group's
     own GROUP — keyed by the flow's element keys. Hidden objectives are left
     out, as they are everywhere they are counted. */
  function planParts(){
    var t = place(), o = null;
    if (t === "group" && typeof GROUP !== "undefined") o = GROUP;
    else { try { o = typeof unitLike === "function" ? unitLike(t) : null; } catch (e) { o = null; } }
    o = o || {};
    var hid = function(r){ return SMPRules.isHidden && SMPRules.isHidden(r); };
    return {
      who: (o.clauses || []).filter(function(c){ return c && clean(c[1]); })
        .map(function(c){ return (clean(c[0]) ? clean(c[0]) + " " : "") + clean(c[1]); }).join("\n"),
      asp: clean(o.aspiration), eim: clean(o.endInMind), pur: clean(o.mission),
      obj: (o.keyObjectives || []).filter(function(k){ return k && !hid(k) && clean(k.name); })
        .map(function(k){ return clean(k.name); }).join("\n"),
      val: (o.values || []).filter(function(v){ return v && clean(v.name); })
        .map(function(v){ return clean(v.name) + (clean(v.def) ? " — " + clean(v.def) : ""); }).join("\n")
    };
  }
  function planHas(p){ for (var k in p) if (p[k]) return true; return false; }
  function optional(i){ var el = steps()[i]; return !!(el && el.optional); }
  function agreedAll(f){ return steps().every(function(el, i){ return f.done[i] || (el.optional && !String(f.drafts[i] || "").trim()); }); }
  /* A part's text on its card: one line reads as a sentence, several as a
     list, and a long list stops at four with how many more (the mockup). */
  function cardBody(text){
    var lines = String(text).split("\n").map(function(x){ return x.replace(/^\s*(?:[-•]|\d+[.)])\s*/, "").trim(); }).filter(Boolean);
    if (lines.length < 2) return '<p>' + E(lines[0] || "") + '</p>';
    var cut = lines.length > 4 ? 3 : lines.length;
    return '<ul>' + lines.slice(0, cut).map(function(l){ return '<li>' + E(l) + '</li>'; }).join("") +
      (lines.length > cut ? '<li class="copmore">…' + (lines.length - cut) + ' more lines</li>' : '') + '</ul>';
  }
  var CARDSHUT = {};             /* chat id → the cards closed with × (this visit only) */
  function cardsHtml(f){
    var S = steps(), plan = f.start === "plan", ed = canEdit() && !PANE.chat.archived && THINKING !== PANE.chat.id;
    var pick = plan && ed && f.phase !== "check" && f.phase !== "saved";
    return '<div class="copcards">' + S.map(function(el, i){
      var st, cls = "copst", txt = String(f.drafts[i] || "").trim(), empty = false;
      var now = i === f.e && (f.phase === "ask" || f.phase === "review" || f.phase === "draft");
      if (now && f.phase === "ask") { st = "Answering " + (f.qi + 1) + "/" + el.questions.length; cls += " now"; }
      else if (now && f.phase === "review") { st = "Reviewing"; cls += " now"; }
      else if (now) { st = "Drafting"; cls += " now"; }
      else if (f.done[i] && txt) { if (f.from[i]) { st = "From the plan"; cls += " plan"; } else { st = "Done"; cls += " done"; } }
      else if (txt) { st = "In progress"; }
      else { empty = true; st = el.optional ? (f.done[i] || plan ? "Optional · empty" : "Optional") : "Empty"; if (el.optional) cls += " opt"; }
      var body = txt && (!now || f.phase === "draft") ? cardBody(withY(txt, f))
        : '<p>' + (now ? E(el.questions.length + " questions") : plan || f.done[i] ? "Nothing saved yet." : "Not started.") + '</p>';
      var wide = el.key === "who" || el.key === "asp";
      var head = '<h3><span>' + E(el.name) + '</span><span class="' + cls + '">' + E(st) + '</span></h3>';
      var c = 'copcard' + (wide ? " wide" : "") + (now ? " now" : "") + (empty && !now ? " empty" : "");
      return pick
        ? '<button type="button" class="' + c + ' pick" data-cop-card="' + i + '"' + (now ? ' aria-current="true"' : '') +
            ' aria-label="Work on ' + E(el.name) + '">' + head + body + '</button>'
        : '<div class="' + c + '" data-cop-card="' + i + '">' + head + body + '</div>';
    }).join("") + '</div>';
  }
  function flowHead(f){
    var S = steps(), el = S[f.e] || {}, t, p = "";
    if (f.phase === "year" || f.phase === "path" || f.phase === "start" || f.phase === "loaded") t = "Copilot · Foundation";
    else if (f.phase === "check" || f.phase === "saved") t = "Copilot · Foundation · check";
    else {
      t = "Copilot · " + el.name;
      p = f.phase === "ask" ? "Question " + (f.qi + 1) + " of " + el.questions.length : f.phase === "review" ? "Review" : "Draft";
    }
    var total = 0, answered = 0;
    S.forEach(function(x, i){ total += x.questions.length; f.ans[i].forEach(function(a){ if (String(a).trim()) answered++; }); });
    var show = CARDSHUT[PANE.chat.id] ? '<button type="button" class="copbtn quiet" data-cop-cards="show">Show cards</button>' : '';
    return '<div class="copfhead"><b>' + E(t) + '</b>' + (p ? '<span class="copprog">' + E(p) + '</span>' : '') + show + sizeHtml() + '</div>' +
      '<div class="coptrack" role="progressbar" aria-label="Questions answered" aria-valuemin="0" aria-valuemax="' + total + '" aria-valuenow="' + answered + '"><i style="width:' + (total ? Math.round(answered / total * 100) : 0) + '%"></i></div>';
  }
  function flowMsgs(f){
    var S = steps(), out = [], ed = canEdit() && !PANE.chat.archived, busyHere = THINKING === PANE.chat.id;
    var plan = f.start === "plan";
    /* §473: where the place already HAS a Foundation the chat opens by
       asking whether to start from it; the answer stays on the page with
       the chosen button lit, as the mockup draws it. */
    if (f.phase === "start" || f.start) {
      var ch = function(k, w){
        return f.phase === "start" && ed ? '<button type="button" class="copbtn' + (k === "plan" ? " solid" : "") + '" data-cop-start="' + k + '">' + w + '</button>'
          : '<span class="copchoice' + (f.start === k ? " picked" : "") + '">' + w + '</span>'; };
      out.push(aiMsg(E(placeWord()) + " already has a Foundation. Do you want to start from what’s there, or start fresh?" +
        '<div class="copbtns">' + ch("plan", "Start from it") + ch("fresh", "Start fresh") + '</div>'));
      if (f.phase === "start") return out.join("");
    } else out.push(aiMsg("Hi — let's build " + E(placeWord()) + "’s Foundation. I'll ask a few short questions per part, show you what you said, draft it, and you refine and save each part."));
    if (plan) {
      out.push(aiMsg("I've loaded what " + E(placeWord()) + "’s Foundation says today into the cards. Pick a part to work on, or tell me what you want to change."));
      if (f.phase === "loaded" && ed && agreedAll(f))
        out.push(aiMsg("When the parts read as you want them, check them together and save the Foundation." +
          '<div class="copbtns"><button type="button" class="copbtn solid" data-cop-fcheck' + (busyHere ? ' disabled' : '') + '>Check the whole Foundation</button></div>'));
    } else {
      out.push(aiMsg("How would you like to build it?" + (f.phase === "path" && ed ? '<div class="coppaths">' + PATH_CARDS.map(function(c){
        return '<button type="button" class="coppcard" data-cop-path="' + c.k + '">' + icon(c.i) +
          '<span class="coppt">' + E(c.t) + '</span><span class="coppd">' + E(c.d) + '</span></button>';
      }).join("") + '</div>' : ''), true));
      if (f.phase === "path") return out.join("");
      out.push(meMsg(pathWord(f.path)));
      /* The years are the guided road's question, asked once the road is
         chosen (§473); a Foundation started from the plan never asks them. */
      out.push(aiMsg("How long does this strategy run, and which year does it end? Everything we build for " + E(placeWord()) + " will use that year." +
        (f.phase === "year" && ed ? '<div class="copyr"><label>Starts<input class="fld" data-cop-y0 inputmode="numeric" maxlength="4" value="' + E(f.y0 || new Date().getFullYear()) + '"></label>' +
          '<label>Ends at the end of<input class="fld" data-cop-y1 inputmode="numeric" maxlength="4" value="' + E(f.y1 || (new Date().getFullYear() + 2)) + '"></label>' +
          '<button type="button" class="copbtn solid" data-cop-setyears>Set the years</button></div>' : '')));
      if (f.phase === "year") return out.join("");
      out.push(meMsg(yearsWord(f)));
      out.push(aiMsg("Good. We'll build the parts in order, starting with <b>" + E(S[0].name) + "</b> (" + S[0].questions.length + " short questions)."));
    }
    var all = f.phase === "check" || f.phase === "saved";
    S.forEach(function(el, i){
      var current = !all && i === f.e;
      if (!current) {
        if (f.done[i] && !f.from[i]) out.push(aiMsg(E(el.name) + (String(f.drafts[i] || "").trim() ? " agreed" : " left empty") + " for " + E(fname()) + "."));
        return;
      }
      if (f.phase === "loaded") return;
      if (plan) out.push(aiMsg("Let's work on <b>" + E(el.name) + "</b>" + (el.optional ? " (optional — you can leave it empty)" : "") + "."));
      if (f.phase === "ask") {
        for (var k = 0; k < f.qi; k++) { out.push(aiMsg(E(withY(el.questions[k], f)))); out.push(meMsg(f.ans[i][k] || "(skipped)")); }
        out.push(aiMsg(E(withY(el.questions[f.qi], f))) + examplesHtml(el.examples[f.qi], f));
        if (el.optional && ed && !(NUDGE && NUDGE.id === PANE.chat.id))
          out.push('<div class="copbtns"><button type="button" class="copbtn quiet" data-cop-fskip>Leave ' + E(el.name) + ' empty</button></div>');
        if (NUDGE && NUDGE.id === PANE.chat.id) {
          out.push(meMsg(NUDGE.text));
          out.push('<div class="copwarn" role="status">That answer is quite short. A little more detail makes a better draft.' +
            '<div class="copbtns"><button type="button" class="copbtn" data-cop-nudge-more>Add more detail</button>' +
            '<button type="button" class="copbtn quiet" data-cop-nudge-go>Continue anyway</button></div></div>');
        }
      } else if (f.phase === "review") {
        out.push(aiMsg("Here is what you told me about " + E(el.name) + ". Change anything before I draft it." +
          '<div class="coprv">' + el.questions.map(function(q, k){
            return '<label>' + E(withY(q, f)) + '<textarea class="copfed" rows="2" data-cop-fans="' + k + '"' + (ed ? '' : ' readonly') + '>' + E(f.ans[i][k]) + '</textarea></label>';
          }).join("") + '</div>' +
          (ed ? '<div class="copbtns"><button type="button" class="copbtn solid" data-cop-fdraft' + (busyHere ? ' disabled' : '') + '>Draft ' + E(el.name) + '</button></div>' : ''), true));
      } else if (f.phase === "draft") {
        var nx = nextUndone(f, i);
        out.push(aiMsg('<span class="copeh">Draft · ' + E(el.name) + '</span><div class="copfdraft">' + E(withY(f.drafts[i], f)) + '</div>' +
          (ed ? 'Refine it, or type what to change in the box below.' +
            '<div class="copbtns"><button type="button" class="copbtn" data-cop-refine="concise"' + (busyHere ? ' disabled' : '') + '>Make concise</button>' +
            '<button type="button" class="copbtn" data-cop-refine="professional"' + (busyHere ? ' disabled' : '') + '>More professional</button>' +
            '<button type="button" class="copbtn" data-cop-refine="simple"' + (busyHere ? ' disabled' : '') + '>Simplify</button></div>' +
            '<div class="copbtns"><button type="button" class="copbtn solid" data-cop-fsave' + (busyHere ? ' disabled' : '') + '>' +
              (plan ? "Save this part" : nx < 0 ? "Save and check the whole foundation" : "Save and continue to " + E(S[nx].name)) + '</button></div>' : ''), true));
      }
    });
    if (all && f.check) {
      var byKey = {}; S.forEach(function(el, i){ byKey[el.key] = i; });
      var issues = f.check.issues || [], agree = f.check.agree || [];
      out.push(aiMsg('<span class="copeh">Consistency check across the parts</span>' +
        (agree.length ? '<ul class="copchk ok">' + agree.map(function(a){ return '<li>' + E(a) + '</li>'; }).join("") + '</ul>' : '') +
        (issues.length ? '<ul class="copchk issue">' + issues.map(function(x){ return '<li>' + E(x.text) + '</li>'; }).join("") + '</ul>' : '') +
        (ed && f.phase === "check" ? '<div class="copbtns">' + issues.filter(function(x){ return x.el in byKey; }).map(function(x){
            return '<button type="button" class="copbtn" data-cop-goback="' + byKey[x.el] + '">Go back to ' + E(S[byKey[x.el]].name) + '</button>'; }).join("") +
          '<button type="button" class="copbtn solid" data-cop-ffinish' + (busyHere ? ' disabled' : '') + '>Save as ' + E(fname()) + ' v' + E(PANE.nextVersion || 1) + '</button></div>' : ''), true));
    }
    if (f.phase === "saved" && f.saved) {
      out.push(aiMsg("Saved as " + E(f.saved.title) + " v" + E(f.saved.n) + ". It is on the left under Deliverables. Next time you run the flow it becomes v" + E(f.saved.n + 1) + "."));
    }
    if (busyHere) out.push('<div class="copmsg product copworking" role="status"><div class="copbody"><span data-cop-wword>' + E(workWord()) + '</span><span class="copdots" aria-hidden="true"><i></i><i></i><i></i></span></div></div>');
    return out.join("");
  }
  function nextUndone(f, from){
    var n = steps().length;
    for (var i = from + 1; i < n; i++) if (!f.done[i]) return i;
    for (var j = 0; j < from; j++) if (!f.done[j]) return j;
    return -1;
  }
  function flowHtml(){
    var c = PANE.chat, f = PANE.flow, S = steps();
    var vline = '<div class="copvline"><b>' + E(fname()) + ' v' + E(f.saved ? f.saved.n : (PANE.nextVersion || 1)) + '</b> · ' + (f.saved ? "saved" : "in progress") +
      ' · ' + doneCount(f) + ' of ' + S.length + ' done' + (f.y0 && f.y1 ? ' · ' + f.y0 + ' to the end of ' + f.y1 : '') + '</div>';
    var shut = !!CARDSHUT[c.id];
    return '<div class="copflow' + (shut ? " nocards" : "") + '">' +
      (shut ? '' : '<div class="copleft"><div class="copsh">' + vline +
        '<button type="button" class="copcx" data-cop-cards="hide" aria-label="Close the cards" title="Close the cards">×</button></div>' + cardsHtml(f) + '</div>') +
      '<div class="copchat copfchat" data-cop-chatbox style="--copz:' + ZOOMS[zi()] + '">' +
        flowHead(f) +
        '<div class="copmsgs" data-cop-msgs><div class="copzoom">' + flowMsgs(f) + '</div></div>' +
        (!canEdit() ? VIEWONLY
          : c.archived ? '<div class="copsay copparked">This chat is archived. Restore it to keep going. ' +
              '<button type="button" class="copbtn" data-cop-restore-chat="' + E(c.id) + '">Restore</button></div>'
          : composerHtml(c, false)) +
      '</div></div>';
  }
  /* The other three roads go on as an ordinary chat, told in one product
     line what to do next — and the guided road is one press away. */
  function roadLine(){
    var f = PANE.flow, w;
    if (f.path === "notes") w = "You chose to upload raw notes. Attach them with the paperclip below and say what they are, and the Copilot turns them into a Foundation.";
    else if (f.path === "template") w = "You chose a template. Download it from Copilot settings › Templates, fill it in, and attach it here.";
    else w = "You chose to import a finished Foundation. Paste it below and the Copilot structures it into its parts.";
    return '<div class="copsay copfroad">' + E(w) +
      (f.path === "template" ? ' <a class="linkbu" href="/' + E(slug()) + '/copilot/settings/templates">Open the templates</a>' : '') +
      (canEdit() && !PANE.chat.archived ? ' <button type="button" class="linkbu" data-cop-path="guided">Answer the guided questions instead</button>' : '') + '</div>';
  }

  /* SAVING THE FLOW. What the page shows changes at once and the server's
     answer replaces it; a refusal says so and reads the chat again. */
  function flowSave(f, then){
    if (!PANE || !PANE.chat) return;
    var id = PANE.chat.id;
    PANE.flow = f; draw();
    act({ act:"flowSave", id:id, flow:f }, function(j){
      if (PANE && PANE.chat && PANE.chat.id === id) PANE.flow = j.flow;
      draw(); if (then) then();
    });
  }
  function flowCopy(){ return JSON.parse(JSON.stringify(PANE.flow)); }
  function flowAsk(body){
    if (!PANE || !PANE.chat || THINKING) return;
    var id = PANE.chat.id, ctx = contextOf();
    THINKING = id; SAY = ""; THINK_AT = Date.now();
    if (!WORK_TIMER) WORK_TIMER = setInterval(workTick, 500);
    draw();
    body.id = id; body.placeWord = placeWord();
    body.context = ctx.line + (ctx.detail ? "\n" + ctx.detail : "") + (ctx.text ? "\n\nTHE PLAN AS WRITTEN:\n" + ctx.text : "");
    post(body, WAIT_MS).then(function(x){
      THINKING = null;
      if (x.st === 200 && x.j && x.j.ok) { if (PANE && PANE.chat && PANE.chat.id === id) PANE.flow = x.j.flow; draw(); return; }
      SAY = (x.j && x.j.why) || "That did not work. Nothing was lost — try again."; openItem("chat", id);
    }, function(err){
      THINKING = null;
      SAY = err && err.timedOut ? "This is taking too long, so the page stopped waiting. Open the chat again in a moment."
        : "The server could not be reached. Nothing was lost — try again.";
      openItem("chat", id);
    });
  }
  /* A TYPED LINE, by phase: an answer while asking (a short one is held for
     a second look), what to change while drafting, otherwise a pointer to
     the buttons — the flow is driven by them (§465). */
  function flowType(text, forced){
    var f = PANE.flow, id = PANE.chat.id;
    if (f.phase === "ask") {
      if (!forced && text.trim().length < (PANE.shortAnswer || 15)) { NUDGE = { id:id, text:text }; DRAFT[id] = ""; draw(); return; }
      NUDGE = null;
      var g = flowCopy(), n = steps()[g.e].questions.length;
      g.ans[g.e][g.qi] = text.trim();
      if (g.qi < n - 1) g.qi++; else g.phase = "review";
      DRAFT[id] = "";
      flowSave(g, function(){ var t = document.querySelector("[data-cop-text]"); if (t) t.focus(); });
      return;
    }
    if (f.phase === "draft") { DRAFT[id] = ""; flowAsk({ act:"flowRefine", el:f.e, how:text.trim(), flow:flowCopy() }); return; }
    SAY = f.phase === "loaded" ? "Press the part you want to change on the left, then say what to change." : "Noted. Use the buttons above to carry on."; draw();
  }
  function flowClick(ev){
    var b, f = PANE && PANE.flow;
    if (!flowOn()) return false;
    if ((b = hit(ev, "[data-cop-setyears]"))) {
      var y0 = Number((document.querySelector("[data-cop-y0]") || {}).value), y1 = Number((document.querySelector("[data-cop-y1]") || {}).value);
      if (!(Number.isInteger(y0) && y0 >= 2000 && y0 <= 2100 && Number.isInteger(y1) && y1 >= 2000 && y1 <= 2100)) { SAY = "Type each year as four digits."; draw(); return true; }
      if (y1 < y0) { SAY = "The end year has to be the same as or after the start year."; draw(); return true; }
      var g = flowCopy(); g.y0 = y0; g.y1 = y1; g.phase = "ask"; g.e = 0; g.qi = 0; SAY = "";
      flowSave(g, function(){ var t = document.querySelector("[data-cop-text]"); if (t) t.focus(); }); return true;
    }
    if ((b = hit(ev, "[data-cop-path]"))) {
      var g2 = flowCopy(); g2.path = b.getAttribute("data-cop-path");
      if (g2.path === "guided") { g2.phase = g2.y0 && g2.y1 ? "ask" : "year"; g2.e = 0; g2.qi = 0; } else g2.phase = "path";
      flowSave(g2, function(){ var t = document.querySelector("[data-cop-text]"); if (t) t.focus(); }); return true;
    }
    if ((b = hit(ev, "[data-cop-start]"))) {
      /* START FROM IT fills the cards from the plan, each part already
         agreed and marked as the plan's; START FRESH goes to the roads. */
      var gs = flowCopy(), how = b.getAttribute("data-cop-start");
      gs.start = how;
      if (how === "plan") {
        var pp = planParts();
        steps().forEach(function(el, i){ var t = pp[el.key] || ""; gs.drafts[i] = t; gs.from[i] = gs.done[i] = !!t; });
        gs.path = "guided"; gs.phase = "loaded";
      } else gs.phase = "path";
      flowSave(gs); return true;
    }
    if ((b = hit(ev, "[data-cop-cards]"))) {
      if (b.getAttribute("data-cop-cards") === "hide") CARDSHUT[PANE.chat.id] = true; else delete CARDSHUT[PANE.chat.id];
      draw(); return true;
    }
    if ((b = hit(ev, "button[data-cop-card]"))) {
      var gc = flowCopy(), ci = Number(b.getAttribute("data-cop-card"));
      gc.e = ci; gc.qi = 0; gc.done[ci] = false; NUDGE = null;
      gc.phase = String(gc.drafts[ci] || "").trim() ? "draft" : "ask";
      flowSave(gc, function(){ var t = document.querySelector("[data-cop-text]"); if (t) t.focus(); }); return true;
    }
    if ((b = hit(ev, "[data-cop-fskip]"))) {
      var gk = flowCopy(); gk.drafts[gk.e] = ""; gk.done[gk.e] = true; NUDGE = null;
      if (gk.start === "plan") { gk.phase = "loaded"; flowSave(gk); return true; }
      var nk = nextUndone(gk, gk.e);
      if (nk < 0) { flowAsk({ act:"flowCheck", flow:gk }); return true; }
      gk.e = nk; gk.qi = 0; gk.phase = gk.drafts[nk] ? "draft" : "ask"; flowSave(gk); return true;
    }
    if ((b = hit(ev, "[data-cop-fcheck]"))) { if (!b.disabled) flowAsk({ act:"flowCheck", flow:flowCopy() }); return true; }
    if ((b = hit(ev, "[data-cop-nudge-more]"))) {
      if (NUDGE) DRAFT[PANE.chat.id] = NUDGE.text.replace(/\s+$/, "") + ", ";
      NUDGE = null; draw();
      var t = document.querySelector("[data-cop-text]"); if (t) { t.focus(); t.selectionStart = t.selectionEnd = t.value.length; }
      return true;
    }
    if ((b = hit(ev, "[data-cop-nudge-go]"))) { if (NUDGE) flowType(NUDGE.text, true); return true; }
    if ((b = hit(ev, "[data-cop-fdraft]"))) { if (!b.disabled) flowAsk({ act:"flowDraft", el:f.e, flow:flowCopy() }); return true; }
    if ((b = hit(ev, "[data-cop-refine]"))) { if (!b.disabled) flowAsk({ act:"flowRefine", el:f.e, how:b.getAttribute("data-cop-refine"), flow:flowCopy() }); return true; }
    if ((b = hit(ev, "[data-cop-fsave]"))) {
      if (b.disabled) return true;
      var g3 = flowCopy(); g3.done[g3.e] = true;
      if (g3.start === "plan") { g3.phase = "loaded"; flowSave(g3); return true; }
      var nx = nextUndone(g3, g3.e);
      if (nx < 0) { flowAsk({ act:"flowCheck", flow:g3 }); return true; }
      g3.e = nx; g3.qi = 0; g3.phase = g3.drafts[nx] ? "draft" : "ask";
      flowSave(g3); return true;
    }
    if ((b = hit(ev, "[data-cop-goback]"))) {
      var g4 = flowCopy(), x = Number(b.getAttribute("data-cop-goback"));
      g4.done[x] = false; g4.e = x; g4.phase = "draft"; flowSave(g4); return true;
    }
    if ((b = hit(ev, "[data-cop-ffinish]"))) {
      if (b.disabled) return true;
      var cid = PANE.chat.id;
      act({ act:"flowFinish", id:cid, placeWord:placeWord() }, function(j){
        if (PANE && PANE.chat && PANE.chat.id === cid) { PANE.flow = j.flow; PANE.nextVersion = (j.saved && j.saved.n + 1) || PANE.nextVersion; }
        loadList(true); draw(); });
      return true;
    }
    return false;
  }
  /* THE RAILS FOLD AWAY (§465, Islam: "a button to hide and show the left
     rail"), remembered on this browser only — a per-viewer convenience. */
  var RAILKEY = "smp.copilot.rail";
  function railShut(){ try { return localStorage.getItem(RAILKEY) === "shut"; } catch (e) { return false; } }
  function setRail(shut){
    try { if (shut) localStorage.setItem(RAILKEY, "shut"); else localStorage.removeItem(RAILKEY); } catch (e) {}
    var p = document.querySelector("[data-cop-pane]"); if (p) p.classList.toggle("copshut", shut);
    document.querySelectorAll("[data-cop-railtog]").forEach(function(t){ t.setAttribute("aria-expanded", String(!shut)); });
    fitBox();
  }

  function delivHtml(){
    var d = PANE.deliverable, vs = PANE.versions, cur = vs[0];
    var text = cur && cur.body && typeof cur.body.text === "string" ? cur.body.text : "";
    var editing = EDIT && EDIT.id === d.id && canEdit();
    var body = editing
      ? '<textarea class="fld copedit" data-cop-edit-text rows="12" aria-label="Deliverable text">' + E(EDIT.text) + '</textarea>' +
        '<input class="fld" data-cop-edit-note placeholder="What changed (optional)" aria-label="What changed" value="' + E(EDIT.note) + '">' +
        '<div class="copbtns"><button type="button" class="copsend" data-cop-edit-save>Save as v' + ((cur ? cur.n : 0) + 1) + '</button>' +
        '<button type="button" class="copbtn quiet" data-cop-edit-cancel>Cancel</button></div>'
      : '<div class="copdoc">' + (text ? E(text) : '<span class="copnone">This version holds no text.</span>') + '</div>';
    var hist = vs.map(function(v, i){
      return '<li class="copver' + (i === 0 ? " latest" : "") + '"><span class="copvn">v' + v.n + '</span>' +
        '<span class="copvnote">' + E(v.note || (v.restoredFrom ? "Restored from v" + v.restoredFrom : "")) + '</span>' +
        '<span class="copm">' + E(nameOf(v.by)) + ' · ' + E(when(v.at)) + '</span>' +
        (i === 0 ? '<span class="copchip">Latest</span>'
          : canEdit() ? '<button type="button" class="copbtn quiet" data-cop-restore="' + v.n + '">Restore</button>' : '') + '</li>';
    }).join("");
    return '<div class="copdeliv">' +
      '<div class="copheadrow"><h3 class="coph">' + E(d.title) + '</h3>' +
        '<span class="copchip">' + kindWord(d.kind) + '</span>' +
        (editing || !canEdit() ? '' : '<button type="button" class="copbtn quiet" data-cop-edit>Edit</button>') + '</div>' +
      '<div class="copm">Made by ' + E(nameOf(d.by)) + ' · ' + E(when(d.at)) + '</div>' +
      body +
      '<h4 class="copvh">Versions</h4><ol class="copvers">' + hist + '</ol>' +
    '</div>';
  }

  /* ── WRITING INTO OUR OWN NODES ─────────────────────────────────────────
     The rails and the main pane are rewritten; the composer's text is read
     into DRAFT first, so an answer landing while somebody types keeps what
     they typed (§35). */
  function keepDraft(){
    var t = document.querySelector("[data-cop-text]");
    if (t && PANE && PANE.chat) DRAFT[PANE.chat.id] = t.value;
  }
  function draw(){
    keepDraft();
    var a = document.querySelector("[data-cop-chats]"); if (a) a.innerHTML = chatsHtml();
    var ah = document.querySelector("[data-cop-chatshead]"); if (ah) ah.innerHTML = chatsHead();
    var af = document.querySelector("[data-cop-chatsfoot]"); if (af) af.innerHTML = chatsFoot();
    var b = document.querySelector("[data-cop-delivs]"); if (b) b.innerHTML = delivsHtml();
    var m = document.querySelector("[data-cop-main]"); if (m) m.innerHTML = mainHtml();
    var msgs = document.querySelector("[data-cop-msgs]"); if (msgs) msgs.scrollTop = msgs.scrollHeight;
    fitPane(); fitBox();
    var r = document.querySelector("[data-cop-rename-box]"); if (r && document.activeElement !== r) { r.focus(); r.select(); }
  }
  /* THE PANE FILLS THE WINDOW (§453): it ends at the bottom of the screen,
     measured from its DOCUMENT offset rather than its place on screen, which
     moves with every scroll — the Platform Inbox's own answer (§100.5), with
     no loop, since nothing above the pane moves when the pane changes height. */
  function fitPane(){
    var p = document.querySelector("[data-cop-pane]"); if (!p) return;
    var top = p.getBoundingClientRect().top + (window.pageYOffset || 0);
    if (top > 0) p.style.setProperty("--cop-top", Math.round(top) + "px");
  }
  /* THE BOX GROWS WITH WHAT IS TYPED. It never sizes below one line: a page
     drawn before it is visible measures 0, and a box sized to that is
     squashed until somebody types (found in the mockup, §453) — so the floor
     is in the CSS as well as here, and it sizes again once it is shown. */
  var BOX_MIN = 48, BOX_MAX = 210;
  function fitBox(){
    var t = document.querySelector("[data-cop-text]"); if (!t) return;
    t.style.height = BOX_MIN + "px";
    var sh = t.scrollHeight;
    t.style.height = Math.max(BOX_MIN, Math.min(sh || BOX_MIN, BOX_MAX)) + "px";
    t.style.overflowY = sh > BOX_MAX ? "auto" : "hidden";
    var b = document.querySelector("[data-cop-send]");
    if (b) b.disabled = !!THINKING || (!t.value.trim() && !(PANE && PANE.pending && PANE.pending.length));
  }
  window.addEventListener("resize", function(){ fitPane(); fitBox(); });

  /* ── THE ASKS ──────────────────────────────────────────────────────── */
  function loadList(force){
    if (!shown()) return;
    var k = key(), p = place(), s = section();
    if (!force && LISTS[k] && !LISTS[k].failed) { draw(); openIfNeeded(); return; }
    askedFor = k;
    getJ("list", ["place=" + encodeURIComponent(p), "section=" + encodeURIComponent(s)]).then(function(x){
      if (x.st === 200 && x.j && x.j.ok) LISTS[k] = { chats: x.j.chats || [], archived: x.j.archived || [], mayDelete: !!x.j.mayDelete, deliverables: x.j.deliverables || [] };
      else LISTS[k] = { failed: true };
      if (DEEP && !LISTS[k].failed) {
        var pool = DEEP.kind === "chat" ? LISTS[k].chats.concat(LISTS[k].archived) : LISTS[k].deliverables;
        if (pool.some(function(r){ return r && String(r.id).toLowerCase() === DEEP.id; })) { OPEN[k] = { kind: DEEP.kind, id: DEEP.id }; DEEP = null; }
      }
      if (askedFor === k) { draw(); openIfNeeded(); }
    }, function(){ LISTS[k] = { failed: true }; if (askedFor === k) draw(); });
  }
  function openIfNeeded(){
    var o = OPEN[key()];
    if (o && (!PANE || PANE.id !== o.id)) openItem(o.kind, o.id);
  }
  function openItem(kind, id){
    OPEN[key()] = { kind: kind, id: id }; EDIT = null;
    if (!PANE || PANE.id !== id) PANE = null;
    draw();
    var k = key();
    getJ(kind === "chat" ? "chat" : "deliverable", ["id=" + encodeURIComponent(id)].concat(kind === "chat" ? ["placeWord=" + encodeURIComponent(placeWord())] : [])).then(function(x){
      var o = OPEN[k]; if (!o || o.id !== id) return;
      if (x.st === 200 && x.j && x.j.ok) PANE = Object.assign({ id: id }, x.j);
      else if (x.st === 404) { delete OPEN[k]; PANE = null; SAY = (x.j && x.j.why) || "That is not here any more."; loadList(true); return; }
      else PANE = { id: id, failed: true, why: x.j && x.j.why };
      draw();
    }, function(){ PANE = { id: id, failed: true }; draw(); });
  }
  function act(body, then){
    if (busy) return;
    busy = true; SAY = "";
    return post(body).then(function(x){
      busy = false;
      if (x.st === 200 && x.j && x.j.ok) { then(x.j); return; }
      SAY = (x.j && x.j.why) || "That did not save. Nothing was changed — try again."; draw();
    }, function(){ busy = false; SAY = "The server could not be reached. Nothing was changed — try again."; draw(); });
  }

  /* ── WIRING, DELEGATED ONCE (§29.5) ────────────────────────────────── */
  function hit(ev, sel){ return ev.target && ev.target.closest && ev.target.closest(sel); }
  document.addEventListener("input", function(ev){
    var t = hit(ev, "[data-cop-text]"); if (t && PANE && PANE.chat) { DRAFT[PANE.chat.id] = t.value; fitBox(); }
    var e = hit(ev, "[data-cop-edit-text]"); if (e && EDIT) EDIT.text = e.value;
    var fa = hit(ev, "[data-cop-fans]"); if (fa && flowOn()) PANE.flow.ans[PANE.flow.e][+fa.getAttribute("data-cop-fans")] = fa.value;
    var n = hit(ev, "[data-cop-edit-note]"); if (n && EDIT) EDIT.note = n.value;
  });
  /* An answer changed in its box is kept when the box is left, like every
     other field in the platform (§35) — not only when Draft is pressed. */
  document.addEventListener("change", function(ev){
    var fa = hit(ev, "[data-cop-fans]");
    if (fa && flowOn() && canEdit() && !THINKING) {
      var f = flowCopy(); f.ans[f.e][+fa.getAttribute("data-cop-fans")] = fa.value;
      var id = PANE.chat.id;
      act({ act:"flowSave", id:id, flow:f }, function(j){ if (PANE && PANE.chat && PANE.chat.id === id) PANE.flow = j.flow; });
    }
  });
  document.addEventListener("keydown", function(ev){
    if (ev.key === "Enter" && !ev.shiftKey && hit(ev, "[data-cop-text]")) { ev.preventDefault(); send(); }
    if (ev.key === "Enter" && hit(ev, "[data-cop-rename-box]")) { ev.preventDefault(); rename(); }
    if (ev.key === "Escape" && hit(ev, "[data-cop-rename-box]")) { RENAME = null; draw(); }
    if (ev.key === "Escape" && (MENU || ASKDEL)) { MENU = null; ASKDEL = null; draw(); }
  });
  /* SENDING. What was typed appears at once and the product says the
     Copilot is working, because a draft can take most of a minute and a box
     that sits still for that long reads as broken (§124). The server's own
     list replaces the page's guess when it lands. */
  function send(forced){
    if (!PANE || !PANE.chat || THINKING) return;
    var id = PANE.chat.id, t = document.querySelector("[data-cop-text]");
    var text = forced != null ? forced : (t ? t.value : (DRAFT[id] || ""));
    var files = (PANE.pending || []).slice();
    if (!text.trim() && !files.length) return;
    if (flowView()) { if (forced == null && t) t.value = ""; flowType(text); return; }
    var ctx = contextOf();
    if (forced == null) { DRAFT[id] = ""; if (t) t.value = ""; }
    PANE.messages = PANE.messages.concat([{ id:"new", who:"person", by: (typeof SYNC !== "undefined" && SYNC.actingAs && SYNC.actingAs()) || "",
      body:text, part:{ kind:"said", files:files }, at:new Date().toISOString() }]);
    PANE.pending = [];
    THINKING = id; SAY = ""; THINK_AT = Date.now();
    if (!WORK_TIMER) WORK_TIMER = setInterval(workTick, 500);
    draw();
    post({ act:"say", id:id, text:text, fileIds: files.map(function(f){ return f.id; }),
           context: ctx.line + (ctx.detail ? "\n" + ctx.detail : "") + (ctx.text ? "\n\nTHE PLAN AS WRITTEN:\n" + ctx.text : ""), placeWord: placeWord() }, WAIT_MS).then(function(x){
      THINKING = null;
      if (x.st === 200 && x.j && x.j.ok) {
        if (PANE && PANE.chat && PANE.chat.id === id) { PANE.messages = x.j.messages || PANE.messages; PANE.assumptions = x.j.assumptions || []; }
        loadList(true); draw(); return;
      }
      SAY = (x.j && x.j.why) || "That did not send. Nothing was lost — try again.";
      if (forced == null) DRAFT[id] = text;
      openItem("chat", id);
    }, function(err){
      THINKING = null;
      /* The page stopped waiting (§464). What was typed is already kept on
         the server, so it is not put back in the box — sending it again would
         say it twice; the chat is read again instead, and an answer that
         arrives later is there the next time it is opened. */
      if (err && err.timedOut) { SAY = "This is taking too long, so the page stopped waiting. If the answer arrives, it will be here when you open this chat again."; openItem("chat", id); return; }
      SAY = "The server could not be reached. What you typed is back in the box — try again.";
      if (forced == null) DRAFT[id] = text; openItem("chat", id);
    });
  }

  /* A FILE, read in the browser only as far as its size and name; the server
     decides whether it can be read at all and says so in words. */
  function attach(file){
    if (!file || !PANE || !PANE.chat) return;
    var id = PANE.chat.id;
    if (!/\.(docx|pdf|xlsx)$/i.test(file.name)) { SAY = "The Copilot reads Word (.docx), PDF and Excel (.xlsx) files. Save it as one of those and attach it again."; draw(); return; }
    if (file.size > MAX_FILE) { SAY = "That file is larger than 3 MB, so it was not attached. Split it, or paste the part that matters."; draw(); return; }
    var r = new FileReader();
    r.onload = function(){
      var data = String(r.result || "").replace(/^data:[^,]*,/, "");
      act({ act:"attach", id:id, name:file.name, type:file.type || "", data:data }, function(j){
        if (PANE && PANE.chat && PANE.chat.id === id) PANE.pending = j.pending || [];
        draw(); var t = document.querySelector("[data-cop-text]"); if (t) t.focus();
      });
    };
    r.onerror = function(){ SAY = "That file could not be read by the browser. Try again."; draw(); };
    r.readAsDataURL(file);
  }
  document.addEventListener("change", function(ev){
    var f = hit(ev, "[data-cop-file]"); if (!f) return;
    var file = f.files && f.files[0]; f.value = ""; attach(file);
  });
  /* Rename happens in the rail: Enter or leaving the box saves, Escape
     cancels, and an empty name keeps the old one rather than refusing. */
  function rename(){
    var b = document.querySelector("[data-cop-rename-box]"); if (!b || !RENAME) return;
    var id = RENAME, title = b.value.replace(/\s+/g, " ").trim();
    RENAME = null;
    if (!title) { draw(); return; }
    act({ act:"rename", id:id, title:title }, function(){
      if (PANE && PANE.chat && PANE.chat.id === id) PANE.chat.title = title;
      loadList(true); });
  }
  document.addEventListener("focusout", function(ev){
    if (hit(ev, "[data-cop-rename-box]") && RENAME) setTimeout(function(){
      var b = document.querySelector("[data-cop-rename-box]");
      if (b && b.isConnected && document.activeElement !== b) rename(); }, 0);
  });
  /* A press anywhere else shuts an open menu, on pointerdown (§100.4). */
  document.addEventListener("pointerdown", function(ev){
    if (MENU && !hit(ev, ".copmenu") && !hit(ev, "[data-cop-menu]")) { MENU = null; draw(); }
  }, true);
  document.addEventListener("click", function(ev){
    var b;
    if (flowClick(ev)) return;
    if ((b = hit(ev, "[data-cop-railtog]"))) { setRail(!railShut()); return; }
    if ((b = hit(ev, "[data-cop-retry]"))) { loadList(true); return; }
    if ((b = hit(ev, "[data-cop-reopen]"))) { var o = OPEN[key()]; if (o) openItem(o.kind, o.id); return; }
    if ((b = hit(ev, "[data-cop-chat]"))) { SAY = ""; MENU = null; openItem("chat", b.getAttribute("data-cop-chat")); return; }
    if ((b = hit(ev, "[data-cop-deliv]"))) { SAY = ""; openItem("deliv", b.getAttribute("data-cop-deliv")); return; }
    if ((b = hit(ev, "[data-cop-newchat]"))) {
      /* A NEW FOUNDATION CHAT IS A FLOW (§473, Islam: "remove the guided
         button"). It opens on "start from what is there, or fresh?" where
         the place already has a Foundation, and on the four roads where it
         has none — the page knows which, because it holds the plan. */
      if (section() === "foundation") {
        act({ act:"newFlow", place: place(), title: fname(), hasPlan: planHas(planParts()) }, function(j){
          var l = list(); if (l && l.chats) l.chats.unshift(j.chat);
          PANE = { id: j.chat.id, chat: j.chat, messages: [], flow: j.flow, flowSteps: null };
          OPEN[key()] = { kind:"chat", id: j.chat.id };
          openItem("chat", j.chat.id);
        });
        return;
      }
      act({ act:"newChat", place: place(), section: section() }, function(j){
        var l = list(); if (l && l.chats) l.chats.unshift(j.chat);
        PANE = { id: j.chat.id, chat: j.chat, messages: [] };
        OPEN[key()] = { kind:"chat", id: j.chat.id };
        draw(); var t = document.querySelector("[data-cop-text]"); if (t) t.focus();
      });
      return;
    }
    if ((b = hit(ev, "[data-cop-size]"))) { if (!b.disabled) setSize(+b.getAttribute("data-cop-size")); return; }
    if ((b = hit(ev, "[data-cop-send]"))) { send(); return; }
    if ((b = hit(ev, "[data-cop-reply]"))) { send(b.getAttribute("data-cop-reply")); return; }
    if ((b = hit(ev, "[data-cop-attach]"))) { var fi = document.querySelector("[data-cop-file]"); if (fi) fi.click(); return; }
    if ((b = hit(ev, "[data-cop-detach]"))) {
      if (!PANE || !PANE.chat) return;
      var cid = PANE.chat.id;
      act({ act:"detach", id:cid, fileId:b.getAttribute("data-cop-detach") }, function(j){
        if (PANE && PANE.chat && PANE.chat.id === cid) PANE.pending = j.pending || []; draw(); });
      return;
    }
    if ((b = hit(ev, "[data-cop-notnow]"))) { NOTNOW[b.getAttribute("data-cop-notnow")] = true; draw(); return; }
    if ((b = hit(ev, "[data-cop-savedraft]"))) {
      if (!PANE || !PANE.chat) return;
      var cid4 = PANE.chat.id;
      act({ act:"saveDraft", id:cid4, messageId:b.getAttribute("data-cop-savedraft") }, function(j){
        if (PANE && PANE.chat && PANE.chat.id === cid4 && j.messages) PANE.messages = j.messages;
        SAY = j.saved ? "Saved: " + j.saved.title + ", v" + j.saved.n + ". It is on the left under Deliverables." : "";
        LISTS[key()] = null; loadList(true); draw(); });
      return;
    }
    if ((b = hit(ev, "[data-cop-savepasted]"))) {
      if (!PANE || !PANE.chat) return;
      var sec = b.getAttribute("data-cop-sec"), mid = b.getAttribute("data-cop-savepasted"), lab = sec;
      for (var si = 0; si < SECTIONS.length; si++) if (SECTIONS[si].k === sec) lab = SECTIONS[si].label;
      act({ act:"savePasted", id:PANE.chat.id, messageId:mid, section:sec }, function(){
        NOTNOW[mid] = true; SAY = "Kept in " + lab + " as a Copilot-only deliverable.";
        LISTS[place() + "|" + sec] = null; loadList(true); });
      return;
    }
    if ((b = hit(ev, "[data-cop-menu]"))) { var mid2 = b.getAttribute("data-cop-menu"); MENU = MENU === mid2 ? null : mid2; ASKDEL = null; draw(); return; }
    if ((b = hit(ev, "[data-cop-archview]"))) { ARCH[key()] = !archView(); MENU = null; ASKDEL = null; RENAME = null; draw(); return; }
    if ((b = hit(ev, "[data-cop-rename]"))) { MENU = null; RENAME = b.getAttribute("data-cop-rename"); draw(); return; }
    if ((b = hit(ev, "[data-cop-archive]"))) {
      var aid = b.getAttribute("data-cop-archive"); MENU = null;
      act({ act:"archiveChat", id:aid }, function(){
        var o2 = OPEN[key()]; if (o2 && o2.id === aid) { delete OPEN[key()]; PANE = null; }
        SAY = "Archived. It is in Archived at the foot of the chats, and nothing in it is lost."; loadList(true); });
      return;
    }
    if ((b = hit(ev, "[data-cop-restore-chat]"))) {
      var rcid = b.getAttribute("data-cop-restore-chat"); MENU = null;
      act({ act:"restoreChat", id:rcid }, function(){
        SAY = "Restored to the chats."; ARCH[key()] = false;
        if (PANE && PANE.chat && PANE.chat.id === rcid) PANE.chat.archived = "";
        loadList(true); });
      return;
    }
    if ((b = hit(ev, "[data-cop-delete]"))) { MENU = null; ASKDEL = b.getAttribute("data-cop-delete"); draw(); return; }
    if ((b = hit(ev, "[data-cop-delete-no]"))) { ASKDEL = null; draw(); return; }
    if ((b = hit(ev, "[data-cop-delete-yes]"))) {
      var did0 = b.getAttribute("data-cop-delete-yes");
      act({ act:"deleteChat", id:did0 }, function(){
        ASKDEL = null; var o3 = OPEN[key()]; if (o3 && o3.id === did0) { delete OPEN[key()]; PANE = null; }
        delete DRAFT[did0]; SAY = "The chat was deleted."; loadList(true); });
      return;
    }
    if ((b = hit(ev, "[data-cop-edit]"))) {
      if (!PANE || !PANE.deliverable) return;
      var cur = PANE.versions[0];
      EDIT = { id: PANE.deliverable.id, text: cur && cur.body && typeof cur.body.text === "string" ? cur.body.text : "", note: "" };
      draw(); var e = document.querySelector("[data-cop-edit-text]"); if (e) e.focus(); return;
    }
    if ((b = hit(ev, "[data-cop-edit-cancel]"))) { EDIT = null; draw(); return; }
    if ((b = hit(ev, "[data-cop-edit-save]"))) {
      if (!EDIT) return;
      var did = EDIT.id;
      act({ act:"editVersion", id: did, text: EDIT.text, note: EDIT.note }, function(j){
        EDIT = null; SAY = "Saved as v" + j.n + "."; PANE = null; openItem("deliv", did); loadList(true); });
      return;
    }
    if ((b = hit(ev, "[data-cop-restore]"))) {
      if (!PANE || !PANE.deliverable) return;
      var rid = PANE.deliverable.id, from = Number(b.getAttribute("data-cop-restore"));
      act({ act:"restore", id: rid, from: from }, function(j){
        SAY = "v" + from + " restored as v" + j.n + ". Nothing in between was lost."; PANE = null; openItem("deliv", rid); loadList(true); });
      return;
    }
  });

  return { shown: shown, sections: sections, render: renderPane, grant: grant, canEdit: canEdit,
           /* for the checks */
           state: function(){ return { open: OPEN[key()] || null, list: list(), pane: PANE, say: SAY, thinking: THINKING }; },
           context: contextOf };
})();
