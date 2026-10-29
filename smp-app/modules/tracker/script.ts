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
  /* THERE IS MORE THAN ONE LINE TO WRITE ON NOW (§532): the page's own at the
     top, one inside every topic's next-week card on the weekly check, and
     (§656) one inside every section the list is grouped by — a topic's or a
     person's — opened by the section's own "+ Add …". They are the SAME line
     — same markup, same controls, same act — so every function here takes
     the line it is working on rather than reaching for the one with the id
     (§53.5). A line is named by what it writes into, on data-line: "main"
     for the page's own, "t:<topic>" for a topic's, "o:<owner>" for a
     person's. A topic's line has its topic fixed; a person's its owner. */
  function lines() { return Array.prototype.slice.call(document.querySelectorAll(".addrow")); }
  function lineKey(ar) { return !ar ? "" : ar.getAttribute("data-line") || "main"; }
  function topicFixed(ar) { return lineKey(ar).indexOf("t:") === 0; }
  function lineOf(key) {
    var all = lines();
    for (var i = 0; i < all.length; i++) if (lineKey(all[i]) === key) return all[i];
    return null;
  }
  function boxOf(ar) { return ar ? ar.querySelector("input.new") : null; }
  function noteOf(ar) { return ar ? ar.querySelector("input.nt") : null; }
  function lineAt(el) { return el && el.closest ? el.closest(".addrow") : null; }

  /* What a hand is typing, read before a swap and put back after it: every
     line's action and note, the week and owner picked on it, and whether the
     topics panel was open — a rename there redraws the whole list, and a
     panel that shut itself after each one would have to be reopened for the
     next (§35: what a hand is doing survives a swap). */
  function keep() {
    var a = document.activeElement, s = document.querySelector(".srch");
    var k = { srch: s ? s.value : "", focus: null, lines: [], panel: panelIsOpen() };
    lines().forEach(function (r) {
      var b = boxOf(r), nt = noteOf(r);
      k.lines.push({ key: lineKey(r), add: b ? b.value : "", note: nt ? nt.value : "",
        noteOpen: !!(nt && !nt.hidden), due: r.getAttribute("data-due"), owner: r.getAttribute("data-owner"),
        /* the topic is user state on the page's own line and on a person's,
           and structure on a topic's own, so only the first two carry it */
        ptopic: topicFixed(r) ? null : r.getAttribute("data-topic"),
        topicName: topicFixed(r) ? null : r.getAttribute("data-topicname"),
        picked: r.hasAttribute("data-picked") });
    });
    /* the progress boxes (§657), by the action each is on, and which one
       the hand is in */
    k.prog = [];
    document.querySelectorAll(".pnew").forEach(function (b) { if (b.value) k.prog.push({ id: rowOf(b), val: b.value }); });
    var ar = lineAt(a);
    if (ar) k.focus = { line: lineKey(ar), note: !!(a.classList && a.classList.contains("nt")) };
    else if (a && a.classList && a.classList.contains("srch")) k.focus = { srch: true };
    else if (a && a.classList && a.classList.contains("pnew")) k.focus = { prog: rowOf(a) };
    return k;
  }
  function progBox(id) { return id ? document.querySelector('[data-id="' + id + '"] .pnew') : null; }
  function swap(j, k) {
    var body = document.getElementById("body");
    if (!body || !j || typeof j.body !== "string") return;
    body.innerHTML = j.body;
    setOpen(j.open || null);
    var s = document.querySelector(".srch");
    if (k && k.lines) k.lines.forEach(function (st) {
      var r = lineOf(st.key); if (!r) return;
      var b = boxOf(r), nt = noteOf(r);
      if (b && st.add) b.value = st.add;
      if (nt && st.note) nt.value = st.note;
      if (st.noteOpen) drawNote(r, true);
      if (st.picked) { if (st.due != null) setAddDue(r, st.due); if (st.owner) setAddOwner(r, st.owner); }
      if (st.ptopic || st.topicName) setAddTopic(r, st.ptopic || "", st.topicName || "");
    });
    /* the sections opened to show their done rows, the rows just ticked,
       and the sections' own write lines opened by their "+ Add …" (§656),
       stay as they were across the swap — so a run of actions can be
       written into one section without reopening its line for each */
    document.querySelectorAll(".sec").forEach(function (sec) { if (shown.has(sec.getAttribute("data-key"))) sec.classList.add("showdone"); });
    fresh.forEach(function (id) { var r = document.querySelector('.row[data-id="' + id + '"]'); if (r) r.classList.add("fresh"); });
    opened.forEach(function (key) { var r = lineOf(key); if (r) r.hidden = false; });
    /* the progress boxes keep their half-typed words, and the history stays
       unfolded where it was unfolded (§657) */
    if (k && k.prog) k.prog.forEach(function (st) { var b = progBox(st.id); if (b) b.value = st.val; });
    histOpen.forEach(function (id) { var o = document.querySelector('.open[data-id="' + id + '"]'); if (o) drawHist(o, true); });
    sizeAll();
    if (s && k && k.srch) s.value = k.srch;
    if (k && k.panel) showPanel(true);
    if (k && k.focus) {
      if (k.focus.srch) { if (s) s.focus(); }
      else if (k.focus.prog) { var pb = progBox(k.focus.prog); if (pb) pb.focus(); }
      else {
        var r2 = lineOf(k.focus.line), el = r2 ? (k.focus.note ? noteOf(r2) : boxOf(r2)) : null;
        if (el) el.focus();
      }
    }
    typingAll();
  }
  var shown = new Set(), fresh = new Set(), opened = new Set(), histOpen = new Set();
  /* THE BOXES THAT FIT THEIR TEXT (§657): the stylesheet's field-sizing does
     it where the browser knows the word; elsewhere the height is set from
     the text, on every keystroke and after every swap. */
  var sizes = !(window.CSS && CSS.supports && CSS.supports("field-sizing", "content"));
  function size(t) { if (!sizes || !t) return; t.style.height = "auto"; t.style.height = t.scrollHeight + "px"; }
  function sizeAll() { document.querySelectorAll("textarea.desc, .prog textarea").forEach(size); }
  function drawHist(o, on) {
    var b = o.querySelector("[data-act=hist]"), h = o.querySelector(".hist"); if (!b || !h) return;
    h.hidden = !on; b.classList.toggle("on", !!on); b.setAttribute("aria-expanded", String(!!on));
  }
  /* A PRESS SHOWS AT ONCE (§671, rule 1d). Every handler below notes the
     control under the hand in "pressed", and a request made from it marks
     the row, panel or line that control sits in busy — dimmed, and taking no
     second press — until the answer's swap carries the mark away. A refusal
     or a lost connection takes it off by hand. The add line is not marked:
     its box already disables itself. */
  var pressed = null;
  function markBusy(el) {
    var r = el && el.closest ? el.closest(".row, .open, .pline, .trow, .sh") : null;
    if (!r) return null;
    r.classList.add("busy"); r.setAttribute("aria-busy", "true");
    return r;
  }
  function unmark(r) { if (r && r.isConnected) { r.classList.remove("busy"); r.removeAttribute("aria-busy"); } }
  /* A SAVE OUTLIVES THE PAGE IT WAS SENT FROM (§671): the description saves
     when its box is left, and the box is often left by the press that leaves
     the page. A small body is sent keepalive (the browser refuses a keepalive
     body past 64 KB, so a long one goes the plain way). */
  function small(s) { return new Blob([s]).size <= 60000; }
  var chain = Promise.resolve();
  function request(method, url, body, k, then, quiet) {
    if (!quiet) say("");
    var busy = markBusy(pressed); pressed = null;
    chain = chain.then(function () {
      var init = { method: method, credentials: "same-origin", headers: {} };
      if (body) { init.headers["Content-Type"] = "application/json"; init.body = JSON.stringify(body); init.keepalive = /*%KA%*/small(init.body); }
      return fetch(url, init)
        .then(function (r) { return r.json().catch(function () { return { ok: false, why: "The server did not answer." }; }); })
        .then(function (j) {
          if (!j || !j.ok) {
            say((j && j.why) || "That did not save. Try again."); unmark(busy); if (then) then(null);
            /* A REFUSED CHANGE IS DRAWN AGAIN FROM THE SERVER (§671): a rename,
               an edited entry or a picked status was written on screen before
               the answer, so on a refusal the screen would keep the refused
               words beside a message saying they were refused. The list is
               read again, quietly, so what shows is what is stored. */
            /*%REFUSED%*/
            if (method === "POST") refetch(null, true);
            return;
          }
          swap(j, k); if (then) then(j);
        })
        .catch(function () { say("Could not reach the server. Nothing was changed."); unmark(busy); if (then) then(null); });
    });
  }
  function post(act, k, then) {
    var a = ask(); act.view = a.view; act.q = a.q; act.group = a.group; act.dates = a.dates; act.open = a.open;
    request("POST", API, act, k || keep(), then);
  }
  function refetch(k, quiet) {
    var a = ask();
    request("GET", LIST + "?view=" + encodeURIComponent(a.view) + "&q=" + encodeURIComponent(a.q) +
      "&group=" + encodeURIComponent(a.group) + "&dates=" + encodeURIComponent(a.dates) + (a.open ? "&open=" + encodeURIComponent(a.open) : ""), null, k || keep(), null, quiet);
  }
  function rowOf(el) { var r = el.closest(".row, .open, .pline"); return r ? r.getAttribute("data-id") : null; }
  function entryOf(el) { var e = el.closest(".pe"); return e ? e.getAttribute("data-pid") : null; }
  function inAdd(el) { return el.closest(".addrow"); }

  /* THE ADD LINE: its week and owner are set on the line, drawn at once,
     posted only on Enter. The line lights while anything is typed in it. */
  function typing(ar) {
    if (!ar) return;
    var b = boxOf(ar), nt = noteOf(ar);
    ar.classList.toggle("typing", !!((b && b.value) || (nt && nt.value)));
  }
  function typingAll() { lines().forEach(typing); }
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
  function noteBtn(ar) { return ar ? ar.querySelector("[data-act=add-note]") : null; }
  function drawNote(ar, open) {
    var nt = noteOf(ar), b = noteBtn(ar); if (!nt || !b) return;
    nt.hidden = !open;
    b.classList.toggle("on", !!open);
    b.setAttribute("aria-expanded", String(!!open));
    var w = open ? "Close the note" : "Add a note";
    b.setAttribute("aria-label", w); b.setAttribute("title", w);
  }
  function openNote(ar) { var nt = noteOf(ar); if (!nt) return; drawNote(ar, true); nt.focus(); }
  function foldNote(ar) { var nt = noteOf(ar); if (!nt) return; nt.value = ""; drawNote(ar, false); typing(ar); }
  function noteIsOpen(ar) { var nt = noteOf(ar); return !!(nt && !nt.hidden); }
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
  /* THE ADD LINE'S TOPIC (§497): an open topic picked from the list, a new
     one named in the box under it (made on Enter, with the action), or none. */
  function setAddTopic(ar, id, name) {
    if (id) { ar.setAttribute("data-topic", id); ar.removeAttribute("data-topicname"); }
    else ar.removeAttribute("data-topic");
    if (!id && name) ar.setAttribute("data-topicname", name); else if (!name) ar.removeAttribute("data-topicname");
    var p = ar.querySelector(".tpk"); if (!p) return;
    var word = name;
    if (id) { var b = p.querySelector('[data-act=pick-topic][data-topic="' + id + '"]'); if (b) word = b.textContent; }
    p.querySelectorAll("[data-act=pick-topic]").forEach(function (b) {
      var on = (b.getAttribute("data-topic") || "") === (id || "") && !!(id || !name);
      b.classList.toggle("on", on); b.setAttribute("aria-selected", String(on));
    });
    var tw = p.querySelector(".tw"); if (tw) tw.textContent = word || "Topic";
    p.classList.toggle("set", !!word);
  }
  /* ENTER ADDS, AND THE LINE IS EMPTY AND STILL UNDER THE CURSOR for the
     next one — on whichever line was written, so a check walked down topic
     by topic never loses its place. The topic the line was picked or stood
     in rides on it; everything else the line holds is kept across the swap
     exactly as the other lines' is — EXCEPT THE WEEK AND THE OWNER PICKED ON
     IT, which go back to the line's own (§567). Islam, of a line that kept
     "Next week · Islam" after the add: *"reset after each add"*. Carried, the
     next action went to the same person and week with nothing on the screen
     saying so until it was posted (§96); the drawn line is the server's, so
     forgetting the picks is all a reset takes. */
  function submitAdd(ar) {
    var box = boxOf(ar), nt = noteOf(ar);
    if (!ar || !box) return;
    var t = box.value.replace(/\\s+/g, " ").trim();
    if (!t) { box.focus(); return; }
    box.disabled = true; if (nt) nt.disabled = true;
    var key = lineKey(ar);
    var due = ar.getAttribute("data-due") || null, owner = ar.getAttribute("data-owner") || "";
    var tid = ar.getAttribute("data-topic") || "", tname = ar.getAttribute("data-topicname") || "";
    var payload = { act: "add", title: t, description: nt ? nt.value : "", due: due, ownerKey: owner };
    if (tid) payload.topicId = tid; else if (tname) payload.topicName = tname;
    var k = keep();
    k.lines.forEach(function (st) { if (st.key === key) { st.add = ""; st.note = ""; st.noteOpen = false; st.picked = false; /*%PICKS%*/ } });
    k.focus = { line: key };
    post(payload, k, function (j) { if (!j) { box.disabled = false; if (nt) nt.disabled = false; box.focus(); } /*%BRK%*/ });
  }
  document.addEventListener("keydown", function (e) {
    var t = e.target;
    if (!t || !t.classList || !(t.classList.contains("new") || t.classList.contains("nt"))) return;
    var ar = lineAt(t); if (!ar) return;
    if (e.key === "Escape") {
      var box = boxOf(ar), nt2 = noteOf(ar), empty = !(box && box.value) && !(nt2 && nt2.value), key2 = lineKey(ar);
      if (box) box.value = ""; if (nt2) nt2.value = ""; drawNote(ar, false); typing(ar);
      /* ON A SECTION'S OWN LINE, ALREADY EMPTY, Escape is the way back
         (§61, §656): the line folds and the "+ Add …" that opened it takes
         the focus. The check's lines always stand, so they are not folded. */
      if (empty && opened.has(key2)) {
        ar.hidden = true; opened.delete(key2);
        var back2 = document.querySelector('[data-act=add-here][data-line="' + key2 + '"]'); if (back2) back2.focus();
      }
      return;
    }
    /* TAB FROM THE ACTION OPENS THE NOTE, so a line that needs one is one
       key away and the arrow is not the only door (§61). Only forward, only
       from the action, and only while the note is shut — tabbing on out of
       an empty note folds it behind you, so nothing is left standing open
       for a line that did not want one. */
    if (e.key === "Tab" && !e.shiftKey && t.classList.contains("new") && t.value && !noteIsOpen(ar)) {
      /* ...and only once the line has a name on it (§356.16): at rest the
         arrow beside it is invisible, so a note reachable by Tab there would
         be the one detail the line did not hold back. */
      e.preventDefault(); openNote(ar); return;
    }
    if (e.key !== "Enter") return;
    e.preventDefault();
    submitAdd(ar);
  });
  /* THE PROGRESS BOX (§657): Enter writes the entry on the action the box
     is under — the opened row's, or a row's on the check — and the list is
     drawn again with it at the top, the box empty and still under the
     cursor for the next one. Escape clears it. The key and the Enter button
     beside the box (§677) do the same one thing. */
  function addProgress(t) {
    var v = t.value.replace(/\\s+/g, " ").trim(), id = rowOf(t);
    if (!v || !id) { t.focus(); return; }
    var k = keep();
    k.prog = k.prog.filter(function (st) { return st.id !== id; });
    k.focus = { prog: id };
    t.disabled = true; pressed = t;
    post({ act: "progress-add", id: id, body: v }, k, function (j) { if (!j) { t.disabled = false; t.focus(); } });
  }
  document.addEventListener("keydown", function (e) {
    var t = e.target;
    if (!t || !t.classList || !t.classList.contains("pnew")) return;
    if (e.key === "Escape") { t.value = ""; return; }
    if (e.key !== "Enter") return;
    e.preventDefault();
    addProgress(t);
  });
  document.addEventListener("input", function (e) {
    var t = e.target;
    if (t && t.tagName === "TEXTAREA" && (t.classList.contains("desc") || t.closest(".prog"))) size(t);
  });
  document.addEventListener("keydown", function (e) {
    var t = e.target;
    if (!t || !t.classList || !t.classList.contains("tnew")) return;
    if (e.key === "Enter") {
      e.preventDefault();
      var ar = t.closest(".addrow"), v = t.value.replace(/\\s+/g, " ").trim();
      if (!ar) {
        /* A row's own list (§503): the new topic is made and set on that
           row in one press, the server finding it if the name exists. */
        var rid = rowOf(t);
        closePops(null);
        pressed = t;
        if (v && rid) post({ act: "topic", id: rid, topicName: v });
        return;
      }
      if (v) setAddTopic(ar, "", v);
      closePops(null);
      var add = boxOf(ar); if (add) add.focus();
    } else if (e.key === "Escape") { t.value = ""; }
  });
  /* THE PANEL'S OWN "New topic…" (§533): the topic is made and nothing else
     — it belongs to no action yet, which is exactly the kind of topic the
     page could not make before. The panel is still open afterwards (keep),
     so a list of them can be typed in one sitting. */
  document.addEventListener("keydown", function (e) {
    var t = e.target;
    if (!t || !t.classList || !t.classList.contains("tpnew")) return;
    if (e.key === "Enter") {
      e.preventDefault();
      var v = t.value.replace(/\\s+/g, " ").trim();
      if (!v) return;
      t.value = ""; pressed = t;
      post({ act: "topic-new", name: v });
    } else if (e.key === "Escape") { t.value = ""; }
  });
  document.addEventListener("input", function (e) {
    var t = e.target;
    if (t && t.classList && (t.classList.contains("new") || t.classList.contains("nt"))) typing(lineAt(t));
  });
  document.addEventListener("focusout", function (e) {
    if (!e.target || !e.target.classList || !e.target.classList.contains("nt") || e.target.value) return;
    /* NOT WHEN THE ARROW IS WHAT TOOK THE FOCUS: focusout fires before the
       click, so folding here would leave the press to find a shut note and
       open it again — the arrow reading as a control that does nothing
       (§96), on the one press where it plainly did something. */
    var to = e.relatedTarget;
    if (to && to.closest && to.closest("[data-act=add-note]")) return;
    drawNote(lineAt(e.target), false);
  });

  /* ONE POPUP OPEN AT A TIME — the team under a name, the weeks under a
     date, the settings behind the dots — closed by a press elsewhere or
     Escape. */
  function closePops(except) {
    document.querySelectorAll(".who.pick.on, .when.pick.on, .tpk.on").forEach(function (w) {
      if (w === except) return;
      w.classList.remove("on"); w.setAttribute("aria-expanded", "false");
      var t = w.querySelector(".team, .weeks, .topics"); if (t) t.hidden = true;
    });
    document.querySelectorAll(".dots > button.on, .tdots > button.on").forEach(function (d) {
      if (d === except) return;
      d.classList.remove("on"); d.setAttribute("aria-expanded", "false");
      var m = d.parentNode.querySelector(".setmenu, .tmenu"); if (m) m.hidden = true;
    });
    var tp = panelEl(); if (tp && !tp.hidden) tp.hidden = true;
  }
  /* THE TOPICS PANEL (§533) hangs where the settings menu hangs, off the same
     ⋯, and only one of the two is ever open: "Topics" shuts the menu and
     opens the panel, and anything that closes a popup closes both. */
  function panelEl() { return document.querySelector(".tpanel"); }
  function panelIsOpen() { var p = panelEl(); return !!(p && !p.hidden); }
  function showPanel(on) {
    var p = panelEl(); if (!p) return;
    closePops(null);
    p.hidden = !on;
    var d = document.querySelector(".dots > button[data-act=settings]");
    if (d) { d.classList.toggle("on", !!on); d.setAttribute("aria-expanded", String(!!on)); }
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
    var m = b.parentNode.querySelector(".setmenu, .tmenu"); if (m) m.hidden = !on;
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
    pressed = e.target;
    var b = e.target.closest("[data-act]");
    if (!b || !e.target.closest(".who.pick, .when.pick, .dots, .tpk, .tdots")) closePops(null);
    if (!b) return;
    var act = b.getAttribute("data-act"), id = rowOf(b), ar = inAdd(b);
    if (act === "tick") {
      var done = b.getAttribute("aria-checked") === "true";
      if (!done) fresh.add(id); else fresh.delete(id);
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
    } else if (act === "tpk") {
      if (e.target.closest(".topics")) return;
      togglePop(b, ".topics");
    } else if (act === "pick-topic") {
      var tp = b.getAttribute("data-topic") || "";
      closePops(null);
      if (ar) { setAddTopic(ar, tp, tp ? b.textContent : ""); var add2 = boxOf(ar); if (add2) add2.focus(); }
      /* A row's topic column (§503): set it there and then, unless the pick
         is the topic the row already carries. */
      else if (id && !b.classList.contains("on")) post({ act: "topic", id: id, topicId: tp || null });
    } else if (act === "show-done") {
      var sec = b.closest(".sec"), key = sec ? sec.getAttribute("data-key") : null;
      if (sec) { var on2 = !sec.classList.contains("showdone"); sec.classList.toggle("showdone", on2); if (on2) shown.add(key); else shown.delete(key); }
    } else if (act === "add-here") {
      /* THE SECTION'S OWN LINE (§656): opened where the press was made and
         kept open across the swaps that follow, so the action is written —
         and lands — under the heading the hand is on. Scrolled only where
         it is out of sight, measured before the focus (§565's reason). */
      var key5 = b.getAttribute("data-line") || "", ar5 = lineOf(key5);
      if (ar5) {
        ar5.hidden = false; opened.add(key5);
        var add5 = boxOf(ar5);
        if (add5) { var bx5 = add5.getBoundingClientRect(), off5 = bx5.top < 0 || bx5.bottom > window.innerHeight; add5.focus(); if (off5) add5.scrollIntoView({ block: "center" }); }
      }
    } else if (act === "add-to-topic") {
      /* §497's way, kept for the add-at-top break alone: the page's own line
         filled and focused instead of the section's. */
      var ar2 = lineOf("main");
      /* PINNED, THE LINE IS ALREADY ON SCREEN (§565), and scrolling it to the
         middle would carry the page away from the topic just pressed — so
         it scrolls only where it is out of sight: on a phone, where the band
         is not pinned. Measured BEFORE the focus, which scrolls by itself. */
      if (ar2) { setAddTopic(ar2, b.getAttribute("data-topic") || "", b.getAttribute("data-name") || ""); var add3 = boxOf(ar2); if (add3) { var bx = add3.getBoundingClientRect(), off = bx.top < 0 || bx.bottom > window.innerHeight; add3.focus(); if (off) add3.scrollIntoView({ block: "center" }); } }
    } else if (act === "carry") {
      /* CARRY TO NEXT WEEK (§532): one press, and the same action redraws
         inside the next card down. The server asks the stored row whether it
         may (§42); the page only draws the press where it may. */
      post({ act: "carry", id: id });
    } else if (act === "topics") {
      showPanel(true);
      var f = panelEl() && panelEl().querySelector(".nm, .tpnew"); if (f) f.focus();
    } else if (act === "topic-menu") {
      toggleSettings(b);
    } else if (act === "topic-rename") {
      /* RENAMED IN PLACE, in whichever of the two places the topic is being
         looked at: its heading on a list grouped by topic, or its line on the
         topics panel (§533). One handler, because it is one rename. */
      var tid = b.getAttribute("data-topic"), trow = b.closest(".trow"), sh = b.closest(".sh");
      var slot = trow ? trow.querySelector(".nm") : sh ? sh.querySelector("h3") : null;
      closePops(null);
      if (trow) showPanel(true);          /* closePops shut the panel the rename happens in */
      if (!slot || (trow && trow.querySelector("input")) || (!trow && slot.querySelector("input"))) return;
      var nmSpan = slot.querySelector(".who2");
      var was = (nmSpan || slot).textContent, inp = document.createElement("input");
      inp.value = was; inp.maxLength = 120; inp.setAttribute("aria-label", "Rename the topic");
      if (trow) { trow.classList.add("edit"); slot.hidden = true; trow.insertBefore(inp, slot); }
      else { slot.textContent = ""; slot.appendChild(inp); }
      inp.focus(); inp.select();
      var settled = false, back = function () {
        if (settled) return; settled = true;
        if (trow) { inp.remove(); slot.hidden = false; trow.classList.remove("edit"); }
        else slot.textContent = was;
      };
      inp.addEventListener("keydown", function (ev) {
        if (ev.key === "Escape") { ev.preventDefault(); ev.stopPropagation(); back(); }
        else if (ev.key === "Enter") { ev.preventDefault(); inp.blur(); }
      });
      inp.addEventListener("blur", function () {
        if (settled) return;
        var v = inp.value.replace(/\\s+/g, " ").trim();
        if (!v || v === was) { back(); return; }
        settled = true;
        if (trow) { inp.remove(); slot.hidden = false; trow.classList.remove("edit"); if (nmSpan) nmSpan.textContent = v; }
        else slot.textContent = v;
        pressed = slot;
        post({ act: "topic-rename", topicId: tid, name: v });
      });
    } else if (act === "topic-close" || act === "topic-reopen" || act === "topic-delete") {
      closePops(null);
      post({ act: act, topicId: b.getAttribute("data-topic") });
    } else if (act === "topic-delete-ask") {
      b.hidden = true; var s3 = b.parentNode.querySelector(".sure"); if (s3) s3.hidden = false;
    } else if (act === "topic-delete-no") {
      var s4 = b.closest(".sure"); if (s4) { s4.hidden = true; var d4 = s4.parentNode.querySelector("[data-act=topic-delete-ask]"); if (d4) d4.hidden = false; }
    } else if (act === "hist") {
      /* THE HISTORY UNFOLDS IN PLACE (§657), and stays unfolded across the
         swaps that follow while the row is open. */
      var o = b.closest(".open"), on3 = !b.classList.contains("on");
      if (o) { drawHist(o, on3); if (on3) histOpen.add(id); else histOpen.delete(id); }
    } else if (act === "progress-go") {
      var pb = b.closest(".pbox"), pn = pb ? pb.querySelector(".pnew") : null;
      if (pn && !pn.disabled) addProgress(pn);
    } else if (act === "progress-edit") {
      /* EDITED IN PLACE (§657): the words become a box; Enter or leaving it
         saves, Escape puts them back. The server stamps it edited. */
      var li = b.closest(".pe"), txt = li ? li.querySelector(".ptxt") : null, pid = entryOf(b);
      if (!li || !txt || li.querySelector("textarea")) return;
      var was3 = txt.textContent, ta = document.createElement("textarea");
      ta.value = was3; ta.maxLength = 2000; ta.setAttribute("aria-label", "Edit the entry"); ta.rows = 2;
      txt.hidden = true; txt.parentNode.insertBefore(ta, txt);
      ta.focus(); size(ta);
      var settled3 = false, back3 = function () { if (settled3) return; settled3 = true; ta.remove(); txt.hidden = false; };
      ta.addEventListener("keydown", function (ev) {
        if (ev.key === "Escape") { ev.preventDefault(); ev.stopPropagation(); back3(); }
        else if (ev.key === "Enter" && !ev.shiftKey) { ev.preventDefault(); ta.blur(); }
      });
      ta.addEventListener("blur", function () {
        if (settled3) return;
        var v3 = ta.value.replace(/[ \\t]+\\n/g, "\\n").trim();
        if (!v3 || v3 === was3) { back3(); return; }
        settled3 = true; ta.remove(); txt.hidden = false; txt.textContent = v3;
        pressed = txt;
        post({ act: "progress-edit", progressId: pid, body: v3 });
      });
    } else if (act === "progress-delete-ask") {
      b.hidden = true; var s5 = b.parentNode.querySelector(".sure"); if (s5) s5.hidden = false;
    } else if (act === "progress-delete-no") {
      var s6 = b.closest(".sure"); if (s6) { s6.hidden = true; var d6 = s6.parentNode.querySelector("[data-act=progress-delete-ask]"); if (d6) d6.hidden = false; }
    } else if (act === "progress-delete") {
      post({ act: "progress-delete", progressId: entryOf(b) });
    } else if (act === "add-note") {
      if (noteIsOpen(ar)) foldNote(ar); else openNote(ar);
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
    var w = e.target.closest && e.target.closest(".who.pick, .when.pick, .tpk");
    if (w && e.target === w && (e.key === "Enter" || e.key === " ")) {
      e.preventDefault();
      if (w.classList.contains("who")) toggleTeam(w); else if (w.classList.contains("tpk")) togglePop(w, ".topics"); else toggleWeeks(w);
    }
  });

  document.addEventListener("change", function (e) {
    pressed = e.target;
    var c = e.target.closest("[data-act]");
    if (!c) return;
    var act = c.getAttribute("data-act"), id = rowOf(c);
    if (act === "status") { if (c.value === "done") fresh.add(id); post({ act: "status", id: id, status: c.value }); }
    else if (act === "topic") post({ act: "topic", id: id, topicId: c.value || null });
  });

  /* THE BAND PINS AT THE TOP BAR'S FOOT (§566), measured rather than assumed:
     the bar is every module's and its height is its own business, so the
     offset is read off it now and again whenever it changes. */
  sizeAll();
  var tb = document.querySelector(".tb");
  function barFoot() { if (tb) document.documentElement.style.setProperty("--tbh", tb.offsetHeight + "px"); }
  barFoot();
  if (tb && typeof ResizeObserver === "function") new ResizeObserver(barFoot).observe(tb);
  else window.addEventListener("resize", barFoot);

  /* THE VIEWS ARE FILTERS, NOT PAGES (§566). Islam: "they need to be filters
     not other pages that take me to another loading page they should act
     instantly". A press lights the tab at once and reads the list in place
     through the read every other press uses (refetch, §53.5), so no page
     loads; the address follows by pushState, so Back steps through the views.
     The tab stays a link: a press with a modifier key, or a page whose script
     did not run, still opens it as before. */
  function viewOf(href) { return new URL(href, location.href).searchParams.get("view"); }
  document.addEventListener("click", function (e) {
    var t = e.target.closest && e.target.closest(".cats a[href]");
    if (!t || e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
    /*%TABS%*/
    var v = viewOf(t.href);
    if (!v) return;
    e.preventDefault();
    closePops(null);
    if (v === (B.getAttribute("data-view") || "week")) return;
    document.querySelectorAll(".cats a[href]").forEach(function (o) {
      if (viewOf(o.href) === v) o.setAttribute("aria-current", "true"); else o.removeAttribute("aria-current");
    });
    B.setAttribute("data-view", v);
    var u = new URL(location.href);
    u.searchParams.set("view", v); u.searchParams.delete("open");
    history.pushState(null, "", u);
    pressed = null; refetch();
  });
  window.addEventListener("popstate", function () {
    var v = new URLSearchParams(location.search).get("view") || "week";
    if (v === (B.getAttribute("data-view") || "week")) return;
    B.setAttribute("data-view", v);
    pressed = null; refetch();
  });

  /* RENAME IN PLACE: a double-click on the name turns it into a box; Enter
     or leaving the box renames, Escape puts the name back. A single click
     does nothing, so a row can still be read without a box opening under
     the pointer. */
  document.addEventListener("dblclick", function (e) {
    var t = e.target.closest(".t[data-rename]");
    if (!t || t.querySelector("input")) return;
    var tn = t.closest(".tn2"), id = rowOf(t), was = t.textContent;
    var inp = document.createElement("input");
    inp.className = "ttl"; inp.value = was; inp.maxLength = 200; inp.setAttribute("aria-label", "Rename the action");
    /* The topic is not set here any more (§503): it has its own column, one
       press away, so the double-click only renames. */
    t.textContent = ""; t.appendChild(inp);
    if (tn) tn.classList.add("editing");
    inp.focus(); inp.select();
    var settled = false;
    var finish = function (keep) {
      if (settled) return; settled = true;
      if (tn) tn.classList.remove("editing");
      var v = inp.value.replace(/\\s+/g, " ").trim();
      if (!keep || !v) v = was;
      t.textContent = v;
      pressed = t;
      if (keep && v !== was) post({ act: "rename", id: id, title: v });
    };
    inp.addEventListener("keydown", function (ev) {
      if (ev.key === "Escape") { ev.preventDefault(); ev.stopPropagation(); finish(false); }
      else if (ev.key === "Enter") { ev.preventDefault(); finish(true); }
    });
    inp.addEventListener("blur", function () { finish(true); });
  });

  /* Saved when you leave the box (§35), and only when it changed. */
  document.addEventListener("focusout", function (e) {
    var c = e.target.closest && e.target.closest("[data-act=notes]");
    if (!c) return;
    if (c.value === c.defaultValue) return;
    var id = rowOf(c), v = c.value;
    pressed = c;
    post({ act: "notes", id: id, description: v });
  });
})();
`;
