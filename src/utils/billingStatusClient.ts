import type { PaymentIssueBannerVariant } from '@/utils/paymentIssueBanner';
import { resolvePaymentIssueBanner } from '@/utils/paymentIssueBanner';
import { deriveBillingCapabilities } from '../../netlify/functions/lib/lemonSubscriptionGuard';
import { billingAmountJpyForPlanCode } from '@/utils/premiumPricing';

export interface BillingStatusPayload {
  provider: string;
  status: string;
  entitlement_state: string;
  plan_code: string;
  trial_used: boolean;
  trial_used_at: string | null;
  current_period_ends_at: string | null;
  pending_plan_code: string | null;
  pending_plan_effective_at: string | null;
  next_billing_amount_jpy: number | null;
  can_change_plan: boolean;
  can_resume: boolean;
  can_manage_payment: boolean;
  can_cancel_pending_plan_change: boolean;
}

let cache: { payload: BillingStatusPayload; fetchedAt: number } | null = null;
const CACHE_MS = 45_000;

export function clearBillingStatusCache(): void {
  cache = null;
}

function nextBillingAmountJpy(planCode: string, pendingPlanCode: string | null): number | null {
  const effectivePlanCode = pendingPlanCode ?? planCode;
  return billingAmountJpyForPlanCode(effectivePlanCode);
}

/** billing-status 未デプロイ時など can_* が欠けるレスポンスを正規化する */
export function normalizeBillingStatusPayload(
  raw: Partial<BillingStatusPayload> & Pick<BillingStatusPayload, 'provider' | 'entitlement_state' | 'status'>,
): BillingStatusPayload {
  const pendingPlanCode = raw.pending_plan_code ?? null;
  const derived = deriveBillingCapabilities(
    raw.provider,
    raw.entitlement_state,
    raw.status,
    pendingPlanCode,
  );
  const planCode = raw.plan_code ?? 'unknown';
  return {
    provider: raw.provider,
    status: raw.status,
    entitlement_state: raw.entitlement_state,
    plan_code: planCode,
    trial_used: raw.trial_used ?? false,
    trial_used_at: raw.trial_used_at ?? null,
    current_period_ends_at: raw.current_period_ends_at ?? null,
    pending_plan_code: pendingPlanCode,
    pending_plan_effective_at: raw.pending_plan_effective_at ?? null,
    next_billing_amount_jpy: raw.next_billing_amount_jpy
      ?? nextBillingAmountJpy(planCode, pendingPlanCode),
    can_change_plan: raw.can_change_plan ?? derived.can_change_plan,
    can_resume: raw.can_resume ?? derived.can_resume,
    can_manage_payment: raw.can_manage_payment ?? derived.can_manage_payment,
    can_cancel_pending_plan_change: raw.can_cancel_pending_plan_change
      ?? derived.can_cancel_pending_plan_change,
  };
}

export async function fetchBillingStatusPayload(
  accessToken: string | null,
): Promise<BillingStatusPayload | null> {
  if (!accessToken) {
    return null;
  }
  if (cache && Date.now() - cache.fetchedAt < CACHE_MS) {
    return cache.payload;
  }
  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
  if (!supabaseUrl) {
    return null;
  }
  const res = await fetch(`${supabaseUrl}/functions/v1/billing-status`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (!res.ok) {
    return null;
  }
  const raw = (await res.json()) as Partial<BillingStatusPayload>;
  if (typeof raw.provider !== 'string' || typeof raw.entitlement_state !== 'string' || typeof raw.status !== 'string') {
    return null;
  }
  const payload = normalizeBillingStatusPayload({
    provider: raw.provider,
    status: raw.status,
    entitlement_state: raw.entitlement_state,
    plan_code: raw.plan_code,
    trial_used: raw.trial_used,
    trial_used_at: raw.trial_used_at,
    current_period_ends_at: raw.current_period_ends_at,
    pending_plan_code: raw.pending_plan_code,
    pending_plan_effective_at: raw.pending_plan_effective_at,
    next_billing_amount_jpy: raw.next_billing_amount_jpy,
    can_change_plan: raw.can_change_plan,
    can_resume: raw.can_resume,
    can_manage_payment: raw.can_manage_payment,
    can_cancel_pending_plan_change: raw.can_cancel_pending_plan_change,
  });
  cache = { payload, fetchedAt: Date.now() };
  return payload;
}

export function bannerVariantFromPayload(
  payload: BillingStatusPayload | null,
): PaymentIssueBannerVariant | null {
  if (!payload) {
    return null;
  }
  return resolvePaymentIssueBanner(payload.provider, payload.entitlement_state);
}
