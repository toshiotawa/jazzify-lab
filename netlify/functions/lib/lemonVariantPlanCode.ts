import {
  buildLemonVariantIdLists as buildCatalogVariantIdLists,
  planCodeForVariantId,
  readLemonPlanCatalogFromProcessEnv,
  type LemonPlanCatalogEnv,
} from './lemonPlanCatalog';

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

export function buildLemonVariantIdLists(env: LemonPlanCatalogEnv): {
  yearlyVariantIds: string[];
  monthlyVariantIds: string[];
} {
  const lists = buildCatalogVariantIdLists(env);
  return {
    yearlyVariantIds: lists.yearlyVariantIds,
    monthlyVariantIds: lists.monthlyVariantIds,
  };
}

export { planCodeForVariantId, readLemonPlanCatalogFromProcessEnv };
