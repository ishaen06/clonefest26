import React from 'react';
import { X, Check, Minus, Zap, Shield, Lock, Eye, Clock, Terminal, Users } from 'lucide-react';

interface WhyUsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const WhyUsModal: React.FC<WhyUsModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  const comparisonFeatures = [
    {
      feature: 'Multi-Party Key Quorum (Shamir SSS)',
      jigsaw: 'Native GF(2^8) K-of-N Threshold Key Splitting',
      privateBin: 'Not Supported (Single key only)',
      jigsawAdvantage: true,
      impact: 'Enables multi-sig authorization and emergency trustee escrow with zero single-point-of-failure.',
      icon: Users,
    },
    {
      feature: 'Full Developer Code IDE',
      jigsaw: 'Integrated IDE with 15+ syntax highlighters & auto-detect',
      privateBin: 'Plain textarea / basic <pre> block',
      jigsawAdvantage: true,
      impact: 'True engineering experience with line numbers, indentation, and syntax detection.',
      icon: Terminal,
    },
    {
      feature: 'Physical OpSec (Hover Lens & Panic Mask)',
      jigsaw: 'Gaussian privacy hover blur + ESC decoy emergency key',
      privateBin: 'None (Plaintext fully visible)',
      jigsawAdvantage: true,
      impact: 'Prevents shoulder surfing in public spaces, coffee shops, and open offices.',
      icon: Eye,
    },
    {
      feature: 'Ephemeral RAM Auto-Zeroization',
      jigsaw: 'Post-open vanishing countdowns (30s, 60s, 2m, 5m)',
      privateBin: 'None (Persists in memory until tab close)',
      jigsawAdvantage: true,
      impact: 'Mitigates browser memory dumps, forensic cache retrieval, and DOM inspection.',
      icon: Clock,
    },
    {
      feature: 'Multi-Vault File Bundling',
      jigsaw: 'Simultaneous text, code IDE, and multiple encrypted file attachments',
      privateBin: 'Single file attachment only',
      jigsawAdvantage: true,
      impact: 'Bundle entire deployment secrets (API keys, .env configs, certificates) in one link.',
      icon: Lock,
    },
    {
      feature: 'Remote Revocation & Telemetry Token',
      jigsaw: 'Sender management token to monitor views & revoke on-demand',
      privateBin: 'Delete token only for immediate deletion',
      jigsawAdvantage: true,
      impact: 'Full sender lifecycle control to inspect access audit trail before self-destruction.',
      icon: Shield,
    },
    {
      feature: 'Hardware Cryptography API',
      jigsaw: 'W3C Hardware WebCrypto (AES-256-GCM + PBKDF2 600k)',
      privateBin: 'SJCL (Legacy pure JS library)',
      jigsawAdvantage: true,
      impact: 'Hardware-accelerated and immune to JavaScript timing side-channel attacks.',
      icon: Zap,
    },
  ];

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="why-us-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fadeIn"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-4xl max-h-[90vh] bg-zinc-950 border border-blue-500/40 rounded-2xl shadow-2xl shadow-blue-500/10 flex flex-col font-mono overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-800 bg-zinc-900/50 flex-shrink-0">
          <div className="flex items-center space-x-3">
            <div className="w-9 h-9 rounded-xl bg-blue-600/20 border border-blue-500/40 flex items-center justify-center">
              <Zap className="w-5 h-5 text-blue-400" />
            </div>
            <div>
              <h2 id="why-us-title" className="text-base font-bold text-white tracking-tight">
                Why JigsawBin vs PrivateBin?
              </h2>
              <p className="text-xs text-zinc-400">Meaningful Differentiation & Architectural Innovations</p>
            </div>
          </div>
          <button
            onClick={onClose}
            aria-label="Close comparison modal"
            className="p-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-400 hover:text-white transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="p-6 overflow-y-auto space-y-4 text-xs">
          <p className="text-zinc-300 leading-relaxed text-xs">
            While traditional encrypted pastebins like PrivateBin popularized client-side AES paste sharing,{' '}
            <strong className="text-blue-400">JigsawBin redesigns ephemeral secrecy for the modern developer and security-conscious team</strong> with
            threshold cryptography, physical OpSec protections, and developer-native tooling.
          </p>

          {/* Comparison Cards / Table */}
          <div className="space-y-3">
            {comparisonFeatures.map((item, idx) => {
              const Icon = item.icon;
              return (
                <div
                  key={idx}
                  className="rounded-xl bg-zinc-900/70 border border-zinc-800 hover:border-blue-500/30 p-4 transition-all duration-200"
                >
                  <div className="flex items-start justify-between gap-3 flex-wrap">
                    <div className="flex items-center space-x-2.5">
                      <div className="w-7 h-7 rounded-lg bg-blue-950/60 border border-blue-800/40 flex items-center justify-center flex-shrink-0">
                        <Icon className="w-3.5 h-3.5 text-blue-400" />
                      </div>
                      <h3 className="font-bold text-sm text-zinc-100">{item.feature}</h3>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-3">
                    <div className="p-2.5 rounded-lg bg-blue-950/20 border border-blue-500/30">
                      <div className="flex items-center space-x-1.5 text-blue-400 font-bold mb-1 text-[11px]">
                        <Check className="w-3.5 h-3.5" />
                        <span>🧩 JigsawBin</span>
                      </div>
                      <p className="text-zinc-200 text-xs">{item.jigsaw}</p>
                    </div>

                    <div className="p-2.5 rounded-lg bg-zinc-950/60 border border-zinc-800/80">
                      <div className="flex items-center space-x-1.5 text-zinc-500 font-bold mb-1 text-[11px]">
                        <Minus className="w-3.5 h-3.5" />
                        <span>📦 PrivateBin</span>
                      </div>
                      <p className="text-zinc-400 text-xs">{item.privateBin}</p>
                    </div>
                  </div>

                  <div className="mt-2.5 pt-2 border-t border-zinc-800/60 text-[11px] text-zinc-400">
                    <strong className="text-blue-300">Why it matters:</strong> {item.impact}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 border-t border-zinc-800 bg-zinc-900/40 flex items-center justify-between text-xs text-zinc-400 flex-shrink-0">
          <span>Hardware WebCrypto (AES-256-GCM) • Zero Plaintext Stored</span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs transition"
          >
            Got It
          </button>
        </div>
      </div>
    </div>
  );
};
export default WhyUsModal;
