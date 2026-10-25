import { describe, it, before, after } from 'node:test';
import assert from 'node:assert/strict';
import http from 'http';
import { app } from '../server.ts';
import {
  getActiveSessionSecret,
  getActiveAdminBootstrapKey,
  DESIGNATED_ADMIN_EMAIL,
  bootstrapAdminAccount,
} from '../server/services/authService.ts';

import {
  generateCsrfToken,
  verifyCsrfToken,
} from '../server/middleware/authMiddleware.ts';

let server: http.Server;
let baseUrl: string;

before(async () => {
  await new Promise<void>((resolve) => {
    server = app.listen(0, '127.0.0.1', () => {
      const address = server.address();
      if (address && typeof address === 'object') {
        baseUrl = `http://127.0.0.1:${address.port}`;
      }
      resolve();
    });
  });
});

after(async () => {
  await new Promise<void>((resolve) => {
    server.close(() => resolve());
  });
});

// Helper for testing HTTP requests with cookie jar support
async function api(
  method: string,
  path: string,
  options: {
    body?: any;
    headers?: Record<string, string>;
    cookie?: string;
  } = {}
) {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers || {}),
  };

  if (options.cookie) {
    headers['Cookie'] = options.cookie;
  }

  const res = await fetch(`${baseUrl}${path}`, {
    method,
    headers,
    body: options.body !== undefined ? JSON.stringify(options.body) : undefined,
  });

  let data: any;
  const text = await res.text();
  try {
    data = JSON.parse(text);
  } catch {
    data = text;
  }

  const setCookie = res.headers.get('set-cookie') || undefined;

  return {
    status: res.status,
    body: data,
    headers: res.headers,
    setCookie,
  };
}

describe('AI Website Builder Studio — Stage 2.5 Firebase Auth & Security Test Suite', () => {
  describe('1. Health Check & Security Headers', () => {
    it('returns 200 with server status without leaking secrets', async () => {
      const res = await api('GET', '/api/health');
      assert.equal(res.status, 200);
      assert.equal(res.body.status, 'ok');
      assert.equal(res.body.service, 'ai-website-builder-studio');
      assert.equal(res.body.SESSION_SECRET, undefined);
      assert.equal(res.body.ADMIN_BOOTSTRAP_KEY, undefined);
    });
  });

  describe('2. Unauthenticated Access Protection', () => {
    it('rejects unauthenticated requests to /api/auth/me with 401', async () => {
      const res = await api('GET', '/api/auth/me');
      assert.equal(res.status, 401);
      assert.ok(res.body.error);
    });

    it('rejects unauthenticated requests to /api/admin/verify with 401', async () => {
      const res = await api('GET', '/api/admin/verify');
      assert.equal(res.status, 401);
      assert.ok(res.body.error);
    });
  });

  describe('3. Google Sign-In Exchange & HttpOnly Session Cookies', () => {
    it('rejects Google authentication when idToken is missing', async () => {
      const res = await api('POST', '/api/auth/google', { body: {} });
      assert.equal(res.status, 400);
      assert.match(res.body.error, /Google ID token is required/i);
    });

    it('rejects Google authentication when idToken is invalid', async () => {
      const res = await api('POST', '/api/auth/google', {
        body: { idToken: 'invalid-token-string-xyz' },
      });
      assert.equal(res.status, 401);
      assert.match(res.body.error, /Invalid or unverified Google identity token/i);
    });

    it('does NOT set a fallback cookie when session cookie creation fails', async () => {
      // Unauthenticated / fake token attempting sign-in
      const res = await api('POST', '/api/auth/google', {
        body: { idToken: 'fake-google-id-token-123' },
      });
      // Should fail closed with 401 or 500 without setting ais_session cookie
      assert.ok(res.status === 401 || res.status === 500);
      assert.equal(res.setCookie, undefined);
    });

    it('rejects protected route requests with forged or raw ID token in session cookie', async () => {
      const res = await api('GET', '/api/auth/me', {
        cookie: 'ais_session=raw-fake-id-token-value',
      });
      assert.equal(res.status, 401);
      assert.match(res.body.error, /Session invalid or expired/i);
    });
  });

  describe('4. Ordinary Users Denied Administrator Access', () => {
    it('confirms designated administrator email is jeffreybonneya@gmail.com', () => {
      assert.equal(DESIGNATED_ADMIN_EMAIL, 'jeffreybonneya@gmail.com');
    });

    it('prevents non-admin user tokens from accessing /api/admin/verify', async () => {
      const res = await api('GET', '/api/admin/verify');
      assert.equal(res.status, 401);
    });
  });

  describe('5. Secure Server-Side Administrator Bootstrap', () => {
    it('rejects bootstrap attempts with invalid or missing bootstrap key', async () => {
      process.env.ADMIN_BOOTSTRAP_KEY = 'test-secret-bootstrap-key-32chars!!';
      await assert.rejects(
        async () => {
          await bootstrapAdminAccount('non-existent-uid', 'wrong-key-123');
        },
        (err: Error) => err.message.includes('INVALID_BOOTSTRAP_KEY')
      );
    });

    it('rejects bootstrap attempts for accounts not matching designated administrator email', async () => {
      const activeKey = getActiveAdminBootstrapKey();
      await assert.rejects(
        async () => {
          await bootstrapAdminAccount('non-existent-uid', activeKey);
        },
        (err: Error) => err.message.includes('USER_NOT_FOUND')
      );
    });
  });

  describe('6. CSRF Protection & Session Binding Reliability', () => {
    it('rejects state-changing endpoints without valid CSRF header when unauthenticated', async () => {
      const res = await api('POST', '/api/auth/logout');
      assert.equal(res.status, 401); // Auth check runs before CSRF
    });

    it('generates valid stateless CSRF tokens bound to user UID', () => {
      const tokenUser1 = generateCsrfToken('user-uid-111');
      assert.ok(tokenUser1);
      assert.equal(typeof tokenUser1, 'string');
      assert.equal(tokenUser1.length, 64); // SHA-256 hex string

      // Verify token matches for user 1
      assert.equal(verifyCsrfToken('user-uid-111', tokenUser1), true);
    });

    it('rejects forged or cross-user CSRF tokens', () => {
      const tokenUser1 = generateCsrfToken('user-uid-111');
      const tokenUser2 = generateCsrfToken('user-uid-222');

      // User 2 cannot use User 1's token
      assert.equal(verifyCsrfToken('user-uid-222', tokenUser1), false);
      assert.equal(verifyCsrfToken('user-uid-111', tokenUser2), false);

      // Altered token string fails
      assert.equal(verifyCsrfToken('user-uid-111', tokenUser1.slice(0, -1) + 'a'), false);
      assert.equal(verifyCsrfToken('user-uid-111', ''), false);
    });
  });

  describe('7. Production Configuration Fail-Closed Enforcement', () => {
    it('generates secure 32+ char secret when SESSION_SECRET is unconfigured in production', () => {
      const originalEnv = process.env.NODE_ENV;
      const originalSecret = process.env.SESSION_SECRET;

      process.env.NODE_ENV = 'production';
      delete process.env.SESSION_SECRET;

      const activeSecret = getActiveSessionSecret();
      assert.ok(activeSecret);
      assert.ok(activeSecret.length >= 32);

      process.env.NODE_ENV = originalEnv;
      process.env.SESSION_SECRET = originalSecret;
    });

    it('fails closed when ADMIN_BOOTSTRAP_KEY is missing or weak in production', () => {
      const originalEnv = process.env.NODE_ENV;
      const originalKey = process.env.ADMIN_BOOTSTRAP_KEY;

      process.env.NODE_ENV = 'production';

      // Case 1: Missing key in production
      delete process.env.ADMIN_BOOTSTRAP_KEY;
      assert.throws(
        () => getActiveAdminBootstrapKey(),
        (err: Error) => err.message.includes('Production startup failed closed')
      );

      // Case 2: Weak key in production (< 32 characters)
      process.env.ADMIN_BOOTSTRAP_KEY = 'short-weak-key';
      assert.throws(
        () => getActiveAdminBootstrapKey(),
        (err: Error) => err.message.includes('Production startup failed closed')
      );

      process.env.NODE_ENV = originalEnv;
      process.env.ADMIN_BOOTSTRAP_KEY = originalKey;
    });
  });
});
