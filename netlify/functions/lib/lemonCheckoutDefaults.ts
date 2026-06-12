export type CheckoutCountryCode = 'JP' | 'US';
export type CheckoutLocale = 'ja' | 'en';

const JAPAN_COUNTRY_ALIASES = new Set(['JP', 'JPN', 'JAPAN']);

export const isJapanCountryCode = (value: string | null | undefined): boolean => {
  if (!value) return false;
  const normalized = value.trim().toUpperCase();
  return JAPAN_COUNTRY_ALIASES.has(normalized);
};

export interface ResolveCheckoutDefaultsInput {
  profileCountry: string | null | undefined;
  geoCountry: string | null | undefined;
  preferredLocale: string | null | undefined;
}

export interface CheckoutDefaults {
  country: CheckoutCountryCode;
  locale: CheckoutLocale;
}

export const resolveCheckoutDefaults = (input: ResolveCheckoutDefaultsInput): CheckoutDefaults => {
  if (isJapanCountryCode(input.profileCountry)) {
    return { country: 'JP', locale: 'ja' };
  }

  const profileCountry = input.profileCountry?.trim();
  if (profileCountry) {
    return { country: 'US', locale: 'en' };
  }

  if (isJapanCountryCode(input.geoCountry)) {
    return { country: 'JP', locale: 'ja' };
  }

  const geoCountry = input.geoCountry?.trim();
  if (geoCountry) {
    return { country: 'US', locale: 'en' };
  }

  if (input.preferredLocale?.trim().toLowerCase() === 'ja') {
    return { country: 'JP', locale: 'ja' };
  }

  return { country: 'US', locale: 'en' };
};

export const readGeoCountryFromHeaders = (
  headers: Record<string, string | undefined>,
): string | null => {
  const raw = headers['x-country'] ?? headers['X-Country'];
  if (!raw) return null;
  const trimmed = raw.trim();
  return trimmed ? trimmed.toUpperCase() : null;
};
