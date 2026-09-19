import React from 'react';

import type { DefenseStage } from '@/game/defense/defenseTypes';

interface DefenseRunPrepPanelProps {
  readonly stage: DefenseStage;
  readonly isEnglishCopy: boolean;
  readonly onStartPractice: () => void;
  readonly onStartPerformance: () => void;
}

export const DefenseRunPrepPanel: React.FC<DefenseRunPrepPanelProps> = ({
  stage,
  isEnglishCopy,
  onStartPractice,
  onStartPerformance,
}) => {
  const stageTitle = isEnglishCopy && stage.titleEn ? stage.titleEn : stage.title;

  return (
    <section className="rounded-xl border border-slate-700 bg-slate-900/80 p-4">
      <div className="font-semibold">{stageTitle}</div>
      <div className="mt-1 text-xs text-slate-400">
        Lv.{stage.difficultyLevel} / {stage.surviveSeconds}s / HP {stage.playerHp}
        {' / '}
        {isEnglishCopy
          ? `${stage.phrases.length} phrases × ${stage.requiredCompletionCount}`
          : `${stage.phrases.length}フレーズ × ${stage.requiredCompletionCount}回`}
      </div>
      <div className="mt-4 flex gap-2">
        <button
          type="button"
          className="rounded-lg bg-emerald-700 px-4 py-2 text-sm hover:bg-emerald-600"
          onClick={onStartPractice}
        >
          {isEnglishCopy ? 'Practice' : '練習'}
        </button>
        <button
          type="button"
          className="rounded-lg bg-indigo-700 px-4 py-2 text-sm hover:bg-indigo-600"
          onClick={onStartPerformance}
        >
          {isEnglishCopy ? 'Performance' : '本番'}
        </button>
      </div>
    </section>
  );
};
