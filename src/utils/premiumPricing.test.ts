import {
  billingAmountJpyForPlanCode,
  formatBillingAmountLabel,
  formatJpyAmount,
} from '@/utils/premiumPricing';

describe('premiumPricing', () => {
  it('maps plan codes to JPY amounts', () => {
    expect(billingAmountJpyForPlanCode('core_monthly')).toBe(3980);
    expect(billingAmountJpyForPlanCode('core_yearly')).toBe(34800);
    expect(billingAmountJpyForPlanCode('unknown')).toBeNull();
  });

  it('formats JPY amounts', () => {
    expect(formatJpyAmount(34800)).toBe('¥34,800');
  });

  it('formats billing amount labels', () => {
    expect(formatBillingAmountLabel('core_yearly', 'ja')).toBe('¥34,800 / 年');
    expect(formatBillingAmountLabel('core_monthly', 'en')).toBe('¥3,980 / month');
  });
});
