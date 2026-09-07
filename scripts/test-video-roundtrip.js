/* A VIDEO SLIDE NEEDS NO MIGRATION (§261) — proved, not claimed.
 *
 * The whole design rests on one sentence: the clip's bytes live in a blob
 * store and the state graph keeps a pointer. That pointer rides in
 * `review.slides`, which is already inside the `review` row's `extra` JSONB
 * (§50) — so the claim is that five new fields on a slide survive a write and
 * a read with no schema change at all.
 *
 * A CLAIM ABOUT JSONB IS WORTH NOTHING UNTIL POSTGRES HAS SEEN IT. §172 is
 * this project's own scar: a value four layers agreed about was refused by a
 * CHECK constraint nobody had run it past, and every save in the tenant failed
 * from then on. §249.3 is the other half — jsonb reorders object keys, so the
 * comparison itself has to be canonical or an untouched row reads as a change.
 *
 * Run: DATABASE_URL=... node scripts/test-video-roundtrip.js
 */
const pg = require("pg");
const io = require("../lib/state-io.js");
const R = require("../lib/rules.js");

let ok = 0, bad = 0;
function check(what, cond, got) {
  if (cond) { ok++; console.log("  ok   " + what); }
  else { bad++; console.log("  FAIL " + what + (got !== undefined ? "  --  " + JSON.stringify(got) : "")); }
}
/* Key order is not content (§249.3): Postgres hands an object back spelled its
   own way, and a stringify-based compare would call that a difference. */
function canon(v) {
  if (Array.isArray(v)) return v.map(canon);
  if (v && typeof v === "object") {
    const out = {};
    Object.keys(v).sort().forEach(function (k) { out[k] = canon(v[k]); });
    return out;
  }
  return v;
}
const same = (a, b) => JSON.stringify(canon(a)) === JSON.stringify(canon(b));

(async function () {
  const pool = io.getPool(pg);
  const client = await pool.connect();
  try {
    await io.ensureReady(client);
    const state = await io.readState(client);

    /* An UPLOADED clip, a LINK, and one the office has CLEARED — the three
       shapes a slide can hold, written together because a round trip proved
       on one of them says nothing about the other two. */
    const poster = "data:image/gif;base64,R0lGODlhAQABAAAAACH5BAEKAAEALAAAAAABAAEAAAICTAEAOw==";
    const slides = [
      { id: "psv1", at: "swot", kind: "video", title: "How the store opened",
        vcap: "Opening morning, 14 August",
        vid: { path: "videos/mobile/v1.mp4", poster: poster, secs: 72,
               bytes: 35651584, name: "opening.mp4", by: "Hala Mansour", at: "3 Sep 26" } },
      { id: "psv2", at: "swot", kind: "video", title: "Walkthrough",
        vid: { url: "https://vimeo.com/123456789", by: "Karim Fouad", at: "3 Sep 26" } },
      { id: "psv3", at: "swot", kind: "video", title: "Campaign film",
        vcap: "kept for the record",
        vid: { poster: poster, cleared: "3 Sep 26", name: "campaign.mp4" } },
      /* And a PICTURE slide beside them, or "videos survive" would be proved
         on a build that had quietly stopped storing anything else. */
      { id: "psp1", at: "swot", title: "The shelf",
        pics: [{ src: poster, cap: "a picture", z: 1, x: 50, y: 50 }] }
    ];
    state.review = state.review || {};
    state.review.slides = Object.assign({}, state.review.slides, { mobile: slides });

    await io.writeState(client, state);
    const back = await io.readState(client);
    const got = ((back.review || {}).slides || {}).mobile;

    check("the slides came back", Array.isArray(got) && got.length === 4,
          Array.isArray(got) ? got.length : got);
    if (Array.isArray(got) && got.length === 4) {
      check("an uploaded clip round trips whole", same(got[0], slides[0]), got[0]);
      check("a pasted link round trips whole", same(got[1], slides[1]), got[1]);
      check("a cleared clip round trips whole", same(got[2], slides[2]), got[2]);
      check("the picture slide beside them is untouched", same(got[3], slides[3]), got[3]);
      /* The two facts the storage page and the deck actually read. */
      check("the poster survived", got[0].vid.poster === poster);
      check("the size and length survived",
            got[0].vid.bytes === 35651584 && got[0].vid.secs === 72, got[0].vid);
      /* A CLEARED CLIP DOES NOT COUNT AGAINST THE CEILING, and that is the
         decision rather than an accident of the predicate: clearing is what
         MAKES room, so a subject whose third clip the office deleted can put
         another one up. Two of these three slides hold a clip; the cleared one
         holds a record of one.
         (This assertion was written the other way round first, and the product
         was right — worth keeping as the thing that pins the behaviour.) */
      check("a cleared clip is not counted as held",
            R.videoSlides(got).length === 2, R.videoSlides(got).length);
      check("...so clearing one leaves room for another",
            R.videoRoom(got) === 1, R.videoRoom(got));
      check("...and three LIVE clips do fill the ceiling",
            R.videoRoom(got.concat([{ vid: { url: "https://vimeo.com/1" } }])) === 0,
            R.videoRoom(got.concat([{ vid: { url: "https://vimeo.com/1" } }])));
    }

    /* WRITE(READ()) IS A FIXED POINT. A round trip that merely returns the
       same fields can still be re-spelling them on every save, which is a
       phantom change in every diff from then on (§42, §249.3). */
    await io.writeState(client, back);
    const twice = await io.readState(client);
    check("write(read()) leaves the slides byte-identical",
          same(((twice.review || {}).slides || {}).mobile, got));

    /* AND NOTHING WAS MIGRATED. If a column had been needed, this is where the
       claim would fall over — the same schema that shipped before §261 is the
       one that just held all of it. */
    const cols = await client.query(
      "SELECT column_name FROM information_schema.columns WHERE table_name='review'");
    const names = cols.rows.map(r => r.column_name);
    check("the review table gained no video column",
          !names.some(n => /video|clip|blob/i.test(n)), names);
    check("...and it still carries the extra it rides in",
          names.indexOf("extra") >= 0, names);
  } finally {
    client.release();
    await pool.end();
  }
  console.log("\n" + ok + " passed, " + bad + " failed");
  process.exit(bad ? 1 : 0);
})().catch(function (e) {
  console.error("threw:", e.message);
  process.exit(1);
});
