import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';

interface NavbarProps {
  onOpenSection: (section: 'how-it-works' | 'features' | 'templates' | 'pricing' | 'login') => void;
  onStartBuilding: () => void;
  onVerifyAdminStatus?: () => void;
  activeView?: 'landing' | 'dashboard';
  onNavigateView?: (view: 'landing' | 'dashboard') => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  onOpenSection,
  onStartBuilding,
  onVerifyAdminStatus,
  activeView = 'landing',
  onNavigateView,
}) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { user, isAuthenticated, isAdmin, logout } = useAuth();

  return (
    <>
      <header className="sticky top-0 z-40 w-full bg-[#0B0B0B]/90 backdrop-blur-md border-b border-[#303030] transition-colors">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-14 flex items-center justify-between">
          {/* Brand Logo & Lockup */}
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-[#E5484D] text-2xl" aria-hidden="true">
              terminal
            </span>
            <button
              onClick={() => onNavigateView?.('landing')}
              className="text-base sm:text-lg font-display tracking-tight text-white uppercase inline-flex items-center gap-1.5 font-bold cursor-pointer text-left"
            >
              <span>AI WEBSITE</span>
              <span className="text-[#E5484D] font-extrabold">BUILDER</span>
              <span className="hidden xs:inline text-[10px] text-[#B0B0B0] font-mono border border-[#303030] px-1.5 py-0.5 rounded bg-[#141414]">
                STUDIO
              </span>
            </button>
          </div>

          {/* Desktop Nav Items */}
          <nav className="hidden md:flex items-center gap-6">
            {isAuthenticated && (
              <button
                onClick={() => onNavigateView?.('dashboard')}
                className={`text-sm font-bold transition-colors duration-150 cursor-pointer flex items-center gap-1.5 ${
                  activeView === 'dashboard'
                    ? 'text-[#E5484D] font-mono uppercase tracking-wide'
                    : 'text-[#B0B0B0] hover:text-white'
                }`}
              >
                <span className="material-symbols-outlined text-base">folder_open</span>
                <span>My Projects</span>
              </button>
            )}
            <button
              onClick={() => {
                onNavigateView?.('landing');
                onOpenSection('how-it-works');
              }}
              className="text-sm font-medium text-[#B0B0B0] hover:text-white transition-colors duration-150 cursor-pointer"
            >
              How It Works
            </button>
            <button
              onClick={() => {
                onNavigateView?.('landing');
                onOpenSection('features');
              }}
              className="text-sm font-medium text-[#B0B0B0] hover:text-white transition-colors duration-150 cursor-pointer"
            >
              Features
            </button>
            <button
              onClick={() => {
                onNavigateView?.('landing');
                onOpenSection('templates');
              }}
              className="text-sm font-medium text-[#B0B0B0] hover:text-white transition-colors duration-150 cursor-pointer"
            >
              Templates
            </button>
            <button
              onClick={() => {
                onNavigateView?.('landing');
                onOpenSection('pricing');
              }}
              className="text-sm font-medium text-[#B0B0B0] hover:text-white transition-colors duration-150 cursor-pointer"
            >
              Pricing
            </button>
          </nav>

          {/* Desktop Actions */}
          <div className="hidden sm:flex items-center gap-3">
            {isAuthenticated && user ? (
              <div className="flex items-center gap-2">
                {/* User Identity & Role Badge */}
                <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[#141414] border border-[#303030]">
                  <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
                  <span className="text-xs text-white font-medium max-w-[140px] truncate">
                    {user.name || user.email}
                  </span>
                  {isAdmin ? (
                    <button
                      onClick={onVerifyAdminStatus}
                      title="Click to verify server-side administrator authorization"
                      className="text-[10px] font-mono bg-[#E5484D] text-white px-1.5 py-0.5 rounded font-bold hover:bg-[#D43D42] transition-colors cursor-pointer"
                    >
                      ADMIN
                    </button>
                  ) : (
                    <span className="text-[10px] font-mono bg-[#1B1B1B] text-[#B0B0B0] px-1.5 py-0.5 rounded border border-[#303030]">
                      USER
                    </span>
                  )}
                </div>

                <button
                  onClick={() => logout()}
                  className="text-xs font-medium px-3 py-1.5 rounded-lg bg-[#1B1B1B] text-[#B0B0B0] hover:text-white border border-[#303030] hover:border-neutral-500 transition-colors cursor-pointer"
                >
                  Sign Out
                </button>
              </div>
            ) : (
              <>
                <button
                  onClick={() => onOpenSection('login')}
                  className="text-xs sm:text-sm font-medium px-3.5 py-1.5 rounded-lg bg-[#1B1B1B] text-white border border-[#303030] hover:border-neutral-500 hover:bg-[#222222] transition-colors active:scale-95 cursor-pointer"
                >
                  Log In
                </button>
                <button
                  onClick={onStartBuilding}
                  className="text-xs sm:text-sm font-semibold px-4 py-1.5 rounded-lg bg-[#E5484D] text-white hover:bg-[#D43D42] transition-all active:scale-95 flex items-center gap-1.5 cursor-pointer shadow-sm"
                >
                  <span>Start Building Free</span>
                  <span className="material-symbols-outlined text-sm">arrow_forward</span>
                </button>
              </>
            )}
          </div>

          {/* Mobile Menu Toggle Button */}
          <div className="flex sm:hidden items-center gap-2">
            {isAuthenticated && user ? (
              <span
                className={`text-[10px] font-mono px-1.5 py-0.5 rounded ${
                  isAdmin ? 'bg-[#E5484D] text-white' : 'bg-[#1B1B1B] text-[#B0B0B0]'
                }`}
              >
                {isAdmin ? 'ADMIN' : 'USER'}
              </span>
            ) : (
              <button
                onClick={() => onOpenSection('login')}
                className="text-xs font-medium px-2.5 py-1 rounded bg-[#1B1B1B] text-white border border-[#303030]"
              >
                Log In
              </button>
            )}
            <button
              onClick={() => setMobileMenuOpen(true)}
              aria-label="Open Navigation Drawer"
              className="p-1.5 rounded-lg text-[#B0B0B0] hover:text-white hover:bg-[#1B1B1B] border border-transparent hover:border-[#303030] active:scale-95 transition-all"
            >
              <span className="material-symbols-outlined text-2xl">menu</span>
            </button>
          </div>
        </div>
      </header>

      {/* Mobile Slide-Over Navigation Drawer */}
      {mobileMenuOpen && (
        <div
          className="fixed inset-0 bg-[#0B0B0B]/80 backdrop-blur-sm z-50 transition-opacity"
          onClick={() => setMobileMenuOpen(false)}
        >
          <aside
            className="fixed inset-y-0 right-0 w-80 max-w-[85vw] bg-[#0B0B0B] border-l border-[#303030] flex flex-col h-full p-6 space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-4 border-b border-[#303030]">
              <span className="text-xs font-display text-white font-bold tracking-wider uppercase">
                Studio Navigation
              </span>
              <button
                onClick={() => setMobileMenuOpen(false)}
                className="p-1 rounded text-[#B0B0B0] hover:text-white hover:bg-[#1B1B1B] transition-colors"
                aria-label="Close Navigation"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            {/* User Session Info on Mobile */}
            {isAuthenticated && user && (
              <div className="p-3 rounded-xl bg-[#141414] border border-[#303030] space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-white font-medium truncate">{user.email}</span>
                  <span
                    className={`text-[10px] font-mono px-1.5 py-0.5 rounded font-bold ${
                      isAdmin ? 'bg-[#E5484D] text-white' : 'bg-[#1B1B1B] text-[#B0B0B0]'
                    }`}
                  >
                    {user.role.toUpperCase()}
                  </span>
                </div>
                {isAdmin && (
                  <p className="text-[10px] font-mono text-[#E5484D]">
                    Sole Administrator Identity
                  </p>
                )}
              </div>
            )}

            <nav className="flex flex-col gap-2 pt-2">
              {isAuthenticated && (
                <button
                  onClick={() => {
                    setMobileMenuOpen(false);
                    onNavigateView?.('dashboard');
                  }}
                  className={`flex items-center gap-3 px-3.5 py-2.5 rounded-lg border text-left cursor-pointer transition-colors ${
                    activeView === 'dashboard'
                      ? 'bg-[#E5484D] text-white border-[#E5484D] font-bold'
                      : 'bg-[#141414] text-[#E5484D] border-[#303030] hover:bg-[#1B1B1B]'
                  }`}
                >
                  <span className="material-symbols-outlined">folder_open</span>
                  <span>My Projects</span>
                </button>
              )}

              <button
                onClick={() => {
                  setMobileMenuOpen(false);
                  onNavigateView?.('landing');
                  onOpenSection('how-it-works');
                }}
                className="flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-[#B0B0B0] hover:bg-[#141414] hover:text-white border border-transparent hover:border-[#303030] transition-colors text-left"
              >
                <span className="material-symbols-outlined text-[#E5484D]">hub</span>
                <span>How It Works</span>
              </button>

              <button
                onClick={() => {
                  setMobileMenuOpen(false);
                  onOpenSection('features');
                }}
                className="flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-[#B0B0B0] hover:bg-[#141414] hover:text-white border border-transparent hover:border-[#303030] transition-colors text-left"
              >
                <span className="material-symbols-outlined text-[#B0B0B0]">auto_awesome</span>
                <span>Features</span>
              </button>

              <button
                onClick={() => {
                  setMobileMenuOpen(false);
                  onOpenSection('templates');
                }}
                className="flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-[#B0B0B0] hover:bg-[#141414] hover:text-white border border-transparent hover:border-[#303030] transition-colors text-left"
              >
                <span className="material-symbols-outlined text-[#B0B0B0]">dashboard</span>
                <span>Templates</span>
              </button>

              <button
                onClick={() => {
                  setMobileMenuOpen(false);
                  onOpenSection('pricing');
                }}
                className="flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-[#B0B0B0] hover:bg-[#141414] hover:text-white border border-transparent hover:border-[#303030] transition-colors text-left"
              >
                <span className="material-symbols-outlined text-[#B0B0B0]">payments</span>
                <span>Pricing</span>
              </button>
            </nav>

            <div className="mt-auto pt-4 border-t border-[#303030] flex flex-col gap-3">
              <div className="flex items-center gap-2 font-mono text-[#B0B0B0] text-xs">
                <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
                <span>AI ENGINE V3.2 LIVE</span>
              </div>

              {isAuthenticated ? (
                <button
                  onClick={() => {
                    setMobileMenuOpen(false);
                    logout();
                  }}
                  className="w-full py-2.5 rounded-lg bg-[#1B1B1B] border border-[#303030] text-white text-xs font-semibold hover:bg-[#222222] transition-colors"
                >
                  Sign Out
                </button>
              ) : (
                <button
                  onClick={() => {
                    setMobileMenuOpen(false);
                    onOpenSection('login');
                  }}
                  className="w-full py-2.5 rounded-lg bg-[#E5484D] text-white text-sm font-semibold hover:bg-[#D43D42] transition-colors flex items-center justify-center gap-2"
                >
                  <span>Sign In / Register</span>
                  <span className="material-symbols-outlined text-sm">arrow_forward</span>
                </button>
              )}
            </div>
          </aside>
        </div>
      )}
    </>
  );
};
