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
    { k:"compete",    label:"How we compete" },
    { k:"directions", label:"Directions" },
    { k:"capabilities", label:"Capabilities" },
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

  /* How we compete is a section only where the plan can hold one — the top
     layer and the business units (SMPRules.compOffered, §492), never a
     function or a company; the Structure switch hides the PLAN's section,
     not the chat that writes it. */
  function here(){
    var t = typeof TARGET !== "undefined" ? String(TARGET || "") : "";
    return SECTIONS.filter(function(s){
      if (s.k === "capabilities") return !dvCapsHere();
      if (s.k !== "compete") return true;
      try { return SMPRules.compOffered(t, SMPRules.COMPETE); } catch (e) { return false; }
    });
  }
  function sections(){
    if (!shown()) return [];
    return here().map(function(s){ return { k:s.k, ac:"c_kb", label:s.label, render:renderPane }; });
  }
  function place(){ return typeof TARGET !== "undefined" ? String(TARGET || "") : ""; }
  function section(){
    var s = (typeof CURSEC !== "undefined" && CURSEC.copilot) || "foundation";
    var hs = here();
    for (var i = 0; i < hs.length; i++) if (hs[i].k === s) return s;
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
  /* A question is waited for two minutes at most (§472): with no limit a
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
      '<aside class="coprails" data-cop-rails>' + railsInner() +
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
  /* §475 option A (Islam, 2 Oct: "A ok"): the hide control sits at the
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
          '<span class="copm">' + E(nameOf(c.by)) + ' · ' + E(when(c.last)) + (c.guided ? ' · Guided' : '') + (function(){ var sp = (l.swotProgress || {})[c.id]; return sp ? ' · ' + sp.done + ' of ' + sp.of + ' done' : ''; })() + '</span></button>' +
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
    return say + (o.kind === "chat" ? (swotOn() ? swotHtml() : competeOn() ? competeHtml() : advOn() ? advHtml() : dirsOn() ? dirsHtml() : execOn() ? execHtml() : flowView() ? flowHtml() : chatHtml()) : delivHtml());
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
  /* WHILE THE COPILOT WORKS (§472, Islam: "keep it one word"): one word that
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
    /* §471: no "Understood / Working from" box. A stored answer from before
       may still carry one; it is not drawn — the reply says it in words. */
    if (p.missing && p.missing.length) h += '<div class="copmiss"><b>Missing</b><ul>' + p.missing.map(function(x){ return '<li>' + E(x) + '</li>'; }).join("") + '</ul></div>';
    if (p.draft && p.draft.groups) {
      h += '<div class="copdraft">' + (p.draft.title ? '<div class="copdt">' + E(p.draft.title) + '</div>' : '') +
        '<div class="copdg">' + p.draft.groups.map(function(g){
          return '<div class="copgrp"><div class="copgt">' + E(g.title) + '</div><ul>' +
            g.items.map(itemHtml).join("") + '</ul></div>';
        }).join("") + '</div></div>';
      /* SAVED TO THE RAIL (§472): a button under every draft, and once it is
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

  /* THE CHAT'S TEXT SIZE (§470, Islam 2026-10-02, design-mockups/copilot-font-size/):
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
  /* No road is marked Recommended (§475, Islam 2026-10-02: "remove the
     label") — the four are offered as equals, as the quick replies are (§474). */
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
  function doneCount(f){ return f.done.filter(function(d, i){ return d && on(i); }).length; }
  function yearsWord(f){ return f.y0 + " to the end of " + f.y1 + " (" + (f.y1 - f.y0 + 1) + (f.y1 - f.y0 + 1 === 1 ? " year)" : " years)"); }
  function aiMsg(html, wide){ return '<div class="copmsg ai' + (wide ? " copwide" : "") + '"><span class="copwho">Copilot</span><div class="copbody">' + html + '</div></div>'; }
  function meMsg(text){ return '<div class="copmsg me"><span class="copwho">' + E(nameOf(PANE.chat.by)) + '</span><div class="copbody">' + E(text) + '</div></div>'; }
  function examplesHtml(ex, f){
    if (!ex || !ex.length) return '';
    return '<div class="copexs"><div class="copeh">Examples to inspire you</div>' +
      ex.map(function(x){ return '<p>• ' + E(withY(x, f)) + '</p>'; }).join("") + '</div>';
  }
  /* WHAT THE PLAN ALREADY SAYS, PART BY PART (§478), read off the place
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
  function planHas(p){ var off = skipNow(); for (var k in p) if (p[k] && off.indexOf(k) < 0) return true; return false; }
  /* §479 — THE CARDS FOLLOW THE STRUCTURE. Purpose and Core Values are
     asked only where Client set-up › Structure switches them on for this
     place's Foundation; off, they have no card and no question, whatever
     was written before. Nothing is "optional" any more: a part that is on
     is owed like the others. Read from the client's graph each time, and
     sent with every save so the server's "is everything agreed" asks the
     same list. */
  var SKIP_COMP = { pur: "purpose", val: "values" };
  function skipNow(){
    var out = [];
    for (var k in SKIP_COMP) {
      var on; try { on = typeof compOn === "function" ? compOn(place(), SKIP_COMP[k]) : true; } catch (e) { on = true; }
      if (!on) out.push(k);
    }
    return out;
  }
  function on(i){ var el = steps()[i]; return !!el && skipNow().indexOf(el.key) < 0; }
  function agreedAll(f){ return steps().every(function(el, i){ return !on(i) || (f.done[i] && !!String(f.drafts[i] || "").trim()); }); }
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
      if (!on(i)) return "";
      var st, cls = "copst", txt = String(f.drafts[i] || "").trim(), empty = false;
      var now = i === f.e && (f.phase === "ask" || f.phase === "review" || f.phase === "draft");
      if (now && f.phase === "ask") { st = "Answering " + (f.qi + 1) + "/" + el.questions.length; cls += " now"; }
      else if (now && f.phase === "review") { st = "Reviewing"; cls += " now"; }
      else if (now) { st = "Drafting"; cls += " now"; }
      else if (f.done[i] && txt) { if (f.from[i]) { st = "From the plan"; cls += " plan"; } else { st = "Done"; cls += " done"; } }
      else if (txt) { st = "In progress"; }
      else { empty = true; st = "Empty"; }
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
    S.forEach(function(x, i){ if (!on(i)) return; total += x.questions.length; f.ans[i].forEach(function(a){ if (String(a).trim()) answered++; }); });
    var show = CARDSHUT[PANE.chat.id] ? '<button type="button" class="copbtn quiet" data-cop-cards="show">Show cards</button>' : '';
    return '<div class="copfhead"><b>' + E(t) + '</b>' + (p ? '<span class="copprog">' + E(p) + '</span>' : '') + show + sizeHtml() + '</div>' +
      '<div class="coptrack" role="progressbar" aria-label="Questions answered" aria-valuemin="0" aria-valuemax="' + total + '" aria-valuenow="' + answered + '"><i style="width:' + (total ? Math.round(answered / total * 100) : 0) + '%"></i></div>';
  }
  function flowMsgs(f){
    var S = steps(), out = [], ed = canEdit() && !PANE.chat.archived, busyHere = THINKING === PANE.chat.id;
    var plan = f.start === "plan";
    /* §478: where the place already HAS a Foundation the chat opens by
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
         chosen (§478); a Foundation started from the plan never asks them. */
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
      if (!on(i)) return;
      var current = !all && i === f.e;
      if (!current) {
        if (f.done[i] && !f.from[i]) out.push(aiMsg(E(el.name) + (String(f.drafts[i] || "").trim() ? " agreed" : " left empty") + " for " + E(fname()) + "."));
        return;
      }
      if (f.phase === "loaded") return;
      if (plan) out.push(aiMsg("Let's work on <b>" + E(el.name) + "</b>" + "."));
      if (f.phase === "ask") {
        for (var k = 0; k < f.qi; k++) { out.push(aiMsg(E(withY(el.questions[k], f)))); out.push(meMsg(f.ans[i][k] || "(skipped)")); }
        out.push(aiMsg(E(withY(el.questions[f.qi], f))) + examplesHtml(el.examples[f.qi], f));
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
    for (var i = from + 1; i < n; i++) if (on(i) && !f.done[i]) return i;
    for (var j = 0; j < from; j++) if (on(j) && !f.done[j]) return j;
    return -1;
  }
  function flowHtml(){
    var c = PANE.chat, f = PANE.flow, S = steps();
    var vline = '<div class="copvline"><b>' + E(fname()) + ' v' + E(f.saved ? f.saved.n : (PANE.nextVersion || 1)) + '</b> · ' + (f.saved ? "saved" : "in progress") +
      ' · ' + doneCount(f) + ' of ' + S.filter(function(_, i){ return on(i); }).length + ' done' + (f.y0 && f.y1 ? ' · ' + f.y0 + ' to the end of ' + f.y1 : '') + '</div>';
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
      '</div>' + ftodoHtml(f) + '</div>';
  }
  /* THE FOUNDATION'S TO-DO (§490.2): the same compact list the SWOT chat
     carries, worked out from the flow as it stands — nothing is stored for it.
     Start, each part with its answers counted, then the check and the save. */
  function ftodoHtml(f){
    var S = steps(), li = function(name, state, cnt, part){
      var pill = state === "done" ? (part ? "Agreed" : "Done") : state === "now" ? (part ? "Answering" : "Now") : "To do";
      return '<li class="copsw-li ' + (state === "now" ? "wait on" : state) + '"><span class="copsw-dot" aria-hidden="true"></span>' +
        '<span class="copsw-lb"><span class="copsw-tt"><span>' + E(name) + '</span>' + (cnt || "") + '</span></span>' +
        '<span class="copsw-pill ' + (state === "now" ? "wait" : state) + '">' + pill + '</span></li>';
    };
    var started = !!f.start || (f.phase !== "start");
    var yearsOk = !!(f.y0 && f.y1), early = f.phase === "start" || f.phase === "path" || f.phase === "year" || f.phase === "loaded";
    var g1 = [li("Starting point", started ? "done" : "now"), li("Plan years" + (yearsOk ? " " + f.y0 + "–" + f.y1 : ""), yearsOk ? "done" : f.phase === "year" ? "now" : "todo")];
    var g2 = S.map(function(el, i){
      if (!on(i)) return "";
      var a = (f.ans[i] || []).filter(function(x){ return String(x).trim(); }).length, q = el.questions.length;
      var now = !early && i === f.e && (f.phase === "ask" || f.phase === "review" || f.phase === "draft");
      return li(el.name, f.done[i] ? "done" : now ? "now" : "todo", '<i>' + a + '/' + q + '</i>', true);
    }).join("");
    var g3 = [li("Consistency check", f.phase === "saved" ? "done" : f.phase === "check" ? "now" : "todo"),
              li("Save as Foundation", f.phase === "saved" || f.saved ? "done" : "todo")];
    var n = 2 + 2 + S.filter(function(_, i){ return on(i); }).length;
    var done = (started ? 1 : 0) + (yearsOk ? 1 : 0) + doneCount(f) + (f.phase === "saved" ? 2 : 0);
    return '<aside class="copftodo"><div class="copsw-box copsw-todo"><div class="copsw-todoh"><div class="copsw-bh"><b>To-do</b> <span class="copsw-n">' + done + '/' + n + '</span></div>' +
      '<div class="copsw-meter" role="progressbar" aria-valuemin="0" aria-valuemax="' + n + '" aria-valuenow="' + done + '"><i style="width:' + Math.round(done * 100 / n) + '%"></i></div></div>' +
      '<div class="copsw-tg"><div class="copsw-th">Start</div><ul>' + g1.join("") + '</ul></div>' +
      '<div class="copsw-tg"><div class="copsw-th">The parts</div><ul>' + g2 + '</ul></div>' +
      '<div class="copsw-tg"><div class="copsw-th">Then</div><ul>' + g3.join("") + '</ul></div></div></aside>';
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
  function flowCopy(){ var f = JSON.parse(JSON.stringify(PANE.flow)); f.skip = skipNow(); return f; }
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
      act({ act:"flowFinish", id:cid, placeWord:placeWord(), skip:skipNow() }, function(j){
        if (PANE && PANE.chat && PANE.chat.id === cid) { PANE.flow = j.flow; PANE.nextVersion = (j.saved && j.saved.n + 1) || PANE.nextVersion; }
        loadList(true); draw(); });
      return true;
    }
    return false;
  }
  /* THE RAILS FOLD AWAY (§465, Islam: "a button to hide and show the left
     rail"), remembered on this browser only — a per-viewer convenience. */
  var RAILKEY = "smp.copilot.rail", RAILKEPT = false;
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
    var rl = document.querySelector("[data-cop-rails]"); if (rl) rl.innerHTML = railsInner();
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

  /* ── THE SWOT FLOW (§490, Islam 4 Oct 2026, from the signed-off
     design-mockups/copilot-swot-flow/2026-10-04_v2.html) ──────────────
     A SWOT chat is a to-do list rather than a conversation: which areas
     (internal, micro, macro) and which methods each uses are ticked in a
     grid, and the list on the right is worked out by the SERVER from what
     is stored (lib/copilot-swot.ts), so a line cannot read done on one
     screen and open on another. The guided questions are the original
     Copilot's, word for word, asked one at a time — never invented.
     An answer written for the client is a SUGGESTION in the box and is
     stored only through the ordinary save, like anything typed (§35). */
  var SRC = {}, SRCASK = null, SWSEL = {}, SWHELP = {}, SWSUG = null, SWEDIT = null, SWPASTE = "", SWALL = false;
  var LETTERS = ["s", "w", "o", "t"], LETTER_WORD = { s: "Strengths", w: "Weaknesses", o: "Opportunities", t: "Threats" };
  function swotOn(){ return !!(PANE && PANE.chat && PANE.swot); }
  function swCopy(){ return JSON.parse(JSON.stringify(PANE.swot)); }
  function swView(j){ ["swot","swotTodo","swotDone","swotCover","swotGatherDone","swotQuestions","swotOffered","swotMethodWord","swotAreaWord","swotTemplateOf","swotNextVersion"]
    .forEach(function(k){ if (j && k in j) PANE[k] = j[k]; }); }
  function swSave(s, then){
    if (!swotOn()) return;
    var id = PANE.chat.id;
    PANE.swot = s; draw();
    act({ act:"swotSave", id:id, swot:s, placeWord:placeWord() }, function(j){
      if (PANE && PANE.chat && PANE.chat.id === id) swView(j);
      draw(); if (then) then();
      var l = list(); if (l && l.swotProgress && PANE && PANE.swotTodo) { l.swotProgress[id] = { done: PANE.swotDone, of: PANE.swotTodo.length }; draw(); }
    });
  }
  function swContext(){
    var ctx = contextOf();
    return ctx.line + (ctx.detail ? "\n" + ctx.detail : "") + (ctx.text ? "\n\nTHE PLAN AS WRITTEN:\n" + ctx.text : "");
  }
  function swAsk(body, then){
    if (!swotOn() || THINKING) return;
    var id = PANE.chat.id;
    THINKING = id; SAY = ""; THINK_AT = Date.now();
    if (!WORK_TIMER) WORK_TIMER = setInterval(workTick, 500);
    draw();
    body.id = id; body.placeWord = placeWord(); body.context = swContext();
    post(body, WAIT_MS).then(function(x){
      THINKING = null;
      if (x.st === 200 && x.j && x.j.ok) {
        if (PANE && PANE.chat && PANE.chat.id === id) { if (then) then(x.j); else swView(x.j); }
        draw(); return;
      }
      SAY = (x.j && x.j.why) || "That did not work. Nothing was lost — try again."; draw();
    }, function(err){
      THINKING = null;
      SAY = err && err.timedOut ? "This is taking too long, so the page stopped waiting. Try again in a moment."
        : "The server could not be reached. Nothing was lost — try again.";
      draw();
    });
  }
  /* The plan's own SWOT, read for "start from what is there". */
  function planSwot(){
    var t = place(), sw = null;
    try {
      if (t.indexOf("fn:") === 0 && typeof FUNCTIONS !== "undefined") sw = (FUNCTIONS[t.slice(3)] || {}).swot;
      else if (t === "group" && typeof GROUP !== "undefined") sw = GROUP.swot;
      else { var u = typeof unitLike === "function" ? unitLike(t) : null; sw = u && u.swot; }
    } catch (e) { sw = null; }
    var out = { s: [], w: [], o: [], t: [] };
    LETTERS.forEach(function(L){ out[L] = ((sw && sw[L]) || []).map(function(x){ return String(x || "").trim(); }).filter(Boolean); });
    return out;
  }
  function swTitle(){ return "SWOT — " + placeWord(); }
  /* ── the rail's Sources section ── */
  function srcList(){ return SRC[place()] || null; }
  function loadSources(force){
    if (section() !== "analysis" || !live()) return;
    var p = place();
    if (!force && SRC[p]) return;
    SRC[p] = SRC[p] || { asking: true };
    getJ("sources", ["place=" + encodeURIComponent(p)]).then(function(x){
      SRC[p] = x.st === 200 && x.j && x.j.ok ? { list: x.j.sources || [], words: x.j.words || {} } : { failed: true };
      draw();
    }, function(){ SRC[p] = { failed: true }; draw(); });
  }
  function srcWord(k){ var s = srcList(); return (s && s.words && s.words[k]) || k; }
  function sourcesHtml(){
    var s = srcList();
    if (!s || s.asking) return '<div class="copnone">Asking…</div>';
    if (s.failed) return '<div class="copnone">The sources could not be read just now. <button type="button" class="linkbu" data-cop-src-retry>Try again</button></div>';
    if (!s.list.length) return '<div class="copnone">No sources yet. Reports and answers brought into a SWOT are kept here.</div>';
    return s.list.map(function(r){
      if (SRCASK === r.id) return '<div class="coprow ask"><span class="copt">' + E(r.name) + '</span><span class="copaskrow">Delete? ' +
        '<button type="button" class="copbtn danger solid" data-cop-src-del-yes="' + E(r.id) + '">Delete</button>' +
        '<button type="button" class="copbtn quiet" data-cop-src-del-no>Cancel</button></span></div>';
      return '<div class="coprow copsrcrow" data-cop-src="' + E(r.id) + '">' +
        '<a class="copitem" href="' + E(url("source", ["id=" + encodeURIComponent(r.id)])) + '" target="_blank" rel="noopener">' +
          '<span class="copt">' + E(r.name) + '</span>' +
          '<span class="copm">' + E(srcWord(r.kind)) + ' · ' + (r.place === "all" ? "All units" : "This unit") + ' · ' + E(when(r.at)) + '</span></a>' +
        (canEdit() ? '<span class="copsrcacts"><button type="button" class="linkbu" data-cop-src-retag="' + E(r.id) + '" data-cop-to="' + (r.place === "all" ? E(place()) : "all") + '">' +
          (r.place === "all" ? "Only this unit" : "All units") + '</button>' +
          (r.mayDelete ? '<button type="button" class="xbtn" data-cop-src-del="' + E(r.id) + '" title="Delete this source" aria-label="Delete ' + E(r.name) + '">&times;</button>' : '') + '</span>' : '') +
      '</div>';
    }).join("");
  }
  /* ── the right column: the to-do list and the count per letter ── */
  function swLineKey(t){ return (t.area || "") + "|" + t.method; }
  function swSel(){
    var id = PANE.chat.id, todo = PANE.swotTodo || [], sel = SWSEL[id];
    var lines = todo.filter(function(t){ return t.area; });
    if (sel && lines.some(function(t){ return swLineKey(t) === sel; })) return sel;
    var open = lines.filter(function(t){ return t.state !== "done"; })[0] || lines[0];
    return open ? swLineKey(open) : "";
  }
  function swSideHtml(){
    var s = PANE.swot, todo = PANE.swotTodo || [], done = PANE.swotDone || 0, n = todo.length, cur = s.phase === "gather" ? swSel() : "";
    var groups = [], seen = {};
    todo.forEach(function(t){ var g = t.area || "_"; if (!seen[g]) { seen[g] = []; groups.push(g); } seen[g].push(t); });
    var body = groups.map(function(g){
      return '<div class="copsw-tg"><div class="copsw-th">' + (g === "_" ? "Then" : E((PANE.swotAreaWord || {})[g] || g)) + '</div><ul>' +
        seen[g].map(function(t){
          var on = swLineKey(t) === cur, pill = t.state === "done" ? "Done" : t.state === "wait" ? "Waiting" : "To do";
          /* Compact (§490.2): the line's "n of m" rides in its title as n/m; the
             status sentence stays on the hover rather than a second line. */
          var nm = /(\d+)\s+of\s+(\d+)/.exec(String(t.status || "")), cnt = nm ? '<i>' + nm[1] + '/' + nm[2] + '</i>' : '';
          var label = '<span class="copsw-tt" title="' + E(t.status || "") + '"><span>' + E(t.title) + '</span>' + cnt + '</span><span class="copsw-ts">' + E(t.status) + '</span>';
          return '<li class="copsw-li ' + t.state + (on ? " on" : "") + '"><span class="copsw-dot" aria-hidden="true"></span>' +
            (t.area && s.phase !== "saved" ? '<button type="button" class="copsw-lb" data-cop-sw-line="' + E(swLineKey(t)) + '"' + (on ? ' aria-current="true"' : '') + '>' + label + '</button>' : '<span class="copsw-lb">' + label + '</span>') +
            '<span class="copsw-pill ' + t.state + '">' + pill + '</span></li>';
        }).join("") + '</ul></div>';
    }).join("");
    var cov = PANE.swotCover || {};
    return '<aside class="copsw-side">' +
      '<div class="copsw-box copsw-todo"><div class="copsw-todoh"><div class="copsw-bh"><b>To-do</b> <span class="copsw-n">' + done + '/' + n + '</span>' +
        (s.phase !== "saved" && canEdit() ? '<button type="button" class="linkbu" data-cop-sw-go="methods">Change methods</button>' : '') + '</div>' +
        '<div class="copsw-meter" role="progressbar" aria-valuemin="0" aria-valuemax="' + n + '" aria-valuenow="' + done + '"><i style="width:' + (n ? Math.round(done * 100 / n) : 0) + '%"></i></div></div>' +
        body + '</div>' +
      '<div class="copsw-box"><div class="copsw-bh"><b>What we have so far</b> <span class="copsw-n">Per letter</span></div>' +
        '<div class="copsw-cov">' + LETTERS.map(function(L){
          var k = cov[L] || 0;
          return '<div class="copsw-ci' + (k ? "" : " none") + '"><b>' + E(LETTER_WORD[L]) + '</b><span>' + (k ? k + (k === 1 ? " source" : " sources") : "Nothing yet") + '</span></div>';
        }).join("") + '</div></div>' +
    '</aside>';
  }
  /* "Help me understand" (§490.2): the old Copilot's library, in the
     client's industry, where the question has an entry; its short line
     otherwise (the sixteen internal questions keep theirs). */
  function swHelpHtml(q){
    var m = q.more;
    if (!m) return '<div class="copsw-help">' + E(q.help) + '</div>';
    return '<div class="copsw-help copswhelp"><h4>In simpler terms</h4><p>' + E(m.simplerTerms) + '</p>' +
      '<h4>Think about</h4><ul>' + (m.thinkAbout || []).map(function(x){ return '<li>' + E(x) + '</li>'; }).join("") + '</ul>' +
      '<h4>Example answer</h4><p class="ex">' + E(m.exampleResponse) + '</p>' +
      '<p class="src">Written for ' + E(m.industry) + (m.industry === "Other" ? ' · no closer match for this client' : ' · the client\'s industry') + '</p></div>';
  }
  /* ── the main column, by phase ── */
  function swotHtml(){
    var s = PANE.swot, busyHere = THINKING === PANE.chat.id, ed = canEdit();
    var head = '<div class="copvline"><b>' + E(swTitle()) + ' v' + E(s.saved ? s.saved.n : (PANE.swotNextVersion || 1)) + '</b> · ' + (s.saved ? "saved" : "in progress") + '</div>';
    var work = busyHere ? '<div class="copmsg product copworking" role="status"><div class="copbody"><span data-cop-wword>' + E(workWord()) + '</span><span class="copdots" aria-hidden="true"><i></i><i></i><i></i></span></div></div>' : '';
    if (s.phase === "start") {
      var n = LETTERS.reduce(function(a, L){ return a + ((s.fromPlan || {})[L] || []).length; }, 0);
      return head + '<div class="copsw-card"><h3>This place already has a SWOT</h3>' +
        '<p>' + n + ' lines are on the plan today. Start from them, or start fresh?</p>' +
        (ed ? '<div class="copbtns"><button type="button" class="copbtn solid" data-cop-sw-start="plan">Start from it</button>' +
          '<button type="button" class="copbtn" data-cop-sw-start="fresh">Start fresh</button></div>' : '') + '</div>';
    }
    var main;
    if (s.phase === "methods") main = swMethodsHtml(s, ed);
    else if (s.phase === "gather") main = swGatherHtml(s, ed, busyHere);
    else if (s.phase === "analyses") main = swAnalysesHtml(s, ed, busyHere);
    else main = swDraftHtml(s, ed, busyHere);
    return head + '<div class="copsw">' + '<div class="copsw-main">' + main + work + '</div>' + swSideHtml() + '</div>';
  }
  function swMethodsHtml(s, ed){
    var off = PANE.swotOffered || {}, mw = PANE.swotMethodWord || {}, aw = PANE.swotAreaWord || {};
    var cols = ["guided", "template", "report", "research"], any = ["internal","micro","macro"].some(function(a){ return (s.methods[a] || []).length; });
    return '<div class="copsw-card"><h3>How will we gather it?</h3>' +
      '<p>Tick one or more methods for each area. An area with nothing ticked is left out.</p>' +
      '<div class="copsw-gridwrap"><table class="copsw-grid"><thead><tr><th></th>' + cols.map(function(m){ return '<th>' + E(mw[m] || m) + '</th>'; }).join("") + '</tr></thead><tbody>' +
      ["internal","micro","macro"].map(function(a){
        return '<tr><th scope="row">' + E(aw[a] || a) + '</th>' + cols.map(function(m){
          if ((off[a] || []).indexOf(m) < 0) return '<td class="na">—</td>';
          var on = (s.methods[a] || []).indexOf(m) >= 0;
          return '<td><button type="button" class="copsw-tick' + (on ? " on" : "") + '" data-cop-sw-m="' + a + '|' + m + '" aria-pressed="' + on + '"' + (ed ? '' : ' disabled') +
            ' aria-label="' + E((aw[a] || a) + " — " + (mw[m] || m)) + '">' + (on ? '&#10003;' : '') + '</button></td>';
        }).join("") + '</tr>';
      }).join("") + '</tbody></table></div>' +
      (ed ? '<div class="copbtns"><button type="button" class="copbtn solid" data-cop-sw-go="gather"' + (any ? '' : ' disabled') + '>Continue</button>' +
        (any ? '' : '<span class="copnote">Tick at least one method to carry on.</span>') + '</div>' : '') + '</div>';
  }
  function swGatherHtml(s, ed, busyHere){
    var sel = swSel(), area = sel.split("|")[0], method = sel.split("|")[1];
    var aw = PANE.swotAreaWord || {}, mw = PANE.swotMethodWord || {};
    var next = PANE.swotGatherDone
      ? '<div class="copsw-next"><b>Every line is done.</b> ' + (["micro","macro"].some(function(a){ return (s.methods[a] || []).length; })
          ? 'Next, the micro and macro analyses.' : 'Next, the SWOT itself.') +
        (ed ? ' <button type="button" class="copbtn solid" data-cop-sw-go="analyses">Carry on</button>' : '') + '</div>' : '';
    if (!area) return next;
    var head = '<div class="copsw-lh">' + E(aw[area] || area) + ' · ' + E(mw[method] || method) + '</div>';
    if (method === "guided") return next + head + swQuestionHtml(s, area, ed, busyHere);
    return next + head + swSourceLineHtml(s, area, method, ed, busyHere);
  }
  function swQuestionHtml(s, area, ed, busyHere){
    var qs = (PANE.swotQuestions || {})[area] || [];
    var i = s.q && s.q.area === area ? s.q.i : 0;
    if (!qs.length) return '';
    i = Math.max(0, Math.min(qs.length - 1, i));
    var q = qs[i], hk = PANE.chat.id + "|" + area + "|" + i, ans = (s.ans[area] || [])[i] || "";
    var sug = SWSUG && SWSUG.id === PANE.chat.id && SWSUG.area === area && SWSUG.i === i ? SWSUG : null;
    return '<div class="copsw-card copsw-q">' +
      '<div class="copsw-qn">Question ' + (i + 1) + ' of ' + qs.length + ' · ' + E(q.name) + '</div>' +
      '<p class="copsw-qt">' + E(q.question) + '</p>' +
      (SWHELP[hk] ? swHelpHtml(q) : '') +
      '<textarea class="fld copsw-ans" data-cop-sw-ans="' + area + '|' + i + '" rows="4" maxlength="2000" placeholder="Type the answer"' + (ed ? '' : ' disabled') + '>' + E(ans) + '</textarea>' +
      (sug && sug.used && sug.used.length ? '<div class="copsw-used">Used: ' + E(sug.used.join(" · ")) + '</div>' : sug ? '<div class="copsw-used">Written from the plan and what is attached here.</div>' : '') +
      '<div class="copbtns">' +
        '<button type="button" class="copbtn quiet" data-cop-sw-help="' + E(hk) + '">' + (SWHELP[hk] ? "Hide the help" : "Help me understand") + '</button>' +
        (ed ? '<button type="button" class="copbtn" data-cop-sw-answer="' + area + '|' + i + '"' + (busyHere ? ' disabled' : '') + '>Answer for me</button>' : '') +
        '<span class="copsw-sp"></span>' +
        (i > 0 ? '<button type="button" class="copbtn quiet" data-cop-sw-q="' + area + '|' + (i - 1) + '">Previous</button>' : '') +
        (i < qs.length - 1 ? '<button type="button" class="copbtn solid" data-cop-sw-q="' + area + '|' + (i + 1) + '">Next question</button>' : '') +
      '</div></div>';
  }
  function swSourceLineHtml(s, area, method, ed, busyHere){
    var linked = (s.links || []).filter(function(l){ return l.area === area && l.method === method; });
    var kind = method, sl = srcList(), ids = linked.map(function(l){ return l.sourceId; });
    var pick = sl && sl.list ? sl.list.filter(function(r){ return ids.indexOf(r.id) < 0 && r.kind === kind; }) : [];
    var intro = method === "template"
      ? 'Download the interview template, fill it in with the people concerned, and upload it here. <a class="linkbu" href="/' + E(slug()) + '/copilot/settings/templates" target="_blank" rel="noopener">Open the templates</a>'
      : method === "research"
        ? 'Download the research prompt, run it in a deep-research tool, then upload or paste the answer here.'
        : 'Upload a ready report, or pick one already kept for this client.';
    return '<div class="copsw-card">' +
      '<p>' + intro + '</p>' +
      (method === "research" && ed ? '<div class="copbtns"><button type="button" class="copbtn" data-cop-sw-prompt="' + area + '"' + (busyHere ? ' disabled' : '') + '>Download the research prompt (.txt)</button></div>' : '') +
      (linked.length ? '<ul class="copsw-links">' + linked.map(function(l){
        return '<li><span>' + E(l.name) + '</span>' + (ed ? '<button type="button" class="xbtn" data-cop-sw-unlink="' + E(l.sourceId) + '" title="Take it off this line" aria-label="Take ' + E(l.name) + ' off this line">&times;</button>' : '') + '</li>';
      }).join("") + '</ul>' : '') +
      (ed ? '<div class="copsw-add">' +
        '<label class="copsw-where">Keep it for <select class="fld" data-cop-sw-for><option value="unit"' + (SWALL ? '' : ' selected') + '>This unit</option><option value="all"' + (SWALL ? ' selected' : '') + '>All units</option></select></label>' +
        '<div class="copbtns"><button type="button" class="copbtn" data-cop-sw-upload>Upload a file</button>' +
          '<input type="file" hidden data-cop-sw-file accept=".docx,.pdf,.xlsx,.txt,.md"></div>' +
        (method !== "template" ? '<textarea class="fld" rows="4" data-cop-sw-paste placeholder="Or paste the text here">' + E(SWPASTE) + '</textarea>' +
          '<div class="copbtns"><button type="button" class="copbtn" data-cop-sw-keep>Keep the pasted text</button></div>' : '') +
        (pick.length ? '<div class="copsw-pick"><b>Or pick one already kept</b>' + pick.map(function(r){
          return '<button type="button" class="copbtn quiet" data-cop-sw-use="' + E(r.id) + '">' + E(r.name) + '</button>';
        }).join("") + '</div>' : '') +
      '</div>' : '') +
    '</div>';
  }
  function swAnalysisPage(s, area, ed, busyHere){
    var an = s[area], aw = PANE.swotAreaWord || {}, qs = (PANE.swotQuestions || {})[area] || [];
    var title = area === "micro" ? "Micro analysis — the five forces" : "Macro analysis — DESTEP";
    if (!an) return '<div class="copsw-card"><h3>' + E(title) + '</h3><p>Not written yet.</p>' +
      (ed ? '<div class="copbtns"><button type="button" class="copbtn solid" data-cop-sw-an="' + area + '"' + (busyHere ? ' disabled' : '') + '>Write the ' + E(area) + ' analysis</button></div>' : '') + '</div>';
    var editing = SWEDIT && SWEDIT.area === area, src = editing ? SWEDIT.data : an;
    return '<div class="copsw-card copsw-an"><h3>' + E(title) + (an.agreed ? ' <span class="copsw-pill done">Agreed</span>' : '') + '</h3>' +
      '<div class="copsw-forces">' + src.items.map(function(it, k){
        var q = qs.filter(function(x){ return x.key === it.key; })[0] || { name: it.key };
        return '<div class="copsw-force"><h4>' + E(q.name) + '</h4>' +
          (it.factors.length ? '<ul>' + it.factors.map(function(f, j){
            return editing
              ? '<li><input class="fld" data-cop-sw-fe="' + k + '|' + j + '|title" value="' + E(f.title) + '" aria-label="Title">' +
                '<textarea class="fld" rows="2" data-cop-sw-fe="' + k + '|' + j + '|description" aria-label="Description">' + E(f.description) + '</textarea></li>'
              : '<li><b>' + E(f.title) + '</b>' + (f.description ? '<span>' + E(f.description) + '</span>' : '') +
                (f.evidence ? '<span class="copsw-ev">' + E(f.evidence) + '</span>' : '') + '</li>';
          }).join("") + '</ul>' : '<p class="copnote">Nothing found here.</p>') +
          (it.from && !editing ? '<div class="copsw-used">Used: ' + E(it.from) + '</div>' : '') + '</div>';
      }).join("") + '</div>' +
      (ed ? '<div class="copbtns">' + (editing
        ? '<button type="button" class="copbtn solid" data-cop-sw-ansave="' + area + '">Save the changes</button><button type="button" class="copbtn quiet" data-cop-sw-anedit-no>Cancel</button>'
        : '<button type="button" class="copbtn" data-cop-sw-anedit="' + area + '">Edit</button>' +
          (an.agreed ? '' : '<button type="button" class="copbtn solid" data-cop-sw-agree="' + area + '">Looks right</button>') +
          '<button type="button" class="copbtn quiet" data-cop-sw-an="' + area + '"' + (busyHere ? ' disabled' : '') + '>Write it again</button>') + '</div>' : '') + '</div>';
  }
  function swExternal(s){ return ["micro","macro"].filter(function(a){ return (s.methods[a] || []).length; }); }
  function swAnalysesHtml(s, ed, busyHere){
    var ext = swExternal(s), agreed = ext.every(function(a){ return s[a] && s[a].agreed; });
    if (!PANE.swotGatherDone && ext.some(function(a){ return !s[a]; }))
      return '<div class="copsw-card"><p>Finish the lines of the to-do list first. ' + (ed ? '<button type="button" class="linkbu" data-cop-sw-go="gather">Back to the list</button>' : '') + '</p></div>';
    return ext.map(function(a){ return swAnalysisPage(s, a, ed, busyHere); }).join("") +
      (ed ? '<div class="copsw-next">' + (agreed ? '<b>' + (ext.length ? 'The analyses are agreed.' : 'Every line is done.') + '</b> ' : 'Agree each analysis to draft the SWOT. ') +
        '<button type="button" class="copbtn solid" data-cop-sw-draft' + (agreed && !busyHere ? '' : ' disabled') + '>Draft the SWOT</button>' +
        ' <button type="button" class="linkbu" data-cop-sw-go="gather">Back to the list</button></div>' : '');
  }
  function swDraftHtml(s, ed, busyHere){
    var d = s.draft;
    if (!d) return '<div class="copsw-card"><p>The SWOT is not drafted yet.</p>' + (ed ? '<div class="copbtns"><button type="button" class="copbtn solid" data-cop-sw-draft' + (busyHere ? ' disabled' : '') + '>Draft the SWOT</button></div>' : '') + '</div>';
    var grid = '<div class="copsw-swot">' + LETTERS.map(function(L){
      return '<section class="copsw-l ' + L + '"><h3>' + E(LETTER_WORD[L]) + ' <span class="copsw-n">' + d[L].length + (d[L].length === 1 ? ' item' : ' items') + '</span></h3><ol>' +
        d[L].map(function(it){ return '<li><b>' + E(it.title) + '</b>' + (it.description ? '<span>' + E(it.description) + '</span>' : '') +
          (it.evidence ? '<span class="copsw-ev">' + E(it.evidence) + '</span>' : '') + '</li>'; }).join("") + '</ol></section>';
    }).join("") + '</div>';
    var chk = s.check ? '<div class="copsw-card copsw-check"><h3>The check</h3>' +
      (s.check.agree.length ? '<ul class="ok">' + s.check.agree.map(function(x){ return '<li>' + E(x) + '</li>'; }).join("") + '</ul>' : '') +
      (s.check.issues.length ? '<ul class="bad">' + s.check.issues.map(function(x){ return '<li>' + (x.letter ? '<b>' + E(LETTER_WORD[x.letter] || x.letter) + ':</b> ' : '') + E(x.text) + '</li>'; }).join("") + '</ul>' : '') + '</div>' : '';
    if (s.phase === "saved") return grid + '<div class="copsw-next"><b>Saved as ' + E(s.saved.title) + ' v' + E(s.saved.n) + '</b>, and written into the plan’s SWOT. It is under Deliverables on the left.</div>';
    return grid + chk + (ed ? '<div class="copbtns copsw-end">' +
      (swExternal(s).length ? '<button type="button" class="copbtn quiet" data-cop-sw-go="analyses">Go back to the analyses</button>' : '') +
      '<button type="button" class="copbtn" data-cop-sw-draft' + (busyHere ? ' disabled' : '') + '>Draft it again</button>' +
      '<button type="button" class="copbtn" data-cop-sw-check' + (busyHere ? ' disabled' : '') + '>Check it</button>' +
      '<button type="button" class="copbtn solid" data-cop-sw-finish' + (busyHere ? ' disabled' : '') + '>Save to the plan’s SWOT</button></div>' : '');
  }
  /* SAVING WRITES THE PLAN TOO: the server keeps the deliverable; the
     plan's SWOT is the page's graph, so the titles are written here, into
     the same writable view the SWOT page's own Add writes (swotWritable),
     and the ordinary autosave carries them — the one deliberate paint()
     in this file, after a press rather than inside a fetch's tail. */
  function swWritePlan(d){
    var w = null;
    try { w = typeof swotWritable === "function" ? swotWritable(place()) : null; } catch (e) { w = null; }
    if (!w || !d) return false;
    LETTERS.forEach(function(L){ w[L] = (d[L] || []).map(function(x){ return x.title; }).filter(Boolean); });
    return true;
  }
  function swUpload(file){
    if (!file || !swotOn()) return;
    var sel = swSel(), area = sel.split("|")[0], method = sel.split("|")[1], id = PANE.chat.id;
    var asText = /\.(txt|md)$/i.test(file.name);
    if (!asText && !/\.(docx|pdf|xlsx)$/i.test(file.name)) { SAY = "The Copilot reads Word (.docx), PDF, Excel (.xlsx) and text (.txt) files. Save it as one of those and upload it again."; draw(); return; }
    if (file.size > MAX_FILE) { SAY = "That file is larger than 3 MB, so it was not kept. Split it, or paste the part that matters."; draw(); return; }
    var r = new FileReader();
    r.onload = function(){
      var body = { act:"addSource", place: SWALL ? "all" : place(), kind: method, name: file.name, chatId: id, area: area, method: method, placeWord: placeWord() };
      if (asText) body.text = String(r.result || "");
      else { body.data = String(r.result || "").replace(/^data:[^,]*,/, ""); body.type = file.type || ""; }
      act(body, function(j){ if (PANE && PANE.chat && PANE.chat.id === id) swView(j); SAY = "Kept: " + (j.source ? j.source.name : file.name) + "."; loadSources(true); draw(); });
    };
    r.onerror = function(){ SAY = "That file could not be read by the browser. Try again."; draw(); };
    if (asText) r.readAsText(file); else r.readAsDataURL(file);
  }
  function swClick(ev){
    var b;
    if ((b = hit(ev, "[data-cop-fold]"))) { var fk = b.getAttribute("data-cop-fold"); setFold(fk, !folded(fk)); return true; }
    if ((b = hit(ev, "[data-cop-src-retry]"))) { loadSources(true); return true; }
    if ((b = hit(ev, "[data-cop-src-del]"))) { SRCASK = b.getAttribute("data-cop-src-del"); draw(); return true; }
    if ((b = hit(ev, "[data-cop-src-del-no]"))) { SRCASK = null; draw(); return true; }
    if ((b = hit(ev, "[data-cop-src-del-yes]"))) {
      act({ act:"deleteSource", sourceId: b.getAttribute("data-cop-src-del-yes") }, function(){ SRCASK = null; SAY = "The source was deleted."; loadSources(true); });
      return true;
    }
    if ((b = hit(ev, "[data-cop-src-retag]"))) {
      act({ act:"retagSource", sourceId: b.getAttribute("data-cop-src-retag"), place: b.getAttribute("data-cop-to") }, function(){ loadSources(true); });
      return true;
    }
    if (!swotOn()) return false;
    var s = PANE.swot, id = PANE.chat.id, g;
    if ((b = hit(ev, "[data-cop-sw-start]"))) { g = swCopy(); g.start = b.getAttribute("data-cop-sw-start"); g.phase = "methods"; swSave(g); return true; }
    if ((b = hit(ev, "[data-cop-sw-m]"))) {
      var am = b.getAttribute("data-cop-sw-m").split("|"); g = swCopy();
      var ms = g.methods[am[0]] || [], at = ms.indexOf(am[1]);
      if (at >= 0) ms.splice(at, 1); else ms.push(am[1]);
      g.methods[am[0]] = ms; swSave(g); return true;
    }
    if ((b = hit(ev, "[data-cop-sw-go]"))) { g = swCopy(); g.phase = b.getAttribute("data-cop-sw-go"); SAY = ""; swSave(g); return true; }
    if ((b = hit(ev, "[data-cop-sw-line]"))) {
      var lk = b.getAttribute("data-cop-sw-line"); SWSEL[id] = lk; SWPASTE = "";
      if (s.phase !== "gather") { g = swCopy(); g.phase = "gather"; if (lk.split("|")[1] === "guided") g.q = { area: lk.split("|")[0], i: 0 }; swSave(g); return true; }
      if (lk.split("|")[1] === "guided" && (!s.q || s.q.area !== lk.split("|")[0])) { g = swCopy(); g.q = { area: lk.split("|")[0], i: 0 }; swSave(g); return true; }
      draw(); return true;
    }
    if ((b = hit(ev, "[data-cop-sw-q]"))) { var qi = b.getAttribute("data-cop-sw-q").split("|"); g = swCopy(); g.q = { area: qi[0], i: +qi[1] }; SWSUG = null; swSave(g); return true; }
    if ((b = hit(ev, "[data-cop-sw-help]"))) { var hk = b.getAttribute("data-cop-sw-help"); SWHELP[hk] = !SWHELP[hk]; draw(); return true; }
    if ((b = hit(ev, "[data-cop-sw-answer]"))) {
      var ai = b.getAttribute("data-cop-sw-answer").split("|");
      swAsk({ act:"swotAnswer", area: ai[0], i: +ai[1], swot: swCopy() }, function(j){
        SWSUG = { id: id, area: ai[0], i: +ai[1], used: j.used || [] };
        g = swCopy(); g.ans[ai[0]] = g.ans[ai[0]] || []; g.ans[ai[0]][+ai[1]] = j.answer; swSave(g);
      });
      return true;
    }
    if ((b = hit(ev, "[data-cop-sw-upload]"))) { var fi = document.querySelector("[data-cop-sw-file]"); if (fi) fi.click(); return true; }
    if ((b = hit(ev, "[data-cop-sw-keep]"))) {
      if (!SWPASTE.trim()) { SAY = "Paste the text first."; draw(); return true; }
      var sl = swSel().split("|");
      act({ act:"addSource", place: SWALL ? "all" : place(), kind: sl[1], name: "", text: SWPASTE, chatId: id, area: sl[0], method: sl[1], placeWord: placeWord() }, function(j){
        SWPASTE = ""; if (PANE && PANE.chat && PANE.chat.id === id) swView(j); SAY = "Kept."; loadSources(true); draw(); });
      return true;
    }
    if ((b = hit(ev, "[data-cop-sw-use]")) || (b = hit(ev, "[data-cop-sw-unlink]"))) {
      var un = b.hasAttribute("data-cop-sw-unlink"), sp = swSel().split("|");
      act({ act: un ? "swotUnlink" : "swotLink", id: id, area: sp[0], method: sp[1], sourceId: b.getAttribute(un ? "data-cop-sw-unlink" : "data-cop-sw-use"), placeWord: placeWord() },
        function(j){ if (PANE && PANE.chat && PANE.chat.id === id) swView(j); draw(); });
      return true;
    }
    if ((b = hit(ev, "[data-cop-sw-prompt]"))) {
      var pa = b.getAttribute("data-cop-sw-prompt"), pp = planParts();
      act({ act:"swotPrompt", id: id, area: pa, placeWord: placeWord(), company: { companyName: placeWord(), whoWeAre: pp.who, purpose: pp.pur,
        winningAspiration: pp.asp, northStar: pp.eim } }, function(j){
        if (PANE && PANE.chat && PANE.chat.id === id) swView(j);
        try {
          var a = document.createElement("a"), blob = new Blob([j.text || ""], { type: "text/plain;charset=utf-8" });
          a.href = URL.createObjectURL(blob); a.download = j.name || "research-prompt.txt"; document.body.appendChild(a); a.click();
          setTimeout(function(){ URL.revokeObjectURL(a.href); a.remove(); }, 1000);
        } catch (e) {}
        SAY = "The prompt is downloaded. Run it, then upload or paste the answer here."; draw();
      });
      return true;
    }
    if ((b = hit(ev, "[data-cop-sw-an]"))) { SWEDIT = null; swAsk({ act:"swotAnalysis", area: b.getAttribute("data-cop-sw-an"), swot: swCopy() }); return true; }
    if ((b = hit(ev, "[data-cop-sw-anedit]"))) { var ea = b.getAttribute("data-cop-sw-anedit"); SWEDIT = { area: ea, data: JSON.parse(JSON.stringify(s[ea])) }; draw(); return true; }
    if ((b = hit(ev, "[data-cop-sw-anedit-no]"))) { SWEDIT = null; draw(); return true; }
    if ((b = hit(ev, "[data-cop-sw-ansave]"))) {
      if (!SWEDIT) return true;
      g = swCopy(); g[SWEDIT.area] = SWEDIT.data; g[SWEDIT.area].agreed = false; SWEDIT = null; swSave(g); return true;
    }
    if ((b = hit(ev, "[data-cop-sw-agree]"))) { var ga = b.getAttribute("data-cop-sw-agree"); g = swCopy(); g[ga].agreed = true; swSave(g); return true; }
    if ((b = hit(ev, "[data-cop-sw-draft]"))) { if (!b.disabled) swAsk({ act:"swotDraft", swot: swCopy() }); return true; }
    if ((b = hit(ev, "[data-cop-sw-check]"))) { swAsk({ act:"swotCheck", swot: swCopy() }); return true; }
    if ((b = hit(ev, "[data-cop-sw-finish]"))) {
      act({ act:"swotFinish", id: id, placeWord: placeWord() }, function(j){
        if (PANE && PANE.chat && PANE.chat.id === id) swView(j);
        var wrote = swWritePlan(PANE.swot && PANE.swot.draft);
        SAY = wrote ? "" : "Saved as a deliverable. The plan’s SWOT could not be written from here — copy it across on the SWOT page.";
        LISTS[key()] = null; loadList(true);
        if (wrote && typeof paint === "function") paint(); else draw();
      });
      return true;
    }
    return false;
  }
  /* ── the rail folds (§490: "the deliverables and sources open folded") ── */
  var FOLD_DEFAULT = { chats: false, delivs: true, sources: true }, FOLD = {};
  function folded(k){
    if (k in FOLD) return FOLD[k];
    try { var v = localStorage.getItem("smp.copilot.fold." + k); if (v === "1" || v === "0") return (FOLD[k] = v === "1"); } catch (e) {}
    return !!FOLD_DEFAULT[k];
  }
  function setFold(k, v){ FOLD[k] = v; try { localStorage.setItem("smp.copilot.fold." + k, v ? "1" : "0"); } catch (e) {} draw(); }
  function foldBtn(k, label){
    var f = folded(k);
    return '<button type="button" class="copfoldb" data-cop-fold="' + k + '" aria-expanded="' + !f + '" aria-label="' + (f ? "Show " : "Hide ") + E(label) + '" title="' + (f ? "Show " : "Hide ") + E(label) + '">' +
      '<svg viewBox="0 0 16 16" aria-hidden="true"><path d="M5 6l3 3 3-3" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/></svg></button>';
  }
  function railsInner(){
    return '<section class="coprail copchats' + (folded("chats") ? " copfolded" : "") + '"><div class="coprh" data-cop-chatshead>' + chatsHead() + foldBtn("chats", "chats") + '</div>' +
        '<div class="coplist" data-cop-chats>' + chatsHtml() + '</div>' +
        '<div class="coprft" data-cop-chatsfoot>' + chatsFoot() + '</div></section>' +
      '<section class="coprail' + (folded("delivs") ? " copfolded" : "") + '"><div class="coprh"><span class="coprhl">Deliverables</span>' + foldBtn("delivs", "deliverables") + '</div>' +
        '<div class="coplist" data-cop-delivs>' + delivsHtml() + '</div></section>' +
      (section() === "analysis" ? '<section class="coprail' + (folded("sources") ? " copfolded" : "") + '" data-cop-sources-rail><div class="coprh"><span class="coprhl">Sources</span>' + foldBtn("sources", "sources") + '</div>' +
        '<div class="coplist" data-cop-sources>' + sourcesHtml() + '</div></section>' : '');
  }

  /* ── THE ASKS ──────────────────────────────────────────────────────── */
  function loadList(force){
    if (!shown()) return;
    var k = key(), p = place(), s = section();
    if (s === "analysis") loadSources(false);
    if (!force && LISTS[k] && !LISTS[k].failed) { draw(); openIfNeeded(); return; }
    askedFor = k;
    getJ("list", ["place=" + encodeURIComponent(p), "section=" + encodeURIComponent(s)]).then(function(x){
      if (x.st === 200 && x.j && x.j.ok) LISTS[k] = { chats: x.j.chats || [], archived: x.j.archived || [], mayDelete: !!x.j.mayDelete, deliverables: x.j.deliverables || [], swotProgress: x.j.swotProgress || {} };
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
  /* ── HOW WE COMPETE (spec 064 §3.2–§3.5, §493, from the signed-off
     design-mockups/copilot-directions-flow/2026-10-05_directions-flow-v2.html,
     panel B) ─────────────────────────────────────────────────────────────
     The SWOT chat's own shape: the to-do column holds ONLY the list, and the
     results — the scores, the recommendation, the value cards, the table —
     appear in the conversation in the order they were reached. Nothing here
     adds a score up: the totals, the leader, the gap and the clarity are the
     server's (lib/copilot-compete.ts resultOf), so the page cannot recommend
     one discipline while the to-do says another (§94.8). A score pressed is
     marked as edited, so what the Copilot said and what the person changed
     stay told apart. Nothing reaches the plan until Save is pressed. */
  var CPMORE = {}, CPINT = {}, CPASKTXT = {}, CPPEND = null;
  function competeOn(){ return !!(PANE && PANE.chat && PANE.compete); }
  function cpCopy(){ return JSON.parse(JSON.stringify(PANE.compete)); }
  function cpView(j){ ["compete","competeTodo","competeDone","competeFactors","competeResult","competeWords"]
    .forEach(function(k){ if (j && k in j) PANE[k] = j[k]; }); }
  function cpProgress(id){
    var l = list(); if (l && l.swotProgress && PANE && PANE.competeTodo) l.swotProgress[id] = { done: PANE.competeDone, of: PANE.competeTodo.length };
  }
  function cpTitle(){ return "How we compete — " + placeWord(); }
  function cpWord(d){ return ((PANE.competeWords || {}).disc || {})[d] || d; }
  /* A press made while an earlier save is still on its way is not dropped:
     the latest patch waits and goes when the line is free. */
  function cpSave(patch, quiet){
    if (!competeOn()) return;
    if (busy) { CPPEND = Object.assign(CPPEND || {}, patch); return; }
    var id = PANE.chat.id;
    act({ act:"competeSave", id:id, compete:patch, placeWord:placeWord() }, function(j){
      if (PANE && PANE.chat && PANE.chat.id === id) cpView(j);
      cpProgress(id);
      if (CPPEND) { var p = CPPEND; CPPEND = null; cpSave(p, quiet); return; }
      if (!quiet) draw();
    });
  }
  function cpAsk(body){
    if (!competeOn() || THINKING) return;
    var id = PANE.chat.id;
    THINKING = id; SAY = ""; THINK_AT = Date.now();
    if (!WORK_TIMER) WORK_TIMER = setInterval(workTick, 500);
    draw();
    body.id = id; body.placeWord = placeWord(); body.context = swContext();
    post(body, WAIT_MS).then(function(x){
      THINKING = null;
      if (x.st === 200 && x.j && x.j.ok) {
        if (PANE && PANE.chat && PANE.chat.id === id) { cpView(x.j); cpProgress(id); }
        draw(); return;
      }
      SAY = (x.j && x.j.why) || "That did not work. Nothing was lost — try again."; draw();
    }, function(err){
      THINKING = null;
      SAY = err && err.timedOut ? "This is taking too long, so the page stopped waiting. Try again in a moment."
        : "The server could not be reached. Nothing was lost — try again.";
      draw();
    });
  }
  function cpSideHtml(){
    var todo = PANE.competeTodo || [], done = PANE.competeDone || 0, n = todo.length;
    return '<aside class="copsw-side"><div class="copsw-box copsw-todo"><div class="copsw-todoh"><div class="copsw-bh"><b>To-do</b> <span class="copsw-n">' + done + '/' + n + '</span></div>' +
      '<div class="copsw-meter" role="progressbar" aria-valuemin="0" aria-valuemax="' + n + '" aria-valuenow="' + done + '"><i style="width:' + (n ? Math.round(done * 100 / n) : 0) + '%"></i></div></div>' +
      '<div class="copsw-tg"><ul>' + todo.map(function(t){
        return '<li class="copsw-li ' + t.state + '" data-cop-cp-todo="' + E(t.key) + '"><span class="copsw-dot" aria-hidden="true"></span>' +
          '<span class="copsw-lb"><span class="copsw-tt" title="' + E(t.status) + '"><span>' + E(t.title) + '</span></span><span class="copsw-ts">' + E(t.status) + '</span></span>' +
          '<span class="copsw-pill ' + t.state + '">' + (t.state === "done" ? "Done" : "To do") + '</span></li>';
      }).join("") + '</ul></div></div></aside>';
  }
  function cpMsg(who, html){ return '<div class="copmsg ' + who + '"><div class="copbody">' + html + '</div></div>'; }
  function cpScoreTable(side, ed){
    var s = PANE.compete, f = ((PANE.competeFactors || {})[side]) || [], sc = s[side] || {}, r = ((PANE.competeResult || {})[side]) || {};
    var discs = (PANE.competeWords || {}).discs || ["btc","bts","bp"], id = PANE.chat.id;
    var open = side === "internal" || CPMORE[id], shown = open ? f : f.slice(0, 3), edited = {};
    (s.edited || []).forEach(function(k){ edited[k] = true; });
    var rows = shown.map(function(x){
      var v = sc[x.id] || {};
      return '<tr><th scope="row" title="' + E(x.description) + '">' + E(x.name) + '</th>' + discs.map(function(d){
        var k = side + ":" + x.id + ":" + d, n = v[d] == null ? "–" : String(v[d]);
        return '<td>' + (ed ? '<button type="button" class="copcp-sc' + (edited[k] ? " ed" : "") + '" data-cop-cp-sc="' + E(k) + '" aria-label="' + E(x.name + ", " + cpWord(d)) + ': ' + n + '"' +
          (edited[k] ? ' title="You changed this score"' : ' title="Press to change: 0, 1 or 2"') + '>' + n + '</button>'
          : '<span class="copcp-sc' + (edited[k] ? " ed" : "") + '">' + n + '</span>') + '</td>';
      }).join("") + '</tr>';
    }).join("");
    var more = side === "market" && f.length > 3
      ? '<tr class="copcp-more"><td colspan="4"><button type="button" class="linkbu" data-cop-cp-more>' +
        (open ? "Show fewer" : "+ " + (f.length - 3) + " more market factors") + '</button></td></tr>' : '';
    var tot = r.total ? '<tr class="copcp-tot"><th scope="row">Total</th>' + discs.map(function(d){
      return '<td' + (r.complete && r.leader === d ? ' class="lead"' : '') + '>' + E(String(r.total[d])) + ' · ' + E(String(r.pct[d])) + '%</td>';
    }).join("") + '</tr>' : '';
    return '<div class="copcp-wrap"><table class="copcp-tab"><thead><tr><th scope="col">' + (side === "market" ? "Market factor" : "Internal factor") + '</th>' +
      discs.map(function(d){ return '<th scope="col">' + E(cpWord(d)) + '</th>'; }).join("") + '</tr></thead><tbody>' + rows + more + tot + '</tbody></table></div>';
  }
  function cpRecHtml(ed){
    var s = PANE.compete, R = PANE.competeResult || {}, m = R.market || {}, i = R.internal || {}, W = PANE.competeWords || {};
    if (!m.complete) return '';
    var clar = (W.clarity || {})[m.clarity] || m.clarity;
    var line = '<b>' + E(cpWord(m.leader)) + '</b> leads the market by ' + E(String(m.gap)) + ' points <span class="copcp-cl ' + E(m.clarity) + '">' + E(clar) + '</span>. ' +
      (!i.complete ? '' : R.aligned ? 'Your internal scores point the same way.' : 'Your internal scores lean to ' + E(cpWord(i.leader)) + '.');
    var h = cpMsg("ai", line + (s.chosen ? '' : ' Go with it?'));
    if (!s.chosen) {
      if (ed) h += '<div class="copopts"><button type="button" class="copopt rec" data-cop-cp-choose="' + E(m.leader) + '">Yes, ' + E(cpWord(m.leader)) + '</button>' +
        ((W.discs || []).filter(function(d){ return d !== m.leader; }).map(function(d){
          return '<button type="button" class="copopt" data-cop-cp-choose="' + E(d) + '">Choose ' + E(cpWord(d)) + ' instead</button>'; }).join("")) +
        '<button type="button" class="copopt" data-cop-cp-more="1">Let me change scores</button></div>';
      return h;
    }
    return h + cpMsg("me", "Go with " + E(cpWord(s.chosen)) + ".");
  }
  function cpCardsHtml(ed){
    var s = PANE.compete, picked = {};
    (s.picked || []).forEach(function(n){ picked[n] = true; });
    var n = (s.picked || []).length;
    var h = cpMsg("ai", 'Here are ' + s.suggested.length + ' values for <b>' + E(cpWord(s.chosen)) + '</b>. Tick the ones closest to how you want to win — usually 3 or 4.') +
      '<div class="copcp-cards">' + s.suggested.map(function(v, k){
        var on = !!picked[k];
        return '<div class="copcp-card' + (on ? " on" : "") + '">' +
          (ed ? '<button type="button" class="copsw-tick' + (on ? " on" : "") + '" data-cop-cp-pick="' + k + '" aria-pressed="' + on + '" aria-label="Tick ' + E(v.title) + '">&#10003;</button>'
            : '<span class="copsw-tick' + (on ? " on" : "") + '">&#10003;</span>') +
          '<h4>' + E(v.title) + '</h4><div class="copsw-lh">How</div><ul>' + v.how.map(function(x){ return '<li>' + E(x) + '</li>'; }).join("") + '</ul>' +
          '<div class="copsw-lh">Measure</div><ul>' + v.measure.map(function(x){ return '<li>' + E(x) + '</li>'; }).join("") + '</ul></div>';
      }).join("") + '</div>';
    if (ed) h += '<div class="copopts"><button type="button" class="copopt rec" data-cop-cp-use' + (n ? '' : ' aria-disabled="true" title="Tick at least one value first"') + '>Use the ' + n + ' I ticked</button>' +
      '<button type="button" class="copopt" data-cop-cp-again>Suggest other values</button></div>';
    return h;
  }
  function cpTableHtml(ed){
    var t = PANE.compete.table, vals = t.values;
    var bullets = function(a){ return a.length ? '<ul class="cmpul">' + a.map(function(x){ return '<li>' + E(x) + '</li>'; }).join("") + '</ul>' : '&mdash;'; };
    var row = function(label, cell){ return '<tr><th class="cmprow">' + label + '</th>' + vals.map(cell).join("") + '</tr>'; };
    return '<div class="cmp copcp-table"><div class="tblscroll"><table class="cmptab"><thead><tr><th class="cmprow">Discipline</th><th class="cmpd" colspan="' + vals.length + '">' + E(cpWord(t.discipline)) + '</th></tr></thead><tbody>' +
      row("Value", function(v, i){ return '<td class="cmpval">' + (ed ? '<input class="fld" data-cop-cp-cell="' + i + '|title" value="' + E(v.title) + '" aria-label="Value ' + (i + 1) + '">' : E(v.title)) + '</td>'; }) +
      row("How", function(v, i){ return '<td>' + (ed ? '<textarea class="fld cmpbox" data-cop-cp-cell="' + i + '|how" aria-label="How, value ' + (i + 1) + '">' + E(v.how.join("\n")) + '</textarea>' : bullets(v.how)) + '</td>'; }) +
      row("Measure", function(v, i){ return '<td>' + (ed ? '<textarea class="fld cmpbox" data-cop-cp-cell="' + i + '|measure" aria-label="Measure, value ' + (i + 1) + '">' + E(v.measure.join("\n")) + '</textarea>' : bullets(v.measure)) + '</td>'; }) +
      '</tbody></table></div></div>';
  }
  function competeHtml(){
    var s = PANE.compete, ed = canEdit() && !s.saved, id = PANE.chat.id, busyHere = THINKING === id;
    var head = '<div class="copvline"><b>' + E(PANE.chat.title || cpTitle()) + '</b> · ' + (s.saved ? "saved" : "in progress") + '</div>';
    var work = busyHere ? '<div class="copmsg product copworking" role="status"><div class="copbody"><span data-cop-wword>' + E(workWord()) + '</span><span class="copdots" aria-hidden="true"><i></i><i></i><i></i></span></div></div>' : '';
    var m = ((PANE.competeResult || {}).market) || {};
    var main = '';
    if (!m.complete) {
      main = cpMsg("ai", "I will score the three value disciplines — Best Total Cost, Best Total Solution and Best Product — against 10 market factors and 10 internal ones, from what the plan says about " + E(placeWord()) + ". You can change any score.") +
        (ed && !busyHere ? '<div class="copopts"><button type="button" class="copopt rec" data-cop-cp-score>Score them</button></div>' : '');
    } else {
      main = cpMsg("ai", "Each factor is scored 0, 1 or 2 for each discipline. The market decides; the internal scores are a check." + (ed ? " Press a score to change it." : "")) +
        cpScoreTable("market", ed && s.phase !== "table") +
        '<div class="copopts"><button type="button" class="linkbu" data-cop-cp-int aria-expanded="' + !!CPINT[id] + '">' + (CPINT[id] ? "Hide internal factors" : "Show internal factors (" + (((PANE.competeFactors || {}).internal) || []).length + ")") + '</button></div>' +
        (CPINT[id] ? cpScoreTable("internal", ed && s.phase !== "table") : '') +
        cpRecHtml(ed);
      if (s.chosen && s.suggested.length && !s.table) main += cpCardsHtml(ed);
      else if (s.chosen && !s.suggested.length && ed && !busyHere) main += '<div class="copopts"><button type="button" class="copopt rec" data-cop-cp-again>Suggest values</button></div>';
      if (s.table) {
        main += cpMsg("me", "Use these " + s.table.values.length + ".");
        if (s.reply) main += cpMsg("ai", E(s.reply));
        if (ed && s.alts && s.alts.length) main += '<div class="copopts">' + s.alts.map(function(a){
          return '<button type="button" class="copopt" data-cop-cp-alt="' + E(a) + '">' + E(a) + '</button>'; }).join("") + '</div>';
        main += cpTableHtml(ed);
        if (ed) main += '<p class="copnote">Every cell is editable here before saving.</p>' +
          '<div class="copcp-ask"><textarea class="fld" data-cop-cp-ask rows="2" placeholder="Ask for a change — another title, a How to drop, a Measure to add" aria-label="Ask the Copilot to change the table">' + E(CPASKTXT[id] || "") + '</textarea>' +
          '<button type="button" class="copbtn" data-cop-cp-refine' + (busyHere ? ' disabled' : '') + '>Send</button></div>' +
          '<div class="copbtns"><button type="button" class="copbtn quiet" data-cop-cp-chat>Keep chatting</button>' +
          '<button type="button" class="copbtn solid" data-cop-cp-finish>Save to How we compete</button></div>';
        if (s.saved) main += cpMsg("product", "Saved as " + E(s.saved.title) + " v" + E(String(s.saved.n)) + ". It is on the plan under How we compete.");
      }
    }
    return head + '<div class="copsw"><div class="copsw-main">' + main + work + '</div>' + cpSideHtml() + '</div>';
  }
  /* The plan is written after a press, never inside a fetch's tail with a
     hand on the page (§35): the same order the SWOT's Save keeps. */
  function cpWritePlan(t){
    var w = null;
    try { w = typeof competeWritable === "function" ? competeWritable(place()) : null; } catch (e) { w = null; }
    if (!w || !t) return false;
    w.discipline = t.discipline;
    w.values = t.values.map(function(v){ return { title: v.title, how: v.how.slice(), measure: v.measure.slice() }; });
    if (typeof competeTidy === "function") competeTidy(place());
    return true;
  }
  function cpCell(el){
    var p = el.getAttribute("data-cop-cp-cell").split("|"), v = PANE.compete.table && PANE.compete.table.values[+p[0]];
    if (!v) return;
    if (p[1] === "title") v.title = el.value;
    else v[p[1]] = String(el.value || "").split(/\n/).map(function(x){ return x.replace(/^\s*[-•*]\s*/, "").trim(); }).filter(Boolean);
  }
  function cpClick(ev){
    if (!competeOn()) return false;
    var b, s = PANE.compete, id = PANE.chat.id;
    if ((b = hit(ev, "[data-cop-cp-int]"))) { CPINT[id] = !CPINT[id]; draw(); return true; }
    if ((b = hit(ev, "[data-cop-cp-more]"))) { CPMORE[id] = b.getAttribute("data-cop-cp-more") === "1" ? true : !CPMORE[id]; draw(); return true; }
    if (!canEdit() || s.saved) return false;
    if ((b = hit(ev, "[data-cop-cp-score]"))) { cpAsk({ act:"competeScore" }); return true; }
    if ((b = hit(ev, "[data-cop-cp-sc]"))) {
      if (THINKING) return true;
      var k = b.getAttribute("data-cop-cp-sc").split(":"), side = k[0], g = cpCopy();
      var row = (g[side] = g[side] || {})[k[1]] = g[side][k[1]] || {};
      row[k[2]] = ((Number(row[k[2]]) || 0) + 1) % 3;
      var ek = k.join(":"); if (g.edited.indexOf(ek) < 0) g.edited.push(ek);
      PANE.compete = g; draw();
      var patch = { edited: g.edited }; patch[side] = g[side];
      cpSave(patch);
      return true;
    }
    if ((b = hit(ev, "[data-cop-cp-choose]"))) { cpAsk({ act:"competeValues", compete:{ chosen: b.getAttribute("data-cop-cp-choose") } }); return true; }
    if ((b = hit(ev, "[data-cop-cp-again]"))) { cpAsk({ act:"competeValues" }); return true; }
    if ((b = hit(ev, "[data-cop-cp-pick]"))) {
      var n = +b.getAttribute("data-cop-cp-pick"), pk = (s.picked || []).slice(), at = pk.indexOf(n);
      if (at < 0) pk.push(n); else pk.splice(at, 1);
      pk.sort(function(a, c){ return a - c; });
      PANE.compete.picked = pk; draw(); cpSave({ picked: pk });
      return true;
    }
    if ((b = hit(ev, "[data-cop-cp-use]"))) {
      if (!(s.picked || []).length) { SAY = "Tick at least one value first."; draw(); return true; }
      var vals = s.picked.map(function(i){ return s.suggested[i]; }).filter(Boolean);
      cpSave({ table: { discipline: s.chosen, values: vals }, phase: "table" });
      return true;
    }
    if ((b = hit(ev, "[data-cop-cp-alt]"))) { cpAsk({ act:"competeRefine", ask: "Use “" + b.getAttribute("data-cop-cp-alt") + "” as the title." }); return true; }
    if ((b = hit(ev, "[data-cop-cp-refine]"))) {
      var q = String(CPASKTXT[id] || "").trim();
      if (!q) { var bx = document.querySelector("[data-cop-cp-ask]"); if (bx) bx.focus(); return true; }
      CPASKTXT[id] = "";
      cpAsk({ act:"competeRefine", ask: q });
      return true;
    }
    if ((b = hit(ev, "[data-cop-cp-chat]"))) { var bx2 = document.querySelector("[data-cop-cp-ask]"); if (bx2) bx2.focus(); return true; }
    if ((b = hit(ev, "[data-cop-cp-finish]"))) {
      if (THINKING) return true;
      act({ act:"competeFinish", id:id, placeWord:placeWord() }, function(j){
        if (PANE && PANE.chat && PANE.chat.id === id) cpView(j);
        cpProgress(id);
        var on = typeof compOn === "function" ? compOn(place(), SMPRules.COMPETE) : true;
        var wrote = cpWritePlan(PANE.compete && PANE.compete.table);
        SAY = !wrote ? "Saved as a deliverable. The plan could not be written from here — copy it across on the How we compete page."
          : on ? "" : "Saved. How we compete is switched off for this layer on Client set-up › Structure, so the plan keeps it hidden until it is turned on.";
        LISTS[key()] = null; loadList(true);
        if (wrote && typeof paint === "function") paint(); else draw();
      });
      return true;
    }
    return false;
  }
  /* ── ADVISORY (spec 064 decisions-v0.4 §6, §496, from the signed-off
     design-mockups/copilot-advisory/2026-10-06_advisory.html; Islam: "ok for
     both" — the question count sits in the right column, and "Proceed with
     what you have" is offered from the first question) ─────────────────────
     The person brings a question; the Copilot asks one question a turn, five
     a round, two rounds, then writes a Decision Brief. The COUNT is the
     server's (advisoryCount) — the pips are drawn from it, never counted
     here, so the column and the rule cannot disagree (§53.5). The page never
     sends the state: every press names what the person did (reply + words)
     and the server works the rest out from the stored row (§42). */
  var ADTXT = {}, ADASK = {};
  function advOn(){ return !!(PANE && PANE.chat && PANE.advisory); }
  function adView(j){ ["advisory","advisoryTodo","advisoryDone","advisoryCount","advisoryFiles","advisoryWords"]
    .forEach(function(k){ if (j && k in j) PANE[k] = j[k]; }); }
  function adProgress(id){
    var l = list(); if (l && l.swotProgress && PANE && PANE.advisoryTodo) l.swotProgress[id] = { done: PANE.advisoryDone, of: PANE.advisoryTodo.length };
  }
  function adTitle(){ return "Advisory — " + placeWord(); }
  function adAsk(body){
    if (!advOn() || THINKING) return;
    var id = PANE.chat.id;
    THINKING = id; SAY = ""; THINK_AT = Date.now();
    if (!WORK_TIMER) WORK_TIMER = setInterval(workTick, 500);
    draw();
    body.id = id; body.placeWord = placeWord(); body.context = swContext();
    post(body, WAIT_MS).then(function(x){
      THINKING = null;
      if (x.st === 200 && x.j && x.j.ok) {
        if (PANE && PANE.chat && PANE.chat.id === id) { adView(x.j); adProgress(id); }
        draw(); return;
      }
      /* A reply the server stored before the model failed is not lost: the
         chat is read again so the screen shows what was kept. */
      SAY = (x.j && x.j.why) || "That did not work. Nothing was lost — try again.";
      if (x.st === 503 && PANE && PANE.chat && PANE.chat.id === id) openItem("chat", id); else draw();
    }, function(err){
      THINKING = null;
      SAY = err && err.timedOut ? "This is taking too long, so the page stopped waiting. Try again in a moment."
        : "The server could not be reached. Nothing was lost — try again.";
      draw();
    });
  }
  var AD_TAG = { platform:"p", you:"y", file:"f", assumed:"a" };
  function adTag(src){ var w = ((PANE.advisoryWords || {}).tags || {})[src] || src; return '<span class="adtag ' + (AD_TAG[src] || "f") + '">' + E(w) + '</span>'; }
  function adSideHtml(){
    var s = PANE.advisory, todo = PANE.advisoryTodo || [], done = PANE.advisoryDone || 0, n = todo.length;
    var c = PANE.advisoryCount || { round:1, rounds:2, asked:0, of:5, total:0 };
    var h = '<aside class="copsw-side"><div class="copsw-box copsw-todo"><div class="copsw-todoh"><div class="copsw-bh"><b>To-do</b> <span class="copsw-n">' + done + '/' + n + '</span></div>' +
      '<div class="copsw-meter" role="progressbar" aria-valuemin="0" aria-valuemax="' + n + '" aria-valuenow="' + done + '"><i style="width:' + (n ? Math.round(done * 100 / n) : 0) + '%"></i></div></div>' +
      '<div class="copsw-tg"><ul>' + todo.map(function(t){
        return '<li class="copsw-li ' + t.state + '" data-cop-ad-todo="' + E(t.key) + '"><span class="copsw-dot" aria-hidden="true"></span>' +
          '<span class="copsw-lb"><span class="copsw-tt" title="' + E(t.status) + '"><span>' + E(t.title) + '</span></span><span class="copsw-ts">' + E(t.status) + '</span></span>' +
          '<span class="copsw-pill ' + t.state + '">' + (t.state === "done" ? "Done" : "To do") + '</span></li>';
      }).join("") + '</ul></div></div>';
    var pips = ""; for (var k = 0; k < c.of; k++) pips += '<i class="' + (k < c.asked ? "u" : "") + '"></i>';
    h += '<div class="copsw-box adbudget" data-cop-ad-budget><div class="copsw-bh"><b>Round ' + c.round + ' of ' + c.rounds + '</b> <span class="copsw-n">' + c.asked + ' of ' + c.of + ' asked</span></div>' +
      '<div class="adpips" aria-hidden="true">' + pips + '</div>' +
      '<p class="adwhy">' + (s.brief ? "The questions are done." : c.stopped ? "You asked it to proceed with what it has." :
        c.owed ? "The questions are used up; the brief comes next." : "At most " + c.of + " questions a round and " + c.rounds + " rounds, then the brief.") + '</p></div>';
    if (s.assumed && s.assumed.length) h += '<div class="copsw-box"><div class="copsw-bh"><b>Assumed so far</b></div><ul class="adlist">' +
      s.assumed.map(function(a){ return '<li>' + adTag("assumed") + ' ' + E(a) + '</li>'; }).join("") + '</ul></div>';
    var files = PANE.advisoryFiles || [];
    if ((s.seen && s.seen.length) || files.length) h += '<div class="copsw-box"><div class="copsw-bh"><b>What it can see</b></div><ul class="adlist">' +
      (s.seen || []).map(function(a){ return '<li>' + adTag("platform") + ' ' + E(a) + '</li>'; }).join("") +
      files.map(function(f){ return '<li>' + adTag("file") + ' ' + E(f) + '</li>'; }).join("") + '</ul></div>';
    return h + '</aside>';
  }
  function adAnswerHtml(t){
    var W = PANE.advisoryWords || {}, cw = W.clash || {};
    if (t.how === "assumed") return cpMsg("me", E(W.assume || "Assume for me"));
    if (t.how === "platform") return cpMsg("me", E(cw.platform || "Use the platform figure") + " — " + E(t.answer));
    if (t.how === "file") return cpMsg("me", E(cw.file || "Use the file") + " — " + E(t.answer));
    return t.how ? cpMsg("me", E(t.answer)) : "";
  }
  function adBriefHtml(b){
    var L = "ABCD";
    return '<div class="adbrief" data-cop-ad-brief><h3>' + E(b.title) + '</h3>' +
      '<div><h4>Situation</h4><p>' + E(b.situation) + '</p></div>' +
      (b.known.length ? '<div><h4>What we know</h4><ul>' + b.known.map(function(f){ return '<li>' + adTag(f.source) + ' ' + E(f.text) + '</li>'; }).join("") + '</ul></div>' : '') +
      '<div><h4>Options</h4><div class="adopts">' + b.options.map(function(o, k){
        return '<div class="adopt' + (o.recommended ? " rec" : "") + '"><div class="adoh"><span>' + L.charAt(k) + '. ' + E(o.title) + '</span>' +
          (o.recommended ? '<span class="adrec">Recommended</span>' : '') + '</div>' + (o.detail ? '<p>' + E(o.detail) + '</p>' : '') + '</div>';
      }).join("") + '</div></div>' +
      (b.why ? '<div><h4>Why</h4><p>' + E(b.why) + '</p></div>' : '') +
      (b.next.length ? '<div><h4>Next steps</h4><ol>' + b.next.map(function(x){ return '<li>' + E(x) + '</li>'; }).join("") + '</ol></div>' : '') + '</div>';
  }
  function advHtml(){
    var s = PANE.advisory, ed = canEdit() && !s.saved, id = PANE.chat.id, busyHere = THINKING === id;
    var W = PANE.advisoryWords || {}, cw = W.clash || {};
    var head = '<div class="copvline"><b>' + E(PANE.chat.title || adTitle()) + '</b> · ' + (s.saved ? "saved" : s.brief ? "brief written" : "in progress") + '</div>';
    var work = busyHere ? '<div class="copmsg product copworking" role="status"><div class="copbody"><span data-cop-wword>' + E(workWord()) + '</span><span class="copdots" aria-hidden="true"><i></i><i></i><i></i></span></div></div>' : '';
    var main = cpMsg("ai", "Bring me a decision you are weighing about " + E(placeWord()) + ". I will ask a few questions — one at a time — then write a Decision Brief with options and one recommendation.");
    if (s.ask) main += cpMsg("me", E(s.ask));
    var last = s.turns.length - 1;
    s.turns.forEach(function(t, k){
      var inRound = s.turns.slice(0, k + 1).filter(function(x){ return x.round === t.round; }).length;
      var q = '<div class="adq">Round ' + t.round + ' · Question ' + inRound + ' of ' + ((PANE.advisoryCount || {}).of || 5) + '</div>';
      if (k === last && s.lead && !s.brief) q += '<p>' + E(s.lead) + '</p>';
      q += '<p>' + E(t.q) + '</p>';
      if (t.clash) q += '<div class="adclash"><b>Two sources disagree on ' + E(t.clash.what) + '</b><div class="adsrc">' +
        adTag("platform") + '<span>' + E(t.clash.platform) + '</span>' + adTag("file") + '<span>' + E(t.clash.file) + '</span></div></div>';
      main += cpMsg("ai", q) + adAnswerHtml(t);
    });
    var p = s.turns.length && !s.turns[last].how ? s.turns[last] : null;
    if (s.brief) {
      if (s.lead) main += cpMsg("ai", E(s.lead));
      main += adBriefHtml(s.brief);
      if (s.reply) main += cpMsg("ai", E(s.reply));
    }
    if (ed && !busyHere) {
      if (!s.ask) {
        main += '<div class="copcp-ask"><textarea class="fld" data-cop-ad-text rows="3" placeholder="What would you like advice on?" aria-label="Your question for the Copilot">' + E(ADTXT[id] || "") + '</textarea>' +
          '<button type="button" class="copbtn solid" data-cop-ad-send>Ask</button></div>';
      } else if (!s.brief) {
        if (p) {
          main += '<div class="copopts" data-cop-ad-choices>' +
            (p.clash ? '<button type="button" class="copopt" data-cop-ad-reply="platform">' + E(cw.platform || "Use the platform figure") + '</button>' +
                       '<button type="button" class="copopt" data-cop-ad-reply="file">' + E(cw.file || "Use the file") + '</button>' : '') +
            '<button type="button" class="copopt" data-cop-ad-reply="assume">' + E(W.assume || "Assume for me") + '</button>' +
            '<button type="button" class="copopt" data-cop-ad-reply="proceed">' + E(W.proceed || "Proceed with what you have") + '</button></div>' +
            '<div class="copcp-ask"><textarea class="fld" data-cop-ad-text rows="2" placeholder="' + (p.clash ? "Or give the number yourself" : "Your answer") + '" aria-label="Your answer">' + E(ADTXT[id] || "") + '</textarea>' +
            '<button type="button" class="copbtn" data-cop-ad-send>Send</button></div>';
        } else {
          /* Nothing waiting (the model did not answer, or proceed was pressed
             and the brief failed): the way on is to ask again (§61). */
          main += '<div class="copopts"><button type="button" class="copopt rec" data-cop-ad-next>' + ((PANE.advisoryCount || {}).owed ? "Write the brief" : "Continue") + '</button></div>';
        }
      } else {
        main += '<div class="copcp-ask"><textarea class="fld" data-cop-ad-change rows="2" placeholder="Ask for a change — another option, a different recommendation, a step to add" aria-label="Ask the Copilot to change the brief">' + E(ADASK[id] || "") + '</textarea>' +
          '<button type="button" class="copbtn" data-cop-ad-revise>Ask for changes</button></div>' +
          '<div class="copbtns"><button type="button" class="copbtn solid" data-cop-ad-finish>Save to Advisory deliverables</button></div>';
      }
    }
    if (s.saved) main += cpMsg("product", "Saved as " + E(s.saved.title) + " v" + E(String(s.saved.n)) + " in Advisory deliverables. It stays in the Copilot and does not go into the plan.");
    return head + '<div class="copsw adv"><div class="copsw-main">' + main + work + '</div>' + adSideHtml() + '</div>';
  }
  function adClick(ev){
    if (!advOn()) return false;
    var b, s = PANE.advisory, id = PANE.chat.id;
    if (!canEdit() || s.saved) return false;
    if ((b = hit(ev, "[data-cop-ad-send]"))) {
      var w = String(ADTXT[id] || "").trim();
      if (!w) { var bx = document.querySelector("[data-cop-ad-text]"); if (bx) bx.focus(); return true; }
      var pend = s.turns.length && !s.turns[s.turns.length - 1].how ? s.turns[s.turns.length - 1] : null;
      ADTXT[id] = "";
      adAsk({ act:"advisoryTurn", reply: pend && pend.clash ? "own" : "say", words: w });
      return true;
    }
    if ((b = hit(ev, "[data-cop-ad-reply]"))) { adAsk({ act:"advisoryTurn", reply: b.getAttribute("data-cop-ad-reply") }); return true; }
    if ((b = hit(ev, "[data-cop-ad-next]"))) { adAsk({ act:"advisoryTurn" }); return true; }
    if ((b = hit(ev, "[data-cop-ad-revise]"))) {
      var q = String(ADASK[id] || "").trim();
      if (!q) { var bx2 = document.querySelector("[data-cop-ad-change]"); if (bx2) bx2.focus(); return true; }
      ADASK[id] = "";
      adAsk({ act:"advisoryRevise", ask: q });
      return true;
    }
    if ((b = hit(ev, "[data-cop-ad-finish]"))) {
      if (THINKING) return true;
      act({ act:"advisoryFinish", id:id }, function(j){
        if (PANE && PANE.chat && PANE.chat.id === id) adView(j);
        adProgress(id);
        LISTS[key()] = null; loadList(true);
        draw();
      });
      return true;
    }
    return false;
  }
  /* ── DIRECTIONS AND CAPABILITIES (spec 064 §4–§5, §494, from the signed-off
     design-mockups/copilot-directions-flow/2026-10-05_directions-flow-v2.html,
     panels C, D and E) ──────────────────────────────────────────────────
     How we compete's own shape: the to-do column holds only the list, and the
     tables appear in the conversation in the order they were reached. The
     score is the server's (lib/copilot-directions.ts scoreOf) so the page
     cannot rank by one rule and save by another (§94.8). Nothing reaches the
     plan until Save is pressed; then each ticked Direction is a pillar —
     the one it came from, by id, where the chat started from the plan (§48)
     — and each kept Capability a capability held by the function that owns
     it. */
  var DVASK = {}, DVOWN = {}, DVADD = {}, DVPEND = null;
  function dirsOn(){ return !!(PANE && PANE.chat && PANE.dirs); }
  function dvView(j){ ["dirs","dirsTodo","dirsDone","dirsScores","dirsWords","dirsBlocker"]
    .forEach(function(k){ if (j && k in j) PANE[k] = j[k]; }); }
  function dvCopy(){ return JSON.parse(JSON.stringify(PANE.dirs)); }
  function dvProgress(id){
    var l = list(); if (l && l.swotProgress && PANE && PANE.dirsTodo) l.swotProgress[id] = { done: PANE.dirsDone, of: PANE.dirsTodo.length };
  }
  function dvTitle(mode){ return (mode === "capabilities" ? "Capabilities — " : "Directions — ") + placeWord(); }
  function dvFns(){
    var ks = []; try { ks = typeof activeFunctionKeys === "function" ? activeFunctionKeys() : []; } catch (e) { ks = []; }
    return ks.map(function(k){ return { key: k, name: (FUNCTIONS[k] && FUNCTIONS[k].name) || k }; });
  }
  function dvFnName(k){ var f = dvFns().filter(function(x){ return x.key === k; })[0]; return f ? f.name : ""; }
  function dvHolder(){ try { return typeof unitLikeWritable === "function" ? unitLikeWritable(place()) : null; } catch (e) { return null; } }
  /* The plan's Directions as they stand — what the chat may start from, and
     what a Capabilities chat says it serves. */
  function dvExisting(){
    var h = dvHolder(), items = (h && Array.isArray(h.items)) ? h.items : [];
    return items.filter(function(p){ return p && String(p.name || "").trim(); }).map(function(p){ return { id: String(p.id || ""), title: String(p.name).trim() }; });
  }
  function dvSave(patch, quiet){
    if (!dirsOn()) return;
    if (busy) { DVPEND = Object.assign(DVPEND || {}, patch); return; }
    var id = PANE.chat.id;
    act({ act:"dirSave", id:id, dirs:patch }, function(j){
      if (PANE && PANE.chat && PANE.chat.id === id) dvView(j);
      dvProgress(id);
      if (DVPEND) { var p = DVPEND; DVPEND = null; dvSave(p, quiet); return; }
      if (!quiet) draw();
    });
  }
  function dvAsk(body){
    if (!dirsOn() || THINKING) return;
    var id = PANE.chat.id;
    THINKING = id; SAY = ""; THINK_AT = Date.now();
    if (!WORK_TIMER) WORK_TIMER = setInterval(workTick, 500);
    draw();
    body.id = id; body.placeWord = placeWord(); body.context = swContext(); body.fns = dvFns();
    if (PANE.dirs.mode === "capabilities") body.dirTitles = dvExisting().map(function(x){ return x.title; });
    post(body, WAIT_MS).then(function(x){
      THINKING = null;
      if (x.st === 200 && x.j && x.j.ok) {
        if (PANE && PANE.chat && PANE.chat.id === id) { dvView(x.j); dvProgress(id); }
        draw(); return;
      }
      SAY = (x.j && x.j.why) || "That did not work. Nothing was lost — try again."; draw();
    }, function(err){
      THINKING = null;
      SAY = err && err.timedOut ? "This is taking too long, so the page stopped waiting. Try again in a moment."
        : "The server could not be reached. Nothing was lost — try again.";
      draw();
    });
  }
  function dvSideHtml(){
    var todo = PANE.dirsTodo || [], done = PANE.dirsDone || 0, n = todo.length;
    return '<aside class="copsw-side"><div class="copsw-box copsw-todo"><div class="copsw-todoh"><div class="copsw-bh"><b>To-do</b> <span class="copsw-n">' + done + '/' + n + '</span></div>' +
      '<div class="copsw-meter" role="progressbar" aria-valuemin="0" aria-valuemax="' + n + '" aria-valuenow="' + done + '"><i style="width:' + (n ? Math.round(done * 100 / n) : 0) + '%"></i></div></div>' +
      '<div class="copsw-tg"><ul>' + todo.map(function(t){
        return '<li class="copsw-li ' + t.state + '" data-cop-dv-todo="' + E(t.key) + '"><span class="copsw-dot" aria-hidden="true"></span>' +
          '<span class="copsw-lb"><span class="copsw-tt" title="' + E(t.status) + '"><span>' + E(t.title) + '</span></span><span class="copsw-ts">' + E(t.status) + '</span></span>' +
          '<span class="copsw-pill ' + t.state + '">' + (t.state === "done" ? "Done" : "To do") + '</span></li>';
      }).join("") + '</ul></div></div></aside>';
  }
  var DV_MARK = { plan:"Plan", yours:"Yours", "new":"New" };
  function dvMark(m){ return DV_MARK[m] ? ' <span class="copdv-mk ' + E(m) + '">' + DV_MARK[m] + '</span>' : ''; }
  function dvOwnerCell(kind, i, k, ed){
    if (!ed) return E(dvFnName(k) || "—");
    return '<select class="fld copdv-own" data-cop-dv-own="' + kind + '|' + i + '" aria-label="Owned by"><option value="">—</option>' +
      dvFns().map(function(f){ return '<option value="' + E(f.key) + '"' + (f.key === k ? ' selected' : '') + '>' + E(f.name) + '</option>'; }).join("") + '</select>';
  }
  function dvTick(attr, on, label, ed){
    return ed ? '<button type="button" class="copsw-tick' + (on ? " on" : "") + '" ' + attr + ' aria-pressed="' + on + '" aria-label="' + E(label) + '">&#10003;</button>'
      : '<span class="copsw-tick' + (on ? " on" : "") + '">&#10003;</span>';
  }
  function dvOptionsHtml(ed){
    var s = PANE.dirs, sc = PANE.dirsScores || [], max = (PANE.dirsWords || {}).max || 64;
    var parts = ["urgency","importance","ease"], word = { urgency:"Urgency", importance:"Importance", ease:"Ease" };
    return '<div class="copcp-wrap"><table class="copcp-tab copdv-tab"><thead><tr><th scope="col">Possible Direction</th>' +
      parts.map(function(p){ return '<th scope="col">' + word[p] + '</th>'; }).join("") +
      '<th scope="col" title="Urgency × Importance × Ease, out of ' + max + '">Score</th><th scope="col">Owned by</th><th scope="col">Go ahead</th></tr></thead><tbody>' +
      s.options.map(function(o, i){
        return '<tr' + (o.go ? ' class="on"' : '') + '><th scope="row">' + E(o.title) + dvMark(o.mark) + '</th>' +
          parts.map(function(p){
            var n = o[p] ? String(o[p]) : "–";
            return '<td>' + (ed ? '<button type="button" class="copcp-sc" data-cop-dv-sc="' + i + '|' + p + '" title="Press to change: 1 to 4" aria-label="' + E(o.title + ", " + word[p]) + ': ' + n + '">' + n + '</button>'
              : '<span class="copcp-sc">' + n + '</span>') + '</td>';
          }).join("") +
          '<td class="copdv-score">' + (sc[i] == null ? "–" : E(String(sc[i]))) + '</td>' +
          '<td>' + dvOwnerCell("o", i, o.ownedBy, ed) + '</td>' +
          '<td>' + dvTick('data-cop-dv-go="' + i + '"', !!o.go, "Go ahead with " + o.title, ed) + '</td></tr>';
      }).join("") + '</tbody></table></div>';
  }
  function dvCapsHtml(ed){
    var s = PANE.dirs, W = PANE.dirsWords || {}, kinds = W.kinds || ["gap","transformation","enabler"], kw = W.kindWord || {};
    return '<div class="copcp-wrap"><table class="copcp-tab copdv-tab"><thead><tr><th scope="col">Capability</th><th scope="col">Kind</th><th scope="col">Serves</th><th scope="col">Owned by</th><th scope="col">Keep</th></tr></thead><tbody>' +
      s.caps.map(function(x, i){
        var kind = ed ? '<select class="fld copdv-own" data-cop-dv-kind="' + i + '" aria-label="Kind of ' + E(x.title) + '"><option value="">—</option>' +
            kinds.map(function(k){ return '<option value="' + E(k) + '"' + (k === x.kind ? ' selected' : '') + '>' + E(kw[k] || k) + '</option>'; }).join("") + '</select>'
          : E(kw[x.kind] || "—");
        return '<tr' + (x.keep ? ' class="on"' : '') + '><th scope="row">' + E(x.title) + dvMark(x.mark) + '</th><td>' + kind + '</td>' +
          '<td class="copdv-serves">' + (x.serves.length ? x.serves.map(function(t){ return '<span class="copdv-chip">' + E(t) + '</span>'; }).join("") : "—") + '</td>' +
          '<td>' + dvOwnerCell("c", i, x.ownedBy, ed) + '</td>' +
          '<td>' + dvTick('data-cop-dv-keep="' + i + '"', !!x.keep, "Keep " + x.title, ed) + '</td></tr>';
      }).join("") + '</tbody></table></div>' +
      '<p class="copnote">' + kinds.map(function(k){ return '<b>' + E(kw[k] || k) + '</b>: ' + E(((W.kindSays || {})[k]) || ""); }).join(" ") + '</p>';
  }
  /* The ask box and "+ Add my own" are one control in two moods: a line of
     your own goes to the model to be scored beside the rest. */
  function dvAskHtml(what, busyHere){
    var id = PANE.chat.id;
    return '<div class="copopts"><button type="button" class="copopt" data-cop-dv-more="' + what + '"' + (busyHere ? ' disabled' : '') + '>Suggest more</button>' +
      '<button type="button" class="copopt" data-cop-dv-add="' + what + '">+ Add my own</button></div>' +
      (DVADD[id] === what ? '<div class="copcp-ask"><input class="fld" data-cop-dv-owntitle value="' + E(DVOWN[id] || "") + '" placeholder="' + (what === "caps" ? "A Capability of your own" : "A Direction of your own") + '" aria-label="Your own">' +
        '<button type="button" class="copbtn" data-cop-dv-addgo="' + what + '"' + (busyHere ? ' disabled' : '') + '>Add</button></div>' : '') +
      '<div class="copcp-ask"><textarea class="fld" data-cop-dv-ask rows="2" placeholder="Ask for something — a couple more, or a different angle" aria-label="Ask the Copilot">' + E(DVASK[id] || "") + '</textarea>' +
      '<button type="button" class="copbtn" data-cop-dv-send="' + what + '"' + (busyHere ? ' disabled' : '') + '>Send</button></div>';
  }
  function dirsHtml(){
    var s = PANE.dirs, ed = canEdit() && !s.saved, id = PANE.chat.id, busyHere = THINKING === id;
    var head = '<div class="copvline"><b>' + E(PANE.chat.title || dvTitle(s.mode)) + '</b> · ' + (s.saved ? "saved" : "in progress") + '</div>';
    var work = busyHere ? '<div class="copmsg product copworking" role="status"><div class="copbody"><span data-cop-wword>' + E(workWord()) + '</span><span class="copdots" aria-hidden="true"><i></i><i></i><i></i></span></div></div>' : '';
    var main = '', g = s.options.filter(function(o){ return o.go; }), k = s.caps.filter(function(x){ return x.keep; });
    var reply = s.reply ? cpMsg("ai", E(s.reply)) : '';
    if (s.mode === "directions") {
      if (s.start === "") {
        main = cpMsg("ai", 'The plan already has <b>' + s.hadPlan + '</b> ' + (s.hadPlan === 1 ? "Direction" : "Directions") + '. Start from them, or start fresh?') +
          (ed && !busyHere ? '<div class="copopts"><button type="button" class="copopt rec" data-cop-dv-start="plan">Start from the existing ones</button>' +
            '<button type="button" class="copopt" data-cop-dv-start="fresh">Start fresh</button></div>' : '');
      } else if (!s.options.length) {
        main = cpMsg("ai", 'I will suggest the Directions ' + E(placeWord()) + ' could take, from the plan as it stands, and score each by Urgency × Importance × Ease.') +
          (ed && !busyHere ? '<div class="copopts"><button type="button" class="copopt rec" data-cop-dv-suggest>Suggest Directions</button></div>' : '');
      } else {
        main = cpMsg("ai", 'Here are ' + s.options.length + ' possible Directions, each scored out of ' + E(String((PANE.dirsWords || {}).max || 64)) + '. Change any score, set who owns it, and tick what goes ahead.') + reply +
          dvOptionsHtml(ed);
        if (ed && !s.chose) main += '<div class="copopts"><button type="button" class="copopt rec" data-cop-dv-go-all' + (g.length ? '' : ' aria-disabled="true" title="Tick at least one Direction first"') + '>Go ahead with the ' + g.length + ' ticked</button></div>' +
          dvAskHtml("dirs", busyHere);
        if (s.chose) {
          main += cpMsg("me", "Go ahead with these " + g.length + ".");
          if (s.withCaps) {
            main += cpMsg("ai", g.length + (g.length === 1 ? " Direction" : " Directions") + " chosen. Next, the Capabilities we need to deliver them.");
            if (!s.caps.length) main += ed && !busyHere ? '<div class="copopts"><button type="button" class="copopt rec" data-cop-dv-caps>Suggest Capabilities</button></div>' : '';
            else main += dvCapsHtml(ed) + (ed ? dvAskHtml("caps", busyHere) : '');
          }
        }
      }
    } else {
      var have = dvExisting();
      main = cpMsg("ai", have.length ? 'I read your <b>' + have.length + '</b> saved ' + (have.length === 1 ? "Direction" : "Directions") + ' and the SWOT. These are the Capabilities I would build to deliver them.'
        : 'This place has no saved Directions yet, so I will work from the SWOT alone.');
      if (!s.caps.length) main += ed && !busyHere ? '<div class="copopts"><button type="button" class="copopt rec" data-cop-dv-caps>Suggest Capabilities</button></div>' : '';
      else main += reply + dvCapsHtml(ed) + (ed ? dvAskHtml("caps", busyHere) : '');
    }
    if (ed && (s.mode === "capabilities" ? s.caps.length : s.chose)) {
      var label = s.mode === "capabilities" ? "Save " + k.length + (k.length === 1 ? " Capability" : " Capabilities")
        : "Save " + g.length + (g.length === 1 ? " Direction" : " Directions") + (s.withCaps ? " and " + k.length + (k.length === 1 ? " Capability" : " Capabilities") : "") + " to the plan";
      var why = PANE.dirsBlocker || "";
      main += '<div class="copbtns"><button type="button" class="copbtn solid" data-cop-dv-finish' + (why ? ' aria-disabled="true" title="' + E(why) + '"' : '') + '>' + E(label) + '</button></div>';
    }
    if (s.saved) main += cpMsg("product", "Saved as " + E(s.saved.title) + " v" + E(String(s.saved.n)) + ". It is on the plan.");
    return head + '<div class="copsw"><div class="copsw-main">' + main + work + '</div>' + dvSideHtml() + '</div>';
  }
  /* The plan is written after the press, the same order How we compete keeps
     (§35). A ticked Direction that came from the plan updates THAT pillar;
     a new one is a new pillar. A kept Capability is held by the function
     that owns it, and what it serves is stored as the pillars' ids. */
  function dvWritePlan(s){
    var h = dvHolder(), wroteD = 0, wroteC = 0, idOf = {};
    if (h && Array.isArray(h.items)) h.items.forEach(function(p){ if (p && p.name) idOf[String(p.name).trim().toLowerCase()] = p.id; });
    if (s.mode === "directions") {
      if (!h || !Array.isArray(h.items) || typeof addPillar !== "function") return { ok:false };
      s.options.filter(function(o){ return o.go; }).forEach(function(o){
        var p = o.planId ? h.items.filter(function(x){ return x && x.id === o.planId; })[0] : null;
        if (!p) p = addPillar(h);
        if (!p) return;
        p.name = o.title; p.urgency = o.urgency; p.importance = o.importance; p.ease = o.ease;
        if (o.ownedBy) p.ownedBy = o.ownedBy; else delete p.ownedBy;
        idOf[o.title.trim().toLowerCase()] = p.id; wroteD++;
      });
    }
    if ((s.mode === "capabilities" || s.withCaps) && typeof addCapability === "function" && typeof GROUP !== "undefined" && Array.isArray(GROUP.capabilities)) {
      s.caps.filter(function(x){ return x.keep; }).forEach(function(x){
        var c = x.planId ? GROUP.capabilities.filter(function(y){ return y && y.id === x.planId; })[0] : null;
        if (!c) c = addCapability(x.ownedBy || null);
        if (!c) return;
        c.name = x.title;
        if (x.ownedBy) c.fn = x.ownedBy;
        if (x.kind) c.capKind = x.kind; else delete c.capKind;
        var sv = x.serves.map(function(t){ return idOf[String(t).trim().toLowerCase()]; }).filter(Boolean);
        if (sv.length) c.serves = sv; else delete c.serves;
        wroteC++;
      });
    }
    return { ok:true, d:wroteD, c:wroteC };
  }
  function dvClick(ev){
    if (!dirsOn()) return false;
    var b, s = PANE.dirs, id = PANE.chat.id;
    if (!canEdit() || s.saved) return false;
    if ((b = hit(ev, "[data-cop-dv-start]"))) {
      var st = b.getAttribute("data-cop-dv-start");
      act({ act:"dirStart", id:id, start:st, existing: st === "plan" ? dvExisting() : [] }, function(j){
        if (PANE && PANE.chat && PANE.chat.id === id) dvView(j);
        dvProgress(id); draw();
        dvAsk({ act:"dirSuggest" });
      });
      return true;
    }
    if ((b = hit(ev, "[data-cop-dv-suggest]"))) { dvAsk({ act:"dirSuggest" }); return true; }
    if ((b = hit(ev, "[data-cop-dv-caps]"))) { dvAsk({ act:"capSuggest" }); return true; }
    if ((b = hit(ev, "[data-cop-dv-sc]"))) {
      if (THINKING) return true;
      var p = b.getAttribute("data-cop-dv-sc").split("|"), g = dvCopy(), o = g.options[+p[0]];
      if (!o) return true;
      o[p[1]] = ((Number(o[p[1]]) || 0) % 4) + 1;
      PANE.dirs = g; draw(); dvSave({ options: g.options });
      return true;
    }
    if ((b = hit(ev, "[data-cop-dv-go]"))) {
      var g2 = dvCopy(), o2 = g2.options[+b.getAttribute("data-cop-dv-go")];
      if (!o2) return true;
      o2.go = !o2.go; PANE.dirs = g2; draw(); dvSave({ options: g2.options });
      return true;
    }
    if ((b = hit(ev, "[data-cop-dv-keep]"))) {
      var g3 = dvCopy(), x3 = g3.caps[+b.getAttribute("data-cop-dv-keep")];
      if (!x3) return true;
      x3.keep = !x3.keep; PANE.dirs = g3; draw(); dvSave({ caps: g3.caps });
      return true;
    }
    if ((b = hit(ev, "[data-cop-dv-go-all]"))) {
      if (!s.options.some(function(o){ return o.go; })) { SAY = "Tick at least one Direction first."; draw(); return true; }
      act({ act:"dirSave", id:id, dirs:{ chose:true } }, function(j){
        if (PANE && PANE.chat && PANE.chat.id === id) dvView(j);
        dvProgress(id); draw();
        if (PANE.dirs.withCaps && !PANE.dirs.caps.length) dvAsk({ act:"capSuggest" });
      });
      return true;
    }
    if ((b = hit(ev, "[data-cop-dv-more]"))) { dvAsk({ act: b.getAttribute("data-cop-dv-more") === "caps" ? "capSuggest" : "dirMore" }); return true; }
    if ((b = hit(ev, "[data-cop-dv-add]"))) {
      var w = b.getAttribute("data-cop-dv-add"); DVADD[id] = DVADD[id] === w ? null : w; draw();
      var bx = document.querySelector("[data-cop-dv-owntitle]"); if (bx) bx.focus();
      return true;
    }
    if ((b = hit(ev, "[data-cop-dv-addgo]"))) {
      var t = String(DVOWN[id] || "").trim();
      if (!t) { var bx2 = document.querySelector("[data-cop-dv-owntitle]"); if (bx2) bx2.focus(); return true; }
      DVOWN[id] = ""; DVADD[id] = null;
      dvAsk({ act: b.getAttribute("data-cop-dv-addgo") === "caps" ? "capSuggest" : "dirMore", own:[t] });
      return true;
    }
    if ((b = hit(ev, "[data-cop-dv-send]"))) {
      var q = String(DVASK[id] || "").trim();
      if (!q) { var bx3 = document.querySelector("[data-cop-dv-ask]"); if (bx3) bx3.focus(); return true; }
      DVASK[id] = "";
      dvAsk({ act: b.getAttribute("data-cop-dv-send") === "caps" ? "capSuggest" : "dirMore", ask:q });
      return true;
    }
    if ((b = hit(ev, "[data-cop-dv-finish]"))) {
      if (THINKING) return true;
      if (PANE.dirsBlocker) { SAY = PANE.dirsBlocker; draw(); return true; }
      act({ act:"dirFinish", id:id, placeWord:placeWord(), fns:dvFns() }, function(j){
        if (PANE && PANE.chat && PANE.chat.id === id) dvView(j);
        dvProgress(id);
        var r = dvWritePlan(PANE.dirs);
        SAY = r.ok ? "" : "Saved as a deliverable. The plan could not be written from here — this place does not plan in Directions.";
        LISTS[key()] = null; loadList(true);
        if (r.ok && typeof paint === "function") paint(); else draw();
      });
      return true;
    }
    return false;
  }
  function dvNew(mode){
    act({ act:"newDirections", place: place(), mode: mode, title: dvTitle(mode),
          withCaps: mode === "directions" && dvCapsHere(), hadPlan: dvExisting().length }, function(j){
      var l = list(); if (l && l.chats) l.chats.unshift(j.chat);
      PANE = { id: j.chat.id, chat: j.chat, messages: [] };
      dvView(j);
      OPEN[key()] = { kind:"chat", id: j.chat.id };
      if (!RAILKEPT && !railShut()) setRail(true);
      draw();
      if (PANE.dirs && PANE.dirs.start === "fresh") dvAsk({ act: mode === "capabilities" ? "capSuggest" : "dirSuggest" });
    });
  }
  /* Where capabilities are chosen (spec §4.5): inside the Directions chat
     when Structure keeps them in the company plan, in a section of their own
     when they are a layer. One answer, asked of the shared rule. */
  function dvCapsHere(){ try { return !!SMPRules.capAtTop(GROUP); } catch (e) { return true; } }

  /* ══ EXECUTION (spec 064 §6, §495; mockup panel F) ═════════════════════
     The period first, then each Direction and Capability in turn: its
     measures with a target for the period, and its tactics with an owner and
     the quarters they run in — only the period's quarters are offered. The
     shape of the Directions chat's code (§494): every press saved through one
     act, the model asked by one, the plan written after the save press. */
  var EXPEND = null, EXASK = {}, EXPICK = {};
  function execOn(){ return !!(PANE && PANE.chat && PANE.exec); }
  function exView(j){ ["exec","execTodo","execDone","execBlocker","execWords"].forEach(function(k){ if (j && k in j) PANE[k] = j[k]; }); }
  function exCopy(){ return JSON.parse(JSON.stringify(PANE.exec)); }
  function exProgress(id){ var l = list(); if (l && l.swotProgress && PANE && PANE.execTodo) l.swotProgress[id] = { done: PANE.execDone, of: PANE.execTodo.length }; }
  /* The plan's Directions and the capabilities this place holds, as the
     items the chat walks. */
  function exItems(){
    var out = dvExisting().map(function(d){
      var h = dvHolder(), p = h && h.items ? h.items.filter(function(x){ return x && x.id === d.id; })[0] : null;
      return { kind:"direction", planId: d.id, title: d.title, ownedBy: p && p.ownedBy ? dvFnName(p.ownedBy) : "" };
    });
    if (place() === "group" && dvCapsHere() && typeof GROUP !== "undefined" && Array.isArray(GROUP.capabilities))
      GROUP.capabilities.forEach(function(c){ if (c && String(c.name || "").trim()) out.push({ kind:"capability", planId: String(c.id), title: String(c.name).trim(), ownedBy: c.fn ? dvFnName(c.fn) : "" }); });
    return out;
  }
  function exSave(patch){
    if (!execOn()) return;
    if (busy) { EXPEND = patch; return; }
    var id = PANE.chat.id;
    act({ act:"execSave", id:id, exec:patch }, function(j){
      if (PANE && PANE.chat && PANE.chat.id === id) exView(j);
      exProgress(id);
      if (EXPEND) { var p = EXPEND; EXPEND = null; exSave(p); return; }
      draw();
    });
  }
  function exAsk(ask){
    if (!execOn() || THINKING) return;
    var id = PANE.chat.id;
    THINKING = id; SAY = ""; THINK_AT = Date.now();
    if (!WORK_TIMER) WORK_TIMER = setInterval(workTick, 500);
    draw();
    post({ act:"execDraft", id:id, exec: exCopy(), ask: ask || "", placeWord: placeWord(), context: swContext() }, WAIT_MS).then(function(x){
      THINKING = null;
      if (x.st === 200 && x.j && x.j.ok) { if (PANE && PANE.chat && PANE.chat.id === id) { exView(x.j); exProgress(id); } draw(); return; }
      SAY = (x.j && x.j.why) || "That did not work. Nothing was lost — try again."; draw();
    }, function(err){
      THINKING = null;
      SAY = err && err.timedOut ? "This is taking too long, so the page stopped waiting. Try again in a moment." : "The server could not be reached. Nothing was lost — try again.";
      draw();
    });
  }
  function exSideHtml(){ var keep = [PANE.dirsTodo, PANE.dirsDone]; PANE.dirsTodo = PANE.execTodo; PANE.dirsDone = PANE.execDone;
    var h = dvSideHtml(); PANE.dirsTodo = keep[0]; PANE.dirsDone = keep[1]; return h; }
  var EX_MONTHS = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
  function exPeriodAsk(ed){
    var w = PANE.execWords || {}, ch = w.choices || {}, pk = EXPICK[PANE.chat.id];
    var h = cpMsg("ai", "How long is this plan?");
    if (!ed) return h;
    h += '<div class="copopts"><button type="button" class="copopt" data-cop-ex-period="full">' + E(ch.fullWord || "Full year") + '</button>' +
      '<button type="button" class="copopt" data-cop-ex-period="rest">This quarter to year end — ' + E(ch.restWord || "") + '</button>' +
      '<button type="button" class="copopt" data-cop-ex-pick>Pick months</button></div>';
    if (pk) {
      var mo = function(attr, v){ return '<select class="fld copdv-own" ' + attr + '>' + EX_MONTHS.map(function(m, i){ return '<option value="' + (i + 1) + '"' + (i + 1 === v ? ' selected' : '') + '>' + m + '</option>'; }).join("") + '</select>'; };
      h += '<div class="copcp-ask copex-pick">From ' + mo('data-cop-ex-m1 aria-label="From month"', pk.m1) + ' to ' + mo('data-cop-ex-m2 aria-label="To month"', pk.m2) +
        ' <input class="fld copex-y" data-cop-ex-y value="' + E(String(pk.y)) + '" inputmode="numeric" aria-label="Year">' +
        '<button type="button" class="copbtn" data-cop-ex-pickgo>Use these months</button></div>';
    }
    return h;
  }
  function exItemHtml(it, k, ed){
    var w = PANE.execWords || {}, qs = w.quarters || [1,2,3,4], comp = w.compiles || ["Sum","Count","Latest","Average"];
    var mrow = function(m, i){ return '<tr><td>' + (ed ? '<input class="fld" data-cop-ex-m="' + i + '|name" value="' + E(m.name) + '" aria-label="Measure">' : E(m.name)) + '</td>' +
      '<td>' + (ed ? '<input class="fld" data-cop-ex-m="' + i + '|target" value="' + E(m.target) + '" aria-label="Target for the period">' : E(m.target || "—")) + '</td>' +
      '<td>' + (ed ? '<select class="fld copdv-own" data-cop-ex-m="' + i + '|compile" aria-label="Compile"><option value="">—</option>' + comp.map(function(c){ return '<option' + (c === m.compile ? ' selected' : '') + '>' + c + '</option>'; }).join("") + '</select>' : E(m.compile || "—")) + '</td>' +
      (ed ? '<td><button type="button" class="xbtn" data-cop-ex-mx="' + i + '" aria-label="Remove this measure">&times;</button></td>' : '') + '</tr>'; };
    var trow = function(t, i){ return '<tr><td>' + (ed ? '<input class="fld" data-cop-ex-t="' + i + '|name" value="' + E(t.name) + '" aria-label="Tactic">' : E(t.name)) + '</td>' +
      '<td>' + (ed ? '<input class="fld" data-cop-ex-t="' + i + '|owner" value="' + E(t.owner) + '" aria-label="Owner">' : E(t.owner || "—")) + '</td>' +
      '<td class="copex-qs">' + [1,2,3,4].map(function(q){ var inP = qs.indexOf(q) >= 0, on = t.quarters.indexOf(q) >= 0;
        return '<button type="button" class="copex-q' + (on ? " on" : "") + (inP ? "" : " off") + '"' + (ed && inP ? ' data-cop-ex-q="' + i + '|' + q + '"' : ' disabled') + ' aria-pressed="' + on + '" title="' + (inP ? "Q" + q : "Q" + q + " is outside the plan period") + '">Q' + q + '</button>'; }).join("") + '</td>' +
      (ed ? '<td><button type="button" class="xbtn" data-cop-ex-tx="' + i + '" aria-label="Remove this tactic">&times;</button></td>' : '') + '</tr>'; };
    return '<div class="copex-item" data-cop-ex-item="' + k + '"><div class="copvline"><b>' + E(it.title) + '</b> — ' + (it.kind === "capability" ? "Capability" : "Direction") + ' ' + (k + 1) + ' of ' + PANE.exec.items.length + (it.ownedBy ? ', owned by ' + E(it.ownedBy) : '') + '</div>' +
      '<div class="copcp-wrap"><table class="copcp-tab copex-t"><thead><tr><th>Measure</th><th>Target (period)</th><th>Compile</th>' + (ed ? '<th></th>' : '') + '</tr></thead><tbody>' + it.measures.map(mrow).join("") + '</tbody></table></div>' +
      (ed ? '<button type="button" class="linkbu" data-cop-ex-addm>+ Add a measure</button>' : '') +
      '<div class="copcp-wrap"><table class="copcp-tab copex-t"><thead><tr><th>Tactic</th><th>Owner</th><th>Quarters</th>' + (ed ? '<th></th>' : '') + '</tr></thead><tbody>' + it.tactics.map(trow).join("") + '</tbody></table></div>' +
      (ed ? '<button type="button" class="linkbu" data-cop-ex-addt>+ Add a tactic</button>' : '') + '</div>';
  }
  function execHtml(){
    var s = PANE.exec, ed = canEdit() && !s.saved, id = PANE.chat.id, busyHere = THINKING === id, w = PANE.execWords || {};
    var head = '<div class="copvline"><b>' + E(PANE.chat.title || "Execution") + '</b> · ' + (s.saved ? "saved" : "in progress") + '</div>';
    var work = busyHere ? '<div class="copmsg product copworking" role="status"><div class="copbody"><span data-cop-wword>' + E(workWord()) + '</span><span class="copdots" aria-hidden="true"><i></i><i></i><i></i></span></div></div>' : '';
    var main = '';
    if (!s.items.length) main = cpMsg("product", "This place's plan has no Directions or Capabilities yet. Choose them first, in the Directions section.");
    else if (!s.period) main = exPeriodAsk(ed);
    else {
      main = '<div class="copex-period" data-cop-ex-strip>This plan covers <b>' + E(w.period) + '</b>' + (ed ? ' · <button type="button" class="linkbu" data-cop-ex-change>Change</button>' : '') + '</div>' +
        (EXPICK[id] ? exPeriodAsk(ed) : '');
      var it = s.items[s.cursor];
      if (s.reply) main += cpMsg("ai", E(s.reply));
      main += exItemHtml(it, s.cursor, ed);
      if (ed && !busyHere) main += '<div class="copopts">' + (it.drafted ? '' : '<button type="button" class="copopt rec" data-cop-ex-draft>Draft measures and tactics</button>') +
        (s.cursor > 0 ? '<button type="button" class="copopt" data-cop-ex-go="-1">Back</button>' : '') +
        (s.cursor < s.items.length - 1 ? '<button type="button" class="copopt" data-cop-ex-go="1">Next</button>' : '') + '</div>' +
        '<div class="copcp-ask"><textarea class="fld" data-cop-ex-ask rows="2" placeholder="Ask for a change to these measures or tactics" aria-label="Ask the Copilot">' + E(EXASK[id] || "") + '</textarea>' +
        '<button type="button" class="copbtn" data-cop-ex-send>Send</button></div>';
      if (ed) { var why = PANE.execBlocker || "";
        main += '<div class="copbtns"><button type="button" class="copbtn solid" data-cop-ex-finish' + (why ? ' aria-disabled="true" title="' + E(why) + '"' : '') + '>Save to plan</button></div>'; }
    }
    if (s.saved) main += cpMsg("product", "Saved as " + E(s.saved.title) + " v" + E(String(s.saved.n)) + ". It is on the plan.");
    return head + '<div class="copsw"><div class="copsw-main">' + main + work + '</div>' + exSideHtml() + '</div>';
  }
  /* The plan is written after the save press (§35): the plan period onto
     the company, each Direction's measures and tactics onto its pillar, and a
     Capability's measures as its key objectives and its tactics as projects
     running from the first to the last month of their quarters. A row is
     matched by name and updated rather than added twice. */
  function exWritePlan(s){
    if (!s.period || typeof GROUP === "undefined") return { ok:false };
    var R = typeof SMPRules !== "undefined" ? SMPRules : null, p = s.period;
    if (R && R.monthLabel) { GROUP[R.PLAN_FROM || "planFrom"] = R.monthLabel(p.y * 12 + p.m1 - 1); GROUP[R.PLAN_TO || "planTo"] = R.monthLabel(p.y * 12 + p.m2 - 1); }
    var h = dvHolder(), wrote = 0, yy = String(p.y).slice(2);
    var find = function(list, name){ return list.filter(function(x){ return x && String(x.name || "").trim().toLowerCase() === name.toLowerCase(); })[0]; };
    s.items.forEach(function(it){
      if (it.kind === "direction") {
        var pl = h && Array.isArray(h.items) ? h.items.filter(function(x){ return x && x.id === it.planId; })[0] : null;
        if (!pl) return;
        it.measures.forEach(function(m){ var r = find(pl.measures || [], m.name) || addMeasure(pl); if (!r) return; r.name = m.name; r.target = m.target; if (m.compile) r.compile = m.compile; });
        it.tactics.forEach(function(t){ var r = find(pl.tactics || [], t.name) || addTactic(pl); if (!r) return; r.name = t.name; r.owner = t.owner;
          [1,2,3,4].forEach(function(q){ r["q" + q] = t.quarters.indexOf(q) >= 0 ? 1 : 0; }); });
        wrote++;
      } else {
        var c = Array.isArray(GROUP.capabilities) ? GROUP.capabilities.filter(function(x){ return x && String(x.id) === it.planId; })[0] : null;
        if (!c) return;
        it.measures.forEach(function(m){ var r = find(c.keyObjectives || [], m.name);
          if (!r) { r = { id: mintRowId(c.keyObjectives, c.id + "-KO"), name:"", dir:"≥", target:"", compile:"Latest", weight:null, actual:"", progress:null }; c.keyObjectives.push(r); }
          r.name = m.name; r.target = m.target; if (m.compile) r.compile = m.compile; });
        it.tactics.forEach(function(t){ var r = find(c.projects || [], t.name) || addProject(c); if (!r) return; r.name = t.name; r.owner = t.owner;
          if (t.quarters.length) { var a = (Math.min.apply(null, t.quarters) - 1) * 3, b = Math.max.apply(null, t.quarters) * 3 - 1;
            r.start = EX_MONTHS[a] + " " + yy; r.end = EX_MONTHS[b] + " " + yy; } });
        wrote++;
      }
    });
    return { ok:true, n:wrote };
  }
  function exItemPatch(f){ var g = exCopy(); f(g.items[g.cursor], g); PANE.exec = g; exSave(g); return true; }
  function exClick(ev){
    if (!execOn()) return false;
    var b, s = PANE.exec, id = PANE.chat.id;
    if (!canEdit() || s.saved) return false;
    if ((b = hit(ev, "[data-cop-ex-period]"))) { EXPICK[id] = null; act({ act:"execPeriod", id:id, choice: b.getAttribute("data-cop-ex-period") }, function(j){ exView(j); exProgress(id); draw(); }); return true; }
    if ((b = hit(ev, "[data-cop-ex-pick]")) || (b = hit(ev, "[data-cop-ex-change]"))) {
      var p = s.period || (PANE.execWords && PANE.execWords.choices && PANE.execWords.choices.full) || { y: new Date().getFullYear(), m1: 1, m2: 12 };
      EXPICK[id] = EXPICK[id] ? null : { y: p.y, m1: p.m1, m2: p.m2 }; draw(); return true;
    }
    if ((b = hit(ev, "[data-cop-ex-pickgo]"))) { var pk = EXPICK[id];
      act({ act:"execPeriod", id:id, period: pk }, function(j){ EXPICK[id] = null; exView(j); exProgress(id); draw(); }); return true; }
    if ((b = hit(ev, "[data-cop-ex-draft]"))) { exAsk(""); return true; }
    if ((b = hit(ev, "[data-cop-ex-send]"))) { var q = String(EXASK[id] || "").trim(); if (!q) return true; EXASK[id] = ""; exAsk(q); return true; }
    if ((b = hit(ev, "[data-cop-ex-go]"))) { var g = exCopy(); g.cursor = Math.max(0, Math.min(g.items.length - 1, g.cursor + (+b.getAttribute("data-cop-ex-go")))); g.reply = ""; PANE.exec = g; exSave(g); return true; }
    if ((b = hit(ev, "[data-cop-ex-addm]"))) return exItemPatch(function(it){ it.measures.push({ name:"New measure", target:"", compile:"" }); });
    if ((b = hit(ev, "[data-cop-ex-addt]"))) return exItemPatch(function(it){ it.tactics.push({ name:"New tactic", owner:"", quarters:[] }); });
    if ((b = hit(ev, "[data-cop-ex-mx]"))) { var mi = +b.getAttribute("data-cop-ex-mx"); return exItemPatch(function(it){ it.measures.splice(mi, 1); }); }
    if ((b = hit(ev, "[data-cop-ex-tx]"))) { var ti = +b.getAttribute("data-cop-ex-tx"); return exItemPatch(function(it){ it.tactics.splice(ti, 1); }); }
    if ((b = hit(ev, "[data-cop-ex-q]"))) { var qp = b.getAttribute("data-cop-ex-q").split("|");
      return exItemPatch(function(it){ var t = it.tactics[+qp[0]], q2 = +qp[1], at = t.quarters.indexOf(q2); if (at >= 0) t.quarters.splice(at, 1); else t.quarters.push(q2); t.quarters.sort(); }); }
    if ((b = hit(ev, "[data-cop-ex-finish]"))) {
      if (THINKING) return true;
      if (PANE.execBlocker) { SAY = PANE.execBlocker; draw(); return true; }
      act({ act:"execFinish", id:id, placeWord: placeWord() }, function(j){
        if (PANE && PANE.chat && PANE.chat.id === id) exView(j);
        exProgress(id);
        var r = exWritePlan(PANE.exec);
        SAY = r.ok ? "" : "Saved as a deliverable. The plan could not be written from here.";
        LISTS[key()] = null; loadList(true);
        if (r.ok && typeof paint === "function") paint(); else draw();
      });
      return true;
    }
    return false;
  }
  /* A typed field writes when the cursor leaves it (§35): the `change` of a
     measure's or a tactic's box, and the months picked. */
  function exChange(ev){
    if (!execOn() || !canEdit() || PANE.exec.saved) return false;
    var el = ev.target, id = PANE.chat.id, a;
    if ((a = el.getAttribute && el.getAttribute("data-cop-ex-m"))) { var p = a.split("|"); return exItemPatch(function(it){ it.measures[+p[0]][p[1]] = el.value; }); }
    if ((a = el.getAttribute && el.getAttribute("data-cop-ex-t"))) { var p2 = a.split("|"); return exItemPatch(function(it){ it.tactics[+p2[0]][p2[1]] = el.value; }); }
    var pk = EXPICK[id]; if (!pk) return false;
    if (el.hasAttribute && el.hasAttribute("data-cop-ex-m1")) { pk.m1 = +el.value; return true; }
    if (el.hasAttribute && el.hasAttribute("data-cop-ex-m2")) { pk.m2 = +el.value; return true; }
    if (el.hasAttribute && el.hasAttribute("data-cop-ex-y")) { pk.y = +el.value; return true; }
    return false;
  }
  function exNew(){
    act({ act:"newExecution", place: place(), title: "Execution — " + placeWord(), items: exItems() }, function(j){
      var l = list(); if (l && l.chats) l.chats.unshift(j.chat);
      PANE = { id: j.chat.id, chat: j.chat, messages: [] };
      exView(j);
      OPEN[key()] = { kind:"chat", id: j.chat.id };
      if (!RAILKEPT && !railShut()) setRail(true);
      draw();
    });
  }
  function openItem(kind, id){
    OPEN[key()] = { kind: kind, id: id }; EDIT = null;
    /* A chat opening folds the chats rail to its strip (§490.2) — unless
       the person has opened it again themselves this visit; then it stays. */
    if (kind === "chat" && !RAILKEPT && !railShut()) setRail(true);
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
    var sa = hit(ev, "[data-cop-sw-ans]");
    if (sa && swotOn()) { var sp = sa.getAttribute("data-cop-sw-ans").split("|"); var aa = PANE.swot.ans[sp[0]] = (PANE.swot.ans[sp[0]] || []).slice(); aa[+sp[1]] = sa.value; }
    var sq = hit(ev, "[data-cop-sw-paste]"); if (sq) SWPASTE = sq.value;
    var at = hit(ev, "[data-cop-ad-text]"); if (at && advOn()) ADTXT[PANE.chat.id] = at.value;
    var ac = hit(ev, "[data-cop-ad-change]"); if (ac && advOn()) ADASK[PANE.chat.id] = ac.value;
    var ck = hit(ev, "[data-cop-cp-ask]"); if (ck && competeOn()) CPASKTXT[PANE.chat.id] = ck.value;
    var cc = hit(ev, "[data-cop-cp-cell]"); if (cc && competeOn()) cpCell(cc);
    var da = hit(ev, "[data-cop-dv-ask]"); if (da && dirsOn()) DVASK[PANE.chat.id] = da.value;
    var ea = hit(ev, "[data-cop-ex-ask]"); if (ea && execOn()) EXASK[PANE.chat.id] = ea.value;
    var dn = hit(ev, "[data-cop-dv-owntitle]"); if (dn && dirsOn()) DVOWN[PANE.chat.id] = dn.value;
    var fe = hit(ev, "[data-cop-sw-fe]");
    if (fe && SWEDIT) { var fp = fe.getAttribute("data-cop-sw-fe").split("|"); var ff = SWEDIT.data.items[+fp[0]].factors[+fp[1]]; if (ff) ff[fp[2]] = fe.value; }
  });
  /* An answer changed in its box is kept when the box is left, like every
     other field in the platform (§35) — not only when Draft is pressed. */
  document.addEventListener("change", function(ev){
    if (exChange(ev)) return;
    var sa = hit(ev, "[data-cop-sw-ans]");
    if (sa && swotOn() && canEdit() && !THINKING) { swSave(swCopy()); return; }
    var cc = hit(ev, "[data-cop-cp-cell]");
    if (cc && competeOn() && canEdit() && !THINKING && PANE.compete.table) { cpCell(cc); cpSave({ table: PANE.compete.table }, true); return; }
    var dw = hit(ev, "[data-cop-dv-own]");
    if (dw && dirsOn() && canEdit() && !PANE.dirs.saved) {
      var dp = dw.getAttribute("data-cop-dv-own").split("|"), dg = dvCopy(), dl = dp[0] === "c" ? dg.caps : dg.options, dr = dl[+dp[1]];
      if (dr) { dr.ownedBy = dw.value; PANE.dirs = dg; dvSave(dp[0] === "c" ? { caps: dg.caps } : { options: dg.options }); }
      return;
    }
    var dk = hit(ev, "[data-cop-dv-kind]");
    if (dk && dirsOn() && canEdit() && !PANE.dirs.saved) {
      var kg = dvCopy(), kr = kg.caps[+dk.getAttribute("data-cop-dv-kind")];
      if (kr) { kr.kind = dk.value; PANE.dirs = kg; dvSave({ caps: kg.caps }); }
      return;
    }
    var sf = hit(ev, "[data-cop-sw-file]");
    if (sf) { var sfile = sf.files && sf.files[0]; sf.value = ""; if (sfile) swUpload(sfile); return; }
    var sw = hit(ev, "[data-cop-sw-for]"); if (sw) { SWALL = sw.value === "all"; return; }
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
      /* The page stopped waiting (§472). What was typed is already kept on
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
    if (cpClick(ev)) return;
    if (adClick(ev)) return;
    if (dvClick(ev)) return;
    if (exClick(ev)) return;
    if (swClick(ev)) return;
    if ((b = hit(ev, "[data-cop-railtog]"))) { var sh = !railShut(); RAILKEPT = !sh; setRail(sh); return; }
    if ((b = hit(ev, "[data-cop-retry]"))) { loadList(true); return; }
    if ((b = hit(ev, "[data-cop-reopen]"))) { var o = OPEN[key()]; if (o) openItem(o.kind, o.id); return; }
    if ((b = hit(ev, "[data-cop-chat]"))) { SAY = ""; MENU = null; openItem("chat", b.getAttribute("data-cop-chat")); return; }
    if ((b = hit(ev, "[data-cop-deliv]"))) { SAY = ""; openItem("deliv", b.getAttribute("data-cop-deliv")); return; }
    if ((b = hit(ev, "[data-cop-newchat]"))) {
      /* A NEW FOUNDATION CHAT IS A FLOW (§478, Islam: "remove the guided
         button"). It opens on "start from what is there, or fresh?" where
         the place already has a Foundation, and on the four roads where it
         has none — the page knows which, because it holds the plan. */
      if (section() === "analysis") {
        act({ act:"newSwot", place: place(), title: swTitle(), fromPlan: planSwot() }, function(j){
          var l = list(); if (l && l.chats) l.chats.unshift(j.chat);
          OPEN[key()] = { kind:"chat", id: j.chat.id };
          openItem("chat", j.chat.id);
        });
        return;
      }
      if (section() === "directions" || section() === "capabilities") { dvNew(section()); return; }
      if (section() === "execution") { exNew(); return; }
      if (section() === "advisory") {
        act({ act:"newAdvisory", place: place(), title: adTitle() }, function(j){
          var l = list(); if (l && l.chats) l.chats.unshift(j.chat);
          PANE = { id: j.chat.id, chat: j.chat, messages: [] };
          adView(j);
          OPEN[key()] = { kind:"chat", id: j.chat.id };
          if (!RAILKEPT && !railShut()) setRail(true);
          draw(); var t = document.querySelector("[data-cop-ad-text]"); if (t) t.focus();
        });
        return;
      }
      if (section() === "compete") {
        act({ act:"newCompete", place: place(), title: cpTitle() }, function(j){
          var l = list(); if (l && l.chats) l.chats.unshift(j.chat);
          PANE = Object.assign({ id: j.chat.id, chat: j.chat, messages: [] }, {});
          cpView(j);
          OPEN[key()] = { kind:"chat", id: j.chat.id };
          if (!RAILKEPT && !railShut()) setRail(true);
          draw();
          cpAsk({ act:"competeScore" });
        });
        return;
      }
      if (section() === "foundation") {
        act({ act:"newFlow", place: place(), title: fname(), hasPlan: planHas(planParts()), skip: skipNow() }, function(j){
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
