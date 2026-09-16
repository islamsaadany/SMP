/* ── MEETING NOTES: the one script (spec 055) ─────────────────────────────
   Served by the module at /<client>/notes/app.js under the shell's
   `script-src 'self'` (lib/shell.ts), and nothing inline. It does one kind of
   thing, the tracker's (§356.12): a control is pressed or a box is left, the
   change is POSTed to the module's own api, and the server ANSWERS WITH THE
   PAGE DRAWN AGAIN — by the same function that drew it — which is swapped in
   place. No reload, and the browser holds no copy of the note and renders no
   part of its own, so it cannot disagree with the server about one (§53.5).
   A refusal is written into the page in the server's own words (§32, §171)
   and swaps nothing.

   SAVED WHEN YOU LEAVE THE BOX (§35), and only when it changed — the title,
   the date, the notes, and every part of the minutes. No Save button, the
   way nothing else in this product has one.

   WHAT A HAND IS TYPING SURVIVES A SWAP (§35, §71.2): the box that has the
   cursor is read before the page is redrawn and put back after it, caret
   included. A swap while somebody is typing in the minutes would otherwise
   throw the half-written line away.

   ONE REQUEST AT A TIME (§240's shape, in the browser): a notes box left and
   Refine pressed in the same second post in that order, and the second
   answer already holds the first change.

   REFINE TAKES SECONDS, so the button says so and is held while it waits —
   a second press would ask the model twice and pay twice. */
export const APP_JS = `(function () {
  "use strict";
  var B = document.body;
  var API = B.getAttribute("data-api") || "", HERE = B.getAttribute("data-here") || "";
  function said() { return document.getElementById("said"); }
  function say(t, good) {
    var s = said(); if (!s) return;
    s.textContent = t || ""; s.className = "said" + (good ? " good" : "");
  }
  function noteId() { return new URLSearchParams(location.search).get("note"); }
  function setNote(id) {
    var u = new URL(location.href);
    if (id) u.searchParams.set("note", id); else u.searchParams.delete("note");
    history.replaceState(null, "", u);
  }
  /* WHERE THE CURSOR IS, so a swap can put it back. A box is named by what
     it is — the act it posts, or the part of the minutes it holds — never by
     its position, because the page is rebuilt and positions move. */
  /* THE OPEN ATTENDEE LIST IS STATE A SWAP MUST CARRY, exactly as the caret
     is: every press here is answered by the page drawn again, so a tick
     rebuilt the list from scratch and it vanished taking the search term with
     it (Islam: "don't close the drop down with each add"). What is carried is
     what a person would lose — that it is open, what they typed to find
     somebody, how far down they had scrolled, and which of its three boxes
     had the cursor. */
  function attState() {
    var box = document.querySelector(".pick:not([hidden])");
    if (!box) return null;
    var f = box.querySelector("[data-act=find-att]"), pl = box.querySelector(".pl");
    var a = document.activeElement, on = "", row = null;
    if (a && a.closest) {
      if (a === f) on = "find";
      else if (a.closest("[data-att-name]")) on = "name";
      else if (a.closest("[data-att-mail]")) on = "mail";
      else row = a.closest("[data-act=pick-att]");
    }
    /* THE ROW BY ITS KEY, never by its position: a tick redraws the list and
       the ticked person may sort elsewhere, so putting the cursor back by
       index lands it on somebody else (§48). */
    return { q: f ? f.value : "", top: pl ? pl.scrollTop : 0, on: on,
             key: row ? row.getAttribute("data-key") : "" };
  }
  /* ONE FILTER, asked by the box being typed in AND by the put-back, or a
     carried search term would show a list it does not match (§53.5). */
  function filterAtt(f) {
    var q = f.value.toLowerCase(), box = f.closest(".pick");
    if (!box) return;
    box.querySelectorAll(".prow").forEach(function (r) {
      r.hidden = !!q && r.textContent.toLowerCase().indexOf(q) < 0;
    });
  }
  function restoreAtt(a) {
    /*%BRK%*/
    if (!a) return false;
    var b = document.querySelector("[data-act=open-att]");
    var box = b && b.parentNode ? b.parentNode.querySelector(".pick") : null;
    if (!box) return false;
    box.hidden = false;
    b.setAttribute("aria-expanded", "true");
    var f = box.querySelector("[data-act=find-att]");
    if (f && a.q) { f.value = a.q; filterAtt(f); }
    var pl = box.querySelector(".pl");
    if (pl) pl.scrollTop = a.top || 0;
    var to = a.on === "find" ? f
           : a.on === "name" ? box.querySelector("[data-att-name]")
           : a.on === "mail" ? box.querySelector("[data-att-mail]") : null;
    if (!to && a.key) {
      /* Matched by walking rather than by an attribute selector, because a
         person key is the register's and is not ours to assume is safe to
         put inside one. */
      Array.prototype.slice.call(box.querySelectorAll("[data-act=pick-att]")).forEach(function (r) {
        if (!to && r.getAttribute("data-key") === a.key) to = r;
      });
    }
    if (to) { to.focus(); if (pl) pl.scrollTop = a.top || 0; return true; }
    return false;
  }
  function keep() {
    var att = attState();
    var a = document.activeElement;
    var f = a && a.closest ? a.closest("[data-act], [data-part], [data-part] > li, [data-part] td") : null;
    if (!f) return att ? { att: att, act: null, part: null, value: null, at: null } : null;
    var part = a.closest("[data-part]"), sel = null;
    if (part) {
      var box = a.closest("li, td, p");
      var kids = Array.prototype.slice.call(part.querySelectorAll("li, td"));
      sel = { part: part.getAttribute("data-part"), i: box ? kids.indexOf(box) : -1 };
    }
    return { att: att, act: f.getAttribute("data-act"), part: sel,
             value: a.value !== undefined ? a.value : null,
             at: a.selectionStart !== undefined && a.selectionStart !== null ? a.selectionStart : null };
  }
  function restore(k) {
    if (!k) return;
    /* The list goes back FIRST: it is rebuilt hidden, and the caret it may be
       holding does not exist until it is shown again. */
    if (restoreAtt(k.att)) return;
    if (!k.act && !k.part) return;
    var el = null;
    if (k.part) {
      var p = document.querySelector('[data-part="' + k.part.part + '"]');
      if (p) el = k.part.i >= 0 ? p.querySelectorAll("li, td")[k.part.i] || p : p;
    } else if (k.act) el = document.querySelector('[data-act="' + k.act + '"]');
    if (!el) return;
    el.focus();
    if (k.value !== null && el.value !== undefined && el.value === k.value && k.at !== null) {
      try { el.setSelectionRange(k.at, k.at); } catch (x) {}
    }
  }
  function swap(j, k) {
    var body = document.getElementById("body");
    if (!body || !j || typeof j.body !== "string") return;
    body.innerHTML = j.body;
    setNote(j.note || null);
    restore(k);
  }
  var chain = Promise.resolve(), busy = false;
  function post(act, opts) {
    opts = opts || {};
    var k = opts.keep === false ? null : keep();
    say("");
    chain = chain.then(function () {
      act.note = noteId();
      return fetch(API, { method: "POST", credentials: "same-origin",
          headers: { "Content-Type": "application/json" }, body: JSON.stringify(act) })
        .then(function (r) { return r.json().catch(function () { return { ok: false, why: "The server did not answer." }; }); })
        .then(function (j) {
          if (!j || !j.ok) { say((j && j.why) || "That did not save. Try again."); if (opts.then) opts.then(null); return; }
          if (j.gone) { location.href = HERE; return; }
          swap(j, k);
          if (j.said) say(j.said, true);
          if (opts.then) opts.then(j);
        })
        .catch(function () { say("Could not reach the server. Nothing was changed."); if (opts.then) opts.then(null); });
    });
    return chain;
  }
  function saved() {
    var s = document.querySelector("[data-saved]");
    if (s) s.textContent = "Saved just now";
  }

  /* ── THE MINUTES: every part read off the page as it stands ──────────
     A part is a box the writer edits, so what is posted is what the page
     holds — read from the DOM rather than kept in a copy beside it. */
  function minutes() {
    var root = document.querySelector("[data-minutes]");
    if (!root) return null;
    var text = function (el) { return (el ? el.innerText : "").replace(/\\s+/g, " ").trim(); };
    var list = function (name) {
      var p = root.querySelector('[data-part="' + name + '"]');
      if (!p) return [];
      return Array.prototype.slice.call(p.querySelectorAll("li")).map(text).filter(Boolean);
    };
    var acts = [];
    var tb = root.querySelector('[data-part="actions"]');
    if (tb) Array.prototype.slice.call(tb.querySelectorAll("tr")).forEach(function (tr) {
      var td = tr.querySelectorAll("td");
      if (!td.length) return;
      var what = text(td[0]);
      if (what) acts.push({ what: what, who: text(td[1]), when: text(td[2]) });
    });
    return { summary: text(root.querySelector('[data-part="summary"]')), discussed: list("discussed"),
             agreed: list("agreed"), actions: acts, open: list("open"),
             next: text(root.querySelector('[data-part="next"]')) };
  }
  var mWas = null;
  function markMinutes() { mWas = JSON.stringify(minutes()); }
  function minutesMoved() { var now = JSON.stringify(minutes()); return now !== mWas && now !== "null"; }

  document.addEventListener("click", function (e) {
    var b = e.target.closest("[data-act]");
    /* A press anywhere ELSE closes the attendee list — and "elsewhere" is a
       question about WHERE the press landed, never about how its act is
       spelt. It was a substring test, which read add-casual as elsewhere and
       shut the list the moment somebody who is not on the register was added:
       an attendee act that happens not to contain those three letters. */
    if (!b || (!b.closest(".pick") && b.getAttribute("data-act") !== "open-att")) closeAtt();
    if (!b) return;
    var act = b.getAttribute("data-act");
    if (act === "new") {
      post({ act: "new" }, { keep: false, then: function (j) { if (j && j.note) location.href = HERE + "?note=" + encodeURIComponent(j.note); } });
    } else if (act === "refine") {
      if (busy) return;
      busy = true;
      var word = b.textContent;
      b.textContent = "Refining…"; b.setAttribute("aria-disabled", "true");
      post({ act: "refine", minutes: minutes() }, { keep: false, then: function () {
        busy = false;
        var again = document.querySelector("[data-act=refine]");
        if (again) { again.textContent = word; again.removeAttribute("aria-disabled"); }
        markMinutes();
      } });
    } else if (act === "send") {
      if (b.getAttribute("aria-disabled") === "true") { say(b.getAttribute("data-why") || ""); return; }
      if (busy) return;
      busy = true;
      var w = b.textContent;
      b.textContent = "Sending…"; b.setAttribute("aria-disabled", "true");
      post({ act: "send", minutes: minutes() }, { keep: false, then: function () {
        busy = false;
        var s = document.querySelector("[data-act=send]");
        if (s && s.textContent === "Sending…") { s.textContent = w; s.removeAttribute("aria-disabled"); }
        markMinutes();
      } });
    } else if (act === "open-att") {
      openAtt(b);
    } else if (act === "pick-att") {
      post({ act: b.getAttribute("data-on") === "true" ? "drop-attendee" : "add-attendee", key: b.getAttribute("data-key") });
    } else if (act === "done-att") {
      closeAtt();
    } else if (act === "drop-att") {
      post({ act: "drop-attendee", at: Number(b.getAttribute("data-i")) }, { keep: false });
    } else if (act === "add-casual") {
      var box = b.closest(".pick");
      var nm = box.querySelector("[data-att-name]"), ml = box.querySelector("[data-att-mail]");
      post({ act: "add-attendee", name: nm.value, email: ml.value }, { then: function (j) {
        /* The pair is redrawn empty by the swap; what this puts back is the
           cursor, so a second person can be typed without reaching for it. */
        if (j) { var again = document.querySelector("[data-att-name]"); if (again) again.focus(); }
      } });
    } else if (act === "delete-ask") {
      b.hidden = true;
      var s2 = b.parentNode.querySelector(".sure"); if (s2) s2.hidden = false;
    } else if (act === "delete-no") {
      var s3 = b.closest(".sure");
      if (s3) { s3.hidden = true; var d = s3.parentNode.querySelector("[data-act=delete-ask]"); if (d) d.hidden = false; }
    } else if (act === "delete") {
      post({ act: "delete" }, { keep: false });
    }
  });

  /* THE ATTENDEE LIST: opened by its own button, closed by Escape or a press
     elsewhere; the search hides rows in place and never repaints (§35). */
  function openAtt(b) {
    var box = b.parentNode.querySelector(".pick");
    if (!box) return;
    var on = box.hidden;
    box.hidden = !on;
    b.setAttribute("aria-expanded", String(on));
    if (on) { var f = box.querySelector("[data-act=find-att]"); if (f) f.focus(); }
  }
  function closeAtt() {
    document.querySelectorAll(".pick").forEach(function (p) { p.hidden = true; });
    document.querySelectorAll("[data-act=open-att]").forEach(function (b) { b.setAttribute("aria-expanded", "false"); });
  }
  document.addEventListener("input", function (e) {
    var f = e.target.closest("[data-act=find-att]");
    if (!f) return;
    filterAtt(f);
  });
  document.addEventListener("keydown", function (e) {
    if (e.key === "Escape") { closeAtt(); return; }
    /* Enter in the casual name or address adds them, so the pair reads like
       one control rather than two boxes and a button. */
    var c = e.target.closest && e.target.closest("[data-att-name], [data-att-mail]");
    if (c && e.key === "Enter") {
      e.preventDefault();
      var add = c.closest(".pick").querySelector("[data-act=add-casual]");
      if (add) add.click();
    }
  });

  /* SAVED WHEN THE BOX IS LEFT, and only when it changed. The title, the
     date and the notes each post their own field; the minutes post whole,
     because a part is not a row with an id — the page holds them and the
     page is what is read (§35). */
  document.addEventListener("focusin", function (e) {
    if (e.target.closest && e.target.closest("[data-minutes]")) markMinutes();
  });
  document.addEventListener("focusout", function (e) {
    var el = e.target;
    if (!el || !el.closest) return;
    if (el.closest("[data-minutes]")) {
      /* The focus may be moving inside the minutes; only a real change
         posts, so moving between two parts posts at most once. */
      setTimeout(function () {
        if (document.activeElement && document.activeElement.closest && document.activeElement.closest("[data-minutes]")) return;
        if (!minutesMoved()) return;
        markMinutes();
        post({ act: "minutes", minutes: minutes() }, { then: function (j) { if (j) saved(); } });
      }, 0);
      return;
    }
    var f = el.closest("[data-act]");
    if (!f) return;
    var act = f.getAttribute("data-act");
    if (act !== "title" && act !== "raw") return;
    if (f.value === f.defaultValue) return;
    f.defaultValue = f.value;
    post({ act: act, value: f.value }, { then: function (j) { if (j) saved(); } });
  });
  /* THE DATE, ONE PRESS (§357.4). The word is the control and it STAYS the
     word: the native box sits beside it hidden in place and is DRIVEN, which
     is this platform's own idiom for a native control it does not want to
     draw (§45.5, the searchable select). Two things fall out of that shape
     rather than being arranged for. The day never reformats under the hand
     that pressed it, where swapping a box in printed whatever spelling the
     browser's locale chose over the word the page had just said. And the
     tracker's own reason for NOT opening the calendar — a popup opened by
     script takes the next Escape for itself, so the box beneath it needs a
     second one — does not arise here, because there is no box beneath it:
     Escape closes the picker and the word was never away.

     A CHANGE POSTS, and the same day picked again fires nothing and posts
     nothing, which is the browser's own rule rather than a guard of ours.
     NEVER ON BLUR: the calendar itself takes the focus, so a box dismissed on
     blur is thrown away the moment it is used (§356.14, this same control one
     module over, where it was measured).

     NO BACKTICK IN HERE: this whole script is one template literal, so a
     quoted name in a comment ends it (§272.8's fault, one quote mark over). */
  var dateOpen = null;
  function hideDate() {
    if (!dateOpen) return;
    var d = dateOpen; dateOpen = null;
    d.inp.classList.add("datenative"); d.inp.classList.remove("date");
    d.inp.setAttribute("aria-hidden", "true"); d.inp.setAttribute("tabindex", "-1");
    d.btn.hidden = false;
  }
  document.addEventListener("pointerdown", function (e) {
    if (dateOpen && e.target !== dateOpen.inp) hideDate();
  });
  document.addEventListener("click", function (e) {
    var b = e.target.closest("button[data-act=date]");
    if (!b) return;
    var inp = b.parentNode.querySelector("input[data-native-date]");
    if (!inp) return;
    if (!inp.getAttribute("data-wired")) {
      inp.setAttribute("data-wired", "1");
      inp.addEventListener("change", function () {
        hideDate();
        post({ act: "date", value: inp.value }, { then: function (j) { if (j) saved(); } });
      });
      inp.addEventListener("keydown", function (ev) { if (ev.key === "Escape") { ev.preventDefault(); hideDate(); } });
    }
    /* WHERE THE CALENDAR CANNOT BE OPENED FOR THEM — an older Safari or
       Firefox — the box is shown in place of the word rather than the press
       doing nothing (§61). It closes on a change, on Escape, or on a press
       elsewhere, by the rule above. */
    try {
      /*%DATEBRK%*/
      if (!inp.showPicker) throw 0;
      inp.showPicker();
    } catch (err) {
      inp.classList.remove("datenative"); inp.classList.add("date");
      inp.removeAttribute("aria-hidden"); inp.removeAttribute("tabindex");
      b.hidden = true; dateOpen = { inp: inp, btn: b }; inp.focus();
    }
  });
  markMinutes();
})();
`;
