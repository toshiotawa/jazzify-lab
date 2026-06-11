/**
 * Lemon Squeezy variant_id から plan_code を判定する。
 * Webhook 側の source of truth。custom_data.plan は使わない。
 */
export function planCodeForLemonVariant(
  variantId: string | number | null | undefined,
  yearlyVariantIds: readonly string[],
  monthlyVariantIds: readonly string[],
): string | null {
  if (variantId === null || variantId === undefined || variantId === '') {
    return null;
  }
  const id = String(variantId);
  if (yearlyVariantIds.includes(id)) {
    return 'core_yearly';
  }
  if (monthlyVariantIds.includes(id)) {
    return 'core_monthly';
  }
  return null;
}

export function buildLemonVariantIdLists(env: {
  premium?: string;
  premiumTrial?: string;
  premiumYearly?: string;
  premiumYearlyTrial?: string;
  standardGlobal?: string;
  standardGlobalTrial?: string;
}): { yearlyVariantIds: string[]; monthlyVariantIds: string[] } {
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

  return { yearlyVariantIds, monthlyVariantIds };
}
