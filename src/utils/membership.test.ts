import { calculateXP, type XPCalcParams } from '@/utils/xpCalculator';
import { getMembershipLabel, normalizeMembershipTier } from '@/utils/membership';

describe('membership coaching rank', () => {
  it('normalizes coaching as premium tier', () => {
    expect(normalizeMembershipTier('coaching')).toBe('premium');
  });

  it('returns coaching labels', () => {
    expect(getMembershipLabel('coaching', 'ja')).toBe('コーチング');
    expect(getMembershipLabel('coaching', 'en')).toBe('Coaching');
  });

  it('applies premium xp multiplier for coaching', () => {
    const params: XPCalcParams = {
      membershipRank: 'coaching',
      scoreRank: 'S',
      playbackSpeed: 1,
      transposed: false,
    };
    expect(calculateXP(params)).toBe(1500);
  });
});
