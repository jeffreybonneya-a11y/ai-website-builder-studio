import { adminDb } from './authService';

export interface Project {
  id: string;
  ownerId: string;
  title: string;
  description?: string;
  status: 'draft' | 'published' | 'archived';
  createdAt: string;
  updatedAt: string;
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

  // Sort by updatedAt descending
  return projects.sort(
    (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
  );
}

export async function getProjectById(
  id: string,
  ownerId: string
): Promise<Project | null> {
  try {
    const docRef = adminDb.collection('projects').doc(id);
    const snap = await docRef.get();

    if (snap.exists) {
      const proj = snap.data() as Project;
      if (proj.ownerId === ownerId) {
        return proj;
      }
      return null;
    }
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    console.warn(`[Project Service] getProjectById adminDb notice: ${msg}`);

    const memProj = memoryProjects.get(id);
    if (memProj && memProj.ownerId === ownerId) {
      return memProj;
    }
  }

  return null;
}

export async function createProject(
  ownerId: string,
  data: { title: string; description?: string; status?: 'draft' | 'published' | 'archived' }
): Promise<Project> {
  const now = new Date().toISOString();
  const id = `proj_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;

  const project: Project = {
    id,
    ownerId,
    title: data.title.trim(),
    description: data.description ? data.description.trim() : '',
    status: data.status || 'draft',
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
