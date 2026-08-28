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
     [data-md], [data-setupgo], [data-report] — never a second copy of the
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

  function wesc(s){ return String(s).replace(/&/g,"&amp;").replace(/</g,"&lt;"); }

  function seenThisSession(){
    try { return sessionStorage.getItem("smp.welcome.done") === "1"; }
    catch(e){ return true; }
  }
  function markDone(){ try { sessionStorage.setItem("smp.welcome.done", "1"); } catch(e){} }

  /* The register's row for the signed-in person — the API's person carries a
     key and a name, and everything else (attachment, roles, a typed short
     name) lives on the register (§93.8). */
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
      if (report) press('[data-report="' + t + '"]');
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
        c = String(t).indexOf("fn:") === 0
          ? fnReportedCount(String(t).slice(3)) : reportedCount(UNITS[t]);
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

  /* ── LATE ANSWERS LAND IN PLACE (§71.2) ──────────────────────────────── */
  function unEmpty(list){
    var e = list.querySelector(".wempty");
    if (e) e.remove();
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
    if (open) chips.push('<span class="wchip wcycle"><i></i>' +
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
            '<p class="wcontinue"><a href="#" data-wcontinue>Continue</a></p>' +
          "</div>" +
          '<div class="wside">' +
            '<div class="wpagesbox"><p class="wseclab">Your pages</p>' +
              '<div class="wcard wpages"></div></div>' +
            '<div class="wtour" hidden>' +
              "<h3>Take an intro round</h3>" +
              "<p>A short walk of the platform on the worked example — about two minutes.</p>" +
              '<div class="wtourbtns">' +
                '<button type="button" class="wtbtn" data-wtour>Start the round</button>' +
                '<button type="button" class="wtghost" data-wnotnow>Not now</button>' +
              "</div>" +
            "</div>" +
          "</div>" +
        "</div>" +
      "</div>";

    var list = box.querySelector(".wacts");
    var acts = office ? officeActs(list)
                      : submitRows(targets).concat(gapRows(targets));
    if (!office) {
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
    }
    acts.forEach(function(a){ list.appendChild(a); });
    if (!office) watchReplies(list);

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
    }

    /* ── Continue ───────────────────────────────────────────────────────
       The platform under this screen is already on the page §94.6 chose, so
       Continue only steps aside — and names where that is. */
    var here = null;
    try { here = typeof current !== "undefined" ? current : null; } catch(e){}
    var word = "Continue";
    if (here && here !== "setup" && here !== "manage") {
      try { word = "Continue to " + subjectName(here); } catch(e){}
    }
    var cont = box.querySelector("[data-wcontinue]");
    cont.textContent = word + " ›";
    cont.addEventListener("click", function(ev){ ev.preventDefault(); dismiss(); });

    document.body.appendChild(box);
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

  return {
    offer: offer,
    showing: function(){ return !!box; },
    dismiss: dismiss
  };
})();
