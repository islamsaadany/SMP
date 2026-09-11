/* COPIED by scripts/build-shell.mjs from lib/memory-split.cjs. Do not edit. */
/* THE DEBRIEF SPLITTER (spec 045, phase B) — the one piece of this feature
 * with a wrong answer available to it, so it is its own module: node can
 * require it with no browser and no database, and the page loads the same
 * bytes with a script tag. UMD, like lib/platform-rules.cjs.
 *
 * One conversation, several insights. The prompt asks an assistant to write
 * every item back between `===` rules with named lines; this reads them back.
 *
 * WHAT IT MAY NEVER DO IS LOSE WHAT SOMEBODY DICTATED. Every tolerance below
 * points one way: a block it cannot parse comes back WHOLE in `unread`, an
 * unknown line is ignored rather than fatal, and a paste with no `===` at all
 * becomes ONE entry holding the lot — never nought (§184). The person reads
 * every draft before anything is saved, so a generous reader costs a moment
 * and a strict one costs the conversation.
 */
(function (root, factory) {
  if (typeof module !== "undefined" && module.exports) module.exports = factory();
  else root.MemorySplit = factory();
})(typeof self !== "undefined" ? self : this, function () {
  "use strict";

  var KINDS = ["practice", "hiccup", "lesson"];
  /* The keys the prompt asks for, and the field each one lands in. Matched on
     letters alone, so "WHAT CAME OF IT:", "What came of it -" and
     "what_came_of_it:" are one key — an assistant is asked for a shape, not
     held to a spelling. */
  var KEYS = [
    ["kind", "kind"],
    ["title", "title"],
    ["when", "occurred"],
    ["whathappened", "happened"],
    ["whatwedid", "did"],
    ["whatcameofit", "came_of_it"],
    ["whatthenextpersonshouldknow", "next_person"],
    ["nextperson", "next_person"]
  ];
  var flat = function (s) { return String(s || "").toLowerCase().replace(/[^a-z]/g, ""); };
  var oneLine = function (s) { return String(s || "").replace(/\s*\n\s*/g, " ").trim(); };

  function keyFor(line) {
    var at = line.indexOf(":");
    if (at < 0) return null;
    var head = flat(line.slice(0, at));
    if (!head || head.length > 40) return null;
    for (var i = 0; i < KEYS.length; i++) if (KEYS[i][0] === head) return { field: KEYS[i][1], rest: line.slice(at + 1).trim() };
    return null;
  }

  function kindOf(v) {
    var f = flat(v);
    for (var i = 0; i < KINDS.length; i++) if (f.indexOf(KINDS[i]) === 0) return KINDS[i];
    /* A kind it does not recognise falls back rather than refusing the block —
       the reader can see the picker and change it, and refusing would throw a
       whole write-up away over one word. */
    return null;
  }

  function readBlock(text) {
    var lines = String(text).split("\n");
    var got = {}, field = null, seen = 0;
    for (var i = 0; i < lines.length; i++) {
      var k = keyFor(lines[i]);
      if (k) { field = k.field; got[field] = k.rest; seen++; continue; }
      /* a line under a key belongs to it; a line under nothing is dropped only
         if nothing has been named yet, and even then the caller keeps the raw */
      if (field) got[field] = (got[field] ? got[field] + "\n" : "") + lines[i];
    }
    for (var f in got) if (Object.prototype.hasOwnProperty.call(got, f)) got[f] = String(got[f]).trim();
    if (!seen || !got.title) return null;
    var kind = kindOf(got.kind);
    return {
      kind: kind || "lesson",
      kindGuessed: !kind,
      title: oneLine(got.title),
      occurred: oneLine(got.occurred || ""),
      happened: got.happened || "",
      did: got.did || "",
      came_of_it: got.came_of_it || "",
      next_person: got.next_person || ""
    };
  }

  function split(text) {
    var raw = String(text == null ? "" : text);
    if (!raw.trim()) return { entries: [], unread: [] };
    /* A rule is a line of three or more `=`. Split on it, and drop the empty
       pieces the leading and trailing rules leave behind. */
    var parts = raw.split(/^[ \t]*={3,}[ \t]*$/m).map(function (p) { return p.trim(); }).filter(Boolean);
    var entries = [], unread = [];
    if (parts.length <= 1 && !/^[ \t]*={3,}[ \t]*$/m.test(raw)) {
      /* NO RULES AT ALL. One entry holding everything, so a person who talked
         for ten minutes and pasted prose loses none of it — the degenerate
         case is the safe one, never the empty one. */
      var one = readBlock(raw);
      if (one) entries.push(one); else unread.push(raw.trim());
      return { entries: entries, unread: unread };
    }
    for (var i = 0; i < parts.length; i++) {
      var e = readBlock(parts[i]);
      if (e) entries.push(e); else unread.push(parts[i]);
    }
    return { entries: entries, unread: unread };
  }

  return { split: split, KINDS: KINDS };
});
