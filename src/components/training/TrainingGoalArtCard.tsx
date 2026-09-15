import React from 'react';

import { cn } from '@/utils/cn';
import { stageCardRectangularPath } from '@/utils/stageCardAssets';

interface TrainingGoalArtCardProps {
  readonly stageNumber: number;
  readonly className?: string;
  readonly minHeightClassName?: string;
  readonly children: React.ReactNode;
}

export const TrainingGoalArtCard: React.FC<TrainingGoalArtCardProps> = ({
  stageNumber,
  className,
  minHeightClassName = 'min-h-[138px]',
  children,
}) => (
  <div
    className={cn(
      'relative overflow-hidden rounded-2xl border border-purple-500/55',
      minHeightClassName,
      className,
    )}
  >
    <img
      src={stageCardRectangularPath(stageNumber)}
      alt=""
      aria-hidden
      loading="lazy"
      decoding="async"
      className="absolute inset-0 h-full w-full object-cover"
    />
    <div
      aria-hidden
      className="absolute inset-0 bg-gradient-to-r from-black/86 via-black/52 to-black/12"
    />
    <div className="relative z-10 p-4">{children}</div>
  </div>
);
