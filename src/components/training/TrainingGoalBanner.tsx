import React from 'react';

import { cn } from '@/utils/cn';

interface TrainingGoalBannerProps {
  readonly title: string;
  readonly cleared: number;
  readonly total: number;
  readonly isEnglish: boolean;
  readonly onClick: () => void;
}

export const TrainingGoalBanner: React.FC<TrainingGoalBannerProps> = ({
  title,
  cleared,
  total,
  isEnglish,
  onClick,
}) => (
  <button
    type="button"
    className={cn(
      'mb-6 w-full rounded-2xl border border-indigo-500/40 bg-gradient-to-r from-indigo-950/90 to-slate-900/90 p-4 text-left',
      'transition-colors hover:border-indigo-400/70 hover:from-indigo-900/90',
    )}
    onClick={onClick}
  >
    <p className="text-xs font-medium uppercase tracking-wider text-indigo-300">
      {isEnglish ? 'Current Goal' : '現在の目標'}
    </p>
    <div className="mt-2 flex items-center justify-between gap-3">
      <p className="text-lg font-bold text-white">{title}</p>
      <p className="shrink-0 text-sm font-semibold text-indigo-200">
        {cleared}/{total}
      </p>
    </div>
  </button>
);
