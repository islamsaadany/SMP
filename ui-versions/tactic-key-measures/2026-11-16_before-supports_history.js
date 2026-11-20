/* ══ TRAIL (§262) ═════════════════════════════════════════════════════════
   Islam, after a reporting round in which people lost work: *"how about a
   history saving and recovery feature to track the changes per user and per
   unit and function to ensure nothing is lost?"* — and, from the mockup drawn
   out of real log rows: *"ok agreed let's build."*

   NOTHING NEW IS WRITTEN. Every accepted save has written `change_log` since
   §42 — who, when, which place, which row, which field, the value before and
   the value after. What was missing was a SCREEN over it and a WAY BACK. This
   file is both: Setup › History for the office (every person, every place), a
   line and a door on a unit's or function's own page for the people who hold
   it, and Restore.

   RESTORE IS AN ORDINARY CHANGE, NEVER A ROLLBACK (Islam's 2, agreed). It puts
   the old value into the row and lets the platform save, so it is authorised
   (§42), merged with everyone else's work (§210) and logged like any change —
   which is what lets a restore itself be put back. A rollback would copy an
   earlier database over the current one and silently destroy what everybody
   did since.

   THE READ IS FILTERED, NEVER THE WHOLE LOG (Islam's 3, agreed): a person, a
   place, a kind, a window, a cap — one indexed query on the log, never the
   graph (§98).

   NEVER paint() FROM A FETCH (§35, §71.2): the page draws a frame, asks, and
   writes the answer into its own node. Every control here is delegated on the
   document, so a repaint cannot leave a handler bound to a dead element
   (§29.5). Nothing here is drawn over file:// — there is no log to read. */
var TRAIL = (function(){
  /* ── THE FILTERS COME BACK AS YOU LEFT THEM (§550) ────────────────────
     Usability audit, heuristic 7: "no saved views, no default filters". The
     four dropdowns on this page went back to Everyone / Everywhere / Every
     kind / Today on every visit, so somebody who checks one person's changes
     every Monday set all four again every Monday.

     THE PATTERN IS THE PRODUCT'S OWN, not a new one: the people table and the
     functions table already remember which columns you chose, in localStorage,
     per browser (§47.1). This is that, one surface further out — and it is
     read and written in the same shape so there is one habit and not two.

     THE SEARCH BOX IS NOT REMEMBERED, and that is the one judgement here.
     Choosing "Nadia, Mobile, last 7 days" is a position you took; half a word
     left in a search box is not. Coming back to a page silently filtered by
     text you do not remember typing is the kind of help that reads as a bug —
     so `q` stays out, and starts empty every time. */
  var FKEY = "smp.hist.filters";
  var F = { person:"", target:"", kind:"", when:"today", q:"" };   /* the page's filters */
  (function restoreFilters(){
    var saved = null;
    try { saved = JSON.parse(localStorage.getItem(FKEY) || "null"); } catch (e) { saved = null; }
    if (!saved || typeof saved !== "object") return;
    ["person", "target", "kind", "when"].forEach(function(k){
      if (typeof saved[k] === "string") F[k] = saved[k];
    });
  })();
  function keepFilters(){
    try {
      localStorage.setItem(FKEY, JSON.stringify({
        person: F.person, target: F.target, kind: F.kind, when: F.when }));
    } catch (e) {}
  }
  var rows = [], loading = false, error = null, office = false, loadedFor = null;
  var lastCache = {};      /* target → {at, rows, when} for the unit line   */
  var pending = null;      /* the row a confirmation is open for            */

  function servable(){ return location.protocol !== "file:"; }
  function live(){ return typeof SYNC !== "undefined" && SYNC.isLive && SYNC.isLive(); }
  function E(s){ return typeof esc === "function" ? esc(s) : String(s == null ? "" : s); }

  /* ── WORDS ─────────────────────────────────────────────────────────── */
  var KIND = { unitPlan:"Plan", unitFoundation:"Plan", unitAnalysis:"Plan", unitReporting:"Reporting",
               reportState:"Report", capPlan:"Plan", capReporting:"Reporting", gapFill:"Fill",
               gapConfirm:"Fill", arrange:"Order", setup:"Setup", access:"Access", cycle:"Cycle",
               group:"Group", focus:"Focus", claim:"Figure set", claimRequest:"Figure set",
               sourceReporting:"Reporting", lineReporting:"Reporting", lineNote:"Reporting",
               deckHide:"Slides", destroy:"Register",
               /* §266 joins this the day its kind was added, not later: the
                  authoriser's kinds and this map are two lists that must agree,
                  and `kindWord()` falls back to the RAW KEY — so a kind missing
                  here does not throw, it prints `masterFlow` as a chip in front
                  of the office (§234's fault, in the one place it degrades
                  quietly). The word is "Slides" beside `deckHide`, because both
                  are decisions about what a review shows rather than about what
                  it measures; the Kind FILTER above is a deliberately curated
                  short list and neither of them is in it. */
               masterFlow:"Slides", unknown:"Other" };
  var FIELD = { target:"Target", target3y:"3-year target", actual:"Actual", outActual:"Outcome actual",
                outTarget:"Outcome target", outcome:"Outcome", note:"Note", pct:"% complete",
                status:"Status", compile:"Compile rule", dir:"Direction", quarters:"Quarters",
                owner:"Owner", collaborators:"Collaborators", name:"Name", description:"Description",
                weight:"Weight", finish:"Due date", start:"Start", end:"End", def:"Definition",
                aspiration:"Aspiration", progress:"Progress", measureAt:"Measure date",
                horizon:"Horizon", kind:"Measured as", hide:"Hidden", endInMind:"End in mind",
                clauses:"Who we are", mission:"Mission", values:"Values", org:"Organisation",
                asOfQuarter:"Review quarter", "swot.s":"Strengths", "swot.w":"Weaknesses",
                "swot.o":"Opportunities", "swot.t":"Threats",
                /* §598: the row itself, when one left or arrived */
                row:"Row" };
  /* §598: THE SEAT A ROW SAT IN, in words. The log carries which holder,
     which list and which position (lib/authorize.js structuralRows); the
     page says it the way the plan does: "MB01 · measure 2 of 5". */
  var LIST_WORD = { measures:"measure", tactics:"tactic", keyObjectives:"objective",
                    deliverables:"deliverable", outcomes:"outcome", milestones:"milestone",
                    actions:"action", "breakdown.rows":"breakdown row" };
  function holderWord(t, id){
    if (id == null) return placeWord(t);
    var h = locate(t, id);
    if (!h) return "its place";
    try {
      var u = typeof unitLikeWritable === "function" ? unitLikeWritable(t) : null;
      if (u && u.items && typeof pillarCode === "function") {
        var i = u.items.indexOf(h);
        if (i > -1) return pillarCode(u, i);
      }
    } catch (e) {}
    return h.name || String(id);
  }
  function seatWord(t, s){
    if (!s || typeof s !== "object") return "";
    var w = LIST_WORD[s.list] || "row";
    return holderWord(t, s.in) + " · " + w + " " + (s.at + 1) + (s.of ? " of " + s.of : "");
  }
  function isSeat(v){ return !!(v && typeof v === "object" && !Array.isArray(v) && v.row && v.list); }
  function kindWord(k){ return KIND[k] || k; }
  function fieldWord(f){ return FIELD[f] || String(f || ""); }
  function placeWord(t){
    if (!t) return "Setup";
    try { if (typeof placeLabel === "function") { var w = placeLabel(t); return t === "group" ? "The group" : w; } } catch (e) {}
    return String(t).replace(/^fn:/, "");
  }
  /* WHO IS THE REGISTER'S NAME, NEVER THE FULL LEGAL ONE (§262.1, Islam:
     "make the who matching the name in the register not the full name"):
     the same word the register and every picker show (§93.8, §130.7),
     resolved off the key; the full name the log stored goes on the hover. */
  function whoWord(e){
    try {
      var dn = typeof displayNames === "function" ? displayNames() : null;
      var p = (typeof PEOPLE !== "undefined" ? PEOPLE : []).filter(function(x){ return x.key === e.person_key; })[0];
      if (p && typeof knownName === "function") { var k = knownName(p, dn); if (k) return k; }
    } catch (x) {}
    return e.person_name || e.person_key || "";
  }
  /* TODAY AND YESTERDAY ARE THIS FILE'S OWN, and they stay: a log read
     minutes after the act is mostly today, and "Today" says that better
     than the date does. Everything past yesterday is the product's one day
     writer now (§537). What went was a `["Jan","Feb",...]` array kept here
     twice, which printed the year only when it was not this one — so the
     log said "11 Mar" where every other screen said "11 Mar 26". */
  function sameDayAs(a, b){
    return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
  }
  function dayName(at){
    var d = dateOf(at); if (!d) return "";
    var now = new Date(), y = new Date(now); y.setDate(now.getDate() - 1);
    return sameDayAs(d, now) ? "Today" : sameDayAs(d, y) ? "Yesterday" : "";
  }
  function dateWord(at){
    var d = dateOf(at); if (!d) return "";
    return dayName(at) || dateDay(d);
  }
  function timeWord(at){ return timeOf(at); }
  function whenWord(at){
    var d = dateOf(at); if (!d) return "";
    var near = dayName(at);
    return near ? near + " " + timeOf(d) : dateAt(d);
  }
  function plain(v){
    if (v === null || v === undefined || v === "") return "nothing";
    if (Array.isArray(v) && v.length === 4 && v.every(function(x){ return typeof x === "boolean"; }))
      return v.map(function(b, i){ return b ? "Q" + (i+1) : null; }).filter(Boolean).join(" ") || "no quarter";
    if (Array.isArray(v)) return v.join(", ");
    if (typeof v === "object") return JSON.stringify(v);
    return String(v);
  }
  function valHtml(v){
    if (v === null || v === undefined || v === "") return '<span class="hist-none" title="nothing">—</span>';
    if (Array.isArray(v) && v.length === 4 && v.every(function(x){ return typeof x === "boolean"; }))
      return v.map(function(b, i){ return '<i class="hist-q' + (b ? ' on' : '') + '" title="Q' + (i+1) + (b ? ' on' : ' off') + '"></i>'; }).join("");
    if (Array.isArray(v)) return E(v.map(function(x){ return Array.isArray(x) ? x.join(" ") : x; }).join(" · "));
    if (typeof v === "object") return E(JSON.stringify(v));
    return E(String(v));
  }

  /* ── THE ROWS, ONE PER CHANGED FIELD ───────────────────────────────── */
  /* A log entry holds one change with 0..n moved fields. The table draws one
     line per field, or one line for an entry with none (a submission, a
     setting), so what a person reads is the FACT and never the envelope. */
  function flatten(entries){
    var out = [];
    (entries || []).forEach(function(e){
      var moved = e.rows_ && e.rows_.moved && e.rows_.moved.length ? e.rows_.moved : null;
      if (!moved) { out.push({ e:e, m:null }); return; }
      moved.forEach(function(m){ out.push({ e:e, m:m }); });
    });
    return out;
  }
  /* WHY A ROW CANNOT BE PUT BACK, or null when it can (§61: a greyed control
     carries its reason, never a missing one). */
  function noRestore(r){
    var k = r.e.kind;
    if (k === "reportState") return "A submitted report is reopened from its Reporting tab.";
    if (k === "arrange") return "The order of a plan is put back by dragging it on the Plan page.";
    if (!r.m) return "This change has no single value to put back.";
    if (k === "setup" || k === "access" || k === "cycle" || k === "destroy" || k === "focus" ||
        k === "claim" || k === "claimRequest" || k === "deckHide" || (k === "group" && !r.m))
      return "This is a setting, put back on its own page.";
    if (r.m.field === "name" && r.m.from == null) return "A row that was added is removed from the Plan page.";
    /* §598: a row that left can be put back where it was — if the log kept
       it (rows removed before §598 carry no contents) and it is not back
       already. A row that arrived is removed from the Plan page, as before. */
    if (r.m.field === "row") {
      if (r.m.had === false || !r.m.from) return "A row that was added is removed from the Plan page.";
      if (!isSeat(r.m.from)) return "This row was removed before the platform kept a removed row's contents.";
      if (locate(r.e.target, r.m.id)) return "This row is back in the plan already.";
      return null;
    }
    /* §598: a value on a row that is no longer in the plan waits for the row:
       the removal's own line, above, puts it back with its figures. Asked
       only of the kinds whose rows the plan holds, so a figure set's line or
       a setting is never greyed by a finder that does not know it. */
    if (ROW_KINDS[k] && r.m.id !== r.e.target && !locate(r.e.target, r.m.id))
      return "That row is no longer in the plan. Put the row back first, from its own line.";
    return null;
  }
  var ROW_KINDS = { unitPlan:1, unitReporting:1, capPlan:1, capReporting:1, rowDone:1 };

  function tableHtml(list, opts){
    opts = opts || {};
    if (!list.length) return '<p class="hist-empty">' + E(opts.empty || "No changes recorded for this.") + '</p>';
    /* ROW AND FROM → TO WRAP; EVERYTHING ELSE IS ONE LINE (§262.1, reversing
       §88 for exactly two columns at Islam's instruction: "you need to wrap
       the change to appear in the cell and same for the row"). A value is
       what this page exists to show, and a value clipped to an ellipsis is a
       value not shown. The short cells stay one line, or the row's height
       would be set by a name. */
    var h = '<table class="hist" data-hist-table><colgroup>' +
      /* THE SHORT COLUMNS ARE PIXELS, THE PROSE COLUMNS A SHARE: a chip and a
         button have a width of their own that a percentage of a narrow pane
         cannot honour (measured at 1180: Restore and REPORTING cut), and the
         prose columns take whatever is left. */
      (opts.noPlace
        ? '<col style="width:88px"><col style="width:62px"><col style="width:15%"><col style="width:128px"><col style="width:26%"><col style="width:108px"><col style="width:28%"><col style="width:92px">'
        : '<col style="width:88px"><col style="width:62px"><col style="width:14%"><col style="width:10%"><col style="width:128px"><col style="width:21%"><col style="width:108px"><col style="width:22%"><col style="width:92px">') +
      '</colgroup><thead><tr>' +
      '<th>Date</th><th>Time</th><th>Who</th>' + (opts.noPlace ? '' : '<th>Where</th>') + '<th>Kind</th><th>Row</th><th>Field</th><th>From → To</th><th>Restore</th></tr></thead><tbody>';
    list.forEach(function(r, i){
      var e = r.e, m = r.m, why = noRestore(r);
      var rowName = m ? (m.name || m.id) : (e.what || kindWord(e.kind));
      /* §598: a row's own line reads its seat, not its contents — "MB01 ·
         measure 2 of 5 → removed", or "— → MB01 · tactic 6 of 6" for one
         that arrived. The contents are what Restore puts back. */
      var fromTo = !m ? '<span class="hist-none">—</span>'
        : m.field === "row"
          ? (isSeat(m.from) ? E(seatWord(e.target, m.from)) : '<span class="hist-none">—</span>') +
            ' <span class="hist-arr">→</span> ' +
            (isSeat(m.to) ? E(seatWord(e.target, m.to)) : '<span class="hist-none">removed</span>')
          : valHtml(m.from) + ' <span class="hist-arr">→</span> ' + valHtml(m.to);
      var fromToWords = !m ? '' : m.field === "row"
        ? (isSeat(m.from) ? seatWord(e.target, m.from) : "nothing") + ' → ' + (isSeat(m.to) ? seatWord(e.target, m.to) : "removed")
        : plain(m.from) + ' → ' + plain(m.to);
      h += '<tr data-hist-row="' + i + '">' +
        '<td class="hist-t" title="' + E(dateStamp(e.at)) + '">' + E(dateWord(e.at)) + '</td>' +
        '<td class="hist-t">' + E(timeWord(e.at)) + '</td>' +
        '<td title="' + E(e.person_name || "") + '">' + E(whoWord(e)) + '</td>' +
        (opts.noPlace ? '' : '<td>' + E(placeWord(e.target)) + '</td>') +
        '<td><span class="hist-chip">' + E(kindWord(e.kind)) + '</span></td>' +
        '<td class="hist-name hist-wrap" title="' + E(m ? m.id : "") + '">' + E(rowName) + '</td>' +
        '<td class="hist-fld">' + (m ? E(fieldWord(m.field)) : '') + '</td>' +
        '<td class="hist-fromto hist-wrap" title="' + E(fromToWords) + '">' + fromTo + '</td>' +
        '<td class="hist-act">' + (why
          /* HELD, NOT DEAD (§538). It carried BOTH attributes, and `disabled`
             wins: the button took no pointer and no Tab, so the one sentence
             saying why this change cannot be put back reached nobody — and
             nothing else in the row says it. `aria-disabled` alone leaves it
             reachable, `.hasnote` opens the product's own bubble on hover AND
             on focus, and the press stays inert because the held button never
             carries `data-hist-restore` for the handler to find. */
          ? '<button type="button" class="hist-rst hasnote" aria-disabled="true" data-tip="' + E(why) + '">Restore</button>'
          : '<button type="button" class="hist-rst" data-hist-restore="' + i + '">Restore</button>') + '</td>' +
        '</tr>';
    });
    return h + '</tbody></table>';
  }

  /* ── THE ASK ───────────────────────────────────────────────────────── */
  /* The window is worked out from the READER's day, so "today" is their
     today; the server compares instants and never a date of its own. */
  function window_(when){
    var now = new Date(), from = null, to = null;
    var day0 = function(d){ return new Date(now.getFullYear(), now.getMonth(), now.getDate() + (d || 0)); };
    if (when === "today") from = day0(0);
    else if (when === "yesterday") { from = day0(-1); to = day0(0); }
    else if (when === "week") from = day0(-6);
    else if (when === "month") from = day0(-29);
    else if (when === "year") from = new Date(now.getFullYear(), 0, 1);
    return { from: from ? from.toISOString() : null, to: to ? to.toISOString() : null };
  }
  function fetchLog(f, done){
    if (!servable() || !live()) return done(new Error("no server"), null);
    var qs = ["log=1"];
    if (f.target) qs.push("target=" + encodeURIComponent(f.target));
    if (f.person) qs.push("person=" + encodeURIComponent(f.person));
    if (f.kind) qs.push("kind=" + encodeURIComponent(f.kind));
    var w = window_(f.when);
    /* §598: the as-of view names its own instant — everything after the
       end of the chosen day — rather than one of the page's windows. */
    if (f.fromAt) w.from = f.fromAt;
    if (w.from) qs.push("from=" + encodeURIComponent(w.from));
    if (w.to) qs.push("to=" + encodeURIComponent(w.to));
    qs.push("limit=" + (f.limit || 200));
    fetch("/api/state?" + qs.join("&"), { cache:"no-store" })
      .then(function(r){ return r.json().then(function(j){ return { st:r.status, j:j }; }); })
      .then(function(x){
        if (x.st !== 200 || !x.j || !x.j.ok) return done(new Error((x.j && x.j.error) || ("HTTP " + x.st)), null);
        done(null, x.j);
      })
      .catch(function(e){ done(e || new Error("could not reach the server"), null); });
  }

  /* ── THE SETUP PAGE ────────────────────────────────────────────────── */
  function opt(v, label, cur){ return '<option value="' + E(v) + '"' + (v === cur ? ' selected' : '') + '>' + E(label) + '</option>'; }
  var KIND_OPTS = [["unitPlan","Plan (unit)"],["capPlan","Plan (function)"],["unitReporting","Reporting (unit)"],["capReporting","Reporting (function)"],
               ["gapFill","Fill"],["reportState","Report submitted"],["setup","Setup"],["access","Access"],["cycle","Cycle"],["group","Group"]];
  var WHEN_OPTS = [["today","Today"],["yesterday","Yesterday"],["week","Last 7 days"],["month","Last 30 days"],["year","This year"],["all","All time"]];
  function peopleList(){
    var out = [];
    try {
      var dn = typeof displayNames === "function" ? displayNames() : null;
      (typeof PEOPLE !== "undefined" ? PEOPLE : []).filter(function(p){ return typeof personActive !== "function" || personActive(p); })
        .sort(function(a, b){ return String(a.name).localeCompare(String(b.name)); })
        .forEach(function(p){ out.push([p.key, (typeof knownName === "function" ? knownName(p, dn) : p.name) || p.key]); });
    } catch (e) {}
    return out;
  }
  function placeList(){
    var out = [];
    try {
      out.push(["group", "The group"]);
      (typeof UNIT_KEYS !== "undefined" ? UNIT_KEYS : []).forEach(function(k){ out.push([k, placeWord(k)]); });
      Object.keys(typeof FUNCTIONS !== "undefined" ? FUNCTIONS : {}).forEach(function(k){ out.push(["fn:" + k, placeWord("fn:" + k)]); });
    } catch (e) {}
    return out;
  }
  /* ── A REMEMBERED FILTER NOBODY CAN SEE IS DROPPED (§550) ─────────────
     The one way remembering could lie: you filter by Nadia, Nadia leaves the
     register, and the saved key matches no option any more. The dropdown
     would read "Everyone" — nothing selected — while the page went on asking
     the server for Nadia's changes, and the count underneath would be hers.
     A screen that disagrees with what it is doing is worse than a screen
     that forgot, so a saved value that is no longer on offer is dropped and
     unremembered BEFORE the first read (`renderPage` prunes, then asks).

     AN EMPTY LIST MEANS NOT YET, NOT NOBODY: over file:// and before state
     lands there are no people and no units to compare against, and pruning
     then would quietly throw away a good filter. So an empty list prunes
     nothing. The two static lists cannot be empty. */
  function prune(){
    var dirty = false;
    [["person", peopleList()], ["target", placeList()], ["kind", KIND_OPTS]].forEach(function(p){
      if (!F[p[0]] || !p[1].length) return;
      if (!p[1].some(function(o){ return o[0] === F[p[0]]; })) { F[p[0]] = ""; dirty = true; }
    });
    if (!WHEN_OPTS.some(function(o){ return o[0] === F.when; })) { F.when = "today"; dirty = true; }
    if (dirty) keepFilters();
  }
  function opts(list, cur){ return list.map(function(o){ return opt(o[0], o[1], cur); }).join(""); }
  function toolsHtml(){
    prune();
    return '<span class="hist-tools">' +
      '<input class="fld tk-search" type="search" data-hist-q placeholder="Search a row or a person…" autocomplete="off" value="' + E(F.q) + '">' +
      '<select class="fld" data-hist-f="person" aria-label="Person">' + opt("", "Everyone", F.person) + opts(peopleList(), F.person) + '</select>' +
      '<select class="fld" data-hist-f="target" aria-label="Place">' + opt("", "Everywhere", F.target) + opts(placeList(), F.target) + '</select>' +
      '<select class="fld" data-hist-f="kind" aria-label="Kind">' + opt("", "Every kind", F.kind) + opts(KIND_OPTS, F.kind) + '</select>' +
      '<select class="fld" data-hist-f="when" aria-label="When">' + opts(WHEN_OPTS, F.when) + '</select>' +
      '</span>';
  }
  function bodyHtml(){
    if (error) return '<p class="hist-empty hist-err">History could not be read — ' + E(error) + ' <button type="button" class="linkbtn" data-hist-retry>Try again</button></p>';
    if (loading && !rows.length) return '<p class="hist-empty">Reading…</p>';
    var list = flatten(rows);
    return '<p class="hist-count">' + (list.length ? list.length + (list.length === 1 ? ' change' : ' changes') + (rows.length >= 200 ? ' — the most recent 200 entries; narrow the filters for older ones' : '') : 'Nothing changed in this window') + '</p>' +
      tableHtml(list, { empty: "Nothing was changed in this window. Widen the filters to look further back." });
  }
  function renderPage(){
    var head = typeof cfgHead === "function" ? cfgHead("History", [], null, false, null, null, toolsHtml()) : '<h2>History</h2>' + toolsHtml();
    setTimeout(function(){ load(true); }, 0);
    return head + '<div class="hist-page" data-hist-page>' + bodyHtml() + '</div>';
  }
  function applySearch(){
    var q = String(F.q || "").trim().toLowerCase();
    document.querySelectorAll("[data-hist-page] table.hist tbody tr, .hist-modal table.hist tbody tr").forEach(function(tr){
      tr.hidden = !!q && tr.textContent.toLowerCase().indexOf(q) === -1;
    });
  }
  function draw(){
    var el = document.querySelector("[data-hist-page]");
    if (!el) return;
    el.innerHTML = bodyHtml();
    applySearch();
    if (typeof clipTitles === "function") { try { clipTitles(); } catch (e) {} }
  }
  function load(force){
    var key = JSON.stringify([F.person, F.target, F.kind, F.when]);
    if (!force && key === loadedFor) return;
    loading = true; error = null; loadedFor = key; draw();
    fetchLog(F, function(err, j){
      if (loadedFor !== key) return;      /* a newer ask has superseded this one */
      loading = false;
      if (err) { error = err.message || String(err); rows = []; draw(); return; }
      rows = j.log || []; office = !!j.office; draw();
    });
  }

  /* ── THE UNIT'S OWN LINE, AND THE DOOR ─────────────────────────────── */
  function target(){
    var c = typeof current !== "undefined" ? current : null;
    if (!c || c === "setup" || c === "manage") return null;
    /* §598.1: the company's own strategy pages carry the line too — its plan
       is logged against "group" like a unit's — and nothing else of the
       group's does, so the Units and Functions tables stay as they were. */
    if (c === "group") return (typeof currentSub !== "undefined" && currentSub === "strategy") ? "group" : null;
    if (boxRef(c).kind === "mid") return null;
    return typeof TARGET !== "undefined" ? TARGET : null;
  }
  function lineHtml(t, entry){
    return '<span class="pband-hist">Last changed by <b>' + E(whoWord(entry)) + '</b>, ' +
      E(whenWord(entry.at).replace(/^Today /, "today ").replace(/^Yesterday /, "yesterday ")) +
      ' · <button type="button" class="linkbtn" data-hist-open="' + E(t) + '">See history</button>' +
      asofLink(t) + '</span>';
  }
  function placeLine(t, entry){
    var band = document.querySelector(".pane > .pband, .pane .pband");
    if (!band || band.querySelector(".pband-hist")) return;
    var r = band.querySelector(".pband-r");
    var span = document.createElement("span");
    span.innerHTML = lineHtml(t, entry);
    if (r) r.insertBefore(span.firstChild, r.firstChild); else band.appendChild(span.firstChild);
  }
  function onPaint(){
    if (!servable() || !live()) return;
    var t = target();
    /* §598: the day view belongs to one subject; walking to another page
       lets it go, quietly — the page just painted did not use it. */
    if (ASOF.on && t !== ASOF.target) asofOff(false);
    if (!t) return;
    var c = lastCache[t];
    if (c && Date.now() - c.when < 60000) { if (c.entry) placeLine(t, c.entry); return; }
    fetchLog({ target:t, when:"all", limit:1 }, function(err, j){
      if (err) return;                       /* a page is not for complaining about its log */
      var entry = (j.log || [])[0] || null;
      lastCache[t] = { when: Date.now(), entry: entry };
      if (entry && target() === t) placeLine(t, entry);
    });
  }
  function openFor(t){
    if (typeof openModalHtml !== "function") return;
    openModalHtml("History — " + E(placeWord(t)), "Who changed what here, most recent first.",
      '<div class="hist-modal" data-hist-modal="' + E(t) + '"><p class="hist-empty">Reading…</p></div>');
    fetchLog({ target:t, when:"all", limit:200 }, function(err, j){
      var el = document.querySelector('[data-hist-modal="' + t.replace(/"/g, '\\"') + '"]');
      if (!el) return;
      if (err) { el.innerHTML = '<p class="hist-empty hist-err">History could not be read — ' + E(err.message || err) + '</p>'; return; }
      rows = j.log || []; office = !!j.office;
      el.innerHTML = tableHtml(flatten(rows), { noPlace:true, empty:"Nothing has been changed here yet." });
      if (typeof clipTitles === "function") { try { clipTitles(); } catch (e) {} }
    });
  }

  /* ── RESTORE ───────────────────────────────────────────────────────── */
  /* FINDING THE ROW: by target and id, never by position (§48). A unit's and
     a pillars function's rows go through the platform's own finder; a
     capability function's rows are walked here, because no shared finder
     answers a milestone by id. */
  function locate(t, id){
    var hit = null;
    try {
      /* §262.3: the subject is its own row — its words, its SWOT. */
      if (id === t || (t === "group" && id === "group"))
        return t === "group" ? GROUP : (typeof unitLikeWritable === "function" ? unitLikeWritable(t) : null);
      if (t === "group") {
        (GROUP.keyObjectives || []).forEach(function(m){ if (m.id === id) hit = m; });
        /* §598.1: and the company's own plan — its directions and their rows
           — through the same unit-shaped view the page draws (§53.5). */
        if (!hit && typeof unitLikeWritable === "function" && typeof findById === "function") {
          var gu = unitLikeWritable("group"), gf = gu ? findById(gu, id) : null;
          if (gf && gf.swot) return { __swot: gf.swot };
          if (gf && gf.obj) hit = gf.obj;
        }
        return hit;
      }
      var u = typeof unitLikeWritable === "function" ? unitLikeWritable(t) : null;
      if (u && typeof findById === "function") {
        var f = findById(u, id);
        if (f && f.swot) return { __swot: f.swot };
        if (f && f.obj) return f.obj;
      }
      /* §334.18: THE SUBJECT'S OWN HOLDERS, asked of the product rather than
         walked here — the SEVENTH copy of "walk the capabilities", and the
         only one left outside the shared readers. Since §326 a supporting
         function's projects are the FUNCTION's, so neither route above found
         them (`unitLikeWritable` answers the PILLARS view and is null on this
         format) and neither did this walk: measured, `cap7-P1-M1` on
         `fn:finance` is found by `capsShown` and by nothing here. Restore on
         the page where most of a tenant's projects now live could put nothing
         back, and it fails the way every one of these fails — quietly, in the
         direction that looks like the button doing nothing (§96).

         WIDENED, NEVER NARROWED (§334.18's own rule one file over): a log row
         written before §334 names the FUNCTION for a capability's project, so
         that function's capabilities are still walked beside its own work or
         a restore that used to work stops. */
      var holders = (typeof capsShown === "function" ? capsShown(t) : []).slice();
      if (boxRef(t).kind === "fn")
        (GROUP.capabilities || []).forEach(function(c){
          if ("fn:" + c.fn === String(t) && holders.indexOf(c) === -1) holders.push(c); });
      holders.forEach(function(c){
        if (c.id === id) hit = c;
        (c.keyObjectives || []).forEach(function(m){ if (m.id === id) hit = m; });
        (c.projects || []).forEach(function(p){
          if (p.id === id) hit = p;
          ["deliverables", "outcomes", "milestones"].forEach(function(k){
            (p[k] || []).forEach(function(x){ if (x.id === id) hit = x; });
          });
        });
      });
    } catch (e) { hit = null; }
    return hit;
  }
  function confirmHtml(r){
    var m = r.m, e = r.e;
    /* §598: a row's own line puts the whole row back, in its old seat. */
    if (m.field === "row" && isSeat(m.from))
      return '<div class="hist-confirm">' +
        '<p><strong>Put back ' + E(m.name || m.id) + ' on ' + E(placeWord(e.target)) + ', as ' +
        E((LIST_WORD[m.from.list] || "row") + " " + (m.from.at + 1) + " of " + holderWord(e.target, m.from.in)) + '?</strong></p>' +
        '<p>It was removed by ' + E(whoWord(e)) + ' ' + E(whenWord(e.at).toLowerCase()) +
        ', with everything it held — its target, its settings, its hidden mark and the figures reported on it. ' +
        'It returns to its old place with all of them. ' +
        'Putting it back is an ordinary change: it is saved, authorised and logged like any other, so it can itself be put back.</p>' +
        '<div class="hist-confirm-acts"><button type="button" class="btn ghost" data-hist-cancel>Cancel</button>' +
        '<button type="button" class="btn" data-hist-ok>Put it back</button></div></div>';
    return '<div class="hist-confirm">' +
      '<p><strong>Put back the ' + E(fieldWord(m.field).toLowerCase()) + ' of ' + E(m.name || m.id) + ' on ' + E(placeWord(e.target)) + ' to ' +
      (m.from == null || m.from === "" ? 'nothing' : E(Array.isArray(m.from) ? m.from.join(", ") : String(m.from))) + '?</strong></p>' +
      '<p>It reads <b>' + (m.to == null || m.to === "" ? 'nothing' : E(Array.isArray(m.to) ? m.to.join(", ") : String(m.to))) + '</b> now, set by ' + E(whoWord(e)) + ' ' + E(whenWord(e.at).toLowerCase()) + '. ' +
      'Putting it back is an ordinary change: it is saved, authorised and logged like any other, so it can itself be put back.</p>' +
      '<div class="hist-confirm-acts"><button type="button" class="btn ghost" data-hist-cancel>Cancel</button>' +
      '<button type="button" class="btn" data-hist-ok>Put it back</button></div></div>';
  }
  /* ONE VALUE, PUT BACK INTO ONE ROW — shared by Restore and by the day
     view's walk back through the log (§598), so the two cannot disagree
     about what "the value before" means. */
  function applyFrom(obj, m){
    if (obj.__swot) { obj.__swot.arr[obj.__swot.idx] = m.from == null ? "" : m.from; }
    else if (String(m.field).indexOf("swot.") === 0) {
      obj.swot = obj.swot || {};
      obj.swot[m.field.slice(5)] = m.from == null ? [] : JSON.parse(JSON.stringify(m.from));
    }
    else if (m.had === false || m.from === undefined) { delete obj[m.field]; }
    else obj[m.field] = m.from == null ? m.from : JSON.parse(JSON.stringify(m.from));
  }
  function restore(r){
    var m = r.m, e = r.e;
    if (m.field === "row") return seatBack(e.target, m);
    var obj = locate(e.target, m.id);
    if (!obj) return "That row is no longer in the plan, so there is nothing to put the value back into.";
    applyFrom(obj, m);
    return null;
  }

  /* ── §598: A ROW BACK IN ITS SEAT ──────────────────────────────────────
     Islam: *"old position"*. The log entry names the holder (a pillar, a
     project, a capability, or the subject itself), the list and the index
     the row sat at. It goes back at that index — the rows after it move
     down one, and a row added there since sits just after it — unless it is
     there already. A row that ARRIVED (the refused-save path, sync.js) is
     taken out by id. Returns the reason it could not, or null. Works on the
     live graph and, through `root`, on the day view's copy. */
  function listOf(holder, name, make){
    var parts = String(name).split("."), h = holder;
    for (var i = 0; i < parts.length - 1; i++) {
      if (!h[parts[i]] || typeof h[parts[i]] !== "object") { if (!make) return null; h[parts[i]] = {}; }
      h = h[parts[i]];
    }
    var last = parts[parts.length - 1];
    if (!Array.isArray(h[last])) { if (!make) return null; h[last] = []; }
    return h[last];
  }
  function holderOf(t, id, root){
    if (root) {
      if (id == null) return root;
      var f = findIn(root, id);
      return f && f.obj && !f.swot ? f.obj : null;
    }
    if (id == null) {
      if (t === "group") return GROUP;
      var u = typeof unitLikeWritable === "function" ? unitLikeWritable(t) : null;
      if (u) return u;
      try { return typeof holderById === "function" ? holderById(t) : null; } catch (e) { return null; }
    }
    return locate(t, id);
  }
  function seatBack(t, m, root){
    var seat = m.had === false ? m.to : m.from;
    if (!isSeat(seat)) return "This row was removed before the platform kept a removed row's contents.";
    var holder = holderOf(t, seat.in, root);
    if (!holder) return "The " + (LIST_WORD[seat.list] ? "place" : "row") + " this row sat in is no longer in the plan.";
    var list = listOf(holder, seat.list, true);
    var id = String(seat.row.id), have = list.some(function(r){ return r && String(r.id) === id; });
    if (m.had === false) {
      if (!have) return null;
      for (var i = list.length - 1; i >= 0; i--) if (list[i] && String(list[i].id) === id) list.splice(i, 1);
      return null;
    }
    if (have) return "This row is back in the plan already.";
    var at = Math.max(0, Math.min(list.length, +seat.at || 0));
    list.splice(at, 0, JSON.parse(JSON.stringify(seat.row)));
    return null;
  }

  /* ── §598: THE PLAN AS IT STOOD ON A DAY ───────────────────────────────
     Islam: *"the history of the plans should be on the plans page for the
     smo to see and review"*, and of the drawn pictures: *"yes build both"*.
     A link beside See history, the office's; a day; and the Plan page
     draws a COPY of the subject rebuilt by walking the log back from today
     to the end of that day — each entry's "value before" put back, a row
     that left re-seated, a row that arrived taken out — newest first. The
     live graph is never touched: the copy is handed to the page's own
     painter, mayAuthor() answers no for the subject while the view is on,
     and the differ sees nothing move. Rows the copy holds that today's plan
     does not are marked, so the reader is told why they cannot find them.

     WHAT IT CANNOT REPLAY IS COUNTED AND SAID: a reorder (logged without
     the order it replaced), an entry logged before its rows were kept, and
     an entry whose rows the log capped — the banner names how many, so a
     value or an order that differs is not read as the plan's. */
  var ASOF = { on:false, target:null, day:null, store:null, key:null, unit:null, gone:{}, since:0, skipped:0, capped:false, drawing:false };
  var ASOF_CAP = 500;
  function asofActive(t){ return ASOF.on && (t === undefined || t === ASOF.target); }
  function asofHere(){
    return ASOF.on && !ASOF.drawing && !!ASOF.unit && typeof TARGET !== "undefined" && TARGET === ASOF.target;
  }
  function asofGone(id){ return ASOF.on && !!ASOF.gone[String(id)]; }
  /* ── §598.1: THREE KINDS OF SUBJECT, ONE SWAP ────────────────────────
     Islam: *"add the day view for the company plan and functions too."*
     What a page draws is read off a STORE by key — `UNITS[k]`, `FUNCTIONS[k]`,
     or the company's own `GROUP.items` / `GROUP.topProjects` — through
     unitLike(), the holders and the rest, which every painter asks afresh.
     So the view swaps the stored object for the rebuilt copy for the length
     of ONE synchronous render and puts it back in `finally`: the painters
     need no second signature, and the differ, which runs after the paint,
     never sees the swap. The copy is the stored shape itself — a unit, a
     function (pillars, projects or objectives), or the company's two lists —
     and the finders below walk any of them. */
  function asofSubject(t){
    if (!t) return null;
    try {
      var r = boxRef(t);
      if (t === "group") {
        if (typeof topWritable === "function") topWritable();   /* the lists exist (§598) */
        return { store:"group", key:"group", name: (typeof topAsUnit === "function" ? topAsUnit().name : "") || "The company",
                 obj: { items: GROUP.items || [], topProjects: GROUP.topProjects || [], swot: GROUP.swot || {} } };
      }
      if (r.kind === "fn") {
        var f = typeof FUNCTIONS !== "undefined" ? FUNCTIONS[r.key] : null;
        return f ? { store:"fn", key:r.key, name:f.name, obj:f } : null;
      }
      if (r.kind === "cap" || r.kind === "mid") return null;
      var u = typeof UNITS !== "undefined" ? UNITS[t] : null;
      return u ? { store:"unit", key:t, name:u.name, obj:u } : null;
    } catch (e) { return null; }
  }
  function asofStored(){
    var S = ASOF;
    if (S.store === "unit") return UNITS[S.key];
    if (S.store === "fn") return FUNCTIONS[S.key];
    return { items: GROUP.items || [], topProjects: GROUP.topProjects || [], swot: GROUP.swot || {} };
  }
  function asofWith(draw){
    if (!asofHere()) return draw();
    var S = ASOF, put = [];
    var swap = function(host, k, v){ put.push([host, k, host[k]]); host[k] = v; };
    if (S.store === "unit") swap(UNITS, S.key, S.unit);
    else if (S.store === "fn") swap(FUNCTIONS, S.key, S.unit);
    else { swap(GROUP, "items", S.unit.items); swap(GROUP, "topProjects", S.unit.topProjects); }
    S.drawing = true;
    try { return asofBanner() + draw(); }
    finally { S.drawing = false; put.reverse().forEach(function(x){ x[0][x[1]] = x[2]; }); }
  }
  /* `office` is already this module's flag for what the last read said;
     the viewer's own standing is asked of the product, under its own name. */
  function officeHere(){ try { return typeof inOffice === "function" && inOffice(); } catch (e) { return false; } }
  function asofLink(t){
    if (!officeHere() || !asofSubject(t)) return '';
    if (ASOF.on && ASOF.target === t)
      return ' · <button type="button" class="linkbtn asof-on" data-asof-pick="' + E(t) + '">As it stood on <b>' + E(dayWord(ASOF.day)) + '</b> ▾</button>';
    return ' · <button type="button" class="linkbtn" data-asof-pick="' + E(t) + '">As it stood on…</button>';
  }
  function dayWord(day){
    try { return typeof dateDay === "function" ? dateDay(new Date(day + "T12:00:00")) : day; } catch (e) { return day; }
  }
  function isoDay(d){ return d.getFullYear() + "-" + ("0" + (d.getMonth() + 1)).slice(-2) + "-" + ("0" + d.getDate()).slice(-2); }
  function pickHtml(t){
    var now = new Date(), y = new Date(now); y.setDate(now.getDate() - 1);
    var cur = ASOF.on && ASOF.target === t ? ASOF.day : isoDay(y);
    return '<div class="asof-pick" data-asof-pick-for="' + E(t) + '">' +
      '<input type="date" class="fld" data-asof-day max="' + isoDay(now) + '" value="' + E(cur) + '" aria-label="Day">' +
      '<button type="button" class="bprim" data-asof-go="' + E(t) + '">Show the plan</button></div>';
  }
  function asofPick(t){
    if (typeof openModalHtml !== "function") return;
    openModalHtml("As it stood on…", "The plan as it was at the end of the chosen day. Read only.", pickHtml(t));
  }
  function asofGo(t, day){
    var box = document.querySelector('[data-asof-pick-for]');
    var say = function(msg){ if (box) { var p = box.querySelector(".hist-err") || document.createElement("p"); p.className = "hist-empty hist-err"; p.textContent = msg; box.appendChild(p); } };
    if (!/^\d{4}-\d{2}-\d{2}$/.test(day || "")) return say("Pick a day first.");
    var subj = asofSubject(t);
    if (!subj) return say("This page has no plan of its own to show this way.");
    var end = new Date(day + "T00:00:00"); end.setDate(end.getDate() + 1);
    fetchLog({ target:t, when:"all", fromAt:end.toISOString(), limit:ASOF_CAP }, function(err, j){
      if (err) return say("History could not be read — " + (err.message || err));
      var entries = j.log || [];
      var built = rebuild(subj.obj, entries, t);
      ASOF.on = true; ASOF.target = t; ASOF.day = day; ASOF.store = subj.store; ASOF.key = subj.key;
      ASOF.unit = built.unit; ASOF.name = subj.name;
      ASOF.gone = built.gone; ASOF.since = entries.length; ASOF.skipped = built.skipped;
      ASOF.capped = entries.length >= ASOF_CAP;
      if (typeof EDIT_PAGE !== "undefined") EDIT_PAGE.plan = false;
      document.body.classList.add("asof");
      if (typeof closeModal === "function") closeModal();
      if (typeof paint === "function") paint();
    });
  }
  function asofOff(repaint){
    ASOF.on = false; ASOF.target = null; ASOF.day = null; ASOF.store = null; ASOF.key = null; ASOF.unit = null; ASOF.gone = {};
    ASOF.since = 0; ASOF.skipped = 0; ASOF.capped = false; ASOF.drawing = false;
    document.body.classList.remove("asof");
    if (repaint && typeof paint === "function") paint();
  }
  var PLAN_KINDS = { unitPlan:1, unitReporting:1, unitFoundation:1, unitAnalysis:1, capPlan:1, capReporting:1, arrange:1, gapFill:1, gapConfirm:1, rowDone:1 };
  function rebuild(real, entries, t){
    var copy = JSON.parse(JSON.stringify(real)), skipped = 0;
    entries.forEach(function(e){
      var moved = e.rows_ && e.rows_.moved && e.rows_.moved.length ? e.rows_.moved : null;
      if (!moved) { if (PLAN_KINDS[e.kind]) skipped++; return; }
      if (e.rows_.count > moved.length) skipped++;
      moved.forEach(function(m){ undo(copy, t, m); });
    });
    var gone = {};
    walkIds(copy, function(r){ if (!rowIn(real, r.id)) gone[String(r.id)] = 1; });
    return { unit: copy, gone: gone, skipped: skipped };
  }
  function undo(copy, t, m){
    try {
      if (m.field === "row") { seatBack(t, m, copy); return; }
      if (m.id === t || m.id === copy.ukey || (t === "group" && m.id === "group")) { applyFrom(copy, m); return; }
      var f = findIn(copy, m.id);
      if (!f) return;
      if (f.swot) { applyFrom({ __swot: f.swot }, m); return; }
      if (f.obj) applyFrom(f.obj, m);
    } catch (e) {}
  }
  /* ONE ROW IN ANY SHAPE: the unit's own finder first, where the shape is a
     unit's (it knows a SWOT line's id), then a walk of every list that holds
     rows with ids — a function's projects and their three lists, the
     company's directions, a unit's measures. Depth-capped: a plan is never
     deeper than a project's milestone. */
  function rowIn(root, id, depth){
    depth = depth || 0;
    if (!root || typeof root !== "object" || depth > 6) return null;
    if (Array.isArray(root)) {
      for (var i = 0; i < root.length; i++) {
        var r = root[i];
        if (r && typeof r === "object" && !Array.isArray(r) && String(r.id) === String(id)) return r;
        var deep = rowIn(r, id, depth + 1); if (deep) return deep;
      }
      return null;
    }
    var keys = Object.keys(root);
    for (var k = 0; k < keys.length; k++) {
      var v = root[keys[k]];
      if (Array.isArray(v) || (v && typeof v === "object" && keys[k] === "breakdown")) {
        var hit = rowIn(v, id, depth + 1); if (hit) return hit;
      }
    }
    return null;
  }
  function findIn(root, id){
    if (root && Array.isArray(root.items) && root.ukey && typeof findById === "function") {
      try { var f = findById(root, id); if (f) return f; } catch (e) {}
    }
    var o = rowIn(root, id);
    return o ? { obj: o } : null;
  }
  function walkIds(root, fn, depth){
    depth = depth || 0;
    if (!root || typeof root !== "object" || depth > 6) return;
    if (Array.isArray(root)) {
      root.forEach(function(r){
        if (r && typeof r === "object" && !Array.isArray(r) && r.id != null) fn(r);
        walkIds(r, fn, depth + 1);
      });
      return;
    }
    Object.keys(root).forEach(function(k){
      var v = root[k];
      if (Array.isArray(v) || (v && typeof v === "object" && k === "breakdown")) walkIds(v, fn, depth + 1);
    });
  }
  function asofBanner(){
    if (!ASOF.on || !ASOF.unit) return '';
    var n = ASOF.since, name = ASOF.name || ASOF.unit.name || placeWord(ASOF.target);
    return '<div class="asof-bar" data-asof-bar><span><b>' + E(name) + '’s plan as it stood on ' + E(dayWord(ASOF.day)) + '.</b> Read only. ' +
      (n ? n + (n === 1 ? ' change has' : ' changes have') + ' been made since; the rows and figures below are what the plan held at the end of that day.'
         : 'Nothing has changed since; this is today’s plan.') +
      (ASOF.skipped ? ' ' + ASOF.skipped + ' of them could not be replayed (a reorder, or a change logged without its values), so an order or a value may differ.' : '') +
      (ASOF.capped ? ' More than ' + ASOF_CAP + ' changes since that day: only the latest ' + ASOF_CAP + ' were replayed.' : '') +
      '</span><button type="button" class="linkbtn" data-asof-off>Back to today</button></div>';
  }

  /* ── WIRING, DELEGATED ONCE ────────────────────────────────────────── */
  document.addEventListener("change", function(ev){
    var s = ev.target && ev.target.closest && ev.target.closest("[data-hist-f]");
    if (!s) return;
    F[s.dataset.histF] = s.value;
    keepFilters();
    load(false);
  });
  document.addEventListener("input", function(ev){
    var i = ev.target && ev.target.closest && ev.target.closest("[data-hist-q]");
    if (!i) return;
    F.q = i.value; applySearch();       /* typing never repaints (§35) */
  });
  document.addEventListener("click", function(ev){
    var b = ev.target && ev.target.closest && ev.target.closest("[data-hist-retry],[data-hist-open],[data-hist-restore],[data-hist-ok],[data-hist-cancel],[data-asof-pick],[data-asof-go],[data-asof-off]");
    if (!b) return;
    if (b.hasAttribute("data-hist-retry")) { load(true); return; }
    if (b.hasAttribute("data-hist-open")) { openFor(b.getAttribute("data-hist-open")); return; }
    /* §598: the day view's three acts */
    if (b.hasAttribute("data-asof-pick")) { asofPick(b.getAttribute("data-asof-pick")); return; }
    if (b.hasAttribute("data-asof-go")) {
      var inp = document.querySelector("[data-asof-day]");
      asofGo(b.getAttribute("data-asof-go"), inp ? inp.value : ""); return;
    }
    if (b.hasAttribute("data-asof-off")) { asofOff(true); return; }
    if (b.hasAttribute("data-hist-restore")) {
      var list = flatten(rows), r = list[+b.getAttribute("data-hist-restore")];
      if (!r || !r.m) return;
      pending = r;
      var inModal = !!b.closest("[data-hist-modal]");
      if (inModal) {
        var host = b.closest("[data-hist-modal]");
        var box = host.querySelector(".hist-confirm-host") || document.createElement("div");
        box.className = "hist-confirm-host"; box.innerHTML = confirmHtml(r);
        if (!box.parentNode) host.insertBefore(box, host.firstChild);
      } else if (typeof openModalHtml === "function") {
        openModalHtml("Put it back?", "", confirmHtml(r));
      }
      return;
    }
    if (b.hasAttribute("data-hist-cancel")) {
      pending = null;
      var hostc = b.closest(".hist-confirm-host");
      if (hostc) hostc.remove(); else if (typeof closeModal === "function") closeModal();
      return;
    }
    if (b.hasAttribute("data-hist-ok")) {
      if (!pending) return;
      var why = restore(pending);
      var box2 = b.closest(".hist-confirm");
      if (why) { if (box2) box2.innerHTML = '<p class="hist-empty hist-err">' + E(why) + '</p>'; pending = null; return; }
      pending = null;
      var wasModalOnly = !b.closest(".hist-confirm-host");
      if (wasModalOnly && typeof closeModal === "function") closeModal();
      else { var h2 = b.closest(".hist-confirm-host"); if (h2) h2.remove(); }
      /* THE SAVE IS THE PLATFORM'S OWN: paint() ends in afterPaint(), which
         posts the change at once (§170) and says so if it fails (§171). */
      if (typeof paint === "function") paint();
      /* The restore lands as a new log row; ask again once it has. */
      setTimeout(function(){ load(true); var t = target(); if (t) { delete lastCache[t]; onPaint(); } }, 1800);
      return;
    }
  });

  return { renderPage: renderPage, onPaint: onPaint, openFor: openFor, load: load,
           /* §598: the day view, read by the Plan page's painter and the
              authoring gate; seatBack is shared with the refused-save path */
           asofActive: asofActive, asofHere: asofHere, asofWith: asofWith, asofGone: asofGone, asofBanner: asofBanner,
           asofGo: asofGo, asofOff: asofOff, seatBack: seatBack, seatWord: seatWord,
           asof: function(){ return ASOF; },
           /* for the checks */
           filters: function(){ return F; }, rows: function(){ return rows; }, flatten: flatten,
           locate: locate, noRestore: noRestore, servable: servable,
           /* §504: the Unsaved changes page speaks the same words for a field,
              a person and a time — read, never copied (§53.5) */
           fieldWord: fieldWord, whoWord: whoWord, whenWord: whenWord };
})();
