import {
  buildLemonVariantIdLists,
  planCodeForLemonVariant,
} from '../../netlify/functions/lib/lemonVariantPlanCode';

describe('planCodeForLemonVariant', () => {
  const monthlyIds = ['1001', '1002'];
  const yearlyIds = ['2001', '2002'];

  it('maps monthly variant IDs to core_monthly', () => {
    expect(planCodeForLemonVariant('1001', yearlyIds, monthlyIds)).toBe('core_monthly');
    expect(planCodeForLemonVariant(1002, yearlyIds, monthlyIds)).toBe('core_monthly');
  });

  it('maps yearly variant IDs to core_yearly', () => {
    expect(planCodeForLemonVariant('2001', yearlyIds, monthlyIds)).toBe('core_yearly');
    expect(planCodeForLemonVariant(2002, yearlyIds, monthlyIds)).toBe('core_yearly');
  });

  it('returns null for unknown variant IDs', () => {
    expect(planCodeForLemonVariant('9999', yearlyIds, monthlyIds)).toBeNull();
    expect(planCodeForLemonVariant(null, yearlyIds, monthlyIds)).toBeNull();
    expect(planCodeForLemonVariant(undefined, yearlyIds, monthlyIds)).toBeNull();
  });
});

describe('buildLemonVariantIdLists', () => {
  it('collects configured variant IDs from env-like object', () => {
    const lists = buildLemonVariantIdLists({
      premium: '10',
      premiumTrial: '11',
      premiumYearly: '20',
      premiumYearlyTrial: '21',
      standardGlobal: '12',
      standardGlobalTrial: '13',
    });
    expect(lists.monthlyVariantIds).toEqual(['10', '11', '12', '13']);
    expect(lists.yearlyVariantIds).toEqual(['20', '21']);
  });

  it('filters empty values', () => {
    const lists = buildLemonVariantIdLists({
      premium: '10',
      premiumYearly: '20',
    });
    expect(lists.monthlyVariantIds).toEqual(['10']);
    expect(lists.yearlyVariantIds).toEqual(['20']);
  });
});
