import React, { useState, useEffect } from 'react';
import { Flame, Clock } from 'lucide-react';

interface CountdownTimerProps {
  initialSeconds: number;
  onExpire: () => void;
}

export const CountdownTimer: React.FC<CountdownTimerProps> = ({
  initialSeconds,
  onExpire,
}) => {
  const [timeLeft, setTimeLeft] = useState(initialSeconds);

  useEffect(() => {
    if (timeLeft <= 0) {
      onExpire();
      return;
    }

    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          onExpire();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [timeLeft, onExpire]);

  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;
  const formattedTime = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
  const percentage = (timeLeft / initialSeconds) * 100;
  const isUrgent = timeLeft <= 15;

  return (
    <div
      className={`flex items-center space-x-3 px-4 py-2.5 rounded-xl border transition-all duration-300 font-mono text-xs ${
        isUrgent
          ? 'bg-red-950/40 border-red-500/50 text-red-300 animate-pulse'
          : 'bg-amber-950/30 border-amber-500/40 text-amber-300'
      }`}
    >
      <div className="flex items-center space-x-2">
        {isUrgent ? (
          <Flame className="w-4 h-4 text-red-400 animate-bounce" />
        ) : (
          <Clock className="w-4 h-4 text-amber-400" />
        )}
        <span className="font-semibold">
          {isUrgent ? 'CRITICAL EPHEMERAL WIPEOUT:' : 'Post-Open Vanishing Timer:'}
        </span>
      </div>

      <div className="flex items-center space-x-2">
        <span className="font-bold text-sm bg-zinc-900/80 px-2 py-0.5 rounded border border-zinc-700">
          {formattedTime}
        </span>
        <span className="text-[11px] text-zinc-400">remaining before memory purge</span>
      </div>

      {/* Mini Progress Bar */}
      <div className="w-16 h-1.5 bg-zinc-800 rounded-full overflow-hidden hidden sm:block">
        <div
          className={`h-full transition-all duration-1000 rounded-full ${
            isUrgent ? 'bg-red-500' : 'bg-amber-500'
          }`}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
};
