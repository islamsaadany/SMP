/* ══ A ROW OF TABS ANSWERS THE ARROWS (§544) ═══════════════════════════════
   Usability audit, heuristic 7: *"no keyboard route between destinations, tabs
   or sections"*. Measured, the product draws EIGHT `role="tablist"` groups —
   the destinations, the tab row, the section row, the chat queue, the Copilot
   side, the knowledge base, the Setup rail — and not one of them bound an
   arrow key.

   WHICH MAKES THIS §536 AGAIN, ONE CONTROL OVER. `role="tablist"` is not
   decoration: it is a promise that Left and Right move along the row and that
   Home and End reach its ends, and a screen reader announcing "tab, 2 of 5"
   tells somebody to press keys that did nothing here. The row was always
   OPERABLE — the tabs are real buttons and Tab reaches them — so nobody was
   locked out; it simply did not behave the way its own markup said.

   SO THERE IS NOTHING TO INVENT. This binds no new idiom and asks nobody to
   learn anything: arrows on a row of tabs is what every row of tabs does.

   ── TWO DECISIONS, BOTH DELIBERATE ────────────────────────────────────

   THE ARROWS MOVE FOCUS AND DO NOT PICK (manual activation, which the pattern
   allows and this product needs). These tabs are DESTINATIONS: a row of them
   is Mobile, Retail, Logistics, and picking on arrow would walk somebody
   through five whole pages — five repaints, five reads — while they were
   looking for the sixth. Enter and Space pick, which a button already does,
   so nothing had to be bound for that either.

   THE TAB PATH IS NOT CHANGED, and this departs from the pattern knowingly.
   The textbook version gives the row a roving `tabindex` so Tab stops on the
   row once and the arrows walk inside it. That is fewer stops — and it TAKES
   AWAY a route that works today, for everyone who reaches a tab by pressing
   Tab five times and has done so since the product shipped. Adding the arrows
   costs nobody anything; removing the stops costs somebody something. If the
   stops are to go, that is its own decision with its own drawing (rule 1b).

   ONE HANDLER, NOT EIGHT (§53.5). The rows are built by six files and two more
   will exist by Christmas; a key wired at each is eight places to forget. This
   one is delegated from the document and finds the row from the tab that has
   focus, so a tablist drawn tomorrow answers the arrows without being told. */
var TABKEYS = (function(){

  var STEP = { ArrowLeft: -1, ArrowRight: 1, ArrowUp: -1, ArrowDown: 1 };

  /* WHAT IS ON THE ROW, as somebody looking at it would count: a tab the row
     is not currently drawing is not somewhere the arrows can go. `offsetParent`
     is null for anything display:none or inside something that is, which is how
     the folded rows hide theirs. */
  function tabsIn(list){
    return Array.prototype.filter.call(
      list.querySelectorAll('[role="tab"]'),
      function(t){ return t.offsetParent !== null || t === document.activeElement; });
  }

  function go(list, from, where){
    var all = tabsIn(list);
    if (all.length < 2) return false;
    var at = all.indexOf(from);
    if (at < 0) return false;
    var to;
    if (where === "first") to = all[0];
    else if (where === "last") to = all[all.length - 1];
    /* WRAPPING, because §536's list wraps and two controls in one product
       that disagree about what the end of a list means is worse than either
       answer (§53.5 from the other side). */
    else to = all[(at + where + all.length) % all.length];
    if (!to || to === from) return false;
    to.focus();
    return true;
  }

  function onKey(e){
    /* Already answered by somebody closer to it — `arrange.js` moves a row on
       the same arrows, and the deck owns them outright. */
    if (e.defaultPrevented) return;
    if (e.altKey || e.ctrlKey || e.metaKey || e.shiftKey) return;
    var where = (e.key in STEP) ? STEP[e.key]
              : e.key === "Home" ? "first"
              : e.key === "End" ? "last" : null;
    if (where === null) return;
    var t = e.target;
    if (!t || !t.closest) return;
    var tab = t.closest('[role="tab"]');
    if (!tab) return;
    var list = tab.closest('[role="tablist"]');
    if (!list) return;
    if (go(list, tab, where)) e.preventDefault();
  }

  function wire(){
    document.addEventListener("keydown", onKey);
  }

  return { wire: wire,
           /* for the checks */
           tabsIn: tabsIn };
})();
