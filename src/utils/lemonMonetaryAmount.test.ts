import {
  coerceStoredAmountToMajorUnits,
  formatInvoiceAmountLabel,
  isLikelyLemonCentScaleAmount,
  normalizeLemonAmountToMajorUnits,
} from '../../netlify/functions/lib/lemonMonetaryAmount';

describe('normalizeLemonAmountToMajorUnits', () => {
  it('converts Lemon JPY minor units to yen', () => {
    expect(normalizeLemonAmountToMajorUnits(397979)).toBe(3980);
    expect(normalizeLemonAmountToMajorUnits(3480018)).toBe(34800);
  });

  it('returns null for invalid input', () => {
    expect(normalizeLemonAmountToMajorUnits(null)).toBeNull();
    expect(normalizeLemonAmountToMajorUnits(undefined)).toBeNull();
  });
});

describe('formatInvoiceAmountLabel', () => {
  it('formats JPY with ja-JP grouping', () => {
    expect(formatInvoiceAmountLabel(3980, 'JPY')).toBe('¥3,980');
    expect(formatInvoiceAmountLabel(34800, 'JPY')).toBe('¥34,800');
  });
});

describe('coerceStoredAmountToMajorUnits', () => {
  it('fixes legacy cent-scale rows on read', () => {
    expect(coerceStoredAmountToMajorUnits(397979)).toBe(3980);
  });

  it('leaves already-normalized yen unchanged', () => {
    expect(coerceStoredAmountToMajorUnits(3980)).toBe(3980);
    expect(coerceStoredAmountToMajorUnits(34800)).toBe(34800);
  });

  it('detects cent-scale totals', () => {
    expect(isLikelyLemonCentScaleAmount(397979)).toBe(true);
    expect(isLikelyLemonCentScaleAmount(34800)).toBe(false);
  });
});
