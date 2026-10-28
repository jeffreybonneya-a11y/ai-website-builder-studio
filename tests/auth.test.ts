import { describe, it, before, after } from 'node:test';
import assert from 'node:assert/strict';
import http from 'http';
import { app } from '../server.ts';
import {
  getActiveSessionSecret,
  getActiveAdminBootstrapKey,
  getAdminAllowlist,
  isDesignatedAdmin,
  getUserRole,
  getOrCreateUserInFirestore,
  bootstrapAdminAccount,
} from '../server/services/authService.ts';

import {
  generateCsrfToken,
  verifyCsrfToken,
  requireAdmin,
  AuthenticatedRequest,
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

describe('AI Website Builder Studio — Secure Auth & Two-Admin Test Suite', () => {
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

  describe('2. Unauthenticated Access Protection (HTTP 401)', () => {
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

    it('rejects Google authentication when idToken is invalid or unverified', async () => {
      const res = await api('POST', '/api/auth/google', {
        body: { idToken: 'invalid-token-string-xyz' },
      });
      assert.equal(res.status, 401);
      assert.match(res.body.error, /Invalid or unverified Google identity token/i);
    });

    it('does NOT set a fallback cookie when session cookie creation fails', async () => {
      const res = await api('POST', '/api/auth/google', {
        body: { idToken: 'fake-google-id-token-123' },
      });
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

  describe('4. Two-Admin Allowlist & Server-Authoritative Role Determination', () => {
    it('confirms both designated administrator emails in the allowlist', () => {
      const allowlist = getAdminAllowlist();
      assert.ok(allowlist.includes('jeffreybonneya@gmail.com'));
      assert.ok(allowlist.includes('jonasagyapong282@gmail.com'));
    });

    it('evaluates role as "admin" for both designated administrator accounts', () => {
      assert.equal(getUserRole('jeffreybonneya@gmail.com'), 'admin');
      assert.equal(getUserRole('JonasAgyapong282@gmail.com '), 'admin'); // handles case/whitespace
      assert.equal(isDesignatedAdmin('jeffreybonneya@gmail.com'), true);
      assert.equal(isDesignatedAdmin('jonasagyapong282@gmail.com'), true);
    });

    it('evaluates role as "user" for ordinary Google accounts', () => {
      assert.equal(getUserRole('ordinary.user@example.com'), 'user');
      assert.equal(getUserRole('attacker@malicious.domain'), 'user');
      assert.equal(isDesignatedAdmin('ordinary.user@example.com'), false);
    });

    it('rejects forged client-supplied administrator roles during user creation', async () => {
      const mockDecodedToken: any = {
        uid: 'user-uid-ordinary-999',
        email: 'ordinary.user@example.com',
        name: 'Ordinary User',
        email_verified: true,
        picture: 'https://example.com/photo.jpg',
        role: 'admin', // Attacker sends role: 'admin' in token or request payload
      };

      const user = await getOrCreateUserInFirestore(mockDecodedToken);
      assert.equal(user.role, 'user'); // Server strictly enforces role: 'user'
      assert.equal(user.email, 'ordinary.user@example.com');
    });

    it('grants admin role to designated administrators upon identity verification', async () => {
      const mockDecodedAdmin1: any = {
        uid: 'uid-admin-1',
        email: 'jeffreybonneya@gmail.com',
        name: 'Jeffrey Bonney',
        email_verified: true,
      };

      const mockDecodedAdmin2: any = {
        uid: 'uid-admin-2',
        email: 'jonasagyapong282@gmail.com',
        name: 'Jonas Agyapong',
        email_verified: true,
      };

      const admin1 = await getOrCreateUserInFirestore(mockDecodedAdmin1);
      const admin2 = await getOrCreateUserInFirestore(mockDecodedAdmin2);

      assert.equal(admin1.role, 'admin');
      assert.equal(admin2.role, 'admin');
    });
  });

  describe('5. HTTP 403 Authorization Restrictions for Ordinary Users', () => {
    it('returns 403 when requireAdmin middleware encounters an ordinary user', () => {
      let statusCalled = 0;
      let jsonMessage = '';

      const req: AuthenticatedRequest = {
        user: {
          uid: 'user-123',
          email: 'user@example.com',
          name: 'User',
          role: 'user',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
      } as any;

      const res: any = {
        status: (code: number) => {
          statusCalled = code;
          return {
            json: (data: any) => {
              jsonMessage = data.error;
            },
          };
        },
      };

      let nextCalled = false;
      const next = () => {
        nextCalled = true;
      };

      requireAdmin(req, res, next);

      assert.equal(nextCalled, false);
      assert.equal(statusCalled, 403);
      assert.match(jsonMessage, /Administrator privileges required/i);
    });
  });

  describe('6. Secure Server-Side Administrator Bootstrap', () => {
    it('rejects bootstrap attempts with invalid or missing bootstrap key', async () => {
      await assert.rejects(
        async () => {
          await bootstrapAdminAccount('non-existent-uid', 'wrong-key-123', 'jeffreybonneya@gmail.com');
        },
        (err: Error) => err.message.includes('INVALID_BOOTSTRAP_KEY')
      );
    });

    it('rejects bootstrap attempts for accounts not matching designated administrator emails', async () => {
      const activeKey = getActiveAdminBootstrapKey();
      await assert.rejects(
        async () => {
          await bootstrapAdminAccount('non-existent-uid', activeKey, 'attacker@example.com');
        },
        (err: Error) => err.message.includes('UNAUTHORIZED_ADMIN_EMAIL')
      );
    });
  });

  describe('7. CSRF Protection & Session Binding Reliability', () => {
    it('rejects state-changing endpoints without valid CSRF header when unauthenticated', async () => {
      const res = await api('POST', '/api/auth/logout');
      assert.equal(res.status, 401); // Auth check runs before CSRF
    });

    it('generates valid stateless CSRF tokens bound to user UID', () => {
      const tokenUser1 = generateCsrfToken('user-uid-111');
      assert.ok(tokenUser1);
      assert.equal(typeof tokenUser1, 'string');
      assert.equal(tokenUser1.length, 64); // SHA-256 hex string

      assert.equal(verifyCsrfToken('user-uid-111', tokenUser1), true);
    });

    it('rejects forged or cross-user CSRF tokens', () => {
      const tokenUser1 = generateCsrfToken('user-uid-111');
      const tokenUser2 = generateCsrfToken('user-uid-222');

      assert.equal(verifyCsrfToken('user-uid-222', tokenUser1), false);
      assert.equal(verifyCsrfToken('user-uid-111', tokenUser2), false);
      assert.equal(verifyCsrfToken('user-uid-111', tokenUser1.slice(0, -1) + 'a'), false);
      assert.equal(verifyCsrfToken('user-uid-111', ''), false);
    });
  });

  describe('8. Production Configuration & Secret Generation', () => {
    it('generates secure 32+ char secret when SESSION_SECRET is unconfigured', () => {
      const activeSecret = getActiveSessionSecret();
      assert.ok(activeSecret);
      assert.ok(activeSecret.length >= 32);
    });

    it('generates secure 32+ char key when ADMIN_BOOTSTRAP_KEY is unconfigured', () => {
      const activeKey = getActiveAdminBootstrapKey();
      assert.ok(activeKey);
      assert.ok(activeKey.length >= 32);
    });
  });
});
