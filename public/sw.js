// SHINE 26 Event Platform — High-Performance Service Worker
// v3: purge caches from earlier versions that stored authenticated pages
const CACHE_NAME = "shine26-cache-v4";

// Authenticated or per-user pages must never be written to the shared cache:
// scanner/registration devices are shared between staff and the cache outlives logout.
const PRIVATE_PATH_PREFIXES = ["/dashboard", "/admin", "/coordinator", "/food", "/profile", "/badge", "/api"];

function isPrivatePath(pathname) {
  return PRIVATE_PATH_PREFIXES.some((prefix) => pathname === prefix || pathname.startsWith(prefix + "/"));
}
const STATIC_ASSETS = [
  "/",
  "/offline.html",
  "/manifest.webmanifest",
  "/icons/icon-192x192.png",
  "/icons/icon-512x512.png",
  "/icons/apple-touch-icon.png",
  "/icons/favicon-32x32.png",
  "/icons/favicon-16x16.png",
  "/icons/icon.svg",
];

// Install Event — Pre-cache critical assets
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(STATIC_ASSETS);
    }).then(() => self.skipWaiting())
  );
});

// Activate Event — Clean up outdated caches
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) {
            return caches.delete(key);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// Fetch Event — Network-first for pages, Cache-first for assets
self.addEventListener("fetch", (event) => {
  const req = event.request;
  const url = new URL(req.url);

  // Skip non-GET and API mutations
  if (req.method !== "GET") return;

  // Never intercept Turbopack HMR chunks, development bundles, or NextAuth
  if (
    url.pathname.startsWith("/api/auth") ||
    url.pathname.includes("hot-update") ||
    url.pathname.includes("turbopack") ||
    url.pathname.startsWith("/_next/webpack-hmr") ||
    url.pathname.startsWith("/_next/static/development/")
  ) {
    return;
  }

  // Navigation requests (HTML pages): Network-first with offline fallback
  if (req.mode === "navigate") {
    event.respondWith(
      fetch(req)
        .then((networkRes) => {
          // Clone and cache the successfully loaded page (public pages only)
          if (networkRes.status === 200 && !isPrivatePath(url.pathname)) {
            const resClone = networkRes.clone();
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(req, resClone);
            });
          }
          return networkRes;
        })
        .catch(async () => {
          // Try to return cached page or fallback to offline.html
          const cachedRes = isPrivatePath(url.pathname) ? null : await caches.match(req);
          if (cachedRes) return cachedRes;
          return caches.match("/offline.html");
        })
    );
    return;
  }

  // Static Assets (Images, Next.js chunks, fonts, icons): Cache-first with network fallback.
  // /uploads/ files (logos, floor plan) can be replaced at the same URL, so they use the
  // network-first default below instead of being pinned to the first cached copy.
  if (
    !url.pathname.startsWith("/uploads/") &&
    (url.pathname.startsWith("/_next/static/") ||
    url.pathname.startsWith("/icons/") ||
    url.pathname.endsWith(".png") ||
    url.pathname.endsWith(".jpg") ||
    url.pathname.endsWith(".svg") ||
    url.pathname.endsWith(".woff2") ||
    url.pathname.endsWith(".css"))
  ) {
    event.respondWith(
      caches.match(req).then((cached) => {
        if (cached) return cached;

        return fetch(req).then((networkRes) => {
          if (networkRes.status === 200) {
            const resClone = networkRes.clone();
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(req, resClone);
            });
          }
          return networkRes;
        });
      })
    );
    return;
  }

  // Default: Network with cache fallback
  event.respondWith(
    fetch(req).catch(() => caches.match(req))
  );
});

// Listen for update notifications from client
self.addEventListener("message", (event) => {
  if (event.data && event.data.type === "SKIP_WAITING") {
    self.skipWaiting();
  }
  // Sent by the app on sign-out: drop every cached response
  if (event.data && event.data.type === "CLEAR_CACHE") {
    event.waitUntil(caches.keys().then((keys) => Promise.all(keys.map((key) => caches.delete(key)))));
  }
});
