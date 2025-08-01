/**
 * ファンタジーリズムゲージ
 * リズムモードのタイミング表示UI
 */

import React, { useEffect, useMemo, useState } from 'react';
import { cn } from '@/utils/cn';
import { useTimeStore } from '@/stores/timeStore';
import { RhythmChordSchedule } from './FantasyRhythmEngine';

interface FantasyRhythmGaugeProps {
  schedule: RhythmChordSchedule[];
  currentTime: number;
  position: 'A' | 'B' | 'C' | 'D' | 'E' | 'F' | 'G' | 'H';
  chordId: string;
}

export const FantasyRhythmGauge: React.FC<FantasyRhythmGaugeProps> = ({
  schedule,
  currentTime,
  position,
  chordId
}) => {
  const [gaugeProgress, setGaugeProgress] = useState(0);
  const [isNearTiming, setIsNearTiming] = useState(false);
  const { startAt, readyDuration } = useTimeStore();

  // 現在のスケジュール項目を見つける
  const currentScheduleItem = useMemo(() => {
    // 現在時刻から最も近い未来のスケジュール項目を探す
    const futureItems = schedule
      .filter(item => 
        item.position === position && 
        item.targetTime > currentTime - 200 // 判定ウィンドウ分前まで
      )
      .sort((a, b) => a.targetTime - b.targetTime);
    
    return futureItems[0];
  }, [schedule, position, currentTime]);

  // ゲージの進行を計算
  useEffect(() => {
    if (!currentScheduleItem || !startAt) {
      setGaugeProgress(0);
      setIsNearTiming(false);
      return;
    }

    const updateGauge = () => {
      const now = performance.now() - startAt - readyDuration;
      const timeUntilTarget = currentScheduleItem.targetTime - now;
      
      // 1秒前から0%、ターゲットタイムで80%になるように計算
      const progress = Math.max(0, Math.min(100, (1000 - timeUntilTarget) / 1000 * 80));
      setGaugeProgress(progress);
      
      // タイミング判定ウィンドウ内かチェック（前後200ms）
      setIsNearTiming(Math.abs(timeUntilTarget) <= 200);
    };

    const interval = setInterval(updateGauge, 16); // 60fps
    updateGauge(); // 初回実行

    return () => clearInterval(interval);
  }, [currentScheduleItem, startAt, readyDuration]);

  // スケジュールがない場合は非表示
  if (!currentScheduleItem) {
    return null;
  }

  return (
    <div className="absolute inset-0">
      {/* 80%地点の判定マーカー */}
      <div 
        className={cn(
          "absolute left-[80%] top-0 bottom-0 w-1 z-20 transition-all",
          isNearTiming ? "bg-yellow-300 animate-pulse shadow-lg shadow-yellow-300/50" : "bg-yellow-400"
        )}
        style={{
          boxShadow: isNearTiming ? '0 0 8px rgba(252, 211, 77, 0.8)' : undefined
        }}
      >
        {/* マーカー上下の装飾 */}
        <div className="absolute -top-1 left-1/2 transform -translate-x-1/2 w-2 h-2 bg-yellow-400 rounded-full" />
        <div className="absolute -bottom-1 left-1/2 transform -translate-x-1/2 w-2 h-2 bg-yellow-400 rounded-full" />
      </div>
      
      {/* 進行ゲージ */}
      <div className="relative h-full">
        <div 
          className={cn(
            "h-full transition-all duration-100 relative overflow-hidden",
            isNearTiming ? "bg-gradient-to-r from-green-400 to-green-500" : 
            gaugeProgress >= 70 ? "bg-gradient-to-r from-blue-400 to-cyan-400" : 
            "bg-gradient-to-r from-purple-400 to-blue-400"
          )}
          style={{ width: `${gaugeProgress}%` }}
        >
          {/* ゲージの先端にグロー効果 */}
          <div className="absolute right-0 top-0 bottom-0 w-2 bg-gradient-to-r from-transparent to-white/30" />
        </div>
      </div>
      
      {/* タイミングウィンドウの可視化（デバッグ用、必要なら表示） */}
      {isNearTiming && (
        <div className="absolute left-[76%] right-[16%] top-0 bottom-0 bg-green-400/20 z-10" />
      )}
    </div>
  );
};