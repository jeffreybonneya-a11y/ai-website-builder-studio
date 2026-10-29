import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../context/AuthContext';
import {
  CreateProjectModal,
  EditProjectModal,
  DeleteProjectModal,
  ProjectModalData,
} from './ProjectModals';

export interface Project {
  id: string;
  ownerId: string;
  title: string;
  description: string;
  status: 'draft' | 'published' | 'archived';
  createdAt: string;
  updatedAt: string;
}

interface DashboardProps {
  onOpenProject?: (project: Project) => void;
}

export const Dashboard: React.FC<DashboardProps> = ({ onOpenProject }) => {
  const { user, csrfToken } = useAuth();
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Filter & Search states
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'draft' | 'published' | 'archived'>('all');

  // Modals state
  const [activeModal, setActiveModal] = useState<'create' | 'edit' | 'delete' | 'view' | null>(null);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);

  // Fetch user projects
  const fetchProjects = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/projects', {
        method: 'GET',
        credentials: 'include',
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || 'Failed to fetch projects');
      }

      const data = await res.json();
      setProjects(data.projects || []);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error loading projects';
      setError(msg);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchProjects();
  }, [fetchProjects]);

  // Create project handler
  const handleCreateProject = async (
    title: string,
    description: string,
    status: 'draft' | 'published' | 'archived'
  ): Promise<boolean> => {
    try {
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (csrfToken) {
        headers['x-csrf-token'] = csrfToken;
      }

      const res = await fetch('/api/projects', {
        method: 'POST',
        headers,
        credentials: 'include',
        body: JSON.stringify({ title, description, status }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || 'Failed to create project');
      }

      const data = await res.json();
      if (data.project) {
        setProjects((prev) => [data.project, ...prev]);
        return true;
      }
      return false;
    } catch (err) {
      console.error('Create project error:', err);
      return false;
    }
  };

  // Update project handler
  const handleUpdateProject = async (
    id: string,
    title: string,
    description: string,
    status: 'draft' | 'published' | 'archived'
  ): Promise<boolean> => {
    try {
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (csrfToken) {
        headers['x-csrf-token'] = csrfToken;
      }

      const res = await fetch(`/api/projects/${id}`, {
        method: 'PUT',
        headers,
        credentials: 'include',
        body: JSON.stringify({ title, description, status }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || 'Failed to update project');
      }

      const data = await res.json();
      if (data.project) {
        setProjects((prev) => prev.map((p) => (p.id === id ? data.project : p)));
        return true;
      }
      return false;
    } catch (err) {
      console.error('Update project error:', err);
      return false;
    }
  };

  // Delete project handler
  const handleDeleteProject = async (id: string): Promise<boolean> => {
    try {
      const headers: Record<string, string> = {};
      if (csrfToken) {
        headers['x-csrf-token'] = csrfToken;
      }

      const res = await fetch(`/api/projects/${id}`, {
        method: 'DELETE',
        headers,
        credentials: 'include',
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || 'Failed to delete project');
      }

      setProjects((prev) => prev.filter((p) => p.id !== id));
      return true;
    } catch (err) {
      console.error('Delete project error:', err);
      return false;
    }
  };

  // Filtered projects
  const filteredProjects = projects.filter((project) => {
    const matchesSearch =
      project.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (project.description && project.description.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesStatus = statusFilter === 'all' || project.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  // Format date helper
  const formatDate = (isoString: string) => {
    try {
      const d = new Date(isoString);
      return d.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      });
    } catch {
      return isoString;
    }
  };

  return (
    <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Dashboard Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-[#303030]">
        <div>
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-[#E5484D] text-2xl">dashboard</span>
            <h1 className="text-xl sm:text-2xl font-display font-bold text-white uppercase tracking-tight">
              My Projects Library
            </h1>
          </div>
          <p className="text-xs text-[#B0B0B0] font-body mt-1">
            Manage your AI website builds, drafts, and published deployments. Strictly isolated to{' '}
            <span className="text-white font-medium font-mono">{user?.email}</span>.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={fetchProjects}
            className="p-2.5 rounded-xl bg-[#141414] hover:bg-[#1B1B1B] text-[#B0B0B0] hover:text-white border border-[#303030] transition-colors cursor-pointer"
            title="Refresh Projects"
            aria-label="Refresh Projects"
          >
            <span className={`material-symbols-outlined text-lg ${loading ? 'animate-spin' : ''}`}>
              refresh
            </span>
          </button>

          <button
            onClick={() => setActiveModal('create')}
            className="px-4 py-2.5 rounded-xl bg-[#E5484D] hover:bg-[#D43D42] text-white text-xs font-bold transition-all active:scale-95 flex items-center gap-2 cursor-pointer shadow-lg"
          >
            <span className="material-symbols-outlined text-base">add</span>
            <span>New Project</span>
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
        {/* Search Input */}
        <div className="relative flex-1 max-w-md">
          <span className="material-symbols-outlined absolute left-3.5 top-1/2 -translate-y-1/2 text-[#8E8E8E] text-lg pointer-events-none">
            search
          </span>
          <input
            type="text"
            placeholder="Search projects by title or description..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-[#141414] border border-[#303030] text-white text-xs placeholder-[#606060] focus:outline-none focus:border-[#E5484D] transition-colors"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-[#8E8E8E] hover:text-white text-xs"
            >
              <span className="material-symbols-outlined text-sm">close</span>
            </button>
          )}
        </div>

        {/* Status Filter Tabs */}
        <div className="flex items-center gap-1.5 p-1 rounded-xl bg-[#141414] border border-[#303030] overflow-x-auto">
          {(['all', 'draft', 'published', 'archived'] as const).map((status) => (
            <button
              key={status}
              onClick={() => setStatusFilter(status)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium font-mono uppercase transition-all cursor-pointer whitespace-nowrap ${
                statusFilter === status
                  ? 'bg-[#E5484D] text-white font-bold shadow-sm'
                  : 'text-[#B0B0B0] hover:text-white hover:bg-[#1B1B1B]'
              }`}
            >
              {status}
            </button>
          ))}
        </div>
      </div>

      {/* Error Alert State */}
      {error && (
        <div className="p-4 rounded-xl bg-[#690005]/40 border border-[#FF5357]/40 text-white flex items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-xs">
            <span className="material-symbols-outlined text-[#FF5357]">error</span>
            <span>{error}</span>
          </div>
          <button
            onClick={fetchProjects}
            className="px-3 py-1 rounded-lg bg-[#FF5357]/20 hover:bg-[#FF5357]/30 text-xs font-medium border border-[#FF5357]/40 text-white transition-colors"
          >
            Retry
          </button>
        </div>
      )}

      {/* Main Grid View */}
      {loading ? (
        /* Loading Skeleton Grid */
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5, 6].map((idx) => (
            <div
              key={idx}
              className="p-5 rounded-2xl bg-[#141414] border border-[#303030] space-y-4 animate-pulse"
            >
              <div className="flex justify-between items-center">
                <div className="w-16 h-5 bg-[#222222] rounded-full"></div>
                <div className="w-6 h-6 bg-[#222222] rounded-lg"></div>
              </div>
              <div className="w-3/4 h-5 bg-[#222222] rounded-md"></div>
              <div className="w-full h-12 bg-[#1B1B1B] rounded-lg"></div>
              <div className="pt-2 flex justify-between items-center border-t border-[#222222]">
                <div className="w-20 h-4 bg-[#222222] rounded"></div>
                <div className="w-16 h-6 bg-[#222222] rounded-lg"></div>
              </div>
            </div>
          ))}
        </div>
      ) : filteredProjects.length > 0 ? (
        /* Projects Grid */
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredProjects.map((project) => (
            <div
              key={project.id}
              className="p-5 rounded-2xl bg-[#141414] border border-[#303030] hover:border-neutral-500 transition-all duration-200 flex flex-col justify-between group space-y-4 shadow-lg hover:shadow-xl"
            >
              <div className="space-y-3">
                {/* Header Badge & Action Button */}
                <div className="flex items-center justify-between gap-2">
                  <span
                    className={`px-2.5 py-0.5 rounded-full text-[10px] font-mono uppercase tracking-wider font-bold border ${
                      project.status === 'published'
                        ? 'bg-emerald-950/60 text-emerald-400 border-emerald-500/40'
                        : project.status === 'archived'
                        ? 'bg-[#1B1B1B] text-[#8E8E8E] border-[#303030]'
                        : 'bg-amber-950/60 text-amber-400 border-amber-500/40'
                    }`}
                  >
                    {project.status}
                  </span>

                  <div className="flex items-center gap-1 opacity-80 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={() => {
                        setSelectedProject(project);
                        setActiveModal('edit');
                      }}
                      className="p-1.5 rounded-lg text-[#B0B0B0] hover:text-white hover:bg-[#1B1B1B] transition-colors"
                      title="Edit Project"
                    >
                      <span className="material-symbols-outlined text-base">edit</span>
                    </button>
                    <button
                      onClick={() => {
                        setSelectedProject(project);
                        setActiveModal('delete');
                      }}
                      className="p-1.5 rounded-lg text-[#B0B0B0] hover:text-[#FF5357] hover:bg-[#690005]/30 transition-colors"
                      title="Delete Project"
                    >
                      <span className="material-symbols-outlined text-base">delete</span>
                    </button>
                  </div>
                </div>

                {/* Title & Description */}
                <div>
                  <h3 className="text-base font-bold text-white font-display group-hover:text-[#E5484D] transition-colors line-clamp-1">
                    {project.title}
                  </h3>
                  <p className="text-xs text-[#B0B0B0] font-body line-clamp-2 mt-1 min-h-[2.5rem]">
                    {project.description || 'No description provided.'}
                  </p>
                </div>
              </div>

              {/* Card Footer */}
              <div className="pt-3 border-t border-[#303030] flex items-center justify-between text-[11px] font-mono text-[#8E8E8E]">
                <div className="flex items-center gap-1">
                  <span className="material-symbols-outlined text-xs">schedule</span>
                  <span>{formatDate(project.updatedAt || project.createdAt)}</span>
                </div>

                <button
                  onClick={() => {
                    if (onOpenProject) {
                      onOpenProject(project);
                    } else {
                      setSelectedProject(project);
                      setActiveModal('view');
                    }
                  }}
                  className="px-3 py-1.5 rounded-lg bg-[#1B1B1B] hover:bg-[#E5484D] text-white font-sans font-semibold text-xs border border-[#303030] hover:border-[#E5484D] transition-all flex items-center gap-1 cursor-pointer"
                >
                  <span>Open</span>
                  <span className="material-symbols-outlined text-xs">arrow_forward</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        /* Empty State */
        <div className="p-12 rounded-2xl bg-[#141414] border border-[#303030] text-center space-y-4 max-w-lg mx-auto">
          <div className="w-12 h-12 rounded-full bg-[#1B1B1B] border border-[#303030] flex items-center justify-center mx-auto text-[#E5484D]">
            <span className="material-symbols-outlined text-2xl">folder_off</span>
          </div>

          <div className="space-y-1">
            <h3 className="text-base font-bold text-white font-display">
              {searchQuery || statusFilter !== 'all' ? 'No Matching Projects' : 'No Projects Yet'}
            </h3>
            <p className="text-xs text-[#B0B0B0] max-w-sm mx-auto">
              {searchQuery || statusFilter !== 'all'
                ? 'Try adjusting your search query or status filter to locate your project.'
                : 'Create your first AI website build project to start storing designs, code, and deployments.'}
            </p>
          </div>

          <div>
            {searchQuery || statusFilter !== 'all' ? (
              <button
                onClick={() => {
                  setSearchQuery('');
                  setStatusFilter('all');
                }}
                className="px-4 py-2 rounded-xl bg-[#1B1B1B] hover:bg-[#222222] text-xs font-semibold text-white border border-[#303030] transition-colors"
              >
                Clear Filters
              </button>
            ) : (
              <button
                onClick={() => setActiveModal('create')}
                className="px-4 py-2 rounded-xl bg-[#E5484D] hover:bg-[#D43D42] text-xs font-bold text-white transition-all flex items-center gap-1.5 mx-auto cursor-pointer shadow-lg"
              >
                <span className="material-symbols-outlined text-sm">add</span>
                <span>Create First Project</span>
              </button>
            )}
          </div>
        </div>
      )}

      {/* Modals */}
      {activeModal === 'create' && (
        <CreateProjectModal
          onClose={() => setActiveModal(null)}
          onCreate={handleCreateProject}
        />
      )}

      {activeModal === 'edit' && selectedProject && (
        <EditProjectModal
          project={selectedProject as ProjectModalData}
          onClose={() => {
            setActiveModal(null);
            setSelectedProject(null);
          }}
          onUpdate={handleUpdateProject}
        />
      )}

      {activeModal === 'delete' && selectedProject && (
        <DeleteProjectModal
          project={selectedProject as ProjectModalData}
          onClose={() => {
            setActiveModal(null);
            setSelectedProject(null);
          }}
          onConfirm={handleDeleteProject}
        />
      )}

      {/* Project Detail View Modal */}
      {activeModal === 'view' && selectedProject && (
        <div
          className="fixed inset-0 z-50 bg-[#0B0B0B]/85 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto"
          onClick={() => {
            setActiveModal(null);
            setSelectedProject(null);
          }}
        >
          <div
            className="w-full max-w-lg bg-[#141414] border border-[#303030] rounded-2xl shadow-2xl overflow-hidden my-8"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-6 py-4 border-b border-[#303030] bg-[#0E0E10]">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-[#E5484D] text-xl">
                  laptop_mac
                </span>
                <h2 className="text-sm font-display font-bold text-white uppercase tracking-wide">
                  Project Workspace
                </h2>
              </div>
              <button
                onClick={() => {
                  setActiveModal(null);
                  setSelectedProject(null);
                }}
                className="p-1 rounded-lg text-[#B0B0B0] hover:text-white hover:bg-[#1B1B1B] transition-colors"
              >
                <span className="material-symbols-outlined text-lg">close</span>
              </button>
            </div>

            <div className="p-6 space-y-5">
              <div className="flex items-center justify-between">
                <span
                  className={`px-3 py-1 rounded-full text-xs font-mono uppercase tracking-wider font-bold border ${
                    selectedProject.status === 'published'
                      ? 'bg-emerald-950/60 text-emerald-400 border-emerald-500/40'
                      : selectedProject.status === 'archived'
                      ? 'bg-[#1B1B1B] text-[#8E8E8E] border-[#303030]'
                      : 'bg-amber-950/60 text-amber-400 border-amber-500/40'
                  }`}
                >
                  {selectedProject.status}
                </span>

                <span className="text-xs font-mono text-[#8E8E8E]">
                  ID: {selectedProject.id}
                </span>
              </div>

              <div>
                <h3 className="text-lg font-bold text-white font-display">
                  {selectedProject.title}
                </h3>
                <p className="text-xs text-[#B0B0B0] font-body mt-2 leading-relaxed">
                  {selectedProject.description || 'No description added.'}
                </p>
              </div>

              <div className="p-4 rounded-xl bg-[#0E0E10] border border-[#303030] space-y-2 text-xs font-mono">
                <div className="flex justify-between text-[#8E8E8E]">
                  <span>Owner ID:</span>
                  <span className="text-white truncate max-w-[200px]">
                    {selectedProject.ownerId}
                  </span>
                </div>
                <div className="flex justify-between text-[#8E8E8E]">
                  <span>Created:</span>
                  <span className="text-white">{formatDate(selectedProject.createdAt)}</span>
                </div>
                <div className="flex justify-between text-[#8E8E8E]">
                  <span>Last Modified:</span>
                  <span className="text-white">{formatDate(selectedProject.updatedAt)}</span>
                </div>
              </div>

              <div className="pt-2 flex items-center justify-end gap-3">
                <button
                  onClick={() => {
                    setActiveModal(null);
                    setSelectedProject(null);
                  }}
                  className="px-4 py-2 rounded-xl bg-[#1B1B1B] text-xs font-medium text-[#B0B0B0] hover:text-white border border-[#303030] transition-colors"
                >
                  Close
                </button>
                <button
                  onClick={() => {
                    setActiveModal(null);
                    setSelectedProject(null);
                    const el = document.getElementById('promptInput');
                    if (el) {
                      el.focus();
                      el.scrollIntoView({ behavior: 'smooth' });
                    }
                  }}
                  className="px-4 py-2 rounded-xl bg-[#E5484D] hover:bg-[#D43D42] text-white text-xs font-bold transition-all flex items-center gap-2 cursor-pointer shadow-lg"
                >
                  <span className="material-symbols-outlined text-sm">auto_awesome</span>
                  <span>Edit in AI Builder</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
