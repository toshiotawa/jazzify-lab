import type { EarTrainingDamageConfig } from '@/utils/earTrainingEngine';
import {
  evaluateAdlibNote,
  type AdlibEvaluation,
  type AdlibPattern,
  type AdlibRuntimeState,
} from '@/utils/earTrainingPhrasePairEngine';

/** 同一コードステップ内の火の玉上限（Web adlib と同値） */
export const PHRASE_PAIR_MAX_FIREBALLS_PER_STEP = 16;

export interface PhrasePairAdlibWindowState {
  readonly stepId: string | null;
  readonly fireCount: number;
}

export interface PhrasePairAdlibNoteResult {
  readonly evaluation: AdlibEvaluation;
  readonly nextMatcherState: AdlibRuntimeState;
  readonly nextWindow: PhrasePairAdlibWindowState;
  readonly shouldFire: boolean;
  readonly enemyDamage: number;
  readonly playerDamage: number;
  readonly hitPitchClass: number | null;
}

export const createPhrasePairAdlibWindowState = (
  stepId: string | null = null,
): PhrasePairAdlibWindowState => ({
  stepId,
  fireCount: 0,
});

export const applyPhrasePairStepTransition = (
  current: PhrasePairAdlibWindowState,
  stepId: string | null,
): PhrasePairAdlibWindowState => {
  if (current.stepId === stepId) return current;
  return createPhrasePairAdlibWindowState(stepId);
};

export const handlePhrasePairAdlibNoteOn = (
  matcherState: AdlibRuntimeState,
  window: PhrasePairAdlibWindowState,
  patterns: readonly AdlibPattern[],
  midiNote: number,
  damage: EarTrainingDamageConfig,
): PhrasePairAdlibNoteResult => {
  const inputPc = ((midiNote % 12) + 12) % 12;
  const evaluation = evaluateAdlibNote(matcherState, inputPc, patterns);

  if (evaluation.result === 'miss') {
    return {
      evaluation,
      nextMatcherState: evaluation.nextState,
      nextWindow: window,
      shouldFire: false,
      enemyDamage: 0,
      playerDamage: damage.miss,
      hitPitchClass: null,
    };
  }

  const shouldFire =
    evaluation.result === 'complete'
    && window.fireCount < PHRASE_PAIR_MAX_FIREBALLS_PER_STEP;

  const nextWindow: PhrasePairAdlibWindowState = shouldFire
    ? { stepId: window.stepId, fireCount: window.fireCount + 1 }
    : window;

  return {
    evaluation,
    nextMatcherState: evaluation.nextState,
    nextWindow,
    shouldFire,
    enemyDamage: shouldFire ? damage.perCorrectNote : 0,
    playerDamage: 0,
    hitPitchClass: inputPc,
  };
};
