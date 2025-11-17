/**
 * Service Worker for Tech Radar Builder PWA
 * Enables offline functionality by caching essential assets
 */

const CACHE_NAME = 'tech-radar-builder-v1';
const RUNTIME_CACHE = 'tech-radar-builder-runtime-v1';

// Essential files to cache for offline functionality
const PRECACHE_URLS = [
  './builder.html',
  './radar.js',
  './radar.css',
  './builder.webmanifest',
  './web-app-manifest-192x192.png',
  './web-app-manifest-512x512.png',
  './favicon-96x96.png',
  './favicon.ico',
];

// CDN resources to cache
const CDN_URLS = [
  'https://d3js.org/d3.v7.min.js',
  'https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js',
  'https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js',
  'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.1/css/all.min.css',
];

/**
 * Install event - cache essential resources
 */
self.addEventListener('install', event => {
  console.log('[Service Worker] Installing...');

  event.waitUntil(
    (async () => {
      try {
        // Open cache and add local resources
        const cache = await caches.open(CACHE_NAME);
        console.log('[Service Worker] Caching local resources');
        await cache.addAll(PRECACHE_URLS);

        // Cache CDN resources separately (fail gracefully if offline during install)
        console.log('[Service Worker] Caching CDN resources');
        for (const url of CDN_URLS) {
          try {
            const response = await fetch(url, { mode: 'cors' });
            if (response.ok) {
              await cache.put(url, response);
            }
          } catch (error) {
            console.warn(`[Service Worker] Failed to cache CDN resource: ${url}`, error);
          }
        }

        console.log('[Service Worker] Installation complete');

        // Force the waiting service worker to become the active service worker
        await self.skipWaiting();
      } catch (error) {
        console.error('[Service Worker] Installation failed:', error);
      }
    })()
  );
});

/**
 * Activate event - clean up old caches
 */
self.addEventListener('activate', event => {
  console.log('[Service Worker] Activating...');

  event.waitUntil(
    (async () => {
      // Clean up old caches
      const cacheNames = await caches.keys();
      await Promise.all(
        cacheNames
          .filter(name => name !== CACHE_NAME && name !== RUNTIME_CACHE)
          .map(name => {
            console.log('[Service Worker] Deleting old cache:', name);
            return caches.delete(name);
          })
      );

      // Take control of all pages immediately
      await self.clients.claim();
      console.log('[Service Worker] Activation complete');
    })()
  );
});

/**
 * Try to find a cached response for the request
 * @param {Request} request - The request to find in cache
 * @returns {Promise<Response|null>} Cached response or null
 */
async function getCachedResponse(request) {
  // Try runtime cache first
  let cachedResponse = await caches.match(request);

  if (cachedResponse) {
    return cachedResponse;
  }

  // If not in runtime cache, try main cache
  cachedResponse = await caches.match(request, { cacheName: CACHE_NAME });

  if (cachedResponse) {
    return cachedResponse;
  }

  // If still not found and it's a navigation request, serve the builder page
  if (request.mode === 'navigate') {
    const builderCache = await caches.match('./builder.html');
    if (builderCache) {
      return builderCache;
    }
  }

  return null;
}

/**
 * Create an offline error response
 * @param {string} url - The URL that failed to load
 * @returns {Response} Offline error response
 */
function createOfflineResponse(url) {
  console.error('[Service Worker] No cache match for:', url);
  return new Response('Offline - Resource not available', {
    status: 503,
    statusText: 'Service Unavailable',
    headers: new Headers({
      'Content-Type': 'text/plain',
    }),
  });
}

/**
 * Fetch event - serve from cache when offline, otherwise from network
 * Strategy: Network First with Cache Fallback
 */
self.addEventListener('fetch', event => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET requests
  if (request.method !== 'GET') {
    return;
  }

  // Skip chrome-extension and other non-http(s) requests
  if (!url.protocol.startsWith('http')) {
    return;
  }

  event.respondWith(
    (async () => {
      try {
        // Try to fetch from network first
        const networkResponse = await fetch(request);

        // If successful, cache it for future offline use (only cache successful responses)
        if (networkResponse.ok) {
          const cache = await caches.open(RUNTIME_CACHE);
          // Clone the response because it can only be consumed once
          cache.put(request, networkResponse.clone());
        }

        return networkResponse;
      } catch (_error) {
        // Network fetch failed (offline), try to serve from cache
        console.log('[Service Worker] Network failed, serving from cache:', request.url);

        const cachedResponse = await getCachedResponse(request);
        return cachedResponse || createOfflineResponse(request.url);
      }
    })()
  );
});

/**
 * Message event - handle messages from the page
 */
self.addEventListener('message', event => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }

  if (event.data && event.data.type === 'CACHE_URLS') {
    // Cache additional URLs on demand
    event.waitUntil(
      (async () => {
        const cache = await caches.open(RUNTIME_CACHE);
        await cache.addAll(event.data.urls);
      })()
    );
  }
});

console.log('[Service Worker] Script loaded');
