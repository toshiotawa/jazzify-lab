export type BillingCurrency = 'JPY' | 'USD';

const JAPAN_COUNTRY_CODES = new Set(['JP', 'JPN', 'JAPAN']);

const isJapanCountryCode = (country: string | null | undefined): boolean | null => {
  const normalized = country?.trim().toUpperCase();
  if (!normalized) return null;
  return JAPAN_COUNTRY_CODES.has(normalized);
};

interface JapanStripeEligibilityInput {
  country?: string | null;
  geoCountry?: string | null;
  billing_currency?: string | null;
  preferred_locale?: string | null;
  isEnglishCopy?: boolean;
}

export function isStripePremiumCheckoutEnabled(
  flagValue: string | undefined = import.meta.env.VITE_ENABLE_STRIPE_PREMIUM_CHECKOUT,
): boolean {
  return flagValue === 'true';
}

export function isJapanStripeEligible(profile: JapanStripeEligibilityInput): boolean {
  if (profile.isEnglishCopy === true) return false;
  if (profile.preferred_locale === 'en') return false;
  if (profile.billing_currency === 'USD') return false;

  const profileCountryIsJapan = isJapanCountryCode(profile.country);
  if (profileCountryIsJapan === false) return false;

  const geoCountryIsJapan =
    profileCountryIsJapan === null ? isJapanCountryCode(profile.geoCountry) : null;
  if (geoCountryIsJapan === false) return false;

  return (
    profileCountryIsJapan === true ||
    geoCountryIsJapan === true ||
    profile.billing_currency === 'JPY' ||
    profile.preferred_locale === 'ja'
  );
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
