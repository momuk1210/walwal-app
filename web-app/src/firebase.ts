import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

// Real Firebase config for walwal-app
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "AIzaSyCCEqipAxHJ4iaqGuBucLKonQEA1KnFuLI",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "walwal-app.firebaseapp.com",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "walwal-app",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "walwal-app.firebasestorage.app",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "689075476335",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "1:689075476335:web:1fd0eabd311b487e3cfa9a",
  measurementId: "G-LF1YSFWX2G"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);
