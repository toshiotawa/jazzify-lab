export interface SubscriptionUpsertPlanFields {
  plan_code: string;
  pending_plan_code: string | null;
  pending_plan_effective_at: string | null;
}

/**
 * On subscription_updated: keep plan_code when a pending change is scheduled.
 */
export function resolvePlanCodeOnSubscriptionUpdated(
  existingPlanCode: string,
  pendingPlanCode: string | null,
  variantPlanCode: string,
): string {
  if (pendingPlanCode !== null) {
    return existingPlanCode;
  }
  return variantPlanCode;
}

/**
 * On subscription_payment_success: apply variant plan and clear pending state.
 */
export function resolvePlanFieldsOnPaymentSuccess(
  variantPlanCode: string,
): SubscriptionUpsertPlanFields {
  return {
    plan_code: variantPlanCode,
    pending_plan_code: null,
    pending_plan_effective_at: null,
  };
}

export function nextBillingAmountJpy(
  planCode: string,
  pendingPlanCode: string | null,
): number | null {
  if (pendingPlanCode === 'core_monthly') return 3980;
  if (pendingPlanCode === 'core_yearly') return 34800;
  if (planCode === 'core_monthly') return 3980;
  if (planCode === 'core_yearly') return 34800;
  return null;
}
