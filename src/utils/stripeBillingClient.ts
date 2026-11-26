import { useAuthStore } from '@/stores/authStore';

export type StripeBillingLinkPurpose = 'payment_method';

async function authHeaders(): Promise<Record<string, string>> {
  const token = useAuthStore.getState().session?.access_token ?? '';

  return {
    'Content-Type': 'application/json',

    Authorization: `Bearer ${token}`,
  };
}

export async function fetchStripeBillingLink(
  purpose: StripeBillingLinkPurpose,
): Promise<string | null> {
  const response = await fetch('/.netlify/functions/createPortalSession', {
    method: 'POST',

    headers: await authHeaders(),

    body: JSON.stringify({ purpose }),
  });

  if (!response.ok) return null;

  const data = (await response.json()) as { url?: unknown };

  return typeof data.url === 'string' ? data.url : null;
}

export async function changeStripePlan(
  target: 'monthly' | 'yearly',
): Promise<{ ok: boolean; error?: string }> {
  const response = await fetch('/.netlify/functions/stripeChangePlan', {
    method: 'POST',

    headers: await authHeaders(),

    body: JSON.stringify({ target }),
  });

  if (response.ok) return { ok: true };

  const err = (await response.json().catch(() => null)) as { error?: string } | null;

  return { ok: false, error: err?.error ?? 'Failed to change plan' };
}

export async function resumeStripeSubscription(): Promise<{
  ok: boolean;

  clearedScheduledCancel?: boolean;

  error?: string;
}> {
  const response = await fetch('/.netlify/functions/stripeResumeSubscription', {
    method: 'POST',

    headers: await authHeaders(),
  });

  if (response.ok) {
    const data = (await response.json().catch(() => null)) as {
      cleared_scheduled_cancel?: unknown;
    } | null;

    return {
      ok: true,

      clearedScheduledCancel: data?.cleared_scheduled_cancel === true,
    };
  }

  const err = (await response.json().catch(() => null)) as { error?: string } | null;

  return { ok: false, error: err?.error ?? 'Failed to resume subscription' };
}

export async function cancelStripeSubscriptionRequest(): Promise<{ ok: boolean; error?: string }> {
  const response = await fetch('/.netlify/functions/stripeCancelSubscription', {
    method: 'POST',

    headers: await authHeaders(),
  });

  if (response.ok) {
    const data = (await response.json().catch(() => null)) as { scheduled?: unknown } | null;

    if (data?.scheduled !== true) {
      return {
        ok: false,

        error: '解約の予約に失敗しました。しばらくしてから再度お試しください。',
      };
    }

    return { ok: true };
  }

  const err = (await response.json().catch(() => null)) as { error?: string } | null;

  return { ok: false, error: err?.error ?? 'Failed to cancel subscription' };
}

export async function createStripeCheckoutSession(
  product: 'premium' | 'coaching',

  plan: 'monthly' | 'yearly' = 'monthly',
): Promise<{ url: string | null; error?: string }> {
  const response = await fetch('/.netlify/functions/createCheckoutSession', {
    method: 'POST',

    headers: await authHeaders(),

    body: JSON.stringify({ product, plan }),
  });

  const data = (await response.json().catch(() => null)) as {
    url?: unknown;
    error?: string;
  } | null;

  if (!response.ok) {
    return { url: null, error: data?.error ?? 'Failed to create checkout session' };
  }

  return { url: typeof data?.url === 'string' ? data.url : null };
}
