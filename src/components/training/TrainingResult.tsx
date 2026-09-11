import React, { useCallback, useEffect, useState } from 'react';

import { downloadTrainingResultImage } from '@/components/training/trainingResultImage';
import { scoreToTrainingRank } from '@/game/training/trainingRank';
import type { TrainingLetterRank } from '@/game/training/trainingRank';
import { upsertTrainingScore } from '@/platform/supabaseTraining';
import { useAuthStore } from '@/stores/authStore';
import { cn } from '@/utils/cn';

interface TrainingResultProps {
  readonly trainingTitle: string;
  readonly trainingId: string;
  readonly score: number;
  readonly practiceMode: boolean;
  readonly onRetry: () => void;
  readonly onRanking: () => void;
  readonly onExit: () => void;
}

export const TrainingResult: React.FC<TrainingResultProps> = ({
  trainingTitle,
  trainingId,
  score,
  practiceMode,
  onRetry,
  onRanking,
  onExit,
}) => {
  const profile = useAuthStore((state) => state.profile);
  const userName = profile?.nickname ?? 'Player';
  const rank = scoreToTrainingRank(score);
  const [savedRank, setSavedRank] = useState<TrainingLetterRank>(rank);
  const [rankPosition, setRankPosition] = useState<number | null>(null);
  const [saved, setSaved] = useState(practiceMode);

  useEffect(() => {
    if (practiceMode) return undefined;
    let cancelled = false;
    void upsertTrainingScore(trainingId, score)
      .then(async () => {
        if (cancelled) return;
        setSavedRank(rank);
        setSaved(true);
        const { fetchMyTrainingSummary } = await import('@/platform/supabaseTraining');
        const summary = await fetchMyTrainingSummary();
        const mine = summary.find((row) => row.trainingId === trainingId);
        setRankPosition(mine?.rankPosition ?? null);
      })
      .catch(() => {
        if (!cancelled) setSaved(false);
      });
    return () => {
      cancelled = true;
    };
  }, [practiceMode, trainingId, score, rank]);

  const handleSaveImage = useCallback(() => {
    downloadTrainingResultImage({
      trainingTitle,
      userName,
      rank: savedRank,
      score,
      rankPosition: practiceMode ? null : rankPosition,
    });
  }, [trainingTitle, userName, savedRank, score, practiceMode, rankPosition]);

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/75 p-4 sm:items-center">
      <div className="my-4 w-full max-h-[90dvh] max-w-md overflow-y-auto rounded-2xl bg-gradient-to-b from-indigo-950 to-slate-900 p-8 text-center shadow-2xl sm:my-0">
        <p className="text-sm uppercase tracking-widest text-indigo-300">Training Result</p>
        <h2 className="mt-2 break-words px-1 text-xl font-bold leading-tight text-white sm:text-2xl">{trainingTitle}</h2>
        <p className="mt-1 text-slate-300">{userName}</p>
        <p className="mt-6 text-7xl font-black text-amber-300">{savedRank}</p>
        <p className="mt-2 text-5xl font-bold text-white">{score}</p>
        {!practiceMode && rankPosition != null && (
          <p className="mt-4 text-sm text-indigo-200">あなたの順位 … {rankPosition}位</p>
        )}
        {!practiceMode && (
          <p className="mt-2 text-xs text-slate-500">{saved ? 'スコアを保存しました' : '保存中…'}</p>
        )}
        <div className="mt-8 grid grid-cols-2 gap-3">
          <button type="button" className={actionBtn} onClick={onRetry}>再挑戦</button>
          <button type="button" className={actionBtn} onClick={onRanking}>ランキングを見る</button>
          <button type="button" className={cn(actionBtn, 'col-span-2 bg-emerald-700 hover:bg-emerald-600')} onClick={handleSaveImage}>
            画像保存
          </button>
          <button type="button" className={cn(actionBtn, 'col-span-2 bg-slate-700 hover:bg-slate-600')} onClick={onExit}>
            終了
          </button>
        </div>
      </div>
    </div>
  );
};

const actionBtn = 'rounded-xl bg-indigo-600 px-4 py-3 text-sm font-semibold text-white hover:bg-indigo-500';
