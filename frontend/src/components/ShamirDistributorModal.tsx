import React, { useState } from 'react';
import { X, Users, Copy, Check, Key, Download } from 'lucide-react';
import { copySecureToClipboard } from '../utils/clipboard';

interface ShamirDistributorModalProps {
  shares: string[];
  threshold: number;
  totalShares: number;
  isOpen: boolean;
  onClose: () => void;
}

export const ShamirDistributorModal: React.FC<ShamirDistributorModalProps> = ({
  shares,
  threshold,
  totalShares,
  isOpen,
  onClose,
}) => {
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
  const [copiedAll, setCopiedAll] = useState(false);

  if (!isOpen) return null;

  const handleCopySingle = async (share: string, index: number) => {
    await copySecureToClipboard(share);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  const handleCopyAll = async () => {
    const text = shares
      .map((s, idx) => `Trustee #${idx + 1} Share:\n${s}\n`)
      .join('\n');
    await copySecureToClipboard(text);
    setCopiedAll(true);
    setTimeout(() => setCopiedAll(false), 2000);
  };

  const handleDownload = () => {
    const text = `========================================================\n` +
      `JIGSAW SHAMIR'S SECRET SHARING KEYS (${threshold}-of-${totalShares} Quorum)\n` +
      `========================================================\n\n` +
      `Requirement: Any ${threshold} out of these ${totalShares} shares are required to reconstruct the decryption key.\n\n` +
      shares
        .map((s, idx) => `[Trustee #${idx + 1} Share]\n${s}\n`)
        .join('\n') +
      `\nGenerated securely via WebCrypto client-side.\n`;

    const blob = new Blob([text], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.download = `jigsaw-shamir-${threshold}-of-${totalShares}-shares.txt`;
    link.href = url;
    link.click();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fadeIn">
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl max-w-xl w-full p-6 shadow-2xl relative flex flex-col max-h-[85vh]">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-zinc-400 hover:text-zinc-200 p-1.5 rounded-lg hover:bg-zinc-800 transition"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center space-x-2.5 text-purple-400 mb-2 font-mono text-sm font-semibold">
          <Users className="w-5 h-5" />
          <span>Multi-Party Key Distribution ({threshold}-of-{totalShares} Quorum)</span>
        </div>

        <p className="text-xs text-zinc-400 mb-4">
          The decryption key has been split into <strong className="text-white">{totalShares} unique shares</strong>.
          Any <strong className="text-purple-400">{threshold} trustees</strong> must combine their shares to unlock the secret.
        </p>

        <div className="flex-1 overflow-y-auto space-y-3 pr-1 mb-4">
          {shares.map((share, idx) => (
            <div
              key={idx}
              className="p-3 bg-zinc-950/80 border border-zinc-800 rounded-xl flex flex-col space-y-1.5 font-mono text-xs"
            >
              <div className="flex items-center justify-between text-zinc-400">
                <span className="flex items-center space-x-1.5 font-semibold text-purple-300">
                  <Key className="w-3.5 h-3.5" />
                  <span>Trustee #{idx + 1} Share</span>
                </span>
                <button
                  onClick={() => handleCopySingle(share, idx)}
                  className="flex items-center space-x-1 px-2.5 py-1 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 rounded text-[11px] transition"
                >
                  {copiedIndex === idx ? (
                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                  ) : (
                    <Copy className="w-3.5 h-3.5" />
                  )}
                  <span>{copiedIndex === idx ? 'Copied' : 'Copy Share'}</span>
                </button>
              </div>
              <div className="p-2 bg-zinc-900 rounded border border-zinc-800 text-zinc-300 break-all select-all text-[11px]">
                {share}
              </div>
            </div>
          ))}
        </div>

        <div className="flex items-center space-x-3 pt-2 border-t border-zinc-800">
          <button
            onClick={handleCopyAll}
            className="flex-1 flex items-center justify-center space-x-2 px-4 py-2.5 bg-purple-600 hover:bg-purple-500 text-white rounded-xl text-xs font-mono font-medium transition"
          >
            {copiedAll ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
            <span>{copiedAll ? 'Copied All Shares' : 'Copy All Shares to Clipboard'}</span>
          </button>
          <button
            onClick={handleDownload}
            className="flex items-center space-x-1.5 px-4 py-2.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 rounded-xl text-xs font-mono transition"
            title="Download text backup"
          >
            <Download className="w-4 h-4" />
            <span>Download</span>
          </button>
        </div>
      </div>
    </div>
  );
};
