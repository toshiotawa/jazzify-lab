import { applyClosedInversion } from '@/game/training/trainingChordInversion';

describe('trainingChordInversion', () => {
  it('returns root position unchanged for inversion 0', () => {
    expect(applyClosedInversion(['C4', 'E4', 'G4'], 0)).toEqual(['C4', 'E4', 'G4']);
  });

  it('builds C major 1st inversion with ascending midis', () => {
    expect(applyClosedInversion(['C4', 'E4', 'G4'], 1)).toEqual(['E4', 'G4', 'C5']);
  });

  it('builds C major 2nd inversion with ascending midis', () => {
    expect(applyClosedInversion(['C4', 'E4', 'G4'], 2)).toEqual(['G4', 'C5', 'E5']);
  });

  it('builds Cmaj7 3rd inversion with B as lowest note', () => {
    const names = applyClosedInversion(['C4', 'E4', 'G4', 'B4'], 3);
    expect(names[0]).toBe('B4');
    expect(names.map((n) => n.replace(/\d+$/, ''))).toEqual(['B', 'C', 'E', 'G']);
  });
});
