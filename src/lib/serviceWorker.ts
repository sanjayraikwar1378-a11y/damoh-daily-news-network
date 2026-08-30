// Centralized Service Worker Registration & Management for Damoh Daily News Network
// Canonical Single Production Service Worker: /firebase-messaging-sw.js (Scope: '/')

const CANONICAL_SW_PATH = '/firebase-messaging-sw.js';
const CANONICAL_SW_SCOPE = '/';

let swRegistrationPromise: Promise<ServiceWorkerRegistration | null> | null = null;

/**
 * Purge any legacy/obsolete caches from previous versions or PWA libraries (e.g., workbox)
 */
export async function purgeLegacyCaches(): Promise<void> {
  if (typeof window === 'undefined' || !('caches' in window)) return;
  try {
    const keys = await caches.keys();
    await Promise.all(
      keys.map((key) => {
        if (key.includes('damoh') || key.includes('workbox') || key.includes('sw-')) {
          return caches.delete(key);
        }
        return Promise.resolve(false);
      })
    );
  } catch (err) {
    console.warn('[SW] Legacy cache purge warning:', err);
  }
}

/**
 * Unregister any non-canonical or obsolete Service Workers that might have been registered in the past.
 */
export async function unregisterObsoleteServiceWorkers(): Promise<void> {
  if (typeof window === 'undefined' || !('serviceWorker' in navigator)) return;
  try {
    const registrations = await navigator.serviceWorker.getRegistrations();
    for (const registration of registrations) {
      const scriptUrl =
        registration.active?.scriptURL ||
        registration.installing?.scriptURL ||
        registration.waiting?.scriptURL ||
        '';

      if (scriptUrl && !scriptUrl.includes(CANONICAL_SW_PATH)) {
        console.log('[SW] Unregistering obsolete Service Worker:', scriptUrl);
        await registration.unregister().catch(() => {});
      }
    }
  } catch (err) {
    console.warn('[SW] Obsolete Service Worker cleanup warning:', err);
  }
}

/**
 * Initializes and registers the canonical production Service Worker (/firebase-messaging-sw.js).
 * Returns the singleton ServiceWorkerRegistration promise.
 */
export function initServiceWorker(): Promise<ServiceWorkerRegistration | null> {
  if (typeof window === 'undefined' || !('serviceWorker' in navigator)) {
    return Promise.resolve(null);
  }

  if (!swRegistrationPromise) {
    swRegistrationPromise = (async () => {
      try {
        // Step 1: Cleanup obsolete workers and legacy caches
        await unregisterObsoleteServiceWorkers();
        await purgeLegacyCaches();

        // Step 2: Register canonical service worker
        const registration = await navigator.serviceWorker.register(CANONICAL_SW_PATH, {
          scope: CANONICAL_SW_SCOPE,
        });

        console.log('[SW] Canonical Service Worker registered successfully on scope:', registration.scope);
        return registration;
      } catch (err) {
        console.warn('[SW] Canonical Service Worker registration failed:', err);
        return null;
      }
    })();
  }

  return swRegistrationPromise;
}

/**
 * Returns the active ServiceWorkerRegistration if registered.
 */
export function getServiceWorkerRegistration(): Promise<ServiceWorkerRegistration | null> {
  return initServiceWorker();
}
