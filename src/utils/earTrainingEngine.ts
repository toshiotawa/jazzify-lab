import { Note } from 'tonal';
import type {
  EarTrainingPhrase,
  EarTrainingPhraseAttempt,
  EarTrainingPhraseNote,
  EarTrainingRank,
} from '@/types';

export interface EarTrainingDamageConfig {
  perCorrectNote: number;
  good: number;
  great: number;
  perfect: number;
  miss: number;
  fail: number;
}

export interface EarTrainingRankRule {
  perfectMaxMisses: number;
  greatMaxMisses: number;
}

export interface EarTrainingInputResult {
  attempt: EarTrainingPhraseAttempt;
  correct: boolean;
  completed: boolean;
  revealedNote?: string;
  enemyDamage: number;
  playerDamage: number;
  evaluationMissAdded: boolean;
}

export type EarTrainingOutcome =
  | 'stageClear'
  | 'gameOver'
  | 'timeUp'
  | 'phraseComplete'
  | 'phraseFail'
  | 'input';

const NOTE_NAMES_BY_PITCH_CLASS = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
const MAX_MISSES_PER_NOTE = 5;

export const midiToPitchClass = (midiNote: number): number => {
  const rounded = Math.round(midiNote);
  return ((rounded % 12) + 12) % 12;
};

export const noteNameToPitchClass = (noteName: string): number | null => {
  const chroma = Note.chroma(noteName);
  return typeof chroma === 'number' ? chroma : null;
};

export const getDisplayNoteName = (note: EarTrainingPhraseNote): string => {
  if (note.note_name.trim().length > 0) {
    return note.note_name.replace(/\d+$/, '');
  }
  return NOTE_NAMES_BY_PITCH_CLASS[note.pitch_class] ?? '?';
};

export const isMatchingPitchClass = (expected: EarTrainingPhraseNote, inputMidiNote: number): boolean => {
  const expectedPitchClass = noteNameToPitchClass(expected.note_name) ?? expected.pitch_class;
  return expectedPitchClass === midiToPitchClass(inputMidiNote);
};

export const createPhraseAttempt = (phrase: EarTrainingPhrase, audioTime = 0): EarTrainingPhraseAttempt => ({
  phraseId: phrase.id,
  currentNoteIndex: 0,
  revealedNotes: [],
  missedNoteCounts: new Map<number, number>(),
  startedAtAudioTime: audioTime,
  completed: false,
  failed: false,
});

export const calculateEarTrainingRank = (
  missedNoteCounts: Map<number, number>,
  rankRule: EarTrainingRankRule,
): EarTrainingRank => {
  const missCount = Array.from(missedNoteCounts.values()).reduce((total, count) => total + count, 0);
  if (missCount <= rankRule.perfectMaxMisses) {
    return 'Perfect';
  }
  if (missCount <= rankRule.greatMaxMisses) {
    return 'Great';
  }
  return 'Good';
};

export const getCompletionDamage = (rank: EarTrainingRank, damage: EarTrainingDamageConfig): number => {
  if (rank === 'Perfect') {
    return damage.perfect;
  }
  if (rank === 'Great') {
    return damage.great;
  }
  if (rank === 'Good') {
    return damage.good;
  }
  return 0;
};

export const mapEarTrainingRankToLessonRank = (rank: EarTrainingRank): 'S' | 'A' | 'B' | 'C' => {
  if (rank === 'Perfect') {
    return 'S';
  }
  if (rank === 'Great') {
    return 'A';
  }
  if (rank === 'Good') {
    return 'B';
  }
  return 'C';
};

export const handleEarTrainingNoteInput = (
  phrase: EarTrainingPhrase,
  attempt: EarTrainingPhraseAttempt,
  inputMidiNote: number,
  damage: EarTrainingDamageConfig,
): EarTrainingInputResult => {
  const notes = phrase.notes ?? [];
  const expected = notes[attempt.currentNoteIndex];

  if (!expected || attempt.completed || attempt.failed) {
    return {
      attempt,
      correct: false,
      completed: attempt.completed,
      enemyDamage: 0,
      playerDamage: 0,
      evaluationMissAdded: false,
    };
  }

  if (isMatchingPitchClass(expected, inputMidiNote)) {
    const revealedNote = getDisplayNoteName(expected);
    const nextIndex = attempt.currentNoteIndex + 1;
    const completed = nextIndex >= notes.length;

    return {
      attempt: {
        ...attempt,
        currentNoteIndex: nextIndex,
        revealedNotes: [...attempt.revealedNotes, revealedNote],
        completed,
      },
      correct: true,
      completed,
      revealedNote,
      enemyDamage: damage.perCorrectNote,
      playerDamage: 0,
      evaluationMissAdded: false,
    };
  }

  const noteIndex = attempt.currentNoteIndex;
  const missedNoteCounts = new Map(attempt.missedNoteCounts);
  const currentMissCount = missedNoteCounts.get(noteIndex) ?? 0;
  const evaluationMissAdded = currentMissCount < MAX_MISSES_PER_NOTE;

  if (evaluationMissAdded) {
    missedNoteCounts.set(noteIndex, currentMissCount + 1);
  }

  return {
    attempt: {
      ...attempt,
      missedNoteCounts,
    },
    correct: false,
    completed: false,
    enemyDamage: 0,
    playerDamage: evaluationMissAdded ? damage.miss : 0,
    evaluationMissAdded,
  };
};

export const resolveEarTrainingOutcome = (state: {
  enemyHp: number;
  playerHp: number;
  timeRemainingSec: number;
  phraseCompleted: boolean;
  phraseFailed: boolean;
}): EarTrainingOutcome => {
  if (state.enemyHp <= 0) {
    return 'stageClear';
  }
  if (state.playerHp <= 0) {
    return 'gameOver';
  }
  if (state.timeRemainingSec <= 0) {
    return 'timeUp';
  }
  if (state.phraseCompleted) {
    return 'phraseComplete';
  }
  if (state.phraseFailed) {
    return 'phraseFail';
  }
  return 'input';
};

export const getNextMeasureDelaySec = (
  currentAudioTimeSec: number,
  loopDurationSec: number,
  loopMeasures: number,
): number => {
  const measureDurationSec = loopDurationSec / Math.max(1, loopMeasures);
  const positionInMeasure = currentAudioTimeSec % measureDurationSec;
  const delay = measureDurationSec - positionInMeasure;
  return delay < 0.05 ? 0.05 : delay;
};
