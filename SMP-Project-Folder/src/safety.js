/* ══ SAVE-SAFETY BANNERS (§258) ═════════════════════════════════════════════
   Islam, after a reporting round in which people lost work twice over:
   "can we have some sort of mid page warning like the error and network issue
   in case the person is saving with someone opening the same thing … or any
   other case that might impact the loss of data with clear action so we can
   know what to do?"

   TWO CAUTIONS, ONE FAMILY. Both ride the banner slot the refusal already uses
   (#refused, §32/§171) and wear the ATTENTION ground, never the alarm red:
   nothing has gone wrong yet, and telling somebody to act is not telling them
   they failed (§168, §190).

   1 · A NEWER VERSION IS READY. The live incident was a tab still running the
       build from before a save-protocol fix shipped — it posted the whole plan,
       was refused naming a function it never opened, and every field reverted
       (§216/§234, and migration 040's reason). The service worker is the one
       thing that changes on every content deploy (§91: SHELL is bumped when the
       built bytes change), and sw.js claims its clients on activate — so an
       OPEN tab learns of a deploy through `controllerchange`. This asks the
       registration to look for a new worker on a clock and on coming back to
       the tab, and when one takes over it says so and offers Reload. A stale
       tab is told BEFORE it can lose a save.

       ONLY WHEN THERE WAS A CONTROLLER BEFORE. `controllerchange` also fires
       on the very first install, when nobody is stale — warning then would
       greet every new browser with "reload" (§61's empty hand, reversed).

   2 · SOMEBODY ELSE UPDATED THIS PAGE. Different fields already merge (§210
       lays each person's change over the stored graph), so the one real risk
       is two people typing over the SAME number — and the person about to
       lose is the one who cannot see it coming. The server already writes
       every landed change to `change_log` with who and when (§42), so this
       asks, lightly and only while the tab is visible, "did anyone else land a
       change on the page I am on since I loaded it?" and names them.

       "RELOAD & KEEP MINE" IS §210 DOING THE WORK. It flushes this tab's own
       pending change FIRST — the server lays it over their update — and
       reloads only when the flush landed (`saved`, or `clean` when there was
       nothing to send). A refusal or a failure stays on the page in its own
       banner (§171) and nothing reloads over it.

   NEVER paint(), never over file:// (§94.11 — there is no server to be stale
   against), and every browser call is guarded: a missing service worker or a
   failed registration is not this feature's to complain about (§231.5). */
var SAFETY = (function(){
  var UPDATE_EVERY = 60000;   /* ask the worker for a newer build */
  var PEEK_EVERY   = 20000;   /* ask change_log about this page   */

  var el = null, shown = null, since = null, armed = false, peekTimer = null,
      updTimer = null, lastAt = null, shownFor = null;

  function servable(){ return location.protocol !== "file:"; }
  function live(){ return typeof SYNC !== "undefined" && SYNC.isLive && SYNC.isLive(); }
  function E(s){ return typeof esc === "function" ? esc(s) : String(s == null ? "" : s); }

  /* THE SLOT: a sibling of #refused, so both cautions and the refusal stack in
     the one place the chrome already keeps for "something about saving". */
  function mount(){
    if (el || !servable() || !document.body) return;
    el = document.createElement("div");
    el.className = "banner safety";
    el.id = "safety";
    el.hidden = true;
    var ref = document.getElementById("refused");
    if (ref && ref.parentNode) ref.parentNode.insertBefore(el, ref.nextSibling);
    else document.body.insertBefore(el, document.body.firstChild);
  }

  function hide(){ if (el) { el.hidden = true; el.innerHTML = ""; } shown = null; shownFor = null; }

  function draw(kind, html){
    mount(); if (!el) return;
    shown = kind;
    el.innerHTML = html;
    el.hidden = false;
    var r = el.querySelector("[data-safety-reload]");
    if (r) r.addEventListener("click", function(){ location.reload(); });
    var k = el.querySelector("[data-safety-keep]");
    if (k) k.addEventListener("click", function(){
      k.disabled = true; k.textContent = "Saving…";
      var done = function(how){
        if (how === "saved" || how === "clean") { location.reload(); return; }
        /* Refused or failed: sync.js has already said so in its own banner;
           this one steps aside rather than reloading over the explanation. */
        k.disabled = false; k.textContent = "Reload & keep mine";
      };
      if (typeof SYNC !== "undefined" && SYNC.saveNow) SYNC.saveNow(done); else done("clean");
    });
    var d = el.querySelector("[data-safety-dismiss]");
    if (d) d.addEventListener("click", hide);
  }

  var ICON_RELOAD = '<svg class="safety-ic" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M21 12a9 9 0 1 1-2.64-6.36"/><path d="M21 3v6h-6"/></svg>';
  var ICON_PEOPLE = '<svg class="safety-ic" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="9" cy="8" r="3.2"/><path d="M3.5 19a5.5 5.5 0 0 1 11 0"/><circle cx="17.5" cy="9" r="2.4"/><path d="M15 19a4.5 4.5 0 0 1 6.5-4"/></svg>';

  /* ── 1 · A NEWER VERSION IS READY ────────────────────────────────────── */
  function newVersion(){
    if (shown === "version") return;
    draw("version", ICON_RELOAD +
      '<div class="safety-msg"><strong>A newer version of the platform is ready</strong>' +
      '<span>Reload to get it — your work is safe and already saved.</span></div>' +
      '<div class="safety-acts"><button type="button" class="safety-btn" data-safety-reload>Reload</button></div>');
  }

  function armWorker(){
    if (armed || !servable() || !("serviceWorker" in navigator)) return;
    armed = true;
    var had = !!navigator.serviceWorker.controller;
    navigator.serviceWorker.addEventListener("controllerchange", function(){
      if (had) newVersion();
      had = true;
    });
    var reg = null;
    var check = function(){ if (reg && reg.update) reg.update().catch(function(){}); };
    navigator.serviceWorker.getRegistration().then(function(r){
      reg = r || null;
      if (!reg) return;
      updTimer = setInterval(check, UPDATE_EVERY);
      document.addEventListener("visibilitychange", function(){
        if (document.visibilityState === "visible") check();
      });
    }).catch(function(){});
  }

  /* ── 2 · SOMEBODY ELSE UPDATED THIS PAGE ─────────────────────────────── */
  /* THE PAGE, OR NOTHING. The shell maps a Setup page onto the group's key
     (`TARGET = "group"` while `current` is setup), so asking by TARGET alone
     had a Setup screen told about group-level saves it had nothing to do
     with (§258.1). Setup is asked about nothing: its own changes are logged
     against no target, and nobody edits it alongside somebody else. */
  function target(){
    var c = typeof current !== "undefined" ? current : null;
    if (!c || c === "setup" || c === "manage") return null;
    var t = typeof TARGET !== "undefined" ? TARGET : null;
    return t && t !== "setup" && t !== "manage" ? t : null;
  }
  function pageName(t){
    try { if (typeof placeLabel === "function") return placeLabel(t); } catch (e) {}
    return t === "group" ? "the group" : String(t || "").replace(/^fn:/, "");
  }

  function edited(by, when, t){
    if (shown === "version") return;          /* the reload already covers it */
    t = t || target();
    if (shown === "edited" && shownFor === t) return;
    var who = by ? E(by) : "Somebody";
    shownFor = t;
    /* Said to the console as well: the first live report of this caution was
       one nobody could trace afterwards (§258.1). */
    try { console.info("[safety] " + (by || "somebody") + " landed a change on " + t + " at " + when); } catch (e) {}
    draw("edited", ICON_PEOPLE +
      '<div class="safety-msg"><strong>' + who + ' updated ' + E(pageName(t)) + ' while you were working</strong>' +
      '<span>Your changes are safe. Reload brings in their update and keeps yours on top.</span></div>' +
      '<div class="safety-acts"><button type="button" class="safety-btn" data-safety-keep>Reload &amp; keep mine</button>' +
      '<button type="button" class="safety-btn ghost" data-safety-dismiss>Dismiss</button></div>');
  }

  /* THE CLOCK IS THE SERVER'S. `since` began as the browser's own time at
     load, and a laptop clock running a few minutes behind would have every
     save from those minutes announced as news. So the first ask carries
     `sync=1`, ignores whatever it is told about changes, and adopts the
     server's `now` as the moment this tab loaded; only from then on are
     landings compared (§258.1). A tab that never syncs never asks. */
  var synced = false;
  function peek(){
    if (!servable() || !live() || document.visibilityState !== "visible") return;
    var t = target(); if (!t) return;
    if (!synced && !since) since = new Date().toISOString();
    var ctl = ("AbortController" in window) ? new AbortController() : null;
    var late = setTimeout(function(){ if (ctl) ctl.abort(); }, 8000);
    var first = !synced;
    fetch("/api/state?since=" + encodeURIComponent(since) + "&target=" + encodeURIComponent(t) +
          (first ? "&sync=1" : ""),
          { cache: "no-store", signal: ctl ? ctl.signal : undefined })
      .then(function(r){ return r.ok ? r.json() : null; })
      .then(function(j){
        clearTimeout(late);
        if (!j || !j.ok) return;
        if (first) { if (j.now) { since = j.now; synced = true; } return; }
        if (!j.changed || !j.changed.length) return;
        var last = j.changed[j.changed.length - 1];
        /* Remember the newest we have SEEN so the same landing is not
           announced twice, and the next peek only asks about what is newer. */
        if (last.at && last.at !== lastAt) { lastAt = last.at; since = last.at; edited(last.by, last.at, t); }
      })
      .catch(function(){ clearTimeout(late); });
  }

  /* CALLED AT THE END OF EVERY paint(): the edit caution is about ONE page,
     and a person who has moved to another tab is no longer on it. It goes
     with the page it was about (§258.1 — Islam met it on Units, about a save
     on Marketing, with nothing on it saying so). The version caution stays:
     a stale build is stale on every page. */
  function onPaint(){
    if (shown === "edited" && shownFor !== target()) hide();
  }

  function start(){
    if (!servable()) return;
    mount();
    armWorker();
    /* The first ask is the clock sync; it waits for hydration (`live()`),
       which is why it is retried on the clock rather than fired once. */
    if (!peekTimer) peekTimer = setInterval(peek, PEEK_EVERY);
    setTimeout(peek, 1500);
    document.addEventListener("visibilitychange", function(){
      if (document.visibilityState === "visible") peek();
    });
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", start);
  else start();

  return {
    /* Exposed for the check: the same function `controllerchange` calls, and
       the fact that the listener is armed — a stub cannot install a worker. */
    newVersion: newVersion,
    edited: edited,
    peek: peek,
    onPaint: onPaint,
    hide: hide,
    shownFor: function(){ return shownFor; },
    synced: function(){ return synced; },
    isArmed: function(){ return armed; },
    shown: function(){ return shown; }
  };
})();
