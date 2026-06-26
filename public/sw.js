// FinanceOS Service Worker
// Strategy: network-first for HTML/JS/CSS (always gets latest deploy),
// cache-first for assets (icons, fonts) for offline support.
// On activation, old caches are immediately purged so updates show up fast.

const CACHE = "financeos-v2";
const STATIC = ["/financeos/", "/financeos/index.html"];

self.addEventListener("install", (e) => {
  self.skipWaiting(); // activate immediately, don't wait for old SW to die
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(STATIC)));
});

self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))
    ).then(() => self.clients.claim()) // take control of all open tabs immediately
  );
});

self.addEventListener("fetch", (e) => {
  const url = new URL(e.request.url);

  // Never intercept cross-origin requests (Google OAuth, Apps Script, fonts)
  if (url.origin !== location.origin) return;

  // HTML and JS/CSS: network-first so updates land immediately
  const isDoc = e.request.mode === "navigate" || url.pathname.endsWith(".html");
  const isAsset = url.pathname.match(/\.(js|css)$/);

  if (isDoc || isAsset) {
    e.respondWith(
      fetch(e.request)
        .then((res) => {
          const clone = res.clone();
          caches.open(CACHE).then((c) => c.put(e.request, clone));
          return res;
        })
        .catch(() => caches.match(e.request)) // offline fallback
    );
    return;
  }

  // Icons and static assets: cache-first
  e.respondWith(
    caches.match(e.request).then((cached) =>
      cached || fetch(e.request).then((res) => {
        const clone = res.clone();
        caches.open(CACHE).then((c) => c.put(e.request, clone));
        return res;
      })
    )
  );
});
