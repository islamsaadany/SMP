/* ══ SETTING A CLIENT UP, INSIDE THE PLATFORM (§357, spec 055) ═══════════
   Islam, 2026-09-16, of where a client's settings live: *"the client either
   we open a module or we go to the client settings page where we find a rail
   with the client settings and I suggest having the getting started with the
   client setup to stay at the top of the rail until it's all fulfilled and
   then moves to the bottom and it absorbs the branding part with the mark and
   the brand colors and remove the separate branding setting"* — and, of two
   drawings of which chrome draws that rail, **"A"**: the client platform's
   own Setup, one rail, one chrome.

   SO THE SET-UP FLOW MOVES FOR THE THIRD TIME. §318 built it inside the
   platform as a wizard, §322 carried it to the console (*"the setup should
   happen on the external creation not inside"*), and this brings it back —
   with §322's reason kept whole, because it was never about the chrome:
   Settings is pressed FROM the console before anybody at the client has
   signed in, and it still is. What changes is only that the press opens the
   client's own Setup rail at /<client>/setup, where the register and the
   organisation pages the flow feeds already live.

   ONE MODULE, TWO HOSTS. The platform mounts the whole flow on its Getting
   started page (`mount`); the console keeps the two pieces a client's own
   address cannot draw — creating a client, which has no address yet
   (`mountCreate`), and bringing an archived one back or deleting it, whose
   address is closed (`mountArchived`, §323) — from this same file, generated
   into /client-setup.js by scripts/build-shell.mjs. A second copy of any
   step in platform.html is the drift this move exists to end (§53.5).

   THE SHAPE IS WRITTEN BY THE PRODUCT'S OWN MINTERS, IN THE BROWSER. §322's
   server ran `__smpShape` (below) inside a vm over the frozen sources and
   wrote the result; here the same function runs over the LIVE graph and the
   ordinary autosave carries it (§210), so a unit made on Getting started is
   byte for byte a unit made on Setup › Business units, and the server's
   shapeClient goes on calling this very function through lib/frozen.cjs —
   one answer to what a set-up writes, in one file (§53.5).

   NOTHING HERE CALLS `paint()` UNDER A TYPING HAND: a row's name is held in
   the flow's own state and written on Next, Back or Done with set-up, as the
   console's flow wrote it; the registry half — the client's name on the
   door, its mark, its industry — writes on `change`, which is the platform's
   own rule for a field (§35). */

/* ── THE SHAPE, SHARED WITH THE SERVER (was lib/frozen.cjs's glue) ──────── */

/* What the flow never asked about is not the flow's to reset (§346): a row
   whose key survives keeps everything except what the flow collects. */
function __smpCarry(old, fresh, owned) {
  var out = {}, k;
  for (k in old) if (Object.prototype.hasOwnProperty.call(old, k)) out[k] = old[k];
  for (k in fresh) if (Object.prototype.hasOwnProperty.call(fresh, k)) {
    if (owned.indexOf(k) > -1 || !Object.prototype.hasOwnProperty.call(out, k)) out[k] = fresh[k];
  }
  return out;
}
function __smpHeld(r) { return !!(r && (r.head || r.custodian)); }

/* What this client already holds, off the LIVE globals (§322, §347): a
   capability counts only when it holds something, and a plan line is a
   pillar, an objective or a SWOT point. */
function __smpHoldsNow() {
  var plans = 0, caps = 0;
  ((GROUP && GROUP.capabilities) || []).forEach(function (c) {
    var n = ((c.keyObjectives || []).length) + ((c.projects || []).length) +
            ((c.items || []).length);
    if (n) caps++;
  });
  (UNIT_KEYS || []).concat((FUNCTION_KEYS || []).map(function (k) { return "fn:" + k; }))
    .forEach(function (t) {
      var u = String(t).indexOf("fn:") === 0 ? FUNCTIONS[String(t).slice(3)] : UNITS[t];
      if (!u) return;
      plans += ((u.items || []).length) + ((u.keyObjectives || []).length);
      var sw = u.swot || {};
      plans += ["s", "w", "o", "t"].reduce(function (n, q) { return n + ((sw[q] || []).length); }, 0);
    });
  return { plans: plans, capabilities: caps,
           units: (UNIT_KEYS || []).length, functions: (FUNCTION_KEYS || []).length };
}
/* The same, of a graph handed in: `hydrate` is the caller's own — sync.js's
   in the browser, the glue's in lib/frozen.cjs — because rebinding the
   globals is the one thing this file must not decide for its host. */
function __smpHolds(state, hydrate) { hydrate(state); return __smpHoldsNow(); }

/* The answers written in by the product's own minters (§322): companies
   first, then units, then functions, then the capabilities they carry, then
   the words. IT IS A REPLACE, NOT AN AMEND — the answers are the list — and
   a row whose key survives keeps what the flow did not collect (§346).
   Answers { state, dropped }: `dropped` names the units and functions that
   had somebody in charge and are not in the answers, so the caller writes
   nothing rather than lose them. */
function __smpShape(state, a, hydrate) {
  var wasUnits = state.units || {}, wasFns = state.functions || {};
  var wasCos = state.companies || {}, wasRoles = state.unitRoles || {};
  var wasCaps = {};
  ((state.group && state.group.capabilities) || []).forEach(function (c) {
    var nm = String((c && c.name) || "").trim().toLowerCase();
    if (nm && !wasCaps[nm]) wasCaps[nm] = c;
  });
  /* The weighting rows go with the units, or every pass appends a second row
     per unit and syncWeights halves every weight (§346.1). */
  var wasW = {};
  var wlist = (state.group && state.group.weighting && state.group.weighting.units) || [];
  wlist.forEach(function (row) { if (row && row.key && !wasW[row.key]) wasW[row.key] = row; });

  state.unitKeys = []; state.units = {};
  state.functionKeys = []; state.functions = {};
  state.companyKeys = []; state.companies = {};
  state.unitRoles = {};
  if (state.group) state.group.capabilities = [];
  if (state.group && state.group.weighting) state.group.weighting.units = [];
  hydrate(state);
  a = a || {};
  var byName = {}, coByName = {};
  Object.keys(wasCos).forEach(function (k) {
    /* a company's key is positional (addCompany mints newco1, newco2), so it
       is matched by NAME, the only thing about a company the flow carries */
    var nm = String((wasCos[k] && wasCos[k].name) || "").trim().toLowerCase();
    if (nm && !coByName[nm]) coByName[nm] = wasCos[k];
  });
  (a.companies || []).forEach(function (c) {
    var nm = String((c && c.name) || "").trim();
    if (!nm) return;
    var k = addCompany();
    COMPANIES[k].name = nm;
    var had = coByName[nm.toLowerCase()];
    if (had) COMPANIES[k] = __smpCarry(had, COMPANIES[k], ["name"]);
    byName[nm.toLowerCase()] = k;
  });
  /* A ROW IS MATCHED BY ITS NAME FIRST, AND ONLY THEN BY ITS KEY (§357.3).
     addBusinessUnit mints a key from the name, and a client's stored keys
     were not always minted that way — Raya's are `mob`, `fin`, `cx`, and a
     client made on the frozen console carries whatever that day's minter
     wrote — so re-minting from the name gave every existing unit a NEW key,
     read every head as dropped, and refused a pass that added one unit
     (measured: "Somebody is in charge of Consumer Electronics, IT Dist.,
     Strategy Management Office" on a graph nobody had renamed). The name
     is what the flow carries (§346), so it is what an existing row is
     found by; the key match survives for a row renamed under a key the
     rename did not move. A matched row KEEPS ITS KEY — the figures, the
     focus marks, the memberships and every snapshot are keyed on it
     (§48, §232) — and is re-addressed under it, never appended beside it. */
  var unitByName = {}, claimedU = {};
  Object.keys(wasUnits).forEach(function (k) {
    var nm = String((wasUnits[k] && wasUnits[k].name) || "").trim().toLowerCase();
    if (nm && !unitByName[nm]) unitByName[nm] = k;
  });
  function rekeyUnit(from, to, nm) {
    if (from === to) return;
    UNITS[to] = UNITS[from]; delete UNITS[from];
    UNITS[to].ukey = to;
    UNITS[to].clauses = (UNITS[to].clauses || []).map(function (c, i) { return [c[0], c[1], to + "-F" + (i + 1)]; });
    UNIT_KEYS[UNIT_KEYS.indexOf(from)] = to;
    UNIT_ROLES[to] = UNIT_ROLES[from]; delete UNIT_ROLES[from];
    var rows = GROUP.weighting.units;
    for (var i = 0; i < rows.length; i++) if (rows[i] && rows[i].key === from) { rows[i].key = to; rows[i].unit = nm; }
  }
  (a.units || []).forEach(function (u) {
    var nm = String((u && u.name) || "").trim();
    if (!nm) return;
    var co = byName[String((u && u.company) || "").trim().toLowerCase()] || null;
    var k = addBusinessUnit(nm, (u && u.prefix) || "", co);
    if (!k) return;
    var was = unitByName[nm.toLowerCase()];
    if (was && claimedU[was]) was = null;
    if (!was && wasUnits[k] && !claimedU[k]) was = k;
    if (!was) return;
    claimedU[was] = true;
    rekeyUnit(k, was, nm); k = was;
    UNITS[k] = __smpCarry(wasUnits[k], UNITS[k], ["name", "company", "ukey"]);
    if (wasRoles[k]) UNIT_ROLES[k] = wasRoles[k];
    if (wasW[k]) {
      var rows = GROUP.weighting.units;
      for (var i = 0; i < rows.length; i++) {
        if (rows[i] && rows[i].key === k) { wasW[k].unit = nm; rows[i] = wasW[k]; break; }
      }
    }
  });
  var fnByOld = {}, claimedF = {};
  Object.keys(wasFns).forEach(function (k) {
    var nm = String((wasFns[k] && wasFns[k].name) || "").trim().toLowerCase();
    if (nm && !fnByOld[nm]) fnByOld[nm] = k;
  });
  (a.functions || []).forEach(function (f) {
    var nm = String((f && f.name) || "").trim();
    if (!nm) return;
    var ff = (f && f.format) === "pillars" ? "pillars"
           : (f && f.format) === "objectives" ? "objectives" : "projects";
    var k = addFunction(nm, ff);
    if (!k) return;
    var was = fnByOld[nm.toLowerCase()];
    if (was && claimedF[was]) was = null;
    if (!was && wasFns[k] && !claimedF[k]) was = k;
    if (!was) return;
    claimedF[was] = true;
    if (was !== k) {
      FUNCTIONS[was] = FUNCTIONS[k]; delete FUNCTIONS[k];
      FUNCTION_KEYS[FUNCTION_KEYS.indexOf(k)] = was;
      k = was;
    }
    FUNCTIONS[k] = __smpCarry(wasFns[k], FUNCTIONS[k], ["name", "format"]);
  });
  var fnByName = {};
  (FUNCTION_KEYS || []).forEach(function (k) {
    var nm = String((FUNCTIONS[k] && FUNCTIONS[k].name) || "").trim().toLowerCase();
    if (nm && !fnByName[nm]) fnByName[nm] = k;
  });
  (a.capabilities || []).forEach(function (cp) {
    var nm = String((cp && cp.name) || "").trim();
    if (!nm) return;
    var holder = fnByName[String((cp && cp.fn) || "").trim().toLowerCase()] || null;
    var made = addCapability(holder);
    made.name = nm;
    made.format = (cp && cp.format) === "pillars" ? "pillars" : "projects";
    var had = wasCaps[nm.toLowerCase()];
    if (had) {
      var keep = __smpCarry(had, made, ["name", "fn", "format", "id", "code"]);
      for (var kk in keep) if (Object.prototype.hasOwnProperty.call(keep, kk)) made[kk] = keep[kk];
    }
  });
  var dropped = [];
  Object.keys(wasRoles).forEach(function (k) {
    if (__smpHeld(wasRoles[k]) && !UNITS[k]) dropped.push(String((wasUnits[k] && wasUnits[k].name) || k));
  });
  Object.keys(wasFns).forEach(function (k) {
    if (__smpHeld(wasFns[k]) && !FUNCTIONS[k]) dropped.push(String((wasFns[k] && wasFns[k].name) || k));
  });
  syncWeights();
  var words = a.words || {};
  (LABELS.entries || []).forEach(function (e) {
    var v = words[e.key];
    if (v == null) return;
    v = String(v).trim();
    if (v) e.bu = v;
  });
  state.labels = LABELS.entries;
  return { state: state, dropped: dropped };
}

var CLIENTSETUP = (function () {
  "use strict";

  /* ── THE STEPS, BY KEY AND NEVER BY NUMBER (§322) ────────────────────
     Seven, as the mockup draws them. There is no Summary step any more:
     the rail beside this page IS the summary — every answer here is a page
     on it — and Done with set-up is a button on every step rather than a
     destination at the end (spec 055). */
  var STEPS = [
    { k:"client", key:"The client",       label:"The client",     q:"Which client is this?" },
    { k:"units",  key:"The organisation", label:"Business units", q:"What are the business units?" },
    { k:"cos",    key:"The organisation", label:"Companies",      q:"Are the units grouped into companies?" },
    { k:"fns",    key:"Strategy",         label:"Functions",      q:"What supporting functions are there?" },
    { k:"caps",   key:"Strategy",         label:"Capabilities",   q:"Are there capabilities beside the units?" },
    { k:"words",  key:"Language",         label:"The words",      q:"What does this client call these things?" },
    { k:"office", key:"People",           label:"The office",     q:"Who runs the strategy office?" }
  ];
  var SHAPE_STEPS = ["units", "cos", "fns", "caps", "words"];
  function stepIdx(k){ for (var i = 0; i < STEPS.length; i++) if (STEPS[i].k === k) return i; return 0; }

  /* THE STANDARD INDUSTRY LIST — Strategy-Formulation's own, so a client
     reads the same in both products (§322). */
  var INDUSTRIES = [
    ["Technology & Communications", ["Technology & Software", "Telecommunications", "Media & Entertainment"]],
    ["Financial", ["Banking & Finance", "Insurance", "Investment & Asset Management"]],
    ["Healthcare & Life Sciences", ["Healthcare & Hospitals", "Pharmaceuticals & Biotech", "Medical Devices & Equipment"]],
    ["Consumer", ["Retail & E-commerce", "Consumer Goods & FMCG", "Food & Beverage", "Hospitality & Tourism", "Restaurants & Food Service"]],
    ["Industrial", ["Manufacturing", "Automotive", "Aerospace & Defense", "Chemicals", "Industrial Equipment & Machinery"]],
    ["Energy & Utilities", ["Oil & Gas", "Renewable Energy", "Utilities (Electric, Water, Gas)"]],
    ["Real Estate & Construction", ["Real Estate & Property", "Construction & Engineering", "Architecture & Design"]],
    ["Services", ["Professional Services & Consulting", "Legal Services", "Accounting & Audit", "Marketing & Advertising", "HR & Recruitment"]],
    ["Transportation & Logistics", ["Transportation & Logistics", "Shipping & Maritime", "Aviation & Airlines"]],
    ["Other Sectors", ["Education & Training", "Agriculture & Farming", "Mining & Metals", "Government & Public Sector", "Non-Profit & NGO", "Sports & Recreation", "Fashion & Apparel", "Printing & Publishing"]],
    ["", ["Other"]]
  ];
  /* A band, never a headcount (§322). */
  var SIZES = [["startup","Startup","1–10"], ["small","Small","11–50"],
               ["medium","Medium","51–200"], ["large","Large","201–1000"],
               ["enterprise","Enterprise","1000+"]];
  function sizeWord(v){
    for (var i = 0; i < SIZES.length; i++) if (SIZES[i][0] === v) return SIZES[i][1] + " · " + SIZES[i][2] + " people";
    return "Not set";
  }
  /* The three ways a function plans (§342), the two a capability may (§347). */
  var FORMATS = [["pillars","Pillars"], ["projects","Projects"], ["objectives","Objectives & actions"]];
  var CAP_FORMATS = [["pillars","Pillars"], ["projects","Projects"]];
  /* The names most clients have, one click in (§351). */
  var COMMON_UNITS = ["Retail", "Online", "Wholesale", "Distribution",
                      "Corporate Sales", "Export", "Services"];
  var COMMON_FNS   = ["Finance", "HR", "IT", "Marketing", "Legal", "Procurement",
                      "Operations", "Supply Chain", "Customer Service", "Audit",
                      "Strategy Management Office"];
  function markFromChip(row, name){
    Object.defineProperty(row, "_chip", { value:name, enumerable:false });
    return row;
  }
  function chipUsed(list, name){
    for (var i = 0; i < list.length; i++) if (list[i]._chip === name) return true;
    return false;
  }

  /* ── The flow's own state, kept ACROSS repaints ──────────────────────
     The shell rebuilds the page on every paint() and mounts this again, so
     what step you are on and what you have typed live here and not in the
     DOM. `S.key` is the client; a different key starts over. */
  var S = null, HOST = null, OPTS = {};

  function el(tag, cls, text) {
    var e = document.createElement(tag);
    if (cls) e.className = cls;
    if (text != null) e.textContent = text;   /* never innerHTML: every name here is typed */
    return e;
  }
  /* ONE SHAPE FOR EVERY REQUEST (§71): not signed in is the door, not an
     error message — the platform's own door for this client, the console's
     root. Every other refusal is answered in words where it was made. */
  function post(body) {
    return fetch("/api/platform", { method:"POST", cache:"no-store",
      headers:{ "Content-Type":"application/json" }, body:JSON.stringify(body) })
      .then(function (r) {
        if (r.status === 401 || r.status === 403) {
          return r.json().then(function (j) {
            if (j && j.auth) { location.replace(OPTS.door || "/"); throw new Error("sign in"); }
            return j;
          });
        }
        return r.json();
      });
  }
  function say(msg, bad){
    /* Held in S as well as written, because a refusal now REDRAWS the step
       (the put-back rows have to be drawn) and a sentence written into the
       old column would go with it (§63). render() writes S.said back and
       the next successful move clears it. */
    /* §357.6: the console's two pieces (mountCreate, mountArchived) hold no
       step state — S is only ever minted by mount() — and the create piece
       said "Creating…" through this very function, so Add a client THREW
       before it posted anything: no refusal written, no createClient sent,
       the console left standing on /platform with nothing on the console
       but a TypeError. Found by checks/client-setup-outside.py asserting
       what is POSTED (§96); the state is held only where there is one. */
    if (S) S.said = msg ? { msg: msg, bad: !!bad } : null;
    var n = HOST && HOST.querySelector("[data-cssaid]");
    if (!n) return;
    n.textContent = msg || "";
    n.className = "cssaid " + (msg ? (bad ? "err" : "said") : "");
    n.hidden = !msg;
  }
  function nOf(n, one, many) { return n + " " + (n === 1 ? one : (many || one + "s")); }

  /* ── WHAT THE GRAPH ALREADY SAYS (the platform host) ─────────────────
     Read off the live globals rather than asked of the server: inside the
     platform the graph on screen is the truth of the moment, and a server
     copy could lag an autosave by a second (§210). The same mapping the
     server's `client` action makes, so a row reads the same in both hosts. */
  function liveShape(){
    var g = { companies:[], units:[], functions:[], capabilities:[], words:{} };
    (COMPANY_KEYS || []).forEach(function (k) { g.companies.push({ name: COMPANIES[k].name }); });
    (UNIT_KEYS || []).forEach(function (k) {
      var u = UNITS[k];
      g.units.push({ name: u.name,
        company: u.company && COMPANIES[u.company] ? COMPANIES[u.company].name : "" });
    });
    (FUNCTION_KEYS || []).forEach(function (k) {
      var f = FUNCTIONS[k];
      g.functions.push({ name: f.name,
        format: f.format === "pillars" ? "pillars" : f.format === "objectives" ? "objectives" : "projects" });
    });
    ((GROUP && GROUP.capabilities) || []).forEach(function (c) {
      g.capabilities.push({ name: c.name,
        fn: c.fn && FUNCTIONS[c.fn] ? FUNCTIONS[c.fn].name : "",
        format: c.format === "pillars" ? "pillars" : "projects" });
    });
    (LABELS.entries || []).forEach(function (e) { g.words[e.key] = e.bu; });
    return g;
  }
  function holdsNow(){ return __smpHoldsNow(); }
  function isDone(){ return !!(typeof SMPRules !== "undefined" && SMPRules.setupDone(GROUP)); }

  /* ── WHAT THE RAIL'S STRIP SAYS (spec 055): which steps the data holds an
     answer for. Counted, never remembered — the data IS the progress
     (§129), so there is no second record of it to fall out of step. The
     client and its words always count (the client exists; a word left as
     it is keeps the platform's own); the office counts when a Forefront
     row is on the register (§339 writes the creator's). */
  function progress(){
    var ff = (PEOPLE || []).some(function (p) { return p && (p.forefront || (p.extra && p.extra.forefront)); });
    var tests = {
      client: true,
      units:  (UNIT_KEYS || []).length > 0,
      cos:    (COMPANY_KEYS || []).length > 0 || (UNIT_KEYS || []).length > 0,
      fns:    (FUNCTION_KEYS || []).length > 0,
      caps:   ((GROUP && GROUP.capabilities) || []).length > 0,
      words:  true,
      office: ff
    };
    var done = 0, todo = [];
    STEPS.forEach(function (s) { if (tests[s.k]) done++; else todo.push(s.label); });
    return { done: done, total: STEPS.length, todo: todo };
  }

  /* ── MOUNTING IN THE PLATFORM ────────────────────────────────────────
     `host` is the page's box; `opts.key` the client's slug, `opts.live`
     whether a server is there at all, `opts.door` where a 401 goes,
     `opts.repaint` the shell's paint(). Called from paint() on every draw of
     the Getting started page, before wire() so the brand controls it draws
     are wired by the shell like any other. */
  function mount(host, opts){
    HOST = host; OPTS = opts || {};
    var key = OPTS.key || "";
    if (!S || S.key !== key) {
      S = { key:key, at:0, seen:[], reg:null, regErr:null, loading:false,
            shape:liveShape(), shapeDirty:false, markState:undefined };
    }
    if (S.at > STEPS.length - 1) S.at = 0;
    ensureReg("[data-csetup]", mount);
    render();
  }

  /* ── THE CLIENT'S RECORD, ASKED ONCE FOR WHOEVER IS DRAWING (§359.2) ──
     Two hosts read it now — the flow, and the Forefront team page below —
     and the state is module-level and keyed on the client, so the second
     reader finds the first one's answer rather than asking again (§53.5).
     What differs is only which box to redraw when it lands, so that is the
     argument rather than a second copy of the request. */
  function ensureReg(sel, again){
    var key = OPTS.key || "";
    if (S.reg || S.regErr || S.loading || !OPTS.live || !key) return;
    S.loading = true;
    var back = function () { var h = document.querySelector(sel); if (h) again(h, OPTS); };
    post({ action:"client", key:key }).then(function (j) {
      S.loading = false;
      if (!j.ok) { S.regErr = j.error || "The client's record could not be read."; }
      else S.reg = j;
      back();
    }).catch(function (e) {
      S.loading = false;
      if (String(e.message) === "sign in") return;
      S.regErr = "Could not reach the server.";
      back();
    });
  }

  /* ── FOREFRONT TEAM, ON A PAGE OF ITS OWN (§359.2, spec 056 §3a) ───────
     Islam: *"how about the forefront team is a separate view as you did but
     we keep them on the client list reading from the forefront team list."*
     So it is a Setup page of the client's, and the SET-UP FLOW'S STEP IS THE
     SECOND READER rather than the owner: `officeStep` is unchanged and drawn
     from both, because people join and leave an account team all through an
     engagement and a renderer copied for the page would be the drift §53.5
     keeps recording. The state is the flow's, so opening either fills both. */
  function mountTeam(host, opts){
    HOST = host; OPTS = opts || {};
    var key = OPTS.key || "";
    if (!S || S.key !== key) {
      S = { key:key, at:0, seen:[], reg:null, regErr:null, loading:false,
            shape:liveShape(), shapeDirty:false, markState:undefined };
    }
    ensureReg("[data-cteam]", mountTeam);
    host.innerHTML = "";
    var box = el("div", "wzstep");
    officeStep(box);
    host.appendChild(box);
  }
  function redraw(){
    if (OPTS.repaint) OPTS.repaint();
    else if (HOST) render();
  }
  function canEdit(){ return !!(S.reg && S.reg.canEdit); }
  /* The shape is frozen once there is a plan (§346): its own flag, never
     `canEdit`, because the name, the mark and the team stay changeable. In
     the platform the graph's own writers decide — anybody who may open this
     page may shape a client that holds no plan. */
  function canShape(){
    var h = holdsNow();
    return !(h.plans || h.capabilities) && !(S.reg && S.reg.client && S.reg.client.status === "retired");
  }

  function render(){
    if (!HOST) return;
    HOST.textContent = "";
    var s = STEPS[S.at];
    var done = isDone();

    var rail = el("nav", "wzrail");
    rail.setAttribute("aria-label", "Set-up steps");
    STEPS.forEach(function (st, i) {
      var seen = S.seen.indexOf(i) >= 0 && i !== S.at;
      var b = el("button", "wzstep" + (seen ? " done" : ""));
      b.type = "button";
      b.dataset.step = st.k;
      if (i === S.at) b.setAttribute("aria-current", "step");
      b.appendChild(el("span", "n", seen ? "✓" : String(i + 1)));
      b.appendChild(document.createTextNode(st.label));
      b.addEventListener("click", function () { goStep(i); });
      rail.appendChild(b);
    });
    HOST.appendChild(rail);

    if (S.regErr) {
      var rb = el("p", "wzarched");
      rb.appendChild(document.createTextNode("The client's own record — its name on the door, its mark, its modules and the office team — could not be read: " + S.regErr + " The pages below that live in the platform still work."));
      HOST.appendChild(rb);
    }
    if (!canShape() && SHAPE_STEPS.indexOf(s.k) > -1) {
      var hb = el("div", "wzarched");
      hb.appendChild(document.createTextNode("This client has a plan in it, so its "));
      hb.appendChild(el("b", null, "shape is set from here on"));
      hb.appendChild(document.createTextNode(
        ". Set-up rewrites these lists, which would lose that work, so they are read-only here — " +
        "rename or retire a row on its own Setup page instead, where the row keeps who runs it."));
      HOST.appendChild(hb);
    }

    var col = el("div", "wzcol");
    col.appendChild(el("span", "lab", s.key));
    col.appendChild(el("h2", "wzq", s.q));
    var why = s.k === "units"
        ? "Add as many as this client has. Leave it empty and the platform opens blank — nothing is put here that nobody asked for."
      : s.k === "fns"
        ? "Each function can plan its own way, and that decides what its pages hold. It stays changeable until the function has a plan in it."
      : "";
    if (why) col.appendChild(el("p", "wzwhy", why));
    col.appendChild(stepBody(s.k));

    var foot = el("div", "wzfoot");
    var back = el("button", "btn", "‹ Back");
    back.type = "button"; back.disabled = S.at === 0; back.dataset.wzback = "1";
    back.addEventListener("click", function () { goStep(S.at - 1); });
    foot.appendChild(back);
    if (S.at < STEPS.length - 1) {
      var next = el("button", "btn amber", "Next ›");
      next.type = "button"; next.dataset.wznext = "1";
      next.addEventListener("click", function () { goStep(S.at + 1); });
      foot.appendChild(next);
    }
    if (!done) {
      var fin = el("button", "btn solid", "Done with set-up");
      fin.type = "button"; fin.dataset.wzdone = "1";
      fin.title = "Marks the set-up finished: this page moves to the bottom of the rail as Client set-up, and every answer stays editable there.";
      fin.addEventListener("click", markDone);
      foot.appendChild(fin);
    }
    var fn = el("span", "wzfnote", done
      ? "Every answer here stays editable."
      : "Rows are written when you press Next, Back or Done with set-up. Nothing is final.");
    foot.appendChild(fn);
    col.appendChild(foot);
    var said = el("p", "cssaid"); said.dataset.cssaid = "1"; said.hidden = true;
    if (S.said) { said.textContent = S.said.msg; said.className = "cssaid " + (S.said.bad ? "err" : "said"); said.hidden = false; }
    col.appendChild(said);
    HOST.appendChild(col);
    /* The focus a redraw asked for is landed HERE and never after redraw()
       returns: the shell's paint() is HELD while a click is landing (§30.1),
       so a focus() called on the line after it reached the column that was
       about to be replaced (measured: activeElement "" after + Add). */
    if (S.focusNew) { S.focusNew = false; focusLastName(); }
  }

  /* ── Moving between steps commits the shape (§322's rule kept) ─────── */
  function unnamed(){
    var bad = [];
    if (S.shape.units.some(function (u) { return !String(u.name || "").trim(); })) bad.push("a business unit");
    if (S.shape.companies.some(function (c) { return !String(c.name || "").trim(); })) bad.push("a company");
    if (S.shape.functions.some(function (f) { return !String(f.name || "").trim(); })) bad.push("a supporting function");
    if (S.shape.capabilities.some(function (c) { return !String(c.name || "").trim(); })) bad.push("a capability");
    if (!bad.length) return null;
    return "Name " + bad.join(" and ") + ", or remove the empty row with the × beside it. A row with no name is not saved.";
  }
  function goStep(i){
    if (i < 0 || i > STEPS.length - 1) return;
    var why = unnamed();
    if (why) { say(why, true); return; }
    if (!commitShape()) return;
    if (S.seen.indexOf(S.at) < 0) S.seen.push(S.at);
    S.at = i; S.said = null;
    redraw();
    window.scrollTo({ top:0 });
  }

  /* ── WRITING THE SHAPE INTO THE LIVE GRAPH ───────────────────────────
     A COPY is shaped first and the live globals are rebound to it only if
     nobody in charge of anything was dropped — __smpShape rebinds as it
     goes, so on a refusal the graph that was there is put back (§346).
     Then the shell's paint() runs and the autosave carries every row it
     minted (§210). Over file:// the same thing happens to the baked data,
     which is what the offline copy is for. */
  function commitShape(){
    if (!S.shapeDirty) return true;
    if (!canShape()) { say("This client has a plan in it, so its shape is not rewritten from here.", true); return false; }
    if (typeof SYNC === "undefined" || !SYNC.graph || !SYNC.hydrate) { say("The shape cannot be written here.", true); return false; }
    var live = SYNC.graph();
    var copy = JSON.parse(JSON.stringify(live));
    var res = __smpShape(copy, S.shape, SYNC.hydrate);
    if (res.dropped.length) {
      SYNC.hydrate(live);
      /* THE ROWS ARE PUT BACK AS WELL AS REFUSED (§357.3): a refusal that
         left the removed row out of the flow's own list would refuse every
         Next and Back after it too, with no way to proceed short of typing
         the name back in — the flow held the person on the step. The list
         is re-read off the graph that stood, the step redrawn so the row
         is SEEN to be back, and the sentence says both halves. */
      var one = res.dropped.length === 1;
      S.shape = liveShape(); S.shapeDirty = false;
      say("Somebody is in charge of " + res.dropped.join(", ") + ", and set-up cannot carry that across a rename or a removal, so " +
          (one ? "its row is back as it was" : "their rows are back as they were") + ". " +
          "Rename or retire " + (one ? "it" : "them") + " on its own Setup page instead.", true);
      redraw();
      return false;
    }
    S.shapeDirty = false;
    S.shape = liveShape();
    S.said = null;
    return true;
  }
  /* Done with set-up (spec 055): the shape written, then the mark. ONE key
     on the group (SMPRules.SETUP_DONE), stored as an absence until pressed
     (§50.6); the rail reads it on the next paint. */
  function markDone(){
    var why = unnamed();
    if (why) { say(why, true); return; }
    if (!commitShape()) return;
    GROUP[SMPRules.SETUP_DONE] = true;
    redraw();
    window.scrollTo({ top:0 });
  }

  /* ── Each step ───────────────────────────────────────────────────── */
  function stepBody(k){
    var box = el("div");
    if (k === "client") return clientStep(box);
    if (k === "units") return listStep(box, S.shape.units, "unit");
    if (k === "cos") return companiesStep(box);
    if (k === "caps") return capsStep(box);
    if (k === "fns") return listStep(box, S.shape.functions, "fn");
    if (k === "words") return wordsStep(box);
    return officeStep(box);
  }

  /* A registry field writes on change, the platform's rule for a field
     (§35): saveClient with that one value, the refusal said in place. */
  function saveReg(patch, then){
    return post(Object.assign({ action:"saveClient", key:S.key }, patch)).then(function (r) {
      if (!r.ok) { say(r.error || "Not saved.", true); return false; }
      say(""); if (then) then(); return true;
    }).catch(function (e) { if (String(e.message) !== "sign in") say("Could not reach the server.", true); return false; });
  }
  function field(box, label, value, onChange, note, ro){
    var w = el("div");
    w.appendChild(el("span", "lab", label));
    var i = el("input", "fld");
    i.type = "text"; i.value = value || "";
    if (ro) i.readOnly = true;
    if (onChange) i.addEventListener("change", function () { onChange(i.value); });
    w.appendChild(i);
    if (note) w.appendChild(el("p", "note", note));
    box.appendChild(w);
    return i;
  }

  /* The registry half, then the graph half: the mark on the door, the
     group's mark and the brand colours (Branding, absorbed here — spec 055),
     the modules this client has, and the way to archive it. */
  function clientStep(box){
    var reg = S.reg, c = reg && reg.client;
    var ed = canEdit();
    var rs = el("div", "rowset");
    if (c) {
      field(rs, "The client's name", c.name, function (v) {
        v = v.trim(); if (!v || v === c.name) return;
        saveReg({ name:v }, function () { c.name = v; });
      }, "What the platform is named after on the console and on the door.", !ed);
      /* the searchable standard list */
      var iw = el("div");
      iw.appendChild(el("span", "lab", "Industry"));
      var pick = el("div", "wzpick");
      var inp = el("input", "fld");
      inp.type = "text"; inp.value = c.industry || "";
      inp.setAttribute("placeholder", "Type to search the list…");
      inp.setAttribute("autocomplete", "off");
      if (!ed) inp.readOnly = true;
      var panel = el("div", "wzpanel");
      panel.setAttribute("role", "listbox");
      panel.hidden = true;
      function fill(q){
        panel.textContent = "";
        var needle = String(q || "").trim().toLowerCase(), hits = 0;
        INDUSTRIES.forEach(function (g) {
          var keep = g[1].filter(function (n) { return !needle || n.toLowerCase().indexOf(needle) > -1; });
          if (!keep.length) return;
          hits += keep.length;
          if (g[0]) panel.appendChild(el("div", "gp", g[0]));
          keep.forEach(function (n) {
            var b = el("button", "opt", n);
            b.type = "button";
            if (n === c.industry) b.setAttribute("aria-selected", "true");
            b.addEventListener("click", function () {
              inp.value = n; panel.hidden = true;
              saveReg({ industry:n }, function () { c.industry = n; });
            });
            panel.appendChild(b);
          });
        });
        if (!hits) panel.appendChild(el("div", "nohit", "Nothing matches that — pick Other if none of it fits."));
      }
      if (ed) {
        inp.addEventListener("focus", function () { fill(""); panel.hidden = false; });
        inp.addEventListener("input", function () { fill(inp.value); panel.hidden = false; });
        inp.addEventListener("blur", function () { setTimeout(function () { panel.hidden = true; }, 150); });
      }
      pick.appendChild(inp); pick.appendChild(panel);
      iw.appendChild(pick);
      rs.appendChild(iw);

      var zw = el("div");
      zw.appendChild(el("span", "lab", "Size"));
      var band = el("div", "wzband");
      band.setAttribute("role", "group");
      SIZES.forEach(function (z) {
        var b = el("button", null, z[1]);
        b.type = "button";
        b.disabled = !ed;
        b.setAttribute("aria-pressed", c.size === z[0] ? "true" : "false");
        b.appendChild(el("span", "ppl", z[2] + " people"));
        b.addEventListener("click", function () {
          if (!ed) return;
          saveReg({ size:z[0] }, function () {
            c.size = z[0];
            Array.prototype.forEach.call(band.children, function (o) {
              o.setAttribute("aria-pressed", o === b ? "true" : "false");
            });
          });
        });
        band.appendChild(b);
      });
      zw.appendChild(band);
      rs.appendChild(zw);

      var nw = el("div");
      nw.appendChild(el("span", "lab", "Notes"));
      var ta = el("textarea", "fld");
      ta.rows = 2; ta.value = c.notes || "";
      if (!ed) ta.readOnly = true;
      ta.addEventListener("change", function () { saveReg({ notes:ta.value }, function () { c.notes = ta.value; }); });
      nw.appendChild(ta);
      rs.appendChild(nw);
    } else {
      field(rs, "The client's name", (GROUP && GROUP.org) || "", null,
        OPTS.live ? "" : "The client's own record — its name on the door, its industry and its mark — is kept by the served platform.", true);
    }
    var aw = el("div");
    aw.appendChild(el("span", "lab", "Its address here"));
    var a = el("input", "fld");
    a.value = S.key ? location.origin + "/" + S.key : location.origin + "/…";
    a.readOnly = true;
    aw.appendChild(a);
    aw.appendChild(el("p", "note", "Made from the name and set once, so a link that has been sent keeps working."));
    rs.appendChild(aw);
    if (c) rs.appendChild(markBlock(c));
    box.appendChild(rs);

    /* ── THE BRANDING, ABSORBED (spec 055): the group's mark and the two
       colours, drawn by the one renderer Branding always had and wired by
       the shell's own handlers after this mounts — no second answer to what
       a colour does (§53.5). */
    if (typeof brandingBody === "function") {
      var bb = el("div", "wzbrand");
      bb.innerHTML = brandingBody();
      box.appendChild(bb);
    }
    if (c) { box.appendChild(modulesBlock()); box.appendChild(archiveBlock()); }
    return box;
  }

  /* The mark on this client's door (§313.36): PNG only, shrunk here on a
     transparent canvas, written the moment it is picked. */
  function markBlock(c){
    var mk = el("div", "wzmark");
    mk.appendChild(el("span", "lab", "Mark on this client's door"));
    var mrow = el("div", "markrow");
    var preview = el("img"); preview.alt = "";
    var noneNote = el("span", "none", "No mark yet — the door opens plain until one is set.");
    function show(src){
      if (src) { preview.src = src; preview.hidden = false; noneNote.hidden = true; }
      else { preview.removeAttribute("src"); preview.hidden = true; noneNote.hidden = false; }
    }
    mrow.appendChild(preview); mrow.appendChild(noneNote);
    show(c.mark);
    if (canEdit()) {
      var file = el("input"); file.type = "file"; file.accept = "image/png"; file.hidden = true;
      file.dataset.doormark = "1";
      var choose = el("button", "btn", c.mark ? "Replace" : "Choose a PNG"); choose.type = "button";
      choose.addEventListener("click", function () { file.click(); });
      var drop = el("button", "btn", "Remove"); drop.type = "button";
      drop.hidden = !c.mark;
      drop.addEventListener("click", function () {
        saveReg({ mark:"" }, function () { c.mark = null; show(null); drop.hidden = true; choose.textContent = "Choose a PNG"; });
      });
      file.addEventListener("change", function () {
        var f = file.files && file.files[0];
        file.value = "";
        if (!f) return;
        if (f.type !== "image/png") { say("The mark must be a PNG.", true); return; }
        var url = URL.createObjectURL(f);
        var img = new Image();
        img.onload = function () {
          URL.revokeObjectURL(url);
          var scale = Math.min(1, 640 / img.naturalWidth, 200 / img.naturalHeight);
          var cv = document.createElement("canvas");
          cv.width = Math.max(1, Math.round(img.naturalWidth * scale));
          cv.height = Math.max(1, Math.round(img.naturalHeight * scale));
          cv.getContext("2d").drawImage(img, 0, 0, cv.width, cv.height);
          var out = cv.toDataURL("image/png");
          if (out.length > 400000) { say("That picture is too large even shrunk — try a simpler PNG.", true); return; }
          saveReg({ mark:out }, function () { c.mark = out; show(out); drop.hidden = false; choose.textContent = "Replace"; });
        };
        img.onerror = function () { URL.revokeObjectURL(url); say("That file could not be read as a picture.", true); };
        img.src = url;
      });
      mrow.appendChild(choose); mrow.appendChild(drop); mrow.appendChild(file);
    }
    mk.appendChild(mrow);
    mk.appendChild(el("p", "note", "Shown on " + location.origin + "/" + S.key + "/sign-in, the door this client's people sign in at."));
    return mk;
  }

  /* ── WHICH MODULES THIS CLIENT HAS (§320.4, carried whole) ───────────
     The list comes from the server, the default gets words and not a dead
     control (§94.15), seeing a state is not setting it (§256), and it
     rewrites itself rather than the page (§71.2). */
  function modulesBlock(){
    var box = el("div");
    var reg = S.reg;
    if (!reg || !reg.offer || !reg.offer.length) return box;
    var mods = el("div", "band");
    mods.appendChild(el("span", "lab", "Modules this client has"));
    var rows = el("div");
    mods.appendChild(rows);
    function paintRows(){
      rows.textContent = "";
      var have = reg.modules || [];
      reg.offer.forEach(function (m) {
        var mr = el("div", "teamrow");
        mr.dataset.module = m.key;
        var mwho = el("div", "who");
        mwho.appendChild(el("div", "nm", m.label));
        mwho.appendChild(el("div", "em", m.note));
        mr.appendChild(mwho);
        var msp = el("div", "sp");
        var on = have.indexOf(m.key) >= 0;
        if (m.always) msp.appendChild(el("span", "none", "Always on"));
        else {
          if (on) msp.appendChild(el("span", "tag open", "On"));
          else if (!reg.canEdit) msp.appendChild(el("span", "none", "Off"));
          if (reg.canEdit) {
            var mb = el("button", "btn", on ? "Turn off" : "Turn on");
            mb.type = "button";
            mb.addEventListener("click", function () {
              mb.disabled = true;
              post({ action:"setModules", key:S.key, module:m.key, on:!on }).then(function (r) {
                if (!r.ok) { mb.disabled = false; say(r.error || "Not changed.", true); return; }
                reg.modules = r.modules || [];
                paintRows();
              });
            });
            msp.appendChild(mb);
          }
        }
        mr.appendChild(msp);
        rows.appendChild(mr);
      });
    }
    paintRows();
    mods.appendChild(el("p", "note",
      "Turning one on gives this client the module: it appears on their card, in the " +
      "switcher inside the platform, and at its own address. Turning it off takes it away " +
      "and deletes nothing."));
    box.appendChild(mods);
    return box;
  }

  /* ── ARCHIVING, FROM INSIDE (§323) ───────────────────────────────────
     The destructive act in its own block behind a rule at the foot of the
     step (§273.4), the ask in the block and naming the client — and the
     press LEAVES: archiving closes the address this page is drawn at, so it
     lands on the console, where the Archived band now holds the client.
     Bringing one back and deleting stay on the console (mountArchived),
     because an archived client's address answers nobody (§61). */
  function archiveBlock(){
    var wrap = el("div");
    var reg = S.reg;
    if (!reg || !reg.canArchive || (reg.client && reg.client.status === "retired")) return wrap;
    var name = reg.client.name;
    function draw(){
      wrap.textContent = "";
      var a = el("div", "wzend");
      a.appendChild(el("span", "wzendkey", "Archiving"));
      a.appendChild(el("p", "wzendwhy",
        "Archiving takes " + name + " off the clients page and closes their link — " +
        "anybody who goes to it is turned away exactly as if this client had never existed. " +
        "Nothing is lost, and you can bring them back from the console."));
      var row = el("div", "wzendrow");
      var go = el("button", "btn risk", "Archive this client");
      go.type = "button"; go.dataset.archive = "ask";
      go.addEventListener("click", function () { ask(a); });
      row.appendChild(go);
      a.appendChild(row);
      wrap.appendChild(a);
    }
    function ask(box){
      box.textContent = "";
      box.appendChild(el("span", "wzendkey", "Archiving"));
      var q = el("div", "wzask");
      q.dataset.ask = "archive";
      var p1 = el("p");
      p1.appendChild(document.createTextNode("Archive "));
      p1.appendChild(el("b", null, name));
      p1.appendChild(document.createTextNode("?"));
      q.appendChild(p1);
      var goes = el("p", "goes");
      goes.appendChild(document.createTextNode("Their link stops working at once — this page included."));
      goes.appendChild(el("br"));
      goes.appendChild(document.createTextNode("The card leaves the clients page."));
      goes.appendChild(el("br"));
      goes.appendChild(document.createTextNode("Everything they have is kept."));
      q.appendChild(goes);
      var row = el("div", "row");
      var yes = el("button", "btn risksolid", "Archive " + name);
      yes.type = "button"; yes.dataset.archive = "do";
      var no2 = el("button", "btn", "Cancel");
      no2.type = "button"; no2.dataset.archive = "cancel";
      no2.addEventListener("click", draw);
      yes.addEventListener("click", function () {
        yes.disabled = true; no2.disabled = true; yes.textContent = "Archiving…";
        post({ action:"archiveClient", key:S.key, on:true }).then(function (j) {
          if (!j.ok) { yes.disabled = false; no2.disabled = false; yes.textContent = "Archive " + name;
                       say(j.error || "Not archived.", true); return; }
          location.assign(OPTS.console || "/platform");
        }).catch(function (e) {
          if (String(e.message) === "sign in") return;
          yes.disabled = false; no2.disabled = false; yes.textContent = "Archive " + name;
          say("Could not reach the server.", true);
        });
      });
      row.appendChild(yes); row.appendChild(no2);
      q.appendChild(row);
      box.appendChild(q);
    }
    draw();
    return wrap;
  }

  /* ── A list you add to: units and functions are one control ───────── */
  function focusLastName(){
    var boxes = HOST ? HOST.querySelectorAll(".wzrow input.fld") : [];
    if (boxes.length) boxes[boxes.length - 1].focus();
  }
  function addThenFocus(){ S.shapeDirty = true; S.focusNew = true; redraw(); }
  function listStep(box, list, kind){
    var shape = canShape();
    if (!list.length) {
      box.appendChild(el("p", "wzempty", kind === "unit" ? "No business units yet." : "No supporting functions yet."));
    } else {
      var rows = el("div", "wzrows");
      list.forEach(function (row, n) {
        var r = el("div", "wzrow");
        var nm = el("input", "fld");
        nm.type = "text"; nm.value = row.name;
        if (!shape) nm.readOnly = true;
        nm.addEventListener("input", function () { row.name = nm.value; S.shapeDirty = true; });
        r.appendChild(nm);
        if (kind === "fn") {
          var tail = el("span", "wzrt");
          tail.appendChild(el("span", "wzsub", "plans in"));
          var sel = el("select", "fld");
          FORMATS.forEach(function (f) {
            var o = el("option", null, f[1]);
            o.value = f[0];
            if (row.format === f[0]) o.selected = true;
            sel.appendChild(o);
          });
          if (!shape) sel.disabled = true;
          sel.addEventListener("change", function () { row.format = sel.value; S.shapeDirty = true; });
          tail.appendChild(sel);
          r.appendChild(tail);
        }
        if (shape) {
          var x = el("button", "wzx", "×");
          x.type = "button";
          x.setAttribute("aria-label", "Remove " + row.name);
          x.addEventListener("click", function () { list.splice(n, 1); S.shapeDirty = true; redraw(); });
          r.appendChild(x);
        }
        rows.appendChild(r);
      });
      box.appendChild(rows);
    }
    if (shape) {
      var common = kind === "unit" ? COMMON_UNITS : COMMON_FNS;
      var left = common.filter(function (nm) { return !chipUsed(list, nm); });
      if (left.length) {
        var crow = el("div", "wzcommon");
        left.forEach(function (nm) {
          var cb = el("button", "wzcm");
          cb.type = "button";
          cb.setAttribute("aria-label", "Add " + nm);
          cb.appendChild(el("span", "p", "+"));
          cb.appendChild(document.createTextNode(nm));
          cb.addEventListener("click", function () {
            list.push(markFromChip(kind === "unit" ? { name:nm, company:"" } : { name:nm, format:"pillars" }, nm));
            addThenFocus();
          });
          crow.appendChild(cb);
        });
        box.appendChild(crow);
      }
      var add = el("button", "wzadd", kind === "unit" ? "+ Add a business unit" : "+ Add a supporting function");
      add.type = "button";
      add.addEventListener("click", function () {
        list.push(kind === "unit" ? { name:"", company:"" } : { name:"", format:"pillars" });
        addThenFocus();
      });
      box.appendChild(add);
    }
    box.appendChild(el("p", "wzwhy", kind === "unit"
      ? "A unit plans in pillars, with key measures and tactics under each. Its code is made from the name and prefixes every pillar on it."
      : "A function's plan type decides what its pages hold, and it stays changeable until the function has a plan in it."));
    return box;
  }

  function companiesStep(box){
    var shape = canShape();
    var has = S.shape.companies.length > 0;
    var ch = el("div", "wzchoices");
    [[false, "No — the units sit directly under " + ((GROUP && GROUP.org) || "this client"),
      "One less layer to explain. Companies can be added later without touching the plans."],
     [true, "Yes — group them into companies",
      "A company holds several units and decides who sees across them. It carries no plan of its own."]]
      .forEach(function (c) {
        var b = el("button", "wzchoice");
        b.type = "button";
        b.disabled = !shape;
        b.setAttribute("aria-pressed", c[0] === has ? "true" : "false");
        b.appendChild(el("span", "cname", c[1]));
        b.appendChild(el("span", "cwhy", c[2]));
        b.addEventListener("click", function () {
          if (!shape) return;
          if (!c[0]) { S.shape.companies = []; S.shape.units.forEach(function (u) { u.company = ""; }); }
          else if (!S.shape.companies.length) S.shape.companies.push({ name:"" });
          S.shapeDirty = true; redraw();
        });
        ch.appendChild(b);
      });
    box.appendChild(ch);
    if (!has) return box;
    var rows = el("div", "wzrows");
    S.shape.companies.forEach(function (co, n) {
      var r = el("div", "wzrow");
      var nm = el("input", "fld");
      nm.type = "text"; nm.value = co.name;
      nm.setAttribute("placeholder", "The company's name");
      if (!shape) nm.readOnly = true;
      nm.addEventListener("input", function () { co.name = nm.value; S.shapeDirty = true; });
      r.appendChild(nm);
      var x = el("button", "wzx", "×");
      x.disabled = !shape;
      x.type = "button"; x.setAttribute("aria-label", "Remove");
      x.addEventListener("click", function () {
        var gone = co.name;
        S.shape.companies.splice(n, 1);
        S.shape.units.forEach(function (u) { if (u.company === gone) u.company = ""; });
        S.shapeDirty = true; redraw();
      });
      r.appendChild(x);
      rows.appendChild(r);
    });
    box.appendChild(rows);
    var add = el("button", "wzadd", "+ Add a company");
    add.type = "button"; add.disabled = !shape;
    add.addEventListener("click", function () { S.shape.companies.push({ name:"" }); S.shapeDirty = true; redraw(); });
    box.appendChild(add);
    if (S.shape.units.length) {
      box.appendChild(el("div", "lab", "Which company each unit belongs to"));
      var ur = el("div", "wzrows");
      S.shape.units.forEach(function (u) {
        var r = el("div", "wzrow");
        r.appendChild(el("span", "wzname", u.name || "(unnamed)"));
        var tail = el("span", "wzrt");
        var sel = el("select", "fld");
        var none = el("option", null, "Its own — no company"); none.value = "";
        sel.appendChild(none);
        S.shape.companies.forEach(function (co) {
          if (!co.name) return;
          var o = el("option", null, co.name); o.value = co.name;
          if (u.company === co.name) o.selected = true;
          sel.appendChild(o);
        });
        sel.disabled = !shape;
        sel.addEventListener("change", function () { u.company = sel.value; S.shapeDirty = true; });
        tail.appendChild(sel);
        r.appendChild(tail);
        ur.appendChild(r);
      });
      box.appendChild(ur);
    }
    return box;
  }

  /* A capability is a row you add, like the others (§347): a name, which
     function carries it, and how it is planned — Setup › Capabilities' own
     three questions. */
  function capsStep(box){
    var shape = canShape();
    if (!S.shape.capabilities.length) {
      box.appendChild(el("p", "wzempty", "No capabilities yet."));
    } else {
      var rows = el("div", "wzrows");
      S.shape.capabilities.forEach(function (cp, n) {
        var r = el("div", "wzrow");
        var nm = el("input", "fld");
        nm.type = "text"; nm.value = cp.name;
        nm.setAttribute("aria-label", "Capability name");
        if (!shape) nm.readOnly = true;
        nm.addEventListener("input", function () { cp.name = nm.value; S.shapeDirty = true; });
        r.appendChild(nm);
        var tail = el("span", "wzrt");
        tail.appendChild(el("span", "wzsub", "carried by"));
        var who = el("select", "fld");
        who.setAttribute("aria-label", "Which function carries " + (cp.name || "this capability"));
        var none = el("option", null, "— unassigned —"); none.value = "";
        who.appendChild(none);
        S.shape.functions.forEach(function (f) {
          if (!f.name) return;
          var o = el("option", null, f.name); o.value = f.name;
          if (cp.fn === f.name) o.selected = true;
          who.appendChild(o);
        });
        who.disabled = !shape;
        who.addEventListener("change", function () { cp.fn = who.value; S.shapeDirty = true; });
        tail.appendChild(who);
        tail.appendChild(el("span", "wzsub", "plans in"));
        var how = el("select", "fld");
        how.setAttribute("aria-label", "How " + (cp.name || "this capability") + " is planned");
        CAP_FORMATS.forEach(function (f) {
          var o = el("option", null, f[1]); o.value = f[0];
          if (cp.format === f[0]) o.selected = true;
          how.appendChild(o);
        });
        how.disabled = !shape;
        how.addEventListener("change", function () { cp.format = how.value; S.shapeDirty = true; });
        tail.appendChild(how);
        r.appendChild(tail);
        if (shape) {
          var x = el("button", "wzx", "×");
          x.type = "button";
          x.setAttribute("aria-label", "Remove " + cp.name);
          x.addEventListener("click", function () { S.shape.capabilities.splice(n, 1); S.shapeDirty = true; redraw(); });
          r.appendChild(x);
        }
        rows.appendChild(r);
      });
      box.appendChild(rows);
    }
    if (shape) {
      var add = el("button", "wzadd", "+ Add a capability");
      add.type = "button";
      add.addEventListener("click", function () {
        S.shape.capabilities.push({ name:"", fn:"", format:"projects" });
        addThenFocus();
      });
      box.appendChild(add);
    }
    box.appendChild(el("p", "wzwhy",
      "A capability appears on the strategic side of the navigation, beside the business units, " +
      "with pages of its own. Its code is made from its name, and how it plans stays changeable until it has a plan in it."));
    return box;
  }

  /* The words the client uses, only the ones it has (§346.3). */
  function wordsStep(box){
    var shape = canShape();
    var WORDS = [
      ["unitword", "Business unit", "Business Unit", "Every client has these"],
      ["pillar", "Pillar", "Pillar", "Units plan in pillars"],
      ["measure", "Key measure", "Key Measure", "Under a pillar"],
      ["tactic", "Tactic", "Tactic", "Under a pillar"],
      ["keyobj", "Key objectives", "Key Objectives", "A subject's own scorecard"]
    ];
    var wrap = el("div", "wztbl");
    var t = el("table");
    var thead = el("thead"), hr = el("tr");
    ["What it is", "What this client calls it", "Why we ask"].forEach(function (h) { hr.appendChild(el("th", null, h)); });
    thead.appendChild(hr); t.appendChild(thead);
    var tb = el("tbody");
    WORDS.forEach(function (w) {
      var tr = el("tr");
      var c1 = el("td"); c1.appendChild(el("b", null, w[1])); tr.appendChild(c1);
      var c2 = el("td");
      var i = el("input", "fld");
      i.type = "text";
      i.value = S.shape.words[w[0]] != null ? S.shape.words[w[0]] : w[2];
      if (!shape) i.readOnly = true;
      i.addEventListener("input", function () { S.shape.words[w[0]] = i.value; S.shapeDirty = true; });
      c2.appendChild(i); tr.appendChild(c2);
      tr.appendChild(el("td", "muted", w[3]));
      tb.appendChild(tr);
    });
    t.appendChild(tb); wrap.appendChild(t);
    box.appendChild(wrap);
    box.appendChild(el("p", "wzwhy", "Only the words this client actually has. A box left as it is keeps the platform's own word."));
    return box;
  }

  /* The office: Forefront's people on this client, each writing on the
     press (§322). Needs the registry — it says so when there is none. */
  function officeStep(box){
    var reg = S.reg;
    if (!reg) {
      box.appendChild(el("p", "wzempty", OPTS.live && !S.regErr ? "Reading the team…" : "The office team is kept by the served platform."));
      return box;
    }
    var ed = !!reg.canEdit;
    (reg.team || []).forEach(function (m) {
      var tr = el("div", "teamrow");
      var who = el("div", "who");
      who.appendChild(el("div", "nm", m.name || m.email));
      who.appendChild(el("div", "em", m.email));
      tr.appendChild(who);
      var sp = el("div", "sp");
      if (ed && !reg.client.made_here && (reg.register || []).length) sp.appendChild(registerCell(m, reg.register));
      sp.appendChild(seatCell(m, reg.seats || [], ed));
      if (ed) {
        var rm = el("button", "btn", "Remove");
        rm.type = "button";
        rm.addEventListener("click", function () {
          post({ action:"setTeam", key:S.key, email:m.email, on:false })
            .then(function (r) { r.ok ? refreshTeam() : say(r.error || "Not removed.", true); });
        });
        sp.appendChild(rm);
      }
      tr.appendChild(sp);
      box.appendChild(tr);
    });
    if (ed) {
      var row = el("div", "row");
      var who2 = el("select", "fld");
      var p0 = el("option", null, "Add somebody from Forefront"); p0.value = "";
      who2.appendChild(p0);
      (reg.office || []).forEach(function (o) {
        if ((reg.team || []).some(function (m) { return m.email === o.email; })) return;
        var op = el("option", null, (o.name || o.email) + " — " + o.email);
        op.value = o.email;
        who2.appendChild(op);
      });
      var asWho = el("select", "fld");
      var a0 = el("option", null, "…as who on this client's register?"); a0.value = "";
      asWho.appendChild(a0);
      (reg.register || []).forEach(function (r) {
        var o = el("option", null, r.name + (r.email ? " · " + r.email : "")); o.value = r.key;
        asWho.appendChild(o);
      });
      var add = el("button", "btn", "Add");
      add.type = "button";
      add.addEventListener("click", function () {
        if (!who2.value) return;
        post({ action:"setTeam", key:S.key, email:who2.value, seat:"smoteam", personKey:asWho.value })
          .then(function (r) { r.ok ? refreshTeam() : say(r.error || "Not added.", true); });
      });
      row.appendChild(who2);
      if (!reg.client.made_here && (reg.register || []).length) row.appendChild(asWho);
      row.appendChild(add);
      box.appendChild(row);
    }
    box.appendChild(el("p", "wzwhy",
      "These are Forefront's people, not the client's. A seat is held on THIS client: " +
      "Super user holds its access matrix, retiring people and issuing passwords; SMO team runs " +
      "cycles and corrects plans. The client's own register — its heads, custodians and their " +
      "passwords — is built on the People register beside this page."));
    return box;
  }
  /* The team controls write at once, so the flow re-reads rather than
     guessing what the server now holds. A seat is also a register row
     (§339, state-api officeRow), so the page is repainted afterwards. */
  function refreshTeam(){
    S.reg = null; S.regErr = null;
    redraw();
  }
  function registerCell(member, register) {
    var wrap = el("span", "asrow");
    wrap.appendChild(el("span", "aslab", "on this register as"));
    var sel = el("select", "fld");
    var own = el("option", null, "a row of their own"); own.value = "";
    sel.appendChild(own);
    register.forEach(function (r) {
      var o = el("option", null, r.name + (r.email ? " · " + r.email : "")); o.value = r.key;
      if (r.key === member.person_key) o.selected = true;
      sel.appendChild(o);
    });
    sel.addEventListener("change", function () {
      post({ action:"setTeam", key:S.key, email:member.email, seat:member.seat, personKey:sel.value })
        .then(function (r) { refreshTeam(); if (!r.ok) say(r.error || "Not changed.", true); });
    });
    wrap.appendChild(sel);
    return wrap;
  }
  function seatCell(member, seats, editable) {
    var wrap = el("span", "cell" + (editable ? "" : " locked"));
    seats.forEach(function (s) {
      var b = el("button", null, s.name);
      b.type = "button";
      b.title = s.note;
      if (member.seat === s.key) b.className = "on" + (s.key === "super" ? " hi" : "");
      if (editable && member.seat !== s.key) {
        b.addEventListener("click", function () {
          post({ action:"setTeam", key:S.key, email:member.email, seat:s.key })
            .then(function (r) { r.ok ? refreshTeam() : say(r.error || "Not changed.", true); });
        });
      }
      wrap.appendChild(b);
    });
    return wrap;
  }

  /* ── THE CONSOLE'S TWO PIECES ─────────────────────────────────────── */

  /* Adding a client (spec 044, §322): the first step creates the row and
     the address, and then the flow continues INSIDE the client at its own
     Getting started page, which is where every other answer is written. */
  function mountCreate(host, opts){
    HOST = host; OPTS = opts || {};
    var draft = { name:"", industry:"", size:"", notes:"" };
    host.textContent = "";
    var col = el("div", "wzcol");
    col.appendChild(el("span", "lab", "The client"));
    col.appendChild(el("h2", "wzq", "Which client are you setting up?"));
    var rs = el("div", "rowset");
    field(rs, "The client's name", "", function (v) { draft.name = v; },
      "What the platform is named after, everywhere — the chrome, the review deck and every email that leaves. Its address is made from it and set once.");
    var iw = el("div");
    iw.appendChild(el("span", "lab", "Industry"));
    var pick = el("div", "wzpick");
    var inp = el("input", "fld");
    inp.type = "text";
    inp.setAttribute("placeholder", "Type to search the list…");
    inp.setAttribute("autocomplete", "off");
    var panel = el("div", "wzpanel");
    panel.setAttribute("role", "listbox"); panel.hidden = true;
    function fill(q){
      panel.textContent = "";
      var needle = String(q || "").trim().toLowerCase(), hits = 0;
      INDUSTRIES.forEach(function (g) {
        var keep = g[1].filter(function (n) { return !needle || n.toLowerCase().indexOf(needle) > -1; });
        if (!keep.length) return;
        hits += keep.length;
        if (g[0]) panel.appendChild(el("div", "gp", g[0]));
        keep.forEach(function (n) {
          var b = el("button", "opt", n); b.type = "button";
          if (n === draft.industry) b.setAttribute("aria-selected", "true");
          b.addEventListener("click", function () { draft.industry = n; inp.value = n; panel.hidden = true; });
          panel.appendChild(b);
        });
      });
      if (!hits) panel.appendChild(el("div", "nohit", "Nothing matches that — pick Other if none of it fits."));
    }
    inp.addEventListener("focus", function () { fill(""); panel.hidden = false; });
    inp.addEventListener("input", function () { fill(inp.value); panel.hidden = false; });
    pick.appendChild(inp); pick.appendChild(panel);
    iw.appendChild(pick);
    iw.appendChild(el("p", "note", "The standard list — the same one Strategy Formulation uses, so a client reads the same in both."));
    rs.appendChild(iw);
    var zw = el("div");
    zw.appendChild(el("span", "lab", "Size"));
    var band = el("div", "wzband"); band.setAttribute("role", "group");
    SIZES.forEach(function (z) {
      var b = el("button", null, z[1]); b.type = "button";
      b.setAttribute("aria-pressed", "false");
      b.appendChild(el("span", "ppl", z[2] + " people"));
      b.addEventListener("click", function () {
        draft.size = z[0];
        Array.prototype.forEach.call(band.children, function (o) { o.setAttribute("aria-pressed", o === b ? "true" : "false"); });
      });
      band.appendChild(b);
    });
    zw.appendChild(band); rs.appendChild(zw);
    var nw = el("div");
    nw.appendChild(el("span", "lab", "Notes"));
    var ta = el("textarea", "fld"); ta.rows = 2;
    ta.addEventListener("input", function () { draft.notes = ta.value; });
    nw.appendChild(ta); rs.appendChild(nw);
    col.appendChild(rs);
    var foot = el("div", "wzfoot");
    var next = el("button", "btn amber", "Create and set it up ›");
    next.type = "button"; next.dataset.wznext = "1";
    next.addEventListener("click", function () {
      var nm = String(draft.name || "").trim();
      if (!nm) { say("A client needs a name before anything else can be set up.", true); return; }
      next.disabled = true; say("Creating…");
      post({ action:"createClient", name:nm, industry:draft.industry, size:draft.size, notes:draft.notes })
        .then(function (r) {
          if (!r.ok) { next.disabled = false; say(r.error || "Not created.", true); return; }
          /* INTO THE CLIENT, AT ITS OWN GETTING STARTED PAGE: everything from
             here on is written where it lives (spec 055). */
          location.assign("/" + r.key + "/setup/start");
        }).catch(function (e) { if (String(e.message) !== "sign in") { next.disabled = false; say("Could not reach the server.", true); } });
    });
    foot.appendChild(next);
    foot.appendChild(el("span", "wzfnote", "The rest — its units, functions, words, mark and team — is set up inside the client, at its own address."));
    col.appendChild(foot);
    var said = el("p", "cssaid"); said.dataset.cssaid = "1"; said.hidden = true;
    col.appendChild(said);
    host.appendChild(col);
    var first = rs.querySelector("input.fld"); if (first) first.focus();
  }

  /* An archived client's two acts, on the console (§323): the way back
     first and on its own, then — for the platform's admin — the way out,
     reachable from an archived client and nowhere else. `opts.go` is the
     console's own way back to its cards; `opts.read` a read of the client
     the console already made. */
  function mountArchived(host, key, opts){
    HOST = host; OPTS = opts || {};
    var reg = OPTS.read, name = reg && reg.client ? reg.client.name : key;
    host.textContent = "";
    var wrap = el("div", "wzcol");
    function block(keyword){ var b = el("div", "wzend"); b.appendChild(el("span", "wzendkey", keyword)); return b; }
    function trouble(box, msg){ var p2 = el("p", "wzendwhy", msg); p2.style.color = "var(--bad)"; box.appendChild(p2); }
    function draw(){
      wrap.textContent = "";
      var r = block("Bringing them back");
      r.appendChild(el("p", "wzendwhy", "Their link starts working again and the card returns to the clients page, exactly as it was."));
      var rrow = el("div", "wzendrow");
      var rb = el("button", "btn", "Bring " + name + " back");
      rb.type = "button"; rb.dataset.unarchive = "1";
      rb.addEventListener("click", function () {
        rb.disabled = true; rb.textContent = "Bringing them back…";
        post({ action:"archiveClient", key:key, on:false }).then(function (j) {
          if (!j.ok) { rb.disabled = false; rb.textContent = "Bring " + name + " back"; trouble(r, j.error || "Not brought back."); return; }
          if (OPTS.go) OPTS.go();
        }).catch(function (e) {
          if (String(e.message) === "sign in") return;
          rb.disabled = false; rb.textContent = "Bring " + name + " back"; trouble(r, "Could not reach the server.");
        });
      });
      rrow.appendChild(rb); r.appendChild(rrow);
      wrap.appendChild(r);
      if (!reg || !reg.canDelete) return;
      var d = block("Deleting");
      d.appendChild(el("p", "wzendwhy",
        "Deleting removes everything this client has — their plan, their figures, their people " +
        "and their conversations. It cannot be undone and there is nothing to restore from."));
      var drow = el("div", "wzendrow");
      var db = el("button", "btn risk", "Delete permanently…");
      db.type = "button"; db.dataset.delete = "ask";
      db.addEventListener("click", function () { askDelete(d); });
      drow.appendChild(db); d.appendChild(drow);
      wrap.appendChild(d);
    }
    function askDelete(box){
      box.textContent = "";
      box.appendChild(el("span", "wzendkey", "Deleting"));
      var q = el("div", "wzask"); q.dataset.ask = "delete";
      var p1 = el("p");
      p1.appendChild(document.createTextNode("Delete "));
      p1.appendChild(el("b", null, name));
      p1.appendChild(document.createTextNode(" and everything in it?"));
      q.appendChild(p1);
      var goes = el("p", "goes"); goes.dataset.goes = "1";
      var g = reg && reg.goes;
      if (!g) {
        goes.appendChild(document.createTextNode("What is in this client could not be read, so it cannot be listed here."));
      } else {
        var lines = [], shape = [];
        if (g.units != null) shape.push(nOf(g.units, "business unit"));
        if (g.functions != null) shape.push(nOf(g.functions, "supporting function"));
        if (shape.length) lines.push(shape.join(" · "));
        if (g.people != null) lines.push(nOf(g.people, "person", "people") + " on the register");
        var rest = [];
        if (g.plans != null) rest.push(nOf(g.plans, "line") + " of plan");
        if (g.capabilities != null && g.capabilities) rest.push(nOf(g.capabilities, "capability", "capabilities"));
        if (g.conversations != null) rest.push(nOf(g.conversations, "conversation"));
        if (rest.length) lines.push(rest.join(" · "));
        lines.forEach(function (t, i) { if (i) goes.appendChild(el("br")); goes.appendChild(document.createTextNode(t)); });
      }
      q.appendChild(goes);
      q.appendChild(el("p", null, "This cannot be undone, and there is no backup to restore from. If anybody needs their plans, download them first."));
      var lab = el("label", null, "Type the client's name to confirm"); lab.setAttribute("for", "wz-confirm");
      q.appendChild(lab);
      var typed = el("input", "fld"); typed.id = "wz-confirm"; typed.setAttribute("autocomplete", "off"); typed.dataset.confirm = "1";
      q.appendChild(typed);
      var row = el("div", "row");
      var yes = el("button", "btn risksolid", "Delete " + name + " for ever");
      yes.type = "button"; yes.dataset.delete = "do"; yes.disabled = true;
      var no2 = el("button", "btn", "Cancel"); no2.type = "button"; no2.dataset.delete = "cancel";
      no2.addEventListener("click", draw);
      typed.addEventListener("input", function () { yes.disabled = typed.value.trim() !== String(name).trim(); });
      yes.addEventListener("click", function () {
        yes.disabled = true; no2.disabled = true; typed.readOnly = true; yes.textContent = "Deleting…";
        post({ action:"deleteClient", key:key, confirm:typed.value }).then(function (j) {
          if (!j.ok) {
            no2.disabled = false; typed.readOnly = false;
            yes.textContent = "Delete " + name + " for ever";
            yes.disabled = typed.value.trim() !== String(name).trim();
            trouble(q, j.error || "Not deleted."); return;
          }
          if (OPTS.go) OPTS.go();
        }).catch(function (e) {
          if (String(e.message) === "sign in") return;
          no2.disabled = false; typed.readOnly = false;
          yes.textContent = "Delete " + name + " for ever"; yes.disabled = false;
          trouble(q, "Could not reach the server.");
        });
      });
      row.appendChild(yes); row.appendChild(no2);
      q.appendChild(row);
      box.appendChild(q);
    }
    draw();
    host.appendChild(wrap);
  }

  return { mount:mount, mountTeam:mountTeam, mountCreate:mountCreate, mountArchived:mountArchived,
           progress:progress, isDone:isDone, STEPS:STEPS,
           /* for the checks: the step the flow stands on, never its DOM */
           at: function () { return S ? STEPS[S.at].k : null; } };
})();
