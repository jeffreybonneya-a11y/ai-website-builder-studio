import React, { useState, useEffect } from 'react';

interface AdminVerificationModalProps {
  onClose: () => void;
}

interface VerificationResult {
  status: string;
  role: string;
  administrator: string;
  timestamp: string;
  message: string;
}

export const AdminVerificationModal: React.FC<AdminVerificationModalProps> = ({ onClose }) => {
  const [loading, setLoading] = useState(true);
  const [result, setResult] = useState<VerificationResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch('/api/admin/verify', {
      method: 'GET',
      credentials: 'include', // Send HttpOnly cookie automatically
    })
      .then(async (res) => {
        const data = await res.json();
        if (!res.ok) {
          throw new Error(data.error || 'Server rejected administrator verification.');
        }
        setResult(data);
      })
      .catch((err: unknown) => {
        const msg = err instanceof Error ? err.message : 'Verification failed';
        setError(msg);
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

  return (
    <div
      className="fixed inset-0 z-50 bg-[#0B0B0B]/85 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto"
      onClick={onClose}
    >
      <div
        className="w-full max-w-lg bg-[#141414] border border-[#303030] rounded-2xl shadow-2xl overflow-hidden my-8"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#303030] bg-[#0E0E10]">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-[#E5484D] text-xl">admin_panel_settings</span>
            <h2 className="text-sm font-display font-bold text-white uppercase tracking-wide">
              Administrator Server Verification
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-[#B0B0B0] hover:text-white hover:bg-[#1B1B1B] transition-colors"
          >
            <span className="material-symbols-outlined text-lg">close</span>
          </button>
        </div>

        <div className="p-6 space-y-4">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-8 space-y-3">
              <span className="w-6 h-6 border-2 border-[#E5484D] border-t-transparent rounded-full animate-spin"></span>
              <p className="text-xs font-mono text-[#B0B0B0]">
                Contacting server-side authorization authority (/api/admin/verify)...
              </p>
            </div>
          ) : error ? (
            <div className="p-4 rounded-xl bg-[#690005]/40 border border-[#FF5357]/40 space-y-2">
              <div className="flex items-center gap-2 text-white font-semibold text-xs">
                <span className="material-symbols-outlined text-[#FF5357] text-base">gpp_bad</span>
                <span>Administrator Verification Failed</span>
              </div>
              <p className="text-xs text-[#B0B0B0] font-body">{error}</p>
            </div>
          ) : result ? (
            <div className="space-y-3">
              <div className="p-4 rounded-xl bg-[#1B1B1B] border border-emerald-500/40 space-y-2">
                <div className="flex items-center gap-2 text-emerald-400 font-bold text-xs">
                  <span className="material-symbols-outlined text-base">verified</span>
                  <span>Server-Side Authorization Confirmed</span>
                </div>
                <p className="text-xs text-[#B0B0B0] font-body">
                  The Express server successfully validated your HttpOnly cookie session and
                  verified matching administrator credentials.
                </p>
              </div>

              <div className="p-4 rounded-xl bg-[#0E0E10] border border-[#303030] font-mono text-[11px] space-y-1.5">
                <div className="flex justify-between border-b border-[#303030] pb-1">
                  <span className="text-[#B0B0B0]">Identity:</span>
                  <span className="text-white font-bold">{result.administrator}</span>
                </div>
                <div className="flex justify-between border-b border-[#303030] pb-1">
                  <span className="text-[#B0B0B0]">Server Role:</span>
                  <span className="text-[#E5484D] font-bold uppercase">{result.role}</span>
                </div>
                <div className="flex justify-between border-b border-[#303030] pb-1">
                  <span className="text-[#B0B0B0]">Authority:</span>
                  <span className="text-emerald-400">Strict Match (Designated Admin Allowlist)</span>
                </div>
                <div className="flex justify-between pt-1">
                  <span className="text-[#B0B0B0]">Verified At:</span>
                  <span className="text-[#B0B0B0]">{result.timestamp}</span>
                </div>
              </div>
            </div>
          ) : null}

          <div className="pt-2 flex justify-end">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-lg bg-[#1B1B1B] text-white text-xs font-display font-medium border border-[#303030] hover:border-neutral-500 transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
