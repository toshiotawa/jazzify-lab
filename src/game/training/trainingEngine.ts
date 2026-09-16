import type { TrainingKind, TrainingQuestion, TrainingRuntime } from '@/game/training/trainingTypes';
import { parseProgressionChordRoot, rootMidiBelow } from '@/game/training/trainingProgression';
import {
  TRAINING_DYING_FADE_SPEED,
  TRAINING_DYING_KNOCKBACK_PX_PER_SEC,
  TRAINING_ENEMY_COUNT,
} from '@/game/training/trainingTypes';
import { DEFENSE_SLASH_SEC } from '@/game/defense/defenseEnemyConfig';
import {
  computeOrderedChordKeyboardHintsFromMidis,
  type OrderedChordKeyboardHints,
  orderedPitchClassesFromMidis,
} from '@/utils/orderedChordInput';

interface TrainingNoteEvaluationResult {
  readonly accepted: boolean;
  readonly completed: boolean;
  readonly voicingCompleted: boolean;
  readonly newCorrectIndices: readonly number[];
  readonly matchedGroupIndex: number | null;
}

/** 和音 / ヴォイシングの全構成音正解時のみルート音を鳴らす（入門・音程・スケールは対象外）。 */
export const shouldPlayTrainingRootOnCorrect = (
  kind: TrainingKind,
  playRootOnCorrect: boolean,
  completed: boolean,
  rootMidi: number | null | undefined,
  playRootOnFirstCorrect = false,
): boolean => (
  playRootOnCorrect
  && !playRootOnFirstCorrect
  && completed
  && rootMidi != null
  && (kind === 'chord' || kind === 'voicing' || kind === 'progression')
);

export const isGroupedTrainingQuestion = (question: TrainingQuestion): boolean => (
  question.layout === 'grouped'
);

const groupIndicesInOrder = (question: TrainingQuestion): readonly number[] => {
  const seen = new Set<number>();
  const out: number[] = [];
  for (const note of question.notes) {
    const groupIndex = note.groupIndex ?? 0;
    if (seen.has(groupIndex)) continue;
    seen.add(groupIndex);
    out.push(groupIndex);
  }
  return out;
};

const indicesForGroup = (
  question: TrainingQuestion,
  groupIndex: number,
): readonly number[] => {
  const out: number[] = [];
  question.notes.forEach((note, index) => {
    if (note.isTarget && (note.groupIndex ?? 0) === groupIndex) {
      out.push(index);
    }
  });
  return out;
};

export const activeTrainingGroupIndex = (
  question: TrainingQuestion,
  correctIndices: readonly number[],
): number | null => {
  if (!isGroupedTrainingQuestion(question)) return null;
  for (const groupIndex of groupIndicesInOrder(question)) {
    const groupTargets = indicesForGroup(question, groupIndex);
    if (groupTargets.some((index) => !correctIndices.includes(index))) {
      return groupIndex;
    }
  }
  return null;
};

export const isFirstAcceptedInTrainingGroup = (
  question: TrainingQuestion,
  previousCorrectIndices: readonly number[],
  groupIndex: number,
): boolean => !indicesForGroup(question, groupIndex)
  .some((index) => previousCorrectIndices.includes(index));

export const rootMidiForTrainingGroup = (
  question: TrainingQuestion,
  groupIndex: number,
): number | null => {
  const groupNotes = indicesForGroup(question, groupIndex)
    .map((index) => question.notes[index])
    .filter((note): note is NonNullable<typeof note> => note != null);
  if (groupNotes.length === 0) return null;
  const lowestMidi = Math.min(...groupNotes.map((note) => note.midi));
  const root = parseProgressionChordRoot(question.promptLabel);
  return root != null ? rootMidiBelow(root, lowestMidi) : question.rootMidi;
};

const isGroupComplete = (
  question: TrainingQuestion,
  correctIndices: readonly number[],
  groupIndex: number,
): boolean => {
  const groupTargets = indicesForGroup(question, groupIndex);
  return groupTargets.length > 0
    && groupTargets.every((index) => correctIndices.includes(index));
};

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
    return {
      accepted: false,
      completed: true,
      voicingCompleted: false,
      newCorrectIndices: correctIndices,
      matchedGroupIndex: null,
    };
  }

  const activeGroupIndex = isGroupedTrainingQuestion(question)
    ? activeTrainingGroupIndex(question, correctIndices)
    : null;
  const scopedRemaining = activeGroupIndex == null
    ? remaining
    : remaining.filter((index) => (question.notes[index]?.groupIndex ?? 0) === activeGroupIndex);

  if (scopedRemaining.length === 0) {
    return {
      accepted: false,
      completed: remaining.length === 0,
      voicingCompleted: false,
      newCorrectIndices: correctIndices,
      matchedGroupIndex: null,
    };
  }

  if (question.ordered) {
    const nextIndex = scopedRemaining[0];
    const expected = question.notes[nextIndex];
    if (!expected || expected.pitchClass !== pitchClass) {
      return {
        accepted: false,
        completed: false,
        voicingCompleted: false,
        newCorrectIndices: correctIndices,
        matchedGroupIndex: null,
      };
    }
    const newCorrect = [...correctIndices, nextIndex];
    const matchedGroupIndex = expected.groupIndex ?? 0;
    const voicingCompleted = activeGroupIndex != null
      && isGroupComplete(question, newCorrect, matchedGroupIndex);
    return {
      accepted: true,
      completed: newCorrect.length >= targets.length,
      voicingCompleted,
      newCorrectIndices: newCorrect,
      matchedGroupIndex,
    };
  }

  let matchIndex = -1;
  if (sequential) {
    const groupCorrectIndices = activeGroupIndex == null
      ? correctIndices
      : correctIndices.filter((index) => (question.notes[index]?.groupIndex ?? 0) === activeGroupIndex);
    const pressedMidis = groupCorrectIndices
      .map((i) => question.notes[i]?.midi)
      .filter((m): m is number => m != null);
    pressedMidis.push(midiNote);
    const expectedPcs = scopedRemaining
      .map((i) => question.notes[i]?.pitchClass)
      .filter((pc): pc is number => pc != null);
    const nextExpectedPc = expectedPcs[groupCorrectIndices.length];
    if (nextExpectedPc == null || pitchClass !== nextExpectedPc) {
      return {
        accepted: false,
        completed: false,
        voicingCompleted: false,
        newCorrectIndices: correctIndices,
        matchedGroupIndex: null,
      };
    }
    matchIndex = scopedRemaining.find((i) => (
      question.notes[i]?.pitchClass === pitchClass && !correctIndices.includes(i)
    )) ?? -1;
  } else {
    matchIndex = scopedRemaining.find((i) => (
      question.notes[i]?.pitchClass === pitchClass && !correctIndices.includes(i)
    )) ?? -1;
  }

  if (matchIndex < 0) {
    return {
      accepted: false,
      completed: false,
      voicingCompleted: false,
      newCorrectIndices: correctIndices,
      matchedGroupIndex: null,
    };
  }

  const newCorrect = [...correctIndices, matchIndex];
  const matchedGroupIndex = question.notes[matchIndex]?.groupIndex ?? 0;
  const voicingCompleted = activeGroupIndex != null
    && isGroupComplete(question, newCorrect, matchedGroupIndex);
  return {
    accepted: true,
    completed: newCorrect.length >= targets.length,
    voicingCompleted,
    newCorrectIndices: newCorrect,
    matchedGroupIndex,
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
  const activeGroup = activeTrainingGroupIndex(question, correctIndices);
  return question.notes
    .map((note, index) => {
      if (!note.isTarget || correctIndices.includes(index)) return null;
      if (activeGroup != null && (note.groupIndex ?? 0) !== activeGroup) return null;
      return note.midi;
    })
    .filter((m): m is number => m != null);
};

export const shouldUseTrainingSequentialKeyboardHints = (
  question: TrainingQuestion,
  kind: TrainingKind,
  voiceSequential: boolean,
): boolean => (
  kind !== 'interval'
  && (question.ordered || voiceSequential)
);

export const getTrainingSequentialKeyboardHints = (
  question: TrainingQuestion,
  correctIndices: readonly number[],
  voiceSequential: boolean,
): OrderedChordKeyboardHints | null => {
  if (!question.ordered && !voiceSequential) {
    return null;
  }

  const activeGroup = activeTrainingGroupIndex(question, correctIndices);
  const targets = targetIndices(question).filter((index) => (
    activeGroup == null || (question.notes[index]?.groupIndex ?? 0) === activeGroup
  ));
  const remaining = targets.filter((index) => !correctIndices.includes(index));
  const completedMidis = correctIndices
    .map((index) => question.notes[index]?.midi)
    .filter((midi): midi is number => midi != null);

  if (question.ordered) {
    const pendingMidis: number[] = [];
    let nextMidi: number | null = null;
    for (let i = 0; i < remaining.length; i += 1) {
      const midi = question.notes[remaining[i] ?? -1]?.midi;
      if (midi == null) continue;
      if (i === 0) {
        nextMidi = midi;
      } else {
        pendingMidis.push(midi);
      }
    }
    return { nextMidi, pendingMidis, completedMidis };
  }

  const targetMidis = targets
    .map((index) => question.notes[index]?.midi)
    .filter((midi): midi is number => midi != null);
  const completedPcs = correctIndices
    .filter((index) => activeGroup == null || (question.notes[index]?.groupIndex ?? 0) === activeGroup)
    .map((index) => question.notes[index]?.pitchClass)
    .filter((pitchClass): pitchClass is number => pitchClass != null);
  return computeOrderedChordKeyboardHintsFromMidis(targetMidis, completedPcs);
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
