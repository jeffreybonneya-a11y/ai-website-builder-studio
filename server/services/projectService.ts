import { adminDb } from './authService';

export interface WorkspaceFile {
  id: string;
  name: string;
  language: 'html' | 'css' | 'javascript' | 'json';
  content: string;
  updatedAt?: string;
}

export interface Project {
  id: string;
  ownerId: string;
  title: string;
  description?: string;
  status: 'draft' | 'published' | 'archived';
  files?: WorkspaceFile[];
  activeFileId?: string;
  revision?: number;
  createdAt: string;
  updatedAt: string;
}

/**
 * Generates reusable, deterministic starter files for web projects.
 */
export function getDefaultProjectFiles(): WorkspaceFile[] {
  const now = new Date().toISOString();
  return [
    {
      id: 'file-index-html',
      name: 'index.html',
      language: 'html',
      content: `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Sample Website</title>
  <link rel="stylesheet" href="styles.css" />
</head>
<body>
  <div class="container">
    <div class="badge">AI STUDIO WORKSPACE</div>
    <h1>Welcome to Your Project</h1>
    <p>This is a starter website layout generated for your project workspace.</p>
    <button id="ctaBtn" class="btn">Explore Features</button>
  </div>
  <script src="app.js"></script>
</body>
</html>`,
      updatedAt: now,
    },
    {
      id: 'file-styles-css',
      name: 'styles.css',
      language: 'css',
      content: `body {
  margin: 0;
  padding: 0;
  font-family: 'Inter', system-ui, sans-serif;
  background-color: #0b0b0b;
  color: #ffffff;
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 100vh;
}

.container {
  max-width: 520px;
  padding: 2.5rem;
  background-color: #141414;
  border: 1px solid #303030;
  border-radius: 16px;
  text-align: center;
  box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.5);
}

.badge {
  display: inline-block;
  padding: 0.25rem 0.75rem;
  background-color: rgba(229, 72, 77, 0.15);
  border: 1px solid rgba(229, 72, 77, 0.4);
  color: #e5484d;
  font-size: 0.75rem;
  font-family: monospace;
  border-radius: 6px;
  margin-bottom: 1rem;
}

h1 {
  font-family: 'Plus Jakarta Sans', sans-serif;
  color: #ffffff;
  margin-top: 0;
  font-size: 1.75rem;
}

p {
  color: #b0b0b0;
  font-size: 0.95rem;
  line-height: 1.6;
}

.btn {
  margin-top: 1.5rem;
  padding: 0.75rem 1.5rem;
  background-color: #e5484d;
  color: #ffffff;
  border: none;
  border-radius: 8px;
  font-weight: 600;
  cursor: pointer;
  transition: background-color 0.2s;
}

.btn:hover {
  background-color: #d43d42;
}`,
      updatedAt: now,
    },
    {
      id: 'file-app-js',
      name: 'app.js',
      language: 'javascript',
      content: `// Sample Client-Side JavaScript
document.addEventListener('DOMContentLoaded', () => {
  const button = document.getElementById('ctaBtn');
  if (button) {
    button.addEventListener('click', () => {
      alert('Sample Button Interactivity Working!');
    });
  }
});`,
      updatedAt: now,
    },
  ];
}

// Validation Limits
export const MAX_FILES_PER_PROJECT = 30;
export const MAX_CHAR_PER_FILE = 50000;
export const MAX_COMBINED_CHAR_PER_PROJECT = 500000;
export const MAX_SERIALIZED_BYTES = 750000; // ~750 KiB safely below 1 MiB limit
export const ALLOWED_LANGUAGES: WorkspaceFile['language'][] = ['html', 'css', 'javascript', 'json'];

/**
 * Validates incoming file collections against format, path traversal, uniqueness, and size limits.
 */
export function validateWorkspaceFiles(files: any): { valid: boolean; error?: string } {
  if (!Array.isArray(files)) {
    return { valid: false, error: 'Files payload must be an array.' };
  }

  if (files.length > MAX_FILES_PER_PROJECT) {
    return {
      valid: false,
      error: `Project cannot exceed maximum of ${MAX_FILES_PER_PROJECT} files. Got ${files.length}.`,
    };
  }

  const seenIds = new Set<string>();
  const seenNames = new Set<string>();
  let totalChars = 0;

  for (let i = 0; i < files.length; i++) {
    const file = files[i];

    if (!file || typeof file !== 'object') {
      return { valid: false, error: `Invalid file entry at index ${i}.` };
    }

    // ID validation
    if (!file.id || typeof file.id !== 'string' || file.id.trim().length === 0) {
      return { valid: false, error: `File at index ${i} is missing a valid ID.` };
    }
    const cleanId = file.id.trim();
    if (seenIds.has(cleanId)) {
      return { valid: false, error: `Duplicate file ID detected: '${cleanId}'.` };
    }
    seenIds.add(cleanId);

    // Name validation
    if (!file.name || typeof file.name !== 'string' || file.name.trim().length === 0) {
      return { valid: false, error: `File '${cleanId}' is missing a valid name.` };
    }
    const fileName = file.name.trim();

    // Path traversal check
    if (
      fileName.includes('..') ||
      fileName.includes('\\') ||
      fileName.startsWith('/') ||
      fileName.includes('\0') ||
      !/^[a-zA-Z0-9_\-\.\/]+$/.test(fileName)
    ) {
      return {
        valid: false,
        error: `File name '${fileName}' contains disallowed characters or path traversal patterns.`,
      };
    }

    const lowerName = fileName.toLowerCase();
    if (seenNames.has(lowerName)) {
      return { valid: false, error: `Duplicate file name detected: '${fileName}'.` };
    }
    seenNames.add(lowerName);

    // Language validation
    if (!ALLOWED_LANGUAGES.includes(file.language)) {
      return {
        valid: false,
        error: `File '${fileName}' has unsupported language '${file.language}'. Allowed: ${ALLOWED_LANGUAGES.join(', ')}.`,
      };
    }

    // Content validation
    if (typeof file.content !== 'string') {
      return { valid: false, error: `File '${fileName}' content must be a string.` };
    }

    if (file.content.length > MAX_CHAR_PER_FILE) {
      return {
        valid: false,
        error: `File '${fileName}' exceeds maximum limit of ${MAX_CHAR_PER_FILE} characters. Got ${file.content.length}.`,
      };
    }

    totalChars += file.content.length;
  }

  if (totalChars > MAX_COMBINED_CHAR_PER_PROJECT) {
    return {
      valid: false,
      error: `Combined project content exceeds maximum limit of ${MAX_COMBINED_CHAR_PER_PROJECT} characters. Got ${totalChars}.`,
    };
  }

  // UTF-8 Serialized Byte Limit
  const serializedBytes = Buffer.byteLength(JSON.stringify(files), 'utf8');
  if (serializedBytes > MAX_SERIALIZED_BYTES) {
    return {
      valid: false,
      error: `Serialized file payload (${serializedBytes} bytes) exceeds safety limit of ${MAX_SERIALIZED_BYTES} bytes.`,
    };
  }

  return { valid: true };
}

// In-memory fallback store for offline/uncredentialed runtime environments
const memoryProjects = new Map<string, Project>();

export async function getUserProjects(ownerId: string): Promise<Project[]> {
  const projects: Project[] = [];

  try {
    const snap = await adminDb
      .collection('projects')
      .where('ownerId', '==', ownerId)
      .get();

    snap.forEach((doc) => {
      projects.push(doc.data() as Project);
    });
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    console.warn(`[Project Service] getUserProjects adminDb notice: ${msg}`);

    // Retrieve from memory store for fallback
    memoryProjects.forEach((proj) => {
      if (proj.ownerId === ownerId) {
        projects.push(proj);
      }
    });
  }

  // Ensure projects have files initialized
  projects.forEach((p) => {
    if (!p.files || p.files.length === 0) {
      p.files = getDefaultProjectFiles();
      p.activeFileId = p.files[0]?.id;
      p.revision = p.revision || 1;
    }
  });

  // Sort by updatedAt descending
  return projects.sort(
    (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
  );
}

export async function getProjectById(
  id: string,
  ownerId: string
): Promise<Project | null> {
  let proj: Project | null = null;

  try {
    const docRef = adminDb.collection('projects').doc(id);
    const snap = await docRef.get();

    if (snap.exists) {
      const data = snap.data() as Project;
      if (data.ownerId === ownerId) {
        proj = data;
      }
    }
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    console.warn(`[Project Service] getProjectById adminDb notice: ${msg}`);

    const memProj = memoryProjects.get(id);
    if (memProj && memProj.ownerId === ownerId) {
      proj = memProj;
    }
  }

  if (proj) {
    if (!proj.files || proj.files.length === 0) {
      proj.files = getDefaultProjectFiles();
      proj.activeFileId = proj.files[0]?.id;
      proj.revision = proj.revision || 1;
    }
    return proj;
  }

  return null;
}

export async function createProject(
  ownerId: string,
  data: { title: string; description?: string; status?: 'draft' | 'published' | 'archived' }
): Promise<Project> {
  const now = new Date().toISOString();
  const id = `proj_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
  const defaultFiles = getDefaultProjectFiles();

  const project: Project = {
    id,
    ownerId,
    title: data.title.trim(),
    description: data.description ? data.description.trim() : '',
    status: data.status || 'draft',
    files: defaultFiles,
    activeFileId: defaultFiles[0]?.id,
    revision: 1,
    createdAt: now,
    updatedAt: now,
  };

  memoryProjects.set(id, project);

  try {
    await adminDb.collection('projects').doc(id).set(project);
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    console.warn(`[Project Service] createProject adminDb notice: ${msg}`);
  }

  return project;
}

export async function updateProject(
  id: string,
  ownerId: string,
  updates: { title?: string; description?: string; status?: 'draft' | 'published' | 'archived' }
): Promise<Project | null> {
  const existing = await getProjectById(id, ownerId);
  if (!existing) {
    return null;
  }

  const now = new Date().toISOString();
  const updatedProject: Project = {
    ...existing,
    title: updates.title !== undefined ? updates.title.trim() : existing.title,
    description: updates.description !== undefined ? updates.description.trim() : existing.description,
    status: updates.status || existing.status,
    updatedAt: now,
  };

  memoryProjects.set(id, updatedProject);

  try {
    await adminDb.collection('projects').doc(id).set(updatedProject, { merge: true });
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    console.warn(`[Project Service] updateProject adminDb notice: ${msg}`);
  }

  return updatedProject;
}

export class RevisionConflictError extends Error {
  public currentRevision: number;
  constructor(message: string, currentRevision: number) {
    super(message);
    this.name = 'RevisionConflictError';
    this.currentRevision = currentRevision;
  }
}

export class DurableStorageError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'DurableStorageError';
  }
}

const projectLocks = new Map<string, Promise<void>>();

/**
 * Synchronizes execution per project ID for in-memory fallback operations.
 */
async function withProjectLock<T>(projectId: string, fn: () => Promise<T>): Promise<T> {
  const currentLock = projectLocks.get(projectId) || Promise.resolve();
  let releaseLock: () => void;

  const newLock = new Promise<void>((resolve) => {
    releaseLock = resolve;
  });

  projectLocks.set(projectId, currentLock.then(() => newLock));

  try {
    await currentLock;
    return await fn();
  } finally {
    releaseLock!();
    if (projectLocks.get(projectId) === newLock) {
      projectLocks.delete(projectId);
    }
  }
}

async function updateProjectFilesInMemory(
  id: string,
  ownerId: string,
  incomingFiles: WorkspaceFile[],
  expectedRevision?: number,
  activeFileId?: string
): Promise<{ project: Project; revision: number }> {
  return withProjectLock(id, async () => {
    const existing = memoryProjects.get(id);
    if (!existing || existing.ownerId !== ownerId) {
      throw new Error('PROJECT_NOT_FOUND');
    }

    const currentRevision = existing.revision || 1;
    if (expectedRevision !== undefined && expectedRevision !== currentRevision) {
      throw new RevisionConflictError(
        `Revision mismatch. Current revision is ${currentRevision}, but expected ${expectedRevision}.`,
        currentRevision
      );
    }

    const now = new Date().toISOString();
    const nextRevision = currentRevision + 1;

    const sanitizedFiles: WorkspaceFile[] = incomingFiles.map((f) => ({
      id: f.id.trim(),
      name: f.name.trim(),
      language: f.language,
      content: f.content,
      updatedAt: f.updatedAt || now,
    }));

    const updatedProject: Project = {
      ...existing,
      files: sanitizedFiles,
      activeFileId: activeFileId || existing.activeFileId || sanitizedFiles[0]?.id,
      revision: nextRevision,
      updatedAt: now,
    };

    memoryProjects.set(id, updatedProject);

    return { project: updatedProject, revision: nextRevision };
  });
}

/**
 * Updates a project's workspace files with atomic Firestore transaction revision protection,
 * payload validation, ownership checks, revision increment, and durable persistence error handling.
 */
export async function updateProjectFiles(
  id: string,
  ownerId: string,
  incomingFiles: WorkspaceFile[],
  expectedRevision?: number,
  activeFileId?: string
): Promise<{ project: Project; revision: number }> {
  // Validate incoming files payload upfront
  const validation = validateWorkspaceFiles(incomingFiles);
  if (!validation.valid) {
    throw new Error(`INVALID_FILES_PAYLOAD: ${validation.error}`);
  }

  const docRef = adminDb.collection('projects').doc(id);

  try {
    const result = await adminDb.runTransaction(async (transaction) => {
      const snap = await transaction.get(docRef);

      if (!snap.exists) {
        throw new Error('PROJECT_NOT_FOUND');
      }

      const data = snap.data() as Project;
      if (data.ownerId !== ownerId) {
        throw new Error('PROJECT_NOT_FOUND');
      }

      const currentRevision = data.revision || 1;
      if (expectedRevision !== undefined && expectedRevision !== currentRevision) {
        throw new RevisionConflictError(
          `Revision mismatch. Current revision is ${currentRevision}, but expected ${expectedRevision}.`,
          currentRevision
        );
      }

      const now = new Date().toISOString();
      const nextRevision = currentRevision + 1;

      const sanitizedFiles: WorkspaceFile[] = incomingFiles.map((f) => ({
        id: f.id.trim(),
        name: f.name.trim(),
        language: f.language,
        content: f.content,
        updatedAt: f.updatedAt || now,
      }));

      const updatedProject: Project = {
        ...data,
        files: sanitizedFiles,
        activeFileId: activeFileId || data.activeFileId || sanitizedFiles[0]?.id,
        revision: nextRevision,
        updatedAt: now,
      };

      transaction.set(docRef, updatedProject, { merge: true });

      return { project: updatedProject, revision: nextRevision };
    });

    // Always sync memoryProjects store on successful Firestore transaction
    memoryProjects.set(id, result.project);
    return result;
  } catch (error) {
    if (
      error instanceof RevisionConflictError ||
      (error instanceof Error &&
        (error.message === 'PROJECT_NOT_FOUND' || error.message.startsWith('INVALID_FILES_PAYLOAD:')))
    ) {
      throw error;
    }

    const msg = error instanceof Error ? error.message : String(error);
    console.warn(`[Project Service] updateProjectFiles adminDb transaction notice: ${msg}`);

    // Critical Production Persistence Rule: In production, do not hide a Firestore failure behind memory fallback
    if (process.env.NODE_ENV === 'production') {
      throw new DurableStorageError(`Failed to persist project files to Cloud Firestore: ${msg}`);
    }

    return await updateProjectFilesInMemory(id, ownerId, incomingFiles, expectedRevision, activeFileId);
  }
}

export async function deleteProject(id: string, ownerId: string): Promise<boolean> {
  const existing = await getProjectById(id, ownerId);
  if (!existing) {
    return false;
  }

  memoryProjects.delete(id);

  try {
    await adminDb.collection('projects').doc(id).delete();
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    console.warn(`[Project Service] deleteProject adminDb notice: ${msg}`);
  }

  return true;
}

