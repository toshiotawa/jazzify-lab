import { restoreConcertMidi } from '@/utils/pitchInput/pitchShiftRestore';

describe('restoreConcertMidi', () => {
  it('subtracts shift semitones from valid model output', () => {
    expect(restoreConcertMidi(48, 12)).toBe(36);
    expect(restoreConcertMidi(60, 24)).toBe(36);
    expect(restoreConcertMidi(60, 0)).toBe(60);
  });

  it('returns null for invalid values', () => {
    expect(restoreConcertMidi(0, 12)).toBeNull();
    expect(restoreConcertMidi(Number.NaN, 12)).toBeNull();
    expect(restoreConcertMidi(10, 12)).toBeNull();
  });
});
