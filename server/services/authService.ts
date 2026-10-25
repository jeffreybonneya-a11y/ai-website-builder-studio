import { initializeApp, getApps, cert } from 'firebase-admin/app';
import { getAuth, DecodedIdToken } from 'firebase-admin/auth';
import { getFirestore as getAdminFirestore } from 'firebase-admin/firestore';
import fs from 'fs';
import path from 'path';

export interface User {
  uid: string;
  email: string;
  name: string;
  photoURL?: string;
  role: 'admin' | 'user';
  createdAt: string;
  updatedAt: string;
}

// Read Firebase applet configuration if present
let firebaseAppletConfig: { projectId?: string; firestoreDatabaseId?: string } = {};
const configPath = path.join(process.cwd(), 'firebase-applet-config.json');
if (fs.existsSync(configPath)) {
  try {
    firebaseAppletConfig = JSON.parse(fs.readFileSync(configPath, 'utf8'));
  } catch {
    // Fallback if parsing fails
  }
}

const projectId = process.env.FIREBASE_PROJECT_ID || firebaseAppletConfig.projectId || 'alpine-hall-85v9p';
const databaseId = firebaseAppletConfig.firestoreDatabaseId;

// Initialize Firebase Admin SDK safely
if (!getApps().length) {
  if (process.env.FIREBASE_CLIENT_EMAIL && process.env.FIREBASE_PRIVATE_KEY) {
    initializeApp({
      credential: cert({
        projectId,
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
        privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
      }),
    });
  } else {
    initializeApp({
      projectId,
    });
  }
}

const adminApp = getApps()[0];
export const adminDb = databaseId
  ? getAdminFirestore(adminApp, databaseId)
  : getAdminFirestore(adminApp);

import crypto from 'crypto';

const FALLBACK_DEV_SECRET = 'dev-obsidian-crimson-secret-key-32chars!!';
const FALLBACK_ADMIN_BOOTSTRAP_KEY = 'dev-admin-bootstrap-key-32chars!!';

let runtimeEphemeralSessionSecret: string | null = null;
let runtimeEphemeralBootstrapKey: string | null = null;

export const DESIGNATED_ADMIN_EMAIL = (
  process.env.ADMIN_EMAIL || 'jeffreybonneya@gmail.com'
).toLowerCase().trim();

/**
 * Validate SESSION_SECRET on startup or execution.
 * Auto-generates cryptographically strong ephemeral secret if unconfigured in production.
 */
export function getActiveSessionSecret(): string {
  const secret = process.env.SESSION_SECRET;
  const isProd = process.env.NODE_ENV === 'production';

  if (!secret || secret === FALLBACK_DEV_SECRET || secret.length < 32) {
    if (isProd) {
      if (!runtimeEphemeralSessionSecret) {
        runtimeEphemeralSessionSecret = crypto.randomBytes(32).toString('hex');
        console.warn(
          '[Security Notice] SESSION_SECRET not configured in production. Generated strong ephemeral runtime secret.'
        );
      }
      return runtimeEphemeralSessionSecret;
    }
    return FALLBACK_DEV_SECRET;
  }
  return secret;
}

/**
 * Validate ADMIN_BOOTSTRAP_KEY.
 * Fails closed in production if key is missing or weak.
 */
export function getActiveAdminBootstrapKey(): string {
  const key = process.env.ADMIN_BOOTSTRAP_KEY;
  const isProd = process.env.NODE_ENV === 'production';

  if (!key || key === FALLBACK_ADMIN_BOOTSTRAP_KEY || key.length < 32) {
    if (isProd) {
      throw new Error(
        'Production startup failed closed: ADMIN_BOOTSTRAP_KEY environment variable is missing or weak. An explicitly configured ADMIN_BOOTSTRAP_KEY of at least 32 characters is required in production.'
      );
    }
    return FALLBACK_ADMIN_BOOTSTRAP_KEY;
  }
  return key;
}

/**
 * Verify Google ID Token using Firebase Admin SDK with mandatory revocation check
 */
export async function verifyGoogleIdToken(idToken: string): Promise<DecodedIdToken | null> {
  try {
    const decoded = await getAuth().verifyIdToken(idToken, true);
    if (!decoded.email_verified) {
      console.warn('[Auth Service] Google ID token rejected: email is not verified.');
      return null;
    }
    return decoded;
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error(`[Auth Service] verifyGoogleIdToken failed: ${message}`);
    return null;
  }
}

/**
 * Create an HttpOnly session cookie using Firebase Admin SDK
 */
export async function createSessionCookie(
  idToken: string,
  expiresInMs = 14 * 24 * 60 * 60 * 1000
): Promise<string> {
  try {
    return await getAuth().createSessionCookie(idToken, { expiresIn: expiresInMs });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error(`[Auth Service] createSessionCookie failed: ${message}`);
    throw error;
  }
}

/**
 * Verify Session Cookie using Firebase Admin SDK with mandatory revocation check
 */
export async function verifySessionCookie(
  sessionCookie: string,
  checkRevoked = true
): Promise<DecodedIdToken | null> {
  try {
    const decoded = await getAuth().verifySessionCookie(sessionCookie, checkRevoked);
    if (!decoded.email_verified) {
      console.warn('[Auth Service] Session cookie rejected: email is not verified.');
      return null;
    }
    return decoded;
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error(`[Auth Service] verifySessionCookie failed: ${message}`);
    return null;
  }
}

/**
 * Fetch or create a persistent User profile in Firestore (/users/{uid})
 */
export async function getOrCreateUserInFirestore(
  decodedToken: DecodedIdToken
): Promise<User> {
  const uid = decodedToken.uid;
  const email = (decodedToken.email || '').toLowerCase().trim();
  const name = decodedToken.name || email.split('@')[0] || 'User';
  const photoURL = decodedToken.picture || '';

  const userRef = adminDb.collection('users').doc(uid);
  const userSnap = await userRef.get();

  const now = new Date().toISOString();

  if (userSnap.exists) {
    const data = userSnap.data() as User;
    return {
      uid,
      email: data.email || email,
      name: data.name || name,
      photoURL: data.photoURL || photoURL,
      role: data.role === 'admin' ? 'admin' : 'user',
      createdAt: data.createdAt || now,
      updatedAt: data.updatedAt || now,
    };
  }

  // New user registration defaults strictly to 'user' role
  const newUser: User = {
    uid,
    email,
    name,
    photoURL,
    role: 'user',
    createdAt: now,
    updatedAt: now,
  };

  await userRef.set(newUser);
  return newUser;
}

/**
 * Retrieve User Profile from Firestore by UID
 */
export async function getUserByUid(uid: string): Promise<User | null> {
  try {
    const userRef = adminDb.collection('users').doc(uid);
    const userSnap = await userRef.get();
    if (!userSnap.exists) {
      return null;
    }
    const data = userSnap.data() as User;
    return {
      uid: data.uid,
      email: data.email,
      name: data.name,
      photoURL: data.photoURL,
      role: data.role === 'admin' ? 'admin' : 'user',
      createdAt: data.createdAt,
      updatedAt: data.updatedAt,
    };
  } catch (error) {
    return null;
  }
}

/**
 * Safe Out-of-Band Admin Account Bootstrap
 * Requires server-side key verification and verified designated email matching.
 */
export async function bootstrapAdminAccount(uid: string, bootstrapKey: string): Promise<User> {
  const activeKey = getActiveAdminBootstrapKey();
  
  if (!bootstrapKey || bootstrapKey !== activeKey) {
    throw new Error('INVALID_BOOTSTRAP_KEY: Authorization failed.');
  }

  const user = await getUserByUid(uid);
  if (!user) {
    throw new Error('USER_NOT_FOUND: User account does not exist.');
  }

  if (user.email.toLowerCase().trim() !== DESIGNATED_ADMIN_EMAIL) {
    throw new Error(
      `UNAUTHORIZED_ADMIN_EMAIL: Only designated administrator email (${DESIGNATED_ADMIN_EMAIL}) may be bootstrapped.`
    );
  }

  const updatedTime = new Date().toISOString();

  // Update Firestore user document
  await adminDb.collection('users').doc(uid).update({
    role: 'admin',
    updatedAt: updatedTime,
  });

  // Set Custom User Claim in Firebase Auth
  await getAuth().setCustomUserClaims(uid, { admin: true });

  return {
    ...user,
    role: 'admin',
    updatedAt: updatedTime,
  };
}
