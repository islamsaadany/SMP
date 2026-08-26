/* ══ THE ONBOARDING TOUR (spec 016) ═════════════════════════════════════════
   Islam: "for first time users we need some orientation flow that takes them
   through the platform — highlighting some areas while dimming the rest of the
   page with focus on a button or an area with brief messages … in a user story
   mode for proper onboarding."

   ── THE TWO RULES THIS FILE IS BUILT AROUND ───────────────────────────────
   1. NOTHING IN HERE EVER CALLS paint(). The tour moves the platform by
      PRESSING THE REAL CONTROLS — the same buttons a person would press — so
      the shell's own handlers do the navigating and the painting. A second
      copy of "how do I open a section" is a copy that drifts (Constitution
      IX), and calling paint() from a floating feature is §97's fault.
   2. NOTHING HOLDS A NODE. Every paint replaces the elements the spotlight is
      drawn around, so a step names SELECTORS and they are re-resolved on every
      paint, resize and scroll. onPaint() is called at the end of paint() for
      exactly this — beside SEARCHSEL.wire() and CHAT.wireInbox().

   ── WHAT IT WALKS, AND WHY IT WALKS ITSELF ────────────────────────────────
   The first build made the person press the real Performance tab and the real
   Report button, which was the answer to the first alignment ("let them click,
   that would be more interactive") — and Islam reversed it after using it:
   "skip the buttons clicking overall". So Next and Back are the only controls,
   and each step declares WHERE it wants the platform to be; the engine gets it
   there. The reversal is recorded in spec 016's decisions table rather than
   quietly overwritten (Constitution II).

   ── IT RUNS ON DEMO DATA, AND THAT IS WHAT MAKES IT SAFE ──────────────────
   A fresh tenant is EMPTY: a spotlight on an empty table teaches nothing. So
   the tour switches to the worked example for its duration and puts the
   platform back exactly as it found it. It needs no save guard of its own —
   demo mode already refuses every write (§21, §67) — and the demo BUTTON being
   the SMO's (§69.15) is about that control, not about the mode: this is its
   own door into the same read-only view.

   ── AND IT IS NOT DRAWN WHERE IT WOULD BE A LIE ───────────────────────────
   Never on a projector (CSS, off the class present.js already sets — no second
   piece of state to keep in step), and never offered from file://, where there
   is no sign-in and so no "first sign-in". Replay from the Knowledge base
   works there, because the demo dataset is baked into the file.
   ────────────────────────────────────────────────────────────────────────── */
var TOUR = (function(){
  "use strict";

  /* ── WHERE THE PLATFORM'S OWN CONTROLS LIVE ───────────────────────────
     Named once. A step says {dest,tab,sec} and these turn that into the
     button to press; §51.11 is the reason they are in one place — when a
     control changes shape, this is the file to grep, and checks/tour.py
     fails the build rather than the tour quietly lighting nothing. */
  function destBtn(k){ return document.querySelector('#units [data-u="' + k + '"]'); }
  function tabBtn(k){  return document.querySelector('#subtabs [data-s="' + k + '"]'); }
  function secBtn(k){  return document.querySelector('#secrow-in [data-sub2="' + k + '"]'); }

  /* ── STORAGE, AND WHAT A BROKEN STORE MEANS ───────────────────────────
     Screen preferences live in localStorage and never in the state graph
     (§25, §47.1): the tour writes nothing a save could carry, so there is
     nothing for lib/authorize.js to classify and no migration.

     "Don't show again" is durable; "Skip for now" is sessionStorage, because
     a new sign-in is a new session — the promise "it offers itself again next
     time you sign in" is then kept by the browser rather than by a date
     somebody has to reason about.

     A THROWING STORE READS AS "ALREADY MARKED". A browser with site data
     blocked cannot remember the answer, so offering would mean offering on
     every single load — and a tour nobody can dismiss is worse than no tour.
     It fails quiet, in the safe direction. */
  function seen(story){
    try { return localStorage.getItem("smp.tour." + story) === "never"; }
    catch(e){ return true; }
  }
  function markSeen(story){
    try { localStorage.setItem("smp.tour." + story, "never"); } catch(e){}
  }
  function skippedThisSession(){
    try { return sessionStorage.getItem("smp.tour.later") === "1"; }
    catch(e){ return true; }
  }
  function markLater(){
    try { sessionStorage.setItem("smp.tour.later", "1"); } catch(e){}
  }

  /* ── WHICH STORY, AND WHERE THIS PERSON WORKS ─────────────────────────
     ONE mapping, reading SMPRules and nothing else. Twelve places testing a
     role string is exactly the fault §55 records, and a story is the last
     place that should invent its own idea of who somebody is.

     A person holding BOTH gets the custodian's story: it is the doing role,
     and the owner's remains one press away in the Knowledge base.

     AND IT ASKS THE PLATFORM'S OWN FUNCTION, not SMPRules directly. There is
     exactly one builder of the world (`world()` in config-data.js) and its
     own comment says why: a caller assembling the state field by field
     answers from a world missing whatever was added last, silently. This file
     is one more caller and gets no exception. */
  function rolesOf(person){
    if (!person || typeof personRoles !== "function") return [];
    try { return personRoles(person) || []; }
    catch(e){ return []; }
  }
  function storyFor(person){
    var rs = rolesOf(person), has = {};
    rs.forEach(function(r){ has[r.role] = r; });
    if (has.custodian) return "custodian";
    if (has.owner || has.fnhead) return "owner";
    return null;
  }
  /* $own is resolved from the SAME role list, so the walk happens where the
     person actually works rather than at whatever the navigation opens first
     (§94.6). "group" is not a place a unit story can be told, so it is not
     taken as an answer. */
  function ownPlace(person){
    var rs = rolesOf(person), at = null;
    rs.forEach(function(r){
      if (at) return;
      if (r.role === "custodian" || r.role === "owner" || r.role === "fnhead") at = r.at;
    });
    if (!at || at === "group" || String(at).indexOf("co:") === 0) return null;
    return at;
  }

  /* ── THE STORIES ──────────────────────────────────────────────────────
     Data, not code. A step is {dest,tab,sec,targets,title,body} and the LAST
     target is the step's subject — the card is placed around that one and
     kept clear of all of them.

     The copy is Islam's (Constitution VIII); the custodian's is what he signed
     off on the mockup, word for word. */
  var STORIES = {
    custodian: {
      role: "Strategy custodian",
      steps: [
        { kind:"welcome",
          title:"Welcome to the Strategy Management Platform",
          body:"This two-minute tour shows you around on <b>demo data</b> — a full worked " +
               "example, labelled the whole time. Nothing in it is your own data, and nothing " +
               "it shows can be saved.",
          next:"Start the tour" },

        { dest:"$own", tab:"strategy", sec:"plan",
          targets:["#units [data-u=\"$own\"]"],
          title:"You are here",
          body:"This row is the business — every button a unit or a supporting function, " +
               "and the lit one is where you are. You will only see the ones you are " +
               "responsible for." },

        { dest:"$own", tab:"strategy", sec:"plan",
          targets:["#subtabs [data-s=\"strategy\"]"],
          title:"The Strategy tab",
          body:"<b>Strategy</b> holds what was agreed, in three sections you will see one by " +
               "one. <b>Performance</b>, beside it, shows what the reported figures make of it." },

        { dest:"$own", tab:"strategy", sec:"found",
          targets:["#secrow-in [data-sub2=\"found\"]", "#panel"],
          title:"Strategy › Foundation",
          body:"Who the unit is: the aspiration, and the key objectives the unit is judged on." },

        { dest:"$own", tab:"strategy", sec:"swot",
          targets:["#secrow-in [data-sub2=\"swot\"]", "#panel"],
          title:"Strategy › SWOT",
          body:"The reasoning the plan was built from — strengths, weaknesses, " +
               "opportunities, threats. The pillars answer what this table says." },

        { dest:"$own", tab:"strategy", sec:"plan",
          targets:["#secrow-in [data-sub2=\"plan\"]", "#panel .split > .rail"],
          title:"Strategy › Plan — the pillars",
          body:"The plan itself. Each pillar on this rail holds the measures your unit is " +
               "scored on and the tactics that deliver them." },

        { dest:"$own", tab:"strategy", sec:"plan",
          targets:["#secrow-in [data-sub2=\"plan\"]", "#panel .split > .pane"],
          title:"A pillar's measures and tactics",
          body:"Open a pillar and this pane shows its measures, targets and how each " +
               "compiles. This is what reporting fills with figures each cycle." },

        { dest:"$own", tab:"performance",
          targets:["#subtabs [data-s=\"performance\"]", "#panel .scores"],
          title:"Performance — the headline numbers",
          body:"The <b>Performance</b> tab turns the plan and the reported figures into the " +
               "unit's score. Three readings, left to right: what we are judged on, how the " +
               "work we set ourselves is going, and whether the work happened." },

        { dest:"$own", tab:"performance",
          targets:["#panel [data-report]"],
          title:"Where your figures go in",
          body:"While a reporting cycle is open, <b>Report</b> is where you enter this " +
               "quarter's figures and submit them for the unit." },

        { dest:"$own", tab:"performance",
          targets:["#panel .pageact .dlmenu, #panel .bands-act .dlmenu"],
          title:"The unit's story, as slides",
          body:"<b>Presentation</b> turns this page into the review deck — <b>Present</b> " +
               "plays it full-screen for a projector, and <b>Manage slides</b> lets you " +
               "arrange it first, including picture slides of your own." },

        { kind:"finish",
          title:"That's the essentials",
          body:"You can replay this tour any time from the <b>Knowledge base</b>. The moment " +
               "this closes you are back on your own data.",
          next:"Close" }
      ]
    }
  };

  /* ── RUNTIME STATE ────────────────────────────────────────────────────
     Private. `at` is -1 when nothing is running, which is what every guard
     asks. `prevMode` is the platform's mode before Start and is what every
     exit path puts back — there is no other way out of demo. */
  var story = null, steps = [], at = -1, asking = false,
      prevMode = null, own = null, navigating = false, dock = null,
      docked = false;

  function el(id){ return document.getElementById(id); }
  function running(){ return at >= 0; }
  function ordinary(){ return Math.max(0, steps.length - 2); }

  /* A step's selectors, with $own filled in. Written here rather than at
     authoring time because the same story is told to different people. */
  function selectorsOf(s){
    return (s.targets || []).map(function(sel){
      return own ? sel.split("$own").join(own) : sel;
    });
  }

  /* ── THE DOCK ─────────────────────────────────────────────────────────
     Appended to <body>, which is the whole point: #panel is rewritten by
     every paint, and anything the tour owns has to survive that. The chat
     corner mounts the same way for the same reason. */
  function mount(){
    if (dock) return;
    if (!document.body) return;
    dock = document.createElement("div");
    dock.className = "tourdock";
    dock.id = "tourdock";
    dock.hidden = true;
    dock.innerHTML =
      '<div class="tdim" id="tdim"></div>' +
      '<svg class="tsvg" id="tsvg" aria-hidden="true">' +
        '<defs><mask id="tmask">' +
          '<rect width="100%" height="100%" fill="#fff"></rect>' +
          '<g id="tholes"></g>' +
        '</mask></defs>' +
        '<rect id="tshade" width="100%" height="100%" mask="url(#tmask)"></rect>' +
        '<g id="trings"></g>' +
      '</svg>' +
      '<div class="tcard" id="tcard" role="dialog" aria-modal="true" aria-labelledby="ttitle">' +
        '<div class="tctop"><span class="tstep" id="tstep"></span>' +
          '<button type="button" class="tx" id="tclose" data-t="close" ' +
                 'title="Close the tour" aria-label="Close the tour">×</button></div>' +
        '<h3 id="ttitle"></h3>' +
        '<div class="tbody" id="tbody"></div>' +
        '<div class="tdots" id="tdots" aria-hidden="true"></div>' +
        '<div class="tfoot" id="tfoot"></div>' +
      '</div>';
    document.body.appendChild(dock);

    /* ONE delegated handler on the dock. The card's buttons are rewritten on
       every step, so binding them individually would mean re-binding them on
       every step — and a handler bound twice is §24's fault waiting. */
    dock.addEventListener("click", function(e){
      var b = e.target.closest ? e.target.closest("[data-t]") : null;
      var t = b && b.dataset.t;
      if (t === "next")   { go(at + 1); return; }
      if (t === "back")   { go(at - 1); return; }
      if (t === "resume") { go(at); return; }
      if (t === "never")  { markSeen(story); end(); return; }
      if (t === "later")  { markLater(); end(); return; }
      if (t === "close")  { askClose(); return; }
    });
    /* Escape asks rather than closing outright: the two answers are not the
       same answer, and a key that picks one of them for you is a key that
       decides whether the tour ever comes back. */
    document.addEventListener("keydown", function(e){
      if (e.key === "Escape" && running() && !asking) { e.preventDefault(); askClose(); }
    });
    window.addEventListener("resize", place);
    window.addEventListener("scroll", place, true);
  }

  /* ── GETTING THE PLATFORM WHERE THE STEP SAYS ─────────────────────────
     By pressing the real controls, in the order the chrome itself is built:
     destination, then tab, then section — each one repaints and rebuilds the
     row below it, so pressing them out of order presses buttons that are
     about to be replaced.

     `navigating` stops onPaint() from placing a spotlight against a
     half-navigated screen; the place() at the end of go() is the one that
     counts. */
  function pressTo(s){
    navigating = true;
    try {
      if (s.dest) {
        var d = destBtn(s.dest === "$own" ? own : s.dest);
        if (d && d.getAttribute("aria-selected") !== "true") d.click();
      }
      if (s.tab) {
        var t = tabBtn(s.tab);
        if (t && t.getAttribute("aria-selected") !== "true") t.click();
      }
      if (s.sec) {
        var c = secBtn(s.sec);
        if (c && c.getAttribute("aria-selected") !== "true") c.click();
      }
    } finally { navigating = false; }
  }

  /* ── THE SHADE ────────────────────────────────────────────────────────
     ALL the dim is painted by the masked rect, one hole per target. The
     full-cover layer above it is TRANSPARENT and exists only to swallow
     clicks — a second dim over a lit control washes out the thing the step
     is about, which is the same family of fault as measuring a colour
     through a pseudo-element (§68.10).

     A mask rather than one element's giant box-shadow because a shadow
     cutout can only ever have ONE hole, and a section step lights the
     section button AND the section it opened. */
  function svgRect(g, h, cls){
    var r = document.createElementNS("http://www.w3.org/2000/svg", "rect");
    r.setAttribute("x", h.l); r.setAttribute("y", h.t);
    r.setAttribute("width", h.w); r.setAttribute("height", h.ht);
    r.setAttribute("rx", 9);
    if (cls) r.setAttribute("class", cls); else r.setAttribute("fill", "#000");
    g.appendChild(r);
  }

  function place(){
    if (!running() || navigating || !dock) return;
    var holesG = el("tholes"), ringsG = el("trings"), card = el("tcard");
    holesG.innerHTML = ""; ringsG.innerHTML = "";
    var s = steps[at];

    /* No targets — the welcome and the finish, and the close prompt, which
       are about the tour rather than about anything on the page. */
    if (asking || !s.targets) {
      docked = false;
      card.classList.add("tcentre");
      card.style.left = card.style.top = "";
      return;
    }
    card.classList.remove("tcentre");

    var pad = 6, hs = [];
    selectorsOf(s).forEach(function(sel){
      var node = document.querySelector(sel);
      if (!node) return;
      var r = node.getBoundingClientRect();
      if (!r.width || !r.height) return;
      hs.push({ l:r.left - pad, t:r.top - pad, w:r.width + 2*pad, ht:r.height + 2*pad });
    });
    /* A step whose subject is not on the screen is a step with nothing to
       say. It should be impossible — checks/tour.py walks every story as
       every role precisely so a renamed control fails the BUILD — so it is
       reported rather than swallowed, and the card is centred so the words
       still arrive. */
    if (!hs.length) {
      docked = false;
      console.warn("SMP tour: no target on screen for step " + at + " of " + story);
      card.classList.add("tcentre");
      card.style.left = card.style.top = "";
      return;
    }
    hs.forEach(function(h){ svgRect(holesG, h); svgRect(ringsG, h, "tring"); });

    /* The card goes BESIDE the spotlight, never over it: below, then right,
       then left, then above the step's SUBJECT (the last target), taking the
       first position that fits the window and clears every hole. The corner
       dock is the last resort and is why the card is translucent. */
    var h = hs[hs.length - 1],
        cw = card.offsetWidth, ch = card.offsetHeight,
        W = window.innerWidth, H = window.innerHeight, g = 14, m = 8;
    function fits(c){ return c.l >= m && c.t >= m && c.l + cw <= W - m && c.t + ch <= H - m; }
    function clears(c){
      return hs.every(function(x){
        return c.l >= x.l + x.w || c.l + cw <= x.l || c.t >= x.t + x.ht || c.t + ch <= x.t;
      });
    }
    var cands = [{ l:h.l, t:h.t + h.ht + g }, { l:h.l + h.w + g, t:h.t },
                 { l:h.l - cw - g, t:h.t },   { l:h.l, t:h.t - ch - g },
                 { l:W - cw - m, t:H - ch - m }, { l:m, t:H - ch - m }],
        pick = null;
    for (var i = 0; i < cands.length; i++){
      var c = { l: Math.min(Math.max(m, cands[i].l), W - cw - m), t: cands[i].t };
      if (fits(c) && clears(c)) { pick = c; break; }
    }
    /* NOWHERE TO STAND IS A REAL ANSWER, AND IT IS RECORDED. When the step's
       subject is the whole content area — a Foundation, a SWOT — there is no
       "beside", and the card docks in a corner ON TOP of the lit region. That
       is what the translucency is for (Islam, rev 2: "make it a bit
       transparent"), and it is the ONLY case in which the card is allowed to
       cover a spotlight. `docked` says so out loud so checks/tour.py can
       assert exactly that, rather than either forbidding overlap (which would
       fail on a page that has no room) or ignoring it (which would let a
       card sit over a button nobody can then see). */
    docked = !pick;
    if (!pick) pick = { l: W - cw - m,
                        t: Math.min(Math.max(m, h.t + h.ht + g), H - ch - m) };
    card.style.left = pick.l + "px";
    card.style.top  = pick.t + "px";
  }

  /* ── THE CARD ─────────────────────────────────────────────────────────
     There is no Skip-tour button and there never will be again: the × does
     that job, and two controls for one act is what made it worth removing
     (rev 4). Back is on every step but the first. */
  function paintCard(){
    var s = steps[at];
    el("tstep").textContent =
      s.kind === "welcome" ? "The tour · " + STORIES[story].role :
      s.kind === "finish"  ? "The tour · done" :
      "Step " + at + " of " + ordinary();
    el("ttitle").innerHTML = s.title;
    el("tbody").innerHTML = s.body;
    var dots = "";
    for (var i = 0; i < steps.length; i++) dots += '<i' + (i === at ? ' class="on"' : '') + '></i>';
    el("tdots").innerHTML = dots;
    el("tfoot").innerHTML =
      (at > 0 ? '<button type="button" class="tback" data-t="back">‹ Back</button>' : '') +
      '<button type="button" class="tnext" data-t="next">' + (s.next || "Next") + '</button>';
  }

  /* THE × ASKS, AND IT ASKS IN THE CARD. Not confirm() — a browser dialog can
     be silenced permanently on some other site (§95) — and not a second
     overlay, because the question is about the thing already on screen. The
     stray-click path back is what makes a one-press × safe (§92's argument,
     from the other side). */
  function askClose(){
    asking = true;
    el("tstep").textContent = "Close the tour?";
    el("ttitle").textContent = "Should it come back?";
    el("tbody").innerHTML =
      "<b>Skip for now</b> shows the tour again next time you sign in. " +
      "<b>Don't show again</b> puts it away for good — you can still replay it " +
      "from the Knowledge base.";
    el("tdots").innerHTML = "";
    el("tfoot").innerHTML =
      '<button type="button" class="tquiet" data-t="resume">Keep the tour</button>' +
      '<span class="tchoice">' +
        '<button type="button" class="tghost" data-t="never">Don’t show again</button>' +
        '<button type="button" class="tnext" data-t="later">Skip for now</button>' +
      '</span>';
    place();
  }

  function go(n){
    if (!steps.length) return;
    if (n >= steps.length) { markSeen(story); end(); return; }
    at = Math.max(0, n);
    asking = false;
    pressTo(steps[at]);
    paintCard();
    place();
    var card = el("tcard");
    if (card) card.focus && card.focus();
  }

  /* EVERY EXIT PUTS THE WORLD BACK. Finish, both answers to the ×, and the
     Escape that leads to them all come through here — one door, because a
     tour that left somebody in demo mode would leave them looking at a
     worked example wearing their own tenant's name. */
  function end(){
    at = -1; asking = false;
    if (dock) dock.hidden = true;
    if (prevMode && window.SYNC && SYNC.setMode) {
      try { SYNC.setMode(prevMode); } catch(e){}
    }
    prevMode = null; story = null; steps = [];
  }

  function start(key){
    if (!STORIES[key]) return;
    mount();
    if (!dock) return;
    story = key; steps = STORIES[key].steps;
    /* `viewer()` is the platform's own answer to "who is this", and it
       RESOLVES rather than returning a maybe — including after a hydration or
       a dataset swap moved the register under us, which this function is
       about to do. */
    own = ownPlace(viewer()) || firstDest();
    /* Remembered BEFORE the switch, or the way back is lost. Read through
       `demoMode()`, which the platform already exports — null means live, so
       there is no new export to keep in step with `mode`.

       FROM file:// THERE IS NOTHING TO SWITCH: `DEMO` is only captured when a
       server answered, and the baked globals ARE the worked example, so the
       platform is already showing exactly what the tour wants. setMode()
       no-ops there by its own guard; prevMode stays null and end() puts
       nothing back, which is correct rather than merely harmless. */
    prevMode = (window.SYNC && SYNC.demoMode) ? (SYNC.demoMode() || "live") : null;
    if (prevMode && prevMode !== "demo" && SYNC.setMode) {
      try { SYNC.setMode("demo"); } catch(e){}
    }
    dock.hidden = false;
    go(0);
  }

  /* A fallback for a story told to somebody the register places nowhere: the
     first destination the navigation is offering. Never "the group" — the
     first entry in that row is a dropdown carrying no key at all, which is
     the trap §94.6 records. */
  function firstDest(){
    var b = document.querySelector("#units [data-u]");
    return b ? b.dataset.u : null;
  }

  /* ── THE OFFER ────────────────────────────────────────────────────────
     Called from land() in sync.js — the ONE door every boot path passes
     through (§94.10) — and only after its paint, because a tour that opened
     any earlier would spotlight the grey skeleton.

     Six conditions, and every one of them is a reason somebody should not be
     interrupted. It declines in silence: declining is the common case. */
  function offer(person){
    if (!person) return;                                   /* no session: no "first sign-in" */
    if (location.protocol === "file:") return;             /* nothing to sign into */
    if (document.body && document.body.classList.contains("presenting")) return;
    var key = storyFor(person);
    if (!key) return;                                      /* no story fits their roles */
    if (seen(key) || skippedThisSession()) return;
    start(key);
  }

  /* Called at the end of paint(). The step has not changed — the page under
     it has — so the spotlights are recomputed from the selectors and the
     card is put back beside them. */
  function onPaint(){
    if (!running() || navigating) return;
    place();
  }

  return {
    onPaint: onPaint,
    offer: offer,
    start: start,
    storyFor: storyFor,
    /* Read-only, for checks/tour.py. A check that had to read the card's
       words to know where it was would break on every copy edit — assert the
       problem, not the wording (§94.8). */
    state: function(){
      return { story: story, at: at, asking: asking, docked: docked,
               steps: ordinary(), running: running() };
    },
    /* THE STORIES THEMSELVES, for checks/tour.py and nothing else. It walks
       what the product SHIPS rather than a copy of it — a check holding its
       own list of steps would go green while a step added here was never
       visited, which is §51.11 wearing the other hat. Two underscores because
       nothing in the platform may read this: a caller wanting to know where
       the tour is asks state(). */
    __stories: STORIES
  };
})();
