/* ── THE INTERNAL TRACKER: the one script (spec 054) ─────────────────────
   Served by the module at /<client>/tracker/app.js under the shell's
   `script-src 'self'` (lib/shell.ts), and nothing inline. It does one kind of
   thing: a control on a row is pressed, the change is POSTed to the module's
   own api, and on success the page is read again — so the browser holds no
   copy of the list and cannot disagree with the server about it (§53.5).
   A refusal is written into the page in the server's own words (§32, §171),
   never swallowed.

   THE NEXT EMPTY LINE: Enter adds, Escape clears, and the box is focused
   again after the reload so the next line can be typed straight away (a
   sheet's own manners). The date is changed by turning the date into a date
   box in place and back again; the owner and who else are on the opened row.
   Nothing here is a Save button (§35). */
export const APP_JS = `(function () {
  "use strict";
  var API = document.body.getAttribute("data-api") || "";
  var said = document.getElementById("said");
  function say(t) { if (said) said.textContent = t || ""; }
  function focusAddNext() { try { sessionStorage.setItem("tracker.focus", "add"); } catch (e) {} }
  function post(body, then) {
    say("");
    fetch(API, { method: "POST", credentials: "same-origin", headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body) })
      .then(function (r) { return r.json().catch(function () { return { ok: false, why: "The server did not answer." }; }); })
      .then(function (j) {
        if (!j || !j.ok) { say((j && j.why) || "That did not save. Try again."); return; }
        if (then) then(j); else location.reload();
      })
      .catch(function () { say("Could not reach the server. Nothing was changed."); });
  }
  var add = document.getElementById("add");
  if (add) {
    try { if (sessionStorage.getItem("tracker.focus") === "add") { sessionStorage.removeItem("tracker.focus"); add.focus(); } } catch (e) {}
    add.addEventListener("keydown", function (e) {
      if (e.key === "Escape") { add.value = ""; return; }
      if (e.key !== "Enter") return;
      e.preventDefault();
      var t = add.value.replace(/\\s+/g, " ").trim();
      if (!t) return;
      add.disabled = true;
      post({ act: "add", title: t }, function () { focusAddNext(); location.reload(); });
    });
  }
  function rowOf(el) { var r = el.closest(".row, .open"); return r ? r.getAttribute("data-id") : null; }
  document.addEventListener("click", function (e) {
    var b = e.target.closest("[data-act]");
    if (!b) return;
    var act = b.getAttribute("data-act"), id = rowOf(b);
    if (act === "tick") {
      var done = b.getAttribute("aria-checked") === "true";
      post({ act: "status", id: id, status: done ? "not_started" : "done" });
    } else if (act === "due") {
      /* The date becomes a date box in place; a change posts, leaving it
         alone puts the word back. Clearing the box posts "no date". */
      var inp = document.createElement("input");
      inp.type = "date"; inp.className = "dt"; inp.value = b.getAttribute("data-due") || "";
      inp.setAttribute("aria-label", "Due date");
      var was = b.getAttribute("data-due") || "";
      b.replaceWith(inp); inp.focus();
      var settled = false;
      var back = function () { if (settled) return; settled = true; inp.replaceWith(b); };
      inp.addEventListener("change", function () {
        if (inp.value === was) { back(); return; }
        settled = true; post({ act: "due", id: id, due: inp.value || null });
      });
      inp.addEventListener("keydown", function (ev) { if (ev.key === "Escape") back(); });
      inp.addEventListener("blur", function () { setTimeout(back, 150); });
    } else if (act === "delete-ask") {
      b.hidden = true; var s = b.parentNode.querySelector(".sure"); if (s) s.hidden = false;
    } else if (act === "delete-no") {
      var s2 = b.closest(".sure"); if (s2) { s2.hidden = true; var d = s2.parentNode.querySelector("[data-act=delete-ask]"); if (d) d.hidden = false; }
    } else if (act === "delete") {
      post({ act: "delete", id: id }, function () { location.href = location.pathname + (location.search.replace(/[?&]open=[^&]*/, "").replace(/^&/, "?") || ""); });
    }
  });
  document.addEventListener("change", function (e) {
    var c = e.target.closest("[data-act]");
    if (!c) return;
    var act = c.getAttribute("data-act"), id = rowOf(c);
    if (act === "status") post({ act: "status", id: id, status: c.value });
    else if (act === "owner") post({ act: "owner", id: id, ownerKey: c.value });
    else if (act === "collab") {
      var keys = [].slice.call(c.closest(".ticks").querySelectorAll("input:checked")).map(function (i) { return i.value; });
      post({ act: "collab", id: id, collaborators: keys });
    }
  });
  /* Saved when you leave the box (§35), and only when it changed. */
  document.addEventListener("focusout", function (e) {
    var c = e.target.closest("[data-act=notes], [data-act=rename]");
    if (!c) return;
    var id = rowOf(c);
    if (c.getAttribute("data-act") === "notes") {
      if (c.value === c.defaultValue) return;
      post({ act: "notes", id: id, description: c.value }, function () { c.defaultValue = c.value; });
    } else {
      var t = c.value.replace(/\\s+/g, " ").trim();
      if (!t || t === c.defaultValue) { c.value = c.defaultValue; return; }
      post({ act: "rename", id: id, title: t });
    }
  });
  document.addEventListener("keydown", function (e) {
    if (e.key === "Enter" && e.target.matches("[data-act=rename]")) { e.preventDefault(); e.target.blur(); }
  });
})();
`;
