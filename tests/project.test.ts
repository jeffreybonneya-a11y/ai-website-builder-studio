import { describe, it, before, after } from 'node:test';
import assert from 'node:assert/strict';
import http from 'http';
import { app } from '../server.ts';
import {
  getUserProjects,
  getProjectById,
  createProject,
  updateProject,
  deleteProject,
} from '../server/services/projectService.ts';
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

// Helper for testing HTTP requests
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

  return {
    status: res.status,
    body: data,
    headers: res.headers,
  };
}

describe('AI Website Builder Studio — Stage 3 Project Management & Per-User Isolation Test Suite', () => {
  const userA = {
    uid: 'user-uid-aaa-111',
    email: 'usera@example.com',
  };

  const userB = {
    uid: 'user-uid-bbb-222',
    email: 'userb@example.com',
  };

  let createdProjectIdUserA: string;

  describe('1. Unauthenticated Endpoint Protection (HTTP 401)', () => {
    it('rejects GET /api/projects without session cookie', async () => {
      const res = await api('GET', '/api/projects');
      assert.equal(res.status, 401);
      assert.ok(res.body.error);
    });

    it('rejects POST /api/projects without session cookie', async () => {
      const res = await api('POST', '/api/projects', {
        body: { title: 'Test Project' },
      });
      assert.equal(res.status, 401);
      assert.ok(res.body.error);
    });

    it('rejects PUT /api/projects/proj-123 without session cookie', async () => {
      const res = await api('PUT', '/api/projects/proj-123', {
        body: { title: 'Updated Title' },
      });
      assert.equal(res.status, 401);
      assert.ok(res.body.error);
    });

    it('rejects DELETE /api/projects/proj-123 without session cookie', async () => {
      const res = await api('DELETE', '/api/projects/proj-123');
      assert.equal(res.status, 401);
      assert.ok(res.body.error);
    });
  });

  describe('2. Project Service Persistence & Owner Binding', () => {
    it('creates a project bound to ownerId', async () => {
      const project = await createProject(
        userA.uid,
        {
          title: 'User A E-Commerce App',
          description: 'Store front for products',
          status: 'draft',
        }
      );

      assert.ok(project.id);
      assert.equal(project.ownerId, userA.uid);
      assert.equal(project.title, 'User A E-Commerce App');
      assert.equal(project.description, 'Store front for products');
      assert.equal(project.status, 'draft');
      assert.ok(project.createdAt);
      assert.ok(project.updatedAt);

      createdProjectIdUserA = project.id;
    });

    it('retrieves project by ID for owner', async () => {
      const project = await getProjectById(createdProjectIdUserA, userA.uid);
      assert.ok(project);
      assert.equal(project?.id, createdProjectIdUserA);
      assert.equal(project?.ownerId, userA.uid);
    });

    it('returns empty list for a user with no projects', async () => {
      const projects = await getUserProjects(userB.uid);
      assert.ok(Array.isArray(projects));
      assert.equal(projects.length, 0);
    });

    it('retrieves user projects isolated to the owner UID', async () => {
      const projectsUserA = await getUserProjects(userA.uid);
      assert.ok(projectsUserA.length >= 1);
      assert.ok(projectsUserA.every((p) => p.ownerId === userA.uid));
    });

    it('updates a project successfully', async () => {
      const updated = await updateProject(
        createdProjectIdUserA,
        userA.uid,
        {
          title: 'User A E-Commerce App (Published)',
          description: 'Updated store description',
          status: 'published',
        }
      );

      assert.ok(updated);
      assert.equal(updated?.title, 'User A E-Commerce App (Published)');
      assert.equal(updated?.status, 'published');
    });
  });

  describe('3. Strict Cross-User Data Isolation (HTTP 403 / Access Prevention)', () => {
    it('prevents User B from accessing User A project by ID', async () => {
      const projectForUserB = await getProjectById(createdProjectIdUserA, userB.uid);
      assert.equal(projectForUserB, null);
    });

    it('prevents User B from updating User A project', async () => {
      const result = await updateProject(
        createdProjectIdUserA,
        userB.uid,
        {
          title: 'Malicious Title Override',
          description: 'Malicious description',
          status: 'archived',
        }
      );
      assert.equal(result, null);

      // Verify original remains intact
      const original = await getProjectById(createdProjectIdUserA, userA.uid);
      assert.equal(original?.title, 'User A E-Commerce App (Published)');
      assert.equal(original?.status, 'published');
    });

    it('prevents User B from deleting User A project', async () => {
      const result = await deleteProject(createdProjectIdUserA, userB.uid);
      assert.equal(result, false);

      // Verify original still exists
      const original = await getProjectById(createdProjectIdUserA, userA.uid);
      assert.ok(original);
    });
  });

  describe('4. CSRF Validation on Project Routes', () => {
    it('validates CSRF tokens generated for project operations', () => {
      const csrfToken = generateCsrfToken(userA.uid);
      assert.ok(csrfToken);
      assert.equal(verifyCsrfToken(userA.uid, csrfToken), true);
      assert.equal(verifyCsrfToken(userB.uid, csrfToken), false);
    });
  });

  describe('5. Clean Project Deletion', () => {
    it('allows owner to delete their project', async () => {
      const result = await deleteProject(createdProjectIdUserA, userA.uid);
      assert.equal(result, true);

      const deleted = await getProjectById(createdProjectIdUserA, userA.uid);
      assert.equal(deleted, null);
    });
  });
});
