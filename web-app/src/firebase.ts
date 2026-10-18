import { initializeApp, getApps } from "firebase/app";
import { getAuth } from "firebase/auth";
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
export const db = getFirestore(dbApp);
export const storage = getStorage(dbApp);

