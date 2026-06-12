/**
 * Lemon 課金 API 呼び出し（フロント用）。
 */

import { useAuthStore } from '@/stores/authStore';

export type BillingLinkPurpose = 'payment_method';

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

export async function cancelPendingLemonPlanChange(): Promise<{ ok: boolean; error?: string }> {
  const response = await fetch('/.netlify/functions/lemonsqueezyCancelPendingPlanChange', {
    method: 'POST',
    headers: await authHeaders(),
  });
  if (response.ok) return { ok: true };
  const err = (await response.json().catch(() => null)) as { error?: string } | null;
  return { ok: false, error: err?.error ?? 'Failed to cancel pending plan change' };
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

export async function resumeLemonSubscription(): Promise<{
  ok: boolean;
  clearedScheduledCancel?: boolean;
  error?: string;
}> {
  const response = await fetch('/.netlify/functions/lemonsqueezyResumeSubscription', {
    method: 'POST',
    headers: await authHeaders(),
  });
  if (response.ok) {
    const data = (await response.json().catch(() => null)) as { cleared_scheduled_cancel?: unknown } | null;
    return {
      ok: true,
      clearedScheduledCancel: data?.cleared_scheduled_cancel === true,
    };
  }
  const err = (await response.json().catch(() => null)) as { error?: string } | null;
  return { ok: false, error: err?.error ?? 'Failed to resume subscription' };
}

function isScheduledCancelResponse(value: unknown): value is { scheduled: true } {
  return typeof value === 'object' && value !== null && (value as { scheduled?: unknown }).scheduled === true;
}

export async function cancelLemonSubscriptionRequest(): Promise<{ ok: boolean; error?: string }> {
  const response = await fetch('/.netlify/functions/lemonsqueezyCancelSubscription', {
    method: 'POST',
    headers: await authHeaders(),
  });
  if (response.ok) {
    const data: unknown = await response.json().catch(() => null);
    if (!isScheduledCancelResponse(data)) {
      return {
        ok: false,
        error: '解約の予約に失敗しました。課金APIが未更新の可能性があります。しばらくしてから再度お試しください。',
      };
    }
    return { ok: true };
  }
  const err = (await response.json().catch(() => null)) as { error?: string } | null;
  return { ok: false, error: err?.error ?? 'Failed to cancel subscription' };
}

export interface LemonInvoiceItem {
  id: string;
  created_at: string | null;
  status: string | null;
  status_formatted: string | null;
  total_formatted: string | null;
  invoice_url: string | null;
  plan_code: string | null;
}

function isNullableString(value: unknown): value is string | null {
  return value === null || typeof value === 'string';
}

function isLemonInvoiceItem(value: unknown): value is LemonInvoiceItem {
  if (typeof value !== 'object' || value === null) return false;
  if (!('id' in value) || typeof value.id !== 'string') return false;
  if (!('created_at' in value) || !isNullableString(value.created_at)) return false;
  if (!('status' in value) || !isNullableString(value.status)) return false;
  if (!('status_formatted' in value) || !isNullableString(value.status_formatted)) return false;
  if (!('total_formatted' in value) || !isNullableString(value.total_formatted)) return false;
  if (!('invoice_url' in value) || !isNullableString(value.invoice_url)) return false;
  if (!('plan_code' in value) || !isNullableString(value.plan_code)) return false;
  return true;
}

export async function fetchLemonInvoices(): Promise<LemonInvoiceItem[] | null> {
  const response = await fetch('/.netlify/functions/lemonsqueezyInvoices', {
    method: 'POST',
    headers: await authHeaders(),
  });
  if (!response.ok) return null;
  const data = (await response.json().catch(() => null)) as { invoices?: unknown } | null;
  if (!data || !Array.isArray(data.invoices)) return null;
  if (!data.invoices.every(isLemonInvoiceItem)) return null;
  return data.invoices;
}
