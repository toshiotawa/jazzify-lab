import { evaluateTrainingNoteOn, performTrainingDefeat, tickTrainingEnemy } from '@/game/training/trainingEngine';
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
  it('accepts chord notes in any order when not sequential', () => {
    const q = makeQuestion();
    const first = evaluateTrainingNoteOn(q, [], 67, false);
    expect(first.accepted).toBe(true);
    const second = evaluateTrainingNoteOn(q, first.newCorrectIndices, 60, false);
    expect(second.accepted).toBe(true);
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
});
