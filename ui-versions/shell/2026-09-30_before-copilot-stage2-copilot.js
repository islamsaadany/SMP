/* ══ THE STRATEGY COPILOT, AS A TAB (spec 064, stage 1) ═══════════════════
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
  var EDIT = null;               /* {id, text, note} while a deliverable is being edited */
  var RENAME = null;             /* chat id being renamed */
  var DRAFT = {};                /* chat id -> what is half-typed in its composer */
  var SAY = "";                  /* the outcome line under the pane (§63) */
  var busy = false, askedFor = null;

  function E(s){ return typeof esc === "function" ? esc(s) : String(s == null ? "" : s); }
  function live(){ return typeof SYNC !== "undefined" && SYNC.isLive && SYNC.isLive(); }
  function stamped(){ return document.documentElement.getAttribute("data-copilot") === "1"; }
  function shown(){ return stamped() && live() && (typeof inOffice !== "function" || inOffice()); }

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
        '<section class="coprail"><div class="coprh"><span>Chats</span>' +
          '<button type="button" class="copnew" data-cop-newchat>+ New chat</button></div>' +
          '<div class="coplist" data-cop-chats>' + chatsHtml() + '</div></section>' +
        '<section class="coprail"><div class="coprh"><span>Deliverables</span></div>' +
          '<div class="coplist" data-cop-delivs>' + delivsHtml() + '</div></section>' +
      '</aside>' +
      '<div class="copmain" data-cop-main>' + mainHtml() + '</div>' +
    '</div>';
  }
  function list(){ return LISTS[key()] || null; }
  function chatsHtml(){
    var l = list();
    if (!l) return '<div class="copnone">Asking…</div>';
    if (l.failed) return '<div class="copnone">The chats could not be read just now. Nothing has been lost. ' +
      '<button type="button" class="linkbu" data-cop-retry>Try again</button></div>';
    if (!l.chats.length) return '<div class="copnone">No chats here yet.</div>';
    var o = OPEN[key()] || {};
    return l.chats.map(function(c){
      var on = o.kind === "chat" && o.id === c.id;
      return '<button type="button" class="copitem' + (on ? " on" : "") + '" data-cop-chat="' + E(c.id) + '"' +
        (on ? ' aria-current="true"' : '') + '>' +
        '<span class="copt">' + E(c.title) + '</span>' +
        '<span class="copm">' + E(nameOf(c.by)) + ' · ' + E(when(c.last)) + '</span></button>';
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
      '<b>Start a chat, or open a deliverable.</b>' +
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

  function chatHtml(){
    var c = PANE.chat;
    var head = RENAME === c.id
      ? '<input class="fld copren" data-cop-rename-box value="' + E(c.title) + '" aria-label="Chat name" maxlength="160">' +
        '<button type="button" class="copbtn" data-cop-rename-save>Save</button>' +
        '<button type="button" class="copbtn quiet" data-cop-rename-cancel>Cancel</button>'
      : '<h3 class="coph">' + E(c.title) + '</h3>' +
        '<button type="button" class="copbtn quiet" data-cop-rename>Rename</button>' +
        (PANE.mayDelete ? '<button type="button" class="copbtn quiet danger" data-cop-delete>Delete</button>' : '');
    var msgs = PANE.messages.map(function(m){
      if (m.who === "ai") {
        var product = m.part && m.part.kind === "notConnected";
        return '<div class="copmsg ' + (product ? "product" : "ai") + '">' +
          (product ? '' : '<span class="copwho">Copilot</span>') + '<div class="copbody">' + E(m.body) + '</div></div>';
      }
      return '<div class="copmsg me"><span class="copwho">' + E(nameOf(m.by)) + ' · ' + E(when(m.at)) + '</span>' +
        '<div class="copbody">' + E(m.body) + '</div></div>';
    }).join("");
    return '<div class="copchat">' +
      '<div class="copheadrow">' + head + '</div>' +
      (PANE.confirmDelete ? '<div class="copask" role="alert">Delete this chat and everything said in it? This cannot be undone. ' +
        '<button type="button" class="copbtn danger" data-cop-delete-yes>Delete</button>' +
        '<button type="button" class="copbtn quiet" data-cop-delete-no>Keep it</button></div>' : '') +
      '<div class="copmsgs" data-cop-msgs>' + (msgs || '<div class="copnone">Nothing said yet.</div>') + '</div>' +
      '<div class="copcompose">' +
        '<textarea class="fld" data-cop-text rows="3" placeholder="Write to the Copilot…" aria-label="Message">' + E(DRAFT[c.id] || "") + '</textarea>' +
        '<button type="button" class="copsend" data-cop-send>Send</button>' +
      '</div></div>';
  }

  function delivHtml(){
    var d = PANE.deliverable, vs = PANE.versions, cur = vs[0];
    var text = cur && cur.body && typeof cur.body.text === "string" ? cur.body.text : "";
    var editing = EDIT && EDIT.id === d.id;
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
          : '<button type="button" class="copbtn quiet" data-cop-restore="' + v.n + '">Restore</button>') + '</li>';
    }).join("");
    return '<div class="copdeliv">' +
      '<div class="copheadrow"><h3 class="coph">' + E(d.title) + '</h3>' +
        '<span class="copchip">' + kindWord(d.kind) + '</span>' +
        (editing ? '' : '<button type="button" class="copbtn quiet" data-cop-edit>Edit</button>') + '</div>' +
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
    var b = document.querySelector("[data-cop-delivs]"); if (b) b.innerHTML = delivsHtml();
    var m = document.querySelector("[data-cop-main]"); if (m) m.innerHTML = mainHtml();
    var msgs = document.querySelector("[data-cop-msgs]"); if (msgs) msgs.scrollTop = msgs.scrollHeight;
  }

  /* ── THE ASKS ──────────────────────────────────────────────────────── */
  function loadList(force){
    if (!shown()) return;
    var k = key(), p = place(), s = section();
    if (!force && LISTS[k] && !LISTS[k].failed) { draw(); openIfNeeded(); return; }
    askedFor = k;
    getJ("list", ["place=" + encodeURIComponent(p), "section=" + encodeURIComponent(s)]).then(function(x){
      if (x.st === 200 && x.j && x.j.ok) LISTS[k] = { chats: x.j.chats || [], deliverables: x.j.deliverables || [] };
      else LISTS[k] = { failed: true };
      if (askedFor === k) { draw(); openIfNeeded(); }
    }, function(){ LISTS[k] = { failed: true }; if (askedFor === k) draw(); });
  }
  function openIfNeeded(){
    var o = OPEN[key()];
    if (o && (!PANE || PANE.id !== o.id)) openItem(o.kind, o.id);
  }
  function openItem(kind, id){
    OPEN[key()] = { kind: kind, id: id }; EDIT = null; RENAME = null;
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
    var t = hit(ev, "[data-cop-text]"); if (t && PANE && PANE.chat) DRAFT[PANE.chat.id] = t.value;
    var e = hit(ev, "[data-cop-edit-text]"); if (e && EDIT) EDIT.text = e.value;
    var n = hit(ev, "[data-cop-edit-note]"); if (n && EDIT) EDIT.note = n.value;
  });
  document.addEventListener("keydown", function(ev){
    if (ev.key === "Enter" && !ev.shiftKey && hit(ev, "[data-cop-text]")) { ev.preventDefault(); send(); }
    if (ev.key === "Enter" && hit(ev, "[data-cop-rename-box]")) { ev.preventDefault(); rename(); }
    if (ev.key === "Escape" && hit(ev, "[data-cop-rename-box]")) { RENAME = null; draw(); }
  });
  function send(){
    if (!PANE || !PANE.chat) return;
    var id = PANE.chat.id, t = document.querySelector("[data-cop-text]");
    var text = t ? t.value : (DRAFT[id] || "");
    if (!text.trim()) return;
    act({ act:"say", id:id, text:text }, function(j){
      DRAFT[id] = ""; var t2 = document.querySelector("[data-cop-text]"); if (t2) t2.value = "";
      PANE.messages = j.messages || PANE.messages; loadList(true);
    });
  }
  function rename(){
    var b = document.querySelector("[data-cop-rename-box]"); if (!b || !PANE || !PANE.chat) return;
    var id = PANE.chat.id, title = b.value;
    act({ act:"rename", id:id, title:title }, function(){ RENAME = null; PANE.chat.title = title.replace(/\s+/g, " ").trim(); loadList(true); });
  }
  document.addEventListener("click", function(ev){
    var b;
    if ((b = hit(ev, "[data-cop-retry]"))) { loadList(true); return; }
    if ((b = hit(ev, "[data-cop-reopen]"))) { var o = OPEN[key()]; if (o) openItem(o.kind, o.id); return; }
    if ((b = hit(ev, "[data-cop-chat]"))) { SAY = ""; openItem("chat", b.getAttribute("data-cop-chat")); return; }
    if ((b = hit(ev, "[data-cop-deliv]"))) { SAY = ""; openItem("deliv", b.getAttribute("data-cop-deliv")); return; }
    if ((b = hit(ev, "[data-cop-newchat]"))) {
      act({ act:"newChat", place: place(), section: section() }, function(j){
        var l = list(); if (l && l.chats) l.chats.unshift(j.chat);
        PANE = { id: j.chat.id, chat: j.chat, messages: [], mayDelete: true };
        OPEN[key()] = { kind:"chat", id: j.chat.id };
        draw(); var t = document.querySelector("[data-cop-text]"); if (t) t.focus();
      });
      return;
    }
    if ((b = hit(ev, "[data-cop-send]"))) { send(); return; }
    if ((b = hit(ev, "[data-cop-rename]"))) { RENAME = PANE && PANE.chat ? PANE.chat.id : null; draw();
      var r = document.querySelector("[data-cop-rename-box]"); if (r) { r.focus(); r.select(); } return; }
    if ((b = hit(ev, "[data-cop-rename-save]"))) { rename(); return; }
    if ((b = hit(ev, "[data-cop-rename-cancel]"))) { RENAME = null; draw(); return; }
    if ((b = hit(ev, "[data-cop-delete]"))) { if (PANE) { PANE.confirmDelete = true; draw(); } return; }
    if ((b = hit(ev, "[data-cop-delete-no]"))) { if (PANE) { PANE.confirmDelete = false; draw(); } return; }
    if ((b = hit(ev, "[data-cop-delete-yes]"))) {
      if (!PANE || !PANE.chat) return;
      var id = PANE.chat.id;
      act({ act:"deleteChat", id:id }, function(){ delete OPEN[key()]; PANE = null; delete DRAFT[id];
        SAY = "The chat was deleted."; loadList(true); });
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

  return { shown: shown, sections: sections, render: renderPane,
           /* for the checks */
           state: function(){ return { open: OPEN[key()] || null, list: list(), pane: PANE, say: SAY }; } };
})();
