import React, { useMemo } from 'react';

import { computeTrainingGoalProgress } from '@/game/training/trainingGoalProgress';
import type { TrainingGoalSet, TrainingScoreSummary } from '@/game/training/trainingTypes';
import { cn } from '@/utils/cn';

interface TrainingGoalListPageProps {
  readonly goalSets: readonly TrainingGoalSet[];
  readonly activeGoalSetId: string | null;
  readonly summaryByTrainingId: ReadonlyMap<string, TrainingScoreSummary>;
  readonly isEnglish: boolean;
  readonly onBack: () => void;
  readonly onSelectGoal: (goalSetId: string) => void;
}

export const TrainingGoalListPage: React.FC<TrainingGoalListPageProps> = ({
  goalSets,
  activeGoalSetId,
  summaryByTrainingId,
  isEnglish,
  onBack,
  onSelectGoal,
}) => {
  const sortedSets = useMemo(() => {
    const activeId = activeGoalSetId ?? goalSets[0]?.id ?? null;
    const active = activeId ? goalSets.find((set) => set.id === activeId) : null;
    const others = goalSets.filter((set) => set.id !== activeId);
    return active ? [active, ...others] : goalSets;
  }, [goalSets, activeGoalSetId]);

  return (
    <div className="mx-auto max-w-3xl px-4 py-6">
      <button type="button" className="mb-4 text-sm text-indigo-300 underline" onClick={onBack}>
        {isEnglish ? 'Back' : '戻る'}
      </button>

      <h1 className="mb-6 text-2xl font-bold text-white">
        {isEnglish ? 'Training Goals' : '目標一覧'}
      </h1>

      <ul className="space-y-3">
        {sortedSets.map((goalSet, index) => {
          const progress = computeTrainingGoalProgress(goalSet, summaryByTrainingId);
          const isActive = index === 0;
          return (
            <li
              key={goalSet.id}
              className={cn(
                'rounded-xl border p-4',
                isActive ? 'border-indigo-500/50 bg-indigo-950/30' : 'border-slate-700 bg-slate-900/80',
              )}
            >
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  {isActive && (
                    <p className="mb-1 text-xs font-medium uppercase tracking-wider text-indigo-300">
                      {isEnglish ? 'Current Goal' : '現在の目標'}
                    </p>
                  )}
                  <p className="font-semibold text-white">
                    {isEnglish ? goalSet.titleEn : goalSet.titleJa}
                  </p>
                  <p className="mt-1 text-sm text-slate-400">{progress.percent}%</p>
                </div>
                {!isActive && (
                  <button
                    type="button"
                    className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-500"
                    onClick={() => onSelectGoal(goalSet.id)}
                  >
                    {isEnglish ? 'Switch' : '切り替える'}
                  </button>
                )}
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
};
