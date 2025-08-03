import React, { useState, useEffect } from 'react';
import { useTimeStore } from '@/stores/timeStore';
import { getCurrentBeatPosition } from '@/utils/progression-timing';
import type { FantasyStage } from './FantasyGameEngine';

interface ProgressionTimingIndicatorProps {
  stage: FantasyStage;
  isInNullPeriod: boolean;
}

export const ProgressionTimingIndicator: React.FC<ProgressionTimingIndicatorProps> = ({ 
  stage, 
  isInNullPeriod 
}) => {
  const timeStore = useTimeStore();
  const [currentBeatPos, setCurrentBeatPos] = useState(1.0);
  
  useEffect(() => {
    const interval = setInterval(() => {
      if (timeStore.startAt) {
        const beatPos = getCurrentBeatPosition(
          timeStore.startAt,
          stage.bpm,
          stage.timeSignature || 4,
          timeStore.readyDuration,
          stage.countInMeasures || 0
        );
        setCurrentBeatPos(beatPos);
      }
    }, 50);
    
    return () => clearInterval(interval);
  }, [stage, timeStore.startAt]);
  
  const timeSignature = stage.timeSignature || 4;
  const questionBeat = timeSignature + 0.5;
  const judgmentDeadline = timeSignature + 0.49;
  
  // ビート位置を正規化（1-timeSignature+1の範囲）
  const normalizedBeat = currentBeatPos <= timeSignature ? currentBeatPos : currentBeatPos - timeSignature;
  const progressPercent = ((normalizedBeat - 1) / timeSignature) * 100;
  
  return (
    <div className="w-full h-6 bg-gray-800 rounded-full overflow-hidden relative">
      {/* 現在のビート位置 */}
      <div 
        className="absolute top-0 h-full w-1 bg-yellow-400 z-20"
        style={{ left: `${progressPercent}%` }}
      />
      
      {/* 判定受付終了ライン */}
      <div 
        className="absolute top-0 h-full w-0.5 bg-red-500 z-10"
        style={{ left: `${((judgmentDeadline - 1) / timeSignature) * 100}%` }}
      />
      
      {/* 出題タイミングライン */}
      {currentBeatPos >= timeSignature && (
        <div 
          className="absolute top-0 h-full w-0.5 bg-green-500 z-10"
          style={{ left: `${((questionBeat - timeSignature - 1) / timeSignature) * 100}%` }}
        />
      )}
      
      {/* 状態表示 */}
      <div className="absolute inset-0 flex items-center justify-center text-xs font-bold">
        {isInNullPeriod ? (
          <span className="text-gray-400">NULL PERIOD</span>
        ) : currentBeatPos < judgmentDeadline ? (
          <span className="text-green-400">INPUT OK</span>
        ) : (
          <span className="text-red-400">WAIT</span>
        )}
      </div>
    </div>
  );
};