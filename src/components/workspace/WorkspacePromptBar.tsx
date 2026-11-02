import React, { useState } from 'react';

export const WorkspacePromptBar: React.FC = () => {
  const [prompt, setPrompt] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Stage 4.1 UI placeholder - No AI submission or API calls
  };

  return (
    <div className="w-full bg-[#141414] border-t border-[#303030] p-3 shrink-0">
      <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
        <div className="relative flex-1">
          <span className="material-symbols-outlined absolute left-3.5 top-1/2 -translate-y-1/2 text-[#8E8E8E] text-lg pointer-events-none">
            auto_awesome
          </span>
          <input
            type="text"
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="Describe a change or tell AI what you want to build..."
            className="w-full pl-10 pr-4 py-2 rounded-xl bg-[#0B0B0B] border border-[#303030] text-white text-xs placeholder-[#606060] focus:outline-none focus:border-[#E5484D] transition-colors font-body"
          />
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            disabled
            className="px-4 py-2 rounded-xl bg-[#E5484D]/40 text-white/60 text-xs font-bold uppercase tracking-wide flex items-center justify-center gap-1.5 cursor-not-allowed border border-[#E5484D]/30 opacity-75"
            title="AI Generation connects in Stage 4.2"
          >
            <span>GENERATE</span>
            <span className="material-symbols-outlined text-sm">arrow_forward</span>
          </button>

          <span className="hidden lg:inline text-[10px] font-mono text-[#E5484D] bg-[#E5484D]/10 px-2.5 py-1.5 rounded-xl border border-[#E5484D]/30 font-bold whitespace-nowrap">
            AI Engine Connects in Stage 4.2
          </span>
        </div>
      </form>
    </div>
  );
};
