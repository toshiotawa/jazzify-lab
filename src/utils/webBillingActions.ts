import {
  cancelLemonSubscriptionRequest,
  resumeLemonSubscription,
} from '@/utils/lemonBillingClient';
import {
  cancelStripeSubscriptionRequest,
  resumeStripeSubscription,
} from '@/utils/stripeBillingClient';

type BillingProductTarget = 'premium' | 'coaching';

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
): Promise<{ ok: boolean; clearedScheduledCancel?: boolean; error?: string }> {
  if (provider === 'stripe') {
    return resumeStripeSubscription(product);
  }
  if (provider === 'lemon' && product === 'premium') {
    return resumeLemonSubscription();
  }
  return { ok: false, error: 'Unsupported billing provider' };
}
