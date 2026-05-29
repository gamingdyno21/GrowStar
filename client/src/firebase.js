/**
 * firebase.js — GrowStar Firebase Initialization
 *
 * Initializes the Firebase app and exports auth utilities
 * used for Phone Number OTP verification in the signup flow.
 *
 * Env vars are read from client/.env via Vite (VITE_ prefix required).
 * The REACT_APP_ prefix vars in .env are kept for reference per user specification.
 */

import { initializeApp, getApps, getApp } from 'firebase/app';
import {
  getAuth,
  RecaptchaVerifier,
  signInWithPhoneNumber,
} from 'firebase/auth';

const firebaseConfig = {
  apiKey:            import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain:        import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId:         import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket:     import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId:             import.meta.env.VITE_FIREBASE_APP_ID,
};

// Guard against multiple Firebase initializations during HMR (hot module reload)
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();

export const auth = getAuth(app);
export { RecaptchaVerifier, signInWithPhoneNumber };
