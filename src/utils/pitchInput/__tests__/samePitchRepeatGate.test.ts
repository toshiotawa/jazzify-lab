import {
  isTooSoonForSamePitchRepeat,
  minIntervalMsForEighthNote,
  minIntervalMsForWrittenSpacing,
} from '@/utils/pitchInput/samePitchRepeatGate';

describe('samePitchRepeatGate', () => {
  it('rejects same pitch class within min interval', () => {
    expect(isTooSoonForSamePitchRepeat(5, 5, 1000, 1050, 100)).toBe(true);
  });

  it('accepts same pitch class after min interval', () => {
    expect(isTooSoonForSamePitchRepeat(5, 5, 1000, 1100, 100)).toBe(false);
  });

  it('does not gate different pitch classes', () => {
    expect(isTooSoonForSamePitchRepeat(0, 5, 1000, 1010, 100)).toBe(false);
  });

  it('does not gate when no prior acceptance', () => {
    expect(isTooSoonForSamePitchRepeat(5, null, null, 1000, 100)).toBe(false);
  });

  it('computes eighth-note half interval from bpm', () => {
    expect(minIntervalMsForEighthNote(160)).toBeCloseTo(93.75, 2);
  });

  it('computes written spacing half interval', () => {
    expect(minIntervalMsForWrittenSpacing(1.0, 1.1875)).toBeCloseTo(93.75, 2);
  });
});
