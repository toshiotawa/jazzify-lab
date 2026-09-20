import React from 'react';

import {
  DEFENSE_PRACTICE_SPEED_MAX_PERCENT,
  DEFENSE_PRACTICE_SPEED_MIN_PERCENT,
  formatDefensePracticeSpeedLabel,
} from '@/game/defense/defensePracticeSpeed';
import {
  clampNotationOctaveShift,
  NOTATION_OCTAVE_SHIFT_MAX,
  NOTATION_OCTAVE_SHIFT_MIN,
} from '@/utils/notationInstrument';

interface DefensePracticeHudProps {
  readonly phraseIndex: number;
  readonly phraseCount: number;
  readonly isEnglishCopy: boolean;
  readonly onPrevPhrase: () => void;
  readonly onNextPhrase: () => void;
  readonly disabled?: boolean;
}

interface DefenseSpeedStepperProps {
  readonly speedPercent: number;
  readonly isEnglishCopy: boolean;
  readonly onSpeedDown: () => void;
  readonly onSpeedUp: () => void;
  readonly disabled?: boolean;
}

interface StepperRowProps {
  readonly label: string;
  readonly canDecrease: boolean;
  readonly canIncrease: boolean;
  readonly decreaseLabel: string;
  readonly increaseLabel: string;
  readonly compact?: boolean;
  readonly onDecrease: () => void;
  readonly onIncrease: () => void;
}

const StepperRow: React.FC<StepperRowProps> = ({
  label,
  canDecrease,
  canIncrease,
  decreaseLabel,
  increaseLabel,
  compact = false,
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
    <span
      className={`text-center text-sm font-black text-slate-100 ${
        compact ? 'min-w-[3rem]' : 'min-w-[5.5rem]'
      }`}
    >
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

interface DefenseOctaveStepperProps {
  readonly octaveShift: number;
  readonly isEnglishCopy: boolean;
  readonly onOctaveDown: () => void;
  readonly onOctaveUp: () => void;
  readonly disabled?: boolean;
}

export const DefenseOctaveStepper: React.FC<DefenseOctaveStepperProps> = ({
  octaveShift,
  isEnglishCopy,
  onOctaveDown,
  onOctaveUp,
  disabled = false,
}) => {
  const canDecrease = !disabled && octaveShift > NOTATION_OCTAVE_SHIFT_MIN;
  const canIncrease = !disabled && octaveShift < NOTATION_OCTAVE_SHIFT_MAX;
  const label = isEnglishCopy
    ? `Octave ${octaveShift > 0 ? '+' : ''}${octaveShift}`
    : `オクターブ ${octaveShift > 0 ? '+' : ''}${octaveShift}`;

  return (
    <StepperRow
      label={label}
      compact
      canDecrease={canDecrease}
      canIncrease={canIncrease}
      decreaseLabel={isEnglishCopy ? 'Lower written octave' : '記譜オクターブを下げる'}
      increaseLabel={isEnglishCopy ? 'Raise written octave' : '記譜オクターブを上げる'}
      onDecrease={onOctaveDown}
      onIncrease={onOctaveUp}
    />
  );
};

export const clampDefenseOctaveShift = clampNotationOctaveShift;

export const DefenseSpeedStepper: React.FC<DefenseSpeedStepperProps> = ({
  speedPercent,
  isEnglishCopy,
  onSpeedDown,
  onSpeedUp,
  disabled = false,
}) => (
  <div className="rounded border border-white/10 bg-slate-950/80 px-2 py-1">
    <StepperRow
      label={formatDefensePracticeSpeedLabel(speedPercent)}
      canDecrease={!disabled && speedPercent > DEFENSE_PRACTICE_SPEED_MIN_PERCENT}
      canIncrease={!disabled && speedPercent < DEFENSE_PRACTICE_SPEED_MAX_PERCENT}
      decreaseLabel={isEnglishCopy ? 'Decrease speed' : '速度を下げる'}
      increaseLabel={isEnglishCopy ? 'Increase speed' : '速度を上げる'}
      compact
      onDecrease={onSpeedDown}
      onIncrease={onSpeedUp}
    />
  </div>
);

export const DefensePracticeHud: React.FC<DefensePracticeHudProps> = ({
  phraseIndex,
  phraseCount,
  isEnglishCopy,
  onPrevPhrase,
  onNextPhrase,
  disabled = false,
}) => {
  const phraseLabel = isEnglishCopy
    ? `Phrase ${phraseIndex + 1}`
    : `フレーズ${phraseIndex + 1}`;
  const canStepPhrase = !disabled && phraseCount > 1;

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
    </div>
  );
};
