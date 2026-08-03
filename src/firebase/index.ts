// src/firebase.ts
import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

const firebaseConfig = {
  apiKey: "AIzaSyAh4JMZO6t8QniFqV76FrIPQwtOhm3i1go",
  authDomain: "test-firebase-f3272.firebaseapp.com",
  projectId: "test-firebase-f3272",
  storageBucket: "test-firebase-f3272.firebasestorage.app",
  messagingSenderId: "83065640460",
  appId: "1:83065640460:web:607d60ff3828c613fa8029",
  measurementId: "G-7YY4ZBVD58"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);
