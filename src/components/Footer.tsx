import React from 'react';

interface FooterProps {
  onOpenSection: (section: 'how-it-works' | 'features' | 'templates' | 'pricing') => void;
}

export const Footer: React.FC<FooterProps> = ({ onOpenSection }) => {
  return (
    <footer className="w-full py-8 px-4 sm:px-6 lg:px-8 flex flex-col items-center gap-4 bg-[#0B0B0B] border-t border-[#303030] mt-auto text-center">
      {/* Footer Navigation */}
      <div className="flex flex-wrap justify-center items-center gap-4 text-xs sm:text-sm font-medium">
        <button
          onClick={() => onOpenSection('how-it-works')}
          className="text-[#B0B0B0] hover:text-white transition-colors duration-150 cursor-pointer"
        >
          How It Works
        </button>
        <button
          onClick={() => onOpenSection('features')}
          className="text-[#B0B0B0] hover:text-white transition-colors duration-150 cursor-pointer"
        >
          Features
        </button>
        <button
          onClick={() => onOpenSection('pricing')}
          className="text-[#B0B0B0] hover:text-white transition-colors duration-150 cursor-pointer"
        >
          Pricing
        </button>
        <button
          onClick={() => onOpenSection('templates')}
          className="text-[#B0B0B0] hover:text-white transition-colors duration-150 cursor-pointer"
        >
          Templates
        </button>
        <a
          href="https://github.com"
          target="_blank"
          rel="noopener noreferrer"
          className="text-[#B0B0B0] hover:text-white transition-colors duration-150 flex items-center gap-1 cursor-pointer"
        >
          <span>GitHub</span>
          <span className="material-symbols-outlined text-[13px]">open_in_new</span>
        </a>
      </div>

      {/* Brand Signature */}
      <div className="text-sm font-display text-white font-bold tracking-wider uppercase">
        AI WEBSITE <span className="text-[#E5484D]">BUILDER</span> STUDIO
      </div>

      <p className="text-xs text-[#B0B0B0] max-w-sm leading-normal font-body">
        © 2025 AI Website Builder Studio. All rights reserved. Start free. Bring your ideas to life.
      </p>
    </footer>
  );
};
