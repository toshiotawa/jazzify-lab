import { jpyAmountToApproxUsdWhole, parseFrankfurterJpyUsdRate } from '@/utils/jpyToUsdApprox';

describe('jpyAmountToApproxUsdWhole', () => {
  it('rounds JPY to USD using per-yen rate', () => {
    expect(jpyAmountToApproxUsdWhole(4980, 0.0067)).toBe(33);
  });

  it('handles zero JPY', () => {
    expect(jpyAmountToApproxUsdWhole(0, 0.0067)).toBe(0);
  });
});

describe('parseFrankfurterJpyUsdRate', () => {
  it('parses a valid Frankfurter response', () => {
    expect(
      parseFrankfurterJpyUsdRate({
        amount: 1,
        base: 'JPY',
        date: '2026-06-11',
        rates: { USD: 0.0063 },
      }),
    ).toBe(0.0063);
  });

  it('returns null for null input', () => {
    expect(parseFrankfurterJpyUsdRate(null)).toBeNull();
  });

  it('returns null when USD is missing', () => {
    expect(parseFrankfurterJpyUsdRate({ rates: {} })).toBeNull();
  });

  it('returns null when USD is not a number', () => {
    expect(parseFrankfurterJpyUsdRate({ rates: { USD: 'x' } })).toBeNull();
  });

  it('returns null when USD is zero', () => {
    expect(parseFrankfurterJpyUsdRate({ rates: { USD: 0 } })).toBeNull();
  });

  it('returns null when USD is NaN', () => {
    expect(parseFrankfurterJpyUsdRate({ rates: { USD: Number.NaN } })).toBeNull();
  });
});
