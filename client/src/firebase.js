import { getApp, getApps, initializeApp } from 'firebase/app';
import {
  getAuth,
  GoogleAuthProvider,
  RecaptchaVerifier,
  signInWithPhoneNumber,
  signInWithPopup,
  signOut,
} from 'firebase/auth';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

export const isFirebaseConfigured = [
  firebaseConfig.apiKey,
  firebaseConfig.authDomain,
  firebaseConfig.projectId,
  firebaseConfig.appId,
].every(Boolean);

function firebaseAuth() {
  if (!isFirebaseConfigured) {
    throw new Error(
      'Firebase is not configured. Add the Firebase web app settings to client/.env.local.',
    );
  }
  const app = getApps().length ? getApp() : initializeApp(firebaseConfig);
  return getAuth(app);
}

export async function signInWithGoogle() {
  const provider = new GoogleAuthProvider();
  provider.setCustomParameters({ prompt: 'select_account' });
  const result = await signInWithPopup(firebaseAuth(), provider);
  return result.user.getIdToken();
}

export async function sendPhoneSignInCode(phoneNumber) {
  const auth = firebaseAuth();
  const verifier = new RecaptchaVerifier(auth, 'smartdesk-phone-recaptcha', { size: 'invisible' });
  try {
    const confirmation = await signInWithPhoneNumber(auth, phoneNumber, verifier);
    return { confirmation, verifier };
  } catch (error) {
    verifier.clear();
    throw error;
  }
}

export async function confirmPhoneSignInCode(confirmation, code) {
  const credential = await confirmation.confirm(code);
  return credential.user.getIdToken();
}

export function clearPhoneSignInVerifier(phoneSignIn) {
  phoneSignIn?.verifier?.clear();
}

export async function signOutFromFirebase() {
  if (!isFirebaseConfigured || !getApps().length) return;
  await signOut(getAuth(getApp()));
}

export function firebaseSignInErrorMessage(error) {
  if (error?.code === 'auth/operation-not-allowed') {
    return 'Enable Google and Phone as sign-in providers in Firebase Authentication, then try again.';
  }
  if (error?.code === 'auth/invalid-phone-number')
    return 'Enter a phone number with its country code, such as +14155550123.';
  if (error?.code === 'auth/invalid-verification-code')
    return 'That verification code is incorrect. Check it and try again.';
  if (error?.code === 'auth/code-expired')
    return 'That verification code expired. Send a new code and try again.';
  if (error?.code === 'auth/too-many-requests')
    return 'Too many attempts were made. Wait a little while before requesting another code.';
  if (error?.code === 'auth/unauthorized-domain') {
    const hostname = typeof window === 'undefined' ? 'your app domain' : window.location.hostname;
    return `Add ${hostname} to Firebase Authentication’s authorized domains, then try again.`;
  }
  if (error?.code === 'auth/invalid-api-key') {
    return 'Check the Firebase API key in client/.env.local, then restart SmartDesk.';
  }
  if (error?.code === 'auth/popup-blocked') {
    return 'Your browser blocked the Google sign-in window. Allow pop-ups for this site and try again.';
  }
  if (error?.code === 'auth/popup-closed-by-user') {
    return 'The Google sign-in window was closed before sign-in finished.';
  }
  return error?.message || 'Google sign-in could not be completed. Please try again.';
}
