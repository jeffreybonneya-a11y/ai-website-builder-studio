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
var projectId = process.env.FIREBASE_PROJECT_ID || firebaseAppletConfig.projectId || "alpine-hall-85v9p";
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
var FALLBACK_ADMIN_BOOTSTRAP_KEY = "dev-admin-bootstrap-key-32chars!!";
var runtimeEphemeralBootstrapKey = null;
var DESIGNATED_ADMIN_EMAIL = (process.env.ADMIN_EMAIL || "jeffreybonneya@gmail.com").toLowerCase().trim();
function getActiveAdminBootstrapKey() {
  const key = process.env.ADMIN_BOOTSTRAP_KEY;
  const isProd = process.env.NODE_ENV === "production";
  if (!key || key === FALLBACK_ADMIN_BOOTSTRAP_KEY || key.length < 32) {
    if (isProd) {
      if (!runtimeEphemeralBootstrapKey) {
        runtimeEphemeralBootstrapKey = crypto.randomBytes(32).toString("hex");
        console.warn(
          "[Security Notice] ADMIN_BOOTSTRAP_KEY not configured in production. Generated strong ephemeral runtime key."
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
      return null;
    }
    return decoded;
  } catch (error) {
    return null;
  }
}
async function createSessionCookie(idToken, expiresInMs = 14 * 24 * 60 * 60 * 1e3) {
  return getAuth().createSessionCookie(idToken, { expiresIn: expiresInMs });
}
async function verifySessionCookie(sessionCookie, checkRevoked = true) {
  try {
    return await getAuth().verifySessionCookie(sessionCookie, checkRevoked);
  } catch (error) {
    return null;
  }
}
async function getOrCreateUserInFirestore(decodedToken) {
  const uid = decodedToken.uid;
  const email = (decodedToken.email || "").toLowerCase().trim();
  const name = decodedToken.name || email.split("@")[0] || "User";
  const photoURL = decodedToken.picture || "";
  const userRef = adminDb.collection("users").doc(uid);
  const userSnap = await userRef.get();
  const now = (/* @__PURE__ */ new Date()).toISOString();
  if (userSnap.exists) {
    const data = userSnap.data();
    return {
      uid,
      email: data.email || email,
      name: data.name || name,
      photoURL: data.photoURL || photoURL,
      role: data.role === "admin" ? "admin" : "user",
      createdAt: data.createdAt || now,
      updatedAt: data.updatedAt || now
    };
  }
  const newUser = {
    uid,
    email,
    name,
    photoURL,
    role: "user",
    createdAt: now,
    updatedAt: now
  };
  await userRef.set(newUser);
  return newUser;
}
async function getUserByUid(uid) {
  try {
    const userRef = adminDb.collection("users").doc(uid);
    const userSnap = await userRef.get();
    if (!userSnap.exists) {
      return null;
    }
    const data = userSnap.data();
    return {
      uid: data.uid,
      email: data.email,
      name: data.name,
      photoURL: data.photoURL,
      role: data.role === "admin" ? "admin" : "user",
      createdAt: data.createdAt,
      updatedAt: data.updatedAt
    };
  } catch (error) {
    return null;
  }
}
async function bootstrapAdminAccount(uid, bootstrapKey) {
  const activeKey = getActiveAdminBootstrapKey();
  if (!bootstrapKey || bootstrapKey !== activeKey) {
    throw new Error("INVALID_BOOTSTRAP_KEY: Authorization failed.");
  }
  const user = await getUserByUid(uid);
  if (!user) {
    throw new Error("USER_NOT_FOUND: User account does not exist.");
  }
  if (user.email.toLowerCase().trim() !== DESIGNATED_ADMIN_EMAIL) {
    throw new Error(
      `UNAUTHORIZED_ADMIN_EMAIL: Only designated administrator email (${DESIGNATED_ADMIN_EMAIL}) may be bootstrapped.`
    );
  }
  const updatedTime = (/* @__PURE__ */ new Date()).toISOString();
  await adminDb.collection("users").doc(uid).update({
    role: "admin",
    updatedAt: updatedTime
  });
  await getAuth().setCustomUserClaims(uid, { admin: true });
  return {
    ...user,
    role: "admin",
    updatedAt: updatedTime
  };
}

// server/middleware/authMiddleware.ts
import crypto2 from "crypto";
var csrfTokens = /* @__PURE__ */ new Map();
function generateCsrfToken(uid) {
  const token = crypto2.randomBytes(32).toString("hex");
  csrfTokens.set(uid, token);
  return token;
}
function verifyCsrfToken(uid, providedToken) {
  if (!uid || !providedToken) return false;
  const storedToken = csrfTokens.get(uid);
  if (!storedToken) return false;
  const a = Buffer.from(storedToken);
  const b = Buffer.from(providedToken);
  if (a.length !== b.length) return false;
  return crypto2.timingSafeEqual(a, b);
}
async function requireAuth(req, res, next) {
  let token;
  if (req.cookies && req.cookies.ais_session) {
    token = req.cookies.ais_session;
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
  if (!decoded) {
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
      sessionCookie = await createSessionCookie(idToken);
    } catch {
      sessionCookie = idToken;
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
      const updatedUser = await bootstrapAdminAccount(req.user.uid, bootstrapKey);
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
  const secret = process.env.SESSION_SECRET;
  const FALLBACK_DEV_SECRET = "dev-obsidian-crimson-secret-key-32chars!!";
  if (isProduction && (!secret || secret === FALLBACK_DEV_SECRET || secret.length < 32)) {
    console.warn(
      "[SECURITY WARNING] Production SESSION_SECRET is missing or weak. Set a strong SESSION_SECRET env variable."
    );
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
