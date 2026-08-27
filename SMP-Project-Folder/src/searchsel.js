/* ══ A DROPDOWN YOU CAN TYPE INTO ═════════════════════════════════════
   Islam, 2026-08-22: "for the figures setting make all the drop downs beyond
   5 items searchable, this might apply to any selection list in the platform."

   It does, so this is not a control the Figure sets page owns. It is an
   ENHANCEMENT applied to every <select> in the platform once its list passes
   five options, and it is written the way it is for one reason above all:

   THE NATIVE <select> STAYS. It is not replaced, not moved, and not
   reparented — it is hidden in place, and a button is inserted in front of it.
   Everything that already exists keeps working untouched: `data-setowner`,
   `data-prole-where`, `[data-coflag]`, every `addEventListener("change")` that
   wire() attaches, and every `sel.value` read. Choosing a name from the list
   sets the select and fires a real `change` on it, so the handler that saves
   it never learns there was a search box. A component that replaced the
   selects would have needed all of that rewired, and rewiring a control that
   feeds the authorisation matrix to add a search box is not a trade worth
   making.

   FIVE IS THE THRESHOLD, NOT A GUESS. Direction (2), compile rule (3), who
   picks a set's figures (2) are all answered by looking; a list of twenty-nine
   people is not, and that is the one the SMO uses most. Below six options
   nothing changes at all, which is why this can be applied to everything
   without an inventory of what deserves it.

   THREE RULES IT HAD TO OBEY, all of them already paid for elsewhere:

   1. TYPING NEVER REPAINTS (§35). The filter hides rows in place. A repaint
      would replace the input being typed into, which is the same family of
      fault as §30.1.
   2. THE DOM IS CLEANED UP BEFORE THE CHANGE FIRES (§30.1). Selecting an
      option repaints the whole panel, so the popup is closed and unhooked
      FIRST and nothing touches the DOM afterwards.
   3. WHOEVER HIDES A FIELD HIDES ITS FURNITURE (§34). `sync.js` hides the
      viewer switcher for anyone who is not the SMO by setting `hidden` on the
      select itself; the button follows it, or a non-SMO would get a live
      control in front of a hidden field.

   The popup is position:fixed and closes on scroll. Not a preference: `.cfg`
   is `overflow-x:auto`, which computes overflow-y to auto as well, so an
   absolutely positioned popup inside a settings table is CLIPPED by its own
   table. Fixed positioning is the only kind that escapes an overflow ancestor
   without knowing there was one. */
var SEARCHSEL = (function(){
  var MIN = 6;             /* "beyond 5 items" */
  var open = null;

  function textOf(sel){
    if (sel.multiple) return chosenTexts(sel).join(", ");
    var o = sel.options[sel.selectedIndex];
    return o ? o.text : "";
  }
  /* In the select's OWN order, never the order they were ticked: the cell has
     to read the same after a repaint as it did before one, and the ticking
     order is not something the data keeps. */
  function chosenTexts(sel){
    var out = [];
    Array.prototype.forEach.call(sel.options, function(op){
      if (op.selected) out.push(op.text);
    });
    return out;
  }

  function close(){
    if (!open) return;
    var o = open;
    open = null;
    document.removeEventListener("mousedown", o.onDoc, true);
    document.removeEventListener("keydown", o.onKey, true);
    window.removeEventListener("scroll", o.onGone, true);
    window.removeEventListener("resize", o.onGone, true);
    if (o.pop.parentNode) o.pop.parentNode.removeChild(o.pop);
    o.btn.setAttribute("aria-expanded", "false");
  }

  /* The popup is measured against the button and flipped above it when there
     is no room below — a list that opens off the bottom of the window is a
     list you cannot reach the end of. */
  function place(btn, pop){
    var r = btn.getBoundingClientRect();
    var h = pop.offsetHeight, w = pop.offsetWidth;
    var below = window.innerHeight - r.bottom - 8;
    var top = (below >= h || r.top < h + 8) ? r.bottom + 4 : r.top - h - 4;
    var left = Math.min(r.left, Math.max(8, window.innerWidth - w - 8));
    pop.style.top = Math.max(8, top) + "px";
    pop.style.left = left + "px";
  }

  function choose(sel, btn, value){
    /* Cleanup FIRST. `change` repaints the panel, which destroys everything
       below — including the popup this click is still inside (§30.1). */
    close();
    if (sel.value === value) return;
    sel.value = value;
    setLabel(sel, btn);
    sel.dispatchEvent(new Event("change", { bubbles: true }));
  }

  /* ── TICKING IS NOT ANSWERING (§130.1) ──────────────────────────────
     The single-select path above closes the popup BEFORE it fires `change`,
     because picking one option answers the question and because `change`
     repaints the panel the popup is standing in (§30.1). Neither is true of a
     list you are ticking: the question is not answered until you stop, so the
     popup STAYS OPEN and every tick commits on its own.

     WHAT MAKES THAT SAFE IS THE HANDLER, and it is worth writing down because
     the next person to add one will not know: every field this control is used
     on goes through the shell's one `data-fld` listener, which writes the value
     and saves and DOES NOT REPAINT (§71.2). Wire a multiple select to a handler
     that calls paint() and the popup will vanish under the pointer on the first
     tick — the same fault §30.1 records, arriving by the other road.

     COMMITTED PER TICK RATHER THAN ON CLOSE, deliberately. Holding the change
     until the popup shuts would mean firing it from close(), and close() is the
     first thing wire() does at the end of every paint() — by which time FIELDS
     has been rebuilt and this element's `data-fld` index points at somebody
     else's setter (§96's registry, read one paint too late). */
  function toggle(sel, btn, op, row){
    op.selected = !op.selected;
    row.classList.toggle("on", op.selected);
    row.setAttribute("aria-selected", op.selected ? "true" : "false");
    setLabel(sel, btn);
    sel.dispatchEvent(new Event("change", { bubbles: true }));
  }

  function setLabel(sel, btn){
    /* An em-dash for nothing chosen, which is the word the plan's own cells
       already use for nobody (§15.1: absent, never zero). */
    btn.querySelector(".sslabel").textContent = textOf(sel) || "—";
    btn.title = textOf(sel) || "";
  }

  function openFor(sel, btn){
    close();
    var many = !!sel.multiple;
    var pop = document.createElement("div");
    pop.className = "sspop" + (many ? " ssmany" : "");
    pop.setAttribute("role", "listbox");
    if (many) pop.setAttribute("aria-multiselectable", "true");

    var q = document.createElement("input");
    q.type = "text";
    q.className = "fld sssearch";
    q.placeholder = "Search…";
    q.autocomplete = "off";
    q.setAttribute("aria-label", "Search this list");

    var list = document.createElement("div");
    list.className = "sslist";
    var none = document.createElement("div");
    none.className = "ssempty";
    none.textContent = "Nothing matches.";
    none.hidden = true;

    /* An <optgroup> is a heading over the options inside it, so the rows are
       walked through the groups rather than off `sel.options` — otherwise the
       People and Departments a plan picks from arrive as one undifferentiated
       list of fifty. The heading is not a row: it filters with the group and
       disappears when nothing under it matches, or a search for one name
       leaves two empty headings standing over it. */
    var rows = [], groups = [];
    var addRow = function(op, into){
      var on = many ? op.selected : (op.value === sel.value);
      var r = document.createElement("button");
      r.type = "button";
      r.className = "ssrow" + (on ? " on" : "");
      r.textContent = op.text || "—";
      /* WHERE THIS ONE IS FROM, QUIETLY (§130.9). A hint on the option rides
         into the row and nowhere else — the button's label and the value the
         field stores are the option's TEXT, which is the name on its own. It
         joins what is SEARCHED, so typing a unit's name finds the people in
         it; a hint you can see and cannot search for is half a control. */
      var hint = op.dataset && op.dataset.hint;
      if (hint) {
        var h = document.createElement("span");
        h.className = "sshint";
        h.textContent = hint;
        r.appendChild(h);
      }
      r.setAttribute("role", "option");
      r.setAttribute("aria-selected", on ? "true" : "false");
      r._q = ((op.text || "") + " " + (hint || "")).toLowerCase();
      r.addEventListener("click", function(){
        if (many) toggle(sel, btn, op, r); else choose(sel, btn, op.value);
      });
      rows.push(r);
      into.appendChild(r);
    };
    Array.prototype.forEach.call(sel.children, function(node){
      if (node.tagName === "OPTGROUP") {
        var box = document.createElement("div");
        box.className = "ssgrp";
        var h = document.createElement("div");
        h.className = "ssgrph";
        h.textContent = node.label || "";
        box.appendChild(h);
        Array.prototype.forEach.call(node.children, function(op){ addRow(op, box); });
        groups.push(box);
        list.appendChild(box);
      } else if (node.tagName === "OPTION") {
        addRow(node, list);
      }
    });

    /* Hides rows in place. Never re-renders the list, never touches the input
       being typed into (§35). */
    q.addEventListener("input", function(){
      var s = q.value.trim().toLowerCase(), n = 0;
      rows.forEach(function(r){
        var hit = !s || r._q.indexOf(s) > -1;
        r.hidden = !hit;
        if (hit) n++;
      });
      groups.forEach(function(g){
        g.hidden = !Array.prototype.some.call(g.querySelectorAll(".ssrow"),
          function(r){ return !r.hidden; });
      });
      none.hidden = n > 0;
    });

    pop.appendChild(q);
    pop.appendChild(list);
    pop.appendChild(none);
    document.body.appendChild(pop);
    pop.style.minWidth = Math.max(200, btn.offsetWidth) + "px";
    place(btn, pop);
    btn.setAttribute("aria-expanded", "true");

    var onDoc = function(e){ if (!pop.contains(e.target) && e.target !== btn) close(); };
    var onKey = function(e){
      if (e.key === "Escape") { close(); btn.focus(); return; }
      if (e.key !== "Enter") return;
      /* Enter takes the first row still showing — the whole point of typing
         three letters is not having to reach for the mouse afterwards. */
      var first = rows.filter(function(r){ return !r.hidden; })[0];
      if (first && document.activeElement === q) {
        e.preventDefault();
        first.click();
        /* On a list you are TICKING, Enter has to leave the search box alone:
           the whole point of typing three letters is to tick and type three
           more. The single-select path has already closed by now. */
        if (many) { q.select(); }
      }
    };
    /* IT FOLLOWS THE BUTTON NOW, RATHER THAN CLOSING (§51.6, Islam: "the
       where it goes list needs to be scrollable as on scrolling it closes").

       It used to close on any scroll, and the note here argued that closing
       was honest because the popup is `position:fixed` and would otherwise
       hang beside nothing. That reasoning held while every list was short
       enough to sit inside the viewport. A LIST LONG ENOUGH TO SCROLL BREAKS
       IT: reaching for the twelfth entry scrolls the popup's own list, that
       scroll bubbles to the window with capture on, and the control shuts
       under the pointer. The list you cannot scroll is the list you cannot
       use.

       So a scroll INSIDE the popup is left alone, and a scroll anywhere else
       REPOSITIONS rather than closes — the cost §28.3 warned about is one
       getBoundingClientRect per scroll frame on an element that is already
       fixed, which measures nothing and changes nobody's height (§28.3's real
       rule was never size against a measured value; this only moves). It
       still closes when the button it belongs to has left the screen, because
       a popup pointing at nothing is worse than a closed one. */
    /* AND A 1px CLIPPED ELEMENT SCROLLING IS NEVER THE PAGE MOVING (§130.1).
       Setting `selected` on a `<select multiple>` makes the browser scroll the
       native list box to the option — and it fires a real `scroll` event doing
       it, from an element that is 1px square, clipped and invisible (see
       `.ss-native`). With capture on, that reached here as though somebody had
       scrolled the window: every tick re-placed the popup, and a tick on a
       control near the fold CLOSED it, because the button honestly is off
       screen down there. Found by ticking, not by reading — the single-select
       path never sets `selected` on anything, so nothing has ever fired it. */
    var onGone = function(e){
      if (e && e.target && e.target.nodeType === 1 &&
          (pop.contains(e.target) ||
           (e.target.classList && e.target.classList.contains("ss-native")))) return;
      var r = btn.getBoundingClientRect();
      if (r.bottom < 0 || r.top > innerHeight || r.right < 0 || r.left > innerWidth) { close(); return; }
      place(btn, pop);
    };

    document.addEventListener("mousedown", onDoc, true);
    document.addEventListener("keydown", onKey, true);
    window.addEventListener("scroll", onGone, true);
    window.addEventListener("resize", onGone, true);

    open = { native: sel, btn: btn, pop: pop, onDoc: onDoc, onKey: onKey, onGone: onGone };
    q.focus();
  }

  /* ── THE BUTTON IS FOUND BY REFERENCE, NOT BY POSITION (§69.18) ─────
     This was `sel.previousSibling`, and rule 3 above — "the button follows
     [the select's hidden], or a non-SMO would get a live control in front of a
     hidden field" — is EXACTLY what stopped happening. sync.js hides the
     switcher for a non-SMO and then inserts their name with
     `box.insertBefore(nm, sel)`: the name lands BETWEEN the button and the
     select, `previousSibling` stops being the button, the sync is skipped, and
     the button stays live and visible showing whoever it was built with.

     Ashraf saw "Signed in as [Mohamed Essam ▾]" beside his own name — a live
     viewer switcher, on a screen where it must never appear, offering the SMO
     as the person signed in.

     The comment beside the insertion even anticipated the shape of it:
     "sync.js reaches for the viewer select by id and inserts a name beside it
     — reparenting the select would break that." It guarded against
     REPARENTING and not against INSERTING BETWEEN. A WeakMap cannot be broken
     by either: the pairing is held by identity rather than by adjacency, and
     nothing in the DOM has to stay next to anything. */
  var BTN_OF = (typeof WeakMap === "function") ? new WeakMap() : null;
  function buttonFor(sel){
    var b = BTN_OF && BTN_OF.get(sel);
    if (b && b.isConnected) return b;
    /* A page old enough to have been wired before this existed, or a browser
       with no WeakMap: fall back to the position, which is right whenever
       nothing has been inserted between them. */
    var prev = sel.previousSibling;
    return (prev && prev.classList && prev.classList.contains("ssbtn")) ? prev : null;
  }

  function enhance(sel){
    if (sel.disabled) return;
    if (sel.dataset.nosearch === "1") return;
    /* A MULTIPLE SELECT IS ALWAYS ENHANCED, whatever it holds (§130.1). The
       five-option floor is about whether a short list is worth a search box;
       the native multiple select is a scrolling list box that ctrl-clicks, and
       it is not a control this product uses anywhere. Below the floor there is
       still nothing to search — the box is there and matches nothing away. */
    if (!sel.multiple && sel.options.length < MIN) return;
    if (sel.dataset.ss === "1") {           /* already wrapped this paint */
      var prev = buttonFor(sel);
      if (prev) {
        setLabel(sel, prev);
        prev.hidden = sel.hidden;
      }
      return;
    }
    sel.dataset.ss = "1";
    sel.classList.add("ss-native");
    /* OUT OF THE TAB ORDER, AND OUT OF THE ACCESSIBILITY TREE. Hiding the
       select in place left it TABBABLE — and the focus handler below bounces
       its focus straight back to the button, so Tab went button → select →
       button → button … and NOTHING ELSE ON THE PAGE WAS EVER REACHABLE by
       keyboard. Every page carries at least one of these, so from v3.15 until
       now the whole product was a keyboard trap on its first control.

       The lesson is the one §34 already records from the other direction:
       whoever hides a field hides its furniture. Visually hidden is not
       hidden — `tabindex` and `aria-hidden` are what remove a control from the
       two trees that are not the visual one. */
    sel.tabIndex = -1;
    sel.setAttribute("aria-hidden", "true");

    var btn = document.createElement("button");
    btn.type = "button";
    btn.className = "ssbtn" + (sel.className.indexOf("selbox") > -1 ? " selbox" : "");
    btn.setAttribute("aria-haspopup", "listbox");
    btn.setAttribute("aria-expanded", "false");
    /* AN ELEMENT, NOT A TEXT NODE. The label was appended bare, so the rule
       meant to truncate it — `.ssbtn > :first-child` — matched the CARET,
       because :first-child selects the first ELEMENT child and a text node is
       not one. The label therefore had no `white-space:nowrap` and the button
       WRAPPED. Invisible until a name got long enough: "Mohamed Essam — Head
       of the Strategy Management Office" in the 150px viewer switcher is what
       finally showed it. */
    var lab = document.createElement("span");
    lab.className = "sslabel";
    btn.appendChild(lab);
    var car = document.createElement("span");
    car.className = "sscar";
    car.setAttribute("aria-hidden", "true");
    car.textContent = "▾";
    btn.appendChild(car);
    setLabel(sel, btn);
    /* Inserted as a SIBLING, never as a parent. sync.js reaches for the
       viewer select by id and inserts a name beside it — reparenting the
       select would break that from a file this component has never heard of. */
    sel.parentNode.insertBefore(btn, sel);
    if (BTN_OF) BTN_OF.set(sel, btn);
    btn.hidden = sel.hidden;

    btn.addEventListener("click", function(e){
      e.preventDefault();
      if (open && open.native === sel) close(); else openFor(sel, btn);
    });
    /* The label still points at the select, and something else may set the
       value (the viewer switcher does, from sync.js). Both are answered here
       rather than by asking every caller to know about this file.

       The focus bounce stays for the LABEL's sake — clicking "Viewing as"
       focuses the select it is `for`, and that should land on the button — but
       it can no longer be reached by Tab, so it cannot loop. */
    sel.addEventListener("focus", function(){ btn.focus(); });
    /* The visible control inherits the hidden one's name, so a screen reader
       is told what the control is FOR rather than only what it currently says
       (§48.2). Without it the viewer switcher announces a person's name with
       no hint that it switches anything. */
    var lbl = sel.id && document.querySelector('label[for="' + sel.id + '"]');
    var name = (lbl && lbl.textContent.trim()) || sel.getAttribute("aria-label");
    if (name) btn.setAttribute("aria-label", name);
    sel.addEventListener("change", function(){ setLabel(sel, btn); });
  }

  return {
    wire: function(){
      close();
      document.querySelectorAll("select").forEach(enhance);
    },
    close: close
  };
})();
