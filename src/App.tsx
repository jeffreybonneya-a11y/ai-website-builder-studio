import React, { useState } from 'react';
import { Navbar } from './components/Navbar';
import { Hero } from './components/Hero';
import { PromptComposer } from './components/PromptComposer';
import { WorkflowBento } from './components/WorkflowBento';
import { TerminalTeaser } from './components/TerminalTeaser';
import { Footer } from './components/Footer';
import { AuthModal } from './components/auth/AuthModal';
import { AdminVerificationModal } from './components/admin/AdminVerificationModal';
import {
  HowItWorksModal,
  FeaturesModal,
  TemplatesModal,
  PricingModal,
  PromptNoticeModal,
} from './components/modals/SectionModals';
import { useAuth } from './context/AuthContext';

type ActiveSection = 'how-it-works' | 'features' | 'templates' | 'pricing' | 'login' | null;

export default function App() {
  const [activeSection, setActiveSection] = useState<ActiveSection>(null);
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');
  const [adminVerificationOpen, setAdminVerificationOpen] = useState(false);
  const [submittedPrompt, setSubmittedPrompt] = useState<string | null>(null);
  const [viewportMode, setViewportMode] = useState<'responsive' | 'mobile390'>('responsive');

  const { isAuthenticated } = useAuth();

  const handleOpenSection = (section: NonNullable<ActiveSection>) => {
    if (section === 'login') {
      setAuthMode('login');
    }
    setActiveSection(section);
  };

  const handleCloseSection = () => {
    setActiveSection(null);
  };

  const handleStartBuilding = () => {
    if (!isAuthenticated) {
      setAuthMode('register');
      setActiveSection('login');
    } else {
      const el = document.getElementById('promptInput');
      if (el) {
        el.focus();
        el.scrollIntoView({ behavior: 'smooth' });
      }
    }
  };

  const handleGenerateClick = (promptText: string) => {
    setSubmittedPrompt(promptText);
  };

  const handleSelectTemplatePrompt = (templatePrompt: string) => {
    const el = document.getElementById('promptInput') as HTMLTextAreaElement | null;
    if (el) {
      el.value = templatePrompt;
      el.focus();
    }
  };

  return (
    <div className="min-h-screen bg-[#0B0B0B] text-white flex flex-col items-center">
      {/* Viewport Width Control Bar (For rapid mobile 390px / responsive testing) */}
      <div className="w-full bg-[#0E0E10] border-b border-[#303030] py-1 px-4 flex items-center justify-between text-[11px] font-mono text-[#B0B0B0]">
        <div className="flex items-center gap-2">
          <span className="w-1.5 h-1.5 rounded-full bg-[#E5484D]"></span>
          <span>STITCH DESIGN SYSTEM: OBSIDIAN CRIMSON</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="hidden sm:inline text-[#B0B0B0]/70">Viewport Mode:</span>
          <button
            onClick={() => setViewportMode('responsive')}
            className={`px-2 py-0.5 rounded transition-all cursor-pointer ${
              viewportMode === 'responsive'
                ? 'bg-[#1B1B1B] text-white border border-[#303030]'
                : 'text-[#B0B0B0] hover:text-white'
            }`}
          >
            Fluid Responsive
          </button>
          <button
            onClick={() => setViewportMode('mobile390')}
            className={`px-2 py-0.5 rounded transition-all cursor-pointer ${
              viewportMode === 'mobile390'
                ? 'bg-[#E5484D] text-white'
                : 'text-[#B0B0B0] hover:text-white'
            }`}
          >
            Stitch Mobile (390px)
          </button>
        </div>
      </div>

      {/* Main Container Wrapper - Supports fluid responsive & Stitch 390px simulation */}
      <div
        className={`w-full transition-all duration-300 flex flex-col min-h-screen ${
          viewportMode === 'mobile390'
            ? 'max-w-[430px] border-x border-[#303030] bg-[#0B0B0B] shadow-2xl'
            : 'max-w-7xl'
        }`}
      >
        {/* Top App Bar Navigation */}
        <Navbar
          onOpenSection={handleOpenSection}
          onStartBuilding={handleStartBuilding}
          onVerifyAdminStatus={() => setAdminVerificationOpen(true)}
        />

        {/* Main Content Area */}
        <main className="flex-1 w-full px-4 sm:px-6 lg:px-8 flex flex-col items-center">
          {/* Hero Section */}
          <Hero />

          {/* Prompt Composer */}
          <PromptComposer
            onGenerateClick={handleGenerateClick}
          />

          {/* Workflow Bento Engine */}
          <WorkflowBento />

          {/* Terminal Teaser */}
          <TerminalTeaser />
        </main>

        {/* Footer */}
        <Footer onOpenSection={handleOpenSection} />
      </div>

      {/* Modals for Clean Section Access */}
      {activeSection === 'how-it-works' && (
        <HowItWorksModal onClose={handleCloseSection} />
      )}
      {activeSection === 'features' && (
        <FeaturesModal onClose={handleCloseSection} />
      )}
      {activeSection === 'templates' && (
        <TemplatesModal
          onClose={handleCloseSection}
          onSelectPrompt={handleSelectTemplatePrompt}
        />
      )}
      {activeSection === 'pricing' && (
        <PricingModal onClose={handleCloseSection} />
      )}
      {activeSection === 'login' && (
        <AuthModal
          onClose={handleCloseSection}
        />
      )}

      {/* Admin Status Verification Modal */}
      {adminVerificationOpen && (
        <AdminVerificationModal onClose={() => setAdminVerificationOpen(false)} />
      )}

      {/* Prompt Submission Confirmation Dialog */}
      {submittedPrompt && (
        <PromptNoticeModal
          prompt={submittedPrompt}
          onClose={() => setSubmittedPrompt(null)}
        />
      )}
    </div>
  );
}
