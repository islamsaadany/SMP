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
const SHELL = "smp-shell-v3.24c";
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
