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
      return;
    }

    const updateGauge = () => {
      const now = performance.now() - startAt - readyDuration;
      const timeUntilTarget = currentScheduleItem.targetTime - now;
      
      // 出題タイミング（targetTime）から1秒前を0%、targetTimeで80%になるように計算
      // timeUntilTargetが1000ms以上の場合は0%
      // timeUntilTargetが0msの場合は80%
      // その間は線形補間
      let progress = 0;
      if (timeUntilTarget <= 1000) {
        // 1秒前から出題タイミングまでの間
        progress = ((1000 - timeUntilTarget) / 1000) * 80;
        progress = Math.max(0, Math.min(80, progress));
      }
      
      setGaugeProgress(progress);
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
      {/* 80%地点のマーカー */}
      <div className="absolute left-[80%] top-0 bottom-0 w-0.5 bg-yellow-400 z-10" />
      
      {/* 進行ゲージ */}
      <div 
        className={cn(
          "h-full transition-all duration-100",
          gaugeProgress >= 70 && gaugeProgress <= 90 ? "bg-green-400" : "bg-blue-400"
        )}
        style={{ width: `${gaugeProgress}%` }}
      />
    </div>
  );
};