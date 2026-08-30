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

try {
  if (!firebase.apps.length) {
    firebase.initializeApp(firebaseConfig);
  }
} catch (e) {
  console.warn('[SW] Firebase initializeApp warning:', e);
}

let messaging = null;
try {
  if (firebase.messaging && firebase.messaging.isSupported()) {
    messaging = firebase.messaging();
  }
} catch (e) {
  console.warn('[SW] Firebase Messaging initialization warning:', e);
}

// In-memory deduplication set to avoid duplicate notifications when both
// Firebase onBackgroundMessage and native push event fire within short interval.
const recentNotificationMap = new Map();

function isDuplicateNotification(uniqueId) {
  if (!uniqueId) return false;
  const now = Date.now();
  if (recentNotificationMap.has(uniqueId)) {
    const timestamp = recentNotificationMap.get(uniqueId);
    if (now - timestamp < 8000) { // 8 seconds window
      return true;
    }
  }
  recentNotificationMap.set(uniqueId, now);

  // Prune older entries
  if (recentNotificationMap.size > 100) {
    for (const [key, time] of recentNotificationMap.entries()) {
      if (now - time > 60000) {
        recentNotificationMap.delete(key);
      }
    }
  }
  return false;
}

/**
 * Robust notification display logic for both FCM and direct Push payloads.
 * Always resolves absolute URLs and ensures compliance with Android notification tray standards.
 */
async function displayNotificationFromPayload(payload) {
  if (!payload) return;

  const data = payload.data || {};
  const notification = payload.notification || {};
  const origin = self.location ? self.location.origin : '';

  // 1. Extract Title & Body
  const title = (
    data.title ||
    notification.title ||
    payload.title ||
    'दमोह डेली न्यूज़ नेटवर्क'
  ).trim();

  const body = (
    data.body ||
    notification.body ||
    payload.body ||
    'ताज़ा समाचार एवं बड़ी ख़बरें'
  ).trim();

  // 2. Extract and resolve target navigation URL
  const rawUrl = data.url || data.targetUrl || (data.articleSlug ? `/article/${data.articleSlug}` : '/') || notification.click_action || '/';
  let targetUrl = rawUrl;
  try {
    targetUrl = new URL(rawUrl, origin).href;
  } catch {
    targetUrl = origin ? `${origin}/` : '/';
  }

  // 3. Extract and resolve absolute image, icon & badge URLs
  let iconUrl = '/icon-192-v2.png';
  let badgeUrl = '/favicon-32x32-v2.png';
  try {
    iconUrl = new URL('/icon-192-v2.png', origin).href;
    badgeUrl = new URL('/favicon-32x32-v2.png', origin).href;
  } catch {
    // fallback to relative if URL constructor fails
  }

  let imageUrl = data.imageUrl || data.image || notification.image || payload.image || undefined;
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
  const tag = data.tag || `ddn-${data.id || notifId}`;
  const priority = data.priority || 'normal';
  const isHighPriority = priority === 'urgent' || priority === 'breaking';

  // 5. Construct full standard NotificationOptions
  const notificationOptions = {
    body,
    icon: iconUrl,
    badge: badgeUrl,
    image: imageUrl || undefined,
    tag,
    renotify: true,
    requireInteraction: isHighPriority,
    vibrate: [200, 100, 200],
    data: {
      url: targetUrl,
      id: notifId,
      tag,
      priority,
      timestamp: Date.now()
    },
    actions: [
      { action: 'open', title: 'पूरा पढ़ें (Read Article)' },
      { action: 'close', title: 'बंद करें (Dismiss)' }
    ]
  };

  console.log(`[SW] Displaying background notification: "${title}" (tag: ${tag})`);
  return self.registration.showNotification(title, notificationOptions);
}

// 1. Lifecycle - Install: skip waiting immediately
self.addEventListener('install', (event) => {
  self.skipWaiting();
});

// 2. Lifecycle - Activate: claim clients immediately and purge legacy caches
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
          })
        );
      }) : Promise.resolve()
    ])
  );
});

// 3. Handle Firebase Cloud Messaging Background Messages (Firebase Web SDK)
if (messaging) {
  try {
    messaging.onBackgroundMessage((payload) => {
      console.log('[SW] Firebase onBackgroundMessage event:', payload);
      const uniqueKey = payload.data?.id || payload.data?.tag || payload.fcmMessageId || `fcm_${payload.data?.title || ''}_${payload.data?.body || ''}`;
      if (isDuplicateNotification(uniqueKey)) {
        console.log('[SW] onBackgroundMessage already handled, avoiding duplicate');
        return Promise.resolve();
      }
      return displayNotificationFromPayload(payload);
    });
  } catch (err) {
    console.warn('[SW] Error attaching onBackgroundMessage:', err);
  }
}

// 4. Native Push Event Handler (Universal Android Background Web Push Handler)
self.addEventListener('push', (event) => {
  console.log('[SW] Native push event received');
  if (!event.data) {
    console.warn('[SW] Push event with empty payload');
    return;
  }

  event.waitUntil(
    (async () => {
      let payload;
      try {
        payload = event.data.json();
      } catch (err) {
        payload = {
          data: {
            title: 'दमोह डेली न्यूज़',
            body: event.data.text() || 'ताज़ा समाचार'
          }
        };
      }

      // Check deduplication
      const data = payload.data || {};
      const notif = payload.notification || {};
      const uniqueKey = data.id || data.tag || payload.fcmMessageId || `push_${data.title || notif.title || ''}_${data.body || notif.body || ''}`;

      if (isDuplicateNotification(uniqueKey)) {
        console.log('[SW] Push event already displayed, skipping duplicate');
        return;
      }

      await displayNotificationFromPayload(payload);
    })()
  );
});

// 5. Handle Notification Click & Window Focusing / Navigation
self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  if (event.action === 'close') {
    return;
  }

  const rawUrl = event.notification.data?.url || '/';
  const origin = self.location ? self.location.origin : '';
  let targetUrl = rawUrl;
  try {
    targetUrl = new URL(rawUrl, origin).href;
  } catch {
    targetUrl = origin ? `${origin}/` : '/';
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

// 6. Handle Notification Dismissal
self.addEventListener('notificationclose', (event) => {
  console.log('[SW] Notification closed by user:', event.notification.tag);
});
