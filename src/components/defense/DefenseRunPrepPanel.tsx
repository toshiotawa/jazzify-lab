import React from 'react';

import type { DefenseStage } from '@/game/defense/defenseTypes';

type DefenseRunPrepVariant = 'lesson' | 'map';

interface DefenseRunPrepPanelProps {
  readonly variant: DefenseRunPrepVariant;
  readonly stage: DefenseStage;
  readonly isEnglishCopy: boolean;
  readonly onStartPractice: () => void;
  readonly onStartPerformance: () => void;
}

export const DefenseRunPrepPanel: React.FC<DefenseRunPrepPanelProps> = ({
  variant,
  stage,
  isEnglishCopy,
  onStartPractice,
  onStartPerformance,
}) => {
  const stageTitle = isEnglishCopy && stage.titleEn ? stage.titleEn : stage.title;
  const description = variant === 'lesson'
    ? (isEnglishCopy
      ? 'Play the notated phrase in order to slash the frontmost enemy. Survive until the timer ends. Only performance mode counts toward the assignment.'
      : '譜面の音を順番に演奏すると、一番手前の敵を横一閃で攻撃します。タイマー終了まで生き残ればクリア。課題の達成は本番モードのみ記録されます。')
    : (isEnglishCopy
      ? 'Play the notated phrase in order to slash the frontmost enemy. Survive until the timer ends. Map clear progress is saved only in performance mode.'
      : '譜面の音を順番に演奏すると、一番手前の敵を横一閃で攻撃します。タイマー終了まで生き残ればクリア。マップのクリア記録は本番モードのみ保存されます。');

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
      <p className="mt-3 text-sm text-slate-300">{description}</p>
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
