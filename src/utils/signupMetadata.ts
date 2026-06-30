import { ISO_COUNTRY_CODES } from '@/constants/countries';

const ISO_COUNTRY_CODE_SET = new Set(ISO_COUNTRY_CODES);

export type SignupPlatform = 'web' | 'ios';

export const normalizeCountryCode = (value: string | null | undefined): string | null => {
  if (!value) {
    return null;
  }
  const trimmed = value.trim();
  if (trimmed.length !== 2) {
    return null;
  }
  const upper = trimmed.toUpperCase();
  return ISO_COUNTRY_CODE_SET.has(upper) ? upper : null;
};

export const resolveWebSignupPlatform = (): SignupPlatform => 'web';

export const resolveWebSignupCountry = (countryHint: string | null | undefined): string | null =>
  normalizeCountryCode(countryHint);
