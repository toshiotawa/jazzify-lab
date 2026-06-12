import {
  buildLemonVariantIdLists,
  noTrialVariantForPlanCode,
  planCodeForVariantId,
  resolveCheckoutVariants,
  isTrialVariant,
} from '../../netlify/functions/lib/lemonPlanCatalog';

describe('resolveCheckoutVariants', () => {
  const env = {
    premium: '10',
    premiumTrial: '11',
    premiumYearly: '20',
    premiumYearlyTrial: '21',
  };

  it('returns trial variants when trial eligible', () => {
    expect(resolveCheckoutVariants(true, env)).toEqual({
      monthlyVariantId: '11',
      yearlyVariantId: '21',
    });
  });

  it('returns no-trial variants when trial not eligible', () => {
    expect(resolveCheckoutVariants(false, env)).toEqual({
      monthlyVariantId: '10',
      yearlyVariantId: '20',
    });
  });
});

describe('planCodeForVariantId', () => {
  const env = {
    premium: '10',
    premiumTrial: '11',
    premiumYearly: '20',
    premiumYearlyTrial: '21',
  };

  it('maps variant IDs to plan codes', () => {
    expect(planCodeForVariantId('10', env)).toBe('core_monthly');
    expect(planCodeForVariantId('20', env)).toBe('core_yearly');
    expect(planCodeForVariantId('999', env)).toBeNull();
  });
});

describe('noTrialVariantForPlanCode', () => {
  const env = { premium: '10', premiumYearly: '20' };

  it('returns no-trial variant for each plan code', () => {
    expect(noTrialVariantForPlanCode('core_monthly', env)).toBe('10');
    expect(noTrialVariantForPlanCode('core_yearly', env)).toBe('20');
  });
});

describe('isTrialVariant', () => {
  const env = { premiumTrial: '11', premiumYearlyTrial: '21', premium: '10' };

  it('detects trial variants', () => {
    expect(isTrialVariant('11', env)).toBe(true);
    expect(isTrialVariant('10', env)).toBe(false);
  });
});

describe('buildLemonVariantIdLists', () => {
  it('collects all configured IDs', () => {
    const lists = buildLemonVariantIdLists({
      premium: '10',
      premiumTrial: '11',
      premiumYearly: '20',
      premiumYearlyTrial: '21',
    });
    expect(lists.noTrialMonthlyVariantId).toBe('10');
    expect(lists.noTrialYearlyVariantId).toBe('20');
    expect(lists.trialVariantIds).toEqual(['11', '21']);
  });
});
