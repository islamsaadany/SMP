/* ══ SETTING A CLIENT UP, INSIDE THE PLATFORM (§360, spec 057) ═══════════
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
  /* A ROW IS MATCHED BY ITS NAME FIRST, AND ONLY THEN BY ITS KEY (§360.3).
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
  /* A FUNCTION MAY BELONG TO A DIVISION (§391, §404.4), answered here as the
     division's NAME, the one thing the flow carries about a company. Only an
     answer that SAYS something is applied: a row from a tab on an older build
     carries no `company` at all, and reading that as "none" would take away a
     division somebody set on Setup › Supporting functions. The weight
     (`coWeight`) is that page's alone and is kept as it stands. */
  (a.functions || []).forEach(function (f) {
    if (!f || !Object.prototype.hasOwnProperty.call(f, "company")) return;
    var nm = String(f.name || "").trim().toLowerCase();
    var k = null;
    (FUNCTION_KEYS || []).forEach(function (fk) {
      if (!k && String((FUNCTIONS[fk] && FUNCTIONS[fk].name) || "").trim().toLowerCase() === nm) k = fk;
    });
    if (!k) return;
    var co = byName[String(f.company || "").trim().toLowerCase()] || null;
    if (co) FUNCTIONS[k].company = co;
    else { delete FUNCTIONS[k].company; delete FUNCTIONS[k].coWeight; }
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
  /* A word arrives as {one, many} since §395 — the flow asks both, as
     Setup › Terminology does — and as a bare string from a tab on an older
     build, which was always the MANY form. A box left empty keeps the word
     that was there. */
  (LABELS.entries || []).forEach(function (e) {
    var v = words[e.key];
    if (v == null) return;
    var one = typeof v === "object" ? v.one : null;
    var many = typeof v === "object" ? v.many : v;
    one = one == null ? "" : String(one).trim();
    many = many == null ? "" : String(many).trim();
    if (one) e.group = one;
    if (many) e.bu = many;
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
     destination at the end (spec 057). */
  /* The client's own word where the platform holds one (§395). The console
     mounts this file with no label registry, so the platform's word is the
     fallback there — which is also what a client that has named nothing
     says. Raw text: every caller hands it to a text node, never to HTML. */
  function W(k, form, fb){
    return typeof labelWord === "function" ? labelWord(k, form === "one" ? "group" : "bu") : fb;
  }
  /* THE SAME WORD, IN A SENTENCE (§398). Islam: "make the setup questions
     lower case." The flow's questions and answers read the client's word in
     the middle of a sentence, where "Are the Business units grouped into
     Divisions?" reads as a heading dropped into prose. This narrows §160.6's
     "as typed" for THIS FLOW'S SENTENCES ONLY — headings, step labels and
     every other screen keep the word exactly as typed. An acronym is left
     alone: a word is lowered only where everything after its first letter is
     already lower case, so "BUs" and "IT" stay as they are. `wc` is the same
     word at the start of a sentence. */
  function w(k, form, fb){
    return W(k, form, fb).replace(/\S+/g, function (x){
      return x.slice(1) === x.slice(1).toLowerCase() ? x.charAt(0).toLowerCase() + x.slice(1) : x;
    });
  }
  function wc(k, form, fb){ var v = w(k, form, fb); return v.charAt(0).toUpperCase() + v.slice(1); }
  var STEPS = [
    { k:"client", key:"The client",       label:"The client",     q:"Which client is this?" },
    /* §404: THE STRUCTURE COMES SECOND, before anything is named inside it
       (his order, from the signed-off mockup): how many levels sit above the
       business units, what each is called, and what each carries. */
    { k:"structure", key:"The organisation", label:"Structure",
      q:"How is this client built, and what does each level carry?" },
    /* The questions speak the client's words too (§396): a step headed
       "Divisions" asking about "companies" is two names for one thing on one
       screen. Each word is taken as typed, never inflected (§107.8). */
    /* §404.4, his order: the divisions are named BEFORE the units, so a
       unit can be put in one as it is named. Whether there is a second layer
       at all is the Structure step's question and is not asked again here. */
    { k:"cos",    key:"The organisation", get label(){ return W("division", "many", "Companies"); },
      get q(){ return "What are the " + w("division", "many", "companies") + "?"; } },
    { k:"units",  key:"The organisation", get label(){ return W("unitword", "many", "Business units"); },
      get q(){ return "What are the " + w("unitword", "many", "business units") + "?"; } },
    { k:"fns",    key:"Strategy",         get label(){ return W("fnword", "many", "Functions"); },
      get q(){ return "What " + w("fnword", "many", "supporting functions") + " are there?"; } },
    { k:"caps",   key:"Strategy",         get label(){ return W("capability", "many", "Capabilities"); },
      get q(){ return "Are there " + w("capability", "many", "capabilities") + " beside the " + w("unitword", "many", "business units") + "?"; } },
    /* §404.4: no Words step. Every word it asked for is asked on the
       Structure step now, beside the level or component it names. */
    { k:"office", key:"People",           label:"The office",     q:"Who runs the strategy office?" }
  ];
  var SHAPE_STEPS = ["cos", "units", "fns", "caps"];
  /* §404: the components a level may carry, in the mockup's order, each with
     its fixed title (what it IS) — the client's word goes in the box beside
     it. The keys are SMPRules.STRUCT_COMPONENTS and the label keys both. */
  var COMPONENTS = [["brief","Brief"], ["purpose","Purpose"], ["aspiration","Aspiration"],
                    ["keyobj","North Star"], ["theme","Themes"], ["pillar","Pillars"],
                    ["capability","Capabilities"], ["values","Values"], ["swot","SWOT"]];
  var TOP_NAMES = [["Group","Group"], ["Company","Company"], ["Holding","Holding"]];
  var MID_NAMES = [["Company","Companies"], ["Division","Divisions"], ["Sector","Sectors"]];
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
    /* §360.6: the console's two pieces (mountCreate, mountArchived) hold no
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
        format: f.format === "pillars" ? "pillars" : f.format === "objectives" ? "objectives" : "projects",
        company: f.company && COMPANIES[f.company] ? COMPANIES[f.company].name : "" });
    });
    ((GROUP && GROUP.capabilities) || []).forEach(function (c) {
      g.capabilities.push({ name: c.name,
        fn: c.fn && FUNCTIONS[c.fn] ? FUNCTIONS[c.fn].name : "",
        format: c.format === "pillars" ? "pillars" : "projects" });
    });
    (LABELS.entries || []).forEach(function (e) { g.words[e.key] = { one: e.group, many: e.bu }; });
    return g;
  }
  function holdsNow(){ return __smpHoldsNow(); }
  function isDone(){ return !!(typeof SMPRules !== "undefined" && SMPRules.setupDone(GROUP)); }

  /* ── WHAT THE RAIL'S STRIP SAYS (spec 057): which steps the data holds an
     answer for. Counted, never remembered — the data IS the progress
     (§129), so there is no second record of it to fall out of step. The
     client and its words always count (the client exists; a word left as
     it is keeps the platform's own); the office counts when a Forefront
     row is on the register (§339 writes the creator's). */
  function progress(){
    var ff = (PEOPLE || []).some(function (p) { return p && (p.forefront || (p.extra && p.extra.forefront)); });
    var tests = {
      client: true,
      structure: true,
      units:  (UNIT_KEYS || []).length > 0,
      cos:    (COMPANY_KEYS || []).length > 0 || !SMPRules.midExists(GROUP, COMPANIES),
      fns:    (FUNCTION_KEYS || []).length > 0 || !SMPRules.fnExists(GROUP),
      caps:   ((GROUP && GROUP.capabilities) || []).length > 0 || !SMPRules.capExists(GROUP),
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

  /* ── THE CLIENT'S RECORD, ASKED ONCE FOR WHOEVER IS DRAWING (§362.2) ──
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

  /* ── FOREFRONT TEAM, ON A PAGE OF ITS OWN (§362.2, spec 058 §3a) ───────
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
    /* A PLAIN BOX (§364). This said `wzstep`, which is the class the step
       CHIPS in the rail above the flow wear — a pill — so the whole page was
       drawn inside one (§65.9). Nothing wraps the table but the page. */
    var box = el("div");
    officeStep(box, "note");
    host.appendChild(box);
    /* THE HOVER IS MEASURED, NEVER WRITTEN (§88), and `clipTitles()` runs at
       the end of paint() — which on the FIRST visit is before the client's
       record has landed, because `ensureReg` fills this box again when it
       does. So the page asks for it after a late draw; the console has no
       such function and does not pass one. */
    if (OPTS.clip) OPTS.clip();
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

    /* §421: the Structure step on a client with a plan says what is still
       changeable, because the list steps' notice is not drawn here and a
       step that says nothing about being frozen reads as freely editable. */
    if (!canShape() && s.k === "structure") {
      var sb = el("div", "wzarched");
      sb.appendChild(document.createTextNode("This client has a plan in it, so its lists of " +
        w("unitword", "many", "business units") + " and " + w("fnword", "many", "supporting functions") +
        " are set. Every name and switch on this step can still be changed, and saves as you change it."));
      HOST.appendChild(sb);
    }

    /* §418: the Structure step lays three sections side by side, which a
       760px column cannot hold; that one step takes the page's width. */
    var col = el("div", "wzcol" + (s.k === "structure" ? " wzwide" : ""));
    col.appendChild(el("span", "lab", s.key));
    col.appendChild(el("h2", "wzq", s.q));
    var why = s.k === "units"
        ? "Add as many as this client has. Leave it empty and the platform opens blank — nothing is put here that nobody asked for."
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
    if (S.shape.units.some(function (u) { return !String(u.name || "").trim(); })) bad.push("a " + w("unitword", "one", "business unit"));
    if (S.shape.companies.some(function (c) { return !String(c.name || "").trim(); })) bad.push("a " + w("division", "one", "company"));
    if (S.shape.functions.some(function (f) { return !String(f.name || "").trim(); })) bad.push("a " + w("fnword", "one", "supporting function"));
    if (S.shape.capabilities.some(function (c) { return !String(c.name || "").trim(); })) bad.push("a " + w("capability", "one", "capability"));
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
      /* THE ROWS ARE PUT BACK AS WELL AS REFUSED (§360.3): a refusal that
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
  /* Done with set-up (spec 057): the shape written, then the mark. ONE key
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
    if (k === "structure") return structureStep(box);
    if (k === "units") return listStep(box, S.shape.units, "unit");
    if (k === "cos") return companiesStep(box);
    if (k === "caps") return capsStep(box);
    if (k === "fns") {
      /* §418: with the supporting-functions layer switched off on the
         Structure step there is nothing to name here; it says so and points
         back, as the second layer's step does (§61). Nothing is removed. */
      if (!SMPRules.fnExists(GROUP)) {
        box.appendChild(el("p", "wzwhy", "This client has no " + w("fnword", "many", "supporting functions").toLowerCase() +
          " layer. Change that on the Structure step."));
        return box;
      }
      return listStep(box, S.shape.functions, "fn");
    }
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
    wordCommit(i);
    if (onChange) i.addEventListener("change", function () { onChange(i.value); });
    w.appendChild(i);
    if (note) w.appendChild(el("p", "note", note));
    box.appendChild(w);
    return i;
  }

  /* The registry half, then the graph half: the mark on the door, the
     group's mark and the brand colours (Branding, absorbed here — spec 057),
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

    /* ── THE BRANDING, ABSORBED (spec 057): the group's mark and the two
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
      box.appendChild(el("p", "wzempty", kind === "unit" ? "No " + w("unitword", "many", "business units") + " yet." : "No " + w("fnword", "many", "supporting functions") + " yet."));
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
        /* §404.4: which division it belongs to, optional, on a unit and on a
           function alike (§391) — offered only where there are divisions to
           name. The same choice lives on Setup › Business units and
           Supporting functions, which read and write the same field. */
        var divs = divisionNames();
        if (divs.length) {
          var dt = el("span", "wzrt");
          dt.appendChild(el("span", "wzsub", "in"));
          var ds = el("select", "fld");
          ds.dataset.wzdiv = kind;
          ds.setAttribute("aria-label", "Which " + w("division", "one", "company") + " " + (row.name || "this row") + " belongs to");
          var none = el("option", null, "No " + w("division", "one", "company")); none.value = "";
          ds.appendChild(none);
          divs.forEach(function (d) {
            var o = el("option", null, d); o.value = d;
            if ((row.company || "") === d) o.selected = true;
            ds.appendChild(o);
          });
          if (!shape) ds.disabled = true;
          ds.addEventListener("change", function () { row.company = ds.value; S.shapeDirty = true; });
          dt.appendChild(ds);
          r.appendChild(dt);
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
            list.push(markFromChip(kind === "unit" ? { name:nm, company:"" } : { name:nm, format:fnDefault(), company:"" }, nm));
            addThenFocus();
          });
          crow.appendChild(cb);
        });
        box.appendChild(crow);
      }
      var add = el("button", "wzadd", kind === "unit" ? "+ Add a " + w("unitword", "one", "business unit") : "+ Add a " + w("fnword", "one", "supporting function"));
      add.type = "button";
      add.addEventListener("click", function () {
        list.push(kind === "unit" ? { name:"", company:"" } : { name:"", format:fnDefault(), company:"" });
        addThenFocus();
      });
      box.appendChild(add);
    }
    /* §404.4: said once, under the list — the step's own heading line said
       the functions' half again — and the units' line only where units DO
       carry pillars, or it describes a plan this client does not make. */
    var line = kind === "unit"
      ? (structNow().bu.on.indexOf("pillar") >= 0
          ? "A unit plans in pillars, with key measures and tactics under each. Its code is made from the name and prefixes every pillar on it."
          : "")
      : "A function's plan type decides what its pages hold, and it stays changeable until the function has a plan in it.";
    if (line) box.appendChild(el("p", "wzwhy", line));
    return box;
  }
  /* The divisions a row can be put in: the ones named on the Divisions step,
     and none at all where the Structure step says there is no second layer. */
  function divisionNames(){
    if (!SMPRules.midExists(GROUP, COMPANIES)) return [];
    return S.shape.companies.map(function (c) { return String(c.name || "").trim(); }).filter(Boolean);
  }
  /* Whether this client has capabilities (§404.4, §428): the step asks for
     them only where the Structure step's Capabilities card says so. */
  function capsCarried(){ return SMPRules.capExists(GROUP); }

  function companiesStep(box){
    /* §404.4: whether there IS a second layer is the Structure step's
       question, so it is not asked again here — where there is none this
       step says so and points back (§61, §45.2); where there is one, it names
       them, as the units are named, in the client's own word (§396). Which
       one a unit or a function belongs to is chosen on those two steps. */
    if (!SMPRules.midExists(GROUP, COMPANIES)) {
      box.appendChild(el("p", "wzwhy", "This client has no second layer — the " + w("unitword", "many", "business units") +
        " sit straight under the top level. Change that on the Structure step."));
      return box;
    }
    var shape = canShape();
    if (!S.shape.companies.length) {
      box.appendChild(el("p", "wzempty", "No " + w("division", "many", "companies") + " yet."));
    } else {
      var rows = el("div", "wzrows");
      S.shape.companies.forEach(function (co, n) {
        var r = el("div", "wzrow");
        var nm = el("input", "fld");
        nm.type = "text"; nm.value = co.name;
        nm.setAttribute("placeholder", "The " + w("division", "one", "company") + "'s name");
        if (!shape) nm.readOnly = true;
        nm.addEventListener("input", function () {
          /* a unit or function put in this one follows the rename */
          var was = co.name; co.name = nm.value;
          S.shape.units.concat(S.shape.functions).forEach(function (x) { if (was && x.company === was) x.company = nm.value; });
          S.shapeDirty = true;
        });
        r.appendChild(nm);
        if (shape) {
          var x = el("button", "wzx", "×");
          x.type = "button"; x.setAttribute("aria-label", "Remove " + co.name);
          x.addEventListener("click", function () {
            var gone = co.name;
            S.shape.companies.splice(n, 1);
            S.shape.units.concat(S.shape.functions).forEach(function (u) { if (u.company === gone) u.company = ""; });
            S.shapeDirty = true; redraw();
          });
          r.appendChild(x);
        }
        rows.appendChild(r);
      });
      box.appendChild(rows);
    }
    if (shape) {
      var add = el("button", "wzadd", "+ Add a " + w("division", "one", "company"));
      add.type = "button";
      add.addEventListener("click", function () { S.shape.companies.push({ name:"" }); addThenFocus(); });
      box.appendChild(add);
    }
    box.appendChild(el("p", "wzwhy", "A " + w("division", "one", "company") + " holds several " + w("unitword", "many", "business units") +
      ", and can hold " + w("fnword", "many", "supporting functions") + " too. Which one each belongs to is chosen as they are named, on the next steps."));
    return box;
  }

  /* A capability is a row you add, like the others (§347): a name, which
     function carries it, and how it is planned — Setup › Capabilities' own
     three questions. */
  function capsStep(box){
    /* §404.4: only where some level carries capabilities (the Structure
       step's ticks); otherwise one line says so and points back. */
    if (!capsCarried()) {
      box.appendChild(el("p", "wzwhy", "This client does not use " + w("capability", "many", "capabilities") +
        " — no level carries them. Tick them on the Structure step to add some."));
      return box;
    }
    var shape = canShape();
    if (!S.shape.capabilities.length) {
      box.appendChild(el("p", "wzempty", "No " + w("capability", "many", "capabilities") + " yet."));
    } else {
      var rows = el("div", "wzrows");
      S.shape.capabilities.forEach(function (cp, n) {
        var r = el("div", "wzrow");
        var nm = el("input", "fld");
        nm.type = "text"; nm.value = cp.name;
        nm.setAttribute("aria-label", W("capability", "one", "Capability") + " name");
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
      var add = el("button", "wzadd", "+ Add a " + w("capability", "one", "capability"));
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

  /* ── STRUCTURE (§404) ────────────────────────────────────────────
     Written straight into the live graph as `GROUP.structure`, one object,
     on the first change and not before: a client that never touches this
     step stores nothing, and every page reads everything as on (his
     "existing clients open with everything on, unchanged"). The first
     change MATERIALISES what the pages already show — every component on,
     the Temple on at the top — so nothing moves until somebody moves it.
     The level names and the component words are LABELS and travel with the
     shape like the words step's do, so they wait for Next like every other
     row here. The functions' plan type is only the default a new row is
     minted with; each function still picks its own on the next step. */
  function structNow(){
    var st = typeof SMPRules !== "undefined" && SMPRules.structureOf(GROUP);
    /* §418: a level also carries its sections, titles and names, so the
       write starts from a COPY of what is stored and never from nothing —
       or pressing one tick would throw every name on the step away. */
    var copy = function (k) { var l = st && st[k]; return l && typeof l === "object" ? JSON.parse(JSON.stringify(l)) : {}; };
    /* §423: an unsaid level reads the SHARED default, not "everything", or
       the first press anywhere on this step would switch the functions' S&W
       on as a side effect. */
    var lv = function (k) { return SMPRules.levelComponents(GROUP, k).slice(); };
    /* §418.1: AND EVERY OTHER KEY THE STRUCTURE HOLDS RIDES ACROSS TOO. A
       press here writes the whole object back, so a key this step does not
       draw -- another session's switches beside the levels -- would be
       dropped by the first tick. Start from the stored whole, then overwrite
       what this step owns, so there is no list of keys to keep (§104.7). */
    var out = st && typeof st === "object" ? JSON.parse(JSON.stringify(st)) : {};
    out.top = copy("top"); out.mid = copy("mid"); out.bu = copy("bu"); out.fn = copy("fn");
    out.over = (st && st.over) || {};
    out.top.on = lv("top"); out.top.temple = st && st.top ? st.top.temple === true : true;
    out.mid.exists = SMPRules.midExists(GROUP, COMPANIES); out.mid.on = lv("mid");
    out.mid.temple = !!(st && st.mid && st.mid.temple === true);
    out.bu.on = lv("bu"); out.fn.on = lv("fn");
    out.fn.exists = SMPRules.fnExists(GROUP);
    /* §428: THE CAPABILITIES CARD HOLDS THE FUNCTIONS' ANSWERS UNTIL IT IS
       SAVED. Unsaid, a capability reads the functions' level (effLevel), so
       the card is drawn from a copy of theirs; the copy is written only when
       something on THIS card changed (structWrite compares it with the
       baseline taken here), or a press on the functions' card would freeze
       the capabilities at the functions' old answers. */
    var capSaved = !!(st && st.cap && typeof st.cap === "object");
    out.cap = capSaved ? copy("cap") : JSON.parse(JSON.stringify(out.fn));
    delete out.cap.exists;
    out.cap.on = lv("cap");
    out.cap.exists = SMPRules.capExists(GROUP);
    CAP_BASE = capSaved ? null : JSON.stringify(out.cap);
    return out;
  }
  var CAP_BASE = null;
  function structWrite(next){
    if (CAP_BASE !== null && next.cap && JSON.stringify(next.cap) === CAP_BASE) delete next.cap;
    GROUP[SMPRules.STRUCTURE] = next;
    redraw();
  }
  /* §404.2: a new function row starts on pillars; the structure no longer
     holds a default (the Supporting functions step is where it is chosen). */
  function fnDefault(){ return "pillars"; }

  function wordOf(key){ var v = S.shape.words[key]; return v && typeof v === "object" ? v : { one: W(key, "one", ""), many: W(key, "many", "") }; }
  function setWord(key, form, val){
    /* §417: A WORD IS NOT THE SHAPE. Once a client holds a plan the shape is
       frozen (§346.5) and commitShape() refuses, which used to lock every
       name box on this step — Islam could not rename "Strategic Directions"
       on El Abd. Renaming moves nothing, and Setup › Terminology already
       writes these same entries on such a client, so here the word goes
       straight onto LABELS, the one store both screens read (§53.5). An
       emptied box keeps the word that was there, as the shape path does. */
    if (!canShape()) {
      var e = (LABELS.entries || []).filter(function (x) { return x.key === key; })[0];
      var v = String(val == null ? "" : val).trim();
      if (e && v) { if (form === "one") e.group = v; else e.bu = v; }
      /* §421: and the step's own copy follows, or the button just pressed
         stays unlit and the press reads as one that did nothing. Not marked
         dirty: nothing here waits for Next. */
      if (e && v) S.shape.words[key] = { one: e.group, many: e.bu };
      return;
    }
    var cur = wordOf(key); cur = { one: cur.one, many: cur.many };
    cur[form] = val; S.shape.words[key] = cur; S.shapeDirty = true;
  }
  /* The live write needs a paint to reach the autosave; on LEAVING the box,
     never per keystroke, or the repaint takes the caret (§35, Terminology's
     own rule). With the shape still open the step's Next commits as before. */
  function wordCommit(i){
    i.addEventListener("change", function () { if (!canShape()) redraw(); });
  }
  function segButtons(opts, cur, pick, ro){
    var band = el("div", "wzband");
    opts.forEach(function (o) {
      var b = el("button", null, o[1]); b.type = "button";
      b.setAttribute("aria-pressed", String(cur === o[0]));
      if (ro) b.disabled = true;
      b.addEventListener("click", function () { pick(o[0]); });
      band.appendChild(b);
    });
    return band;
  }
  function namePick(box, key, pairs, freeLabel, ro){
    var cur = wordOf(key);
    var known = pairs.filter(function (p) { return p[1] === cur.many; })[0];
    var opts = pairs.map(function (p) { return [p[1], p[1]]; }).concat([["__", "Another name…"]]);
    var st = S.stOther && S.stOther[key];
    var sel = known && !st ? known[1] : "__";
    /* §421: NOT read-only on a client with a plan. The top level's and the
       second layer's word is a word like any other, and §417 freed the
       others; these two were left greyed, with nothing saying why. `ro` is
       kept in the signature for the callers and deliberately unused. */
    box.appendChild(segButtons(opts, sel, function (v) {
      S.stOther = S.stOther || {};
      if (v === "__") { S.stOther[key] = true; redraw(); return; }
      S.stOther[key] = false;
      var p = pairs.filter(function (x) { return x[1] === v; })[0];
      setWord(key, "one", p[0]); setWord(key, "many", p[1]); redraw();
    }));
    if (sel === "__") {
      var row = el("div", "strow");
      [["one", "One"], ["many", "Many"]].forEach(function (f) {
        if (freeLabel === "one" && f[0] === "many") return;
        var i = el("input", "fld"); i.type = "text"; i.value = cur[f[0]] || "";
        i.setAttribute("aria-label", "The word for " + f[1].toLowerCase());
        i.setAttribute("data-stword", key + "|" + f[0]);
        wordCommit(i);
        i.addEventListener("input", function () {
          setWord(key, f[0], i.value);
          if (freeLabel === "one") setWord(key, "many", i.value);
        });
        var w2 = el("label", "stnm"); w2.appendChild(el("span", "lab", freeLabel === "one" ? "Called" : f[1]));
        w2.appendChild(i); row.appendChild(w2);
      });
      box.appendChild(row);
    }
  }
  /* A level's own name, both forms (§404.4): what the Words step asked for
     the business units and the functions, asked on the card it names. */
  function callBoxes(box, key, ro){
    box.appendChild(el("p", "lab", "Called"));
    var cur = wordOf(key);
    var row = el("div", "strow");
    [["one", "One"], ["many", "Many"]].forEach(function (f) {
      var i = el("input", "fld"); i.type = "text"; i.value = cur[f[0]] || "";
      i.setAttribute("aria-label", "The word for " + f[1].toLowerCase());
      i.setAttribute("data-stword", key + "|" + f[0]);
      wordCommit(i);
      i.addEventListener("input", function () { setWord(key, f[0], i.value); });
      var w2 = el("label", "stnm"); w2.appendChild(el("span", "lab", f[1]));
      w2.appendChild(i); row.appendChild(w2);
    });
    box.appendChild(row);
  }
  /* ── THE THREE SECTIONS OF A LAYER (§418) ─────────────────────────
     Islam's own shape, signed off from the mockup: each layer shows the
     three sections its pages already have — the first section, the SWOT and
     the plan — and for each one whether it is there, what it is called,
     which parts it holds and what each part is called, set per layer.
     Everything here is a LIVE write (structWrite), like the ticks before it:
     a name is kept on leaving its box, never per keystroke, or the repaint
     takes the caret (§35). An emptied name box means "the client's own word"
     (Terminology), which is what a layer said before this. */
  function lvWord(k, key, form){
    var st = SMPRules.structureOf(GROUP), w2 = st && st[k] && st[k].words && st[k].words[key];
    return w2 && typeof w2[form] === "string" ? w2[form] : "";
  }
  function fallbackWord(key, form){
    return typeof labelWord === "function" ? labelWord(key, form === "one" ? "group" : "bu") : key;
  }
  function nameBox(k, key, form, aria){
    var i = el("input", "fld"); i.type = "text"; i.value = lvWord(k, key, form);
    i.setAttribute("placeholder", fallbackWord(key, form));
    i.setAttribute("aria-label", aria);
    i.setAttribute("data-stlw", k + "|" + key + "|" + form);
    i.addEventListener("change", function () {
      var nx = structNow(), l = nx[k];
      l.words = l.words || {};
      var cur = l.words[key] || {};
      var v = i.value.trim();
      if (v) cur[form] = v; else delete cur[form];
      if (Object.keys(cur).length) l.words[key] = cur; else delete l.words[key];
      if (!Object.keys(l.words).length) delete l.words;
      structWrite(nx);
    });
    return i;
  }
  function titleBox(k, part, way, dflt, aria){
    var st = SMPRules.structureOf(GROUP), l = st && st[k];
    var b = l && l[part];
    var cur = part === "plan" ? (b && b[way]) : (b && b.title);
    var i = el("input", "fld sttitle"); i.type = "text"; i.value = typeof cur === "string" ? cur : "";
    i.setAttribute("placeholder", dflt);
    i.setAttribute("aria-label", aria);
    i.setAttribute("data-sttitle", k + "|" + part + (way ? "|" + way : ""));
    i.addEventListener("change", function () {
      var nx = structNow(), lv2 = nx[k], v = i.value.trim();
      var blk = lv2[part] = lv2[part] || {};
      if (part === "plan") { if (v) blk[way] = v; else delete blk[way]; }
      else { if (v) blk.title = v; else delete blk.title; }
      if (!Object.keys(blk).length) delete lv2[part];
      structWrite(nx);
    });
    return i;
  }
  function onOff(cur, pick, key){
    var b = segButtons([[true, "On"], [false, "Off"]], cur, pick);
    b.classList.add("stonoff"); if (key) b.setAttribute("data-stsec", key);
    return b;
  }
  /* §427: a part with no page on this layer is drawn off, greyed and
     unpressable — `disabled`, never merely dimmed (§220) — with the reason
     on the hover (1b-ii). One helper, so the tick, the switch and the Temple
     say it the same way. */
  var NOT_BUILT = "Not available on this layer yet — nothing on its pages would show it.";
  function dummy(n){
    n.classList.add("dummy");
    (n.tagName === "BUTTON" || n.tagName === "INPUT" ? [n] : [].slice.call(n.querySelectorAll("button, input")))
      .forEach(function (b) { b.disabled = true; });
    n.title = NOT_BUILT;
    return n;
  }
  function tickBtn(on, label, key, press){
    var t = el("button", "sttick" + (on ? " on" : "")); t.type = "button";
    t.setAttribute("aria-pressed", String(on));
    t.setAttribute("aria-label", label);
    if (key) t.setAttribute("data-stcomp", key);
    t.addEventListener("click", press);
    return t;
  }
  function partHead(){
    var h = el("div", "stparth");
    h.appendChild(el("span")); h.appendChild(el("span", "lab", "One")); h.appendChild(el("span", "lab", "Many"));
    return h;
  }
  function compToggle(k, c){
    var nx = structNow(), l = nx[k], i = l.on.indexOf(c);
    if (i >= 0) l.on.splice(i, 1); else l.on.push(c);
    l.on.sort(function (a, b2) {
      var ix = function (x) { for (var j = 0; j < COMPONENTS.length; j++) if (COMPONENTS[j][0] === x) return j; return 99; };
      return ix(a) - ix(b2);
    });
    structWrite(nx);
  }
  var PART_LABEL = { brief:"Brief", purpose:"Purpose", aspiration:"Aspiration", keyobj:"North Star",
    theme:"Themes", values:"Values", pillar:"Pillar", measure:"Key measure", tactic:"Tactic",
    project:"Project", deliverable:"Deliverable", outcome:"Outcome", milestone:"Milestone", action:"Action" };
  var WAY_LABEL = { pillars:"pillars", projects:"projects", objectives:"objectives and actions" };
  function structLevel(box, lv, k){
    var L = lv[k], tgt = { top:"group", mid:"co:", bu:"u:", fn:"fn:", cap:"cap:" }[k];
    var secs = el("div", "stsecs");

    /* 1 — the first section: on/off, its title, its parts. */
    var s1 = el("section", "stsec");
    var h1 = el("div", "stsech"); h1.appendChild(el("span", "stkind", "First section"));
    var fOn = SMPRules.foundOn(GROUP, tgt);
    h1.appendChild(onOff(fOn, function (v) {
      var nx = structNow(), l = nx[k]; l.found = l.found || {};
      if (v) delete l.found.on; else l.found.on = false;
      if (!Object.keys(l.found).length) delete l.found;
      structWrite(nx);
    }, k + "|found"));
    s1.appendChild(h1);
    if (!fOn) s1.appendChild(el("p", "sthid", "Not shown on this layer. Nothing entered is lost."));
    else {
      s1.appendChild(el("p", "lab", "Section title"));
      s1.appendChild(titleBox(k, "found", null, SMPRules.foundTitle({}, tgt), "The first section's title"));
      s1.appendChild(el("p", "lab", "Parts"));
      s1.appendChild(partHead());
      SMPRules.SEC_FOUND_PARTS.forEach(function (c) {
        if ((k === "fn" || k === "cap") && !SMPRules.compOffered("fn:", c)) return;
        var built = SMPRules.compBuilt(tgt, c), on = built && L.on.indexOf(c) >= 0;
        var r = el("div", "stpart" + (on ? "" : " off"));
        r.appendChild(tickBtn(on, "Show " + PART_LABEL[c], k + "|" + c, function () { compToggle(k, c); }));
        r.appendChild(nameBox(k, c, "one", PART_LABEL[c] + ", one"));
        r.appendChild(nameBox(k, c, "many", PART_LABEL[c] + ", many"));
        if (!built) dummy(r);
        s1.appendChild(r);
      });
    }
    secs.appendChild(s1);

    /* 2 — the SWOT: its on/off IS the `swot` component (§404), never a
       second switch for one fact. */
    var s2 = el("section", "stsec");
    var h2 = el("div", "stsech"); h2.appendChild(el("span", "stkind", "Second section"));
    var sBuilt = SMPRules.compBuilt(tgt, "swot"), sOn = sBuilt && L.on.indexOf("swot") >= 0;
    var sSw = onOff(sOn, function (v) { if (v !== sOn) compToggle(k, "swot"); }, k + "|swot");
    if (!sBuilt) dummy(sSw);
    h2.appendChild(sSw);
    s2.appendChild(h2);
    if (!sBuilt) s2.appendChild(el("p", "sthid", "Not available on this layer yet."));
    else if (!sOn) s2.appendChild(el("p", "sthid", "Not shown on this layer. Nothing entered is lost."));
    else {
      s2.appendChild(el("p", "lab", "Section title"));
      s2.appendChild(titleBox(k, "swot", null, (k === "fn" || k === "cap") ? "S&W" : fallbackWord("swot", "many"), "The second section's title"));
      s2.appendChild(el("p", "lab", "Boxes"));
      var qs = SMPRules.swotQuads(GROUP, tgt);
      SMPRules.SWOT_QUADS.forEach(function (q) {
        var on = qs.indexOf(q) >= 0, key = SMPRules.QUAD_KEYS[q];
        var r = el("div", "stpart stquad" + (on ? "" : " off"));
        r.appendChild(tickBtn(on, "Show " + SMPRules.PART_DEFAULTS[key][1], k + "|" + q, function () {
          var nx = structNow(), l = nx[k]; l.swot = l.swot || {};
          var cur = SMPRules.swotQuads(GROUP, tgt).slice(), i = cur.indexOf(q);
          if (i >= 0) { if (cur.length === 1) return; cur.splice(i, 1); } else cur.push(q);
          l.swot.quads = SMPRules.SWOT_QUADS.filter(function (x) { return cur.indexOf(x) >= 0; });
          structWrite(nx);
        }));
        r.appendChild(nameBox(k, key, "many", SMPRules.PART_DEFAULTS[key][1]));
        s2.appendChild(r);
      });
    }
    secs.appendChild(s2);

    /* 3 — the plan: always on. A unit or function picks how it plans on its
       own row, so these two layers name all three ways and each shows the
       names of the way it uses; the top and the second layer plan in
       pillars only. */
    var s3 = el("section", "stsec");
    var h3 = el("div", "stsech"); h3.appendChild(el("span", "stkind", "Plan section"));
    /* §422: the plan section switches like the first one. */
    /* §427: a company has no plan page, so its plan section is drawn off
       and greyed rather than offering names nothing reads. */
    var pBuilt = k !== "mid", pOn = pBuilt && SMPRules.planOn(GROUP, tgt);
    var pSw = onOff(pOn, function (v) {
      var nx = structNow(), l = nx[k]; l.plan = l.plan || {};
      if (v) delete l.plan.on; else l.plan.on = false;
      if (!Object.keys(l.plan).length) delete l.plan;
      structWrite(nx);
    }, k + "|plan");
    if (!pBuilt) dummy(pSw);
    h3.appendChild(pSw);
    s3.appendChild(h3);
    if (!pOn) {
      s3.appendChild(el("p", "sthid", !pBuilt ? "Not available on this layer yet." : (k === "bu" || k === "fn" || k === "cap")
        ? "Not shown on this layer, nothing to report and not in the scores. Nothing entered is lost."
        : "Not shown on this layer. Nothing entered is lost."));
      secs.appendChild(s3); box.appendChild(secs);
      structTail(box, L, k);
      return;
    }
    /* §428: a capability plans in pillars or in projects (capFormat), so its
       card names those two ways only. */
    var ways = (k === "bu" || k === "fn") ? SMPRules.PLAN_WAYS : k === "cap" ? ["pillars", "projects"] : ["pillars"];
    if (ways.length > 1) s3.appendChild(el("p", "wzwhy", "Each one picks how it plans on its own row. Name " +
      (ways.length === 2 ? "both" : "all three") + " ways here."));
    ways.forEach(function (way) {
      var wb = el("div", "stway"); wb.setAttribute("data-stway", k + "|" + way);
      if (ways.length > 1) wb.appendChild(el("span", "stkind", "If planned in " + WAY_LABEL[way]));
      wb.appendChild(el("p", "lab", "Section title"));
      var dflt = way === "projects" && (k === "fn" || k === "cap") ? fallbackWord("project", "many") : "Plan";
      wb.appendChild(titleBox(k, "plan", way, dflt, "The plan section's title, " + WAY_LABEL[way]));
      wb.appendChild(partHead());
      SMPRules.PLAN_PARTS[way].forEach(function (c) {
        var r = el("div", "stpart");
        r.appendChild(el("span"));
        var a = nameBox(k, c, "one", PART_LABEL[c] + ", one"), b = nameBox(k, c, "many", PART_LABEL[c] + ", many");
        if (c === "keyobj") { a.title = b.title = "The same name as the North Star above: in this way of planning they are one list."; }
        r.appendChild(a); r.appendChild(b); wb.appendChild(r);
      });
      if (way === "pillars") detailRows(wb, k, tgt);
      s3.appendChild(wb);
    });
    secs.appendChild(s3);
    box.appendChild(secs);
    structTail(box, L, k);
  }
  function structTail(box, L, k){
    /* §428: the "Carries capabilities" tick is gone from every layer — the
       Capabilities card answers whether this client has them. */
    if (k === "top" || k === "mid") {
      var need = SMPRules.TEMPLE_NEEDS.filter(function (c) { return L.on.indexOf(c) < 0; });
      var tp = el("div", "sttemple");
      var sw = el("button", null, L.temple && !need.length ? "Temple view: on" : "Temple view: off");
      sw.type = "button"; sw.dataset.sttemple = k;
      sw.setAttribute("aria-pressed", String(!!(L.temple && !need.length)));
      if (need.length) sw.disabled = true;
      sw.addEventListener("click", function () { var nx = structNow(); nx[k].temple = !nx[k].temple; structWrite(nx); });
      var band2 = el("div", "wzband"); band2.appendChild(sw); tp.appendChild(band2);
      /* §427: a company has no Temple tab, whatever is ticked. */
      if (k === "mid") {
        sw.textContent = "Temple view: off"; sw.setAttribute("aria-pressed", "false"); dummy(band2);
        tp.appendChild(el("span", "wzwhy", "Not available on this layer yet."));
        box.appendChild(tp); return;
      }
      tp.appendChild(el("span", "wzwhy", need.length
        ? "Needs " + need.map(function (c) { return PART_LABEL[c] || c; }).join(", ") + " ticked."
        : "Draws the picture from the aspiration (roof), the North Star and the themes (columns)" +
          (SMPRules.capExists(GROUP) ? ", and the capabilities (base)." : ".")));
      box.appendChild(tp);
    }
  }
  /* §420: A LAYER'S OWN EXTRA DETAILS (Islam, 2026-09-29: *"every layer or
     area like units and functions should have their separate options and
     switches"*). The four RHI details (§413–§416) sit in the plan section of
     the way they belong to — pillars — each with its own tick for THIS
     layer, and the three that add a part carry its one/many names like every
     other part. The tick stores a real true or false on the layer, so a
     layer set on its own stops following the client-wide answer (§413's
     `structure.details`, the fallback). Off HIDES and keeps (§44); an off
     row draws no name boxes, because nothing on this layer would read them. */
  /* §422: split in two (Islam, 2026-09-29: *"extra details general and extra
     details for the tactics … show me the areas under the overview and show
     me the years"*). The overview's three areas each take a name box, one
     name each (his *"name boxes"*); the years are shown, never named (his
     *"shown only"*). */
  var DETAIL_GROUPS = [
    ["Extra details \u00b7 general", [["overview", "Overview"], ["years", "Years"]]],
    ["Extra details \u00b7 tactics", [["outcomes", "Several outcomes"], ["requirements", "Requirements"]]]
  ];
  var AREA_LABEL = { ovobj: "Objective", ovwhy: "Why now", ovrisk: "Risks" };
  function detailRows(wb, k, tgt){
    var layer = { top: "the top level", mid: "the second layer",
                  bu: W("unitword", "many", "Business units").toLowerCase(),
                  fn: W("fnword", "many", "Supporting functions").toLowerCase(),
                  cap: W("capability", "many", "Capabilities").toLowerCase() }[k];
    DETAIL_GROUPS.forEach(function (g) {
      var grp = el("div", "stdetg"); grp.setAttribute("data-stdetg", k + "|" + (g[1][0][0] === "overview" ? "general" : "tactics"));
      grp.appendChild(el("p", "lab", g[0]));
      g[1].forEach(function (d) {
        var on = SMPRules.planDetailOn(GROUP, d[0], tgt), nk = SMPRules.DETAIL_NAMES[d[0]];
        var r = el("div", "stpart stdet" + (on ? "" : " off"));
        r.setAttribute("data-stdetrow", k + "|" + d[0]);
        var t = tickBtn(on, d[1] + " for " + layer, null, function () {
          var nx = structNow(), l = nx[k];
          l.details = Object.assign({}, l.details || {});
          l.details[d[0]] = !on;
          structWrite(nx);
        });
        t.setAttribute("data-stdetail", k + "|" + d[0]);
        r.appendChild(t);
        r.appendChild(el("span", "stdetn", d[1]));
        if (on && nk) {
          r.appendChild(nameBox(k, nk, "one", d[1] + ", one"));
          r.appendChild(nameBox(k, nk, "many", d[1] + ", many"));
        } else if (on && d[0] === "years") {
          var ys = el("span", "styears"); ys.setAttribute("data-styears", k);
          [1, 2, 3].forEach(function (n) { ys.appendChild(el("span", "styr", "Year " + n)); });
          r.appendChild(ys);
        } else r.appendChild(el("span", "stdetw", "Off for " + layer));
        grp.appendChild(r);
        if (on && d[0] === "overview") SMPRules.OVERVIEW_AREAS.forEach(function (a) {
          var sr = el("div", "stpart stdet stsub"); sr.setAttribute("data-stdetrow", k + "|" + a[1]);
          sr.appendChild(el("span"));
          sr.appendChild(el("span", "stdetn", AREA_LABEL[a[1]]));
          sr.appendChild(nameBox(k, a[1], "one", AREA_LABEL[a[1]] + ", name"));
          sr.appendChild(el("span"));
          grp.appendChild(sr);
        });
      });
      wb.appendChild(grp);
    });
  }
  function structureStep(box){
    var ro = !canShape();
    var lv = structNow();
    var card = function (tag) { var c = el("section", "stcard"); c.appendChild(el("span", "tag", tag)); box.appendChild(c); return c; };

    var top = card("Top level");
    top.appendChild(el("p", "lab", "Called"));
    namePick(top, "topword", TOP_NAMES, "one", ro);
    structLevel(top, lv, "top");

    /* §418: a layer the client does not have is switched off as a whole —
       the second layer as before, the supporting functions now too. */
    var mid = card("Second layer");
    var mh = el("div", "stsech"); mh.appendChild(el("span", "lab", "This client has one"));
    mh.appendChild(onOff(lv.mid.exists, function (v) { var nx = structNow(); nx.mid.exists = v; structWrite(nx); }, "mid|layer"));
    mid.appendChild(mh);
    if (lv.mid.exists) {
      mid.appendChild(el("p", "lab", "Called"));
      namePick(mid, "division", MID_NAMES, "both", ro);
      structLevel(mid, lv, "mid");
    } else mid.appendChild(el("p", "sthid", "Not asked about in set-up and not shown in the navigation. Nothing entered is lost."));

    var bu = card(W("unitword", "many", "Business units"));
    callBoxes(bu, "unitword", ro);
    structLevel(bu, lv, "bu");

    var fn = card(W("fnword", "many", "Supporting functions"));
    var fh = el("div", "stsech"); fh.appendChild(el("span", "lab", "This client has them"));
    fh.appendChild(onOff(lv.fn.exists, function (v) {
      var nx = structNow(); if (v) delete nx.fn.exists; else nx.fn.exists = false; structWrite(nx);
    }, "fn|layer"));
    fn.appendChild(fh);
    if (lv.fn.exists) {
      callBoxes(fn, "fnword", ro);
      structLevel(fn, lv, "fn");
    } else fn.appendChild(el("p", "sthid", "Not asked about in set-up and not shown in the navigation. Nothing entered is lost."));

    /* §428: CAPABILITIES ARE A CARD OF THEIR OWN, after the functions, with
       the same three sections. Its On/Off is whether this client has them at
       all — the question the three "Carries capabilities" ticks used to
       answer layer by layer. */
    var cp = card(W("capability", "many", "Capabilities"));
    cp.setAttribute("data-stcard", "cap");
    var ch = el("div", "stsech"); ch.appendChild(el("span", "lab", "This client has them"));
    ch.appendChild(onOff(lv.cap.exists, function (v) {
      var nx = structNow(); nx.cap.exists = v; structWrite(nx);
    }, "cap|layer"));
    cp.appendChild(ch);
    if (lv.cap.exists) {
      callBoxes(cp, "capability", ro);
      structLevel(cp, lv, "cap");
    } else cp.appendChild(el("p", "sthid", "Not asked about in set-up and not shown in the navigation. Nothing entered is lost."));


    box.appendChild(el("p", "wzwhy",
      "These apply to every item at a layer; each one can be adjusted later on Setup › Structure. " +
      "Switching something off hides it and keeps what was written. An empty name box uses the client's own word from Terminology."));
    return box;
  }

  /* ── THE OFFICE, AS A SETUP TABLE (§364) ────────────────────────────
     Islam, of the page §362.2 shipped: *"forefront team is damaged it needs
     to be a table looks like the people register wiht the required
     columns."* MEASURED BEFORE ANYTHING WAS DRAWN, and the cause was one
     class: `mountTeam` wrapped the rows in `.wzstep`, which is what the
     flow's STEP CHIPS wear — a pill — so a control's own shape reached a
     whole page and drew the oval he photographed (§65.9: a class name is
     one global namespace). Under it the rows were `.teamrow`, written for
     the flow's 760px column, so on a full-width Setup page they laid out
     SIDE BY SIDE and wanted 2471px in a 1323px box: the third consultant
     cut in half.

     IT IS THE SETUP TABLES' OWN SHAPE, NEVER A SECOND ONE (§53.5):
     `.cfg > table.unitcfg`, which Companies, the BU list and Functions
     already wear, so the navy heading row, one line per cell, the cap with
     the value on a hover (§88) and the ellipsis all come from the
     family rather than from rules invented here. The add row goes under
     the table and the note under that, which is that family's order too.

     ONE RENDERER FOR BOTH HOSTS, which is why the table is drawn here and
     not in `mountTeam`: the flow's step and the Setup page are two readers
     of this one function (§9's pattern), and people join and leave an
     account team all through an engagement — a renderer copied for the
     page is the drift §53.5 keeps recording. The flow's column caps at
     760px and the register column is absent there on a client the platform
     built, so it draws four columns where the page draws five.

     THE REGISTER COLUMN IS DRAWN ONLY WHERE IT CAN BE ANSWERED (§61): on a
     client whose register came across, the match is by address and has to
     be confirmed (§313.32); on one the platform built, the seat IS the
     register row and there is nothing to pick. The header follows the
     cells, or a table says it holds a fact it never draws. */
  function officeStep(box, noteClass){
    var reg = S.reg;
    if (!reg) {
      box.appendChild(el("p", "wzempty", OPTS.live && !S.regErr ? "Reading the team…" : "The office team is kept by the served platform."));
      return box;
    }
    var ed = !!reg.canEdit;
    var asks = !reg.client.made_here && (reg.register || []).length > 0;
    var cfg = el("div", "cfg");
    var t = el("table", "unitcfg teamcfg");
    var th = el("thead"), hr = el("tr");
    var heads = [["Name", "tmname"], ["Email", "tmmail"], ["Seat on this client", "cc tmseat"]];
    if (asks) heads.push(["On this register as", "cc tmas"]);
    if (ed) heads.push(["", "cc tmrm"]);
    heads.forEach(function (h) {
      var c = el("th", h[1] || null, h[0]);
      if (!h[0]) c.setAttribute("aria-label", "Remove");
      hr.appendChild(c);
    });
    th.appendChild(hr); t.appendChild(th);
    var tb = el("tbody");
    (reg.team || []).forEach(function (m) {
      var tr = el("tr");
      var nm = el("td", "tmname");
      nm.appendChild(el("b", null, m.name || m.email));
      tr.appendChild(nm);
      tr.appendChild(el("td", "tmmail", m.email));
      /* A CELL THAT HOLDS A CONTROL CARRIES NO HOVER, AND WHAT MAKES THAT
         TRUE IS THE WIDTH (§364.4). `clipTitles()` writes a measured title
         on a cell that overflowed, and these do not: the select fills its
         own cell and the two seat buttons set their column's floor, so
         there is nothing to measure. A `data-keep-title` mark was added
         first and its own falsification proved it a no-op (§298.2), so it
         is gone (§24) — but the rule is the reason the widths are what they
         are, because the fallback for a cell with no value inside it is the
         cell's own text, which for a `<select>` is every option it holds. */
      var seat = el("td", "cc tmseat");
      seat.appendChild(seatCell(m, reg.seats || [], ed));
      tr.appendChild(seat);
      if (asks) {
        var as = el("td", "cc tmas");
        if (ed) as.appendChild(registerCell(m, reg.register));
        else as.appendChild(el("span", "muted", nameOnRegister(m, reg.register)));
        tr.appendChild(as);
      }
      if (ed) {
        var rmc = el("td", "cc tmrm");
        var rm = el("button", "linkbu", "Remove");
        rm.type = "button";
        rm.addEventListener("click", function () {
          post({ action:"setTeam", key:S.key, email:m.email, on:false })
            .then(function (r) { r.ok ? refreshTeam() : say(r.error || "Not removed.", true); });
        });
        rmc.appendChild(rm);
        tr.appendChild(rmc);
      }
      tb.appendChild(tr);
    });
    if (!(reg.team || []).length) {
      var none = el("tr");
      var nc = el("td", "muted", "Nobody from Forefront is on this client yet.");
      nc.colSpan = heads.length;
      none.appendChild(nc); tb.appendChild(none);
    }
    t.appendChild(tb); cfg.appendChild(t);
    box.appendChild(cfg);
    if (ed) {
      /* THE ADD ROW IS UNDER THE TABLE, not a dialog: it is two answers,
         not the register's nine (Islam, on the mockup). The second answer
         is drawn only where the first table column is. */
      var row = el("div", "row tmadd");
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
      if (asks) row.appendChild(asWho);
      row.appendChild(add);
      box.appendChild(row);
    }
    /* ONE SENTENCE, TWO DRESSES (§364). The words are written once; the
       HOST says how they are dressed, because the two are different rooms:
       on the Setup page it is the family's own `.note` — the bordered block
       Companies and the BU list both end with, which Islam signed off as
       "the family's own treatment" — and inside the flow it is `.wzwhy`, the
       quiet line every other step ends with. A class threaded through this
       function would be a flag (§104.7); the caller dressing its own note is
       not. */
    box.appendChild(el("p", noteClass || "wzwhy", TEAM_NOTE));
    return box;
  }
  var TEAM_NOTE =
    "These are Forefront's people, not the client's. A seat is held on THIS client: " +
    "Super user holds its access matrix, retiring people and issuing passwords; SMO team runs " +
    "cycles and corrects plans. The client's own register — its heads, custodians and their " +
    "passwords — is built on the People register beside this page.";
  /* Which row on the client's register this consultant is, in words, for
     somebody who may read the page and not edit it. Absent is said (§35),
     never left as an empty cell that reads as a control that failed. */
  function nameOnRegister(member, register){
    var hit = (register || []).filter(function (r) { return r.key === member.person_key; })[0];
    return hit ? hit.name : "a row of their own";
  }
  /* The team controls write at once, so the flow re-reads rather than
     guessing what the server now holds. A seat is also a register row
     (§339, state-api officeRow), so the page is repainted afterwards. */
  function refreshTeam(){
    S.reg = null; S.regErr = null;
    redraw();
  }
  /* §364: the key inside the cell is GONE — the column heading is the
     control's name now, and a label under a heading that already says the
     word says it twice on one row (§87, §267.2). The class stays, because it
     is what sizes the select; `aria-label` carries the name for anybody not
     reading the heading. */
  function registerCell(member, register) {
    var wrap = el("span", "asrow");
    var sel = el("select", "fld");
    sel.setAttribute("aria-label", "On this register as");
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
             here on is written where it lives (spec 057). */
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
        if (g.units != null) shape.push(nOf(g.units, w("unitword", "one", "business unit"), w("unitword", "many", "business units")));
        if (g.functions != null) shape.push(nOf(g.functions, w("fnword", "one", "supporting function"), w("fnword", "many", "supporting functions")));
        if (shape.length) lines.push(shape.join(" · "));
        if (g.people != null) lines.push(nOf(g.people, "person", "people") + " on the register");
        var rest = [];
        if (g.plans != null) rest.push(nOf(g.plans, "line") + " of plan");
        if (g.capabilities != null && g.capabilities) rest.push(nOf(g.capabilities, w("capability", "one", "capability"), w("capability", "many", "capabilities")));
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
