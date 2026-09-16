import React, { useMemo } from 'react';

import { TrainingBestBadges } from '@/components/training/TrainingBestBadges';
import { TrainingGoalArtCard } from '@/components/training/TrainingGoalArtCard';
import { TrainingGoalSetListCard } from '@/components/training/TrainingGoalSetListCard';
import { DonutChart } from '@/components/ui/DonutChart';
import { computeTrainingGoalProgress } from '@/game/training/trainingGoalProgress';
import {
  formatTrainingGoalInstrument,
  formatTrainingGoalLevel,
  formatTrainingGoalRank,
  resolveTrainingGoalRankInfo,
} from '@/game/training/trainingGoalLabels';
import type {
  TrainingGoalSet,
  TrainingRow,
  TrainingScoreSummary,
} from '@/game/training/trainingTypes';
import { cn } from '@/utils/cn';

interface TrainingGoalPageProps {
  readonly goalSet: TrainingGoalSet;
  readonly stageNumber: number;
  readonly summaryByTrainingId: ReadonlyMap<string, TrainingScoreSummary>;
  readonly trainingById: ReadonlyMap<string, TrainingRow>;
  readonly isEnglish: boolean;
  readonly onBack: () => void;
  readonly onOpenGoals?: () => void;
  readonly onSelectTraining: (trainingId: string, practiceMode: boolean) => void;
  readonly onOpenRecords: (trainingId: string) => void;
  readonly onLocked: () => void;
  readonly isTrainingLocked: (trainingId: string) => boolean;
}

export const TrainingGoalPage: React.FC<TrainingGoalPageProps> = ({
  goalSet,
  stageNumber,
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
  const goalRankInfo = useMemo(
    () => resolveTrainingGoalRankInfo(goalSet, trainingById),
    [goalSet, trainingById],
  );

  return (
    <div className="mx-auto max-w-3xl px-4 py-6">
      <button type="button" className="mb-4 text-sm text-indigo-300 underline" onClick={onBack}>
        {isEnglish ? 'Back' : '戻る'}
      </button>

      <TrainingGoalArtCard stageNumber={stageNumber} className="mb-6">
        <div className="flex items-center gap-4">
          <DonutChart percent={progress.percent} size={96} label={`${progress.percent}%`} />
          <div>
            <p className="text-xs uppercase tracking-wider text-indigo-200">
              {isEnglish ? 'Current Goal' : '現在の目標'}
            </p>
            <h1 className="mt-1 text-2xl font-bold text-white">
              {isEnglish ? goalSet.titleEn : goalSet.titleJa}
            </h1>
            <p className="mt-2 text-sm tabular-nums text-indigo-100">
              {progress.cleared}/{progress.total}
            </p>
          </div>
        </div>
      </TrainingGoalArtCard>

      <section className="mb-6 rounded-xl border border-slate-700 bg-slate-900/70 p-4">
        <dl className="space-y-2 text-sm text-slate-300">
          <div className="flex gap-2">
            <dt className="shrink-0 font-medium text-slate-400">
              {isEnglish ? 'Target instrument' : '対象楽器'}
              :
            </dt>
            <dd>{formatTrainingGoalInstrument(goalSet.targetInstrument, isEnglish)}</dd>
          </div>
          <div className="flex gap-2">
            <dt className="shrink-0 font-medium text-slate-400">
              {isEnglish ? 'Target level' : '対象レベル'}
              :
            </dt>
            <dd>{formatTrainingGoalLevel(goalSet.targetLevel, isEnglish)}</dd>
          </div>
          {goalRankInfo && (
            <div className="flex gap-2">
              <dt className="shrink-0 font-medium text-slate-400">
                {isEnglish ? 'Target rank' : '目標ランク'}
                :
              </dt>
              <dd>
                {formatTrainingGoalRank(goalRankInfo.rank, goalRankInfo.questionCount, isEnglish)}
              </dd>
            </div>
          )}
        </dl>
        {(isEnglish ? goalSet.descriptionEn : goalSet.descriptionJa) && (
          <p className="mt-4 border-t border-slate-700 pt-4 whitespace-pre-wrap text-sm leading-relaxed text-slate-300">
            {isEnglish ? goalSet.descriptionEn : goalSet.descriptionJa}
          </p>
        )}
      </section>

      {onOpenGoals && (
        <TrainingGoalSetListCard isEnglish={isEnglish} onClick={onOpenGoals} />
      )}

      <h2 className="mb-4 text-lg font-semibold text-white">
        {isEnglish ? 'Goal Trainings' : '目標トレーニング'}
      </h2>

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
                <div className="min-w-0 flex-1">
                  <p className="font-medium text-white">
                    {isEnglish ? training.titleEn : training.titleJa}
                  </p>
                  <div className="mt-1">
                    {item.bestRank != null ? (
                      <TrainingBestBadges
                        bestScore={item.bestScore ?? 0}
                        bestRank={item.bestRank}
                        targetRank={item.targetRank}
                        cleared={item.cleared}
                        isEnglish={isEnglish}
                        compact
                      />
                    ) : (
                      <p className="text-xs text-slate-400">
                        {isEnglish ? 'No record yet' : '未プレイ'}
                        {' · '}
                        {isEnglish ? 'Target' : '目標'}
                        {' '}
                        {item.targetRank}
                      </p>
                    )}
                  </div>
                </div>
                <div className="flex shrink-0 flex-nowrap gap-2">
                  <button
                    type="button"
                    className="whitespace-nowrap rounded-lg bg-slate-700 px-3 py-2 text-sm text-white hover:bg-slate-600"
                    onClick={() => (locked ? onLocked() : onSelectTraining(training.id, true))}
                  >
                    {isEnglish ? 'Practice' : '練習'}
                  </button>
                  <button
                    type="button"
                    className="whitespace-nowrap rounded-lg bg-indigo-600 px-3 py-2 text-sm font-semibold text-white hover:bg-indigo-500"
                    onClick={() => (locked ? onLocked() : onSelectTraining(training.id, false))}
                  >
                    {isEnglish ? 'Production' : '本番'}
                  </button>
                  <button
                    type="button"
                    className="whitespace-nowrap rounded-lg border border-slate-600 px-3 py-2 text-sm text-slate-200 hover:bg-slate-800"
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
