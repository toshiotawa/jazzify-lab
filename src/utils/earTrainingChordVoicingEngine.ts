import { Note } from 'tonal';
import type {
  EarTrainingChordVoicingAttempt,
  EarTrainingPhrase,
  EarTrainingPhraseChord,
} from '@/types';
import { resolveChord } from '@/utils/chord-utils';
import {
  midiToPitchClass,
  type EarTrainingDamageConfig,
} from '@/utils/earTrainingEngine';

const MAX_MISSES_PER_CHORD = 5;

export interface ChordVoicingEvaluationResult {
  attempt: EarTrainingChordVoicingAttempt;
  hitPitchClass: number | null;
  chordJustCompleted: boolean;
  rootNoteName: string | null;
  enemyDamage: number;
  playerDamage: number;
  evaluationMissAdded: boolean;
}

const noteNameToPitchClassSafe = (name: string): number | null => {
  const trimmed = name.trim();
  if (!trimmed) {
    return null;
  }
  const chroma = Note.chroma(trimmed);
  return typeof chroma === 'number' ? chroma : null;
};

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

const getRootNoteName = (chord: EarTrainingPhraseChord): string | null => {
  const trimmed = chord.chord_name.trim();
  if (!trimmed) {
    return null;
  }
  const resolved = resolveChord(trimmed, 4);
  if (!resolved) {
    return null;
  }
  return resolved.root || null;
};

export const createChordVoicingAttempt = (phrase: EarTrainingPhrase): EarTrainingChordVoicingAttempt => ({
  phraseId: phrase.id,
  pressedByChord: new Map<string, Set<number>>(),
  missByChord: new Map<string, number>(),
  completedChordIds: new Set<string>(),
  awardedChordIds: new Set<string>(),
  failedChordIds: new Set<string>(),
});

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

export const handleChordVoicingNoteOn = (
  attempt: EarTrainingChordVoicingAttempt,
  activeChord: EarTrainingPhraseChord | null,
  midiNote: number,
  damage: EarTrainingDamageConfig,
): ChordVoicingEvaluationResult => {
  if (!activeChord) {
    return {
      attempt,
      hitPitchClass: null,
      chordJustCompleted: false,
      rootNoteName: null,
      enemyDamage: 0,
      playerDamage: 0,
      evaluationMissAdded: false,
    };
  }

  const chordId = activeChord.id;
  if (attempt.completedChordIds.has(chordId)) {
    return {
      attempt,
      hitPitchClass: null,
      chordJustCompleted: false,
      rootNoteName: null,
      enemyDamage: 0,
      playerDamage: 0,
      evaluationMissAdded: false,
    };
  }

  const targetPcs = getVoicingPitchClasses(activeChord);
  const inputPc = midiToPitchClass(midiNote);
  const pressedSet = attempt.pressedByChord.get(chordId) ?? new Set<number>();
  const isTargetTone = targetPcs.includes(inputPc);

  if (!isTargetTone) {
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
      rootNoteName: null,
      enemyDamage: 0,
      playerDamage: 0,
      evaluationMissAdded,
    };
  }

  if (pressedSet.has(inputPc)) {
    return {
      attempt,
      hitPitchClass: inputPc,
      chordJustCompleted: false,
      rootNoteName: null,
      enemyDamage: 0,
      playerDamage: 0,
      evaluationMissAdded: false,
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
    rootNoteName: completed ? getRootNoteName(activeChord) : null,
    enemyDamage: damage.perCorrectNote,
    playerDamage: 0,
    evaluationMissAdded: false,
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
  return chords.every(chord => attempt.completedChordIds.has(chord.id));
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
