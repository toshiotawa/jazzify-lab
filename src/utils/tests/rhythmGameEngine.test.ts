import { RhythmGameEngine } from '@/utils/rhythmGameEngine';

const dummyStage = {
  bpm: 120,
  timeSignature: 4,
  measureCount: 8,
  countInMeasures: 1,
  rhythmType: 'random',
  allowedChords: ['C', 'G', 'Am', 'F']
};

test('generated questions have normalized notesNeeded', () => {
  const engine = new RhythmGameEngine(dummyStage, {
    onAttackSuccess: jest.fn(),
    onAttackFail: jest.fn(),
    onStateUpdate: jest.fn()
  });

  engine['allQuestions'].forEach(q => {
    q.notesNeeded.forEach((n: number) => {
      expect(n).toBeGreaterThanOrEqual(0);
      expect(n).toBeLessThanOrEqual(11);
    });
  });
});