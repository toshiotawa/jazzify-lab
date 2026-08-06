import {
  billingAmountForPlanCode,
  billingAmountJpyForPlanCode,
  billingAmountUsdForPlanCode,
  formatBillingAmountLabel,
  formatJpyAmount,
  formatUsdAmount,
} from '@/utils/premiumPricing';

describe('premiumPricing', () => {
  it('maps plan codes to JPY amounts', () => {
    expect(billingAmountJpyForPlanCode('core_monthly')).toBe(3980);
    expect(billingAmountJpyForPlanCode('core_yearly')).toBe(34800);
    expect(billingAmountJpyForPlanCode('unknown')).toBeNull();
  });

  it('maps plan codes to USD amounts', () => {
    expect(billingAmountUsdForPlanCode('core_monthly')).toBe(24.99);
    expect(billingAmountUsdForPlanCode('core_yearly')).toBe(199);
  });

  it('maps plan codes by billing currency', () => {
    expect(billingAmountForPlanCode('core_monthly', 'JPY')).toBe(3980);
    expect(billingAmountForPlanCode('core_monthly', 'USD')).toBe(24.99);
  });

  it('formats JPY amounts', () => {
    expect(formatJpyAmount(34800)).toBe('¥34,800');
  });

  it('formats USD amounts', () => {
    expect(formatUsdAmount(24.99)).toBe('$24.99');
    expect(formatUsdAmount(199)).toBe('$199');
  });

  it('formats billing amount labels', () => {
    expect(formatBillingAmountLabel('core_yearly', 'ja')).toBe('¥34,800 / 年');
    expect(formatBillingAmountLabel('core_monthly', 'en')).toBe('¥3,980 / month');
    expect(formatBillingAmountLabel('core_yearly', 'en', 'USD')).toBe('$199 / year');
    expect(formatBillingAmountLabel('core_monthly', 'en', 'USD')).toBe('$24.99 / month');
  });
});
