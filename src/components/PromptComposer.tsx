import React, { useState } from 'react';

interface PromptComposerProps {
  onGenerateClick: (prompt: string) => void;
}

const QUICK_STARTERS = [
  'Build an online store',
  'Create a portfolio website',
  'Build a school management website',
  'Create a business dashboard',
  'Build a real-time collaboration tool',
  'Create a restaurant menu & booking app',
];

export const PromptComposer: React.FC<PromptComposerProps> = ({
  onGenerateClick,
}) => {
  const [prompt, setPrompt] = useState('');

  const handleChipClick = (starterText: string) => {
    setPrompt(starterText);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onGenerateClick(prompt.trim() || 'Build a modern SaaS application');
  };

  return (
    <div className="w-full max-w-2xl mx-auto my-6 space-y-4">
      {/* AI Prompt Composer Component */}
      <section className="w-full bg-[#141414] rounded-xl p-4 sm:p-5 border border-[#303030] relative shadow-lg">
        {/* Header */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-[#E5484D] text-lg">terminal</span>
            <span className="font-display text-white tracking-wider uppercase font-bold text-xs">
              Project Generator
            </span>
          </div>
          <span className="font-mono text-[11px] text-[#B0B0B0] bg-[#1B1B1B] px-2.5 py-0.5 rounded border border-[#303030]">
            Tokens: 4k Free
          </span>
        </div>

        {/* Input Form */}
        <form onSubmit={handleSubmit} className="space-y-3.5">
          <div className="relative">
            <textarea
              id="promptInput"
              rows={3}
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="Describe the website or app you want to build..."
              className="w-full bg-[#1B1B1B] text-white placeholder:text-[#B0B0B0]/60 rounded-lg p-3 text-sm font-body border border-[#303030] focus:outline-none focus:border-[#E5484D] focus:ring-1 focus:ring-[#E5484D] transition-all resize-none leading-relaxed"
            />
          </div>

          {/* Quick Starters */}
          <div className="space-y-1.5">
            <span className="text-[11px] font-mono text-[#B0B0B0]">Quick Starters:</span>
            <div className="flex flex-wrap gap-1.5">
              {QUICK_STARTERS.map((starter) => (
                <button
                  key={starter}
                  type="button"
                  onClick={() => handleChipClick(starter)}
                  className="px-2.5 py-1 rounded bg-[#1B1B1B] text-[12px] font-body text-[#B0B0B0] hover:text-white hover:border-neutral-500 border border-[#303030] active:scale-95 transition-all text-left cursor-pointer"
                >
                  {starter}
                </button>
              ))}
            </div>
          </div>

          {/* Primary Action Button */}
          <button
            type="submit"
            className="w-full py-3 px-4 rounded-lg bg-[#E5484D] text-white font-display text-sm font-bold tracking-wide uppercase flex items-center justify-center gap-2 hover:bg-[#D43D42] active:scale-[0.99] transition-all cursor-pointer shadow-md"
          >
            <span>GENERATE PROJECT</span>
            <span className="material-symbols-outlined text-lg">arrow_forward</span>
          </button>
        </form>

        <p className="text-center text-xs text-[#B0B0B0] mt-3 font-body">
          Start free. Bring your ideas to life.
        </p>
      </section>
    </div>
  );
};
