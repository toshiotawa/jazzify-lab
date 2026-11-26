import { cancelLemonSubscriptionRequest, resumeLemonSubscription } from '@/utils/lemonBillingClient';
import {
  cancelStripeSubscriptionRequest,
  resumeStripeSubscription,
} from '@/utils/stripeBillingClient';

export type BillingProductTarget = 'premium' | 'coaching';

export async function cancelSubscriptionForProvider(
  provider: string | undefined,
  product: BillingProductTarget = 'premium',
): Promise<{ ok: boolean; error?: string }> {
  if (provider === 'stripe') {
    return cancelStripeSubscriptionRequest(product);
  }
  if (provider === 'lemon' && product === 'premium') {
    return cancelLemonSubscriptionRequest();
  }
  return { ok: false, error: 'Unsupported billing provider' };
}

export async function resumeSubscriptionForProvider(
  provider: string | undefined,
  product: BillingProductTarget = 'premium',
  clearedScheduledCancel?: boolean,
): Promise<{ ok: boolean; clearedScheduledCancel?: boolean; error?: string }> {
  if (provider === 'stripe') {
    return resumeStripeSubscription(product);
  }
  if (provider === 'lemon' && product === 'premium') {
    const result = await resumeLemonSubscription();
    return { ok: result.ok, clearedScheduledCancel, error: result.error };
  }
  return { ok: false, error: 'Unsupported billing provider' };
}