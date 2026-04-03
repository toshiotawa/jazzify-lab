import { jpyAmountToApproxUsdWhole } from '@/utils/jpyToUsdApprox';

describe('jpyAmountToApproxUsdWhole', () => {
  it('rounds JPY to USD using per-yen rate', () => {
    expect(jpyAmountToApproxUsdWhole(4980, 0.0067)).toBe(33);
  });

  it('handles zero JPY', () => {
    expect(jpyAmountToApproxUsdWhole(0, 0.0067)).toBe(0);
  });
});
