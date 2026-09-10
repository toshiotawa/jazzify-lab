import React from 'react';

import type { TrainingCategoryWithTrainings, TrainingScoreSummary } from '@/game/training/trainingTypes';
import { cn } from '@/utils/cn';

interface TrainingListProps {
  readonly categories: readonly TrainingCategoryWithTrainings[];
  readonly summaryByTrainingId: ReadonlyMap<string, TrainingScoreSummary>;
  readonly isPremium: boolean;
  readonly isEnglish: boolean;
  readonly onSelectTraining: (trainingId: string, practiceMode: boolean) => void;
  readonly onOpenRanking: () => void;
  readonly onLocked: () => void;
}

export const TrainingList: React.FC<TrainingListProps> = ({
  categories,
  summaryByTrainingId,
  isPremium,
  isEnglish,
  onSelectTraining,
  onOpenRanking,
  onLocked,
}) => (
  <div className="mx-auto max-w-3xl px-4 py-6">
    <div className="mb-6 flex items-center justify-between gap-3">
      <div>
        <h1 className="text-2xl font-bold text-white">{isEnglish ? 'Training' : 'トレーニング'}</h1>
        <p className="mt-1 text-sm text-slate-400">
          {isEnglish ? '1-minute drills. Production mode records your score.' : '1分間ドリル。本番モードでスコア記録。'}
        </p>
      </div>
      <button
        type="button"
        className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-500"
        onClick={onOpenRanking}
      >
        {isEnglish ? 'Ranking' : 'ランキング'}
      </button>
    </div>

    {categories.map((category) => (
      <section key={category.id} className="mb-8">
        <h2 className="mb-3 text-lg font-semibold text-indigo-200">
          {isEnglish ? category.titleEn : category.titleJa}
          {!category.isFree && !isPremium && (
            <span className="ml-2 text-xs text-amber-300">Premium</span>
          )}
        </h2>
        <ul className="space-y-2">
          {category.trainings.map((training) => {
            const locked = !category.isFree && !isPremium;
            const summary = summaryByTrainingId.get(training.id);
            return (
              <li
                key={training.id}
                className={cn(
                  'rounded-xl border border-slate-700 bg-slate-900/80 p-4',
                  locked && 'opacity-70',
                )}
              >
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="font-medium text-white">{isEnglish ? training.titleEn : training.titleJa}</p>
                    <p className="mt-1 text-xs text-slate-400">
                      {summary
                        ? `${isEnglish ? 'Best' : '最高'} ${summary.bestScore} / ${summary.bestRank}${summary.rankPosition != null ? ` / ${summary.rankPosition}${isEnglish ? 'th' : '位'}` : ''}`
                        : isEnglish ? 'No record yet' : '未プレイ'}
                    </p>
                  </div>
                  <div className="flex gap-2">
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
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      </section>
    ))}
  </div>
);
