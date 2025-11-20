import React from 'react';
import { useGameSelector } from '@/stores/helpers';

const ScoreOverlay: React.FC = () => {
  const { mode, goodCount, missCount } = useGameSelector((state) => ({
    mode: state.mode,
    goodCount: state.score.goodCount,
    missCount: state.score.missCount
  }));

  if (mode !== 'performance') {
    return null;
  }

  return (
    <div className="absolute top-3 left-3 z-20 text-lg font-bold bg-black bg-opacity-70 px-3 py-2 rounded-lg pointer-events-none">
      <span className="text-green-400">✓ {goodCount}</span>
      <span className="mx-3 text-gray-500">|</span>
      <span className="text-red-400">× {missCount}</span>
    </div>
  );
};

export default ScoreOverlay;
