/* ── INSIGHTS: PUBLISHING FROM THE CLIENT'S OWN PAGE (§647) ───────────────
   Islam: *"this needs to be doable from the module inside the client like
   the meeting notes as the insights are client relevant"*, then of the
   mockup (design-mockups/insights/2026-10-26_publish-from-the-module.html):
   *"it can be a pop up modal and the same for the published report"*, and
   *"yes build it"*. The console's publishing room is no longer the way in.

   Served at /<client>/insights/app.js, and ONLY to somebody who may publish
   (the page draws no script tag for anybody else). Nothing inline: the shell
   policy is `script-src 'self'`.

   EVERY WRITE IS THE CONSOLE'S OWN ACTION, sent to /api/platform with this
   client's key: librarySave, libraryState, librarySeen, the upload's begin,
   pieces and finish, libraryDelete. The rules — who may publish (the
   platform's admin or this client's Super user), an archived client is read
   only, a published report cannot be deleted, no publishing without a file —
   are the server's, asked again on every press (§42), so this page cannot be
   wrong about what happens, only about what it offers.

   THE LIST IS THE SERVER'S. The pop-up holds the one report being worked on;
   when it closes after anything was written, the page is read again, so the
   rows are never drawn by a second renderer (§53.5). No backticks in here:
   this file is a template literal. */
export const APP_JS = `(function () {
  "use strict";
  var B = document.body;
  /* what the pop-up works from, asked of the module's own /data once, as the
     page loads; a press before it lands waits for it */
  var KEY = "", CLIENT = "", KIND = "insights", CATS = [], PLACES = [], ITEMS = {};
  var HERE = location.pathname.replace(/[/]+$/, "");
  var READY = fetch(HERE + "/data", { credentials: "same-origin", cache: "no-store" })
    .then(function (r) { return r.json(); })
    .then(function (d) {
      if (!d || !d.ok) throw new Error((d && d.error) || "The library could not be read just now.");
      KEY = d.key; CLIENT = d.client; CATS = d.categories || []; PLACES = d.places || []; ITEMS = d.items || {};
    });

  function el(tag, cls, text) {
    var e = document.createElement(tag);
    if (cls) e.className = cls;
    if (text != null) e.textContent = text;
    return e;
  }
  function btn(cls, text) { var b = el("button", cls, text); b.type = "button"; return b; }
  function post(body) {
    body.key = KEY; body.kind = KIND;
    return fetch("/api/platform", { method: "POST", credentials: "same-origin", cache: "no-store",
      headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) })
      .then(function (r) { return r.json().catch(function () { return { ok: false }; }); });
  }

  var M = null;   /* the open pop-up: { it, dirty, written, busy, node, ... } */

  function close(force) {
    if (!M) return;
    if (!force && M.busy) return;
    if (!force && M.dirty()) { M.ask(); return; }
    var wrote = M.written, back = M.back;
    M.node.remove(); M = null;
    document.removeEventListener("keydown", onKey, true);
    document.documentElement.classList.remove("held");
    if (wrote) { location.reload(); return; }
    if (back && back.focus) back.focus();
  }
  function onKey(e) {
    if (e.key === "Escape") { e.preventDefault(); close(false); return; }
    if (e.key !== "Tab" || !M) return;
    /* the keyboard stays inside the pop-up while it is open */
    var f = M.box.querySelectorAll("button:not([disabled]),input,textarea,select,[tabindex]");
    if (!f.length) return;
    var first = f[0], last = f[f.length - 1];
    if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
    else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
  }

  function placeName(at) {
    for (var i = 0; i < PLACES.length; i++) if (PLACES[i].at === at) return PLACES[i].label;
    return at;
  }

  function open(id, back) {
    if (M) return;
    var it = id ? ITEMS[id] : null;
    if (id && !it) return;
    it = it ? JSON.parse(JSON.stringify(it)) : { title: "", summary: "", categories: [], reportDate: "", state: "draft", version: 1, hasFile: false, seen: null };
    var isNew = !it.id;

    var scrim = el("div", "mscrim");
    var box = el("section", "modal");
    box.setAttribute("role", "dialog"); box.setAttribute("aria-modal", "true"); box.setAttribute("aria-labelledby", "m-h");
    scrim.appendChild(box);

    /* the head: the title as it stands, Draft or the version, and the way out */
    var head = el("div", "chd");
    var ic = el("span", "cic"); ic.setAttribute("aria-hidden", "true");
    ic.innerHTML = '<svg viewBox="0 0 24 24"><path d="M9 18h6M10 21h4"/><path d="M12 3a6 6 0 0 0-3.5 10.9c.6.5 1 1.2 1 2V16h5v-.1c0-.8.4-1.5 1-2A6 6 0 0 0 12 3z"/></svg>';
    head.appendChild(ic);
    var h = el("h2", null, it.title || "A new report"); h.id = "m-h"; head.appendChild(h);
    var tag = el("span", it.state === "published" ? "ccnt" : "draft", it.state === "published" ? "v" + (it.version || 1) : "Draft");
    head.appendChild(tag);
    head.appendChild(el("span", "sp"));
    var x = btn("x", "\\u00d7"); x.setAttribute("aria-label", "Close"); x.addEventListener("click", function () { close(false); });
    head.appendChild(x);
    box.appendChild(head);

    var said = el("p", "msaid"); said.setAttribute("role", "alert"); said.hidden = true;
    function say(t) { said.textContent = t || ""; said.hidden = !t; }

    var form = el("div", "mform");
    function field(lab, node, idFor) {
      var w = el("div");
      var l = el("label", "mlab", lab); if (idFor) l.htmlFor = idFor; w.appendChild(l);
      w.appendChild(node); return w;
    }
    var title = el("input", "fld"); title.id = "m-title"; title.maxLength = 200; title.value = it.title || "";
    title.placeholder = "What the report is called";
    form.appendChild(field("Title", title, "m-title"));
    var sum = el("textarea", "fld"); sum.id = "m-sum"; sum.rows = 2; sum.value = it.summary || "";
    sum.placeholder = "One or two lines on what it found";
    form.appendChild(field("Summary", sum, "m-sum"));

    /* the categories are the server's one list, so chips rather than a box */
    var picked = (it.categories || []).slice();
    var chips = el("div", "chips"); chips.setAttribute("role", "group"); chips.setAttribute("aria-label", "Categories");
    CATS.forEach(function (c) {
      var b = btn("chip", c);
      b.setAttribute("aria-pressed", picked.indexOf(c) >= 0 ? "true" : "false");
      b.addEventListener("click", function () {
        var at = picked.indexOf(c);
        if (at >= 0) picked.splice(at, 1); else picked.push(c);
        b.setAttribute("aria-pressed", at >= 0 ? "false" : "true");
      });
      chips.appendChild(b);
    });
    var cw = el("div"); cw.appendChild(el("span", "mlab", "Categories")); cw.appendChild(chips); form.appendChild(cw);

    var two = el("div", "two");
    var date = el("input", "fld"); date.id = "m-date"; date.type = "date"; date.value = it.reportDate || "";
    two.appendChild(field("Report date", date, "m-date"));
    var fw = el("div"); fw.appendChild(el("span", "mlab", "The file"));
    var strip = el("div", "file" + (it.hasFile ? " has" : ""));
    var fname = el("span", "fname", it.hasFile ? it.fileName + (it.sizeLabel ? " \\u00b7 " + it.sizeLabel : "") : "No file yet");
    strip.appendChild(fname); strip.appendChild(el("span", "sp"));
    var pick = el("input"); pick.type = "file"; pick.accept = "application/pdf,.pdf"; pick.hidden = true;
    var fbtn = btn("btn", it.hasFile ? "Replace" : "Add the file");
    fbtn.addEventListener("click", function () { pick.click(); });
    pick.addEventListener("change", function () { if (pick.files && pick.files[0]) sendFile(pick.files[0]); pick.value = ""; });
    strip.appendChild(fbtn); strip.appendChild(pick); fw.appendChild(strip);
    if (it.hasFile) fw.appendChild(el("p", "mnote", "Replacing keeps the same link and the same download count, and moves it to the next version."));
    two.appendChild(fw);
    form.appendChild(two);

    /* WHO CAN SEE IT: null is everyone, [] is nobody, a list is those places.
       Saved on its own, on Done, and only if something moved. */
    var seen = it.seen === null || it.seen === undefined ? null : it.seen.slice();
    var ww = el("div"); ww.appendChild(el("span", "mlab", "Who can see it"));
    var who = el("div", "who"); var whoText = el("span", "wt"); who.appendChild(whoText); who.appendChild(el("span", "sp"));
    var wbtn = btn("btn", ""); who.appendChild(wbtn); ww.appendChild(who);
    var panel = null, wasSeen = JSON.stringify(seen);
    function drawWho() {
      whoText.textContent = seen === null ? "Everyone at " + CLIENT : !seen.length ? "Nobody can open this report" : seen.map(placeName).join(" \\u00b7 ");
      wbtn.textContent = panel ? "Done" : seen === null ? "Narrow it\\u2026" : "Change";
      wbtn.disabled = !it.id;
    }
    var whyFirst = el("p", "mnote", "Save it first, then choose who can see it. New reports start open to everyone.");
    whyFirst.hidden = !!it.id; ww.appendChild(whyFirst);
    wbtn.addEventListener("click", function () {
      if (panel) {
        panel.remove(); panel = null; drawWho();
        if (JSON.stringify(seen) === wasSeen || !it.id) return;
        M.busy = true;
        post({ action: "librarySeen", id: it.id, seen: seen }).then(function (j) {
          M.busy = false;
          if (!j || !j.ok) { say((j && j.error) || "Who can see it was not saved."); return; }
          wasSeen = JSON.stringify(seen); it = j.item; M.written = true; say("");
        }).catch(function () { M.busy = false; say("Could not reach the server. Who can see it was not saved."); });
        return;
      }
      panel = el("div", "tick");
      var top = el("div", "tickhead");
      var find = el("input", "fld"); find.type = "search"; find.placeholder = "Search departments\\u2026"; find.setAttribute("aria-label", "Search departments");
      var all = btn("lnk", "All"), none = btn("lnk", "None");
      top.appendChild(find); top.appendChild(all); top.appendChild(none); panel.appendChild(top);
      var list = el("div", "ticklist"); panel.appendChild(list);
      panel.appendChild(el("p", "mnote", "All hands it back to everyone, including a department added later."));
      function rows() {
        list.textContent = "";
        [["unit", "Business units"], ["fn", "Supporting functions"]].forEach(function (k) {
          var mine = PLACES.filter(function (p) { return p.kind === k[0]; });
          if (!mine.length) return;
          list.appendChild(el("div", "gp", k[1]));
          mine.forEach(function (p) {
            var on = seen !== null && seen.indexOf(p.at) >= 0;
            var b = btn("trow", p.label); b.setAttribute("aria-pressed", on ? "true" : "false");
            b.addEventListener("click", function () {
              if (seen === null) seen = [];
              var at = seen.indexOf(p.at);
              if (at >= 0) seen.splice(at, 1); else seen.push(p.at);
              b.setAttribute("aria-pressed", at >= 0 ? "false" : "true"); drawWho();
            });
            list.appendChild(b);
          });
        });
        if (!PLACES.length) list.appendChild(el("p", "mnote", "This client has no departments yet, so a report is open to everyone."));
      }
      all.addEventListener("click", function () { seen = null; rows(); drawWho(); });
      none.addEventListener("click", function () { seen = []; rows(); drawWho(); });
      find.addEventListener("input", function () {
        var q = find.value.trim().toLowerCase();
        Array.prototype.forEach.call(list.querySelectorAll(".trow"), function (b) { b.hidden = !!q && b.textContent.toLowerCase().indexOf(q) < 0; });
      });
      rows(); ww.appendChild(panel); drawWho(); find.focus();
    });
    drawWho();
    form.appendChild(ww);
    box.appendChild(form);
    box.appendChild(said);

    /* the foot: what is true, then what you may do */
    var foot = el("div", "mfoot");
    var state = el("span", "mstate" + (it.state === "published" ? " pub" : ""));
    foot.appendChild(state); foot.appendChild(el("span", "sp"));
    var save = btn("btn", ""); foot.appendChild(save);
    var pub = btn("btn amber", "Publish to " + CLIENT); foot.appendChild(pub);
    box.appendChild(foot);
    var ask = el("div", "mask"); ask.hidden = true;
    ask.appendChild(el("span", null, "Close without saving what you typed?"));
    ask.appendChild(el("span", "sp"));
    var keep = btn("btn", "Keep editing"), drop = btn("btn", "Close");
    keep.addEventListener("click", function () { ask.hidden = true; title.focus(); });
    drop.addEventListener("click", function () { close(true); });
    ask.appendChild(keep); ask.appendChild(drop); box.appendChild(ask);

    var apart = el("div", "apart"); box.appendChild(apart);

    function drawFoot() {
      var p = it.state === "published";
      state.className = "mstate" + (p ? " pub" : "");
      state.textContent = p ? "Published to " + CLIENT : it.id ? "Draft \\u00b7 only Forefront sees it" : "Not saved yet";
      save.textContent = !it.id ? "Save the draft" : "Save";
      pub.hidden = p;
      /* PUBLISH WAITS FOR THE FILE, held rather than absent so the reason can
         be reached: a report with nothing to open is not a report. */
      if (!it.hasFile) { pub.setAttribute("aria-disabled", "true"); pub.title = "Add the file first \\u2014 a report with nothing to open is not a report."; }
      else { pub.removeAttribute("aria-disabled"); pub.title = ""; }
      tag.className = p ? "ccnt" : "draft"; tag.textContent = p ? "v" + (it.version || 1) : "Draft";
      h.textContent = it.title || "A new report";
      whyFirst.hidden = !!it.id; drawWho();
      drawApart();
    }

    /* TAKING IT BACK: Withdraw, and Delete only once it is withdrawn */
    function drawApart() {
      apart.textContent = "";
      if (!it.id) { apart.hidden = true; return; }
      apart.hidden = false;
      var p = it.state === "published";
      apart.appendChild(el("span", "mlab", "Taking it back"));
      var w = el("div", "arow"), wt = el("div", "w");
      wt.appendChild(el("b", null, "Withdraw"));
      wt.appendChild(el("span", null, p ? "Leaves " + CLIENT + "\\u2019s Insights. Nothing is lost and it can go back out." : "Nothing to withdraw \\u2014 it is a draft, so " + CLIENT + " cannot see it."));
      w.appendChild(wt);
      var wb = btn("btn", "Withdraw"); wb.disabled = !p; w.appendChild(wb); apart.appendChild(w);
      wb.addEventListener("click", function () {
        if (M.busy) return; M.busy = true; wb.disabled = true; wb.textContent = "Withdrawing\\u2026";
        post({ action: "libraryState", id: it.id, state: "draft" }).then(function (j) {
          M.busy = false;
          if (!j || !j.ok) { wb.disabled = false; wb.textContent = "Withdraw"; say((j && j.error) || "It was not withdrawn."); return; }
          it = j.item; M.written = true; say(""); drawFoot();
        }).catch(function () { M.busy = false; wb.disabled = false; wb.textContent = "Withdraw"; say("Could not reach the server."); });
      });
      var d = el("div", "arow"), dt = el("div", "w");
      dt.appendChild(el("b", null, "Delete"));
      dt.appendChild(el("span", null, p ? "Withdraw first \\u2014 nobody may delete a report the client is still reading." : "Ends it. The file goes with it, and there is nothing to restore from."));
      d.appendChild(dt);
      var db = btn("btn risk", "Delete\\u2026"); db.disabled = p; d.appendChild(db); apart.appendChild(d);
      db.addEventListener("click", function () {
        d.textContent = "";
        var q = el("div", "w");
        q.appendChild(el("b", null, "Delete \\u201c" + it.title + "\\u201d?"));
        q.appendChild(el("span", null, (it.hasFile ? "The file goes with it. " : "") + "There is nothing to restore from."));
        d.appendChild(q);
        var yes = btn("btn risksolid", "Delete it"), no = btn("btn", "Cancel");
        no.addEventListener("click", drawApart);
        yes.addEventListener("click", function () {
          if (M.busy) return; M.busy = true; yes.disabled = true; no.disabled = true; yes.textContent = "Deleting\\u2026";
          post({ action: "libraryDelete", id: it.id }).then(function (j) {
            M.busy = false;
            if (!j || !j.ok) { yes.disabled = false; no.disabled = false; yes.textContent = "Delete it"; say((j && j.error) || "It was not deleted."); return; }
            M.written = true; close(true);
          }).catch(function () { M.busy = false; yes.disabled = false; no.disabled = false; yes.textContent = "Delete it"; say("Could not reach the server."); });
        });
        d.appendChild(yes); d.appendChild(no); no.focus();
      });
    }

    function draft() { return { title: title.value, summary: sum.value, categories: picked.slice(), reportDate: date.value }; }
    var base = JSON.stringify(draft());
    function dirty() { return JSON.stringify(draft()) !== base; }

    function saveReport(thenPublish) {
      var d = draft();
      if (!d.title.trim()) { say("A report needs a title."); title.focus(); return Promise.resolve(false); }
      if (M.busy) return Promise.resolve(false);
      M.busy = true; save.disabled = true; pub.disabled = true;
      var body = { action: "librarySave", title: d.title, summary: d.summary, categories: d.categories, reportDate: d.reportDate };
      if (it.id) body.id = it.id;
      return post(body).then(function (j) {
        if (!j || !j.ok) { say((j && j.error) || "It could not be saved."); return false; }
        it = j.item; M.written = true; base = JSON.stringify(draft()); say("");
        if (!thenPublish) return true;
        return post({ action: "libraryState", id: it.id, state: "published" }).then(function (p) {
          if (!p || !p.ok) { say((p && p.error) || "It was saved and not published."); return false; }
          it = p.item; return "published";
        });
      }).catch(function () { say("Could not reach the server. Nothing was saved."); return false; })
        .then(function (r) { M.busy = false; save.disabled = false; pub.disabled = false; drawFoot(); if (r === "published") close(true); return r; });
    }
    save.addEventListener("click", function () { saveReport(false); });
    pub.addEventListener("click", function () {
      if (pub.getAttribute("aria-disabled") === "true") { say(pub.title); return; }
      saveReport(true);
    });

    /* THE FILE, IN PIECES: the row first where there is none, then begin,
       one request per piece, finish — every one authorised on the server.
       The button's word is the progress. */
    function sendFile(f) {
      if (M.busy) return;
      if (!it.id && !title.value.trim()) { say("A report needs a title before its file."); title.focus(); return; }
      var was = fbtn.textContent;
      function fail(msg) { M.busy = false; fbtn.disabled = false; fbtn.textContent = was; say(msg); drawFoot(); }
      var row = it.id ? Promise.resolve(true) : saveReport(false);
      row.then(function (okRow) {
        if (!okRow) return;
        M.busy = true; fbtn.disabled = true; fbtn.textContent = "Reading\\u2026";
        return post({ action: "libraryUploadBegin", id: it.id, name: f.name, bytes: f.size }).then(function (b) {
          if (!b || !b.ok) { fail((b && b.error) || "The upload could not be started."); return; }
          var piece = b.piece || (3 * 1024 * 1024), total = Math.max(1, Math.ceil(f.size / piece)), parts = [];
          var q = "/api/platform/file?client=" + encodeURIComponent(KEY) + "&kind=" + KIND + "&id=" + encodeURIComponent(it.id) +
            "&name=" + encodeURIComponent(f.name) + "&path=" + encodeURIComponent(b.path) +
            "&storeKey=" + encodeURIComponent(b.storeKey) + "&uploadId=" + encodeURIComponent(b.uploadId);
          function step(n) {
            if (n > total) {
              fbtn.textContent = "Finishing\\u2026";
              return post({ action: "libraryUploadFinish", id: it.id, name: f.name, bytes: f.size, path: b.path, parts: parts,
                            uploadId: b.uploadId, storeKey: b.storeKey }).then(function (d) {
                if (!d || !d.ok) { fail((d && d.error) || "The file could not be finished."); return; }
                it = d.item; M.written = true; M.busy = false; fbtn.disabled = false; fbtn.textContent = "Replace";
                strip.className = "file has"; fname.textContent = it.fileName + (it.sizeLabel ? " \\u00b7 " + it.sizeLabel : "");
                say(""); drawFoot();
              });
            }
            fbtn.textContent = total > 1 ? "Sending " + n + " of " + total + "\\u2026" : "Sending\\u2026";
            return fetch(q + "&n=" + n, { method: "POST", cache: "no-store", credentials: "same-origin",
              headers: { "Content-Type": "application/octet-stream" }, body: f.slice((n - 1) * piece, Math.min(f.size, n * piece)) })
              .then(function (r) { return r.json(); })
              .then(function (r) {
                if (!r || !r.ok) { fail((r && r.error) || "That piece was refused."); return; }
                parts.push({ partNumber: r.partNumber, etag: r.etag });
                return step(n + 1);
              });
          }
          return step(1);
        });
      }).catch(function () { fail("Could not reach the server. The file was not uploaded."); });
    }

    M = { it: it, node: scrim, box: box, busy: false, written: false, back: back, dirty: dirty,
          ask: function () { ask.hidden = false; keep.focus(); } };
    drawFoot();
    document.body.appendChild(scrim);
    document.documentElement.classList.add("held");
    document.addEventListener("keydown", onKey, true);
    title.focus();
  }

  document.addEventListener("click", function (e) {
    var b = e.target.closest && e.target.closest("[data-act=new-report],[data-act=open-report]");
    if (!b) return;
    e.preventDefault();
    READY.then(function () { open(b.getAttribute("data-act") === "open-report" ? b.getAttribute("data-id") : null, b); },
      function (err) { var s = document.createElement("p"); s.className = "msaid"; s.setAttribute("role", "alert");
        s.textContent = (err && err.message) || "The library could not be read just now."; b.parentNode.insertBefore(s, b.nextSibling); });
  });
})();
`;
