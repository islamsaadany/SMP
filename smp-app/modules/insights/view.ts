/* ── INSIGHTS: VIEW A REPORT (§651) ───────────────────────────────────────
   Islam: *"can we have a view button before the download where the user can
   have a quick view over the report?"*; drawn as screen 5 of
   design-mockups/insights/2026-10-26_publish-from-the-module.html and then
   *"yes build it"*.

   View is a real link to /<client>/insights/<id>/view, opening a new tab —
   which is what it does with no script, inside the platform's Insights tab,
   and on a phone, where most browsers cannot show a PDF inside a page. On a
   computer this script takes the press instead: it asks the same address for
   the report's short-lived file address (?as=json) and shows the PDF in a
   large pop-up over the list, the browser's own reader inside it, with
   Download in its corner (which counts, as a download always has) and a way
   to open it in a tab of its own if the reader cannot show it here. A view
   is not a download and is not counted (lib/library-file.ts).

   Served at /<client>/insights/view.js to everybody who can open the page;
   nothing inline (the shell's script-src 'self'). No backticks in here: this
   file is a template literal. */
export const VIEW_JS = `(function () {
  "use strict";
  var V = null;
  function el(tag, cls, text) { var e = document.createElement(tag); if (cls) e.className = cls; if (text != null) e.textContent = text; return e; }
  function shut() {
    if (!V) return;
    var back = V.back; V.node.remove(); V = null;
    document.removeEventListener("keydown", onKey, true);
    document.documentElement.classList.remove("held");
    if (back && back.focus) back.focus();
  }
  function onKey(e) { if (e.key === "Escape") { e.preventDefault(); shut(); } }
  function show(a) {
    var scrim = el("div", "vscrim");
    var box = el("section", "viewer"); box.setAttribute("role", "dialog"); box.setAttribute("aria-modal", "true"); box.setAttribute("aria-labelledby", "v-h");
    var head = el("div", "vh");
    var h = el("h2", null, a.getAttribute("data-title") || "Report"); h.id = "v-h"; head.appendChild(h);
    var meta = a.getAttribute("data-meta"); if (meta) head.appendChild(el("span", "vmeta", meta));
    var tab = el("a", "vtab", "Open in a new tab"); tab.href = a.href; tab.target = "_blank"; tab.rel = "noopener"; head.appendChild(tab);
    var dl = a.getAttribute("data-file");
    if (dl) { var d = el("a", "dl", "Download"); d.href = dl; head.appendChild(d); }
    var x = el("button", "x", "\\u00d7"); x.type = "button"; x.setAttribute("aria-label", "Close"); x.addEventListener("click", shut); head.appendChild(x);
    box.appendChild(head);
    var body = el("div", "vbody"); var wait = el("p", "vwait", "Opening the report\\u2026"); body.appendChild(wait); box.appendChild(body);
    scrim.appendChild(box);
    scrim.addEventListener("click", function (e) { if (e.target === scrim) shut(); });
    V = { node: scrim, back: a };
    document.body.appendChild(scrim);
    document.documentElement.classList.add("held");
    document.addEventListener("keydown", onKey, true);
    x.focus();
    fetch(a.href + "?as=json", { credentials: "same-origin", cache: "no-store" })
      .then(function (r) { return r.json(); })
      .then(function (j) {
        if (!V || V.node !== scrim) return;
        if (!j || !j.ok || !j.url) { wait.textContent = (j && j.error) || "This report cannot be shown just now. Nothing has been lost; try again in a few minutes."; return; }
        var f = document.createElement("iframe");
        f.className = "vframe"; f.title = a.getAttribute("data-title") || "Report"; f.src = j.url;
        body.textContent = ""; body.appendChild(f);
      })
      .catch(function () { if (V && V.node === scrim) wait.textContent = "Could not reach the server. Try again in a moment."; });
  }
  document.addEventListener("click", function (e) {
    var a = e.target.closest && e.target.closest("a[data-act=view-report]");
    if (!a || e.ctrlKey || e.metaKey || e.shiftKey || e.button) return;
    /* a phone, or a window as narrow as one, keeps the new tab */
    if (window.matchMedia && window.matchMedia("(max-width: 760px)").matches) return;
    e.preventDefault();
    if (!V) show(a);
  });
})();
`;
