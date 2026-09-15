import React from 'react';
import { FaChevronRight } from 'react-icons/fa';

interface TrainingGoalSetListCardProps {
  readonly isEnglish: boolean;
  readonly onClick: () => void;
}

export const TrainingGoalSetListCard: React.FC<TrainingGoalSetListCardProps> = ({
  isEnglish,
  onClick,
}) => (
  <button
    type="button"
    className="mb-6 w-full rounded-xl border border-indigo-500/40 bg-indigo-950/30 p-4 text-left transition-colors hover:bg-indigo-950/50"
    onClick={onClick}
  >
    <div className="flex items-center justify-between gap-3">
      <div>
        <p className="text-xs font-medium uppercase tracking-wider text-indigo-300">
          {isEnglish ? 'Goal Sets' : '目標セット一覧'}
        </p>
        <p className="mt-1 text-sm text-slate-300">
          {isEnglish ? 'Switch to another goal set' : '他の目標セットに切り替える'}
        </p>
      </div>
      <FaChevronRight className="h-4 w-4 shrink-0 text-indigo-300" />
    </div>
  </button>
);
