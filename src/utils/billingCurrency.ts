export type BillingCurrency = 'JPY' | 'USD';

export function resolveDisplayBillingCurrency(options: {
  profileBillingCurrency?: BillingCurrency | null;
  isEnglishCopy: boolean;
}): BillingCurrency {
  if (options.profileBillingCurrency === 'USD' || options.profileBillingCurrency === 'JPY') {
    return options.profileBillingCurrency;
  }
  return options.isEnglishCopy ? 'USD' : 'JPY';
}
