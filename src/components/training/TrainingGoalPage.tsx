import React, { useMemo } from 'react';

import { DonutChart } from '@/components/ui/DonutChart';
import { computeTrainingGoalProgress } from '@/game/training/trainingGoalProgress';
import type {
  TrainingGoalSet,
  TrainingRow,
  TrainingScoreSummary,
} from '@/game/training/trainingTypes';
import { cn } from '@/utils/cn';

interface TrainingGoalPageProps {
  readonly goalSet: TrainingGoalSet;
  readonly summaryByTrainingId: ReadonlyMap<string, TrainingScoreSummary>;
  readonly trainingById: ReadonlyMap<string, TrainingRow>;
  readonly isEnglish: boolean;
  readonly onBack: () => void;
  readonly onOpenGoals: () => void;
  readonly onSelectTraining: (trainingId: string, practiceMode: boolean) => void;
  readonly onOpenRecords: (trainingId: string) => void;
  readonly onLocked: () => void;
  readonly isTrainingLocked: (trainingId: string) => boolean;
}

export const TrainingGoalPage: React.FC<TrainingGoalPageProps> = ({
  goalSet,
  summaryByTrainingId,
  trainingById,
  isEnglish,
  onBack,
  onOpenGoals,
  onSelectTraining,
  onOpenRecords,
  onLocked,
  isTrainingLocked,
}) => {
  const progress = useMemo(
    () => computeTrainingGoalProgress(goalSet, summaryByTrainingId),
    [goalSet, summaryByTrainingId],
  );

  return (
    <div className="mx-auto max-w-3xl px-4 py-6">
      <button type="button" className="mb-4 text-sm text-indigo-300 underline" onClick={onBack}>
        {isEnglish ? 'Back' : '戻る'}
      </button>

      <div className="mb-6 flex items-center gap-4">
        <DonutChart percent={progress.percent} size={96} label={`${progress.percent}%`} />
        <div>
          <p className="text-xs uppercase tracking-wider text-indigo-300">
            {isEnglish ? 'Current Goal' : '現在の目標'}
          </p>
          <h1 className="mt-1 text-2xl font-bold text-white">
            {isEnglish ? goalSet.titleEn : goalSet.titleJa}
          </h1>
          <p className="mt-2 text-sm text-slate-300">
            {progress.cleared}/{progress.total}
          </p>
        </div>
      </div>

      {(isEnglish ? goalSet.descriptionEn : goalSet.descriptionJa) && (
        <section className="mb-6 rounded-xl border border-slate-700 bg-slate-900/70 p-4">
          <p className="text-sm leading-relaxed text-slate-300">
            {isEnglish ? goalSet.descriptionEn : goalSet.descriptionJa}
          </p>
        </section>
      )}

      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-lg font-semibold text-white">
          {isEnglish ? 'Goal Trainings' : '目標トレーニング'}
        </h2>
        <button type="button" className="text-sm text-indigo-300 underline" onClick={onOpenGoals}>
          {isEnglish ? 'All goals' : '目標一覧へ'}
        </button>
      </div>

      <ul className="space-y-2">
        {progress.items.map((item) => {
          const training = trainingById.get(item.trainingId);
          if (!training) return null;
          const locked = isTrainingLocked(training.id);
          return (
            <li
              key={item.trainingId}
              className={cn(
                'rounded-xl border p-4 transition-colors',
                item.cleared
                  ? 'border-emerald-500/40 bg-emerald-950/30'
                  : 'border-slate-700 bg-slate-900/80',
              )}
            >
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="font-medium text-white">
                    {isEnglish ? training.titleEn : training.titleJa}
                  </p>
                  <p className="mt-1 text-xs text-slate-400">
                    {item.bestRank != null
                      ? `${isEnglish ? 'Best' : '最高'} ${item.bestScore ?? 0} / ${item.bestRank}`
                      : isEnglish ? 'No record yet' : '未プレイ'}
                    {' · '}
                    {isEnglish ? 'Target' : '目標'}
                    {' '}
                    {item.targetRank}
                    {item.cleared ? (isEnglish ? ' · Cleared' : ' · クリア') : ''}
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    className="rounded-lg bg-slate-700 px-3 py-2 text-sm text-white hover:bg-slate-600"
                    onClick={() => (locked ? onLocked() : onSelectTraining(training.id, true))}
                  >
                    {isEnglish ? 'Practice' : '練習'}
                  </button>
                  <button
                    type="button"
                    className="rounded-lg bg-indigo-600 px-3 py-2 text-sm font-semibold text-white hover:bg-indigo-500"
                    onClick={() => (locked ? onLocked() : onSelectTraining(training.id, false))}
                  >
                    {isEnglish ? 'Production' : '本番'}
                  </button>
                  <button
                    type="button"
                    className="rounded-lg border border-slate-600 px-3 py-2 text-sm text-slate-200 hover:bg-slate-800"
                    onClick={() => onOpenRecords(training.id)}
                  >
                    {isEnglish ? 'Records' : '記録'}
                  </button>
                </div>
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
};
