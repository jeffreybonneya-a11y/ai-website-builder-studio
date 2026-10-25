import React from 'react';

interface WorkflowCardProps {
  icon: string;
  title: string;
  description: string;
  badge?: string;
}

const WORKFLOW_ITEMS: WorkflowCardProps[] = [
  {
    icon: 'code',
    title: 'Live Code Gen',
    description: 'Clean React, Tailwind, & Next.js architectures generated instantly.',
    badge: 'Dual Engine',
  },
  {
    icon: 'terminal',
    title: 'Direct GitHub Sync',
    description: 'Automated commit, PR, and repo deployment with one keypress.',
    badge: 'OAuth V2',
  },
  {
    icon: 'visibility',
    title: 'Live Preview',
    description: 'Multi-device interactive sandboxes with zero setup overhead.',
    badge: 'Real-time',
  },
  {
    icon: 'tune',
    title: 'Inline Editor',
    description: 'Refine designs, edit copy, and tailor layouts visually or via code.',
    badge: 'Visual AST',
  },
];

export const WorkflowBento: React.FC = () => {
  return (
    <section className="w-full max-w-2xl mx-auto space-y-3 my-8">
      <div className="flex items-center justify-between">
        <h2 className="text-lg sm:text-xl font-display font-bold text-white tracking-tight">
          Studio Workflow Engine
        </h2>
        <span className="font-mono text-[11px] text-[#B0B0B0]">v3.2 Core</span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {WORKFLOW_ITEMS.map((item) => (
          <div
            key={item.title}
            className="p-4 rounded-xl bg-[#141414] border border-[#303030] space-y-2 hover:border-neutral-500 hover:bg-[#181818] transition-all group cursor-default"
          >
            <div className="flex items-center justify-between">
              <span className="material-symbols-outlined text-[#E5484D] text-xl group-hover:scale-110 transition-transform">
                {item.icon}
              </span>
              <span className="text-[10px] font-mono text-[#B0B0B0] bg-[#1B1B1B] px-2 py-0.5 rounded border border-[#303030]">
                {item.badge}
              </span>
            </div>
            <h3 className="text-sm font-display text-white font-semibold">{item.title}</h3>
            <p className="text-xs text-[#B0B0B0] leading-relaxed font-body">
              {item.description}
            </p>
          </div>
        ))}
      </div>
    </section>
  );
};
