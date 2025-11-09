const CACHE_NAME = 'personal-ai-agent-cache-v2';
const urlsToCache = [
  '/',
  '/index.html',
  '/manifest.json',
  '/icon.svg',
  '/index.tsx',
  '/App.tsx',
  '/types.ts',
  '/services/geminiService.ts',
  '/components/Header.tsx',
  '/components/Onboarding.tsx',
  '/components/PermissionsManager.tsx',
  '/components/Agenda.tsx',
  '/components/Chat.tsx',
  '/components/Icons.tsx',
  '/components/SettingsModal.tsx',
  'https://cdn.tailwindcss.com',
];

// Install: Open cache and add app shell files.
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('Opened cache and caching app shell');
        return cache.addAll(urlsToCache);
      })
      .then(() => self.skipWaiting()) // Activate the new service worker immediately.
  );
});

// Activate: Clean up old caches.
self.addEventListener('activate', event => {
  const cacheWhitelist = [CACHE_NAME];
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheWhitelist.indexOf(cacheName) === -1) {
            console.log('Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => self.clients.claim()) // Take control of all open clients.
  );
});

// Fetch: Use a stale-while-revalidate strategy.
self.addEventListener('fetch', event => {
    // For navigation requests, use network-first to get the latest page.
    if (event.request.mode === 'navigate') {
        event.respondWith(
            fetch(event.request).catch(() => caches.match('/index.html'))
        );
        return;
    }

    event.respondWith(
        caches.open(CACHE_NAME).then(cache => {
            return cache.match(event.request).then(response => {
                const fetchPromise = fetch(event.request).then(networkResponse => {
                    // We only cache valid responses.
                    if (networkResponse && (networkResponse.status === 200 || networkResponse.type === 'opaque')) {
                        cache.put(event.request, networkResponse.clone());
                    }
                    return networkResponse;
                }).catch(err => {
                    console.error('Fetch failed:', err);
                });

                // Return the cached response immediately if available, and update cache in background.
                return response || fetchPromise;
            });
        })
    );
});
