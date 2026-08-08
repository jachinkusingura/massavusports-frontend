/**
 * MassavuSports Service Worker
 * Handles push notifications and offline caching.
 */

importScripts('https://cdn.onesignal.com/sdks/web/v16/OneSignalSDK.sw.js');

// ── PUSH EVENT ──────────────────────────────────────────────────────────────
self.addEventListener('push', event => {
    if (!event.data) return;

    let data = {};
    try { data = event.data.json(); } catch (e) { data = { title: 'MassavuSports', body: event.data.text() }; }

    const title = data.title || 'MassavuSports';
    const options = {
        body: data.body || 'New update from MassavuSports!',
        icon: data.icon || '/assets/images/logo.png',
        badge: '/assets/images/logo.png',
        image: data.image || undefined,
        data: { url: data.url || '/', notificationId: data.id },
        actions: [{ action: 'view', title: 'View Update' }],
        requireInteraction: false,
        tag: 'massavu-notif-' + (data.id || Date.now()),
        renotify: true,
    };

    event.waitUntil(self.registration.showNotification(title, options));
});

// ── NOTIFICATION CLICK ───────────────────────────────────────────────────────
self.addEventListener('notificationclick', event => {
    event.notification.close();
    const targetUrl = (event.notification.data && event.notification.data.url) || '/';
    event.waitUntil(
        clients.matchAll({ type: 'window', includeUncontrolled: true }).then(clientList => {
            for (const client of clientList) {
                if (client.url.includes(self.location.origin) && 'focus' in client) {
                    client.navigate(targetUrl);
                    return client.focus();
                }
            }
            if (clients.openWindow) return clients.openWindow(targetUrl);
        })
    );
});

// ── ACTIVATION & CACHE ───────────────────────────────────────────────────────
const CACHE_NAME = 'massavu-v1';
const STATIC_ASSETS = ['/', '/index.html', '/assets/css/style.css', '/assets/images/logo.png'];

self.addEventListener('install', event => {
    event.waitUntil(
        caches.open(CACHE_NAME).then(cache => cache.addAll(STATIC_ASSETS)).catch(() => { })
    );
    self.skipWaiting();
});

self.addEventListener('activate', event => {
    event.waitUntil(
        caches.keys().then(keys =>
            Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))
        )
    );
    self.clients.claim();
});
