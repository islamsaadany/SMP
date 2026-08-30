/* ══ TALKING TO THE STRATEGY OFFICE (§97) ═══════════════════════════════════
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
     is the whole of the presence test the email rule reads (§97.5) — so the
     slow one also has to be fast enough that "away" means away. */
  /* Open, this is `cfg.beat` — the office's own Live/Relaxed setting, decided
     by SMPRules.chatBeat() so the switch and the number cannot drift (§98).
     Shut, the only thing that can change is a number on a badge, so three
     minutes is plenty: at 60s a single tab left open overnight was eight
     hundred requests for nothing (§98.1). */
  var POLL_SHUT = 180000;
  /* AND A THIRD CADENCE, FOR THE ONE STATE THAT NEEDS IT (§99). Somebody who
     has asked something and not been answered is WAITING — they are the only
     person for whom a badge arriving three minutes late is a badge arriving
     too late. 180s is right for a corner nobody is expecting anything from
     and wrong for that person, so while their conversation is outstanding the
     shut panel asks every 15 seconds instead.

     It costs nothing in the ordinary case, which is the whole point: it is on
     only between asking and being answered, and it goes back to 180s the
     moment the office replies. */
  var POLL_WAIT = 15000;
  var PIC_EDGE = 1600;

  /* What the server last told us the office has set. Started from the shared
     defaults so the first paint is not a guess, and replaced by the answer —
     never invented here, or the two sides would decide it separately (§42). */
  var cfg = SMPRules.chatCfg(null);
  cfg.beat = SMPRules.chatBeat(null);

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
    /* ── AND A REQUEST THAT NEVER ANSWERS MUST STILL ANSWER (§193) ─────
       Islam: *"the messages are sent in the box but still there is
       sending.."* — with the reply plainly THERE in the thread above it. The
       message reached the database and the request never came back, so
       `done` was never called and the word *Sending…* stood for ever. There
       was no timeout here at all: every caller waited on a promise that had
       stopped being about anything.

       ONE PLACE, because that is this function's whole reason for existing —
       the comment above says so about `servable()` and the same argument
       covers this. A timeout is not a failure and is not said as one: the
       reply may well have gone, and the thread underneath is the evidence
       (`replySend` reads it). */
    var ctl = typeof AbortController === "function" ? new AbortController() : null;
    var late = setTimeout(function(){ if (ctl) ctl.abort(); }, POST_WAIT);
    var answered = false;
    var finish = function(err, j){
      if (answered) return;
      answered = true;
      clearTimeout(late);
      done(err, j);
    };
    fetch("/api/chat", { method:"POST", cache:"no-store",
                         headers:{ "Content-Type":"application/json" },
                         body: JSON.stringify(body),
                         signal: ctl ? ctl.signal : undefined })
      .then(function(r){ return r.json().then(function(j){ j.__status = r.status; return j; }); })
      .then(function(j){ finish(j && j.ok ? null : ((j && j.error) || "failed"), j); })
      /* A NETWORK FAILURE SPEAKS THE PRODUCT'S LANGUAGE, not the browser's
         (§139): "Failed to fetch" is what fetch() says, and it reached the
         screen verbatim through the send path's rollback note. Every caller
         already handles the sentinel "failed" as "say it did not send". */
      /* AN ABORT IS OUR OWN CLOCK, NOT THE NETWORK'S — said as what it is,
         because "it did not send" and "we do not know" send somebody to two
         different places (§123's rule, one surface in). */
      .catch(function(e){
        finish(e && e.name === "AbortError" ? NO_ANSWER : "failed", null); });
  }
  /* Long enough that a slow send is not called dead — the server stores the
     message and then tries to email, and the email is the slow half — and
     short enough that nobody sits looking at a word that has stopped being
     true. Vercel cuts a function off before this, so reaching it means the
     answer is not coming. */
  var POST_WAIT = 25000;
  var NO_ANSWER = "no answer";

  /* WHERE SOMEBODY WAS USED TO BE CAPTURED AND SENT WITH EVERY MESSAGE — the
     page, the subject, the cycle and the build, drawn under the sender's own
     words (§97.4). Islam, looking at it on a real message: *"the line in front
     of the chat shouldn't be there"*, and, asked how far it should go, chose
     GONE EVERYWHERE rather than merely hidden from the sender.

     So `whereNow()` and `navWord()` are gone with it, and §24's rule is why
     they are gone rather than left unused: a helper nobody calls is one the
     next person reads as load-bearing. `BUILD_ID` and the build-time stamp
     that produced it go too — they existed for this line and nothing else. */

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
    /* A HANDOFF IS NARRATED, NOT SPOKEN (§125). It is not the office's answer
       and it is not the assistant's either — it is the product saying what
       happened, so it wears no name, no time and no bubble, and reads as the
       quiet line it is. The office sees the same line in the thread, which is
       the point: it says the assistant looked before this reached them.

       NO WAY OUT ON IT (spec 016 §4.3). That button exists for a confident
       WRONG answer, where the conversation has already left the queue and the
       person would otherwise be stranded. Here the conversation is still
       waiting and somebody is already coming — a control that asks for what is
       happening anyway is worse than no control (§62, §110). */
    if (m.handoff) {
      return '<div class="chsys">' + esc2(m.body) + "</div>";
    }
    var mine = mineIsOffice ? m.from_office : !m.from_office;
    /* AN ASSISTANT'S ANSWER NEVER WEARS A COLLEAGUE'S NAME (§104). This
       product spends a great deal of care on who is authorised to say what —
       §31 closed a plan to the person measured against it, §94 closed the
       strategy tab to the office — and an automated answer signed "Strategy
       Office" is a ruling as far as the reader is concerned. It is from the
       office (that is whose side of the conversation it is on) and it says
       plainly that a machine wrote it. */
    /* §181: THE NAME, NOT THE FULL NAME. A conversation is the one place a
       person is addressed rather than listed, and it was printing "Islam Adel
       Nabil Mohamed" on every line — twice over on the office's side, where
       the sender's name sits beside "Strategy Office". `nameOf()` is the
       register's own answer, with the shared name rule behind it for somebody
       the register no longer holds. */
    var who = m.bot ? "Assistant · answered from the knowledge base"
            : m.from_office ? ((nameOf(m.by_key, m.by_name) || "The office") + " · Strategy Office")
                            : (mineIsOffice ? nameOf(m.by_key, m.by_name) : "You");
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
    /* THE WAY OUT (spec 016 §4.3). The assistant KNOWING it cannot answer is
       handled on the server; this is for the harder case — it answered, and it
       was wrong. Without it a confident wrong answer is a dead end, because an
       answered conversation has already left the office's queue.

       Only on the reader's own side, and only on the last thing said: an
       escape hatch under every historical answer is clutter, and the office
       does not need one at all. */
    var out = "";
    if (m.bot && !mineIsOffice && m.last) {
      out = '<button class="chout" type="button" data-chhuman="1">' +
            "This didn\u2019t answer it \u2014 send it to the office</button>";
    }
    /* ── AND WHETHER IT LEFT THE PLATFORM (§188) ──────────────────────
       Islam: *"if the previous message was sent by email let's add a tag to
       it that it was sent by email as well."* The chase has existed since
       §97.5 and was reported to the browser once, under the composer, and
       written down nowhere — so a thread read the next morning could not say
       which of its replies had actually gone out.

       ON THE BYLINE, not in the bubble: the bubble is what was SAID and this
       is a fact about how it travelled. A mark rather than a sentence, with
       the address on the hover — the office knows what "emailed" means and
       does not need the line repeated on every reply (§41's budget).

       NULL IS "IT DID NOT LEAVE", which is what every message before today
       honestly is: nothing was recorded, so nothing is claimed. */
    var went = m.emailed_to
      ? '<span class="chmail" title="Also emailed to ' + esc2(m.emailed_to) + '">' +
        '<svg viewBox="0 0 16 16" aria-hidden="true" fill="none" stroke="currentColor" ' +
        'stroke-width="1.5" stroke-linejoin="round">' +
        '<rect x="1.5" y="3.5" width="13" height="9" rx="1.5"/>' +
        '<path d="m2 4.5 6 4 6-4"/></svg>Emailed</span>'
      : "";
    return '<div class="chmsg ' + (mine ? "chme" : "chthem") + (m.bot ? " chbot" : "") + '">' +
      '<div class="chwho"><span>' + esc2(who) + "</span><span>" + esc2(when(m.at)) + "</span>" +
      went + flag + "</div>" +
      '<div class="chbod">' + esc2(m.body) + pic + "</div>" + out + "</div>";
  }

  function threadHtml(msgs, mineIsOffice, showFlag){
    if (!msgs.length) return "";
    var out = [], day = "";
    msgs.forEach(function(m, i){
      var d = dayOf(m.at);
      if (d !== day) { day = d; out.push('<div class="chatday">' + esc2(d) + "</div>"); }
      /* WHICH ONE IS LAST is decided here, where the list is, rather than by
         msgHtml comparing ids it cannot see the rest of. */
      m.last = (i === msgs.length - 1);
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
          /* A MINUS, NOT A CROSS (Islam: "it need to be a minimize button as
             there is no closing actually"). Nothing is closed by pressing it —
             the conversation is permanent, one per person, and it is the same
             one next time. A × promises an end to something that has none, and
             on a chat it reads as "discard this". */
          '<button class="chx" id="chatclose" type="button" title="Minimise" ' +
            'aria-label="Minimise this conversation">' +
            '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" ' +
            'stroke-linecap="round" aria-hidden="true"><path d="M6 12h12"/></svg></button>' +
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
          '<div class="chnote" id="chatnote"></div>' +
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
      body.innerHTML = threadHtml(state.messages, false, false) +
        /* WHILE THE SERVER WORKS, THE SCREEN SAYS SO (§139) — the same quiet
           narrated register as the handoff line (§125): not a message, the
           product saying what is happening. Only with the assistant on;
           without it a send is near-instant and the line would only flash. */
        (sending && chatCfg().assistant
          ? '<div class="chsys chwait">Asking the assistant\u2026</div>' : "");
    }
    if (atEnd) body.scrollTop = body.scrollHeight;

    var sub = el("chatsub");
    if (sub) {
      /* THE DOT CARRIES THE STATUS AND THE WORDS CARRY THE PROMISE. It used
         to be either/or — "With the office" while something was outstanding,
         the promise otherwise — which hid the promise at the one moment
         somebody actually wants it, which is while they are waiting. Two
         facts, two channels; the office's sentence is always on screen (§98).
         The words are `chatCfg`'s choice, so there is no second fallback here
         to disagree with it. */
      var waiting = state.messages.length && state.thread && state.thread.waiting;
      sub.innerHTML = '<span class="chatdot"' +
        (waiting ? ' style="background:var(--attn)"' : '') + '></span> ' +
        esc2(cfg.promise);
    }
    var n = el("chatn");
    if (n) {
      if (state.unread > 0 && !open) { n.hidden = false; n.textContent = String(state.unread); }
      else n.hidden = true;
    }
    var pic = el("chatpic");
    if (pic) pic.hidden = !cfg.shots;
    var note = el("chatnote");
    if (note) {
      note.className = "chnote" + (lastErr ? " bad" : "");
      /* EMPTY WHEN THERE IS NOTHING TO SAY. It used to carry "the page you are
         on is sent with your message", which stopped being true the moment
         that stopped happening — and a sentence that is merely stale is worse
         than no sentence, because somebody believes it. */
      note.textContent = lastErr ? lastErr
        : shot ? "A screenshot is attached. It is sent with your next message."
        : "";
    }
  }

  function poll(){
    if (!servable()) return;
    /* NEVER OVER A SEND IN FLIGHT (§139). The echo is on screen and the
       server's answer to `say` is what replaces it; a poll racing that
       round-trip can come back WITHOUT the just-sent message (the insert is
       inside the very request still running) and would erase the echo — a
       message vanishing off the screen mid-send, which is worse than the
       glitch this fixes. One beat later the poll runs as normal. */
    if (sending) return;
    post({ action:"mine" }, function(err, j){
      if (!err && j) {
        /* ASKED BEFORE ANYTHING IS OVERWRITTEN, and the first version of this
           got it wrong in the quietest possible way: it compared the new count
           against `state.unread` three lines AFTER assigning the new count to
           `state.unread`, so the two were always equal and a reply could never
           announce itself. It read correctly and could not fire. Found by the
           check, which is the only thing that would have.

           "A reply just landed" is the only moment there is anything to
           announce — a badge that was already there must not re-announce
           itself every four seconds. */
        var arrived = loaded && (j.unread || 0) > state.unread;
        var wasWaiting = expecting();

        state.messages = j.messages || [];
        state.unread = j.unread || 0;
        state.thread = j.thread || null;
        state.office = !!j.office;
        loaded = true;
        /* THE SETTINGS ARRIVE WITH THE ANSWER, so a switch the office flips
           reaches every open browser within one beat. If the cadence changed,
           the clock is reset — not on the next open, which could be tomorrow. */
        if (j.chat) {
          var wasBeat = cfg.beat;
          cfg = j.chat;
          if (cfg.beat !== wasBeat) beat();
        }
        var dock = el("chatdock");
        /* OFF MEANS GONE (§98.2). Not disabled, not explaining itself — the
           corner is simply not there, and nothing polls, which is the whole
           saving. The panel is closed with it, or somebody reading a
           conversation when the office switched it off would keep the box. */
        if (dock) dock.hidden = !cfg.on;
        if (!cfg.on && open) setOpen(false);
        drawPanel();
        if (arrived && !open) announce();
        /* The clock changes with the state, not only with the panel: somebody
           who has just been answered stops expecting and goes back to 180s. */
        if (wasWaiting !== expecting()) beat();
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

  /* Waiting on the office, or holding a reply nobody has read yet. */
  function expecting(){
    return !!(state.unread > 0 || (state.thread && state.thread.waiting));
  }
  function stop(){ if (timer) { clearInterval(timer); timer = null; } }
  function beat(){
    stop();
    /* NOTHING RUNS WHILE THE TAB IS HIDDEN (§98.1). Browsers already throttle
       a background timer to about once a minute; this takes it to nothing at
       all, which is what lets the database go to sleep overnight instead of
       being woken by a tab somebody forgot on Friday. `visibilitychange`
       starts it again, and the poll it fires on the way back is what makes
       the badge right before anybody has looked at it. */
    if (document.hidden) return;
    timer = setInterval(poll, open ? (cfg.beat || 4000) : (expecting() ? POLL_WAIT : POLL_SHUT));
  }

  /* ONE SHOT, AND THE CLASS IS TAKEN OFF AGAIN so the next reply can announce
     itself too. Everything about it is in CSS, including the respect for
     `prefers-reduced-motion` — a corner that jumps at somebody who has asked
     not to be jumped at is worse than a silent badge. */
  function announce(){
    var b = el("chatbtn");
    if (!b) return;
    b.classList.remove("chring");
    void b.offsetWidth;              /* restart the animation, not queue it */
    b.classList.add("chring");
    setTimeout(function(){ b.classList.remove("chring"); }, 2600);
  }

  function setOpen(v){
    open = !!v;
    var p = el("chatpanel"); if (p) p.hidden = !open;
    /* THE BUBBLE IS NOT DRAWN WHILE THE PANEL IS OPEN (§100.4). It used to sit
       underneath, which pushed the panel 60px off the bottom of the window and
       left a control on screen whose only job is to open what is already open.
       Hiding it puts the panel where the bubble was — at the bottom, which is
       where somebody just clicked. A class, so the rule is one line of CSS and
       the mobile layout inherits it. */
    var dock = el("chatdock");
    if (dock) dock.classList.toggle("chopen", open);
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

  /* THE SCREEN SAYS WHAT IS HAPPENING WHILE THE SERVER WORKS (§139). With
     the assistant on, `say` holds the response open for the whole model
     round-trip — a few seconds — and the typed message used to sit in the box
     the entire time, looking exactly like a send that had not worked (Islam:
     "looked as a glitch at the start"). So the message moves into the thread
     THE MOMENT Send is pressed, the box empties, and a quiet line says the
     assistant is being asked; when the server answers, its truth replaces the
     echo wholesale, so nothing here can drift from what was actually stored.

     THE ECHO IS NEVER TRUSTED PAST THE ROUND-TRIP: on ANY failure the echo is
     rolled back and the words go BACK INTO THE BOX — the one thing nobody can
     get back is what they typed, and a chat that eats it because the network
     blinked is a chat nobody uses twice (that rule survives from the version
     this replaces; it now restores rather than merely not-clearing). */
  function send(){
    var t = el("chatsay"); if (!t || sending) return;
    var text = t.value.trim();
    if (!text && !shot) return;
    sending = true; lastErr = "";
    var btn = el("chatsend"); if (btn) btn.disabled = true;
    var hadShot = shot;
    var wasMsgs = state.messages;
    state.messages = state.messages.concat([{
      id: "echo", at: new Date().toISOString(), from_office: false,
      by_key: "", by_name: "", body: text, flag: null,
      has_shot: !!shot, echo: true
    }]);
    t.value = ""; t.style.height = "";
    shot = null;
    var f0 = el("chatfile"); if (f0) f0.value = "";
    drawPanel();
    var body0 = el("chatbody"); if (body0) body0.scrollTop = body0.scrollHeight;
    post({ action:"say", body:text, shot:hadShot }, function(err, j){
      sending = false;
      if (btn) btn.disabled = false;
      if (err) {
        state.messages = wasMsgs;
        t.value = text; shot = hadShot;
        lastErr = err === "failed" ? "That did not send. Try again." : err;
        drawPanel();
        return;
      }
      state.messages = (j && j.messages) || wasMsgs;
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
    /* DELEGATED, because the message it sits on is redrawn by every poll — a
       handler bound to the button itself would be destroyed four seconds after
       it appeared (§24: whoever rewrites the DOM re-wires it, and the cheapest
       way to obey that is not to bind to the thing being rewritten). */
    el("chatbody").addEventListener("click", function(e){
      var b = e.target.closest && e.target.closest("[data-chhuman]");
      if (!b) return;
      b.disabled = true;
      /* IT IS AN ORDINARY MESSAGE, deliberately — not a new endpoint and not a
         flag on the thread. Saying so in words is what puts the conversation
         back in the office's queue, and it leaves the office reading WHY the
         answer was wrong rather than a bare marker. The server's own rule
         (spec 016 §4.3) sends a request for a person straight to a handoff, so
         this cannot be answered by the assistant a second time. */
      post({ action:"say", body:"That didn\u2019t answer it \u2014 could someone from " +
             "the office look at this?" }, function(err, j){
        if (err || !j) { b.disabled = false; lastErr = "That did not send. Try again."; drawPanel(); return; }
        state.messages = j.messages || state.messages;
        state.thread = j.thread || state.thread;
        drawPanel();
      });
    });
    el("chatpic").addEventListener("click", function(){ el("chatfile").click(); });
    el("chatfile").addEventListener("change", function(){ takePicture(this.files && this.files[0]); });
    var say = el("chatsay");
    say.addEventListener("keydown", function(e){
      /* Enter sends, Shift+Enter makes a line — what every chat does, and the
         composer is a textarea precisely so the second one is possible. */
      if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(); }
      if (e.key === "Escape") setOpen(false);
    });
    say.addEventListener("input", chGrow);
    /* Coming back to the tab is the moment a badge is most likely to be
       wrong, and the cheapest time to ask. `visibilitychange` is the one that
       matters — `focus` alone does not fire when a background tab is brought
       forward in some browsers, and it is the hidden case the clock stops
       for (§98.1). */
    /* ── CLICKING AWAY MINIMISES IT (§100.4) ────────────────────────
       Islam: "if I click outside the box minimize it please." Nothing is lost
       by it — the panel is hidden rather than rebuilt, so a half-typed message
       is still in the box when it comes back, which is what makes dismissing
       it this cheaply safe.

       CAPTURE PHASE, so a control that stops propagation cannot leave the
       panel open behind whatever it just did; `pointerdown` rather than
       `click`, so it goes away as the press lands rather than on release.

       TWO THINGS ARE NOT "OUTSIDE": the dock itself, and an open modal — a
       screenshot opened FROM the panel renders into the platform's own overlay,
       and closing the panel behind it would be dismissing the thing you are
       standing in. */
    document.addEventListener("pointerdown", function(e){
      if (!open) return;
      var t = e.target;
      if (t && t.closest && t.closest("#chatdock")) return;
      if (document.querySelector(".overlay.on")) return;
      setOpen(false);
    }, true);
    /* Escape, from anywhere — it was only wired inside the composer, so it did
       nothing once the focus had moved to the attach button or a message. */
    document.addEventListener("keydown", function(e){
      if (open && e.key === "Escape") setOpen(false);
    });
    window.addEventListener("focus", function(){ if (mounted && !document.hidden) poll(); });
    document.addEventListener("visibilitychange", function(){
      if (!mounted) return;
      if (document.hidden) { stop(); return; }
      poll(); beat();
    });
    poll();
    beat();
  }

  /* ══ THE OFFICE'S INBOX ═════════════════════════════════════════════════
     A Setup page, so it is drawn by paint() like every other — but ONLY the
     empty frame is. Everything inside it is filled by this file, on its own
     clock, writing into two nodes. That is what lets the reply box survive a
     message arriving while somebody is typing into it. */

  /* ── THE SETTINGS, IN A HEADER DROPDOWN (§98.2) ────────────────────────
     The shape §90 gave the register's own twice-a-year controls, for the same
     reason: these are touched about as often, and the queue is what the page
     is for — a settings block above the table would push the work down the
     screen every day to serve a decision made twice a year (§93.5).

     IT IS DRAWN AND RE-DRAWN BY THIS FILE, not by paint(). Opening a menu
     that rebuilt the page would throw away the thread the office is reading
     and the reply they are half way through typing — the rule this whole file
     is built around. */
  var SETMENU = false;

  /* SCHEDULE THE WRITE WITHOUT A REPAINT (§71.2). `fieldSaved()` in the shell
     does exactly this, but it is scoped inside wire() and not reachable from
     here — so this calls the same thing it calls, rather than a copy of it. */
  function saved(){
    if (typeof SYNC !== "undefined" && SYNC.afterPaint) SYNC.afterPaint();
  }

  function segHtml(key, off, on, val, lit){
    return '<span class="seg' + (lit ? " lit" : "") + '">' +
      '<button type="button" data-chset="' + key + '" data-chval="0" aria-pressed="' +
        (!val) + '">' + off + '</button>' +
      '<button type="button" data-chset="' + key + '" data-chval="1" aria-pressed="' +
        (!!val) + '">' + on + '</button></span>';
  }

  /* WHO THE HANDOFF REACHES. Only people who are in the office are offered —
     a representative outside it would be told a question is waiting on a page
     they cannot open (§61's shape). Read from the register, so a retired
     person stops being offered without anybody remembering to change it. */
  function officePeople(){
    return (typeof PEOPLE === "undefined" ? [] : PEOPLE).filter(function(p){
      return p.active !== false && SMPRules.isOfficeRole(String(p.role || ""));
    });
  }
  function repName(key){
    var p = officePeople().filter(function(x){ return x.key === key; })[0];
    return p ? (p.name || p.key) : key;
  }
  function repPicker(key){
    /* NOBODY SET IS AN OPTION, AND IT IS THE FIRST ONE. §35's rule: absent is
       not "none" — the row has to be able to say nobody was chosen, or the
       first name in the register becomes the default by accident. */
    var opts = ['<option value=""' + (key ? "" : " selected") + '>No one yet</option>'];
    officePeople().forEach(function(p){
      opts.push('<option value="' + esc2(p.key) + '"' + (p.key === key ? " selected" : "") +
                ">" + esc2(p.name || p.key) + "</option>");
    });
    return '<select data-chrep="1" aria-label="Who is told when a question needs a person">' +
           opts.join("") + "</select>";
  }

  /* The last test's result, held here rather than stored: it is a question
     about this moment ("is it working now"), and a stored answer would go
     stale in a way nobody could see (§35 — absent is not "none"). */
  var BOXTEST = { busy: false, steps: null };

  var TESTMARK = {
    ok:   '<span class="tdot ok" aria-hidden="true"></span>',
    warn: '<span class="tdot warn" aria-hidden="true"></span>',
    fail: '<span class="tdot bad" aria-hidden="true"></span>',
    off:  '<span class="tdot off" aria-hidden="true"></span>'
  };
  var TESTWORD = { ok: "working", warn: "check this", fail: "stopped here", off: "off" };

  /* ONLY THE FIRST LETTER (§124). This lowercased the whole name, so "The API
     key" became "the api key" in the one sentence somebody reads first. */
  function unCap(t){
    return /^The /.test(t) ? "the " + t.slice(4) : t;
  }

  function testHtml(steps){
    /* WHERE IT STOPS IS THE ANSWER, so the failing row is the loud one and
       everything above it is quiet confirmation that the chain got that far. */
    var bad = steps.filter(function(s){ return s.state === "fail"; })[0];
    var off = steps.filter(function(s){ return s.state === "off"; })[0];
    var head = bad ? "It is not working \u2014 " + unCap(bad.name)
             : off ? "It is switched off"
             : "It is working";
    return '<div class="chtest' + (bad ? " bad" : off ? " off" : " good") + '">' +
      '<div class="chtest-h">' + esc2(head) + "</div>" +
      steps.map(function(st){
        return '<div class="chtest-r">' +
          (TESTMARK[st.state] || TESTMARK.fail) +
          '<span class="chtest-n">' + esc2(st.name) + "</span>" +
          '<span class="chtest-s">' + esc2(st.word || TESTWORD[st.state] || st.state) + "</span>" +
          (st.detail ? '<div class="chtest-d">' + esc2(st.detail) + "</div>" : "") +
        "</div>";
      }).join("") + "</div>";
  }

  /* ── THE SETTINGS, IN THE ORDER SOMEBODY DECIDES THEM (§127) ────────
     Islam asked for the sequence, the titles and the explanations to be
     rethought, and settled it from a mockup made of this very panel.

     THE ORDER TODAY WAS NOT ONE. The master switch — the one that decides
     whether any of this exists at all — sat THIRD, underneath the assistant,
     which is a decision ABOUT the chat rather than one above it; and the two
     email settings sat five rows apart with three unrelated rows between them.
     It now runs one way, from "does this exist" down to "a tuning knob", so a
     reader never has to go back up:

         Chat · Promise · Screenshots      what it is, and what people get
         Assistant (+ Test)                who answers
         Handover email · Away email       how people are reached
         Reply checks                      how it runs

     THE TITLES ARE ONE OR TWO WORDS AND THE KEYS DO NOT MOVE (§30.2, §65,
     §108.3): renaming a stored key would reset the setting for every tenant
     that had ever touched it, for the sake of a word nobody reads.

     AND A STATUS IS NOT AN EXPLANATION. Every line of prose became a tooltip;
     "No one is set" did not, because it is a fact about right now rather than
     a description of how a setting works — behind a hover, somebody turns
     Handover email on, nobody is chosen, and nothing ever says so (§35, §45.2). */
  function setRow(key, label, tip, ctl, extra){
    return '<div class="chset-row"><div class="chset-lab">' + esc2(label) +
      tipHtml(tip) + (ctl ? '<span class="chset-ctl">' + ctl + '</span>' : '') +
      '</div>' + (extra || "") + '</div>';
  }

  /* THE PLATFORM'S OWN HOVER NOTE, not a second one (§53.5). `.tip` is the
     14px mark used all over the product — display:none rather than opacity:0,
     for the reason §27.2 records at length — and the only thing added here is
     that a TAP opens it, because hover does not exist on a tablet and these
     notes now carry the whole explanation rather than decorating it.

     A <button>, so a tap gives it focus and a keyboard reaches it without a
     tabindex of its own; `.on` is what the tap toggles, beside the :hover and
     :focus the rest of the platform already uses. */
  function tipHtml(t){
    return ' <button type="button" class="tip" data-chtip="1" data-tip="' + esc2(t) +
           '" aria-label="' + esc2(t) + '">i</button>';
  }

  function settingsHtml(){
    var c = chatCfg();
    if (!SETMENU) {
      return '<span class="hmenu"><button class="hmenu-btn" data-chsetmenu="1" ' +
        'aria-haspopup="true" aria-expanded="false">Settings ' +
        '<span class="hcar">&#9662;</span></button></span>';
    }
    return '<span class="hmenu open"><button class="hmenu-btn" data-chsetmenu="1" ' +
      'aria-haspopup="true" aria-expanded="true">Settings ' +
      '<span class="hcar">&#9662;</span></button>' +
      '<div class="hmenu-panel chset">' +
        /* "Chat settings", so the heading does not collide with the row now
           called Chat — Islam's own call when the names were settled. */
        '<div class="chset-h">Chat settings</div>' +

        /* ── 1 · DOES IT EXIST AT ALL. Off, nothing below it means anything. */
        setRow("on", "Chat",
          "Off removes the bubble from every page. Nothing is deleted \u2014 every " +
          "conversation stays here and stays readable.",
          segHtml("on", "Off", "On", c.on, true)) +

        /* ── 2 · WHAT PEOPLE READ BEFORE THEY TYPE. */
        setRow("promise", "Promise",
          "Shown under \u201CStrategy Office\u201D on every open chat. It is a promise " +
          "the office is making to the whole tenant.", null,
          '<input class="chset-in" type="text" data-chpromise="1" ' +
            'value="' + esc2(c.promise) + '" aria-label="What the panel promises">') +

        /* ── 3 · WHAT THEY MAY SEND. */
        setRow("shots", "Screenshots",
          "The only thing here with real storage cost \u2014 up to 3 MB a picture, " +
          "shrunk before it is sent.",
          segHtml("shots", "Off", "On", c.shots, true)) +

        /* ── 4 · WHO ANSWERS (§104). Off is enforced on the server, where the
           model is simply never called — with the assistant off there is no
           control on screen to hide, so the guard IS the feature (§42, §98.2).
           Test stays directly beneath it: it is where somebody stands after
           turning it on (§123). */
        setRow("assistant", "Assistant",
          "Off sends every question straight to this inbox. On, it answers from the " +
          "knowledge base first \u2014 the same pages everybody can already open \u2014 " +
          "and hands over anything it cannot answer. It cannot see a figure, a plan " +
          "or a score, and it says so rather than guessing.",
          segHtml("assistant", "Off", "On", c.assistant, true),
          '<div class="chset-test">' +
            '<button class="editbtn" data-chtest="1">' +
              (BOXTEST.busy ? "Testing\u2026" : "Test the assistant") + '</button>' +
            (BOXTEST.steps ? testHtml(BOXTEST.steps) : "") +
          '</div>') +

        /* ── 5 · TOLD WHEN THE ASSISTANT GIVES UP. Only while the assistant is
           on, as before: a handover that cannot happen has nobody to tell. */
        (c.assistant
          ? setRow("notify", "Handover email",
              "Emailed the moment the assistant hands a question to a person. Off " +
              "leaves handovers waiting in this inbox.",
              segHtml("notify", "Off", "On", c.notify, true),
              /* THE STATUS STAYS ON THE PAGE. This is not prose about how the
                 setting works — it names who, or says that nobody was chosen,
                 which is the one thing a tooltip must never swallow. */
              '<div class="chset-hint">' +
              (c.notify
                ? (c.rep ? 'Emailed to ' + esc2(repName(c.rep)) + ' the moment it happens.'
                         : '<b>No one is set</b> \u2014 handoffs wait in this inbox until ' +
                           'somebody is chosen below.')
                : 'Handoffs wait here until somebody opens the page.') + '</div>' +
              (c.notify ? '<div class="chset-ctl chset-who">' + repPicker(c.rep) + '</div>' : ''))
          : "") +

        /* ── 6 · TOLD WHEN A REPLY LANDS AND THEY ARE NOT LOOKING. Beside its
           sibling at last; the two were five rows apart. */
        setRow("mail", "Away email",
          /* THE SENTENCE READS THE SETTING (§169). It said "three minutes" as
             prose while the server read a constant, so the two were one edit
             from disagreeing — and the edit is now a box on this very row. */
          "A reply is emailed when they have not had the platform open for " +
          plural(c.away, "minute") + ". Off keeps every conversation inside " +
          "the platform. A shut chat checks in every three minutes, so anything " +
          "below four can call somebody away while they are at their desk.",
          segHtml("mail", "Off", "On", c.mail, true),
          /* ONLY WHILE IT IS ON, the shape `rep` already has under Handover
             email: a threshold for an email nobody sends is a control with
             nothing behind it (§61). */
          (c.mail
            ? '<div class="chset-ctl chset-away">' +
                '<input class="chset-num" type="number" data-chaway="1" ' +
                  'min="' + SMPRules.CHAT_AWAY_MIN + '" max="' + SMPRules.CHAT_AWAY_MAX + '" ' +
                  'value="' + c.away + '" aria-label="Minutes away before a reply is emailed">' +
                '<span class="chset-unit">' + plural(c.away, "minute") + ' away</span>' +
              '</div>'
            : "")) +

        /* ── 7 · THE ONLY ROW THAT CHANGES NOTHING ANYBODY SEES, so it is last.
           The cost is in the tooltip because it is the whole reason this is a
           setting rather than a number in the source (§98). */
        setRow("fast", "Reply checks",
          "How often an open chat asks whether anything has arrived \u2014 every 4 " +
          "seconds, or every 15. Relaxed cuts the busiest case by about three " +
          "quarters; a reply then takes up to 15 seconds to appear instead of 4.",
          segHtml("fast", "Relaxed", "Live", c.fast, false)) +
      '</div></span>';
  }

  function renderInbox(){
    var c = chatCfg();
    /* NAMED WHAT THE RAIL NAMES IT (§121.1, §135.3). Islam: *"in the page of
       inbox … remove the word messages."* It was printing "Messages" under a
       rail entry that said "Inbox", which is the duplication §121.1 removed
       from five pages — and this page was invisible to that sweep, because the
       whole feature needs a server and every screen check opens the built file
       over file:// (§94.11). Saying the same word as the rail is what makes the
       heading drop; the settings dropdown rides up onto the pinned line with
       everything else (§135). */
    return cfgHead("Platform Inbox", [], null, false, null, null,
        '<span class="chsetwrap">' + settingsHtml() + '</span>') +
      /* OFF IS SAID ON THE PAGE, because this is the one screen that still
         works when it is off and the one place it can be turned back on.
         ALWAYS RENDERED, hidden or not, so flipping the switch shows it
         without the page being rebuilt — the no-paint() rule at the top of
         this file applies to a deliberate click as much as to a poll. */
      '<div class="chset-off" id="chsetoff"' + (c.on ? " hidden" : "") + '>' +
        '<b>The chat is off.</b> Nobody can write to the office and the bubble is not ' +
        'drawn on any page. Everything below is still here, and turning it back on ' +
        'changes nothing about it.</div>' +
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

  /* ── THE ONE YOU HAVE OPEN NEVER LEAVES THE LIST (§105) ─────────
     Islam: "the chat was a user he sent to me and I replied and the chat
     disappeared from all places."

     Nothing was deleted — replying marks a conversation ANSWERED (§71: the
     status you must remember to set is the one nobody sets), and the inbox
     opens on WAITING, which by definition excludes answered ones. So the act
     of replying removed the row from the list the office was looking at, while
     its thread sat open on the right. It reads as destruction, and coming back
     to the page shows it gone again, because the page always opens on Waiting.

     THE FILTER IS NOT WRONG AND IS NOT CHANGED. Waiting is the work queue and
     it has to keep meaning what it means at thirty conversations. What is
     wrong is that it applied to the conversation you are IN — so that one is
     exempt, and only that one. A search still hides it, deliberately: typing
     in the box is asking to see something else. */
  function boxRows(){
    var q = box.q.toLowerCase();
    return (box.threads || []).filter(function(t){
      var open = t.person_key && t.person_key === box.person;
      if (!q && open) return true;
      if (box.tab === "waiting" && !t.waiting) return false;
      if (box.tab === "flagged" && !(+t.flagged > 0)) return false;
      if (!q) return true;
      /* SEARCHED BY BOTH (§187). Typing what is ON SCREEN has to find the
         row — and a typed short name is not always a prefix of the full one
         (§93.8: `known` is stored, not derived), so matching the full name
         alone would leave exactly those people unfindable. */
      return String(t.live_name || t.person_name || "").toLowerCase().indexOf(q) > -1 ||
             String(nameOf(t.person_key, t.live_name || t.person_name) || "")
               .toLowerCase().indexOf(q) > -1 ||
             String(t.last_body || "").toLowerCase().indexOf(q) > -1;
    });
  }

  /* How many conversations the current filter is HIDING, so an empty list can
     say where everything went rather than only that there is nothing here. */
  function boxHidden(){
    return (box.threads || []).length - boxRows().length;
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
      /* AN EMPTY LIST SAYS WHERE EVERYTHING WENT (§105). "Nobody is waiting"
         is true and was a dead end: with an answered conversation hidden
         behind a filter nothing on the screen mentioned, the only way back to
         it was to already know about the All tab.

         AND THE FLAGGED TAB WAS SAYING SOMETHING FALSE — "No conversations
         yet" when there are conversations and none of them is flagged. Found
         while reproducing the other one; the same shape of lie, and the same
         fix: an empty state describes THIS filter, never the whole product. */
      var hid = boxHidden();
      var elsewhere = hid > 0
        ? ' <button class="chlink" type="button" data-chtab="all">' +
          hid + " " + (hid === 1 ? "conversation is" : "conversations are") +
          " on All</button>"
        : "";
      list.innerHTML = '<div class="chnothing">' +
        (box.q ? "Nothing matches that."
               : box.tab === "waiting"
                   ? "Nobody is waiting. That is the good state." + elsewhere
               : box.tab === "flagged"
                   ? "Nothing is flagged." + elsewhere
               : "No conversations yet.") + "</div>";
      return;
    }
    var out = [], group = null;
    rows.forEach(function(t){
      var g = t.waiting ? "Waiting on us" : "Answered";
      if (g !== group) { group = g; out.push('<div class="chqsep">' + g + "</div>"); }
      /* §187: THE LIST SAYS THE NAME, NOT THE FULL LEGAL ONE. §181 did the
         thread, the inbox heading and both reply placeholders and stopped at
         the QUEUE — a different builder, and the one place the office spends
         most of its time looking. `last_by` is a name with no key beside it,
         so it goes through the same reader with the raw value as its
         fallback, where `knownGuess()` shortens it (§130.7's rule). */
      var last = (t.last_from_office ? (nameOf(null, t.last_by) || "Office") + ": " : "") +
                 (t.last_body || "");
      out.push('<button class="chqrow' + (box.person === t.person_key ? " on" : "") + '" ' +
        'type="button" data-chpick="' + esc2(t.person_key) + '">' +
        /* THE FULL NAME MOVES TO THE HOVER, never away (§181, §93.8): two
           people whose short names read alike are still two rows, and the
           register's own reader is what lengthens the guess for them. */
        '<span class="chnm" title="' +
          esc2(t.live_name || t.person_name || t.person_key) + '">' +
          esc2(nameOf(t.person_key, t.live_name || t.person_name) || t.person_key) +
        "</span>" +
        '<span class="chtm">' + esc2(when(t.last_at)) + "</span>" +
        '<span class="chsn">' + esc2(last) + "</span>" +
        (+t.unread > 0 ? '<span class="chun">' + (+t.unread) + "</span>" : "") +
        '<span class="chwh">' + esc2(placeOf(t)) + "</span>" +
      "</button>");
    });
    list.innerHTML = out.join("");
  }

  /* WHAT WILL HAPPEN WHEN SEND IS PRESSED, SAID BEFORE IT IS PRESSED. The
     server makes the same call again when the reply lands (§97.5) — this line
     is the office being shown the rule, never the rule itself. */
  function presenceHtml(d){
    /* FIRST NAME THROUGH THE SHARED RULE (§135, §181), never split(" ")[0] —
       "Abd El Moniem" is one first name, and this register holds it. */
    var name = firstNameOf(d.person, d.name) || "They";
    /* THE FIFTH STATE, AND IT COMES FIRST. With the chat off nobody can open
       an answer, so what somebody's presence would have decided does not
       arise — saying "Yara is away" here would be true and beside the point. */
    if (!chatCfg().on) {
      return '<div class="chpres none">' + ICON_CLOCK +
        " The chat is off, so nobody would see a reply. Turn it back on in Settings.</div>";
    }
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

  /* ONE GROWER FOR BOTH COMPOSERS (§188, §53.5). The corner's was written
     inline in wire(); the inbox needed the same thing, and two copies of "how
     tall should this box be" is how one of them stops matching the other. */
  var CH_GROW_MAX = 120;
  function chGrow(){
    this.style.height = "auto";
    this.style.height = Math.min(CH_GROW_MAX, this.scrollHeight) + "px";
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
       every poll would wipe a half-written answer — the exact fault §71.2 was
       raised about, one surface further out. */
    /* ── THE THREAD ANSWERS FOR THE SEND (§193) ───────────────────────
       Islam: *"the messages are sent in the box but still there is
       sending.."* — with the reply plainly there above it. The word waited on
       a request, and a request can stop coming back; the thread is the
       evidence and it arrives on the poll regardless. So the moment the
       message being sent is IN the thread, *Sending…* has stopped being true
       and is replaced here, whatever the request is doing.

       Matched on the office's own side and on the exact words, because that
       is what was posted; a message that has not arrived leaves the word
       alone, which is the honest state while it really is in flight. */
    if (box.sending && (d.messages || []).some(function(m){
          return m && m.from_office && String(m.body || "").trim() === box.sending; })) {
      box.sending = null;
      box.note = { text: "Sent." };
    }
    var existing = pane.querySelector("[data-chreply]");
    var keep = existing && existing.dataset.chreply === d.person ? existing.value : null;

    var body = pane.querySelector("#chtbody");
    var atEnd = body ? (body.scrollHeight - body.scrollTop - body.clientHeight < 40) : true;

    /* ── AND KEEPING THE TEXT IS NOT KEEPING THE CARET (§188) ──────────
       Islam: *"when I'm replying in the chat inbox suddenly the mark goes out
       of the chat box and I bring it back to focus again."* The rule above
       was written and is half of what it claims: the VALUE is carried across,
       and the element is replaced regardless — so every ten seconds the box
       being typed into is destroyed, and focus and the cursor go with it.
       The words survived, which is why this reads as the cursor jumping
       rather than as work being lost.

       WHEN THE THREAD IS ALREADY THIS PERSON'S AND THE COMPOSER HAS THE
       CURSOR, ONLY THE MESSAGES ARE REDRAWN. A reply landing mid-sentence
       still appears — the body is the part that changes — and the footer,
       which is the part being used, is left alone.

       NOT "SKIP THE POLL WHILE TYPING": that would hold back the very thing
       the poll is for. The half that must not move is the composer, and it is
       the half that is now not touched. */
    if (keep != null && body && existing === document.activeElement) {
      body.innerHTML = threadHtml(d.messages || [], true, true);
      if (atEnd) body.scrollTop = body.scrollHeight;
      var head = pane.querySelector("[data-chdone]");
      if (head) head.textContent = d.waiting ? "Mark answered" : "Put back on the list";
      /* THE NOTE IS REWRITTEN IN PLACE ON THIS PATH TOO (§193). §188 leaves
         the footer alone so the composer being typed into is not destroyed —
         right, and it also froze the one line in the footer that is not a
         control. Written into the node rather than by redrawing it (§63), so
         the box beside it is still untouched. */
      var n2 = el("chreplynote");
      if (n2) {
        n2.className = "chnote" + (box.note && box.note.bad ? " bad" : "");
        n2.textContent = box.note ? box.note.text : "";
      }
      return;
    }

    pane.innerHTML =
      '<div class="chthead">' +
        "<div><div class=\"chnm\">" + esc2(nameOf(d.person, d.name) || d.person) + "</div>" +
        '<div class="chmeta">' + esc2([placeOf(d), d.address].filter(Boolean).join(" · ")) + "</div></div>" +
        '<div class="chacts">' +
          '<button class="chmini" type="button" data-chdone="' + esc2(d.person) + '">' +
            (d.waiting ? "Mark answered" : "Put back on the list") + "</button>" +
        "</div>" +
      "</div>" +
      '<div class="chtbody" id="chtbody">' + threadHtml(d.messages || [], true, true) + "</div>" +
      '<div class="chtfoot">' + presenceHtml(d) +
        '<div class="chcomp' + (chatCfg().on ? "" : " shut") + '">' +
          '<textarea rows="1" data-chreply="' + esc2(d.person) + '" ' +
            (chatCfg().on ? "" : 'disabled ') +
            'placeholder="Reply to ' + esc2(String(d.name || "them").split(/\s+/)[0]) + '…" ' +
            'aria-label="Your reply"></textarea>' +
          '<button class="chsend" data-chreplysend="' + esc2(d.person) + '" type="button"' +
            (chatCfg().on ? "" : " disabled") + '>Send</button>' +
        "</div>" +
        '<div class="chnote' + (box.note && box.note.bad ? " bad" : "") + '" id="chreplynote">' +
          esc2(box.note ? box.note.text : "") + "</div>" +
      "</div>";

    var ta = pane.querySelector("[data-chreply]");
    if (ta && keep != null) ta.value = keep;
    /* ── AND IT GROWS WITH WHAT IS WRITTEN IN IT (§188) ────────────────
       Islam: *"chat box to wrap the content not disappearing."* The corner
       panel's composer has grown to fit since §97 (`#chatsay`, capped at
       120px); the office's reply box is the same control with the handler
       missing, so it stayed one row for ever and everything past the first
       line scrolled out of sight while it was being written.

       The same cap and the same two lines, wired here rather than in
       wireInbox(): this element is REPLACED on every person change, and a
       listener bound to the one before it dies with it (§29.5 — whoever
       destroys the wiring re-does it, in the same function). */
    if (ta) {
      ta.addEventListener("input", chGrow);
      chGrow.call(ta);
    }
    var nb = el("chtbody");
    if (nb && atEnd) nb.scrollTop = nb.scrollHeight;
  }

  /* ── THE RAIL'S COUNT IS THE INBOX'S COUNT (§188) ──────────────────
     Islam: *"I replied to the person and still I get the notification on the
     side rail, and the waiting is 0 while the chat is still in the
     waiting."* Both halves of that screen were right and they were of
     different ages: the Inbox re-asks its queue on every beat, and the rail's
     pill is `OVQUEUE`, fetched ONCE per visit (§108.10 — "a summary somebody
     reads and then acts on, not a live board") and never told that the
     summary just stopped being true.

     That reasoning holds for a page nobody is acting ON. It stops holding the
     moment the act itself is on screen: replying is what makes the number
     wrong, and it happens two panes away from the pill.

     SO THE INBOX'S OWN ANSWER IS HANDED TO THE SHELL rather than the shell
     polling for it. One fetch, two readers — §108.10's own rule that the
     rail's number cannot disagree with the page it points at, which it could
     only keep while nothing changed underneath it. */
  function shellCount(j){
    if (typeof window === "undefined" || !j) return;
    try { window.OVQUEUE = { waiting: j.waiting | 0, flagged: j.flagged | 0 }; }
    catch (e) {}
    /* AND THE PILL IS REWRITTEN IN PLACE, NEVER BY REPAINTING (§97, §145.12).
       A paint() here would rebuild the whole Setup page — including the reply
       box being typed into, which is the fault two lines of this file exist
       to prevent. So the one number that changed is written into the one
       element that shows it, the way the gap band's counts already are. */
    try {
      var btn = document.querySelector('.ritem[data-setupgo="chat"]');
      if (!btn) return;
      var pill = btn.querySelector(".riwait");
      var n = j.waiting | 0;
      if (!n) { if (pill) pill.remove(); return; }
      if (!pill) return;                  /* it appears on the next paint */
      pill.textContent = String(n);
      pill.title = n + " waiting on this page";
    } catch (e) {}
  }

  function boxLoadQueue(then){
    post({ action:"queue" }, function(err, j){
      if (err || !j) return;
      shellCount(j);
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
    /* §193: WHAT IS IN FLIGHT, so the thread itself can answer for it. */
    box.sending = text;
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
        /* THE SAME ANSWER THE TEST EMAIL USES (spec 027). This line was the
           second copy of "where is the platform" and the two had drifted:
           commsShape() said the gate, this said the platform. One asker now,
           and an empty answer draws no button rather than a broken one. */
        cta: { label: "Open the platform", href: sh.href || "" }
      });
    } catch (e) { /* No mail builder here is not a reason to refuse the reply. */ }

    post(body, function(err, j){
      if (btn) btn.disabled = false;
      if (err) {
        /* HAS THE THREAD ALREADY ANSWERED FOR IT? `box.sending` is cleared the
           moment the message is seen in the thread, so an empty one here means
           the send is CONFIRMED and this late error is only about the email
           (§193). Saying "no answer" over a delivered reply would be the
           screen taking back something true. */
        var confirmed = !box.sending;
        box.sending = null;
        /* A TIMEOUT IS NOT A FAILURE AND MUST NOT BE DRESSED AS ONE. The
           message may well have gone — it is stored before the email is tried
           — so this says what is true and points at the evidence, which is on
           the same screen. Not red, because red says it did not send. */
        var no = err === NO_ANSWER;
        if (!(confirmed && no)) {
          box.note = no
            ? { text: "No answer from the server. The reply may still have gone — " +
                      "it appears above if it did." }
            : { text: err, bad: true };
          if (note) {
            note.className = "chnote" + (no ? "" : " bad");
            note.textContent = box.note.text;
          }
        }
        /* AND ASK THE THREAD, which is the one thing that actually knows. */
        boxLoadThread(who);
        return;
      }
      box.sending = null;
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
      /* AND THE RAIL'S BADGE IS NO LONGER TRUE (§166). The Setup rail counts
         `OVQUEUE.waiting`, asked ONCE per visit because a summary is read and
         acted on rather than watched (§108.10). Replying is the act that makes
         it stale: the inbox correctly reads "Waiting 0" and the rail goes on
         showing the number it was told when the page loaded. Islam: "all chats
         are answered and still the rail is showing a notification."

         Cleared rather than recounted — the next paint on the Overview asks
         again, which is the one place that fetch belongs (a second asker
         polling in the background is what §98 was about). §35's shape: the
         status you must remember to refresh is the one nobody refreshes. */
      if (typeof window !== "undefined" && typeof window.OVQUEUE !== "undefined")
        window.OVQUEUE = null;
      boxLoadQueue();
      boxLoadThread(who);
    });
    /* ── AND THE SCREEN STOPS WAITING ON THE EMAIL (§193) ──────────────
       Islam, correcting the first diagnosis: *"the reply back of the sending
       came back it just takes a long time."* Right, and that is the whole of
       it — the server STORES the message and then tries to EMAIL it, and only
       answers when both are done. The email is the slow half, so *Sending…*
       stood for as long as a mail provider took, on a reply that was already
       delivered and already visible in the thread.

       So the thread is asked once, soon, rather than waited for: the moment it
       comes back holding the message, the redraw above replaces the word with
       *Sent.* — and when the request finally answers it upgrades that to
       *Sent, and emailed to …*. Two true sentences in the right order rather
       than one stale one.

       ONLY WHILE SOMETHING IS IN FLIGHT (`box.sending` is cleared by whichever
       answers first), so a send that answers quickly costs nothing extra —
       and never a poll of its own (§98: what costs is polling, not messages). */
    setTimeout(function(){ if (box.sending) boxLoadThread(who); }, 1200);
  }

  /* Called at the end of paint(), beside SEARCHSEL.wire(). Everything is bound
     on the CONTAINER rather than on each row, because the rows are rewritten
     every ten seconds and a handler bound to one would go with it (§24). */
  /* Redraw ONLY the menu, in place. Its container is outside `#chinbox`, so
     nothing about the queue or the open thread is disturbed — and the reply
     box, which may be half typed, is never in the region rewritten. */
  function setMenuPaint(){
    var wrap = document.querySelector(".chsetwrap");
    if (!wrap) return;
    wrap.innerHTML = settingsHtml();
  }

  function wireSettings(){
    var wrap = document.querySelector(".chsetwrap");
    if (!wrap || wrap.dataset.chwired) return;
    wrap.dataset.chwired = "1";

    wrap.addEventListener("click", function(e){
      /* A TAP OPENS THE NOTE (§127). Hover does not exist on a tablet, and
         since every explanation moved behind one of these marks, a note that
         only answers a mouse is a note half this product's readers cannot
         read. `.on` sits beside the :hover and :focus the platform already
         uses, so nothing about the mark changes for anybody else.

         SCOPED TO THIS PANEL DELIBERATELY. `.tip` is used all over the
         product; giving every one of them a tap would be a change to pages
         this was not asked to touch (rule 1c), so it is offered rather than
         taken. FIRST, or the mark inside a row would fall through to the
         branches below it. */
      var tip = e.target.closest("[data-chtip]");
      if (tip) {
        var was = tip.classList.contains("on");
        wrap.querySelectorAll("[data-chtip].on").forEach(function(o){ o.classList.remove("on"); });
        if (!was) tip.classList.add("on");
        return;
      }
      /* AND ANY OTHER PRESS PUTS THEM AWAY, including one that opens the menu
         or flips a switch — a note left standing over the control somebody
         just pressed is the fault §100.4 fixed for the panel itself. */
      wrap.querySelectorAll("[data-chtip].on").forEach(function(o){ o.classList.remove("on"); });

      var t = e.target.closest("[data-chsetmenu]");
      if (t) { SETMENU = !SETMENU; setMenuPaint(); return; }

      /* IS IT WORKING? (§123) — and this branch was written into the `change`
         listener first, where a <button> can never reach it: it rendered
         perfectly, it was pressable, and pressing it did nothing at all. The
         anchor was the rep `<select>`, which genuinely does belong there.
         §96's family, and found the same way — by pressing the thing. */
      var test = e.target.closest("[data-chtest]");
      if (test) {
        if (BOXTEST.busy) return;
        BOXTEST.busy = true; BOXTEST.steps = null; setMenuPaint();
        post({ action:"assistantTest" }, function(err, j){
          BOXTEST.busy = false;
          BOXTEST.steps = (j && j.steps) || [{ name:"The platform", state:"fail",
            detail: err === "failed" ? "Could not reach the server." : String(err || "No answer.") }];
          setMenuPaint();
        });
        return;
      }

      var seg = e.target.closest("[data-chset]");
      if (seg) {
        chatSet(seg.dataset.chset, seg.dataset.chval === "1");
        /* SAVED WITHOUT A REPAINT (§71.2), then the menu redraws itself so the
           lit half moves. The corner and everybody else's browser pick the
           change up from the SERVER on their next poll — never from this
           object, or the screen and the database would disagree until the
           autosave landed. */
        saved();
        setMenuPaint();
        /* The two things on the page that this changes, written into the nodes
           they are about — never paint(), which would rebuild the queue and
           the half-typed reply behind an open menu (§30.1). */
        if (seg.dataset.chset === "on") {
          var nowOn = chatCfg().on;
          var banner = el("chsetoff");
          if (banner) banner.hidden = nowOn;
          drawThread();
          /* AND THE CORNER OF THE PERSON WHO JUST FLIPPED IT. Everybody else's
             catches up on their next poll, which with the panel shut is up to
             three minutes (§98.1) — fine for them and wrong for the office,
             who would otherwise press Off and watch nothing happen. The server
             is still what decides; this only spares them the wait. */
          cfg.on = nowOn;
          var dock = el("chatdock");
          if (dock) dock.hidden = !nowOn;
          if (!nowOn && open) setOpen(false);
        }
        return;
      }
    });
    /* TYPING NEVER REPAINTS (§35). The promise is written on `change`, which
       fires on blur, so the box is never replaced under the cursor. */
    wrap.addEventListener("change", function(e){
      var rep = e.target.closest("[data-chrep]");
      if (rep) {
        chatSet("rep", rep.value);
        saved();
        /* The hint above it names who was chosen, so the menu redraws — never
           paint(), which would rebuild the page behind an open menu (§30.1). */
        setMenuPaint();
        return;
      }
      /* THE MINUTES, ON `change` LIKE EVERYTHING ELSE ON THIS PANEL (§35):
         a number box repainted on every keystroke loses the second digit.
         The MENU is redrawn afterwards and never `paint()`, because the row's
         own sentence and the words beside the box both read this value and
         would otherwise go on naming the old one (§30.1, §63). */
      var away = e.target.closest("[data-chaway]");
      if (away) {
        chatSet("away", away.value);
        saved();
        setMenuPaint();
        return;
      }
      var inp = e.target.closest("[data-chpromise]");
      if (!inp) return;
      chatSet("promise", inp.value);
      saved();
    });
  }

  /* WHERE THE BOX STARTS, so CSS can make it end at the bottom of the window
     (§100.5). Its DOCUMENT offset, not its position on screen — that one moves
     with every scroll and would resize the box as you scrolled it. Nothing
     above the box moves when the box changes height, so there is no loop here:
     §28.3's warning is about a max-height fed by a measurement the height
     itself changes, and this is not one. */
  function fitInbox(){
    var root = el("chinbox");
    if (!root) return;
    var top = root.getBoundingClientRect().top + (window.pageYOffset || 0);
    root.style.setProperty("--chin-top", Math.round(top) + "px");
  }

  function wireInbox(){
    wireSettings();
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
        /* LIT BY VALUE, NEVER BY IDENTITY. This compared `b === tab` across
           every `[data-chtab]` in the page, which was fine while the only ones
           were the three tabs themselves — and the moment the empty state grew
           a "N conversations are on All" link (§105), pressing THAT would have
           lit the link and un-lit all three tabs, leaving the row with nothing
           selected. Scoped to the tab row and matched on the value, so a
           shortcut to a tab lights the tab. */
        Array.prototype.forEach.call(root.querySelectorAll(".chqtab"), function(b){
          var on = b.dataset.chtab === box.tab;
          b.classList.toggle("on", on);
          b.setAttribute("aria-selected", on ? "true" : "false");
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

    fitInbox();
    /* Re-measured on resize, because the chrome's rows wrap at narrow widths
       and the box's top moves with them. Bound once, on the container that is
       torn down with the page — `boxBeat()` already stops when #chinbox is
       gone, and this asks the same question. */
    window.addEventListener("resize", function(){ if (el("chinbox")) fitInbox(); });
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
    unread: function(){ return state.unread; },
    /* ── HOW MANY ARE WAITING, FOR THE OVERVIEW (§108.10) ──────────────
       The same `queue` action the inbox already calls, whose answer already
       carries the two counts — so this is a second READER of one endpoint and
       not a second endpoint, and the number the Overview prints is by
       construction the number the Inbox's own tab prints.

       IT DOES NOT TOUCH `box`. The office's page state belongs to the page:
       writing box.threads from here would leave a half-built queue behind for
       whenever the inbox is next opened, and `drawQueue()` would be painting
       into a document that does not have it. The Overview wants two integers.

       `null` RATHER THAN 0 ON EVERY FAILURE, including no server at all — the
       caller draws nothing for a null and "nothing is waiting" for a 0, and
       those are different things to say (§108.10, §93). */
    officeQueue: function(cb){
      if (!servable()) return cb(null, null);
      post({ action:"queue" }, function(err, j){
        if (err || !j) return cb(err || new Error("no answer"), null);
        cb(null, { waiting: j.waiting | 0, flagged: j.flagged | 0 });
      });
    }
  };
})();
