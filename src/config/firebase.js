// src/config/firebase.js

import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getDatabase } from "firebase/database";
import { getFirestore } from "firebase/firestore";
import { getFunctions, httpsCallable } from "firebase/functions";

// Firebase 설정
// 모든 설정값은 환경 변수에서 가져옵니다 (.env 파일)
// 보안을 위해 하드코딩된 값은 사용하지 않습니다.

const requiredEnvVars = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  databaseURL: import.meta.env.VITE_FIREBASE_DATABASE_URL,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

// 필수 환경 변수 확인
const envVarNames = {
  apiKey: 'VITE_FIREBASE_API_KEY',
  authDomain: 'VITE_FIREBASE_AUTH_DOMAIN',
  databaseURL: 'VITE_FIREBASE_DATABASE_URL',
  projectId: 'VITE_FIREBASE_PROJECT_ID',
  storageBucket: 'VITE_FIREBASE_STORAGE_BUCKET',
  messagingSenderId: 'VITE_FIREBASE_MESSAGING_SENDER_ID',
  appId: 'VITE_FIREBASE_APP_ID',
};

const missingVars = Object.entries(requiredEnvVars)
  .filter(([key, value]) => !value)
  .map(([key]) => envVarNames[key]);

if (missingVars.length > 0) {
  throw new Error(
    `Firebase 설정 오류: 다음 환경 변수가 설정되지 않았습니다:\n${missingVars.join('\n')}\n\n.env 파일을 생성하고 필요한 환경 변수를 설정해주세요.`
  );
}

const firebaseConfig = {
  apiKey: requiredEnvVars.apiKey,
  authDomain: requiredEnvVars.authDomain,
  databaseURL: requiredEnvVars.databaseURL,
  projectId: requiredEnvVars.projectId,
  storageBucket: requiredEnvVars.storageBucket,
  messagingSenderId: requiredEnvVars.messagingSenderId,
  appId: requiredEnvVars.appId,
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID, // Analytics (선택사항)
};

// Firebase 초기화
const app = initializeApp(firebaseConfig);

// 디버깅: databaseURL 확인
console.log("Firebase databaseURL:", firebaseConfig.databaseURL);
console.log("Firebase databaseURL 길이:", firebaseConfig.databaseURL?.length);
console.log("Firebase databaseURL 끝:", firebaseConfig.databaseURL?.slice(-10));

// Firebase 서비스 초기화
export const auth = getAuth(app);
export const firestore = getFirestore(app);
export const functions = getFunctions(app);

// Realtime Database 초기화
// Firebase v9+에서는 getDatabase(app)만 사용하면 자동으로 firebaseConfig에서 databaseURL을 가져옵니다
export const database = getDatabase(app);

export default app;

