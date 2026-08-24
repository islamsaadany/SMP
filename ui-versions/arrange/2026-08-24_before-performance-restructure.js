/* ── Arrangement ──────────────────────────────────────────────────────────
   Order is stored on the object and shared by everyone, which is why it needs
   permissions at all: a personal view preference would need none.

   Who may reorder what:
     SMO       everything — business units, capabilities, themes, and any list
               inside any unit
     BU head   their own unit's pillars, and the measures and tactics within
               them
     everyone else   nothing; the handle is not rendered

   Dragging is by HANDLE, never by the row. A pillar row is already a click
   target that expands it, so a whole-row drag would make every attempt to open
   a pillar feel like the start of a drag.
   ──────────────────────────────────────────────────────────────────────── */

/* Arrangement is a MODE, entered deliberately and left again — the same
   pattern as the weighting table. Handles that are always present are clutter
   on a page whose normal job is reading, and they invite a drag when someone
   meant to open a row. */
var ARRANGE = false;

function arranging(scope, unitKey){ return ARRANGE && canArrange(scope, unitKey); }

/* ROLES, NOT LEVELS — THE THIRD INSTANCE OF THE SAME FAULT (§48.6).
   This read `v.level === "smo"` and `v.level === "n1"`. `level` was deleted in
   §33 when roles replaced it, so BOTH branches were false for all thirty-one
   people and the whole reordering feature — 177 lines of pointer drag-and-drop
   — has been unreachable ever since. Nothing threw, because a comparison
   against a field nobody sets fails in the SAFE direction: it locks down
   rather than opening up, so every sweep stayed green.

   That is now three: sync.js hid the viewer switcher from the SMO (§45.3),
   this hid reordering from everyone, and both were found by using the product
   rather than by testing it. THE RULE: after renaming a field, grep for the
   OLD name across every source, including the ones the change was not about.

   Who may reorder, restated in roles: the SMO anywhere; and within one unit,
   whoever may edit that unit's plan — its owner or its custodian — which is
   the same question `mayEditPlan`-style gates already ask elsewhere. Asked
   through grantAt() so the access matrix stays the single answer. */
function canArrange(scope, unitKey){
  if (hasRole("super")) return true;
  if (scope === "group") return false;          /* units, capabilities, themes */
  return !!unitKey && grantAt("u_plan", unitKey) === "edit";
}

function handle(label){
  return '<span class="grip" role="button" tabindex="0" aria-label="' + esc(label) +
         '" title="Drag to reorder"><i></i><i></i><i></i></span>';
}

/* Pointer-based rather than HTML5 drag-and-drop: the native API cannot drag a
   table row reliably across browsers and gives nothing on touch.

   The insertion point is found by closest edge rather than by comparing Y
   alone, because the same code has to serve two layouts — table rows stacked
   vertically, and gauge cards sitting side by side in a grid. Comparing only
   vertical midpoints silently does nothing in a grid, since every card shares
   a row. */
function makeSortable(container, itemSel, onCommit){
  var dragging = null;

  function siblings(){
    return Array.prototype.slice.call(container.querySelectorAll(itemSel));
  }

  function renumber(){
    siblings().forEach(function(el, i){
      var n = el.querySelector(".idx-n");
      if (n) n.textContent = i + 1;
    });
  }

  function place(x, y){
    var items = siblings().filter(function(el){ return el !== dragging; });
    for (var i = 0; i < items.length; i++) {
      var r = items[i].getBoundingClientRect();
      if (y < r.bottom && x < r.left + r.width / 2) {
        container.insertBefore(dragging, items[i]);
        return renumber();
      }
      if (y < r.bottom && x < r.right) {
        container.insertBefore(dragging, items[i].nextSibling);
        return renumber();
      }
    }
    if (items.length) container.insertBefore(dragging, items[items.length - 1].nextSibling);
    renumber();
  }

  container.querySelectorAll(".grip").forEach(function(g){
    g.addEventListener("pointerdown", function(e){
      var row = g.closest(itemSel);
      if (!row) return;
      e.preventDefault(); e.stopPropagation();
      dragging = row;
      row.classList.add("dragging");
      container.classList.add("sorting");
      g.setPointerCapture(e.pointerId);

      function move(ev){ if (dragging) place(ev.clientX, ev.clientY); }
      function up(ev){
        if (!dragging) return;
        dragging.classList.remove("dragging");
        container.classList.remove("sorting");
        dragging = null;
        try { g.releasePointerCapture(ev.pointerId); } catch (err) {}
        document.removeEventListener("pointermove", move);
        document.removeEventListener("pointerup", up);
        onCommit(siblings().map(function(el){ return +el.dataset.oi; }));
      }
      document.addEventListener("pointermove", move);
      document.addEventListener("pointerup", up);
    });

    /* Keyboard equivalent, because a drag handle that only works with a mouse
       locks out anyone who cannot use one. */
    g.addEventListener("keydown", function(e){
      if (e.key !== "ArrowUp" && e.key !== "ArrowDown" &&
          e.key !== "ArrowLeft" && e.key !== "ArrowRight") return;
      e.preventDefault();
      var row = g.closest(itemSel), all = siblings();
      var i = all.indexOf(row);
      var j = (e.key === "ArrowUp" || e.key === "ArrowLeft") ? i - 1 : i + 1;
      if (j < 0 || j >= all.length) return;
      if (j < i) container.insertBefore(row, all[j]);
      else container.insertBefore(row, all[j].nextSibling);
      onCommit(siblings().map(function(el){ return +el.dataset.oi; }));
    });
  });
}

/* Apply a committed order to the underlying array. */
function applyOrder(arr, order){
  var copy = order.map(function(i){ return arr[i]; });
  arr.length = 0;
  copy.forEach(function(x){ arr.push(x); });
}
