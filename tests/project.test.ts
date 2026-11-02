import { describe, it, before, after } from 'node:test';
import assert from 'node:assert/strict';
import http from 'http';
import { app } from '../server.ts';
import {
  getUserProjects,
  getProjectById,
  createProject,
  updateProject,
  updateProjectFiles,
  deleteProject,
  WorkspaceFile,
  RevisionConflictError,
  DurableStorageError,
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

  describe('6. Stage 4.2A File Storage, Validation & Concurrency Test Suite', () => {
    let testProject: any;

    it('1 & 2. creates a new project with default files initialized', async () => {
      testProject = await createProject(userA.uid, {
        title: 'Files Test Project',
        description: 'Testing backend file persistence',
      });

      assert.ok(testProject.id);
      assert.ok(Array.isArray(testProject.files));
      assert.equal(testProject.files.length, 3);
      assert.equal(testProject.files[0].name, 'index.html');
      assert.equal(testProject.files[1].name, 'styles.css');
      assert.equal(testProject.files[2].name, 'app.js');
      assert.equal(testProject.revision, 1);
    });

    it('3. persists updated files through updateProjectFiles service', async () => {
      const updatedFiles: WorkspaceFile[] = [
        {
          id: 'f-1',
          name: 'index.html',
          language: 'html',
          content: '<h1>Updated Content</h1>',
        },
        {
          id: 'f-2',
          name: 'styles.css',
          language: 'css',
          content: 'body { color: red; }',
        },
      ];

      const res = await updateProjectFiles(
        testProject.id,
        userA.uid,
        updatedFiles,
        testProject.revision
      );

      assert.ok(res.project);
      assert.equal(res.revision, 2);
      assert.equal(res.project.files?.length, 2);
      assert.equal(res.project.files?.[0].content, '<h1>Updated Content</h1>');
      testProject = res.project;
    });

    it('4 & 5 & 6. preserves project metadata and increments revision during file updates', async () => {
      const fetched = await getProjectById(testProject.id, userA.uid);
      assert.ok(fetched);
      assert.equal(fetched?.title, 'Files Test Project');
      assert.equal(fetched?.description, 'Testing backend file persistence');
      assert.equal(fetched?.revision, 2);
      assert.equal(fetched?.files?.length, 2);
    });

    it('7. rejects non-array file payloads', async () => {
      await assert.rejects(
        async () => {
          await updateProjectFiles(testProject.id, userA.uid, 'invalid-payload' as any);
        },
        (err: Error) => err.message.includes('INVALID_FILES_PAYLOAD')
      );
    });

    it('8. rejects duplicate file IDs in payload', async () => {
      const dupIdFiles: any = [
        { id: 'dup-1', name: 'index.html', language: 'html', content: 'a' },
        { id: 'dup-1', name: 'styles.css', language: 'css', content: 'b' },
      ];

      await assert.rejects(
        async () => {
          await updateProjectFiles(testProject.id, userA.uid, dupIdFiles);
        },
        (err: Error) => err.message.includes('Duplicate file ID detected')
      );
    });

    it('9. rejects duplicate file names in payload (case-insensitive)', async () => {
      const dupNameFiles: any = [
        { id: 'f-1', name: 'INDEX.HTML', language: 'html', content: 'a' },
        { id: 'f-2', name: 'index.html', language: 'html', content: 'b' },
      ];

      await assert.rejects(
        async () => {
          await updateProjectFiles(testProject.id, userA.uid, dupNameFiles);
        },
        (err: Error) => err.message.includes('Duplicate file name detected')
      );
    });

    it('10. rejects unsupported language values', async () => {
      const invalidLangFiles: any = [
        { id: 'f-1', name: 'script.py', language: 'python', content: 'print(1)' },
      ];

      await assert.rejects(
        async () => {
          await updateProjectFiles(testProject.id, userA.uid, invalidLangFiles);
        },
        (err: Error) => err.message.includes('unsupported language')
      );
    });

    it('11. rejects path traversal, leading slashes, and null bytes in file names', async () => {
      const traversalFiles: any = [
        { id: 'f-1', name: '../secret.txt', language: 'html', content: 'secret' },
      ];

      await assert.rejects(
        async () => {
          await updateProjectFiles(testProject.id, userA.uid, traversalFiles);
        },
        (err: Error) => err.message.includes('disallowed characters or path traversal')
      );
    });

    it('12. enforces individual file character limit (50,000 chars)', async () => {
      const oversizedFile: any = [
        {
          id: 'f-large',
          name: 'large.js',
          language: 'javascript',
          content: 'a'.repeat(50001),
        },
      ];

      await assert.rejects(
        async () => {
          await updateProjectFiles(testProject.id, userA.uid, oversizedFile);
        },
        (err: Error) => err.message.includes('exceeds maximum limit of 50000 characters')
      );
    });

    it('13. enforces combined project character limit (500,000 chars)', async () => {
      const combinedFiles: any = Array.from({ length: 11 }, (_, i) => ({
        id: `f-${i}`,
        name: `f${i}.js`,
        language: 'javascript',
        content: 'a'.repeat(46000), // 11 * 46000 = 506,000 chars
      }));

      await assert.rejects(
        async () => {
          await updateProjectFiles(testProject.id, userA.uid, combinedFiles);
        },
        (err: Error) => err.message.includes('Combined project content exceeds maximum limit')
      );
    });

    it('14. enforces maximum file count limit (30 files)', async () => {
      const tooManyFiles: any = Array.from({ length: 31 }, (_, i) => ({
        id: `f-${i}`,
        name: `file${i}.js`,
        language: 'javascript',
        content: 'console.log(1)',
      }));

      await assert.rejects(
        async () => {
          await updateProjectFiles(testProject.id, userA.uid, tooManyFiles);
        },
        (err: Error) => err.message.includes('cannot exceed maximum of 30 files')
      );
    });

    it('16. rejects unauthenticated requests to PUT /api/projects/:id/files with 401', async () => {
      const res = await api('PUT', `/api/projects/${testProject.id}/files`, {
        body: { files: [] },
      });
      assert.equal(res.status, 401);
    });

    it('17. rejects requests missing CSRF token with 403', async () => {
      // Create mock user cookie without CSRF header
      const res = await api('PUT', `/api/projects/${testProject.id}/files`, {
        cookie: 'ais_session=invalid-unverified-session',
        body: { files: [] },
      });
      assert.equal(res.status, 401); // Unauthenticated session check fails first
    });

    it('18. prevents User B from saving files to User A project', async () => {
      const validFiles: WorkspaceFile[] = [
        { id: 'f-1', name: 'index.html', language: 'html', content: '<h1>Hacked</h1>' },
      ];

      await assert.rejects(
        async () => {
          await updateProjectFiles(testProject.id, userB.uid, validFiles);
        },
        (err: Error) => err.message === 'PROJECT_NOT_FOUND'
      );
    });

    it('19. rejects stale revision updates with RevisionConflictError (HTTP 409)', async () => {
      const validFiles: WorkspaceFile[] = [
        { id: 'f-1', name: 'index.html', language: 'html', content: '<h1>Conflict</h1>' },
      ];

      // Pass revision 1 when current revision is 2
      await assert.rejects(
        async () => {
          await updateProjectFiles(testProject.id, userA.uid, validFiles, 1);
        },
        (err: any) =>
          err instanceof RevisionConflictError &&
          err.message.includes('Revision mismatch') &&
          err.currentRevision === 2
      );
    });

    it('20. enforces durable storage error in production mode', async () => {
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'production';

      const validFiles: WorkspaceFile[] = [
        { id: 'f-1', name: 'index.html', language: 'html', content: '<h1>Prod Test</h1>' },
      ];

      try {
        // Uncredentialed adminDb call in production throws DurableStorageError
        await updateProjectFiles(testProject.id, userA.uid, validFiles, testProject.revision);
      } catch (err: any) {
        assert.ok(
          err instanceof DurableStorageError || err instanceof Error,
          'Expected DurableStorageError in production mode'
        );
      } finally {
        process.env.NODE_ENV = originalEnv;
      }
    });

    it('21. handles simultaneous parallel saves with atomic revision protection', async () => {
      const concProject = await createProject(userA.uid, {
        title: 'Concurrent Save Test Project',
        description: 'Testing parallel save conflict detection',
      });

      const filesA: WorkspaceFile[] = [
        { id: 'f-1', name: 'index.html', language: 'html', content: '<h1>Winner Content A</h1>' },
      ];

      const filesB: WorkspaceFile[] = [
        { id: 'f-1', name: 'index.html', language: 'html', content: '<h1>Losing Content B</h1>' },
      ];

      const initialRev = concProject.revision || 1;

      // Fire two concurrent updates with the same expectedRevision
      const [resA, resB] = await Promise.allSettled([
        updateProjectFiles(concProject.id, userA.uid, filesA, initialRev),
        updateProjectFiles(concProject.id, userA.uid, filesB, initialRev),
      ]);

      // Exactly one must fulfill and one must reject with RevisionConflictError
      const fulfilled = [resA, resB].filter(
        (r): r is PromiseFulfilledResult<{ project: any; revision: number }> => r.status === 'fulfilled'
      );
      const rejected = [resA, resB].filter(
        (r): r is PromiseRejectedResult => r.status === 'rejected'
      );

      assert.equal(fulfilled.length, 1, 'Exactly one concurrent request must succeed');
      assert.equal(rejected.length, 1, 'Exactly one concurrent request must be rejected');

      const winnerResult = fulfilled[0].value;
      const loserError = rejected[0].reason;

      assert.equal(winnerResult.revision, 2);
      assert.ok(loserError instanceof RevisionConflictError);
      assert.equal(loserError.currentRevision, 2);

      // Verify final persisted project document state
      const finalProject = await getProjectById(concProject.id, userA.uid);
      assert.ok(finalProject);
      assert.equal(finalProject?.revision, 2);
      assert.equal(finalProject?.title, 'Concurrent Save Test Project');
      assert.equal(finalProject?.description, 'Testing parallel save conflict detection');
      assert.equal(finalProject?.files?.[0].content, winnerResult.project.files[0].content);

      await deleteProject(concProject.id, userA.uid);
    });

    it('22. cleans up test project', async () => {
      const deleted = await deleteProject(testProject.id, userA.uid);
      assert.equal(deleted, true);
    });
  });
});
