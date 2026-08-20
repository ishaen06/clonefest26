import React, { useEffect, useState } from 'react';
import { X } from 'lucide-react';

interface PanicOverlayProps {
  active: boolean;
  onDismiss: () => void;
}

export const PanicOverlay: React.FC<PanicOverlayProps> = ({ active, onDismiss }) => {
  const [decoyCode] = useState(`// System Maintenance & Performance Diagnostics
function calculateSystemMetrics(nodes: any[]) {
  return nodes.map(node => ({
    id: node.id,
    latency: Math.floor(Math.random() * 45) + 5 + 'ms',
    status: 'OPTIMAL',
    loadFactor: 0.42
  }));
}
console.log('System diagnostics nominal.');`);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && active) {
        onDismiss();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [active, onDismiss]);

  if (!active) return null;

  return (
    <div className="fixed inset-0 z-50 bg-[#09090b] text-zinc-300 flex flex-col p-6 overflow-hidden">
      <div className="flex items-center justify-between border-b border-zinc-800 pb-4 mb-4">
        <div className="flex items-center space-x-3">
          <div className="w-3 h-3 rounded-full bg-emerald-500 animate-pulse"></div>
          <span className="font-mono text-sm font-semibold tracking-wide text-zinc-400">
            PANIC MASK ACTIVE (Decoy Mode)
          </span>
        </div>
        <button
          onClick={onDismiss}
          className="flex items-center space-x-2 px-3 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-xs font-mono text-zinc-300 transition"
        >
          <X className="w-4 h-4" />
          <span>Exit Mask (Esc)</span>
        </button>
      </div>

      <div className="flex-1 flex flex-col items-center justify-center max-w-4xl mx-auto w-full">
        <div className="w-full bg-zinc-900 border border-zinc-800 rounded-xl p-5 shadow-2xl font-mono text-sm">
          <div className="flex items-center justify-between text-zinc-500 text-xs mb-3 border-b border-zinc-800 pb-2">
            <span>diagnostics.ts - Public Demo File</span>
            <span className="text-emerald-400">STATUS: NOMINAL</span>
          </div>
          <pre className="text-zinc-300 overflow-x-auto whitespace-pre-wrap">{decoyCode}</pre>
        </div>

        <p className="mt-4 text-xs font-mono text-zinc-500 text-center">
          Shoulder-surfing shield active. Your real confidential secret is hidden in memory.
          Press <kbd className="px-1.5 py-0.5 bg-zinc-800 rounded border border-zinc-700 text-zinc-300">Esc</kbd> or click Exit Mask to return.
        </p>
      </div>
    </div>
  );
};
