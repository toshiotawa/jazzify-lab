import React from 'react';

import type { TrainingRow } from '@/game/training/trainingTypes';

interface TrainingRunPrepPanelProps {
  readonly training: TrainingRow;
  readonly isEnglish: boolean;
  readonly onStartPractice: () => void;
  readonly onStartPerformance: () => void;
}

export const TrainingRunPrepPanel: React.FC<TrainingRunPrepPanelProps> = ({
  training,
  isEnglish,
  onStartPractice,
  onStartPerformance,
}) => {
  const title = isEnglish ? training.titleEn : training.titleJa;
  const description = isEnglish
    ? 'Read the staff and play the notes. Practice has no time limit and is not recorded. Assignment progress is saved only in performance mode (1 minute).'
    : '譜面を見て演奏します。練習は時間無制限で記録されません。課題の達成は本番モード（1分）のみ記録されます。';

  return (
    <section className="rounded-xl border border-slate-700 bg-slate-900/80 p-4">
      <div className="font-semibold">{title}</div>
      <p className="mt-3 text-sm text-slate-300">{description}</p>
      <div className="mt-4 flex gap-2">
        <button
          type="button"
          className="rounded-lg bg-emerald-700 px-4 py-2 text-sm hover:bg-emerald-600"
          onClick={onStartPractice}
        >
          {isEnglish ? 'Practice' : '練習'}
        </button>
        <button
          type="button"
          className="rounded-lg bg-indigo-700 px-4 py-2 text-sm hover:bg-indigo-600"
          onClick={onStartPerformance}
        >
          {isEnglish ? 'Performance' : '本番'}
        </button>
      </div>
    </section>
  );
};
