/* ══ GOING TO A PLACE (§547) ═══════════════════════════════════════════════
   Usability audit, heuristic 7, last piece. Alt+G opens a list of every place
   you can reach, you type a few letters, and Enter takes you there. Islam
   picked the letter, joining §546's Alt+S, Alt+D and Alt+E.

   A KEY PER DESTINATION IS NOT POSSIBLE, and that is why this shape and not a
   row of them: the places are each tenant's own units, capabilities,
   functions and divisions. There is nothing fixed to bind.

   ── ALMOST NONE OF THIS IS NEW, WHICH IS THE ARGUMENT FOR IT ──────────

   THE LIST IS THE NAVIGATION'S OWN BUTTONS, read off the page. Measured
   before this was written: every destination is in the DOM at once as a
   `[data-u]` button, including the ones inside closed folds. So there is no
   second idea of what the places are (§53.5) and a place added tomorrow
   appears here without anybody being told.

   PICKING A ROW PRESSES THE REAL BUTTON, which is exactly what the product's
   own `[data-gounit]` jump already does. Everything a normal click does —
   dropping out of edit mode, landing on the tab that place opens on — happens
   here because it IS the same press. A second route to a destination is a
   second place for that behaviour to drift.

   AND THE LIST ITSELF IS `searchsel`'s, not a copy of it. The box, the rows,
   the match-anywhere, and every key §536 gave it — arrows, Home, End, Enter,
   Escape, `aria-activedescendant` — arrive by handing it a `<select>` and
   calling `openOn`, the entry the register already uses to reopen a list
   after a repaint. Writing a second popup here would be writing §536 again
   and then maintaining both.

   ONE THING `searchsel` HAD TO LEARN: it enhances a single select only past
   five options, which is the right rule for a form field and the wrong one
   here — a tenant with four places needs this list more than one with forty,
   not less. `data-ss-always` is the opt-in, and it is one line there rather
   than a second popup here.

   THE HOST IS INERT. The select and the button `searchsel` builds for it are
   plumbing, never controls: both are taken out of the tab order and out of
   the accessibility tree, so a host left standing after the popup closes is
   nothing anybody can reach. §536's own comment records what happens when a
   hidden select keeps its furniture — the whole product became a keyboard
   trap on its first control. */
var GOTO = (function(){

  var HOST = "gotohost";

  /* THE LABEL IS THE BUTTON'S OWN WORDS, and only its first text node: the
     count badge is a `<span>` inside the same button, so reading the button
     whole gives "Distribution3 business units". */
  function label(b){
    var first = b.firstChild;
    var t = (first && first.nodeType === 3) ? first.textContent : b.textContent;
    return String(t || "").replace(/\s+/g, " ").trim();
  }

  function places(){
    var out = [];
    Array.prototype.forEach.call(document.querySelectorAll("[data-u]"), function(b){
      if (b.closest("#" + HOST)) return;           /* never our own plumbing */
      if (b.offsetParent === null) return;         /* not drawn for this viewer */
      if (!label(b)) return;
      out.push(b);
    });
    return out;
  }

  /* THE POPUP IS `searchsel`'s AND LIVES ON <body>, so taking the host away
     does not take it with it. Escape hid that: searchsel's own handler closes
     the popup, so the two looked like one act until a check called close()
     by itself and the next press found a list already open. Both halves, in
     one place, because a half-close is how a control comes back wrong. */
  function shut(){
    if (typeof SEARCHSEL !== "undefined" && SEARCHSEL.close) SEARCHSEL.close();
    var h = document.getElementById(HOST);
    if (h) h.remove();
  }

  function open(){
    if (typeof SEARCHSEL === "undefined" || !SEARCHSEL.openOn) return false;
    var btns = places();
    /* NOTHING TO CHOOSE IS NOT A LIST (§61). Somebody who reaches one place
       is not shown a picker that can only take them where they already are. */
    if (btns.length < 2) return false;
    shut();

    var host = document.createElement("div");
    host.id = HOST;
    var sel = document.createElement("select");
    sel.className = "fld";
    sel.dataset.ssAlways = "1";
    sel.setAttribute("aria-label", "Go to a place");
    btns.forEach(function(b, i){
      var o = document.createElement("option");
      /* THE KEY, NOT THE BUTTON. Held as an index into a list of ELEMENTS,
         this pressed whichever button was on the page when the list opened —
         and a repaint between opening and picking replaces them, so it was
         pressing a node no longer in the document. It still navigated, because
         a listener bound to a detached element still fires, which is exactly
         the kind of working-by-luck that stops working. The live button is
         found at the moment of the press, which is what `[data-gounit]` has
         always done (§53.5). */
      o.value = b.dataset.u;
      o.text = label(b);
      /* IT OPENS ON WHERE YOU ARE, marked and under the cursor — so Alt+G
         then Escape costs nothing and the list reads as a map rather than a
         blank box. The current place is the nav's own `aria-current` or the
         selected tab, read from it rather than decided here. */
      if (b.getAttribute("aria-current") === "true" ||
          b.getAttribute("aria-selected") === "true") o.selected = true;
      sel.appendChild(o);
    });
    host.appendChild(sel);
    document.body.appendChild(host);

    SEARCHSEL.wire();
    sel.addEventListener("change", function(){
      var key = sel.value;
      shut();
      var b = document.querySelector('[data-u="' + (window.CSS && CSS.escape
        ? CSS.escape(key) : key.replace(/"/g, '\\"')) + '"]');
      if (b) b.click();
    });

    /* The button searchsel just built is plumbing too (see the head of this
       file): out of both trees, so a host left standing is unreachable. */
    var btn = host.querySelector("button");
    if (btn) { btn.tabIndex = -1; btn.setAttribute("aria-hidden", "true"); }

    if (!SEARCHSEL.openOn(sel)) { shut(); return false; }
    /* Escape closes the popup in searchsel's own handler; the host goes with
       it rather than being left for the next open to find. */
    document.addEventListener("keydown", function esc(e){
      if (e.key !== "Escape") return;
      document.removeEventListener("keydown", esc, true);
      setTimeout(shut, 0);
    }, true);
    return true;
  }

  function typing(el){
    if (!el) return false;
    if (el.isContentEditable) return true;
    var t = el.tagName;
    return t === "INPUT" || t === "TEXTAREA" || t === "SELECT";
  }

  function wire(){
    document.addEventListener("keydown", function(e){
      if (e.defaultPrevented) return;
      if (!e.altKey || e.ctrlKey || e.metaKey || e.shiftKey) return;
      if (e.code !== "KeyG") return;          /* the physical key (§546) */
      if (typing(e.target)) return;
      if (open()) e.preventDefault();
    });
  }

  return { wire: wire, open: open, close: shut,
           /* for the checks */
           places: function(){ return places().map(label); } };
})();
