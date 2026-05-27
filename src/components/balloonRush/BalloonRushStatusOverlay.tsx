import React from 'react';
import { cn } from '@/lib/utils';

export interface BalloonRushStatusOverlayProps {
  readonly remainingSeconds: number;
  readonly remainingCount: number;
  readonly isEnglishCopy: boolean;
}

const formatRemainingTime = (seconds: number): string => {
  const totalSec = Math.max(0, Math.floor(seconds));
  const mins = Math.floor(totalSec / 60);
  const secs = totalSec % 60;
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
};

export const formatBalloonRushRemainingCountLabel = (
  remainingCount: number,
  isEnglishCopy: boolean,
): string => (
  isEnglishCopy
    ? `${Math.max(0, remainingCount)} left`
    : `残り${Math.max(0, remainingCount)}個`
);

const BalloonRushStatusOverlay: React.FC<BalloonRushStatusOverlayProps> = ({
  remainingSeconds,
  remainingCount,
  isEnglishCopy,
}) => {
  const timeLow = remainingSeconds < 30;
  const countDone = remainingCount <= 0;

  return (
    <div
      className="absolute left-0 right-0 z-[6] flex justify-center pointer-events-none px-3 pt-[calc(max(4px,env(safe-area-inset-top))+52px)]"
      aria-live="polite"
      aria-label={
        isEnglishCopy
          ? `Time ${formatRemainingTime(remainingSeconds)}, ${formatBalloonRushRemainingCountLabel(remainingCount, true)}`
          : `残り時間 ${formatRemainingTime(remainingSeconds)}、${formatBalloonRushRemainingCountLabel(remainingCount, false)}`
      }
    >
      <div className="flex flex-col items-center gap-0.5 rounded-2xl border border-white/25 bg-black/55 px-6 py-2.5 shadow-lg backdrop-blur-sm">
        <span
          className={cn(
            'font-sans text-3xl md:text-4xl font-bold tabular-nums leading-none',
            timeLow ? 'text-red-400' : 'text-yellow-300',
          )}
        >
          {formatRemainingTime(remainingSeconds)}
        </span>
        <span
          className={cn(
            'font-sans text-xl md:text-2xl font-bold tabular-nums leading-tight',
            countDone ? 'text-green-400' : 'text-cyan-300',
          )}
        >
          {formatBalloonRushRemainingCountLabel(remainingCount, isEnglishCopy)}
        </span>
      </div>
    </div>
  );
};

export default BalloonRushStatusOverlay;
