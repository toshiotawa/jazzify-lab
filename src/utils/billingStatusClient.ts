import type { PaymentIssueBannerVariant } from '@/utils/paymentIssueBanner';
import { resolvePaymentIssueBanner } from '@/utils/paymentIssueBanner';

export interface BillingStatusPayload {
  provider: string;
  status: string;
  entitlement_state: string;
  plan_code: string;
  trial_used: boolean;
  trial_used_at: string | null;
  current_period_ends_at: string | null;
  can_change_plan: boolean;
  can_resume: boolean;
  can_manage_payment: boolean;
}

let cache: { payload: BillingStatusPayload; fetchedAt: number } | null = null;
const CACHE_MS = 45_000;

export function clearBillingStatusCache(): void {
  cache = null;
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
  const payload = (await res.json()) as BillingStatusPayload;
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
