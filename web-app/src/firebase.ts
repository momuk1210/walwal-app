import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

// Real Firebase config for walwal-app
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "AIzaSyCEb71Y1DS2C8m0WpWif-LRxAIME-Z1VhU",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "walwal-59c61.firebaseapp.com",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "walwal-59c61",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "walwal-59c61.firebasestorage.app",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "49008197937",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "1:49008197937:web:8bb1c84d7a3fe56b69b010",
  measurementId: "G-LF1YSFWX2G"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);
