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
   so the numbers match Performance; playback before a draft; missing input
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
  function post(body){
    return fetch(url("api"), { method:"POST", cache:"no-store", credentials:"same-origin",
      headers:{ "Content-Type":"application/json" }, body: JSON.stringify(body) })
      .then(function(r){ return r.json().then(function(j){ return { st:r.status, j:j }; }, function(){ return { st:r.status, j:null }; }); });
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
    return '<div class="coppane" data-cop-pane>' +
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
  function chatsHead(){
    return archView() ? '<span>Archived chats</span>'
      : '<span>Chats</span>' + (canEdit() ? '<button type="button" class="copnew" data-cop-newchat>+ New chat</button>' : '');
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
    if (!rows.length) return head + '<div class="copnone">' + (arch ? "Nothing archived." : "No chats here yet.") + '</div>';
    var o = OPEN[key()] || {};
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
          '<span class="copm">' + E(nameOf(c.by)) + ' · ' + E(when(c.last)) + '</span></button>' +
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
    return say + (o.kind === "chat" ? chatHtml() : delivHtml());
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
  function answerHtml(m, last){
    var p = m.part || {};
    var h = m.body ? '<div class="copbody">' + E(m.body) + '</div>' : '';
    if (p.playback) {
      var pb = p.playback, row = function(k, v){ return v ? '<dt>' + k + '</dt><dd>' + E(v) + '</dd>' : ''; };
      h += '<dl class="copplay">' + row("Understood", pb.understood) + row("Working from", pb.workingFrom) + row("Missing", pb.missing) + '</dl>';
    }
    if (p.missing && p.missing.length) h += '<div class="copmiss"><b>Missing</b><ul>' + p.missing.map(function(x){ return '<li>' + E(x) + '</li>'; }).join("") + '</ul></div>';
    if (p.draft && p.draft.groups) {
      h += '<div class="copdraft">' + (p.draft.title ? '<div class="copdt">' + E(p.draft.title) + '</div>' : '') +
        '<div class="copdg">' + p.draft.groups.map(function(g){
          return '<div class="copgrp"><div class="copgt">' + E(g.title) + '</div><ul>' +
            g.items.map(itemHtml).join("") + '</ul></div>';
        }).join("") + '</div></div>';
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
        return '<button type="button" class="copopt' + (o.recommended ? " rec" : "") + '" data-cop-reply="' + E(o.label) + '">' +
          E(o.label) + (o.recommended ? ' <span class="coprec">(recommended)</span>' : '') + '</button>';
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
    }).join("") + (THINKING === c.id ? '<div class="copmsg product" role="status"><div class="copbody">The Copilot is working on it…</div></div>' : '');
    var ctx = contextOf();
    var pend = canEdit() ? (PANE.pending || []).map(function(f){ return fileChip(f, true); }).join("") : "";
    return '<div class="copchat" data-cop-chatbox style="--copz:' + ZOOMS[zi()] + '">' +
      '<div class="copctx" title="' + E(ctx.detail || ctx.line) + '">' + INFO + '<span>' + E(ctx.line) + '</span></div>' +
      '<div class="copheadrow">' + head + sizeHtml() + '</div>' +
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
  var VIEWONLY = '<div class="copviewonly" data-cop-viewonly><span>View only</span></div>';
  function composerHtml(c, pend){
    var text = DRAFT[c.id] || "";
    return '<div class="copcompose">' +
      '<div class="copbox">' +
        '<textarea data-cop-text rows="1" placeholder="' + (pend ? "Say what this file is for…" : "Ask about " + E(placeWord()) + "’s " + E(sectionWord().toLowerCase()) + "…") + '" aria-label="Message">' + E(text) + '</textarea>' +
        '<button type="button" class="copsend" data-cop-send aria-label="Send" title="Send"' + (THINKING === c.id || (!text.trim() && !pend) ? ' disabled' : '') + '>' + SENDMARK + '</button>' +
      '</div>' +
      '<div class="copunder">' +
        '<button type="button" class="copclip" data-cop-attach aria-label="Attach a Word, PDF or Excel file" title="Attach a Word, PDF or Excel file (up to 3 MB)">' + CLIP + '</button>' +
        '<input type="file" hidden data-cop-file accept=".docx,.pdf,.xlsx,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet">' +
        '<span class="cophint">Enter sends · Shift + Enter for a new line</span>' +
      '</div></div>';
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
    getJ(kind === "chat" ? "chat" : "deliverable", ["id=" + encodeURIComponent(id)]).then(function(x){
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
    var n = hit(ev, "[data-cop-edit-note]"); if (n && EDIT) EDIT.note = n.value;
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
    var ctx = contextOf();
    if (forced == null) { DRAFT[id] = ""; if (t) t.value = ""; }
    PANE.messages = PANE.messages.concat([{ id:"new", who:"person", by: (typeof SYNC !== "undefined" && SYNC.actingAs && SYNC.actingAs()) || "",
      body:text, part:{ kind:"said", files:files }, at:new Date().toISOString() }]);
    PANE.pending = [];
    THINKING = id; SAY = ""; draw();
    post({ act:"say", id:id, text:text, fileIds: files.map(function(f){ return f.id; }),
           context: ctx.line + (ctx.detail ? "\n" + ctx.detail : "") + (ctx.text ? "\n\nTHE PLAN AS WRITTEN:\n" + ctx.text : ""), placeWord: placeWord() }).then(function(x){
      THINKING = null;
      if (x.st === 200 && x.j && x.j.ok) {
        if (PANE && PANE.chat && PANE.chat.id === id) { PANE.messages = x.j.messages || PANE.messages; PANE.assumptions = x.j.assumptions || []; }
        loadList(true); draw(); return;
      }
      SAY = (x.j && x.j.why) || "That did not send. Nothing was lost — try again.";
      if (forced == null) DRAFT[id] = text;
      openItem("chat", id);
    }, function(){
      THINKING = null; SAY = "The server could not be reached. What you typed is back in the box — try again.";
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
    if ((b = hit(ev, "[data-cop-retry]"))) { loadList(true); return; }
    if ((b = hit(ev, "[data-cop-reopen]"))) { var o = OPEN[key()]; if (o) openItem(o.kind, o.id); return; }
    if ((b = hit(ev, "[data-cop-chat]"))) { SAY = ""; MENU = null; openItem("chat", b.getAttribute("data-cop-chat")); return; }
    if ((b = hit(ev, "[data-cop-deliv]"))) { SAY = ""; openItem("deliv", b.getAttribute("data-cop-deliv")); return; }
    if ((b = hit(ev, "[data-cop-newchat]"))) {
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
