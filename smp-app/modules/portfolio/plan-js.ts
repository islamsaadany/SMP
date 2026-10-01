/* ── THE ONE THING THE TIMELINE NEEDS A BROWSER FOR (spec 060 §9.9) ───────
   A dependency's elbow drops from one row to another, and how far that is
   cannot be known on the server: a row is 28px plus its own border today,
   and a constant written against that goes stale in silence the moment
   either number moves (§122.5 — the drawing's own typed pitch was already
   one pixel wrong on the build it was written for). So the two rows are
   MEASURED and the elbow drawn between them.

   THE CHART IS COMPLETE WITHOUT THIS FILE. Every bar, diamond, overrun and
   today line is in the document the server sent; this adds the connectors
   and nothing else — which is why the check serves the page without it and
   asserts the chart is still whole (§61's shape: a page that needs its
   script to be correct is a page that is wrong without one).

   ONE DEPENDENCY PER ACTIVITY (§5), so this is a walk and never a graph
   layout: each row names at most one row above or below it, and the ends
   come off `data-end` and `data-at`, which are the same percentages the
   bars were placed with — read back rather than worked out again, or the
   elbow and the bar would be two answers to where a date sits (§5.2). */
export const PLAN_JS = `(function () {
  "use strict";
  var rows = [].slice.call(document.querySelectorAll("#time .gr"));
  if (!rows.length) return;
  var by = {};
  rows.forEach(function (r) { by[r.getAttribute("data-row")] = r; });

  function draw() {
    /* Drawn again from scratch on a resize: the drop is a measurement, so a
       narrower window with a wrapped row makes every earlier one wrong
       (§267.2's own lesson — a box sized at paint time clips on a resize). */
    [].slice.call(document.querySelectorAll("#time .dep, #time .depv, #time .deph"))
      .forEach(function (n) { n.remove(); });

    rows.forEach(function (r) {
      var depId = r.getAttribute("data-dep");
      if (!depId) return;
      var from = by[depId];
      if (!from) return;
      var pe = from.getAttribute("data-end"), ps = r.getAttribute("data-at");
      if (!pe || !ps) return;
      var tr = r.querySelector(".track"), ft = from.querySelector(".track");
      if (!tr || !ft) return;
      var drop = tr.getBoundingClientRect().top - ft.getBoundingClientRect().top;
      if (!drop) return;
      var mid = tr.clientHeight / 2;
      var add = function (cls, css) {
        var el = document.createElement("span");
        el.className = cls; el.setAttribute("style", css); tr.appendChild(el);
      };
      add("depv", "left:calc(" + pe + " + 6px);top:" + (mid - drop) + "px;height:" + drop + "px");
      add("dep", "left:calc(" + pe + " + 6px);top:" + (mid - 1) + "px;width:calc(" + ps + " - " + pe + " - 12px)");
      add("deph", "left:calc(" + ps + " - 6px);top:" + (mid - 4) + "px");
    });
  }

  draw();
  /* Repaint only when the window has actually changed width — a dragged edge
     fires on every pixel, and this measures (§267). */
  var w = window.innerWidth, t = null;
  window.addEventListener("resize", function () {
    if (window.innerWidth === w) return;
    w = window.innerWidth;
    if (t) clearTimeout(t);
    t = setTimeout(draw, 80);
  });
}());
`;
