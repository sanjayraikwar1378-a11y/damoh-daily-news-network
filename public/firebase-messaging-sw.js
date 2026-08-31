// Firebase Cloud Messaging & Web Push Service Worker for Damoh Daily News Network
// Canonical Single Production Service Worker (Scope: '/')
// Fully self-contained, high-reliability background notification engine

const SW_VERSION = 'v2026.08.31-push-fix';
console.log(`[SW] Initializing Damoh Daily News Service Worker (${SW_VERSION})`);

// 1. Lifecycle - Install: Activate immediately without waiting
self.addEventListener('install', (event) => {
  self.skipWaiting();
});

// 2. Lifecycle - Activate: Claim all clients immediately and clean legacy caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    Promise.all([
      self.clients.claim(),
      'caches' in self ? caches.keys().then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => {
            if (cacheName.includes('damoh') || cacheName.includes('workbox') || cacheName.includes('sw-')) {
              return caches.delete(cacheName);
            }
            return Promise.resolve(false);
          })
        );
      }) : Promise.resolve()
    ])
  );
});

/**
 * Robust notification display logic for all Push payloads (FCM HTTP v1, data-only, or legacy).
 * Always resolves absolute URLs and ensures complete compliance with Android notification tray standards.
 */
async function handleBackgroundPush(event) {
  const origin = self.location ? self.location.origin : 'https://www.damohdailynewsnetwork.in';
  
  let payload = {};
  if (event.data) {
    try {
      payload = event.data.json();
    } catch {
      try {
        const textData = event.data.text();
        payload = {
          data: {
            title: 'दमोह डेली न्यूज़ नेटवर्क',
            body: textData || 'ताज़ा समाचार एवं बड़ी ख़बरें'
          }
        };
      } catch {
        payload = {};
      }
    }
  }

  const data = payload.data || {};
  const notification = payload.notification || {};
  const webpushNotif = payload.webpush?.notification || {};

  // 1. Extract Title & Body
  const title = (
    data.title ||
    webpushNotif.title ||
    notification.title ||
    payload.title ||
    'दमोह डेली न्यूज़ नेटवर्क'
  ).trim();

  const body = (
    data.body ||
    webpushNotif.body ||
    notification.body ||
    payload.body ||
    'ताज़ा समाचार एवं बड़ी ख़बरें'
  ).trim();

  // 2. Extract and resolve target navigation URL
  const rawUrl = 
    data.targetUrl || 
    data.url || 
    (data.articleSlug ? `/article/${data.articleSlug}` : '') || 
    payload.fcmOptions?.link ||
    payload.webpush?.fcm_options?.link ||
    notification.click_action || 
    '/';

  let targetUrl = '/';
  try {
    targetUrl = new URL(rawUrl, origin).href;
  } catch {
    targetUrl = `${origin}/`;
  }

  // 3. Extract and resolve absolute image, icon & badge URLs
  let iconUrl = `${origin}/icon-192-v2.png`;
  let badgeUrl = `${origin}/favicon-32x32-v2.png`;

  let imageUrl = data.imageUrl || data.image || webpushNotif.image || notification.image || payload.image || undefined;
  if (imageUrl) {
    try {
      if (!imageUrl.startsWith('http://') && !imageUrl.startsWith('https://') && !imageUrl.startsWith('data:')) {
        imageUrl = new URL(imageUrl, origin).href;
      }
    } catch {
      // keep original
    }
  }

  // 4. Determine unique tag and priority
  const notifId = data.id || data.tag || payload.fcmMessageId || payload.from || `ddn-${Date.now()}`;
  const tag = data.tag || `ddn-${notifId}`;
  const priority = data.priority || 'normal';
  const isHighPriority = priority === 'urgent' || priority === 'breaking';

  // 5. Construct full standard NotificationOptions for Android system tray
  const notificationOptions = {
    body,
    icon: iconUrl,
    badge: badgeUrl,
    image: imageUrl || undefined,
    tag,
    renotify: true,
    requireInteraction: isHighPriority,
    vibrate: [200, 100, 200, 100, 200],
    data: {
      url: targetUrl,
      id: notifId,
      tag,
      priority,
      timestamp: Date.now()
    },
    actions: [
      { action: 'open', title: 'पूरा पढ़ें (Read)' },
      { action: 'close', title: 'बंद करें (Dismiss)' }
    ]
  };

  console.log(`[SW] Displaying background notification: "${title}" (tag: ${tag})`);
  return self.registration.showNotification(title, notificationOptions);
}

// 3. Native Universal Push Event Handler (Universal Android Background Web Push Handler)
self.addEventListener('push', (event) => {
  console.log('[SW] Push event received in Service Worker');
  event.waitUntil(handleBackgroundPush(event));
});

// 4. Handle Notification Click & Window Focusing / Navigation
self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  if (event.action === 'close') {
    return;
  }

  const rawUrl = event.notification.data?.url || '/';
  const origin = self.location ? self.location.origin : 'https://www.damohdailynewsnetwork.in';
  let targetUrl = rawUrl;
  try {
    targetUrl = new URL(rawUrl, origin).href;
  } catch {
    targetUrl = `${origin}/`;
  }

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((windowClients) => {
      // If a tab/PWA window is already open on this origin, focus and navigate it
      for (const client of windowClients) {
        if (client.url && client.url.includes(origin) && 'focus' in client) {
          if ('navigate' in client) {
            return client.navigate(targetUrl).then((navigatedClient) => {
              return (navigatedClient || client).focus();
            }).catch(() => {
              return client.focus();
            });
          }
          return client.focus();
        }
      }
      // Otherwise open a fresh window/tab
      if (clients.openWindow) {
        return clients.openWindow(targetUrl);
      }
    })
  );
});

// 5. Handle Notification Dismissal
self.addEventListener('notificationclose', (event) => {
  console.log('[SW] Notification closed by user:', event.notification.tag);
});

