/**
 * Defense mode result screen.
 */
import React, { useEffect, useState } from 'react';

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
  readonly starRank?: 1 | 2 | 3;
  readonly enteredEndless?: boolean;
  readonly improvedEndlessBest?: boolean;
  readonly skipStageClearPersist?: boolean;
  readonly isEnglishCopy: boolean;
  readonly onRetry: () => void;
  readonly onBack: () => void;
  readonly nextStepLabel?: string;
  readonly onNextStep?: () => void;
}

export const DefenseResult: React.FC<DefenseResultProps> = ({
  result,
  stageId,
  stageTitle,
  practiceMode,
  surviveSec,
  enemiesDefeated,
  starRank,
  enteredEndless,
  improvedEndlessBest,
  skipStageClearPersist = false,
  isEnglishCopy,
  onRetry,
  onBack,
  nextStepLabel,
  onNextStep,
}) => {
  const userId = useAuthStore((state) => state.user?.id ?? null);
  const [saved, setSaved] = useState(practiceMode || skipStageClearPersist);

  useEffect(() => {
    if (practiceMode || skipStageClearPersist || result !== 'clear' || !userId) {
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
  }, [practiceMode, skipStageClearPersist, result, userId, stageId, surviveSec, enemiesDefeated]);

  const isClear = result === 'clear';
  const isStageCleared = isClear || Boolean(enteredEndless);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
      <div className="w-full max-w-sm rounded-xl bg-slate-900 p-6 text-center shadow-xl">
        <h2
          className={cn(
            'text-2xl font-bold',
            enteredEndless ? 'text-amber-300' : (isClear ? 'text-emerald-400' : 'text-red-400'),
          )}
        >
          {enteredEndless
            ? (isEnglishCopy ? 'Endless Complete!' : 'エンドレス終了！')
            : isClear
              ? (isEnglishCopy ? 'Clear!' : 'クリア！')
              : (isEnglishCopy ? 'Game Over' : 'ゲームオーバー')}
        </h2>
        <p className="mt-2 text-slate-300">{stageTitle}</p>
        <p className="mt-4 text-sm text-slate-400">
          {isEnglishCopy
            ? `Survived ${Math.floor(surviveSec)}s / Defeated ${enemiesDefeated}`
            : `生存 ${Math.floor(surviveSec)}秒 / 撃破 ${enemiesDefeated}`}
        </p>
        {starRank != null && (
          <p className="mt-2 text-lg tracking-widest text-amber-200">
            {'★'.repeat(starRank)}
            {'☆'.repeat(3 - starRank)}
          </p>
        )}
        {enteredEndless && (
          <p className="mt-2 text-xs text-indigo-200">
            {isEnglishCopy ? `Endless total KO: ${enemiesDefeated}` : `エンドレス撃破数: ${enemiesDefeated}`}
            {improvedEndlessBest && (
              <>
                {' '}
                ·
                {isEnglishCopy ? ' New best!' : ' 自己ベスト更新！'}
              </>
            )}
          </p>
        )}
        {!practiceMode && isStageCleared && (
          <p className="mt-2 text-xs text-slate-500">
            {saved
              ? (isEnglishCopy ? 'Record saved' : '記録を保存しました')
              : (isEnglishCopy ? 'Saving record…' : '記録を保存中…')}
          </p>
        )}
        <div className="mt-6 flex flex-col gap-3">
          {isStageCleared && nextStepLabel && onNextStep ? (
            <button
              type="button"
              className="rounded-lg bg-green-600 px-4 py-2 text-sm font-semibold text-white hover:bg-green-500"
              onClick={onNextStep}
            >
              {nextStepLabel}
            </button>
          ) : null}
          {(!isClear || enteredEndless) ? (
            <button
              type="button"
              className="rounded-lg bg-slate-700 px-4 py-2 text-sm text-white hover:bg-slate-600"
              onClick={onRetry}
            >
              {isEnglishCopy ? 'Retry' : 'もう一度'}
            </button>
          ) : null}
          <button
            type="button"
            className="rounded-lg bg-indigo-600 px-4 py-2 text-sm text-white hover:bg-indigo-500"
            onClick={onBack}
          >
            {isEnglishCopy ? 'Back to map' : 'マップに戻る'}
          </button>
        </div>
      </div>
    </div>
  );
};
