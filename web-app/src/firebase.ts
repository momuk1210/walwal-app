import { initializeApp, getApps } from "firebase/app";
import { getAuth, onAuthStateChanged, signInAnonymously } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

// Real Firebase config for walwal-app (Used for Auth domain & Hosting)
const authConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "AIzaSyCCEqipAxHJ4iaqGuBucLKonQEA1KnFuLI",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "walwal-app.firebaseapp.com",
  projectId: "walwal-app",
  storageBucket: "walwal-app.firebasestorage.app",
  messagingSenderId: "689075476335",
  appId: "1:689075476335:web:1fd0eabd311b487e3cfa9a",
  measurementId: "G-LF1YSFWX2G"
};

// Database & Storage config (Active Cloud Firestore database on walwal-59c61)
const dbConfig = {
  apiKey: "AIzaSyCEb71Y1DS2C8m0WpWif-LRxAIME-Z1VhU",
  authDomain: "walwal-59c61.firebaseapp.com",
  projectId: "walwal-59c61",
  storageBucket: "walwal-59c61.firebasestorage.app",
  messagingSenderId: "49008197937",
  appId: "1:49008197937:web:8de3f2b80456fc55e9754f"
};

// Initialize default app for Auth
const app = getApps().length > 0 ? getApps()[0] : initializeApp(authConfig);
export const auth = getAuth(app);

// Initialize database app for Cloud Firestore & Storage
const dbApp = getApps().find(a => a.name === 'dbApp') || initializeApp(dbConfig, 'dbApp');
export const dbAuth = getAuth(dbApp);
export const db = getFirestore(dbApp);
export const storage = getStorage(dbApp);

// Ensure dbApp has an authenticated session on walwal-59c61 so Firestore rules (request.auth != null) pass
let dbAuthPromise: Promise<void> | null = null;
export const ensureDbAuth = (): Promise<void> => {
  if (dbAuth.currentUser) return Promise.resolve();
  if (dbAuthPromise) return dbAuthPromise;

  dbAuthPromise = new Promise<void>((resolve) => {
    const timer = setTimeout(() => resolve(), 3500);
    const unsub = onAuthStateChanged(dbAuth, async (user) => {
      unsub();
      if (user) {
        clearTimeout(timer);
        resolve();
        return;
      }
      try {
        await signInAnonymously(dbAuth);
      } catch (e) {
        console.warn('dbAuth sign-in warning:', e);
      } finally {
        clearTimeout(timer);
        resolve();
      }
    });
  });

  return dbAuthPromise;
};

// Environment Detection: Local development (localhost) vs Production (walwal-app.web.app, PWA, Android TWA, iOS)
export const isLocalDev = Boolean(
  typeof window !== 'undefined' && (
    window.location.hostname === 'localhost' ||
    window.location.hostname === '127.0.0.1' ||
    window.location.hostname.endsWith('.local')
  )
);

// Unified collection router:
// Points directly to real Cloud Firestore collections across all environments
export const COLLECTIONS = {
  POSTS: 'posts',
  DOGS: 'dogs',
  USERS: 'users',
  MEETUPS: 'meetups',
  NOTICES: 'notices',
  REPORTS: 'reports',
  FEEDBACK: 'feedback',
};

// Unified local storage keys:
export const STORAGE_KEYS = {
  SNAPS_POSTS: 'WALWAL_USER_SNAPS_POSTS',
  FEED_POSTS: 'WALWAL_USER_FEED_POSTS',
  DELETED_POST_IDS: 'WALWAL_DELETED_POST_IDS',
  MY_POST_IDS: 'WALWAL_MY_POST_IDS',
};



