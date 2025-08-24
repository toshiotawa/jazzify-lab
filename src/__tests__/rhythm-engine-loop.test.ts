import { _testHelpers } from '@/engines/RhythmGameEngine';

describe('loop note generation', () => {
  const engine = _testHelpers.makeEngine({
    mode: 'random',
    bpm: 120,
    timeSig: 4,
    measureCount: 8,
    countIn: 1,
    allowedChords: ['C', 'G'],
  });
  it('spawnAt is monotonically increasing over two loops', () => {
    const n0 = engine.generateNotes(0);
    const n1 = engine.generateNotes(1);
    expect(n1[0].spawnAt).toBeGreaterThan(n0[7].spawnAt);
  });
});