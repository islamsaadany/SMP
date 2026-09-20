/* ══ THE REPORTS, INSIDE THE PLATFORM (§376) ══════════════════════════════
   Islam, of the Insights module: *"for the users not the smo they can see the
   insights as a tab beside the tabs visible to them. better usability than
   going to another module. the module is managed by the smo which is relevant
   but the user to move between modules is not very usable."*

   Three placements were drawn at real size in the product's own chrome
   (design-mockups/insights-in-navigation/, rule 1c) and he picked the tab —
   the one I argued against, so the reason it is still a tab is his and the
   cost is recorded rather than re-argued: those three tabs are three views of
   ONE subject and this library is the CLIENT'S, identical whichever unit you
   stand on. What the build can do is stop that untruth outliving the screen,
   which is why the tab writes the module's own address (shell/route.js).

   AND A TAB THAT IS A LINK WOULD NOT HAVE ANSWERED HIM. "Better usability than
   going to another module" rules out a door that goes to another module from a
   different button: it would carry the whole of C's design cost and none of
   its point. So the platform draws the reports in its own pane, and this file
   is how.

   ONE RENDERER, TWO HOSTS (§53.5, §364's own shape). The ROWS are the
   module's: this asks `/<client>/insights/list` and drops the answer in, so a
   report's title, its fact line, its date spelling and its download button
   cannot read one way on the module's page and another way here. What this
   file draws is the chrome around them — the search and the count — because
   the two hosts navigate differently and the module's own page uses a GET form
   that would take the platform with it.

   NEVER paint() FROM A FETCH (§35, §71.2), which is history.js's rule one page
   over: the tab draws a frame, asks, and writes the answer into its own node.
   The count is rewritten IN PLACE for the same reason the outcome sentence is
   (§63) — it sits in the row the search box is in, and rebuilding that row
   would throw away what somebody is typing.

   NOTHING HERE IS DRAWN OVER file:// — the contingency copy (§306) has no
   server to ask, and a tab that could never open anything is worse than none
   (§61). The test is the SERVED document's own stamp and not the protocol,
   so it is one answer rather than two that can disagree. */
var LIBRARY = (function(){
  /* The state is the ASK and the ANSWER, kept apart on purpose: `q` survives a
     repaint (it is what the person typed), `html` is whatever the server last
     said, and `loadedFor` is what stops a slow answer overwriting a newer
     one. */
  var Q = "";                      /* what is in the search box              */
  var loading = false, failed = false, html = "", count = 0, loadedFor = null;

  function E(s){ return typeof esc === "function" ? esc(s) : String(s == null ? "" : s); }
  function live(){ return typeof SYNC !== "undefined" && SYNC.isLive && SYNC.isLive(); }

  /* ── IS THERE A LIBRARY BEHIND THIS TAB ─────────────────────────────────
     The server stamps the categories on a document it serves to somebody who
     may OPEN Insights (lib/shell.ts), so the attribute answers three questions
     at once — is there a server, does this client have the module, and may
     this person open it — with one read and no second copy of any of them
     (§42: the rule is asked, never re-derived). Absent is the honest answer in
     every case it is absent for. */
  function cats(){
    var raw = document.documentElement.getAttribute("data-library-cats");
    if (!raw) return null;
    try { var a = JSON.parse(raw); return Array.isArray(a) ? a : null; } catch (e) { return null; }
  }
  function shown(){ return !!cats(); }

  /* ── THE CATEGORIES ARE THE SECTION ROW ────────────────────────────────
     Signed off in the mockup, and it costs no new control: that third row is
     what a tab's own sub-navigation already lives in, so the module's five
     categories read here the way Foundation, SWOT and Plan read one tab over.
     `All` is a section like the rest — an empty key, because the fragment
     reads an absent category as every category and a section with no key
     would be a second way of saying the same thing (§50.6). */
  function sections(){
    var cs = cats(); if (!cs) return [];
    return [{ k:"all", ac:"c_kb", label:"All", render:renderPane }].concat(
      cs.map(function(c){
        return { k:"cat-" + c.toLowerCase(), ac:"c_kb", label:c, render:renderPane };
      }));
  }
  /* The category the section row is standing on, as the fragment wants it:
     the empty string for All. Read from CURSEC, which is where the shell keeps
     a page's section, so Back through the browser's history lands on the same
     category the address named (§48: addressed by its key, never by
     position). */
  function category(){
    var cs = cats(); if (!cs) return "";
    var s = (typeof CURSEC !== "undefined" && CURSEC.insights) || "all";
    for (var i = 0; i < cs.length; i++)
      if ("cat-" + cs[i].toLowerCase() === s) return cs[i];
    return "";
  }

  /* ── THE PANE ──────────────────────────────────────────────────────────
     A frame, then an ask. The frame is drawn synchronously because `render`
     is (every tab in SUBS returns HTML), and the ask is queued so the paint
     that contains it has finished before anything can write into it. */
  function renderPane(){
    setTimeout(function(){ load(true); }, 0);
    return '<div class="libpane">' +
      '<div class="libtools">' +
        '<input class="fld libsrch" type="search" data-lib-q autocomplete="off" ' +
          'placeholder="Search reports…" aria-label="Search reports" value="' + E(Q) + '">' +
        '<button type="button" class="libgo" data-lib-go>Search</button>' +
        '<span class="libcount" data-lib-count>' + E(countWord()) + '</span>' +
      '</div>' +
      '<div class="liblist" data-lib-list>' + bodyHtml() + '</div>' +
    '</div>';
  }
  /* THREE ANSWERS, NOT TWO (§35, §93): a count we have, a count we are still
     asking for, and a library we could not read. Printing nought for the last
     two tells a client that Forefront has published nothing. */
  function countWord(){
    if (loading) return "Asking…";
    if (failed) return "—";
    return count + (count === 1 ? " report" : " reports");
  }
  function bodyHtml(){
    if (loading && !html) return '<div class="libwait">Reading the library…</div>';
    if (failed)
      return '<div class="none"><b>The reports could not be reached just now.</b>' +
        'Nothing has been lost. ' +
        '<button type="button" class="linkbu" data-lib-retry>Try again</button></div>';
    return html;
  }
  /* The list and the count are rewritten and the row they sit in is not — the
     search box is in that row and a hand may be in the search box. */
  function draw(){
    var list = document.querySelector("[data-lib-list]");
    if (list) list.innerHTML = bodyHtml();
    var c = document.querySelector("[data-lib-count]");
    if (c) c.textContent = countWord();
  }

  /* ── THE ASK ───────────────────────────────────────────────────────────
     The module's own address, with this client's name on it the way every
     other request in the browser carries it (SYNC.withClient — a GET has no
     body to put it in, §313.35). */
  function load(force){
    if (!shown()) return;
    var cat = category();
    /* WHO IT WAS ASKED FOR IS PART OF THE ASK (§377). `loadedFor` is what
       stops a slow answer overwriting a newer one, so a viewer switch has to
       be in it: the pane is re-rendered on every paint and asks again, and
       without the person in the key the older request could still land last
       and put somebody else's reports back. */
    var who = (typeof SYNC !== "undefined" && SYNC.actingAs) ? SYNC.actingAs() : null;
    var key = JSON.stringify([cat, Q, who]);
    if (!force && key === loadedFor) return;
    loadedFor = key; loading = true; failed = false; draw();
    if (!live()) { loading = false; failed = true; draw(); return; }
    var qs = [];
    if (cat) qs.push("category=" + encodeURIComponent(cat));
    if (Q) qs.push("q=" + encodeURIComponent(Q));
    /* ── VIEWING AS SOMEBODY ASKS FOR THEIR REPORTS (§377) ──────────
       Islam: *"karim from mobile is seeing the report while the report is
       made only for the retail and online team."* He was right, and it was
       this request: the server resolved who is asking from the SIGN-IN, so
       the office's own seat answered — and the office reads every report
       (spec 046 §4.10), whoever the switcher was set to. §185's fault on a
       read path, and the reason it matters is that view-as is the mirror the
       office CHECKS a narrowing in: it reported a rule that works as broken.

       `SYNC.actingAs()` is the save's own answer, asked rather than copied
       (§42) — null unless the switcher is genuinely showing somebody else
       — and it is read at the moment of the REQUEST rather than kept, so a
       switch made between two searches asks for the right person. The server
       narrows with it and can only ever narrow (lib/view-as.ts). */
    if (who) qs.push("viewAs=" + encodeURIComponent(who));
    var url = "/" + slug() + "/insights/list" + (qs.length ? "?" + qs.join("&") : "");
    fetch(url, { cache:"no-store", credentials:"same-origin" })
      .then(function(r){ return r.json().then(function(j){ return { st:r.status, j:j }; }); })
      .then(function(x){
        if (loadedFor !== key) return;        /* a newer ask has superseded this one */
        loading = false;
        if (x.st !== 200 || !x.j || !x.j.ok) { failed = true; html = ""; draw(); return; }
        /* `read:false` is the SERVER saying it could not read the library, and
           it has already put that sentence in the html — one renderer, so the
           tab does not invent a second wording for it (§53.5). A transport
           failure is this file's own to say, and is the branch above. */
        failed = false; html = String(x.j.html || ""); count = Number(x.j.count) || 0;
        draw();
      })
      .catch(function(){
        if (loadedFor !== key) return;
        loading = false; failed = true; html = ""; draw();
      });
  }
  /* The client this page was served at. `SYNC.withClient` puts it in a query
     for the shared endpoints; this address carries it as the first segment,
     which is how every module is reached, so it is read from where the browser
     already is rather than kept a second time. */
  function slug(){
    var m = String(location.pathname || "").match(/^\/([a-z0-9][a-z0-9-]{0,47})/);
    return m ? m[1] : "";
  }

  /* ── WIRING, DELEGATED ONCE ────────────────────────────────────────────
     On the document, so a repaint can never leave a handler on a dead node
     (§29.5) and nothing has to be re-armed by whoever rewrites the pane. */
  document.addEventListener("input", function(ev){
    var i = ev.target && ev.target.closest && ev.target.closest("[data-lib-q]");
    if (!i) return;
    Q = i.value;                      /* typing never repaints and never asks (§35) */
  });
  document.addEventListener("keydown", function(ev){
    if (ev.key !== "Enter") return;
    var i = ev.target && ev.target.closest && ev.target.closest("[data-lib-q]");
    if (!i) return;
    ev.preventDefault();              /* or the form-less box submits nothing and the page jumps */
    Q = i.value; load(true);
  });
  document.addEventListener("click", function(ev){
    var b = ev.target && ev.target.closest && ev.target.closest("[data-lib-go],[data-lib-retry]");
    if (!b) return;
    var i = document.querySelector("[data-lib-q]");
    if (i) Q = i.value;
    load(true);
  });

  return { shown: shown, sections: sections, render: renderPane, load: load,
           /* for the checks */
           cats: cats, category: category,
           state: function(){ return { q:Q, loading:loading, failed:failed, count:count }; } };
})();
