const CACHE_NAME = 'badminton-app-v1';
const ASSETS_TO_CACHE = [
  '/BadmintonMatchmaker',
  '/BadmintonMatchmaker/index.html',
  '/BadmintonMatchmaker/index.tsx',
  '/BadmintonMatchmaker/manifest.json'
];

// Install Event - Cache Files
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(ASSETS_TO_CACHE);
    })
  );
  self.skipWaiting();
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
    })
  );
  self.clients.claim();
});

// Fetch Event - Serve from Cache or Network
self.addEventListener('fetch', (event) => {
  // Only handle GET requests
  if (event.request.method !== 'GET') return;

  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      // Return cached response if found
      if (cachedResponse) {
        return cachedResponse;
      }

      // Otherwise fetch from network
      return fetch(event.request).then((response) => {
        // Check if valid response
        if (!response || response.status !== 200 || (response.type !== 'basic' && response.type !== 'cors')) {
          return response;
        }

        // Clone response to cache it
        const responseToCache = response.clone();
        
        // Dynamic caching for visited pages/assets
        caches.open(CACHE_NAME).then((cache) => {
          // Don't cache API calls or extension schemes if any
          if (event.request.url.startsWith('http')) {
             cache.put(event.request, responseToCache);
          }
        });

        return response;
      }).catch(() => {
        // Fallback for offline (optional: return a specific offline page)
      });
    })
  );
});