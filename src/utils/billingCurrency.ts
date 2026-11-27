export type BillingCurrency = 'JPY' | 'USD';

interface JapanStripeEligibilityInput {
  country?: string | null;
  billing_currency?: string | null;
  preferred_locale?: string | null;
}

export function isJapanStripeEligible(profile: JapanStripeEligibilityInput): boolean {
  if (profile.billing_currency === 'USD') return false;
  if (profile.billing_currency === 'JPY') return true;
  const country = profile.country?.trim().toUpperCase() ?? null;
  if (country) {
    return country === 'JP' || country === 'JPN' || country === 'JAPAN';
  }
  return profile.preferred_locale !== 'en';
}

export function resolveDisplayBillingCurrency(options: {
  profileBillingCurrency?: BillingCurrency | null;
  isEnglishCopy: boolean;
}): BillingCurrency {
  if (options.profileBillingCurrency === 'USD' || options.profileBillingCurrency === 'JPY') {
    return options.profileBillingCurrency;
  }
  return options.isEnglishCopy ? 'USD' : 'JPY';
}
