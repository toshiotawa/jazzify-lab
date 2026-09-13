import React from 'react';
import { useNavigate } from 'react-router-dom';
import type { PlayMapMode, PlayMapTier } from '@/platform/supabasePlayMap';
import { cn } from '@/utils/cn';

const TIER_TABS: readonly PlayMapTier[] = ['basic', 'advanced'];

interface TierProgress {
  cleared: number;
  total: number;
}

interface PlayMapTierBarProps {
  mode: PlayMapMode;
  tier: PlayMapTier;
  onTierChange: (tier: PlayMapTier) => void;
  tierProgress: Record<PlayMapTier, TierProgress>;
  isEnglishCopy: boolean;
}

const PlayMapTierBar: React.FC<PlayMapTierBarProps> = ({
  mode,
  tier,
  onTierChange,
  tierProgress,
  isEnglishCopy,
}) => {
  const navigate = useNavigate();
  const isCodeRun = mode === 'code_run';

  return (
    <div className="flex shrink-0 items-center justify-between gap-2 px-3 py-2 md:px-4">
      <button
        type="button"
        className={cn(
          'shrink-0 text-xs font-semibold transition-colors md:text-sm',
          isCodeRun
            ? 'text-amber-200/90 hover:text-amber-100'
            : 'text-emerald-200/90 hover:text-emerald-100',
        )}
        onClick={() => navigate('/main/play')}
      >
        {isEnglishCopy ? '← Play' : '← プレイ'}
      </button>

      <div
        className={cn(
          'flex flex-1 gap-1 rounded-full border bg-black/55 p-1 md:flex-none',
          isCodeRun ? 'border-amber-500/25' : 'border-emerald-500/25',
        )}
      >
        {TIER_TABS.map((tab) => {
          const progress = tierProgress[tab];
          const progressLabel = `${progress.cleared}/${progress.total}`;
          const selected = tier === tab;
          return (
            <button
              key={tab}
              type="button"
              className={cn(
                'flex flex-1 items-center justify-center gap-2 rounded-full px-3 py-1.5 text-xs font-bold transition-colors md:flex-none md:px-4 md:py-2 md:text-sm',
                selected
                  ? isCodeRun
                    ? 'bg-amber-400 text-slate-950'
                    : 'bg-emerald-400 text-slate-950'
                  : isCodeRun
                    ? 'text-amber-100/85 hover:bg-white/10'
                    : 'text-emerald-100/85 hover:bg-white/10',
              )}
              onClick={() => onTierChange(tab)}
            >
              <span>{tab === 'basic' ? 'Basic' : 'Advanced'}</span>
              <span
                className={cn(
                  'rounded-full px-1.5 py-0.5 text-[10px] font-semibold',
                  selected
                    ? 'bg-slate-900/10 text-slate-700'
                    : 'bg-white/10 text-white/70',
                )}
              >
                {progressLabel}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default PlayMapTierBar;
