import React from 'react';
import { useGameStore } from '@/stores/gameStore';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';

/**
 * リズムスコア表示コンポーネント
 */
const RhythmScoreDisplay: React.FC = () => {
  const score = useGameStore((state) => state.rhythmState.score);
  const isPlaying = useGameStore((state) => state.isPlaying);

  const getAccuracyColor = (accuracy: number) => {
    if (accuracy >= 0.95) return 'text-green-400';
    if (accuracy >= 0.85) return 'text-yellow-400';
    if (accuracy >= 0.70) return 'text-orange-400';
    return 'text-red-400';
  };

  const getJudgmentColor = (judgment: string) => {
    switch (judgment) {
      case 'perfect':
        return 'text-purple-400';
      case 'good':
        return 'text-green-400';
      case 'ok':
        return 'text-yellow-400';
      case 'miss':
        return 'text-red-400';
      default:
        return 'text-gray-400';
    }
  };

  const accuracyPercentage = score.accuracy * 100;

  return (
    <div className="rhythm-score-display flex items-center gap-6 text-white">
      {/* スコア */}
      <div className="text-center">
        <div className="text-xs text-gray-400 uppercase">Score</div>
        <motion.div
          className="text-2xl font-bold tabular-nums"
          animate={{ scale: isPlaying ? [1, 1.05, 1] : 1 }}
          transition={{ duration: 0.3 }}
        >
          {score.score.toLocaleString()}
        </motion.div>
      </div>

      {/* コンボ */}
      <div className="text-center">
        <div className="text-xs text-gray-400 uppercase">Combo</div>
        <AnimatePresence mode="wait">
          <motion.div
            key={score.combo}
            className="text-2xl font-bold tabular-nums"
            initial={{ scale: 1.2, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.8, opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            {score.combo}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* 精度 */}
      <div className="text-center">
        <div className="text-xs text-gray-400 uppercase">Accuracy</div>
        <div className={cn('text-2xl font-bold tabular-nums', getAccuracyColor(score.accuracy))}>
          {accuracyPercentage.toFixed(1)}%
        </div>
      </div>

      {/* 判定内訳（コンパクト表示） */}
      <div className="flex gap-3 text-sm">
        <div className={cn('flex items-center gap-1', getJudgmentColor('perfect'))}>
          <span className="font-bold">P</span>
          <span className="tabular-nums">{score.perfect}</span>
        </div>
        <div className={cn('flex items-center gap-1', getJudgmentColor('good'))}>
          <span className="font-bold">G</span>
          <span className="tabular-nums">{score.good}</span>
        </div>
        <div className={cn('flex items-center gap-1', getJudgmentColor('ok'))}>
          <span className="font-bold">O</span>
          <span className="tabular-nums">{score.ok}</span>
        </div>
        <div className={cn('flex items-center gap-1', getJudgmentColor('miss'))}>
          <span className="font-bold">M</span>
          <span className="tabular-nums">{score.miss}</span>
        </div>
      </div>

      {/* 最大コンボ（非表示、ホバーで表示） */}
      {score.maxCombo > 0 && (
        <div className="text-xs text-gray-500 hidden lg:block">
          Max: {score.maxCombo}
        </div>
      )}
    </div>
  );
};

export default RhythmScoreDisplay;