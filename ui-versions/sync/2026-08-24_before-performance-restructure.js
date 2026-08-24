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

  function save() {
    /* The guard that matters: demo data must never reach the database. */
    if (!live || mode === "demo" || saving) return;
    var now = serialize();
    if (now === lastSaved) return;
    if (now === refusedBody) return;
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
      }
      else console.warn("SMP: save failed (HTTP " + r.status + ") — will retry on the next change");
    }).catch(function (e) {
      saving = false;
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
  function chromeFor(paint) {
    var box = document.querySelector(".viewer");
    var sel = document.getElementById("asWho");
    if (!box || !sel) return;
    if (PEOPLE.some(function (p) { return p.key === person.key; })) {
      window.VIEWER = person.key;
      sel.value = person.key;
    }
    /* THE SEAT ROLE, NOT A LEVEL. This read `person.level !== "smo"` — a name
       that stopped existing when roles replaced levels (§33). The server has
       returned `role` ("super") ever since, so `undefined !== "smo"` was true
       for EVERYBODY and the switcher was hidden from the one person it is for:
       the SMO saw "Signed in as …" and lost the simulation entirely. A
       comparison against a field nobody sets fails silently and in the safe
       direction, which is why it survived a version. */
    if (person.role !== "super") {
      sel.hidden = true;
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
  function setMode(next, paint) {
    if (!DEMO || next === mode) return;
    if (mode === "live") LIVE = clone(graph());
    mode = next;
    hydrate(clone(mode === "demo" ? DEMO : LIVE));
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
    if (btn) btn.textContent = mode === "demo" ? "Exit demo" : "Demo data";
    var ban = document.getElementById("banner");
    if (ban) {
      ban.hidden = mode !== "demo";
      if (mode === "demo") {
        ban.innerHTML =
          '<span><strong>Demo data \u00b7 nothing here is saved.</strong> The full worked ' +
          'example, for explaining how the platform works.</span>' +
          '<span><strong>Only Mobile\u2019s plan is real</strong> \u2014 every other unit, every ' +
          'capability\u2019s content and every reported figure is invented.</span>';
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

  return {
    isLive: function () { return live; },
    isDemo: function () { return mode === "demo"; },
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
    boot: function (paint) {
      repaint = paint;
      paint();
      if (!enabled) return;
      /* Taken before hydration, while the globals still hold the baked-in
         example — after hydration it is gone from memory. */
      DEMO = clone(graph());
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
          if (data.person && data.person.mustChange) { location.replace("/"); return; }
          hydrate(data.state);
          LIVE = clone(data.state);
          live = true;
          person = data.person || null;
          if (person) chromeFor(paint); else paint();
          lastSaved = serialize();
          setInterval(save, 5000);

          /* The Demo button exists only where there is a live dataset to tell
             the example apart from. Opened as a file the whole product IS the
             example, so the button would mean nothing. */
          var btn = document.getElementById("demobtn");
          if (btn) {
            btn.hidden = false;
            btn.addEventListener("click", function () {
              setMode(mode === "demo" ? "live" : "demo", paint);
            });
          }
          markMode();
        })
        .catch(function (e) {
          if (e.message !== "sign in")
            console.info("SMP: running on the baked-in data (" + e.message + ")");
        });
    },
    afterPaint: function () {
      if (!live) return;
      if (timer) clearTimeout(timer);
      timer = setTimeout(save, 800);
    }
  };
})();
