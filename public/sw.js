// Migration & Cleanup Service Worker for legacy /sw.js registrations
// This ensures any browser holding a cached registration for /sw.js unregisters it immediately and cleanly.

self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    self.registration.unregister().then(() => {
      return self.clients.claim();
    })
  );
});
