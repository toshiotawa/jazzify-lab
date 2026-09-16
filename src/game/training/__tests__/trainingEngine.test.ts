import {
  evaluateTrainingNoteOn,
  getTrainingKeyboardHintMidis,
  getTrainingKeyboardReferenceMidis,
  getTrainingSequentialKeyboardHints,
  performTrainingDefeat,
  shouldPlayTrainingRootOnCorrect,
  shouldUseTrainingSequentialKeyboardHints,
  tickTrainingEnemy,
  tickTrainingTimer,
} from '@/game/training/trainingEngine';
import { createInitialTrainingRuntime } from '@/game/training/trainingQuestionBuilder';
import type { TrainingQuestion } from '@/game/training/trainingTypes';

const makeQuestion = (overrides?: Partial<TrainingQuestion>): TrainingQuestion => ({
  questionKey: 'test',
  promptLabel: 'Test',
  notes: [
    { noteName: 'C4', midi: 60, pitchClass: 0, staff: 1, isTarget: true },
    { noteName: 'E4', midi: 64, pitchClass: 4, staff: 1, isTarget: true },
    { noteName: 'G4', midi: 67, pitchClass: 7, staff: 1, isTarget: true },
  ],
  layout: 'stacked',
  ordered: false,
  keyFifths: 0,
  rootMidi: 60,
  ...overrides,
});

describe('trainingEngine', () => {
  it('shouldPlayTrainingRootOnCorrect is true only for completed chord/voicing with rootMidi', () => {
    expect(shouldPlayTrainingRootOnCorrect('chord', true, true, 48)).toBe(true);
    expect(shouldPlayTrainingRootOnCorrect('voicing', true, true, 35)).toBe(true);
    expect(shouldPlayTrainingRootOnCorrect('chord', true, false, 48)).toBe(false);
    expect(shouldPlayTrainingRootOnCorrect('chord', false, true, 48)).toBe(false);
    expect(shouldPlayTrainingRootOnCorrect('chord', true, true, null)).toBe(false);
    expect(shouldPlayTrainingRootOnCorrect('note_reading', true, true, 60)).toBe(false);
    expect(shouldPlayTrainingRootOnCorrect('interval', true, true, 60)).toBe(false);
    expect(shouldPlayTrainingRootOnCorrect('scale', true, true, 60)).toBe(false);
  });

  it('accepts chord notes in any order when not sequential', () => {
    const q = makeQuestion();
    const first = evaluateTrainingNoteOn(q, [], 67, false);
    expect(first.accepted).toBe(true);
    const second = evaluateTrainingNoteOn(q, first.newCorrectIndices, 60, false);
    expect(second.accepted).toBe(true);
  });

  it('requires ordered inversion chord input bottom to top', () => {
    const q = makeQuestion({
      ordered: true,
      notes: [
        { noteName: 'E4', midi: 64, pitchClass: 4, staff: 1, isTarget: true },
        { noteName: 'G4', midi: 67, pitchClass: 7, staff: 1, isTarget: true },
        { noteName: 'C5', midi: 72, pitchClass: 0, staff: 1, isTarget: true },
      ],
    });
    const wrong = evaluateTrainingNoteOn(q, [], 67, false);
    expect(wrong.accepted).toBe(false);
    const first = evaluateTrainingNoteOn(q, [], 64, false);
    expect(first.accepted).toBe(true);
    const second = evaluateTrainingNoteOn(q, first.newCorrectIndices, 67, false);
    expect(second.accepted).toBe(true);
    const third = evaluateTrainingNoteOn(q, second.newCorrectIndices, 72, false);
    expect(third.completed).toBe(true);
  });

  it('requires ordered scale input left to right', () => {
    const q = makeQuestion({
      ordered: true,
      notes: [
        { noteName: 'C4', midi: 60, pitchClass: 0, staff: 1, isTarget: true },
        { noteName: 'D4', midi: 62, pitchClass: 2, staff: 1, isTarget: true },
      ],
      layout: 'horizontal',
    });
    const wrong = evaluateTrainingNoteOn(q, [], 62, false);
    expect(wrong.accepted).toBe(false);
    const right = evaluateTrainingNoteOn(q, [], 60, false);
    expect(right.accepted).toBe(true);
  });

  it('ignores wrong notes', () => {
    const q = makeQuestion();
    const wrong = evaluateTrainingNoteOn(q, [], 61, false);
    expect(wrong.accepted).toBe(false);
    expect(wrong.completed).toBe(false);
  });

  it('activates dying slot and spawns next enemy immediately on defeat', () => {
    const runtime = createInitialTrainingRuntime();
    performTrainingDefeat(runtime, 1.5, 1);
    expect(runtime.dyingEnemy.active).toBe(true);
    expect(runtime.dyingEnemy.typeIndex).toBe(0);
    expect(runtime.dyingEnemy.alpha).toBe(1);
    expect(runtime.dyingEnemy.offsetX).toBe(0);
    expect(runtime.dyingEnemy.slashUntilSec).toBeGreaterThan(1.5);
    expect(runtime.enemy.slashUntilSec).toBe(0);
    expect(runtime.guardPoseUntilSec).toBeCloseTo(2.5);
    expect(runtime.enemy.typeIndex).toBe(1);
    expect(runtime.enemy.fadeAlpha).toBe(1);
  });

  it('fades dying enemy and deactivates when alpha reaches zero', () => {
    const runtime = createInitialTrainingRuntime();
    performTrainingDefeat(runtime, 1.5, 0);
    tickTrainingEnemy(runtime, 1.6, 0.5);
    expect(runtime.dyingEnemy.alpha).toBeLessThan(1);
    expect(runtime.dyingEnemy.offsetX).toBeGreaterThan(0);
    tickTrainingEnemy(runtime, 2.0, 0.5);
    expect(runtime.dyingEnemy.active).toBe(false);
  });

  it('advances elapsedSec in practice mode without finishing when durationSec is infinite', () => {
    const runtime = createInitialTrainingRuntime();
    runtime.durationSec = Number.POSITIVE_INFINITY;
    runtime.elapsedSec = 0;
    const finished = tickTrainingTimer(runtime, 0.5);
    expect(finished).toBe(false);
    expect(runtime.result).toBe('playing');
    expect(runtime.elapsedSec).toBeCloseTo(0.5);
  });

  it('uses sequential keyboard hints for ordered inversions and voice input', () => {
    const ordered = makeQuestion({
      ordered: true,
      notes: [
        { noteName: 'E4', midi: 64, pitchClass: 4, staff: 1, isTarget: true },
        { noteName: 'G4', midi: 67, pitchClass: 7, staff: 1, isTarget: true },
        { noteName: 'C5', midi: 72, pitchClass: 0, staff: 1, isTarget: true },
      ],
    });
    expect(shouldUseTrainingSequentialKeyboardHints(ordered, 'chord', false)).toBe(true);
    expect(getTrainingSequentialKeyboardHints(ordered, [], false)).toEqual({
      nextMidi: 64,
      pendingMidis: [67, 72],
      completedMidis: [],
    });
    expect(getTrainingSequentialKeyboardHints(ordered, [0], false)).toEqual({
      nextMidi: 67,
      pendingMidis: [72],
      completedMidis: [64],
    });

    const chord = makeQuestion();
    expect(shouldUseTrainingSequentialKeyboardHints(chord, 'chord', true)).toBe(true);
    expect(getTrainingSequentialKeyboardHints(chord, [], true)).toEqual({
      nextMidi: 60,
      pendingMidis: [64, 67],
      completedMidis: [],
    });
    expect(getTrainingSequentialKeyboardHints(chord, [0], true)).toEqual({
      nextMidi: 64,
      pendingMidis: [67],
      completedMidis: [60],
    });
  });

  it('keeps interval keyboard hints non-sequential even with voice input', () => {
    const interval = makeQuestion({
      notes: [
        { noteName: 'C4', midi: 60, pitchClass: 0, staff: 1, isTarget: false },
        { noteName: 'E4', midi: 64, pitchClass: 4, staff: 1, isTarget: true },
      ],
    });
    expect(shouldUseTrainingSequentialKeyboardHints(interval, 'interval', true)).toBe(false);
  });

  it('completes grouped voicings sequentially and scores per voicing', () => {
    const q = makeQuestion({
      layout: 'grouped',
      scorePerVoicing: true,
      playRootOnFirstCorrect: true,
      voicingGroupCount: 2,
      promptLabel: 'Cm7',
      notes: [
        { noteName: 'D3', midi: 50, pitchClass: 2, staff: 2, isTarget: true, groupIndex: 0 },
        { noteName: 'G3', midi: 55, pitchClass: 7, staff: 2, isTarget: true, groupIndex: 0 },
        { noteName: 'Bb3', midi: 58, pitchClass: 10, staff: 2, isTarget: true, groupIndex: 0 },
        { noteName: 'F4', midi: 65, pitchClass: 5, staff: 1, isTarget: true, groupIndex: 0 },
        { noteName: 'C3', midi: 48, pitchClass: 0, staff: 2, isTarget: true, groupIndex: 1 },
        { noteName: 'Eb4', midi: 63, pitchClass: 3, staff: 1, isTarget: true, groupIndex: 1 },
      ],
    });
    const first = evaluateTrainingNoteOn(q, [], 50, false);
    expect(first.accepted).toBe(true);
    expect(first.voicingCompleted).toBe(false);
    expect(first.matchedGroupIndex).toBe(0);

    const groupOneDone = evaluateTrainingNoteOn(q, [0, 1, 2], 65, false);
    expect(groupOneDone.voicingCompleted).toBe(true);
    expect(groupOneDone.completed).toBe(false);

    const wrongGroup = evaluateTrainingNoteOn(q, [0, 1, 2, 3], 48, false);
    expect(wrongGroup.accepted).toBe(true);
    expect(wrongGroup.voicingCompleted).toBe(false);

    const allDone = evaluateTrainingNoteOn(q, [0, 1, 2, 3, 4], 63, false);
    expect(allDone.voicingCompleted).toBe(true);
    expect(allDone.completed).toBe(true);
  });

  it('highlights interval reference keys in both modes and target keys only in practice', () => {
    const q = makeQuestion({
      notes: [
        { noteName: 'C4', midi: 60, pitchClass: 0, staff: 1, isTarget: false },
        { noteName: 'E4', midi: 64, pitchClass: 4, staff: 1, isTarget: true },
      ],
    });
    expect(getTrainingKeyboardReferenceMidis(q)).toEqual([60]);
    expect(getTrainingKeyboardHintMidis(q, [], true)).toEqual([64]);
    expect(getTrainingKeyboardHintMidis(q, [], false)).toEqual([]);
    expect(getTrainingKeyboardHintMidis(q, [1], true)).toEqual([]);
  });
});
