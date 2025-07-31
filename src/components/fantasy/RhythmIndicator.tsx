/**
 * リズムインジケーター
 * 現在の小節、拍、BPMなどのリズム情報を表示
 */

import React from 'react';
import { useRhythmStore } from '@/stores/rhythmStore';
import { cn } from '@/utils/cn';

interface RhythmIndicatorProps {
  className?: string;
}

const RhythmIndicator: React.FC<RhythmIndicatorProps> = ({ className }) => {
  const {
    bpm,
    timeSignature,
    currentMeasure,
    currentBeat,
    isPlaying,
    measureCount,
    currentTime
  } = useRhythmStore();

  // ビートインジケーター
  const renderBeatIndicators = () => {
    const indicators = [];
    for (let i = 1; i <= timeSignature; i++) {
      const isActive = i === currentBeat && isPlaying;
      indicators.push(
        <div
          key={i}
          className={cn(
            "w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-all duration-150",
            isActive 
              ? "bg-yellow-400 text-black scale-110 shadow-[0_0_12px_rgba(250,204,21,0.8)]" 
              : "bg-gray-700 text-gray-400"
          )}
        >
          {i}
        </div>
      );
    }
    return indicators;
  };

  // プログレスバー（小節内の進行度）
  const measureProgress = ((currentBeat - 1) / timeSignature) * 100;

  return (
    <div className={cn("bg-gray-900 p-4 rounded-lg", className)}>
      {/* BPMと拍子 */}
      <div className="flex justify-between items-center mb-3">
        <div className="text-sm">
          <span className="text-gray-400">BPM:</span>
          <span className="text-yellow-300 font-bold ml-1">{bpm}</span>
        </div>
        <div className="text-sm">
          <span className="text-gray-400">拍子:</span>
          <span className="text-yellow-300 font-bold ml-1">{timeSignature}/4</span>
        </div>
      </div>

      {/* 小節情報 */}
      <div className="mb-3">
        <div className="flex justify-between items-center mb-1">
          <span className="text-xs text-gray-400">小節</span>
          <span className="text-xs text-gray-400">
            {currentMeasure} / {measureCount}
          </span>
        </div>
        <div className="w-full h-2 bg-gray-700 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-blue-400 to-blue-600 transition-all duration-150"
            style={{ width: `${(currentMeasure / measureCount) * 100}%` }}
          />
        </div>
      </div>

      {/* ビートインジケーター */}
      <div className="flex justify-center space-x-2 mb-3">
        {renderBeatIndicators()}
      </div>

      {/* 小節内プログレス */}
      <div className="w-full h-1 bg-gray-700 rounded-full overflow-hidden">
        <div
          className="h-full bg-gradient-to-r from-green-400 to-green-600 transition-all duration-150"
          style={{ width: `${measureProgress}%` }}
        />
      </div>

      {/* 再生状態 */}
      <div className="mt-3 text-center">
        <span className={cn(
          "text-xs font-medium px-2 py-1 rounded",
          isPlaying 
            ? "bg-green-900 text-green-300" 
            : "bg-gray-800 text-gray-500"
        )}>
          {isPlaying ? '♪ 再生中' : '■ 停止中'}
        </span>
      </div>
    </div>
  );
};

export default RhythmIndicator;