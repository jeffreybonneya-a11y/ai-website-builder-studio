import React from 'react';

interface RevisionConflictModalProps {
  currentServerRevision: number;
  localDraftRevision: number;
  onReloadServer: () => void;
  onForceOverwrite: () => void;
  onClose: () => void;
}

export const RevisionConflictModal: React.FC<RevisionConflictModalProps> = ({
  currentServerRevision,
  localDraftRevision,
  onReloadServer,
  onForceOverwrite,
  onClose,
}) => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in select-none">
      <div className="w-full max-w-md bg-[#141414] border border-[#E5484D] rounded-xl p-6 shadow-2xl space-y-4 text-white">
        {/* Header */}
        <div className="flex items-center gap-3 border-b border-[#303030] pb-3">
          <div className="p-2 rounded-lg bg-[#E5484D]/15 border border-[#E5484D]/30 text-[#E5484D]">
            <span className="material-symbols-outlined text-xl">warning</span>
          </div>
          <div>
            <h3 className="text-base font-bold font-display text-white">
              Save Revision Conflict
            </h3>
            <span className="text-xs font-mono text-[#8E8E8E]">
              HTTP 409 — Newer Server Version Detected
            </span>
          </div>
        </div>

        {/* Message */}
        <p className="text-xs text-[#B0B0B0] font-body leading-relaxed">
          Another session or user saved updates to this project in Cloud Firestore.
        </p>

        {/* Revision Comparison Badges */}
        <div className="grid grid-cols-2 gap-3 p-3 bg-[#0B0B0B] border border-[#303030] rounded-lg text-xs font-mono">
          <div>
            <span className="text-[10px] text-[#8E8E8E] block uppercase">Your Draft Revision</span>
            <span className="text-amber-400 font-bold text-sm">Revision {localDraftRevision}</span>
          </div>
          <div>
            <span className="text-[10px] text-[#8E8E8E] block uppercase">Cloud Server Version</span>
            <span className="text-emerald-400 font-bold text-sm">Revision {currentServerRevision}</span>
          </div>
        </div>

        <p className="text-[11px] text-[#8E8E8E] font-mono">
          How would you like to handle your unsaved local draft?
        </p>

        {/* Action Buttons */}
        <div className="space-y-2 pt-1">
          <button
            onClick={onReloadServer}
            className="w-full py-2.5 px-4 rounded-lg bg-[#1B1B1B] hover:bg-[#222222] text-white border border-[#303030] hover:border-[#E5484D]/50 transition-colors text-xs font-mono font-bold flex items-center justify-between cursor-pointer"
          >
            <span>Reload Latest Server Revision ({currentServerRevision})</span>
            <span className="material-symbols-outlined text-sm text-[#E5484D]">refresh</span>
          </button>

          <button
            onClick={onForceOverwrite}
            className="w-full py-2.5 px-4 rounded-lg bg-[#E5484D] hover:bg-[#d43d42] text-white transition-colors text-xs font-mono font-bold flex items-center justify-between cursor-pointer shadow-lg shadow-[#E5484D]/20"
          >
            <span>Overwrite Server With My Draft</span>
            <span className="material-symbols-outlined text-sm">upload</span>
          </button>

          <button
            onClick={onClose}
            className="w-full py-2 px-4 rounded-lg bg-transparent text-[#8E8E8E] hover:text-white transition-colors text-xs font-mono text-center cursor-pointer"
          >
            Keep Local Draft (Close Dialog)
          </button>
        </div>
      </div>
    </div>
  );
};
