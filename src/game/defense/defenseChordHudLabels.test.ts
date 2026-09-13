import { getDefenseChordHudLabels } from '@/game/defense/defenseChordHudLabels';

describe('getDefenseChordHudLabels', () => {
  it('returns dash label for empty progression', () => {
    expect(getDefenseChordHudLabels([], 0)).toEqual({ current: '-' });
  });

  it('returns current chord name', () => {
    expect(getDefenseChordHudLabels(['Cm7', 'F7', 'Bbmaj7'], 1)).toEqual({
      current: 'F7',
    });
  });

  it('clamps out-of-range index', () => {
    expect(getDefenseChordHudLabels(['Cm7'], 5)).toEqual({
      current: 'Cm7',
    });
    expect(getDefenseChordHudLabels(['Cm7', 'F7'], -2)).toEqual({
      current: 'Cm7',
    });
  });
});
