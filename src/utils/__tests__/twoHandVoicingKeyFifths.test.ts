import { KEY_FIFTHS_BY_MINOR } from '@/utils/twoHandVoicingKeyFifths';

describe('twoHandVoicingKeyFifths', () => {
  it('マイナーキー調号は短3度上のメジャーキーと一致する', () => {
    expect(KEY_FIFTHS_BY_MINOR.Am).toBe(0);
    expect(KEY_FIFTHS_BY_MINOR.Cm).toBe(-3);
    expect(KEY_FIFTHS_BY_MINOR.Dm).toBe(-1);
    expect(KEY_FIFTHS_BY_MINOR.Em).toBe(1);
    expect(KEY_FIFTHS_BY_MINOR['F#m']).toBe(3);
    expect(KEY_FIFTHS_BY_MINOR.Bbm).toBe(-5);
  });
});
