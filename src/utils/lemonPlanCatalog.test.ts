import {
  buildCombinedLemonVariantIdLists,
  buildLemonVariantIdLists,
  currencyForVariantId,
  noTrialVariantForPlanCode,
  planCodeForVariantId,
  planCodeForVariantIdAnyStore,
  resolveCheckoutVariants,
  isTrialVariant,
  isTrialVariantAnyStore,
} from '../../netlify/functions/lib/lemonPlanCatalog';

describe('resolveCheckoutVariants', () => {
  const env = {
    premium: '10',
    premiumTrial: '11',
    premiumYearly: '20',
    premiumYearlyTrial: '21',
  };

  const usdEnv = {
    premium: '110',
    premiumTrial: '111',
    premiumYearly: '120',
    premiumYearlyTrial: '121',
  };

  it('returns trial variants when trial eligible', () => {
    expect(resolveCheckoutVariants(true, 'JPY', env)).toEqual({
      monthlyVariantId: '11',
      yearlyVariantId: '21',
    });
  });

  it('returns no-trial variants when trial not eligible', () => {
    expect(resolveCheckoutVariants(false, 'JPY', env)).toEqual({
      monthlyVariantId: '10',
      yearlyVariantId: '20',
    });
  });

  it('returns USD variants for USD currency', () => {
    expect(resolveCheckoutVariants(false, 'USD', usdEnv)).toEqual({
      monthlyVariantId: '110',
      yearlyVariantId: '120',
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

describe('planCodeForVariantIdAnyStore', () => {
  it('maps USD variant IDs when passed as env', () => {
    const usdEnv = { premium: '110', premiumYearly: '120' };
    expect(planCodeForVariantId('110', usdEnv)).toBe('core_monthly');
    expect(planCodeForVariantIdAnyStore('110')).toBeNull();
  });
});

describe('currencyForVariantId', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    process.env = {
      ...originalEnv,
      LEMONSQUEEZY_VARIANT_ID_PREMIUM: '10',
      LEMONSQUEEZY_VARIANT_ID_PREMIUM_YEARLY: '20',
      LEMONSQUEEZY_VARIANT_ID_PREMIUM_USD: '110',
      LEMONSQUEEZY_VARIANT_ID_PREMIUM_YEARLY_USD: '120',
    };
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  it('detects store currency from variant id', () => {
    expect(currencyForVariantId('10')).toBe('JPY');
    expect(currencyForVariantId('110')).toBe('USD');
    expect(currencyForVariantId('999')).toBeNull();
  });
});

describe('noTrialVariantForPlanCode', () => {
  const env = { premium: '10', premiumYearly: '20' };
  const usdEnv = { premium: '110', premiumYearly: '120' };

  it('returns no-trial variant for each plan code', () => {
    expect(noTrialVariantForPlanCode('core_monthly', 'JPY', env)).toBe('10');
    expect(noTrialVariantForPlanCode('core_yearly', 'JPY', env)).toBe('20');
    expect(noTrialVariantForPlanCode('core_monthly', 'USD', usdEnv)).toBe('110');
    expect(noTrialVariantForPlanCode('core_yearly', 'USD', usdEnv)).toBe('120');
  });
});

describe('isTrialVariant', () => {
  const env = { premiumTrial: '11', premiumYearlyTrial: '21', premium: '10' };

  it('detects trial variants', () => {
    expect(isTrialVariant('11', env)).toBe(true);
    expect(isTrialVariant('10', env)).toBe(false);
  });
});

describe('isTrialVariantAnyStore', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    process.env = {
      ...originalEnv,
      LEMONSQUEEZY_VARIANT_ID_PREMIUM_TRIAL: '11',
      LEMONSQUEEZY_VARIANT_ID_PREMIUM_TRIAL_USD: '111',
    };
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  it('detects trial variants across stores', () => {
    expect(isTrialVariantAnyStore('111')).toBe(true);
    expect(isTrialVariantAnyStore('10')).toBe(false);
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

describe('buildCombinedLemonVariantIdLists', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    process.env = {
      ...originalEnv,
      LEMONSQUEEZY_VARIANT_ID_PREMIUM: '10',
      LEMONSQUEEZY_VARIANT_ID_PREMIUM_YEARLY: '20',
      LEMONSQUEEZY_VARIANT_ID_PREMIUM_USD: '110',
      LEMONSQUEEZY_VARIANT_ID_PREMIUM_YEARLY_USD: '120',
    };
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  it('merges JPY and USD variant IDs', () => {
    const lists = buildCombinedLemonVariantIdLists();
    expect(lists.monthlyVariantIds).toContain('10');
    expect(lists.monthlyVariantIds).toContain('110');
    expect(lists.yearlyVariantIds).toContain('20');
    expect(lists.yearlyVariantIds).toContain('120');
  });
});
