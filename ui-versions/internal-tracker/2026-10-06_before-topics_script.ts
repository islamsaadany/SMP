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

   THE ROW'S CONTROLS: the week opens the week picker (as exact dates, the
   day becomes a date box in place); the name becomes a box on a
   double-click (Enter or leaving it renames, Escape puts it back); the
   owner's name opens the office on this client, and picking one hands the
   action on; the arrow opens the row for its notes and history and folds it
   again — the opened row rides on the address (?open=), so a link somebody
   sends opens the same row. The two settings behind the dots — how the list
   is grouped, dates as weeks or days — are cookies the page reads, so the
   next visit opens the same way.

   THE ADD LINE TAKES EVERYTHING (§356.14): the week, the owner and a note
   are picked on the line before Enter and ride on it as data- attributes;
   nothing is posted until Enter, from the action or from its note.

   THE DATE BOX STAYS UNTIL YOU ARE DONE WITH IT (§356.14, the fault Islam
   hit): the first build put the word back 150ms after focus left the box,
   and opening the browser's calendar popup IS focus leaving it — so the day
   picked landed on a box already gone. It closes on a change, on Escape, or
   on a press elsewhere on the page, and never on blur. */
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
      group: B.getAttribute("data-group") || "owner", dates: B.getAttribute("data-dates") || "weeks", open: openId() };
  }
  function remember(name, value) {
    try { document.cookie = name + "=" + encodeURIComponent(value) + "; path=" + location.pathname + "; max-age=31536000; samesite=lax"; } catch (x) {}
  }
  /* What a hand is typing, read before a swap and put back after it: the
     action, its note, and the week and owner picked for it. */
  function keep() {
    var a = document.activeElement, add = document.getElementById("add"), nt = document.getElementById("addnote"),
      ar = document.querySelector(".addrow"), s = document.querySelector(".srch");
    return { add: add ? add.value : "", note: nt ? nt.value : "", srch: s ? s.value : "",
      due: ar ? ar.getAttribute("data-due") : null, owner: ar ? ar.getAttribute("data-owner") : null,
      picked: !!(ar && ar.hasAttribute("data-picked")), noteOpen: !!(nt && !nt.hidden),
      focus: a && a.id === "add" ? "add" : (a && a.id === "addnote") ? "addnote" : (a && a.classList && a.classList.contains("srch")) ? "srch" : null };
  }
  function swap(j, k) {
    var body = document.getElementById("body");
    if (!body || !j || typeof j.body !== "string") return;
    body.innerHTML = j.body;
    setOpen(j.open || null);
    var add = document.getElementById("add"), nt = document.getElementById("addnote"), s = document.querySelector(".srch"), ar = document.querySelector(".addrow");
    if (k && !k.clear) {
      if (add && k.add) add.value = k.add;
      if (nt && k.note) nt.value = k.note;
      if (k.noteOpen) drawNote(true);
      if (ar && k.picked) { if (k.due != null) setAddDue(ar, k.due); if (k.owner) setAddOwner(ar, k.owner); }
    }
    if (s && k && k.srch) s.value = k.srch;
    if (k && k.focus === "add" && add) add.focus();
    else if (k && k.focus === "addnote" && nt) nt.focus();
    else if (k && k.focus === "srch" && s) s.focus();
    typing();
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
    var a = ask(); act.view = a.view; act.q = a.q; act.group = a.group; act.dates = a.dates; act.open = a.open;
    request("POST", API, act, k || keep(), then);
  }
  function refetch(k) {
    var a = ask();
    request("GET", LIST + "?view=" + encodeURIComponent(a.view) + "&q=" + encodeURIComponent(a.q) +
      "&group=" + encodeURIComponent(a.group) + "&dates=" + encodeURIComponent(a.dates) + (a.open ? "&open=" + encodeURIComponent(a.open) : ""), null, k || keep());
  }
  function rowOf(el) { var r = el.closest(".row, .open"); return r ? r.getAttribute("data-id") : null; }
  function inAdd(el) { return el.closest(".addrow"); }

  /* THE ADD LINE: its week and owner are set on the line, drawn at once,
     posted only on Enter. The line lights while anything is typed in it. */
  function typing() {
    var ar = document.querySelector(".addrow"), add = document.getElementById("add"), nt = document.getElementById("addnote");
    if (ar) ar.classList.toggle("typing", !!((add && add.value) || (nt && nt.value)));
  }
  /* THE NOTE IS ASKED FOR (§356.15), and ONE RULE SAYS IT ALL: the note is
     on the line only while it is open, and FOLDING IT EMPTIES IT. A note
     folded away with words still in it would be posted by the next Enter
     with nothing on the screen saying so (§96), and a mark on the arrow
     meaning "there is one under here" would be a second thing to learn about
     a control that already means one thing. The cost is stated rather than
     discovered: the arrow throws away an unsent note, which is exactly what
     Escape on this line already does to both boxes.
     It also folds itself when it is emptied and left, which is the line back
     to one row with nothing lost. */
  function noteBits() { return { nt: document.getElementById("addnote"), b: document.querySelector(".addrow [data-act=add-note]") }; }
  function drawNote(open) {
    var x = noteBits(); if (!x.nt || !x.b) return;
    x.nt.hidden = !open;
    x.b.classList.toggle("on", !!open);
    x.b.setAttribute("aria-expanded", String(!!open));
    var w = open ? "Close the note" : "Add a note";
    x.b.setAttribute("aria-label", w); x.b.setAttribute("title", w);
  }
  function openNote() { var x = noteBits(); if (!x.nt) return; drawNote(true); x.nt.focus(); }
  function foldNote() { var x = noteBits(); if (!x.nt) return; x.nt.value = ""; drawNote(false); typing(); }
  function noteIsOpen() { var x = noteBits(); return !!(x.nt && !x.nt.hidden); }
  function setAddDue(ar, day) {
    ar.setAttribute("data-due", day || ""); ar.setAttribute("data-picked", "1");
    var w = ar.querySelector(".when");
    if (!w) return;
    w.setAttribute("data-due", day || "");
    var word = w.querySelector(".wk"), list = w.querySelector(".weeks");
    if (list) {
      var hit = null;
      list.querySelectorAll("[data-act=pick-week]").forEach(function (b) {
        var on = (b.getAttribute("data-day") || "") === (day || "");
        b.classList.toggle("on", on); b.setAttribute("aria-selected", String(on));
        if (on && b.getAttribute("data-day")) hit = b;
      });
      /* The word is the picker's own — press "Next week" and the line reads
         "Next week" (§356.15, §53.5) — and it is never bold: the bold went
         with the words, and stays on the picker's own row. */
      if (!word) { word = document.createElement("span"); word.className = "wk"; w.insertBefore(word, list); }
      word.className = "wk";
      word.textContent = !day ? "No date" : hit ? hit.querySelector("b").textContent : dayWord(day);
    } else {
      w.textContent = day ? dayWord(day) : "No date";
    }
  }
  function setAddOwner(ar, key) {
    ar.setAttribute("data-owner", key); ar.setAttribute("data-picked", "1");
    var w = ar.querySelector(".who"), name = "";
    if (!w) return;
    w.querySelectorAll("[data-act=pick-owner]").forEach(function (b) {
      var on = b.getAttribute("data-key") === key;
      b.classList.toggle("on", on); b.setAttribute("aria-selected", String(on));
      if (on) name = b.textContent;
    });
    var wn = w.querySelector(".wn"); if (wn && name) wn.textContent = name;
  }
  /* "Thu 17 Sep" from YYYY-MM-DD, for a day picked by hand on the add line. */
  var WD = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"], MO = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  function dayWord(day) {
    var m = /^(\\d{4})-(\\d{2})-(\\d{2})$/.exec(day || ""); if (!m) return day || "";
    var d = new Date(Date.UTC(+m[1], +m[2] - 1, +m[3]));
    return WD[d.getUTCDay()] + " " + d.getUTCDate() + " " + MO[d.getUTCMonth()];
  }
  function submitAdd() {
    var add = document.getElementById("add"), nt = document.getElementById("addnote"), ar = document.querySelector(".addrow");
    if (!add || !ar) return;
    var t = add.value.replace(/\\s+/g, " ").trim();
    if (!t) { add.focus(); return; }
    add.disabled = true; if (nt) nt.disabled = true;
    var due = ar.getAttribute("data-due") || null, owner = ar.getAttribute("data-owner") || "";
    post({ act: "add", title: t, description: nt ? nt.value : "", due: due, ownerKey: owner }, { clear: true, focus: "add" },
      function (j) { if (!j) { add.disabled = false; if (nt) nt.disabled = false; add.focus(); } /*%BRK%*/ });
  }
  document.addEventListener("keydown", function (e) {
    var t = e.target;
    if (!t || (t.id !== "add" && t.id !== "addnote")) return;
    if (e.key === "Escape") {
      var add = document.getElementById("add"), nt = document.getElementById("addnote");
      if (add) add.value = ""; if (nt) nt.value = ""; drawNote(false); typing(); return;
    }
    /* TAB FROM THE ACTION OPENS THE NOTE, so a line that needs one is one
       key away and the arrow is not the only door (§61). Only forward, only
       from the action, and only while the note is shut — tabbing on out of
       an empty note folds it behind you, so nothing is left standing open
       for a line that did not want one. */
    if (e.key === "Tab" && !e.shiftKey && t.id === "add" && t.value && !noteIsOpen()) {
      /* ...and only once the line has a name on it (§356.16): at rest the
         arrow beside it is invisible, so a note reachable by Tab there would
         be the one detail the line did not hold back. */
      e.preventDefault(); openNote(); return;
    }
    if (e.key !== "Enter") return;
    e.preventDefault();
    submitAdd();
  });
  document.addEventListener("input", function (e) { if (e.target && (e.target.id === "add" || e.target.id === "addnote")) typing(); });
  document.addEventListener("focusout", function (e) {
    if (!e.target || e.target.id !== "addnote" || e.target.value) return;
    /* NOT WHEN THE ARROW IS WHAT TOOK THE FOCUS: focusout fires before the
       click, so folding here would leave the press to find a shut note and
       open it again — the arrow reading as a control that does nothing
       (§96), on the one press where it plainly did something. */
    var to = e.relatedTarget;
    if (to && to.closest && to.closest("[data-act=add-note]")) return;
    drawNote(false);
  });

  /* ONE POPUP OPEN AT A TIME — the team under a name, the weeks under a
     date, the settings behind the dots — closed by a press elsewhere or
     Escape. */
  function closePops(except) {
    document.querySelectorAll(".who.pick.on, .when.pick.on").forEach(function (w) {
      if (w === except) return;
      w.classList.remove("on"); w.setAttribute("aria-expanded", "false");
      var t = w.querySelector(".team, .weeks"); if (t) t.hidden = true;
    });
    var d = document.querySelector(".dots > button.on");
    if (d && d !== except) { d.classList.remove("on"); d.setAttribute("aria-expanded", "false"); var m = d.parentNode.querySelector(".setmenu"); if (m) m.hidden = true; }
  }
  function togglePop(w, sel) {
    var on = !w.classList.contains("on");
    closePops(w);
    w.classList.toggle("on", on); w.setAttribute("aria-expanded", String(on));
    var t = w.querySelector(sel); if (t) t.hidden = !on;
    if (on && t) { var cur = t.querySelector("button.on") || t.querySelector("button"); if (cur) cur.focus(); }
  }
  function toggleTeam(w) { togglePop(w, ".team"); }
  function toggleWeeks(w) { togglePop(w, ".weeks"); }
  function toggleSettings(b) {
    var on = !b.classList.contains("on");
    closePops(b);
    b.classList.toggle("on", on); b.setAttribute("aria-expanded", String(on));
    var m = b.parentNode.querySelector(".setmenu"); if (m) m.hidden = !on;
  }

  /* THE DATE BOX, in place of the day (or of the week's word, from "a day of
     my own"). It stays until a change, Escape, or a press elsewhere on the
     page — never blur (see the header). On a row a change posts; on the add
     line it sets the line's day. */
  var dateBox = null;
  function openDateBox(cell, was, onPick) {
    closePops(null);
    var inp = document.createElement("input");
    inp.type = "date"; inp.className = "dt"; inp.value = was || "";
    inp.setAttribute("aria-label", "Due date");
    cell.replaceWith(inp); inp.focus();
    var settled = false;
    var back = function () { if (settled) return; settled = true; dateBox = null; inp.replaceWith(cell); };
    dateBox = { inp: inp, back: back };
    inp.addEventListener("change", function () {
      if (inp.value === (was || "")) { back(); return; }
      settled = true; dateBox = null; onPick(inp.value || null, inp, cell);
    });
    inp.addEventListener("keydown", function (ev) { if (ev.key === "Escape") { ev.preventDefault(); back(); } });
    /*%BLUR%*/
    /* The calendar is NOT opened for them: a popup opened by script takes
       the next Escape for itself, so the box would need two to close, and
       the icon on the box is one press away. */
  }
  document.addEventListener("pointerdown", function (e) {
    if (dateBox && e.target !== dateBox.inp) dateBox.back();
  });

  document.addEventListener("click", function (e) {
    var b = e.target.closest("[data-act]");
    if (!b || !e.target.closest(".who.pick, .when.pick, .dots")) closePops(null);
    if (!b) return;
    var act = b.getAttribute("data-act"), id = rowOf(b), ar = inAdd(b);
    if (act === "tick") {
      var done = b.getAttribute("aria-checked") === "true";
      post({ act: "status", id: id, status: done ? "not_started" : "done" });
    } else if (act === "due") {
      if (b.querySelector(".weeks")) toggleWeeks(b);
      else openDateBox(b, b.getAttribute("data-due") || "", function (day, inp, cell) {
        if (ar) { inp.replaceWith(cell); setAddDue(ar, day); cell.setAttribute("data-due", day || ""); cell.textContent = day ? dayWord(day) : "No date"; }
        else post({ act: "due", id: id, due: day });
      });
    } else if (act === "pick-week") {
      var day = b.getAttribute("data-day") || null;
      closePops(null);
      if (ar) setAddDue(ar, day);
      else post({ act: "due", id: id, due: day });
    } else if (act === "pick-day") {
      var cell = b.closest(".when.pick");
      closePops(null);
      if (cell) openDateBox(cell, cell.getAttribute("data-due") || "", function (day, inp, c) {
        if (ar) { inp.replaceWith(c); setAddDue(ar, day); }
        else post({ act: "due", id: id, due: day });
      });
    } else if (act === "who") {
      toggleTeam(b);
    } else if (act === "pick-owner") {
      var w = b.closest(".who.pick"), key = b.getAttribute("data-key") || "";
      closePops(null);
      if (ar) { setAddOwner(ar, key); return; }
      if (w && w.querySelector(".wn") && w.querySelector(".wn").textContent === b.textContent) return;
      post({ act: "owner", id: id, ownerKey: key });
    } else if (act === "settings") {
      toggleSettings(b);
    } else if (act === "set-group" || act === "set-dates") {
      /* Remembered on this browser, in a cookie the page reads on the next
         visit — a preference, never the client's data (§25, §47.1). */
      var v = b.getAttribute("data-value") || "";
      closePops(null);
      if (act === "set-group") { B.setAttribute("data-group", v); remember("smp.tracker.group", v); }
      else { B.setAttribute("data-dates", v); remember("smp.tracker.dates", v); }
      refetch();
    } else if (act === "add-note") {
      if (noteIsOpen()) foldNote(); else openNote();
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
    if (e.key === "Escape") { closePops(null); return; }
    var w = e.target.closest && e.target.closest(".who.pick, .when.pick");
    if (w && e.target === w && (e.key === "Enter" || e.key === " ")) {
      e.preventDefault();
      if (w.classList.contains("who")) toggleTeam(w); else toggleWeeks(w);
    }
  });

  document.addEventListener("change", function (e) {
    var c = e.target.closest("[data-act]");
    if (!c) return;
    var act = c.getAttribute("data-act"), id = rowOf(c);
    if (act === "status") post({ act: "status", id: id, status: c.value });
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
