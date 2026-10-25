import React, { useState } from 'react';

interface ModalWrapperProps {
  title: string;
  subtitle?: string;
  onClose: () => void;
  children: React.ReactNode;
}

const ModalWrapper: React.FC<ModalWrapperProps> = ({ title, subtitle, onClose, children }) => (
  <div
    className="fixed inset-0 z-50 bg-[#0B0B0B]/85 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto"
    onClick={onClose}
  >
    <div
      className="w-full max-w-2xl bg-[#141414] border border-[#303030] rounded-2xl shadow-2xl overflow-hidden my-8"
      onClick={(e) => e.stopPropagation()}
    >
      <div className="flex items-center justify-between px-6 py-4 border-b border-[#303030] bg-[#0E0E10]">
        <div>
          <h2 className="text-base sm:text-lg font-display font-bold text-white uppercase tracking-wide">
            {title}
          </h2>
          {subtitle && <p className="text-xs text-[#B0B0B0] font-body mt-0.5">{subtitle}</p>}
        </div>
        <button
          onClick={onClose}
          className="p-1.5 rounded-lg text-[#B0B0B0] hover:text-white hover:bg-[#1B1B1B] border border-transparent hover:border-[#303030] transition-colors cursor-pointer"
          aria-label="Close modal"
        >
          <span className="material-symbols-outlined text-xl">close</span>
        </button>
      </div>
      <div className="p-6 max-h-[75vh] overflow-y-auto text-sm">{children}</div>
    </div>
  </div>
);

/* ---------------- How It Works Modal ---------------- */
export const HowItWorksModal: React.FC<{ onClose: () => void }> = ({ onClose }) => {
  const steps = [
    {
      num: '01',
      title: 'Prompt & Blueprint',
      desc: 'Type your requirements in natural language or choose an enterprise starter. Describe pages, data models, or visual style.',
    },
    {
      num: '02',
      title: 'AI Code Synthesis',
      desc: 'The AI model synthesizes a complete, production-grade codebase with modular React components and Tailwind CSS styling.',
    },
    {
      num: '03',
      title: 'Inspect, Edit & Preview',
      desc: 'Test your application in real time across mobile (390px), tablet (768px), and desktop viewports in an isolated sandbox.',
    },
    {
      num: '04',
      title: 'Push to GitHub',
      desc: 'Publish your clean project directly to your GitHub repository with one click. Deploy wherever you choose.',
    },
  ];

  return (
    <ModalWrapper
      title="How It Works"
      subtitle="From natural language prompt to a fullstack web application in minutes"
      onClose={onClose}
    >
      <div className="space-y-4">
        {steps.map((s) => (
          <div
            key={s.num}
            className="flex items-start gap-4 p-4 rounded-xl bg-[#1B1B1B] border border-[#303030]"
          >
            <span className="font-mono text-xs font-bold text-[#E5484D] bg-[#141414] px-2.5 py-1 rounded border border-[#303030]">
              {s.num}
            </span>
            <div className="space-y-1">
              <h3 className="text-sm font-display font-semibold text-white">{s.title}</h3>
              <p className="text-xs text-[#B0B0B0] font-body leading-relaxed">{s.desc}</p>
            </div>
          </div>
        ))}

        <div className="pt-2 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg bg-[#E5484D] text-white text-xs font-display font-bold uppercase hover:bg-[#D43D42] transition-colors"
          >
            Got It
          </button>
        </div>
      </div>
    </ModalWrapper>
  );
};

/* ---------------- Features Modal ---------------- */
export const FeaturesModal: React.FC<{ onClose: () => void }> = ({ onClose }) => {
  const features = [
    {
      icon: 'code',
      title: 'Production Code Generation',
      desc: 'Generates clean, maintainable React and Tailwind code with zero proprietary lock-in. You own every line.',
    },
    {
      icon: 'devices',
      title: 'Responsive Multi-Device Sandbox',
      desc: 'Test your responsive designs in mobile (390px), tablet (768px), and desktop viewports with hot reload.',
    },
    {
      icon: 'terminal',
      title: 'Direct Official GitHub Sync',
      desc: 'Authenticate securely, pick or create a repo, and push verified commits directly to your GitHub branches.',
    },
    {
      icon: 'payments',
      title: 'Dual-Currency Pricing & Billing',
      desc: 'Native support for both Ghanaian Cedi (GH₵) and US Dollar ($) with secure Paystack billing.',
    },
    {
      icon: 'shield_person',
      title: 'Private Owner-Only Dashboard',
      desc: 'Strictly restricted server-authoritative admin telemetry for revenue, users, and AI cost controls.',
    },
    {
      icon: 'tune',
      title: 'Controlled AI File Edits',
      desc: 'Inspect proposed code changes and diffs before applying them to your workspace files.',
    },
  ];

  return (
    <ModalWrapper
      title="Platform Features"
      subtitle="Crafted for creators, engineers, and founders"
      onClose={onClose}
    >
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {features.map((f) => (
          <div
            key={f.title}
            className="p-3.5 rounded-xl bg-[#1B1B1B] border border-[#303030] space-y-1.5"
          >
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-[#E5484D] text-base">{f.icon}</span>
              <h3 className="text-xs font-display font-semibold text-white">{f.title}</h3>
            </div>
            <p className="text-[11px] text-[#B0B0B0] font-body leading-relaxed">{f.desc}</p>
          </div>
        ))}
      </div>
      <div className="pt-4 flex justify-end">
        <button
          onClick={onClose}
          className="px-4 py-2 rounded-lg bg-[#1B1B1B] text-white text-xs font-display font-medium border border-[#303030] hover:border-neutral-500 transition-colors"
        >
          Close
        </button>
      </div>
    </ModalWrapper>
  );
};

/* ---------------- Templates Modal ---------------- */
export const TemplatesModal: React.FC<{
  onClose: () => void;
  onSelectPrompt: (p: string) => void;
}> = ({ onClose, onSelectPrompt }) => {
  const templates = [
    {
      name: 'Modern SaaS Dashboard',
      category: 'Analytics & Web App',
      prompt: 'Build a sleek SaaS analytics dashboard with dark mode, revenue metrics, and interactive charts',
    },
    {
      name: 'E-Commerce Storefront',
      category: 'Retail & Payments',
      prompt: 'Create an e-commerce online store with product catalog, shopping cart, and Paystack checkout',
    },
    {
      name: 'School Management Portal',
      category: 'Education & Administration',
      prompt: 'Build a school management website with student records, attendance tracking, and grade reports',
    },
    {
      name: 'Developer Portfolio',
      category: 'Personal Brand',
      prompt: 'Create a minimalist developer portfolio with project showcases, GitHub activity, and contact form',
    },
    {
      name: 'Restaurant & Food Ordering',
      category: 'Hospitality',
      prompt: 'Build a restaurant website with interactive menu categories, order customization, and table reservation',
    },
    {
      name: 'Clinic & Appointment Booking',
      category: 'Healthcare',
      prompt: 'Build a healthcare clinic website with doctor profiles, service directory, and appointment calendar',
    },
  ];

  return (
    <ModalWrapper
      title="Project Templates"
      subtitle="Pick a curated starting point or inspire your next web project"
      onClose={onClose}
    >
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {templates.map((t) => (
          <div
            key={t.name}
            className="p-3.5 rounded-xl bg-[#1B1B1B] border border-[#303030] space-y-2 hover:border-[#E5484D] transition-all flex flex-col justify-between"
          >
            <div>
              <span className="text-[10px] font-mono text-[#E5484D] uppercase tracking-wider">
                {t.category}
              </span>
              <h3 className="text-xs font-display font-semibold text-white mt-0.5">{t.name}</h3>
              <p className="text-[11px] text-[#B0B0B0] font-body mt-1 line-clamp-2">{t.prompt}</p>
            </div>
            <button
              onClick={() => {
                onSelectPrompt(t.prompt);
                onClose();
              }}
              className="mt-2 w-full py-1.5 rounded bg-[#141414] hover:bg-[#E5484D] text-white text-[11px] font-medium border border-[#303030] hover:border-transparent transition-colors flex items-center justify-center gap-1.5"
            >
              <span>Use Blueprint</span>
              <span className="material-symbols-outlined text-[13px]">arrow_forward</span>
            </button>
          </div>
        ))}
      </div>
    </ModalWrapper>
  );
};

/* ---------------- Pricing Modal (Dual Currency GHS / USD) ---------------- */
export const PricingModal: React.FC<{ onClose: () => void }> = ({ onClose }) => {
  const [currency, setCurrency] = useState<'GHS' | 'USD'>('GHS');

  const plans = [
    {
      name: 'Free Starter',
      tag: 'Explore',
      price: currency === 'GHS' ? 'GH₵ 0' : '$0',
      period: 'forever',
      credits: '4,000 intro tokens',
      features: [
        'Standard AI code synthesis',
        'Multi-device live preview',
        'Up to 2 active projects',
        'Direct GitHub sync',
        'Community support',
      ],
      popular: false,
    },
    {
      name: 'Builder',
      tag: 'Most Popular',
      price: currency === 'GHS' ? 'GH₵ 199' : '$19',
      period: 'per month',
      credits: '50,000 monthly credits',
      features: [
        'Advanced fullstack generation',
        'Unlimited code edits & diffs',
        'Unlimited active projects',
        'Direct GitHub sync & branching',
        'High-speed generation priority',
      ],
      popular: true,
    },
    {
      name: 'Pro Builder',
      tag: 'Power Users',
      price: currency === 'GHS' ? 'GH₵ 499' : '$49',
      period: 'per month',
      credits: '200,000 monthly credits',
      features: [
        'Maximum AI reasoning capability',
        'Multi-file architectural refactoring',
        'Priority Paystack billing support',
        'Early access to next-gen models',
        'Dedicated developer assistance',
      ],
      popular: false,
    },
  ];

  return (
    <ModalWrapper
      title="Transparent Plans & Pricing"
      subtitle="Authoritative server-controlled credits. Configurable in Ghanaian Cedi and US Dollars."
      onClose={onClose}
    >
      <div className="space-y-5">
        {/* Currency Switcher */}
        <div className="flex items-center justify-center gap-2 pb-2">
          <span className="text-xs text-[#B0B0B0] font-medium">Select Currency:</span>
          <div className="inline-flex rounded-lg bg-[#1B1B1B] p-0.5 border border-[#303030]">
            <button
              onClick={() => setCurrency('GHS')}
              className={`px-3 py-1 rounded-md text-xs font-mono font-semibold transition-all ${
                currency === 'GHS'
                  ? 'bg-[#E5484D] text-white shadow'
                  : 'text-[#B0B0B0] hover:text-white'
              }`}
            >
              GH₵ GHS (Ghana)
            </button>
            <button
              onClick={() => setCurrency('USD')}
              className={`px-3 py-1 rounded-md text-xs font-mono font-semibold transition-all ${
                currency === 'USD'
                  ? 'bg-[#E5484D] text-white shadow'
                  : 'text-[#B0B0B0] hover:text-white'
              }`}
            >
              $ USD (Global)
            </button>
          </div>
        </div>

        {/* Plan Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {plans.map((p) => (
            <div
              key={p.name}
              className={`p-4 rounded-xl flex flex-col justify-between border transition-all ${
                p.popular
                  ? 'bg-[#181818] border-[#E5484D] shadow-lg relative'
                  : 'bg-[#1B1B1B] border-[#303030]'
              }`}
            >
              <div>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-display font-bold text-white uppercase">
                    {p.name}
                  </span>
                  {p.popular && (
                    <span className="text-[10px] font-mono text-[#E5484D] bg-[#E5484D]/15 px-2 py-0.5 rounded border border-[#E5484D]/30">
                      {p.tag}
                    </span>
                  )}
                </div>

                <div className="my-3">
                  <span className="text-xl sm:text-2xl font-display font-extrabold text-white">
                    {p.price}
                  </span>
                  <span className="text-[11px] text-[#B0B0B0] ml-1 font-body">/{p.period}</span>
                </div>

                <div className="text-[11px] font-mono text-[#E5484D] mb-3 pb-2 border-b border-[#303030]">
                  {p.credits}
                </div>

                <ul className="space-y-1.5 text-[11px] text-[#B0B0B0] font-body">
                  {p.features.map((feat) => (
                    <li key={feat} className="flex items-center gap-1.5">
                      <span className="text-emerald-400 font-bold">✓</span>
                      <span>{feat}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="mt-4 pt-2">
                <button
                  onClick={onClose}
                  className={`w-full py-2 rounded-lg text-xs font-display font-semibold transition-colors ${
                    p.popular
                      ? 'bg-[#E5484D] hover:bg-[#D43D42] text-white'
                      : 'bg-[#141414] hover:bg-[#202020] text-white border border-[#303030]'
                  }`}
                >
                  {p.name === 'Free Starter' ? 'Current Plan' : 'Select Plan'}
                </button>
              </div>
            </div>
          ))}
        </div>

        <p className="text-center text-[11px] text-[#B0B0B0] font-mono">
          Paystack payments with verified webhooks and server-controlled credit allocation will be
          enabled in Stage 6 upon approval.
        </p>
      </div>
    </ModalWrapper>
  );
};

/* ---------------- Log In Modal ---------------- */
export const LoginModal: React.FC<{ onClose: () => void }> = ({ onClose }) => {
  return (
    <ModalWrapper
      title="Studio Account Access"
      subtitle="Sign in to your AI Website Builder Studio workspace"
      onClose={onClose}
    >
      <div className="space-y-4">
        <div className="p-3.5 rounded-xl bg-[#1B1B1B] border border-[#303030] text-xs text-[#B0B0B0] space-y-2">
          <div className="flex items-center gap-2 text-white font-semibold">
            <span className="material-symbols-outlined text-[#E5484D] text-base">verified_user</span>
            <span>Security Architecture & Status</span>
          </div>
          <p>
            In accordance with the approved Stage 1 boundaries, live authentication is reserved for
            Stage 2.
          </p>
          <p className="font-mono text-[11px] text-[#E5484D]">
            Sole administrator Gmail reserved: <strong>jeffreybonneya@gmail.com</strong>
          </p>
        </div>

        <form onSubmit={(e) => { e.preventDefault(); onClose(); }} className="space-y-3">
          <div>
            <label className="block text-xs font-mono text-[#B0B0B0] mb-1">Email Address</label>
            <input
              type="email"
              disabled
              value="jeffreybonneya@gmail.com"
              className="w-full bg-[#1B1B1B] text-white rounded-lg p-2.5 text-xs font-body border border-[#303030] opacity-80"
            />
          </div>
          <div>
            <label className="block text-xs font-mono text-[#B0B0B0] mb-1">Password</label>
            <input
              type="password"
              disabled
              placeholder="••••••••••••"
              className="w-full bg-[#1B1B1B] text-white rounded-lg p-2.5 text-xs font-body border border-[#303030] opacity-80"
            />
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-full py-2.5 rounded-lg bg-[#E5484D] text-white text-xs font-display font-bold uppercase hover:bg-[#D43D42] transition-colors"
          >
            Close Stage 1 Preview
          </button>
        </form>
      </div>
    </ModalWrapper>
  );
};

/* ---------------- Prompt Generation Notice Modal ---------------- */
export const PromptNoticeModal: React.FC<{
  prompt: string;
  onClose: () => void;
}> = ({ prompt, onClose }) => {
  return (
    <ModalWrapper
      title="Project Prompt Ready"
      subtitle="Input captured in Obsidian Crimson Studio"
      onClose={onClose}
    >
      <div className="space-y-4">
        <div className="p-4 rounded-xl bg-[#1B1B1B] border border-[#303030] space-y-2">
          <div className="flex items-center justify-between text-xs font-mono text-[#B0B0B0]">
            <span>Captured Prompt</span>
            <span className="text-[#E5484D]">Tokens: ~{Math.round(prompt.length / 4)} tokens</span>
          </div>
          <p className="text-sm text-white font-body bg-[#141414] p-3 rounded-lg border border-[#303030] italic">
            "{prompt}"
          </p>
        </div>

        <div className="p-3.5 rounded-xl bg-[#141414] border border-[#303030] text-xs text-[#B0B0B0] space-y-1.5">
          <p className="text-white font-semibold flex items-center gap-1.5">
            <span className="material-symbols-outlined text-[#E5484D] text-base">check_circle</span>
            <span>Stage 1 UI Validation Successful</span>
          </p>
          <p>
            Your prompt input and quick-starter chips work seamlessly across mobile, tablet, and
            desktop layouts.
          </p>
          <p className="text-[11px] font-mono text-[#B0B0B0]">
            Full AI synthesis, 3-panel workspace, and GitHub sync will be integrated in Stage 2 and
            Stage 4 upon approval.
          </p>
        </div>

        <div className="flex justify-end gap-2 pt-2">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg bg-[#E5484D] text-white text-xs font-display font-bold uppercase hover:bg-[#D43D42] transition-colors"
          >
            Continue Exploring
          </button>
        </div>
      </div>
    </ModalWrapper>
  );
};
