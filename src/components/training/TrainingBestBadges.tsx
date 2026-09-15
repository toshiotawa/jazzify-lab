import React from 'react';

import type { TrainingLetterRank } from '@/game/training/trainingRank';
import { cn } from '@/utils/cn';

interface TrainingBestBadgesProps {
  readonly bestScore: number;
  readonly bestRank: TrainingLetterRank;
  readonly rankPosition?: number | null;
  readonly targetRank?: TrainingLetterRank;
  readonly cleared?: boolean;
  readonly isEnglish: boolean;
  readonly compact?: boolean;
}

const rankBadgeClassName = (rank: TrainingLetterRank): string => {
  switch (rank) {
    case 'S':
      return 'border-amber-400/50 bg-amber-500/20 text-amber-200';
    case 'A':
      return 'border-violet-400/50 bg-violet-500/20 text-violet-200';
    case 'B':
      return 'border-sky-400/50 bg-sky-500/20 text-sky-200';
    case 'C':
      return 'border-emerald-400/50 bg-emerald-500/20 text-emerald-200';
    default:
      return 'border-slate-500/50 bg-slate-700/40 text-slate-200';
  }
};

export const TrainingBestBadges: React.FC<TrainingBestBadgesProps> = ({
  bestScore,
  bestRank,
  rankPosition,
  targetRank,
  cleared,
  isEnglish,
  compact = false,
}) => (
  <div className={cn('flex flex-wrap items-center gap-2', compact ? 'text-xs' : 'text-sm')}>
    <div className="flex items-center gap-1.5">
      <span className="text-[10px] font-medium uppercase tracking-wide text-slate-400">
        {isEnglish ? 'High score' : 'ハイスコア'}
      </span>
      <span className={cn('font-bold tabular-nums text-white', compact ? 'text-sm' : 'text-base')}>
        {bestScore}
      </span>
    </div>
    <span className="text-slate-500">/</span>
    <div className="flex items-center gap-1.5">
      <span className="text-[10px] font-medium uppercase tracking-wide text-slate-400">
        {isEnglish ? 'Best rank' : '最高ランク'}
      </span>
      <span
        className={cn(
          'inline-flex min-w-[1.75rem] items-center justify-center rounded-md border px-2 py-0.5 font-bold',
          rankBadgeClassName(bestRank),
          compact ? 'text-sm' : 'text-base',
        )}
      >
        {bestRank}
      </span>
    </div>
    {rankPosition != null && (
      <>
        <span className="text-slate-500">/</span>
        <span className="font-semibold tabular-nums text-indigo-200">
          {rankPosition}
          {isEnglish ? 'th' : '位'}
        </span>
      </>
    )}
    {targetRank != null && (
      <span className="text-xs text-slate-400">
        {' · '}
        {isEnglish ? 'Target' : '目標'}
        {' '}
        <span className={cn('font-semibold', rankBadgeClassName(targetRank))}>
          {targetRank}
        </span>
        {cleared ? (isEnglish ? ' · Cleared' : ' · クリア') : ''}
      </span>
    )}
  </div>
);
