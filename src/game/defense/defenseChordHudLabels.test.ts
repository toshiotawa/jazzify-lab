import { getDefenseChordHudLabels } from '@/game/defense/defenseChordHudLabels';

describe('getDefenseChordHudLabels', () => {
  it('returns dash labels for empty progression', () => {
    expect(getDefenseChordHudLabels([], 0)).toEqual({ current: '-', next: '-' });
  });

  it('returns current and next chord names', () => {
    expect(getDefenseChordHudLabels(['Cm7', 'F7', 'Bbmaj7'], 1)).toEqual({
      current: 'F7',
      next: 'Bbmaj7',
    });
  });

  it('returns dash for next on last chord', () => {
    expect(getDefenseChordHudLabels(['Cm7', 'F7'], 1)).toEqual({
      current: 'F7',
      next: '-',
    });
  });

  it('clamps out-of-range index', () => {
    expect(getDefenseChordHudLabels(['Cm7'], 5)).toEqual({
      current: 'Cm7',
      next: '-',
    });
    expect(getDefenseChordHudLabels(['Cm7', 'F7'], -2)).toEqual({
      current: 'Cm7',
      next: 'F7',
    });
  });
});
