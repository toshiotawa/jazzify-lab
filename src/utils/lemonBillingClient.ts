/**
 * Lemon 課金 API 呼び出し（フロント用）。
 */

import { useAuthStore } from '@/stores/authStore';

export type BillingLinkPurpose = 'payment_method' | 'billing_history' | 'cancel';

async function authHeaders(): Promise<Record<string, string>> {
  const token = useAuthStore.getState().session?.access_token ?? '';
  return {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${token}`,
  };
}

export async function fetchLemonBillingLink(purpose: BillingLinkPurpose): Promise<string | null> {
  const response = await fetch('/.netlify/functions/lemonsqueezyBillingLink', {
    method: 'POST',
    headers: await authHeaders(),
    body: JSON.stringify({ purpose }),
  });
  if (!response.ok) return null;
  const data = (await response.json()) as { url?: unknown };
  return typeof data.url === 'string' ? data.url : null;
}

export async function changeLemonPlan(target: 'monthly' | 'yearly'): Promise<{ ok: boolean; error?: string }> {
  const response = await fetch('/.netlify/functions/lemonsqueezyChangePlan', {
    method: 'POST',
    headers: await authHeaders(),
    body: JSON.stringify({ target }),
  });
  if (response.ok) return { ok: true };
  const err = (await response.json().catch(() => null)) as { error?: string } | null;
  return { ok: false, error: err?.error ?? 'Failed to change plan' };
}

export async function resumeLemonSubscription(): Promise<{ ok: boolean; error?: string }> {
  const response = await fetch('/.netlify/functions/lemonsqueezyResumeSubscription', {
    method: 'POST',
    headers: await authHeaders(),
  });
  if (response.ok) return { ok: true };
  const err = (await response.json().catch(() => null)) as { error?: string } | null;
  return { ok: false, error: err?.error ?? 'Failed to resume subscription' };
}
