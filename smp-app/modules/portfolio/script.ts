/* ── PORTFOLIO: THE ONE SCRIPT (spec 060, built 2026-09-30) ───────────────
   The shell's policy admits `script-src 'self'` and nothing inline
   (lib/shell.ts), so this is served at the module's own address and every
   handler is bound here.

   IT RENDERS NOTHING OF ITS OWN. A charter field is typed into a real box,
   posted, and the SERVER's answer is what goes back on the page — so the
   browser cannot disagree with the server about a stored value (§53.5,
   §356.12's rule one module over). Starting a project navigates, because
   the project's own page is where the next thing to do is.

   NOTHING IS SAVED BY A BUTTON. A field commits when the cursor leaves it,
   which is how every box in this platform has behaved since §35 — and
   Escape puts the stored value back rather than committing a half-typed
   one. */
export const APP_JS = `(function () {
  "use strict";
  var API = document.body.getAttribute("data-api") || "";
  function post(body, then) {
    fetch(API, { method: "POST", headers: { "Content-Type": "application/json" },
                 body: JSON.stringify(body) })
      .then(function (r) { return r.json().catch(function () { return { ok: false, why: "The server did not answer." }; }); })
      .then(then)
      .catch(function () { then({ ok: false, why: "The server could not be reached." }); });
  }

  /* ── starting a project ── */
  var dlg = document.getElementById("startdlg");
  var open = document.getElementById("start");
  if (open && dlg) {
    var name = document.getElementById("pname");
    var make = document.getElementById("make");
    function shut() { dlg.hidden = true; }
    open.addEventListener("click", function () {
      dlg.hidden = false;
      name.value = "";
      name.focus();
    });
    dlg.addEventListener("click", function (e) {
      if (e.target === dlg || e.target.hasAttribute("data-close")) shut();
    });
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape" && !dlg.hidden) shut();
    });
    function go() {
      var v = (name.value || "").trim();
      if (!v) { name.focus(); return; }
      make.disabled = true;
      post({ act: "start", name: v }, function (j) {
        make.disabled = false;
        if (j && j.ok && j.href) { location.href = j.href; return; }
        say(j && j.why ? j.why : "That could not be done.");
      });
    }
    make.addEventListener("click", go);
    name.addEventListener("keydown", function (e) { if (e.key === "Enter") go(); });
  }

  function say(why) {
    var n = document.getElementById("saywhy");
    if (!n) {
      n = document.createElement("p");
      n.id = "saywhy";
      n.className = "empty";
      n.style.color = "var(--bad-tx)";
      document.querySelector("main").prepend(n);
    }
    n.textContent = why;
  }

  /* ── the charter's fields ── */
  var id = (location.pathname.split("/").filter(Boolean).pop() || "");
  document.addEventListener("click", function (e) {
    var b = e.target.closest ? e.target.closest("[data-edit]") : null;
    if (!b) return;
    var row = b.closest("[data-row]");
    if (!row || row.querySelector(".fld")) return;
    var val = row.querySelector("[data-v]");
    var was = val.classList.contains("none") ? "" : val.textContent;
    var area = row.hasAttribute("data-area");
    var f = document.createElement(area ? "textarea" : "input");
    f.className = "fld";
    f.value = was;
    if (!area && /^agreed/.test(row.getAttribute("data-row"))) f.type = "date";
    val.replaceWith(f);
    b.hidden = true;
    f.focus();
    var done = false;
    function back(text) {
      if (done) return;
      done = true;
      var d = document.createElement("div");
      d.className = "val" + (text ? "" : " none");
      d.setAttribute("data-v", "");
      d.textContent = text || "Not set";
      f.replaceWith(d);
      b.hidden = false;
    }
    f.addEventListener("keydown", function (ev) {
      if (ev.key === "Escape") { back(was); }
      else if (ev.key === "Enter" && !area) { f.blur(); }
    });
    f.addEventListener("blur", function () {
      if (done) return;
      var v = f.value;
      if (v === was) { back(was); return; }
      post({ act: "charter", id: id, field: row.getAttribute("data-row"), value: v }, function (j) {
        if (j && j.ok) {
          back(String(j.value == null ? "" : j.value));
          if (row.getAttribute("data-row") === "name") {
            var h = document.querySelector(".phead h1");
            if (h) h.textContent = String(j.value || "");
          }
          return;
        }
        back(was);
        say(j && j.why ? j.why : "That could not be saved.");
      });
    });
  });
})();
`;
