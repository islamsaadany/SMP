/* ── Persistence ──────────────────────────────────────────────────────────
   Served over http(s), the platform loads its state from /api/state and
   writes every change back, so edits survive reloads and every viewer shares
   one state. Opened as a local file it behaves exactly as before — baked
   data, no network — which is what keeps the handover file working anywhere.

   The graph sent and received is the same set of globals the pages already
   read; nothing is renamed in transit, so the server and the screen can never
   disagree about a field. Derived figures are not persisted: a unit's weight
   is zeroed in the payload and recomputed from the factor table after
   hydration (§5.1, §6), exactly as it is on a cold load.

   Saving keys off change, not off intent: after any repaint — every mutation
   repaints — the graph is serialized and compared with what was last saved;
   only a difference is written, debounced. A slow interval does the same
   check, catching the few edits that deliberately do not repaint (the deck's
   note, the reporting note boxes). */

var SYNC = (function () {
  var enabled = typeof location !== "undefined" &&
    (location.protocol === "http:" || location.protocol === "https:");
  /* ── THE BOOT SKELETON'S TWO NUMBERS (§94.10) ────────────────────
     FLOOR: how long the skeleton stays once it is up, so an answer that
     arrives in 40ms does not flash it on and off. Chosen under the threshold
     at which a delay is noticed, and it is a floor rather than a duration —
     a slow answer waits no longer for it.

     GIVEUP: when to stop waiting and show the baked data anyway. Long enough
     for a cold serverless function and a sleeping Neon branch, short enough
     that nobody is left looking at grey wondering whether it is broken. */
  var BOOT_FLOOR = 180, BOOT_GIVEUP = 8000;
  function bootNow() { return Date.now(); }
  /* Takes the skeleton down. Idempotent, and the ONLY thing that does it —
     theme.js puts the class on and never removes it, so there is one place to
     look when a page is stuck grey. */
  function bootLand() {
    try {
      document.documentElement.classList.remove("booting");
      document.documentElement.removeAttribute("aria-busy");
    } catch (e) {}
    /* THE CORNER ARRIVES WITH THE PAGE, NOT BEFORE IT (§97.1). This is the one
       place the skeleton comes down, with four ways in (the answer, a failure,
       the 8s backstop, file://) — so hanging the chat off it means the bubble
       can never be drawn on top of the grey, and can never be forgotten by one
       of the four. mount() is idempotent and refuses on file://, where there
       is no server to carry a message. */
    try { CHAT.mount(); } catch (e) {}
  }
  var live = false;        /* hydrated from the API; saves flow only then */
  var lastSaved = null;    /* the serialized graph the server last accepted */
  var timer = null;
  var saving = false;
  /* Kept from boot() so a save can ask the screen to repaint itself. The
     only thing that needs it is the register's password column, which
     cannot be right until the save that created the person has landed. */
  var repaint = null;

  /* Two datasets, one product.

     DEMO is the full worked example baked into this file — Raya Trade with
     every unit, capability, figure and person. LIVE is what the database
     holds, which after a clean slate is the client's own and mostly empty.

     The Demo button switches between them so the platform can be EXPLAINED
     with a complete example without that example ever being mistaken for, or
     written into, the real thing. Demo mode never saves (§B3: invented data
     is labelled every time, and it must not leak into a client's tenant). */
  var DEMO = null;
  var LIVE = null;
  var mode = "live";
  /* `clone` is the platform's own, defined once beside the archive model. */

  function graph() {
    return {
      group: GROUP, unitKeys: UNIT_KEYS, units: UNITS,
      functionKeys: FUNCTION_KEYS, functions: FUNCTIONS,
      companyKeys: COMPANY_KEYS, companies: COMPANIES,
      people: PEOPLE, unitRoles: UNIT_ROLES, access: ACCESS,
      labels: LABELS.entries, bands: BANDS.bands, koWeights: KO_WEIGHTS,
      cycle: CYCLE, review: REVIEW, history: HISTORY, priorCycle: PRIOR_CYCLE,
      archives: ARCHIVES
    };
  }

  function serialize() {
    var s = JSON.parse(JSON.stringify(graph()));
    s.unitKeys.forEach(function (k) { if (s.units[k]) s.units[k].weight = 0; });
    /* A branding that sets NOTHING is not a branding. branding() fills the
       four keys with nulls the first time anything asks, so an untouched
       tenant grows a {palette:null,font:null,accent:null,bar:null} on screen
       while the database holds no branding at all — and the two never became
       equal again. That is a phantom difference in every save, and once the
       server started checking who may change what (spec 006) it meant every
       non-SMO save carried an unexplained group change and was refused.
       Same rule as `weight` above: what is not the tenant's own is not sent. */
    var b = s.group && s.group.branding;
    if (b && Object.keys(b).every(function (k) { return b[k] == null; })) delete s.group.branding;
    return JSON.stringify(s);
  }

  /* The globals are rebound, not patched: every function in the platform
     resolves these names at call time, so reassignment reaches everything.
     The two invariants the cold-load path establishes are re-established. */
  function hydrate(state) {
    window.GROUP = state.group;
    window.UNIT_KEYS = state.unitKeys;
    window.UNITS = state.units;
    window.FUNCTION_KEYS = state.functionKeys;
    window.FUNCTIONS = state.functions;
    /* Heal at the one door stored plans arrive through (§118): a function's
       plan is a JSON blob, and a blob written while a list held an undefined
       entry holds a literal null for ever — every visit to that function's
       pages then dies mid-paint and the tab reads as dead. Remove-only. */
    if (typeof fnPruneNulls === "function") {
      (window.FUNCTION_KEYS || []).forEach(function (k) { fnPruneNulls(window.FUNCTIONS[k]); });
    }
    /* A tenant that predates the company level has neither, and an empty
       company list is a valid answer: every unit is then its own. */
    window.COMPANY_KEYS = state.companyKeys || [];
    window.COMPANIES = state.companies || {};
    window.PEOPLE = state.people;
    window.UNIT_ROLES = state.unitRoles;
    window.ACCESS = state.access;
    LABELS.entries = state.labels;
    BANDS.bands = state.bands;
    window.KO_WEIGHTS = state.koWeights || {};
    window.CYCLE = state.cycle;
    window.REVIEW = state.review;
    window.HISTORY = state.history;
    window.ARCHIVES = state.archives || [];
    /* Rebound unconditionally, like every other global here. Assigning only
       when present meant a tenant with no previous cycle kept the baked-in
       example's 2025 split on screen — the Weighting factors table showed
       deltas against a year that never happened for them. */
    window.PRIOR_CYCLE = state.priorCycle || { factors: [] };
    UNIT_KEYS.forEach(function (k) { UNITS[k].ukey = k; });
    syncWeights();
  }

  /* The exact payload the server last refused, so it is not posted again. Not
     `lastSaved`: that would claim it landed, and the platform would go on
     showing a change the database never took. */
  var refusedBody = null;

  /* A REFUSAL NEEDS A WAY OUT (§48.3).

     The retry rule was already right and is unchanged: an identical body is
     never re-sent, and the next DIFFERENT change is tried normally. What was
     missing is the case where the refused change is still ON SCREEN — an
     import that was applied, a field that was typed — because then every
     later body still contains it, every later save is refused too, and the
     banner is a dead end. Clearing the remembered body would NOT have fixed
     that; it would have re-sent the same refusal in a loop.

     So the banner carries the only honest recovery: throw away what has not
     been saved and take the server's copy again. It is destructive to local
     work, so it says so and asks first. */
  function showRefusal(list) {
    var el = document.getElementById("refused");
    if (!el) return;
    if (!list || !list.length) { el.hidden = true; el.innerHTML = ""; return; }
    el.innerHTML = "<span><strong>Not saved.</strong> " +
      (list.length === 1 ? "" : "The server refused this change:") + "</span>" +
      (list.length === 1
        ? "<span>" + esc(list[0]) + "</span>"
        : "<ul>" + list.map(function (x) { return "<li>" + esc(x) + "</li>"; }).join("") + "</ul>") +
      '<span><button type="button" class="refused-undo" id="refused-undo">' +
      "Discard the change and reload</button></span>";
    el.hidden = false;
    var u = document.getElementById("refused-undo");
    if (u) u.addEventListener("click", function () {
      if (!confirm("Discard everything changed since the last successful save, " +
                   "and load the stored version again?\n\nAnything you have typed " +
                   "that was not saved will be lost.")) return;
      location.reload();
    });
  }

  /* SAVE, WITH SOMEBODY POSSIBLY WATCHING (§63). Islam asked for a Save draft
     button on the reporting page — "as a feeling for the user that he is
     saving, keeping the autosave just in case". A button that lies is worse
     than no button, so `done` is told WHICH of the five outcomes happened and
     the page says the true one: there is nothing to save here (opened from a
     file), everything is already saved, it just saved, the server refused it,
     or it could not be reached. The autosave calls this with no callback and
     behaves exactly as it did. */
  function save(done) {
    var say = function (state) { if (done) done(state); };
    /* The guard that matters: demo data must never reach the database. */
    if (!live || isDemoMode()) return say("offline");
    if (saving) return say("busy");
    var now = serialize();
    if (now === lastSaved) return say("clean");
    if (now === refusedBody) return say("refused");
    saving = true;
    fetch("/api/state", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: '{"state":' + now + "}"
    }).then(function (r) {
      saving = false;
      /* REFUSED, not failed (spec 006). The server has decided this person may
         not make one of these changes, and retrying the identical body would
         refuse identically for ever — silently, which is the worst failure
         this feature could have. So the body is remembered as refused, the
         sentence the server sent is shown, and the next DIFFERENT change is
         tried normally. */
      /* Signed out, or signed in on a password that still has to be changed:
         the door, not a banner. */
      if (r.status === 401) { location.replace("/"); return; }
      if (r.status === 403) {
        refusedBody = now;
        say("refused");
        return r.json().then(function (j) {
          if (j && j.mustChange) { location.replace("/"); return; }
          showRefusal(j && j.refusals);
        }, function () { showRefusal(null); });
      }
      if (r.ok) {
        showRefusal(null);
        lastSaved = now;
        /* A person created in the register does not exist to the SERVER until
           this save lands — and credentials are keyed on people, so until then
           they can be given no password and the password column has nothing
           true to say about them. Dropping the cached states makes the next
           paint ask again, which is the first moment the answer can be right.
           Guarded on the symbol existing so sync.js stays independent of which
           pages happen to be built into the file. */
        if (typeof SAIDWHERE !== "undefined" && SAIDWHERE !== null) SAIDWHERE = null;
        if (typeof PWSTATES !== "undefined" && PWSTATES !== null) {
          PWSTATES = null;
          /* Only when that column is actually on screen. A repaint nobody can
             see is a repaint that can only cost — and this one fires after
             every save. */
          if (repaint && document.querySelector('[data-edit="people"]')) repaint();
        }
        say("saved");
      }
      else {
        say("failed");
        console.warn("SMP: save failed (HTTP " + r.status + ") — will retry on the next change");
      }
    }).catch(function (e) {
      saving = false;
      say("failed");
      console.warn("SMP: save failed (" + e.message + ") — will retry on the next change");
    });
  }

  /* Real identity replaces the prototype's viewer switcher on the deployed
     product (§16.9, built in §19): the page shows the signed-in person's own
     view. The switcher survives for the SMO as a read-only simulation — what
     is rendered changes, who is acting does not: the server authorizes by
     session, never by the simulated view. Offline, everything stays as it
     always was. */
  var person = null;
  /* ── WHO MAY SEE THE CONTROLS THAT LEAVE YOUR OWN VIEW (§69.15) ────
     The viewer switcher and Demo data are the SMO's, and Tarek — a contributor
     with no role at all — was served both, with the switcher showing SOMEBODY
     ELSE'S NAME as the person signed in.

     THE FAULT IS THE DIRECTION OF THE GATE, not the test. Both controls sit in
     the markup and were CORRECTED afterwards: shown by default, hidden by a
     step that runs later. Anything that stops that step — an exception above
     it, an early return, a person the register does not hold — leaves them
     standing, for everybody. A control that is dangerous when wrong must fail
     CLOSED: hidden until something proves it should be shown.

     One function, asked by both, so the two can never disagree about who the
     SMO is (§42's rule about one copy of a rule, on the chrome). `role` is the
     SEAT role the server returns from the session — never the simulated view,
     which is the whole point of the simulation. */
  function isSMOSession() { return !!person && person.role === "super"; }
  function chromeFor(paint) {
    var box = document.querySelector(".viewer");
    var sel = document.getElementById("asWho");
    /* AND IT PAINTS ON THE WAY OUT (§94.10). This was a bare `return`, which
       was harmless while boot() had already painted before hydrating — the
       page was on screen and this only decorated the chrome. It is not
       harmless now: this function IS the first paint, so returning without
       one leaves the skeleton down and nothing behind it. Defensive either
       way (both elements are in the static markup), and "it cannot happen" is
       not a reason to leave a blank page when it does — the same sentence the
       note below this one already makes. */
    if (!box || !sel) { paint(); return; }
    var known = PEOPLE.some(function (p) { return p.key === person.key; });
    if (known) {
      window.VIEWER = person.key;
      sel.value = person.key;
    }
    /* AND IF THE REGISTER DOES NOT HOLD THEM, RENDER NOBODY. `VIEWER` was
       simply left where it was — at whoever the list happens to start with —
       so a person the platform could not find was shown the FIRST PERSON'S
       VIEW, wearing their own name in the corner. That is the worst reading
       available: the SMO's pages served to somebody who is not the SMO,
       with nothing on the screen saying so.

       It cannot happen from a save (the session JOINs `people`), but it can
       from a hydration that has not caught up, and "it cannot happen" is not a
       reason to render the wrong person when it does. */
    if (!known) {
      var lost = document.createElement("div");
      lost.className = "note bad-note";
      lost.style.margin = "18px";
      lost.innerHTML = "<b></b> ";
      lost.firstChild.textContent = (person.name || "You") +
        " is signed in but is not on this register.";
      lost.appendChild(document.createTextNode(
        "Nothing is shown rather than somebody else\u2019s view. Ask the SMO to " +
        "check the People register."));
      var panel = document.getElementById("panel");
      if (panel) { panel.textContent = ""; panel.appendChild(lost); }
      box.hidden = true;
      return;
    }
    /* THE SEAT ROLE, NOT A LEVEL. This read `person.level !== "smo"` — a name
       that stopped existing when roles replaced levels (§33). The server has
       returned `role` ("super") ever since, so `undefined !== "smo"` was true
       for EVERYBODY and the switcher was hidden from the one person it is for
       (§45.3). It is asked through isSMOSession() now, in one place. */
    if (!isSMOSession()) {
      sel.hidden = true;
      /* AND ITS FURNITURE, HERE AND NOW (§69.18). Hiding the select alone was
         the whole mechanism, and it relied on SEARCHSEL noticing on the next
         paint — which it stopped doing the moment the name below was inserted
         BETWEEN the button and the select. searchsel.js is fixed to pair them
         by reference rather than by adjacency, and this does not lean on that
         being true: the control that must never appear on this screen is taken
         down by the code that decided it must never appear, in the same
         function, rather than by a component two files away agreeing.

         §3.4's rule with the sign reversed — whoever decides a control is
         wrong removes it, rather than describing the removal to somebody
         else. */
      var btn = box.querySelector(".ssbtn");
      if (btn) btn.hidden = true;
      var label = box.querySelector("label");
      if (label) label.textContent = "Signed in as";
      var nm = document.createElement("span");
      nm.className = "viewer-note";
      nm.innerHTML = "<b></b>";
      nm.firstChild.textContent = person.name;
      box.insertBefore(nm, sel);
    }
    var out = document.createElement("button");
    out.className = "infobtn";
    out.textContent = "Sign out";
    out.addEventListener("click", function () {
      fetch("/api/auth", { method: "POST",
        headers: { "Content-Type": "application/json" },
        body: '{"action":"logout"}'
      }).finally(function () { location.replace("/"); });
    });
    /* Far right of the first line, beside Demo data — the two controls that
       leave the product sit together, away from the one that changes what you
       are looking at. Falls back to the viewer box if the group is missing. */
    (document.getElementById("topacts") || box).appendChild(out);
    paint();
  }

  /* Switching datasets. Leaving live remembers where the client's data was,
     so returning restores it exactly rather than the snapshot taken at boot —
     otherwise an edit made before opening the demo would vanish from the
     screen. Anything typed while in demo is discarded, by design. */
  /* THREE DATASETS, NOT TWO (§67). Islam: "Filled Project & Clear Project …
     the new clear project is a project with the same setup but with no
     uploaded data at all." So "demo" became two modes, and everything that
     asked `mode === "demo"` has to ask `isDemoMode()` instead — the save guard
     above most of all, because a Clear Project that could be saved would write
     an EMPTY tenant over a real one, which is worse than writing an invented
     one over it.

     The cleared graph is derived on switch rather than baked at boot: it costs
     a clone of a graph the browser already holds, and a second stored copy is
     a second thing to keep in step. */
  function isDemoMode() { return mode === "demo" || mode === "demoClear"; }
  function datasetFor(m) {
    if (m === "demo") return clone(DEMO);
    if (m === "demoClear") return clearedGraph(DEMO);
    return clone(LIVE);
  }
  function setMode(next, paint) {
    if (!DEMO || next === mode) return;
    if (mode === "live") LIVE = clone(graph());
    mode = next;
    hydrate(datasetFor(mode));
    markMode();
    paint();
    if (mode === "live") lastSaved = serialize();
  }

  /* Demo data is labelled the whole time it is on screen. The banner is the
     platform's own — it carries the invented-data notice, which is true of the
     example and NOT true of the client's own tenant, so it shows in demo mode
     and is hidden in live. */
  function markMode() {
    var btn = document.getElementById("demobtn");
    if (btn) btn.textContent = mode === "demoClear" ? "Exit clear project" : "Exit demo";
    /* One or the other, never both and never neither — and only once boot()
       has found a live dataset, which is what `live` says.

       AND ONLY FOR THE SMO (Islam, 2026-08-24: "the demo data button shouldn't
       appear to anyone but the SMO"). It is not decoration: pressing it
       replaces every page with invented content (§21), and the person most
       likely to press it by accident is the one who has never seen it before.
       Asked through isSMOSession() so the switcher and this cannot disagree
       about who the SMO is.

       Served from a FILE there is no session and no `live`, so both are hidden
       by the first clause anyway — the whole product is the example there and
       there is nothing to switch to. */
    var menu = document.getElementById("demomenu");
    if (menu) menu.hidden = !live || !isSMOSession() || isDemoMode();
    if (btn) btn.hidden = !live || !isSMOSession() || !isDemoMode();
    var ban = document.getElementById("banner");
    if (ban) {
      ban.hidden = !isDemoMode();
      /* THE BANNER SAYS WHICH ONE IS ON SCREEN. Both are demo data and neither
         is saved, but the second sentence is only true of the filled one —
         a Clear Project has no invented content in it to warn about, and
         warning about it anyway would teach people to stop reading the
         banner. */
      if (mode === "demo") {
        ban.innerHTML =
          '<span><strong>Demo data \u00b7 nothing here is saved.</strong> The full worked ' +
          'example, for explaining how the platform works.</span>' +
          '<span><strong>Only Mobile\u2019s plan is real</strong> \u2014 every other unit, every ' +
          'capability\u2019s content and every reported figure is invented.</span>';
      } else if (mode === "demoClear") {
        ban.innerHTML =
          '<span><strong>Clear project \u00b7 nothing here is saved.</strong> The same ' +
          'organisation with nothing filled in \u2014 what a new deployment looks like on ' +
          'day one.</span>' +
          '<span>Every plan, figure and reported number is gone; the companies, business ' +
          'units, supporting functions and settings stay.</span>';
      }
    }
  }

  /* One shape for every /api/auth call this object makes: post JSON, hand
     back (error, body). Three callers with the same six lines is where a typo
     lives in exactly one of them. */
  function authPost(body, done) {
    fetch("/api/auth", { method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body)
    }).then(function (r) { return r.json(); })
      .then(function (j) { done(j.ok ? null : (j.error || "failed"), j); })
      .catch(function (e) { done(String(e.message || e), null); });
  }

  function mailPost(body, done) {
    fetch("/api/mail", { method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body)
    }).then(function (r) { return r.json(); })
      .then(function (j) { done(j.ok ? null : (j.error || "failed"), j); })
      .catch(function (e) { done(String(e.message || e), null); });
  }

  return {
    isLive: function () { return live; },
    /* Flush now rather than on the next 800ms tick, and say what happened.
       The ONLY caller is a button somebody pressed; nothing schedules it. */
    saveNow: function (done) { save(done); },
    isDemo: function () { return isDemoMode(); },
    /* Which of the two, for anything that needs to tell them apart. */
    demoMode: function () { return isDemoMode() ? mode : null; },
    /* `repaint` is the paint function boot() kept — the same one every other
       caller in here uses, so a menu item does not have to be handed one. */
    setMode: function (next) { setMode(next, repaint || function(){}); },
    person: function () { return person; },
    /* The three password operations, all SMO-only and all checked again on
       the server — this object is the convenience, never the enforcement. */
    setPassword: function (key, pw, done) {
      authPost({ action: "setPassword", person: key, password: pw },
        function (err) { done(err); });
    },
    /* One temporary password for a SET OF PEOPLE THE SERVER PICKS — which is
       the whole point: a stale screen can only ever issue to fewer people than
       it thinks, never more (§35). The client sends a password and a scope,
       never a list.

       scope "none" (default) — everyone who has never had a password.
       scope "all"  — every active person except you, an actual reset: it
                      overwrites live passwords and ends those sessions. */
    issueTemporary: function (pw, scope, done) {
      if (typeof scope === "function") { done = scope; scope = "none"; }
      authPost({ action: "issueTemporary", password: pw, scope: scope || "none" },
        function (err, j) { done(err, err ? null : (j.issued || [])); });
    },
    /* "none" / "temporary" / "set" per person key. Credentials never enter the
       state graph, so the People page has to ask for this separately. */
    passwordStates: function (done) {
      authPost({ action: "passwordStates" },
        function (err, j) { done(err, err ? null : (j.states || {})); });
    },
    /* What each person said about where they work (§56). Outside the state
       graph for the same reason credentials are, so the People page asks for
       it separately — and gets nothing at all from file://, where the register
       is whatever the demo baked in. */
    declarations: function (done) {
      authPost({ action: "declarations" },
        function (err, j) { done(err, err ? null : (j.said || {})); });
    },
    /* ── MAIL (§72) ─────────────────────────────────────────────────
       Its own endpoint, and its own two lines here rather than a third copy of
       authPost's six: /api/mail is not /api/auth, and the key it holds must
       never be somewhere a caller could ask for it by accident. `status` says
       whether the deployment can send at all and what address it would send
       from — never the key itself.

       `test` carries the HTML the PAGE built, so the message that arrives is
       the one the preview drew. Building it a second time on the server would
       be the drift §72 exists to prevent, one medium out. */
    mailStatus: function (done) {
      mailPost({ action: "status" }, function (err, j) { done(err, err ? null : j); });
    },
    mailAudience: function (criteria, done) {
      mailPost({ action: "audience", criteria: criteria },
        function (err, j) { done(err, err ? null : j); });
    },
    mailSend: function (o, done) {
      mailPost({ action: "send", draftId: o.draftId,
                 criteria: o.criteria, subject: o.subject, body: o.body,
                 ctaLabel: o.ctaLabel, ctaHref: o.ctaHref, html: o.html,
                 fromName: o.fromName, replyTo: o.replyTo },
        function (err, j) { done(err, err ? null : j); });
    },
    mailDraftSave: function (o, done) {
      mailPost({ action: "draftSave", id: o.id, subject: o.subject, body: o.body,
                 ctaLabel: o.ctaLabel, ctaHref: o.ctaHref, criteria: o.criteria },
        function (err, j) { done(err, err ? null : j); });
    },
    mailDraftList: function (done) {
      mailPost({ action: "draftList" }, function (err, j) { done(err, err ? null : j); });
    },
    mailDraftOpen: function (id, done) {
      mailPost({ action: "draftOpen", id: id }, function (err, j) { done(err, err ? null : j); });
    },
    mailDraftDelete: function (id, done) {
      mailPost({ action: "draftDelete", id: id }, function (err, j) { done(err, err ? null : j); });
    },
    mailHistory: function (done) {
      mailPost({ action: "history" }, function (err, j) { done(err, err ? null : j); });
    },
    /* ONE MESSAGE, AND WHAT HAPPENED TO EACH PERSON (§93.15). The endpoint has
       existed since §77 and nothing has ever called it — the record was written
       on every send and could not be read back from any screen. */
    mailHistoryOne: function (id, done) {
      mailPost({ action: "historyOne", id: id }, function (err, j) { done(err, err ? null : j); });
    },
    mailTest: function (o, done) {
      mailPost({ action: "test", to: o.to, subject: o.subject, html: o.html,
                 fromName: o.fromName, replyTo: o.replyTo },
        function (err, j) { done(err, err ? null : j); });
    },
    boot: function (paint) {
      repaint = paint;
      /* ── OPENED AS A FILE, THERE IS NOTHING TO WAIT FOR (§94.10) ──
         No fetch, so nothing arrives late and there is nothing for a
         skeleton to cover. theme.js does not stamp `booting` here either;
         bootLand() is called anyway so the two can never disagree. */
      if (!enabled) { bootLand(); paint(); return; }
      /* Taken before hydration, while the globals still hold the baked-in
         example — after hydration it is gone from memory. */
      DEMO = clone(graph());
      /* ── THE PAINT THAT USED TO BE HERE (§94.10) ─────────────────
         `paint()` ran first, unconditionally, and that single line was the
         whole of the fault: it drew the page from the BAKED file — the wrong
         colours, and on a client's deployment Raya Trade's units and figures
         — and the real one replaced it a moment later. The skeleton is on
         screen instead, and the first paint now happens when there is
         something true to paint.

         WHICH MAKES EVERY EXIT FROM HERE LOAD-BEARING. Nothing else will
         paint this page: not hydration, not a refusal, not a network that
         never answers. `land()` is the one door and it is idempotent, so the
         backstop and the answer racing each other is harmless. */
      var landed = false, t0 = bootNow();
      function land(then) {
        if (landed) return;
        landed = true;
        clearTimeout(backstop);
        /* A FAST ANSWER WOULD FLASH THE SKELETON ON AND OFF. Held to a floor
           so it reads as one step rather than a stutter — below the threshold
           anybody perceives as a delay, and only ever the remainder. */
        var wait = Math.max(0, BOOT_FLOOR - (bootNow() - t0));
        setTimeout(function () { bootLand(); (then || paint)(); }, wait);
      }
      /* NOBODY IS LEFT LOOKING AT GREY. If the answer has not come, the baked
         data is still better than a loading state with no end — and it is
         exactly what this line used to show immediately. */
      var backstop = setTimeout(function () {
        console.info("SMP: the database has not answered in " +
                     (BOOT_GIVEUP / 1000) + "s — showing the baked-in data");
        land();
      }, BOOT_GIVEUP);
      fetch("/api/state", { cache: "no-store" })
        .then(function (r) {
          /* Deployed and not signed in: the gate is the way in. A TEMPORARY
             password now gets the same answer — the server refuses the state
             until a real one is chosen, and the gate is where that happens. */
          if (r.status === 401 || r.status === 403) { location.replace("/"); throw new Error("sign in"); }
          if (!r.ok) throw new Error("HTTP " + r.status);
          return r.json();
        })
        .then(function (data) {
          if (!data.ok || !data.state) throw new Error(data.error || "bad payload");
          /* LEAVING, NOT LANDING. The backstop is dropped so it cannot
             paint a page the browser is already navigating away from, and
             the skeleton stays up until it does — which is right: the gate
             is where this person is going. */
          if (data.person && data.person.mustChange) { clearTimeout(backstop); location.replace("/"); return; }
          hydrate(data.state);
          LIVE = clone(data.state);
          live = true;
          person = data.person || null;
          land(function () {
            if (person) chromeFor(paint); else paint();
            /* ── AND ONLY NOW IS THERE ANYTHING TO SHOW SOMEBODY ──────
               The onboarding tour offers itself here and nowhere else: this
               is after the one paint that puts a true page on screen, so a
               first-time viewer is never handed a spotlight on the grey
               skeleton (§94.10). It declines in silence — no session, no
               story for their roles, already answered, a projector — which
               is the common case and must stay cheap. */
            TOUR.offer(person);
          });
          lastSaved = serialize();
          setInterval(save, 5000);

          /* The Demo controls exist only where there is a live dataset to
             tell the example apart from. Opened as a file the whole product IS
             the example, so they would mean nothing.

             Wired ONCE, here, and never repainted — they live in the chrome
             rather than in the page, so paint() does not replace them and
             markMode() only has to show and hide the right one (§67). */
          var menu = document.getElementById("demomenu");
          if (menu) {
            menu.querySelectorAll("[data-demomode]").forEach(function (b) {
              b.addEventListener("click", function () {
                menu.open = false;
                setMode(this.dataset.demomode, paint);
              });
            });
          }
          var btn = document.getElementById("demobtn");
          if (btn) {
            btn.addEventListener("click", function () { setMode("live", paint); });
          }
          markMode();
        })
        .catch(function (e) {
          /* "sign in" is the 401/403 above, which has already sent the
             browser to the gate — painting now would draw a page nobody is
             going to see, over data this person is not entitled to. */
          if (e.message === "sign in") { clearTimeout(backstop); return; }
          console.info("SMP: running on the baked-in data (" + e.message + ")");
          land();
        });
    },
    afterPaint: function () {
      if (!live) return;
      if (timer) clearTimeout(timer);
      timer = setTimeout(save, 800);
    }
  };
})();
