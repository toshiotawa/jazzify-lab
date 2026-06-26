import {
  KEY_FIFTHS_BY_MINOR,
  keyFifthsForBVII7,
  keyFifthsForIIm7b5,
  keyFifthsForIm7,
  keyFifthsForMinorV7Alt,
} from '@/utils/twoHandVoicingKeyFifths';

describe('twoHandVoicingKeyFifths', () => {
  it('マイナーキー調号は短3度上のメジャーキーと一致する', () => {
    expect(KEY_FIFTHS_BY_MINOR.Am).toBe(0);
    expect(KEY_FIFTHS_BY_MINOR.Cm).toBe(-3);
    expect(KEY_FIFTHS_BY_MINOR.Dm).toBe(-1);
    expect(KEY_FIFTHS_BY_MINOR.Em).toBe(1);
    expect(KEY_FIFTHS_BY_MINOR['F#m']).toBe(3);
    expect(KEY_FIFTHS_BY_MINOR.Bbm).toBe(-5);
  });

  it('Im7 は各マイナーキーの tonic 調号', () => {
    expect(keyFifthsForIm7('Cm7')).toBe(-3);
    expect(keyFifthsForIm7('Am7')).toBe(0);
  });

  it('IIm7b5 は親メジャーキーの ii 調号', () => {
    expect(keyFifthsForIIm7b5('Am7b5')).toBe(1);
    expect(keyFifthsForIIm7b5('Dm7b5')).toBe(0);
  });

  it('bVII7 は親メジャーキーの ♭VII 調号', () => {
    expect(keyFifthsForBVII7('C7')).toBe(2);
    expect(keyFifthsForBVII7('B7')).toBe(-5);
  });

  it('V7alt は解決先マイナーキーの V7 調号', () => {
    expect(keyFifthsForMinorV7Alt('G7alt')).toBe(-3);
    expect(keyFifthsForMinorV7Alt('C7alt')).toBe(-4);
  });
});
