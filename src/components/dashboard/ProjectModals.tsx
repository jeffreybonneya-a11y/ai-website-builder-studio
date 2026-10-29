import React, { useState } from 'react';

export interface ProjectModalData {
  id: string;
  title: string;
  description?: string;
  status: 'draft' | 'published' | 'archived';
}

interface CreateModalProps {
  onClose: () => void;
  onCreate: (title: string, description: string, status: 'draft' | 'published' | 'archived') => Promise<boolean>;
}

export const CreateProjectModal: React.FC<CreateModalProps> = ({ onClose, onCreate }) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [status, setStatus] = useState<'draft' | 'published' | 'archived'>('draft');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setError('Project title is required.');
      return;
    }

    setSubmitting(true);
    setError(null);

    const success = await onCreate(title.trim(), description.trim(), status);
    setSubmitting(false);

    if (success) {
      onClose();
    } else {
      setError('Failed to create project. Please try again.');
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-[#0B0B0B]/85 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md bg-[#141414] border border-[#303030] rounded-2xl shadow-2xl overflow-hidden my-8"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#303030] bg-[#0E0E10]">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-[#E5484D] text-xl">add_box</span>
            <h2 className="text-sm font-display font-bold text-white uppercase tracking-wide">
              Create New Project
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-[#B0B0B0] hover:text-white hover:bg-[#1B1B1B] transition-colors"
          >
            <span className="material-symbols-outlined text-lg">close</span>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="p-3 rounded-xl bg-[#690005]/40 border border-[#FF5357]/40 text-xs text-white flex items-center gap-2">
              <span className="material-symbols-outlined text-[#FF5357] text-sm">error</span>
              <span>{error}</span>
            </div>
          )}

          <div className="space-y-1.5">
            <label className="text-xs font-medium text-[#B0B0B0] uppercase font-mono">
              Project Title *
            </label>
            <input
              type="text"
              required
              maxLength={200}
              placeholder="e.g. SaaS Analytics Dashboard"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-[#0B0B0B] border border-[#303030] text-white text-xs placeholder-[#606060] focus:outline-none focus:border-[#E5484D] transition-colors"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-medium text-[#B0B0B0] uppercase font-mono">
              Description (Optional)
            </label>
            <textarea
              rows={3}
              maxLength={1000}
              placeholder="Brief description of your website build..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-[#0B0B0B] border border-[#303030] text-white text-xs placeholder-[#606060] focus:outline-none focus:border-[#E5484D] transition-colors resize-none"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-medium text-[#B0B0B0] uppercase font-mono">
              Initial Status
            </label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value as 'draft' | 'published' | 'archived')}
              className="w-full px-3.5 py-2.5 rounded-xl bg-[#0B0B0B] border border-[#303030] text-white text-xs focus:outline-none focus:border-[#E5484D] transition-colors"
            >
              <option value="draft">Draft</option>
              <option value="published">Published</option>
              <option value="archived">Archived</option>
            </select>
          </div>

          <div className="pt-3 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-[#1B1B1B] text-xs font-medium text-[#B0B0B0] hover:text-white border border-[#303030] transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-4 py-2 rounded-xl bg-[#E5484D] hover:bg-[#D43D42] text-white text-xs font-bold transition-all disabled:opacity-50 flex items-center gap-2 cursor-pointer shadow-lg"
            >
              {submitting ? (
                <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
              ) : (
                <>
                  <span className="material-symbols-outlined text-sm">check</span>
                  <span>Create Project</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

interface EditModalProps {
  project: ProjectModalData;
  onClose: () => void;
  onUpdate: (
    id: string,
    title: string,
    description: string,
    status: 'draft' | 'published' | 'archived'
  ) => Promise<boolean>;
}

export const EditProjectModal: React.FC<EditModalProps> = ({ project, onClose, onUpdate }) => {
  const [title, setTitle] = useState(project.title);
  const [description, setDescription] = useState(project.description || '');
  const [status, setStatus] = useState<'draft' | 'published' | 'archived'>(project.status);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setError('Project title is required.');
      return;
    }

    setSubmitting(true);
    setError(null);

    const success = await onUpdate(project.id, title.trim(), description.trim(), status);
    setSubmitting(false);

    if (success) {
      onClose();
    } else {
      setError('Failed to update project. Please try again.');
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-[#0B0B0B]/85 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md bg-[#141414] border border-[#303030] rounded-2xl shadow-2xl overflow-hidden my-8"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#303030] bg-[#0E0E10]">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-[#E5484D] text-xl">edit</span>
            <h2 className="text-sm font-display font-bold text-white uppercase tracking-wide">
              Edit Project Details
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-[#B0B0B0] hover:text-white hover:bg-[#1B1B1B] transition-colors"
          >
            <span className="material-symbols-outlined text-lg">close</span>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="p-3 rounded-xl bg-[#690005]/40 border border-[#FF5357]/40 text-xs text-white flex items-center gap-2">
              <span className="material-symbols-outlined text-[#FF5357] text-sm">error</span>
              <span>{error}</span>
            </div>
          )}

          <div className="space-y-1.5">
            <label className="text-xs font-medium text-[#B0B0B0] uppercase font-mono">
              Project Title *
            </label>
            <input
              type="text"
              required
              maxLength={200}
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-[#0B0B0B] border border-[#303030] text-white text-xs placeholder-[#606060] focus:outline-none focus:border-[#E5484D] transition-colors"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-medium text-[#B0B0B0] uppercase font-mono">
              Description
            </label>
            <textarea
              rows={3}
              maxLength={1000}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-[#0B0B0B] border border-[#303030] text-white text-xs placeholder-[#606060] focus:outline-none focus:border-[#E5484D] transition-colors resize-none"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-medium text-[#B0B0B0] uppercase font-mono">
              Status
            </label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value as 'draft' | 'published' | 'archived')}
              className="w-full px-3.5 py-2.5 rounded-xl bg-[#0B0B0B] border border-[#303030] text-white text-xs focus:outline-none focus:border-[#E5484D] transition-colors"
            >
              <option value="draft">Draft</option>
              <option value="published">Published</option>
              <option value="archived">Archived</option>
            </select>
          </div>

          <div className="pt-3 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-[#1B1B1B] text-xs font-medium text-[#B0B0B0] hover:text-white border border-[#303030] transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-4 py-2 rounded-xl bg-[#E5484D] hover:bg-[#D43D42] text-white text-xs font-bold transition-all disabled:opacity-50 flex items-center gap-2 cursor-pointer shadow-lg"
            >
              {submitting ? (
                <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
              ) : (
                <>
                  <span className="material-symbols-outlined text-sm">save</span>
                  <span>Save Changes</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

interface DeleteModalProps {
  project: ProjectModalData;
  onClose: () => void;
  onConfirm: (id: string) => Promise<boolean>;
}

export const DeleteProjectModal: React.FC<DeleteModalProps> = ({ project, onClose, onConfirm }) => {
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleDelete = async () => {
    setSubmitting(true);
    setError(null);

    const success = await onConfirm(project.id);
    setSubmitting(false);

    if (success) {
      onClose();
    } else {
      setError('Failed to delete project. Please try again.');
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-[#0B0B0B]/85 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md bg-[#141414] border border-[#303030] rounded-2xl shadow-2xl overflow-hidden my-8"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#303030] bg-[#0E0E10]">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-[#FF5357] text-xl">delete_forever</span>
            <h2 className="text-sm font-display font-bold text-white uppercase tracking-wide">
              Delete Project
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-[#B0B0B0] hover:text-white hover:bg-[#1B1B1B] transition-colors"
          >
            <span className="material-symbols-outlined text-lg">close</span>
          </button>
        </div>

        <div className="p-6 space-y-4">
          {error && (
            <div className="p-3 rounded-xl bg-[#690005]/40 border border-[#FF5357]/40 text-xs text-white flex items-center gap-2">
              <span className="material-symbols-outlined text-[#FF5357] text-sm">error</span>
              <span>{error}</span>
            </div>
          )}

          <p className="text-xs text-[#B0B0B0] leading-relaxed font-body">
            Are you sure you want to delete <span className="text-white font-bold">"{project.title}"</span>? This action is permanent and cannot be undone.
          </p>

          <div className="p-3.5 rounded-xl bg-[#0E0E10] border border-[#303030] font-mono text-[11px] space-y-1">
            <div className="flex justify-between">
              <span className="text-[#8E8E8E]">Project ID:</span>
              <span className="text-[#B0B0B0]">{project.id}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-[#8E8E8E]">Status:</span>
              <span className="text-white uppercase font-bold">{project.status}</span>
            </div>
          </div>

          <div className="pt-2 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-[#1B1B1B] text-xs font-medium text-[#B0B0B0] hover:text-white border border-[#303030] transition-colors"
            >
              Cancel
            </button>
            <button
              type="button"
              disabled={submitting}
              onClick={handleDelete}
              className="px-4 py-2 rounded-xl bg-[#690005] hover:bg-[#850007] border border-[#FF5357]/40 text-white text-xs font-bold transition-all disabled:opacity-50 flex items-center gap-2 cursor-pointer shadow-lg"
            >
              {submitting ? (
                <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
              ) : (
                <>
                  <span className="material-symbols-outlined text-sm">delete</span>
                  <span>Confirm Delete</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
