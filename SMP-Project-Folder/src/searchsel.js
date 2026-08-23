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
    var o = sel.options[sel.selectedIndex];
    return o ? o.text : "";
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

  function setLabel(sel, btn){
    btn.querySelector(".sslabel").textContent = textOf(sel) || "—";
    btn.title = textOf(sel) || "";
  }

  function openFor(sel, btn){
    close();
    var pop = document.createElement("div");
    pop.className = "sspop";
    pop.setAttribute("role", "listbox");

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

    var rows = [];
    Array.prototype.forEach.call(sel.options, function(op){
      var r = document.createElement("button");
      r.type = "button";
      r.className = "ssrow" + (op.value === sel.value ? " on" : "");
      r.textContent = op.text || "—";
      r.setAttribute("role", "option");
      r.setAttribute("aria-selected", op.value === sel.value);
      r._q = (op.text || "").toLowerCase();
      r.addEventListener("click", function(){ choose(sel, btn, op.value); });
      rows.push(r);
      list.appendChild(r);
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
      if (first && document.activeElement === q) { e.preventDefault(); first.click(); }
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
    var onGone = function(e){
      if (e && e.target && e.target.nodeType === 1 && pop.contains(e.target)) return;
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

  function enhance(sel){
    if (sel.multiple || sel.disabled) return;
    if (sel.dataset.nosearch === "1") return;
    if (sel.options.length < MIN) return;
    if (sel.dataset.ss === "1") {           /* already wrapped this paint */
      var prev = sel.previousSibling;
      if (prev && prev.classList && prev.classList.contains("ssbtn")) {
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
