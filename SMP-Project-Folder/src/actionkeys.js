/* ══ THREE ACTIONS, FROM THE KEYBOARD (§546) ═══════════════════════════════
   Usability audit, heuristic 7: *"no accelerator for Submit, Save draft, or
   the pen"*. §552 answered the navigation half of that finding with the arrows
   every row of tabs already promised; this is the other half, and unlike the
   arrows it had NO standard to follow — somebody had to pick the keys.

   ISLAM PICKED THEM: Alt+S, Alt+D, Alt+E.

   ALT IS THE PRODUCT'S OWN MODIFIER AND NOT A NEW ONE (§528 chose it for the
   reporting walk), and the one thing wrong with it here was already solved
   there: on a Mac, Option+letter types an accented character rather than
   reporting the letter, so the match is on the PHYSICAL KEY (`e.code`) and
   never on `e.key`. Copying that is the whole reason Alt was safe to reuse.

   ── SUBMIT JUMPS, THE OTHER TWO ACT, AND THE LINE IS WHERE THE WORK GOES ──

   Islam, asked directly whether one key should send a report: *"jump to the
   button"*. So Alt+S puts the cursor ON Submit and the person presses Enter.
   Two keys instead of one, and nothing reaches the office because somebody's
   hand was in the wrong place.

   Save draft and the pen ACT on the single press, and the rule behind the
   difference is worth saying rather than leaving as an inconsistency:
   SUBMIT LEAVES YOUR SCREEN AND THE OTHER TWO DO NOT. A draft is yours until
   you submit it, and the pen only decides whether you can type on the page in
   front of you. Neither is seen by anybody else, so neither is worth a second
   press. Submit is read by the office the moment it lands.

   AND JUMPING TO A HELD SUBMIT IS BETTER THAN PRESSING ONE. When the report
   is not ready, §538 draws Submit held with its reason in a bubble that opens
   ON FOCUS — so Alt+S on an unready report lands on the button AND opens the
   sentence saying what is missing. The accelerator and the refusal were built
   two sections apart and meet here without either being changed.

   ONE PLACE, THREE ACTS, read from the product's own selectors (§53.5). The
   pen's is `.penbtn[data-page], .secpen[data-page], .editbtn[data-page]` —
   taken from the check that already walks it, which records that the first of
   the three alone was not enough. */
var ACTIONKEYS = (function(){

  var ACTS = [
    { code: "KeyS", say: "Alt+S", what: "Submit",
      sel: "[data-submit]", go: "focus" },
    { code: "KeyD", say: "Alt+D", what: "Save draft",
      sel: "[data-repsave]", go: "press" },
    { code: "KeyE", say: "Alt+E", what: "the pen",
      sel: ".penbtn[data-page], .secpen[data-page], .editbtn[data-page]", go: "press" }
  ];

  /* WHAT IS ACTUALLY ON THE SCREEN. A control the page is not drawing is not
     one a key can reach, and `offsetParent` is null for anything hidden or
     inside something hidden — the same test §552 uses on a row of tabs. */
  function live(sel){
    var all = document.querySelectorAll(sel);
    for (var i = 0; i < all.length; i++) {
      if (all[i].offsetParent !== null) return all[i];
    }
    return null;
  }

  function held(el){
    return el.disabled === true || el.getAttribute("aria-disabled") === "true";
  }

  function fire(a){
    var el = live(a.sel);
    if (!el) return false;
    if (a.go === "focus") {
      /* Held or not: landing on it is the point, and on a held Submit the
         reason opens with the focus (§538). */
      el.focus();
      return true;
    }
    /* A HELD BUTTON IS NOT PRESSED BY A KEY EITHER. The mouse cannot press it
       and neither can this, or the accelerator becomes the one way round a
       refusal the rest of the product enforces (§538). */
    if (held(el)) { el.focus(); return true; }
    el.click();
    return true;
  }

  function typing(el){
    if (!el) return false;
    if (el.isContentEditable) return true;
    var t = el.tagName;
    return t === "INPUT" || t === "TEXTAREA" || t === "SELECT";
  }

  /* THE HINT RIDES THE CONTROL, which is §528's rule and the reason the sheet
     is not the only record: somebody who never opens the sheet still meets the
     key on the button it belongs to. Said only where the control EXISTS, so a
     key is never announced on a page that cannot answer it (§61). */
  function mark(){
    ACTS.forEach(function(a){
      var el = live(a.sel);
      if (el && el.getAttribute("aria-keyshortcuts") !== a.say) {
        el.setAttribute("aria-keyshortcuts", a.say);
        var t = el.getAttribute("title");
        if (!t) el.setAttribute("title", a.what + " (" + a.say + ")");
      }
    });
  }

  function onKey(e){
    if (e.defaultPrevented) return;
    if (!e.altKey || e.ctrlKey || e.metaKey || e.shiftKey) return;
    if (typing(e.target)) return;
    for (var i = 0; i < ACTS.length; i++) {
      if (ACTS[i].code === e.code) {
        if (fire(ACTS[i])) e.preventDefault();
        return;
      }
    }
  }

  function wire(){ document.addEventListener("keydown", onKey); }

  return { wire: wire, mark: mark,
           /* for the checks */
           acts: function(){ return ACTS; } };
})();
