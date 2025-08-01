/**
 * ファンタジーリズムゲージ
 * リズムモードのタイミング表示UI
 */

import React, { useEffect, useMemo, useState } from 'react';
import { cn } from '@/utils/cn';
import { useTimeStore } from '@/stores/timeStore';
import { RhythmChordSchedule } from './FantasyRhythmEngine';
import { devLog } from '@/utils/logger';

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
    
    devLog.debug('🎵 Rhythm gauge schedule check:', {
      position,
      currentTime,
      scheduleLength: schedule.length,
      futureItemsCount: futureItems.length,
      nextItem: futureItems[0]
    });
    
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
      const progress = Math.max(0, Math.min(80, (1000 - timeUntilTarget) / 1000 * 80));
      setGaugeProgress(progress);
      
      // デバッグログ（1秒に1回）
      if (Math.floor(now) % 1000 < 16) {
        devLog.debug('🎵 Gauge progress:', {
          position,
          progress,
          timeUntilTarget,
          targetTime: currentScheduleItem.targetTime,
          currentTime: now
        });
      }
    };

    const interval = setInterval(updateGauge, 16); // 60fps
    updateGauge(); // 初回実行

    return () => clearInterval(interval);
  }, [currentScheduleItem, startAt, readyDuration, position]);

  // リズムモードでは常にゲージを表示（マーカーを見せるため）
  return (
    <div className="absolute inset-0 relative">
      {/* 80%地点のマーカー（常に表示） */}
      <div className="absolute left-[80%] top-0 bottom-0 w-1 bg-yellow-400 z-20 animate-pulse" />
      
      {/* 進行ゲージ */}
      {currentScheduleItem && (
        <div 
          className={cn(
            "h-full transition-all duration-100 relative z-10",
            gaugeProgress >= 70 && gaugeProgress <= 90 ? "bg-green-400" : "bg-blue-400"
          )}
          style={{ width: `${gaugeProgress}%` }}
        />
      )}
      
      {/* ベースライン（ゲージがない時も薄く表示） */}
      {!currentScheduleItem && (
        <div className="h-full bg-gray-600 opacity-30" style={{ width: '100%' }} />
      )}
    </div>
  );
};