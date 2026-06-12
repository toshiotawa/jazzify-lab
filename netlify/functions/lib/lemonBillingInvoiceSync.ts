/**
 * billing_invoices が空のとき Lemon API から同期する（表示時フォールバック / バックフィル共用）。
 */

import type { SupabaseClient } from '@supabase/supabase-js';
import {
  buildLemonVariantIdLists,
  planCodeForLemonVariant,
} from './lemonVariantPlanCode';
import {
  buildBillingInvoiceRow,
  mergeInvoiceAttrs,
  resolveInvoiceUserId,
} from './lemonInvoiceMirror';
import {
  lookupBillingCustomerByProviderId,
  lookupBillingSubscriptionByProviderId,
  upsertBillingHistorySubscription,
  upsertBillingInvoice,
} from './lemonBillingPersistence';
import {
  fetchLemonSubscription,
  fetchLemonSubscriptionInvoices,
} from './lemonNetlifyCommon';

const getVariantIdLists = () =>
  buildLemonVariantIdLists({
    premium: process.env.LEMONSQUEEZY_VARIANT_ID_PREMIUM,
    premiumTrial: process.env.LEMONSQUEEZY_VARIANT_ID_PREMIUM_TRIAL,
    premiumYearly: process.env.LEMONSQUEEZY_VARIANT_ID_PREMIUM_YEARLY,
    premiumYearlyTrial: process.env.LEMONSQUEEZY_VARIANT_ID_PREMIUM_YEARLY_TRIAL,
    standardGlobal: process.env.LEMONSQUEEZY_VARIANT_ID_STANDARD_GLOBAL,
    standardGlobalTrial: process.env.LEMONSQUEEZY_VARIANT_ID_STANDARD_GLOBAL_TRIAL,
  });

export const addSubscriptionId = (ids: Set<string>, value: unknown): void => {
  if (value === null || value === undefined || value === '') return;
  ids.add(String(value));
};

export async function collectProviderSubscriptionIdsForUser(
  supabase: SupabaseClient,
  userId: string,
): Promise<Set<string>> {
  const ids = new Set<string>();

  const { data: billingSubs } = await supabase
    .from('billing_subscriptions')
    .select('provider_subscription_id')
    .eq('user_id', userId)
    .eq('provider', 'lemon');

  for (const row of billingSubs ?? []) {
    addSubscriptionId(ids, row.provider_subscription_id);
  }

  const { data: subscriptionRow } = await supabase
    .from('subscriptions')
    .select('provider_subscription_id')
    .eq('user_id', userId)
    .eq('provider', 'lemon')
    .maybeSingle();

  addSubscriptionId(ids, subscriptionRow?.provider_subscription_id);

  const { data: profileRow } = await supabase
    .from('profiles')
    .select('lemon_subscription_id')
    .eq('id', userId)
    .maybeSingle();

  addSubscriptionId(ids, profileRow?.lemon_subscription_id);

  const { data: events } = await supabase
    .from('subscription_events')
    .select('payload')
    .eq('user_id', userId)
    .eq('provider', 'lemon')
    .limit(2000);

  for (const row of events ?? []) {
    const payload = row.payload;
    if (!payload || typeof payload !== 'object') continue;
    const record = payload as Record<string, unknown>;
    const dataObj = record.data;
    if (!dataObj || typeof dataObj !== 'object') continue;
    const dataRecord = dataObj as Record<string, unknown>;
    addSubscriptionId(ids, dataRecord.id);
    const attrs = dataRecord.attributes;
    if (attrs && typeof attrs === 'object') {
      addSubscriptionId(ids, (attrs as Record<string, unknown>).subscription_id);
    }
  }

  return ids;
}

export interface SyncUserBillingInvoicesResult {
  synced: number;
  skipped: number;
  subscriptionIds: number;
}

export async function syncUserBillingInvoicesFromLemon(
  supabase: SupabaseClient,
  userId: string,
): Promise<SyncUserBillingInvoicesResult> {
  const subscriptionIds = await collectProviderSubscriptionIdsForUser(supabase, userId);
  let synced = 0;
  let skipped = 0;

  const { yearlyVariantIds, monthlyVariantIds } = getVariantIdLists();

  for (const subscriptionId of subscriptionIds) {
    const lemonSub = await fetchLemonSubscription(subscriptionId);
    if (!lemonSub) continue;

    const customerId = lemonSub.data.attributes.customer_id;
    const providerCustomerId =
      customerId !== null && customerId !== undefined ? String(customerId) : '';

    const planCode = planCodeForLemonVariant(
      lemonSub.data.attributes.variant_id,
      yearlyVariantIds,
      monthlyVariantIds,
    );

    await upsertBillingHistorySubscription(
      supabase,
      userId,
      subscriptionId,
      {
        status: lemonSub.data.attributes.status ?? null,
        cancelled: lemonSub.data.attributes.cancelled ?? null,
        variant_id: lemonSub.data.attributes.variant_id ?? null,
        customer_id: lemonSub.data.attributes.customer_id ?? null,
        product_id: null,
        renews_at: lemonSub.data.attributes.renews_at ?? null,
        ends_at: lemonSub.data.attributes.ends_at ?? null,
        created_at: null,
        updated_at: lemonSub.data.attributes.updated_at ?? null,
        user_email: null,
      },
      planCode,
    );

    const invoices = await fetchLemonSubscriptionInvoices(subscriptionId);
    if (!invoices) continue;

    const billingSubscriptionLink = await lookupBillingSubscriptionByProviderId(
      supabase,
      subscriptionId,
    );
    const billingCustomerLink = providerCustomerId
      ? await lookupBillingCustomerByProviderId(supabase, providerCustomerId)
      : null;

    for (const invoice of invoices) {
      const resolution = resolveInvoiceUserId({
        providerSubscriptionId: subscriptionId,
        providerCustomerId,
        billingSubscriptionLink,
        billingCustomerLink,
        lazySubscriptionUserId: userId,
      });

      if (resolution.kind === 'failed') {
        skipped += 1;
        continue;
      }

      const merged = mergeInvoiceAttrs(
        {
          subscription_id: invoice.subscription_id,
          customer_id: invoice.customer_id,
          billing_reason: invoice.billing_reason,
          status: invoice.status,
          status_formatted: invoice.status_formatted,
          currency: invoice.currency,
          total: invoice.total,
          subtotal: invoice.subtotal,
          tax: invoice.tax,
          refunded_amount: invoice.refunded_amount,
          created_at: invoice.created_at,
          updated_at: invoice.updated_at,
          paid_at: invoice.paid_at,
          urls: { invoice_url: invoice.invoice_url },
          total_formatted: invoice.total_formatted,
        },
        {
          subscription_id: subscriptionId,
          customer_id: providerCustomerId,
        },
      );

      const invoiceRow = buildBillingInvoiceRow(
        invoice.id,
        resolution.userId,
        merged,
        resolution.billingSubscriptionId ?? billingSubscriptionLink?.billing_subscription_id ?? null,
        resolution.billingCustomerId ?? billingCustomerLink?.billing_customer_id ?? null,
      );

      if (!invoiceRow) {
        skipped += 1;
        continue;
      }

      const saved = await upsertBillingInvoice(supabase, invoiceRow);
      if (saved) {
        synced += 1;
      } else {
        skipped += 1;
      }
    }
  }

  return { synced, skipped, subscriptionIds: subscriptionIds.size };
}
