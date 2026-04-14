// Service Worker for AquaTrack PWA
const CACHE_VERSION = 'v1.0.0';
const CACHE_NAME = `aquatrack-${CACHE_VERSION}`;

// Assets to cache
const STATIC_ASSETS = [
    '/',
    '/index.html',
    '/css/styles.css',
    '/js/config.js',
    '/js/utils.js',
    '/js/errors.js',
    '/js/storage.js',
    '/js/analytics.js',
    '/js/reminders.js',
    '/js/ui.js',
    '/js/app.js',
    '/manifest.json',
    '/assets/icons/icon-192.png',
    '/assets/icons/icon-512.png'
];

// Install event - cache static assets
self.addEventListener('install', (event) => {
    console.log('[Service Worker] Installing...');

    event.waitUntil(
        caches.open(CACHE_NAME)
            .then((cache) => {
                console.log('[Service Worker] Caching static assets');
                return cache.addAll(STATIC_ASSETS);
            })
            .then(() => {
                console.log('[Service Worker] Skip waiting');
                return self.skipWaiting();
            })
            .catch((error) => {
                console.error('[Service Worker] Installation failed:', error);
            })
    );
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
    console.log('[Service Worker] Activating...');

    event.waitUntil(
        caches.keys()
            .then((cacheNames) => {
                return Promise.all(
                    cacheNames
                        .filter((cacheName) => {
                            // Delete old caches
                            return cacheName.startsWith('aquatrack-') && cacheName !== CACHE_NAME;
                        })
                        .map((cacheName) => {
                            console.log('[Service Worker] Deleting old cache:', cacheName);
                            return caches.delete(cacheName);
                        })
                );
            })
            .then(() => {
                console.log('[Service Worker] Claiming clients');
                return self.clients.claim();
            })
    );
});

// Fetch event - serve from cache with network fallback
self.addEventListener('fetch', (event) => {
    const { request } = event;
    const url = new URL(request.url);

    // Skip cross-origin requests
    if (url.origin !== location.origin) {
        return;
    }

    event.respondWith(
        caches.match(request)
            .then((cachedResponse) => {
                if (cachedResponse) {
                    // Return cached response and update cache in background
                    event.waitUntil(
                        fetch(request)
                            .then((networkResponse) => {
                                return caches.open(CACHE_NAME)
                                    .then((cache) => {
                                        cache.put(request, networkResponse.clone());
                                        return networkResponse;
                                    });
                            })
                            .catch(() => {
                                // Network failed, but we have cache
                                return cachedResponse;
                            })
                    );

                    return cachedResponse;
                }

                // Not in cache, fetch from network
                return fetch(request)
                    .then((networkResponse) => {
                        // Cache successful responses
                        if (networkResponse && networkResponse.status === 200) {
                            const responseToCache = networkResponse.clone();
                            caches.open(CACHE_NAME)
                                .then((cache) => {
                                    cache.put(request, responseToCache);
                                });
                        }
                        return networkResponse;
                    })
                    .catch((error) => {
                        console.error('[Service Worker] Fetch failed:', error);

                        // Return offline page for navigation requests
                        if (request.mode === 'navigate') {
                            return caches.match('/index.html');
                        }

                        throw error;
                    });
            })
    );
});

// Message event - handle messages from clients
self.addEventListener('message', (event) => {
    if (event.data && event.data.type === 'SKIP_WAITING') {
        self.skipWaiting();
    }
});

// Background sync (future feature)
self.addEventListener('sync', (event) => {
    if (event.tag === 'sync-data') {
        event.waitUntil(syncData());
    }
});

async function syncData() {
    // Placeholder for future backend sync
    console.log('[Service Worker] Background sync triggered');
}

// Push notification (future feature)
self.addEventListener('push', (event) => {
    const options = {
        body: event.data ? event.data.text() : 'Time to hydrate!',
        icon: '/assets/icons/icon-192.png',
        badge: '/assets/icons/icon-72.png',
        vibrate: [200, 100, 200],
        data: {
            dateOfArrival: Date.now(),
            primaryKey: 1
        }
    };

    event.waitUntil(
        self.registration.showNotification('AquaTrack Reminder', options)
    );
});

// Notification click
self.addEventListener('notificationclick', (event) => {
    event.notification.close();

    event.waitUntil(
        clients.openWindow('/')
    );
});
