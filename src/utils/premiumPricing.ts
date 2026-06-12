/**
 * Premium plan JPY pricing (Lemon Squeezy store currency).
 */

export const PREMIUM_PRICING_JPY = {
  monthly: 3980,
  yearly: 34800,
  yearlyPerMonth: 2900,
  yearlySavings: 12960,
} as const;

export function billingAmountJpyForPlanCode(planCode: string): number | null {
  if (planCode === 'core_monthly') return PREMIUM_PRICING_JPY.monthly;
  if (planCode === 'core_yearly') return PREMIUM_PRICING_JPY.yearly;
  return null;
}

export function formatJpyAmount(amount: number): string {
  return `¥${amount.toLocaleString('ja-JP')}`;
}

export function formatBillingAmountLabel(
  planCode: string,
  locale: 'ja' | 'en',
): string | null {
  const amount = billingAmountJpyForPlanCode(planCode);
  if (amount === null) return null;
  const formatted = formatJpyAmount(amount);
  if (planCode === 'core_monthly') {
    return locale === 'en' ? `${formatted} / month` : `${formatted} / 月`;
  }
  if (planCode === 'core_yearly') {
    return locale === 'en' ? `${formatted} / year` : `${formatted} / 年`;
  }
  return null;
}

export function planIntervalLabel(
  planCode: string,
  locale: 'ja' | 'en',
): string {
  if (planCode === 'core_yearly') {
    return locale === 'en' ? 'yearly' : '年額';
  }
  return locale === 'en' ? 'monthly' : '月額';
}
