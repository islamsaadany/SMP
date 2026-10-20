/* ── A CAPABILITY'S CLIPS ARE ITS OWNER'S (§532) ──────────────────────────
   Islam: *"who may watch a capability deck should be set by the capability
   owner set"*. The two gates are `mayWatch` (may this person PLAY a video clip
   on this subject's review) and `maySpeakFor` (may they ADD or REMOVE one),
   both in api/blob.js. They had only ever tested `fn:`, so a `cap:` target was
   judged in the UNIT column, which cannot see the seats §412 put ON the
   capability — the capability's own owner could neither play nor add a clip on
   their own capability's review.

   THIS IS AN ACCESS CHANGE, so it is asserted as a LIST OF WHO MOVES and not
   as a count (§303: measuring it after the change is measuring the change).
   Both ends, in both directions, over every person in the worked example:
   who gains, and — the one that matters — who LOSES. A check that only
   asserted "the owner may now play" would pass over a build that had quietly
   taken the right off everybody else.

   AND OVER TWO STATES, because the worked example ships the capability with
   BOTH SEATS EMPTY: with them empty the seat path is never entered and the
   whole question is invisible, so the second state fills them. That is the
   same gap scripts/test-box-ref.js found in this fixture (§531.1).

   api/blob.js cannot be required here — it reaches for `pg`, which is not
   installed at the repository root — so the two gates are reproduced from its
   source by READING IT, never by copying the expressions into this file: the
   bodies are extracted and run, so a change to either one that this file does
   not know about makes the extraction fail rather than silently pass.

   Usage: node scripts/test-capability-clips.js
   No browser, no database, no network. */
const fs = require("node:fs");
const path = require("node:path");

const ROOT = path.join(__dirname, "..");
const R = require(path.join(ROOT, "lib", "rules.js"));
const SEED = JSON.parse(fs.readFileSync(path.join(ROOT, "db", "seed-state.json"), "utf8"));

let failed = 0, passed = 0;
function ok(cond, what, detail) {
  if (cond) { passed++; console.log("  ok    " + what); }
  else { failed++; console.log("  FAIL  " + what + (detail === undefined ? "" : "  — " + JSON.stringify(detail))); }
}

/* ── the two gates, taken out of api/blob.js itself ──────────────────────
   Matched on the signature and the closing brace at column 0, so a rewritten
   body travels into this check and a DELETED function fails it. */
const BLOB = fs.readFileSync(path.join(ROOT, "api", "blob.js"), "utf8");
function lift(name) {
  const m = BLOB.match(new RegExp("\\nfunction " + name + "\\(world, person, target\\) \\{\\n([\\s\\S]*?)\\n\\}\\n"));
  if (!m) throw new Error("api/blob.js no longer declares " + name + "(world, person, target)");
  return new Function("R", "world", "person", "target", m[1]);
}
let mayWatch, maySpeakFor;
try { mayWatch = lift("mayWatch"); maySpeakFor = lift("maySpeakFor"); }
catch (e) { console.log("FAIL  " + e.message); process.exit(1); }
const may = (fn) => (w, p, t) => !!fn(R, w, p, t);

/* ── the two states (§531.1's lesson about this fixture) ───────────────── */
function state(fillSeats, boundPerson) {
  const s = JSON.parse(JSON.stringify(SEED));
  const cap = s.group.capabilities[0];
  if (!cap) throw new Error("the worked example holds no capability");
  /* Two people who are NOT the office and NOT the holding function's own head,
     so the SEAT is the only thing that could reach. Stored as KEYS, which is
     what grantPersonRole writes (a name here reaches nothing and the check
     would pass for the wrong reason — it did, the first time this was
     measured). */
  if (fillSeats) { cap.head = "mobhead"; cap.custodian = "loghead"; }
  /* AND A BOUNDED ROLE, for the third state. `capowner` is NOT in
     OWN_LINES_ONLY, so a capability's own owner is never own-rows-only and the
     `onlyOwnLines` guard in `maySpeakFor` could not fire in either state above
     — measured: deleting that guard left this check GREEN. A PROJECT owner is
     bounded (`powner`), and a capability's project is exactly where §520.6 put
     one. Project owners are matched by NAME, which is what the plan stores. */
  if (boundPerson) {
    const p = (s.people || []).filter(function (x) { return x.key === boundPerson; })[0];
    if (!p) throw new Error("the register holds no " + boundPerson);
    if (!cap.projects || !cap.projects[0]) throw new Error("the capability holds no project to own");
    cap.projects[0].owner = p.name;
    /* The Part owner row has to allow the edit at all, or the person is
       refused by the grant and the guard is still never reached. */
    s.access = s.access || {};
    s.access.powner = Object.assign({}, s.access.powner, { a_fn_own: "edit" });
  }
  return { s: s, w: R.worldOf(s), T: "cap:" + cap.id, cap: cap };
}
/* What the UNIT column would have answered — the rule before §532, written
   out here because that build is what this change is measured against. */
function wasRights(st, p) {
  const g = R.grantIn(st.w, p, "unit", st.T);
  return { play: !!g && g !== "none",
           add: g === "edit" && !R.onlyOwnLines(st.w, p, "unit", st.T) };
}
function nowRights(st, p) {
  return { play: may(mayWatch)(st.w, p, st.T), add: may(maySpeakFor)(st.w, p, st.T) };
}

[["the capability's seats empty, as the worked example ships it", false],
 ["the capability's seats filled (owner mobhead, custodian loghead)", true]
].forEach(function (pair) {
  console.log(pair[0]);
  const st = state(pair[1]);
  const gainPlay = [], losePlay = [], gainAdd = [], loseAdd = [];
  (st.s.people || []).forEach(function (p) {
    const was = wasRights(st, p), now = nowRights(st, p);
    if (!was.play && now.play) gainPlay.push(p.key);
    if (was.play && !now.play) losePlay.push(p.key);
    if (!was.add && now.add) gainAdd.push(p.key);
    if (was.add && !now.add) loseAdd.push(p.key);
  });
  /* THE ONE THAT MATTERS, asserted first and in both states. */
  ok(losePlay.length === 0, "NOBODY loses the right to play a clip", losePlay);
  ok(loseAdd.length === 0, "NOBODY loses the right to add a clip", loseAdd);
  if (pair[1]) {
    ok(gainPlay.join(",") === "mobhead", "the capability's own owner gains PLAY, and only them", gainPlay);
    ok(gainAdd.sort().join(",") === "fn_mkt,mobhead",
       "the capability's owner and the holding function's head gain ADD, and only them", gainAdd.sort());
    /* Named rather than counted, or a build that hands the right to everybody
       passes the three above (§94.2). */
    const everyone = (st.s.people || []).filter(function (p) { return nowRights(st, p).add; }).map(function (p) { return p.key; });
    ok(everyone.sort().join(",") === "fn_mkt,fn_mkt2,loghead,mobhead,smo",
       "and the whole list of who may add is exactly these five", everyone.sort());
  } else {
    ok(gainPlay.length === 0, "with no seats set, nobody gains PLAY", gainPlay);
    ok(gainAdd.join(",") === "fn_mkt", "with no seats set, only the holding function's head gains ADD", gainAdd);
  }
  /* A UNIT'S clips must not have moved at all: this change is about the
     capability address and nothing else. */
  const moved = [];
  (st.s.people || []).forEach(function (p) {
    ["mobile", "retailstores", "fn:marketing", "group"].forEach(function (t) {
      const g = R.grantIn(st.w, p, R.boxRef(t).area, t);
      const wasPlay = (function () {
        /* the old expression, for a non-capability target, is the same answer:
           `fn:` read as fn, everything else as unit — which is what `area`
           says for every target but a capability. */
        const og = R.grantIn(st.w, p, R.boxRef(t).kind === "fn" ? "fn" : "unit", t);
        return !!og && og !== "none";
      })();
      if (wasPlay !== may(mayWatch)(st.w, p, t)) moved.push([p.key, t]);
    });
  });
  ok(moved.length === 0, "a unit's, a function's and the top layer's clips are untouched", moved.slice(0, 8));
  console.log("");
});

/* ── 3 · AND A BOUNDED ROLE STILL ADDS NOTHING ────────────────────────────
   §50/§53.5: a picture slide, a video slide, the cycle note and Submit all
   speak for the whole subject in front of the board, so somebody who edits
   only their OWN rows does none of the four — however wide their grant. This
   is the guard `maySpeakFor` carries, and the two states above cannot exercise
   it, because the only roles that are own-rows-only (contrib, the floor,
   a project owner, a pillar owner, a direction owner) hold none of them there. */
console.log("the capability's project owned by a bounded role (§520.6)");
{
  /* `cfo` and not one of the seats: measured over the whole register, they are
     the only person whose ONLY role reaching this capability is the project
     owner. A capability's own owner would ALSO hold `capowner`, which is not
     own-rows-only, so `every` in `onlyOwnLines` fails and the state would be
     the first one again wearing a label (§113.8 — it was, the first try). */
  const st = state(false, "cfo");
  const p = (st.s.people || []).filter(function (x) { return x.key === "cfo"; })[0];
  const bounded = R.onlyOwnLines(st.w, p, R.boxRef(st.T).area, st.T);
  /* Asserted FIRST: if the state failed to make a bounded role, the two below
     are true for the wrong reason (§113.8). */
  ok(bounded === true, "the state really does make them own-rows-only here", bounded);
  ok(may(mayWatch)(st.w, p, st.T) === true, "a bounded role may still PLAY a clip (watching is reading)");
  ok(may(maySpeakFor)(st.w, p, st.T) === false, "a bounded role may NOT add one — a clip speaks for the whole subject");
  console.log("");
}

console.log(failed === 0
  ? "GOOD — " + passed + " agreements; the capability's clips follow its own seats and nobody lost a right"
  : "BAD — " + failed + " of " + (failed + passed) + " failed");
process.exit(failed === 0 ? 0 : 1);
