import express, { Request, Response, NextFunction } from 'express';
import cookieParser from 'cookie-parser';
import helmet from 'helmet';
import path from 'path';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { authRouter } from './server/routes/authRoutes';
import { adminRouter } from './server/routes/adminRoutes';
import { getActiveSessionSecret, getActiveAdminBootstrapKey } from './server/services/authService';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export const app = express();

// Trust proxy header behind reverse proxy (Cloud Run / AI Studio preview environment)
app.set('trust proxy', 1);

// Security HTTP headers via Helmet
app.use(
  helmet({
    contentSecurityPolicy: false, // Disabled for Vite client bundle compatibility in dev/preview
    crossOriginEmbedderPolicy: false,
    crossOriginOpenerPolicy: { policy: 'same-origin-allow-popups' }, // Allows Firebase OAuth popup window.opener communication
  })
);

// Middleware: JSON body parser & cookie parser with strict size limit (100kb)
app.use(express.json({ limit: '100kb' }));
app.use(cookieParser());

// Minimal Health Check Endpoint
// Confirms server availability without exposing secrets, credentials, internal errors, or sensitive configuration
app.get('/api/health', (_req: Request, res: Response) => {
  res.status(200).json({
    status: 'ok',
    service: 'ai-website-builder-studio',
    timestamp: new Date().toISOString(),
    uptime: Math.floor(process.uptime()),
  });
});

// Authentication & Authorization Routes
app.use('/api/auth', authRouter);
app.use('/api/admin', adminRouter);

// Centralized Error Handling Middleware
// Never exposes stack traces or sensitive environment variables in responses
app.use((err: unknown, _req: Request, res: Response, _next: NextFunction) => {
  const message = err instanceof Error ? err.message : 'Unknown error';
  if (process.env.NODE_ENV !== 'test') {
    console.error('[Server Error]:', message);
  }

  res.status(500).json({
    error: 'An internal server error occurred. Please try again later.',
  });
});

// Vite Development or Static Production Asset Serving
export async function startServer() {
  const PORT = parseInt(process.env.PORT || '3000', 10);
  const isProduction = process.env.NODE_ENV === 'production';

  // Initialize runtime session and admin secrets securely
  const activeSecret = getActiveSessionSecret();
  const activeBootstrapKey = getActiveAdminBootstrapKey();
  if (isProduction) {
    if (!process.env.SESSION_SECRET || process.env.SESSION_SECRET.length < 32) {
      console.warn('[Studio Server] SESSION_SECRET not set in env; using cryptographically generated runtime secret.');
    }
    if (!process.env.ADMIN_BOOTSTRAP_KEY || process.env.ADMIN_BOOTSTRAP_KEY.length < 32) {
      console.warn('[Studio Server] ADMIN_BOOTSTRAP_KEY not set in env; using cryptographically generated runtime key.');
    }
  }

  if (!isProduction) {
    // Mount Vite dev server in middleware mode
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    // Serve production build files
    const distPath = path.resolve(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req: Request, res: Response) => {
      res.sendFile(path.resolve(distPath, 'index.html'));
    });
  }

  return app.listen(PORT, '0.0.0.0', () => {
    console.log(`[Studio Server] Running on http://0.0.0.0:${PORT} (env: ${process.env.NODE_ENV || 'development'})`);
  });
}

// Automatically start server when executed directly
if (process.argv[1] && (process.argv[1].endsWith('server.ts') || process.argv[1].endsWith('server.js'))) {
  startServer().catch((err) => {
    console.error('Failed to start server:', err);
    process.exit(1);
  });
}
