import React, { useEffect, useRef, useState } from 'react';
import { useGameStore } from '@/stores/gameStore';
import { DEFAULT_DRUM_PADS } from '@/types';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

/**
 * ドラムパッドコンポーネント
 */
const DrumPads: React.FC = () => {
  const { handleRhythmInput, settings } = useGameStore((state) => ({
    handleRhythmInput: state.handleRhythmInput,
    settings: state.rhythmState.settings,
  }));

  const [activePads, setActivePads] = useState<Set<number>>(new Set());
  const padRefs = useRef<(HTMLDivElement | null)[]>([]);

  // キーボード入力処理
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const pad = DEFAULT_DRUM_PADS.find((p) => p.key === e.key.toUpperCase());
      if (pad && !e.repeat) {
        handlePadTrigger(pad.index, 100); // デフォルトベロシティ
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      const pad = DEFAULT_DRUM_PADS.find((p) => p.key === e.key.toUpperCase());
      if (pad) {
        setActivePads((prev) => {
          const newSet = new Set(prev);
          newSet.delete(pad.index);
          return newSet;
        });
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, []);

  const handlePadTrigger = (padIndex: number, velocity: number = 100) => {
    // ビジュアルフィードバック
    setActivePads((prev) => new Set([...prev, padIndex]));
    setTimeout(() => {
      setActivePads((prev) => {
        const newSet = new Set(prev);
        newSet.delete(padIndex);
        return newSet;
      });
    }, 100);

    // 振動フィードバック（モバイル）
    if ('vibrate' in navigator) {
      navigator.vibrate(10);
    }

    // ストアへの入力通知
    handleRhythmInput(padIndex, velocity);
  };

  const handlePadClick = (padIndex: number) => {
    handlePadTrigger(padIndex, 100);
  };

  const handlePadTouch = (padIndex: number, e: React.TouchEvent) => {
    e.preventDefault();
    handlePadTrigger(padIndex, 100);
  };

  // レイアウト計算
  const getPadLayout = () => {
    if (settings.padLayout === 'square') {
      return 'grid grid-cols-2 gap-4 max-w-md mx-auto';
    }
    return 'flex justify-center gap-4';
  };

  return (
    <div className="drum-pads-container p-4 bg-gradient-to-t from-black/80 to-transparent">
      <div className={getPadLayout()}>
        {DEFAULT_DRUM_PADS.map((pad, index) => (
          <motion.div
            key={pad.index}
            ref={(el) => (padRefs.current[index] = el)}
            className={cn(
              'drum-pad relative select-none cursor-pointer',
              'w-24 h-24 rounded-lg',
              'flex flex-col items-center justify-center',
              'transition-all duration-75',
              'border-2 border-gray-700',
              'backdrop-blur-sm',
              activePads.has(pad.index) && 'scale-95'
            )}
            style={{
              backgroundColor: activePads.has(pad.index)
                ? pad.color
                : `${pad.color}20`,
              borderColor: activePads.has(pad.index)
                ? pad.color
                : 'rgba(156, 163, 175, 0.5)',
              boxShadow: activePads.has(pad.index)
                ? `0 0 20px ${pad.color}80`
                : 'none',
            }}
            onMouseDown={() => handlePadClick(pad.index)}
            onTouchStart={(e) => handlePadTouch(pad.index, e)}
            whileTap={{ scale: 0.95 }}
          >
            {/* パッドラベル */}
            <span
              className={cn(
                'text-lg font-bold mb-1',
                activePads.has(pad.index) ? 'text-white' : 'text-gray-300'
              )}
            >
              {pad.label}
            </span>
            
            {/* キー表示 */}
            <span
              className={cn(
                'text-sm font-mono px-2 py-1 rounded',
                'bg-black/30',
                activePads.has(pad.index) ? 'text-white' : 'text-gray-400'
              )}
            >
              {pad.key}
            </span>

            {/* ヒットエフェクト */}
            {activePads.has(pad.index) && settings.enableEffects && (
              <motion.div
                className="absolute inset-0 rounded-lg"
                style={{ backgroundColor: pad.color }}
                initial={{ opacity: 0.6, scale: 1 }}
                animate={{ opacity: 0, scale: 1.2 }}
                transition={{ duration: 0.3 }}
              />
            )}
          </motion.div>
        ))}
      </div>

      {/* パッド説明（初回のみ表示） */}
      <div className="mt-4 text-center text-xs text-gray-500">
        キーボードの D, F, J, K またはパッドをタップして演奏
      </div>
    </div>
  );
};

export default DrumPads;