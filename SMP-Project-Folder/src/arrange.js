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

/* ARRANGE MOVED TO THE PLAN (§63.3). Islam: "the arrange should be something
   in the plan that moves pillars up and down or arrange the measures and
   tactics tables … so in the plan when we press the edit button we find that
   we can edit the fields and even rearrange things."

   Which is right, and it was on the wrong page: the order of a unit's pillars
   is part of what was agreed, not part of how it is going. Progress and
   Performance already follow it — order is stored on the object, so there was
   never a second arrangement to keep in step.

   TWO WAYS IN, ONE MODE. The SMO's plan pen turns the handles on with the
   fields, exactly as asked. A BU head has no pen — mayEditPlan() is the SMO's
   (§31) — and could arrange before this, so they keep an explicit button:
   tying the handles to the pen alone would have taken reordering away from
   the people who use it most, silently. */
function arranging(scope, unitKey){
  if (!canArrange(scope, unitKey)) return false;
  if (ARRANGE) return true;
  return scope === "unit" && typeof EDIT_PAGE !== "undefined" &&
         EDIT_PAGE.plan && typeof mayEditPlan === "function" && mayEditPlan();
}

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
   whoever may edit that unit's plan — which since §94 is the office and
   nobody else. Asked through mayAuthor() so the shared rule stays the single
   answer.

   ── REORDERING IS AUTHORING (§94) ────────────────────────────────
   This used to end at `grantAt("u_plan", unitKey) === "edit"`, which a unit
   owner and a strategy custodian both hold on their own unit — so the pen was
   closed to them and the DRAG HANDLES were not, and the order of a plan is as
   much a part of what was agreed as its words. It was not even a working
   grant: `lib/authorize.js` compares the row ids IN ORDER, so every one of
   those drags was classified as a plan change and REFUSED on save. The rows
   moved on screen, the save came back refused, and §63.3's explicit Arrange
   button — kept so a BU head who has no pen could still reorder — had been
   handing that to people the server would never accept it from.

   AND `hasRole("super")` WAS THE TENTH PLACE MEANING "the office" (§89). The
   SMO team could not arrange anything at group level: not a bug anybody would
   report, because the only sign is a control that is not there. */
function canArrange(scope, unitKey){
  /* Units, capabilities and themes at group level: the office's, with no
     page behind it to ask a grant of. */
  if (scope === "group") return inOffice();
  return !!unitKey && mayAuthor("u_plan", unitKey);
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
