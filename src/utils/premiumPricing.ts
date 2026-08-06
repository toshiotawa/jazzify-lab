/**
 * Premium plan pricing (Lemon Squeezy store currency).
 */

import type { BillingCurrency } from '@/utils/billingCurrency';

export const PREMIUM_PRICING_JPY = {
  monthly: 3980,
  yearly: 34800,
  yearlyPerMonth: 2900,
  yearlySavings: 12960,
} as const;

export const PREMIUM_PRICING_USD = {
  monthly: 24.99,
  yearly: 199,
  yearlyPerMonth: 16.58,
  yearlySavings: 100.88,
} as const;

export function billingAmountJpyForPlanCode(planCode: string): number | null {
  if (planCode === 'core_monthly') return PREMIUM_PRICING_JPY.monthly;
  if (planCode === 'core_yearly') return PREMIUM_PRICING_JPY.yearly;
  return null;
}

export function billingAmountUsdForPlanCode(planCode: string): number | null {
  if (planCode === 'core_monthly') return PREMIUM_PRICING_USD.monthly;
  if (planCode === 'core_yearly') return PREMIUM_PRICING_USD.yearly;
  return null;
}

export function billingAmountForPlanCode(
  planCode: string,
  currency: BillingCurrency,
): number | null {
  return currency === 'USD'
    ? billingAmountUsdForPlanCode(planCode)
    : billingAmountJpyForPlanCode(planCode);
}

export function formatJpyAmount(amount: number): string {
  return `¥${amount.toLocaleString('ja-JP')}`;
}

export function formatUsdAmount(amount: number): string {
  const hasFraction = Math.abs(amount % 1) > 0.001;
  const formatted = hasFraction
    ? amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
    : amount.toLocaleString('en-US', { maximumFractionDigits: 0 });
  return `$${formatted}`;
}

export function formatAmountForCurrency(amount: number, currency: BillingCurrency): string {
  return currency === 'USD' ? formatUsdAmount(amount) : formatJpyAmount(amount);
}

export function formatBillingAmountLabel(
  planCode: string,
  locale: 'ja' | 'en',
  currency: BillingCurrency = 'JPY',
): string | null {
  const amount = billingAmountForPlanCode(planCode, currency);
  if (amount === null) return null;
  const formatted = formatAmountForCurrency(amount, currency);
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
