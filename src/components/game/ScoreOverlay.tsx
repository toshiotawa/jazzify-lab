import React from 'react';
import { useGameSelector } from '@/stores/helpers';

/**
 * スコア表示オーバーレイ
 * GameEngine本体の再レンダリングを回避するため、独立したコンポーネントとして実装
 */
const ScoreOverlay: React.FC = () => {
  const { score, mode } = useGameSelector((state) => ({
    score: state.score,
    mode: state.mode
  }));

  if (mode !== 'performance') {
    return null;
  }

  return (
    <div className="absolute top-3 left-3 z-20 text-lg font-bold bg-black bg-opacity-70 px-3 py-2 rounded-lg pointer-events-none">
      <span className="text-green-400">✓ {score.goodCount}</span>
      <span className="mx-3 text-gray-500">|</span>
      <span className="text-red-400">× {score.missCount}</span>
    </div>
  );
};

export default ScoreOverlay;
