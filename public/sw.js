// Self-unregistering script to immediately dismantle any legacy Service Worker on client devices
self.addEventListener('install', () => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (key.includes('damoh') || key.includes('workbox') || key.includes('sw-')) {
            return caches.delete(key);
          }
        })
      );
    }).then(() => {
      return self.registration.unregister();
    }).then(() => {
      return self.clients.claim();
    })
  );
});

// No fetch listener: all requests go straight to native HTTP/Express without interception
