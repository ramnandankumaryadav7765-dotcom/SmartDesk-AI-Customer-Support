import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { cert, getApps, initializeApp } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';

const serverRoot = fileURLToPath(new URL('../../', import.meta.url));
let adminAuth;

function configurationError(message) {
  const error = new Error(message);
  error.status = 503;
  return error;
}

function getFirebaseAdminAuth() {
  if (adminAuth) return adminAuth;

  const projectId = process.env.FIREBASE_PROJECT_ID?.trim();
  const accountPath = process.env.FIREBASE_SERVICE_ACCOUNT_PATH?.trim();
  if (!projectId || !accountPath) {
    throw configurationError(
      'Firebase sign-in is not configured on the server. Add FIREBASE_PROJECT_ID and a service account JSON file.',
    );
  }

  let serviceAccount;
  try {
    serviceAccount = JSON.parse(readFileSync(resolve(serverRoot, accountPath), 'utf8'));
  } catch {
    throw configurationError(
      'The Firebase service account file could not be read. Check FIREBASE_SERVICE_ACCOUNT_PATH and the JSON file.',
    );
  }
  if (serviceAccount.project_id !== projectId) {
    throw configurationError('FIREBASE_PROJECT_ID must match the project_id in the service account JSON.');
  }

  const app =
    getApps().find((candidate) => candidate.name === 'smartdesk-firebase-auth') ||
    initializeApp(
      { credential: cert(serviceAccount), projectId },
      'smartdesk-firebase-auth',
    );
  adminAuth = getAuth(app);
  return adminAuth;
}

export async function verifyFirebaseIdToken(idToken) {
  let decodedToken;
  try {
    decodedToken = await getFirebaseAdminAuth().verifyIdToken(idToken);
  } catch (cause) {
    if (cause.status === 503) throw cause;
    const error = new Error('Firebase sign-in could not be verified. Please try again.');
    error.status = 401;
    throw error;
  }

  if (
    !decodedToken.uid ||
    !decodedToken.email ||
    decodedToken.email_verified !== true ||
    decodedToken.firebase?.sign_in_provider !== 'google.com'
  ) {
    const error = new Error('Firebase did not return a verified Google account.');
    error.status = 401;
    throw error;
  }

  return {
    uid: decodedToken.uid,
    email: decodedToken.email.trim().toLowerCase(),
    name: String(decodedToken.name || '').trim().slice(0, 60),
  };
}
