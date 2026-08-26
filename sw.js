/* SMP service worker — what makes the platform installable and openable
   offline.

   THE ONE RULE THIS FILE EXISTS TO ENFORCE: /api/* is never cached, ever.
   A cached /api/state is last quarter's numbers wearing this quarter's
   chrome, and a strategy platform that shows stale actuals as if they were
   current is worse than one that will not open. Those requests go straight to
   the network and are allowed to fail — sync.js already handles an
   unreachable API by falling back to the data baked into the file, and the
   platform says so on screen.

   Everything else is the app SHELL: the gate, the built platform file, the
   icons, the manifest. Those are versioned by filename or change only on a
   deploy, so they are safe to hold.

   BUMP IT WHEN THE SHELL'S CONTENTS CHANGE, NOT WHEN ITS FILENAME DOES (§91).
   This sat at v3.22 through §80 to §90 — ten sections of work, including a new
   role and a rewritten register — because the built file kept the SAME NAME the
   whole time and the checklist that says "bump SHELL" lives under "on each
   version bump". The cache is keyed on the URL, so an unchanged filename plus
   an unchanged cache name means every returning browser is served the old
   platform out of its own disk, whatever production is serving. Nobody would
   have seen any of it.

   The trigger is: the built file's BYTES changed. That is every merge.

   Bump SHELL when anything in the shell list changes — the name IS the
   cache-busting mechanism, and the activate handler deletes every cache that
   is not the current one. */
/* IT COLLIDED A SECOND TIME, SO THE RULE CHANGED (§94.16).
   §94.12 said: check `git show origin/main:sw.js` before choosing a name,
   because a merge will not tell you two sessions picked the same one. That was
   done — main said v3.25e, so this took v3.25f — and by the time the merge was
   pushed ANOTHER session had taken v3.25f too. The window between reading main
   and pushing is exactly as long as running the checks, which is twenty
   minutes, and a name chosen at the start of it is a name chosen from stale
   information.

   So the check moves to where it cannot go stale: the name is confirmed
   against `origin/main` AFTER the last fetch and IMMEDIATELY BEFORE the push,
   as the final step of a merge rather than the first. Twice in one day is a
   pattern, not bad luck — and the cost is silent, because the same string on
   both sides merges cleanly while the bytes behind it differ, so a returning
   browser serves the other session's build out of its own disk for ever. */
/* v3.25c, NOT v3.25b — AND THE COLLISION WAS SILENT (§94.12).
   Two sessions merged on the same day and both chose `v3.25b` independently.
   git saw the same string on both sides and merged it without a conflict, so
   nothing anywhere said the name had been used twice — while the bytes behind
   it were different on each side of the merge. A worker caches by NAME, so a
   browser holding the other session's v3.25b would go on serving it and never
   fetch this one: §91's fault ("every returning browser would be served the
   old platform out of its own disk") reached by a route §91 did not predict.

   The trigger is unchanged and is what saves it: the built file's bytes
   changed, so the name changes. What this adds is that the name has to be one
   NOBODY has served — check `git show origin/main:sw.js` before choosing,
   because a merge will not tell you. */
/* v3.25e, AND v3.25d COLLIDED TOO (§94.12, a second time). That rule says
   to check `git show origin/main:sw.js` before choosing, and I did -- main
   was serving v3.25c, so v3.25d was free. Main then moved again while this
   branch was running its sweep, and the other session picked v3.25d as
   well. git conflicted only because the comments above it differed; had
   both sides written the bare line, it would have merged silently for the
   second time in a day.

   SO THE CHECK IS NOT ONCE, IT IS AT THE MOMENT OF THE MERGE -- the same
   discipline as the fetch-and-compare it rides beside, and for the same
   reason: main is a moving target and anything read from it goes stale the
   moment it is read. Checked here against origin/main and against every
   name this repository has ever carried: v3.25, b, c, d are used.

   §99 STOPS TAKING THE NEXT LETTER. Twice in one day two sessions reached
   for the same one, because "the next letter after the one main is serving"
   is a rule both of them can follow correctly and still collide on -- and
   when they do, git merges the bare line with no conflict at all while the
   bytes behind the name differ, which is the one failure a cache name exists
   to prevent. A name taken from what the branch DID cannot be arrived at by
   coincidence. Checked at merge time -- three times, because main moved
   again on each check and is now serving v3.26. This repository has carried
   v3.21, v3.22, v3.24, b, c, d, v3.25, b, c, d, e, f, g, h and v3.26; none
   of them is this one, which is the point of not being a letter. The version
   in it tracks the platform (§98 took it to v3.27), the suffix says whose.

   AND THE SAME FAULT HAS A THIRD FACE: the SECTION NUMBER in the decisions
   document. This branch was written as §95 and renumbered three times -- to
   §96, to §97, and to §99 -- as main took §95, then §96, then §97 AND §98 in
   one go. Four sessions on one day, each correctly taking "the next number"
   from a main that had moved since they read it. A sequential name claimed at AUTHORING time is
   claimed against a snapshot; it is only real at MERGE time. Anything
   sequential and shared -- a cache name, a section number, a migration
   number -- is chosen in the same breath as the fetch-and-look that precedes
   every merge, and never before. */

/* v3.37 — the assistant (§111, §112) and the chat that vanished (§113), on top
   of the merge that brought in §103–§110 from another session. THE TRIGGER IS
   THE BYTES, NOT THE VERSION (§91): the built file changed, so the cache name
   changes. Confirmed against origin/main, which is serving "smp-shell-v3.36",
   at the moment of the merge AND AGAIN IMMEDIATELY BEFORE THE PUSH (§94.16) —
   the window between reading main and pushing is as long as running the
   checks, and on this branch main moved 56 commits inside one such window.
   A worker caches by NAME, so the same string on both sides conflicts on
   nothing while the bytes behind it differ (§94.12). */
/* v3.40 — the strategy | reporting split and the plan-as-slides download
   (§117). This branch FIRST took v3.39 for this work, checked against a main
   serving v3.38 — and the register session took v3.39 in the same window,
   §94.12's collision for the fifth time: git put the two identical strings in
   conflict only because a comment differed. Resolved to a name nobody has
   served, confirmed against origin/main at the merge and AGAIN immediately
   before the push (§94.16). */
/* v3.44 — §122: one line above the table, a dialog that fits the window,
   a bold title and a table that reaches the fold. §94.12 FOR THE EIGHTH
   TIME, and the FIFTH on this one piece of work: v3.39, v3.40, v3.41 and
   v3.43 were each taken by main inside the window between reading a name
   and pushing it, and main is now serving "smp-shell-v3.43-setup".
   Confirmed against origin/main, and to be confirmed once more
   immediately before any push to main (§94.16). */
const SHELL = "smp-shell-v3.46-assistant";
const ASSETS = [
  "/",
  "/index.html",
  /* The tenant path, not the file behind it: a service worker caches by
     REQUEST URL, and the gate asks for /raya-trade. Caching the versioned
     filename instead would fill the cache with something nobody requests
     and leave the platform unavailable offline. Both still resolve to the
     same file on the server (vercel.json rewrites). */
  "/raya-trade",
  "/manifest.webmanifest",
  "/favicon.svg",
  "/favicon.png",
  "/icons/icon-192.png",
  "/icons/icon-512.png",
  "/icons/icon-maskable-512.png"
];

self.addEventListener("install", (e) => {
  /* addAll is all-or-nothing: one 404 and the whole install fails, leaving no
     worker at all. Each asset is added on its own so a missing icon cannot
     cost the offline gate. */
  e.waitUntil(caches.open(SHELL).then((c) =>
    Promise.all(ASSETS.map((u) => c.add(u).catch(() => {})))
  ).then(() => self.skipWaiting()));
});

self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches.keys()
      .then((ks) => Promise.all(ks.filter((k) => k !== SHELL).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (e) => {
  const req = e.request;
  if (req.method !== "GET") return;                     // sign-in, save: network only
  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return;      // not ours to serve
  if (url.pathname.startsWith("/api/")) return;         // THE RULE, above

  /* Network first, cache as the fallback. The other way round would pin
     everyone to the shell they first loaded and a deploy would not reach them
     until the cache was cleared by hand. This way the network wins whenever
     there is one, and the cache is only ever what you get when there is not. */
  e.respondWith(
    fetch(req)
      .then((res) => {
        if (res && res.ok && res.type === "basic") {
          const copy = res.clone();
          caches.open(SHELL).then((c) => c.put(req, copy));
        }
        return res;
      })
      .catch(() => caches.match(req).then((hit) =>
        hit || (req.mode === "navigate" ? caches.match("/index.html") : undefined)
      ))
  );
});
