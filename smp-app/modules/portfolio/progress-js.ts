/* ── PROGRESS: THE TWO PRESSES (spec 060 §9.10) ───────────────────────────
   Signing off and undoing it are the only writes on this page, and both are
   answered by READING THE PAGE AGAIN: every figure, section and count on it
   is derived from the plan (§9.8), so a browser that tried to patch one row
   would be a second answer to *what is owed* (§5.2). A reload is the whole
   redraw and cannot disagree with the server.

   NOTHING HERE IS TYPED INTO A FIGURE. The one field is the real end date a
   Lead chooses, and it is BOUNDED by the page (`min`/`max`) and REFUSED by
   the server — the same rule twice on purpose (§42).

   THE BUTTON IS HELD WHILE THE REQUEST IS IN FLIGHT, or a double press signs
   off twice and the second answers *that activity has not been signed off*
   about work it has just accepted (§136's shape). */
export const PROGRESS_JS = `(function () {
  "use strict";
  var API = document.body.getAttribute("data-api") || "";
  var busy = false;

  function say(why) {
    var n = document.getElementById("saywhy");
    if (!n) {
      n = document.createElement("p");
      n.id = "saywhy";
      n.className = "empty";
      n.style.color = "var(--bad-tx)";
      var m = document.querySelector("main");
      if (m) m.prepend(n);
    }
    n.textContent = why;
  }

  function post(body, btn) {
    if (busy) return;
    busy = true;
    if (btn) btn.disabled = true;
    fetch(API, { method: "POST", headers: { "Content-Type": "application/json" },
                 body: JSON.stringify(body) })
      .then(function (r) { return r.json().catch(function () { return { ok: false, why: "The server did not answer." }; }); })
      .then(function (j) {
        if (j && j.ok) { location.reload(); return; }
        busy = false;
        if (btn) btn.disabled = false;
        say(j && j.why ? j.why : "That could not be done.");
      })
      .catch(function () {
        busy = false;
        if (btn) btn.disabled = false;
        say("The server could not be reached. Nothing has been changed.");
      });
  }

  var id = (location.pathname.split("/").filter(Boolean)[2] || "");

  document.addEventListener("click", function (e) {
    var t = e.target;
    if (!t || !t.closest) return;
    var s = t.closest("[data-signoff]");
    if (s) {
      var act = s.getAttribute("data-signoff");
      var f = document.getElementById("e-" + act);
      post({ act: "signoff", id: id, activity: act, end: f ? f.value : "" }, s);
      return;
    }
    var r = t.closest("[data-reopen]");
    if (r) post({ act: "reopen", id: id, activity: r.getAttribute("data-reopen") }, r);
  });
})();
`;
