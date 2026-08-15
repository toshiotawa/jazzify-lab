import React from 'react';
import { cn } from '@/utils/cn';
import { clampLoadProgress } from '@/utils/clampLoadProgress';

export interface LoadProgressBarProps {
  /** 0–1。未指定のときは不定バー（CSS アニメーション）。 */
  value?: number;
  showPercent?: boolean;
  className?: string;
  trackClassName?: string;
}

const LoadProgressBar: React.FC<LoadProgressBarProps> = ({
  value,
  showPercent = false,
  className,
  trackClassName,
}) => {
  const isDeterminate = value !== undefined;
  const clamped = isDeterminate ? clampLoadProgress(value) : 0;

  return (
    <div className={cn('w-full', className)}>
      <div
        className={cn(
          'relative h-2 overflow-hidden rounded-full bg-game-accent',
          trackClassName,
        )}
        role="progressbar"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={isDeterminate ? Math.round(clamped * 100) : undefined}
        aria-busy={!isDeterminate || clamped < 1}
      >
        {isDeterminate ? (
          <div
            className="h-full rounded-full bg-gradient-to-r from-primary-600 to-jazz-500 transition-all duration-300 ease-out"
            style={{ width: `${clamped * 100}%` }}
          />
        ) : (
          <div className="absolute inset-y-0 w-2/5 rounded-full bg-gradient-to-r from-primary-600 to-jazz-500 animate-load-progress-indeterminate" />
        )}
      </div>
      {showPercent && isDeterminate ? (
        <p className="mt-2 text-center text-xs text-gray-400">
          {Math.round(clamped * 100)}%
        </p>
      ) : null}
    </div>
  );
};

export default LoadProgressBar;
