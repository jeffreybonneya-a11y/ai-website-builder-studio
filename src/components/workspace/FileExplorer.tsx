import React, { useState } from 'react';

export interface WorkspaceFile {
  id: string;
  name: string;
  language:
    | 'html'
    | 'css'
    | 'javascript'
    | 'typescript'
    | 'json'
    | 'python'
    | 'java'
    | 'cpp'
    | 'c'
    | 'php'
    | 'sql';
  content: string;
  updatedAt?: string;
}

interface FileExplorerProps {
  files: WorkspaceFile[];
  selectedFileId: string;
  modifiedFileIds?: Set<string>;
  onSelectFile: (fileId: string) => void;
  onAddFile?: (name: string, language: WorkspaceFile['language']) => void;
  onDeleteFile?: (fileId: string) => void;
  revision?: number;
}

export const FileExplorer: React.FC<FileExplorerProps> = ({
  files,
  selectedFileId,
  modifiedFileIds = new Set(),
  onSelectFile,
  onAddFile,
  onDeleteFile,
  revision = 1,
}) => {
  const [showAddModal, setShowAddModal] = useState(false);
  const [newFileName, setNewFileName] = useState('');
  const [newFileLang, setNewFileLang] = useState<WorkspaceFile['language']>('html');
  const [addError, setAddError] = useState<string | null>(null);

  const getFileIcon = (lang: WorkspaceFile['language']) => {
    switch (lang) {
      case 'html':
        return { icon: 'code', color: 'text-amber-500' };
      case 'css':
        return { icon: 'style', color: 'text-cyan-400' };
      case 'javascript':
        return { icon: 'javascript', color: 'text-yellow-400' };
      case 'typescript':
        return { icon: 'code_blocks', color: 'text-blue-400' };
      case 'json':
        return { icon: 'data_object', color: 'text-emerald-400' };
      case 'python':
        return { icon: 'terminal', color: 'text-sky-400' };
      case 'java':
        return { icon: 'coffee', color: 'text-orange-400' };
      case 'cpp':
      case 'c':
        return { icon: 'memory', color: 'text-purple-400' };
      case 'php':
        return { icon: 'php', color: 'text-indigo-400' };
      case 'sql':
        return { icon: 'database', color: 'text-rose-400' };
      default:
        return { icon: 'description', color: 'text-[#B0B0B0]' };
    }
  };

  const handleCreateFile = (e: React.FormEvent) => {
    e.preventDefault();
    setAddError(null);

    const cleanName = newFileName.trim();
    if (!cleanName) {
      setAddError('File name cannot be empty.');
      return;
    }

    if (!/^[a-zA-Z0-9_\-\.]+\.[a-zA-Z0-9]+$/.test(cleanName)) {
      setAddError('Use valid file name format (e.g. script.js or config.json).');
      return;
    }

    if (files.some((f) => f.name.toLowerCase() === cleanName.toLowerCase())) {
      setAddError('A file with this name already exists.');
      return;
    }

    if (onAddFile) {
      onAddFile(cleanName, newFileLang);
      setNewFileName('');
      setShowAddModal(false);
    }
  };

  return (
    <aside className="w-full h-full bg-[#141414] border-r border-[#303030] flex flex-col select-none overflow-hidden">
      {/* File Explorer Header */}
      <div className="px-4 py-3 border-b border-[#303030] flex items-center justify-between bg-[#0E0E10]">
        <div className="flex items-center gap-2">
          <span className="material-symbols-outlined text-[#E5484D] text-lg">folder_open</span>
          <span className="text-xs font-display font-bold text-white uppercase tracking-wider">
            Project Files
          </span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="text-[10px] font-mono text-[#B0B0B0] bg-[#1B1B1B] px-2 py-0.5 rounded border border-[#303030]">
            {files.length} Files
          </span>
          {onAddFile && (
            <button
              onClick={() => setShowAddModal(true)}
              className="p-1 rounded bg-[#1B1B1B] hover:bg-[#222] text-[#B0B0B0] hover:text-white border border-[#303030] transition-colors cursor-pointer"
              title="Add New Workspace File"
            >
              <span className="material-symbols-outlined text-xs">add</span>
            </button>
          )}
        </div>
      </div>

      {/* Directory Tree */}
      <div className="flex-1 overflow-y-auto p-2 space-y-1">
        <div className="px-2 py-1 flex items-center justify-between text-[11px] font-mono text-[#8E8E8E] uppercase tracking-wider">
          <div className="flex items-center gap-1.5">
            <span className="material-symbols-outlined text-xs text-[#E5484D]">folder</span>
            <span>src / root</span>
          </div>
          <span className="text-[9px] text-emerald-400">Rev {revision}</span>
        </div>

        {files.map((file) => {
          const isSelected = file.id === selectedFileId;
          const isModified = modifiedFileIds.has(file.id);
          const { icon, color } = getFileIcon(file.language);

          return (
            <div key={file.id} className="group relative flex items-center">
              <button
                onClick={() => onSelectFile(file.id)}
                className={`w-full px-3 py-2 rounded-lg flex items-center justify-between text-left transition-all cursor-pointer ${
                  isSelected
                    ? 'bg-[#E5484D]/15 text-white border border-[#E5484D]/40 font-medium shadow-sm'
                    : 'text-[#B0B0B0] hover:text-white hover:bg-[#1B1B1B] border border-transparent'
                }`}
              >
                <div className="flex items-center gap-2.5 min-w-0 pr-4">
                  <span className={`material-symbols-outlined text-base shrink-0 ${color}`}>
                    {icon}
                  </span>
                  <span className="text-xs font-mono truncate">{file.name}</span>
                </div>

                <div className="flex items-center gap-1.5 shrink-0">
                  {/* Unsaved Draft Indicator */}
                  {isModified && (
                    <span
                      className="w-2 h-2 rounded-full bg-amber-400 animate-pulse"
                      title="Unsaved Local Edits"
                    ></span>
                  )}
                  {isSelected && (
                    <span className="w-1.5 h-1.5 rounded-full bg-[#E5484D]"></span>
                  )}
                </div>
              </button>

              {/* Optional Delete Button for custom non-main files */}
              {onDeleteFile && files.length > 1 && file.name !== 'index.html' && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    if (confirm(`Delete '${file.name}'?`)) {
                      onDeleteFile(file.id);
                    }
                  }}
                  className="absolute right-2 opacity-0 group-hover:opacity-100 p-1 text-[#8E8E8E] hover:text-rose-400 transition-all cursor-pointer"
                  title="Delete File"
                >
                  <span className="material-symbols-outlined text-xs">delete</span>
                </button>
              )}
            </div>
          );
        })}
      </div>

      {/* Footer Info Notice */}
      <div className="p-3 border-t border-[#303030] bg-[#0E0E10] text-[10px] font-mono text-[#8E8E8E] space-y-1">
        <div className="flex items-center justify-between text-[#B0B0B0]">
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
            <span>Cloud Storage Active</span>
          </div>
          <span className="text-[9px] text-[#8E8E8E]">Rev {revision}</span>
        </div>
        <p className="leading-tight text-[#8E8E8E]">
          Files persist in Cloud Firestore under owner isolation.
        </p>
      </div>

      {/* Add New File Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm">
          <div className="w-full max-w-xs bg-[#141414] border border-[#303030] rounded-xl p-4 space-y-3 text-white">
            <div className="flex items-center justify-between border-b border-[#303030] pb-2">
              <h4 className="text-xs font-bold font-display uppercase tracking-wider">Create New File</h4>
              <button
                onClick={() => setShowAddModal(false)}
                className="text-[#8E8E8E] hover:text-white"
              >
                <span className="material-symbols-outlined text-sm">close</span>
              </button>
            </div>

            <form onSubmit={handleCreateFile} className="space-y-3">
              <div>
                <label className="text-[10px] font-mono text-[#8E8E8E] block mb-1">File Name</label>
                <input
                  type="text"
                  value={newFileName}
                  onChange={(e) => setNewFileName(e.target.value)}
                  placeholder="e.g. utils.js"
                  className="w-full bg-[#0B0B0B] border border-[#303030] rounded px-2.5 py-1.5 text-xs font-mono text-white focus:outline-none focus:border-[#E5484D]"
                  autoFocus
                />
              </div>

              <div>
                <label className="text-[10px] font-mono text-[#8E8E8E] block mb-1">Language</label>
                <select
                  value={newFileLang}
                  onChange={(e) => setNewFileLang(e.target.value as any)}
                  className="w-full bg-[#0B0B0B] border border-[#303030] rounded px-2.5 py-1.5 text-xs font-mono text-white focus:outline-none focus:border-[#E5484D]"
                >
                  <option value="html">HTML5 (.html)</option>
                  <option value="css">CSS3 (.css)</option>
                  <option value="javascript">JavaScript (.js)</option>
                  <option value="typescript">TypeScript (.ts / .tsx)</option>
                  <option value="json">JSON (.json)</option>
                  <option value="python">Python (.py)</option>
                  <option value="java">Java (.java)</option>
                  <option value="cpp">C / C++ (.cpp / .c)</option>
                  <option value="php">PHP (.php)</option>
                  <option value="sql">SQL (.sql)</option>
                </select>
              </div>

              {addError && <p className="text-[10px] text-rose-400 font-mono">{addError}</p>}

              <div className="flex items-center gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="flex-1 py-1.5 rounded bg-[#1B1B1B] text-[#B0B0B0] text-xs font-mono"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-1.5 rounded bg-[#E5484D] text-white text-xs font-mono font-bold"
                >
                  Add File
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </aside>
  );
};
