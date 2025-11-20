import React from 'react';
import { useGameSelector } from '@/stores/helpers';
import { cn } from '@/utils/cn';

interface ScoreOverlayProps {
  className?: string;
}

export const ScoreOverlay: React.FC<ScoreOverlayProps> = ({ className }) => {
  const { mode, score } = useGameSelector((state) => ({
    mode: state.mode,
    score: state.score
  }));

  if (mode !== 'performance') {
    return null;
  }

  return (
    <div
      className={cn(
        'pointer-events-none text-lg font-bold bg-black bg-opacity-70 px-3 py-2 rounded-lg flex items-center gap-3',
        className
      )}
    >
      <span className="text-green-400">✓ {score.goodCount}</span>
      <span className="text-gray-500">|</span>
      <span className="text-red-400">× {score.missCount}</span>
    </div>
  );
};

export default ScoreOverlay;
