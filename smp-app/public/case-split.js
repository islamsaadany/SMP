/* COPIED by scripts/build-shell.mjs from lib/case-split.cjs. Do not edit. */
/* THE INTERVIEW'S SPLITTER (spec 067 §6) — a write-up pasted back in one box,
 * read into the eight sections and the insights it drew out. Its own module
 * for the memory splitter's reason (lib/memory-split.cjs): node requires it
 * with no browser, and the page loads the same bytes with a script tag.
 *
 * The prompt asks for each section under a `=== NAME` line, and then each
 * insight in the memory's own block between bare `===` rules — so the
 * insights are handed to MemorySplit, never read a second way (§53.5).
 *
 * WHAT IT MAY NEVER DO IS LOSE WHAT SOMEBODY DICTATED (§184). A paste with no
 * section lines at all lands whole in In short; a section it cannot place is
 * kept with the one before it; an insight block it cannot read comes back in
 * `unread`. The writer reads every section before anything is saved.
 */
(function (root, factory) {
  if (typeof module !== "undefined" && module.exports) module.exports = factory(require("./memory-split.cjs"));
  else root.CaseSplit = factory(root.MemorySplit);
})(typeof self !== "undefined" ? self : this, function (MemorySplit) {
  "use strict";

  /* The eight, in reading order, and the field each lands in. Matched on
     letters alone and on how a heading STARTS, so "THEIR TEAM (one line
     each: name · role)" and "Their team:" are one heading. */
  var SECTIONS = [
    ["inshort", "in_short", "In short"],
    ["theclientandwhytheycametous", "client_why", "The client and why they came to us"],
    ["theclient", "client_why", "The client and why they came to us"],
    ["whatwewereaskedtodo", "asked_to_do", "What we were asked to do"],
    ["theirteam", "their_team", "Their team"],
    ["timeline", "stages", "Timeline"],
    ["deliverables", "deliverables", "Deliverables"],
    ["whatcameofit", "came_of_it", "What came of it"],
    ["whotoask", "who_to_ask", "Who to ask"]
  ];
  var LISTS = { their_team: ["name", "role"], stages: ["when", "what"],
                deliverables: ["name", "what", "month"], who_to_ask: ["name", "about"] };
  var flat = function (s) { return String(s || "").toLowerCase().replace(/[^a-z]/g, ""); };
  var RULE = /^[ \t]*={3,}[ \t]*(.*)$/;

  function sectionFor(rest) {
    var f = flat(String(rest).replace(/\(.*$/, ""));
    if (!f) return null;
    for (var i = 0; i < SECTIONS.length; i++) if (f.indexOf(SECTIONS[i][0]) === 0) return SECTIONS[i][1];
    return null;
  }

  /* One line of a list: "name · role", also with " - ", " | " or " — "
     between, and with any bullet or number in front taken off. A line with
     no separator is all first field, never dropped. */
  function lineOf(line, fields) {
    var t = String(line).replace(/^\s*(?:[-*•·]|\d+[.)])\s+/, "").trim();
    if (!t) return null;
    /* THE DOT FIRST, because the prompt asks for it and because a dash is
       also how a range is written ("Apr – Jun"): only a line with no dot and
       no bar is split on a dash, and never on the en dash a range uses. */
    var sep = /·/.test(t) ? /\s*·\s*/ : /\|/.test(t) ? /\s*\|\s*/ : /\s+[—-]\s+/;
    var parts = t.split(sep).map(function (p) { return p.trim(); });
    if (parts.length > fields.length) parts = parts.slice(0, fields.length - 1).concat([parts.slice(fields.length - 1).join(" · ")]);
    var o = {};
    for (var i = 0; i < fields.length; i++) o[fields[i]] = parts[i] || "";
    return o;
  }

  function split(text) {
    var raw = String(text == null ? "" : text).replace(/\r\n?/g, "\n");
    var out = { in_short: "", client_why: "", asked_to_do: "", came_of_it: "",
                their_team: [], stages: [], deliverables: [], who_to_ask: [],
                insights: [], unread: [], read: [], missing: [] };
    if (!raw.trim()) { out.missing = SECTIONS.filter(uniq).map(function (s) { return s[2]; }); return out; }
    var lines = raw.split("\n");
    var got = {}, field = null, rest = [], i;
    for (i = 0; i < lines.length; i++) {
      var m = lines[i].match(RULE);
      if (m) {
        var f = sectionFor(m[1]);
        if (f) { field = f; got[f] = got[f] || []; continue; }
        /* A BARE RULE ENDS THE SECTIONS: what follows is the insights, in the
           memory's own blocks. A rule naming something unknown does the same,
           and the reader of the insights keeps whatever it cannot read. */
        rest = lines.slice(i);
        break;
      }
      if (field) got[field].push(lines[i]);
      else if (lines[i].trim()) (got._before = got._before || []).push(lines[i]);
    }
    var named = Object.keys(got).filter(function (k) { return k !== "_before"; });
    if (!named.length && !rest.length) {
      /* NO SECTION LINES AT ALL: the whole of it is In short, so nothing said
         is lost and the writer moves it where it belongs. */
      out.in_short = raw.trim();
      out.read = ["In short"];
    } else {
      for (var s = 0; s < SECTIONS.length; s++) {
        var key = SECTIONS[s][1];
        if (!got[key]) continue;
        var body = got[key];
        if (LISTS[key]) {
          var rows = [];
          for (var j = 0; j < body.length; j++) { var o = lineOf(body[j], LISTS[key]); if (o) rows.push(o); }
          out[key] = rows;
        } else out[key] = body.join("\n").trim();
      }
      /* Words before the first section are kept, in front of In short. */
      if (got._before) out.in_short = (got._before.join("\n").trim() + (out.in_short ? "\n\n" + out.in_short : "")).trim();
    }
    var seen = {};
    for (s = 0; s < SECTIONS.length; s++) {
      var k2 = SECTIONS[s][1], label = SECTIONS[s][2];
      if (seen[k2]) continue; seen[k2] = true;
      var v = out[k2];
      if ((Array.isArray(v) && v.length) || (!Array.isArray(v) && String(v).trim())) out.read.indexOf(label) < 0 && out.read.push(label);
      else out.missing.push(label);
    }
    if (rest.length) {
      var ins = MemorySplit.split(rest.join("\n"));
      out.insights = ins.entries;
      out.unread = ins.unread;
    }
    return out;
  }
  function uniq(s, i, a) { for (var j = 0; j < i; j++) if (a[j][1] === s[1]) return false; return true; }

  return { split: split, SECTIONS: SECTIONS.filter(uniq).map(function (s) { return { field: s[1], label: s[2] }; }) };
});
