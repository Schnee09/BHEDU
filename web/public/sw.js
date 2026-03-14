const CACHE_NAME = 'bh-edu-cache-v2';
const STATIC_ASSETS = [
    '/offline',
    '/favicon.ico',
];

self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME).then((cache) => {
            return cache.addAll(STATIC_ASSETS);
        })
    );
    self.skipWaiting();
});

self.addEventListener('activate', (event) => {
    // Bust old caches
    event.waitUntil(
        caches.keys().then((cacheNames) => {
            return Promise.all(
                cacheNames
                    .filter((name) => name !== CACHE_NAME)
                    .map((name) => caches.delete(name))
            );
        })
    );
    self.clients.claim();
});

self.addEventListener('fetch', (event) => {
    if (event.request.method !== 'GET') return;

    const url = new URL(event.request.url);

    // Bypass Next.js HMR/Webpack hot reload requests
    if (url.pathname.startsWith('/_next/webpack') || url.pathname.includes('hot-update')) {
        return;
    }

    // API requests strategy: Network first
    if (event.request.url.includes('/api/')) {
        event.respondWith(
            fetch(event.request).then((response) => {
                const clonedResponse = response.clone();
                caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clonedResponse));
                return response;
            }).catch(() => caches.match(event.request))
        );
        return;
    }

    // Static Next.js assets (fonts, chunks, images) with hashes are safe for Stale-while-revalidate or Cache First
    if (url.pathname.startsWith('/_next/static/') || url.pathname.startsWith('/_next/image')) {
        event.respondWith(
            caches.match(event.request).then((cachedResponse) => {
                if (cachedResponse) return cachedResponse;
                return fetch(event.request).then((networkResponse) => {
                    const clonedResponse = networkResponse.clone();
                    caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clonedResponse));
                    return networkResponse;
                });
            })
        );
        return;
    }

    // Navigation and HTML documents: Network First (prevents stale infinite redirect loops)
    event.respondWith(
        fetch(event.request)
            .then((networkResponse) => {
                const clonedResponse = networkResponse.clone();
                caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clonedResponse));
                return networkResponse;
            })
            .catch(() => {
                return caches.match(event.request).then((cachedResponse) => {
                    return cachedResponse || caches.match('/offline');
                });
            })
    );
});
