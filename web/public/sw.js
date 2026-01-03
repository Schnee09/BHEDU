// Service Worker for BH-EDU PWA
// Features: Caching, Offline Support, Push Notifications

const CACHE_NAME = 'bh-edu-v2';
const STATIC_ASSETS = [
    '/',
    '/dashboard',
    '/login',
    '/manifest.json',
    '/offline',
];

const CACHE_URLS = [
    '/dashboard/students',
    '/dashboard/classes',
    '/dashboard/grades',
    '/dashboard/attendance',
    '/dashboard/reports',
];

// Install event - cache static assets
self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME).then((cache) => {
            return cache.addAll(STATIC_ASSETS);
        })
    );
    self.skipWaiting();
});

// Activate event - cleanup old caches
self.addEventListener('activate', (event) => {
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

// Fetch event - network first with enhanced offline support
self.addEventListener('fetch', (event) => {
    // Skip non-GET requests
    if (event.request.method !== 'GET') return;

    // Skip API requests (always go to network)
    if (event.request.url.includes('/api/')) return;

    // Skip browser extensions and external resources
    if (!event.request.url.startsWith(self.location.origin)) return;

    event.respondWith(
        fetch(event.request)
            .then((response) => {
                // Don't cache non-successful responses
                if (!response.ok) return response;

                // Clone the response for caching
                const responseClone = response.clone();
                caches.open(CACHE_NAME).then((cache) => {
                    cache.put(event.request, responseClone);
                });
                return response;
            })
            .catch(async () => {
                // Network failed, try cache
                const cachedResponse = await caches.match(event.request);
                if (cachedResponse) return cachedResponse;

                // For navigation, return offline page
                if (event.request.mode === 'navigate') {
                    const offlinePage = await caches.match('/offline');
                    if (offlinePage) return offlinePage;
                    return caches.match('/');
                }

                // Return cached homepage as fallback
                return caches.match('/');
            })
    );
});

// ============================================
// PUSH NOTIFICATIONS
// ============================================

self.addEventListener('push', (event) => {
    if (!event.data) return;

    let data;
    try {
        data = event.data.json();
    } catch (e) {
        data = {
            title: 'BH-EDU',
            body: event.data.text(),
        };
    }

    const options = {
        body: data.body || data.message,
        icon: '/icons/icon-192x192.png',
        badge: '/icons/icon-72x72.png',
        vibrate: [100, 50, 100],
        data: {
            url: data.url || '/dashboard',
            dateOfArrival: Date.now(),
        },
        actions: data.actions || [
            { action: 'open', title: 'Mở' },
            { action: 'close', title: 'Đóng' },
        ],
        tag: data.tag || 'default',
        renotify: true,
    };

    event.waitUntil(
        self.registration.showNotification(data.title || 'BH-EDU', options)
    );
});

// Notification click handler
self.addEventListener('notificationclick', (event) => {
    event.notification.close();

    const urlToOpen = event.notification.data?.url || '/dashboard';

    if (event.action === 'close') return;

    event.waitUntil(
        clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
            // If a window is already open, focus it
            for (const client of clientList) {
                if (client.url.includes(self.location.origin) && 'focus' in client) {
                    client.navigate(urlToOpen);
                    return client.focus();
                }
            }
            // Otherwise, open a new window
            if (clients.openWindow) {
                return clients.openWindow(urlToOpen);
            }
        })
    );
});

// ============================================
// BACKGROUND SYNC (for offline actions)
// ============================================

self.addEventListener('sync', (event) => {
    if (event.tag === 'sync-attendance') {
        event.waitUntil(syncAttendance());
    } else if (event.tag === 'sync-grades') {
        event.waitUntil(syncGrades());
    }
});

async function syncAttendance() {
    // Get pending attendance from IndexedDB and sync to server
    console.log('[SW] Syncing attendance data...');
}

async function syncGrades() {
    // Get pending grades from IndexedDB and sync to server
    console.log('[SW] Syncing grades data...');
}

// ============================================
// PERIODIC BACKGROUND SYNC
// ============================================

self.addEventListener('periodicsync', (event) => {
    if (event.tag === 'check-notifications') {
        event.waitUntil(checkForNotifications());
    }
});

async function checkForNotifications() {
    console.log('[SW] Checking for new notifications...');
}

// Log service worker version
console.log('[SW] BH-EDU Service Worker v2.0.0');
