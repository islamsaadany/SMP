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
    { k:"compete",    label:"Competitive Discipline" },
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
      if (s.k === "capabilities") return false;  /* §544.13 */
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
  /* The product's one day writer (§537). This had its own month array and
     its own four-digit year, so a deliverable dated beside anything else on
     screen read "11 Mar 2026" next to "11 Mar 26". */
  function when(iso){ return dateDay(iso); }

  /* ── THE PANE ────────────────────────────────────────────────────────── */
  function renderPane(){
    setTimeout(function(){ loadList(false); }, 0);
    var shut = railFolded();
    return '<div class="coppane' + (shut ? " copshut" : "") + '" data-cop-pane>' +
      '<div class="copslim"><button type="button" class="coptog" data-cop-railtog aria-expanded="' + !shut + '" aria-label="Show chats and deliverables" title="Show chats and deliverables">' + TOGMARK + '</button>' +
        (canEdit() ? '<button type="button" class="coptog" data-cop-home aria-label="New chat" title="New chat">+</button>' : '') + '</div>' +
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
    var tog = '<button type="button" class="coptog cophtog" data-cop-railtog aria-expanded="' + !railFolded() + '" aria-label="Hide chats and deliverables" title="Hide chats and deliverables">' + TOGMARK + '</button>';
    return archView() ? tog + '<span class="coprhl">Archived chats</span>'
      : tog + '<span class="coprhl">Chats</span>' + (canEdit() ? '<button type="button" class="copnew" data-cop-home>+ New chat</button>' : '');
  }
  /* §639 A NEW CHAT STARTS ON ONE SCREEN (Islam chose C of the signed-off
     design-mockups/copilot-start/2026-10-25_free-chat-entry.html, asking
     "why isn't free chat one of the options inside the creation options …
     to be more consistent?"). It replaces §633's menu of two. The screen is
     what an area opens on and what "+ New chat" brings back: a box to just
     ask — typing in it IS a free chat — and, under it, the area's own ways
     to start, step by step. Foundation's are its four roads, taken at once;
     every other area's is its workflow, whose own ways (a SWOT's notes and
     templates) live inside it. */
  var WORKFLOW_WORD = { foundation:"Foundation workflow", analysis:"SWOT workflow", compete:"Competitive Discipline workflow",
    directions:"Directions workflow", capabilities:"Capabilities workflow", execution:"Execution workflow", advisory:"Advisory workflow" };
  var STARTS = {
    analysis: ["SWOT, step by step", "The internal, micro and macro analyses, then the SWOT."],
    compete: ["Score the value disciplines", "Market and internal factors, then the value proposition."],
    directions: ["Suggest and score Directions", "From the SWOT and the discipline, scored Urgency × Importance × Ease."],
    capabilities: ["Choose Capabilities", "What the chosen Directions need, each with an owner."],
    execution: ["Build from the Directions", "The period, then measures and tactics drafted for each of the plan’s Directions and Capabilities. What the plan holds is shown on the cards and replaced on Apply."],
    advisory: ["Bring a decision", "A few questions, then a decision brief."]
  };
  var STARTTEXT = {};            /* place|section → what is half typed in the start box */
  /* §640 THE BOX TAKES THE MATERIAL (Islam: "don't you think that uploading
     raw notes or importing a finished foundation is a form of free chat?";
     design-mockups/copilot-start/2026-10-25_box-takes-material.html, signed
     off). Notes attached or finished work pasted go in the box and open a
     free chat, which says what it found and offers to structure it (Copilot
     settings › Free chat). So the cards keep only the roads that really
     differ: in Foundation, the guided questions and the template. */
  var STARTROADS = ["guided", "template"];
  var BOXWORK = { foundation:"a finished Foundation", analysis:"an earlier SWOT or analysis", compete:"your value proposition",
    directions:"your Directions", capabilities:"your Capabilities", execution:"your plan", advisory:"the papers behind your decision" };
  /* §653 — START FROM THE EXISTING PLAN is a card on the start screen, first
     and marked, shown only where the plan holds the thing (Islam: "another
     card can appear: start from the existing plan, and it only appears if
     there is something already in the plan"). It replaces the question each
     area asked inside the chat one step later (§478, the SWOT's, Directions'). */
  var PLANMARK = '<path d="M4 4h16v16H4z"/><path d="M8 9h8M8 13h8M8 17h5"/>';
  function planCardHtml(s){
    var attr, meta;
    if (s === "foundation") { var pp = planParts(), off = skipNow(), n = Object.keys(pp).filter(function(k){ return pp[k] && (!Array.isArray(pp[k]) || pp[k].length) && off.indexOf(k) < 0; }).length; if (!n) return ""; attr = 'data-cop-road="plan"'; meta = n + (n === 1 ? " part" : " parts"); }
    else if (s === "analysis") { var sw = planSwot(), ln = LETTERS.reduce(function(k, L){ return k + ((sw[L] || []).length); }, 0); if (!ln) return ""; attr = 'data-cop-newplan="analysis"'; meta = ln + (ln === 1 ? " line" : " lines"); }
    else if (s === "directions") { var nd = dvExisting().length; if (!nd) return ""; attr = 'data-cop-newplan="directions"'; meta = nd + (nd === 1 ? " Direction" : " Directions"); }
    /* §695 S11 — the same card for Competitive Discipline (the plan's
       discipline and values come in as the table) and for Execution, where it
       reads "Refine the existing execution": the measures and tactics the
       plan holds, on each card, drafts adding to them. */
    else if (s === "compete") { var cw = cpPlanHeld(); if (!cw) return ""; attr = 'data-cop-newplan="compete"'; meta = cpWord(cw.discipline) + " · " + cw.values.length + (cw.values.length === 1 ? " value" : " values");
      return '<button type="button" class="coppcard copplan" ' + attr + '>' + icon(PLANMARK) + '<span class="coppt"><span class="coptag">On the plan today</span>Start from the existing plan</span>' +
        '<span class="coppd">Load the discipline and the values the plan holds as the table, and change any part. Score the disciplines anew to check the choice. The plan moves only on Apply.</span><span class="copmeta">' + E(placeWord()) + "’s " + E(sectionWord()) + ' · ' + E(meta) + '</span></button>'; }
    else if (s === "execution") { var ei = exItems(), withL = ei.filter(function(it){ return it.measures.length || it.tactics.length; }).length; if (!withL) return ""; attr = 'data-cop-newplan="execution"';
      meta = withL + (withL === 1 ? " item" : " items") + " with measures · " + (ei.length - withL) + " without";
      return '<button type="button" class="coppcard copplan" ' + attr + '>' + icon(PLANMARK) + '<span class="coppt"><span class="coptag">On the plan today</span>Refine the existing execution</span>' +
        '<span class="coppd">Load the measures and tactics the plan holds, on each Direction’s and Capability’s card, and change any part; a draft adds to them. The plan moves only on Apply.</span><span class="copmeta">' + E(placeWord()) + "’s " + E(sectionWord()) + ' · ' + E(meta) + '</span></button>'; }
    else return "";
    return '<button type="button" class="coppcard copplan" ' + attr + '>' + icon(PLANMARK) +
      '<span class="coppt"><span class="coptag">On the plan today</span>Start from the existing plan</span>' +
      '<span class="coppd">Load what is on the plan and change any part. The plan moves only on Apply.</span><span class="copmeta">' + E(placeWord()) + "’s " + E(sectionWord()) + ' · ' + E(meta) + '</span></button>';
  }
  function startHtml(){
    var s = section(), area = placeWord() + "’s " + sectionWord();
    var cards = planCardHtml(s) + (s === "foundation"
      ? PATH_CARDS.filter(function(c){ return STARTROADS.indexOf(c.k) >= 0; }).map(function(c){ return '<button type="button" class="coppcard" data-cop-road="' + c.k + '">' + icon(c.i) +
          '<span class="coppt">' + E(c.t) + '</span><span class="coppd">' + E(c.d) + '</span></button>'; }).join("")
      : (function(c){ return '<button type="button" class="coppcard" data-cop-newchat>' + icon(PATH_CARDS[0].i) +
          '<span class="coppt">' + E(c[0]) + '</span><span class="coppd">' + E(c[1]) + '</span>' +
          /* §691 — THE SWOT'S FOUR WAYS IN, SAID ON ITS CARD (Islam: "A"; the
             mockup design-mockups/copilot-start/2026-10-29_swot-ways-in.html).
             They were one step on, in the methods grid, where someone bringing
             their reports could not see them. The chips are words, not buttons:
             the card is pressed as one, and the grid opens as before. */
          (s === "analysis" ? '<span class="copways" data-cop-ways>' + ["Guided questions", "Template", "Ready reports", "Deep research"].map(function(w){ return '<span class="copway">' + w + '</span>'; }).join("") + '</span>' +
            '<span class="copwaysk">Pick one or more per area at the next step.</span>' : '') + '</button>'; })(STARTS[s] || [WORKFLOW_WORD[s] || "Step by step", "Forefront's method, step by step."]));
    return '<div class="copstart" data-cop-startscreen>' +
      '<h2 class="copstarth">What would you like to do with ' + E(area) + '?</h2>' +
      '<div class="copbox copstartbox"><textarea data-cop-starttext rows="2" placeholder="Ask anything, attach your notes, or paste ' + E(BOXWORK[s] || "finished work") + '…" aria-label="Ask the Copilot, attach notes or paste work — this starts a free chat">' + E(STARTTEXT[key()] || "") + '</textarea>' +
        /* §683 — Send is not there until something is typed, on the start
           screen as in every chat (§652; Islam: "as we agreed, across all
           the parts"). */
        '<button type="button" class="copsend" data-cop-startsend aria-label="Start a free chat" title="Send"' + (String(STARTTEXT[key()] || "").trim() ? '' : ' hidden') + '>' + SENDMARK + '</button></div>' +
      '<div class="copunder copstartunder"><button type="button" class="copclip copstartclip" data-cop-startattach aria-label="Attach notes — a Word, PDF or Excel file" title="Attach notes — a Word, PDF or Excel file (up to 3 MB)">' + CLIP + '<span>Attach notes</span></button>' +
        '<input type="file" hidden data-cop-startfile accept=".docx,.pdf,.xlsx,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet">' +
        '<span class="cophint">Word, PDF or Excel · or paste · Enter sends</span></div>' +
      '<p class="copstartk">Typing, attaching or pasting here starts a free chat.</p>' +
      '<div class="copor">or start step by step</div>' + unfinishedHtml() +
      '<div class="coppaths copstartcards">' + cards + '</div></div>';
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
          '<span class="copm">' + E(nameOf(c.by)) + ' · ' + E(when(c.last)) + (c.guided ? ' · Guided' : '') + (c.free ? ' · Free chat' : '') + (function(){ var sp = (l.swotProgress || {})[c.id]; return sp ? ' · ' + sp.done + ' of ' + sp.of + ' done' : ''; })() + '</span></button>' +
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
  /* §654 B4 — the rail's chip in the Copilot's own words. */
  function kindWord(k){ return k === "promotable" ? "Can go on the plan" : "Stays in the Copilot"; }
  /* §694 S9 — THE ONWARD PATH. After Apply (after Save, in Advisory) one line
     names the method's next step, with a button that opens that area's start
     screen in this place. The order is the method's: SWOT, Competitive
     Discipline, Directions, Execution; an area this place does not offer is
     stepped over. The same line sits on a version's page under On the plan. */
  var NEXTOF = {
    analysis:   { k:"compete",    t:"Competitive Discipline — score the value disciplines from this SWOT." },
    compete:    { k:"directions", t:"Directions — suggest and score them from the SWOT and this discipline." },
    directions: { k:"execution",  t:"Execution — measures and tactics for each of them, by quarter." },
    execution:  { k:"advisory",   t:"The plan is complete for the period; its tabs show it. Bring a decision to Advisory when one comes." },
    advisory:   { k:"directions", t:"Put the decision to work in the plan’s Directions, or bring another decision." }
  };
  function nextOf(sec){
    var seen = {}, n = NEXTOF[sec];
    while (n && !seen[n.k]) { seen[n.k] = true; if (here().some(function(s){ return s.k === n.k; })) return n; n = NEXTOF[n.k]; }
    return null;
  }
  function nextHtml(sec){
    var n = nextOf(sec); if (!n) return "";
    return '<div class="copnext" data-cop-next><span class="copnextk">Next</span><span class="copnextt">' + E(n.t) + '</span>' +
      '<button type="button" class="copbtn solid" data-cop-go="' + E(n.k) + '">Open ' + E(sectionLabel(n.k)) + '</button></div>';
  }
  function sectionLabel(k){ for (var i = 0; i < SECTIONS.length; i++) if (SECTIONS[i].k === k) return SECTIONS[i].label; return k; }
  /* Walk to a section of the Copilot in this place: its start screen, or a
     deliverable of it (S10 opens the saved Directions version from Execution). */
  function goSection(k, delivId){
    if (typeof CURSEC === "undefined") return;
    CURSEC.copilot = k; SHEET = ""; MENU = null; ASKDEL = null; SAY = "";
    var kk = place() + "|" + k;
    if (delivId) OPEN[kk] = { kind: "deliv", id: delivId }; else delete OPEN[kk];
    PANE = null;
    if (typeof paint === "function") paint(); else draw();
    if (delivId) openItem("deliv", delivId);
    try { window.scrollTo(0, 0); } catch (e) {}
  }
  /* §694 S12 — AN UNFINISHED CHAT IS NAMED ON THE START SCREEN: a step-by-step
     chat in this place and area with steps still open (the rail's "N of M
     done"), so + New chat does not start a second one beside it unknowing.
     Free chats have no steps and are not counted. */
  function unfinishedHtml(){
    var l = list(); if (!l || l.failed) return "";
    var rows = (l.chats || []).filter(function(c){ var sp = (l.swotProgress || {})[c.id]; return sp && sp.of > 0 && sp.done < sp.of; });
    if (!rows.length) return "";
    var c = rows[0], sp = l.swotProgress[c.id], more = rows.length - 1;
    return '<div class="copunfinished" data-cop-unfinished><span><b>' + E(c.title) + '</b> is ' + sp.done + ' of ' + sp.of + ' done, last touched ' + E(when(c.last)) + (more ? ', and ' + more + ' more ' + (more === 1 ? 'is' : 'are') + ' unfinished in the rail' : '') + '.</span>' +
      '<button type="button" class="copbtn solid" data-cop-chat="' + E(c.id) + '">Continue it</button><span class="copm">or start another below</span></div>';
  }

  function mainHtml(){
    var o = OPEN[key()];
    var say = SAY ? '<div class="copsay" role="status">' + E(SAY) + '</div>' : '';
    if (!o && canEdit()) return say + startHtml();
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
  /* §514 — A PART'S NAME IS THE CLIENT'S WORD (Islam: "yes the names should
     follow the terminology"). The Copilot's six parts are Terminology's own
     rows, so wherever a PERSON reads a part's name — a card, the to-do, a
     chat line, a button, the saved text's headings — it is the word the
     client chose, in the form the Foundation page reads it (one or many,
     per row). The AI goes on being asked in the method's own words, which
     is what its instructions are written against. A label the list cannot
     answer keeps the method's name rather than a bare key. */
  var PART_LABEL = { who: ["brief", true], asp: ["aspiration", false], eim: ["endinmind", false],
    pur: ["purpose", false], obj: ["keyobj", true], val: ["values", true] };
  function partName(el){
    var m = el && PART_LABEL[el.key];
    if (!m) return el ? String(el.name || "") : "";
    var w = ""; try { w = lw(m[0], m[1]); } catch (e) { w = ""; }
    return w && w !== m[0] ? String(w) : String(el.name || "");
  }
  function partWords(){ var o = {}; steps().forEach(function(el){ o[el.key] = partName(el); }); return o; }
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
      var r = boxRef(t);
      if (r.kind === "fn" && typeof FUNCTIONS !== "undefined") {
        var fk = r.key, F = FUNCTIONS[fk];
        if (F) { if (!u) { o.def = F.def; o.keyObjectives = F.keyObjectives; } }
        holder = typeof fnHolders === "function" ? fnHolders(fk) : [];
      } else if (r.kind === "cap" && typeof capById === "function") {
        var C = capById(r.key);
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
    /* §634: the free chat reads EVERY area of the plan, so Competitive
       Discipline and the capabilities come too — read off the same objects
       their own pages render (competeOf, GROUP.capabilities). */
    var cp = typeof competeOf === "function" ? competeOf(place()) : null;
    if (cp && (cp.discipline || (cp.values || []).length)) {
      var DW = { btc:"Best Total Cost", bts:"Best Total Solution", bp:"Best Product" };
      parts.compete = "COMPETITIVE DISCIPLINE" + (cp.discipline ? "\nDiscipline: " + (DW[cp.discipline] || cp.discipline) : "") +
        (cp.values || []).filter(function(v){ return v && clean(v.title); }).map(function(v){
          return "\n- " + clean(v.title) +
            ((v.how || []).length ? "\n  How: " + v.how.map(clean).filter(Boolean).join("; ") : "") +
            ((v.measure || []).length ? "\n  Measure: " + v.measure.map(clean).filter(Boolean).join("; ") : "");
        }).join("");
    }
    var caps = typeof GROUP !== "undefined" && GROUP && Array.isArray(GROUP.capabilities)
      ? GROUP.capabilities.filter(function(c){ return c && !hid(c) && clean(c.name); }) : [];
    if (caps.length) {
      var KW = { gap:"Gap-closing", transformation:"Transformation", enabler:"Enabler" }, pn = {};
      var gi = []; try { gi = typeof itemsNow === "function" ? itemsNow(GROUP) : (GROUP.items || []); } catch (e) { gi = GROUP.items || []; }
      (gi || []).concat(items).forEach(function(p){ if (p && p.id) pn[p.id] = clean(p.name); });
      parts.capabilities = "CAPABILITIES\n" + caps.map(function(c){
        var b = [];
        if (KW[c.capKind]) b.push(KW[c.capKind]);
        var sv = (c.serves || []).map(function(id){ return pn[id]; }).filter(Boolean);
        if (sv.length) b.push("serves " + sv.join(", "));
        var who = c.head && typeof dvPersonName === "function" ? dvPersonName(c.head) : "";
        if (who) b.push("owner " + who);
        return "- " + clean(c.name) + (b.length ? " (" + b.join(", ") + ")" : "");
      }).join("\n");
    }
    var order = ["foundation","analysis","compete","directions","capabilities","execution"], sec = section();
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
  /* §638: a reply's **bold** is drawn bold. Only that, and read AFTER the
     text is escaped, so nothing the model writes ever becomes markup. */
  function rich(s){ return E(s).replace(/\*\*([^*\n]+?)\*\*/g, "<b>$1</b>"); }
  /* §638 THE DRAFT STANDS BESIDE THE CHAT (design-mockups/copilot-layout/
     2026-10-25_copilot-concept.html, signed off): a plain or free chat's
     latest draft is drawn in its own panel to the right, with its Save;
     the bubble that wrote it says so in a line. An earlier draft can be
     put back in the panel from its own bubble. */
  var PANELPICK = {};            /* chat id → the message whose draft the panel shows (this visit only) */
  var SHEET = "";                /* "cards" | "todo" | "draft": the panel opened over the chat when there is no room beside it (§642) */
  function hasDraft(m){ var p = m && m.part; return !!(m && m.who === "ai" && p && p.kind === "answer" && p.draft && p.draft.groups && p.draft.groups.length); }
  function draftMsg(){
    if (!PANE || !PANE.chat || !PANE.messages) return null;
    var pick = PANELPICK[PANE.chat.id], last = null;
    for (var i = 0; i < PANE.messages.length; i++) { var m = PANE.messages[i]; if (hasDraft(m)) { last = m; if (pick && m.id === pick) return m; } }
    return last;
  }
  function answerHtml(m, last){
    var p = m.part || {};
    var h = m.body ? '<div class="copbody">' + rich(m.body) + '</div>' : '';
    /* §471: no "Understood / Working from" box. A stored answer from before
       may still carry one; it is not drawn — the reply says it in words. */
    if (p.missing && p.missing.length) h += '<div class="copmiss"><b>Missing</b><ul>' + p.missing.map(function(x){ return '<li>' + E(x) + '</li>'; }).join("") + '</ul></div>';
    if (hasDraft(m)) {
      var shownHere = draftMsg() === m;
      h += '<div class="copdraftline"><span>Draft' + (p.draft.title ? ' · <b>' + E(p.draft.title) + '</b>' : '') + '</span>' +
        '<button type="button" class="copopt" data-cop-showdraft="' + E(m.id) + '">' + (shownHere ? 'View draft' : 'Show this draft') + '</button>' +
        (p.saved && p.saved.deliverableId ? '<span class="copsaved">&#10003; Saved as v' + E(String(p.saved.n || 1)) + '</span>' : '') + '</div>';
    } else if (p.draft && p.draft.groups) {
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
      '<button type="button" class="copsz sm' + heldCls(i === 0) + '" data-cop-size="-1"' + (i === 0 ? held("This is already the smallest text size.") : ' title="Smaller text"') + ' aria-label="Smaller text">A&minus;</button>' +
      '<button type="button" class="copsz big' + heldCls(i === ZOOMS.length - 1) + '" data-cop-size="1"' + (i === ZOOMS.length - 1 ? held("This is already the largest text size.") : ' title="Larger text"') + ' aria-label="Larger text">A+</button></span>';
  }
  function setSize(step){
    var i = Math.max(0, Math.min(ZOOMS.length - 1, zi() + step));
    try { if (i === 1) localStorage.removeItem(ZKEY); else localStorage.setItem(ZKEY, String(i)); } catch (e) {}
    var box = document.querySelector("[data-cop-chatbox]");
    if (box) box.style.setProperty("--copz", String(ZOOMS[i]));
    var sm = document.querySelector('[data-cop-size="-1"]'), bg = document.querySelector('[data-cop-size="1"]');
    setHeld(sm, i === 0 ? "This is already the smallest text size." : "");
    setHeld(bg, i === ZOOMS.length - 1 ? "This is already the largest text size." : "");
    fitBox();
  }
  window.__copSize = { steps: ZOOMS, index: function(){ return ZOOMS[zi()]; } };

  function draftPanelHtml(m){
    var p = m.part, latest = true;
    for (var i = PANE.messages.length - 1; i >= 0; i--) if (hasDraft(PANE.messages[i])) { latest = PANE.messages[i] === m; break; }
    var foot = ((p.saved && p.saved.deliverableId)
      ? '<span class="copsaved">&#10003; Saved as v' + E(String(p.saved.n || 1)) + '</span><button type="button" class="copopt" data-cop-deliv="' + E(p.saved.deliverableId) + '">Open it</button>'
      : (canEdit() && !PANE.chat.archived ? '<button type="button" class="copopt rec" data-cop-savedraft="' + E(m.id) + '">Save to ' + E(secLabel()) + ' deliverables</button>' : '')) +
      /* §654 B3 — said where it stands: a free chat's draft stays in the
         Copilot; what goes on the plan is built step by step. */
      '<span class="copm copdstay" data-cop-draftstay>Stays in the Copilot. To put it on the plan, build it step by step.</span>' +
      (canEdit() ? '<button type="button" class="copopt" data-cop-home>Start step by step</button>' : '');
    return '<section class="copout" data-cop-out aria-label="Draft">' +
      '<div class="copouth"><b>' + E(p.draft.title || "Draft") + '</b><span class="copm">' + (latest ? 'Latest draft' : 'An earlier draft') + '</span>' +
        '<button type="button" class="copcx copsheetx" data-cop-sheet="" aria-label="Close the draft" title="Close">×</button></div>' +
      '<div class="copoutb"><div class="copdraft"><div class="copdg">' + p.draft.groups.map(function(g){
          return '<div class="copgrp"><div class="copgt">' + E(g.title) + '</div><ul>' + g.items.map(itemHtml).join("") + '</ul></div>';
        }).join("") + '</div></div></div>' +
      (foot ? '<div class="copoutf">' + foot + '</div>' : '') + '</section>';
  }
  /* THE HANDLE BETWEEN THE CHAT AND WHAT IT BUILDS (§638): drag to widen or
     narrow the chat, double-click (or Home) for the default, arrows in 20px
     steps. The width is this browser's own convenience, kept for the next
     visit; the CSS caps it so the work beside it always keeps its room. */
  var GRIPKEY = "smp.copilot.chatw";
  function chatW(){ try { var v = Number(localStorage.getItem(GRIPKEY)); return v >= 420 && v <= 1400 ? v : 0; } catch (e) { return 0; } }
  function splitStyle(){ var w = chatW(); return w ? ' style="--cop-chatw:' + w + 'px"' : ''; }
  var GRIP = '<div class="copgrip" data-cop-grip role="separator" aria-orientation="vertical" tabindex="0" aria-label="Resize the chat" title="Drag to resize · double-click for the default width"></div>';
  function sheetBtn(k, label){ return '<button type="button" class="copbtn quiet copsheetb copsheetb-' + k + '" data-cop-sheet="' + k + '" aria-expanded="' + (SHEET === k) + '">' + label + '</button>'; }
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
    var dm = draftMsg();
    var chat = '<div class="copchat" data-cop-chatbox style="--copz:' + ZOOMS[zi()] + '">' +
      '<div class="copctx" title="' + E(ctx.detail || ctx.line) + '">' + INFO + '<span>' + E(ctx.line) + '</span></div>' +
      '<div class="copheadrow">' + head + (dm ? sheetBtn("draft", "View draft") : '') + sizeHtml() + '</div>' +
      (PANE.flow ? roadLine() : '') +
      '<div class="copmsgs" data-cop-msgs><div class="copzoom">' + (msgs || '<div class="copnone">Nothing said yet.</div>') + '</div></div>' +
      (pend ? '<div class="coppend" data-cop-pending>' + pend + '</div>' : '') +
      (!canEdit() ? VIEWONLY
        : c.archived
        ? '<div class="copsay copparked">This chat is archived. Restore it to keep talking. ' +
            '<button type="button" class="copbtn" data-cop-restore-chat="' + E(c.id) + '">Restore</button></div>'
        : composerHtml(c, !!pend)) +
      '</div>';
    if (!dm) return chat;
    return '<div class="copsplit' + (SHEET === "draft" ? ' sheet' : '') + '" data-cop-split' + splitStyle() + '>' + chat + GRIP + draftPanelHtml(dm) +
      '<div class="copshade" data-cop-sheet=""></div></div>';
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
    if (swotOn()) return swGuidedNow() ? "Type your answer…" : swCanChange() ? "Say what to change — move a line, drop one, reword one…" : PANE.swot.saved ? "Saved — nothing more to type here." : "Use the choices above to carry on…";
    if (competeOn()) return cpCanType() ? "Ask for a change — another title, a How to drop, a Measure to add…" : PANE.compete.saved ? "Saved — nothing more to type here." : "Use the choices above to carry on…";
    if (advOn()) { var sa0 = PANE.advisory, pq0 = adPending(sa0); return !adCanType() ? (sa0.saved ? "Saved — nothing more to type here." : "Use the choices above to carry on…") : !sa0.ask ? "What would you like advice on?" : sa0.brief ? "Ask for a change — another option, a different recommendation, a step to add…" : pq0 && pq0.clash ? "Or give the number yourself…" : "Your answer…"; }
    if (execOn()) return exCanType() ? "Ask for a change to " + PANE.exec.items[PANE.exec.cursor].title + "’s measures or tactics…" : PANE.exec.saved ? "Saved — nothing more to type here." : PANE.exec.period ? "Pick an item on the right to ask about it…" : "Use the choices above to carry on…";
    if (dirsOn()) return dvCanType() ? (DVADD[PANE.chat.id] === dvAskWhat() ? (dvAskWhat() === "caps" ? "A Capability of your own — type it and press Enter…" : "A Direction of your own — type it and press Enter…") : "Ask for something — a couple more, or a different angle…") : PANE.dirs.saved ? "Saved — nothing more to type here." : "Use the choices above to carry on…";
    if (flowView()) {
      var ph = PANE.flow.phase;
      /* §652 — the grey line invites what the box can do NOW (Islam: "use
         buttons above to carry on … this is wrong"): since §643 a line typed
         at any step is kept, and one that names a part changes it. */
      return ph === "ask" ? "Type your answer…" : ph === "review" ? "Change an answer above, or say anything…"
        : ph === "draft" ? "Say what to change in this draft…"
        : ph === "loaded" || ph === "check" || ph === "saved" ? "Name a part and say what to change, or ask anything…" : "Type a message…";
    }
    return pend ? "Say what this file is for…" : "Ask about " + placeWord() + "’s " + sectionWord().toLowerCase() + "…";
  }
  var VIEWONLY = '<div class="copviewonly" data-cop-viewonly><span>View only</span></div>';
  function composerHtml(c, pend){
    var text = DRAFT[c.id] || "";
    return '<div class="copcompose">' +
      '<div class="copbox">' +
        '<textarea data-cop-text rows="1" placeholder="' + E(boxWord(pend)) + '" aria-label="Message"' + ((swotOn() && !swGuidedNow() && !swCanChange()) || (competeOn() && !cpCanType()) || (dirsOn() && !dvCanType()) || (execOn() && !exCanType()) || (advOn() && !adCanType()) ? ' disabled' : '') + '>' + E(text) + '</textarea>' +
        /* §652 — Send appears only once there is something to send (Islam:
           "the enter button should only appear when I write something, like
           Claude"); while the Copilot works it stays, held, saying so. */
        (function(){ var w = THINKING === c.id ? BUSY : "", none = !text.trim() && !pend;
        return '<button type="button" class="copsend' + heldCls(w) + '" data-cop-send aria-label="Send"' + (none ? ' hidden' : '') + (w ? held(w) : ' title="Send"') + '>' + SENDMARK + '</button>'; })() +
      '</div>' +
      '<div class="copunder">' + (flowView() || swotOn() || competeOn() || dirsOn() || execOn() || advOn() ? '<span class="cophint">Enter sends · Shift + Enter for a new line</span></div></div>' :
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
  function pickPath(k){
    var g2 = flowCopy(); g2.path = k;
    if (g2.path === "guided") { g2.phase = g2.y0 && g2.y1 ? "ask" : "year"; g2.e = 0; g2.qi = 0; } else g2.phase = "path";
    flowSave(g2, function(){ var t = document.querySelector("[data-cop-text]"); if (t) t.focus(); });
  }
  /* §639: a road chosen on the start screen is taken the moment the flow
     reaches its roads — at once on a place with no Foundation, after "start
     fresh" on one that has it. "Start from it" is the guided road already. */
  var PENDROAD = {};             /* chat id → the road chosen on the start screen (this visit only) */
  var PENDSTART = {};            /* §653: chat id → "plan", a SWOT started from the plan's lines by the start screen's card */
  function applyStart(){
    if (!swotOn() || !PANE.swot || !canEdit()) return;
    var id = PANE.chat.id; if (PENDSTART[id] !== "plan") return;
    if (PANE.swot.phase !== "start") { delete PENDSTART[id]; return; }
    delete PENDSTART[id];
    var g = swCopy(); g.start = "plan"; g.phase = "methods"; swSave(g);
  }
  function applyRoad(){
    if (!flowOn()) return;
    var id = PANE.chat.id, r = PENDROAD[id], f = PANE.flow; if (!r) return;
    if (f.path || f.start === "plan") { delete PENDROAD[id]; return; }
    if (f.phase !== "path" || !canEdit()) return;
    /* §653: any road is taken only once the chat has come back with its
       parts — the first draw is before that, and a road taken then raced
       the chat's own load (the cards drawn empty, the roads left standing). */
    if (!steps().length) return;
    delete PENDROAD[id];
    if (r === "plan") { var gs = flowCopy(); startFromPlan(gs); flowSave(gs); return; }
    pickPath(r);
  }
  /* The cards filled from the plan, each part agreed and marked the plan's. */
  function startFromPlan(gs){
    var pp = planParts();
    gs.start = "plan";
    steps().forEach(function(el, i){ var t = pp[el.key] || ""; gs.drafts[i] = t; gs.from[i] = gs.done[i] = !!t; });
    gs.path = "guided"; gs.phase = "loaded";
  }
  function steps(){ return (PANE && PANE.flowSteps) || []; }
  function withY(s, f){ return String(s).replace(/\{Y\}/g, f.y1 == null ? "the strategy" : String(f.y1)); }
  function fname(){ return "Foundation — " + placeWord(); }
  /* §525.1 — A WAY TO SEE THE RESULT AFTER APPLY (Islam: "ok for all", of
     design-mockups/copilot-foundation-flow/2026-10-10_progress-apply-button.html).
     Applying changed the bar's words and nothing else, so checking the one
     thing Apply is for meant leaving the Copilot and finding Strategy ›
     Foundation by hand. One green line with one link, shown where the state
     is already read — the flow's save bar and the deliverable page (§524.1's
     "keep in both") — and nothing is stored for it.
     THE ADDRESS IS WORKED OUT THE WAY THE ROUTER WRITES ONE
     (smp-app/shell/route.js `addressOf`): the module word, the destination's
     own segment, its tab, then the section. A company's Foundation is a TAB
     of its own (`foundation`) where a unit's, a function's and the group's
     are a SECTION of Strategy (`found`) — read off shell.html rather than
     guessed. A capability is a destination the router cannot spell, so there
     the line is drawn with no link rather than a link that lands nowhere
     (§61): a dead link is worse than no link. */
  function foundHref(){
    var t = place(), s = slug();
    if (!s || !t || /^cap:/.test(t)) return "";
    if (/^co:/.test(t)) return "/" + s + "/strategy/co/" + t.slice(3) + "/foundation";
    return "/" + s + "/strategy/" + (/^fn:/.test(t) ? "fn/" + t.slice(3) : t) + "/strategy/found";
  }
  /* The page's own name is the client's word for it, as every part's name is
     (§514) — asked of the one rule that answers it, never spelt here. */
  function foundPageWord(){
    try { if (typeof SMPRules !== "undefined" && SMPRules.foundTitle) { var w = SMPRules.foundTitle(GROUP, place()); if (w) return w; } } catch (e) {}
    return "Foundation";
  }
  function fdoneHtml(n){
    var h = foundHref();
    return '<div class="copfdone" data-cop-fdone>' +
      '<span>✓ v' + E(n) + ' is on ' + E(placeWord()) + '’s plan.</span>' +
      (h ? ' <a href="' + E(h) + '">Open the ' + E(foundPageWord()) + ' page ›</a>' : '') + '</div>';
  }
  function doneCount(f){ return f.done.filter(function(d, i){ return d && on(i); }).length; }
  /* §524 — SAVED MEANS THESE WORDS ARE THE WORDS IN THE LAST VERSION. The
     cards stay editable after a save (Islam: "let the card be editable to
     begin a new version"), so what decides whether Save is live is whether
     any counted part differs from what vN holds, never the phase. */
  function savedNow(f){
    if (!f.saved || !Array.isArray(f.saved.drafts)) return false;
    return steps().every(function(_, i){ return !on(i) || String(f.drafts[i] || "").trim() === String(f.saved.drafts[i] || "").trim(); });
  }
  function countedParts(f){ return steps().filter(function(_, i){ return on(i); }).length; }
  function yearsWord(f){ return f.y0 + " to the end of " + f.y1 + " (" + (f.y1 - f.y0 + 1) + (f.y1 - f.y0 + 1 === 1 ? " year)" : " years)"); }
  /* §649 — A BUTTON THAT CANNOT BE PRESSED SAYS WHY (Islam: "for any
     disabled button we need to have a tooltip explaining why"). §538's way,
     now for every one: HELD, never `disabled` — `aria-disabled` and the reason
     in the platform's dark bubble (`data-tip`, drawn at page level by #coptip), which a pointer,
     Tab and a tap all reach; a `disabled` button takes no focus and, in some
     browsers, no hover, so it could never say anything. A press on a held
     button is stopped before any handler sees it (the capture guard below).
     `why` empty is a live button. */
  var BUSY = "The Copilot is still working on the last answer.";
  var VIEWWHY = "You can read this chat but not change it.";
  function held(why){ return why ? ' aria-disabled="true" data-tip="' + E(why) + '"' : ''; }
  /* The bubble is the page's own (#coptip below), never a `::after` inside
     the button: the pane and the chat box clip what crosses their edges, and
     a note centred on Run the check or Send was cut in half (Islam's
     screenshots). So no `.hasnote` here. */
  function heldCls(){ return ''; }
  function setHeld(el, why){
    if (!el) return;
    if (why) { el.setAttribute("aria-disabled", "true"); el.setAttribute("data-tip", why); }
    else { el.removeAttribute("aria-disabled"); el.removeAttribute("data-tip"); }
    if (TIPFOR === el) tipHide();
  }
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
  /* §514 — ONE COUNT OF ANSWERS, read by the card, the to-do and the bar
     (Islam: "we need to fix the panel and the card"). The card said
     "Answering 1/4" — the question's POSITION — beside a panel saying
     "0/4" — the answers GIVEN: two meanings in one x/n shape (§53.5). */
  function answered(f, i){ return (f.ans[i] || []).filter(function(x){ return String(x).trim(); }).length; }
  /* §525.1 — ONE COUNT OF PROGRESS, read by the top bar and the save bar
     (Islam, of the UX review: "ok for all", from
     design-mockups/copilot-foundation-flow/2026-10-10_progress-apply-button.html).
     The questions bar counted ANSWERS GIVEN out of questions asked, which on
     the "start from what is there" road is 0 of 18 over six parts already
     agreed — a 0% track on a Foundation that is five sixths done, because
     nobody was asked anything. What the page is asking is *how much of the
     Foundation is settled*, so the one number is parts agreed out of the
     parts this place has, and it moves on either road. Named here once:
     `agreedAll` is this same test asked of every part (§53.5). */
  function agreedCount(f){
    return steps().filter(function(_, i){ return on(i) && f.done[i] && !!String(f.drafts[i] || "").trim(); }).length;
  }
  /* A part's text on its card: one line reads as a sentence, several as a
     list, and a long list stops at three with Show N more.
     §642 — THE REST OF A LONG CARD OPENS IN PLACE (Islam: Key Objectives
     "all showing 2 more lines without a way of viewing them"). The link is
     a span, not a button, because a pressable card is itself a button; what
     is open is kept by the list's text so a redraw leaves it open. */
  var CARDMORE = {};
  /* §643.1 — Key Objectives always shows every objective (Islam: "for the
     objectives remove the show more and show fewer and just show the
     objectives created, all of them"): they are the numbers the plan is
     measured by, read together. */
  function cardBody(text, key){
    var lines = String(text).split("\n").map(function(x){ return x.replace(/^\s*(?:[-•]|\d+[.)])\s*/, "").trim(); }).filter(Boolean);
    if (lines.length < 2) return '<p>' + E(lines[0] || "") + '</p>';
    var cut = lines.length > 4 && key !== "obj" ? 3 : lines.length;
    key = lines.join("\n"); var open = !!CARDMORE[key];
    return '<ul' + (open ? ' class="open"' : '') + '>' + lines.map(function(l, k){ return '<li' + (k >= cut ? ' class="copmorel"' : '') + '>' + E(l) + '</li>'; }).join("") + '</ul>' +
      (lines.length > cut ? '<span class="copmore" role="button" tabindex="0" aria-expanded="' + open + '" data-cop-more="' + E(key) + '" data-n="' + (lines.length - cut) + '">' +
        (open ? 'Show fewer' : 'Show ' + (lines.length - cut) + ' more') + '</span>' : '');
  }
  function answersGo(b){
    if (!PANE || !PANE.chat) return;
    var i = b.getAttribute("data-cop-answers");
    FOLD[PANE.chat.id + ":" + i] = true; draw();
    var box = document.querySelector('[data-cop-foldbox="' + i + '"]');
    if (box) { box.scrollIntoView({ block:"start" }); box.classList.add("flash"); setTimeout(function(){ box.classList.remove("flash"); }, 1200); }
  }
  function moreToggle(b){
    var key = b.getAttribute("data-cop-more"), ul = b.previousElementSibling, open = !CARDMORE[key];
    if (open) CARDMORE[key] = true; else delete CARDMORE[key];
    if (ul) ul.classList.toggle("open", open);
    b.setAttribute("aria-expanded", String(open));
    b.textContent = open ? "Show fewer" : "Show " + b.getAttribute("data-n") + " more";
  }
  var CARDSHUT = {};             /* chat id → the cards closed with × (this visit only) */
  /* §513 — A PART'S TEXT IS EDITED ON ITS CARD (Islam: "edit the cards on
     the left … a pen to edit or edit with AI to take it back to the chat",
     the original Copilot's own pattern, signed off from
     design-mockups/copilot-foundation-flow/2026-10-07_edit-cards-hover.html).
     {id, i, text} while one card is a text box; the text is held here so a
     redraw puts back what is half-typed rather than the stored draft. */
  var CARDPEN = null;
  var PENMARK = '<svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M15.2 5.2l3.6 3.6M16.7 3.7a2.5 2.5 0 113.6 3.6L6.5 21H3v-3.6z"/></svg>';
  var CHATMARK = '<svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12a8 8 0 01-11.6 7.1L4 20l1-4.6A8 8 0 1121 12z"/><path d="M8.5 10.5h7M8.5 13.5h4.5"/></svg>';
  var AIMARK = '<svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"><path d="M10 3.5l1.6 4.4 4.4 1.6-4.4 1.6L10 15.5l-1.6-4.4L4 9.5l4.4-1.6z"/><path d="M17.5 13.5l.8 2.2 2.2.8-2.2.8-.8 2.2-.8-2.2-2.2-.8 2.2-.8z"/></svg>';
  function penHere(){ return !!(CARDPEN && PANE && PANE.chat && CARDPEN.id === PANE.chat.id); }
  function cardsHtml(f){
    var S = steps(), plan = f.start === "plan", ed = canEdit() && !PANE.chat.archived && THINKING !== PANE.chat.id;
    /* §512 — A PART IS OPENED FROM ITS CARD AT EVERY STEP, ON BOTH ROADS.
       Islam: "I have no option to edit any section once I finish and Done
       appears until I finalize all parts and reach the consistency check."
       Only the plan road could press a card, and never during the check;
       now any part opens while the parts are being worked or checked —
       never before the road is chosen. Since §524 a SAVED Foundation opens
       too: a change after a save starts the next version on the rail, and
       the plan moves only when Apply to plan is pressed. */
    var phaseOk = canEdit() && !PANE.chat.archived && PICK_PHASES.indexOf(f.phase) >= 0;
    var pick = ed && phaseOk, pen = penHere() && phaseOk ? CARDPEN : null;
    return '<div class="copcards">' + S.map(function(el, i){
      if (!on(i)) return "";
      var st, cls = "copst", txt = String(f.drafts[i] || "").trim(), empty = false;
      var n = el.questions.length, a = answered(f, i);
      var now = i === f.e && (f.phase === "ask" || f.phase === "review" || f.phase === "draft");
      /* §525.1 — WHERE THE QUESTION COUNT BELONGS IS THE CARD BEING
         ANSWERED, never the page: the position through one part's questions
         is a fact about that part, and on the head it sat beside a track
         counting something else. */
      /* §653 — FOUR STATUS WORDS, everywhere: Not started · In progress ·
         Agreed · On the plan. Which question, and how it is being changed,
         is the card body's and the chat's to say (§525.1). */
      if (now) { st = "In progress"; cls += " now"; }
      else if (f.done[i] && txt) { if (f.from[i]) { st = "On the plan"; cls += " plan"; } else { st = "Agreed"; cls += " done"; } }
      else if (txt || a) { st = "In progress"; }
      else { empty = true; st = "Not started"; }
      var body = txt && (!now || f.phase === "draft") ? cardBody(withY(txt, f), el.key)
        : '<p>' + (now && f.phase === "draft" ? "Nothing agreed yet. The proposal is in the chat." : now && f.phase === "ask" ? E("Question " + (f.qi + 1) + " of " + n + ".") : now || a ? E(a + " of " + n + " answered.") : plan || f.done[i] ? "Nothing saved yet." : "No answers yet.") + '</p>';

      var wide = el.key === "who" || el.key === "asp";
      var head = '<h3><span>' + E(partName(el)) + '</span><span class="' + cls + '">' + E(st) + '</span></h3>';
      var c = 'copcard' + (wide ? " wide" : "") + (now ? " now" : "") + (empty && !now ? " empty" : "");
      if (pen && pen.i === i)
        return '<div class="' + c + ' editing" data-cop-card="' + i + '">' + head +
          '<textarea class="copfedit" data-cop-pentext aria-label="' + E(partName(el)) + '">' + E(pen.text) + '</textarea>' +
          '<div class="copeact"><span class="copkh">Esc to cancel · Ctrl+Enter to save</span>' +
          '<button type="button" class="copbtn quiet" data-cop-pencancel>Cancel</button>' +
          (function(){ var w = THINKING === PANE.chat.id ? BUSY : !pen.text.trim() ? "Write something first — a part cannot be saved empty." : "";
            return '<button type="button" class="copbtn solid' + heldCls(w) + '" data-cop-pensave' + held(w) + '>Save</button></div></div>'; })();
      /* A card with text carries its two ways in and stops being a button;
         a card with nothing written stays one press into the chat; the part
         already in the chat carries neither. While one card is a text box
         the others wait, so a press elsewhere cannot throw away what is
         half-typed. */
      if (pick && !pen && txt && !now)
        return '<div class="' + c + ' acts" data-cop-card="' + i + '">' + head + body +
          '<span class="copcact"><button type="button" data-cop-pen="' + i + '" title="Edit the text" aria-label="Edit the text of ' + E(partName(el)) + '">' + PENMARK + '</button>' +
          '<button type="button" data-cop-ai="' + i + '" title="Edit with AI" aria-label="Edit ' + E(partName(el)) + ' with AI">' + AIMARK + '</button>' +
          /* §644 — BACK TO ITS ANSWERS IS ONE MORE HOVER ICON (Islam: "show
             answers on the card always visible is not really neat"; option A
             of design-mockups/copilot-layout/2026-10-26_chat-in-time.html):
             the card at rest is only its words. */
          ((f.log || []).some(function(x){ return x.p === i && x.w === "qa"; }) ? '<button type="button" data-cop-answers="' + i + '" title="Your answers in the chat" aria-label="Your answers on ' + E(partName(el)) + ' in the chat">' + CHATMARK + '</button>' : '') + '</span></div>';
      return pick && !pen && !now
        ? '<button type="button" class="' + c + ' pick" data-cop-card="' + i + '" aria-label="Work on ' + E(partName(el)) + '">' + head + body + '</button>'
        : '<div class="' + c + '" data-cop-card="' + i + '"' + (now ? ' aria-current="true"' : '') + '>' + head + body + '</div>';
    }).join("") + '</div>';
  }
  function flowHead(f){
    var S = steps(), el = S[f.e] || {}, t, p = "";
    /* §653 — ONE JOB PER HEADER: the chat's is the chat's name and the step
       (the pane's is the version). The question's position stays the card's
       (§525.1); the count is the to-do's alone. */
    var step = f.phase === "year" || f.phase === "path" || f.phase === "start" ? "Start" : f.phase === "loaded" ? ""
      : f.phase === "check" ? "Check" : f.phase === "saved" ? "Saved" : partName(el);
    t = '<span class="copfname">' + E(PANE.chat.title || fname()) + '</span>' + (step ? '<small> · ' + E(step) + '</small>' : '');
    var show = CARDSHUT[PANE.chat.id] ? '<button type="button" class="copbtn quiet" data-cop-cards="show">Show cards</button>'
      : sheetBtn("cards", "View " + sectionWord());
    show += sheetBtn("todo", "To-do " + doneCount(PANE.flow) + "/" + S.filter(function(_, i){ return on(i); }).length);
    return '<div class="copfhead"><b>' + t + '</b>' + show + sizeHtml() + '</div>';
  }
  function flowMsgs(f){
    var S = steps(), out = [], ed = canEdit() && !PANE.chat.archived, busyHere = THINKING === PANE.chat.id;
    var plan = f.start === "plan";
    /* §478: where the place already HAS a Foundation the chat opens by
       asking whether to start from it; the answer stays on the page with
       the chosen button lit, as the mockup draws it. */
    if (f.start === "plan" && f.phase !== "start") {
      /* §653: started from the plan's Foundation by the start screen's card
         (or §478's question): said once, as a fact, not as a question kept. */
      out.push(aiMsg("Started from " + E(placeWord()) + "’s Foundation as it stands on the plan — the parts are on the cards, each marked On the plan."));
    } else if (f.phase === "start" || f.start) {
      var ch = function(k, w){
        return f.phase === "start" && ed ? '<button type="button" class="copbtn' + (k === "plan" ? " solid" : "") + '" data-cop-start="' + k + '">' + w + '</button>'
          : '<span class="copchoice' + (f.start === k ? " picked" : "") + '">' + w + '</span>'; };
      out.push(aiMsg(E(placeWord()) + " already has a Foundation. Do you want to start from what’s there, or start fresh?" +
        '<div class="copbtns">' + ch("plan", "Start from it") + ch("fresh", "Start fresh") + '</div>'));
      if (f.phase === "start") return out.join("");
    } else out.push(aiMsg("Hi — let's build " + E(placeWord()) + "’s Foundation. I'll ask a few short questions per part, show you what you said, draft it, and you refine and save each part."));
    if (plan) {
      out.push(aiMsg("Edit a part from its card — the pen to write it yourself, or Edit with AI — or tell me what you want to change."));
      if (f.phase === "loaded" && ed && agreedAll(f))
        out.push(aiMsg("When the parts read as you want them, run the check and save the Foundation from the pane."));
    } else {
      out.push(aiMsg("How would you like to build it?" + (f.phase === "path" && ed ? '<div class="coppaths">' + PATH_CARDS.filter(function(c){ return STARTROADS.indexOf(c.k) >= 0; }).map(function(c){
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
      out.push(aiMsg("Good. We'll build the parts in order, starting with <b>" + E(partName(S[0])) + "</b> (" + S[0].questions.length + " short questions)."));
    }
    var all = f.phase === "check" || f.phase === "saved";
    /* §644 — THE CHAT IN THE ORDER IT HAPPENED (Islam: "I thought they will
       be collapsed in their place of creation in the chat"; signed off from
       design-mockups/copilot-layout/2026-10-26_chat-in-time.html). Drawn from
       the one record, `log`: a part's guided pass — its questions, the
       drafts made from them, and its first save — is ONE folded row where it
       happened; what follows is plain chat, each proposal naming its part.
       A part's block closes at its first note (saved or kept); a block still
       open is the part being drafted now, drawn open. */
    /* §652 — A BLOCK IS OPEN ONLY FOR THE PART BEING DRAFTED NOW. It used to
       close at the part's first note, and parts agreed before notes existed
       (§643) never had one — so they read "Drafting" for good (Islam's
       screenshot). A block ends at its part's first note, or where the next
       part's questions begin; every block but the one in hand is closed. */
    /* Every part with answers has its row: one answered before the record
       marked "questions done" gets its row ahead of everything recorded. */
    var log = S.map(function(el, i){ return on(i) && i !== (!all && f.phase !== "draft" ? f.e : -1) && ((f.ans && f.ans[i]) || []).some(function(a){ return String(a || "").trim(); }) &&
        !(f.log || []).some(function(x){ return x.p === i && x.w === "qa"; }) ? { p:i, w:"qa", t:"-" } : null; }).filter(Boolean).concat(f.log || []);
    var member = {}, opened = {}, ended = {}, closed = {}, aiCount = {}, lastAi = {};
    var cur = !all && f.phase === "draft" ? f.e : -1, prop = cur >= 0 ? String((f.prop || [])[cur] || "") : "", liveDone = false, later = false, seenClosed = false;
    var inHand = !all && (f.phase === "draft" || f.phase === "review" || f.phase === "ask") ? f.e : -1;
    log.forEach(function(x, k){
      if (x.w === "qa") { Object.keys(opened).forEach(function(q){ if (!(q in ended)) ended[q] = k; }); if (!(x.p in opened)) opened[x.p] = k; return; }
      if (x.p in opened && !(x.p in ended)) { member[k] = x.p; if (x.w === "note") ended[x.p] = k; }
      if (x.w === "ai") lastAi[x.p] = k;
    });
    Object.keys(opened).forEach(function(q){ if (+q !== inHand || q in ended) closed[q] = true; });
    var refBtns = '<div class="copbtns"><button type="button" class="copbtn' + heldCls(busyHere && BUSY) + '" data-cop-refine="concise"' + held(busyHere && BUSY) + '>Make concise</button>' +
      '<button type="button" class="copbtn' + heldCls(busyHere && BUSY) + '" data-cop-refine="professional"' + held(busyHere && BUSY) + '>More professional</button>' +
      '<button type="button" class="copbtn' + heldCls(busyHere && BUSY) + '" data-cop-refine="simple"' + held(busyHere && BUSY) + '>Simplify</button></div>';
    var liveBox = function(p, n, t){
      var agreedNow = !!String(f.drafts[p] || "").trim();
      return aiMsg('<span class="copeh">' + E(partName(S[p])) + ' · Proposal ' + n + '</span><div class="copfdraft">' + E(withY(t, f)) + '</div>' +
        (ed ? 'Refine it, or type what to change in the box below.' + refBtns +
          '<div class="copbtns"><button type="button" class="copbtn solid' + heldCls(busyHere && BUSY) + '" data-cop-fsave' + held(busyHere && BUSY) + '>Save to the card</button>' +
          (agreedNow ? '<button type="button" class="copbtn' + heldCls(busyHere && BUSY) + '" data-cop-fkeep' + held(busyHere && BUSY) + '>Keep as it was</button>' : '') + '</div>' : ''), true);
    };
    log.forEach(function(x, k){
      var p = x.p, el = p >= 0 ? S[p] : null;
      if (p >= 0 && !on(p)) return;
      if (x.w === "ai") aiCount[p] = (aiCount[p] || 0) + 1;
      if (x.w === "qa") {
        if (k !== opened[p]) return;
        if (closed[p]) { out.push(foldHtml(f, p, log, member)); seenClosed = true; }
        else out.push(foldHtml(f, p, log, member, true));
        return;
      }
      if (member[k] !== undefined && closed[member[k]]) return;
      if (member[k] === undefined && seenClosed && !later) { later = true; out.push('<div class="copsep" role="separator"><span>Later</span></div>'); }
      if (x.w === "me") { out.push(meMsg(x.t)); return; }
      /* a note outside its part's row names the part it is about */
      if (x.w === "note") { out.push('<div class="copfnote">' + (el && member[k] === undefined ? E(partName(el)) + ': ' : '') + E(x.t) + '</div>'); return; }
      if (p === cur && k === lastAi[p] && prop.trim() && x.t === prop) { liveDone = true; out.push(liveBox(p, aiCount[p], x.t)); return; }
      out.push('<div class="copmsg ai copwide copold"><span class="copwho">Copilot</span><div class="copbody"><span class="copeh">' + E(el ? partName(el) : "") + ' · Proposal ' + aiCount[p] +
        (k !== lastAi[p] ? ' · replaced' : '') + '</span><div class="copfdraft">' + E(withY(x.t, f)) + '</div></div></div>');
    });
    /* What is being done NOW, at the foot: the part's questions, its answers
       to review, or — with no proposal yet — what to change. */
    var el = S[f.e], i = f.e;
    if (!all && on(i) && f.phase !== "loaded") {
      if (plan) out.push(aiMsg("Let's work on <b>" + E(partName(el)) + "</b>" + "."));
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
        out.push(aiMsg("Here is what you told me about " + E(partName(el)) + ". Change anything before I draft it." +
          '<div class="coprv">' + el.questions.map(function(q, k){
            return '<label>' + E(withY(q, f)) + '<textarea class="copfed" rows="2" data-cop-fans="' + k + '"' + (ed ? '' : ' readonly') + '>' + E(f.ans[i][k]) + '</textarea></label>';
          }).join("") + '</div>' +
          (ed ? '<div class="copbtns"><button type="button" class="copbtn solid' + heldCls(busyHere && BUSY) + '" data-cop-fdraft' + held(busyHere && BUSY) + '>Draft ' + E(partName(el)) + '</button></div>' : ''), true));
      } else if (f.phase === "draft") {
        if (prop.trim() && !liveDone) out.push(liveBox(i, (aiCount[i] || 0) + 1, prop));
        if (!prop.trim() && ed) out.push(aiMsg("What would you like to change in <b>" + E(partName(el)) + "</b>? Type it below, or use a button. The card keeps its wording until you save a new one." + refBtns +
          '<div class="copbtns"><button type="button" class="copbtn' + heldCls(busyHere && BUSY) + '" data-cop-fkeep' + held(busyHere && BUSY) + '>Leave it as it is</button></div>', true));
      }
    }
    if (all && f.check) {
      var byKey = {}; S.forEach(function(el, i){ byKey[el.key] = i; });
      var issues = f.check.issues || [], agree = f.check.agree || [];
      out.push(aiMsg('<span class="copeh">Consistency check across the parts</span>' +
        (agree.length ? '<ul class="copchk ok">' + agree.map(function(a){ return '<li>' + E(a) + '</li>'; }).join("") + '</ul>' : '') +
        (issues.length ? '<ul class="copchk issue">' + issues.map(function(x){ return '<li>' + E(x.text) + '</li>'; }).join("") + '</ul>' : '') +
        /* §524 — the check is an extra move, never the door to saving
           (Islam: "a check is an extra move"), so Save is on the bar under
           the cards and only "Go back to" stays here, when there is one. */
        (ed && (f.phase === "check" || f.phase === "saved") && issues.some(function(x){ return x.el in byKey; }) ? '<div class="copbtns">' + issues.filter(function(x, k){ return x.el in byKey && issues.findIndex(function(y){ return y.el === x.el; }) === k; }).map(function(x){
            return '<button type="button" class="copbtn" data-cop-goback="' + byKey[x.el] + '">Go back to ' + E(partName(S[byKey[x.el]])) + '</button>'; }).join("") + '</div>' : ''), true));
    }
    /* §514 — A CHECK THAT HAS NOT RUN ON THESE WORDS IS NOT SHOWN AS ONE.
       A pen save during the check left the OLD results standing, "Go back
       to" and the Save button under them, nothing saying they were about
       the text before the edit, and no way to run it again. The server now
       drops the results the moment a draft changes (copilot-flow.ts); this
       is what stands in their place, with the one way to get them back. */
    if (f.phase === "check" && !f.check && !busyHere) {
      out.push(aiMsg("Every part is agreed. Run the check from the pane when you're ready — it reads the parts together.", true));
    }
    if (f.phase === "saved" && f.saved) {
      out.push(aiMsg("Saved as " + E(f.saved.title) + " v" + E(f.saved.n) + "."));
    }
    if (busyHere) out.push('<div class="copmsg product copworking" role="status"><div class="copbody"><span data-cop-wword>' + E(workWord()) + '</span><span class="copdots" aria-hidden="true"><i></i><i></i><i></i></span></div></div>');
    return out.join("");
  }
  /* §643 — A PART'S ANSWERS AND CONVERSATION, FOLDED (Islam: "the guided
     answers collapse after finishing but I can open them again to see my
     answers"). One row — the part, how many answers and changes, agreed —
     that opens in place on a press to every question with its answer, every
     change asked for, and the wording agreed. Folded is this visit's memory;
     nothing in it is ever dropped. The part being worked on folds only its
     answers: its conversation is drawn open below. */
  var FOLD = {};
  function foldHtml(f, i, log, member, current){
    var el = steps()[i], a = (f.ans && f.ans[i]) || [], txt = String(f.drafts[i] || "").trim();
    var n = a.filter(function(x){ return String(x || "").trim(); }).length;
    var lines = current ? [] : log.filter(function(x, k){ return member[k] === i; });
    var d = lines.filter(function(x){ return x.w === "ai"; }).length;
    var open = !!FOLD[PANE.chat.id + ":" + i];
    var st = current ? '<span class="copst now">In progress</span>' : f.done[i] && txt ? '<span class="copst done">Agreed</span>' : '<span class="copst">In progress</span>';
    var bits = [n ? n + (n === 1 ? " answer" : " answers") : "", d ? d + (d === 1 ? " draft" : " drafts") : ""].filter(Boolean).join(" · ");
    var body = '';
    if (open) {
      body = '<div class="coppfb">' + el.questions.map(function(q, k){
          var v = String(a[k] || "").trim();
          return v ? '<div class="copqa"><span class="copq">' + E(withY(q, f)) + '</span><span class="copa">' + E(v) + '</span></div>' : ''; }).join("") +
        lines.map(function(x){ return x.w === "me" ? '<div class="copqa"><span class="copa">' + E(x.t) + '</span></div>' :
          x.w === "note" ? '<div class="copfnote">' + E(x.t) + '</div>' : '<div class="copqa"><span class="copq">Copilot proposed</span><span class="copqp">' + E(withY(x.t, f)) + '</span></div>'; }).join("") +
        (!current && txt ? '<div class="copqa"><span class="copq">On the card now</span><span class="copqp agreed">' + E(withY(txt, f)) + '</span></div>' : '') + '</div>';
    }
    return '<div class="coppf' + (open ? ' open' : '') + '" data-cop-foldbox="' + i + '"><button type="button" class="coppfh" data-cop-pfold="' + i + '" aria-expanded="' + open + '">' +
      '<span class="copchev" aria-hidden="true">▸</span><b>' + E(partName(el)) + '</b><small>' + E(bits) + '</small>' + st + '</button>' + body + '</div>';
  }
  /* OPENING A PART PUTS YOU BACK WHERE IT WAS LEFT (§512): a drafted part
     opens on its draft, a part with every question answered opens on the
     review, and a part half answered opens on its next unanswered question
     — never back at question one, which would make returning to a part you
     were in the middle of cost the answers already given. */
  var PICK_PHASES = ["loaded", "ask", "review", "draft", "check", "saved"];
  function openPart(g, i){
    var el = steps()[i], a = g.ans[i] || [], n = el ? el.questions.length : 0, k = 0;
    /* §643: opening a part to change it leaves it agreed — the card keeps
       its wording until a proposal is saved to it. */
    g.e = i; NUDGE = null;
    if (CARDPEN && CARDPEN.i === i) CARDPEN = null;   /* §513: the part is in the chat now */
    if (String(g.drafts[i] || "").trim() || String((g.prop || [])[i] || "").trim()) { g.phase = "draft"; g.qi = 0; return; }
    while (k < n && String(a[k] || "").trim()) k++;
    if (n && k >= n) { g.phase = "review"; g.qi = 0; } else { g.phase = "ask"; g.qi = Math.min(k, Math.max(n - 1, 0)); }
  }
  /* WHICH PART A TYPED LINE NAMES (§512), by the part's own words — one
     part, or nobody: a line naming two is not guessed at. */
  var PART_WORDS = { who: ["who we are"], asp: ["winning aspiration", "aspiration"], eim: ["end in mind"],
    pur: ["purpose", "mission"], obj: ["key objectives", "objectives", "objective", "guiding objectives"], val: ["core values", "values"] };
  function namedPart(text){
    var t = " " + String(text).toLowerCase().replace(/[^a-z0-9]+/g, " ") + " ", hits = [];
    steps().forEach(function(el, i){
      if (!on(i)) return;
      var words = (PART_WORDS[el.key] || []).concat([el.name, partName(el)].map(function(s){ return String(s || "").toLowerCase().replace(/[^a-z0-9]+/g, " ").trim(); }));
      if (words.some(function(w){ return w && t.indexOf(" " + w + " ") >= 0; })) hits.push(i);
    });
    return hits.length === 1 ? hits[0] : -1;
  }
  function nextUndone(f, from){
    var n = steps().length;
    for (var i = from + 1; i < n; i++) if (on(i) && !f.done[i]) return i;
    for (var j = 0; j < from; j++) if (on(j) && !f.done[j]) return j;
    return -1;
  }
  function flowHtml(){
    var c = PANE.chat, f = PANE.flow, S = steps();
    var vn = f.saved ? f.saved.n : (PANE.nextVersion || 1), sNow = savedNow(f);
    /* §653 — the pane's head is the version and its standing; the parts
       done are the to-do's count, the years are its second row. */
    var apH = PANE.applied && PANE.applied.n ? PANE.applied.n : 0;
    var vline = '<div class="copvline"><b>v' + E(f.saved && !sNow ? vn + 1 : vn) + '</b> ' + (sNow ? "saved" : "in progress") +
      (apH ? ' · v' + E(apH) + ' on the plan' : '') + '</div>';
    var shut = !!CARDSHUT[c.id];
    /* §638: the chat first, the cards to its right behind the handle, the
       to-do last at its 200px (the signed-off concept). Without room beside it (§642) the
       cards and the to-do open over the chat from the head's two buttons. */
    var cards = shut ? '' : GRIP + '<div class="copleft"><div class="copsh">' + vline +
        '<button type="button" class="copcx copsheetx" data-cop-sheet="" aria-label="Close" title="Close">×</button>' +
        '<button type="button" class="copcx copcardx" data-cop-cards="hide" aria-label="Close the cards" title="Close the cards">×</button></div>' + cardsHtml(f) + savebarHtml(f) + '</div>';
    return '<div class="copflow' + (shut ? " nocards" : "") + (SHEET === "cards" || SHEET === "todo" ? " sheet sheet-" + SHEET : "") + '" data-cop-split' + splitStyle() + '>' +
      '<div class="copchat copfchat" data-cop-chatbox style="--copz:' + ZOOMS[zi()] + '">' +
        flowHead(f) +
        /* §525 put the save bar at the head of the chat when the cards were
           shut; §641's rule (Islam: "what is the need for the apply or save in
           the chat?") takes it out again — the chat has Show cards, and Save
           and Apply come back with the cards they belong to. */
        '<div class="copmsgs" data-cop-msgs><div class="copzoom">' + flowMsgs(f) + '</div></div>' +
        (!canEdit() ? VIEWONLY
          : c.archived ? '<div class="copsay copparked">This chat is archived. Restore it to keep going. ' +
              '<button type="button" class="copbtn" data-cop-restore-chat="' + E(c.id) + '">Restore</button></div>'
          : composerHtml(c, false)) +
      '</div>' + cards + ftodoHtml(f) + '<div class="copshade" data-cop-sheet=""></div></div>';
  }
  /* §524 — THE BAR UNDER THE CARDS: where the Foundation is SAVED and where
     it is APPLIED. Islam: "where do I press save for the foundation? in the
     chat?" — the save was a button inside the check's own message, so it
     could only be reached by running the check; now the check is an extra
     move and the save stands at the foot of the cards (mockup
     design-mockups/copilot-foundation-flow/2026-10-08_save-on-cards.html).
     Save is live the moment every counted part is agreed and differs from
     the last version; Apply is dimmed until a version exists, because it
     always writes the last SAVED version and never the cards' unsaved words
     (Islam: "the plan only changes when we apply to plan"). The mockup
     spells Apply as "Move"; the word is Islam's later one. */
  function savebarHtml(f){
    var S = steps(), ed = canEdit() && !PANE.chat.archived, busyHere = THINKING === PANE.chat.id;
    var early = f.phase === "start" || f.phase === "path" || f.phase === "year" || f.phase === "loaded" && !f.start;
    if (!ed || early) return '';
    var total = countedParts(f), agreed = agreedCount(f);
    var all = agreedAll(f), sNow = savedNow(f), vn = f.saved ? f.saved.n : (PANE.nextVersion || 1);
    /* §525 — whether the plan holds it, read off the same extra.applied the
       deliverable page reads (Islam: "keep in both"). */
    var ap = PANE.applied && PANE.applied.n ? PANE.applied.n : 0;
    var saveN = f.saved && !sNow ? vn + 1 : vn;
    /* §653 — THE PATH IN ONE LINE, always: what is in progress, what is
       saved, what is on the plan. No count here: the to-do counts, and a
       held Save says in its bubble what it waits for. */
    var bits = [];
    if (sNow) bits.push('<b>v' + E(vn) + '</b> saved'); else { bits.push('<b>v' + E(saveN) + '</b> in progress'); if (f.saved) bits.push('v' + E(vn) + ' saved'); }
    if (ap) bits.push('<span class="on">v' + E(ap) + ' on the plan</span>');
    var st = '<span class="copsvst" data-cop-fstate>' + bits.join(' <i>·</i> ') + '</span>';
    /* §525.1 — the green line only where the words beside it would otherwise
       be the only thing saying it landed: the version that is on the plan is
       the one just saved. A LATER unsaved version is a different state and
       the bar already names it ("v3 in progress · v2 is on the plan"), so a
       done line there would read as a claim about work nobody has applied. */
    var done = sNow && ap && ap === vn ? fdoneHtml(ap) : '';
    /* WHY APPLY IS HELD, in the words the moment actually calls for. */
    var fwhy = !f.saved ? "Save the Foundation first"
             : busyHere ? "The Copilot is working on this chat" : "";
    return '<div class="copsavebar" data-cop-savebar>' + done + st + '<div class="copbtns">' +
      (function(){
        var owed = "Agree every part first — " + agreed + " of " + total + " are agreed.";
        var wc = busyHere ? BUSY : !all ? owed : "";
        var ws = busyHere ? BUSY : !all ? owed : sNow ? "Nothing has changed since v" + vn + " was saved." : "";
        return '<button type="button" class="copbtn quiet' + heldCls(wc) + '" data-cop-fcheck' + (wc ? held(wc) : ' title="Optional: the Copilot reads the parts together"') + '>Run the check</button>' +
          '<button type="button" class="copbtn solid' + heldCls(ws) + '" data-cop-ffinish' + held(ws) + '>Save as v' + E(saveN) + '</button>'; })() +
      /* HELD, NOT DEAD (§538), and the reason is now the RIGHT one: the old
         line said "Save the Foundation first" even while the Copilot was
         working on a Foundation already saved. */
      '<button type="button" class="copbtn" data-cop-fapply="' + E(f.saved ? f.saved.deliverableId : "") + '" data-cop-fapply-n="' + E(f.saved ? f.saved.n : 0) + '" data-cop-fapply-on="' + ap + '" data-cop-fapply-parts="' + total + '"' + (fwhy ? ' aria-disabled="true" data-tip="' + E(fwhy) + '"' : '') + '>Apply to plan</button>' +
      '</div></div>';
  }
  /* THE FOUNDATION'S TO-DO (§490.2): the same compact list the SWOT chat
     carries, worked out from the flow as it stands — nothing is stored for it.
     Start, each part with its answers counted, then the check and the save. */
  function ftodoHtml(f){
    var S = steps(), li = function(name, state, cnt, part){
      /* §653 — a part agreed reads Agreed, a step done reads Done, the one
         in hand In progress, and the rest say nothing: the open dot says it. */
      var pill = state === "done" ? (part ? "Agreed" : "Done") : state === "now" ? "In progress" : "";
      return '<li class="copsw-li ' + (state === "now" ? "wait on" : state) + '"><span class="copsw-dot" aria-hidden="true"></span>' +
        '<span class="copsw-lb"><span class="copsw-tt"><span>' + E(name) + '</span>' + (cnt || "") + '</span></span>' +
        '<span class="copsw-pill ' + (state === "now" ? "wait" : state) + '">' + pill + '</span></li>';
    };
    var started = !!f.start || (f.phase !== "start");
    var yearsOk = !!(f.y0 && f.y1), early = f.phase === "start" || f.phase === "path" || f.phase === "year" || f.phase === "loaded";
    var g1 = [li("Starting point", started ? "done" : "now"), li("Plan years" + (yearsOk ? " " + f.y0 + "–" + f.y1 : ""), yearsOk ? "done" : f.phase === "year" ? "now" : "todo")];
    var g2 = S.map(function(el, i){
      if (!on(i)) return "";
      var now = !early && i === f.e && (f.phase === "ask" || f.phase === "review" || f.phase === "draft");
      /* §525.1 — NO SECOND COUNT HERE. A part agreed from the plan carries
         no answers, so this read "0/4" beside a row whose own pill says
         Agreed — a number disagreeing with the word next to it. How many
         questions a part has answered is on its card while it is the part
         being answered, and nowhere else. */
      return li(partName(el), f.done[i] ? "done" : now ? "now" : "todo", "", true);
    }).join("");
    /* §524 — the check is optional and not counted; the save is. */
    var g3 = [li("Consistency check", f.check ? "done" : "opt", '<i>optional</i>'),
              li("Save as Foundation", savedNow(f) ? "done" : agreedAll(f) ? "now" : "todo")];
    var n = 2 + 1 + S.filter(function(_, i){ return on(i); }).length;
    var done = (started ? 1 : 0) + (yearsOk ? 1 : 0) + doneCount(f) + (savedNow(f) ? 1 : 0);
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
  function flowCopy(){ var f = JSON.parse(JSON.stringify(PANE.flow)); f.skip = skipNow(); delete f.talkAdd; return f; }
  /* §643 — A LINE FOR THE CHAT'S RECORD: drawn at once, and sent as the
     page's own addition (the server keeps the record; the page only adds). */
  function sayIn(g, p, w, t){
    g.talkAdd = (g.talkAdd || []).concat([{ p:p, w:w, t:t }]);
    g.log = (g.log || []).concat([{ p:p, w:w, t:t }]);
  }
  /* After a part is saved to its card or kept as it was: the plan road goes
     back to the cards, the guided road to the next part still owed, and with
     every part agreed to the check — which is the pane's to run, not the
     chat's (Islam: "the chat just saves things to the cards"). */
  function partDone(g){
    if (g.start === "plan") { g.phase = "loaded"; return; }
    var nx = nextUndone(g, g.e);
    if (nx < 0) g.phase = "check"; else openPart(g, nx);
  }
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
    /* §512 — FROM THE CARDS OR THE CHECK, A LINE THAT NAMES ONE PART OPENS
       IT WITH THE CHANGE APPLIED: the refine is asked of that part, and the
       answer comes back as its draft to save, which runs the check again.
       A part with nothing written yet opens on its questions instead. */
    if (f.phase === "loaded" || f.phase === "check") {
      var pi = namedPart(text);
      if (pi >= 0) {
        var gp = flowCopy(); DRAFT[id] = "";
        if (String(gp.drafts[pi] || "").trim()) { gp.e = pi; flowAsk({ act:"flowRefine", el:pi, how:text.trim(), flow:gp }); return; }
        openPart(gp, pi); flowSave(gp, function(){ var t = document.querySelector("[data-cop-text]"); if (t) t.focus(); }); return;
      }
      /* §643: a line that names no part is still kept in the chat. */
      var gn = flowCopy(); DRAFT[id] = ""; sayIn(gn, -1, "me", text.trim());
      flowSave(gn, function(){ SAY = "Kept in the chat. To change a part, name it, or press Go back to."; draw(); }); return;
    }
    var gm = flowCopy(); DRAFT[id] = ""; sayIn(gm, -1, "me", text.trim());
    flowSave(gm, function(){ SAY = "Kept in the chat. Use the buttons above to carry on."; draw(); });
  }
  /* SAVING A CARD'S OWN WORDS (§513). The text is the part's, agreed as it
     stands — so a part that was still a draft reads Done once saved, and a
     part from the plan stops saying so only when its words change. It is
     saved FIRST and the consistency check, if that is where the flow stood,
     runs again after, so an AI that does not answer costs nothing typed. */
  function penSave(){
    if (!penHere() || THINKING) return;
    var text = CARDPEN.text.replace(/^\s+|\s+$/g, ""), i = CARDPEN.i, f = PANE.flow;
    if (!text) return;
    if (text === CARDPEN.orig.replace(/^\s+|\s+$/g, "") && f.done[i]) { CARDPEN = null; draw(); return; }
    var g = flowCopy(), was = g.phase, same = text === CARDPEN.orig.replace(/^\s+|\s+$/g, "");
    /* Unchanged words keep the draft as stored, so the end-year mark in it
       is not written in as a number by a press that changed nothing. */
    if (!same) g.from[i] = false;
    g.drafts[i] = same ? f.drafts[i] : text; g.done[i] = true;
    CARDPEN = null;
    flowSave(g, function(){
      if (was === "check" && PANE && PANE.flow && PANE.flow.phase === "check") flowAsk({ act:"flowCheck", flow:flowCopy() });
    });
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
    if ((b = hit(ev, "[data-cop-path]"))) { pickPath(b.getAttribute("data-cop-path")); return true; }
    if ((b = hit(ev, "[data-cop-start]"))) {
      /* START FROM IT fills the cards from the plan, each part already
         agreed and marked as the plan's; START FRESH goes to the roads. */
      var gs = flowCopy(), how = b.getAttribute("data-cop-start");
      if (how === "plan") startFromPlan(gs); else { gs.start = how; gs.phase = "path"; }
      flowSave(gs); return true;
    }
    if ((b = hit(ev, "[data-cop-cards]"))) {
      if (b.getAttribute("data-cop-cards") === "hide") CARDSHUT[PANE.chat.id] = true; else delete CARDSHUT[PANE.chat.id];
      draw(); return true;
    }
    /* §513 — THE PEN MAKES THE CARD A TEXT BOX; EDIT WITH AI TAKES THE PART
       BACK TO THE CHAT, which is what pressing the card did before (§512). */
    if ((b = hit(ev, "[data-cop-pen]"))) {
      var pi2 = Number(b.getAttribute("data-cop-pen")), pt0 = withY(String(f.drafts[pi2] || ""), f);
      CARDPEN = { id: PANE.chat.id, i: pi2, text: pt0, orig: pt0 };
      draw();
      var pta = document.querySelector("[data-cop-pentext]");
      if (pta) { pta.focus(); pta.setSelectionRange(pta.value.length, pta.value.length); }
      return true;
    }
    if ((b = hit(ev, "[data-cop-pencancel]"))) { CARDPEN = null; draw(); return true; }
    if ((b = hit(ev, "[data-cop-pensave]"))) { if (!b.disabled) penSave(); return true; }
    if ((b = hit(ev, "button[data-cop-card], [data-cop-ai]"))) {
      var gc = flowCopy(), ci = Number(b.getAttribute("data-cop-card") || b.getAttribute("data-cop-ai"));
      openPart(gc, ci);
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
      var g3 = flowCopy(), e3 = g3.e, p3 = String((g3.prop || [])[e3] || "");
      if (!p3.trim()) return true;
      g3.drafts[e3] = p3; g3.from[e3] = false; g3.done[e3] = true; g3.prop[e3] = "";
      sayIn(g3, e3, "note", "Saved to the card.");
      partDone(g3); flowSave(g3); return true;
    }
    if ((b = hit(ev, "[data-cop-fkeep]"))) {
      if (b.disabled) return true;
      var g5 = flowCopy(), e5 = g5.e, had = String((g5.prop || [])[e5] || "").trim();
      if (g5.prop) g5.prop[e5] = "";
      if (had) sayIn(g5, e5, "note", "Kept as it was.");
      partDone(g5); flowSave(g5); return true;
    }
    if ((b = hit(ev, "[data-cop-pfold]"))) {
      var fk = PANE.chat.id + ":" + b.getAttribute("data-cop-pfold");
      if (FOLD[fk]) delete FOLD[fk]; else FOLD[fk] = true;
      draw(); return true;
    }
    if ((b = hit(ev, "[data-cop-goback]"))) {
      var g4 = flowCopy(), x = Number(b.getAttribute("data-cop-goback"));
      openPart(g4, x); flowSave(g4); return true;
    }
    if ((b = hit(ev, "[data-cop-ffinish]"))) {
      if (b.disabled) return true;
      var cid = PANE.chat.id;
      act({ act:"flowFinish", id:cid, placeWord:placeWord(), skip:skipNow(), partWords:partWords() }, function(j){
        if (PANE && PANE.chat && PANE.chat.id === cid) { PANE.flow = j.flow; PANE.nextVersion = (j.saved && j.saved.n + 1) || PANE.nextVersion; }
        loadList(true); draw(); });
      return true;
    }
    return false;
  }
  /* §524 — APPLY TO PLAN. The last SAVED version of a Foundation goes into
     the place's own Foundation page, replacing what the plan holds — and
     what it replaces is ARCHIVED first (Islam: "anything old is not deleted
     it's archived"), restorable from Import & storage › Archived plans. It
     is asked for through the platform's own dialog, never a browser
     confirm() (§95); the server stamps which version went in, the browser
     writes the plan through the same writers the Foundation page uses
     (applyFoundationParts, config-data.js) and the autosave carries it. */
  function applyAsk(did, title, o){
    if (!did || typeof openModalHtml !== "function") { SAY = "Save the Foundation first."; draw(); return; }
    o = o || {};
    /* §525 — the count is the parts this Foundation holds (Structure can
       switch Purpose and Core Values off), and applying a version already on
       the plan says so, since it files another copy of it in Archived plans. */
    var partsWord = o.parts ? (o.parts === 1 ? "its one part goes" : "its " + o.parts + " parts go") : "its parts go";
    var again = o.n && o.on === o.n ? '<div class="kv"><span class="k">Already applied</span><span>v' + E(o.n) + ' is on the plan already. Applying it again changes nothing on the plan and files another copy in Archived plans.</span></div>' : '';
    openModalHtml("Apply to the plan?", "",
      '<div class="sendconfirm"><div class="kv"><span class="k">Where</span><span>' + E(placeWord()) + '</span></div>' +
      '<div class="kv"><span class="k">What</span><span>The last saved version of ' + E(title) + ' — ' + partsWord + ' onto the Foundation page.</span></div>' + again +
      '<div class="kv"><span class="k">What it replaces</span><span>The Foundation the plan holds today is archived first, under Import &amp; storage › Archived plans, and can be put back from there.</span></div>' +
      /* §525.1 — APPLY IS NOT A RED BUTTON. Red in this product is the
         colour of an act with no way back, and the row above this button
         says in its own words that the Foundation the plan holds is archived
         first and can be put back — so the colour said the opposite of the
         sentence it sat under. It is the dialog's own main action, filled in
         the client's navy exactly as the master flow's Start button is
         (`.mflow .cbtns button.mfgo`, §266) rather than a new treatment —
         and `--panel-ink` is the derived ink for that ground, so §38.4's
         trap (white on a fill that is pale in dark) cannot bite. Red stays
         for deleting and for closing a cycle. */
      '<div class="cbtns"><button type="button" data-cop-apply-no="1">Cancel</button><button type="button" class="copgo" data-cop-apply-yes="' + E(did) + '">Apply to plan</button></div></div>');
    var mb = document.getElementById("modal-b"); if (!mb) return;
    mb.addEventListener("click", function(ev){
      var y;
      if (hit(ev, "[data-cop-apply-no]")) { closeModal(); return; }
      if ((y = hit(ev, "[data-cop-apply-yes]"))) { closeModal(); applyGo(y.getAttribute("data-cop-apply-yes"), title); }
    });
  }
  /* §524.1 — THE NOTE FOLLOWS THE FACT. The server hands over the parts
     and records nothing; the plan is written here and saved through the
     ordinary save (the authoriser judges it, §42), and only a save that
     LANDED — "saved", or "clean" when the plan already held exactly this —
     sends `foundationApplied`. A refused or failed save says so on the page
     already (§171, §184) and leaves the deliverable "Not on the plan yet",
     which is the truth (§124). */
  function applyGo(did, title){
    var tgt = place();
    act({ act:"applyFoundation", id:did }, function(j){
      if (typeof applyFoundationParts !== "function" || typeof archiveFoundation !== "function") {
        SAY = "The plan could not be written from here. Nothing was changed."; draw(); return; }
      archiveFoundation(tgt, "replaced from the Copilot — " + title + " v" + j.n);
      var wrote = !!applyFoundationParts(tgt, j.foundation || []);
      if (wrote && typeof paint === "function") paint(); else draw();
      var saveNow = typeof SYNC !== "undefined" && SYNC.saveNow;
      if (!saveNow) { SAY = "The plan could not be saved from here, so it is not marked as applied."; draw(); return; }
      SYNC.saveNow(function(how){
        if (how !== "saved" && how !== "clean") {
          SAY = "The plan did not save, so " + title + " v" + j.n + " is not marked as on the plan. Try Apply to plan again once the save goes through.";
          draw(); loadList(true); return; }
        act({ act:"foundationApplied", id:did, n:j.n }, function(k){
          if (PANE && PANE.deliverable && PANE.deliverable.id === did) PANE.deliverable.applied = k.applied;
          if (PANE && PANE.chat && PANE.flow && PANE.flow.saved && PANE.flow.saved.deliverableId === did) PANE.applied = k.applied;
          SAY = title + " v" + j.n + " is on the plan now. What was there before is archived under Import & storage › Archived plans.";
          draw(); loadList(true);
        });
      });
    });
  }
  /* THE RAILS FOLD AWAY (§465, Islam: "a button to hide and show the left
     rail"), remembered on this browser only — a per-viewer convenience. */
  /* §638 (Islam: "we don't collapse the side bar with default"): the rail
     is OPEN unless the person shut it. It folds by itself only while a
     result stands beside the chat — the Foundation's cards, a draft, a
     workflow's work — the way Claude's list folds for an artifact, and that
     fold is never stored as their choice (it was, under the old key, which
     is why the rail had stayed shut for everybody; the new key starts every
     browser open). Opening it by hand keeps it open for this visit. */
  var RAILKEY = "smp.copilot.rail2", RAILKEPT = false;
  function railShut(){ try { return localStorage.getItem(RAILKEY) === "shut"; } catch (e) { return false; } }
  function resultOpen(){
    var o = OPEN[key()];
    if (!o || o.kind !== "chat" || !PANE || PANE.id !== o.id || PANE.failed || !PANE.chat) return false;
    if (swotOn() || competeOn() || advOn() || dirsOn() || execOn()) return true;
    if (flowView()) return !CARDSHUT[PANE.chat.id];
    return !!draftMsg();
  }
  /* §653 — THE RAIL STAYS OPEN WHILE THERE IS ROOM (Islam: "collapsing the
     side banner by default … doesn't give the user the ability to know that
     he is on the right chat"). It folds by itself only when the Copilot is
     tight — §670's order: the rail folds first, as soon as three columns
     (1120px) no longer fit beside it; the to-do goes after it — and a fold
     made with the button is kept across visits.
     Reverses §490.2's "a running chat folds the rails". */
  function tight(){
    if (!resultOpen()) return false;
    var p = document.querySelector("[data-cop-pane]"); if (!p) return false;
    /* §670 — the rail folds first, before the to-do (Islam): as soon as the
       three columns (1120px) no longer fit beside the rail (200 + 8) within
       the Copilot's own padding (16). */
    return p.getBoundingClientRect().width / (typeof pageZoom === "function" ? pageZoom() : 1) < 1344;
  }
  function railFolded(){ return railShut() || (tight() && !RAILKEPT); }
  function syncRail(){
    var shut = railFolded();
    var p = document.querySelector("[data-cop-pane]"); if (p) p.classList.toggle("copshut", shut);
    document.querySelectorAll("[data-cop-railtog]").forEach(function(t){ t.setAttribute("aria-expanded", String(!shut)); });
  }
  function setRail(shut){
    try { if (shut) localStorage.setItem(RAILKEY, "shut"); else localStorage.removeItem(RAILKEY); } catch (e) {}
    syncRail(); fitBox();
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
    /* §524 — A SAVED FOUNDATION IS SHOWN AS ITS SIX CARDS, under the
       client's own words, with whether it is on the plan and the same
       Apply the flow's bar carries (Islam: "keep in both"). Edit stays the
       plain-text edit of the whole version; a card is edited from the chat. */
    var fp = cur && cur.body && Array.isArray(cur.body.foundation) ? cur.body.foundation : [];
    /* §525 — A FOUNDATION IS EDITED IN ITS CHAT. The plain-text box made a
       version holding no parts, and Apply to plan then refused it; so Edit
       opens the chat the latest version was built in, where the cards, the
       pen and Edit with AI already work, and a change there starts vN+1. */
    var fchat = "";
    vs.forEach(function(v){ if (!fchat && v.chatId) fchat = v.chatId; });
    /* §654 B2 — EVERY SAVED VERSION IS DRAWN AS ITS TYPE, with whether it is
       on the plan and the same Apply to plan its chat carries (the
       Foundation's page, §524, as the pattern): the rail is a library only
       if what it holds can be read and applied from here. */
    var typed = !editing && cur && cur.body && typeof cur.body === "object" ? typedBodyHtml(d, cur.body) : "";
    if (typed) {
      var onN = d.applied ? d.applied.n : 0;
      body = typed + '<div class="copplanrow" data-cop-planrow>' + (onN
          ? '<span class="copsvst ok">On the plan as v' + E(onN) + (onN < cur.n ? ' · v' + E(cur.n) + ' is not applied yet' : '') + ' · ' + E(nameOf(d.applied.by)) + ' · ' + E(when(d.applied.at)) + '</span>'
          : '<span class="copsvst warn">Not on the plan yet</span>') +
        (canEdit() && d.type !== "advisory" ? '<button type="button" class="copbtn' + (onN === cur.n ? '' : ' solid') + '" data-cop-dapply="' + E(d.id) + '">' + (onN === cur.n ? "Apply to plan again" : "Apply to plan") + '</button>' : '') + '</div>' +
        (onN === cur.n || d.type === "advisory" ? nextHtml(d.section) : '');
    }
    if (d.type === "foundation" && fp.length && !editing) {
      var words = partWords();
      body = '<div class="copfcards">' + fp.map(function(x){
        return '<div class="copfcard"><h5>' + E(words[x.key] || x.name || x.key) + '</h5>' + cardBody(x.text || "", x.key) + '</div>'; }).join("") + '</div>' +
        /* §525.1 — the same green line the flow's bar carries, on the same
           test: the version shown is the version the plan holds. An older
           one applied is said by the row below, which names both numbers. */
        (d.applied && d.applied.n === cur.n ? fdoneHtml(d.applied.n) : '') +
        '<div class="copplanrow" data-cop-planrow>' + (d.applied
          ? '<span class="copsvst ok">On the plan as v' + E(d.applied.n) + (d.applied.n < cur.n ? ' · v' + E(cur.n) + ' is not applied yet' : '') + ' · ' + E(nameOf(d.applied.by)) + ' · ' + E(when(d.applied.at)) + '</span>'
          : '<span class="copsvst warn">Not on the plan yet</span>') +
        (canEdit() ? '<button type="button" class="copbtn solid" data-cop-fapply="' + E(d.id) + '" data-cop-fapply-title="' + E(d.title) + '" data-cop-fapply-n="' + E(cur.n) + '" data-cop-fapply-on="' + E(d.applied ? d.applied.n : 0) + '" data-cop-fapply-parts="' + fp.length + '">Apply to plan</button>' : '') + '</div>';
    }
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
        /* §654 A1 — every structured type is edited in the chat that built
           it (the Foundation's rule, §525): a plain-text version would hold
           none of its parts. */
        (editing || !canEdit() ? '' : ["foundation", "swot", "compete", "directions", "capabilities", "execution"].indexOf(d.type) >= 0
          ? (fchat ? '<button type="button" class="copbtn quiet" data-cop-edit-chat="' + E(fchat) + '">Edit' + (cur ? ' as v' + (cur.n + 1) : '') + '</button>' : '')
          : '<button type="button" class="copbtn quiet" data-cop-edit>Edit</button>') + '</div>' +
      '<div class="copm">Made by ' + E(nameOf(d.by)) + ' · ' + E(when(d.at)) + '</div>' +
      body +
      '<h4 class="copvh">Versions</h4><ol class="copvers">' + hist + '</ol>' +
    '</div>';
  }

  /* §654 B2 — a version's body, drawn as its type (read only; the chat edits). */
  function typedBodyHtml(d, b){
    var li = function(a, f){ return (a || []).length ? '<ul class="copdul">' + a.map(function(x){ return '<li>' + f(x) + '</li>'; }).join("") + '</ul>' : '<p class="copnone">Nothing here.</p>'; };
    if (d.type === "compete" && b.compete && Array.isArray(b.compete.values)) {
      var t = b.compete;
      return '<div class="copdtyped"><p class="copdline"><b>Discipline</b> ' + E(cpWord(t.discipline)) + '</p><div class="tblscroll"><table class="cmptab"><thead><tr><th>Value</th><th>How</th><th>Measure</th></tr></thead><tbody>' +
        t.values.map(function(v){ return '<tr><td><b>' + E(v.title) + '</b></td><td>' + E((v.how || []).join(" · ")) + '</td><td>' + E((v.measure || []).join(" · ")) + '</td></tr>'; }).join("") + '</tbody></table></div></div>';
    }
    if ((d.type === "directions" || d.type === "capabilities") && (Array.isArray(b.directions) || Array.isArray(b.capabilities))) {
      var sc = function(o){ return o.urgency && o.importance && o.ease ? o.urgency * o.importance * o.ease : null; };
      return '<div class="copdtyped">' + ((b.directions || []).length ? '<h5>Directions</h5>' + li(b.directions, function(o){ var n = sc(o); return '<b>' + E(o.title) + '</b>' + (n != null ? ' <span class="copm">· ' + n + ' of 64</span>' : '') + (o.ownedBy ? ' <span class="copm">· ' + E(dvPersonName(o.ownedBy) || o.ownedBy) + '</span>' : ''); }) : '') +
        ((b.capabilities || []).length ? '<h5>Capabilities</h5>' + li(b.capabilities, function(x){ return '<b>' + E(x.title) + '</b>' + (x.kind ? ' <span class="copm">· ' + E(x.kind) + '</span>' : '') + ((x.serves || []).length ? ' <span class="copm">· serves ' + E(x.serves.join(", ")) + '</span>' : '') + (x.ownedBy ? ' <span class="copm">· ' + E(dvPersonName(x.ownedBy) || x.ownedBy) + '</span>' : ''); }) : '') + '</div>';
    }
    if (d.type === "execution" && Array.isArray(b.items)) {
      var per = b.period ? '<p class="copdline"><b>Period</b> ' + E(b.period.y + " · Q" + Math.ceil(b.period.m1 / 3) + (b.period.m2 !== b.period.m1 ? "–Q" + Math.ceil(b.period.m2 / 3) : "")) + '</p>' : '';
      var outs = b.items.filter(function(it){ return it.out && !it.gone; });
      return '<div class="copdtyped">' + per + b.items.filter(function(it){ return !it.out && !it.gone; }).map(function(it){
        return '<h5>' + E(it.title || it.name || "") + '</h5>' + li(it.measures, function(m){ return '<b>' + E(m.name) + '</b> <span class="copm">· ' + E(m.target || "—") + '</span>'; }) +
          li(it.tactics, function(x){ return E(x.name) + ' <span class="copm">· ' + E(x.owner || "—") + (x.quarters && x.quarters.length ? ' · Q' + x.quarters.join(", Q") : '') + '</span>'; }); }).join("") +
        (outs.length ? '<h5>Left out this period</h5><p class="copdline">' + outs.map(function(it){ return E(it.title); }).join(" · ") + ' — nothing drafted, nothing written on Apply.</p>' : '') + '</div>';
    }
    if (d.type === "swot" && b.swot && typeof b.swot === "object") {
      return '<div class="copdtyped copdswot">' + LETTERS.map(function(L){ return '<section><h5>' + E(LETTER_WORD[L]) + '</h5>' + li(b.swot[L], function(x){ return '<b>' + E(x.title) + '</b>' + (x.description ? ' <span class="copm">· ' + E(x.description) + '</span>' : ''); }) + '</section>'; }).join("") + '</div>';
    }
    if (d.type === "advisory" && b.brief && typeof b.brief === "object") return '<div class="copdtyped">' + adBriefHtml(b.brief) + '</div>';
    return "";
  }
  /* §654 B2 — APPLY FROM THE VERSION'S PAGE: the same ask, the same archive
     of the part, the same write its chat makes; the note written once the
     plan's save lands, then the page read again. */
  function delivApplyAsk(){
    var d = PANE.deliverable, cur = PANE.versions && PANE.versions[0], b = cur && cur.body; if (!d || !b) return;
    var kind = d.type === "capabilities" ? "directions" : d.type, capIds = [], write, can, what, replaces;
    var vword = E(d.title) + " v" + E(cur.n), arch = "What the plan holds is archived first, under Import &amp; storage › Archived plans, and can be put back from there.";
    if (d.type === "compete") {
      what = vword + " — " + E(cpWord((b.compete || {}).discipline)) + " and " + ((b.compete || {}).values || []).length + " values onto the plan’s Competitive Discipline."; replaces = arch;
      can = function(){ try { return !!(typeof competeWritable === "function" && competeWritable(place())); } catch (e) { return false; } };
      write = function(){ return { ok: cpWritePlan(b.compete) }; };
    } else if (d.type === "directions" || d.type === "capabilities") {
      var st = { mode: d.type, withCaps: (b.capabilities || []).length > 0, options: (b.directions || []).map(function(o){ var x = JSON.parse(JSON.stringify(o)); x.go = true; return x; }), caps: (b.capabilities || []).map(function(x){ var y = JSON.parse(JSON.stringify(x)); y.keep = true; return y; }) };
      capIds = st.caps.map(function(x){ return x.planId; }).filter(Boolean);
      what = vword + " — " + st.options.length + " Directions and " + st.caps.length + " Capabilities onto the plan."; replaces = "A Direction with the same name is updated, a new one is added; nothing is removed. " + arch;
      can = function(){ var h = dvHolder(); return d.type === "capabilities" ? typeof addCapability === "function" : !!(h && Array.isArray(h.items) && typeof addPillar === "function"); };
      write = function(){ return dvWritePlan(st); };
    } else if (d.type === "execution") {
      var ex = { period: b.period, items: b.items || [] };
      capIds = ex.items.filter(function(it){ return it.kind !== "direction"; }).map(function(it){ return it.planId; }).filter(Boolean);
      var exIns = ex.items.filter(function(it){ return !it.out && !it.gone; });
      what = vword + " — the measures and tactics of " + exIns.length + " items, and the plan period, onto the plan." + (ex.items.length > exIns.length ? " " + (ex.items.length - exIns.length) + " left out, untouched." : ""); replaces = "What each item showed replaces what the plan holds for it: a line with the same name is updated, a new one is added, a line dropped is dropped. " + arch;
      can = function(){ return !!ex.period; };
      write = function(){ return exWritePlan(ex); };
    } else if (d.type === "swot") {
      var n = LETTERS.reduce(function(k, L){ return k + ((b.swot || {})[L] || []).length; }, 0);
      what = vword + " — its " + n + " lines onto the plan’s SWOT."; replaces = arch;
      can = function(){ try { return !!(typeof swotWritable === "function" && swotWritable(place())); } catch (e) { return false; } };
      write = function(){ swWritePlan(b.swot); return { ok: true }; };
    } else return;
    planApplyAsk(what, replaces, function(){
      var title = d.title + " v" + cur.n, did = d.id;
      if (!can()) { SAY = "The plan could not be written from here. Nothing was changed."; draw(); return; }
      planArchive(kind, capIds, "replaced from the Copilot — " + title);
      var r = write();
      if (!r || !r.ok) { SAY = "The plan could not be written from here. What it held is archived under Import & storage › Archived plans."; draw(); return; }
      if (typeof paint === "function") paint(); else draw();
      if (!(typeof SYNC !== "undefined" && SYNC.saveNow)) return;
      SYNC.saveNow(function(how){
        if (!(how === "saved" || how === "clean")) { SAY = "The plan did not save, so " + title + " is not on the plan yet. Try Apply to plan again once the save goes through."; draw(); return; }
        SAY = title + " is on the plan now. What was there before is archived under Import & storage › Archived plans.";
        act({ act:"planApplied", id: did, n: cur.n }, function(){ if (PANE && PANE.deliverable && PANE.deliverable.id === did) openItem("deliv", did); loadList(true); });
      });
    });
  }
  /* ── WRITING INTO OUR OWN NODES ─────────────────────────────────────────
     The rails and the main pane are rewritten; the composer's text is read
     into DRAFT first, so an answer landing while somebody types keeps what
     they typed (§35). */
  function keepDraft(){
    var t = document.querySelector("[data-cop-text]");
    if (t && PANE && PANE.chat) DRAFT[PANE.chat.id] = t.value;
    var st = document.querySelector("[data-cop-starttext]");
    if (st) STARTTEXT[key()] = st.value;
  }
  function draw(){
    keepDraft();
    /* A redraw while a card is a text box (§513) puts the cursor back where
       it was; the text itself is CARDPEN's. */
    var ae = document.activeElement, penAt = ae && ae.matches && ae.matches("[data-cop-pentext]") ? [ae.selectionStart, ae.selectionEnd] : null;
    var rl = document.querySelector("[data-cop-rails]"); if (rl) rl.innerHTML = railsInner();
    var m = document.querySelector("[data-cop-main]"); if (m) m.innerHTML = mainHtml();
    syncRail();
    if (penAt) { var pb = document.querySelector("[data-cop-pentext]"); if (pb) { pb.focus(); try { pb.setSelectionRange(penAt[0], penAt[1]); } catch (e) {} } }
    var msgs = document.querySelector("[data-cop-msgs]"); if (msgs) msgs.scrollTop = msgs.scrollHeight;
    fitPane(); fitBox();
    applyRoad(); applyStart();
    var r = document.querySelector("[data-cop-rename-box]"); if (r && document.activeElement !== r) { r.focus(); r.select(); }
  }
  /* THE PANE FILLS THE WINDOW (§453): it ends at the bottom of the screen,
     measured from its DOCUMENT offset rather than its place on screen, which
     moves with every scroll — the Platform Inbox's own answer (§100.5), with
     no loop, since nothing above the pane moves when the pane changes height. */
  function fitPane(){
    var p = document.querySelector("[data-cop-pane]"); if (!p) return;
    /* §631: in the page's own pixels, as the Platform Inbox's. */
    var top = (p.getBoundingClientRect().top + (window.pageYOffset || 0)) / pageZoom();
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
    if (b) { b.hidden = !t.value.trim() && !(PANE && PANE.pending && PANE.pending.length); setHeld(b, THINKING ? BUSY : ""); if (b.getAttribute("aria-disabled")) b.removeAttribute("title"); else b.setAttribute("title", "Send"); }
  }
  window.addEventListener("resize", function(){ fitPane(); fitBox(); syncRail(); });

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
  /* §653 — the step the SWOT chat is on, for its head. */
  function swStepWord(ph){ return { start:"Start", methods:"Methods", gather:"Gathering", analyses:"Analyses", draft:"The SWOT", check:"Check", saved:"Saved" }[ph] || ""; }
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
      if (boxRef(t).kind === "fn" && typeof FUNCTIONS !== "undefined") sw = (FUNCTIONS[boxRef(t).key] || {}).swot;
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
          var on = swLineKey(t) === cur, pill = t.state === "done" ? "Done" : t.state === "wait" ? "In progress" : "";
          /* Compact (§490.2): the line's "n of m" rides in its title as n/m; the
             status sentence stays on the hover rather than a second line. */
          var nm = /(\d+)\s+of\s+(\d+)/.exec(String(t.status || "")), cnt = nm ? '<i>' + nm[1] + '/' + nm[2] + '</i>' : '';
          var label = '<span class="copsw-tt" title="' + E(t.status || "") + '"><span>' + E(t.title) + '</span>' + cnt + '</span><span class="copsw-ts">' + E(t.status) + '</span>';
          return '<li class="copsw-li ' + t.state + (on ? " on" : "") + '"><span class="copsw-dot" aria-hidden="true"></span>' +
            (t.area && s.phase !== "saved" ? '<button type="button" class="copsw-lb" data-cop-sw-line="' + E(swLineKey(t)) + '"' + (on ? ' aria-current="true"' : '') + '>' + label + '</button>' : '<span class="copsw-lb">' + label + '</span>') +
            '<span class="copsw-pill ' + t.state + '">' + pill + '</span></li>';
        }).join("") + '</ul></div>';
    }).join("");
    return '<aside class="copftodo copsw-side">' +
      '<div class="copsw-box copsw-todo"><div class="copsw-todoh"><div class="copsw-bh"><b>To-do</b> <span class="copsw-n">' + done + '/' + n + '</span>' +
        (s.phase !== "saved" && canEdit() ? '<button type="button" class="linkbu" data-cop-sw-go="methods">Change methods</button>' : '') + '</div>' +
        '<div class="copsw-meter" role="progressbar" aria-valuemin="0" aria-valuemax="' + n + '" aria-valuenow="' + done + '"><i style="width:' + (n ? Math.round(done * 100 / n) : 0) + '%"></i></div></div>' +
        body + '</div>' +
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
  /* ── §641 THE SWOT, SPLIT (design-mockups/copilot-swot-split/
     2026-10-25_swot-conversation-result.html and 2026-10-25_item-details.html,
     signed off: "go with your recommendation"). The chat on the left is DRAWN
     FROM THE STORED SWOT, the Foundation flow's way (§465): the start, the
     methods, each guided question with the answers given so far, the
     analyses and the draft, each with its quick replies — so leaving and
     coming back lands where you were. What is being built stands in the pane:
     the letters so far, then the analyses, then the grid and the check, every
     item a title that opens on a press, with a Titles / Details switch. Save
     and Apply to plan are the pane's foot and never the chat's (Islam: "what
     is the need for the apply or save in the chat?"). ── */
  var SWOPEN = {};               /* chat|item → opened to its description (this visit only) */
  var SWDENSKEY = "smp.copilot.swot.details";
  function swDetails(){ try { return localStorage.getItem(SWDENSKEY) === "1"; } catch (e) { return false; } }
  function swItem(k, title, desc, ev, extra){
    var all = swDetails(), has = !!(desc || ev), open = has && (all || !!SWOPEN[PANE.chat.id + "|" + k]);
    var head = has && !all
      ? '<button type="button" class="copswrow" data-cop-sw-open="' + E(k) + '" aria-expanded="' + open + '"><span class="copswchev" aria-hidden="true">&#9656;</span><b>' + E(title) + '</b>' + (extra || '') + '</button>'
      : '<span class="copswrow"><b>' + E(title) + '</b>' + (extra || '') + '</span>';
    return '<li class="copswi' + (open ? ' open' : '') + '">' + head +
      (open ? '<div class="copswdet">' + (desc ? '<span>' + E(desc) + '</span>' : '') + (ev ? '<span class="copsw-ev">' + E(ev) + '</span>' : '') + '</div>' : '') + '</li>';
  }
  function swOpt(attr, label, rec, off){ var w = off === true ? BUSY : off || ""; return '<button type="button" class="copopt' + (rec ? ' rec' : '') + heldCls(w) + '" ' + attr + held(w) + '>' + E(label) + '</button>'; }
  function swOpts(a){ a = a.filter(Boolean); return a.length ? '<div class="copopts">' + a.join("") + '</div>' : ''; }
  function swLines(d){ return LETTERS.reduce(function(n, L){ return n + ((d && d[L]) || []).length; }, 0); }
  /* "On the plan" is READ, never stored: the plan's SWOT holds exactly the
     saved version's lines, in order. */
  function swPlanHolds(d){
    if (!d) return false;
    var p = planSwot();
    return LETTERS.every(function(L){
      return (d[L] || []).map(function(x){ return String(x.title || "").trim(); }).filter(Boolean).join("\n") === (p[L] || []).join("\n");
    });
  }
  /* The answer box is live only while a guided question is being asked. */
  function swGuidedNow(){
    if (!swotOn() || PANE.swot.phase !== "gather") return false;
    var sel = swSel().split("|");
    return sel[1] === "guided" && ((PANE.swotQuestions || {})[sel[0]] || []).length > 0;
  }
  function swQi(s, area){
    var qs = (PANE.swotQuestions || {})[area] || [], i = s.q && s.q.area === area ? s.q.i : 0;
    return Math.max(0, Math.min(qs.length - 1, i));
  }
  function swotHtml(){
    var s = PANE.swot, c = PANE.chat, busyHere = THINKING === c.id, ed = canEdit();
    var work = busyHere ? '<div class="copmsg product copworking" role="status"><div class="copbody"><span data-cop-wword>' + E(workWord()) + '</span><span class="copdots" aria-hidden="true"><i></i><i></i><i></i></span></div></div>' : '';
    var todo = PANE.swotTodo || [], done = PANE.swotDone || 0;
    var chat = '<div class="copchat copfchat copswchat" data-cop-chatbox style="--copz:' + ZOOMS[zi()] + '">' +
      '<div class="copfhead"><b><span class="copfname">' + E(PANE.chat.title || swTitle()) + '</span>' + (swStepWord(s.phase) ? '<small> · ' + E(swStepWord(s.phase)) + '</small>' : '') + '</b>' + sheetBtn("cards", "View the SWOT") + sheetBtn("todo", "To-do " + done + "/" + todo.length) + sizeHtml() + '</div>' +
      '<div class="copmsgs" data-cop-msgs><div class="copzoom">' + swMsgs(s, ed, busyHere) + work + '</div></div>' +
      (!ed ? VIEWONLY
        : c.archived ? '<div class="copsay copparked">This chat is archived. Restore it to keep going. <button type="button" class="copbtn" data-cop-restore-chat="' + E(c.id) + '">Restore</button></div>'
        : composerHtml(c, false)) + '</div>';
    return '<div class="copflow copswflow' + (SHEET === "cards" || SHEET === "todo" ? " sheet sheet-" + SHEET : "") + '" data-cop-split' + splitStyle() + '>' +
      chat + GRIP + swPaneHtml(s, ed, busyHere) + swSideHtml() + '<div class="copshade" data-cop-sheet=""></div></div>';
  }
  /* ── the conversation, drawn from what is stored ── */
  function swMsgs(s, ed, busyHere){
    var out = [], aw = PANE.swotAreaWord || {}, mw = PANE.swotMethodWord || {};
    var fromPlan = LETTERS.reduce(function(n, L){ return n + ((s.fromPlan || {})[L] || []).length; }, 0);
    if (s.phase === "start" || (s.start && fromPlan)) {
      out.push(aiMsg(E(placeWord()) + ' already has a SWOT — ' + fromPlan + (fromPlan === 1 ? ' line' : ' lines') + ' on the plan today. Start from them, or start fresh?' +
        (s.phase === "start" && ed ? swOpts([swOpt('data-cop-sw-start="plan"', "Start from it", true), swOpt('data-cop-sw-start="fresh"', "Start fresh")]) : '')));
      if (s.start) out.push(meMsg(s.start === "plan" ? "Start from it" : "Start fresh"));
    }
    if (s.phase === "start") return out.join("");
    out.push(aiMsg("How will we gather it? Tick one or more methods for each area — an area with nothing ticked is left out." + (s.phase === "methods" ? swMethodsHtml(s, ed) : ''), s.phase === "methods"));
    if (s.phase === "methods") return out.join("");
    var chosen = ["internal", "micro", "macro"].filter(function(a){ return (s.methods[a] || []).length; });
    out.push(meMsg(chosen.map(function(a){ return (aw[a] || a) + ": " + s.methods[a].map(function(m){ return mw[m] || m; }).join(", "); }).join(" · ")));
    var ext = swExternal(s);
    if (s.phase === "gather") return out.join("") + swLineMsgs(s, ed, busyHere, ext);
    if (s.phase === "analyses") {
      if (!PANE.swotGatherDone && ext.some(function(a){ return !s[a]; }))
        return out.join("") + aiMsg('Finish the lines of the to-do list first.' + (ed ? swOpts([swOpt('data-cop-sw-go="gather"', "Back to the list", true)]) : ''));
      out.push(aiMsg('<b>Every line is done.</b> ' + (ext.length ? 'Now the ' + (ext.length === 2 ? 'two analyses' : 'analysis') + ', on the right.' : 'Next, the SWOT itself.')));
      ext.forEach(function(a){
        var title = a === "micro" ? "micro analysis — the five forces" : "macro analysis — DESTEP", an = s[a];
        if (!an) { out.push(aiMsg('Next, the ' + title + '.' + (ed ? swOpts([swOpt('data-cop-sw-an="' + a + '"', "Write the " + a + " analysis", true, busyHere)]) : ''))); return; }
        if (an.agreed) { out.push(aiMsg('The ' + title + ' is on the right.')); out.push(meMsg("Looks right")); return; }
        var editing = SWEDIT && SWEDIT.area === a;
        out.push(aiMsg('The ' + title + ' is on the right. Does it read right?' + (!ed ? '' : editing
          ? '<div class="copnote">Edit it on the right, then save the changes there.</div>'
          : swOpts([swOpt('data-cop-sw-agree="' + a + '"', "Looks right", true), swOpt('data-cop-sw-an="' + a + '"', "Write it again", false, busyHere), swOpt('data-cop-sw-anedit="' + a + '"', "I'll edit it")]))));
      });
      if (ext.every(function(a){ return s[a] && s[a].agreed; }))
        out.push(aiMsg((ext.length === 2 ? 'Both analyses are agreed' : ext.length ? 'The analysis is agreed' : 'Every line is done') + ' — I can draft the SWOT now.' +
          (ed ? swOpts([swOpt('data-cop-sw-draft', "Draft the SWOT", true, busyHere), swOpt('data-cop-sw-go="gather"', "Back to the list")]) : '')));
      return out.join("");
    }
    if (ext.length) out.push(aiMsg((ext.length === 2 ? 'Both analyses are' : 'The analysis is') + ' agreed.'));
    if (!s.draft) return out.join("") + aiMsg('Ready to draft the SWOT.' + (ed ? swOpts([swOpt('data-cop-sw-draft', "Draft the SWOT", true, busyHere)]) : ''));
    var working = s.phase === "draft" || s.phase === "check";   /* the server's two phases of a draft not yet saved */
    var again = working && ed ? [swOpt('data-cop-sw-draft', "Draft it again", false, busyHere), ext.length ? swOpt('data-cop-sw-go="analyses"', "Go back to the analyses") : ''] : [];
    out.push(aiMsg('The SWOT is drafted — ' + swLines(s.draft) + ' lines, on the right.' + (s.check ? '' : swOpts(working && ed ? [swOpt('data-cop-sw-check', "Check it", true, busyHere)].concat(again) : []))));
    if (s.check) {
      out.push(meMsg("Check it"));
      out.push(aiMsg((s.check.agree.length ? s.check.agree.map(E).join(" ") : 'I checked it.') +
        (s.check.issues.length ? '<ul class="copswiss">' + s.check.issues.map(function(x){ return '<li>' + (x.letter ? '<b>' + E(LETTER_WORD[x.letter] || x.letter) + ':</b> ' : '') + E(x.text) + '</li>'; }).join("") + '</ul>' : ' Nothing to fix.') +
        swOpts(again)));
    }
    /* §654 C2 — SAY WHAT TO CHANGE (§645's decision, built): the asks, the
       proposals and the decisions, in the order they happened; the proposal
       in hand says what differs from the SWOT on the right and waits for
       Use it or Keep as it was — the draft moves only on Use it (§643). */
    (s.log || []).forEach(function(x, k, a){
      if (x.w === "me") { out.push(meMsg(x.t)); return; }
      if (x.w === "note") { out.push('<div class="copfnote">' + E(x.t) + '</div>'); return; }
      var inHand = s.proposal && k === a.length - 1 && s.proposal.reply === x.t;
      out.push(aiMsg(E(x.t) + (inHand ? swDiffHtml(s.draft, s.proposal.draft) +
        (ed && s.phase !== "saved" ? swOpts([swOpt('data-cop-sw-prop="use"', "Use it", true, busyHere), swOpt('data-cop-sw-prop="keep"', "Keep as it was", false, busyHere)]) : '') : ''), !!inHand));
    });
    if (s.phase === "saved" && swPlanHolds(s.draft)) out.push(aiMsg('<b>v' + E(s.saved.n) + '</b> is on the plan.' + nextHtml("analysis")));
    else if (s.phase === "saved") out.push(aiMsg('Saved as <b>' + E(s.saved.title) + ' v' + E(s.saved.n) + '</b>; it is under Deliverables. <b>Apply to plan</b>, at the foot of the SWOT, writes it into the plan’s SWOT.'));
    else if (ed && s.draft && !s.proposal) out.push('<div class="copfnote">Say what to change in the box below — move a line, drop one, reword one — and I will propose it here first.</div>');
    return out.join("");
  }
  /* what a proposal changes, letter by letter: added, dropped, reworded */
  function swDiffHtml(now, next){
    var rows = [];
    LETTERS.forEach(function(L){
      var a = (now && now[L]) || [], b = (next && next[L]) || [], at = {}, bt = {};
      a.forEach(function(x){ at[x.title.toLowerCase()] = x; }); b.forEach(function(x){ bt[x.title.toLowerCase()] = x; });
      var add = b.filter(function(x){ return !at[x.title.toLowerCase()]; }).map(function(x){ return '<li class="add">+ ' + E(x.title) + '</li>'; });
      var drop = a.filter(function(x){ return !bt[x.title.toLowerCase()]; }).map(function(x){ return '<li class="drop">− ' + E(x.title) + '</li>'; });
      var chg = b.filter(function(x){ var o = at[x.title.toLowerCase()]; return o && (o.description !== x.description || o.evidence !== x.evidence); }).map(function(x){ return '<li class="chg">~ ' + E(x.title) + ' <span class="copm">· reworded</span></li>'; });
      if (add.length || drop.length || chg.length) rows.push('<div class="copswdiff-l"><b>' + E(LETTER_WORD[L]) + '</b><ul>' + add.concat(drop, chg).join("") + '</ul></div>');
    });
    return '<div class="copswdiff">' + (rows.length ? rows.join("") : '<span class="copm">Nothing differs from the SWOT on the right.</span>') + '</div>';
  }
  function swCanChange(){ var s = PANE.swot; return !!(swotOn() && canEdit() && s.draft && (s.phase === "draft" || s.phase === "check") && !s.saved && !PANE.chat.archived); }
  /* The line being gathered: a guided question with the answers so far, or
     a source line (a template, a report, the research) with its controls. */
  function swLineMsgs(s, ed, busyHere, ext){
    var sel = swSel(), area = sel.split("|")[0], method = sel.split("|")[1], out = [];
    var aw = PANE.swotAreaWord || {}, mw = PANE.swotMethodWord || {};
    if (area) {
      out.push('<div class="copsw-lh">' + E(aw[area] || area) + ' · ' + E(mw[method] || method) + '</div>');
      if (method === "guided") {
        var qs = (PANE.swotQuestions || {})[area] || [], i = swQi(s, area), ans = s.ans[area] || [];
        for (var j = 0; j < i && j < qs.length; j++) {
          out.push(aiMsg('<span class="copsw-qn">Question ' + (j + 1) + ' of ' + qs.length + ' · ' + E(qs[j].name) + '</span>' + E(qs[j].question)));
          out.push(ans[j] && String(ans[j]).trim() ? meMsg(ans[j]) : '<div class="copmsg product"><div class="copbody">Skipped</div></div>');
        }
        if (qs.length) {
          var q = qs[i], hk = PANE.chat.id + "|" + area + "|" + i;
          var sug = SWSUG && SWSUG.id === PANE.chat.id && SWSUG.area === area && SWSUG.i === i ? SWSUG : null;
          out.push(aiMsg('<span class="copsw-qn">Question ' + (i + 1) + ' of ' + qs.length + ' · ' + E(q.name) + '</span><span class="copsw-qt">' + E(q.question) + '</span>' +
            (SWHELP[hk] ? swHelpHtml(q) : '') +
            (sug ? '<div class="copsw-used">' + (sug.used && sug.used.length ? 'A suggested answer is in the box — written from ' + E(sug.used.join(" · ")) : 'A suggested answer is in the box — written from the plan and what is attached here') + '. Change it as you like, then send.</div>' : '') +
            swOpts([swOpt('data-cop-sw-help="' + E(hk) + '"', SWHELP[hk] ? "Hide the help" : "Help me understand"),
              ed ? swOpt('data-cop-sw-answer="' + area + '|' + i + '"', "Answer for me", false, busyHere) : '',
              i > 0 ? swOpt('data-cop-sw-q="' + area + '|' + (i - 1) + '"', "Previous") : '',
              i < qs.length - 1 ? swOpt('data-cop-sw-q="' + area + '|' + (i + 1) + '"', ans[i] && String(ans[i]).trim() ? "Next question" : "Skip this one") : ''])));
          if (ans[i] && String(ans[i]).trim()) out.push(meMsg(ans[i]));
        }
      } else out.push(aiMsg(swSourceLineHtml(s, area, method, ed, busyHere), true));
      var todo = PANE.swotTodo || [], cur = todo.filter(function(t){ return swLineKey(t) === sel; })[0];
      var nextOpen = todo.filter(function(t){ return t.area && t.state !== "done" && swLineKey(t) !== sel; })[0];
      if (cur && cur.state === "done" && nextOpen && !PANE.swotGatherDone)
        out.push(aiMsg('This line is done. Next: ' + E((aw[nextOpen.area] || nextOpen.area) + " · " + nextOpen.title) + '.' +
          swOpts([swOpt('data-cop-sw-line="' + E(swLineKey(nextOpen)) + '"', "Go to it", true)])));
    }
    if (PANE.swotGatherDone)
      out.push(aiMsg('<b>Every line is done.</b> ' + (ext.length ? 'Next, the micro and macro analyses.' : 'Next, the SWOT itself.') +
        (ed ? swOpts([swOpt('data-cop-sw-go="analyses"', "Carry on", true)]) : '')));
    return out.join("");
  }
  function swMethodsHtml(s, ed){
    var off = PANE.swotOffered || {}, mw = PANE.swotMethodWord || {}, aw = PANE.swotAreaWord || {};
    var cols = ["guided", "template", "report", "research"], any = ["internal","micro","macro"].some(function(a){ return (s.methods[a] || []).length; });
    return '<div class="copsw-gridwrap"><table class="copsw-grid"><thead><tr><th></th>' + cols.map(function(m){ return '<th>' + E(mw[m] || m) + '</th>'; }).join("") + '</tr></thead><tbody>' +
      ["internal","micro","macro"].map(function(a){
        return '<tr><th scope="row">' + E(aw[a] || a) + '</th>' + cols.map(function(m){
          if ((off[a] || []).indexOf(m) < 0) return '<td class="na">—</td>';
          var on = (s.methods[a] || []).indexOf(m) >= 0;
          return '<td><button type="button" class="copsw-tick' + (on ? " on" : "") + heldCls(!ed) + '" data-cop-sw-m="' + a + '|' + m + '" aria-pressed="' + on + '"' + held(ed ? "" : VIEWWHY) +
            ' aria-label="' + E((aw[a] || a) + " — " + (mw[m] || m)) + '">' + (on ? '&#10003;' : '') + '</button></td>';
        }).join("") + '</tr>';
      }).join("") + '</tbody></table></div>' +
      (ed ? swOpts([swOpt('data-cop-sw-go="gather"', "Continue", true, any ? "" : "Tick at least one method first.")]) + (any ? '' : '<div class="copnote">Tick at least one method to carry on.</div>') : '');
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
      (method === "research" && ed ? '<div class="copbtns"><button type="button" class="copbtn' + heldCls(busyHere && BUSY) + '" data-cop-sw-prompt="' + area + '"' + held(busyHere && BUSY) + '>Download the research prompt (.txt)</button></div>' : '') +
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
  /* ── the pane: what is being built ── */
  function swPaneHtml(s, ed, busyHere){
    var vn = s.saved ? s.saved.n : (PANE.swotNextVersion || 1), det = swDetails();
    var head = '<div class="copsh copswph"><span class="copvline"><b>' + E(swTitle()) + ' v' + E(vn) + '</b> · ' + (s.phase === "saved" ? "saved" : "in progress") + '</span>' +
      '<span class="copswdens" role="group" aria-label="Show">' +
        '<button type="button" data-cop-sw-dens="0" aria-pressed="' + !det + '">Titles</button>' +
        '<button type="button" data-cop-sw-dens="1" aria-pressed="' + det + '">Details</button></span>' +
      '<button type="button" class="copcx copsheetx" data-cop-sheet="" aria-label="Close" title="Close">×</button></div>';
    var body;
    if (s.draft && (s.phase === "draft" || s.phase === "check" || s.phase === "saved")) body = swGridHtml(s.draft) + swCheckHtml(s);
    else if (s.phase === "analyses" && swExternal(s).length) body = swExternal(s).map(function(a){ return swAnalysisPage(s, a, ed, busyHere); }).join("");
    else body = swSoFarHtml(s);
    return '<div class="copleft copswpane" data-cop-swpane>' + head + '<div class="copswpb">' + body + '</div>' + swFootHtml(s, ed, busyHere) + '</div>';
  }
  function swGridHtml(d){
    return '<div class="copsw-swot">' + LETTERS.map(function(L){
      return '<section class="copsw-l ' + L + '"><h3>' + E(LETTER_WORD[L]) + ' <span class="copsw-n">' + d[L].length + (d[L].length === 1 ? ' item' : ' items') + '</span></h3><ol class="copswol">' +
        d[L].map(function(it, i){ return swItem(L + i, it.title, it.description, it.evidence); }).join("") + '</ol></section>';
    }).join("") + '</div>';
  }
  function swCheckHtml(s){
    return s.check ? '<div class="copsw-card copsw-check"><h3>The check</h3>' +
      (s.check.agree.length ? '<ul class="ok">' + s.check.agree.map(function(x){ return '<li>' + E(x) + '</li>'; }).join("") + '</ul>' : '') +
      (s.check.issues.length ? '<ul class="bad">' + s.check.issues.map(function(x){ return '<li>' + (x.letter ? '<b>' + E(LETTER_WORD[x.letter] || x.letter) + ':</b> ' : '') + E(x.text) + '</li>'; }).join("") + '</ul>' : '') + '</div>' : '';
  }
  function swSoFarHtml(s){
    var cov = PANE.swotCover || {}, fp = s.start === "plan" ? (s.fromPlan || {}) : {};
    return '<p class="copnote">So far, per letter. The SWOT is drafted once the lines are gathered' + (swExternal(s).length ? ' and the analyses agreed' : '') + '.</p>' +
      '<div class="copsw-swot">' + LETTERS.map(function(L){
        var k = cov[L] || 0, lines = fp[L] || [];
        return '<section class="copsw-l ' + L + '"><h3>' + E(LETTER_WORD[L]) + ' <span class="copsw-n">' + (k ? k + (k === 1 ? " source" : " sources") : "Nothing yet") + '</span></h3>' +
          (lines.length ? '<ol class="copswol">' + lines.map(function(t){ return '<li class="copswi"><span class="copswrow"><b>' + E(t) + '</b></span></li>'; }).join("") + '</ol><div class="copsw-used">From the plan</div>' : '') + '</section>';
      }).join("") + '</div>';
  }
  function swFootHtml(s, ed, busyHere){
    var saved = s.phase === "saved" && s.saved, on = saved && swPlanHolds(s.draft);
    /* §653 — the same one-line path as the Foundation's foot. */
    var sb = [];
    if (saved) sb.push('<b>v' + E(s.saved.n) + '</b> saved'); else { sb.push('<b>v' + E(s.saved ? s.saved.n + 1 : (PANE.swotNextVersion || 1)) + '</b> in progress'); if (s.saved) sb.push('v' + E(s.saved.n) + ' saved'); }
    if (on) sb.push('<span class="on">v' + E(s.saved.n) + ' on the plan</span>');
    var state = '<span class="copsvst" data-cop-swstate>' + sb.join(' <i>·</i> ') + '</span>';
    return '<div class="copoutf copswfoot" data-cop-swfoot>' + state + '<span class="copsw-sp"></span>' +
      (ed ? (function(){
        var wf = busyHere ? BUSY : !s.draft ? "Draft the SWOT first." : !(s.phase === "draft" || s.phase === "check") ? "Nothing has changed since it was saved." : "";
        var wa = busyHere ? BUSY : !saved ? "Save it first — the plan only takes a saved version." : "";
        return '<button type="button" class="copbtn' + heldCls(wf) + '" data-cop-sw-finish' + held(wf) + '>Save</button>' +
          '<button type="button" class="copbtn solid' + heldCls(wa) + '" data-cop-sw-apply' + held(wa) + '>Apply to plan</button>'; })() : '') + '</div>';
  }
  function swAnalysisPage(s, area, ed, busyHere){
    var an = s[area], aw = PANE.swotAreaWord || {}, qs = (PANE.swotQuestions || {})[area] || [];
    var title = area === "micro" ? "Micro analysis — the five forces" : "Macro analysis — DESTEP";
    if (!an) return '<div class="copsw-card"><h3>' + E(title) + '</h3><p class="copnote">Not written yet — the chat offers to write it.</p></div>';
    var editing = SWEDIT && SWEDIT.area === area, src = editing ? SWEDIT.data : an;
    return '<div class="copsw-card copsw-an"><h3>' + E(title) + (an.agreed ? ' <span class="copsw-pill done">Agreed</span>' :  ' <span class="copsw-pill wait">In progress</span>') +
      (ed && !editing ? ' <button type="button" class="linkbu" data-cop-sw-anedit="' + area + '">Edit</button>' : '') + '</h3>' +
      '<div class="copsw-forces">' + src.items.map(function(it, k){
        var q = qs.filter(function(x){ return x.key === it.key; })[0] || { name: it.key };
        return '<div class="copsw-force"><h4>' + E(q.name) + '</h4>' +
          (it.factors.length ? '<ul class="copswol">' + it.factors.map(function(f, j){
            return editing
              ? '<li><input class="fld" data-cop-sw-fe="' + k + '|' + j + '|title" value="' + E(f.title) + '" aria-label="Title">' +
                '<textarea class="fld" rows="2" data-cop-sw-fe="' + k + '|' + j + '|description" aria-label="Description">' + E(f.description) + '</textarea></li>'
              : swItem("an|" + area + "|" + k + "|" + j, f.title, f.description, f.evidence);
          }).join("") + '</ul>' : '<p class="copnote">Nothing found here.</p>') +
          (it.from && !editing ? '<div class="copsw-used">Used: ' + E(it.from) + '</div>' : '') + '</div>';
      }).join("") + '</div>' +
      (ed && editing ? '<div class="copbtns"><button type="button" class="copbtn solid" data-cop-sw-ansave="' + area + '">Save the changes</button><button type="button" class="copbtn quiet" data-cop-sw-anedit-no>Cancel</button></div>' : '') + '</div>';
  }
  function swExternal(s){ return ["micro","macro"].filter(function(a){ return (s.methods[a] || []).length; }); }
  /* APPLY TO PLAN WRITES THE PLAN (§641; before it, Save did): the server
     keeps the deliverable; the plan's SWOT is the page's graph, so the
     titles are written here, into the same writable view the SWOT page's
     own Add writes (swotWritable), and the ordinary autosave carries them —
     the one deliberate paint() in this file, after a press rather than
     inside a fetch's tail. What stood is archived first (archiveSwot). */
  function swWritePlan(d){
    var w = null;
    try { w = typeof swotWritable === "function" ? swotWritable(place()) : null; } catch (e) { w = null; }
    if (!w || !d) return false;
    LETTERS.forEach(function(L){ w[L] = (d[L] || []).map(function(x){ return x.title; }).filter(Boolean); });
    return true;
  }
  function swApplyAsk(){
    var s = PANE.swot;
    if (!s || !s.saved || !s.draft || typeof openModalHtml !== "function") return;
    var n = swLines(s.draft), had = LETTERS.reduce(function(k, L){ return k + (planSwot()[L] || []).length; }, 0);
    openModalHtml("Apply to the plan?", "",
      '<div class="sendconfirm"><div class="kv"><span class="k">Where</span><span>' + E(placeWord()) + '</span></div>' +
      '<div class="kv"><span class="k">What</span><span>' + E(s.saved.title) + ' v' + E(s.saved.n) + ' — its ' + n + ' lines go onto the plan’s SWOT.</span></div>' +
      '<div class="kv"><span class="k">What it replaces</span><span>' + (had
        ? 'The ' + had + (had === 1 ? ' line' : ' lines') + ' the plan holds today are archived first, under Import &amp; storage › Archived plans, and can be put back from there.'
        : 'The plan holds no SWOT yet, so nothing is replaced.') + '</span></div>' +
      '<div class="cbtns"><button type="button" data-cop-apply-no="1">Cancel</button><button type="button" class="copgo" data-cop-swapply-yes="1">Apply to plan</button></div></div>');
    var mb = document.getElementById("modal-b"); if (!mb) return;
    mb.addEventListener("click", function(ev){
      if (hit(ev, "[data-cop-apply-no]")) { closeModal(); return; }
      if (hit(ev, "[data-cop-swapply-yes]")) { closeModal(); swApplyGo(); }
    });
  }
  function swApplyGo(){
    var s = PANE.swot, title = s.saved.title + " v" + s.saved.n, w = null;
    try { w = typeof swotWritable === "function" ? swotWritable(place()) : null; } catch (e) { w = null; }
    if (!w || typeof archiveSwot !== "function") { SAY = "The plan’s SWOT could not be written from here. Nothing was changed."; draw(); return; }
    archiveSwot(place(), "replaced from the Copilot — " + title);
    swWritePlan(s.draft);
    if (typeof paint === "function") paint(); else draw();
    var saveNow = typeof SYNC !== "undefined" && SYNC.saveNow;
    if (!saveNow) return;
    SYNC.saveNow(function(how){
      SAY = how === "saved" || how === "clean"
        ? title + " is on the plan now. What was there before is archived under Import & storage › Archived plans."
        : "The plan did not save, so " + title + " is not on the plan yet. Try Apply to plan again once the save goes through.";
      draw();
    });
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
    if ((b = hit(ev, "[data-cop-sw-q]"))) { var qi = b.getAttribute("data-cop-sw-q").split("|"); g = swCopy(); g.q = { area: qi[0], i: +qi[1] }; SWSUG = null;
      var tq = document.querySelector("[data-cop-text]"); if (tq) tq.value = ""; DRAFT[id] = ""; swSave(g); return true; }
    if ((b = hit(ev, "[data-cop-sw-help]"))) { var hk = b.getAttribute("data-cop-sw-help"); SWHELP[hk] = !SWHELP[hk]; draw(); return true; }
    if ((b = hit(ev, "[data-cop-sw-answer]"))) {
      var ai = b.getAttribute("data-cop-sw-answer").split("|");
      swAsk({ act:"swotAnswer", area: ai[0], i: +ai[1], swot: swCopy() }, function(j){
        SWSUG = { id: id, area: ai[0], i: +ai[1], used: j.used || [] };
        /* draw() first keeps what the box shows (keepDraft), so the box
           itself takes the suggestion, not only DRAFT. */
        var tb = document.querySelector("[data-cop-text]"); if (tb) tb.value = j.answer || "";
        DRAFT[id] = j.answer || ""; draw(); tb = document.querySelector("[data-cop-text]"); if (tb) tb.focus();
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
    if ((b = hit(ev, "[data-cop-sw-prop]"))) { if (THINKING) return true; var use = b.getAttribute("data-cop-sw-prop") === "use", pid = PANE.chat.id;
      act({ act:"swotProposal", id: pid, use: use, placeWord: placeWord() }, function(j){ if (PANE && PANE.chat && PANE.chat.id === pid) swView(j); draw(); }); return true; }
    if ((b = hit(ev, "[data-cop-sw-finish]"))) {
      if (b.disabled) return true;
      act({ act:"swotFinish", id: id, placeWord: placeWord() }, function(j){
        if (PANE && PANE.chat && PANE.chat.id === id) swView(j);
        SAY = ""; LISTS[key()] = null; loadList(true); draw();
      });
      return true;
    }
    if ((b = hit(ev, "[data-cop-sw-apply]"))) { if (!b.disabled) swApplyAsk(); return true; }
    if ((b = hit(ev, "[data-cop-sw-open]"))) { var ok = PANE.chat.id + "|" + b.getAttribute("data-cop-sw-open"); SWOPEN[ok] = !SWOPEN[ok]; draw(); return true; }
    if ((b = hit(ev, "[data-cop-sw-dens]"))) { try { if (b.getAttribute("data-cop-sw-dens") === "1") localStorage.setItem(SWDENSKEY, "1"); else localStorage.removeItem(SWDENSKEY); } catch (e) {} draw(); return true; }
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
  /* EVERY CHAT ON THIS CLIENT IS ONE PRESS FROM HERE (§501): the list page
     left the module menu with the settings, so its door is the rail it
     lists. Drawn only where there is a client address to go to. */
  function allChatsLink(){
    var s = slug();
    return s ? '<a class="copall" data-cop-all href="/' + E(s) + '/copilot">All chats on this client &rsaquo;</a>' : '';
  }
  function railsInner(){
    return allChatsLink() + '<section class="coprail copchats' + (folded("chats") ? " copfolded" : "") + '"><div class="coprh" data-cop-chatshead>' + chatsHead() + foldBtn("chats", "chats") + '</div>' +
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
  var CPMORE = {}, CPINT = {}, CPASKTXT = {}, CPSCORES = {}, CPPEND = null, CPUNCH = {};
  function competeOn(){ return !!(PANE && PANE.chat && PANE.compete); }
  function cpCopy(){ return JSON.parse(JSON.stringify(PANE.compete)); }
  function cpView(j){ ["compete","competeApplied","competeNextVersion","competeTodo","competeDone","competeFactors","competeResult","competeWords"]
    .forEach(function(k){ if (j && k in j) PANE[k] = j[k]; }); }
  function cpProgress(id){
    var l = list(); if (l && l.swotProgress && PANE && PANE.competeTodo) l.swotProgress[id] = { done: PANE.competeDone, of: PANE.competeTodo.length };
  }
  function cpTitle(){ return "Competitive Discipline — " + placeWord(); }
  /* §695 S11 — the plan's Competitive Discipline, when it holds one. */
  function cpPlanHeld(){
    /* Read, never written: competeWritable would make the plan's compete
       object where there is none and dirty the plan on every draw. */
    var h = null; try { h = typeof competeHolder === "function" ? competeHolder(place()) : null; } catch (e) { h = null; }
    var w = h && h.compete && typeof h.compete === "object" ? h.compete : null;
    if (!w || !w.discipline || !Array.isArray(w.values)) return null;
    var vals = w.values.filter(function(v){ return v && String(v.title || "").trim(); }).map(function(v){ return { title: String(v.title).trim(), how: (v.how || []).slice(), measure: (v.measure || []).slice() }; });
    return vals.length ? { discipline: w.discipline, values: vals } : null;
  }
  /* The discipline's word from the open chat's words, or the platform's own
     when no chat is open (§695: the start screen's plan card names it). */
  var CP_DISC_WORD = { btc: "Best Total Cost", bts: "Best Total Solution", bp: "Best Product" };
  function cpWord(d){ return (((PANE && PANE.competeWords) || {}).disc || {})[d] || CP_DISC_WORD[d] || d; }
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
    return '<aside class="copftodo copsw-side"><div class="copsw-box copsw-todo"><div class="copsw-todoh"><div class="copsw-bh"><b>To-do</b> <span class="copsw-n">' + done + '/' + n + '</span></div>' +
      '<div class="copsw-meter" role="progressbar" aria-valuemin="0" aria-valuemax="' + n + '" aria-valuenow="' + done + '"><i style="width:' + (n ? Math.round(done * 100 / n) : 0) + '%"></i></div></div>' +
      '<div class="copsw-tg"><ul>' + todo.map(function(t){
        return '<li class="copsw-li ' + t.state + '" data-cop-cp-todo="' + E(t.key) + '"><span class="copsw-dot" aria-hidden="true"></span>' +
          '<span class="copsw-lb"><span class="copsw-tt" title="' + E(t.status) + '"><span>' + E(t.title) + '</span></span><span class="copsw-ts">' + E(t.status) + '</span></span>' +
          '<span class="copsw-pill ' + t.state + '">' + (t.state === "done" ? "Done" : "") + '</span></li>';
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
    /* §694 S2 — the choice can be changed once made: a link under the
       recommendation brings the three back, saying what goes with the change. */
    var again = !!(s.chosen && ed && CPUNCH[PANE.chat.id]);
    var opts = (!s.chosen || again) && ed ? '<div class="copopts"><button type="button" class="copopt rec" data-cop-cp-choose="' + E(m.leader) + '">Yes, ' + E(cpWord(m.leader)) + '</button>' +
        ((W.discs || []).filter(function(d){ return d !== m.leader; }).map(function(d){
          return '<button type="button" class="copopt" data-cop-cp-choose="' + E(d) + '">Choose ' + E(cpWord(d)) + ' instead</button>'; }).join("")) +
        (again ? '<button type="button" class="copopt" data-cop-cp-unchoose>Never mind</button></div><p class="copnote">Choosing another clears the values and the table drawn for ' + E(cpWord(s.chosen)) + '; the scores stay.</p>'
          : '<button type="button" class="copopt" data-cop-cp-more="1">Let me change scores</button></div>')
      : s.chosen && ed ? '<div class="copopts"><button type="button" class="linkbu" data-cop-cp-unchoose>Choose a different discipline</button></div>' : '';
    /* §695 S11 — scored as a check of the plan's choice: the line says
       whether the market agrees, and nobody "went with" anything here. */
    if (s.fromPlan && s.chosen && !again) line += m.leader === s.chosen ? ' That matches the plan’s choice.' : ' The plan’s choice is <b>' + E(cpWord(s.chosen)) + '</b> — keep it, or choose ' + E(cpWord(m.leader)) + ' instead.';
    var h = aiMsg(line + (s.chosen ? '' : ' Go with it?') + opts);
    return s.chosen && !s.fromPlan ? h + meMsg("Go with " + cpWord(s.chosen) + ".") : h;
  }
  function cpCardsHtml(ed){
    var s = PANE.compete, picked = {};
    (s.picked || []).forEach(function(n){ picked[n] = true; });
    var n = (s.picked || []).length;
    var h = aiMsg('Here are ' + s.suggested.length + ' values for <b>' + E(cpWord(s.chosen)) + '</b>. Tick the ones closest to how you want to win — usually 3 or 4.') +
      '<div class="copcp-cards">' + s.suggested.map(function(v, k){
        var on = !!picked[k];
        return '<div class="copcp-card' + (on ? " on" : "") + '">' +
          (ed ? '<button type="button" class="copsw-tick' + (on ? " on" : "") + '" data-cop-cp-pick="' + k + '" aria-pressed="' + on + '" aria-label="Tick ' + E(v.title) + '">&#10003;</button>'
            : '<span class="copsw-tick' + (on ? " on" : "") + '">&#10003;</span>') +
          '<h4>' + E(v.title) + '</h4><div class="copsw-lh">How</div><ul>' + v.how.map(function(x){ return '<li>' + E(x) + '</li>'; }).join("") + '</ul>' +
          '<div class="copsw-lh">Measure</div><ul>' + v.measure.map(function(x){ return '<li>' + E(x) + '</li>'; }).join("") + '</ul></div>';
      }).join("") + '</div>';
    if (ed) h += '<div class="copopts"><button type="button" class="copopt rec" data-cop-cp-use' + held(n ? "" : "Tick at least one value first.") + '>Use the ' + n + ' I ticked</button>' +
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
  /* §654 C1 — COMPETITIVE DISCIPLINE, SPLIT THREE WAYS (the SWOT's shape,
     §641–§653; the sweep's C1, Competitive Discipline first): the chat on
     the left, in the order it happened; the work — the scores, then the
     table — on the right, where it stays put; Save and Apply to plan at the
     pane's foot; the to-do beside. A change is asked for in the chat's own
     box, not a second box under the table. */
  function cpStepWord(s){
    return s.saved ? "Saved" : s.table ? "The table" : s.chosen ? "The values" : (((PANE.competeResult || {}).market) || {}).complete ? "The discipline" : "Scores";
  }
  function cpCanType(){ var s = PANE.compete; return !!(canEdit() && s && s.table && !s.saved && !PANE.chat.archived); }
  function competeHtml(){
    var s = PANE.compete, c = PANE.chat, ed = canEdit() && !s.saved, busyHere = THINKING === c.id;
    var work = busyHere ? '<div class="copmsg product copworking" role="status"><div class="copbody"><span data-cop-wword>' + E(workWord()) + '</span><span class="copdots" aria-hidden="true"><i></i><i></i><i></i></span></div></div>' : '';
    var todo = PANE.competeTodo || [], done = PANE.competeDone || 0;
    var chat = '<div class="copchat copfchat copswchat copcpchat" data-cop-chatbox style="--copz:' + ZOOMS[zi()] + '">' +
      '<div class="copfhead"><b><span class="copfname">' + E(c.title || cpTitle()) + '</span><small> · ' + E(cpStepWord(s)) + '</small></b>' + sheetBtn("cards", s.table ? "View the table" : "View the scores") + sheetBtn("todo", "To-do " + done + "/" + todo.length) + '</div>' +
      '<div class="copmsgs" data-cop-msgs><div class="copzoom">' + cpMsgs(s, ed, busyHere) + work + '</div></div>' +
      (!canEdit() ? VIEWONLY
        : c.archived ? '<div class="copsay copparked">This chat is archived. Restore it to keep going. <button type="button" class="copbtn" data-cop-restore-chat="' + E(c.id) + '">Restore</button></div>'
        : composerHtml(c, false)) + '</div>';
    return '<div class="copflow copswflow' + (SHEET === "cards" || SHEET === "todo" ? " sheet sheet-" + SHEET : "") + '" data-cop-split' + splitStyle() + '>' +
      chat + GRIP + cpPaneHtml(s, ed, busyHere) + cpSideHtml() + '<div class="copshade" data-cop-sheet=""></div></div>';
  }
  /* the conversation, drawn from what is stored, in the order it happened */
  function cpMsgs(s, ed, busyHere){
    var out = [], m = ((PANE.competeResult || {}).market) || {};
    /* §695 S11 — started from the plan: the table is already on the right,
       and scoring is a check of the plan's choice, offered not owed. */
    if (s.fromPlan && s.table) out.push(aiMsg('Started from the plan’s Competitive Discipline — <b>' + E(cpWord(s.table.discipline)) + '</b> and ' + s.table.values.length + (s.table.values.length === 1 ? ' value' : ' values') + ', as the table on the right. Every cell can be edited there; ask here for a change. Score the three disciplines to check the choice.' +
      (!m.complete && ed ? swOpts([swOpt('data-cop-cp-score', "Score them", true, busyHere)]) : '')));
    else out.push(aiMsg("I will score the three value disciplines — Best Total Cost, Best Total Solution and Best Product — against 10 market factors and 10 internal ones, from what the plan says about " + E(placeWord()) + ". The scores go on the right; you can change any of them." +
      (!m.complete && ed ? swOpts([swOpt('data-cop-cp-score', "Score them", true, busyHere)]) : '')));
    if (!m.complete && !(s.fromPlan && s.table)) return out.join("");
    if (m.complete) {
    out.push(meMsg("Score them"));
    out.push(aiMsg("Scored — the 20 factors are on the right, 0, 1 or 2 for each discipline. The market decides; the internal scores are a check." + (ed && !s.chosen ? " Press a score there to change it." : "")));
    out.push(cpRecHtml(ed));
    if (!s.chosen) return out.join("");
    }
    if (!(s.fromPlan && s.table && !s.suggested.length)) {
    if (s.suggested.length && !s.table) out.push(cpCardsHtml(ed));
    else if (!s.suggested.length) out.push(aiMsg("Next, the values — the three or four things " + E(placeWord()) + " will be known for." + (ed && !busyHere ? swOpts([swOpt('data-cop-cp-again', "Suggest values", true)]) : '')));
    if (!s.table) return out.join("");
    /* §644 — the cards fold where they happened, and open again on a press */
    out.push(cpValuesFold(s));
    out.push(meMsg("Use these " + s.table.values.length + "."));
    out.push(aiMsg("Here is the table, on the right" + (ed ? " — every cell can be edited there before saving. Ask for a change here: another title, a How to drop, a Measure to add. <b>Save</b>, at the foot of the table, keeps it as a version." : ".")));
    }
    (s.log || []).forEach(function(x, k, a){
      if (x.w === "me") { out.push(meMsg(x.t)); return; }
      var last = k === a.length - 1;
      out.push(aiMsg(E(x.t) + (last && ed && s.alts && s.alts.length ? swOpts(s.alts.map(function(t){ return swOpt('data-cop-cp-alt="' + E(t) + '"', t, false, busyHere); })) : '')));
    });
    if (s.saved && appliedOn(s.saved, PANE.competeApplied)) out.push(aiMsg('<b>v' + E(s.saved.n) + '</b> is on the plan.' + nextHtml("compete")));
    else if (s.saved) out.push(aiMsg('Saved as <b>' + E(s.saved.title) + ' v' + E(s.saved.n) + '</b>; it is under Deliverables. <b>Apply to plan</b>, at the foot of the table, writes it into the plan’s Competitive Discipline.'));
    return out.join("");
  }
  function cpValuesFold(s){
    var open = !!FOLD[PANE.chat.id + ":cpvals"], picked = {}; (s.picked || []).forEach(function(n){ picked[n] = true; });
    var n = (s.picked || []).length, bits = s.suggested.length + " offered · " + n + " ticked";
    var body = open ? '<div class="coppfb"><div class="copcp-cards small">' + s.suggested.map(function(v, k){
        return '<div class="copcp-card' + (picked[k] ? " on" : "") + '"><span class="copsw-tick' + (picked[k] ? " on" : "") + '">&#10003;</span><h4>' + E(v.title) + '</h4></div>'; }).join("") + '</div></div>' : '';
    return '<div class="coppf' + (open ? ' open' : '') + '" data-cop-foldbox="cpvals"><button type="button" class="coppfh" data-cop-pfold="cpvals" aria-expanded="' + open + '">' +
      '<span class="copchev" aria-hidden="true">▸</span><b>The values</b><small>' + E(bits) + '</small><span class="copst done">Agreed</span></button>' + body + '</div>';
  }
  /* the work, on the right: the scores, then the table above them */
  function cpPaneHtml(s, ed, busyHere){
    var m = ((PANE.competeResult || {}).market) || {}, id = PANE.chat.id, vn = s.saved ? s.saved.n : (PANE.competeNextVersion || 1);
    var head = '<div class="copsh copswph"><span class="copvline"><b>' + E(cpTitle()) + ' v' + E(vn) + '</b> · ' + (s.saved ? "saved" : "in progress") + '</span>' +
      '<button type="button" class="copcx copsheetx" data-cop-sheet="" aria-label="Close" title="Close">×</button></div>';
    var body;
    if (!m.complete) body = (s.fromPlan && s.table ? '<div class="copsw-card copcp-tablecard"><h3>The table</h3>' + cpTableHtml(ed) + (ed ? '<p class="copnote">From the plan — every cell is editable here before saving.</p>' : '') + '</div>' : '') +
      '<div class="copsw-card"><h3>The scores</h3><p class="copnote">' + (s.fromPlan ? 'Nothing scored yet — ask the chat to score the three disciplines, as a check of the plan’s choice.' : 'Nothing scored yet — the chat scores the three disciplines first.') + '</p></div>';
    else {
      /* §694 S2 — the scores settle at the choice, not at the table: a changed
         score always has an effect, and after the choice the way to change
         them is to choose again. */
      var scoresOpen = !s.table || !!CPSCORES[id], scEd = ed && (!s.chosen || s.fromPlan);
      var scores = '<div class="copsw-card copcp-scores"><h3>The scores' + (s.table ? ' <button type="button" class="linkbu" data-cop-cp-scores aria-expanded="' + scoresOpen + '">' + (scoresOpen ? "Hide" : "Show") + '</button>' : '') + '</h3>' +
        (scoresOpen ? cpScoreTable("market", scEd) +
          '<div class="copopts"><button type="button" class="linkbu" data-cop-cp-int aria-expanded="' + !!CPINT[id] + '">' + (CPINT[id] ? "Hide internal factors" : "Show internal factors (" + (((PANE.competeFactors || {}).internal) || []).length + ")") + '</button></div>' +
          (CPINT[id] ? cpScoreTable("internal", scEd) : '') + (ed && s.chosen && !s.fromPlan ? '<p class="copnote">Settled at the choice of ' + E(cpWord(s.chosen)) + ' — <button type="button" class="linkbu" data-cop-cp-unchoose>choose a different discipline</button> to change them.</p>' : '') : '') + '</div>';
      body = s.table ? '<div class="copsw-card copcp-tablecard"><h3>The table</h3>' + cpTableHtml(ed) + (ed ? '<p class="copnote">Every cell is editable here before saving.</p>' : '') + '</div>' + scores : scores;
    }
    return '<div class="copleft copswpane copcppane" data-cop-cppane>' + head + '<div class="copswpb">' + body + '</div>' + cpFootHtml(s, busyHere) + '</div>';
  }
  function cpFootHtml(s, busyHere){
    var saved = !!s.saved, note = PANE.competeApplied, on = saved && ((note && note.n === s.saved.n) || APPLIED[PANE.chat.id] === s.saved.n);
    var sb = [];
    if (saved) { sb.push('<b>v' + E(s.saved.n) + '</b> saved'); sb.push(on ? '<span class="on">v' + E(s.saved.n) + ' on the plan</span>' : 'not on the plan yet'); }
    else sb.push('<b>v' + E(PANE.competeNextVersion || 1) + '</b> in progress');
    var state = '<span class="copsvst" data-cop-cpstate>' + sb.join(' <i>·</i> ') + '</span>';
    return '<div class="copoutf copswfoot" data-cop-cpfoot>' + state + '<span class="copsw-sp"></span>' +
      (canEdit() ? (function(){
        var wf = busyHere ? BUSY : saved ? "Nothing has changed since it was saved." : !s.table ? "Pick the values first — the table is what is saved." : "";
        var wa = busyHere ? BUSY : !saved ? "Save it first — the plan only takes a saved version." : "";
        return '<button type="button" class="copbtn' + heldCls(wf) + '" data-cop-cp-finish' + held(wf) + '>Save</button>' +
          '<button type="button" class="copbtn solid' + heldCls(wa) + '" data-cop-cp-apply' + held(wa) + '>' + (on ? "Apply to plan again" : "Apply to plan") + '</button>'; })() : '') + '</div>';
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
    if ((b = hit(ev, "[data-cop-cp-apply]"))) { if (canEdit() && s.saved) cpApplyAsk(); return true; }
    if ((b = hit(ev, "[data-cop-cp-int]"))) { CPINT[id] = !CPINT[id]; draw(); return true; }
    if ((b = hit(ev, "[data-cop-cp-more]"))) { CPMORE[id] = b.getAttribute("data-cop-cp-more") === "1" ? true : !CPMORE[id]; if (b.getAttribute("data-cop-cp-more") === "1" && tight()) SHEET = "cards"; draw(); return true; }
    if ((b = hit(ev, "[data-cop-cp-scores]"))) { CPSCORES[id] = !CPSCORES[id]; draw(); return true; }
    if ((b = hit(ev, "[data-cop-pfold]"))) { var fk = id + ":" + b.getAttribute("data-cop-pfold"); if (FOLD[fk]) delete FOLD[fk]; else FOLD[fk] = true; draw(); return true; }
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
    if ((b = hit(ev, "[data-cop-cp-choose]"))) {
      var dsc = b.getAttribute("data-cop-cp-choose"); CPUNCH[id] = false;
      if (s.chosen && s.chosen === dsc) { draw(); return true; }
      cpAsk({ act:"competeValues", compete:{ chosen: dsc } }); return true;
    }
    if ((b = hit(ev, "[data-cop-cp-unchoose]"))) { CPUNCH[id] = !CPUNCH[id]; draw(); return true; }
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
    if ((b = hit(ev, "[data-cop-cp-finish]"))) {
      if (THINKING) return true;
      act({ act:"competeFinish", id:id, placeWord:placeWord() }, function(j){
        if (PANE && PANE.chat && PANE.chat.id === id) cpView(j);
        cpProgress(id);
        /* §654 B1 — SAVE IS A VERSION, NOT THE PLAN (the §645 rule, which
           Competitive Discipline had skipped): the plan moves only on Apply
           to plan, which asks first and archives what stood. */
        SAY = "";
        LISTS[key()] = null; loadList(true);
        draw();
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
    var h = '<aside class="copftodo copsw-side"><div class="copsw-box copsw-todo"><div class="copsw-todoh"><div class="copsw-bh"><b>To-do</b> <span class="copsw-n">' + done + '/' + n + '</span></div>' +
      '<div class="copsw-meter" role="progressbar" aria-valuemin="0" aria-valuemax="' + n + '" aria-valuenow="' + done + '"><i style="width:' + (n ? Math.round(done * 100 / n) : 0) + '%"></i></div></div>' +
      '<div class="copsw-tg"><ul>' + todo.map(function(t){
        return '<li class="copsw-li ' + t.state + '" data-cop-ad-todo="' + E(t.key) + '"><span class="copsw-dot" aria-hidden="true"></span>' +
          '<span class="copsw-lb"><span class="copsw-tt" title="' + E(t.status) + '"><span>' + E(t.title) + '</span></span><span class="copsw-ts">' + E(t.status) + '</span></span>' +
          '<span class="copsw-pill ' + t.state + '">' + (t.state === "done" ? "Done" : "") + '</span></li>';
      }).join("") + '</ul></div></div>';
    var pips = ""; for (var k = 0; k < c.of; k++) pips += '<i class="' + (k < c.asked ? "u" : "") + '"></i>';
    h += '<div class="copsw-box adbudget" data-cop-ad-budget><div class="copsw-bh"><b>Round ' + c.round + ' of ' + c.rounds + '</b> <span class="copsw-n">' + c.asked + ' of ' + c.of + ' asked</span></div>' +
      '<div class="adpips" aria-hidden="true">' + pips + '</div>' +
      '<p class="adwhy">' + (s.brief ? (c.stopped && c.asked < c.of ? "Proceeded after " + c.asked + " of " + c.of + "." : "The questions are done.") : c.stopped ? "You asked it to proceed with what it has." :
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
    if (t.how === "assumed") return meMsg(W.assume || "Assume for me");
    if (t.how === "platform") return meMsg((cw.platform || "Use the platform figure") + " — " + t.answer);
    if (t.how === "file") return meMsg((cw.file || "Use the file") + " — " + t.answer);
    return t.how ? meMsg(t.answer) : "";
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
  /* §688 — ADVISORY, SPLIT THREE WAYS (the last area; the working mockup
     design-mockups/copilot-layout/2026-10-29_advisory-split-working.html,
     Islam: "ok proceed and build the advisory split"): the conversation
     stays the conversation — the question, then one question at a time with
     its choices under it, a typed answer through the chat's own box; the
     Decision Brief is the work on the right, with what was assumed before it
     is written; Save at the pane's foot and no Apply — Advisory stays in the
     Copilot (§645); the to-do, the round box and what it can see beside. */
  function adStepWord(s){ return s.saved ? "Saved" : s.brief ? "The brief" : s.ask ? "Questions" : "Your question"; }
  function adPending(s){ var t = s.turns[s.turns.length - 1]; return t && !t.how ? t : null; }
  function adCanType(){ var s = PANE.advisory; if (!s || !canEdit() || s.saved || PANE.chat.archived) return false; return !s.ask || !!s.brief || !!adPending(s); }
  function advHtml(){
    var s = PANE.advisory, c = PANE.chat, ed = canEdit() && !s.saved, busyHere = THINKING === c.id;
    var work = busyHere ? '<div class="copmsg product copworking" role="status"><div class="copbody"><span data-cop-wword>' + E(workWord()) + '</span><span class="copdots" aria-hidden="true"><i></i><i></i><i></i></span></div></div>' : '';
    var todo = PANE.advisoryTodo || [], done = PANE.advisoryDone || 0;
    var chat = '<div class="copchat copfchat copswchat copadchat adv" data-cop-chatbox style="--copz:' + ZOOMS[zi()] + '">' +
      '<div class="copfhead"><b><span class="copfname">' + E(c.title || adTitle()) + '</span><small> · ' + E(adStepWord(s)) + '</small></b>' + sheetBtn("cards", "View the brief") + sheetBtn("todo", "To-do " + done + "/" + todo.length) + '</div>' +
      '<div class="copmsgs" data-cop-msgs><div class="copzoom">' + adMsgs(s, ed, busyHere) + work + '</div></div>' +
      (!canEdit() ? VIEWONLY
        : c.archived ? '<div class="copsay copparked">This chat is archived. Restore it to keep going. <button type="button" class="copbtn" data-cop-restore-chat="' + E(c.id) + '">Restore</button></div>'
        : composerHtml(c, false)) + '</div>';
    return '<div class="copflow copswflow' + (SHEET === "cards" || SHEET === "todo" ? " sheet sheet-" + SHEET : "") + '" data-cop-split' + splitStyle() + '>' +
      chat + GRIP + adPaneHtml(s, ed, busyHere) + adSideHtml() + '<div class="copshade" data-cop-sheet=""></div></div>';
  }
  function adMsgs(s, ed, busyHere){
    var out = [], W = PANE.advisoryWords || {}, cw = W.clash || {}, last = s.turns.length - 1;
    out.push(aiMsg("Bring me a decision you are weighing about " + E(placeWord()) + ". I will ask a few questions — one at a time — then write a Decision Brief with options and one recommendation."));
    if (!s.ask) return out.join("");
    out.push(meMsg(s.ask));
    s.turns.forEach(function(t, k){
      var inRound = s.turns.slice(0, k + 1).filter(function(x){ return x.round === t.round; }).length;
      var q = '<div class="adq">Round ' + t.round + ' · Question ' + inRound + ' of ' + ((PANE.advisoryCount || {}).of || 5) + '</div>';
      if (k === last && s.lead && !s.brief) q += '<p>' + E(s.lead) + '</p>';
      q += '<p>' + E(t.q) + '</p>';
      if (t.clash) q += '<div class="adclash"><b>Two sources disagree on ' + E(t.clash.what) + '</b><div class="adsrc">' +
        adTag("platform") + '<span>' + E(t.clash.platform) + '</span>' + adTag("file") + '<span>' + E(t.clash.file) + '</span></div></div>';
      if (!t.how && ed && !busyHere && !s.brief) q += '<div class="copopts" data-cop-ad-choices>' +
        (t.clash ? '<button type="button" class="copopt" data-cop-ad-reply="platform">' + E(cw.platform || "Use the platform figure") + '</button>' +
                   '<button type="button" class="copopt" data-cop-ad-reply="file">' + E(cw.file || "Use the file") + '</button>' : '') +
        '<button type="button" class="copopt" data-cop-ad-reply="assume">' + E(W.assume || "Assume for me") + '</button>' +
        '<button type="button" class="copopt" data-cop-ad-reply="proceed">' + E(W.proceed || "Proceed with what you have") + '</button></div>';
      out.push(aiMsg(q, true));
      /* Proceed marks the open question assumed on the row; the chat says what was pressed */
      if (s.stopped && k === last && t.how === "assumed") out.push(meMsg(W.proceed || "Proceed with what you have"));
      else { var a = adAnswerHtml(t); if (a) out.push(a); }
    });
    if (s.stopped && (!s.turns.length || s.turns[last].how !== "assumed")) out.push(meMsg(W.proceed || "Proceed with what you have"));
    if (!s.brief && ed && !busyHere && !adPending(s)) out.push(aiMsg((s.stopped ? "" : "Nothing is waiting on you. ") + '<div class="copopts"><button type="button" class="copopt rec" data-cop-ad-next>' + ((PANE.advisoryCount || {}).owed || s.stopped ? "Write the brief" : "Continue") + '</button></div>'));
    if (s.brief) {
      var n = s.brief.options.length, as = (s.assumed || []).length;
      out.push(aiMsg((s.lead ? E(s.lead) + ' ' : '') + 'The brief is on the right: <b>' + E(s.brief.title) + '</b> — ' + n + (n === 1 ? ' option' : ' options') + ', one recommended' + (as ? ', ' + as + (as === 1 ? ' thing' : ' things') + ' assumed' : '') + '.' +
        (ed ? ' Ask here for a change — another option, a different recommendation, a step to add — or <b>Save</b> at the foot.' : '')));
      (s.log || []).forEach(function(x){ out.push(x.w === "me" ? meMsg(x.t) : aiMsg(E(x.t))); });
    }
    if (s.saved) out.push(aiMsg('Saved as <b>' + E(s.saved.title) + ' v' + E(s.saved.n) + '</b>; it is under Advisory deliverables. It stays in the Copilot and does not go into the plan.' + nextHtml("advisory")));
    return out.join("");
  }
  function adPaneHtml(s, ed, busyHere){
    var head = '<div class="copsh copswph"><span class="copvline"><b>' + E(s.brief ? s.brief.title : adTitle()) + ' v' + E(s.saved ? s.saved.n : 1) + '</b> · ' + (s.saved ? "saved" : s.brief ? "brief written" : "in progress") + '</span>' +
      '<button type="button" class="copcx copsheetx" data-cop-sheet="" aria-label="Close" title="Close">×</button></div>';
    var body;
    if (s.brief) body = adBriefHtml(s.brief);
    else body = '<div class="copsw-card"><h3>The Decision Brief</h3><p class="copnote">' + (s.ask ? "Not written yet — the questions first. It comes here once they are answered, or when you proceed with what it has." : "Nothing yet — bring a decision in the chat.") + '</p></div>' +
      ((s.assumed || []).length ? '<div class="copsw-card"><h3>Assumed so far</h3><ul class="adlist">' + s.assumed.map(function(a){ return '<li>' + adTag("assumed") + ' ' + E(a) + '</li>'; }).join("") + '</ul></div>' : '');
    return '<div class="copleft copswpane copadpane" data-cop-adpane>' + head + '<div class="copswpb">' + body + '</div>' + adFootHtml(s, busyHere) + '</div>';
  }
  function adFootHtml(s, busyHere){
    var saved = !!s.saved, state = '<span class="copsvst" data-cop-adstate>' + (saved ? '<b>v' + E(s.saved.n) + '</b> saved' : '<b>v1</b> in progress') + '</span>';
    return '<div class="copoutf copswfoot" data-cop-adfoot>' + state + '<span class="copsw-sp"></span>' +
      (canEdit() ? (function(){
        var wf = busyHere ? BUSY : saved ? "Nothing has changed since it was saved." : !s.brief ? "The brief is not written yet — answer the questions, or proceed with what it has." : "";
        return '<button type="button" class="copbtn solid' + heldCls(wf) + '" data-cop-ad-finish' + held(wf) + '>Save</button>'; })() : '') +
      '<span class="copm copadstays" title="An Advisory brief is kept under Deliverables and never written into the plan (§645)">Stays in the Copilot</span></div>';
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
  function dvView(j){ ["dirs","dirsApplied","dirsNextVersion","dirsTodo","dirsDone","dirsScores","dirsWords","dirsBlocker"]
    .forEach(function(k){ if (j && k in j) PANE[k] = j[k]; }); }
  function dvCopy(){ return JSON.parse(JSON.stringify(PANE.dirs)); }
  function dvProgress(id){
    var l = list(); if (l && l.swotProgress && PANE && PANE.dirsTodo) l.swotProgress[id] = { done: PANE.dirsDone, of: PANE.dirsTodo.length };
  }
  function dvTitle(mode){ return (mode === "capabilities" ? "Capabilities — " : "Directions — ") + placeWord(); }
  function dvFns(){
    var ks = []; try { ks = typeof activeFunctionKeys === "function" ? activeFunctionKeys() : []; } catch (e) { ks = []; }
    return ks.map(function(k){ return { key: k, name: (FUNCTIONS[k] && FUNCTIONS[k].name) || k, head: (FUNCTIONS[k] && FUNCTIONS[k].head) || "" }; });
  }
  function dvFnName(k){ var f = dvFns().filter(function(x){ return x.key === k; })[0]; return f ? f.name : ""; }
  /* §626: A CAPABILITY'S OWNER IS A PERSON, the one its page shows (Islam:
     *"fix the copilot owner as you recommend"*). The chat stored a FUNCTION
     and the save wrote it into `c.fn`, the field §544.13 retired — nothing
     showed it as the owner, and "Clear all plans" on that function still
     emptied the capability. So a capability's row picks from the register
     (Setup's own pool, every active person), the model's suggested function
     arrives as that function's head (the server maps it), and the save
     writes the Owner through Setup's own door, grantPersonRole (§33). A
     Direction's owner is still a function, as spec 064 §8 has it. */
  function dvPeople(){
    var ps = []; try { ps = (PEOPLE || []).filter(function(p){ return p && p.key && p.name && personActive(p); }); } catch (e) { ps = []; }
    return ps.map(function(p){ return { key: p.key, name: p.name }; })
      .sort(function(a, b){ return a.name.localeCompare(b.name); });
  }
  /* A row saved before §626 holds a function's key: read it as that
     function's head, so an open chat does not lose the pick it made. */
  function dvCapOwner(k){
    if (!k) return "";
    try {
      if (personBy(k)) return k;
      var f = FUNCTIONS[k];
      return f && f.head && personBy(f.head) ? f.head : "";
    } catch (e) { return ""; }
  }
  function dvPersonName(k){ try { return k ? personName(k) : ""; } catch (e) { return ""; } }
  function dvHolder(){ try { return typeof unitLikeWritable === "function" ? unitLikeWritable(place()) : null; } catch (e) { return null; } }
  /* The plan's Directions as they stand — what the chat may start from, and
     what a Capabilities chat says it serves. */
  function dvExisting(){
    var h = dvHolder(), items = (h && Array.isArray(h.items)) ? h.items : [];
    /* §654 B5 — a row from the plan carries the scores the plan holds. */
    return items.filter(function(p){ return p && String(p.name || "").trim(); }).map(function(p){ return { id: String(p.id || ""), title: String(p.name).trim(), urgency: p.urgency, importance: p.importance, ease: p.ease, ownedBy: p.ownedBy || "" }; });
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
    return '<aside class="copftodo copsw-side"><div class="copsw-box copsw-todo"><div class="copsw-todoh"><div class="copsw-bh"><b>To-do</b> <span class="copsw-n">' + done + '/' + n + '</span></div>' +
      '<div class="copsw-meter" role="progressbar" aria-valuemin="0" aria-valuemax="' + n + '" aria-valuenow="' + done + '"><i style="width:' + (n ? Math.round(done * 100 / n) : 0) + '%"></i></div></div>' +
      '<div class="copsw-tg"><ul>' + todo.map(function(t){
        return '<li class="copsw-li ' + t.state + '" data-cop-dv-todo="' + E(t.key) + '"><span class="copsw-dot" aria-hidden="true"></span>' +
          '<span class="copsw-lb"><span class="copsw-tt" title="' + E(t.status) + '"><span>' + E(t.title) + '</span></span><span class="copsw-ts">' + E(t.status) + '</span></span>' +
          '<span class="copsw-pill ' + t.state + '">' + (t.state === "done" ? "Done" : "") + '</span></li>';
      }).join("") + '</ul></div></div></aside>';
  }
  var DV_MARK = { plan:"Plan", yours:"Yours", "new":"New" };
  function dvMark(m){ return DV_MARK[m] ? ' <span class="copdv-mk ' + E(m) + '">' + DV_MARK[m] + '</span>' : ''; }
  function dvOwnerCell(kind, i, k, ed){
    if (kind === "c") {
      var who = dvCapOwner(k);
      if (!ed) return E(dvPersonName(who) || "—");
      return '<select class="fld copdv-own" data-cop-dv-own="c|' + i + '" aria-label="Owner"><option value="">—</option>' +
        dvPeople().map(function(p){ return '<option value="' + E(p.key) + '"' + (p.key === who ? ' selected' : '') + '>' + E(p.name) + '</option>'; }).join("") + '</select>';
    }
    if (!ed) return E(dvFnName(k) || "—");
    return '<select class="fld copdv-own" data-cop-dv-own="' + kind + '|' + i + '" aria-label="Owned by"><option value="">—</option>' +
      dvFns().map(function(f){ return '<option value="' + E(f.key) + '"' + (f.key === k ? ' selected' : '') + '>' + E(f.name) + '</option>'; }).join("") + '</select>';
  }
  function dvTick(attr, on, label, ed, why){
    return ed ? '<button type="button" class="copsw-tick' + (on ? " on" : "") + '" ' + attr + held(why || "") + ' aria-pressed="' + on + '" aria-label="' + E(label) + '">&#10003;</button>'
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
          '<td>' + dvTick('data-cop-dv-go="' + i + '"', !!o.go, "Go ahead with " + o.title, ed, sc[i] == null && !o.go ? "Score it first — Urgency, Importance and Ease." : "") + '</td></tr>';
      }).join("") + '</tbody></table></div>';
  }
  function dvCapsHtml(ed){
    var s = PANE.dirs, W = PANE.dirsWords || {}, kinds = W.kinds || ["gap","transformation","enabler"], kw = W.kindWord || {};
    return '<div class="copcp-wrap"><table class="copcp-tab copdv-tab"><thead><tr><th scope="col">Capability</th><th scope="col">Kind</th><th scope="col">Serves</th><th scope="col">Owner</th><th scope="col">Keep</th></tr></thead><tbody>' +
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
    return '<div class="copopts"><button type="button" class="copopt' + heldCls(busyHere && BUSY) + '" data-cop-dv-more="' + what + '"' + held(busyHere && BUSY) + '>Suggest more</button>' +
      '<button type="button" class="copopt" data-cop-dv-add="' + what + '">+ Add my own</button></div>' +
      (DVADD[id] === what ? '<div class="copcp-ask"><input class="fld" data-cop-dv-owntitle value="' + E(DVOWN[id] || "") + '" placeholder="' + (what === "caps" ? "A Capability of your own" : "A Direction of your own") + '" aria-label="Your own">' +
        '<button type="button" class="copbtn' + heldCls(busyHere && BUSY) + '" data-cop-dv-addgo="' + what + '"' + held(busyHere && BUSY) + '>Add</button></div>' : '') +
      '<div class="copcp-ask"><textarea class="fld" data-cop-dv-ask rows="2" placeholder="Ask for something — a couple more, or a different angle" aria-label="Ask the Copilot">' + E(DVASK[id] || "") + '</textarea>' +
      '<button type="button" class="copbtn' + heldCls(busyHere && BUSY) + '" data-cop-dv-send="' + what + '"' + held(busyHere && BUSY) + '>Send</button></div>';
  }
  /* §675 — DIRECTIONS, SPLIT THREE WAYS (the SWOT's shape, §641–§653;
     Competitive Discipline's, §654 C1; the working mockup
     design-mockups/copilot-layout/2026-10-29_directions-split-working.html,
     Islam: "ok proceed and build it"): the chat on the left in the order it
     happened; the Directions and the Capabilities on the right where they
     stay put, Go ahead under the Directions; Save and Apply to plan at the
     pane's foot; the to-do beside. Asks for more go through the chat's own
     box; "+ Add my own" turns the box into a line of your own. */
  function dvStepWord(s){
    if (s.saved) return "Saved";
    if (s.mode === "capabilities") return "The Capabilities";
    if (!s.start) return "Start";
    return s.chose && s.withCaps ? "The Capabilities" : "The Directions";
  }
  function dvCanType(){ var s = PANE.dirs; if (!s || !canEdit() || s.saved || PANE.chat.archived) return false; return s.mode === "capabilities" ? s.caps.length > 0 : s.options.length > 0; }
  function dvAskWhat(){ var s = PANE.dirs; return s.mode === "capabilities" || (s.chose && s.withCaps) ? "caps" : "dirs"; }
  function dirsHtml(){
    var s = PANE.dirs, c = PANE.chat, ed = canEdit() && !s.saved, busyHere = THINKING === c.id;
    var work = busyHere ? '<div class="copmsg product copworking" role="status"><div class="copbody"><span data-cop-wword>' + E(workWord()) + '</span><span class="copdots" aria-hidden="true"><i></i><i></i><i></i></span></div></div>' : '';
    var todo = PANE.dirsTodo || [], done = PANE.dirsDone || 0;
    var chat = '<div class="copchat copfchat copswchat copdvchat" data-cop-chatbox style="--copz:' + ZOOMS[zi()] + '">' +
      '<div class="copfhead"><b><span class="copfname">' + E(c.title || dvTitle(s.mode)) + '</span><small> · ' + E(dvStepWord(s)) + '</small></b>' + sheetBtn("cards", "View the tables") + sheetBtn("todo", "To-do " + done + "/" + todo.length) + '</div>' +
      '<div class="copmsgs" data-cop-msgs><div class="copzoom">' + dvMsgs(s, ed, busyHere) + work + '</div></div>' +
      (!canEdit() ? VIEWONLY
        : c.archived ? '<div class="copsay copparked">This chat is archived. Restore it to keep going. <button type="button" class="copbtn" data-cop-restore-chat="' + E(c.id) + '">Restore</button></div>'
        : composerHtml(c, false)) + '</div>';
    return '<div class="copflow copswflow' + (SHEET === "cards" || SHEET === "todo" ? " sheet sheet-" + SHEET : "") + '" data-cop-split' + splitStyle() + '>' +
      chat + GRIP + dvPaneHtml(s, ed, busyHere) + dvSideHtml() + '<div class="copshade" data-cop-sheet=""></div></div>';
  }
  /* the conversation, drawn from what is stored, in the order it happened */
  function dvMsgs(s, ed, busyHere){
    var out = [], id = PANE.chat.id, g = s.options.filter(function(o){ return o.go; });
    var moreOpts = function(what){ return ed && !busyHere ? swOpts([swOpt('data-cop-dv-more="' + what + '"', "Suggest more"), swOpt('data-cop-dv-add="' + what + '"', DVADD[id] === what ? "Never mind" : "+ Add my own")]) : ''; };
    var logOf = function(p, withOpts){
      var rows = (s.log || []).filter(function(x){ return x.p === p; });
      return rows.map(function(x, k){
        if (x.w === "me") return meMsg(x.t);
        return aiMsg(E(x.t) + (withOpts && k === rows.length - 1 ? moreOpts(p) : ''));
      }).join("");
    };
    if (s.mode === "directions") {
      if (s.hadPlan) {
        out.push(aiMsg('The plan already has <b>' + s.hadPlan + '</b> ' + (s.hadPlan === 1 ? "Direction" : "Directions") + '. Start from them, or start fresh?' +
          (!s.start && ed && !busyHere ? swOpts([swOpt('data-cop-dv-start="plan"', "Start from the existing ones", true), swOpt('data-cop-dv-start="fresh"', "Start fresh")]) : '')));
        if (!s.start) return out.join("");
        out.push(meMsg(s.start === "plan" ? "Start from the existing ones" : "Start fresh"));
      }
      if (!s.options.length) {
        out.push(aiMsg('I will suggest the Directions ' + E(placeWord()) + ' could take, from the plan as it stands, and score each by Urgency × Importance × Ease.' + (ed && !busyHere ? swOpts([swOpt('data-cop-dv-suggest', "Suggest Directions", true)]) : '')));
        return out.join("");
      }
      out.push(meMsg("Suggest Directions"));
      var dirsLog = (s.log || []).some(function(x){ return x.p === "dirs"; });
      out.push(aiMsg('Here are <b>' + s.options.length + '</b> possible Directions, scored out of ' + E(String((PANE.dirsWords || {}).max || 64)) + ', on the right. Change any score there, set who owns it, and tick what goes ahead' + (ed && !s.chose ? ' — then <b>Go ahead</b>, under the table' : '') + '.' +
        (ed && !s.chose ? ' Ask here for a couple more, or a different angle.' : '') + (!s.chose && !dirsLog ? moreOpts("dirs") : '')));
      out.push(logOf("dirs", !s.chose));
      if (!s.chose) {
        /* §694 S1 — opened again after Go ahead: said once, here. */
        if (s.caps.length) out.push(aiMsg('The Directions are open again — scores, owners and ticks as they were. Change the ticks, then <b>Go ahead</b> under the table. The ' + s.caps.length + ' Capabilities suggested so far are kept, marked as suggested for the earlier set.'));
        return out.join("");
      }
      /* §644 — the Directions fold where they were agreed, opening on a press */
      out.push(dvFoldHtml(s));
      out.push(meMsg("Go ahead with these " + g.length + "."));
      if (s.withCaps) {
        out.push(aiMsg(g.length + (g.length === 1 ? " Direction" : " Directions") + " chosen. Next, the Capabilities we need to deliver them." +
          (!s.caps.length && ed && !busyHere ? swOpts([swOpt('data-cop-dv-caps', "Suggest Capabilities", true)]) : '')));
        if (!s.caps.length) return out.join("");
        out.push(meMsg("Suggest Capabilities"));
      }
    } else {
      var have = dvExisting();
      out.push(aiMsg(have.length ? 'I read your <b>' + have.length + '</b> saved ' + (have.length === 1 ? "Direction" : "Directions") + ' and the SWOT. These are the Capabilities I would build to deliver them.'
        : 'This place has no saved Directions yet, so I will work from the SWOT alone.') + (!s.caps.length && ed && !busyHere ? swOpts([swOpt('data-cop-dv-caps', "Suggest Capabilities", true)]) : ''));
      if (!s.caps.length) return out.join("");
      out.push(meMsg("Suggest Capabilities"));
    }
    if (s.caps.length) {
      var capsLog = (s.log || []).some(function(x){ return x.p === "caps"; });
      out.push(aiMsg((s.caps.length === 1 ? 'Here is <b>1</b> Capability' : 'Here are <b>' + s.caps.length + '</b> Capabilities') + ', on the right. Set the kind and the owner there, and keep the ones to build.' +
        (ed ? ' Ask here for a couple more, or a different angle. <b>Save</b>, at the foot of the tables, keeps them as a version.' : '') + (!capsLog ? moreOpts("caps") : '')));
      out.push(logOf("caps", true));
    }
    if (s.saved && appliedOn(s.saved, PANE.dirsApplied)) out.push(aiMsg('<b>v' + E(s.saved.n) + '</b> is on the plan.' + nextHtml("directions")));
    else if (s.saved) out.push(aiMsg('Saved as <b>' + E(s.saved.title) + ' v' + E(s.saved.n) + '</b>; it is under Deliverables. <b>Apply to plan</b>, at the foot of the tables, writes it into the plan.'));
    return out.join("");
  }
  function dvFoldHtml(s){
    var open = !!FOLD[PANE.chat.id + ":dvopts"], sc = PANE.dirsScores || [], g = s.options.filter(function(o){ return o.go; });
    var body = open ? '<div class="coppfb"><ul class="copdul">' + s.options.map(function(o, i){
        return '<li>' + (o.go ? '<b>' : '') + E(o.title) + (o.go ? '</b>' : '') + ' <span class="copm">· ' + (sc[i] == null ? "unscored" : sc[i] + " of " + ((PANE.dirsWords || {}).max || 64)) + (o.go ? " · goes ahead" : "") + (o.ownedBy ? " · " + E(dvFnName(o.ownedBy) || o.ownedBy) : "") + '</span></li>'; }).join("") + '</ul>' + (canEdit() && !s.saved && s.chose ? '<p class="copnote"><button type="button" class="linkbu" data-cop-dv-unchoose>Change the Directions</button> — opens the table again; what is ticked, scored and owned stays.</p>' : '') + '</div>' : '';
    return '<div class="coppf' + (open ? ' open' : '') + '" data-cop-foldbox="dvopts"><button type="button" class="coppfh" data-cop-pfold="dvopts" aria-expanded="' + open + '">' +
      '<span class="copchev" aria-hidden="true">▸</span><b>The Directions</b><small>' + s.options.length + ' offered · ' + g.length + ' ticked</small><span class="copst done">Agreed</span></button>' + body + '</div>';
  }
  /* the work, on the right: the Directions, Go ahead under them, then the Capabilities */
  function dvPaneHtml(s, ed, busyHere){
    var g = s.options.filter(function(o){ return o.go; }), k = s.caps.filter(function(x){ return x.keep; });
    var vn = s.saved ? s.saved.n : (PANE.dirsNextVersion || 1);
    var head = '<div class="copsh copswph"><span class="copvline"><b>' + E(dvTitle(s.mode)) + ' v' + E(vn) + '</b> · ' + (s.saved ? "saved" : "in progress") + '</span>' +
      '<button type="button" class="copcx copsheetx" data-cop-sheet="" aria-label="Close" title="Close">×</button></div>';
    var body = '';
    if (s.mode === "directions") {
      /* §694 S1 — Go ahead can be undone: Change the Directions, on the card
         head and in the chat's folded row, unsets the choice and keeps the rest. */
      body += '<div class="copsw-card copdv-card"><h3>The Directions' + (s.options.length ? ' <span class="copsw-n">' + s.options.length + ' offered · ' + g.length + ' ticked</span>' : '') +
        (ed && s.chose ? ' <button type="button" class="linkbu copdv-unchoose" data-cop-dv-unchoose' + held(busyHere ? BUSY : "") + '>Change the Directions</button>' : '') + '</h3>' +
        (s.options.length ? dvOptionsHtml(ed && !s.chose) +
          (ed && !s.chose ? '<div class="copdv-under"><button type="button" class="copbtn" data-cop-dv-go-all' + held(busyHere ? BUSY : g.length ? "" : "Tick at least one Direction first.") + '>Go ahead with the ' + g.length + ' ticked</button></div>' : '')
          : '<p class="copnote">Nothing suggested yet — the chat suggests them first.</p>') + '</div>';
      if (s.withCaps) body += '<div class="copsw-card copdv-card"><h3>The Capabilities' + (s.caps.length ? ' <span class="copsw-n">' + s.caps.length + ' suggested · ' + k.length + ' kept</span>' : '') + '</h3>' +
        (s.caps.length ? (!s.chose ? '<p class="copnote">Suggested for the earlier set of Directions — they stay; untick any that no longer fit.</p>' : '') + dvCapsHtml(ed) : '<p class="copnote">' + (s.chose ? 'Nothing suggested yet — the chat suggests them next.' : 'After the Directions.') + '</p>') + '</div>';
    } else {
      body += '<div class="copsw-card copdv-card"><h3>The Capabilities' + (s.caps.length ? ' <span class="copsw-n">' + s.caps.length + ' suggested · ' + k.length + ' kept</span>' : '') + '</h3>' +
        (s.caps.length ? dvCapsHtml(ed) : '<p class="copnote">Nothing suggested yet — the chat suggests them first.</p>') + '</div>';
    }
    return '<div class="copleft copswpane copdvpane" data-cop-dvpane>' + head + '<div class="copswpb">' + body + '</div>' + dvFootHtml(s, busyHere) + '</div>';
  }
  function dvFootHtml(s, busyHere){
    var saved = !!s.saved, note = PANE.dirsApplied, on = saved && ((note && note.n === s.saved.n) || APPLIED[PANE.chat.id] === s.saved.n), g = s.options.filter(function(o){ return o.go; }), k = s.caps.filter(function(x){ return x.keep; });
    var sb = [];
    if (saved) { sb.push('<b>v' + E(s.saved.n) + '</b> saved'); sb.push(on ? '<span class="on">v' + E(s.saved.n) + ' on the plan</span>' : 'not on the plan yet'); }
    else sb.push('<b>v' + E(PANE.dirsNextVersion || 1) + '</b> in progress');
    var state = '<span class="copsvst" data-cop-dvstate>' + sb.join(' <i>·</i> ') + '</span>';
    var label = saved ? "Save" : s.mode === "capabilities" ? "Save " + k.length + (k.length === 1 ? " Capability" : " Capabilities")
      : "Save " + g.length + (g.length === 1 ? " Direction" : " Directions") + (s.withCaps ? " and " + k.length + (k.length === 1 ? " Capability" : " Capabilities") : "");
    return '<div class="copoutf copswfoot" data-cop-dvfoot>' + state + '<span class="copsw-sp"></span>' +
      (canEdit() ? (function(){
        var wf = busyHere ? BUSY : saved ? "Nothing has changed since it was saved."
          : s.mode === "directions" && !s.options.length ? "Suggest the Directions first."
          : s.mode === "directions" && !s.chose ? "Press Go ahead under the Directions first — Save takes what goes ahead."
          : s.mode === "capabilities" && !s.caps.length ? "Suggest the Capabilities first."
          : (PANE.dirsBlocker || "");
        var wa = busyHere ? BUSY : !saved ? "Save it first — the plan only takes a saved version." : "";
        return '<button type="button" class="copbtn' + heldCls(wf) + '" data-cop-dv-finish' + held(wf) + '>' + E(label) + '</button>' +
          '<button type="button" class="copbtn solid' + heldCls(wa) + '" data-cop-dv-apply' + held(wa) + '>' + (on ? "Apply to plan again" : "Apply to plan") + '</button>'; })() : '') + '</div>';
  }
  /* The plan is written after the press, the same order How we compete keeps
     (§35). A ticked Direction that came from the plan updates THAT pillar;
     a new one is a new pillar. A kept Capability is held by the function
     that owns it, and what it serves is stored as the pillars' ids. */
  /* §645 — SAVED, THEN APPLIED, the Foundation's and the SWOT's way (§524,
     §641): the saved line says it is not on the plan yet, and Apply to plan
     asks first in the platform's own dialog, archives what the plan holds,
     writes, and says whether the plan's save went through. */
  var APPLIED = {};   /* chat id → the version applied in this visit */
  function appliedOn(sv, note){ return !!(sv && ((note && note.n === sv.n) || APPLIED[PANE.chat.id] === sv.n)); }
  function savedApplyHtml(sv, k){
    /* §654 A3 — "on the plan" is the deliverable's own note (planApplied),
       so it survives a reload; this visit's memory covers the moment between
       the plan's save and the note. */
    var note = k === "dv" ? PANE.dirsApplied : k === "cp" ? PANE.competeApplied : PANE.execApplied;
    var on = (note && note.n === sv.n) || APPLIED[PANE.chat.id] === sv.n;
    return cpMsg("product", "Saved as " + E(sv.title) + " v" + E(String(sv.n)) + " — under Deliverables. " +
      (on ? "It is on the plan." : "It is not on the plan yet: Apply to plan puts it there, and archives what the plan holds first.")) +
      (canEdit() ? '<div class="copbtns"><button type="button" class="copbtn' + (on ? '' : ' solid') + '" data-cop-' + k + '-apply>' + (on ? "Apply to plan again" : "Apply to plan") + '</button></div>' : '');
  }
  function planApplyAsk(what, replaces, go){
    if (typeof openModalHtml !== "function") { go(); return; }
    openModalHtml("Apply to the plan?", "",
      '<div class="sendconfirm"><div class="kv"><span class="k">Where</span><span>' + E(placeWord()) + '</span></div>' +
      '<div class="kv"><span class="k">What</span><span>' + what + '</span></div>' +
      '<div class="kv"><span class="k">What it replaces</span><span>' + replaces + '</span></div>' +
      '<div class="cbtns"><button type="button" data-cop-apply-no="1">Cancel</button><button type="button" class="copgo" data-cop-planapply-yes="1">Apply to plan</button></div></div>');
    var mb = document.getElementById("modal-b"); if (!mb) return;
    mb.addEventListener("click", function(ev){
      if (hit(ev, "[data-cop-apply-no]")) { closeModal(); return; }
      if (hit(ev, "[data-cop-planapply-yes]")) { closeModal(); go(); }
    });
  }
  /* What stands is archived before anything is written: the place's own plan
     (its pillars, their measures and tactics) and each Capability the save
     touches — the archives Import & storage › Archived plans restores. */
  /* §654 A2 — AN ARCHIVE OF THE PART APPLIED, never the whole plan: §645
     took a `unit` archive (Foundation, SWOT and pillars together), so
     restoring it would have rolled the Foundation and the SWOT back too.
     Now a `directions` archive holds the pillars and the Capabilities the
     apply touches; an `execution` archive the pillars' measures and tactics,
     the Capabilities' objectives and projects, and the plan period. */
  function planArchive(kind, capIds, why){
    if (kind === "compete") return typeof archiveCompete === "function" && archiveCompete(place(), why) ? 1 : 0;
    if (kind === "swot") return typeof archiveSwot === "function" && archiveSwot(place(), why) ? 1 : 0;
    var f = kind === "execution" ? (typeof archiveExecution === "function" ? archiveExecution : null) : (typeof archiveDirections === "function" ? archiveDirections : null);
    return f && f(place(), capIds, why) ? 1 : 0;
  }
  function planApplyGo(sv, kind, capIds, can, write){
    var id = PANE.chat.id, title = sv.title + " v" + sv.n;
    /* Asked BEFORE anything is archived, so a place that cannot take it is
       left exactly as it was. */
    if (!can()) { SAY = "The plan could not be written from here — this place does not plan in Directions. Nothing was changed."; draw(); return; }
    planArchive(kind, capIds, "replaced from the Copilot — " + title);
    var r = write();
    if (!r.ok) { SAY = "The plan could not be written from here. What it held is archived under Import & storage › Archived plans."; draw(); return; }
    APPLIED[id] = sv.n;
    if (typeof paint === "function") paint(); else draw();
    var saveNow = typeof SYNC !== "undefined" && SYNC.saveNow;
    if (!saveNow) return;
    SYNC.saveNow(function(how){
      if (!(how === "saved" || how === "clean")) delete APPLIED[id];
      SAY = how === "saved" || how === "clean"
        ? title + " is on the plan now. What was there before is archived under Import & storage › Archived plans."
        : "The plan did not save, so " + title + " is not on the plan yet. Try Apply to plan again once the save goes through.";
      draw();
      /* §654 A3 — the note follows the fact (§524.1): written only once the
         plan's save has landed, and only on the chat that applied it. */
      if (how === "saved" || how === "clean") act({ act:"planApplied", id: sv.deliverableId, n: sv.n }, function(j){
        if (PANE && PANE.chat && PANE.chat.id === id) { if (kind === "execution") PANE.execApplied = j.applied; else if (kind === "compete") PANE.competeApplied = j.applied; else PANE.dirsApplied = j.applied; draw(); }
      });
    });
  }
  function cpApplyAsk(){
    var s = PANE.compete, t = s.table || { values: [] }, on = typeof compOn === "function" ? compOn(place(), SMPRules.COMPETE) : true;
    var w = null; try { w = typeof competeWritable === "function" ? competeWritable(place()) : null; } catch (e) { w = null; }
    var had = w ? (w.values || []).length : 0;
    planApplyAsk(E(s.saved.title) + " v" + E(String(s.saved.n)) + " — " + E(cpWord(t.discipline)) + " and " + t.values.length + (t.values.length === 1 ? " value" : " values") + " onto the plan’s Competitive Discipline.",
      (had ? "The " + had + (had === 1 ? " value" : " values") + " the plan holds today are archived first, under Import &amp; storage › Archived plans, and can be put back from there." : "The plan holds no Competitive Discipline yet, so nothing is replaced.") +
        (on ? "" : " <b>Competitive Discipline is switched off for this layer</b> on Setup › The shape: the plan takes it and keeps it hidden until it is turned on."),
      function(){ planApplyGo(s.saved, "compete", [], function(){ try { return !!(typeof competeWritable === "function" && competeWritable(place())); } catch (e) { return false; } }, function(){ return { ok: cpWritePlan(PANE.compete && PANE.compete.table) }; }); });
  }
  function dvApplyAsk(){
    var s = PANE.dirs, g = s.options.filter(function(o){ return o.go; }), k = s.caps.filter(function(x){ return x.keep; });
    var dirs = s.mode !== "capabilities", have = dvExisting().length;
    var caps = k.map(function(x){ return x.planId; }).filter(Boolean);
    planApplyAsk(E(s.saved.title) + " v" + E(String(s.saved.n)) + " — " + [dirs ? g.length + (g.length === 1 ? " Direction" : " Directions") : "", (s.mode === "capabilities" || s.withCaps) ? k.length + (k.length === 1 ? " Capability" : " Capabilities") : ""].filter(Boolean).join(" and ") + " onto the plan.",
      (dirs && have ? "The plan's " + have + (have === 1 ? " Direction is" : " Directions are") + " archived first" : "Nothing on the plan is replaced") + (caps.length ? ", and the " + caps.length + (caps.length === 1 ? " Capability" : " Capabilities") + " it updates" : "") +
        ". A Direction with the same name is updated, a new one is added; nothing is removed. Archives are under Import &amp; storage › Archived plans.",
      function(){ planApplyGo(s.saved, "directions", caps, function(){ var h = dvHolder(); return s.mode === "capabilities" ? typeof addCapability === "function" : !!(h && Array.isArray(h.items) && typeof addPillar === "function"); },
        function(){ return dvWritePlan(PANE.dirs); }); });
  }
  function exApplyAsk(){
    var s = PANE.exec, ins = s.items.filter(exIn), caps = ins.filter(function(it){ return it.kind !== "direction"; }).map(function(it){ return it.planId; }).filter(Boolean), outs = s.items.filter(function(it){ return it.out && !it.gone; });
    var nm = ins.reduce(function(n, it){ return n + it.measures.length; }, 0), nt = ins.reduce(function(n, it){ return n + it.tactics.length; }, 0);
    planApplyAsk(E(s.saved.title) + " v" + E(String(s.saved.n)) + " — " + nm + " measures and " + nt + " tactics onto " + ins.length + (ins.length === 1 ? " item" : " items") + " of the plan, and the plan period." + (outs.length ? " " + outs.length + (outs.length === 1 ? " item" : " items") + " left out this period, untouched." : ""),
      "The plan's Directions, with their measures and tactics, are archived first" + (caps.length ? ", and the " + caps.length + (caps.length === 1 ? " Capability" : " Capabilities") + " it updates" : "") +
        ". What each card shows replaces what the item holds: a line with the same name is updated, a new one is added, a line dropped from the card is dropped. Archives are under Import &amp; storage › Archived plans.",
      function(){ planApplyGo(s.saved, "execution", caps, function(){ return !!(s.period && typeof GROUP !== "undefined"); }, function(){ return exWritePlan(PANE.exec); }); });
  }
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
        if (!c) c = addCapability();
        if (!c) return;
        c.name = x.title;
        var owner = dvCapOwner(x.ownedBy);
        if (owner && typeof grantPersonRole === "function") grantPersonRole(owner, "capowner", "cap:" + c.id);
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
    if ((b = hit(ev, "[data-cop-dv-apply]"))) { if (canEdit() && s.saved) dvApplyAsk(); return true; }
    if ((b = hit(ev, "[data-cop-pfold]"))) { var fk = id + ":" + b.getAttribute("data-cop-pfold"); if (FOLD[fk]) delete FOLD[fk]; else FOLD[fk] = true; draw(); return true; }
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
    if ((b = hit(ev, "[data-cop-dv-unchoose]"))) {
      if (busy || THINKING) return true;
      act({ act:"dirSave", id:id, dirs:{ chose:false } }, function(j){
        if (PANE && PANE.chat && PANE.chat.id === id) dvView(j);
        dvProgress(id); if (tight()) SHEET = "cards"; draw();
      });
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
    /* §675 — "+ Add my own" turns the chat's box into a line of your own, pressed again it is the ask box again */
    if ((b = hit(ev, "[data-cop-dv-add]"))) {
      var w = b.getAttribute("data-cop-dv-add"); DVADD[id] = DVADD[id] === w ? null : w; draw();
      var bx = document.querySelector("[data-cop-text]"); if (bx) bx.focus();
      return true;
    }
    if ((b = hit(ev, "[data-cop-dv-finish]"))) {
      if (THINKING) return true;
      if (PANE.dirsBlocker) { SAY = PANE.dirsBlocker; draw(); return true; }
      var owners = ((PANE.dirs && PANE.dirs.caps) || []).map(function(x){ var k = dvCapOwner(x.ownedBy); return k ? { key: k, name: dvPersonName(k) } : null; }).filter(Boolean);
      act({ act:"dirFinish", id:id, placeWord:placeWord(), fns:dvFns(), owners:owners }, function(j){
        if (PANE && PANE.chat && PANE.chat.id === id) dvView(j);
        dvProgress(id);
        /* §645 — SAVE IS A VERSION, NOT THE PLAN (Islam: "we need to fix the
           directions and execution skipping"). It wrote the plan in the same
           press; now the plan moves only on Apply to plan, which asks first. */
        SAY = "";
        LISTS[key()] = null; loadList(true);
        draw();
      });
      return true;
    }
    return false;
  }
  function dvNew(mode, fromPlan){
    act({ act:"newDirections", place: place(), mode: mode, title: dvTitle(mode),
          withCaps: mode === "directions", hadPlan: dvExisting().length }, function(j){
      var l = list(); if (l && l.chats) l.chats.unshift(j.chat);
      PANE = { id: j.chat.id, chat: j.chat, messages: [] };
      dvView(j);
      OPEN[key()] = { kind:"chat", id: j.chat.id };
      draw();
      /* §653: the start screen's plan card has already answered the chat's
         own "start from them, or fresh?" */
      if (fromPlan && PANE.dirs && PANE.dirs.start !== "plan") {
        var nid = j.chat.id;
        act({ act:"dirStart", id:nid, start:"plan", existing: dvExisting() }, function(k){
          if (PANE && PANE.chat && PANE.chat.id === nid) dvView(k);
          dvProgress(nid); draw(); dvAsk({ act:"dirSuggest" });
        });
        return;
      }
      if (PANE.dirs && PANE.dirs.start === "fresh") dvAsk({ act: mode === "capabilities" ? "capSuggest" : "dirSuggest" });
    });
  }
  /* §544.13 — AND THE QUESTION ITSELF IS GONE. Capabilities were chosen
     inside the Directions chat when Structure kept them in the company plan,
     and in a section of their own when they were a layer; there is no layer
     any more, so they are always chosen in the Directions chat. The rule that
     asked it answered true for every client the day `capAtTop` did, and a
     rule that cannot say no is not a rule (§61) — so it is read out here
     rather than left standing as a constant for a reader to re-derive.

     §544.12's catch is KEPT by this, not lost: it was that El Abd's
     capabilities are in its company plan although `capAtTop` said otherwise.
     They are now, for every client. */

  /* ══ EXECUTION (spec 064 §6, §495; mockup panel F) ═════════════════════
     The period first, then each Direction and Capability in turn: its
     measures with a target for the period, and its tactics with an owner and
     the quarters they run in — only the period's quarters are offered. The
     shape of the Directions chat's code (§494): every press saved through one
     act, the model asked by one, the plan written after the save press. */
  var EXPEND = null, EXASK = {}, EXPICK = {};
  function execOn(){ return !!(PANE && PANE.chat && PANE.exec); }
  function exView(j){ ["exec","execApplied","execNextVersion","execTodo","execDone","execBlocker","execWords"].forEach(function(k){ if (j && k in j) PANE[k] = j[k]; }); }
  function exCopy(){ return JSON.parse(JSON.stringify(PANE.exec)); }
  function exProgress(id){ var l = list(); if (l && l.swotProgress && PANE && PANE.execTodo) l.swotProgress[id] = { done: PANE.execDone, of: PANE.execTodo.length }; }
  /* The plan's Directions and the capabilities this place holds, as the
     items the chat walks. */
  /* §695 S7 — WITH WHAT THE PLAN HOLDS under each item: a pillar's measures
     and tactics, a Capability's key objectives and projects (the quarters
     read off its months), every line marked the plan's. */
  function exPlanLines(pl, cap){
    var ms = [], ts = [], named = function(x){ return x && String(x.name || "").trim(); };
    if (pl) {
      (pl.measures || []).filter(named).forEach(function(m){ ms.push({ name: String(m.name).trim(), target: String(m.target == null ? "" : m.target), compile: m.compile || "", mark: "plan" }); });
      (pl.tactics || []).filter(named).forEach(function(x){ ts.push({ name: String(x.name).trim(), owner: String(x.owner || ""), quarters: [1,2,3,4].filter(function(q){ return +x["q" + q] === 1; }), mark: "plan" }); });
    } else if (cap) {
      (cap.keyObjectives || []).filter(named).forEach(function(m){ ms.push({ name: String(m.name).trim(), target: String(m.target == null ? "" : m.target), compile: m.compile || "", mark: "plan" }); });
      (cap.projects || []).filter(named).forEach(function(x){
        var q1 = EX_MONTHS.indexOf(String(x.start || "").split(" ")[0]), q2 = EX_MONTHS.indexOf(String(x.end || "").split(" ")[0]), qs = [];
        if (q1 >= 0 && q2 >= 0) for (var q = Math.ceil((q1 + 1) / 3); q <= Math.ceil((q2 + 1) / 3); q++) qs.push(q);
        ts.push({ name: String(x.name).trim(), owner: String(x.owner || ""), quarters: qs, mark: "plan" }); });
    }
    return { measures: ms, tactics: ts };
  }
  function exItems(){
    var h = dvHolder();
    var out = dvExisting().map(function(d){
      var p = h && h.items ? h.items.filter(function(x){ return x && x.id === d.id; })[0] : null, ln = exPlanLines(p, null);
      return { kind:"direction", planId: d.id, title: d.title, ownedBy: p && p.ownedBy ? dvFnName(p.ownedBy) : "", measures: ln.measures, tactics: ln.tactics };
    });
    if (place() === "group" && typeof GROUP !== "undefined" && Array.isArray(GROUP.capabilities))
      GROUP.capabilities.forEach(function(c){ if (c && String(c.name || "").trim()) { var ln = exPlanLines(null, c); out.push({ kind:"capability", planId: String(c.id), title: String(c.name).trim(), ownedBy: dvPersonName(c.head), measures: ln.measures, tactics: ln.tactics }); } });
    return out;
  }
  /* §695 S6 — the plan read again when the chat opens, once a visit. */
  var EXSYNCED = {};
  function exSync(){
    if (!execOn() || !canEdit() || PANE.exec.saved || PANE.chat.archived) return;
    var id = PANE.chat.id; if (EXSYNCED[id]) return; EXSYNCED[id] = true;
    act({ act:"execSync", id:id, items: exItems(), placeWord: placeWord() }, function(j){
      if (PANE && PANE.chat && PANE.chat.id === id) { exView(j); exProgress(id); draw(); }
    });
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
  function exAsk(ask, said, quiet){
    if (!execOn() || THINKING) return;
    var id = PANE.chat.id;
    THINKING = id; SAY = ""; THINK_AT = Date.now();
    if (!WORK_TIMER) WORK_TIMER = setInterval(workTick, 500);
    draw();
    post({ act:"execDraft", id:id, exec: exCopy(), ask: ask || "", said: said || "", quiet: !!quiet, placeWord: placeWord(), context: swContext() }, WAIT_MS).then(function(x){
      THINKING = null;
      if (x.st === 200 && x.j && x.j.ok) {
        if (PANE && PANE.chat && PANE.chat.id === id) { exView(x.j); exProgress(id);
          /* §684 — Draft all: the next undrafted item, until none is left */
          if (EXALL[id]) { var nx = exLeft()[0]; if (nx != null) { PANE.exec.cursor = nx; draw(); exAsk("", "", true); return; } delete EXALL[id]; } }
        draw(); return;
      }
      delete EXALL[id];
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
    var h = "How long is this plan?";
    if (!ed) return aiMsg(h);
    h += '<div class="copopts"><button type="button" class="copopt" data-cop-ex-period="full">' + E(ch.fullWord || "Full year") + '</button>' +
      '<button type="button" class="copopt rec" data-cop-ex-period="rest">This quarter to year end — ' + E(ch.restWord || "") + '</button>' +
      '<button type="button" class="copopt" data-cop-ex-pick>Pick months</button></div>';
    if (pk) {
      var mo = function(attr, v){ return '<select class="fld copdv-own" ' + attr + '>' + EX_MONTHS.map(function(m, i){ return '<option value="' + (i + 1) + '"' + (i + 1 === v ? ' selected' : '') + '>' + m + '</option>'; }).join("") + '</select>'; };
      h += '<div class="copcp-ask copex-pick">From ' + mo('data-cop-ex-m1 aria-label="From month"', pk.m1) + ' to ' + mo('data-cop-ex-m2 aria-label="To month"', pk.m2) +
        ' <input class="fld copex-y" data-cop-ex-y value="' + E(String(pk.y)) + '" inputmode="numeric" aria-label="Year">' +
        '<button type="button" class="copbtn" data-cop-ex-pickgo>Use these months</button></div>';
    }
    return aiMsg(h, true);
  }
  function exItemHtml(it, k, ed){
    var w = PANE.execWords || {}, qs = w.quarters || [1,2,3,4], comp = w.compiles || ["Sum","Count","Latest","Average"];
    /* §695 S7 — a line the plan holds is marked so, and beside it a new one */
    var showMarks = exHeld(it), mk = function(x){ return !showMarks ? '' : x.mark === "plan" ? '<span class="copex-mark plan">on the plan</span>' : '<span class="copex-mark new">new</span>'; };
    var mrow = function(m, i){ return '<tr><td>' + (ed ? '<input class="fld" data-cop-ex-m="' + i + '|name" value="' + E(m.name) + '" aria-label="Measure">' : E(m.name)) + mk(m) + '</td>' +
      '<td>' + (ed ? '<input class="fld" data-cop-ex-m="' + i + '|target" value="' + E(m.target) + '" aria-label="Target for the period">' : E(m.target || "—")) + '</td>' +
      '<td>' + (ed ? '<select class="fld copdv-own" data-cop-ex-m="' + i + '|compile" aria-label="Compile"><option value="">—</option>' + comp.map(function(c){ return '<option' + (c === m.compile ? ' selected' : '') + '>' + c + '</option>'; }).join("") + '</select>' : E(m.compile || "—")) + '</td>' +
      (ed ? '<td><button type="button" class="xbtn" data-cop-ex-mx="' + i + '" aria-label="Remove this measure">&times;</button></td>' : '') + '</tr>'; };
    var trow = function(t, i){ return '<tr><td>' + (ed ? '<input class="fld" data-cop-ex-t="' + i + '|name" value="' + E(t.name) + '" aria-label="Tactic">' : E(t.name)) + mk(t) + '</td>' +
      /* §551: AN OWNER IS PICKED HERE TOO. This was the one free-text owner
         box left in the product — the draft a chat writes, which is then
         saved into a real plan, so a name typed here becomes a name on the
         plan that matches nobody. It is the register's own list
         (`ownerChoices`), so there is one list and not a second (§53.5), and
         past five options `searchsel` makes it searchable like every other
         (§536). The patch hook below reads `el.value`, which a select
         answers exactly as the input did. */
      '<td>' + (ed ? '<select class="fld copdv-own" data-cop-ex-t="' + i + '|owner" aria-label="Owner">' +
          optionsHtml(ownerChoices(t.owner, true), function(v){
            return String(t.owner == null ? "" : t.owner) === v; }) + '</select>'
        : (typeof ownerShown === "function" ? ownerShown(t.owner || "") : E(t.owner || "")) || E("—")) + '</td>' +
      /* NOT A CONTROL, SO NOT A BUTTON (§538). A quarter outside the plan
         period — or any quarter in a view nobody may edit — was drawn as a
         `disabled` button carrying "Q3 is outside the plan period" as a hover
         that can never open. Nothing was hidden by that: the strip directly
         above this table already says which period the plan covers. So the
         fix is a subtraction — it stops being a button, Tab walks only the
         quarters that can be pressed, and the sentence survives on a mark that
         a pointer CAN reach and that a screen reader reads from `aria-label`. */
      '<td class="copex-qs">' + [1,2,3,4].map(function(q){ var inP = qs.indexOf(q) >= 0, on = t.quarters.indexOf(q) >= 0;
        if (ed && inP) return '<button type="button" class="copex-q' + (on ? " on" : "") + '" data-cop-ex-q="' + i + '|' + q + '" aria-pressed="' + on + '" title="Q' + q + '">Q' + q + '</button>';
        var say = inP ? ("Q" + q + (on ? ", in this tactic" : ", not in this tactic"))
                      : ("Q" + q + " is outside the plan period");
        return '<span class="copex-q' + (on ? " on" : "") + (inP ? "" : " off") + '" role="img" title="' + E(say) + '" aria-label="' + E(say) + '">Q' + q + '</span>'; }).join("") + '</td>' +
      (ed ? '<td><button type="button" class="xbtn" data-cop-ex-tx="' + i + '" aria-label="Remove this tactic">&times;</button></td>' : '') + '</tr>'; };
    return '<div class="copex-item" data-cop-ex-item="' + k + '"><div class="copvline"><b>' + E(it.title) + '</b> — ' + (it.kind === "capability" ? "Capability" : "Direction") + ' ' + (k + 1) + ' of ' + PANE.exec.items.length + (it.ownedBy ? ', owned by ' + E(it.ownedBy) : '') + '</div>' +
      '<div class="copcp-wrap"><table class="copcp-tab copex-t"><thead><tr><th>Measure</th><th>Target (period)</th><th>Compile</th>' + (ed ? '<th></th>' : '') + '</tr></thead><tbody>' + it.measures.map(mrow).join("") + '</tbody></table></div>' +
      (ed ? '<button type="button" class="linkbu" data-cop-ex-addm>+ Add a measure</button>' : '') +
      '<div class="copcp-wrap"><table class="copcp-tab copex-t"><thead><tr><th>Tactic</th><th>Owner</th><th>Quarters</th>' + (ed ? '<th></th>' : '') + '</tr></thead><tbody>' + it.tactics.map(trow).join("") + '</tbody></table></div>' +
      (ed ? '<button type="button" class="linkbu" data-cop-ex-addt>+ Add a tactic</button>' : '') + '</div>';
  }
  /* §684 — EXECUTION, SPLIT THREE WAYS (the SWOT's shape, §641–§653;
     Competitive Discipline's and Directions', §654 C1, §675; the working
     mockup design-mockups/copilot-layout/2026-10-29_execution-split-working.html,
     Islam: "ok proceed and build the execution split"): the period asked in
     the chat; every Direction and Capability a card on the right, one in
     hand at a time, drafted from its card, or all from the chat; measures
     and tactics edited on the card; asks through the chat's own box for the
     item in hand; Save and Apply to plan at the pane's foot; the to-do
     beside. Back and Next go — the cards are all there. */
  var EXALL = {};
  /* §695 — what is left to draft: not left out, not gone, not drafted; and on
     the refine road an item carrying the plan's measures and tactics is not
     owed a draft either. */
  function exIn(it){ return !it.out && !it.gone; }
  function exLeft(){ var s = PANE.exec; return s.items.map(function(it, k){ return exIn(it) && !it.drafted && (s.road !== "refine" || !(it.measures.length && it.tactics.length)) ? k : -1; }).filter(function(k){ return k >= 0; }); }
  function exHeld(it){ return it.measures.some(function(m){ return m.mark === "plan"; }) || it.tactics.some(function(x){ return x.mark === "plan"; }); }
  function exStepWord(s){
    if (s.saved) return "Saved";
    if (!s.period) return "The period";
    var left = exLeft().length, inN = s.items.filter(exIn).length, outN = s.items.filter(function(it){ return it.out && !it.gone; }).length, tail = outN ? " · " + outN + " left out" : "";
    return left ? "Drafting · " + (inN - left) + " of " + inN + tail : "Ready to save" + tail;
  }
  function exCanType(){ var s = PANE.exec, it = s && s.items[s.cursor]; return !!(canEdit() && s && !s.saved && !PANE.chat.archived && s.period && it && !it.out && !it.gone && (it.drafted || (it.measures.length && it.tactics.length))); }
  function execHtml(){
    var s = PANE.exec, c = PANE.chat, ed = canEdit() && !s.saved, busyHere = THINKING === c.id;
    var work = busyHere ? '<div class="copmsg product copworking" role="status"><div class="copbody"><span data-cop-wword>' + E(workWord()) + '</span><span class="copdots" aria-hidden="true"><i></i><i></i><i></i></span></div></div>' : '';
    var todo = PANE.execTodo || [], done = PANE.execDone || 0;
    var chat = '<div class="copchat copfchat copswchat copexchat" data-cop-chatbox style="--copz:' + ZOOMS[zi()] + '">' +
      '<div class="copfhead"><b><span class="copfname">' + E(c.title || "Execution — " + placeWord()) + '</span><small> · ' + E(exStepWord(s)) + '</small></b>' + sheetBtn("cards", "View the items") + sheetBtn("todo", "To-do " + done + "/" + todo.length) + '</div>' +
      '<div class="copmsgs" data-cop-msgs><div class="copzoom">' + exMsgs(s, ed, busyHere) + work + '</div></div>' +
      (!canEdit() ? VIEWONLY
        : c.archived ? '<div class="copsay copparked">This chat is archived. Restore it to keep going. <button type="button" class="copbtn" data-cop-restore-chat="' + E(c.id) + '">Restore</button></div>'
        : composerHtml(c, false)) + '</div>';
    return '<div class="copflow copswflow' + (SHEET === "cards" || SHEET === "todo" ? " sheet sheet-" + SHEET : "") + '" data-cop-split' + splitStyle() + '>' +
      chat + GRIP + exPaneHtml(s, ed, busyHere) + exSideHtml() + '<div class="copshade" data-cop-sheet=""></div></div>';
  }
  function exMsgs(s, ed, busyHere){
    var out = [], w = PANE.execWords || {}, id = PANE.chat.id, left = exLeft();
    /* §694 S10 — nothing to plan for: a saved Directions version waiting for
       Apply is named and opened, rather than sending the person to choose again. */
    if (!s.items.length) {
      var dsv = PANE.execDirsSaved;
      return dsv ? aiMsg('<b>' + E(dsv.title) + ' v' + E(dsv.n) + '</b> is saved but not on the plan yet, so there is nothing here to plan for. Apply it to the plan first; then a new Execution chat reads the Directions and Capabilities from there.' +
          '<div class="copopts"><button type="button" class="copbtn solid" data-cop-go-deliv="' + E(dsv.id) + '" data-cop-go="directions">Open ' + E(dsv.title) + ' v' + E(dsv.n) + '</button><span class="copm">The version page, where Apply to plan is.</span></div>')
        : aiMsg('The plan has no Directions or Capabilities yet, and none are saved in the Copilot. Choose them first.' +
          '<div class="copopts"><button type="button" class="copbtn solid" data-cop-go="directions">Open Directions</button><span class="copm">The Directions start screen, in this place.</span></div>');
    }
    out.push(exPeriodAsk(ed && (!s.period || !!EXPICK[id])));
    if (!s.period) return out.join("");
    out.push(meMsg(w.period || "The period"));
    /* §695 — what the plan already holds is said, and the road with it. */
    var heldN = s.items.filter(function(it){ return exIn(it) && exHeld(it); }).length, inN = s.items.filter(exIn).length;
    out.push(aiMsg('This plan covers <b>' + E(w.period) + '</b>. The ' + inN + ' Directions and Capabilities are on the right' +
      (heldN ? ' — <b>' + heldN + ' of them already ' + (heldN === 1 ? 'carries' : 'carry') + ' measures and tactics on the plan</b>, shown on ' + (heldN === 1 ? 'its card' : 'their cards') + '; ' + (s.road === "refine" ? 'a draft adds to what is there, and Apply replaces what the card shows.' : 'a draft replaces what the card shows, and nothing on the plan changes until Apply.') : ' — I draft each one\u2019s measures and tactics from the plan.') +
      ' Draft them one at a time there, or all at once here.' +
      (ed && !busyHere && left.length ? swOpts([swOpt('data-cop-ex-draftall', (s.road === "refine" && heldN ? "Draft the " + left.length + " without" : "Draft all " + left.length + " left"), true), swOpt('data-cop-ex-next', "Draft the next one")]) : '')));
    (s.log || []).forEach(function(x){ out.push(x.w === "me" ? meMsg(x.t) : aiMsg((x.k >= 0 && s.items[x.k] ? '<b>' + E(s.items[x.k].title) + '</b> — ' : '') + E(x.t))); });
    /* §695 S5 — what is left out this period, said once, from the state */
    var outs = s.items.filter(function(it){ return it.out && !it.gone; });
    if (outs.length) out.push(aiMsg(outs.map(function(it){ return '<b>' + E(it.title) + '</b>'; }).join(", ") + (outs.length === 1 ? ' is' : ' are') + ' left out this period: nothing is drafted for ' + (outs.length === 1 ? 'it' : 'them') + ', and Apply writes nothing for ' + (outs.length === 1 ? 'it. It stays' : 'them. They stay') + ' on the plan as ' + (outs.length === 1 ? 'it is.' : 'they are.')));
    if (s.saved && appliedOn(s.saved, PANE.execApplied)) out.push(aiMsg('<b>v' + E(s.saved.n) + '</b> is on the plan.' + nextHtml("execution")));
    else if (s.saved) out.push(aiMsg('Saved as <b>' + E(s.saved.title) + ' v' + E(s.saved.n) + '</b>; it is under Deliverables. <b>Apply to plan</b>, at the foot, writes the measures, the tactics and the period into the plan.'));
    else if (ed && !left.length) out.push(aiMsg('Every item is ' + (outs.length ? 'drafted or left out' : 'drafted') + '. Change anything on the right, ask here for a change to the item in hand, then <b>Save</b> at the foot.'));
    return out.join("");
  }
  function exPaneHtml(s, ed, busyHere){
    var w = PANE.execWords || {}, id = PANE.chat.id, vn = s.saved ? s.saved.n : (PANE.execNextVersion || 1);
    var head = '<div class="copsh copswph"><span class="copvline"><b>' + E("Execution — " + placeWord()) + ' v' + E(vn) + '</b> · ' + (s.saved ? "saved" : "in progress") + '</span>' +
      '<button type="button" class="copcx copsheetx" data-cop-sheet="" aria-label="Close" title="Close">×</button></div>';
    var body;
    if (!s.items.length) body = '<p class="copnote">Nothing to draft — the plan holds no Directions or Capabilities' + (PANE.execDirsSaved ? '. ' + E(PANE.execDirsSaved.title) + ' v' + E(PANE.execDirsSaved.n) + ' is saved and waits for Apply.' : ', and none are saved.') + '</p>';
    else if (!s.period) body = '<div class="copsw-card"><h3>The items</h3><p class="copnote">The plan period first — the chat asks it. Then the ' + s.items.length + ' Directions and Capabilities come here, one card each.</p></div>';
    else body = '<div class="copex-period" data-cop-ex-strip>This plan covers <b>' + E(w.period) + '</b>' + (ed ? '<button type="button" class="linkbu" data-cop-ex-change>Change</button>' : '') + '</div>' +
      s.items.map(function(it, k){
        var now = k === s.cursor, has = it.measures.length > 0 || it.tactics.length > 0, done = it.measures.length > 0 && it.tactics.length > 0, onPlan = exHeld(it);
        var nM = it.measures.length, nT = it.tactics.length, nNew = it.measures.filter(function(m){ return m.mark !== "plan"; }).length + it.tactics.filter(function(x){ return x.mark !== "plan"; }).length;
        /* §695 S7, S5, S6 — the head says what the plan holds, what is new,
           what is left out, what is gone */
        var counts = it.gone ? "No longer on the plan" : it.out ? "Left out this period"
          : !has ? "Not drafted yet"
          : (onPlan && !it.drafted ? "On the plan · " : "") + nM + (nM === 1 ? " measure" : " measures") + " · " + nT + (nT === 1 ? " tactic" : " tactics") + (onPlan && nNew ? " · " + nNew + " new" : "");
        var st = it.gone ? '<span class="copst off">Gone</span>' : it.out ? '<span class="copst off">Left out</span>' : done ? '<span class="copst done">' + (it.drafted ? "Drafted" : "On the plan") + '</span>' : now ? '<span class="copst now">In hand</span>' : '<span class="copst"></span>';
        var body = it.gone ? '<p class="copnote">This item is no longer on the plan. Its lines stay here, and Apply will not write them.</p>' + (has ? exItemHtml(it, k, false) : '')
          : it.out ? '<p class="copnote">Nothing is drafted for it and Apply writes nothing for it.' + (ed ? ' <button type="button" class="linkbu" data-cop-ex-in="' + k + '">Put it back</button>' : '') + '</p>'
          : (has ? exItemHtml(it, k, ed) : '<p class="copnote">Nothing here yet.</p>') +
            (ed && !it.drafted ? '<div class="copopts"><button type="button" class="copbtn' + heldCls(busyHere && BUSY) + '" data-cop-ex-draft' + held(busyHere && BUSY) + '>' + (onPlan ? (s.road === "refine" ? "Draft more from the plan" : "Draft anew") : "Draft measures and tactics") + '</button>' +
              (onPlan ? '<span class="copm">' + (s.road === "refine" ? "Adds to what is here; nothing on the plan is replaced until Apply." : "Replaces what is here on the card; nothing on the plan changes until Apply.") + '</span>' : '') +
              '<button type="button" class="linkbu" data-cop-ex-out="' + k + '">Leave out this period</button></div>'
             : ed && it.drafted ? '<div class="copopts"><button type="button" class="linkbu" data-cop-ex-out="' + k + '">Leave out this period</button></div>' : '');
        return '<div class="copsw-card copex-card' + (now ? " now" : "") + (it.out || it.gone ? " out" : "") + '" data-cop-ex-card="' + k + '">' +
          '<button type="button" class="copex-head" data-cop-ex-card-pick="' + k + '" aria-expanded="' + now + '"><span class="copex-kind">' + (it.kind === "capability" ? "Capability" : "Direction") + '</span><b>' + E(it.title) + '</b><small>' + E(counts) + '</small>' + st + '</button>' +
          (now ? '<div class="copex-body">' + body + '</div>' : '') + '</div>';
      }).join("");
    return '<div class="copleft copswpane copexpane" data-cop-expane>' + head + '<div class="copswpb">' + body + '</div>' + exFootHtml(s, busyHere) + '</div>';
  }
  function exFootHtml(s, busyHere){
    var saved = !!s.saved, note = PANE.execApplied, on = saved && ((note && note.n === s.saved.n) || APPLIED[PANE.chat.id] === s.saved.n);
    var sb = [];
    if (saved) { sb.push('<b>v' + E(s.saved.n) + '</b> saved'); sb.push(on ? '<span class="on">v' + E(s.saved.n) + ' on the plan</span>' : 'not on the plan yet'); }
    else sb.push('<b>v' + E(PANE.execNextVersion || 1) + '</b> in progress');
    var state = '<span class="copsvst" data-cop-exstate>' + sb.join(' <i>·</i> ') + '</span>';
    return '<div class="copoutf copswfoot" data-cop-exfoot>' + state + '<span class="copsw-sp"></span>' +
      (canEdit() ? (function(){
        var wf = busyHere ? BUSY : saved ? "Nothing has changed since it was saved." : (PANE.execBlocker || "");
        var wa = busyHere ? BUSY : !saved ? "Save it first — the plan only takes a saved version." : "";
        return '<button type="button" class="copbtn' + heldCls(wf) + '" data-cop-ex-finish' + held(wf) + '>Save</button>' +
          '<button type="button" class="copbtn solid' + heldCls(wa) + '" data-cop-ex-apply' + held(wa) + '>' + (on ? "Apply to plan again" : "Apply to plan") + '</button>'; })() : '') + '</div>';
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
    /* §695 S7 — WHAT THE CARD SHOWS REPLACES WHAT THE ITEM HOLDS: a row with
       the card's name is updated (its id and actuals kept), a new one added,
       and a row the card no longer carries is dropped — the person saw it
       there and dropped it. An item left out this period, or gone from the
       plan, is not touched (S5, S6). The archive Apply takes first holds
       what was there. */
    var keepNamed = function(list, lines){ var want = {}; lines.forEach(function(x){ want[String(x.name || "").trim().toLowerCase()] = true; });
      for (var i = list.length - 1; i >= 0; i--) { var nm = String(list[i] && list[i].name || "").trim().toLowerCase(); if (nm && !want[nm]) list.splice(i, 1); } };
    s.items.forEach(function(it){
      if (it.out || it.gone) return;
      if (it.kind === "direction") {
        var pl = h && Array.isArray(h.items) ? h.items.filter(function(x){ return x && x.id === it.planId; })[0] : null;
        if (!pl) return;
        it.measures.forEach(function(m){ var r = find(pl.measures || [], m.name) || addMeasure(pl); if (!r) return; r.name = m.name; r.target = m.target; if (m.compile) r.compile = m.compile; });
        it.tactics.forEach(function(t){ var r = find(pl.tactics || [], t.name) || addTactic(pl); if (!r) return; r.name = t.name; r.owner = t.owner;
          [1,2,3,4].forEach(function(q){ r["q" + q] = t.quarters.indexOf(q) >= 0 ? 1 : 0; }); });
        if (Array.isArray(pl.measures)) keepNamed(pl.measures, it.measures); if (Array.isArray(pl.tactics)) keepNamed(pl.tactics, it.tactics);
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
        if (Array.isArray(c.keyObjectives)) keepNamed(c.keyObjectives, it.measures); if (Array.isArray(c.projects)) keepNamed(c.projects, it.tactics);
        wrote++;
      }
    });
    return { ok:true, n:wrote };
  }
  function exItemPatch(f){ var g = exCopy(); f(g.items[g.cursor], g); PANE.exec = g; exSave(g); return true; }
  function exClick(ev){
    if (!execOn()) return false;
    var b, s = PANE.exec, id = PANE.chat.id;
    if ((b = hit(ev, "[data-cop-ex-apply]"))) { if (canEdit() && s.saved) exApplyAsk(); return true; }
    if (!canEdit() || s.saved) return false;
    if ((b = hit(ev, "[data-cop-ex-period]"))) { EXPICK[id] = null; act({ act:"execPeriod", id:id, choice: b.getAttribute("data-cop-ex-period") }, function(j){ exView(j); exProgress(id); draw(); }); return true; }
    if ((b = hit(ev, "[data-cop-ex-pick]")) || (b = hit(ev, "[data-cop-ex-change]"))) {
      var p = s.period || (PANE.execWords && PANE.execWords.choices && PANE.execWords.choices.full) || { y: new Date().getFullYear(), m1: 1, m2: 12 };
      EXPICK[id] = EXPICK[id] ? null : { y: p.y, m1: p.m1, m2: p.m2 }; draw(); return true;
    }
    if ((b = hit(ev, "[data-cop-ex-pickgo]"))) { var pk = EXPICK[id];
      act({ act:"execPeriod", id:id, period: pk }, function(j){ EXPICK[id] = null; exView(j); exProgress(id); draw(); }); return true; }
    if ((b = hit(ev, "[data-cop-ex-draft]"))) { exAsk(""); return true; }
    if ((b = hit(ev, "[data-cop-ex-next]"))) { var nx = exLeft()[0]; if (nx == null) return true; PANE.exec.cursor = nx; exAsk(""); return true; }
    if ((b = hit(ev, "[data-cop-ex-draftall]"))) { var n0 = exLeft()[0]; if (n0 == null) return true; EXALL[id] = true; PANE.exec.cursor = n0; exAsk("", "Draft all"); return true; }
    /* a card's head puts its item in hand (data-cop-ex-pick is the period's Pick months, above) */
    if ((b = hit(ev, "[data-cop-ex-card-pick]"))) { var g = exCopy(); g.cursor = +b.getAttribute("data-cop-ex-card-pick"); PANE.exec = g; draw(); exSave(g); return true; }
    if ((b = hit(ev, "[data-cop-dv-todo]"))) { var tk = String(b.getAttribute("data-cop-dv-todo") || ""); if (tk.indexOf("item:") === 0) { var ti = s.items.findIndex(function(it){ return "item:" + it.planId === tk; }); if (ti >= 0) { var g1 = exCopy(); g1.cursor = ti; PANE.exec = g1; draw(); exSave(g1); } } return true; }
    if ((b = hit(ev, "[data-cop-ex-addm]"))) return exItemPatch(function(it){ it.measures.push({ name:"New measure", target:"", compile:"", mark:"new" }); });
    if ((b = hit(ev, "[data-cop-ex-addt]"))) return exItemPatch(function(it){ it.tactics.push({ name:"New tactic", owner:"", quarters:[], mark:"new" }); });
    /* §695 S5 — left out this period, and back */
    if ((b = hit(ev, "[data-cop-ex-out]")) || (b = hit(ev, "[data-cop-ex-in]"))) {
      var ko = +b.getAttribute(b.hasAttribute("data-cop-ex-out") ? "data-cop-ex-out" : "data-cop-ex-in"), g4 = exCopy(); if (!g4.items[ko]) return true;
      g4.items[ko].out = b.hasAttribute("data-cop-ex-out"); PANE.exec = g4; draw(); exSave({ items: g4.items }); return true;
    }
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
        SAY = "";
        LISTS[key()] = null; loadList(true);
        draw();
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
  function exNew(road){
    act({ act:"newExecution", place: place(), title: "Execution — " + placeWord(), items: exItems(), road: road || "build" }, function(j){
      var l = list(); if (l && l.chats) l.chats.unshift(j.chat);
      PANE = { id: j.chat.id, chat: j.chat, messages: [] };
      exView(j);
      OPEN[key()] = { kind:"chat", id: j.chat.id };
      draw();
    });
  }
  function openItem(kind, id){
    OPEN[key()] = { kind: kind, id: id }; EDIT = null;
    /* §638: the rail folds only while a result is open (resultOpen), which
       draw() reads once the chat has come back. */
    SHEET = "";
    if (!PANE || PANE.id !== id) PANE = null;
    draw();
    var k = key();
    getJ(kind === "chat" ? "chat" : "deliverable", ["id=" + encodeURIComponent(id)].concat(kind === "chat" ? ["placeWord=" + encodeURIComponent(placeWord())] : [])).then(function(x){
      var o = OPEN[k]; if (!o || o.id !== id) return;
      if (x.st === 200 && x.j && x.j.ok) PANE = Object.assign({ id: id }, x.j);
      else if (x.st === 404) { delete OPEN[k]; PANE = null; SAY = (x.j && x.j.why) || "That is not here any more."; loadList(true); return; }
      else PANE = { id: id, failed: true, why: x.j && x.j.why };
      draw();
      if (kind === "chat" && PANE && PANE.exec) exSync();
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
    var st0 = hit(ev, "[data-cop-starttext]"); if (st0) { STARTTEXT[key()] = st0.value; var sb = document.querySelector("[data-cop-startsend]"); if (sb) sb.hidden = !st0.value.trim(); }
    var e = hit(ev, "[data-cop-edit-text]"); if (e && EDIT) EDIT.text = e.value;
    var fa = hit(ev, "[data-cop-fans]"); if (fa && flowOn()) PANE.flow.ans[PANE.flow.e][+fa.getAttribute("data-cop-fans")] = fa.value;
    var pe = hit(ev, "[data-cop-pentext]");
    if (pe && penHere()) { CARDPEN.text = pe.value; var ps = document.querySelector("[data-cop-pensave]"); setHeld(ps, THINKING ? BUSY : !pe.value.trim() ? "Write something first — a part cannot be saved empty." : ""); }
    var n = hit(ev, "[data-cop-edit-note]"); if (n && EDIT) EDIT.note = n.value;
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
    if (ev.key === "Enter" && !ev.shiftKey && hit(ev, "[data-cop-starttext]")) { ev.preventDefault(); startFree(); }
    if (hit(ev, "[data-cop-pentext]")) {
      if (ev.key === "Escape") { ev.preventDefault(); CARDPEN = null; draw(); return; }
      if (ev.key === "Enter" && (ev.ctrlKey || ev.metaKey)) { ev.preventDefault(); penSave(); return; }
    }
    if (ev.key === "Enter" && hit(ev, "[data-cop-rename-box]")) { ev.preventDefault(); rename(); }
    if (ev.key === "Escape" && hit(ev, "[data-cop-rename-box]")) { RENAME = null; draw(); }
    if (ev.key === "Escape" && (MENU || ASKDEL)) { MENU = null; ASKDEL = null; draw(); }
    if (ev.key === "Escape" && SHEET && !MENU) { SHEET = ""; draw(); }
    var g = hit(ev, "[data-cop-grip]");
    if (g && (ev.key === "ArrowLeft" || ev.key === "ArrowRight" || ev.key === "Home")) {
      ev.preventDefault();
      var ch = g.parentElement.querySelector("[data-cop-chatbox]");
      if (ev.key === "Home") gripSet(g, 0); else gripSet(g, Math.round(ch.getBoundingClientRect().width / pageZoom()) + (ev.key === "ArrowLeft" ? -20 : 20));
    }
  });
  function gripSet(g, w){
    var box = g.parentElement;
    if (!w) { box.style.removeProperty("--cop-chatw"); try { localStorage.removeItem(GRIPKEY); } catch (e) {} return; }
    w = Math.max(420, Math.min(1400, w));
    box.style.setProperty("--cop-chatw", w + "px");
    try { localStorage.setItem(GRIPKEY, String(w)); } catch (e) {}
  }
  document.addEventListener("pointerdown", function(ev){
    var g = hit(ev, "[data-cop-grip]"); if (!g || ev.button !== 0) return;
    ev.preventDefault();
    var ch = g.parentElement.querySelector("[data-cop-chatbox]"), z = pageZoom(), x0 = ev.clientX, w0 = ch.getBoundingClientRect().width / z, w = 0;
    g.classList.add("on");
    function mv(e){ w = Math.round(w0 + (e.clientX - x0) / z); g.parentElement.style.setProperty("--cop-chatw", Math.max(420, Math.min(1400, w)) + "px"); }
    function up(){ document.removeEventListener("pointermove", mv); document.removeEventListener("pointerup", up); g.classList.remove("on"); if (w) gripSet(g, w); }
    document.addEventListener("pointermove", mv); document.addEventListener("pointerup", up);
  });
  document.addEventListener("dblclick", function(ev){ var g = hit(ev, "[data-cop-grip]"); if (g) gripSet(g, 0); });
  /* SENDING. What was typed appears at once and the product says the
     Copilot is working, because a draft can take most of a minute and a box
     that sits still for that long reads as broken (§124). The server's own
     list replaces the page's guess when it lands. */
  function newFoundation(road){
    /* §653: the start decision is the start screen's; a chat opened from a
       card never asks "start from it, or fresh?" again. The plain + New chat
       still does (§478), for a person who chose nothing. */
    act({ act:"newFlow", place: place(), title: fname(), hasPlan: !road && planHas(planParts()), skip: skipNow() }, function(j){
      var l = list(); if (l && l.chats) l.chats.unshift(j.chat);
      if (road) PENDROAD[j.chat.id] = road;
      PANE = { id: j.chat.id, chat: j.chat, messages: [], flow: j.flow, flowSteps: null };
      OPEN[key()] = { kind:"chat", id: j.chat.id };
      openItem("chat", j.chat.id);
    });
  }
  /* What is typed on the start screen opens a free chat and is its first
     message — said once, never lost: the box keeps it until the chat exists. */
  function startFree(file){
    var t = document.querySelector("[data-cop-starttext]"), text = t ? t.value : "", k = key();
    if ((!text.trim() && !file) || THINKING || !canEdit()) { if (t) t.focus(); return; }
    act({ act:"newChat", place: place(), section: section(), free: true, title: "Free chat — " + placeWord() }, function(j){
      var l = list(); if (l && l.chats) l.chats.unshift(j.chat);
      delete STARTTEXT[k];
      PANE = { id: j.chat.id, chat: j.chat, messages: [] };
      OPEN[key()] = { kind:"chat", id: j.chat.id };
      /* §640: a file picked on the start screen waits above the chat's box
         with whatever was typed, to be sent as one message; typed words
         alone are sent at once. */
      if (file) { DRAFT[j.chat.id] = text; draw(); attach(file); }
      else { draw(); send(text); }
    });
  }
  /* §641: sent in a SWOT chat, the box's words are the answer to the
     question being asked; the next one follows (the last stays, answered). */
  function swType(text){
    if (!text.trim()) return;
    var s = PANE.swot, area = swSel().split("|")[0], qs = (PANE.swotQuestions || {})[area] || [], i = swQi(s, area);
    var g = swCopy(); g.ans[area] = (g.ans[area] || []).slice(); g.ans[area][i] = text.trim();
    g.q = { area: area, i: Math.min(qs.length - 1, i + 1) };
    SWSUG = null; swSave(g);
  }
  function send(forced){
    if (!PANE || !PANE.chat || THINKING) return;
    var id = PANE.chat.id, t = document.querySelector("[data-cop-text]");
    var text = forced != null ? forced : (t ? t.value : (DRAFT[id] || ""));
    var files = (PANE.pending || []).slice();
    if (!text.trim() && !files.length) return;
    if (flowView()) { if (forced == null && t) t.value = ""; flowType(text); return; }
    if (swotOn()) {
      if (swGuidedNow()) { if (forced == null && t) t.value = ""; DRAFT[id] = ""; swType(text); return; }
      /* §654 C2 — with a draft on the right, the box says what to change */
      if (swCanChange()) { if (forced == null && t) t.value = ""; DRAFT[id] = ""; swAsk({ act:"swotChange", ask: text.trim(), swot: swCopy() }); return; }
      return;
    }
    /* §688 — in an Advisory chat the box is the question, then the answer, then a change to the brief */
    if (advOn()) { if (!adCanType()) return; var sa = PANE.advisory, pq = adPending(sa); if (forced == null && t) t.value = ""; DRAFT[id] = "";
      if (sa.brief) adAsk({ act:"advisoryRevise", ask: text.trim() }); else adAsk({ act:"advisoryTurn", reply: pq && pq.clash ? "own" : "say", words: text.trim() }); return; }
    /* §684 — in an Execution chat the box asks for a change to the item in hand */
    if (execOn()) { if (!exCanType()) return; if (forced == null && t) t.value = ""; DRAFT[id] = ""; exAsk(text.trim()); return; }
    /* §675 — in a Directions chat the box asks for more, or adds a line of your own */
    if (dirsOn()) { if (!dvCanType()) return; var w = dvAskWhat(), ownLine = DVADD[id] === w; if (forced == null && t) t.value = ""; DRAFT[id] = ""; DVADD[id] = null;
      dvAsk(ownLine ? { act: w === "caps" ? "capSuggest" : "dirMore", own: [text.trim()] } : { act: w === "caps" ? "capSuggest" : "dirMore", ask: text.trim() }); return; }
    /* §654 C1 — in a Competitive Discipline chat the box asks for a change to the table */
    if (competeOn()) { if (!cpCanType()) return; if (forced == null && t) t.value = ""; DRAFT[id] = ""; cpAsk({ act:"competeRefine", ask: text.trim() }); return; }
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
  function fileProblem(file){
    if (!/\.(docx|pdf|xlsx)$/i.test(file.name)) return "The Copilot reads Word (.docx), PDF and Excel (.xlsx) files. Save it as one of those and attach it again.";
    if (file.size > MAX_FILE) return "That file is larger than 3 MB, so it was not attached. Split it, or paste the part that matters.";
    return "";
  }
  function attach(file){
    if (!file || !PANE || !PANE.chat) return;
    var id = PANE.chat.id, bad = fileProblem(file);
    if (bad) { SAY = bad; draw(); return; }
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
    var sf = hit(ev, "[data-cop-startfile]");
    if (sf) { var sfile = sf.files && sf.files[0]; sf.value = ""; if (!sfile) return;
      var sbad = fileProblem(sfile); if (sbad) { SAY = sbad; draw(); return; }   /* refused before any chat is made */
      startFree(sfile); return; }
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
  document.addEventListener("keydown", function(ev){
    var b = (ev.key === "Enter" || ev.key === " ") && hit(ev, "[data-cop-more], [data-cop-answers]");
    if (b) { ev.preventDefault(); ev.stopPropagation(); if (b.hasAttribute("data-cop-more")) moreToggle(b); else answersGo(b); }
  }, true);
  /* §649 — A HELD BUTTON IS NEVER PRESSED: stopped here, in the capture
     phase, before any handler (every one of them used to test `disabled`).
     Its bubble has already said why. Only the Copilot's own controls. */
  var COPSCOPE = ".copmain, .coppane, [data-cop-chatbox], .copsavebar, .copsw, .copcards, .copleft";
  function heldAt(t){ var h = t && t.closest && t.closest('[aria-disabled="true"][data-tip]'); return h && h.closest(COPSCOPE) ? h : null; }
  document.addEventListener("click", function(ev){
    var h = ev.target && ev.target.closest && ev.target.closest('[aria-disabled="true"]');
    if (h && h.closest(COPSCOPE)) { ev.preventDefault(); ev.stopImmediatePropagation(); if (h.getAttribute("data-tip")) tipShow(h, true); }
  }, true);
  /* §649.1 — THE BUBBLE IS THE PAGE'S, placed from the button and kept
     inside the window: above it, or below when there is no room; never cut
     by the pane or the chat box it sits in. Shown on hover, Tab and a tap
     (a tap shows it for a few seconds); gone on leaving, scrolling or a key. */
  var TIPEL = null, TIPFOR = null, TIPT = 0;
  function tipShow(el, tap){
    if (!TIPEL) { TIPEL = document.createElement("div"); TIPEL.id = "coptip"; TIPEL.setAttribute("role", "tooltip"); document.body.appendChild(TIPEL); }
    TIPFOR = el; TIPEL.textContent = el.getAttribute("data-tip") || "";
    if (!TIPEL.id || !el.getAttribute("aria-describedby")) el.setAttribute("aria-describedby", "coptip");
    TIPEL.style.display = "block"; TIPEL.style.left = "0px"; TIPEL.style.top = "0px";
    var z = typeof pageZoom === "function" ? pageZoom() : 1, r = el.getBoundingClientRect();
    var L = r.left / z, T = r.top / z, W = r.width / z, B = r.bottom / z, vw = window.innerWidth / z, vh = window.innerHeight / z;
    var w = TIPEL.offsetWidth, h = TIPEL.offsetHeight;
    var x = Math.max(8, Math.min(L + W / 2 - w / 2, vw - w - 8)), y = T - h - 8;
    if (y < 8) y = Math.min(B + 8, vh - h - 8);
    TIPEL.style.left = Math.round(x) + "px"; TIPEL.style.top = Math.round(y) + "px";
    clearTimeout(TIPT); if (tap) TIPT = setTimeout(tipHide, 3000);
  }
  function tipHide(){ clearTimeout(TIPT); if (TIPEL) TIPEL.style.display = "none"; if (TIPFOR) TIPFOR.removeAttribute("aria-describedby"); TIPFOR = null; }
  document.addEventListener("mouseover", function(ev){ var h = heldAt(ev.target); if (h) { if (h !== TIPFOR) tipShow(h); } else if (TIPFOR && !TIPFOR.contains(ev.target)) tipHide(); });
  document.addEventListener("focusin", function(ev){ var h = heldAt(ev.target); if (h) tipShow(h); else if (TIPFOR) tipHide(); });
  document.addEventListener("focusout", function(ev){ if (TIPFOR && ev.target === TIPFOR) tipHide(); });
  document.addEventListener("scroll", function(){ if (TIPFOR) tipHide(); }, true);
  document.addEventListener("keydown", function(ev){ if (TIPFOR && ev.key === "Escape") tipHide(); });
  document.addEventListener("click", function(ev){
    var b;
    if ((b = hit(ev, "[data-cop-more]"))) { ev.preventDefault(); ev.stopPropagation(); moreToggle(b); return; }
    if ((b = hit(ev, "[data-cop-answers]"))) { ev.preventDefault(); ev.stopPropagation(); answersGo(b); return; }
    if (flowClick(ev)) return;
    if (cpClick(ev)) return;
    if (adClick(ev)) return;
    if (dvClick(ev)) return;
    if (exClick(ev)) return;
    if (swClick(ev)) return;
    if ((b = hit(ev, "[data-cop-railtog]"))) { var sh = !railFolded(); RAILKEPT = !sh; setRail(sh); return; }
    if ((b = hit(ev, "[data-cop-sheet]"))) { var k = b.getAttribute("data-cop-sheet"); SHEET = SHEET === k ? "" : k; draw(); return; }
    if ((b = hit(ev, "[data-cop-showdraft]"))) { if (PANE && PANE.chat) PANELPICK[PANE.chat.id] = b.getAttribute("data-cop-showdraft"); SHEET = "draft"; draw(); return; }
    if ((b = hit(ev, "[data-cop-retry]"))) { loadList(true); return; }
    if ((b = hit(ev, "[data-cop-reopen]"))) { var o = OPEN[key()]; if (o) openItem(o.kind, o.id); return; }
    if ((b = hit(ev, "[data-cop-chat]"))) { SAY = ""; MENU = null; openItem("chat", b.getAttribute("data-cop-chat")); return; }
    if ((b = hit(ev, "[data-cop-deliv]"))) { SAY = ""; openItem("deliv", b.getAttribute("data-cop-deliv")); return; }
    if ((b = hit(ev, "[data-cop-go]"))) { goSection(b.getAttribute("data-cop-go"), b.getAttribute("data-cop-go-deliv") || ""); return; }
    /* §538: the hold moved from `disabled` to `aria-disabled` so its reason
       could be read, and `b.disabled` goes false the moment it does — a guard
       left reading that property would let the held button act. */
    if ((b = hit(ev, "[data-cop-dapply]"))) { if (b.getAttribute("aria-disabled") !== "true") delivApplyAsk(); return; }
    if ((b = hit(ev, "[data-cop-fapply]"))) { if (!b.disabled && b.getAttribute("aria-disabled") !== "true")
      applyAsk(b.getAttribute("data-cop-fapply"), b.getAttribute("data-cop-fapply-title") || fname(),
      { n: Number(b.getAttribute("data-cop-fapply-n")) || 0, on: Number(b.getAttribute("data-cop-fapply-on")) || 0, parts: Number(b.getAttribute("data-cop-fapply-parts")) || 0 }); return; }
    if ((b = hit(ev, "[data-cop-home]"))) {
      MENU = null; ASKDEL = null; SAY = ""; SHEET = ""; delete OPEN[key()]; PANE = null;
      if (hit(ev, ".copslim")) { RAILKEPT = true; setRail(false); }
      draw(); var st = document.querySelector("[data-cop-starttext]"); if (st) st.focus(); return;
    }
    if ((b = hit(ev, "[data-cop-startsend]"))) { startFree(); return; }
    if ((b = hit(ev, "[data-cop-startattach]"))) { var sfi = document.querySelector("[data-cop-startfile]"); if (sfi) sfi.click(); return; }
    if ((b = hit(ev, "[data-cop-road]"))) { newFoundation(b.getAttribute("data-cop-road")); return; }
    if ((b = hit(ev, "[data-cop-newplan]"))) {
      MENU = null;
      var np = b.getAttribute("data-cop-newplan");
      if (np === "directions") { dvNew("directions", true); return; }
      if (np === "execution") { exNew("refine"); return; }
      if (np === "compete") {
        var cw = cpPlanHeld(); if (!cw) return;
        act({ act:"newCompete", place: place(), title: cpTitle(), fromPlan: { discipline: cw.discipline, values: cw.values } }, function(j){
          var l = list(); if (l && l.chats) l.chats.unshift(j.chat);
          PANE = Object.assign({ id: j.chat.id, chat: j.chat, messages: [] }, {});
          cpView(j);
          OPEN[key()] = { kind:"chat", id: j.chat.id };
          draw();
        });
        return;
      }
      act({ act:"newSwot", place: place(), title: swTitle(), fromPlan: planSwot() }, function(j){
        var l = list(); if (l && l.chats) l.chats.unshift(j.chat);
        PENDSTART[j.chat.id] = "plan";
        OPEN[key()] = { kind:"chat", id: j.chat.id };
        openItem("chat", j.chat.id);
      });
      return;
    }
    if ((b = hit(ev, "[data-cop-newchat]"))) {
      MENU = null;
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
          draw();
          cpAsk({ act:"competeScore" });
        });
        return;
      }
      if (section() === "foundation") { newFoundation(""); return; }
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
    if ((b = hit(ev, "[data-cop-edit-chat]"))) { openItem("chat", b.getAttribute("data-cop-edit-chat")); return; }
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
