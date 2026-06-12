/**
 * billing_* テーブルへの DB 書き込み（Webhook / backfill 共用）。
 */

import type { SupabaseClient } from '@supabase/supabase-js';
import {
  buildBillingCustomerRow,
  buildBillingSubscriptionRow,
  LEMON_BILLING_PROVIDER,
  type LemonBillingSubscriptionAttrs,
} from './lemonBillingSubscriptionMirror';
import {
  type BillingCustomerUserLink,
  type BillingInvoiceRow,
  type BillingSubscriptionUserLink,
} from './lemonInvoiceMirror';

export async function lookupBillingSubscriptionByProviderId(
  supabase: SupabaseClient,
  providerSubscriptionId: string,
): Promise<BillingSubscriptionUserLink | null> {
  const { data } = await supabase
    .from('billing_subscriptions')
    .select('id, user_id, billing_customer_id')
    .eq('provider', LEMON_BILLING_PROVIDER)
    .eq('provider_subscription_id', providerSubscriptionId)
    .maybeSingle();

  if (!data || typeof data.user_id !== 'string') return null;
  return {
    user_id: data.user_id,
    billing_subscription_id: data.id as number,
    billing_customer_id:
      typeof data.billing_customer_id === 'number' ? data.billing_customer_id : null,
  };
}

export async function lookupBillingCustomerByProviderId(
  supabase: SupabaseClient,
  providerCustomerId: string,
): Promise<BillingCustomerUserLink | null> {
  const { data } = await supabase
    .from('billing_customers')
    .select('id, user_id')
    .eq('provider', LEMON_BILLING_PROVIDER)
    .eq('provider_customer_id', providerCustomerId)
    .maybeSingle();

  if (!data || typeof data.user_id !== 'string') return null;
  return {
    user_id: data.user_id,
    billing_customer_id: data.id as number,
  };
}

export async function upsertBillingCustomer(
  supabase: SupabaseClient,
  row: ReturnType<typeof buildBillingCustomerRow>,
): Promise<number | null> {
  if (!row) return null;

  const { data, error } = await supabase
    .from('billing_customers')
    .upsert(row, { onConflict: 'provider,provider_customer_id' })
    .select('id')
    .single();

  if (error || !data) return null;
  return data.id as number;
}

export async function upsertBillingSubscription(
  supabase: SupabaseClient,
  row: ReturnType<typeof buildBillingSubscriptionRow>,
): Promise<number | null> {
  const { data, error } = await supabase
    .from('billing_subscriptions')
    .upsert(row, { onConflict: 'provider,provider_subscription_id' })
    .select('id')
    .single();

  if (error || !data) return null;
  return data.id as number;
}

export async function upsertBillingHistorySubscription(
  supabase: SupabaseClient,
  userId: string,
  subscriptionId: string,
  attrs: LemonBillingSubscriptionAttrs,
  planCode: string | null,
): Promise<number | null> {
  const customerRow = buildBillingCustomerRow(
    userId,
    attrs.customer_id,
    attrs.user_email ?? null,
  );
  const billingCustomerId = customerRow
    ? await upsertBillingCustomer(supabase, customerRow)
    : null;

  const subscriptionRow = buildBillingSubscriptionRow(
    userId,
    subscriptionId,
    attrs,
    planCode,
    billingCustomerId,
  );
  return upsertBillingSubscription(supabase, subscriptionRow);
}

export async function upsertBillingInvoice(
  supabase: SupabaseClient,
  row: BillingInvoiceRow,
): Promise<boolean> {
  const { error } = await supabase
    .from('billing_invoices')
    .upsert(row, { onConflict: 'provider,provider_invoice_id' });

  return !error;
}

export interface BillingInvoiceListRow {
  id: number;
  provider_invoice_id: string;
  provider_created_at: string | null;
  paid_at: string | null;
  created_at: string;
  status: string | null;
  total: number | null;
  currency: string | null;
  invoice_url: string | null;
  plan_code: string | null;
}

export async function listBillingInvoicesForUser(
  supabase: SupabaseClient,
  userId: string,
  limit = 100,
): Promise<BillingInvoiceListRow[]> {
  const { data, error } = await supabase
    .from('billing_invoices')
    .select(
      'id, provider_invoice_id, provider_created_at, paid_at, created_at, status, total, currency, invoice_url, billing_subscription_id',
    )
    .eq('user_id', userId)
    .eq('provider', LEMON_BILLING_PROVIDER)
    .limit(limit);

  if (error) {
    throw new Error(error.message);
  }
  if (!data) return [];

  const subscriptionIds = [
    ...new Set(
      data
        .map((row) => row.billing_subscription_id)
        .filter((id): id is number => typeof id === 'number'),
    ),
  ];

  const planCodeBySubscriptionId = new Map<number, string>();
  if (subscriptionIds.length > 0) {
    const { data: subs } = await supabase
      .from('billing_subscriptions')
      .select('id, plan_code')
      .in('id', subscriptionIds);
    for (const sub of subs ?? []) {
      if (typeof sub.id === 'number' && typeof sub.plan_code === 'string') {
        planCodeBySubscriptionId.set(sub.id, sub.plan_code);
      }
    }
  }

  return data.map((row) => {
    const billingSubscriptionId =
      typeof row.billing_subscription_id === 'number' ? row.billing_subscription_id : null;
    const planCode =
      billingSubscriptionId !== null
        ? planCodeBySubscriptionId.get(billingSubscriptionId) ?? null
        : null;

    return {
      id: row.id as number,
      provider_invoice_id: String(row.provider_invoice_id),
      provider_created_at:
        typeof row.provider_created_at === 'string' ? row.provider_created_at : null,
      paid_at: typeof row.paid_at === 'string' ? row.paid_at : null,
      created_at: String(row.created_at),
      status: typeof row.status === 'string' ? row.status : null,
      total: typeof row.total === 'number' ? row.total : null,
      currency: typeof row.currency === 'string' ? row.currency : null,
      invoice_url: typeof row.invoice_url === 'string' ? row.invoice_url : null,
      plan_code: planCode,
    };
  });
}

export async function updateBillingInvoiceRefund(
  supabase: SupabaseClient,
  providerInvoiceId: string,
  refundedAmount: number | null,
  status: string | null,
): Promise<void> {
  const updates: Record<string, unknown> = { updated_at: new Date().toISOString() };
  if (refundedAmount !== null) updates.refunded_amount = refundedAmount;
  if (status !== null) updates.status = status;

  await supabase
    .from('billing_invoices')
    .update(updates)
    .eq('provider', LEMON_BILLING_PROVIDER)
    .eq('provider_invoice_id', providerInvoiceId);
}
