const CACHE_NAME = 'bh-edu-cache-v3';
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
    // Bust old caches immediately
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

    // Bypass Next.js HMR/Webpack hot reload and dev requests
    if (
        url.pathname.startsWith('/_next/webpack') ||
        url.pathname.includes('hot-update') ||
        url.pathname.startsWith('/api/')
    ) {
        return;
    }

    // Static Next.js immutable assets (fonts, hashed chunks, images)
    if (url.pathname.startsWith('/_next/static/') || url.pathname.startsWith('/_next/image')) {
        event.respondWith(
            caches.match(event.request).then((cachedResponse) => {
                if (cachedResponse) return cachedResponse;
                return fetch(event.request).then((networkResponse) => {
                    if (networkResponse.ok) {
                        const clonedResponse = networkResponse.clone();
                        caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clonedResponse));
                    }
                    return networkResponse;
                });
            })
        );
        return;
    }

    // Navigation and HTML documents: ALWAYS Network-first, NEVER cache dynamic HTML
    if (event.request.mode === 'navigate') {
        event.respondWith(
            fetch(event.request).catch(() => {
                return caches.match('/offline');
            })
        );
        return;
    }
});
