import React, { useState } from 'react';
import { Users, CheckCircle2, Lock, Unlock, RefreshCw } from 'lucide-react';
import { splitSecret, combineShares } from '../utils/shamir';
import { generateRandomKeyHex } from '../utils/crypto';

export const ShamirHeroSimulator: React.FC = () => {
  const threshold = 3;
  const total = 5;

  const createInitialState = () => {
    const secret = generateRandomKeyHex().slice(0, 16);
    const shares = splitSecret(secret, total, threshold);
    return { secret, shares };
  };

  const [simData, setSimData] = useState(createInitialState);
  const [activeShares, setActiveShares] = useState<number[]>([0, 1]); // initial 2 shares (below threshold)
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [reconstructedText, setReconstructedText] = useState('');

  const resetSimulator = () => {
    const nextData = createInitialState();
    setSimData(nextData);
    setActiveShares([0, 1]);
    setIsUnlocked(false);
    setReconstructedText('');
  };

  const toggleShare = (index: number) => {
    let next: number[];
    if (activeShares.includes(index)) {
      next = activeShares.filter((i) => i !== index);
    } else {
      next = [...activeShares, index];
    }
    setActiveShares(next);

    // If quorum threshold met (at least 3 shares)
    if (next.length >= threshold) {
      try {
        const selectedShareStrings = next.map((i) => simData.shares[i]);
        const recovered = combineShares(selectedShareStrings);
        if (recovered.toLowerCase() === simData.secret.toLowerCase()) {
          setIsUnlocked(true);
          setReconstructedText(`0x${recovered.toUpperCase()}`);
        } else {
          setIsUnlocked(false);
          setReconstructedText('');
        }
      } catch (err) {
        console.error('Reconstruction error:', err);
        setIsUnlocked(false);
        setReconstructedText('');
      }
    } else {
      setIsUnlocked(false);
      setReconstructedText('');
    }
  };

  const progressPct = Math.min(100, Math.round((activeShares.length / threshold) * 100));

  return (
    <div className="vault-card p-6 sm:p-8 bg-zinc-950/80 border border-purple-500/30 shadow-2xl relative overflow-hidden font-mono">
      <div className="flex items-center justify-between flex-wrap gap-2 mb-4">
        <div className="flex items-center space-x-2">
          <div className="w-8 h-8 rounded-lg bg-purple-500/20 text-purple-400 flex items-center justify-center border border-purple-500/30">
            <Users className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-white flex items-center space-x-1.5">
              <span>Shamir's Multi-Party Quorum Simulator</span>
              <span className="px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-300 text-[10px] border border-purple-500/30 font-bold">
                Flagship Core
              </span>
            </h3>
            <p className="text-[11px] text-zinc-400">
              Interactive demonstration: Combine any <strong className="text-purple-300">{threshold}</strong> out of <strong className="text-purple-300">{total}</strong> trustee puzzle pieces to reconstruct the master key.
            </p>
          </div>
        </div>

        <button
          onClick={resetSimulator}
          className="flex items-center space-x-1 px-2.5 py-1 rounded-lg bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-300 text-[11px] transition"
          title="Generate new random key"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>New Keys</span>
        </button>
      </div>

      {/* Progress Bar */}
      <div className="mb-6 space-y-1.5">
        <div className="flex justify-between text-[11px] text-zinc-400">
          <span>Quorum Assembly Progress:</span>
          <span className="font-bold text-purple-300">
            {activeShares.length} of {threshold} Required ({progressPct}%)
          </span>
        </div>
        <div className="w-full bg-zinc-900 h-2.5 rounded-full overflow-hidden border border-zinc-800">
          <div
            className={`h-full transition-all duration-300 ${
              isUnlocked ? 'bg-emerald-500 shadow-lg shadow-emerald-500/50' : 'bg-purple-600'
            }`}
            style={{ width: `${progressPct}%` }}
          />
        </div>
      </div>

      {/* Trustee Puzzle Pieces Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-5 gap-3 mb-6">
        {simData.shares.map((share, idx) => {
          const isSelected = activeShares.includes(idx);
          return (
            <button
              key={idx}
              onClick={() => toggleShare(idx)}
              className={`p-3 rounded-xl border text-left transition-all duration-200 flex flex-col justify-between space-y-2 active:scale-95 ${
                isSelected
                  ? 'bg-purple-600/20 border-purple-500 shadow-md shadow-purple-500/25 text-purple-200'
                  : 'bg-zinc-900/80 border-zinc-800 text-zinc-400 hover:border-zinc-700'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-zinc-950 border border-zinc-800 text-zinc-300">
                  Trustee #{idx + 1}
                </span>
                {isSelected ? (
                  <CheckCircle2 className="w-3.5 h-3.5 text-purple-400 flex-shrink-0" />
                ) : (
                  <div className="w-3.5 h-3.5 rounded-full border border-zinc-700" />
                )}
              </div>
              <p className="text-[9px] font-mono truncate text-zinc-500">
                {share.slice(0, 14)}...
              </p>
              <span className="text-[9px] font-semibold block text-center py-0.5 rounded bg-zinc-950/60">
                {isSelected ? 'Piece Active' : '+ Click to Add'}
              </span>
            </button>
          );
        })}
      </div>

      {/* Vault Status Box */}
      <div
        className={`p-4 rounded-xl border transition-all duration-300 flex items-center space-x-3 ${
          isUnlocked
            ? 'bg-emerald-950/40 border-emerald-500/50 shadow-lg shadow-emerald-500/20'
            : 'bg-zinc-900/60 border-zinc-800'
        }`}
      >
        <div
          className={`w-10 h-10 rounded-xl flex items-center justify-center border flex-shrink-0 ${
            isUnlocked
              ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40'
              : 'bg-zinc-800 text-zinc-500 border-zinc-700'
          }`}
        >
          {isUnlocked ? <Unlock className="w-5 h-5 text-emerald-400" /> : <Lock className="w-5 h-5 text-zinc-400" />}
        </div>
        <div>
          <span className="text-xs font-bold block text-white">
            {isUnlocked ? 'Quorum Reached — Vault Key Recovered' : 'Locked — Awaiting Quorum Threshold'}
          </span>
          <span className="text-[11px] text-zinc-400">
            {isUnlocked
              ? `Reconstructed master key: ${reconstructedText}`
              : `Need ${Math.max(0, threshold - activeShares.length)} more trustee piece(s) to unlock.`}
          </span>
        </div>
      </div>
    </div>
  );
};
export default ShamirHeroSimulator;
