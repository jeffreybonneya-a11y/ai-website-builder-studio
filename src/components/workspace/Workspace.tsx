import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Project } from '../dashboard/Dashboard';
import { FileExplorer, WorkspaceFile } from './FileExplorer';
import { CodeEditor } from './CodeEditor';
import { LivePreview } from './LivePreview';
import { WorkspacePromptBar } from './WorkspacePromptBar';
import { BeginnerAssistant } from './BeginnerAssistant';
import { RevisionConflictModal } from './RevisionConflictModal';
import { useAuth } from '../../context/AuthContext';

interface WorkspaceProps {
  project: Project;
  onBackToProjects: () => void;
}

type MobilePanelTab = 'files' | 'code' | 'preview' | 'assistant';

export const Workspace: React.FC<WorkspaceProps> = ({ project: initialProject, onBackToProjects }) => {
  const { csrfToken } = useAuth();

  // Full project state loaded from backend
  const [project, setProject] = useState<Project>(initialProject);
  const [files, setFiles] = useState<WorkspaceFile[]>([]);
  const [serverFiles, setServerFiles] = useState<WorkspaceFile[]>([]);
  const [selectedFileId, setSelectedFileId] = useState<string>('');
  const [revision, setRevision] = useState<number>(1);

  // Status & UI States
  const [loading, setLoading] = useState<boolean>(true);
  const [saving, setSaving] = useState<boolean>(false);
  const [saveSuccessNotice, setSaveSuccessNotice] = useState<boolean>(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  
  // Conflict modal
  const [conflictModalOpen, setConflictModalOpen] = useState<boolean>(false);
  const [currentServerRevision, setCurrentServerRevision] = useState<number>(1);

  // Assistant & Mobile Layouts
  const [assistantOpen, setAssistantOpen] = useState<boolean>(false);
  const [mobileTab, setMobileTab] = useState<MobilePanelTab>('code');

  // Fetch complete project details and files from GET /api/projects/:id on mount
  const fetchProjectDetails = useCallback(async () => {
    setLoading(true);
    setSaveError(null);
    try {
      const res = await fetch(`/api/projects/${initialProject.id}`, {
        method: 'GET',
        credentials: 'include',
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || 'Failed to load project files.');
      }

      const data = await res.json();
      const loadedProj: Project = data.project;
      setProject(loadedProj);

      const loadedFiles: WorkspaceFile[] = loadedProj.files || [];
      setFiles(loadedFiles);
      setServerFiles(loadedFiles);
      setRevision(loadedProj.revision || 1);

      if (loadedProj.activeFileId && loadedFiles.some((f) => f.id === loadedProj.activeFileId)) {
        setSelectedFileId(loadedProj.activeFileId);
      } else if (loadedFiles.length > 0) {
        setSelectedFileId(loadedFiles[0].id);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error loading project.';
      setSaveError(msg);
    } finally {
      setLoading(false);
    }
  }, [initialProject.id]);

  useEffect(() => {
    fetchProjectDetails();
  }, [fetchProjectDetails]);

  // Determine modified files (unsaved edits) by comparing `files` against `serverFiles`
  const modifiedFileIds = useMemo(() => {
    const set = new Set<string>();
    files.forEach((f) => {
      const serverFile = serverFiles.find((sf) => sf.id === f.id);
      if (!serverFile || serverFile.content !== f.content || serverFile.name !== f.name) {
        set.add(f.id);
      }
    });
    // Also check for newly added or deleted files
    if (files.length !== serverFiles.length) {
      files.forEach((f) => set.add(f.id));
    }
    return set;
  }, [files, serverFiles]);

  const isDirty = modifiedFileIds.size > 0;

  // Window beforeunload warning if unsaved edits exist
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (isDirty) {
        e.preventDefault();
        e.returnValue = '';
      }
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [isDirty]);

  // Update file content in local draft
  const handleChangeContent = (fileId: string, newContent: string) => {
    setFiles((prev) =>
      prev.map((f) => (f.id === fileId ? { ...f, content: newContent } : f))
    );
  };

  // Add new file to local workspace
  const handleAddFile = (name: string, language: WorkspaceFile['language']) => {
    const now = new Date().toISOString();
    const newFile: WorkspaceFile = {
      id: `f_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      name,
      language,
      content:
        language === 'html'
          ? `<!DOCTYPE html>\n<html lang="en">\n<head>\n  <title>${name}</title>\n</head>\n<body>\n  <h1>${name}</h1>\n</body>\n</html>`
          : language === 'css'
          ? `/* Custom Styles for ${name} */\n`
          : language === 'javascript'
          ? `// Script ${name}\nconsole.log('${name} initialized');\n`
          : `{\n  "name": "${name}"\n}`,
      updatedAt: now,
    };

    setFiles((prev) => [...prev, newFile]);
    setSelectedFileId(newFile.id);
  };

  // Delete file from local workspace
  const handleDeleteFile = (fileId: string) => {
    setFiles((prev) => prev.filter((f) => f.id !== fileId));
    if (selectedFileId === fileId) {
      const remaining = files.filter((f) => f.id !== fileId);
      if (remaining.length > 0) {
        setSelectedFileId(remaining[0].id);
      }
    }
  };

  // Insert snippet from Beginner Assistant into active file
  const handleInsertSnippet = (snippetCode: string) => {
    if (!selectedFileId) return;
    setFiles((prev) =>
      prev.map((f) => {
        if (f.id === selectedFileId) {
          return {
            ...f,
            content: f.content ? `${f.content}\n\n${snippetCode}` : snippetCode,
          };
        }
        return f;
      })
    );
  };

  // Apply diagnostic code fix into active file
  const handleApplyFix = (fixedContent: string) => {
    if (!selectedFileId) return;
    setFiles((prev) =>
      prev.map((f) => (f.id === selectedFileId ? { ...f, content: fixedContent } : f))
    );
  };

  // Save Workspace files to backend PUT /api/projects/:id/files
  const handleSave = async (overrideExpectedRevision?: number) => {
    if (saving) return;

    setSaving(true);
    setSaveError(null);
    setSaveSuccessNotice(false);

    const targetRevision =
      overrideExpectedRevision !== undefined ? overrideExpectedRevision : revision;

    try {
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };
      if (csrfToken) {
        headers['x-csrf-token'] = csrfToken;
      }

      const res = await fetch(`/api/projects/${project.id}/files`, {
        method: 'PUT',
        headers,
        credentials: 'include',
        body: JSON.stringify({
          files,
          expectedRevision: targetRevision,
          activeFileId: selectedFileId,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        if (res.status === 409 || data.error === 'REVISION_CONFLICT') {
          setCurrentServerRevision(data.currentRevision || revision + 1);
          setConflictModalOpen(true);
          return;
        }
        throw new Error(data.error || 'Failed to save project files.');
      }

      // Save Succeeded
      const updatedProj: Project = data.project;
      const newRev: number = data.revision;

      setProject(updatedProj);
      setFiles(updatedProj.files || files);
      setServerFiles(updatedProj.files || files);
      setRevision(newRev);

      setSaveSuccessNotice(true);
      setTimeout(() => setSaveSuccessNotice(false), 3000);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to save files.';
      setSaveError(msg);
    } finally {
      setSaving(false);
    }
  };

  // Conflict Resolution 1: Reload latest server revision
  const handleReloadServer = async () => {
    setConflictModalOpen(false);
    await fetchProjectDetails();
  };

  // Conflict Resolution 2: Overwrite server with current local draft
  const handleForceOverwrite = async () => {
    setConflictModalOpen(false);
    await handleSave(currentServerRevision);
  };

  // Window-level Ctrl+S / Cmd+S listener
  useEffect(() => {
    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 's') {
        e.preventDefault();
        handleSave();
      }
    };
    window.addEventListener('keydown', handleGlobalKeyDown);
    return () => window.removeEventListener('keydown', handleGlobalKeyDown);
  }, [files, revision, selectedFileId, csrfToken, project.id]);

  const selectedFile = files.find((f) => f.id === selectedFileId) || null;

  if (loading) {
    return (
      <div className="w-full flex-1 flex flex-col items-center justify-center bg-[#0B0B0B] text-white p-8 space-y-4 min-h-[calc(100vh-3.5rem)]">
        <div className="w-8 h-8 border-3 border-[#E5484D] border-t-transparent rounded-full animate-spin"></div>
        <p className="text-xs font-mono text-[#B0B0B0]">Loading project workspace files...</p>
      </div>
    );
  }

  return (
    <div className="w-full flex-1 flex flex-col bg-[#0B0B0B] overflow-hidden min-h-[calc(100vh-3.5rem)] relative">
      {/* Workspace Top Bar */}
      <header className="px-4 py-2.5 bg-[#141414] border-b border-[#303030] flex flex-wrap items-center justify-between gap-3 shrink-0">
        <div className="flex items-center gap-3 min-w-0">
          <button
            onClick={() => {
              if (isDirty && !confirm('You have unsaved changes. Leave workspace?')) {
                return;
              }
              onBackToProjects();
            }}
            className="px-3 py-1.5 rounded-lg bg-[#1B1B1B] hover:bg-[#222222] text-[#B0B0B0] hover:text-white border border-[#303030] transition-colors text-xs font-medium flex items-center gap-1.5 cursor-pointer shrink-0"
          >
            <span className="material-symbols-outlined text-sm">arrow_back</span>
            <span className="hidden sm:inline">My Projects</span>
          </button>

          <div className="h-4 w-[1px] bg-[#303030] hidden sm:block"></div>

          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-[#E5484D] text-base shrink-0">
                laptop_mac
              </span>
              <h1 className="text-sm font-display font-bold text-white tracking-tight truncate max-w-[160px] sm:max-w-xs">
                {project.title}
              </h1>
              <span className="px-1.5 py-0.5 rounded text-[9px] font-mono uppercase font-bold border bg-amber-950/60 text-amber-400 border-amber-500/40 shrink-0">
                Rev {revision}
              </span>
            </div>
          </div>
        </div>

        {/* Right Header Status Controls */}
        <div className="flex items-center gap-2.5">
          {/* Save Status Badge */}
          {saveSuccessNotice ? (
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-950/80 border border-emerald-500/40 text-[11px] font-mono text-emerald-300">
              <span className="material-symbols-outlined text-xs">check_circle</span>
              <span>Saved!</span>
            </div>
          ) : isDirty ? (
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-amber-950/80 border border-amber-500/40 text-[11px] font-mono text-amber-300">
              <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse"></span>
              <span className="hidden sm:inline">Unsaved Edits</span>
            </div>
          ) : (
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[#0B0B0B] border border-[#303030] text-[11px] font-mono text-[#8E8E8E]">
              <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
              <span className="hidden sm:inline">Cloud Synced</span>
            </div>
          )}

          {/* Assistant Toggle Button */}
          <button
            onClick={() => setAssistantOpen(!assistantOpen)}
            className={`px-2.5 py-1.5 rounded-lg text-xs font-mono font-medium transition-colors flex items-center gap-1.5 cursor-pointer border ${
              assistantOpen
                ? 'bg-[#E5484D] text-white border-[#E5484D]'
                : 'bg-[#1B1B1B] text-[#B0B0B0] hover:text-white border-[#303030]'
            }`}
          >
            <span className="material-symbols-outlined text-sm">school</span>
            <span className="hidden md:inline">Code Helper</span>
          </button>

          {/* Mobile View Tab Bar (< 1024px) */}
          <div className="flex lg:hidden items-center p-1 rounded-lg bg-[#0B0B0B] border border-[#303030]">
            <button
              onClick={() => setMobileTab('files')}
              className={`px-2 py-0.5 rounded text-[11px] font-mono transition-colors ${
                mobileTab === 'files' ? 'bg-[#E5484D] text-white font-bold' : 'text-[#B0B0B0]'
              }`}
            >
              Files
            </button>
            <button
              onClick={() => setMobileTab('code')}
              className={`px-2 py-0.5 rounded text-[11px] font-mono transition-colors ${
                mobileTab === 'code' ? 'bg-[#E5484D] text-white font-bold' : 'text-[#B0B0B0]'
              }`}
            >
              Code
            </button>
            <button
              onClick={() => setMobileTab('preview')}
              className={`px-2 py-0.5 rounded text-[11px] font-mono transition-colors ${
                mobileTab === 'preview' ? 'bg-[#E5484D] text-white font-bold' : 'text-[#B0B0B0]'
              }`}
            >
              Preview
            </button>
            <button
              onClick={() => setMobileTab('assistant')}
              className={`px-2 py-0.5 rounded text-[11px] font-mono transition-colors ${
                mobileTab === 'assistant' ? 'bg-[#E5484D] text-white font-bold' : 'text-[#B0B0B0]'
              }`}
            >
              Helper
            </button>
          </div>
        </div>
      </header>

      {/* Error Banner */}
      {saveError && (
        <div className="px-4 py-2 bg-rose-950/80 border-b border-rose-500/40 text-xs font-mono text-rose-200 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-sm">error</span>
            <span>{saveError}</span>
          </div>
          <button onClick={() => setSaveError(null)} className="hover:text-white">
            <span className="material-symbols-outlined text-sm">close</span>
          </button>
        </div>
      )}

      {/* Main Workspace Workspace Panels */}
      <div className="flex-1 flex overflow-hidden">
        {/* Desktop Split View (>= 1024px) */}
        <div className="hidden lg:flex w-full h-full overflow-hidden">
          {/* File Explorer (220px) */}
          <div className="w-56 shrink-0 h-full">
            <FileExplorer
              files={files}
              selectedFileId={selectedFileId}
              modifiedFileIds={modifiedFileIds}
              onSelectFile={setSelectedFileId}
              onAddFile={handleAddFile}
              onDeleteFile={handleDeleteFile}
              revision={revision}
            />
          </div>

          {/* Code Editor */}
          <div className="flex-1 h-full min-w-0">
            <CodeEditor
              file={selectedFile}
              isDirty={isDirty}
              saving={saving}
              onChangeContent={handleChangeContent}
              onSave={() => handleSave()}
              onToggleAssistant={() => setAssistantOpen(!assistantOpen)}
              assistantOpen={assistantOpen}
            />
          </div>

          {/* Beginner Assistant Panel (Optional 280px drawer) */}
          {assistantOpen && (
            <div className="w-80 shrink-0 h-full">
              <BeginnerAssistant
                activeFile={selectedFile}
                files={files}
                onInsertSnippet={handleInsertSnippet}
                onApplyFix={handleApplyFix}
                onClose={() => setAssistantOpen(false)}
              />
            </div>
          )}

          {/* Live Preview */}
          <div className={`${assistantOpen ? 'w-[36%]' : 'w-[45%]'} shrink-0 h-full transition-all`}>
            <LivePreview files={files} projectTitle={project.title} />
          </div>
        </div>

        {/* Mobile / Tablet Tabbed View (< 1024px) */}
        <div className="flex lg:hidden w-full h-full overflow-hidden">
          {mobileTab === 'files' && (
            <div className="w-full h-full">
              <FileExplorer
                files={files}
                selectedFileId={selectedFileId}
                modifiedFileIds={modifiedFileIds}
                onSelectFile={(id) => {
                  setSelectedFileId(id);
                  setMobileTab('code');
                }}
                onAddFile={handleAddFile}
                onDeleteFile={handleDeleteFile}
                revision={revision}
              />
            </div>
          )}

          {mobileTab === 'code' && (
            <div className="w-full h-full">
              <CodeEditor
                file={selectedFile}
                isDirty={isDirty}
                saving={saving}
                onChangeContent={handleChangeContent}
                onSave={() => handleSave()}
                onToggleAssistant={() => setMobileTab('assistant')}
                assistantOpen={false}
              />
            </div>
          )}

          {mobileTab === 'preview' && (
            <div className="w-full h-full">
              <LivePreview files={files} projectTitle={project.title} />
            </div>
          )}

          {mobileTab === 'assistant' && (
            <div className="w-full h-full">
              <BeginnerAssistant
                activeFile={selectedFile}
                files={files}
                onInsertSnippet={(snippet) => {
                  handleInsertSnippet(snippet);
                  setMobileTab('code');
                }}
                onApplyFix={(fixedContent) => {
                  handleApplyFix(fixedContent);
                  setMobileTab('code');
                }}
              />
            </div>
          )}
        </div>
      </div>

      {/* Revision Conflict Resolution Modal */}
      {conflictModalOpen && (
        <RevisionConflictModal
          currentServerRevision={currentServerRevision}
          localDraftRevision={revision}
          onReloadServer={handleReloadServer}
          onForceOverwrite={handleForceOverwrite}
          onClose={() => setConflictModalOpen(false)}
        />
      )}

      {/* Bottom AI Prompt Bar */}
      <WorkspacePromptBar />
    </div>
  );
};
