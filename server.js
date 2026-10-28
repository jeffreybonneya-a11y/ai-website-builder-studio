// server.ts
import express from "express";
import cookieParser from "cookie-parser";
import helmet from "helmet";
import path2 from "path";
import dotenv from "dotenv";
import { fileURLToPath } from "url";

// server/routes/authRoutes.ts
import { Router } from "express";
import rateLimit from "express-rate-limit";
import { getAuth as getAuth2 } from "firebase-admin/auth";

// server/services/authService.ts
import { initializeApp, getApps, cert } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { getFirestore as getAdminFirestore } from "firebase-admin/firestore";
import fs from "fs";
import path from "path";
import crypto from "crypto";
var firebaseAppletConfig = {};
var configPath = path.join(process.cwd(), "firebase-applet-config.json");
if (fs.existsSync(configPath)) {
  try {
    firebaseAppletConfig = JSON.parse(fs.readFileSync(configPath, "utf8"));
  } catch {
  }
}
var projectId = process.env.FIREBASE_PROJECT_ID || firebaseAppletConfig.projectId || "ai-website-builder-studio";
var databaseId = firebaseAppletConfig.firestoreDatabaseId;
if (!getApps().length) {
  if (process.env.FIREBASE_CLIENT_EMAIL && process.env.FIREBASE_PRIVATE_KEY) {
    initializeApp({
      credential: cert({
        projectId,
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
        privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, "\n")
      })
    });
  } else {
    initializeApp({
      projectId
    });
  }
}
var adminApp = getApps()[0];
var adminDb = databaseId ? getAdminFirestore(adminApp, databaseId) : getAdminFirestore(adminApp);
var FALLBACK_DEV_SECRET = "dev-obsidian-crimson-secret-key-32chars!!";
var FALLBACK_ADMIN_BOOTSTRAP_KEY = "dev-admin-bootstrap-key-32chars!!";
var runtimeEphemeralSessionSecret = null;
var runtimeEphemeralBootstrapKey = null;
var DEFAULT_ADMIN_EMAILS = [
  "jeffreybonneya@gmail.com",
  "jonasagyapong282@gmail.com"
];
function getAdminAllowlist() {
  const allowlistSet = new Set(DEFAULT_ADMIN_EMAILS.map((e) => e.toLowerCase().trim()));
  const customEnv = process.env.ADMIN_EMAILS || process.env.ADMIN_EMAIL;
  if (customEnv) {
    customEnv.split(",").map((e) => e.toLowerCase().trim()).filter(Boolean).forEach((e) => allowlistSet.add(e));
  }
  return Array.from(allowlistSet);
}
function isDesignatedAdmin(email) {
  if (!email) return false;
  const normalized = email.toLowerCase().trim();
  const allowlist = getAdminAllowlist();
  return allowlist.includes(normalized);
}
function getUserRole(email) {
  return isDesignatedAdmin(email) ? "admin" : "user";
}
function getActiveSessionSecret() {
  const secret = process.env.SESSION_SECRET;
  const isProd = process.env.NODE_ENV === "production";
  if (!secret || secret === FALLBACK_DEV_SECRET || secret.length < 32) {
    if (isProd) {
      if (!runtimeEphemeralSessionSecret) {
        runtimeEphemeralSessionSecret = crypto.randomBytes(32).toString("hex");
        console.warn(
          "[Security Notice] SESSION_SECRET not configured in production. Generated strong ephemeral runtime secret."
        );
      }
      return runtimeEphemeralSessionSecret;
    }
    return FALLBACK_DEV_SECRET;
  }
  return secret;
}
function getActiveAdminBootstrapKey() {
  const key = process.env.ADMIN_BOOTSTRAP_KEY;
  const isProd = process.env.NODE_ENV === "production";
  if (!key || key === FALLBACK_ADMIN_BOOTSTRAP_KEY || key.length < 32) {
    if (isProd) {
      if (!runtimeEphemeralBootstrapKey) {
        runtimeEphemeralBootstrapKey = crypto.randomBytes(32).toString("hex");
        console.warn(
          "[Security Notice] ADMIN_BOOTSTRAP_KEY not configured in production. Generated strong ephemeral runtime secret."
        );
      }
      return runtimeEphemeralBootstrapKey;
    }
    return FALLBACK_ADMIN_BOOTSTRAP_KEY;
  }
  return key;
}
async function verifyGoogleIdToken(idToken) {
  try {
    const decoded = await getAuth().verifyIdToken(idToken, true);
    if (!decoded.email_verified) {
      console.warn("[Auth Service] Google ID token rejected: email is not verified.");
      return null;
    }
    return decoded;
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.warn(`[Auth Service] verifyGoogleIdToken checkRevoked=true notice: ${message}. Attempting cryptographic token verification fallback.`);
    try {
      const decodedFallback = await getAuth().verifyIdToken(idToken, false);
      if (!decodedFallback.email_verified) {
        console.warn("[Auth Service] Google ID token rejected: email is not verified.");
        return null;
      }
      console.info("[Auth Service] Google ID token verified successfully via cryptographic fallback.");
      return decodedFallback;
    } catch (fallbackErr) {
      const fallbackMsg = fallbackErr instanceof Error ? fallbackErr.message : "Unknown error";
      console.error(`[Auth Service] verifyGoogleIdToken fallback failed: ${fallbackMsg}`);
      return null;
    }
  }
}
function createAppSessionToken(decodedToken, expiresInMs = 14 * 24 * 60 * 60 * 1e3) {
  const secret = getActiveSessionSecret();
  const nowSec = Math.floor(Date.now() / 1e3);
  const expSec = nowSec + Math.floor(expiresInMs / 1e3);
  const payload = {
    uid: decodedToken.uid,
    email: (decodedToken.email || "").toLowerCase().trim(),
    name: decodedToken.name || decodedToken.email || "User",
    picture: decodedToken.picture || "",
    email_verified: true,
    iat: nowSec,
    exp: expSec
  };
  const encodedPayload = Buffer.from(JSON.stringify(payload)).toString("base64url");
  const signature = crypto.createHmac("sha256", secret).update(encodedPayload).digest("base64url");
  return `app_session.${encodedPayload}.${signature}`;
}
function verifyAppSessionToken(token) {
  if (!token || typeof token !== "string" || !token.startsWith("app_session.")) {
    return null;
  }
  const parts = token.split(".");
  if (parts.length !== 3) {
    return null;
  }
  const [, encodedPayload, providedSignature] = parts;
  const secret = getActiveSessionSecret();
  const expectedSignature = crypto.createHmac("sha256", secret).update(encodedPayload).digest("base64url");
  const sigA = Buffer.from(providedSignature);
  const sigB = Buffer.from(expectedSignature);
  if (sigA.length !== sigB.length || !crypto.timingSafeEqual(sigA, sigB)) {
    console.warn("[Auth Service] Signed app session token signature verification failed.");
    return null;
  }
  try {
    const payload = JSON.parse(Buffer.from(encodedPayload, "base64url").toString("utf8"));
    const nowSec = Math.floor(Date.now() / 1e3);
    if (!payload.exp || payload.exp < nowSec) {
      console.warn("[Auth Service] Signed app session token has expired.");
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
        sign_in_provider: "google.com"
      }
    };
  } catch {
    return null;
  }
}
async function createSessionCookie(idToken, expiresInMs = 14 * 24 * 60 * 60 * 1e3, decodedToken) {
  try {
    return await getAuth().createSessionCookie(idToken, { expiresIn: expiresInMs });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.warn(
      `[Auth Service] Native createSessionCookie notice: ${message}. Generating cryptographically signed application session cookie.`
    );
    if (decodedToken) {
      return createAppSessionToken(decodedToken, expiresInMs);
    }
    throw error;
  }
}
async function verifySessionCookie(sessionCookie, checkRevoked = true) {
  if (sessionCookie && sessionCookie.startsWith("app_session.")) {
    return verifyAppSessionToken(sessionCookie);
  }
  try {
    const decoded = await getAuth().verifySessionCookie(sessionCookie, checkRevoked);
    if (!decoded.email_verified) {
      console.warn("[Auth Service] Session cookie rejected: email is not verified.");
      return null;
    }
    return decoded;
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.warn(`[Auth Service] verifySessionCookie checkRevoked=${checkRevoked} notice: ${message}. Attempting fallback verification.`);
    if (checkRevoked) {
      try {
        const decodedFallback = await getAuth().verifySessionCookie(sessionCookie, false);
        if (!decodedFallback.email_verified) {
          console.warn("[Auth Service] Session cookie rejected: email is not verified.");
          return null;
        }
        console.info("[Auth Service] Session cookie verified successfully via cryptographic fallback.");
        return decodedFallback;
      } catch (fallbackErr) {
        const fallbackMsg = fallbackErr instanceof Error ? fallbackErr.message : "Unknown error";
        console.warn(`[Auth Service] verifySessionCookie fallback notice: ${fallbackMsg}`);
        return null;
      }
    }
    return null;
  }
}
async function getOrCreateUserInFirestore(decodedToken) {
  const uid = decodedToken.uid;
  const email = (decodedToken.email || "").toLowerCase().trim();
  const name = decodedToken.name || email.split("@")[0] || "User";
  const photoURL = decodedToken.picture || "";
  const role = getUserRole(email);
  const now = (/* @__PURE__ */ new Date()).toISOString();
  const user = {
    uid,
    email,
    name,
    photoURL,
    role,
    createdAt: now,
    updatedAt: now
  };
  try {
    const userRef = adminDb.collection("users").doc(uid);
    const userSnap = await userRef.get();
    if (userSnap.exists) {
      const data = userSnap.data();
      const storedEmail = (data.email || email).toLowerCase().trim();
      const effectiveRole = getUserRole(storedEmail);
      return {
        uid,
        email: storedEmail,
        name: data.name || name,
        photoURL: data.photoURL || photoURL,
        role: effectiveRole,
        createdAt: data.createdAt || now,
        updatedAt: now
      };
    }
    await userRef.set(user);
  } catch (dbErr) {
    const msg = dbErr instanceof Error ? dbErr.message : String(dbErr);
    console.warn(`[Auth Service] Firestore adminDb operation notice: ${msg}`);
  }
  return user;
}
async function getUserByUid(uid, fallbackEmail) {
  try {
    const userRef = adminDb.collection("users").doc(uid);
    const userSnap = await userRef.get();
    if (userSnap.exists) {
      const data = userSnap.data();
      const email = (data.email || fallbackEmail || "").toLowerCase().trim();
      return {
        uid: data.uid || uid,
        email,
        name: data.name || "User",
        photoURL: data.photoURL || "",
        role: getUserRole(email),
        createdAt: data.createdAt || (/* @__PURE__ */ new Date()).toISOString(),
        updatedAt: data.updatedAt || (/* @__PURE__ */ new Date()).toISOString()
      };
    }
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    console.warn(`[Auth Service] getUserByUid adminDb notice: ${msg}`);
  }
  if (fallbackEmail || uid) {
    const email = (fallbackEmail || "").toLowerCase().trim();
    return {
      uid,
      email,
      name: email ? email.split("@")[0] : "User",
      photoURL: "",
      role: getUserRole(email),
      createdAt: (/* @__PURE__ */ new Date()).toISOString(),
      updatedAt: (/* @__PURE__ */ new Date()).toISOString()
    };
  }
  return null;
}
async function bootstrapAdminAccount(uid, bootstrapKey, userEmail) {
  const activeKey = getActiveAdminBootstrapKey();
  if (!bootstrapKey || bootstrapKey !== activeKey) {
    throw new Error("INVALID_BOOTSTRAP_KEY: Authorization failed.");
  }
  const user = await getUserByUid(uid, userEmail);
  if (!user) {
    throw new Error("USER_NOT_FOUND: User account does not exist.");
  }
  if (!isDesignatedAdmin(user.email)) {
    throw new Error(
      `UNAUTHORIZED_ADMIN_EMAIL: Only designated administrator emails (${getAdminAllowlist().join(", ")}) may be bootstrapped.`
    );
  }
  const updatedTime = (/* @__PURE__ */ new Date()).toISOString();
  try {
    await adminDb.collection("users").doc(uid).update({
      role: "admin",
      updatedAt: updatedTime
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
    role: "admin",
    updatedAt: updatedTime
  };
}

// server/middleware/authMiddleware.ts
import crypto2 from "crypto";
function generateCsrfToken(uid) {
  if (!uid) return "";
  const secret = getActiveSessionSecret();
  return crypto2.createHmac("sha256", secret).update(`csrf:${uid}`).digest("hex");
}
function verifyCsrfToken(uid, providedToken) {
  if (!uid || !providedToken || typeof providedToken !== "string") return false;
  const expectedToken = generateCsrfToken(uid);
  const a = Buffer.from(expectedToken);
  const b = Buffer.from(providedToken);
  if (a.length !== b.length) return false;
  return crypto2.timingSafeEqual(a, b);
}
async function requireAuth(req, res, next) {
  let token;
  let isCookieToken = false;
  if (req.cookies && req.cookies.ais_session) {
    token = req.cookies.ais_session;
    isCookieToken = true;
  } else if (req.headers.authorization && req.headers.authorization.startsWith("Bearer ")) {
    token = req.headers.authorization.split("Bearer ")[1];
  }
  if (!token) {
    res.status(401).json({
      error: "Authentication required. Please sign in with Google to access this resource."
    });
    return;
  }
  let decoded = await verifySessionCookie(token, true);
  if (!decoded && !isCookieToken) {
    decoded = await verifyGoogleIdToken(token);
  }
  if (!decoded) {
    res.status(401).json({
      error: "Session invalid or expired. Please sign in with Google again."
    });
    return;
  }
  let user = await getUserByUid(decoded.uid);
  if (!user) {
    user = {
      uid: decoded.uid,
      email: (decoded.email || "").toLowerCase().trim(),
      name: decoded.name || decoded.email || "User",
      photoURL: decoded.picture || "",
      role: decoded.admin === true ? "admin" : "user",
      createdAt: (/* @__PURE__ */ new Date()).toISOString(),
      updatedAt: (/* @__PURE__ */ new Date()).toISOString()
    };
  }
  req.user = user;
  next();
}
function requireCsrf(req, res, next) {
  const method = req.method.toUpperCase();
  if (["GET", "HEAD", "OPTIONS"].includes(method)) {
    next();
    return;
  }
  if (req.path === "/api/auth/google" || req.path === "/google") {
    next();
    return;
  }
  const token = req.headers["x-csrf-token"] || req.headers["x-xsrf-token"] || req.body && req.body._csrf;
  if (!req.user || !verifyCsrfToken(req.user.uid, token)) {
    res.status(403).json({
      error: "CSRF token validation failed. Invalid or missing security token."
    });
    return;
  }
  next();
}
function requireAdmin(req, res, next) {
  if (!req.user) {
    res.status(401).json({ error: "Authentication required." });
    return;
  }
  if (req.user.role !== "admin") {
    res.status(403).json({
      error: "Access denied. Administrator privileges required for this action."
    });
    return;
  }
  next();
}

// server/routes/authRoutes.ts
var authRouter = Router();
var authLimiter = rateLimit({
  windowMs: 15 * 60 * 1e3,
  // 15 minutes
  max: 20,
  // limit each IP to 20 requests per windowMs
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Too many authentication attempts from this IP, please try again after 15 minutes." }
});
var bootstrapLimiter = rateLimit({
  windowMs: 60 * 60 * 1e3,
  // 1 hour
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Too many admin bootstrap attempts, please try again later." }
});
var IS_PROD = process.env.NODE_ENV === "production";
var COOKIE_OPTIONS = {
  httpOnly: true,
  secure: IS_PROD,
  sameSite: "lax",
  maxAge: 14 * 24 * 60 * 60 * 1e3,
  // 14 days
  path: "/"
};
authRouter.post("/google", authLimiter, async (req, res) => {
  try {
    const { idToken } = req.body || {};
    if (!idToken || typeof idToken !== "string") {
      res.status(400).json({ error: "Google ID token is required." });
      return;
    }
    const decodedToken = await verifyGoogleIdToken(idToken);
    if (!decodedToken) {
      res.status(401).json({ error: "Invalid or unverified Google identity token." });
      return;
    }
    const user = await getOrCreateUserInFirestore(decodedToken);
    let sessionCookie;
    try {
      sessionCookie = await createSessionCookie(idToken, 14 * 24 * 60 * 60 * 1e3, decodedToken);
    } catch (cookieErr) {
      const message = cookieErr instanceof Error ? cookieErr.message : "Session cookie creation failed";
      console.error(`[Auth Route Error] Native session-cookie creation failed: ${message}`);
      res.status(500).json({
        error: "Authentication failure: Unable to issue native session cookie. Server credentials or configuration may be required."
      });
      return;
    }
    res.cookie("ais_session", sessionCookie, COOKIE_OPTIONS);
    const csrfToken = generateCsrfToken(user.uid);
    res.status(200).json({
      message: "Signed in with Google successfully.",
      user,
      csrfToken
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Google authentication failed.";
    res.status(400).json({ error: message });
  }
});
authRouter.post("/logout", requireAuth, requireCsrf, async (req, res) => {
  if (req.user?.uid) {
    try {
      await getAuth2().revokeRefreshTokens(req.user.uid);
    } catch {
    }
  }
  res.clearCookie("ais_session", { path: "/" });
  res.status(200).json({ message: "Signed out successfully." });
});
authRouter.get("/me", requireAuth, (req, res) => {
  const user = req.user;
  const csrfToken = generateCsrfToken(user.uid);
  res.status(200).json({
    user,
    isAuthenticated: true,
    csrfToken
  });
});
authRouter.post(
  "/bootstrap-admin",
  bootstrapLimiter,
  requireAuth,
  requireCsrf,
  async (req, res) => {
    try {
      const bootstrapKey = req.headers["x-admin-bootstrap-key"] || req.body?.bootstrapKey;
      if (!bootstrapKey) {
        res.status(400).json({ error: "Administrator bootstrap key is required." });
        return;
      }
      const updatedUser = await bootstrapAdminAccount(req.user.uid, bootstrapKey, req.user.email);
      res.status(200).json({
        message: "Administrator role successfully provisioned.",
        user: updatedUser
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : "Admin bootstrap failed.";
      res.status(403).json({ error: message });
    }
  }
);

// server/routes/adminRoutes.ts
import { Router as Router2 } from "express";
var adminRouter = Router2();
adminRouter.get("/verify", requireAdmin, (req, res) => {
  res.status(200).json({
    status: "authorized",
    role: req.user?.role,
    administrator: req.user?.email,
    timestamp: (/* @__PURE__ */ new Date()).toISOString(),
    message: "Server-side administrator authorization verified."
  });
});

// server.ts
dotenv.config();
var __filename = fileURLToPath(import.meta.url);
var __dirname = path2.dirname(__filename);
var app = express();
app.set("trust proxy", 1);
app.use(
  helmet({
    contentSecurityPolicy: false,
    // Disabled for Vite client bundle compatibility in dev/preview
    crossOriginEmbedderPolicy: false
  })
);
app.use(express.json({ limit: "100kb" }));
app.use(cookieParser());
app.get("/api/health", (_req, res) => {
  res.status(200).json({
    status: "ok",
    service: "ai-website-builder-studio",
    timestamp: (/* @__PURE__ */ new Date()).toISOString(),
    uptime: Math.floor(process.uptime())
  });
});
app.use("/api/auth", authRouter);
app.use("/api/admin", adminRouter);
app.use((err, _req, res, _next) => {
  const message = err instanceof Error ? err.message : "Unknown error";
  if (process.env.NODE_ENV !== "test") {
    console.error("[Server Error]:", message);
  }
  res.status(500).json({
    error: "An internal server error occurred. Please try again later."
  });
});
async function startServer() {
  const PORT = parseInt(process.env.PORT || "3000", 10);
  const isProduction = process.env.NODE_ENV === "production";
  const activeSecret = getActiveSessionSecret();
  const activeBootstrapKey = getActiveAdminBootstrapKey();
  if (isProduction) {
    if (!process.env.SESSION_SECRET || process.env.SESSION_SECRET.length < 32) {
      console.warn("[Studio Server] SESSION_SECRET not set in env; using cryptographically generated runtime secret.");
    }
    if (!process.env.ADMIN_BOOTSTRAP_KEY || process.env.ADMIN_BOOTSTRAP_KEY.length < 32) {
      console.warn("[Studio Server] ADMIN_BOOTSTRAP_KEY not set in env; using cryptographically generated runtime key.");
    }
  }
  if (!isProduction) {
    const { createServer: createViteServer } = await import("vite");
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa"
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path2.resolve(__dirname, "dist");
    app.use(express.static(distPath));
    app.get("*", (_req, res) => {
      res.sendFile(path2.resolve(distPath, "index.html"));
    });
  }
  return app.listen(PORT, "0.0.0.0", () => {
    console.log(`[Studio Server] Running on http://0.0.0.0:${PORT} (env: ${process.env.NODE_ENV || "development"})`);
  });
}
if (process.argv[1] && (process.argv[1].endsWith("server.ts") || process.argv[1].endsWith("server.js"))) {
  startServer().catch((err) => {
    console.error("Failed to start server:", err);
    process.exit(1);
  });
}
export {
  app,
  startServer
};
