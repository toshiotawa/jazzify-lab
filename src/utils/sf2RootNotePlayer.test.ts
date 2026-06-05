import { pickSf2ZoneForMidi, resolveSf2PlaybackRate } from './sf2RootNotePlayer';

describe('sf2RootNotePlayer', () => {
  it('resolveSf2PlaybackRate は半音上を 12平均律の比率にする', () => {
    expect(resolveSf2PlaybackRate(37, 36, 0, 0, 0)).toBeCloseTo(Math.pow(2, 1 / 12), 8);
  });

  it('resolveSf2PlaybackRate はチューニング補正を cents として反映する', () => {
    expect(resolveSf2PlaybackRate(36, 36, 1, 50, 0)).toBeCloseTo(Math.pow(2, 150 / 1200), 8);
  });

  it('pickSf2ZoneForMidi は対象音を含む最も狭いレンジを優先する', () => {
    const wide = { keyRange: [0, 127] as const, rootMidi: 36 };
    const narrow = { keyRange: [36, 40] as const, rootMidi: 38 };
    expect(pickSf2ZoneForMidi([wide, narrow], 37)).toBe(narrow);
  });

  it('pickSf2ZoneForMidi はレンジ外なら null を返す', () => {
    expect(pickSf2ZoneForMidi([{ keyRange: [48, 60] as const, rootMidi: 48 }], 36)).toBeNull();
  });
});
