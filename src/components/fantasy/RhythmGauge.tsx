/**
 * RhythmGauge
 * リズムモード用のゲージコンポーネント
 * - 小節内の進行を表示
 * - 80%位置に判定マーカー
 * - 判定タイミングでエフェクト
 */

import React, { useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface RhythmGaugeProps {
  progress: number;          // 0-1の進行率
  isJudgmentTiming: boolean; // 判定タイミングかどうか
  monsterPosition?: 'A' | 'B' | 'C' | 'D' | 'E' | 'F' | 'G' | 'H';
  className?: string;
}

const JUDGMENT_RATIO = 0.8; // 80%位置

export const RhythmGauge: React.FC<RhythmGaugeProps> = ({
  progress,
  isJudgmentTiming,
  monsterPosition,
  className = ''
}) => {
  const markerRef = useRef<HTMLDivElement>(null);
  const lastJudgmentRef = useRef(false);

  // 判定タイミングになった瞬間にエフェクト
  useEffect(() => {
    if (isJudgmentTiming && !lastJudgmentRef.current) {
      // 判定開始時のエフェクト
      if (markerRef.current) {
        markerRef.current.classList.add('pulse-effect');
        setTimeout(() => {
          if (markerRef.current) {
            markerRef.current.classList.remove('pulse-effect');
          }
        }, 300);
      }
    }
    lastJudgmentRef.current = isJudgmentTiming;
  }, [isJudgmentTiming]);

  return (
    <div className={`relative w-full h-8 ${className}`}>
      {/* ゲージ背景 */}
      <div className="absolute inset-0 bg-gray-800 rounded-lg overflow-hidden border-2 border-gray-700">
        {/* 進行バー */}
        <motion.div
          className="absolute left-0 top-0 h-full bg-gradient-to-r from-purple-600 to-purple-400"
          style={{ width: `${progress * 100}%` }}
          transition={{ type: 'tween', ease: 'linear', duration: 0.05 }}
        />

        {/* 80%マーカー（常時表示） */}
        <div
          ref={markerRef}
          className="absolute top-0 h-full w-1 bg-yellow-400 shadow-glow"
          style={{ left: `${JUDGMENT_RATIO * 100}%`, transform: 'translateX(-50%)' }}
        >
          {/* マーカーの装飾 */}
          <div className="absolute -top-1 left-1/2 transform -translate-x-1/2 w-3 h-3 bg-yellow-400 rounded-full" />
          <div className="absolute -bottom-1 left-1/2 transform -translate-x-1/2 w-3 h-3 bg-yellow-400 rounded-full" />
        </div>

        {/* 判定タイミングのグロー効果 */}
        <AnimatePresence>
          {isJudgmentTiming && (
            <motion.div
              className="absolute top-0 h-full w-8 bg-yellow-300 opacity-30"
              style={{ left: `${JUDGMENT_RATIO * 100}%`, transform: 'translateX(-50%)' }}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 0.3, scale: 1 }}
              exit={{ opacity: 0, scale: 1.2 }}
              transition={{ duration: 0.2 }}
            />
          )}
        </AnimatePresence>
      </div>

      {/* 位置ラベル（オプション） */}
      {monsterPosition && (
        <div className="absolute -top-6 left-0 text-xs text-gray-400">
          列 {monsterPosition}
        </div>
      )}

      {/* スタイル定義 */}
      <style jsx>{`
        .shadow-glow {
          box-shadow: 0 0 8px rgba(250, 204, 21, 0.8);
        }

        .pulse-effect {
          animation: pulse 0.3s ease-out;
        }

        @keyframes pulse {
          0% {
            transform: translateX(-50%) scale(1);
            box-shadow: 0 0 8px rgba(250, 204, 21, 0.8);
          }
          50% {
            transform: translateX(-50%) scale(1.5);
            box-shadow: 0 0 20px rgba(250, 204, 21, 1);
          }
          100% {
            transform: translateX(-50%) scale(1);
            box-shadow: 0 0 8px rgba(250, 204, 21, 0.8);
          }
        }
      `}</style>
    </div>
  );
};

export { RhythmGauge };
export default RhythmGauge;