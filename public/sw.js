const CACHE_NAME = 'cue-junction-cache-v1';
const ASSETS_TO_CACHE = [
  '/',
  '/manifest.json',
  '/favicon.ico',
  '/icon-192.png',
  '/icon-512.png'
];

// Install Event - Pre-cache critical static shell
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(ASSETS_TO_CACHE);
    }).then(() => self.skipWaiting())
  );
});

// Activate Event - Clean up old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cache) => {
          if (cache !== CACHE_NAME) {
            return caches.delete(cache);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// Fetch Event - Network first fallback to cache for pages, bypass for actions/APIs
self.addEventListener('fetch', (event) => {
  // Bypass caching for non-HTTP requests, Server Actions, better-auth endpoints, and prisma API queries
  if (
    event.request.method !== 'GET' ||
    !event.request.url.startsWith('http') ||
    event.request.url.includes('/api/auth') ||
    event.request.url.includes('/_next/data')
  ) {
    return; // Fallback to native network request behavior
  }

  event.respondWith(
    fetch(event.request)
      .then((response) => {
        // If we got a valid response from the network, clone it and store it in cache
        if (response && response.status === 200 && response.type === 'basic') {
          const responseToCache = response.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseToCache);
          });
        }
        return response;
      })
      .catch(() => {
        // Network failed (offline) - try to serve from cache
        return caches.match(event.request);
      })
  );
});
