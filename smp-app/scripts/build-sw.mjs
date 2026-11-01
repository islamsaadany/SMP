/* THE WORKER THAT CARRIES THE NOTIFICATIONS AND STORES NOTHING (spec 043
   Phase J, stop point C — Islam, 2026-09-10: *"1. ok"*).

   The plan says two things about this file and they were both right about
   their own half. Line 47 says **no service worker and no offline copy**,
   and it is reasoned entirely about CACHING: the frozen product was ONE
   static file, so holding it on disk was safe and §91's cache-by-name trap
   was the price. The new app's platform document is SERVER-RENDERED and
   depends on who is signed in, so a cached copy of it is not a stale shell,
   it is one person's page served to the next person on that device — worse
   than the fault the cache existed to avoid. That half of the plan stands
   and this file keeps it: NOTHING is stored, and there is no `fetch`
   handler at all, so the browser goes to the network for everything exactly
   as it would with no worker present.

   Phase G's row says **carry notifications**, and `push` lives in this one
   file — a browser cannot receive one without a registered worker, so with
   no file at this address `pushSync()` could never subscribe a device. It
   also registers BEFORE it asks whether this device wants a subscription
   (§282.4), so every page load for every viewer logged
   `A bad HTTP response code (404) was received when fetching the script.`
   — the one recorded ERROR in every sweep since Phase G, with nobody having
   turned anything on.

   So: the caching half is DROPPED and the notification half is CARRIED —
   generated from the frozen `sw.js` rather than copied, and asserted, so a
   change to the frozen push handler cannot be missed and a copy cannot
   drift a word at a time (§53.5; the discipline scripts/build-shell.mjs
   already uses on build.py's own list).

   §699 ADDS ONE THING AND STORES NOTHING: a fetch handler for PAGE LOADS
   alone, which hands the network's answer straight back and, only when the
   network fails, answers SMP's own offline page — a string in this file, not
   a copy of anybody's page. Its own note is at OFFLINE_PAGE below.

   AND IT IS WHAT CLEARS THE FROZEN CACHES (§91). A browser returning after
   the cutover holds the old worker AND its `smp-shell-*` cache. This one
   deletes EVERY cache on activate and claims its clients, so no returning
   browser can be served the frozen platform out of its own disk — which is
   §91's own failure, and the reason Phase J's row asks for a file here at
   all. It destroys the old CACHES, not itself: it stays resident, because
   staying resident is how a push arrives with no tab open.

   A side effect worth naming rather than discovering: claiming the clients
   fires `controllerchange` in a tab that already had a controller, which is
   what §258's *"A newer version of the platform is ready"* watches — so an
   open tab on the frozen build is offered the reload at the cutover instead
   of sitting on a build that no longer exists.

     node scripts/build-sw.mjs        (re-run if ../sw.js changes)
*/
import { readFileSync, writeFileSync, mkdirSync, statSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { releaseStamp, assetStamps } from "./release-stamp.mjs";

const here = dirname(fileURLToPath(import.meta.url));
/* SMP_FROZEN_SW points it at a doctored copy, so the guards below can be
   proved able to fail without moving the frozen file (§276, SMP_BUILT's
   own shape). Never read in a build; the default is the frozen worker. */
const FROZEN = process.env.SMP_FROZEN_SW || join(here, "..", "..", "sw.js");
const MARK = "/* ══ A BOX THAT ARRIVES WITH NO TAB OPEN (§231)";

const src = readFileSync(FROZEN, "utf8");
const at = src.indexOf(MARK);
if (at < 0) throw new Error("build-sw: the frozen worker no longer carries §231's marker — the notification half cannot be found, so nothing is guessed at");
const dropped = src.slice(0, at);
const carried = src.slice(at);

/* BOTH ENDS, or a build that carried the wrong half would pass (§94.2).
   What is DROPPED must really be the caching half, and what is CARRIED must
   really be the notification half and must depend on none of it. */
const must = (cond, why) => { if (!cond) throw new Error("build-sw: " + why); };
must(/const SHELL\s*=/.test(dropped), "the dropped half holds no SHELL name — is this the caching half?");
must(dropped.includes('addEventListener("fetch"'), "the dropped half holds no fetch handler — is this the caching half?");
must(dropped.includes("caches.open("), "the dropped half opens no cache — is this the caching half?");
must(carried.includes('addEventListener("push"'), "the carried half holds no push handler");
must(carried.includes('addEventListener("notificationclick"'), "the carried half holds no notificationclick handler");
must(!/caches/.test(carried), "the carried half touches `caches` — it would depend on the half being dropped");
must(!/SHELL/.test(carried), "the carried half names SHELL — it would depend on the half being dropped");
must(!/addEventListener\("fetch"/.test(carried), "the carried half holds a fetch handler — nothing here may serve from disk");

/* §620: each file a page waits on, by its hash — the list the server
   writes into their addresses. Written BEFORE the release stamp, which
   counts it among the files a tab holds (shell/). Built last for the same
   reason the stamp is: every generator that writes those files has run. */
writeFileSync(join(here, "..", "shell", "asset-stamps.json"), JSON.stringify(assetStamps(), null, 2) + "\n");

/* ── THE OFFLINE PAGE (§699) ───────────────────────────────────────────────
   Islam: *"the page that shows that you are offline if there is no
   internet"*, drawn in design-mockups/jump-to-offline/ and approved. Opening
   the platform with no connection showed the browser's own error, because
   nothing of ours had loaded to say anything else.

   THE RULE ABOVE STANDS: NOTHING IS STORED. The page is a string in this
   file, answered by the worker itself when a PAGE LOAD (`mode: navigate`)
   fails to reach the network — never a copy of a page, never a cache, so
   there is nobody's platform on disk to be served to the next person (Phase
   J, stop point C). Every other request, /api/* included, is not touched at
   all: the handler returns before `respondWith` and the browser does what it
   would do with no worker present.

   NAVIGATION PRELOAD, so a worker with a fetch handler does not make every
   page load wait for the worker to wake: the browser starts the request in
   parallel and the handler hands that answer straight back.

   The page says what happened, that nothing saved is lost, offers Try again,
   and reloads by itself when the connection returns (the `online` event, and
   a light check every ten seconds for the browsers that do not fire it). A
   reload that still fails lands here again, which is the right answer. */
const OFFLINE_PAGE = `<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>You're offline — Strategy Management Platform</title>
<meta name="theme-color" content="#16325C">
<style>
:root{--ground:#F5F6F9;--surface:#FFFFFF;--surface2:#EFF2F6;--line:#D6DCE5;--ink:#171B22;--ink2:#414A58;--ink3:#636C79;--btn:#16325C;--btnink:#FFFFFF;--amber:#F5A623;--navy:#0F2C69;--focus:#C9A24D}
@media (prefers-color-scheme:dark){:root{--ground:#14161A;--surface:#1C1F25;--surface2:#23272E;--line:#333A45;--ink:#E9ECF1;--ink2:#B4BCC8;--ink3:#949DAA;--btn:#D9B665;--btnink:#14161A;--focus:#D9B665;color-scheme:dark}}
*{box-sizing:border-box}
html,body{height:100%}
body{margin:0;background:var(--ground);color:var(--ink);font:15px/1.5 "Source Sans 3",system-ui,-apple-system,"Segoe UI",Roboto,sans-serif;display:flex;align-items:center;justify-content:center;padding:24px max(16px,env(safe-area-inset-right,0px)) 24px max(16px,env(safe-area-inset-left,0px))}
main{width:min(420px,100%);background:var(--surface);border:1px solid var(--line);border-radius:12px;padding:28px 22px;text-align:center;display:flex;flex-direction:column;align-items:center;gap:10px}
.mk{display:grid;place-items:center;width:28px;height:28px;border-radius:8px;background:var(--amber);color:var(--navy)}
.ic{width:64px;height:64px;border-radius:50%;background:var(--surface2);border:1px solid var(--line);display:grid;place-items:center;color:var(--ink3);margin-top:6px}
h1{margin:4px 0 0;font-size:21px;text-wrap:balance}
p{margin:0;color:var(--ink2)}
.small{font-size:13px;color:var(--ink3)}
button{margin-top:6px;font-family:inherit;font-size:14px;font-weight:600;line-height:1;background:var(--btn);color:var(--btnink);border:0;border-radius:7px;padding:9px 18px;cursor:pointer}
button:focus-visible{outline:2px solid var(--focus);outline-offset:2px}
</style></head>
<body><main>
<span class="mk" aria-hidden="true"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2.8 13.9 10.1 21.2 12 13.9 13.9 12 21.2 10.1 13.9 2.8 12 10.1 10.1z"/><circle cx="12" cy="12" r="1.3"/></svg></span>
<span class="ic" aria-hidden="true"><svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M2 8.8a15 15 0 0 1 4.2-2.6M9.6 5.2A15 15 0 0 1 22 8.8M5 12.5a10 10 0 0 1 5.2-2.6M14.4 10.2A10 10 0 0 1 19 12.5M8.5 16.1a5 5 0 0 1 7 0"/><circle cx="12" cy="19.5" r="1" fill="currentColor"/><path d="m3 3 18 18"/></svg></span>
<h1>You're offline</h1>
<p>SMP can't reach the internet, so it can't load your latest figures. Nothing you saved is lost.</p>
<p class="small">This page reopens by itself when the connection is back.</p>
<button type="button" id="retry">Try again</button>
<p class="small" id="said" role="status" aria-live="polite"></p>
</main>
<script>
(function () {
  var busy = false;
  function check(byHand) {
    if (busy) return; busy = true;
    fetch("/favicon.svg?online=" + Date.now(), { cache: "no-store" })
      .then(function (r) { if (r.ok) location.reload(); else throw 0; })
      .catch(function () { if (byHand) document.getElementById("said").textContent = "Checked just now. Still no connection."; })
      .then(function () { busy = false; });
  }
  document.getElementById("retry").addEventListener("click", function () { check(true); });
  window.addEventListener("online", function () { check(false); });
  setInterval(function () { check(false); }, 10000);
})();
</script>
</body></html>
`;
const OFFLINE_HALF =
  "/* §699 — SMP's own offline page, for a page load that cannot reach the\n" +
  "   network. Written here, never stored (scripts/build-sw.mjs). */\n" +
  "const OFFLINE_PAGE = " + JSON.stringify(OFFLINE_PAGE) + ";\n" +
  "self.addEventListener(\"fetch\", (e) => {\n" +
  "  if (e.request.mode !== \"navigate\" || e.request.method !== \"GET\") return;\n" +
  "  e.respondWith((async () => {\n" +
  "    try {\n" +
  "      const pre = await e.preloadResponse;\n" +
  "      if (pre) return pre;\n" +
  "      return await fetch(e.request);\n" +
  "    } catch (x) {\n" +
  "      return new Response(OFFLINE_PAGE, { status: 503, headers: { \"Content-Type\": \"text/html; charset=utf-8\", \"Cache-Control\": \"no-store\" } });\n" +
  "    }\n" +
  "  })());\n" +
  "});\n" +
  "\n";

const head =
  "/* GENERATED by scripts/build-sw.mjs from the frozen sw.js. Do not edit here.\n" +
  "   Spec 043 Phase J, stop point C: the notification half of the frozen worker,\n" +
  "   carried verbatim below; the caching half dropped, because the new platform\n" +
  "   document is server-rendered and per person, so a cached copy is one\n" +
  "   person's page served to the next. This worker STORES NOTHING. Its one\n" +
  "   fetch handler (§699) touches page loads alone, and only when the network\n" +
  "   fails: then it answers SMP's own offline page, written into this file. */\n" +
  "\n" +
  /* THE RELEASE STAMP (§397): the line that makes /sw.js differ between two
     releases, which is the only way an open tab learns of one and is offered
     §258's reload. Built last in `npm run build`, after every generator that
     writes what it hashes. SMP_BREAK=no-stamp leaves it out, so the check can
     be proved able to fail. */
  (process.env.SMP_BREAK === "no-stamp" ? "" :
    "/* release " + releaseStamp() + " — changes whenever a file a tab holds changes (§397) */\n\n") +
  "self.addEventListener(\"install\", () => self.skipWaiting());\n" +
  "\n" +
  "/* EVERY cache, not the ones this file knows the names of: what has to go is\n" +
  "   the frozen deployment's `smp-shell-*`, and a returning browser is the only\n" +
  "   place those names exist. Then claim the clients, so a tab open on the old\n" +
  "   build stops being controlled by a worker serving a platform that is no\n" +
  "   longer there (§91) — and hears about it (§258's controllerchange). */\n" +
  "self.addEventListener(\"activate\", (e) => {\n" +
  "  e.waitUntil(\n" +
  "    caches.keys()\n" +
  "      .then((ks) => Promise.all(ks.map((k) => caches.delete(k))))\n" +
  "      .then(() => self.registration.navigationPreload ? self.registration.navigationPreload.enable().catch(() => {}) : null)\n" +
  "      .then(() => self.clients.claim())\n" +
  "  );\n" +
  "});\n" +
  "\n" + OFFLINE_HALF;

mkdirSync(join(here, "..", "public"), { recursive: true });
const out = join(here, "..", "public", "sw.js");
writeFileSync(out, head + carried);
console.log("wrote public/sw.js —", statSync(out).size, "bytes;", carried.split("\n").length, "lines carried verbatim from sw.js, the caching half dropped, the offline page added (§699)");
