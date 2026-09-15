import React from 'react';
import { FaChevronRight } from 'react-icons/fa';

import { TrainingGoalArtCard } from '@/components/training/TrainingGoalArtCard';
import { cn } from '@/utils/cn';

interface TrainingGoalBannerProps {
  readonly title: string;
  readonly cleared: number;
  readonly total: number;
  readonly stageNumber: number;
  readonly isEnglish: boolean;
  readonly onClick: () => void;
}

export const TrainingGoalBanner: React.FC<TrainingGoalBannerProps> = ({
  title,
  cleared,
  total,
  stageNumber,
  isEnglish,
  onClick,
}) => (
  <button
    type="button"
    className={cn(
      'mb-6 w-full text-left transition-opacity hover:opacity-95',
    )}
    onClick={onClick}
  >
    <TrainingGoalArtCard stageNumber={stageNumber}>
      <p className="text-xs font-medium uppercase tracking-wider text-indigo-200">
        {isEnglish ? 'Current Goal' : '現在の目標'}
      </p>
      <div className="mt-2 flex items-center justify-between gap-3">
        <p className="text-lg font-bold text-white">{title}</p>
        <div className="flex shrink-0 items-center gap-2">
          <p className="text-sm font-semibold tabular-nums text-indigo-100">
            {cleared}/{total}
          </p>
          <FaChevronRight className="h-4 w-4 text-indigo-200" />
        </div>
      </div>
    </TrainingGoalArtCard>
  </button>
);
