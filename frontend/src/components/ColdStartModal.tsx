import React, { useState, useEffect } from 'react';
import { Shield, Sparkles, Cpu } from 'lucide-react';

interface ColdStartModalProps {
  isLoading: boolean;
  message?: string;
}

export const ColdStartModal: React.FC<ColdStartModalProps> = ({
  isLoading,
  message = 'Connecting to Zero-Knowledge Enclave...',
}) => {
  const [seconds, setSeconds] = useState(0);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isLoading) {
      setSeconds(0);
      interval = setInterval(() => {
        setSeconds((s) => s + 1);
      }, 1000);
    } else {
      setSeconds(0);
    }
    return () => clearInterval(interval);
  }, [isLoading]);

  if (!isLoading) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="cold-start-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn"
    >
      <div className="relative w-full max-w-md bg-zinc-950 border border-blue-500/30 rounded-2xl p-6 shadow-2xl shadow-blue-500/10 text-center font-mono overflow-hidden">
        {/* Glow orb */}
        <div className="absolute -top-24 -left-24 w-48 h-48 bg-blue-600/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -right-24 w-48 h-48 bg-purple-600/20 rounded-full blur-3xl pointer-events-none" />

        {/* Pulsing Shield & Enclave Ring */}
        <div className="relative mx-auto mb-5 w-20 h-20 flex items-center justify-center">
          <div className="absolute inset-0 rounded-full border-2 border-blue-500/40 border-t-transparent animate-spin" />
          <div className="absolute inset-2 rounded-full border-2 border-purple-500/30 border-b-transparent animate-spin" style={{ animationDirection: 'reverse', animationDuration: '3s' }} />
          <div className="w-12 h-12 rounded-xl bg-blue-600/20 border border-blue-400/40 flex items-center justify-center shadow-inner">
            <Shield className="w-6 h-6 text-blue-400 animate-pulse" />
          </div>
        </div>

        <h3 id="cold-start-title" className="text-base font-bold text-white mb-2 tracking-wide flex items-center justify-center space-x-2">
          <span>{message}</span>
        </h3>

        {/* Time counter & Cloud cold-start explanation */}
        <div className="my-3 py-2.5 px-3 rounded-lg bg-zinc-900/80 border border-zinc-800 text-xs text-zinc-400 space-y-1">
          <div className="flex items-center justify-between text-[11px] text-zinc-400">
            <span className="flex items-center space-x-1.5 font-semibold">
              <Cpu className="w-3.5 h-3.5 text-blue-400" />
              <span>Cloud Enclave Handshake</span>
            </span>
            <span className="font-bold text-blue-400 px-1.5 py-0.5 rounded bg-blue-950/60 border border-blue-800/50">
              {seconds}s
            </span>
          </div>

          <div className="w-full bg-zinc-800 rounded-full h-1.5 overflow-hidden mt-2">
            <div
              className="bg-gradient-to-r from-blue-500 to-purple-500 h-full rounded-full transition-all duration-300 animate-pulse"
              style={{ width: `${Math.min(100, Math.max(15, seconds * 5))}%` }}
            />
          </div>
        </div>

        <p className="text-[11px] text-zinc-400 leading-relaxed mb-4">
          {seconds > 3 ? (
            <span className="text-amber-300 font-semibold">
              ⚡ Backend is waking up from idle state. Cloud spin-up takes ~15–25s on first request. Thank you for your patience!
            </span>
          ) : (
            <span>Securing payload with hardware AES-256-GCM and connecting to zero-knowledge cluster...</span>
          )}
        </p>

        <div className="flex items-center justify-center space-x-2 text-[10px] text-zinc-500">
          <Sparkles className="w-3 h-3 text-blue-400" />
          <span>Hardware WebCrypto • Zero-Knowledge Isolation</span>
        </div>
      </div>
    </div>
  );
};
export default ColdStartModal;
