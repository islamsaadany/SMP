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

  function graph() {
    return {
      group: GROUP, unitKeys: UNIT_KEYS, units: UNITS,
      functionKeys: FUNCTION_KEYS, functions: FUNCTIONS,
      people: PEOPLE, unitRoles: UNIT_ROLES, levels: LEVELS, access: ACCESS,
      labels: LABELS.entries, bands: BANDS.bands, koWeights: KO_WEIGHTS,
      cycle: CYCLE, review: REVIEW, history: HISTORY, priorCycle: PRIOR_CYCLE
    };
  }

  function serialize() {
    var s = JSON.parse(JSON.stringify(graph()));
    s.unitKeys.forEach(function (k) { if (s.units[k]) s.units[k].weight = 0; });
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
    window.PEOPLE = state.people;
    window.UNIT_ROLES = state.unitRoles;
    window.LEVELS = state.levels;
    window.ACCESS = state.access;
    LABELS.entries = state.labels;
    BANDS.bands = state.bands;
    window.KO_WEIGHTS = state.koWeights || {};
    window.CYCLE = state.cycle;
    window.REVIEW = state.review;
    window.HISTORY = state.history;
    if (state.priorCycle) window.PRIOR_CYCLE = state.priorCycle;
    UNIT_KEYS.forEach(function (k) { UNITS[k].ukey = k; });
    syncWeights();
  }

  function save() {
    if (!live || saving) return;
    var now = serialize();
    if (now === lastSaved) return;
    saving = true;
    fetch("/api/state", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: '{"state":' + now + "}"
    }).then(function (r) {
      saving = false;
      if (r.ok) lastSaved = now;
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
    if (person.level !== "smo") {
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
    box.appendChild(out);
    paint();
  }

  return {
    isLive: function () { return live; },
    person: function () { return person; },
    /* The SMO issues or resets a password from Levels & access. The server
       checks the policy and the issuer; the password is temporary and forces
       a change on first sign-in. */
    setPassword: function (key, pw, done) {
      fetch("/api/auth", { method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "setPassword", person: key, password: pw })
      }).then(function (r) { return r.json(); })
        .then(function (j) { done(j.ok ? null : (j.error || "failed")); })
        .catch(function (e) { done(String(e.message || e)); });
    },
    boot: function (paint) {
      paint();
      if (!enabled) return;
      fetch("/api/state", { cache: "no-store" })
        .then(function (r) {
          /* Deployed and not signed in: the gate is the way in. */
          if (r.status === 401) { location.replace("/"); throw new Error("sign in"); }
          if (!r.ok) throw new Error("HTTP " + r.status);
          return r.json();
        })
        .then(function (data) {
          if (!data.ok || !data.state) throw new Error(data.error || "bad payload");
          if (data.person && data.person.mustChange) { location.replace("/"); return; }
          hydrate(data.state);
          live = true;
          person = data.person || null;
          if (person) chromeFor(paint); else paint();
          lastSaved = serialize();
          setInterval(save, 5000);
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
