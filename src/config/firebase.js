// src/config/firebase.js

import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getDatabase } from "firebase/database";
import { getFirestore } from "firebase/firestore";
import { getFunctions, httpsCallable } from "firebase/functions";

// Firebase 설정
// 프로젝트 ID: countmeout-21e99
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "AIzaSyBL1WIeuLWSs3ndccfENUCVwrZfOKajCM4",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "countmeout-21e99.firebaseapp.com",
  databaseURL: import.meta.env.VITE_FIREBASE_DATABASE_URL || "https://countmeout-21e99-default-rtdb.asia-northeast3.firebasedatabase.app", // Realtime Database URL
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "countmeout-21e99",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "countmeout-21e99.firebasestorage.app",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "49201492896",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "1:49201492896:web:91623f39b684c2cc872ac5",
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID || "G-P738QD7N8X", // Analytics (선택사항)
};

// Firebase 초기화
const app = initializeApp(firebaseConfig);

// Firebase 서비스 초기화
export const auth = getAuth(app);
export const firestore = getFirestore(app);
export const functions = getFunctions(app);

// Realtime Database 초기화
export const database = getDatabase(app);

export default app;

