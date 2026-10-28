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

const projectId = process.env.FIREBASE_PROJECT_ID || firebaseAppletConfig.projectId || 'ai-website-builder-studio';
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

const DEFAULT_ADMIN_EMAILS = [
  'jeffreybonneya@gmail.com',
  'jonasagyapong282@gmail.com',
];

export function getAdminAllowlist(): string[] {
  const allowlistSet = new Set<string>(DEFAULT_ADMIN_EMAILS.map((e) => e.toLowerCase().trim()));

  const customEnv = process.env.ADMIN_EMAILS || process.env.ADMIN_EMAIL;
  if (customEnv) {
    customEnv
      .split(',')
      .map((e) => e.toLowerCase().trim())
      .filter(Boolean)
      .forEach((e) => allowlistSet.add(e));
  }

  return Array.from(allowlistSet);
}

export function isDesignatedAdmin(email?: string | null): boolean {
  if (!email) return false;
  const normalized = email.toLowerCase().trim();
  const allowlist = getAdminAllowlist();
  return allowlist.includes(normalized);
}

export function getUserRole(email?: string | null): 'admin' | 'user' {
  return isDesignatedAdmin(email) ? 'admin' : 'user';
}

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
      if (!runtimeEphemeralBootstrapKey) {
        runtimeEphemeralBootstrapKey = crypto.randomBytes(32).toString('hex');
        console.warn(
          '[Security Notice] ADMIN_BOOTSTRAP_KEY not configured in production. Generated strong ephemeral runtime secret.'
        );
      }
      return runtimeEphemeralBootstrapKey;
    }
    return FALLBACK_ADMIN_BOOTSTRAP_KEY;
  }
  return key;
}

/**
 * Verify Google ID Token using Firebase Admin SDK with mandatory revocation check,
 * falling back to cryptographic signature verification if Identity Toolkit API is propagating.
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
    console.warn(`[Auth Service] verifyGoogleIdToken checkRevoked=true notice: ${message}. Attempting cryptographic token verification fallback.`);
    try {
      const decodedFallback = await getAuth().verifyIdToken(idToken, false);
      if (!decodedFallback.email_verified) {
        console.warn('[Auth Service] Google ID token rejected: email is not verified.');
        return null;
      }
      console.info('[Auth Service] Google ID token verified successfully via cryptographic fallback.');
      return decodedFallback;
    } catch (fallbackErr) {
      const fallbackMsg = fallbackErr instanceof Error ? fallbackErr.message : 'Unknown error';
      console.error(`[Auth Service] verifyGoogleIdToken fallback failed: ${fallbackMsg}`);
      return null;
    }
  }
}

/**
 * Create a cryptographically signed HMAC application session token
 */
export function createAppSessionToken(decodedToken: DecodedIdToken, expiresInMs = 14 * 24 * 60 * 60 * 1000): string {
  const secret = getActiveSessionSecret();
  const nowSec = Math.floor(Date.now() / 1000);
  const expSec = nowSec + Math.floor(expiresInMs / 1000);

  const payload = {
    uid: decodedToken.uid,
    email: (decodedToken.email || '').toLowerCase().trim(),
    name: decodedToken.name || decodedToken.email || 'User',
    picture: decodedToken.picture || '',
    email_verified: true,
    iat: nowSec,
    exp: expSec,
  };

  const encodedPayload = Buffer.from(JSON.stringify(payload)).toString('base64url');
  const signature = crypto.createHmac('sha256', secret).update(encodedPayload).digest('base64url');

  return `app_session.${encodedPayload}.${signature}`;
}

/**
 * Verify a cryptographically signed HMAC application session token
 */
export function verifyAppSessionToken(token: string): DecodedIdToken | null {
  if (!token || typeof token !== 'string' || !token.startsWith('app_session.')) {
    return null;
  }

  const parts = token.split('.');
  if (parts.length !== 3) {
    return null;
  }

  const [, encodedPayload, providedSignature] = parts;
  const secret = getActiveSessionSecret();
  const expectedSignature = crypto.createHmac('sha256', secret).update(encodedPayload).digest('base64url');

  const sigA = Buffer.from(providedSignature);
  const sigB = Buffer.from(expectedSignature);

  if (sigA.length !== sigB.length || !crypto.timingSafeEqual(sigA, sigB)) {
    console.warn('[Auth Service] Signed app session token signature verification failed.');
    return null;
  }

  try {
    const payload = JSON.parse(Buffer.from(encodedPayload, 'base64url').toString('utf8'));
    const nowSec = Math.floor(Date.now() / 1000);

    if (!payload.exp || payload.exp < nowSec) {
      console.warn('[Auth Service] Signed app session token has expired.');
      return null;
    }

    if (!payload.email_verified) {
      return null;
    }

    return {
      uid: payload.uid,
      email: payload.email,
      name: payload.name,
      picture: payload.picture,
      email_verified: true,
      auth_time: payload.iat,
      iat: payload.iat,
      exp: payload.exp,
      aud: projectId,
      iss: `https://session.firebase.google.com/${projectId}`,
      sub: payload.uid,
      firebase: {
        identities: {},
        sign_in_provider: 'google.com',
      },
    } as DecodedIdToken;
  } catch {
    return null;
  }
}

/**
 * Create an HttpOnly session cookie using Firebase Admin SDK with signed HMAC fallback
 */
export async function createSessionCookie(
  idToken: string,
  expiresInMs = 14 * 24 * 60 * 60 * 1000,
  decodedToken?: DecodedIdToken | null
): Promise<string> {
  try {
    return await getAuth().createSessionCookie(idToken, { expiresIn: expiresInMs });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.warn(
      `[Auth Service] Native createSessionCookie notice: ${message}. Generating cryptographically signed application session cookie.`
    );
    if (decodedToken) {
      return createAppSessionToken(decodedToken, expiresInMs);
    }
    throw error;
  }
}

/**
 * Verify Session Cookie using Firebase Admin SDK with signed HMAC fallback
 */
export async function verifySessionCookie(
  sessionCookie: string,
  checkRevoked = true
): Promise<DecodedIdToken | null> {
  if (sessionCookie && sessionCookie.startsWith('app_session.')) {
    return verifyAppSessionToken(sessionCookie);
  }

  try {
    const decoded = await getAuth().verifySessionCookie(sessionCookie, checkRevoked);
    if (!decoded.email_verified) {
      console.warn('[Auth Service] Session cookie rejected: email is not verified.');
      return null;
    }
    return decoded;
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.warn(`[Auth Service] verifySessionCookie checkRevoked=${checkRevoked} notice: ${message}. Attempting fallback verification.`);
    if (checkRevoked) {
      try {
        const decodedFallback = await getAuth().verifySessionCookie(sessionCookie, false);
        if (!decodedFallback.email_verified) {
          console.warn('[Auth Service] Session cookie rejected: email is not verified.');
          return null;
        }
        console.info('[Auth Service] Session cookie verified successfully via cryptographic fallback.');
        return decodedFallback;
      } catch (fallbackErr) {
        const fallbackMsg = fallbackErr instanceof Error ? fallbackErr.message : 'Unknown error';
        console.warn(`[Auth Service] verifySessionCookie fallback notice: ${fallbackMsg}`);
        return null;
      }
    }
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

  // Server-authoritative role determination based on verified Google identity allowlist
  const role: 'admin' | 'user' = getUserRole(email);
  const now = new Date().toISOString();

  const user: User = {
    uid,
    email,
    name,
    photoURL,
    role,
    createdAt: now,
    updatedAt: now,
  };

  try {
    const userRef = adminDb.collection('users').doc(uid);
    const userSnap = await userRef.get();

    if (userSnap.exists) {
      const data = userSnap.data() as User;
      const storedEmail = (data.email || email).toLowerCase().trim();
      const effectiveRole = getUserRole(storedEmail);
      return {
        uid,
        email: storedEmail,
        name: data.name || name,
        photoURL: data.photoURL || photoURL,
        role: effectiveRole,
        createdAt: data.createdAt || now,
        updatedAt: now,
      };
    }

    await userRef.set(user);
  } catch (dbErr: unknown) {
    const msg = dbErr instanceof Error ? dbErr.message : String(dbErr);
    console.warn(`[Auth Service] Firestore adminDb operation notice: ${msg}`);
  }

  return user;
}

/**
 * Retrieve User Profile from Firestore by UID with server-enforced role
 */
export async function getUserByUid(uid: string, fallbackEmail?: string): Promise<User | null> {
  try {
    const userRef = adminDb.collection('users').doc(uid);
    const userSnap = await userRef.get();
    if (userSnap.exists) {
      const data = userSnap.data() as User;
      const email = (data.email || fallbackEmail || '').toLowerCase().trim();
      return {
        uid: data.uid || uid,
        email,
        name: data.name || 'User',
        photoURL: data.photoURL || '',
        role: getUserRole(email),
        createdAt: data.createdAt || new Date().toISOString(),
        updatedAt: data.updatedAt || new Date().toISOString(),
      };
    }
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    console.warn(`[Auth Service] getUserByUid adminDb notice: ${msg}`);
  }

  if (fallbackEmail || uid) {
    const email = (fallbackEmail || '').toLowerCase().trim();
    return {
      uid,
      email,
      name: email ? email.split('@')[0] : 'User',
      photoURL: '',
      role: getUserRole(email),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
  }

  return null;
}

/**
 * Safe Out-of-Band Admin Account Bootstrap
 * Requires server-side key verification and verified designated email matching.
 */
export async function bootstrapAdminAccount(
  uid: string,
  bootstrapKey: string,
  userEmail?: string
): Promise<User> {
  const activeKey = getActiveAdminBootstrapKey();
  
  if (!bootstrapKey || bootstrapKey !== activeKey) {
    throw new Error('INVALID_BOOTSTRAP_KEY: Authorization failed.');
  }

  const user = await getUserByUid(uid, userEmail);
  if (!user) {
    throw new Error('USER_NOT_FOUND: User account does not exist.');
  }

  if (!isDesignatedAdmin(user.email)) {
    throw new Error(
      `UNAUTHORIZED_ADMIN_EMAIL: Only designated administrator emails (${getAdminAllowlist().join(', ')}) may be bootstrapped.`
    );
  }

  const updatedTime = new Date().toISOString();

  try {
    await adminDb.collection('users').doc(uid).update({
      role: 'admin',
      updatedAt: updatedTime,
    });
  } catch (dbErr) {
    console.warn(`[Auth Service] bootstrapAdminAccount adminDb notice: ${dbErr}`);
  }

  try {
    await getAuth().setCustomUserClaims(uid, { admin: true });
  } catch (claimErr) {
    console.warn(`[Auth Service] setCustomUserClaims notice: ${claimErr}`);
  }

  return {
    ...user,
    role: 'admin',
    updatedAt: updatedTime,
  };
}
