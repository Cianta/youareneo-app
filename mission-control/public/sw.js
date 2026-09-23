/**
 * TRINITY OS · Service Worker v1
 * ──────────────────────────────
 * Caches proxied responses for performance and offline continuity.
 * Intercepts /api/proxy requests to serve stale-while-revalidate.
 */

const CACHE_NAME    = 'trinity-os-proxy-v1';
const STATIC_CACHE  = 'trinity-os-static-v1';

const PROXY_PATH   = '/api/proxy';
const CACHE_SECS   = 300; // 5 min for proxy responses

// ── Install ─────────────────────────────────────────────────────────────────
self.addEventListener('install', (event) => {
  console.log('[TrinityOS SW] Installed');
  self.skipWaiting();
});

// ── Activate ────────────────────────────────────────────────────────────────
self.addEventListener('activate', (event) => {
  console.log('[TrinityOS SW] Activated');
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        keys
          .filter(k => k !== CACHE_NAME && k !== STATIC_CACHE)
          .map(k => caches.delete(k))
      )
    ).then(() => self.clients.claim())
  );
});

// ── Fetch Intercept ──────────────────────────────────────────────────────────
self.addEventListener('fetch', (event) => {
  const url = event.request.url;

  // Only handle GET proxy requests for caching
  if (event.request.method === 'GET' && url.includes(PROXY_PATH)) {
    event.respondWith(staleWhileRevalidate(event.request));
    return;
  }

  // All other requests pass through
});

async function staleWhileRevalidate(request) {
  const cache = await caches.open(CACHE_NAME);
  const cached = await cache.match(request);

  const fetchPromise = fetch(request).then(response => {
    if (response.ok) {
      const clone = response.clone();
      cache.put(request, clone);
    }
    return response;
  }).catch(() => cached);

  // Serve stale immediately if available, refresh in background
  return cached || fetchPromise;
}

// ── Message handler (allow manual cache clear from app) ──────────────────────
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'CLEAR_CACHE') {
    caches.delete(CACHE_NAME).then(() => {
      event.ports[0]?.postMessage({ ok: true });
    });
  }
});
