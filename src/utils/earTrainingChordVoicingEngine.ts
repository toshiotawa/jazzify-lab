import { Note } from 'tonal';
import type {
  EarTrainingChordVoicingAttempt,
  EarTrainingPhrase,
  EarTrainingPhraseChord,
} from '@/types';
import {
  midiToPitchClass,
  type EarTrainingDamageConfig,
} from '@/utils/earTrainingEngine';

const MAX_MISSES_PER_CHORD = 5;

export interface ChordVoicingEvaluationResult {
  attempt: EarTrainingChordVoicingAttempt;
  hitPitchClass: number | null;
  chordJustCompleted: boolean;
  enemyDamage: number;
  playerDamage: number;
  evaluationMissAdded: boolean;
  /** 構成音外で、この入力で初めてミスが記録されたときのみ true（コードクイズの初回ペナルティ用） */
  firstWrongJustHappened: boolean;
}

const noteNameToPitchClassSafe = (name: string): number | null => {
  const trimmed = name.trim();
  if (!trimmed) {
    return null;
  }
  const chroma = Note.chroma(trimmed);
  return typeof chroma === 'number' ? chroma : null;
};

export const chordHasVoicingNotes = (chord: EarTrainingPhraseChord): boolean => (
  (chord.voicing?.length ?? 0) > 0
);

export const getVoicingPitchClasses = (chord: EarTrainingPhraseChord): number[] => {
  const voicing = chord.voicing ?? [];
  if (voicing.length === 0) {
    return [];
  }
  const pcs = new Set<number>();
  voicing.forEach(noteName => {
    const pc = noteNameToPitchClassSafe(noteName);
    if (pc !== null) {
      pcs.add(pc);
    }
  });
  return [...pcs];
};

const chordNeedsPitchClass = (
  attempt: EarTrainingChordVoicingAttempt,
  chord: EarTrainingPhraseChord | null,
  pitchClass: number,
): boolean => {
  if (!chord || attempt.completedChordIds.has(chord.id)) {
    return false;
  }
  const targetPcs = getVoicingPitchClasses(chord);
  if (!targetPcs.includes(pitchClass)) {
    return false;
  }
  const pressed = attempt.pressedByChord.get(chord.id);
  return !pressed?.has(pitchClass);
};

export const selectChordVoicingJudgmentChord = (
  attempt: EarTrainingChordVoicingAttempt,
  primaryChord: EarTrainingPhraseChord | null,
  overlapChord: EarTrainingPhraseChord | null,
  midiNote: number,
): EarTrainingPhraseChord | null => {
  const inputPc = midiToPitchClass(midiNote);
  if (chordNeedsPitchClass(attempt, primaryChord, inputPc)) {
    return primaryChord;
  }
  if (chordNeedsPitchClass(attempt, overlapChord, inputPc)) {
    return overlapChord;
  }
  return primaryChord;
};

export const createChordVoicingAttempt = (phrase: EarTrainingPhrase): EarTrainingChordVoicingAttempt => {
  const completedChordIds = new Set<string>();
  (phrase.chords ?? []).forEach(chord => {
    if (!chordHasVoicingNotes(chord)) {
      completedChordIds.add(chord.id);
    }
  });

  return {
    phraseId: phrase.id,
    pressedByChord: new Map<string, Set<number>>(),
    missByChord: new Map<string, number>(),
    completedChordIds,
    awardedChordIds: new Set<string>(),
    failedChordIds: new Set<string>(),
  };
};

const cloneAttempt = (attempt: EarTrainingChordVoicingAttempt): EarTrainingChordVoicingAttempt => ({
  phraseId: attempt.phraseId,
  pressedByChord: new Map(Array.from(attempt.pressedByChord, ([key, value]) => [key, new Set(value)])),
  missByChord: new Map(attempt.missByChord),
  completedChordIds: new Set(attempt.completedChordIds),
  awardedChordIds: new Set(attempt.awardedChordIds),
  failedChordIds: new Set(attempt.failedChordIds),
});

const isChordCompleted = (
  targetPcs: readonly number[],
  pressed: ReadonlySet<number>,
): boolean => {
  if (targetPcs.length === 0) {
    return false;
  }
  return targetPcs.every(pc => pressed.has(pc));
};

export type ChordVoicingNoteOnWrongNotesPolicy = 'default' | 'first_only_per_chord';

export const handleChordVoicingNoteOn = (
  attempt: EarTrainingChordVoicingAttempt,
  activeChord: EarTrainingPhraseChord | null,
  midiNote: number,
  damage: EarTrainingDamageConfig,
  options?: {
    readonly suppressMissRecording?: boolean;
    readonly wrongNotesPolicy?: ChordVoicingNoteOnWrongNotesPolicy;
  },
): ChordVoicingEvaluationResult => {
  if (!activeChord) {
    return {
      attempt,
      hitPitchClass: null,
      chordJustCompleted: false,
      enemyDamage: 0,
      playerDamage: 0,
      evaluationMissAdded: false,
      firstWrongJustHappened: false,
    };
  }

  const chordId = activeChord.id;
  if (attempt.completedChordIds.has(chordId)) {
    return {
      attempt,
      hitPitchClass: null,
      chordJustCompleted: false,
      enemyDamage: 0,
      playerDamage: 0,
      evaluationMissAdded: false,
      firstWrongJustHappened: false,
    };
  }

  const targetPcs = getVoicingPitchClasses(activeChord);
  if (targetPcs.length === 0) {
    return {
      attempt,
      hitPitchClass: null,
      chordJustCompleted: false,
      enemyDamage: 0,
      playerDamage: 0,
      evaluationMissAdded: false,
      firstWrongJustHappened: false,
    };
  }
  const inputPc = midiToPitchClass(midiNote);
  const pressedSet = attempt.pressedByChord.get(chordId) ?? new Set<number>();
  const isTargetTone = targetPcs.includes(inputPc);

  if (!isTargetTone) {
    if (options?.suppressMissRecording === true) {
      return {
        attempt,
        hitPitchClass: null,
        chordJustCompleted: false,
        enemyDamage: 0,
        playerDamage: 0,
        evaluationMissAdded: false,
        firstWrongJustHappened: false,
      };
    }
    if (options?.wrongNotesPolicy === 'first_only_per_chord') {
      const currentMiss = attempt.missByChord.get(chordId) ?? 0;
      if (currentMiss >= 1) {
        return {
          attempt,
          hitPitchClass: null,
          chordJustCompleted: false,
          enemyDamage: 0,
          playerDamage: 0,
          evaluationMissAdded: false,
          firstWrongJustHappened: false,
        };
      }
      const next = cloneAttempt(attempt);
      next.missByChord.set(chordId, 1);
      return {
        attempt: next,
        hitPitchClass: null,
        chordJustCompleted: false,
        enemyDamage: 0,
        playerDamage: 0,
        evaluationMissAdded: true,
        firstWrongJustHappened: true,
      };
    }
    const next = cloneAttempt(attempt);
    const currentMiss = next.missByChord.get(chordId) ?? 0;
    const evaluationMissAdded = currentMiss < MAX_MISSES_PER_CHORD;
    if (evaluationMissAdded) {
      next.missByChord.set(chordId, currentMiss + 1);
    }
    return {
      attempt: next,
      hitPitchClass: null,
      chordJustCompleted: false,
      enemyDamage: 0,
      playerDamage: 0,
      evaluationMissAdded,
      firstWrongJustHappened: evaluationMissAdded && currentMiss === 0,
    };
  }

  if (pressedSet.has(inputPc)) {
    return {
      attempt,
      hitPitchClass: inputPc,
      chordJustCompleted: false,
      enemyDamage: 0,
      playerDamage: 0,
      evaluationMissAdded: false,
      firstWrongJustHappened: false,
    };
  }

  const next = cloneAttempt(attempt);
  const nextPressed = new Set(pressedSet);
  nextPressed.add(inputPc);
  next.pressedByChord.set(chordId, nextPressed);

  const completed = isChordCompleted(targetPcs, nextPressed);
  if (completed) {
    next.completedChordIds.add(chordId);
  }

  return {
    attempt: next,
    hitPitchClass: inputPc,
    chordJustCompleted: completed,
    enemyDamage: damage.perCorrectNote,
    playerDamage: 0,
    evaluationMissAdded: false,
    firstWrongJustHappened: false,
  };
};

export const isAllChordsCompleted = (
  phrase: EarTrainingPhrase,
  attempt: EarTrainingChordVoicingAttempt,
): boolean => {
  const chords = phrase.chords ?? [];
  if (chords.length === 0) {
    return false;
  }
  return chords.every(chord => !chordHasVoicingNotes(chord) || attempt.completedChordIds.has(chord.id));
};

export const countChordVoicingMisses = (attempt: EarTrainingChordVoicingAttempt): number => {
  let total = 0;
  attempt.missByChord.forEach(value => {
    total += value;
  });
  return total;
};

export const acknowledgeChordAward = (
  attempt: EarTrainingChordVoicingAttempt,
  chordId: string,
): EarTrainingChordVoicingAttempt => {
  if (attempt.awardedChordIds.has(chordId)) {
    return attempt;
  }
  const next = cloneAttempt(attempt);
  next.awardedChordIds.add(chordId);
  return next;
};
