import { initializeApp, getApps, getApp } from "firebase/app";
import { 
  getAuth, 
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
  serverTimestamp 
} from "firebase/firestore";
// Default Firebase Configuration
const DEFAULT_FIREBASE_CONFIG = {
  projectId: "damoh-daily-news",
  appId: "1:548384927269:web:5f4fdb181d9218731599cc",
  apiKey: "AIzaSyAqqGLWs0rXdM_Cp2q2HPkDgToASXCCoCM",
  authDomain: "damoh-daily-news.firebaseapp.com",
  firestoreDatabaseId: "(default)",
  storageBucket: "damoh-daily-news.firebasestorage.app",
  messagingSenderId: "548384927269",
  measurementId: "",
  oAuthClientId: "548384927269-600f91bobh1rsb50jn2uqakb228m38mp.apps.googleusercontent.com",
  recaptchaSiteKey: ""
};

// Read Firebase config from environment variables or default config
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || DEFAULT_FIREBASE_CONFIG.apiKey,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || DEFAULT_FIREBASE_CONFIG.authDomain,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || DEFAULT_FIREBASE_CONFIG.projectId,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || DEFAULT_FIREBASE_CONFIG.storageBucket,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || DEFAULT_FIREBASE_CONFIG.messagingSenderId,
  appId: import.meta.env.VITE_FIREBASE_APP_ID || DEFAULT_FIREBASE_CONFIG.appId,
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID || DEFAULT_FIREBASE_CONFIG.measurementId || ""
};

// Initialize Firebase App
const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);

// Initialize Firebase Auth
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();

// Initialize Firestore (using custom database ID if specified in config)
const databaseId = import.meta.env.VITE_FIREBASE_FIRESTORE_DATABASE_ID || DEFAULT_FIREBASE_CONFIG.firestoreDatabaseId;
export const db = databaseId && databaseId !== "(default)" 
  ? getFirestore(app, databaseId) 
  : getFirestore(app);

export type { User };
export { 
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
  serverTimestamp 
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
