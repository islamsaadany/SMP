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
  /* On the console's create piece there is no graph at all — a client not
     made yet holds nothing — and `GROUP && …` throws on an undeclared name
     rather than reading false (§467). */
  if (typeof GROUP === "undefined") return { plans: 0, capabilities: 0, units: 0, functions: 0 };
  ((GROUP && GROUP.capabilities) || []).forEach(function (c) {
    var n = ((c.keyObjectives || []).length) + ((c.projects || []).length) +
            ((c.items || []).length);
    if (n) caps++;
  });
  (UNIT_KEYS || []).concat((FUNCTION_KEYS || []).map(function (k) { return "fn:" + k; }))
    .forEach(function (t) {
      var tr = boxRef(t), u = tr.kind === "fn" ? FUNCTIONS[tr.key] : UNITS[t];
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
    /* §544: which kind's layer this division sits on, written only when
       the answer SAYS one — after the carry, or a division made on the
       shape screen would take back the kind it was created under. An empty
       answer deletes the key rather than writing one, so a division that
       holds boxes goes on being read from use (§50.6). */
    if (Object.prototype.hasOwnProperty.call(c, "layer")) {
      if (c.layer === "bu" || c.layer === "fn") COMPANIES[k].layer = c.layer;
      else delete COMPANIES[k].layer;
    }
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
    /* §438: how the unit plans, stored as an ABSENCE for pillars (§50.6).
       Applied after the carry below as well, or an old unit's stored way
       would win over the one just picked. */
    var uf = (u && u.format) === "projects" ? "projects" : (u && u.format) === "objectives" ? "objectives" : null;
    var setUf = function (kk) {
      if (!u || !u.format) return;
      if (uf) UNITS[kk].format = uf; else delete UNITS[kk].format;
    };
    setUf(k);
    var was = unitByName[nm.toLowerCase()];
    if (was && claimedU[was]) was = null;
    if (!was && wasUnits[k] && !claimedU[k]) was = k;
    if (!was) return;
    claimedU[was] = true;
    rekeyUnit(k, was, nm); k = was;
    UNITS[k] = __smpCarry(wasUnits[k], UNITS[k], ["name", "company", "ukey"]);
    setUf(k);
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
  (a.capabilities || []).forEach(function (cp) {
    var nm = String((cp && cp.name) || "").trim();
    if (!nm) return;
    var made = addCapability();
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
     Three since §544 — the client, the shape, the office (seven until the
     shape screen took in the five between them; §544.16 found this line
     still saying so). There is no Summary step any more:
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
  /* §544, spec 066 §6 — THREE STEPS: THE CLIENT, THE SHAPE, THE OFFICE.
     Structure, the divisions, the units, the functions and the capabilities
     were five screens holding one answer each about the same tree, and the
     tree was on none of them. They are one screen now (shapeStep), and every
     answer they held is still asked, in the same words, on the level or the
     box it is about. Nothing was dropped: the capabilities step's answers
     live on the top level's own card, where §428 already drew them, and on
     Setup › Capabilities, which is unchanged. */
  var STEPS = [
    { k:"client", key:"The client",       label:"The client",     q:"Which client is this?" },
    { k:"shape",  key:"The organisation", label:"The shape",
      q:"How is this client built?" },
    /* §404.4: no Words step. Every word it asked for is asked on the
       shape screen now, beside the level or component it names. */
    { k:"office", key:"People",           label:"The office",     q:"Who runs the strategy office?" }
  ];
  var SHAPE_STEPS = ["shape"];
  /* §404: the components a level may carry, in the mockup's order, each with
     its fixed title (what it IS) — the client's word goes in the box beside
     it. The keys are SMPRules.STRUCT_COMPONENTS and the label keys both. */
  var COMPONENTS = [["brief","Brief"], ["desc","Description"], ["purpose","Purpose"], ["aspiration","Aspiration"],
                    ["keyobj","North Star"], ["theme","Themes"], ["pillar","Pillars"],
                    ["capability","Capabilities"], ["values","Values"], ["swot","SWOT"]];
  var TOP_NAMES = [["Group","Group"], ["Company","Company"], ["Holding","Holding"]];
  var MID_NAMES = [["Company","Companies"], ["Division","Divisions"], ["Sector","Sectors"]];
  var SHAPE_TIP = "These apply to every item at a layer. Where one item needs to differ, add it under Except for on " +
    "that layer's card. Switching something off hides it and keeps what was written. An empty name box uses the word shown in grey.";
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
  /* The three ways a function plans (§342). */
  var FORMATS = [["pillars","Pillars"], ["projects","Projects"], ["objectives","Objectives & actions"]];
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
    /* §544: and which kind's layer it is drawn on, where the office has
       said. Unsaid it is read from use, so this carries "" for every
       division a client already holds and nothing is written by looking. */
    (COMPANY_KEYS || []).forEach(function (k) {
      var c = COMPANIES[k];
      g.companies.push({ name: c.name, layer: c.layer === "bu" || c.layer === "fn" ? c.layer : "" });
    });
    (UNIT_KEYS || []).forEach(function (k) {
      var u = UNITS[k];
      g.units.push({ key: k, name: u.name,
        format: u.format === "projects" ? "projects" : u.format === "objectives" ? "objectives" : "pillars",
        company: u.company && COMPANIES[u.company] ? COMPANIES[u.company].name : "" });
    });
    (FUNCTION_KEYS || []).forEach(function (k) {
      var f = FUNCTIONS[k];
      g.functions.push({ key: k, name: f.name,
        format: f.format === "pillars" ? "pillars" : f.format === "objectives" ? "objectives" : "projects",
        company: f.company && COMPANIES[f.company] ? COMPANIES[f.company].name : "" });
    });
    ((GROUP && GROUP.capabilities) || []).forEach(function (c) {
      g.capabilities.push({ id: c.id, name: c.name,
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
    /* §544: the shape counts once the client holds a box of its own — a
       unit where the units plan, a function where they are what there is.
       Counted, never remembered (§129). */
    var tests = {
      client: true,
      shape:  (UNIT_KEYS || []).length > 0 || (FUNCTION_KEYS || []).length > 0 ||
              (COMPANY_KEYS || []).length > 0,
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
            shape:liveShape(), shapeDirty:false, markState:undefined,
            /* §544: what the shape screen has open — a level or a box —
               and, per kind, which division's boxes its row is showing. */
            sel:{ lvl:"top" }, under:{} };
    }
    if (S.at > STEPS.length - 1) S.at = 0;
    /* §436: a list nobody is editing is re-read off the graph, so a change
       written straight into it (below, on a client with a plan) shows. */
    if (!S.shapeDirty) S.shape = liveShape();
    /* §600: WHEN THE RECORD LANDS, THE SHELL REDRAWS, NOT THE FLOW. The
       first step draws the colour controls and only wire() binds them, so
       mounting again from here put back pickers wired to nothing — on a
       served platform every colour changed on the first visit went nowhere
       (§96). The console passes no repaint and draws no colours, so it
       mounts again as before. */
    ensureReg("[data-csetup]", function (h, o) { if (o.repaint) o.repaint(); else mount(h, o); });
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
            shape:liveShape(), shapeDirty:false, markState:undefined,
            /* §544: what the shape screen has open — a level or a box —
               and, per kind, which division's boxes its row is showing. */
            sel:{ lvl:"top" }, under:{} };
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
  function canEdit(){ return !!(S && S.reg && S.reg.canEdit); }
  /* The shape is frozen once there is a plan (§346): its own flag, never
     `canEdit`, because the name, the mark and the team stay changeable. In
     the platform the graph's own writers decide — anybody who may open this
     page may shape a client that holds no plan. */
  function canShape(){
    var h = holdsNow();
    return !(h.plans || h.capabilities) && !(S && S.reg && S.reg.client && S.reg.client.status === "retired");
    /* `S` is null on the console's create piece, which never mounts a flow (§467). */
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
    /* §421, §544: ONE NOTICE ON THE FROZEN SHAPE, because there is one
       screen now. It was two — the list steps said the lists are read-only,
       the Structure step said the switches are not — and both were about
       this screen. Said together, in that order: what is set, and what is
       still yours. */
    if (!canShape() && SHAPE_STEPS.indexOf(s.k) > -1) {
      var hb = el("div", "wzarched");
      /* §608: ONE LINE (Islam: *"clean the setup pages from unnecessary
         paragraphs"*). The why — set-up rewrites a list, which would lose the
         work — is the hover; the line says what stands and what is yours. */
      hb.appendChild(document.createTextNode("This client has a plan, so "));
      hb.appendChild(el("b", null, "rows can\u2019t be added here"));
      hb.appendChild(document.createTextNode(". Names and switches still change. "));
      hb.appendChild(tipEl("Set-up rebuilds a list, which would lose the work entered against a row, so adding is " +
        "closed here. Rename or retire a row on its own Setup page instead, where it keeps who runs it. " +
        "Switching a layer off only hides what is under it."));
      HOST.appendChild(hb);
    }
    /* §608: TWO THINGS SHARING ONE WORD, said where the words are named now
       that Terminology has left Setup. A status, drawn only while it is true
       (1b-ii); the answer is the page's (labelClashes), which the console's
       copy of this file does not carry. */
    var clash = s.k === "shape" && typeof labelClashes === "function" ? labelClashes() : [];
    if (clash.length) {
      var cw = el("div", "wzarched wzclash");
      cw.appendChild(el("b", null, "Two things share a word: "));
      cw.appendChild(document.createTextNode(clash[0] + " is used for two different things. Change one of them, " +
        "or the reader cannot tell them apart on the same screen."));
      HOST.appendChild(cw);
    }

    /* §418, §544: the shape lays the tree and a level's three sections side
       by side, which a 760px column cannot hold; that one step takes the
       page's width. */
    var col = el("div", "wzcol" + (s.k === "shape" ? " wzwide" : ""));
    col.appendChild(el("span", "lab", s.key));
    var q2 = el("h2", "wzq", s.q);
    if (s.k === "shape") { q2.appendChild(document.createTextNode(" ")); q2.appendChild(tipEl(SHAPE_TIP)); }
    col.appendChild(q2);
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
    if (k === "shape") return shapeStep(box);
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
  /* §608: A NOTE UNDER A FIELD IS A HOVER NOW (Islam: *"as we go we need to
     clean the setup pages from unnecessary paragraphs"*). The fact stays,
     on the platform's own "i" beside the label (`tip()`'s mark, 1b-ii). */
  function tipEl(text){
    var t = el("span", "tip", "i");
    t.setAttribute("tabindex", "0");
    t.setAttribute("data-tip", text);
    return t;
  }
  function labTip(label, text){
    var l = el("span", "lab", label);
    if (text) { l.appendChild(document.createTextNode(" ")); l.appendChild(tipEl(text)); }
    return l;
  }
  function field(box, label, value, onChange, note, ro){
    var w = el("div");
    w.appendChild(labTip(label, note));
    var i = el("input", "fld");
    i.type = "text"; i.value = value || "";
    wordCommit(i);
    if (onChange) i.addEventListener("change", function () { onChange(i.value); });
    w.appendChild(i);
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
      field(rs, "The client's name", (GROUP && GROUP.org) || "", null, "", true);
      /* §608: A STATUS, KEPT ON THE PAGE — it says why the box beside it cannot
         be changed here, which is not a description (1b-ii), so it did not
         become a hover with the notes that did. */
      if (!OPTS.live) rs.appendChild(el("p", "note",
        "The client's own record — its name on the door, its industry and its mark — is kept by the served platform."));
    }
    var aw = el("div");
    aw.appendChild(labTip("Its address here", "Made from the name and set once, so a link that has been sent keeps working."));
    var a = el("input", "fld");
    a.value = S.key ? location.origin + "/" + S.key : location.origin + "/…";
    a.readOnly = true;
    aw.appendChild(a);
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
  /* §461: the decks read the same mark, so a change here reaches the open
     platform at once rather than on the next sign-in. */
  /* The console's copy of this flow has no labels (it runs outside the
     platform), so the platform's word is asked for only where it exists. */
  function word(k, d){ return typeof labelWord === "function" ? labelWord(k, "group") : d; }
  function tellShell(v){ if (typeof SYNC !== "undefined" && SYNC.setClientMark) SYNC.setClientMark(v); }
  function markBlock(c){
    var mk = el("div", "wzmark");
    mk.appendChild(labTip("The client's mark", "Shown on the sign-in page this client's people use, and on the presentations: " +
      "large on the cover and small in the footer of every slide, for any " + word("unitword", "business unit") +
      " without a mark of its own and every " + word("fnword", "supporting function") + ". PNG only, with a transparent background."));
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
        saveReg({ mark:"" }, function () { c.mark = null; tellShell(""); show(null); drop.hidden = true; choose.textContent = "Choose a PNG"; });
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
          saveReg({ mark:out }, function () { c.mark = out; tellShell(out); show(out); drop.hidden = false; choose.textContent = "Replace"; });
        };
        img.onerror = function () { URL.revokeObjectURL(url); say("That file could not be read as a picture.", true); };
        img.src = url;
      });
      mrow.appendChild(choose); mrow.appendChild(drop); mrow.appendChild(file);
    }
    mk.appendChild(mrow);
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
            /* §608: TURNING ONE OFF ASKS FIRST, with what it takes away — the
               note that used to sit under the list (Islam: *"unless we are
               removing something that has data"*). Turning one on never asks. */
            mb.addEventListener("click", function () {
              if (on && OPTS.ask) {
                OPTS.ask(mb, { title: m.label + " \u00b7 Turn off",
                  body: "<b>" + escH(reg.client && reg.client.name || "This client") + "</b> loses " + escH(m.label) +
                    ": it leaves their card, the switcher inside the platform and its own address. " +
                    "Nothing in it is deleted, and turning it on again brings it back.",
                  yes: "Turn off", no: "Keep", go: change });
                return;
              }
              change();
            });
            function change() {
              mb.disabled = true;
              post({ action:"setModules", key:S.key, module:m.key, on:!on }).then(function (r) {
                if (!r.ok) { mb.disabled = false; say(r.error || "Not changed.", true); return; }
                reg.modules = r.modules || [];
                /* §453: INSIDE THE PLATFORM THE PAGE IS BUILT FOR THE MODULES
                   THE CLIENT HAD WHEN IT LOADED (Islam: "I turned on the
                   module but nothing is appearing in the navigation"). The
                   served document carries which modules this client has —
                   the switcher, the Copilot tab, the reports' filters — and
                   since §432 the move from settings to a module is a paint,
                   not a load, so nothing would ever re-read it. One reload
                   after the server has taken the change, with anything
                   waiting saved first (§138), makes every one of them true
                   at once. The console has no SYNC and no such stamps, and
                   repaints its rows as before. */
                if (typeof SYNC !== "undefined" && SYNC.isLive && SYNC.isLive() && SYNC.saveNow) {
                  say("Done — reloading so the page shows it…");
                  /* A save refused or failed keeps the page, or the reload
                     would throw away the work §184's banner offers back. */
                  SYNC.saveNow(function (how) {
                    if (how === "saved" || how === "clean") { location.reload(); return; }
                    paintRows();
                    say("Turned " + (on ? "off" : "on") + ". Refresh the page once your other change is saved to see it.", true);
                  });
                  return;
                }
                paintRows();
              });
            }
            msp.appendChild(mb);
          }
        }
        mr.appendChild(msp);
        rows.appendChild(mr);
      });
    }
    paintRows();
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
      var row = el("div", "wzendrow");
      var go = el("button", "btn risk", "Archive this client");
      go.type = "button"; go.dataset.archive = "ask";
      /* §608: the platform asks in its floating box, with what the paragraph
         under this button used to say; the console's copy asks in place. */
      go.addEventListener("click", function () {
        if (!OPTS.ask) { ask(a); return; }
        OPTS.ask(go, { title: "Archive " + name + "?",
          body: "Their link stops working at once, this page included, and the card leaves the clients page. " +
            "Anybody who goes to it is turned away as if this client had never existed. " +
            "Everything they have is kept, and you can bring them back from the console.",
          yes: "Archive " + name, no: "Keep", go: function () { archiveNow(go); } });
      });
      row.appendChild(go);
      a.appendChild(row);
      wrap.appendChild(a);
    }
    function archiveNow(btn){
      btn.disabled = true; btn.textContent = "Archiving…";
      post({ action:"archiveClient", key:S.key, on:true }).then(function (j) {
        if (!j.ok) { btn.disabled = false; btn.textContent = "Archive this client"; say(j.error || "Not archived.", true); return; }
        location.assign(OPTS.console || "/platform");
      }).catch(function (e) {
        if (String(e.message) === "sign in") return;
        btn.disabled = false; btn.textContent = "Archive this client";
        say("Could not reach the server.", true);
      });
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

  /* ── §436: WRITTEN STRAIGHT INTO THE ROW, ON A CLIENT WITH A PLAN ──────
     The freeze (§346.5) exists because set-up saves a list by REBUILDING
     it, which can drop work already entered against a row. These three
     answers are properties of ONE row, so they are written onto that row
     the way its own Setup page writes them, and the list is never rebuilt.
     Names are turned into keys here, because the flow's rows carry names. */
  function coKeyByName(nm){
    nm = String(nm || "").trim();
    var hit = (COMPANY_KEYS || []).filter(function (c) { return COMPANIES[c] && COMPANIES[c].name === nm; })[0];
    return hit || null;
  }
  function liveDone(){ S.shape = liveShape(); if (OPTS.repaint) OPTS.repaint(); else render(); }
  function liveDivision(kind, key, name){
    var co = coKeyByName(name);
    if (kind === "unit") { if (!UNITS[key]) return; UNITS[key].company = co || null; }
    else {
      var f = FUNCTIONS[key]; if (!f) return;
      if (co) f.company = co; else delete f.company;
      delete f.coWeight;                 /* a share of one division is not a share of another (§391) */
    }
    liveDone();
  }
  /* How a function or a capability plans: the shell's own switch, which asks
     first and hides and keeps what the old way held (§405). A function that
     carries a capability is refused there, and the refusal is SAID here —
     a select that quietly jumps back is a control that looks broken (§62). */
  function liveFormat(kind, key, sel){
    if (kind === "fn" && typeof capsOfFunction === "function" && capsOfFunction(key).length) {
      var f = FUNCTIONS[key];
      sel.value = f && f.format === "pillars" ? "pillars" : f && f.format === "objectives" ? "objectives" : "projects";
      say((f ? f.name : "This function") + " carries a " + w("capability", "one", "capability") +
          ", so how it plans is changed after that " + w("capability", "one", "capability") + " moves to another function.", true);
      return;
    }
    OPTS.switchWay(kind, key, sel.value, sel);
  }

  /* ── A list you add to: units and functions are one control ───────── */
  function focusLastName(){
    /* §544: on the shape screen the new row's name box is in the panel, and
       the panel is already drawn on the box that was just added. */
    var one = HOST ? HOST.querySelector("[data-shname], [data-shconame]") : null;
    if (one) { one.focus(); return; }
    var boxes = HOST ? HOST.querySelectorAll(".wzrow input.fld") : [];
    if (boxes.length) boxes[boxes.length - 1].focus();
  }
  function addThenFocus(sel){ S.shapeDirty = true; S.focusNew = true; if (sel) S.sel = sel; redraw(); }
  /* §544: listStep, companiesStep and capsStep were the four list steps —
     the divisions, the units, the functions and the capabilities. Each
     answer they held is asked on the shape screen now: a box's name, how it
     plans and which division it is in, on the box (boxPanel); a division's
     name, on the division (coPanel); the capabilities, on the top level's
     own card and on Setup › Capabilities, which §428 already built and
     which this does not touch. They are deleted rather than left unreached
     — a second screen for one answer is the drift this merge removes
     (§53.5). `divisionNames` went with them: each kind asks its OWN layer
     now (layerNames, §544), not one list shared between them. */

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
    out.bu.exists = SMPRules.buExists(GROUP);
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
      b.addEventListener("click", function () { pick(o[0], b); });
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
  /* §608 — END IN MIND, ITS OWN TICK, under the Winning Aspiration it lives
     in (SMPRules.endInMindOn). Greyed and off while the aspiration is off —
     `disabled`, with the reason on the hover (§220, 1b-ii). Unticking asks
     first where somebody has written one. Stored as an absence. */
  function eimRow(k, tgt, aspOn){
    var on = SMPRules.endInMindOn(GROUP, tgt);
    var r = el("div", "stpart" + (on ? "" : " off"));
    r.setAttribute("data-steim", k);
    var t = tickBtn(on, "Show End in Mind", k + "|eim", function (e) {
      var write = function () {
        var nx = structNow(), l = nx[k];
        if (on) l.eim = { on: false }; else delete l.eim;
        structWrite(nx);
      };
      if (!on) write();
      else askHide(e.currentTarget, k, "endinmind", partWord(k, "endinmind"), write);
    });
    if (!aspOn) { t.disabled = true; t.title = "Shown inside the Winning Aspiration, so it is off while that is."; }
    r.appendChild(t);
    r.appendChild(nameBox(k, "endinmind", "one", "End in Mind, one"));
    r.appendChild(nameBox(k, "endinmind", "many", "End in Mind, many"));
    return r;
  }
  function partHead(){
    var h = el("div", "stparth");
    h.appendChild(el("span")); h.appendChild(el("span", "lab", "One")); h.appendChild(el("span", "lab", "Many"));
    return h;
  }
  /* ── WHAT A SWITCH WOULD HIDE (§608) ──────────────────────────────────
     Islam, of Client set-up: *"it should act as per the adjustment unless we
     are removing something that has data — the same check box should come
     like the access"*. So a tick or a switch that would hide something
     somebody WROTE asks first, in the shell's floating box (OPTS.ask),
     naming whose and how many; anything else applies at once, as it always
     has. Read off the live graph, which inside the platform is the truth of
     the moment (§210). A part this table cannot read (a function's
     description, the competitive discipline) applies at once, as before. */
  function escH(t){
    return String(t == null ? "" : t).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
  }
  function txt(v){ return !!String(v == null ? "" : v).trim(); }
  function quadHas(o, q){ var w = o && o.swot; return !!(w && Array.isArray(w[q]) && w[q].length); }
  var HOLDS = {
    brief: function (o) { return (o.clauses || []).some(function (c) { return c && (txt(c[0]) || txt(c[1])); }); },
    purpose: function (o) { return txt(o.mission); },
    aspiration: function (o) { return txt(o.aspiration); },
    endinmind: function (o) { return txt(o.endInMind); },
    keyobj: function (o) { return (o.keyObjectives || []).length > 0; },
    values: function (o) { return (o.values || []).length > 0; },
    theme: function (o) { return o === GROUP && (GROUP.themes || []).length > 0; },
    swot: function (o) { return ["s", "w", "o", "t"].some(function (q) { return quadHas(o, q); }); },
    plan: function (o) { return ["items", "projects", "actions"].some(function (f) { return Array.isArray(o[f]) && o[f].length > 0; }); }
  };
  function layerSubjects(k){
    if (k === "top") return [{ name: (GROUP && GROUP.org) || word("topword", "Group"), o: GROUP }];
    if (k === "mid") return (COMPANY_KEYS || []).map(function (c) { return { name: COMPANIES[c].name, o: coFoundOf(c) }; });
    if (k === "bu") return (UNIT_KEYS || []).map(function (u) { return { name: UNITS[u].name, o: UNITS[u] }; });
    if (k === "fn") return (FUNCTION_KEYS || []).map(function (f) { return { name: FUNCTIONS[f].name, o: FUNCTIONS[f] }; });
    if (k === "cap") return ((GROUP && GROUP.capabilities) || []).map(function (c) { return { name: c.name, o: c }; });
    return [];
  }
  /* The names of the boxes on layer `k` holding something written for any of
     `parts` (a part key, or a test of its own). */
  function holdersOf(k, parts){
    var tests = [].concat(parts).map(function (c) { return typeof c === "function" ? c : HOLDS[c]; })
      .filter(Boolean);
    if (!tests.length || typeof GROUP === "undefined") return [];
    return layerSubjects(k).filter(function (x) {
      return tests.some(function (t) { try { return t(x.o || {}); } catch (e) { return false; } });
    }).map(function (x) { return String(x.name || "").trim(); }).filter(Boolean);
  }
  function namesSaid(n){
    if (n.length === 1) return n[0];
    if (n.length <= 3) return n.slice(0, -1).join(", ") + " and " + n[n.length - 1];
    return n.slice(0, 2).join(", ") + " and " + (n.length - 2) + " more";
  }
  /* The layer in the client's own word — "Business units · End in Mind". */
  function layerTitle(k){
    if (k === "top") return "Top level";
    var key = { mid: "division", bu: "unitword", fn: "fnword", cap: "capability" }[k];
    return key ? W(key, "many", k) : "This layer";
  }
  function askHide(anchor, k, parts, what, go){
    var held = holdersOf(k, parts);
    if (!held.length || !OPTS.ask || !anchor) { go(); return; }
    OPTS.ask(anchor, {
      title: layerTitle(k) + " \u00b7 " + what,
      body: "<b>" + escH(namesSaid(held)) + "</b> " + (held.length === 1 ? "has" : "have") +
        " this written. Hiding it takes it off " + (held.length === 1 ? "its" : "their") +
        " pages and presentations; the words are kept and come back when it is switched on again.",
      yes: "Hide it", no: "Keep", go: go });
  }
  /* Everything a layer's boxes can hold, for a switch that hides the lot. */
  var ALL_WRITTEN = ["brief", "purpose", "aspiration", "endinmind", "keyobj", "values", "theme", "swot", "plan"];
  function partWord(k, c){ return lvWord(k, c, "one") || fallbackWord(c, "one") || PART_LABEL[c] || c; }
  function compToggle(k, c){
    var nx = structNow(), l = nx[k], i = l.on.indexOf(c);
    if (i >= 0) l.on.splice(i, 1); else l.on.push(c);
    l.on.sort(function (a, b2) {
      var ix = function (x) { for (var j = 0; j < COMPONENTS.length; j++) if (COMPONENTS[j][0] === x) return j; return 99; };
      return ix(a) - ix(b2);
    });
    structWrite(nx);
  }
  var PART_LABEL = { brief:"Brief", desc:"Description", purpose:"Purpose", aspiration:"Aspiration", endinmind:"End in Mind", keyobj:"North Star",
    theme:"Themes", values:"Values", pillar:"Pillar", measure:"Key measure", tactic:"Tactic",
    project:"Project", deliverable:"Deliverable", outcome:"Outcome", milestone:"Milestone", action:"Action" };
  /* §436: WHICH FIRST-SECTION PARTS A LAYER'S CARD OFFERS. A function's
     Overview is its description (Islam: *"an overview with a description
     if needed"*), and its key objectives come back as a tick of their own
     (§437, *"keep them in the first section as an option"*): on unless the
     office takes it off, and off they stop counting too. A capability's is what the directions'
     is made of that a capability page can draw: the brief ("What it is",
     with its definition) and the North Star (Islam: *"add the description
     in the first section like the directions"*). Every other layer offers
     every part but a function's own description. */
  function firstParts(k){
    if (k === "cap") return ["brief", "keyobj"];
    var tgt = { top:"group", mid:"co:", bu:"u:", fn:"fn:" }[k] || "group";
    return SMPRules.SEC_FOUND_PARTS.filter(function (c) {
      return SMPRules.compOffered(tgt, c); });
  }
  var WAY_LABEL = { pillars:"pillars", projects:"projects", objectives:"objectives and actions" };
  function structLevel(box, lv, k, noPlan){
    var L = lv[k], tgt = { top:"group", mid:"co:", bu:"u:", fn:"fn:", cap:"cap:" }[k];
    var secs = el("div", "stsecs");

    /* 1 — the first section: on/off, its title, its parts. */
    var s1 = el("section", "stsec");
    var h1 = el("div", "stsech"); h1.appendChild(el("span", "stkind", "First section"));
    var fOn = SMPRules.foundOn(GROUP, tgt);
    h1.appendChild(onOff(fOn, function (v, b) {
      var write = function () {
        var nx = structNow(), l = nx[k]; l.found = l.found || {};
        if (v) delete l.found.on; else l.found.on = false;
        if (!Object.keys(l.found).length) delete l.found;
        structWrite(nx);
      };
      if (v || !fOn) write();
      else askHide(b, k, firstParts(k).concat(["endinmind"]), "First section", write);
    }, k + "|found"));
    s1.appendChild(h1);
    if (!fOn) s1.appendChild(el("p", "sthid", "Not shown on this layer. Nothing entered is lost."));
    else {
      s1.appendChild(el("p", "lab", "Section title"));
      s1.appendChild(titleBox(k, "found", null, SMPRules.foundTitle({}, tgt), "The first section's title"));
      s1.appendChild(el("p", "lab", "Parts"));
      s1.appendChild(partHead());
      firstParts(k).forEach(function (c) {
        var built = SMPRules.compBuilt(tgt, c), on = built && L.on.indexOf(c) >= 0;
        var r = el("div", "stpart" + (on ? "" : " off"));
        r.appendChild(tickBtn(on, "Show " + PART_LABEL[c], k + "|" + c, function (e) {
          if (!on) { compToggle(k, c); return; }
          askHide(e.currentTarget, k, c === "aspiration" ? [c, "endinmind"] : c, partWord(k, c),
                  function () { compToggle(k, c); });
        }));
        r.appendChild(nameBox(k, c, "one", PART_LABEL[c] + ", one"));
        r.appendChild(nameBox(k, c, "many", PART_LABEL[c] + ", many"));
        if (!built) dummy(r);
        s1.appendChild(r);
        if (c === "aspiration" && SMPRules.endInMindOffered && SMPRules.endInMindOffered(tgt)) s1.appendChild(eimRow(k, tgt, on));
      });
    }
    secs.appendChild(s1);

    /* 2 — the SWOT: its on/off IS the `swot` component (§404), never a
       second switch for one fact. */
    var s2 = el("section", "stsec");
    var h2 = el("div", "stsech"); h2.appendChild(el("span", "stkind", "Second section"));
    var sBuilt = SMPRules.compBuilt(tgt, "swot"), sOn = sBuilt && L.on.indexOf("swot") >= 0;
    var sSw = onOff(sOn, function (v, b) {
      if (v === sOn) return;
      if (v) compToggle(k, "swot");
      else askHide(b, k, "swot", "Second section", function () { compToggle(k, "swot"); });
    }, k + "|swot");
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
        r.appendChild(tickBtn(on, "Show " + SMPRules.PART_DEFAULTS[key][1], k + "|" + q, function (e) {
          var write = function () {
            var nx = structNow(), l = nx[k]; l.swot = l.swot || {};
            var cur = SMPRules.swotQuads(GROUP, tgt).slice(), i = cur.indexOf(q);
            if (i >= 0) { if (cur.length === 1) return; cur.splice(i, 1); } else cur.push(q);
            l.swot.quads = SMPRules.SWOT_QUADS.filter(function (x) { return cur.indexOf(x) >= 0; });
            structWrite(nx);
          };
          if (!on) write();
          else askHide(e.currentTarget, k, function (o) { return quadHas(o, q); },
                       lvWord(k, key, "many") || SMPRules.PART_DEFAULTS[key][1], write);
        }));
        r.appendChild(nameBox(k, key, "many", SMPRules.PART_DEFAULTS[key][1]));
        s2.appendChild(r);
      });
    }
    secs.appendChild(s2);

    /* Spec 064 §3.1 — How we compete, between the SWOT and the plan, on the
       layers that face a market (SMPRules.compOffered). Its on/off IS the
       `compete` component: off until ticked, and off hides and keeps. */
    if (SMPRules.compOffered(tgt, SMPRules.COMPETE)) {
      var sc = el("section", "stsec"); sc.setAttribute("data-stcompete", k);
      var hc = el("div", "stsech"); hc.appendChild(el("span", "stkind", "Competitive Discipline"));
      var cOn = L.on.indexOf(SMPRules.COMPETE) >= 0;
      hc.appendChild(onOff(cOn, function (v) { if (v !== cOn) compToggle(k, SMPRules.COMPETE); }, k + "|compete"));
      sc.appendChild(hc);
      if (!cOn) sc.appendChild(el("p", "sthid", "Not shown on this layer. Nothing entered is lost."));
      secs.appendChild(sc);
    }
    /* §465: the top card stops here — its plan is the Directions card. */
    if (noPlan) { box.appendChild(secs); structTail(box, L, k); return; }

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
    var pSw = onOff(pOn, function (v, b) {
      var write = function () {
        var nx = structNow(), l = nx[k]; l.plan = l.plan || {};
        if (v) delete l.plan.on; else l.plan.on = false;
        if (!Object.keys(l.plan).length) delete l.plan;
        structWrite(nx);
      };
      if (v || !pOn) write();
      else askHide(b, k, "plan", "Plan section", write);
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
    if (ways.length > 1) {
      var k3 = h3.querySelector(".stkind");
      k3.appendChild(document.createTextNode(" "));
      k3.appendChild(tipEl("Each one picks how it plans on its own row. Name " +
        (ways.length === 2 ? "both" : "all three") + " ways here."));
    }
    planWays(s3, k, tgt, ways);
    secs.appendChild(s3);
    box.appendChild(secs);
    structTail(box, L, k);
  }
  /* §465: the names inside each way, drawn for a layer's plan section and
     for the Directions card alike. `skip` leaves out a part the card names
     itself (the directions are named at the top of their card). */
  function planWays(s3, k, tgt, ways, skip){
    ways.forEach(function (way) {
      var wb = el("div", "stway"); wb.setAttribute("data-stway", k + "|" + way);
      if (ways.length > 1) wb.appendChild(el("span", "stkind", "If planned in " + WAY_LABEL[way]));
      wb.appendChild(el("p", "lab", "Section title"));
      var dflt = way === "projects" && (k === "fn" || k === "cap") ? fallbackWord("project", "many") : "Plan";
      wb.appendChild(titleBox(k, "plan", way, dflt, "The plan section's title, " + WAY_LABEL[way]));
      wb.appendChild(partHead());
      SMPRules.PLAN_PARTS[way].forEach(function (c) {
        if (skip && skip.indexOf(c) >= 0) return;
        var r = el("div", "stpart");
        r.appendChild(el("span"));
        var a = nameBox(k, c, "one", PART_LABEL[c] + ", one"), b = nameBox(k, c, "many", PART_LABEL[c] + ", many");
        if (c === "keyobj") { a.title = b.title = "The same name as the North Star above: in this way of planning they are one list."; }
        r.appendChild(a); r.appendChild(b); wb.appendChild(r);
      });
      if (way === "pillars") detailRows(wb, k, tgt);
      s3.appendChild(wb);
    });
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
      sw.title = "Draws the picture from the aspiration (roof), the North Star and the themes (columns)" +
        (SMPRules.capExists(GROUP) ? ", and the capabilities (base)." : ".");
      if (need.length) tp.appendChild(el("span", "wzwhy",
        "Needs " + need.map(function (c) { return PART_LABEL[c] || c; }).join(", ") + " ticked."));
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
  /* §544 — ONE CARD AT A TIME, BESIDE THE TREE. These seven cards WERE the
     Structure step: a stack down one page, seven of the flow's steps ago.
     They are the same seven cards, not rewritten and not reduced — what
     changed is that the shape screen (shapeStep) draws one of them at a
     time, the one whose level you pressed in the tree. `only` is that
     level's key; without it the whole stack is drawn, which is what the
     console's own mount still asks for. */
  function structureStep(box, only){
    var ro = !canShape();
    var lv = structNow();
    var want = function (k) { return !only || only === k; };
    /* §468: a card's NAME is its header — bold, a size up, on a shaded band,
       with its On/Off on the right (Islam: *"the title of the group plans its
       own and the client has them is irrelevant ... make the main title
       already bold ... and shaded background"*). The switch's own label went
       with it; a switch is put into the header with `hd(c, sw)`. */
    var card = function (tag, into) {
      var c = el("section", "stcard"); var h = el("div", "stsech sthd");
      h.appendChild(el("span", "tag", tag)); c.appendChild(h); (into || box).appendChild(c); return c;
    };
    var hd = function (c, sw) { c.querySelector(".sthd").appendChild(sw); };
    /* Two cards side by side in one row (§468): the company's pillars and its
       capabilities, and the bottom pair when both are off. */
    var pair = function () { if (only) return box; var w = el("div", "stpair"); box.appendChild(w); return w; };
    /* §468: inside the company plan a capability is a part of that plan, so
       it has no first or second section of its own and no Except for — only
       its name and its plan section (Islam: *"the capabilities has no first
       section and second section"*). What was set there is kept, not shown. */
    /* §544.13: `inPlan` is gone with the layer — a capability is in the
       company's plan, so it is always a part of that plan and never a page
       of its own with an Except for. */
    var capSettings = function (c) {
      callBoxes(c, "capability", ro);
      structLevel(c, lv, "cap");
      var g = c.querySelector(".stsecs"), ss = g ? g.querySelectorAll(":scope > .stsec") : [];
      if (ss.length > 1) { for (var i = 0; i < ss.length - 1; i++) g.removeChild(ss[i]); g.classList.add("stsecs1"); }
    };

    var top = want("top") ? card("Top level") : null;
    if (top) {
    top.appendChild(el("p", "lab", "Called"));
    namePick(top, "topword", TOP_NAMES, "one", ro);
    /* §544.4 — "WHERE IS THE STRATEGY PLANNED" IS GONE, and §448 with it.
       Islam, of the shape screen: *"there's no question that now, if the plan
       is on the company or in the business unit, when you go to the level on
       the tree, you select: are there directions, are there pillars on the
       company level, or are there directions or pillars or strategy on the
       business unit level? You might even have both. What's the point of this
       choice now?"*

       None. Each level already answers it on its own card — the company's
       plan is the Directions card's switch, the units' is the units' card's —
       and BOTH CAN BE ON, which an either/or cannot say. It was a third
       answer to a question already asked twice, and the one that could be
       wrong. §448 replaced §447's On/Off on the business-units card with this
       question; this puts that On/Off back, where it is symmetric with the
       functions' (§418) and where the tree sends you.

       AND OFF NOW MEANS OFF. The question did not only hide the units: it
       COPIED every unit's plan onto the company page as directions and filed
       the old pages (`buFoldIntoTop`). Islam, asked what switching off should
       do now: *"just hide them, keep everything"* — which is spec 066 §2.2's
       own words, *"nothing hides anything else"*, and the reversal of §447 that
       spec called for. The fold is no longer reachable from the product; it
       stays in config-data.js as the record of §447 and as the way three
       checks make a company-level state, and is noted as debt. */
    structLevel(top, lv, "top", true);
    }

    /* §465 — THE COMPANY'S OWN PLAN IS TWO CARDS (Islam, approving the
       plan-level mockup: *"ok build it"*). The top card keeps its first and
       second sections; its plan leaves for a Directions card, and the
       capabilities the company carries get a card beside it. The order is the
       same at both levels — what a card holds is what changes. */
    var topOne = W("topword", "one", "company"), topLow = topOne.toLowerCase();
    var capWord = W("capability", "many", "Capabilities");
    if (want("top")) {
    var row2 = pair();
    var dr = card(topOne + " " + W("pillar", "many", "Directions").toLowerCase(), row2);
    dr.setAttribute("data-stcard", "dir");
    var topWayNow = SMPRules.topWay(GROUP);
    var dOn = SMPRules.planOn(GROUP, "group") && (topWayNow === "projects" || lv.top.on.indexOf("pillar") >= 0);
    hd(dr, onOff(dOn, function (v) {
      var nx = structNow(), t = nx.top;
      if (v) {
        if (t.plan) { delete t.plan.on; if (!Object.keys(t.plan).length) delete t.plan; }
        if (t.on.indexOf("pillar") < 0) t.on.push("pillar");
      } else { t.plan = t.plan || {}; t.plan.on = false; }
      structWrite(nx);
    }, "top|plan"));
    if (dOn) {
      dr.appendChild(el("p", "lab", "Called"));
      dr.appendChild(partHead());
      var cr = el("div", "stpart"); cr.appendChild(el("span"));
      cr.appendChild(nameBox("top", "pillar", "one", "Direction, one"));
      cr.appendChild(nameBox("top", "pillar", "many", "Directions, many"));
      dr.appendChild(cr);
      /* §466: the company plans in pillars or in projects — the unit row's
         own "plans in" control (§438), two ways here. A change goes through
         the shell's switch, which warns and hides-and-keeps what the old way
         held (§405); offline it writes the structure itself. */
      var wr = el("div", "stsech");
      var wt = el("span", "wzrt");
      wt.appendChild(el("span", "wzsub", "plans in"));
      var wsel = el("select", "fld");
      [["pillars", W("pillar", "many", "Directions")], ["projects", W("project", "many", "Projects")]].forEach(function (f) {
        var o = el("option", null, f[1]); o.value = f[0];
        if (topWayNow === f[0]) o.selected = true;
        wsel.appendChild(o);
      });
      wsel.setAttribute("data-wztopway", "1");
      wsel.setAttribute("aria-label", "How the " + W("topword", "one", "company").toLowerCase() + " plans");
      wsel.addEventListener("change", function () {
        if (OPTS.switchWay) { OPTS.switchWay("top", "group", wsel.value, wsel); return; }
        var nx = structNow(), t = nx.top;
        t.plan = t.plan || {};
        if (wsel.value === "projects") t.plan.way = "projects";
        else { delete t.plan.way; if (!Object.keys(t.plan).length) delete t.plan; }
        structWrite(nx);
      });
      wt.appendChild(wsel); wr.appendChild(wt); dr.appendChild(wr);
      /* ── §540 · AND WHETHER THEY SHOW AS ONE LIST OR APART ──────────────
         The row beside "plans in", for the same reason it sits beside it in
         a unit's dialog: both answer *what does this box's plan look like*.
         Only while it plans in pillars — projects have no second kind.

         TWO OPTIONS NAMED FROM THE CLIENT'S OWN WORDS, so El Abd reads
         "Directions and Capabilities apart" and a client that calls them
         something else reads its own. ABSENT IS ONE LIST (§50.6): the key is
         deleted rather than written false, so a company set apart and set
         back leaves the structure exactly as it found it.

         WRITTEN STRAIGHT TO THE STRUCTURE, never through `switchPlanWay`:
         nothing is hidden either way. The same pillars are drawn, in one tab
         or in two, so there is nothing to warn about and nothing to keep. */
      if (topWayNow === "pillars") {
        var sr = el("div", "stsech");
        var st = el("span", "wzrt");
        st.appendChild(el("span", "wzsub", W("pillar", "many", "Directions") + " show as"));
        var ssel = el("select", "fld");
        [["one", "One list"],
         ["split", W("pillar", "many", "Directions") + " and " + W("capability", "many", "Capabilities") + " apart"]
        ].forEach(function (f) {
          var o = el("option", null, f[1]); o.value = f[0];
          if ((SMPRules.topSplit(GROUP) ? "split" : "one") === f[0]) o.selected = true;
          ssel.appendChild(o);
        });
        ssel.setAttribute("data-wztopsplit", "1");
        ssel.setAttribute("aria-label", "How the " + W("topword", "one", "company").toLowerCase() +
          " shows its " + W("pillar", "many", "Directions").toLowerCase());
        ssel.addEventListener("change", function () {
          var nx = structNow(), t = nx.top;
          t.plan = t.plan || {};
          if (ssel.value === "split") t.plan.split = true;
          else { delete t.plan.split; if (!Object.keys(t.plan).length) delete t.plan; }
          structWrite(nx);
        });
        st.appendChild(ssel); sr.appendChild(st); dr.appendChild(sr);
      }
      planWays(dr, "top", "group", [topWayNow], ["pillar"]);
    } else dr.appendChild(el("p", "sthid", "Off: the " + topLow + " plans nothing of its own."));

    /* §544.13 — ONE CAPABILITIES CARD, AND IT ASKS WHETHER, NOT WHERE.
       Islam: *"who can a capability belong to?"* — **the company only**;
       *"where does it appear?"* — **inside its owner's plan, with the
       directions**. So there is one place and nothing to choose between:
       this card sits beside the Directions card in the company's plan, and
       its switch is §428's "does this client have capabilities", which the
       layer card used to carry.

       WHAT WENT: the where-switch (`cap|top`, two answers written into
       `structure.cap.at`) and the layer card it chose between. `cap.at` is
       dead storage and is left where it lies (§405). */
    var cc = card(topOne + " " + capWord.toLowerCase(), row2);
    cc.setAttribute("data-stcard", "cap");
    hd(cc, onOff(lv.cap.exists, function (v) {
      var nx = structNow(); nx.cap.exists = v; structWrite(nx);
    }, "cap|layer"));
    if (lv.cap.exists) capSettings(cc);
    else cc.appendChild(el("p", "sthid", "Not asked about in set-up and not shown in the " + topLow + " plan. Nothing entered is lost."));
    }

    /* §418: a layer the client does not have is switched off as a whole —
       the second layer as before, the supporting functions now too. */
    if (want("mid")) {
    var mid = card("Second layer");
    hd(mid, onOff(lv.mid.exists, function (v, b) {
      var write = function () { var nx = structNow(); nx.mid.exists = v; structWrite(nx); };
      if (v || !lv.mid.exists) write(); else askHide(b, "mid", ALL_WRITTEN, "Off", write);
    }, "mid|layer"));
    if (lv.mid.exists) {
      mid.appendChild(el("p", "lab", "Called"));
      namePick(mid, "division", MID_NAMES, "both", ro);
      structLevel(mid, lv, "mid");
      exceptBox(mid, "mid");
    } else mid.appendChild(el("p", "sthid", "Not asked about in set-up and not shown in the navigation. Nothing entered is lost."));
    }

    /* §464: Islam, "for the supporting functions name it functions" — the
       card names the layer; the client's own word is chosen inside it. */
    if (want("fn")) {
    var fn = card("Functions");
    hd(fn, onOff(lv.fn.exists, function (v, b) {
      var write = function () { var nx = structNow(); if (v) delete nx.fn.exists; else nx.fn.exists = false; structWrite(nx); };
      if (v || !lv.fn.exists) write(); else askHide(b, "fn", ALL_WRITTEN, "Off", write);
    }, "fn|layer"));
    if (lv.fn.exists) {
      callBoxes(fn, "fnword", ro);
      structLevel(fn, lv, "fn");
      exceptBox(fn, "fn");
    } else fn.appendChild(el("p", "sthid", "Not asked about in set-up and not shown in the navigation. Nothing entered is lost."));
    }

    /* §447/§448: the business-unit card has no switch of its own; whether it
       is used is answered on the top card ("Where the strategy is planned").
       Not used, it says so and keeps everything. */
    /* §544.13: §468's bottom PAIR is a single card now — the independent
       capabilities that shared the row with it have no layer to be. */
    if (want("bu")) {
    var bu = card("Third layer", box);
    bu.setAttribute("data-stcard", "bu");
    /* §544.4: its own switch, the functions' card's exactly (§418). Off
       hides the layer and keeps every plan, figure and page behind it. */
    hd(bu, onOff(lv.bu.exists, function (v, b) {
      var write = function () { var nx = structNow(); if (v) delete nx.bu.exists; else nx.bu.exists = false; structWrite(nx); };
      if (v || !lv.bu.exists) write(); else askHide(b, "bu", ALL_WRITTEN, "Off", write);
    }, "bu|layer"));
    if (lv.bu.exists) {
      callBoxes(bu, "unitword", ro);
      structLevel(bu, lv, "bu");
      exceptBox(bu, "bu");
    } else bu.appendChild(el("p", "sthid", "Not shown in the navigation. Nothing entered is lost."));
    }

    /* §544.13 — AND NO INDEPENDENT-CAPABILITIES CARD. §428 gave the
       capabilities a layer of their own after the functions, with its own
       plan, owner, custodian and page; §465 greyed it whenever they were in
       the company plan instead. They are always in the company plan now, so
       the card is always the greyed one — a control with nothing behind it
       (§61), and it is read out rather than left drawn and dead. Its switch
       (`cap|layer`) and its settings moved onto the company's capabilities
       card above, which is where they were already drawn whenever the office
       had said "in the company plan". */

    /* §608: the note that closed this box is the hover on the step's own
       question now (render(), SHAPE_TIP) — and it no longer sends anybody to
       Terminology, which left Setup. */
    return box;
  }


  /* ══ THE SHAPE, ON ONE SCREEN (§544, spec 066 stage 4) ═══════════════════
     Islam, having pressed the mockup: *"the shape is good, let's build
     stage 4"*. Before that, on how a middle layer comes to exist: *"the main
     layer is the bottom layer, which may be the business units or the
     functions. Creating another layer in between these layers and the
     company should be the thing that is the exception, or the creation"*,
     and *"no not 1 list the business units has it's own layer above and the
     functions has their own layer above"*.

     FIVE STEPS BECOME ONE. Structure, the divisions, the units, the
     functions and the capabilities were five screens that each held one
     answer about the same tree, and you could not see the tree on any of
     them. This is the tree: every box the client has, on the left, under the
     layer it sits in; press one and its own answers open on the right. The
     seven-step flow is now three — the client, the shape, the office (spec
     066 §6).

     NOTHING IS A NEW ANSWER. Every control here is the control that was on
     one of those five steps, reading and writing exactly what it did: a
     level's card is `structureStep`'s own card (`only`), a box's row is the
     list step's row, and the shape is held in `S.shape` and committed by
     `__smpShape` on Next or Done, as it always was. What is new is the
     drawing, the layer per kind (§544) and the navigation tick (§544.2).

     THE TREE READS THE FLOW'S ANSWERS, NEVER THE GLOBALS. A division added
     here is in `S.shape` and will not be in `COMPANIES` until the shape is
     committed, so the §544 rules are asked over maps built from `S.shape`
     (shapeMaps) rather than over the live ones — the same rule, this
     screen's answers. */

  /* The flow's held shape, in the shape the §544 rules ask for. Keys are
     positional and local to this screen; a division is matched to its boxes
     by NAME, which is the only thing about a division the flow carries
     (§360.3, __smpShape's own rule). */
  function shapeMaps(){
    var cos = {}, keys = [], us = {}, fns = {}, byName = {};
    (S.shape.companies || []).forEach(function (c, i) {
      var k = "c" + i; keys.push(k);
      cos[k] = { name: c.name, layer: c.layer };
      var nm = String(c.name || "").trim().toLowerCase();
      if (nm && !byName[nm]) byName[nm] = k;
    });
    var put = function (list, map, pre) {
      (list || []).forEach(function (r, i) {
        map[pre + i] = { name: r.name, company: byName[String(r.company || "").trim().toLowerCase()] || null };
      });
    };
    put(S.shape.units, us, "u"); put(S.shape.functions, fns, "f");
    return { keys: keys, cos: cos, units: us, functions: fns, byName: byName };
  }
  function kindList(k){ return k === "bu" ? S.shape.units : S.shape.functions; }
  function kindWord(k, form, fb){ return W(k === "bu" ? "unitword" : "fnword", form, fb); }
  function kindOn(k){ return k === "bu" ? SMPRules.buExists(GROUP) : SMPRules.fnExists(GROUP); }
  function layerOnFor(k, m){
    return SMPRules.layerOn(GROUP, k, m.keys, m.cos, m.units, m.functions);
  }
  /* What this kind's layer is called. One word while the client has one
     layer (§544's `layerWords`), its own the moment it has two. */
  function layerWordOf(k, form){
    var w2 = SMPRules.layerWords(GROUP, k);
    var v = w2 && typeof w2[form] === "string" ? w2[form].trim() : "";
    return v || W("division", form, form === "one" ? "Division" : "Divisions");
  }
  /* The divisions drawn on one kind's row, as names — the form every row in
     `S.shape` carries. */
  function layerNames(k, m){
    return SMPRules.layerCompanies(k, m.keys, m.cos, m.units, m.functions)
      .map(function (ck) { return String(m.cos[ck].name || "").trim(); }).filter(Boolean);
  }
  /* Which division's boxes the kind's row is showing. Absent, the first. */
  function underOf(k, names){
    var cur = (S.under || {})[k];
    return names.indexOf(cur) >= 0 ? cur : (names[0] || "");
  }

  /* ── the tree ─────────────────────────────────────────────────────── */
  function shSel(sel){ S.sel = sel; redraw(); }
  function selLvlIs(id){ return !!(S.sel && S.sel.lvl === id); }
  function selBoxIs(kind, at){ return !!(S.sel && S.sel.box === kind && S.sel.at === at); }

  /* §544.2: the tick that puts a row in the navigation. A real true or
     false, deleted again when it is pressed back to what the absence says,
     so a client the office looked at and left alone stores nothing. */
  function navTick(host, row){
    var on = SMPRules.navPicked(GROUP, row), p = SMPRules.navRowParts(row);
    var b = el("button", "shnav" + (on ? " on" : ""), "nav");
    b.type = "button";
    b.setAttribute("aria-pressed", String(on));
    b.setAttribute("data-shnav", row);
    b.title = "Show this row as a switch in the navigation";
    b.setAttribute("aria-label", "Show this row in the navigation");
    b.addEventListener("click", function (e) {
      e.stopPropagation();
      var nx = structNow(), l = nx[p.kind], key = p.layer ? "layerNav" : "nav";
      if (!on === SMPRules.navRowUnsaid(GROUP, row)) delete l[key]; else l[key] = !on;
      structWrite(nx);
    });
    host.appendChild(b);
    return b;
  }
  function shLvlRow(host, layer, label, lvlKey, count, navRow){
    var r = el("div", "shlvl" + (selLvlIs(lvlKey) ? " sel" : ""));
    r.appendChild(el("span", "shlay", "Layer " + layer));
    var b = el("button", "shlvlb", label); b.type = "button";
    b.setAttribute("data-shlvl", lvlKey);
    b.addEventListener("click", function () { shSel({ lvl: lvlKey }); });
    r.appendChild(b);
    if (count != null) {
      var cn = el("span", "shn", String(count));
      cn.setAttribute("data-shcount", lvlKey);
      r.appendChild(cn);
    }
    if (navRow) navTick(r, navRow);
    host.appendChild(r);
    return r;
  }
  function shBoxBtn(host, label, press, cls, n, id){
    var b = el("button", "shb" + (cls ? " " + cls : ""), label || "—"); b.type = "button";
    /* Addressable: "top", "co:3", "bu:0", "fn:7" — the kind and its place
       in the flow's own list, which is what the panel is opened by. */
    if (id) b.setAttribute("data-shbox", id);
    if (n != null) b.appendChild(el("span", "shn", String(n)));
    b.addEventListener("click", press);
    host.appendChild(b);
    return b;
  }
  /* NO DATA ATTRIBUTE ON THE ADD BUTTON, deliberately. The shell keeps the
     cursor across a repaint by the focused control's first `data-` attribute
     (§374's focusMark/putFocus), so an addressable Add takes the focus
     straight back off the box it just made — measured: the new name box
     gained focus and lost it in the same paint. The ROW carries the address
     instead (`data-shrow`), which is what a check presses through. */
  function shAdd(host, label, press){
    var b = el("button", "shadd", label); b.type = "button";
    b.addEventListener("click", press);
    host.appendChild(b);
    return b;
  }
  function shWhy(host, text){ host.appendChild(el("p", "shwhy", text)); }

  function drawTree(host){
    var m = shapeMaps(), shape = canShape();

    /* Layer 1 — the client itself. */
    shLvlRow(host, 1, W("topword", "many", "Group"), "top", null, null);
    var trow = el("div", "shrow shtoprow");
    /* The name on the door where the register has been read, and the
       group's own where it has not — offline there is no register, and
       the top box of the tree is the one box that must always be named. */
    shBoxBtn(trow, (S.reg && S.reg.client && S.reg.client.name) ||
      String((GROUP && GROUP.org) || "").trim() || "This client",
      function () { shSel({ lvl: "top" }); }, "top" + (selLvlIs("top") ? " sel" : ""), null, "top");
    host.appendChild(trow);

    SMPRules.LAYER_KINDS.forEach(function (k) {
      var list = kindList(k), on = kindOn(k), hasLayer = layerOnFor(k, m);
      var names = hasLayer ? layerNames(k, m) : [];
      var under = underOf(k, names);

      /* the kind's OWN layer, where it has one */
      if (hasLayer) {
        var lrow = shLvlRow(host, 2, layerWordOf(k, "many"), k + "@g", names.length, k + "@g");
        var side = el("span", "shunder");
        side.appendChild(document.createTextNode("above the " + kindWord(k, "many", "boxes").toLowerCase() + " "));
        /* §544.14 — NOT GATED ON `shape`, BECAUSE IT TAKES NOTHING AWAY.
           Islam, of El Abd: *"layer 2 above the business units I want to
           remove it but no option there to do that"*. There was none: this
           link sat behind `canShape()`, which goes false the moment a client
           holds a plan — so every client that has actually been used lost it.
           It is HIDDEN, NEVER CLEARED (§405): every division and every
           assignment stays and grouping again brings all of it back, which
           makes it the same kind of act as the units' own On/Off that this
           screen has always offered beside it. The banner's own promise —
           *"every name and switch on this screen can still be changed"* —
           covers it; what stays gated is ADDING a row, which is what would
           lose work. */
        var rm = el("button", "shlink", "remove this layer"); rm.type = "button";
        rm.setAttribute("data-shungroup", k);
        rm.title = "Hides the layer. Every " + W("division", "one", "division").toLowerCase() +
          " and every box under it is kept, and grouping again brings it back.";
        rm.addEventListener("click", function (e) {
          e.stopPropagation();
          askHide(rm, "mid", ALL_WRITTEN, "Remove this layer", function () {
            var nx = structNow(); nx[k].layer = false; structWrite(nx);
          });
        });
        side.appendChild(rm);
        lrow.appendChild(side);
        var grow = el("div", "shrow");
        grow.setAttribute("data-shrow", k + "@g");
        names.forEach(function (nm) {
          var at = S.shape.companies.map(function (c) { return String(c.name || "").trim(); }).indexOf(nm);
          var kids = kindList(k).filter(function (r) { return String(r.company || "").trim() === nm; }).length;
          shBoxBtn(grow, nm, function () {
            S.under = S.under || {}; S.under[k] = nm;
            shSel({ box: "co", at: at });
          }, (selBoxIs("co", at) ? "sel" : "") + (nm === under ? " under" : ""), kids || null, "co:" + at);
        });
        if (shape) shAdd(grow, "+ add", function () {
          S.shape.companies.push({ name: "", layer: k }); addThenFocus({ box: "co", at: S.shape.companies.length - 1 });
        });
        host.appendChild(grow);
      }

      /* and the kind itself */
      var shown = hasLayer ? list.filter(function (r) { return String(r.company || "").trim() === under; }) : list;
      var row = shLvlRow(host, hasLayer ? 3 : 2, kindWord(k, "many", k === "bu" ? "Business units" : "Functions"),
        k, list.length, k);
      if (hasLayer && under) row.appendChild(el("span", "shsub", "(" + shown.length + " under " + under + ")"));
      /* §544.14: the way back, ungated for the same reason — a layer with
         nothing under it yet hides nothing and loses nothing. A control you
         can press one way and not the other is a trap (§61). */
      if (!hasLayer) {
        var side2 = el("span", "shunder");
        var gp = el("button", "shlink", "group these under a layer…"); gp.type = "button";
        gp.setAttribute("data-shgroup", k);
        gp.title = "Puts a layer above them. Nothing is created and nothing moves until you " +
          "put a box in one.";
        gp.addEventListener("click", function (e) {
          e.stopPropagation();
          var nx = structNow(); nx[k].layer = true; delete nx.mid.exists; structWrite(nx);
        });
        side2.appendChild(gp); row.appendChild(side2);
      }
      if (!on) { shWhy(host, "Off. Press " + kindWord(k, "many", "the row").toLowerCase() +
        " above to switch it back on; nothing entered is lost."); return; }
      var brow = el("div", "shrow");
      brow.setAttribute("data-shrow", k);
      shown.forEach(function (r) {
        var at = list.indexOf(r);
        shBoxBtn(brow, String(r.name || "").trim(), function () { shSel({ box: k, at: at }); },
          selBoxIs(k, at) ? "sel" : "", null, k + ":" + at);
      });
      if (shape) shAdd(brow, "+ add" + (hasLayer && under ? " under " + under : ""), function () {
        list.push(k === "bu" ? { name: "", format: "pillars", company: under }
                             : { name: "", format: fnDefault(), company: under });
        addThenFocus({ box: k, at: list.length - 1 });
      });
      host.appendChild(brow);
      if (!list.length) shWhy(host, "None yet — add one, or leave the " +
        kindWord(k, "many", "boxes").toLowerCase() + " out of this client altogether.");
      /* §351: the names most clients have, one press in. They were under
         the list steps; they belong to the row they add to. */
      if (shape) {
        var left = (k === "bu" ? COMMON_UNITS : COMMON_FNS).filter(function (nm) { return !chipUsed(list, nm); });
        if (left.length) {
          var crow = el("div", "shchips");
          left.forEach(function (nm) {
            var cb = el("button", "shchip"); cb.type = "button";
            cb.setAttribute("aria-label", "Add " + nm);
            cb.appendChild(el("span", "p", "+"));
            cb.appendChild(document.createTextNode(nm));
            cb.addEventListener("click", function () {
              list.push(markFromChip(k === "bu" ? { name: nm, format: "pillars", company: under }
                                                : { name: nm, format: fnDefault(), company: under }, nm));
              addThenFocus({ box: k, at: list.length - 1 });
            });
            crow.appendChild(cb);
          });
          host.appendChild(crow);
        }
      }

      /* the ones with no division yet (§544) */
      if (hasLayer) {
        var need = list.filter(function (r) { return names.indexOf(String(r.company || "").trim()) < 0; });
        if (need.length) {
          var nb = el("div", "shneeds");
          nb.appendChild(el("p", "shneedh", need.length + " need a " + layerWordOf(k, "one")));
          var nr = el("div", "shrow");
          need.forEach(function (r) {
            var at = list.indexOf(r);
            shBoxBtn(nr, String(r.name || "").trim() || "—", function () { shSel({ box: k, at: at }); },
              "orphan" + (selBoxIs(k, at) ? " sel" : ""), null, k + ":" + at);
          });
          nb.appendChild(nr); host.appendChild(nb);
        }
      }
    });

    /* §428, stage 3b: a capability is an internal pillar now, so the tree
       has no row for one. A client that still holds capability RECORDS keeps
       them, and keeps the page that manages them — said here rather than
       left to be noticed (§61). */
    var caps = (S.shape.capabilities || []).length;
    if (caps) shWhy(host, caps + " " + W("capability", caps === 1 ? "one" : "many", "capabilities").toLowerCase() +
      (caps === 1 ? " is" : " are") + " managed on Setup › " + W("capability", "many", "Capabilities") + ".");
  }

  /* ── the panel ────────────────────────────────────────────────────── */
  /* A level opens the card that level has always had (structureStep's
     `only`); the layers share the second layer's card, because there is one
     second layer in the store and one set of switches on it. */
  var LVL_CARD = { top: "top", "bu@g": "mid", "fn@g": "mid", bu: "bu", fn: "fn" };
  function drawShapePanel(host){
    var sel = S.sel || { lvl: "top" };
    if (sel.lvl) {
      var k = LVL_CARD[sel.lvl];
      if (!k) { S.sel = { lvl: "top" }; k = "top"; }
      host.setAttribute("data-shpanel", sel.lvl);
      /* The layer's own name, where the client has two layers and one word
         cannot serve both (§544). Above the card, because it names what the
         card is about. */
      if (sel.lvl.indexOf("@g") > 0) layerNameBoxes(host, sel.lvl.slice(0, -2));
      structureStep(host, k);
      return;
    }
    host.setAttribute("data-shpanel", sel.box + ":" + sel.at);
    if (sel.box === "co") return coPanel(host, sel.at);
    return boxPanel(host, sel.box, sel.at);
  }
  function layerNameBoxes(host, k){
    var c = el("section", "stcard");
    var h = el("div", "stsech sthd"); h.appendChild(el("span", "tag", "This layer's name"));
    c.appendChild(h);
    var w2 = SMPRules.layerWords(GROUP, k) || {};
    var row = el("div", "strow");
    [["one", "One"], ["many", "Many"]].forEach(function (f) {
      var i = el("input", "fld"); i.type = "text";
      i.value = typeof w2[f[0]] === "string" ? w2[f[0]] : "";
      i.setAttribute("placeholder", W("division", f[0], f[0] === "one" ? "Division" : "Divisions"));
      i.setAttribute("aria-label", "What this layer is called, " + f[1].toLowerCase());
      i.setAttribute("data-shlw", k + "|" + f[0]);
      i.addEventListener("change", function () {
        var nx = structNow(), l = nx[k], v = i.value.trim();
        var cur = Object.assign({}, l.layerWords || {});
        if (v) cur[f[0]] = v; else delete cur[f[0]];
        if (Object.keys(cur).length) l.layerWords = cur; else delete l.layerWords;
        structWrite(nx);
      });
      var lb = el("label", "stnm"); lb.appendChild(el("span", "lab", f[1]));
      lb.appendChild(i); row.appendChild(lb);
    });
    c.appendChild(row);
    c.appendChild(el("p", "wzwhy", "Empty uses the client's own word for the second layer. " +
      "Name it here when the " + W("unitword", "many", "business units").toLowerCase() + " and the " +
      W("fnword", "many", "functions").toLowerCase() + " each have a layer of their own."));
    host.appendChild(c);
  }
  /* A DIVISION'S OWN ROW — the Divisions step's row, which held its name
     and nothing else. */
  function coPanel(host, at){
    var co = S.shape.companies[at];
    if (!co) { S.sel = { lvl: "top" }; return drawShapePanel(host); }
    var shape = canShape();
    var c = el("section", "stcard");
    var h = el("div", "stsech sthd"); h.appendChild(el("span", "tag", co.name || "New " + W("division", "one", "division").toLowerCase()));
    c.appendChild(h);
    var i = el("input", "fld"); i.type = "text"; i.value = co.name || "";
    i.setAttribute("aria-label", "The " + w("division", "one", "division") + "'s name");
    i.setAttribute("data-shconame", String(at));
    if (!shape) i.readOnly = true;
    i.addEventListener("input", function () {
      var was = co.name;
      co.name = i.value;
      /* its boxes follow the rename, as the Divisions step's row did */
      S.shape.units.concat(S.shape.functions).forEach(function (x) { if (was && x.company === was) x.company = i.value; });
      if (S.under) SMPRules.LAYER_KINDS.forEach(function (k) { if (S.under[k] === was) S.under[k] = i.value; });
      S.shapeDirty = true;
    });
    var nl = el("label", "stnm"); nl.appendChild(el("span", "lab", "Name")); nl.appendChild(i);
    c.appendChild(nl);
    if (shape) {
      var x = el("button", "danger", "Remove this " + W("division", "one", "division").toLowerCase());
      x.type = "button"; x.setAttribute("data-shremove", "co:" + at);
      x.addEventListener("click", function () {
        var gone = co.name;
        S.shape.companies.splice(at, 1);
        S.shape.units.concat(S.shape.functions).forEach(function (u) { if (u.company === gone) u.company = ""; });
        S.shapeDirty = true; S.sel = { lvl: "top" }; redraw();
      });
      c.appendChild(x);
    }
    c.appendChild(el("p", "wzwhy", "What is in it keeps everything it holds. A " +
      w("unitword", "one", "business unit") + " or " + w("fnword", "one", "function") +
      " left without one sits straight under the " + W("topword", "one", "company").toLowerCase() + "."));
    host.appendChild(c);
  }
  /* A BOX'S OWN ROW — the units' and functions' list row, unchanged: its
     name, how it plans, and which division it is in (§438, §404.4). Its
     code, its short name for the navigation and who heads it stay where
     they are, on Setup › Business units and on the register (§53.5): one
     answer in one place, and this screen is the shape. */
  function boxPanel(host, k, at){
    var list = kindList(k), row = list[at];
    if (!row) { S.sel = { lvl: "top" }; return drawShapePanel(host); }
    var shape = canShape(), m = shapeMaps();
    var c = el("section", "stcard");
    var h = el("div", "stsech sthd");
    h.appendChild(el("span", "tag", String(row.name || "").trim() || "New " + kindWord(k, "one", "box").toLowerCase()));
    c.appendChild(h);

    var nm = el("input", "fld"); nm.type = "text"; nm.value = row.name || "";
    nm.setAttribute("aria-label", "Name");
    nm.setAttribute("data-shname", k + ":" + at);
    if (!shape) nm.readOnly = true;
    nm.addEventListener("input", function () { row.name = nm.value; S.shapeDirty = true; });
    var nl = el("label", "stnm"); nl.appendChild(el("span", "lab", "Name")); nl.appendChild(nm);
    c.appendChild(nl);

    /* §438: how it plans — the same control the list row carried, and the
       same live switch on a client whose shape is frozen (§436). */
    var fl = el("label", "stnm"); fl.appendChild(el("span", "lab", "Plans in"));
    var sel = el("select", "fld");
    FORMATS.forEach(function (f) {
      var o = el("option", null, f[1]); o.value = f[0];
      if (row.format === f[0]) o.selected = true;
      sel.appendChild(o);
    });
    sel.setAttribute("data-wzfmt", row.key || "");
    sel.setAttribute("aria-label", "How " + (row.name || "this row") + " plans");
    if (!shape) {
      if (!row.key || !OPTS.switchWay) sel.disabled = true;
      else sel.addEventListener("change", function () { liveFormat(k === "bu" ? "unit" : "fn", row.key, sel); });
    } else sel.addEventListener("change", function () { row.format = sel.value; S.shapeDirty = true; });
    fl.appendChild(sel); c.appendChild(fl);

    /* §404.4, §391: WHICH DIVISION IT IS IN — any the client holds, which is
       what this select has always offered, because there is ONE stored list
       of divisions underneath (§544) and putting a box in one is what makes
       that division this kind's. Offering only the kind's own layer's
       divisions was tried first and is a dead end: Raya's functions use
       none, so a function could no longer be put in a division at all, and
       on a client whose shape is frozen there is no way to add one either
       (§436, Islam: *"it belongs to commercial division but I can't change
       that"*). The TREE still draws each kind's own layer; this is how a
       division comes to be on it. */
    var names = (S.shape.companies || []).map(function (c) { return String(c.name || "").trim(); }).filter(Boolean);
    if (!SMPRules.midExists(GROUP, COMPANIES)) names = [];
    if (names.length) {
      var dl = el("label", "stnm");
      dl.appendChild(el("span", "lab", "Its " + layerWordOf(k, "one").toLowerCase()));
      var ds = el("select", "fld");
      ds.dataset.wzdiv = k === "bu" ? "unit" : "fn";
      ds.setAttribute("aria-label", "Which " + layerWordOf(k, "one").toLowerCase() + " " +
        (row.name || "this row") + " belongs to");
      var none = el("option", null, "— needs one —"); none.value = ""; ds.appendChild(none);
      names.forEach(function (d) {
        var o = el("option", null, d); o.value = d;
        if ((row.company || "") === d) o.selected = true;
        ds.appendChild(o);
      });
      if (!shape) {
        if (!row.key) ds.disabled = true;
        else ds.addEventListener("change", function () { liveDivision(k === "bu" ? "unit" : "fn", row.key, ds.value); });
      } else ds.addEventListener("change", function () {
        row.company = ds.value; S.shapeDirty = true;
        S.under = S.under || {}; if (ds.value) S.under[k] = ds.value;
        redraw();
      });
      dl.appendChild(ds); c.appendChild(dl);
    }

    if (shape) {
      var x = el("button", "danger", "Remove this " + kindWord(k, "one", "box").toLowerCase());
      x.type = "button"; x.setAttribute("data-shremove", k + ":" + at);
      x.setAttribute("aria-label", "Remove " + row.name);
      x.addEventListener("click", function () {
        list.splice(at, 1); S.shapeDirty = true; S.sel = { lvl: "top" }; redraw();
      });
      c.appendChild(x);
    }
    c.appendChild(el("p", "wzwhy", k === "bu"
      ? "A " + w("unitword", "one", "business unit") + "'s plan type decides what its pages hold. Its code is made from the name and prefixes every row of its plan."
      : "A " + w("fnword", "one", "function") + "'s plan type decides what its pages hold, and it stays changeable until it has a plan in it."));
    host.appendChild(c);
  }

  function shapeStep(box){
    box.classList.add("wzshape");
    var tree = el("div", "shtree"), panel = el("div", "shpanel");
    drawTree(tree); drawShapePanel(panel);
    box.appendChild(tree); box.appendChild(panel);
    return box;
  }

  /* ── EXCEPT FOR (§435) ───────────────────────────────────────────
     Islam, of Setup › Structure: *"why do we need this page while we have it
     in the client setup?"*, then *"go with 2"*. The per-item adjustments
     (§404's second half) move here, under the layer they are exceptions to,
     and that page goes. Only the items that DIFFER are listed; each chip is
     one part of the first section, plus the second section whole — exactly
     what the old page could change, and nothing of the plan section, whose
     answers stay the layer's. The store is unchanged: `structure.over`,
     written through the same setCompOver, which deletes an answer equal to
     the layer's (§50.6), so an item back on the layer's ticks leaves the
     list by itself. One just picked from the list is held in XADD until its
     first press, or it would vanish the instant it was added.

     NOT FROZEN BY A PLAN (§421): an exception changes what an item shows,
     never which rows exist, and the old page was the office's at any time. */
  var XADD = {};
  function exceptItems(k){
    if (k === "mid") return (COMPANY_KEYS || []).filter(function (c) {
      return COMPANIES[c] && COMPANIES[c].active !== false; }).map(function (c) { return ["co:" + c, COMPANIES[c].name]; });
    if (k === "bu") return activeKeys().map(function (u) { return [u, UNITS[u].name]; });
    if (k === "fn") return (FUNCTION_KEYS || []).filter(function (f) {
      return FUNCTIONS[f] && FUNCTIONS[f].active !== false; }).map(function (f) { return ["fn:" + f, FUNCTIONS[f].name]; });
    if (k === "cap") return (GROUP.capabilities || []).filter(function (c) { return c && c.id && c.active !== false; })
      .map(function (c) { return ["cap:" + c.id, c.name]; });
    return [];
  }
  /* The parts an item on this layer can be given: the first section's
     (offered and built for it), then the second section as one switch. */
  function exceptParts(t){
    var p = firstParts(SMPRules.structLevelOf(t)).filter(function (c) {
      return SMPRules.compOffered(t, c) && SMPRules.compBuilt(t, c); });
    if (SMPRules.compBuilt(t, "swot")) p.push("swot");
    return p;
  }
  function partWord(t, c){
    if (c === "swot") return SMPRules.swotTitle(GROUP, t) ||
      (/^(fn|cap):/.test(t) ? "S&W" : (typeof LTraw === "function" ? LTraw(t, "swot", "many") : "SWOT"));
    return typeof LTraw === "function" ? LTraw(t, c, "many") : (PART_LABEL[c] || c);
  }
  function exceptBox(card, k){
    var items = exceptItems(k);
    if (!items.length) return;
    var over = (SMPRules.structureOf(GROUP) || {}).over || {};
    var box = el("div", "stexcept"); box.setAttribute("data-stexcept", k);
    box.appendChild(el("p", "lab", "Except for"));
    var shown = items.filter(function (it) { return over[it[0]] || XADD[it[0]]; });
    if (!shown.length) box.appendChild(el("p", "stxnone", "Every " +
      w({ mid:"division", bu:"unitword", fn:"fnword", cap:"capability" }[k], "one", "item") +
      " follows the ticks above."));
    shown.forEach(function (it) {
      var t = it[0], row = el("div", "stxrow"); row.setAttribute("data-stxitem", t);
      row.appendChild(el("b", null, it[1]));
      var chips = el("span", "stxchips");
      var lvl = SMPRules.structLevelOf(t), def = SMPRules.levelComponents(GROUP, lvl);
      exceptParts(t).forEach(function (c) {
        var on = SMPRules.compOn(GROUP, t, c), diff = on !== (def.indexOf(c) >= 0);
        var b = el("button", "stxchip" + (on ? " on" : "") + (diff ? " diff" : ""));
        b.type = "button"; b.setAttribute("aria-pressed", String(on));
        b.setAttribute("data-stxover", t + "|" + c);
        var w = partWord(t, c);
        b.setAttribute("aria-label", w + " for " + it[1] + (on ? ": shown" : ": hidden") + (diff ? ", differs from the layer" : ""));
        b.title = diff ? "Differs from the ticks above" : "Same as the ticks above";
        b.appendChild(el("i")); b.appendChild(document.createTextNode(w));
        b.addEventListener("click", function () {
          delete XADD[t];
          setCompOver(t, c, !SMPRules.compOn(GROUP, t, c));
          redraw();
        });
        chips.appendChild(b);
      });
      row.appendChild(chips);
      var rm = el("button", "linkbu", "Remove"); rm.type = "button";
      rm.setAttribute("aria-label", "Put " + it[1] + " back on the ticks above");
      rm.addEventListener("click", function () {
        delete XADD[t];
        var s = SMPRules.structureOf(GROUP);
        if (s && s.over && s.over[t]) {
          delete s.over[t];
          if (!Object.keys(s.over).length) delete s.over;
          if (!Object.keys(s).length) delete GROUP[SMPRules.STRUCTURE];
        }
        redraw();
      });
      row.appendChild(rm);
      box.appendChild(row);
    });
    var rest = items.filter(function (it) { return !over[it[0]] && !XADD[it[0]]; });
    if (rest.length) {
      var sel = el("select", "fld stxadd");
      sel.setAttribute("aria-label", "Make an exception");
      var o0 = el("option", null, "Make an exception for…"); o0.value = ""; sel.appendChild(o0);
      rest.forEach(function (it) { var o = el("option", null, it[1]); o.value = it[0]; sel.appendChild(o); });
      sel.addEventListener("change", function () { if (!sel.value) return; XADD[sel.value] = true; redraw(); });
      box.appendChild(sel);
    }
    card.appendChild(box);
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
           at: function () { return S ? STEPS[S.at].k : null; },
           /* §608: and for the shell's leave question, which puts the flow back
              on the step a colour is waiting on — no commit, no redraw of its
              own: the shell's paint that follows draws it. */
           toStep: function (k) { if (S) S.at = stepIdx(k); } };
})();
