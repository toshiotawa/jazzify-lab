import React, { useCallback, useEffect, useState } from 'react';
import { fetchPlayerLevelState, type PlayerLevelUiState } from '@/platform/supabasePlayerXp';
import { useGeoStore } from '@/stores/geoStore';
import { shouldUseEnglishCopy } from '@/utils/globalAudience';
import type { Profile } from '@/types';

type PlayerLevelProfileInput = {
  id?: string;
  rank?: Profile['rank'];
  preferred_locale?: Profile['preferred_locale'] | null;
} | null | undefined;

interface PlayerLevelSectionProps {
  profile: PlayerLevelProfileInput;
}

const PlayerLevelSection: React.FC<PlayerLevelSectionProps> = ({ profile }) => {
  const geoCountry = useGeoStore(state => state.country);
  const isEnglishCopy = shouldUseEnglishCopy({
    rank: profile?.rank,
    country: geoCountry,
    preferredLocale: profile?.preferred_locale ?? null,
  });

  const [state, setState] = useState<PlayerLevelUiState | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const load = useCallback(async () => {
    if (!profile?.id) {
      setState(null);
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(false);
    try {
      const ui = await fetchPlayerLevelState();
      setState(ui);
    } catch {
      setError(true);
      setState(null);
    } finally {
      setLoading(false);
    }
  }, [profile?.id]);

  useEffect(() => {
    void load();
  }, [load]);

  if (!profile?.id) return null;

  const title = isEnglishCopy ? 'Level' : 'レベル';
  const xpLabel =
    loading && state == null ? (isEnglishCopy ? 'Loading…' : '読み込み中…')
    : error ? (isEnglishCopy ? 'Could not load' : '読み込みできませんでした')
    : '';

  const level = state?.level ?? null;
  const nextNeed = state && state.nextLevelXp > 0 ? state.nextLevelXp : 1;
  const progressRatio = level != null ? Math.min(1, Math.max(0, state!.inLevelXp / nextNeed)) : 0;
  const remainder = Math.max(0, nextNeed - (state?.inLevelXp ?? 0));
  const subline =
    level != null && state && !loading && !error
      ? (
          isEnglishCopy
            ? `Next level: ${remainder} EXP to go (${state.inLevelXp}/${nextNeed})`
            : `次のレベルまで あと ${remainder} EXP（${state.inLevelXp}/${nextNeed}）`
        )
      : '';

  return (
    <div className="mt-4 pt-4 border-t border-slate-700">
      <div className="flex items-center justify-between gap-2 mb-2">
        <span className="text-sm font-semibold text-gray-300">{title}</span>
        {level != null && !loading && !error && (
          <span className="text-sm font-bold text-cyan-400 tabular-nums">
            Lv.{level}
          </span>
        )}
      </div>
      {(loading && state == null) || error ? (
        <p className="text-xs text-gray-500">{xpLabel}</p>
      ) : level != null && state ? (
        <>
          <div className="h-2.5 rounded-full bg-slate-700 overflow-hidden border border-slate-600">
            <div
              className="h-full rounded-full bg-gradient-to-r from-cyan-600 to-violet-500 transition-all duration-500"
              style={{ width: `${Math.round(progressRatio * 100)}%` }}
              role="progressbar"
              aria-valuenow={state.inLevelXp}
              aria-valuemin={0}
              aria-valuemax={nextNeed}
            />
          </div>
          <p className="text-xs text-gray-400 mt-1.5 tabular-nums">{subline}</p>
          <button
            type="button"
            className="text-xs text-blue-400 hover:text-blue-300 mt-1 underline"
            onClick={() => void load()}
          >
            {isEnglishCopy ? 'Refresh' : '更新'}
          </button>
        </>
      ) : null}
    </div>
  );
};

export default PlayerLevelSection;
