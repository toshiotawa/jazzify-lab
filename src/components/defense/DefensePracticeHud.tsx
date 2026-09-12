import React from 'react';

import {
  DEFENSE_PRACTICE_SPEED_MAX_PERCENT,
  DEFENSE_PRACTICE_SPEED_MIN_PERCENT,
  formatDefensePracticeSpeedLabel,
} from '@/game/defense/defensePracticeSpeed';

interface DefensePracticeHudProps {
  readonly phraseIndex: number;
  readonly phraseCount: number;
  readonly speedPercent: number;
  readonly isEnglishCopy: boolean;
  readonly onPrevPhrase: () => void;
  readonly onNextPhrase: () => void;
  readonly onSpeedDown: () => void;
  readonly onSpeedUp: () => void;
}

interface StepperRowProps {
  readonly label: string;
  readonly canDecrease: boolean;
  readonly canIncrease: boolean;
  readonly decreaseLabel: string;
  readonly increaseLabel: string;
  readonly onDecrease: () => void;
  readonly onIncrease: () => void;
}

const StepperRow: React.FC<StepperRowProps> = ({
  label,
  canDecrease,
  canIncrease,
  decreaseLabel,
  increaseLabel,
  onDecrease,
  onIncrease,
}) => (
  <div className="flex items-center gap-1">
    <button
      type="button"
      className="rounded border border-white/15 bg-slate-950/75 px-2 py-1 text-sm font-black text-slate-100 disabled:cursor-not-allowed disabled:opacity-35"
      onClick={onDecrease}
      disabled={!canDecrease}
      aria-label={decreaseLabel}
    >
      ◀
    </button>
    <span className="min-w-[5.5rem] text-center text-sm font-black text-slate-100">
      {label}
    </span>
    <button
      type="button"
      className="rounded border border-white/15 bg-slate-950/75 px-2 py-1 text-sm font-black text-slate-100 disabled:cursor-not-allowed disabled:opacity-35"
      onClick={onIncrease}
      disabled={!canIncrease}
      aria-label={increaseLabel}
    >
      ▶
    </button>
  </div>
);

export const DefensePracticeHud: React.FC<DefensePracticeHudProps> = ({
  phraseIndex,
  phraseCount,
  speedPercent,
  isEnglishCopy,
  onPrevPhrase,
  onNextPhrase,
  onSpeedDown,
  onSpeedUp,
}) => {
  const phraseLabel = isEnglishCopy
    ? `Phrase ${phraseIndex + 1}`
    : `フレーズ${phraseIndex + 1}`;
  const speedLabel = formatDefensePracticeSpeedLabel(speedPercent);
  const canStepPhrase = phraseCount > 1;

  return (
    <div className="flex flex-col gap-1 rounded border border-white/10 bg-slate-950/80 px-2 py-2">
      <StepperRow
        label={phraseLabel}
        canDecrease={canStepPhrase}
        canIncrease={canStepPhrase}
        decreaseLabel={isEnglishCopy ? 'Previous phrase' : '前のフレーズ'}
        increaseLabel={isEnglishCopy ? 'Next phrase' : '次のフレーズ'}
        onDecrease={onPrevPhrase}
        onIncrease={onNextPhrase}
      />
      <StepperRow
        label={speedLabel}
        canDecrease={speedPercent > DEFENSE_PRACTICE_SPEED_MIN_PERCENT}
        canIncrease={speedPercent < DEFENSE_PRACTICE_SPEED_MAX_PERCENT}
        decreaseLabel={isEnglishCopy ? 'Decrease speed' : '速度を下げる'}
        increaseLabel={isEnglishCopy ? 'Increase speed' : '速度を上げる'}
        onDecrease={onSpeedDown}
        onIncrease={onSpeedUp}
      />
    </div>
  );
};
