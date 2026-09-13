import React from 'react';
import { useNavigate } from 'react-router-dom';
import { FaMusic, FaShieldAlt } from 'react-icons/fa';
import type { PlayMapTier } from '@/platform/supabasePlayMap';
import { cn } from '@/utils/cn';

export type PlayMapMode = 'code_run' | 'defense';

const TIER_TABS: readonly PlayMapTier[] = ['basic', 'advanced'];

interface TierProgress {
  cleared: number;
  total: number;
}

interface PlayMapHeaderProps {
  mode: PlayMapMode;
  tier: PlayMapTier;
  onTierChange: (tier: PlayMapTier) => void;
  tierProgress: Record<PlayMapTier, TierProgress>;
  isEnglishCopy: boolean;
}

const PlayMapHeader: React.FC<PlayMapHeaderProps> = ({
  mode,
  tier,
  onTierChange,
  tierProgress,
  isEnglishCopy,
}) => {
  const navigate = useNavigate();

  return (
    <div className="pointer-events-none absolute inset-x-0 top-0 z-50 px-3 pt-3 md:px-4">
      <div
        className={cn(
          'pointer-events-auto mx-auto flex w-full max-w-3xl flex-col gap-2 rounded-2xl border px-3 py-2 shadow-lg backdrop-blur-md md:flex-row md:items-center md:justify-between md:gap-3 md:px-4 md:py-2.5',
          mode === 'code_run'
            ? 'border-amber-500/25 bg-black/55'
            : 'border-emerald-500/25 bg-black/55',
        )}
      >
        <div className="flex gap-1 rounded-full border border-white/10 bg-black/40 p-1">
          <button
            type="button"
            className={cn(
              'flex flex-1 items-center justify-center gap-1.5 rounded-full px-3 py-2 text-xs font-bold transition-colors md:flex-none md:px-4 md:text-sm',
              mode === 'code_run'
                ? 'bg-amber-400 text-slate-950'
                : 'text-amber-100/85 hover:bg-white/10',
            )}
            onClick={() => navigate('/main/play/code-run')}
          >
            <FaMusic aria-hidden className="shrink-0" />
            {isEnglishCopy ? 'Code Run' : 'コードラン'}
          </button>
          <button
            type="button"
            className={cn(
              'flex flex-1 items-center justify-center gap-1.5 rounded-full px-3 py-2 text-xs font-bold transition-colors md:flex-none md:px-4 md:text-sm',
              mode === 'defense'
                ? 'bg-emerald-400 text-slate-950'
                : 'text-emerald-100/85 hover:bg-white/10',
            )}
            onClick={() => navigate('/main/play/phrase-defense')}
          >
            <FaShieldAlt aria-hidden className="shrink-0" />
            {isEnglishCopy ? 'Phrase Defense' : 'フレーズディフェンス'}
          </button>
        </div>

        <div className="flex gap-1 rounded-full border border-white/10 bg-black/40 p-1">
          {TIER_TABS.map((tab) => {
            const progress = tierProgress[tab];
            const progressLabel = `${progress.cleared}/${progress.total}`;
            return (
              <button
                key={tab}
                type="button"
                className={cn(
                  'flex flex-1 items-center justify-center gap-2 rounded-full px-3 py-2 text-xs font-bold transition-colors md:flex-none md:px-4 md:text-sm',
                  tier === tab
                    ? 'bg-white text-slate-900'
                    : 'text-white/80 hover:bg-white/10',
                )}
                onClick={() => onTierChange(tab)}
              >
                <span>{tab === 'basic' ? 'Basic' : 'Advanced'}</span>
                <span className={cn(
                  'rounded-full px-1.5 py-0.5 text-[10px] font-semibold',
                  tier === tab ? 'bg-slate-900/10 text-slate-700' : 'bg-white/10 text-white/70',
                )}
                >
                  {progressLabel}
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default PlayMapHeader;
