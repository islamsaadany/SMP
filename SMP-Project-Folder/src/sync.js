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
  /* ── THE WALL FOR A SERVER THAT DID NOT ANSWER (§201) ─────────────────
     Drawn only from land(), only when hydration failed over http. It retries
     on its own: any answer that means the server is back (ok, or a 401/403
     that will route to the gate) reloads; a 500 keeps waiting rather than
     reload-looping a broken deployment.

     The probe's handle lives at module scope because §230's late answer
     takes the wall down from outside this function — and that takedown must
     stop the probe too, or a reload fires ten seconds after the real page
     is already up. */
  var wallProbe = null;
  function noServerDown() {
    var d = document.getElementById("noserver");
    if (d) d.remove();
    if (wallProbe) { clearInterval(wallProbe); wallProbe = null; }
  }
  function noServerWall() {
    if (document.getElementById("noserver")) return;
    var d = document.createElement("div");
    d.id = "noserver";
    d.setAttribute("role", "alertdialog");
    d.setAttribute("aria-label", "Just a moment");
    /* Plain words at Islam's direction (§230.2): four short lines, no
       "server"/"data"/"example" — and §201's "Look at the example anyway"
       way past is REMOVED, cost stated: while the server is truly down
       the notice stands, retrying on its own. */
    d.innerHTML =
      '<div class="nosrv-card">' +
        '<h2>Just a moment\u2026</h2>' +
        '<p>Your page is taking a little longer to open. ' +
          'Your work is safe.</p>' +
        '<p class="nosrv-try" data-nosrv-note>It will open by itself ' +
          '\u2014 no need to do anything.</p>' +
        '<button type="button" class="nosrv-btn" data-nosrv-retry>Try again</button>' +
      '</div>';
    document.body.appendChild(d);
    d.querySelector("[data-nosrv-retry]").addEventListener("click", function () {
      location.reload();
    });
    wallProbe = setInterval(function () {
      fetch("/api/state", { cache: "no-store" }).then(function (r) {
        if (r.ok || r.status === 401 || r.status === 403) location.reload();
      }).catch(function () {});
    }, 10000);
  }

  /* Callers that asked to save while one was in flight, answered when the
     next one settles (§183). An array rather than a single slot: two people
     pressing Save draft and a flush-on-leave can all arrive inside one
     flight, and dropping any of them puts the word "Saving…" back on screen
     for good. */
  var queued = [];
  var live = false;        /* hydrated from the API; saves flow only then */
  var lastSaved = null;    /* the serialized graph the server last accepted */
  var timer = null;
  var saving = false;
  /* When the last save actually LEFT, so the leading edge below can tell a
     first change from the fourth in a burst. */
  var lastFlush = 0;
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
  /* AND THE SENTENCE THAT CAME WITH IT (§171). Without this the second hit on
     a remembered body is SILENT: `save()` short-circuits on `refusedBody` and
     never reaches the branch that draws the banner, so somebody who sets a
     cell, is refused, and sets it back gets no post and no message — the one
     shape of this fault that looks exactly like "it just does not save". */
  /* ── WHO THE SAVE IS JUDGED AS (§185) ──────────────────────────────
     Islam: *"Hala got this error, when I view as her I didn't get it — so
     the view-as function is not showing exactly what people see."* Right,
     and it was not a display fault. Measured, one edit judged twice:

         judged as Hala : REFUSED — a plan is corrected by the SMO
         judged as SMO  : ACCEPTED

     Viewing as somebody changed everything the screen DREW and nothing the
     server ACCEPTED, because authorisation reads the session cookie. So the
     office could never reproduce anybody's refusal — and, the other way
     round, could silently write things through a colleague's view that the
     colleague could never have written themselves.

     The simulated person now travels with the save and the server judges
     against THEM. It can only ever narrow: the gate on using it at all is
     the same seat role that draws the switcher, and a session without it
     is judged as itself exactly as before.

     Islam's choice, with the cost stated before he made it: you can no
     longer correct somebody's data while wearing their view — you switch
     back to yourself first, which is what the refusal now tells you. */
  function actingAs() {
    if (!person) return null;
    /* ONLY WHERE THE SWITCHER IS ACTUALLY THERE. `viewer()` REASSIGNS
       `window.VIEWER` to the first person on the register when it cannot find
       the key it holds (§69.15's "lost" case) — so on a deployment whose
       signed-in SMO is not yet ON the register, VIEWER points at a stranger
       through nobody's choice. Sending that would have every one of their
       saves judged as that stranger: a narrowing, which is the safe
       direction, and still a bootstrap tenant unable to set itself up.
       Asked through isSMOSession() and the register, which together are
       exactly when the control that sets VIEWER is drawn at all. */
    if (!isSMOSession()) return null;
    if (!PEOPLE.some(function (p) { return p.key === person.key; })) return null;
    var v = typeof window !== "undefined" ? window.VIEWER : null;
    return v && v !== person.key ? v : null;
  }
  /* ── THE ENVELOPE CARRIES WHAT CHANGED (§210) ─────────────────────
     Islam: *"why is the whole plan is sent, why don't we just send the
     changed element only not to cause this issue?"*

     `lastSaved` is the serialized graph the SERVER last accepted, which is
     exactly the baseline a change list needs — it is set on hydration and
     again after every save that landed, and it is already the thing `save()`
     compares against to decide there is anything to do at all.

     THE WHOLE GRAPH IS STILL SENT IN ONE CASE, and it is deliberate: when
     there is no baseline to diff against. That happens before the first
     hydration and if `lastSaved` will not parse — and in both, "everything"
     is the honest answer rather than a guess at a subset. `SMPDiff` is the
     shared module the server applies with (§42): the browser computing a
     change list the server understands differently is the drift that would
     write a value into the wrong part of the plan.

     THE SERVER APPLIES IT ONTO ITS OWN COPY, which is what stops an open tab
     erasing somebody else's work — that is in `api/state.js`, not here. */
  function bodyFor(state) {
    var who = actingAs();
    var tail = who ? ',"viewAs":' + JSON.stringify(who) : "";
    var base = null;
    if (lastSaved) { try { base = JSON.parse(lastSaved); } catch (e) { base = null; } }
    if (base && typeof SMPDiff !== "undefined" && SMPDiff.graphChanges) {
      try {
        var changes = SMPDiff.graphChanges(base, JSON.parse(state));
        return '{"changes":' + JSON.stringify(changes) + tail + "}";
      } catch (e) { /* fall through to the whole graph */ }
    }
    return '{"state":' + state + tail + "}";
  }

  var refusedWhy = null;
  /* §184: AND THE ROWS IT NAMED. Remembered beside the sentence for the same
     reason the sentence is: `save()` short-circuits on `refusedBody`, so the
     second hit on a remembered body draws the banner from these and nothing
     else — without them the offer to put the rows back would vanish the
     moment somebody changed something and changed it back. */
  var refusedRows = null;
  var refusedUndoable = false;
  /* Who `refusedBody` was judged as, so it is never held against somebody
     else's rights (§185). */
  var refusedAs = null;
  /* WHOSE RIGHTS THE SERVER USED, when they were not yours (§185). */
  var refusedJudged = null;

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
  /* ── AND A FAILED SAVE SAYS SO TOO (§171) ─────────────────────────
     Islam, twice: *"the roles and access are not saving."* It saves in every
     configuration this repository can build — the demo tenant, a CLEARED
     tenant (what a real deployment is, §67), a fast refresh, read back from
     `access_grants` each time — so whatever is happening on his deployment is
     something I cannot see from here. And the reason I cannot see it is the
     fault worth fixing: **a save that FAILS writes one line to a console
     nobody has open.**

     §32 made a REFUSED save say so on the page and stopped there, and §160.4
     recorded the other half — "a failed autosave is silent" — and left it.
     Left, it means a 500, a dropped connection or a timeout look exactly like
     a save that worked: the screen holds the new value, the database does not,
     and the next reload silently reverts. Which is, word for word, what was
     reported.

     THREE OUTCOMES, ONE BANNER. Refused keeps its list and its Discard button
     (the change is on screen and the only honest recovery is to throw it
     away). Failed says the status, because "500" sends somebody to the server
     and "could not reach" sends them to the network — §123's argument, one
     endpoint out. Demo mode says the thing the standing banner says generally,
     at the moment somebody changes something and expects it to stick.

     NOT A NEW COMPONENT: the element, the styling and the clearing on success
     are all §32's, and this only stops two of the three ways past it being
     silent. */
  function notSaved(html) {
    var el = document.getElementById("refused");
    if (!el) return;
    if (!html) { el.hidden = true; el.innerHTML = ""; return; }
    el.innerHTML = html;
    el.hidden = false;
  }

  /* WHY IT DID NOT GO, in the words that name where to look. The status is
     shown deliberately: a number is not jargon to the one person who can act
     on it, and without it every failure reads the same. */
  function showFailed(why) {
    notSaved("<span><strong>Not saved.</strong> " + esc(why) + "</span>" +
      "<span>Your change is still on screen and the platform keeps trying. " +
      "If it does not clear, reload before typing anything else \u2014 what is " +
      "on screen has not reached the database.</span>");
  }

  function showDemoBlocked() {
    notSaved("<span><strong>Not saved \u2014 this is demo data.</strong></span>" +
      "<span>Nothing changed here is written anywhere. Leave demo data from the " +
      "menu in the top bar to work on your own tenant.</span>");
  }

  /* ── PUTTING BACK ONLY WHAT WAS REFUSED (§184) ───────────────────
     Islam, on a strategy custodian: *"they lost all data they inputed."*
     The refusal itself was correct — one row genuinely was the office's —
     and the loss was everything around it. The whole graph posts together,
     so one refused row fails the whole save, and until now the only control
     on the banner was *Discard the change and reload*: the honest answer
     while the platform could not say WHICH row it had objected to, and a
     destructive one the moment it can.

     The server now names them (`refusedChanges`), with the value each field
     HELD. Putting them back is therefore not a guess and not a reload: the
     named fields go back to the stored value, everything else the person
     typed stays exactly where it is, and the next save carries it.

     THE ADDRESS IS THE TARGET AND THE ROW ID, NEVER A PATH. A path would be
     a second description of the state graph's shape, kept here and drifting
     from the one `collect()` walks (§53.5); an id inside a named subtree is
     the address the whole product already uses (§48: a snapshot is keyed by
     id, never by position). */
  var FIELD_WORDS = {
    finish: "Due date", start: "Start", end: "End", owner: "Owner",
    target: "Target", target3y: "3-year target", dir: "Direction",
    compile: "Compile rule", weight: "Weight", name: "Name",
    collaborators: "Collaborators", stakeholders: "Stakeholders",
    brief: "Brief", aspiration: "Aspiration", actual: "Figure", note: "Note",
    pct: "Progress", status: "Status", pend: "Awaiting confirmation"
  };
  function fieldWord(f) { return FIELD_WORDS[f] || String(f); }

  /* Where a target's rows live. A capability belongs to a supporting
     function, so an `fn:` target is BOTH the function and its capabilities —
     which is exactly how collectFunction() and collectCapabilities() split a
     function's plan between them, and getting it wrong here would mean a
     project's rows could never be found. */
  function refusedRoots(target) {
    var t = String(target || "group");
    if (t.indexOf("fn:") === 0) {
      var k = t.slice(3), out = [];
      if (typeof FUNCTIONS !== "undefined" && FUNCTIONS[k]) out.push(FUNCTIONS[k]);
      if (typeof GROUP !== "undefined")
        (GROUP.capabilities || []).forEach(function (c) { if (c && c.fn === k) out.push(c); });
      return out;
    }
    if (t !== "group" && typeof UNITS !== "undefined" && UNITS[t]) return [UNITS[t]];
    return typeof GROUP !== "undefined" ? [GROUP] : [];
  }
  /* The first object under `root` carrying this id. Ids are minted per unit
     and per capability (renumberUnit/renumberCapability), so within one
     target they are unique — which is the property that makes this safe and
     the reason it is scoped to the target rather than run over the graph. */
  function rowWithId(root, id) {
    var found = null;
    (function walk(v) {
      if (found || !v || typeof v !== "object") return;
      if (!Array.isArray(v) && v.id === id) { found = v; return; }
      (Array.isArray(v) ? v : Object.keys(v).map(function (k) { return v[k]; }))
        .forEach(walk);
    })(root);
    return found;
  }
  /* Put every named field back to what the server holds. Returns the rows it
     could NOT find, because a "put back" that silently missed one would post
     the same refusal again and read as the button doing nothing (§96). */
  function putBackRefused(changes) {
    var missed = [];
    (changes || []).forEach(function (ch) {
      var roots = refusedRoots(ch.target);
      (ch.rows || []).forEach(function (r) {
        var row = null;
        roots.forEach(function (rt) { if (!row) row = rowWithId(rt, r.id); });
        if (!row) { missed.push(r); return; }
        /* ABSENT IS NOT NULL. A field the stored row did not have is DELETED,
           or the put-back is itself a change and is refused all over again
           (§50.6's rule, arriving from the server this time). */
        if (r.had === false) delete row[r.field];
        else row[r.field] = r.from == null ? r.from : JSON.parse(JSON.stringify(r.from));
      });
    });
    return missed;
  }

  function showRefusal(list, changes, undoable, judged) {
    var el = document.getElementById("refused");
    if (!el) return;
    if (!list || !list.length) { el.hidden = true; el.innerHTML = ""; return; }
    /* One line per row, so "which line was it?" is answered on the banner
       rather than by hunting the page. Deduplicated by row and field: a
       milestone whose date and pending mark both moved is ONE line to a
       person and two entries to the classifier. */
    var seen = {}, lines = [];
    (changes || []).forEach(function (ch) {
      (ch.rows || []).forEach(function (r) {
        if (r.field === "pend") return;          /* the mark, not the value */
        var k = ch.target + "\u0000" + r.id + "\u0000" + r.field;
        if (seen[k]) return;
        seen[k] = 1;
        lines.push((r.name ? esc(r.name) : esc(r.id)) +
                   " \u2014 " + esc(fieldWord(r.field)));
      });
    });
    /* THE MISSING HALF OF THE SENTENCE (§185). "Setup is the SMO's" reads as
       a bug when you ARE the SMO — it is true because the save was judged as
       the person whose view you are wearing, and nothing on the screen said
       so. Named first, because it is what makes the rest make sense. */
    el.innerHTML = (judged
        ? "<span><strong>You are viewing as " + esc(judged.name) + ".</strong> " +
          "This was judged as them, not as you \u2014 switch back to your own " +
          "view to make it yourself.</span>"
        : "") +
      "<span><strong>Not saved.</strong> " +
      (list.length === 1 ? "" : "The server refused this change:") + "</span>" +
      (list.length === 1
        ? "<span>" + esc(list[0]) + "</span>"
        : "<ul>" + list.map(function (x) { return "<li>" + esc(x) + "</li>"; }).join("") + "</ul>") +
      (lines.length
        ? "<span><b>" + plural(lines.length, "line") + " refused:</b></span><ul>" +
          lines.map(function (x) { return "<li>" + x + "</li>"; }).join("") + "</ul>"
        : "") +
      "<span>" +
      (undoable
        ? '<button type="button" class="refused-keep" id="refused-keep">Put back ' +
          (lines.length === 1 ? "that line" : "those lines") +
          " and save the rest</button> "
        : "") +
      '<button type="button" class="refused-undo" id="refused-undo">' +
      "Discard everything and reload</button></span>";
    el.hidden = false;
    /* THE OFFERED ONE IS THE ONE THAT KEEPS THE WORK. Discard stays — it is
       the only way out when the refusal names no rows — but it is never the
       only control again when the platform knows what to put back. */
    var k = document.getElementById("refused-keep");
    if (k) k.addEventListener("click", function () {
      var missed = putBackRefused(changes);
      if (missed.length) {
        /* Said, never swallowed: a row the platform cannot find is a row it
           cannot put back, and pretending otherwise re-posts the refusal. */
        notSaved("<span><strong>Not saved.</strong> " + esc(list[0]) + "</span>" +
          "<span>" + plural(missed.length, "refused line") +
          " could not be put back automatically \u2014 they are no longer on this " +
          "page. Reload to take the stored version again.</span>" +
          '<span><button type="button" class="refused-undo" id="refused-undo">' +
          "Discard everything and reload</button></span>");
        var u2 = document.getElementById("refused-undo");
        if (u2) u2.addEventListener("click", function () { location.reload(); });
        return;
      }
      refusedWhy = null; refusedRows = null; refusedBody = null;
      showRefusal(null);
      /* Repaint first: the reverted values have to be what the person sees
         before anything else happens, or the page argues with the database
         about a row that was just put back (§35). */
      if (typeof paint === "function") paint();
      save();
    });
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
    /* ONE EXIT, so a path added later cannot forget the parked callers
       (§104.7). `say` reports to THIS caller and then drains anybody who
       arrived while the flight was open — by re-running the save, because
       their change may not have been in it. */
    var say = function (state) {
      if (done) done(state);
      if (!queued.length || saving) return;
      var waiting = queued.splice(0, queued.length);
      /* Deferred, so the drain cannot recurse inside the settle handler that
         has only just set `saving = false`. */
      setTimeout(function () {
        save(function (st) { waiting.forEach(function (f) { if (f) f(st); }); });
      }, 0);
    };
    /* The guard that matters: demo data must never reach the database. */
    /* SAID ONLY FOR DEMO DATA. Opened from `file://` there is no server at
       all and the prototype banner already says so; a second sentence per
       change would be noise about something nobody expected to save. */
    if (isDemoMode()) { showDemoBlocked(); return say("offline"); }
    if (!live) return say("offline");
    /* ── ASKED WHILE ONE IS ALREADY IN FLIGHT (§183) ────────────────────
       Islam: *"the reporting then saving to draft keep saying saving and
       nothing happens but when I exit and come back the entered number
       saved."*

       Both halves were true. `"busy"` was answered the moment Save draft was
       pressed and the only caller drew **"Saving…"** for it — a word with no
       follow-up, because nothing ever told the button that the flight it was
       waiting behind had landed. The figure did save (the autosave §170 had
       already started carried it), so the screen sat on a present participle
       for ever over a change that was safely stored.

       Since §170 made the autosave LEADING-EDGE, this is not a rare race: the
       first change of a burst posts at once, and Save draft pressed in the
       next moment lands squarely inside that flight. The button people reach
       for after typing is the one most likely to hit it.

       So a caller that arrives mid-flight is PARKED and answered when the
       next save settles — and it is a real save, not the in-flight one's
       answer borrowed: that flight serialized BEFORE this change, so its
       success says nothing about whether this change reached the server.
       Re-running is correct in both cases and costs nothing when there is
       nothing new (`serialize() === lastSaved` answers "clean" at once).

       `"busy"` is therefore no longer an outcome anything can be told — the
       five §63 named are the whole set again. */
    if (saving) { queued.push(done); return; }
    var now = serialize();
    if (now === lastSaved) return say("clean");
    /* THE REMEMBERED REFUSAL IS PER VIEWER (§185). The same graph refused for
       one person is not refused for another, so switching back to yourself
       must not run into a body remembered under somebody else's rights —
       which would silence a save that is now perfectly legitimate. */
    if (refusedAs !== actingAs()) { refusedBody = null; refusedWhy = null;
                                    refusedRows = null; refusedUndoable = false;
                                    refusedJudged = null; }
    if (now === refusedBody) {
      showRefusal(refusedWhy, refusedRows, refusedUndoable, refusedJudged);
      return say("refused");
    }
    saving = true;
    lastFlush = Date.now();
    fetch("/api/state", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: bodyFor(now)
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
        refusedBody = now; refusedAs = actingAs();
        say("refused");
        return r.json().then(function (j) {
          if (j && j.mustChange) { location.replace("/"); return; }
          refusedWhy = (j && j.refusals) || null;
          refusedRows = (j && j.refusedChanges) || null;
          refusedUndoable = !!(j && j.undoable);
          refusedJudged = (j && j.judgedAs) || null;
          showRefusal(refusedWhy, refusedRows, refusedUndoable, refusedJudged);
        }, function () {
          /* A 403 whose body will not parse is still a refusal, and saying
             nothing about it is the silence this section exists to remove. */
          refusedWhy = ["The server refused the change and gave no reason."];
          refusedRows = null; refusedUndoable = false; refusedJudged = null;
          showRefusal(refusedWhy);
        });
      }
      if (r.ok) {
        refusedWhy = null; refusedRows = null; refusedUndoable = false;
        refusedJudged = null;
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
        showFailed("The server answered HTTP " + r.status + ".");
        console.warn("SMP: save failed (HTTP " + r.status + ")");
      }
    }).catch(function (e) {
      saving = false;
      say("failed");
      /* A fetch that rejects is the network, not the server — a different
         errand, so a different sentence. */
      showFailed("The platform could not reach the server (" +
                 (e && e.message ? e.message : "no answer") + ").");
      console.warn("SMP: save failed (" + (e && e.message) + ")");
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
    /* §206: VIEWER IS SET EITHER WAY, AND NEVER LEFT AT ITS DEFAULT.
       `var VIEWER = "smo"` is the file:// demo's starting point and it is a
       REAL PERSON KEY — on a live tenant it is the bootstrap SMO. This was
       inside `if (known)`, so a signed-in person the hydrated register does
       not hold kept somebody else's key: measured, session
       `mohamed.mokhtar` with `VIEWER === "smo"`. Everything that asks
       `viewer()` rather than the session then answers as the SMO — the
       welcome screen the house button opens (§185) among them, which is how
       a colleague can be shown another person's greeting and chips while
       correctly signed in as themselves.

       Setting it regardless makes `viewer()` find NOBODY, which is exactly
       what the note below already tells the person has happened — that
       comment says "render nobody" and the code was still pointing at the
       first key in the file. §69.15's own rule, one variable further in: a
       value that is dangerous when wrong must fail closed. */
    window.VIEWER = person.key;
    if (known) sel.value = person.key;
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
         is saved.

         THE FILLED EXAMPLE'S SECOND LINE IS GONE (§162, Islam's call). It read
         "Only Mobile's plan is real — every other unit, every capability's
         content and every reported figure is invented", and it was §21's
         labelling of invented content. The cost is stated rather than hidden:
         nothing on this screen now says which parts were made up, so anybody
         shown the worked example has to be told. The first line still says
         it is the demo and that nothing is saved, which is what stops somebody
         mistaking it for their own tenant — the part that could do damage. */
      if (mode === "demo") {
        ban.innerHTML =
          '<span><strong>Demo data \u00b7 nothing here is saved.</strong> The full worked ' +
          'example, for explaining how the platform works.</span>';
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

  /* THE TRAILING HALF OF THE DEBOUNCE (§170).

     It used to RE-ARM itself on a `"busy"` answer, because `save()` refused a
     caller that arrived mid-flight and scheduled nothing — so without the
     retry the last change of a burst that collided with an in-flight save
     waited for the 5s interval.

     §183 gave `save()` the parking that makes that unnecessary: a caller
     arriving mid-flight is held and the save is RE-RUN when the flight
     settles, which is precisely what this timer was arranging by hand, and
     without the 300ms wait. So the retry goes rather than being left
     unreachable (§24) — two mechanisms for one job is how they drift, and
     this one's own comment had already stopped being true. */
  function tick() {
    timer = null;
    save();
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

  /* ── THE LAST 800ms SURVIVE LEAVING THE PAGE (§138, closing §126.1) ─────
     The debounce above means an edit made and the tab closed or hidden inside
     that window was never sent: the screen showed the new value, the database
     never received it — every page in the product, invisibly. So when the tab
     goes away, anything waiting is sent NOW.

     Deliberately not save(): this path touches none of the bookkeeping
     (`saving`, `lastSaved`, `refusedBody` stay as they are), because if the
     tab comes BACK the ordinary path must still compare and decide for
     itself — and a duplicate POST of an identical state diffs empty on the
     server and costs nothing (§42). It also interprets no answer: on the way
     out there is nobody to show a refusal to; the ordinary path re-earns one
     on the next change.

     `keepalive` is what lets the request outlive the page, and it caps the
     body at 64KB — over the cap this becomes a plain fetch, which completes
     whenever the tab is merely hidden (the common case: a switch-away, a
     minimise, and every close passes through hidden first) and is
     best-effort on a hard kill. Stated rather than glossed: a state graph
     over 64KB closed in under 800ms can still lose the race.

     SKIPPED WHILE A SAVE IS IN FLIGHT, on purpose: two concurrent POSTs have
     no ordering, and an older body landing after a newer one would UNDO the
     newer — losing more than the keystroke this exists to keep. The window
     left open (an edit made during an in-flight save, the tab gone before it
     settles) is the small corner of a small corner, and the 5s interval owns
     it whenever the tab survives. */
  /* ── COMMIT THE BOX BEFORE LEAVING (§219) ─────────────────────────
     Islam, on Hala: *"she updated the definition of her capability and left
     and came back didn't find it."* The save path was not the fault — every
     bound field in the product writes on `change`, which for a text box
     means WHEN THE CURSOR LEAVES IT (§35), and this flush sends work that
     is already in the graph. So typing a definition and then closing the
     tab wrote nothing at all: no error, because from the platform's side
     nothing was ever entered.

     §170 closed the debounce window and this is the window one step
     earlier — the value had not reached the graph to be debounced.

     `blur()` rather than a synthesised `change`: it is what the browser
     itself does when focus moves, so a field wired any other way behaves
     the same, and a field already committed fires nothing. Wrapped, because
     a throw here would take the flush with it and lose everything else. */
  function commitFocus() {
    try {
      var el = document.activeElement;
      if (el && el !== document.body && typeof el.blur === "function") el.blur();
    } catch (e) { /* leaving anyway */ }
  }
  function flushLeave() {
    commitFocus();
    if (!live || isDemoMode() || saving) return;
    if (timer) { clearTimeout(timer); timer = null; }
    var now = serialize();
    if (now === lastSaved) return;
    if (now === refusedBody && refusedAs === actingAs()) return;
    var body = bodyFor(now);
    try {
      fetch("/api/state", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: body,
        keepalive: body.length < 60000
      });
    } catch (e) { /* leaving anyway — the console has nothing useful to add */ }
  }
  document.addEventListener("visibilitychange", function () {
    if (document.hidden) flushLeave();
  });
  window.addEventListener("pagehide", flushLeave);

  /* ── A VIEW-AS SESSION STARTS WHERE THEIR SESSION WOULD START (§237) ──
     Islam: *"viewing as needs to have the same server connection and
     relation and not inherit my SMO abilities … so I get the errors."*
     The JUDGING half has been the viewed person's since §185, and §234.2
     records what stayed the SMO's: the TAB — its baseline, its history,
     its leftovers flushed as the SMO by the switch's own §204 flush. So a
     switch now re-fetches the server's graph and rebases the tab on it,
     which is exactly what happens when that person signs in: nothing of
     the SMO tab's past can ride into a save judged as them, and what the
     simulated session sees is what the server holds at that moment.

     REUSES THE BOOT'S OWN `hydrate` — a second way of applying a fetched
     graph is §53.5's drift. `LIVE` is refreshed too, or leaving demo data
     after a rebase would put the boot-time snapshot back on screen.

     ONLY WHERE THERE IS A SERVER AND ONLY IN LIVE MODE: `file://` has
     nothing to fetch and demo data is deliberately not the server's. A
     fetch that fails leaves the tab exactly as it was and answers false —
     the switch still happens, judged correctly (§185), on the old
     baseline: the honest fallback, never a blocked way home (§209). */
  function rebase(done) {
    done = done || function () {};
    if (!live || isDemoMode() || saving) return done(false);
    fetch("/api/state", { cache: "no-store" })
      .then(function (r) {
        if (r.status === 401 || r.status === 403) { location.replace("/"); throw new Error("sign in"); }
        if (!r.ok) throw new Error("HTTP " + r.status);
        return r.json();
      })
      .then(function (data) {
        if (!data.ok || !data.state) throw new Error(data.error || "bad payload");
        hydrate(data.state);
        LIVE = clone(data.state);
        lastSaved = serialize();
        done(true);
      })
      .catch(function () { done(false); });
  }

  return {
    isLive: function () { return live; },
    /* Flush now rather than on the next 800ms tick, and say what happened.
       The ONLY caller is a button somebody pressed; nothing schedules it. */
    saveNow: function (done) { save(done); },
    /* Take the server's current graph as the tab's new truth (§237). The
       caller is the viewer switch and nothing else schedules it. */
    rebase: function (done) { rebase(done); },
    isDemo: function () { return isDemoMode(); },
    /* Which of the two, for anything that needs to tell them apart. */
    demoMode: function () { return isDemoMode() ? mode : null; },
    /* `repaint` is the paint function boot() kept — the same one every other
       caller in here uses, so a menu item does not have to be handed one. */
    setMode: function (next) { setMode(next, repaint || function(){}); },
    person: function () { return person; },
    /* WHO THE SMO IS, ASKED AND NEVER COPIED (§179). The welcome screen draws
       the viewer switcher too, and the note above isSMOSession() is explicit
       that this question must have ONE answer: a control that is dangerous
       when wrong must fail closed, and two files each testing `role ===
       "super"` is exactly how one of them comes to test something else.
       Exported rather than re-asked — §42's rule about one copy of a rule,
       on the chrome. */
    isSMOSession: function () { return isSMOSession(); },
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
    /* THE SMO'S OTHER ANSWER (§180). "Use it" is an ordinary edit of the
       person's BU and needs no endpoint; this one records that the claim was
       looked at and refused, so it has to reach the server — and the server
       asks the gate again rather than trusting this (§42). */
    dismissWhere: function (key, done) {
      authPost({ action: "dismissWhere", person: key },
        function (err) { done(err); });
    },
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
      /* `greet` is the WORD, and it is here for the RECORD rather than for the
         send: the personalisation rides in the html's marked region, so a
         build that dropped this would mail perfectly and write a record saying
         no message ever greeted anybody (spec 022). Which is what happened —
         this function names every field it forwards, so the new one was
         silently absent until the check asked what was posted. */
      mailPost({ action: "send", draftId: o.draftId,
                 criteria: o.criteria, subject: o.subject, body: o.body,
                 ctaLabel: o.ctaLabel, ctaHref: o.ctaHref, html: o.html,
                 greet: o.greet,
                 fromName: o.fromName, replyTo: o.replyTo },
        function (err, j) { done(err, err ? null : j); });
    },
    mailDraftSave: function (o, done) {
      mailPost({ action: "draftSave", id: o.id, subject: o.subject, body: o.body,
                 ctaLabel: o.ctaLabel, ctaHref: o.ctaHref, greet: o.greet,
                 criteria: o.criteria },
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
    /* ── REMOVING A TEST COPY (§145) ────────────────────────────────
       The server decides whether it may go, and whether the row is a test at
       all — this only carries the id. */
    mailHistoryDelete: function (id, done) {
      mailPost({ action: "historyDelete", id: id }, function (err, j) { done(err, err ? null : j); });
    },
    mailTest: function (o, done) {
      /* `body` IS FORWARDED, and it was not. This function names every field it
         sends, so a field absent here is a field the server never sees however
         correctly the caller filled it — the fault §142 hit with `greet`, where
         the emails were personalised perfectly and the record held nothing. It
         cost nothing while a test copy was recorded nowhere; now that the row
         is written (§145), leaving it out would store every test copy with an
         empty body. */
      mailPost({ action: "test", to: o.to, subject: o.subject, html: o.html,
                 body: o.body, fromName: o.fromName, replyTo: o.replyTo },
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
      var landed = false, landedLive = false, t0 = bootNow();
      function land(then) {
        /* ── A LATE ANSWER STILL LANDS (§230) ─────────────────────────
           A cold function's first answer often arrives AFTER the 8s
           give-up and used to be dropped here, leaving the person behind
           the wall with their real data already hydrated. A second landing
           is allowed for exactly one case — the first was the backstop's,
           this one carries the live tenant: paint in place, wall down, no
           reload. A late FAILURE still returns, wall and probe standing. */
        if (landed) {
          if (!live || landedLive) return;
          landedLive = true;
          (then || paint)();
          noServerDown();
          return;
        }
        landed = true;
        landedLive = live;
        clearTimeout(backstop);
        /* A FAST ANSWER WOULD FLASH THE SKELETON ON AND OFF. Held to a floor
           so it reads as one step rather than a stutter — below the threshold
           anybody perceives as a delay, and only ever the remainder. */
        var wait = Math.max(0, BOOT_FLOOR - (bootNow() - t0));
        setTimeout(function () {
          bootLand(); (then || paint)();
          /* ── LANDING ON THE EXAMPLE MUST SAY SO (§201) ────────────────
             Islam, after a hard refresh on a morning the server was slow:
             *"it opened on the prototype page with no way to exit it."*
             He is right on both counts. When hydration fails or times out,
             what paints is the BAKED worked example — Raya Trade — wearing
             only a banner that calls itself a prototype, with nothing that
             says "this is not your tenant, the server did not answer", and
             the only way back is a reload nobody was told to make.

             `live` is false on exactly this path and no other, so a wall is
             drawn over the page: what is behind it is the example, nothing
             typed into it is saved (`save()` already refuses while !live —
             the wall makes the refusal VISIBLE instead of silent), Try again
             reloads, and it retries by itself so a server that wakes up
             brings the real page back with nobody pressing anything.
             §230.2 removed the "look at the example anyway" way past, at
             Islam's direction — the wall now stands until the server
             answers, and the words on it are the user's (see noServerWall). */
          if (enabled && !live) noServerWall();
        }, wait);
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
               The welcome screen and the onboarding tour offer themselves
               here and nowhere else: this is after the one paint that puts
               a true page on screen, so nobody is ever handed a greeting or
               a spotlight over the grey skeleton (§94.10). Both decline in
               silence — no session, already seen, a projector — which is
               the common case and must stay cheap.

               THE WELCOME TAKES PRECEDENCE AND THE TOUR IS NOT LOST (§148):
               two docks over one page would fight for every click (§118's
               fault by another door), and the welcome's intro-round card is
               the tour's own offer, made visibly instead of automatically.
               TOUR.offer's memory is untouched, so with the welcome already
               seen this session the tour offers itself exactly as before. */
            var greeted = false;
            try { greeted = WELCOME.offer(person); } catch (e) {}
            if (!greeted) TOUR.offer(person);
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
    /* ── A CHANGE IS SAVED AT ONCE, AND A BURST STILL COALESCES (§170) ──
       Islam: *"on every refresh the roles and access table resets."* It does
       save — driven end to end against a real Postgres, a pressed cell reaches
       `access_grants` and survives a reload. What it does not survive is being
       pressed and the page refreshed inside the 800ms this function waits, and
       that is exactly how somebody checks whether a setting stuck.

       §138's flush-on-leave was built for this and CANNOT reach it here. It
       says so itself: `keepalive` caps a body at 64KB and over the cap it
       becomes a plain fetch the navigation cancels. Measured on this tenant,
       one save is **216,307 bytes** — three and a half times the cap — so on
       SMP that net has never once caught anything. The residual §138 recorded
       as "a small corner" is, for this product, every single save.

       SO THE WAIT IS WHAT GOES, not the coalescing. The first change of a
       burst is sent IMMEDIATELY and the trailing timer still runs, which is an
       ordinary leading-edge debounce and buys both things at once: one press —
       the overwhelmingly common case, and the only one on a settings page — is
       durable the instant it is made, while five presses in half a second cost
       two POSTs instead of five. A lone change costs no extra request either:
       the trailing tick finds the graph identical to `lastSaved` and returns
       "clean" without posting (§42's diff, one layer up).

       DELIBERATELY NOT A LIST OF CONTROLS. Every writer in the platform ends
       in `paint()` and every `paint()` ends here, so this reaches a control
       added tomorrow — and a per-control rule is the list somebody forgets to
       add to (§104.7, twice already).

       AND TYPING IS NOT AFFECTED, which is the one thing that made the wait
       worth having: a text field writes on `change`, which for an input means
       on BLUR (§35, §71.2), so a keystroke has never reached this function.

       WHAT IS STILL OPEN, stated rather than glossed: a SECOND change landing
       within 800ms of the first, with the page left before the trailing tick,
       is still lost. Closing that needs a save small enough for `keepalive` —
       a diff rather than the whole graph — which is a different change. */
    afterPaint: function () {
      if (!live) return;
      if (timer) clearTimeout(timer);
      timer = setTimeout(tick, 800);
      var now = Date.now();
      if (!saving && now - lastFlush >= 800) { lastFlush = now; save(); }
    }
  };
})();
