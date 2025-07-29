/**
 * RhythmReady
 * リズムモードのReadyフェーズ表示コンポーネント
 * - カウントダウン表示
 * - スタートボタン（オプション）
 */

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface RhythmReadyProps {
  isReady: boolean;
  countdown: number;
  onStart?: () => void;
  showStartButton?: boolean;
}

export const RhythmReady: React.FC<RhythmReadyProps> = ({
  isReady,
  countdown,
  onStart,
  showStartButton = false
}) => {
  return (
    <AnimatePresence>
      {isReady && (
        <motion.div
          className="absolute inset-0 z-50 flex items-center justify-center bg-black bg-opacity-75"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
        >
          <div className="text-center">
            {/* カウントダウン表示 */}
            {countdown > 0 && (
              <motion.div
                key={countdown}
                className="text-8xl font-bold mb-8"
                initial={{ scale: 0.5, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 1.5, opacity: 0 }}
                transition={{ duration: 0.5 }}
              >
                {countdown === 3 && (
                  <span className="text-red-500">3</span>
                )}
                {countdown === 2 && (
                  <span className="text-yellow-500">2</span>
                )}
                {countdown === 1 && (
                  <span className="text-green-500">1</span>
                )}
              </motion.div>
            )}

            {/* START表示 */}
            {countdown === 0 && (
              <motion.div
                className="text-6xl font-bold text-white"
                initial={{ scale: 0.5, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 2, opacity: 0 }}
                transition={{ duration: 0.5 }}
              >
                START!
              </motion.div>
            )}

            {/* スタートボタン（オプション） */}
            {showStartButton && countdown > 0 && (
              <motion.button
                className="mt-8 px-8 py-4 bg-purple-600 text-white rounded-lg text-xl font-semibold hover:bg-purple-700 transition-colors"
                onClick={onStart}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                すぐに始める
              </motion.button>
            )}

            {/* 準備中メッセージ */}
            <motion.div
              className="mt-4 text-gray-300 text-lg"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5 }}
            >
              リズムに合わせてコードを入力しよう！
            </motion.div>
          </div>

          {/* 背景アニメーション */}
          <div className="absolute inset-0 pointer-events-none">
            <motion.div
              className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2"
              initial={{ scale: 0, opacity: 0.5 }}
              animate={{ 
                scale: [1, 1.5, 1],
                opacity: [0.5, 0.2, 0.5]
              }}
              transition={{ 
                duration: 2,
                repeat: Infinity,
                ease: "easeInOut"
              }}
            >
              <div className="w-96 h-96 rounded-full bg-purple-500 blur-3xl" />
            </motion.div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default RhythmReady;