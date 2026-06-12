/**
 * Lemon Squeezy variant カタログ。4 variant（trial/no-trial × 月/年）を env から解決する。
 */

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

export function readLemonPlanCatalogFromProcessEnv(): LemonPlanCatalogEnv {
  return {
    premium: process.env.LEMONSQUEEZY_VARIANT_ID_PREMIUM,
    premiumTrial: process.env.LEMONSQUEEZY_VARIANT_ID_PREMIUM_TRIAL,
    premiumYearly: process.env.LEMONSQUEEZY_VARIANT_ID_PREMIUM_YEARLY,
    premiumYearlyTrial: process.env.LEMONSQUEEZY_VARIANT_ID_PREMIUM_YEARLY_TRIAL,
    standardGlobal: process.env.LEMONSQUEEZY_VARIANT_ID_STANDARD_GLOBAL,
    standardGlobalTrial: process.env.LEMONSQUEEZY_VARIANT_ID_STANDARD_GLOBAL_TRIAL,
  };
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

export function resolveCheckoutVariants(
  trialEligible: boolean,
  env: LemonPlanCatalogEnv = readLemonPlanCatalogFromProcessEnv(),
): CheckoutVariantPair {
  if (trialEligible) {
    const monthlyVariantId = env.premiumTrial || env.standardGlobalTrial || '';
    const yearlyVariantId = env.premiumYearlyTrial || '';
    if (!monthlyVariantId && !yearlyVariantId) {
      throw new Error(
        'Missing trial variant env: LEMONSQUEEZY_VARIANT_ID_PREMIUM_TRIAL or LEMONSQUEEZY_VARIANT_ID_PREMIUM_YEARLY_TRIAL',
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
    throw new Error('Missing environment variable: LEMONSQUEEZY_VARIANT_ID_PREMIUM');
  }
  if (!yearlyVariantId) {
    throw new Error('Missing environment variable: LEMONSQUEEZY_VARIANT_ID_PREMIUM_YEARLY');
  }
  return { monthlyVariantId, yearlyVariantId };
}

export function planCodeForVariantId(
  variantId: string | number | null | undefined,
  env: LemonPlanCatalogEnv = readLemonPlanCatalogFromProcessEnv(),
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

export function noTrialVariantForPlanCode(
  planCode: string,
  env: LemonPlanCatalogEnv = readLemonPlanCatalogFromProcessEnv(),
): string {
  const { noTrialMonthlyVariantId, noTrialYearlyVariantId } = buildLemonVariantIdLists(env);
  if (planCode === 'core_yearly') {
    if (!noTrialYearlyVariantId) {
      throw new Error('Missing environment variable: LEMONSQUEEZY_VARIANT_ID_PREMIUM_YEARLY');
    }
    return noTrialYearlyVariantId;
  }
  if (!noTrialMonthlyVariantId) {
    throw new Error('Missing environment variable: LEMONSQUEEZY_VARIANT_ID_PREMIUM');
  }
  return noTrialMonthlyVariantId;
}

export function isTrialVariant(
  variantId: string | number | null | undefined,
  env: LemonPlanCatalogEnv = readLemonPlanCatalogFromProcessEnv(),
): boolean {
  if (variantId === null || variantId === undefined || variantId === '') {
    return false;
  }
  const { trialVariantIds } = buildLemonVariantIdLists(env);
  return trialVariantIds.includes(String(variantId));
}
