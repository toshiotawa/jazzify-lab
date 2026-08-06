/**
 * Lemon Squeezy variant カタログ。JPY / USD ストアの variant を env から解決する。
 */

export type BillingCurrency = 'JPY' | 'USD';

export interface LemonPlanCatalogEnv {
  premium?: string;
  premiumTrial?: string;
  premiumYearly?: string;
  premiumYearlyTrial?: string;
  standardGlobal?: string;
  standardGlobalTrial?: string;
}

export interface CheckoutVariantPair {
  monthlyVariantId: string;
  yearlyVariantId: string;
}

export interface LemonVariantIdLists {
  yearlyVariantIds: string[];
  monthlyVariantIds: string[];
  trialVariantIds: string[];
  noTrialMonthlyVariantId: string;
  noTrialYearlyVariantId: string;
}

export function readLemonPlanCatalogFromProcessEnv(
  currency: BillingCurrency = 'JPY',
): LemonPlanCatalogEnv {
  if (currency === 'USD') {
    return {
      premium: process.env.LEMONSQUEEZY_VARIANT_ID_PREMIUM_USD,
      premiumTrial: process.env.LEMONSQUEEZY_VARIANT_ID_PREMIUM_TRIAL_USD,
      premiumYearly: process.env.LEMONSQUEEZY_VARIANT_ID_PREMIUM_YEARLY_USD,
      premiumYearlyTrial: process.env.LEMONSQUEEZY_VARIANT_ID_PREMIUM_YEARLY_TRIAL_USD,
    };
  }

  return {
    premium: process.env.LEMONSQUEEZY_VARIANT_ID_PREMIUM,
    premiumTrial: process.env.LEMONSQUEEZY_VARIANT_ID_PREMIUM_TRIAL,
    premiumYearly: process.env.LEMONSQUEEZY_VARIANT_ID_PREMIUM_YEARLY,
    premiumYearlyTrial: process.env.LEMONSQUEEZY_VARIANT_ID_PREMIUM_YEARLY_TRIAL,
    standardGlobal: process.env.LEMONSQUEEZY_VARIANT_ID_STANDARD_GLOBAL,
    standardGlobalTrial: process.env.LEMONSQUEEZY_VARIANT_ID_STANDARD_GLOBAL_TRIAL,
  };
}

export function readLemonStoreIdFromProcessEnv(currency: BillingCurrency = 'JPY'): string {
  const key = currency === 'USD' ? 'LEMONSQUEEZY_STORE_ID_USD' : 'LEMONSQUEEZY_STORE_ID';
  const val = process.env[key];
  if (!val) {
    throw new Error(`Missing environment variable: ${key}`);
  }
  return val;
}

export function deriveBillingCurrencyFromLocale(
  preferredLocale: string | null | undefined,
): BillingCurrency {
  return preferredLocale === 'en' ? 'USD' : 'JPY';
}

export function resolveProfileBillingCurrency(profile: {
  billing_currency?: string | null;
  preferred_locale?: string | null;
}): BillingCurrency {
  if (profile.billing_currency === 'USD' || profile.billing_currency === 'JPY') {
    return profile.billing_currency;
  }
  return deriveBillingCurrencyFromLocale(profile.preferred_locale);
}

export function buildLemonVariantIdLists(env: LemonPlanCatalogEnv): LemonVariantIdLists {
  const noTrialMonthlyVariantId =
    env.premium || env.standardGlobal || '';
  const noTrialYearlyVariantId = env.premiumYearly || '';

  const monthlyVariantIds = [
    env.premium,
    env.premiumTrial,
    env.standardGlobal,
    env.standardGlobalTrial,
  ].filter((v): v is string => Boolean(v));

  const yearlyVariantIds = [
    env.premiumYearly,
    env.premiumYearlyTrial,
  ].filter((v): v is string => Boolean(v));

  const trialVariantIds = [
    env.premiumTrial,
    env.premiumYearlyTrial,
    env.standardGlobalTrial,
  ].filter((v): v is string => Boolean(v));

  return {
    yearlyVariantIds,
    monthlyVariantIds,
    trialVariantIds,
    noTrialMonthlyVariantId,
    noTrialYearlyVariantId,
  };
}

const dedupeIds = (ids: string[]): string[] => [...new Set(ids)];

export function buildCombinedLemonVariantIdLists(): LemonVariantIdLists {
  const jpyLists = buildLemonVariantIdLists(readLemonPlanCatalogFromProcessEnv('JPY'));
  const usdLists = buildLemonVariantIdLists(readLemonPlanCatalogFromProcessEnv('USD'));

  return {
    yearlyVariantIds: dedupeIds([...jpyLists.yearlyVariantIds, ...usdLists.yearlyVariantIds]),
    monthlyVariantIds: dedupeIds([...jpyLists.monthlyVariantIds, ...usdLists.monthlyVariantIds]),
    trialVariantIds: dedupeIds([...jpyLists.trialVariantIds, ...usdLists.trialVariantIds]),
    noTrialMonthlyVariantId: jpyLists.noTrialMonthlyVariantId,
    noTrialYearlyVariantId: jpyLists.noTrialYearlyVariantId,
  };
}

export function currencyForVariantId(
  variantId: string | number | null | undefined,
): BillingCurrency | null {
  if (variantId === null || variantId === undefined || variantId === '') {
    return null;
  }
  const id = String(variantId);
  const jpyLists = buildLemonVariantIdLists(readLemonPlanCatalogFromProcessEnv('JPY'));
  const usdLists = buildLemonVariantIdLists(readLemonPlanCatalogFromProcessEnv('USD'));
  const jpyIds = [...jpyLists.monthlyVariantIds, ...jpyLists.yearlyVariantIds];
  const usdIds = [...usdLists.monthlyVariantIds, ...usdLists.yearlyVariantIds];
  if (jpyIds.includes(id)) {
    return 'JPY';
  }
  if (usdIds.includes(id)) {
    return 'USD';
  }
  return null;
}

export function resolveCheckoutVariants(
  trialEligible: boolean,
  currency: BillingCurrency = 'JPY',
  env: LemonPlanCatalogEnv = readLemonPlanCatalogFromProcessEnv(currency),
): CheckoutVariantPair {
  if (trialEligible) {
    const monthlyVariantId = env.premiumTrial || env.standardGlobalTrial || '';
    const yearlyVariantId = env.premiumYearlyTrial || '';
    if (!monthlyVariantId && !yearlyVariantId) {
      throw new Error(
        currency === 'USD'
          ? 'Missing trial variant env: LEMONSQUEEZY_VARIANT_ID_PREMIUM_TRIAL_USD or LEMONSQUEEZY_VARIANT_ID_PREMIUM_YEARLY_TRIAL_USD'
          : 'Missing trial variant env: LEMONSQUEEZY_VARIANT_ID_PREMIUM_TRIAL or LEMONSQUEEZY_VARIANT_ID_PREMIUM_YEARLY_TRIAL',
      );
    }
    if (!monthlyVariantId || !yearlyVariantId) {
      throw new Error('Both monthly and yearly trial variant IDs are required for checkout');
    }
    return { monthlyVariantId, yearlyVariantId };
  }

  const monthlyVariantId = env.premium || env.standardGlobal || '';
  const yearlyVariantId = env.premiumYearly || '';
  if (!monthlyVariantId) {
    throw new Error(
      currency === 'USD'
        ? 'Missing environment variable: LEMONSQUEEZY_VARIANT_ID_PREMIUM_USD'
        : 'Missing environment variable: LEMONSQUEEZY_VARIANT_ID_PREMIUM',
    );
  }
  if (!yearlyVariantId) {
    throw new Error(
      currency === 'USD'
        ? 'Missing environment variable: LEMONSQUEEZY_VARIANT_ID_PREMIUM_YEARLY_USD'
        : 'Missing environment variable: LEMONSQUEEZY_VARIANT_ID_PREMIUM_YEARLY',
    );
  }
  return { monthlyVariantId, yearlyVariantId };
}

export function planCodeForVariantId(
  variantId: string | number | null | undefined,
  env: LemonPlanCatalogEnv = readLemonPlanCatalogFromProcessEnv('JPY'),
): string | null {
  if (variantId === null || variantId === undefined || variantId === '') {
    return null;
  }
  const id = String(variantId);
  const { yearlyVariantIds, monthlyVariantIds } = buildLemonVariantIdLists(env);
  if (yearlyVariantIds.includes(id)) {
    return 'core_yearly';
  }
  if (monthlyVariantIds.includes(id)) {
    return 'core_monthly';
  }
  return null;
}

export function planCodeForVariantIdAnyStore(
  variantId: string | number | null | undefined,
): string | null {
  return planCodeForVariantId(variantId, readLemonPlanCatalogFromProcessEnv('JPY'))
    ?? planCodeForVariantId(variantId, readLemonPlanCatalogFromProcessEnv('USD'));
}

export function noTrialVariantForPlanCode(
  planCode: string,
  currency: BillingCurrency = 'JPY',
  env: LemonPlanCatalogEnv = readLemonPlanCatalogFromProcessEnv(currency),
): string {
  const { noTrialMonthlyVariantId, noTrialYearlyVariantId } = buildLemonVariantIdLists(env);
  if (planCode === 'core_yearly') {
    if (!noTrialYearlyVariantId) {
      throw new Error(
        currency === 'USD'
          ? 'Missing environment variable: LEMONSQUEEZY_VARIANT_ID_PREMIUM_YEARLY_USD'
          : 'Missing environment variable: LEMONSQUEEZY_VARIANT_ID_PREMIUM_YEARLY',
      );
    }
    return noTrialYearlyVariantId;
  }
  if (!noTrialMonthlyVariantId) {
    throw new Error(
      currency === 'USD'
        ? 'Missing environment variable: LEMONSQUEEZY_VARIANT_ID_PREMIUM_USD'
        : 'Missing environment variable: LEMONSQUEEZY_VARIANT_ID_PREMIUM',
    );
  }
  return noTrialMonthlyVariantId;
}

export function isTrialVariant(
  variantId: string | number | null | undefined,
  env: LemonPlanCatalogEnv = readLemonPlanCatalogFromProcessEnv('JPY'),
): boolean {
  if (variantId === null || variantId === undefined || variantId === '') {
    return false;
  }
  const { trialVariantIds } = buildLemonVariantIdLists(env);
  return trialVariantIds.includes(String(variantId));
}

export function isTrialVariantAnyStore(
  variantId: string | number | null | undefined,
): boolean {
  return isTrialVariant(variantId, readLemonPlanCatalogFromProcessEnv('JPY'))
    || isTrialVariant(variantId, readLemonPlanCatalogFromProcessEnv('USD'));
}
