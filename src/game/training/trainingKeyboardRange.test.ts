import { computeTrainingStageMidis } from '@/game/training/trainingKeyboardRange';
import type { TrainingRow } from '@/game/training/trainingTypes';

const baseTraining = (overrides: Partial<TrainingRow>): TrainingRow => ({
  id: 't1',
  categoryId: 'c1',
  slug: 'test',
  titleJa: 'テスト',
  titleEn: 'Test',
  sortOrder: 0,
  kind: 'chord',
  clefMode: 'instrument',
  useKeySignature: false,
  playRootOnCorrect: true,
  bgmUrl: '',
  config: { quality: 'maj', roots: ['C'] },
  isActive: true,
  ...overrides,
});

const piano = {
  notationInstrumentId: 'piano',
  notationOctaveShift: 0,
  ignoreNotationInstrument: true,
} as const;

describe('trainingKeyboardRange', () => {
  it('collects the full note-reading range instead of a single question', () => {
    const midis = computeTrainingStageMidis(
      baseTraining({
        kind: 'note_reading',
        config: { clef: 'treble', includeAccidentals: false },
      }),
      piano,
    );
    expect(Math.min(...midis)).toBe(60);
    expect(Math.max(...midis)).toBe(81);
  });

  it('includes every root of a chord training in the stage range', () => {
    const midis = computeTrainingStageMidis(
      baseTraining({
        kind: 'chord',
        config: { quality: 'maj', roots: ['C', 'G'] },
      }),
      piano,
    );
    const unique = new Set(midis);
    expect(unique.has(72)).toBe(true);
    expect(unique.has(79)).toBe(true);
    expect(unique.has(74)).toBe(true);
  });
});
