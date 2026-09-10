import React, { useEffect, useMemo, useState } from 'react';

import type { TrainingCategoryWithTrainings, TrainingRankingEntry } from '@/game/training/trainingTypes';
import { fetchMyTrainingSummary, fetchTrainingRanking } from '@/platform/supabaseTraining';
import { useAuthStore } from '@/stores/authStore';
import { cn } from '@/utils/cn';

interface TrainingRankingProps {
  readonly categories: readonly TrainingCategoryWithTrainings[];
  readonly isEnglish: boolean;
  readonly onBack: () => void;
}

export const TrainingRanking: React.FC<TrainingRankingProps> = ({
  categories,
  isEnglish,
  onBack,
}) => {
  const userId = useAuthStore((state) => state.user?.id ?? null);
  const allTrainings = useMemo(
    () => categories.flatMap((category) => category.trainings),
    [categories],
  );
  const [selectedId, setSelectedId] = useState(allTrainings[0]?.id ?? '');
  const [rows, setRows] = useState<readonly TrainingRankingEntry[]>([]);
  const [myRank, setMyRank] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!selectedId) return undefined;
    let cancelled = false;
    setLoading(true);
    void Promise.all([
      fetchTrainingRanking(selectedId, 100),
      userId ? fetchMyTrainingSummary() : Promise.resolve([]),
    ])
      .then(([ranking, summary]) => {
        if (cancelled) return;
        setRows(ranking);
        const mine = summary.find((row) => row.trainingId === selectedId);
        setMyRank(mine?.rankPosition ?? null);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [selectedId, userId]);

  const selectedTraining = allTrainings.find((t) => t.id === selectedId);

  return (
    <div className="mx-auto max-w-3xl px-4 py-6">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-white">{isEnglish ? 'Training Ranking' : 'トレーニングランキング'}</h1>
        <button type="button" className="rounded-lg bg-slate-700 px-3 py-2 text-sm text-white" onClick={onBack}>
          {isEnglish ? 'Back' : '戻る'}
        </button>
      </div>

      <label className="mb-4 block text-sm text-slate-300">
        {isEnglish ? 'Training' : 'トレーニング'}
        <select
          className="mt-1 w-full rounded-lg border border-slate-600 bg-slate-900 px-3 py-2 text-white"
          value={selectedId}
          onChange={(event) => setSelectedId(event.target.value)}
        >
          {allTrainings.map((training) => (
            <option key={training.id} value={training.id}>
              {isEnglish ? training.titleEn : training.titleJa}
            </option>
          ))}
        </select>
      </label>

      {myRank != null && (
        <div className="mb-4 rounded-xl border border-indigo-500/40 bg-indigo-950/50 px-4 py-3 text-indigo-100">
          {isEnglish ? 'Your rank …' : 'あなたの順位 …'}
          {' '}
          <span className="font-bold">{myRank}</span>
          {isEnglish ? '' : '位'}
          {selectedTraining && (
            <span className="ml-2 text-sm text-indigo-200/80">
              ({isEnglish ? selectedTraining.titleEn : selectedTraining.titleJa})
            </span>
          )}
        </div>
      )}

      {loading ? (
        <p className="text-slate-400">{isEnglish ? 'Loading…' : '読み込み中…'}</p>
      ) : (
        <div className="overflow-hidden rounded-xl border border-slate-700">
          <table className="min-w-full text-left text-sm">
            <thead className="bg-slate-800 text-slate-300">
              <tr>
                <th className="px-3 py-2">#</th>
                <th className="px-3 py-2">{isEnglish ? 'Name' : 'ユーザー'}</th>
                <th className="px-3 py-2">Lv</th>
                <th className="px-3 py-2">{isEnglish ? 'Score' : 'スコア'}</th>
                <th className="px-3 py-2">{isEnglish ? 'Rank' : 'ランク'}</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.userId} className={cn('border-t border-slate-800', row.userId === userId && 'bg-indigo-950/40')}>
                  <td className="px-3 py-2 text-slate-300">{row.rankPosition}</td>
                  <td className="px-3 py-2 text-white">{row.nickname}</td>
                  <td className="px-3 py-2 text-slate-300">{row.playerLevel}</td>
                  <td className="px-3 py-2 font-semibold text-amber-200">{row.bestScore}</td>
                  <td className="px-3 py-2 font-bold text-amber-300">{row.bestRank}</td>
                </tr>
              ))}
              {rows.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-3 py-6 text-center text-slate-500">
                    {isEnglish ? 'No scores yet.' : 'まだスコアがありません。'}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};
