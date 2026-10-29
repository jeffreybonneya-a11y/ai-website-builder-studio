import { Router, Response } from 'express';
import {
  requireAuth,
  requireCsrf,
  AuthenticatedRequest,
} from '../middleware/authMiddleware';
import {
  getUserProjects,
  getProjectById,
  createProject,
  updateProject,
  deleteProject,
} from '../services/projectService';

export const projectRouter = Router();

// Apply auth requirement to all project routes
projectRouter.use(requireAuth);

/**
 * GET /api/projects - List all projects owned by the authenticated user
 */
projectRouter.get('/', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const ownerId = req.user!.uid;
    const projects = await getUserProjects(ownerId);
    res.status(200).json({ projects });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to fetch projects';
    res.status(500).json({ error: message });
  }
});

/**
 * POST /api/projects - Create a new project for the authenticated user (Requires CSRF)
 */
projectRouter.post('/', requireCsrf, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const ownerId = req.user!.uid;
    const { title, description, status } = req.body || {};

    if (!title || typeof title !== 'string' || title.trim().length === 0) {
      res.status(400).json({ error: 'Project title is required and cannot be empty.' });
      return;
    }

    if (title.trim().length > 200) {
      res.status(400).json({ error: 'Project title cannot exceed 200 characters.' });
      return;
    }

    const project = await createProject(ownerId, { title, description, status });
    res.status(201).json({
      message: 'Project created successfully.',
      project,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to create project';
    res.status(500).json({ error: message });
  }
});

/**
 * GET /api/projects/:id - Get a specific project owned by the authenticated user
 */
projectRouter.get('/:id', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const ownerId = req.user!.uid;
    const { id } = req.params;

    const project = await getProjectById(id, ownerId);
    if (!project) {
      res.status(404).json({ error: 'Project not found or access denied.' });
      return;
    }

    res.status(200).json({ project });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to fetch project';
    res.status(500).json({ error: message });
  }
});

/**
 * PUT /api/projects/:id - Update or rename a project owned by the authenticated user (Requires CSRF)
 */
projectRouter.put('/:id', requireCsrf, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const ownerId = req.user!.uid;
    const { id } = req.params;
    const { title, description, status } = req.body || {};

    if (title !== undefined && (typeof title !== 'string' || title.trim().length === 0)) {
      res.status(400).json({ error: 'Project title cannot be empty.' });
      return;
    }

    if (title && title.trim().length > 200) {
      res.status(400).json({ error: 'Project title cannot exceed 200 characters.' });
      return;
    }

    const updated = await updateProject(id, ownerId, { title, description, status });
    if (!updated) {
      res.status(404).json({ error: 'Project not found or access denied.' });
      return;
    }

    res.status(200).json({
      message: 'Project updated successfully.',
      project: updated,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to update project';
    res.status(500).json({ error: message });
  }
});

/**
 * DELETE /api/projects/:id - Delete a project owned by the authenticated user (Requires CSRF)
 */
projectRouter.delete('/:id', requireCsrf, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const ownerId = req.user!.uid;
    const { id } = req.params;

    const deleted = await deleteProject(id, ownerId);
    if (!deleted) {
      res.status(404).json({ error: 'Project not found or access denied.' });
      return;
    }

    res.status(200).json({ message: 'Project deleted successfully.', id });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to delete project';
    res.status(500).json({ error: message });
  }
});
