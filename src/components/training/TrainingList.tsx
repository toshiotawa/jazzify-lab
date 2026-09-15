import React, { useMemo, useState } from 'react';
import { FaChevronDown, FaChevronRight, FaInfoCircle } from 'react-icons/fa';

import { TrainingInfoModal } from '@/components/training/TrainingInfoModal';
import { TrainingGoalBanner } from '@/components/training/TrainingGoalBanner';
import { TrainingHabitSection } from '@/components/training/TrainingHabitSection';
import { resolveCollapsedTrainingCategoryIds } from '@/game/training/trainingCategoryAccordion';
import { computeTrainingGoalProgress } from '@/game/training/trainingGoalProgress';
import type {
  TrainingCategoryWithTrainings,
  TrainingGoalSet,
  TrainingScoreSummary,
  TrainingUiText,
} from '@/game/training/trainingTypes';
import { cn } from '@/utils/cn';

interface TrainingListProps {
  readonly categories: readonly TrainingCategoryWithTrainings[];
  readonly summaryByTrainingId: ReadonlyMap<string, TrainingScoreSummary>;
  readonly activeGoalSet: TrainingGoalSet | null;
  readonly lastPlayedTrainingId: string | null;
  readonly todayKey: string;
  readonly activeDays: readonly string[];
  readonly pageInfo: TrainingUiText | null;
  readonly isPremium: boolean;
  readonly isEnglish: boolean;
  readonly onSelectTraining: (trainingId: string, practiceMode: boolean) => void;
  readonly onOpenRanking: () => void;
  readonly onOpenGoal: () => void;
  readonly onOpenRecords: (trainingId: string) => void;
  readonly onOpenCalendar: (dateKey: string) => void;
  readonly onLocked: () => void;
}

export const TrainingList: React.FC<TrainingListProps> = ({
  categories,
  summaryByTrainingId,
  activeGoalSet,
  lastPlayedTrainingId,
  todayKey,
  activeDays,
  pageInfo,
  isPremium,
  isEnglish,
  onSelectTraining,
  onOpenRanking,
  onOpenGoal,
  onOpenRecords,
  onOpenCalendar,
  onLocked,
}) => {
  const [infoCategory, setInfoCategory] = useState<TrainingCategoryWithTrainings | null>(null);
  const [showPageInfo, setShowPageInfo] = useState(false);
  const [collapsedCategoryIds, setCollapsedCategoryIds] = useState<ReadonlySet<string>>(() =>
    resolveCollapsedTrainingCategoryIds(
      categories.map((category) => ({
        id: category.id,
        trainingIds: category.trainings.map((training) => training.id),
      })),
      activeGoalSet?.items.map((item) => item.trainingId) ?? [],
      lastPlayedTrainingId,
    ),
  );

  const goalProgress = useMemo(
    () => (activeGoalSet ? computeTrainingGoalProgress(activeGoalSet, summaryByTrainingId) : null),
    [activeGoalSet, summaryByTrainingId],
  );

  const toggleCategory = (categoryId: string): void => {
    setCollapsedCategoryIds((prev) => {
      const next = new Set(prev);
      if (next.has(categoryId)) {
        next.delete(categoryId);
      } else {
        next.add(categoryId);
      }
      return next;
    });
  };

  const pageInfoText = pageInfo
    ? (isEnglish ? pageInfo.textEn : pageInfo.textJa)
    : '';

  return (
    <div className="mx-auto max-w-3xl px-4 py-6">
      <div className="mb-6 flex items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-white">{isEnglish ? 'Training' : 'トレーニング'}</h1>
            {pageInfoText && (
              <button
                type="button"
                className="text-indigo-300 hover:text-indigo-200"
                aria-label={isEnglish ? 'Training info' : 'トレーニング説明'}
                onClick={() => setShowPageInfo(true)}
              >
                <FaInfoCircle className="h-4 w-4" />
              </button>
            )}
          </div>
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

      {activeGoalSet && goalProgress && (
        <TrainingGoalBanner
          title={isEnglish ? activeGoalSet.titleEn : activeGoalSet.titleJa}
          cleared={goalProgress.cleared}
          total={goalProgress.total}
          isEnglish={isEnglish}
          onClick={onOpenGoal}
        />
      )}

      <TrainingHabitSection
        todayKey={todayKey}
        activeDays={activeDays}
        isEnglish={isEnglish}
        onOpenCalendar={onOpenCalendar}
      />

      {categories.map((category) => {
        const collapsed = collapsedCategoryIds.has(category.id);
        return (
          <section key={category.id} className="mb-8">
            <button
              type="button"
              className="mb-3 flex w-full items-center gap-2 text-left"
              aria-expanded={!collapsed}
              onClick={() => toggleCategory(category.id)}
            >
              {collapsed ? (
                <FaChevronRight className="h-3 w-3 shrink-0 text-indigo-300" />
              ) : (
                <FaChevronDown className="h-3 w-3 shrink-0 text-indigo-300" />
              )}
              <h2 className="text-lg font-semibold text-indigo-200">
                {isEnglish ? category.titleEn : category.titleJa}
                {!category.isFree && !isPremium && (
                  <span className="ml-2 text-xs text-amber-300">Premium</span>
                )}
              </h2>
              {(isEnglish ? category.descriptionEn : category.descriptionJa) && (
                <span
                  role="button"
                  tabIndex={0}
                  className="text-indigo-300 hover:text-indigo-200"
                  aria-label={isEnglish ? 'Category info' : 'カテゴリ説明'}
                  onClick={(event) => {
                    event.stopPropagation();
                    setInfoCategory(category);
                  }}
                  onKeyDown={(event) => {
                    if (event.key === 'Enter' || event.key === ' ') {
                      event.preventDefault();
                      event.stopPropagation();
                      setInfoCategory(category);
                    }
                  }}
                >
                  <FaInfoCircle className="h-4 w-4" />
                </span>
              )}
            </button>
            {!collapsed && (
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
                        <div className="min-w-0 flex-1">
                          <p className="font-medium text-white">{isEnglish ? training.titleEn : training.titleJa}</p>
                          <p className="mt-1 text-xs text-slate-400">
                            {summary
                              ? `${isEnglish ? 'Best' : '最高'} ${summary.bestScore} / ${summary.bestRank}${summary.rankPosition != null ? ` / ${summary.rankPosition}${isEnglish ? 'th' : '位'}` : ''}`
                              : isEnglish ? 'No record yet' : '未プレイ'}
                          </p>
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
            )}
          </section>
        );
      })}

      {infoCategory && (
        <TrainingInfoModal
          title={isEnglish ? infoCategory.titleEn : infoCategory.titleJa}
          description={isEnglish ? infoCategory.descriptionEn : infoCategory.descriptionJa}
          onClose={() => setInfoCategory(null)}
        />
      )}

      {showPageInfo && pageInfoText && (
        <TrainingInfoModal
          title={isEnglish ? 'Training' : 'トレーニング'}
          description={pageInfoText}
          onClose={() => setShowPageInfo(false)}
        />
      )}
    </div>
  );
};
