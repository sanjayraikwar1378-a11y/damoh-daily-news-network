import { initializeApp, getApps, getApp } from "firebase/app";
import { 
  getAuth, 
  setPersistence,
  browserSessionPersistence,
  browserLocalPersistence,
  inMemoryPersistence,
  signInWithEmailAndPassword, 
  signOut, 
  onAuthStateChanged,
  GoogleAuthProvider,
  signInWithPopup,
  getAdditionalUserInfo,
  deleteUser,
  User 
} from "firebase/auth";
import { 
  getFirestore, 
  initializeFirestore,
  collection, 
  doc, 
  getDocs, 
  getDoc, 
  setDoc, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  onSnapshot, 
  query, 
  orderBy, 
  where,
  limit,
  startAfter,
  serverTimestamp 
} from "firebase/firestore";
import { 
  getMessaging, 
  getToken, 
  onMessage, 
  isSupported as isMessagingSupported,
  Messaging
} from "firebase/messaging";
import { getServiceWorkerRegistration } from "./serviceWorker";

// Read Firebase config from environment variables or project defaults
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "AIzaSyAqqGLWs0rXdM_Cp2q2HPkDgToASXCCoCM",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "damoh-daily-news.firebaseapp.com",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "damoh-daily-news",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "damoh-daily-news.firebasestorage.app",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "548384927269",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "1:548384927269:web:5f4fdb181d9218731599cc",
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID || ""
};

// Initialize Firebase App
export const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);

// Initialize Firebase Auth
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();

// Enforce session-based persistence for Firebase Auth on web clients
if (typeof window !== "undefined") {
  setPersistence(auth, browserSessionPersistence).catch((err) => {
    console.warn("Could not set session persistence for Firebase Auth:", err);
  });
}

// Initialize Firestore with auto-detect long-polling for network resilience
const databaseId = import.meta.env.VITE_FIREBASE_FIRESTORE_DATABASE_ID || "(default)";
const firestoreSettings = {
  experimentalAutoDetectLongPolling: true
};

let firestoreInstance;
try {
  firestoreInstance = databaseId && databaseId !== "(default)"
    ? initializeFirestore(app, firestoreSettings, databaseId)
    : initializeFirestore(app, firestoreSettings);
} catch {
  firestoreInstance = databaseId && databaseId !== "(default)"
    ? getFirestore(app, databaseId)
    : getFirestore(app);
}

export const db = firestoreInstance;

// Lazy singleton for Firebase Messaging
let messagingInstance: Messaging | null = null;
let messagingCheckDone = false;

/**
 * Returns Firebase Messaging instance safely in supported browser environments
 */
export async function getFirebaseMessaging(): Promise<Messaging | null> {
  if (typeof window === "undefined") return null;
  if (messagingCheckDone) return messagingInstance;

  try {
    const supported = await isMessagingSupported();
    if (supported) {
      messagingInstance = getMessaging(app);
      console.log("[FCM] Firebase Cloud Messaging client initialized successfully");
    } else {
      console.warn("[FCM] Firebase Messaging is not supported in this browser environment");
    }
  } catch (err) {
    console.warn("[FCM] Firebase Messaging check warning:", err);
  }

  messagingCheckDone = true;
  return messagingInstance;
}

/**
 * Requests an FCM Registration Token for the current browser/PWA device
 * and saves it into Firestore fcm_tokens collection.
 */
export async function registerFCMDevice(customSwReg?: ServiceWorkerRegistration): Promise<string | null> {
  if (typeof window === "undefined" || !("Notification" in window)) {
    return null;
  }
  if (Notification.permission !== "granted") {
    console.log("[FCM] Notification permission not granted yet");
    return null;
  }

  try {
    const messaging = await getFirebaseMessaging();
    if (!messaging) {
      return null;
    }

    const swRegistration = customSwReg || (await getServiceWorkerRegistration());
    if (!swRegistration) {
      console.warn("[FCM] Active Service Worker registration required for push token generation");
      return null;
    }

    const vapidKey = import.meta.env.VITE_FIREBASE_VAPID_KEY || undefined;

    const token = await getToken(messaging, {
      vapidKey,
      serviceWorkerRegistration: swRegistration
    });

    if (!token) {
      console.warn("[FCM] No FCM registration token returned from Firebase");
      return null;
    }

    console.log(`[FCM] Successfully obtained device registration token (${token.slice(0, 12)}...)`);

    // Generate safe Firestore Document ID for this token
    const safeDocId = token.replace(/[\.\#\$\[\]\/]/g, "_").slice(0, 120);
    const isAndroid = /android/i.test(navigator.userAgent);
    const isIos = /iphone|ipad|ipod/i.test(navigator.userAgent);
    const platform = isAndroid ? "android" : isIos ? "ios" : "web";

    await setDoc(doc(db, "fcm_tokens", safeDocId), {
      token,
      userAgent: navigator.userAgent,
      platform,
      active: true,
      updatedAt: new Date().toISOString(),
      subscribedAt: new Date().toISOString()
    }, { merge: true });

    console.log("[FCM] Device token registered to Firestore fcm_tokens collection");
    return token;
  } catch (err) {
    console.warn("[FCM] Device registration token generation error:", err);
    return null;
  }
}

export type { User };
export { 
  setPersistence,
  browserSessionPersistence,
  browserLocalPersistence,
  inMemoryPersistence,
  signInWithEmailAndPassword, 
  signOut, 
  onAuthStateChanged, 
  signInWithPopup,
  getAdditionalUserInfo,
  deleteUser,
  collection, 
  doc, 
  getDocs, 
  getDoc, 
  setDoc, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  onSnapshot, 
  query, 
  orderBy, 
  where,
  limit,
  startAfter,
  serverTimestamp,
  getToken,
  onMessage,
  isMessagingSupported
};

/**
 * Recursively cleans any object or array before writing to Firestore:
 * - Strips all `undefined` values so setDoc/updateDoc never fails.
 * - Converts empty or whitespace optional strings (e.g. `scheduledAt`, `youtubeUrl`, `subCategory`) to `null`.
 * - Ensures all data is clean, safe, and valid for Firestore serialization.
 */
export function sanitizeFirestoreData<T>(data: T): T {
  if (data === null || data === undefined) {
    return null as unknown as T;
  }
  if (Array.isArray(data)) {
    return data
      .filter(item => item !== undefined)
      .map(item => sanitizeFirestoreData(item)) as unknown as T;
  }
  if (typeof data === "object" && !(data instanceof Date)) {
    const cleaned: Record<string, any> = {};
    for (const [key, value] of Object.entries(data)) {
      if (value === undefined) {
        continue;
      }
      if (typeof value === "string") {
        if (key === "scheduledAt" || key === "youtubeUrl" || key === "subCategory") {
          if (!value.trim()) {
            cleaned[key] = null;
            continue;
          }
        }
        cleaned[key] = value;
      } else if (value === null) {
        cleaned[key] = null;
      } else if (typeof value === "object") {
        cleaned[key] = sanitizeFirestoreData(value);
      } else {
        cleaned[key] = value;
      }
    }
    return cleaned as T;
  }
  return data;
}
