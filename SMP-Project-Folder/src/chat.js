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
  /* ── AND A FOURTH, FOR THE ANSWER THAT HAS NEVER COME (§197) ───────────
     Islam: *"I didn't see the icon on login and when I sent to myself a
     message it appeared again"* — and the chat was NOT off.

     THE CORNER IS CREATED HIDDEN and the only thing that ever reveals it is
     a SUCCESSFUL answer (`dock.hidden = !cfg.on`, below). A 500, a timeout
     or a dropped connection matches neither that branch nor the 401/403 one,
     so nothing showed it — and the next attempt was POLL_SHUT away. Three
     minutes with no way to reach the office, on the one morning the server
     was having trouble, which is exactly when somebody wants it. Measured:
     one failed first poll and the corner was still absent eight seconds
     later, with the poll count still at 1.

     So while the first answer is still outstanding the beat is short, for a
     BOUNDED number of tries — about half a minute, which covers a database
     waking up — and then falls back to POLL_SHUT rather than asking every
     five seconds for ever against a server that is not coming back (§98.1's
     whole argument). It is the SAME timer, not a second one: two mechanisms
     for "ask again" is how they drift (§53.5). */
  var POLL_FIRST = 5000;
  var FIRST_TRIES = 6;
  var firstTries = 0;
  function firstRun(){ return !loaded && firstTries < FIRST_TRIES; }
  var PIC_EDGE = 1600;

  /* What the server last told us the office has set. Started from the shared
     defaults so the first paint is not a guess, and replaced by the answer —
     never invented here, or the two sides would decide it separately (§42). */
  var cfg = SMPRules.chatCfg(null);
  cfg.beat = SMPRules.chatBeat(null);

  var open = false, mounted = false, timer = null;
  var state = { messages: [], unread: 0, thread: null, office: false };
  /* ── THE OFFICE'S CORNER IS TWO THINGS (§285) ────────────────────────
     Islam: "the chat bubble of the SMO team shouldn't be something to be sent
     to the smo, that is redundancy — it should be the chats of the other
     people sending the smo the messages … and he can with a switch go
     directly to the SMO."

     He is right, and it was redundancy of an odd kind: the corner is "your
     conversation with the office", and for the office that is a conversation
     with themselves. So the corner splits — a queue down one side, their own
     thread down the other — and the second half is kept, not dropped,
     because it is where the assistant is tested and where a member of the
     office writes to the office (§247's own reason inverted).

     KEPT IN ONE OBJECT, NOT FOUR FLAGS. `side` is which half; `person` is the
     conversation open INSIDE the queue half, and null means the list. Every
     other field is what the server last said, never a second copy of it. */
  var cq = { side: "wait", person: null, name: "", msgs: [], q: "",
             hits: null, searching: false, rows: null, err: "",
             /* §290: the people who match and have NO conversation yet, and
                how many more matched than the ten shown. `fresh` marks the
                conversation open in the queue as one that does not exist on
                the server yet, so the first message carries `start`. */
             people: null, more: 0, fresh: false };
  /* The office's own thread is fetched on the same poll as everybody's, so
     switching to "My messages" costs nothing and shows what is already here. */
  /* HOW MANY WERE WAITING LAST TIME WE ASKED — the office's half of §225.
     `null` until the first answer, so the very first poll of a session can
     never announce a queue that was already there when they signed in. */
  var lastWaiting = null;
  var loaded = false, sending = false, shot = null, lastErr = "";
  /* The office inbox's own state, kept apart: the two surfaces poll on
     different clocks and a person in the office has both open at once. */
  /* `note` is what the LAST send actually did, and it lives out here rather
     than in the DOM for the reason §63 records: the refresh that follows a
     send rebuilds the pane and would wipe the sentence the send just wrote —
     the word has to survive the redraw that reports it. Cleared when the
     conversation changes, because it is news about this one. */
  var box = { person: null, threads: [], data: null, timer: null, q: "",
              tab: "waiting", note: null,
              /* §231.4: WHETHER WE HAVE EVER MANAGED TO ASK. `null` until an
                 answer arrives, and a sentence once one has failed — because
                 an empty list and a list nobody could fetch are two different
                 things and only one of them is about the data. */
              err: null, asked: false,
              /* §247: writing to somebody who has not written in. `new` is the
                 mode, `newWho` the person chosen — one flag rather than a
                 second pane, because it IS the thread pane, showing the one
                 thing a conversation that does not exist yet can show. */
              new: false, newWho: "" };

  function servable(){ return location.protocol !== "file:"; }

  /* Is the chat switched on, according to the state this page hydrated with?
     Absent means the tenant never touched the setting, which `chatCfg` reads
     as ON — the same default the server applies (§104, §98). Anything at all
     going wrong here answers NO, because a corner that fails to appear for a
     second is a smaller fault than one that appears and is taken away. */
  function chatOnFromState(){
    try {
      if (typeof SYNC === "undefined" || !SYNC.isLive || !SYNC.isLive()) return false;
      if (typeof GROUP === "undefined" || !GROUP) return false;
      return !!SMPRules.chatCfg(GROUP.chat).on;
    } catch (e) { return false; }
  }
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
          /* GROUPED, NEVER TWO CONTROLS EACH PUSHED RIGHT ON THEIR OWN. `.chx`
             used to carry `margin-left:auto` itself, so a second one would be
             pushed to the right INDEPENDENTLY and the two would land a gap
             apart with the heading squeezed between them. The pair takes the
             margin now and the buttons sit side by side. */
          '<div class="chbtns">' +
            /* THE BELL IS THIS PERSON'S SWITCH, ON THIS DEVICE (§225) — drawn
               only where it can decide something: hidden when the office has
               turned notifications off for the tenant and on a browser with no
               Notification at all, because a control that changes nothing is
               not a choice (§61). Its state is written in by drawBell(). */
            '<button class="chx chbell" id="chatbell" type="button" hidden></button>' +
            /* A MINUS, NOT A CROSS (Islam: "it need to be a minimize button as
               there is no closing actually"). Nothing is closed by pressing it
               — the conversation is permanent, one per person, and it is the
               same one next time. A × promises an end to something that has
               none, and on a chat it reads as "discard this". */
            '<button class="chx" id="chatclose" type="button" title="Minimise" ' +
              'aria-label="Minimise this conversation">' +
              '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" ' +
              'stroke-linecap="round" aria-hidden="true"><path d="M6 12h12"/></svg></button>' +
          "</div>" +
        "</div>" +
        /* THE SPLIT AND THE SEARCH (§285), between the head and the body so
           they stay put while the list scrolls. Empty and hidden for
           everybody but the office — a control that changes nothing is not a
           choice (§61). */
        '<div class="cqbar" id="cqbar" hidden></div>' +
        '<div class="chatbody" id="chatbody"></div>' +
        '<div class="chatfoot">' +
          /* WHAT IS ATTACHED, SHOWN (§286.2) — above the composer, so the box
             under the cursor never moves. Empty and absent until there is a
             picture. */
          '<div class="chprev" id="chatprev" hidden></div>' +
          '<div class="chcomp">' +
            '<button class="chicon" id="chatpic" type="button" title="Attach a screenshot — or paste one straight into the box" ' +
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
  /* ── THE OFFICE'S HALF OF THE CORNER (§285) ──────────────────────────
     Drawn into the SAME body as everybody else's conversation, because it is
     the same box and a second panel would be a second set of every rule this
     file already keeps — the poll, the scroll, the composer that must not be
     rebuilt under a typing hand (§71.2). */

  /* WAITING ONLY, AND THE BADGE IS ITS LENGTH. His decision on both, and they
     are one decision: a count that is not the length of the list under it gets
     reported as a bug (§108.1). */
  function cqRows(){ return cq.rows || []; }

  function cqSeg(){
    var n = cqRows().length;
    return '<div class="cqseg" role="tablist">' +
      '<button type="button" role="tab" data-cqside="wait"' +
        (cq.side === "wait" ? ' class="on" aria-selected="true"' : ' aria-selected="false"') +
        '>Waiting' + (n ? ' <span class="cqn">' + n + "</span>" : "") + "</button>" +
      '<button type="button" role="tab" data-cqside="mine"' +
        (cq.side === "mine" ? ' class="on" aria-selected="true"' : ' aria-selected="false"') +
        ">My messages</button></div>";
  }

  function cqFind(){
    return '<div class="cqfind"><input type="search" id="cqfind" ' +
      /* THE BOX SAYS ITS OWN SCOPE (§290), which is where the grey line above
         the rows used to say it. Read at the moment somebody decides to type,
         and it costs no row of the list. */
      'placeholder="Search all conversations and the register\u2026" ' +
      'value="' + esc2(cq.q) + '" ' +
      'aria-label="Search all conversations and the register"></div>';
  }

  /* ONE ROW BUILDER FOR BOTH LISTS, so a search result and a waiting row
     cannot drift apart (§53.5). `hit` carries the line that MATCHED and why
     it is here; a plain row carries the last line. */
  /* ── A ROW SAYS THE REGISTER'S NAME, AND WHERE THEY SIT (§288) ──────
     Islam, of the search: "the serach is bringing the full name and we
     agreed across the platform we use the short name from the registry and
     beside it the unit of the function for distinction."

     Right, and it is my own drift one section old. §187 shortened the name
     in the INBOX's list and put the place beside it; this corner is the
     THIRD builder onto the same rows and I drew `person_name` raw — the
     full legal name the server happened to store — with no place at all.
     §53.5, and the search was already half-corrected: `cqRows()` MATCHES on
     the short name (§93.8) and then drew the long one.

     IT NEEDS NOTHING FROM THE SERVER. `nameOf()` and `placeLabel()` resolve
     through the register the browser already holds, so a search hit — which
     carries only a key and a stored name — reads exactly like a queue row,
     which carries the register's fields as well. The row's own fields are
     the fallback for somebody the register no longer holds, which is the one
     case the browser cannot answer (§35: absent, never guessed). */
  function cqWho(row){
    return { name: nameOf(row.person_key, row.live_name || row.person_name) || row.person_key,
             place: chatPlaceOf(row) };
  }

  function cqRow(row, at, line, hit){
    var who = cqWho(row);
    /* NO TIME FOR SOMEBODY WHO HAS NEVER WRITTEN, because they have none —
       and the span goes rather than rendering empty (§35). The guard is not
       decoration: `new Date(null)` is the EPOCH and not an invalid date, so
       `when(null)` would print "1 Jan 00:00" against every such row. */
    return '<button class="cqrow" type="button" data-cqopen="' + esc2(row.person_key) + '"' +
      (row.fresh ? ' data-cqfresh="1"' : '') + '>' +
      '<div class="cqr1"><b>' + esc2(who.name) + "</b>" +
        (at ? '<span class="cqw">' + esc2(when(at)) + "</span>" : "") + "</div>" +
      (who.place ? '<div class="cqpl">' + esc2(who.place) + "</div>" : "") +
      '<div class="cqln">' + esc2(oneLine(line || "")) + "</div>" +
      (hit ? '<div class="cqhit">' + esc2(hit) + "</div>" : "") + "</button>";
  }

  function cqListHtml(){
    /* A FAILED ASK IS NOT AN EMPTY QUEUE (§93, §231.4). */
    if (cq.err) {
      return '<div class="cqfail"><b>We could not load the conversations.</b>' +
        "<p>" + esc2(cq.err) + " Nothing has been lost.</p>" +
        '<button class="chbtn" type="button" data-cqretry="1">Try again</button></div>';
    }
    if (cq.q && cq.q.length >= 2) {
      if (cq.searching && !cq.hits) return '<div class="cqzero">Looking\u2026</div>';
      var hits = cq.hits || [], folk = cq.people || [];
      if (!hits.length && !folk.length) return '<div class="cqzero">Nothing found for \u201c' +
        esc2(cq.q) + "\u201d.</div>";
      /* ── ONE LIST, NO HEADINGS (§290) ─────────────────────────────────
         Islam, of the two group headings drawn first: "who we have a
         conversation with will apear with the conversation and who is not
         will appear without the converstaion th header is taking unneede
         space." He is right and it is rule 1b-ii's own argument — a heading
         that restates what the rows already show is furniture, and in a body
         this small each one cost a whole row of the list.

         THE ROW SHAPE CARRIES IT: a conversation has a last message and a
         time, somebody who has never written has neither, and that is the
         difference somebody reads. THE ORDER CARRIES THE GROUPING —
         conversations by recency, then people by name — so it must never be
         interleaved.

         AND THE SCOPE LINE WENT WITH THEM. It said two things: how many, and
         where the search looked. The count was never needed (the list is the
         count), and where it looked moved into the box's own placeholder,
         which is read at the moment somebody decides to type and costs no
         row — while still saying it, because the Waiting half is the one lit
         and the results reach conversations that are answered (§35, §124). */
      return hits.map(function(h){
          return cqRow(h, h.line_at, h.line,
            h.is_last ? "" : ("found in an earlier message" +
                              (h.waiting ? "" : " \u00b7 answered")));
        }).join("") +
        folk.map(function(f){
          return cqRow({ person_key: f.key, person_name: f.name, live_name: f.name,
                         unit_key: f.unit_key, fn_key: f.fn_key, title: f.title,
                         fresh: true },
                       null, "", "");
        }).join("") +
        /* THE CAP SPEAKS AT THE FOOT, never in a heading: the top is where
           nobody has run out of anything yet, and this line only means
           something once somebody has read to the bottom without finding the
           person they wanted. It says what to do, not only what is missing. */
        (cq.more > 0
          ? '<div class="cqmore">' + cq.more + " more on the register \u2014 " +
            "narrow the search</div>"
          : "");
    }
    if (cq.rows === null) return '<div class="cqzero">One moment\u2026</div>';
    if (!cqRows().length) return '<div class="cqzero">Nobody is waiting on the office.</div>';
    return cqRows().map(function(r){
      return cqRow(r, r.last_at, r.last_body, "");
    }).join("");
  }

  function drawCorner(){
    var body = el("chatbody"); if (!body) return;
    /* THE CONVERSATION OPEN INSIDE THE QUEUE reads exactly as everybody
       else's does — the same builder, so a reply looks the same wherever it
       is read (§53.5). */
    if (cq.side === "wait" && cq.person) {
      var atEnd2 = body.scrollHeight - body.scrollTop - body.clientHeight < 40;
      body.className = "chatbody";
      body.innerHTML = cq.msgs.length
        ? threadHtml(cq.msgs, true, false)
        : '<div class="chempty"><p>One moment\u2026</p></div>';
      if (atEnd2) body.scrollTop = body.scrollHeight;
      return;
    }
    body.className = "chatbody cqbody";
    body.innerHTML = cqListHtml() +
      '<div class="cqfoot"><button class="cqinbox" type="button" data-cqinbox="1">' +
      "Open the Platform Inbox \u203a</button></div>";
  }

  function drawPanel(){
    var body = el("chatbody"); if (!body) return;
    /* THE OFFICE'S QUEUE IS A DIFFERENT SCREEN IN THE SAME BOX (§285) — and
       only ever for the office, and only on the Waiting half. Everything
       below is unchanged for everybody else, and for the office reading
       their own thread. */
    if (state.office && cq.side === "wait") { drawCorner(); drawPanelChrome(); return; }
    body.className = "chatbody";
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
    drawPanelChrome();
  }

  /* THE HEAD, THE BELL, THE BADGE AND THE FOOT — everything in the panel that
     is NOT the body, extracted so the office's queue and everybody's
     conversation cannot draw them differently (§53.5, §285). */
  function drawPanelChrome(){
    /* NO `var cfg` HERE. The module holds one, filled from the SERVER's answer
       on every poll, and this function reads `cfg.promise` and `cfg.shots`
       below — a local one shadows it and silently answers from the local
       graph instead, so the panel wore the shipped promise while the office
       had set its own. §56.7's `var` collision for the second time in one
       change, and found the same way: the check went red. */
    /* THE TITLE IS THE PERSON while a conversation is open inside the queue,
       with a way back — a header that still said "Strategy Office" over
       somebody else's messages would name the wrong side of the conversation. */
    var t = document.querySelector("#chatpanel .cht");
    if (t) {
      t.innerHTML = (state.office && cq.side === "wait" && cq.person)
        ? '<button class="cqback" type="button" data-cqback="1" ' +
            'aria-label="Back to the conversations">' +
            '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" ' +
              'stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" ' +
              'aria-hidden="true"><path d="M15 6l-6 6 6 6"/></svg>' +
            "<span>" + esc2(cq.name || cq.person) + "</span></button>"
        : "Strategy Office";
    }
    /* THE SPLIT AND THE SEARCH live between the head and the body, drawn only
       for the office and only on the list — a conversation open in the corner
       is a conversation, and a search box over it would filter nothing. */
    var slot = el("cqbar");
    if (slot) {
      slot.hidden = !state.office;
      slot.innerHTML = state.office
        ? cqSeg() + ((cq.side === "wait" && !cq.person) ? cqFind() : "")
        : "";
    }

    var sub = el("chatsub");
    if (sub && state.office && cq.side === "wait" && cq.person) {
      /* ── THE LINE IS NEVER EMPTY (§285.2) ─────────────────────────
         This said nothing on the queue's list, on the reasoning that the
         segment above had already named it — and an EMPTY line is a shorter
         header, so the panel changed height as you switched halves. Islam:
         "the 2 options have different panel sizes let's unify things."
         Measured: head 46 against 57, and the panel is anchored at the
         BOTTOM, so its top jumped as you moved between them.

         Reserving the space with a number would be a guessed constant that
         goes stale the first time the type scale moves (§122.5). The line
         simply always says something instead: whose conversation this is
         while one is open, and the office's own promise otherwise — which
         is what every other viewer's panel has always shown. */
      sub.innerHTML = '<span class="chatdot" style="background:var(--attn)"></span> ' +
        esc2("Waiting on the office");
    } else if (sub) {
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
    drawBell();

    var n = el("chatn");
    if (n) {
      /* ── THE BADGE COUNTS PEOPLE WAITING, FOR THE OFFICE (§285) ─────
         His decision, and it is the LENGTH OF THE LIST rather than a second
         count of the same thing — a badge saying seven over four rows is
         what gets reported as a bug (§108.1). Everybody else's badge is
         unchanged: a reply for you.

         AND IT IS SHOWN WHILE THE PANEL IS OPEN for the office, because the
         panel may be on "My messages" with people waiting on the other half
         — the one case where the number is news you cannot already see. */
      var num = state.office ? cqRows().length : state.unread;
      var hide = state.office ? !num : (!(state.unread > 0) || open);
      if (!hide) { n.hidden = false; n.textContent = String(num); }
      else n.hidden = true;
    }
    var pic = el("chatpic");
    if (pic) pic.hidden = !cfg.shots;
    /* ── THE PICTURE ITSELF, NOT A SENTENCE ABOUT IT (§286.2) ────────
       Islam, having pasted one: "the message is very subtle I didn't notice
       that something was attached." He was right — the whole confirmation was
       one line in the page's quietest grey, below the box, at the same weight
       as an empty space.

       He chose this from four drawn in the real composer. It shows the
       picture, because that is the part a sentence cannot replace: WHICH
       screenshot is about to go, which matters the moment somebody has taken
       three. And it sits ABOVE the composer, so the box being typed into does
       not move when a picture arrives.

       THE THUMBNAIL IS THE ALREADY-SHRUNK DATA (§50) — `shot` is what will be
       sent, so what is previewed is what goes, never a second rendering of the
       original file that could differ from it. */
    var prev = el("chatprev");
    if (prev) {
      prev.hidden = !shot;
      prev.innerHTML = shot
        ? '<img src="' + esc2(shot) + '" alt="">' +
          '<div class="chprev-t"><b>Screenshot attached</b>' +
          "<span>Sent with your next message</span></div>" +
          '<button class="chprev-x" type="button" data-chdrop="1" ' +
            'title="Remove this picture" aria-label="Remove this picture">' +
            '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" ' +
              'stroke-width="2.4" stroke-linecap="round" aria-hidden="true">' +
              '<path d="M6 6l12 12M18 6L6 18"/></svg></button>'
        : "";
    }

    var note = el("chatnote");
    if (note) {
      note.className = "chnote" + (lastErr ? " bad" : "");
      /* EMPTY WHEN THERE IS NOTHING TO SAY. It used to carry "the page you are
         on is sent with your message", which stopped being true the moment
         that stopped happening — and a sentence that is merely stale is worse
         than no sentence, because somebody believes it. */
      /* AND THE SENTENCE GOES WITH IT (§286.2, 1b-ii): the strip above says
         the same thing and shows the picture besides, so the line would be
         the product saying it twice — quietly, in the register somebody has
         already told us they do not read. An ERROR still speaks here, because
         that is not a description of state (§124). */
      note.textContent = lastErr ? lastErr : "";
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
        /* ── THE QUEUE ARRIVES WITH THE POLL (§285) ────────────────────
           ABSENT IS NOT EMPTY (§93, §231.4). `queue` is undefined for
           everybody but the office and null when the server could not read
           it — neither is "nobody is waiting", so the list keeps saying
           "one moment" rather than reporting an all-clear it never read. */
        if (state.office) {
          if (Array.isArray(j.queue)) { cq.rows = j.queue; cq.err = ""; }
          else if (j.queue === null) { cq.err = "The list could not be read."; }
        }
        /* THE FIRST ANSWER ENDS THE SHORT BEAT (§197). The interval was set
           before it arrived, so the clock is re-struck here — the same thing
           the cadence change below does, for the same reason. */
        var firstAnswer = !loaded;
        loaded = true;
        firstTries = 0;
        /* THE SETTINGS ARRIVE WITH THE ANSWER, so a switch the office flips
           reaches every open browser within one beat. If the cadence changed,
           the clock is reset — not on the next open, which could be tomorrow. */
        if (j.chat) {
          var wasBeat = cfg.beat;
          var wasPop = cfg.popup, wasKey = cfg.vapid;
          cfg = j.chat;
          if (cfg.beat !== wasBeat) beat();
          /* §231: THE COMPANY'S SWITCH REACHES EVERY BROWSER THROUGH THIS
             POLL, so this is where a device that must now subscribe — or must
             stop — finds out. Only when something actually moved: `pushSync`
             posts, and running it on every poll would be a request per beat
             for a state that changes about once a year. */
          if (cfg.popup !== wasPop || cfg.vapid !== wasKey) pushSync();
        }
        var dock = el("chatdock");
        /* OFF MEANS GONE (§98.2). Not disabled, not explaining itself — the
           corner is simply not there, and nothing polls, which is the whole
           saving. The panel is closed with it, or somebody reading a
           conversation when the office switched it off would keep the box. */
        if (dock) dock.hidden = !cfg.on;
        if (!cfg.on && open) setOpen(false);
        drawPanel();
        if (arrived && !open) { announce(); popShow(); }
        /* AND THE OFFICE IS TOLD WHEN SOMEBODY WRITES TO THEM (§225). Their
           corner is their OWN conversation, so nothing above this could ever
           speak for the queue — and the Platform Inbox's own clock stops the
           moment they navigate away (`boxBeat`), which is every page but one.
           This poll runs everywhere, so this is the only place it can live. */
        popOffice(j);
        /* The clock changes with the state, not only with the panel: somebody
           who has just been answered stops expecting and goes back to 180s. */
        if (firstAnswer || wasWaiting !== expecting()) beat();
        /* Opened, and something new arrived while it was open — read it. */
        if (open && state.unread > 0) post({ action:"seen" }, function(){ state.unread = 0; });
      } else if (j && (j.__status === 401 || j.__status === 403)) {
        /* NOT SIGNED IN, OR NOT PAST THE PASSWORD YET. Take the corner away
           rather than leaving a control that answers every press with a
           refusal, and stop asking. */
        var d = el("chatdock"); if (d) d.hidden = true;
        stop();
      } else if (!loaded) {
        /* THE SERVER DID NOT ANSWER, AND THAT IS NOT AN ANSWER (§197).
           Nothing is shown and nothing is hidden — we still do not know
           whether this tenant has the chat on, and guessing either way is
           worse than waiting: an optimistic bubble that vanishes on the next
           beat is a control that lied. What changes is only HOW SOON we ask
           again. Counted, so it cannot become a five-second poll for ever
           against a server that is down. */
        firstTries++;
        if (!firstRun()) beat();
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
    timer = setInterval(poll, firstRun() ? POLL_FIRST
      : open ? (cfg.beat || 4000)
      : (expecting() ? POLL_WAIT : POLL_SHUT));
  }

  /* ONE SHOT, AND THE CLASS IS TAKEN OFF AGAIN so the next reply can announce
     itself too. Everything about it is in CSS, including the respect for
     `prefers-reduced-motion` — a corner that jumps at somebody who has asked
     not to be jumped at is worse than a silent badge. */
  /* ── A BOX FROM THE COMPUTER WHEN A REPLY LANDS (§225) ──────────────────
     Islam: *"a browser notification for the platform messages — for the SMO
     when someone replies, and for the users when the SMO replies to them"*,
     wording B: who wrote, and the first line.

     THREE SWITCHES, AND ALL THREE MUST SAY YES. The company's (`cfg.popup`,
     the office's row in Chat settings), the person's own, and the browser's
     permission. They are genuinely three different decisions by three
     different people, so none of them stands in for another.

     THE PERSON'S IS PER DEVICE, in `localStorage` beside the theme and the
     column choices (§25, §47.1) — and per device is not a shortcut, it is
     the truth: the browser's permission is per device too, so a switch
     claiming to follow somebody everywhere would be off on the laptop and
     still silent on the iPad, whose Safari was never asked. The hover says
     "on this device" rather than leaving that to be discovered.

     STORED AS AN ABSENCE (§50.6): the key exists only while somebody has
     turned it OFF, so a browser that has never been asked and one switched
     back on are the same state, and a reader never creates what it looked
     for. A throwing store reads as ON — the same way round as §107's tour,
     because the failure that matters is nagging somebody who said no, and
     that requires the key to be PRESENT. */
  var POPKEY = "smp.chat.popup";
  function popMine(){
    try { return localStorage.getItem(POPKEY) !== "off"; }
    catch (e) { return true; }
  }
  function popMineSet(on){
    try { if (on) localStorage.removeItem(POPKEY);
          else localStorage.setItem(POPKEY, "off"); }
    catch (e) { /* a browser that will not store it simply keeps them on */ }
  }
  /* Whether the box could be shown at all — asked of the browser rather than
     assumed, because `Notification` does not exist in an iOS Safari tab (it
     is there only for a home-screen install) and reading `.permission` off
     `undefined` would throw on the one platform this is least able to serve. */
  function popCan(){
    return typeof window !== "undefined" && "Notification" in window;
  }
  function popState(){
    if (!popCan()) return "unsupported";
    return Notification.permission;              /* granted · denied · default */
  }
  /* ASKED ON A PRESS, NEVER ON ARRIVAL. Browsers only allow the question
     after a gesture, and a permission box thrown at somebody who has not
     asked for anything is the one people refuse out of reflex — and a
     refusal is theirs to undo, not ours, so it is worth spending once and
     spending it well. Called when the panel is OPENED (§225). */
  function popAsk(){
    if (!popCan() || !cfg.popup || !popMine()) return;
    if (Notification.permission === "default") {
      try {
        var q = Notification.requestPermission();
        /* AND SUBSCRIBE THE MOMENT THEY SAY YES (§231), not on the next
           paint: `requestPermission` resolves with the answer, and the
           gesture that opened the panel is what licensed the question. */
        if (q && q.then) q.then(function(){ pushSync(); drawBell(); });
      } catch (e) { /* the older callback shape; the next paint catches up */ }
      return;
    }
    pushSync();
  }

  /* What this browser will actually do, in one sentence — never what the
     switch says, which is the difference §231.2 exists to close. */
  function popStatusLine(companyOn){
    if (!companyOn) return "Nobody is notified. The away email still goes out.";
    var st = popState();
    if (st === "unsupported") {
      return "<b>This browser cannot show them</b> \u2014 on an iPhone or iPad, " +
             "add the platform to the home screen first.";
    }
    if (st === "denied") {
      return "<b>This browser is blocking them</b> \u2014 allow notifications for " +
             "this site in its settings.";
    }
    if (st === "default") {
      return "<b>This browser has not been asked yet</b> \u2014 open your own " +
             "conversation in the corner and allow them.";
    }
    if (PUSHWHY) return "<b>" + esc2(PUSHWHY) + "</b>";
    return PUSHED ? "Arriving on this device, with or without a tab open."
                  : "Allowed on this device, and registering\u2026";
  }

  /* ── A BOX THAT ARRIVES WITH NO TAB OPEN (§231) ───────────────────────
     §225 drew the box from this file, and measured across 45 seconds with the
     tab in the background it drew nothing at all: the poll stops dead while
     `document.hidden` (§98.1), so the only notification the product could
     deliver was one for somebody already looking at the screen that shows it.
     The server sends now, and the service worker receives — which is why it
     works with no tab open.

     THE SUBSCRIPTION IS THE SWITCH. There is no second flag anywhere saying
     "this device wants them": a device that has said yes has a row on the
     server, and turning the bell off deletes it (§50.6, §104.7). So this one
     function is called wherever any of the three switches might have moved,
     and it makes the server agree with what this browser actually holds. */
  var PUSHED = false;                 /* is THIS device subscribed, as of now */
  function pushCan(){
    return typeof navigator !== "undefined" && "serviceWorker" in navigator &&
           typeof window !== "undefined" && "PushManager" in window;
  }
  function b64(s){
    /* A VAPID key travels as url-safe base64 and `PushManager` wants bytes. */
    var pad = "=".repeat((4 - (s.length % 4)) % 4);
    var raw = atob((s + pad).replace(/-/g, "+").replace(/_/g, "/"));
    var out = new Uint8Array(raw.length);
    for (var i = 0; i < raw.length; i++) out[i] = raw.charCodeAt(i);
    return out;
  }
  /* ── THE PLATFORM REGISTERS ITS OWN WORKER (§231.5) ──────────────────
     §26 registered `sw.js` from the GATE ONLY, on the reasoning that one
     origin-wide scope covers both pages — true, and sufficient for as long as
     the worker only cached the shell, because the gate is the way in. It
     stopped being sufficient the moment a feature on the PLATFORM needed the
     worker to EXIST: a browser that has never completed a gate load (a fresh
     profile, a private window, a session that opened the platform directly,
     §32) has no registration, and `navigator.serviceWorker.ready` on such a
     browser NEVER RESOLVES.

     Islam, on a test account: the promise came back pending and stayed that
     way. Measured: 0 registrations, still pending after three seconds, and
     the bell reading ON the whole time.

     A HANG IS NOT A FAILURE, WHICH IS WHY IT WAS SILENT. It does not reject,
     so the `.catch` never runs and every caller believes it succeeded (§171's
     rule — a failed save that says nothing is the same fault). So this
     registers if nobody has, and RACES the wait against a clock, because a
     promise that may never settle must never be the only thing an outcome
     depends on. */
  var PUSHWHY = "";                 /* why this device is not set up, if it is not */
  function swReady(){
    if (!pushCan()) return Promise.resolve(null);
    var mine = navigator.serviceWorker.getRegistration()
      .then(function(reg){
        /* Registering twice is harmless — the browser returns the existing
           registration — so this never needs to know whether the gate got
           there first. */
        return reg || navigator.serviceWorker.register("/sw.js");
      })
      .then(function(){ return navigator.serviceWorker.ready; })
      .then(function(reg){ PUSHWHY = ""; return reg; });
    var clock = new Promise(function(done){
      setTimeout(function(){ done("slow"); }, 8000);
    });
    return Promise.race([mine, clock]).then(function(r){
      if (r === "slow") {
        PUSHWHY = "This browser has not finished setting up notifications.";
        return null;
      }
      return r;
    }).catch(function(e){
      PUSHWHY = "This browser refused to set up notifications.";
      return null;
    });
  }

  /* WHICH KEY A REGISTRATION WAS MADE WITH (§282.3), in the spelling the
     server hands out — base64url, no padding — so the two can be compared as
     strings. Absent on a browser that does not report it, which is a
     different answer from "a different key" and is treated as one. */
  var REKEYING = false;
  function subKey(sub){
    try {
      var k = sub && sub.options && sub.options.applicationServerKey;
      if (!k) return null;
      var b = new Uint8Array(k), out = "";
      for (var i = 0; i < b.length; i++) out += String.fromCharCode(b[i]);
      return btoa(out).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
    } catch (e) { return null; }
  }

  function pushSync(){
    if (!pushCan()) return;
    var want = !!(cfg.popup && popMine() && popState() === "granted");
    swReady().then(function(reg){
      if (!reg) { PUSHED = false; drawBell(); return; }
      return reg.pushManager.getSubscription().then(function(sub){
        if (!want) {
          if (!sub) { PUSHED = false; return; }
          /* TOLD BOTH WAYS ROUND. The browser forgets it and the server
             forgets it — a row left behind would go on being sent to a
             device that has thrown the key away, for ever. */
          var ep = sub.endpoint;
          return sub.unsubscribe().catch(function(){}).then(function(){
            PUSHED = false;
            post({ action:"pushOff", endpoint: ep }, function(){});
          });
        }
        if (sub) {
          /* ── AND IT MUST BE THE KEY WE ARE SENDING WITH (§282.3) ──────
             THIS BRANCH ACCEPTED ANY EXISTING REGISTRATION WITHOUT LOOKING
             AT IT, and that is a fault that can never heal on its own. A
             registration is bound to the key it was made with; if the
             platform's key has changed since — an environment variable added
             or removed, a key minted after a device had already subscribed —
             then the browser goes on handing back the OLD registration for
             ever, the bell reads on, the server counts the device, and every
             single send is refused by the push service. Everything reads
             healthy at both ends and nothing arrives, which is exactly the
             shape of "we tried many things and it still does not work".

             So it is compared, and a registration made with a different key
             is thrown away and made again. Costs the person nothing: the
             browser has already granted permission, so no question is asked.

             A BROWSER THAT WILL NOT SAY which key it used (no `options`) is
             left exactly as it is — churning a registration on a guess is
             worse than keeping one that is probably right (§35: unknown is
             not "wrong"). */
          /* NAMED `keyWanted`, NEVER `want` — `pushSync` already has a `want`
             (the boolean deciding whether this device should be subscribed at
             all), and a second `var want` in this callback HOISTS over it, so
             the `if (!want)` above reads `undefined`, takes the unsubscribe
             branch every time, and nothing ever subscribes. Valid on both
             sides, silent, and it shipped past `node --check` — §56.7's `var`
             collision, caught by `checks/office-chat.py` going red rather
             than by reading it. */
          var made = subKey(sub);
          var keyWanted = String(cfg.vapid || "").replace(/=+$/, "");
          if (made && keyWanted && made !== keyWanted && !REKEYING) {
            REKEYING = true;
            var stale = sub.endpoint;
            return sub.unsubscribe().catch(function(){}).then(function(){
              /* TOLD BOTH WAYS ROUND, as the switch-off path is: the row for
                 a registration that can never receive anything again is not
                 left behind to be sent to for ever. */
              post({ action: "pushOff", endpoint: stale }, function(){});
              REKEYING = false;
              return pushSync();          /* now with nothing subscribed */
            }).catch(function(){ REKEYING = false; });
          }
          /* ALREADY SUBSCRIBED, AND IT IS STILL SENT. A push service expires
             an endpoint on its own schedule and the server may have dropped
             a row it was told was gone; re-registering the same endpoint
             replaces its row rather than adding one, so this is free. */
          PUSHED = true;
          return post({ action:"pushOn", sub: sub.toJSON() }, function(){});
        }
        if (!cfg.vapid) {
          /* The platform could not make its own key, so there is nothing to
             subscribe to — not this browser's doing, and it must not read as
             this browser being set up. */
          PUSHED = false;
          PUSHWHY = "This platform has no notification key yet.";
          drawBell();
          return;
        }
        return reg.pushManager.subscribe({
          /* NOT OPTIONAL, AND NOT A PREFERENCE: every browser that supports
             push requires a visible notification for each one delivered, and
             refuses to subscribe without this being true. */
          userVisibleOnly: true,
          applicationServerKey: b64(cfg.vapid)
        }).then(function(made){
          PUSHED = true;
          PUSHWHY = "";
          post({ action:"pushOn", sub: made.toJSON() }, function(){});
          drawBell();
        }).catch(function(){
          /* THIS SWALLOWED IT, AND THAT WAS THE WHOLE FAULT AGAIN. The catch
             set the flag and said nothing, so the outer handler never saw the
             rejection and the bell went on reading ON and promising a box —
             measured, with `subscribe()` genuinely failing. §124's fault
             inside §231.5's own fix, found by driving it rather than by
             reading it. */
          PUSHED = false;
          PUSHWHY = "This browser could not register for notifications.";
          drawBell();
        });
      });
    }).catch(function(){
      /* Anything the push manager itself refused — a browser with the feature
         behind a flag, a private window that will not subscribe. Recorded so
         the bell and the settings row can say it rather than reading as on
         (§231.5, §124). */
      PUSHED = false;
      if (!PUSHWHY) PUSHWHY = "This browser would not register for notifications.";
      drawBell();
    });
  }
  /* WHO WROTE, AND THE FIRST LINE (Islam's wording B). The newest message is
     the one that just arrived; its author is resolved through the same
     `nameOf()` the thread uses, so a notification cannot name somebody the
     panel would call something else (§53.5). */
  function popShow(){
    if (!popCan() || !cfg.popup || !popMine()) return;
    if (Notification.permission !== "granted") return;
    /* NOT WHERE THE SERVICE WORKER IS ALREADY DOING IT (§231). One box, one
       source: on a subscribed device the server sends and the worker draws,
       and this drawing one too would give somebody two boxes for one message.
       This path is what still serves a browser where push could not be set
       up — and it is still bounded by the tab being visible, which is the
       whole reason §231 exists. */
    if (PUSHED) return;
    var m = state.messages[state.messages.length - 1];
    if (!m) return;
    var who = m.bot ? "Strategy Office \u00b7 Assistant"
            : (nameOf(m.by_key, m.by_name) || "Strategy Office");
    var line = String(m.body || "").replace(/\s+/g, " ").trim();
    if (line.length > 120) line = line.slice(0, 119) + "\u2026";
    try {
      /* ONE TAG, so a second reply REPLACES the first rather than stacking a
         column of boxes on somebody who has been away from the screen. */
      var n = new Notification(who, { body: line, tag: "smp-chat",
                                      icon: "/icons/icon-192.png" });
      n.onclick = function(){
        try { window.focus(); } catch (e) {}
        setOpen(true); drawPanel();
        try { n.close(); } catch (e) {}
      };
    } catch (e) { /* never let a notification break the poll it rides on */ }
  }

  /* THE BELL SAYS WHAT IS HAPPENING, AND IT IS WRITTEN INTO THE NODE (§63,
     §188). The head is never rebuilt while the panel is open, so this fills
     the button that is already there rather than replacing it.

     FOUR ANSWERS, THREE OF THEM DRAWN. The office off, or a browser with no
     Notification at all, and there is nothing here to decide, so the control
     is not drawn (§61). A browser that has REFUSED still gets a bell, struck
     through and marked `aria-disabled` — never `disabled`, or it takes no
     focus and the one sentence explaining the silence can never be reached
     (§221, §163). Otherwise it is this person's own switch. */
  var BELL_ON = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" ' +
    'stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' +
    '<path d="M18 8a6 6 0 1 0-12 0c0 7-3 9-3 9h18s-3-2-3-9"/>' +
    '<path d="M13.7 21a2 2 0 0 1-3.4 0"/></svg>';
  var BELL_OFF = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" ' +
    'stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' +
    '<path d="M18 8a6 6 0 1 0-12 0c0 7-3 9-3 9h18s-3-2-3-9"/>' +
    '<path d="M13.7 21a2 2 0 0 1-3.4 0"/><path d="m3 3 18 18"/></svg>';
  function drawBell(){
    var b = el("chatbell"); if (!b) return;
    var st = popState();
    if (!cfg.popup || st === "unsupported") { b.hidden = true; return; }
    b.hidden = false;
    var mine = popMine();
    /* FOUR STATES, AND THE FIRST BUILD DREW TWO (§231.2). It read `mine`
       alone, so a browser that had not yet been asked showed the bell ON with
       a hover promising a box that could never appear — §124's fault exactly,
       presence reported as proof, and it makes the whole of §231 look broken
       on a device that never answered the permission question. The bell says
       what will actually HAPPEN on this device, which is the only thing
       anybody is reading it for. */
    /* FIVE STATES. §231.5 adds the one that was reading as ON while doing
       nothing: the browser allowed them and never registered, which is a
       hang rather than a refusal and so said nothing at all. */
    var state = !mine        ? "off"
              : st === "denied"  ? "blocked"
              : st === "default" ? "ask"
              : PUSHWHY          ? "stuck"
                                 : "on";
    var on = (state === "on");
    b.innerHTML = on ? BELL_ON : BELL_OFF;
    b.classList.toggle("belloff", !on);
    b.setAttribute("aria-pressed", on ? "true" : "false");
    b.removeAttribute("aria-disabled");
    if (state === "blocked") {
      /* `aria-disabled`, NEVER `disabled` — a disabled button takes no focus,
         and the one sentence explaining the silence would then be reachable
         by hover alone (§221, §163). */
      b.setAttribute("aria-disabled", "true");
      b.title = "Your browser is blocking these boxes on this device. " +
                "Turn them back on in its site settings.";
      b.setAttribute("aria-label", "Notifications are blocked by this browser");
    } else if (state === "stuck") {
      /* Not their doing and not ours to switch — so it is said, and pressing
         it tries again rather than turning off something that never came on
         (§61, the same shape as "ask"). */
      b.title = PUSHWHY + " Press to try again.";
      b.setAttribute("aria-label", "Notifications are not set up on this device");
    } else if (state === "ask") {
      /* AND PRESSING IT ASKS, rather than switching off the thing that is not
         on yet — which is what the first build did, so the only control on
         the screen made it worse (§61). */
      b.title = "Your browser has not been asked yet. Press to allow boxes " +
                "on this device.";
      b.setAttribute("aria-label", "Allow notifications on this device");
    } else if (on) {
      b.title = "A box appears on this device when a message lands, even with " +
                "this tab in the background. Press to stop them here.";
      b.setAttribute("aria-label", "Stop notifications on this device");
    } else {
      b.title = "No box on this device when a message lands. " +
                "Press to turn them on here.";
      b.setAttribute("aria-label", "Notify me on this device");
    }
  }

  /* NOT WHILE THEY ARE LOOKING AT THE QUEUE. The Platform Inbox redraws every
     ten seconds and shows the name and the line already, so a box repeating it
     is noise — the same argument as `!open` above, one page out. */
  function popOffice(j){
    if (!j || !j.office) { lastWaiting = null; return; }
    var n = j.waiting | 0;
    var was = lastWaiting;
    lastWaiting = n;
    if (was === null || n <= was) return;
    if (el("chinbox")) return;
    if (!popCan() || !cfg.popup || !popMine()) return;
    if (Notification.permission !== "granted") return;
    if (PUSHED) return;                 /* the worker draws it (§231) */
    var who = j.waitingWho || "Somebody";
    var line = String(j.waitingBody || "").replace(/\s+/g, " ").trim();
    if (line.length > 120) line = line.slice(0, 119) + "\u2026";
    try {
      /* ITS OWN TAG, so a question waiting and a reply on the office's own
         conversation never replace one another. */
      var b = new Notification(who, { body: line, tag: "smp-chat-office",
                                      icon: "/icons/icon-192.png" });
      b.onclick = function(){
        try { window.focus(); } catch (e) {}
        try { b.close(); } catch (e) {}
        /* STRAIGHT TO THE QUEUE, through the platform's own control rather
           than a second copy of the navigation (§107). */
        var go = document.querySelector('[data-md="setup"]');
        if (go) go.click();
        setTimeout(function(){
          var r = document.querySelector('[data-setupgo="chat"]');
          if (r) r.click();
        }, 0);
      };
    } catch (e) { /* never let a notification break the poll it rides on */ }
  }

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
      /* THE PERMISSION IS ASKED ON A GESTURE AND NOWHERE ELSE — opening the
         panel is the moment somebody has shown they care about this
         conversation, and it is the only moment a browser will allow the
         question at all. It asks once; after that the answer is the
         browser's and ours to respect. */
      popAsk();
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
  /* ── WHAT A REPLY POSTS, BUILT ONCE (§53.5, §285) ────────────────────
     THE HTML IS BUILT HERE, BY THE ONE BUILDER (§72.3), and the server decides
     whether to actually send it and to WHOM — the browser sends content, never
     a recipient (§74.2).

     EXTRACTED BECAUSE THERE ARE TWO PLACES A REPLY IS NOW WRITTEN: the
     Platform Inbox and the corner's queue. A reply is a reply, so the email it
     chases with must be the same email — the moment the corner built a lesser
     one, somebody would be emailed differently depending on which screen the
     office happened to be looking at. */
  function replyPost(who, text){
    var body = { action: "reply", person: who, body: text };
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
    return body;
  }

  /* ── OPENING, REPLYING AND SEARCHING FROM THE CORNER (§285) ──────────
     Every one of these goes through an action the Platform Inbox already
     uses. Nothing new is authorised, nothing new is stored, and a rule the
     Inbox keeps is a rule the corner keeps by construction. */

  function cqOpen(key, name, fresh){
    cq.person = key; cq.name = name || key; cq.msgs = []; cq.fresh = !!fresh;
    drawPanel();
    var box = el("chatsay");
    /* WRITE, NOT REPLY, when there is nothing to reply to (§290, §124). */
    if (box) box.placeholder = (fresh ? "Write to " : "Reply to ") +
      (firstWord(cq.name) || "them") + "\u2026";
    /* AND NOTHING IS ASKED FOR A CONVERSATION THAT DOES NOT EXIST — the
       server would answer 404, correctly, and a 404 drawn as a failure would
       say something is wrong when nothing is (§93). The empty pane IS the
       state; the conversation is minted by the first message (§247). */
    if (fresh) return;
    post({ action: "thread", person: key }, function(err, j){
      if (cq.person !== key) return;          /* they moved on while it loaded */
      if (err || !j) { cq.msgs = []; drawPanel(); return; }
      cq.name = j.name || cq.name;
      cq.msgs = j.messages || [];
      drawPanel();
    });
  }

  function cqBack(){
    cq.person = null; cq.msgs = []; cq.name = ""; cq.fresh = false;
    var box = el("chatsay");
    if (box) box.placeholder = "Write to the office\u2026";
    drawPanel();
  }

  /* THE REPLY, WITH THE ECHO AND THE ROLL-BACK the ordinary send already has
     — what nobody can get back is what they typed (§139). */
  function cqSend(text){
    var who = cq.person, box = el("chatsay");
    sending = true; lastErr = "";
    var btn = el("chatsend"); if (btn) btn.disabled = true;
    var was = cq.msgs;
    cq.msgs = cq.msgs.concat([{ id: "echo", at: new Date().toISOString(),
      from_office: true, by_key: "", by_name: "", body: text, flag: null, echo: true }]);
    if (box) { box.value = ""; box.style.height = ""; }
    drawPanel();
    /* THE EMAIL IS BUILT HERE, with the one builder every message uses
       (§72.3) — content, never a recipient, which the server resolves from
       the stored register (§74.2). Without it a reply from the corner could
       never chase anybody, and the same reply from the Inbox could. */
    /* AND `start` IS WHAT MINTS THE CONVERSATION (§247's own flag, not a
       second endpoint) — so the chase, the box on their screen and leaving
       the waiting list all come free, and there is only ever one way to
       begin one (§53.5). The server checks the person is real and active;
       this only says which kind of send it is. */
    var payload = replyPost(who, text);
    if (cq.fresh) payload.start = true;
    post(payload, function(err, j){
      sending = false;
      if (btn) btn.disabled = false;
      /* IT EXISTS NOW, so a second message is an ordinary reply. */
      if (j && j.ok) cq.fresh = false;
      if (err || !j || !j.ok) {
        cq.msgs = was;
        if (box && !box.value) box.value = text;
        lastErr = err === NO_ANSWER
          ? "No answer from the server. The reply may still have gone."
          : ((j && j.error) || "That did not send.");
        drawPanel();
        return;
      }
      lastErr = "";
      /* THE CONVERSATION YOU ARE IN NEVER LEAVES THE LIST UNDER YOU (§113,
         and his own decision). Replying stops it waiting, so the next poll
         drops it from `cq.rows` — and it stays on screen because you are
         standing in it, and goes when you press back. */
      poll();
      cqOpenRefresh(who);
    });
  }

  function cqOpenRefresh(key){
    post({ action: "thread", person: key }, function(err, j){
      if (cq.person !== key || err || !j) return;
      cq.msgs = j.messages || cq.msgs;
      drawPanel();
    });
  }

  /* SEARCHING WAITS FOR A PAUSE, because every keystroke would otherwise be a
     question to the database — and it NEVER repaints from the box's own input
     handler beyond the list, or the field being typed into is replaced under
     the cursor (§35). */
  var cqFindTimer = null;
  function cqSearch(q){
    cq.q = q;
    if (cqFindTimer) clearTimeout(cqFindTimer);
    if (q.trim().length < 2) {
      cq.hits = null; cq.people = null; cq.more = 0;
      cq.searching = false; cqBodyOnly(); return;
    }
    cq.searching = true; cqBodyOnly();
    cqFindTimer = setTimeout(function(){
      var asked = q;
      post({ action: "chatSearch", q: q }, function(err, j){
        if (cq.q !== asked) return;           /* they have typed on since */
        cq.searching = false;
        cq.hits = (err || !j) ? [] : (j.hits || []);
        cq.people = (err || !j) ? [] : (j.people || []);
        cq.more = (err || !j) ? 0 : (j.more || 0);
        cqBodyOnly();
      });
    }, 300);
  }

  /* THE LIST ALONE, never the chrome — redrawing the bar would replace the
     search box mid-word (§71.2, §29.5). */
  function cqBodyOnly(){
    var body = el("chatbody");
    if (!body || !state.office || cq.side !== "wait" || cq.person) return;
    body.innerHTML = cqListHtml() +
      '<div class="cqfoot"><button class="cqinbox" type="button" data-cqinbox="1">' +
      "Open the Platform Inbox \u203a</button></div>";
  }

  function firstWord(n){ return String(n || "").trim().split(/\s+/)[0] || ""; }
  /* THE FIRST LINE OF A MESSAGE, for a row that has one line to give it.
     `firstLine` is api/chat.js's — a SERVER helper — and using its name here
     threw inside `cqListHtml()`, which left the body's class set and its
     contents empty: a corner that rendered as a blank box with no error on
     the page, because the throw was inside the poll's own callback. Found by
     driving it (§96, §231.5's family). */
  function oneLine(v){
    var t = String(v == null ? "" : v).replace(/\s+/g, " ").trim();
    return t.length > 160 ? t.slice(0, 160) + "\u2026" : t;
  }

  function send(){
    var t = el("chatsay"); if (!t || sending) return;
    var text = t.value.trim();
    if (!text && !shot) return;
    /* ── THE SAME BOX ANSWERS SOMEBODY ELSE (§285) ────────────────────
       With a conversation open inside the queue, this composer is a REPLY —
       to them, from the office — so it goes through `reply` and not `say`.
       One composer, because a second would be a second set of every rule
       around it: the echo, the roll-back, the attach button, the growing
       box (§53.5). */
    if (state.office && cq.side === "wait" && cq.person) { cqSend(text); return; }
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
    /* ── THE CORNER ARRIVES WITH THE PAGE (§290) ──────────────────────
       Islam: "a lag happened where the chat icon didn't apperar on the reload
       of the branch. and then appeard after."

       §197 created this hidden and revealed it only on a successful answer,
       for a good reason it stated: an optimistic bubble that vanishes on the
       next beat is a control that lied. That reason does not apply here,
       because THIS IS NOT A GUESS — the chat's on/off switch lives in
       `org.extra.chat`, the browser holds it as `GROUP.chat` by the time the
       page draws, and `chatSettings()` on the server reads that same value
       from that same row. Measured both ways on a real database: switched
       off, the browser reads {on:false} and the server reads {on:false}.

       SO IT IS ONLY EVER ASKED WHEN THE PLATFORM HYDRATED FROM THE SERVER
       (`SYNC.isLive()`), which is what makes it the tenant's answer rather
       than the baked example's — on file:// mount() never runs at all, and
       behind §201's wall the state is the demo's and this stays hidden and
       waits, exactly as before.

       AND NOBODY THE CHAT WOULD REFUSE CAN SEE IT: /api/state refuses a
       session that has not chosen a password (§43.2), so a page that
       hydrated is a person /api/chat will answer. A 401 or 403 still hides
       the corner on the first beat.

       THE POLL REMAINS THE AUTHORITY. This decides only what is drawn in the
       seconds before the first answer, which after a new build is the whole
       tenant at once on a cold server — the moment Islam was reporting. */
    dock.hidden = !chatOnFromState();
    dock.innerHTML = dockHtml();
    document.body.appendChild(dock);

    el("chatbtn").addEventListener("click", function(){ setOpen(!open); });
    el("chatclose").addEventListener("click", function(){ setOpen(false); });
    el("chatbell").addEventListener("click", function(){
      /* A REFUSED BROWSER IS NOT OURS TO ARGUE WITH — the hover says where to
         undo it and the press does nothing, which is why it is `aria-disabled`
         and not `disabled`: the sentence still has to be reachable. */
      if (this.getAttribute("aria-disabled") === "true") return;
      /* NOT ASKED YET: the press IS the gesture a browser requires, so it
         asks rather than switching off something that was never on (§231.2).
         Their switch is already on — this bell reads "ask" precisely because
         `popMine()` is true — so there is nothing to store. */
      if (popMine() && popState() === "default") { popAsk(); drawBell(); return; }
      /* Allowed, but this browser never registered (§231.5): try again rather
         than switch off the thing that never came on. */
      if (popMine() && PUSHWHY) { PUSHWHY = ""; drawBell(); pushSync(); return; }
      var on = !popMine();
      popMineSet(on);
      /* THE SERVER IS TOLD IN THE SAME BREATH (§231). The subscription IS
         this switch, so a bell pressed off that left a row behind would go on
         sending to a device whose owner has just said no. */
      pushSync();
      /* Turning them ON is the gesture the browser wants, so this is the
         second and last place the question is asked. */
      if (on) popAsk();
      drawBell();
    });
    el("chatsend").addEventListener("click", send);
    /* DELEGATED, because the message it sits on is redrawn by every poll — a
       handler bound to the button itself would be destroyed four seconds after
       it appeared (§24: whoever rewrites the DOM re-wires it, and the cheapest
       way to obey that is not to bind to the thing being rewritten). */
    /* ── THE CORNER'S QUEUE, WIRED ONCE (§285) ───────────────────────
       On the panel, never on each row: the list is rewritten on every poll,
       so a handler per row would be re-bound every few seconds and leak
       (§24, §47.2). Delegation costs nothing and cannot drift. */
    el("chatpanel").addEventListener("click", function(e){
      var t = e.target;
      if (!t || !t.closest) return;
      var seg = t.closest("[data-cqside]");
      if (seg) {
        cq.side = seg.dataset.cqside;
        /* LEAVING THE QUEUE LEAVES THE CONVERSATION, or coming back would
           land in somebody else's thread with "My messages" lit. */
        if (cq.side !== "wait") { cq.person = null; cq.msgs = []; }
        var box0 = el("chatsay");
        if (box0) box0.placeholder = (cq.side === "wait" && cq.person)
          ? box0.placeholder : "Write to the office\u2026";
        drawPanel();
        return;
      }
      var row = t.closest("[data-cqopen]");
      if (row) {
        var nm = row.querySelector("b");
        cqOpen(row.dataset.cqopen, nm ? nm.textContent : "",
               row.dataset.cqfresh === "1");
        return;
      }
      if (t.closest("[data-cqback]")) { cqBack(); return; }
      if (t.closest("[data-cqretry]")) { cq.err = ""; cq.rows = null; cqBodyOnly(); poll(); return; }
      if (t.closest("[data-cqinbox]")) {
        /* THE PLATFORM'S OWN CONTROL IS PRESSED, never a second navigation
           (§107: the tour navigates by pressing what is already there). */
        setOpen(false);
        var gear = document.querySelector('[data-md="setup"]');
        if (gear) gear.click();
        setTimeout(function(){
          var go = document.querySelector('[data-setupgo="chat"]');
          if (go) go.click();
        }, 0);
        return;
      }
    });
    /* Typing NEVER repaints past the list (§35). */
    el("cqbar").addEventListener("input", function(e){
      var f = e.target.closest && e.target.closest("#cqfind");
      if (f) cqSearch(f.value);
    });

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
    /* TAKING IT BACK OFF (§286.2). Wired on the foot rather than the button,
       because the strip is rewritten on every paint and a handler bound to the
       button inside it would be re-bound every few seconds (§24, §47.2). */
    document.querySelector("#chatpanel .chatfoot").addEventListener("click", function(e){
      if (!e.target.closest || !e.target.closest("[data-chdrop]")) return;
      shot = null; lastErr = "";
      var f = el("chatfile"); if (f) f.value = "";   /* or the same file cannot be picked again */
      drawPanel();
    });
    el("chatpic").addEventListener("click", function(){ el("chatfile").click(); });
    el("chatfile").addEventListener("change", function(){ takePicture(this.files && this.files[0]); });
    /* ── AND A PICTURE CAN SIMPLY BE PASTED (§286) ────────────────────
       Islam: "allow in the chat to copy paste a picture rather than only
       attaching it." Somebody reporting a number that looks wrong has just
       pressed the screen-grab key; making them save the file and then find it
       again is asking them to do the computer's job.

       IT FEEDS `takePicture()` AND NOTHING ELSE (§53.5). Everything §50
       settled about a picture — shrunk to 1600px, encoded both ways with the
       smaller kept, the failure said in words — happens because this is the
       same intake the attach button uses. A second path would be a second set
       of all of it.

       THE OFFICE'S REPLY BOX IS THE SAME BOX (§285), so this reaches the
       corner's queue side without a second listener.

       TEXT STILL PASTES AS TEXT: only an image item is taken, and
       `preventDefault` is called ONLY when one is found — a paste carrying
       both (a screenshot with a caption, which is what a rich editor puts on
       the clipboard) keeps its words and takes the picture too.

       AND WITH SCREENSHOTS TURNED OFF IT IS REFUSED IN WORDS, never silently
       dropped (§98.2): the office's switch decides, and the server would
       refuse it anyway — a paste that appeared to work and then vanished is
       worse than one that says no. */
    el("chatsay").addEventListener("paste", function(e){
      var d = e.clipboardData; if (!d) return;
      var items = d.items || [], file = null;
      for (var i = 0; i < items.length && !file; i++) {
        if (items[i].kind === "file" && /^image\//.test(items[i].type || "")) {
          file = items[i].getAsFile();
        }
      }
      /* Safari and the file managers put a real image on `files` without an
         `items` entry of kind "file" — asked second, because `items` is what
         carries a screenshot on every desktop browser. */
      if (!file && d.files && d.files.length && /^image\//.test(d.files[0].type || "")) {
        file = d.files[0];
      }
      if (!file) return;                       /* an ordinary paste, untouched */
      e.preventDefault();
      if (!cfg.shots) {
        lastErr = "Pictures are turned off for this platform.";
        drawPanel();
        return;
      }
      takePicture(file);
    });
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
    /* ── AND IT STAYS OPEN WHILE YOU MOVE ABOUT (§284, REVERSING §100.4)
       Islam: "we need the chat to sustain the navigation so it's open while
       me navigating across the different pages in the platform."

       §100.4 minimised the panel on any press outside the dock — his own
       earlier instruction, *"if I click outside the box minimise it please"* —
       and the two cannot both be true, because THE PLATFORM IS ONE PAGE.
       Measured rather than argued: with the corner open, one press on a page
       tab closed it. Every destination, tab, section, rail row and unit card
       is a press outside the dock, so "outside" was very nearly the whole
       product, and a rule that exempted navigation would be exempting
       everything except the empty margins.

       So it goes, and this is recorded as a REVERSAL rather than overwritten
       (Principle II): §100.4's reasoning was sound for a panel you dip into
       and leave, and it stopped being sound the moment the panel became
       somewhere you WORK — the office's queue (§285) is read while walking
       around the plan it is about.

       WHAT REPLACES IT IS WHAT WAS ALWAYS THERE: the minus, which says
       Minimise and does, and Escape below. Both are an act; neither can
       happen by accident. Nothing is ever lost either way — the panel is
       hidden rather than rebuilt, so a half-typed message survives (§100.4's
       own observation, still true and now doing more work). */
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
  /* §231.6: the same shape for notifications. Its own object, not a second
     mode of the assistant's — two diagnostics on one panel, and a shared one
     would make pressing either wipe the other's answer. */
  var POPTEST = { busy: false, steps: null };

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

        /* ── 5 · TOLD WHILE THEY ARE HERE (§225). Islam, correcting my first
           framing of it: *"the notification is when the person is opening the
           tab already and email when he is not opening the platform — what is
           the correlation here?"* None, and that is the point: they are
           complementary, not alternatives, so they sit together and each says
           which moment it covers.

           THE COMPANY SWITCH IS ONE OF THREE, and the row says so rather than
           implying this alone decides it: each person is asked by their own
           browser, and each has a bell in the conversation itself. */
        /* AND IT SITS ABOVE THE TWO EMAIL ROWS, NEVER BETWEEN THEM. §127's
           whole finding about this panel was that the two email settings had
           drifted five rows apart; the first build of this row put itself
           straight between them, and the check said so. All three answer "how
           is somebody told" — this one while they are here, those two when
           they are not — so it opens that group rather than splitting it. */
        setRow("popup", "Notifications",
          "A box from the computer the moment a reply lands \u2014 and, for the " +
          "office, the moment somebody writes in. It arrives with the platform " +
          "in another tab, behind another app, or with no tab open at all; on a " +
          "laptop the browser still has to be running somewhere. It shows who " +
          "wrote and the first line. This switch turns it on for the company; " +
          "each person is then asked once by their own browser, and each has a " +
          "bell in their own conversation to stop it on that device. On an " +
          "iPhone or iPad it works only where the platform has been added to " +
          "the home screen.",
          segHtml("popup", "Off", "On", c.popup, true),
          /* THE STATUS STAYS ON THE PAGE, like "No one is set" on the Handover
             email row (§127): this is a fact about right now, not a
             description of how the setting works, and behind a hover somebody
             turns it on, their own browser never allows it, and nothing ever
             says so. It is about THIS browser, because that is the only one
             this screen can honestly speak for. */
          '<div class="chset-hint">' + popStatusLine(c.popup) + '</div>' +
          /* IS IT WORKING? (§231.6, §123's shape). Every link in this chain
             fails invisibly, so "it does not work" was an errand with no
             address — this one presses the whole thing and says where it
             stopped. Only while the switch is on: a test of something
             switched off has one possible answer and it is on the row above
             (§61). */
          (c.popup
            ? '<div class="chset-test">' +
                '<button class="editbtn" data-chpoptest="1">' +
                (POPTEST.busy ? "Testing\u2026" : "Test on this device") + '</button>' +
                (POPTEST.steps ? testHtml(POPTEST.steps) : "") +
              "</div>"
            : "")) +

        /* ── 6 · TOLD WHEN THE ASSISTANT GIVES UP. Only while the assistant is
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

        /* ── 7 · AND TOLD WHEN THEY ARE NOT LOOKING. Beside its sibling at
           last; the two were five rows apart. */
        setRow("mail", "Away email",
          /* THE SENTENCE READS THE SETTING (§169). It said "three minutes" as
             prose while the server read a constant, so the two were one edit
             from disagreeing — and the edit is now a box on this very row. */
          /* AND THE SECOND HALF, WHICH IS THE ONE THAT WAS MISSING (§283):
             somebody PRESENT used to get nothing at all, for ever, if they
             then shut their laptop — the platform decided at the instant of
             replying and never looked again. The two numbers do different
             jobs and the sentence says both, in order. */
          "A reply is emailed when they have not had the platform open for " +
          plural(c.away, "minute") + ". Somebody who WAS here is chased " +
          plural(c.chase, "minute") + " later if they still have not read it — " +
          "and not at all if they have. Off keeps every conversation inside " +
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
              '</div>' +
              /* THE CHASE, ON THE SAME ROW AND NEVER ITS OWN (§127): it is
                 the same decision — whether and when a reply leaves the
                 platform — and a row of its own would read as a second
                 feature. Drawn only while the email is on, for the reason
                 above it. */
              '<div class="chset-ctl chset-away">' +
                '<input class="chset-num" type="number" data-chchase="1" ' +
                  'min="' + SMPRules.CHAT_CHASE_MIN + '" max="' + SMPRules.CHAT_CHASE_MAX + '" ' +
                  'value="' + c.chase + '" ' +
                  'aria-label="Minutes before an unread reply is chased">' +
                '<span class="chset-unit">' + plural(c.chase, "minute") + ' unread</span>' +
              '</div>'
            : "")) +

        /* ── 8 · THE ONLY ROW THAT CHANGES NOTHING ANYBODY SEES, so it is last.
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
          /* §247: THE CONTROL IS IN THE COLUMN IT ACTS ON — Islam's A, chosen
             from two placements drawn in this very page. The list it adds to
             is directly below it, and a conversation started here appears
             there. The cost was stated before he chose: the search box gives
             up about 60px. */
          '<div class="chqtop">' +
            '<input type="search" id="chqfind" placeholder="Search a name or a word…" ' +
              'aria-label="Search the conversations">' +
            '<button class="chqnew" id="chqnew" type="button" ' +
              'title="Write to somebody who has not written in">' +
              '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" ' +
              'stroke-linecap="round" aria-hidden="true"><path d="M12 5v14M5 12h14"/></svg>' +
              "<span>New</span></button>" +
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

  /* WHERE SOMEBODY SITS, ANSWERED ONCE FOR BOTH LISTS (§288, §53.5). The
     REGISTER first, because the browser holds it and a search hit carries
     nothing else; the row's own fields second, for a person the register no
     longer holds. Both ends arrive at `placeLabel()`, the navigation's own
     word (§93.12) — never a second vocabulary. */
  function chatPlaceOf(t){
    var at = null;
    try {
      var p = typeof personBy === "function" ? personBy(t.person_key) : null;
      if (p && typeof personAt === "function") at = personAt(p);
    } catch(e){}
    if (at === "group") at = null;
    if (!at) {
      if (t.unit_key) at = t.unit_key;
      else if (t.fn_key) at = "fn:" + t.fn_key;
    }
    if (!at || typeof placeLabel !== "function") return "";
    return placeLabel(at) || "";
  }

  function placeOf(t){
    var bits = [];
    var where = chatPlaceOf(t);
    if (where) bits.push(where);
    if (t.title) bits.push(t.title);
    if (t.gone) bits.push("no longer on the register");
    return bits.filter(Boolean).join(" · ");
  }

  /* THE ACTIVE REGISTER, with the place each person sits — the same two facts
     the plan's own owner picker shows (§130.9), read through the same
     functions so a name here is the name everywhere else (§53.5). A RETIRED
     person is left out: they cannot sign in, so a conversation with them is
     one nobody can read (§35). */
  function chatWhoChoices(){
    var out = [];
    try {
      var dn = displayNames();
      PEOPLE.forEach(function(p){
        if (!personActive(p)) return;
        var at = personAt(p);
        out.push({ key: p.key, name: knownName(p, dn),
                   where: at && at !== "group" ? placeLabel(at) : "" });
      });
    } catch (e) { return []; }
    return out.sort(function(x, y){ return x.name.localeCompare(y.name); });
  }

  function drawQueue(){
    var list = el("chqlist"); if (!list) return;
    var rows = boxRows();
    /* NOTHING WE COULD NOT FETCH IS REPORTED AS NOTHING THERE (§231.4).
       This comes FIRST, before every empty state below, because those all
       describe the DATA and this one describes the ASK — and with rows in
       hand it does not draw at all, so a poll that fails after a good one
       leaves the list somebody is reading exactly where it was. */
    if (box.err && !rows.length) {
      list.innerHTML = '<div class="chnothing chqfail">' +
        "<b>We could not load the conversations.</b> " + esc2(box.err) +
        " Nothing has been lost \u2014 this is about the connection, not " +
        "your conversations." +
        ' <button class="chlink" type="button" data-chretry="1">Try again</button>' +
        "</div>";
      return;
    }
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
    /* ── WRITING TO SOMEBODY WHO HAS NOT WRITTEN IN (§247) ────────────
       It is the THREAD pane, not a dialog: this is where a conversation is
       read and answered, and starting one is the same act with the name still
       to be chosen. Drawn first, because it replaces whatever was open. */
    if (box.new) {
      var who = chatWhoChoices();
      var opts = who.map(function(x){
        return '<option value="' + esc2(x.key) + '"' +
               (x.key === box.newWho ? " selected" : "") +
               (x.where ? ' data-hint="' + esc2(x.where) + '"' : "") + ">" +
               esc2(x.name) + "</option>";
      }).join("");
      pane.innerHTML =
        '<div class="chnew">' +
          '<div class="chnew-h">A new conversation</div>' +
          '<div class="chnew-f">' +
            '<label class="chnew-l" for="chnewwho">To</label>' +
            '<select id="chnewwho" class="chnew-sel">' +
              '<option value="">Choose somebody…</option>' + opts +
            "</select>" +
          "</div>" +
          '<div class="chnew-f chnew-grow">' +
            '<label class="chnew-l" for="chnewsay">Message</label>' +
            '<textarea id="chnewsay" class="chnew-ta" rows="5" ' +
              'placeholder="Write to them…"></textarea>' +
          "</div>" +
          '<div class="chnew-acts">' +
            '<button class="chsend" type="button" data-chnewsend="1">Send</button>' +
            '<button class="chnew-x" type="button" data-chnewcancel="1">Cancel</button>' +
          "</div>" +
          '<div class="chnote" id="chnewnote">' +
            "They will see it in the corner, get a box on their screen if they " +
            "have notifications on, and an email if they are away." +
          "</div>" +
        "</div>";
      /* The platform's own searchable dropdown, wired here because this pane
         is redrawn outside paint() (§45.5, §29.5: whoever rewrites the markup
         re-wires it). */
      try { if (typeof SEARCHSEL !== "undefined") SEARCHSEL.wire(); } catch (e) {}
      return;
    }

    var d = box.data;
    if (!d) {
      /* AND HERE TOO: "pick somebody on the left" is an invitation, and an
         invitation offered to somebody whose click just failed is the same
         lie one pane over (§231.4). */
      pane.innerHTML = '<div class="chnothing' + (box.err ? " chqfail" : "") + '">' +
        (box.err
          ? "<b>We could not open that conversation.</b> " + esc2(box.err) +
            " Nothing has been lost." +
            ' <button class="chlink" type="button" data-chretry="1">Try again</button>'
          : "Pick somebody on the left to read what they wrote and answer them.") +
        "</div>";
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
      /* A FAILED ASK IS NOT AN ANSWER (§93, §231.4). This returned in silence,
         so `box.threads` stayed as it started — empty — and the page went on
         to print "No conversations yet", which is a statement about somebody's
         DATA made when nothing was ever read. Islam, on that screen: "all
         conversations are gone!! what happened?" Nothing had; the endpoint was
         down (§231.3) and the list simply never loaded.

         §35's rule, on the surface where being wrong is most frightening: a
         dash means we have not asked, and it must never render as nought. */
      if (err || !j) {
        box.err = (err === "failed" || err === true)
          ? "We could not reach the server."
          : "The server did not answer (" + String(err) + ").";
        box.asked = true;
        drawQueue(); boxCounts(null);
        if (then) then();
        return;
      }
      box.err = null; box.asked = true;
      shellCount(j);
      box.threads = j.threads || [];
      drawQueue();
      boxCounts(j);
      if (then) then();
    });
  }
  /* ONE WRITER FOR THE TWO TAB COUNTS, so "we could not ask" cannot reach one
     of them and not the other (§53.5). A null is the dash. */
  function boxCounts(j){
    ["waiting", "flagged"].forEach(function(k){
      var n = document.querySelector('[data-chn="' + k + '"]');
      if (n) n.textContent = j ? String(j[k] || 0) : "\u2014";
    });
  }

  function boxLoadThread(who, then){
    post({ action:"thread", person:who }, function(err, j){
      /* THE SAME RULE ONE PANE OVER (§231.4). A conversation that could not be
         fetched left the pane on whatever it last held — or on its empty
         prompt — with nothing saying the ask had failed. */
      if (err || !j) {
        box.err = (err === "failed" || err === true)
          ? "We could not reach the server."
          : "The server did not answer (" + String(err) + ").";
        drawThread();
        if (then) then();
        return;
      }
      box.err = null;
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

  /* THE SAME SEND AS A REPLY, with `start` on it (§247). Everything that
     happens to a message from the office — the conversation leaving the
     waiting list, the email chase, the box on their screen — is written once,
     on the server, in the reply path; this only has to say who it is for and
     that the conversation may not exist yet. */
  function newSend(){
    var sel = el("chnewwho"), ta = el("chnewsay"), note = el("chnewnote");
    var who = sel ? sel.value : "";
    var text = ta ? ta.value.trim() : "";
    var say = function(t, bad){
      if (!note) return;
      note.className = "chnote" + (bad ? " bad" : "");
      note.textContent = t;
    };
    /* SAID, NOT DISABLED. A Send that is dimmed for a reason nobody states is
       the fault §221 records; this says which half is missing. */
    if (!who) { say("Choose who this is for.", true); if (sel) sel.focus(); return; }
    if (!text) { say("Write something to send.", true); if (ta) ta.focus(); return; }

    var btn = document.querySelector("[data-chnewsend]");
    if (btn) btn.disabled = true;
    say("Sending\u2026");

    var payload = { action:"reply", person:who, body:text, start:true };
    /* THE HTML IS BUILT BY THE ONE BUILDER (§72.3) and the server decides
       whether it goes and to whom — content, never a recipient (§74.2). */
    try {
      var sh = commsShape(), c = comms();
      payload.fromName = c.fromName || sh.org;
      payload.replyTo = c.replyTo || "";
      payload.subject = "A message from the Strategy Office";
      payload.html = MAIL.html({
        org: sh.org, accent: sh.accent, panel: sh.panel, footer: sh.footer,
        eyebrow: sh.eyebrow,
        title: "A message from the Strategy Office",
        preheader: text.slice(0, 140),
        body: text + "\n\nOpen the platform to answer.",
        cta: { label: "Open the platform", href: sh.href || "" }
      });
    } catch (e) { /* no mail builder here is not a reason to refuse the message */ }

    post(payload, function(err, j){
      if (btn) btn.disabled = false;
      if (err) { say(err === NO_ANSWER
        ? "No answer from the server. The message may still have gone \u2014 " +
          "their conversation will show it if it did."
        : err, err !== NO_ANSWER); return; }
      /* AND IT LANDS IN THE CONVERSATION IT JUST MADE, which is the only way
         to see that it actually went (§144's rule: a send lands on the
         record). The queue is reloaded too, because the row is new. */
      box.new = false; box.newWho = "";
      box.person = who;
      box.note = { text:
        j && j.here ? "Sent. They are on the platform and will see it now."
        : j && j.mailed && j.mailed.sent ? "Sent, and emailed to " + j.mailed.to + "."
        : j && j.mailed && j.mailed.why ? "Sent. No email went out \u2014 " + j.mailed.why + "."
        : "Sent." };
      if (typeof window !== "undefined" && typeof window.OVQUEUE !== "undefined")
        window.OVQUEUE = null;
      boxLoadQueue();
      boxLoadThread(who);
    });
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
    var body = replyPost(who, text);

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
      /* Pressed, not changed — a <button> never fires `change`, which is the
         fault §123.4 recorded about the assistant's own test button. */
      if (e.target.closest("[data-chpoptest]")) {
        if (POPTEST.busy) return;
        POPTEST.busy = true; POPTEST.steps = null; setMenuPaint();
        /* THIS DEVICE FIRST. The server can only report what it HOLDS, and a
           browser that has allowed notifications and never registered would
           otherwise be told "none of your devices is registered" without the
           platform having tried — so the registration is re-attempted, and
           the ask goes after it. */
        pushSync();
        setTimeout(function(){
          /* ── AND THIS BROWSER SAYS WHAT IT HOLDS (§282.4) ─────────────
             THE TEST ONLY EVER ASKED THE SERVER, and the server can only
             report what it HOLDS — so a browser subscribed to one address
             while the server sends to another read as perfect health at both
             ends, with nothing arriving. The two halves are now compared, and
             the one place they can be compared is here, because only this
             browser knows its own.

             NOTHING IDENTIFYING TRAVELS THAT DOES NOT ALREADY: the endpoint
             is what `pushOn` posts on every subscribe, and it is the row the
             server already stores. */
          var here = { permission: popState(), why: PUSHWHY || null,
                       endpoint: null, key: null };
          var askAfter = function(){
            post({ action:"pushTest", here: here }, done);
          };
          var done = function(err, j){
            POPTEST.busy = false;
            POPTEST.steps = (j && j.steps) || [{ name:"The platform", state:"fail",
              detail: err === "failed" ? "Could not reach the server."
                                       : String(err || "No answer.") }];
            setMenuPaint();
          };
          /* Asked of the browser, then sent — and if the browser will not
             answer, the ask still goes, because a diagnostic that refuses to
             run when one of its own questions fails is a diagnostic that is
             silent exactly when something is wrong (§231.5). */
          if (!pushCan()) { askAfter(); return; }
          navigator.serviceWorker.getRegistration()
            .then(function(reg){ return reg && reg.pushManager.getSubscription(); })
            .then(function(sub){
              if (sub) { here.endpoint = sub.endpoint; here.key = subKey(sub); }
              askAfter();
            })
            .catch(function(){ askAfter(); });
        }, 1200);
        return;
      }
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
        /* AND THE BELL IN THEIR OWN CORNER (§225), for the same reason the
           `on` branch below echoes locally: the office flipping this would
           otherwise press On and see no bell until their next poll. */
        if (seg.dataset.chset === "popup") {
          cfg.popup = chatCfg().popup; drawBell(); pushSync();
        }
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
      /* THE CHASE (§283), read the same way for the same reason. */
      var chase = e.target.closest("[data-chchase]");
      if (chase) {
        chatSet("chase", chase.value);
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
        /* Opening a conversation leaves the new-message form (§247) — the two
           are the same pane, and a half-written message is not worth keeping
           behind a screen that has moved on. */
        box.new = false; box.newWho = "";
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
      /* TRY AGAIN (§231.4). It asks for the queue AND, where one was open, the
         conversation — both failed together and both have to come back
         together, or pressing it fixes the list and leaves the pane beside it
         still saying the server is unreachable. */
      if (e.target.closest("[data-chretry]")) {
        box.err = null;
        drawQueue(); if (box.person) drawThread();
        boxLoadQueue();
        if (box.person) boxLoadThread(box.person);
        return;
      }
      /* ── STARTING ONE (§247) ────────────────────────────────────── */
      if (e.target.closest("#chqnew")) {
        box.new = true; box.newWho = ""; box.person = null; box.data = null;
        drawQueue(); drawThread();
        var sel0 = el("chnewwho"); if (sel0) sel0.focus();
        return;
      }
      if (e.target.closest("[data-chnewcancel]")) {
        box.new = false; box.newWho = "";
        drawThread();
        return;
      }
      if (e.target.closest("[data-chnewsend]")) { newSend(); return; }

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
    /* ── A REFUSAL'S WAY OUT, LOADED BUT NOT SENT (§231) ────────────────
       Islam, on the refusal dialog: *"a button to send to the office … and in
       this case the chat grabs the console error as well."*

       IT OPENS THE PANEL WITH THE MESSAGE WRITTEN AND DOES NOT SEND IT. The
       corner is a conversation with a colleague (§97), and a button that
       posts into it on somebody's behalf writes in their name without their
       reading it — which is how a person ends up having asked for something
       they did not mean. Loading the composer keeps every existing rule
       intact: the same `send()`, the same echo, the same waiting state, and
       the office receives an ordinary message.

       RETURNS WHETHER IT LANDED, because the caller's own control has to say
       something else when there is no corner to open — over `file://`, on a
       projector, or for somebody the server refused (§61: a button that
       cannot work is worse than no button). */
    compose: function(text){
      if (!servable() || !mounted) return false;
      setOpen(true);
      var t = el("chatsay");
      if (!t) return false;
      /* Appended, never assigned over: a half-typed sentence in there is
         somebody's and this is not the moment to throw it away (§35). */
      t.value = t.value.trim() ? t.value.replace(/\s*$/, "\n\n") + text : text;
      /* The grower is called ON the element, the way its own listener does
         (§188): it reads `this`, so passing the node as an argument would
         size whatever the composer happened to be last. */
      chGrow.call(t);
      t.focus();
      /* The caret at the end, so typing continues the message rather than
         landing in front of it. */
      try { t.setSelectionRange(t.value.length, t.value.length); } catch(e){}
      return true;
    },
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
