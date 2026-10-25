import express, { Request, Response, NextFunction } from 'express';
import cookieParser from 'cookie-parser';
import helmet from 'helmet';
import path from 'path';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { authRouter } from './server/routes/authRoutes';
import { adminRouter } from './server/routes/adminRoutes';

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

  // Production Session Secret Validation Check
  const secret = process.env.SESSION_SECRET;
  const FALLBACK_DEV_SECRET = 'dev-obsidian-crimson-secret-key-32chars!!';

  if (isProduction && (!secret || secret === FALLBACK_DEV_SECRET || secret.length < 32)) {
    console.warn(
      '[SECURITY WARNING] Production SESSION_SECRET is missing or weak. Set a strong SESSION_SECRET env variable.'
    );
  }

  // Production Administrator Bootstrap Key Check — Fail Closed
  if (isProduction) {
    const bootstrapKey = process.env.ADMIN_BOOTSTRAP_KEY;
    const FALLBACK_BOOTSTRAP_KEY = 'dev-admin-bootstrap-key-32chars!!';
    if (!bootstrapKey || bootstrapKey === FALLBACK_BOOTSTRAP_KEY || bootstrapKey.length < 32) {
      throw new Error(
        '[SECURITY FATAL] Production startup failed closed: ADMIN_BOOTSTRAP_KEY environment variable is missing or weak (minimum 32 characters required).'
      );
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
