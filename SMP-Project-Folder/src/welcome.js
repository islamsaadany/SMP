/* ═══ THE WELCOME SCREEN (§148, spec 025) ════════════════════════════════
   One screen after sign-in, before the platform: who you are, whose platform
   this is, what is waiting on you, and the doors to each. Settled from three
   mockup rounds (design-mockups/welcome-screen/) — the greeting leads on the
   left, the tenant is a compact signature on the separator's edge, and no
   number ever stands without its noun (Islam: "the 3, 4, 1 numbers are
   confusing").

   THE RULES IT IS BUILT AROUND, all of them paid for elsewhere:

   - NOTHING NEW IS COMPUTED. Every row's facts are the same functions its
     destination page already calls — reportPending()/submitBlockers() for
     the cycle, gapTotal()/gapMap() for the plan's gaps (§145),
     CHAT.unread() for the corner, and the office's list IS the Setup
     Overview's own attentionRows() (§108.10). A welcome that counted for
     itself would disagree with the page it points at, on the one screen
     whose whole job is agreement (§53.5).

   - EVERY DOOR PRESSES THE PLATFORM'S OWN CONTROLS — [data-u], [data-s],
     [data-md], [data-setupgo], [data-s="report"] — never a second copy of the
     navigation (§107's rule, for the tour's reason). And every door runs
     BEHIND setTimeout(…, 0): the handler fires on a real click, §30.1's
     CLICKING guard holds any paint until the click lands, and a walk that
     runs inside the handler reads the page from before its own press —
     §145.14's fault, avoided rather than repeated.

   - NOTHING HERE EVER CALLS paint(). The screen is built once from the data
     at offer time; the two answers that arrive late (the corner's unread,
     the office inbox's waiting count) are written into the row they are
     about (§71.2).

   - ONCE PER BROWSER SESSION, remembered in sessionStorage like the tour's
     "skip for now" — a reload mid-morning does not greet you twice, a new
     session does. A THROWING STORE READS AS ALREADY SEEN (§107's rule): a
     screen that cannot remember being dismissed is a screen somebody meets
     on every reload for ever.

   - IT DEFERS TO NOTHING AND IS DEFERRED TO BY ONE THING: while it is up,
     land() does not auto-offer the tour — the intro-round card IS the offer
     (recorded in §148; TOUR.offer's own memory is untouched, so a build
     without the welcome offers the tour exactly as before).

   Offered from land() in sync.js beside TOUR.offer — the one door every
   boot path passes (§94.10) — so it exists only over http(s) with a signed
   in person, which also means the whole feature is invisible over file://
   and lives in checks/welcome.py, not qa.py (§94.11). */
var WELCOME = (function(){
  var box = null;

  /* Escapes >, " and ' as well, matching esc() — inert for the text this
     currently renders, and safe the moment any of it moves into an attribute
     (2026-09-01 security sweep). */
  function wesc(s){ return String(s).replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;").replace(/'/g,"&#39;"); }

  function seenThisSession(){
    try { return sessionStorage.getItem("smp.welcome.done") === "1"; }
    catch(e){ return true; }
  }
  function markDone(){ try { sessionStorage.setItem("smp.welcome.done", "1"); } catch(e){} }

  /* The register's row for the signed-in person — the API's person carries a
     key and a name, and everything else (attachment, roles, a typed short
     name) lives on the register (§93.8). */
  /* Is the screen being drawn for the person who actually signed in, or for
     somebody the SMO is viewing as? Only the session can answer it — the
     register row is the same row either way (§179). No SYNC means no
     simulation is possible, so it is true. */
  function isSelf(person){
    try {
      if (typeof SYNC === "undefined" || !SYNC.person) return true;
      var me = SYNC.person();
      return !me || !person || me.key === person.key;
    } catch(e){ return true; }
  }

  function rowFor(person){
    try { return (typeof personBy === "function" && personBy(person.key)) || person; }
    catch(e){ return person; }
  }
  function rolesOf(row){
    try { return (typeof personRoles === "function" && personRoles(row)) || []; }
    catch(e){ return []; }
  }
  function inOffice(rs){
    return rs.some(function(r){
      return (typeof SMPRules !== "undefined" && SMPRules.isOfficeRole)
        ? SMPRules.isOfficeRole(r.role)
        : (r.role === "super" || r.role === "smoteam");
    });
  }

  /* The real subjects this person answers for: where their roles are held
     plus where the register sits them — units and functions only, because
     the group and a company neither submit nor hold a plan (§59, §68). */
  function ownTargets(row, rs){
    var out = [];
    function add(t){
      if (!t || t === "group" || String(t).indexOf("co:") === 0) return;
      var real = String(t).indexOf("fn:") === 0
        ? !!(typeof FUNCTIONS !== "undefined" && FUNCTIONS[String(t).slice(3)])
        : !!(typeof UNITS !== "undefined" && UNITS[t]);
      if (real && out.indexOf(t) < 0) out.push(t);
    }
    rs.forEach(function(r){ add(r.at); });
    try { add(personAt(row)); } catch(e){}
    return out;
  }

  function subjectName(t){
    try { return placeLabel(t); } catch(e){ return String(t); }
  }

  /* ── THE DOORS ──────────────────────────────────────────────────────────
     Dismiss first, then walk on a fresh task (§30.1/§145.14, above). Every
     press is a null-checked click on a control the platform draws — a door
     whose control is missing does nothing louder than staying put, and the
     platform under the overlay is already on this person's own page
     (§94.6), so "nothing" is never a blank screen. */
  function press(sel){
    var b = document.querySelector(sel);
    if (b) b.click();
    return !!b;
  }
  function goPlace(t, tab, report){
    dismiss();
    setTimeout(function(){
      press('#units [data-u="' + t + '"]');
      var fn = String(t).indexOf("fn:") === 0;
      if (tab === "strategy") press('#subtabs [data-s="' + (fn ? "fnstrat" : "strategy") + '"]');
      if (tab === "performance") press('#subtabs [data-s="' + (fn ? "fnperf" : "performance") + '"]');
      /* §222: REPORTING IS A TAB NOW, so this door presses the tab rather
         than the button it used to. The button was deleted with the move and
         this selector went on matching nothing — which `press()` swallows by
         design, so the row landed on Performance and quietly stopped. §51.11
         in the PRODUCT rather than in a check: a control changed shape and a
         selector somewhere else went on failing silently, in the
         safe-looking direction. Caught by checks/welcome.py. */
      if (report) press('#subtabs [data-s="report"]');
      window.scrollTo(0, 0);
    }, 0);
  }
  function goSetup(page){
    dismiss();
    setTimeout(function(){
      press('#units [data-md="setup"]');
      /* The rail is painted by the press above; its rows are the one
         [data-setupgo] wiring (§108), pressed on the next task for the same
         reason the whole walk is deferred. */
      setTimeout(function(){ press('[data-setupgo="' + page + '"]'); window.scrollTo(0, 0); }, 0);
    }, 0);
  }
  function goGroup(){
    dismiss();
    setTimeout(function(){ press('#units [data-go="group"]'); window.scrollTo(0, 0); }, 0);
  }

  /* ── THE ROWS ─────────────────────────────────────────────────────────── */
  function actRow(title, subHtml, btnLabel, cta, onGo){
    var d = document.createElement("div");
    d.className = "wact";
    d.innerHTML = '<div class="wwhat"><b>' + wesc(title) + "</b>" +
      (subHtml ? "<span>" + subHtml + "</span>" : "") + "</div>" +
      '<button type="button" class="wbtn' + (cta ? " wcta" : "") + '">' +
      wesc(btnLabel) + "</button>";
    d.querySelector("button").addEventListener("click", onGo);
    return d;
  }

  function submitRows(targets){
    var rows = [];
    targets.forEach(function(t){
      var pending;
      try { pending = reportPending(t); } catch(e){ pending = false; }
      if (!pending) return;
      var parts = [], c, b;
      try {
        /* §240: asked by SHAPE, not by prefix — the same one reader the
           submit gate two lines below already uses. Asking differently here
           is what let this row say "every figure is entered" over a pillars
           function that had entered none. */
        c = subjectReported(t);
        var open = Math.max(0, (c.total | 0) - (c.done | 0));
        if (open) parts.push("<i>" + wesc(plural(open, "figure")) + "</i> still open");
        else parts.push("Every figure is entered");
      } catch(e){}
      try {
        b = submitBlockers(t);
        if (b.notes.length) parts.push('<em class="walert">' + b.notes.length +
          (b.notes.length === 1 ? " needs a note" : " need a note") + "</em>");
        if (b.pending.length) parts.push('<em class="walert">' + b.pending.length +
          " said In progress with no %</em>");
      } catch(e){}
      rows.push(actRow(
        "Submit " + subjectName(t) + "’s " + ((typeof REVIEW !== "undefined" && REVIEW.name) || "") + " report",
        parts.join(" · "), "Open reporting", true,
        function(){ goPlace(t, "performance", true); }));
    });
    return rows;
  }

  function gapRows(targets){
    var rows = [];
    targets.forEach(function(t){
      var n = 0, owed = [];
      try {
        if (!seesGaps(t)) return;
        n = gapTotal(t);
        if (n > 0) owed = gapMap(t).filter(function(e){ return e.count > 0; })
                             .map(function(e){ return e.label; });
      } catch(e){ return; }
      if (n <= 0) return;
      var names = owed.slice(0, 4).join(" · ") + (owed.length > 4 ? " · …" : "");
      rows.push(actRow(
        "Fill " + subjectName(t) + "’s missing plan elements",
        '<em class="walert">' + wesc(plural(n, "missing element", "missing elements")) + "</em>" +
          (names ? " — " + wesc(names) : ""),
        "Fill the gaps", false,
        function(){ goPlace(t, "strategy"); }));
    });
    return rows;
  }

  function replyRow(n){
    return actRow("The Strategy Office replied to you",
      wesc(n === 1 ? "1 unread reply" : n + " unread replies"),
      "Open the conversation", false,
      function(){
        dismiss();
        setTimeout(function(){
          try { if (typeof CHAT !== "undefined" && CHAT.open) CHAT.open(); } catch(e){}
        }, 0);
      });
  }

  /* THE OFFICE'S LIST IS THE OVERVIEW'S OWN (§108.10): attentionRows() gives
     the same rows the gear's landing page draws, destination included, and a
     count it has no answer for draws nothing rather than a zero. The chat
     row's count is server-side, so it is asked the way the Overview asks —
     CHAT.officeQueue, one reader of one endpoint — and written into the list
     when it answers. */
  function officeActs(list){
    var rows = [];
    try {
      attentionRows().forEach(function(r){
        if (r.k === "chat") return;   /* asked async below, same as the Overview */
        rows.push(actRow(r.text, "", "Open " + setupWord(r.dest), false,
          function(){ goSetup(r.dest); }));
      });
    } catch(e){}
    try {
      if (typeof CHAT !== "undefined" && CHAT.officeQueue) {
        CHAT.officeQueue(function(err, q){
          if (err || !q || !(q.waiting > 0) || !box) return;
          var row = actRow(plural(q.waiting, "conversation") + " waiting for an answer",
            "", "Open the inbox", false, function(){ goSetup("chat"); });
          unEmpty(list);
          list.insertBefore(row, list.firstChild);
        });
      }
    } catch(e){}
    return rows;
  }
  /* The rail's own word for a destination, off the defs the rail draws from —
     rename a page there and this follows (§108.3). */
  function setupWord(k){
    try {
      var d = setupDefs().filter(function(x){ return x.k === k; })[0];
      if (d) return d.label;
    } catch(e){}
    return "Setup";
  }

  /* ── WHAT IS WAITING, WITHOUT DRAWING THE SCREEN (§197.2) ─────────────
     Islam: *"it can be option E when there is no actions waiting there and
     it turns gold when there is action required, so the SMO or any other
     team can notice the difference and go for actions."*

     SO THE MARK HAS TO ASK THE SCREEN'S OWN QUESTION. A house that goes gold
     on one list and opens a screen built from another is the fault §16.7
     names: a signal that cannot take you to what it signals. It counts the
     SAME BUILDERS the screen draws from — `submitRows`, `gapRows` and
     `attentionRows()`, the last of which is the Setup Overview's list too,
     so three surfaces now answer from one (§108.10, §116.2, §53.5).

     THEY BUILD DETACHED ROWS AND ARE ASKED FOR THEIR LENGTH. Counting by
     repeating their tests would be a second copy of every one of them, and
     the two would drift the first time a row gained a condition; a handful
     of nodes per paint is the price of that never happening.

     THE CHAT IS READ FROM MEMORY, NEVER FETCHED. `CHAT.unread()` is whatever
     the corner's last poll left behind, and the office's side rides
     `attentionRows()`'s own chat row (which draws nothing until OVQUEUE has
     answered, §108.10) — asking the server once per paint would put a
     network request in the navigation bar. The cost, stated: a reply that
     lands between paints turns the mark gold on the NEXT paint, not the
     instant it arrives. */
  function waiting(person){
    if (!person) return 0;
    var n = 0;
    try {
      var row = rowFor(person), rs = rolesOf(row), targets = ownTargets(row, rs);
      n += submitRows(targets).length;
      n += gapRows(targets).length;
      if (inOffice(rs)) {
        try { n += attentionRows().length; } catch(e){}
      }
      try {
        if (typeof CHAT !== "undefined" && CHAT.unread && CHAT.unread() > 0) n++;
      } catch(e){}
    } catch(e){ return 0; }
    return n;
  }

  /* ── LATE ANSWERS LAND IN PLACE (§71.2) ──────────────────────────────── */
  function unEmpty(list){
    var e = list.querySelector(".wempty");
    if (e) e.remove();
    /* A row arriving late means the exit is no longer the only act on the
       screen, so it gives the fill back (§41). */
    var x = box && box.querySelector("[data-wcontinue]");
    if (x) x.classList.remove("wloud");
  }
  function watchReplies(list){
    /* The corner's first poll is in flight while this screen is built, so
       the unread count is asked again shortly rather than trusted at t=0 —
       and only ever ADDS a row: an answer of nothing changes nothing. */
    var asked = 0;
    function ask(){
      if (!box) return;
      var n = 0;
      try { n = (typeof CHAT !== "undefined" && CHAT.unread) ? CHAT.unread() : 0; } catch(e){}
      if (n > 0) {
        if (!list.querySelector(".wact-reply")) {
          var row = replyRow(n);
          row.classList.add("wact-reply");
          unEmpty(list);
          list.appendChild(row);
        }
        return;
      }
      if (++asked < 3) setTimeout(ask, 2500);
    }
    ask();
  }

  /* ── THE CYCLE, FOR WHOEVER MAY ALREADY SEE IT (§200) ─────────────────
     Islam: *"the cycle statistics table is already needed there."* He is
     right — the welcome screen is where you land, and the cycle is the thing
     the whole reporting half of the product turns on.

     WHO MAY SEE IT IS THE QUESTION, NOT WHERE IT GOES. `cycleTotals()` counts
     every unit AND every supporting function in the business (§105), and the
     page that shows it — Reporting cycle — is access-gated on `c_cycle`. A
     unit head does not normally hold that key. So putting the business-wide
     figures on EVERYONE's welcome screen would show the whole company's
     reporting state to people the platform deliberately does not show it to:
     a genuinely new disclosure, arriving as a side effect of a layout idea.

     It is therefore gated on the key that already answers the question, and
     the gate is asked HERE rather than by hiding a control (§42, §44): a
     viewer without it gets exactly the screen they get today.

     NOTHING NEW IS COUNTED. It is `cycleTotals()` and `cycleMeta()` — the
     same pair the Setup Overview's own column reads (§198) and the Reporting
     cycle page opens with (§108.9) — so three surfaces cannot disagree about
     one cycle. And it is the SAME SHAPE as the Overview's column, because
     "the cycle, as context" should look like itself wherever it appears
     (§53.5).

     A SECOND STEP WAS DRAWN AND DELIBERATELY NOT BUILT: a per-person block
     ("Mobile — 12 of 18 reported · not submitted · 14 days left") would serve
     the eleven unit and function heads who are not the office far better.
     Islam: *"start with A for now."* It is a different thing to keep true,
     and it should be its own decision rather than ride along with this one. */
  function cycleBlock(){
    try {
      if (typeof REVIEW === "undefined" || !REVIEW) return "";
      if (typeof grant !== "function" || grant("c_cycle") === "none") return "";
      var t = cycleTotals();
      var open = REVIEW.state === "open";
      return '<div class="wcyc">' +
        "<h4>" + wesc(REVIEW.name || "") +
          ' <span class="wbdg ' + (open ? "wb-open" : "wb-shut") + '">' +
          (open ? "Open" : "Closed") + "</span></h4>" +
        cycLine("Reported", t.done + " of " + t.total) +
        cycLine("Submitted", String(t.sub)) +
        cycLine("In progress", String(t.progress)) +
        (t.none ? cycLine("Not started", String(t.none), true) : "") +
        '<p class="wcycmeta">' + wesc(cycleMeta()) + "</p>" +
        "</div>";
    } catch(e){ return ""; }
  }
  function cycLine(label, value, late){
    return '<div class="wcycline"><span>' + wesc(label) + "</span>" +
      "<b" + (late ? ' class="wlate"' : "") + ">" + wesc(value) + "</b></div>";
  }

  /* ── THE SCREEN ──────────────────────────────────────────────────────── */
  function build(person){
    var row = rowFor(person), rs = rolesOf(row), office = inOffice(rs);
    var targets = ownTargets(row, rs);

    var name = "";
    try { name = SMPRules.firstName(row); } catch(e){}
    if (!name) name = String(row.name || person.name || "").split(/\s+/)[0] || "";

    var chips = rs.slice(0, 3).map(function(r){
      var where = "";
      try { where = roleWhereLabel(r.at); } catch(e){ where = String(r.at || ""); }
      return '<span class="wchip">' + wesc(roleName(r.role)) +
             (where ? " · " + wesc(where) : "") + "</span>";
    });
    if (!chips.length) {
      var at = null;
      try { at = personAt(row); } catch(e){}
      if (at) chips.push('<span class="wchip">' + wesc(subjectName(at)) + "</span>");
    }
    var open = typeof REVIEW !== "undefined" && REVIEW && REVIEW.state === "open";
    /* §200: THE CHIP GOES WHERE THE BLOCK IS DRAWN. It said "H1 2026 cycle is
       open" and the summary below says that and four numbers; two places
       saying it is how a screen starts repeating itself (§87's twins). Kept
       for everybody the block is NOT drawn for, because for them it is still
       the only thing that names the cycle at all. */
    var cyc = cycleBlock();
    if (open && !cyc) chips.push('<span class="wchip wcycle"><i></i>' +
      wesc((REVIEW.name || "The") + " cycle is open") + "</span>");

    var org = "";
    try { org = GROUP.org || ""; } catch(e){}
    var initials = org.split(/\s+/).map(function(w){ return w.charAt(0); })
                      .join("").slice(0, 2).toUpperCase();

    box = document.createElement("div");
    box.className = "welcomeover";
    box.setAttribute("role", "dialog");
    box.setAttribute("aria-label", "Welcome");
    box.innerHTML =
      '<div class="wwrap">' +
        '<div class="whero">' +
          '<div class="wgreet">' +
            '<p class="wkick">Strategy Management Platform</p>' +
            "<h2>Welcome" + (name ? ", " + wesc(name) : "") + "</h2>" +
            '<div class="wwho">' + chips.join("") + "</div>" +
          "</div>" +
          '<div class="wtenant">' +
            (initials ? '<div class="wmark">' + wesc(initials) + "</div>" : "") +
            "<h1>" + wesc(org || "") + "</h1>" +
            '<div class="woffice">Strategy Management Office</div>' +
          "</div>" +
        "</div>" +
        '<div class="wcols">' +
          '<div class="wmain">' +
            '<p class="wseclab">Waiting on you</p>' +
            '<div class="wacts"></div>' +
          "</div>" +
          '<div class="wside">' +
            '<div class="wpagesbox"><p class="wseclab">Your pages</p>' +
              '<div class="wcard wpages"></div></div>' +
            cyc +
            /* ── THE INTRO ROUND FOLDS (§202) ────────────────────────────
               Islam: *"make the take an intro round a by default collapsed
               box that expands on a click and collapse on a click as well."*
               It is the ONE thing on this screen that is not waiting on
               anybody — the two columns above it are work, and a card
               spending four lines on an optional two-minute walk reads as
               loudly as they do. Closed it is one line that still says the
               round exists, which is the whole of what it has to do until
               somebody wants it (§41's budget, on space rather than colour).

               THE HEADING IS THE CONTROL, not a caret beside it: a title
               with a fold arrow to its right gives two targets for one act
               and the smaller one is the one people press (§32). `hidden`
               on the body, never `display` (the shell's own rule), and
               `aria-expanded` on the button so the state is announced. */
            '<div class="wtour" hidden>' +
              '<button type="button" class="wtoggle" data-wtoggle ' +
                'aria-expanded="false">' +
                "<h3>Take an intro round</h3>" +
                '<span class="wtcar" aria-hidden="true">›</span>' +
              "</button>" +
              '<div class="wtourbody" data-wtourbody hidden>' +
                "<p>A short walk of the platform on the worked example — about two minutes.</p>" +
                '<div class="wtourbtns">' +
                  '<button type="button" class="wtbtn" data-wtour>Start the round</button>' +
                  '<button type="button" class="wtghost" data-wnotnow>Not now</button>' +
                "</div>" +
              "</div>" +
            "</div>" +
          "</div>" +
        "</div>" +
        /* THE WAY OUT SPANS BOTH COLUMNS (§159): inside .wwrap and AFTER
           .wcols, so its scope is the screen rather than the list it used to
           end — and so it is last at every width, including the stacked
           layout below 960px, where the side column falls beneath the left
           one and a control living in that column is stranded mid-screen. */
        '<button type="button" class="wexit" data-wcontinue>' +
          '<span class="wexlab"></span><span class="wgo">\u203a</span>' +
        "</button>" +
      "</div>";

    var list = box.querySelector(".wacts");
    var acts = office ? officeActs(list)
                      : submitRows(targets).concat(gapRows(targets));
    /* THE REPLY ROW IS THE SIGNED-IN PERSON'S AND CANNOT BE SIMULATED (§179).
       There is one conversation per person and it belongs to the SESSION, not
       to the view (§97) — so while viewing as somebody else `CHAT.unread()`
       still answers about YOU, and drawing it would put your unread messages
       on their screen under their name. It is left out rather than shown wrong:
       a row that lies is worse than a row that is missing, and the office's own
       rows below are tenant-wide, so they simulate honestly. */
    if (!office && isSelf(person)) {
      var un = 0;
      try { un = (typeof CHAT !== "undefined" && CHAT.unread) ? CHAT.unread() : 0; } catch(e){}
      if (un > 0) { var rr = replyRow(un); rr.classList.add("wact-reply"); acts.push(rr); }
    }
    if (!acts.length) {
      /* An empty list says so (§45.2) — and says only what it knows: nothing
         of what THIS list asks is waiting. The async answers above may still
         add a row, and they remove this line when they do. */
      var empty = document.createElement("div");
      empty.className = "wact wempty";
      empty.innerHTML = '<div class="wwhat"><b>Nothing is waiting on you</b></div>';
      list.appendChild(empty);
      box.querySelector("[data-wcontinue]").classList.add("wloud");
    }
    acts.forEach(function(a){ list.appendChild(a); });
    if (!office && isSelf(person)) watchReplies(list);

    /* ── Your pages ─────────────────────────────────────────────────── */
    var pages = box.querySelector(".wpages");
    function pageLink(label, small, onGo){
      var a = document.createElement("a");
      a.href = "#";
      a.innerHTML = wesc(label) + (small ? " <small>" + wesc(small) + "</small>" : "") +
        '<span class="wgo">›</span>';
      a.addEventListener("click", function(ev){ ev.preventDefault(); onGo(); });
      pages.appendChild(a);
    }
    if (office) {
      pageLink("Setup — Overview", "", function(){ goSetup("overview"); });
      pageLink("The group — Performance", "", function(){ goGroup(); });
    } else {
      var home = targets[0] || null;
      if (home) {
        var nm = subjectName(home);
        var isFn = String(home).indexOf("fn:") === 0;
        pageLink(nm + " — Strategy", isFn ? "" : "Plan · Foundation · SWOT",
          function(){ goPlace(home, "strategy"); });
        pageLink(nm + " — Performance", "", function(){ goPlace(home, "performance"); });
        var canRep = false;
        try { canRep = open && canSpeakFor(home); } catch(e){}
        if (canRep) pageLink(nm + " — Reporting", "",
          function(){ goPlace(home, "performance", true); });
      } else {
        box.querySelector(".wpagesbox").hidden = true;
      }
    }

    /* ── The intro round ────────────────────────────────────────────────
       Offered to whoever the tour has a story for — TOUR.storyFor is the
       one answer to that (never the office, §118) — and starting it is a
       handoff: the welcome puts itself away and the tour takes the screen.
       This card is also the tour's reachable home again: its replay had
       lived on a page most people can no longer open (§119.4). */
    var storyKey = null;
    try { storyKey = (typeof TOUR !== "undefined" && TOUR.storyFor) ? TOUR.storyFor(row) : null; }
    catch(e){}
    var tourCard = box.querySelector(".wtour");
    if (storyKey) {
      tourCard.hidden = false;
      tourCard.querySelector("[data-wtour]").addEventListener("click", function(){
        var k = storyKey;
        dismiss();
        setTimeout(function(){ try { TOUR.start(k); } catch(e){} }, 0);
      });
      tourCard.querySelector("[data-wnotnow]").addEventListener("click", function(){
        tourCard.hidden = true;
      });
      /* THE FOLD (§202). One handler on the heading, reading the state off
         the body rather than keeping a flag beside it — two copies of "is it
         open" is how a card ends up drawn open and announced shut (§53.5). */
      var tbtn = tourCard.querySelector("[data-wtoggle]");
      var tbody = tourCard.querySelector("[data-wtourbody]");
      tbtn.addEventListener("click", function(){
        var openNow = tbody.hidden;
        tbody.hidden = !openNow;
        tbtn.setAttribute("aria-expanded", openNow ? "true" : "false");
        tourCard.classList.toggle("wtopen", openNow);
      });
    }

    /* ── Continue ───────────────────────────────────────────────────────
       The platform under this screen is already on the page §94.6 chose, so
       Continue only steps aside — and names where that is. The drawing
       carried a grey "Strategy · Plan" under the name and it is deliberately
       not built: the label already names the destination, and the second
       line would mean re-adding the navigation-word reader §99 deleted. */
    /* AND SETUP IS A PLACE TOO (§202). Islam: *"the continue button should
       show continue to the function or BU name."* It already did for a unit,
       a function, a company and the group — and read a bare "Continue" from
       Setup, which is where the house button now sits beside the gear
       (§193.2), so it is a common way in rather than an edge. Measured
       before it was changed: `mobile` → "Continue to Mobile", `fn:finance` →
       "Continue to Finance", `setup` → "Continue". The word is the
       navigation's own; `placeLabel` does not answer for Setup because Setup
       is not a place a ROLE is held, which is what that function is for. */
    var here = null;
    try { here = typeof current !== "undefined" ? current : null; } catch(e){}
    var word = "Continue";
    if (here === "setup" || here === "manage") word = "Continue to Setup";
    else if (here) {
      try { word = "Continue to " + subjectName(here); } catch(e){}
    }
    var cont = box.querySelector("[data-wcontinue]");
    cont.querySelector(".wexlab").textContent = word;
    cont.addEventListener("click", function(ev){ ev.preventDefault(); dismiss(); });

    viewerBar(box);
    document.body.appendChild(box);
    /* AFTER the box is in the document, or there is nothing to enhance: the
       switcher is 33 people and searchsel takes over any select past five
       (§45.5). Its popup is `.sspop` at z-index 120, above this overlay's 60,
       so it opens over the screen rather than under it — checked, not assumed. */
    try { SEARCHSEL.wire(); } catch(e){}
  }

  /* ── VIEWING AS, ABOVE THE GREETING (§179) ───────────────────────────────
     Islam: "the viewing as should be available from the welcome screen." It
     could not be reached at all — this overlay covers the viewport, so the
     control in the bar underneath is behind it (§167.2 recorded the same
     screen swallowing clicks meant for the page).

     ABOVE THE HERO, NOT INSIDE IT — Islam's pick from two drawn placements.

     WHO GETS IT IS ASKED, NEVER RE-TESTED: `SYNC.isSMOSession()` is the same
     function the chrome's own switcher asks, so the two can never disagree
     about who the SMO is, and it FAILS CLOSED — no SYNC, no answer, no
     control. A switcher shown to somebody who is not the SMO would serve them
     another person's screen wearing their own name, which is the worst reading
     available (sync.js says so at length; this does not restate the rule, it
     asks it).

     THE OPTIONS ARE THE CHROME'S OWN, cloned rather than rebuilt: fillViewers()
     already settles what a person is called here (`knownName` through
     `displayNames`, so a colliding pair reads apart) and where they sit
     (`placeLabel`, the navigation's word). Building a second list would be a
     second vocabulary for one question (§53.5, §142).

     NEVER A CLONE OF THE SELECT ITSELF — that would put `id="asWho"` in the
     document twice, and `getElementById` then answers with whichever came
     first. This is its own element with its own id, and it DRIVES the chrome's
     one instead of repeating what it does: setting the value and firing
     `change` runs the shell's single handler (leaveModes, VIEWER, repaint),
     so a change made to that handler tomorrow reaches this control for free. */
  function viewerBar(over){
    var smo = false;
    try { smo = !!(typeof SYNC !== "undefined" && SYNC.isSMOSession && SYNC.isSMOSession()); }
    catch(e){ smo = false; }
    if (!smo) return;
    var src = document.getElementById("asWho");
    if (!src || !src.options.length) return;

    var bar = document.createElement("div");
    bar.className = "wviewbar";
    var lab = document.createElement("label");
    lab.setAttribute("for", "wAsWho");
    lab.textContent = "Viewing as";
    var sel = document.createElement("select");
    sel.id = "wAsWho";
    for (var i = 0; i < src.options.length; i++)
      sel.appendChild(src.options[i].cloneNode(true));
    sel.value = src.value;
    sel.addEventListener("change", function(){
      var key = sel.value;
      /* The chrome's handler is the one that switches the platform. Fire it
         rather than repeating it — and only then redraw this screen, so the
         doors it builds are the ones the new viewer can actually reach. */
      src.value = key;
      src.dispatchEvent(new Event("change"));
      redraw(key);
    });
    bar.appendChild(lab); bar.appendChild(sel);
    over.querySelector(".wwrap").insertBefore(bar, over.querySelector(".whero"));
  }

  /* Rebuild this screen for whoever is being viewed as. NEVER markDone(): a
     switch is not a dismissal, and marking it would leave the screen unable to
     come back for the person you were about to look at. */
  function redraw(key){
    var was = box;
    box = null;
    if (was) was.remove();
    var p = null;
    try { p = (typeof personBy === "function" && personBy(key)) || { key: key, name: key }; }
    catch(e){ p = { key: key, name: key }; }
    try { build(p); } catch(e){ box = null; }
  }

  function dismiss(){
    markDone();
    if (box) { box.remove(); box = null; }
  }

  /* ── THE OFFER ──────────────────────────────────────────────────────────
     Called from land() beside TOUR.offer, with the same silences: no
     session, a projector, already seen this session. Returns whether it
     took the screen, because land() offers the tour only when it did not —
     two docks drawn over one page would fight for every click (§118). */
  function offer(person){
    if (!person) return false;
    if (location.protocol === "file:") return false;
    if (document.body && document.body.classList.contains("presenting")) return false;
    if (seenThisSession()) return false;
    try { build(person); } catch(e){ box = null; return false; }
    return true;
  }

  /* ── ASKING FOR IT BACK (§185) ──────────────────────────────────────
     Islam: *"Allow me to go back to the welcome screen somehow."* The screen
     is offered once a session and then never again, so what is waiting on
     you — the submission, the gaps, the unanswered replies — was readable for
     one moment and then only by signing out.

     DELIBERATELY NOT `offer()` WITH THE GUARD REMOVED. `offer()` answers
     "should this take the screen unasked", and every one of its silences is
     about that question: a projector, a file, a session that has already been
     greeted. Pressing a button IS the ask, so the only silences that survive
     are the two that are about whether the screen can exist at all.

     AND IT DOES NOT `markDone()`. Asking for it back says nothing about
     whether it has been seen — that mark is what stops it opening ITSELF a
     second time, and clearing it here would put it in front of somebody on
     their next paint (§107's rule about a memory that answers one question
     answering only that one). */
  function open(person){
    if (!person) return false;
    if (location.protocol === "file:") return false;
    if (document.body && document.body.classList.contains("presenting")) return false;
    if (box) return true;
    try { build(person); } catch(e){ box = null; return false; }
    return true;
  }

  return {
    offer: offer,
    open: open,
    waiting: waiting,
    showing: function(){ return !!box; },
    dismiss: dismiss
  };
})();
