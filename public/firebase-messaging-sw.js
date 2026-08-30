// Firebase Cloud Messaging & Push Service Worker for Damoh Daily News Network
// Canonical Single Production Service Worker (Scope: '/')

importScripts('https://www.gstatic.com/firebasejs/9.23.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/9.23.0/firebase-messaging-compat.js');

// Initialize Firebase compat inside Service Worker
const firebaseConfig = {
  apiKey: "AIzaSyAqqGLWs0rXdM_Cp2q2HPkDgToASXCCoCM",
  authDomain: "damoh-daily-news.firebaseapp.com",
  projectId: "damoh-daily-news",
  storageBucket: "damoh-daily-news.firebasestorage.app",
  messagingSenderId: "548384927269",
  appId: "1:548384927269:web:5f4fdb181d9218731599cc"
};

firebase.initializeApp(firebaseConfig);

let messaging = null;
try {
  if (firebase.messaging.isSupported()) {
    messaging = firebase.messaging();
  }
} catch (e) {
  console.warn('[SW] Firebase Messaging initialization warning:', e);
}

// 1. Lifecycle - Install: skip waiting immediately
self.addEventListener('install', (event) => {
  self.skipWaiting();
});

// 2. Lifecycle - Activate: claim clients immediately and purge any legacy caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    Promise.all([
      self.clients.claim(),
      // Purge any legacy/obsolete caches to guarantee fresh SSR, hydration & assets
      'caches' in self ? caches.keys().then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => {
            if (cacheName.includes('damoh') || cacheName.includes('workbox') || cacheName.includes('sw-')) {
              return caches.delete(cacheName);
            }
          })
        );
      }) : Promise.resolve()
    ])
  );
});

// 3. Handle Firebase Cloud Messaging Background Messages
if (messaging) {
  messaging.onBackgroundMessage((payload) => {
    const notificationTitle = payload.notification?.title || payload.data?.title || 'दमोह डेली न्यूज़ नेटवर्क';
    const notificationBody = payload.notification?.body || payload.data?.body || 'ताज़ा समाचार एवं अपडेट्स';
    const targetUrl = payload.data?.url || payload.data?.targetUrl || (payload.data?.articleSlug ? `/article/${payload.data.articleSlug}` : '/');
    const imageUrl = payload.notification?.image || payload.data?.imageUrl || payload.data?.image || undefined;

    const notificationOptions = {
      body: notificationBody,
      icon: '/icon-192-v2.png',
      badge: '/favicon-32x32-v2.png',
      image: imageUrl,
      tag: payload.data?.tag || `ddn-${Date.now()}`,
      renotify: true,
      data: {
        url: targetUrl
      },
      actions: [
        { action: 'open', title: 'पूरा पढ़ें (Read Article)' },
        { action: 'close', title: 'बंद करें (Dismiss)' }
      ]
    };

    return self.registration.showNotification(notificationTitle, notificationOptions);
  });
}

// 4. Fallback Standard Push Event Handler (for direct Web Push or non-FCM payloads)
self.addEventListener('push', (event) => {
  if (!event.data) return;

  try {
    const payload = event.data.json();
    // If payload is already handled by FCM onBackgroundMessage, prevent duplicate
    if (payload.fcmMessageId || payload.from) {
      return;
    }

    const title = payload.title || payload.notification?.title || 'दमोह डेली न्यूज़ नेटवर्क';
    const body = payload.body || payload.notification?.body || 'ताज़ा समाचार एवं अपडेट्स';
    const targetUrl = payload.url || payload.targetUrl || payload.data?.url || '/';
    const imageUrl = payload.imageUrl || payload.image || payload.notification?.image || undefined;

    const options = {
      body: body,
      icon: '/icon-192-v2.png',
      badge: '/favicon-32x32-v2.png',
      image: imageUrl,
      tag: payload.tag || 'damoh-daily-news',
      renotify: true,
      data: {
        url: targetUrl
      },
      actions: [
        { action: 'open', title: 'पूरा पढ़ें (Read Article)' },
        { action: 'close', title: 'बंद करें (Dismiss)' }
      ]
    };

    event.waitUntil(self.registration.showNotification(title, options));
  } catch (err) {
    const text = event.data.text();
    event.waitUntil(
      self.registration.showNotification('दमोह डेली न्यूज़', {
        body: text,
        icon: '/icon-192-v2.png',
        badge: '/favicon-32x32-v2.png',
        data: { url: '/' }
      })
    );
  }
});

// 5. Handle Notification Click & Window Focusing / Navigation
self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  if (event.action === 'close') {
    return;
  }

  const targetUrl = event.notification.data?.url || '/';

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((windowClients) => {
      // If a tab is already open on this origin, focus and navigate it
      for (const client of windowClients) {
        if (client.url.includes(self.location.origin) && 'focus' in client) {
          if ('navigate' in client) {
            client.navigate(targetUrl);
          }
          return client.focus();
        }
      }
      // Otherwise open a new window/tab
      if (clients.openWindow) {
        return clients.openWindow(targetUrl);
      }
    })
  );
});

// NOTE: No fetch event listener is registered to guarantee zero network latency,
// direct network passthrough for SSR/hydration, and complete prevention of stale caching.
