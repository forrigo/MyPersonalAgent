const CACHE_NAME = 'personal-ai-agent-cache-v3';
// Apenas os arquivos essenciais da "casca" do app. O resto será cacheado pela primeira requisição.
const urlsToCache = [
  '/',
  '/index.html',
  '/manifest.json',
  '/icon.svg',
];

// Instalação: Abre o cache e adiciona os arquivos da casca do app.
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('Opened cache and caching app shell');
        return cache.addAll(urlsToCache);
      })
      .then(() => self.skipWaiting()) // Ativa o novo service worker imediatamente.
  );
});

// Ativação: Limpa caches antigos.
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
    }).then(() => self.clients.claim()) // Assume o controle de todos os clientes abertos.
  );
});

// Fetch: Usa uma estratégia "stale-while-revalidate".
self.addEventListener('fetch', event => {
    // Para requisições de navegação, use network-first para obter a página mais recente.
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
                    // Apenas respostas válidas são cacheadas.
                    if (networkResponse && (networkResponse.status === 200 || networkResponse.type === 'opaque')) {
                        cache.put(event.request, networkResponse.clone());
                    }
                    return networkResponse;
                }).catch(err => {
                    console.error('Fetch failed:', err);
                });

                // Retorna a resposta do cache imediatamente se disponível, e atualiza o cache em segundo plano.
                return response || fetchPromise;
            });
        })
    );
});
