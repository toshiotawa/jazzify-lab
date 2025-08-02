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
      
      // 1秒前から0%、ターゲットタイムで80%になるように計算
      // timeUntilTarget が 1000ms の時: progress = 0%
      // timeUntilTarget が 0ms の時: progress = 80%
      if (timeUntilTarget > 1000) {
        setGaugeProgress(0); // 1秒以上前は0%
      } else if (timeUntilTarget < 0) {
        setGaugeProgress(0); // ターゲット時刻を過ぎたら0%にリセット
      } else {
        const progress = (1000 - timeUntilTarget) / 1000 * 80;
        setGaugeProgress(progress);
      }
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
      {/* 80%地点のマーカー（黄色で強調） */}
      <div className="absolute left-[80%] top-0 bottom-0 w-1 bg-yellow-400 z-10 shadow-lg" />
      
      {/* 進行ゲージ */}
      <div 
        className={cn(
          "h-full transition-none", // アニメーションは削除（60fpsで更新するため）
          gaugeProgress >= 70 && gaugeProgress <= 80 ? "bg-green-400" : "bg-blue-400"
        )}
        style={{ width: `${gaugeProgress}%` }}
      />
      
      {/* 80%地点のテキストマーカー（オプション） */}
      <div className="absolute left-[80%] top-1/2 -translate-y-1/2 -translate-x-1/2 text-xs font-bold text-yellow-400 z-20">
        ▼
      </div>
    </div>
  );
};