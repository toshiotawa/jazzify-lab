/**
 * Defense mode result screen.
 */
import React, { useCallback, useEffect, useState } from 'react';

import type { DefenseGameResult } from '@/game/defense/defenseTypes';
import { upsertDefenseStageClear } from '@/platform/supabaseDefense';
import { useAuthStore } from '@/stores/authStore';
import { cn } from '@/utils/cn';

interface DefenseResultProps {
  readonly result: Exclude<DefenseGameResult, 'playing'>;
  readonly stageId: string;
  readonly stageTitle: string;
  readonly practiceMode: boolean;
  readonly surviveSec: number;
  readonly enemiesDefeated: number;
  readonly onRetry: () => void;
  readonly onBack: () => void;
}

export const DefenseResult: React.FC<DefenseResultProps> = ({
  result,
  stageId,
  stageTitle,
  practiceMode,
  surviveSec,
  enemiesDefeated,
  onRetry,
  onBack,
}) => {
  const userId = useAuthStore((state) => state.user?.id ?? null);
  const [saved, setSaved] = useState(practiceMode);

  useEffect(() => {
    if (practiceMode || result !== 'clear' || !userId) {
      return undefined;
    }
    let cancelled = false;
    void upsertDefenseStageClear(userId, stageId, surviveSec, enemiesDefeated)
      .then(() => {
        if (!cancelled) setSaved(true);
      })
      .catch(() => {
        if (!cancelled) setSaved(false);
      });
    return () => {
      cancelled = true;
    };
  }, [practiceMode, result, userId, stageId, surviveSec, enemiesDefeated]);

  const isClear = result === 'clear';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
      <div className="w-full max-w-sm rounded-xl bg-slate-900 p-6 text-center shadow-xl">
        <h2 className={cn('text-2xl font-bold', isClear ? 'text-emerald-400' : 'text-red-400')}>
          {isClear ? 'クリア！' : 'ゲームオーバー'}
        </h2>
        <p className="mt-2 text-slate-300">{stageTitle}</p>
        <p className="mt-4 text-sm text-slate-400">
          生存 {Math.floor(surviveSec)}秒 / 撃破 {enemiesDefeated}
        </p>
        {!practiceMode && isClear && (
          <p className="mt-2 text-xs text-slate-500">
            {saved ? '記録を保存しました' : '記録を保存中…'}
          </p>
        )}
        <div className="mt-6 flex gap-3 justify-center">
          <button
            type="button"
            className="rounded-lg bg-slate-700 px-4 py-2 text-sm text-white hover:bg-slate-600"
            onClick={onRetry}
          >
            もう一度
          </button>
          <button
            type="button"
            className="rounded-lg bg-indigo-600 px-4 py-2 text-sm text-white hover:bg-indigo-500"
            onClick={onBack}
          >
            戻る
          </button>
        </div>
      </div>
    </div>
  );
};
