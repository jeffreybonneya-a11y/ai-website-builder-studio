import React from 'react';

export const TerminalTeaser: React.FC = () => {
  return (
    <section className="w-full max-w-2xl mx-auto p-4 rounded-xl bg-[#141414] border border-[#303030] font-mono text-[12px] mb-8 space-y-2 shadow-inner">
      <div className="flex items-center justify-between text-[#B0B0B0] border-b border-[#303030] pb-2">
        <span className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-[#E5484D] animate-pulse"></span>
          <span className="text-white font-medium">terminal.builder.studio</span>
        </span>
        <span className="text-[11px] text-[#B0B0B0]/80 bg-[#1B1B1B] px-2 py-0.5 rounded border border-[#303030]">
          bash v5.2
        </span>
      </div>
      <div className="space-y-1.5 pt-1">
        <p className="text-[#B0B0B0]">
          <span className="text-[#E5484D] mr-2">$</span>
          ai-studio create --template=saas-dashboard
        </p>
        <p className="text-emerald-400 flex items-center gap-2">
          <span>✓</span>
          <span>Initialized Tailwind theme engine (Obsidian Crimson)</span>
        </p>
        <p className="text-emerald-400 flex items-center gap-2">
          <span>✓</span>
          <span>Configured responsive viewport breakpoints (390px, 768px, 1440px)</span>
        </p>
        <p className="text-white font-medium flex items-center gap-2">
          <span className="text-amber-400">⚡</span>
          <span>Compiling instant hot-reload sandbox canvas...</span>
        </p>
      </div>
    </section>
  );
};
