/* ── THE INTERNAL TRACKER: the one script (spec 054, §356.12) ─────────────
   Served by the module at /<client>/tracker/app.js under the shell's
   `script-src 'self'` (lib/shell.ts), and nothing inline. It does one kind of
   thing: a control on a row is pressed, the change is POSTed to the module's
   own api, and the server ANSWERS WITH THE LIST DRAWN AGAIN — by the same
   function that drew the page — which is swapped into the page in place. No
   reload, and the browser still holds no copy of the list and renders no row
   of its own, so it cannot disagree with the server about one (§53.5). A
   refusal is written into the page in the server's own words (§32, §171),
   never swallowed, and swaps nothing.

   SILENT, WHICH IS ISLAM'S OWN WORD FOR IT ("make it silent for fast and
   smooth creation of tasks"): Enter adds, the line is drawn under you the
   moment it lands, the counts move with it, and the box is empty and still
   under the cursor for the next one. Escape clears the box.

   WHAT A HAND IS TYPING SURVIVES A SWAP (§35, §71.2): the add box and the
   search box are read before the list is redrawn and put back after it,
   focus included — a tick pressed with half a line typed must not throw the
   line away. The notes box needs nothing here, because it saves on leaving
   and a press elsewhere leaves it first.

   ONE REQUEST AT A TIME (§240's shape, in the browser): a notes box left and
   a tick pressed in the same second post in that order and each answer is
   drawn in turn, so the second answer already holds the first change.

   THE ROW'S CONTROLS: the date becomes a date box in place; the name becomes
   a box on a double-click (Enter or leaving it renames, Escape puts it
   back); the owner's name opens the office on this client, and picking one
   hands the action on; the arrow opens the row for its notes and history
   and folds it again — the opened row rides on the address (?open=), so a
   link somebody sends opens the same row. How the list is grouped is a
   cookie the page reads, so the next visit opens grouped the same way. */
export const APP_JS = `(function () {
  "use strict";
  var B = document.body;
  var API = B.getAttribute("data-api") || "", LIST = B.getAttribute("data-list") || "";
  var said = document.getElementById("said");
  function say(t) { if (said) said.textContent = t || ""; }
  function openId() { return new URLSearchParams(location.search).get("open"); }
  function setOpen(id) {
    var u = new URL(location.href);
    if (id) u.searchParams.set("open", id); else u.searchParams.delete("open");
    history.replaceState(null, "", u);
  }
  function ask() {
    return { view: B.getAttribute("data-view") || "week", q: B.getAttribute("data-q") || "",
      group: B.getAttribute("data-group") || "owner", open: openId() };
  }
  /* What a hand is typing, read before a swap and put back after it. */
  function keep() {
    var a = document.activeElement, add = document.getElementById("add"), s = document.querySelector(".srch");
    return { add: add ? add.value : "", srch: s ? s.value : "",
      focus: a && a.id === "add" ? "add" : (a && a.classList && a.classList.contains("srch")) ? "srch" : null };
  }
  function swap(j, k) {
    var body = document.getElementById("body");
    if (!body || !j || typeof j.body !== "string") return;
    body.innerHTML = j.body;
    setOpen(j.open || null);
    var add = document.getElementById("add"), s = document.querySelector(".srch");
    if (add && k && k.add && !k.clear) add.value = k.add;
    if (s && k && k.srch) s.value = k.srch;
    if (k && k.focus === "add" && add) add.focus();
    else if (k && k.focus === "srch" && s) s.focus();
  }
  var chain = Promise.resolve();
  function request(method, url, body, k, then) {
    say("");
    chain = chain.then(function () {
      var init = { method: method, credentials: "same-origin", headers: {} };
      if (body) { init.headers["Content-Type"] = "application/json"; init.body = JSON.stringify(body); }
      return fetch(url, init)
        .then(function (r) { return r.json().catch(function () { return { ok: false, why: "The server did not answer." }; }); })
        .then(function (j) {
          if (!j || !j.ok) { say((j && j.why) || "That did not save. Try again."); if (then) then(null); return; }
          swap(j, k); if (then) then(j);
        })
        .catch(function () { say("Could not reach the server. Nothing was changed."); if (then) then(null); });
    });
  }
  function post(act, k, then) {
    var a = ask(); act.view = a.view; act.q = a.q; act.group = a.group; act.open = a.open;
    request("POST", API, act, k || keep(), then);
  }
  function refetch(k) {
    var a = ask();
    request("GET", LIST + "?view=" + encodeURIComponent(a.view) + "&q=" + encodeURIComponent(a.q) +
      "&group=" + encodeURIComponent(a.group) + (a.open ? "&open=" + encodeURIComponent(a.open) : ""), null, k || keep());
  }
  function rowOf(el) { var r = el.closest(".row, .open"); return r ? r.getAttribute("data-id") : null; }

  /* THE NEXT EMPTY LINE: Enter adds, silently; Escape clears. On a refusal
     the words stay in the box, said in the red bar, and nothing is drawn. */
  document.addEventListener("keydown", function (e) {
    var add = e.target;
    if (!add || add.id !== "add") return;
    if (e.key === "Escape") { add.value = ""; return; }
    if (e.key !== "Enter") return;
    e.preventDefault();
    var t = add.value.replace(/\\s+/g, " ").trim();
    if (!t) return;
    add.disabled = true;
    post({ act: "add", title: t }, { clear: true, focus: "add" }, function (j) { if (!j) { add.disabled = false; add.focus(); } /*%BRK%*/ });
  });

  /* THE TEAM under an owner's name: one open at a time, closed by a press
     elsewhere or Escape; picking a name hands the action on. */
  function closeTeams(except) {
    document.querySelectorAll(".who.pick.on").forEach(function (w) {
      if (w === except) return;
      w.classList.remove("on"); w.setAttribute("aria-expanded", "false");
      var t = w.querySelector(".team"); if (t) t.hidden = true;
    });
  }
  function toggleTeam(w) {
    var on = !w.classList.contains("on");
    closeTeams(w);
    w.classList.toggle("on", on); w.setAttribute("aria-expanded", String(on));
    var t = w.querySelector(".team"); if (t) t.hidden = !on;
    if (on && t) { var cur = t.querySelector("button.on") || t.querySelector("button"); if (cur) cur.focus(); }
  }

  document.addEventListener("click", function (e) {
    var b = e.target.closest("[data-act]");
    if (!b || !e.target.closest(".who.pick")) closeTeams(null);
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
    } else if (act === "who") {
      toggleTeam(b);
    } else if (act === "pick-owner") {
      var w = b.closest(".who.pick"), key = b.getAttribute("data-key") || "";
      closeTeams(null);
      if (w && w.querySelector(".wn") && w.querySelector(".wn").textContent === b.textContent) return;
      post({ act: "owner", id: id, ownerKey: key });
    } else if (act === "more") {
      /* Open this row (and only this row), or fold it if it is the open one;
         the address carries which, and the list is read again. */
      var next = openId() === id ? null : id;
      setOpen(next);
      refetch();
    } else if (act === "delete-ask") {
      b.hidden = true; var s = b.parentNode.querySelector(".sure"); if (s) s.hidden = false;
    } else if (act === "delete-no") {
      var s2 = b.closest(".sure"); if (s2) { s2.hidden = true; var d = s2.parentNode.querySelector("[data-act=delete-ask]"); if (d) d.hidden = false; }
    } else if (act === "delete") {
      post({ act: "delete", id: id });
    }
  });
  document.addEventListener("keydown", function (e) {
    if (e.key === "Escape") { closeTeams(null); return; }
    var w = e.target.closest && e.target.closest(".who.pick");
    if (w && e.target === w && (e.key === "Enter" || e.key === " ")) { e.preventDefault(); toggleTeam(w); }
  });

  document.addEventListener("change", function (e) {
    var c = e.target.closest("[data-act]");
    if (!c) return;
    var act = c.getAttribute("data-act"), id = rowOf(c);
    if (act === "status") post({ act: "status", id: id, status: c.value });
    else if (act === "group") {
      /* Remembered on this browser, in a cookie the page reads on the next
         visit — a preference, never the client's data (§25, §47.1). */
      B.setAttribute("data-group", c.value);
      try { document.cookie = "smp.tracker.group=" + encodeURIComponent(c.value) + "; path=" + location.pathname + "; max-age=31536000; samesite=lax"; } catch (x) {}
      refetch();
    }
  });

  /* RENAME IN PLACE: a double-click on the name turns it into a box; Enter
     or leaving the box renames, Escape puts the name back. A single click
     does nothing, so a row can still be read without a box opening under
     the pointer. */
  document.addEventListener("dblclick", function (e) {
    var t = e.target.closest(".t[data-rename]");
    if (!t || t.querySelector("input")) return;
    var id = rowOf(t), was = t.textContent;
    var inp = document.createElement("input");
    inp.className = "ttl"; inp.value = was; inp.maxLength = 200; inp.setAttribute("aria-label", "Rename the action");
    t.textContent = ""; t.appendChild(inp); inp.focus(); inp.select();
    var settled = false;
    var back = function () { if (settled) return; settled = true; t.textContent = was; };
    inp.addEventListener("keydown", function (ev) {
      if (ev.key === "Escape") { ev.preventDefault(); back(); }
      else if (ev.key === "Enter") { ev.preventDefault(); inp.blur(); }
    });
    inp.addEventListener("blur", function () {
      if (settled) return;
      var v = inp.value.replace(/\\s+/g, " ").trim();
      if (!v || v === was) { back(); return; }
      settled = true; t.textContent = v;
      post({ act: "rename", id: id, title: v });
    });
  });

  /* Saved when you leave the box (§35), and only when it changed. */
  document.addEventListener("focusout", function (e) {
    var c = e.target.closest && e.target.closest("[data-act=notes]");
    if (!c) return;
    if (c.value === c.defaultValue) return;
    var id = rowOf(c), v = c.value;
    post({ act: "notes", id: id, description: v });
  });
})();
`;
