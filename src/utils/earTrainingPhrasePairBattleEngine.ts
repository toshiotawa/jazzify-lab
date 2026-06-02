import type { EarTrainingDamageConfig } from '@/utils/earTrainingEngine';
import {
  evaluateAdlibNote,
  type AdlibEvaluation,
  type AdlibPattern,
  type AdlibRuntimeState,
} from '@/utils/earTrainingPhrasePairEngine';

/** 同一コードステップ内の火の玉上限（Web adlib と同値） */
export const PHRASE_PAIR_MAX_FIREBALLS_PER_STEP = 16;

/** 直前と同音ペアを連続完成させたときの固定ダメージ（極小） */
export const PHRASE_PAIR_REPEAT_ENEMY_DAMAGE = 1;

export interface PhrasePairAdlibWindowState {
  readonly stepId: string | null;
  readonly fireCount: number;
  /** 直前完成ペアの pitch class 集合キー（順序無視）。連続同音減衰用 */
  readonly lastCompletedNoteKey: string | null;
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

const noteKeyFromPcs = (pcs: readonly number[]): string =>
  pcs
    .map((pc) => ((pc % 12) + 12) % 12)
    .slice()
    .sort((a, b) => a - b)
    .join(',');

export const noteKeyFromPattern = (pattern: AdlibPattern): string =>
  noteKeyFromPcs(pattern.pcs);

export const createPhrasePairAdlibWindowState = (
  stepId: string | null = null,
  lastCompletedNoteKey: string | null = null,
): PhrasePairAdlibWindowState => ({
  stepId,
  fireCount: 0,
  lastCompletedNoteKey,
});

export const applyPhrasePairStepTransition = (
  current: PhrasePairAdlibWindowState,
  stepId: string | null,
): PhrasePairAdlibWindowState => {
  if (current.stepId === stepId) return current;
  return {
    stepId,
    fireCount: 0,
    lastCompletedNoteKey: current.lastCompletedNoteKey,
  };
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

  if (evaluation.result === 'complete' && evaluation.completedPattern) {
    const noteKey = noteKeyFromPattern(evaluation.completedPattern);
    const isRepeat =
      window.lastCompletedNoteKey !== null
      && noteKey === window.lastCompletedNoteKey;
    const shouldFire = window.fireCount < PHRASE_PAIR_MAX_FIREBALLS_PER_STEP;
    const nextWindow: PhrasePairAdlibWindowState = {
      stepId: window.stepId,
      fireCount: shouldFire ? window.fireCount + 1 : window.fireCount,
      lastCompletedNoteKey: noteKey,
    };
    const enemyDamage = shouldFire
      ? (isRepeat ? PHRASE_PAIR_REPEAT_ENEMY_DAMAGE : damage.perCorrectNote)
      : 0;

    return {
      evaluation,
      nextMatcherState: evaluation.nextState,
      nextWindow,
      shouldFire,
      enemyDamage,
      playerDamage: 0,
      hitPitchClass: inputPc,
    };
  }

  return {
    evaluation,
    nextMatcherState: evaluation.nextState,
    nextWindow: window,
    shouldFire: false,
    enemyDamage: 0,
    playerDamage: 0,
    hitPitchClass: inputPc,
  };
};
