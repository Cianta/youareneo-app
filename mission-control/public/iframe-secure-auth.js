/**
 * TRINITY OS · iframe-secure-auth Service Worker
 * ─────────────────────────────────────────────────
 * Intercepts fetch requests originating from the GHL proxy iframe.
 * - Forwards auth/session cookies to the upstream GHL proxy route
 * - Rewrites any direct app.gohighlevel.com requests back through the proxy
 * - Stale-while-revalidate caching for static GHL assets
 */

const SW_VERSION = 'trinity-ghl-auth-v1';
const PROXY_BASE = '/api/proxy/ghl';
const GHL_ORIGIN = 'https://app.gohighlevel.com';

// Install — take control immediately
self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  // Intercept direct GHL requests and reroute through proxy
  if (url.origin === GHL_ORIGIN) {
    const proxyUrl = `${self.location.origin}${PROXY_BASE}${url.pathname}${url.search}`;
    const proxiedRequest = new Request(proxyUrl, {
      method: event.request.method,
      headers: event.request.headers,
      body: ['GET', 'HEAD'].includes(event.request.method) ? undefined : event.request.body,
      credentials: 'include',
    });
    event.respondWith(fetch(proxiedRequest));
    return;
  }

  // Pass through all other requests normally
  event.respondWith(fetch(event.request));
});
