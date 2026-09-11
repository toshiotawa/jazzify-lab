import type { TrainingQuestion, TrainingRuntime } from '@/game/training/trainingTypes';
import {
  TRAINING_DYING_FADE_SPEED,
  TRAINING_DYING_KNOCKBACK_PX_PER_SEC,
  TRAINING_ENEMY_COUNT,
} from '@/game/training/trainingTypes';
import { DEFENSE_SLASH_SEC } from '@/game/defense/defenseEnemyConfig';
import { orderedPitchClassesFromMidis } from '@/utils/orderedChordInput';

interface TrainingNoteEvaluationResult {
  readonly accepted: boolean;
  readonly completed: boolean;
  readonly newCorrectIndices: readonly number[];
}

const targetIndices = (question: TrainingQuestion): readonly number[] => {
  const out: number[] = [];
  question.notes.forEach((note, index) => {
    if (note.isTarget) out.push(index);
  });
  return out;
};

export const evaluateTrainingNoteOn = (
  question: TrainingQuestion,
  correctIndices: readonly number[],
  midiNote: number,
  sequential: boolean,
): TrainingNoteEvaluationResult => {
  const pitchClass = ((midiNote % 12) + 12) % 12;
  const targets = targetIndices(question);
  const remaining = targets.filter((i) => !correctIndices.includes(i));

  if (remaining.length === 0) {
    return { accepted: false, completed: true, newCorrectIndices: correctIndices };
  }

  if (question.ordered) {
    const nextIndex = remaining[0];
    const expected = question.notes[nextIndex];
    if (!expected || expected.pitchClass !== pitchClass) {
      return { accepted: false, completed: false, newCorrectIndices: correctIndices };
    }
    const newCorrect = [...correctIndices, nextIndex];
    return {
      accepted: true,
      completed: newCorrect.length >= targets.length,
      newCorrectIndices: newCorrect,
    };
  }

  let matchIndex = -1;
  if (sequential) {
    const pressedMidis = correctIndices.map((i) => question.notes[i]?.midi).filter((m): m is number => m != null);
    pressedMidis.push(midiNote);
    const ordered = orderedPitchClassesFromMidis(pressedMidis);
    const expectedPcs = targets.map((i) => question.notes[i]?.pitchClass).filter((pc): pc is number => pc != null);
    const nextExpectedPc = expectedPcs[correctIndices.length];
    if (nextExpectedPc == null || pitchClass !== nextExpectedPc) {
      return { accepted: false, completed: false, newCorrectIndices: correctIndices };
    }
    matchIndex = targets.find((i) => question.notes[i]?.pitchClass === pitchClass && !correctIndices.includes(i)) ?? -1;
  } else {
    matchIndex = targets.find((i) => question.notes[i]?.pitchClass === pitchClass && !correctIndices.includes(i)) ?? -1;
  }

  if (matchIndex < 0) {
    return { accepted: false, completed: false, newCorrectIndices: correctIndices };
  }

  const newCorrect = [...correctIndices, matchIndex];
  return {
    accepted: true,
    completed: newCorrect.length >= targets.length,
    newCorrectIndices: newCorrect,
  };
};

export const performTrainingDefeat = (
  runtime: TrainingRuntime,
  nowSec: number,
  guardPoseSec = 0,
): void => {
  const dying = runtime.dyingEnemy;
  dying.active = true;
  dying.typeIndex = runtime.enemy.typeIndex;
  dying.alpha = 1;
  dying.offsetX = 0;
  dying.slashUntilSec = nowSec + DEFENSE_SLASH_SEC;

  runtime.enemy.slashUntilSec = 0;
  runtime.enemy.typeIndex = (runtime.enemy.typeIndex + 1) % TRAINING_ENEMY_COUNT;
  runtime.enemy.fadeAlpha = 1;

  if (guardPoseSec > 0) {
    runtime.guardPoseUntilSec = nowSec + guardPoseSec;
  }
};

/** Slash / fade の視覚更新のみ。次問スポーンは正解時に同期で行う。 */
export const tickTrainingEnemy = (runtime: TrainingRuntime, nowSec: number, dt: number): void => {
  const dying = runtime.dyingEnemy;
  if (dying.active) {
    dying.alpha = Math.max(0, dying.alpha - dt * TRAINING_DYING_FADE_SPEED);
    dying.offsetX += dt * TRAINING_DYING_KNOCKBACK_PX_PER_SEC;
    if (dying.alpha <= 0) {
      dying.active = false;
      dying.slashUntilSec = 0;
    }
  }
  if (dying.slashUntilSec > 0 && nowSec >= dying.slashUntilSec) {
    dying.slashUntilSec = 0;
  }
};

export const tickTrainingTimer = (runtime: TrainingRuntime, dt: number): boolean => {
  if (runtime.result !== 'playing') return false;
  runtime.elapsedSec += dt;
  if (runtime.elapsedSec >= runtime.durationSec) {
    runtime.result = 'finished';
    return true;
  }
  return false;
};

export const getTrainingKeyboardHintMidis = (
  question: TrainingQuestion,
  correctIndices: readonly number[],
  showHints: boolean,
): readonly number[] => {
  if (!showHints) return [];
  return question.notes
    .map((note, index) => (note.isTarget && !correctIndices.includes(index) ? note.midi : null))
    .filter((m): m is number => m != null);
};

/** 音程の基準音など、入力対象外の鍵盤ハイライト（練習・本番とも表示） */
export const getTrainingKeyboardReferenceMidis = (
  question: TrainingQuestion,
): readonly number[] => {
  const out: number[] = [];
  for (let i = 0; i < question.notes.length; i += 1) {
    const note = question.notes[i];
    if (note && !note.isTarget) out.push(note.midi);
  }
  return out;
};
