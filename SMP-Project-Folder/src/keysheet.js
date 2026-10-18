/* ══ WHAT THE KEYS DO (§539) ═══════════════════════════════════════════════
   Usability audit, heuristic 7. Its headline finding is that the platform has
   ONE keyboard idiom and it is the projector. Measured against the sources it
   has FOUR — the projector, §528's reporting keys, §536's dropdown and
   `arrange.js`'s row move — and the finding the audit does not make is the one
   this file answers: NOTHING ON ANY SCREEN SAYS SO. There was no list of keys
   anywhere in the product. §528's hints ride a hover and a per-control
   `aria-keyshortcuts`, so the only way to discover Alt+Enter was to hover the
   one button that carries it. Four idioms, no index.

   THIS BINDS NO NEW SHORTCUT. Every key below already works; what is new is
   that they are written down. Islam chose treatment A of the drawing
   (`design-mockups/shortcuts-sheet/`): the whole product, with the sections
   that work HERE marked — so a reporter learns the deck and the lists have
   keys too, which is the thing nobody could find out.

   EACH SECTION ASKS THE MODULE THAT OWNS IT whether it is live, through that
   module's OWN marker, never through a rule copied here (§53.5): the reporting
   boxes through `REP_BOXES` itself — the string shell.html names once and the
   walks already read — the dropdown through `data-ss`, the row move through
   `.grip`, the deck through `#deckroot.on`. A second copy of any of those is
   the one somebody forgets the day a selector changes.

   AND THE SHEET IS WHERE THE NEXT ONE GOES. If an accelerator is added later
   for Submit, Save draft or moving between destinations, it appears here
   rather than in another tooltip nobody hovers. */
var KEYSHEET = (function(){

  function has(sel){
    try { return !!document.querySelector(sel); } catch (e) { return false; }
  }

  /* ── IS THIS SECTION LIVE WHERE I AM STANDING ─────────────────────────
     Read at the moment the sheet opens, never cached: the answer changes with
     the page, and a cached one would mark a reporter's keys live on Setup. */
  var LIVE = {
    /* Escape and Tab are the platform's, everywhere, always. */
    anywhere: function(){ return true; },
    /* searchsel marks every select it has enhanced (§45.5, §536). */
    lists: function(){ return has('[data-ss="1"]'); },
    /* shell.html's own REP_BOXES, read rather than copied (§104.7, §53.5). */
    figures: function(){
      return typeof REP_BOXES === "string" && has(REP_BOXES);
    },
    /* §546: live where any of the three controls is actually on screen. */
    acts: function(){
      return has("[data-submit]") || has("[data-repsave]") ||
             has(".penbtn[data-page], .secpen[data-page], .editbtn[data-page]");
    },
    /* arrange.js draws a `.grip` on every row it can move (§266.10). */
    rows: function(){ return has(".grip"); },
    /* §544: a row worth walking is one with somewhere to walk to. Counted
       rather than assumed — a tablist holding a single tab answers the arrows
       and has nothing to say about it. */
    tabs: function(){
      var out = false;
      Array.prototype.forEach.call(document.querySelectorAll('[role="tablist"]'), function(l){
        if (out) return;
        var n = Array.prototype.filter.call(l.querySelectorAll('[role="tab"]'),
          function(t){ return t.offsetParent !== null; }).length;
        if (n >= 2) out = true;
      });
      return out;
    },
    /* present.js puts `on` on the deck's root while it is showing (§265). */
    deck: function(){
      var d = document.getElementById("deckroot");
      return !!d && d.classList.contains("on");
    }
  };

  /* ── THE SHEET ────────────────────────────────────────────────────────
     Prose about behaviour, so it is prose: each line says what the key DOES
     in the words the product uses for it, not the name of the function it
     calls. `keys` is drawn as keycaps; `says` is drawn as an instruction,
     because "type" is a thing you do and not a key you press. */
  var SECTIONS = [
    { id:"anywhere", name:"Anywhere", where:"",
      rows:[
        { keys:[["Esc"]], what:"Close what is open — a question, a panel, the chat corner" },
        { keys:[["Tab"], ["Shift","Tab"]], what:"Move between controls" }
      ] },
    { id:"lists", name:"Any long list", where:"the box you type into to pick",
      rows:[
        { says:"type", what:"Narrow the list as you go" },
        { keys:[["↓"], ["↑"]], what:"Move the mark, wrapping at the ends" },
        { keys:[["Home"], ["End"]], what:"First or last of what is showing" },
        { keys:[["Enter"]], what:"Take the marked row — or the first one showing" }
      ] },
    /* §546 — ADDED THE DAY THE KEYS WERE (§539's own reason for existing). */
    { id:"acts", name:"Doing the thing", where:"a report, or a page you can edit",
      rows:[
        { keys:[["Alt","S"]], what:"Go to Submit — then Enter sends it" },
        { keys:[["Alt","D"]], what:"Save draft" },
        { keys:[["Alt","E"]], what:"The pen, on or off" },
        { keys:[["Alt","G"]], what:"Go to another place — type a few letters" }
      ] },
    { id:"figures", name:"Entering figures", where:"Reporting",
      rows:[
        { keys:[["Enter"]], what:"The next figure" },
        { keys:[["Shift","Enter"]], what:"The one before" },
        { keys:[["Alt","Enter"]], what:"Jump to the next thing still owed" },
        { keys:[["Alt","N"]], what:"The note for this row" },
        { keys:[["Esc"]], what:"Put the box back as it was" }
      ] },
    /* §544 — ADDED THE DAY THE KEYS WERE, which is the whole reason this
       sheet exists: the alternative is a fifth idiom nobody can discover. */
    { id:"tabs", name:"A row of tabs", where:"places, tabs, sections",
      rows:[
        { keys:[["←"], ["→"]], what:"Move along the row, wrapping at the ends" },
        { keys:[["Home"], ["End"]], what:"First or last tab on the row" },
        { keys:[["Enter"]], what:"Open the one you have landed on" }
      ] },
    { id:"rows", name:"Moving a row", where:"wherever rows can be rearranged",
      rows:[
        { keys:[["↑"], ["←"]], what:"Up one" },
        { keys:[["↓"], ["→"]], what:"Down one" }
      ] },
    { id:"deck", name:"Presenting", where:"the deck",
      rows:[
        { keys:[["→"], ["↓"], ["Space"]], what:"Next slide" },
        { keys:[["←"], ["↑"]], what:"Back one" },
        { keys:[["Home"], ["End"]], what:"First or last slide" },
        { keys:[["F"]], what:"Fullscreen" },
        { keys:[["W"]], what:"Fit to the window" },
        { keys:[["P"]], what:"Pause the clock" },
        { keys:[["Esc"]], what:"Leave fullscreen, then leave the deck" }
      ] }
  ];

  function esc(s){
    return String(s == null ? "" : s)
      .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  function capsHtml(combo){
    /* One combo is a run of caps joined by +; the alternatives beside it are
       joined by a thin "/", which is the product's own way of saying "either". */
    return combo.map(function(k){ return '<kbd>' + esc(k) + '</kbd>'; }).join("+");
  }

  function rowHtml(r){
    var left = r.says
      ? '<span class="ks-typ">' + esc(r.says) + '</span>'
      : r.keys.map(capsHtml).join('<span class="ks-or">/</span>');
    return '<span class="ks-k">' + left + '</span>' +
           '<span class="ks-v">' + esc(r.what) + '</span>';
  }

  function sectionHtml(s){
    var live = LIVE[s.id] ? LIVE[s.id]() : false;
    return '<h4 class="mini">' + esc(s.name) +
      (s.where ? '<span class="ks-where">' + esc(s.where) + '</span>' : '') +
      /* THE MARK IS A WORD AND NOT A COLOUR (§68.10's rule from the other
         side): "here" is read by somebody who cannot tell the green from the
         grey, and it is what the section means. */
      (live ? '<span class="ks-here">here</span>' : '') + '</h4>' +
      '<div class="ks-rows' + (live ? '' : ' ks-dim') + '">' +
        s.rows.map(rowHtml).join("") + '</div>';
  }

  function bodyHtml(){
    return SECTIONS.map(sectionHtml).join("") +
      '<p class="ks-foot">Open this with <kbd>?</kbd> from anywhere you are not ' +
      'typing, or from the <b>?</b> beside Light and Dark.</p>';
  }

  function open(){
    if (typeof openModalHtml !== "function") return false;
    openModalHtml("Keyboard",
      "Everything the platform answers. The marked ones work on this screen.",
      bodyHtml());
    return true;
  }

  /* ── THE TWO WAYS IN ──────────────────────────────────────────────────
     A key AND a button, because a sheet you can only reach by already knowing
     the key to reach it is this section's own fault one level up. */
  function typing(el){
    if (!el) return false;
    if (el.isContentEditable) return true;
    var t = el.tagName;
    return t === "INPUT" || t === "TEXTAREA" || t === "SELECT";
  }

  function wire(){
    var bar = document.getElementById("topacts");
    if (bar && !document.getElementById("keysbtn")) {
      var b = document.createElement("button");
      b.id = "keysbtn";
      b.type = "button";
      b.className = "infobtn keysbtn";
      b.textContent = "?";
      b.setAttribute("aria-label", "Keyboard shortcuts");
      b.title = "Keyboard shortcuts";
      b.setAttribute("aria-keyshortcuts", "?");
      b.addEventListener("click", open);
      bar.appendChild(b);
    }
    document.addEventListener("keydown", function(e){
      if (e.key !== "?") return;
      if (e.ctrlKey || e.metaKey || e.altKey) return;
      /* NOT WHILE SOMEBODY IS TYPING. Most of this product is fields, and a
         question mark is a character somebody means to write — in a note, in a
         capability's name. The guard is the one §528's keys already use. */
      if (typing(e.target)) return;
      /* NOT OVER THE DECK, and this is a refusal rather than an oversight: the
         modal is outside the fullscreen element, so in fullscreen it would
         open where nobody can see it — a control that looks live and does
         nothing, which is the thing §534 spent thirty conversions removing.
         The deck's own keys are on the sheet for whoever reads it beforehand. */
      var d = document.getElementById("deckroot");
      if (d && d.classList.contains("on")) return;
      if (open()) e.preventDefault();
    });
  }

  return { wire: wire, open: open,
           /* for the checks */
           sections: function(){ return SECTIONS; },
           live: function(){
             var out = {};
             SECTIONS.forEach(function(s){ out[s.id] = LIVE[s.id] ? LIVE[s.id]() : false; });
             return out;
           } };
})();
