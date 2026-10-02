/* ── WRITING A PLAN: the one script (spec 060 §15, §443) ──────────────────
   Served at /<client>/portfolio/write.js under the shell's `script-src 'self'`
   (lib/shell.ts), and nothing inline. It does one kind of thing: a control is
   pressed or a box is left, the change is POSTed to the module's own api, and
   THE SERVER ANSWERS WITH THE PLAN DRAWN AGAIN — by `planBody`, the same
   function that drew the page — which is swapped in place. So the browser
   holds no copy of the tree and renders no row of its own, and it cannot
   disagree with the server about the numbering, about which arrow a row may
   use, or about where an add row goes (§53.5, the tracker's own answer at
   §356.12).

   THERE IS NO SAVE AND NO CANCEL, which is §7.3's decision and §273.4's rule:
   a field writes when the cursor leaves it. Nothing is held in the browser,
   so nothing can be lost by closing the tab and there is no draft to guard.

   WHAT A HAND IS TYPING SURVIVES A SWAP (§35, §71.2): the add box that has
   the cursor is read before the redraw and put back after it, focus and all —
   a tick pressed with half a name typed must not throw the name away.

   ONE REQUEST AT A TIME (§240's shape, in the browser): a box left and an
   arrow pressed in the same second post in that order, and the second answer
   already holds the first change.

   A REFUSAL IS WRITTEN INTO THE PAGE IN THE SERVER'S OWN WORDS (§32, §171),
   never swallowed, and swaps nothing — in the strip under the table for the
   tree, and under the panel for the panel, which is §190's *the dismiss under
   the box with the issue*.

   THE DATE BOX IS NEVER DISMISSED ON BLUR (§356.14, the fault Islam hit on
   the tracker): opening the browser's calendar IS focus leaving the box, so a
   day picked would land on a box already gone. The native box is clipped
   beside the word and stays there; the press asks for the picker and the
   `change` is what commits.

   AND MOVING AN END DATE SHOWS YOU FIRST (§3 №4, §15.5): the api is asked for
   the PREVIEW before anything is written — `cascade` is a rule and the server
   owns it — and the dialog lists what would shift, each ticked. Nothing is
   written until the press, the date being moved included. */
export const WRITE_JS = `(function () {
  "use strict";
  var B = document.body;
  var API = B.getAttribute("data-api") || "";
  var PROJ = B.getAttribute("data-project") || "";
  if (!API || !PROJ) return;
  var body = document.getElementById("plbody");
  if (!body) return;

  function say(where, t) {
    var el = document.getElementById(where);
    if (el) el.textContent = t || "";
  }
  function clearSaid() { say("said", ""); say("asaid", ""); }

  /* What a hand is typing, read before a swap and put back after it. */
  function keep() {
    var a = document.activeElement;
    if (!a) return null;
    if (a.tagName !== "INPUT" && a.tagName !== "TEXTAREA") return null;
    var r = a.closest(".addr");
    if (r) return { kind: "addr", at: r.getAttribute("data-add"), lvl: r.className, v: a.value };
    if (a.id === "subadd") return { kind: "subadd", v: a.value };
    return null;
  }
  function putBack(k) {
    if (!k) return;
    var el = null;
    if (k.kind === "addr") {
      var rows = [].slice.call(document.querySelectorAll(".addr"));
      for (var i = 0; i < rows.length; i++)
        if (rows[i].getAttribute("data-add") === k.at) { el = rows[i].querySelector("input"); break; }
    } else if (k.kind === "subadd") el = document.getElementById("subadd");
    if (!el) return;
    el.value = k.v || "";
    el.focus();
  }

  var chain = Promise.resolve();
  var where = "said";
  function post(act, then) {
    clearSaid();
    var k = keep();
    chain = chain.then(function () {
      /* EVERY ACT NAMES ITS PROJECT, set here and at no call site: the api
         asks for it by name, and fifteen presses each remembering to send it
         is fifteen chances to forget (§104.7). */
      if (B.getAttribute("data-brk") !== "no-project") act.id = PROJ;
      act.view = B.getAttribute("data-view") || "";
      /* WHICH ACTIVITY IS OPEN IS SCREEN STATE, LIKE THE VIEW BESIDE IT, and
         only the browser knows it — so it is sent on every act, here and at
         no call site (§104.7, the line above's own reason). done() used to
         guess at it from the act's own fields, which is a coincidence rather
         than an answer: it is the open activity for a step or a field write
         and somebody else's row for an arrow (§53.5). */
      act.open = actId() || "";
      return fetch(API, { method: "POST", credentials: "same-origin",
          headers: { "Content-Type": "application/json" }, body: JSON.stringify(act) })
        .then(function (r) { return r.json().catch(function () { return { ok: false, why: "The server did not answer." }; }); })
        .then(function (j) {
          if (!j || !j.ok) { say(where, (j && j.why) || "That did not save. Try again."); if (then) then(null); return; }
          if (typeof j.body === "string") { body.innerHTML = j.body; putBack(k); }
          if (then) then(j);
        })
        .catch(function () { say(where, "Could not reach the server. Nothing was changed."); if (then) then(null); });
    });
    return chain;
  }

  function rowOf(el) {
    var r = el.closest ? el.closest("[data-row]") : null;
    return r ? { id: r.getAttribute("data-row"), kind: r.getAttribute("data-kind") } : null;
  }
  function actId() {
    var p = document.querySelector(".act[data-act]");
    return p ? p.getAttribute("data-act") : null;
  }

  /* ══ the tree ═══════════════════════════════════════════════════════ */
  body.addEventListener("click", function (e) {
    var t = e.target;
    var ak = t.closest ? t.closest("button.ak") : null;
    if (ak) {
      /* A phase offers both kinds; pressing one picks it and puts the cursor
         in the box, which is where the kind is decided (§15.3). */
      var strip = ak.parentElement;
      [].slice.call(strip.querySelectorAll("button.ak")).forEach(function (o) {
        o.setAttribute("aria-pressed", String(o === ak));
      });
      strip.setAttribute("data-kind", ak.getAttribute("data-kind") || "");
      var box = strip.querySelector("input");
      if (box) box.focus();
      return;
    }
    var mv = t.closest ? t.closest("button[data-mv]") : null;
    if (mv) {
      var r = rowOf(mv);
      if (r) { where = "said"; post({ act: "move", row: r.id, kind: r.kind, dir: mv.getAttribute("data-mv") }); }
      return;
    }
    var rm = t.closest ? t.closest("button[data-rm]") : null;
    if (rm) { askRemove(rowOf(rm), rm); return; }
    var srm = t.closest ? t.closest("button[data-subrm]") : null;
    if (srm) {
      where = "asaid";
      post({ act: "subremove", activity: actId(), sub: srm.getAttribute("data-subrm") });
      return;
    }
    var day = t.closest ? t.closest("button[data-day]") : null;
    if (day) {
      var box2 = day.parentElement.querySelector("input[type=date]");
      if (!box2) return;
      /* ASKED FOR, never shown in place of the word: the native box stays
         clipped beside it, so the day cannot reformat under the hand that
         pressed it (§357.4). A browser with no picker shows the box. */
      if (box2.showPicker) { try { box2.showPicker(); return; } catch (x) {} }
      box2.removeAttribute("aria-hidden");
      box2.setAttribute("style", "position:static;width:auto;height:auto;opacity:1;pointer-events:auto");
      box2.focus();
      return;
    }
    var mk = t.closest ? t.closest("#mark") : null;
    if (mk) { where = "asaid"; post({ act: "markdone", activity: actId(), done: mk.getAttribute("data-done") }); return; }
  });

  /* ADDING IS A NAME AND ENTER (§15.3, §356's idiom). Escape clears the box. */
  body.addEventListener("keydown", function (e) {
    var t = e.target;
    if (e.key === "Escape") {
      if (t.closest && (t.closest(".addr") || t.id === "subadd")) { t.value = ""; clearSaid(); }
      return;
    }
    if (e.key !== "Enter") return;
    var ar = t.closest ? t.closest(".addr") : null;
    /* THE BOX IS EMPTIED THE MOMENT ENTER IS ACCEPTED, and that is one
       decision for every add box there is rather than one per kind (§104.7):
       a fifth box added later is covered the day it is added.

       IT HAS TO HAPPEN BEFORE THE WRITE GOES OUT, which is the whole fault.
       Every write remembers what a hand is typing and puts it back once the
       body is swapped in (keep/putBack, §356.12) — right for a figure
       somebody is half way through, and wrong for this box, whose contents
       have just been USED to make the row. So the name stayed in it with the
       cursor still in it: a second Enter made the same row twice, and typing
       the next name appended to the last, storing Discovery then Delivery
       as DiscoveryDelivery. Cleared first, keep captures nothing and
       putBack hands back an empty box with the cursor in it, which is what
       a person who has just named one thing is about to need.

       AND IT IS WHAT MADE AN ACTIVITY UNDER A WORK PACKAGE UNREACHABLE: the
       cursor stayed in the PHASE's box holding the package's own name, so the
       '+ activity' row drawn underneath was never the box being typed into
       (§61's trap, by way of a cursor rather than a missing control). */
    if (ar || t.id === "subadd") {
      e.preventDefault();
      var nm = t.value;
      if (!nm.trim()) return;
      if (B.getAttribute("data-brk") !== "keep-add-box") t.value = "";
      if (ar) {
        where = "said";
        post({ act: "add", kind: ar.getAttribute("data-kind"), parent: ar.getAttribute("data-add"), name: nm });
      } else {
        where = "asaid";
        post({ act: "subadd", activity: actId(), name: nm });
      }
      return;
    }
    /* A one-line box commits on Enter rather than inserting a newline, which
       is §229's rule and the same one a plan title obeys in Strategy. */
    if (t.tagName === "INPUT" && t.classList.contains("fld")) { e.preventDefault(); t.blur(); }
  });

  /* ══ a field writes when the cursor leaves it (§35, §273.4) ══════════ */
  body.addEventListener("change", function (e) {
    var t = e.target;
    if (t.getAttribute && t.getAttribute("type") === "date") { pickedDay(t); return; }
    var sub = t.getAttribute ? t.getAttribute("data-sub") : null;
    if (sub) {
      where = "asaid";
      post({ act: "subfield", activity: actId(), sub: sub, field: t.getAttribute("data-field"), value: t.value });
      return;
    }
    var f = t.getAttribute ? t.getAttribute("data-field") : null;
    if (f) {
      var a = actId();
      if (!a) return;
      where = "asaid";
      var v = t.type === "checkbox" ? (t.checked ? "1" : "0") : t.value;
      post({ act: "field", row: a, kind: "activity", field: f, value: v });
      return;
    }
    if (t.id === "pct") { where = "asaid"; post({ act: "progress", activity: actId(), value: t.value }); return; }
  });

  /* ══ a day, and what moving an end date drags (§15.5) ════════════════ */
  function pickedDay(box) {
    var bu = box.parentElement.querySelector("button[data-day]");
    var field = bu ? bu.getAttribute("data-day") : "";
    var a = actId();
    if (!a) return;
    where = "asaid";
    if (field !== "end") { post({ act: "field", row: a, kind: "activity", field: field, value: box.value }); return; }
    /* THE PREVIEW IS THE SERVER'S, because \`cascade\` is a rule — asking the
       browser to work out what shifts would be a second answer to it, and the
       dialog's whole promise is that it lists what the WRITE will do. */
    post({ act: "preview", activity: a, end: box.value }, function (j) {
      if (!j) return;
      if (!j.shifts || !j.shifts.length) {
        post({ act: "movedate", activity: a, end: box.value, take: [] });
        return;
      }
      openShift(a, box.value, j);
    });
  }

  function openShift(a, end, j) {
    var ov = document.getElementById("ov-shift");
    if (!ov) return;
    document.getElementById("sh1").textContent = j.title || "Moving its end date";
    var n = j.shifts.length;
    document.getElementById("sh-body").innerHTML =
      "<p>" + j.lede + "</p><div class=\\"shifts\\">" +
      j.shifts.map(function (s) {
        return "<label class=\\"sh\\"><input type=\\"checkbox\\" checked value=\\"" + s.id + "\\">" +
          "<span class=\\"code\\">" + s.code + "</span><span>" + s.name + "</span>" +
          "<span class=\\"mv\\">" + s.from + " &rarr; <b>" + s.to + "</b></span></label>";
      }).join("") +
      "</div><p class=\\"derived\\">Nothing has changed yet. Closing this leaves it where it is too.</p>";
    var go = document.getElementById("sh-go");
    go.textContent = n === 1 ? "Move the date and that row" : "Move the date and the " + n + " rows";
    ov.hidden = false;
    go.onclick = function () {
      var take = [].slice.call(ov.querySelectorAll("input[type=checkbox]"))
        .filter(function (c) { return c.checked; }).map(function (c) { return c.value; });
      ov.hidden = true;
      where = "asaid";
      post({ act: "movedate", activity: a, end: end, take: take });
    };
  }

  /* ══ removing a row (§15.6) ═════════════════════════════════════════ */
  /* THE REFUSAL IS THE SERVER'S WORDS AND IT IS ASKED BEFORE THE PRESS, so
     the dialog either confirms or explains — the same sentence either way,
     because both come from \`removeRefused\` (§53.5, §42). */
  function askRemove(r, bu) {
    if (!r) return;
    var ov = document.getElementById("ov-rm");
    if (!ov) return;
    where = "said";
    post({ act: "canremove", row: r.id, kind: r.kind }, function (j) {
      if (!j) return;
      document.getElementById("sh2").textContent = j.title || "Remove it";
      document.getElementById("rm-body").innerHTML = j.why
        ? "<p class=\\"refuse\\">" + j.why + "</p><p>" + (j.after || "") + "</p>"
        : "<p>" + (j.after || "") + "</p>";
      var go = document.getElementById("rm-go");
      go.hidden = !!j.why;
      ov.hidden = false;
      go.onclick = function () {
        ov.hidden = true;
        where = "said";
        post({ act: "remove", row: r.id, kind: r.kind });
      };
    });
  }

  /* ══ a double-click renames a row that has no panel (§356.11) ════════ */
  /* A PHASE AND A WORK PACKAGE HAVE NO PANEL, so the add row would be the only
     place either name is ever set — and a name that can be set once and never
     corrected is §61's trap. The idiom is the Internal Tracker's, which Islam
     chose there for a row of exactly this kind; it costs no new control and no
     new class. Enter or leaving it renames, Escape puts it back. */
  body.addEventListener("dblclick", function (e) {
    var t = e.target.closest ? e.target.closest(".r.lvl0 .nm .t, .r.lvl1 .nm .t") : null;
    if (!t || t.tagName === "A") return;
    var r = rowOf(t);
    if (!r) return;
    var was = t.textContent;
    var box = document.createElement("input");
    box.className = "fld"; box.value = was; box.setAttribute("aria-label", "Name");
    box.setAttribute("style", "font:inherit;padding:1px 6px");
    t.replaceWith(box);
    box.focus(); box.select();
    var gone = false;
    function done(save) {
      if (gone) return;
      gone = true;
      if (!save || box.value.trim() === was.trim()) {
        var back = document.createElement("span");
        back.className = "t"; back.textContent = was;
        box.replaceWith(back);
        return;
      }
      where = "said";
      post({ act: "field", row: r.id, kind: r.kind, field: "name", value: box.value });
    }
    box.addEventListener("keydown", function (ev) {
      if (ev.key === "Enter") { ev.preventDefault(); done(true); }
      if (ev.key === "Escape") { ev.preventDefault(); done(false); }
    });
    box.addEventListener("blur", function () { done(true); });
  });

  /* Either dialog closes on its own quiet button, on Escape, and on the
     ground behind it — the page's own three ways out (§100.4). */
  [].slice.call(document.querySelectorAll(".dlg")).forEach(function (ov) {
    ov.addEventListener("click", function (e) {
      if (e.target === ov || (e.target.closest && e.target.closest("[data-shut]"))) ov.hidden = true;
    });
  });
  document.addEventListener("keydown", function (e) {
    if (e.key !== "Escape") return;
    [].slice.call(document.querySelectorAll(".dlg")).forEach(function (ov) { ov.hidden = true; });
  });
}());
`;
