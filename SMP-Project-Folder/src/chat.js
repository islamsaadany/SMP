/* ══ TALKING TO THE STRATEGY OFFICE (§95) ═══════════════════════════════════
   Islam: "can we have some sort of a chat but on the platform where on the
   bottom right they have this … so it sounds like a chat, people chatting,
   sending messages, and picks the people and replies to them."

   TWO SURFACES, ONE ENDPOINT. The bubble in the corner is everybody's; the
   inbox on Setup › Running the cycle › Messages is the office's. Both are in
   this file because they are two views of the same three tables, and the
   thing that goes wrong when they are apart is that one of them starts
   describing a conversation differently from the other.

   ── THE RULE THIS WHOLE FILE IS BUILT AROUND ──────────────────────────────
   NOTHING IN HERE EVER CALLS paint(). Not the poll, not a send, not the
   office's reply. paint() rebuilds the entire panel — it would throw away the
   half-typed message, the focus, the scroll position and the file somebody had
   just attached, four seconds after they started typing (§35, §71.2, §30.1,
   §63). Every update writes into the node it is about and nothing else, and
   the composer is DELIBERATELY outside the region that gets rewritten, so a
   message arriving while you type cannot touch what you have written.

   THE BUBBLE IS NOT DRAWN WHERE IT WOULD BE A LIE. From `file://` there is no
   server to carry a message, and a control that cannot work is worse than no
   control (§16.7). In Presentation the platform is on a projector in front of
   the board — that one is CSS, off the class present.js already sets, so there
   is no second piece of state to keep in step.
   ────────────────────────────────────────────────────────────────────────── */
var CHAT = (function(){
  "use strict";

  /* Two cadences, and the difference is what somebody is doing. Open, they are
     waiting for an answer and four seconds is a conversation; closed, the only
     thing that can change is a number on a badge. Both stamp `here_at`, which
     is the whole of the presence test the email rule reads (§95.5) — so the
     slow one also has to be fast enough that "away" means away. */
  var POLL_OPEN = 4000, POLL_SHUT = 60000;
  var PIC_EDGE = 1600;

  var open = false, mounted = false, timer = null;
  var state = { messages: [], unread: 0, thread: null, office: false };
  var loaded = false, sending = false, shot = null, lastErr = "";
  /* The office inbox's own state, kept apart: the two surfaces poll on
     different clocks and a person in the office has both open at once. */
  /* `note` is what the LAST send actually did, and it lives out here rather
     than in the DOM for the reason §63 records: the refresh that follows a
     send rebuilds the pane and would wipe the sentence the send just wrote —
     the word has to survive the redraw that reports it. Cleared when the
     conversation changes, because it is news about this one. */
  var box = { person: null, threads: [], data: null, timer: null, q: "",
              tab: "waiting", note: null };

  function servable(){ return location.protocol !== "file:"; }
  function el(id){ return document.getElementById(id); }
  function esc2(s){
    return String(s == null ? "" : s)
      .replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;");
  }

  function post(body, done){
    /* REFUSED HERE, NOT AT EACH CALLER (§24). Opened from `file://` there is
       no server to ask, and a fetch to `/api/chat` from `origin: null` is a
       CORS failure in the console rather than an error anything can catch.
       `mount()` already refuses, but the office's Setup page is drawn by
       paint() and its clock runs on its own — so the ONE place every request
       goes through is the only place this cannot be forgotten. Found by
       qa.py, which walks every Setup page over file:// as the SMO. */
    if (!servable()) { done("There is no server behind this file.", null); return; }
    fetch("/api/chat", { method:"POST", cache:"no-store",
                         headers:{ "Content-Type":"application/json" },
                         body: JSON.stringify(body) })
      .then(function(r){ return r.json().then(function(j){ j.__status = r.status; return j; }); })
      .then(function(j){ done(j && j.ok ? null : ((j && j.error) || "failed"), j); })
      .catch(function(e){ done(String((e && e.message) || e), null); });
  }

  /* ── WHERE SOMEBODY IS, CAPTURED AND NOT TYPED (§71's rule) ─────────────
     The page, the subject and the cycle are things the screen already knows.
     Asking for them is asking a person to do the computer's job, and they get
     it wrong more often than the machine does.

     Read defensively from the shell's globals: this file is inlined before
     them and a boot that failed half way must not take the chat down with it —
     "I cannot open anything" is exactly when somebody needs to write in. */
  /* READ OFF THE NAVIGATION ITSELF, in the words it is wearing. Not from
     `currentSub`, which is a KEY — that put "the group › performance" on a
     message where the screen said "Group › Performance". The register learned
     this one already (§93.12): what somebody is told they were looking at has
     to be what the navigation called it, and the only way that cannot drift is
     to take the string from the navigation. */
  function navWord(sel){
    var b = document.querySelector(sel);
    if (!b) return "";
    var c = b.cloneNode(true);
    /* Three things inside a navigation control that are not its NAME: the
       visually-hidden status on a tab ("— not submitted yet"), the caret on a
       dropdown, and the count under a menu item. */
    Array.prototype.forEach.call(c.querySelectorAll(".vh, .dlcar, .dlsub"),
                                 function(n){ n.remove(); });
    return c.textContent.replace(/\s+/g, " ").trim();
  }
  function whereNow(){
    var out = { page:"", target:"", cycle:"", build:"" };
    try {
      if (typeof current !== "undefined") out.target = String(current || "");
      out.page = [
        /* NOT `#units button` — the group and the companies sit in a DROPDOWN
           whose <summary> carries the selection, so asking only for buttons
           leaves every group page with no destination on it and slides the
           tab's name into first position. §94.6's trap, which cost that
           section a wrong landing page for the same reason. */
        navWord('#units [aria-selected="true"]'),
        navWord('#subtabs button[aria-selected="true"]') || navWord(".setuprail .ritem.on"),
        navWord('#secrow-in button[aria-selected="true"]')
      ].filter(Boolean).join(" › ");
      if (typeof REVIEW !== "undefined" && REVIEW && REVIEW.name) out.cycle = String(REVIEW.name);
      if (typeof BUILD_ID !== "undefined" && BUILD_ID) out.build = String(BUILD_ID);
    } catch (e) {}
    return out;
  }

  function when(at){
    var d = new Date(at), now = new Date();
    if (isNaN(d)) return "";
    var hm = String(d.getHours()).padStart(2,"0") + ":" + String(d.getMinutes()).padStart(2,"0");
    var sameDay = d.toDateString() === now.toDateString();
    if (sameDay) return hm;
    var y = new Date(now.getTime() - 864e5);
    if (d.toDateString() === y.toDateString()) return "Yesterday " + hm;
    return d.toLocaleDateString(undefined, { day:"numeric", month:"short" }) + " " + hm;
  }
  function dayOf(at){
    var d = new Date(at), now = new Date();
    if (isNaN(d)) return "";
    if (d.toDateString() === now.toDateString()) return "Today";
    var y = new Date(now.getTime() - 864e5);
    if (d.toDateString() === y.toDateString()) return "Yesterday";
    return d.toLocaleDateString(undefined, { day:"numeric", month:"long", year:"numeric" });
  }
  function ago(at){
    if (!at) return "";
    var m = Math.round((Date.now() - new Date(at).getTime()) / 60000);
    if (m < 1) return "just now";
    if (m < 60) return m + (m === 1 ? " minute ago" : " minutes ago");
    var h = Math.round(m / 60);
    if (h < 24) return h + (h === 1 ? " hour ago" : " hours ago");
    var d = Math.round(h / 24);
    return d + (d === 1 ? " day ago" : " days ago");
  }

  var ICON_PAGE =
    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" ' +
    'stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' +
    '<rect x="3" y="4" width="18" height="16" rx="2"/><path d="M3 9h18"/></svg>';
  var ICON_CLOCK =
    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" ' +
    'stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' +
    '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></svg>';

  /* ── ONE MESSAGE, DRAWN THE SAME WAY ON BOTH SURFACES ───────────────────
     `mineSide` says which side of the panel counts as "me", because the same
     message is on the right in the person's panel and on the left in the
     office's inbox. One function, so the two can never start disagreeing
     about what a message looks like. */
  function msgHtml(m, mineIsOffice, showFlag){
    var mine = mineIsOffice ? m.from_office : !m.from_office;
    var who = m.from_office ? ((m.by_name || "The office") + " · Strategy Office")
                            : (mineIsOffice ? (m.by_name || "") : "You");
    var ctx = "";
    if (!m.from_office && (m.page || m.cycle)) {
      ctx = '<div class="chctx">' + ICON_PAGE + " " +
            esc2([m.page, m.cycle, m.build].filter(Boolean).join(" · ")) + "</div>";
    }
    var pic = m.has_shot
      ? '<button class="chshot" type="button" data-chshot="' + m.id + '">' +
        '<span class="chthumb"></span> Screenshot — open</button>'
      : "";
    var flag = "";
    /* NEVER ON THE OFFICE'S OWN REPLY. A flag is the office marking something
       to come back to out of thirty conversations, and there is nothing to
       come back to in an answer it wrote itself — a control that can be
       pressed and means nothing is worse than no control. */
    if (showFlag && !m.from_office) {
      flag = '<button class="chmini' + (m.flag ? " on" : "") + '" type="button" ' +
             'data-chflag="' + m.id + '" data-chflagged="' + esc2(m.flag || "") + '">' +
             (m.flag ? esc2(m.flag) : "Flag") + "</button>";
    }
    return '<div class="chmsg ' + (mine ? "chme" : "chthem") + '">' +
      '<div class="chwho"><span>' + esc2(who) + "</span><span>" + esc2(when(m.at)) + "</span>" +
      flag + "</div>" +
      '<div class="chbod">' + esc2(m.body) + pic + "</div>" + ctx + "</div>";
  }

  function threadHtml(msgs, mineIsOffice, showFlag){
    if (!msgs.length) return "";
    var out = [], day = "";
    msgs.forEach(function(m){
      var d = dayOf(m.at);
      if (d !== day) { day = d; out.push('<div class="chatday">' + esc2(d) + "</div>"); }
      out.push(msgHtml(m, mineIsOffice, showFlag));
    });
    return out.join("");
  }

  /* ══ THE CORNER ═════════════════════════════════════════════════════════ */

  function dockHtml(){
    return '' +
      '<div class="chatpanel" id="chatpanel" hidden role="dialog" aria-label="Strategy Office">' +
        '<div class="chathead">' +
          "<div><div class=\"cht\">Strategy Office</div>" +
          '<div class="chs" id="chatsub"></div></div>' +
          '<button class="chx" id="chatclose" type="button" aria-label="Close">&times;</button>' +
        "</div>" +
        '<div class="chatbody" id="chatbody"></div>' +
        '<div class="chatfoot">' +
          '<div class="chcomp">' +
            '<button class="chicon" id="chatpic" type="button" title="Attach a screenshot" ' +
              'aria-label="Attach a screenshot">' +
              '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" ' +
              'stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' +
              '<rect x="3" y="5" width="18" height="14" rx="2"/><circle cx="8.5" cy="10" r="1.5"/>' +
              '<path d="m21 16-5-5L5 19"/></svg></button>' +
            '<input type="file" id="chatfile" accept="image/*" hidden>' +
            '<textarea id="chatsay" rows="1" placeholder="Write to the office…" ' +
              'aria-label="Your message"></textarea>' +
            '<button class="chsend" id="chatsend" type="button">Send</button>' +
          "</div>" +
          '<div class="chnote" id="chatnote">The page you are on is sent with your message.</div>' +
        "</div>" +
      "</div>" +
      '<button class="chatbtn" id="chatbtn" type="button" aria-label="Message the Strategy Office">' +
        '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" ' +
        'stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' +
        '<path d="M21 11.5a8.4 8.4 0 0 1-9 8.4 9.7 9.7 0 0 1-2.7-.4L3 21l1.6-4.6A8.2 8.2 0 0 1 ' +
        '3.6 11.5 8.4 8.4 0 0 1 12 3.1a8.4 8.4 0 0 1 9 8.4z"/></svg>' +
        '<span class="chn" id="chatn" hidden>0</span>' +
      "</button>";
  }

  /* Only the BODY and the badge, never the composer — see the rule at the top
     of this file. Called on every poll, so it must be safe mid-typing. */
  function drawPanel(){
    var body = el("chatbody"); if (!body) return;
    /* KEEP THE PLACE UNLESS THEY WERE AT THE BOTTOM. Somebody reading back
       through a conversation must not be dragged to the end because an answer
       arrived — but somebody at the end wants to follow it. */
    var atEnd = body.scrollHeight - body.scrollTop - body.clientHeight < 40;
    if (!loaded) {
      body.innerHTML = '<div class="chempty"><p>One moment…</p></div>';
    } else if (!state.messages.length) {
      body.innerHTML = '<div class="chempty"><div class="chbig">Ask us anything</div>' +
        "<p>A number that looks wrong, a page you cannot reach, a deadline you need " +
        "moved. One of us will come back to you.</p></div>";
    } else {
      body.innerHTML = threadHtml(state.messages, false, false);
    }
    if (atEnd) body.scrollTop = body.scrollHeight;

    var sub = el("chatsub");
    if (sub) {
      sub.innerHTML = state.messages.length && state.thread && state.thread.waiting
        ? '<span class="chatdot" style="background:var(--attn)"></span> With the office'
        : '<span class="chatdot"></span> Usually answers the same day';
    }
    var n = el("chatn");
    if (n) {
      if (state.unread > 0 && !open) { n.hidden = false; n.textContent = String(state.unread); }
      else n.hidden = true;
    }
    var note = el("chatnote");
    if (note) {
      note.className = "chnote" + (lastErr ? " bad" : "");
      note.textContent = lastErr ? lastErr
        : shot ? "A screenshot is attached. It is sent with your next message."
        : "The page you are on is sent with your message.";
    }
  }

  function poll(){
    if (!servable()) return;
    post({ action:"mine" }, function(err, j){
      if (!err && j) {
        state.messages = j.messages || [];
        state.unread = j.unread || 0;
        state.thread = j.thread || null;
        state.office = !!j.office;
        loaded = true;
        var dock = el("chatdock"); if (dock) dock.hidden = false;
        drawPanel();
        /* Opened, and something new arrived while it was open — read it. */
        if (open && state.unread > 0) post({ action:"seen" }, function(){ state.unread = 0; });
      } else if (j && (j.__status === 401 || j.__status === 403)) {
        /* NOT SIGNED IN, OR NOT PAST THE PASSWORD YET. Take the corner away
           rather than leaving a control that answers every press with a
           refusal, and stop asking. */
        var d = el("chatdock"); if (d) d.hidden = true;
        stop();
      }
    });
  }

  function stop(){ if (timer) { clearInterval(timer); timer = null; } }
  function beat(){
    stop();
    timer = setInterval(poll, open ? POLL_OPEN : POLL_SHUT);
  }

  function setOpen(v){
    open = !!v;
    var p = el("chatpanel"); if (p) p.hidden = !open;
    if (open) {
      drawPanel();
      var body = el("chatbody"); if (body) body.scrollTop = body.scrollHeight;
      var t = el("chatsay"); if (t) t.focus();
      if (state.unread > 0) post({ action:"seen" }, function(){ state.unread = 0; drawPanel(); });
      poll();
    }
    beat();
    drawPanel();
  }

  function send(){
    var t = el("chatsay"); if (!t || sending) return;
    var text = t.value.trim();
    if (!text && !shot) return;
    sending = true; lastErr = "";
    var btn = el("chatsend"); if (btn) btn.disabled = true;
    var w = whereNow();
    post({ action:"say", body:text, shot:shot, page:w.page, target:w.target,
           cycle:w.cycle, build:w.build }, function(err, j){
      sending = false;
      if (btn) btn.disabled = false;
      if (err) {
        /* THE TYPED MESSAGE IS NOT THROWN AWAY ON A FAILURE. It is the one
           thing here nobody can get back, and a chat that eats what you wrote
           because the network blinked is a chat nobody uses twice. */
        lastErr = err === "failed" ? "That did not send. Try again." : err;
        drawPanel();
        return;
      }
      t.value = ""; t.style.height = "";
      shot = null;
      var f = el("chatfile"); if (f) f.value = "";
      state.messages = (j && j.messages) || state.messages;
      state.thread = (j && j.thread) || state.thread;
      state.unread = 0;
      drawPanel();
      var body = el("chatbody"); if (body) body.scrollTop = body.scrollHeight;
    });
  }

  function takePicture(file){
    if (!file) return;
    lastErr = "";
    /* §50's intake exactly: shrunk to 1600px and encoded both ways with the
       smaller kept, because a screenshot and a photograph want opposite
       formats and the file's own type predicts neither. */
    picIntake(file).then(function(data){
      shot = data; drawPanel();
    }, function(e){
      lastErr = (e && e.message) ? ("That picture could not be used — " + e.message + ".")
                                 : "That picture could not be used.";
      drawPanel();
    });
  }

  function mount(){
    if (mounted || !servable()) return;
    if (!document.body) return;
    mounted = true;
    var dock = document.createElement("div");
    dock.className = "chatdock";
    dock.id = "chatdock";
    dock.hidden = true;           /* until the server says there is somebody here */
    dock.innerHTML = dockHtml();
    document.body.appendChild(dock);

    el("chatbtn").addEventListener("click", function(){ setOpen(!open); });
    el("chatclose").addEventListener("click", function(){ setOpen(false); });
    el("chatsend").addEventListener("click", send);
    el("chatpic").addEventListener("click", function(){ el("chatfile").click(); });
    el("chatfile").addEventListener("change", function(){ takePicture(this.files && this.files[0]); });
    var say = el("chatsay");
    say.addEventListener("keydown", function(e){
      /* Enter sends, Shift+Enter makes a line — what every chat does, and the
         composer is a textarea precisely so the second one is possible. */
      if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(); }
      if (e.key === "Escape") setOpen(false);
    });
    say.addEventListener("input", function(){
      this.style.height = "auto";
      this.style.height = Math.min(120, this.scrollHeight) + "px";
    });
    /* Coming back to the tab is the moment a badge is most likely to be
       wrong, and the cheapest time to ask. */
    window.addEventListener("focus", function(){ if (mounted) poll(); });
    poll();
    beat();
  }

  /* ══ THE OFFICE'S INBOX ═════════════════════════════════════════════════
     A Setup page, so it is drawn by paint() like every other — but ONLY the
     empty frame is. Everything inside it is filled by this file, on its own
     clock, writing into two nodes. That is what lets the reply box survive a
     message arriving while somebody is typing into it. */

  function renderInbox(){
    return '' +
      '<div class="chinbox" id="chinbox">' +
        '<div class="chq">' +
          '<div class="chqtop">' +
            '<input type="search" id="chqfind" placeholder="Search a name or a word…" ' +
              'aria-label="Search the conversations">' +
          "</div>" +
          /* THREE FILTERS OVER ONE LIST, never three kinds of list. Flagged is
             a conversation carrying a flagged message, so the row a person
             clicks is the same row wherever they found it. */
          '<div class="chqtabs" id="chqtabs" role="tablist">' +
            '<button class="chqtab on" type="button" data-chtab="waiting" role="tab">' +
              'Waiting <span data-chn="waiting">0</span></button>' +
            '<button class="chqtab" type="button" data-chtab="all" role="tab">All</button>' +
            '<button class="chqtab" type="button" data-chtab="flagged" role="tab">' +
              'Flagged <span data-chn="flagged">0</span></button>' +
          "</div>" +
          '<div class="chqlist" id="chqlist"></div>' +
        "</div>" +
        '<div class="chthread" id="chthread"></div>' +
      "</div>";
  }

  function boxRows(){
    var q = box.q.toLowerCase();
    return (box.threads || []).filter(function(t){
      if (box.tab === "waiting" && !t.waiting) return false;
      if (box.tab === "flagged" && !(+t.flagged > 0)) return false;
      if (!q) return true;
      return String(t.live_name || t.person_name || "").toLowerCase().indexOf(q) > -1 ||
             String(t.last_body || "").toLowerCase().indexOf(q) > -1;
    });
  }

  function placeOf(t){
    var bits = [];
    if (t.unit_key && typeof placeLabel === "function") bits.push(placeLabel(t.unit_key));
    else if (t.fn_key && typeof placeLabel === "function") bits.push(placeLabel("fn:" + t.fn_key));
    if (t.title) bits.push(t.title);
    if (t.gone) bits.push("no longer on the register");
    return bits.filter(Boolean).join(" · ");
  }

  function drawQueue(){
    var list = el("chqlist"); if (!list) return;
    var rows = boxRows();
    if (!rows.length) {
      list.innerHTML = '<div class="chnothing">' +
        (box.q ? "Nothing matches that."
               : box.tab === "waiting" ? "Nobody is waiting. That is the good state."
               : "No conversations yet.") + "</div>";
      return;
    }
    var out = [], group = null;
    rows.forEach(function(t){
      var g = t.waiting ? "Waiting on us" : "Answered";
      if (g !== group) { group = g; out.push('<div class="chqsep">' + g + "</div>"); }
      var last = (t.last_from_office ? ((t.last_by || "Office") + ": ") : "") + (t.last_body || "");
      out.push('<button class="chqrow' + (box.person === t.person_key ? " on" : "") + '" ' +
        'type="button" data-chpick="' + esc2(t.person_key) + '">' +
        '<span class="chnm">' + esc2(t.live_name || t.person_name || t.person_key) + "</span>" +
        '<span class="chtm">' + esc2(when(t.last_at)) + "</span>" +
        '<span class="chsn">' + esc2(last) + "</span>" +
        (+t.unread > 0 ? '<span class="chun">' + (+t.unread) + "</span>" : "") +
        '<span class="chwh">' + esc2(placeOf(t)) + "</span>" +
      "</button>");
    });
    list.innerHTML = out.join("");
  }

  /* WHAT WILL HAPPEN WHEN SEND IS PRESSED, SAID BEFORE IT IS PRESSED. The
     server makes the same call again when the reply lands (§95.5) — this line
     is the office being shown the rule, never the rule itself. */
  function presenceHtml(d){
    var name = String(d.name || "They").split(/\s+/)[0];
    if (d.here) {
      return '<div class="chpres">' + ICON_CLOCK + " " + esc2(name) +
        " has the platform open — they will see this straight away, so no email will be sent.</div>";
    }
    if (!d.address) {
      return '<div class="chpres none">' + ICON_CLOCK + " " + esc2(name) +
        " is away and has no address on the register, so this waits in the platform for them.</div>";
    }
    if (!d.mail) {
      return '<div class="chpres none">' + ICON_CLOCK + " " + esc2(name) +
        " is away, and no mail is configured on this deployment — this waits in the platform.</div>";
    }
    return '<div class="chpres away">' + ICON_CLOCK + " " + esc2(name) + " was last here " +
      esc2(d.hereAt ? ago(d.hereAt) : "a while ago") +
      " — this will also go to " + esc2(d.address) + ".</div>";
  }

  function drawThread(){
    var pane = el("chthread"); if (!pane) return;
    var d = box.data;
    if (!d) {
      pane.innerHTML = '<div class="chnothing">Pick somebody on the left to read what they ' +
        "wrote and answer them.</div>";
      return;
    }
    /* THE REPLY BOX IS ONLY REBUILT WHEN THE PERSON CHANGES. Redrawing it on
       every four-second poll would wipe a half-written answer — the exact
       fault §71.2 was raised about, one surface further out. */
    var existing = pane.querySelector("[data-chreply]");
    var keep = existing && existing.dataset.chreply === d.person ? existing.value : null;

    var body = pane.querySelector("#chtbody");
    var atEnd = body ? (body.scrollHeight - body.scrollTop - body.clientHeight < 40) : true;

    pane.innerHTML =
      '<div class="chthead">' +
        "<div><div class=\"chnm\">" + esc2(d.name || d.person) + "</div>" +
        '<div class="chmeta">' + esc2([placeOf(d), d.address].filter(Boolean).join(" · ")) + "</div></div>" +
        '<div class="chacts">' +
          '<button class="chmini" type="button" data-chdone="' + esc2(d.person) + '">' +
            (d.waiting ? "Mark answered" : "Put back on the list") + "</button>" +
        "</div>" +
      "</div>" +
      '<div class="chtbody" id="chtbody">' + threadHtml(d.messages || [], true, true) + "</div>" +
      '<div class="chtfoot">' + presenceHtml(d) +
        '<div class="chcomp">' +
          '<textarea rows="1" data-chreply="' + esc2(d.person) + '" ' +
            'placeholder="Reply to ' + esc2(String(d.name || "them").split(/\s+/)[0]) + '…" ' +
            'aria-label="Your reply"></textarea>' +
          '<button class="chsend" data-chreplysend="' + esc2(d.person) + '" type="button">Send</button>' +
        "</div>" +
        '<div class="chnote' + (box.note && box.note.bad ? " bad" : "") + '" id="chreplynote">' +
          esc2(box.note ? box.note.text : "") + "</div>" +
      "</div>";

    var ta = pane.querySelector("[data-chreply]");
    if (ta && keep != null) ta.value = keep;
    var nb = el("chtbody");
    if (nb && atEnd) nb.scrollTop = nb.scrollHeight;
  }

  function boxLoadQueue(then){
    post({ action:"queue" }, function(err, j){
      if (err || !j) return;
      box.threads = j.threads || [];
      drawQueue();
      ["waiting", "flagged"].forEach(function(k){
        var n = document.querySelector('[data-chn="' + k + '"]');
        if (n) n.textContent = String(j[k] || 0);
      });
      if (then) then();
    });
  }
  function boxLoadThread(who, then){
    post({ action:"thread", person:who }, function(err, j){
      if (err || !j) return;
      box.data = j; drawThread();
      if (then) then();
    });
  }

  function boxBeat(){
    if (box.timer) clearInterval(box.timer);
    box.timer = setInterval(function(){
      /* THE PAGE IS GONE, SO THE CLOCK STOPS. Nothing tells this file that
         somebody navigated away — asking the document whether its own node is
         still there is the one test that cannot go stale (§24). */
      if (!el("chinbox")) { clearInterval(box.timer); box.timer = null; return; }
      boxLoadQueue();
      if (box.person) boxLoadThread(box.person);
    }, 10000);
  }

  function replySend(who){
    var pane = el("chthread"); if (!pane) return;
    var ta = pane.querySelector("[data-chreply]");
    var note = el("chreplynote");
    var text = ta ? ta.value.trim() : "";
    if (!text) return;
    var btn = pane.querySelector("[data-chreplysend]");
    if (btn) btn.disabled = true;
    box.note = { text: "Sending…" };
    if (note) { note.className = "chnote"; note.textContent = box.note.text; }

    /* THE HTML IS BUILT HERE, BY THE ONE BUILDER (§72.3), and the server
       decides whether to actually send it and to WHOM — the browser sends
       content, never a recipient (§74.2). */
    var body = { action:"reply", person:who, body:text };
    try {
      var sh = commsShape(), c = comms();
      body.fromName = c.fromName || sh.org;
      body.replyTo = c.replyTo || "";
      body.subject = "A reply from the Strategy Office";
      body.html = MAIL.html({
        org: sh.org, accent: sh.accent, panel: sh.panel, footer: sh.footer, eyebrow: sh.eyebrow,
        title: "The Strategy Office replied",
        preheader: text.slice(0, 140),
        body: text + "\n\nOpen the platform to answer.",
        cta: { label: "Open the platform", href: location.origin + location.pathname }
      });
    } catch (e) { /* No mail builder here is not a reason to refuse the reply. */ }

    post(body, function(err, j){
      if (btn) btn.disabled = false;
      if (err) {
        box.note = { text: err, bad: true };
        if (note) { note.className = "chnote bad"; note.textContent = err; }
        return;
      }
      if (ta) { ta.value = ""; ta.style.height = ""; }
      /* THE FOUR REAL OUTCOMES, SAID PLAINLY (§63's rule for Save draft). A
         reply that landed and an email that did not are two different pieces
         of news and the office needs both. Written to `box.note` FIRST: the
         two loads below redraw this pane, and a sentence that only exists in
         the DOM is a sentence the refresh destroys. */
      box.note = { text:
        j && j.here ? "Sent. They are on the platform and will see it now."
        : j && j.mailed && j.mailed.sent ? "Sent, and emailed to " + j.mailed.to + "."
        : j && j.mailed && j.mailed.why ? "Sent. No email went out — " + j.mailed.why + "."
        : "Sent." };
      boxLoadQueue();
      boxLoadThread(who);
    });
  }

  /* Called at the end of paint(), beside SEARCHSEL.wire(). Everything is bound
     on the CONTAINER rather than on each row, because the rows are rewritten
     every ten seconds and a handler bound to one would go with it (§24). */
  function wireInbox(){
    var root = el("chinbox");
    if (!root) { if (box.timer) { clearInterval(box.timer); box.timer = null; } return; }
    if (root.dataset.chwired) return;
    root.dataset.chwired = "1";

    root.addEventListener("click", function(e){
      var pick = e.target.closest("[data-chpick]");
      if (pick) {
        box.person = pick.dataset.chpick; box.note = null;
        drawQueue(); boxLoadThread(box.person); return;
      }

      var done = e.target.closest("[data-chdone]");
      if (done) {
        var was = box.data && box.data.waiting;
        post({ action:"answered", person:done.dataset.chdone, waiting: !was }, function(){
          boxLoadQueue(); boxLoadThread(done.dataset.chdone);
        });
        return;
      }
      var sendb = e.target.closest("[data-chreplysend]");
      if (sendb) { replySend(sendb.dataset.chreplysend); return; }

      var fl = e.target.closest("[data-chflag]");
      if (fl) {
        /* Three flags and off, cycled from one button: this is a shelf the
           office sorts its own work on, not a taxonomy anybody has to learn. */
        var order = ["", "issue", "idea", "question"];
        var next = order[(order.indexOf(fl.dataset.chflagged || "") + 1) % order.length];
        post({ action:"flag", id:+fl.dataset.chflag, flag: next || null }, function(){
          /* THE QUEUE IS RELOADED TOO, not only the thread. Flagged is a
             filter over the SAME list and it counts flags per conversation —
             refreshing one side leaves the other showing a count that was
             true a moment ago, which is the quietest kind of wrong. */
          boxLoadQueue();
          if (box.person) boxLoadThread(box.person);
        });
        return;
      }
      var tab = e.target.closest("[data-chtab]");
      if (tab) {
        box.tab = tab.dataset.chtab;
        Array.prototype.forEach.call(root.querySelectorAll("[data-chtab]"), function(b){
          b.classList.toggle("on", b === tab);
          b.setAttribute("aria-selected", b === tab ? "true" : "false");
        });
        drawQueue();
        return;
      }
      var sh = e.target.closest("[data-chshot]");
      if (sh) {
        post({ action:"shot", id:+sh.dataset.chshot }, function(err, j){
          if (err || !j || !j.shot) return;
          openModalHtml("Screenshot", "", '<img class="chshotfull" alt="Screenshot" src="' +
            esc2(j.shot) + '">');
        });
        return;
      }
    });

    root.addEventListener("keydown", function(e){
      var ta = e.target.closest("[data-chreply]");
      if (ta && e.key === "Enter" && !e.shiftKey) { e.preventDefault(); replySend(ta.dataset.chreply); }
    });
    /* TYPING NEVER REPAINTS (§35). The search hides rows in place by rebuilding
       the LIST, never the page, and the box being typed into is outside it. */
    var find = el("chqfind");
    if (find) find.addEventListener("input", function(){ box.q = this.value; drawQueue(); });

    drawQueue();
    drawThread();
    boxLoadQueue(function(){
      if (!box.person) {
        var first = boxRows()[0];
        if (first) { box.person = first.person_key; drawQueue(); boxLoadThread(box.person); }
      } else boxLoadThread(box.person);
    });
    boxBeat();
  }

  /* The person's own panel, opened from anywhere — the office uses it too, so
     somebody in the office writing to the office is not a special case. */
  return {
    /* Whether there is a server behind this page at all — asked by the Setup
       page's `when`, so the office is never offered an inbox it could not
       answer anybody from (§16.7: a control that cannot work is worse than no
       control). Same test mount() uses, named once. */
    servable: servable,
    mount: mount,
    renderInbox: renderInbox,
    wireInbox: wireInbox,
    open: function(){ setOpen(true); },
    unread: function(){ return state.unread; }
  };
})();
