import React, { useMemo } from 'react';
import { cn } from '@/lib/utils';
import { resolveBalloonRushStatusOverlayTopStyle } from '@/utils/balloonRushSurvivalBridge';

export interface BalloonRushStatusOverlayProps {
  readonly remainingSeconds: number;
  readonly remainingCount: number;
  readonly isEnglishCopy: boolean;
  readonly staffBandHeightPx: number;
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
  staffBandHeightPx,
}) => {
  const timeLow = remainingSeconds < 30;
  const countDone = remainingCount <= 0;
  const topStyle = useMemo(
    () => resolveBalloonRushStatusOverlayTopStyle(staffBandHeightPx),
    [staffBandHeightPx],
  );

  return (
    <div
      className="absolute left-0 right-0 z-[6] flex justify-center pointer-events-none px-3"
      style={topStyle}
      aria-live="polite"
      aria-label={
        isEnglishCopy
          ? `Time ${formatRemainingTime(remainingSeconds)}, ${formatBalloonRushRemainingCountLabel(remainingCount, true)}`
          : `残り時間 ${formatRemainingTime(remainingSeconds)}、${formatBalloonRushRemainingCountLabel(remainingCount, false)}`
      }
    >
      <div className="flex flex-row items-baseline justify-center gap-3 md:gap-4">
        <span
          className={cn(
            'font-sans text-2xl md:text-3xl font-bold tabular-nums leading-none',
            timeLow ? 'text-red-400' : 'text-yellow-300',
          )}
        >
          {formatRemainingTime(remainingSeconds)}
        </span>
        <span
          className={cn(
            'font-sans text-lg md:text-xl font-bold tabular-nums leading-none',
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
