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
  where,
  serverTimestamp 
} from "firebase/firestore";
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
const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);

// Initialize Firebase Auth
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();

// Initialize Firestore (using custom database ID if specified in config)
const databaseId = import.meta.env.VITE_FIREBASE_FIRESTORE_DATABASE_ID || "(default)";
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
  where,
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
