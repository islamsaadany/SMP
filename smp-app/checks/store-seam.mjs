/* ── THE SEAM BETWEEN US AND THE STORE (§358.5) ─────────────────────────
   Every other check of the library stops at our own door: `insights.mjs`
   proves the rows and the boundary, `publishing-room.py` drives the browser
   against a stub of OUR server. Nothing has ever looked at the four calls
   `lib/blob-api.ts` makes INTO `@vercel/blob` — and that is the one place
   this module has already been wrong once.

   §261.10 IS THE WHOLE REASON THIS FILE EXISTS. `getDownloadUrl` takes a full
   blob URL and is SYNCHRONOUS, so handed a pathname it threw `Invalid URL`,
   the catch swallowed it, and NOTHING WOULD EVER HAVE PLAYED. It was found
   only when a store existed. A private blob has no address of its own: the
   store issues a delegation scoped to one pathname and one operation, and
   that signs a concrete URL — two steps, in that order, the second taking
   what the first returned. That shape is asserted here by NAME.

   WHY IT NEEDS NO TOKEN AND NO NETWORK. The SDK is stubbed in the require
   cache before the module under test loads it (§261.10's own method, and
   scripts/test-video-endpoint.js's) and every call is recorded. What that
   cannot prove is bytes landing in a real Vercel store — said at the end
   rather than left to be assumed (§54.5).

     node --experimental-strip-types checks/store-seam.mjs                   */
import { createRequire } from "node:module";
const require = createRequire(import.meta.url);

let passes = 0; const fails = [];
const check = (why, ok, detail) => {
  if (ok) { passes++; console.log("  ok   " + why); }
  else { fails.push(why); console.log("  FAIL " + why + (detail === undefined ? "" : "  — " + detail)); }
};

/* ── the store, recorded rather than reached ─────────────────────────── */
const CALLS = [];
let THROW = null;
const rec = (name, ret) => async (...args) => {
  CALLS.push({ name, args });
  if (THROW === name) throw new Error("the store refused");
  return ret(...args);
};
const STUB = {
  createMultipartUpload: rec("createMultipartUpload", async () => ({ key: "K-1", uploadId: "U-1" })),
  uploadPart: rec("uploadPart", async () => ({ etag: "ETAG-7" })),
  completeMultipartUpload: rec("completeMultipartUpload", async () => ({ url: "https://store.example/x" })),
  issueSignedToken: rec("issueSignedToken", async () => "DELEGATION-TOKEN"),
  presignUrl: rec("presignUrl", async () => ({ presignedUrl: "https://store.example/x?sig=1" })),
  del: rec("del", async () => undefined),
};
const id = require.resolve("@vercel/blob");
require.cache[id] = { id, filename: id, loaded: true, exports: STUB };

/* NO TOKEN FIRST. The degrade path is what every deployment without a store
   runs, and it is asserted BEFORE the token is set — once the module has
   answered `ready()` it remembers nothing, but the environment is read on
   every call and a check that sets the token first can never see this. */
delete process.env.BLOB_READ_WRITE_TOKEN;
delete process.env.SMP_BLOB_TOKEN;
const B = await import("../lib/blob-api.ts");

console.log("\n§1 · with no store configured, nothing is reached and nothing throws (§231.3)");
check("ready() is false", B.ready() === false, B.ready());
const off = {
  begin: await B.beginUpload("insights/t/i.pdf", "application/pdf"),
  part: await B.putPart("insights/t/i.pdf", "K", "U", 1, Buffer.from("x")),
  finish: await B.finishUpload("insights/t/i.pdf", "K", "U", []),
  read: await B.signedReadFor("insights/t/i.pdf"),
  drop: await B.dropBlob("insights/t/i.pdf"),
};
check("beginUpload answers null, so the caller can say 'no store' in words", off.begin === null, off.begin);
check("putPart answers an empty etag rather than throwing", off.part === "", JSON.stringify(off.part));
check("finishUpload answers false", off.finish === false, off.finish);
check("signedReadFor answers '', which the caller says in words (§230.2)", off.read === "", JSON.stringify(off.read));
check("dropBlob answers TRUE — nothing is left at that path, which is what the caller needs to know",
  off.drop === true, off.drop);
check("...and the store was not called once", CALLS.length === 0, JSON.stringify(CALLS.map((c) => c.name)));

/* ── §1b · AND IT SAYS WHICH HALF IS MISSING (§374) ────────────────────
   Two entirely different faults used to reach one sentence — the package
   absent from the deployment, and no key for a store — so "there is no file
   store set up yet" was true of both and pointed at neither. Islam read it
   on a deployment whose Blob store had been connected since 4 September, and
   what was actually missing was the package, which the build had never
   traced into any function. §123's argument: *it is not working* sends
   somebody to look at everything, naming the step sends them to one page.

   THE TWO HALVES CANNOT BOTH BE REACHED IN ONE PROCESS, because the loader
   remembers its first answer — so the KEY half is asked here, where the stub
   stands in for a package that loaded, and the SOFTWARE half in a child
   whose resolver refuses that one name exactly as a deployment missing the
   files does (MODULE_NOT_FOUND). BOTH ENDS AND THEN THE DIFFERENCE (§113.8):
   the fault this guards against is the two collapsing back into one wording,
   which every assertion about a single sentence passes perfectly. */
console.log("\n§1b · and the sentence says WHICH half is missing");
const KEYWHY = B.storeWhy();
check("with the package loaded and no key, it names the KEY",
  /key/i.test(KEYWHY) && !/software/i.test(KEYWHY), JSON.stringify(KEYWHY));
const child = require("node:child_process").spawnSync(process.execPath,
  ["--experimental-strip-types", "-e", `
     const M = require("node:module");
     const real = M._resolveFilename;
     M._resolveFilename = function (r, ...rest) {
       if (r === "@vercel/blob") { const e = new Error("Cannot find module '@vercel/blob'"); e.code = "MODULE_NOT_FOUND"; throw e; }
       return real.call(this, r, ...rest);
     };
     process.env.BLOB_READ_WRITE_TOKEN = "vercel_blob_rw_FAKE_seam";
     import("${new URL("../lib/blob-api.ts", import.meta.url).href}")
       .then((m) => console.log(JSON.stringify({ ready: m.ready(), why: m.storeWhy() })));`],
  { encoding: "utf8", cwd: process.cwd() });
let SOFTWHY = "";
try { SOFTWHY = JSON.parse(child.stdout.trim().split("\n").pop()).why; }
catch { SOFTWHY = "(the child said nothing: " + (child.stderr || "").trim().split("\n").pop() + ")"; }
check("with a key and no package, it names the SOFTWARE",
  /software/i.test(SOFTWHY) && !/\bkey\b/i.test(SOFTWHY), JSON.stringify(SOFTWHY));
check("...and the two do not read the same — which is the whole of what was missing",
  !!KEYWHY && !!SOFTWHY && KEYWHY !== SOFTWHY, JSON.stringify([KEYWHY, SOFTWHY]));
/* AND THE LOADER'S OWN WORDS REACH THE RUNTIME LOG (§313.34). The screen
   sentence has to stay readable, so `Cannot find module '@vercel/blob'` goes
   where an operator reads it — and it is that line which would have answered
   this in a minute rather than a build. Asserted, or it is a console.warn
   somebody deletes as noise. */
check("...and the loader says WHY in the runtime log, once, naming the package",
  /@vercel\/blob/.test(child.stderr || "") && /did not load/.test(child.stderr || ""),
  JSON.stringify((child.stderr || "").trim().split("\n").slice(-1)[0]));

/* ── now with one ─────────────────────────────────────────────────────── */
process.env.BLOB_READ_WRITE_TOKEN = "vercel_blob_rw_FAKE_seam";
const TOK = process.env.BLOB_READ_WRITE_TOKEN;
const PATH = "insights/tenant-1/item-9.pdf";

console.log("\n§2 · the upload is three calls, and every one carries the path WE built");
CALLS.length = 0;
const began = await B.beginUpload(PATH, "application/pdf");
const c1 = CALLS.find((c) => c.name === "createMultipartUpload");
check("ready() is true once a token is there", B.ready() === true);
check("beginUpload calls createMultipartUpload, never a one-shot put", !!c1 && CALLS.length === 1,
  JSON.stringify(CALLS.map((c) => c.name)));
check("...with the path as the FIRST argument, exactly as we built it", c1 && c1.args[0] === PATH, c1 && c1.args[0]);
check("...private, never public — a report is not a page on the internet",
  c1 && c1.args[1] && c1.args[1].access === "private", c1 && JSON.stringify(c1.args[1]));
check("...carrying the content type and the token", c1 && c1.args[1].contentType === "application/pdf" && c1.args[1].token === TOK,
  c1 && JSON.stringify(c1.args[1]));
check("...and it hands back the store's OWN two names, key and uploadId (§48)",
  began && began.key === "K-1" && began.uploadId === "U-1", JSON.stringify(began));

CALLS.length = 0;
const etag = await B.putPart(PATH, began.key, began.uploadId, 3, Buffer.from("abc"));
const c2 = CALLS.find((c) => c.name === "uploadPart");
check("putPart calls uploadPart with the path and the BYTES", c2 && c2.args[0] === PATH && Buffer.isBuffer(c2.args[1]),
  c2 && typeof c2.args[1]);
check("...naming the piece `partNumber`, which is the store's word and not ours",
  c2 && c2.args[2] && c2.args[2].partNumber === 3, c2 && JSON.stringify(c2.args[2]));
check("...and carrying the key and uploadId the begin returned, and the token",
  c2 && c2.args[2].key === "K-1" && c2.args[2].uploadId === "U-1" && c2.args[2].token === TOK,
  c2 && JSON.stringify(c2.args[2]));
check("...and the etag comes back, because it is what the finish is assembled from",
  etag === "ETAG-7", etag);

CALLS.length = 0;
const parts = [{ partNumber: 1, etag: "A" }, { partNumber: 2, etag: "B" }];
const done = await B.finishUpload(PATH, began.key, began.uploadId, parts);
const c3 = CALLS.find((c) => c.name === "completeMultipartUpload");
check("finishUpload calls completeMultipartUpload with the path and every part",
  c3 && c3.args[0] === PATH && JSON.stringify(c3.args[1]) === JSON.stringify(parts), c3 && JSON.stringify(c3.args[1]));
check("...with the same key, uploadId and token", c3 && c3.args[2].key === "K-1" && c3.args[2].uploadId === "U-1" && c3.args[2].token === TOK,
  c3 && JSON.stringify(c3.args[2]));
check("...and it answers true only once the store has the whole file", done === true, done);

console.log("\n§3 · the read address is TWO steps, in that order (§261.10)");
CALLS.length = 0;
const url = await B.signedReadFor(PATH);
const names = CALLS.map((c) => c.name);
check("a delegation is issued first, then a URL is signed with it",
  JSON.stringify(names) === JSON.stringify(["issueSignedToken", "presignUrl"]), JSON.stringify(names));
/* THE FAULT THIS FILE EXISTS FOR, ASSERTED BY NAME. `getDownloadUrl` takes a
   full blob URL and is synchronous; handed a pathname it throws, the catch
   swallows it, and nothing ever plays (§261.10). */
check("...and `getDownloadUrl` is never reached with a pathname", !names.includes("getDownloadUrl"), JSON.stringify(names));
const t1 = CALLS[0] && CALLS[0].args[0], t2 = CALLS[1] && CALLS[1].args;
check("the delegation is scoped to ONE pathname and ONE operation",
  t1 && t1.pathname === PATH && JSON.stringify(t1.operations) === JSON.stringify(["get"]), JSON.stringify(t1));
check("...and it expires — an address that never does is one that outlives the report (§261.10)",
  t1 && typeof t1.validUntil === "number" && t1.validUntil > Date.now(), t1 && t1.validUntil);
check("the second step is signed with what the FIRST returned, never with the store's own token",
  t2 && t2[0] === "DELEGATION-TOKEN" && t2[0] !== TOK, t2 && t2[0]);
check("...for the same pathname, the same operation, and still private",
  t2 && t2[1].pathname === PATH && t2[1].operation === "get" && t2[1].access === "private", t2 && JSON.stringify(t2[1]));
check("and the signed URL is what comes back", url === "https://store.example/x?sig=1", url);

console.log("\n§4 · a store that refuses is answered in words, never as a crash");
THROW = "issueSignedToken";
check("a refused delegation reads as 'you cannot fetch this now', not an exception",
  (await B.signedReadFor(PATH)) === "", "it threw or answered something else");
THROW = "del";
check("a refused delete answers FALSE, so the caller can say so rather than swallow it (§171)",
  (await B.dropBlob(PATH)) === false);
THROW = null;
CALLS.length = 0;
const gone = await B.dropBlob(PATH);
const c4 = CALLS.find((c) => c.name === "del");
check("an ordinary delete calls del with the path and the token, and answers true",
  gone === true && c4 && c4.args[0] === PATH && c4.args[1] && c4.args[1].token === TOK, JSON.stringify(c4 && c4.args));
check("an empty path is true without reaching the store — there is nothing there to remove",
  (await B.dropBlob("")) === true && !CALLS.filter((c) => c.name === "del")[1]);

console.log("\n" + (fails.length ? "" : "GREEN ") + passes + " ok, " + fails.length + " failed");
if (fails.length) { console.log("\nWhat failed:"); for (const f of fails) console.log("  · " + f); }
console.log("\nWHAT THIS DOES NOT PROVE: bytes landing in a real Vercel store. The SDK is\n" +
            "stubbed here, so the contract is proved and the journey is not (§54.5). That\n" +
            "is one upload on the deployment, by somebody who can sign in.");
process.exit(fails.length ? 1 : 0);
