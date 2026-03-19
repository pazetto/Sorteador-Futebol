import { initializeApp } from 'firebase/app';
import { getAuth, connectAuthEmulator } from 'firebase/auth';
import { getFirestore, connectFirestoreEmulator } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: process.env.VITE_FIREBASE_API_KEY || 'AIzaSyBQaZdtDji8hduJiAW69ByDV5ma9FFrWXU',
  authDomain: process.env.VITE_FIREBASE_AUTH_DOMAIN || 'sorteador-pazetto.firebaseapp.com',
  projectId: process.env.VITE_FIREBASE_PROJECT_ID || 'sorteador-pazetto',
  storageBucket: process.env.VITE_FIREBASE_STORAGE_BUCKET || 'sorteador-pazetto.firebasestorage.app',
  messagingSenderId: process.env.VITE_FIREBASE_MESSAGING_SENDER_ID || '918022583133',
  appId: process.env.VITE_FIREBASE_APP_ID || '1:918022583133:web:823cd24f19491f50e2aeb4',
};

// Inicializar Firebase
const app = initializeApp(firebaseConfig);

// Inicializar Auth
export const auth = getAuth(app);

// Inicializar Firestore
export const db = getFirestore(app);

export default app;
